"use client";
import Link from "next/link";

export default function AdminHome() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Item href="/admin/billing" label="Billing" />
        <Item href="/admin/security" label="Security" />
        <Item href="/admin/audit" label="Audit Logs" />
        <Item href="/studio" label="Studio" />
      </div>
    </div>
  );
}

function Item({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="glass rounded-2xl p-4 hover:scale-[1.01] transition">
      <div className="font-semibold">{label}</div>
      <div className="text-sm opacity-70">Open {label}</div>
    </Link>
  );
}


