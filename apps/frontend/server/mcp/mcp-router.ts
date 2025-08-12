import { loadMcpConfig, McpConfig } from './mcp-config-loader';
import { invokeMcpToolDirect } from './mcp-direct';
import { invokeMcpToolSupabase } from './mcp-supabase';

type ToolParams = Record<string, any>;

export async function invokeMcpTool(tool: string, parameters: ToolParams = {}) {
  try {
    const config = await loadMcpConfig();
    
    switch (config.provider) {
      case 'supabase':
        if (!config.serverUrl || !config.token) {
          throw new Error('Supabase MCP requires serverUrl and token');
        }
        return await invokeMcpToolSupabase(tool, parameters, config.serverUrl, config.token);
        
      case 'direct':
        return await invokeMcpToolDirect(tool, parameters);
        
      case 'generic':
        // For now, fallback to direct for generic
        return await invokeMcpToolDirect(tool, parameters);
        
      default:
        throw new Error(`Unknown MCP provider: ${config.provider}`);
    }
  } catch (error: any) {
    console.error('MCP Tool invocation failed:', error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
}
