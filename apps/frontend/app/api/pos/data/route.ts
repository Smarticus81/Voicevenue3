import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { menuItems, tables } from "@/server/db/schema.pos";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const venueId = searchParams.get('venueId') || "demo-venue";

    console.log(`[POS Data API] Loading complete POS data for venue: ${venueId}`);

    // Get menu items and tables for this venue
    const [items, venueTables] = await Promise.all([
      db.select().from(menuItems).where(eq(menuItems.venueId, venueId)),
      db.select().from(tables).where(eq(tables.venueId, venueId))
    ]);

    console.log(`[POS Data API] Found ${items.length} items and ${venueTables.length} tables for venue ${venueId}`);

    // Transform menu items to expected format
    const drinks = items.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category.toLowerCase(),
      price: parseFloat(item.price) / 100, // Convert cents to dollars if stored in cents
      inventory: 50, // Default inventory
      imgUrl: item.imgUrl,
      recipeNote: item.recipeNote
    }));

    // Transform tables
    const tableList = venueTables.map(table => ({
      id: table.id,
      name: table.name,
      active: table.active
    }));

    // Add default tables if none exist
    const finalTables = tableList.length > 0 ? tableList : [
      { id: 'table-1', name: 'Table 1', active: true },
      { id: 'table-2', name: 'Table 2', active: true },
      { id: 'table-3', name: 'Table 3', active: true },
      { id: 'bar-1', name: 'Bar 1', active: true },
      { id: 'bar-2', name: 'Bar 2', active: true },
      { id: 'patio-a', name: 'Patio A', active: true }
    ];

    return NextResponse.json({ 
      ok: true, 
      venueId,
      drinks,
      tables: finalTables,
      stats: {
        itemCount: drinks.length,
        tableCount: finalTables.length,
        categories: [...new Set(drinks.map(d => d.category))]
      }
    });

  } catch (error: any) {
    console.error('[POS Data API] Error loading venue data:', error);
    
    // Return fallback data
    return NextResponse.json({ 
      ok: false,
      error: error.message,
      venueId: "fallback",
      drinks: [
        { id: '1', name: 'Mimosa', price: 8.00, category: 'cocktails', inventory: 25 },
        { id: '2', name: 'Martini', price: 12.00, category: 'cocktails', inventory: 15 },
        { id: '3', name: 'Chardonnay', price: 10.00, category: 'wine', inventory: 8 }
      ],
      tables: [
        { id: 'table-1', name: 'Table 1', active: true },
        { id: 'table-2', name: 'Table 2', active: true }
      ]
    }, { status: 500 });
  }
}
