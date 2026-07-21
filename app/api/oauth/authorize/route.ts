import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { signAccessToken, generateRandomString, verifyClientSecret } from '@/lib/oauth';
import { URLSearchParams } from 'url';
import { addMinutes } from 'date-fns';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientId = url.searchParams.get('client_id');
  const redirectUri = url.searchParams.get('redirect_uri');
  const responseType = url.searchParams.get('response_type');
  const scope = url.searchParams.get('scope') || '';
  const state = url.searchParams.get('state');
  const codeChallenge = url.searchParams.get('code_challenge');
  const codeChallengeMethod = url.searchParams.get('code_challenge_method');

  if (!clientId || !redirectUri || responseType !== 'code') {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  // Verify client exists and redirect_uri matches whitelist
  const client = await prisma.oAuthClient.findUnique({ where: { clientId } });
  if (!client || !(client.redirectUris as unknown as string[]).includes(redirectUri)) {
    return NextResponse.json({ error: 'unauthorized_client' }, { status: 400 });
  }

  // Ensure user is logged in
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    // Redirect to sign‑in page preserving original request via callbackUrl
    const signInUrl = new URL('/api/auth/signin', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    signInUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(signInUrl);
  }

  // For simplicity, we auto‑approve consent. In a real app you would render a consent UI.
  const code = await generateRandomString(32);
  await prisma.oAuthCode.create({
    data: {
      code,
      clientId: client.id,
      userId: (session.user as any).id,
      redirectUri,
      codeChallenge: codeChallenge ?? undefined,
      expiresAt: addMinutes(new Date(), 5),
    },
  });

  const params = new URLSearchParams({ code, ...(state ? { state } : {}) });
  const redirect = `${redirectUri}?${params.toString()}`;
  return NextResponse.redirect(redirect);
}
