import { NextResponse } from 'next/server';
import { resolveTicketingActor } from '@/lib/ticketing-auth';
import { getOAuthBaseUrl, scopesInclude, verifyAccessToken } from '@/lib/oauth';
import { prisma } from '@/lib/prisma';

function scopesFromPayload(scope: unknown): string[] {
  return typeof scope === 'string' ? scope.split(/\s+/).filter(Boolean) : [];
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
  }

  try {
    const issuer = getOAuthBaseUrl(request);
    const { payload } = await verifyAccessToken(authHeader.slice(7), issuer);
    const actor = await resolveTicketingActor(request);
    if (!actor?.userId || actor.userId !== payload.sub || typeof payload.sub !== 'string') {
      return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
    }

    const scopes = scopesFromPayload(payload.scope);
    const user = await prisma.appUsers.findUnique({
      where: { id: actor.userId },
      select: { email: true, displayName: true, username: true, avatarUrl: true },
    });

    const claims: Record<string, unknown> = { sub: actor.userId };
    if (scopesInclude(scopes, 'email') && user?.email) {
      claims.email = user.email;
    }
    if (scopesInclude(scopes, 'profile')) {
      claims.name = user?.displayName ?? user?.username ?? undefined;
      if (user?.avatarUrl) claims.picture = user.avatarUrl;
    }

    return NextResponse.json(claims);
  } catch {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
  }
}
