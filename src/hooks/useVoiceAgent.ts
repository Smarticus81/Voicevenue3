import { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { VoiceSession } from '../../convex/voice-sessions';
import { CartItem } from '../../convex/carts';
import { CommandResponse } from '../../convex/voice-commands';

export interface VoiceAgentConfig {
  agentName: string;
  userId: string;
  wakeWords: {
    order: string[];
    inquiry: string[];
  };
  onModeChange?: (mode: string) => void;
  onCartUpdate?: (cart: CartItem[]) => void;
  onError?: (error: string) => void;
}

export interface VoiceAgentState {
  mode: 'wake_word' | 'command' | 'shutdown';
  isListening: boolean;
  isProcessing: boolean;
  currentSession: VoiceSession | null;
  cart: CartItem[];
  lastCommand: string;
  lastResponse: CommandResponse | null;
  error: string | null;
}

export const useVoiceAgent = (config: VoiceAgentConfig) => {
  // State
  const [state, setState] = useState<VoiceAgentState>({
    mode: 'wake_word',
    isListening: false,
    isProcessing: false,
    currentSession: null,
    cart: [],
    lastCommand: '',
    lastResponse: null,
    error: null
  });

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Convex mutations and queries
  const createVoiceSession = useMutation(api.voice_sessions.createVoiceSession);
  const updateVoiceSession = useMutation(api.voice_sessions.updateVoiceSession);
  const processVoiceCommand = useMutation(api.voice_commands.processVoiceCommand);
  const addToCart = useMutation(api.carts.addToCart);
  const clearCart = useMutation(api.carts.clearCart);
  const createOrder = useMutation(api.orders.createOrder);

  // Initialize voice session
  const initializeSession = useCallback(async () => {
    try {
      const session = await createVoiceSession({
        userId: config.userId,
        agentName: config.agentName
      });

      setState(prev => ({
        ...prev,
        currentSession: session,
        mode: 'wake_word'
      }));

      config.onModeChange?.('wake_word');
    } catch (error) {
      console.error('Failed to initialize voice session:', error);
      setState(prev => ({ ...prev, error: 'Failed to initialize session' }));
      config.onError?.('Failed to initialize session');
    }
  }, [createVoiceSession, config]);

  // Wake word detection
  const detectWakeWord = useCallback((text: string): { type: 'order' | 'inquiry' | null; confidence: number } => {
    const lowerText = text.toLowerCase();
    
    for (const word of config.wakeWords.order) {
      if (lowerText.includes(word)) {
        return { type: 'order', confidence: 0.9 };
      }
    }
    
    for (const word of config.wakeWords.inquiry) {
      if (lowerText.includes(word)) {
        return { type: 'inquiry', confidence: 0.9 };
      }
    }
    
    return { type: null, confidence: 0 };
  }, [config.wakeWords]);

  // Process voice command
  const processCommand = useCallback(async (text: string, confidence: number) => {
    if (!state.currentSession) return;

    setState(prev => ({ ...prev, isProcessing: true, lastCommand: text }));

    try {
      const response = await processVoiceCommand({
        sessionId: state.currentSession.id,
        command: text,
        confidence,
        mode: state.mode
      });

      setState(prev => ({
        ...prev,
        lastResponse: response,
        isProcessing: false
      }));

      // Handle response actions
      await handleResponseAction(response, text);

    } catch (error) {
      console.error('Failed to process voice command:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to process command',
        isProcessing: false
      }));
      config.onError?.('Failed to process command');
    }
  }, [state.currentSession, state.mode, processVoiceCommand, config]);

  // Handle response actions
  const handleResponseAction = useCallback(async (response: CommandResponse, originalCommand: string) => {
    if (!response.success) return;

    switch (response.action) {
      case 'wake_word_order':
      case 'wake_word_inquiry':
        setState(prev => ({ ...prev, mode: 'command' }));
        config.onModeChange?.('command');
        playWakeSound();
        break;

      case 'switch_to_wake_word':
        setState(prev => ({ ...prev, mode: 'wake_word' }));
        config.onModeChange?.('wake_word');
        break;

      case 'system_shutdown':
        setState(prev => ({ ...prev, mode: 'shutdown' }));
        config.onModeChange?.('shutdown');
        break;

      case 'add_to_cart':
        if (response.data) {
          await addItemToCart(response.data);
        }
        break;

      case 'clear_cart':
        await clearCartItems();
        break;

      case 'place_order':
        await placeOrder();
        break;

      case 'show_cart':
        // This would typically trigger UI update
        break;

      case 'navigate_inventory':
      case 'navigate_orders':
        // This would typically trigger navigation
        break;
    }
  }, [config, addToCart, clearCart, createOrder]);

  // Cart management
  const addItemToCart = useCallback(async (itemData: any) => {
    if (!state.currentSession) return;

    try {
      const result = await addToCart({
        sessionId: state.currentSession.id,
        productId: itemData.productName,
        productName: itemData.productName,
        quantity: itemData.quantity,
        unitPrice: itemData.unitPrice,
        category: 'drink'
      });

      // Update local cart state
      const newCartItem: CartItem = {
        id: result.cartItem.id,
        productId: result.cartItem.productId,
        productName: result.cartItem.productName,
        quantity: result.cartItem.quantity,
        unitPrice: result.cartItem.unitPrice,
        totalPrice: result.cartItem.totalPrice,
        category: result.cartItem.category
      };

      setState(prev => ({
        ...prev,
        cart: [...prev.cart, newCartItem]
      }));

      config.onCartUpdate?.(state.cart);
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    }
  }, [state.currentSession, addToCart, state.cart, config]);

  const clearCartItems = useCallback(async () => {
    if (!state.currentSession) return;

    try {
      await clearCart({ sessionId: state.currentSession.id });
      setState(prev => ({ ...prev, cart: [] }));
      config.onCartUpdate?.([]);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  }, [state.currentSession, clearCart, config]);

  const placeOrder = useCallback(async () => {
    if (!state.currentSession || state.cart.length === 0) return;

    try {
      const orderItems = state.cart.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        category: item.category
      }));

      const result = await createOrder({
        sessionId: state.currentSession.id,
        userId: config.userId,
        items: orderItems
      });

      // Clear cart after successful order
      setState(prev => ({ ...prev, cart: [] }));
      config.onCartUpdate?.([]);

      // Switch back to wake word mode
      setState(prev => ({ ...prev, mode: 'wake_word' }));
      config.onModeChange?.('wake_word');

    } catch (error) {
      console.error('Failed to place order:', error);
    }
  }, [state.currentSession, state.cart, createOrder, config]);

  // Audio feedback
  const playWakeSound = useCallback(() => {
    // Play a pleasant wake sound
    if (audioContextRef.current) {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
      oscillator.frequency.setValueAtTime(1200, audioContextRef.current.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.2);
      
      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 0.2);
    }
  }, []);

  // Start listening
  const startListening = useCallback(async () => {
    try {
      // Initialize audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Request microphone access
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setState(prev => ({ ...prev, isListening: true }));
      
      // Start wake word detection
      // This would integrate with your existing voice recognition system
      
    } catch (error) {
      console.error('Failed to start listening:', error);
      setState(prev => ({ ...prev, error: 'Failed to start listening' }));
      config.onError?.('Failed to start listening');
    }
  }, [config]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setState(prev => ({ ...prev, isListening: false }));
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      stopListening();
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, [stopListening]);

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  return {
    // State
    ...state,
    
    // Actions
    startListening,
    stopListening,
    processCommand,
    
    // Cart actions
    addItemToCart,
    clearCartItems,
    placeOrder,
    
    // Session management
    initializeSession,
    
    // Utility
    playWakeSound
  };
};
