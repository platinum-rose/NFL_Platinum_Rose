# Pipeline and capture audit (November 2026)

Platinum Rose · written Mon 11/16 by Claude (Fable run) · audit and propose only. Nothing below was applied except the closing-line capture, which sits on branch `claude/closing-line-capture-2026-11` (commit `a9784148`) for Andy's review.
Evidence scripts: `w10/regrade_ledger.py`, `w10/bankroll_reconcile.py`, `w10/a4_clv.py`, `w10/dkp_pricing.py`. Log reads are from `logs/*.log` on 11/16 10 PM PT. GitHub workflow run history was not checked (no GitHub credentials on the bridge): workflow rows show the schedule only.

## 1. The three findings that matter most

1. **The nightly settler that mis-grades Unders is `scripts/reconcile-settlement.mjs`, not `settle_from_mobile_state.py`.** It runs every night at 2:30 AM PT from `scripts/windows/hidden-tasks/settlement-reconciliation.cmd` (45 runs logged since September) and writes the ledger without `--dry-run`. Its player-prop branch ignores direction: `actual > line ? 'WON' : ... 'LOST'` (line 143). Every prop Under is graded as an Over. It also leaves any market it doesn't know (carries, completions, 2+ TD, first TD, kicker props, `anytime_td`) as PENDING, counts only rushing/receiving/defensive TDs for anytime TD (no return TDs), and settles a ticket as a loss on the strength of a wrong leg grade. The W10 legs it touched carry no `grading_note`, which is how it was traced: `settle_from_mobile_state.py` always writes one. The mobile tracker's own grader handles `direction: under` correctly.
2. **The ledger's leg grades are clean today.** An independent re-grade of 1,930 NFL legs (W1-10) from cached ESPN box scores disagrees with the stored grade on 2 legs. One is real: W5 Cameron Thomas "1+ Sacks" is stored PUSH with 0.5 sacks and should be LOST (ticket lost anyway). The other is the W10 2H spread, which the stored grade has right. No ticket result is wrong. Every Under leg from W1-9 with a numeric stat matches. So the leg-type hit rates in the post-mortem can be trusted; they come from the weekly pipeline's re-grade, not from the settler.
3. **There is no single definition of "season bankroll" in code.** No script reads `bankroll_exempt`. The handoff numbers were computed by hand in chat. Section 4 shows what each one was.

## 2. Task inventory

Status key: OK / degraded / broken / unused. "Feeds synthesis" = read by the Saturday synthesis queue, the Master Intel pull or the card builder.

### Windows scheduled tasks (`scripts/windows/hidden-tasks/*.cmd`, set up by `scripts/setup-*.ps1`)

| Task | Purpose | Output | Last log write | Feeds synthesis | Status |
|---|---|---|---|---|---|
| settlement-reconciliation | nightly ESPN grade + settle of placed tickets | ledger, `docs/tracked-wagers/reconciliation-latest.*` | 11/16 2:30 AM | no (writes the ledger) | **broken** (Under legs inverted; see 1) |
| toolbox-tuesday | odds/schedule refresh, roster audit, post-mortem, BEO futures, dossiers | many | 11/10 | yes | **degraded**: `UnicodeEncodeError` (cp1252, U+2212) in the 11/10 log; post-mortem step needs the UTF-8 fix confirmed on the next run |
| toolbox-wednesday / -pm | intel intake, bookmarks | `data/intel`, `data/twitter` | 11/11 | yes | OK (278 of 318 bookmarks skipped as non-target: noisy, not wrong) |
| toolbox-thursday | TNF prep, live market lines | `data/supercontest/live-market-comparison.json` | 11/12 | partly | **degraded**: live-market step fails until that week's SuperContest lines are saved (79 failures logged) |
| toolbox-friday / -saturday / -sunday / -monday | cadence builds | reports, queues, trackers | 11/13, 11/14, 11/15, 11/10 | yes | OK |
| weekly-archive | week archive + `team-weeks.csv` | `data/archive/2026/week-NN` | 11/12 | yes (post-mortems) | OK, but W10 not archived as of 11/16 (runs Thursday): the Tuesday post-mortem graders that read the archive path cannot run before then |
| research-intel-sync | research intel cron | `data/research-intel` | 11/16 10 PM | yes | OK |
| grok-thread-scanner | X thread scan | `.nfl/reports` | 11/16 10 PM | yes (narratives) | OK (2.7 MB log: rotate) |
| live-tracker-builder, live-odds-sync, screenshot-watcher | trackers | `public/` | 11/16 | no | OK |
| player-availability-sync | injuries/statuses | `data/player-availability/latest.json` | 11/16 3:30 PM | yes | **degraded**: FantasyPros injuries API "fetch failed"; one write failed with a file lock |
| daily-brief | daily brief | report | 11/16 | no | OK |
| podcast-ingestion-sync | podcast download + AssemblyAI transcripts | `data/podcasts` | **10/14** | was | **broken / unused**: AssemblyAI balance negative since 10/14. Podcast picks now come from the Gemini/Antigravity sweeps. Disable the task |
| twitter-bookmarks-sync | bookmarks | `data/twitter` | **10/15** | was | **unused** as its own task (0 ingested on last runs; the Wednesday toolbox step does the work) |
| twitter-harvester-daemon | X harvester | — | **10/1** | no | **unused** |
| yahoo-survivor-sync | survivor standings | `data/survivor` | 11/16 5 PM | no | **unused**: Yahoo returns 500, and Andy's survivor entries are eliminated. Disable |
| fantasy-waiver-sync | waivers | `data/fantasy` | 11/11 | no | OK (Yahoo Fantasy API otherwise still blocked for the archive capture) |

