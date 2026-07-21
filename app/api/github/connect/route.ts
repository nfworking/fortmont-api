// app/api/github/connect/route.ts
// Redirects the authenticated user to GitHub's OAuth authorization page.

import { NextResponse } from "next/server";
import { resolveTicketingActor } from "@/lib/ticketing-auth";

export async function GET(request: Request) {
  const actor = await resolveTicketingActor(request);

  if (!actor?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: process.env.GITHUB_REDIRECT_URI!,
    scope: "read:user user:email repo",
    state: actor.userId, // Use the user's ID as state to retrieve it in the callback
  });

  const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

  return NextResponse.redirect(githubAuthUrl);
}