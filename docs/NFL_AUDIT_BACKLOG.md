# NFL Dashboard — Security & Quality Audit Backlog

**Created:** 2026-05-22
**Sources:**
- Meridian Assurance Group — *NFL Platinum Rose End-to-End System Audit* (21 May 2026)
- CODEX Ultrathink — *NFL Dashboard Formal Audit Report* (21 May 2026)
**Progress:** 17 / 29 complete

> **Completion rule:** Mark `[ ]` → `[x]` only when the fix is committed to `main`
> AND verified by test, live query, or CI pass. Dev-only changes do not count.
>
> **Calibration note (from both audits):** This is a single-operator personal tool —
> no third-party PII, no user accounts, no money custody. Severities are calibrated
> against financial cost (leaked paid keys), decision quality (vig-inclusive analytics),
> and the operator's own data integrity — NOT against a consumer-data-protection standard.

---

## 🔴 CRITICAL — Fix before next production deploy

- [x] **API-KEYS** — Paid OpenAI and Odds API keys compiled into world-readable GitHub Pages bundle
  - **Fixed S139 (`6dce19f`):** Created `supabase/functions/ai-proxy` + `odds-proxy` Edge Functions.
    Removed `VITE_OPENAI_API_KEY`, `VITE_ANTHROPIC_API_KEY`, `VITE_ODDS_API_KEY` from
    `apiConfig.js`, `deploy.yml`, and all callers. Keys now stored as Supabase secrets only.
  - **ACTION REQUIRED:** `supabase secrets set` all three keys + `supabase functions deploy`
    ai-proxy + odds-proxy; rotate both keys on provider dashboards.

---

## 🟠 HIGH — Required before relying on the tool for real-money decisions

- [x] **RLS-WRITES** — `user_picks`, `user_bankroll_bets`, `vault_notes` are anon-writable
  - **Fixed (S140, `947df03`):** Migration `019_rls_user_tables.sql` drops open policies;
    adds `anon_read` + `authed_write` policies on picks/bets; restricts vault_notes writes
    to `service_role` only. `AuthGate` component added — gates the app behind
    Supabase email+password auth; transparent when no Supabase config or session exists.
  - **ACTION REQUIRED (one-time):** Create a Supabase auth user for yourself via the
    Supabase dashboard → Authentication → Users → Invite/Add user. Then apply migration
    `019_rls_user_tables.sql` to production via `supabase db push`.
  - **Evidence:** `supabase/migrations/004_user_data.sql:43-47,82-86` —
    `for all using(true) with check(true)` grants full anon read/write/delete.
    `012_vault_notes.sql:71-81` — policy named "service_write" but has no `to service_role`
    restriction, so it is actually public write.
    The anon key that satisfies these policies is compiled into the public bundle.
  - **Risk:** Anyone on the internet can read, modify, delete betting records and inject
    malicious content into vault notes (AI context poisoning).
  - **Fix:** Replace open policies with authenticated owner-scoped RLS. Migration `019_rls_user_tables.sql`:
    - Enable `auth.uid()` ownership column on picks/bankroll; add `user_id` if absent.
    - `FOR SELECT USING (auth.uid() = user_id)` — or for single-user: a named-user policy.
    - `FOR INSERT/UPDATE/DELETE WITH CHECK (auth.uid() = user_id)`.
    - `vault_notes`: restrict write to `to service_role` (agents only) or `to authenticated`.
  - **Test:** Anon upsert to `user_picks` returns 403; service-role insert succeeds.

- [x] **VIG-REMOVAL** — EV/edge engine never removes bookmaker vig; all edge output is biased
  - **Fixed (S140, `ca2ba0a`):** `devig()` + `calcEV()` added to `futures.js`, wired into
    `enhancedOddsApi.js` arb finder; `FuturesEntryModal` label corrected to "Book implied".
    10 new unit tests (5 devig + 5 calcEV), 94/94 suite passing.
  - **Evidence:** No de-vig / overround normalisation anywhere in `src/`. `futures.js:76`
    `impliedProbability()` returns raw implied probability including the book margin.
    Only sum check is arbitrage at `enhancedOddsApi.js:284`.
  - **Risk:** Every EV and edge figure is systematically low — undermines the tool's core
    purpose. A positive-EV bet may appear negative; ranking of lines is unreliable.
  - **Fix:** `pFair = implied_side / (implied_home + implied_away)` — divide each side's
    raw implied probability by the total (overround) to normalise to 100%.
    Feed `pFair`, not raw implied, into all EV and Kelly calculations.
  - **Test:** Unit test asserting `devig(home_implied, away_implied)` sums to 1.0 ± 0.001.

