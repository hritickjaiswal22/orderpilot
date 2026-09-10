import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  type InferUITools,
  type UIMessage,
  streamText,
  convertToModelMessages,
  toUIMessageStream,
  createUIMessageStreamResponse,
  isStepCount,
} from "ai";
import { google } from "@ai-sdk/google";

import {
  getCustomerDetailsTool,
  updateCustomerDetailsTool,
} from "@/tools/user";
import { getProductDetailsTool } from "@/tools/products";
import { getCustomerOrdersTool } from "@/tools/orders";
import { logger } from "@/lib/logger";

const chatTools = {
  getCustomerDetails: getCustomerDetailsTool,
  updateCustomerDetails: updateCustomerDetailsTool,
  getProductDetails: getProductDetailsTool,
  getCustomerOrders: getCustomerOrdersTool,
};

// 1. Infer the UI tools type mapping
export type ChatTools = InferUITools<typeof chatTools>;

// 2. Export the strongly-typed Message schema
export type CustomChatMessage = UIMessage<unknown, never, ChatTools>;

// Original full
// const systemInstruction = `
// You are "ShopAssist", the customer support assistant for our online store.
// Your goal is to help customers with their inquiries about orders, products, account details, and other store-related matters.

// You have access to a set of tools that allow you to query the store database and perform actions. Use these tools whenever you need factual information (e.g., customer details, order history, product availability) or need to take an action (e.g., update an address, cancel an order). Do not guess or make up information—always use the appropriate tool to retrieve accurate data.

// When responding:
// - Be friendly, concise, and helpful.
// - If you are unsure or the user's request is ambiguous, ask clarifying questions before using tools.
// - Do not share sensitive information (like full payment details) unless explicitly requested and you have confirmed the user's identity (the user ID is already provided to you in the context).
// - If a tool returns an error or no data, inform the user and suggest next steps (e.g., contacting human support).

// You are acting on behalf of a real customer support agent. Always maintain a professional tone.
// `;

// Current version
const systemInstruction = `
You are "ShopAssist", the customer support assistant for our online store.
Your goal is to help customers with their inquiries about orders, products, account details, and other store-related matters.

You have access to a set of tools that allow you to query the store database and perform actions. Use these tools whenever you need factual information (e.g., customer details, order history, order items for an order) or need to take an action (e.g., update an address). Do not guess or make up information—always use the appropriate tool to retrieve accurate data.

When responding:
- Be friendly, concise, and helpful.
- If you are unsure or the user's request is ambiguous, ask clarifying questions before using tools.
- Do not share sensitive information unless explicitly requested and you have confirmed the user's identity (the user ID is already provided to you in the context).
- If a tool returns an error or no data, inform the user and suggest next steps (e.g., contacting human support).

You are acting on behalf of a real customer support agent. Always maintain a professional tone.
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headerList = await headers();
    const userId = headerList.get("x-user-id");

    const messages = await convertToModelMessages(body.messages);

    const result = streamText({
      model: google("gemini-3.6-flash"),
      messages,
      instructions: systemInstruction,
      tools: chatTools,
      toolsContext: {
        getCustomerDetails: {
          userId: userId || "",
        },
        updateCustomerDetails: {
          userId: userId || "",
        },
        getCustomerOrders: {
          userId: userId || "",
        },
      },
      stopWhen: isStepCount(5),
      onError({ error }) {
        const errorDetails = {
          name: error instanceof Error ? error.name : "UnknownError",
          message: error instanceof Error ? error.message : String(error),
          cause: error instanceof Error ? error.cause : undefined,
          statusCode: (error as any)?.statusCode,
          responseBody: (error as any)?.responseBody,
          responseHeaders: (error as any)?.responseHeaders,
          stack: error instanceof Error ? error.stack : undefined,
        };

        if (logger) {
          // Writes to local files in development
          logger.error(errorDetails.message, errorDetails);
        } else {
          console.error("raw:", error);
        }
      },
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
      }),
    });
  } catch (error: any) {
    // Check if it's a rate limit error
    if (
      error.message?.includes("Quota exceeded") ||
      error.message?.includes("429")
    ) {
      return NextResponse.json(
        {
          error:
            "The AI is currently overloaded. Please wait 1 minute and try again.",
        },
        {
          status: 429,
        },
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      {
        status: 500,
      },
    );
  }
}
