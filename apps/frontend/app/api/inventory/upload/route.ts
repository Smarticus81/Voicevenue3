export const runtime = 'nodejs';

interface CSVRow {
  name: string;
  category: string;
  price: number;
  inventory: number;
  subcategory?: string;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const venueId = formData.get('venueId') as string;
    const businessName = formData.get('businessName') as string;

    if (!file || !venueId || !businessName) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing required fields' }), { status: 400 });
    }

    // Read file content
    const content = await file.text();
    let rows: CSVRow[] = [];

    if (file.name.endsWith('.csv')) {
      // Parse CSV
      const lines = content.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Validate required columns
      const requiredColumns = ['name', 'category', 'price', 'inventory'];
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      if (missingColumns.length > 0) {
        return new Response(JSON.stringify({ 
          ok: false, 
          error: `Missing required columns: ${missingColumns.join(', ')}` 
        }), { status: 400 });
      }

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        rows.push({
          name: row.name,
          category: row.category,
          subcategory: row.subcategory || null,
          price: parseFloat(row.price) || 0,
          inventory: parseInt(row.inventory) || 0
        });
      }
    } else {
      // Handle Excel files (basic implementation)
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'Excel support coming soon. Please use CSV format.' 
      }), { status: 400 });
    }

    // Validate data
    const invalidRows = rows.filter(row => !row.name || !row.category || isNaN(row.price) || isNaN(row.inventory));
    if (invalidRows.length > 0) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: `Invalid data in ${invalidRows.length} rows. Please check name, category, price, and inventory columns.` 
      }), { status: 400 });
    }

    // Import database functions
    const postgres = (await import('postgres')).default;
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const { drinks } = await import('../../../../server/db/schema');

    const client = postgres(process.env.DATABASE_URL!, { ssl: 'require', prepare: false });
    const db = drizzle(client);

    // Clear existing items for this venue
    await db.delete(drinks);

    // Insert uploaded items
    const itemsToInsert = rows.map(row => ({
      name: row.name,
      category: row.category,
      subcategory: row.subcategory,
      price: Math.round(row.price * 100), // Convert to cents
      inventory: row.inventory,
      is_active: true
    }));

    await db.insert(drinks).values(itemsToInsert);
    await client.end({ timeout: 5 });

    return new Response(JSON.stringify({ 
      ok: true, 
      itemsImported: itemsToInsert.length,
      source: 'upload'
    }), { status: 200 });

  } catch (error: any) {
    console.error('Inventory upload failed:', error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: error?.message || 'Upload failed' 
    }), { status: 500 });
  }
}
