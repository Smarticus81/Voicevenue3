import { NextResponse } from "next/server";
import dayjs from "dayjs";
import tz from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { db } from "@/server/db/client";
import { sql } from "drizzle-orm";

dayjs.extend(utc); dayjs.extend(tz);
const TZ = process.env.VENUE_TIMEZONE || "America/Chicago";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const venueId = u.searchParams.get("venueId") || "demo-venue";
  const dateStr = u.searchParams.get("date");
  const day = dateStr ? dayjs.tz(dateStr, TZ) : dayjs().tz(TZ);
  const start = day.startOf("day").toISOString();
  const end = day.endOf("day").toISOString();

  const itemsRes: any = await db.execute(sql`
    SELECT it.name, SUM(oi.qty) as qty, SUM(oi.qty*oi.price_each) as total
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN tabs t ON t.id = o.tab_id
    JOIN items it ON it.id = oi.item_id
    WHERE t.venue_id = ${venueId} AND o.created_at BETWEEN ${start} AND ${end}
    GROUP BY it.name
    ORDER BY total DESC
  `);

  const summaryRes: any = await db.execute(sql`
    SELECT COUNT(DISTINCT t.id) as tabs, COUNT(o.id) as orders,
           COALESCE(SUM(oi.qty*oi.price_each),0) as revenue
    FROM orders o
    JOIN tabs t ON t.id = o.tab_id
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE t.venue_id = ${venueId} AND o.created_at BETWEEN ${start} AND ${end}
  `);

  const lowRes: any = await db.execute(sql`
    SELECT i.name, inv.on_hand_ml, inv.reorder_ml
    FROM inventory inv
    JOIN ingredients i ON i.id = inv.ingredient_id
    WHERE inv.venue_id = ${venueId} AND inv.on_hand_ml <= inv.reorder_ml
    ORDER BY i.name ASC
  `);

  const items = Array.from((itemsRes as any)?.rows ?? (itemsRes as any) ?? []);
  const summary = Array.from((summaryRes as any)?.rows ?? (summaryRes as any) ?? []);
  const low = Array.from((lowRes as any)?.rows ?? (lowRes as any) ?? []);

  return NextResponse.json({
    date: day.format("YYYY-MM-DD"),
    venueId,
    summary: summary[0] || { tabs: 0, orders: 0, revenue: 0 },
    items,
    low,
  });
}



