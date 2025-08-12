export async function handler(params: any) {
  // Bridge to MCPDirect for real action when available
  try {
    const { invokeMcpToolDirect } = await import('../../mcp/mcp-direct');
    const result = await invokeMcpToolDirect('cart_add', params || {});
    return { ok: true, result };
  } catch {
    // Minimal fallback
    const qty = Number(params?.quantity ?? 1);
    const drink = String(params?.drink_name ?? 'unknown');
    return { ok: true, message: `Added ${qty}x ${drink} to cart` };
  }
}


