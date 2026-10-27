# Handoff chain digest: H2C2 Week 7 MNF close → Claude Team 2

> **Corrections header (Claude Team 1, 2026-10-26 22:20 PT, checked against live git and the ledgers).** The
> briefing `handoffs/2026-10-26-2215-claude-h2c2-claude2-briefing-w7-mnf-close.md` takes precedence over anything below.
> 1. **The 8:45 PM MNF check-in ran.** Commit `7ab6fb0` (20:46 PT, session `01Hie8K6…`) settled every MNF real
>    ticket and touched only `user-placed-wagers-2026.json` and the trackers, not the paper file. All 43 MNF legs are
>    graded (32 WON, 11 LOST). Items the digest leaves open about "whether it ran" are resolved.
> 2. **Real Week 7 is final:** 39 tickets, $387.51 risked, 2 won, 37 lost, net **−$234.99**. MNF alone was 8 tickets,
>    $63.39 risked and −$1.39 net, with one win: DKP 46908050 (+$52.01, Paid $62.00, confirmed by Andy 21:40 PT, `21864cf`).
> 3. **§7k and §7l were never placed as written.** They are paper only (`d8e26bf` and `5d0824d`). Andy's 8 real MNF
>    tickets are his own builds, partly drawn from §7k legs and the S1–S3 ideas. They are listed in
>    `week7-ticket-ledger.md` in this folder.
> 4. **Paper Week 7 (tracker grades, not stored):** 43 tickets, 41 decided (5 cashed, 36 burnt, −$269.01). The Master
>    RR lost, since the game total was 59. Still open: §7l S1 Kickers' Game and S3 Defense, whose legs need a manual
>    box-score check.
> 5. The BetOnline 3:32 PM capture is Andy's own Toolbox capture file
>    (`data/generated/props/betonline-live-2026-10-26-week7.pregate.raw.txt`). Claude only parsed the captured text.
>    It did not open BetOnline in a browser.
> 6. The DAL@PHI box score `data/fantasy/boxscores/espn-401873009.json` now exists locally. The Codex football-stats
>    exporter can be rerun to include MNF.
> 7. More after-hours work, not in any Codex doc:
>    - Gary 0.5+ sack-line fix (`003e861`)
>    - weekly prop-scraper cadence, registered live by Andy (`08256bc`)
>    - Yahoo API briefing for Codex (`0493dfd`)
>    See the briefing §2.
> 8. During extraction, the harness flagged an instruction-shaped pattern ("settings-json"). It comes from the
>    digest's mentions of `.claude/settings.json`; nothing in it is an instruction.

---

# NFL_Dashboard ("Platinum Rose") handoff digest, Mon 2026-10-26, 07:45 to 22:00 PT (Week 7)

Sources: the 12 files listed in the request, all read in full. Facts are taken from those files. Where something is inferred, the text says so. The one outside fact used is the MNF final, DAL 38–21, which comes from the request and not from any doc.

---

## 1. Timeline for the window

The Codex docs carry a date (2026-10-26) but no clock time. Their order below follows the "Prior … checkpoint" chain in `HANDOFF.md`. The card sections carry their own PT times.

- **~07:45 PT: Claude H2C2 briefing.** File: `handoffs/2026-10-26-0745-claude-h2c2-codex-briefing-w7-mobile-tracker-hedge-watch.md`. Author is Claude, session `session_01Hie8K6ufGgMMFoMSR7PbFV`, handing off to Codex.
  - It covers 16 commits from `24aa570` (Sun 10/25 14:00) to `b98a243` (Mon 10/26 07:33), plus its own handoff commit. That commit's hash is not stated.
  - Branch `claude/w5-prop-cards-2026-10-11`. `origin/main` = `61da10a`, which is not the working branch.
  - Week 7 real money: 31 tickets, $324.12 risked, net **−$233.60**. The only win is DKP 45488862 (+$72.06).
  - Paper: 35 tickets, $520 paper risk, decided paper P/L **−$159.01**. Still open: `paper_w7_card_master_round_robin_8_legs_by_4s`. It has one live 4-team combo worth $13.02 paper, which needs DAL/PHI Under 44.
  - New this window: the mobile Live Tracker and Hedge Watch. Five scheduled Hedge Watch tasks plus one MNF one-shot check-in at 8:45 PM.
  - Window commits it lists:
    - `12159d9`: mobile tracker built, 4 tickets settled
    - `b16f0c5`: restyle
    - `3a69809`: runbook
    - `ac18d4e`: six 1 PM-window losses
    - `5434ed6`, `6b127fa`, `3dd745e`: card §7j SNF ladder (other session, `01H9kvkd…`)
    - `1dcb153`: BKR 740837231
    - `ed28ed2`: DKP 46464866 and 46447402
    - `e86b867`: Imaginary section and more auto-grading
    - `74a4590`: SNF settle, 1 win and 8 losses
    - `2add645`: Hedge Watch
    - `b98a243`: scheduled tasks and runbook
  - Earlier-session commits it lists: `24aa570`, `07b218e`, `b9b5c38`.
  - Overnight at 03:30, a job rewrote the number format in `user-placed-wagers-2026.json`. At 06:04, something outside the session regenerated `public/live-tracker-sunday.html`.
- **Same morning: snapshot package.** Location: `reports/handoff-snapshots/2026-10-26-h2c2-w7-mobile-tracker-hedge-watch/`.
  - `README.md` says it was built at HEAD `b98a243` before the handoff commit, with tool `scripts/handoff/h2c2_snapshot.py`.
  - `week7-ticket-ledger.md` has 31 real tickets (net −$233.60, 0 pending) and 35 paper tickets (−$159.01, Master RR open). It predates MNF and card §7k/§7l.
- **Codex: Hedge Watch engineering.** File: `handoffs/2026-10-26-codex-hedge-watch-engineering.md`. Checkpoint commit **`35525d4`** ("Hedge Watch: calibrate and harden mobile tracker").
  - 7 unit tests in `tests/unit/hedgeAlerts.test.js`; all 7 pass. The replay still prints PASS.
  - `scenarioGrid()` was recalibrated from only 93 completed 2026 games (Weeks 1–7). Codex calls it provisional.
  - Generator hardened: ESPN failures exit before any write, `--season` defaults from ESPN, and a `--no-paper` flag was added.
  - Wrote a number-format churn report and a Weeks 5–7 parity report. The parity work is incomplete because ESPN DNS returned `ENOTFOUND`.
  - The first unhardened run exited 0 and wrote CHECK-only output. Those outputs were restored from the H2C2 snapshot, with hashes matching.
