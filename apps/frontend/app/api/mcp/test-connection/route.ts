export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { provider, serverUrl, token } = body;
    
    const { bevTools } = await import('../../../../server/agent/bev.config');
    const { invokeMcpTool } = await import('../../../../server/mcp/mcp-router');
    const { loadMcpConfig } = await import('../../../../server/mcp/mcp-config-loader');

    // If specific provider details are provided in the request, test that configuration
    // Otherwise, test the current saved configuration
    let testConfig;
    if (provider) {
      testConfig = { provider, serverUrl, token };
    } else {
      testConfig = await loadMcpConfig();
    }

    let health: any;
    try {
      // Use the router with current config, or override for testing
      if (provider && provider !== testConfig.provider) {
        // Test specific provider configuration
        if (provider === 'supabase' && serverUrl && token) {
          const { invokeMcpToolSupabase } = await import('../../../../server/mcp/mcp-supabase');
          health = await invokeMcpToolSupabase('health_check', {}, serverUrl, token);
        } else if (provider === 'direct') {
          const { invokeMcpToolDirect } = await import('../../../../server/mcp/mcp-direct');
          health = await invokeMcpToolDirect('health_check', {});
        } else {
          health = { success: false, error: 'Unsupported provider for testing' };
        }
      } else {
        health = await invokeMcpTool('health_check', {});
      }
      
      if (health && health.success) health.status = 'ok';
    } catch (e: any) {
      health = { success: true, status: 'degraded', error: String(e?.message || e) };
    }

    return new Response(JSON.stringify({
      ok: true,
      provider: testConfig.provider,
      tools: bevTools,
      health,
    }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({
      ok: false,
      error: e?.message || 'Test connection failed'
    }), { status: 500 });
  }
}



