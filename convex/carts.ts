import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
}

export const addToCart = mutation({
  args: { 
    sessionId: v.string(), 
    productId: v.string(), 
    productName: v.string(),
    quantity: v.number(), 
    unitPrice: v.number(),
    category: v.string()
  },
  handler: async (ctx, args) => {
    const cartItem: CartItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productId: args.productId,
      productName: args.productName,
      quantity: args.quantity,
      unitPrice: args.unitPrice,
      totalPrice: args.quantity * args.unitPrice,
      category: args.category
    };

    // This would typically update a Convex table
    // For now, return the cart item and updated total
    return {
      cartItem,
      message: `Added ${args.quantity}x ${args.productName} to cart`,
      totalPrice: cartItem.totalPrice
    };
  }
});

export const removeFromCart = mutation({
  args: { 
    sessionId: v.string(), 
    itemId: v.string() 
  },
  handler: async (ctx, args) => {
    // This would typically remove from a Convex table
    // For now, return success message
    return {
      success: true,
      message: "Item removed from cart",
      itemId: args.itemId
    };
  }
});

export const updateCartItemQuantity = mutation({
  args: { 
    sessionId: v.string(), 
    itemId: v.string(), 
    quantity: v.number() 
  },
  handler: async (ctx, args) => {
    // This would typically update a Convex table
    // For now, return success message
    return {
      success: true,
      message: `Updated quantity to ${args.quantity}`,
      itemId: args.itemId,
      newQuantity: args.quantity
    };
  }
});

export const clearCart = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    // This would typically clear a Convex table
    // For now, return success message
    return {
      success: true,
      message: "Cart cleared successfully"
    };
  }
});

export const getCart = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    // This would typically query a Convex table
    // For now, return mock cart data
    return {
      sessionId: args.sessionId,
      items: [],
      totalAmount: 0,
      itemCount: 0
    };
  }
});

export const calculateCartTotal = query({
  args: { items: v.array(v.object({
    quantity: v.number(),
    unitPrice: v.number()
  })) },
  handler: async (ctx, args) => {
    const total = args.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    return {
      total,
      itemCount: args.items.length
    };
  }
});
