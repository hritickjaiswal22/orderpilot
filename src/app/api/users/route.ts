import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { sendError, sendSuccess } from "@/lib/api-response";
import { getUserById, updateUser } from "@/services/user";
import { AppError } from "@/lib/error";

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
    if (error instanceof AppError) {
      return sendError(error.message, error.status, error.error);
    }

    return sendError("Internal Server Error", 500);
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
    if (error instanceof AppError) {
      return sendError(error.message, error.status, error.error);
    }

    return sendError("Internal Server Error", 500);
  }
};
