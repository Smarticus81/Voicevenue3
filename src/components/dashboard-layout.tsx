"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState, useEffect } from "react";
import { PWAInstallPrompt } from "./pwa-install-prompt";
import { BevproStudioLogoInline } from "@/components/bevpro-studio-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "Agent Designer", href: "/dashboard/agent-designer" },
    { name: "Deploy", href: "/dashboard/deploy" },
    { name: "Integrations", href: "/dashboard/integrations" },
    { name: "Usage", href: "/dashboard/usage" },
    { name: "Plans", href: "/dashboard/plans" },
  ];

  return (
    <div className="min-h-screen tech-bg transition-colors duration-300 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <header className="border-b border-white/10 glass-dark backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <BevproStudioLogoInline />
            </Link>
            <nav className="flex gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    pathname === item.href
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white dark:text-white shadow-lg"
                      : "text-gray-300 dark:text-gray-300 hover:text-white dark:hover:text-white hover:bg-white/10"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8 relative z-10">{children}</main>
      
      {/* PWA Install Prompt */}
      {isClient && <PWAInstallPrompt />}
    </div>
  );
}