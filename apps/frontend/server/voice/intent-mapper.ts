// Normalizes many phrasings into: { intent:'order.add', qty, unit, drink, tableName?, tabName? }

export type OrderAdd = {
  intent: "order.add";
  qty: number; // normalized integer/float
  unit: "item" | "shot" | "oz";
  drink: string;
  tableName?: string;
  tabName?: string;
};

const UNIT_MAP: Record<string, OrderAdd["unit"]> = {
  item: "item",
  items: "item",
  drink: "item",
  drinks: "item",
  shot: "shot",
  shots: "shot",
  ounce: "oz",
  ounces: "oz",
  oz: "oz",
};

const NUM_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  a: 1,
  an: 1,
};

const NUM_RX = "(?<qtynum>\\d+(?:\\.\\d+)?)";
const NUMWORD_RX = "(?<qtyword>one|two|three|four|five|six|seven|eight|nine|ten|a|an)";
const UNIT_RX = "(?<rawunit>shots?|drinks?|items?|ounces?|ounce|oz)";
const TABLE_RX = "(?:table\\s*(?<table>\\w[\\w\\- ]*))";
const TAB_RX = "(?:tab\\s*(?<tab>\\w[\\w\\- ]*))";

// order matters: more specific first
const PATTERNS: RegExp[] = [
  new RegExp(`\\badd\\s+(?:${NUM_RX}|${NUMWORD_RX})\\s+${UNIT_RX}\\s+of\\s+(?<drink>.+?)\\s+to\\s+${TABLE_RX}\\b`, "i"),
  new RegExp(`\\badd\\s+(?:${NUM_RX}|${NUMWORD_RX})\\s+${UNIT_RX}\\s+of\\s+(?<drink>.+?)\\s+to\\s+${TAB_RX}\\b`, "i"),
  new RegExp(`\\badd\\s+(?:${NUM_RX}|${NUMWORD_RX})\\s+${UNIT_RX}\\s+(?<drink>.+?)\\s+to\\s+${TAB_RX}\\b`, "i"),
  new RegExp(`\\badd\\s+(?:${NUM_RX}|${NUMWORD_RX})\\s+${UNIT_RX}\\s+(?<drink>.+?)\\s+to\\s+${TABLE_RX}\\b`, "i"),
  new RegExp(`\\b(?:${NUM_RX}|${NUMWORD_RX})\\s+${UNIT_RX}\\s+of\\s+(?<drink>.+?)\\s+to\\s+${TABLE_RX}\\b`, "i"),
  new RegExp(`\\b(?:${NUM_RX}|${NUMWORD_RX})\\s+${UNIT_RX}\\s+of\\s+(?<drink>.+?)\\s+to\\s+${TAB_RX}\\b`, "i"),
  new RegExp(`\\bring\\s*up\\s+(?:${NUM_RX}|${NUMWORD_RX})\\s+${UNIT_RX}\\s+of\\s+(?<drink>.+?)\\s+(?:on|to)\\s+${TABLE_RX}\\b`, "i"),
  new RegExp(`\\bring\\s*up\\s+(?:${NUM_RX}|${NUMWORD_RX})\\s+${UNIT_RX}\\s+of\\s+(?<drink>.+?)\\s+(?:on|to)\\s+${TAB_RX}\\b`, "i"),
  new RegExp(`\\badd\\s+(?:${NUM_RX}|${NUMWORD_RX})\\s+(?<drink>.+?)\\s+to\\s+${TABLE_RX}\\b`, "i"),
  new RegExp(`\\badd\\s+(?:${NUM_RX}|${NUMWORD_RX})\\s+(?<drink>.+?)\\s+to\\s+${TAB_RX}\\b`, "i"),
  new RegExp(`\\badd\\s+(?:${NUM_RX}|${NUMWORD_RX})\\s+${UNIT_RX}\\s+(?<drink>.+)\\b`, "i"),
  new RegExp(`\\badd\\s+(?:${NUM_RX}|${NUMWORD_RX})\\s+(?<drink>.+)\\b`, "i"),
  new RegExp(`\\b(?:${NUM_RX}|${NUMWORD_RX})\\s+${UNIT_RX}\\s+(?<drink>.+)\\b`, "i"),
  new RegExp(`\\badd\\s+(?<drink>.+)\\b`, "i"),
];

function toNumber(qtynum?: string, qtyword?: string): number {
  if (qtynum) return parseFloat(qtynum);
  if (qtyword && NUM_WORDS[qtyword.toLowerCase()]) return NUM_WORDS[qtyword.toLowerCase()];
  return 1;
}

function normUnit(raw?: string): OrderAdd["unit"] {
  if (!raw) return "item";
  const key = raw.toLowerCase();
  return UNIT_MAP[key] ?? "item";
}

export function parseOrder(text: string): OrderAdd | null {
  const s = text.trim();
  for (const rx of PATTERNS) {
    const m = s.match(rx);
    if (!m || !m.groups) continue;
    const drink = (m.groups.drink || "").trim();
    if (!drink) continue;
    const qty = toNumber(m.groups.qtynum, m.groups.qtyword);
    const unit = normUnit(m.groups.rawunit);
    const tableName = m.groups.table?.trim();
    const tabName = m.groups.tab?.trim();
    return { intent: "order.add", qty, unit, drink, tableName, tabName };
  }
  return null;
}


