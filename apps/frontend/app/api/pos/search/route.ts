import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { menuItems } from "@/server/db/schema.pos";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

function score(a: string, b: string) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  if (a === b) return 1;
  if (a.includes(b)) return 0.9;
  const as = new Set(a.split(/\s+/)),
    bs = new Set(b.split(/\s+/));
  const inter = [...as].filter((x) => bs.has(x)).length;
  return inter / Math.max(as.size, bs.size || 1);
}

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const venueId = u.searchParams.get("venueId") || "demo-venue";
    const q = (u.searchParams.get("q") || "").toString();
    const rows = await db.select().from(menuItems).where(eq(menuItems.venueId, venueId));
    const ranked = rows
      .map((r: any) => ({ id: r.id, name: r.name, price: r.price, s: score(r.name, q) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 10);
    return NextResponse.json({ results: ranked });
  } catch (e: any) {
    return NextResponse.json({ results: [], _warning: "search failed" });
  }
}


