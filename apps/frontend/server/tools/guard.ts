export function requireVenue(ctx: { venueId?: string }) {
  if (!ctx.venueId) throw new Error("No venue context");
}

export function userFacingError(err: any) {
  const m = String(err?.message || err || "");
  if (/violates|constraint|stack/i.test(m)) return "That action couldn't be completed.";
  return m;
}


