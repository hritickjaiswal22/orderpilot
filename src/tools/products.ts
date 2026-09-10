import { tool } from "ai";
import { z } from "zod";

import { getProductById } from "@/services/product";
import { AppError } from "@/lib/error";

export const getProductDetailsTool = tool({
  description: "Get product details by id",
  inputSchema: z.object({
    productId: z.uuid(),
  }),
  execute: async ({ productId }) => {
    try {
      const product = await getProductById(productId);
      const plainProduct = {
        ...product,
        amount: product.amount.toString(),
      };

      return {
        success: true,
        plainProduct,
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
