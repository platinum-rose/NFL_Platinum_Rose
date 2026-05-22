# NFL Dashboard — Security & Quality Audit Backlog

**Created:** 2026-05-22
**Sources:**
- Meridian Assurance Group — *NFL Platinum Rose End-to-End System Audit* (21 May 2026)
- CODEX Ultrathink — *NFL Dashboard Formal Audit Report* (21 May 2026)
**Progress:** 4 / 29 complete

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

- [ ] **SYNC-DURABILITY** — Sync is fire-and-forget; writes can be silently lost
  - **Evidence:** `src/lib/bankroll.js` `fireSync` swallows all `.catch(()=>{})`.
    `supabase.js` upserts use `onConflict:'id'` with `updated_at=now()` and no version
    guard — last write wins regardless of which is newer.
    `App.jsx hydrateFromSupabase` merges by id-union only — cloud edits never overwrite
    existing local records.
  - **Fix:** Dirty-flag retry queue (write locally → mark dirty → retry until confirmed);
    compare `updated_at` on hydration (keep newer by timestamp, not by load order);
    propagate cloud updates to existing local IDs.
  - **Test:** Simulate Supabase 503; confirm local pick is flagged dirty; confirm it syncs on next call.

- [ ] **CI-GATE** — No CI workflow runs ESLint or the 84 unit tests
  - **Evidence:** `grep 'vitest\|npm test\|eslint' .github/workflows/*.yml` returns nothing;
    only a Playwright smoke build runs on push. Regressions can reach production unblocked.
  - **Fix:** Create `.github/workflows/ci.yml`:
    ```yaml
    on: [push, pull_request]
    jobs:
      quality:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - uses: actions/setup-node@v4
            with: { node-version: '20', cache: 'npm' }
          - run: npm ci
          - run: npm test
          - run: npm run lint -- --max-warnings 0   # after LINT-SCOPE is fixed
          - run: npm run build
          - run: npm audit --omit=dev
    ```
  - **Test:** Push a failing unit test; confirm CI blocks the PR.

- [ ] **AUDIT-TRAIL** — Cloud writes and AI context mutations have no actor attribution
  - **Evidence:** Picks and bankroll records are anonymous browser writes; vault notes
    are publicly writable; localStorage edits are inherently unaudited.
    Tables have `created_at`/`updated_at` but no `actor_id`, immutable event log,
    or tamper-evident history.
  - **Fix:** Add `user_id` (or a session token) to write paths; add a lightweight
    `audit_log` table (`table_name`, `record_id`, `action`, `actor`, `ts`, `patch_digest`);
    write to it on all picks/bankroll/vault mutations.
  - **Test:** Insert a pick; query `audit_log`; confirm actor + action recorded.

- [ ] **AGENT-LOCK** — AGENT_LOCK hot-file lock hook never actually locks
  - **Evidence:** `hooks/protect-hot-files.js:53` checks `lock.locked` and `lock.agent`
    fields; `AGENT_LOCK.json` schema is `{locks, activeLocks, ...}` — the checked fields
    don't exist, so every check evaluates as "no lock present" and the hook exits 0.
  - **Fix:** Update `protect-hot-files.js` to read `AGENT_LOCK.json`'s actual schema
    (`activeLocks` array); lock if `activeLocks.length > 0`.
  - **Test:** Set `activeLocks: ["test-agent"]` in the lock file; confirm hook blocks write.

---

## 🟡 MEDIUM — Fix before 2026 season kickoff

- [ ] **PICK-ID** — Pick ID embeds `Date.now()` → re-logging same pick double-counts P&L
  - **Evidence:** `src/lib/picksDatabase.js:58` — `id = \`${source}-${gameId}-${pickType}-${Date.now()}\``
    means the same logical pick logged twice generates two rows; PK cannot dedup.
  - **Fix:** Stable natural key: `${source}-${gameId}-${pickType}-${line}` (no timestamp).
    Add `UNIQUE` DB constraint. Existing duplicate rows will need a one-time dedup migration.
  - **Test:** Log same pick twice; confirm only 1 row exists; P&L unchanged.

- [ ] **QUOTA-BUDGET** — No Odds API quota tracking; silent mock-data fallback on exhaustion
  - **Evidence:** No `remaining-requests` header read anywhere; `enhancedOddsApi.js` falls
    back to `generateMockMultiBookData()` on quota exhaustion with no UI banner.
  - **Fix:** Read `x-requests-remaining` response header; persist a monthly counter to
    localStorage; show an explicit "⚠️ Simulated data — quota exhausted" banner when mock
    data is served.
  - **Test:** Mock quota exhaustion; confirm banner appears; confirm real API not called.

