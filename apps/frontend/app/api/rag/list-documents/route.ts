import { NextRequest } from "next/server";

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const venueId = url.searchParams.get('venueId');
    const agentId = url.searchParams.get('agentId');

    if (!venueId || !agentId) {
      return new Response(JSON.stringify({ error: 'venueId and agentId are required' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Get documents from database
    const postgres = (await import('postgres')).default;
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const { eq } = await import('drizzle-orm');
    const { systemConfig } = await import('../../../../server/db/schema');

    const client = postgres(process.env.DATABASE_URL!, { ssl: 'require', prepare: false });
    const db = drizzle(client);

    const documentsKey = `rag-documents:${venueId}:${agentId}`;
    const result = await db.select({
      config_key: systemConfig.config_key,
      config_value: systemConfig.config_value
    }).from(systemConfig).where(eq(systemConfig.config_key, documentsKey)).limit(1);
    
    if (result.length === 0) {
      await client.end({ timeout: 5 });
      return new Response(JSON.stringify({ documents: [] }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    let documents = [];
    try {
      documents = JSON.parse(result[0].config_value);
    } catch {
      await client.end({ timeout: 5 });
      return new Response(JSON.stringify({ documents: [] }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Return metadata only (not full content)
    const documentMetadata = documents.map((doc: any) => ({
      id: doc.id,
      filename: doc.filename,
      type: doc.type,
      size: doc.size,
      uploadedAt: doc.uploadedAt,
      contentLength: doc.content ? doc.content.length : 0
    }));

    await client.end({ timeout: 5 });

    return new Response(JSON.stringify({ documents: documentMetadata }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error('RAG list documents error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to list documents', 
      details: error.message 
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
