import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { eventVenues as venues } from "@/server/db/schema.events";
import { eq } from "drizzle-orm";
import { getRequestCtx } from "@/server/auth/context";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const [row] = (await db.select().from(venues).where(eq(venues.id, params.id)).limit(1)) as any[];
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ctx = await getRequestCtx();
  if (ctx.role !== "owner" && ctx.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json();
  const [row] = await db.update(venues).set(body).where(eq(venues.id, params.id)).returning();
  return NextResponse.json(row);
}


