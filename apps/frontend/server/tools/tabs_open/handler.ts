import { db } from "@/server/db/client";
import { tabs } from "@/server/db/schema";
import type { ToolCtx } from "../registry";
import { requireVenue } from "@/server/tools/guard";

export async function handler(params: { guest_name: string }, ctx: ToolCtx) {
  requireVenue(ctx);
  const [row] = await db
    .insert(tabs)
    .values({
      venueId: ctx.venueId,
      guestName: params.guest_name,
      status: "open",
    })
    .returning();

  return { tab_id: row.id, guest_name: row.guestName, status: row.status } as any;
}


