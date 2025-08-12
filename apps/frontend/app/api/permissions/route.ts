import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { toolPermissions } from "@/server/db/schema.rbac";
import { and, eq } from "drizzle-orm";
import { loadRegistry } from "@/server/tools/registry";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const venueId = u.searchParams.get("venueId") || "demo-venue";
  const rows = await db.select().from(toolPermissions).where(eq(toolPermissions.venueId, venueId));
  const reg = loadRegistry();
  const tools = Object.keys(reg);

  const matrix: Record<string, Record<string, boolean>> = {};
  for (const t of tools) {
    matrix[t] = { owner: true, admin: true, staff: false };
  }
  for (const r of rows as any[]) {
    matrix[r.tool] = matrix[r.tool] || { owner: true, admin: true, staff: false };
    (matrix[r.tool] as any)[r.role] = r.allowed;
  }

  return NextResponse.json({ matrix });
}

export async function POST(req: Request) {
  const u = new URL(req.url);
  const venueId = u.searchParams.get("venueId") || "demo-venue";
  const { matrix } = await req.json();

  await db.delete(toolPermissions).where(eq(toolPermissions.venueId, venueId));
  const rows: any[] = [];
  Object.keys(matrix || {}).forEach((tool) => {
    const roles = matrix[tool];
    Object.keys(roles || {}).forEach((role) => {
      rows.push({ venueId, role, tool, allowed: !!roles[role] });
    });
  });
  if (rows.length) await db.insert(toolPermissions).values(rows);

  return NextResponse.json({ ok: true });
}


