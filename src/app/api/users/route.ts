import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { sendError, sendSuccess } from "@/lib/api-response";

export const GET = async (request: NextRequest) => {
  try {
    const headerList = await headers();
    const userId = headerList.get("x-user-id");

    if (!userId) {
      return sendError("Unauthorized", 401);
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        address: true,
        email: true,
        id: true,
        name: true,
      },
    });

    if (!user) {
      return sendError("Unauthorized", 401);
    }

    return sendSuccess("Successfully fetched user details", 200, {
      ...user,
    });
  } catch (error) {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
};
