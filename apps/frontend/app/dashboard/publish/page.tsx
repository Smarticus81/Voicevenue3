"use client";
import DashboardShell from "@/components/shell/DashboardShell";
import { useMemo, useState } from "react";

export default function PublishPage() {
  const [lane, setLane] = useState<"openai"|"dg11">("openai");
  const venueId = "demo-venue";
  const agentId = "demo-agent";
  const host = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const snippet = useMemo(() => {
    return `<script src="${host}/bev-embed.js" defer></script>
<script>
  window.BevEmbed?.init({
    host: "${host}",
    venueId: "${venueId}",
    agentId: "${agentId}",
    lane: "${lane}"
  });
</script>`;
  }, [host, lane]);

  return (
    <DashboardShell>
      <section className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6 bg-white/10 backdrop-blur border border-white/15">
          <h2 className="text-lg font-semibold">Embed on your site</h2>
          <p className="text-sm text-white/70 mt-1">Copy this into your POS or website’s HTML.</p>
          <div className="mt-4">
            <div className="flex gap-2 mb-2">
              <button onClick={()=>setLane("openai")} className={`px-3 py-1 rounded-lg ${lane==="openai"?"bg-white/20":"bg-white/10"}`}>OpenAI</button>
              <button onClick={()=>setLane("dg11")} className={`px-3 py-1 rounded-lg ${lane==="dg11"?"bg-white/20":"bg-white/10"}`}>DG + 11</button>
            </div>
            <pre className="rounded-xl bg-black/50 border border-white/15 p-4 text-xs overflow-x-auto whitespace-pre-wrap">{snippet}</pre>
          </div>
        </div>
        <div className="rounded-2xl p-6 bg-white/10 backdrop-blur border border-white/15">
          <h2 className="text-lg font-semibold">Kiosk Mode</h2>
          <p className="text-sm text-white/70 mt-1">Launch a full-screen tablet experience.</p>
          <button
            className="inline-flex items-center justify-center mt-4 px-4 py-3 rounded-xl bg-emerald-500 text-black font-semibold"
            onClick={() => window.open(`/kiosk?venueId=${venueId}&agentId=${agentId}&lane=${lane}`,'_blank','noopener,noreferrer,width=480,height=860')}
          >
            Open Kiosk in New Window →
          </button>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Health</h3>
            <div className="text-sm text-white/80 space-y-1">
              <div>Realtime lane: <span className="text-emerald-400">OK</span></div>
              <div>DG+11 lane: <span className="text-emerald-400">OK</span></div>
              <div>MCP & DB: <span className="text-emerald-400">Connected</span></div>
            </div>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}


