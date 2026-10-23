# Grok Thread Capture Packet — 2026-10-23 (Week 7)
*Generated automatically by NFL_Dashboard Grok Thread Scanner at 2026-10-23T05:04:56.652Z*

Found **20** active unprocessed Twitter/X bookmark threads for **Week 7** ready for Grok extraction.

## Unprocessed Threads (20)

| Author | URL | Type | Context |
| :--- | :--- | :--- | :--- |
| @Patrick Everson | [Tweet Link](https://x.com/PatrickE_Vegas/status/2113362291379061056) | Multi-Tweet Thread | [1/2] Bears are -3 (-102) vs. Patriots for TNF at @DKSports, |
| @Deepak Chona, MD. SMA | [Tweet Link](https://x.com/SportMDAnalysis/status/2113324739712180720) | Multi-Tweet Thread | [1/9] #NFL Injury Updates |
| @RotoWire Fantasy Football | [Tweet Link](https://x.com/RotoWireNFL/status/2113085347445821810) | Multi-Tweet Thread | [1/2] 🚨 Fantasy Football News Updates You Need to Know |
| @Joe Holka | [Tweet Link](https://x.com/thejoeholkashow/status/2113072100722495592) | Multi-Tweet Thread | [1/2] 8-0 last TNF... |
| @Sal Bets | [Tweet Link](https://x.com/salbets_/status/2112891425339658600) | Multi-Tweet Thread | [1/15] This might sound crazy but… |
| @RotoWire Fantasy Football | [Tweet Link](https://x.com/RotoWireNFL/status/2112345490863919547) | Multi-Tweet Thread | [1/2] 🚨 Fantasy Football News Updates You Need to Know |
| @Cody Brown Bets | [Tweet Link](https://x.com/CodyBrownBets/status/2112227602387583104) | Multi-Tweet Thread | [1/4] Three plus money straights I love on MNF… |
| @FATBOSS | [Tweet Link](https://x.com/FATBOSSPICKS/status/2112102743804387803) | Multi-Tweet Thread | [1/2] NFL TRENDS 📝 |
| @Harry Lock Picks | [Tweet Link](https://x.com/HarryLockPicks/status/2113346013289472028) | Zero Signal Note | 🏈 All of these teams win in Week 7 of the NFL... |
| @Sean Koerner | [Tweet Link](https://x.com/The_Oddsmaker/status/2113330293230698869) | Zero Signal Note | Week 7 Pick ’Em Rankings are LIVE 🏈      |
| @Cody Brown Bets | [Tweet Link](https://x.com/CodyBrownBets/status/2113303420140712371) | Zero Signal Note | 🏟️ +335 Patriots @ Bears SGP |
| @Sal Bets | [Tweet Link](https://x.com/salbets_/status/2113303365220438256) | Zero Signal Note | My 4 Best Bets for Thursday Night Football: https://t.co/uBC |
| @John Ewing | [Tweet Link](https://x.com/johnewing/status/2113303113650344249) | Zero Signal Note | Teams getting +50% of bets have gone 35-53-3 (39.8%) ATS so  |
| @Dan’s AI Sports Picks | [Tweet Link](https://x.com/DanGambleAI/status/2113297367613260229) | Zero Signal Note | 🏈 +334 TNF Same Game Parlay |
| @Brian Peotter | [Tweet Link](https://x.com/Brian_Peotter/status/2113276005032812563) | Zero Signal Note | I was curious which NFL teams had the best fans, and what wo |
| @Cody Brown Bets | [Tweet Link](https://x.com/CodyBrownBets/status/2113273842697146643) | Zero Signal Note | 💯 These seven TNF props have cashed in every game so far th |
| @Patrick Everson | [Tweet Link](https://x.com/PatrickE_Vegas/status/2113261184619360541) | Zero Signal Note | Sharp action on NFL Week 7 Odds at @CaesarsSports: |
| @John Ewing | [Tweet Link](https://x.com/johnewing/status/2112699133832163496) | Zero Signal Note | NFL favorites of 6 or more points are 8-19-3 (30) ATS this s |
| @John Ewing | [Tweet Link](https://x.com/johnewing/status/2112536819007094889) | Zero Signal Note | NFL teams getting +50% of bets have gone 35-53-3 (40%) ATS t |
| @Cody Brown Bets | [Tweet Link](https://x.com/CodyBrownBets/status/2112186834599961002) | Zero Signal Note | You guys want to see my MNF SGP?  |

---

## Ready-to-Paste Grok Prompt

Copy the block below and paste it directly into Grok:

```markdown
You are extracting NFL betting intel from X/Twitter posts for a betting-research database. Today is 2026-10-23; the current slate is NFL 2026 Week 7.

For EACH URL below, open the post AND the author's full self-reply thread (every tweet the same author posted under it), read every attached image/graphic, and — if the post links to a video (X video, YouTube) or an article — use the linked content too. Do not rely on the first tweet alone.

Return exactly TWO things, in this order.

### 1) One CSV file named `grok-twitter-picks-2026-10-23.csv`
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
- Skip anything about games already played before 2026-10-23 and anything that is not NFL (college, other sports).
- If a thread has no concrete bet, include no rows for it (list it in section 2 instead).
- Plain CSV only: no markdown, no code fences, no blank lines, and every row must have all 9 columns.

### 2) A short Markdown summary (in the chat, not a file)
A table with one row per URL: `handle | tweet_url | picks captured | source used (tweet / thread / image / video / article) | notes`.
In `notes`, say why a thread produced zero picks (e.g. "public money splits only", "game already played", "picks behind paywall", "video had no audio") and flag anything you could NOT access.

URLs:
https://x.com/PatrickE_Vegas/status/2113362291379061056
https://x.com/SportMDAnalysis/status/2113324739712180720
https://x.com/RotoWireNFL/status/2113085347445821810
https://x.com/thejoeholkashow/status/2113072100722495592
https://x.com/salbets_/status/2112891425339658600
https://x.com/RotoWireNFL/status/2112345490863919547
https://x.com/CodyBrownBets/status/2112227602387583104
https://x.com/FATBOSSPICKS/status/2112102743804387803
https://x.com/HarryLockPicks/status/2113346013289472028
https://x.com/The_Oddsmaker/status/2113330293230698869
https://x.com/CodyBrownBets/status/2113303420140712371
https://x.com/salbets_/status/2113303365220438256
https://x.com/johnewing/status/2113303113650344249
https://x.com/DanGambleAI/status/2113297367613260229
https://x.com/Brian_Peotter/status/2113276005032812563
https://x.com/CodyBrownBets/status/2113273842697146643
https://x.com/PatrickE_Vegas/status/2113261184619360541
https://x.com/johnewing/status/2112699133832163496
https://x.com/johnewing/status/2112536819007094889
https://x.com/CodyBrownBets/status/2112186834599961002
```

---

## Instructions Once Grok Generates CSV
1. Save Grok's output CSV to:
   `data/vault-seed/manual/grok-week07-threads/grok-twitter-picks-2026-10-23.csv`
2. Ingest into Supabase:
   ```powershell
   node scripts/load-external-intel-picks.mjs --dry-run
   node scripts/load-external-intel-picks.mjs --replace
   ```
*(The scanner will detect `grok-twitter-picks-2026-10-23.csv` on its next run and retire those URLs from future prompt packets).*
