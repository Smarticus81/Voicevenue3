import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const traces = pgTable("traces", {
  id: text("id").primaryKey(), // traceId
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  venueId: text("venue_id").notNull(),
  agentId: text("agent_id").notNull(),
  label: text("label"),
});

export const traceSpans = pgTable("trace_spans", {
  id: text("id").primaryKey(), // spanId
  traceId: text("trace_id").notNull(),
  name: text("name").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  durationMs: integer("duration_ms"),
  attrs: jsonb("attrs"),
});


