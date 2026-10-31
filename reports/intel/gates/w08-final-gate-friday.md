# Final Gate Check — 2026 Week 8 — Friday run

Run Fri Oct 30, 11:49 PM PT · games to play: 13 · BKR capture date: 2026-10-31

## Verdict: **GREEN** — 0 required failure(s), 5 advisory warning(s)

All REQUIRED gates pass → start `agents/dev/WEEKLY_INTEL_REPORT_RUN_PROMPT.md` with STAGE=friday.


## Analysis layer

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| A1 | Week slate confirmed | REQUIRED | ✅ PASS | 14 games, 13 still to play; operator_confirmed=True |  |
| A2 | Team dossiers | REQUIRED | ✅ PASS | data/generated/team-dossiers/2026-w08: 35 team files |  |
| A3 | Roster gate (ESPN 2026, strict) | REQUIRED | ✅ PASS | status=PASS, roster age 10.0h, blocking=0 |  |

## Lines & markets

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| L1 | Bookmaker capture (SGP props + game lines) | REQUIRED | ✅ PASS | data/generated/props\bookmaker-live-2026-10-31-week8.json — 4.9h old (limit 30h); games=13 (need 13) |  |
| L2 | BKR game-lines file for the synthesis queue | REQUIRED | ✅ PASS | data/generated/props/bookmaker-gamelines-2026-10-31-week8.raw.txt |  |
| L3 | Action Network openers (line-move baseline) | REQUIRED | ✅ PASS | data/odds/actionnetwork-openers-2026-w08.json |  |
| L4 | Master Intel pull (signals, expert picks, articles, splits) | REQUIRED | ✅ PASS | data/generated/master-intel/w08-pull.json — 1.1h old (limit 30h); pulled_at=2026-10-31T05:43:38.506Z, signals=223, expert=94 |  |
| L5 | Betting splits (Action Network) | REQUIRED | ✅ PASS | 14 games, newest capture 2026-10-31T02:06:35+00:00 (4.7h; limit 30h) |  |
| L6 | BetOnline player props (prop stacks, props pass) | ADVISORY | ⚠️ WARN | data/generated/props\betonline-live-2026-10-29-week8.json; rows=522; age=31.6h | npm run props:bol:cron (BEO posts Sunday props ~Sat afternoon). |
| L7 | DraftKings Predictions props | ADVISORY | ⚠️ WARN | data/generated/props\dk-predictions-2026-10-17-titans-at-colts.json | npm run props:dkp:launch (log in) → npm run props:dkp:cron → npm run props:dkp:defense |
| L8 | Prediction markets + coherence | ADVISORY | ✅ PASS | data/prediction-markets/cross-market-coherence-latest.json — 8.8h old (limit 36h) |  |
| L9 | SuperContest contest lines | REQUIRED | ✅ PASS | data/supercontest/week-08-lines.json |  |

## Rosters & injuries

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| I1 | Player availability / injury report | REQUIRED | ✅ PASS | data/player-availability/latest.json — 7.3h old (limit 24h) |  |
| I2 | Projected starters | REQUIRED | ✅ PASS | data/projected-starters/2026\projected-starters-2026-10-30.json — 8.8h old (limit 30h) |  |
| I3 | Weather / venue | ADVISORY | ✅ PASS | data/research-intel/review/2026-w08-weather-venue.json — 5.8h old (limit 48h) |  |

## Analytics

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| Q1 | Team power ratings / SRS (fair lines) | REQUIRED | ✅ PASS | data/generated/team-profiles/team-power-ratings-2026.json — 55.3h old (limit 192h) |  |
| Q2 | Secondary matchup vulnerability | REQUIRED | ✅ PASS | data/secondary-matchups/secondary-matchup-vulnerability-2026-w08.json |  |
| Q3 | FTN Stats IQ weekly context | REQUIRED | ✅ PASS | data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json (9h) | FTN refresh (weekly only). |
| Q4 | Fair-line model + simulator inputs | ADVISORY | ✅ PASS | reports/intel/w08-model/fair-lines-w08.json | Re-run fair_lines.py on current lines (stage run does this). |

