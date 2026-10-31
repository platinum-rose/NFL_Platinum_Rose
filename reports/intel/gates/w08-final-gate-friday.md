# Final Gate Check — 2026 Week 8 — Friday run

Run Fri Oct 30, 9:07 PM PT · games to play: 13 · BKR capture date: 2026-10-31

## Verdict: **RED** — 5 required failure(s), 7 advisory warning(s)

Do NOT start the synthesis/report run. Fix the ❌ REQUIRED rows below (top first), then re-run this check.

### Blocking items

- ❌ **E1 YouTube / podcast picks (Gemini, cleaned)** — missing: data/podcasts/youtube-extracted-picks-2026-w08.json  
  Fix: Sweep → Gemini extraction (Andy terminal) → clean to the picks file (runbook §4).
- ❌ **E2 Grok X-thread extraction (every week)** — 0 CSV in data/vault-seed/manual/grok-week08-threads  
  Fix: Paste data/research-intel/grok-thread-prompt-latest.md into Grok → save CSV there → node scripts/load-external-intel-picks.mjs --dry-run, then --replace.
- ❌ **E6 Podcast intel (audio transcripts + promoted picks)** — transcripts processed=14; promoted episodes=0, picks=0; YouTube picks file=no  
  Fix: Run the podcast transcript pipeline / promotion; YouTube picks (E1) count toward this.
- ❌ **M-news_flags_resolved news flags resolved** — Trades, QB changes, pulled markets, late news checked by live search and reflected in packets/narratives  
  Fix: Set "done": true (+ "by", "at") in data/generated/master-intel/w08-gate-manual.json when confirmed.
- ❌ **M-qb_status_confirmed qb status confirmed** — Every starting QB confirmed (team sites / insiders)  
  Fix: Set "done": true (+ "by", "at") in data/generated/master-intel/w08-gate-manual.json when confirmed.


## Analysis layer

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| A1 | Week slate confirmed | REQUIRED | ✅ PASS | 14 games, 13 still to play; operator_confirmed=True |  |
| A2 | Team dossiers | REQUIRED | ✅ PASS | data/generated/team-dossiers/2026-w08: 35 team files |  |
| A3 | Roster gate (ESPN 2026, strict) | REQUIRED | ✅ PASS | status=PASS, roster age 7.3h, blocking=0 |  |

## Lines & markets

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| L1 | Bookmaker capture (SGP props + game lines) | REQUIRED | ✅ PASS | data/generated/props/bookmaker-live-2026-10-31-week8.json — 2.2h old (limit 30h); games=13 (need 13) |  |
| L2 | BKR game-lines file for the synthesis queue | REQUIRED | ✅ PASS | data/generated/props/bookmaker-gamelines-2026-10-31-week8.raw.txt |  |
| L3 | Action Network openers (line-move baseline) | REQUIRED | ✅ PASS | data/odds/actionnetwork-openers-2026-w08.json |  |
| L4 | Master Intel pull (signals, expert picks, articles, splits) | REQUIRED | ✅ PASS | data/generated/master-intel/w08-pull.json — 2.0h old (limit 30h); pulled_at=2026-10-30T22:34:51.847Z, signals=214, expert=94 |  |
| L5 | Betting splits (Action Network) | REQUIRED | ✅ PASS | 14 games, newest capture 2026-10-31T02:06:35+00:00 (2.0h; limit 30h) |  |
| L6 | BetOnline player props (prop stacks, props pass) | ADVISORY | ✅ PASS | data/generated/props/betonline-live-2026-10-29-week8.json; rows=522; age=28.9h | npm run props:bol:cron (BEO posts Sunday props ~Sat afternoon). |
| L7 | DraftKings Predictions props | ADVISORY | ⚠️ WARN | data/generated/props/dk-predictions-2026-10-17-titans-at-colts.json | npm run props:dkp:launch (log in) → npm run props:dkp:cron → npm run props:dkp:defense |
| L8 | Prediction markets + coherence | ADVISORY | ✅ PASS | data/prediction-markets/cross-market-coherence-latest.json — 6.1h old (limit 36h) |  |
| L9 | SuperContest contest lines | REQUIRED | ✅ PASS | data/supercontest/week-08-lines.json |  |

