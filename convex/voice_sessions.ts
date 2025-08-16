import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export interface VoiceSession {
  id: string;
  userId: string;
  agentName: string;
  mode: "wake_word" | "command" | "shutdown";
  currentCart: CartItem[];
  totalAmount: number;
  lastActivity: number;
  createdAt: number;
  isActive: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
}

export const createVoiceSession = mutation({
  args: { 
    userId: v.string(), 
    agentName: v.string() 
  },
  handler: async (ctx, args) => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: VoiceSession = {
      id: sessionId,
      userId: args.userId,
      agentName: args.agentName,
      mode: "wake_word",
      currentCart: [],
      totalAmount: 0,
      lastActivity: Date.now(),
      createdAt: Date.now(),
      isActive: true
    };

    // Store in Convex (you can use a table or just return the session)
    // For now, we'll return the session and you can store it in your preferred way
    return session;
  }
});

export const updateVoiceSession = mutation({
  args: { 
    sessionId: v.string(), 
    mode: v.optional(v.union(v.literal("wake_word"), v.literal("command"), v.literal("shutdown"))),
    cart: v.optional(v.array(v.object({
      id: v.string(),
      productId: v.string(),
      productName: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      totalPrice: v.number(),
      category: v.string()
    }))),
    totalAmount: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // Update session state
    // This would typically update a Convex table
    // For now, return the update data
    return {
      sessionId: args.sessionId,
      updates: {
        mode: args.mode,
        cart: args.cart,
        totalAmount: args.totalAmount,
        lastActivity: Date.now()
      }
    };
  }
});

export const getVoiceSession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    // Retrieve session data
    // This would typically query a Convex table
    // For now, return mock data
    return {
      id: args.sessionId,
      mode: "wake_word",
      currentCart: [],
      totalAmount: 0,
      lastActivity: Date.now()
    };
  }
});
