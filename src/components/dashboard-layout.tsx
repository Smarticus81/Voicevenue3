"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import PWAInstallPrompt from "./pwa-install-prompt";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Agent Designer", href: "/dashboard/agent-designer" },
    { name: "Deploy", href: "/dashboard/deploy" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center">
              <Image
                src="/bevpro-logo.svg"
                alt="BevPro"
                width={120}
                height={20}
                className="h-5 w-auto"
              />
            </Link>
            <nav className="flex gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm px-3 py-2 rounded-lg transition-all duration-200 ${
                    pathname === item.href
                      ? "bg-[#10a37f] text-white shadow-md"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">{children}</main>
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}