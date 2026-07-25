# Futures Watchlist Workflow

Use [data/futures-imports/futures-watchlist-2026.json](../data/futures-imports/futures-watchlist-2026.json)
for adjustable futures ideas you want the analyst to consider every run.

Prefer this JSON file over a spreadsheet for the actual agent input because it
keeps canonical market ids intact:

- `wins`
- `playoffs`
- `division_afc_east`
- `division_afc_north`
- `division_nfc_north`
- `division_nfc_south`
- `conference_afc`
- `conference_nfc`
- `superbowl`
- `superbowl_matchup`

The watchlist is a consideration list, not a bet ticket. The analyst should
either recommend the target, put it in the report watch list with a timing or
price trigger, or pass and explain why.

Exacta / Super Bowl matchup coverage is monitor-only until a secondary
BetOnline market is available for price shopping against BetUS or another
placeable book. Single-book exactas can support planning, but should not be
treated as current plays.

Current examples in the file:

- Bills anchor ATB: win total over, make playoffs, division, AFC, Super Bowl, and Super Bowl exacta/matchup coverage.
- Packers anchor ATB: win total over, make playoffs, division, NFC, Super Bowl, and Super Bowl exacta/matchup coverage.
- Giants win total over.
- Bengals ATB: win total over, make playoffs, division, AFC, Super Bowl.
- Saints make the playoffs.
- Chiefs Super Bowl and Super Bowl exacta/matchup coverage.

Run with the default watchlist:

```powershell
node agents\portfolio-synthesize.js --shadow-slim --models gpt-4o --skeptic-model gpt-4o --risk-model gpt-4o --dossier .nfl\portfolio\dossier-<date>.json --no-persist --out-suffix watchlist
```

Point to a different file:

```powershell
node agents\portfolio-synthesize.js --dossier .nfl\portfolio\dossier-<date>.json --watchlist data\futures-imports\my-watchlist.json --no-persist
```

Keep using `--primary` separately for core conviction positions that should shape
hedge baskets:

```powershell
node agents\portfolio-synthesize.js --dossier .nfl\portfolio\dossier-<date>.json --primary "Buffalo Bills,Green Bay Packers" --watchlist data\futures-imports\futures-watchlist-2026.json --no-persist
```
