import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendError, sendSuccess } from "@/lib/api-response";
import { getOrderItemsSchema } from "@/validations/orders";

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

    const result = getOrderItemsSchema.safeParse(orderId);

    if (!result.success) {
      const tree = z.treeifyError(result.error);
      return sendError("Validation Error", 400, tree);
    }

    const orderItems = await prisma.orderItem.findMany({
      where: {
        orderId,
        order: {
          userId,
        },
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

    return sendSuccess("Successfully fetched order items", 200, orderItems);
  } catch (error) {
    return sendError("Internal Error", 500);
  }
}
