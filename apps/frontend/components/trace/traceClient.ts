import { v4 as uuid } from "uuid";

export type TraceCtx = {
  traceId: string;
  venueId: string;
  agentId: string;
  label?: string;
};

export function createClientTrace(venueId = "demo-venue", agentId = "demo-agent", label?: string): TraceCtx {
  const existing = typeof window !== "undefined" ? sessionStorage.getItem("bev_trace_id") : null;
  const traceId = existing || uuid();
  if (!existing && typeof window !== "undefined") sessionStorage.setItem("bev_trace_id", traceId);
  return { traceId, venueId, agentId, label };
}

export async function ingestSpan(
  ctx: TraceCtx,
  name: string,
  t0: number,
  attrs?: Record<string, any>,
) {
  const durationMs = Math.round(performance.now() - t0);
  try {
    const base = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
    await fetch(`${base}/api/trace/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-trace-id": ctx.traceId },
      body: JSON.stringify({ traceId: ctx.traceId, venueId: ctx.venueId, agentId: ctx.agentId, name, durationMs, attrs }),
      keepalive: true,
    });
  } catch {}
  return durationMs;
}


