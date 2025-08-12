import { loadRegistry } from './registry';

export async function loadAgentTools(agentId: string) {
  const { loadAgentConfig } = await import('../agents/loadAgentConfig');
  const cfg = loadAgentConfig(agentId) as any;
  const registry = loadRegistry();

  const toolNames: string[] = Array.isArray(cfg.tools) ? cfg.tools : [];
  const tools = toolNames.map((t) => {
    if (!registry[t]) throw new Error(`Tool not found in registry: ${t}`);
    return registry[t];
  });

  return tools;
}


