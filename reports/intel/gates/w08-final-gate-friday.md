# Final Gate Check — 2026 Week 8 — Friday run

Run Fri Oct 30, 9:02 PM PT · games to play: 13 · BKR capture date: 2026-10-31

## Verdict: **RED** — 4 required failure(s), 5 advisory warning(s)

Do NOT start the synthesis/report run. Fix the ❌ REQUIRED rows below (top first), then re-run this check.

### Blocking items

- ❌ **E1 YouTube / podcast picks (Gemini, cleaned)** — missing: data/podcasts/youtube-extracted-picks-2026-w08.json  
  Fix: Sweep → Gemini extraction (Andy terminal) → clean to the picks file (runbook §4).
- ❌ **E2 Grok X-thread extraction (every week)** — 0 CSV in data/vault-seed/manual/grok-week08-threads  
  Fix: Paste data/research-intel/grok-thread-prompt-latest.md into Grok → save CSV there → node scripts/load-external-intel-picks.mjs --dry-run, then --replace.
- ❌ **M-news_flags_resolved news flags resolved** — Trades, QB changes, pulled markets, late news checked by live search and reflected in packets/narratives  
  Fix: Set "done": true (+ "by", "at") in data/generated/master-intel/w08-gate-manual.json when confirmed.
- ❌ **M-qb_status_confirmed qb status confirmed** — Every starting QB confirmed (team sites / insiders)  
  Fix: Set "done": true (+ "by", "at") in data/generated/master-intel/w08-gate-manual.json when confirmed.


## Analysis layer

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| A1 | Week slate confirmed | REQUIRED | ✅ PASS | 14 games, 13 still to play; operator_confirmed=True |  |
| A2 | Team dossiers | REQUIRED | ✅ PASS | data/generated/team-dossiers/2026-w08: 35 team files |  |
| A3 | Roster gate (ESPN 2026, strict) | REQUIRED | ✅ PASS | status=PASS, roster age 6.5h, blocking=0 |  |

## Lines & markets

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| L1 | Bookmaker capture (SGP props + game lines) | REQUIRED | ✅ PASS | data/generated/props/bookmaker-live-2026-10-31-week8.json — 2.1h old (limit 30h); games=13 (need 13) |  |
| L2 | BKR game-lines file for the synthesis queue | REQUIRED | ✅ PASS | data/generated/props/bookmaker-gamelines-2026-10-31-week8.raw.txt |  |
| L3 | Action Network openers (line-move baseline) | REQUIRED | ✅ PASS | data/odds/actionnetwork-openers-2026-w08.json |  |
| L4 | Master Intel pull (signals, expert picks, articles, splits) | REQUIRED | ✅ PASS | data/generated/master-intel/w08-pull.json — 1.9h old (limit 30h); pulled_at=2026-10-30T22:34:51.847Z, signals=214, expert=94 |  |
| L5 | Betting splits (Action Network) | REQUIRED | ✅ PASS | 14 games, newest capture 2026-10-31T02:06:35+00:00 (1.9h; limit 30h) |  |
| L6 | BetOnline player props (prop stacks, props pass) | ADVISORY | ✅ PASS | data/generated/props/betonline-live-2026-10-29-week8.json; rows=522; age=28.9h | npm run props:bol:cron (BEO posts Sunday props ~Sat afternoon). |
| L7 | DraftKings Predictions props | ADVISORY | ⚠️ WARN | data/generated/props/dk-predictions-2026-10-17-titans-at-colts.json | npm run props:dkp:launch (log in) → npm run props:dkp:cron → npm run props:dkp:defense |
| L8 | Prediction markets + coherence | ADVISORY | ✅ PASS | data/prediction-markets/cross-market-coherence-latest.json — 6.0h old (limit 36h) |  |
| L9 | SuperContest contest lines | REQUIRED | ✅ PASS | data/supercontest/week-08-lines.json |  |

