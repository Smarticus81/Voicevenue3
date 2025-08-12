"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";

const items = [
  { k: "Dashboard", href: "/dashboard" },
  { k: "Kiosk", href: "/kiosk?venueId=demo-venue&agentId=demo-agent&lane=dg11" },
  { k: "Agent Builder", href: "/dashboard/agent-builder" },
  { k: "Publish", href: "/dashboard/publish" },
  { k: "Settings", href: "/dashboard/settings" },
  { k: "Analytics", href: "/dashboard/analytics" },
  { k: "Closing Report", href: "/dashboard/reports/closing" },
  { k: "Latency Lab", href: "/dashboard/latency-lab" },
  { k: "Permissions", href: "/dashboard/permissions" },
  { k: "Audit", href: "/dashboard/audit" },
  { k: "Diagnostics", href: "/dashboard/diagnostics" },
];

export default function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Quick nav" className="fixed inset-0 z-[1000]">
      <div className="mx-auto mt-24 w-full max-w-lg rounded-2xl bg-black/80 backdrop-blur border border-white/20 overflow-hidden">
        <Command.Input placeholder="Jump to…" className="w-full px-4 py-3 bg-black/40 outline-none" />
        <Command.List className="max-h-[320px] overflow-auto">
          {items.map((it) => (
            <Command.Item
              key={it.href}
              onSelect={() => {
                router.push(it.href);
                setOpen(false);
              }}
              className="px-4 py-2 hover:bg-white/10 cursor-pointer"
            >
              {it.k}
            </Command.Item>
          ))}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}



