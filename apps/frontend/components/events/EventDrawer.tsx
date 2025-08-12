"use client";
import React, { useEffect, useMemo, useState } from "react";
import { NeuroModal } from "@/components/ui/NeuroModal";
import { NeuroInput } from "@/components/ui/NeuroInput";
import { NeuroButton } from "@/components/ui/NeuroButton";

type Option = { id: string; name: string };

export function EventDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean, shortage?: { eventId: string; allocations: any[] }) => void }) {
  const [venues, setVenues] = useState<Option[]>([]);
  const [types, setTypes] = useState<Option[]>([]);
  const [packages, setPackages] = useState<Option[]>([]);
  const [form, setForm] = useState({
    name: "",
    venueId: "demo-venue",
    eventTypeId: "",
    packageId: "",
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    expectedGuests: 50,
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [v, t, p] = await Promise.all([
        fetch("/api/venues").then((r) => r.json()),
        fetch("/api/event-types?organizationId=demo-org").then((r) => r.json()),
        fetch("/api/event-packages?organizationId=demo-org").then((r) => r.json()),
      ]);
      setVenues(v.map((x: any) => ({ id: x.id, name: x.name })));
      setTypes(t.map((x: any) => ({ id: x.id, name: x.name })));
      setPackages(p.map((x: any) => ({ id: x.id, name: x.name })));
    })();
  }, []);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, expectedGuests: Number(form.expectedGuests) }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed");
      const hadShortages = !!data?.allocation?.hadShortages;
      if (hadShortages) {
        onOpenChange(false, { eventId: data?.event?.id, allocations: data?.allocation?.allocations || [] });
      } else {
        onOpenChange(false);
      }
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <NeuroModal open={open} onOpenChange={onOpenChange} title="Create Event">
      <div className="space-y-3">
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <NeuroInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Event name" />
        <select className="w-full p-3 rounded-xl bg-white/50" value={form.venueId} onChange={(e) => setForm({ ...form, venueId: e.target.value })}>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
        <select className="w-full p-3 rounded-xl bg-white/50" value={form.eventTypeId} onChange={(e) => setForm({ ...form, eventTypeId: e.target.value })}>
          <option value="">Select event type</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select className="w-full p-3 rounded-xl bg-white/50" value={form.packageId} onChange={(e) => setForm({ ...form, packageId: e.target.value })}>
          <option value="">Select package</option>
          {packages.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <NeuroInput type="datetime-local" value={form.startsAt.slice(0,16)} onChange={(e) => setForm({ ...form, startsAt: new Date(e.target.value).toISOString() })} />
          <NeuroInput type="datetime-local" value={form.endsAt.slice(0,16)} onChange={(e) => setForm({ ...form, endsAt: new Date(e.target.value).toISOString() })} />
        </div>
        <NeuroInput type="number" value={String(form.expectedGuests)} onChange={(e) => setForm({ ...form, expectedGuests: Number(e.target.value) })} placeholder="Guests" />
        <NeuroInput value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" />
        <div className="flex justify-end">
          <NeuroButton onClick={submit} disabled={loading || !form.name || !form.eventTypeId || !form.packageId}>{loading ? "Creating..." : "Create"}</NeuroButton>
        </div>
      </div>
    </NeuroModal>
  );
}


