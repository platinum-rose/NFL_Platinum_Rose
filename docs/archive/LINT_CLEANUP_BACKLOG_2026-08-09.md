# NFL Dashboard — Lint Cleanup Backlog

**Created:** 2026-08-09
**Source:** `npm run lint` (`eslint .`, whole-repo), run while validating the new
FantasyPros ADP ingest script (F-26c) — output saved to
`docs/fantasyPros_lint_output` at the time of the run. **212 problems (36 errors, 176
warnings)**, spread across dozens of files. None belong to the 4 new FantasyPros files
(`agents/lib/fantasypros-client.js`, `agents/lib/fantasypros-adp.js`,
`agents/fantasypros-adp-ingest.js`, `tests/unit/fantasyProsAdp.test.js`) — confirmed via
grep, zero occurrences of any of those filenames in the lint output. This is pre-existing
debt, unrelated to that session's work, surfaced incidentally.

**Progress:** 212 / 212 — **COMPLETE (2026-08-10, Cowork session, "your recommended
order looks good, proceed").** All 8 buckets below fixed, committed to `main` across 9
narrowly-scoped commits (`d00ee6f`, `58d27ec`, `96881b7`, `a1a896a`, `8d95231`,
`fb6a15d`, `329e0a3`, `7d4a935`, `7481da1`, `4c7971b`), and re-verified via a fresh
`npm run lint` per the Completion rule below — repo-wide `eslint .` now returns 0
problems except 7 confirmed false-positive `no-unused-vars` warnings (a
renamed-destructured-prop-used-as-a-JSX-tag pattern this repo's ESLint config
mis-flags; investigated, confirmed genuinely used at every site, deliberately left
untouched — see the `src/components/` batch commit message for full detail). `npm run
build` and the full `tests/unit/` suite (52 files, 928 tests) both clean, no
regressions. A handful of real, previously-unknown issues were also found and either
fixed or explicitly flagged-not-fixed along the way (a genuine `pushProb` bug in
`simulation.js`; ~8 half-wired features like `futures-intel-report-v2.js`'s
`valueSpotSourceLinks` gap, `PlayoffBracket.jsx`'s unreachable refresh mechanism, and
`LiveOddsDashboard.jsx`'s populated-but-unrendered `userBets` — all commented in place
with "FLAGGED (lint cleanup, ..., not fixed — needs Andy's call)" rather than guessed
at). Full narrative: ATLAS `.atlas/session_log/2026-08-10_session.json` (S326).

> **Completion rule:** Mark `[ ]` → `[x]` only when the fix is committed to `main` AND
> re-verified via a fresh `npm run lint` showing that item gone. This doc snapshots a
> point-in-time count per rule — re-run `npm run lint` for the current authoritative list
> before starting a fix pass; don't hand-edit counts here without re-running it.
>
> **Calibration note:** Same single-operator-tool calibration as `NFL_AUDIT_BACKLOG.md` —
> severities here are calibrated against runtime-correctness risk (does this rule
> violation describe code that can actually misbehave or crash) and review/maintenance
> cost (how much of the 212 is one repetitive pattern vs. genuinely distinct issues), not
> against a team-codebase style-consistency standard.

---

## 🔴 HIGH — genuine runtime-correctness bugs, not style

- [x] **HOOK-COND** — `src/components/futures/FuturesWatchList.jsx:429` — `useMemo` called
  conditionally (`react-hooks/rules-of-hooks`)
  - **Risk:** React requires hooks to run in the same order on every render. A
    conditionally-called hook can desync internal state or throw
    `"Rendered fewer hooks than expected"` depending on which branch executes — a real
    crash risk, not a lint nitpick.
  - **Fix:** Move the `useMemo` call above any early return in the component, or
    restructure so the hook always runs and the conditional logic lives inside the
    memoized callback instead of around the hook call itself.
  - **Test:** Exercise both branches of whatever condition currently guards this hook
    (in dev, via Claude in Chrome or manually) and confirm no console warning/crash
    either way.

- [x] **UNDEF-VAULT** — `agents/vault-rebuilder.js:382` — `buildPickPerformanceMd` is not
  defined (`no-undef`)
  - **Risk:** A real `ReferenceError` waiting to happen if this code path executes.
    Possibly a leftover from the truncation incident already documented in
    `.claude/rules/lessons-learned.md` (F-34/CORE-BUG in ATLAS, S310) — that fix
    reconstructed `aggregateExpertLedger()` and a couple of helpers, but this callsite
    references a function that was apparently never defined (or was lost) separately.
  - **Fix:** Either the function needs to be implemented, or this callsite is dead/stale
    and should be removed. Needs a read of the surrounding function to determine which —
    not a mechanical fix, needs actual investigation of intent.
  - **Test:** `node --check agents/vault-rebuilder.js` (syntax) plus whatever existing
    test coverage exists for the calling function (check for a
    `tests/unit/vaultRebuilder*.test.js`).

---

## 🟠 MEDIUM — real anti-patterns, but likely benign here / needs case-by-case judgment

- [x] **HOOK-DEPS** — `react-hooks/exhaustive-deps`, 18 occurrences across
  `AnalyticsDashboard.jsx`, `BankrollDashboard.jsx`, `MatchupCard.jsx`,
  `FuturesOddsMonitor.jsx`, `FuturesPortfolio.jsx` (×3), `HedgeCalculator.jsx`,
  `ParlayTracker.jsx` (×3), `PlayoffBracket.jsx`, and others — full current list via
  `npm run lint`.
  - **Risk:** Mixed. Some are genuine missing-dependency bugs (stale closures — the
    effect/memo reads a value that changed but doesn't re-run). Others are the opposite:
    an "unnecessary dependency" warning where a newer, stricter version of the rule
    flags something that was previously fine (several `refreshKey` deps flagged as
    unnecessary — likely intentional manual-refresh triggers, not bugs).
  - **Fix:** Not a blanket auto-fix. Each needs a quick read of whether the flagged
    dependency is genuinely stale-closure-risky or an intentional pattern the newer rule
    version doesn't recognize. Do NOT run `eslint --fix` blindly on this rule — a wrong
    auto-fix can introduce infinite render loops.
  - **Test:** Manually exercise the affected component after each fix (state updates
    correctly, no render-loop warnings in console).

- [x] **HOOK-STATIC** — `react-hooks/static-components`, 37 occurrences — heaviest single
  concentration in `src/components/layout/Header.jsx` (`NavTab`, `ToolButton`,
  `IconButton` all defined inside the parent component body) and
  `src/components/futures/FuturesPortfolio.jsx` (`SummaryCards`, `PositionsView`,
  `ExposureView`). Full current list via `npm run lint`.
  - **Risk:** Components defined inside another component's render function get
    recreated every render, which resets their internal state and defeats React's
    reconciliation/memoization. Real anti-pattern — but every instance seen so far is a
    small, stateless presentational wrapper (buttons, cards), so the practical impact is
    likely just wasted re-renders, not visible bugs. Worth fixing for correctness
    hygiene, not urgent.
  - **Fix:** Hoist each inline component definition to module scope (outside the parent
    function), passing whatever parent-scope values it needs (e.g. `activeTab`,
    `setActiveTab`) as explicit props instead of closing over them.
  - **Test:** Visual smoke test of the affected tab/panel after hoisting — same 37
    call-sites is a lot of mechanical surface area, so this is the best candidate for
    doing in batches of one file at a time with a build+visual check between each,
    rather than all at once.

- [x] **CONFIG-YAHOO** — `src/lib/yahoo.js` — 7× `no-undef` on `process`/`Buffer`
  (lines 22-44)
  - **Risk:** None — investigated 2026-08-09, this is a false positive. `yahoo.js` is a
    Node-only module (`node:fs/promises`, `dotenv/config`, `process.cwd()`) and is never
    imported anywhere under `src/` (confirmed via grep — zero React components import
    it). It's misfiled under `src/lib/`, which ESLint's config apparently assumes is
    browser-context code with no Node globals.
  - **Fix:** Either move the file to `agents/lib/` or `scripts/lib/` (matching where it's
    actually used — check `scripts/yahoo-auth.js` and any `agents/*yahoo*` callers
    first), or add a per-file/per-folder ESLint override granting Node globals to
    `src/lib/yahoo.js` specifically if moving it would break other relative imports.
  - **Test:** `npm run lint` shows 0 errors for this file after the fix; confirm
    whatever script currently invokes Yahoo auth still runs (`node scripts/yahoo-auth.js`
    or equivalent — check `package.json` for the actual command).

---

## 🟢 LOW — mechanical, low-risk, no design judgment needed

- [x] **UNUSED-VARS** — `no-unused-vars`, 126 occurrences (the largest single bucket, ~60%
  of all problems), spread across `agents/*.js`, `scripts/*.js`, `src/components/**/*.jsx`,
  and `tests/unit/*.test.js`. Full current list via `npm run lint`.
  - **Risk:** None functionally — genuinely dead code/imports/vars. Some in `agents/`
    and `scripts/` are configured as hard errors (they don't follow this repo's existing
    escape-hatch convention: unused vars allowed if prefixed `_`/uppercase, unused args
    allowed if prefixed `_` — see the rule message text itself). Most in `src/` and
    `tests/` are warnings only.
  - **Fix:** Per-occurrence: delete if genuinely dead, or prefix with `_` if it's an
    intentionally-unused destructure/arg (matching the existing convention already used
    elsewhere in this repo, e.g. `agents/portfolio-dossier.js`'s existing `_err` pattern).
    `eslint --fix` will NOT auto-fix this rule (it requires knowing intent), so this is
    126 individually-quick but manually-reviewed edits — good candidate for a
    fresh-context session working file-by-file rather than a single sweep, so each
    file's diff stays reviewable.
  - **Test:** `npm run build` + `npm test` after each batch — an unused-var deletion can
    occasionally reveal it wasn't actually unused (e.g. referenced via a string/dynamic
    key eslint can't see statically).

- [x] **HOOK-SETSTATE** — `react-hooks/set-state-in-effect`, 8 occurrences (`AuthGate.jsx`,
  `DevLab.jsx`, and others via `npm run lint`).
  - **Risk:** Low — newer React-guidance-era rule flagging `setState` called directly
    inside a `useEffect` body. Often fine (e.g. `AuthGate.jsx`'s case: passing through
    when Supabase isn't configured), but the modern pattern prefers deriving state during
    render or via an event handler where possible.
  - **Fix:** Case-by-case; several of these may be legitimately fine as-is and just need
    an eslint-disable comment with a one-line reason, rather than a structural rewrite.
  - **Test:** N/A beyond existing component tests — low risk either way.

- [x] **MISC-SMALL** — `no-useless-escape` (2: `agents/portfolio-synthesize.js:597`,
  `scripts/parse-adp.js:87`), `no-empty` (2: `scripts/build-beat-nuggets-importer.js:88`,
  `scripts/build-public-sentiment-classifier.js:37`),
  `react-hooks/preserve-manual-memoization` (2, `ParlayTracker.jsx`)
  - **Risk:** None — cosmetic. `no-useless-escape` is a literal unnecessary `\` character
    in a regex/string. `no-empty` is an empty `catch {}`/block — likely deliberate
    swallow-and-continue, just needs a `// intentionally empty` comment to satisfy the
    rule or a `// eslint-disable-next-line no-empty` if that's genuinely the intent.
  - **Fix:** Trivial one-line-each fixes, no judgment needed.
  - **Test:** `npm run lint` shows these specific lines clear.

---

## Recommended approach for the future session

1. Start with 🔴 HIGH (2 items) — these are real bugs, worth fixing regardless of
   whether the rest of this backlog ever gets touched.
2. Then 🟢 LOW `MISC-SMALL` + `CONFIG-YAHOO` — quick wins, clears 9 items fast.
3. Then `UNUSED-VARS` in batches by directory (`agents/`, `scripts/`, `src/components/`,
   `tests/`) — each batch independently reviewable/commitable, `npm run build` + `npm
   test` between batches.
4. `HOOK-STATIC` and `HOOK-DEPS` last — highest judgment-per-fix ratio, benefit from a
   session with full attention rather than being squeezed in.
5. Do NOT attempt all 212 in one commit — stage by rule/directory like the pattern
   `docs/PROJECT_CONSOLIDATION_RUNBOOK.md` and the S307-S309 commit-sweep sessions already
   established for this repo (narrow, reviewable diffs over one large sweep).
