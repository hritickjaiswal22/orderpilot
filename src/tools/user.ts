import { tool } from "ai";
import { z } from "zod";

import { getUserById } from "@/services/user";
import { AppError } from "@/lib/error";

export const getCustomerDetailsTool = tool({
  description: "Get the authenticated customer's details",
  inputSchema: z.object(),
  contextSchema: z.object({
    userId: z.uuid(),
  }),
  execute: async (_, { context }) => {
    try {
      const user = await getUserById(context.userId);

      return {
        suucess: true,
        customer: user,
      };
    } catch (error) {
      if (error instanceof AppError) {
        return {
          suucess: false,
          error: error.message,
          ...(error.error
            ? {
                errorTree: error.error,
              }
            : undefined),
        };
      }

      return {
        suucess: false,
        error: "Internal Server Error",
      };
    }
  },
});
