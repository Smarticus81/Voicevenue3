import { pgTable, text, numeric, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const tables = pgTable("pos_tables", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  venueId: text("venue_id").notNull(),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
});

export const menuItems = pgTable("pos_menu_items", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  venueId: text("venue_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull().default("Drinks"),
  price: numeric("price").notNull().default("0"),
  imgUrl: text("img_url"),
  recipeNote: text("recipe_note"),
});

export const ingredients = pgTable("pos_ingredients", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  venueId: text("venue_id").notNull(),
  name: text("name").notNull(),
  unit: text("unit").notNull().default("ml"),
});

export const inventory = pgTable("pos_inventory", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  venueId: text("venue_id").notNull(),
  ingredientId: text("ingredient_id").notNull(),
  onHand: numeric("on_hand").notNull().default("0"),
  reorderLevel: numeric("reorder_level").notNull().default("0"),
});

export const orders = pgTable("pos_orders", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  venueId: text("venue_id").notNull(),
  tableId: text("table_id"),
  tabName: text("tab_name"),
  status: text("status").notNull().default("open"),
  total: numeric("total").notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable("pos_order_items", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: text("order_id").notNull(),
  menuItemId: text("menu_item_id").notNull(),
  name: text("name").notNull(),
  qty: integer("qty").notNull().default(1),
  priceEach: numeric("price_each").notNull().default("0"),
  subtotal: numeric("subtotal").notNull().default("0"),
});


