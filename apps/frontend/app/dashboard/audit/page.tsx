"use client";
import DashboardShell from "@/components/shell/DashboardShell";
import { useEffect, useState } from "react";

type Row = {
  id: string;
  ts: string;
  userId: string | null;
  role: string;
  tool: string;
  status: string;
  latencyMs?: string | null;
  meta?: any;
};

export default function AuditPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const venueId = "demo-venue";

  useEffect(() => {
    fetch(`/api/audit?venueId=${venueId}`).then((r) => r.json()).then((d) => setRows(d.rows || []));
  }, []);

  return (
    <DashboardShell>
      <section className="rounded-2xl p-6 bg-white/10 backdrop-blur border border-white/15">
        <h2 className="text-lg font-semibold mb-4">Audit Trail</h2>
        <div className="overflow-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/10">
              <tr>
                <th className="text-left p-2">Time</th>
                <th className="text-left p-2">User</th>
                <th className="text-left p-2">Role</th>
                <th className="text-left p-2">Tool</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Latency</th>
                <th className="text-left p-2">Meta</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-white/10">
                  <td className="p-2">{new Date(r.ts).toLocaleString()}</td>
                  <td className="p-2">{r.userId || "kiosk"}</td>
                  <td className="p-2">{r.role}</td>
                  <td className="p-2">{r.tool}</td>
                  <td className={`p-2 ${r.status === "ok" ? "text-emerald-300" : "text-red-300"}`}>{r.status}</td>
                  <td className="p-2">{r.latencyMs || "-"}</td>
                  <td className="p-2 text-white/70 max-w-[360px] truncate">{JSON.stringify(r.meta || {})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}


