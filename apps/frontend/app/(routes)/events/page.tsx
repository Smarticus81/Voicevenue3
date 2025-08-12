"use client";
import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { NeuroCard } from "@/components/ui/NeuroCard";
import { NeuroButton } from "@/components/ui/NeuroButton";
import { EventDrawer } from "@/components/events/EventDrawer";
import { SubstitutionModal } from "@/components/events/SubstitutionModal";

type Ev = {
  id: string;
  name: string;
  venue_id: string;
  event_type_id: string;
  package_id: string;
  starts_at: string;
  ends_at: string;
};

export default function EventsPage() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<{ venueIds: string[]; typeId?: string; from: string; to: string }>({
    venueIds: [],
    from: dayjs().startOf('month').toISOString(),
    to: dayjs().endOf('month').toISOString(),
  });
  const [types, setTypes] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [shortageModal, setShortageModal] = useState<{ open: boolean; eventId?: string; allocations?: any[] }>({ open: false });

  async function load() {
    const qs = new URLSearchParams();
    qs.set('organizationId', 'demo-org');
    if (filters.venueIds.length) qs.set('venueId', filters.venueIds.join(','));
    if (filters.typeId) qs.set('eventTypeId', filters.typeId);
    qs.set('from', filters.from);
    qs.set('to', filters.to);
    const r = await fetch(`/api/events?${qs.toString()}`);
    const data = await r.json();
    setEvents(data);
  }

  useEffect(() => {
    (async () => {
      const [v, t] = await Promise.all([
        fetch('/api/venues').then(r=>r.json()),
        fetch('/api/event-types?organizationId=demo-org').then(r=>r.json()),
      ]);
      setVenues(v);
      setTypes(t);
    })();
  }, []);

  useEffect(() => { load(); }, [filters.from, filters.to, filters.typeId, JSON.stringify(filters.venueIds)]);

  const typeColor = useMemo(() => Object.fromEntries(types.map((t:any)=>[t.id, t.color_hex || t.colorHex || '#999'])), [types]);
  const days = useMemo(() => {
    const start = dayjs(filters.from).startOf('day');
    const end = dayjs(filters.to).endOf('day');
    const total = end.diff(start, 'day') + 1;
    return Array.from({ length: total }).map((_, i) => start.add(i, 'day'));
  }, [filters]);

  function onDragStart(e: React.DragEvent, ev: Ev) {
    e.dataTransfer.setData('text/plain', JSON.stringify(ev));
  }
  async function onDrop(day: dayjs.Dayjs) {
    const txt = event?.dataTransfer?.getData('text/plain');
    if (!txt) return;
    const ev: Ev = JSON.parse(txt);
    const start = dayjs(ev.starts_at);
    const newStart = day.startOf('day').add(start.hour(), 'hour').add(start.minute(), 'minute');
    const dur = dayjs(ev.ends_at).diff(start, 'minute');
    const newEnd = newStart.add(dur, 'minute');
    const r = await fetch(`/api/events/${ev.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ startsAt: newStart.toISOString(), endsAt: newEnd.toISOString() }) });
    const data = await r.json();
    setEvents((prev) => prev.map((e) => e.id === ev.id ? { ...e, starts_at: newStart.toISOString(), ends_at: newEnd.toISOString() } as any : e));
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Events</h2>
        <div className="flex items-center gap-2">
          <select className="p-2 rounded-xl bg-white/50" value={filters.typeId || ''} onChange={(e)=>setFilters({ ...filters, typeId: e.target.value || undefined })}>
            <option value="">All types</option>
            {types.map((t:any)=>(<option key={t.id} value={t.id}>{t.name}</option>))}
          </select>
          <NeuroButton onClick={() => setOpen(true)}>Create Event</NeuroButton>
        </div>
      </div>
      <NeuroCard className="p-4">
        <div className="grid grid-cols-7 gap-2">
          {days.map((d, i) => (
            <div key={i} className="h-36 rounded-xl bg-white/40 backdrop-blur-sm p-2" onDragOver={(e)=>e.preventDefault()} onDrop={()=>onDrop(d)}>
              <div className="text-xs opacity-60">{d.format('MMM D')}</div>
              <div className="space-y-1 mt-1">
                {events.filter(ev => dayjs(ev.starts_at).isSame(d, 'day')).map(ev => (
                  <div key={ev.id} draggable onDragStart={(e)=>onDragStart(e, ev)} className="px-2 py-1 rounded-lg text-xs text-white" style={{ background: typeColor[ev.event_type_id] || '#64748b' }}>
                    {ev.name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </NeuroCard>
      <EventDrawer open={open} onOpenChange={(v: boolean, shortage?: { eventId: string; allocations: any[] }) => { setOpen(v); if (!v) load(); if (shortage) setShortageModal({ open: true, eventId: shortage.eventId, allocations: shortage.allocations }); }} />
      <SubstitutionModal open={shortageModal.open} onOpenChange={(v)=>setShortageModal({ open: v })} eventId={shortageModal.eventId || ''} allocations={(shortageModal.allocations as any) || []} />
    </div>
  );
}


