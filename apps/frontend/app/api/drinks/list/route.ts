import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { menuItems } from "@/server/db/schema.pos";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const venueId = searchParams.get('venueId');
    
    if (!venueId) {
      return NextResponse.json({ 
        ok: false, 
        error: 'venueId parameter is required',
        drinks: [],
        count: 0 
      });
    }

    console.log(`[Drinks API] Loading menu items for venue: ${venueId}`);

    // Get menu items for this venue from POS schema
    const items = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.venueId, venueId));

    console.log(`[Drinks API] Found ${items.length} items for venue ${venueId}`);

    // Transform to expected format for kiosk
    const drinks = items.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category.toLowerCase(),
      price: parseFloat(item.price) / 100, // Convert from cents to dollars
      inventory: 50, // Default inventory - could be enhanced to track actual inventory
      imgUrl: item.imgUrl,
      recipeNote: item.recipeNote
    }));

    return NextResponse.json({ 
      ok: true, 
      drinks,
      venueId,
      count: drinks.length 
    });

  } catch (error: any) {
    console.error('[Drinks API] Error loading menu items:', error);
    
    // Fallback to default items if database query fails
    const defaultDrinks = [
      { id: '1', name: 'Mimosa', price: 8.00, category: 'cocktails', inventory: 25 },
      { id: '2', name: 'Martini', price: 12.00, category: 'cocktails', inventory: 15 },
      { id: '3', name: 'Chardonnay', price: 10.00, category: 'wine', inventory: 8 },
      { id: '4', name: 'IPA Beer', price: 6.00, category: 'beer', inventory: 32 },
      { id: '5', name: 'Whiskey', price: 15.00, category: 'spirits', inventory: 12 },
      { id: '6', name: 'Coca Cola', price: 3.00, category: 'non-alcoholic', inventory: 45 }
    ];

    return NextResponse.json({ 
      ok: true, 
      drinks: defaultDrinks,
      venueId: "fallback",
      count: defaultDrinks.length,
      warning: "Using fallback data - setup may not be complete"
    });
  }
}
