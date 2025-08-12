import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { eventInventoryAllocations } from "@/server/db/schema.events";
import { and, eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { fromInventoryItemId, toInventoryItemId, qty } = await req.json();
  if (!fromInventoryItemId || !toInventoryItemId || !qty) return NextResponse.json({ error: 'missing' }, { status: 400 });

  // Record a substitute allocation
  const [row] = await db.insert(eventInventoryAllocations).values({
    eventId: params.id,
    venueId: 'demo-venue',
    inventoryItemId: toInventoryItemId,
    requiredQty: qty,
    allocatedQty: qty,
    shortageQty: 0,
  }).returning();
  return NextResponse.json(row, { status: 201 });
}