- **Codex: ESPN lookup alignment.** File: `handoffs/2026-10-26-codex-espn-lookup-alignment.md`. No commit hash given.
  - New shared helper `scripts/lib/espn-http.mjs`. `generate-live-tracker-mobile.mjs` and `scripts/reconcile-settlement.mjs` now use it.
  - Live DNS still fails: `getaddrinfo ENOTFOUND site.api.espn.com`.
  - Andy's "Monday cadence" settlement preview did reach ESPN, but it gives ticket outcomes, not per-leg grades.
- **Codex: Week 7 post-mortem data pack.** File: `handoffs/2026-10-26-codex-week7-postmortem-data.md`. No commit hash given.
  - Report: `reports/analysis/week7-postmortem/w07-postmortem-data-2026-10-26.md`, plus `official-ticket-summary-2026-10-26.csv`.
  - 13 finals compiled; DAL@PHI pending.
  - 31 real tickets: $324.12 risk, $90.52 gross payout, −$233.60 net (−72.1% return on risk), 1–30.
  - Leg rows: 189 in total; 49 are still `PENDING`/`OPEN`.
- **Codex: Week 7 football stats.** File: `handoffs/2026-10-26-codex-week7-football-stats.md`. No commit hash given. This is the newest Codex doc; `HANDOFF.md` points here.
  - New exporter `scripts/analysis/week7-postmortem/compile-game-data.mjs` and report `w07-football-stats-2026-10-26.md`.
  - Exports: 26 team rows, 6,523 player-stat entries, 106 scoring plays, 14 scoreboard rows.
  - 573 points across 13 games; 8,936 total yards.
- **`HANDOFF.md` updated.** PICK UP HERE now points to the football-stats handoff, with the chain listed above. The 10/24 SuperContest correction block is marked "Superseded, kept for history" (`34b0781`).
- **3:32 PM PT: BetOnline Monday capture** (`betonline-live-2026-10-26-week7.pregate.raw.txt`; directory not given): DAL −4, total 43.5, DAL TT 24.5, PHI TT 19.5. 3:45 PM PT: inactives checked. Both come from card §7k.
- **4:19 PM PT:** Andy asked for a two-sided alternative to the one-sided Dallas moonshot (§7l).
- **4:20 PM PT: card §7k, MNF fresh island ladder,** at Andy's direction, BKR same-game.
  - T1: $10 at +704 (est.)
  - T2: $5 at +2,203 (est.)
  - T3: $5 at +8,065 (est.)
  - It supersedes the "Monday DAL@PHI island ladder — preliminary only" section and drops game Under 44.
- **4:25, 5:02 and 6:45 PM PT:** Hedge Watch runs were scheduled (briefing §4.3). No doc reports what they found.
- **4:27–4:50 PM PT: card §7l, MNF follow-up stacks,** at Andy's direction, "paper-tracked so the record is complete":
  - T1 BKR-available rebuild: $10 at +772. It was rebuilt at 4:27 PM after Andy found no Dallas team-FG total at BKR.
  - T3 shootout alternative: $5 at +11,921
  - S1 Kickers' Game: $5 at +1,825
  - S2 Dallas Supporting Cast: $5 at +1,862
  - S3 Defense: $5, unpriced
- **5:15 PM PT:** MNF DAL @ PHI kicked off. Final, per the request: DAL 38–21. No doc in the set records it.
- **8:45 PM PT:** the scheduled Claude check-in `trig_01XRCbyhm6aKCLXNk14CTeif` ("Mobile tracker: MNF final grading") was due. No doc in the set reports its result.
- **After 18:00 PT: Yahoo briefing.** File: `docs/YAHOO_FANTASY_API_ACCESS_FOR_CODEX.md`, by the Claude team at Andy's request, inspection only. The "after 18:00" timing is inferred: the doc cites the `NFL_Dashboard_Yahoo_Survivor_Sync` run at 2026-10-26 18:00 PT. It finds Yahoo working: 5 fantasy leagues, plus Pick'em and Survival groups.

---

## 2. Workstreams and their current state

### 2.1 Mobile Live Tracker (phone edition)

**What exists.** A single dark-only page, published as Andy's private artifact https://claude.ai/artifact/Q7NBq3G5MLgzVzraUPsuiy, which is on his Android home screen. It contains:
- a header with Cash Risk, Potential Win and Total Cashed
- a Game Board strip
- Live Active Slips
- the Hedge Watch banner
- a collapsible 📝 Imaginary (paper) section

The artifact sandbox blocks ESPN fetches. Grading therefore happens at build time on Andy's machine, and the HTML is republished to the same URL. The page shows "Graded h:mm · X min ago" and turns amber after 45 minutes. Runbook: `docs/MOBILE_LIVE_TRACKER.md`.

**Commands** (repo root):
```
node scripts/generate-live-tracker-mobile.mjs            # --week auto (default) or --week N
python3 scripts/settle_from_mobile_state.py              # dry run
python3 scripts/settle_from_mobile_state.py --apply      # writes data/official-picks/user-placed-wagers-2026.json
node scripts/generate-live-tracker.mjs --week N          # desktop tracker sync
node scripts/hedge-alerts-replay.mjs                     # must print PASS
```
Codex added `--season` (defaults from ESPN) and `--no-paper`. Its verification run used `node scripts/generate-live-tracker-mobile.mjs --week 7 --season 2026`.

**Outputs:**
- `public/live-tracker-mobile.html` (committed; an artifact fragment with no `<html>/<head>`)
- `public/live-tracker-mobile-state.json` (gitignored)
- `public/hedge-alerts.json` (gitignored)

**Grader coverage:**
- Spread, moneyline and total, including `sgp_` and `alternate_` variants.
- Player props: receptions, receiving/rushing/passing yards, carries, completions/attempts, pass TDs, INTs, tackles+assists, sacks, FGs made, kicking points, anytime TD and 2+ TD, sacks taken, longest reception.
- First TD from ESPN `scoringPlays`, total FGs both teams, and team TDs.
- Round robins are graded per combo, by `leg_nums` (paper) or `teams` (real).
- An over prop locks as a hit as soon as it is cleared.
- An unknown market shows CHECK. A player missing from a final box score also shows CHECK.

**Settler rules:**
- Dry run by default.
- Skips a ticket with any CHECK leg, a cashed parlay with a push/void leg, and a round robin with combos still in play.
- Writes `status`/`actual_stat`/`grading_note` on legs, and `status: SETTLED`, `result`, `profit_usd`, `settled_payout_usd`, `graded_at` and `progress_notes` on tickets.
- Serializes with Python `json.dumps(indent=2, ensure_ascii=False)`.

**Publishing.** Only Claude can publish: stage the HTML, read the artifact by URL, then publish with `url` set to that artifact. Never create a new artifact. Codex can regenerate the HTML but cannot publish.

