export const runtime = 'nodejs';

interface DeployRequest {
  agentId: string;
  venueId: string;
  deploymentType?: 'kiosk' | 'embedded' | 'standalone';
}

export async function POST(req: Request) {
  try {
    const { agentId, venueId, deploymentType = 'kiosk' }: DeployRequest = await req.json();
    
    if (!agentId || !venueId) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing required fields' }), { status: 400 });
    }

    // Import database functions
      const postgres = (await import('postgres')).default;
  const { drizzle } = await import('drizzle-orm/postgres-js');
  const { eq, sql } = await import('drizzle-orm');
  const { systemConfig } = await import('../../../../server/db/schema');

    const client = postgres(process.env.DATABASE_URL!, { ssl: 'require', prepare: false });
    const db = drizzle(client);

    // Get agent configuration
    const agentConfigKey = `agent:${agentId}:config`;
    const agentResult = await db.select({ config_key: systemConfig.config_key, config_value: systemConfig.config_value }).from(systemConfig).where(eq(systemConfig.config_key, agentConfigKey)).limit(1);
    
    if (!agentResult.length) {
      await client.end({ timeout: 5 });
      return new Response(JSON.stringify({ ok: false, error: 'Agent not found' }), { status: 404 });
    }

    let agentConfig;
    try {
      // Handle both string and object formats
      const configValue = agentResult[0].config_value;
      agentConfig = typeof configValue === 'string' ? JSON.parse(configValue) : configValue;
    } catch (e) {
      console.error('Failed to parse agent config:', e);
      await client.end({ timeout: 5 });
      return new Response(JSON.stringify({ ok: false, error: 'Invalid agent configuration' }), { status: 400 });
    }

    // Create deployment record with different URLs based on agent type
    const deploymentKey = `deployment:${agentId}:${Date.now()}`;
    const isRAGAgent = agentConfig.preset === 'rag' || agentConfig.posTemplate === 'rag';
    
    const deployment = {
      agentId,
      venueId,
      deploymentType,
      status: 'active',
      deployedAt: new Date().toISOString(),
      config: agentConfig,
      urls: isRAGAgent ? {
        standalone: `/rag-agent?venueId=${venueId}&agentId=${agentId}&lane=${agentConfig.lane || 'openai'}`,
        embed: `/embed/rag?venueId=${venueId}&agentId=${agentId}`,
        api: `/api/rag/search-documents`
      } : {
        kiosk: `/kiosk?venueId=${venueId}&agentId=${agentId}&lane=${agentConfig.lane || 'openai'}`,
        embed: `/embed/runner?venueId=${venueId}&agentId=${agentId}`,
        api: `/api/voice-cart-direct`
      }
    };

    // Use raw SQL to avoid created_at/updated_at issues
    await db.execute(sql`
      INSERT INTO system_config (config_key, config_value, description, config_type) 
      VALUES (${deploymentKey}, ${JSON.stringify(deployment)}, ${`Deployment record for agent ${agentId}`}, 'json')
    `);

    // Update agent status to deployed
    const updatedAgentConfig = {
      ...agentConfig,
      status: 'deployed',
      lastDeployment: deployment.deployedAt
    };

    await db.update(systemConfig)
              .set({ 
          config_value: JSON.stringify(updatedAgentConfig)
        })
      .where(eq(systemConfig.config_key, agentConfigKey));

    await client.end({ timeout: 5 });

    return new Response(JSON.stringify({ 
      ok: true, 
      deployment,
      urls: deployment.urls
    }), { status: 200 });

  } catch (error: any) {
    console.error('Agent deployment failed:', error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: error?.message || 'Deployment failed' 
    }), { status: 500 });
  }
}
