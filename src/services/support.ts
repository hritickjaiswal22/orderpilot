// lib/services/supportService.ts
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSupportTicketSchema, issueSchema } from "@/validations/support";

export class SupportValidationError extends Error {
  tree: ReturnType<typeof z.treeifyError> | undefined;

  constructor(message: string, tree?: ReturnType<typeof z.treeifyError>) {
    super(message);
    this.name = "SupportValidationError";
    this.tree = tree;
  }
}

export class SupportTicketNotFoundError extends Error {
  constructor(message = "Support ticket not found") {
    super(message);
    this.name = "SupportTicketNotFoundError";
  }
}

export async function getSupportTicketById(supportId: string) {
  const result = getSupportTicketSchema.safeParse(supportId);
  if (!result.success) {
    const tree = z.treeifyError(result.error);
    throw new SupportValidationError("Validation Error", tree);
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
    throw new SupportTicketNotFoundError();
  }

  return supportTicket;
}

export async function createSupportTicket(userId: string, issue: string) {
  const validation = issueSchema.safeParse({ issue });
  if (!validation.success) {
    const tree = z.treeifyError(validation.error);
    throw new SupportValidationError(
      "Invalid request body - issue required",
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
