import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Default system instructions for each agent type
const DEFAULT_INSTRUCTIONS = {
  "Venue Voice": `You are a professional venue management assistant. Your core capabilities include:

SCHEDULING & BOOKING MANAGEMENT:
- Check venue availability for specific dates, times, and spaces
- Create, modify, and cancel venue bookings
- Resolve scheduling conflicts and generate confirmations
- Set booking reminders and block venues for maintenance

STAFF MANAGEMENT:
- Schedule staff shifts and assign staff to events
- Process time-off requests and check staff availability
- Track staff certifications and training status

VENDOR COORDINATION:
- Add new vendors and search vendor information
- Schedule vendor meetings and request quotes
- Track vendor performance and maintain relationships

EQUIPMENT & INVENTORY:
- Check equipment availability and reserve for events
- Track maintenance schedules and report issues
- Manage facility inspections and repairs

FINANCIAL OPERATIONS:
- Generate invoices and track payment status
- Process expense reports and create budget reports
- Monitor revenue and cost analysis

DOCUMENT MANAGEMENT:
- Create contracts and store event documents
- Retrieve historical agreements and manage compliance
- Handle insurance documentation and permit tracking

EVENT OPERATIONS:
- Create event timelines and setup instructions
- Coordinate load-in schedules and manage operations
- Handle emergency protocols and safety inspections

COMMUNICATION:
- Send automated notifications and create meeting agendas
- Distribute event updates and manage communications
- Coordinate with clients, staff, and vendors

REPORTING & ANALYTICS:
- Generate venue utilization and revenue reports
- Track booking trends and performance metrics
- Analyze service quality and identify improvements

Always maintain a professional, helpful demeanor. Ask clarifying questions when needed and provide detailed, actionable responses. Prioritize safety, compliance, and client satisfaction.`,

  "Bevpro": `You are Bev, a professional venue employee working at a bar/restaurant. Your core capabilities include:

DRINK ORDERS & MENU:
- Take drink orders with specific quantities and modifications
- Show the complete menu with categories (cocktails, beer, wine, spirits, non-alcoholic)
- Provide detailed drink descriptions and recommendations
- Handle multi-drink orders and complex requests

INVENTORY MANAGEMENT:
- Check stock levels for any drink or ingredient
- Update inventory counts and track usage
- Alert when items are running low or out of stock
- Monitor pour records and consumption patterns

ORDER PROCESSING:
- Add items to customer orders and track totals
- Modify existing orders (change drinks, quantities, remove items)
- Complete orders and process payments
- Handle order cancellations and refunds

CUSTOMER SERVICE:
- Greet customers warmly and provide menu guidance
- Answer questions about drinks, prices, and availability
- Help customers make selections based on preferences
- Process special requests and dietary restrictions

PAYMENT & TRANSACTIONS:
- Calculate order totals and apply appropriate taxes
- Process various payment methods
- Handle split bills and tip calculations
- Generate receipts and track transaction history

MENU & PRICING:
- Provide current drink prices and special offers
- Explain seasonal menu items and limited availability
- Share information about drink ingredients and preparation
- Offer pairing suggestions and recommendations

OPERATIONAL SUPPORT:
- Check system status and report issues
- Monitor venue capacity and wait times
- Coordinate with kitchen and service staff
- Handle equipment issues and maintenance requests

Always maintain a friendly, professional demeanor. Be conversational and helpful, asking clarifying questions when needed. Prioritize accuracy in orders, inventory management, and customer satisfaction. Use natural language and be conversational in your responses.`
};

// Default wake words for each agent type
const DEFAULT_WAKE_WORDS = {
  "Venue Voice": {
    order: ["hey venue", "hey manager", "hey admin", "hey boss", "hey coordinator"],
    inquiry: ["hey assistant", "hey helper", "hey support", "hey guide", "hey advisor"]
  },
  "Bevpro": {
    order: ["hey bar", "hey bars", "hey barb", "hey boss", "hay bar", "a bar", "hey far", "hey ba"],
    inquiry: ["hey bev", "hey beth", "hey belle", "hey beb", "hey v", "hey b", "hey bed"]
  }
};

