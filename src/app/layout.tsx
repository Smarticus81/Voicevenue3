import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/convex-client-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BevPro - Voice Agent Platform",
  description: "Professional voice agents for venue management and bar operations",
  manifest: "/manifest.json",
  themeColor: "#10a37f",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BevPro Voice Agent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/bevpro-logo.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta name="application-name" content="BevPro Voice Agent" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="BevPro" />
          <meta name="description" content="Professional voice agents for venue management and bar operations" />
          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="msapplication-config" content="/browserconfig.xml" />
          <meta name="msapplication-TileColor" content="#10a37f" />
          <meta name="msapplication-tap-highlight" content="no" />
          
          <link rel="apple-touch-icon" href="/icon-192.png" />
          <link rel="icon" type="image/svg+xml" href="/bevpro-logo.svg" />
          <link rel="icon" type="image/png" sizes="32x32" href="/icon-192.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/icon-192.png" />
          <link rel="manifest" href="/manifest.json" />
          <link rel="mask-icon" href="/bevpro-logo.svg" color="#10a37f" />
          <link rel="shortcut icon" href="/bevpro-logo.svg" />
        </head>
        <body className={inter.className}>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}