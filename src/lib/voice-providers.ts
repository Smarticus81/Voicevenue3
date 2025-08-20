// Multi-Provider Voice Pipeline with OpenAI, Eleven Labs, Google TTS, and more
// Ultra-low latency implementation with WebRTC and streaming

import { EventEmitter } from 'events';
import { OpenAIRealtimeClient } from './openai-realtime-client';

export interface VoiceProvider {
  name: string;
  initialize(config: any): Promise<void>;
  synthesize(text: string, voice: string): Promise<ArrayBuffer>;
  transcribe(audio: ArrayBuffer): Promise<string>;
  getVoices(): Promise<Voice[]>;
  cleanup(): void;
}

export interface Voice {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  language: string;
  provider: string;
  preview?: string;
}

// OpenAI Provider (Primary - WebRTC Realtime)
export class OpenAIProvider extends EventEmitter implements VoiceProvider {
  name = 'openai';
  private client: OpenAIRealtimeClient | null = null;
  private apiKey: string = '';

  async initialize(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
    this.client = new OpenAIRealtimeClient({ apiKey: this.apiKey });
    
    // Set up event listeners
    this.client.on('connection.open', () => {
      console.log('OpenAI voice provider connected');
      this.emit('connected');
    });

    this.client.on('error', (error) => {
      console.error('OpenAI voice provider error:', error);
      this.emit('error', error);
    });

    this.client.on('audio.delta', (data) => {
      this.emit('audio-chunk', data);
    });
  }

  async synthesize(text: string, voice: string): Promise<ArrayBuffer> {
    if (!this.client?.isConnected) {
      throw new Error('OpenAI client not connected');
    }

    // For OpenAI, we send the text and get audio back via WebRTC
    await this.client.sendMessage(text);
    
    // Return empty buffer as audio comes through WebRTC stream
    return new ArrayBuffer(0);
  }

  async transcribe(audio: ArrayBuffer): Promise<string> {
    // OpenAI handles transcription through WebRTC
    return '';
  }

  async getVoices(): Promise<Voice[]> {
    return [
      { id: 'alloy', name: 'Alloy', gender: 'neutral', language: 'en', provider: 'openai', description: 'Balanced and natural' },
      { id: 'echo', name: 'Echo', gender: 'male', language: 'en', provider: 'openai', description: 'Warm and friendly' },
      { id: 'fable', name: 'Fable', gender: 'female', language: 'en', provider: 'openai', description: 'Clear and professional' },
      { id: 'onyx', name: 'Onyx', gender: 'male', language: 'en', provider: 'openai', description: 'Deep and authoritative' },
      { id: 'nova', name: 'Nova', gender: 'female', language: 'en', provider: 'openai', description: 'Bright and energetic' },
      { id: 'shimmer', name: 'Shimmer', gender: 'female', language: 'en', provider: 'openai', description: 'Smooth and melodic' },
    ];
  }

  async connect(config: { instructions: string; voice: string; temperature?: number }) {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    await this.client.connect(config);
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
    }
  }

  cleanup(): void {
    this.disconnect();
    this.client = null;
  }
}

// Eleven Labs Provider
export class ElevenLabsProvider extends EventEmitter implements VoiceProvider {
  name = 'elevenlabs';
  private apiKey: string = '';
  private websocket: WebSocket | null = null;
  private streamingEnabled = true;
  private modelId = 'eleven_turbo_v2'; // Ultra-low latency model

  async initialize(config: { apiKey: string; streaming?: boolean }) {
    this.apiKey = config.apiKey;
    this.streamingEnabled = config.streaming ?? true;

    if (this.streamingEnabled) {
      await this.initializeWebSocket();
    }
  }

