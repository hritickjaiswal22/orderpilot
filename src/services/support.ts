// lib/services/supportService.ts
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSupportTicketSchema, issueSchema } from "@/validations/support";
import { AppError } from "@/lib/error";

export async function getSupportTicketById(supportId: string) {
  const result = getSupportTicketSchema.safeParse(supportId);
  if (!result.success) {
    const tree = z.treeifyError(result.error);
    throw new AppError(
      "One or more request parameters are missing or invalid. - INVALID_REQUEST_PARAMS",
      400,
      tree,
    );
  }

  const supportTicket = await prisma.support.findUnique({
    where: { id: supportId },
    select: {
      id: true,
      issue: true,
      status: true,
    },
  });

  if (!supportTicket) {
    throw new AppError(
      "The support ticket associated with the provided ID does not exist.",
      404,
    );
  }

  return supportTicket;
}

export async function createSupportTicket(userId: string, issue: string) {
  const validation = issueSchema.safeParse({ issue });
  if (!validation.success) {
    const tree = z.treeifyError(validation.error);
    throw new AppError(
      "The request body is missing, malformed, or contains invalid fields. - INVALID_REQUEST_BODY",
      400,
      tree,
    );
  }

  const supportTicket = await prisma.support.create({
    data: {
      issue: validation.data.issue,
      status: "IN_PROGRESS",
      userId,
    },
    select: {
      id: true,
      issue: true,
      status: true,
    },
  });

  return supportTicket;
}
