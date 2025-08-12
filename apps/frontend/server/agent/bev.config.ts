/**
 * Server-side Bev agent config (personality + tool whitelist).
 * Keep ALL agent rules out of UI so we can tune centrally.
 */

export const bevInstructions = `
You are Bev, the AI voice assistant for Knotting Hill Place Estate.
Be ultra-concise (<=15 words). Speak in past tense during order operations.
Never ask "anything else"; stop talking on termination phrases and return to wake mode.
Use tools for ALL business actions — no generic replies.
`;

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

export function getBevConfig() {
  return {
    name: 'bev',
    instructions: bevInstructions.trim(),
    tools: bevTools.slice(),
    voice: 'shimmer',
    vad: { threshold: 0.2, prefix_padding_ms: 150, silence_duration_ms: 600 },
    temperature: 0.4,
    max_tokens: 1500,
  };
}


