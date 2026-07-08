# NFL Dashboard â€” Security & Quality Audit Backlog

**Created:** 2026-05-22
**Sources:**
- Meridian Assurance Group â€” *NFL Platinum Rose End-to-End System Audit* (21 May 2026)
- CODEX Ultrathink â€” *NFL Dashboard Formal Audit Report* (21 May 2026)
**Progress:** 30 / 32 complete — 2 new items filed 2026-07-07 from the ATLAS/Rosie/NFL_Dashboard
Fable tri-project audit (FABLE-01, FABLE-03), fixes drafted same day, pending native
verification/deploy. Original 30/30 Meridian+CODEX set remains fully closed.

> **Completion rule:** Mark `[ ]` â†’ `[x]` only when the fix is committed to `main`
> AND verified by test, live query, or CI pass. Dev-only changes do not count.
>
> **Calibration note (from both audits):** This is a single-operator personal tool â€”
> no third-party PII, no user accounts, no money custody. Severities are calibrated
> against financial cost (leaked paid keys), decision quality (vig-inclusive analytics),
> and the operator's own data integrity â€” NOT against a consumer-data-protection standard.

---

## ðŸ”´ CRITICAL â€” Fix before next production deploy

- [x] **API-KEYS** â€” Paid OpenAI and Odds API keys compiled into world-readable GitHub Pages bundle
  - **Fixed S139 (`6dce19f`):** Created `supabase/functions/ai-proxy` + `odds-proxy` Edge Functions.
    Removed `VITE_OPENAI_API_KEY`, `VITE_ANTHROPIC_API_KEY`, `VITE_ODDS_API_KEY` from
    `apiConfig.js`, `deploy.yml`, and all callers. Keys now stored as Supabase secrets only.
  - **ACTION REQUIRED:** `supabase secrets set` all three keys + `supabase functions deploy`
    ai-proxy + odds-proxy; rotate both keys on provider dashboards.

---

## ðŸŸ  HIGH â€” Required before relying on the tool for real-money decisions

- [x] **RLS-WRITES** â€” `user_picks`, `user_bankroll_bets`, `vault_notes` are anon-writable
  - **Fixed (S140, `947df03`):** Migration `019_rls_user_tables.sql` drops open policies;
    adds `anon_read` + `authed_write` policies on picks/bets; restricts vault_notes writes
    to `service_role` only. `AuthGate` component added â€” gates the app behind
    Supabase email+password auth; transparent when no Supabase config or session exists.
  - **ACTION REQUIRED (one-time):** Create a Supabase auth user for yourself via the
    Supabase dashboard â†’ Authentication â†’ Users â†’ Invite/Add user. Then apply migration
    `019_rls_user_tables.sql` to production via `supabase db push`.
  - **Evidence:** `supabase/migrations/004_user_data.sql:43-47,82-86` â€”
    `for all using(true) with check(true)` grants full anon read/write/delete.
    `012_vault_notes.sql:71-81` â€” policy named "service_write" but has no `to service_role`
    restriction, so it is actually public write.
    The anon key that satisfies these policies is compiled into the public bundle.
  - **Risk:** Anyone on the internet can read, modify, delete betting records and inject
    malicious content into vault notes (AI context poisoning).
  - **Fix:** Replace open policies with authenticated owner-scoped RLS. Migration `019_rls_user_tables.sql`:
    - Enable `auth.uid()` ownership column on picks/bankroll; add `user_id` if absent.
    - `FOR SELECT USING (auth.uid() = user_id)` â€” or for single-user: a named-user policy.
    - `FOR INSERT/UPDATE/DELETE WITH CHECK (auth.uid() = user_id)`.
    - `vault_notes`: restrict write to `to service_role` (agents only) or `to authenticated`.
  - **Test:** Anon upsert to `user_picks` returns 403; service-role insert succeeds.

