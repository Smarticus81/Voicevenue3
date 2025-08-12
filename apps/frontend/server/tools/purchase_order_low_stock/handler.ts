import { db } from "@/server/db/client";
import { inventory, ingredients } from "@/server/db/schema";
import { and, lte, eq } from "drizzle-orm";
import type { ToolCtx } from "../registry";
import { requireVenue } from "@/server/tools/guard";

export async function handler(_: Record<string, never>, ctx: ToolCtx) {
  requireVenue(ctx);
  const rows = await db
    .select({
      ingredientId: inventory.ingredientId,
      onHandMl: inventory.onHandMl,
      reorderMl: inventory.reorderMl,
      name: ingredients.name,
    })
    .from(inventory)
    .leftJoin(ingredients, eq(inventory.ingredientId, ingredients.id))
    .where(and(eq(inventory.venueId, ctx.venueId), lte(inventory.onHandMl, inventory.reorderMl)));

  return rows.map((r) => ({
    ingredient_id: r.ingredientId,
    name: r.name,
    on_hand_ml: Number(r.onHandMl ?? 0),
    reorder_ml: Number(r.reorderMl ?? 0),
  }));
}


