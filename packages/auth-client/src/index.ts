export interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes?: string[]; // e.g. ['openid','profile','email']
  authBaseUrl: string; // e.g. 'https://yourdomain.com/api/oauth'
}

/**
 * Build the authorization URL to redirect the user to Fortmont login.
 */
export function buildAuthUrl(config: OAuthConfig, state?: string, codeChallenge?: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: (config.scopes ?? ['openid', 'profile', 'email']).join(' '),
  });
  if (state) params.append('state', state);
  if (codeChallenge) params.append('code_challenge', codeChallenge);
  if (codeChallenge) params.append('code_challenge_method', 'S256');
  return `${config.authBaseUrl}/authorize?${params.toString()}`;
}

/**
 * Exchange an authorization code for an access (and optional refresh) token.
 */
export async function exchangeCode(
  config: OAuthConfig,
  code: string,
  codeVerifier?: string
): Promise<any> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
  });
  if (codeVerifier) body.append('code_verifier', codeVerifier);

  const resp = await fetch(`${config.authBaseUrl}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!resp.ok) throw new Error('Token exchange failed');
  return resp.json();
}

/**
 * Fetch the current user info using the access token.
 */
export async function fetchUserInfo(accessToken: string, userInfoEndpoint: string): Promise<any> {
  const resp = await fetch(userInfoEndpoint, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) throw new Error('Failed to fetch user info');
  return resp.json();
}
