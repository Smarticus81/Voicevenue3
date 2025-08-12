"use client";
import { useEffect } from "react";
import dynamic from "next/dynamic";

// Load the command palette only on the client
const CommandPalette = dynamic(() => import("@/components/shell/CommandPalette"), {
  ssr: false,
});

export default function ClientGlobals() {
  // Service worker registration (route-served SW)
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const onLoad = async () => {
        try {
          await navigator.serviceWorker.register("/api/pwa/sw");
        } catch {}
      };
      window.addEventListener("load", onLoad);
      return () => window.removeEventListener("load", onLoad);
    }
  }, []);

  // Auto-recover from Next.js chunk load errors by clearing caches and reloading
  useEffect(() => {
    const isChunkError = (err: unknown) => {
      const msg = typeof err === "string" ? err : (err as any)?.message || (err as any)?.toString?.() || "";
      return /ChunkLoadError|Loading chunk \d+ failed|Failed to fetch dynamically imported module|Importing a module script failed/i.test(
        String(msg)
      );
    };

    const recover = async () => {
      try {
        if ("serviceWorker" in navigator) {
          try {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
          } catch {}
        }
        if ("caches" in window) {
          try {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k).catch(() => {})));
          } catch {}
        }
      } finally {
        // Full reload to pick up the new build/chunks
        window.location.reload();
      }
    };

    const onError = (e: ErrorEvent) => {
      if (isChunkError(e.error || e.message)) {
        recover();
      }
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      if (isChunkError(e.reason)) {
        recover();
      }
    };

    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError, true);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return (
    <>
      <CommandPalette />
      {/* portal root for cmdk, if you’re using portals */}
      <div id="cmdk-root" />
    </>
  );
}



