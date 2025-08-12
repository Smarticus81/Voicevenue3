import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { tables, menuItems, ingredients, inventory } from "@/server/db/schema.pos";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const venueId = body.venueId || "demo-venue";

    const newTables = (body.tables || []).map((t: any) => ({
      venueId,
      name: String(t.name || "").trim() || "Table",
      active: true,
    }));
    if (newTables.length) await db.insert(tables).values(newTables as any);

    const newItems = (body.menu || [])
      .map((m: any) => ({
        venueId,
        name: String(m.name || "").trim(),
        category: String(m.category || "Drinks").trim(),
        price: String(m.price ?? "0"),
        imgUrl: m.imgUrl || null,
        recipeNote: m.recipeNote || null,
      }))
      .filter((x: any) => x.name);
    if (newItems.length) await db.insert(menuItems).values(newItems as any);

    const newIngr = (body.ingredients || [])
      .map((i: any) => ({ venueId, name: String(i.name || "").trim(), unit: i.unit || "ml" }))
      .filter((x: any) => x.name);
    if (newIngr.length) await db.insert(ingredients).values(newIngr as any);

    if (body.inventory && Array.isArray(body.inventory)) {
      const inv = body.inventory
        .map((it: any) => ({
          venueId,
          ingredientId: it.ingredientId,
          onHand: String(it.onHand ?? "0"),
          reorderLevel: String(it.reorderLevel ?? "0"),
        }))
        .filter((x: any) => x.ingredientId);
      if (inv.length) await db.insert(inventory).values(inv as any);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500 });
  }
}


