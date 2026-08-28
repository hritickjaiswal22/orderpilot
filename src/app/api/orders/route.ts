import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendError, sendSuccess } from "@/lib/api-response";
import { getOrdersQuerySchema } from "@/validations/orders";

export const GET = async (request: NextRequest) => {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id");

    if (!userId) {
      return sendError("Unauthorized", 401);
    }

    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      sortBy: searchParams.get("sortBy") ?? undefined,
    };
    const result = getOrdersQuerySchema.safeParse(queryParams);

    if (!result.success) {
      const tree = z.treeifyError(result.error);
      return sendError("Invalid Query params", 400, tree);
    }

    const { sortOrder } = result.data;

    const orders = await prisma.order.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: sortOrder,
      },
      select: {
        id: true,
        status: true,
        originalPaidAmount: true,
        createdAt: true,
      },
    });

    return sendSuccess("Successfully fetched orders", 200, orders);
  } catch (error) {
    return sendError("Internal Error", 500);
  }
};
