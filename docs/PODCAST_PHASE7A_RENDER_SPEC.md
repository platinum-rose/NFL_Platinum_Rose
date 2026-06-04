# Podcast Pipeline — Phase 7a: Static Digest Renderer (M6)

> **Status:** Specced (not built) | **Author:** PM | **Date:** 2026-06-03
> **Unblocks:** Phase 7b (digest pages to open), Phase 7c (brief content), Phase 8 (files to serve)
> **Spec source:** `/memories/repo/nfl-podcast-pipeline-spec.md` §3 Phase 7
> **Service:** `packages/m6-podcast-service/`

---

## 1. Purpose

Phase 7a is the **render layer**: it turns the picks/intel that Phase 4 already
wrote to Supabase into **static, self-contained HTML pages** on M6's disk under
`config.digestDir` (`/var/lib/nfl/digest/`).

It is the true critical-path blocker for the rest of Phase 7+:

- **7b** opens these pages (`window.open(M6_BASE + /digest/...)`).
- **7c** has nothing to summarize until episodes render.
- **Phase 8** `serveDigest()` 404s on every request until files exist on disk.

7a **only writes files**. Serving them is Phase 7's `/digest/*` routes
(Tailscale-only) and Phase 8's `/share/*` routes (Funnel). The renderer never
touches HTTP, auth, or Fastify.

---

## 2. What Already Exists (do not rebuild)

| Asset | Location | State |
|-------|----------|-------|
| Pick/intel data | `podcast_transcripts.picks` (JSONB) + `.intel` | ✅ Phase 4 writes it |
| Episode metadata | `podcast_episodes` (title, pub_date, status, is_partial, duration_secs) | ✅ |
| Expert identity | `podcast_feeds.expert` + `.name` | ✅ |
| Output dir | `config.digestDir` = `/var/lib/nfl/digest/` | ✅ defined, created in deploy runbook |
| `/digest/*` route stubs | `src/app.js:90-99` → `501 { phase: 7 }` | replaced in **Phase 7 (serving)**, not 7a |
| Run lifecycle | `runRegistry.startRun()` resolves a promise chain on `done` | ✅ hook point for re-render |
| DI test pattern | `buildServer({supabase})`, `buildPhase4Worker({runner,cfg})` | ✅ reuse for `buildRenderer({supabase,cfg})` |
| Supabase query helpers | `src/lib/supabase.js` (SPA, anon) | reference only — **renderer uses service-role**, not this file |

### Pick shape the renderer consumes (Phase 4 / migration 023 v2)

```jsonc
{
  "category": "spread|total|moneyline|future|prop",
  "subject": "KC",
  "subject_market": null,
  "selection": "KC" | "UNDER",
  "team1": "KC",
  "team2": "LV",
  "line": -3.5,
  "odds_american": null,
  "summary": "Mahomes home; LV pass rush hurt",
  "units": 2,
  "confidence": 0.78,
  "quality_score": 0.74,          // added by quality_gate
  "needs_review": false,          // added by quality_gate
  "week": 5,                      // optional; present on some picks
  "season": 2026                  // optional
}
```

`intel` is a flat array of short factual strings (`["LV pass rush degraded", ...]`).

---

## 3. Design Decisions

### 3.1 Data source — read from Supabase, not from `run.result`

The renderer pulls from Supabase (service-role) rather than the single run's
extractor payload. Rationale:

- **Idempotent full rebuild** (Phase 5 "vault rebuild" requirement): one command
  re-renders everything from the source of truth.
- An expert/weekly page aggregates **many** episodes — a single run's payload is
  insufficient.
- Re-runs / re-grades of old episodes stay correct without replaying runs.

The single-run `done` hook (§6) is just an **incremental** optimization that
re-renders the pages touched by *that* episode; it calls the same render
functions with a narrowed query.

### 3.2 Templating — zero new runtime deps, escaped template literals

No Handlebars/EJS. Use plain tagged template literals with a mandatory
`esc()` HTML-escaper. Rationale:

- These pages are served **to the public** via Phase 8. Stored XSS from a
  podcast transcript into a partner's browser is the headline risk. A single
  `esc()` choke point on every interpolation is simpler to audit than a
  template engine's auto-escape config.
- "No client JS dependency; static HTML only" (handoff 7a requirement) — template
  literals emit exactly that.
- Keeps `packages/m6-podcast-service` dependency surface minimal (matches the
  Fastify-only posture today).

`esc()` escapes `& < > " '`. **Every** dynamic value passes through it — pick
summaries, intel bullets, expert names, team codes. No exceptions.

