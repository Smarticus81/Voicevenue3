"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  Home, 
  LayoutDashboard, 
  Bot, 
  Rocket, 
  Settings, 
  BarChart3, 
  FileText, 
  Zap, 
  Shield, 
  FileSearch, 
  Activity,
  Building,
  LogOut,
  User
} from "lucide-react";
import { ROUTE_MAP } from "@/components/Navigation";

const sections = ROUTE_MAP.dashboardSections;

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [venueName, setVenueName] = useState<string>("Demo Venue");
  const [userEmail, setUserEmail] = useState<string>("");

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect even if API fails
      router.push('/login');
    }
  };

  useEffect(() => {
    // Load current venue from query param or default
    const params = new URLSearchParams(window.location.search);
    const venueId = params.get('venueId') || 'demo-venue';
    fetch(`/api/venue/settings?venueId=${venueId}`)
      .then(r => r.json())
      .then(data => setVenueName(data.venueName || 'Demo Venue'))
      .catch(() => setVenueName('Demo Venue'));

    // Get user info from cookies for display
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(c => c.trim().startsWith('session_user='));
    if (sessionCookie) {
      // In a real app, you'd fetch user details from an API
      setUserEmail('user@Bar.com'); // Placeholder
    }
  }, []);
  
  return (
    <aside className="hidden lg:block w-72 shrink-0">
      <div className="sticky top-8 space-y-6">
        {/* Sidebar Header */}
        <div className="glass-panel p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 shadow-glow-sm flex items-center justify-center">
              <Building size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Workspace</h2>
              <p className="text-xs text-white/60">{venueName}</p>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        {sections.map((section) => (
          <div key={section.title} className="glass-sidebar rounded-neuro p-4">
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3 px-2">
              {section.title}
            </h3>
            <nav className="space-y-1">
              {section.links.map((link) => {
                const active = pathname === link.href || pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                      nav-link group text-sm font-medium interactive
                      ${active ? 'active' : ''}
                    `}
                  >
                    <span className="flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      {link.icon}
                    </span>
                    <span>{link.label}</span>
                    {active && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 shadow-glow-sm" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}

        {/* Quick Actions */}
        <div className="glass-panel p-4 space-y-3">
          <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <Link 
              href="/kiosk" 
              className="block p-3 rounded-neuro-sm bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30 text-emerald-300 hover:from-emerald-500/30 hover:to-cyan-500/30 transition-all duration-200"
            >
              <div className="text-sm font-medium">Open Kiosk</div>
              <div className="text-xs opacity-80">Voice interface</div>
            </Link>
            <Link 
              href="/build/integrations" 
              className="block p-3 rounded-neuro-sm bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-400/30 text-violet-300 hover:from-violet-500/30 hover:to-pink-500/30 transition-all duration-200"
            >
              <div className="text-sm font-medium">Integrations</div>
              <div className="text-xs opacity-80">Connect vendors</div>
            </Link>
          </div>
        </div>

        {/* User Account */}
        <div className="glass-panel p-4 space-y-3">
          <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
            Account
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                <User size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {userEmail || 'User'}
                </div>
                <div className="text-xs text-white/60">Workspace Owner</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 p-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}



