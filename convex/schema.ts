import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Voice Agents table
  agents: defineTable({
    userId: v.string(),
    name: v.string(),
    type: v.union(v.literal("Venue Voice"), v.literal("Bevpro")),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("draft")),
    
    // Voice Configuration
    voiceConfig: v.object({
      agentName: v.string(), // Custom name for the agent
      wakeWords: v.object({
        order: v.array(v.string()), // Order-related wake words
        inquiry: v.array(v.string()) // Inquiry-related wake words
      }),
      voice: v.union(v.literal("alloy"), v.literal("echo"), v.literal("fable"), v.literal("onyx"), v.literal("nova"), v.literal("shimmer")),
      temperature: v.number(), // AI response creativity (0.0 - 2.0)
      confidenceThreshold: v.number(), // Speech recognition confidence (0.0 - 1.0)
      responseStyle: v.union(v.literal("professional"), v.literal("friendly"), v.literal("casual")),
      language: v.string(), // Primary language
      accent: v.optional(v.string()), // Regional accent preference
    }),
    
    // System Instructions
    systemInstructions: v.string(), // Base system instructions
    customInstructions: v.optional(v.string()), // User-customized instructions
    context: v.string(), // Venue-specific context
    
    // Tools and Capabilities
    enabledTools: v.array(v.string()), // Which Square MCP tools are enabled
    toolPermissions: v.optional(v.object({
      canCreate: v.boolean(),
      canRead: v.boolean(),
      canUpdate: v.boolean(),
      canDelete: v.boolean(),
      canProcessPayments: v.boolean(),
      canManageInventory: v.boolean(),
      canViewAnalytics: v.boolean(),
    })),
    
    // Deployment Settings
    deploymentSettings: v.object({
      isPublic: v.boolean(), // Can be accessed publicly
      requiresAuthentication: v.boolean(), // Requires user login
      allowedDomains: v.optional(v.array(v.string())), // CORS domains
      rateLimit: v.optional(v.object({
        requestsPerMinute: v.number(),
        burstLimit: v.number()
      })),
      maxConcurrentSessions: v.optional(v.number()),
    }),
    
    // Metadata
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    version: v.string(), // Agent version
    lastModified: v.number(), // Timestamp
    createdBy: v.string(), // User ID who created it
    
    // Statistics
    stats: v.optional(v.object({
      totalDeployments: v.number(),
      totalInteractions: v.number(),
      lastActive: v.optional(v.number()),
      averageResponseTime: v.optional(v.number()),
      successRate: v.optional(v.number()),
    })),
  }).index("by_user", ["userId"]).index("by_type", ["type"]).index("by_status", ["status"]),
  
  // Agent Deployments table
  deployments: defineTable({
    agentId: v.string(), // Reference to agents table
    userId: v.string(), // Owner of the deployment
    name: v.string(), // Deployment name
    environment: v.union(v.literal("development"), v.literal("staging"), v.literal("production")),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("maintenance")),
    
    // Deployment Configuration
    config: v.object({
      embedCode: v.string(), // Generated embed code
      webhookUrl: v.optional(v.string()), // Webhook for external integrations
      apiKey: v.optional(v.string()), // API key for programmatic access
      customDomain: v.optional(v.string()), // Custom domain if applicable
    }),
    
    // Access Control
    accessControl: v.object({
      allowedUsers: v.optional(v.array(v.string())), // Specific user IDs
      allowedRoles: v.optional(v.array(v.string())), // Role-based access
      ipWhitelist: v.optional(v.array(v.string())), // IP address restrictions
      timeRestrictions: v.optional(v.object({
        startTime: v.optional(v.string()), // Daily start time (HH:MM)
        endTime: v.optional(v.string()), // Daily end time (HH:MM)
        timezone: v.optional(v.string()), // Timezone
        daysOfWeek: v.optional(v.array(v.number())), // 0-6 (Sunday-Saturday)
      })),
    }),
    
    // Monitoring and Analytics
    monitoring: v.object({
      isEnabled: v.boolean(),
      logLevel: v.union(v.literal("error"), v.literal("warn"), v.literal("info"), v.literal("debug")),
      alertThresholds: v.optional(v.object({
        errorRate: v.optional(v.number()), // Error rate percentage
        responseTime: v.optional(v.number()), // Max response time in ms
        concurrentUsers: v.optional(v.number()), // Max concurrent users
      })),
    }),
    
    // Metadata
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    version: v.string(), // Deployment version
    deployedAt: v.number(), // Timestamp when deployed
    lastModified: v.number(), // Timestamp of last modification
    
    // Statistics
    stats: v.optional(v.object({
      totalSessions: v.number(),
      activeSessions: v.number(),
      totalInteractions: v.number(),
      averageResponseTime: v.optional(v.number()),
      errorCount: v.number(),
      lastActivity: v.optional(v.number()),
    })),
  }).index("by_agent", ["agentId"]).index("by_user", ["userId"]).index("by_status", ["status"]),
  
  // Voice Sessions table
  voiceSessions: defineTable({
    deploymentId: v.string(), // Reference to deployments table
    agentId: v.string(), // Reference to agents table
    userId: v.optional(v.string()), // User ID if authenticated
    sessionId: v.string(), // Unique session identifier
    
    // Session State
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("ended"), v.literal("error")),
    mode: v.union(v.literal("wake_word"), v.literal("command"), v.literal("shutdown")),
    
    // Session Data
    context: v.optional(v.object({
      currentCart: v.optional(v.array(v.object({
        productId: v.string(),
        productName: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
        totalPrice: v.number(),
        category: v.string(),
      }))),
      lastCommand: v.optional(v.string()),
      lastResponse: v.optional(v.string()),
      conversationHistory: v.optional(v.array(v.object({
        timestamp: v.number(),
        type: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        confidence: v.optional(v.number()),
      }))),
    })),
    
    // Metadata
    startedAt: v.number(),
    lastActivity: v.number(),
    endedAt: v.optional(v.number()),
    duration: v.optional(v.number()), // Session duration in milliseconds
    
    // Analytics
    stats: v.optional(v.object({
      totalCommands: v.number(),
      successfulCommands: v.number(),
      failedCommands: v.number(),
      averageResponseTime: v.optional(v.number()),
      wakeWordActivations: v.number(),
      modeSwitches: v.number(),
    })),
  }).index("by_deployment", ["deploymentId"]).index("by_agent", ["agentId"]).index("by_user", ["userId"]).index("by_status", ["status"]),
  
  // Voice Commands table
  voiceCommands: defineTable({
    sessionId: v.string(), // Reference to voiceSessions table
    deploymentId: v.string(), // Reference to deployments table
    agentId: v.string(), // Reference to agents table
    
    // Command Data
    command: v.string(), // The voice command received
    confidence: v.number(), // Speech recognition confidence
    mode: v.string(), // Session mode when command was received
    
    // Processing
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    response: v.optional(v.string()), // AI response
    action: v.optional(v.string()), // Action taken
    error: v.optional(v.string()), // Error message if failed
    
    // Tool Execution
    toolCalls: v.optional(v.array(v.object({
      toolName: v.string(),
      parameters: v.any(),
      result: v.optional(v.any()),
      executionTime: v.optional(v.number()),
      success: v.optional(v.boolean()),
    }))),
    
    // Metadata
    timestamp: v.number(),
    processingTime: v.optional(v.number()), // Time to process in milliseconds
    userAgent: v.optional(v.string()), // Browser/client information
    ipAddress: v.optional(v.string()), // Client IP address
  }).index("by_session", ["sessionId"]).index("by_deployment", ["deploymentId"]).index("by_agent", ["agentId"]).index("by_status", ["status"]),
  
  // User Profiles table
  userProfiles: defineTable({
    userId: v.string(), // Clerk user ID
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    
    // Venue Information
    venue: v.optional(v.object({
      name: v.string(),
      type: v.union(v.literal("bar"), v.literal("restaurant"), v.literal("event_venue"), v.literal("multi_purpose")),
      address: v.optional(v.string()),
      phone: v.optional(v.string()),
      website: v.optional(v.string()),
      capacity: v.optional(v.number()),
      description: v.optional(v.string()),
    })),
    
    // Square Integration
    squareIntegration: v.optional(v.object({
      isConnected: v.boolean(),
      connectedAt: v.optional(v.number()),
      lastSync: v.optional(v.number()),
      environment: v.union(v.literal("sandbox"), v.literal("production")),
      permissions: v.optional(v.array(v.string())),
    })),
    
    // Subscription and Billing
    subscription: v.optional(v.object({
      plan: v.union(v.literal("free"), v.literal("starter"), v.literal("professional"), v.literal("enterprise")),
      status: v.union(v.literal("active"), v.literal("past_due"), v.literal("canceled"), v.literal("unpaid")),
      currentPeriodStart: v.optional(v.number()),
      currentPeriodEnd: v.optional(v.number()),
      cancelAtPeriodEnd: v.optional(v.boolean()),
    })),
    
    // Preferences
    preferences: v.optional(v.object({
      timezone: v.optional(v.string()),
      language: v.optional(v.string()),
      notifications: v.optional(v.object({
        email: v.boolean(),
        push: v.boolean(),
        sms: v.boolean(),
      })),
      theme: v.optional(v.union(v.literal("light"), v.literal("dark"), v.literal("auto"))),
    })),
    
    // Metadata
    createdAt: v.number(),
    lastActive: v.number(),
    isActive: v.boolean(),
  }).index("by_user", ["userId"]).index("by_email", ["email"]),
});
