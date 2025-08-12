"use client";
import { ReactNode, useEffect, useState } from "react";
import OfflineBanner from "@/components/net/OfflineBanner";
import { useRouter } from "next/navigation";

export default function KioskShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [canBack, setCanBack] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") setCanBack(window.history.length > 1);
  }, []);
  return (
    <div className="min-h-screen text-white">
      <OfflineBanner />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {canBack && (
              <button
                aria-label="Go back"
                onClick={() => router.back()}
                className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white/80"
                title="Back"
              >
                ←
              </button>
            )}
            <div className="text-2xl font-semibold tracking-tight">Bev Kiosk</div>
          </div>
          <div className="text-xs text-white/70 bg-white/10 px-3 py-1 rounded-full">bar assistant</div>
        </header>
        <div className="panel p-6">
          {children}
        </div>
      </div>
    </div>
  );
}


