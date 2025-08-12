"use client";
import dynamic from "next/dynamic";
import { useState } from "react";

const OpenAIRealtimeWidget = dynamic(() => import("./OpenAIRealtimeWidget"), { ssr: false });
const VoiceAgentDG = dynamic(() => import("./VoiceAgent"), { ssr: false });

export default function AgentRunner({ defaultLane = "openai" }: { defaultLane?: "openai" | "dg11" }) {
  const [lane, setLane] = useState<"openai" | "dg11">(defaultLane);
  const [isActive, setIsActive] = useState(false);

  const handleStart = () => {
    setIsActive(true);
  };

  const handleStop = () => {
    setIsActive(false);
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        <h3 className="text-lg font-semibold">Voice Agent</h3>
        <select 
          value={lane} 
          onChange={(e) => setLane(e.target.value as "openai" | "dg11")}
          disabled={isActive}
          className="px-3 py-1 border rounded"
        >
          <option value="openai">OpenAI Realtime</option>
          <option value="dg11">Deepgram + ElevenLabs</option>
        </select>
      </div>

      {!isActive ? (
        <button 
          onClick={handleStart}
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
        >
          Start Voice Agent
        </button>
      ) : (
        <div className="space-y-3">
          <button 
            onClick={handleStop}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
          >
            Stop Voice Agent
          </button>
          
          {lane === "openai" && <OpenAIRealtimeWidget voice="sage" />}
          {lane === "dg11" && <VoiceAgentDG autoStart={true} />}
        </div>
      )}
    </div>
  );
}
