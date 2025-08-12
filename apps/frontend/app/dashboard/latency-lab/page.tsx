"use client";
import DashboardShell from "@/components/shell/DashboardShell";
import { useEffect, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";

type Row = {
  id: string;
  combo: string;
  trials: number;
  p50: number;
  p90: number;
  best: number;
};

export default function LatencyLab() {
  const venueId = "demo-venue";
  const agentId = "demo-agent";
  const [settings, setSettings] = useState<any>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [phrase, setPhrase] = useState("add two margaritas to alex's tab");
  const combos = useMemo(() => {
    if (!settings) return [];
    const asr = [ {p:"deepgram", m: settings.asrModel || "nova-2"}, {p:"openai", m: "realtime"} ];
    const tts = [ {p:"elevenlabs", v: settings.ttsVoice || "Rachel"}, {p:"openai", v: settings.realtimeVoice || "sage"} ];
    return asr.flatMap(a => tts.map(t => ({
      id: `${a.p}/${a.m} :: ${t.p}/${t.v}`,
      asrProvider: a.p, asrModel: a.m,
      ttsProvider: t.p, ttsVoice: t.v
    })));
  }, [settings]);

  useEffect(()=>{ fetch(`/api/settings/vendor?venueId=${venueId}`).then(r=>r.json()).then(setSettings); },[]);

  const runTrial = async (combo: any) => {
    const N = 4;
    const latencies: number[] = [];
    for (let i=0;i<N;i++) {
      const t0 = performance.now();
      const r = await fetch("/api/latency/run", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          venueId, agentId, phrase,
          asrProvider: combo.asrProvider, asrModel: combo.asrModel,
          ttsProvider: combo.ttsProvider, ttsVoice: combo.ttsVoice
        })
      });
      await r.json();
      latencies.push(Math.round(performance.now() - t0));
      await new Promise(res => setTimeout(res, 300));
    }
    latencies.sort((a,b)=>a-b);
    const p50 = latencies[Math.floor((latencies.length-1)*0.5)];
    const p90 = latencies[Math.floor((latencies.length-1)*0.9)];
    const best = latencies[0];
    setRows(prev => {
      const copy = prev.filter(x => x.combo !== `${combo.asrProvider}/${combo.asrModel} :: ${combo.ttsProvider}/${combo.ttsVoice}`);
      copy.push({ id: uuid(), combo: `${combo.asrProvider}/${combo.asrModel} :: ${combo.ttsProvider}/${combo.ttsVoice}`, trials: N, p50, p90, best });
      return copy.sort((a,b)=>a.p50-b.p50);
    });
  };

  const runAll = async () => {
    if (!combos.length) return;
    setRunning(true);
    setRows([]);
    for (const c of combos) {
      // eslint-disable-next-line no-await-in-loop
      await runTrial(c);
    }
    setRunning(false);
  };

  const pinFastest = async () => {
    if (!rows.length) return;
    const top = rows[0];
    const [asr, tts] = top.combo.split(" :: ");
    const [asrProvider, asrModel] = asr.split("/");
    const [ttsProvider, ttsVoice] = tts.split("/");
    await fetch("/api/settings/vendor", {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ venueId, asrProvider, asrModel, ttsProvider, ttsVoice })
    });
    alert(`Pinned fastest: ${top.combo}`);
  };

  return (
    <DashboardShell>
      <section className="panel p-6 space-y-4">
        <h2 className="text-lg font-semibold">Latency Lab</h2>
        <p className="text-sm text-white/70">
          Benchmarks NLU+TTS round-trip for several vendor combos. Pin the fastest for your venue.
        </p>

        <div className="flex flex-col md:flex-row gap-3">
          <input value={phrase} onChange={(e)=>setPhrase(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/20"
            placeholder="Benchmark phrase…" />
          <button onClick={runAll} disabled={running}
            className={`px-4 py-2 rounded-xl ${running ? "bg-white/20" : "bg-emerald-500/90 hover:bg-emerald-400 text-black font-semibold"}`}>
            {running ? "Running…" : "Run Benchmarks"}
          </button>
          <button onClick={pinFastest} disabled={!rows.length}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/20">
            Pin Fastest
          </button>
        </div>

        <div className="rounded-xl border border-white/10 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/10">
              <tr>
                <th className="text-left p-2">Combo</th>
                <th className="text-left p-2">Trials</th>
                <th className="text-left p-2">Best</th>
                <th className="text-left p-2">p50</th>
                <th className="text-left p-2">p90</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r=> (
                <tr key={r.id} className="border-t border-white/10">
                  <td className="p-2">{r.combo}</td>
                  <td className="p-2">{r.trials}</td>
                  <td className="p-2">{r.best} ms</td>
                  <td className="p-2">{r.p50} ms</td>
                  <td className="p-2">{r.p90} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}



