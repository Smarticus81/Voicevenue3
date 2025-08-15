"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { logEvent } from "@/components/analytics/logEvent";
import { createClientTrace, ingestSpan } from "@/components/trace/traceClient";

export default function FlexibleRAGAgent({
  instructions: propInstructions,
  voice = "sage",
  venueId,
  agentId,
  onDataAction,
}: { 
  instructions?: string; 
  voice?: string; 
  venueId?: string; 
  agentId?: string;
  onDataAction?: (action: string, data: any) => void;
}) {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [error, setError] = useState("");
  const [partial, setPartial] = useState("");
  const [instructions] = useState<string>(propInstructions || getFlexibleRAGInstructions());
  const currentVenueId = venueId || "flexible-rag";
  const currentAgentId = agentId || "rag-agent";
  const [vendor, setVendor] = useState<any>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const traceRef = useRef(createClientTrace(currentVenueId, currentAgentId, "flexible-rag-session"));

  const isConnectingRef = useRef(false);

  function getFlexibleRAGInstructions(): string {
    return `You are an intelligent data assistant with flexible capabilities to work with various data sources.

Your capabilities:
- Analyze documents and files (PDF, Excel, Word, text files)
- Work with databases and spreadsheets
- Transform data between formats
- Generate reports and insights
- Search for information

How you work:
1. Understand the user's data task
2. Provide clear, actionable responses
3. Ask clarifying questions when needed
4. Be transparent about data sources and limitations

CRITICAL: When activated by wake word, immediately respond with "Yes, I'm ready to help with your data. What would you like me to work on?"`;
  }

  useEffect(() => {
    audioElRef.current = new Audio();
    if (audioElRef.current) {
      audioElRef.current.autoplay = true;
      audioElRef.current.crossOrigin = "anonymous";
      audioElRef.current.preload = "auto";
      audioElRef.current.setAttribute('playsinline', 'true');
      audioElRef.current.setAttribute('webkit-playsinline', 'true');
    }
  }, []);

  useEffect(() => {
    fetch(`/api/settings/vendor?venueId=${currentVenueId}`).then((r) => r.json()).then(setVendor).catch(() => {});
  }, [currentVenueId]);

  // Load custom instructions
  useEffect(() => {
    if (currentVenueId && currentAgentId) {
      fetch(`/api/rag/instructions?venueId=${currentVenueId}&agentId=${currentAgentId}`)
        .then(r => r.json())
        .then(data => {
          if (data.instructions) {
            console.log(`[FlexibleRAG] Loaded custom instructions: ${data.instructions.substring(0, 100)}...`);
            // Instructions will be used when starting the voice session
          }
        })
        .catch(err => console.log('[FlexibleRAG] No custom instructions found'));
    }
  }, [currentVenueId, currentAgentId]);

  const start = useCallback(async () => {
    if (isConnectingRef.current || status === "connected") return;
    
    try {
      isConnectingRef.current = true;
      setStatus("connecting");
      setError("");

      const span = ingestSpan(traceRef.current, "flexible-rag-session-start", {
        venueId: currentVenueId,
        agentId: currentAgentId,
        voice: vendor?.realtimeVoice || voice,
        model: vendor?.realtimeModel || "gpt-4o-realtime-preview-2024-12-17"
      });

      // Load custom instructions and documents
      let finalInstructions = instructions;
      try {
        const [instructionsResponse, documentsResponse] = await Promise.all([
          fetch(`/api/rag/instructions?venueId=${currentVenueId}&agentId=${currentAgentId}`),
          fetch(`/api/rag/list-documents?venueId=${currentVenueId}&agentId=${currentAgentId}`)
        ]);

        if (instructionsResponse.ok) {
          const instructionsData = await instructionsResponse.json();
          if (instructionsData.instructions) {
            finalInstructions = instructionsData.instructions;
            console.log('[FlexibleRAG] Using custom instructions');
          }
        }

        if (documentsResponse.ok) {
          const documentsData = await documentsResponse.json();
          const documents = documentsData.documents || [];
          if (documents.length > 0) {
            finalInstructions += `\n\nAvailable Documents:\n${documents.map((doc: any) => `- ${doc.filename}`).join('\n')}\n\nYou can reference these documents when answering questions. If a user asks about content in these documents, let them know you can help analyze them.`;
            console.log(`[FlexibleRAG] Found ${documents.length} uploaded documents`);
          }
        }
      } catch (err) {
        console.log('[FlexibleRAG] Using default instructions due to load error:', err);
      }

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      pc.ontrack = (event) => {
        console.log('[FlexibleRAG] Audio track received');
        if (audioElRef.current) {
          audioElRef.current.srcObject = event.streams[0];
        }
      };

      pc.ondatachannel = (event) => {
        const dc = event.channel;
        dcRef.current = dc;
        console.log('[FlexibleRAG] Data channel established');
        
        dc.onmessage = async (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('[FlexibleRAG] Received message:', message);
            
            if (message.type === "response.audio_transcript.delta") {
              setPartial(message.delta || "");
            } else if (message.type === "response.audio_transcript.done") {
              setPartial("");
            }
          } catch (error) {
            console.error("[FlexibleRAG] DataChannel message error:", error);
          }
        };
      };

      // Get user media first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Create local offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdp = pc.localDescription?.sdp;
      if (!sdp) throw new Error("no local sdp");

      console.log('[FlexibleRAG] Making SDP request with offer');

      // Send SDP to relay
      const response = await fetch(`/api/voice/openai/sdp?venueId=${encodeURIComponent(currentVenueId)}`, { 
        method: "POST", 
        headers: { "Content-Type": "application/sdp" }, 
        body: sdp 
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[FlexibleRAG] SDP error response:', errorText);
        throw new Error(`SDP relay failed: ${response.status} - ${errorText}`);
      }

      const answer = await response.text();
      if (!answer.startsWith("v=")) throw new Error("invalid sdp answer");

      // Set remote description with the answer
      await pc.setRemoteDescription({ type: "answer", sdp: answer });
      
      ingestSpan(traceRef.current, "webrtc-setup", { sdp_length: answer.length });

      setStatus("connected");
      logEvent("flexible_rag_session_started", { venueId: currentVenueId, agentId: currentAgentId });

    } catch (err: any) {
      console.error("[FlexibleRAG] Start error:", err);
      setError(err.message || "Failed to connect");
      setStatus("error");
    } finally {
      isConnectingRef.current = false;
    }
  }, [currentVenueId, currentAgentId, instructions, vendor, voice]);

  const stop = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }

    setStatus("idle");
    setPartial("");
    logEvent("flexible_rag_session_ended", { venueId: currentVenueId, agentId: currentAgentId });
  }, [currentVenueId, currentAgentId]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const getStatusColor = () => {
    switch (status) {
      case "connected": return "bg-green-500";
      case "connecting": return "bg-yellow-500 animate-pulse";
      case "error": return "bg-red-500";
      default: return "bg-gray-400";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "connected": return "Connected - Ready for data tasks";
      case "connecting": return "Connecting to data assistant...";
      case "error": return error || "Connection error";
      default: return "Click to start data assistant";
    }
  };

  return (
    <div className="neuro-card p-6 space-y-6">
      {/* BevPro Logo */}
      <div className="flex justify-center mb-4">
        <img
          src="/bevpro-logo.svg"
          alt="BevPro"
          className="h-6 w-auto opacity-60"
        />
      </div>

      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Flexible RAG Assistant</h2>
          <p className="text-sm text-gray-600">AI-powered data analysis & automation</p>
        </div>
      </div>

      {/* Status Display */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
          <span className="font-medium text-gray-700">{getStatusText()}</span>
        </div>
        
        {partial && (
          <div className="text-sm text-gray-800 bg-white border border-gray-200 p-3 rounded-lg">
            <strong className="text-gray-900">Assistant:</strong> {partial}
          </div>
        )}
      </div>

      {/* Main Action Button */}
      <div className="text-center">
        {status === "idle" || status === "error" ? (
          <button
            onClick={start}
            disabled={isConnectingRef.current}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
          >
            Start Data Assistant
          </button>
        ) : (
          <button
            onClick={stop}
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105"
          >
            Stop Assistant
          </button>
        )}
      </div>

      {/* Capabilities Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-600">
        <div className="bg-blue-50 p-2 rounded-lg text-center">
          <div className="font-semibold text-blue-700">Documents</div>
          <div>PDF, Word, Text</div>
        </div>
        <div className="bg-green-50 p-2 rounded-lg text-center">
          <div className="font-semibold text-green-700">Databases</div>
          <div>SQL, NoSQL</div>
        </div>
        <div className="bg-yellow-50 p-2 rounded-lg text-center">
          <div className="font-semibold text-yellow-700">Spreadsheets</div>
          <div>Excel, CSV, Sheets</div>
        </div>
        <div className="bg-purple-50 p-2 rounded-lg text-center">
          <div className="font-semibold text-purple-700">APIs</div>
          <div>REST, GraphQL</div>
        </div>
      </div>

      {/* Instructions Preview */}
      {instructions && (
        <div className="text-xs text-gray-700 bg-white border border-gray-200 p-3 rounded-lg max-h-20 overflow-y-auto">
          <strong className="text-gray-900">System Instructions:</strong> {instructions.substring(0, 200)}...
        </div>
      )}
    </div>
  );
}