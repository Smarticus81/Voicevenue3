export const runtime = 'nodejs';

interface QuickCreateRequest {
  agentId: string;
  venueId: string;
  businessName: string;
  personality: string;
  voice: string;
  lane: string;
  tools: string[];
  wake: {
    phrase: string;
    fuzz: number;
  };
  customInstructions?: string;
  useCustomInstructions?: boolean;
}

export async function POST(req: Request) {
  try {
    const data: QuickCreateRequest = await req.json();
    
    if (!data.agentId || !data.venueId || !data.businessName) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing required fields' }), { status: 400 });
    }

    // Import database functions
    const postgres = (await import('postgres')).default;
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const { eq, sql } = await import('drizzle-orm');
    const { systemConfig } = await import('../../../../server/db/schema');

    const client = postgres(process.env.DATABASE_URL!, { ssl: 'require', prepare: false });
    const db = drizzle(client);

    // Create personalized personality
    let personalizedPersonality: string;
    
    if (data.useCustomInstructions && data.customInstructions?.trim()) {
      // Use custom instructions with business name substitution
      personalizedPersonality = data.customInstructions.replace(/\[Business Name\]/g, data.businessName);
      // Append core behavioral rules
      personalizedPersonality += ` Be ultra-concise (<=15 words). Speak in past tense during order operations. Never ask "anything else"; stop talking on termination phrases and return to wake mode. Use tools for ALL business actions — no generic replies.`;
    } else {
      // Use default hardwired bartender personality
      personalizedPersonality = `You are the AI voice assistant for ${data.businessName}. ${data.personality}. Be ultra-concise (<=15 words). Speak in past tense during order operations. Never ask "anything else"; stop talking on termination phrases and return to wake mode. Use tools for ALL business actions — no generic replies.`;
    }

    // Save agent configuration
    const agentConfigKey = `agent:${data.agentId}:config`;
    const agentConfig = {
      agentId: data.agentId,
      venueId: data.venueId,
      businessName: data.businessName,
      personality: personalizedPersonality,
      voice: data.voice,
      lane: data.lane,
      tools: data.tools,
      wake: data.wake,
      createdAt: new Date().toISOString()
    };

    // Check if agent config exists
    const existing = await db.select({ config_key: systemConfig.config_key, config_value: systemConfig.config_value }).from(systemConfig).where(eq(systemConfig.config_key, agentConfigKey)).limit(1);
    
    if (existing.length) {
      await db.update(systemConfig)
        .set({ 
          config_value: JSON.stringify(agentConfig)
        })
        .where(eq(systemConfig.config_key, agentConfigKey));
    } else {
      await db.execute(sql`
        INSERT INTO system_config (config_key, config_value, description, config_type) 
        VALUES (${agentConfigKey}, ${JSON.stringify(agentConfig)}, ${'Quick-created agent for ' + data.businessName}, 'json')
      `);
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
        .set({ 
          config_value: JSON.stringify(wakeConfig)
        })
        .where(eq(systemConfig.config_key, wakeKey));
    } else {
      await db.execute(sql`
        INSERT INTO system_config (config_key, config_value, description, config_type) 
        VALUES (${wakeKey}, ${JSON.stringify(wakeConfig)}, 'Wake word configuration', 'json')
      `);
    }

    await client.end({ timeout: 5 });

    return new Response(JSON.stringify({ 
      ok: true, 
      agentId: data.agentId,
      venueId: data.venueId,
      config: agentConfig 
    }), { status: 200 });

  } catch (error: any) {
    console.error('Quick agent creation failed:', error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: error?.message || 'Agent creation failed' 
    }), { status: 500 });
  }
}
