"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Building2, Mail, Lock, User, Globe, ShieldCheck, ArrowLeft, ArrowRight, Check } from "lucide-react";

export default function FastSignupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
    slug: "",
    country: "US",
    region: "",
    tos: false,
    dpa: false,
    marketing: false,
  });
  const [status, setStatus] = useState<string>("");

  function suggestSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Creating your workspace...");
    const res = await fetch("/api/platform/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        owner: { name: form.name, email: form.email, password: form.password },
        organization: { name: form.company, slug: form.slug || suggestSlug(form.company), country: form.country, region: form.region },
        consents: { tos: form.tos, dpa: form.dpa, marketing: form.marketing },
      }),
    });
    const json = await res.json();
    if (res.ok && json?.ok) {
      document.cookie = `session_user=${json.user?.id || "1"}; path=/;`;
      window.location.href = `/onboarding?org=${json.organization.slug}`;
    } else {
      setStatus(json?.error || "Signup failed");
    }
  }

  const canProceedToStep2 = form.name && form.email && form.password;
  const canSubmit = canProceedToStep2 && form.company && form.tos && form.dpa;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-emerald-900 flex items-center justify-center p-6">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative max-w-2xl w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/bevpro-logo.svg" alt="BevPro" className="h-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-white">Create Your Workspace</h1>
          <p className="text-white/60">Start building voice-powered Bar operations</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 1 ? 'bg-emerald-500 text-white' : 'bg-white/20 text-white/60'
            }`}>
              {currentStep > 1 ? <Check size={16} /> : '1'}
            </div>
            <div className={`w-16 h-1 rounded-full ${
              currentStep >= 2 ? 'bg-emerald-500' : 'bg-white/20'
            }`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 2 ? 'bg-emerald-500 text-white' : 'bg-white/20 text-white/60'
            }`}>
              {currentStep > 2 ? <Check size={16} /> : '2'}
            </div>
          </div>
        </div>

        {/* Cards Container */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="glass-panel p-8 text-white shadow-2xl"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">Personal Information</h2>
                  <p className="text-white/60">Tell us about yourself</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Full Name</label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
                      <input 
                        className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200" 
                        value={form.name} 
                        onChange={(e) => setForm({ ...form, name: e.target.value })} 
                        placeholder="John Doe"
                        required 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Work Email</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
                      <input 
                        type="email" 
                        className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200" 
                        value={form.email} 
                        onChange={(e) => setForm({ ...form, email: e.target.value })} 
                        placeholder="you@yourbar.com"
                        required 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
                      <input 
                        type="password" 
                        className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200" 
                        value={form.password} 
                        onChange={(e) => setForm({ ...form, password: e.target.value })} 
                        placeholder="Create a secure password"
                        required 
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentStep(2)}
                    disabled={!canProceedToStep2}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      canProceedToStep2 
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                    }`}
                  >
                    <span>Continue to Business Info</span>
                    <ArrowRight size={16} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="glass-panel p-8 text-white shadow-2xl"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">Business Information</h2>
                  <p className="text-white/60">Tell us about your venue</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Venue Name</label>
                    <div className="relative">
                      <Building2 size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
                      <input 
                        className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200" 
                        value={form.company} 
                        onChange={(e) => setForm({ ...form, company: e.target.value, slug: form.slug || suggestSlug(e.target.value) })} 
                        placeholder="Your venue name"
                        required 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Workspace URL</label>
                    <div className="relative">
                      <Globe size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
                      <div className="flex items-center pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all duration-200">
                        <span className="text-white/50 text-sm mr-1">https://</span>
                        <input 
                          className="flex-1 bg-transparent text-white placeholder-white/40 outline-none" 
                          value={form.slug} 
                          onChange={(e) => setForm({ ...form, slug: e.target.value })} 
                          placeholder="your-venue-name" 
                          required 
                        />
                        <span className="text-white/50 text-sm ml-1">.bevpro.app</span>
                      </div>
                    </div>
                    <p className="text-xs text-white/50 mt-2">This will be your unique workspace URL</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Country</label>
                      <input 
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200" 
                        value={form.country} 
                        onChange={(e) => setForm({ ...form, country: e.target.value })} 
                        placeholder="United States"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">State/Region</label>
                      <input 
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200" 
                        value={form.region} 
                        onChange={(e) => setForm({ ...form, region: e.target.value })} 
                        placeholder="California"
                      />
                    </div>
                  </div>

                  {/* Terms & Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">Terms & Preferences</h3>
                    
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 text-sm text-white/80 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={form.tos} 
                          onChange={(e) => setForm({ ...form, tos: e.target.checked })} 
                          className="mt-1 w-4 h-4 text-emerald-600 border-white/30 rounded focus:ring-emerald-500 focus:ring-2" 
                          required 
                        />
                        <div>
                          <span className="font-medium group-hover:text-white transition-colors">Accept Terms of Service</span>
                          <p className="text-xs text-white/50 mt-1">By checking this, you agree to our platform terms</p>
                        </div>
                      </label>
                      
                      <label className="flex items-start gap-3 text-sm text-white/80 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={form.dpa} 
                          onChange={(e) => setForm({ ...form, dpa: e.target.checked })} 
                          className="mt-1 w-4 h-4 text-emerald-600 border-white/30 rounded focus:ring-emerald-500 focus:ring-2" 
                          required 
                        />
                        <div>
                          <span className="font-medium group-hover:text-white transition-colors">Accept Data Processing Agreement</span>
                          <p className="text-xs text-white/50 mt-1">Required for data protection compliance</p>
                        </div>
                      </label>
                      
                      <label className="flex items-start gap-3 text-sm text-white/80 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={form.marketing} 
                          onChange={(e) => setForm({ ...form, marketing: e.target.checked })} 
                          className="mt-1 w-4 h-4 text-emerald-600 border-white/30 rounded focus:ring-emerald-500 focus:ring-2" 
                        />
                        <div>
                          <span className="font-medium group-hover:text-white transition-colors">Marketing Communications</span>
                          <p className="text-xs text-white/50 mt-1">Receive updates about new features and tips</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 py-3 px-6 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <ArrowLeft size={16} />
                      <span>Back</span>
                    </motion.button>
                    
                    <motion.button 
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }} 
                      disabled={!canSubmit}
                      className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                        canSubmit 
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                          : 'bg-white/10 text-white/40 cursor-not-allowed'
                      }`}
                    >
                      <Building2 size={16} />
                      <span>Create Workspace</span>
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {status && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-sm text-white bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 text-center"
          >
            {status}
          </motion.div>
        )}

        {/* Login Link */}
        <div className="mt-8 text-center">
          <p className="text-white/60">
            Already have a workspace?{' '}
            <Link 
              href="/login" 
              className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline transition-all duration-200"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}



