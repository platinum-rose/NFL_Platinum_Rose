// supabase/functions/_shared/auth.ts
// =============================================================================
// Caller verification for paid-API edge functions (ATLAS spec 2026-10-20 §1C).
//
// Supabase's gateway-level verify_jwt only proves the caller holds *a* JWT for
// this project — and the public anon key (bundled into the GitHub Pages site)
// IS such a JWT. So anyone who scrapes the bundle could spend our Anthropic /
// OpenAI / Gemini / Odds API credits or fire GitHub workflows. This helper
// requires one of:
//   1. Authorization: Bearer <user access token>  → supabase.auth.getUser()
//      must resolve to a real signed-in user (the anon key does NOT).
//   2. X-Cron-Secret: <CRON_SECRET>               → server/cron callers.
//   3. Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY> → trusted server code.
// Anything else → 401.
//
// Optional secret: ALLOWED_USER_EMAILS (comma-separated) — when set, only these
// signed-in users are accepted (single-owner lock).
// =============================================================================
// @ts-nocheck — Deno runtime; no tsconfig in functions dir
import { createClient } from 'jsr:@supabase/supabase-js@2';

export const AUTH_CORS_ALLOW_HEADERS =
  'authorization, x-client-info, apikey, content-type, x-cron-secret';

function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type AuthResult =
  | { ok: true; kind: 'user' | 'cron' | 'service'; userId?: string; email?: string }
  | { ok: false; status: number; error: string };

export async function verifyCaller(req: Request): Promise<AuthResult> {
  const cronSecret = Deno.env.get('CRON_SECRET');
  const presentedCron = req.headers.get('x-cron-secret');
  if (cronSecret && presentedCron && timingSafeEqual(presentedCron, cronSecret)) {
    return { ok: true, kind: 'cron' };
  }

  const authHeader = req.headers.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  if (!match) return { ok: false, status: 401, error: 'Unauthorized: missing bearer token' };
  const token = match[1].trim();

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (serviceKey && timingSafeEqual(token, serviceKey)) return { ok: true, kind: 'service' };

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !anonKey) return { ok: false, status: 500, error: 'SUPABASE_URL / SUPABASE_ANON_KEY not available to function' };
  if (timingSafeEqual(token, anonKey)) {
    return { ok: false, status: 401, error: 'Unauthorized: sign in required (anon key is not accepted)' };
  }

  try {
    const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user) return { ok: false, status: 401, error: 'Unauthorized: invalid or expired session' };
    const allow = (Deno.env.get('ALLOWED_USER_EMAILS') || '')
      .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const email = (data.user.email || '').toLowerCase();
    if (allow.length && !allow.includes(email)) {
      return { ok: false, status: 403, error: 'Forbidden: user not allowed' };
    }
    return { ok: true, kind: 'user', userId: data.user.id, email };
  } catch (_e) {
    return { ok: false, status: 401, error: 'Unauthorized: token verification failed' };
  }
}
