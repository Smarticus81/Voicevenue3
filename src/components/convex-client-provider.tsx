"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // TODO: Set up Clerk JWT authentication with Convex
  // For now, we're using userId parameters directly in mutations/queries
  
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
