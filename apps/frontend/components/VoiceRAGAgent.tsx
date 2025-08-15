"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { logEvent } from "@/components/analytics/logEvent";
import { createClientTrace, ingestSpan } from "@/components/trace/traceClient";
import { getSimpleInstructions } from "@/server/prompts/system-prompts";

export default function VoiceRAGAgent({
  instructions: propInstructions,
  voice = "sage",
  venueId,
  agentId,
  onDocumentSearch,
}: { 
  instructions?: string; 
  voice?: string; 
  venueId?: string; 
  agentId?: string;
  onDocumentSearch?: (query: string, results: any[]) => void;
}) {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [error, setError] = useState("");
  const [partial, setPartial] = useState("");
  const [instructions, setInstructions] = useState<string>(propInstructions || getRAGInstructions());
  const currentVenueId = venueId || "rag-venue";
  const currentAgentId = agentId || "rag-agent";
  const [vendor, setVendor] = useState<any>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const traceRef = useRef(createClientTrace(currentVenueId, currentAgentId, "rag-realtime-session"));

  const isConnectingRef = useRef(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function getRAGInstructions(): string {
    return `You are an intelligent voice assistant with access to a comprehensive knowledge base. 

Your role:
- Answer questions based on uploaded documents and knowledge base content
- Search through documents to find relevant information
- Provide accurate, well-sourced responses with citations
- Summarize complex information in clear, understandable terms
- Help users navigate and understand their document collection

How to respond:
- Keep responses conversational and natural
- Always cite your sources when referencing document content
- If information isn't in your knowledge base, say so clearly
- Ask clarifying questions when queries are ambiguous
- Provide context and explain complex concepts simply

Available tools:
- search_documents: Search through the knowledge base for relevant information
- list_documents: Show available documents in the knowledge base
- upload_document: Guide users through document upload process
- summarize_document: Provide summaries of specific documents

Important: 
- You are a helpful knowledge assistant, not a general AI
- Focus on the documents and information in your knowledge base
- Be honest about limitations and knowledge gaps
- Provide helpful, accurate information based on available sources

CRITICAL: When activated by wake word, immediately respond with "Yes, how can I help you with your documents?" to acknowledge you heard them.`;
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

  // Load custom agent instructions
  useEffect(() => {
    if (currentVenueId && currentAgentId) {
      console.log(`[RAG Widget] Loading instructions for venue: ${currentVenueId}, agent: ${currentAgentId}`);
      fetch(`/api/rag/instructions?venueId=${currentVenueId}&agentId=${currentAgentId}`)
        .then(r => r.json())
        .then(data => {
          console.log(`[RAG Widget] Received instructions response:`, data);
          if (data.instructions) {
            console.log(`[RAG Widget] Setting custom instructions: ${data.instructions.substring(0, 100)}...`);
            setInstructions(data.instructions);
          } else {
            console.log(`[RAG Widget] No custom instructions found, using default RAG instructions`);
            setInstructions(getRAGInstructions());
          }
        })
        .catch((err) => {
          console.error(`[RAG Widget] Failed to load instructions:`, err);
          setInstructions(getRAGInstructions());
        });
    }
  }, [currentVenueId, currentAgentId]);

  const cleanup = useCallback(() => {
    console.debug("[RAG Widget] cleanup()");
    if (retryTimeoutRef.current) { clearTimeout(retryTimeoutRef.current); retryTimeoutRef.current = null; }

    try { abortRef.current?.abort(); } catch {}
    abortRef.current = null;

    try { dcRef.current?.close(); } catch {}
    dcRef.current = null;

    try { pcRef.current?.close(); } catch {}
    pcRef.current = null;

    try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
    streamRef.current = null;
  }, []);

  const ensureMicrophone = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasMic = devices.some(d => d.kind === "audioinput");
    if (!hasMic) throw new Error("No microphone found. Connect a mic and try again.");

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { 
        echoCancellation: true, 
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000,
        sampleSize: 16,
        channelCount: 1,
        latency: 0.01,
        volume: 1.0
      },
      video: false,
    });
    return stream;
  };

  // Handle RAG-specific function calls
  const handleFunctionCall = useCallback(async (functionName: string, args: any) => {
    try {
      switch (functionName) {
        case "search_documents":
          const searchResponse = await fetch('/api/rag/search-documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              query: args.query, 
              venueId: currentVenueId, 
              agentId: currentAgentId,
              limit: args.limit || 5
            })
          });
          const searchData = await searchResponse.json();
          console.log("[RAG Widget] Search results:", searchData);
          onDocumentSearch?.(args.query, searchData.results || []);
          break;

        case "list_documents":
          const listResponse = await fetch(`/api/rag/list-documents?venueId=${currentVenueId}&agentId=${currentAgentId}`);
          const listData = await listResponse.json();
          console.log("[RAG Widget] Document list:", listData);
          break;

        case "upload_document":
          console.log("[RAG Widget] Upload guidance requested:", args.guidance_type);
          break;

        case "summarize_document":
          console.log("[RAG Widget] Document summary requested:", args.document_name);
          break;

        case "delete_document":
          console.log("[RAG Widget] Document deletion requested:", args.document_name);
          break;

        default:
          console.log("[RAG Widget] Unknown function call:", functionName, args);
      }
    } catch (error) {
      console.error("[RAG Widget] Function call error:", error);
    }
  }, [currentVenueId, currentAgentId, onDocumentSearch]);

  const start = useCallback(async () => {
    if (isConnectingRef.current) return;
    isConnectingRef.current = true;

    try {
      setStatus("connecting");
      setError("");
      cleanup();

      const localAbort = new AbortController();
      abortRef.current = localAbort;

      // Get microphone
      const stream = await ensureMicrophone();
      logEvent({ venueId: currentVenueId, agentId: currentAgentId, eventType: "voice_start" });
      if (localAbort.signal.aborted) throw new Error("aborted");
      streamRef.current = stream;

      // Create RTCPeerConnection
      const pc = new RTCPeerConnection({ 
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" }
        ],
        iceCandidatePoolSize: 10,
        bundlePolicy: "balanced",
        rtcpMuxPolicy: "require"
      });
      pcRef.current = pc;

      // Attach mic track
      const track = stream.getAudioTracks()[0];
      if (track) pc.addTrack(track, stream);

      // Remote audio handler
      pc.ontrack = (ev) => {
        const [remote] = ev.streams;
        if (audioElRef.current && remote) {
          audioElRef.current.srcObject = remote as any;
          audioElRef.current.volume = 1.0;
          audioElRef.current.muted = false;
          audioElRef.current.play()
            .then(() => console.log("[RAG Widget] Audio playback started"))
            .catch(err => console.log("[RAG Widget] Audio play error:", err));
        }
      };

      // Data channel for events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onopen = () => {
        setStatus("connected");
        console.log("[RAG Widget] Configuring session...");
        
        const sessionConfig = {
          type: "session.update",
          session: {
            instructions: instructions,
            voice: vendor?.realtimeVoice || voice,
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            input_audio_transcription: {
              model: "whisper-1",
              language: "en",
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.15,
              prefix_padding_ms: 150,
              silence_duration_ms: 400,
            },
            tools: [
              {
                type: "function",
                name: "search_documents",
                description: "Search through the knowledge base documents for relevant information",
                parameters: {
                  type: "object",
                  properties: {
                    query: { 
                      type: "string", 
                      description: "Search query to find relevant document content" 
                    },
                    limit: { 
                      type: "number", 
                      description: "Maximum number of results to return (default: 5)" 
                    }
                  },
                  required: ["query"]
                }
              },
              {
                type: "function",
                name: "list_documents",
                description: "List all available documents in the knowledge base",
                parameters: {
                  type: "object",
                  properties: {}
                }
              },
              {
                type: "function",
                name: "upload_document",
                description: "Guide user through document upload process",
                parameters: {
                  type: "object",
                  properties: {
                    guidance_type: { 
                      type: "string", 
                      enum: ["instructions", "formats", "benefits"],
                      description: "Type of upload guidance to provide" 
                    }
                  }
                }
              },
              {
                type: "function",
                name: "summarize_document",
                description: "Provide a summary of a specific document",
                parameters: {
                  type: "object",
                  properties: {
                    document_name: { 
                      type: "string", 
                      description: "Name or ID of the document to summarize" 
                    }
                  },
                  required: ["document_name"]
                }
              },
              {
                type: "function",
                name: "delete_document",
                description: "Delete a document from the knowledge base",
                parameters: {
                  type: "object",
                  properties: {
                    document_name: { 
                      type: "string", 
                      description: "Name or ID of the document to delete" 
                    }
                  },
                  required: ["document_name"]
                }
              }
            ],
            tool_choice: "auto",
            temperature: 0.6,
            max_response_output_tokens: 1500,
          },
        };
        
        console.log("[RAG Widget] Session config:", JSON.stringify(sessionConfig, null, 2));
        dc.send(JSON.stringify(sessionConfig));
      };
      
      dc.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          console.log("[RAG Widget] Received message:", msg.type, msg);
          
          if (msg.type === "session.updated") {
            console.log("[RAG Widget] Session updated successfully!");
            setPartial("Ready for questions about your documents!");
          }
          
          if (msg.type === "response.audio_transcript.delta" && msg.delta) {
            setPartial((p) => p + msg.delta);
          }
          
          if (msg.type === "response.audio_transcript.done") {
            setPartial(msg.transcript || "");
            console.log("[RAG Widget] Final transcript:", msg.transcript);
          }
          
          // Handle function calls
          if (msg.type === "response.function_call_arguments.done") {
            const args = JSON.parse(msg.arguments || "{}");
            console.log("[RAG Widget] Function call:", msg.name, args);
            
            handleFunctionCall(msg.name, args);
          }
          
          if (msg.type === "response.done") {
            console.log("[RAG Widget] Response completed");
          }
          
          if (msg.type === "error") {
            console.error("[RAG Widget] OpenAI error:", msg);
            setError(`OpenAI error: ${msg.error?.message || "Unknown error"}`);
          }
        } catch (err) {
          console.error("[RAG Widget] Message parsing error:", err);
        }
      };

      // Create offer/SDP
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      if (localAbort.signal.aborted) throw new Error("aborted");
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering
      await new Promise<void>((resolve) => {
        if (!pcRef.current) return resolve();
        if (pcRef.current.iceGatheringState === "complete") return resolve();
        const onStateChange = () => {
          if (!pcRef.current) return;
          if (pcRef.current.iceGatheringState === "complete") {
            pcRef.current.removeEventListener("icegatheringstatechange", onStateChange);
            resolve();
          }
        };
        pcRef.current.addEventListener("icegatheringstatechange", onStateChange);
        setTimeout(() => resolve(), 1200);
      });

      const sdp = pc.localDescription?.sdp;
      if (!sdp) throw new Error("no local sdp");

      // Send SDP to relay
      const res = await fetch(`/api/voice/openai/sdp?venueId=${encodeURIComponent(currentVenueId)}`, { 
        method: "POST", 
        headers: { "Content-Type": "application/sdp" }, 
        body: sdp 
      });
      if (!res.ok) throw new Error(`SDP relay failed: ${res.status}`);
      const answer = await res.text();
      if (!answer.startsWith("v=")) throw new Error("invalid sdp answer");
      if (localAbort.signal.aborted) throw new Error("aborted");
      await pc.setRemoteDescription({ type: "answer", sdp: answer });

    } catch (err: any) {
      if (err?.name === "NotAllowedError") setError("Mic permission denied. Click Start and allow mic.");
      else if (err?.name === "NotFoundError") setError("No microphone found. Connect one and click Start.");
      else setError(err?.message || "Unknown start error");
      setStatus("error");
    } finally {
      isConnectingRef.current = false;
    }
  }, [instructions, voice, vendor, currentVenueId, currentAgentId, cleanup, handleFunctionCall]);

  const stop = useCallback(() => {
    cleanup();
    setStatus("idle");
    setPartial("Click Start to begin voice interaction");
    setError("");
  }, [cleanup]);

  useEffect(() => {
    console.debug("[RAG Widget] mount");
    try { if (audioElRef.current) audioElRef.current.autoplay = true; } catch {}
    setStatus("idle");
    setPartial("Click Start to begin voice interaction with your documents");
    return () => cleanup();
  }, [cleanup]);

  return (
    <div className="flex flex-col items-center justify-center space-y-8 max-w-sm mx-auto text-center">
      {/* BevPro Logo */}
      <div className="mb-4">
        <img 
          src="/bevpro-logo.svg" 
          alt="BevPro" 
          className="h-6 w-auto opacity-60"
        />
      </div>
      
      {/* Central Voice Indicator */}
      <div className="relative">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
          status === 'connected' ? 'bg-gradient-to-br from-purple-400 to-pink-500 animate-pulse shadow-2xl shadow-purple-400/50' :
          status === 'connecting' ? 'bg-gradient-to-br from-amber-400 to-orange-500 animate-pulse shadow-2xl shadow-amber-400/50' :
          status === 'error' ? 'bg-gradient-to-br from-red-400 to-red-600 shadow-2xl shadow-red-400/50' :
          'bg-gradient-to-br from-gray-600 to-gray-700 shadow-xl'
        }`}>
          <div className="text-4xl">📚</div>
        </div>
        {status === 'connected' && (
          <div className="absolute -inset-2 rounded-full border-2 border-purple-400 animate-ping" />
        )}
      </div>

      {/* Status Text */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-gray-800">
          {status === 'idle' ? 'Ready to Start' : 
           status === 'connecting' ? 'Connecting...' :
           status === 'connected' ? 'Assistant Listening' : 'Connection Error'}
        </h2>
        
        {partial && (
          <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 max-w-xs border border-white/30">
            <div className="text-sm text-gray-800">{partial}</div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
      </div>

      {/* Simple Control */}
      <div className="space-y-4">
        {status === "idle" && (
          <button
            className="w-48 h-16 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-purple-500/30 transition-all duration-300 transform hover:scale-105"
            onClick={start}
          >
            Start Voice Chat
          </button>
        )}
        
        {(status === "connected" || status === "connecting") && (
          <button
            className="w-32 h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-semibold rounded-xl shadow-xl shadow-red-500/30 transition-all duration-300"
            onClick={stop}
          >
            Stop
          </button>
        )}
        
        {/* Simple Instructions */}
        {status === 'idle' && (
          <div className="text-sm text-gray-600 max-w-xs">
            Ask questions about your uploaded documents using natural speech
          </div>
        )}
        
        {status === 'connected' && (
          <div className="text-sm text-gray-600 max-w-xs">
            Try: &quot;What is this document about?&quot; or &quot;Search for information about...&quot;
          </div>
        )}
      </div>

      <audio ref={audioElRef} hidden />
    </div>
  );
}
