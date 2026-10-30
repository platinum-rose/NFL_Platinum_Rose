# Defensive prop boards — weekly runbook

Purpose: save every defensive prop offer (tackles + assists, solo tackles, assists, sacks, defender INTs, QB INTs) each week, so lines can be priced against the defensive model before betting and graded against results afterward.

## Where defensive props live

| Book | Defensive props? | How we capture |
|---|---|---|
| BetOnline | Only in the **parlay-builder** game page ("Game Markets (Parlays only)"). It has T+A, sacks and INT ladders. The straight board the cron scrapes has only team/game sack totals. | Copy the parlay-builder page text into a `.txt` in `data/intake-drop/beo-sgp/`. Optional file name: `beo-sgp 2026-11-01-0930.txt` (Pacific time). Then `npm run props:beo:sgp`. |
| DK Predictions | DEFENSIVE tab on each game page: Sacks, Tackles, Assists, Tackles + Assists chips. | `npm run props:dkp:defense` (needs the DKP Chrome on CDP 9224: `npm run props:dkp:launch`). Read-only: it clicks tabs/chips only. |
| Bookmaker | None (no tackles, sacks or INT props on its SGP board). | — |

## One command

```
npm run props:defense:run              # DK defensive tab + BetOnline drop folder + merge + rebuild sheet
npm run props:defense:run -- --skip-dkp   # when the DKP Chrome isn't running
```

The run writes:
- `data/generated/props/draftkings-predictions-defense-<date>-<a>-at-<h>.json`
- `data/generated/props/betonline-sgp-<date>-<a>-at-<h>.json`
- `data/defensive-props/boards/defensive-boards-week-NN.json`: the latest offer per book, player, market and rung.
- `data/defensive-props/boards/defensive-board-history-2026.jsonl`: every capture, de-duplicated, safe to re-run.
- `docs/defensive-props/defensive-props-latest.md`: the **Priced defensive offers** table (model probability vs. implied, edge, EV per unit).

## Schedule (Andy registers it)

```
npm run props:defense:register
```

This registers the Windows task `NFL_Defensive_Boards_Sync`: Wed 20:35, Thu 13:35, Fri 13:35, Sat 20:35, Sun 08:35 and 12:35 Pacific. That's 15 minutes after the DK prop cron, so the two never share the Chrome profile. It refuses to overwrite an existing task unless `-Overwrite` is passed. BetOnline still needs the copied page dropped in the folder before a run.

## After the games

```
npm run props:defense:grade
```

This grades every saved offer against ESPN box scores, using the last price captured before kickoff. Players missing from the box score are void. It reports by book/market, by implied-probability bucket, and model-vs-price buckets: `data/defensive-props/boards/defensive-board-grades-2026.json`.

## Notes

- First graded boards (two games): rungs priced under 25% implied went 3 for 81. That's a tiny sample, but a warning about ladder lottos.
- The model's probability uses calibrated past hit rates, shifted by the vacated-tackle bump or a role-change adjustment. Role change means snap share jumped to 80%+ last game (↑role on the sheet). In the TNF test the book read McDuffie's new role (8+ at −213) better than the model did. Treat model-vs-price as a screen until the history has a few weeks in it.
