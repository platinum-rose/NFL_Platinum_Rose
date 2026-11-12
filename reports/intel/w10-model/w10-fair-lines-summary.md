# Week 10 analytics-first fair lines and simulations (Tue 11/10, DK Tuesday open)

Research context, not picks. Built by `reports/intel/w10-model/fair_lines_w10.py` (W9 method; template `w09-model/fair_lines_w09.py`).

Model margin = 0.40 SRS (Weeks 1-9, computed from team-weeks.csv, margin cap 24) + 0.40 FTN DVOA (in points) + 0.20 net yards/play (in points) + HFA 1.5 + QB/injury adjustments.
DVOA -> points: 0.305 per DVOA pct (r = 0.915); ypp: 6.293 per yard (r = 0.762).
Fair line = market + 50% toward the model. Market: public/schedule.json DK snapshot (odds_fetched_at 2026-11-10T18:00:00+00:00). FTN: `data/research-intel/source-evidence/2026-11-11-pm-ftn-stats-iq` (captured 11/10 6:21-6:25 PM PT, stats through W9 except MNF BUF@MIN: BUF and MIN are one game short).
SuperContest: not captured yet. Podcasts: data/podcasts/youtube-extracted-picks-2026-w10.json. Kalshi: data/prediction-markets/latest.json (pulled 11/06; pre-news, reference only).

## QB and injury adjustments (points to team strength vs its season numbers)

The handoff asked for MIN Wentz / BAL Fagnano / NYG McCarthy / ARI Minshew / CLE Sanders. Tuesday news changed four of the five, so each adjustment is sized to the **expected starter**, and the handoff QB is kept as a scenario where it is still live.

