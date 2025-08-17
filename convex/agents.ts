import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { WEBRTC_PIPELINE_CONFIG } from "./pipeline_types";

// Default WebRTC Voice Pipeline Configuration
export const DEFAULT_VOICE_PIPELINE_CONFIG = WEBRTC_PIPELINE_CONFIG;

// Default agent configuration with WebRTC pipeline
export const DEFAULT_AGENT_CONFIG = {
  voicePipeline: DEFAULT_VOICE_PIPELINE_CONFIG,
  voiceConfig: {
    agentName: "Voice Assistant",
    voice: DEFAULT_VOICE_PIPELINE_CONFIG.metadata.defaultVoice,
    temperature: DEFAULT_VOICE_PIPELINE_CONFIG.metadata.defaultTemperature,
    responseStyle: "professional" as const,
    confidenceThreshold: 0.8,
    wakeWords: {
      order: ["order", "drink", "beverage", "cocktail"],
      inquiry: ["help", "info", "question", "what"],
    },
  },
  toolPermissions: {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
    canProcessPayments: true,
    canManageInventory: true,
    canViewAnalytics: true,
  },
  deploymentSettings: {
    requiresAuthentication: true,
    maxConcurrentSessions: 10,
    sessionTimeout: 3600,
    enablePWA: true,
    enableOfflineMode: false,
  },
};

export const createAgent = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    type: v.union(v.literal("Bevpro"), v.literal("Venue Voice")),
    description: v.optional(v.string()),
    customInstructions: v.optional(v.string()),
    context: v.optional(v.string()),
    voiceConfig: v.optional(v.any()),
    toolPermissions: v.optional(v.any()),
    deploymentSettings: v.optional(v.any()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Merge with default configuration
    const finalVoiceConfig = {
      ...DEFAULT_AGENT_CONFIG.voiceConfig,
      ...args.voiceConfig,
    };

    const finalToolPermissions = {
      ...DEFAULT_AGENT_CONFIG.toolPermissions,
      ...args.toolPermissions,
    };

    const finalDeploymentSettings = {
      ...DEFAULT_AGENT_CONFIG.deploymentSettings,
      ...args.deploymentSettings,
    };

    const agentId = await ctx.db.insert("agents", {
      userId: args.userId,
      name: args.name,
      type: args.type,
      description: args.description || "",
      customInstructions: args.customInstructions || "",
      context: args.context || "",
      voiceConfig: finalVoiceConfig,
      voicePipeline: DEFAULT_VOICE_PIPELINE_CONFIG, // Always use WebRTC as default
      toolPermissions: finalToolPermissions,
      deploymentSettings: finalDeploymentSettings,
      tags: args.tags || [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return agentId;
  },
});

export const updateAgent = mutation({
  args: {
    agentId: v.id("agents"),
    updates: v.object({
      name: v.optional(v.string()),
      type: v.optional(v.union(v.literal("Bevpro"), v.literal("Venue Voice"))),
      description: v.optional(v.string()),
      customInstructions: v.optional(v.string()),
      context: v.optional(v.string()),
      voiceConfig: v.optional(v.any()),
      voicePipeline: v.optional(v.any()),
      toolPermissions: v.optional(v.any()),
      deploymentSettings: v.optional(v.any()),
      tags: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Ensure voice pipeline always includes WebRTC defaults
    if (args.updates.voicePipeline) {
      args.updates.voicePipeline = {
        ...DEFAULT_VOICE_PIPELINE_CONFIG,
        ...args.updates.voicePipeline,
      };
    }

    await ctx.db.patch(args.agentId, {
      ...args.updates,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

export const getAgent = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) return null;

    // Ensure agent has default WebRTC configuration and migrate if needed
    return {
      ...agent,
      voicePipeline: agent.voicePipeline || DEFAULT_VOICE_PIPELINE_CONFIG,
      isActive: agent.isActive !== undefined ? agent.isActive : (agent.status === 'active' || agent.status === 'draft'),
      createdAt: agent.createdAt || (agent.lastModified ? new Date(agent.lastModified).toISOString() : new Date().toISOString()),
      updatedAt: agent.updatedAt || (agent.lastModified ? new Date(agent.lastModified).toISOString() : new Date().toISOString()),
    };
  },
});

export const getUserAgents = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const agents = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Ensure all agents have default WebRTC configuration and migrate if needed
    return agents.map(agent => ({
      ...agent,
      voicePipeline: agent.voicePipeline || DEFAULT_VOICE_PIPELINE_CONFIG,
      isActive: agent.isActive !== undefined ? agent.isActive : (agent.status === 'active' || agent.status === 'draft'),
      createdAt: agent.createdAt || (agent.lastModified ? new Date(agent.lastModified).toISOString() : new Date().toISOString()),
      updatedAt: agent.updatedAt || (agent.lastModified ? new Date(agent.lastModified).toISOString() : new Date().toISOString()),
    }));
  },
});

export const deleteAgent = mutation({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.delete(args.agentId);
    return { success: true };
  },
});

