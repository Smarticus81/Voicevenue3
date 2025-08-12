export const runtime = 'nodejs';

interface DatabaseConnectionRequest {
  venueId: string;
  databaseUrl: string;
  businessName: string;
}

export async function POST(req: Request) {
  try {
    const { venueId, databaseUrl, businessName }: DatabaseConnectionRequest = await req.json();
    
    if (!venueId || !databaseUrl || !businessName) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing required fields' }), { status: 400 });
    }

    // Test external database connection
    let externalClient: any;
    try {
      if (databaseUrl.includes('postgresql://') || databaseUrl.includes('postgres://')) {
        const postgres = (await import('postgres')).default;
        externalClient = postgres(databaseUrl, { ssl: 'require', prepare: false });
        
        // Test connection
        await externalClient`SELECT 1`;
        
        // Try to detect inventory/products table
        const tables = await externalClient`
          SELECT table_name FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name SIMILAR TO '%(product|item|drink|inventory|menu)%'
          LIMIT 5
        `;
        
        if (tables.length === 0) {
          await externalClient.end({ timeout: 5 });
          return new Response(JSON.stringify({ 
            ok: false, 
            error: 'No inventory/product tables found. Please check your database schema.' 
          }), { status: 400 });
        }

        // Use the first matching table
        const tableName = tables[0].table_name;
        const sampleData = await externalClient`
          SELECT * FROM ${externalClient(tableName)} LIMIT 5
        `;

        await externalClient.end({ timeout: 5 });

        // Store connection configuration
        const postgres_local = (await import('postgres')).default;
        const { drizzle } = await import('drizzle-orm/postgres-js');
        const { eq } = await import('drizzle-orm');
        const { systemConfig } = await import('../../../../server/db/schema');

        const client = postgres_local(process.env.DATABASE_URL!, { ssl: 'require', prepare: false });
        const db = drizzle(client);

        const dbConfigKey = `external_db:${venueId}`;
        const dbConfig = {
          venueId,
          databaseUrl: databaseUrl, // In production, encrypt this
          tableName,
          businessName,
          connectedAt: new Date().toISOString(),
          sampleColumns: Object.keys(sampleData[0] || {}),
          status: 'connected'
        };

        const existing = await db.select({ config_key: systemConfig.config_key, config_value: systemConfig.config_value }).from(systemConfig).where(eq(systemConfig.config_key, dbConfigKey)).limit(1);
        
        if (existing.length) {
          await db.update(systemConfig)
            .set({ config_value: JSON.stringify(dbConfig) })
            .where(eq(systemConfig.config_key, dbConfigKey));
        } else {
          await db.insert(systemConfig).values({
            config_key: dbConfigKey,
            config_value: JSON.stringify(dbConfig),
            description: 'External database connection',
            config_type: 'json'
          });
        }

        await client.end({ timeout: 5 });

        return new Response(JSON.stringify({ 
          ok: true, 
          connection: 'established',
          tableName,
          sampleColumns: Object.keys(sampleData[0] || {}),
          recordCount: sampleData.length
        }), { status: 200 });

      } else {
        return new Response(JSON.stringify({ 
          ok: false, 
          error: 'Currently only PostgreSQL connections are supported' 
        }), { status: 400 });
      }

    } catch (dbError: any) {
      if (externalClient) {
        try { await externalClient.end({ timeout: 5 }); } catch {}
      }
      return new Response(JSON.stringify({ 
        ok: false, 
        error: `Database connection failed: ${dbError.message}` 
      }), { status: 400 });
    }

  } catch (error: any) {
    console.error('Database connection setup failed:', error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: error?.message || 'Connection setup failed' 
    }), { status: 500 });
  }
}
