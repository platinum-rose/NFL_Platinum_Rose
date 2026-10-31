# Final Gate Check — 2026 Week 8 — Friday run

Run Fri Oct 30, 10:44 PM PT · games to play: 13 · BKR capture date: 2026-10-31

## Verdict: **GREEN** — 0 required failure(s), 6 advisory warning(s)

All REQUIRED gates pass → start `agents/dev/WEEKLY_INTEL_REPORT_RUN_PROMPT.md` with STAGE=friday.


## Analysis layer

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| A1 | Week slate confirmed | REQUIRED | ✅ PASS | 14 games, 13 still to play; operator_confirmed=True |  |
| A2 | Team dossiers | REQUIRED | ✅ PASS | data/generated/team-dossiers/2026-w08: 35 team files |  |
| A3 | Roster gate (ESPN 2026, strict) | REQUIRED | ✅ PASS | status=PASS, roster age 8.5h, blocking=0 |  |

## Lines & markets

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| L1 | Bookmaker capture (SGP props + game lines) | REQUIRED | ✅ PASS | data/generated/props/bookmaker-live-2026-10-31-week8.json — 3.8h old (limit 30h); games=13 (need 13) |  |
| L2 | BKR game-lines file for the synthesis queue | REQUIRED | ✅ PASS | data/generated/props/bookmaker-gamelines-2026-10-31-week8.raw.txt |  |
| L3 | Action Network openers (line-move baseline) | REQUIRED | ✅ PASS | data/odds/actionnetwork-openers-2026-w08.json |  |
| L4 | Master Intel pull (signals, expert picks, articles, splits) | REQUIRED | ✅ PASS | data/generated/master-intel/w08-pull.json — 0.0h old (limit 30h); pulled_at=2026-10-31T05:43:38.506Z, signals=223, expert=94 |  |
| L5 | Betting splits (Action Network) | REQUIRED | ✅ PASS | 14 games, newest capture 2026-10-31T02:06:35+00:00 (3.6h; limit 30h) |  |
| L6 | BetOnline player props (prop stacks, props pass) | ADVISORY | ⚠️ WARN | data/generated/props/betonline-live-2026-10-29-week8.json; rows=522; age=30.5h | npm run props:bol:cron (BEO posts Sunday props ~Sat afternoon). |
| L7 | DraftKings Predictions props | ADVISORY | ⚠️ WARN | data/generated/props/dk-predictions-2026-10-17-titans-at-colts.json | npm run props:dkp:launch (log in) → npm run props:dkp:cron → npm run props:dkp:defense |
| L8 | Prediction markets + coherence | ADVISORY | ✅ PASS | data/prediction-markets/cross-market-coherence-latest.json — 7.7h old (limit 36h) |  |
| L9 | SuperContest contest lines | REQUIRED | ✅ PASS | data/supercontest/week-08-lines.json |  |

## Rosters & injuries

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| I1 | Player availability / injury report | REQUIRED | ✅ PASS | data/player-availability/latest.json — 6.2h old (limit 24h) |  |
| I2 | Projected starters | REQUIRED | ✅ PASS | data/projected-starters/2026/projected-starters-2026-10-30.json — 7.7h old (limit 30h) |  |
| I3 | Weather / venue | ADVISORY | ✅ PASS | data/research-intel/review/2026-w08-weather-venue.json — 4.7h old (limit 48h) |  |

## Analytics

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| Q1 | Team power ratings / SRS (fair lines) | REQUIRED | ✅ PASS | data/generated/team-profiles/team-power-ratings-2026.json — 54.2h old (limit 192h) |  |
| Q2 | Secondary matchup vulnerability | REQUIRED | ✅ PASS | data/secondary-matchups/secondary-matchup-vulnerability-2026-w08.json |  |
| Q3 | FTN Stats IQ weekly context | REQUIRED | ✅ PASS | data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json (8h) | FTN refresh (weekly only). |
| Q4 | Fair-line model + simulator inputs | ADVISORY | ✅ PASS | reports/intel/w08-model/fair-lines-w08.json | Re-run fair_lines.py on current lines (stage run does this). |

## Expert & media intel

| # | Check | Level | Status | Detail | Fix |
|---|---|---|---|---|---|
| E1 | YouTube / podcast picks (Gemini, cleaned) | REQUIRED | ✅ PASS | data/podcasts/youtube-extracted-picks-2026-w08.json: 85 picks |  |
| E2 | Grok X-thread extraction (every week) | REQUIRED | ✅ PASS | 1 CSV in data/vault-seed/manual/grok-week08-threads (latest grok-twitter-picks-2026-10-31.csv) |  |
| E3 | BettingPros article intel | ADVISORY | ✅ PASS | reports/intel/bettingpros-articles-2026-w08.md | Read the week's BettingPros NFL articles (Claude in Chrome). |
| E4 | Per-expert narrative summaries | ADVISORY | ⚠️ WARN | reports/intel/expert-narratives-2026-w08.md | Written during the stage run (step 6). |
| E5 | Article feed health | ADVISORY | ⚠️ WARN | Gemini Audio Diarization: Gemini file upload (start) failed: {
  "error": {
    "code": 402,
    "message": "Your prepayment credits are depleted. Please go to AI Studio at https://ai.studio/projects to manage your project and billing. Learn more at https://ai.google.dev/gemini-api/docs/billing#prepay. ",
    "status": "RESOURCE_EXHAUSTED"
  }
}
 | Cover failed feeds by browser pulls. |