// Save generated UI for an agent
export const saveGeneratedUI = mutation({
  args: {
    agentId: v.id("agents"),
    generatedUI: v.string(),
    uiCustomization: v.optional(v.any()),
    pwaManifest: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(args.agentId, {
      generatedUI: args.generatedUI,
      uiCustomization: args.uiCustomization,
      pwaManifest: args.pwaManifest,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

// Get generated UI for an agent
export const getAgentUI = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) return null;

    return {
      generatedUI: agent.generatedUI,
      uiCustomization: agent.uiCustomization,
      pwaManifest: agent.pwaManifest,
    };
  },
});

// Update UI customization
export const updateUICustomization = mutation({
  args: {
    agentId: v.id("agents"),
    uiCustomization: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(args.agentId, {
      uiCustomization: args.uiCustomization,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

// Generate PWA manifest for an agent
export const generatePWAManifest = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) return null;

    const manifest = {
      name: `${agent.name} - Voice Agent`,
      short_name: agent.name,
      description: `${agent.type} voice agent for ${agent.description}`,
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: agent.uiCustomization?.colors?.primary || '#3b82f6',
      icons: [
        {
          src: agent.uiCustomization?.logo || '/default-icon.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: agent.uiCustomization?.logo || '/default-icon.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ],
      categories: ['business', 'productivity'],
      lang: 'en',
      scope: '/',
      orientation: 'portrait-primary',
    };

    return manifest;
  },
});

// Migrate existing agents to new schema
export const migrateExistingAgents = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get all agents that need migration
    const agents = await ctx.db.query("agents").collect();
    let migratedCount = 0;

    for (const agent of agents) {
      const updates: any = {};

      // Add missing required fields
      if (!agent.createdAt) {
        updates.createdAt = agent.lastModified 
          ? new Date(agent.lastModified).toISOString() 
          : new Date().toISOString();
      }
      
      if (!agent.updatedAt) {
        updates.updatedAt = agent.lastModified 
          ? new Date(agent.lastModified).toISOString() 
          : new Date().toISOString();
      }

      // Add WebRTC pipeline configuration if missing
      if (!agent.voicePipeline) {
        updates.voicePipeline = DEFAULT_VOICE_PIPELINE_CONFIG;
      }

      // Add deployment settings if missing
      if (!agent.deploymentSettings) {
        updates.deploymentSettings = DEFAULT_AGENT_CONFIG.deploymentSettings;
      }

      // Set isActive based on status
      if (agent.isActive === undefined) {
        updates.isActive = agent.status === 'active' || agent.status === 'draft';
      }

      // Update agent if there are changes
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(agent._id, updates);
        migratedCount++;
      }
    }

    return { success: true, migratedCount };
  },
});

// Get available voice options for UI
export const getVoiceOptions = query({
  args: {},
  handler: async () => {
    return DEFAULT_VOICE_PIPELINE_CONFIG.metadata.voiceOptions;
  },
});

// Get default voice pipeline configuration
export const getDefaultVoicePipeline = query({
  args: {},
  handler: async () => {
    return DEFAULT_VOICE_PIPELINE_CONFIG;
  },
});
