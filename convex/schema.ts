import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  agents: defineTable({
    userId: v.string(),
    name: v.string(),
    type: v.union(v.literal("Bevpro"), v.literal("Venue Voice")),
    description: v.string(),
    customInstructions: v.string(),
    context: v.string(),
    voiceConfig: v.any(), // Voice configuration including voice type, temperature, etc.
    voicePipeline: v.any(), // WebRTC pipeline configuration
    toolPermissions: v.any(), // Tool permissions and capabilities
    deploymentSettings: v.any(), // Deployment and PWA settings
    tags: v.array(v.string()),
    isActive: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"])
    .index("by_active", ["isActive"]),

  deployments: defineTable({
    agentId: v.id("agents"),
    userId: v.string(),
    name: v.string(),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("stopped")),
    deploymentType: v.union(v.literal("pwa"), v.literal("web"), v.literal("api")),
    url: v.optional(v.string()),
    settings: v.any(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_agent", ["agentId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  voiceSessions: defineTable({
    agentId: v.id("agents"),
    userId: v.string(),
    sessionId: v.string(),
    status: v.union(v.literal("active"), v.literal("ended"), v.literal("error")),
    startTime: v.string(),
    endTime: v.optional(v.string()),
    duration: v.optional(v.number()),
    stats: v.any(),
    metadata: v.any(),
  })
    .index("by_agent", ["agentId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_session", ["sessionId"]),

  voiceCommands: defineTable({
    sessionId: v.string(),
    agentId: v.id("agents"),
    userId: v.string(),
    command: v.string(),
    intent: v.optional(v.string()),
    confidence: v.optional(v.number()),
    entities: v.optional(v.any()),
    response: v.string(),
    timestamp: v.string(),
    processingTime: v.optional(v.number()),
    success: v.boolean(),
  })
    .index("by_session", ["sessionId"])
    .index("by_agent", ["agentId"])
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),

  carts: defineTable({
    sessionId: v.string(),
    agentId: v.id("agents"),
    userId: v.string(),
    items: v.array(v.any()),
    total: v.number(),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("cancelled")),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_session", ["sessionId"])
    .index("by_agent", ["agentId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  orders: defineTable({
    cartId: v.id("carts"),
    agentId: v.id("agents"),
    userId: v.string(),
    items: v.array(v.any()),
    total: v.number(),
    tax: v.number(),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("cancelled")),
    paymentMethod: v.optional(v.string()),
    paymentStatus: v.union(v.literal("pending"), v.literal("paid"), v.literal("failed")),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_cart", ["cartId"])
    .index("by_agent", ["agentId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  userProfiles: defineTable({
    userId: v.string(),
    email: v.string(),
    name: v.string(),
    organization: v.optional(v.string()),
    preferences: v.any(),
    settings: v.any(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_email", ["email"]),
});
