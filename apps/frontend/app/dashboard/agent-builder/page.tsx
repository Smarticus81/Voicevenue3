"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { vendorLabel } from "@/lib/vendors";

type Lane = "openai" | "dg11";

const DEFAULT_TOOLS = [
  { id: "order.add", label: "Order: Add items (shots/oz/items)" },
  { id: "inventory.query", label: "Inventory: Query levels" },
  { id: "inventory.adjust", label: "Inventory: Adjust (manager only)" },
];

export default function AgentBuilder() {
  const router = useRouter();
  const qs = useSearchParams();
  const preVendor = qs.get("vendor") || undefined;
  const venueId = qs.get("venueId") || "demo-venue";

  const [step, setStep] = useState(1);
  const [agentId, setAgentId] = useState("demo-agent");
  const [lane, setLane] = useState<Lane>("openai");
  const [wake, setWake] = useState({ phrase: "hey bev", fuzz: 2 });
  const [tools, setTools] = useState<string[]>(DEFAULT_TOOLS.map((t) => t.id));
  const [connectedVendors, setConnectedVendors] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`/api/integrations/list?venueId=${venueId}`, { cache: "no-store" });
        const d = await r.json();
        setConnectedVendors(Array.isArray(d.vendors) ? d.vendors : []);
      } catch {
        setConnectedVendors([]);
      }
    };
    load();
  }, [venueId]);

  const toggleTool = (id: string) => {
    setTools((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const save = async () => {
    const r = await fetch("/api/agents/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, venueId, lane, tools, wake }),
    });
    if (!r.ok) return alert("Save failed");
    try {
      const rr = await fetch(`/api/integrations/list?venueId=${venueId}`, { cache: "no-store" });
      const dd = await rr.json();
      setConnectedVendors(dd.vendors || []);
    } catch {}
    setStep(3);
  };

  const kioskUrl = useMemo(() => {
    const base = "/kiosk";
    const p = new URLSearchParams({ venueId, agentId, lane }).toString();
    return `${base}?${p}`;
  }, [venueId, agentId, lane]);

  return (
    <div className="min-h-screen fade-in" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 rounded-neuro bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">Agent Builder</h1>
              <p className="text-white/70">{preVendor ? `Connected to ${preVendor.toUpperCase()} • ` : ""}Create and configure your voice agents</p>
            </div>
          </div>
          <div className="text-sm text-white/60">Venue: {venueId}</div>
        </motion.div>

        {/* Stepper */}
        <motion.div 
          className="flex gap-2 text-xs mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {["Lane", "Tools", "Publish"].map((t, i) => (
            <div key={t} className={`px-4 py-2 rounded-neuro font-medium transition-all ${step === i + 1 ? "bg-emerald-500 text-black shadow-neuro" : "glass text-white/70"}`}>
              {i + 1}. {t}
            </div>
          ))}
        </motion.div>

        {step === 1 && (
          <motion.section 
            className="glass-panel rounded-neuro p-6 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div>
              <label className="block text-sm text-white/70 mb-2">Agent ID</label>
              <input value={agentId} onChange={(e) => setAgentId(e.target.value)} className="w-full px-4 py-3 rounded-neuro bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>

            <div>
              <div className="text-sm text-white/70 mb-3">Choose Voice Lane</div>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { id: "openai", title: "OpenAI Realtime", desc: "Ultra‑low latency conversation over WebRTC." },
                  { id: "dg11", title: "Deepgram + ElevenLabs", desc: "Modular ASR→NLU→TTS with premium voices." },
                ].map((x) => (
                  <button key={x.id} onClick={() => setLane(x.id as Lane)} className={`rounded-neuro p-4 text-left border transition-all hover:scale-105 ${lane === x.id ? "border-emerald-400 bg-emerald-400/20 shadow-neuro" : "border-white/20 bg-white/5 hover:bg-white/10"}`}>
                    <div className="font-semibold text-white mb-1">{x.title}</div>
                    <div className="text-white/70 text-sm">{x.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Wake Word</label>
                <input value={wake.phrase} onChange={(e) => setWake({ ...wake, phrase: e.target.value })} className="w-full px-4 py-3 rounded-neuro bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Fuzziness</label>
                <input type="number" min={0} max={4} value={wake.fuzz} onChange={(e) => setWake({ ...wake, fuzz: Number(e.target.value) })} className="w-full px-4 py-3 rounded-neuro bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
              <div className="text-xs text-white/60 self-end pb-3">Higher fuzziness tolerates mispronunciations.</div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-6 py-3 rounded-neuro bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-400 hover:to-emerald-500 transition-all">Continue</button>
            </div>
          </motion.section>
        )}

        {step === 2 && (
          <motion.section 
            className="glass-panel rounded-neuro p-6 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="text-sm text-white/70">Enable the skills your agent will use.</div>
            <div className="grid sm:grid-cols-2 gap-4">
              {DEFAULT_TOOLS.map((t) => (
                <label key={t.id} className="flex gap-3 items-center rounded-neuro p-4 bg-white/5 border border-white/20 hover:bg-white/10 transition-colors cursor-pointer">
                  <input type="checkbox" checked={tools.includes(t.id)} onChange={() => toggleTool(t.id)} className="w-4 h-4 text-emerald-500 bg-white/10 border-white/30 rounded focus:ring-emerald-500" />
                  <span className="text-white">{t.label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-6 py-3 rounded-neuro glass border border-white/20 text-white font-medium hover:bg-white/5 transition-colors">Back</button>
              <button onClick={save} className="px-6 py-3 rounded-neuro bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-400 hover:to-emerald-500 transition-all">Save & Continue</button>
            </div>
          </motion.section>
        )}

        {step === 3 && (
          <motion.section 
            className="glass-panel rounded-neuro p-6 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="text-xl font-semibold text-gradient">Publish & Deploy</div>
            <p className="text-white/70">Open your voice-controlled kiosk with POS and inventory management. Staff-only access with integrated voice commands.</p>

            <div>
              <div className="text-sm text-white/70 mb-3">Connected Vendors</div>
              {connectedVendors.length ? (
                <div className="flex flex-wrap gap-2">
                  {connectedVendors.map((v) => (
                    <span key={v} className="inline-flex items-center gap-2 px-3 py-1 rounded-neuro bg-emerald-500/20 border border-emerald-400/40">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-emerald-300 text-sm">{vendorLabel(v)} Connected</span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="glass p-3 rounded-neuro text-xs text-white/60">No vendors connected yet. You can connect from <a className="underline text-emerald-400 hover:text-emerald-300" href="/integrations/mcp">Integrations</a>.</div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <a href={kioskUrl} className="rounded-neuro p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold text-center hover:from-emerald-400 hover:to-emerald-500 transition-all">Open Kiosk</a>
              <a href={`${kioskUrl}&install=1`} className="rounded-neuro p-4 glass border border-white/20 text-center text-white font-medium hover:bg-white/5 transition-colors">Install as App (PWA)</a>
            </div>
            <div className="text-xs text-white/60 text-center">Lane: {lane} • Agent: {agentId} • Venue: {venueId}</div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
