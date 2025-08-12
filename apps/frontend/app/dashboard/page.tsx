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
  Sparkles 
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

const dashboardCards = [
  { 
    title: "Studio", 
    href: "/dashboard/studio", 
    icon: <Sparkles size={24} />,
    description: "Your playground for building voice experiences",
    featured: true
  },
  { 
    title: "Agent Builder", 
    href: "/dashboard/agent-builder", 
    icon: <Bot size={24} />,
    description: "Design custom voice workflows"
  },
  { 
    title: "Latency Lab", 
    href: "/dashboard/latency-lab", 
    icon: <Timer size={24} />,
    description: "Optimize response performance"
  },
  { 
    title: "Settings", 
    href: "/dashboard/settings", 
    icon: <Settings size={24} />,
    description: "Configure voice & vendors"
  },
  { 
    title: "Analytics", 
    href: "/dashboard/analytics", 
    icon: <BarChart3 size={24} />,
    description: "Usage insights & metrics"
  },
  { 
    title: "Publish", 
    href: "/dashboard/publish", 
    icon: <Rocket size={24} />,
    description: "Deploy to production"
  },
  { 
    title: "Diagnostics", 
    href: "/dashboard/diagnostics", 
    icon: <Activity size={24} />,
    description: "Debug & troubleshoot"
  },
];

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
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 rounded-neuro bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <BarChart3 size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">VenueVoice Dashboard</h1>
              <p className="text-white/70">Control center for your voice-enabled platform</p>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardCards.map((card, index) => (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={card.href}>
                <div className={`group glass-panel p-6 rounded-neuro hover:scale-105 transition-all duration-300 cursor-pointer ${card.featured ? 'ring-2 ring-emerald-500/50' : ''}`}>
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-neuro ${card.featured ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-blue-500 to-purple-500'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      {card.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-gradient transition-all">
                        {card.title}
                      </h3>
                      <p className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                        {card.description}
                      </p>
                      {card.featured && (
                        <div className="mt-2 inline-flex items-center text-xs text-emerald-400 font-medium">
                          ✨ Featured
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

