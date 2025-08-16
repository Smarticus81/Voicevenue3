export interface Intent {
  intent: string;
  patterns: string[];
  entities: string[];
  required_entities: string[];
  confidence_boost: number;
}

export interface Entity {
  type: string;
  source?: string;
  confidence_threshold?: number;
  patterns?: string[];
  default?: any;
  values?: string[];
}

export interface IntentsConfig {
  intents: Intent[];
  entities: Record<string, Entity>;
  confidence_adjustments: Record<string, number>;
}

// Bevpro Agent Intents
export const BEVPRO_INTENTS: IntentsConfig = {
  intents: [
    {
      intent: "order_drink",
      patterns: [
        "I want {drink}",
        "I'll have {drink}",
        "Can I get {drink}",
        "Order {drink}",
        "Give me {drink}",
        "{quantity} {drink}",
        "I'd like {quantity} {drink}",
        "Can I have {quantity} {drink}",
        "Order {quantity} {drink} please",
        "Make me {drink}",
        "Pour me {drink}",
        "I need {drink}",
        "Get me {drink}",
        "Serve {drink}",
        "Add {drink} to my order",
        "I want to order {drink}",
        "Could I get {drink}",
        "May I have {drink}",
        "I'll take {drink}",
        "Bring me {drink}"
      ],
      entities: ["drink", "quantity"],
      required_entities: ["drink"],
      confidence_boost: 0.2
    },
    {
      intent: "check_inventory",
      patterns: [
        "Do you have {drink}",
        "Is {drink} available",
        "Check {drink} stock",
        "How much {drink} do we have",
        "What's the stock on {drink}",
        "Is there any {drink} left",
        "Check inventory for {drink}",
        "Do we have {drink} in stock",
        "Are we out of {drink}",
        "Stock check {drink}",
        "Inventory {drink}",
        "How many {drink} left",
        "Check if we have {drink}",
        "Is {drink} in stock",
        "Do we still have {drink}",
        "How many {drink} do we have",
        "What's the stock level of {drink}",
        "What's the inventory level for {drink}",
        "How many {drink} are available"
      ],
      entities: ["drink"],
      required_entities: ["drink"],
      confidence_boost: 0.1
    },
    {
      intent: "update_inventory",
      patterns: [
        "Update inventory of {drink} to {quantity}",
        "Set {drink} stock to {quantity}",
        "Change {drink} inventory to {quantity}",
        "Update {drink} to {quantity}",
        "Set inventory of {drink} to {quantity}",
        "Make {drink} inventory {quantity}",
        "We now have {quantity} {drink}",
        "The {drink} count is now {quantity}",
        "Change the stock of {drink} to {quantity}",
        "Set the level of {drink} to {quantity}"
      ],
      entities: ["drink", "quantity"],
      required_entities: ["drink", "quantity"],
      confidence_boost: 0.2
    },
    {
      intent: "multi_drink_order",
      patterns: [
        "I'll have a {drink1} and a {drink2}",
        "Give me a {drink1} and a {drink2}",
        "Add a {drink1} and a {drink2} to my order",
        "I want a {drink1} and a {drink2}",
        "Get me a {drink1} and two {drink2}",
        "Order a {drink1} and a {drink2}",
        "Can I get a {drink1} and a {drink2}"
      ],
      entities: ["drink1", "drink2", "quantity"],
      required_entities: ["drink1", "drink2"],
      confidence_boost: 0.2
    },
    {
      intent: "stop_listening",
      patterns: [
        "Stop listening",
        "End voice recognition",
        "Exit continuous mode",
        "Stop voice commands",
        "Exit voice mode",
        "Stop recording",
        "Shut down",
        "Go back to wake word mode",
        "Switch to wake word mode",
        "Turn off mic"
      ],
      entities: [],
      required_entities: [],
      confidence_boost: 0.3
    },
    {
      intent: "view_menu",
      patterns: [
        "Show me the menu",
        "What drinks do you have",
        "What's on the menu",
        "List drinks",
        "Show drinks",
        "What can I order",
        "What's available",
        "Menu please",
        "Show me what you have",
        "What drinks are available",
        "Display menu",
        "What's on tap",
        "Show cocktails",
        "What beers do you have",
        "Wine list",
        "Show me the drink options",
        "What can you make",
        "List all drinks",
        "Show beverage menu"
      ],
      entities: ["category"],
      required_entities: [],
      confidence_boost: 0.1
    },
    {
      intent: "complete_order",
      patterns: [
        "That's all",
        "Complete my order",
        "Finish order",
        "I'm done",
        "That's everything",
        "Close the order",
        "Complete order",
        "Finalize order",
        "That's it",
        "Nothing else",
        "Order complete",
        "Done ordering",
        "That's my order",
        "Finish up",
        "All done",
        "Complete",
        "Checkout",
        "Ring me up",
        "Process order"
      ],
      entities: [],
      required_entities: [],
      confidence_boost: 0.3
    },
    {
      intent: "cancel_order",
      patterns: [
        "Cancel my order",
        "Cancel order",
        "Never mind",
        "Forget it",
        "Cancel that",
        "I changed my mind",
        "Don't want anything",
        "Cancel everything",
        "Remove all items",
        "Start over",
        "Clear order",
        "Delete order",
        "I don't want this",
        "Cancel the whole thing",
        "Scrap that order"
      ],
      entities: [],
      required_entities: [],
      confidence_boost: 0.2
    },
    {
      intent: "modify_order",
      patterns: [
        "Change {drink} to {new_drink}",
        "Replace {drink} with {new_drink}",
        "Instead of {drink} make it {new_drink}",
        "Actually make that {new_drink}",
        "Change my order",
        "Modify order",
        "Update order",
        "Switch {drink} to {new_drink}",
        "I want to change {drink}",
        "Can you change {drink} to {new_drink}",
        "Make it {new_drink} instead",
        "Actually I want {new_drink}",
        "Change that to {new_drink}",
        "Swap {drink} for {new_drink}"
      ],
      entities: ["drink", "new_drink", "quantity"],
      required_entities: ["drink"],
      confidence_boost: 0.1
    },
    {
      intent: "remove_item",
      patterns: [
        "Remove {drink}",
        "Delete {drink}",
        "Take off {drink}",
        "Cancel {drink}",
        "Don't want {drink}",
        "Remove {drink} from order",
        "Take {drink} off the order",
        "Delete {drink} from order",
        "I don't want {drink}",
        "Cancel the {drink}",
        "Scratch {drink}",
        "Drop {drink}",
        "Remove that {drink}",
        "Take out {drink}"
      ],
      entities: ["drink"],
      required_entities: ["drink"],
      confidence_boost: 0.1
    },
    {
      intent: "show_order",
      patterns: [
        "Show my order",
        "What's in my order",
        "Display order contents",
        "What did I order",
        "Show current order",
        "What's on the tab",
        "Read back my order",
        "Review order",
        "Order summary",
        "Check order status",
        "What do I have",
        "List my drinks",
        "Show order",
        "What's my total",
        "Order details",
        "What am I getting",
        "Confirm order"
      ],
      entities: [],
      required_entities: [],
      confidence_boost: 0.1
    },
    {
      intent: "get_price",
      patterns: [
        "How much is {drink}",
        "What's the price of {drink}",
        "Cost of {drink}",
        "Price for {drink}",
        "How much does {drink} cost",
        "What does {drink} cost",
        "Price check {drink}",
        "How expensive is {drink}",
        "What's {drink} going for",
        "Tell me the price of {drink}",
        "How much for {drink}",
        "What's the cost of {drink}",
        "Price of {drink}",
        "How much would {drink} be"
      ],
      entities: ["drink"],
      required_entities: ["drink"],
      confidence_boost: 0.1
    },
    {
      intent: "greeting",
      patterns: [
        "Hello",
        "Hi",
        "Hey",
        "Good morning",
        "Good evening",
        "Good afternoon",
        "What's up",
        "How are you",
        "Hey there",
        "Hi there",
        "Hello there",
        "Greetings",
        "Howdy",
        "Good day",
        "Morning",
        "Evening",
        "Afternoon"
      ],
      entities: [],
      required_entities: [],
      confidence_boost: 0.1
    },
    {
      intent: "help",
      patterns: [
        "Help",
        "What can you do",
        "How does this work",
        "I need help",
        "Can you help me",
        "What are my options",
        "How do I order",
        "Instructions",
        "Guide me",
        "What can I say",
        "Help me order",
        "How to use this",
        "What commands work",
        "Show me how",
        "I'm confused",
        "I don't understand"
      ],
      entities: [],
      required_entities: [],
      confidence_boost: 0.1
    },
    {
      intent: "repeat_last",
      patterns: [
        "Repeat that",
        "Say that again",
        "What did you say",
        "Come again",
        "Pardon",
        "Sorry what",
        "I didn't catch that",
        "Can you repeat",
        "One more time",
        "Repeat please",
        "Say again",
        "What was that",
        "I missed that",
        "Could you repeat that"
      ],
      entities: [],
      required_entities: [],
      confidence_boost: 0.1
    }
  ],
  entities: {
    drink: {
      type: "fuzzy_match",
      source: "drinks_database",
      confidence_threshold: 0.4
    },
    quantity: {
      type: "number",
      patterns: ["\\b(\\d+)\\b", "\\b(one|two|three|four|five|six|seven|eight|nine|ten)\\b"],
      default: 1
    },
    category: {
      type: "exact_match",
      values: ["beer", "wine", "cocktail", "spirit", "signature", "non-alcoholic"]
    },
    customer: {
      type: "name_extraction",
      patterns: ["for ([A-Za-z]+)", "([A-Za-z]+)'s order"]
    }
  },
  confidence_adjustments: {
    drink_name_match: 0.3,
    quantity_present: 0.1,
    context_match: 0.2,
    pattern_complexity: 0.1
  }
};

