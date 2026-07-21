"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDiscoveryUrl = getDiscoveryUrl;
exports.getAuthorizationUrl = getAuthorizationUrl;
exports.buildAuthUrl = buildAuthUrl;
exports.getTokenUrl = getTokenUrl;
exports.getUserInfoUrl = getUserInfoUrl;
exports.getDiscoveryDocument = getDiscoveryDocument;
exports.exchangeCode = exchangeCode;
exports.fetchUserInfo = fetchUserInfo;
exports.generateState = generateState;
exports.generateCodeVerifier = generateCodeVerifier;
exports.generateCodeChallenge = generateCodeChallenge;
exports.createPkcePair = createPkcePair;
exports.createAuthorizationUrlFromDiscovery = createAuthorizationUrlFromDiscovery;
function normalizeIssuer(value) {
    const trimmed = value.trim();
    if (!trimmed) {
        throw new Error('Fortmont issuer is required');
    }
    return trimmed.replace(/\/$/, '');
}
function resolveIssuer(configOrIssuer) {
    if (typeof configOrIssuer === 'string') {
        return normalizeIssuer(configOrIssuer);
    }
    return normalizeIssuer(configOrIssuer.issuer ?? configOrIssuer.authBaseUrl ?? '');
}
function getDiscoveryUrl(issuer) {
    return `${normalizeIssuer(issuer)}/.well-known/openid-configuration`;
}
function getAuthorizationUrl(config, state, codeChallenge) {
    const issuer = resolveIssuer(config);
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope: (config.scopes ?? ['openid', 'profile', 'email']).join(' '),
    });
    if (state)
        params.append('state', state);
    if (codeChallenge) {
        params.append('code_challenge', codeChallenge);
        params.append('code_challenge_method', 'S256');
    }
    return `${issuer}/api/oauth/authorize?${params.toString()}`;
}
function buildAuthUrl(config, state, codeChallenge) {
    return getAuthorizationUrl(config, state, codeChallenge);
}
function getTokenUrl(configOrIssuer) {
    return `${resolveIssuer(configOrIssuer)}/api/oauth/token`;
}
function getUserInfoUrl(configOrIssuer) {
    return `${resolveIssuer(configOrIssuer)}/api/oauth/userinfo`;
}
async function getDiscoveryDocument(configOrIssuer) {
    const response = await fetch(getDiscoveryUrl(resolveIssuer(configOrIssuer)), {
        headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
        throw new Error(`Failed to load Fortmont discovery document (${response.status})`);
    }
    return response.json();
}
async function readResponseBody(response) {
    const text = await response.text();
    return text || response.statusText || 'Unknown error';
}
async function exchangeCode(config, code, codeVerifier) {
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
    });
    if (config.clientSecret)
        body.append('client_secret', config.clientSecret);
    if (codeVerifier)
        body.append('code_verifier', codeVerifier);
    const response = await fetch(getTokenUrl(config), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });
    if (!response.ok) {
        throw new Error(`Token exchange failed (${response.status}): ${await readResponseBody(response)}`);
    }
    return response.json();
}
async function fetchUserInfo(accessToken, userInfoEndpointOrIssuer) {
    const userInfoUrl = userInfoEndpointOrIssuer.includes('/api/oauth/userinfo')
        ? userInfoEndpointOrIssuer
        : getUserInfoUrl(userInfoEndpointOrIssuer);
    const response = await fetch(userInfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch user info (${response.status})`);
    }
    return response.json();
}
function base64UrlEncode(bytes) {
    let binary = '';
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function randomBytes(length = 32) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
}
function generateState(length = 16) {
    return base64UrlEncode(randomBytes(length));
}
function generateCodeVerifier(length = 64) {
    return base64UrlEncode(randomBytes(length));
}
async function generateCodeChallenge(verifier) {
    const encoded = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return base64UrlEncode(new Uint8Array(digest));
}
async function createPkcePair(length = 64) {
    const verifier = generateCodeVerifier(length);
    return {
        verifier,
        challenge: await generateCodeChallenge(verifier),
    };
}
function createAuthorizationUrlFromDiscovery(discovery, clientId, redirectUri, scopes, state, codeChallenge, nonce) {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: (scopes ?? ['openid', 'profile', 'email']).join(' '),
    });
    if (state)
        params.set('state', state);
    if (codeChallenge) {
        params.set('code_challenge', codeChallenge);
        params.set('code_challenge_method', 'S256');
    }
    if (nonce)
        params.set('nonce', nonce);
    return `${discovery.authorization_endpoint}?${params.toString()}`;
}
//# sourceMappingURL=index.js.map