# Week 8 confidence and Pick'em review — November 1, 2026

Proposal only. Comparison baseline: the Friday October 30, 1:21 PM PT update in `reports/bets/2026-w08-pool-picks-proposal-2026-10-29.md`. No pool accounts were accessed and no entered picks, pool data, or contest entries were changed.

## Recommendation

Make two small confidence swaps: Dallas above New England, and Detroit above Buffalo. Retain the same thirteen straight-up winners as the Friday proposal. This is a judgment overlay on the latest saved market and Saturday matchup evidence, not a newly fitted probability model or an automatic reordering of market odds.

| Team | Previous duma | Proposed duma | Previous Yahoo | Proposed Yahoo | Change basis |
|---|---:|---:|---:|---:|---|
| DAL | 13 | 14 | 11 | 12 | New England's confirmed offensive absences justify moving Dallas ahead narrowly. |
| NE | 14 | 13 | 12 | 11 | Keep NE to win; reduce confidence relative to Dallas. |
| DET | 7 | 8 | 5 | 6 | Cleaner injury picture than BUF; Saturday synthesis narrowly favors DET's outright chance over BUF's. |
| BUF | 8 | 7 | 6 | 5 | Keep BUF to win; several key Questionables remain. |

These are small ranking differences. The latest saved de-vigged markets still put NE ahead of DAL and disagree on the ordering of PIT/DET/BUF/SEA. The proposed swaps apply the matchup/injury overlay; they are not market-consensus flips.

## Consolidated sheet

The recorded Thursday result/slots are preserved from the Friday proposal: GB won; duma 10 and Yahoo 8 were described as banked. Account entry state was not independently rechecked.

| Game | Winner / CBS BUKBUK default | duma (3–16) | Yahoo (1–14) |
|---|---|---:|---:|
| TEN@CIN | CIN | 16 | 14 |
| IND@JAX | JAX | 15 | 13 |
| ARI@DAL | DAL | 14 | 12 |
| NE@MIA | NE | 13 | 11 |
| LAC@LAR | LAR | 12 | 10 |
| PHI@WAS | WAS | 11 | 9 |
| CAR@GB — completed | GB — recorded winner | 10 | 8 |
| CLE@PIT | PIT | 9 | 7 |
| MIN@DET | DET | 8 | 6 |
| BAL@BUF | BUF | 7 | 5 |
| CHI@SEA — Monday | SEA | 6 | 4 |
| ATL@TB | TB | 5 | 3 |
| LV@NYJ | NYJ | 4 | 2 |
| KC@DEN | KC — provisional, last pre-lock review | 3 | 1 |

Each confidence scale is complete and unique, including the recorded locked Thursday slot: duma 3..16 (133 total points); Yahoo 1..14 (105 total points). Per-game synthesis labels such as multiple games at "4/16" are confidence bands, not a usable unique pool sheet; they were not copied as entry ranks.

## What changed, and what remains conditional

- **NE:** The [Patriots' Saturday roster analysis](https://www.patriots.com/news/roster-analysis-patriots-downgrade-wr-a-j-brown-rb-treveyon-henderson-to-out-for-week-8-vs-dolphins) confirms the receiver/running-back downgrades and the unavailable tackle. The Saturday local synthesis incorporates the absences and moves the fair line from NE -6.5 to NE -6. This supports a small confidence reduction, not a MIA outright pick. The saved market continues to favor NE strongly.
- **DET / BUF:** The saved Saturday synthesis has Detroit marginally ahead of Buffalo in its outright forecast. [Buffalo's official Friday report](https://www.buffalobills.com/news/buffalo-bills-injury-report-vs-ravens-week-8) lists several meaningful Questionables. The proposed reversal of Friday's BUF/DET order is modest; Sunday activation news can reverse it again.
- **KC / DEN — material model limitation:** The [Chiefs' updated official preview](https://www.chiefs.com/news/five-things-to-watch-on-sunday-chiefs-vs-broncos-x5242) confirms the two cornerback absences. The saved KC@DEN synthesis still treats both as Questionable and expressly says its KC betting lean should drop to PASS if both miss and Denver's questionable receiver plays. The stored KC forecast is therefore not a current post-news probability. Keep this game at the lowest confidence slot, with KC only a provisional carry-forward winner pending the remaining Denver availability checks. No new probability or unconditional final pick is claimed.
- **NYJ / LV:** Keep NYJ as the baseline winner. Saturday's extra LV voices include teaser positions, which do not establish an outright change. LV remains a discretionary weekly-prize upset option rather than the default CBS pick.
- **WAS / PHI:** Keep WAS to win. The defensive-line absences and PHI spread/ML value arguments justify restraint in betting, but the saved synthesis still favors WAS outright. No new high-confidence upgrade.
- **TB / ATL:** Keep TB low. The more recent saved BEO market is much closer to a coin flip than the earlier BKR capture. That reduces conviction; it does not supply enough independent support to force ATL as the base pool winner.
- **SuperContest distinction:** Official spread selections MIN/CLE/CHI can coexist with DET/PIT/SEA straight-up pool winners. Contest cover recommendations were not converted into outright picks.
- **Weather / inactives:** The NE weather input remains an older forecast; no current wind number is asserted. Sunday inactives and Monday's CHI@SEA final availability still need the normal pre-lock review.

## Evidence and scope

- `reports/intel/w08-model/fair-lines-w08-synth.json` and the Friday counterpart: existing saved simulations and adjustment reasons only; no rerun, new fit or paid call. For the two proposed swaps the stored tie-aware home-win fields imply DAL 71.54% versus NE 70.63%, and DET 59.36% versus BUF 58.85%. These are saved illustrative outputs, not fresh post-news calibrated probabilities. They support only a narrow ordering judgment.
- `data/generated/props/bookmaker-live-2026-10-31-week8.json`, captured `2026-10-31T21:26:44.573Z`, and `data/generated/props/betonline-live-2026-11-01-week8.json`, captured `2026-11-01T03:32:49.345Z`: paired moneylines were de-vigged independently per book. They are saved snapshots, not newly observed live prices. The later capture has no usable NYJ/LV moneyline pair; that game's market check uses BKR.
- Current per-game Saturday side reports for all thirteen remaining games were reviewed. Winner defaults all match the prior Friday pool sheet. Late KC secondary status above is newer than its saved synthesis.
- Weekly preflight rerun `2026-11-01T06:56:22.520Z`: roster gate PASS, zero blocking issues; availability and starters pass their local age checks. Stale usage, promoted podcast, legacy prop-folder and futures checks are not inputs to this pool comparison. No player-prop candidates or futures recommendations are made.
- No accounts, pool entries, placed wagers, Supabase data, tracker files, official contest picks, source intel, or paid services were changed. Only this review document was created.
