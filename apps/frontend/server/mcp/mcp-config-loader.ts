import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { systemConfig } from '../db/schema';

export interface McpConfig {
  provider: 'direct' | 'supabase' | 'generic';
  enabledTools: string[];
  serverUrl?: string;
  token?: string;
  saved_at?: string;
}

const DEFAULT_SUPABASE_CONFIG: McpConfig = {
  provider: 'supabase',
  enabledTools: [
    'health_check',
    'cart_add',
    'cart_view', 
    'cart_create_order',
    'search_drinks',
    'list_drinks',
    'get_drink_details'
  ],
  serverUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  token: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

let cachedConfig: McpConfig | null = null;

export async function loadMcpConfig(): Promise<McpConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const existing = await db
      .select()
      .from(systemConfig)
      .where(eq(systemConfig.config_key, 'mcp_config'))
      .limit(1);

    if (existing.length > 0) {
      const config = existing[0].config_value as McpConfig;
      cachedConfig = config;
      return config;
    }
  } catch (error) {
    console.warn('Failed to load MCP config from database:', error);
  }

  // No config found or error loading - return default Supabase config
  // Auto-save the default config if we have valid Supabase credentials
  if (DEFAULT_SUPABASE_CONFIG.serverUrl && DEFAULT_SUPABASE_CONFIG.token) {
    try {
      await saveMcpConfig(DEFAULT_SUPABASE_CONFIG);
      cachedConfig = DEFAULT_SUPABASE_CONFIG;
      return DEFAULT_SUPABASE_CONFIG;
    } catch (error) {
      console.warn('Failed to save default Supabase MCP config:', error);
    }
  }

  // Fallback to direct if no Supabase credentials
  const directConfig: McpConfig = {
    provider: 'direct',
    enabledTools: DEFAULT_SUPABASE_CONFIG.enabledTools
  };
  
  cachedConfig = directConfig;
  return directConfig;
}

export async function saveMcpConfig(config: McpConfig): Promise<void> {
  const payload = { ...config, saved_at: new Date().toISOString() };

  try {
    const existing = await db
      .select()
      .from(systemConfig)
      .where(eq(systemConfig.config_key, 'mcp_config'))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(systemConfig)
        .set({ 
          config_value: payload, 
          updated_at: new Date() 
        })
        .where(eq(systemConfig.config_key, 'mcp_config'));
    } else {
      await db.insert(systemConfig).values({
        config_key: 'mcp_config',
        config_value: payload,
        description: 'MCP provider config',
        config_type: 'json'
      });
    }

    // Clear cache to force reload
    cachedConfig = null;
  } catch (error) {
    console.error('Failed to save MCP config:', error);
    throw error;
  }
}

export function clearMcpConfigCache(): void {
  cachedConfig = null;
}
