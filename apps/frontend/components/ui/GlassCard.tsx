"use client";
import clsx from "clsx";
import React from "react";

export default function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("glass rounded-3xl border p-6", className)}>
      {children}
    </div>
  );
}