  private async initializeWebSocket() {
    return new Promise<void>((resolve, reject) => {
      const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/stream-input?model_id=${this.modelId}`;
      
      this.websocket = new WebSocket(wsUrl);
      
      this.websocket.onopen = () => {
        // Send authentication
        this.websocket?.send(JSON.stringify({
          xi_api_key: this.apiKey,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          },
          generation_config: {
            chunk_length_schedule: [120, 160, 250, 290]
          }
        }));
        
        console.log('Eleven Labs WebSocket connected');
        resolve();
      };

      this.websocket.onerror = (error) => {
        console.error('Eleven Labs WebSocket error:', error);
        reject(error);
      };

      this.websocket.onmessage = (event) => {
        this.handleWebSocketMessage(event.data);
      };
    });
  }

  private handleWebSocketMessage(data: any) {
    if (data instanceof Blob) {
      // Audio chunk received
      data.arrayBuffer().then(buffer => {
        this.emit('audio-chunk', buffer);
      });
    } else {
      // JSON message
      try {
        const message = JSON.parse(data);
        if (message.error) {
          console.error('Eleven Labs error:', message.error);
          this.emit('error', message.error);
        }
      } catch (e) {
        // Binary audio data
      }
    }
  }

  async synthesize(text: string, voiceId: string): Promise<ArrayBuffer> {
    if (this.streamingEnabled && this.websocket) {
      return this.streamingSynthesize(text, voiceId);
    } else {
      return this.standardSynthesize(text, voiceId);
    }
  }

  private async streamingSynthesize(text: string, voiceId: string): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const chunks: ArrayBuffer[] = [];
      
      const handleChunk = (chunk: ArrayBuffer) => {
        chunks.push(chunk);
      };
      
      this.once('stream-complete', () => {
        // Combine all chunks
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        
        chunks.forEach(chunk => {
          combined.set(new Uint8Array(chunk), offset);
          offset += chunk.byteLength;
        });
        
        resolve(combined.buffer);
      });
      
      this.on('audio-chunk', handleChunk);
      
      // Send text for synthesis
      this.websocket?.send(JSON.stringify({
        text,
        voice_id: voiceId,
        try_trigger_generation: true,
        generation_config: {
          chunk_length_schedule: [50] // Ultra-fast chunking
        }
      }));
      
      // Send end of text signal
      setTimeout(() => {
        this.websocket?.send(JSON.stringify({ text: '' }));
        this.emit('stream-complete');
      }, 100);
    });
  }

  private async standardSynthesize(text: string, voiceId: string): Promise<ArrayBuffer> {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: this.modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Eleven Labs synthesis failed: ${response.statusText}`);
    }

    return response.arrayBuffer();
  }

  async transcribe(audio: ArrayBuffer): Promise<string> {
    // Eleven Labs doesn't provide STT, use fallback
    throw new Error('Transcription not supported by Eleven Labs');
  }

  async getVoices(): Promise<Voice[]> {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': this.apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.voices.map((voice: any) => ({
      id: voice.voice_id,
      name: voice.name,
      gender: voice.labels?.gender || 'neutral',
      language: voice.labels?.language || 'en',
      provider: 'elevenlabs',
      preview: voice.preview_url
    }));
  }

  cleanup() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }
}

// Google Cloud TTS/STT Provider
export class GoogleCloudProvider implements VoiceProvider {
  name = 'google';
  private apiKey: string = '';
  private ttsEndpoint = 'https://texttospeech.googleapis.com/v1/text:synthesize';
  private sttEndpoint = 'https://speech.googleapis.com/v1/speech:recognize';

  async initialize(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
  }

  async synthesize(text: string, voice: string): Promise<ArrayBuffer> {
    const [languageCode, name, ssmlGender] = voice.split('-');
    
    const response = await fetch(`${this.ttsEndpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: `${languageCode}-${name}`,
          name: voice,
          ssmlGender: ssmlGender || 'NEUTRAL'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0,
          volumeGainDb: 0,
          effectsProfileId: ['headphone-class-device']
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Google TTS synthesis failed: ${response.statusText}`);
    }

    const data = await response.json();
    const audioContent = data.audioContent;
    
    // Decode base64 audio
    const binaryString = atob(audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes.buffer;
  }

  async transcribe(audio: ArrayBuffer): Promise<string> {
    // Convert ArrayBuffer to base64
    const base64Audio = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(audio))));
    
    const response = await fetch(`${this.sttEndpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: 'en-US',
          enableAutomaticPunctuation: true,
          model: 'latest_long'
        },
        audio: {
          content: base64Audio
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Google STT transcription failed: ${response.statusText}`);
    }

    const data = await response.json();
    const transcript = data.results
      ?.map((result: any) => result.alternatives[0].transcript)
      .join(' ') || '';
    
    return transcript;
  }

  async getVoices(): Promise<Voice[]> {
    const response = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${this.apiKey}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Google voices: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.voices
      .filter((voice: any) => voice.languageCodes.includes('en-US'))
      .map((voice: any) => ({
        id: voice.name,
        name: voice.name.replace('en-US-', ''),
        gender: voice.ssmlGender.toLowerCase(),
        language: 'en-US',
        provider: 'google'
      }));
  }

  cleanup() {
    // No cleanup needed for REST API
  }
}

// Play.ht Provider
export class PlayHTProvider implements VoiceProvider {
  name = 'playht';
  private apiKey: string = '';
  private userId: string = '';

  async initialize(config: { apiKey: string; userId: string }) {
    this.apiKey = config.apiKey;
    this.userId = config.userId;
  }

