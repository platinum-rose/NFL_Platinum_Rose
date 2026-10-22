// supabase/functions/odds-proxy/index.ts
// =============================================================================
// Odds API Proxy — Supabase Edge Function
//
// Proxies requests to api.the-odds-api.com.  The ODDS_API_KEY is stored as a
// Supabase secret and never included in the browser bundle.
//
// Request body:
//   {
//     queryParams: {
//       regions?:    string  (default 'us')
//       markets?:    string  (default 'h2h,spreads,totals')
//       bookmakers?: string
//       oddsFormat?: string  (default 'american')
//     }
//   }
//
// Auth: signed-in user's access token (Authorization: Bearer <jwt>), verified
// via supabase.auth.getUser(); or X-Cron-Secret for server jobs. The public
// anon key alone is rejected with 401 (see ../_shared/auth.ts).
// =============================================================================
// @ts-nocheck — Deno imports; no tsconfig in functions dir
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { verifyCaller, AUTH_CORS_ALLOW_HEADERS } from '../_shared/auth.ts';

const NFL_ODDS_URL =
  'https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': AUTH_CORS_ALLOW_HEADERS,
  // Let the browser read the quota headers (enhancedOddsApi.js tracks them).
  'Access-Control-Expose-Headers': 'x-requests-remaining, x-requests-used',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // Verify caller BEFORE spending Odds API quota.
  const auth = await verifyCaller(req);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const apiKey = Deno.env.get('ODDS_API_KEY');
  if (!apiKey) {
    return json(
      { error: 'ODDS_API_KEY not configured in Supabase secrets' },
      500,
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const qp = (body.queryParams as Record<string, string>) || {};
  const params = new URLSearchParams({
    apiKey,
    regions: qp.regions || 'us',
    markets: qp.markets || 'h2h,spreads,totals',
    oddsFormat: qp.oddsFormat || 'american',
  });
  if (qp.bookmakers) params.set('bookmakers', qp.bookmakers);

  const upstream = await fetch(`${NFL_ODDS_URL}?${params}`);
  const data = await upstream.json();

  // Forward quota header so the browser client can track monthly usage.
  const xRemaining = upstream.headers.get('x-requests-remaining');
  const responseHeaders: Record<string, string> = {
    ...CORS_HEADERS,
    'Content-Type': 'application/json',
  };
  if (xRemaining !== null) {
    responseHeaders['x-requests-remaining'] = xRemaining;
  }
  const xUsed = upstream.headers.get('x-requests-used');
  if (xUsed !== null) {
    responseHeaders['x-requests-used'] = xUsed;
  }

  return new Response(JSON.stringify(data), {
    status: upstream.status,
    headers: responseHeaders,
  });
});
