import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { sql } from "drizzle-orm";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const traceId = u.searchParams.get("traceId") || "";
  if (!traceId) return NextResponse.json({ spans: [] });
  const result = await db.execute(sql`
    SELECT id, name, started_at as "startedAt", duration_ms as "durationMs", attrs
    FROM trace_spans
    WHERE trace_id = ${traceId}
    ORDER BY started_at ASC
  `);
  return NextResponse.json({ spans: Array.from(result as any) });
}


