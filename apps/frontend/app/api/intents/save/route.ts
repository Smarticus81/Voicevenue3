export const runtime = 'nodejs';

export async function POST(req: Request) {
  // From: apps/frontend/app/api/intents/save/route.ts
  // To:   apps/frontend/server/db/schema.ts
  const postgres = (await import('postgres')).default;
  const { drizzle } = await import('drizzle-orm/postgres-js');
  const { eq } = await import('drizzle-orm');
  const { systemConfig } = await import('../../../../server/db/schema');

  try {
    const { intentsJson, agentId = 'default' } = await req.json();
    const key = `intents:${agentId}`;

    const client = postgres(process.env.DATABASE_URL!, { ssl: 'require', prepare: false });
    const db = drizzle(client);

    const existing = await db.select().from(systemConfig).where(eq(systemConfig.config_key, key)).limit(1);
    if (existing.length) {
      await db.update(systemConfig)
        .set({ config_value: JSON.stringify(intentsJson), updated_at: new Date() })
        .where(eq(systemConfig.config_key, key));
    } else {
      await db.insert(systemConfig).values({
        config_key: key,
        config_value: JSON.stringify(intentsJson),
        description: 'Agent intents',
        config_type: 'json'
      });
    }

    await client.end({ timeout: 5 });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'save failed' }), { status: 500 });
  }
}