// Venue Voice Agent Intents
export const VENUE_VOICE_INTENTS: IntentsConfig = {
  intents: [
    // Scheduling & Booking Management
    {
      intent: "check_venue_availability",
      patterns: [
        "Is the main hall available on {date}",
        "Check availability for {venue_space} on {date}",
        "What spaces are free on {date}",
        "Check {venue_space} availability",
        "Is {venue_space} free on {date}",
        "What's available on {date}",
        "Check venue calendar for {date}"
      ],
      entities: ["date", "time", "venue_space", "duration"],
      required_entities: ["date"],
      confidence_boost: 0.2
    },
    {
      intent: "create_new_booking",
      patterns: [
        "Book {venue_space} for {event_type} on {date}",
        "Reserve {venue_space} for {date}",
        "Create a booking for {venue_space}",
        "Book {venue_space} for {client_name}",
        "Reserve venue for {event_type}",
        "New booking for {date}"
      ],
      entities: ["venue_space", "date", "time", "duration", "event_type", "client_name"],
      required_entities: ["venue_space", "date"],
      confidence_boost: 0.2
    },
    {
      intent: "modify_existing_booking",
      patterns: [
        "Change the {event_type} booking to {new_value}",
        "Update booking for {date}",
        "Modify {venue_space} reservation",
        "Change booking details",
        "Update event information"
      ],
      entities: ["booking_id", "modification_type", "new_value", "date", "venue_space"],
      required_entities: ["date"],
      confidence_boost: 0.1
    },
    {
      intent: "cancel_booking",
      patterns: [
        "Cancel the booking for {date}",
        "Remove {venue_space} reservation",
        "Cancel booking ID {booking_id}",
        "Delete booking for {date}",
        "Cancel event on {date}"
      ],
      entities: ["booking_id", "date", "venue_space"],
      required_entities: ["date"],
      confidence_boost: 0.2
    },
    // Staff Management
    {
      intent: "schedule_staff_shifts",
      patterns: [
        "Schedule {staff_member} for {shift_type}",
        "Create weekly staff schedule",
        "Assign {staff_member} to work on {date}",
        "Staff scheduling for {date}",
        "Create staff roster"
      ],
      entities: ["staff_member", "shift_type", "date", "time", "event_id"],
      required_entities: ["staff_member", "date"],
      confidence_boost: 0.2
    },
    {
      intent: "check_staff_availability",
      patterns: [
        "Who's available to work on {date}",
        "Check {staff_member} availability",
        "Find available {staff_role}",
        "Staff availability for {date}",
        "Who can work {shift_type}"
      ],
      entities: ["date", "time", "staff_role", "staff_member"],
      required_entities: ["date"],
      confidence_boost: 0.1
    },
    // Vendor Coordination
    {
      intent: "add_new_vendor",
      patterns: [
        "Add {vendor_name} as new vendor",
        "Register new {vendor_type} company",
        "Create vendor profile for {vendor_name}",
        "New vendor {vendor_name}",
        "Add vendor to database"
      ],
      entities: ["vendor_name", "vendor_type", "contact_info", "services"],
      required_entities: ["vendor_name"],
      confidence_boost: 0.2
    },
    {
      intent: "search_vendor_information",
      patterns: [
        "Find contact info for {vendor_name}",
        "Show me {vendor_type} vendors",
        "Get details for vendor {vendor_id}",
        "Vendor information for {vendor_name}",
        "Search vendors"
      ],
      entities: ["vendor_name", "vendor_type", "vendor_id", "search_criteria"],
      required_entities: ["vendor_name"],
      confidence_boost: 0.1
    },
    // Equipment & Inventory
    {
      intent: "check_equipment_availability",
      patterns: [
        "Is {equipment_type} available for {date}",
        "Check availability of {equipment_type}",
        "Do we have enough {equipment_type}",
        "Equipment check for {date}",
        "Is {equipment_type} free"
      ],
      entities: ["equipment_type", "quantity", "date", "time"],
      required_entities: ["equipment_type"],
      confidence_boost: 0.1
    },
    {
      intent: "reserve_equipment_for_events",
      patterns: [
        "Reserve {equipment_type} for {event_id}",
        "Book {equipment_type} for {date}",
        "Allocate {equipment_type} for event",
        "Equipment reservation for {event_id}"
      ],
      entities: ["equipment_type", "quantity", "event_id", "date"],
      required_entities: ["equipment_type", "event_id"],
      confidence_boost: 0.2
    },
    // Financial Operations
    {
      intent: "generate_invoices",
      patterns: [
        "Generate invoice for {client_name}",
        "Create billing for {event_id}",
        "Send invoice for venue rental",
        "Create invoice for {event_type}",
        "Generate billing statement"
      ],
      entities: ["client_name", "event_id", "amount", "due_date"],
      required_entities: ["client_name"],
      confidence_boost: 0.2
    },
    {
      intent: "track_payment_status",
      patterns: [
        "Check payment status for invoice {invoice_id}",
        "Show overdue payments",
        "Update payment received for {client_name}",
        "Payment status for {invoice_id}",
        "Check payment history"
      ],
      entities: ["invoice_id", "payment_status", "amount", "date"],
      required_entities: ["invoice_id"],
      confidence_boost: 0.1
    },
    // Reporting & Analytics
    {
      intent: "generate_venue_utilization_reports",
      patterns: [
        "Generate monthly utilization report",
        "Show room usage statistics for {report_period}",
        "Create capacity analysis report",
        "Venue utilization for {report_period}",
        "Usage statistics report"
      ],
      entities: ["report_period", "venue_space", "metrics", "format"],
      required_entities: ["report_period"],
      confidence_boost: 0.1
    },
    {
      intent: "create_revenue_summaries",
      patterns: [
        "Create monthly revenue summary",
        "Generate profit analysis for {time_period}",
        "Show revenue by event type",
        "Revenue report for {time_period}",
        "Financial summary"
      ],
      entities: ["time_period", "revenue_type", "breakdown_category"],
      required_entities: ["time_period"],
      confidence_boost: 0.1
    },
    // Greeting and Help
    {
      intent: "greeting",
      patterns: [
        "Hello",
        "Hi",
        "Hey",
        "Good morning",
        "Good evening",
        "Good afternoon",
        "What's up",
        "How are you",
        "Hey there",
        "Hi there",
        "Hello there",
        "Greetings",
        "Howdy",
        "Good day"
      ],
      entities: [],
      required_entities: [],
      confidence_boost: 0.1
    },
    {
      intent: "help",
      patterns: [
        "Help",
        "What can you do",
        "How does this work",
        "I need help",
        "Can you help me",
        "What are my options",
        "How do I manage venues",
        "Instructions",
        "Guide me",
        "What can I say",
        "Help me with venue management",
        "How to use this system",
        "What commands work",
        "Show me how",
        "I'm confused",
        "I don't understand"
      ],
      entities: [],
      required_entities: [],
      confidence_boost: 0.1
    }
  ],
  entities: {
    date: {
      type: "date",
      patterns: ["\\b(today|tomorrow|next week|next month)\\b", "\\b(\\d{1,2}/\\d{1,2}/\\d{4})\\b"],
      confidence_threshold: 0.8
    },
    time: {
      type: "time",
      patterns: ["\\b(\\d{1,2}:\\d{2}\\s*(am|pm))\\b", "\\b(morning|afternoon|evening|night)\\b"],
      confidence_threshold: 0.8
    },
    venue_space: {
      type: "exact_match",
      values: ["main hall", "conference room", "outdoor pavilion", "ballroom", "meeting room", "kitchen", "lobby"]
    },
    event_type: {
      type: "exact_match",
      values: ["wedding", "conference", "meeting", "party", "corporate event", "concert", "exhibition"]
    },
    staff_member: {
      type: "name_extraction",
      patterns: ["([A-Za-z]+) for", "schedule ([A-Za-z]+)"],
      confidence_threshold: 0.7
    },
    vendor_name: {
      type: "name_extraction",
      patterns: ["([A-Za-z]+\\s+[A-Za-z]+) as", "vendor ([A-Za-z]+)"],
      confidence_threshold: 0.7
    },
    equipment_type: {
      type: "exact_match",
      values: ["projector", "sound system", "tables", "chairs", "linens", "lighting", "kitchen equipment"]
    }
  },
  confidence_adjustments: {
    date_match: 0.3,
    time_match: 0.2,
    venue_space_match: 0.2,
    staff_name_match: 0.2,
    vendor_name_match: 0.2,
    pattern_complexity: 0.1
  }
};

