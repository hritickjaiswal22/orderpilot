import { z } from "zod";
// import { db } from '@/lib/db'; // Your Prisma/Drizzle client

// Define schema where all fields are optional for partial updates
export const updateUserSchema = z
  .object({
    email: z.email("Invalid email format").max(100).optional(),
    name: z.string().min(1, "Name cannot be empty").max(100).optional(),
    address: z.string().max(255).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
