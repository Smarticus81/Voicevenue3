"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Bot, 
  Timer, 
  Settings, 
  FileText, 
  Rocket, 
  Activity,
  BarChart3,
  Users,
  Mic2,
  Sparkles,
  Code,
  Palette,
  Play,
  Layers,
  Zap
} from "lucide-react";

const studioTools = [
  { 
    title: "Agent Builder", 
    href: "/dashboard/agent-builder", 
    icon: <Bot size={24} />,
    description: "Design custom voice workflows and conversational AI",
    color: "from-blue-500 to-blue-600"
  },
  { 
    title: "Voice Testing", 
    href: "/test-voice", 
    icon: <Mic2 size={24} />,
    description: "Test voice recognition and response quality",
    color: "from-green-500 to-green-600"
  },
  { 
    title: "POS Designer", 
    href: "/dashboard/studio/pos-designer", 
    icon: <Palette size={24} />,
    description: "Create and customize POS interfaces",
    color: "from-purple-500 to-purple-600"
  },
  { 
    title: "Integration Builder", 
    href: "/integrations/mcp", 
    icon: <Code size={24} />,
    description: "Connect data sources and external services",
    color: "from-orange-500 to-orange-600"
  },
  { 
    title: "Analytics Lab", 
    href: "/dashboard/analytics", 
    icon: <BarChart3 size={24} />,
    description: "Deep dive into usage patterns and performance",
    color: "from-cyan-500 to-cyan-600"
  },
  { 
    title: "Deployment", 
    href: "/dashboard/publish", 
    icon: <Rocket size={24} />,
    description: "Deploy your voice agents to production",
    color: "from-red-500 to-red-600"
  }
];

export default function StudioPage() {
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
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 rounded-neuro bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Layers size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">VenueVoice Studio</h1>
              <p className="text-white/70">Your playground for building voice-enabled experiences</p>
            </div>
          </div>
        </motion.div>

        {/* Studio Tools Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studioTools.map((tool, index) => (
            <motion.div
              key={tool.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={tool.href}>
                <div className="group glass-panel p-6 rounded-neuro hover:scale-105 transition-all duration-300 cursor-pointer">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-neuro bg-gradient-to-r ${tool.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      {tool.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-gradient transition-all">
                        {tool.title}
                      </h3>
                      <p className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center text-sm text-white/60 group-hover:text-emerald-400 transition-colors">
                    <Play size={14} className="mr-2" />
                    <span>Launch Tool</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div 
          className="mt-12 glass-panel p-6 rounded-neuro"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <Zap size={20} className="text-emerald-400" />
            <h2 className="text-xl font-semibold">Quick Actions</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <Link 
              href="/dashboard/studio/pos-designer" 
              className="glass p-4 rounded-neuro hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Palette size={16} className="text-purple-400" />
                </div>
                <div>
                  <div className="font-medium group-hover:text-gradient transition-colors">New POS</div>
                  <div className="text-xs text-white/60">Create a new point-of-sale interface</div>
                </div>
              </div>
            </Link>
            
            <Link 
              href="/dashboard/agent-builder" 
              className="glass p-4 rounded-neuro hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Bot size={16} className="text-blue-400" />
                </div>
                <div>
                  <div className="font-medium group-hover:text-gradient transition-colors">New Agent</div>
                  <div className="text-xs text-white/60">Build a custom voice assistant</div>
                </div>
              </div>
            </Link>
            
            <Link 
              href="/test-voice" 
              className="glass p-4 rounded-neuro hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Mic2 size={16} className="text-green-400" />
                </div>
                <div>
                  <div className="font-medium group-hover:text-gradient transition-colors">Test Voice</div>
                  <div className="text-xs text-white/60">Try out voice capabilities</div>
                </div>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Back to Dashboard */}
        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <Link 
            href="/dashboard" 
            className="inline-flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
          >
            <span>← Back to Dashboard</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

