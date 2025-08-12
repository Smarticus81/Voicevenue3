"use client";
import React from "react";
import { NeuroModal } from "@/components/ui/NeuroModal";
import { NeuroButton } from "@/components/ui/NeuroButton";
import { NeuroInput } from "@/components/ui/NeuroInput";

type Allocation = {
  inventoryItemId: string;
  requiredQty: number;
  allocatedQty: number;
  shortageQty: number;
  suggestedSubs?: Array<{ inventoryItemId: string; availableQty: number }>;
};

export function SubstitutionModal({
  open,
  onOpenChange,
  eventId,
  allocations,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eventId: string;
  allocations: Allocation[];
}) {
  const [pending, setPending] = React.useState(false);
  const [selection, setSelection] = React.useState<Record<string, { to: string; qty: number }>>({});

  async function apply() {
    setPending(true);
    try {
      for (const [from, v] of Object.entries(selection)) {
        if (!v.to || !v.qty) continue;
        await fetch(`/api/events/${eventId}/substitute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fromInventoryItemId: from, toInventoryItemId: v.to, qty: v.qty })
        });
      }
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <NeuroModal open={open} onOpenChange={onOpenChange} title="Substitutions">
      <div className="space-y-3">
        {allocations.filter(a => a.shortageQty > 0).length === 0 ? (
          <div>No shortages.</div>
        ) : (
          <div className="space-y-3">
            {allocations.filter(a => a.shortageQty > 0).map((a) => (
              <div key={a.inventoryItemId} className="p-3 rounded-xl bg-white/50">
                <div className="text-sm mb-2">Item {a.inventoryItemId} shortage {a.shortageQty}</div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <select className="p-2 rounded-xl bg-white" value={selection[a.inventoryItemId]?.to || ''} onChange={(e) => setSelection({ ...selection, [a.inventoryItemId]: { to: e.target.value, qty: selection[a.inventoryItemId]?.qty || a.shortageQty } })}>
                    <option value="">Choose substitute</option>
                    {a.suggestedSubs?.map((s) => (
                      <option key={s.inventoryItemId} value={s.inventoryItemId}>{s.inventoryItemId} ({s.availableQty})</option>
                    ))}
                  </select>
                  <NeuroInput type="number" value={String(selection[a.inventoryItemId]?.qty || a.shortageQty)} onChange={(e) => setSelection({ ...selection, [a.inventoryItemId]: { to: selection[a.inventoryItemId]?.to || '', qty: Number(e.target.value) } })} />
                  <div className="text-xs opacity-60">ml</div>
                </div>
              </div>
            ))}
            <div className="flex justify-end">
              <NeuroButton onClick={apply} disabled={pending}>{pending ? 'Applying...' : 'Apply substitutions'}</NeuroButton>
            </div>
          </div>
        )}
      </div>
    </NeuroModal>
  );
}


