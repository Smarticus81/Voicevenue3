"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { getIntentsForAgentType, recognizeIntent } from '@/lib/agent-intents';
import { useRealtimeVoice } from '@/hooks/useRealtimeVoice';

interface VoiceConfig {
  agentName: string;
  wakeWords: {
    order: string[];
    inquiry: string[];
  };
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  temperature: number;
  confidenceThreshold: number;
  responseStyle: "professional" | "friendly" | "casual";
  language: string;
  accent?: string;
}

interface ToolPermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canProcessPayments: boolean;
  canManageInventory: boolean;
  canViewAnalytics: boolean;
}

interface DeploymentSettings {
  isPublic: boolean;
  requiresAuthentication: boolean;
  allowedDomains?: string[];
  rateLimit?: {
    requestsPerMinute: number;
    burstLimit: number;
  };
  maxConcurrentSessions?: number;
}

export default function AgentDesignerPage() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editAgentId = searchParams.get('edit');

  // State
  const [step, setStep] = useState(1);
  const [agentName, setAgentName] = useState('');
  const [agentType, setAgentType] = useState<'Venue Voice' | 'Bevpro'>('Bevpro');
  const [description, setDescription] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [context, setContext] = useState('');
  
  // Voice Configuration
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    agentName: '',
    wakeWords: {
      order: ['hey bar', 'hey bars', 'hey barb', 'hey boss'],
      inquiry: ['hey bev', 'hey beth', 'hey belle', 'hey beb']
    },
    voice: 'alloy',
    temperature: 0.8,
    confidenceThreshold: 0.4,
    responseStyle: 'professional',
    language: 'en-US'
  });

  // Tool Permissions
  const [toolPermissions, setToolPermissions] = useState<ToolPermissions>({
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
    canProcessPayments: true,
    canManageInventory: true,
    canViewAnalytics: true
  });

  // Deployment Settings
  const [deploymentSettings, setDeploymentSettings] = useState<DeploymentSettings>({
    isPublic: false,
    requiresAuthentication: true,
    maxConcurrentSessions: 10
  });

  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Testing state
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testHistory, setTestHistory] = useState<Array<{message: string, response: string, timestamp: Date, type: 'text' | 'voice'}>>([]);
  
  // Voice testing state - using real voice pipeline
  const [isVoiceTesting, setIsVoiceTesting] = useState(false);
  const [voiceInput, setVoiceInput] = useState('');
  
  // Real voice pipeline integration
  const {
    isConnected,
    isListening,
    transcript,
    response: voiceResponse,
    error: voiceError,
    connectionStatus,
    connect,
    disconnect,
    sendMessage,
    interrupt
  } = useRealtimeVoice();

  // Convex mutations
  const createAgent = useMutation(api.agents.createAgent);
  const updateAgent = useMutation(api.agents.updateAgent);
  const getAgent = useQuery(api.agents.getAgent, editAgentId ? { agentId: editAgentId as any } : 'skip');

  // Load existing agent data for editing
  useEffect(() => {
    if (editAgentId && getAgent && 'name' in getAgent) {
      const agent = getAgent as any;
      setAgentName(agent.name);
      setAgentType(agent.type);
      setDescription(agent.description || '');
      setCustomInstructions(agent.customInstructions || '');
      setContext(agent.context || '');
      setVoiceConfig(agent.voiceConfig);
      setToolPermissions(agent.toolPermissions || {
        canCreate: true, canRead: true, canUpdate: true, canDelete: true,
        canProcessPayments: true, canManageInventory: true, canViewAnalytics: true
      });
      setDeploymentSettings(agent.deploymentSettings);
      setTags(agent.tags || []);
    }
  }, [editAgentId, getAgent]);

  // Update voice config when agent name changes
  useEffect(() => {
    setVoiceConfig(prev => ({
      ...prev,
      agentName: agentName
    }));
  }, [agentName]);

  // Update voice input when real voice pipeline receives response
  useEffect(() => {
    if (voiceResponse && isVoiceTesting) {
      setVoiceInput(voiceResponse);
      setTestResponse(voiceResponse);
      
      // Add to test history
      setTestHistory(prev => [...prev, {
        message: transcript || 'Voice Input',
        response: voiceResponse,
        timestamp: new Date(),
        type: 'voice'
      }]);
    }
  }, [voiceResponse, isVoiceTesting, transcript]);

  const handleCreateAgent = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError('');

    try {
      const agentData = {
        userId: user.id,
        name: agentName,
        type: agentType,
        description,
        customInstructions,
        context,
        voiceConfig,
        toolPermissions,
        deploymentSettings,
        tags
      };

      if (editAgentId) {
        await updateAgent({
          agentId: editAgentId as any,
          updates: agentData
        });
      } else {
        await createAgent(agentData);
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save agent');
    } finally {
      setIsLoading(false);
    }
  };

  // Test the agent configuration (text-based)
  const handleTestAgent = async () => {
    if (!testMessage.trim()) return;

    setIsTesting(true);
    setTestResponse('');

    try {
      // Simulate agent response based on configuration
      const response = await simulateAgentResponse(testMessage, voiceConfig, customInstructions, agentType);
      setTestResponse(response);
      
      // Add to test history
      setTestHistory(prev => [...prev, {
        message: testMessage,
        response,
        timestamp: new Date(),
        type: 'text'
      }]);
      
      setTestMessage('');
    } catch (err) {
      setTestResponse('Error: Failed to get response from agent');
    } finally {
      setIsTesting(false);
    }
  };

  // Start real voice testing
  const startVoiceTest = async () => {
    try {
      setIsVoiceTesting(true);
      setError('');

      // Connect to the real voice pipeline
      await connect({
        instructions: customInstructions || `You are a ${agentType} agent. Help users with their requests.`,
        voice: voiceConfig.voice,
        temperature: voiceConfig.temperature,
        enableTools: agentType === 'Bevpro'
      });
    } catch (err) {
      console.error('Error starting voice test:', err);
      setError('Failed to start voice recognition. Please check microphone permissions.');
    }
  };

  // Stop real voice testing
  const stopVoiceTest = async () => {
    try {
      await disconnect();
      setIsVoiceTesting(false);
    } catch (err) {
      console.error('Error stopping voice test:', err);
    }
  };

  // Send voice message to real pipeline
  const sendVoiceMessage = async () => {
    if (!voiceInput.trim()) return;

    try {
      setIsTesting(true);
      setTestResponse('');

      // Send message through real voice pipeline
      await sendMessage(voiceInput);
      
      // The response will come through the useEffect that watches voiceResponse
    } catch (err) {
      setTestResponse('Error: Failed to send message through voice pipeline');
    } finally {
      setIsTesting(false);
    }
  };

  // Simulate agent response (this would be replaced with actual OpenAI API call)
  const simulateAgentResponse = async (message: string, config: VoiceConfig, instructions: string, type: string): Promise<string> => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const lowerMessage = message.toLowerCase();
    
    // Enhanced response logic based on agent type and intents
    if (type === 'Bevpro') {
      // Check for specific intents
      if (lowerMessage.includes('margarita') || lowerMessage.includes('drink') || lowerMessage.includes('order')) {
        return `Perfect! I'll add a margarita to your order. That will be $12. Would you like anything else?`;
      }
      if (lowerMessage.includes('inventory') || lowerMessage.includes('stock') || lowerMessage.includes('check')) {
        return `I'll check the inventory for you. Let me look up the current stock levels.`;
      }
      if (lowerMessage.includes('menu') || lowerMessage.includes('drinks') || lowerMessage.includes('available')) {
        return `Here's our current menu: Cocktails (margarita, martini, old fashioned), Beer (IPA, lager, stout), Wine (red, white, rosé), and Non-alcoholic options. What would you like?`;
      }
      if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
        return `I can check prices for you. What specific drink would you like to know the price for?`;
      }
      if (lowerMessage.includes('complete') || lowerMessage.includes('finish') || lowerMessage.includes('done')) {
        return `Great! I'll complete your order now. Your total is $24. How would you like to pay?`;
      }
      if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return `Hi there! I'm ${config.agentName}, your bar assistant. How can I help you today? I can help with orders, check inventory, show the menu, and more!`;
      }
      if (lowerMessage.includes('help')) {
        return `I'm here to help! I can take drink orders, check inventory, show the menu, get prices, and complete orders. Just tell me what you need!`;
      }
    } else {
      // Venue Voice responses
      if (lowerMessage.includes('booking') || lowerMessage.includes('reserve') || lowerMessage.includes('book')) {
        return `I can help you with venue bookings! What type of event are you planning and when?`;
      }
      if (lowerMessage.includes('availability') || lowerMessage.includes('available') || lowerMessage.includes('check')) {
        return `I'll check venue availability for you. What dates and times are you looking for?`;
      }
      if (lowerMessage.includes('staff') || lowerMessage.includes('schedule')) {
        return `I can help with staff scheduling and management. What do you need assistance with?`;
      }
      if (lowerMessage.includes('vendor') || lowerMessage.includes('supplier')) {
        return `I can help coordinate with vendors and manage vendor relationships. What vendor do you need to work with?`;
      }
      if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return `Hello! I'm ${config.agentName}, your venue management assistant. I can help with bookings, staff scheduling, vendor coordination, and more!`;
      }
      if (lowerMessage.includes('help')) {
        return `I'm here to help with venue management! I can handle bookings, staff scheduling, vendor coordination, equipment management, and financial operations. What do you need?`;
      }
    }
    
    return `I understand you said: "${message}". I'm configured with a ${config.responseStyle} response style and can help you with ${type} operations. How can I assist you further?`;
  };

  const addWakeWord = (type: 'order' | 'inquiry') => {
    const newWord = prompt(`Enter new ${type} wake word:`);
    if (newWord && newWord.trim()) {
      setVoiceConfig(prev => ({
        ...prev,
        wakeWords: {
          ...prev.wakeWords,
          [type]: [...prev.wakeWords[type], newWord.trim()]
        }
      }));
    }
  };

  const removeWakeWord = (type: 'order' | 'inquiry', index: number) => {
    setVoiceConfig(prev => ({
      ...prev,
      wakeWords: {
        ...prev.wakeWords,
        [type]: prev.wakeWords[type].filter((_, i) => i !== index)
      }
    }));
  };

  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return agentName.trim() && agentType;
      case 2:
        return voiceConfig.agentName.trim() && voiceConfig.wakeWords.order.length > 0;
      case 3:
        return true; // Instructions are optional
      case 4:
        return testHistory.length > 0; // Must test at least once
      case 5:
        return true; // Review step
      default:
        return false;
    }
  };

  // Render step 1: Basic Info
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Basic Information</h3>
        <p className="text-gray-600">
          Set up the basic details for your voice agent.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agent Name *
          </label>
          <input
            type="text"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder="Enter agent name (e.g., 'Bev', 'Venue Manager')"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agent Type *
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="agentType"
                value="Bevpro"
                checked={agentType === 'Bevpro'}
                onChange={(e) => setAgentType(e.target.value as 'Venue Voice' | 'Bevpro')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Bevpro - Bar & Inventory Operations</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="agentType"
                value="Venue Voice"
                checked={agentType === 'Venue Voice'}
                onChange={(e) => setAgentType(e.target.value as 'Venue Voice' | 'Bevpro')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Venue Voice - Event Venue Management</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this agent will do..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Venue Context
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Describe your venue, business type, and specific needs..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );

  // Render step 2: Voice Configuration
  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Voice Configuration</h3>
        <p className="text-gray-600">
          Configure how your agent sounds and responds to voice commands.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voice Name
          </label>
          <input
            type="text"
            value={voiceConfig.agentName}
            onChange={(e) => setVoiceConfig(prev => ({ ...prev, agentName: e.target.value }))}
            placeholder="What should the agent call itself?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voice Style
          </label>
          <select
            value={voiceConfig.voice}
            onChange={(e) => setVoiceConfig(prev => ({ ...prev, voice: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="alloy">Alloy - Balanced and clear</option>
            <option value="echo">Echo - Warm and friendly</option>
            <option value="fable">Fable - Storytelling and engaging</option>
            <option value="onyx">Onyx - Professional and authoritative</option>
            <option value="nova">Nova - Energetic and enthusiastic</option>
            <option value="shimmer">Shimmer - Soft and gentle</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Response Style
          </label>
          <select
            value={voiceConfig.responseStyle}
            onChange={(e) => setVoiceConfig(prev => ({ ...prev, responseStyle: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="professional">Professional - Formal and business-like</option>
            <option value="friendly">Friendly - Warm and approachable</option>
            <option value="casual">Casual - Relaxed and conversational</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Temperature (Creativity) - {voiceConfig.temperature}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={voiceConfig.temperature}
            onChange={(e) => setVoiceConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Focused (0.0)</span>
            <span>Balanced (1.0)</span>
            <span>Creative (2.0)</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confidence Threshold - {voiceConfig.confidenceThreshold}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={voiceConfig.confidenceThreshold}
            onChange={(e) => setVoiceConfig(prev => ({ ...prev, confidenceThreshold: parseFloat(e.target.value) }))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Low (0.0)</span>
            <span>Medium (0.5)</span>
            <span>High (1.0)</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wake Words
          </label>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Order Wake Words</label>
              <div className="space-y-2">
                {voiceConfig.wakeWords.order.map((word, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={word}
                      onChange={(e) => {
                        const newWords = [...voiceConfig.wakeWords.order];
                        newWords[index] = e.target.value;
                        setVoiceConfig(prev => ({
                          ...prev,
                          wakeWords: { ...prev.wakeWords, order: newWords }
                        }));
                      }}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={() => removeWakeWord('order', index)}
                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addWakeWord('order')}
                  className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm border border-blue-200"
                >
                  + Add Order Wake Word
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Inquiry Wake Words</label>
              <div className="space-y-2">
                {voiceConfig.wakeWords.inquiry.map((word, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={word}
                      onChange={(e) => {
                        const newWords = [...voiceConfig.wakeWords.inquiry];
                        newWords[index] = e.target.value;
                        setVoiceConfig(prev => ({
                          ...prev,
                          wakeWords: { ...prev.wakeWords, inquiry: newWords }
                        }));
                      }}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={() => removeWakeWord('inquiry', index)}
                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addWakeWord('inquiry')}
                  className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm border border-blue-200"
                >
                  + Add Inquiry Wake Word
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render step 3: Custom Instructions
  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Custom Instructions</h3>
        <p className="text-gray-600">
          Add specific instructions and behaviors for your agent.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Instructions
          </label>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Add any specific instructions, behaviors, or personality traits for your agent..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            These instructions will be combined with the default system instructions for your agent type.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a tag"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement;
                    if (target.value.trim()) {
                      addTag(target.value.trim());
                      target.value = '';
                    }
                  }
                }}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(index)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render step 4: Test Agent
  const renderStep4 = () => {
    const intents = getIntentsForAgentType(agentType);
    const recognizedIntent = testMessage ? recognizeIntent(testMessage, intents, agentType) : null;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Test Your Voice Agent</h3>
          <p className="text-gray-600">
            Test how your agent will respond to both text and voice inputs before deploying. This helps ensure your configuration is working correctly.
          </p>
        </div>

        {/* Testing Tabs */}
        <div className="border border-gray-200 rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setIsVoiceTesting(false)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  !isVoiceTesting
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Text Testing
              </button>
              <button
                onClick={() => setIsVoiceTesting(true)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  isVoiceTesting
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Voice Testing
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Text Testing Interface */}
            {!isVoiceTesting && (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Type a test message (e.g., 'Hello', 'Help me order drinks')"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleTestAgent()}
                  />
                  <button
                    onClick={handleTestAgent}
                    disabled={!testMessage.trim() || isTesting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isTesting ? 'Testing...' : 'Test'}
                  </button>
                </div>

                {/* Intent Recognition Display */}
                {testMessage && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-3">Intent Recognition:</h4>
                    <p className="text-gray-700 mb-2">
                      Test message: <strong>{testMessage}</strong>
                    </p>
                    {recognizedIntent ? (
                      <>
                        <p className="text-gray-700 mb-1">
                          Recognized Intent: <strong>{recognizedIntent.intent}</strong>
                        </p>
                        <p className="text-gray-700 mb-1">
                          Confidence: <strong>{recognizedIntent.confidence.toFixed(2)}</strong>
                        </p>
                        {Object.keys(recognizedIntent.entities).length > 0 && (
                          <p className="text-gray-700">
                            Entities: <strong>{JSON.stringify(recognizedIntent.entities)}</strong>
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-700">
                        <strong>No intent recognized</strong> - Try a different phrase
                      </p>
                    )}
                  </div>
                )}

                {/* Test Response */}
                {testResponse && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Agent Response:</h4>
                    <p className="text-gray-700">{testResponse}</p>
                  </div>
                )}
              </div>
            )}

            {/* Voice Testing Interface */}
            {isVoiceTesting && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="mb-4">
                    <button
                      onClick={isConnected ? (isListening ? stopVoiceTest : startVoiceTest) : startVoiceTest}
                      disabled={isTesting}
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-medium transition-all ${
                        isConnected && isListening
                          ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                          : isConnected
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-blue-500 hover:bg-blue-600'
                      } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                    >
                      {isConnected && isListening ? (
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                      ) : (
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      )}
                    </button>
                    <p className="text-sm text-gray-600 mt-2">
                      {!isConnected 
                        ? 'Click to connect voice pipeline' 
                        : isListening 
                        ? 'Listening... Click to stop' 
                        : 'Click to start voice recording'
                      }
                    </p>
                  </div>

                  {/* Voice Input Display */}
                  {voiceInput && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-blue-900 mb-2">Voice Input Detected:</h4>
                      <p className="text-blue-800 mb-3">{voiceInput}</p>
                      <button
                        onClick={() => sendVoiceMessage()}
                        disabled={isTesting || !voiceInput.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {isTesting ? 'Processing...' : 'Send Message'}
                      </button>
                    </div>
                  )}

                  {/* Voice Pipeline Status */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Voice Pipeline Status:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          isConnected ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <p><strong>Connection:</strong> {connectionStatus}</p>
                      </div>
                      <p><strong>Listening:</strong> {isListening ? 'Yes' : 'No'}</p>
                      <p><strong>Connected:</strong> {isConnected ? 'Yes' : 'No'}</p>
                      {transcript && <p><strong>Transcript:</strong> {transcript}</p>}
                      {voiceError && <p className="text-red-600"><strong>Error:</strong> {voiceError}</p>}
                    </div>
                    
                    {/* Connection Actions */}
                    <div className="mt-4 flex gap-2">
                      {!isConnected ? (
                        <button
                          onClick={() => connect({
                            instructions: customInstructions || `You are a ${agentType} agent. Help users with their requests.`,
                            voice: voiceConfig.voice,
                            temperature: voiceConfig.temperature,
                            enableTools: agentType === 'Bevpro'
                          })}
                          disabled={isTesting}
                          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          Connect Voice Pipeline
                        </button>
                      ) : (
                        <button
                          onClick={disconnect}
                          disabled={isTesting}
                          className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          Disconnect
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Test Response */}
                  {voiceResponse && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Agent Response:</h4>
                      <p className="text-gray-700">{voiceResponse}</p>
                    </div>
                  )}
                </div>

                {/* Available Intents */}
                <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Available Intents for {agentType}:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {intents.intents.map((intent, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h5 className="font-medium text-blue-900 mb-1">{intent.intent}</h5>
                        <p className="text-sm text-blue-800">
                          Patterns: {intent.patterns.slice(0, 3).join(', ')}...
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Confidence Boost: +{intent.confidence_boost}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Test History */}
        {testHistory.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Test History:</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {testHistory.map((test, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">Test {index + 1}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        test.type === 'voice' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {test.type === 'voice' ? 'Voice' : 'Text'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {test.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-600 mb-1"><strong>You:</strong> {test.message}</p>
                    <p className="text-gray-700"><strong>Agent:</strong> {test.response}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testing Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Testing Tips:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Try different types of requests your agent will handle</li>
            <li>• Test wake words and common phrases</li>
            <li>• Verify the response style matches your preferences</li>
            <li>• Test both text and voice inputs to ensure full functionality</li>
            <li>• Test edge cases and error scenarios</li>
            <li>• For voice testing, speak clearly and use natural language</li>
            <li>• Use the intent recognition to see how well your agent understands commands</li>
          </ul>
        </div>

        {/* Voice Testing Status */}
        {isVoiceTesting && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Real Voice Pipeline Active:</h4>
            <p className="text-sm text-green-800">
              You are now testing with the actual voice pipeline that will be deployed. This includes real-time speech recognition, 
              OpenAI's voice processing, and the complete voice agent system. Speak naturally to test your agent's capabilities.
            </p>
          </div>
        )}
      </div>
    );
  };

  // Render step 5: Tool Permissions & Deployment Settings
  const renderStep5 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Tool Permissions & Deployment Settings</h3>
        <p className="text-gray-600">
          Configure what your agent can do and how it will be deployed.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-3">Tool Permissions</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h5 className="font-medium text-gray-700">Basic Operations</h5>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={toolPermissions.canCreate}
                  onChange={(e) => setToolPermissions(prev => ({ ...prev, canCreate: e.target.checked }))}
                  className="mr-2"
                />
                Create new items
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={toolPermissions.canRead}
                  onChange={(e) => setToolPermissions(prev => ({ ...prev, canRead: e.target.checked }))}
                  className="mr-2"
                />
                View and search
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={toolPermissions.canUpdate}
                  onChange={(e) => setToolPermissions(prev => ({ ...prev, canUpdate: e.target.checked }))}
                  className="mr-2"
                />
                Update existing items
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={toolPermissions.canDelete}
                  onChange={(e) => setToolPermissions(prev => ({ ...prev, canDelete: e.target.checked }))}
                  className="mr-2"
                />
                Delete items
              </label>
            </div>

            <div className="space-y-3">
              <h5 className="font-medium text-gray-700">Advanced Operations</h5>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={toolPermissions.canProcessPayments}
                  onChange={(e) => setToolPermissions(prev => ({ ...prev, canProcessPayments: e.target.checked }))}
                  className="mr-2"
                />
                Process payments
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={toolPermissions.canManageInventory}
                  onChange={(e) => setToolPermissions(prev => ({ ...prev, canManageInventory: e.target.checked }))}
                  className="mr-2"
                />
                Manage inventory
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={toolPermissions.canViewAnalytics}
                  onChange={(e) => setToolPermissions(prev => ({ ...prev, canViewAnalytics: e.target.checked }))}
                  className="mr-2"
                />
                View analytics
              </label>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-800 mb-3">Deployment Settings</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={deploymentSettings.isPublic}
                  onChange={(e) => setDeploymentSettings(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="mr-2"
                />
                Public access (no authentication required)
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={deploymentSettings.requiresAuthentication}
                  onChange={(e) => setDeploymentSettings(prev => ({ ...prev, requiresAuthentication: e.target.checked }))}
                  className="mr-2"
                />
                Require user authentication
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Concurrent Sessions
              </label>
              <input
                type="number"
                value={deploymentSettings.maxConcurrentSessions}
                onChange={(e) => setDeploymentSettings(prev => ({ ...prev, maxConcurrentSessions: parseInt(e.target.value) || 10 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render step 6: Review & Save
  const renderStep6 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Review & Save</h3>
        <p className="text-gray-600">
          Review your agent configuration before saving.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="ml-2 font-medium">{agentName}</span>
            </div>
            <div>
              <span className="text-gray-600">Type:</span>
              <span className="ml-2 font-medium">{agentType}</span>
            </div>
            <div>
              <span className="text-gray-600">Description:</span>
              <span className="ml-2 font-medium">{description || 'None'}</span>
            </div>
            <div>
              <span className="text-gray-600">Context:</span>
              <span className="ml-2 font-medium">{context || 'None'}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Voice Configuration</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Voice Name:</span>
              <span className="ml-2 font-medium">{voiceConfig.agentName}</span>
            </div>
            <div>
              <span className="text-gray-600">Voice Style:</span>
              <span className="ml-2 font-medium">{voiceConfig.voice}</span>
            </div>
            <div>
              <span className="text-gray-600">Response Style:</span>
              <span className="ml-2 font-medium">{voiceConfig.responseStyle}</span>
            </div>
            <div>
              <span className="text-gray-600">Temperature:</span>
              <span className="ml-2 font-medium">{voiceConfig.temperature}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Wake Words</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Order:</span>
              <span className="ml-2 font-medium">{voiceConfig.wakeWords.order.join(', ')}</span>
            </div>
            <div>
              <span className="text-gray-600">Inquiry:</span>
              <span className="ml-2 font-medium">{voiceConfig.wakeWords.inquiry.join(', ')}</span>
            </div>
          </div>
        </div>

        {customInstructions && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Custom Instructions</h4>
            <p className="text-sm text-gray-700">{customInstructions}</p>
          </div>
        )}

        {tags.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const steps = [
    { title: 'Basic Info', component: renderStep1 },
    { title: 'Voice Config', component: renderStep2 },
    { title: 'Instructions', component: renderStep3 },
    { title: 'Test Agent', component: renderStep4 },
    { title: 'Permissions', component: renderStep5 },
    { title: 'Review', component: renderStep6 }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {editAgentId ? 'Edit Voice Agent' : 'Create Voice Agent'}
          </h1>
          <p className="text-gray-600">
            Design and configure your voice agent for {agentType === 'Bevpro' ? 'bar and inventory operations' : 'venue management'}.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((stepItem, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index + 1 < step
                    ? 'bg-green-500 text-white'
                    : index + 1 === step
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1 < step ? '✓' : index + 1}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  index + 1 === step ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {stepItem.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    index + 1 < step ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {steps[step - 1].component()}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className={`px-4 py-2 rounded-md ${
                step === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>

            <div className="flex gap-3">
              {step < steps.length ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className={`px-6 py-2 rounded-md ${
                    canProceed()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateAgent}
                  disabled={!canProceed() || isLoading}
                  className={`px-6 py-2 rounded-md ${
                    canProceed() && !isLoading
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? 'Saving...' : editAgentId ? 'Update Agent' : 'Create Agent'}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}