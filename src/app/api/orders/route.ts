import { NextRequest } from "next/server";
import { headers } from "next/headers";

import { sendError, sendSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/error";
import { getOrdersByUser } from "@/services/order";

export const GET = async (request: NextRequest) => {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id");

    if (!userId) {
      return sendError("Unauthorized", 401);
    }

    const searchParams = request.nextUrl.searchParams;
    const sortBy = searchParams.get("sortBy") ?? undefined;

    // Extract sortOrder from query param; default to "asc" if not provided
    const sortOrder = sortBy === "desc" ? "desc" : "asc";

    const orders = await getOrdersByUser(userId, sortOrder);

    return sendSuccess("Successfully fetched orders", 200, orders);
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(error.message, error.status, error.error);
    }

    return sendError("Internal Error", 500);
  }
};