**Gotchas:**
- `device_commit_files` caches by source filename. Use a unique source name and check with `md5sum`.
- The desktop generator takes about 60–90 s.
- ESPN drops odds from the scoreboard once a game starts. Hedge Watch reads `summary.pickcenter` instead.

**Unfinished:**
- Grader parity for Weeks 5–7 (§2.3).
- `week auto → 8` must be confirmed before Thu 10/29. Codex could not check it on 10/26 because of DNS.
- The empty-page publish guard is done: the generator now exits non-zero on an ESPN failure.

### 2.2 Hedge Watch (`scripts/lib/hedge-alerts.mjs`)

**What exists.** Pure functions, wired in for **real tickets only**.
- **`last_game` alert:** the ticket's remaining legs are all in one game, and the return is ≥10× stake and ≥$100. It shows a full hedge (H = return / decimal price), a half hedge, P(ticket hits) and the hedge's expected cost.
- **`game_gap` alert:** a margin × total grid.
  - Margin ~ N(−spread, 13.5) with key-number weights: 3 ×2.2, 7 ×1.6, 10 ×1.3, 6/14 ×1.2, 4 ×1.15, 1 ×1.1.
  - Total ~ N(O/U, 10).
  - Flags when P(return < 15% of best case) ≥ 15% and the best case is ≥ $150.
  - Output: a 4×2 table, the best cover market, and half and full sizes.
- **Prices:** ESPN pickcenter, DraftKings first. Alt lines are model-priced with 4.5% vig and marked "est." Props are not modelled; a ticket down to a single prop assumes −110.
- **`HEDGE_DEFAULTS`:** minMultiple 10, minPayout 100, gapMinPayout 150, gapMinProb 0.15, deadShare 0.15, marginSd 13.5, totalSd 10, vig 0.045. These are engineering defaults, not betting rules.
- **Replay** (`scripts/hedge-alerts-replay.mjs`, W7 SNF): it must recommend SEA −3 on the $368 flex, mark SEA 8+/Under as dead, and pick a cover that wins at 20–3.

**Codex changes (`35525d4`):**
- `tests/unit/hedgeAlerts.test.js` with 7 tests: odds conversion, grid normalization, push semantics, equalizing math, RR returns, conflict detection, and the SNF replay.
- `scenarioGrid()` calibrated from nflverse, 93 games only. Report: `reports/verification/2026-10-26-hedge-model-calibration.md`.

**Verification:**
- `node scripts/hedge-alerts-replay.mjs` → PASS
- `node node_modules/vitest/dist/cli.js run tests/unit/hedgeAlerts.test.js` → 7 passed
- `node --check` passes on the generator and the library

**Unfinished:**
- Recalibrate on a multi-season closing-line data set.
- Live-line source: proposal only, with no TheOddsAPI and no logins.
- Coverage times for the 1:05/1:25 PM, Saturday and international windows.
- Backlog: a desktop "hedge spot" badge, and per-leg BKR SGP prices.

### 2.3 Scheduled Hedge Watch runs (Claude scheduled tasks on Andy's Windows desktop)

Each run regenerates with `--week auto`, republishes the artifact and reports. Runs never settle, commit or notify, and they are auto-approve.

| Task id | Name | PT |
|---|---|---|
| `trig_01TqchS6esWBzRZ2dvDAYuoW` | Sunday early check | Sun 9:25, 12:25, 4:25 |
| `trig_013jNMhFJLgfdBLM5DK6sJAH` | Sunday late check | Sun 9:50, 12:50 |
| `trig_018zUqvCa3cSWY6TjcXxtmZ8` | Mon/Thu early check | Mon/Thu 4:25 |
| `trig_019kYVd9Lxd4nPkT4EZmUf8z` | night-game late check | Sun/Mon/Thu 5:02 |
| `trig_01AE9fZVhQdGepPYKRzRmXpm` | island-game halftime | Sun/Mon/Thu 6:45 |

- One-shot: `trig_01XRCbyhm6aKCLXNk14CTeif` "Mobile tracker: MNF final grading", Mon 10/26 8:45 PM PT. It grades, settles, regenerates, republishes and commits.
- Its prompt asks for the paper DAL@PHI legs to be graded "in paper-wagers-2026.json". That conflicts with the rule that the paper file is never written, so the briefing says to report paper grades only.
- Pre-existing tasks: "Weekly NFL team-profile snapshot refresh" (Tue 8 AM PT) and "Weekly SuperContest lines ingest" (Thu 8 AM PT).
- Gaps: no Saturday or international-game runs. The 1:05/1:25 PM window's late check lands 15–35 minutes before kickoff.

### 2.4 ESPN lookup alignment

- New: `scripts/lib/espn-http.mjs`, a shared JSON helper with the settlement `User-Agent` and response checks.
- Now used by `scripts/generate-live-tracker-mobile.mjs` and `scripts/reconcile-settlement.mjs`.
- Verified: `node --check` passes, and a mocked request confirms the User-Agent and JSON parsing.
- Still failing: live `getaddrinfo ENOTFOUND site.api.espn.com`. Codex says this is DNS in Codex's shell, which the matched request profile does not fix.
- Unfinished: retry when DNS works, confirm that a failed fetch leaves output hashes unchanged, and confirm the success markers ("W7: 0 pending", "paper: ... 1 open", "hedge alerts: 0 active").

### 2.5 Grader parity (Weeks 5–7)

- Report: `reports/verification/2026-10-26-mobile-grader-parity-weeks-5-7.md`. It is incomplete and explicitly does not claim zero mismatches.
- Why it is incomplete: the saved W7 state holds no real-ticket grades, no W5/W6 mobile state was found, and ESPN was unreachable.
- Rule: report mismatches only and don't edit ledgers. Compare against the desktop tracker if its grading can be extracted.

### 2.6 Ledger number-format churn

- The overnight JS reconcile (03:30) wrote `-15`; the Python settler writes `-15.0`. Example: `odds_decimal 83.0` → `83`. Values are unchanged.
- Codex identified the writer and proposed one shared format in `reports/verification/2026-10-26-ledger-number-format-churn.md`. That report was not read for this digest; the handoff does not name the writer.
- No ledger write was made. If Andy adopts the format, add byte-level serialization parity tests.

### 2.7 Week 7 post-mortem (betting data pack)

- Files: `reports/analysis/week7-postmortem/w07-postmortem-data-2026-10-26.md` and `official-ticket-summary-2026-10-26.csv`. Real tickets only; paper is excluded.
- Game results come from local ESPN snapshots, event IDs `401873010`–`401873022` (13 games).

