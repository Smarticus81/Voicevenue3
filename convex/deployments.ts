import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new deployment
export const createDeployment = mutation({
  args: {
    agentId: v.id("agents"),
    userId: v.string(),
    name: v.string(),
    environment: v.union(v.literal("development"), v.literal("staging"), v.literal("production")),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    config: v.object({
      embedCode: v.string(),
      webhookUrl: v.optional(v.string()),
      apiKey: v.optional(v.string()),
      customDomain: v.optional(v.string()),
    }),
    accessControl: v.object({
      allowedUsers: v.optional(v.array(v.string())),
      allowedRoles: v.optional(v.array(v.string())),
      ipWhitelist: v.optional(v.array(v.string())),
      timeRestrictions: v.optional(v.object({
        startTime: v.optional(v.string()),
        endTime: v.optional(v.string()),
        timezone: v.optional(v.string()),
        daysOfWeek: v.optional(v.array(v.number())),
      })),
    }),
    monitoring: v.object({
      isEnabled: v.boolean(),
      logLevel: v.union(v.literal("error"), v.literal("warn"), v.literal("info"), v.literal("debug")),
      alertThresholds: v.optional(v.object({
        errorRate: v.optional(v.number()),
        responseTime: v.optional(v.number()),
        concurrentUsers: v.optional(v.number()),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const deployment = {
      agentId: args.agentId,
      userId: args.userId,
      name: args.name,
      environment: args.environment,
      status: "active" as const,
      
      // Configuration
      config: args.config,
      accessControl: args.accessControl,
      monitoring: args.monitoring,
      
      // Metadata
      description: args.description || `${args.name} deployment`,
      tags: args.tags || [args.environment],
      version: "1.0.0",
      deployedAt: now,
      lastModified: now,
      
      // Statistics
      stats: {
        totalSessions: 0,
        activeSessions: 0,
        totalInteractions: 0,
        averageResponseTime: undefined,
        errorCount: 0,
        lastActivity: undefined,
      },
    };

    const deploymentId = await ctx.db.insert("deployments", deployment);
    
    // Update agent stats
    const agent = await ctx.db.get(args.agentId);
    if (agent && 'stats' in agent) {
      const agentStats = agent.stats as any;
      await ctx.db.patch(args.agentId, {
        stats: {
          ...agentStats,
          totalDeployments: (agentStats?.totalDeployments || 0) + 1,
        },
        lastModified: now,
      });
    }

    return { deploymentId, deployment };
  },
});

// Get deployments for an agent
export const getAgentDeployments = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("deployments")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
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
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("maintenance")),
  },
  handler: async (ctx, args) => {
    const deployment = await ctx.db.get(args.deploymentId);
    if (!deployment) {
      throw new Error("Deployment not found");
    }

    await ctx.db.patch(args.deploymentId, {
      status: args.status,
      lastModified: Date.now(),
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
      description: v.optional(v.string()),
      config: v.optional(v.object({
        embedCode: v.string(),
        webhookUrl: v.optional(v.string()),
        apiKey: v.optional(v.string()),
        customDomain: v.optional(v.string()),
      })),
      accessControl: v.optional(v.object({
        allowedUsers: v.optional(v.array(v.string())),
        allowedRoles: v.optional(v.array(v.string())),
        ipWhitelist: v.optional(v.array(v.string())),
        timeRestrictions: v.optional(v.object({
          startTime: v.optional(v.string()),
          endTime: v.optional(v.string()),
          timezone: v.optional(v.string()),
          daysOfWeek: v.optional(v.array(v.number())),
        })),
      })),
      monitoring: v.optional(v.object({
        isEnabled: v.boolean(),
        logLevel: v.union(v.literal("error"), v.literal("warn"), v.literal("info"), v.literal("debug")),
        alertThresholds: v.optional(v.object({
          errorRate: v.optional(v.number()),
          responseTime: v.optional(v.number()),
          concurrentUsers: v.optional(v.number()),
        })),
      })),
      tags: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const deployment = await ctx.db.get(args.deploymentId);
    if (!deployment) {
      throw new Error("Deployment not found");
    }

    const updatedDeployment = {
      ...deployment,
      ...args.updates,
      lastModified: Date.now(),
    };

    await ctx.db.patch(args.deploymentId, updatedDeployment);
    return updatedDeployment;
  },
});

// Delete deployment
export const deleteDeployment = mutation({
  args: {
    deploymentId: v.id("deployments"),
    userId: v.string(), // For authorization
  },
  handler: async (ctx, args) => {
    const deployment = await ctx.db.get(args.deploymentId);
    if (!deployment) {
      throw new Error("Deployment not found");
    }

    if (deployment.userId !== args.userId) {
      throw new Error("Unauthorized to delete this deployment");
    }

    // Check if deployment has active sessions
    const activeSessions = await ctx.db
      .query("voiceSessions")
      .withIndex("by_deployment", (q) => q.eq("deploymentId", args.deploymentId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    if (activeSessions.length > 0) {
      throw new Error("Cannot delete deployment with active sessions. Please end all sessions first.");
    }

    await ctx.db.delete(args.deploymentId);
    
    // Update agent stats
    const agent = await ctx.db.get(deployment.agentId as any);
    if (agent && 'stats' in agent) {
      const agentStats = agent.stats as any;
      await ctx.db.patch(deployment.agentId as any, {
        stats: {
          ...agentStats,
          totalDeployments: Math.max(0, (agentStats?.totalDeployments || 0) - 1),
        },
        lastModified: Date.now(),
      });
    }

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

    // Get session stats
    const sessions = await ctx.db
      .query("voiceSessions")
      .withIndex("by_deployment", (q) => q.eq("deploymentId", args.deploymentId))
      .collect();

    // Get command stats
    const commands = await ctx.db
      .query("voiceCommands")
      .withIndex("by_deployment", (q) => q.eq("deploymentId", args.deploymentId))
      .collect();

    // Calculate totals
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.status === "active").length;
    const totalCommands = commands.length;
    const successfulCommands = commands.filter(c => c.status === "completed").length;
    const failedCommands = commands.filter(c => c.status === "failed").length;
    const averageResponseTime = commands.length > 0 
      ? commands.reduce((sum, cmd) => sum + (cmd.processingTime || 0), 0) / commands.length
      : undefined;

    return {
      deployment: deployment,
      stats: {
        totalSessions,
        activeSessions,
        totalCommands,
        successfulCommands,
        failedCommands,
        averageResponseTime,
        errorCount: failedCommands,
        lastActivity: deployment.stats?.lastActivity,
      },
    };
  },
});

// Get deployments by user
export const getUserDeployments = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("deployments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get active deployments
export const getActiveDeployments = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("deployments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .order("desc")
      .collect();
  },
});
