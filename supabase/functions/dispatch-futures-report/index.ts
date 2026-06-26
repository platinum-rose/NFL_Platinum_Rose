// supabase/functions/dispatch-futures-report/index.ts
// =============================================================================
// Dispatch Futures Report — Supabase Edge Function
//
// Triggers the "Futures Intel Report" GitHub Actions workflow via workflow_dispatch
// so the Futures-tab "Regenerate" button can rebuild the report on demand.
// The GitHub PAT is stored as a Supabase secret and never reaches the browser.
//
// Request body:  { trigger?: string, season?: number|string }
// Response:      { ok: true, status } | { error }
//
// Required Supabase secrets:
//   GITHUB_DISPATCH_TOKEN  — fine-grained PAT with Actions: read/write on the repo
// Optional secrets (have sensible defaults):
//   GITHUB_REPO            — "owner/name"   (default platinum-rose/NFL_Platinum_Rose)
//   GITHUB_WORKFLOW_FILE   — workflow filename (default futures-intel-report.yml)
//   GITHUB_REF             — git ref to run on (default main)
//
// Deploy:  supabase functions deploy dispatch-futures-report
// Secret:  supabase secrets set GITHUB_DISPATCH_TOKEN=ghp_xxx
// =============================================================================
// @ts-nocheck — Deno runtime; no tsconfig in functions dir

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const token = Deno.env.get('GITHUB_DISPATCH_TOKEN');
  if (!token) return json({ error: 'GITHUB_DISPATCH_TOKEN not configured in Supabase secrets' }, 500);

  const repo     = Deno.env.get('GITHUB_REPO') || 'platinum-rose/NFL_Platinum_Rose';
  const workflow = Deno.env.get('GITHUB_WORKFLOW_FILE') || 'futures-intel-report.yml';
  const ref      = Deno.env.get('GITHUB_REF') || 'main';

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty body is fine */ }

  const trigger = typeof body.trigger === 'string' ? body.trigger : 'on_demand_ui';
  const season  = body.season != null ? String(body.season) : '2026';

  const url = `https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`;
  const upstream = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'nfl-dashboard-dispatch',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ref, inputs: { trigger, season, dry_run: false } }),
  });

  // GitHub returns 204 No Content on success.
  if (upstream.status === 204) return json({ ok: true, status: 204, repo, workflow, ref });

  const text = await upstream.text();
  return json({ error: `GitHub dispatch failed (HTTP ${upstream.status})`, detail: text.slice(0, 500) }, upstream.status === 404 ? 404 : 502);
});
