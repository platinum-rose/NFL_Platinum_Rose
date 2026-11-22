# Final Gate Check — 2026 Week 11 — Saturday run

Run Sat Nov 21, 6:02 PM PT · games to play: 12 · BKR capture date: 2026-11-21

## Verdict: **RED** — 1 required failure(s), 7 advisory warning(s)

Do NOT start the synthesis/report run. Fix the ❌ REQUIRED rows below (top first), then re-run this check.

### Blocking items

- ❌ **S2 Props synthesis queue** — scratch/w11-game-synthesis-queue-props.json: 12 packets; missing={"TB@DET": ["bookmaker player-prop board thin/missing (72 rows)", "betonline player-prop board thin/missing (84 rows)"], "ARI@KC": ["bookmaker player-prop board thin/missing (82 rows)", "betonline player-prop board thin/missing (92 rows)"]}  
  Fix: python3 scripts/intel/build-game-synthesis-queue.py --week 11 --pass props --date 2026-11-21 (rebuild LAST, after every input above).


## Analysis layer

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| A1 | Week slate confirmed | REQUIRED | ✅ PASS | 13 games, 12 still to play; operator_confirmed=True |  |
| A2 | Team dossiers | REQUIRED | ✅ PASS | data/generated/team-dossiers/2026-w11: 35 team files |  |
| A3 | Roster gate (ESPN 2026, strict) | REQUIRED | ✅ PASS | status=PASS, roster age 19.0h, blocking=0 |  |

## Lines & markets

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| L1 | Bookmaker capture (SGP props + game lines) | REQUIRED | ✅ PASS | data/generated/props\bookmaker-live-2026-11-21-week11.json — 0.3h old (limit 8h); games=12 (need 12) |  |
| L2 | BKR game-lines file for the synthesis queue | REQUIRED | ✅ PASS | data/generated/props/bookmaker-gamelines-2026-11-21-week11.raw.txt |  |
| L3 | Action Network openers (line-move baseline) | REQUIRED | ✅ PASS | data/odds/actionnetwork-openers-2026-w11.json |  |
| L4 | Master Intel pull (signals, expert picks, articles, splits) | REQUIRED | ✅ PASS | data/generated/master-intel/w11-pull.json — 2.6h old (limit 10h); pulled_at=2026-11-21T23:29:40.684Z, signals=155, expert=16 |  |
| L5 | Betting splits (Action Network, context only) | ADVISORY | ⚠️ WARN | 13 games, newest capture 2026-11-21T16:37:59.896+00:00 (9.4h; limit 8h) | Re-pull AN splits (Claude in Chrome, api v2 scoreboard bookIds=15) into the pull json. |
| L6 | BetOnline player props (prop stacks, props pass) | REQUIRED | ✅ PASS | data/generated/props\betonline-live-2026-11-22-week11.json; rows=1708; age=0.2h | npm run props:bol:cron (BEO posts Sunday props ~Sat afternoon). |
| L7 | DraftKings Predictions props | ADVISORY | ⚠️ WARN | data/generated/props\draftkings-predictions-feed-2026-11-19-week11.json | npm run props:dkp:launch (log in) → npm run props:dkp:cron → npm run props:dkp:defense |
| L8 | Prediction markets + coherence | ADVISORY | ⚠️ WARN | data/prediction-markets/cross-market-coherence-latest.json — 27.0h old (limit 14h) | Friday/Saturday cadence. |
| L9 | SuperContest contest lines | REQUIRED | ✅ PASS | data/supercontest/week-11-lines.json |  |

## Rosters & injuries

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| I1 | Player availability / injury report | REQUIRED | ✅ PASS | data/player-availability/latest.json — 2.5h old (limit 10h) |  |
| I2 | Projected starters | REQUIRED | ✅ PASS | data/projected-starters/2026\projected-starters-2026-11-21.json — 4.3h old (limit 14h) |  |
| I3 | Weather / venue | REQUIRED | ✅ PASS | data/research-intel/review/2026-w11-weather-venue.json — 6.2h old (limit 24h) |  |

