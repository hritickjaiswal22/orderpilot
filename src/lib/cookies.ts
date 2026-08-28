import "dotenv/config";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export const getAccessTokenCookieSettings = (
  accessToken: string,
): ResponseCookie => ({
  name: "access_token",
  value: accessToken,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 15 * 60, // 15 minutes in seconds
});

export const getRefreshTokenCookieSettings = (
  refreshToken: string,
): ResponseCookie => ({
  name: "refresh_token",
  value: refreshToken,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
});
