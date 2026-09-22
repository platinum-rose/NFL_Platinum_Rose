# Codex review request — BetOnline live parser, `atd` market-key collision (2026-09-21)

## Context

Your `Anytime Touchdown Scorer` fix landed and works — `npx vitest run
tests/unit/betonlineLiveParser.test.js` reproduces cleanly at 3/3 passing,
and the rows that were previously silently dropped now come through.
Independent verification found a follow-on issue the fix introduced,
not present before it: the new `parsePlayerOddsList()` path and the
existing `atd` entry in `MARKET_PATTERNS` now both write `market: 'atd'`
for two structurally different bet types.

## Files

- `scripts/props/betonline-live-parser.mjs`
- `tests/unit/betonlineLiveParser.test.js`

## What's wrong

`Anytime Touchdown Scorer` is a one-sided outright list — one row per
player, `side` always `'Yes'`, no complementary "No". `"<Player> <TEAM>
Score a Touchdown?"` is a balanced two-sided Yes/No market — two rows
per player. Both now land under `market: 'atd'`.

Repro:

```js
import { parseBetOnlineEventText } from './scripts/props/betonline-live-parser.mjs';
const rows = parseBetOnlineEventText(`
Anytime Touchdown Scorer
Kyren Williams LAR
-165
Cam Skattebo NYG
+250
Jaxson Dart NYG Score a Touchdown?
Yes
+220
No
-280
`, { game: 'test' });
console.log(rows.filter(r => r.market === 'atd'));
```

All four rows come back `market: 'atd'`. Anything downstream that
groups or aggregates by `market === 'atd'` (implied-probability calc,
ticket building, QA row counts) will silently mix the two price types.

Compounding it: player/team parsing is inconsistent within the merged
bucket. `pushYesNo`/`pushOverUnder` route through `parseMarketTitle()`,
which splits `"Jaxson Dart NYG"` into `player: "Jaxson Dart", team:
"NYG"`. `parsePlayerOddsList()` (used for both `first_td` and the
anytime-scorer list) never does that split — it leaves the raw string
(`"Kyren Williams LAR"`) in `player` with `team: null`. Same market key,
two different row shapes.

## What's requested

1. **Split the market key.** Give the outright list its own key distinct
   from the Yes/No market — e.g. `atd_anytime` for the
   `Anytime Touchdown Scorer` entry in `PLAYER_ODDS_LIST_SECTIONS`, keep
   `atd` (or rename to `atd_yn`) for the `MARKET_PATTERNS` Yes/No entry.
   The Bookmaker SGP extraction
   (`scratch/bookmaker-sgp-live-2026-09-21-nyg-lar.json`) already uses
   this convention — `atd_1_plus` kept distinct from other TD markets —
   match that naming so the two books' data is comparable.

2. **Normalize player/team parsing across both branches.** Route the
   name through the same team-suffix split `parseMarketTitle()` uses
   (or a shared helper) so `player`/`team` are populated consistently
   regardless of which code path produced the row — `parsePlayerOddsList`
   included.

## Verification to include in the handoff back

- Update `tests/unit/betonlineLiveParser.test.js` to assert the new
  distinct market key for the anytime-scorer rows, and assert those
  rows carry a parsed `team` (not `null`) when the source text has a
  team suffix.
- Re-run `npx vitest run tests/unit/betonlineLiveParser.test.js` and
  report the pass count.
- Re-run the repro above and confirm the four rows now split into two
  distinct `market` values, with `team` populated on all of them.
