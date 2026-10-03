# Week 4 live market capture — 2026-10-01

## Completed read-only captures

- **Bookmaker:** refreshed 15 Week 4 main lines in `data/odds/BKR_current_lines_1001_2351`; PIT@CLE remains intentionally excluded. The earlier 15-game SGP capture remains in place. Fresh rendered division futures (28 quoted teams across seven displayed divisions) are in `data/futures-imports/bookmaker-2026-10-01-live-division-futures.json`. The live Make the Playoffs board is saved in `data/futures-imports/bookmaker-2026-10-01-live-make-playoffs.json` (31 displayed teams). First-half, second-half, and all four quarter boards for the same 15 games are captured in `data/odds/BKR_period_lines_1002_0007.md` (15 rows per period, 90 rows total).
- **BetOnline:** all 15 active Week 4 main lines saved in `data/odds/BEO_current_lines_1001_2333`. Fresh AFC and NFC winner boards (32 teams) saved in `data/futures-imports/betonline-2026-10-01-live-conference-futures.json`. The refreshed rendered NFL board also supplied all 15 first-half standard-line rows in `data/odds/BEO_period_lines_1002_0116.md`. Direct rendered event detail exposed no pregame second-half or quarter standard-line tables; those remain uncaptured rather than inferred absent.
- **BetUS:** all 15 active Week 4 main lines saved in `data/odds/BetUS_current_lines_1001_2333`. Its rendered NFL futures landing page exposed direct market families (division, regular-season wins, conference, Super Bowl, and matchup), but not a consolidated price table. No future price artifact was fabricated.
- **DraftKings Predictions:** all 15 active Week 4 Game Lines contracts saved in `data/odds/DKP_current_game_contracts_1001_2333.md`. These are displayed event-contract percentages—not sportsbook odds—and must remain separate from book pricing. No trade was initiated.

## Exclusions and guardrails

- PIT@CLE was omitted everywhere because it is off the board and no longer relevant to the pending Week 4-market capture.
- No wager, contract, bet-slip, account, deposit, settings, ledger, Supabase, or proposal action occurred.
- No TheOddsAPI call was made.

## Remaining freshness gaps

1. Bookmaker main lines are refreshed at 23:51 PT. The Make the Playoffs page did have 31 rows; the earlier empty-page report was a capture error and is superseded by the saved board. Its displayed Odds to Win page omitted AFC North, conference winners, and Super Bowl winner; Awards rendered no market rows. Those unavailable/absent BKR futures must not be inferred from older files.
2. BetOnline division, Super Bowl, playoff, and season-win futures were not refreshed in this pass; only conference winners are fresh.
3. BetUS futures price tables require individual direct-market capture; the landing page itself is an index rather than a complete rendered price board.
4. The prediction-market capture is DraftKings Predictions Game Lines only. It contains neither order-book depth nor fee-adjusted executable asks, so it is information-only until those fields are independently captured for a definition-matched market.
