import { db } from "@/server/db/client";
import {
  orders,
  orderItems,
  items,
  recipes,
  ingredients as ingredientsTbl,
  inventory,
  tabs,
} from "@/server/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { ToolCtx } from "../registry";
import { requireVenue } from "@/server/tools/guard";

export async function handler(params: { tab_id: string; item_id: string; qty: number }, ctx: ToolCtx) {
  requireVenue(ctx);
  if (params.qty <= 0) throw new Error("qty must be >= 1");

  // Validate tab belongs to venue and is open
  const [tab] = await db
    .select()
    .from(tabs)
    .where(and(eq(tabs.id, params.tab_id), eq(tabs.venueId, ctx.venueId)))
    .limit(1);
  if (!tab) throw new Error(`Tab ${params.tab_id} not found for this venue`);
  if ((tab as any).status !== "open") throw new Error(`Tab ${params.tab_id} is not open`);

  // Ensure item exists
  const [itm] = await db
    .select()
    .from(items)
    .where(and(eq(items.id, params.item_id), eq(items.venueId, ctx.venueId)))
    .limit(1);
  if (!itm) throw new Error(`Item ${params.item_id} not found`);

  // Start tx
  return await db.transaction(async (tx) => {
    // create order
    const [ord] = await tx.insert(orders).values({ tabId: params.tab_id }).returning();

    // insert order item
    const [oi] = await tx
      .insert(orderItems)
      .values({
        orderId: ord.id,
        itemId: params.item_id,
        qty: params.qty,
        priceEach: (itm as any).unitPrice,
      })
      .returning();

    // get recipe (ingredient_id, amount_ml) and decrement inventory
    const recipeRows = await tx
      .select({ ingredientId: recipes.ingredientId, amountMl: recipes.amountMl })
      .from(recipes)
      .where(eq(recipes.itemId, params.item_id));

    for (const r of recipeRows) {
      // current inventory row
      const invRows = await tx
        .select()
        .from(inventory)
        .where(and(eq(inventory.venueId, ctx.venueId), eq(inventory.ingredientId, r.ingredientId)))
        .limit(1);

      if (!invRows.length) throw new Error(`No inventory row for ingredient ${r.ingredientId}`);

      const inv = invRows[0] as any;
      const delta = Number(r.amountMl) * params.qty;
      const newLevel = Number(inv.onHandMl) - delta;
      if (newLevel < 0) {
        throw new Error(`Insufficient stock: ingredient ${r.ingredientId} needs ${delta}ml`);
      }

      await tx
        .update(inventory)
        .set({ onHandMl: newLevel })
        .where(and(eq(inventory.venueId, ctx.venueId), eq(inventory.ingredientId, r.ingredientId)));
    }

    return {
      order_id: ord.id,
      order_item_id: oi.id,
      tab_id: params.tab_id,
      item_id: params.item_id,
      qty: params.qty,
      total: Number((itm as any).unitPrice) * params.qty,
    };
  });
}


