import { z } from "zod";

export const getOrdersQuerySchema = z.object({
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type GetOrdersQueryInput = z.infer<typeof getOrdersQuerySchema>;

export const getOrderItemsSchema = z.uuid({
  message: "Invalid order ID format",
});

export type GetOrderItemsInput = z.infer<typeof getOrderItemsSchema>;

export const getEligibilityQuerySchema = z.object({
  orderItemId: z
    .uuid({ message: "Invalid orderItemId format. Must be a valid UUID." })
    .optional(),
});

export type GetEligibilityInput = z.infer<typeof getEligibilityQuerySchema>;

export const createRefundQuerySchema = z.object({
  orderItemId: z
    .uuid({ message: "Invalid orderItemId format. Must be a valid UUID." })
    .optional(),
  reason: z.string().min(10, "Valid reason required"),
});

export type createRefundInput = z.infer<typeof createRefundQuerySchema>;