### 3.3 Atomic writes

Write to `*.tmp` then `fs.rename` into place. A partner mid-request must never
read a half-written file. `rename` is atomic on the same filesystem.

### 3.4 On-disk filename contract (the Phase 8 / Phase 7 interface)

The renderer writes exactly these paths under `digestDir`:

```
<digestDir>/episodes/<id>.html
<digestDir>/experts/<slug>.html
<digestDir>/experts/<slug>/<season>-W<week>.html
<digestDir>/weekly/<season>-W<week>.html
```

> **Reconciliation note:** Phase 7 `/digest/*` routes use a `.html` suffix in
> the URL (`/digest/episodes/:id.html`); the Phase 8 `/share/*` URLs omit it
> (`/share/<token>/episodes/<id>`). **Both serving layers map their path param
> to the same on-disk `<id>.html` file** — the suffix is a URL-shape choice, not
> a second set of files. 7a owns the files; serving owns the suffix mapping.
> Flagged so Phase 8's `serveDigest()` appends `.html` when resolving.

---

## 4. Module Layout

```
packages/m6-podcast-service/
├── render/
│   ├── index.js          # buildRenderer({supabase, cfg}) → { renderEpisode, renderExpert,
│   │                     #   renderExpertWeek, renderWeekly, renderAll, renderForEpisode }
│   ├── templates.js      # esc(), layout(), partials: pickCard(), intelList(), pageHead()
│   ├── aggregate.js      # pure data shapers: groupByExpert(), weeklyConsensus(),
│   │                     #   slugify(), weekTagFor(pick|episode)
│   └── writeFile.js      # atomicWrite(path, html) + ensureDir()
└── scripts/
    └── render-digests.js # CLI: full rebuild / single episode (service-role)
```

`render/` (not `src/`) per the handoff's stated location. Tests live in
`test/render.test.js`.

---

## 5. Public API (`render/index.js`)

```js
export function buildRenderer({ supabase, cfg = config } = {}) {
  return {
    // Full vault rebuild — every episode, expert, week. Idempotent.
    async renderAll() { /* → { episodes, experts, weeks, written, ms } */ },

    // Incremental: re-render this episode's page + the expert page(s) and
    // week page(s) it contributes to. Called by the run `done` hook.
    async renderForEpisode(episodeId) { /* → { written: [...paths] } */ },

    // Single-page renderers (used by the above + directly by tests):
    async renderEpisode(episodeId) {},
    async renderExpert(slug) {},
    async renderExpertWeek(slug, weekTag) {},
    async renderWeekly(weekTag) {},
  };
}
```

- `supabase` is a **service-role** client (reads full picks, ignores anon RLS).
  Injected so tests pass a fake (same pattern as `buildServer({supabase})`).
- Only episodes with `status = 'done'` render (mirrors `getPodcastEpisodes`).
- `is_partial` episodes render with a visible "Partial episode" banner, not skipped.

### Page content

| Page | Aggregation | Key elements |
|------|-------------|--------------|
| `episodes/<id>.html` | one episode | feed name, expert, pub_date, duration, `extraction_model` + `extraction_quality_score` footer, every kept pick as a card, intel list. |
| `experts/<slug>.html` | all `status=done` episodes for that expert | season-to-date pick log grouped by week → category; link to each week page + source episodes. |
| `experts/<slug>/<season>-W<week>.html` | that expert, one week | just that week's picks/intel for the expert. |
| `weekly/<season>-W<week>.html` | **all** experts, one week | cross-expert consensus per matchup (reuse the `getWeeklyConsensus` grouping logic: group by team1+team2, count sides for spread/ml/total). |

### Derived keys (`aggregate.js`)

- `slugify(expert)` → `^[a-z0-9-]{1,64}$` (lowercase, spaces→`-`, strip other).
  **Must match Phase 8 §5.2's `slug` validation pattern** so share URLs resolve.
- `weekTagFor(pick, episode)` → `"<season>-W<week>"`:
  1. If `pick.season` + `pick.week` present → use them.
  2. Else derive from `episode.pub_date` via an NFL week calendar.
     **Assumption/dependency:** a `seasonWeekFromDate(date)` helper. If none
     exists in the repo, 7a adds a minimal season-start table (Phase 4 picks
     already carry `week`/`season` in practice, so this is a fallback). **Flagged
     as the one open data dependency — see §9.**

---

## 6. Re-render Trigger ("re-render after each pipeline run")

