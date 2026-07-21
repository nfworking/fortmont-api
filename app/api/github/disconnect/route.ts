// app/api/github/disconnect/route.ts
// Deletes the GitHubLink record, effectively unlinking the account.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTicketingActor } from "@/lib/ticketing-auth";

export async function DELETE(request: Request) {
  const actor = await resolveTicketingActor(request);

  if (!actor?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.gitHubLink.findUnique({
    where: { userId: actor.userId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "No GitHub account linked" },
      { status: 404 }
    );
  }

  await prisma.gitHubLink.delete({
    where: { userId: actor.userId },
  });

  return NextResponse.json({ success: true, message: "GitHub account unlinked" });
}