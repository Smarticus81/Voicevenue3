"use client";
import { useEffect, useState } from "react";

export default function TopSellers({ venueId = "demo-venue" }: { venueId?: string }) {
  const [rows, setRows] = useState<{ name: string; qty: number }[]>([]);
  useEffect(() => {
    fetch(`/api/metrics/top-sellers?venueId=${venueId}`).then((r) => r.json()).then((d) => setRows(d.rows || []));
  }, [venueId]);
  if (!rows.length) return <div className="text-sm text-white/60">No data yet.</div>;
  return (
    <ul className="text-sm space-y-1">
      {rows.map((r, i) => (
        <li key={i} className="flex justify-between">
          <span>{r.name}</span>
          <span className="text-white/70">×{r.qty}</span>
        </li>
      ))}
    </ul>
  );
}



