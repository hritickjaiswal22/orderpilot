import { NextRequest } from "next/server";
import { headers } from "next/headers";

import { sendError, sendSuccess } from "@/lib/api-response";
import { createSupportTicket } from "@/services/support";
import { AppError } from "@/lib/error";

export async function POST(request: NextRequest) {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id");

    if (!userId) {
      return sendError("Unauthorized", 401);
    }

    const body = await request.json();

    const supportTicket = await createSupportTicket(userId, body.issue || "");

    return sendSuccess(
      "Successfully created support ticket",
      201,
      supportTicket,
    );
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(error.message, error.status, error.error);
    }

    return sendError("Internal Error", 500);
  }
}
