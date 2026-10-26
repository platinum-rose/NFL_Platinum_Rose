# Codex handoff — Hedge Watch engineering and mobile tracker safety

**Prepared:** 2026-10-26 PT
**Repo/branch:** `E:\dev\projects\NFL_Dashboard`, `claude/w5-prop-cards-2026-10-11`
**Implementation checkpoint:** `35525d4` (`Hedge Watch: calibrate and harden mobile tracker`)
**Starting context:** [Claude H2C2 briefing](2026-10-26-0745-claude-h2c2-codex-briefing-w7-mobile-tracker-hedge-watch.md) and [mobile tracker runbook](../docs/MOBILE_LIVE_TRACKER.md)

## Completed

- Added `tests/unit/hedgeAlerts.test.js`: seven unit tests for odds conversion, scenario-grid normalization, push semantics, equalizing hedge math, round-robin returns, opposing-side conflict detection, and the W7 SNF replay recommendation.
- Kept the replay check passing after calibrating `scenarioGrid()` from the available nflverse data. That file contains only 93 completed 2026 regular-season games (Weeks 1–7), so this is a provisional fit, not a stable multi-season estimate. See [calibration report](../reports/verification/2026-10-26-hedge-model-calibration.md).
- Hardened the mobile generator: ESPN scoreboard, box-score, and odds-summary failures now exit before outputs are written; a pending-ticket week with no returned events is rejected; `--season` defaults from ESPN; `--no-paper` skips paper data and rendering. Updated the runbook.
- Identified the number-format writer and proposed a shared format in [the churn report](../reports/verification/2026-10-26-ledger-number-format-churn.md). No ledger write was made.
- Wrote a [Week 5–7 parity report](../reports/verification/2026-10-26-mobile-grader-parity-weeks-5-7.md). Full re-grading is still incomplete: no real-ticket grades remain in the saved W7 state, no W5/W6 mobile state was found, and ESPN requests failed in this environment. The report explicitly does not claim zero mismatches.

## Verification

| Command | Result |
|---|---|
| `node scripts/hedge-alerts-replay.mjs` | PASS after calibration; SEA −3 flex hedge, SEA 8+/Under dead zone, cover wins at 20–3 |
| `node node_modules/vitest/dist/cli.js run tests/unit/hedgeAlerts.test.js` | 7 passed |
| `node --check scripts/generate-live-tracker-mobile.mjs` | Passed |
| `node --check scripts/lib/hedge-alerts.mjs` | Passed |
| `node scripts/generate-live-tracker-mobile.mjs --week 7` | Could not refresh: ESPN DNS `ENOTFOUND`; old code incorrectly exited 0 and wrote CHECK-only output |
| `node scripts/generate-live-tracker-mobile.mjs --week 7 --season 2026` after hardening | Exited nonzero on ESPN failure; all three pre-run tracker artifact hashes remained unchanged |

The failed baseline outputs were restored from the supplied H2C2 snapshot; the restored files matched the snapshot hashes. No public tracker was republished. No bets, sportsbook accounts, Supabase, paper ledger, or real wager ledger were changed.

## Open engineering items

1. Complete parity re-grading for Weeks 5–7 when ESPN is reachable; compare mobile grades to recorded leg/ticket results and extract desktop grades if possible. Keep mismatches report-only; do not edit ledgers.
2. Before Thu 2026-10-29, run `node scripts/generate-live-tracker-mobile.mjs` after ESPN flips to Week 8 and confirm `week auto → 8`. This could not be verified on 10/26 because ESPN DNS was unavailable.
3. Revisit calibration with a multi-season closing-line data set. Current source is only 93 games.
4. Add byte-level serialization parity coverage if Andy adopts the proposed canonical number format.
5. Ask Claude/Andy to propose scheduled Hedge Watch coverage times for the uncovered 1:05/1:25 PM, Saturday, and international windows; schedule edits remain a Claude/Andy action.
6. Investigate read-only live-line sources without TheOddsAPI or sportsbook login; proposal only.
7. `.nfl/incoming/` and old `.nfl/commit-msg-*.txt` are pre-existing untracked files. Do not delete them; consider gitignore only with Andy.

## Questions for Andy (from H2C2 §6c; undecided)

1. Who owns MNF DAL @ PHI grading tonight: the existing Claude 8:45 PM check-in (default) or Codex?
2. Does Andy authorize a bankroll sync for the 21 Week 7 settlements? This is a Supabase write and has not been run.
3. Should paper grades be written back to `paper-wagers-2026.json` so Weeks 2, 4, and 7 records are permanent?
4. Should Codex backfill paper tracking for Weeks 5–6?
5. Keep alerts banner-only, or revisit push/email if Andy misses alerts?
6. Carryovers: start a client edition of the Master report in Week 8? Fix the BEO prop scraper's three-game coverage and unpriced IDP/QB-pressure markets? Re-send the stale client PDF only if Andy asks?

## Resume prompt

```text
Resume Platinum Rose NFL. Implementation checkpoint = 35525d4 on claude/w5-prop-cards-2026-10-11. Scoped hedge-alert suite: 7/7 passed; replay PASS. The mobile generator now fails safely before writes when ESPN is unavailable. Read this dated handoff, then reconcile live Git and load only the H2C2 briefing and linked reports as needed. Next: retry ESPN, complete Weeks 5–7 parity without ledger edits, and before Thu 10/29 verify --week auto resolves to 8. Keep all sportsbook, Supabase, ledger, publish, and scheduled-task boundaries from the H2C2 briefing. Surface the six Andy decisions listed here; do not decide them.
```
