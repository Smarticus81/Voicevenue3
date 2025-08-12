export function getDefaultTaxPercent() {
  const raw = process.env.DEFAULT_TAX_PERCENT;
  const val = raw ? Number(raw) : 0.0825;
  return Number.isFinite(val) ? val : 0.0825;
}

