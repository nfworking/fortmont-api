import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const tickets = await prisma.tickets.findMany({
    where: {
      OR: [{ status: null }, { status: { not: "closed" } }],
    },
    include: {
      createdBy: true,
      assignedTo: true,
      comments: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(tickets, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
