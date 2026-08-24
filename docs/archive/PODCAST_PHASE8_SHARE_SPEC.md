# Podcast Pipeline — Phase 8: Signed `/share/*` Partner Surface

> **Status:** Specced (not built) | **Author:** PM | **Date:** 2026-06-03
> **Unblocks:** Phase 7b Share action (`PodcastDigestTab.jsx`)
> **Spec source:** `/memories/repo/nfl-podcast-pipeline-spec.md` §3 Phase 8
> **Service:** `packages/m6-podcast-service/`

---

## 1. Purpose

Phase 7a renders static digest HTML to `/var/lib/nfl/digest/` and Phase 7's
`/digest/*` routes serve it **Tailscale-only** (private, operator + tailnet).

Phase 8 adds a **public, internet-reachable** read-only window into that same
digest content for a small set of named partners (Patrick, Amanda, + up to 3
others), exposed through **Tailscale Funnel**, gated by a **revocable token**,
and **audit-logged** per view.

It is the one surface in the M6 service intentionally reachable off-tailnet, so
it carries the strictest security posture in the project.

---

## 2. What Already Exists (do not rebuild)

| Asset | Location | State |
|-------|----------|-------|
| `share_tokens` table | `supabase/migrations/023_podcast_pipeline_v2.sql` §3 | ✅ defined (pending prod push) |
| `share_views` audit table | `023` §4 | ✅ defined (pending prod push) |
| `/share/*` route stub | `packages/m6-podcast-service/src/app.js:101-104` | returns `501 { phase: 8 }` |
| 501-stub test | `test/server.test.js` "Phase 7/8/3 stubs return 501" | ✅ green — **must be updated in Phase 8** |
| HMAC pattern (machine auth) | `src/hmac.js` | ✅ reused conceptually, **not** for `/share/*` |
| Digest HTML output dir | `config.digestDir` (`/var/lib/nfl/digest/`) | Phase 7a writes here |

### `share_tokens` schema (from migration 023)

```
token         text        primary key          -- the credential the partner holds
partner_name  text        not null             -- 'Patrick', 'Amanda', ...
granted_at    timestamptz not null default now()
expires_at    timestamptz                       -- NULL = no expiry
revoked_at    timestamptz                       -- non-NULL = dead
notes         text
```
RLS: **no** public-read policy → service_role only. Anon key cannot read it.

### `share_views` schema

```
id           uuid pk
token        text  → share_tokens(token) on delete cascade
route        text                                 -- '/share/<token>/episodes/<id>'
episode_id   uuid  → podcast_episodes(id) on delete set null
viewed_at    timestamptz default now()
ip_truncated text                                  -- /24 IPv4, /48 IPv6
```
RLS: service_role only.

---

## 3. Design Decision — Token Model

Three models were considered. **Decision: Model A (table-backed opaque tokens).**

| | A. Table-backed opaque token | B. Stateless HMAC-signed URL | C. Supabase Auth session |
|---|---|---|---|
| Revocable | ✅ set `revoked_at` | ❌ needs a denylist anyway | ✅ |
| Expiry | ✅ `expires_at` | ✅ embedded `exp` | ✅ |
| Per-partner identity / audit | ✅ `partner_name` | ❌ anonymous | ✅ |
| Matches 023 schema | ✅ exactly | ❌ schema unused | ❌ |
| Partner UX | bookmark one URL, works all season | URL dies on `exp`, re-issue churn | partner must create an account |
| Complexity | low | low | high (auth UI, RLS) |

**Chosen: A.** It is the only model the existing `share_tokens`/`share_views`
schema supports, it gives revocation + per-partner audit (mandatory for an
off-tailnet surface), and partners get a durable bookmark. "Signed" in the 7b
handoff is satisfied by the token being a 256-bit secret credential, not a
guessable id.

> Model B is kept in reserve as an optional add-on (`/share/s/<payload>.<sig>`)
> for one-off, self-expiring links if ever needed. **Not in Phase 8 scope.**

---

## 4. URL Shape

