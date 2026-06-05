/**
 * Phase 8 -- /share/* partner surface.
 *
 * Exports:
 *   shareGuard({ supabase })       Fastify preHandler: validates token, sets
 *                                  request.shareToken + request.partnerName.
 *   recordView({ ... })            Fire-and-forget audit insert into share_views.
 *   registerShareRoutes(app, opts) Wires the 4 public /share/* routes.
 *
 *   mintToken / revokeToken / listTokens  Service-role helpers used by the CLI.
 *
 * Security posture:
 *   - Token is in the path (no Referer leakage).
 *   - All three rejection cases (not found, revoked, expired) return the SAME
 *     403 body -- no oracle to enumerate token existence.
 *   - IP is truncated to /24 (IPv4) or /48 (IPv6) before the audit insert.
 *   - shareGuard uses a per-instance TTL cache (<=60 s) to blunt enumeration.
 *   - recordView is fire-and-forget; audit error NEVER blocks the response.
 */

import crypto from 'node:crypto';
import { config as defaultConfig } from './config.js';
import { resolveDigestPath, sendDigestFile } from './digest.js';

const TOKEN_CACHE_TTL_MS = 60_000;
const TOKEN_CACHE_MAX    = 256;

const SHARE_HEADERS = {
  'Cache-Control':   'private, no-store',
  'X-Robots-Tag':    'noindex, nofollow',
  'Referrer-Policy': 'no-referrer',
};

// ---- IP truncation ----

function truncateIp(ip) {
  if (!ip) return null;
  // IPv4: mask last octet
  const v4 = ip.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/);
  if (v4) return v4[1] + '.0/24';
  // IPv6: keep first 3 groups (48 bits)
  const parts = ip.split(':');
  if (parts.length >= 3) return parts.slice(0, 3).join(':') + '::/48';
  return ip;
}

// ---- shareGuard preHandler ----

/**
 * Build a Fastify preHandler that validates the :token path param.
 * Uses a per-instance TTL cache to avoid hitting Supabase on every request.
 * All rejection cases return 403 { error: 'invalid_token' } (no oracle).
 *
 * @param {{ supabase?: object }} opts  service-role Supabase client
 * @returns {function} async Fastify preHandler
 */
export function shareGuard({ supabase } = {}) {
  // Per-instance cache: token string -> { row: object|null, cachedAt: ms }
  const cache = new Map();

  return async (request, reply) => {
    const token = request.params?.token;

    if (!token) {
      return reply.code(403).send({ error: 'invalid_token' });
    }

    // Cache hit?
    const hit = cache.get(token);
    if (hit && Date.now() - hit.cachedAt < TOKEN_CACHE_TTL_MS) {
      if (!hit.row || !isTokenValid(hit.row)) {
        return reply.code(403).send({ error: 'invalid_token' });
      }
      request.shareToken = token;
      request.partnerName = hit.row.partner_name;
      return;
    }

    // No supabase client -- can't validate
    if (!supabase) {
      return reply.code(403).send({ error: 'invalid_token' });
    }

    // Lookup
    let row = null;
    try {
      const { data, error } = await supabase
        .from('share_tokens')
        .select('*')
        .eq('token', token)
        .maybeSingle();
      if (!error) row = data;
    } catch {
      // Treat DB errors as invalid to be safe
    }

    // Populate cache (evict oldest entry if full)
    if (cache.size >= TOKEN_CACHE_MAX) {
      cache.delete(cache.keys().next().value);
    }
    cache.set(token, { row, cachedAt: Date.now() });

    if (!row || !isTokenValid(row)) {
      return reply.code(403).send({ error: 'invalid_token' });
    }

    request.shareToken = token;
    request.partnerName = row.partner_name;
  };
}

function isTokenValid(row) {
  if (row.revoked_at) return false;
  if (row.expires_at && row.expires_at < new Date().toISOString()) return false;
  return true;
}

// ---- recordView (fire-and-forget) ----

/**
 * Insert one row into share_views. Never throws; errors are swallowed
 * so the audit path can never fail an HTTP response.
 *
 * @param {{ supabase: object, token: string, route: string,
 *           episodeId: string|null, ip: string }} opts
 */
export async function recordView({ supabase, token, route, episodeId, ip }) {
  if (!supabase) return;
  try {
    await supabase.from('share_views').insert([{
      token,
      route,
      episode_id: episodeId ?? null,
      ip_truncated: truncateIp(ip ?? ''),
    }]);
  } catch {
    // never block on audit error
  }
}

// ---- registerShareRoutes ----

/**
 * Wire the four public /share/* routes onto the Fastify app.
 * Reuses resolveDigestPath + sendDigestFile from digest.js so the
 * security-critical path logic is never duplicated.
 *
 * @param {object} app
 * @param {{ supabase?: object, cfg?: object }} [opts]
 */
export function registerShareRoutes(app, { supabase, cfg = defaultConfig } = {}) {
  const guard = shareGuard({ supabase });

  const serve = (kind) => async (request, reply) => {
    let abs;
    try {
      abs = resolveDigestPath({ cfg, kind, ...request.params });
    } catch (err) {
      return reply
        .code(err.statusCode ?? 400)
        .send({ error: err.error ?? 'bad_request', message: err.message });
    }

    // Fire-and-forget audit -- never blocks or fails the response
    Promise.resolve()
      .then(() => recordView({
        supabase,
        token: request.shareToken,
        route:  request.url,
        episodeId: request.params.id ?? null,
        ip:    request.ip,
      }))
      .catch(() => {});

    return sendDigestFile(request, reply, abs, { extraHeaders: SHARE_HEADERS });
  };

  app.get('/share/:token/episodes/:id',           { preHandler: guard }, serve('episode'));
  app.get('/share/:token/weekly/:weekTag',         { preHandler: guard }, serve('weekly'));
  app.get('/share/:token/experts/:slug',           { preHandler: guard }, serve('expert'));
  app.get('/share/:token/experts/:slug/:weekTag',  { preHandler: guard }, serve('expertWeek'));
}

// ---- Token management helpers (used by CLI, not HTTP routes) ----

/**
 * Mint a new 256-bit token for a partner. Returns the raw token string.
 * Print it once -- it is the credential.
 */
export async function mintToken({ supabase, partnerName, expiresAt = null, notes = null }) {
  const token = crypto.randomBytes(32).toString('hex');
  const { error } = await supabase.from('share_tokens').insert([{
    token,
    partner_name: partnerName,
    expires_at:   expiresAt ?? null,
    notes:        notes ?? null,
  }]);
  if (error) throw error;
  return token;
}

/**
 * Revoke a token by setting revoked_at = now().
 */
export async function revokeToken({ supabase, token }) {
  const { error } = await supabase
    .from('share_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token', token);
  if (error) throw error;
}

/**
 * List tokens. Pass activeOnly=true to filter expired + revoked.
 */
export async function listTokens({ supabase, activeOnly = false }) {
  const { data, error } = await supabase
    .from('share_tokens')
    .select('*')
    .order('granted_at', { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  if (!activeOnly) return rows;
  const now = new Date().toISOString();
  return rows.filter(r => !r.revoked_at && (!r.expires_at || r.expires_at > now));
}
