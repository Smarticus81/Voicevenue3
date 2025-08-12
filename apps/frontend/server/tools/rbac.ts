import { db } from "@/server/db/client";
import { toolPermissions } from "@/server/db/schema.rbac";
import { and, eq } from "drizzle-orm";

export async function isAllowed(venueId: string, role: string, tool: string) {
  const rows = await db
    .select()
    .from(toolPermissions)
    .where(and(eq(toolPermissions.venueId, venueId), eq(toolPermissions.role, role), eq(toolPermissions.tool, tool)))
    .limit(1);
  if (!rows.length) {
    if (role === "owner" || role === "admin") return true;
    return false;
  }
  return !!(rows[0] as any).allowed;
}


