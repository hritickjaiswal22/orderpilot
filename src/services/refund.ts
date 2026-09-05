// lib/services/refundService.ts
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRefundEligibility } from "@/services/refund-eligibility";
import {
  createRefundQuerySchema,
  getOrderItemsSchema,
} from "@/validations/orders";
import { AppError } from "@/lib/error";

// Service function to create a refund for a specific order item or all items
export async function createRefund(
  userId: string,
  orderId: string,
  input: { orderItemId?: string; reason: string },
) {
  // Validate orderId
  const orderIdValidation = getOrderItemsSchema.safeParse(orderId);

  if (!orderIdValidation.success) {
    const tree = z.treeifyError(orderIdValidation.error);

    throw new AppError(
      "One or more request parameters are missing or invalid. - INVALID_REQUEST_PARAMS",
      400,
      tree,
    );
  }

  // Validate body (input)
  const bodyValidation = createRefundQuerySchema.safeParse(input);
  if (!bodyValidation.success) {
    const tree = z.treeifyError(bodyValidation.error);

    throw new AppError(
      "The request body is missing, malformed, or contains invalid fields. - INVALID_REQUEST_BODY",
      400,
      tree,
    );
  }

  const { orderItemId, reason } = bodyValidation.data;

  // Check refund eligibility
  const {
    eligibility,
    error,
    reason: eligibilityReason,
    status,
  } = await checkRefundEligibility({
    orderId,
    userId,
    orderItemId,
  });

  if (error) {
    // If error is returned, map to appropriate error class
    // For simplicity, we throw a generic error with status, but you can create a custom error class with status.
    // status is 404
    throw new AppError(error, 404);
  }

  if (!eligibility) {
    throw new AppError(eligibilityReason as string, 422);
  }

  // If orderItemId is provided, handle single item refund
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
      // Create new refund
      const orderItem = await prisma.orderItem.findUnique({
        where: { id: orderItemId },
        select: {
          originalUnitAmount: true,
          quantity: true,
        },
      });

      if (!orderItem) {
        throw new AppError(
          "The specified order item does not exist. - ORDER_ITEM_NOT_FOUND",
          404,
        );
      }

      const refund = await prisma.refund.create({
        data: {
          reason,
          status: "IN_PROGRESS",
          orderId,
          orderItemId,
          amount: orderItem.originalUnitAmount.mul(orderItem.quantity),
        },
      });

      return refund;
    } else if (existingRefund.status === "FAILED") {
      // Update existing failed refund to in progress
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

      return updatedRefund;
    } else {
      // Existing refund is not failed (e.g., IN_PROGRESS, COMPLETED)
      throw new AppError(
        "The operation cannot be completed because the existing refund is already in progress or completed. - REFUND_NOT_FAILED",
        409,
      );
    }
  } else {
    // No orderItemId provided: refund all items in the order
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId },
    });

    if (orderItems.length === 0) {
      throw new AppError(
        "No items were found associated with this order. - ORDER_ITEMS_NOT_FOUND",
        404,
      );
    }

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

    return refunds;
  }
}