## Expert & media intel

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| E1 | YouTube / podcast picks (Gemini, cleaned) | REQUIRED | ✅ PASS | data/podcasts/youtube-extracted-picks-2026-w08.json: 109 picks |  |
| E2 | Grok X-thread extraction (every week) | REQUIRED | ✅ PASS | 1 CSV in data/vault-seed/manual/grok-week08-threads (latest grok-twitter-picks-2026-10-31.csv) |  |
| E3 | BettingPros article intel | ADVISORY | ✅ PASS | reports/intel/bettingpros-articles-2026-w08.md | Read the week's BettingPros NFL articles (Claude in Chrome). |
| E4 | Per-expert narrative summaries | ADVISORY | ✅ PASS | reports/intel/expert-narratives-2026-w08.md | Written during the stage run (step 6). |
| E5 | Article feed health | ADVISORY | ⚠️ WARN | Gemini Audio Diarization: Gemini file upload (start) failed: {
  "error": {
    "code": 402,
    "message": "Your prepayment credits are depleted. Please go to AI Studio at https://ai.studio/projects to manage your project and billing. Learn more at https://ai.google.dev/gemini-api/docs/billing#prepay. ",
    "status": "RESOURCE_EXHAUSTED"
  }
}
 | Cover failed feeds by browser pulls. |
| E6 | Podcast intel (audio transcripts + promoted picks) | REQUIRED | ✅ PASS | transcripts processed=14; promoted episodes=0, picks=0; YouTube picks file=yes |  |
| E7 | Article intel (VSiN, ESPN, Action Network, BettingPros, PFT, Walter...) | REQUIRED | ✅ PASS | 116 article signals; sources={'ESPN NFL': 23, 'VSiN': 31, 'BettingPros': 22, 'Action Network': 23, 'Pro Football Talk': 14, 'Walter Football': 3}; newest 2026-10-30T14:28:13.593412+00:00 (16.4h) |  |
| E8 | Twitter/X bookmark intel (text) | REQUIRED | ✅ PASS | 107 bookmark signals; newest 2026-10-31T04:37:09.260796+00:00 (2.2h) |  |
| E9 | Twitter media queue (videos / images / threads) processed | ADVISORY | ✅ PASS | data/twitter/w08-media-extraction-queue.json: 0 Sunday-slate items still pending ({}) |  |
| E10 | Preferred-expert final cards (coverage) | ADVISORY | ✅ PASS | roster status=confirmed; 37/37 experts with a Week 8 card found; missing: none |  |

