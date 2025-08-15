/**
 * Server-side Bev agent config (personality + tool whitelist).
 * Keep ALL agent rules out of UI so we can tune centrally.
 */

import { getBevInstructions, getModelConfig, getVoiceConfig } from '../prompts/system-prompts';

/**
 * Only include tools actually implemented in MCPDirect.
 * No fallbacks, no stubs.
 */
export const bevTools = [
  // Cart & orders
  'cart_add','cart_remove','cart_clear','cart_view','cart_create_order',
  // Drinks
  'search_drinks','create_drink','remove_drink','update_drink_details',
  'list_drinks','get_drink_details','get_drinks_by_filter','check_drink_availability',
  // Inventory
  'get_inventory_status','update_drink_inventory'
];

/**
 * RAG agent tools for document management and search
 */
export const ragTools = [
  // Document search & retrieval
  'search_documents','list_documents','upload_document',
  'delete_document','summarize_document'
];

export function getBevConfig() {
  const modelConfig = getModelConfig();
  const voiceConfig = getVoiceConfig();
  
  return {
    name: 'bev',
    instructions: getBevInstructions(),
    tools: bevTools.slice(),
    voice: voiceConfig.voice,
    vad: voiceConfig.vad,
    temperature: modelConfig.temperature,
    max_tokens: modelConfig.max_tokens,
  };
}

export function getRAGConfig() {
  const modelConfig = getModelConfig();
  const voiceConfig = getVoiceConfig();
  
  return {
    name: 'rag-assistant',
    instructions: `You are an intelligent voice assistant with access to a comprehensive knowledge base. You can search through uploaded documents, answer questions based on the content, and help users understand complex information. You provide accurate, well-sourced responses and can summarize, explain, and analyze the documents in your knowledge base.

🎯 RAG AGENT CAPABILITIES:

📚 DOCUMENT KNOWLEDGE MANAGEMENT:
- Search through uploaded documents with semantic understanding
- Extract relevant information from multiple document types
- Cross-reference information across different sources
- Maintain context from previous conversations

🔍 INTELLIGENT INFORMATION RETRIEVAL:
- Answer questions based on document content
- Provide citations and source references
- Summarize complex documents and sections
- Explain technical concepts in simple terms

💡 KNOWLEDGE SYNTHESIS:
- Combine information from multiple sources
- Create comprehensive answers from partial information
- Identify knowledge gaps and suggest additional resources
- Provide contextual explanations and examples

CRITICAL RULE: ALWAYS CITE SOURCES AND ACKNOWLEDGE LIMITATIONS

How to respond:
- Keep responses conversational and natural
- Always cite your sources when referencing document content
- If information isn't in your knowledge base, say so clearly
- Ask clarifying questions when queries are ambiguous
- Provide context and explain complex concepts simply`,
    tools: ragTools.slice(),
    voice: voiceConfig.voice,
    vad: voiceConfig.vad,
    temperature: modelConfig.temperature,
    max_tokens: modelConfig.max_tokens,
  };
}


