# @fortmont/auth-client-mobile

React Native helpers for signing into an app with Fortmont as the OpenID Connect identity provider.

## Install

```bash
pnpm add @fortmont/auth-client-mobile
```

## Polyfills

Import the polyfills once at app startup before using the SDK:

```ts
import '@fortmont/auth-client-mobile/polyfills';
```

This adds the runtime pieces the SDK expects in React Native:

- `crypto.getRandomValues`
- `URL` / `URLSearchParams`

## Environment

Use the Fortmont issuer root:

```env
FORTMONT_ISSUER=https://api.fortmont.me
FORTMONT_CLIENT_ID=your-mobile-client-id
FORTMONT_REDIRECT_URI=yourapp://auth/callback
```

Mobile apps should use PKCE and should not ship a client secret.

## Basic flow

```ts
import '@fortmont/auth-client-mobile/polyfills';
import * as Linking from 'expo-linking';
import {
  createLoginRequest,
  exchangeCode,
  fetchUserInfo,
} from '@fortmont/auth-client-mobile';

const issuer = process.env.EXPO_PUBLIC_FORTMONT_ISSUER!;
const clientId = process.env.EXPO_PUBLIC_FORTMONT_CLIENT_ID!;
const redirectUri = Linking.createURL('auth/callback');

const login = await createLoginRequest({
  issuer,
  clientId,
  redirectUri,
  scopes: ['openid', 'profile', 'email'],
});

await Linking.openURL(login.authUrl);

// Save login.state and login.codeVerifier until the app receives the callback.
// Then exchange the returned code.
const tokenResponse = await exchangeCode(
  {
    issuer,
    clientId,
    redirectUri,
  },
  callbackCode,
  login.codeVerifier,
);

const userInfo = await fetchUserInfo(tokenResponse.access_token, issuer);
```

## Discovery

If you want the SDK to read the provider metadata first:

```ts
import { getDiscoveryDocument, createLoginRequestFromDiscovery } from '@fortmont/auth-client-mobile';

const discovery = await getDiscoveryDocument('https://api.fortmont.me');
const login = await createLoginRequestFromDiscovery(discovery, {
  clientId,
  redirectUri,
  scopes: ['openid', 'profile', 'email'],
});
```

## Public API

- `buildAuthUrl(config, state?, codeChallenge?)`
- `createAuthorizationUrl(issuerOrConfig, clientId, redirectUri, scopes?, state?, codeChallenge?, nonce?)`
- `createAuthorizationUrlFromDiscovery(discovery, clientId, redirectUri, scopes?, state?, codeChallenge?, nonce?)`
- `createLoginRequest(config, options?)`
- `createLoginRequestFromDiscovery(discovery, config, options?)`
- `createPkcePair(length?)`
- `generateCodeChallenge(verifier)`
- `generateCodeVerifier(length?)`
- `generateNonce(length?)`
- `generateState(length?)`
- `getDiscoveryDocument(issuerOrConfig)`
- `getDiscoveryUrl(issuer)`
- `getTokenUrl(issuerOrConfig)`
- `getUserInfoUrl(issuerOrConfig)`
- `exchangeCode(config, code, codeVerifier?)`
- `fetchUserInfo(accessToken, userInfoEndpointOrIssuer)`

## Notes

- Auth endpoint: `https://api.fortmont.me/api/oauth/authorize`
- Token endpoint: `https://api.fortmont.me/api/oauth/token`
- Userinfo endpoint: `https://api.fortmont.me/api/oauth/userinfo`
- Discovery endpoint: `https://api.fortmont.me/.well-known/openid-configuration`