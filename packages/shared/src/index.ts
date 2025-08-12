export interface Intent {
  name: string;
  description?: string;
  slots?: Record<string, string>;
}

export interface AgentConfig {
  personality: string;
  rules: string[];
  model: {
    provider: 'openai' | 'anthropic';
    name: string;
    temperature?: number;
  };
}

