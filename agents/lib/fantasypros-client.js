// agents/lib/fantasypros-client.js
// Shared FantasyPros v2 public API client — auth header, base URL, timeout.
// No I/O side effects beyond the fetch itself; safe to import from tests.
//
// Used by all four FantasyPros integration pieces (ADP, weekly rankings, Phase B
// projections, injuries — see docs/FANTASYPROS_API_INTEGRATION_SCOPE_2026-08-09.md).
// Free limited public API tier confirmed live 2026-08-09 against Andy's real key.
//
// Known API quirk (confirmed live): some invalid-parameter cases return HTTP 200
// with a `{message, parameter, valid_format}` body instead of a 4xx (e.g.
// position=ALL on /consensus-rankings) — this client does NOT special-case that,
// since the expected success shape differs per endpoint (`players` vs `injuries`
// vs ...). Callers must check `data.message` themselves before trusting the
// expected array field is present (see agents/lib/fantasypros-adp.js's caller).

const BASE_URL = 'https://api.fantasypros.com/public/v2/json';

export class FantasyProsError extends Error {
  constructor(message, { status, url } = {}) {
    super(message);
    this.name = 'FantasyProsError';
    this.status = status;
    this.url = url;
  }
}

export async function fantasyProsGet(pathname, { apiKey, params = {}, timeoutMs = 20_000 } = {}) {
  const key = apiKey || process.env.FANTASYPROS_API_KEY;
  if (!key) throw new FantasyProsError('Missing FANTASYPROS_API_KEY (see .env.example)');

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  }
  const url = `${BASE_URL}${pathname}${qs.toString() ? `?${qs.toString()}` : ''}`;

  const res = await fetch(url, {
    headers: { 'x-api-key': key },
    signal: AbortSignal.timeout(timeoutMs),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new FantasyProsError(`FantasyPros response wasn't valid JSON (HTTP ${res.status})`, { status: res.status, url });
  }

  if (!res.ok) {
    throw new FantasyProsError(data?.message || `HTTP ${res.status}`, { status: res.status, url });
  }
  return data;
}
