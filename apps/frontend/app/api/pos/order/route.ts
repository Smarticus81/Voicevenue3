import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { orders, orderItems, menuItems, tables } from "@/server/db/schema.pos";
import { and, eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const venueId = body.venueId || "demo-venue";
    const tableName = (body.tableName || body.table || "").toString();
  const items = Array.isArray(body.items) ? body.items : [];
    const tabName = body.tabName ? String(body.tabName) : null;

    let tableId: string | null = null;
    if (tableName) {
      const trows = await db
        .select()
        .from(tables)
        .where(and(eq(tables.venueId, venueId), eq(tables.name, tableName)))
        .limit(1);
      if (trows[0]) tableId = (trows[0] as any).id as string;
    }

    const [o] = (await db
      .insert(orders)
      .values({ venueId, tableId: tableId || null, tabName, status: "open", total: "0" } as any)
      .returning()) as any[];

    let runningTotal = 0;
  for (const it of items) {
    const name = String(it.name || "");
    const qty = Math.max(1, Number(it.qty || 1));
    const unit = it.unit === "shot" || it.unit === "oz" ? it.unit : "item";
      const m = await db
        .select()
        .from(menuItems)
        .where(and(eq(menuItems.venueId, venueId), eq(menuItems.name, name)))
        .limit(1);
      const price = Number((m[0] as any)?.price || 0);
      const subtotal = price * qty;
      runningTotal += subtotal;

    await db.insert(orderItems).values({
        orderId: o.id,
        menuItemId: (m[0] as any)?.id || "unknown",
      name,
      qty,
        priceEach: String(price),
        subtotal: String(subtotal),
      } as any);
    }

    await db.update(orders).set({ total: String(runningTotal) } as any).where(eq(orders.id, o.id as any));
    return NextResponse.json({ ok: true, orderId: o.id, total: runningTotal });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500 });
  }
}


