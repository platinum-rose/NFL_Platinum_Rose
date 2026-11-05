# Week 9 podcast episode discovery: Tuesday 11/03 (as of ~1:30 PM PT)

Discovery only: no captions pulled, no picks extracted. Source: YouTube channel RSS feeds for every channel in
`config/youtube-podcast-sources.local.json` / `config/podcast-feed-youtube-channels.json`, fetched through a free web fetcher
(YouTube isn't reachable from this session's shells). $0 API spend. Durations aren't in RSS; "runtime >=" is the last chapter marker.
Machine-readable queue: `reports/intel/w09-episode-discovery-2026-11-03.json`.

## Extract (Week 9 betting content)

| # | Show | Title | videoId | Published PT | Hosts (from description) | JAX@BAL segment | Runtime >= | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Sharp or Square | NFL WEEK 9 BETS: Jags-Ravens, Jets-Chiefs, Cowboys-Colts, Bucs-Bears, Raiders-49ers, Bills-Vikings | WbYwN5iWNGY | Tue 11/03 10:51 | Chad Millman, Simon Hunter | 0:06:00 | 1:04:45 | Tuesday episode (allowed). All 15 games; includes "Chad's Choice" and "Simon Says". |
| 2 | Ross Tucker (Even Money style, Ross + Fezzik) | 2026 NFL Week 9 BETS! | kq21OfxY1Mk | Tue 11/03 07:06 | Ross Tucker, Steve Fezzik | 14:09 | 25:43 | Week 8 recap 2:10-14:09 (skip). Label Fezzik teasers as (Wong) teaser legs. No captions last week: plan Parakeet, check last timestamp <= runtime. |
| 3 | BettingPros | NFL Week 9 Early Picks & Line Movement Predictions (2026) | OtB_TD5uMgE | Mon 11/02 13:27 | (not in RSS) | ? | ? | Lookahead/early-lines show. |
| 4 | BettingPros | Early NFL BEST BETS & Survivor Pool Picks: Week 9 Predictions (2026) | KjbSWUbYkeI | Tue 11/03 13:15 | (Erickson/Perrault/Fitzmaurice last week) | ? | ? | Found on the 3 PM re-check. Survivor picks: market as stated, game null. |
| 3b | BettingPros | Top 3 Early Week 9 Bets in the NFL! #shorts | KBxzssZwduM | Tue 11/03 05:29 | | | short | Probably a clip of #3: extract once, note both URLs. |

## Skipped (with reason)

| Show | Title | videoId | Published PT | Reason |
|---|---|---|---|---|
| Sharp or Square | EARLY NFL WEEK 9 PICKS: Bills-Vikings, Bucs-Bears, Broncos-Panthers, Cowboys-Colts, Packers-Pats | KuDM9dpepC8 | Mon 11/02 08:39 | Description says recorded Sunday night. Rule: Sharp or Square Tue/Thu only, never Sunday episodes. Andy's call if he wants it. |
| Sharp or Square | NFL Week 8 Reactions (+ "Early NFL Week 9 betting leans" at 0:42:30) | qR8k9BWi-VM | Sun 11/01 17:36 | Sunday episode (rule). |
| Ross Tucker | 2026 NFL Week 9 POWER RANKINGS & Seahawks-Bears REACTION | ijhyDvDt8S4 | Tue 11/03 04:26 | Not betting. |
| Ross Tucker | 2026 NFL Week 8 REACTION! / CFB Week 10 BETS | oa6Ak8dWYwM / DPmlRX9W5Ao | Mon 11/02 | Week 8 recap / college. |
| Warren Sharp | NFL Week 8 Takeaways: Gibbs Breaks Loose, Cowboys Collapse | kBq9yqicLlE | Mon 11/02 14:11 | Week 8 recap. W9 Matchups usually Thu, Best Bets Fri (Pass 2). |
| Action Network (YouTube) | Week 8 recap + MNF; waiver wire; CFB; NBA; election markets | various | 11/02-11/03 | No Week 9 NFL betting video on the channel yet. |
| BettingPros | MNF / NBA / NHL / CFB shorts and shows | various | | Not Week 9 NFL. |
| Fantasy Football Today (CBS) | Week 9 waiver wire shows | j4AvMKJsV9w, pWbzRNJfsxw, eey7VgZoY0A, lapXlseiPds | 11/02-11/03 | Fantasy, not betting. |
| Sal Vetri | 7 Players I'm Panicking About / 10 Must Add Players | JhrYyLzsQTI, 86nxkNynqsg | 11/02-11/03 | Fantasy, not betting. |
| Joe Holka | MNF shorts | | 11/02 | No Week 9 content yet. |

## Not found / not posted yet (re-check Wed AM before the noon deadline)

- ~~BettingPros Early Best Bets & Survivor~~: posted 1:15 PM (row 4 above).
- **Action Network early lines / look-ahead (Koerner, Anderson)**: not on YouTube. The full show is audio-first ("The Action Network Sports Betting Podcast"); check that feed.
- **VSiN (Adam Burke), Lock & Cash, Cody Brown, Move the Sticks**: none of these is in the channel config, so RSS can't see them. Add channel IDs or check them by hand.
- **Ross Tucker "Week 9 PICKS"** (Ross solo): Week 8's came out Wed 10/28, so expect Wed 11/04.

## Config housekeeping (suggestion, not changed)

- `UC97usu7cgbpZeACVScgadcg` (TheProsBestBets) has posted nothing since Nov 2024, and `UCG-raMW5tCoE9vsm0LppXzA` (Ed Feng) nothing since Feb 2021. Both are dead weight in the sweep.
- `UCQZBeoho9xLQ6dfhprU8Glg` (Evan Miyakawa) is college basketball only; it belongs to the NCAA project, not the NFL sweep.

## Caption route tested (3 PM)

Firecrawl's YouTube post-processor feeds transcript text to its answer mode only. Its markdown/rawHtml output has no timestamped transcript, so it can't meet the `source_timestamp` rule. Captions still need yt-dlp or Parakeet on Windows (Antigravity).
