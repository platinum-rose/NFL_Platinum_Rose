# W12 pools — inputs checklist (Duma, Yahoo/Kenny's, CBS BUKBUK)

Built Tue 2026-11-24 12:20 PM PT (Claude). The handoff target is Claude team 2. Andy places every pick. Claude proposes only.

## Slate and locks (16 games, no byes → Duma 1–16, Yahoo 1–16, CBS 16 straight-up)
Every pool locks per game at kickoff. **The GB@LAR confidence value is spent the moment it locks**, so the full 16-game ranking has to exist before Wed kickoff. After that, only unlocked games can be shuffled among the slots that are still open.

| Lock wave (PT) | Games | Picks needed by |
|---|---|---|
| Wed 11/25 5:00 PM (repo schedule; the GB@LAR file says 5:15, confirm) | GB@LAR | **Wed ~3:45 PM** (after inactives): full prelim 16-game ranking + GB@LAR pick in all 3 pools |
| Thu 11/26 10:00 AM / 1:30 PM / 5:20 PM | CHI@DET, PHI@DAL, KC@BUF | Thu 9:30 AM |
| Fri 11/27 12:00 PM | DEN@PIT | Fri 11:30 AM |
| Sun 11/29 10:00 AM (6) / 1:05–1:25 PM (3) / 5:20 PM | NO@CIN, LV@CLE, NYG@IND, NYJ@MIA, ATL@MIN, BAL@HOU; TEN@JAX, WAS@ARI, SEA@SF; NE@LAC | Sun 9:30 AM (final pass after Fri injury reports) |
| Mon 11/30 5:15 PM | CAR@TB | Sun AM with the rest |

## Inputs (owner · status · where it lands)
**A. Must have before the Wed ranking**
1. **Moneylines, all 16 games** (Bookmaker and/or BetOnline; free, no TheOddsAPI). Owner: Andy runs the Toolbox capture or pastes the board; Claude normalizes it. Status: missing (the W11 file is `odds-2026-w11-bkr-1117.json`). Lands in `data/pickem/odds/odds-2026-w12-<book>-1124.json`. Because the lines are early and stale, re-capture Wed afternoon and again Sat.
2. **Standings after W11**: Duma (SimplySportsware), Yahoo/Kenny's, CBS BUKBUK. These drive the strategy profile (market / weekly_leverage / su_flips). Owner: Andy screenshots or pastes (the Yahoo API is still blocked). Status: Duma and CBS stop at W10, Yahoo has a W11 file. Lands in `data/pickem/<pool>-2026-w11.json` + `pools-2026.json` standings.
3. **Grade W11 picks** (`node scripts/pickem-grade.mjs --week 11`). Closes W11 so the W12 standings and the rolling Duma 4-week window (W9–W12) are right. Owner: Claude. Status: not run.
4. **QB and key-starter status, all 16 games** (strict roster gate on every named player). Owner: Claude, from web + `data/player-availability/latest.json`. The GB@LAR inactives (~3:45 PM Wed: Jacobs, Kyren) are the big one. The early Thu designations come out Wed.
5. **Evidence leans file** `data/pickem/leans-2026-w12.json`: underdogs the evidence likes, tier 1–2 only. Sources: `reports/bets/2026-w12-matchup-splits.md` (all 16), the island deep-dives (GB@LAR and CHI@DET done; PHI@DAL, KC@BUF, DEN@PIT to do), and FTN Stats IQ 11/24. Owner: Claude.
6. **Expert consensus, W12**: Action Network expert picks (`scripts/capture-action-network-picks.mjs`) and any podcast/YouTube W12 picks from Antigravity. Owner: Claude/Antigravity. Status: none captured yet for W12.

**B. Nice to have (leverage)**
7. Public pick % (Yahoo and CBS show pick distribution). Feeds the Yahoo weekly-leverage fade and the CBS coin-flip picks. Owner: Andy screenshots once it's visible.
8. Line-movement check Wed PM vs the Tue open (sharp side on near-pick'em games).

**C. Before the Sunday final**
9. Fri injury reports and Sat inactives watch. 10. Weather for outdoor games (BUF Thu, PIT Fri, CLE, CIN, JAX, TB, SF; MIA open-air). 11. Odds re-capture Sat → re-run the card for unlocked games only, honouring the picks file.

## Build and place
- `node scripts/pickem-card.mjs --week 12 --odds-file data/pickem/odds/odds-2026-w12-<book>-1124.json` → `reports/pickem/2026-w12-pickem.md` + `data/pickem/plan-2026-w12.json`.
- Andy enters the picks. Claude records whatever is locked in `data/pickem/picks-2026-w12.json`, so later re-runs keep the locked slots.
- Pool rules in force: Duma = market expected points, nudges of 1 slot by hand; Yahoo = at most one heavy-favourite (≥65%) fade at a low slot plus contrarian picks on coin flips, tier 1–2 evidence only; CBS = favourites except coin flips (fav ≤57%) with tier 1–2 dog evidence.

## Known conflicts to resolve
- GB@LAR: LAR −3/44.5 vs −5.5/48.5, and the kickoff time (5:00 vs 5:15).
- CHI@DET: DET −2.5; total 52.5 vs 53.5.
