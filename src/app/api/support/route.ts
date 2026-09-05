import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { sendError, sendSuccess } from "@/lib/api-response";
import { issueSchema } from "@/validations/support";
import {
  createSupportTicket,
  SupportValidationError,
} from "@/services/support";

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
    if (error instanceof SupportValidationError) {
      return sendError(
        "Invalid request body - issue required",
        400,
        error.tree,
      );
    }
    return sendError("Internal Error", 500);
  }
}
