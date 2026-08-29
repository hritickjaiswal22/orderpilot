import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { sendError, sendSuccess } from "@/lib/api-response";
import { issueSchema } from "@/validations/support";

export async function POST(request: NextRequest) {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id");

    if (!userId) {
      return sendError("Unauthorized", 401);
    }

    const body = await request.json();

    const result = issueSchema.safeParse(body);

    if (!result.success) {
      const tree = z.treeifyError(result.error);
      return sendError("Invalid request body - issue required", 400);
    }

    const validIssue = result.data.issue;

    const supportTicket = await prisma.support.create({
      data: {
        issue: validIssue,
        status: "IN_PROGRESS",
        userId,
      },
      select: {
        id: true,
        issue: true,
        status: true,
      },
    });

    return sendSuccess(
      "Successfully created support ticket",
      201,
      supportTicket,
    );
  } catch (error) {
    return sendError("Internal Error", 500);
  }
}
