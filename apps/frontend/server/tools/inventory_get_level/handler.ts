import { db } from "@/server/db/client";
import { inventory } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import type { ToolCtx } from "../registry";
import { requireVenue } from "@/server/tools/guard";

export async function handler(params: { ingredient_id: string }, ctx: ToolCtx) {
  requireVenue(ctx);
  const rows = await db
    .select()
    .from(inventory)
    .where(and(eq(inventory.venueId, ctx.venueId), eq(inventory.ingredientId, params.ingredient_id)))
    .limit(1);

  if (!rows.length) {
    throw new Error(`No inventory row for ingredient ${params.ingredient_id} at venue ${ctx.venueId}`);
  }

  const row = rows[0] as any;
  return {
    ingredient_id: params.ingredient_id,
    on_hand_ml: Number(row.onHandMl ?? 0),
    par_ml: Number(row.parMl ?? 0),
    reorder_ml: Number(row.reorderMl ?? 0),
  };
}