## Rosters & injuries

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| I1 | Player availability / injury report | REQUIRED | ✅ PASS | data/player-availability/latest.json — 4.5h old (limit 24h) |  |
| I2 | Projected starters | REQUIRED | ✅ PASS | data/projected-starters/2026/projected-starters-2026-10-30.json — 6.0h old (limit 30h) |  |
| I3 | Weather / venue | ADVISORY | ✅ PASS | data/research-intel/review/2026-w08-weather-venue.json — 3.0h old (limit 48h) |  |

## Analytics

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| Q1 | Team power ratings / SRS (fair lines) | REQUIRED | ✅ PASS | data/generated/team-profiles/team-power-ratings-2026.json — 52.5h old (limit 192h) |  |
| Q2 | Secondary matchup vulnerability | REQUIRED | ✅ PASS | data/secondary-matchups/secondary-matchup-vulnerability-2026-w08.json |  |
| Q3 | FTN Stats IQ weekly context | REQUIRED | ✅ PASS | data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json (6h) | FTN refresh (weekly only). |
| Q4 | Fair-line model + simulator inputs | ADVISORY | ✅ PASS | reports/intel/w08-model/fair-lines-w08.json | Re-run fair_lines.py on current lines (stage run does this). |

## Expert & media intel

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| E1 | YouTube / podcast picks (Gemini, cleaned) | REQUIRED | ❌ FAIL | missing: data/podcasts/youtube-extracted-picks-2026-w08.json | Sweep → Gemini extraction (Andy terminal) → clean to the picks file (runbook §4). |
| E2 | Grok X-thread extraction (every week) | REQUIRED | ❌ FAIL | 0 CSV in data/vault-seed/manual/grok-week08-threads | Paste data/research-intel/grok-thread-prompt-latest.md into Grok → save CSV there → node scripts/load-external-intel-picks.mjs --dry-run, then --replace. |
| E3 | BettingPros article intel | ADVISORY | ✅ PASS | reports/intel/bettingpros-articles-2026-w08.md | Read the week's BettingPros NFL articles (Claude in Chrome). |
| E4 | Per-expert narrative summaries | ADVISORY | ⚠️ WARN | reports/intel/expert-narratives-2026-w08.md | Written during the stage run (step 6). |
| E5 | Article feed health | ADVISORY | ⚠️ WARN | Action Network: Response is not a parseable RSS/Atom feed; Gemini Audio Diarization: Gemini file upload (start) failed: {
  "error": {
    "code": 402,
    "message": "Your prepayment credits are depleted. Please go to AI Studio at https://ai.studio/projects to manage your project and billing. Learn more at https://ai.google.dev/gemini-api/docs/billing#prepay. ",
    "status": "RESOURCE_EXHAUSTED"
  }
}
 | Cover failed feeds by browser pulls. |

