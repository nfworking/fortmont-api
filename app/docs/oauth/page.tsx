import React from 'react';
import Link from 'next/link';

export default function OAuthDocs() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const exampleRedirect = `${baseUrl}/callback`;
  const exampleClientId = 'your-client-id';
  const exampleScope = 'openid profile email offline_access';

  const authUrl = `${baseUrl}/api/oauth/authorize?response_type=code&client_id=${exampleClientId}&redirect_uri=${encodeURIComponent(exampleRedirect)}&scope=${encodeURIComponent(exampleScope)}&state=xyz`; // state should be random per request

  return (
    <main className="prose max-w-3xl mx-auto py-8">
      <h1>OAuth 2.0 / OpenID Connect Integration</h1>
      <p>
        Fortmont acts as the <strong>authorization server</strong>. Third‑party applications can obtain an
        access token (and optionally a refresh token) to call protected APIs on behalf of a user.
      </p>

      <h2>Endpoints</h2>
      <ul>
        <li>
          <code>GET /api/oauth/authorize</code> – Authorization endpoint. Redirects the user to the login
          flow, shows a consent screen and returns an <code>authorization_code</code>.
        </li>
        <li>
          <code>POST /api/oauth/token</code> – Token endpoint. Exchanges an authorization code for a JWT
          access token (or refreshes an access token).
        </li>
        <li>
          <code>GET /.well-known/openid-configuration</code> – OpenID Connect discovery document.
        </li>
        <li>
          <code>GET /api/jwks</code> – JSON Web Key Set containing the RSA public key used to verify JWTs.
        </li>
        <li>
          <code>GET /api/admin/oauth-client</code> – Admin UI (internal) to create and manage OAuth clients.
        </li>
      </ul>

      <h2>Authorization Code Flow</h2>
      <ol>
        <li>
          <strong>Build the authorization URL</strong> (example):
          <pre>{authUrl}</pre>
        </li>
        <li>
          User is redirected to the URL, logs in (via Next‑Auth), and is shown a consent screen.
        </li>
        <li>
          After consent, the server redirects back to <code>{exampleRedirect}</code> with <code>code</code> and
          <code>state</code> query parameters.
        </li>
        <li>
          <strong>Exchange the code for tokens</strong>:
          <pre>
POST {baseUrl}/api/oauth/token
Content-Type: application/x-www-form-urlencoded

client_id={exampleClientId}&client_secret=YOUR_CLIENT_SECRET&grant_type=authorization_code&code=CODE_FROM_STEP_3&redirect_uri={encodeURIComponent(exampleRedirect)}&code_verifier=OPTIONAL_PKCE_VERIFIER
          </pre>
        </li>
        <li>
          The response contains <code>access_token</code> (JWT) and optionally <code>refresh_token</code> if the
          <code>offline_access</code> scope was requested.
        </li>
        <li>
          Use the access token in the <code>Authorization: Bearer &lt;token&gt;</code> header when calling protected
          APIs.
        </li>
      </ol>

      <h2>Refresh Token Flow</h2>
      <pre>
POST {baseUrl}/api/oauth/token
Content-Type: application/x-www-form-urlencoded

client_id={exampleClientId}&client_secret=YOUR_CLIENT_SECRET&grant_type=refresh_token&refresh_token=YOUR_REFRESH_TOKEN
      </pre>

      <h2>SDK</h2>
      <p>
        The <code>@fortmont/auth-client</code> package provides helper functions to build URLs, exchange tokens, and
        verify JWTs. See the package README for usage examples.
      </p>

      <h2>Further Reading</h2>
      <ul>
        <li>
          <a href="https://openid.net/specs/openid-connect-core-1_0.html" target="_blank" rel="noopener">
            OpenID Connect Core 1.0
          </a>
        </li>
        <li>
          <a href="https://datatracker.ietf.org/doc/html/rfc6749" target="_blank" rel="noopener">
            OAuth 2.0 Authorization Framework (RFC 6749)
          </a>
        </li>
      </ul>
    </main>
  );
}
