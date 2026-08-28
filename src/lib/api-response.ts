import { NextResponse } from "next/server";

export type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data?: T;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  error: unknown;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function sendSuccess<T>(
  message: string,
  status: number = 200,
  data?: T,
) {
  const response: ApiSuccessResponse<T> = { success: true, data, message };

  return NextResponse.json(response, { status });
}

export function sendError(
  message: string,
  status: number = 400,
  error?: unknown,
) {
  const response: ApiErrorResponse = { success: false, message, error };
  return NextResponse.json(response, { status });
}
