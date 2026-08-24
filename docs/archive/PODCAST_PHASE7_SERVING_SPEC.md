# Podcast Pipeline — Phase 7 (serving): `/digest/*` Tailscale-only routes

> **Status:** Specced (not built) | **Author:** PM | **Date:** 2026-06-03
> **Sits between:** Phase 7a (writes the files) and 7b (opens them) + Phase 8 (token-gates the same files)
> **Spec source:** `/memories/repo/nfl-podcast-pipeline-spec.md` §3 Phase 7
> **Service:** `packages/m6-podcast-service/`

---

## 1. Purpose

Un-stub the four `/digest/*` routes in `src/app.js` so M6 actually **serves** the
static HTML that Phase 7a writes to `config.digestDir`. This is the thin HTTP
layer that turns "files on disk" into "pages 7b can `window.open`."

`/digest/*` is **Tailscale-only** (private — operator + tailnet). It is *not* the
public surface; that is Phase 8 `/share/*` (Funnel + token). The two serving
layers read the **same** files; their only differences are auth, audit, headers,
and the URL `.html` suffix (§9).

What this phase is **not**: it does not render, aggregate, or query Supabase. It
reads bytes off disk and returns them. If 7a hasn't written the file, it 404s.

---

## 2. What Already Exists (do not rebuild)

| Asset | Location | State |
|-------|----------|-------|
| `/digest/*` route stubs | `src/app.js:90-99` → `501 { phase: 7 }` | **replace in this phase** |
| Stub test | `test/server.test.js` "Phase 7/8/3 stubs return 501" `it.each` (lines 208-218) | lists `/digest/episodes/abc.html` + `/digest/experts/sharp.html` — **remove both here** |
| Output dir | `config.digestDir` = `/var/lib/nfl/digest/` | ✅ 7a writes here |
| On-disk filename contract | 7a §3.4 | ✅ source of truth for paths |
| `127.0.0.1` bind + Tailscale | `config.host`, deploy runbook | ✅ network gate, no app auth needed |
| DI test seam | `buildServer(opts)` | ✅ reuse — inject `cfg` override for a tmp `digestDir` |

### On-disk paths this phase resolves (from 7a §3.4)

```
<digestDir>/episodes/<id>.html
<digestDir>/experts/<slug>.html
<digestDir>/experts/<slug>/<season>-W<week>.html
<digestDir>/weekly/<season>-W<week>.html
```

---

## 3. Design Decisions

### 3.1 Manual file read, **not** `@fastify/static`

Read the resolved file with `fs.readFile` behind strict param validation rather
than mounting `@fastify/static` on `digestDir`. Rationale:

- **No new dependency** — keeps the package's Fastify-only posture.
- **Security-critical path control:** we must validate params against fixed
  patterns *before* touching the FS and assert containment inside `digestDir`.
  A static-file middleware that auto-maps URL→path is exactly the traversal
  surface we want to avoid for a service that gets funneled in Phase 8.
- **Phase 8 reuse:** Phase 8 needs custom logic around the same read (token,
  audit, robots headers). A shared resolver (§9) is cleaner than wrapping a
  static plugin.

### 3.2 One shared resolver module — `src/digest.js` (the DRY seam)

The path-validation + safe-read logic is **security-critical and must not be
duplicated** between Phase 7 and Phase 8 (Phase 8 §5.2 currently sketches its own
`serveDigest`). This phase creates `src/digest.js` as the single source of truth;
Phase 8 imports it and layers auth/audit on top. If the containment check ever
needs hardening, it changes in exactly one place.

### 3.3 Network is the only gate for `/digest/*`

`/digest/*` carries **no** application-level auth. Its security boundary is the
network: the service binds `127.0.0.1`, and only `tailscale serve` (tailnet,
private) fronts it. **`/digest/*` must never be added to `tailscale funnel`** —
that is the explicit, public-only job of `/share/*` (Phase 8 §7). This is called
out as a deploy guardrail in §8.

### 3.4 The `.html` suffix lives in the route, the file is the same

`/digest/episodes/:id.html` → on-disk `episodes/<id>.html`. Phase 8's
`/share/<token>/episodes/:id` (no suffix) maps to the **same** file. The resolver
takes the **bare** key (`id`/`slug`/`weekTag`) and appends `.html` itself, so
both serving layers feed it identical inputs and the suffix is purely a
URL-shape choice (reconciles 7a §3.4).

