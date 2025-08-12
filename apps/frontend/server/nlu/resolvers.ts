import { db } from "@/server/db/client";
import { tabs, items } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { scoreName } from "./fuzzy";

export async function resolveTabId(venueId: string, guestName: string) {
  const rows = await db
    .select()
    .from(tabs)
    .where(and(eq(tabs.venueId, venueId)))
    .limit(200);
  let best = rows
    .filter((r: any) => r.status === "open")
    .map((r: any) => ({ r, s: scoreName(r.guestName || "", guestName) }))
    .sort((a, b) => b.s - a.s)[0];
  if (best && best.s >= 0.6) return best.r.id as string;

  const [row] = await db
    .insert(tabs)
    .values({ venueId, guestName, status: "open" })
    .returning();
  return (row as any).id as string;
}

export async function resolveItemId(venueId: string, itemName: string) {
  const rows = await db
    .select()
    .from(items)
    .where(and(eq(items.venueId, venueId)))
    .limit(400);
  const best = rows
    .map((r: any) => ({ r, s: scoreName(r.name || "", itemName) }))
    .sort((a, b) => b.s - a.s)[0];
  if (!best || best.s < 0.5) {
    throw new Error(`Couldn't find menu item similar to "${itemName}".`);
  }
  return best.r.id as string;
}


