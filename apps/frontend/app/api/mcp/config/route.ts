export const runtime = 'nodejs';

export async function GET() {
  try {
    const { loadMcpConfig } = await import('../../../../server/mcp/mcp-config-loader');
    const config = await loadMcpConfig();
    return new Response(JSON.stringify(config), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ 
      ok: false, 
      error: e?.message || 'Failed to load config' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
