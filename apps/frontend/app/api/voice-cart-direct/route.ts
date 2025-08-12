export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { invokeMcpToolDirect } = await import('../../../server/mcp/mcp-direct');
  try {
    const { tool, parameters } = await req.json();
    if (!tool) return new Response(JSON.stringify({ success: false, error: 'tool is required' }), { status: 400 });
    const result = await invokeMcpToolDirect(tool, parameters || {});
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err?.message || 'server error' }), { status: 500 });
  }
}

