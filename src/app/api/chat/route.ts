import { NextRequest, NextResponse } from "next/server";
import {
  streamText,
  convertToModelMessages,
  toUIMessageStream,
  createUIMessageStreamResponse,
  tool,
} from "ai";
import { google } from "@ai-sdk/google";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const messages = await convertToModelMessages(body.messages);

    const result = streamText({
      model: google("gemini-3.6-flash"),
      messages,
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
      }),
    });
  } catch (error: any) {
    console.log("Error - ", error);

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
