export const runtime = 'nodejs';

interface AutoConfigureRequest {
  venueId: string;
  agentId: string;
  tools: string[];
}

export async function POST(req: Request) {
  try {
    const { venueId, agentId, tools }: AutoConfigureRequest = await req.json();
    
    if (!venueId || !agentId || !Array.isArray(tools)) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing required fields' }), { status: 400 });
    }

    // Import database functions
    const postgres = (await import('postgres')).default;
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const { eq, sql } = await import('drizzle-orm');
    const { systemConfig } = await import('../../../../server/db/schema');

    const client = postgres(process.env.DATABASE_URL!, { ssl: 'require', prepare: false });
    const db = drizzle(client);

    // Auto-configure MCP Direct (embedded)
    const mcpConfigKey = `mcp:${venueId}`;
    const mcpConfig = {
      provider: 'direct',
      enabledTools: tools,
      venueId,
      agentId,
      autoConfigured: true,
      configuredAt: new Date().toISOString()
    };

    // Check if MCP config exists
    const existing = await db.select({ config_key: systemConfig.config_key, config_value: systemConfig.config_value }).from(systemConfig).where(eq(systemConfig.config_key, mcpConfigKey)).limit(1);
    
    if (existing.length) {
      await db.update(systemConfig)
        .set({ 
          config_value: JSON.stringify(mcpConfig)
        })
        .where(eq(systemConfig.config_key, mcpConfigKey));
    } else {
      await db.execute(sql`
        INSERT INTO system_config (config_key, config_value, description, config_type) 
        VALUES (${mcpConfigKey}, ${JSON.stringify(mcpConfig)}, 'Auto-configured MCP Direct tools', 'json')
      `);
    }

    // Create intents mapping for the tools
    const intentsKey = `intents:${agentId}`;
    const intents = {
      cart_add: {
        patterns: ["add * to cart", "I want *", "order *", "get me *"],
        action: "cart_add",
        parameters: ["drink_name", "quantity"]
      },
      cart_view: {
        patterns: ["show cart", "what's in cart", "view order", "check order"],
        action: "cart_view",
        parameters: []
      },
      cart_create_order: {
        patterns: ["place order", "checkout", "complete order", "finish order"],
        action: "cart_create_order", 
        parameters: []
      },
      search_drinks: {
        patterns: ["find *", "search for *", "do you have *", "what * do you have"],
        action: "search_drinks",
        parameters: ["query"]
      },
      list_drinks: {
        patterns: ["show menu", "what drinks", "list items", "show all"],
        action: "list_drinks",
        parameters: []
      }
    };

    // Save intents
    const existingIntents = await db.select({ config_key: systemConfig.config_key, config_value: systemConfig.config_value }).from(systemConfig).where(eq(systemConfig.config_key, intentsKey)).limit(1);
    
    if (existingIntents.length) {
      await db.update(systemConfig)
        .set({ 
          config_value: JSON.stringify(intents)
        })
        .where(eq(systemConfig.config_key, intentsKey));
    } else {
      await db.execute(sql`
        INSERT INTO system_config (config_key, config_value, description, config_type) 
        VALUES (${intentsKey}, ${JSON.stringify(intents)}, 'Auto-configured agent intents', 'json')
      `);
    }

    await client.end({ timeout: 5 });

    return new Response(JSON.stringify({ 
      ok: true, 
      toolsConfigured: tools.length,
      intentsCreated: Object.keys(intents).length 
    }), { status: 200 });

  } catch (error: any) {
    console.error('MCP auto-configuration failed:', error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: error?.message || 'Auto-configuration failed' 
    }), { status: 500 });
  }
}
