export function scoreName(candidate: string, query: string) {
  const a = (candidate || "").toLowerCase().trim();
  const b = (query || "").toLowerCase().trim();
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b)) return 0.9;
  const at = new Set(a.split(/\s+/));
  const bt = new Set(b.split(/\s+/));
  const inter = [...at].filter((t) => bt.has(t)).length;
  return Math.max(0.1, inter / Math.max(at.size, bt.size));
}


