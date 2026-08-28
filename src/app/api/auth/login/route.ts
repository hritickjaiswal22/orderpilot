import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";

import { authSchema, AuthInput } from "@/validations/auth";
import { prisma } from "@/lib/prisma";
import { generateAccessToken, generateRefreshToken } from "@/lib/tokens";
import {
  getAccessTokenCookieSettings,
  getRefreshTokenCookieSettings,
} from "@/lib/cookies";
import { sendError, sendSuccess } from "@/lib/api-response";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();

    const result = authSchema.safeParse(body);

    if (!result.success) {
      // Extract formatted error messages
      const tree = z.treeifyError(result.error);
      return sendError("Invalid request body", 400, tree);
    }

    const validatedData: AuthInput = result.data;

    const user = await prisma.user.findUnique({
      where: {
        id: validatedData.userId,
      },
    });

    if (!user) {
      return sendError("Unauthorized - Invalid User Id", 401);
    }

    const accessToken = await generateAccessToken(user.id);
    const refreshToken = await generateRefreshToken(user.id);

    if (accessToken && refreshToken) {
      const cookieStore = await cookies();

      cookieStore.set(getAccessTokenCookieSettings(accessToken));
      cookieStore.set(getRefreshTokenCookieSettings(refreshToken));

      return sendSuccess("Logged in successfully", 200);
    } else {
      throw "Error";
    }
  } catch (error) {
    return sendError("Invalid JSON body or internal error", 500);
  }
};
