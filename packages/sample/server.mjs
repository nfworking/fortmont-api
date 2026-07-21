import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const root = resolve(process.cwd());
const sampleRoot = join(root);
const port = Number(process.env.PORT || 4173);

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
]);

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

async function serveFile(path, res) {
  const data = await readFile(path);
  const contentType = contentTypes.get(extname(path)) || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  res.end(data);
}

async function fetchTokens(payload) {
  const issuer = String(payload.issuer || 'https://api.fortmont.me').replace(/\/$/, '');
  const tokenResponse = await fetch(`${issuer}/api/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: payload.clientId,
      ...(payload.clientSecret ? { client_secret: payload.clientSecret } : {}),
      redirect_uri: payload.redirectUri,
      code: payload.code,
      code_verifier: payload.codeVerifier,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) {
    return { ok: false, status: tokenResponse.status, body: tokenData };
  }

  const userInfoResponse = await fetch(`${issuer}/api/oauth/userinfo`, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userInfo = await userInfoResponse.json();

  return {
    ok: userInfoResponse.ok,
    status: userInfoResponse.ok ? 200 : userInfoResponse.status,
    body: { tokenData, userInfo },
  };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname === '/exchange' && req.method === 'POST') {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    try {
      const payload = JSON.parse(raw || '{}');
      if (!payload.code || !payload.clientId || !payload.redirectUri || !payload.codeVerifier) {
        sendJson(res, 400, { error: 'invalid_request' });
        return;
      }
      const result = await fetchTokens(payload);
      sendJson(res, result.status, result.body);
    } catch (error) {
      sendJson(res, 500, { error: 'exchange_failed', message: String(error) });
    }
    return;
  }

  if (url.pathname === '/app.js') {
    await serveFile(join(sampleRoot, 'app.js'), res);
    return;
  }

  if (url.pathname === '/styles.css') {
    await serveFile(join(sampleRoot, 'styles.css'), res);
    return;
  }

  if (url.pathname === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }

  await serveFile(join(sampleRoot, 'index.html'), res);
});

server.listen(port, () => {
  console.log(`Fortmont OAuth sample running at http://localhost:${port}`);
});