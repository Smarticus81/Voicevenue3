import { RealtimeAgent, RealtimeSession, OpenAIRealtimeWebRTC } from '@openai/agents/realtime';
import { EventEmitter } from 'events';

export interface VoiceConfig {
  instructions: string;
  voice: string;
  temperature?: number;
  tools?: any[];
}

export interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

export class OpenAIRealtimeClient extends EventEmitter {
  private agent: RealtimeAgent;
  private session: RealtimeSession | null = null;
  private transport: OpenAIRealtimeWebRTC | null = null;
  private mediaStream: MediaStream | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private connected = false;
  private listening = false;

  constructor(config: { apiKey: string }) {
    super();
    
    // Create the RealtimeAgent with default configuration
    this.agent = new RealtimeAgent({
      name: 'Voice Assistant',
      instructions: 'You are a helpful voice assistant.',
    });
  }

  async connect(config: VoiceConfig): Promise<void> {
    try {
      console.log('Initializing WebRTC connection with OpenAI Realtime API...');
      
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      console.log('Microphone access granted');

      // Create audio element for playback
      this.audioElement = document.createElement('audio');
      this.audioElement.autoplay = true;
      this.audioElement.controls = false;
      document.body.appendChild(this.audioElement);

      // Create WebRTC transport
      this.transport = new OpenAIRealtimeWebRTC({
        mediaStream: this.mediaStream,
        audioElement: this.audioElement,
        useInsecureApiKey: true, // Required for browser environments
      });

      // Create session with the agent
      this.session = new RealtimeSession(this.agent, { transport: this.transport });

      // Update agent instructions
      this.agent.instructions = config.instructions;

      // Connect to OpenAI
      await this.session.connect({ 
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
        model: 'gpt-4o-realtime-preview-2025-06-03'
      });

      console.log('WebRTC connection established successfully');
      this.connected = true;

      // Set up event listeners
      this.setupEventListeners();

      this.emit('connection.open', {});
    } catch (error) {
      console.error('Failed to establish WebRTC connection:', error);
      this.emit('error', error);
      throw error;
    }
  }

  private setupEventListeners() {
    if (!this.session) return;

    // Listen for speech started/stopped events
    this.session.on('input_audio_buffer.speech_started', () => {
      console.log('User started speaking');
      this.listening = true;
      this.emit('speech.started');
    });

    this.session.on('input_audio_buffer.speech_stopped', () => {
      console.log('User stopped speaking');
      this.listening = false;
      this.emit('speech.stopped');
    });

    // Listen for transcript events
    this.session.on('input_audio_buffer.transcript', (event: any) => {
      console.log('Transcript received:', event.text, event.is_final);
      this.emit('transcript', event.text, event.is_final);
    });

    // Listen for response events
    this.session.on('response.output_audio.delta', (event: any) => {
      console.log('Audio response delta received');
      this.emit('audio.delta', event);
    });

    this.session.on('response.output_text.delta', (event: any) => {
      console.log('Text response delta received:', event.delta);
      this.emit('text.delta', event.delta);
    });

    this.session.on('response.completed', () => {
      console.log('Response completed');
      this.emit('response.completed');
    });

    // Listen for tool call events
    this.session.on('response.function_call', (event: any) => {
      console.log('Function call received:', event);
      this.emit('tool.call', event);
    });

    // Listen for errors
    this.session.on('error', (error: any) => {
      console.error('Session error:', error);
      this.emit('error', error);
    });
  }

  async disconnect(): Promise<void> {
    try {
      if (this.session) {
        // Close the session properly
        this.session.close();
        this.session = null;
      }

      if (this.transport) {
        this.transport = null;
      }

      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }

      if (this.audioElement) {
        this.audioElement.remove();
        this.audioElement = null;
      }

      this.connected = false;
      this.listening = false;

      console.log('WebRTC connection closed');
      this.emit('connection.close', {});
    } catch (error) {
      console.error('Error disconnecting:', error);
      throw error;
    }
  }

  async sendMessage(content: string): Promise<void> {
    if (!this.session || !this.connected) {
      throw new Error('Not connected');
    }

    try {
      console.log('Sending message:', content);
      
      // Send text message through the session
      this.session.sendMessage({
        type: 'message',
        role: 'user',
        content: content
      });

      console.log('Message sent successfully');
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  async sendVoiceMessage(): Promise<void> {
    if (!this.session || !this.connected) {
      throw new Error('Not connected');
    }

    try {
      console.log('Sending voice message');
      
      // The WebRTC transport automatically handles voice input
      // Just trigger the response creation
      this.session.sendMessage({
        type: 'message',
        role: 'user',
        content: 'Voice input'
      });

      console.log('Voice message sent successfully');
    } catch (error) {
      console.error('Failed to send voice message:', error);
      throw error;
    }
  }

  async interruptResponse(): Promise<void> {
    if (!this.session || !this.connected) return;

    try {
      console.log('Interrupting current response');
      
      // Interrupt the current response
      this.session.interrupt();
      
      console.log('Response interrupted successfully');
    } catch (error) {
      console.error('Failed to interrupt response:', error);
    }
  }

  // Getters for state
  get isConnected(): boolean {
    return this.connected;
  }

  get isListening(): boolean {
    return this.listening;
  }

  get connectionStatus(): string {
    return this.connected ? 'Connected' : 'Disconnected';
  }
}