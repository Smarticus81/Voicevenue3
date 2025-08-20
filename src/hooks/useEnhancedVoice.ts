"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { WakeWordDetector } from '@/lib/wake-word-detector';
import { VoicePipelineManager, Voice } from '@/lib/voice-providers';
import { OpenAIRealtimeClient } from '@/lib/openai-realtime-client';

export interface EnhancedVoiceConfig {
  agentName: string;
  wakeWords: string[];
  provider: 'elevenlabs' | 'google' | 'playht' | 'openai';
  voice: string;
  instructions: string;
  temperature: number;
  enableTools: boolean;
  elevenLabsApiKey?: string;
  googleApiKey?: string;
  playhtApiKey?: string;
  playhtUserId?: string;
}

export interface UseEnhancedVoiceReturn {
  // State
  isConnected: boolean;
  isListening: boolean;
  mode: 'wake_word' | 'command' | 'shutdown';
  transcript: string;
  response: string;
  error: string | null;
  connectionStatus: string;
  availableVoices: Voice[];
  currentProvider: string;
  
  // Actions
  startListening: () => Promise<void>;
  stopListening: () => void;
  connect: (config: EnhancedVoiceConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  interrupt: () => Promise<void>;
  switchProvider: (provider: string) => void;
  setWakeWords: (words: string[]) => void;
}

export function useEnhancedVoice(): UseEnhancedVoiceReturn {
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [mode, setMode] = useState<'wake_word' | 'command' | 'shutdown'>('shutdown');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [currentProvider, setCurrentProvider] = useState('openai');

  // Refs
  const wakeWordDetectorRef = useRef<WakeWordDetector | null>(null);
  const voicePipelineRef = useRef<VoicePipelineManager | null>(null);
  const openAIClientRef = useRef<OpenAIRealtimeClient | null>(null);
  const configRef = useRef<EnhancedVoiceConfig | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);

  // Initialize voice pipeline
  const initializeVoicePipeline = useCallback(async (config: EnhancedVoiceConfig) => {
    try {
      const providers = [];
      
      // Add configured providers
      if (config.elevenLabsApiKey) {
        providers.push({
          type: 'elevenlabs' as const,
          config: { 
            apiKey: config.elevenLabsApiKey,
            streaming: true // Enable ultra-low latency streaming
          }
        });
      }
      
      if (config.googleApiKey) {
        providers.push({
          type: 'google' as const,
          config: { apiKey: config.googleApiKey }
        });
      }
      
      if (config.playhtApiKey && config.playhtUserId) {
        providers.push({
          type: 'playht' as const,
          config: { 
            apiKey: config.playhtApiKey,
            userId: config.playhtUserId
          }
        });
      }

      if (providers.length > 0) {
        voicePipelineRef.current = new VoicePipelineManager();
        await voicePipelineRef.current.initialize({
          providers,
          defaultProvider: config.provider === 'openai' ? 'elevenlabs' : config.provider
        });

        // Get available voices
        const voices = await voicePipelineRef.current.getVoices();
        setAvailableVoices(voices);

        // Set up event listeners
        voicePipelineRef.current.on('synthesis-complete', (data) => {
          console.log(`TTS completed in ${data.latency}ms`);
        });

        voicePipelineRef.current.on('synthesis-error', (error) => {
          console.error('TTS error:', error);
          setError('Voice synthesis error');
        });
      }
    } catch (err) {
      console.error('Failed to initialize voice pipeline:', err);
      setError('Failed to initialize voice providers');
    }
  }, []);

  // Initialize wake word detector
  const initializeWakeWordDetector = useCallback((config: EnhancedVoiceConfig) => {
    wakeWordDetectorRef.current = new WakeWordDetector({
      wakeWords: config.wakeWords,
      threshold: 0.8,
      timeout: 30000, // 30 seconds command timeout
      onWakeWordDetected: async (word, confidence) => {
        console.log(`Wake word detected: "${word}" (confidence: ${confidence})`);
        setTranscript(`Wake word: "${word}"`);
        
        // Play acknowledgment sound or speak greeting
        const greeting = `Hi! I'm ${config.agentName}. How can I help you?`;
        await speakResponse(greeting);
      },
      onCommandReceived: async (command, confidence) => {
        console.log(`Command received: "${command}" (confidence: ${confidence})`);
        setTranscript(command);
        
        // Process command
        await processCommand(command);
      },
      onModeChange: (newMode) => {
        console.log(`Mode changed to: ${newMode}`);
        setMode(newMode);
        
        if (newMode === 'shutdown') {
          setIsListening(false);
          setConnectionStatus('Shutdown - Press button to restart');
        } else if (newMode === 'wake_word') {
          setConnectionStatus('Listening for wake word...');
        } else if (newMode === 'command') {
          setConnectionStatus('Listening for commands...');
        }
      }
    });
  }, []);