## Analytics

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| Q1 | Team power ratings / SRS (fair lines) | REQUIRED | ✅ PASS | data/generated/team-profiles/team-power-ratings-2026.json — 104.0h old (limit 192h) |  |
| Q2 | Secondary matchup vulnerability | REQUIRED | ✅ PASS | data/secondary-matchups/secondary-matchup-vulnerability-2026-w11.json |  |
| Q3 | FTN Stats IQ weekly context | REQUIRED | ✅ PASS | data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json (27h) | FTN refresh (weekly only). |
| Q4 | Fair-line model + simulator inputs | ADVISORY | ✅ PASS | reports/intel/w11-model/fair-lines-w11.json | Re-run fair_lines.py on current lines (stage run does this). |

## Expert & media intel

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| E1 | YouTube / podcast picks (Gemini, cleaned) | REQUIRED | ✅ PASS | data/podcasts/youtube-extracted-picks-2026-w11.json: 66 picks |  |
| E2 | Grok X-thread extraction (every week) | REQUIRED | ✅ PASS | 3 CSV in data/vault-seed/manual/grok-week11-threads (latest grok-twitter-picks-2026-11-21.csv) |  |
| E3 | BettingPros article intel | ADVISORY | ⚠️ WARN | reports/intel/bettingpros-articles-2026-w11.md | Read the week's BettingPros NFL articles (Claude in Chrome). |
| E4 | Per-expert narrative summaries | ADVISORY | ⚠️ WARN | reports/intel/expert-narratives-2026-w11.md | Written during the stage run (step 6). |
| E5 | Article feed health | ADVISORY | ⚠️ WARN | Gemini API: {
  "error": {
    "code": 402,
    "message": "Your prepayment credits are depleted. Please go to AI Studio at https://ai.studio/projects to manage your project and billing. Learn more at https://ai.google.dev/gemini-api/docs/billing#prepay. ",
    "status": "RESOURCE_EXHAUSTED"
  }
}
; Gemini Audio Diarization: Gemini file upload (start) failed: {
  "error": {
    "code": 402,
    "message": "Your prepayment credits are depleted. Please go to AI Studio at https://ai.studio/projects to manage your project and billing. Learn more at https://ai.google.dev/gemini-api/docs/billing#prepay. ",
    "status": "RESOURCE_EXHAUSTED"
  }
}
 | Cover failed feeds by browser pulls. |
| E6 | Podcast intel (audio transcripts + promoted picks) | REQUIRED | ✅ PASS | transcripts processed=3; promoted episodes=0, picks=0; YouTube picks file=yes |  |
| E7 | Article intel (VSiN, ESPN, Action Network, BettingPros, PFT, Walter...) | REQUIRED | ✅ PASS | 155 article signals; sources={'Action Network': 31, 'VSiN': 51, 'BettingPros': 25, 'ESPN NFL': 31, 'Sharp Football': 1, 'Pro Football Talk': 13, 'Walter Football': 3}; newest 2026-11-21T23:03:15.543903+00:00 (3.0h) |  |
| E8 | Twitter/X bookmark intel (text) | REQUIRED | ✅ PASS | local reviewed digest: data/intel/articles/2026-w11/bookmark-text-intelligence-digest.md (2.3h) |  |
| E9 | Twitter media queue (videos / images / threads) processed | REQUIRED | ✅ PASS | data/twitter/w11-media-extraction-queue.json: 0 Sunday-slate items still pending ({}) |  |
| E10 | Preferred-expert final cards (coverage) | REQUIRED | ✅ PASS | roster status=confirmed; 32/37 experts with a Week 11 card found; missing: none; excused (no card published): Collin Wilson, Daniel Jeremiah & Bucky Brooks, Jason Radowitz, Joe Madden, The Prop Dealer |  |

