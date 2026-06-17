import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  const body = await req.json();

  // optional safety check (highly recommended)
  if (!userId) {
    return NextResponse.json(
      { error: "Missing userId" },
      { status: 400 }
    );
  }

  const user = await prisma.appUsers.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  const notification = await prisma.notifications.create({
    data: {
      userId: user.id,
      type: body.type,
      title: body.title,
      description: body.description ?? "This is a new notification",
      read: body.read ?? false,
    },
  });

  return NextResponse.json(notification);
}