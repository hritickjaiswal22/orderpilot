// lib/services/refundService.ts
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRefundEligibility } from "@/services/refund-eligibility";
import {
  createRefundQuerySchema,
  getOrderItemsSchema,
} from "@/validations/orders";

// Custom error classes
export class RefundValidationError extends Error {
  tree: ReturnType<typeof z.treeifyError> | undefined;

  constructor(message: string, tree?: ReturnType<typeof z.treeifyError>) {
    super(message);
    this.name = "RefundValidationError";
    this.tree = tree;
  }
}

export class RefundNotEligibleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RefundNotEligibleError";
  }
}

export class RefundItemNotFoundError extends Error {
  constructor(message = "Order item not found") {
    super(message);
    this.name = "RefundItemNotFoundError";
  }
}

export class RefundAlreadyExistsError extends Error {
  constructor(message = "Refund already exists for this item") {
    super(message);
    this.name = "RefundAlreadyExistsError";
  }
}

export class RefundEligibilityCheckError extends Error {
  constructor(message = "Refund request invalid") {
    super(message);
    this.name = "RefundEligibilityCheckError";
  }
}

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

    throw new RefundValidationError("Validation Error", tree);
  }

  // Validate body (input)
  const bodyValidation = createRefundQuerySchema.safeParse(input);
  if (!bodyValidation.success) {
    const tree = z.treeifyError(bodyValidation.error);
    throw new RefundValidationError("Validation failed", tree);
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
    throw new RefundEligibilityCheckError(error);
  }

  if (!eligibility) {
    throw new RefundNotEligibleError(eligibilityReason as string);
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
        throw new RefundItemNotFoundError();
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
      throw new RefundAlreadyExistsError();
    }
  } else {
    // No orderItemId provided: refund all items in the order
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId },
    });

    if (orderItems.length === 0) {
      throw new RefundItemNotFoundError("No items found for this order");
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
