# Platinum Rose - 2026 Week 6 card, REVISED PROPOSAL (Sat 2026-10-17 ~5:15 PM PT)
Nothing here is placed, promoted or written to Supabase. Supersedes the 01:30 AM card (`2026-w06-card.md`, left untouched) as a proposal only. Rebuilt from the later per-game price checks (`reports/intel/games/2026-w06-astra-*.md`), A.J. Brown probable (Andy, 5 PM), and the 12:40 PM PT Bookmaker board. Official inactives (Sun) and Caleb Williams (Sun AM) can still change everything below.

## 1. Why the card shrank
The early card was built before the price checks. Re-priced against the 12:40 PM board, almost every early lean is at or below break-even once vig is counted. Season record also argues for fewer legs: 5+ leg parlays 0/58, dog spreads 13/35, 2-team round robins the only profitable structure.

| Early-card play | Price | Price-check result | Revised |
|---|---|---|---|
| NYJ +7 (dog RR) | -103 | 51.5% vs 50.7% needed, but that assumed Brown doubtful; Brown probable drops it to ~48.5% | WATCH: only at +7.5 -105 or better (52.8% vs 51.2%) |
| LAC +7.5 (dog RR) | -108 | no edge; fair line KC -8.0 | DROP (watch LAC +9.5) |
| TEN +7 (dog RR) | -115 | needs ~53.5%, models ~51% | DROP |
| ARI +13.5 (dog RR) | -117 | ~51.5% vs ~54% needed | DROP |
| DAL +1.5 (dog RR) | -109 | market = model within 0.1 pt | DROP (watch DAL +2.5/+3) |
| CAR -3 single | -114 | 50.0% at the board vs 53.3% needed; experts priced it before Hurts was out | DROP (watch CAR -2.5 or better) |
| GB -1.5 single | -107 | no edge | DROP |
| HOU Under 42 single | -112 | clears break-even by ~0.1 pt; gusts ~39-41 km/h | WATCH only |
| BUF Over 53.5 single | -109 | simulator 50.0% | DROP |

## 2. Plays that survive (all thin, all conditional)
| Game | Play | Book | Price | Model vs needed | Conditions |
|---|---|---|---|---|---|
| BUF@LV | LV +4.5 | BKR | -108 | 52.7% vs 51.9% | Already held via free-bet ticket 1005591415 (Raiders +4.5, $10); no new money. Void if Allen or Cousins is inactive. Gone at +3.5, marginal at +4 |
| PIT@TB | TB +3 or better | BKR | needs +3 (board +2.5 -109 is below the bar) | thin | Jalon Daniels must start; do not play at +2.5 |

That is the whole recommended side/total list. No new round robin, no sides/totals parlay.

## 3. Watch list: price triggers that would add a play Sunday
| Game | Trigger | Why |
|---|---|---|
| NYJ@NE | NYJ +7.5 at -105 or better | restores a ~1.6 pt edge; if Brown is OUT at inactives, NYJ +7 itself reverts to ~52.9% |
| LAC@KC | Under 42.5+ at -110, or LAC +9.5 | experts liked 42.5; board is 41.5 |
| BAL@CLE | CLE +3 near -100, or Under 40.5 at -105 | needs better juice only; Huntley discount already priced |
| CAR@PHI | CAR -2.5 or better; PHI +3.5 reopens the other side | Barkley status (unconfirmed) matters; active moves the margin toward PHI |
| DAL@GB | DAL +2.5/+3 | injury-driven; Love/Prescott inactives |
| TEN@IND | Under 44.5 at -108 or better, or IND -7.5 | ~+2% EV only at 44.5+ |
| HOU@JAX | Under 42.5 at -110 or better with gusts still >40 km/h | London kickoff 6:30 AM PT, check the forecast and inactives first |
| ARI@LAR | ARI +14 at -110 or better | needs ~2 pts above break-even |
| NO@NYG, WAS@SF | none | pass; WAS@SF Croskey-Merritt out voids the approved anytime-TD signal |

## 4. Held: CHI@ATL
No card until Caleb Williams is decided Sunday AM; then run its price check (same queue and board flow). Open: roof status; gusts ~37 km/h if open. ATL +3 SuperContest stays conditional.

## 5. Prop stacks (template items Andy wants carried every week; unmodeled)
No calibrated prop model exists; these are carried as template moonshots, $5 each, prices to be re-read before placing. Re-vet availability at inactives.
- 7e Anytime TD 7-leg: Taylor (IND), Stevenson (NE), Nacua (LAR), Watson (GB, SNF), Bowers (LV), Kelce and Worthy (KC). Early-card price ~+14,929 independent; a Brown-active NE offense and Rice out for KC unchanged. Low-total lens: keep to the 1-2 TD-leg cap spirit by treating this as a moonshot, not a core play.
- 8a First TD 3-leg: Stevenson, Nacua, Watson. 8b 2+ TD 3-leg: Taylor, Nacua, Stevenson (soft overlap with 7e/8a, flagged).
- Isaiah Likely and Najee Harris: human check required; Bookmaker has no Likely TD market, DK Predictions 35% is a non-executable reference.
- Island ladder (DAL@GB SNF): built Sunday after the 10:30/11:15 AM PT availability refreshes.

## 6. SuperContest (contest lines, not sportsbook prices)
| Pick | Contest line vs market | Note |
|---|---|---|
| CAR +1.5 | market CAR -3 (4.5 pts of room) | strongest; Barkley and Hurts news only improves or holds it |
| CLE +5.5 | market CLE +3 (2.5 pts) | Lamar reported out/unlikely, unconfirmed |
| JAX -2.5 | equal to market | model JAX 56.2% cover; 2.3 pts projected room |
| ATL +3 | market CHI -1 (2 pts) | CONDITIONAL on Williams; swap if he is out |
| GB -1.5 | equal to market | thinnest (0.1 pt room); first swap |
Swap candidates: NYG +1.5 (2.5 pts of line value; Winston, OL questionable; price check calls the game a pick'em), SF -7.5 (half point better than -8; thin). Stake template: ~$15 five-team parlay plus $10 two-team round robin at Bookmaker. Save the final joint five to `data/supercontest/locked-card-week-6.json`.

## 7. Futures (unchanged from the early card)
Optional GB SB add $10 at best live price (BEO +6600 needs live verification; BKR +4847). No BUF SB add. Exactas monitor-only. BAL SB waits on Lamar.

## 8. Sunday revision checklist
1. Williams decision, then roster fetch and `npm run roster:vet -- --week 6 --date 2026-10-17 --strict`; run CHI@ATL price check.
2. Inactives: Brown, Henderson/Campbell (NE), Allen/Cousins (BUF@LV), Daniels (TB), Barkley/McKee/Smith (PHI), Huntley (BAL), Croskey-Merritt/Bosa/Evans (Monday).
3. Re-read BKR/BEO lines against the Section 3 triggers; rerun a game's simulator only if its lean depends on a changed fact.
4. Roof and kickoff weather for IND, ATL, London.
