# Grok Thread Capture Packet — 2026-10-29 (Week 8)
*Generated automatically by NFL_Dashboard Grok Thread Scanner at 2026-10-29T15:04:55.780Z*

Found **10** active unprocessed Twitter/X bookmark threads for **Week 8** ready for Grok extraction.

## Unprocessed Threads (10)

| Author | URL | Type | Context |
| :--- | :--- | :--- | :--- |
| @Deepak Chona, MD. SMA | [Tweet Link](https://x.com/SportMDAnalysis/status/2114837615975473465) | Multi-Tweet Thread | [1/9] #NFL Injury Updates |
| @Deepak Chona, MD. SMA | [Tweet Link](https://x.com/SportMDAnalysis/status/2114081508642185515) | Multi-Tweet Thread | [1/5] #NFL Injury Updates |
| @John Ewing | [Tweet Link](https://x.com/johnewing/status/2115235849214492891) | Zero Signal Note | Underdogs in division games have gone 23-10 (70%) ATS this N |
| @John Ewing | [Tweet Link](https://x.com/johnewing/status/2115232075561250847) | Zero Signal Note | NFL favorites of 6 or more points have gone 8-21-3 (28%) ATS |
| @Warren Sharp | [Tweet Link](https://x.com/SharpFootball/status/2115111530039775712) | Zero Signal Note | the Minnesota Vikings are only undefeated team left |
| @Ben Fawkes | [Tweet Link](https://x.com/BFawkes22/status/2115078062966456417) | Zero Signal Note | Best NFL teams against the spread this season: |
| @PFF Fantasy | [Tweet Link](https://x.com/PFF_Fantasy/status/2114922950940070137) | Zero Signal Note | Waiver wire targets ahead of NFL Week 8 🎯 |
| @FATBOSS | [Tweet Link](https://x.com/FATBOSSPICKS/status/2114699525411725730) | Zero Signal Note | NFL 📝  |
| @Cody Brown Bets | [Tweet Link](https://x.com/CodyBrownBets/status/2113767729090212315) | Zero Signal Note | I’M GOING TO DETROIT! |
| @Warren Sharp | [Tweet Link](https://x.com/SharpFootball/status/2113664746981322913) | Zero Signal Note | Kyler Murray vs man coverage this season: |

---

## Ready-to-Paste Grok Prompt

Copy the block below and paste it directly into Grok:

```markdown
You are extracting NFL betting intel from X/Twitter posts for a betting-research database. Today is 2026-10-29; the current slate is NFL 2026 Week 8.

For EACH URL below, open the post AND the author's full self-reply thread (every tweet the same author posted under it), read every attached image/graphic, and — if the post links to a video (X video, YouTube) or an article — use the linked content too. Do not rely on the first tweet alone.

Return exactly TWO things, in this order.

### 1) One CSV file named `grok-twitter-picks-2026-10-29.csv`
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
- Skip anything about games already played before 2026-10-29 and anything that is not NFL (college, other sports).
- If a thread has no concrete bet, include no rows for it (list it in section 2 instead).
- Plain CSV only: no markdown, no code fences, no blank lines, and every row must have all 9 columns.

### 2) A short Markdown summary (in the chat, not a file)
A table with one row per URL: `handle | tweet_url | picks captured | source used (tweet / thread / image / video / article) | notes`.
In `notes`, say why a thread produced zero picks (e.g. "public money splits only", "game already played", "picks behind paywall", "video had no audio") and flag anything you could NOT access.

URLs:
https://x.com/SportMDAnalysis/status/2114837615975473465
https://x.com/SportMDAnalysis/status/2114081508642185515
https://x.com/johnewing/status/2115235849214492891
https://x.com/johnewing/status/2115232075561250847
https://x.com/SharpFootball/status/2115111530039775712
https://x.com/BFawkes22/status/2115078062966456417
https://x.com/PFF_Fantasy/status/2114922950940070137
https://x.com/FATBOSSPICKS/status/2114699525411725730
https://x.com/CodyBrownBets/status/2113767729090212315
https://x.com/SharpFootball/status/2113664746981322913
```

---

## Instructions Once Grok Generates CSV
1. Save Grok's output CSV to:
   `data/vault-seed/manual/grok-week08-threads/grok-twitter-picks-2026-10-29.csv`
2. Ingest into Supabase:
   ```powershell
   node scripts/load-external-intel-picks.mjs --dry-run
   node scripts/load-external-intel-picks.mjs --replace
   ```
*(The scanner will detect `grok-twitter-picks-2026-10-29.csv` on its next run and retire those URLs from future prompt packets).*
