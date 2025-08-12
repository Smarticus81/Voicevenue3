import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { events as evtTable, eventInventoryAllocations } from "@/server/db/schema.events";
import { eq } from "drizzle-orm";
import { runAllocation } from "@/lib/allocation/engine";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const [row] = (await db.select().from(evtTable).where(eq(evtTable.id, params.id)).limit(1)) as any[];
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const updates: any = {};
  if (body.startsAt) updates.startsAt = new Date(body.startsAt);
  if (body.endsAt) updates.endsAt = new Date(body.endsAt);
  if (body.name) updates.name = body.name;
  if (body.expectedGuests != null) updates.expectedGuests = body.expectedGuests;
  const [ev] = await db.update(evtTable).set(updates).where(eq(evtTable.id, params.id)).returning();
  if (!ev) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Re-run allocation for updated guest count or venue/package changes
  await db.delete(eventInventoryAllocations).where(eq(eventInventoryAllocations.eventId, params.id));
  const res = await runAllocation({
    organizationId: (ev as any).organization_id,
    venueId: (ev as any).venue_id,
    packageId: (ev as any).package_id,
    expectedGuests: (ev as any).expected_guests,
    eventId: params.id,
  });
  return NextResponse.json({ event: ev, allocation: res });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await db.delete(eventInventoryAllocations).where(eq(eventInventoryAllocations.eventId, params.id));
  await db.delete(evtTable).where(eq(evtTable.id, params.id));
  return NextResponse.json({ ok: true });
}


