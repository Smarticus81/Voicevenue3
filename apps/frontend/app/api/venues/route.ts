import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { eventVenues as venues } from "@/server/db/schema.events";
import { and, eq } from "drizzle-orm";
import { getRequestCtx } from "@/server/auth/context";

export const runtime = "nodejs";

export async function GET() {
  const rows = await db.select().from(venues);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const ctx = await getRequestCtx();
  if (ctx.role !== "owner" && ctx.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json();
  const { organizationId, name, address, timezone } = body || {};
  if (!organizationId || !name) return NextResponse.json({ error: "organizationId and name required" }, { status: 400 });
  const [row] = await db.insert(venues).values({ organizationId, name, address, timezone }).returning();
  return NextResponse.json(row, { status: 201 });
}


