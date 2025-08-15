// apps/frontend/server/voice/ws-server.ts
/* eslint-disable no-console */
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import fs from "fs";
import path from "path";

// Minimal env loader (no deps) so this standalone server can read .env files
function loadEnv() {
  const candidates = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "apps/frontend/.env.local"),
    path.resolve(process.cwd(), "apps/frontend/.env"),
  ];
  for (const file of candidates) {
    try {
      if (!fs.existsSync(file)) continue;
      const content = fs.readFileSync(file, "utf8");
      for (const line of content.split(/\r?\n/)) {
        if (!line || line.trim().startsWith("#")) continue;
        const idx = line.indexOf("=");
        if (idx === -1) continue;
        const key = line.slice(0, idx).trim();
        let value = line.slice(1 + idx).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
        if (!(key in process.env)) process.env[key] = value;
      }
      console.log(`[ENV] loaded ${file}`);
    } catch {}
  }
}

loadEnv();

const PORT = Number(process.env.NEXT_PUBLIC_VOICE_WS_PORT || process.env.VOICE_WS_PORT || 8787);
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || process.env.DG_API_KEY;
const DEEPGRAM_MODEL = (process.env.DEEPGRAM_MODEL || "nova-2").trim();
const DG_ENABLE_UTTERANCES = String(process.env.DG_ENABLE_UTTERANCES || "true").toLowerCase() !== "false";
const DG_ENDPOINTING_MS = String(process.env.DG_ENDPOINTING_MS || "200");
const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_API_KEY;
const ELEVEN_VOICE_DEFAULT = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Rachel
const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.OAI_API_KEY;
const OPENAI_TTS_MODEL = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";

async function readJson(req: http.IncomingMessage): Promise<any> {
  return await new Promise((resolve) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); } catch { resolve({}); }
    });
  });
}

