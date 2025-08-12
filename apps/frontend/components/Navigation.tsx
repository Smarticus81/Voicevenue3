"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Home,
  LayoutDashboard, 
  ShoppingCart,
  Monitor,
  Settings,
  Building2,
  TestTube,
  Mic,
  Sparkles,
  Menu,
  X,
  ArrowLeft,
  LogIn,
  User,
  LogOut,
  ChevronDown
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Centralized route map for the VenueVoice platform
// This is the single source of truth for navigable pages
export const ROUTE_MAP = {
  topNav: [
    { name: "Home", href: "/", description: "Platform overview", icon: Home },
    { name: "Dashboard", href: "/dashboard", description: "Control center", icon: LayoutDashboard },
    { name: "Integrations", href: "/integrations/mcp", description: "MCP & connectors", icon: Settings },
    { name: "Settings", href: "/settings", description: "Venue configuration", icon: Settings },
  ],
  dashboardSections: [
    {
      title: "Core",
      links: [
        { href: "/dashboard", label: "Overview", icon: <LayoutDashboard size={18} /> },
        { href: "/dashboard/agent-builder", label: "Agent Builder", icon: <Mic size={18} /> },
        { href: "/dashboard/publish", label: "Publish", icon: <Sparkles size={18} /> },
      ],
    },
    {
      title: "Analytics & Reports",
      links: [
        { href: "/dashboard/analytics", label: "Analytics", icon: <Monitor size={18} /> },
        { href: "/dashboard/reports/closing", label: "Closing Report", icon: <ShoppingCart size={18} /> },
        { href: "/dashboard/latency-lab", label: "Latency Lab", icon: <TestTube size={18} /> },
      ],
    },
    {
      title: "Management",
      links: [
        { href: "/dashboard/permissions", label: "Permissions", icon: <Building2 size={18} /> },
        { href: "/dashboard/audit", label: "Audit", icon: <LayoutDashboard size={18} /> },
        { href: "/dashboard/diagnostics", label: "Diagnostics", icon: <Monitor size={18} /> },
        { href: "/dashboard/settings", label: "Settings", icon: <Settings size={18} /> },
      ],
    },
  ],
  // PWA and voice experiences that are intentionally excluded from nav
  hidden: [
    { name: "Kiosk", href: "/kiosk" },
    { name: "Voice Test", href: "/voice-test" },
    { name: "Voice Status", href: "/voice-status" },
    { name: "Embed Runner", href: "/embed/runner" },
  ],
} as const;

const navigationItems = ROUTE_MAP.topNav;

// Routes that should not have navigation (PWA/agent interfaces)
const excludedRoutes = ['/kiosk', '/embed', '/w/'];

