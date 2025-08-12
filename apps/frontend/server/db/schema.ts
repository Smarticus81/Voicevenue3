import { pgTable, serial, varchar, integer, boolean, timestamp, jsonb, numeric, uuid, text } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const drinks = pgTable('drinks', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 64 }).notNull(),
  subcategory: varchar('subcategory', { length: 64 }),
  price: integer('price').notNull(), // cents
  inventory: integer('inventory').notNull().default(0),
  unit_type: varchar('unit_type', { length: 32 }).notNull().default('ounce'),
  unit_volume_oz: numeric('unit_volume_oz', { precision: 6, scale: 2 }).$type<number>().notNull().default(8),
  serving_size_oz: numeric('serving_size_oz', { precision: 6, scale: 2 }).$type<number>().notNull().default(8),
  inventory_oz: numeric('inventory_oz', { precision: 10, scale: 2 }).$type<number>().notNull().default(0),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});

export const systemConfig = pgTable('system_config', {
  id: serial('id').primaryKey(),
  config_key: varchar('config_key', { length: 128 }).notNull().unique(),
  config_value: jsonb('config_value').notNull(),
  config_type: varchar('config_type', { length: 32 }).notNull().default('json'),
  description: varchar('description', { length: 255 }),
  created_at: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});

// --- Tooling-related minimal schema (inventory, ordering, tabs) ---

export const ingredients = pgTable('ingredients', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

export const inventory = pgTable('inventory', {
  venueId: varchar('venue_id', { length: 128 }).notNull(),
  ingredientId: uuid('ingredient_id').notNull(),
  onHandMl: integer('on_hand_ml').notNull().default(0),
  parMl: integer('par_ml').notNull().default(0),
  reorderMl: integer('reorder_ml').notNull().default(0),
});

export const tabs = pgTable('tabs', {
  id: uuid('id').defaultRandom().primaryKey(),
  venueId: varchar('venue_id', { length: 128 }).notNull(),
  guestName: varchar('guest_name', { length: 255 }).notNull(),
  status: varchar('status', { length: 32 }).notNull().default('open'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

export const items = pgTable('items', {
  id: uuid('id').defaultRandom().primaryKey(),
  venueId: varchar('venue_id', { length: 128 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).$type<number>().notNull().default(0),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

export const recipes = pgTable('recipes', {
  itemId: uuid('item_id').notNull(),
  ingredientId: uuid('ingredient_id').notNull(),
  amountMl: integer('amount_ml').notNull().default(0),
});

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  tabId: uuid('tab_id').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull(),
  itemId: uuid('item_id').notNull(),
  qty: integer('qty').notNull().default(1),
  priceEach: numeric('price_each', { precision: 10, scale: 2 }).$type<number>().notNull().default(0),
});

// --- Per-venue vendor & region settings ---
export const venueSettings = pgTable('venue_settings', {
  venueId: text('venue_id').primaryKey(),
  asrProvider: text('asr_provider').notNull().default('deepgram'),
  asrModel: text('asr_model').default('nova-2'),
  ttsProvider: text('tts_provider').notNull().default('elevenlabs'),
  ttsVoice: text('tts_voice').default('Rachel'),
  realtimeModel: text('realtime_model').default('gpt-4o-realtime-preview-2024-12-17'),
  realtimeVoice: text('realtime_voice').default('sage'),
  region: text('region').default('us-east'),
  // Phase 10: wake & VAD knobs, and kiosk PIN hash
  wakeConfidenceMin: numeric('wake_confidence_min').$type<string | number>().default('0.65'),
  vadMinDb: integer('vad_min_db').default(-42),
  vadHangoverMs: integer('vad_hang_ms').default(280),
  kioskPinHash: text('kiosk_pin_hash'),
  // Phase 12: custom wake word + fuzziness
  customWakeWord: text('custom_wake_word').default('hey bev'),
  wakeFuzzMaxDistance: integer('wake_fuzz_max_distance').default(2),
  extras: jsonb('extras'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
});

