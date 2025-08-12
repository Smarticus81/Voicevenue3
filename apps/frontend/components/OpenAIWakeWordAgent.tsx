"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { logEvent } from "@/components/analytics/logEvent";
import { createClientTrace, ingestSpan } from "@/components/trace/traceClient";

type AgentState = "idle" | "wake-listening" | "command-mode" | "error";
type SpeechRecognition = any;

export default function OpenAIWakeWordAgent({
  instructions = `You are Bev, an expert bartender and voice assistant working at a live bar/restaurant. This is NOT a simulation - you are handling real voice orders and inventory management.

Your role:
- You work behind the bar taking voice orders from staff and customers
- You manage drink inventory (shots, bottles, mixers)
- You know the menu and can answer questions about drinks
- You process orders for specific tables and tabs

How to respond:
- Keep ALL responses SHORT (1-2 sentences maximum)
- Be conversational and natural like a real bartender
- For orders: "Got it, two shots of tequila for table five" or "Adding that to your tab"
- For inventory: "We have about 15 shots of whiskey left" or "Vodka is running low"
- For questions: "That drink has rum and pineapple juice" or "Sure, we can make that"

Important: You are NOT an AI assistant discussing topics or providing quotes. You are a working bartender focused ONLY on bar operations, orders, and drinks. Stay in character always.

CRITICAL: When activated by wake word, immediately respond with "Yes, I'm listening" or "How can I help?" to acknowledge you heard them.`,
  voice = "sage", // Female voice
  onResolved,
  onStop,
}: { 
  instructions?: string; 
  voice?: string;
  onResolved?: (payload: any) => void;
  onStop?: () => void;
}) {
  const [uiState, setUiState] = useState<AgentState>("idle");
  const [error, setError] = useState("");
  const [partial, setPartial] = useState("");
  const [wakePhrase, setWakePhrase] = useState<string>("hey bev");
  const venueId = "demo-venue";
  const [vendor, setVendor] = useState<any>(null);
  const [commandCount, setCommandCount] = useState<number>(0);
  const [isPreConnected, setIsPreConnected] = useState<boolean>(false);
  const COMMAND_LIMIT = 15;

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const traceRef = useRef(createClientTrace("demo-venue", "demo-agent", "realtime-session"));
  const wakeListenerRef = useRef<SpeechRecognition | null>(null);
  const stateRef = useRef<AgentState>("idle");

  const isConnectingRef = useRef(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isShuttingDownRef = useRef<boolean>(false);
  const terminationPhrases = ["stop listening", "end call", "bye bev", "thanks bev", "shut down"];

  const startWakeRef = useRef<() => Promise<void>>(async () => {});
  const startCmdRef = useRef<() => Promise<void>>(async () => {});
  const transitionToWakeRef = useRef<() => void>(() => {});
  const shutdownRef = useRef<() => void>(() => {});

  useEffect(() => { stateRef.current = uiState; }, [uiState]);

  useEffect(() => {
    audioElRef.current = new Audio();
    if (audioElRef.current) {
      audioElRef.current.autoplay = true;
      audioElRef.current.crossOrigin = "anonymous";
    }
  }, []);

  useEffect(() => {
    fetch(`/api/settings/vendor?venueId=${venueId}`).then((r) => r.json()).then(setVendor).catch(() => {});
    // Load wake word settings with very low threshold for demo
    fetch(`/api/settings/wakeword?venueId=${venueId}`).then((r) => r.json()).then((data) => {
      if (data?.phrase) setWakePhrase(data.phrase);
    }).catch(() => {});
    
    // Pre-connect to ensure immediate response
    (async () => {
      try {
        setPartial("Pre-connecting voice system...");
        // Pre-request microphone permission and initialize stream
        const stream = await ensureMicrophone();
        streamRef.current = stream;
        setIsPreConnected(true);
        setPartial("Voice system ready - click Start to begin");
      } catch (err) {
        console.warn("[OpenAI-WW] Pre-connection failed:", err);
        setPartial("Click Start to begin voice interaction");
      }
    })();
  }, []);

  const cleanup = useCallback(() => {
    console.debug("[OpenAI-WW] cleanup()");
    if (retryTimeoutRef.current) { clearTimeout(retryTimeoutRef.current); retryTimeoutRef.current = null; }

    try { abortRef.current?.abort(); } catch {}
    abortRef.current = null;

    try { dcRef.current?.close(); } catch {}
    dcRef.current = null;

    try { pcRef.current?.close(); } catch {}
    pcRef.current = null;

    try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
    streamRef.current = null;

    try { wakeListenerRef.current?.stop(); } catch {}
    wakeListenerRef.current = null;
  }, []);

  const ensureMicrophone = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasMic = devices.some(d => d.kind === "audioinput");
    if (!hasMic) throw new Error("No microphone found. Connect a mic and try again.");

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: ({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 24000,
        channelCount: 1,
        // vendor-specific hints
        googEchoCancellation: true,
        googNoiseSuppression: true,
        googAutoGainControl: true,
        googHighpassFilter: true,
      } as any),
      video: false,
    });
    return stream;
  };

  transitionToWakeRef.current = () => {
    console.debug("[OpenAI-WW] transitionToWake()");
    isShuttingDownRef.current = false;
    cleanup();
    setUiState("wake-listening");
    setPartial(`Listening for "${wakePhrase}"...`);
    startWakeRef.current();
  };

  shutdownRef.current = () => {
    console.debug("[OpenAI-WW] shutdown()");
    isShuttingDownRef.current = true;
    cleanup();
    setUiState("idle");
    setPartial("Voice agent shut down. Click Start to begin.");
    setError("");
    try { onStop?.(); } catch {}
  };

  startWakeRef.current = async () => {
    console.debug("[OpenAI-WW] startWake() - starting wake word listening");
    setUiState("wake-listening");
    setError("");
    setPartial(`Listening for "${wakePhrase}"...`);
    isShuttingDownRef.current = false;

    if (pcRef.current || dcRef.current) cleanup();

    // Request microphone permission first
    try {
      if (!streamRef.current) {
        streamRef.current = await ensureMicrophone();
      }
    } catch (err) {
      console.error("[OpenAI-WW] Failed to get microphone access:", err);
      setError("Microphone access denied. Please grant permission and try again.");
      setUiState("idle");
      return;
    }

    // Start wake word listening using native speech recognition
    const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      setError("Speech recognition not supported in this browser");
      return;
    }

    try {
      const rec = new SR();
      wakeListenerRef.current = rec;
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (e: any) => {
        const chunk = Array.from(e.results)
          .map((r: any) => r[0]?.transcript || "")
          .join(" ")
          .toLowerCase();
        if (!chunk.trim()) return;

        // Very low threshold for demo - simple includes check
        if (chunk.includes(wakePhrase.toLowerCase()) || chunk.includes("hey") || chunk.includes("bev")) {
          console.debug("[OpenAI-WW] Wake word detected!");
          rec.stop();
          wakeListenerRef.current = null;
            setPartial("Connecting...");
          
          // Immediate connection since we're pre-connected
          if (isPreConnected) {
            startCmdRef.current();
          } else {
            setTimeout(() => startCmdRef.current(), 200);
          }
        }
      };

      rec.onerror = (e: any) => {
        console.error("[OpenAI-WW] Wake word recognition error:", e);
        if (e.error === "no-speech") {
          // Restart recognition on no-speech timeout
          try { rec.start(); } catch {}
        }
      };

      rec.onend = () => {
        // Restart if we're still in wake-listening mode
        if (stateRef.current === "wake-listening" && wakeListenerRef.current === rec) {
          setTimeout(() => {
            try { rec.start(); } catch {}
          }, 500);
        }
      };

      await rec.start();
    } catch (err) {
      console.error("[OpenAI-WW] Failed to start wake word listener:", err);
      setError("Failed to start wake word listener");
    }
  };

  startCmdRef.current = async () => {
    if (isConnectingRef.current) return;
    isConnectingRef.current = true;

    try {
      setUiState("command-mode");
      setError("");
      setPartial("Connecting to OpenAI Realtime...");

      const localAbort = new AbortController();
      abortRef.current = localAbort;

      // Use existing stream if available
      let stream = streamRef.current;
      if (!stream) {
        stream = await ensureMicrophone();
        streamRef.current = stream;
      }

      logEvent({ venueId: "demo-venue", agentId: "demo-agent", eventType: "voice_start" });
      if (localAbort.signal.aborted) throw new Error("aborted");

      // Create RTCPeerConnection
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pcRef.current = pc;

      // Attach mic track
      const track = stream.getAudioTracks()[0];
      if (track) pc.addTrack(track, stream);

      // Remote audio handler
      pc.ontrack = (ev) => {
        const [remote] = ev.streams;
        if (audioElRef.current) audioElRef.current.srcObject = remote as any;
      };

      // Data channel for events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onopen = () => {
        setPartial("Ready for voice commands...");
      };
      
      dc.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          console.log("[OpenAI-WW] Received message:", msg.type, msg);
          
          // Log user input transcription for activity log
          if (msg.type === "conversation.item.input_audio_transcription.completed") {
            const userText = msg.transcript;
            if (userText && onResolved) {
              // Add user input to activity log
              console.log("[OpenAI-WW] User said:", userText);
              // We could add a callback for user input if needed
            }
          }
          
          if (msg.type === "session.updated") {
            console.log("[OpenAI-WW] Session updated successfully!");
            setPartial("Session configured - ready for voice commands!");
          }
          
          if (msg.type === "response.audio_transcript.delta" && msg.delta) {
            setPartial((p) => p + msg.delta);
          }
          
          if (msg.type === "response.audio_transcript.done") {
            const text = (msg.transcript || "").toLowerCase().trim();
            setPartial(msg.transcript || "");
            console.log("[OpenAI-WW] Final transcript:", text);
            
            // Update activity log immediately with Bev's response
            if (msg.transcript && onResolved) {
              onResolved({ say: msg.transcript });
            }
            
            // Increment command count and check limit
            setCommandCount(prev => {
              const newCount = prev + 1;
              if (newCount >= COMMAND_LIMIT) {
                setTimeout(() => {
                  setPartial(`Demo completed! You've tried ${COMMAND_LIMIT} voice commands. Thanks for testing Bev!`);
                  // Immediately shut down voice agent when demo completes so popup doesn't conflict
                  shutdownRef.current();
                  try { onStop?.(); } catch {}
                }, 1500);
              }
              return newCount;
            });
            
            // Check for termination phrases
            if (text) {
              for (const phrase of terminationPhrases) {
                if (text.includes(phrase)) {
                  if (phrase === "shut down") {
                    setTimeout(() => shutdownRef.current(), 1500);
                    return;
                  } else {
                    setTimeout(() => transitionToWakeRef.current(), 1500);
                    return;
                  }
                }
              }
            }
            
            // Process the command
            if (msg.transcript?.trim()) {
              logEvent({ venueId: "demo-venue", agentId: "demo-agent", eventType: "asr_final" });
              (async () => {
                try {
                   const venueId = "demo-venue";
                   const agentId = "demo-agent";
                  const t0n = performance.now();
                  const r = await fetch("/api/nlu/resolve-run", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-trace-id": traceRef.current.traceId },
                    body: JSON.stringify({ text: msg.transcript || "", venueId, agentId }),
                  });
                  ingestSpan(traceRef.current, "nlu.call", t0n, { textLen: (msg.transcript || "").length });
                  ingestSpan(traceRef.current, "nlu.reply_wait", performance.now(), { ok: r.ok });
                  const data = await r.json();
                  try { onResolved?.(data); } catch {}
                } catch {}
              })();
            }
          }
          
          if (msg.type === "response.done") {
            console.log("[OpenAI-WW] Response completed");
          }
          
          if (msg.type === "error") {
            console.error("[OpenAI-WW] OpenAI error:", msg);
            setError(`OpenAI error: ${msg.error?.message || "Unknown error"}`);
          }
        } catch (err) {
          console.error("[OpenAI-WW] Message parsing error:", err);
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
      const res = await fetch(`/api/voice/openai/sdp?venueId=${encodeURIComponent(venueId)}`, { 
        method: "POST", 
        headers: { "Content-Type": "application/sdp" }, 
        body: sdp 
      });
      if (!res.ok) throw new Error(`SDP relay failed: ${res.status}`);
      const answer = await res.text();
      if (!answer.startsWith("v=")) throw new Error("invalid sdp answer");
      if (localAbort.signal.aborted) throw new Error("aborted");
      await pc.setRemoteDescription({ type: "answer", sdp: answer });

      // Configure session with very sensitive VAD for demo
      setTimeout(() => {
        if (dcRef.current?.readyState === "open") {
          console.log("[OpenAI-WW] Sending session configuration...");
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
                threshold: 0.1, // Ultra-low threshold for demo
                prefix_padding_ms: 100,
                silence_duration_ms: 200,
              },
              tools: [],
              tool_choice: "auto",
              temperature: 0.6,
              max_response_output_tokens: 150,
            },
          };
          console.log("[OpenAI-WW] Session config:", JSON.stringify(sessionConfig, null, 2));
          dcRef.current.send(JSON.stringify(sessionConfig));
        }
      }, 500);
    } catch (err: any) {
      if (err?.name === "NotAllowedError") setError("Mic permission denied. Click Start and allow mic.");
      else if (err?.name === "NotFoundError") setError("No microphone found. Connect one and click Start.");
      else setError(err?.message || "Unknown start error");
      setUiState("error");
    } finally {
      isConnectingRef.current = false;
    }
  };

  useEffect(() => {
    console.debug("[OpenAI-WW] mount");
    try { if (audioElRef.current) audioElRef.current.autoplay = true; } catch {}
    setUiState("idle");
    setPartial("Click Start to begin voice interaction");
    return () => cleanup();
  }, [cleanup]);

  return (
    <div className="flex flex-col items-center justify-center space-y-8 max-w-sm mx-auto text-center">
      {/* Central Voice Indicator */}
      <div className="relative">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
          uiState === 'command-mode' ? 'bg-gradient-to-br from-green-400 to-emerald-500 animate-pulse shadow-2xl shadow-green-400/50' :
          uiState === 'wake-listening' ? 'bg-gradient-to-br from-amber-400 to-orange-500 animate-pulse shadow-2xl shadow-amber-400/50' :
          uiState === 'error' ? 'bg-gradient-to-br from-red-400 to-red-600 shadow-2xl shadow-red-400/50' :
          'bg-gradient-to-br from-gray-600 to-gray-700 shadow-xl'
        }`}>
          <div className="text-4xl">🎤</div>
        </div>
        {uiState === 'command-mode' && (
          <div className="absolute -inset-2 rounded-full border-2 border-green-400 animate-ping" />
        )}
      </div>

      {/* Status Text */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-white">
          {uiState === 'idle' ? 'Ready to Start' : 
           uiState === 'wake-listening' ? 'Say "Hey Bev"' :
           uiState === 'command-mode' ? 'Bev is Listening' : 'Connection Error'}
        </h2>
        
        {commandCount > 0 && commandCount < COMMAND_LIMIT && (
          <div className="text-sm text-white/60">
            {COMMAND_LIMIT - commandCount} commands remaining
          </div>
        )}
        
        {partial && (
          <div className="glass-panel p-4 rounded-xl max-w-xs">
            <div className="text-sm text-white/90">{partial}</div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3">
            <div className="text-sm text-red-200">{error}</div>
          </div>
        )}
      </div>

      {/* Simple Control */}
      <div className="space-y-4">
        {uiState === "idle" && (
          <button
            className="w-48 h-16 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-blue-500/30 transition-all duration-300 transform hover:scale-105"
            onClick={() => startWakeRef.current()}
          >
            Start Voice Demo
          </button>
        )}
        
        {(uiState === "command-mode" || uiState === "wake-listening") && (
          <button
            className="w-32 h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-semibold rounded-xl shadow-xl shadow-red-500/30 transition-all duration-300"
            onClick={() => shutdownRef.current()}
          >
            Stop
          </button>
        )}
        
        {/* Simple Instructions */}
        {uiState === 'idle' && (
          <div className="text-sm text-white/70 max-w-xs">
            Experience ultra-low latency voice AI. Just say "Hey Bev" and start talking!
          </div>
        )}
        
        {uiState === 'wake-listening' && (
          <div className="text-sm text-white/70 max-w-xs">
            Try: "Hey Bev, add two shots of tequila to table five"
          </div>
        )}
      </div>

      <audio ref={audioElRef} hidden />
    </div>
  );
}
