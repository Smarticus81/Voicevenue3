export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json(); // { provider, enabledTools[], serverUrl?, token? }
    const { saveMcpConfig } = await import('../../../../server/mcp/mcp-config-loader');
    
    await saveMcpConfig(body);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'save failed' }), { status: 500 });
  }
}

