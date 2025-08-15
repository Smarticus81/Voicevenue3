"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  BarChart3, User, Settings, Bell, LogOut, Building2
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function DashboardPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen fade-in" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-neuro bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <Building2 size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient">Workspace</h1>
                <p className="text-white/70">Your venue management canvas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <img src="/bevpro-logo.svg" alt="BevPro" className="h-8 w-auto opacity-60" />
            </div>
          </div>
        </motion.div>

        {/* Profile Menu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="glass-panel p-6 rounded-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
                  <User size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Welcome back!</h2>
                  <p className="text-white/60">Manage your venue operations</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                  <Bell size={18} className="text-white/70" />
                </button>
                <button className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                  <Settings size={18} className="text-white/70" />
                </button>
                <button className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                  <LogOut size={18} className="text-white/70" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          <Link href="/build">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="glass-panel p-6 rounded-2xl cursor-pointer"
            >
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 size={24} className="text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Build Assistant</h3>
              <p className="text-white/60 text-sm">Create voice-powered AI agents for your venue</p>
            </motion.div>
          </Link>

          <Link href="/demo">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="glass-panel p-6 rounded-2xl cursor-pointer"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <Building2 size={24} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">View Demo</h3>
              <p className="text-white/60 text-sm">See how voice AI works in action</p>
            </motion.div>
          </Link>

          <Link href="/settings">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="glass-panel p-6 rounded-2xl cursor-pointer"
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                <Settings size={24} className="text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Settings</h3>
              <p className="text-white/60 text-sm">Configure your workspace preferences</p>
            </motion.div>
          </Link>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-white/70 text-sm">Workspace created successfully</span>
                <span className="text-white/40 text-xs ml-auto">Just now</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-white/70 text-sm">Ready to build your first AI assistant</span>
                <span className="text-white/40 text-xs ml-auto">1 min ago</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