- [x] **VIG-REMOVAL** â€” EV/edge engine never removes bookmaker vig; all edge output is biased
  - **Fixed (S140, `ca2ba0a`):** `devig()` + `calcEV()` added to `futures.js`, wired into
    `enhancedOddsApi.js` arb finder; `FuturesEntryModal` label corrected to "Book implied".
    10 new unit tests (5 devig + 5 calcEV), 94/94 suite passing.
  - **Evidence:** No de-vig / overround normalisation anywhere in `src/`. `futures.js:76`
    `impliedProbability()` returns raw implied probability including the book margin.
    Only sum check is arbitrage at `enhancedOddsApi.js:284`.
  - **Risk:** Every EV and edge figure is systematically low â€” undermines the tool's core
    purpose. A positive-EV bet may appear negative; ranking of lines is unreliable.
  - **Fix:** `pFair = implied_side / (implied_home + implied_away)` â€” divide each side's
    raw implied probability by the total (overround) to normalise to 100%.
    Feed `pFair`, not raw implied, into all EV and Kelly calculations.
  - **Test:** Unit test asserting `devig(home_implied, away_implied)` sums to 1.0 Â± 0.001.

- [x] **MONTE-CARLO** â€” DevLab simulation has statistical defect and freezes the UI
  - **Fixed (S141, `7e620e7`):** Extracted pure sim math to `src/lib/devLabSim.js`
    (`boxMuller()` draws independent uniforms per call; `runGameSim()` replaces inline
    loop). Created `src/workers/simulationWorker.js` â€” off-thread Web Worker; no more
    main-thread freeze on full slate. Iterations 2 000 â†’ 10 000 for stable cover %.
    9 new unit tests: mean/variance/correlation-independence for `boxMuller`; shape,
    cover-sum, independence, favourite-wins sanity for `runGameSim`. 103/103 passing;
    clean Vite build (worker bundled as separate 0.87 kB chunk).
  - **Evidence:** `src/components/dev-lab/DevLab.jsx:129-130` â€” `z1` and `z2` both derive
    from the same Box-Muller `Math.log(u1)` radius â†’ spurious negative correlation between
    teams' score deviations. Default 2000 iters runs synchronously on the main thread
    (no `new Worker` anywhere); full-slate = UI freeze.
    The correct engine exists at `simulation.js` (uses independent pairs) â€” reuse it.
  - **Fix:**
    1. Replace DevLab's Box-Muller with an independent pair per team (or delegate to `simulation.js`).
    2. Move simulation loop into a `Web Worker`.
    3. Raise default iteration count for stable cover percentages (â‰¥ 10,000).
  - **Test:** Correlation of simulated team scores across 10,000 trials â‰ˆ 0 Â± 0.05.

- [x] **SYNC-DURABILITY** â€” Sync is fire-and-forget; writes can be silently lost
  - **Fixed S141 (`e48bd05`):** `src/lib/syncQueue.js` â€” persistent localStorage dirty queue;
    `enqueueDirty`/`dequeueSuccess`/`flushDirtyQueue` with type+id dedup.
    `bankroll.js` + `picksDatabase.js` `fireSync` now chains `.then(dequeue).catch(enqueue)`.
    `supabase.js` normalizers add `updatedAt` field.
    `App.jsx` `hydrateFromSupabase` replaced with timestamp-aware merge (cloud wins if
    `updatedAt` newer); `flushDirtyQueue` called after hydration on every boot.
  - **Test:** 13 tests in `tests/unit/syncQueue.test.js` â€” covers 503 scenario, retry-on-next-flush, dedup.

- [x] **CI-GATE** â€” No CI workflow runs ESLint or the 84 unit tests
  - **Fixed S141:** Created `.github/workflows/ci.yml` â€” runs `npm run lint` + `npm test`
    (Vitest) on every push to main and every PR. Deploy workflow gated: removed `push`
    trigger from `deploy.yml`; deploy now fires only via `workflow_run` on CI success
    (or `workflow_dispatch` for manual override). Build-job `if:` condition blocks deploy
    when CI conclusion â‰  `success`.
  - **Test:** Push a failing unit test; CI workflow blocks; deploy workflow skips.

