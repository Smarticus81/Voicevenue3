import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { venueLinking } from "@/server/db/schema.events";
import { and, eq } from "drizzle-orm";
import { getRequestCtx } from "@/server/auth/context";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ctx = await getRequestCtx();
  if (ctx.role !== "owner" && ctx.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { parentVenueId, childVenueId, link_inventory, link_staff, link_events } = await req.json();
  if (!parentVenueId || !childVenueId) return NextResponse.json({ error: "parentVenueId and childVenueId required" }, { status: 400 });
  const [row] = await db
    .insert(venueLinking)
    .values({ parentVenueId, childVenueId, linkInventory: !!link_inventory, linkStaff: !!link_staff, linkEvents: !!link_events })
    .onConflictDoUpdate({
      target: [venueLinking.parentVenueId, venueLinking.childVenueId],
      set: { linkInventory: !!link_inventory, linkStaff: !!link_staff, linkEvents: !!link_events },
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}


