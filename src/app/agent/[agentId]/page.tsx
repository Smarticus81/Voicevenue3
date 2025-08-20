"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import convexApi from '@/lib/convex-api';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';

export default function AgentPWAPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  
  const [agent, setAgent] = useState<any>(null);
  const [deployment, setDeployment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  // Fetch agent data
  useEffect(() => {
    
    const fetchAgent = async () => {
      try {
        setLoading(true);
        
        // Handle undefined or invalid agentId
        if (!agentId || agentId === 'undefined') {
          // Try to get mock agent from localStorage
          const mockAgent = localStorage.getItem('mockAgent');
          if (mockAgent) {
            const parsedAgent = JSON.parse(mockAgent);
            setAgent(parsedAgent);
            setDeployment({
              _id: localStorage.getItem('mockDeploymentId') || 'deploy_mock',
              status: 'active',
              deploymentType: 'pwa',
            });
            setLoading(false);
            return;
          } else {
            throw new Error('Agent not found');
          }
        }
        
        // Check if this is a mock agent
        if (agentId.startsWith('mock_')) {
          const mockAgent = localStorage.getItem('mockAgent');
          if (mockAgent) {
            const parsedAgent = JSON.parse(mockAgent);
            setAgent(parsedAgent);
            setDeployment({
              _id: localStorage.getItem('mockDeploymentId') || 'deploy_mock',
              status: 'active',
              deploymentType: 'pwa',
            });
            setLoading(false);
            return;
          }
        }
        
        // Try to fetch from Convex
        try {
          const agentData = await convexApi.getUserAgents(agentId);
          if (agentData && agentData.length > 0) {
            setAgent(agentData[0]);
          }
          
          const deploymentData = await convexApi.getAgentDeployments(agentId);
          if (deploymentData && deploymentData.length > 0) {
            setDeployment(deploymentData[0]);
          }
        } catch (convexErr) {
          console.error('Convex API failed:', convexErr);
          // Try mock data as fallback
          const mockAgent = localStorage.getItem('mockAgent');
          if (mockAgent) {
            const parsedAgent = JSON.parse(mockAgent);
            setAgent(parsedAgent);
            setDeployment({
              _id: localStorage.getItem('mockDeploymentId') || 'deploy_mock',
              status: 'active',
              deploymentType: 'pwa',
            });
          } else {
            throw new Error('Agent not found');
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching agent:', err);
        setError('Agent not found');
        setLoading(false);
      }
    };

    if (agentId) {
      fetchAgent();
    }
  }, [agentId]);

  // Voice recognition setup
  useEffect(() => {
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        processVoiceCommand(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      // Store recognition for use
      (window as any).speechRecognition = recognition;
    }
  }, []);

  const toggleVoice = () => {
    const recognition = (window as any).speechRecognition;
    if (recognition) {
      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    }
  };

  const processVoiceCommand = async (command: string) => {
    try {
      setResponse('Processing...');
      
      const apiResponse = await fetch('/api/agent-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agentId,
          deploymentId: deployment?._id,
          message: command,
          type: 'voice'
        })
      });

      if (apiResponse.ok) {
        const result = await apiResponse.json();
        setResponse(result.response);
      } else {
        setResponse('Sorry, I encountered an error. Please try again.');
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      setResponse('Sorry, I encountered an error. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your voice agent...</p>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900 dark:to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Agent Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error || 'The requested agent could not be loaded.'}</p>
          <a 
            href="/" 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* PWA Header */}
      <header className="bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                   <span className="text-white font-bold text-lg">
                     {agent.name.charAt(0)}
                   </span>
                 </div>
                 <div>
                   <h1 className="text-xl font-bold text-gray-900 dark:text-white">{agent.name}</h1>
                   <p className="text-sm text-gray-600 dark:text-gray-300">{agent.type} Voice Agent</p>
                 </div>
               </div>
            
            {/* Voice Control */}
            <button
              onClick={toggleVoice}
              className={`relative p-4 rounded-full transition-all duration-300 ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isListening ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                )}
              </svg>
              {isListening && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-400 rounded-full animate-ping"></span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
                 {/* Voice Status */}
         {isListening && (
           <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
             <div className="flex items-center space-x-3">
               <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse"></div>
               <p className="text-blue-800 dark:text-blue-200 font-medium">Listening... Speak now</p>
             </div>
           </div>
         )}

         {/* Transcript */}
         {transcript && (
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">You said:</h3>
             <p className="text-gray-700 dark:text-gray-300">{transcript}</p>
           </div>
         )}

         {/* Response */}
         {response && (
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Agent Response:</h3>
             <p className="text-gray-700 dark:text-gray-300">{response}</p>
           </div>
         )}

         {/* Agent Info */}
         <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
           <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About {agent.name}</h3>
           <div className="space-y-3">
             <div>
               <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
               <span className="ml-2 text-gray-600 dark:text-gray-400">{agent.type}</span>
             </div>
             <div>
               <span className="font-medium text-gray-700 dark:text-gray-300">Description:</span>
               <p className="mt-1 text-gray-600 dark:text-gray-400">{agent.description}</p>
             </div>
             {agent.customInstructions && (
               <div>
                 <span className="font-medium text-gray-700 dark:text-gray-300">Instructions:</span>
                 <p className="mt-1 text-gray-600 dark:text-gray-400">{agent.customInstructions}</p>
               </div>
             )}
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
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}
