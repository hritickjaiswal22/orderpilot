import { tool } from "ai";
import { z } from "zod";

import { getOrdersByUser } from "@/services/order";
import { AppError } from "@/lib/error";

export const getCustomerOrdersTool = tool({
  description: `
  Retrieves the current customer's past orders.Use this tool when the user asks about their order history, past purchases, or previous transactions.

- Default sortOrder is 'desc' (newest first) unless explicitly specified.
- Return 'no previous orders' if the list is empty.
- Treat status 'SUCCESS' or 'DELIVERED' as confirmation that the customer has been successfully charged.
`,
  inputSchema: z.object({
    sortOrder: z.enum(["asc", "desc"]),
  }),
  contextSchema: z.object({
    userId: z.uuid(),
  }),
  execute: async ({ sortOrder }, { context }) => {
    try {
      const orders = await getOrdersByUser(context.userId, sortOrder);
      const responseOrders = orders.map((order) => ({
        ...order,
        originalPaidAmount: order.originalPaidAmount.toString(),
        createdAt: order.createdAt.toString(),
      }));

      return {
        success: true,
        orders: responseOrders,
      };
    } catch (error) {
      if (error instanceof AppError) {
        return {
          success: false,
          error: error.message,
          ...(error.error
            ? {
                errorTree: error.error,
              }
            : undefined),
        };
      }

      return {
        success: false,
        error: "Internal Server Error",
      };
    }
  },
});