// Get intents for a specific agent type
export function getIntentsForAgentType(agentType: 'Bevpro' | 'Venue Voice'): IntentsConfig {
  return agentType === 'Bevpro' ? BEVPRO_INTENTS : VENUE_VOICE_INTENTS;
}

// Intent recognition function
export function recognizeIntent(
  text: string, 
  intents: IntentsConfig, 
  agentType: 'Bevpro' | 'Venue Voice'
): { intent: string; confidence: number; entities: Record<string, any> } | null {
  const lowerText = text.toLowerCase();
  let bestMatch = { intent: '', confidence: 0, entities: {} };

  for (const intent of intents.intents) {
    let confidence = 0;
    let entities: Record<string, any> = {};

    // Check pattern matches
    for (const pattern of intent.patterns) {
      const patternConfidence = calculatePatternConfidence(lowerText, pattern, intents.entities);
      if (patternConfidence > confidence) {
        confidence = patternConfidence;
        entities = extractEntities(lowerText, pattern, intents.entities);
      }
    }

    // Apply confidence boost
    confidence += intent.confidence_boost;

    if (confidence > bestMatch.confidence) {
      bestMatch = { intent: intent.intent, confidence, entities };
    }
  }

  // Return match if confidence is above threshold
  return bestMatch.confidence > 0.3 ? bestMatch : null;
}

