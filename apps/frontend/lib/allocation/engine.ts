import { db } from "@/server/db/client";
import { packageInventoryRules, eventInventoryAllocations } from "@/server/db/schema.events";
import { inventory } from "@/server/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { AllocationResult } from "@/lib/types/events";
import { resolveLinkedVenueCluster } from "./linked-venues";

type RunArgs = {
  organizationId: string;
  venueId: string;
  packageId: string;
  expectedGuests: number;
  eventId: string;
};

export async function runAllocation(args: RunArgs, dbConn: typeof db = db): Promise<AllocationResult> {
  const { organizationId, venueId, packageId, expectedGuests, eventId } = args;

  const rules = (await dbConn
    .select()
    .from(packageInventoryRules)
    .where(eq(packageInventoryRules.packageId, packageId))) as any[];

  const venuesOrder = await resolveLinkedVenueCluster(venueId, true);

  const allocations: AllocationResult["allocations"] = [];
  let hadShortages = false;

  for (const r of rules) {
    const perGuest = (r.qty_per_guest ?? r.qtyPerGuest) || 0;
    const required = Math.ceil(parseFloat(String(perGuest)) * expectedGuests);
    let remaining = required;
    let allocated = 0;

    // Aggregate available across linked venues
    const venueStock = new Map<string, number>();
    if (venuesOrder.length) {
      const rows = (await dbConn
        .select({ venueId: inventory.venueId, onHandMl: inventory.onHandMl })
        .from(inventory)
        .where(and(eq(inventory.ingredientId as any, r.inventory_item_id), inArray(inventory.venueId, venuesOrder)))) as any[];
      for (const row of rows) venueStock.set(row.venueId, Number(row.onHandMl || 0));
    }

    // Prefer primary venue first
    for (const vId of venuesOrder) {
      if (remaining <= 0) break;
      const avail = venueStock.get(vId) || 0;
      if (avail <= 0) continue;
      const take = Math.min(avail, remaining);
      if (take > 0) {
        allocated += take;
        remaining -= take;
        // Write allocation row per venue/item
        await dbConn.insert(eventInventoryAllocations).values({
          eventId,
          venueId: vId,
          inventoryItemId: r.inventory_item_id,
          requiredQty: required,
          allocatedQty: take,
          shortageQty: 0,
        });
      }
    }

    let shortage = Math.max(0, required - allocated);
    const allocEntry: AllocationResult["allocations"][number] = {
      inventoryItemId: r.inventory_item_id,
      requiredQty: required,
      allocatedQty: allocated,
      shortageQty: shortage,
    };

    if (shortage > 0) {
      hadShortages = true;
      if (r.is_substitutable && r.substitution_group) {
        // Suggest substitutes: other items within the same group that have stock
        const candidateRows = (await dbConn.execute(sql`
          SELECT i.ingredient_id as inventory_item_id, SUM(i.on_hand_ml) as available
          FROM inventory i
          WHERE i.ingredient_id IN (
            SELECT pir.inventory_item_id
            FROM package_inventory_rules pir
            WHERE pir.substitution_group = ${r.substitution_group}
          )
          GROUP BY i.ingredient_id
          ORDER BY available DESC
          LIMIT 5
        `)) as any;
        const suggestedSubs = Array.from(candidateRows as any[])
          .map((row: any) => ({ inventoryItemId: row.inventory_item_id as string, availableQty: Number(row.available || 0) }))
          .filter((s) => s.inventoryItemId !== r.inventory_item_id && s.availableQty > 0);
        if (suggestedSubs.length) (allocEntry as any).suggestedSubs = suggestedSubs;
      }
    }

    allocations.push(allocEntry);
  }

  return { allocations, hadShortages };
}


