export const VENDOR_LABELS: Record<string, string> = {
  square: "Square",
  toast: "Toast",
  lavu: "Lavu",
  clover: "Clover",
  lightspeed: "Lightspeed",
  touchbistro: "TouchBistro",
  revel: "Revel Systems",
  aloha: "Aloha POS",
  micros: "MICROS",
  posist: "POSist",
};

export function vendorLabel(id: string) {
  return VENDOR_LABELS[id] ?? id.toUpperCase();
}


