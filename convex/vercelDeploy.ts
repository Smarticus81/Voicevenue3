import { action } from "./_generated/server";
import { v } from "convex/values";

export const createVercelDeployment = action({
  args: {
    agentId: v.string(),
    agentConfig: v.any(),
    deploymentType: v.union(v.literal("pwa"), v.literal("web"), v.literal("api")),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get Vercel configuration from environment
      const vercelToken = process.env.VERCEL_TOKEN || 'xrxbdO6hishHfvuh2tuiA4vt';
      const vercelTeamId = process.env.VERCEL_TEAM_ID || 'team_DimQqb1lcQvEO7ENLxSmrOan';
      const vercelProjectId = process.env.VERCEL_PROJECT_ID || 'agenticbride';
      
      if (!vercelToken) {
        throw new Error('VERCEL_TOKEN environment variable is required');
      }

      // Generate deployment configuration
      const deploymentId = `bevpro-agent-${args.agentId}-${Date.now()}`;
      const deploymentUrl = `https://${deploymentId}.vercel.app`;
      
                    // Create deployment payload for BPStudio account - with required projectSettings
       const deploymentPayload = {
         name: deploymentId,
         projectSettings: {
           framework: "nextjs",
           devCommand: "next dev",
           buildCommand: "next build",
           installCommand: "npm install",
           outputDirectory: ".next"
         },
         files: [
          {
            file: 'package.json',
                         data: JSON.stringify({
               name: deploymentId,
               version: '1.0.0',
               private: true,
               engines: {
                 node: '>=18.0.0'
               },
              scripts: {
                dev: 'next dev',
                build: 'next build',
                start: 'next start',
                lint: 'next lint'
              },
                             dependencies: {
                 next: '14.2.25',
                 react: '18.3.1',
                 'react-dom': '18.3.1',
                 '@clerk/nextjs': '^4.31.8',
                 'convex': '^1.25.4',
                 'openai': '^4.20.1',
                 'tailwindcss': '3.3.0',
                 'framer-motion': '^10.18.0',
                 'lucide-react': '^0.294.0',
                 'autoprefixer': '10.4.14',
                 'postcss': '8.4.27'
               },
                             devDependencies: {
                 typescript: '^5.0.0',
                 '@types/node': '^20.0.0',
                 '@types/react': '^18.0.0',
                 '@types/react-dom': '^18.0.0'
               }
            })
          },
          {
            file: 'next.config.js',
            data: `/** @type {import('next').NextConfig} */
 const nextConfig = {
  env: {
    AGENT_CONFIG: '${JSON.stringify(args.agentConfig).replace(/'/g, "\\'")}',
    AGENT_ID: '${args.agentId}',
    NEXT_PUBLIC_APP_URL: '${deploymentUrl}'
  },
  headers: async () => {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig`
          },
          {
            file: 'app/layout.tsx',
            data: `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '${args.agentConfig.name} - Voice Agent',
  description: '${args.agentConfig.description}',
  manifest: '/manifest.json',
  themeColor: '${args.agentConfig.customization?.primaryColor || '#10a37f'}',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '${args.agentConfig.name}',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="${args.agentConfig.name}" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="${args.agentConfig.name}" />
        <meta name="description" content="${args.agentConfig.description}" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="${args.agentConfig.customization?.primaryColor || '#10a37f'}" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/icon-192.png" />
        
        <script
          dangerouslySetInnerHTML={{
            __html: \`
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            \`,
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}`
          },
          {
            file: 'app/page.tsx',
            data: `'use client';

import { useState, useEffect } from 'react';
import { Mic, Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function AgentPage() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  
  const agentConfig = JSON.parse(process.env.AGENT_CONFIG || '{}');
  const agentId = process.env.AGENT_ID;

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  const toggleVoice = () => {
    setIsListening(!isListening);
    // Voice implementation would go here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                style={{ background: \`linear-gradient(135deg, \${agentConfig.customization?.primaryColor || '#10a37f'}, \${agentConfig.customization?.secondaryColor || '#059669'})\` }}
              >
                {agentConfig.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {agentConfig.name || 'Voice Agent'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {agentConfig.type} Voice Agent
                </p>
              </div>
            </div>
            
            <button
              onClick={toggleVoice}
              className={\`relative p-4 rounded-full transition-all duration-300 \${isListening ? 'bg-red-500 animate-pulse' : 'text-white hover:opacity-90'}\`}
              style={{ 
                background: isListening ? undefined : \`linear-gradient(135deg, \${agentConfig.customization?.primaryColor || '#10a37f'}, \${agentConfig.customization?.secondaryColor || '#059669'})\` 
              }}
            >
              <Mic className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {isListening && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse"></div>
              <p className="text-blue-800 dark:text-blue-200 font-medium">
                Say "{agentConfig.voiceConfig?.wakeWords?.[0] || 'Hey Assistant'}" to activate
              </p>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            About {agentConfig.name || 'Your Agent'}
          </h3>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">{agentConfig.type}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Description:</span>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {agentConfig.description || 'A professional voice assistant for managing your business operations.'}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Voice:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400 capitalize">{agentConfig.voiceConfig?.voice}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Wake Words:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {agentConfig.voiceConfig?.wakeWords?.join(', ')}
              </span>
            </div>
          </div>
        </div>

        {/* PWA Install Prompt */}
        {showPrompt && !isInstalled && (
          <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <Download className="w-5 h-5 text-white" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Install {agentConfig.name || 'Voice Agent'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Add to your home screen for the best experience
                  </p>
                  
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={handleInstallClick}
                      className="flex-1 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-medium rounded-lg hover:shadow-lg transition-all duration-200"
                    >
                      Install
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="px-3 py-1.5 text-slate-600 dark:text-slate-400 text-xs font-medium hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Later
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}`
          },
          {
            file: 'app/globals.css',
            data: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}`
          },
          {
            file: 'tailwind.config.js',
            data: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}`
          },
          {
            file: 'tsconfig.json',
            data: `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`
          },
          
          {
            file: 'public/manifest.json',
            data: JSON.stringify({
              name: args.agentConfig.name || 'Voice Agent',
              short_name: args.agentConfig.name || 'Agent',
              description: args.agentConfig.description || 'Voice Assistant',
              start_url: '/',
              display: 'standalone',
              background_color: '#ffffff',
              theme_color: args.agentConfig.customization?.primaryColor || '#10a37f',
              orientation: 'portrait-primary',
              scope: '/',
              lang: 'en-US',
              categories: ['business', 'productivity', 'utilities'],
              icons: [
                {
                  src: '/icon-192.png',
                  sizes: '192x192',
                  type: 'image/png',
                  purpose: 'any maskable'
                },
                {
                  src: '/icon-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'any maskable'
                }
              ],
              shortcuts: [
                {
                  name: 'Voice Control',
                  short_name: 'Voice',
                  description: 'Activate voice assistant',
                  url: '/',
                  icons: [
                    {
                      src: '/icon-192.png',
                      sizes: '96x96'
                    }
                  ]
                }
              ]
            })
          },
          {
            file: 'public/sw.js',
            data: `const CACHE_NAME = '${deploymentId}-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});`
          },
          {
            file: 'public/icon-192.png',
            data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF0WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78i iglkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4yLWMwMDAgNzkuMWI2NWE3OWI0LCAyMDIyLzA2LzEzLTIyOjAxOjAxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpypmY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjQuMCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjQtMDEtMjBUMTU6NDc6NDErMDE6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjQtMDEtMjBUMTU6NDc6NDErMDE6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDI0LTAxLTIwVDE1OjQ3OjQxKzAxOjAwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjY5ZDM4YmM1LTM4ZTAtNDI0Ny1hMzBkLTNmOWNhMzM5NzM0YyIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjIyYzFkOTZiLTRjMGItYzQ0Ny1iMzE1LTJmOWNhMzM5NzM0YyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjY5ZDM4YmM1LTM4ZTAtNDI0Ny1hMzBkLTNmOWNhMzM5NzM0YyIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjY5ZDM4YmM1LTM4ZTAtNDI0Ny1hMzBkLTNmOWNhMzM5NzM0YyIgc3RFdnQ6d2hlbj0iMjAyNC0wMS0yMFQxNTo0Nzo0MSswMTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI0LjAgKE1hY2ludG9zaCkiLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+'
          },
          {
            file: 'public/icon-512.png',
            data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIAAQMAAADOtka5AAAACXBIWXMAAAsTAAALEwEAmpwYAAAF0WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78i iglkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4yLWMwMDAgNzkuMWI2NWE3OWI0LCAyMDIyLzA2LzEzLTIyOjAxOjAxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpypmY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjQuMCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjQtMDEtMjBUMTU6NDc6NDErMDE6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjQtMDEtMjBUMTU6NDc6NDErMDE6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDI0LTAxLTIwVDE1OjQ3OjQxKzAxOjAwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjY5ZDM4YmM1LTM4ZTAtNDI0Ny1hMzBkLTNmOWNhMzM5NzM0YyIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjIyYzFkOTZiLTRjMGItYzQ0Ny1iMzE1LTJmOWNhMzM5NzM0YyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjY5ZDM4YmM1LTM4ZTAtNDI0Ny1hMzBkLTNmOWNhMzM5NzM0YyIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjY5ZDM4YmM1LTM4ZTAtNDI0Ny1hMzBkLTNmOWNhMzM5NzM0YyIgc3RFdnQ6d2hlbj0iMjAyNC0wMS0yMFQxNTo0Nzo0MSswMTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI0LjAgKE1hY2ludG9zaCkiLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+'
          }
        ]
      };

             // Make actual Vercel API call to create deployment
       console.log('Deploying to BPStudio Vercel account:', {
         deploymentId,
         deploymentUrl,
         teamId: vercelTeamId,
         agentConfig: args.agentConfig
       });

       console.log('Deployment payload:', JSON.stringify(deploymentPayload, null, 2));

       // Use the correct API endpoint for creating deployments
       const response = await fetch(`https://api.vercel.com/v13/deployments?teamId=${vercelTeamId}`, {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${vercelToken}`,
           'Content-Type': 'application/json',
         },
         body: JSON.stringify(deploymentPayload)
       });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Vercel API error:', errorData);
        throw new Error(`Vercel API error: ${response.status} ${response.statusText}`);
      }

      const deploymentData = await response.json();
      
      return {
        success: true,
        deploymentId: deploymentData.id || deploymentId,
        deploymentUrl: deploymentData.url || deploymentUrl,
        claimLink: `https://vercel.com/claim/${deploymentData.id || deploymentId}`,
        agentId: args.agentId,
        status: 'deployed',
        timestamp: new Date().toISOString(),
        teamId: vercelTeamId,
        account: 'BPStudio'
      };

    } catch (error) {
      console.error("Vercel deployment failed:", error);
      throw new Error(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
