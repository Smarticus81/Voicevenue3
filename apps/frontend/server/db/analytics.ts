import { db } from "@/server/db/client";
import { sql } from "drizzle-orm";

export async function ensureAnalyticsTable() {
  // id uuid, ts timestamptz default now, venue_id text, agent_id text, event_type text, latency_ms int, meta jsonb
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      ts timestamptz NOT NULL DEFAULT now(),
      venue_id text NOT NULL,
      agent_id text NOT NULL,
      event_type text NOT NULL,
      latency_ms int,
      meta jsonb
    );
  `);
}

export async function insertEvent(row: {
  venue_id: string;
  agent_id: string;
  event_type: string;
  latency_ms?: number|null;
  meta?: any;
}) {
  await ensureAnalyticsTable();
  await db.execute(sql`
    INSERT INTO analytics_events (venue_id, agent_id, event_type, latency_ms, meta)
    VALUES (${row.venue_id}, ${row.agent_id}, ${row.event_type}, ${row.latency_ms ?? null}, ${row.meta ?? null})
  `);
}

export async function eventsLast24h(venueId: string, agentId: string) {
  await ensureAnalyticsTable();
  const result = await db.execute(sql`
    SELECT date_trunc('minute', ts) as minute, count(*) as c
    FROM analytics_events
    WHERE ts > now() - interval '24 hours'
      AND venue_id = ${venueId}
      AND agent_id = ${agentId}
    GROUP BY 1
    ORDER BY 1 asc
  `);
  return Array.from(result as any) as { minute: string; c: number }[];
}

export async function medianLatency(venueId: string, agentId: string) {
  await ensureAnalyticsTable();
  const result = await db.execute(sql`
    SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms) AS p50
    FROM analytics_events
    WHERE ts > now() - interval '24 hours'
      AND venue_id = ${venueId}
      AND agent_id = ${agentId}
      AND latency_ms IS NOT NULL
  `);
  const arr = Array.from(result as any) as any[];
  return Number(arr?.[0]?.p50 ?? 0);
}

export async function topEventTypes(venueId: string, agentId: string) {
  await ensureAnalyticsTable();
  const result = await db.execute(sql`
    SELECT event_type, count(*) as c
    FROM analytics_events
    WHERE ts > now() - interval '24 hours'
      AND venue_id = ${venueId}
      AND agent_id = ${agentId}
    GROUP BY 1
    ORDER BY 2 desc
    LIMIT 6
  `);
  return Array.from(result as any) as { event_type: string; c: number }[];
}


