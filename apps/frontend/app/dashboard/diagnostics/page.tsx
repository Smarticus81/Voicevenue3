"use client";
import DashboardShell from "@/components/shell/DashboardShell";
import { dumpDiag, clearDiag } from "@/components/diagnostics/logger";

export default function Diagnostics() {
  const download = () => {
    const data = {
      info: {
        ua: navigator.userAgent,
        url: location.href,
        time: new Date().toISOString(),
        online: navigator.onLine,
      },
      logs: dumpDiag(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `bevpro-diagnostics-${Date.now()}.json`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  };

  return (
    <DashboardShell>
      <section className="rounded-2xl p-6 bg-white/10 border border-white/15 backdrop-blur space-y-3">
        <h2 className="text-lg font-semibold">Diagnostics</h2>
        <p className="text-sm text-white/70">
          If something feels off, click “Download Report” and send the file to support. No passwords or card data are included.
        </p>
        <div className="flex gap-3">
          <button onClick={download} className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold">Download Report</button>
          <button onClick={()=>{ clearDiag(); alert("Cleared"); }} className="px-4 py-2 rounded-xl bg-white/10 border border-white/20">Clear Logs</button>
        </div>
        <ul className="mt-4 text-xs max-h-[300px] overflow-auto space-y-1">
          {dumpDiag().slice().resage().map((r,i)=> (
            <li key={i} className="text-white/70">
              <span className="text-white/50">{r.t}</span> — <span className="text-white">{r.event}</span>
              {r.meta ? <span className="text-white/60"> {JSON.stringify(r.meta)}</span> : null}
            </li>
          ))}
        </ul>
      </section>
    </DashboardShell>
  );
}



