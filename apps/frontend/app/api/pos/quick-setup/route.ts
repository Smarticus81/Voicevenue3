export const runtime = 'nodejs';

interface QuickSetupRequest {
  venueId: string;
  template: string;
  businessName: string;
  source?: string;
}

const TEMPLATE_DATA = {
  drinks: {
    items: [
      { name: "Beer", price: 500, category: "Alcohol", stock: 100 },
      { name: "Wine", price: 800, category: "Alcohol", stock: 50 },
      { name: "Cocktail", price: 1200, category: "Alcohol", stock: 75 },
      { name: "Soda", price: 300, category: "Non-Alcohol", stock: 200 },
      { name: "Water", price: 200, category: "Non-Alcohol", stock: 150 },
      { name: "Coffee", price: 400, category: "Hot Drinks", stock: 100 }
    ]
  },
  retail: {
    items: [
      { name: "T-Shirt", price: 2500, category: "Clothing", stock: 50 },
      { name: "Hat", price: 1500, category: "Accessories", stock: 30 },
      { name: "Mug", price: 1000, category: "Merchandise", stock: 75 },
      { name: "Keychain", price: 500, category: "Accessories", stock: 100 }
    ]
  },
  restaurant: {
    items: [
      { name: "Burger", price: 1200, category: "Mains", stock: 50 },
      { name: "Pizza", price: 1500, category: "Mains", stock: 30 },
      { name: "Salad", price: 900, category: "Starters", stock: 40 },
      { name: "Fries", price: 600, category: "Sides", stock: 100 },
      { name: "Dessert", price: 700, category: "Desserts", stock: 25 }
    ]
  }
};

export async function POST(req: Request) {
  try {
    const { venueId, template, businessName, source = "template" }: QuickSetupRequest = await req.json();
    
    if (!venueId || !template || !businessName) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing required fields' }), { status: 400 });
    }

    // Only proceed with template setup if source is "template"
    if (source !== "template") {
      return new Response(JSON.stringify({ 
        ok: true, 
        message: 'POS setup skipped - using external inventory source',
        source 
      }), { status: 200 });
    }

    const templateData = TEMPLATE_DATA[template as keyof typeof TEMPLATE_DATA];
    if (!templateData) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid template' }), { status: 400 });
    }

    // Import database functions
    const postgres = (await import('postgres')).default;
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const { drinks } = await import('../../../../server/db/schema');

    const client = postgres(process.env.DATABASE_URL!, { ssl: 'require', prepare: false });
    const db = drizzle(client);

    // Clear existing items for this venue
    await db.delete(drinks);

    // Insert template items
    const itemsToInsert = templateData.items.map(item => ({
      name: item.name,
      category: item.category,
      price: item.price,
      inventory: item.stock,
      is_active: true
    }));

    await db.insert(drinks).values(itemsToInsert);
    await client.end({ timeout: 5 });

    return new Response(JSON.stringify({ 
      ok: true, 
      itemsCreated: itemsToInsert.length,
      template 
    }), { status: 200 });

  } catch (error: any) {
    console.error('Quick POS setup failed:', error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: error?.message || 'Setup failed' 
    }), { status: 500 });
  }
}
