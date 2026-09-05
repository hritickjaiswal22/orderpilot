// app/api/orders/[orderId]/refund/route.ts
import { NextRequest } from "next/server";
import { headers } from "next/headers";

import { sendError, sendSuccess } from "@/lib/api-response";
import { createRefund } from "@/services/refund";
import { AppError } from "@/lib/error";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id");

    if (!userId) {
      return sendError("Unauthorized", 401);
    }

    const { orderId } = await context.params;
    const body = await request.json();

    const refund = await createRefund(userId, orderId, body);

    // Determine success message and status code based on return type
    if (Array.isArray(refund)) {
      return sendSuccess("Successfully created refunds", 200, refund);
    } else {
      // Single refund created or updated
      // We can't distinguish create vs update from return alone; we could adjust service to return a flag.
      // Simpler: just return 200 with success message.
      return sendSuccess("Successfully created refund", 200, refund);
    }
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(error.message, error.status, error.error);
    }
    // For eligibility check error with status, you can create a custom class
    return sendError("Internal Error", 500);
  }
}
