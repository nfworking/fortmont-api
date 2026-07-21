// app/api/github/status/route.ts
// Returns the linked GitHub account info (without the token) for the current user.
// Use this on your settings page to show whether the account is connected.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTicketingActor } from "@/lib/ticketing-auth";

export async function GET(request: Request) {
  const actor = await resolveTicketingActor(request);

  if (!actor?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const link = await prisma.gitHubLink.findUnique({
    where: { userId: actor.userId },
    select: {
      username: true,
      avatarUrl: true,
      profileUrl: true,
      scope: true,
      linkedAt: true,
    },
  });

  if (!link) {
    return NextResponse.json({ linked: false });
  }

  return NextResponse.json({ linked: true, ...link });
}