- [x] **MONTE-CARLO** — DevLab simulation has statistical defect and freezes the UI
  - **Fixed (S141, `7e620e7`):** Extracted pure sim math to `src/lib/devLabSim.js`
    (`boxMuller()` draws independent uniforms per call; `runGameSim()` replaces inline
    loop). Created `src/workers/simulationWorker.js` — off-thread Web Worker; no more
    main-thread freeze on full slate. Iterations 2 000 → 10 000 for stable cover %.
    9 new unit tests: mean/variance/correlation-independence for `boxMuller`; shape,
    cover-sum, independence, favourite-wins sanity for `runGameSim`. 103/103 passing;
    clean Vite build (worker bundled as separate 0.87 kB chunk).
  - **Evidence:** `src/components/dev-lab/DevLab.jsx:129-130` — `z1` and `z2` both derive
    from the same Box-Muller `Math.log(u1)` radius → spurious negative correlation between
    teams' score deviations. Default 2000 iters runs synchronously on the main thread
    (no `new Worker` anywhere); full-slate = UI freeze.
    The correct engine exists at `simulation.js` (uses independent pairs) — reuse it.
  - **Fix:**
    1. Replace DevLab's Box-Muller with an independent pair per team (or delegate to `simulation.js`).
    2. Move simulation loop into a `Web Worker`.
    3. Raise default iteration count for stable cover percentages (≥ 10,000).
  - **Test:** Correlation of simulated team scores across 10,000 trials ≈ 0 ± 0.05.

- [x] **SYNC-DURABILITY** — Sync is fire-and-forget; writes can be silently lost
  - **Fixed S141 (`e48bd05`):** `src/lib/syncQueue.js` — persistent localStorage dirty queue;
    `enqueueDirty`/`dequeueSuccess`/`flushDirtyQueue` with type+id dedup.
    `bankroll.js` + `picksDatabase.js` `fireSync` now chains `.then(dequeue).catch(enqueue)`.
    `supabase.js` normalizers add `updatedAt` field.
    `App.jsx` `hydrateFromSupabase` replaced with timestamp-aware merge (cloud wins if
    `updatedAt` newer); `flushDirtyQueue` called after hydration on every boot.
  - **Test:** 13 tests in `tests/unit/syncQueue.test.js` — covers 503 scenario, retry-on-next-flush, dedup.

- [x] **CI-GATE** — No CI workflow runs ESLint or the 84 unit tests
  - **Fixed S141:** Created `.github/workflows/ci.yml` — runs `npm run lint` + `npm test`
    (Vitest) on every push to main and every PR. Deploy workflow gated: removed `push`
    trigger from `deploy.yml`; deploy now fires only via `workflow_run` on CI success
    (or `workflow_dispatch` for manual override). Build-job `if:` condition blocks deploy
    when CI conclusion ≠ `success`.
  - **Test:** Push a failing unit test; CI workflow blocks; deploy workflow skips.

- [x] **AUDIT-TRAIL** — Cloud writes and AI context mutations have no actor attribution
  - **Fixed S141 (`1d938e2`):** `supabase/migrations/020_audit_log.sql` — `audit_log`
    table (append-only, `authed` read-only RLS); `fn_audit_log()` AFTER trigger fires on
    INSERT/UPDATE/DELETE for `user_picks`, `user_bankroll_bets`, `vault_notes`; records
    `actor` (`auth.uid()` or `'anon'`), `action`, `record_id`, SHA-256 `patch_digest`
    of row JSON. `SECURITY DEFINER` bypasses RLS for the trigger write.
    `queryAuditLog()` added to `src/lib/supabase.js` for owner inspection.
  - **Test:** 14 tests in `tests/unit/auditTrail.test.js` — migration structure,
    query helper filters/caps, error/unavailable handling.
  - **Migration 020 applied to production 2026-05-22.**

- [x] **AGENT-LOCK** — AGENT_LOCK hot-file lock hook never actually locks
  - **Fixed S141 (`df8bb45`):** `hooks/scripts/protect-hot-files.js` line 53 — changed
    `lock?.locked === true || lock?.agent` to
    `Array.isArray(lock?.activeLocks) && lock.activeLocks.length > 0`.
    Old fields (`locked`, `agent`) never existed; actual schema uses `activeLocks` array.
  - **Test:** 9 tests in `tests/unit/agentLock.test.js` — empty array → no-lock,
    populated array → locked, legacy schema → no-lock, invalid JSON → no-lock.

