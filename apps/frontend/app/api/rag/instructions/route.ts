export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const venueId = url.searchParams.get('venueId');
    const agentId = url.searchParams.get('agentId');

    if (!venueId || !agentId) {
      return new Response(JSON.stringify({ error: 'Missing venueId or agentId' }), { status: 400 });
    }

    const postgres = (await import('postgres')).default;
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const { eq } = await import('drizzle-orm');
    const { systemConfig } = await import('../../../../server/db/schema');

    const client = postgres(process.env.DATABASE_URL!, { ssl: 'require', prepare: false });
    const db = drizzle(client);

    const instructionsKey = `rag_instructions:${venueId}:${agentId}`;
    const existing = await db.select({
      config_key: systemConfig.config_key,
      config_value: systemConfig.config_value
    })
      .from(systemConfig)
      .where(eq(systemConfig.config_key, instructionsKey))
      .limit(1);

    await client.end({ timeout: 5 });

    const instructions = existing.length > 0 ? existing[0].config_value : "";

    return new Response(JSON.stringify({ 
      success: true, 
      instructions: typeof instructions === 'string' ? instructions : instructions?.instructions || "" 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error loading system instructions:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to load system instructions',
      details: error?.message || 'Unknown error'
    }), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { venueId, agentId, instructions } = await req.json();

    if (!venueId || !agentId) {
      return new Response(JSON.stringify({ error: 'Missing venueId or agentId' }), { status: 400 });
    }

    const postgres = (await import('postgres')).default;
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const { eq } = await import('drizzle-orm');
    const { systemConfig } = await import('../../../../server/db/schema');

    const client = postgres(process.env.DATABASE_URL!, { ssl: 'require', prepare: false });
    const db = drizzle(client);

    const instructionsKey = `rag_instructions:${venueId}:${agentId}`;
    const existing = await db.select({
      config_key: systemConfig.config_key,
      config_value: systemConfig.config_value
    })
      .from(systemConfig)
      .where(eq(systemConfig.config_key, instructionsKey))
      .limit(1);

    if (existing.length > 0) {
      await db.update(systemConfig)
        .set({ 
          config_value: { instructions: instructions || "" },
          updated_at: new Date() 
        })
        .where(eq(systemConfig.config_key, instructionsKey));
    } else {
      await db.insert(systemConfig).values({
        config_key: instructionsKey,
        config_value: { instructions: instructions || "" },
        description: `System instructions for RAG agent ${agentId}`,
        config_type: 'json'
      });
    }

    await client.end({ timeout: 5 });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'System instructions saved successfully' 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error saving system instructions:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to save system instructions',
      details: error?.message || 'Unknown error'
    }), { status: 500 });
  }
}
