import { headers } from "next/headers";
import { verifyEmbedToken, verifyKioskToken } from "./tokens";

export type RequestCtx = {
  venueId: string;
  agentId: string;
  role: "owner" | "admin" | "staff";
  userId?: string;
};

// Accept Authorization: Bearer <jwt>  (either embed or kiosk)
export async function getRequestCtx(bodyVenueId?: string, bodyAgentId?: string): Promise<RequestCtx> {
  const hdrs = await headers();
  const auth = (hdrs as any).get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (token) {
    try {
      const kt = await verifyKioskToken(token).catch(() => null as any);
      if (kt?.venueId) return { venueId: kt.venueId, agentId: kt.agentId, role: kt.role as any, userId: kt.sub as any };
      const et = await verifyEmbedToken(token);
      return { venueId: et.venueId, agentId: et.agentId, role: et.role as any, userId: et.sub as any };
    } catch {}
  }

  return {
    venueId: bodyVenueId || "demo-venue",
    agentId: bodyAgentId || "demo-agent",
    role: "staff",
  };
}


