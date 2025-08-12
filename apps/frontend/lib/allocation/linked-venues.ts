import { db } from "@/server/db/client";
import { venueLinking } from "@/server/db/schema.events";
import { and, eq } from "drizzle-orm";

// Returns ordered venueIds for allocation preference: [primary, ...children]
export async function resolveLinkedVenueCluster(primaryVenueId: string, includeOnlyInventoryLinks = true): Promise<string[]> {
  const result = new Set<string>();
  result.add(primaryVenueId);

  const links = await db
    .select()
    .from(venueLinking)
    .where(eq(venueLinking.parentVenueId, primaryVenueId));

  for (const l of links as any[]) {
    if (includeOnlyInventoryLinks && !l.link_inventory) continue;
    result.add(l.child_venue_id || l.childVenueId);
  }

  return Array.from(result.values());
}


