import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create a new deployment
export const createDeployment = mutation({
  args: {
    agentId: v.id("agents"),
    userId: v.string(),
    name: v.string(),
    deploymentType: v.union(v.literal("pwa"), v.literal("web"), v.literal("api")),
    url: v.optional(v.string()),
    settings: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const deployment = {
      agentId: args.agentId,
      userId: args.userId,
      name: args.name,
      status: "active" as const,
      deploymentType: args.deploymentType,
      url: args.url,
      settings: args.settings || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const deploymentId = await ctx.db.insert("deployments", deployment);

    // Update agent with deployment info
    await ctx.db.patch(args.agentId, {
      updatedAt: new Date().toISOString(),
    });

    return deploymentId;
  },
});

// Get all deployments for a user
export const getUserDeployments = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("deployments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get deployments for a specific agent
export const getAgentDeployments = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("deployments")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();
  },
});

// Get deployment by ID
export const getDeployment = query({
  args: { deploymentId: v.id("deployments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.deploymentId);
  },
});

// Update deployment status
export const updateDeploymentStatus = mutation({
  args: {
    deploymentId: v.id("deployments"),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("stopped")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(args.deploymentId, {
      status: args.status,
      updatedAt: new Date().toISOString(),
    });

    return { success: true, status: args.status };
  },
});

// Update deployment configuration
export const updateDeployment = mutation({
  args: {
    deploymentId: v.id("deployments"),
    updates: v.object({
      name: v.optional(v.string()),
      url: v.optional(v.string()),
      settings: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(args.deploymentId, {
      ...args.updates,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

// Delete deployment
export const deleteDeployment = mutation({
  args: { deploymentId: v.id("deployments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.delete(args.deploymentId);
    return { success: true };
  },
});

// Get deployment statistics
export const getDeploymentStats = query({
  args: { deploymentId: v.id("deployments") },
  handler: async (ctx, args) => {
    const deployment = await ctx.db.get(args.deploymentId);
    if (!deployment) {
      throw new Error("Deployment not found");
    }

    // Get voice sessions for this deployment
    const sessions = await ctx.db
      .query("voiceSessions")
      .withIndex("by_agent", (q) => q.eq("agentId", deployment.agentId))
      .collect();

    // Get voice commands for this deployment
    const commands = await ctx.db
      .query("voiceCommands")
      .withIndex("by_agent", (q) => q.eq("agentId", deployment.agentId))
      .collect();

    // Calculate statistics
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.status === "active").length;
    const totalCommands = commands.length;
    const successfulCommands = commands.filter(c => c.success).length;
    const failedCommands = commands.filter(c => !c.success).length;

    return {
      deployment: deployment,
      stats: {
        totalSessions,
        activeSessions,
        totalCommands,
        successfulCommands,
        failedCommands,
        successRate: totalCommands > 0 ? (successfulCommands / totalCommands) * 100 : 0,
        lastActivity: deployment.updatedAt,
      },
    };
  },
});