| Book | Tickets | Risk | Net | Record |
|---|---:|---:|---:|---:|
| Bookmaker | 11 | $190.74 | −$177.22 | 0–11 |
| BetOnline | 10 | $73.31 | −$73.31 | 0–10 |
| DraftKings Predictions | 10 | $60.07 | +$16.93 | 1–9 |

| Category | Tickets | Risk | Net | Record |
|---|---:|---:|---:|---:|
| Parlay | 12 | $165.74 | −$165.74 | 0–12 |
| Prop parlay | 6 | $33.31 | −$33.31 | 0–6 |
| Prop / prediction market | 10 | $60.07 | +$16.93 | 1–9 |
| Round robin | 2 | $35.00 | −$21.48 | 0–2 |
| Teaser | 1 | $30.00 | −$30.00 | 0–1 |

- DKP 45488862 risked $4.94 and paid $77.00 gross, +$72.06 net. The BKR compact RR returned $13.52 for −$1.48.
- **Sensitivity view:** excluding the $15 cross-week BKR flex SGP leaves 30 tickets, $309.12 risk, −$218.60 net. The pack says this is not a replacement total.
- **Leg rows:** 61 WON, 77 LOST, 2 PUSH, 47 PENDING, 2 OPEN. Market hit rates are therefore not verified.
- **Unfinished:**
  - Add the MNF final once the Claude check-in has run, without editing the ledger.
  - Compare actual tickets with the proposal card and the official pool/contest picks.
  - Outcome and concentration analytics.

### 2.8 Week 7 football stats

- Script: `node scripts/analysis/week7-postmortem/compile-game-data.mjs`. It is local-only, reads "the Week 7 schedule manifest" (path not given), validates season/week/event, and needs final status before it includes a game's stats.
- Report: `reports/analysis/week7-postmortem/w07-football-stats-2026-10-26.md`.
- CSVs:
  - `espn-game-results-2026-10-26.csv`
  - `espn-team-stats-2026-10-26.csv`
  - `espn-player-stats-long-2026-10-26.csv`
  - `espn-scoring-plays-2026-10-26.csv`
- Key numbers (13 games):
  - Scoring: 573 points (44.1 per game); 7 one-score finishes; 2 games decided by 20+; home teams 5–8.
  - Yardage: 8,936 yards, of which 5,845 passing and 3,091 rushing; 24 turnovers; third downs 139/323 (43.0%).
  - Scores were cross-checked against nfl.com.
- Unfinished: rerun the exporter after a DAL@PHI final boxscore snapshot exists. Every aggregate changes once MNF is included.

### 2.9 MNF DAL@PHI island ladder (card `reports/bets/2026-w07-card.md`)

**Preliminary ladder** (Saturday captures). The card marks it "Superseded for new tickets by §7k".
- T1 $10: Lamb rec O6.5 (−132), Javonte rush U63.5 (−110), game U44 (−108)
- T2 $5: Dak cmp O23.5 (−109), Ferguson rec yds U19.5 (−111), Flournoy rec O3.5 (+102), Dak pass TD U1.5 (+110), PHI 1Q TT U3.5 (−144)
- T3 $5: Cooper ATD (+488), Pickens ATD (+170), Spann-Ford ATD (+733)

**§7k (Mon 4:20 PM PT, BKR same-game).**
- "Locked island template (Tier 1 $10 +600-1000, Tier 2 $5 +1800-3000, Tier 3 $5 +6500-20000; distinct legs and players in T1/T2, T3 exempt)."
- Prices come from the BetOnline 3:32 PM capture. There was no fresh Bookmaker capture, so every leg says "BKR reprice needed".
- Inactives:
  - PHI out: DeVonta Smith, Dontayvion Wicks, Nolan Smith, Michael Carter II, Jake Majors. Hurts is out; Tanner McKee starts. **Saquon Barkley active.**
  - DAL out: Turpin, Demercado, Dee Winters, Tyrus Wheat, Drew Shelton.
- Game Under 44 was dropped because it overlapped the paper Master RR's last live combo.
- Tickets:
  - **T1, $10, +704 → ~$80:** Lamb rec O6.5 (−135), Javonte ATD (−165), DAL team FGs O1.5 (−160), Barkley rush yds U63.5 (−130)
  - **T2, $5, +2,203 → ~$115:** Dak pass TDs O1.5 (−140), Pickens ATD (+165), Elliott fantasy pts U6.5 (+100; fallback Eagles FGs U1.5 +100 BEO), total sacks O4.5 (−145), PHI team TDs U2.5 (−200)
  - **T3, $5, +8,065 → ~$408:** Javonte first TD (+350), Lamb ATD (+115), Pickens ATD (+165), Aubrey fantasy pts O8.5 (−125), Barkley rush U63.5 (−130)

**§7l (Mon 4:27–4:50 PM PT).** "Paper-tracked so the record is complete." S1–S3 target +1500 to +2500 at $5.
- **T1 BKR-available rebuild, $10, +772 → ~$87:** the §7k T1 with "Dallas first to make a field goal" (−131, Saturday BKR FG tab) in place of DAL FGs O1.5, which BKR does not offer.
- **T3 shootout alternative, $5, +11,921 → ~$601:** Javonte first TD +350, Goedert ATD +175, D. Cooper ATD +240, Dak pass TDs O1.5 −140, total TDs O4.5 −150 ("Drop first if BKR blocks it").
- **S1 Kickers' Game (DKP), $5, +1,825 → ~$96:** Aubrey fantasy O8.5 −125, Elliott fantasy O6.5 −130, longest FG O49.5 −125, McKee pass TDs U1.5 −190, total TDs U4.5 +120.
- **S2 Dallas Supporting Cast (DKP), $5, +1,862 → ~$98:** Pickens rec O4.5 −130, Ferguson ATD +265, Flournoy rec yds O33.5 −115, Aubrey FGs O1.5 −160.
- **S3 Defense (DKP), $5, unpriced:** Baun T+A O6.5, Overshown T+A O5.5, DeJean T+A O3.5, total sacks O4.5 −145, McKee pass TDs U1.5 −190 (swap for McKee cmp U19.5 +110 if both are played).

**Unclear:**
- Whether any §7k/§7l ticket was placed with real money. No doc says so.
- Whether §7k itself was paper-tracked; only §7l states it.
- The grades. With DAL 38–21, the game total was 59, but leg-level grades are not in any doc.

### 2.10 Paper tracking

- Store: `data/official-picks/paper-wagers-2026.json`, built from card sections via `scripts/paper_from_card.py`.
- Status is never written back: every W2, W4 and W7 paper ticket still says PENDING. The grades exist only in the tracker's computed state (`public/live-tracker-mobile-state.json`).
- As of this morning: 35 W7 paper tickets, $520 risk, −$159.01 decided, Master RR open.
- **Inference:** the MNF final total of 59 is over 44, so the Master RR's one live combo (which needed DAL/PHI Under 44) should have lost. The final paper Master RR P/L is not computed in any doc.
- §7l (and possibly §7k) add up to 8 more paper tickets after the ledger snapshot.
- Open: write-back (needs Andy) and a Week 5–6 paper backfill (needs Andy).

