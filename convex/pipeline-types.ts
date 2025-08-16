import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Pipeline type definitions
export const PIPELINE_TYPES = {
  WEBRTC: "webrtc",
  WEBSOCKET: "websocket",
  HTTP_STREAMING: "http_streaming",
  GRPC: "grpc",
} as const;

export type PipelineType = typeof PIPELINE_TYPES[keyof typeof PIPELINE_TYPES];

// Provider definitions
export const PROVIDERS = {
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  GOOGLE: "google",
  AZURE: "azure",
  CUSTOM: "custom",
} as const;

export type Provider = typeof PROVIDERS[keyof typeof PROVIDERS];

// Base pipeline configuration interface
export interface BasePipelineConfig {
  type: PipelineType;
  provider: Provider;
  isActive: boolean;
  priority: number; // Higher number = higher priority
  metadata: any;
}

// WebRTC Pipeline Configuration (Default)
export const WEBRTC_PIPELINE_CONFIG = {
  type: PIPELINE_TYPES.WEBRTC,
  provider: PROVIDERS.OPENAI,
  isActive: true,
  priority: 100, // Highest priority - default
  metadata: {
    model: "gpt-4o-realtime-preview-2025-06-03",
    transport: "webrtc",
    useInsecureApiKey: true,
    audioConfig: {
      sampleRate: 16000,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    turnDetection: {
      type: "semantic_vad",
      threshold: 0.8,
      prefixPaddingMs: 150,
      silenceDurationMs: 1200,
      createResponse: true,
      interruptResponse: true,
    },
    voiceOptions: {
      alloy: { name: "Alloy", description: "Balanced and natural" },
      echo: { name: "Echo", description: "Warm and friendly" },
      fable: { name: "Fable", description: "Clear and professional" },
      onyx: { name: "Onyx", description: "Deep and authoritative" },
      nova: { name: "Nova", description: "Bright and energetic" },
      shimmer: { name: "Shimmer", description: "Smooth and melodic" },
    },
    defaultVoice: "alloy",
    defaultTemperature: 0.7,
    maxTokens: 4096,
  },
};

// WebSocket Pipeline Configuration (Alternative)
export const WEBSOCKET_PIPELINE_CONFIG = {
  type: PIPELINE_TYPES.WEBSOCKET,
  provider: PROVIDERS.OPENAI,
  isActive: false, // Not active by default
  priority: 50,
  metadata: {
    model: "gpt-4o-realtime-preview-2025-06-03",
    transport: "websocket",
    protocols: ["realtime", "openai-beta.realtime-v1"],
    audioFormat: "pcm16",
    sampleRate: 16000,
    voiceOptions: {
      alloy: { name: "Alloy", description: "Balanced and natural" },
      echo: { name: "Echo", description: "Warm and friendly" },
      fable: { name: "Fable", description: "Clear and professional" },
      onyx: { name: "Onyx", description: "Deep and authoritative" },
      nova: { name: "Nova", description: "Bright and energetic" },
      shimmer: { name: "Shimmer", description: "Smooth and melodic" },
    },
    defaultVoice: "alloy",
    defaultTemperature: 0.7,
    maxTokens: 4096,
  },
};

// HTTP Streaming Pipeline Configuration (Future)
export const HTTP_STREAMING_PIPELINE_CONFIG = {
  type: PIPELINE_TYPES.HTTP_STREAMING,
  provider: PROVIDERS.OPENAI,
  isActive: false, // Not active by default
  priority: 25,
  metadata: {
    model: "gpt-4o",
    endpoint: "/v1/chat/completions",
    stream: true,
    voiceOptions: {
      alloy: { name: "Alloy", description: "Balanced and natural" },
      echo: { name: "Echo", description: "Warm and friendly" },
      fable: { name: "Fable", description: "Clear and professional" },
      onyx: { name: "Onyx", description: "Deep and authoritative" },
      nova: { name: "Nova", description: "Bright and energetic" },
      shimmer: { name: "Shimmer", description: "Smooth and melodic" },
    },
    defaultVoice: "alloy",
    defaultTemperature: 0.7,
    maxTokens: 4096,
  },
};

// Get all available pipeline types
export const getPipelineTypes = query({
  args: {},
  handler: async () => {
    return {
      [PIPELINE_TYPES.WEBRTC]: WEBRTC_PIPELINE_CONFIG,
      [PIPELINE_TYPES.WEBSOCKET]: WEBSOCKET_PIPELINE_CONFIG,
      [PIPELINE_TYPES.HTTP_STREAMING]: HTTP_STREAMING_PIPELINE_CONFIG,
    };
  },
});

// Get active pipeline types
export const getActivePipelineTypes = query({
  args: {},
  handler: async () => {
    const allPipelines = {
      [PIPELINE_TYPES.WEBRTC]: WEBRTC_PIPELINE_CONFIG,
      [PIPELINE_TYPES.WEBSOCKET]: WEBSOCKET_PIPELINE_CONFIG,
      [PIPELINE_TYPES.HTTP_STREAMING]: HTTP_STREAMING_PIPELINE_CONFIG,
    };

    return Object.fromEntries(
      Object.entries(allPipelines).filter(([_, config]) => config.isActive)
    );
  },
});

// Get default pipeline configuration
export const getDefaultPipeline = query({
  args: {},
  handler: async () => {
    return WEBRTC_PIPELINE_CONFIG; // WebRTC is always the default
  },
});

// Update pipeline configuration
export const updatePipelineConfig = mutation({
  args: {
    pipelineType: v.string(),
    updates: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // This would typically update a database record
    // For now, we'll return success
    return { success: true, pipelineType: args.pipelineType };
  },
});

// Enable/disable pipeline type
export const togglePipelineType = mutation({
  args: {
    pipelineType: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // This would typically update a database record
    // For now, we'll return success
    return { success: true, pipelineType: args.pipelineType, isActive: args.isActive };
  },
});
