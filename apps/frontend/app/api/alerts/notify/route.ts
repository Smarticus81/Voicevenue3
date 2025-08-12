import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { inventory, ingredients } from "@/server/db/schema";
import { and, lte, eq } from "drizzle-orm";
import { sendEmail, sendSMS, shouldNotifyNow } from "@/server/alerts/service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { venueId = "demo-venue", toEmail = "", toSMS = "" } = await req.json();
  const rows = await db.select({
    ingredientId: inventory.ingredientId,
    onHandMl: inventory.onHandMl,
    reorderMl: inventory.reorderMl,
    name: ingredients.name,
  }).from(inventory)
   .leftJoin(ingredients, eq(inventory.ingredientId, ingredients.id))
   .where(and(eq(inventory.venueId, venueId), lte(inventory.onHandMl, inventory.reorderMl)));

  if (!rows.length) return NextResponse.json({ ok: true, sent: false, reason: "no-low-stock" });

  const { allowSMS, allowEmail } = shouldNotifyNow();
  const lines = rows.map((r) => `• ${r.name}: ${r.onHandMl}ml (reorder ≤ ${r.reorderMl}ml)`);
  const subject = `Low Stock Alert (${rows.length})`;
  const html = `<p>Items at/below reorder:</p><pre>${lines.join("\n")}</pre>`;
  const sms = `Low stock (${rows.length}): ` + rows.slice(0, 6).map((r) => r.name).join(", ");

  if (allowEmail && toEmail) await sendEmail(toEmail, subject, html);
  if (allowSMS && toSMS) await sendSMS(toSMS, sms);

  return NextResponse.json({ ok: true, items: rows.length });
}



