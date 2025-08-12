"use client";
import { useEffect, useState } from 'react';

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

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Voice Application Status</h1>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">WebSocket Server (Deepgram)</h2>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              wsStatus === 'connected' ? 'bg-green-500' : 
              wsStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
            <span className="capitalize">{wsStatus}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {wsStatus === 'connected' ? 'WebSocket server is running on port 8787' :
             wsStatus === 'failed' ? 'WebSocket server is not running. Run: npm run dev:voice' :
             'Checking WebSocket connection...'}
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">API Endpoints</h2>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              apiStatus === 'connected' ? 'bg-green-500' : 
              apiStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
            <span className="capitalize">{apiStatus}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {apiStatus === 'connected' ? 'API endpoints are working' :
             apiStatus === 'failed' ? 'API endpoints are not responding' :
             'Checking API endpoints...'}
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">OpenAI API</h2>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              openaiStatus === 'connected' ? 'bg-green-500' : 
              openaiStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
            <span className="capitalize">{openaiStatus}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {openaiStatus === 'connected' ? 'OpenAI API is accessible' :
             openaiStatus === 'failed' ? 'OpenAI API key may be invalid or missing' :
             'Checking OpenAI API...'}
          </p>
        </div>

        <div className="border rounded-lg p-4 bg-blue-50">
          <h2 className="text-lg font-semibold mb-2">Troubleshooting</h2>
          <ul className="text-sm space-y-1">
            <li>• Make sure both servers are running: <code className="bg-gray-200 px-1 rounded">npm run dev:all</code></li>
            <li>• Check that environment variables are set in <code className="bg-gray-200 px-1 rounded">.env.local</code></li>
            <li>• Ensure microphone permissions are granted</li>
            <li>• Check browser console for detailed error messages</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
