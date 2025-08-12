import { NextResponse } from "next/server";
import { topEventTypes } from "@/server/db/analytics";
export const runtime = "nodejs";
export async function GET(req: Request) {
  const u = new URL(req.url);
  const venueId = u.searchParams.get("venueId") || "demo-venue";
  const agentId = u.searchParams.get("agentId") || "demo-agent";
  const rows = await topEventTypes(venueId, agentId);
  return NextResponse.json({ rows });
}


