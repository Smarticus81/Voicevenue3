import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { venueSettings } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

// Set/Change PIN: POST { venueId, newPin }
// Verify PIN:     POST { venueId, verifyPin: "1234" }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const venueId = body.venueId || "demo-venue";

  if (body.newPin) {
    if (!/^\d{4,8}$/.test(String(body.newPin))) {
      return NextResponse.json({ error: "PIN must be 4–8 digits" }, { status: 400 });
    }
    const hash = await bcrypt.hash(String(body.newPin), 10);
    await db
      .insert(venueSettings)
      .values({ venueId, kioskPinHash: hash } as any)
      .onConflictDoUpdate({
        target: venueSettings.venueId,
        set: { kioskPinHash: hash, updatedAt: new Date() },
      });
    return NextResponse.json({ ok: true });
  }

  if (body.verifyPin) {
    const rows = await db.select().from(venueSettings).where(eq(venueSettings.venueId, venueId));
    const hash = rows[0]?.kioskPinHash as string | undefined;
    if (!hash) return NextResponse.json({ ok: false, error: "No PIN set" }, { status: 400 });
    const ok = await bcrypt.compare(String(body.verifyPin), hash);
    return NextResponse.json({ ok });
  }

  return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
}



