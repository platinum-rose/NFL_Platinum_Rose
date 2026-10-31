# Antigravity request — Week 8 Twitter/X extraction (Fri 2026-10-30, needed before the late-Saturday report run)

Repo: E:\dev\projects\NFL_Dashboard. Queue of record: `data/twitter/w08-media-extraction-queue.json` (update each item's status/result when done).
Spec and pick schema: same as `agents/dev/ANTIGRAVITY_TWITTER_VIDEO_QUEUE_AUTOMATION.md` (speaker = account owner, no diarization; picks schema = `data/podcasts/youtube-extracted-picks-2026-w07.json` + handle/tweet_url, `source_pipeline: "twitter_video"`).
Slate: `data/generated/team-dossiers/w08-slate.json` (13 Sun/Mon games; CAR@GB final — drop it). Never state a player's team from memory: use the speaker/tweet text or `data/nfl-rosters/espn-full-rosters-latest.json`.
No Supabase writes, no wagers. Cost cap for any paid model: $2 total.

## A. Videos — transcribe + extract picks (6)
| # | Handle | URL | Length | What it is |
|---|---|---|---|---|
| A1 | salbets_ (Sal Vetri) | https://x.com/salbets_/status/2115481971044331576 | 2:26 | "Way Too Early 5 Best NFL Bets for Week 8" — picks |
| A2 | lockandcash | https://x.com/lockandcash/status/2116170932544798882 | 30:39 | "NFL Week 8 Best Bets Show" — Grok only caught NYJ ML -120 and BAL +3.5; capture every pick + the "market info" segment |
| A3 | thepowerrank (Ed Feng) | https://x.com/thepowerrank/status/2116188374599864686 | 5:23 | Bills analytics video (+ linked YouTube in the same tweet; do once) — any BAL@BUF lean/number |
| A4 | SharpFootball (Warren Sharp) | https://x.com/SharpFootball/status/2115098526799839473 | 2:18 | Kenneth Walker vs 8+ box — analytics note for KC@DEN (not a pick unless stated) |
| A5 | SharpFootball | https://x.com/SharpFootball/status/2115115399704694810 | YouTube link | Strength of schedule to date — analytics (table) |
| A6 | SharpFootball | https://x.com/SharpFootball/status/2115116599493509475 | YouTube link | Remaining SOS Weeks 8–18 — analytics (table; futures context) |
Output: `data/twitter/twitter-video-picks-2026-w08.json` (picks) and `data/twitter/twitter-video-analytics-2026-w08.md` (A3–A6 numbers, one block per tweet with game tags).

## B. Image cards — capture the numbers (Grok summarized these but did not keep the data) (10)
Public-market cards (feed the splits / "where the money is" section; NOT picks):
| # | Handle | URL | Card |
|---|---|---|---|
| B1 | johnewing | https://x.com/johnewing/status/2116175793516855486 | Top 10 most-bet teams to cover, Week 8 (BetMGM) |
| B2 | johnewing | https://x.com/johnewing/status/2116172018630459696 | Popular (+60% of money) teams to cover (BetMGM) |
| B3 | BFawkes22 | https://x.com/BFawkes22/status/2116149463773249987 | Five most-bet sides by tickets (BetMGM) |
Matchup stat cards (Warren Sharp; feed the game packets as analytics):
| B4 | SharpFootball | https://x.com/SharpFootball/status/2116239965537349723 | Josh Allen on throws 10+ yds (BAL@BUF) |
| B5 | SharpFootball | https://x.com/SharpFootball/status/2116220840773640683 | Aaron Rodgers vs man coverage (CLE@PIT) |
| B6 | SharpFootball | https://x.com/SharpFootball/status/2116206998056513957 | Jahmyr Gibbs vs MIN last season (MIN@DET) |
| B7 | SharpFootball | https://x.com/SharpFootball/status/2116202971499508031 | Arizona vs WR1s (ARI@DAL) |
| B8 | SharpFootball | https://x.com/SharpFootball/status/2116195170144448987 | Vikings pass TDs allowed (MIN@DET) |
| B9 | SharpFootball | https://x.com/SharpFootball/status/2116176295839318041 | Ravens light-box rate (BAL@BUF) |
| B10 | SharpFootball | https://x.com/SharpFootball/status/2116172018358038861 | Browns in Pittsburgh since 2000 (CLE@PIT) |
Output: `data/twitter/twitter-image-cards-2026-w08.json` — `{handle, tweet_url, game, card_type: public_market|matchup_stat, title, rows:[...], transcribed_text}`; exact numbers only, never inferred.

## C. Find + extract (1)
| C1 | CodyBrownBets | profile https://x.com/CodyBrownBets | His full 22-leg Week 8 parlay is in a later post than https://x.com/CodyBrownBets/status/2116229412798742940 — find it, extract every leg (`bet_type: parlay_leg`), add to the picks file. |

## Done = 
- every A/B/C item `done` (or `skipped` + reason) in `data/twitter/w08-media-extraction-queue.json`;
- outputs above written; a ≤10-line summary with counts and cost.