### GitHub workflows (`.github/workflows/`, schedule in UTC; run history not verified)

| Workflow | Schedule | Paid API | Feeds synthesis | Note |
|---|---|---|---|---|
| game-odds-ingest | Sun x4, Mon pre-MNF, Tue-Sat daily | TheOddsAPI | yes (schedule cache, fair lines) | Only source of closing lines until now, and only in Supabase. Closing lines are now free from ESPN (section 5) |
| futures-odds-ingest | Tue, Fri | TheOddsAPI | no (futures) | keep |
| betting-splits-ingest | every 2 h Sun/Mon/Thu | none | yes | Splits showed no edge (review report, public sides 46-44): 36 runs a week is more than the signal is worth. Cut to 2 a day on game days |
| injury-ingest | Mon/Wed/Thu | none | yes | duplicates player-availability-sync |
| research-intel-ingest | daily + Thu + Sun | LLM | yes | duplicates the local research-intel-sync task |
| podcast-ingest | Tue-Fri | AssemblyAI/LLM | was | same dead path as the local task: check it is not still billing |
| pick-extraction | manual | LLM | yes | OK |
| nfl-auto-grade, props-auto-grade | hourly Sun/Mon/Thu nights | none | no | grades Supabase picks; a third grader beside the tracker and the reconciler |
| nfl-daily-brief, weekly-update, nfl-roster-refresh, intel-to-vault-sync | daily / weekly | LLM (brief) | partly | OK |
| nflverse-data-refresh, stats-to-vault-sync | once a year (Mar 1) | none | yes | in-season nflverse refresh is done by the Tuesday toolbox instead |
| x-sharp-ingest | schedule commented out | Grok | — | unused |
| odds-ingest, ci, deploy, smoke-test | manual / push | — | — | not capture |

### Capture buttons (Toolbox app, CDP ports 9222-9224; Andy runs them on Windows)

| Capture | Status | Evidence |
|---|---|---|
| BKR live / gamelines / sportsbook | OK, needs manual login | 3 captures W10 (11/13-15) |
| BEO live + Props Builder | OK when run by hand | Props Builder raw on 11/14 and 11/15 only: the scheduled sync still skips it |
| DKP event feed | **degraded** | Slow (~1 game a minute). **No QB INT rows and no kicker FG rows in any feed file** (W6, W8, W10 all 0); receptions are O/U only, no milestones. 11 of 24 W10 DKP tickets had a leg the feed could not price |
| Kalshi props | OK | 1 file W10 |

## 3. Freshness for the W10 Saturday synthesis (A6)

Queue built Sat 11/14 7:45 PM PT. Age of each input at build time:

