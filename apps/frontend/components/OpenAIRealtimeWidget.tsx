"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { logEvent } from "@/components/analytics/logEvent";
import { createClientTrace, ingestSpan } from "@/components/trace/traceClient";

export default function OpenAIRealtimeWidget({
  instructions: propInstructions = "You are Bev, the bar voice agent. Keep replies short; speak naturally.",
  voice = "sage",
  venueId,
  agentId,
}: { instructions?: string; voice?: string; venueId?: string; agentId?: string }) {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [error, setError] = useState("");
  const [partial, setPartial] = useState("");
  const [instructions, setInstructions] = useState<string>(propInstructions);
  const currentVenueId = venueId || "demo-venue";
  const currentAgentId = agentId || "demo-agent";
  const [vendor, setVendor] = useState<any>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const traceRef = useRef(createClientTrace(currentVenueId, currentAgentId, "realtime-session"));

  const isConnectingRef = useRef(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    audioElRef.current = new Audio();
    if (audioElRef.current) {
      audioElRef.current.autoplay = true;
      audioElRef.current.crossOrigin = "anonymous";
    }
  }, []);

  useEffect(() => {
    fetch(`/api/settings/vendor?venueId=${currentVenueId}`).then((r) => r.json()).then(setVendor).catch(() => {});
  }, [currentVenueId]);

  // Load custom agent instructions
  useEffect(() => {
    if (currentVenueId && currentAgentId) {
      console.log(`[OpenAI Widget] Loading instructions for venue: ${currentVenueId}, agent: ${currentAgentId}`);
      fetch(`/api/agents/instructions?venueId=${currentVenueId}&agentId=${currentAgentId}`)
        .then(r => r.json())
        .then(data => {
          console.log(`[OpenAI Widget] Received instructions response:`, data);
          if (data.instructions) {
            console.log(`[OpenAI Widget] Setting custom instructions: ${data.instructions.substring(0, 100)}...`);
            setInstructions(data.instructions);
          } else {
            console.log(`[OpenAI Widget] No custom instructions found, using default`);
          }
        })
        .catch((err) => {
          console.error(`[OpenAI Widget] Failed to load instructions:`, err);
        });
    }
  }, [currentVenueId, currentAgentId]);

  const cleanup = useCallback(() => {
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

    // Must be user-gesture initiated
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: false,
    });
    return stream;
  };

  const start = useCallback(async () => {
    if (isConnectingRef.current) return;
    isConnectingRef.current = true;

    try {
      setStatus("connecting");
      setError("");
      cleanup();

      const localAbort = new AbortController();
      abortRef.current = localAbort;

      // 1) Get mic on user gesture only
      const stream = await ensureMicrophone();
      logEvent({ venueId: "demo-venue", agentId: "demo-agent", eventType: "voice_start" });
      if (localAbort.signal.aborted) throw new Error("aborted");
      streamRef.current = stream;

      // 2) Create RTCPeerConnection
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pcRef.current = pc;

      // 3) Attach mic track
      const track = stream.getAudioTracks()[0];
      if (track) pc.addTrack(track, stream);

      // 4) Remote audio handler
      pc.ontrack = (ev) => {
        const [remote] = ev.streams;
        console.log(`[OpenAI] Remote track received:`, {
          streamId: remote?.id,
          tracks: remote?.getTracks().length,
          audioTracks: remote?.getAudioTracks().length
        });
        
        if (audioElRef.current && remote) {
          audioElRef.current.srcObject = remote as any;
          audioElRef.current.volume = 1.0; // Ensure full volume
          audioElRef.current.muted = false; // Ensure not muted
          
          // Force audio playback to ensure output is heard
          audioElRef.current.play()
            .then(() => console.log("[OpenAI] Audio playback started successfully"))
            .catch(err => console.log("[OpenAI] Audio play error:", err));
        }
      };

      // 5) Data channel for events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onopen = () => {
        setStatus("connected");
        // Send session configuration with instructions
        console.log(`[OpenAI] Configuring session with instructions`);
        dc.send(JSON.stringify({
          type: "session.update",
          session: {
            modalities: ["text", "audio"],
            instructions: instructions,
            voice: voice || "sage",
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            input_audio_transcription: {
              model: "whisper-1"
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 800
            },
            tools: [
              {
                type: "function",
                name: "cart_add",
                description: "Add a drink to the cart",
                parameters: {
                  type: "object",
                  properties: {
                    drink_name: { type: "string", description: "Name of the drink" },
                    quantity: { type: "number", description: "Quantity to add" }
                  },
                  required: ["drink_name"]
                }
              },
              {
                type: "function", 
                name: "cart_view",
                description: "View the current cart contents",
                parameters: { type: "object", properties: {} }
              },
              {
                type: "function",
                name: "cart_create_order", 
                description: "Create an order from the cart",
                parameters: { type: "object", properties: {} }
              },
              {
                type: "function",
                name: "search_drinks",
                description: "Search for drinks by name",
                parameters: {
                  type: "object",
                  properties: {
                    query: { type: "string", description: "Search query" }
                  }
                }
              },
              {
                type: "function",
                name: "list_drinks",
                description: "List all available drinks",
                parameters: { type: "object", properties: {} }
              }
            ]
          }
        }));
        
        // Send initial response.create to enable audio output
        dc.send(JSON.stringify({
          type: "response.create",
          response: {
            modalities: ["text", "audio"]
          }
        }));
      };
      dc.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          
          // Log all speech-related messages for debugging
          if (msg.type?.includes("transcript") || msg.type?.includes("audio") || msg.type === "conversation.item.input_audio_transcription.completed") {
            console.log(`[OpenAI Speech] ${msg.type}:`, msg);
          }
          
          if (msg.type === "response.audio_transcript.delta" && msg.delta) {
            setPartial((p) => p + msg.delta);
            console.log(`[OpenAI] AI response (partial): "${msg.delta}"`);
          }
          if (msg.type === "response.audio_transcript.done") {
            setPartial(msg.transcript || "");
            console.log(`[OpenAI] AI response (final): "${msg.transcript}"`);
          }
          if (msg.type === "conversation.item.input_audio_transcription.completed") {
            console.log(`[OpenAI] User transcript: "${msg.transcript}"`);
          }
          
          // Log audio events with more detail
          if (msg.type === "response.audio.delta") {
            console.log(`[OpenAI] Audio chunk received, size:`, msg.delta?.length || 0);
            
            // Check if audio element is ready and playing
            if (audioElRef.current) {
              console.log(`[OpenAI] Audio element state:`, {
                readyState: audioElRef.current.readyState,
                paused: audioElRef.current.paused,
                muted: audioElRef.current.muted,
                volume: audioElRef.current.volume,
                srcObject: !!audioElRef.current.srcObject
              });
            }
          }
          if (msg.type === "response.audio.done") {
            console.log(`[OpenAI] Audio complete`);
          }
          
          // Handle function calls from OpenAI
          if (msg.type === "response.function_call_arguments.done") {
            console.log(`[OpenAI] Function call: ${msg.name}`, msg.arguments);
            
            (async () => {
              try {
                const args = JSON.parse(msg.arguments || "{}");
                const result = await fetch("/api/voice/tools", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ 
                    tool: msg.name,
                    params: { ...args, clientId: currentVenueId }
                  }),
                });
                const data = await result.json();
                console.log(`[OpenAI] Tool result:`, data);
                
                // Send function result back to OpenAI
                if (dcRef.current?.readyState === "open") {
                  dcRef.current.send(JSON.stringify({
                    type: "conversation.item.create",
                    item: {
                      type: "function_call_output",
                      call_id: msg.call_id,
                      output: JSON.stringify(data.result || data)
                    }
                  }));
                }
              } catch (err) {
                console.error(`[OpenAI] Function call failed:`, err);
              }
            })();
          }
          if (msg.type === "response.audio_transcript.delta") {
            logEvent({ venueId: currentVenueId, agentId: currentAgentId, eventType: "asr_partial" });
            const t0p = performance.now();
            ingestSpan(traceRef.current, "realtime.partial_first", t0p);
          }
          if (msg.type === "response.audio_transcript.done") {
            logEvent({ venueId: currentVenueId, agentId: currentAgentId, eventType: "asr_final" });
            (async () => {
              try {
                const venueId = currentVenueId;
                const agentId = currentAgentId;
                const t0n = performance.now();
                const r = await fetch("/api/nlu/resolve-run", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "x-trace-id": traceRef.current.traceId },
                  body: JSON.stringify({ text: msg.transcript || "", venueId, agentId }),
                });
                ingestSpan(traceRef.current, "nlu.call", t0n, { textLen: (msg.transcript || "").length });
                ingestSpan(traceRef.current, "nlu.reply_wait", performance.now(), { ok: r.ok });
                const data = await r.json();
                if (data?.say) {
                  setPartial(String(data.say));
                }
              } catch {}
            })();
          }
        } catch {}
      };

      // 6) Offer/SDP
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      if (localAbort.signal.aborted) throw new Error("aborted");
      await pc.setLocalDescription(offer);

      // Wait briefly for ICE gathering
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

      // 7) Send SDP to our relay
      const res = await fetch(`/api/voice/openai/sdp?venueId=${encodeURIComponent(currentVenueId)}&agentId=${encodeURIComponent(currentAgentId)}`, { method: "POST", headers: { "Content-Type": "application/sdp" }, body: sdp });
      if (!res.ok) throw new Error(`SDP relay failed: ${res.status}`);
      const answer = await res.text();
      if (!answer.startsWith("v=")) throw new Error("invalid sdp answer");
      if (localAbort.signal.aborted) throw new Error("aborted");
      await pc.setRemoteDescription({ type: "answer", sdp: answer });

      // 8) Configure session (instructions, VAD, transcription, TTS voice)
      setTimeout(() => {
        if (dcRef.current?.readyState === "open") {
          console.log(`[OpenAI] Configuring session with instructions: ${instructions.substring(0, 100)}...`);
          dcRef.current.send(
            JSON.stringify({
              type: "session.update",
              session: {
                instructions,
                voice: vendor?.realtimeVoice || voice,
                input_audio_transcription: { model: "whisper-1" },
                turn_detection: {
                  type: "server_vad",
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 800
                }
              },
            }),
          );
          dcRef.current.send(
            JSON.stringify({ type: "response.create", response: { modalities: ["text", "audio"], max_output_tokens: 120 } }),
          );
        }
      }, 200);
    } catch (err: any) {
      if (err?.name === "NotAllowedError") setError("Mic permission denied. Click Start and allow mic.");
      else if (err?.name === "NotFoundError") setError("No microphone found. Connect one and click Start.");
      else setError(err?.message || "Unknown start error");
      setStatus("error");
    } finally {
      isConnectingRef.current = false;
    }
  }, [cleanup, instructions, voice]);

  const stop = useCallback(() => {
    setStatus("idle");
    setError("");
    setPartial("");
    cleanup();
  }, [cleanup]);

  // Ensure full teardown on unmount to avoid lane-switch conflicts
  useEffect(() => {
    return () => {
      try { abortRef.current?.abort(); } catch {}
      try { dcRef.current?.close(); } catch {}
      try { pcRef.current?.close(); } catch {}
      try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
    };
  }, []);

  return (
    <div className="neuro-card p-6 space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-neuro bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-neuro animate-pulse-glow">
            <div className="w-4 h-4 rounded-full bg-white/80" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">OpenAI Realtime</h3>
            <p className="text-xs text-white/60">Ultra-low latency voice</p>
          </div>
        </div>
        
        <div className={`status-${status === 'error' ? 'disconnected' : status === 'connected' ? 'connected' : 'pending'}`}>
          <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <span className="text-xs font-medium capitalize">{status}</span>
        </div>
      </div>

      {/* Status and Transcript Display */}
      <div className="glass-panel p-4 space-y-3">
        {error && (
          <div className="status-disconnected">
            <span className="text-xs">{error}</span>
          </div>
        )}
        
        {partial && (
          <div className="space-y-2">
            <div className="text-xs text-white/60">AI Response</div>
            <div className="glass-panel p-3 rounded-neuro-sm">
              <div className="text-sm text-white font-mono">{partial}</div>
            </div>
          </div>
        )}
        
        {status === "connected" && !partial && (
          <div className="text-center py-6">
            <div className="inline-flex items-center gap-2 text-white/60">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm">Listening for voice commands...</span>
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3">
        <button 
          className="neuro-button bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-400/30 hover:from-blue-400 hover:to-purple-500 shadow-glow-violet flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={start} 
          disabled={status === "connecting" || status === "connected"}
        >
          <div className="flex items-center gap-2">
            {status === "connecting" ? (
              <>
                <div className="w-2 h-2 rounded-full bg-white animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-white" />
                Start Realtime
              </>
            )}
          </div>
        </button>
        
        <button 
          className="neuro-button flex-1"
          onClick={stop}
        >
          Stop
        </button>
      </div>

      {/* Technical Info */}
      <div className="glass-panel p-3 rounded-neuro-sm">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-white/50">Voice:</span>
            <span className="text-white/80 ml-1">{vendor?.realtimeVoice || voice}</span>
          </div>
          <div>
            <span className="text-white/50">Model:</span>
            <span className="text-white/80 ml-1">GPT-4o Realtime</span>
          </div>
        </div>
      </div>

      <audio ref={audioElRef} hidden />
    </div>
  );
}


