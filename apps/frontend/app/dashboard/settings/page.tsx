"use client";
import DashboardShell from "@/components/shell/DashboardShell";
import { useEffect, useState } from "react";

type Settings = {
  venueId: string;
  asrProvider: "deepgram" | "openai";
  asrModel: string;
  ttsProvider: "elevenlabs" | "openai";
  ttsVoice: string;
  realtimeModel: string;
  realtimeVoice: string;
  region: "us-east" | "us-west" | "eu-west" | "ap-south";
  wakeConfidenceMin?: string | number;
  vadMinDb?: number;
  vadHangoverMs?: number;
};

export default function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const venueId = "demo-venue";

  useEffect(() => {
    fetch(`/api/settings/vendor?venueId=${venueId}`).then((r) => r.json()).then(setS);
  }, []);

  const save = async () => {
    await fetch(`/api/settings/vendor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...s, venueId }),
    });
    alert("Saved");
  };

  if (!s) return (
    <DashboardShell>
      <div className="panel p-6 text-white/70">Loading…</div>
    </DashboardShell>
  );

  return (
    <DashboardShell>
      <section className="panel p-6 space-y-4">
        <h2 className="text-lg font-semibold">Vendors & Region</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="soft p-4">
            <h3 className="font-semibold mb-2">ASR</h3>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setS({ ...s, asrProvider: "deepgram" })}
                className={`px-3 py-1 rounded-lg ${s.asrProvider === "deepgram" ? "bg-white/15" : "bg-white/5 hover:bg-white/10"}`}>Deepgram</button>
              <button onClick={() => setS({ ...s, asrProvider: "openai" })}
                className={`px-3 py-1 rounded-lg ${s.asrProvider === "openai" ? "bg-white/15" : "bg-white/5 hover:bg-white/10"}`}>OpenAI</button>
            </div>
            <input
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/20"
              placeholder="Model (e.g., nova-2)"
              value={s.asrModel}
              onChange={(e) => setS({ ...s, asrModel: e.target.value })}
            />
          </div>

          <div className="soft p-4">
            <h3 className="font-semibold mb-2">TTS</h3>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setS({ ...s, ttsProvider: "elevenlabs" })}
                className={`px-3 py-1 rounded-lg ${s.ttsProvider === "elevenlabs" ? "bg-white/15" : "bg-white/5 hover:bg-white/10"}`}>ElevenLabs</button>
              <button onClick={() => setS({ ...s, ttsProvider: "openai" })}
                className={`px-3 py-1 rounded-lg ${s.ttsProvider === "openai" ? "bg-white/15" : "bg-white/5 hover:bg-white/10"}`}>OpenAI</button>
            </div>
            <input
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/20"
              placeholder="Voice ID / Name"
              value={s.ttsVoice}
              onChange={(e) => setS({ ...s, ttsVoice: e.target.value })}
            />
          </div>

          <div className="soft p-4">
            <h3 className="font-semibold mb-2">OpenAI Realtime</h3>
            <input className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/20 mb-2"
              placeholder="Model" value={s.realtimeModel}
              onChange={(e) => setS({ ...s, realtimeModel: e.target.value })} />
            <input className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/20"
              placeholder="Voice" value={s.realtimeVoice}
              onChange={(e) => setS({ ...s, realtimeVoice: e.target.value })} />
          </div>

          <div className="soft p-4">
            <h3 className="font-semibold mb-2">Region</h3>
            <select
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/20"
              value={s.region}
              onChange={(e) => setS({ ...s, region: e.target.value as any })}
            >
              <option value="us-east">US East</option>
              <option value="us-west">US West</option>
              <option value="eu-west">EU West</option>
              <option value="ap-south">AP South</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 p-4 bg-black/30">
          <h3 className="font-semibold mb-2">Wake & VAD</h3>
          <label className="text-xs text-white/60">Wake confidence ({s.wakeConfidenceMin ?? "0.65"})</label>
          <input type="range" min={0.4} max={0.95} step={0.01}
            value={Number(s.wakeConfidenceMin ?? 0.65)}
            onChange={(e)=>setS({ ...(s as any), wakeConfidenceMin: e.target.value })}
            className="w-full"/>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <input className="px-3 py-2 rounded-lg bg-black/30 border border-white/20"
              placeholder="VAD Min dB" value={s.vadMinDb ?? -42}
              onChange={(e)=>setS({ ...(s as any), vadMinDb: Number(e.target.value) })}/>
            <input className="px-3 py-2 rounded-lg bg-black/30 border border-white/20"
              placeholder="VAD Hangover ms" value={s.vadHangoverMs ?? 280}
              onChange={(e)=>setS({ ...(s as any), vadHangoverMs: Number(e.target.value) })}/>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 p-4 bg-black/30">
          <h3 className="font-semibold mb-2">Kiosk Staff PIN</h3>
          <form onSubmit={async (e)=>{ e.preventDefault();
            const pin = (e.currentTarget.querySelector('[name=pin]') as HTMLInputElement).value;
            const r = await fetch('/api/settings/pin', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ venueId, newPin: pin })});
            const d = await r.json(); alert(d?.ok ? 'PIN updated' : (d?.error||'Failed'));
          }}>
            <input name="pin" inputMode="numeric" pattern="\\d*" maxLength={8}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/20 mb-2" placeholder="New PIN (4–8 digits)"/>
            <button className="px-3 py-2 rounded-xl bg-emerald-500 text-black font-semibold">Save PIN</button>
          </form>
        </div>

        <button onClick={save} className="px-4 py-2 rounded-xl bg-emerald-500/90 hover:bg-emerald-400 text-black font-semibold">Save</button>
      </section>
    </DashboardShell>
  );
}


