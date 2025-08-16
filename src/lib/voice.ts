// Official OpenAI Realtime API Voice Implementation with Convex Integration
// Based on https://platform.openai.com/docs/guides/realtime and OpenAI Agents SDK patterns

export class VoiceSession {
  private ws: WebSocket | null = null;
  private stream: MediaStream | null = null;
  private sessionId: string;
  private audioContext: AudioContext | null = null;
  private audioWorklet: AudioWorkletNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private isConnected = false;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();
  private apiKey: string;
  private conversationHistory: any[] = [];
  private currentAudioSource: AudioBufferSourceNode | null = null;
  private audioQueue: Float32Array[] = [];
  private isPlayingAudio = false;
  private audioBufferSize = 0;
  private targetBufferSize = 4800; // 200ms at 24kHz
  
  // Voice Agent Integration
  private agentName: string;
  private userId: string;
  private currentMode: 'wake_word' | 'command' | 'shutdown' = 'wake_word';
  private wakeWords = {
    order: ['hey bar', 'hey bars', 'hey barb', 'hey boss', 'hay bar', 'a bar', 'hey far', 'hey ba'],
    inquiry: ['hey bev', 'hey beth', 'hey belle', 'hey beb', 'hey v', 'hey b', 'hey bed']
  };

  constructor(sessionId: string, agentName: string = 'Bev', userId: string = 'default') {
    this.sessionId = sessionId;
    this.agentName = agentName;
    this.userId = userId;
    this.apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
  }

