import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendError, sendSuccess } from "@/lib/api-response";
import {
  getEligibilityQuerySchema,
  getOrderItemsSchema,
} from "@/validations/orders";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

enum RejectionReason {
  ORDER_NOT_SUCCESSFUL = "ORDER_NOT_SUCCESSFUL",
  PAYMENT_NOT_SUCCESSFUL = "PAYMENT_NOT_SUCCESSFUL",
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

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        userId,
      },
    });

    if (!order) {
      return sendError("Invalid - orderId", 404);
    } else if (order.status !== "SUCCESS") {
      return sendSuccess("Successfully fetched eligibility", 200, {
        eligibility: false,
        reason: RejectionReason.ORDER_NOT_SUCCESSFUL,
      });
    } else if (
      new Date().getTime() - new Date(order.createdAt).getTime() >
      SEVEN_DAYS_IN_MS
    ) {
      return sendSuccess("Successfully fetched eligibility", 200, {
        eligibility: false,
        reason: RejectionReason.REFUND_WINDOW_EXPIRED,
      });
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

    // TODO : Need to create a DB rule for Transaction table @@unique([orderId, status])
    const transactions = await prisma.transaction.findMany({
      where: {
        orderId,
        status: "SUCCESS",
      },
    });

    if (transactions.length === 0) {
      return sendSuccess("Successfully fetched eligibility", 200, {
        eligibility: false,
        reason: RejectionReason.PAYMENT_NOT_SUCCESSFUL,
      });
    } else if (transactions.length > 1) {
      return sendError("Invalid", 400);
    }

    if (orderItemId) {
      const orderItem = await prisma.orderItem.findUnique({
        where: {
          id: orderItemId,
        },
      });

      if (!orderItem) {
        return sendError("Invalid - orderItemId", 404);
      } else if (orderItem.orderId !== orderId || orderItem.userId !== userId) {
        return sendError("Invalid request", 404);
      }

      const existingRefunds = await prisma.refund.findMany({
        where: {
          orderId,
          orderItemId,
        },
      });

      if (existingRefunds.length === 0) {
        return sendSuccess("Successfully fetched eligibility", 200, {
          eligibility: true,
        });
      } else {
        if (existingRefunds[0].status === "FAILED") {
          return sendSuccess("Successfully fetched eligibility", 200, {
            eligibility: true,
          });
        } else {
          return sendSuccess("Successfully fetched eligibility", 200, {
            eligibility: false,
            reason: RejectionReason.ALREADY_REFUNDED,
          });
        }
      }
      // Note no need to check existingRefunds.length > 0 DB has a @@unique([orderId, orderItemId]) constraint
    } else {
      const existingRefunds = await prisma.refund.findMany({
        where: {
          orderId,
        },
      });

      if (existingRefunds.length > 0) {
        return sendSuccess("Successfully fetched eligibility", 200, {
          eligibility: false,
          reason:
            RejectionReason.BULK_REFUND_NOT_ALLOWED_WHEN_EXISTING_REFUND_AVAILABLE,
        });
      }

      return sendSuccess("Successfully fetched eligibility", 200, {
        eligibility: true,
      });
    }
  } catch (error) {
    return sendError("Internal Error", 500);
  }
}
