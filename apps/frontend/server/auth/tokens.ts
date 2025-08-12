import { SignJWT, jwtVerify } from "jose";

const EMBED_SECRET = new TextEncoder().encode(process.env.EMBED_TOKEN_SECRET || "dev-embed-secret");
const KIOSK_SECRET = new TextEncoder().encode(process.env.KIOSK_TOKEN_SECRET || "dev-kiosk-secret");

export type BevToken = {
  sub?: string; // user id (optional)
  venueId: string;
  agentId: string;
  role: "owner" | "admin" | "staff";
  scope: "embed" | "kiosk";
  exp?: number;
};

export async function signEmbedToken(payload: Omit<BevToken, "scope"> & { expSec?: number }) {
  const exp = Math.floor(Date.now() / 1000) + (payload.expSec ?? 15 * 60);
  return await new SignJWT({ ...payload, scope: "embed", exp })
    .setProtectedHeader({ alg: "HS256" })
    .sign(EMBED_SECRET);
}

export async function signKioskToken(payload: Omit<BevToken, "scope"> & { expSec?: number }) {
  const exp = Math.floor(Date.now() / 1000) + (payload.expSec ?? 15 * 60);
  return await new SignJWT({ ...payload, scope: "kiosk", exp })
    .setProtectedHeader({ alg: "HS256" })
    .sign(KIOSK_SECRET);
}

export async function verifyEmbedToken(jwt: string): Promise<BevToken> {
  const { payload } = await jwtVerify(jwt, EMBED_SECRET);
  return payload as any;
}
export async function verifyKioskToken(jwt: string): Promise<BevToken> {
  const { payload } = await jwtVerify(jwt, KIOSK_SECRET);
  return payload as any;
}


