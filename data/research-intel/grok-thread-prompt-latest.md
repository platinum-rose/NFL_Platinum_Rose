# Grok Thread Capture Packet — 2026-11-22 (Week 11)
*Generated automatically by NFL_Dashboard Grok Thread Scanner at 2026-11-22T09:04:56.373Z*

Found **7** active unprocessed Twitter/X bookmark threads for **Week 11** ready for Grok extraction.

## Unprocessed Threads (7)

| Author | URL | Type | Context |
| :--- | :--- | :--- | :--- |
| @Sal Bets | [Tweet Link](https://x.com/salbets_/status/2122329102489145426) | Multi-Tweet Thread | [1/12] Monday Night Football is back today. |
| @The Prop Guru | [Tweet Link](https://x.com/thepropguru_/status/2122166757825954179) | Multi-Tweet Thread | [1/7] 3 NFL Picks I love for Monday. |
| @The Prop Guru | [Tweet Link](https://x.com/thepropguru_/status/2121770158415138835) | Multi-Tweet Thread | [1/7] 3 NFL Picks I love for Sunday. |
| @smoove | [Tweet Link](https://x.com/smoovesports/status/2121703968971592119) | Multi-Tweet Thread | [1/6] These 4 TD Scorers WILL WIN Your Sunday NFL Parlays… |
| @Ben Fawkes | [Tweet Link](https://x.com/BFawkes22/status/2122704029658820685) | Zero Signal Note | Best NFL teams against the spread this season: |
| @nflrefstats | [Tweet Link](https://x.com/nflrefstats1/status/2121799920206364946) | Zero Signal Note | #MINvsGB officiating crew cheat sheet update  |
| @The Prop Dealer | [Tweet Link](https://x.com/thepropdealer/status/2121418602679095346) | Zero Signal Note | 3 Players. |

---

## Ready-to-Paste Grok Prompt

Copy the block below and paste it directly into Grok:

```markdown
You are extracting NFL betting intel from X/Twitter posts for a betting-research database. Today is 2026-11-22; the current slate is NFL 2026 Week 11.

For EACH URL below, open the post AND the author's full self-reply thread (every tweet the same author posted under it), read every attached image/graphic, and — if the post links to a video (X video, YouTube) or an article — use the linked content too. Do not rely on the first tweet alone.

Return exactly TWO things, in this order, both in the chat (you cannot attach files). Never skip part 1, even if it has only the header row.

### 1) The CSV for `grok-twitter-picks-2026-11-22.csv`, as plain text inside ONE ```csv code block
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
- Skip anything about games already played before 2026-11-22 and anything that is not NFL (college, other sports).
- If a thread has no concrete bet, include no rows for it (list it in section 2 instead).
- Inside that code block: plain CSV only, with no markdown, no extra fences and no blank lines; every row must have all 9 columns. Put nothing else in the block.

### 2) A short Markdown summary (in the chat, not a file)
A table with one row per URL: `handle | tweet_url | picks captured | source used (tweet / thread / image / video / article) | notes`.
In `notes`, say why a thread produced zero picks (e.g. "public money splits only", "game already played", "picks behind paywall", "video had no audio") and flag anything you could NOT access.

URLs:
https://x.com/salbets_/status/2122329102489145426
https://x.com/thepropguru_/status/2122166757825954179
https://x.com/thepropguru_/status/2121770158415138835
https://x.com/smoovesports/status/2121703968971592119
https://x.com/BFawkes22/status/2122704029658820685
https://x.com/nflrefstats1/status/2121799920206364946
https://x.com/thepropdealer/status/2121418602679095346
```

---

## Instructions Once Grok Generates CSV
1. Save Grok's output CSV to:
   `data/vault-seed/manual/grok-week11-threads/grok-twitter-picks-2026-11-22.csv`
2. Ingest into Supabase:
   ```powershell
   node scripts/load-external-intel-picks.mjs --dry-run
   node scripts/load-external-intel-picks.mjs --replace
   ```
*(The scanner will detect `grok-twitter-picks-2026-11-22.csv` on its next run and retire those URLs from future prompt packets).*
