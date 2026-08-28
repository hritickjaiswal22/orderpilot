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

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();

    const result = authSchema.safeParse(body);

    if (!result.success) {
      // Extract formatted error messages
      const tree = z.treeifyError(result.error);
      return NextResponse.json(
        { message: "Invalid request body", errors: tree },
        { status: 400 },
      );
    }

    const validatedData: AuthInput = result.data;

    const user = await prisma.user.findUnique({
      where: {
        id: validatedData.userId,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized - Invalid User Id" },
        { status: 401 },
      );
    }

    const accessToken = await generateAccessToken(user.id);
    const refreshToken = await generateRefreshToken(user.id);

    if (accessToken && refreshToken) {
      const cookieStore = await cookies();

      cookieStore.set(getAccessTokenCookieSettings(accessToken));
      cookieStore.set(getRefreshTokenCookieSettings(refreshToken));

      return NextResponse.json(
        { success: true, message: "Logged in successfully" },
        { status: 200 },
      );
    } else {
      throw "Error";
    }
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid JSON body or internal error" },
      { status: 500 },
    );
  }
};