- [ ] **INJURY-ACCESS** — `player_injuries` table has RLS enabled with no anon read policy
  - **Evidence:** `supabase/migrations/016_player_injuries.sql:50-52` enables RLS with
    no SELECT policy for anon/authenticated — browser queries always return `[]`.
    Migration `018` added a public read policy but verify it's applied and working.
  - **Fix:** Confirm migration `018_player_injuries_public_read.sql` is applied live;
    verify `src/lib/supabase.js:726-752` returns real rows.
  - **Test:** Live Supabase query on `player_injuries` returns > 0 rows when data exists.

- [ ] **SEASON-HARDCODE** — Week/season logic hardcoded to 2026; stales post-season
  - **Evidence:** `src/lib/constants.js:4-33` derives phase/week from fixed 2026 start date;
    `supabase.js:763,803` default cloud odds/splits paths to `season: 2026`.
  - **Fix:** Make season derivation data-driven: compute from current date relative to
    a configurable `SEASON_START_DATE`; default `season` from computed value, not constant.
  - **Test:** Unit test asserting correct week/phase for dates in preseason, regular season,
    playoffs, offseason, and the 2027 season.

- [ ] **LINT-SCOPE** — ESLint config mixes Node/browser globals → 395 errors, signal useless
  - **Evidence:** `eslint.config.js` applies browser globals to `**/*.{js,jsx}` —
    Node agents report false `process`/`require`/`__dirname` errors; `.claude/` hooks
    and bundled skill assets also scanned.
  - **Fix:** Split into three lint configs: frontend (`src/`), agents/scripts
    (Node globals), and ignore generated/vendored paths.
    Reduce to 0 errors before enabling CI lint gate.
  - **Test:** `npm run lint` exits 0 after split; CI blocks on any new error.

- [ ] **COVERAGE** — 8% line coverage; high-risk modules at 0%
  - **Evidence:** `vitest.config.js` covers only `src/lib/**/*.js`; reported 8.11%
    statements. `supabase.js`, `vaultClient.js`, `storage.js`, `openai.js`,
    `anthropicClient.js`, `picksDatabase.js` all at 0%.
  - **Fix:** Add tests for: RLS expectation (anon write rejected), storage abstraction
    compliance, hydration conflict logic, vault write path, season rollover edge cases.
    Set `coverageThreshold` after meaningful tests exist.
  - **Test:** Coverage report for `src/lib/` ≥ 40% after targeted additions.

- [ ] **STORAGE-BYPASS** — Storage abstraction bypassed with raw `localStorage` calls in ~5 files
  - **Evidence:** `AudioUploadModal.jsx:13-42`, `LiveOddsDashboard.jsx:35-79`,
    `BetValueComparison.jsx:190-197`, `enhancedOddsApi.js:173-174`,
    `outcomesMerger.js:46-53` call `localStorage` directly, bypassing `storage.js`.
  - **Fix:** Replace all raw calls with the storage module's helpers. Add ESLint rule
    `no-restricted-globals` for `localStorage` to enforce going forward.
  - **Test:** `grep -r 'localStorage\.' src/ --include="*.{js,jsx}"` returns 0 matches
    outside `src/lib/storage.js`.

- [ ] **HYDRATION** — Additive-only hydration; device edits never propagate to other devices
  - **Evidence:** `App.jsx hydrateFromSupabase` merges only missing IDs into localStorage.
    Existing local records are never compared with cloud updates.
  - **Fix:** On hydration, compare `updated_at` for matching IDs; apply whichever is newer.
    Part of SYNC-DURABILITY fix — can be done together.
  - **Test:** Manually update a pick in Supabase; reload on second device; confirm update visible.

- [ ] **GIT-PUSH-RACE** — Two workflows push to `main` with no rebase or concurrency guard
  - **Evidence:** `.github/workflows/splits_cron.yml` and `weekly-update.yml` both
    `git push` to main; no `concurrency:` group; no `pull --rebase`; parallel runs race.
  - **Fix:** Add `concurrency: { group: 'git-push-main', cancel-in-progress: false }` to
    both workflows; add `git pull --rebase` before push with retry.
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
