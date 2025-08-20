import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bevpro Studio - Where Your Event Venue Finds Its Voice",
  description: "Professional AI voice agents for event venues and event venue bars",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bevpro Studio",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/nexus-logo.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3B82F6",
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
          <meta name="application-name" content="Bevpro Studio" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Bevpro Studio" />
          <meta name="description" content="Professional AI voice agents for event venues and event venue bars" />
          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="msapplication-config" content="/browserconfig.xml" />
          <meta name="msapplication-TileColor" content="#3B82F6" />
          <meta name="msapplication-tap-highlight" content="no" />
          
          <link rel="apple-touch-icon" href="/icon-192.png" />
          <link rel="icon" type="image/svg+xml" href="/nexus-logo.svg" />
          <link rel="icon" type="image/png" sizes="32x32" href="/icon-192.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/icon-192.png" />
          <link rel="manifest" href="/manifest.json" />
          <link rel="mask-icon" href="/nexus-logo.svg" color="#3B82F6" />
          <link rel="shortcut icon" href="/nexus-logo.svg" />
        </head>
        <body className={inter.className}>
          <ConvexClientProvider>
            <ThemeProvider defaultTheme="system" storageKey="bevpro-studio-theme">
              <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                {children}
              </div>
            </ThemeProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}