Token lives in the **path**, not the query string (avoids `Referer`-header
leakage and keeps the digest pages' relative links inside the token namespace):

```
https://<funnel-host>/share/<token>/episodes/<episodeId>
https://<funnel-host>/share/<token>/weekly/<season>-W<week>
https://<funnel-host>/share/<token>/experts/<slug>
https://<funnel-host>/share/<token>/experts/<slug>/<season>-W<week>
```

These mirror the Phase 7 `/digest/*` targets one-to-one. The `<funnel-host>` is
the Tailscale Funnel hostname (e.g. `m6-box.tailXXXX.ts.net`).

---

## 5. Server Implementation (`packages/m6-podcast-service/`)

### 5.1 New module: `src/share.js`

- `shareGuard({ supabase })` — Fastify `preHandler`:
  1. Extract `:token` from the path.
  2. Look it up in `share_tokens` (service-role client), with a small in-process
     LRU/TTL cache (≤60 s) to blunt repeated lookups and enumeration.
  3. Reject → `403 { error: 'invalid_token' }` if: not found, `revoked_at != null`,
     or `expires_at < now()`. **Same 403 body for all three** (no oracle).
  4. On success: attach `request.partner_name` + `request.shareToken`.
- `recordView({ supabase, token, route, episodeId, ip })` — fire-and-forget
  insert into `share_views`; **never** block or fail the response on audit error
  (log + continue). IP truncated to /24 (IPv4) or /48 (IPv6) before insert.
- `mintToken` / `revokeToken` / `listTokens` helpers (service-role) used by the
  CLI in §6 — not exposed over HTTP.

### 5.2 Route handlers (`src/app.js` — replace the `/share/*` 501 stub)

```
app.get('/share/:token/episodes/:id',            { preHandler: shareGuard(...) }, serveDigest('episodes'))
app.get('/share/:token/weekly/:weekTag',         { preHandler: shareGuard(...) }, serveDigest('weekly'))
app.get('/share/:token/experts/:slug',           { preHandler: shareGuard(...) }, serveDigest('experts'))
app.get('/share/:token/experts/:slug/:weekTag',  { preHandler: shareGuard(...) }, serveDigest('expertWeek'))
```

`serveDigest(kind)` — **reuses the shared resolver from Phase 7 serving, does not
re-implement it.** Import `resolveDigestPath` + `sendDigestFile` from
`src/digest.js` (created in Phase 7 serving, spec
`docs/PODCAST_PHASE7_SERVING_SPEC.md` §5/§6). The param-validation patterns
(`id`/`slug`: `^[a-z0-9-]{1,64}$`, `weekTag`: `^\d{4}-W\d{1,2}$`), the
`digestDir` containment assertion, and the 404-if-missing read all live there so
Phase 7 and Phase 8 cannot diverge on the security-critical path logic.

Phase 8 adds only its own layers:

```js
const serveDigest = (kind) => async (req, reply) => {
  const abs = resolveDigestPath({ cfg: config, kind, ...req.params }); // shared 400 guard
  await recordView({ supabase, token: req.shareToken, route: req.url,
                     episodeId: req.params.id, ip: req.ip });          // fire-and-forget
  return sendDigestFile(reply, abs, { extraHeaders: SHARE_HEADERS });  // §5.3 headers
};
```

- `shareGuard` preHandler (§5.1) runs first — token auth.
- `recordView(...)` audit (never blocks the response).
- `SHARE_HEADERS` (§5.3) override the private defaults: `X-Robots-Tag`,
  `Referrer-Policy: no-referrer`, `Cache-Control: private, no-store`.

> If `src/digest.js` is not yet built when Phase 8 starts, build Phase 7 serving
> first — it is the smaller, dependency-free piece and Phase 8 sits directly on it.

### 5.3 Response headers (all `/share/*` responses)

```
Content-Type:  text/html; charset=utf-8
Cache-Control: private, no-store
X-Robots-Tag:  noindex, nofollow          # keep partner pages out of search
Referrer-Policy: no-referrer
```

### 5.4 What `/share/*` MUST NOT expose

- No `/api/transcript/:id` (full transcript stays Tailscale-only).
- No audio files.
- No `/ingest/*`, no run status, no `share_tokens` listing.
- Only the **already-rendered** Phase 7a HTML — which itself must omit any
  internal-only fields (raw confidence/units handling is a Phase 7a render
  decision; Phase 8 serves whatever 7a wrote).

---

## 6. Token Management (operator CLI — service-role only)

New script: `packages/m6-podcast-service/scripts/share-token.js`

```bash
node scripts/share-token.js mint   --partner "Patrick" [--expires 2026-09-01] [--notes "season pass"]
node scripts/share-token.js list   [--active]
node scripts/share-token.js revoke --token <token>
```

- `mint` → `crypto.randomBytes(32).toString('hex')` (256-bit), insert row, print
  the **full Funnel URL base + token** for the operator to send to the partner.
- Uses `SUPABASE_SERVICE_ROLE_KEY` from `/etc/nfl-podcast.env`.
- Tokens are shown **once** at mint time (they are the credential).

---

## 7. Tailscale Funnel Exposure (deploy)

Only `/share/*` is funneled to the public internet. Everything else
(`/digest/*`, `/ingest/*`, `/api/*`, `/health`) stays on `tailscale serve`
(tailnet-private). The service still binds `127.0.0.1:5060`; Tailscale fronts TLS.

```bash
# Private (tailnet only) — full service:
tailscale serve --bg --https=443 http://127.0.0.1:5060

# Public (Funnel) — share subtree ONLY:
tailscale funnel --bg --set-path /share http://127.0.0.1:5060/share
tailscale funnel status     # confirm only /share is public
```

> If path-scoped Funnel is unavailable on the installed Tailscale version, fall
> back to a dedicated Funnel port that a reverse-proxy maps to `/share/*` only.
> Document whichever is used in `packages/m6-podcast-service/README.md`.

Add to README troubleshooting: a Funnel 502 = service down; a 403 on a known-good
token = clock skew on `expires_at` or token revoked.

---

## 8. Phase 7b Contract (the unblock)

This is the concrete interface `PodcastDigestTab.jsx` codes against so 7b is no
longer half-blocked.

**The SPA does NOT mint tokens** (it holds only the Supabase anon key;
`share_tokens` is service-role-only). Token minting is operator-side (§6).

The SPA builds the share URL purely by **string composition** from two
runtime-config values:

| Config key | Source | Example |
|------------|--------|---------|
| `VITE_M6_FUNNEL_BASE` | build/runtime env | `https://m6-box.tailXXXX.ts.net` |
| share token | runtime config on the trusted host (NOT committed, NOT in the JS bundle) — e.g. injected `window.__NFL_SHARE_TOKEN__`, or a `/config.js` served from the same private origin | `a1b2…` (64 hex) |

Share-button behavior:

```js
const base  = import.meta.env.VITE_M6_FUNNEL_BASE;
const token = window.__NFL_SHARE_TOKEN__;            // runtime-injected
function shareUrl(kind, ...parts) {
  // kind: 'episodes' | 'weekly' | 'experts'
  return `${base}/share/${token}/${kind}/${parts.join('/')}`;
}
// onClick → navigator.clipboard.writeText(shareUrl('episodes', episodeId))
```

- If `base` **or** `token` is missing → the Share control is **disabled** with
  tooltip: *"Configure a share token on M6 (Phase 8 §6) to enable sharing."*
  7b ships fully functional (list + open digest) regardless; Share simply
  light-switches on once a token is configured.
- 7b must **never** read or display the token value in the UI beyond embedding
  it in the copied URL.

This contract lets 7b ship its full surface now; the Share button activates the
moment Phase 8 + a minted token land — no 7b rework required.

---

## 9. Tests (Phase 8 acceptance)

Extend `packages/m6-podcast-service/test/server.test.js` (and a new
`test/share.test.js`):

1. **Remove** `/share/episodes/abc` from the "stubs return 501" `it.each` list.
2. Valid active token + existing digest file → `200`, `text/html`, body served,
   `X-Robots-Tag: noindex` present.
3. Unknown token → `403 invalid_token`.
4. Revoked token (`revoked_at` set) → `403 invalid_token`.
5. Expired token (`expires_at` in past) → `403 invalid_token` (identical body to #3/#4).
6. Valid token, missing digest file → `404`.
7. Path-traversal attempt (`/share/<tok>/episodes/..%2f..%2fetc`) → `400`, never
   escapes `digestDir`.
8. A successful view writes one `share_views` row with truncated IP (assert via
   mocked Supabase).
9. `share-token.js`: mint creates a row + prints URL; revoke sets `revoked_at`;
   list filters `--active`.

Use the existing test pattern: inject a fake service-role Supabase client into
`buildServer({ supabase })` so tests run offline on Windows dev.

---

## 10. Sequencing & Dependencies

```
023 migration (prod push)  ─┐
Phase 7a (digest renderer) ─┼─→ Phase 8 (this) ─→ 7b Share button activates
                            ┘
```

- **Hard dep:** migration `023` must be applied in prod (`supabase db push`)
  before `share_tokens` lookups work. Already tracked as a pending manual action.
- **Hard dep:** Phase 7a must be writing files to `digestDir`, or every
  `/share/*` hit 404s (token auth still testable independently with fixture files).
- **Soft dep:** 7b can be built in parallel against the §8 contract; its Share
  control stays disabled until Phase 8 ships + a token is minted.

---

## 11. Out of Scope (explicit)

- Stateless signed one-off links (Model B) — reserved, not built.
- Partner self-service account creation (Model C).
- Rate-limiting beyond the §5.1 lookup cache (rely on Funnel + revocation; add
  a token-bucket later if abuse is observed).
- Any write capability for partners — `/share/*` is strictly read-only.
```

