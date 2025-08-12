import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const venueId = u.searchParams.get("venueId") || "demo-venue";

  const res: any = await db.execute(sql`
    SELECT it.name, SUM(oi.qty) as qty
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN tabs t ON t.id = o.tab_id
    JOIN items it ON it.id = oi.item_id
    WHERE t.venue_id = ${venueId} AND o.created_at > now() - interval '6 hours'
    GROUP BY it.name
    ORDER BY qty DESC
    LIMIT 5
  `);
  const rows = Array.from((res as any)?.rows ?? (res as any) ?? []);
  return NextResponse.json({ rows });
}



