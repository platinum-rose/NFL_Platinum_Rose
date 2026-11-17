# Closing-line capture (audit A4 / proposal P9c)

`capture_closing_lines.py` writes two files next to the wager ledgers. It is free (ESPN public summary, DraftKings open/close in `pickcenter`), read-only on the ledgers, and safe to re-run.

| File | Contents |
|---|---|
| `data/official-picks/closing-lines-2026.json` | one row per final game: open and close spread, total, moneylines |
| `data/official-picks/closing-line-values-2026.json` | one row per single-game spread / total / moneyline leg (placed + paper ledgers): line and price taken vs the close, CLV |

"Close" = the last pre-kickoff DraftKings line, as frozen in ESPN's post-game summary. The weekly post-mortem already caches those summaries in `data/fantasy/boxscores/`, so the Tuesday run needs no extra network call.

```
python3 scripts/closing-lines/capture_closing_lines.py                  # every cached 2026 game
python3 scripts/closing-lines/capture_closing_lines.py --fetch-week 11  # cache week 11 finals first
python3 scripts/closing-lines/test_capture_closing_lines.py             # 8 tests
```

Not wired into `scripts/toolbox.mjs` yet. Proposed hook, right after step 8 (post-mortem) of the Tuesday cadence:

```js
console.log(`${c.cyan}8b. Closing lines + CLV for Week ${pmWeek} (ESPN pickcenter, free)...${c.reset}`);
await run(repoPython(), ['scripts/closing-lines/capture_closing_lines.py', '--fetch-week', String(pmWeek)]);
```

Reading CLV: count only legs taken at a standard price (-118 to +105) and not live. A bought half-point or an alt line beats the close by construction and pays for it in the price.
