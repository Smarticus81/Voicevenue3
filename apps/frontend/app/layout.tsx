import './globals.css';
import type { Metadata, Viewport } from 'next';
import ClientGlobals from '@/components/ClientGlobals';
import { ThemeProvider } from '@/components/ThemeProvider';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'VenueVoice',
  description: 'Premium voice-enabled POS & inventory management platform',
  keywords: ['POS', 'inventory', 'voice', 'AI', 'restaurant', 'bar', 'management'],
  authors: [{ name: 'VenueVoice' }],
  robots: 'index, follow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#10b981',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        <link rel="manifest" href="/api/pwa/manifest" />
        <meta name="theme-color" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body className="min-h-full antialiased font-sans transition-all duration-500 overflow-x-hidden" 
            style={{ 
              background: 'var(--bg-primary)', 
              color: 'var(--text-primary)',
            }}>
        <ThemeProvider>
          {/* Neumorphic Background Environment */}
          <div className="pointer-events-none fixed inset-0 -z-20">
            {/* Base gradient background */}
            <div className="absolute inset-0 bg-gradient-neuro" />
            
            {/* Accent gradients */}
            <div className="absolute inset-0" 
                 style={{ 
                   backgroundImage: 'var(--gradient-primary), var(--gradient-secondary)' 
                 }} />
            
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-[0.03]" 
                 style={{
                   backgroundImage: `
                     linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                     linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
                   `, 
                   backgroundSize: '60px 60px',
                   maskImage: 'radial-gradient(ellipse at center, black, transparent 80%)'
                 }} />
                 
            {/* Floating ambient shapes */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 blur-3xl animate-float" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gradient-to-r from-violet-500/8 to-pink-500/8 blur-3xl animate-float-delayed" />
            <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full bg-gradient-to-r from-blue-500/6 to-indigo-500/6 blur-2xl animate-pulse-soft" />
          </div>
          
          {/* Glass overlay for depth */}
          <div className="pointer-events-none fixed inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-black/[0.02]" />
          </div>
          
          {/* Main content container with enhanced depth */}
          <div className="relative min-h-screen backdrop-blur-[0.5px]">
            <Navigation />
            <main className="fade-in">
              {children}
            </main>
          </div>
          
          <ClientGlobals />
        </ThemeProvider>
      </body>
    </html>
  );
}

