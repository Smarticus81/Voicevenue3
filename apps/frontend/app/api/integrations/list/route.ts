import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const venueId = u.searchParams.get("venueId") || "demo-venue";

  const dir = path.join(process.cwd(), "apps/frontend/server/agents/integrations");
  let files: string[] = [];
  try {
    files = await fs.readdir(dir);
  } catch {
    // no integrations saved yet
    return NextResponse.json({ vendors: [] });
  }

  const vendors = files
    .filter((f) => f.startsWith(`${venueId}.`) && f.endsWith(".json"))
    .map((f) => f.slice(`${venueId}.`.length, -".json".length));

  return NextResponse.json({ vendors });
}


