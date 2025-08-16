export interface SquareTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export const SQUARE_TOOLS: SquareTool[] = [
  {
    name: "inventory.list",
    description: "List all inventory items",
    parameters: {
      limit: { type: "number", default: 10 },
    },
  },
  {
    name: "inventory.get",
    description: "Get details of a specific item",
    parameters: {
      itemId: { type: "string", required: true },
    },
  },
  {
    name: "orders.create",
    description: "Create a new order",
    parameters: {
      locationId: { type: "string", required: true },
      lineItems: { type: "array", required: true },
    },
  },
  {
    name: "orders.list",
    description: "List recent orders",
    parameters: {
      locationId: { type: "string", required: true },
      limit: { type: "number", default: 10 },
    },
  },
  {
    name: "payments.create",
    description: "Process a payment",
    parameters: {
      sourceId: { type: "string", required: true },
      amount: { type: "number", required: true },
    },
  },
  {
    name: "refunds.create",
    description: "Issue a refund",
    parameters: {
      paymentId: { type: "string", required: true },
      amount: { type: "number", required: true },
      reason: { type: "string", required: true },
    },
  },
];

export function getEnabledTools(modules: {
  inventory: boolean;
  orders: boolean;
  payments: boolean;
  refunds: boolean;
}): SquareTool[] {
  return SQUARE_TOOLS.filter(tool => {
    const module = tool.name.split(".")[0];
    return modules[module as keyof typeof modules];
  });
}
