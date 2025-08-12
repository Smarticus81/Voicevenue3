import { NextResponse } from "next/server";
import { ensureTrace, beginSpan, endSpan } from "@/server/tracing/trace";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { traceId, venueId, agentId, name, durationMs, attrs } = await req.json();
    if (!traceId || !venueId || !agentId || !name) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    await ensureTrace(traceId, venueId, agentId);
    const spanId = await beginSpan(traceId, name, attrs || {});
    if (typeof durationMs === "number") await endSpan(spanId, durationMs);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[trace/ingest] error", e);
    return NextResponse.json({ error: "ingest failed" }, { status: 500 });
  }
}


