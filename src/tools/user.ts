import { tool } from "ai";
import { z } from "zod";

import { getUserById, updateUser } from "@/services/user";
import { updateUserSchema } from "@/validations/user";
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

export const updateCustomerDetailsTool = tool({
  description: "Update authenticated customer's details",
  inputSchema: updateUserSchema,
  contextSchema: z.object({
    userId: z.uuid(),
  }),
  execute: async (body, { context }) => {
    try {
      const updatedUser = await updateUser(context.userId, body);

      return {
        suucess: true,
        customer: updatedUser,
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
