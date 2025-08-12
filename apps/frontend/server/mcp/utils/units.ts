export function ozToMl(oz: number) {
  return oz * 29.5735;
}

export function normalizeCategory(category: string) {
  return String(category || '').trim().toLowerCase();
}

