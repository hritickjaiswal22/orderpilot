import { NextRequest } from "next/server";
import { headers } from "next/headers";

import { sendError, sendSuccess } from "@/lib/api-response";
import { getOrderItemsById } from "@/services/order";
import { AppError } from "@/lib/error";

// 1. Define the type for context params (Must be a Promise in Next.js 15+)
type RouteContext = {
  params: Promise<{ orderId: string }>;
};

// 2. Export the HTTP method function (GET, POST, PUT, DELETE, etc.)
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id");

    if (!userId) {
      return sendError("Unauthorized", 401);
    }

    // 3. Await the params object before accessing properties
    const { orderId } = await context.params;

    const orderItems = await getOrderItemsById(userId, orderId);

    return sendSuccess("Successfully fetched order items", 200, orderItems);
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(error.message, error.status, error.error);
    }

    return sendError("Internal Error", 500);
  }
}
