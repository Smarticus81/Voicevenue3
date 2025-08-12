import { pgTable, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// who can do what (per venue + role + tool)
export const toolPermissions = pgTable("tool_permissions", {
  venueId: text("venue_id").notNull(),
  role: text("role").notNull(), // "owner" | "admin" | "staff"
  tool: text("tool").notNull(), // e.g. "orders.add_item"
  allowed: boolean("allowed").notNull().default(true),
});

// append-only audit trail
export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
  venueId: text("venue_id").notNull(),
  agentId: text("agent_id").notNull(),
  userId: text("user_id").default("kiosk"), // or staff email/id
  role: text("role").notNull().default("staff"),
  tool: text("tool").notNull(),
  status: text("status").notNull(), // "ok" | "error"
  latencyMs: text("latency_ms"),
  meta: jsonb("meta"),
});


