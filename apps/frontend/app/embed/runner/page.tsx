"use client";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const OpenAIRealtimeWidget = dynamic(() => import("@/components/OpenAIRealtimeWidget"), { ssr: false });
const VoiceAgent = dynamic(() => import("@/components/VoiceAgent"), { ssr: false });

function Inner() {
  const sp = useSearchParams();
  const lane = ((sp && sp.get("lane")) as "openai" | "dg11") || "openai";
  return (
    <div className="min-h-[520px] bg-[radial-gradient(800px_400px_at_100%_0%,rgba(16,185,129,0.2),transparent)] text-white p-3">
      <div className="rounded-xl border border-white/10 bg-black/40 p-3">
        {lane === "openai" ? <OpenAIRealtimeWidget /> : <VoiceAgent />}
      </div>
      <div className="pt-2 text-center text-xs text-white/60">BevPro Studio — embed</div>
    </div>
  );
}

export default function EmbedRunner() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}


