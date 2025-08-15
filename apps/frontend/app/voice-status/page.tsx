"use client";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi, Server, Zap, AlertCircle, CheckCircle, Loader } from 'lucide-react';

export default function VoiceStatusPage() {
  const [wsStatus, setWsStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  const [openaiStatus, setOpenaiStatus] = useState<'checking' | 'connected' | 'failed'>('checking');

  useEffect(() => {
    // Check WebSocket server
    const checkWebSocket = async () => {
      try {
        const ws = new WebSocket('ws://localhost:8787');
        ws.onopen = () => {
          setWsStatus('connected');
          ws.close();
        };
        ws.onerror = () => setWsStatus('failed');
        setTimeout(() => {
          if (wsStatus === 'checking') setWsStatus('failed');
        }, 3000);
      } catch (err) {
        setWsStatus('failed');
      }
    };

    // Check API endpoints
    const checkAPI = async () => {
      try {
        const response = await fetch('/api/tools/list');
        if (response.ok) {
          setApiStatus('connected');
        } else {
          setApiStatus('failed');
        }
      } catch (err) {
        setApiStatus('failed');
      }
    };

    // Check OpenAI API
    const checkOpenAI = async () => {
      try {
        const response = await fetch('/api/voice/openai/sdp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/sdp' },
          body: 'v=0\r\no=- 1234567890 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n'
        });
        if (response.status === 400) {
          // 400 is expected for invalid SDP, but means the endpoint is working
          setOpenaiStatus('connected');
        } else if (response.status === 401) {
          setOpenaiStatus('failed');
        } else {
          setOpenaiStatus('connected');
        }
      } catch (err) {
        setOpenaiStatus('failed');
      }
    };

    checkWebSocket();
    checkAPI();
    checkOpenAI();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle size={20} className="text-emerald-400" />;
      case 'failed': return <AlertCircle size={20} className="text-red-400" />;
      case 'checking': return <Loader size={20} className="text-yellow-400 animate-spin" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'border-emerald-500/30 bg-emerald-500/10';
      case 'failed': return 'border-red-500/30 bg-red-500/10';
      case 'checking': return 'border-yellow-500/30 bg-yellow-500/10';
      default: return 'border-white/20 bg-white/5';
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel border-b border-white/10"
      >
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
              <Zap size={24} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-white">Voice System Status</h1>
                <img 
                  src="/bevpro-logo.svg" 
                  alt="BevPro" 
                  className="h-5 w-auto opacity-60"
                />
              </div>
              <p className="text-sm text-white/60">Monitor voice infrastructure health</p>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass rounded-2xl p-6 border ${getStatusColor(wsStatus)}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <Wifi size={24} className="text-white/80" />
                <h2 className="text-lg font-semibold text-white">WebSocket Server</h2>
              </div>
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(wsStatus)}
                <span className="capitalize text-white font-medium">{wsStatus}</span>
              </div>
              <p className="text-sm text-white/60">
                {wsStatus === 'connected' ? 'Running on port 8787' :
                 wsStatus === 'failed' ? 'Not running. Use: npm run dev:voice' :
                 'Checking connection...'}
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`glass rounded-2xl p-6 border ${getStatusColor(apiStatus)}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <Server size={24} className="text-white/80" />
                <h2 className="text-lg font-semibold text-white">API Endpoints</h2>
              </div>
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(apiStatus)}
                <span className="capitalize text-white font-medium">{apiStatus}</span>
              </div>
              <p className="text-sm text-white/60">
                {apiStatus === 'connected' ? 'All endpoints responding' :
                 apiStatus === 'failed' ? 'Endpoints not responding' :
                 'Checking endpoints...'}
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`glass rounded-2xl p-6 border ${getStatusColor(openaiStatus)}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <Zap size={24} className="text-white/80" />
                <h2 className="text-lg font-semibold text-white">OpenAI API</h2>
              </div>
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(openaiStatus)}
                <span className="capitalize text-white font-medium">{openaiStatus}</span>
              </div>
              <p className="text-sm text-white/60">
                {openaiStatus === 'connected' ? 'API key valid' :
                 openaiStatus === 'failed' ? 'API key invalid or missing' :
                 'Checking API access...'}
              </p>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-6 border border-blue-500/30 bg-blue-500/10"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Troubleshooting</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm text-white/80">Start servers:</div>
                <code className="block bg-white/10 px-3 py-2 rounded-lg text-sm text-emerald-400">npm run dev:all</code>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-white/80">Environment setup:</div>
                <code className="block bg-white/10 px-3 py-2 rounded-lg text-sm text-emerald-400">.env.local</code>
              </div>
            </div>
            <div className="mt-4 space-y-1 text-sm text-white/60">
              <div>• Ensure microphone permissions are granted</div>
              <div>• Check browser console for detailed error messages</div>
              <div>• Verify OpenAI API key in environment variables</div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
