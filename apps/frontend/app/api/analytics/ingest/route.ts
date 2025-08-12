import { NextResponse } from "next/server";
import { insertEvent } from "@/server/db/analytics";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { venueId, agentId, eventType, latencyMs, meta } = await req.json();
    if (!venueId || !agentId || !eventType) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    await insertEvent({
      venue_id: venueId,
      agent_id: agentId,
      event_type: eventType,
      latency_ms: latencyMs ?? null,
      meta: meta ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[analytics/ingest]", e);
    return NextResponse.json({ error: "ingest failed" }, { status: 500 });
  }
}


