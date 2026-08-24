# NFL Podcast Pipeline — PM Handoff

Last updated: 2026-06-03

## Current Status

Phase 6 is shipped through 6e.

- 6a commit `84ef3aa` — added 6 Supabase query helpers in `src/lib/supabase.js` plus `tests/unit/podcastQueries.test.js` (12/12 green).
- 6b commit `7a0df43` — wired 6 podcast intel tools into `src/lib/agentTools.js` via `PODCAST_INTEL_TOOLS`, added executor coverage in `tests/unit/agentTools.test.js` (54/54 green across targeted suites with 6a).
- 6c commit `24e4174` — created `agents/manifests/futures.manifest.json` with season-arc prompt and tool subset.
- 6d commit `3ad5fc6` — added `src/components/agent/FuturesAgentChat.jsx`, App route, and Header nav tab. Build green.
- 6e commit lands after this handoff update — adds the 6 podcast intel tools to `agents/manifests/betting.manifest.json` so the manifest matches the shipped tool surface.

## Important Divergence From Spec

Spec section 3 / Phase 6 said the FUTURES agent should live at `?tab=futures`.

That route already existed for `FuturesPortfolio`, so the agent was intentionally added at `?tab=futures-agent` to avoid breaking the current portfolio surface. This divergence is already called out in the 6d commit message.

## Files Touched In Phase 6

- `src/lib/supabase.js`
- `tests/unit/podcastQueries.test.js`
- `src/lib/agentTools.js`
- `tests/unit/agentTools.test.js`
- `agents/manifests/futures.manifest.json`
- `src/components/agent/FuturesAgentChat.jsx`
- `src/App.jsx`
- `src/components/layout/Header.jsx`
- `agents/manifests/betting.manifest.json`

## Remaining Work After Phase 6

Phase 7 is the next real block.

### 7a. Static digest renderer on M6 — **now defined**

Full spec: `docs/PODCAST_PHASE7A_RENDER_SPEC.md`. This is the true critical-path
blocker — 7b/7c/Phase 8 all have nothing to open/summarize/serve until it ships.

Build the render layer under `packages/m6-podcast-service/render/` + a
`scripts/render-digests.js` CLI.

Targets (on-disk filename contract Phase 7/8 serving maps to):

- `episodes/<id>.html`
- `experts/<slug>.html`
- `experts/<slug>/<season>-W<week>.html`
- `weekly/<season>-W<week>.html`

Key decisions in the spec:

- **Data source:** read from Supabase (service-role), not from `run.result` —
  enables idempotent full rebuild (Phase 5 vault) + multi-episode aggregation.
- **Templating:** zero new deps; escaped template literals with a mandatory
  `esc()` choke point (these pages go public via Phase 8 → stored-XSS is the
  headline risk). No client JS; static HTML only.
- **API:** `buildRenderer({supabase, cfg})` (same DI seam as `buildServer`),
  with `renderAll` (cron/CLI) + `renderForEpisode(id)` (run `done` hook).
- **Re-render trigger:** non-blocking, fail-soft completion hook injected into
  `runRegistry` — a render error never flips a good ingest run to `error`.
- **Atomic writes** (`*.tmp` → rename) so partners never read a half-written file.
- **Open data dep:** reliable `season`/`week` per pick (Phase 4 carries it; a
  `seasonWeekFromDate` fallback covers gaps) — confirm against a real payload.
- `slugify()` must match Phase 8 §5.2's `^[a-z0-9-]{1,64}$` so share URLs resolve.

### 7 (serving). `/digest/*` Tailscale-only routes — **now defined**

Full spec: `docs/PODCAST_PHASE7_SERVING_SPEC.md`. The thin HTTP layer that turns
7a's files into pages 7b can open. Un-stubs `src/app.js:90-99`.

- **New `src/digest.js`:** `resolveDigestPath` (strict param guard +
  `digestDir` containment assertion — the traversal defense), `sendDigestFile`
  (404 if not rendered, conditional-GET ETag), `registerDigestRoutes`.
- **Manual `fs.readFile`, not `@fastify/static`** — no new dep, and we own the
  path-validation surface that Phase 8 later funnels publicly.
- **Tailscale `serve` only — never `funnel`.** `/digest/*` has no app auth; its
  gate is the tailnet. Funneling it would expose un-tokened digest pages.
- **Phase 8 reuse seam:** Phase 8 `serveDigest` imports `resolveDigestPath` +
  `sendDigestFile` rather than forking the security logic — Phase 8 adds only
  `shareGuard`, `recordView`, and share-only headers.
- The `.html` URL suffix maps to the same on-disk file Phase 8 serves without it.
- Amend the "stubs return 501" test to drop the two `/digest/*` entries.

### 7b. SPA podcast digest tab — **now defined**

Full spec: `docs/PODCAST_PHASE7B_SPA_SPEC.md`. A first-class `?tab=podcasts` tab
(`src/components/podcasts/PodcastDigestTab.jsx`).

- **List is M6-independent:** episodes come from `getPodcastEpisodes` (Supabase
  anon), so the tab is never blank when M6 is down — only open/share need M6.
