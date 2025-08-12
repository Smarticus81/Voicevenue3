/* 
 * Seed real drinks into Postgres from data/drinks.json.
 * - NO sample data, NO fallbacks.
 * - Converts dollars -> cents.
 * - Adds sane unit defaults by category.
 * Run:
 *   DATABASE_URL=... npx tsx apps/frontend/scripts/seed-drinks.ts --drinks ./data/drinks.json
 */

import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, sql } from 'drizzle-orm';
import { drinks as drinksTable } from '../server/db/schema';

type InputDrink = {
  name: string;
  category: string;
  subcategory?: string;
  price: number;     // dollars in your JSON
  inventory: number; // units
  sales?: number;
};

function cents(dollars: number): number {
  // Avoid float funkiness
  return Math.round(Number(dollars) * 100);
}

function unitDefaults(category: string) {
  const c = category.toLowerCase();
  // Track inventory in units; add serving defaults for reports and future pours
  if (c === 'beer')        return { unit_type: 'bottle', unit_volume_oz: 12,  serving_size_oz: 12 };
  if (c === 'wine')        return { unit_type: 'glass',  unit_volume_oz: 25,  serving_size_oz: 5 };
  if (c === 'spirits')     return { unit_type: 'shot',   unit_volume_oz: 25,  serving_size_oz: 1.5 };
  if (c === 'classics')    return { unit_type: 'ounce',  unit_volume_oz: 0,   serving_size_oz: 8 };
  if (c === 'signature')   return { unit_type: 'ounce',  unit_volume_oz: 0,   serving_size_oz: 8 };
  if (c === 'non-alcoholic') return { unit_type: 'ounce',unit_volume_oz: 12,  serving_size_oz: 12 };
  // sane fallback
  return { unit_type: 'ounce', unit_volume_oz: 0, serving_size_oz: 8 };
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

async function main() {
  const idx = process.argv.indexOf('--drinks');
  if (idx === -1 || !process.argv[idx + 1]) {
    throw new Error('Usage: tsx seed-drinks.ts --drinks ./data/drinks.json');
  }
  const filePath = path.resolve(process.cwd(), process.argv[idx + 1]);
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

  const raw = fs.readFileSync(filePath, 'utf8');
  const rows: InputDrink[] = JSON.parse(raw);
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('drinks.json is empty or invalid');
  }

  const DATABASE_URL = requireEnv('DATABASE_URL');
  const client = postgres(DATABASE_URL, { ssl: 'require', prepare: false });
  const db = drizzle(client);

  let inserted = 0, updated = 0;

  for (const r of rows) {
    if (!r?.name || !r?.category || typeof r?.price !== 'number' || typeof r?.inventory !== 'number') {
      throw new Error(`Invalid drink row: ${JSON.stringify(r)}`);
    }

    // Upsert by LOWER(name)
  const existing = await db
    .select({ id: drinksTable.id, name: drinksTable.name })
    .from(drinksTable)
    .where(sql`LOWER(${drinksTable.name}) = ${r.name.toLowerCase()} AND LOWER(${drinksTable.category}) = ${r.category.toLowerCase()}`)
    .limit(1);

    const units = unitDefaults(r.category);
    const payload = {
      name: r.name,
      category: r.category,
      subcategory: r.subcategory ?? null,
      price: cents(r.price),
      inventory: r.inventory,
      unit_type: units.unit_type,
      unit_volume_oz: units.unit_volume_oz,
      serving_size_oz: units.serving_size_oz,
      is_active: true,
      updated_at: new Date(),
    };

    if (existing.length) {
      await db.update(drinksTable).set(payload).where(eq(drinksTable.id, existing[0].id));
      updated++;
    } else {
      await db.insert(drinksTable).values({ ...payload, created_at: new Date() });
      inserted++;
    }
  }

  await client.end({ timeout: 5 });
  console.log(`✅ Seed complete. Inserted: ${inserted}, Updated: ${updated}, Total: ${inserted + updated}`);
}

main().catch((e) => {
  console.error('❌ Seed failed:', e?.message || e);
  process.exit(1);
});

