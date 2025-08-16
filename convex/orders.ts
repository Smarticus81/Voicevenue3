import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export interface Order {
  id: string;
  sessionId: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  createdAt: number;
  updatedAt: number;
  customerId?: string;
  notes?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
}

export const createOrder = mutation({
  args: { 
    sessionId: v.string(), 
    userId: v.string(),
    items: v.array(v.object({
      productId: v.string(),
      productName: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      totalPrice: v.number(),
      category: v.string()
    })), 
    customerId: v.optional(v.string()),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const orderItems: OrderItem[] = args.items.map((item, index) => ({
      id: `order_item_${Date.now()}_${index}`,
      ...item
    }));

    const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

    const order: Order = {
      id: orderId,
      sessionId: args.sessionId,
      userId: args.userId,
      items: orderItems,
      totalAmount,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      customerId: args.customerId,
      notes: args.notes
    };

    // This would typically store in a Convex table
    // For now, return the order
    return {
      order,
      message: `Order created successfully! Total: $${totalAmount.toFixed(2)}`,
      orderId
    };
  }
});

export const updateOrderStatus = mutation({
  args: { 
    orderId: v.string(), 
    status: v.union(
      v.literal("pending"), 
      v.literal("processing"), 
      v.literal("completed"), 
      v.literal("cancelled")
    ) 
  },
  handler: async (ctx, args) => {
    // This would typically update a Convex table
    // For now, return success message
    return {
      success: true,
      message: `Order status updated to ${args.status}`,
      orderId: args.orderId,
      newStatus: args.status
    };
  }
});

export const getOrder = query({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    // This would typically query a Convex table
    // For now, return mock order data
    return {
      id: args.orderId,
      status: "pending",
      items: [],
      totalAmount: 0,
      createdAt: Date.now()
    };
  }
});

export const getOrdersBySession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    // This would typically query a Convex table
    // For now, return mock orders
    return [];
  }
});

export const cancelOrder = mutation({
  args: { 
    orderId: v.string(),
    confirm: v.boolean()
  },
  handler: async (ctx, args) => {
    if (!args.confirm) {
      throw new Error("Confirmation required to cancel order");
    }

    // This would typically update a Convex table
    // For now, return success message
    return {
      success: true,
      message: "Order cancelled successfully",
      orderId: args.orderId
    };
  }
});
