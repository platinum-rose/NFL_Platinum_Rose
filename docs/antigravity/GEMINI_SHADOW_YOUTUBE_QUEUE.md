# Gemini Shadow Harness YouTube Queue

Purpose: curated YouTube targets for testing Gemini audio/video transcription against already-processed Platinum Rose podcast artifacts.

Important caveat: the processed podcast exports mostly store RSS/MP3 audio URLs, not YouTube watch URLs. Only the Ben Solak training-camp episode currently has a verified direct YouTube URL in local metadata. Other entries below use exact YouTube search links built from the processed show/title/date so the correct video can be selected and backfilled.

## Starter Queue

| Priority | Date | Show | Episode | YouTube Target | Why It Belongs In The Shadow Test | Processed Baseline |
|---:|---|---|---|---|---|---|
| 1 | 2026-07-21 | Sharp or Square | NFL TRAINING CAMP QUESTIONS with Ben Solak of ESPN | [verified video](https://www.youtube.com/watch?v=AMS0ckHohNU) | Known direct YouTube URL; three-speaker analyst interview; training-camp/team intel; existing timing-conjecture flags. | `data/podcasts/m6-diarized/2026-07-21-sharp-or-square-nfl-training-camp-questions-with-ben-solak-of-espn.json` |
| 2 | 2026-03-03 | Sharp or Square | EARLY 2026 NFL SEASON WIN TOTALS - Part 1 | [YouTube search](https://www.youtube.com/results?search_query=Sharp%20or%20Square%20EARLY%202026%20NFL%20SEASON%20WIN%20TOTALS%20-%20Part%201%202026-03-03) | The Gemini comparison spec uses this episode; win-total lines, pick extraction, speaker parity, and price/line fidelity are all measurable. | `data/podcasts/m6-diarized-all/2026-03-03-sharp-or-square-early-2026-nfl-season-win-totals-part-1.json` |
| 3 | 2026-03-19 | Sharp or Square | NFL SEASON WIN TOTALS Part 2 | [YouTube search](https://www.youtube.com/results?search_query=Sharp%20or%20Square%20NFL%20SEASON%20WIN%20TOTALS%20Part%202%202026-03-19) | Complements Part 1; broad futures coverage; many matchup/team references. | `data/podcasts/m6-diarized-all/2026-03-19-sharp-or-square-nfl-season-win-totals-part-2.json` |
| 4 | 2026-07-07 | Sharp or Square | NFL PLAYOFF BETTING PREDICTIONS | [YouTube search](https://www.youtube.com/results?search_query=Sharp%20or%20Square%20NFL%20PLAYOFF%20BETTING%20PREDICTIONS%202026-07-07) | Strong futures/playoff intel; 48 routed beats in the processed deep-dive report; good stress test for team routing. | `data/podcasts/m6-diarized-all/2026-07-07-sharp-or-square-nfl-playoff-betting-predictions.json` |
| 5 | 2026-07-01 | BettingPros Podcast | 2026 NFL Week 1 Betting Predictions \| Sharp Picks Before the Market Adjusts (Ep. 1013) | [YouTube search](https://www.youtube.com/results?search_query=BettingPros%20Podcast%202026%20NFL%20Week%201%20Betting%20Predictions%20%7C%20Sharp%20Picks%20Before%20the%20Market%20Adjusts%20%28Ep.%201013%29%202026-07-01) | Week 1 spread/total/ML picks; useful for exact market extraction and matchup isolation. | `data/podcasts/m6-diarized-all/2026-07-01-bettingpros-podcast-2026-nfl-week-1-betting-predictions-sharp-picks-before-the-market-adjusts-ep-1013.json` |
| 6 | 2026-05-28 | Sharp or Square | NFL WEEK 1 BETTING LINES - 2026 Regular Season Openers | [YouTube search](https://www.youtube.com/results?search_query=Sharp%20or%20Square%20NFL%20WEEK%201%20BETTING%20LINES%20-%202026%20Regular%20Season%20Openers%202026-05-28) | Long transcript with many Week 1 games; processed baseline has 69k transcript chars and 145 speaker segments. | `data/podcasts/m6-diarized-all/2026-05-28-sharp-or-square-nfl-week-1-betting-lines-2026-regular-season-openers.json` |
| 7 | 2026-07-15 | BettingPros Podcast | NFL Futures Betting: Our Favorite Long Shot Picks for the 2026 Season (Ep. 1018) | [YouTube search](https://www.youtube.com/results?search_query=BettingPros%20Podcast%20NFL%20Futures%20Betting%3A%20Our%20Favorite%20Long%20Shot%20Picks%20for%20the%202026%20Season%20%28Ep.%201018%29%202026-07-15) | Longshot/futures extraction; helps evaluate whether Gemini over-promotes speculative discussion. | `data/podcasts/m6-diarized-all/2026-07-15-bettingpros-podcast-nfl-futures-betting-our-favorite-long-shot-picks-for-the-2026-season-ep-1018.json` |
| 8 | 2026-07-08 | BettingPros Podcast | NFL Futures Picks 2026: Best Bets for Passing, Rushing & Receiving Leaders (Ep. 1016) | [YouTube search](https://www.youtube.com/results?search_query=BettingPros%20Podcast%20NFL%20Futures%20Picks%202026%3A%20Best%20Bets%20for%20Passing%2C%20Rushing%20%26%20Receiving%20Leaders%20%28Ep.%201016%29%202026-07-08) | Player-stat futures; good test for player/market extraction rather than only team markets. | `data/podcasts/m6-diarized-all/2026-07-08-bettingpros-podcast-nfl-futures-picks-2026-best-bets-for-passing-rushing-and-receiving-leaders-ep-1016.json` |
| 9 | 2026-07-16 | The Favorites | All Things NFL Injuries with Pro Football Doc David Chao | [YouTube search](https://www.youtube.com/results?search_query=The%20Favorites%20All%20Things%20NFL%20Injuries%20with%20Pro%20Football%20Doc%20David%20Chao%202026-07-16) | Injury-context episode; useful for detecting medical/player intel without converting it into picks. | `data/podcasts/m6-diarized-all/2026-07-16-the-favorites-all-things-nfl-injuries-with-pro-football-doc-david-chao.json` |
| 10 | 2026-07-22 | The Favorites | 2026 NFL Quarterback Rankings \| Part 2 | [YouTube search](https://www.youtube.com/results?search_query=The%20Favorites%202026%20NFL%20Quarterback%20Rankings%20%7C%20Part%202%202026-07-22) | Recent QB-ranking discussion; processed deep dive has 41 beats and named participant override. | `data/podcasts/m6-diarized/2026-07-22-the-favorites-2026-nfl-quarterback-rankings-part-2.json` |
| 11 | 2026-07-21 | The Favorites | 2026 NFL Quarterback Rankings \| Part 1 | [YouTube search](https://www.youtube.com/results?search_query=The%20Favorites%202026%20NFL%20Quarterback%20Rankings%20%7C%20Part%201%202026-07-21) | Companion to Part 2; useful for ranking-list structure and continuity. | `data/podcasts/m6-diarized/2026-07-21-the-favorites-2026-nfl-quarterback-rankings-part-1.json` |
| 12 | 2026-05-21 | Sharp or Square | NFL Schedule Release PART 1 with Warren Sharp | [YouTube search](https://www.youtube.com/results?search_query=Sharp%20or%20Square%20NFL%20Schedule%20Release%20PART%201%20with%20Warren%20Sharp%202026-05-21) | Schedule/travel/rest intelligence; tests whether Gemini preserves source-stamped schedule reasoning. | `data/podcasts/m6-diarized-all/2026-05-21-sharp-or-square-nfl-schedule-release-part-1-with-warren-sharp.json` |
| 13 | 2026-05-26 | Sharp or Square | NFL Schedule Release PART 2 with Warren Sharp | [YouTube search](https://www.youtube.com/results?search_query=Sharp%20or%20Square%20NFL%20Schedule%20Release%20PART%202%20with%20Warren%20Sharp%202026-05-26) | Schedule Part 2; good paired-test for repeated guest/topic continuity. | `data/podcasts/m6-diarized-all/2026-05-26-sharp-or-square-nfl-schedule-release-part-2-with-warren-sharp.json` |
| 14 | 2026-03-10 | Sharp or Square | NFL Free Agency Reactions with Bill Barnwell | [YouTube search](https://www.youtube.com/results?search_query=Sharp%20or%20Square%20NFL%20Free%20Agency%20Reactions%20with%20Bill%20Barnwell%202026-03-10) | Longest curated transcript; three-person free-agency/team context; strong diarization stress test. | `data/podcasts/m6-diarized-all/2026-03-10-sharp-or-square-nfl-free-agency-reactions-with-bill-barnwell.json` |
| 15 | 2026-04-24 | Action Network Sports Betting | NFL Draft First Round Recap & Reaction \| 2026 | [YouTube search](https://www.youtube.com/results?search_query=Action%20Network%20Sports%20Betting%20NFL%20Draft%20First%20Round%20Recap%20%26%20Reaction%20%7C%202026%202026-04-24) | Very high speaker-segment count in baseline; tests diarization and multi-host/entity extraction. | `data/podcasts/m6-diarized-all/2026-04-24-action-network-sports-betting-nfl-draft-first-round-recap-and-reaction-2026.json` |
| 16 | 2026-02-24 | Even Money | Ross & Steve's 2025 NFL Betting Recap | [YouTube search](https://www.youtube.com/results?search_query=Even%20Money%20Ross%20%26%20Steve%27s%202025%20NFL%20Betting%20Recap%202026-02-24) | Shorter baseline; good cheap smoke test before running expensive/long videos. | `data/podcasts/m6-diarized-all/2026-02-24-even-money-ross-and-steve-s-2025-nfl-betting-recap.json` |

## Suggested Run Order

1. Smoke test: priorities 1, 2, and 16.
2. Betting extraction: priorities 3, 5, 7, and 8.
3. Team-intel extraction: priorities 4, 9, 10, 11, 12, and 13.
4. Diarization stress: priorities 6, 14, and 15.

## New BettingPros YouTube Discoveries

These were found outside the processed RSS/audio queue and should start as discovery-only YouTube tests unless a baseline mapping is confirmed.

| ID | Date | Show | YouTube Title | Direct URL | Suggested Run |
|---|---|---|---|---|---|
| Y1 | 2026-07 | BettingPros YouTube | 14 LONGSHOT NFL Futures To Make Now \| SLEEPERS, Player Props Picks & Predictions | https://www.youtube.com/watch?v=qGJ2f1fEXHc | `node scripts\gemini-podcast-shadow-harness.js --episode youtube-qGJ2f1fEXHc --live-youtube --youtube-url "https://www.youtube.com/watch?v=qGJ2f1fEXHc"` |
| Y2 | 2026-07 | BettingPros YouTube | Top 12 NFL Best Bets & Playoff Predictions \| Division Winners, No. 1 Seeds & Futures Picks (2026) | https://www.youtube.com/watch?v=aOUy4-ZRzbE | `node scripts\gemini-podcast-shadow-harness.js --episode youtube-aOUy4-ZRzbE --live-youtube --youtube-url "https://www.youtube.com/watch?v=aOUy4-ZRzbE"` |
| Y3 | 2026-06 | BettingPros YouTube | Top 10 NFL Futures Bets to Make Now \| MVP, Rookie of the Year & More! | https://www.youtube.com/watch?v=veVjJ_EUYdk | `node scripts\gemini-podcast-shadow-harness.js --episode youtube-veVjJ_EUYdk --live-youtube --youtube-url "https://www.youtube.com/watch?v=veVjJ_EUYdk"` |
| Y4 | 2026-07 | BettingPros YouTube | 9 Early NFL Week 1 Best Bets To Make NOW \| ATS, Totals & Moneyline Picks & Predictions (2026) | https://www.youtube.com/watch?v=uirj8AVs8so | `node scripts\gemini-podcast-shadow-harness.js --episode 2026-07-01-bettingpros-podcast-2026-nfl-week-1-betting-predictions-sharp-picks-before-the-market-adjusts-ep-1013 --live-youtube --youtube-url "https://www.youtube.com/watch?v=uirj8AVs8so"` |
| Y5 | 2026-07 | BettingPros YouTube | Drafting the ULTIMATE 2026 NFL Futures Card \| Win Totals, Division Winners & Award Sleepers | https://www.youtube.com/watch?v=4OxpAX6UJlM | `node scripts\gemini-podcast-shadow-harness.js --episode youtube-4OxpAX6UJlM --live-youtube --youtube-url "https://www.youtube.com/watch?v=4OxpAX6UJlM"` |

## Backfill Rule

When a YouTube search link resolves to the correct video, add the direct watch URL to `data/podcasts/episode-metadata-overrides.json` with:

```json
{
  "title": "Exact processed episode title",
  "source": "youtube",
  "source_url": "https://www.youtube.com/watch?v=..."
}
```