## Rosters & injuries

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| I1 | Player availability / injury report | REQUIRED | ✅ PASS | data/player-availability/latest.json — 4.6h old (limit 24h) |  |
| I2 | Projected starters | REQUIRED | ✅ PASS | data/projected-starters/2026/projected-starters-2026-10-30.json — 6.1h old (limit 30h) |  |
| I3 | Weather / venue | ADVISORY | ✅ PASS | data/research-intel/review/2026-w08-weather-venue.json — 3.1h old (limit 48h) |  |

## Analytics

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| Q1 | Team power ratings / SRS (fair lines) | REQUIRED | ✅ PASS | data/generated/team-profiles/team-power-ratings-2026.json — 52.6h old (limit 192h) |  |
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
| E6 | Podcast intel (audio transcripts + promoted picks) | REQUIRED | ❌ FAIL | transcripts processed=14; promoted episodes=0, picks=0; YouTube picks file=no | Run the podcast transcript pipeline / promotion; YouTube picks (E1) count toward this. |
| E7 | Article intel (VSiN, ESPN, Action Network, BettingPros, PFT, Walter...) | REQUIRED | ✅ PASS | 116 article signals; sources={'ESPN NFL': 23, 'VSiN': 31, 'BettingPros': 22, 'Action Network': 23, 'Pro Football Talk': 14, 'Walter Football': 3}; newest 2026-10-30T14:28:13.593412+00:00 (13.7h) |  |
| E8 | Twitter/X bookmark intel (text) | REQUIRED | ✅ PASS | 98 bookmark signals; newest 2026-10-30T19:27:35.729542+00:00 (8.7h) |  |
| E9 | Twitter media queue (videos / images / threads) processed | ADVISORY | ⚠️ WARN | data/twitter/w08-media-extraction-queue.json: 36 Sunday-slate items still pending ({'video': 4, 'linked_youtube': 2, 'thread_text': 12, 'image_or_chart': 18}) | Process each item (video transcription, Grok threads, image capture) or mark it skipped with a reason. |
| E10 | Preferred-expert final cards (coverage) | ADVISORY | ⚠️ WARN | roster status=draft_pending_andy; 18/37 experts with a Week 8 card found; missing: Stuckey, Doug Kezirian, Collin Wilson, Evan Abrams, Chad Millman, Simon Hunter, Matt Perrault, Steve Fezzik, Ross Tucker, Rich Hribar, Scott Bogman, Kendra Middleton, Chris Welsh, Seth Woolcock, Brandon Kravitz, Pat Fitzmaurice, Joe Madden, Ed Feng, Lock & Cash | Andy confirms data/expert-tracking/preferred-experts-2026.json (status "confirmed"). Find each missing expert's card (article / podcast / YouTube / X) and ingest it, or list them under "experts_no_card": {"names": [...], "note": ...} in the gate-manual file after checking. |

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

## Preferred-expert cards — Week 8

