// src/app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

import {
  REFRESH_TOKEN_SECRET_KEY,
  generateAccessToken,
  generateRefreshToken,
  JWTpayload,
} from "@/lib/tokens";
import { sendError, sendSuccess } from "@/lib/api-response";
import {
  getRefreshTokenCookieSettings,
  getAccessTokenCookieSettings,
} from "@/lib/cookies";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    return sendError("No refresh token", 401);
  }

  try {
    // Verify refresh token
    const { payload } = await jwtVerify<JWTpayload>(
      refreshToken,
      REFRESH_TOKEN_SECRET_KEY,
    );
    // Additional checks (e.g., token type, user exists) can go here

    // Create new access token
    const newAccessToken = await generateAccessToken(payload.userId);

    // Optionally rotate refresh token
    const newRefreshToken = await generateRefreshToken(payload.userId);

    const response = NextResponse.json({
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });

    // Set new refresh token as HTTP‑only cookie
    response.cookies.set(getRefreshTokenCookieSettings(newRefreshToken));
    response.cookies.set(getAccessTokenCookieSettings(newAccessToken));

    return response;
  } catch (error) {
    return sendError("Invalid refresh token", 401);
  }
}