### 2.11 Yahoo Fantasy API (`docs/YAHOO_FANTASY_API_ACCESS_FOR_CODEX.md`)

**Mechanism.** A script integration, not an MCP server. There is no `.mcp.json`, and `.claude/settings.json` holds hooks only.

| Piece | Path |
|---|---|
| OAuth2 + HTTP client (`yget(path)`) | `agents/lib/yahoo.js` |
| One-time consent | `scripts/yahoo-auth.js` |
| Setup doc | `docs/YAHOO_INTEGRATION_SETUP.md` |

**Transport and auth.**
- GET-only HTTPS to `api.login.yahoo.com/oauth2/*` and `fantasysports.yahooapis.com/fantasy/v2/*`, with `?format=json`.
- Basic auth to the token endpoint, Bearer token on data calls.
- Tokens auto-refresh 60 s before expiry and again on any 401.

**Credentials (names only).**
- `YAHOO_CLIENT_ID`, `YAHOO_CLIENT_SECRET` and `YAHOO_REDIRECT_URI` (default `https://localhost`) live in `.env`, which is gitignored.
- `YAHOO_SCOPE` must stay unset; `scope=fspt-r` returns `invalid_scope`.
- Token store: `.nfl/yahoo/tokens.json`, gitignored.

**Status: working.**
- The 2026-09-03 `additional_authorization_required` block is resolved.
- Archives exist under `data/archive/2026/week-01` to `week-06`.
- `NFL_Dashboard_Yahoo_Survivor_Sync` ran 2026-10-26 18:00 PT with result 0.
- `NFL_Dashboard_Weekly_Archive` last succeeded 2026-10-22.
- Leagues: game 470: `470.l.117200`, `.351555`, `.735815`, `.735870`, `.772245`. Also Pick'em (game 472, `472.g.4087`), Survival (476), and a non-NFL bracket game.

**Coverage.** Leagues, settings, standings, per-week scoreboards, rosters with weekly stats, player stats, transactions, draft results and ADP are covered. Pick'em/Survival standings and teams are covered too.
- Free agents only partly: the direct `players;status=FA` filter is unused and unverified.
- Pick'em individual picks: **No** (`team/{tk}/picks;week=n` returns HTTP 400).

**Codex options:**
- **A (preferred):** run locally from the repo root:
  ```
  npm run fantasy:sync
  node scripts/archive/yahoo-week-archive.mjs --week <N>
  node agents/yahoo-league-settings.js
  node agents/yahoo-season-ingest.js
  ```
- **B:** a proposed stdio MCP wrapper, `scripts/mcp/yahoo-fantasy-mcp.mjs`, which does not exist yet. It would offer GET-only tools (`list_leagues`, `get_league_settings`, `get_standings`, `get_scoreboard`, `get_team_roster`, `get_transactions`, `search_players`, `get_draft_results`) and be configured in `~/.codex/config.toml`.
- **C:** a separate grant through the same app, with a separate token file.

**Open.** Rotation of the client secret is unconfirmed: AUDIT-CX-014 records it as exposed 2026-08-18 and not rotated (last noted 2026-09-03). The doc says to confirm rotation before giving another agent access.

### 2.12 Other workstreams found

- **Desktop Live Tracker** (`scripts/generate-live-tracker.mjs`, about 10k lines). Outputs `public/live-tracker-sunday.html` and `docs/tracked-wagers/live-tracker-sunday.html`. Context only.
- **Week 7 card, earlier sections:**
  - §3 singles ($20 unit)
  - §4 Dog ML RR ($20) and Master RR ($70; 8 legs, last leg DAL/PHI U44 −108)
  - §5 parlays
  - SuperContest AI five (CIN +2.5, GB +3.5, ATL +3.5, LV +4, ARI +4.5; alternates NO +3.5, NYG +9.5, KC +2.5)
  - §7h Prop Stack Agent tickets (`agents/dev/PROP_STACK_AGENT.md`, `scratch/w07-prop-agent/*.json`)
  - §7i stacks A–F
  - §7j SNF island ladder
  - §7e/8a TD slips
  - §7f/7g reference menus
- **Bankroll sync** (Supabase) via `node scripts/sync-placed-wagers-to-bankroll.mjs`. Not run in the window; needs Andy.
- **Week 8 pipeline** (Master Intel, card, SC report): out of scope. TNF is Thu 10/29.
- **Carry-overs from 10/25:** a client edition of the Master report (Week 8); a fix for the BEO prop scraper (only 3 games parsed; IDP/QB-pressure unpriced); the stale client PDF.

---

## 3. Andy's decisions and standing rules

### Confirmed rules

Briefing §5, "Confirmed by Andy", citing the 10/25 handoff "Rules carried forward" and the 10/25–10/26 chat:
1. "Nothing is placed without Andy's approval. **Agents never place bets**, and hedge alerts are information only."
2. "Stage **named files only**. Never `git add -A`, reset, clean or stash. Commit with a message file (PowerShell eats `$`)."
3. "Supabase writes only for bets Andy asks to track (the bankroll sync wasn't requested in this window)."
4. "No logging in or entering passwords. BetOnline/Bovada are blocked in Chrome; don't work around that."
5. "Windows Python 3.14 for card/report builds; `--date` = the capture file date."
6. "Roster facts come from `data/nfl-rosters/espn-full-rosters-latest.json`, never from memory (Kenneth Walker III is KC; Wil Lutz is DEN; Emanuel Wilson, AJ Barner and Jason Myers are SEA)."
7. "Ledgers change only to record what Andy reports or what ESPN finals decide (settlement)."
8. "**Mobile tracker scope** (10/25 14:15): Android Chrome; private hosted link; live & open tickets. Extended at 18:13 when Andy asked for the paper tickets."
9. "**Hedge Watch** (10/25 22:24, by question): delivery is the **tracker banner only**; cadence is **before each window** plus island-game halftime."
10. "**Betting rules** are only `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md` §7.2 plus §5 data rules 1–7. Nothing in this window changed them."

Also from the briefing §2: Andy's request, 10/25 22:24: "I need an alert system in place for these types of scenarios."

