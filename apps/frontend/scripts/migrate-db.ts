/*
 * Database Migration Script
 * Creates all tables defined in the schema if they don't exist
 * Run: DATABASE_URL=... npx tsx apps/frontend/scripts/migrate-db.ts
 */

import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

async function main() {
  // Load env from .env.local first (Next.js-style), then fallback to .env
  const envDir = process.cwd();
  const envLocal = path.join(envDir, '.env.local');
  if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal, override: false });
  dotenv.config({ override: false });

  const DATABASE_URL = requireEnv('DATABASE_URL');
  const client = postgres(DATABASE_URL, { ssl: 'require', prepare: false });
  const db = drizzle(client);

  console.log('🚀 Creating database tables...');

  try {
    // Ensure pgcrypto for gen_random_uuid(); ignore timeouts on poolers
    try {
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    } catch (e) {
      console.warn('[migrate] extension create skipped:', (e as any)?.message || e);
    }

    // Create drinks table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "drinks" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(255) NOT NULL,
        "category" varchar(64) NOT NULL,
        "subcategory" varchar(64),
        "price" integer NOT NULL,
        "inventory" integer DEFAULT 0 NOT NULL,
        "unit_type" varchar(32) DEFAULT 'ounce' NOT NULL,
        "unit_volume_oz" numeric(6,2) DEFAULT 8 NOT NULL,
        "serving_size_oz" numeric(6,2) DEFAULT 8 NOT NULL,
        "inventory_oz" numeric(10,2) DEFAULT 0 NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    // Create system_config table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "system_config" (
        "id" serial PRIMARY KEY NOT NULL,
        "config_key" varchar(128) UNIQUE NOT NULL,
        "config_value" jsonb NOT NULL,
        "config_type" varchar(32) DEFAULT 'json' NOT NULL,
        "description" varchar(255),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    // Create ingredients table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "ingredients" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    // Ensure unique constraint on ingredient name for idempotent seeds
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS ingredients_name_key ON "ingredients" ("name");`);

    // Create inventory table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "inventory" (
        "venue_id" varchar(128),
        "ingredient_id" uuid,
        "on_hand_ml" integer DEFAULT 0,
        "par_ml" integer DEFAULT 0,
        "reorder_ml" integer DEFAULT 0
      );
    `);

    // Bring existing inventory table up to expected shape (idempotent)
    await db.execute(sql`ALTER TABLE "inventory" ADD COLUMN IF NOT EXISTS "venue_id" varchar(128);`);
    await db.execute(sql`ALTER TABLE "inventory" ADD COLUMN IF NOT EXISTS "ingredient_id" uuid;`);
    await db.execute(sql`ALTER TABLE "inventory" ADD COLUMN IF NOT EXISTS "on_hand_ml" integer DEFAULT 0;`);
    await db.execute(sql`ALTER TABLE "inventory" ADD COLUMN IF NOT EXISTS "par_ml" integer DEFAULT 0;`);
    await db.execute(sql`ALTER TABLE "inventory" ADD COLUMN IF NOT EXISTS "reorder_ml" integer DEFAULT 0;`);

    // Ensure unique pair for idempotent seeds
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS inventory_venue_ingredient_key ON "inventory" ("venue_id", "ingredient_id");`);

    // Create tabs table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "tabs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "venue_id" varchar(128) NOT NULL,
        "guest_name" varchar(255) NOT NULL,
        "status" varchar(32) DEFAULT 'open' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    // Create items table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "venue_id" varchar(128) NOT NULL,
        "name" varchar(255) NOT NULL,
        "unit_price" numeric(10,2) DEFAULT 0 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    // Create recipes table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "recipes" (
        "item_id" uuid NOT NULL,
        "ingredient_id" uuid NOT NULL,
        "amount_ml" integer DEFAULT 0 NOT NULL
      );
    `);

    // Create orders table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tab_id" uuid NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    // Create order_items table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "order_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_id" uuid NOT NULL,
        "item_id" uuid NOT NULL,
        "qty" integer DEFAULT 1 NOT NULL,
        "price_each" numeric(10,2) DEFAULT 0 NOT NULL
      );
    `);

    // Create traces table for latency instrumentation
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "traces" (
        "id" text PRIMARY KEY,
        "started_at" timestamptz NOT NULL DEFAULT now(),
        "venue_id" text NOT NULL,
        "agent_id" text NOT NULL,
        "label" text
      );
    `);

    // Create trace_spans table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "trace_spans" (
        "id" text PRIMARY KEY,
        "trace_id" text NOT NULL,
        "name" text NOT NULL,
        "started_at" timestamptz NOT NULL DEFAULT now(),
        "duration_ms" integer,
        "attrs" jsonb
      );
    `);

    // Helpful indexes for trace queries
    await db.execute(sql`CREATE INDEX IF NOT EXISTS trace_spans_trace_id_idx ON "trace_spans" ("trace_id");`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS traces_started_at_idx ON "traces" ("started_at");`);

    // Phase 14: Multi-venue + Events schema
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS orgs (
        id text PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS venues (
        id text PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id text NOT NULL,
        name text NOT NULL,
        address text,
        timezone text DEFAULT 'America/Chicago',
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // Bring venues to expected shape if pre-existed
    await db.execute(sql`ALTER TABLE venues ADD COLUMN IF NOT EXISTS organization_id text;`);
    await db.execute(sql`ALTER TABLE venues ADD COLUMN IF NOT EXISTS address text;`);
    await db.execute(sql`ALTER TABLE venues ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/Chicago';`);
    await db.execute(sql`ALTER TABLE venues ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;`);
    await db.execute(sql`ALTER TABLE venues ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS venue_linking (
        id text PRIMARY KEY DEFAULT gen_random_uuid(),
        parent_venue_id text NOT NULL,
        child_venue_id text NOT NULL,
        link_inventory boolean NOT NULL DEFAULT false,
        link_staff boolean NOT NULL DEFAULT false,
        link_events boolean NOT NULL DEFAULT false
      );
    `);

    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS venue_linking_parent_child_idx ON venue_linking(parent_venue_id, child_venue_id);
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS event_types (
        id text PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id text NOT NULL,
        name text NOT NULL,
        color_hex text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // Bring event_types to expected shape if pre-existed
    await db.execute(sql`ALTER TABLE event_types ADD COLUMN IF NOT EXISTS organization_id text;`);
    await db.execute(sql`ALTER TABLE event_types ADD COLUMN IF NOT EXISTS name text;`);
    await db.execute(sql`ALTER TABLE event_types ADD COLUMN IF NOT EXISTS color_hex text;`);

    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS event_types_org_name_idx ON event_types(organization_id, name);
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS event_packages (
        id text PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id text NOT NULL,
        name text NOT NULL,
        description text,
        base_price_cents integer NOT NULL DEFAULT 0,
        default_duration_minutes integer NOT NULL DEFAULT 180,
        includes_premium_spirits boolean NOT NULL DEFAULT false,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // Bring event_packages to expected shape if pre-existed
    await db.execute(sql`ALTER TABLE event_packages ADD COLUMN IF NOT EXISTS organization_id text;`);
    await db.execute(sql`ALTER TABLE event_packages ADD COLUMN IF NOT EXISTS name text;`);
    await db.execute(sql`ALTER TABLE event_packages ADD COLUMN IF NOT EXISTS description text;`);
    await db.execute(sql`ALTER TABLE event_packages ADD COLUMN IF NOT EXISTS base_price_cents integer DEFAULT 0;`);
    await db.execute(sql`ALTER TABLE event_packages ADD COLUMN IF NOT EXISTS default_duration_minutes integer DEFAULT 180;`);
    await db.execute(sql`ALTER TABLE event_packages ADD COLUMN IF NOT EXISTS includes_premium_spirits boolean DEFAULT false;`);
    await db.execute(sql`ALTER TABLE event_packages ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;`);
    await db.execute(sql`ALTER TABLE event_packages ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();`);

    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS event_packages_org_name_idx ON event_packages(organization_id, name);
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS package_inventory_rules (
        id text PRIMARY KEY DEFAULT gen_random_uuid(),
        package_id text NOT NULL,
        inventory_item_id uuid NOT NULL,
        qty_per_guest numeric(12,3) NOT NULL DEFAULT 0,
        is_substitutable boolean NOT NULL DEFAULT true,
        substitution_group text
      );
    `);

    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS package_rules_unique ON package_inventory_rules(package_id, inventory_item_id);
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS events (
        id text PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id text NOT NULL,
        venue_id text NOT NULL,
        event_type_id text NOT NULL,
        package_id text NOT NULL,
        name text NOT NULL,
        starts_at timestamptz NOT NULL,
        ends_at timestamptz NOT NULL,
        expected_guests integer NOT NULL CHECK (expected_guests >= 0),
        status text NOT NULL DEFAULT 'scheduled',
        notes text,
        created_by text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS events_org_venue_time_idx ON events(organization_id, venue_id, starts_at, ends_at);`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS event_inventory_allocations (
        id text PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id text NOT NULL,
        venue_id text NOT NULL,
        inventory_item_id uuid NOT NULL,
        required_qty numeric(12,3) NOT NULL,
        allocated_qty numeric(12,3) NOT NULL DEFAULT 0,
        shortage_qty numeric(12,3) NOT NULL DEFAULT 0,
        substitution_of text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS event_allocations_event_id_idx ON event_inventory_allocations(event_id);`);

    // Create venue_settings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "venue_settings" (
        "venue_id" text PRIMARY KEY,
        "asr_provider" text NOT NULL DEFAULT 'deepgram',
        "asr_model" text DEFAULT 'nova-2',
        "tts_provider" text NOT NULL DEFAULT 'elevenlabs',
        "tts_voice" text DEFAULT 'Rachel',
        "realtime_model" text DEFAULT 'gpt-4o-realtime-preview-2024-12-17',
        "realtime_voice" text DEFAULT 'sage',
        "region" text DEFAULT 'us-east',
        "wake_confidence_min" numeric DEFAULT '0.65',
        "vad_min_db" integer DEFAULT -42,
        "vad_hang_ms" integer DEFAULT 280,
        "kiosk_pin_hash" text,
        "custom_wake_word" text DEFAULT 'hey bev',
        "wake_fuzz_max_distance" integer DEFAULT 2,
        "extras" jsonb,
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    // Bring venue_settings up to date (idempotent add columns)
    await db.execute(sql`ALTER TABLE "venue_settings" ADD COLUMN IF NOT EXISTS "wake_confidence_min" numeric DEFAULT '0.65';`);
    await db.execute(sql`ALTER TABLE "venue_settings" ADD COLUMN IF NOT EXISTS "vad_min_db" integer DEFAULT -42;`);
    await db.execute(sql`ALTER TABLE "venue_settings" ADD COLUMN IF NOT EXISTS "vad_hang_ms" integer DEFAULT 280;`);
    await db.execute(sql`ALTER TABLE "venue_settings" ADD COLUMN IF NOT EXISTS "kiosk_pin_hash" text;`);
    await db.execute(sql`ALTER TABLE "venue_settings" ADD COLUMN IF NOT EXISTS "custom_wake_word" text DEFAULT 'hey bev';`);
    await db.execute(sql`ALTER TABLE "venue_settings" ADD COLUMN IF NOT EXISTS "wake_fuzz_max_distance" integer DEFAULT 2;`);

    // POS schema (tables, menu_items, ingredients, inventory, orders, order_items)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "pos_tables" (
        "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
        "venue_id" text NOT NULL,
        "name" text NOT NULL,
        "active" boolean NOT NULL DEFAULT true
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "pos_menu_items" (
        "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
        "venue_id" text NOT NULL,
        "name" text NOT NULL,
        "category" text NOT NULL DEFAULT 'Drinks',
        "price" numeric NOT NULL DEFAULT '0',
        "img_url" text,
        "recipe_note" text
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "pos_ingredients" (
        "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
        "venue_id" text NOT NULL,
        "name" text NOT NULL,
        "unit" text NOT NULL DEFAULT 'ml'
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "pos_inventory" (
        "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
        "venue_id" text NOT NULL,
        "ingredient_id" text NOT NULL,
        "on_hand" numeric NOT NULL DEFAULT '0',
        "reorder_level" numeric NOT NULL DEFAULT '0'
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "pos_orders" (
        "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
        "venue_id" text NOT NULL,
        "table_id" text,
        "tab_name" text,
        "status" text NOT NULL DEFAULT 'open',
        "total" numeric NOT NULL DEFAULT '0',
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "pos_order_items" (
        "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_id" text NOT NULL,
        "menu_item_id" text NOT NULL,
        "name" text NOT NULL,
        "qty" integer NOT NULL DEFAULT 1,
        "price_each" numeric NOT NULL DEFAULT '0',
        "subtotal" numeric NOT NULL DEFAULT '0'
      );
    `);

    // Insert some sample ingredients and inventory
    await db.execute(sql`
      INSERT INTO "ingredients" ("name") VALUES 
        ('Vodka'),
        ('Gin'),
        ('Rum'),
        ('Whiskey'),
        ('Tequila')
      ON CONFLICT ("name") DO NOTHING;
    `);

    // Detect incompatible legacy schema (e.g., NOT NULL drink_id). If present, skip inventory seed.
    const drinkIdProbe = await db.execute(sql`
      select 1 as one from information_schema.columns 
      where table_name = 'inventory' and column_name = 'drink_id' limit 1;
    `);
    const hasLegacyDrinkId = Array.isArray(drinkIdProbe) && (drinkIdProbe as any).length > 0;

    if (!hasLegacyDrinkId) {
      await db.execute(sql`
        INSERT INTO "inventory" ("venue_id", "ingredient_id", "on_hand_ml", "par_ml", "reorder_ml") VALUES 
          (
            'demo-venue',
            (SELECT id FROM "ingredients" WHERE name = 'Vodka' LIMIT 1),
            500, 1000, 200
          ),
          (
            'demo-venue',
            (SELECT id FROM "ingredients" WHERE name = 'Gin' LIMIT 1),
            300, 1000, 200
          ),
          (
            'demo-venue',
            (SELECT id FROM "ingredients" WHERE name = 'Rum' LIMIT 1),
            150, 1000, 200
          ),
          (
            'demo-venue',
            (SELECT id FROM "ingredients" WHERE name = 'Whiskey' LIMIT 1),
            800, 1000, 200
          ),
          (
            'demo-venue',
            (SELECT id FROM "ingredients" WHERE name = 'Tequila' LIMIT 1),
            100, 1000, 200
          )
        ON CONFLICT ("venue_id", "ingredient_id") DO NOTHING;
      `);
    }

    console.log('✅ Database tables created successfully!');
    console.log('📊 Sample data inserted for demo venue');

    // Seed default venue settings if not present
    await db.execute(sql`
      INSERT INTO "venue_settings" ("venue_id", "asr_provider", "asr_model", "tts_provider", "tts_voice", "realtime_model", "realtime_voice", "region")
      VALUES ('demo-venue', 'deepgram', 'nova-2', 'elevenlabs', 'Rachel', 'gpt-4o-realtime-preview-2024-12-17', 'sage', 'us-east')
      ON CONFLICT ("venue_id") DO NOTHING;
    `);

    // Platform core tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS workspaces (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id text NOT NULL,
        name text NOT NULL,
        slug text NOT NULL,
        theme jsonb DEFAULT '{}'::jsonb,
        pwa_brand jsonb DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS workspaces_org_slug_idx ON workspaces(organization_id, slug);`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS workspace_secrets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id uuid NOT NULL,
        key_name text NOT NULL,
        ciphertext text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS agent_templates (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        kind text NOT NULL,
        default_manifest_json jsonb NOT NULL,
        version int NOT NULL DEFAULT 1,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS agent_manifests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id uuid NOT NULL,
        template_id uuid,
        version int NOT NULL,
        manifest_json jsonb NOT NULL,
        status text NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS usage_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id text NOT NULL,
        workspace_id uuid,
        metric text NOT NULL,
        qty numeric(18,6) NOT NULL DEFAULT 0,
        at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS billing_subscriptions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id text NOT NULL,
        stripe_customer_id text,
        stripe_sub_id text,
        plan text,
        status text NOT NULL DEFAULT 'trialing',
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id text NOT NULL,
        workspace_id uuid,
        actor jsonb,
        action text NOT NULL,
        meta_json jsonb,
        at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // Phase 14 seed: ensure a default organization and two venues if not present
    await db.execute(sql`
      INSERT INTO orgs (id, name)
      VALUES ('demo-org', 'Demo Org')
      ON CONFLICT (id) DO NOTHING;
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS event_venues (
        id text PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id text NOT NULL,
        name text NOT NULL,
        address text,
        timezone text DEFAULT 'America/Chicago',
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await db.execute(sql`INSERT INTO event_venues (id, organization_id, name, address, timezone) VALUES ('demo-venue', 'demo-org', 'Venue A', '123 Main St', 'America/Chicago') ON CONFLICT (id) DO NOTHING;`);
    await db.execute(sql`INSERT INTO event_venues (id, organization_id, name, address, timezone) VALUES ('demo-venue-b', 'demo-org', 'Venue B', '456 Side St', 'America/Chicago') ON CONFLICT (id) DO NOTHING;`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end({ timeout: 5 });
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

export { main as migrateDb };