| Expert | Card found in |
|---|---|
| Adam Burke | pull:VSiN |
| Andrew Erickson | pull:BettingPros |
| Ben Solak | pull:ESPN NFL |
| Brandon Anderson | pull:Action Network |
| Cody Brown | pull:Twitter/X Bookmarks (Personal) |
| Daniel Jeremiah & Bucky Brooks | pull:ESPN NFL, pull:expert |
| Even Money (hosts) | pull:expert |
| Jason Radowitz | bettingpros-articles-2026-w08.md, pull:BettingPros |
| Joe Holka | pull:Twitter/X Bookmarks (Personal) |
| John Ewing | pull:Twitter/X Bookmarks (Personal) |
| Marc Gartenberg | pull:Twitter/X Bookmarks (Personal) |
| Mike Maher | bettingpros-articles-2026-w08.md, pull:BettingPros |
| Sal Vetri | pull:Twitter/X Bookmarks (Personal) |
| Sean Koerner | pull:Action Network |
| Sharp or Square (hosts) | pull:expert |
| The Prop Dealer | pull:Twitter/X Bookmarks (Personal), pull:Twitter/X Bookmarks (Personal) (linked article) |
| The Prop Guru | pull:Twitter/X Bookmarks (Personal) |
| Warren Sharp | pull:Twitter/X Bookmarks (Personal), pull:expert |
| Stuckey | ❌ not found |
| Doug Kezirian | ❌ not found |
| Collin Wilson | ❌ not found |
| Evan Abrams | ❌ not found |
| Chad Millman | ❌ not found |
| Simon Hunter | ❌ not found |
| Matt Perrault | ❌ not found |
| Steve Fezzik | ❌ not found |
| Ross Tucker | ❌ not found |
| Rich Hribar | ❌ not found |
| Scott Bogman | ❌ not found |
| Kendra Middleton | ❌ not found |
| Chris Welsh | ❌ not found |
| Seth Woolcock | ❌ not found |
| Brandon Kravitz | ❌ not found |
| Pat Fitzmaurice | ❌ not found |
| Joe Madden | ❌ not found |
| Ed Feng | ❌ not found |
| Lock & Cash | ❌ not found |

## Twitter media queue (Sunday-slate items)

| Kind | Author | Status | Tweet | Method |
|---|---|---|---|---|
| video | SharpFootball | pending | https://x.com/SharpFootball/status/2115098526799839473 | audio transcription (single speaker = account) -> pick extraction; sch |
| linked_youtube | SharpFootball | pending | https://x.com/SharpFootball/status/2115115399704694810 | YouTube sweep (--only-ids) or transcript of the linked video |
| linked_youtube | SharpFootball | pending | https://x.com/SharpFootball/status/2115116599493509475 | YouTube sweep (--only-ids) or transcript of the linked video |
| video | salbets_ | pending | https://x.com/salbets_/status/2115481971044331576 | audio transcription (single speaker = account) -> pick extraction; sch |
| video | lockandcash | pending | https://x.com/lockandcash/status/2116170932544798882 | audio transcription (single speaker = account) -> pick extraction; sch |
| video | thepowerrank | pending | https://x.com/thepowerrank/status/2116188374599864686 | audio transcription (single speaker = account) -> pick extraction; sch |
| thread_text | The Prop Guru | pending | https://x.com/thepropguru_/status/2116198450706727079 | Grok thread extraction (weekly prompt) -> CSV -> load-external-intel-p |
| thread_text | Ed Feng | pending | https://x.com/thepowerrank/status/2116188374599864686 | Grok thread extraction (weekly prompt) -> CSV -> load-external-intel-p |
| thread_text | Lock & Cash Sports | pending | https://x.com/lockandcash/status/2116170932544798882 | Grok thread extraction (weekly prompt) -> CSV -> load-external-intel-p |
| thread_text | Sal Bets | pending | https://x.com/salbets_/status/2116152408908685541 | Grok thread extraction (weekly prompt) -> CSV -> load-external-intel-p |
| thread_text | Linemate | pending | https://x.com/yourlinemate/status/2115896457056379177 | Grok thread extraction (weekly prompt) -> CSV -> load-external-intel-p |
| thread_text | The Prop Dealer | pending | https://x.com/thepropdealer/status/2115880740907012550 | Grok thread extraction (weekly prompt) -> CSV -> load-external-intel-p |
| thread_text | Ian Hartitz | pending | https://x.com/Ihartitz/status/2115845292096385146 | Grok thread extraction (weekly prompt) -> CSV -> load-external-intel-p |
| thread_text | RotoWire Fantasy Football | pending | https://x.com/RotoWireNFL/status/2115599041849335829 | Grok thread extraction (weekly prompt) -> CSV -> load-external-intel-p |
| thread_text | Joe Holka | pending | https://x.com/thejoeholkashow/status/2115586916154564787 | Grok thread extraction (weekly prompt) -> CSV -> load-external-intel-p |
| thread_text | Marc Gartenberg | pending | https://x.com/GBERGFF/status/2115228790557491425 | Grok thread extraction (weekly prompt) -> CSV -> load-external-intel-p |
| thread_text | Deepak Chona, MD. SMA | pending | https://x.com/SportMDAnalysis/status/2114837615975473465 | Grok thread extraction (weekly prompt) -> CSV -> load-external-intel-p |
| thread_text | Deepak Chona, MD. SMA | pending | https://x.com/SportMDAnalysis/status/2114081508642185515 | Grok thread extraction (weekly prompt) -> CSV -> load-external-intel-p |
| image_or_chart | Warren Sharp | pending | https://x.com/SharpFootball/status/2116239965537349723 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Cody Brown Bets | pending | https://x.com/CodyBrownBets/status/2116229412798742940 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Warren Sharp | pending | https://x.com/SharpFootball/status/2116220840773640683 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Warren Sharp | pending | https://x.com/SharpFootball/status/2116206998056513957 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Warren Sharp | pending | https://x.com/SharpFootball/status/2116202971499508031 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Warren Sharp | pending | https://x.com/SharpFootball/status/2116195170144448987 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Warren Sharp | pending | https://x.com/SharpFootball/status/2116176295839318041 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | John Ewing | pending | https://x.com/johnewing/status/2116175793516855486 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Warren Sharp | pending | https://x.com/SharpFootball/status/2116172018358038861 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | John Ewing | pending | https://x.com/johnewing/status/2116172018630459696 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Ben Fawkes | pending | https://x.com/BFawkes22/status/2116149463773249987 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Jimmy’s Sport Picks | pending | https://x.com/JimmySportPicks/status/2115922296552444133 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Jimmy’s Sport Picks | pending | https://x.com/JimmySportPicks/status/2115922296632201330 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Gilles Gallant | pending | https://x.com/GDAWG5000/status/2115880936130609484 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Lock & Cash Sports | pending | https://x.com/lockandcash/status/2115867657106870639 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Cody Main | pending | https://x.com/cmain7/status/2115818876864958729 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Sal Bets | pending | https://x.com/salbets_/status/2115803148317270318 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | The Prop Dealer | pending | https://x.com/thepropdealer/status/2115628503236329931 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |

