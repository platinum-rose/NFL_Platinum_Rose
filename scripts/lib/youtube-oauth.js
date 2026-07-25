import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const YOUTUBE_READONLY_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';

export const DEFAULT_CLIENT_PATH = path.join(process.cwd(), 'config', 'youtube-oauth-client.json');
export const DEFAULT_TOKEN_PATH = path.join(process.cwd(), 'data', 'secrets', 'youtube-oauth-token.json');
export const DEFAULT_REDIRECT_PORT = 53682;
export const DEFAULT_REDIRECT_PATH = '/oauth2callback';

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

export function loadClientConfig(clientPath = DEFAULT_CLIENT_PATH) {
  if (!fs.existsSync(clientPath)) {
    throw new Error(`Missing YouTube OAuth client config: ${clientPath}`);
  }

  const raw = readJson(clientPath);
  const config = raw.installed || raw.web || raw;
  const clientId = config.client_id || process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = config.client_secret || process.env.YOUTUBE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('OAuth client config must include client_id and client_secret.');
  }

  return {
    client_id: clientId,
    client_secret: clientSecret,
    auth_uri: config.auth_uri || 'https://accounts.google.com/o/oauth2/v2/auth',
    token_uri: config.token_uri || 'https://oauth2.googleapis.com/token'
  };
}

export function buildRedirectUri(port = DEFAULT_REDIRECT_PORT) {
  return `http://127.0.0.1:${port}${DEFAULT_REDIRECT_PATH}`;
}

export function buildAuthUrl(clientConfig, { state, port = DEFAULT_REDIRECT_PORT } = {}) {
  const url = new URL(clientConfig.auth_uri);
  url.searchParams.set('client_id', clientConfig.client_id);
  url.searchParams.set('redirect_uri', buildRedirectUri(port));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', YOUTUBE_READONLY_SCOPE);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', state);
  return url.toString();
}

export async function waitForOAuthCode({ port = DEFAULT_REDIRECT_PORT, expectedState } = {}) {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      try {
        const url = new URL(req.url, buildRedirectUri(port));
        if (url.pathname !== DEFAULT_REDIRECT_PATH) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }

        const error = url.searchParams.get('error');
        if (error) throw new Error(`OAuth error: ${error}`);

        const state = url.searchParams.get('state');
        if (state !== expectedState) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('OAuth state mismatch. Please use the newest authorization URL from the terminal.');
          return;
        }

        const code = url.searchParams.get('code');
        if (!code) throw new Error('OAuth callback did not include a code.');

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('YouTube OAuth complete. You can close this tab and return to Codex.');
        server.close(() => resolve(code));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end(err.message);
        server.close(() => reject(err));
      }
    });

    server.on('error', reject);
    server.listen(port, '127.0.0.1');
  });
}

export async function exchangeCodeForToken(clientConfig, code, { port = DEFAULT_REDIRECT_PORT } = {}) {
  const body = new URLSearchParams({
    code,
    client_id: clientConfig.client_id,
    client_secret: clientConfig.client_secret,
    redirect_uri: buildRedirectUri(port),
    grant_type: 'authorization_code'
  });

  const res = await fetch(clientConfig.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Token exchange failed (${res.status}): ${JSON.stringify(json)}`);
  }

  return normalizeToken(json);
}

export async function refreshAccessToken(clientConfig, token) {
  if (!token.refresh_token) {
    throw new Error('Stored token does not include refresh_token. Re-run OAuth setup with prompt=consent.');
  }

  const body = new URLSearchParams({
    client_id: clientConfig.client_id,
    client_secret: clientConfig.client_secret,
    refresh_token: token.refresh_token,
    grant_type: 'refresh_token'
  });

  const res = await fetch(clientConfig.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Token refresh failed (${res.status}): ${JSON.stringify(json)}`);
  }

  return normalizeToken({
    ...token,
    ...json,
    refresh_token: token.refresh_token
  });
}

export async function getAccessToken({
  clientPath = DEFAULT_CLIENT_PATH,
  tokenPath = DEFAULT_TOKEN_PATH
} = {}) {
  const clientConfig = loadClientConfig(clientPath);
  let token = readJson(tokenPath);

  const expiresAt = token.expires_at || 0;
  const needsRefresh = Date.now() > expiresAt - 60_000;
  if (needsRefresh) {
    token = await refreshAccessToken(clientConfig, token);
    writeJson(tokenPath, token);
  }

  return token.access_token;
}

export async function youtubeGet(pathname, params, accessToken) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${pathname}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`YouTube API ${pathname} failed (${res.status}): ${JSON.stringify(json)}`);
  }

  return json;
}

export function normalizeToken(token) {
  return {
    ...token,
    expires_at: Date.now() + Number(token.expires_in || 0) * 1000
  };
}

export function newState() {
  return crypto.randomBytes(16).toString('hex');
}