## Synthesis queues

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| S1 | Sides synthesis queue | REQUIRED | ✅ PASS | scratch/w08-game-synthesis-queue-sides.json: 13 packets; missing=none |  |
| S2 | Props synthesis queue | ADVISORY | ✅ PASS | scratch/w08-game-synthesis-queue-props.json: 13 packets; missing={"LV@NYJ": ["betonline player-prop board thin/missing (26 rows)"], "ARI@DAL": ["betonline player-prop board thin/missing (26 rows)"], "ATL@TB": ["betonline player-prop board thin/missing (32 rows)"], "CLE@PIT": ["betonline player-prop board thin/missing (22 rows)"], "IND@JAX": ["betonline player-pro |  |

## Manual confirmations

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| M-news_flags_resolved | news flags resolved | REQUIRED | ✅ PASS | Trades, QB changes, pulled markets, late news checked by live search and reflected in packets/narratives — Nelson->SEA, Buckner->SF, Lamar cleared, RJ Harvey OUT (BKR props pulled), Hurts IR/McKee starts; narratives must reflect these in the stage run (step 6) — Claude (web-checked) 2026-10-30 21:25 PT |  |
| M-qb_status_confirmed | qb status confirmed | REQUIRED | ✅ PASS | Every starting QB confirmed (team sites / insiders) — Claude (web-checked) 2026-10-30 21:25 PT |  |
| M-final_injury_reports_checked | final injury reports checked | ADVISORY | ✅ PASS | Friday's official designations (Out/Doubtful/Questionable) checked for every game — Claude (web-checked) 2026-10-30 21:25 PT |  |
| M-supercontest_report_reviewed | supercontest report reviewed | ADVISORY | ⚠️ WARN | Andy has the Friday SC Intel report (the official five is NOT a prerequisite for either report) | Set "done": true (+ "by", "at") in data/generated/master-intel/w08-gate-manual.json when confirmed. |
| M-experts_no_card | experts no card | ADVISORY | ⚠️ WARN | Checked: Collin Wilson — not on the AN Week 8 Betting Preview (speakers Stuckey, Kezirian, Abrams) and no Week 8 NFL article on the AN hub (his recent work is CFB). Pat Fitzmaurice — no Week 8 betting card found (FantasyPros not in discovery). Joe Madden — no outlet on record; web search found nothing attributable (Bleacher Nation computer picks are Data Skrive). Ed Feng — Week 8 content is a Bills analytics video only (no picks); site predictions not public. Andy: keep or drop Fitzmaurice/Madden from the roster. | Set "done": true (+ "by", "at") in data/generated/master-intel/w08-gate-manual.json when confirmed. |

## Preferred-expert cards — Week 8

| Expert | Card found in |
|---|---|
| Adam Burke | expert-narratives-2026-w08.md, pull:VSiN |
| Andrew Erickson | expert-narratives-2026-w08.md, pull:BettingPros, youtube |
| Ben Solak | expert-narratives-2026-w08.md, pull:ESPN NFL |
| Brandon Anderson | expert-narratives-2026-w08.md, pull:Action Network, pull:expert, youtube |
| Brandon Kravitz | expert-narratives-2026-w08.md, youtube |
| Chad Millman | expert-narratives-2026-w08.md, pull:expert, youtube |
| Chris Welsh | expert-narratives-2026-w08.md, youtube |
| Cody Brown | expert-narratives-2026-w08.md, pull:Twitter/X Bookmarks (Personal), twitter-video-picks-2026-w08.json |
| Collin Wilson | expert-narratives-2026-w08.md |
| Daniel Jeremiah & Bucky Brooks | expert-narratives-2026-w08.md, pull:ESPN NFL, pull:expert |
| Doug Kezirian | expert-narratives-2026-w08.md, youtube |
| Ed Feng | expert-narratives-2026-w08.md |
| Evan Abrams | 2026-w08-primer-intel.json, expert-narratives-2026-w08.md, youtube |
| Even Money (hosts) | expert-narratives-2026-w08.md, pull:expert |
| Jason Radowitz | bettingpros-articles-2026-w08.md, expert-narratives-2026-w08.md, pull:BettingPros |
| Joe Holka | expert-narratives-2026-w08.md, pull:Twitter/X Bookmarks (Personal) |
| Joe Madden | expert-narratives-2026-w08.md |
| John Ewing | expert-narratives-2026-w08.md, pull:Twitter/X Bookmarks (Personal) |
| Kendra Middleton | expert-narratives-2026-w08.md, youtube |
| Lock & Cash | expert-narratives-2026-w08.md, grok, pull:Twitter/X Bookmarks (Grok thread capture), twitter-video-picks-2026-w08.json |
| Marc Gartenberg | expert-narratives-2026-w08.md, pull:Twitter/X Bookmarks (Personal) |
| Matt Perrault | expert-narratives-2026-w08.md, pull:expert, youtube |
| Mike Maher | bettingpros-articles-2026-w08.md, expert-narratives-2026-w08.md, pull:BettingPros |
| Pat Fitzmaurice | expert-narratives-2026-w08.md |
| Rich Hribar | expert-narratives-2026-w08.md, pull:expert, youtube |
| Ross Tucker | expert-narratives-2026-w08.md, youtube |
| Sal Vetri | expert-narratives-2026-w08.md, grok, pull:Twitter/X Bookmarks (Grok thread capture), pull:Twitter/X Bookmarks (Personal), twitter-video-picks-2026-w08.json |
| Scott Bogman | expert-narratives-2026-w08.md, youtube |
| Sean Koerner | 2026-w08-chrome-article-picks.json, expert-narratives-2026-w08.md, pull:Action Network |
| Seth Woolcock | expert-narratives-2026-w08.md, youtube |
| Sharp or Square (hosts) | expert-narratives-2026-w08.md, pull:expert, youtube |
| Simon Hunter | expert-narratives-2026-w08.md, pull:expert, youtube |
| Steve Fezzik | expert-narratives-2026-w08.md, youtube |
| Stuckey | expert-narratives-2026-w08.md, youtube |
| The Prop Dealer | expert-narratives-2026-w08.md, pull:Twitter/X Bookmarks (Personal), pull:Twitter/X Bookmarks (Personal) (linked article) |
| The Prop Guru | expert-narratives-2026-w08.md, grok, pull:Twitter/X Bookmarks (Grok thread capture), pull:Twitter/X Bookmarks (Personal) |
| Warren Sharp | expert-narratives-2026-w08.md, pull:Twitter/X Bookmarks (Personal), pull:expert, youtube |

## Twitter media queue (Sunday-slate items)

| Kind | Author | Status | Tweet | Method |
|---|---|---|---|---|
| video | SharpFootball | done | https://x.com/SharpFootball/status/2115098526799839473 | audio transcription (single speaker = account) -> pick extraction; sch |
| linked_youtube | SharpFootball | done | https://x.com/SharpFootball/status/2115115399704694810 | YouTube sweep (--only-ids) or transcript of the linked video |
| linked_youtube | SharpFootball | skip | https://x.com/SharpFootball/status/2115116599493509475 | YouTube sweep (--only-ids) or transcript of the linked video |
| video | salbets_ | done | https://x.com/salbets_/status/2115481971044331576 | audio transcription (single speaker = account) -> pick extraction; sch |
| video | lockandcash | done | https://x.com/lockandcash/status/2116170932544798882 | audio transcription (single speaker = account) -> pick extraction; sch |
| video | thepowerrank | done | https://x.com/thepowerrank/status/2116188374599864686 | audio transcription (single speaker = account) -> pick extraction; sch |
| thread_text | The Prop Guru | done | https://x.com/thepropguru_/status/2116198450706727079 | Grok thread extraction (weekly prompt) -> CSV -> load-external-intel-p |
| thread_text | Ed Feng | done | https://x.com/thepowerrank/status/2116188374599864686 | Grok thread extraction (weekly prompt) -> CSV -> load-external-intel-p |
| thread_text | Lock & Cash Sports | done | https://x.com/lockandcash/status/2116170932544798882 | Grok thread extraction (weekly prompt) -> CSV -> load-external-intel-p |
| thread_text | Sal Bets | done | https://x.com/salbets_/status/2116152408908685541 | Grok thread extraction (weekly prompt) -> CSV -> load-external-intel-p |
| thread_text | Linemate | done | https://x.com/yourlinemate/status/2115896457056379177 | Grok thread extraction (weekly prompt) -> CSV -> load-external-intel-p |
| thread_text | The Prop Dealer | done | https://x.com/thepropdealer/status/2115880740907012550 | Grok thread extraction (weekly prompt) -> CSV -> load-external-intel-p |
| thread_text | Ian Hartitz | done | https://x.com/Ihartitz/status/2115845292096385146 | Grok thread extraction (weekly prompt) -> CSV -> load-external-intel-p |
| thread_text | RotoWire Fantasy Football | done | https://x.com/RotoWireNFL/status/2115599041849335829 | Grok thread extraction (weekly prompt) -> CSV -> load-external-intel-p |
| thread_text | Joe Holka | done | https://x.com/thejoeholkashow/status/2115586916154564787 | Grok thread extraction (weekly prompt) -> CSV -> load-external-intel-p |
| thread_text | Marc Gartenberg | done | https://x.com/GBERGFF/status/2115228790557491425 | Grok thread extraction (weekly prompt) -> CSV -> load-external-intel-p |
| thread_text | Deepak Chona, MD. SMA | done | https://x.com/SportMDAnalysis/status/2114837615975473465 | Grok thread extraction (weekly prompt) -> CSV -> load-external-intel-p |
| thread_text | Deepak Chona, MD. SMA | done | https://x.com/SportMDAnalysis/status/2114081508642185515 | Grok thread extraction (weekly prompt) -> CSV -> load-external-intel-p |
| image_or_chart | Warren Sharp | done | https://x.com/SharpFootball/status/2116239965537349723 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Cody Brown Bets | done | https://x.com/CodyBrownBets/status/2116229412798742940 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Warren Sharp | done | https://x.com/SharpFootball/status/2116220840773640683 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Warren Sharp | done | https://x.com/SharpFootball/status/2116206998056513957 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Warren Sharp | done | https://x.com/SharpFootball/status/2116202971499508031 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Warren Sharp | done | https://x.com/SharpFootball/status/2116195170144448987 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Warren Sharp | done | https://x.com/SharpFootball/status/2116176295839318041 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | John Ewing | done | https://x.com/johnewing/status/2116175793516855486 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Warren Sharp | done | https://x.com/SharpFootball/status/2116172018358038861 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | John Ewing | done | https://x.com/johnewing/status/2116172018630459696 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Ben Fawkes | done | https://x.com/BFawkes22/status/2116149463773249987 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Jimmy’s Sport Picks | done | https://x.com/JimmySportPicks/status/2115922296552444133 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Jimmy’s Sport Picks | done | https://x.com/JimmySportPicks/status/2115922296632201330 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Gilles Gallant | done | https://x.com/GDAWG5000/status/2115880936130609484 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Lock & Cash Sports | done | https://x.com/lockandcash/status/2115867657106870639 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Cody Main | done | https://x.com/cmain7/status/2115818876864958729 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | Sal Bets | done | https://x.com/salbets_/status/2115803148317270318 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |
| image_or_chart | The Prop Dealer | done | https://x.com/thepropdealer/status/2115628503236329931 | Grok (reads tweet images) first; if Grok returns no data, screenshot v |

## Preflight freshness table (`weekly-synthesis-preflight.mjs`)

```
Weekly synthesis preflight â€” 2026 Week 8 â€” 2026-10-31T06:49:21.053Z
WEEK_START=2026-10-27T04:00:00.000Z  WEEK_END=2026-11-03T04:00:00.000Z  (use in SQL kickoff/captured filters)
 ok   Player availability               7h  1158 events  [data/player-availability/latest.json]
 ok   Projected starters                9h    [data/projected-starters/2026/projected-starters-2026-10-30.json]
 ok   Roster map                        9h  845 players  [data/nfl-rosters/roster-map-latest.json]
 ok   ESPN rosters 2026 (full)         10h  2558 players, 32 teams  [data/nfl-rosters/espn-full-rosters-latest.json]
 ok   ROSTER VET (gate)                     ROSTER VET: PASS - 0 blocking issue(s); player legs resolved: card 7, digest 0; ESPN rosters 2026-10-30T20:44Z (10.1h old, 2558 players)  [python: C:\Users\andre\AppData\Local\Python\pythoncore-3.14-64\python.exe]  -> details: data/generated/master-intel/w08-roster-vet.json
 ok   Secondary matchups                9h  week 8  [data/secondary-matchups/latest.json]
STALE Usage trends (season)            86h  through wk 7  [data/generated/player-usage-trends-2026.json]
 ok   ESPN box scores                       109 files (expect ~112)
 ok   Prediction markets                9h  4141 contracts  [data/prediction-markets/latest.json]
 ok   Cross-market coherence            9h    [data/prediction-markets/cross-market-coherence-latest.json]
 ok   SuperContest lines               11h  14 compared game(s)  [data/supercontest/live-market-comparison.json]
 ok   BKR current lines                 5h  captured 2026-10-31T01:50:29.530Z; ? games  [data/generated/props/bookmaker-live-2026-10-31-week8.json]
 ok   Alpha packet                      9h    [data/alpha/alpha-packet-2026.json]
 ok   Expert dossiers                   6h    [data/expert-dossiers/steve-fezzik.json]
 ok   Host citations                    6h    [data/generated/host-citations-latest.json]
 ok   Player-props intel                9h    [docs/player-props-intel/player-props-intel-latest.md]
STALE Promoted podcast intelligence      1h  0 promoted episode(s), 0 pick(s), 0 analysis note(s)  [data/generated/master-intel/w08-pull.json]
 ok   Team DVOA / power                55h    [data/generated/team-profiles/team-power-ratings-2026.json]
STALE Prop boards Week8                     0 board file(s)
STALE Futures ledger                  223h    [data/futures-imports/andy-portfolio-ledger-2026.json]
 ok   BEO futures board (import)        3h    [data/futures-imports/betonline-2026-10-30.json]
STALE BKR futures board (import)      552h    [data/futures-imports/bookmaker-2026-10-07.json]
 ok   Promotions                       55h    [data/sportsbooks/promotions-2026.json]
STALE Gemini API billing (LLM)              FAILED (fetch failed)

6 stale of 24. Supabase feeds (odds, injuries, intel notes, expert picks) are checked separately via SQL.
```
