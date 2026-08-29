import { z } from "zod";

export const getProductSchema = z.uuid({
  message: "Invalid product ID format",
});

export type GetProductInput = z.infer<typeof getProductSchema>;
