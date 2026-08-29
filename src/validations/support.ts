import { z } from "zod";

export const issueSchema = z.object({
  issue: z.string().min(1, "Description is required"),
});

// TypeScript type inference for the issue body
export type IssueBody = z.infer<typeof issueSchema>;

export const getSupportTicketSchema = z.uuid({
  message: "Invalid support ticket ID format",
});

export type GetSupportTicketInput = z.infer<typeof getSupportTicketSchema>;
