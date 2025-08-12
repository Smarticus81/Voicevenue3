"use client";
import DashboardShell from "@/components/shell/DashboardShell";
import { useEffect, useState } from "react";

export default function ClosingReport() {
  const [data, setData] = useState<any>(null);
  const venueId = "demo-venue";

  const load = async (date?: string) => {
    const q = date ? `&date=${date}` : "";
    const r = await fetch(`/api/reports/closing?venueId=${venueId}${q}`);
    setData(await r.json());
  };

  useEffect(()=>{ load(); }, []);

  if (!data) return <DashboardShell><div className="p-6 text-white/70">Loading…</div></DashboardShell>;

  const printIt = () => window.print();

  return (
    <DashboardShell>
      <section className="rounded-2xl p-6 bg-white/10 border border-white/15 backdrop-blur space-y-4 print:bg-white print:text-black print:shadow-none">
        <div className="flex items-center justify-between print:hidden">
          <h2 className="text-lg font-semibold">Closing Report — {data.date}</h2>
          <div className="flex gap-2">
            <input type="date" className="px-3 py-2 rounded-lg bg-black/30 border border-white/20"
              onChange={(e)=>load(e.currentTarget.value)} />
            <button onClick={printIt} className="px-3 py-2 rounded-xl bg-emerald-500 text-black font-semibold">Print / Save PDF</button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card title="Tabs" value={data.summary.tabs} />
          <Card title="Orders" value={data.summary.orders} />
          <Card title="Revenue" value={`$${Number(data.summary.revenue || 0).toFixed(2)}`} />
        </div>

        <div className="rounded-xl border border-white/10 p-4 bg-black/30 print:bg-white print:border-black/10">
          <h3 className="font-semibold mb-2">Top Items</h3>
          <table className="w-full text-sm">
            <thead className="text-white/70 print:text-black/70">
              <tr>
                <th className="text-left p-2">Item</th>
                <th className="text-left p-2">Qty</th>
                <th className="text-left p-2">Sales</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((r: any, i: number)=> (
                <tr key={i} className="border-t border-white/10 print:border-black/10">
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.qty}</td>
                  <td className="p-2">${Number(r.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!!data.low?.length && (
          <div className="rounded-xl border border-white/10 p-4 bg-black/30 print:bg-white print:border-black/10">
            <h3 className="font-semibold mb-2">Low Stock</h3>
            <ul className="text-sm grid md:grid-cols-2 gap-x-6">
              {data.low.map((l:any,i:number)=> (
                <li key={i} className="py-1">
                  {l.name}: {l.on_hand_ml}ml (≤{l.reorder_ml}ml)
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-xl border border-white/10 p-4 bg-black/30 print:bg-white print:border-black/10">
      <div className="text-sm text-white/70 print:text-black/70">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}



