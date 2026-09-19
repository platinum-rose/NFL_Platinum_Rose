# Grok Thread Capture — reusable prompt

Use when the bookmarks agent leaves X threads unparsed (see the "missing/unparsed" URL list Claude
prints from `research_intel_notes` with zero `research_pick_signals`). Paste the prompt below into Grok,
then the URLs. Save Grok's CSV as:

`data/vault-seed/manual/grok-weekNN-threads/grok-twitter-picks-YYYY-MM-DD.csv`   (keep the `.csv` extension)

Load it with `node scripts/load-external-intel-picks.mjs --dry-run` (check the skips), then without
`--dry-run` to insert into `research_pick_signals` (safe to re-run; duplicates are skipped).

---

## Prompt (copy everything below this line)

You are extracting NFL betting intel from X/Twitter posts for a betting-research database. Today is {DATE}; the current slate is NFL {SEASON} Week {WEEK}.

For EACH URL below, open the post AND the author's full self-reply thread (every tweet the same author posted under it), read every attached image/graphic, and — if the post links to a video (X video, YouTube) or an article — use the linked content too. Do not rely on the first tweet alone.

Return exactly TWO things, in this order.

### 1) One CSV file named `grok-twitter-picks-{DATE}.csv`
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
- Skip anything about games already played before {DATE} and anything that is not NFL (college, other sports).
- If a thread has no concrete bet, include no rows for it (list it in section 2 instead).
- Plain CSV only: no markdown, no code fences, no blank lines, and every row must have all 9 columns.

### 2) A short Markdown summary (in the chat, not a file)
A table with one row per URL: `handle | tweet_url | picks captured | source used (tweet / thread / image / video / article) | notes`.
In `notes`, say why a thread produced zero picks (e.g. "public money splits only", "game already played", "picks behind paywall", "video had no audio") and flag anything you could NOT access.

URLs:
{PASTE URLS HERE, one per line}
