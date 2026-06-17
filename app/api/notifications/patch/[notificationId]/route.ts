import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationId } = await params;
    const body = await request.json();

    const notification = await prisma.notifications.update({
      where: {
        id: notificationId, // 👈 FIXED
      },
      data: {
        read: body.read ?? true,
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Failed to update notification:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}