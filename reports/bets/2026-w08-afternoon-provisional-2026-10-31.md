# Week 8 afternoon five-leg proposal — 2026-10-31

**Status: PROVISIONAL / NOT PLACED / PRICE INCOMPLETE.** Andy authorized proceeding with verified saved sources while excluding stale usage and podcast inputs. This is a $5 C-level lottery proposal aiming around +4000. Stafford INT and the defender market are not captured BEO offers; their actual prices and BEO's final combination quote are required. Do not log this as a placed wager.

**EXPOSURE UPDATE — HOLD:** Andy subsequently placed a separate DK Predictions five-pick Alejandro Split combo, master-ledger ID `bet_20261031_dkp_5pick_atd_stafford_was_boost10_alejandro_split` ($9.98 cost; $286.10 payout including the 10% boost). It includes the same Stafford 1+ interceptions-thrown leg. That leg is now **HARD** duplicate live exposure, so this original BEO construction must not be reused unchanged. This BEO proposal remains unplaced; no replacement ticket has been selected.

## Freshness and scope

- Current preflight run 2026-11-01T04:57:42.545Z: roster vet PASS, zero blockers; full ESPN rosters roughly 7.4 hours old. Local availability, starters, secondary matchups and current BKR capture passed their checks.
- BEO per-game captures below are from October 31, 2026, 8:33 PM PT (November 1 UTC). The weekly preflight checks a missing legacy Week8 folder and does not detect these saved structured captures. Their coverage is incomplete: no Stafford INT and no defensive-player quotes.
- Usage trends (108 hours old) and promoted podcast pull (zero promoted episodes) are excluded under Andy's explicit provisional authorization. Futures are outside this ticket's scope.
- Sunday inactives and final availability remain pending. No current weather confirmation was obtained for NE@MIA; the local Under case remains weather-dependent.

## Proposed ticket

| Game | Market & line | Book | Price | Band | Tier | Side expected to win? | QB exposure | Availability tier | One-line why |
|---|---|---|---|---|---|---|---|---|---|
| LAC@LAR | Matthew Stafford 1+ interceptions thrown | BEO offer unverified | NEED QUOTE | Unknown | 3 / C | LAR favored | Direct Stafford turnover | HARD | Now held on the official DK Predictions combo; skip this exact duplicate on any additional ticket. |
| LAC@LAR | Khalil Mack 1+ sacks | BEO offer unverified | NEED QUOTE | Unknown | 3 / C | LAR favored | Same Stafford dropbacks | FREE | Healthy pass rusher with 3 sacks in 6 games; shares pressure risk with the INT leg. |
| KC@DEN | J.K. Dobbins ATD | BEO saved capture | +210 | Plus | 2 / B qualitative | Near pick'em; KC slight favorite | DEN offense / Nix | FREE | TD in three straight games; goal-line role supports the selection, with backfield-volume risk. |
| KC@DEN | Bo Nix under 15.5 rushing yards | BEO saved capture | -115 | -120 to -100 | 2 / B qualitative | Near pick'em; KC slight favorite | Direct Nix rushing | FREE | Six of seven official logs under; 2 rushing yards in prior KC meeting. Last week's 73 is the counter-case. |
| NE@MIA | Under 43 total points | BEO saved capture | -110 | -120 to -100 | 3 / C conditional | NE favored | Both offenses | FREE | Fits the saved lower-possession case and stays above its 42.5 floor; current wind still needs checking. |

Kickoffs, from `public/schedule.json`: LAC@LAR Sunday November 1 at 1:05 PM PT; KC@DEN and NE@MIA at 1:25 PM PT. The book's saved display time is not used as Pacific time.

## Prices and target

The three captured prices are available rows in these files:

- `data/generated/props/betonline-live-2026-11-01-chiefs-at-broncos.json`, captured `2026-11-01T03:33:49.197Z`: zero-based row 58, Dobbins ATD Yes +210; row 35, Nix rushing Under 15.5 -115.
- `data/generated/props/betonline-live-2026-11-01-patriots-at-dolphins.json`, captured `2026-11-01T03:33:55.163Z`: zero-based row 5, Under 43 -110.

Their decimal product is **11.0644268775**. To reach +4000 (41.00 decimal), Stafford INT decimal price multiplied by the defender decimal price must be about **3.7055692495**.

