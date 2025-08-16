import { RealtimeClient } from './openai-realtime-client';

export class OpenAIRealtimeSession {
  private client: RealtimeClient;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioWorklet: AudioWorkletNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private isPlaying = false;
  private sessionId: string;
  private onTranscript?: (text: string, isFinal: boolean) => void;
  private onResponse?: (text: string) => void;
  private onToolCall?: (tool: string, args: any) => Promise<any>;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.client = new RealtimeClient({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Handle transcription updates
    this.client.on('conversation.item.input_audio_transcription.completed', (event) => {
      console.log('Transcription completed:', event);
      if (this.onTranscript && event.transcript) {
        this.onTranscript(event.transcript, true);
      }
    });

    // Handle partial transcription
    this.client.on('conversation.item.input_audio_transcription.partial', (event) => {
      console.log('Partial transcription:', event);
      if (this.onTranscript && event.transcript) {
        this.onTranscript(event.transcript, false);
      }
    });

    // Handle assistant text responses
    this.client.on('response.text.delta', (event) => {
      console.log('Text response delta:', event);
      if (this.onResponse && event.delta) {
        this.onResponse(event.delta);
      }
    });

    // Handle completed text responses
    this.client.on('response.text.done', (event) => {
      console.log('Text response done:', event);
      if (this.onResponse && event.text) {
        this.onResponse(event.text);
      }
    });

    // Handle audio responses
    this.client.on('response.audio.delta', (event) => {
      console.log('Audio response delta received');
      if (event.delta) {
        this.playAudio(event.delta);
      }
    });

    // Handle tool calls
    this.client.on('response.function_call_arguments.done', async (event) => {
      console.log('Tool call done:', event);
      if (this.onToolCall && event.name) {
        try {
          const args = JSON.parse(event.arguments || '{}');
          const result = await this.onToolCall(event.name, args);
          
          // Send tool result back
          await this.client.submitToolOutput(event.call_id, result);
        } catch (error) {
          console.error('Tool call error:', error);
          // Send error result
          await this.client.submitToolOutput(event.call_id, {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    });

    // Handle errors
    this.client.on('error', (error) => {
      console.error('OpenAI Realtime error:', error);
    });

    // Handle connection status
    this.client.on('connection.open', () => {
      console.log('Connection opened');
    });

    this.client.on('connection.close', () => {
      console.log('Connection closed');
    });

    // Handle session updates
    this.client.on('session.updated', (event) => {
      console.log('Session updated:', event);
    });

    // Handle response creation
    this.client.on('response.created', (event) => {
      console.log('Response created:', event);
    });

    // Handle response completion
    this.client.on('response.done', (event) => {
      console.log('Response done:', event);
    });
  }

  async connect(config: {
    instructions: string;
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
    temperature: number;
    tools?: Array<{
      name: string;
      description: string;
      parameters: any;
    }>;
    onTranscript?: (text: string, isFinal: boolean) => void;
    onResponse?: (text: string) => void;
    onToolCall?: (tool: string, args: any) => Promise<any>;
  }) {
    this.onTranscript = config.onTranscript;
    this.onResponse = config.onResponse;
    this.onToolCall = config.onToolCall;

    console.log('Connecting to OpenAI Realtime...');
    
    // Connect to OpenAI first
    await this.client.connect();
    console.log('Connected to OpenAI');

    // Update session configuration
    await this.client.updateSession({
      instructions: config.instructions,
      voice: config.voice,
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      input_audio_transcription: {
        model: 'whisper-1',
      },
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
      },
      tools: config.tools?.map(tool => ({
        type: 'function' as const,
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      })) || [],
      tool_choice: 'auto',
      temperature: config.temperature,
      max_response_output_tokens: 4096,
    });

    console.log('Session updated, starting audio capture...');

    // Start audio capture
    await this.startAudioCapture();
  }

  private async startAudioCapture() {
    try {
      console.log('Requesting microphone access...');
      
      // Get user media with proper constraints
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log('Microphone access granted');

      // Create audio context at 24kHz
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });

      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Use AudioWorklet if available, fallback to ScriptProcessor
      if (this.audioContext.audioWorklet) {
        try {
          // Add the audio worklet processor
          await this.audioContext.audioWorklet.addModule(`
            data:text/javascript,
            class AudioProcessor extends AudioWorkletProcessor {
              process(inputs, outputs, parameters) {
                const input = inputs[0];
                if (input.length > 0) {
                  const channelData = input[0];
                  const pcm16 = new Int16Array(channelData.length);
                  
                  for (let i = 0; i < channelData.length; i++) {
                    const s = Math.max(-1, Math.min(1, channelData[i]));
                    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                  }
                  
                  this.port.postMessage({ type: 'audio', data: pcm16 });
                }
                return true;
              }
            }
            registerProcessor('audio-processor', AudioProcessor);
          `);

          this.audioWorklet = new AudioWorkletNode(this.audioContext, 'audio-processor');
          this.audioWorklet.port.onmessage = (event) => {
            if (event.data.type === 'audio' && this.client.isConnected()) {
              this.client.appendInputAudio(event.data.data);
            }
          };

          this.sourceNode.connect(this.audioWorklet);
          console.log('AudioWorklet setup successful');
        } catch (workletError) {
          console.warn('AudioWorklet failed, falling back to ScriptProcessor:', workletError);
          this.setupScriptProcessor();
        }
      } else {
        console.log('AudioWorklet not available, using ScriptProcessor');
        this.setupScriptProcessor();
      }
      
      console.log('Audio capture started successfully');
    } catch (error) {
      console.error('Failed to start audio capture:', error);
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Microphone access denied. Please allow microphone access and try again.');
        } else if (error.name === 'NotFoundError') {
          throw new Error('No microphone found. Please connect a microphone and try again.');
        } else if (error.name === 'NotReadableError') {
          throw new Error('Microphone is being used by another application. Please close other apps and try again.');
        }
      }
      
      throw error;
    }
  }

  private setupScriptProcessor() {
    if (!this.audioContext || !this.sourceNode) return;

    const processor = this.audioContext.createScriptProcessor(2048, 1, 1);

    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Convert Float32 to Int16 PCM
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      // Send to OpenAI
      if (this.client.isConnected()) {
        this.client.appendInputAudio(pcm16);
      }
    };

    this.sourceNode.connect(processor);
    processor.connect(this.audioContext.destination);
  }

  private async playAudio(audioData: string) {
    if (!this.audioContext) return;

    try {
      // Convert base64 to ArrayBuffer
      const binary = atob(audioData);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      // Convert PCM16 to Float32
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7FFF);
      }

      // Create audio buffer
      const audioBuffer = this.audioContext.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      // Play the audio
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();
      
      console.log('Audio played successfully');
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  }

  async sendMessage(message: string) {
    if (this.client.isConnected()) {
      console.log('Sending text message:', message);
      await this.client.sendUserMessageContent([
        {
          type: 'input_text',
          text: message,
        },
      ]);
    }
  }

  async interrupt() {
    if (this.client.isConnected()) {
      console.log('Interrupting response');
      await this.client.cancelResponse();
    }
  }

  disconnect() {
    console.log('Disconnecting...');
    
    // Stop audio capture
    if (this.audioWorklet) {
      this.audioWorklet.disconnect();
      this.audioWorklet = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Disconnect from OpenAI
    if (this.client.isConnected()) {
      this.client.disconnect();
    }
    
    console.log('Disconnected');
  }
}