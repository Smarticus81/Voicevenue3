"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Building2, Mail, Lock, User, Globe, ShieldCheck } from "lucide-react";

export default function FastSignupPage() {
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
    setStatus("Creating account...");
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-emerald-900 flex items-center justify-center p-6">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative max-w-2xl w-full neumorphic-card p-10 text-gray-800 shadow-2xl"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/bevpro-logo.svg" alt="BevPro" className="h-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Create Your Workspace</h1>
          <p className="text-gray-600">Start building voice-powered Bar operations</p>
        </div>
        <form onSubmit={submit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">Owner full name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input 
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 shadow-sm focus:shadow-md focus:ring-2 focus:ring-emerald-300 focus:border-transparent outline-none transition-all duration-200" 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })} 
                    placeholder="John Doe"
                    required 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">Work email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input 
                    type="email" 
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 shadow-sm focus:shadow-md focus:ring-2 focus:ring-emerald-300 focus:border-transparent outline-none transition-all duration-200" 
                    value={form.email} 
                    onChange={(e) => setForm({ ...form, email: e.target.value })} 
                    placeholder="john@Bar.com"
                    required 
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input 
                  type="password" 
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 shadow-sm focus:shadow-md focus:ring-2 focus:ring-emerald-300 focus:border-transparent outline-none transition-all duration-200" 
                  value={form.password} 
                  onChange={(e) => setForm({ ...form, password: e.target.value })} 
                  placeholder="Create a secure password"
                  required 
                />
              </div>
            </div>
          </div>

          {/* Business Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Business Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">Bar / Bar Name</label>
              <div className="relative">
                <Building2 size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input 
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 shadow-sm focus:shadow-md focus:ring-2 focus:ring-emerald-300 focus:border-transparent outline-none transition-all duration-200" 
                  value={form.company} 
                  onChange={(e) => setForm({ ...form, company: e.target.value, slug: form.slug || suggestSlug(e.target.value) })} 
                  placeholder="The Blue Moon Grill"
                  required 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">Public URL for your workspace</label>
              <div className="relative">
                <Globe size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <div className="flex items-center pl-11 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus-within:shadow-md focus-within:ring-2 focus-within:ring-emerald-300 focus-within:border-transparent transition-all duration-200">
                  <span className="text-gray-500 text-sm mr-1">https://</span>
                  <input 
                    className="flex-1 text-gray-900 placeholder-gray-400 outline-none" 
                    value={form.slug} 
                    onChange={(e) => setForm({ ...form, slug: e.target.value })} 
                    placeholder="bluemoon" 
                    required 
                  />
                  <span className="text-gray-500 text-sm ml-1">.bevpro.app</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">This will be your unique workspace URL (you can change it later)</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">Country</label>
                <input 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 shadow-sm focus:shadow-md focus:ring-2 focus:ring-emerald-300 focus:border-transparent outline-none transition-all duration-200" 
                  value={form.country} 
                  onChange={(e) => setForm({ ...form, country: e.target.value })} 
                  placeholder="United States"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">State/Region</label>
                <input 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 shadow-sm focus:shadow-md focus:ring-2 focus:ring-emerald-300 focus:border-transparent outline-none transition-all duration-200" 
                  value={form.region} 
                  onChange={(e) => setForm({ ...form, region: e.target.value })} 
                  placeholder="California"
                />
              </div>
            </div>
          </div>
          {/* Terms & Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Terms & Preferences</h3>
            
            <div className="space-y-3">
              <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={form.tos} 
                  onChange={(e) => setForm({ ...form, tos: e.target.checked })} 
                  className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2" 
                  required 
                />
                <div>
                  <span className="font-medium group-hover:text-gray-900 transition-colors">Accept Terms of Service</span>
                  <p className="text-xs text-gray-500 mt-1">By checking this, you agree to our platform terms and conditions</p>
                </div>
              </label>
              
              <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={form.dpa} 
                  onChange={(e) => setForm({ ...form, dpa: e.target.checked })} 
                  className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2" 
                  required 
                />
                <div>
                  <span className="font-medium group-hover:text-gray-900 transition-colors">Accept Data Processing Agreement</span>
                  <p className="text-xs text-gray-500 mt-1">Required for compliance with data protection regulations</p>
                </div>
              </label>
              
              <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={form.marketing} 
                  onChange={(e) => setForm({ ...form, marketing: e.target.checked })} 
                  className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2" 
                />
                <div>
                  <span className="font-medium group-hover:text-gray-900 transition-colors">Marketing Communications</span>
                  <p className="text-xs text-gray-500 mt-1">Receive updates about new features, tips, and industry insights</p>
                </div>
              </label>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }} 
            className="w-full relative overflow-hidden py-4 px-6 bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 hover:from-emerald-500 hover:via-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group" 
            type="submit"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center justify-center space-x-3">
              <Building2 size={20} className="group-hover:scale-110 transition-transform duration-200" />
              <span className="text-lg">Create my workspace</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-cyan-400/30 to-blue-400/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
          </motion.button>
          {status && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded-lg p-3"
            >
              {status}
            </motion.div>
          )}
        </form>

        {/* Divider */}
        <div className="my-8 flex items-center">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="px-4 text-sm text-gray-500 bg-white">or</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-gray-600">
            Already have a workspace?{' '}
            <Link 
              href="/login" 
              className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline transition-all duration-200"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Need help? Contact{' '}
            <a href="mailto:support@bevpro.app" className="text-emerald-600 hover:text-emerald-700 font-medium">
              support@bevpro.app
            </a>
          </p>
        </div>
      </motion.div>
    </main>
  );
}



