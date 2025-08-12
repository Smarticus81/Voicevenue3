"use client";
import React, { useEffect, useState } from "react";
import { NeuroCard } from "@/components/ui/NeuroCard";
import { NeuroButton } from "@/components/ui/NeuroButton";
import { NeuroInput } from "@/components/ui/NeuroInput";

export default function AdminPackagesPage() {
  const [types, setTypes] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [newType, setNewType] = useState({ organizationId: 'demo-org', name: '', colorHex: '#60A5FA' });
  const [newPkg, setNewPkg] = useState({ organizationId: 'demo-org', name: '', description: '' });
  const [selectedPkg, setSelectedPkg] = useState<string>('');
  const [rules, setRules] = useState<any[]>([]);

  async function load() {
    const [t, p] = await Promise.all([
      fetch('/api/event-types?organizationId=demo-org').then(r => r.json()),
      fetch('/api/event-packages?organizationId=demo-org').then(r => r.json()),
    ]);
    setTypes(t); setPackages(p);
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selectedPkg) { setRules([]); return; }
    fetch(`/api/packages/${selectedPkg}/rules`).then(r => r.json()).then(setRules);
  }, [selectedPkg]);

  async function createType() {
    await fetch('/api/event-types', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newType) });
    setNewType({ organizationId: 'demo-org', name: '', colorHex: '#60A5FA' });
    load();
  }
  async function createPackage() {
    await fetch('/api/event-packages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newPkg) });
    setNewPkg({ organizationId: 'demo-org', name: '', description: '' });
    load();
  }
  async function saveRules() {
    if (!selectedPkg) return;
    await fetch(`/api/packages/${selectedPkg}/rules`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rules) });
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Event Types</h2>
      <NeuroCard className="p-4 space-y-3">
        <div className="grid grid-cols-4 gap-2">
          <NeuroInput placeholder="Name" value={newType.name} onChange={(e) => setNewType({ ...newType, name: e.target.value })} />
          <NeuroInput type="color" value={newType.colorHex} onChange={(e) => setNewType({ ...newType, colorHex: e.target.value })} />
          <div />
          <NeuroButton onClick={createType} disabled={!newType.name}>Create Type</NeuroButton>
        </div>
        <ul className="grid grid-cols-4 gap-2">
          {types.map(t => <li key={t.id} className="p-2 rounded-xl bg-white/50 flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: t.color_hex || t.colorHex }} /> {t.name}</li>)}
        </ul>
      </NeuroCard>

      <h2 className="text-2xl font-semibold">Packages</h2>
      <NeuroCard className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <NeuroInput placeholder="Name" value={newPkg.name} onChange={(e) => setNewPkg({ ...newPkg, name: e.target.value })} />
          <NeuroInput placeholder="Description" value={newPkg.description} onChange={(e) => setNewPkg({ ...newPkg, description: e.target.value })} />
          <NeuroButton onClick={createPackage} disabled={!newPkg.name}>Create Package</NeuroButton>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">All Packages</h3>
            <ul className="space-y-2">
              {packages.map((p) => (
                <li key={p.id} className={`p-2 rounded-xl cursor-pointer ${selectedPkg===p.id?'bg-white':'bg-white/50'}`} onClick={() => setSelectedPkg(p.id)}>{p.name}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Rules</h3>
            <div className="space-y-2">
              {rules.map((r, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-2">
                  <NeuroInput placeholder="inventory_item_id" value={r.inventory_item_id || r.inventoryItemId || ''} onChange={(e) => {
                    const v = [...rules]; v[idx] = { ...v[idx], inventory_item_id: e.target.value }; setRules(v);
                  }} />
                  <NeuroInput type="number" placeholder="qty_per_guest" value={r.qty_per_guest || r.qtyPerGuest || ''} onChange={(e) => {
                    const v = [...rules]; v[idx] = { ...v[idx], qty_per_guest: Number(e.target.value) }; setRules(v);
                  }} />
                  <NeuroInput placeholder="substitution_group" value={r.substitution_group || r.substitutionGroup || ''} onChange={(e) => {
                    const v = [...rules]; v[idx] = { ...v[idx], substitution_group: e.target.value }; setRules(v);
                  }} />
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!(r.is_substitutable ?? r.isSubstitutable)} onChange={(e) => {
                    const v = [...rules]; v[idx] = { ...v[idx], is_substitutable: e.target.checked }; setRules(v);
                  }} /> Sub</label>
                  <NeuroButton onClick={() => { const v = [...rules]; v.splice(idx,1); setRules(v); }}>Remove</NeuroButton>
                </div>
              ))}
              <div className="flex gap-2">
                <NeuroButton onClick={() => setRules([...rules, { inventory_item_id: '', qty_per_guest: 0, is_substitutable: true }])} disabled={!selectedPkg}>Add Rule</NeuroButton>
                <NeuroButton onClick={saveRules} disabled={!selectedPkg}>Save Rules</NeuroButton>
              </div>
            </div>
          </div>
        </div>
      </NeuroCard>
    </div>
  );
}


