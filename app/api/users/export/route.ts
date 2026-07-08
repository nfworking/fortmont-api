import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const user = await prisma.appUsers.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        mailboxes: { select: { id: true, email: true, isPrimary: true } },
        deviceTokens: { select: { id: true, token: true, platform: true } },
        notifications: { select: { id: true, type: true, title: true, description: true, read: true, createdAt: true } },
        files: { select: { id: true, name: true, size: true, mimeType: true, bucket: true, objectKey: true, createdAt: true } }
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const jsonStr = JSON.stringify(user, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const headers = new Headers({
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${user.username || "account"}_data.json"`,
    });
    return new Response(blob, { status: 200, headers });
  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
