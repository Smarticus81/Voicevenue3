import { db } from "@/server/db/client";
import { traces, traceSpans } from "@/server/db/schema.traces";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export type SpanAttr = Record<string, any>;

export async function ensureTrace(traceId: string, venueId: string, agentId: string, label?: string) {
  await db.execute(sql`
    INSERT INTO traces (id, venue_id, agent_id, label)
    VALUES (${traceId}, ${venueId}, ${agentId}, ${label || null})
    ON CONFLICT (id) DO NOTHING
  `);
}

export async function beginSpan(traceId: string, name: string, attrs?: SpanAttr) {
  const spanId = randomUUID();
  await db.insert(traceSpans).values({
    id: spanId,
    traceId,
    name,
    attrs: attrs || {},
  });
  return spanId;
}

export async function endSpan(spanId: string, durationMs: number) {
  await db.execute(sql`UPDATE trace_spans SET duration_ms = ${durationMs} WHERE id = ${spanId}`);
}


