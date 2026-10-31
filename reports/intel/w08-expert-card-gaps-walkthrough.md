# Week 8 — preferred experts with no card yet: walkthrough
Checked Fri 2026-10-30 ~9:50 PM PT (Action Network NFL hub page data — 79 articles with authors; Omny feeds for The Favorites and BettingPros Podcast; YouTube discovery candidates; Week 8 pull, YouTube picks, Grok CSV). Roster: `data/expert-tracking/preferred-experts-2026.json` (DRAFT — Andy to confirm).

**Root cause for the Action Network names:** the Action Network RSS feed has been failing ("not a parseable RSS/Atom feed"), so AN articles only reach the pull through other paths. AN cards must be read through Claude in Chrome until the feed is fixed.

| Expert | Where the card lives | Week 8 status (Fri 9:50 PM) | How to get it | Owner / when |
|---|---|---|---|---|
| **Evan Abrams** | Action Network articles/tools; guest on Sharp or Square | ✅ **Found:** "NFL Betting Primer: Trends, Stats, Systems for Every Game" (AN, Oct 29) — system plays per game | Read the primer in Chrome → one row per system play (game, side, system, record) into the expert section | Claude, Sat AM |
| **Stuckey** | Action Network: Sunday Sixpack + game previews | ⏳ Not published yet (no Week 8 Stuckey piece on the AN hub) | Recheck AN hub / author page Sat AM–PM; read the Sixpack in Chrome | Claude, Sat |
| **Collin Wilson** | Action Network game previews / best bets | ⏳ Not published yet | Same as Stuckey | Claude, Sat |
| **Doug Kezirian** | Action Network (mostly podcast/video) | ⏳ No Week 8 article; podcast not in our discovery feed | Recheck AN Sat; if podcast-only, add his show to the YouTube/audio discovery list | Claude Sat; Andy: confirm his show |
| **Kendra Middleton** | The Favorites (podcast, co-host) | ✅ **Published:** "Lamar, L-Bombs & LuLus \| NFL Week 8 Preview" (game-by-game; w/ Brandon Kravitz, guest John Jastremski) — https://omny.fm/shows/the-favorites-sports-betting-podcast/lamar-l-bombs-lulus-nfl-week-8-preview | Audio → local Parakeet + voiceprint pipeline (Gemini audio diarization hit a 402 credits error earlier) or Gemini if a YouTube version exists | Andy/Antigravity: run audio pipeline tonight/Sat AM |
| **Brandon Kravitz** | The Favorites (podcast, co-host) | ✅ Same episode as above | Same | Same |
| **Seth Woolcock** | BettingPros Podcast | ✅ **Published:** Ep. 1119 "NFL Week 8 Betting Picks: 5 Best Bets, Longshot TD Picks & Parlay of the Week!" (w/ Andrew Erickson) — https://omny.fm/shows/bettingpros-podcast/nfl-week-8-betting-picks-5-best-bets-longshot-td-picks-parlay-of-the-week-ep-1119 | Not in tonight's YouTube batch. Find the BettingPros YouTube upload → `youtube-podcast-sweep.js --only-ids <id> --run-gemini`; else audio pipeline | Claude finds the video id Sat AM; Andy runs extraction |
| **Pat Fitzmaurice** | FantasyPros / BettingPros | ❓ No Week 8 card found; FantasyPros channel is not in our discovery list (only 10 channels are) | Andy: keep on roster? If yes, add FantasyPros YouTube to discovery | Andy decides |
| **Joe Madden** | Unknown (dossier exists, but no show/outlet on record) | ❓ No Week 8 card found | Andy: confirm who/where (outlet, X handle) or drop from roster | Andy decides |
| **Ed Feng** | The Power Rank (site predictions; X videos/threads) | ⚠️ Only the Bills analytics video (no picks, per Grok) — in the Antigravity list (A3) | Antigravity A3; member predictions on thepowerrank.com only if Andy has access | Antigravity; Andy re: site access |

## Bonus finds (cards already in hand that the expert section should credit by name)
- BettingPros Ep. 1121 "NFL Week 8 Best Player Prop Bets & Anytime TD Picks" (Chris Welsh, Andrew Erickson) and Ep. 1120 SNF preview (Welsh, Scott Bogman) — already extracted via YouTube (IxMnLS4ZQnI, -vn96xTfA7M).
- Sean Koerner: "Koerner's Week 8 Pick'em & Confidence Ranking" (AN, Oct 28) — useful for BUK BUK / confidence pools.
- Nick Giffen (AN): Week 8 Luck Rankings picks + First TD model picks (Oct 28–29) — not on the roster; Andy: add?

## After each card is captured
Re-run `python3 scripts/master-intel/final_gate_check.py --week 8 --stage saturday`. Experts confirmed to have published nothing go under `experts_no_card` in `data/generated/master-intel/w08-gate-manual.json`.