- **MIN -0.5**: QB TBD (Wed 11/11: O'Connell not committing to Cousins; Wentz now has an ankle injury; Murray expected out): Kirk Cousins acquired from LV Tue 11/10 (3rd-rd pick), expected to start if ready on a short week; Wentz benched for Brosmer in W9 MNF (8/25, 81y, 2 INT); Murray DOUBTFUL (Grade 2 hamstring). Season numbers: Murray -0.18 x5, Wentz -0.26 x3. Cousins at LV -0.02 x9. Wentz/Brosmer scenario below
- **BAL -0.5**: Jacoby Brissett (acquired from ARI 11/04) expected to start MNF per Minter, NOT Fagnano. Brissett -0.03 x8 at ARI is close to BAL season blend (Jackson +0.12 x4, Huntley -0.07 x3, Fagnano -0.38 x2); -0.5 for a 12-day install. Fagnano scenario below
- **NYG +0.5**: J.J. McCarthy (hip, Q; full practice Tue) +0.04 x2 vs Winston-heavy season numbers (-0.18 x5); offset by his 13% sack rate. Dart IR
- **ARI -2**: Rookie Carson Beck expected to start (ESPN/Weinfuss); Minshew to IR (elbow) Tue; Brissett traded. Season numbers are Brissett (-0.03 x8)
- **CLE +0**: Deshaun Watson named the W10 starter (ESPN/Fowler 11/09, CBS official 11/11; cleared concussion protocol 11/07). Season numbers are his 8 starts (-0.06), so no adjustment. Was -1.0 for Sanders on 11/10
- **SEA -0.5**: Drew Lock (+0.02 x3; oblique, Q, expected to play) for Sam Darnold (OUT). W9 used -2.5, which was too big: Lock has not been a downgrade
- **LV -1.5**: Rookie Fernando Mendoza starts after Kirk Cousins (-0.02 x9) was traded to MIN Tue
- **MIA -1.5**: Kyle McCord starts; Malik Willis (-0.08 x8) to IR (core) Tue
- **LAR -1**: Puka Nacua DOUBTFUL (ESPN 11/10; FantasyPros lists IR, conflict) and Davante Adams IR
- **GB -0.5**: Josh Jacobs OUT; Jayden Reed IR
- **NE -0.5**: Rhamondre Stevenson DOUBTFUL; A.J. Brown and TreVeyon Henderson Q
- **SF -0.3**: Brandon Aiyuk out (roster exemption); Mike Evans and Deebo Samuel Q

**Scenarios (alternate fair lines; main table unchanged):**

- MIN: Wentz/Brosmer start (Cousins not ready) (-2)
- BAL: Fagnano starts instead of Brissett (-3.5)
- KC: Mahomes OUT (unlikely: elbow, practicing in full Wed per Reid) (-6)
- SEA: Lock out (oblique) (-1.5)
- NYG: McCarthy out (unlikely: hip, full practice Tue): Winston (-1)
- CLE: Shedeur Sanders starts instead (Watson setback) (-1)
- LAC: Herbert out (finger, Q; Harbaugh: should be good to go) (-2.5)

## Games (home line; edge > 0 favors home)

| Game | DK | Model | Fair | Edge | Sim home cover | BEO 1:10 PM (fair, edge) | Intel EPA model (no QB) | Fair total (mkt) | Sim over | Kalshi home 11/06 (pre-news) | Scenario fair lines |
|---|---|---|---|---|---|---|---|---|---|---|---|
| WAS@NYG | -2.5 | -2 | -2.3 | -0.2 | 49.4% | -2.5 / 41 (-2.3, -0.2) | -0.9 | 43.5 (41.5) | 56.0% | 57% | NYG McCarthy out: -1.5 |
| NE@DET | -2.5 | -1.3 | -1.9 | -0.6 | 48.5% | -3 / 51 (-2.2, -0.8) | -0.8 | 50.1 (51.5) | 45.6% | 58% | — |
| KC@ATL | +3.5 | +6 | +4.7 | -1.2 | 46.7% | +3 / 45 (+4.5, -1.5) | +3.9 | 44.9 (45.5) | 48.3% | 38% | KC Mahomes OUT: +1.7 |
| HOU@CLE | +4.5 | +4.4 | +4.5 | +0 | 50.1% | +5 / 40 (+4.7, +0.3) | +3.9 | 42.2 (39.5) | 58.1% | 34% | CLE Shedeur Sanders starts instead: +5 |
| MIN@GB | -5.5 | -3.9 | -4.7 | -0.8 | 47.9% | -3.5 / 42 (-3.7, +0.2) | -2.2 | 39.4 (40.5) | 46.8% | 61% | MIN Wentz/Brosmer start: -5.5 |
| JAX@TEN | +10.5 | +15.7 | +13.1 | -2.6 | 42.5% | +10.5 / 46.5 (+13.1, -2.6) | +13.5 | 44.9 (46.5) | 45.2% | 16% | — |
| MIA@IND | -2.5 | -2.3 | -2.4 | -0.1 | 49.8% | -3.5 / 38 (-2.9, -0.6) | -0.4 | 42.0 (40.5) | 54.6% | 66% | — |
| CAR@NO | -1.5 | +3.6 | +1.1 | -2.6 | 43.3% | +0 / 49 (+1.8, -1.8) | +3.4 | 49.8 (48.5) | 54.1% | 56% | — |
| BUF@NYJ | +8.5 | +8.7 | +8.6 | -0.1 | 49.6% | +8 / 51 (+8.4, -0.4) | +9.4 | 50.3 (50.5) | 49.5% | 20% | — |
| SEA@LV | +3.5 | +8.3 | +5.9 | -2.4 | 43.6% | +6.5 / 40.5 (+7.4, -0.9) | +5.2 | 45.3 (43.5) | 55.5% | 28% | SEA Lock out: +5.4 |
| LAR@ARI | +9.5 | +10.2 | +9.8 | -0.3 | 49.0% | +10 / 38.5 (+10.1, -0.1) | +5.1 | 42.4 (40.5) | 55.6% | 21% | — |
| SF@DAL | +4.5 | +8.9 | +6.7 | -2.2 | 44.0% | +4 / 55.5 (+6.5, -2.5) | +6.1 | 53.3 (55.5) | 43.3% | 35% | — |
| PIT@CIN | -3.5 | -4.1 | -3.8 | +0.3 | 50.9% | -3.5 / 49.5 (-3.8, +0.3) | -3 | 47.3 (48.5) | 46.5% | 64% | — |
| LAC@BAL | -5.5 | -8.7 | -7.1 | +1.6 | 54.3% | -5 / 38.5 (-6.8, +1.8) | -2.5 | 41.5 (38.5) | 59.1% | 66% | BAL Fagnano starts instead of Brissett: -5.6; LAC Herbert out: -8.3 |

## The market already moved on the deadline news (BEO 1:10 PM PT vs DK Tuesday open)

- **SEA@LV**: LV +3.5 -> **+6.5** (total 43.5 -> 40.5) after Mendoza was named. Model line LV +8.3, so about 1 point of SEA lean is left at BEO.
- **MIN@GB**: GB -5.5 -> **-3.5** (total 42) on the Cousins trade. Model GB -3.2: with W9 DVOA the MIN lean is gone at BEO.
- **MIA@IND**: IND -2.5 -> **-3.5**, total 40.5 -> **38** with McCord. **LAR@ARI** total 40.5 -> 38.5 (Beck). **CAR@NO** NO -1.5 -> pick.
- Model lines do not depend on the market, so where BEO moved toward the model the edge shrank; see the BEO column. Main table = DK Tuesday open, as the handoff specified.

## Biggest side gaps at BEO 1:10 PM (fair vs current price)

- **JAX@TEN**: fair TEN +13.1 vs BEO +10.5 -> leans **JAX** by 2.6 (sim 57.5%). Intel EPA model TEN +13.5: agrees.
- **SF@DAL**: fair DAL +6.5 vs BEO +4 -> leans **SF** by 2.5 (sim 56.8%). Intel EPA model DAL +6.1: agrees.
- **CAR@NO**: fair NO +1.8 vs BEO +0 -> leans **CAR** by 1.8 (sim 54.8%). Intel EPA model NO +3.4: agrees.
- **LAC@BAL**: fair BAL -6.8 vs BEO -5 -> leans **BAL** by 1.8 (sim 55.1%). Intel EPA model BAL -2.5: DISAGREES.
- **KC@ATL**: fair ATL +4.5 vs BEO +3 -> leans **KC** by 1.5 (sim 54.2%). Intel EPA model ATL +3.9: agrees.
- **SEA@LV**: fair LV +7.4 vs BEO +6.5 -> leans **SEA** by 0.9 (sim 52.4%). Intel EPA model LV +5.2: DISAGREES.

## Caveats

- **Totals are the weak part.** The base total is a PF/PA blend that only takes 60% of a downgrade off the team's own points. It does not know BAL scored 29/g with Jackson and 10/g with Fagnano, or that LV/ARI/MIA start new QBs. Treat Overs on LAC@BAL, LAR@ARI, HOU@CLE, SEA@LV and MIA@IND as **not trustworthy** until the QB is confirmed; W9 total bias was -1.4 and five games finished under 35.
- **LAC@BAL is the biggest disagreement.** This model (full-season SRS) has BAL -7.1 fair; the EPA intel model (last 4 weighted 1.5x) has BAL -2.5. BAL is -17.1 over the last 4 with Huntley/Fagnano. Brissett is the swing: neither model has seen him in a BAL uniform.
- **MIN@GB:** at DK +5.5 the fair line leans MIN, but BEO is already +3.5 and fair there is GB -3.3; with Wentz/Brosmer it moves about 1.5 further toward GB. Wait for the MIN starter before using it.
- **KC@ATL:** Mahomes (elbow) is practicing in full (Reid, Wed). The no-Mahomes scenario is kept only for reference.
- **HOU@CLE (Wed update):** Deshaun Watson starts, not Sanders. The -1.0 CLE QB downgrade is removed; the HOU pass rush vs CLE protection lead still applies (Watson was sacked at a 10.4% rate in his 8 starts).
- Kalshi is the 11/06 pull, before the deadline trades. It is a stale reference only.
- FTN DVOA is the 11/10 capture: BUF and MIN are missing the W9 MNF game; recapture once FTN adds it.
- SuperContest and podcast votes are empty until Andy's captures land; re-run the script then.
