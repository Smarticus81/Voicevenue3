import { pgTable, text, timestamp, boolean, integer, numeric, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Organizations
export const organizations = pgTable("organizations", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Event venues (separate from any legacy venues table)
export const eventVenues = pgTable("event_venues", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: text("organization_id").notNull(),
  name: text("name").notNull(),
  address: text("address"),
  timezone: text("timezone").default("America/Chicago"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Venue linking (for shared resources)
export const venueLinking = pgTable("venue_linking", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  parentVenueId: text("parent_venue_id").notNull(),
  childVenueId: text("child_venue_id").notNull(),
  linkInventory: boolean("link_inventory").notNull().default(false),
  linkStaff: boolean("link_staff").notNull().default(false),
  linkEvents: boolean("link_events").notNull().default(false),
});

// Event types
export const eventTypes = pgTable("event_types", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: text("organization_id").notNull(),
  name: text("name").notNull(),
  colorHex: text("color_hex").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Event packages
export const eventPackages = pgTable("event_packages", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: text("organization_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  basePriceCents: integer("base_price_cents").notNull().default(0),
  defaultDurationMinutes: integer("default_duration_minutes").notNull().default(180),
  includesPremiumSpirits: boolean("includes_premium_spirits").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Package inventory rules: reference ingredients as inventory items
export const packageInventoryRules = pgTable("package_inventory_rules", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  packageId: text("package_id").notNull(),
  inventoryItemId: uuid("inventory_item_id").notNull(),
  qtyPerGuest: numeric("qty_per_guest", { precision: 12, scale: 3 }).notNull().default("0"),
  isSubstitutable: boolean("is_substitutable").notNull().default(true),
  substitutionGroup: text("substitution_group"),
});

// Events
export const events = pgTable("events", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: text("organization_id").notNull(),
  venueId: text("venue_id").notNull(),
  eventTypeId: text("event_type_id").notNull(),
  packageId: text("package_id").notNull(),
  name: text("name").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  expectedGuests: integer("expected_guests").notNull(),
  status: text("status").notNull().default("scheduled"),
  notes: text("notes"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Inventory allocations per event and item
export const eventInventoryAllocations = pgTable("event_inventory_allocations", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: text("event_id").notNull(),
  venueId: text("venue_id").notNull(),
  inventoryItemId: uuid("inventory_item_id").notNull(),
  requiredQty: numeric("required_qty", { precision: 12, scale: 3 }).notNull(),
  allocatedQty: numeric("allocated_qty", { precision: 12, scale: 3 }).notNull().default("0"),
  shortageQty: numeric("shortage_qty", { precision: 12, scale: 3 }).notNull().default("0"),
  substitutionOf: text("substitution_of"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});


