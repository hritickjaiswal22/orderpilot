import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

import {
  ACCESS_TOKEN_SECRET_KEY,
  REFRESH_TOKEN_SECRET_KEY,
  JWTpayload,
} from "@/lib/tokens";
import {
  getRefreshTokenCookieSettings,
  getAccessTokenCookieSettings,
} from "@/lib/cookies";

// 1. Define your routes outside the middleware function
const PUBLIC_PAGES = ["/signin"];
const AUTH_API_PREFIX = "/api/auth";

type VerifyResult =
  | { success: true; payload: JWTpayload }
  | { success: false; expired: boolean; error: unknown };

async function safeVerifyToken(
  token: string,
  secret: Uint8Array,
): Promise<VerifyResult> {
  try {
    const { payload } = await jwtVerify<JWTpayload>(token, secret);

    return { success: true, payload };
  } catch (error: any) {
    return {
      success: false,
      expired: error.code === "ERR_JWT_EXPIRED",
      error,
    };
  }
}

function redirectToLogin(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/signin", request.url));

  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");

  return response;
}

export async function middleware(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;

    // Extract the pathname from nextUrl
    const { pathname } = request.nextUrl;

    // 2. Check for exact page matches
    const isAuthPage = PUBLIC_PAGES.includes(pathname);

    // 3. Check for API prefixes (covers /api/auth/signin, /api/auth/refresh, etc.)
    const isAuthApi = pathname.startsWith(AUTH_API_PREFIX);

    // 4. Combine the logic
    const isPublicRoute = isAuthPage || isAuthApi;

    if (isPublicRoute) {
      return NextResponse.next();
    }

    if (accessToken) {
      const accessResult = await safeVerifyToken(
        accessToken,
        ACCESS_TOKEN_SECRET_KEY,
      );

      if (accessResult.success) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-user-id", accessResult.payload.userId);

        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        }); // Valid access token
      }

      if (!accessResult.expired) {
        return redirectToLogin(request);
      }
    }

    if (!refreshToken) {
      return redirectToLogin(request);
    }

    const refreshResult = await safeVerifyToken(
      refreshToken,
      REFRESH_TOKEN_SECRET_KEY,
    );

    if (!refreshResult.success) {
      return redirectToLogin(request);
    }

    // refresh logic
    const refreshResponse = await fetch(
      `${request.nextUrl.origin}/api/auth/refresh`,
      {
        method: "POST",
        headers: {
          // Forward cookies so the refresh endpoint can read the refresh token
          cookie: request.headers.get("cookie") || "",
        },
      },
    );

    if (!refreshResponse.ok) {
      return redirectToLogin(request);
    }

    const { data } = await refreshResponse.json();

    request.cookies.set("access_token", data.accessToken);
    request.cookies.set("refresh_token", data.refreshToken);
    request.headers.set("x-user-id", refreshResult.payload.userId);

    const response = NextResponse.next({
      request: {
        headers: request.headers, // Passes modified request.cookies to downstream components
      },
    });

    response.cookies.set(getAccessTokenCookieSettings(data.accessToken));

    response.cookies.set(getRefreshTokenCookieSettings(data.refreshToken));

    return response;
  } catch (error) {
    console.error("Middleware error:", error);

    return redirectToLogin(request);
  }
}

export const config = {
  // Explicitly list ONLY the paths where this middleware should run.
  matcher: [
    "/",
    "/signin",
    "/api/me",
    "/api/users",
    // Add all your protected routes here.
    // The "/:path*" suffix ensures all sub-routes (like /accounts/settings) are also protected.
    // "/dashboard/:path*",
    // "/profile/:path*"
    // Expand as add more routes
  ],
};
