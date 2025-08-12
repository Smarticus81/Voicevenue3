"use client";
import { useEffect, useRef, useState } from "react";
import PWAInstall from "@/components/PWAInstall";
import dynamic from "next/dynamic";

const OpenAIWakeWordAgent = dynamic(()=> import("@/components/OpenAIWakeWordAgent"), { ssr:false });

type Log = { t: number; msg: string };

export default function Demo() {
  const [wake, setWake] = useState({ phrase: "hey bev", maxDistance: 3 });
  const [step, setStep] = useState(0);
  const [logs, setLogs] = useState<Log[]>([]);
  const [remaining, setRemaining] = useState(15);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(()=>{ audioRef.current = new Audio(); },[]);

  const addLog = (msg: string) => setLogs((l)=>[{ t: Date.now(), msg }, ...l].slice(0,8));

  const speak = async (text: string) => {
    const rr = await fetch("/api/voice/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
    const blob = await rr.blob(); const url = URL.createObjectURL(blob);
    const a = audioRef.current!; a.src = url; await a.play();
  };

  const run = async (text: string) => {
    if (remaining <= 0) return;
    addLog(`You: ${text}`);
    const r = await fetch("/api/nlu/resolve-run", { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ text, venueId:"demo-venue", agentId:"demo-agent" }) });
    const d = await r.json();
    addLog(`Bev: ${d?.say || "ok"}`);
    await speak(d?.say || "Done.");
    setRemaining((n)=>n-1);
    if (remaining-1 === 0) setStep(1);
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Guided Demo</h1>
            <p className="text-sm" style={{ color:'var(--text-secondary)' }}>Try up to 3 commands. After that, continue to build your agent.</p>
          </div>
          <div className="flex items-center gap-3"><PWAInstall /></div>
        </div>

        {/* Central Voice Demo */}
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Voice AI Demo
            </h1>
            <p className="text-lg text-white/70 mb-8">
              Experience ultra-low latency voice interaction with Bev, our AI bartender
            </p>
          </div>
          
          <div className="glass rounded-3xl p-8">
            <OpenAIWakeWordAgent 
              voice="sage" 
              onResolved={(d)=>{ 
                addLog(`Bev: ${d?.say||"ok"}`); 
                setRemaining(n=>{ 
                  const next=Math.max(0,n-1); 
                  if(next===0) setStep(1); 
                  return next; 
                }); 
              }} 
              onStop={()=>{
                // If user presses Stop during demo, open the builder popup immediately
                setStep(1);
              }}
            />
          </div>

          {/* Simple Activity Log */}
          {logs.length > 0 && (
            <div className="glass rounded-3xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-center">Live Conversation</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {logs.slice(-5).map(l=> (
                  <div key={l.t} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="text-xs text-white/50 mt-1">
                      {new Date(l.t).toLocaleTimeString()}
                    </div>
                    <div className="text-sm text-white/90 flex-1">{l.msg}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {step === 1 && (
          <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur flex items-center justify-center">
            <div className="glass rounded-3xl p-8 max-w-md text-center">
              <h3 className="text-xl font-semibold mb-2">Ready to build your agent?</h3>
              <p className="text-sm mb-4" style={{ color:'var(--text-secondary)' }}>You’ve reached the end of the demo. Continue with the builder to connect POS or create a custom one.</p>
              <div className="flex gap-3 justify-center">
                <a href="/build" className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold">Build Voice Agent</a>
                <a href="/" className="px-4 py-2 rounded-xl glass">Back</a>
              </div>
            </div>
          </div>
        )}
      </div>
      <audio ref={audioRef} hidden />
    </div>
  );
}


