export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const venueId = url.searchParams.get('venueId') || 'demo-venue';
    const agentId = url.searchParams.get('agentId') || 'demo-agent';
    
    // Use shared drizzle client to avoid per-request connection overhead/timeouts
    const { db } = await import('@/server/db/client');
    const { eq } = await import('drizzle-orm');
    const { systemConfig } = await import('../../../../server/db/schema');

    // Load agent personality configuration
    const agentConfigKey = `agent:${agentId}:config`;
    const result = await db
      .select({ config_key: systemConfig.config_key, config_value: systemConfig.config_value })
      .from(systemConfig)
      .where(eq(systemConfig.config_key, agentConfigKey))
      .limit(1);

    const { getDefaultInstructions } = await import('@/server/prompts/system-prompts');
    let instructions = getDefaultInstructions();
    
    console.log(`[API] Looking for agent config: ${agentConfigKey}`);
    console.log(`[API] Found ${result.length} results`);
    
    if (result.length > 0) {
      try {
        // Handle both string and object formats
        const configValue = result[0].config_value;
        console.log(`[API] Raw config value:`, configValue);
        const agentConfig = typeof configValue === 'string' ? JSON.parse(configValue) : configValue;
        console.log(`[API] Parsed config:`, agentConfig);
        if (agentConfig.personality) {
          instructions = agentConfig.personality;
          console.log(`[API] Using custom instructions: ${instructions.substring(0, 100)}...`);
        } else {
          console.log(`[API] No personality field found in config`);
        }
      } catch (e) {
        console.error('Failed to parse agent config:', e);
      }
    } else {
      console.log(`[API] No agent config found, using default instructions`);
    }

    // Try to return full agent config if available
    let agentConfig = null;
    if (result.length > 0) {
      try {
        const configValue = result[0].config_value;
        agentConfig = typeof configValue === 'string' ? JSON.parse(configValue) : configValue;
      } catch (e) {
        // Ignore parse errors
      }
    }

    return new Response(JSON.stringify({ 
      instructions,
      agentId,
      venueId,
      agentConfig
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    console.error('Failed to load agent instructions:', e);
    return new Response(JSON.stringify({ 
      error: e?.message || 'Failed to load instructions',
      instructions: getDefaultInstructions()
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
