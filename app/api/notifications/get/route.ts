import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { resolveTicketingActor } from "@/lib/ticketing-auth";

export async function GET(req: Request) {
  try {
    const actor = await resolveTicketingActor(req);

    if (!actor?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = actor.userId;

    const notifications = await prisma.notifications.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}