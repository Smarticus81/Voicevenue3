import { db } from "@/server/db/client";
import { auditLogs } from "@/server/db/schema.rbac";

export async function writeAudit(row: {
  venueId: string; agentId: string; userId?: string; role: string;
  tool: string; status: "ok" | "error"; latencyMs?: number; meta?: any;
}) {
  try {
    await db.insert(auditLogs).values({
      venueId: row.venueId,
      agentId: row.agentId,
      userId: row.userId || "kiosk",
      role: row.role,
      tool: row.tool,
      status: row.status,
      latencyMs: row.latencyMs?.toString(),
      meta: row.meta ?? null,
    });
  } catch (e) {
    // don't crash tool calls on audit failure
    console.warn("[audit] write failed", e);
  }
}