## Preflight freshness table (`weekly-synthesis-preflight.mjs`)

```
Weekly synthesis preflight — 2026 Week 8 — 2026-10-31T04:07:49.763Z
WEEK_START=2026-10-27T04:00:00.000Z  WEEK_END=2026-11-03T04:00:00.000Z  (use in SQL kickoff/captured filters)
 ok   Player availability               5h  1158 events  [data/player-availability/latest.json]
 ok   Projected starters                6h    [data/projected-starters/2026/projected-starters-2026-10-30.json]
 ok   Roster map                        6h  845 players  [data/nfl-rosters/roster-map-latest.json]
 ok   ESPN rosters 2026 (full)          7h  2558 players, 32 teams  [data/nfl-rosters/espn-full-rosters-latest.json]
 ok   ROSTER VET (gate)                     ROSTER VET: PASS - 0 blocking issue(s); player legs resolved: card 7, digest 0; ESPN rosters 2026-10-30T20:44Z (7.4h old, 2558 players)  [python: python3]  -> details: data/generated/master-intel/w08-roster-vet.json
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
STALE Promoted podcast intelligence      6h  0 promoted episode(s), 0 pick(s), 0 analysis note(s)  [data/generated/master-intel/w08-pull.json]
 ok   Team DVOA / power                53h    [data/generated/team-profiles/team-power-ratings-2026.json]
STALE Prop boards Week8                     0 board file(s)
STALE Futures ledger                  220h    [data/futures-imports/andy-portfolio-ledger-2026.json]
 ok   BEO futures board (import)        1h    [data/futures-imports/betonline-2026-10-30.json]
STALE BKR futures board (import)      550h    [data/futures-imports/bookmaker-2026-10-07.json]
 ok   Promotions                       52h    [data/sportsbooks/promotions-2026.json]
 ok   Gemini API billing (LLM)              active (HTTP 200)

5 stale of 24. Supabase feeds (odds, injuries, intel notes, expert picks) are checked separately via SQL.
```