- **Two surfaces, two buttons:** *Open digest* → `window.open` of
  `${VITE_M6_BASE}/digest/episodes/<id>.html` (tailnet, operator); *Copy share
  link* → `/share/<token>/...` per Phase 8 §8 (public, partners). Share ships
  **disabled** (tooltip) until Phase 8 + a minted token land — no 7b rework later.
- **New config:** add `apiConfig.M6` (`VITE_M6_BASE` / `VITE_M6_FUNNEL_BASE`) —
  none exists today. This is 7b's one real new dependency.
- **Bug not to inherit:** the existing `PodcastIngestModal` reads the legacy
  `pick.type` and treats `confidence` as 0-100. v2 data uses `pick.category` and
  `confidence ∈ [0,1]`. The tab must use `category` + render `confidence * 100`.
- **Wiring points:** add `'podcasts'` to `App.jsx` `VALID_TABS`, a lazy import, a
  render slot, and a `NavTab` in `Header.jsx`. The URL-sync effect is already
  generic.
- The legacy modal is flagged for UX_EXPERT deprecation after the tab hits parity;
  7b does not delete it.

### 7c. Daily brief "Top Podcast Picks" block — **now defined**

Full spec: `docs/PODCAST_PHASE7C_BRIEF_SPEC.md`. Add a 24h "Top Podcast Picks"
section to `agents/nfl-daily-brief.js` (one file, additive: `fetchTopPodcastPicks`
+ `renderTopPodcastPicks`, plus a `buildPlainText` mirror).

- **Content is Supabase, not M6.** The brief already pulls `podcast_transcripts`
  (its `fetchPodcastIntel` even selects `picks` and discards them). 7c reads
  those picks directly — 24h `processed_at` window, drop `needs_review`, sort by
  `confidence` desc, cap 8. Must use `pick.category` + `confidence ∈ [0,1]`
  (the `confClass` helper is already 0-1 aware).
- **The brief never contacts M6 — the original guardrail was wrong.** It runs in
  **GitHub Actions on `ubuntu-latest`**, off-tailnet, with no Tailscale creds.
  M6's `/digest/*` is tailnet-only, so a "ping M6, degrade if unavailable" check
  would fail every run. **Dropped.** Degradation is the normal Supabase-empty →
  section-hides path every other section already uses.
- **Links degrade, don't break.** Default per-section link = dashboard
  `?tab=podcasts` (GitHub Pages, always reachable, lights up with 7b). Optional
  per-pick direct link `${M6_DIGEST_BASE}/digest/episodes/<id>.html` appears
  **only** when that Node env var is set (it's the `process.env` counterpart to
  7b's SPA `VITE_M6_BASE` — do not reuse a `VITE_*` key in the agent).
- **Lowest-risk Phase 7 item — ships today.** Hard dep (picks in Supabase) is
  already met; both link targets are soft.

### Phase 8. Signed `/share/*` partner surface (now defined)

Full spec: `docs/PODCAST_PHASE8_SHARE_SPEC.md`.

Summary:

- Public, Funnel-exposed, **read-only** window into the Phase 7a digest HTML for
  named partners (Patrick, Amanda, +3), gated by a revocable token and audit-logged.
- **Token model decided:** table-backed opaque tokens — uses the `share_tokens` +
  `share_views` tables already shipped in migration `023`. No new schema needed.
- Replaces the `501 { phase: 8 }` stub at `src/app.js:101` with token-gated
  `/share/:token/{episodes|weekly|experts}/...` routes mirroring the `/digest/*` set.
- New `src/share.js` (`shareGuard` preHandler + `recordView`), new operator CLI
  `scripts/share-token.js` (mint/list/revoke, service-role).
- Only `/share/*` is funneled to the internet; everything else stays Tailscale-private.
- Hard deps: migration `023` applied in prod + Phase 7a writing to `digestDir`.

## Known Follow-Ups / Gaps

- `agents/manifests/futures.manifest.json` records three spec-listed tools under `deferredTools` because they do not exist yet in `src/lib/agentTools.js`:
  - `analyze_futures_hedge`
  - `project_division_paths`
  - `track_award_race`
- The FUTURES chat currently reuses `BETTING_TOOLS` and relies on the system prompt to bias tool choice. That is acceptable for now because the tool surface already contains the futures-relevant subset.

## Validation Commands

Use these before any new Phase 7 commit:

```powershell
cd d:\DEV\github\NFL_Platinum_Rose
npx vitest run tests/unit/agentTools.test.js tests/unit/podcastQueries.test.js
npm run build
```

## Pull / Sync Check

Before starting on another machine:

```powershell
cd d:\DEV\github\NFL_Platinum_Rose
git fetch origin
git status -sb
git log --oneline origin/main -5
```

Expected state after this handoff closes:

- `main` equals `origin/main`
- latest commits include 6b / 6c / 6d / 6e in order

## Local Artifact Note

There are currently untracked local docs/image artifact directories in one working copy:

- `docs/Futures_Odds/`
- `docs/Screenshots/`

They are not part of Phase 6 and were intentionally not included in the feature commits. Treat them as local-only unless Andy explicitly wants them versioned.