## Synthesis queues

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| S1 | Sides synthesis queue | REQUIRED | ✅ PASS | scratch/w11-game-synthesis-queue-sides.json: 12 packets; missing=none |  |
| S2 | Props synthesis queue | REQUIRED | ❌ FAIL | scratch/w11-game-synthesis-queue-props.json: 12 packets; missing={"TB@DET": ["bookmaker player-prop board thin/missing (72 rows)", "betonline player-prop board thin/missing (84 rows)"], "ARI@KC": ["bookmaker player-prop board thin/missing (82 rows)", "betonline player-prop board thin/missing (92 rows)"]} | python3 scripts/intel/build-game-synthesis-queue.py --week 11 --pass props --date 2026-11-21 (rebuild LAST, after every input above). |

## Manual confirmations

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| M-news_flags_resolved | news flags resolved | REQUIRED | ✅ PASS | Trades, QB changes, pulled markets and late news checked. RotoWire/Rotoworld are acceptable when current and source-attributed; record the sources and reflect material changes in packets/narratives. — Andy (confirmed in chat; evidence compiled by Claude) 2026-11-21T15:29:00-08:00 |  |
| M-qb_status_confirmed | qb status confirmed | REQUIRED | ✅ PASS | Every starting QB checked against team/league reports or current, source-attributed RotoWire/Rotoworld. Do not clear on projection, rumor, conflicting reports or "trending" language; record sources. — Andy (explicit decision in chat, with caveats) 2026-11-21T15:29:00-08:00 |  |
| M-final_injury_reports_checked | final injury reports checked | REQUIRED | ✅ PASS | Friday's official designations (Out/Doubtful/Questionable) checked for every game — Andy (confirmed in chat; evidence compiled by Claude) 2026-11-21T15:29:00-08:00 |  |
| M-supercontest_report_reviewed | supercontest report reviewed | ADVISORY | ⚠️ WARN | Andy has the Friday SC Intel report (the official five is NOT a prerequisite for either report) | Set "done": true (+ "by", "at") in data/generated/master-intel/w11-gate-manual.json when confirmed. |
| M-experts_no_card | experts no card | ADVISORY | ✅ PASS | Experts checked for a Week 11 card and none published. Each entry lists where we looked. — Andy (confirmed in chat; The Prop Dealer added 17:36 PT as temporary) 2026-11-21T17:36:00-08:00 |  |

## Preferred-expert cards — Week 11

| Expert | Card found in |
|---|---|
| Adam Burke | pull:VSiN |
| Andrew Erickson | pull:BettingPros, reviewed-podcast-picks.json |
| Ben Solak | pull:ESPN NFL |
| Brandon Anderson | pull:Action Network |
| Brandon Kravitz | reviewed-podcast-picks.json, youtube |
| Chad Millman | youtube |
| Chris Welsh | reviewed-podcast-picks.json |
| Cody Brown | 2026-w11-chrome-article-picks.json, bookmark-text-intelligence-digest.md |
| Doug Kezirian | reviewed-podcast-picks.json |
| Ed Feng | grok |
| Evan Abrams | 2026-w11-primer-intel.json |
| Even Money (hosts) | pull:expert, reviewed-podcast-picks.json, youtube |
| Joe Holka | grok |
| John Ewing | bookmark-text-intelligence-digest.md |
| Kendra Middleton | reviewed-podcast-picks.json |
| Lock & Cash | bookmark-text-intelligence-digest.md, reviewed-podcast-picks.json |
| Marc Gartenberg | grok |
| Matt Perrault | youtube |
| Mike Maher | pull:BettingPros |
| Pat Fitzmaurice | youtube |
| Rich Hribar | reviewed-podcast-picks.json |
| Ross Tucker | pull:expert, youtube |
| Sal Vetri | bookmark-text-intelligence-digest.md, grok |
| Scott Bogman | reviewed-podcast-picks.json |
| Sean Koerner | pull:Action Network |
| Seth Woolcock | reviewed-podcast-picks.json |
| Sharp or Square (hosts) | youtube |
| Simon Hunter | youtube |
| Steve Fezzik | pull:expert, youtube |
| Stuckey | pull:Action Network, reviewed-podcast-picks.json |
| The Prop Guru | bookmark-text-intelligence-digest.md, grok |
| Warren Sharp | pull:Sharp Football, youtube |
| Collin Wilson | ❌ not found |
| Jason Radowitz | ❌ not found |
| Joe Madden | ❌ not found |
| Daniel Jeremiah & Bucky Brooks | ❌ not found |
| The Prop Dealer | ❌ not found |

