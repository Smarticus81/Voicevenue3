import { pgTable, text, primaryKey, uuid, timestamp, jsonb, integer, numeric } from "drizzle-orm/pg-core";

export const orgs = pgTable("orgs", {
  id: text("id").primaryKey(), // uuid in real life
  name: text("name").notNull(),
});

export const venues = pgTable("venues", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  name: text("name").notNull(),
  region: text("region"),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  role: text("role").notNull().default("staff"), // owner|admin|staff
});

export const venueUsers = pgTable(
  "venue_users",
  {
    venueId: text("venue_id").notNull(),
    userId: text("user_id").notNull(),
    role: text("role").notNull().default("staff"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.venueId, t.userId] }),
  }),
);



// --- Platform multi-tenant tables ---

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: text("organization_id").notNull(), // references orgs.id
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  theme: jsonb("theme").$type<Record<string, any>>().default({} as any),
  pwaBrand: jsonb("pwa_brand").$type<Record<string, any>>().default({} as any),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workspaceSecrets = pgTable("workspace_secrets", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").notNull(),
  keyName: text("key_name").notNull(),
  ciphertext: text("ciphertext").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const agentTemplates = pgTable("agent_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").notNull(), // bar_pos | wedding | corporate
  defaultManifestJson: jsonb("default_manifest_json").$type<Record<string, any>>().notNull(),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const agentManifests = pgTable("agent_manifests", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").notNull(),
  templateId: uuid("template_id"),
  version: integer("version").notNull().default(1),
  manifestJson: jsonb("manifest_json").$type<Record<string, any>>().notNull(),
  status: text("status").notNull().default("active"), // active | archived
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usageEvents = pgTable("usage_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: text("organization_id").notNull(),
  workspaceId: uuid("workspace_id"),
  metric: text("metric").notNull(),
  qty: numeric("qty", { precision: 18, scale: 6 }).notNull().default("0"),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});

export const billingSubscriptions = pgTable("billing_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: text("organization_id").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubId: text("stripe_sub_id"),
  plan: text("plan"),
  status: text("status").notNull().default("trialing"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: text("organization_id").notNull(),
  workspaceId: uuid("workspace_id"),
  actor: jsonb("actor").$type<Record<string, any>>(),
  action: text("action").notNull(),
  metaJson: jsonb("meta_json").$type<Record<string, any>>(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});

