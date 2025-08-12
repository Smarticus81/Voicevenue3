import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { venueSettings } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { venueId, agentId, phrase, asrProvider, asrModel, ttsProvider, ttsVoice } = body || {};
    const vid = venueId || "demo-venue";

    const rows = await db.select().from(venueSettings).where(eq(venueSettings.venueId, vid));
    const before = rows[0];

    await db
      .insert(venueSettings)
      .values({
        venueId: vid,
        asrProvider: asrProvider || before?.asrProvider || "deepgram",
        asrModel: asrModel || before?.asrModel || "nova-2",
        ttsProvider: ttsProvider || before?.ttsProvider || "elevenlabs",
        ttsVoice: ttsVoice || before?.ttsVoice || "Rachel",
        realtimeModel: before?.realtimeModel || undefined,
        realtimeVoice: before?.realtimeVoice || undefined,
        region: before?.region || undefined,
      } as any)
      .onConflictDoUpdate({
        target: venueSettings.venueId,
        set: {
          asrProvider: asrProvider || before?.asrProvider || "deepgram",
          asrModel: asrModel || before?.asrModel || "nova-2",
          ttsProvider: ttsProvider || before?.ttsProvider || "elevenlabs",
          ttsVoice: ttsVoice || before?.ttsVoice || "Rachel",
          updatedAt: new Date(),
        },
      });

    const base = process.env.NEXT_PUBLIC_BASE_URL || "";
    const r = await fetch(`${base}/api/nlu/resolve-run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: phrase || "add two waters", venueId: vid, agentId: agentId || "demo-agent" }),
    });
    const data = await r.json().catch(() => ({}));

    return NextResponse.json({ ok: true, say: data?.say });
  } catch (e: any) {
    console.error("[latency/run]", e);
    return NextResponse.json({ error: "latency run failed" }, { status: 500 });
  }
}



