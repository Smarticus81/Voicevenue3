"use client";
import DashboardShell from "@/components/shell/DashboardShell";
import { useEffect, useMemo, useState } from "react";

type Span = { id: string; name: string; startedAt: string; durationMs: number; attrs?: any };
type Trace = { id: string; startedAt: string; venueId: string; agentId: string; label?: string };

function fmt(ms: number) { return `${ms}ms`; }

export default function InspectorPage() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [traceId, setTraceId] = useState<string>("");
  const [spans, setSpans] = useState<Span[]>([]);

  useEffect(() => {
    fetch("/api/trace/list").then((r) => r.json()).then((d) => setTraces(d.traces || []));
  }, []);

  useEffect(() => {
    if (!traceId) return;
    fetch(`/api/trace/spans?traceId=${traceId}`).then((r) => r.json()).then((d) => setSpans(d.spans || []));
  }, [traceId]);

  const t0 = useMemo(() => (spans.length ? new Date(spans[0].startedAt).getTime() : 0), [spans]);

  return (
    <DashboardShell>
      <section className="rounded-2xl p-6 bg-white/10 backdrop-blur border border-white/15 space-y-4">
        <h2 className="text-lg font-semibold">Latency Waterfall</h2>
        <div className="flex gap-2">
          <select className="px-3 py-2 rounded-lg bg-black/30 border border-white/20" onChange={(e) => setTraceId(e.target.value)} value={traceId}>
            <option value="">Select a trace</option>
            {traces.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label || t.id} — {new Date(t.startedAt).toLocaleTimeString()}
              </option>
            ))}
          </select>
        </div>

        {traceId && (
          <div className="mt-4 rounded-xl bg-black/30 border border-white/10 p-4">
            {!spans.length ? (
              <div className="text-white/60">No spans yet.</div>
            ) : (
              <div className="space-y-2">
                {spans.map((s) => {
                  const start = new Date(s.startedAt).getTime();
                  const left = Math.max(0, start - t0);
                  const width = Math.max(2, s.durationMs || 1);
                  return (
                    <div key={s.id}>
                      <div className="text-xs text-white/70 mb-1">
                        {s.name} <span className="text-white/50">({fmt(s.durationMs)})</span>
                      </div>
                      <div className="relative h-4 bg-white/5 rounded overflow-hidden">
                        <div
                          className="absolute top-0 h-4 bg-emerald-500/70"
                          style={{ left: `${left}px`, width: `${width}px` }}
                          title={JSON.stringify(s.attrs || {})}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}


