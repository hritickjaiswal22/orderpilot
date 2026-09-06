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
  description: `
  Update authenticated customer's details

  Before modifying customer information:

  1. Validate the requested values.
  2. If any value is invalid, do not update that field.
  3. For valid fields, determine whether the update should proceed.
  4. You may call getCustomerDetails when current customer state is needed to determine whether an update is necessary.
  5. Never claim an update occurred unless the update tool successfully completed it.

  When a request contains multiple fields, handle each field independently.
  Do not let an invalid field automatically prevent valid fields from being updated unless the operation requires atomic validation.
  `,
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
