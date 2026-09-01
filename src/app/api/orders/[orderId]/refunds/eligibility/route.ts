import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendError, sendSuccess } from "@/lib/api-response";
import {
  getEligibilityQuerySchema,
  getOrderItemsSchema,
} from "@/validations/orders";
import { checkRefundEligibility } from "@/services/refund-eligibility";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

enum RejectionReason {
  ORDER_NOT_SUCCESSFUL = "ORDER_NOT_SUCCESSFUL",
  BULK_REFUND_NOT_ALLOWED_WHEN_EXISTING_REFUND_AVAILABLE = "BULK_REFUND_NOT_ALLOWED_WHEN_EXISTING_REFUND_AVAILABLE",
  REFUND_WINDOW_EXPIRED = "REFUND_WINDOW_EXPIRED",
  ALREADY_REFUNDED = "ALREADY_REFUNDED",
}

const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id");

    if (!userId) {
      return sendError("Unauthorized", 401);
    }

    const { orderId } = await context.params;

    const result = getOrderItemsSchema.safeParse(orderId);

    if (!result.success) {
      const tree = z.treeifyError(result.error);
      return sendError("Validation Error", 400, tree);
    }

    const url = new URL(request.url);

    // Extract query parameters into a plain object
    const rawQueryParams = Object.fromEntries(url.searchParams.entries());

    // Validate using Zod
    const parsedQuery = getEligibilityQuerySchema.safeParse(rawQueryParams);

    if (!parsedQuery.success) {
      const tree = z.treeifyError(parsedQuery.error);
      return sendError("Validation Error", 400, tree);
    }

    const { orderItemId } = parsedQuery.data;

    const { error, status, eligibility, reason } = await checkRefundEligibility(
      {
        orderId,
        userId,
        orderItemId,
      },
    );

    if (error) {
      return sendError(error, status);
    } else {
      return sendSuccess("Successfully fetched eligibility", 200, {
        eligibility,
        reason: reason,
      });
    }
  } catch (error) {
    return sendError("Internal Error", 500);
  }
}
