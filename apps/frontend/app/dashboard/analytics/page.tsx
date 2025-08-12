"use client";
import DashboardShell from "@/components/shell/DashboardShell";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";

export default function AnalyticsPage() {
  const [series, setSeries] = useState<{ minute: string; c: number }[]>([]);
  const [top, setTop] = useState<{ event_type: string; c: number }[]>([]);
  const [p50, setP50] = useState<number>(0);
  const venueId = "demo-venue";
  const agentId = "demo-agent";

  useEffect(() => {
    const load = async () => {
      const a = await fetch(`/api/analytics/series?venueId=${venueId}&agentId=${agentId}`).then(r=>r.json());
      const b = await fetch(`/api/analytics/top?venueId=${venueId}&agentId=${agentId}`).then(r=>r.json());
      const c = await fetch(`/api/analytics/median?venueId=${venueId}&agentId=${agentId}`).then(r=>r.json());
      setSeries(a.rows || []);
      setTop(b.rows || []);
      setP50(c.value || 0);
    };
    load();
  }, []);

  return (
    <DashboardShell>
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl p-6 bg-white/10 backdrop-blur border border-white/15">
          <h2 className="text-lg font-semibold mb-2">Events / Minute (24h)</h2>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <XAxis dataKey="minute" hide />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="c" stroke="#34d399" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl p-6 bg-white/10 backdrop-blur border border-white/15">
          <h2 className="text-lg font-semibold mb-2">Median TTS Latency</h2>
          <div className="text-4xl font-bold">{Math.round(p50)} ms</div>
          <p className="text-xs text-white/60 mt-1">Lower is better</p>
          <div className="mt-6 h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="event_type" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="c" fill="#60a5fa" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}