// Default enabled tools for each agent type
const DEFAULT_TOOLS = {
  "Venue Voice": [
    "book_event", "get_event_bookings", "update_event_booking", "delete_event_booking",
    "create_venue", "list_venues", "update_venue", "delete_venue",
    "create_customer", "search_customers", "update_customer", "delete_customer",
    "create_transaction", "get_transaction_details", "list_transactions",
    "get_order_analytics", "get_sales_report", "get_system_status"
  ],
  "Bevpro": [
    "create_drink", "search_drinks", "get_drink_details", "list_all_drinks", "update_drink", "delete_drink",
    "create_order", "process_order", "get_order_details", "get_orders_list", "update_order_status", "delete_order", "cancel_order",
    "create_customer", "search_customers", "get_customer_details", "list_all_customers", "update_customer", "delete_customer",
    "create_inventory_item", "get_inventory_item_details", "list_inventory_items", "update_inventory_item", "delete_inventory_item",
    "create_pour_record", "get_pour_details", "list_pour_records", "update_pour_record", "delete_pour_record",
    "create_tax_category", "list_tax_categories", "update_tax_category", "delete_tax_category",
    "get_order_analytics", "get_sales_report", "get_inventory_report", "get_system_status"
  ]
};

// Create a new voice agent
export const createAgent = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    type: v.union(v.literal("Venue Voice"), v.literal("Bevpro")),
    description: v.optional(v.string()),
    customInstructions: v.optional(v.string()),
    context: v.optional(v.string()),
    voiceConfig: v.optional(v.object({
      agentName: v.string(),
      wakeWords: v.object({
        order: v.array(v.string()),
        inquiry: v.array(v.string())
      }),
      voice: v.union(v.literal("alloy"), v.literal("echo"), v.literal("fable"), v.literal("onyx"), v.literal("nova"), v.literal("shimmer")),
      temperature: v.number(),
      confidenceThreshold: v.number(),
      responseStyle: v.union(v.literal("professional"), v.literal("friendly"), v.literal("casual")),
      language: v.string(),
      accent: v.optional(v.string()),
    })),
    enabledTools: v.optional(v.array(v.string())),
    toolPermissions: v.optional(v.object({
      canCreate: v.boolean(),
      canRead: v.boolean(),
      canUpdate: v.boolean(),
      canDelete: v.boolean(),
      canProcessPayments: v.boolean(),
      canManageInventory: v.boolean(),
      canViewAnalytics: v.boolean(),
    })),
    deploymentSettings: v.optional(v.object({
      isPublic: v.boolean(),
      requiresAuthentication: v.boolean(),
      allowedDomains: v.optional(v.array(v.string())),
      rateLimit: v.optional(v.object({
        requestsPerMinute: v.number(),
        burstLimit: v.number()
      })),
      maxConcurrentSessions: v.optional(v.number()),
    })),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Set defaults based on agent type
    const defaultVoiceConfig = {
      agentName: args.name,
      wakeWords: DEFAULT_WAKE_WORDS[args.type],
      voice: "alloy" as const,
      temperature: 0.8,
      confidenceThreshold: 0.4,
      responseStyle: "professional" as const,
      language: "en-US",
    };

    const defaultToolPermissions = {
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: true,
      canProcessPayments: args.type === "Bevpro",
      canManageInventory: true,
      canViewAnalytics: true,
    };

    const defaultDeploymentSettings = {
      isPublic: false,
      requiresAuthentication: true,
      maxConcurrentSessions: 10,
    };

    const agent = {
      userId: args.userId,
      name: args.name,
      type: args.type,
      status: "draft" as const,
      
      // Voice Configuration
      voiceConfig: args.voiceConfig || defaultVoiceConfig,
      
      // System Instructions
      systemInstructions: DEFAULT_INSTRUCTIONS[args.type],
      customInstructions: args.customInstructions || "",
      context: args.context || `General ${args.type} context for venue operations`,
      
      // Tools and Capabilities
      enabledTools: args.enabledTools || DEFAULT_TOOLS[args.type],
      toolPermissions: args.toolPermissions || defaultToolPermissions,
      
      // Deployment Settings
      deploymentSettings: args.deploymentSettings || defaultDeploymentSettings,
      
      // Metadata
      description: args.description || `${args.type} agent for venue management`,
      tags: args.tags || [args.type.toLowerCase().replace(" ", "_")],
      version: "1.0.0",
      lastModified: now,
      createdBy: args.userId,
      
      // Statistics
      stats: {
        totalDeployments: 0,
        totalInteractions: 0,
        lastActive: undefined,
        averageResponseTime: undefined,
        successRate: undefined,
      },
    };

    const agentId = await ctx.db.insert("agents", agent);
    return { agentId, agent };
  },
});

