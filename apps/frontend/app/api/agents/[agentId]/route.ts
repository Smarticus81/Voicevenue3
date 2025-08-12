import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

function getConfigPath(agentId: string) {
  return path.join(process.cwd(), "apps", "frontend", "server", "agents", "configs", `${agentId}.json`);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ agentId: string }> }) {
  try {
    const { agentId } = await ctx.params;
    const body = await req.json();
    const tools: string[] = Array.isArray(body?.tools) ? body.tools : [];

    const cfgPath = getConfigPath(agentId);
    if (!fs.existsSync(cfgPath)) {
      return NextResponse.json({ error: "Agent config not found" }, { status: 404 });
    }
    const raw = fs.readFileSync(cfgPath, "utf-8");
    const json = JSON.parse(raw);
    json.tools = tools;
    fs.writeFileSync(cfgPath, JSON.stringify(json, null, 2));

    return NextResponse.json({ ok: true, agentId, tools });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to save" }, { status: 500 });
  }
}


