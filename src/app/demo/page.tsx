"use client";

import { useState } from "react";
import { useSimpleVoice } from "@/hooks/useSimpleVoice";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";
import Link from "next/link";
import Image from "next/image";

export default function DemoPage() {
  const [useRealtime, setUseRealtime] = useState(false);
  const [config, setConfig] = useState({
    name: "Demo Bar Assistant",
    instructions: "You are a helpful assistant for The Blue Note bar. Help customers with drink orders, menu questions, and reservations. Be friendly and professional.",
    voice: "alloy" as const,
    temperature: 0.7,
    wakeWord: "Hey Venue",
  });

  const simpleVoice = useSimpleVoice();
  const realtimeVoice = useRealtimeVoice({
    agentName: config.name,
    instructions: config.instructions,
    voice: config.voice,
    temperature: config.temperature,
    enableTools: true,
  });

  const voice = useRealtime ? realtimeVoice : simpleVoice;
  const { isActive, isListening, transcript, response, startSession, stopSession, error, connectionStatus } = voice;

  const handleStart = () => {
    if (isActive) {
      stopSession();
    } else {
      startSession();
    }
  };

  const handleToggleMode = () => {
    if (isActive) {
      stopSession();
    }
    setUseRealtime(!useRealtime);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image 
              src="/bevpro-logo.svg" 
              alt="BevPro" 
              width={120} 
              height={20}
              className="h-5 w-auto"
            />
          </Link>
          <div className="text-sm text-gray-600">Demo Mode</div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Voice Agent Demo</h1>
            <p className="text-gray-600">Test the voice agent without signing up. Click the microphone to start.</p>
            
            {/* Mode Toggle */}
            <div className="mt-4 flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useRealtime}
                  onChange={handleToggleMode}
                  className="rounded"
                />
                <span className="text-sm font-medium">Use OpenAI Realtime API</span>
              </label>
              {useRealtime && (
                <span className={`text-sm px-2 py-1 rounded ${
                  connectionStatus === 'Connected' ? 'bg-green-100 text-green-800' :
                  connectionStatus === 'Connecting...' ? 'bg-yellow-100 text-yellow-800' :
                  connectionStatus === 'Connection failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {connectionStatus}
                </span>
              )}
            </div>

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-sm">
              <p className="text-sm text-yellow-800">
                <strong>Demo Mode:</strong> {useRealtime ? 
                  'Using OpenAI Realtime API for ultra-low latency. Make sure you have your API key configured.' :
                  'Using browser speech recognition for demonstration. For production-ready OpenAI Realtime API with ultra-low latency, please sign up and configure your API keys.'
                }
              </p>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-sm">
                <p className="text-sm text-red-800">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            )}
          </div>

          {/* Voice Control */}
          <div className="openai-card p-8">
              <div className="text-center space-y-6">
                <h2 className="text-xl font-bold">Voice Control</h2>
                
                <button
                  onClick={handleStart}
                  disabled={useRealtime && connectionStatus !== 'Connected'}
                  className={`w-24 h-24 rounded-full transition-all ${
                    isActive 
                      ? "bg-red-500 hover:bg-red-600" 
                      : "bg-black hover:bg-gray-800"
                  } text-white flex items-center justify-center mx-auto disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <svg 
                    width="40" 
                    height="40" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    {isActive ? (
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                    ) : (
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8" />
                    )}
                  </svg>
                </button>

                <div className="text-sm text-gray-600">
                  {isActive ? (
                    <div className="space-y-2">
                      <p>Listening... Try saying something!</p>
                      {isListening && (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span>Active</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p>Click to start voice agent</p>
                  )}
                </div>

                {transcript && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-sm text-left">
                    <p className="text-sm font-medium mb-1">You said:</p>
                    <p className="text-sm text-gray-700">{transcript}</p>
                  </div>
                )}

                {response && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-sm text-left">
                    <p className="text-sm font-medium mb-1">Agent response:</p>
                    <p className="text-sm text-blue-700">{response}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sample Commands */}
          <div className="openai-card p-6">
            <h3 className="text-lg font-bold mb-4">Sample Commands</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• "What beers do you have on tap?"</li>
              <li>• "I'd like to make a reservation"</li>
              <li>• "What are your happy hour specials?"</li>
              <li>• "Can I see the menu?"</li>
              <li>• "What time do you close?"</li>
            </ul>
          </div>

          {/* Instructions */}
          <div className="openai-card p-6">
            <h3 className="text-lg font-bold mb-4">How It Works</h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li>1. Choose your mode (Browser or OpenAI Realtime)</li>
              <li>2. Click the microphone button to start</li>
              <li>3. Allow microphone access when prompted</li>
              <li>4. Speak naturally - the agent will listen</li>
              <li>5. Hear the response through your speakers</li>
              <li>6. Click again to stop</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}