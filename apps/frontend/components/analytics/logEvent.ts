export async function logEvent(payload: {
  venueId: string;
  agentId: string;
  eventType: string;
  latencyMs?: number;
  meta?: any;
}) {
  try {
    const base = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
    await fetch(`${base}/api/analytics/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {}
}