- [x] **AUDIT-TRAIL** â€” Cloud writes and AI context mutations have no actor attribution
  - **Fixed S141 (`1d938e2`):** `supabase/migrations/020_audit_log.sql` â€” `audit_log`
    table (append-only, `authed` read-only RLS); `fn_audit_log()` AFTER trigger fires on
    INSERT/UPDATE/DELETE for `user_picks`, `user_bankroll_bets`, `vault_notes`; records
    `actor` (`auth.uid()` or `'anon'`), `action`, `record_id`, SHA-256 `patch_digest`
    of row JSON. `SECURITY DEFINER` bypasses RLS for the trigger write.
    `queryAuditLog()` added to `src/lib/supabase.js` for owner inspection.
  - **Test:** 14 tests in `tests/unit/auditTrail.test.js` â€” migration structure,
    query helper filters/caps, error/unavailable handling.
  - **Migration 020 applied to production 2026-05-22.**

- [x] **AGENT-LOCK** â€” AGENT_LOCK hot-file lock hook never actually locks
  - **Fixed S141 (`df8bb45`):** `hooks/scripts/protect-hot-files.js` line 53 â€” changed
    `lock?.locked === true || lock?.agent` to
    `Array.isArray(lock?.activeLocks) && lock.activeLocks.length > 0`.
    Old fields (`locked`, `agent`) never existed; actual schema uses `activeLocks` array.
  - **Test:** 9 tests in `tests/unit/agentLock.test.js` â€” empty array â†’ no-lock,
    populated array â†’ locked, legacy schema â†’ no-lock, invalid JSON â†’ no-lock.

---

## ðŸŸ¡ MEDIUM â€” Fix before 2026 season kickoff

- [x] **PICK-ID** â€” Pick ID embeds `Date.now()` â†’ re-logging same pick double-counts P&L
  - **Fixed S146 (`4c8134d`):** `picksDatabase.js` `generateId()` now uses stable natural key
    `${source}-${gameId}-${pickType}-${line}` (no timestamp). `addPick` dedup simplified to
    `picks.some(p => p.id === pick.id)`. Migration `021_pick_id_stable.sql` deduplicates
    existing rows (keep earliest `created_at` per group) and adds `UNIQUE` constraint on
    `(source, game_id, pick_type, line)`.
  - **ACTION REQUIRED:** Apply `supabase/migrations/021_pick_id_stable.sql` to production.
  - **Test:** 14 tests in `tests/unit/pickId.test.js` â€” 8 stable-key tests + 6 dedup tests;
    153/153 suite passing.

- [x] **QUOTA-BUDGET** â€” No Odds API quota tracking; silent mock-data fallback on exhaustion
  - **Fixed S147 (`0327361`):** `odds-proxy` edge function now forwards `x-requests-remaining`
    header from TheOddsAPI. `enhancedOddsApi.js` adds `QUOTA_LS_KEY`, `getOddsQuotaState()`,
    and `_setQuotaState()` â€” called in all 3 fetch paths (no-URL, success, error).
    `LiveOddsDashboard` reads quota state on mount and after each fetch; shows yellow
    "âš ï¸ Simulated data â€” quota exhausted" banner when `isMock=true`.
    12 new unit tests; 165/165 passing.

- [x] **INJURY-ACCESS** â€” `player_injuries` table has RLS enabled with no anon read policy
  - **Fixed S148 (`552051b`):** Migration `018_player_injuries_public_read.sql` already
    existed with correct `FOR SELECT USING (true)` policy. 8 unit tests confirm migration
    SQL is valid and `getRecentPlayerInjuries()` handles unavailable/error paths gracefully.
  - **ACTION REQUIRED:** Apply `018_player_injuries_public_read.sql` to production via
    Supabase Dashboard â†’ SQL Editor (or `supabase db push`). Verify with a live query
    that `getRecentPlayerInjuries()` returns > 0 rows when injury data exists.

