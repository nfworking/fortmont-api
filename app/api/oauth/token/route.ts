import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { signAccessToken, generateRandomString, verifyClientSecret } from '@/lib/oauth';
import { URLSearchParams } from 'url';
import { addMinutes } from 'date-fns';

export async function POST(request: Request) {
  const form = await request.formData();
  const grantType = form.get('grant_type');
  const clientId = form.get('client_id') as string | null;
  const clientSecret = form.get('client_secret') as string | null;
  const code = form.get('code') as string | null;
  const redirectUri = form.get('redirect_uri') as string | null;
  const refreshToken = form.get('refresh_token') as string | null;
  const codeVerifier = form.get('code_verifier') as string | null;

  if (!clientId) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 400 });
  }

  const client = await prisma.oAuthClient.findUnique({ where: { clientId } });
  if (!client) return NextResponse.json({ error: 'invalid_client' }, { status: 400 });

  // Verify client secret if provided (confidential clients)
  if (clientSecret) {
    const ok = await verifyClientSecret(client.clientSecret, clientSecret);
    if (!ok) return NextResponse.json({ error: 'invalid_client' }, { status: 401 });
  }

  if (grantType === 'authorization_code') {
    if (!code || !redirectUri) {
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }
    const authCode = await prisma.oAuthCode.findUnique({ where: { code } });
    if (!authCode || authCode.used || authCode.expiresAt < new Date()) {
      return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
    }
    if (authCode.clientId !== client.id) {
      return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
    }
    if (authCode.redirectUri !== redirectUri) {
      return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
    }
    // PKCE verification if present
    if (authCode.codeChallenge) {
      if (!codeVerifier) return NextResponse.json({ error: 'invalid_request', error_description: 'code_verifier required' }, { status: 400 });
      // Compute S256 hash of verifier
      const verifierHash = require('crypto').createHash('sha256').update(codeVerifier).digest('base64url');
      if (verifierHash !== authCode.codeChallenge) {
        return NextResponse.json({ error: 'invalid_grant', error_description: 'PKCE verification failed' }, { status: 400 });
      }
    }
    // Mark code as used
    await prisma.oAuthCode.update({ where: { code }, data: { used: true } });

    // Create access token JWT
    const accessToken = await signAccessToken({ sub: authCode.userId, aud: client.clientId, scope: authCode.scopes?.join(' ') ?? '' }, '1h');

    // Optionally issue refresh token if offline_access scope requested
    let refreshTokenValue: string | undefined;
    if ((authCode.scopes ?? []).includes('offline_access')) {
      refreshTokenValue = await generateRandomString(48);
      await prisma.oAuthToken.create({
        data: {
          token: refreshTokenValue,
          clientId: client.id,
          userId: authCode.userId,
          type: 'REFRESH',
          scopes: authCode.scopes as any,
          expiresAt: addMinutes(new Date(), 60 * 24 * 30), // 30 days
        },
      });
    }

    const resp: any = {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: authCode.scopes?.join(' ') ?? '',
    };
    if (refreshTokenValue) resp.refresh_token = refreshTokenValue;
    return NextResponse.json(resp);
  }

  if (grantType === 'refresh_token') {
    if (!refreshToken) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    const stored = await prisma.oAuthToken.findUnique({ where: { token: refreshToken as string } });
    if (!stored || stored.revoked || stored.expiresAt < new Date() || stored.clientId !== client.id) {
      return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
    }
    const accessToken = await signAccessToken({ sub: stored.userId, aud: client.clientId, scope: stored.scopes?.join(' ') ?? '' }, '1h');
    const resp = {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: stored.scopes?.join(' ') ?? '',
    };
    return NextResponse.json(resp);
  }

  return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 });
}