| Input | Age | Verdict |
|---|---|---|
| BKR game lines, Master Intel pull, weather, availability, projected starters, roster vet | 3-4 h | fresh |
| podcast picks | 7 h | fresh |
| slate, AN openers, AN primer, secondary matchups, power ratings | 23-24 h | fine (weekly inputs) |
| **prediction markets, props intel, FTN context** | **29 h** | stale for a Saturday-night build: props intel predates Saturday's line moves |
| **article intel review** | **83 h** | stale: Wednesday's review fed Saturday's synthesis |
| SuperContest lines | 56 h | fine (fixed contest lines) |

No input was newer than the build (no leakage). W8 and W9 queues were not re-audited beyond the W9 check in the first post-mortem (clean).

## 4. Bankroll reconciliation

`w10/bankroll_reconcile.py` sums the settled ledger eight ways. The handoff numbers come out as follows.

| Quoted number | What it actually is | Reproduces? |
|---|---|---|
| W10 bankroll **-$226.68** | `profit_usd` × Andy's share, excluding `bankroll_exempt`, week 10 | yes |
| "bankroll-exempt **+$548.15**" | the **season** total of exempt tickets before MNF (W8-10), not a W10 number. After the $10 FDP loss on MNF it is **+$538.15** | yes |
| season **-$490.35** (pre-MNF) | the same recipe gives **-$589.35** pre-MNF. The quoted figure is exactly $99.00 higher; no script, doc or note explains the $99 | **no** |
| season -$554.83 (post-MNF) | -$490.35 carried forward. Same recipe on today's ledger: **-$653.83** | no |
| "ledger sum about -$312.76" | same recipe, but the 14 split tickets that have `is_split` and no `ownership_shares` (mostly W8) are counted 100% Andy's | yes, but wrong: it gives Andy all of Alejandro's W8 winnings |

Why no figure is safe to quote yet:
- **14 split tickets have no `ownership_shares`** (+$474 profit between them). Counting them at 50% vs 100% moves the season by $341.
- **45 promo-funded tickets (+$196 profit) and 31 cash-flagged DK Predictions tickets are not marked exempt**, though Andy's rule is that DKP is off the bankroll and booked at the account's real-money result. In W10 the TNF DKP tickets are exempt and the Sunday/MNF ones are not. With every DKP/Pick6 ticket excluded, W10 is **-$62.07** and the season **-$800.15**.
- The post-mortem scorecard (`lib.is_cash`) uses a third rule: cash-funded tickets at full ticket value, no shares, no exemptions (W1-10 **-$532.11** excluding the legacy fill).
- 4 W1 tickets have no `profit_usd`; one W9 ticket (`cash+bonus`) has profit -$5 against a $7.50 stake.

Proposed fix (not applied): one function, `scripts/lib/bankroll.mjs`, used by the tracker, the settlement statements and the post-mortem, with the rule Andy confirms in decision 1 of the handoff; plus a one-time backfill of `ownership_shares` and `bankroll_exempt`.

## 5. Closing lines (audit A4): built, on a branch

ESPN's public game summary already carries DraftKings open and close numbers (`pickcenter`), and the post-mortem caches those summaries. So closing lines for **all 150 games of W1-10 were already on disk**; nothing needed Supabase or TheOddsAPI.

