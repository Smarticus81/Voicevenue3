import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { events as evtTable, eventInventoryAllocations } from "@/server/db/schema.events";
import { and, between, eq, inArray, sql } from "drizzle-orm";
import { getRequestCtx } from "@/server/auth/context";
import { createEventSchema } from "@/lib/validation/events";
import { runAllocation } from "@/lib/allocation/engine";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const organizationId = u.searchParams.get("organizationId") || "demo-org";
  const venueIds = (u.searchParams.get("venueId") || "").split(",").filter(Boolean);
  const typeId = u.searchParams.get("eventTypeId");
  const from = u.searchParams.get("from");
  const to = u.searchParams.get("to");

  let q: any = db.select().from(evtTable).where(eq(evtTable.organizationId, organizationId));
  if (venueIds.length) q = q.where(inArray(evtTable.venueId, venueIds));
  if (typeId) q = q.where(eq(evtTable.eventTypeId, typeId));
  if (from && to) q = q.where(between(evtTable.startsAt, new Date(from), new Date(to)));
  const rows = await q;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const ctx = await getRequestCtx();
  const body = await req.json();
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;

  // Create event
  const [ev] = await db
    .insert(evtTable)
    .values({
      organizationId: (body.organizationId as string) || "demo-org",
      venueId: input.venueId,
      eventTypeId: input.eventTypeId,
      packageId: input.packageId,
      name: input.name,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      expectedGuests: input.expectedGuests,
      notes: input.notes,
      createdBy: ctx.userId,
    })
    .returning();

  // Clean prior allocs (should be none on create)
  await db.delete(eventInventoryAllocations).where(eq(eventInventoryAllocations.eventId, (ev as any).id));

  // Run allocation
  const result = await runAllocation({
    organizationId: (body.organizationId as string) || "demo-org",
    venueId: input.venueId,
    packageId: input.packageId,
    expectedGuests: input.expectedGuests,
    eventId: (ev as any).id,
  });

  const status = result.hadShortages ? 201 : 201;
  return NextResponse.json({ event: ev, allocation: result }, { status });
}


