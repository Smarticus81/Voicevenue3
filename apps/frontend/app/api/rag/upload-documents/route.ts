import { NextRequest } from "next/server";

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const venueId = formData.get('venueId') as string;
    const agentId = formData.get('agentId') as string;
    const businessName = formData.get('businessName') as string;

    if (!venueId || !agentId) {
      return new Response(JSON.stringify({ error: 'venueId and agentId are required' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const documents = [];
    const entries = Array.from(formData.entries());
    
    for (const [key, value] of entries) {
      if (key.startsWith('document_') && value instanceof File) {
        const content = await value.text();
        documents.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          filename: value.name,
          content,
          type: value.type,
          size: value.size,
          uploadedAt: new Date().toISOString()
        });
      }
    }

    // Store documents in database (for now, we'll use a simple storage approach)
    // In production, you'd want to use a vector database like Pinecone, Weaviate, or Chroma
    const postgres = (await import('postgres')).default;
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const { eq } = await import('drizzle-orm');
    const { systemConfig } = await import('../../../../server/db/schema');

    const client = postgres(process.env.DATABASE_URL!, { ssl: 'require', prepare: false });
    const db = drizzle(client);

    // Store documents metadata and content
    const documentsKey = `rag-documents:${venueId}:${agentId}`;
    const existing = await db.select({
      config_key: systemConfig.config_key,
      config_value: systemConfig.config_value
    }).from(systemConfig).where(eq(systemConfig.config_key, documentsKey)).limit(1);
    
    let existingDocuments = [];
    if (existing.length > 0) {
      try {
        existingDocuments = JSON.parse(existing[0].config_value);
      } catch {}
    }

    const allDocuments = [...existingDocuments, ...documents];

    if (existing.length > 0) {
      await db.update(systemConfig)
        .set({ 
          config_value: allDocuments, // Drizzle handles JSONB conversion automatically
          updated_at: new Date() 
        })
        .where(eq(systemConfig.config_key, documentsKey));
    } else {
      await db.insert(systemConfig).values({
        config_key: documentsKey,
        config_value: allDocuments, // Store as JSONB directly
        description: `RAG documents for agent ${agentId}`,
        config_type: 'json'
      });
    }

    await client.end({ timeout: 5 });

    return new Response(JSON.stringify({ 
      success: true, 
      documentsUploaded: documents.length,
      totalDocuments: allDocuments.length 
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error('RAG document upload error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to upload documents', 
      details: error.message 
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