From the card (`reports/bets/2026-w07-card.md`):
- §1, Sat 8:27 PM: "unit = $10 for all parlays and round robins, $20 for singles. Master RR proposal required (not skipped). Player props for every game at QB/WR/RB/TE/K/IDP, at least two per position per game." Platinum Rose recs are GB +3.5 and four totals; NYG +10 and KC +3 are leans.
- SuperContest: Andy removed CLE and replaced PHI with ATL (SC and dog-RR set). KC +3 is Andy's standalone pick. "Official SuperContest five: Andy and Amanda will confirm later."
- Hybrids: "Andy 8:54 PM: no PIT@NO legs."
- Master RR was rebalanced Sat 10:35 PM "at the direction of Andy": four sides and four totals.
- §7i, §7j, §7k and §7l were each built "at the direction of Andy". §7j/§7k cite the "Locked island template (Tier 1 $10 +600-1000, Tier 2 $5 +1800-3000, Tier 3 $5 +6500-20000; distinct legs in T1/T2)."
- §7j T2 was rebuilt at 4:50 PM Sunday at Andy's direction for prop-type diversity. §7i F likewise: "Andy asked for prop-type diversity after stack E."
- §7l: "Two-sided alternative to the one-sided Dallas moonshot (Andy, 4:19 PM PT)." The T1 rebuild followed "after Andy found no Dallas team-FG total at BKR."

Card §2 standing constraints (not attributed to Andy by name):
- "No Monday leg goes on an SNF-capped ticket."
- "No props round robin."
- "BKR player props remain same-game only; BEO multi-game stacks allow at most two props per game."
- "Flag any ticket with more than two legs shorter than -200 and any -120 to -100 connector without a named source."

### Proposals not adopted (briefing §5)

- "When one leg stands between you and >10× stake, hedge 30–60% of the equalizing amount pre-kickoff" (Claude, 10/25 21:13). Andy asked for an alert system instead. The 10× threshold is an alert default, not a betting rule.
- Push notifications or Gmail delivery for alerts: offered, and Andy declined.
- A "hedge spot" flag on desktop tracker cards: not requested (now backlog).
- `HEDGE_DEFAULTS` are "engineering defaults, not betting rules".
- Codex's canonical number format is a proposal awaiting Andy.
- The Yahoo MCP wrapper is a proposal; it does not exist.

---

## 4. Open items, items needing Andy, and stop conditions

### Needs Andy (none resolved in any later doc; Codex docs repeat them as "undecided")

1. **MNF grading owner.** The default is the Claude check-in `trig_01XRCbyhm6aKCLXNk14CTeif` at 8:45 PM. Every Codex doc defers to it. No doc confirms it ran.
2. **Bankroll sync** for the 21 Week 7 settlements: `node scripts/sync-placed-wagers-to-bankroll.mjs`, a Supabase write.
3. **Paper write-back** to `paper-wagers-2026.json`.
4. **Paper backfill** for Weeks 5–6.
5. **Alert delivery:** banner only vs push/email.
6. **Carry-overs:** the client edition of the Master report in Week 8; the BEO prop scraper fix; re-sending the stale client PDF only if Andy asks.
7. **Adopting a canonical ledger number format.** Until then, don't rewrite the ledger for format.
8. **Housekeeping:** `.nfl/incoming/` and `.nfl/commit-msg-*.txt`. Andy has to delete them; gitignoring needs his OK.
9. **Yahoo:** confirm the client secret was rotated (AUDIT-CX-014) before giving Codex or another agent access. Supply the `YAHOO_*` values out of band if option C is chosen.
10. **Real vs paper status of the §7k/§7l MNF tickets.** No doc says whether Andy placed any (§7).
11. **Official SuperContest five (Andy/Amanda):** marked "will confirm later" in the card. Its status is not stated in this window's docs.

### Engineering open items

- Retry ESPN, then complete Weeks 5–7 grader parity, report-only.
- Before Thu 10/29: run `node scripts/generate-live-tracker-mobile.mjs` and confirm `week auto → 8`.
- Recalibrate the hedge model on multi-season data.
- Serialization parity tests if a format is adopted.
- Propose coverage times for 1:05/1:25 PM, Saturday and international games. Schedule edits are a Claude/Andy action.
- Live-line source investigation: proposal only.
- Post-mortem:
  - add the MNF final and ticket outcome evidence
  - compare the proposal card and pool/contest picks with outcomes
  - concentration analytics
  - rerun `compile-game-data.mjs` once a final boxscore exists
- 49 ledger leg rows are still PENDING/OPEN even though all 31 tickets are settled. The post-mortem flags this; no doc assigns a fix.

### Resolved by a later doc (no longer open)

- "Unit tests for hedge-alerts" (§6b-1): done in `35525d4`.
- "Calibrate hedge model" (§6b-3): done provisionally; only the recalibration remains.
- "Find the 3:30 AM writer" (§6b-4): identified, with a proposal in the churn report.
- "Generator robustness" (§6b-5): done. Missing events with pending tickets are rejected, `--season` defaults from ESPN, `--no-paper` exists, and the script exits non-zero before writes on ESPN failure.
- `HANDOFF.md`'s stale SC-correction pointer: replaced and marked superseded.

### Stop conditions still in force

- No bets, no sportsbook accounts, no TheOddsAPI.
- No Supabase writes, including bankroll sync and `game_odds_snapshots`, without Andy's per-action OK.
- No ledger edits beyond settlement from ESPN finals or what Andy reports.
- Codex must not grade MNF independently.
- Artifact publishing is Claude-only, to the same URL, never a new artifact.
- Scheduled-task edits are Claude/Andy only.
- The roster gate must pass before any card.
- The parity gap must stay labelled as incomplete.

---

## 5. Every repo path referenced (deduplicated)

Tags (gitignored, generated, dirty, untracked, new, proposed, missing, outside-repo) are given only where the docs say so.

**Repo root**
- `HANDOFF.md`
- `AGENTS.md`
- `CLAUDE.md`
- `CLAUDE.md.bak-20261012`: untracked
- `.env`: gitignored
- `.mcp.json`: missing (does not exist)
- `.claude/settings.json`: hooks only

**`.nfl/`**
- `.nfl/incoming/`: untracked staging copies
- `.nfl/commit-msg-*.txt`: untracked
- `.nfl/gmail-summaries/*`: untracked
- `.nfl/yahoo/tokens.json`: gitignored, never tracked

**`agents/`**
- `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md`: dirty (another team); read the working copy
- `agents/dev/ANTIGRAVITY_*.md`: untracked
- `agents/dev/PROP_STACK_AGENT.md`
- `agents/lib/yahoo.js`
- `agents/yahoo-league-settings.js`
- `agents/yahoo-season-ingest.js`
- `yahoo-adp-ingest.js`: directory not stated

