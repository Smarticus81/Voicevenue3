"use client";
import Link from "next/link";
import OfflineBanner from "@/components/net/OfflineBanner";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import AppSidebar from "@/components/shell/AppSidebar";
import { 
  ArrowLeft, 
  LayoutDashboard, 
  Bot, 
  Rocket, 
  BarChart3, 
  Shield, 
  FileText, 
  Search, 
  Settings, 
  Zap, 
  Activity 
} from "lucide-react";
import { NeuroButton } from "@/components/ui/NeuroButton";

const nav: { href: Route; label: string; icon: React.ReactNode }[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { href: "/dashboard/agent-builder", label: "Agent Builder", icon: <Bot size={16} /> },
  { href: "/dashboard/publish", label: "Publish", icon: <Rocket size={16} /> },
  { href: "/dashboard/analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
  { href: "/dashboard/permissions", label: "Permissions", icon: <Shield size={16} /> },
  { href: "/dashboard/audit", label: "Audit", icon: <FileText size={16} /> },
  { href: "/dashboard/inspector", label: "Inspector", icon: <Search size={16} /> },
  { href: "/dashboard/settings", label: "Settings", icon: <Settings size={16} /> },
  { href: "/dashboard/latency-lab", label: "Latency Lab", icon: <Zap size={16} /> },
  { href: "/dashboard/diagnostics", label: "Diagnostics", icon: <Activity size={16} /> },
];

export default function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [canBack, setCanBack] = useState(false);
  
  useEffect(() => {
    if (typeof window !== "undefined") setCanBack(window.history.length > 1);
  }, [pathname]);

  return (
    <div className="min-h-screen fade-in">
      <OfflineBanner />
      <div className="mx-auto max-w-7xl px-6 py-8 flex gap-8">
        <AppSidebar />
        <div className="flex-1 space-y-8">
          {/* Enhanced Header */}
          <header className="glass-panel p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <NeuroButton
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  icon={<ArrowLeft size={16} />}
                  className="p-2"
                />
                
                {/* Logo with enhanced styling */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-neuro bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500 shadow-neuro-lg animate-pulse-glow" />
                    <div className="absolute inset-2 rounded-lg bg-white/20 backdrop-blur-sm" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gradient">BevPro Studio</h1>
                    <p className="text-xs text-white/60">Voice-Enabled POS Platform</p>
                  </div>
                </div>
              </div>
              
              {/* Status Badge */}
              <div className="status-connected">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium">System Online</span>
              </div>
            </div>
          </header>

          {/* Enhanced Navigation */}
          <nav className="glass-panel p-4">
            <div className="flex flex-wrap gap-2">
              {nav.map((item) => {
                const active = Boolean(pathname && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      nav-link text-sm font-medium transition-all duration-200 interactive
                      ${active ? 'active' : ''}
                    `}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Main Content */}
          <main className="space-y-6 slide-up">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}


