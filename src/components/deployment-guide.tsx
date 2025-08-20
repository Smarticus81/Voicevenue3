"use client";

import { useState } from 'react';
import { Copy, ExternalLink, Smartphone, Globe, Code } from 'lucide-react';

interface DeploymentGuideProps {
  agentId: string;
  agentName: string;
}

export function DeploymentGuide({ agentId, agentName }: DeploymentGuideProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const pwaUrl = `${window.location.origin}/agent/${agentId}`;
  const embedCode = `<script src="${window.location.origin}/embed.js?agent=${agentId}"></script>`;

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Deploy {agentName}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Choose how you want to deploy your voice agent
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* PWA Deployment */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">PWA App</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Your agent as a Progressive Web App - add to home screen for native experience
          </p>
          <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg font-mono text-xs break-all mb-4">
            {pwaUrl}
          </div>
          <div className="space-y-2">
            <button
              onClick={() => handleCopy(pwaUrl, 'pwa')}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>{copied === 'pwa' ? 'Copied!' : 'Copy URL'}</span>
            </button>
            <a
              href={pwaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open PWA</span>
            </a>
          </div>
        </div>

        {/* Website Embed */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Website Embed</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Add this script to your website's HTML to enable voice interactions
          </p>
          <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg font-mono text-xs break-all mb-4">
            {embedCode}
          </div>
          <button
            onClick={() => handleCopy(embedCode, 'embed')}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Copy className="w-4 h-4" />
            <span>{copied === 'embed' ? 'Copied!' : 'Copy Embed Code'}</span>
          </button>
        </div>

        {/* Vercel Deployment */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Vercel App</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Deploy as a standalone Vercel application with custom domain
          </p>
          <button
            className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
          >
            Deploy to Vercel
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
            Coming soon
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Integration Instructions</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">PWA Instructions</h4>
            <ol className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>1. Open the PWA URL on your device</li>
              <li>2. Tap "Add to Home Screen" when prompted</li>
              <li>3. Your agent will appear as a native app</li>
              <li>4. Tap the app icon to launch your voice agent</li>
            </ol>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">Website Embed Instructions</h4>
            <ol className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>1. Copy the embed code above</li>
              <li>2. Paste it just before the closing &lt;/body&gt; tag</li>
              <li>3. The voice agent will appear as a floating button</li>
              <li>4. Users can click or say "Hey Assistant" to activate</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
