import { NextResponse } from "next/server";
import { loadRegistry } from "@/server/tools/registry";
import { db } from "@/server/db/client";
import { tabs, items } from "@/server/db/schema";
import { and, eq, like } from "drizzle-orm";
import { userFacingError } from "@/server/tools/guard";
import { getRequestCtx } from "@/server/auth/context";
import { isAllowed } from "@/server/tools/rbac";
import { writeAudit } from "@/server/tools/audit";
import { ensureTrace, beginSpan, endSpan } from "@/server/tracing/trace";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const t0 = Date.now();
  let toolName = "unknown";
  try {
    const { tool, params, venueId, agentId } = await req.json();
    toolName = tool || "unknown";

    if (!tool || typeof tool !== "string") {
      return NextResponse.json({ error: "Missing tool name" }, { status: 400 });
    }
    const ctxReq = await getRequestCtx(venueId, agentId);
    const reg = loadRegistry();
    const entry = reg[tool];
    if (!entry) {
      return NextResponse.json({ error: `Unknown tool '${tool}'` }, { status: 404 });
    }

    // RBAC check
    const allowed = await isAllowed(ctxReq.venueId, ctxReq.role, tool);
    if (!allowed) {
      await writeAudit({ venueId: ctxReq.venueId, agentId: ctxReq.agentId, role: ctxReq.role, tool, status: "error", meta: { reason: "forbidden" } });
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    // Tracing
    const traceId = (req.headers.get("x-trace-id") || "").toString();
    if (traceId) await ensureTrace(traceId, ctxReq.venueId, ctxReq.agentId);
    const spanId = traceId ? await beginSpan(traceId, `tool.${tool}`, { params }) : null;
    const s0 = Date.now();

    // NLU glue: resolve guest_name -> tab_id, item_name -> item_id when present
    const p = { ...(params || {}) } as any;
    if (!p.tab_id && p.guest_name) {
      const [tab] = await db
        .select()
        .from(tabs)
        .where(and(eq(tabs.venueId, ctxReq.venueId), like(tabs.guestName, p.guest_name)))
        .limit(1);
      if (tab) p.tab_id = (tab as any).id;
    }
    if (!p.item_id && p.item_name) {
      const [item] = await db
        .select()
        .from(items)
        .where(and(eq(items.venueId, ctxReq.venueId), like(items.name, p.item_name)))
        .limit(1);
      if (item) p.item_id = (item as any).id;
    }

    // In real prod: validate params against entry.parameters JSON schema
    const ctx = { venueId: ctxReq.venueId, agentId: ctxReq.agentId } as { venueId: string; agentId: string };
    const result = await entry.handler(p, ctx);
    if (spanId) await endSpan(spanId, Date.now() - s0);
    const latencyMs = Date.now() - t0;
    await writeAudit({ venueId: ctxReq.venueId, agentId: ctxReq.agentId, role: ctxReq.role, tool, status: "ok", latencyMs, meta: { params: p } });
    return NextResponse.json({ ok: true, tool, result });
  } catch (e: any) {
    try {
      const ctxReq = await getRequestCtx();
      const latencyMs = Date.now() - t0;
      await writeAudit({ venueId: ctxReq.venueId, agentId: ctxReq.agentId, role: ctxReq.role, tool: toolName, status: "error", latencyMs, meta: { msg: e?.message } });
    } catch {}
    console.error("[/api/tools/run] error:", e);
    return NextResponse.json({ error: userFacingError(e) }, { status: 500 });
  }
}