Add a completion hook in `runRegistry.startRun()` (or, cleaner, in the worker
wrapper) that fires **after** a run resolves `done`, non-blocking and
fail-soft:

```js
// after run.status = 'done', if input.episode_id present:
Promise.resolve()
  .then(() => onRunComplete?.(run, input))   // injected renderer hook
  .catch(err => app.log.error({ err }, 'digest re-render failed'));
```

- Inject `onRunComplete = (run, input) => renderer.renderForEpisode(input.episode_id)`
  from `app.js` / `server.js` so `runRegistry` keeps no hard dependency on
  `render/` (preserves the existing clean DI seams and offline tests).
- **Fail-soft:** a render error must never flip a successful ingest run to
  `error`. Log and move on; the next `renderAll` heals it.
- Skip the hook entirely when `supabase` creds are absent (dev/Windows) so the
  service still boots for `/health`.

---

## 7. CLI (`scripts/render-digests.js`)

```bash
node scripts/render-digests.js all                 # full vault rebuild
node scripts/render-digests.js episode --id <id>   # single episode + its rollups
node scripts/render-digests.js week --tag 2026-W5  # one weekly + expert-week pages
```

- Uses `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from `/etc/nfl-podcast.env`.
- Prints a summary line (`written N files in M ms`) for cron logging.
- This is the operator tool for Phase 5 vault rebuilds and for backfilling after
  a template change.

---

## 8. Tests (`test/render.test.js`, Windows-friendly, offline)

Inject a fake service-role Supabase client (returns canned episodes/picks) and a
`cfg` with `digestDir` pointed at an `os.tmpdir()` scratch dir.

1. `renderEpisode` writes `episodes/<id>.html`; body contains title, expert,
   each pick's `summary`, `line`, `units`, and the intel bullets.
2. **XSS:** an episode whose pick `summary` is `"<script>alert(1)</script>"`
   renders escaped (`&lt;script&gt;`), never raw — the load-bearing assertion.
3. `renderWeekly` groups two experts' picks on the same matchup into one
   consensus row with the correct side counts.
4. `renderExpert` lists only that expert's `done` episodes, grouped by week.
5. `slugify` round-trips to the Phase 8 `^[a-z0-9-]{1,64}$` pattern; collisions
   (two experts → same slug) are detected and logged.
6. Atomic write: no `*.tmp` file remains after success; an existing file is
   replaced, not appended.
7. `is_partial` episode renders with the partial banner.
8. `renderForEpisode` writes the episode page **plus** the affected
   `experts/<slug>.html`, `experts/<slug>/<tag>.html`, and `weekly/<tag>.html`.
9. Empty vault (no done episodes) → `renderAll` writes 0 files, no throw.

---

## 9. Sequencing & Dependencies

```
Phase 4 (picks in Supabase) ──→ Phase 7a (render) ──┬─→ Phase 7 /digest/* serving
                                                    ├─→ 7b opens digest pages
                                                    ├─→ 7c brief content
                                                    └─→ Phase 8 /share/* serving
```

- **Hard dep:** `SUPABASE_SERVICE_ROLE_KEY` on M6 (already in the deploy runbook).
- **Hard dep:** `config.digestDir` exists + writable (deploy runbook step 3).
- **Open data dep (the one to resolve during build):** reliable `season`/`week`
  per pick. Phase 4 picks carry it in practice; the `seasonWeekFromDate` fallback
  (§5) covers gaps. Confirm with a real extractor payload before finalizing the
  week-page key, or expert/weekly pages may mis-bucket.
- **Not blocked by Phase 8 or 7b** — 7a can ship and be verified standalone via
  the CLI + a `curl` once the Phase 7 `/digest/*` routes are un-stubbed.

---

## 10. Out of Scope (explicit)

- Serving / HTTP / auth / Funnel (Phase 7 routes + Phase 8).
- An episodes **index** page — 7b lists episodes from Supabase directly (anon),
  so no rendered index is needed for v1. (Easy add later if a no-JS landing page
  is wanted.)
- CSS framework — one small inline `<style>` in `pageHead()`; no Tailwind on M6.
- Live re-render on Supabase changes (webhooks). The run `done` hook + nightly
  `renderAll` cron is sufficient.
- Redacting internal fields: 7a renders what Phase 4 stored. If raw
  `confidence`/`units` must be hidden from partners, that is a render decision
  made **here** (Phase 8 just serves the file) — default v1 **shows**
  `quality_score` and a "needs review" flag but **omits** raw model `confidence`
  on the public-facing card to avoid over-precision.
