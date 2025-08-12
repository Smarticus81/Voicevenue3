"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const steps = [
  { id: "org", title: "Organization Profile" },
  { id: "venues", title: "Venues" },
  { id: "inventory", title: "Inventory" },
  { id: "packages", title: "Packages & Pricing" },
  { id: "voice", title: "Voice Agent & PWA" },
  { id: "vendors", title: "Vendors & Purchasing" },
  { id: "team", title: "Team & Roles" },
  { id: "billing", title: "Billing" },
  { id: "alerts", title: "Alerts & Notifications" },
  { id: "review", title: "Review & Launch" },
];

export default function OnboardingWizard() {
  const [active, setActive] = useState(0);
  const [payload, setPayload] = useState<any>({ organization: {}, venues: [], inventory: {}, packages: [], voice_agent: {}, vendors: [], team: [], billing: {}, alerts: {} });
  const [saving, setSaving] = useState(false);

  function next() { setActive((i) => Math.min(i + 1, steps.length - 1)); }
  function prev() { setActive((i) => Math.max(i - 1, 0)); }

  async function commit() {
    setSaving(true);
    const res = await fetch('/api/platform/provision', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const json = await res.json();
    setSaving(false);
    if (res.ok && json?.ok) {
      window.location.href = '/dashboard';
    }
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <div className="neumorphic-card p-6 mb-6 text-gray-800">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Guided Onboarding</h1>
            <div className="text-sm text-gray-600">Step {active + 1} of {steps.length}</div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {steps.map((s, i) => (
              <button key={s.id} onClick={() => setActive(i)} className={`px-3 py-1 rounded ${i === active ? 'japanese-button-primary text-white' : 'japanese-button'}`}>
                {s.title}
              </button>
            ))}
          </div>
        </div>

        <div className="neumorphic-card p-6 text-gray-800">
          <div className="mb-4 text-lg font-semibold text-gray-900">{steps[active].title}</div>
          <div className="text-sm text-gray-600 mb-6">Minimal inputs with sane defaults. You can skip and fill later.</div>

          <div className="grid gap-3">
            <input className="border rounded p-2 text-gray-900 placeholder-gray-400" placeholder="Field 1 (example)" />
            <input className="border rounded p-2 text-gray-900 placeholder-gray-400" placeholder="Field 2 (example)" />
            <input className="border rounded p-2 text-gray-900 placeholder-gray-400" placeholder="Field 3 (example)" />
          </div>

          <div className="mt-6 flex justify-between">
            <button onClick={prev} className="japanese-button">Back</button>
            {active < steps.length - 1 ? (
              <div className="space-x-2">
                <button onClick={next} className="japanese-button">Skip for now</button>
                <button onClick={next} className="japanese-button-primary">Continue</button>
              </div>
            ) : (
              <button onClick={commit} className="japanese-button-primary">Confirm & Provision</button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
