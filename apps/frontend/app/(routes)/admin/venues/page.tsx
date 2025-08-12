"use client";
import React, { useEffect, useState } from "react";
import { NeuroCard } from "@/components/ui/NeuroCard";
import { NeuroButton } from "@/components/ui/NeuroButton";
import { NeuroInput } from "@/components/ui/NeuroInput";

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [form, setForm] = useState({ organizationId: "demo-org", name: "", address: "" });
  const [linkForm, setLinkForm] = useState({ parentVenueId: "", childVenueId: "", link_inventory: true, link_staff: false, link_events: false });

  async function load() {
    const r = await fetch('/api/venues');
    setVenues(await r.json());
  }
  useEffect(() => { load(); }, []);

  async function createVenue() {
    await fetch('/api/venues', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setForm({ organizationId: "demo-org", name: "", address: "" });
    load();
  }
  async function linkVenues() {
    await fetch('/api/venue-linking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(linkForm) });
    setLinkForm({ ...linkForm, parentVenueId: '', childVenueId: '' });
    load();
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-semibold">Venues</h2>
      <NeuroCard className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <NeuroInput placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <NeuroInput placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <NeuroButton onClick={createVenue} disabled={!form.name}>Create Venue</NeuroButton>
        </div>
      </NeuroCard>
      <NeuroCard className="p-4">
        <ul className="space-y-2">
          {venues.map((v) => (
            <li key={v.id} className="flex items-center justify-between">
              <div>{v.name}</div>
              <div className="text-xs opacity-60">{v.id}</div>
            </li>
          ))}
        </ul>
      </NeuroCard>

      <h3 className="text-xl font-semibold">Link Venues</h3>
      <NeuroCard className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <select className="w-full p-3 rounded-xl bg-white/50" value={linkForm.parentVenueId} onChange={(e) => setLinkForm({ ...linkForm, parentVenueId: e.target.value })}>
            <option value="">Parent venue</option>
            {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <select className="w-full p-3 rounded-xl bg-white/50" value={linkForm.childVenueId} onChange={(e) => setLinkForm({ ...linkForm, childVenueId: e.target.value })}>
            <option value="">Child venue</option>
            {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={linkForm.link_inventory} onChange={(e) => setLinkForm({ ...linkForm, link_inventory: e.target.checked })} /> Link inventory</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={linkForm.link_staff} onChange={(e) => setLinkForm({ ...linkForm, link_staff: e.target.checked })} /> Link staff</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={linkForm.link_events} onChange={(e) => setLinkForm({ ...linkForm, link_events: e.target.checked })} /> Link events</label>
        <div className="flex justify-end"><NeuroButton onClick={linkVenues} disabled={!linkForm.parentVenueId || !linkForm.childVenueId}>Save Link</NeuroButton></div>
      </NeuroCard>
    </div>
  );
}


