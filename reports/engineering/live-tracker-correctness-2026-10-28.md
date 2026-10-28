# Live Tracker correctness review — October 28, 2026

Base: `ba8b2e7`, branch `claude/w5-prop-cards-2026-10-11`.
Scope: display correctness, requested-week isolation, cache fallback, and cadence wording.

## Recorded losing totals displayed as Hit

The saved Week 7 GB @ DET schedule records a 17–20 final, totaling 37 points.
The saved Over 51.5 / Over 52 legs examined are already recorded as LOST.
The ledger needs no correction for those totals.

The generated page previously allowed a saved browser checkmark to override a
recorded losing result. A fictional ticket using that final score reproduced
the false Hit in Chromium against the committed generator, including on reload.
This establishes a reproducible cause; Andy's original browser marks were not read.

The generator now carries recorded WON/LOST/PUSH results into the page. Both its
render and pacing passes reconcile those results before using browser marks.
Conflicting hit/burn/push classes are reconciled as well. Marks on pending legs
are preserved; storage key names are unchanged. No ledger results are edited.

## Injury lookup and week isolation

Both the builder and live page previously requested ESPN's unfiltered current
scoreboard. A build for the upcoming week could ingest the previous week's
completed summaries, while a build with no completed/live games could instead
have an empty game-summary injury lookup. The earlier nonempty lookup therefore
does not establish correct current-week availability.

The builder and page now request the rendered season/week with `groups=50` and
filter events and browser summary requests against that week's schedule IDs.
The browser's offline sidebar fallback also excludes other weeks.

Summary HTTP failures now use the saved summary, matching network-error fallback.
No live/final summaries means an empty game-summary lookup is expected. Pregame
fantasy roster injury statuses remain a separate input. This patch does not
promote prior-week injury designations into current-week availability or replace
the required Wednesday availability refresh and roster gate.

## Cadence wording

The Tuesday toolbox schedule-ingest message now states that it writes local
caches and Supabase `games` and makes no TheOddsAPI calls. The saved, gitignored
`logs/cadence-reports/2026-w08-tuesday.md` was corrected to describe the writes,
the dry-run distinction, the already repaired cache, and the approval boundary.
No repository report generator was found: historical handoffs identify these
reports as output from external Claude scheduled reporting tasks. Their prompt
configuration was not changed.

## Verification

- Focused `npm test`: 21/21 passed across `liveTrackerRegression.test.js` and
  `scheduleIngest.test.js`; six new tracker checks cover generated-code execution,
  total direction/push handling, stale marks, builder/browser week isolation,
  and HTTP/network cache fallback.
- Headless Chromium replay: the committed generator reproduced the false Hit;
  the patched generator retained Burnt/Won/Push correctly across load and reload.
  No uncaught browser errors occurred. All browser requests were intercepted.
- Both edited scripts passed Node syntax checks. The new test passed ESLint.
  Scoped diff whitespace checks passed.
- Fixtures mock all generator filesystem and ESPN activity. Tests neither read
  private ledger contents nor write production HTML/boxscores. The full suite
  was not run; its existing tracker integration test reads real local inputs
  and can perform network requests and regenerate boxscore caches.

## Delivery state

Source fixes, regression tests, and this report form the reviewed engineering
change. Commit/push details and next-session instructions are recorded in
`handoffs/2026-10-28-0022-codex-tracker-engineering.md`.
Real tracker artifacts were not rebuilt or published. At task start, the
scheduled job had already modified both tracker HTML files and the market sync
timestamp again; those changes and the private Yahoo document were preserved.
No cadence, Supabase, account, wager, portfolio, or ledger mutation was run.