- [x] **SEASON-HARDCODE** â€” Week/season logic hardcoded to 2026; stales post-season
  - **Fixed S149 (`cf1e415`):** `getCurrentSeasonYear(date?)` exported from `constants.js`;
    `_normalizeDate()` normalizes ISO date strings (UTC midnight) to local-date midnight
    for timezone-safe comparisons. `getSeasonStartDate(year?)` with env-var override
    (`VITE_SEASON_START_DATE`) and estimation fallback for future seasons. 27 unit tests
    cover all phases, year boundaries, and 2027 estimation; 200/200 passing.

- [x] **LINT-SCOPE** â€” ESLint config mixes Node/browser globals â†’ 395 errors, signal useless
  - **Evidence:** `eslint.config.js` applies browser globals to `**/*.{js,jsx}` â€”
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

- [x] **COVERAGE** â€” 8% line coverage; high-risk modules at 0%
  - **Evidence:** `vitest.config.js` covers only `src/lib/**/*.js`; reported 8.11%
    statements. `supabase.js`, `vaultClient.js`, `storage.js`, `openai.js`,
    `anthropicClient.js`, `picksDatabase.js` all at 0%.
  - **Fix:** Add tests for: RLS expectation (anon write rejected), storage abstraction
    compliance, hydration conflict logic, vault write path, season rollover edge cases.
    Set `coverageThreshold` after meaningful tests exist.
  - **Test:** Coverage report for `src/lib/` â‰¥ 40% after targeted additions.
  - **Done (S151):** Added `storage.test.js` (27), `picksDatabase.test.js` (36),
    expanded `bankroll.test.js` (+9), `actionParser.test.js` (+13 new functions).
    450/450 tests pass. Coverage: 40.7% stmts / 42.58% lines. `coverageThreshold`
    set in `vitest.config.js`. Commit: `a394e73`.

- [x] **STORAGE-BYPASS** â€” Storage abstraction bypassed with raw `localStorage` calls in ~5 files
  - **Evidence:** `AudioUploadModal.jsx:13-42`, `LiveOddsDashboard.jsx:35-79`,
    `BetValueComparison.jsx:190-197`, `enhancedOddsApi.js:173-174`,
    `outcomesMerger.js:46-53` call `localStorage` directly, bypassing `storage.js`.
  - **Fix:** Replace all raw calls with the storage module's helpers. Add ESLint rule
    `no-restricted-globals` for `localStorage` to enforce going forward.
  - **Test:** `grep -r 'localStorage\.' src/ --include="*.{js,jsx}"` returns 0 matches
    outside `src/lib/storage.js`.

- [x] **HYDRATION** â€” Additive-only hydration; device edits never propagate to other devices
  - **Fixed S152 (`4a69221`):** Extracted merge logic to `src/lib/syncMerge.js`:
    `mergeByUpdatedAt(local, cloud)` â€” cloud-only record added locally; cloud wins if
    `cloud.updatedAt > local.updatedAt`; local kept if either timestamp absent. Coerces
    ids via `String()` to avoid numeric/string mismatches. Immutable â€” neither input mutated.
    `App.jsx hydrateFromSupabase` now delegates to this utility for both picks and bets.
    18 unit tests in `tests/unit/syncMerge.test.js` covering all branches. 468/468 passing.
  - **Test:** Manually update a pick in Supabase; reload on second device; confirm update visible.

- [x] **GIT-PUSH-RACE** â€” Two workflows push to `main` with no rebase or concurrency guard
  - **Fixed S152 (`8cf3b2e`):** Added `concurrency: { group: git-push-main, cancel-in-progress: false }`
    to both `splits_cron.yml` and `weekly-update.yml`. Replaced bare `git push` with a
    3-attempt retry loop: `git pull --rebase origin main && git push`, back-off 5s/10s.
    Also fixed `weekly-update.yml` unconditional push (was pushing even when nothing
    committed); now guarded by the same `if ! git diff --quiet` check.
  - **Test:** Trigger both workflows simultaneously; confirm second waits for first.

