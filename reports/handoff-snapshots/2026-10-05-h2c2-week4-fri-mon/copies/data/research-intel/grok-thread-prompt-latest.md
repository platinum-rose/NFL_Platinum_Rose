# Grok Thread Capture Packet — 2026-10-05 (Week 4)
*Generated automatically by NFL_Dashboard Grok Thread Scanner at 2026-10-05T19:04:56.067Z*

Found **12** active unprocessed Twitter/X bookmark threads for **Week 4** ready for Grok extraction.

## Unprocessed Threads (12)

| Author | URL | Type | Context |
| :--- | :--- | :--- | :--- |
| @RotoWire Fantasy Football | [Tweet Link](https://x.com/RotoWireNFL/status/2106135386535727391) | Multi-Tweet Thread | [1/2] Jaylen Waddle (foot) practiced fully Friday and does n |
| @The Prop Dealer | [Tweet Link](https://x.com/thepropdealer/status/2105766595884982307) | Multi-Tweet Thread | [1/2] We've cashed some HUGE winners on Thursday Night Footb |
| @Cody Brown Bets | [Tweet Link](https://x.com/CodyBrownBets/status/2105659791226118154) | Multi-Tweet Thread | [1/6] 🏟️ Steelers Browns TNF doesn’t exactly get the juices |
| @SDQL GURU | [Tweet Link](https://x.com/sdqlguru/status/2105500548468449784) | Multi-Tweet Thread | [1/2] The TB Buccaneers are 0-12 ATS in their L12 games. Wor |
| @Patrick Everson | [Tweet Link](https://x.com/PatrickE_Vegas/status/2105473897298894874) | Multi-Tweet Thread | [1/2] Jags and Bengals both 2-1 SU and ATS heading into Sund |
| @Sports Betting Tips & Insights | [Tweet Link](https://x.com/vsininsights/status/2105191164689449007) | Multi-Tweet Thread | [1/2] Since 2024, the Over is 15-1 when Washington is a 3.5- |
| @Harry Lock Picks | [Tweet Link](https://x.com/HarryLockPicks/status/2106786014110900617) | Zero Signal Note | 🏈🔗 Here's ALL MY PLAYS TODAY... |
| @John Ewing | [Tweet Link](https://x.com/johnewing/status/2106783427324150073) | Zero Signal Note | Sunday morning line movement at @BetMGM  |
| @Patrick Finley | [Tweet Link](https://x.com/patrickfinley/status/2105751961739915389) | Zero Signal Note | More on #Bears RB D'Andre Swift missing practice Thursday wi |
| @John Ewing | [Tweet Link](https://x.com/johnewing/status/2105458926150181295) | Zero Signal Note | .@Buccaneers are 0-12 ATS in their last 12 games - longest s |
| @PoolGenius | [Tweet Link](https://x.com/PoolGenius/status/2105415651024351414) | Zero Signal Note | 📈 Notable line movement for NFL Week 4 Survivor Pools (as o |
| @PoolGenius | [Tweet Link](https://x.com/PoolGenius/status/2104954886534414746) | Zero Signal Note | 📈 NFL Week 4 Biggest Line Moves From Open (through Tuesday) |

---

## Ready-to-Paste Grok Prompt

Copy the block below and paste it directly into Grok:

```markdown
You are extracting NFL betting intel from X/Twitter posts for a betting-research database. Today is 2026-10-05; the current slate is NFL 2026 Week 4.

For EACH URL below, open the post AND the author's full self-reply thread (every tweet the same author posted under it), read every attached image/graphic, and — if the post links to a video (X video, YouTube) or an article — use the linked content too. Do not rely on the first tweet alone.

Return exactly TWO things, in this order.

### 1) One CSV file named `grok-twitter-picks-2026-10-05.csv`
Header row exactly:
`author,tweet_url,bet_type,team_or_market,market,selection,line,odds,rationale`

One row per individual bet. Rules:
- `author`: the X handle without @ (e.g. `CodyBrownBets`).
- `tweet_url`: the ORIGINAL URL I gave you for that thread (format `https://x.com/<handle>/status/<id>`), even when the pick came from a reply, image, video or linked article. Never truncate it.
- `bet_type`: one of `spread`, `total`, `moneyline`, `team_total`, `player_prop`, `anytime_td`, `first_td`, `parlay_leg`, `futures`, `survivor`, `trend`.
- `team_or_market`:
  - sides/moneylines: the full team name (`Chicago Bears`);
  - game totals: `AWAY @ HOME` with abbreviations (`MIN @ CHI`);
  - player props / TD bets / player trends: the PLAYER'S FULL NAME (`Justin Jefferson`) — never a game or team in place of a player. If the post names no player, skip that bet.
- `market`: for player bets, the stat in plain words (`receiving yards`, `receptions`, `rushing attempts`, `passing yards`, `anytime TD`, `first TD`); for sides/totals leave blank.
- `selection`: team name, `OVER`, `UNDER`, or `YES` (for TD/yes-no bets).
- `line`: the number only (`-4.5`, `3.5`, `47.5`, `76.5`). For "N+" ladders (`100+ receiving yards`) put `99.5`. Blank for moneylines/TD bets.
- `odds`: American odds as written (`-110`, `+250`), or blank if not stated. Never invent odds or lines.
- `rationale`: ≤160 characters, the author's reason, paraphrased. Put it in double quotes if it contains a comma.
- Hit-rate / streak lists the author posts for bettors (e.g. "props that cashed 4 straight", "C. Watson 3+ Rec — 80%"): one row per line with `bet_type` = `trend`, `selection` = `OVER` (or `YES` for TD streaks), and the hit rate in `rationale`.
- Parlays: one row per leg with `bet_type` = `parlay_leg` and the leg's real market in `market`; put the parlay's total odds in `rationale`.
- ONLY picks the author is making or recommending. Do NOT include public-betting splits ("80% of money on…"), line-move reports, other people's picks the author is quoting, or recaps of games already played.
- Skip anything about games already played before 2026-10-05 and anything that is not NFL (college, other sports).
- If a thread has no concrete bet, include no rows for it (list it in section 2 instead).
- Plain CSV only: no markdown, no code fences, no blank lines, and every row must have all 9 columns.

### 2) A short Markdown summary (in the chat, not a file)
A table with one row per URL: `handle | tweet_url | picks captured | source used (tweet / thread / image / video / article) | notes`.
In `notes`, say why a thread produced zero picks (e.g. "public money splits only", "game already played", "picks behind paywall", "video had no audio") and flag anything you could NOT access.

URLs:
https://x.com/RotoWireNFL/status/2106135386535727391
https://x.com/thepropdealer/status/2105766595884982307
https://x.com/CodyBrownBets/status/2105659791226118154
https://x.com/sdqlguru/status/2105500548468449784
https://x.com/PatrickE_Vegas/status/2105473897298894874
https://x.com/vsininsights/status/2105191164689449007
https://x.com/HarryLockPicks/status/2106786014110900617
https://x.com/johnewing/status/2106783427324150073
https://x.com/patrickfinley/status/2105751961739915389
https://x.com/johnewing/status/2105458926150181295
https://x.com/PoolGenius/status/2105415651024351414
https://x.com/PoolGenius/status/2104954886534414746
```

---

## Instructions Once Grok Generates CSV
1. Save Grok's output CSV to:
   `data/vault-seed/manual/grok-week04-threads/grok-twitter-picks-2026-10-05.csv`
2. Ingest into Supabase:
   ```powershell
   node scripts/load-external-intel-picks.mjs --dry-run
   node scripts/load-external-intel-picks.mjs --replace
   ```
*(The scanner will detect `grok-twitter-picks-2026-10-05.csv` on its next run and retire those URLs from future prompt packets).*
