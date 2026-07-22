import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTicketingActor } from "@/lib/ticketing-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : undefined;

    if (!sessionId) {
      const actor = await resolveTicketingActor(req);

      if (!actor?.userId) {
        return NextResponse.json({ active: false, onboarded: false });
      }

      const user = await prisma.appUsers.findUnique({
        where: { id: actor.userId },
        select: { onboarded: true },
      });

      return NextResponse.json({
        active: true,
        onboarded: user?.onboarded === true,
        userId: actor.userId,
      });
    }

    const activeSession = await prisma.userSession.findUnique({
      where: { sessionToken: sessionId },
    });

    if (!activeSession || activeSession.expiresAt < new Date()) {
      return NextResponse.json({ active: false, onboarded: false });
    }

    const user = await prisma.appUsers.findUnique({
      where: { id: activeSession.userId },
      select: { onboarded: true },
    });

    return NextResponse.json({
      active: true,
      onboarded: user?.onboarded === true,
      userId: activeSession.userId,
    });
  } catch (error) {
    console.error("Session verification failed:", error);
    return NextResponse.json({ active: false, onboarded: false });
  }
}