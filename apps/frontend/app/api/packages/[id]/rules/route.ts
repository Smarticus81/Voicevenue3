import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { packageInventoryRules } from "@/server/db/schema.events";
import { eq } from "drizzle-orm";
import { getRequestCtx } from "@/server/auth/context";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const rows = await db.select().from(packageInventoryRules).where(eq(packageInventoryRules.packageId, params.id));
  return NextResponse.json(rows);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = await getRequestCtx();
  if (ctx.role !== "owner" && ctx.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const rules = (await req.json()) as Array<any>;
  if (!Array.isArray(rules)) return NextResponse.json({ error: "array required" }, { status: 400 });
  const values = rules.map((r) => ({ ...r, packageId: params.id }));
  // Naive bulk upsert by delete+insert for simplicity
  await db.delete(packageInventoryRules).where(eq(packageInventoryRules.packageId, params.id));
  const inserted = await db.insert(packageInventoryRules).values(values).returning();
  return NextResponse.json(inserted, { status: 201 });
}


