"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mic, Settings, Sparkles, Upload, ChevronRight, Check, Eye, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';

// Voice testing functions for different providers
const testElevenLabsVoice = async (text: string, voiceId: string) => {
  try {
    console.log('Eleven Labs voice test:', { text, voiceId });
    
    // Call the test API endpoint
    const response = await fetch('/api/test-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'elevenlabs',
        text,
        voiceId,
        apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || ''
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Eleven Labs test result:', result);
      
      // For now, use browser TTS as fallback since we don't have actual API keys
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
      }
    } else {
      throw new Error('Eleven Labs API call failed');
          }
        } catch (error) {
    console.error('Eleven Labs test failed:', error);
    // Fallback to browser TTS
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  }
};

const testGoogleVoice = async (text: string, voiceId: string) => {
  try {
    console.log('Google Cloud voice test:', { text, voiceId });
    
    const response = await fetch('/api/test-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'google',
        text,
        voiceId,
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || ''
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Google Cloud test result:', result);
      
      // For now, use browser TTS as fallback
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
      }
    } else {
      throw new Error('Google Cloud API call failed');
    }
  } catch (error) {
    console.error('Google Cloud test failed:', error);
    // Fallback to browser TTS
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  }
};

const testPlayHTVoice = async (text: string, voiceId: string) => {
  try {
    console.log('Play.ht voice test:', { text, voiceId });
    
    const response = await fetch('/api/test-voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
        provider: 'playht',
        text,
        voiceId,
        apiKey: process.env.NEXT_PUBLIC_PLAYHT_API_KEY || ''
            })
          });

    if (response.ok) {
      const result = await response.json();
      console.log('Play.ht test result:', result);
      
      // For now, use browser TTS as fallback
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
      }
          } else {
      throw new Error('Play.ht API call failed');
    }
  } catch (error) {
    console.error('Play.ht test failed:', error);
    // Fallback to browser TTS
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  }
};

const testOpenAIVoice = async (text: string, voiceId: string) => {
  try {
    console.log('OpenAI voice test:', { text, voiceId });
    
    // Check if OpenAI API key is available
    const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.log('No OpenAI API key found, using browser TTS fallback');
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
      }
      return;
    }

    // Call the test API endpoint for OpenAI
    const response = await fetch('/api/test-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'openai',
        text,
        voiceId,
        apiKey: openaiApiKey
      })
    });
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('audio/')) {
        // We got audio back - play it
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl); // Clean up
        };
        
        audio.play();
        console.log(`Playing OpenAI ${voiceId} voice`);
      } else {
        // We got a JSON response (demo mode or error)
        const result = await response.json();
        console.log('OpenAI test result:', result);
        
        if (result.success) {
          // Demo mode - use browser TTS
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            speechSynthesis.speak(utterance);
          }
        } else {
          throw new Error(result.error || 'OpenAI test failed');
        }
      }
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'OpenAI API call failed');
    }
  } catch (error) {
    console.error('OpenAI test failed:', error);
    // Fallback to browser TTS
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  }
};

interface AgentConfig {
  name: string;
  type: 'Event Venue' | 'Venue Bar' | 'Venue Voice';
  description: string;
  instructions: string;
  voiceConfig: {
    provider: string;
    voice: string;
    wakeWords: string[];
    temperature: number;
    enableTools: boolean;
  };
  customization: {
    primaryColor: string;
    secondaryColor: string;
    layoutStyle: string;
    theme: string;
    components: string[];
    specialFeatures: string[];
  };
}

