import { bottleSizes } from "./bottle-mapping";

export function decrementInventory(
  inventory: any[],
  itemName: string,
  qty: number,
  unit: "item" | "oz" | "shot"
) {
  const item = inventory.find((i) => i.name?.toLowerCase() === itemName.toLowerCase());
  if (!item) return inventory;

  if (unit === "item") {
    item.stock = Math.max((item.stock ?? 0) - qty, 0);
  } else {
    const bottle = bottleSizes.find((b) =>
      String(item.bottleType || item.size || "").toLowerCase().includes(b.type.toLowerCase())
    );
    if (!bottle) return inventory;

    if (unit === "oz") {
      const totalShots = (bottle.shots * qty) / bottle.oz;
      item.stockShots = Math.max((item.stockShots || bottle.shots) - totalShots, 0);
    }
    if (unit === "shot") {
      item.stockShots = Math.max((item.stockShots || bottle.shots) - qty, 0);
    }
  }

  return [...inventory];
}