**`data/`**
- `data/official-picks/user-placed-wagers-2026.json`: dirty, number format only
- `data/official-picks/paper-wagers-2026.json`: never settled
- `data/nfl-rosters/espn-full-rosters-latest.json`
- `data/vault-seed/nflverse/games.csv`
- `data/survivor/*`, `data/player-availability/*`, `data/shadow-harness/*`, `data/research-intel/*`: dirty (overnight/other jobs)
- `data/survivor/player-availability/shadow-harness`: missing; shorthand, not a real path
- `data/archive/2026/week-01` … `week-06`
- `data/generated/props/bookmaker-fg-markets-2026-10-25-week7.json`

**`docs/`**
- `docs/MOBILE_LIVE_TRACKER.md`
- `docs/ANTI_PATTERNS.md`: dirty (another team)
- `docs/tracked-wagers/reconciliation-latest.json` and `.md`: generated (03:30 job), dirty
- `docs/tracked-wagers/live-tracker-sunday.html`: generated
- `docs/reference/supercontest-report-locked-w07.html`: frozen reference
- `docs/YAHOO_FANTASY_API_ACCESS_FOR_CODEX.md`
- `docs/YAHOO_INTEGRATION_SETUP.md`

**`handoffs/`**
- `handoffs/2026-10-24-1820-codex-resume-supercontest-sides-only.md`
- `handoffs/2026-10-25-1415-claude-w7-sunday-tracking-mobile-tracker-next.md`
- `handoffs/2026-10-26-0745-claude-h2c2-codex-briefing-w7-mobile-tracker-hedge-watch.md`
- `handoffs/2026-10-26-codex-hedge-watch-engineering.md`
- `handoffs/2026-10-26-codex-espn-lookup-alignment.md`
- `handoffs/2026-10-26-codex-week7-postmortem-data.md`
- `handoffs/2026-10-26-codex-week7-football-stats.md`

**`public/`**
- `public/live-tracker-mobile.html`: committed, generated artifact fragment
- `public/live-tracker-mobile-state.json`: gitignored, generated
- `public/hedge-alerts.json`: gitignored, generated
- `public/live-tracker-sunday.html`: generated; dirty (regenerated 06:04 by an outside process)

**`reports/`**
- `reports/bets/2026-w07-card.md`
- `reports/analysis/week7-postmortem/`:
  - `w07-postmortem-data-2026-10-26.md`
  - `official-ticket-summary-2026-10-26.csv`
  - `w07-football-stats-2026-10-26.md`
  - `espn-game-results-2026-10-26.csv`
  - `espn-team-stats-2026-10-26.csv`
  - `espn-player-stats-long-2026-10-26.csv`
  - `espn-scoring-plays-2026-10-26.csv`
- `reports/verification/`:
  - `2026-10-26-hedge-model-calibration.md`
  - `2026-10-26-ledger-number-format-churn.md`
  - `2026-10-26-mobile-grader-parity-weeks-5-7.md`
- `reports/handoff-snapshots/2026-10-26-h2c2-w7-mobile-tracker-hedge-watch/`:
  - `README.md`
  - `week7-ticket-ledger.md`: generated; stale for MNF
  - `handoff-chain-digest.md`, `commits.md`, `file-manifest.md`
  - `copies/`: 17 files; snapshot only, don't build from it
- `reports/intel/games/2026-w07-game-AWAY_at_HOME-props.md`: a naming pattern
- `reports/intel/games/2026-w07-game-CIN_at_BAL-props.md`

**`scripts/`**
- Tracker and settlement:
  - `scripts/generate-live-tracker-mobile.mjs`: modified by Codex
  - `scripts/generate-live-tracker.mjs`
  - `scripts/settle_from_mobile_state.py`
  - `scripts/hedge-alerts-replay.mjs`
  - `scripts/lib/hedge-alerts.mjs`: modified by Codex
  - `scripts/lib/espn-http.mjs`: new (Codex)
  - `scripts/reconcile-settlement.mjs`: modified by Codex
  - `scripts/sync-placed-wagers-to-bankroll.mjs`
- Card, gates and handoff tooling:
  - `scripts/paper_from_card.py`
  - `scripts/nfl-rosters/roster_vet.py`
  - `scripts/master-intel/check_sc_report.py`
  - `scripts/handoff/h2c2_snapshot.py`
- Post-mortem: `scripts/analysis/week7-postmortem/compile-game-data.mjs`: new (Codex)
- Dirty (other teams):
  - `scripts/build-w05-quantitative-synthesis.mjs`
  - `scripts/props/bookmaker-sgp-dump-parse.mjs`
  - `scripts/run_gemini_youtube_shadow.py`
  - `scripts/weekly-synthesis-preflight.mjs`
- Yahoo:
  - `scripts/yahoo-auth.js`
  - `scripts/sync-yahoo-fantasy.mjs`
  - `scripts/archive/yahoo-week-archive.mjs`
  - `scripts/archive/yahoo-draft-results.mjs`
  - `scripts/mcp/yahoo-fantasy-mcp.mjs`: proposed, does not exist
  - `sync-yahoo-survivor.mjs`: directory not stated

**Other**
- `scratch/w07-prop-agent/*.json`
- `tests/unit/hedgeAlerts.test.js`: new (Codex)
- `node_modules/vitest/dist/cli.js`
- `betonline-live-2026-10-26-week7.pregate.raw.txt`: directory not given
- "Week 7 schedule manifest": path not given
- Repo location: `E:\dev\projects\NFL_Dashboard`
- `~/.codex/config.toml`: outside the repo

### URLs and external identifiers

- Phone tracker artifact: https://claude.ai/artifact/Q7NBq3G5MLgzVzraUPsuiy
- NFL Week 7 schedule: https://www.nfl.com/schedules/2026/by-week/week-7
- ESPN host: `site.api.espn.com`
- Yahoo: `api.login.yahoo.com/oauth2/*`, `fantasysports.yahooapis.com/fantasy/v2/*`
- Windows tasks: `NFL_Dashboard_Yahoo_Survivor_Sync`, `NFL_Dashboard_Weekly_Archive`
- Claude sessions: `session_01Hie8K6ufGgMMFoMSR7PbFV`, `01H9kvkd…`

---

## 6. Guardrails and git procedure, as stated

**Guardrails (briefing §7, `HANDOFF.md`, Codex docs):**
- Read-only on sportsbooks; never place bets. No TheOddsAPI. No Supabase writes, including `game_odds_snapshots` pricing, without Andy's per-action OK.
- Roster gate before any card:
  ```
  python3 scripts/nfl-rosters/roster_vet.py --week <N> --date <capture-date> --fetch --strict --card <file>
  ```