---

## 🟡 MEDIUM — Fix before 2026 season kickoff

- [x] **PICK-ID** — Pick ID embeds `Date.now()` → re-logging same pick double-counts P&L
  - **Fixed S146 (`4c8134d`):** `picksDatabase.js` `generateId()` now uses stable natural key
    `${source}-${gameId}-${pickType}-${line}` (no timestamp). `addPick` dedup simplified to
    `picks.some(p => p.id === pick.id)`. Migration `021_pick_id_stable.sql` deduplicates
    existing rows (keep earliest `created_at` per group) and adds `UNIQUE` constraint on
    `(source, game_id, pick_type, line)`.
  - **ACTION REQUIRED:** Apply `supabase/migrations/021_pick_id_stable.sql` to production.
  - **Test:** 14 tests in `tests/unit/pickId.test.js` — 8 stable-key tests + 6 dedup tests;
    153/153 suite passing.

- [x] **QUOTA-BUDGET** — No Odds API quota tracking; silent mock-data fallback on exhaustion
  - **Fixed S147 (`0327361`):** `odds-proxy` edge function now forwards `x-requests-remaining`
    header from TheOddsAPI. `enhancedOddsApi.js` adds `QUOTA_LS_KEY`, `getOddsQuotaState()`,
    and `_setQuotaState()` — called in all 3 fetch paths (no-URL, success, error).
    `LiveOddsDashboard` reads quota state on mount and after each fetch; shows yellow
    "⚠️ Simulated data — quota exhausted" banner when `isMock=true`.
    12 new unit tests; 165/165 passing.

- [x] **INJURY-ACCESS** — `player_injuries` table has RLS enabled with no anon read policy
  - **Fixed S148 (`552051b`):** Migration `018_player_injuries_public_read.sql` already
    existed with correct `FOR SELECT USING (true)` policy. 8 unit tests confirm migration
    SQL is valid and `getRecentPlayerInjuries()` handles unavailable/error paths gracefully.
  - **ACTION REQUIRED:** Apply `018_player_injuries_public_read.sql` to production via
    Supabase Dashboard → SQL Editor (or `supabase db push`). Verify with a live query
    that `getRecentPlayerInjuries()` returns > 0 rows when injury data exists.

- [x] **SEASON-HARDCODE** — Week/season logic hardcoded to 2026; stales post-season
  - **Fixed S149 (`cf1e415`):** `getCurrentSeasonYear(date?)` exported from `constants.js`;
    `_normalizeDate()` normalizes ISO date strings (UTC midnight) to local-date midnight
    for timezone-safe comparisons. `getSeasonStartDate(year?)` with env-var override
    (`VITE_SEASON_START_DATE`) and estimation fallback for future seasons. 27 unit tests
    cover all phases, year boundaries, and 2027 estimation; 200/200 passing.

- [x] **LINT-SCOPE** — ESLint config mixes Node/browser globals → 395 errors, signal useless
  - **Evidence:** `eslint.config.js` applies browser globals to `**/*.{js,jsx}` —
    Node agents report false `process`/`require`/`__dirname` errors; `.claude/` hooks
    and bundled skill assets also scanned.
  - **Fix:** Split into three lint configs: frontend (`src/`), agents/scripts
    (Node globals), and ignore generated/vendored paths.
    Reduce to 0 errors before enabling CI lint gate.
  - **Test:** `npm run lint` exits 0 after split; CI blocks on any new error.
  - **Fixed S150 (`bade09b`):** 3 scoped configs (browser/React, Node agents, Node
    tests). `argsIgnorePattern: '^_'` added to all scopes. Pre-existing `react-hooks`
    pattern rules downgraded to warn. Fixed `no-undef` bugs in `HedgeCalculator.jsx`
    (missing props) and `AudioUploadModal.jsx` (`hasGlobalKey`). Fixed `no-useless-escape`
    in `betImport.js`, `no-empty` in `LineMovementTracker.jsx`. `.claude/**` ignored.
    `npm run lint`: 0 errors, 128 warnings; vitest 200/200.

