// apps/frontend/app/api/voice/tts/route.ts
import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { venueSettings } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_API_KEY;
const ELEVEN_VOICE_DEFAULT = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Rachel (universal)
const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.OAI_API_KEY;
const OPENAI_TTS_MODEL = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";

const ELEVEN_NAME_TO_ID: Record<string, string> = {
  rachel: "21m00Tcm4TlvDq8ikWAM",
  adam: "pNInz6obpgDQGcFmaJgB",
  bella: "EXAVITQu4vr4xnSDxMaL",
  dorothy: "ThT5KcBeYPX3keUQqHPh",
  antoni: "ErXwobaYiN019PkySvjV",
};

function resolveElevenVoiceId(input?: string): string {
  if (!input) return ELEVEN_VOICE_DEFAULT;
  const s = String(input).trim();
  if (/^[A-Za-z0-9_-]{16,}$/.test(s)) return s; // looks like an ID
  const id = ELEVEN_NAME_TO_ID[s.toLowerCase()];
  return id || ELEVEN_VOICE_DEFAULT;
}

async function elevenLabsTTS(text: string, voiceIdOrName?: string) {
  const voiceId = resolveElevenVoiceId(voiceIdOrName);
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVEN_KEY as string,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text: text || "",
      model_id: "eleven_turbo_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!r.ok) throw new Error(`ElevenLabs error: ${r.status}`);
  const buf = await r.arrayBuffer();
  return new Uint8Array(buf);
}

async function openaiTTS(text: string, voiceName?: string) {
  const voice = voiceName || "sage";
  const r = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: OPENAI_TTS_MODEL, voice, input: text || "", format: "mp3" }),
  });
  if (!r.ok) throw new Error(`OpenAI TTS error: ${r.status}`);
  const buf = await r.arrayBuffer();
  return new Uint8Array(buf);
}

function toneWav(durationMs = 500, sampleRate = 16000, freq = 440) {
  const samples = Math.floor((durationMs / 1000) * sampleRate);
  const buf = new ArrayBuffer(44 + samples * 2);
  const dv = new DataView(buf);
  let p = 0;
  const writeString = (s: string) => { for (let i=0;i<s.length;i++) dv.setUint8(p++, s.charCodeAt(i)); };
  const writeUint32 = (v: number) => { dv.setUint32(p, v, true); p+=4; };
  const writeUint16 = (v: number) => { dv.setUint16(p, v, true); p+=2; };
  writeString("RIFF"); writeUint32(36 + samples * 2); writeString("WAVE"); writeString("fmt ");
  writeUint32(16); writeUint16(1); writeUint16(1); writeUint32(sampleRate);
  writeUint32(sampleRate * 2); writeUint16(2); writeUint16(16); writeString("data");
  writeUint32(samples * 2);
  for (let i = 0; i < samples; i++) { const t = i / sampleRate; const s = Math.sin(2 * Math.PI * freq * t); dv.setInt16(p, Math.floor(s * 0.3 * 32767), true); p += 2; }
  return new Uint8Array(buf);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({ text: "", venueId: "demo-venue" }));
    const text = body?.text || "";
    const venueId = body?.venueId || "demo-venue";
    const voice = body?.voice as string | undefined;

    // read venue settings to pick provider and voice
    const rows = await db.select().from(venueSettings).where(eq(venueSettings.venueId, venueId));
    const vs = rows[0];

    // Prefer env voice ID unless a plausible ElevenLabs voice ID is configured in settings
    const configuredElevenVoice = (vs?.ttsVoice || "").trim();
    const looksLikeElevenId = configuredElevenVoice && /^[A-Za-z0-9_-]{16,}$/.test(configuredElevenVoice);

    // Determine provider order: explicit OpenAI -> ElevenLabs; fallback: ElevenLabs if key, else OpenAI if key
    const wantOpenAI = vs?.ttsProvider === "openai";

    if (wantOpenAI && OPENAI_KEY) {
      const mp3 = await openaiTTS(text, (vs?.realtimeVoice || voice || "sage"));
      return new NextResponse(mp3, { status: 200, headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "X-TTS-Provider": "openai" } });
    }

    if (ELEVEN_KEY) {
      try {
        const mp3 = await elevenLabsTTS(text, voice || configuredElevenVoice || ELEVEN_VOICE_DEFAULT);
        return new NextResponse(mp3, { status: 200, headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "X-TTS-Provider": "elevenlabs" } });
      } catch (e) {
        // graceful fallback to OpenAI TTS if available
        if (OPENAI_KEY) {
          const mp3 = await openaiTTS(text, (vs?.realtimeVoice || voice || "sage"));
          return new NextResponse(mp3, { status: 200, headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "X-TTS-Provider": "openai-fallback" } });
        }
        throw e;
      }
    }

    if (!wantOpenAI && OPENAI_KEY) {
      const mp3 = await openaiTTS(text, (vs?.realtimeVoice || voice || "sage"));
      return new NextResponse(mp3, { status: 200, headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "X-TTS-Provider": "openai-fallback" } });
    }

    // final fallback tone
    const wav = toneWav(500, 16000, 587.33);
    return new NextResponse(wav, { status: 200, headers: { "Content-Type": "audio/wav", "Cache-Control": "no-store", "X-TTS-Provider": "tone" } });
  } catch (err: any) {
    const wav = toneWav(300, 16000, 880);
    return new NextResponse(wav, { status: 200, headers: { "Content-Type": "audio/wav", "X-TTS-Error": err?.message || "unknown" } });
  }
}