## Synthesis queues

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| S1 | Sides synthesis queue | REQUIRED | ✅ PASS | scratch/w08-game-synthesis-queue-sides.json: 13 packets; missing=none |  |
| S2 | Props synthesis queue | ADVISORY | ✅ PASS | scratch/w08-game-synthesis-queue-props.json: 13 packets; missing={"LV@NYJ": ["betonline player-prop board thin/missing (26 rows)"], "ARI@DAL": ["betonline player-prop board thin/missing (26 rows)"], "ATL@TB": ["betonline player-prop board thin/missing (32 rows)"], "CLE@PIT": ["betonline player-prop board thin/missing (22 rows)"], "IND@JAX": ["betonline player-pro |  |

## Manual confirmations

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| M-news_flags_resolved | news flags resolved | REQUIRED | ❌ FAIL | Trades, QB changes, pulled markets, late news checked by live search and reflected in packets/narratives | Set "done": true (+ "by", "at") in data/generated/master-intel/w08-gate-manual.json when confirmed. |
| M-qb_status_confirmed | qb status confirmed | REQUIRED | ❌ FAIL | Every starting QB confirmed (team sites / insiders) | Set "done": true (+ "by", "at") in data/generated/master-intel/w08-gate-manual.json when confirmed. |
| M-final_injury_reports_checked | final injury reports checked | ADVISORY | ⚠️ WARN | Friday's official designations (Out/Doubtful/Questionable) checked for every game | Set "done": true (+ "by", "at") in data/generated/master-intel/w08-gate-manual.json when confirmed. |
| M-supercontest_report_reviewed | supercontest report reviewed | ADVISORY | ⚠️ WARN | Andy has the Friday SC Intel report (the official five is NOT a prerequisite for either report) | Set "done": true (+ "by", "at") in data/generated/master-intel/w08-gate-manual.json when confirmed. |

## Preflight freshness table (`weekly-synthesis-preflight.mjs`)

```
Weekly synthesis preflight — 2026 Week 8 — 2026-10-31T04:02:48.371Z
WEEK_START=2026-10-27T04:00:00.000Z  WEEK_END=2026-11-03T04:00:00.000Z  (use in SQL kickoff/captured filters)
 ok   Player availability               5h  1158 events  [data/player-availability/latest.json]
 ok   Projected starters                6h    [data/projected-starters/2026/projected-starters-2026-10-30.json]
 ok   Roster map                        6h  845 players  [data/nfl-rosters/roster-map-latest.json]
 ok   ESPN rosters 2026 (full)          7h  2558 players, 32 teams  [data/nfl-rosters/espn-full-rosters-latest.json]
 ok   ROSTER VET (gate)                     ROSTER VET: PASS - 0 blocking issue(s); player legs resolved: card 7, digest 0; ESPN rosters 2026-10-30T20:44Z (7.3h old, 2558 players)  [python: python3]  -> details: data/generated/master-intel/w08-roster-vet.json
 ok   Secondary matchups                6h  week 8  [data/secondary-matchups/latest.json]
STALE Usage trends (season)            83h  through wk 7  [data/generated/player-usage-trends-2026.json]
 ok   ESPN box scores                       109 files (expect ~112)
 ok   Prediction markets                6h  4141 contracts  [data/prediction-markets/latest.json]
 ok   Cross-market coherence            6h    [data/prediction-markets/cross-market-coherence-latest.json]
 ok   SuperContest lines                8h  14 compared game(s)  [data/supercontest/live-market-comparison.json]
 ok   BKR current lines                 2h  captured 2026-10-31T01:50:29.530Z; ? games  [data/generated/props/bookmaker-live-2026-10-31-week8.json]
 ok   Alpha packet                      6h    [data/alpha/alpha-packet-2026.json]
 ok   Expert dossiers                   3h    [data/expert-dossiers/steve-fezzik.json]
 ok   Host citations                    3h    [data/generated/host-citations-latest.json]
 ok   Player-props intel                6h    [docs/player-props-intel/player-props-intel-latest.md]
STALE Promoted podcast intelligence      5h  0 promoted episode(s), 0 pick(s), 0 analysis note(s)  [data/generated/master-intel/w08-pull.json]
 ok   Team DVOA / power                53h    [data/generated/team-profiles/team-power-ratings-2026.json]
STALE Prop boards Week8                     0 board file(s)
STALE Futures ledger                  220h    [data/futures-imports/andy-portfolio-ledger-2026.json]
 ok   BEO futures board (import)        1h    [data/futures-imports/betonline-2026-10-30.json]
STALE BKR futures board (import)      549h    [data/futures-imports/bookmaker-2026-10-07.json]
 ok   Promotions                       52h    [data/sportsbooks/promotions-2026.json]
 ok   Gemini API billing (LLM)              active (HTTP 200)

5 stale of 24. Supabase feeds (odds, injuries, intel notes, expert picks) are checked separately via SQL.
```
