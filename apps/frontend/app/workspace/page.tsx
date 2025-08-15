"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  BarChart3, User, Settings, Bell, LogOut, Building2, Plus, Search, Menu
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function WorkspacePage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen fade-in" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <header className="border-b transition-colors" style={{ borderColor: 'var(--border-light)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/bevpro-logo.svg" alt="BevPro" className="h-8 w-auto" />
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Workspace
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Your venue management canvas
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                <input 
                  type="text" 
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 rounded-xl text-sm transition-colors"
                  style={{
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-light)'
                  }}
                />
              </div>
              
              {/* Profile Menu */}
              <div className="flex items-center gap-3">
                <button className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                  <Bell size={18} className="text-white/70" />
                </button>
                <button className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                  <Settings size={18} className="text-white/70" />
                </button>
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center cursor-pointer">
                  <User size={18} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="glass-panel p-6 rounded-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
                  <User size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Welcome to your Workspace!</h2>
                  <p className="text-white/60">Start building voice-powered solutions for your venue</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
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
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          <Link href="/build">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="glass-panel p-6 rounded-2xl cursor-pointer"
            >
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                <Plus size={24} className="text-emerald-400" />
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

        {/* Workspace Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid lg:grid-cols-2 gap-6 mb-8"
        >
          {/* Recent Activity */}
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
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-white/70 text-sm">Voice system initialized</span>
                <span className="text-white/40 text-xs ml-auto">2 min ago</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-lg font-semibold text-white mb-4">Workspace Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="text-2xl font-bold text-emerald-400">0</div>
                <div className="text-white/60 text-sm">AI Assistants</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="text-2xl font-bold text-blue-400">0</div>
                <div className="text-white/60 text-sm">Voice Commands</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="text-2xl font-bold text-purple-400">0</div>
                <div className="text-white/60 text-sm">Orders Processed</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="text-2xl font-bold text-orange-400">100%</div>
                <div className="text-white/60 text-sm">System Status</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Getting Started */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-lg font-semibold text-white mb-4">Getting Started</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-emerald-400 font-bold">1</span>
                </div>
                <h4 className="font-semibold text-white mb-2">Build Your Assistant</h4>
                <p className="text-white/60 text-sm">Create a voice-powered AI agent for your venue</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-blue-400 font-bold">2</span>
                </div>
                <h4 className="font-semibold text-white mb-2">Configure Settings</h4>
                <p className="text-white/60 text-sm">Set up your venue information and preferences</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-purple-400 font-bold">3</span>
                </div>
                <h4 className="font-semibold text-white mb-2">Start Using</h4>
                <p className="text-white/60 text-sm">Deploy your assistant and begin serving customers</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
