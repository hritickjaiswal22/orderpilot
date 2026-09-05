// lib/services/userService.ts
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { updateUserSchema } from "@/validations/user";
import { AppError } from "@/lib/error";

// Custom error classes

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
    throw new AppError(
      "The user associated with the provided authentication token no longer exists. - USER_NOT_FOUND",
      404,
    );
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
    throw new AppError(
      "The request body is missing, malformed, or contains invalid fields. - INVALID_REQUEST_BODY",
      400,
      tree,
    );
  }

  // Check user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!existingUser) {
    throw new AppError(
      "The user associated with the provided authentication token no longer exists. - USER_NOT_FOUND",
      404,
    );
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
