import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // 1. Get session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

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