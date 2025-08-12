import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { venueSettings } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const venueId = u.searchParams.get("venueId") || "demo-venue";
    const rows = await db.select().from(venueSettings).where(eq(venueSettings.venueId, venueId));
    if (!rows.length) {
      return NextResponse.json({
        venueId,
        asrProvider: "deepgram",
        asrModel: "nova-2",
        ttsProvider: "elevenlabs",
        ttsVoice: "Rachel",
        realtimeModel: "gpt-4o-realtime-preview-2024-12-17",
        realtimeVoice: "alloy",
        region: "us-east",
        wakeConfidenceMin: "0.65",
        vadMinDb: -42,
        vadHangoverMs: 280,
        kioskPinHash: null,
      });
    }
    return NextResponse.json(rows[0]);
  } catch (err: any) {
    // graceful defaults on error to keep UI stable
    return NextResponse.json({
      venueId: "demo-venue",
      asrProvider: "deepgram",
      asrModel: "nova-2",
      ttsProvider: "elevenlabs",
      ttsVoice: "Rachel",
      realtimeModel: "gpt-4o-realtime-preview-2024-12-17",
      realtimeVoice: "sage",
      region: "us-east",
      wakeConfidenceMin: "0.65",
      vadMinDb: -42,
      vadHangoverMs: 280,
      _warning: err?.message || "query_failed",
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const venueId = body.venueId || "demo-venue";
    const data = {
      venueId,
      asrProvider: body.asrProvider || "deepgram",
      asrModel: body.asrModel || "nova-2",
      ttsProvider: body.ttsProvider || "elevenlabs",
      ttsVoice: body.ttsVoice || "Rachel",
      realtimeModel: body.realtimeModel || "gpt-4o-realtime-preview-2024-12-17",
      realtimeVoice: body.realtimeVoice || "sage",
      region: body.region || "us-east",
      wakeConfidenceMin: body.wakeConfidenceMin ?? "0.65",
      vadMinDb: body.vadMinDb ?? -42,
      vadHangoverMs: body.vadHangoverMs ?? 280,
      extras: body.extras || null,
    } as const;

    // upsert
    await db
      .insert(venueSettings)
      .values(data as any)
      .onConflictDoUpdate({
        target: venueSettings.venueId,
        set: {
          asrProvider: data.asrProvider,
          asrModel: data.asrModel,
          ttsProvider: data.ttsProvider,
          ttsVoice: data.ttsVoice,
          realtimeModel: data.realtimeModel,
          realtimeVoice: data.realtimeVoice,
          region: data.region,
        wakeConfidenceMin: data.wakeConfidenceMin as any,
        vadMinDb: data.vadMinDb as any,
        vadHangoverMs: data.vadHangoverMs as any,
          extras: data.extras,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "save_failed" }, { status: 500 });
  }
}


