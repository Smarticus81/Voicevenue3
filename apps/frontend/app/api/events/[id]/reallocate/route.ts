import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { events as evtTable, eventInventoryAllocations } from "@/server/db/schema.events";
import { eq } from "drizzle-orm";
import { runAllocation } from "@/lib/allocation/engine";

export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const [ev] = (await db.select().from(evtTable).where(eq(evtTable.id, params.id)).limit(1)) as any[];
  if (!ev) return NextResponse.json({ error: "not found" }, { status: 404 });
  await db.delete(eventInventoryAllocations).where(eq(eventInventoryAllocations.eventId, params.id));
  const res = await runAllocation({
    organizationId: ev.organization_id,
    venueId: ev.venue_id,
    packageId: ev.package_id,
    expectedGuests: ev.expected_guests,
    eventId: params.id,
  });
  return NextResponse.json({ allocation: res });
}


