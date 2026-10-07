# BetOnline Live Parser Verification Handoff

Date: 2026-09-21

Purpose: hand off the first BetOnline browser-extraction/parser result for independent verification.

## Files to Verify

- `scripts/props/betonline-live-parser.mjs`
- `tests/unit/betonlineLiveParser.test.js`

## Verification Command

```powershell
npx.cmd vitest run tests\unit\betonlineLiveParser.test.js
```

Observed result on 2026-09-21:

- 1 test file passed
- 3 tests passed

## Live BetOnline Route That Worked

The direct `/sportsbook/props` route did not expose player-prop markets. The route that worked was the hydrated NFL game-props category page:

```text
https://www.betonline.ag/sportsbook/futures-and-props/nfl-game-props/new-york-giants-@-los-angeles-rams
```

Navigation path used in the logged-in browser:

```text
Sportsbook -> Football -> NFL -> NFL Game Props -> New York Giants @ Los Angeles Rams
```

## Observed Live Parse Result

Status: superseded by review follow-up. The original browser run did not save a raw JSON artifact, and Claude review found that the market bucket counts below sum to 166 rather than the stated 170 rows. Treat this section as historical context only until the live page is re-captured to a saved artifact.

From the rendered page text, the parser returned 170 rows for:

```text
New York Giants @ Los Angeles Rams
```

Observed market row counts:

```json
{
  "first_td": 6,
  "carries": 8,
  "rush_yds": 8,
  "rush_rec_yds": 6,
  "atd": 24,
  "first_td_yn": 12,
  "unknown": 10,
  "fantasy_points": 16,
  "longest_rush": 4,
  "rec_yds": 16,
  "rec": 16,
  "longest_rec": 10,
  "kicking_points": 4,
  "targets": 6,
  "pass_cmp": 4,
  "pass_int": 4,
  "longest_completion": 4,
  "pass_att": 4,
  "pass_td": 4,
  "pass_yds": 4
}
```

Remaining `unknown` labels were game-level specials, not ordinary player props:

```json
[
  "Both Teams to Score in the 1st Quarter",
  "Longest Field Goal of the Game",
  "Longest Touchdown of the Game",
  "Shortest Field Goal of the Game",
  "Shortest Touchdown of the Game"
]
```

## Important Notes

- No full live JSON result file was saved during the browser run; the durable artifacts are the parser, tests, and this handoff summary.
- 2026-09-21 follow-up: Claude review flagged two issues in the original handoff. First, the row-count summary did not reconcile. Second, `Anytime Touchdown Scorer` rows were not emitted by the initial parser.
- 2026-09-21 follow-up fix: `Anytime Touchdown Scorer` player/odds list rows are now parsed under market `atd_1_plus`; `<Player> <TEAM> Score a Touchdown?` Yes/No rows remain market `atd`. This avoids mixing structurally different markets in the same key.
- 2026-09-21 follow-up fix: Player/odds list rows now use the same trailing team-code normalization as titled Yes/No and Over/Under rows, so `Kyren Williams LAR` becomes `player: "Kyren Williams"`, `team: "LAR"` instead of keeping the team inside the player string.
- 2026-09-21 verification: `npx.cmd vitest run tests\unit\betonlineLiveParser.test.js` passed with 1 file and 4 tests. The Claude collision repro was rerun directly and returned two `atd_1_plus` rows plus two `atd` rows, with teams populated.
- Browser extraction was read-only. No bets were placed and no account changes were made.
- Direct event URLs like `/sportsbook/football/nfl/game/...` were unreliable for player props. The `futures-and-props/nfl-game-props/...` route was the useful one.
- The parser currently parses rendered text, not an underlying BetOnline API endpoint.
