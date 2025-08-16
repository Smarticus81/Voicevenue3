import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export interface VoiceCommand {
  id: string;
  sessionId: string;
  command: string;
  confidence: number;
  mode: string;
  timestamp: number;
  processed: boolean;
  response?: string;
  action?: string;
}

export interface CommandResponse {
  success: boolean;
  message: string;
  action: string;
  data?: any;
  requiresConfirmation?: boolean;
}

export const processVoiceCommand = mutation({
  args: { 
    sessionId: v.string(), 
    command: v.string(), 
    confidence: v.number(),
    mode: v.string() 
  },
  handler: async (ctx, args) => {
    if (args.confidence < 0.4) {
      return {
        success: false,
        message: "I'm not sure I heard that right. Could you repeat?",
        action: "repeat_request",
        requiresConfirmation: false
      };
    }

    const command = args.command.toLowerCase().trim();
    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Process the command based on mode and content
    const response = await processCommandLogic(command, args.mode, args.sessionId);

    // Store command for analytics (this would typically go to a Convex table)
    const voiceCommand: VoiceCommand = {
      id: commandId,
      sessionId: args.sessionId,
      command: args.command,
      confidence: args.confidence,
      mode: args.mode,
      timestamp: Date.now(),
      processed: true,
      response: response.message,
      action: response.action
    };

    return response;
  }
});

async function processCommandLogic(command: string, mode: string, sessionId: string): Promise<CommandResponse> {
  // Wake word detection
  if (mode === "wake_word") {
    return handleWakeWord(command);
  }

  // Command processing
  if (mode === "command") {
    return handleCommand(command, sessionId);
  }

  // Shutdown mode
  if (mode === "shutdown") {
    return {
      success: false,
      message: "Voice system is currently shut down",
      action: "system_shutdown",
      requiresConfirmation: false
    };
  }

  return {
    success: false,
    message: "Unknown mode. Please try again.",
    action: "error",
    requiresConfirmation: false
  };
}

function handleWakeWord(command: string): CommandResponse {
  const orderWakeWords = ['hey bar', 'hey bars', 'hey barb', 'hey boss', 'hay bar', 'a bar', 'hey far', 'hey ba'];
  const inquiryWakeWords = ['hey bev', 'hey beth', 'hey belle', 'hey beb', 'hey v', 'hey b', 'hey bed'];

  if (orderWakeWords.some(word => command.includes(word))) {
    return {
      success: true,
      message: "Hi there! What can I get you?",
      action: "wake_word_order",
      requiresConfirmation: false
    };
  }

  if (inquiryWakeWords.some(word => command.includes(word))) {
    return {
      success: true,
      message: "Hi there! How can I help you?",
      action: "wake_word_inquiry",
      requiresConfirmation: false
    };
  }

  return {
    success: false,
    message: "I didn't catch that. Could you repeat?",
    action: "repeat_request",
    requiresConfirmation: false
  };
}

async function handleCommand(command: string, sessionId: string): Promise<CommandResponse> {
  // System commands
  if (command.includes('stop listening') || command.includes('exit')) {
    return {
      success: true,
      message: "Going back to wake word mode.",
      action: "switch_to_wake_word",
      requiresConfirmation: false
    };
  }

  if (command.includes('shut down') || command.includes('shutdown')) {
    return {
      success: true,
      message: "Voice system shutting down.",
      action: "system_shutdown",
      requiresConfirmation: false
    };
  }

  // Help command
  if (command.includes('help')) {
    return {
      success: true,
      message: "I can help you order drinks, manage your cart, and process payments. Try saying something like 'I want a beer' or 'Add two beers to my order'",
      action: "help",
      requiresConfirmation: false
    };
  }

  // Cart management
  if (command.includes('show cart') || command.includes('what\'s in my cart')) {
    return {
      success: true,
      message: "Showing your current cart.",
      action: "show_cart",
      requiresConfirmation: false
    };
  }

  if (command.includes('clear cart') || command.includes('empty cart')) {
    return {
      success: true,
      message: "Cart cleared!",
      action: "clear_cart",
      requiresConfirmation: false
    };
  }

  // Order placement
  if (command.includes('place order') || command.includes('checkout') || command.includes('complete order')) {
    return {
      success: true,
      message: "Processing your order now.",
      action: "place_order",
      requiresConfirmation: false
    };
  }

  // Product ordering (this would integrate with Square MCP tools)
  if (command.includes('add') || command.includes('want') || command.includes('need') || command.includes('take')) {
    return await processProductOrder(command, sessionId);
  }

  // Navigation
  if (command.includes('inventory') || command.includes('menu')) {
    return {
      success: true,
      message: "Switched to Inventory",
      action: "navigate_inventory",
      requiresConfirmation: false
    };
  }

  if (command.includes('orders') || command.includes('history')) {
    return {
      success: true,
      message: "Showing closed orders",
      action: "navigate_orders",
      requiresConfirmation: false
    };
  }

  // Default response
  return {
    success: false,
    message: "I didn't understand that command. Try saying 'help' for assistance.",
    action: "unknown_command",
    requiresConfirmation: false
  };
}

async function processProductOrder(command: string, sessionId: string): Promise<CommandResponse> {
  // This is where you'd integrate with Square MCP tools
  // For now, we'll return a mock response
  
  // Extract quantity and product from command
  const quantityMatch = command.match(/(\d+)\s+/);
  const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
  
  // Simple product detection (this would be more sophisticated with Square integration)
  let productName = "drink";
  let unitPrice = 8.99;
  
  if (command.includes('beer')) {
    productName = "beer";
    unitPrice = 6.99;
  } else if (command.includes('wine')) {
    productName = "wine";
    unitPrice = 12.99;
  } else if (command.includes('cocktail')) {
    productName = "cocktail";
    unitPrice = 14.99;
  }

  const totalPrice = quantity * unitPrice;

  return {
    success: true,
    message: `Added ${quantity}x ${productName}!`,
    action: "add_to_cart",
    data: {
      productName,
      quantity,
      unitPrice,
      totalPrice
    },
    requiresConfirmation: false
  };
}

export const getCommandHistory = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    // This would typically query a Convex table
    // For now, return mock data
    return [];
  }
});
