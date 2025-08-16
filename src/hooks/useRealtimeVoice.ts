"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { OpenAIRealtimeClient } from '../lib/openai-realtime-client';
import { SQUARE_TOOLS } from '../lib/mcp/square';

interface VoiceConfig {
  instructions: string;
  voice: string;
  temperature?: number;
  enableTools?: boolean;
}

interface UseRealtimeVoiceReturn {
  isConnected: boolean;
  isListening: boolean;
  transcript: string;
  response: string;
  error: string | null;
  connectionStatus: string;
  connect: (config: VoiceConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  interrupt: () => Promise<void>;
}

export function useRealtimeVoice(): UseRealtimeVoiceReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');

  const sessionRef = useRef<OpenAIRealtimeClient | null>(null);
  const responseBufferRef = useRef('');

  const handleToolCall = useCallback((toolCall: any) => {
    console.log('Tool call received:', toolCall);
    // Handle tool calls here
  }, []);

  const connect = useCallback(async (config: VoiceConfig) => {
    try {
      setError(null);
      setConnectionStatus('Connecting...');

      // Create new session
      const sessionId = `bevpro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('Creating OpenAI Realtime session:', sessionId);

      sessionRef.current = new OpenAIRealtimeClient({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''
      });

      // Set up event listeners
      sessionRef.current.on('connection.open', () => {
        console.log('Voice session connected successfully');
        setIsConnected(true);
        setConnectionStatus('Connected');
      });

      sessionRef.current.on('connection.close', () => {
        console.log('Voice session disconnected');
        setIsConnected(false);
        setIsListening(false);
        setConnectionStatus('Disconnected');
      });

      sessionRef.current.on('speech.started', () => {
        setIsListening(true);
      });

      sessionRef.current.on('speech.stopped', () => {
        setIsListening(false);
      });

      sessionRef.current.on('transcript', (text: string, isFinal: boolean) => {
        console.log('Transcript received:', text, isFinal);
        setTranscript(text);
        if (isFinal) {
          setIsListening(false);
        } else {
          setIsListening(true);
        }
      });

      sessionRef.current.on('text.delta', (delta: string) => {
        console.log('Response received:', delta);
        responseBufferRef.current += delta;
        setResponse(responseBufferRef.current);
      });

      sessionRef.current.on('response.completed', () => {
        console.log('Response completed');
        // Reset buffer for next response
        responseBufferRef.current = '';
      });

      sessionRef.current.on('tool.call', (toolCall: any) => {
        console.log('Tool call received:', toolCall);
        handleToolCall(toolCall);
      });

      sessionRef.current.on('error', (error: any) => {
        console.error('Voice session error:', error);
        setError(error.message || 'Voice session error');
      });

      // Connect to OpenAI
      await sessionRef.current.connect({
        instructions: config.instructions,
        voice: config.voice || 'alloy',
        temperature: config.temperature || 0.7,
        tools: config.enableTools ? SQUARE_TOOLS : undefined,
      });

    } catch (error: any) {
      console.error('Failed to connect voice session:', error);
      setError(error.message || 'Failed to connect');
      setConnectionStatus('Connection Failed');
      throw error;
    }
  }, [handleToolCall]);

  const disconnect = useCallback(async () => {
    try {
      if (sessionRef.current) {
        await sessionRef.current.disconnect();
        sessionRef.current = null;
      }
      setIsConnected(false);
      setIsListening(false);
      setTranscript('');
      setResponse('');
      setError(null);
      setConnectionStatus('Disconnected');
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (!sessionRef.current || !isConnected) {
      throw new Error('Not connected');
    }

    try {
      // Clear previous response
      setResponse('');
      responseBufferRef.current = '';
      
      await sessionRef.current.sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [isConnected]);

  const interrupt = useCallback(async () => {
    if (!sessionRef.current || !isConnected) return;

    try {
      await sessionRef.current.interruptResponse();
    } catch (error) {
      console.error('Failed to interrupt:', error);
    }
  }, [isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.disconnect();
      }
    };
  }, []);

  return {
    isConnected,
    isListening,
    transcript,
    response,
    error,
    connectionStatus,
    connect,
    disconnect,
    sendMessage,
    interrupt,
  };
}