---

## 4. Module Layout

```
packages/m6-podcast-service/
├── src/
│   ├── digest.js   # NEW — resolveDigestPath(), sendDigestFile(), registerDigestRoutes()
│   └── app.js      # replace the 4 `/digest/*` 501 stubs with registerDigestRoutes(app,{cfg})
└── test/
    └── digest.test.js   # NEW — serving + traversal tests (offline, Windows-friendly)
```

---

## 5. `src/digest.js` API

```js
// Bad param shape → throws { statusCode: 400 }; never reaches the FS.
// kind: 'episode' | 'expert' | 'expertWeek' | 'weekly'
export function resolveDigestPath({ cfg, kind, id, slug, weekTag }) { /* → absolute path */ }

// Reads the resolved file; 404 if absent; sets headers; supports conditional GET.
// extraHeaders lets Phase 8 add X-Robots-Tag / Referrer-Policy without forking this.
export async function sendDigestFile(reply, absPath, { extraHeaders } = {}) { /* → reply */ }

// Wires the 4 Tailscale-only GET routes onto the app.
export function registerDigestRoutes(app, { cfg = config } = {}) { /* ... */ }
```

### 5.1 Routes wired by `registerDigestRoutes`

| Route | kind | Resolves to |
|-------|------|-------------|
| `GET /digest/episodes/:id.html` | `episode` | `episodes/<id>.html` |
| `GET /digest/experts/:slug.html` | `expert` | `experts/<slug>.html` |
| `GET /digest/experts/:slug/:weekTag.html` | `expertWeek` | `experts/<slug>/<weekTag>.html` |
| `GET /digest/weekly/:weekTag.html` | `weekly` | `weekly/<weekTag>.html` |

Each handler: `resolveDigestPath(...)` (400 on bad param) → `sendDigestFile(...)`
(404 if not yet rendered, else 200 HTML). No Supabase, no auth preHandler.

> **Fastify routing note:** `:id.html` parses `id` as the param with `.html` as a
> static suffix (find-my-way). The `id`/`slug` patterns exclude `.`, so the param
> never swallows the extension. Verify with the §10 tests.

### 5.2 `app.js` change

Delete the `for (const path of [...]) { ... 501 ... }` block (lines 90-99) and
replace with:

```js
import { registerDigestRoutes } from './digest.js';
// ...
registerDigestRoutes(app, { cfg: opts.cfg ?? config });  // Tailscale-only — Phase 7
```

Pass `cfg` through `buildServer(opts)` (default `config`) so tests inject a tmp
`digestDir`. The `/share/*` 501 stub (line 102-104) stays untouched until Phase 8.

---

## 6. Path validation & traversal defense (the load-bearing part)

Inside `resolveDigestPath`, **before** any FS call:

1. Validate each param against a fixed pattern (identical to Phase 8 §5.2 and 7a
   `slugify`):
   - `id` / `slug`: `^[a-z0-9-]{1,64}$`
   - `weekTag`: `^\d{4}-W\d{1,2}$`
   - Anything else → throw `{ statusCode: 400, error: 'bad_request' }`.
2. Build the candidate: `path.join(cfg.digestDir, kind-subdir, key + '.html')`.
3. **Containment assertion:** `const abs = path.resolve(candidate)` then assert
   `abs === candidate` **and** `abs.startsWith(path.resolve(cfg.digestDir) + path.sep)`.
   If not → `400`. Defense-in-depth even though step 1 already excludes `/` `.` `\`.

No user-supplied string is ever concatenated into a path without passing step 1.
This is the same guard Phase 8 funnels publicly, so it is tested explicitly (§10).

---

## 7. Response headers & caching

`sendDigestFile` sets, for `/digest/*`:

```
Content-Type:           text/html; charset=utf-8
X-Content-Type-Options: nosniff
Cache-Control:          no-cache          # revalidate; 7a re-renders frequently
```

**Conditional GET (recommended):** compute a weak `ETag` from the file
`mtimeMs` + `size`; honor `If-None-Match` → `304`. 7b reopens digest pages often;
this avoids resending unchanged HTML over the tailnet. Cheap via `fs.stat`.

> Phase 8 calls `sendDigestFile` with `extraHeaders` adding
> `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: no-referrer`, and
> `Cache-Control: private, no-store` (overrides the above) — public pages must
> not be indexed or cached by intermediaries.

---

## 8. Network exposure (deploy)

`/digest/*` rides the existing private `tailscale serve` mapping — no new deploy
step beyond what `/health` and `/ingest/*` already use:

```bash
tailscale serve --bg --https=443 http://127.0.0.1:5060   # tailnet-private, full service
```

> **Guardrail:** `/digest/*` must **NOT** appear under `tailscale funnel`. Only
> `/share/*` is funneled (Phase 8 §7). A reviewer should confirm `tailscale
> funnel status` shows only `/share` after Phase 8 ships. Funneling `/digest/*`
> would expose un-tokened, un-audited digest pages publicly.

---

## 9. Phase 8 reuse contract (prevents divergent security logic)

Phase 8 `serveDigest(kind)` is **defined in terms of this module**, not a fork:

```js
// Phase 8 src/share.js
const serveDigest = (kind) => async (req, reply) => {
  const abs = resolveDigestPath({ cfg, kind, ...req.params });  // shared 400 guard
  await recordView({ supabase, token: req.shareToken, route: req.url,
                     episodeId: req.params.id, ip: req.ip });   // fire-and-forget
  return sendDigestFile(reply, abs, { extraHeaders: SHARE_HEADERS });
};
```

So Phase 7 (this phase) owns the param patterns, the containment assertion, and
the file read; Phase 8 owns only the `shareGuard` preHandler, the `recordView`
audit, and the share-only headers. **Action:** Phase 8 §5.2 is annotated to
import `resolveDigestPath`/`sendDigestFile` rather than redefine them.

---

## 10. Tests (`test/digest.test.js` + amend `server.test.js`)

Inject `buildServer({ cfg: { ...config, digestDir: <tmpdir> } })`; pre-write a
known `episodes/<id>.html` fixture into the tmp dir. Offline, Windows-friendly.

1. **Amend** `server.test.js` "stubs return 501": remove
   `/digest/episodes/abc.html` and `/digest/experts/sharp.html` from the
   `it.each` list (they now serve, not 501). Leave `/share/*` + `/api/transcript`.
2. Existing fixture file → `200`, `text/html; charset=utf-8`, body == file bytes.
3. Missing file (valid params, nothing rendered) → `404`.
4. Bad param shapes → `400`: `episodes/Bad_Id.html` (underscore/uppercase),
   `weekly/2026-WX.html`, `experts/a/2026-13.html` (no `W`).
5. **Traversal:** `/digest/episodes/..%2f..%2fetc%2fpasswd.html` (and `%2e%2e`
   variants) → `400`, never reads outside `digestDir`. Load-bearing.
6. `:id.html` param parsing: a UUID id (`...-....-....-....-............`) resolves
   to `episodes/<uuid>.html`, param does not include `.html`.
7. `expertWeek` two-param route resolves `experts/<slug>/<weekTag>.html`.
8. Conditional GET (if implemented): second request with matching `If-None-Match`
   → `304`, empty body.
9. No auth header required (Tailscale-only) — request with no headers still `200`.

---

## 11. Sequencing & Dependencies

```
Phase 7a (files on disk) ──→ Phase 7 serving (this) ──┬─→ 7b opens /digest/* pages
                                                      └─→ Phase 8 reuses resolver + adds /share/*
```

- **Hard dep:** 7a must be writing files, or every route 404s. (Serving is
  independently testable now via fixture files — does not block on 7a landing.)
- **Hard dep:** `config.digestDir` exists + readable by the service user.
- **Soft dep:** none. Ships before Phase 8 and gives 7b its open-target.
- **Enables:** Phase 8 — once `src/digest.js` exists, Phase 8 is auth + audit + a
  funnel mapping, not a second file-server.

---

## 12. Out of Scope (explicit)

- Tokens, audit, Funnel — all Phase 8.
- Rendering / Supabase / aggregation — all Phase 7a.
- An episodes index/landing page — 7b lists from Supabase (anon) directly.
- Compression / `@fastify/compress` — tailnet HTML is small; revisit only if a
  weekly cross-expert page grows large.
- Range requests / partial content — HTML pages, not media; not needed.