export default function Navigation() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSession = document.cookie.includes('session_user=');
      setIsLoggedIn(hasSession);
    }
  }, [pathname]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-user-menu]')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUserMenu]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsLoggedIn(false);
      setShowUserMenu(false);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect even if API fails
      setIsLoggedIn(false);
      router.push('/');
    }
  };

  // Check if current route should exclude navigation
  const shouldHideNavigation = excludedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Don't render navigation for PWA/agent routes
  if (shouldHideNavigation) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Main Navigation Bar */}
      <nav className="relative z-50 p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="glass-panel p-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between">
              {/* Logo & Brand */}
              <div className="flex items-center space-x-3">
                <motion.div 
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="w-10 h-10 rounded-neuro bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500 shadow-neuro flex items-center justify-center animate-pulse-glow">
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <div className="absolute inset-0 rounded-neuro bg-gradient-to-br from-white/20 to-transparent" />
                </motion.div>
                <div>
                  <Link href="/" className="font-bold text-xl lg:text-2xl text-gradient hover:opacity-80 transition-opacity">
                    VenueVoice
                  </Link>
                  <div className="text-xs text-white/60 hidden sm:block">Multi-tenant Voice Agent Platform</div>
                </div>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-6">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        relative group flex items-center space-x-2 px-4 py-2 rounded-neuro transition-all duration-300
                        ${active 
                          ? 'bg-white/10 text-white shadow-neuro-inset' 
                          : 'hover:bg-white/5 text-white/70 hover:text-white'
                        }
                      `}
                    >
                      <Icon size={16} />
                      <span className="text-sm font-medium">{item.name}</span>
                      {active && (
                        <motion.div
                          className="absolute bottom-0 left-1/2 w-1 h-1 bg-emerald-400 rounded-full"
                          layoutId="activeIndicator"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      
                      {/* Tooltip */}
                      <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        <div className="glass-panel px-2 py-1">
                          <div className="text-xs text-white/80 whitespace-nowrap">{item.description}</div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Auth Button & Theme Toggle */}
              <div className="flex items-center space-x-3">
                {/* Login/User Dropdown */}
                {isLoggedIn ? (
                  <div className="hidden lg:block relative" data-user-menu>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-neuro bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-300 transition-all duration-200"
                    >
                      <User size={16} />
                      <span className="text-sm font-medium">Account</span>
                      <ChevronDown size={14} className={`transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-48 glass-panel p-2 z-50"
                      >
                        <Link
                          href="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-white transition-all duration-200"
                        >
                          <LayoutDashboard size={16} />
                          <span className="text-sm">Dashboard</span>
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/80 hover:text-white transition-all duration-200"
                        >
                          <Settings size={16} />
                          <span className="text-sm">Settings</span>
                        </Link>
                        <div className="border-t border-white/10 my-1" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-white/70 hover:text-red-300 transition-all duration-200"
                        >
                          <LogOut size={16} />
                          <span className="text-sm">Sign Out</span>
                        </button>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      href="/login"
                      className="hidden lg:flex items-center space-x-2 px-6 py-2.5 rounded-neuro bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-emerald-500/20 hover:from-blue-500/30 hover:via-cyan-500/30 hover:to-emerald-500/30 border border-blue-400/40 hover:border-cyan-400/60 text-blue-200 hover:text-white transition-all duration-300 shadow-neuro-glow group"
                    >
                      <LogIn size={16} className="group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-sm font-semibold">Sign In</span>
                      <div className="absolute inset-0 rounded-neuro bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>
                  </motion.div>
                )}

                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-neuro bg-white/5 hover:bg-white/10 transition-colors"
                  title="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Sparkles size={16} className="text-yellow-400" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Sparkles size={16} className="text-blue-400" />
                    </motion.div>
                  )}
                </button>

                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 rounded-neuro bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <motion.div
            className="absolute top-20 left-4 right-4 glass-panel p-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-3">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center space-x-3 p-3 rounded-neuro transition-all duration-300
                      ${active 
                        ? 'bg-white/10 text-white shadow-neuro-inset' 
                        : 'hover:bg-white/5 text-white/70 hover:text-white'
                      }
                    `}
                  >
                    <Icon size={20} />
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-white/60">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
              
              {/* Mobile Auth Section */}
              <div className="border-t border-white/10 pt-3 space-y-2">
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-3 p-3 rounded-neuro bg-emerald-500/20 border border-emerald-400/30 text-emerald-300"
                    >
                      <User size={20} />
                      <div>
                        <div className="font-medium">Dashboard</div>
                        <div className="text-xs text-emerald-400/60">Go to workspace</div>
                      </div>
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-3 p-3 rounded-neuro hover:bg-white/5 text-white/70 hover:text-white transition-all"
                    >
                      <Settings size={20} />
                      <div>
                        <div className="font-medium">Settings</div>
                        <div className="text-xs text-white/50">Restaurant config</div>
                      </div>
                    </Link>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center space-x-3 p-3 rounded-neuro hover:bg-red-500/10 text-white/70 hover:text-red-300 transition-all"
                    >
                      <LogOut size={20} />
                      <div>
                        <div className="font-medium">Sign Out</div>
                        <div className="text-xs text-red-400/50">Leave workspace</div>
                      </div>
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 p-4 rounded-neuro bg-gradient-to-r from-blue-500/25 via-cyan-500/20 to-emerald-500/25 border border-blue-400/50 text-blue-200 hover:text-white hover:border-cyan-400/70 transition-all duration-300 shadow-neuro group"
                  >
                    <div className="relative">
                      <LogIn size={20} className="group-hover:scale-110 transition-transform duration-200" />
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 to-blue-400/30 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div>
                      <div className="font-semibold">Sign In</div>
                      <div className="text-xs text-cyan-300/70">Access your workspace</div>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Persistent back/forward controls */}
      {!shouldHideNavigation && (
        <div className="fixed bottom-6 left-6 z-40 flex gap-2">
          <motion.button
            onClick={() => window.history.back()}
            className="glass-panel p-3 rounded-full hover:bg-white/5 transition-colors group"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Go back"
          >
            <ArrowLeft size={20} className="text-white/70 group-hover:text-white transition-colors" />
          </motion.button>
          <motion.button
            onClick={() => window.history.forward()}
            className="glass-panel p-3 rounded-full hover:bg-white/5 transition-colors group"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Go forward"
          >
            <ArrowLeft size={20} className="rotate-180 text-white/70 group-hover:text-white transition-colors" />
          </motion.button>
        </div>
      )}
    </>
  );
}
