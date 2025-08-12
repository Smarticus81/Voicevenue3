export async function handler(params: any) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.TOOLS_BASE_URL || 'http://localhost:3000';
  const r = await fetch(`${base}/api/venue-linking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || 'Failed to link venues');
  return data;
}