export default function AgentDesigner() {
  const { user } = useUser();
  const router = useRouter();
  const createAgent = useMutation(api.agents.createAgent);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    name: '',
    type: 'Event Venue',
    description: '',
    instructions: '',
    voiceConfig: {
      provider: 'openai',
      voice: 'alloy',
      wakeWords: ['hey bev', 'hey venue'],
      temperature: 0.7,
      enableTools: true
    },
    customization: {
      primaryColor: '#10a37f',
      secondaryColor: '#059669',
      layoutStyle: 'modern',
      theme: 'professional',
      components: ['voice-interface', 'data-display'],
      specialFeatures: ['wake-word', 'multi-turn']
    }
  });

  const steps = [
    { id: 1, title: 'Basic Info', description: 'Agent name and type' },
    { id: 2, title: 'Voice Setup', description: 'Voice provider and settings' },
    { id: 3, title: 'Customization', description: 'UI and branding' },
    { id: 4, title: 'Deploy', description: 'Review and launch' }
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateAgent = async () => {
    if (!user?.id) return;

    try {
      console.log('Creating agent with config:', agentConfig);
      
      // Create agent using Convex mutation
      const agentId = await createAgent({
        userId: user.id, // Pass userId temporarily until JWT auth is set up
        name: agentConfig.name,
        type: agentConfig.type as any,
        description: agentConfig.description,
        customInstructions: agentConfig.instructions,
        context: agentConfig.voiceConfig.enableTools ? 'tools' : 'no-tools',
        voiceConfig: {
          agentName: agentConfig.name,
          voice: agentConfig.voiceConfig.voice,
          temperature: agentConfig.voiceConfig.temperature,
          responseStyle: "professional" as const,
          confidenceThreshold: 0.8,
          wakeWords: {
            order: Array.isArray(agentConfig.voiceConfig.wakeWords) ? agentConfig.voiceConfig.wakeWords : [],
            inquiry: Array.isArray(agentConfig.voiceConfig.wakeWords) ? agentConfig.voiceConfig.wakeWords : [],
          },
        },
        toolPermissions: {
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
          canProcessPayments: true,
          canManageInventory: true,
          canViewAnalytics: true,
        },
        deploymentSettings: {
          requiresAuthentication: true,
          maxConcurrentSessions: 10,
          sessionTimeout: 3600,
          enablePWA: true,
          enableOfflineMode: false,
        },
        tags: [agentConfig.type.toLowerCase().replace(' ', '-')],
      });
      
      console.log('Agent created successfully with ID:', agentId);
      
      // Show success message
      const voiceNames = {
        'alloy': 'Alloy',
        'echo': 'Echo', 
        'fable': 'Fable',
        'onyx': 'Onyx',
        'nova': 'Nova',
        'shimmer': 'Shimmer'
      };
      
      const selectedVoice = voiceNames[agentConfig.voiceConfig.voice as keyof typeof voiceNames] || 'Alloy';
      const providerInfo = agentConfig.voiceConfig.provider === 'openai' 
        ? ` (OpenAI WebRTC Realtime with ${selectedVoice} voice)` 
        : ` (${agentConfig.voiceConfig.provider} with ${selectedVoice} voice)`;
      
      alert(`Agent "${agentConfig.name}" created successfully with ${agentConfig.voiceConfig.provider} voice pipeline${providerInfo}!`);
      
      // Redirect to deployment page
      router.push(`/dashboard/deploy?agentId=${agentId}`);
      
    } catch (error) {
      console.error('Failed to create agent:', error);
      alert('Failed to create agent. Please try again.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Progress Steps */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    currentStep >= step.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.id
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      {step.description}
        </p>
      </div>
          </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    currentStep > step.id
                      ? 'bg-emerald-500'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Create Your Voice Agent
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Start by giving your agent a name and choosing its type
                </p>
              </div>

              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-slate-200/60 dark:border-slate-700/60">
                <div className="space-y-6">
        <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Agent Name
          </label>
          <input
            type="text"
                      value={agentConfig.name}
                      onChange={(e) => setAgentConfig({ ...agentConfig, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="e.g., Venue Assistant, Bar Manager"
          />
        </div>

        <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Agent Type
          </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 'Event Venue', icon: '🎪', description: 'Event management and coordination' },
                        { id: 'Venue Bar', icon: '🍸', description: 'Bar service and drink orders' },
                        { id: 'Venue Voice', icon: '🎤', description: 'General venue assistance' }
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setAgentConfig({ ...agentConfig, type: type.id as any })}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            agentConfig.type === type.id
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="text-2xl mb-2">{type.icon}</div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{type.id}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{type.description}</div>
                        </button>
                      ))}
          </div>
        </div>
              
        <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Description
          </label>
          <textarea
                      value={agentConfig.description}
                      onChange={(e) => setAgentConfig({ ...agentConfig, description: e.target.value })}
            rows={3}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="Describe what your agent will do..."
          />
        </div>
        </div>
      </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Voice Configuration
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Choose your voice provider and customize settings
        </p>
      </div>

              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-slate-200/60 dark:border-slate-700/60">
                <div className="space-y-6">
        <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Voice Provider
          </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { id: 'openai', name: 'OpenAI', description: 'Latest GPT-4o voice', premium: true },
                        { id: 'elevenlabs', name: 'Eleven Labs', description: 'Premium quality voices', premium: true },
                        { id: 'google', name: 'Google Cloud', description: 'Reliable and fast' },
                        { id: 'playht', name: 'Play.ht', description: 'Natural and expressive' }
                      ].map((provider) => (
                        <button
                          key={provider.id}
                          onClick={() => setAgentConfig({
                            ...agentConfig,
                            voiceConfig: { ...agentConfig.voiceConfig, provider: provider.id }
                          })}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            agentConfig.voiceConfig.provider === provider.id
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{provider.name}</div>
                            {provider.premium && (
                              <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full">
                                Premium
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">{provider.description}</div>
                        </button>
                      ))}
                    </div>
        </div>

        <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Voice Selection
          </label>
                    {agentConfig.voiceConfig.voice && (
                      <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          Selected Voice: {agentConfig.voiceConfig.voice.charAt(0).toUpperCase() + agentConfig.voiceConfig.voice.slice(1)}
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                          {agentConfig.voiceConfig.provider === 'openai' ? 'OpenAI WebRTC Realtime' : agentConfig.voiceConfig.provider}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { id: 'alloy', name: 'Alloy', description: 'Balanced and natural', gender: 'neutral' },
                        { id: 'echo', name: 'Echo', description: 'Warm and friendly', gender: 'male' },
                        { id: 'fable', name: 'Fable', description: 'Clear and professional', gender: 'female' },
                        { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative', gender: 'male' },
                        { id: 'nova', name: 'Nova', description: 'Bright and energetic', gender: 'female' },
                        { id: 'shimmer', name: 'Shimmer', description: 'Smooth and melodic', gender: 'female' }
                      ].map((voice) => (
                        <button
                          key={voice.id}
                          onClick={() => setAgentConfig({
                            ...agentConfig,
                            voiceConfig: { ...agentConfig.voiceConfig, voice: voice.id }
                          })}
                          className={`p-3 rounded-xl border-2 transition-all text-left ${
                            agentConfig.voiceConfig.voice === voice.id
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{voice.name}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{voice.description}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-500 mt-1 capitalize">{voice.gender}</div>
                          {agentConfig.voiceConfig.voice === voice.id && (
                            <div className="mt-2">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  // Test voice selection with actual provider
                                  const testMessage = `Hello, I'm ${voice.name}. This is a test of the ${voice.description} voice.`;
                                  
                                  try {
                                    if (agentConfig.voiceConfig.provider === 'openai') {
                                      // Use OpenAI WebRTC for testing
                                      console.log('Testing OpenAI voice:', voice.id);
                                      await testOpenAIVoice(testMessage, voice.id);
                                    } else if (agentConfig.voiceConfig.provider === 'elevenlabs') {
                                      // Test Eleven Labs voice
                                      console.log('Testing Eleven Labs voice:', voice.id);
                                      await testElevenLabsVoice(testMessage, voice.id);
                                    } else if (agentConfig.voiceConfig.provider === 'google') {
                                      // Test Google Cloud voice
                                      console.log('Testing Google Cloud voice:', voice.id);
                                      await testGoogleVoice(testMessage, voice.id);
                                    } else if (agentConfig.voiceConfig.provider === 'playht') {
                                      // Test Play.ht voice
                                      console.log('Testing Play.ht voice:', voice.id);
                                      await testPlayHTVoice(testMessage, voice.id);
                                    } else {
                                      // Fallback to browser TTS
                                      if ('speechSynthesis' in window) {
                                        const utterance = new SpeechSynthesisUtterance(testMessage);
                                        utterance.rate = 0.9;
                                        utterance.pitch = 1;
                                        speechSynthesis.speak(utterance);
                                      }
                                    }
                                  } catch (error) {
                                    console.error('Voice test failed:', error);
                                    // Fallback to browser TTS
                                    if ('speechSynthesis' in window) {
                                      const utterance = new SpeechSynthesisUtterance(testMessage);
                                      utterance.rate = 0.9;
                                      utterance.pitch = 1;
                                      speechSynthesis.speak(utterance);
                                    }
                                  }
                                }}
                                className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-full hover:bg-emerald-600 transition-colors"
                              >
                                Test Voice
                              </button>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
        </div>

        <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Wake Words
          </label>
                    <input
                      type="text"
                      value={Array.isArray(agentConfig.voiceConfig.wakeWords) ? agentConfig.voiceConfig.wakeWords.join(', ') : ''}
                      onChange={(e) => setAgentConfig({
                        ...agentConfig,
                        voiceConfig: {
                          ...agentConfig.voiceConfig,
                          wakeWords: e.target.value.split(',').map(w => w.trim()).filter(w => w)
                        }
                      })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="hey bev, hey venue"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      Separate multiple wake words with commas
                    </p>
        </div>

        <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Temperature (Creativity)
          </label>
          <input
            type="range"
            min="0"
                      max="1"
            step="0.1"
                      value={agentConfig.voiceConfig.temperature}
                      onChange={(e) => setAgentConfig({
                        ...agentConfig,
                        voiceConfig: { ...agentConfig.voiceConfig, temperature: parseFloat(e.target.value) }
                      })}
            className="w-full"
          />
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-500 mt-1">
                      <span>Focused</span>
                      <span>{agentConfig.voiceConfig.temperature}</span>
                      <span>Creative</span>
          </div>
        </div>
      </div>
    </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Customize Appearance
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Choose colors and styling for your agent
        </p>
      </div>

              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-slate-200/60 dark:border-slate-700/60">
                <div className="space-y-6">
        <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Primary Color
          </label>
                    <div className="grid grid-cols-6 gap-3">
                      {['#10a37f', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4'].map((color) => (
                        <button
                          key={color}
                          onClick={() => setAgentConfig({
                            ...agentConfig,
                            customization: { ...agentConfig.customization, primaryColor: color }
                          })}
                          className={`w-12 h-12 rounded-xl border-2 transition-all ${
                            agentConfig.customization.primaryColor === color
                              ? 'border-slate-900 dark:border-white scale-110'
                              : 'border-slate-200 dark:border-slate-700 hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
        </div>
      </div>

      <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Theme Style
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 'modern', name: 'Modern', description: 'Clean and minimal' },
                        { id: 'professional', name: 'Professional', description: 'Business focused' },
                        { id: 'playful', name: 'Playful', description: 'Fun and engaging' }
                      ].map((theme) => (
            <button
                          key={theme.id}
                          onClick={() => setAgentConfig({
                            ...agentConfig,
                            customization: { ...agentConfig.customization, theme: theme.id }
                          })}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            agentConfig.customization.theme === theme.id
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{theme.name}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{theme.description}</div>
            </button>
                      ))}
          </div>
            </div>
              </div>
            </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Ready to Deploy
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Review your agent configuration and launch
                </p>
          </div>

              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-slate-200/60 dark:border-slate-700/60">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Agent Details</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Name:</span>
                          <p className="text-slate-900 dark:text-white">{agentConfig.name}</p>
            </div>
                        <div>
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Type:</span>
                          <p className="text-slate-900 dark:text-white">{agentConfig.type}</p>
        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Description:</span>
                          <p className="text-slate-900 dark:text-white">{agentConfig.description}</p>
          </div>
      </div>
    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Voice Settings</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Provider:</span>
                          <p className="text-slate-900 dark:text-white capitalize">{agentConfig.voiceConfig.provider}</p>
      </div>
                        <div>
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Voice:</span>
                          <p className="text-slate-900 dark:text-white capitalize">{agentConfig.voiceConfig.voice}</p>
    </div>
                        <div>
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Wake Words:</span>
                          <p className="text-slate-900 dark:text-white">{Array.isArray(agentConfig.voiceConfig.wakeWords) ? agentConfig.voiceConfig.wakeWords.join(', ') : ''}</p>
            </div>
            <div>
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Temperature:</span>
                          <p className="text-slate-900 dark:text-white">{agentConfig.voiceConfig.temperature}</p>
            </div>
          </div>
                    </div>
        </div>

                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
                    <button
                      onClick={() => setShowPreview(true)}
                      className="w-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 px-6 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <Eye className="w-5 h-5" />
                      <span>Preview Agent Interface</span>
                    </button>
                    
                    <button
                      onClick={handleCreateAgent}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <Sparkles className="w-5 h-5" />
                      <span>Create and Deploy Agent</span>
                    </button>
                  </div>
                </div>
            </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8">
            <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            currentStep === 1
              ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Back
            </button>

                <button
                  onClick={handleNext}
          disabled={currentStep === 4}
          className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center space-x-2 ${
            currentStep === 4
              ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
              : 'text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg'
          }`}
        >
          <span>{currentStep === 4 ? 'Complete' : 'Next'}</span>
          {currentStep < 4 && <ChevronRight className="w-4 h-4" />}
                </button>
      </div>

      {/* Agent Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Agent Preview</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">How your agent will look when deployed</p>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-hidden">
                <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
                  {/* Agent Header */}
                  <header className="bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700">
                    <div className="max-w-4xl mx-auto px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                            style={{ background: `linear-gradient(135deg, ${agentConfig.customization.primaryColor}, ${agentConfig.customization.secondaryColor})` }}
                          >
                            {agentConfig.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                              {agentConfig.name || 'Your Agent'}
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {agentConfig.type} Voice Agent
                            </p>
                          </div>
                        </div>
                        
                        {/* Voice Control Button */}
                        <button
                          className="relative p-4 rounded-full transition-all duration-300 text-white hover:opacity-90"
                          style={{ 
                            background: `linear-gradient(135deg, ${agentConfig.customization.primaryColor}, ${agentConfig.customization.secondaryColor})` 
                          }}
                        >
                          <Mic className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  </header>

                  {/* Main Content */}
                  <main className="max-w-4xl mx-auto px-4 py-8">
                    {/* Voice Status */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse"></div>
                        <p className="text-blue-800 dark:text-blue-200 font-medium">
                          Say "{Array.isArray(agentConfig.voiceConfig.wakeWords) && agentConfig.voiceConfig.wakeWords.length > 0 ? agentConfig.voiceConfig.wakeWords[0] : 'Hey Assistant'}" to activate
                        </p>
                      </div>
                    </div>

                    {/* Sample Conversation */}
                    <div className="space-y-4 mb-6">
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">You said:</h3>
                        <p className="text-gray-700 dark:text-gray-300">"What can you help me with today?"</p>
                      </div>

                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Agent Response:</h3>
                        <p className="text-gray-700 dark:text-gray-300">
                          "Hello! I'm your {agentConfig.type.toLowerCase()} assistant. I can help you with {agentConfig.description || 'managing your venue, handling bookings, and providing customer support'}. Just let me know what you need!"
                        </p>
                      </div>
                    </div>

                    {/* Agent Info */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        About {agentConfig.name || 'Your Agent'}
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">{agentConfig.type}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Description:</span>
                          <p className="mt-1 text-gray-600 dark:text-gray-400">
                            {agentConfig.description || 'A professional voice assistant for managing your business operations.'}
                          </p>
                        </div>
                        {agentConfig.instructions && (
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Instructions:</span>
                            <p className="mt-1 text-gray-600 dark:text-gray-400">{agentConfig.instructions}</p>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Voice:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400 capitalize">{agentConfig.voiceConfig.voice}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Wake Words:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            {Array.isArray(agentConfig.voiceConfig.wakeWords) ? agentConfig.voiceConfig.wakeWords.join(', ') : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* PWA Install Prompt */}
                    <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-700 rounded-lg p-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Add to Home Screen
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          Install this app on your device for the best experience
                        </p>
                        <div className="flex justify-center space-x-4">
                          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            Install App
                          </button>
                          <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                            Share
                          </button>
                        </div>
                      </div>
                    </div>
                  </main>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Close Preview
                  </button>
                  <button
                    onClick={handleCreateAgent}
                    className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                  >
                    Deploy Agent
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
              </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}