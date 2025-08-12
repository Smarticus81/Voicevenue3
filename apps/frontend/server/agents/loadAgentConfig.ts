import fs from 'node:fs';
import path from 'node:path';
import type { AgentConfig } from './types';

export function loadAgentConfig(agentId: string): AgentConfig & { tools: string[] } {
  const jsonPath = path.join(process.cwd(), 'apps', 'frontend', 'server', 'agents', 'configs', `${agentId}.json`);
  if (!fs.existsSync(jsonPath)) throw new Error(`Agent config not found: ${jsonPath}`);
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const cfg = JSON.parse(raw);
  if (!Array.isArray(cfg.tools)) cfg.tools = [];
  return cfg as AgentConfig & { tools: string[] };
}