- `scripts/closing-lines/capture_closing_lines.py` writes `data/official-picks/closing-lines-2026.json` (150 games) and `closing-line-values-2026.json` (705 side/total legs from the placed and paper ledgers). Read-only on the ledgers (hash checked before and after). 8 unit tests pass.
- Sanity check against our own BKR captures (W9 Sat, W10 Fri, 27 games): spread within 1 point on 24, mean gap 0.63; total mean gap 0.54.
- Not wired into `toolbox.mjs` (that file has uncommitted changes of Andy's). The two-line Tuesday hook is in `scripts/closing-lines/README.md`.
- Diff for review: `git diff eef3603e claude/closing-line-capture-2026-11` (3 new files, 387 lines, no existing file touched).

A4 result on the history it recovered is in the post-mortem, section 6b.

## 6. Ranked fixes (by effect on pick accuracy first)

| # | Fix | Why | How (not applied) |
|---|---|---|---|
| 1 | **Stop `reconcile-settlement.mjs` writing the ledger** | It corrupts Under legs and half-settles tickets every night; hand corrections are then needed (44 legs in W10) | In `settlement-reconciliation.cmd` add `--dry-run`; or patch `gradeLeg`: `const under = String(leg.direction \|\| '').toLowerCase() === 'under' \|\| /\bunder\b/i.test(leg.selection);` and return `under ? (actual < line ? 'WON' : actual === line ? 'PUSH' : 'LOST') : (...)`. Better: delete its grader and import the mobile tracker's `gradeLeg`, so there is one grader |
| 2 | Add QB INT, kicker FG and reception milestones to the DKP feed parser | QB INT is the best prop category (64%) and the feed cannot price it; 11 of 24 W10 DKP tickets had an unpriced leg, which blocks calibration and price checks | `scripts/props/draftkings-prediction-dump-parse.mjs`: map the "Interceptions Thrown", "Field Goals Made" and "Receptions X+" market names (they currently fall into `other`, 187 rows on 11/15) |
| 3 | Re-run article review and props intel on Saturday before the synthesis queue | Saturday synthesis used an 83-hour-old article review and 29-hour-old props intel | add both to `toolbox --cadence saturday` ahead of the queue build; fail the preflight if either is older than 24 h |
| 4 | Wire the closing-line step into Tuesday | CLV is the only accuracy signal that doesn't need hundreds of results | hook in the README of the branch |
| 5 | One bankroll function + backfill of shares/exempt flags | No season ROI can be quoted until then | section 4 |
| 6 | Log leg prices on DKP tickets at placement | 163 of 232 W10 legs have no price, so leg-level break-even can't be judged | at logging time, copy the feed price for each leg into `legs[].price` with `price_source: dkp_feed` |
| 7 | Disable dead tasks: podcast-ingestion-sync, twitter-bookmarks-sync, twitter-harvester-daemon, yahoo-survivor-sync, x-sharp-ingest | No output since October (or failing); the podcast path can still spend AssemblyAI money if topped up | `Disable-ScheduledTask`; comment the cron in `podcast-ingest.yml` |
| 8 | Cut betting-splits-ingest from every 2 h to twice on game days; drop injury-ingest.yml (duplicate of the local availability sync) | Splits add nothing measurable (review report); duplicate captures | edit the two cron blocks |
| 9 | Let the Tuesday post-mortem graders read `reports/bets/season-recap/wNgamesum.json` when the archive folder is missing | `grade_podcast_picks.py` and `grade_experts.py` cannot run until Thursday's archive; this run needed a wrapper | 2-line path fallback (as done in `grade_experts.py` here) |
| 10 | Rotate `grok-thread-scanner.log`, `twitter-bookmarks-sync.log` (34 MB), `twitter-harvester-daemon.log` (14 MB) | housekeeping | — |

## 7. Known suspects: status

| Suspect | Finding |
|---|---|
| BKR capture needs a manual login | still true; captures ran 11/13-15 |
| DKP capture ~1 game/min | still true (13 games on 11/14) |
| Scheduled BOL sync skips Props Builder | still true: Props Builder files exist only for the hand-run captures |
| DKP feed spread rows team-flipped (W6) | **not reproduced**: W6, W8 and W10 feeds show the favorite with the negative line. But spread rows carry `team: null` (name only in `label`), so any consumer keying on `team` will mis-join |
| No QB INT markets in some DKP feeds | worse: **none in any feed** (fix 2) |
| Futures ledger path warning in the partner tracker build | not re-tested |
| Yahoo Fantasy API blocked | still failing (500 on survivor group); archive capture still blocked |
| Falsy-zero bug in `src/lib/predictionMarkets.js` | fixed 9/26 (comment at line 14); the one remaining `\|\| 0` (custom fee) is harmless |
| Season bankroll doesn't reconcile | section 4 |
| Settler inverts Unders | section 1; earlier weeks are clean |
| `.git/objects/maintenance.lock` | left by the 11/16 8:37 PM commit, not by this run; rename it to `.git/stale-maintenance-lock` if git complains |
| Prompt says W11 TNF is "HOU @ IND" | ESPN and the tracker have **IND @ HOU** (the 9-team's HOU -9.5 leg is a home favorite) |