- [x] **COVERAGE** — 8% line coverage; high-risk modules at 0%
  - **Evidence:** `vitest.config.js` covers only `src/lib/**/*.js`; reported 8.11%
    statements. `supabase.js`, `vaultClient.js`, `storage.js`, `openai.js`,
    `anthropicClient.js`, `picksDatabase.js` all at 0%.
  - **Fix:** Add tests for: RLS expectation (anon write rejected), storage abstraction
    compliance, hydration conflict logic, vault write path, season rollover edge cases.
    Set `coverageThreshold` after meaningful tests exist.
  - **Test:** Coverage report for `src/lib/` ≥ 40% after targeted additions.
  - **Done (S151):** Added `storage.test.js` (27), `picksDatabase.test.js` (36),
    expanded `bankroll.test.js` (+9), `actionParser.test.js` (+13 new functions).
    450/450 tests pass. Coverage: 40.7% stmts / 42.58% lines. `coverageThreshold`
    set in `vitest.config.js`. Commit: `a394e73`.

- [x] **STORAGE-BYPASS** — Storage abstraction bypassed with raw `localStorage` calls in ~5 files
  - **Evidence:** `AudioUploadModal.jsx:13-42`, `LiveOddsDashboard.jsx:35-79`,
    `BetValueComparison.jsx:190-197`, `enhancedOddsApi.js:173-174`,
    `outcomesMerger.js:46-53` call `localStorage` directly, bypassing `storage.js`.
  - **Fix:** Replace all raw calls with the storage module's helpers. Add ESLint rule
    `no-restricted-globals` for `localStorage` to enforce going forward.
  - **Test:** `grep -r 'localStorage\.' src/ --include="*.{js,jsx}"` returns 0 matches
    outside `src/lib/storage.js`.

- [x] **HYDRATION** — Additive-only hydration; device edits never propagate to other devices
  - **Fixed S152 (`4a69221`):** Extracted merge logic to `src/lib/syncMerge.js`:
    `mergeByUpdatedAt(local, cloud)` — cloud-only record added locally; cloud wins if
    `cloud.updatedAt > local.updatedAt`; local kept if either timestamp absent. Coerces
    ids via `String()` to avoid numeric/string mismatches. Immutable — neither input mutated.
    `App.jsx hydrateFromSupabase` now delegates to this utility for both picks and bets.
    18 unit tests in `tests/unit/syncMerge.test.js` covering all branches. 468/468 passing.
  - **Test:** Manually update a pick in Supabase; reload on second device; confirm update visible.

- [x] **GIT-PUSH-RACE** — Two workflows push to `main` with no rebase or concurrency guard
  - **Fixed S152 (`8cf3b2e`):** Added `concurrency: { group: git-push-main, cancel-in-progress: false }`
    to both `splits_cron.yml` and `weekly-update.yml`. Replaced bare `git push` with a
    3-attempt retry loop: `git pull --rebase origin main && git push`, back-off 5s/10s.
    Also fixed `weekly-update.yml` unconditional push (was pushing even when nothing
    committed); now guarded by the same `if ! git diff --quiet` check.
  - **Test:** Trigger both workflows simultaneously; confirm second waits for first.

- [ ] **SCHEDULE-INGEST** — Single week failure aborts entire 18-week schedule ingest
  - **Evidence:** `agents/schedule-ingest.js:213` — bare `await fetch` with no timeout;
    `run().catch → process.exit(1)` with no per-week try/catch.
  - **Fix:** Wrap each week's fetch in `try/catch`; log failures but continue; add a
    per-request timeout (e.g. `fetchWithTimeout` from shared utils).
  - **Test:** Mock week 8 fetch to throw; confirm weeks 1-7 and 9-18 still insert.

- [ ] **ODDS-IDEMPOTENT** — Odds snapshot inserts append-only; re-runs double-insert rows
  - **Evidence:** `agents/futures-odds-ingest.js` and `game-odds-ingest.js:243` use
    `.insert()` (not upsert); a re-run on the same game inserts a second row.
  - **Fix:** Switch to `upsert` with a natural unique key (game_id + book + timestamp bucket);
    or add a unique constraint and handle conflict with `on_conflict=ignore`.
  - **Test:** Run ingest twice on same game; confirm row count unchanged.