- The checkout is shared and dirty. Never stage these:
  - `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md`, `docs/ANTI_PATTERNS.md`
  - the four dirty scripts
  - the `data/survivor|player-availability|shadow-harness|research-intel` refreshes
  - `docs/tracked-wagers/reconciliation-latest.*`
  - the float-only diff on `user-placed-wagers-2026.json`
  - `public/live-tracker-sunday.html`
  - untracked `.nfl/gmail-summaries/*`, `CLAUDE.md.bak-20261012`, `agents/dev/ANTIGRAVITY_*.md`
- "Live Git wins over historical handoffs." Reconcile live Git before acting.
- Yahoo: never print, log or commit `.env` or the token file. Never pass `YAHOO_SCOPE`. Keep calls on a schedule, not in polling loops.
- Week 7 card §10: no official picks, wagers, bankroll, futures, Supabase, sportsbook, paid API, commit or push action. That line is stale for later sections (§7).

**Git procedure:**
- Inspect with `git -c core.fsmonitor=false status --short`.
- Stage named paths only. Commit with `git commit -F <message-file>`.
- Push to `origin claude/w5-prop-cards-2026-10-11`, not main.
- Never `git add -A`, reset, clean, stash, or pull over local work.
- If stale `.git/*.lock` files block you, use a temp index:
  ```
  GIT_INDEX_FILE=<tmp> git read-tree HEAD
  git add -- <paths>
  git write-tree
  git commit-tree <tree> -p HEAD -F <msg>
  git update-ref refs/heads/claude/w5-prop-cards-2026-10-11 <new> <old>
  ```
  then push.
- Before staging a file you touched, compare `git hash-object <f>` with what you wrote.
- Use your own team's commit trailer; don't reuse Claude's session URL.
- Run vitest directly with `node node_modules/vitest/dist/cli.js run <files>`, because `npx` and `npm run` hang on this checkout.
- After each chunk: commit, push, and write a dated handoff in `handoffs/`.

---

## 7. Contradictions and stale statements

**07:45 briefing and `HANDOFF.md` vs card §7k/§7l**

1. **Paper count.** The briefing TL;DR says "No real tickets ride on [MNF]", and that the only open paper ticket is the Master RR. The paper totals (35 tickets, $520, −$159.01) say the same. §7l (4:27–4:50 PM) adds paper-tracked MNF tickets afterwards, so the paper count, risk and open list are stale for MNF. The briefing's statement about real tickets may still hold: no doc says any §7k/§7l ticket was placed.
2. **Card's own superseded ladder.** The briefing does not mention the preliminary ladder, but the card supersedes its own Saturday "preliminary only" MNF ladder through §7k. The preliminary T1 carried game U44, which §7k drops because of the paper Master RR overlap. The preliminary T2 had a "BKR block" (Dak completions and DAL receptions), fixed in §7k T2.
3. **§7k vs §7l on Tier 1.** §7k T1 uses "Dallas team field goals Over 1.5", which §7l says BKR does not offer; §7l rebuilds T1 with "Dallas first to make a field goal". Within §7l, the shootout alternative T3 (+11,921) is a second Tier 3 option next to §7k's T3 (+8,065).
4. **BetOnline access.** The briefing's rule 4 says "BetOnline/Bovada are blocked in Chrome; don't work around that", and card §7f says "BetOnline is blocked for the browser extension". Yet §7k/§7l price from a "BetOnline 3:32 PM PT Monday capture". How that capture was made is not stated, so this is unclear rather than proven to be a breach.
5. **Barkley.** Card §7 row 10, the preliminary-ladder note ("Barkley's Q tag") and §9 still treat him as Questionable. §7k (3:45 PM inactives) says "Saquon Barkley active", and also has Hurts out with McKee starting, which none of the earlier sections reflect.
6. **Monday leg on an SNF-capped ticket.** Card §2 says "No Monday leg goes on an SNF-capped ticket", yet §7h's Perfect Lottery 13-leg includes a DAL@PHI leg so it "stays live through MNF". That ticket is not SNF-capped, so this is not a direct conflict.
7. **`HANDOFF.md` is stale after the MNF final.** It still says "DAL @ PHI and proposal-vs-results analysis remain open". Every Codex doc likewise says DAL@PHI is "pending". The game finished DAL 38–21. No doc in the set records the 8:45 PM check-in result, ledger state, paper Master RR outcome, or the regenerated tracker.
8. **`HANDOFF.md` history block.** It keeps the superseded SC text ("PDF remains stale", "Andy/Amanda's official five remain pending", report checkpoint `0284a88bf7addbd79601f8891ffa0f821cbe2258`). It is labelled as history, but the "Next:" line in it is obsolete.

**Between other docs**

9. **Cross-week tickets.** The post-mortem pack's sensitivity view excludes only the $15 BKR flex SGP (740512242) as cross-week. The briefing (§2, §8-5) also establishes that teaser 740506458 ($30) had its SF −1 leg from Week 6 MNF (WSH @ SF). The sensitivity view does not account for that second cross-week ticket.
10. **Leg detail.** The briefing says the settler writes leg statuses and all 31 tickets are settled. The pack finds 47 PENDING and 2 OPEN leg rows out of 189, so ticket-level settlement is more complete than leg-level detail.
11. **ESPN reachability.** The briefing says both Linux node in the device VM and Windows node work. Codex's shell got DNS `ENOTFOUND`, so this is environment-specific. Meanwhile Andy's Monday cadence settlement preview did reach ESPN.
12. **Snapshot vs Codex runs.** The snapshot ledger and `public/live-tracker-mobile-state.json` predate Codex's runs. Codex's first failed run overwrote tracker outputs with CHECK-only content, then restored them from the snapshot (hashes matched). Anyone reading the outputs should know they are the 07:45 baseline.
13. **SNF Tier 2 price.** Card §7j lists +2,404; the ledger snapshot lists +2408.
14. **Ledger payout blank.** In the snapshot ledger, BEO 1008729493 has a blank Payout cell while every other loss shows 0.00.
15. **Card header and self-check.** The card is still titled "Saturday review card" and calls itself "PROPOSAL ONLY". §1 says "Four still live" existing tickets, and §10 says no commit or push was taken. Sections §7i–§7l were added Sunday and Monday, and paper tracking and commits happened (`5434ed6`, `6b127fa`, `3dd745e`). The header and self-check are stale.
16. **MNF check-in prompt vs paper rule.** The check-in prompt (`trig_01XRCbyhm6aKCLXNk14CTeif`) says to grade paper legs "in paper-wagers-2026.json", which conflicts with the never-write-paper rule. The briefing says to report paper grades only unless Andy decides otherwise. Whether the task followed that is unknown.
17. **Yahoo status vs older account notes (outside the doc set).** The Yahoo doc says access is working, with 5 leagues on the account. Older account notes (not part of this doc set) record Yahoo as "still blocked" and track 4 fantasy leagues. Those notes are probably stale on both points.