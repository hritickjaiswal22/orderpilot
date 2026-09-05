// lib/services/orderService.ts
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getOrdersQuerySchema,
  getOrderItemsSchema,
} from "@/validations/orders";
import { AppError } from "@/lib/error";

// Service function to get all orders for a user
export async function getOrdersByUser(
  userId: string,
  sortOrder: "asc" | "desc",
) {
  // Validate sortOrder (if needed, but it's already validated in route)
  // We can perform validation here too for consistency
  const validation = getOrdersQuerySchema.safeParse({ sortBy: sortOrder });
  if (!validation.success) {
    const tree = z.treeifyError(validation.error);
    throw new AppError(
      "One or more request parameters are missing or invalid. - INVALID_REQUEST_PARAMS",
      400,
      tree,
    );
  }

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: sortOrder },
    select: {
      id: true,
      status: true,
      originalPaidAmount: true,
      createdAt: true,
    },
  });

  return orders;
}

// Service function to get order items for a specific order
export async function getOrderItemsById(userId: string, orderId: string) {
  // Validate orderId
  const validation = getOrderItemsSchema.safeParse(orderId);
  if (!validation.success) {
    const tree = z.treeifyError(validation.error);
    throw new AppError(
      "One or more request parameters are missing or invalid. - INVALID_REQUEST_PARAMS",
      400,
      tree,
    );
  }

  const orderItems = await prisma.orderItem.findMany({
    where: {
      orderId,
      order: { userId },
    },
    select: {
      id: true,
      originalUnitAmount: true,
      quantity: true,
      product: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return orderItems;
}
