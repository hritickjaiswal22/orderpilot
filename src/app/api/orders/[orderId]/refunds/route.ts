import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendError, sendSuccess } from "@/lib/api-response";
import { checkRefundEligibility } from "@/services/refund-eligibility";
import {
  createRefundQuerySchema,
  getOrderItemsSchema,
} from "@/validations/orders";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

// Will need transaction to create refunds for all order items

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id");
    const body = await request.json();

    if (!userId) {
      return sendError("Unauthorized", 401);
    }

    const { orderId } = await context.params;

    const orderIdValidationResult = getOrderItemsSchema.safeParse(orderId);

    if (!orderIdValidationResult.success) {
      const tree = z.treeifyError(orderIdValidationResult.error);
      return sendError("Validation Error", 400, tree);
    }

    const bodyValidationResult = createRefundQuerySchema.safeParse(body);

    if (!bodyValidationResult.success) {
      const tree = z.treeifyError(bodyValidationResult.error);
      return sendError("Validation failed", 400, tree);
    }

    const { orderItemId, reason } = bodyValidationResult.data;

    const {
      error,
      status,
      eligibility,
      reason: eligibilityReason,
    } = await checkRefundEligibility({
      orderId,
      userId,
      orderItemId,
    });

    if (error) {
      return sendError(error, status);
    }

    if (!eligibility) {
      return sendError(eligibilityReason as string, 400);
    }

    if (orderItemId) {
      const existingRefund = await prisma.refund.findUnique({
        where: {
          orderId_orderItemId: {
            orderId,
            orderItemId,
          },
        },
      });

      if (!existingRefund) {
        const orderItem = await prisma.orderItem.findUnique({
          where: {
            id: orderItemId,
          },
          select: {
            originalUnitAmount: true,
            quantity: true,
          },
        });

        if (!orderItem) return sendError("Invalid request", 404);

        const refund = await prisma.refund.create({
          data: {
            reason,
            status: "IN_PROGRESS",
            orderId,
            orderItemId,
            amount: orderItem.originalUnitAmount.mul(orderItem.quantity),
          },
        });

        return sendSuccess("Successfully created refund", 201, refund);
      } else if (existingRefund.status === "FAILED") {
        const updatedRefund = await prisma.refund.update({
          where: {
            orderId_orderItemId: {
              orderId,
              orderItemId,
            },
          },
          data: {
            status: "IN_PROGRESS",
          },
        });

        return sendSuccess("Successfully updated refund", 200, updatedRefund);
      }
    } else {
      const orderItems = await prisma.orderItem.findMany({
        where: {
          orderId,
        },
      });

      if (orderItems.length === 0) return sendError("Invalid request", 404);

      const refunds = await prisma.$transaction(
        orderItems.map((orderItem) =>
          prisma.refund.create({
            data: {
              reason,
              status: "IN_PROGRESS",
              orderId,
              orderItemId: orderItem.id,
              amount: orderItem.originalUnitAmount.mul(orderItem.quantity),
            },
          }),
        ),
      );

      return sendSuccess("Successfully created refunds", 200, refunds);
    }
  } catch (error) {
    return sendError("Internal Error", 500);
  }
}
