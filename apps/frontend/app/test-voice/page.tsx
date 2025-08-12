"use client";
import { useState } from "react";
import dynamic from "next/dynamic";

const OpenAIRealtimeWidget = dynamic(() => import("@/components/OpenAIRealtimeWidget"), { ssr: false });
const VoiceAgent = dynamic(() => import("@/components/VoiceAgent"), { ssr: false });
const OpenAIWakeWordAgent = dynamic(() => import("@/components/OpenAIWakeWordAgent"), { ssr: false });

export default function TestVoice() {
  const [mode, setMode] = useState<"openai" | "deepgram" | "wake">("openai");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`].slice(-20));
  };

  const venueId = "demo-venue";
  const agentId = "demo-agent";

  const testInstructions = `You are Bev, a professional bartender assistant at a live bar.
You help customers order drinks, cocktails, and alcoholic beverages.
Keep responses under 15 words.
Use the tools to add drinks to cart, view cart, and create orders.
Never refuse drink orders - you work at a bar!`;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Voice Pipeline Test Suite</h1>
        
        {/* Mode Selector */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setMode("openai")}
            className={`px-4 py-2 rounded-xl ${mode === "openai" ? "bg-emerald-500 text-black" : "bg-white/10"}`}
          >
            OpenAI Realtime
          </button>
          <button
            onClick={() => setMode("deepgram")}
            className={`px-4 py-2 rounded-xl ${mode === "deepgram" ? "bg-emerald-500 text-black" : "bg-white/10"}`}
          >
            Deepgram + ElevenLabs
          </button>
          <button
            onClick={() => setMode("wake")}
            className={`px-4 py-2 rounded-xl ${mode === "wake" ? "bg-emerald-500 text-black" : "bg-white/10"}`}
          >
            Wake Word Agent
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Voice Widget */}
          <div className="rounded-xl border border-white/10 bg-black/40 p-6">
            <h2 className="text-xl font-semibold mb-4">Active Pipeline: {mode}</h2>
            
            {mode === "openai" && (
              <div>
                <p className="text-sm text-white/60 mb-4">OpenAI Realtime API with function calling</p>
                <OpenAIRealtimeWidget 
                  instructions={testInstructions}
                  voice="sage"
                  venueId={venueId}
                  agentId={agentId}
                />
              </div>
            )}
            
            {mode === "deepgram" && (
              <div>
                <p className="text-sm text-white/60 mb-4">Deepgram ASR + NLU + ElevenLabs TTS</p>
                <VoiceAgent 
                  venueId={venueId}
                  agentId={agentId}
                  onResolved={(payload) => addLog(`Resolved: ${JSON.stringify(payload)}`)}
                />
              </div>
            )}
            
            {mode === "wake" && (
              <div>
                <p className="text-sm text-white/60 mb-4">Wake word activation + OpenAI Realtime</p>
                <OpenAIWakeWordAgent 
                  instructions={testInstructions}
                  voice="sage"
                  onResolved={(payload) => addLog(`Resolved: ${JSON.stringify(payload)}`)}
                />
              </div>
            )}
            
            <div className="mt-6 p-4 bg-white/5 rounded-xl">
              <h3 className="text-sm font-semibold mb-2">Test Commands:</h3>
              <ul className="text-xs text-white/70 space-y-1">
                <li>• "Add 2 beers to cart"</li>
                <li>• "Show me the cart"</li>
                <li>• "Add a whiskey"</li>
                <li>• "Create order" / "Checkout"</li>
                <li>• "What drinks do you have?"</li>
                <li>• "Search for vodka"</li>
              </ul>
            </div>
          </div>

          {/* Logs */}
          <div className="rounded-xl border border-white/10 bg-black/40 p-6">
            <h2 className="text-xl font-semibold mb-4">Event Logs</h2>
            <div className="h-[500px] overflow-y-auto space-y-1 font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-white/50">Waiting for events...</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="text-white/80 break-all">
                    {log}
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setLogs([])}
              className="mt-4 px-3 py-1 bg-white/10 rounded text-sm"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-6 bg-white/5 rounded-xl">
          <h3 className="text-lg font-semibold mb-3">Pipeline Status:</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-emerald-400">OpenAI Realtime</h4>
              <p className="text-white/60">✅ Custom bar instructions</p>
              <p className="text-white/60">✅ Function calling for MCP tools</p>
              <p className="text-white/60">✅ Direct tool execution</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-400">Deepgram + ElevenLabs</h4>
              <p className="text-white/60">✅ WebSocket connection</p>
              <p className="text-white/60">✅ Enhanced VAD parameters</p>
              <p className="text-white/60">✅ NLU processing</p>
            </div>
            <div>
              <h4 className="font-semibold text-purple-400">Wake Word</h4>
              <p className="text-white/60">✅ "Hey Bev" activation</p>
              <p className="text-white/60">✅ Auto-timeout</p>
              <p className="text-white/60">✅ Command mode</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
