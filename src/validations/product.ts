import { z } from "zod";

export const getProductSchema = z.uuid({
  message: "Invalid order ID format",
});

export type GetProductInput = z.infer<typeof getProductSchema>;
