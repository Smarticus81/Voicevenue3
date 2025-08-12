import dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';

async function main() {
  dotenv.config();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const client = postgres(url, { ssl: 'require', prepare: false });
  const db = drizzle(client);

  // Org
  await db.execute(sql`INSERT INTO organizations (id, name) VALUES ('demo-org', 'Demo Org') ON CONFLICT (id) DO NOTHING;`);

  // Venues
  await db.execute(sql`INSERT INTO venues (id, organization_id, name) VALUES ('demo-venue', 'demo-org', 'Venue A') ON CONFLICT (id) DO NOTHING;`);
  await db.execute(sql`INSERT INTO venues (id, organization_id, name) VALUES ('demo-venue-b', 'demo-org', 'Venue B') ON CONFLICT (id) DO NOTHING;`);

  // Event types
  const weddingId = 'wedding-type';
  const corpId = 'corporate-type';
  await db.execute(sql`INSERT INTO event_types (id, organization_id, name, color_hex) VALUES (${weddingId}, 'demo-org', 'Wedding', '#C084FC') ON CONFLICT (id) DO NOTHING;`);
  await db.execute(sql`INSERT INTO event_types (id, organization_id, name, color_hex) VALUES (${corpId}, 'demo-org', 'Corporate', '#60A5FA') ON CONFLICT (id) DO NOTHING;`);

  // Packages
  const basicId = 'pkg-basic';
  const bigId = 'pkg-big';
  await db.execute(sql`INSERT INTO event_packages (id, organization_id, name, description, base_price_cents) VALUES (${basicId}, 'demo-org', 'Basics Bar', 'Standard beer & wine', 250000) ON CONFLICT (id) DO NOTHING;`);
  await db.execute(sql`INSERT INTO event_packages (id, organization_id, name, description, base_price_cents, includes_premium_spirits) VALUES (${bigId}, 'demo-org', 'Big Time Bar', 'Adds spirits', 450000, true) ON CONFLICT (id) DO NOTHING;`);

  // Ensure ingredients exist
  await db.execute(sql`INSERT INTO ingredients (name) VALUES ('Beer') ON CONFLICT (name) DO NOTHING;`);
  await db.execute(sql`INSERT INTO ingredients (name) VALUES ('White Wine') ON CONFLICT (name) DO NOTHING;`);
  await db.execute(sql`INSERT INTO ingredients (name) VALUES ('Red Wine') ON CONFLICT (name) DO NOTHING;`);
  await db.execute(sql`INSERT INTO ingredients (name) VALUES ('Vodka') ON CONFLICT (name) DO NOTHING;`);

  const beerId = await db.execute(sql`SELECT id FROM ingredients WHERE name='Beer' LIMIT 1;`);
  const whiteId = await db.execute(sql`SELECT id FROM ingredients WHERE name='White Wine' LIMIT 1;`);
  const redId = await db.execute(sql`SELECT id FROM ingredients WHERE name='Red Wine' LIMIT 1;`);
  const vodkaId = await db.execute(sql`SELECT id FROM ingredients WHERE name='Vodka' LIMIT 1;`);

  const beer = (beerId as any)[0]?.id;
  const white = (whiteId as any)[0]?.id;
  const red = (redId as any)[0]?.id;
  const vodka = (vodkaId as any)[0]?.id;

  // Package rules
  await db.execute(sql`DELETE FROM package_inventory_rules WHERE package_id IN (${basicId}, ${bigId});`);
  await db.execute(sql`
    INSERT INTO package_inventory_rules (package_id, inventory_item_id, qty_per_guest, is_substitutable, substitution_group)
    VALUES
      (${basicId}, ${beer}, 0.75, true, 'beer'),
      (${basicId}, ${white}, 0.25, true, 'white_wine'),
      (${basicId}, ${red}, 0.25, true, 'red_wine'),
      (${bigId}, ${beer}, 0.5, true, 'beer'),
      (${bigId}, ${white}, 0.25, true, 'white_wine'),
      (${bigId}, ${red}, 0.25, true, 'red_wine'),
      (${bigId}, ${vodka}, 0.2, true, 'spirit')
  `);

  // Inventory spread across venues
  await db.execute(sql`INSERT INTO inventory (venue_id, ingredient_id, on_hand_ml, par_ml, reorder_ml) VALUES ('demo-venue', ${beer}, 50000, 100000, 20000) ON CONFLICT (venue_id, ingredient_id) DO NOTHING;`);
  await db.execute(sql`INSERT INTO inventory (venue_id, ingredient_id, on_hand_ml, par_ml, reorder_ml) VALUES ('demo-venue', ${white}, 20000, 50000, 10000) ON CONFLICT (venue_id, ingredient_id) DO NOTHING;`);
  await db.execute(sql`INSERT INTO inventory (venue_id, ingredient_id, on_hand_ml, par_ml, reorder_ml) VALUES ('demo-venue-b', ${beer}, 15000, 50000, 10000) ON CONFLICT (venue_id, ingredient_id) DO NOTHING;`);
  await db.execute(sql`INSERT INTO inventory (venue_id, ingredient_id, on_hand_ml, par_ml, reorder_ml) VALUES ('demo-venue-b', ${vodka}, 12000, 20000, 5000) ON CONFLICT (venue_id, ingredient_id) DO NOTHING;`);

  console.log('Seed complete for Phase 14');
  await client.end({ timeout: 5 });
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}


