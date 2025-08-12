export const runtime = 'nodejs';

interface AgentSaveRequest {
  agentId: string;
  venueId: string;
  lane: string;
  tools: string[];
  wake: {
    phrase: string;
    fuzz: number;
  };
}

export async function POST(req: Request) {
  try {
    const data: AgentSaveRequest = await req.json();
    
    if (!data.agentId || !data.venueId) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing required fields' }), { status: 400 });
    }

    // Import database functions
    const postgres = (await import('postgres')).default;
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const { eq } = await import('drizzle-orm');
    const { systemConfig } = await import('../../../../server/db/schema');

    const client = postgres(process.env.DATABASE_URL!, { ssl: 'require', prepare: false });
    const db = drizzle(client);

    // Save agent configuration
    const agentConfigKey = `agent:${data.agentId}:config`;
    const agentConfig = {
      agentId: data.agentId,
      venueId: data.venueId,
      lane: data.lane,
      tools: data.tools,
      wake: data.wake,
      updatedAt: new Date().toISOString()
    };

    // Check if agent config exists
    const existing = await db.select({ config_key: systemConfig.config_key, config_value: systemConfig.config_value }).from(systemConfig).where(eq(systemConfig.config_key, agentConfigKey)).limit(1);
    
    if (existing.length) {
      await db.update(systemConfig)
        .set({ config_value: JSON.stringify(agentConfig) })
        .where(eq(systemConfig.config_key, agentConfigKey));
    } else {
      // Use raw SQL to avoid missing created_at/updated_at columns
      const { sql } = await import('drizzle-orm');
      await db.execute(sql`INSERT INTO system_config (config_key, config_value, config_type, description) VALUES (${agentConfigKey}, ${JSON.stringify(agentConfig)}, ${'json'}, ${`Agent configuration for ${data.agentId}`})`);
    }

    // Save wake word settings
    const wakeKey = `wakeword:${data.venueId}`;
    const wakeConfig = {
      phrase: data.wake.phrase,
      maxDistance: data.wake.fuzz,
      venueId: data.venueId
    };

    const existingWake = await db.select({ config_key: systemConfig.config_key, config_value: systemConfig.config_value }).from(systemConfig).where(eq(systemConfig.config_key, wakeKey)).limit(1);
    
    if (existingWake.length) {
      await db.update(systemConfig)
        .set({ config_value: JSON.stringify(wakeConfig) })
        .where(eq(systemConfig.config_key, wakeKey));
    } else {
      const { sql } = await import('drizzle-orm');
      await db.execute(sql`INSERT INTO system_config (config_key, config_value, config_type, description) VALUES (${wakeKey}, ${JSON.stringify(wakeConfig)}, ${'json'}, ${'Wake word configuration'})`);
    }

    await client.end({ timeout: 5 });

    return new Response(JSON.stringify({ 
      ok: true, 
      agentId: data.agentId,
      venueId: data.venueId
    }), { status: 200 });

  } catch (error: any) {
    console.error('Agent save failed:', error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: error?.message || 'Save failed' 
    }), { status: 500 });
  }
}