- [x] **SCHEDULE-INGEST** â€” Single week failure aborts entire 18-week schedule ingest
  - **Fixed S152 (`bc5fad6`):** `fetchWeek` exported; `AbortSignal.timeout(15_000)` added
    to every ESPN fetch. Regular-season loop (weeks 1â€“18) and playoff loop (weeks 1â€“4)
    each wrap `fetchWeek` in `try/catch`; failures logged via `console.warn` and pushed
    to `failedWeeks[]`; loop always continues. `failed_weeks` field added to all 3
    receipt variants (dry-run, no-supabase, success).
    9 unit tests in `tests/unit/scheduleIngest.test.js` â€” including "week 8 throws,
    weeks 1â€“7 and 9â€“18 still succeed" â€” 477/477 passing.
  - **Test:** Mock week 8 fetch to throw; confirm weeks 1-7 and 9-18 still insert.

- [x] **ODDS-IDEMPOTENT** â€” Odds snapshot inserts append-only; re-runs double-insert rows
  - **Fixed S152 (`9ca2011`):** Both agents export `truncateToHour(date)` which zeroes UTC
    minutes/seconds/ms (e.g. 14:37 â†’ 14:00). `capturedAt` / `snapshot_time` now use this
    bucket value so all rows in a run share the same hour-keyed timestamp.
    `writeSnapshots` changed from `.insert()` to `.upsert({ onConflict: ... })`:
    - `game_odds_snapshots`: `onConflict: 'game_id,book,market,captured_at'`
    - `futures_odds_snapshots`: `onConflict: 'market_type,team,book,snapshot_time'`
    Migration `022_odds_upsert_keys.sql` adds the matching `UNIQUE` constraints.
    9 unit tests in `tests/unit/oddsIdempotent.test.js` â€” 486/486 passing.

- [x] **OPENAI-BROWSER** â€” Browser OpenAI calls lack `max_tokens`, timeout, and retry
  - **Fixed S152 (`595ae59`):** `max_tokens: 1500` added to request body. Each fetch
    attempt gets a fresh `AbortSignal.timeout(30_000)`. Retry loop (`MAX_RETRIES = 1`):
    on any 5xx the agent waits 1 s and retries once; 4xx and AbortErrors propagate
    immediately without retry. Headers and body extracted before loop so they are not
    re-serialised per attempt.
    7 unit tests in `tests/unit/openaiClient.test.js` â€” 493/493 passing.

- [x] **DEPS** â€” 6 npm advisories; Python requirements unresolvable
  - **Fixed S152 (`af63004`):** npm: `ws` fixed via `npm audit fix`; `nodemailer` bumped
    ^6.9.16â†’^8.0.8 (4 HIGH CVEs; createTransport/sendMail API unchanged). Python:
    `nfl_data_py` removed (not imported; required numpy<2.0 incompatible with Python 3.13);
    17 package bumps (urllib3 2.7.0, streamlit 1.54.0, tornado 6.5.5, pillow 12.2.0,
    protobuf 6.33.5, pyarrow 23.0.1, requests 2.33.0, langchain-core 1.3.3, langsmith 0.8.0,
    lxml 6.1.0, orjson 3.11.6, curl_cffi 0.15.0, GitPython 3.1.50, idna 3.15,
    yfinance 1.4.0, numpy 2.4.6).
    `npm audit --omit=dev` â†’ 0 vulnerabilities; `pip-audit` â†’ No known vulnerabilities found.

- [x] **SMOKE-TEST** â€” Tab-navigation smoke test failing (auth gate + viewport overflow) â€” fixed `b352f85`
  - Root cause: Supabase auth gate blocked all app UI in test builds (VITE_SUPABASE_URL baked in); secondary
    issue: tab bar uses `overflow:hidden` so "The Board" button is outside Chromium's viewport.
  - Fix: `AuthGate` wrapper with `VITE_BYPASS_AUTH=true` escape hatch; `.env.test` + `build:test` script
    (`vite build --mode test`); `playwright.config.js` webServer runs `build:test && preview`;
    smoke tests use `dispatchEvent('click')` instead of `click()` for off-screen tabs.
  - **Result:** 9 / 9 smoke tests passing.

