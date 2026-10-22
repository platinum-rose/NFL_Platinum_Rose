// supabase/functions/ai-proxy/index.ts
// =============================================================================
// AI Proxy — Supabase Edge Function
//
// Routes requests to Anthropic or OpenAI on behalf of the browser client.
// API keys are stored as Supabase secrets and never sent to the browser.
//
// Request body:
//   { provider: 'anthropic' | 'openai', ...providerPayload }
//
// Auth: signed-in user's access token (Authorization: Bearer <jwt>), verified
// via supabase.auth.getUser(); or X-Cron-Secret for server jobs. The public
// anon key alone is rejected with 401 (see ../_shared/auth.ts).
// =============================================================================
// @ts-nocheck — Deno runtime; no tsconfig in functions dir
import { verifyCaller, AUTH_CORS_ALLOW_HEADERS } from '../_shared/auth.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': AUTH_CORS_ALLOW_HEADERS,
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  // Pre-flight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // Verify caller BEFORE touching any paid upstream API.
  const auth = await verifyCaller(req);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { provider, ...payload } = body;

  // ── Anthropic ──────────────────────────────────────────────────────────────
  if (provider === 'anthropic') {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return json({ error: 'ANTHROPIC_API_KEY not configured in Supabase secrets' }, 500);
    }

    // 'anthropic-version' is a HEADER, not a body field — Anthropic rejects
    // unknown top-level keys with HTTP 400, so strip it before forwarding.
    const { ['anthropic-version']: anthropicVersion, ...anthropicBody } = payload;
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': (anthropicVersion as string) || '2023-06-01',
      },
      body: JSON.stringify(anthropicBody),
    });

    const data = await upstream.json();
    return json(data, upstream.status);
  }

  // ── OpenAI ─────────────────────────────────────────────────────────────────
  if (provider === 'openai') {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return json({ error: 'OPENAI_API_KEY not configured in Supabase secrets' }, 500);
    }

    const upstream = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await upstream.json();
    return json(data, upstream.status);
  }

  // ── Google Gemini ──────────────────────────────────────────────────────────
  // payload.model should be e.g. 'gemini-1.5-flash' or 'gemini-1.5-pro'
  // payload.contents is the Gemini messages array (already in Gemini format).
  if (provider === 'gemini') {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return json({ error: 'GEMINI_API_KEY not configured in Supabase secrets' }, 500);
    }
    // `model` belongs in the URL path; Google rejects it as a body field.
    const { model: rawModel, ...geminiBody } = payload;
    const model = (rawModel as string) || 'gemini-1.5-flash';
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody),
      },
    );
    const data = await upstream.json();
    return json(data, upstream.status);
  }

  return json({ error: `Unknown provider: ${provider}` }, 400);
});