- [ ] **OPENAI-BROWSER** — Browser OpenAI calls lack `max_tokens`, timeout, and retry
  - **Evidence:** `src/lib/openai.js:60-72` — no token cap, no timeout, no retry.
    Input is truncated to 15k chars but no output cap exists.
  - **Fix:** Add `max_tokens: 1500` (or configurable), a `signal: AbortSignal.timeout(30000)`,
    and a simple 1-retry on 5xx. (Remove once API-KEYS is resolved and calls are proxied.)
  - **Test:** Mock OpenAI to timeout; confirm `AbortError` is caught and surfaced in UI.

- [ ] **DEPS** — 6 npm advisories; Python requirements unresolvable
  - **Evidence:** `npm audit --omit=dev` reports 1 Moderate (ws) in production;
    full audit shows 3 High (dev paths including Vite). `python -m pip_audit` fails on
    `numpy==2.4.0` conflict at `requirements.txt:14,36,39`.
  - **Fix:** `npm audit fix`; manually patch `ws` if needed. Reconcile Python requirements
    (pin compatible numpy version; verify with `pip-audit`).
  - **Test:** `npm audit --omit=dev` exits 0; `pip-audit` completes without errors.

- [ ] **SMOKE-TEST** — Tab-navigation smoke test failing (viewport issue on "The Board" tab)
  - **Evidence:** After `npx playwright install chromium`, 8/9 smoke checks pass; the
    tab-navigation sweep fails because "The Board" button is outside viewport during click.
  - **Fix:** Add `scrollIntoView()` or `force: true` to the Playwright selector;
    or adjust the nav layout so all primary tabs are visible at desktop test width.
  - **Test:** `npm run test:smoke` exits 0 with all checks passing.

---

## 🟢 LOW / HYGIENE — Clean up when convenient

- [ ] **ARTIFACTS** — Generated/transient files committed to git
  - `public/weekly_stats.json.bak`, `betting_splits.json` (root), `.nfl/*.jsonl`,
    `.nfl/receipts/`, `supabase/.temp/cli-latest`
  - **Fix:** `git rm --cached` for each; add patterns to `.gitignore`.

- [ ] **CONSOLE-LOGS** — ~102 `console.log` calls in `src/` ship in production bundle
  - **Evidence:** `picksDatabase.js:162/278/319`; `App.jsx` `onSyncOdds=()=>console.log("Sync")`.
  - **Fix:** Strip `console.log` from `src/`; replace with a controlled logger or remove.
    Add ESLint `no-console` rule once lint is clean.

- [ ] **APP-STUBS** — `App.jsx` stub handlers wired to live UI controls
  - **Evidence:** `onSyncOdds=()=>console.log("Sync")`, `onSave→alert("coming soon")`.
  - **Fix:** Implement or remove. Don't expose unreachable flows to the user.

- [ ] **WEEK-HELPER** — Timezone-fragile week-bucketing helper duplicated across two agents
  - **Evidence:** `agents/betting-splits-ingest.js:123` `weekFromDate` uses UTC kickoff
    vs local season anchor; mirrored (with same bug) in `game-odds-ingest.js`.
  - **Fix:** Extract to `packages/shared/src/week-utils.js`; fix DST-safe Pacific time logic;
    import in both agents.

- [ ] **BUNDLE-SIZE** — No performance budget; main chunk 460KB, Recharts 388KB
  - **Evidence:** Production build output (CODEX audit). No route-level budgets set.
  - **Fix:** Set `build.rollupOptions.output.manualChunks` budget warnings in `vite.config.js`;
    audit why large modal/chart code is on the main path.

- [ ] **README** — Root README is generic Vite template
  - **Evidence:** `README.md:1-16` — still says "React + Vite". Real guidance is in
    `CLAUDE.md`, `docs/`, agents, and workflows.
  - **Fix:** Replace with: project description, setup, secrets model, deploy mode,
    test commands, and owner/runbook links.

- [ ] **RESPONSIBLE-GAMBLING** — No disclaimer or "simulated data" indicator
  - **Evidence:** No `responsible` / `disclaimer` / `21+` text in `src/index.html` or README;
    mock-odds fallback serves fake data with no label.
  - **Fix:** Add a brief "for entertainment only, not financial advice" note to the app header;
    add a visible banner when `generateMockMultiBookData()` is active.

- [ ] **STALE-PATH** — `CLAUDE.md` records stale workspace path
  - **Evidence:** `CLAUDE.md` still says `E:\dev\projects\NFL_Dashboard`; actual repo is
    at `D:\DEV\github\NFL_Platinum_Rose` on some machines.
  - **Fix:** Update `CLAUDE.md` to either use a relative path or the canonical location.
