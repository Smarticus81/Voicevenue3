import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { inventory, ingredients } from "@/server/db/schema";
import { and, lte, eq } from "drizzle-orm";
export const runtime = "nodejs";
export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const venueId = u.searchParams.get("venueId") || "demo-venue";
    const rows = await db
      .select({
        ingredientId: inventory.ingredientId,
        onHandMl: inventory.onHandMl,
        reorderMl: inventory.reorderMl,
        name: ingredients.name,
      })
      .from(inventory)
      .leftJoin(ingredients, eq(inventory.ingredientId, ingredients.id))
      .where(and(eq(inventory.venueId, venueId), lte(inventory.onHandMl, inventory.reorderMl)));
    return NextResponse.json({ rows });
  } catch (err: any) {
    // return empty list on error to avoid client JSON parse failure during startup
    return NextResponse.json({ rows: [], _warning: err?.message || "query_failed" });
  }
}


