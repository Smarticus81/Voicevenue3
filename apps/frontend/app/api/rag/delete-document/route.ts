import { NextRequest } from "next/server";

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { documentId, venueId, agentId } = await req.json();

    if (!documentId || !venueId || !agentId) {
      return new Response(JSON.stringify({ error: 'documentId, venueId, and agentId are required' }), { 
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
      return new Response(JSON.stringify({ error: 'No documents found' }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    let documents = [];
    try {
      documents = JSON.parse(result[0].config_value);
    } catch {
      await client.end({ timeout: 5 });
      return new Response(JSON.stringify({ error: 'Invalid document data' }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Remove the document
    const updatedDocuments = documents.filter((doc: any) => doc.id !== documentId);
    
    if (updatedDocuments.length === documents.length) {
      await client.end({ timeout: 5 });
      return new Response(JSON.stringify({ error: 'Document not found' }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Update database
    await db.update(systemConfig)
      .set({ config_value: JSON.stringify(updatedDocuments), updated_at: new Date() })
      .where(eq(systemConfig.config_key, documentsKey));

    await client.end({ timeout: 5 });

    return new Response(JSON.stringify({ 
      success: true, 
      deletedDocumentId: documentId,
      remainingDocuments: updatedDocuments.length 
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error('RAG delete document error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete document', 
      details: error.message 
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
