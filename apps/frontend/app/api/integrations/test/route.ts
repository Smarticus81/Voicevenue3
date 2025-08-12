import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { vendor, creds } = await req.json();
  const ok = validate(vendor, creds);
  if (!ok) return NextResponse.json({ ok: false, reason: "invalid-credentials" }, { status: 400 });

  // simulate a round-trip delay
  await new Promise((r) => setTimeout(r, 500));
  return NextResponse.json({ ok: true, details: `Connected to ${vendor}` });
}

function validate(vendor: string, c: any) {
  if (!vendor || typeof c !== "object") return false;

  switch (vendor) {
    case "square":
      return !!c.accessToken && c.accessToken.length > 20 && !!c.locationId;
    case "toast":
      return !!c.apiKey && c.apiKey.length > 20 && !!c.restaurantGuid;
    case "lavu":
      return !!c.clientId && !!c.clientSecret && !!c.locationId;
    case "clover":
      return !!c.merchantId && !!c.accessToken;
    case "lightspeed":
      return !!c.clientId && !!c.clientSecret && !!c.accountId;
    case "touchbistro":
      return !!c.serverUrl && /^https?:\/\//.test(c.serverUrl) && !!c.apiKey;
    case "revel":
      return !!c.locationId && !!c.username && !!c.password;
    case "aloha":
      return !!c.serverUrl && /^https?:\/\//.test(c.serverUrl) && !!c.username && !!c.password;
    case "micros":
      return !!c.serverUrl && /^https?:\/\//.test(c.serverUrl) && !!c.siteId && !!c.username && !!c.password;
    case "posist":
      return !!c.apiKey && !!c.restaurantId;
    default:
      return false;
  }
}