async function elevenLabsTTS(text: string, voiceId?: string): Promise<Uint8Array> {
  const id = (voiceId || ELEVEN_VOICE_DEFAULT).trim();
  // Use streaming endpoint with optimize_streaming_latency for lowest latency
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(id)}/stream?optimize_streaming_latency=3`;
  const r = await fetch(url, {
    method: "POST",
    headers: { 
      "xi-api-key": String(ELEVEN_KEY), 
      "Content-Type": "application/json", 
      Accept: "audio/mpeg" 
    },
    body: JSON.stringify({ 
      text, 
      model_id: "eleven_turbo_v2_5", // Latest turbo model
      voice_settings: { 
        stability: 0.5, 
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      } 
    }),
  });
  if (!r.ok) {
    const err = await r.text().catch(() => "");
    console.error(`[ElevenLabs] TTS failed (${r.status}):`, err);
    throw new Error(`ElevenLabs ${r.status}`);
  }
  const buf = new Uint8Array(await r.arrayBuffer());
  return buf;
}

async function openaiTTS(text: string, voiceName = "sage"): Promise<Uint8Array> {
  const r = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { 
      Authorization: `Bearer ${OPENAI_KEY}`, 
      "Content-Type": "application/json" 
    },
    body: JSON.stringify({ 
      model: "tts-1", // Use tts-1 for lower latency
      voice: voiceName, 
      input: text || "", 
      response_format: "mp3",
      speed: 1.0
    }),
  });
  if (!r.ok) {
    const err = await r.text().catch(() => "");
    console.error(`[OpenAI] TTS failed (${r.status}):`, err);
    throw new Error(`OpenAI TTS ${r.status}`);
  }
  return new Uint8Array(await r.arrayBuffer());
}

const server = http.createServer(async (req, res) => {
  try {
    const url = req.url || "/";
    if (url === "/vitals") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ 
        ok: true, 
        openai: Boolean(OPENAI_KEY),
        deepgram: Boolean(DEEPGRAM_API_KEY),
        model: OPENAI_KEY ? "gpt-4o-realtime" : DEEPGRAM_MODEL 
      }));
      return;
    }
    if (url === "/tts" && req.method === "POST") {
      try {
        const body = await readJson(req);
        const text = String(body?.text || "");
        const voice = String(body?.voice || "");
        let audio: Uint8Array | null = null;
        let provider = "none";
        
        // Try ElevenLabs first if configured
        if (ELEVEN_KEY) {
          try { 
            console.log(`[TTS] Attempting ElevenLabs TTS for: "${text.substring(0, 50)}..."`);
            audio = await elevenLabsTTS(text, voice || ELEVEN_VOICE_DEFAULT); 
            provider = "elevenlabs";
          } catch (e) { 
            console.error("[TTS] ElevenLabs failed:", e);
            audio = null as any; 
          }
        }
        
        // Fallback to OpenAI if ElevenLabs fails or not configured
        if (!audio && OPENAI_KEY) {
          try {
            console.log(`[TTS] Attempting OpenAI TTS for: "${text.substring(0, 50)}..."`);
            audio = await openaiTTS(text, voice || "sage");
            provider = "openai";
          } catch (e) {
            console.error("[TTS] OpenAI failed:", e);
          }
        }
        
        if (!audio) {
          res.statusCode = 503;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: false, error: "no_tts_provider" }));
          return;
        }
        
        console.log(`[TTS] Successfully generated ${audio.length} bytes via ${provider}`);
        res.statusCode = 200;
        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("X-TTS-Provider", provider);
        res.end(Buffer.from(audio));
        return;
      } catch (e: any) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false, error: e?.message || "tts_failed" }));
        return;
      }
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("ok");
  } catch {
    try { res.end(); } catch {}
  }
});
const wss = new WebSocketServer({ server });
wss.on("error", (err) => {
  // Avoid crashing on EADDRINUSE propagated to ws layer when HTTP server fails to bind
  console.warn("[WS] server error:", (err as any)?.message || err);
});

type ClientState = { upstream?: WebSocket | null; chunks: number; bytes: number };

wss.on("connection", (ws: WebSocket, req) => {
  console.log("[WS] client connected", req.socket.remoteAddress);
  const state: ClientState = { upstream: null, chunks: 0, bytes: 0 };

  // OpenAI Realtime API WebSocket connection
  let openaiWs: WebSocket | null = null;
  let voiceState: 'wake_listening' | 'conversing' | 'shutdown' = 'wake_listening';

  const useDeepgram = Boolean(DEEPGRAM_API_KEY);
  const useOpenAI = Boolean(OPENAI_KEY);

  // Prioritize OpenAI if available, otherwise use Deepgram
  console.log(`[WS] Connection capabilities: OpenAI: ${useOpenAI ? '✓' : '✗'}, Deepgram: ${useDeepgram ? '✓' : '✗'}`);

  if (useDeepgram && !useOpenAI) {
    // Enhanced params for better speech detection
    const qs = new URLSearchParams({
      model: DEEPGRAM_MODEL,
      encoding: "linear16",
      sample_rate: "16000",
      channels: "1",
      interim_results: "true",
      language: "en-US",
      smart_format: "true",
      punctuate: "true",
      utterances: DG_ENABLE_UTTERANCES ? "true" : "false",
      vad_events: "true",
      endpointing: DG_ENDPOINTING_MS,
      filler_words: "true",
      numerals: "true"
    }).toString();

    const dgUrl = `wss://api.deepgram.com/v1/listen?${qs}`;
    console.log(`[DG] connecting ${dgUrl.replace(/(model=)[^&]+/, '$1***')}`);
    console.log(`[DG] model: ${DEEPGRAM_MODEL}, API key: ${DEEPGRAM_API_KEY ? '✓' : '✗'}`);
    const upstream = new WebSocket(dgUrl, { headers: { Authorization: `Token ${DEEPGRAM_API_KEY}` } });
    state.upstream = upstream;

    let msgCount = 0;

    upstream.on("open", () => {
      console.log("[DG] upstream connected");
      // New Deepgram WS API v1 doesn't require a Configure message when params are in the URL.
      // Sending an incompatible 'configure' causes schema errors. Rely on query params only.
    });

    upstream.on("unexpected-response", (_req: any, res: any) => {
      try {
        let body = "";
        res.on("data", (c: any) => (body += c));
        res.on("end", () => console.error("[DG] handshake 400/err body:", body));
      } catch {}
    });

    upstream.on("message", (data: WebSocket.RawData) => {
      try {
        const text = typeof data === "string" ? data : data.toString();
        msgCount++;
        if (msgCount <= 3) console.log("[DG] rx:", text);
        const msg = JSON.parse(text);
        if (msg?.type === "error") { console.error("[DG] error:", msg); return; }
        if (msg?.type !== "Results") return;
        const alt = msg?.channel?.alternatives?.[0];
        const transcript: string = (alt?.transcript || "").trim();
        const isFinal: boolean = Boolean(msg?.is_final || msg?.speech_final);
        const confidence = alt?.confidence || 0;
        
        // Always log what Deepgram sends us, even empty transcripts
        if (msgCount <= 10 || transcript || isFinal) {
          console.log(`[DG] ${isFinal ? "FINAL" : "partial"} (confidence: ${confidence.toFixed(2)}): "${transcript}"`);
        }
        
        if (transcript) {
          // Stream partials early; only send finals when is_final
          if (!isFinal) {
            ws.send(JSON.stringify({ type: "asr.partial", text: transcript, isFinal: false }));
          } else {
            console.log(`[DG→Client] Sending FINAL: "${transcript}"`);
            ws.send(JSON.stringify({ type: "asr.partial", text: transcript, isFinal: true }));
          }
        } else if (isFinal) {
          console.log(`[DG] Empty final transcript - speech may not be detected properly`);
        }
      } catch (e) {
        console.warn("[DG] parse error", e);
      }
    });

    upstream.on("error", (err) => {
      console.error("[DG] upstream error", err);
      console.error("[DG] Check DEEPGRAM_MODEL and encoding/sample_rate; 400 often indicates invalid params or model name.");
      try { ws.send(JSON.stringify({ type: "error", message: "ASR upstream error" })); } catch {}
    });

    upstream.on("close", (code, reason) => {
      console.log("[DG] upstream closed", code, reason.toString());
    });
  }

  // Initialize OpenAI Realtime connection
  const initOpenAIConnection = () => {
    if (!useOpenAI || openaiWs) return;
    
    console.log("[OpenAI] Connecting to Realtime API...");
    openaiWs = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01", {
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "OpenAI-Beta": "realtime=v1"
      }
    });

    openaiWs.onopen = () => {
      console.log("[OpenAI] Connected to Realtime API");
      
      // Configure session with wake word detection and automatic tool execution
      openaiWs?.send(JSON.stringify({
        type: "session.update",
        session: {
          modalities: ["text", "audio"],
          instructions: `You are Bev, the AI voice assistant for Knotting Hill Place Estate.
Be ultra-concise (<=15 words). Speak in past tense during order operations.
Never ask "anything else"; stop talking on termination phrases and return to wake mode.
Use tools for ALL business actions — no generic replies.

WAKE WORD PROTOCOL:
- Start in wake word mode - only respond to "Hey Bev", "Hi Bev", or "Bev"
- When wake word detected, say "Hello! How can I help you?" and enter conversation mode
- Ignore all other speech until wake word is detected

CONVERSATION MODE:
- Process drink/food orders using cart_add tool
- Answer menu questions using search_drinks tool
- Keep responses ultra-concise (<=15 words)

TERMINATION PROTOCOL:
- On "stop listening", "end call", "bye bev", "thanks bev": return to wake word mode
- On "shut down", "shutdown", "turn off": complete shutdown

CRITICAL TOOL EXECUTION:
- Process complete orders in one fluid conversation turn
- Use multiple tools sequentially without waiting for user permission between tools
- When handling orders: 1) Add all items to cart 2) View cart 3) Create order 4) Confirm
- Execute all necessary tools automatically as part of processing the complete request
- Never pause between tool calls asking for permission`,
          voice: "shimmer",
          temperature: 0.2,             // Lower temperature for faster, more predictable responses
          max_tokens: 800,              // Shorter responses for lower latency
          input_audio_format: "pcm16",
          output_audio_format: "pcm16",
          input_audio_transcription: {
            model: "whisper-1"
          },
          turn_detection: {
            type: "server_vad",
            threshold: 0.15,              // Ultra-sensitive for instant detection
            prefix_padding_ms: 100,       // Minimal padding for fastest response
            silence_duration_ms: 300      // Very short silence detection
          },
          tool_choice: "auto",
          parallel_tool_calls: true,
          tools: [
            {
              type: "function",
              name: "cart_add",
              description: "Add a drink to the cart. Use this for each item the user wants to order.",
              parameters: {
                type: "object",
                properties: {
                  drink_name: { type: "string", description: "Name of the drink" },
                  quantity: { type: "number", description: "Quantity to add", default: 1 }
                },
                required: ["drink_name"]
              }
            },
            {
              type: "function",
              name: "search_drinks",
              description: "Search for drinks by name or category. Use when user asks about menu items.",
              parameters: {
                type: "object",
                properties: {
                  query: { type: "string", description: "Search query for drinks" }
                },
                required: ["query"]
              }
            },
            {
              type: "function",
              name: "cart_view",
              description: "View current cart contents. Use this to check cart before finalizing order.",
              parameters: {
                type: "object",
                properties: {}
              }
            },
            {
              type: "function",
              name: "cart_create_order",
              description: "Create an order from the cart. Use this to finalize the order after adding items.",
              parameters: {
                type: "object",
                properties: {}
              }
            }
          ]
        }
      }));
    };

    openaiWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data.toString());
        console.log(`[OpenAI] ${data.type}`);
        
        // Forward all OpenAI messages to client
        ws.send(JSON.stringify(data));
        
        // Handle state changes
        if (data.type === "conversation.item.input_audio_transcription.completed") {
          const transcript = data.transcript.toLowerCase();
          console.log(`[OpenAI] Transcript: "${transcript}"`);
          
          // Wake word detection
          if (voiceState === 'wake_listening') {
            if (transcript.includes('hey bev') || transcript.includes('hi bev') || transcript.includes('bev')) {
              console.log("[OpenAI] Wake word detected, entering conversation mode");
              voiceState = 'conversing';
            }
          }
          
          // Termination detection
          if (voiceState === 'conversing') {
            if (transcript.includes('stop listening') || transcript.includes('bye bev') || transcript.includes('thanks bev')) {
              console.log("[OpenAI] Termination phrase detected, returning to wake word mode");
              voiceState = 'wake_listening';
            } else if (transcript.includes('shut down') || transcript.includes('shutdown')) {
              console.log("[OpenAI] Shutdown command detected");
              voiceState = 'shutdown';
            }
          }
        }
      } catch (e) {
        console.error("[OpenAI] Message parse error:", e);
      }
    };

    openaiWs.onerror = (error) => {
      console.error("[OpenAI] WebSocket error:", error);
    };

    openaiWs.onclose = () => {
      console.log("[OpenAI] Connection closed");
      openaiWs = null;
    };
  };

  ws.on("message", (data) => {
    // Handle client messages
    try {
      if (typeof data === "string") {
        const msg = JSON.parse(data);
        
        if (msg?.type === "ping") {
          try { ws.send(JSON.stringify({ type: "pong", t: msg.t })); } catch {}
          return;
        }
        
        // Handle session configuration from client
        if (msg?.type === "session.update") {
          console.log("[WS] Client requested OpenAI session, initializing...");
          if (useOpenAI) {
            initOpenAIConnection();
          } else {
            console.log("[WS] OpenAI not available, client will fallback");
            ws.send(JSON.stringify({ type: "error", message: "OpenAI not configured" }));
          }
          return;
        }
        
        // Forward other JSON messages to OpenAI
        if (openaiWs?.readyState === WebSocket.OPEN) {
          openaiWs.send(JSON.stringify(msg));
        }
        return;
      }
    } catch {}

    if (data instanceof Buffer || data instanceof ArrayBuffer) {
      state.chunks += 1;
      state.bytes += (data as Buffer).byteLength || (data as ArrayBuffer).byteLength;

      // Forward audio to OpenAI if connected
      if (openaiWs?.readyState === WebSocket.OPEN) {
        // Convert buffer to base64 for OpenAI
        const audioBase64 = Buffer.from(data as Buffer).toString('base64');
        openaiWs.send(JSON.stringify({
          type: "input_audio_buffer.append",
          audio: audioBase64
        }));
        
        if (state.chunks % 10 === 0) {
          console.log(`[WS→OpenAI] forwarded ~${state.bytes} bytes across ${state.chunks} chunks`);
        }
      } else if (state.upstream && state.upstream.readyState === WebSocket.OPEN) {
        // Fallback to Deepgram
        state.upstream.send(data);
        if (state.chunks % 10 === 0) console.log(`[WS→DG] forwarded ~${state.bytes} bytes across ${state.chunks} chunks`);
        try {
          if (state.chunks % 200 === 0) {
            (state.upstream as WebSocket).ping?.();
          }
        } catch {}
      } else if (!DEEPGRAM_API_KEY && !OPENAI_KEY) {
        // Demo-friendly fallback
        const samples = [
          { text: "hey bev add a mimosa", final: true },
          { text: "hey bev what drinks do you have", final: true },
          { text: "add one margarita please", final: true },
        ];
        if (state.chunks % 12 === 0) {
          const pick = samples[(Math.floor(state.chunks / 12)) % samples.length];
          ws.send(JSON.stringify({ type: "asr.partial", text: pick.text, isFinal: pick.final }));
          console.log(`[WS(fake)] emitted: ${pick.text}`);
        }
      }
    } else {
      console.log("[WS] non-binary message:", (data as any)?.toString?.() ?? "");
    }
  });

  ws.on("close", (code, reason) => {
    console.log("[WS] closed", code, reason.toString());
    try { state.upstream?.close(1000, "client_closed"); } catch {}
    state.upstream = null;
    try { openaiWs?.close(1000, "client_closed"); } catch {}
    openaiWs = null;
  });

  ws.on("error", (err) => {
    console.error("[WS] error", err);
  });
});

function listenWithFallback(startPort: number, maxTries = 10) {
  let tries = 0;
  function tryListen(port: number) {
    try {
      server
        .listen(port, () => {
          const provider = OPENAI_KEY ? "openai+deepgram" : DEEPGRAM_API_KEY ? "deepgram" : "fake";
          console.log(`[WS] listening on ws://localhost:${port} (${provider})`);
          console.log(`[WS] Primary: ${OPENAI_KEY ? "OpenAI Realtime API" : "Deepgram"}`);
        })
        .on("error", (err: any) => {
          if (err?.code === "EADDRINUSE" && tries < maxTries) {
            tries++;
            const next = port + 1;
            console.warn(`[WS] ${port} in use, trying ${next}…`);
            tryListen(next);
          } else {
            console.error("[WS] fatal listen error:", err);
          }
        });
    } catch (e) {
      console.error("[WS] listen exception:", e);
    }
  }
  tryListen(startPort);
}

listenWithFallback(PORT);


