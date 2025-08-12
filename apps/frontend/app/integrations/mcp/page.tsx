"use client";
import { useState, useEffect } from 'react';

const PROVIDERS = [
  { id: 'supabase', name: 'Supabase MCP' },
  { id: 'direct', name: 'Direct (In-App)' },
  { id: 'generic', name: 'Generic MCP' },
];

export default function MCPWizardPage() {
  const [provider, setProvider] = useState('supabase');
  const [serverUrl, setServerUrl] = useState('');
  const [token, setToken] = useState('');
  const [tools, setTools] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  async function loadCurrentConfig() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/mcp/config');
      if (res.ok) {
        const config = await res.json();
        if (config) {
          setProvider(config.provider || 'supabase');
          setServerUrl(config.serverUrl || '');
          setToken(config.token || '');
          setTools(config.enabledTools || []);
          setStatus('Loaded saved configuration');
        }
      }
    } catch (error) {
      console.warn('Failed to load current config:', error);
      setStatus('Using default configuration');
    }
    setIsLoading(false);
  }

  async function testConnection() {
    setStatus('Testing...');
    const res = await fetch('/api/mcp/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, serverUrl, token }),
    });
    const json = await res.json();
    if (json.ok && Array.isArray(json.tools)) {
      setTools(json.tools);
      setStatus('OK');
    } else {
      setStatus(json.error || 'Failed');
    }
  }

  async function saveConfig() {
    setStatus('Saving...');
    const enabledTools = tools; // MVP: enable all listed tools
    const res = await fetch('/api/mcp/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, enabledTools, serverUrl, token }),
    });
    const json = await res.json();
    setStatus(json.ok ? 'Saved' : json.error || 'Save failed');
  }

  if (isLoading) {
    return (
      <main className="p-6 max-w-3xl mx-auto">
        <div className="text-center">Loading configuration...</div>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">MCP Connector</h1>
      <section className="space-y-3">
        <label className="block text-sm font-medium">Provider</label>
        <select
          className="border rounded p-2"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
        >
          {PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {provider === 'supabase' && (
          <p className="text-sm text-gray-600">Uses Supabase database with direct MCP connection. Auto-configured from environment.</p>
        )}
        {provider === 'direct' && (
          <p className="text-sm text-gray-600">Uses embedded MCPDirect. No credentials needed.</p>
        )}
        {provider !== 'direct' && provider !== 'supabase' && (
          <div className="space-y-2">
            <input className="border rounded p-2 w-full" placeholder="Server URL" value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} />
            <input className="border rounded p-2 w-full" placeholder="Token" value={token} onChange={(e) => setToken(e.target.value)} />
          </div>
        )}
        {provider === 'supabase' && (
          <div className="space-y-2">
            <input 
              className="border rounded p-2 w-full" 
              placeholder="Supabase URL" 
              value={serverUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || ''} 
              onChange={(e) => setServerUrl(e.target.value)}
              disabled={!!process.env.NEXT_PUBLIC_SUPABASE_URL}
            />
            <input 
              className="border rounded p-2 w-full" 
              placeholder="Supabase Anon Key" 
              value={token || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''} 
              onChange={(e) => setToken(e.target.value)}
              disabled={!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}
            />
          </div>
        )}
        <button className="border rounded px-3 py-2" onClick={testConnection}>Test Connection</button>
      </section>

      {tools.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-medium">Tools</h2>
          <ul className="list-disc pl-6 text-sm">
            {tools.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <button className="bg-black text-white rounded px-3 py-2" onClick={saveConfig}>Save</button>
        </section>
      )}

      {status && <p className="text-sm text-gray-600">{status}</p>}
    </main>
  );
}

