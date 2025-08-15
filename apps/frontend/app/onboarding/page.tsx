"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, SkipForward, Check, Building2 } from "lucide-react";

const steps = [
  { id: "org", title: "Organization Profile", description: "Basic venue information" },
  { id: "venues", title: "Venues", description: "Add your locations" },
  { id: "inventory", title: "Inventory", description: "Set up your menu items" },
  { id: "packages", title: "Packages & Pricing", description: "Configure pricing plans" },
  { id: "voice", title: "Voice Agent & PWA", description: "Voice assistant setup" },
  { id: "vendors", title: "Vendors & Purchasing", description: "Supplier connections" },
  { id: "team", title: "Team & Roles", description: "Staff management" },
  { id: "billing", title: "Billing", description: "Payment setup" },
  { id: "alerts", title: "Alerts & Notifications", description: "Communication preferences" },
  { id: "review", title: "Review & Launch", description: "Final setup review" },
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
      window.location.href = '/workspace';
    }
  }

  async function skipOnboarding() {
    setSaving(true);
    const res = await fetch('/api/platform/provision', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const json = await res.json();
    setSaving(false);
    if (res.ok && json?.ok) {
      window.location.href = '/workspace';
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-emerald-900 p-6">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-panel p-6 mb-6 text-white shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img src="/bevpro-logo.svg" alt="BevPro" className="h-8 w-auto" />
              <div>
                <h1 className="text-2xl font-bold text-white">Guided Onboarding</h1>
                <p className="text-white/60 text-sm">Step {active + 1} of {steps.length}</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={skipOnboarding}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200"
            >
              <SkipForward size={16} />
              <span>Skip All</span>
            </motion.button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-2 mb-4">
            <motion.div 
              className="bg-emerald-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((active + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Step Navigation */}
          <div className="flex flex-wrap gap-2">
            {steps.map((s, i) => (
              <motion.button 
                key={s.id} 
                onClick={() => setActive(i)} 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  i === active 
                    ? 'bg-emerald-500 text-white' 
                    : i < active 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {i < active ? <Check size={14} /> : null}
                {s.title}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-panel p-8 text-white shadow-2xl"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{steps[active].title}</h2>
                <p className="text-white/60">{steps[active].description}</p>
              </div>

              <div className="space-y-6">
                {/* Sample form fields - you can customize these based on the step */}
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Field 1</label>
                    <input 
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200" 
                      placeholder="Example input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Field 2</label>
                    <input 
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200" 
                      placeholder="Another example"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Field 3</label>
                    <select className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200">
                      <option value="">Select an option</option>
                      <option value="option1">Option 1</option>
                      <option value="option2">Option 2</option>
                      <option value="option3">Option 3</option>
                    </select>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center pt-6 border-t border-white/10">
                  <motion.button 
                    onClick={prev}
                    disabled={active === 0}
                    whileHover={{ scale: active === 0 ? 1 : 1.05 }}
                    whileTap={{ scale: active === 0 ? 1 : 0.95 }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      active === 0 
                        ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                  </motion.button>

                  <div className="flex gap-3">
                    {active < steps.length - 1 ? (
                      <>
                        <motion.button 
                          onClick={next}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all duration-200"
                        >
                          Skip for now
                        </motion.button>
                        <motion.button 
                          onClick={next}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                        >
                          <span>Continue</span>
                          <ArrowRight size={16} />
                        </motion.button>
                      </>
                    ) : (
                      <motion.button 
                        onClick={commit}
                        disabled={saving}
                        whileHover={{ scale: saving ? 1 : 1.05 }}
                        whileTap={{ scale: saving ? 1 : 0.95 }}
                        className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                          saving 
                            ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        }`}
                      >
                        <Building2 size={16} />
                        <span>{saving ? 'Setting up...' : 'Launch Workspace'}</span>
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </main>
  );
}
