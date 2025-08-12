import { NextResponse } from "next/server";
import { signEmbedToken } from "@/server/auth/tokens";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const venueId = u.searchParams.get("venueId") || "demo-venue";
  const agentId = u.searchParams.get("agentId") || "demo-agent";
  const role = (u.searchParams.get("role") as any) || "staff";
  const token = await signEmbedToken({ venueId, agentId, role, expSec: 15 * 60 });
  return NextResponse.json({ token });
}


