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
    const s = rows[0];
    return NextResponse.json({
      customWakeWord: s?.customWakeWord || "hey bev",
      wakeFuzzMaxDistance: s?.wakeFuzzMaxDistance ?? 2,
    });
  } catch (e) {
    return NextResponse.json({ customWakeWord: "hey bev", wakeFuzzMaxDistance: 2, _warning: "settings read failed" });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const venueId = body.venueId || "demo-venue";
    const customWakeWord = String(body.customWakeWord || "hey bev").toLowerCase().trim();
    const wakeFuzzMaxDistance = Math.max(0, Math.min(4, Number(body.wakeFuzzMaxDistance ?? 2)));

    await db
      .insert(venueSettings)
      .values({ venueId, customWakeWord, wakeFuzzMaxDistance } as any)
      .onConflictDoUpdate({
        target: venueSettings.venueId,
        set: { customWakeWord, wakeFuzzMaxDistance, updatedAt: new Date() },
      });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500 });
  }
}