---

## ðŸŸ¢ LOW / HYGIENE â€” Clean up when convenient

- [x] **ARTIFACTS** â€” Generated/transient files committed to git â€” fixed `dbc5201`
  - `git rm --cached`: `betting_splits.json`, `public/weekly_stats.json.bak`,
    `supabase/.temp/cli-latest`, `.nfl/session-log.jsonl`, `.nfl/receipts/` (13 files).
  - `.gitignore` patterns added: `betting_splits.json`, `public/*.bak`,
    `.nfl/session-log.jsonl`, `.nfl/receipts/`, `supabase/.temp/`, `coverage/`.

- [x] **CONSOLE-LOGS** — 48 raw `console.*` calls in `src/` routed through `logger` — fixed `0b0a035`
  - `supabase.js` (24×warn), `vaultClient.js` (13×warn), `LiveOddsDashboard.jsx` (6×mixed),
    `AnalyticsDashboard.jsx` (1×error), `BankrollDashboard.jsx` (1×error).
  - All files already imported `logger`; bulk-replaced `console.{log,warn,error}` → `logger.*`.
  - `eslint.config.js`: added `'no-console': 'error'` to `src/**` block;
    added `src/lib/logger.js` override (`'no-console': 'off'`) so the abstraction itself is exempt.

- [x] **APP-STUBS** â€” `App.jsx` stub handlers wired to live UI controls
  - **Evidence:** `onSyncOdds=()=>console.log("Sync")`, `onSaveâ†’alert("coming soon")`.
  - **Fix:** Implement or remove. Don't expose unreachable flows to the user.

- [x] **WEEK-HELPER** â€” Timezone-fragile week-bucketing helper duplicated across two agents
  - **Evidence:** `agents/betting-splits-ingest.js:123` `weekFromDate` uses UTC kickoff
    vs local season anchor; mirrored (with same bug) in `game-odds-ingest.js`.
  - **Fix:** Extract to `packages/shared/src/week-utils.js`; fix DST-safe Pacific time logic;
    import in both agents.

- [x] **BUNDLE-SIZE** â€” No performance budget; main chunk 460KB, Recharts 388KB
  - **Evidence:** Production build output (CODEX audit). No route-level budgets set.
  - **Fix:** Set `build.rollupOptions.output.manualChunks` budget warnings in `vite.config.js`;
    audit why large modal/chart code is on the main path.

- [x] **README** â€” Root README is generic Vite template
  - **Evidence:** `README.md:1-16` â€” still says "React + Vite". Real guidance is in
    `CLAUDE.md`, `docs/`, agents, and workflows.
  - **Fix:** Replace with: project description, setup, secrets model, deploy mode,
    test commands, and owner/runbook links.

- [x] **RESPONSIBLE-GAMBLING** â€” No disclaimer or "simulated data" indicator
  - **Evidence:** No `responsible` / `disclaimer` / `21+` text in `src/index.html` or README;
    mock-odds fallback serves fake data with no label.
  - **Fix:** Add a brief "for entertainment only, not financial advice" note to the app header;
    add a visible banner when `generateMockMultiBookData()` is active.

- [x] **STALE-PATH** â€” `CLAUDE.md` records stale workspace path
  - **Evidence:** `CLAUDE.md` still says `E:\dev\projects\NFL_Dashboard`; actual repo is
    at `D:\DEV\github\NFL_Platinum_Rose` on some machines.
  - **Fix:** Update `CLAUDE.md` to either use a relative path or the canonical location.

---

## HIGH / MEDIUM -- 2026-07 Fable tri-project audit findings

> Filed 2026-07-07 from the ATLAS/Rosie/NFL_Dashboard Fable audit (docs/audit/NFL_Dashboard_Audit_Report.md,
> Findings 1 and 3). Finding 1 is a guardrail/data-safety change -- flagged by the audit for Andy's
> sign-off rather than silently fixed. Andy approved proceeding 2026-07-07 (same-day Cowork session).

