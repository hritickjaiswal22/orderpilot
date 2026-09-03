import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendError, sendSuccess } from "@/lib/api-response";
import { updateUserSchema } from "@/validations/user";
import {
  getUserById,
  updateUser,
  UserNotFoundError,
  UserValidationError,
} from "@/services/user-service";

export const GET = async (request: NextRequest) => {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id");

    if (!userId) {
      return sendError("Unauthorized", 401);
    }

    const user = await getUserById(userId);

    return sendSuccess("Successfully fetched user details", 200, user);
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return sendError("Unauthorized - UserNotFoundError", 401);
    }

    return sendError("Internal Error", 500);
  }
};

export const PATCH = async (request: NextRequest) => {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id");

    if (!userId) {
      return sendError("Unauthorized", 401);
    }

    const body = await request.json();
    const updatedUser = await updateUser(userId, body);

    return sendSuccess("Successfully updated user details", 200, updatedUser);
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return sendError("Unauthorized - UserNotFoundError", 401);
    }
    if (error instanceof UserValidationError) {
      return sendError(
        "Invalid request body - UserValidationError",
        400,
        error.tree,
      );
    }

    return sendError("Internal Error", 500);
  }
};
