import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { eventTypes } from "@/server/db/schema.events";
import { eq } from "drizzle-orm";
import { getRequestCtx } from "@/server/auth/context";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const organizationId = u.searchParams.get("organizationId") || "demo-org";
  const rows = await db.select().from(eventTypes).where(eq(eventTypes.organizationId, organizationId));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const ctx = await getRequestCtx();
  if (ctx.role !== "owner" && ctx.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json();
  const { organizationId, name, colorHex } = body || {};
  if (!organizationId || !name || !colorHex) return NextResponse.json({ error: "organizationId, name, colorHex required" }, { status: 400 });
  const [row] = await db.insert(eventTypes).values({ organizationId, name, colorHex }).returning();
  return NextResponse.json(row, { status: 201 });
}