## Twitter media queue (Sunday-slate items)

| Kind | Author | Status | Tweet | Method |
|---|---|---|---|---|

## Preflight freshness table (`weekly-synthesis-preflight.mjs`)

```
Weekly synthesis preflight — 2026 Week 11 — 2026-11-22T02:02:42.150Z
WEEK_START=2026-11-17T04:00:00.000Z  WEEK_END=2026-11-24T04:00:00.000Z  (use in SQL kickoff/captured filters)
 ok   Player availability               3h  1211 events  [data/player-availability/latest.json]
 ok   Projected starters                4h    [data/projected-starters/2026/projected-starters-2026-11-21.json]
 ok   Roster map                        8h  851 players  [data/nfl-rosters/roster-map-latest.json]
 ok   ESPN rosters 2026 (full)         19h  2571 players, 32 teams  [data/nfl-rosters/espn-full-rosters-latest.json]
 ok   ROSTER VET (gate)                     ROSTER VET: PASS - 0 blocking issue(s); player legs resolved: card 0, digest 0; ESPN rosters 2026-11-21T06:52Z (19.2h old, 2571 players)  [python: python3]  -> details: data/generated/master-intel/w11-roster-vet.json
 ok   Secondary matchups               27h  week 11  [data/secondary-matchups/latest.json]
STALE Usage trends (season)           104h  through wk 10  [data/generated/player-usage-trends-2026.json]
 ok   ESPN box scores                       154 files (expect ~160)
 ok   Prediction markets               27h  5075 contracts  [data/prediction-markets/latest.json]
 ok   Cross-market coherence           27h    [data/prediction-markets/cross-market-coherence-latest.json]
 ok   SuperContest lines                5h  13 compared game(s)  [data/supercontest/live-market-comparison.json]
 ok   BKR current lines                 0h  captured 2026-11-22T01:42:58.319Z; ? games  [data/generated/props/bookmaker-live-2026-11-21-week11.json]
 ok   Alpha packet                     27h    [data/alpha/alpha-packet-2026.json]
STALE Expert dossiers                 529h    [data/expert-dossiers/steve-fezzik.json]
STALE Host citations                  529h    [data/generated/host-citations-latest.json]
 ok   Player-props intel                8h    [docs/player-props-intel/player-props-intel-latest.md]
STALE Promoted podcast intelligence      3h  0 promoted episode(s), 0 pick(s), 0 analysis note(s)  [data/generated/master-intel/w11-pull.json]
 ok   Team DVOA / power               104h    [data/generated/team-profiles/team-power-ratings-2026.json]
STALE Prop boards Week11                    0 board file(s)
STALE Futures ledger                  746h    [data/futures-imports/andy-portfolio-ledger-2026.json]
 ok   BEO futures board (import)       96h    [data/futures-imports/betonline-2026-11-18.json]
STALE BKR futures board (import)     1075h    [data/futures-imports/bookmaker-2026-10-07.json]
STALE Promotions                      578h    [data/sportsbooks/promotions-2026.json]
STALE Gemini API billing (LLM)              FAILED (Prepayment credits depleted)

9 stale of 24. Supabase feeds (odds, injuries, intel notes, expert picks) are checked separately via SQL.
```