**Arithmetic examples only — not captured prices or available offers:**

| Hypothetical Stafford INT price | Hypothetical Mack sack price | Raw five-leg product, American | $5 gross return |
|---|---|---|---|
| +100 | -115 | +4037.13 | $206.86 |
| +100 | -120 | +3956.96 | $202.85 |
| +110 | -130 | +4010.86 | $205.54 |
| +125 | -150 | +4049.16 | $207.46 |

BEO's actual combination quote may differ because the two LAC@LAR selections share pressure exposure and the two DEN selections share offensive script. These calculations are raw price products, not joint probability estimates. No calibrated parlay probability or positive expected value is claimed. If BEO does not offer or combine either conditional market, this exact construction is unavailable.

## Evidence and pushback

- **Stafford / Mack:** Stafford INT is the requested anchor, rather than a promoted model edge. Rams expected lead/run volume and Chargers secondary absences argue against forcing this leg at a poor price. Mack has [3 sacks in six games](https://www.chargers.com/team/players-roster/khalil-mack/logs/) and is [off the final injury report](https://www.chargers.com/news/chargers-vs-rams-injury-report-mcconkey-full-james-awosika-don-t-practice-wednesday). A pressure narrative is insufficient without an actual sack offer. Confirm the book's full-sack/half-sack threshold and settlement wording.
- **Dobbins:** [Official log](https://www.denverbroncos.com/team/players-roster/j-k-dobbins/logs/) records one TD in each of W5, W6 and W7. The local per-game role evidence favors him at the goal line, but six W7 carries show the workload floor. [Denver's final injury report](https://www.denverbroncos.com/news/injuryreport/injury-report-cb-pat-surtain-ii-not-assigned-game-status-4-broncos-listed-as-questionable-for-week-8-game-vs-chiefs) rules out another running back; no guaranteed workload increase is assumed.
- **Nix:** [Official log](https://www.denverbroncos.com/team/players-roster/bo-nix/logs/) confirms rushing yards 2/6/7/10/10/2/73 through W7. This corrects the local prose's 75-yard W7 figure. `reports/intel/games/2026-w08-game-KC_at_DEN-props.md` allows this under to 13.5 but says PASS at -125 or 12.5. Do not substitute an old 6/7 rate for a predictive hit probability.
- **NE@MIA:** `reports/intel/games/2026-w08-game-NE_at_MIA-sides.md` supports the Under to 42.5 -115. The actual saved BEO line is 43 -110. This is a half point worse than its headline 43.5; weather uncertainty lowers the ticket leg to C.

## Self-check

- Five legs; two LAC@LAR, two KC@DEN, one NE@MIA. BEO maximum two per game is respected.
- No spread-dog legs or moneyline legs at -290 or shorter.
- Captured legs shorter than -200: zero. The two missing prices must still pass the -350 leg barrier and the maximum-two-shorter-than--200 rule.
- Two captured legs in -120..-100: Nix is supported by a tier-2 case; the Under is tier-3/conditional and explicitly flagged.
- Shared QB/script exposure: Stafford INT plus Mack sack; Nix rushing under plus Dobbins TD. No independence assumption.
- Initial read-only `scripts/props/availability.mjs` snapshot: all four proposed players were FREE, with no live NE@MIA total hold. After the subsequent official DK combo was logged, the helper confirms Stafford 1+ INT is HARD. Prior Alejandro tickets remain existing exposure.
- A five-leg shape is Andy's current request; the standing afternoon default is six legs. Proposed $5 stake follows the moonshot allowance.
- Actual combined price: **UNKNOWN**. No sportsbook account accessed and nothing placed, synced externally, published, staged, or rebuilt.
- Roster verification: **PASS, zero blocking issues** with `npm run roster:vet -- --week 8 --date 2026-10-31 --fetch --strict --card reports/bets/2026-w08-afternoon-provisional-2026-10-31.md --digest scratch/w08-afternoon-provisional-digest-2026-10-31.md`; four card players and four digest players resolved. Market wording was lowercased so the parser resolves the actual name rather than treating the direction word as part of it.

Working digest: `scratch/w08-afternoon-provisional-digest-2026-10-31.md`.