| E6 | Podcast intel (audio transcripts + promoted picks) | REQUIRED | ✅ PASS | transcripts processed=14; promoted episodes=0, picks=0; YouTube picks file=yes |  |
| E7 | Article intel (VSiN, ESPN, Action Network, BettingPros, PFT, Walter...) | REQUIRED | ✅ PASS | 116 article signals; sources={'ESPN NFL': 23, 'VSiN': 31, 'BettingPros': 22, 'Action Network': 23, 'Pro Football Talk': 14, 'Walter Football': 3}; newest 2026-10-30T14:28:13.593412+00:00 (15.3h) |  |
| E8 | Twitter/X bookmark intel (text) | REQUIRED | ✅ PASS | 107 bookmark signals; newest 2026-10-31T04:37:09.260796+00:00 (1.1h) |  |
| E9 | Twitter media queue (videos / images / threads) processed | ADVISORY | ✅ PASS | data/twitter/w08-media-extraction-queue.json: 0 Sunday-slate items still pending ({}) |  |
| E10 | Preferred-expert final cards (coverage) | ADVISORY | ⚠️ WARN | roster status=draft_pending_andy; 28/37 experts with a Week 8 card found; missing: Stuckey, Doug Kezirian, Collin Wilson, Kendra Middleton, Seth Woolcock, Brandon Kravitz, Pat Fitzmaurice, Joe Madden, Ed Feng | Andy confirms data/expert-tracking/preferred-experts-2026.json (status "confirmed"). Find each missing expert's card (article / podcast / YouTube / X) and ingest it, or list them under "experts_no_card": {"names": [...], "note": ...} in the gate-manual file after checking. |

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

## Preferred-expert cards — Week 8

| Expert | Card found in |
|---|---|
| Adam Burke | pull:VSiN |
| Andrew Erickson | pull:BettingPros, youtube |
| Ben Solak | pull:ESPN NFL |
| Brandon Anderson | pull:Action Network, pull:expert, youtube |
| Chad Millman | pull:expert, youtube |
| Chris Welsh | youtube |
| Cody Brown | pull:Twitter/X Bookmarks (Personal), twitter-video-picks-2026-w08.json |
| Daniel Jeremiah & Bucky Brooks | pull:ESPN NFL, pull:expert |
| Evan Abrams | 2026-w08-primer-intel.json |
| Even Money (hosts) | pull:expert |
| Jason Radowitz | bettingpros-articles-2026-w08.md, pull:BettingPros |
| Joe Holka | pull:Twitter/X Bookmarks (Personal) |
| John Ewing | pull:Twitter/X Bookmarks (Personal) |
| Lock & Cash | grok, pull:Twitter/X Bookmarks (Grok thread capture), twitter-video-picks-2026-w08.json |
| Marc Gartenberg | pull:Twitter/X Bookmarks (Personal) |
| Matt Perrault | pull:expert, youtube |
| Mike Maher | bettingpros-articles-2026-w08.md, pull:BettingPros |
| Rich Hribar | pull:expert, youtube |
| Ross Tucker | youtube |
| Sal Vetri | grok, pull:Twitter/X Bookmarks (Grok thread capture), pull:Twitter/X Bookmarks (Personal), twitter-video-picks-2026-w08.json |
| Scott Bogman | youtube |
| Sean Koerner | pull:Action Network |
| Sharp or Square (hosts) | pull:expert, youtube |
| Simon Hunter | pull:expert, youtube |
| Steve Fezzik | youtube |
| The Prop Dealer | pull:Twitter/X Bookmarks (Personal), pull:Twitter/X Bookmarks (Personal) (linked article) |
| The Prop Guru | grok, pull:Twitter/X Bookmarks (Grok thread capture), pull:Twitter/X Bookmarks (Personal) |
| Warren Sharp | pull:Twitter/X Bookmarks (Personal), pull:expert, youtube |
| Stuckey | ❌ not found |
| Doug Kezirian | ❌ not found |
| Collin Wilson | ❌ not found |
| Kendra Middleton | ❌ not found |
| Seth Woolcock | ❌ not found |
| Brandon Kravitz | ❌ not found |
| Pat Fitzmaurice | ❌ not found |
| Joe Madden | ❌ not found |
| Ed Feng | ❌ not found |

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