// Get all agents for a user
export const getUserAgents = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get agent by ID
export const getAgent = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.agentId);
  },
});

// Update agent configuration
export const updateAgent = mutation({
  args: {
    agentId: v.id("agents"),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      voiceConfig: v.optional(v.object({
        agentName: v.string(),
        wakeWords: v.object({
          order: v.array(v.string()),
          inquiry: v.array(v.string())
        }),
        voice: v.union(v.literal("alloy"), v.literal("echo"), v.literal("fable"), v.literal("onyx"), v.literal("nova"), v.literal("shimmer")),
        temperature: v.number(),
        confidenceThreshold: v.number(),
        responseStyle: v.union(v.literal("professional"), v.literal("friendly"), v.literal("casual")),
        language: v.string(),
        accent: v.optional(v.string()),
      })),
      customInstructions: v.optional(v.string()),
      context: v.optional(v.string()),
      enabledTools: v.optional(v.array(v.string())),
      toolPermissions: v.optional(v.object({
        canCreate: v.boolean(),
        canRead: v.boolean(),
        canUpdate: v.boolean(),
        canDelete: v.boolean(),
        canProcessPayments: v.boolean(),
        canManageInventory: v.boolean(),
        canViewAnalytics: v.boolean(),
      })),
      deploymentSettings: v.optional(v.object({
        isPublic: v.boolean(),
        requiresAuthentication: v.boolean(),
        allowedDomains: v.optional(v.array(v.string())),
        rateLimit: v.optional(v.object({
          requestsPerMinute: v.number(),
          burstLimit: v.number()
        })),
        maxConcurrentSessions: v.optional(v.number()),
      })),
      tags: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error("Agent not found");
    }

    const updatedAgent = {
      ...agent,
      ...args.updates,
      lastModified: Date.now(),
    };

    await ctx.db.patch(args.agentId, updatedAgent);
    return updatedAgent;
  },
});

// Update agent status
export const updateAgentStatus = mutation({
  args: {
    agentId: v.id("agents"),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("draft")),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error("Agent not found");
    }

    await ctx.db.patch(args.agentId, {
      status: args.status,
      lastModified: Date.now(),
    });

    return { success: true, status: args.status };
  },
});

// Delete agent
export const deleteAgent = mutation({
  args: {
    agentId: v.id("agents"),
    userId: v.string(), // For authorization
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error("Agent not found");
    }

    if (agent.userId !== args.userId) {
      throw new Error("Unauthorized to delete this agent");
    }

    // Check if agent has active deployments
    const deployments = await ctx.db
      .query("deployments")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    if (deployments.length > 0) {
      throw new Error("Cannot delete agent with active deployments. Please pause or delete deployments first.");
    }

    await ctx.db.delete(args.agentId);
    return { success: true };
  },
});

// Get agent statistics
export const getAgentStats = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error("Agent not found");
    }

    // Get deployment stats
    const deployments = await ctx.db
      .query("deployments")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    // Get session stats
    const sessions = await ctx.db
      .query("voiceSessions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    // Calculate totals
    const totalDeployments = deployments.length;
    const activeDeployments = deployments.filter(d => d.status === "active").length;
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.status === "active").length;
    const totalInteractions = sessions.reduce((sum, session) => sum + (session.stats?.totalCommands || 0), 0);

    return {
      agent: agent,
      stats: {
        totalDeployments,
        activeDeployments,
        totalSessions,
        activeSessions,
        totalInteractions,
        lastActive: agent.stats?.lastActive,
        averageResponseTime: agent.stats?.averageResponseTime,
        successRate: agent.stats?.successRate,
      },
    };
  },
});

// Get agents by type
export const getAgentsByType = query({
  args: { 
    userId: v.string(),
    type: v.union(v.literal("Venue Voice"), v.literal("Bevpro"))
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("type"), args.type))
      .order("desc")
      .collect();
  },
});

// Get active agents
export const getActiveAgents = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .order("desc")
      .collect();
  },
});
