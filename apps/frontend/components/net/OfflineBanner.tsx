"use client";
import { useEffect, useState } from "react";
import { useOnline } from "./useOnline";

export default function OfflineBanner() {
  // Avoid hydration mismatch by rendering nothing until mounted
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const online = useOnline();
  if (!mounted || online) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-[999] bg-red-600 text-white text-center py-1 text-sm" suppressHydrationWarning>
      Offline — voice disabled until connection returns
    </div>
  );
}


