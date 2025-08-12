import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { sql } from "drizzle-orm";
export const runtime = "nodejs";

export async function GET() {
  const result = await db.execute(sql`
    SELECT id, started_at as "startedAt", venue_id as "venueId", agent_id as "agentId", label
    FROM traces
    ORDER BY started_at DESC
    LIMIT 50
  `);
  return NextResponse.json({ traces: Array.from(result as any) });
}


