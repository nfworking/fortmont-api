import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const activeSessions = await prisma.userSession.findMany({
      where: {
        userId: session.user.id,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActive: "desc" },
      select: {
        id: true,
        sessionToken: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        lastActive: true,
      },
    });

    return NextResponse.json(activeSessions);
  } catch (err) {
    console.error("[GET /api/auth/sessions] Error fetching sessions:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const revokeOthers = searchParams.get("revokeOthers") === "true";

    if (revokeOthers) {
      const currentSessionToken = (session.user as any).sessionId;
      if (!currentSessionToken) {
        return NextResponse.json({ error: "No active session ID found" }, { status: 400 });
      }

      await prisma.userSession.deleteMany({
        where: {
          userId: session.user.id,
          NOT: { sessionToken: currentSessionToken },
        },
      });

      return NextResponse.json({ success: true, message: "All other sessions revoked" });
    }

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId parameter" }, { status: 400 });
    }

    // Verify session belongs to user
    const sessionRecord = await prisma.userSession.findUnique({
      where: { sessionToken: sessionId },
    });

    if (!sessionRecord || sessionRecord.userId !== session.user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await prisma.userSession.delete({
      where: { sessionToken: sessionId },
    });

    return NextResponse.json({ success: true, message: "Session revoked" });
  } catch (err) {
    console.error("[DELETE /api/auth/sessions] Error revoking session:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
