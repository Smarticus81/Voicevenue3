import { NextRequest } from "next/server";

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { query, venueId, agentId, limit = 5 } = await req.json();

    if (!query || !venueId || !agentId) {
      return new Response(JSON.stringify({ error: 'query, venueId, and agentId are required' }), { 
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
      return new Response(JSON.stringify({ results: [], message: 'No documents found' }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    let documents = [];
    try {
      documents = JSON.parse(result[0].config_value);
    } catch {
      await client.end({ timeout: 5 });
      return new Response(JSON.stringify({ results: [], message: 'Invalid document data' }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Simple text search (in production, use semantic search with embeddings)
    const searchResults = documents
      .map((doc: any) => {
        const content = doc.content.toLowerCase();
        const searchQuery = query.toLowerCase();
        
        // Find all occurrences of the search query
        const matches = [];
        let index = content.indexOf(searchQuery);
        while (index !== -1) {
          // Extract context around the match
          const start = Math.max(0, index - 100);
          const end = Math.min(content.length, index + searchQuery.length + 100);
          const context = content.substring(start, end);
          
          matches.push({
            context: context.replace(searchQuery, `**${searchQuery}**`),
            position: index
          });
          
          index = content.indexOf(searchQuery, index + 1);
        }
        
        return {
          ...doc,
          matches,
          relevanceScore: matches.length
        };
      })
      .filter((doc: any) => doc.relevanceScore > 0)
      .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    await client.end({ timeout: 5 });

    return new Response(JSON.stringify({ 
      results: searchResults,
      totalFound: searchResults.length,
      query 
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error('RAG search error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to search documents', 
      details: error.message 
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
