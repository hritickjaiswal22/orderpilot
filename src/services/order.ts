// lib/services/orderService.ts
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getOrdersQuerySchema,
  getOrderItemsSchema,
} from "@/validations/orders";

// Custom error classes
export class OrderValidationError extends Error {
  tree: ReturnType<typeof z.treeifyError> | undefined;

  constructor(message: string, tree?: ReturnType<typeof z.treeifyError>) {
    super(message);
    this.name = "OrderValidationError";
    this.tree = tree;
  }
}

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
    throw new OrderValidationError("Invalid sort order", tree);
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
    throw new OrderValidationError("Validation Error", tree);
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