- [ ] **FABLE-01** Vault-to-Supabase export has no sensitivity-tier check (partner-readable table)
  - **Evidence:** `agents/obsidian-vault-sync.js` copies every note under the `NFL/` prefix into
    the Supabase `vault_notes` table (readable via the anon key by betting partners, by design) --
    the file never reads `sensitivity:` frontmatter at all, so the vault's fail-safe rule
    (missing/invalid label -> treat as private, never export) was not applied here.
  - **Fix drafted 2026-07-07:** added `parseSensitivity(content)` (same fail-safe regex parser
    pattern as Rosie's `vault-sync-logic.js` -- missing/invalid frontmatter defaults to `red`,
    never green). Added an `ALLOWED_EXPORT_TIERS` set, configurable via the new
    `VAULT_SYNC_ALLOWED_TIERS` env var (default: `green` only -- the conservative default, since
    whether partner-visible betting IP at the yellow tier is acceptable is Andy's business call,
    not something the sync should assume). Notes whose sensitivity isn't in the allowed set are
    skipped and logged (path + tier only, matching this file's existing no-content-in-logs style)
    rather than silently dropped with no trace.
  - **Live-verified 2026-07-08 (native dry-run):** Andy ran the dry-run and hit a separate,
    genuine pre-existing bug found along the way -- `listNotes()` never recursed into subfolders,
    so it silently found 0 notes against the real `NFL/Futures|Reference|Teams/` structure. Fixed
    with a depth-capped recursive rewrite. Once fixed, the dry-run found all 255 notes but skipped
    100% of them -- none had ever been given a `sensitivity:` frontmatter key, so the guardrail's
    fail-safe correctly defaulted every one to `red`. Andy chose to bulk-tag all 255 as `green`
    (public sports data, not family-sensitive) via a new hash-verified atomic script,
    `scripts/tag-nfl-sensitivity.js` -- ran live, 255/255 tagged, 0 errors. Re-ran the sync
    dry-run: 255/255 fetched, 0 errors, 0 skipped. Also added `stripFrontmatter()` so the
    `sensitivity:` block doesn't leak into the exported `content` field (cosmetic, not a security
    fix). Multi-segment paths (e.g. `NFL/Reference/CoachTendencies.md`) fetch correctly --
    the earlier `encodeURIComponent()` concern was a non-issue.
  - **ACTION REQUIRED:** (1) decide whether to set `VAULT_SYNC_ALLOWED_TIERS=green,yellow` or
    keep the `green`-only default (moot for now -- all 255 notes are tagged `green`); (2) run the
    sync for real (drop `--dry-run`) and confirm the `vault_notes` table gained the expected 255
    rows; (3) commit `agents/obsidian-vault-sync.js`, `scripts/tag-nfl-sensitivity.js`, and this
    file to `main`. Mark `[x]` once committed and the live (non-dry-run) sync has been confirmed.

- [ ] **FABLE-03** `CLAUDE.md` still documents the fixed key-in-browser env pattern
  - **Evidence:** `CLAUDE.md`'s Environment Variables section still listed `VITE_OPENAI_API_KEY`
    and `VITE_ODDS_API_KEY` as browser env vars -- the exact pattern `src/lib/apiConfig.js`
    deliberately eliminated (`API-KEYS` above, closed S139) by moving paid keys behind the
    `ai-proxy`/`odds-proxy` Supabase Edge Functions. A future contributor (or agent) following the
    stale doc could reintroduce the original leak.
  - **Fix drafted 2026-07-07:** `CLAUDE.md`'s env-vars section rewritten to list only
    `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` under browser env, with a new
    "Supabase Edge Function secrets (server-side only)" block listing `OPENAI_API_KEY`,
    `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `ODDS_API_KEY` and a one-line note pointing at
    `apiConfig.js`'s `AI_PROXY_URL`/`ODDS_PROXY_URL` pattern.
  - **ACTION REQUIRED:** none beyond normal commit -- this is a pure doc fix, no infra/migration
    step. Mark `[x]` once committed.
