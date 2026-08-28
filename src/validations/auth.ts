import { z } from "zod";

export const authSchema = z.object({
  userId: z.uuid("User - Id is required"),
});

// Infer the TypeScript type automatically from the schema
export type AuthInput = z.infer<typeof authSchema>;
