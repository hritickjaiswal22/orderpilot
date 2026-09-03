import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendError, sendSuccess } from "@/lib/api-response";
import { getProductSchema } from "@/validations/product";
import {
  getProductById,
  ProductNotFoundError,
  ProductValidationError,
} from "@/services/product";

// 1. Define the type for context params (Must be a Promise in Next.js 15+)
type RouteContext = {
  params: Promise<{ productId: string }>;
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
    const { productId } = await context.params;

    const product = await getProductById(productId);

    return sendSuccess("Successfully fetched product", 200, product);
  } catch (error) {
    if (error instanceof ProductValidationError) {
      return sendError(
        "Validation Error - ProductValidationError",
        400,
        error.tree,
      );
    }

    if (error instanceof ProductNotFoundError) {
      return sendError("Invalid request - ProductNotFoundError", 400);
    }

    return sendError("Internal Error", 500);
  }
}
