"use client";

import { useState, useEffect, useRef, memo } from 'react';
import { useEnhancedVoice } from '@/hooks/useEnhancedVoice';
import { motion, AnimatePresence } from 'framer-motion';

interface MinimalistVoiceInterfaceProps {
  agentName: string;
  agentType: 'Event Venue' | 'Venue Bar';
  primaryColor?: string;
  onboardingComplete?: boolean;
}

const MinimalistVoiceInterface = memo(({
  agentName,
  agentType,
  primaryColor = '#10a37f',
  onboardingComplete = false
}: MinimalistVoiceInterfaceProps) => {
  const [showInterface, setShowInterface] = useState(false);
  const [voiceProvider, setVoiceProvider] = useState('elevenlabs');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [wakeWords, setWakeWords] = useState(['hey bev', 'hey venue']);
  const visualizerRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  const {
    isConnected,
    isListening,
    mode,
    transcript,
    response,
    error,
    connectionStatus,
    availableVoices,
    currentProvider,
    startListening,
    stopListening,
    connect,
    disconnect,
    sendMessage,
    interrupt,
    switchProvider,
    setWakeWords: updateWakeWords
  } = useEnhancedVoice();

  // Initialize connection on mount
  useEffect(() => {
    if (onboardingComplete && !isConnected) {
      const initializeVoice = async () => {
        await connect({
          agentName,
          wakeWords: agentType === 'Venue Bar' ? ['hey bar', 'hey bartender'] : wakeWords,
          provider: voiceProvider as any,
          voice: selectedVoice || 'alloy',
          instructions: `You are ${agentName}, a professional ${agentType} assistant. Be helpful, concise, and friendly.`,
          temperature: 0.7,
          enableTools: true,
          elevenLabsApiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
          googleApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
          playhtApiKey: process.env.NEXT_PUBLIC_PLAYHT_API_KEY,
          playhtUserId: process.env.NEXT_PUBLIC_PLAYHT_USER_ID
        });
      };
      initializeVoice();
    }
  }, [onboardingComplete]);

  // Audio visualizer
  useEffect(() => {
    if (!isListening || !visualizerRef.current) return;

    const canvas = visualizerRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw minimalist waveform
      const bars = 5;
      const barWidth = canvas.width / bars;
      
      for (let i = 0; i < bars; i++) {
        const height = Math.random() * canvas.height * 0.7 + canvas.height * 0.15;
        const x = i * barWidth + barWidth / 4;
        const y = (canvas.height - height) / 2;
        
        ctx.fillStyle = mode === 'command' ? primaryColor : '#94a3b8';
        ctx.fillRect(x, y, barWidth / 2, height);
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isListening, mode, primaryColor]);

  const handleStartListening = async () => {
    if (!isConnected) {
      await connect({
        agentName,
        wakeWords,
        provider: voiceProvider as any,
        voice: selectedVoice || 'alloy',
        instructions: `You are ${agentName}, a professional ${agentType} assistant.`,
        temperature: 0.7,
        enableTools: true,
        elevenLabsApiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
        googleApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
        playhtApiKey: process.env.NEXT_PUBLIC_PLAYHT_API_KEY,
        playhtUserId: process.env.NEXT_PUBLIC_PLAYHT_USER_ID
      });
    }
    
    if (mode === 'shutdown') {
      await startListening();
    } else {
      stopListening();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowInterface(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
        }}
      >
        <svg className="w-7 h-7 text-white mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        {isListening && (
          <motion.div
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 rounded-full border-2 border-white opacity-50"
          />
        )}
      </motion.button>

      {/* Main Interface Modal */}
      <AnimatePresence>
        {showInterface && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowInterface(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {agentName}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {connectionStatus}
                  </p>
                </div>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>

              {/* Settings Panel */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mb-6 overflow-hidden"
                  >
                    <div className="space-y-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                      {/* Voice Provider Selection */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                          Voice Provider
                        </label>
                        <select
                          value={voiceProvider}
                          onChange={(e) => {
                            setVoiceProvider(e.target.value);
                            switchProvider(e.target.value);
                          }}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
                          style={{ outlineColor: primaryColor }}
                        >
                          <option value="elevenlabs">Eleven Labs (Premium)</option>
                          <option value="google">Google Cloud</option>
                          <option value="playht">Play.ht</option>
                          <option value="openai">OpenAI</option>
                        </select>
                      </div>

                      {/* Voice Selection */}
                      {availableVoices.length > 0 && (
                        <div>
                          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                            Voice
                          </label>
                          <select
                            value={selectedVoice}
                            onChange={(e) => setSelectedVoice(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
                          >
                            {availableVoices
                              .filter(v => v.provider === currentProvider)
                              .map(voice => (
                                <option key={voice.id} value={voice.id}>
                                  {voice.name} ({voice.gender})
                                </option>
                              ))}
                          </select>
                        </div>
                      )}

                      {/* Wake Words */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                          Wake Words
                        </label>
                        <input
                          type="text"
                          value={wakeWords.join(', ')}
                          onChange={(e) => {
                            const words = e.target.value.split(',').map(w => w.trim());
                            setWakeWords(words);
                            updateWakeWords(words);
                          }}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
                          placeholder="hey bev, hey venue"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Voice Visualizer */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <button
                    onClick={handleStartListening}
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                      mode === 'command' 
                        ? 'bg-gradient-to-br from-green-400 to-green-500' 
                        : mode === 'wake_word'
                        ? 'bg-gradient-to-br from-blue-400 to-blue-500'
                        : 'bg-gradient-to-br from-gray-400 to-gray-500'
                    } ${isListening ? 'animate-pulse' : ''}`}
                  >
                    {mode === 'shutdown' ? (
                      <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    ) : (
                      <canvas
                        ref={visualizerRef}
                        width={60}
                        height={60}
                        className="opacity-80"
                      />
                    )}
                  </button>
                  
                  {/* Mode Indicator */}
                  <div className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium ${
                    mode === 'command' ? 'text-green-600' : 
                    mode === 'wake_word' ? 'text-blue-600' : 
                    'text-gray-500'
                  }`}>
                    {mode === 'command' ? 'Listening...' : 
                     mode === 'wake_word' ? `Say "${wakeWords[0]}"` : 
                     'Tap to Start'}
                  </div>
                </div>
              </div>

              {/* Transcript & Response */}
              <div className="space-y-3 mt-8">
                {transcript && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">You said:</p>
                    <p className="text-sm text-gray-900 dark:text-white">{transcript}</p>
                  </motion.div>
                )}
                
                {response && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <p className="text-xs font-medium mb-1" style={{ color: primaryColor }}>
                      {agentName}:
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">{response}</p>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                  >
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </motion.div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 grid grid-cols-2 gap-2">
                <button
                  onClick={() => sendMessage("What can you help me with?")}
                  className="px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Help
                </button>
                <button
                  onClick={() => sendMessage("Show me today's schedule")}
                  className="px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Schedule
                </button>
                <button
                  onClick={() => sendMessage("Check inventory")}
                  className="px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Inventory
                </button>
                <button
                  onClick={interrupt}
                  className="px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Stop
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowInterface(false)}
                className="absolute top-4 right-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

MinimalistVoiceInterface.displayName = 'MinimalistVoiceInterface';

export default MinimalistVoiceInterface;
