import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { eventPackages } from "@/server/db/schema.events";
import { eq } from "drizzle-orm";
import { getRequestCtx } from "@/server/auth/context";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const organizationId = u.searchParams.get("organizationId") || "demo-org";
  const rows = await db.select().from(eventPackages).where(eq(eventPackages.organizationId, organizationId));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const ctx = await getRequestCtx();
  if (ctx.role !== "owner" && ctx.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json();
  const [row] = await db.insert(eventPackages).values(body).returning();
  return NextResponse.json(row, { status: 201 });
}


