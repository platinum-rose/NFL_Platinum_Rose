// src/lib/yahoo.js
// ═══════════════════════════════════════════════════════════════════════════════
// Yahoo Fantasy Sports API client — OAuth2 (authorization-code + refresh-token)
// plus defensive readers for Yahoo's deeply-nested `fantasy_content` JSON.
//
// One-time manual auth (see scripts/yahoo-auth.js):
//   1. visit authorizeUrl(), sign in, approve
//   2. copy the `code` from the redirect → exchangeCode(code) saves tokens to
//      .nfl/yahoo/tokens.json (gitignored). Access tokens auto-refresh from here on.
//
// Env: YAHOO_CLIENT_ID, YAHOO_CLIENT_SECRET, YAHOO_REDIRECT_URI (default https://localhost)
// Docs: https://developer.yahoo.com/oauth2/guide/  ·  https://developer.yahoo.com/fantasysports/guide/
// ═══════════════════════════════════════════════════════════════════════════════
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';

const AUTH_URL  = 'https://api.login.yahoo.com/oauth2/request_auth';
const TOKEN_URL = 'https://api.login.yahoo.com/oauth2/get_token';
const API_BASE  = 'https://fantasysports.yahooapis.com/fantasy/v2';

export const TOKENS_PATH   = path.resolve(process.cwd(), '.nfl/yahoo/tokens.json');
export const CLIENT_ID     = process.env.YAHOO_CLIENT_ID || '';
export const CLIENT_SECRET = process.env.YAHOO_CLIENT_SECRET || '';
export const REDIRECT_URI  = process.env.YAHOO_REDIRECT_URI || 'https://localhost';

function basicAuth() {
  return 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
}

// Consent URL the user opens once to authorize the app.
// NOTE: Yahoo derives Fantasy access from the app's configured API permission
// (Fantasy Sports → Read), NOT from an OAuth `scope` param. Passing scope=fspt-r
// makes Yahoo return error=invalid_scope, so we omit scope entirely. If you ever
// need to force one, set YAHOO_SCOPE in .env.
export function authorizeUrl(state = 'atlas') {
  const p = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    language: 'en-us',
    state,
  });
  if (process.env.YAHOO_SCOPE) p.set('scope', process.env.YAHOO_SCOPE);
  return `${AUTH_URL}?${p.toString()}`;
}

function normalizeToken(j) {
  return {
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    token_type: j.token_type || 'bearer',
    xoauth_yahoo_guid: j.xoauth_yahoo_guid,
    // refresh 60s early to dodge clock skew
    expires_at: Date.now() + (((j.expires_in ?? 3600) - 60) * 1000),
  };
}

async function saveTokens(tok) {
  await mkdir(path.dirname(TOKENS_PATH), { recursive: true });
  await writeFile(TOKENS_PATH, JSON.stringify(tok, null, 2));
  return tok;
}
async function loadTokens() {
  try { return JSON.parse(await readFile(TOKENS_PATH, 'utf8')); }
  catch { return null; }
}

// Initial code → tokens exchange (called by scripts/yahoo-auth.js).
export async function exchangeCode(code) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
    code,
  });
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { Authorization: basicAuth(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Yahoo token exchange failed (${r.status}): ${JSON.stringify(j)}`);
  return saveTokens(normalizeToken(j));
}

async function refresh(tok) {
  if (!tok?.refresh_token) throw new Error('No refresh_token; re-run scripts/yahoo-auth.js');
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    redirect_uri: REDIRECT_URI,
    refresh_token: tok.refresh_token,
  });
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { Authorization: basicAuth(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Yahoo token refresh failed (${r.status}): ${JSON.stringify(j)}`);
  const next = normalizeToken(j);
  if (!next.refresh_token) next.refresh_token = tok.refresh_token; // Yahoo may omit on refresh
  return saveTokens(next);
}

export async function getAccessToken() {
  let tok = await loadTokens();
  if (!tok) throw new Error(`No Yahoo tokens at ${TOKENS_PATH}. Run: node scripts/yahoo-auth.js`);
  if (Date.now() >= (tok.expires_at ?? 0)) tok = await refresh(tok);
  return tok.access_token;
}

// GET a Yahoo Fantasy endpoint (path relative to API_BASE, or an absolute URL) as JSON.
// Appends ?format=json and retries once on a 401 by forcing a refresh.
export async function yget(pathRel) {
  const build = (base) => base.startsWith('http')
    ? base
    : `${API_BASE}/${base.replace(/^\//, '')}${base.includes('?') ? '&' : '?'}format=json`;
  const url = build(pathRel);
  const call = (at) => fetch(url, { headers: { Authorization: `Bearer ${at}`, Accept: 'application/json' } });

  let r = await call(await getAccessToken());
  if (r.status === 401) {
    const tok = await refresh(await loadTokens());
    r = await call(tok.access_token);
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Yahoo GET ${url} → ${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
  return j;
}

// ── Defensive readers for Yahoo's nested fantasy_content ─────────────────────────
// Yahoo mixes arrays of single-key objects with numeric-keyed "collection" objects
// ({ "0": {...}, "1": {...}, count: N }). These helpers make parsing robust to the
// exact nesting for uniquely-named fields.

// Flatten every scalar leaf under `node` into one flat map (first occurrence wins).
// Call it PER entity (e.g. one player node) — not on a whole collection.
export function deepCollect(node, out = {}, seen = new Set()) {
  if (node == null || typeof node !== 'object') return out;
  if (seen.has(node)) return out;
  seen.add(node);
  if (Array.isArray(node)) { for (const el of node) deepCollect(el, out, seen); return out; }
  for (const [k, v] of Object.entries(node)) {
    if (v == null) continue;
    if (typeof v === 'object') {
      if (k === 'name' && typeof v.full === 'string' && out.name == null) out.name = v.full;
      deepCollect(v, out, seen);
    } else if (out[k] == null) {
      out[k] = v;
    }
  }
  return out;
}

// Turn a numeric-keyed collection ({ "0":..,"1":..,count }) into an array of its items.
export function collectionItems(coll) {
  if (!coll || typeof coll !== 'object') return [];
  const items = [];
  for (const [k, v] of Object.entries(coll)) {
    if (/^\d+$/.test(k)) items.push(v);
  }
  return items;
}

// Return every value found under any occurrence of `key`, anywhere in the tree.
export function findAll(node, key, out = []) {
  if (node == null || typeof node !== 'object') return out;
  if (Array.isArray(node)) { for (const el of node) findAll(el, key, out); return out; }
  for (const [k, v] of Object.entries(node)) {
    if (k === key) out.push(v);
    if (v && typeof v === 'object') findAll(v, key, out);
  }
  return out;
}
