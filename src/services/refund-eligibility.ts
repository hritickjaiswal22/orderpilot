import { prisma } from "@/lib/prisma";

interface EligibilityParams {
  userId: string;
  orderId: string;
  orderItemId?: string;
}

enum RejectionReason {
  ORDER_ALREADY_DELIVERED = "ORDER_ALREADY_DELIVERED",
  ORDER_NOT_SUCCESSFUL = "ORDER_NOT_SUCCESSFUL",
  BULK_REFUND_NOT_ALLOWED_WHEN_EXISTING_REFUND_AVAILABLE = "BULK_REFUND_NOT_ALLOWED_WHEN_EXISTING_REFUND_AVAILABLE",
  REFUND_WINDOW_EXPIRED = "REFUND_WINDOW_EXPIRED",
  ALREADY_REFUNDED = "ALREADY_REFUNDED",
  REFUND_INPROGRESS = "REFUND_INPROGRESS",
}

const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;

export async function checkRefundEligibility({
  userId,
  orderId,
  orderItemId,
}: EligibilityParams) {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
      userId,
    },
  });

  if (!order) {
    return {
      error: "Invalid - orderId",
      status: 404,
    };
  } else if (order.status !== "SUCCESS") {
    if (order.status === "DELIVERED") {
      return {
        eligibility: false,
        reason: RejectionReason.ORDER_ALREADY_DELIVERED,
      };
    }
    return {
      eligibility: false,
      reason: RejectionReason.ORDER_NOT_SUCCESSFUL,
    };
  } else if (
    new Date().getTime() - new Date(order.createdAt).getTime() >
    SEVEN_DAYS_IN_MS
  ) {
    return {
      eligibility: false,
      reason: RejectionReason.REFUND_WINDOW_EXPIRED,
    };
  }

  if (orderItemId) {
    const orderItem = await prisma.orderItem.findUnique({
      where: {
        id: orderItemId,
      },
    });

    if (!orderItem) {
      return {
        error: "Invalid - orderItemId",
        status: 404,
      };
    } else if (orderItem.orderId !== orderId || orderItem.userId !== userId) {
      return {
        error: "Invalid request",
        status: 404,
      };
    }

    const existingRefunds = await prisma.refund.findUnique({
      where: {
        orderId_orderItemId: {
          orderId,
          orderItemId,
        },
      },
    });

    if (!existingRefunds) {
      return {
        eligibility: true,
      };
    } else {
      if (existingRefunds.status === "FAILED") {
        return {
          eligibility: true,
        };
      } else if (existingRefunds.status === "IN_PROGRESS") {
        return {
          eligibility: false,
          reason: RejectionReason.REFUND_INPROGRESS,
        };
      } else {
        return {
          eligibility: false,
          reason: RejectionReason.ALREADY_REFUNDED,
        };
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
      return {
        eligibility: false,
        reason:
          RejectionReason.BULK_REFUND_NOT_ALLOWED_WHEN_EXISTING_REFUND_AVAILABLE,
      };
    }

    return {
      eligibility: true,
    };
  }
}