  async synthesize(text: string, voice: string): Promise<ArrayBuffer> {
    // Create TTS job
    const createResponse = await fetch('https://api.play.ht/api/v2/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-User-ID': this.userId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice,
        output_format: 'mp3',
        speed: 1,
        sample_rate: 24000,
        voice_engine: 'PlayHT2.0-turbo'
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Play.ht synthesis failed: ${createResponse.statusText}`);
    }

    const { id } = await createResponse.json();
    
    // Poll for completion
    let audioUrl: string | null = null;
    let attempts = 0;
    
    while (!audioUrl && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const statusResponse = await fetch(`https://api.play.ht/api/v2/tts/${id}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-User-ID': this.userId
        }
      });
      
      if (statusResponse.ok) {
        const data = await statusResponse.json();
        if (data.status === 'complete') {
          audioUrl = data.output.url;
        }
      }
      
      attempts++;
    }
    
    if (!audioUrl) {
      throw new Error('Play.ht synthesis timeout');
    }
    
    // Fetch audio
    const audioResponse = await fetch(audioUrl);
    return audioResponse.arrayBuffer();
  }

  async transcribe(audio: ArrayBuffer): Promise<string> {
    throw new Error('Transcription not supported by Play.ht');
  }

  async getVoices(): Promise<Voice[]> {
    const response = await fetch('https://api.play.ht/api/v2/voices', {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-User-ID': this.userId
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Play.ht voices: ${response.statusText}`);
    }

    const voices = await response.json();
    
    return voices
      .filter((voice: any) => voice.language === 'english')
      .map((voice: any) => ({
        id: voice.id,
        name: voice.name,
        gender: voice.gender?.toLowerCase() || 'neutral',
        language: 'en-US',
        provider: 'playht'
      }));
  }

  cleanup() {
    // No cleanup needed
  }
}

// Voice Pipeline Manager
export class VoicePipelineManager extends EventEmitter {
  private providers: Map<string, VoiceProvider> = new Map();
  private activeProvider: VoiceProvider | null = null;
  private sttProvider: VoiceProvider | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;

  async initialize(config: {
    providers: Array<{
      type: 'openai' | 'elevenlabs' | 'google' | 'playht';
      config: any;
    }>;
    defaultProvider: string;
  }) {
    // Initialize audio context
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000
    });

    // Initialize providers
    for (const providerConfig of config.providers) {
      let provider: VoiceProvider;
      
      switch (providerConfig.type) {
        case 'openai':
          provider = new OpenAIProvider();
          break;
        case 'elevenlabs':
          provider = new ElevenLabsProvider();
          break;
        case 'google':
          provider = new GoogleCloudProvider();
          break;
        case 'playht':
          provider = new PlayHTProvider();
          break;
        default:
          continue;
      }
      
      await provider.initialize(providerConfig.config);
      this.providers.set(providerConfig.type, provider);
    }

    // Set default provider
    this.activeProvider = this.providers.get(config.defaultProvider) || null;
    
    // Set STT provider (prefer Google for transcription)
    this.sttProvider = this.providers.get('google') || this.activeProvider;
  }

  async synthesize(text: string, voice: string): Promise<void> {
    if (!this.activeProvider) {
      throw new Error('No active voice provider');
    }

    const startTime = performance.now();
    
    try {
      const audioBuffer = await this.activeProvider.synthesize(text, voice);
      
      const latency = performance.now() - startTime;
      console.log(`TTS latency: ${latency}ms`);
      
      // Play audio
      await this.playAudio(audioBuffer);
      
      this.emit('synthesis-complete', { text, voice, latency });
    } catch (error) {
      console.error('Synthesis error:', error);
      this.emit('synthesis-error', error);
      throw error;
    }
  }

  private async playAudio(audioBuffer: ArrayBuffer) {
    if (!this.audioContext) return;

    // Decode audio data
    const decodedAudio = await this.audioContext.decodeAudioData(audioBuffer);
    
    // Create buffer source
    const source = this.audioContext.createBufferSource();
    source.buffer = decodedAudio;
    source.connect(this.audioContext.destination);
    
    // Play with minimal latency
    source.start(0);
    
    return new Promise<void>(resolve => {
      source.onended = () => resolve();
    });
  }

  async startRecording(): Promise<void> {
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 48000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    this.emit('recording-started');
  }

  async stopRecording(): Promise<string> {
    if (!this.mediaStream) {
      throw new Error('No active recording');
    }

    // Stop recording
    this.mediaStream.getTracks().forEach(track => track.stop());
    
    // Get audio buffer (simplified for example)
    const audioBuffer = new ArrayBuffer(0); // Would capture actual audio
    
    // Transcribe
    if (this.sttProvider) {
      const transcript = await this.sttProvider.transcribe(audioBuffer);
      this.emit('transcription-complete', transcript);
      return transcript;
    }
    
    return '';
  }

  async getVoices(): Promise<Voice[]> {
    const allVoices: Voice[] = [];
    
    for (const provider of Array.from(this.providers.values())) {
      try {
        const voices = await provider.getVoices();
        allVoices.push(...voices);
      } catch (error) {
        console.error(`Failed to get voices from ${provider.name}:`, error);
      }
    }
    
    return allVoices;
  }

  setActiveProvider(providerName: string) {
    const provider = this.providers.get(providerName);
    if (provider) {
      this.activeProvider = provider;
      this.emit('provider-changed', providerName);
    }
  }

  cleanup() {
    for (const provider of Array.from(this.providers.values())) {
      provider.cleanup();
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
