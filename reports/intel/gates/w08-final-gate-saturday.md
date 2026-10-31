# Final Gate Check — 2026 Week 8 — Saturday run

Run Sat Oct 31, 2:55 PM PT · games to play: 13 · BKR capture date: 2026-10-31

## Verdict: **RED** — 1 required failure(s), 5 advisory warning(s)

Do NOT start the synthesis/report run. Fix the ❌ REQUIRED rows below (top first), then re-run this check.

### Blocking items

- ❌ **S2 Props synthesis queue** — scratch/w08-game-synthesis-queue-props.json: 13 packets; missing={"LV@NYJ": ["betonline player-prop board thin/missing (78 rows)"], "ARI@DAL": ["betonline player-prop board thin/missing (78 rows)"], "ATL@TB": ["betonline player-prop board thin/missing (84 rows)"], "CLE@PIT": ["betonline player-prop board thin/missing (76 rows)"], "IND@JAX": ["betonline player-pro  
  Fix: python3 scripts/intel/build-game-synthesis-queue.py --week 8 --pass props --date 2026-10-31 (rebuild LAST, after every input above).


## Analysis layer

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| A1 | Week slate confirmed | REQUIRED | ✅ PASS | 14 games, 13 still to play; operator_confirmed=True |  |
| A2 | Team dossiers | REQUIRED | ✅ PASS | data/generated/team-dossiers/2026-w08: 35 team files |  |
| A3 | Roster gate (ESPN 2026, strict) | REQUIRED | ✅ PASS | status=PASS, roster age 0.3h, blocking=0 |  |

## Lines & markets

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| L1 | Bookmaker capture (SGP props + game lines) | REQUIRED | ✅ PASS | data/generated/props/bookmaker-live-2026-10-31-week8.json — 0.4h old (limit 8h); games=13 (need 13) |  |
| L2 | BKR game-lines file for the synthesis queue | REQUIRED | ✅ PASS | data/generated/props/bookmaker-gamelines-2026-10-31-week8.raw.txt |  |
| L3 | Action Network openers (line-move baseline) | REQUIRED | ✅ PASS | data/odds/actionnetwork-openers-2026-w08.json |  |
| L4 | Master Intel pull (signals, expert picks, articles, splits) | REQUIRED | ✅ PASS | data/generated/master-intel/w08-pull.json — 0.0h old (limit 10h); pulled_at=2026-10-31T21:54:46.637Z, signals=425, expert=94 |  |
| L5 | Betting splits (Action Network) | REQUIRED | ✅ PASS | 14 games, newest capture 2026-10-31T21:23:37.277+00:00 (0.5h; limit 8h) |  |
| L6 | BetOnline player props (prop stacks, props pass) | REQUIRED | ✅ PASS | data/generated/props/betonline-live-2026-10-31-week8.json; rows=972; age=0.4h | npm run props:bol:cron (BEO posts Sunday props ~Sat afternoon). |
| L7 | DraftKings Predictions props | ADVISORY | ⚠️ WARN | data/generated/props/dk-predictions-2026-10-17-titans-at-colts.json | npm run props:dkp:launch (log in) → npm run props:dkp:cron → npm run props:dkp:defense |
| L8 | Prediction markets + coherence | ADVISORY | ⚠️ WARN | data/prediction-markets/cross-market-coherence-latest.json — 23.9h old (limit 14h) | Friday/Saturday cadence. |
| L9 | SuperContest contest lines | REQUIRED | ✅ PASS | data/supercontest/week-08-lines.json |  |

## Rosters & injuries

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| I1 | Player availability / injury report | REQUIRED | ✅ PASS | data/player-availability/latest.json — 0.4h old (limit 10h) |  |
| I2 | Projected starters | REQUIRED | ✅ PASS | data/projected-starters/2026/projected-starters-2026-10-31.json — 0.2h old (limit 14h) |  |
| I3 | Weather / venue | REQUIRED | ✅ PASS | data/research-intel/review/2026-w08-weather-venue.json — 20.9h old (limit 24h) |  |

## Analytics

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| Q1 | Team power ratings / SRS (fair lines) | REQUIRED | ✅ PASS | data/generated/team-profiles/team-power-ratings-2026.json — 70.4h old (limit 192h) |  |
| Q2 | Secondary matchup vulnerability | REQUIRED | ✅ PASS | data/secondary-matchups/secondary-matchup-vulnerability-2026-w08.json |  |
| Q3 | FTN Stats IQ weekly context | REQUIRED | ✅ PASS | data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json (24h) | FTN refresh (weekly only). |
| Q4 | Fair-line model + simulator inputs | ADVISORY | ✅ PASS | reports/intel/w08-model/fair-lines-w08.json | Re-run fair_lines.py on current lines (stage run does this). |

## Expert & media intel

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| E1 | YouTube / podcast picks (Gemini, cleaned) | REQUIRED | ✅ PASS | data/podcasts/youtube-extracted-picks-2026-w08.json: 177 picks |  |
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
| E7 | Article intel (VSiN, ESPN, Action Network, BettingPros, PFT, Walter...) | REQUIRED | ✅ PASS | 145 article signals; sources={'VSiN': 46, 'Action Network': 26, 'BettingPros': 32, 'ESPN NFL': 24, 'Pro Football Talk': 14, 'Walter Football': 3}; newest 2026-10-31T21:33:20.115685+00:00 (0.4h) |  |
| E8 | Twitter/X bookmark intel (text) | REQUIRED | ✅ PASS | 280 bookmark signals; newest 2026-10-31T21:51:19.221722+00:00 (0.1h) |  |
| E9 | Twitter media queue (videos / images / threads) processed | REQUIRED | ✅ PASS | data/twitter/w08-media-extraction-queue.json: 0 Sunday-slate items still pending ({}) |  |
| E10 | Preferred-expert final cards (coverage) | REQUIRED | ✅ PASS | roster status=confirmed; 37/37 experts with a Week 8 card found; missing: none |  |

## Synthesis queues

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| S1 | Sides synthesis queue | REQUIRED | ✅ PASS | scratch/w08-game-synthesis-queue-sides.json: 13 packets; missing=none |  |
| S2 | Props synthesis queue | REQUIRED | ❌ FAIL | scratch/w08-game-synthesis-queue-props.json: 13 packets; missing={"LV@NYJ": ["betonline player-prop board thin/missing (78 rows)"], "ARI@DAL": ["betonline player-prop board thin/missing (78 rows)"], "ATL@TB": ["betonline player-prop board thin/missing (84 rows)"], "CLE@PIT": ["betonline player-prop board thin/missing (76 rows)"], "IND@JAX": ["betonline player-pro | python3 scripts/intel/build-game-synthesis-queue.py --week 8 --pass props --date 2026-10-31 (rebuild LAST, after every input above). |

## Manual confirmations

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| M-news_flags_resolved | news flags resolved | REQUIRED | ✅ PASS | Trades, QB changes, pulled markets, late news checked by live search and reflected in packets/narratives — Nelson->SEA, Buckner->SF, Lamar cleared, RJ Harvey OUT (BKR props pulled), Hurts IR/McKee starts; narratives must reflect these in the stage run (step 6) — Claude (web-checked) 2026-10-30 21:25 PT |  |
| M-qb_status_confirmed | qb status confirmed | REQUIRED | ✅ PASS | Every starting QB confirmed (team sites / insiders) — Claude (web-checked) 2026-10-30 21:25 PT |  |
| M-final_injury_reports_checked | final injury reports checked | REQUIRED | ✅ PASS | Friday's official designations (Out/Doubtful/Questionable) checked for every game — Claude (web-checked) 2026-10-30 21:25 PT |  |
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
| Lock & Cash | expert-narratives-2026-w08.md, grok, pull:Twitter/X Bookmarks (Grok thread capture), pull:Twitter/X Bookmarks (Personal), twitter-video-picks-2026-w08.json |
| Marc Gartenberg | expert-narratives-2026-w08.md, pull:Twitter/X Bookmarks (Personal) |
| Matt Perrault | expert-narratives-2026-w08.md, pull:expert, youtube |
| Mike Maher | 2026-w08-chrome-article-picks.json, bettingpros-articles-2026-w08.md, pull:BettingPros |
| Pat Fitzmaurice | expert-narratives-2026-w08.md |
| Rich Hribar | expert-narratives-2026-w08.md, pull:expert, youtube |
| Ross Tucker | expert-narratives-2026-w08.md, youtube |
| Sal Vetri | expert-narratives-2026-w08.md, grok, pull:Twitter/X Bookmarks (Grok thread capture), pull:Twitter/X Bookmarks (Personal), twitter-video-picks-2026-w08.json |
| Scott Bogman | youtube |
| Sean Koerner | 2026-w08-chrome-article-picks.json, expert-narratives-2026-w08.md, pull:Action Network, youtube |
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
Weekly synthesis preflight — 2026 Week 8 — 2026-10-31T21:55:52.165Z
WEEK_START=2026-10-27T04:00:00.000Z  WEEK_END=2026-11-03T04:00:00.000Z  (use in SQL kickoff/captured filters)
 ok   Player availability               0h  527 events  [data/player-availability/latest.json]
 ok   Projected starters                0h    [data/projected-starters/2026/projected-starters-2026-10-31.json]
 ok   Roster map                       24h  845 players  [data/nfl-rosters/roster-map-latest.json]
 ok   ESPN rosters 2026 (full)          0h  2560 players, 32 teams  [data/nfl-rosters/espn-full-rosters-latest.json]
 ok   ROSTER VET (gate)                     ROSTER VET: PASS - 0 blocking issue(s); player legs resolved: card 29, digest 13; ESPN rosters 2026-10-31T21:31Z (0.4h old, 2560 players)  [python: python3]  -> details: data/generated/master-intel/w08-roster-vet.json
 ok   Secondary matchups               24h  week 8  [data/secondary-matchups/latest.json]
STALE Usage trends (season)           101h  through wk 7  [data/generated/player-usage-trends-2026.json]
 ok   ESPN box scores                       109 files (expect ~112)
 ok   Prediction markets               24h  4141 contracts  [data/prediction-markets/latest.json]
 ok   Cross-market coherence           24h    [data/prediction-markets/cross-market-coherence-latest.json]
 ok   SuperContest lines                2h  14 compared game(s)  [data/supercontest/live-market-comparison.json]
 ok   BKR current lines                 0h  captured 2026-10-31T21:26:44.573Z; ? games  [data/generated/props/bookmaker-live-2026-10-31-week8.json]
 ok   Alpha packet                     24h    [data/alpha/alpha-packet-2026.json]
 ok   Expert dossiers                  21h    [data/expert-dossiers/steve-fezzik.json]
 ok   Host citations                   21h    [data/generated/host-citations-latest.json]
 ok   Player-props intel               24h    [docs/player-props-intel/player-props-intel-latest.md]
STALE Promoted podcast intelligence      0h  0 promoted episode(s), 0 pick(s), 0 analysis note(s)  [data/generated/master-intel/w08-pull.json]
 ok   Team DVOA / power                70h    [data/generated/team-profiles/team-power-ratings-2026.json]
STALE Prop boards Week8                     0 board file(s)
STALE Futures ledger                  238h    [data/futures-imports/andy-portfolio-ledger-2026.json]
 ok   BEO futures board (import)       18h    [data/futures-imports/betonline-2026-10-30.json]
STALE BKR futures board (import)      567h    [data/futures-imports/bookmaker-2026-10-07.json]
 ok   Promotions                       70h    [data/sportsbooks/promotions-2026.json]
STALE Gemini API billing (LLM)              FAILED (fetch failed)

6 stale of 24. Supabase feeds (odds, injuries, intel notes, expert picks) are checked separately via SQL.
```
