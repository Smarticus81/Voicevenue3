"use client";
import DashboardShell from "@/components/shell/DashboardShell";
import { useEffect, useState } from "react";

type Tool = { name: string; description?: string };
type Role = "owner" | "admin" | "staff";

export default function PermissionsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Record<Role, boolean>>>({});
  const venueId = "demo-venue";

  useEffect(() => {
    Promise.all([
      fetch("/api/tools/list").then((r) => r.json()).then((d) => d.tools || []),
      fetch(`/api/permissions?venueId=${venueId}`).then((r) => r.json()),
    ]).then(([tl, perm]) => {
      setTools(tl);
      setMatrix(perm.matrix || {});
    });
  }, []);

  const toggle = (tool: string, role: Role) => {
    setMatrix((m) => ({ ...m, [tool]: { ...(m[tool] || {}), [role]: !(m[tool]?.[role]) } }));
  };

  const save = async () => {
    await fetch(`/api/permissions?venueId=${venueId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matrix }),
    });
    alert("Saved");
  };

  return (
    <DashboardShell>
      <section className="rounded-2xl p-6 bg-white/10 backdrop-blur border border-white/15">
        <h2 className="text-lg font-semibold mb-4">Tool Permissions</h2>
        <div className="grid grid-cols-[1.5fr,repeat(3,120px)] gap-2 text-sm">
          <div className="font-semibold">Tool</div>
          {(["owner", "admin", "staff"] as Role[]).map((r) => (
            <div key={r} className="font-semibold text-center capitalize">
              {r}
            </div>
          ))}
          {tools.map((t) => (
            <>
              <div key={t.name} className="py-2">
                <div className="font-medium">{t.name}</div>
                <div className="text-white/60 text-xs">{t.description}</div>
              </div>
              {(["owner", "admin", "staff"] as Role[]).map((r) => (
                <div key={`${t.name}-${r}`} className="flex items-center justify-center">
                  <input type="checkbox" checked={!!matrix[t.name]?.[r]} onChange={() => toggle(t.name, r)} />
                </div>
              ))}
            </>
          ))}
        </div>
        <div className="pt-4">
          <button onClick={save} className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold">
            Save
          </button>
        </div>
      </section>
    </DashboardShell>
  );
}


