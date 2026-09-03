// lib/services/userService.ts
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { updateUserSchema } from "@/validations/user";

// Custom error classes
export class UserNotFoundError extends Error {
  constructor(message = "User not found") {
    super(message);
    this.name = "UserNotFoundError";
  }
}

export class UserValidationError extends Error {
  tree: ReturnType<typeof z.treeifyError> | undefined;

  constructor(message: string, tree?: ReturnType<typeof z.treeifyError>) {
    super(message);
    this.name = "UserValidationError";
    this.tree = tree;
  }
}

// Service functions
export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      address: true,
      email: true,
      id: true,
      name: true,
    },
  });

  if (!user) {
    throw new UserNotFoundError();
  }

  return user;
}

export async function updateUser(
  userId: string,
  updateData: { address?: string; email?: string; name?: string },
) {
  // Validate input
  const validation = updateUserSchema.safeParse(updateData);
  if (!validation.success) {
    const tree = z.treeifyError(validation.error);
    throw new UserValidationError("Invalid request body", tree);
  }

  // Check user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!existingUser) {
    throw new UserNotFoundError();
  }

  // Perform update
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      address: validation.data.address || existingUser.address,
      email: validation.data.email || existingUser.email,
      name: validation.data.name || existingUser.name,
    },
  });

  return updatedUser;
}