  async start(config: {
    instructions: string;
    voice: string;
    temperature: number;
    tools: any[];
  }) {
    try {
      console.log(`Starting ${this.agentName} voice session...`);

      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured. Please set NEXT_PUBLIC_OPENAI_API_KEY');
      }

      // Connect to OpenAI Realtime API
      await this.connectToRealtimeAPI();

      // Configure session with agent-specific instructions
      await this.configureSession(config);

      // Setup audio capture
      await this.setupAudioCapture();

      return {
        sessionId: this.sessionId,
        realtimeSessionId: `realtime_${this.sessionId}`,
        agentName: this.agentName
      };
    } catch (error) {
      console.error('Failed to start voice session:', error);
      this.stop(); // Ensure cleanup on failure
      throw error;
    }
  }

  private async connectToRealtimeAPI() {
    return new Promise<void>((resolve, reject) => {
      try {
        console.log('Connecting to OpenAI Realtime API...');

        // Official OpenAI Realtime API WebSocket endpoint
        const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17';

        // Create WebSocket with proper protocols as per official browser documentation
        this.ws = new WebSocket(url, [
          "realtime",
          // Auth - using the insecure API key format for browser environments
          `openai-insecure-api-key.${this.apiKey}`,
          // Optional
          // "openai-organization." + OPENAI_ORG_ID,
          // "openai-project." + OPENAI_PROJECT_ID,
          // Beta protocol, required
          "openai-beta.realtime-v1"
        ]);

        this.ws.onopen = () => {
          console.log('✅ Connected to OpenAI Realtime API');
          this.isConnected = true;
          this.emit('connection.open');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log(`📨 Received: ${data.type}`, data);
            this.handleRealtimeEvent(data);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log(`🔌 WebSocket closed: ${event.code} ${event.reason}`);
          this.isConnected = false;
          this.emit('connection.close');
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private async configureSession(config: any) {
    if (!this.ws || !this.isConnected) {
      throw new Error('Not connected to OpenAI Realtime API');
    }

    console.log('⚙️ Configuring Realtime session...');

    // Customize instructions based on agent name
    const customInstructions = config.instructions.replace(/Bev/g, this.agentName);

    // Official OpenAI Realtime API session configuration
    const sessionConfig = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: customInstructions,
        voice: config.voice || 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        },
        tools: config.tools?.map((tool: any) => ({
          type: 'function',
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        })) || [],
        tool_choice: 'auto',
        temperature: config.temperature || 0.8,
        max_response_output_tokens: 4096
      }
    };

    this.ws.send(JSON.stringify(sessionConfig));
    console.log('✅ Session configuration sent');
  }

  private handleRealtimeEvent(event: any) {
    switch (event.type) {
      case 'session.created':
        console.log('🎯 Session created:', event.session);
        break;

      case 'session.updated':
        console.log('🔄 Session updated');
        break;

      case 'input_audio_buffer.committed':
        console.log('🎤 Audio buffer committed');
        break;

      case 'input_audio_buffer.speech_started':
        console.log('🗣️ Speech started');
        this.emit('speech_started');
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('🔇 Speech stopped');
        this.emit('speech_stopped');
        break;

      case 'conversation.item.input_audio_transcription.completed':
        console.log('📝 Transcription:', event.transcript);
        this.processTranscription(event.transcript, true);
        this.emit('transcript', {
          text: event.transcript,
          isFinal: true
        });
        break;

      case 'conversation.item.input_audio_transcription.partial':
        console.log('📝 Partial transcription:', event.transcript);
        this.processTranscription(event.transcript, false);
        this.emit('transcript', {
          text: event.transcript,
          isFinal: false
        });
        break;

      case 'response.created':
        console.log('💭 Response created:', event.response.id);
        break;

      case 'response.output_item.added':
        console.log('➕ Output item added:', event.item.type);
        break;

      case 'response.content_part.added':
        console.log('📄 Content part added:', event.part.type);
        break;

      case 'response.text.delta':
        console.log('📝 Text delta:', event.delta);
        this.emit('response_text_delta', { delta: event.delta });
        break;

      case 'response.text.done':
        console.log('✅ Text complete:', event.text);
        this.emit('response_text_done', { text: event.text });
        break;

      case 'response.audio.delta':
        console.log('🔊 Audio delta received');
        if (event.delta) {
          this.playAudioChunk(event.delta);
        }
        break;

      case 'response.audio.done':
        console.log('✅ Audio response complete');
        this.emit('response_audio_done');
        break;

      case 'response.function_call_arguments.delta':
        console.log('🔧 Function call delta:', event.delta);
        break;

      case 'response.function_call_arguments.done':
        console.log('🔧 Function call complete:', event);
        this.handleToolCall(event);
        break;

      case 'response.done':
        console.log('✅ Full response complete');
        this.emit('response_done');
        break;

      case 'error':
        console.error('❌ Realtime API error:', event.error);
        this.emit('error', event.error);
        break;

      default:
        console.log(`📋 Unhandled event: ${event.type}`, event);
    }

    // Emit all events for external listeners
    this.emit(event.type, event);
  }

  private async handleToolCall(event: any) {
    try {
      console.log('🛠️ Handling tool call:', event.name, event.arguments);
      
      // Parse tool arguments
      const args = JSON.parse(event.arguments || '{}');
      
      // Execute tool (this would be customized based on your tools)
      const result = await this.executeSquareTool(event.name, args);
      
      // Send tool result back to OpenAI
      const toolResponse = {
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: event.call_id,
          output: JSON.stringify(result)
        }
      };
      
      this.ws?.send(JSON.stringify(toolResponse));
      
      // Trigger response generation
      const responseCreate = {
        type: 'response.create'
      };
      
      this.ws?.send(JSON.stringify(responseCreate));
      
    } catch (error) {
      console.error('Tool call error:', error);
      
      // Send error response
      const errorResponse = {
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: event.call_id,
          output: JSON.stringify({
            error: error instanceof Error ? error.message : 'Tool execution failed'
          })
        }
      };
      
      this.ws?.send(JSON.stringify(errorResponse));
    }
  }

  private async executeSquareTool(toolName: string, args: any): Promise<any> {
    // Mock Square POS tool implementations
    switch (toolName) {
      case 'check_inventory':
        return {
          item: args.item_name,
          quantity: Math.floor(Math.random() * 50) + 10,
          unit: 'units',
          status: 'in_stock'
        };
        
      case 'add_to_order':
        const total = args.items.reduce((sum: number, item: any) => 
          sum + (item.quantity * (Math.random() * 15 + 5)), 0
        );
        return {
          success: true,
          tab_number: args.tab_number,
          items_added: args.items,
          new_total: total.toFixed(2)
        };
        
      case 'process_payment':
        return {
          success: true,
          tab_number: args.tab_number,
          amount: (Math.random() * 100 + 20).toFixed(2),
          payment_method: args.payment_method,
          transaction_id: `TXN_${Date.now()}`
        };
        
      case 'get_specials':
        return {
          happy_hour: {
            active: new Date().getHours() >= 16 && new Date().getHours() < 19,
            deals: [
              '$3 off craft beers',
              '$6 well drinks', 
              'Half-price wings'
            ]
          },
          daily_special: 'Fish Tacos - $14.99'
        };
        
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  private async setupAudioCapture() {
    try {
      console.log('🎙️ Setting up audio capture...');
      
      // Request microphone access with optimal settings for Realtime API
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('✅ Microphone access granted');

      // Create AudioContext at 24kHz (required by Realtime API)
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000
      });

      // Resume if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);

      // Setup audio processing
      await this.setupAudioWorklet();

      console.log('✅ Audio capture setup complete');
    } catch (error) {
      console.error('❌ Audio setup failed:', error);
      this.handleMicrophoneError(error);
      throw error;
    }
  }

  private handleMicrophoneError(error: any) {
    if (error instanceof Error) {
      switch (error.name) {
        case 'NotAllowedError':
          throw new Error('🚫 Microphone access denied. Please allow microphone access and try again.');
        case 'NotFoundError':
          throw new Error('🎤 No microphone found. Please connect a microphone and try again.');
        case 'NotReadableError':
          throw new Error('🔒 Microphone is being used by another application. Please close other apps and try again.');
        default:
          throw new Error(`🎙️ Microphone error: ${error.message}`);
      }
    }
  }

  private async setupAudioWorklet() {
    if (!this.audioContext || !this.sourceNode) return;

    // Create AudioWorklet processor for real-time audio processing
    const workletCode = `
      class RealtimeAudioProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
          this.bufferSize = 2048;
          this.buffer = new Float32Array(this.bufferSize);
          this.bufferIndex = 0;
        }

        process(inputs, outputs, parameters) {
          const input = inputs[0];
          if (input.length > 0) {
            const channelData = input[0];
            
            for (let i = 0; i < channelData.length; i++) {
              this.buffer[this.bufferIndex] = channelData[i];
              this.bufferIndex++;
              
              if (this.bufferIndex >= this.bufferSize) {
                // Convert Float32 to Int16 PCM (required by OpenAI Realtime API)
                const pcm16 = new Int16Array(this.bufferSize);
                for (let j = 0; j < this.bufferSize; j++) {
                  const s = Math.max(-1, Math.min(1, this.buffer[j]));
                  pcm16[j] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                
                this.port.postMessage({ 
                  type: 'audio_data', 
                  data: pcm16,
                  timestamp: currentTime
                });
                
                this.bufferIndex = 0;
              }
            }
          }
          return true;
        }
      }
      registerProcessor('realtime-audio-processor', RealtimeAudioProcessor);
    `;

    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const workletUrl = URL.createObjectURL(blob);

    await this.audioContext.audioWorklet.addModule(workletUrl);
    
    this.audioWorklet = new AudioWorkletNode(this.audioContext, 'realtime-audio-processor');
    this.audioWorklet.port.onmessage = (event) => {
      if (event.data.type === 'audio_data' && this.isConnected) {
        this.sendAudioToRealtime(event.data.data);
      }
    };

    this.sourceNode.connect(this.audioWorklet);
    console.log('✅ Realtime AudioWorklet setup successful');

    // Clean up blob URL
    URL.revokeObjectURL(workletUrl);
  }

  private sendAudioToRealtime(audioData: Int16Array) {
    if (!this.ws || !this.isConnected) return;

    try {
      // Convert Int16Array to base64 (required by OpenAI Realtime API)
      const uint8Array = new Uint8Array(audioData.buffer);
      const base64 = btoa(String.fromCharCode(...uint8Array));
      
      const message = {
        type: 'input_audio_buffer.append',
        audio: base64
      };

      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send audio:', error);
    }
  }

  private async playAudioChunk(audioBase64: string) {
    if (!this.audioContext) return;

    try {
      // Decode base64 audio from OpenAI
      const binary = atob(audioBase64);
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

      // Add to audio queue
      this.audioQueue.push(float32);
      this.audioBufferSize += float32.length;

      // Start playing if we have enough audio and not already playing
      if (this.audioBufferSize >= this.targetBufferSize && !this.isPlayingAudio) {
        this.playAudioFromQueue();
      }
      
    } catch (error) {
      console.error('Failed to process audio chunk:', error);
    }
  }

  private async playAudioFromQueue() {
    if (this.audioQueue.length === 0 || this.isPlayingAudio) return;

    this.isPlayingAudio = true;

    try {
      // Combine audio chunks from queue
      let totalLength = 0;
      for (const chunk of this.audioQueue) {
        totalLength += chunk.length;
      }

      const combinedAudio = new Float32Array(totalLength);
      let offset = 0;
      for (const chunk of this.audioQueue) {
        combinedAudio.set(chunk, offset);
        offset += chunk.length;
      }

      // Clear the queue
      this.audioQueue = [];
      this.audioBufferSize = 0;

      // Create audio buffer with correct sample rate (OpenAI uses 24kHz)
      const audioBuffer = this.audioContext!.createBuffer(1, combinedAudio.length, 24000);
      audioBuffer.getChannelData(0).set(combinedAudio);

      const source = this.audioContext!.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext!.destination);
      
      // Stop any currently playing audio to prevent overlap
      if (this.currentAudioSource) {
        try {
          this.currentAudioSource.stop();
        } catch (e) {
          // Ignore errors from already stopped sources
        }
      }
      
      this.currentAudioSource = source;
      
      source.onended = () => {
        this.isPlayingAudio = false;
        // Check if there's more audio to play
        if (this.audioQueue.length > 0) {
          setTimeout(() => this.playAudioFromQueue(), 100);
        }
      };
      
      source.start();
      
    } catch (error) {
      console.error('Failed to play audio from queue:', error);
      this.isPlayingAudio = false;
    }
  }

  async sendMessage(text: string) {
    if (!this.ws || !this.isConnected) {
      throw new Error('Not connected to OpenAI Realtime API');
    }

    try {
      console.log('📤 Sending text message:', text);

      // Create conversation item
      const createMessage = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: text
            }
          ]
        }
      };

      this.ws.send(JSON.stringify(createMessage));

      // Trigger response generation
      const responseCreate = {
        type: 'response.create'
      };

      this.ws.send(JSON.stringify(responseCreate));
      console.log('✅ Text message sent and response triggered');
      
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  async interrupt() {
    if (!this.ws || !this.isConnected) return;

    try {
      console.log('⚡ Interrupting response...');
      const message = {
        type: 'response.cancel'
      };
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to interrupt:', error);
    }
  }

  // For compatibility with your existing API
  async executeTool(tool: string, params: any, orgId: string) {
    return this.executeSquareTool(tool, params);
  }

  // Event handling
  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in event callback:', error);
      }
    });
  }

  stop() {
    console.log('🛑 Stopping OpenAI Realtime voice session...');

    // Stop any currently playing audio
    if (this.currentAudioSource) {
      try {
        this.currentAudioSource.stop();
        this.currentAudioSource = null;
      } catch (e) {
        // Ignore errors from already stopped sources
      }
    }

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

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    console.log('✅ Realtime voice session stopped');
  }

  // New method: Process transcription with wake word detection
  private processTranscription(transcript: string, isFinal: boolean) {
    if (!isFinal) return; // Only process final transcriptions

    const lowerTranscript = transcript.toLowerCase().trim();
    
    // Check for wake words
    const wakeWordResult = this.detectWakeWord(lowerTranscript);
    
    if (wakeWordResult.type) {
      console.log(`🎯 Wake word detected: ${wakeWordResult.type}`);
      this.currentMode = 'command';
      this.emit('wake_word_detected', { type: wakeWordResult.type, confidence: wakeWordResult.confidence });
      
      // Send wake word response
      this.sendMessage(`Hi there! I'm ${this.agentName}. What can I get you?`);
      return;
    }

    // If in command mode, process the command
    if (this.currentMode === 'command') {
      this.emit('command_received', { command: transcript, confidence: 0.8 });
    }
  }

  // New method: Wake word detection
  private detectWakeWord(text: string): { type: 'order' | 'inquiry' | null; confidence: number } {
    for (const word of this.wakeWords.order) {
      if (text.includes(word)) {
        return { type: 'order', confidence: 0.9 };
      }
    }
    
    for (const word of this.wakeWords.inquiry) {
      if (text.includes(word)) {
        return { type: 'inquiry', confidence: 0.9 };
      }
    }
    
    return { type: null, confidence: 0 };
  }

  // New method: Set agent name
  setAgentName(name: string) {
    this.agentName = name;
    console.log(`Agent name updated to: ${this.agentName}`);
  }

  // New method: Set user ID
  setUserId(id: string) {
    this.userId = id;
    console.log(`User ID updated to: ${this.userId}`);
  }

  // New method: Get current mode
  getCurrentMode(): string {
    return this.currentMode;
  }

  // New method: Switch mode
  switchMode(mode: 'wake_word' | 'command' | 'shutdown') {
    this.currentMode = mode;
    console.log(`Mode switched to: ${mode}`);
    this.emit('mode_changed', { mode });
  }
}