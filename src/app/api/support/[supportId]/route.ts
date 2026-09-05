import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendError, sendSuccess } from "@/lib/api-response";
import { getSupportTicketSchema } from "@/validations/support";
import {
  getSupportTicketById,
  SupportValidationError,
  SupportTicketNotFoundError,
} from "@/services/support";

// 1. Define the type for context params (Must be a Promise in Next.js 15+)
type RouteContext = {
  params: Promise<{ supportId: string }>;
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
    const { supportId } = await context.params;

    const supportTicket = await getSupportTicketById(supportId);

    return sendSuccess(
      "Successfully fetched support ticket",
      200,
      supportTicket,
    );
  } catch (error) {
    if (error instanceof SupportValidationError) {
      return sendError(
        "Validation Error - SupportValidationError",
        400,
        error.tree,
      );
    }
    if (error instanceof SupportTicketNotFoundError) {
      return sendError("Invalid request - SupportTicketNotFoundError", 400);
    }

    return sendError("Internal Error", 500);
  }
}
