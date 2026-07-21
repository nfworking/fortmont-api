const stateEl = document.getElementById('state');
const outputEl = document.getElementById('output');
const issuerEl = document.getElementById('issuer');
const clientIdEl = document.getElementById('clientId');
const clientSecretEl = document.getElementById('clientSecret');
const redirectUriEl = document.getElementById('redirectUri');
const scopesEl = document.getElementById('scopes');
const signInButton = document.getElementById('signIn');
const clearButton = document.getElementById('clear');

const verifierKey = 'fortmont-oauth-code-verifier';
const stateKey = 'fortmont-oauth-state';
const issuerConfigKey = 'fortmont-oauth-issuer';
const clientIdConfigKey = 'fortmont-oauth-client-id';
const clientSecretConfigKey = 'fortmont-oauth-client-secret';
const redirectUriConfigKey = 'fortmont-oauth-redirect-uri';
const scopesConfigKey = 'fortmont-oauth-scopes';

function buildStoragePrefix() {
  const issuer = issuerEl.value.replace(/\/$/, '');
  const clientId = clientIdEl.value.trim();
  const redirectUri = redirectUriEl.value.trim();
  return [issuer, clientId, redirectUri].join('|');
}

function storageKey(key) {
  return `${buildStoragePrefix()}|${key}`;
}

function loadSavedConfig() {
  const savedIssuer = localStorage.getItem(issuerConfigKey);
  const savedClientId = localStorage.getItem(clientIdConfigKey);
  const savedClientSecret = localStorage.getItem(clientSecretConfigKey);
  const savedRedirectUri = localStorage.getItem(redirectUriConfigKey);
  const savedScopes = localStorage.getItem(scopesConfigKey);

  if (savedIssuer && !issuerEl.value) issuerEl.value = savedIssuer;
  if (savedClientId && !clientIdEl.value) clientIdEl.value = savedClientId;
  if (savedClientSecret && clientSecretEl && !clientSecretEl.value) clientSecretEl.value = savedClientSecret;
  if (savedRedirectUri && !redirectUriEl.value) redirectUriEl.value = savedRedirectUri;
  if (savedScopes && !scopesEl.value) scopesEl.value = savedScopes;
}

function saveConfig() {
  localStorage.setItem(issuerConfigKey, issuerEl.value.trim());
  localStorage.setItem(clientIdConfigKey, clientIdEl.value.trim());
  if (clientSecretEl) localStorage.setItem(clientSecretConfigKey, clientSecretEl.value.trim());
  localStorage.setItem(redirectUriConfigKey, redirectUriEl.value.trim());
  localStorage.setItem(scopesConfigKey, scopesEl.value.trim());
}

function setState(message) {
  stateEl.textContent = message;
}

function setOutput(value) {
  outputEl.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

function randomString(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function startLogin() {
  const issuer = issuerEl.value.replace(/\/$/, '');
  const clientId = clientIdEl.value.trim();
  const redirectUri = redirectUriEl.value.trim();
  const scopes = scopesEl.value.trim() || 'openid profile email';

  if (!issuer || !clientId || !redirectUri) {
    setState('Issuer, client ID, and redirect URI are required.');
    return;
  }

  saveConfig();

  const verifier = randomString(64);
  const challenge = await sha256(verifier);
  const state = randomString(16);

  sessionStorage.setItem(verifierKey, verifier);
  sessionStorage.setItem(stateKey, state);
  localStorage.setItem(storageKey(verifierKey), verifier);
  localStorage.setItem(storageKey(stateKey), state);

  const url = new URL(`${issuer}/api/oauth/authorize`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', scopes);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', state);
  url.searchParams.set('nonce', randomString(16));

  setState(`Redirecting to ${url.host} ...`);
  window.location.href = url.toString();
}

async function handleCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const returnedState = params.get('state');

  if (!code) {
    setState('Ready');
    return;
  }

  const issuer = issuerEl.value.replace(/\/$/, '');
  const clientId = clientIdEl.value.trim();
  const clientSecret = clientSecretEl?.value.trim();
  const redirectUri = redirectUriEl.value.trim();
  const expectedState = sessionStorage.getItem(stateKey);
  const verifier = sessionStorage.getItem(verifierKey) || localStorage.getItem(storageKey(verifierKey));

  if (expectedState && returnedState !== expectedState) {
    setState('State mismatch.');
    setOutput({ error: 'state_mismatch', returnedState, expectedState });
    return;
  }

  if (!expectedState && returnedState) {
    const fallbackState = localStorage.getItem(storageKey(stateKey));
    if (fallbackState && returnedState !== fallbackState) {
      setState('State mismatch.');
      setOutput({ error: 'state_mismatch', returnedState, expectedState: fallbackState });
      return;
    }
  }

  if (!verifier) {
    setState('Missing PKCE verifier. Start a fresh login.');
    setOutput({ error: 'missing_verifier' });
    return;
  }

  setState('Exchanging authorization code...');
  const exchangeResponse = await fetch('/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      issuer,
      clientId,
      clientSecret: clientSecret || undefined,
      redirectUri,
      code,
      codeVerifier: verifier,
    }),
  });

  const exchangeData = await exchangeResponse.json();
  if (!exchangeResponse.ok) {
    setState('Token exchange failed.');
    setOutput(exchangeData);
    return;
  }

  setState('Login completed successfully.');
  setOutput(exchangeData);

  window.history.replaceState({}, '', window.location.pathname);
  sessionStorage.removeItem(verifierKey);
  sessionStorage.removeItem(stateKey);
  localStorage.removeItem(storageKey(verifierKey));
  localStorage.removeItem(storageKey(stateKey));
}

signInButton.addEventListener('click', () => {
  void startLogin();
});

clearButton.addEventListener('click', () => {
  sessionStorage.removeItem(verifierKey);
  sessionStorage.removeItem(stateKey);
  localStorage.removeItem(storageKey(verifierKey));
  localStorage.removeItem(storageKey(stateKey));
  window.history.replaceState({}, '', window.location.pathname);
  setState('Cleared local sample state.');
  setOutput('No sign-in yet.');
});

loadSavedConfig();

void handleCallback().catch((error) => {
  setState('Unexpected error while handling callback.');
  setOutput(String(error));
});