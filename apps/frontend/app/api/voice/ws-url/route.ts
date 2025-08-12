export const runtime = 'nodejs';

export async function GET() {
  // Discover the first listening ws-server port for lowest friction
  const candidates = [
    process.env.NEXT_PUBLIC_VOICE_WS_URL,
    process.env.VOICE_WS_URL,
    `ws://localhost:${process.env.NEXT_PUBLIC_VOICE_WS_PORT || ""}`,
    `ws://localhost:${process.env.VOICE_WS_PORT || ""}`,
    'ws://localhost:8787',
    'ws://localhost:8788',
    'ws://localhost:8789',
  ].filter(Boolean) as string[];

  for (const u of candidates) {
    try {
      const httpProbe = u.replace("ws://", "http://").replace("wss://", "https://");
      const r = await fetch(httpProbe, { cache: 'no-store' });
      if (r.ok) return Response.json({ url: u });
    } catch {}
  }
  return Response.json({ url: 'ws://localhost:8787' });
}