// Calculate pattern confidence
function calculatePatternConfidence(text: string, pattern: string, entities: Record<string, Entity>): number {
  // Simple pattern matching - in production, this would use more sophisticated NLP
  const patternWords = pattern.split(' ').filter(word => !word.startsWith('{'));
  const textWords = text.split(' ');
  
  let matches = 0;
  for (const patternWord of patternWords) {
    if (textWords.some(textWord => textWord.includes(patternWord) || patternWord.includes(textWord))) {
      matches++;
    }
  }
  
  return matches / patternWords.length;
}

// Extract entities from text
function extractEntities(text: string, pattern: string, entities: Record<string, Entity>): Record<string, any> {
  const extracted: Record<string, any> = {};
  
  // Simple entity extraction - in production, this would use more sophisticated NLP
  const entityMatches = pattern.match(/\{(\w+)\}/g);
  if (entityMatches) {
    for (const match of entityMatches) {
      const entityName = match.slice(1, -1);
      const entity = entities[entityName];
      
      if (entity) {
        // Extract entity value based on type
        if (entity.type === 'number') {
          const numberMatch = text.match(/\b(\d+)\b/);
          if (numberMatch) {
            extracted[entityName] = parseInt(numberMatch[1]);
          }
        } else if (entity.type === 'exact_match' && entity.values) {
          for (const value of entity.values) {
            if (text.includes(value.toLowerCase())) {
              extracted[entityName] = value;
              break;
            }
          }
        }
      }
    }
  }
  
  return extracted;
}
