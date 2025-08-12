import { db } from "@/server/db/client";
import { tabs, orders, orderItems, items } from "@/server/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { ToolCtx } from "../registry";
import { requireVenue } from "@/server/tools/guard";

export async function handler(params: { tab_id: string }, ctx: ToolCtx) {
  requireVenue(ctx);
  // ensure tab is for venue
  const [tab] = await db
    .select()
    .from(tabs)
    .where(and(eq(tabs.id, params.tab_id), eq(tabs.venueId, ctx.venueId)))
    .limit(1);
  if (!tab) throw new Error(`Tab ${params.tab_id} not found for this venue`);

  const ords = await db.select().from(orders).where(eq(orders.tabId, params.tab_id));
  const ordIds = ords.map((o) => o.id);

  let subtotal = 0;
  if (ordIds.length) {
    const rows = await db
      .select({ qty: orderItems.qty, priceEach: orderItems.priceEach, itemName: items.name })
      .from(orderItems)
      .leftJoin(items, eq(orderItems.itemId, items.id))
      .where(inArray(orderItems.orderId, ordIds));

    subtotal = rows.reduce((s, r) => s + Number(r.qty) * Number(r.priceEach || 0), 0);
  }
  const tax = Math.round(subtotal * 0.0825 * 100) / 100; // 8.25% default
  const total = subtotal + tax;

  await db.update(tabs).set({ status: "closed" }).where(eq(tabs.id, params.tab_id));

  return {
    tab_id: params.tab_id,
    subtotal,
    tax,
    total,
    items_count: ordIds.length,
  };
}


