"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { logEvent } from "@/components/analytics/logEvent";
import { createClientTrace, ingestSpan } from "@/components/trace/traceClient";
import { useWakeWord } from "@/components/voice/useWakeWord";
type AgentState = "idle" | "wake-listening" | "command-mode" | "error";
type SpeechRecognition = any;

let WS_URL_DEFAULT = `ws://localhost:${process.env.NEXT_PUBLIC_VOICE_WS_PORT || 8787}`;
if (process.env.NEXT_PUBLIC_VOICE_WS_URL) WS_URL_DEFAULT = String(process.env.NEXT_PUBLIC_VOICE_WS_URL);

export default function VoiceAgent({ autoStart = false, hideControls = false, onResolved, venueId, agentId }: { autoStart?: boolean; hideControls?: boolean; onResolved?: (payload: any) => void; venueId?: string; agentId?: string }) {
  const [uiState, setUiState] = useState<AgentState>("idle");
  const [partial, setPartial] = useState("");
  const [error, setError] = useState("");
  const [tabId, setTabId] = useState<string>("");
  const [itemId, setItemId] = useState<string>("");
  const [qty, setQty] = useState<number>(1);
  const [vendor, setVendor] = useState<any>(null);
  const [wakeConf, setWakeConf] = useState<number>(0.5);
  const [wakePhrase, setWakePhrase] = useState<string>("hey bev");
  const currentVenueId = venueId || "demo-venue";
  const currentAgentId = agentId || "demo-agent";

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const srRef = useRef<SpeechRecognition | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mrRef = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const trace = useRef(createClientTrace(currentVenueId, currentAgentId, "dg11-session"));

  const isConnectingRef = useRef(false);
  const shouldReconnectRef = useRef(false);
  const stateRef = useRef<AgentState>("idle");
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);

  const startWakeRef = useRef<() => Promise<void>>(async () => {});
  const startCmdRef = useRef<() => Promise<void>>(async () => {});
  const transitionToWakeRef = useRef<() => void>(() => {});
  const speakRef = useRef<(text: string) => Promise<void>>(async () => {});
  const speakingRef = useRef<boolean>(false);
  const shutdownRef = useRef<() => void>(() => {});
  const isShuttingDownRef = useRef<boolean>(false);
  const wakeListenerRef = useRef<SpeechRecognition | null>(null);
  const terminationPhrases = ["stop listening", "end call", "bye bev", "thanks bev", "shut down"];

  useEffect(() => { stateRef.current = uiState; }, [uiState]);

  useEffect(() => {
    console.log(`[VoiceAgent] Component loaded with venue: ${currentVenueId}, agent: ${currentAgentId}`);
    console.log(`[VoiceAgent] Component props:`, { venueId, agentId });
  }, [currentVenueId, currentAgentId, venueId, agentId]);

  useEffect(() => {
    fetch(`/api/settings/vendor?venueId=${currentVenueId}`).then((r) => r.json()).then((v) => {
      setVendor(v);
      const wc = Number(v?.wakeConfidenceMin ?? 0.5);
      if (!Number.isNaN(wc)) setWakeConf(wc);
    }).catch(() => {});
    
    // Load wake word settings
    fetch(`/api/settings/wakeword?venueId=${currentVenueId}`).then((r) => r.json()).then((data) => {
      if (data?.phrase) setWakePhrase(data.phrase);
      if (data?.maxDistance !== undefined) setWakeConf(data.maxDistance);
    }).catch(() => {});
  }, [currentVenueId]);

  // Autostart behavior for kiosk/runner when requested
  useEffect(() => {
    if (autoStart) {
      // Start directly in command mode for immediate UX
      startCmdRef.current();
    }
  }, [autoStart]);

  const pickMimeType = () => {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];
    for (const m of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) {
        return m;
      }
    }
    return undefined;
  };

  const cleanup = useCallback(() => {
    console.debug("[VA] cleanup()");
    if (retryTimeoutRef.current) { clearTimeout(retryTimeoutRef.current); retryTimeoutRef.current=null; }
    try { srRef.current?.stop(); } catch {}
    srRef.current = null;
    try { mrRef.current?.stop(); } catch {}
    mrRef.current = null;
    try { workletNodeRef.current?.disconnect(); } catch {}
    workletNodeRef.current = null;
    try { audioCtxRef.current?.close(); } catch {}
    audioCtxRef.current = null;
    try { mediaStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    mediaStreamRef.current = null;
    try { wsRef.current?.close(1000, "client_cleanup"); } catch {}
    wsRef.current = null;
    try { ttsAbortRef.current?.abort(); } catch {}
    ttsAbortRef.current = null;
    try { wakeListenerRef.current?.stop(); } catch {}
    wakeListenerRef.current = null;
  }, []);

  // Hard cleanup on unmount to avoid holding mic/WS when switching lanes
  useEffect(() => {
    return () => {
      try { mrRef.current?.stop(); } catch {}
      try { wsRef.current?.close(1000, "unmount"); } catch {}
      try { workletNodeRef.current?.disconnect(); } catch {}
      try { audioCtxRef.current?.close(); } catch {}
      try { mediaStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    };
  }, []);

  speakRef.current = async (text: string) => {
    console.debug("[VA] speak()", text);
    try {
      try { ttsAbortRef.current?.abort(); } catch {}
      const controller = new AbortController();
      ttsAbortRef.current = controller;
      speakingRef.current = true;
      // Prefer edge TTS via ws-server for ultra-low latency if available
      let ttsUrl = "/api/voice/tts";
      try {
        const probe = await fetch("/api/voice/ws-url");
        if (probe.ok) {
          const { url } = await probe.json();
          const http = String(url).replace("ws://", "http://").replace("wss://", "https://");
          ttsUrl = `${http.replace(/\/$/, "")}/tts`;
        }
      } catch {}
      const r = await fetch(ttsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, venueId: currentVenueId }),
        signal: controller.signal,
      });
      if (!r.ok) throw new Error(`TTS failed: ${r.status}`);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const el = audioRef.current;
      if (!el) return;
      el.src = url;
      // Stream-like playback: load immediately and play without waiting for full download
      try {
        await el.play();
      } catch {
        setError("Tap to enable audio playback.");
      }
      // Auto-clear partial after TTS begins to avoid lingering text
      setTimeout(() => setPartial(""), 250);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error("[VA] speak error:", err);
      setError(`TTS error: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      speakingRef.current = false;
    }
  };

  transitionToWakeRef.current = () => {
    console.debug("[VA] transitionToWake()");
    shouldReconnectRef.current = false;
    cleanup();
    setUiState("wake-listening");
    setPartial(`Listening for "${wakePhrase}"...`);
    startWakeRef.current();
  };
  
  shutdownRef.current = () => {
    console.debug("[VA] shutdown()");
    isShuttingDownRef.current = true;
    shouldReconnectRef.current = false;
    cleanup();
    setUiState("idle");
    setPartial("Voice agent shut down. Click Start to begin.");
    setError("");
  };

  startCmdRef.current = async () => {
    console.log("[VoiceAgent] startCmdRef.current() - starting command mode");
    if (isConnectingRef.current) return;
    isConnectingRef.current = true;

    console.debug("[VA] startCmd()");
    setError("");
    setUiState("command-mode");
    shouldReconnectRef.current = true;

    try { srRef.current?.stop(); } catch {}

    try {
      // Resolve WS URL dynamically (handles port fallback from ws-server)
      let wsUrl = WS_URL_DEFAULT;
      try {
        const r = await fetch("/api/voice/ws-url");
        if (r.ok) {
          const j = await r.json();
          if (j?.url) wsUrl = String(j.url);
        }
      } catch {}
      if (!mediaStreamRef.current) {
        // Check for available audio devices first
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasAudioInput = devices.some(device => device.kind === 'audioinput');
        
        if (!hasAudioInput) {
          throw new Error("No microphone found. Please connect a microphone and try again.");
        }

        console.debug("[VA] Audio devices found:", devices.filter(d => d.kind === 'audioinput').length);
        
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation:true, noiseSuppression:true, channelCount:1, sampleRate:48000 },
          video: false,
        });
      }

       const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = async () => {
        console.debug("[WS] open");
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 48000 });
          audioCtxRef.current = ctx as AudioContext;
          const source = ctx.createMediaStreamSource(mediaStreamRef.current!);
          // Load worklet
          ctx.audioWorklet ? Promise.resolve() : Promise.reject(new Error("AudioWorklet not supported"));
          await ctx.audioWorklet.addModule("/audio-worklet.js");
          const node = new AudioWorkletNode(ctx, "pcm16-downsampler", { processorOptions: { outSampleRate: 16000 } });
          workletNodeRef.current = node;
          node.port.onmessage = (ev: MessageEvent) => {
          if (ws.readyState !== WebSocket.OPEN) return;
            const buf = ev.data as ArrayBuffer;
          // Dynamic backpressure: if we are speaking, throttle upstream frames to avoid barge-in overlap
          if (speakingRef.current) {
            // Drop every other packet while speaking to reduce echo-triggered ASR
            // Use a simple monotonic counter on the worklet dispatch
            const drop = (node as any)._dgDropCounter = (((node as any)._dgDropCounter || 0) + 1);
            if ((drop % 2) !== 0) return;
          }
          try { ws.send(buf); } catch {}
          };
          source.connect(node);
          // Prevent local monitoring/echo; do not connect to destination
          // node.connect(ctx.destination);
          const t0 = performance.now();
           logEvent({ venueId: currentVenueId, agentId: currentAgentId, eventType: "voice_start" });
          ingestSpan(trace.current, "voice.start", t0);
        } catch (err) {
          console.error("[VA] audio pipeline error:", err);
          setError("Failed to start audio processing.");
        }
      };

       // Heartbeat timer (no forced close; keep connection alive without interrupting speech)
      const heartbeat = { interval: 20000 };
      let hbTimer: ReturnType<typeof setInterval> | null = null;

      // start heartbeat after open
      ws.addEventListener("open", () => {
        hbTimer = setInterval(() => {
          if (ws.readyState !== WebSocket.OPEN) return;
          try {
            ws.send(JSON.stringify({ type: "ping", t: Date.now() }));
          } catch {}
        }, heartbeat.interval);
      });

       ws.onmessage = async (e) => {
        const raw = typeof e.data === "string" ? e.data : "";
        // eslint-disable-next-line no-console
        console.debug("[WS] message:", raw);
        try {
          const msg = raw ? JSON.parse(raw) : undefined;
          if (!msg || !msg.type) return;

          if (msg.type === "pong") return;

           if (msg.type === "asr.partial") {
          const text = (msg.text || "").toLowerCase().trim();
          setPartial(msg.text || "");
          console.log(`[Deepgram] ${msg.isFinal ? 'FINAL' : 'partial'}: "${msg.text}"`);
          const t0p = performance.now();
          ingestSpan(trace.current, "asr.partial_first", t0p, { lane: "dg11" });
          logEvent({ venueId: currentVenueId, agentId: currentAgentId, eventType: "asr_partial" });
            
           // If we're currently speaking, ignore partials to prevent echo re-trigger
           if (speakingRef.current && !msg.isFinal) return;

            // Check for termination phrases
            if (msg.isFinal && text) {
              for (const phrase of terminationPhrases) {
                if (text.includes(phrase)) {
                  if (phrase === "shut down") {
                    await speakRef.current("Shutting down. Goodbye!");
                    setTimeout(() => shutdownRef.current(), 1500);
                    return;
                  } else {
                    await speakRef.current("Going back to wake word mode.");
                    setTimeout(() => transitionToWakeRef.current(), 1500);
                    return;
                  }
                }
              }
            }
            
            if (msg.isFinal && msg.text?.trim()) {
              logEvent({ venueId: currentVenueId, agentId: currentAgentId, eventType: "asr_final" });
              try {
                const venueId = currentVenueId;
                const agentId = currentAgentId;
                const t0n = performance.now();
                const r = await fetch("/api/nlu/resolve-run", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "x-trace-id": trace.current.traceId },
                  body: JSON.stringify({ text: msg.text, venueId, agentId }),
                });
                ingestSpan(trace.current, "nlu.call", t0n, { textLen: msg.text.length });
                ingestSpan(trace.current, "nlu.reply_wait", performance.now(), { ok: r.ok });
                const data = await r.json();
                try { onResolved?.(data); } catch {}
                if (data?.say) void speakRef.current(data.say);
              } catch (err) {
                console.warn("[VA] final ASR resolve-run failed", err);
              }
            }
          } else if (msg.type === "error") {
            setError(msg.message || "Server error");
          }
        } catch (err) {
          console.warn("[WS] onmessage parse error", err);
        }
      };

      ws.onerror = (event) => {
        console.error("[WS] error:", event);
        setError("WebSocket connection failed");
      };

      ws.onclose = (event) => {
        console.log("[WS] close:", event.code, event.reason);
        if (hbTimer) clearInterval(hbTimer);
        try { mrRef.current?.stop(); } catch {}
        mrRef.current = null;

        if (shouldReconnectRef.current && event.code !== 1000) {
          if (!retryTimeoutRef.current && !isShuttingDownRef.current) {
            retryTimeoutRef.current = setTimeout(() => {
              retryTimeoutRef.current = null;
              if (stateRef.current === "command-mode") startCmdRef.current();
            }, 2000);
          }
        } else if (!isShuttingDownRef.current) {
          transitionToWakeRef.current();
        }
      };
    } catch (err) {
      console.error("[VA] start cmd error:", err);
      setUiState("error");
      setError(err instanceof Error ? err.message : "Unknown cmd error");
    } finally {
      isConnectingRef.current = false;
    }
  };

  startWakeRef.current = async () => {
    console.log("[VoiceAgent] startWake() - starting wake word listening");
    setUiState("wake-listening");
    setError("");
    setPartial(`Listening for "${wakePhrase}"...`);
    shouldReconnectRef.current = false;
    isShuttingDownRef.current = false;
    
    if (wsRef.current || mrRef.current) cleanup();
    
    // Request microphone permission first
    try {
      if (!mediaStreamRef.current) {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
          video: false,
        });
      }
    } catch (err) {
      console.error("[VA] Failed to get microphone access:", err);
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
        
        // Simple check for wake phrase
        if (chunk.includes(wakePhrase.toLowerCase())) {
          console.debug("[VA] Wake word detected!");
          rec.stop();
          wakeListenerRef.current = null;
          speakRef.current("Yes, I'm listening.").then(() => {
            startCmdRef.current();
          });
        }
      };
      
      rec.onerror = (e: any) => {
        console.error("[VA] Wake word recognition error:", e);
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
      console.error("[VA] Failed to start wake word listener:", err);
      setError("Failed to start wake word listener");
    }
  };

  useEffect(() => {
    console.debug("[VA] mount; WS default=", WS_URL_DEFAULT);
    // ensure audio element will autoplay without gesture if possible
    try { if (audioRef.current) audioRef.current.autoplay = true; } catch {}
    // Start in idle mode - user must click Start
    setUiState("idle");
    setPartial("Click Start to begin voice interaction");
    return () => cleanup();
  }, [cleanup]);

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
      
      {/* Status Display */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/80">Voice Agent Status</h3>
          <div className={`status-${uiState === 'error' ? 'disconnected' : uiState === 'command-mode' ? 'connected' : uiState === 'wake-listening' ? 'warning' : 'idle'}`}>
            <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
            <span className="text-xs font-medium capitalize">
              {uiState === 'wake-listening' ? 'Wake Word' : uiState === 'command-mode' ? 'Active' : uiState}
            </span>
          </div>
        </div>
        
        {error && (
          <div className="status-disconnected">
            <span className="text-xs">{error}</span>
          </div>
        )}
        
        {partial && (
          <div className="glass-panel p-3 rounded-neuro-sm">
            <div className="text-xs text-white/60 mb-1">Live Transcription</div>
            <div className="text-sm text-white font-mono">{partial}</div>
          </div>
        )}
      </div>

      {!hideControls && (
        <div className="space-y-4">
          {/* Control Buttons */}
          <div className="flex gap-3">
            {uiState === "idle" && (
              <button
                className="neuro-button bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-400/30 hover:from-emerald-400 hover:to-emerald-500 shadow-glow flex-1"
                onClick={() => {
                  console.log("[VoiceAgent] Start Wake button clicked");
                  startWakeRef.current();
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  Start
                </div>
              </button>
            )}
            {uiState === "wake-listening" && (
              <button
                className="neuro-button bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400/30 hover:from-amber-400 hover:to-amber-500 shadow-glow flex-1"
                onClick={() => {
                  console.log("[VoiceAgent] Direct Mode button clicked");
                  startCmdRef.current();
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  Skip to Command Mode
                </div>
              </button>
            )}
            {(uiState === "command-mode" || uiState === "wake-listening") && (
              <button
                className="neuro-button flex-1"
                onClick={() => shutdownRef.current()}
              >
                Shut Down
              </button>
            )}
          </div>

          {/* Configuration Panel */}
          <div className="glass-panel p-4 space-y-4">
            <h4 className="text-sm font-medium text-white/80 mb-3">Configuration</h4>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white/70">Tab ID</label>
                <input 
                  className="neuro-input w-full text-sm"
                  value={tabId} 
                  onChange={(e) => setTabId(e.target.value)} 
                  placeholder="Tab UUID"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white/70">Item ID</label>
                <input 
                  className="neuro-input w-full text-sm"
                  value={itemId} 
                  onChange={(e) => setItemId(e.target.value)} 
                  placeholder="Item UUID"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white/70">Quantity</label>
                <input 
                  className="neuro-input w-full text-sm"
                  type="number" 
                  min={1} 
                  value={qty} 
                  onChange={(e) => setQty(Number(e.target.value || 1))}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <audio ref={audioRef} hidden />
    </div>
  );
}
