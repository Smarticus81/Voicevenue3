export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { invokeMcpToolDirect } from '../../../../server/mcp/mcp-direct';

export async function POST(req: Request) {
  try {
    const { text, venueId = 'demo-venue', agentId = 'demo-agent' } = await req.json();
    
    if (!text) {
      return NextResponse.json({ say: "I didn't catch that." });
    }

    const input = text.toLowerCase().trim();
    console.log(`[NLU] Processing: "${input}" for venue: ${venueId}, agent: ${agentId}`);

    // Simple intent matching for bar operations
    let response = { say: "" };

    // Handle common ordering patterns like "Can I get 3 miller lights"
    const orderPatterns = [
      /(?:can i get|i'll have|give me|i want|i'd like)\s+(\d+)?\s*(.+?)(?:\s+please)?$/i,
      /(?:get me|order)\s+(\d+)?\s*(.+?)$/i,
      /(\d+)\s+(.+?)\s*(?:please)?$/i
    ];
    
    let orderMatch = null;
    for (const pattern of orderPatterns) {
      orderMatch = input.match(pattern);
      if (orderMatch) break;
    }
    
    if (orderMatch) {
      const quantity = parseInt(orderMatch[1]) || 1;
      let drinkName = orderMatch[2].trim();
      
      // Clean up common drink name variations
      drinkName = drinkName
        .replace(/\s+(beer|beers|light|lights|lite|lites)$/i, '')
        .replace(/\s+and\s+\d+.*/i, '') // Handle "and" in orders
        .trim();
      
      if (drinkName) {
        try {
          await invokeMcpToolDirect('cart_add', {
            clientId: venueId,
            drink_name: drinkName,
            quantity
          });
          
          response.say = `I've added ${quantity} ${drinkName} to your order. Anything else?`;
        } catch (err) {
          console.error('[NLU] Cart add error:', err);
          response.say = `Sorry, I couldn't add ${drinkName} to the order. Let me check what's available.`;
        }
      }
    }
    // Handle "and" continuation patterns
    else if (input.includes(' and ') && input.match(/(?:and|plus)\s+(\d+)?\s*(.+?)$/i)) {
      const andMatch = input.match(/(?:and|plus)\s+(\d+)?\s*(.+?)$/i);
      if (andMatch) {
        const quantity = parseInt(andMatch[1]) || 1;
        let drinkName = andMatch[2].trim();
        drinkName = drinkName
          .replace(/\s+(beer|beers|light|lights|lite|lites)$/i, '')
          .trim();
          
        if (drinkName) {
          try {
            await invokeMcpToolDirect('cart_add', {
              clientId: venueId,
              drink_name: drinkName,
              quantity
            });
            
            response.say = `Added ${quantity} ${drinkName} as well. Anything else?`;
          } catch (err) {
            console.error('[NLU] Cart add error:', err);
            response.say = `Sorry, I had trouble adding ${drinkName}.`;
          }
        }
      }
    }
    // Handle completion phrases
    else if (input.match(/^(that's it|that's all|nothing else|no|done|finish)$/i)) {
      const result = await invokeMcpToolDirect('cart_view', { clientId: venueId });
      const cart = result.cart || [];
      
      if (cart.length === 0) {
        response.say = "Your order is empty. What would you like to order?";
      } else {
        const items = cart.map((item: any) => `${item.quantity} ${item.name}`).join(', ');
        response.say = `Great! You have ${items}. Would you like to place this order?`;
      }
    }
    // Original cart operations
    else if (input.includes('add') && (input.includes('beer') || input.includes('drink') || input.includes('cocktail') || input.includes('wine'))) {
      // Extract drink name and quantity
      const drinkMatch = input.match(/add\s+(\d+)?\s*(.+?)(?:\s+to\s+cart)?$/i);
      if (drinkMatch) {
        const quantity = parseInt(drinkMatch[1]) || 1;
        const drinkName = drinkMatch[2].replace(/\s*(beer|drink|cocktail|wine)s?\s*/g, '').trim();
        
        await invokeMcpToolDirect('cart_add', {
          clientId: venueId,
          drink_name: drinkName || 'beer',
          quantity
        });
        
        response.say = `Added ${quantity} ${drinkName || 'drink'} to cart.`;
      }
    }
    else if (input.includes('view cart') || input.includes('show cart') || input.includes('what\'s in')) {
      const result = await invokeMcpToolDirect('cart_view', { clientId: venueId });
      const cart = result.cart || [];
      
      if (cart.length === 0) {
        response.say = "Cart is empty.";
      } else {
        const items = cart.map((item: any) => `${item.quantity} ${item.name}`).join(', ');
        response.say = `Cart has: ${items}.`;
      }
    }
    else if (input.includes('checkout') || input.includes('place order') || input.includes('create order')) {
      const result = await invokeMcpToolDirect('cart_create_order', { clientId: venueId });
      const total = result.total || 0;
      response.say = `Order placed. Total: $${(total / 100).toFixed(2)}.`;
    }
    else if (input.includes('search') || input.includes('find') || input.includes('what') || input.includes('list')) {
      const searchMatch = input.match(/(?:search|find|what|list)\s+(.+?)(?:\s+drinks?)?$/i);
      const query = searchMatch ? searchMatch[1] : '';
      
      const result = await invokeMcpToolDirect('search_drinks', { query });
      const drinks = result.items || [];
      
      if (drinks.length === 0) {
        response.say = "No drinks found.";
      } else {
        const names = drinks.slice(0, 3).map((d: any) => d.name).join(', ');
        response.say = `Found: ${names}${drinks.length > 3 ? ' and more' : ''}.`;
      }
    }
    else if (input.includes('menu') || input.includes('drinks')) {
      const result = await invokeMcpToolDirect('list_drinks', {});
      const drinks = result.items || [];
      
      if (drinks.length === 0) {
        response.say = "No drinks available.";
      } else {
        const names = drinks.slice(0, 5).map((d: any) => d.name).join(', ');
        response.say = `We have: ${names}${drinks.length > 5 ? ' and more' : ''}.`;
      }
    }
    else if (input.includes('help')) {
      response.say = "I can help you add drinks to cart, view cart, checkout, or search our menu.";
    }
    else {
      // Default response for bar context
      response.say = "What can I get for you today? Just tell me what drinks you'd like.";
    }

    console.log(`[NLU] Response: "${response.say}"`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('[NLU] Error:', error);
    return NextResponse.json({ say: "Sorry, something went wrong." });
  }
}