  // Process voice command
  const processCommand = useCallback(async (command: string) => {
    if (isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    setResponse('');
    
    try {
      // Use OpenAI for command processing if connected
      if (openAIClientRef.current?.isConnected) {
        await openAIClientRef.current.sendMessage(command);
      } else {
        // Fallback to API endpoint
        const response = await fetch('/api/agent-api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: command,
            agentName: configRef.current?.agentName,
            instructions: configRef.current?.instructions,
            temperature: configRef.current?.temperature
          })
        });

        if (response.ok) {
          const data = await response.json();
          setResponse(data.response);
          await speakResponse(data.response);
        }
      }
    } catch (err) {
      console.error('Error processing command:', err);
      setError('Failed to process command');
      await speakResponse("Sorry, I encountered an error. Please try again.");
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  // Speak response using selected provider
  const speakResponse = useCallback(async (text: string) => {
    if (!text) return;
    
    try {
      if (voicePipelineRef.current && configRef.current?.provider !== 'openai') {
        // Use external TTS provider
        await voicePipelineRef.current.synthesize(text, configRef.current?.voice || 'default');
      } else {
        // Use browser TTS as fallback
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9;
          utterance.pitch = 1;
          utterance.voice = speechSynthesis.getVoices().find(v => 
            v.name.includes('Google') || v.name.includes('Microsoft')
          ) || null;
          speechSynthesis.speak(utterance);
        }
      }
    } catch (err) {
      console.error('Error speaking response:', err);
    }
  }, []);

  // Connect to voice services
  const connect = useCallback(async (config: EnhancedVoiceConfig) => {
    try {
      setError(null);
      setConnectionStatus('Connecting...');
      configRef.current = config;

      // Initialize voice pipeline if using external providers
      if (config.provider !== 'openai') {
        await initializeVoicePipeline(config);
      }

      // Initialize OpenAI if needed
      if (config.provider === 'openai' || config.enableTools) {
        openAIClientRef.current = new OpenAIRealtimeClient({
          apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''
        });

        // Set up OpenAI event listeners
        openAIClientRef.current.on('transcript', (text: string, isFinal: boolean) => {
          if (isFinal) {
            setTranscript(text);
          }
        });

        openAIClientRef.current.on('text.delta', (delta: string) => {
          setResponse(prev => prev + delta);
        });

        openAIClientRef.current.on('error', (error: any) => {
          console.error('OpenAI error:', error);
          setError(error.message || 'OpenAI connection error');
        });

        // Connect to OpenAI
        await openAIClientRef.current.connect({
          instructions: config.instructions,
          voice: config.voice as any,
          temperature: config.temperature,
          tools: config.enableTools ? [] : undefined
        });
      }

      // Initialize wake word detector
      initializeWakeWordDetector(config);

      setIsConnected(true);
      setConnectionStatus('Connected - Press button to start');
      setCurrentProvider(config.provider);
      
    } catch (err) {
      console.error('Failed to connect:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      setConnectionStatus('Connection Failed');
      throw err;
    }
  }, [initializeVoicePipeline, initializeWakeWordDetector]);

  // Start listening
  const startListening = useCallback(async () => {
    if (!isConnected || !wakeWordDetectorRef.current) {
      setError('Not connected. Please connect first.');
      return;
    }

    try {
      wakeWordDetectorRef.current.start();
      setIsListening(true);
      setMode('wake_word');
      setConnectionStatus('Listening for wake word...');
    } catch (err) {
      console.error('Failed to start listening:', err);
      setError('Failed to start listening. Check microphone permissions.');
    }
  }, [isConnected]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (wakeWordDetectorRef.current) {
      wakeWordDetectorRef.current.stop();
    }
    setIsListening(false);
    setMode('shutdown');
    setConnectionStatus('Stopped - Press button to restart');
  }, []);

  // Disconnect all services
  const disconnect = useCallback(async () => {
    try {
      // Stop wake word detector
      if (wakeWordDetectorRef.current) {
        wakeWordDetectorRef.current.stop();
        wakeWordDetectorRef.current = null;
      }

      // Cleanup voice pipeline
      if (voicePipelineRef.current) {
        voicePipelineRef.current.cleanup();
        voicePipelineRef.current = null;
      }

      // Disconnect OpenAI
      if (openAIClientRef.current) {
        await openAIClientRef.current.disconnect();
        openAIClientRef.current = null;
      }

      setIsConnected(false);
      setIsListening(false);
      setMode('shutdown');
      setTranscript('');
      setResponse('');
      setError(null);
      setConnectionStatus('Disconnected');
      setAvailableVoices([]);
      
    } catch (err) {
      console.error('Error disconnecting:', err);
    }
  }, []);

  // Send manual message
  const sendMessage = useCallback(async (message: string) => {
    if (!isConnected) {
      throw new Error('Not connected');
    }

    setTranscript(message);
    await processCommand(message);
  }, [isConnected, processCommand]);

  // Interrupt current response
  const interrupt = useCallback(async () => {
    if (openAIClientRef.current?.isConnected) {
      await openAIClientRef.current.interruptResponse();
    }
    
    // Stop any ongoing TTS
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }, []);

  // Switch voice provider
  const switchProvider = useCallback((provider: string) => {
    if (voicePipelineRef.current) {
      voicePipelineRef.current.setActiveProvider(provider);
      setCurrentProvider(provider);
    }
  }, []);

  // Set wake words
  const setWakeWords = useCallback((words: string[]) => {
    if (wakeWordDetectorRef.current) {
      wakeWordDetectorRef.current.setWakeWords(words);
    }
    
    if (configRef.current) {
      configRef.current.wakeWords = words;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    // State
    isConnected,
    isListening,
    mode,
    transcript,
    response,
    error,
    connectionStatus,
    availableVoices,
    currentProvider,
    
    // Actions
    startListening,
    stopListening,
    connect,
    disconnect,
    sendMessage,
    interrupt,
    switchProvider,
    setWakeWords
  };
}
