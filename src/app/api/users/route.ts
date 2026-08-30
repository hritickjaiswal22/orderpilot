import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendError, sendSuccess } from "@/lib/api-response";
import { updateUserSchema } from "@/validations/user";

export const GET = async (request: NextRequest) => {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id");

    if (!userId) {
      return sendError("Unauthorized", 401);
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        address: true,
        email: true,
        id: true,
        name: true,
      },
    });

    if (!user) {
      return sendError("Unauthorized", 401);
    }

    return sendSuccess("Successfully fetched user details", 200, {
      ...user,
    });
  } catch (error) {
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
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      const tree = z.treeifyError(validation.error);
      return sendError("Invalid request body", 400, tree);
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return sendError("Unauthorized", 401);
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        address: validation.data.address || user.address,
        email: validation.data.email || user.email,
        name: validation.data.name || user.name,
      },
    });

    return sendSuccess("Successfully updated user details", 200, updatedUser);
  } catch (error) {
    return sendError("Internal Error", 500);
  }
};
