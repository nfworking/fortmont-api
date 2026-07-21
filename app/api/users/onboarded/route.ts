import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTicketingActor } from "@/lib/ticketing-auth";

export async function POST(request: Request) {
  try {
    const actor = await resolveTicketingActor(request);

    if (!actor?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = actor.userId;

    // 2. Update user onboarding status
    await prisma.appUsers.update({
      where: {
        id: userId,
      },
      data: {
        onboarded: true,
      },
    });

    return NextResponse.json({
      success: true,
      onboarded: true,
    });
  } catch (error) {
    console.error("Onboarding update failed:", error);

    return NextResponse.json(
      { error: "Failed to update onboarding status" },
      { status: 500 }
    );
  }
}