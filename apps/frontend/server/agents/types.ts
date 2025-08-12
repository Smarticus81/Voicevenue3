export type VoiceLane = "openai" | "dg11";

export type AgentConfig = {
  id: string;
  name: string;
  voice: { 
    lane: VoiceLane; 
    openai_model?: string; 
    elevenlabs_voice?: string; 
  };
  nlu: { 
    mode: "intents"; 
    intentsPath: string; 
  };
  personaPath: string;
};
