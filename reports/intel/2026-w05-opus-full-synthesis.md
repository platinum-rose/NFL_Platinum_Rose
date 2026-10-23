# Week 5 — Opus full-slate synthesis (14 remaining games)

Proposed analysis only; not a wager, ticket, pool entry or official record. Generated 2026-10-10T23:20Z (2026-10-10 16:20 PT). Market baseline: BKR capture 2026-10-10T22:25–22:27Z. **Every price-specific row becomes stale_for_recommendation at its kickoff window unless the delta checklist below is run.** Evidence manifest: reports/intel/2026-w05-opus-evidence-manifest.md.

## Methodology

| Element | Specification |
|---|---|
| Market component (60%) | BKR captured home line and total (newest structurally valid capture per game). BEO shown for agreement only; DKP is context only. |
| FTN component (25%) | team pts = LG PT/GM + PLY/GM_off x [(off EPA/PLY - lg) + (opp def EPA/PLY allowed - lg)] +/- HFA/2; league means EPA/PLY off 0.0057, def 0.0046, PT/GM 22.369. Fields: team-offense/efficiency EPA/PLY; team-defense/efficiency EPA/PLY; team-offense/tempo PLY/GM; team-offense/overview PT/GM (league mean) |
| SRS component (15%) | home margin = SRS_home - SRS_away + HFA; HFA 1.609 = pinned CSV REG 2018-2025 location==Home mean result (n=2090); PHI@JAX (Tottenham Hotspur Stadium) neutral. Totals: SRS carries no total information, so totals blend 75% market / 25% FTN. |
| Not numeric | Availability (gate/context), secondary-matchup file, coaching snapshot, weather, splits, expert/article/podcast evidence. |
| Score error | Pinned calibration default era 2018-2025 (n 2127): margin SD 12.772, total SD 13.128. Integer margin pmf = discretised normal with key-number weights w3 3.6871, w7 1.9486, w0 0.1806, solved to reproduce the artifact's on-the-number push rates (3: 9.73%, 7: 5.22%) and tie rate (0.47%). Location: location = L(market margin) + (projected margin - market margin), where L(m) is the pmf location whose tie-split median equals m (market line = 50/50 point; model deviation shifts continuously). Margin and total residuals independent. |
| Simulation | 100,000 draws per game; seed 20261010; numpy PCG64; run 2026-10-10T22:55:19Z; output SHA-256 e9a1ddff6e59e1627f0e5338d0c831ec66f3d2273691c0429f0a091ff5efd32c (payload excl. this field). Code: scratchpad/w5/sim.py (Opus session scratch; not written to repo). |
| Rejected runs | 2026-10-10T22:54:35Z sha 1c0b49360e0a…: median mapping of a fractional projection made cover probability a step function of the projection (any x in (k,k+1) identical); outputs discarded; 2026-10-10T22:53:53Z sha 71c92f5ae13a…: key-number weights applied at raw location shifted the median: market-only baseline gave 43.0% fav cover at -7.5 and 44.7% at -3.5 instead of 50%; methodology defect, outputs discarded |
| Sanity check (fav win % by closing-spread bucket, market-only means) | 0-1: model 50.7 vs artifact 45.1; 1.5-3: model 56.0 vs artifact 57.5; 3.5-6: model 67.5 vs artifact 64.3; 6.5-9: model 75.1 vs artifact 73.8; 10+: model 83.2 vs artifact 86.6 |
| Tier rules | Tier 1 (own sim + FTN/SRS only): blended P(win / no push) >= break-even(captured BKR price) + 3.0pp AND same side still >= break-even at market weight 0.8 (sensitivity) AND sides: FTN margin AND SRS margin both deviate from the market in the pick direction; totals: FTN total deviates in the pick direction AND no structural starting-QB staleness for either team (CHI, BAL, WAS) AND BKR capture < 6h old at analysis time; must be re-captured per delta checklist before any use. Tier 2: a rule-2 qualified named-expert pick at a still-valid number (<1 pt move, no key-number cross) AND blended P(that side / no push) >= 0.50. Conflicted: structural QB staleness, or a qualified expert pick opposing a sim lean that otherwise meets Tier-1 thresholds (a)-(b). Probabilities are comparison signals from an unbacktested blend; they are not edges. |
| Calibration limits | No backtest of the 60/25/15 blend is possible (matching historical FTN/power inputs absent); earlier Week 5 captures are not closing lines; the artifact supports residual dispersion and key-number handling only. |

## Audit of prior quantitative pass (2026-w05-quantitative-synthesis.json, 16:59Z)

The prior pass stores the favourite spread in its `home_spread` field. For the six away-favourite games the market anchor is therefore sign-flipped: CIN@MIA is stored as MIA −7 when BKR has MIA +7, and the same happens for MIN@NO, HOU@TEN, DEN@LAC, DET@ARI and CHI@GB. Its top-ranked sides (MIA 61.9%, GB 60.1%, NO 59.6%, TEN 59.3%, LAC 58.9%) are products of that inversion. It also uses an assumed normal score distribution rather than the calibration artifact, a superseded 16:16Z anchor, and produces "Over" on 14/14 totals. It is rejected and nothing from it is carried forward. The expanded decision-support menus (16:50Z) are broad menus only and are not used.


## Model vs market summary

| Game | BKR home line / total | Mkt home margin | FTN home margin / total | SRS home margin | Blend home margin / total | Mean score (away–home) | Home cover | Away cover | Push | Over | Under | Home win | Sensitivity mkt-wt: home cover/over | Label |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PHI@JAX | -7.5 / 42 | +7.5 | +21.2 / 47.0 | +21.1 | +12.97 / 43.2 | 15.1–28.1 | 66.3% | 33.7% | 0.0% | 52.6% | 44.4% | 86.6% | 1.0:0.500/0.485, 0.8:0.583/0.504, 0.6:0.663/0.523, 0.4:0.738/0.542 | quantitative candidate |
| CHI@GB | +1.5 / 46 | -1.5 | -15.7 / 43.4 | -17.9 | -7.50 / 45.3 | 26.4–18.9 | 33.5% | 66.5% | 0.0% | 46.5% | 50.5% | 30.6% | 1.0:0.500/0.485, 0.8:0.415/0.475, 0.6:0.334/0.465, 0.4:0.259/0.455 | conflicted |
| HOU@TEN | +7 / 37.5 | -7 | -2.3 / 42.1 | -2.6 | -5.15 / 38.6 | 21.9–16.8 | 52.8% | 41.9% | 5.3% | 53.6% | 46.4% | 30.4% | 1.0:0.474/0.501, 0.8:0.501/0.518, 0.6:0.528/0.536, 0.4:0.555/0.553 | pass |
| CIN@MIA | +7 / 43.5 | -7 | -14.2 / 40.8 | -6.3 | -8.69 / 42.8 | 25.8–17.1 | 42.6% | 52.2% | 5.2% | 47.9% | 52.1% | 21.9% | 1.0:0.474/0.500, 0.8:0.449/0.490, 0.6:0.424/0.479, 0.4:0.399/0.469 | pass |
| LV@NE | -3.5 / 45 | +3.5 | -5.0 / 33.7 | -2.2 | +0.52 / 42.2 | 20.8–21.4 | 41.6% | 58.4% | 0.0% | 40.0% | 57.1% | 56.5% | 1.0:0.500/0.485, 0.8:0.457/0.442, 0.6:0.416/0.401, 0.4:0.375/0.360 | quantitative candidate |
| MIN@NO | +2.5 / 41.5 | -2.5 | -13.4 / 30.2 | -12.0 | -6.66 / 38.7 | 22.7–16.0 | 38.3% | 61.7% | 0.0% | 41.8% | 58.2% | 32.8% | 1.0:0.500/0.500, 0.8:0.441/0.458, 0.6:0.384/0.416, 0.4:0.328/0.375 | quantitative candidate |
| CLE@NYJ | -2.5 / 39.5 | +2.5 | +5.1 / 42.7 | -3.2 | +2.31 / 40.3 | 19.0–21.3 | 49.5% | 50.5% | 0.0% | 52.5% | 47.5% | 54.8% | 1.0:0.500/0.501, 0.8:0.497/0.513, 0.6:0.494/0.525, 0.4:0.492/0.537 | pass |
| IND@PIT | -3 / 43.5 | +3 | +2.3 / 35.6 | +3.2 | +2.85 / 41.5 | 19.3–22.2 | 44.8% | 45.3% | 9.9% | 44.1% | 55.9% | 59.9% | 1.0:0.451/0.500, 0.8:0.449/0.470, 0.6:0.447/0.441, 0.4:0.445/0.411 | quantitative candidate |
| NYG@WAS | -3.5 / 41.5 | +3.5 | -0.3 / 38.3 | -5.6 | +1.18 / 40.7 | 19.8–20.9 | 43.3% | 56.7% | 0.0% | 47.2% | 52.8% | 58.2% | 1.0:0.500/0.500, 0.8:0.467/0.488, 0.6:0.434/0.476, 0.4:0.402/0.464 | conflicted |
| DEN@LAC | +3.5 / 42 | -3.5 | -1.3 / 32.8 | -13.6 | -4.47 / 39.7 | 22.1–17.6 | 47.2% | 52.8% | 0.0% | 41.6% | 55.4% | 32.3% | 1.0:0.500/0.485, 0.8:0.486/0.450, 0.6:0.472/0.416, 0.4:0.458/0.383 | quantitative candidate |
| DET@ARI | +5.5 / 54.5 | -5.5 | -3.8 / 64.2 | -2.1 | -4.57 / 56.9 | 30.8–26.2 | 52.6% | 47.4% | 0.0% | 57.4% | 42.6% | 32.3% | 1.0:0.500/0.500, 0.8:0.514/0.537, 0.6:0.527/0.574, 0.4:0.541/0.610 | quantitative candidate |
| SF@SEA | -3 / 46.5 | +3 | -5.3 / 52.1 | -10.7 | -1.15 / 47.9 | 24.5–23.4 | 33.7% | 56.8% | 9.5% | 54.4% | 45.6% | 48.4% | 1.0:0.451/0.500, 0.8:0.394/0.521, 0.6:0.339/0.543, 0.4:0.287/0.564 | quantitative candidate |
| BAL@ATL | -3 / 44 | +3 | -3.5 / 49.9 | +2.7 | +1.32 / 45.5 | 22.1–23.4 | 40.2% | 50.0% | 9.8% | 52.9% | 44.0% | 55.2% | 1.0:0.451/0.485, 0.8:0.428/0.507, 0.6:0.405/0.529, 0.4:0.382/0.551 | conflicted |
| BUF@LAR | -3.5 / 54.5 | +3.5 | +6.6 / 53.3 | +3.7 | +4.29 / 54.2 | 24.9–29.2 | 52.0% | 48.0% | 0.0% | 49.1% | 50.8% | 66.6% | 1.0:0.500/0.500, 0.8:0.511/0.495, 0.6:0.523/0.491, 0.4:0.534/0.486 | pass |

Home margin is positive when the home team wins. Probabilities are Monte Carlo frequencies from the single accepted run; market-only is 50/50 at half-point lines by construction.


---

## PHI@JAX — quantitative candidate

Kickoff 2026-10-11T13:30Z · Tottenham Hotspur Stadium · ESPN 401872981

### 1–2. Market baseline and implied score

| Book | Spread (home line) | Total | Moneyline (away/home) | Captured |
|---|---|---|---|---|
| BKR (baseline) | JAX -7.5 (-113) / PHI +7.5 (-103) | 42 (O -103 / U -113) | +295 / -353 (no-vig home 75.5%) | 2026-10-10T22:25:28Z |
| BEO | JAX -7.5 (-115) / PHI (-105) | 42 | +299 / -375 | 2026-10-10T21:15:15Z |
| AN open (context) | JAX -3.5 | 43.5 | — | 2026-10-05T00:14:25Z |
| SuperContest (contest) | JAX -7.5 | — | — | user-verified 2026-10-09; no capture time |

Market-implied score: JAX 24.75 – PHI 17.25 (BKR).

### 3. FTN team analytics (season-to-date, Weeks 1–4)

| FTN table — field | PHI (rank) | JAX (rank) |
|---|---|---|
| team-offense/efficiency — EPA/PLY | -0.107 (27) | 0.173 (2) |
| team-offense/efficiency — SUCC% | 37.0 (30) | 48.2 (5) |
| team-offense/passing-analytics — EPA/DB | -0.096 (25) | 0.271 (3) |
| team-offense/rushing-analytics — EPA/ATT | -0.122 (18) | 0.072 (4) |
| team-offense/pass-protection — PRESS% | 37.7 (29) | 28.7 (18) |
| team-offense/pass-protection — SK% | 8.7 (30) | 7.0 (23) |
| team-offense/tempo — PLY/GM | 57.5 (25) | 56.5 (30) |
| team-offense/tendencies — DPBK% | 60.0 (18) | 50.9 (30) |
| team-offense/overview — PT/GM | 18.8 (24) | 26.0 (11) |
| team-defense/efficiency — EPA/PLY | 0.045 (22) | -0.048 (8) |
| team-defense/passing-analytics — EPA/DB | 0.096 (21) | 0.017 (11) |
| team-defense/rush-analytics — EPA/ATT | -0.024 (25) | -0.17 (7) |
| team-defense/pass-rush — PRESS% | 28.3 (19) | 29.7 (16) |
| team-defense/pass-rush — SK% | 2.6 (30) | 5.8 (18) |
| team-defense/pass-rush — BLZ% | 19.7 (31) | 25.8 (22) |
| team-defense/overview — PT/GM | 23.3 (18) | 13.3 (1) |

Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, captured 2026-10-09T21:53:39Z. Ranks 1 = best (defensive EPA and offensive pressure/sack/turnover allowed ranked low-is-good).

### 4. Power ratings

| Team | Record | SRS | Net pts/g | Pythag | Model rank |
|---|---|---|---|---|---|
| PHI | 2-2 | -6.319 | -4.5 | 0.3752 | 25 |
| JAX | 3-1 | 14.746 | 12.75 | 0.8317 | 2 |

Source: data/generated/team-profiles/team-power-ratings-2026.json (generated 2026-10-10T07:06:04Z; 2026 season-to-date; provenance note inconsistency G17).

### 5. Availability and role

- **PHI** QB: Same starting QB all 4 weeks per nflverse weekly (attempts>=10)
- **JAX** QB: Same starting QB all 4 weeks per nflverse weekly (attempts>=10)

### 6. Weather / venue

- [Source: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json, Open-Meteo forecast PHI@JAX sampled 2026-10-11T13:00:00Z: 57.9°F, wind 10.4 km/h gusts 22.7 km/h dir 244°, precip prob 0% / 0 mm (forecast, not observation), captured 2026-10-10T17:56:55Z]

### 7. Secondary-matchup context (manual, capped, qualitative)

- PHI offense vs JAX defense (man_heavy, blitz_heavy, single_high; aggressive): absences Christian Braswell ir (availability re-check: absence confirmed OUT/IR/PUP); Caleb Ransaw ir (availability re-check: absence confirmed OUT/IR/PUP); Eric Murray doubtful (availability re-check: absence confirmed OUT/IR/PUP); Jaylon Jones out (availability re-check: absence confirmed OUT/IR/PUP); Travis Hunter (CB) out (availability re-check: name not on roster — unverified); listed targets Dontayvion Wicks, Dallas Goedert, Makai Lemon.
- JAX offense vs PHI defense (match_zone, two_high, quarters; front_dependent): absences Andre' Sam ir (availability re-check: absence confirmed OUT/IR/PUP); Tucker Large ir (availability re-check: absence confirmed OUT/IR/PUP); Marcus Epps out (availability re-check: absence confirmed OUT/IR/PUP); listed targets Jakobi Meyers, Brenton Strange, Brian Thomas Jr..

### 8. Simulation

| Quantity | Blend (60/25/15) | Market-only |
|---|---|---|
| Home margin / total mean | +12.97 / 43.24 | +7.5 / 42 |
| JAX cover -7.5 | 66.3% | 50.0% |
| PHI cover +7.5 | 33.7% | 50.0% |
| Spread push | 0.0% | 0.0% |
| Over 42 | 52.6% | 48.5% |
| Under 42 | 44.4% | 48.4% |
| JAX win | 86.6% | 75.9% |

100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z. Calibration caveat: dispersion and key numbers from the pinned 2018–2025 artifact; blend weights unbacktested.

### 9. Expert / article / podcast / split evidence

- Qualified named-expert picks: none for this game.
- research_only tags (cannot set a tier): expert_feed:prop 5, expert_feed:moneyline 1, expert_feed:spread 3, expert_feed:teaser 1, podcast:prop 4, podcast:spread 4, podcast:teaser 2, article:prop 2, article:spread 3, article:moneyline 2; most frequent side/total tags: Jacksonville Jaguars ×4, spread FAVORITE -4.5 ×2, Eagles +7.5 | Eagles +7.5 ×2, spread JAX -7 ×1, spread JAX -6.5 ×1, Eagles +8 | Eagles +8 ×1.
- Splits (context): [Source: data/generated/master-intel/w05-pull.json#splits[1], Action Network splits PHI@JAX: spread JAX 57% bets/50% money, over 41%/34%, ML JAX 72%/50% (context only), captured 2026-10-10T17:55:26Z]

### 10. Disposition

| Market | Captured price | P(win|no push) | Break-even | Margin (pp) | At mkt wt 0.8 (pp) | FTN dev | SRS dev | Checks a/b/c/d | Label |
|---|---|---|---|---|---|---|---|---|---|
| JAX -7.5 | -113 BKR | 66.3% | 53.0% | 13.3 | 5.2 | 13.74 | 13.57 | ✓/✓/✓/✓ | quantitative candidate |
| PHI +7.5 | -103 BKR | 33.7% | 50.7% | -17.1 | -9.0 | -13.74 | -13.57 | ✗/✗/✗/✓ | pass |
| Over 42 | -103 BKR | 54.2% | 50.7% | 3.5 | 1.2 | 4.97 | — | ✓/✓/✓/✓ | quantitative candidate |
| Under 42 | -113 BKR | 45.8% | 53.0% | -7.3 | -5.0 | -4.97 | — | ✗/✗/✗/✓ | pass |

Invalidators: [line] BKR JAX spread reaches -8.5 or worse; [availability] any JAX starting skill player or OL starter ruled out; [availability] Jalen Hurts limited/inactive; [weather] London forecast gusts > 40 km/h or heavy rain; [evidence] FTN 4-game sample is the main driver; a re-run with opponent-adjusted inputs changes direction.


### Game state and thesis

**Game script.** The central projection is a slow, Jacksonville-controlled game in London. Bookmaker hangs JAX -7.5 (-113) with a 42 total, implying roughly JAX 24.75–PHI 17.25 [Source: data/generated/props/bookmaker-live-2026-10-10-week5.json, BKR PHI@JAX JAX -7.5 (home JAX -7.5 -113 / away PHI +7.5 -103), total 42 (O -103/U -113), ML PHI +295/JAX -353, captured 2026-10-10T22:25:28Z]. Jacksonville is one of the slowest, most run-leaning offenses in the league by snap pace and dropback rate [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/tempo — SEC/PLY JAX = 31.1 (rank 32/32), captured 2026-10-09T21:53:39Z] [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/tendencies — DPBK% JAX = 50.9 (rank 30/32), captured 2026-10-09T21:53:39Z], so possessions should be scarce. The alternative is a late PHI backdoor inside a low total.

**Away team (PHI).** The Eagles' offense ranks near the bottom in success rate [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — SUCC% PHI = 37.0 (rank 30/32), captured 2026-10-09T21:53:39Z] and in pressure allowed [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/pass-protection — PRESS% PHI = 37.7 (rank 29/32), captured 2026-10-09T21:53:39Z], and that sample includes players who are now out: Saquon Barkley [Source: data/player-availability/latest.json#events[210], Saquon Barkley (PHI) OUT: "Saquon Barkley OUT", published 2026-10-10T18:50Z, captured 2026-10-10T16:45:17Z], DeVonta Smith [Source: data/player-availability/latest.json#events[211], DeVonta Smith (PHI) OUT: "DeVonta Smith OUT", published 2026-10-10T18:49Z, captured 2026-10-10T16:45:17Z] and center Drew Kendall [Source: data/player-availability/latest.json#events[414], Drew Kendall (PHI) OUT: "Kendall (knee) has been ruled out ahead of Sunday's game against the Jaguars.", published 2026-10-10T02:24Z, captured 2026-10-10T16:45:17Z]. Jonathan Greenard is questionable after an earlier OUT row, a feed conflict [Source: data/player-availability/latest.json#events[450], Jonathan Greenard (PHI) QUESTIONABLE: "Greenard (ankle) is questionable for Sunday's game against Jacksonville.", published 2026-10-10T01:11Z, captured 2026-10-10T16:45:17Z].

**Home team (JAX).** Jacksonville's offense is second in EPA/play [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — EPA/PLY JAX = 0.173 (rank 2/32), captured 2026-10-09T21:53:39Z] and its defense allows the fewest points per game [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-defense/overview — PT/GM JAX = 13.3 (rank 1/32), captured 2026-10-09T21:53:39Z]. The season power rating agrees [Source: data/generated/team-profiles/team-power-ratings-2026.json, JAX SRS 14.746, net pts/g 12.75, pythag 0.8317, record 3-1, generated 2026-10-10T07:06:04Z] against Philadelphia's [Source: data/generated/team-profiles/team-power-ratings-2026.json, PHI SRS -6.319, net pts/g -4.5, pythag 0.3752, record 2-2, generated 2026-10-10T07:06:04Z]. The venue is Tottenham Hotspur Stadium, so the model's FTN and SRS components get no home-field adjustment.

**Matchup mechanics.** JAX's efficient passing [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/passing-analytics — EPA/DB JAX = 0.271 (rank 3/32), captured 2026-10-09T21:53:39Z] meets a PHI pass rush that rarely gets home [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-defense/pass-rush — SK% PHI = 2.6 (rank 30/32), captured 2026-10-09T21:53:39Z]. JAX's secondary is thin (Braswell, Ransaw, Jaylon Jones listed out) [Source: data/secondary-matchups/secondary-matchup-vulnerability-2026-w05.json#matchups[2], JAX defense vs PHI: scheme man_heavy,blitz_heavy,single_high; absences Christian Braswell ir; Caleb Ransaw ir; Eric Murray doubtful; Jaylon Jones out; Travis Hunter (CB) out (manual context, capped/qualitative; absences re-validated against data/player-availability/latest.json), generated 2026-10-10T17:31:50Z], which is the most realistic path to a PHI cover. Weather is not material: 57.9°F with light wind [Source: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json, Open-Meteo forecast PHI@JAX sampled 2026-10-11T13:00:00Z: 57.9°F, wind 10.4 km/h gusts 22.7 km/h dir 244°, precip prob 0% / 0 mm (forecast, not observation), captured 2026-10-10T17:56:55Z].

**Market comparison.** The line opened at JAX -3.5 / 43.5 [Source: data/odds/actionnetwork-openers-2026-w05.json, Action Network 'Open' book PHI@JAX home line -3.5, total 43.5, recorded 2026-10-05T00:14:25Z; opener context only, pulled 2026-10-08T03:36:16Z] and has moved four points through both 3 and 7 on the injury news, so any source pick quoted at -7 or shorter is a different bet. The blend projects JAX by about 13, with JAX -7.5 covering in 66% of draws and 58% at an 80% market weight [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[PHI@JAX].simulation, blend home margin +12.97 / total 43.24; MC home cover 0.663, away cover 0.337, push 0.000, over 0.526, under 0.444; 100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z].

**Thesis / counter-thesis.** [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[PHI@JAX].dispositions, JAX -7.5 -113 BKR: P(win|no push) 66.3% vs break-even 53.0%, mkt-wt-0.8 +5.2pp → quantitative candidate; Over 42 -103 BKR: P(win|no push) 54.2% vs break-even 50.7%, mkt-wt-0.8 +1.2pp → quantitative candidate, computed from run 2026-10-10T22:55:19Z] The thesis is JAX -7.5 as a Tier-1 quantitative candidate with low confidence. Both FTN and SRS put JAX more than 20 points better, and those are four-game samples that still include Barkley and Smith. The strongest counter is that -7.5 loses on a 7-point margin, the second-most common winning margin for favorites [Source: data/research-intel/proposed/2026-w05-historical-market-calibration.json, default era 2018-2025 favorite exact-margin frequency: 3 = 8.23%, 7 = 5.45%; push on closing 7 = 5.22%, generated 2026-10-10T22:03:55Z], in a low-total, neutral-site game. The disposition changes if the number reaches -8.5 or if a JAX starter on offense is ruled out.


---

## CHI@GB — conflicted

Kickoff 2026-10-11T17:00Z · Lambeau Field · ESPN 401872990

### 1–2. Market baseline and implied score

| Book | Spread (home line) | Total | Moneyline (away/home) | Captured |
|---|---|---|---|---|
| BKR (baseline) | GB +1.5 (-119) / CHI -1.5 (+102) | 46 (O -116 / U -101) | -112 / -101 (no-vig home 48.8%) | 2026-10-10T22:27:20Z |
| BEO | GB +1 (-108) / CHI (-112) | 46.5 | -119 / -101 | 2026-10-10T21:15:15Z |
| AN open (context) | GB +1.5 | 44.5 | — | 2026-10-05T00:06:55Z |
| SuperContest (contest) | CHI -3 | — | — | user-verified 2026-10-09; no capture time |

Market-implied score: CHI 23.75 – GB 22.25 (BKR).

### 3. FTN team analytics (season-to-date, Weeks 1–4)

| FTN table — field | CHI (rank) | GB (rank) |
|---|---|---|
| team-offense/efficiency — EPA/PLY | 0.077 (9) | -0.089 (26) |
| team-offense/efficiency — SUCC% | 47.0 (8) | 39.1 (27) |
| team-offense/passing-analytics — EPA/DB | 0.221 (8) | 0.028 (20) |
| team-offense/rushing-analytics — EPA/ATT | -0.071 (15) | -0.349 (32) |
| team-offense/pass-protection — PRESS% | 33.8 (26) | 27.8 (12) |
| team-offense/pass-protection — SK% | 4.6 (10) | 4.9 (13) |
| team-offense/tempo — PLY/GM | 74.5 (1) | 58.8 (23) |
| team-offense/tendencies — DPBK% | 50.7 (31) | 68.9 (1) |
| team-offense/overview — PT/GM | 28.0 (9) | 18.3 (25) |
| team-defense/efficiency — EPA/PLY | -0.059 (7) | 0.04 (21) |
| team-defense/passing-analytics — EPA/DB | -0.095 (3) | 0.092 (20) |
| team-defense/rush-analytics — EPA/ATT | -0.005 (29) | -0.022 (26) |
| team-defense/pass-rush — PRESS% | 35.3 (6) | 26.8 (23) |
| team-defense/pass-rush — SK% | 8.6 (3) | 7.0 (11) |
| team-defense/pass-rush — BLZ% | 39.7 (4) | 39.4 (5) |
| team-defense/overview — PT/GM | 16.3 (4) | 26.3 (25) |

Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, captured 2026-10-09T21:53:39Z. Ranks 1 = best (defensive EPA and offensive pressure/sack/turnover allowed ranked low-is-good).

### 4. Power ratings

| Team | Record | SRS | Net pts/g | Pythag | Model rank |
|---|---|---|---|---|---|
| CHI | 3-1 | 12.116 | 11.75 | 0.7841 | 3 |
| GB | 2-2 | -7.417 | -8 | 0.297 | 28 |

Source: data/generated/team-profiles/team-power-ratings-2026.json (generated 2026-10-10T07:06:04Z; 2026 season-to-date; provenance note inconsistency G17).

### 5. Availability and role

- **CHI** QB: QB change: Williams wk1-2, Keenum wk3, Bagent wk4; Bagent named Wk5 starter (availability row, published 2026-10-05); Williams QUESTIONABLE (hamstring). FTN/SRS sample mostly non-Bagent.
- **GB** QB: Same starting QB all 4 weeks per nflverse weekly (attempts>=10)

- **Structural staleness:** CHI — FTN/SRS do not describe the Week 5 starting QB; Tier 1 barred.

### 6. Weather / venue

- [Source: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json, Open-Meteo forecast CHI@GB sampled 2026-10-11T17:00:00Z: 73.9°F, wind 22.3 km/h gusts 42.1 km/h dir 209°, precip prob 0% / 0 mm (forecast, not observation), captured 2026-10-10T17:56:55Z]

### 7. Secondary-matchup context (manual, capped, qualitative)

- CHI offense vs GB defense (zone_heavy, match_zone; balanced): absences Johnathan Baldwin II ir (availability re-check: absence confirmed OUT/IR/PUP); listed targets Kalif Raymond, Rome Odunze, Cole Kmet, Colston Loveland.
- GB offense vs CHI defense (zone_heavy, two_high; front_dependent): absences Coby Bryant ir (availability re-check: absence confirmed OUT/IR/PUP); Anthony Johnson Jr. out (availability re-check: absence confirmed OUT/IR/PUP); Kyler Gordon out (availability re-check: questionable); listed targets Matthew Golden, Skyy Moore, Tucker Kraft.

### 8. Simulation

| Quantity | Blend (60/25/15) | Market-only |
|---|---|---|
| Home margin / total mean | -7.50 / 45.34 | -1.5 / 46 |
| GB cover +1.5 | 33.5% | 50.0% |
| CHI cover -1.5 | 66.5% | 50.0% |
| Spread push | 0.0% | 0.0% |
| Over 46 | 46.5% | 48.5% |
| Under 46 | 50.5% | 48.5% |
| GB win | 30.6% | 46.9% |

100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z. Calibration caveat: dispersion and key numbers from the pinned 2018–2025 artifact; blend weights unbacktested.

### 9. Expert / article / podcast / split evidence

- Qualified: [Source: data/generated/master-intel/w05-expert-verified.json#rows[392] (ESPN NFL; Ben Solak, Seth Walder, Matt Bowen and Mike Clay; article published 2026-10-09T12:58:29Z; verifier-row timestamp 2026-10-10T20:38; https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games), verbatim: "Christian Watson anytime TD (+195)" — traced in data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md (captured 2026-10-09T13:05:56)]
- Qualified: [Source: data/generated/master-intel/w05-expert-verified.json#rows[399] (ESPN NFL; Ben Solak, Seth Walder, Matt Bowen and Mike Clay; article published 2026-10-09T12:58:29Z; verifier-row timestamp 2026-10-10T20:38; https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games), verbatim: "Kalif Raymond 4+ receptions (+123)" — traced in data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md (captured 2026-10-09T13:05:56)]
- Qualified: [Source: data/generated/master-intel/w05-expert-verified.json#rows[400] (ESPN NFL; Ben Solak, Seth Walder, Matt Bowen and Mike Clay; article published 2026-10-09T12:58:29Z; verifier-row timestamp 2026-10-10T20:38; https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games), verbatim: "Tyson Bagent interceptions OVER 0.5 (-102)" — traced in data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md (captured 2026-10-09T13:05:56)]
- research_only tags (cannot set a tier): expert_feed:prop 4, expert_feed:spread 6, expert_feed:moneyline 1, expert_feed:teaser 1, expert_feed:total 1, podcast:prop 3, podcast:spread 9, podcast:best_bet 1, article:prop 3, article:spread 1, article:moneyline 2; most frequent side/total tags: Green Bay Packers ×4, Chicago Bears ×3, spread GB 2.5 ×3, spread CHI -2.5 ×2, spread GB 3 ×2, spread UNDER 2.5 ×2.
- Splits (context): [Source: data/generated/master-intel/w05-pull.json#splits[9], Action Network splits CHI@GB: spread GB 43% bets/48% money, over 74%/69%, ML GB 29%/35% (context only), captured 2026-10-10T17:55:26Z]

### 10. Disposition

| Market | Captured price | P(win|no push) | Break-even | Margin (pp) | At mkt wt 0.8 (pp) | FTN dev | SRS dev | Checks a/b/c/d | Label |
|---|---|---|---|---|---|---|---|---|---|
| GB +1.5 | -119 BKR | 33.5% | 54.3% | -20.8 | -12.8 | -14.15 | -16.42 | ✗/✗/✗/✗ | pass |
| CHI -1.5 | +102 BKR | 66.5% | 49.5% | 17.0 | 9.0 | 14.15 | 16.42 | ✓/✓/✓/✗ | conflicted |
| Over 46 | -116 BKR | 47.9% | 53.7% | -5.8 | -4.7 | -2.62 | — | ✗/✗/✗/✗ | pass |
| Under 46 | -101 BKR | 52.1% | 50.2% | 1.8 | 0.8 | 2.62 | — | ✗/✓/✓/✗ | pass |

Invalidators: [availability] starting QB confirmation (Bagent vs Caleb Williams) at inactives; [line] CHI -3 or worse (crosses 3); [weather] Lambeau gusts forecast > 45 km/h; [evidence] structural QB staleness in FTN/SRS (CHI).


### Game state and thesis

**Game script.** Bookmaker makes this close to a coin flip: CHI -1.5 (+102), total 46, moneyline CHI -112 / GB -101 [Source: data/generated/props/bookmaker-live-2026-10-10-week5.json, BKR CHI@GB CHI -1.5 (home GB +1.5 -119 / away CHI -1.5 +102), total 46 (O -116/U -101), ML CHI -112/GB -101, captured 2026-10-10T22:27:20Z]. The likely script is a Bears offense that piles up plays [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/tempo — PLY/GM CHI = 74.5 (rank 1/32), captured 2026-10-09T21:53:39Z] against a Packers offense forced to throw by a collapsed run game [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/rushing-analytics — EPA/ATT GB = -0.349 (rank 32/32), captured 2026-10-09T21:53:39Z]. The alternative is wind-driven: forecast gusts of 42 km/h at Lambeau [Source: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json, Open-Meteo forecast CHI@GB sampled 2026-10-11T17:00:00Z: 73.9°F, wind 22.3 km/h gusts 42.1 km/h dir 209°, precip prob 0% / 0 mm (forecast, not observation), captured 2026-10-10T17:56:55Z] could cut down Chicago's downfield passing.

**Away team (CHI).** The quarterback is the problem for any numeric read. Chicago's 2026 starts went Williams, Williams, Keenum, Bagent [Source: data/vault-seed/nflverse/player_stats_weekly.csv, CHI QB attempts>=10 by week: wk1 Caleb Williams 29 att; wk2 Caleb Williams 26 att; wk3 Case Keenum 34 att; wk4 Tyson Bagent 34 att]. Bagent was named the Week 5 starter [Source: data/player-availability/latest.json#events[960], Tyson Bagent (CHI) ACTIVE_NEWS: "Bears head coach Ben Johnson said that Bagent will start Sunday's game against the Packers in Green Bay, Sean Hammond of the Chicago Tribune reports.", published 2026-10-05T16:24Z, captured 2026-10-10T16:45:17Z] while Williams is questionable with a hamstring [Source: data/player-availability/latest.json#events[231], Caleb Williams (CHI) QUESTIONABLE: "Caleb Williams QUESTIONABLE", published 2026-10-10T18:42Z, captured 2026-10-10T16:45:17Z]. Chicago's efficiency profile [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — EPA/PLY CHI = 0.077 (rank 9/32), captured 2026-10-09T21:53:39Z] and power rating [Source: data/generated/team-profiles/team-power-ratings-2026.json, CHI SRS 12.116, net pts/g 11.75, pythag 0.7841, record 3-1, generated 2026-10-10T07:06:04Z] were built mostly by other quarterbacks. The defense is sturdier evidence: third in dropback EPA allowed [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-defense/passing-analytics — EPA/DB CHI = -0.095 (rank 3/32), captured 2026-10-09T21:53:39Z], with Kyler Gordon questionable [Source: data/player-availability/latest.json#events[493], Kyler Gordon (CHI) OUT: "Gordon (calf) is listed as questionable ahead of Sunday's game against the Packers.", published 2026-10-09T23:32Z, captured 2026-10-10T16:45:17Z].

**Home team (GB).** Green Bay is 26th in offensive EPA/play [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — EPA/PLY GB = -0.089 (rank 26/32), captured 2026-10-09T21:53:39Z] and the most pass-heavy offense by dropback rate [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/tendencies — DPBK% GB = 68.9 (rank 1/32), captured 2026-10-09T21:53:39Z]. Micah Parsons is listed PUP/out [Source: data/player-availability/latest.json#events[8], Micah Parsons (GB) PUP: "Micah Parsons PUP", published 2026-10-10T23:30Z, captured 2026-10-10T16:45:17Z].

**Matchup mechanics.** Chicago's pressure rate [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-defense/pass-rush — PRESS% CHI = 35.3 (rank 6/32), captured 2026-10-09T21:53:39Z] against Green Bay's forced passing is the cleanest edge. ESPN's traced write-up flags the Bagent risk directly: [Source: data/generated/master-intel/w05-expert-verified.json#rows[400] (ESPN NFL; Ben Solak, Seth Walder, Matt Bowen and Mike Clay; article published 2026-10-09T12:58:29Z; verifier-row timestamp 2026-10-10T20:38; https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games), verbatim: "Tyson Bagent interceptions OVER 0.5 (-102)" — traced in data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md (captured 2026-10-09T13:05:56)] and [Source: data/generated/master-intel/w05-expert-verified.json#rows[399] (ESPN NFL; Ben Solak, Seth Walder, Matt Bowen and Mike Clay; article published 2026-10-09T12:58:29Z; verifier-row timestamp 2026-10-10T20:38; https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games), verbatim: "Kalif Raymond 4+ receptions (+123)" — traced in data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md (captured 2026-10-09T13:05:56)].

**Market comparison.** The blend projects CHI by 7.5 and has CHI -1.5 covering in 66% of draws [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[CHI@GB].simulation, blend home margin -7.50 / total 45.34; MC home cover 0.335, away cover 0.665, push 0.000, over 0.465, under 0.505; 100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z]. That projection relies on FTN and SRS samples from other quarterbacks, the structural-staleness case the rules exclude. The SuperContest line is CHI -3, a different number from the market [Source: data/supercontest/week-05-2026-verified-lines.json#lines[9], SuperContest CHI -3 vs GB (contest line only; user-verified 2026-10-09, no capture time; file home/away orientation REVERSED vs schedule)].

**Thesis / counter-thesis.** [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[CHI@GB].dispositions, CHI -1.5 +102 BKR: P(win|no push) 66.5% vs break-even 49.5%, mkt-wt-0.8 +9.0pp → conflicted, computed from run 2026-10-10T22:55:19Z] The label is conflicted. The counter-thesis is a Packers home cover if Bagent turns the ball over (ESPN's traced pick is Bagent INT over 0.5). The label changes if Williams is confirmed active and starting, which would allow a re-run with current-quarterback context, or if the line reaches CHI -3, which would be a different bet.


---

## HOU@TEN — pass

Kickoff 2026-10-11T17:00Z · Nissan Stadium · ESPN 401872984

### 1–2. Market baseline and implied score

| Book | Spread (home line) | Total | Moneyline (away/home) | Captured |
|---|---|---|---|---|
| BKR (baseline) | TEN +7 (-113) / HOU -7 (-103) | 37.5 (O -108 / U -108) | -344 / +289 (no-vig home 24.9%) | 2026-10-10T22:26:41Z |
| BEO | TEN +7 (-110) / HOU (-110) | 38 | -365 / +292 | 2026-10-10T21:15:15Z |
| AN open (context) | TEN +6.5 | 39.5 | — | 2026-10-05T00:06:56Z |
| SuperContest (contest) | HOU -7.5 | — | — | user-verified 2026-10-09; no capture time |

Market-implied score: HOU 22.25 – TEN 15.25 (BKR).

### 3. FTN team analytics (season-to-date, Weeks 1–4)

| FTN table — field | HOU (rank) | TEN (rank) |
|---|---|---|
| team-offense/efficiency — EPA/PLY | -0.027 (20) | -0.085 (25) |
| team-offense/efficiency — SUCC% | 41.3 (21) | 41.2 (22) |
| team-offense/passing-analytics — EPA/DB | 0.067 (15) | -0.104 (26) |
| team-offense/rushing-analytics — EPA/ATT | -0.221 (29) | -0.053 (11) |
| team-offense/pass-protection — PRESS% | 24.6 (5) | 27.9 (13) |
| team-offense/pass-protection — SK% | 7.0 (22) | 4.4 (9) |
| team-offense/tempo — PLY/GM | 63.5 (10) | 54.0 (31) |
| team-offense/tendencies — DPBK% | 67.3 (4) | 63.0 (11) |
| team-offense/overview — PT/GM | 21.0 (15) | 13.8 (31) |
| team-defense/efficiency — EPA/PLY | 0.035 (20) | 0.047 (23) |
| team-defense/passing-analytics — EPA/DB | 0.122 (24) | 0.196 (28) |
| team-defense/rush-analytics — EPA/ATT | -0.11 (14) | -0.101 (16) |
| team-defense/pass-rush — PRESS% | 25.6 (26) | 22.8 (30) |
| team-defense/pass-rush — SK% | 8.8 (2) | 6.3 (13) |
| team-defense/pass-rush — BLZ% | 20.6 (29) | 22.0 (27) |
| team-defense/overview — PT/GM | 27.3 (27) | 20.8 (14) |

Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, captured 2026-10-09T21:53:39Z. Ranks 1 = best (defensive EPA and offensive pressure/sack/turnover allowed ranked low-is-good).

### 4. Power ratings

| Team | Record | SRS | Net pts/g | Pythag | Model rank |
|---|---|---|---|---|---|
| HOU | 0-4 | -6.688 | -6.25 | 0.3504 | 26 |
| TEN | 0-4 | -10.882 | -7 | 0.2738 | 29 |

Source: data/generated/team-profiles/team-power-ratings-2026.json (generated 2026-10-10T07:06:04Z; 2026 season-to-date; provenance note inconsistency G17).

### 5. Availability and role

- **HOU** QB: Same starting QB all 4 weeks per nflverse weekly (attempts>=10)
- **TEN** QB: Same starting QB all 4 weeks per nflverse weekly (attempts>=10)

### 6. Weather / venue

- [Source: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json, Open-Meteo forecast HOU@TEN sampled 2026-10-11T17:00:00Z: 66°F, wind 13.5 km/h gusts 24.8 km/h dir 305°, precip prob 4% / 0 mm (forecast, not observation), captured 2026-10-10T17:56:55Z]

### 7. Secondary-matchup context (manual, capped, qualitative)

- HOU offense vs TEN defense (match_zone, single_high; front_dependent): absences Kendell Brooks ir (availability re-check: absence confirmed OUT/IR/PUP); Dominique Hampton ir (availability re-check: name not on roster — unverified); Amani Hooker out (availability re-check: absence confirmed OUT/IR/PUP); Joshua Williams ir (availability re-check: questionable); listed targets Nico Collins, Dalton Schultz, Kayshon Boutte, Xavier Hutchinson.
- TEN offense vs HOU defense (quarters, two_high, zone_heavy; front_dependent): absences Jaylin Smith ir (availability re-check: absence confirmed OUT/IR/PUP); M.J. Stewart out (availability re-check: questionable); listed targets Wan'Dale Robinson, Elic Ayomanor, Gunnar Helm.

### 8. Simulation

| Quantity | Blend (60/25/15) | Market-only |
|---|---|---|
| Home margin / total mean | -5.15 / 38.65 | -7 / 37.5 |
| TEN cover +7 | 52.8% | 47.4% |
| HOU cover -7 | 41.9% | 47.4% |
| Spread push | 5.3% | 5.2% |
| Over 37.5 | 53.6% | 50.1% |
| Under 37.5 | 46.4% | 49.9% |
| TEN win | 30.4% | 25.8% |

100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z. Calibration caveat: dispersion and key numbers from the pinned 2018–2025 artifact; blend weights unbacktested.

### 9. Expert / article / podcast / split evidence

- Qualified: [Source: data/generated/master-intel/w05-expert-verified.json#rows[402] (ESPN NFL; Ben Solak, Seth Walder, Matt Bowen and Mike Clay; article published 2026-10-09T12:58:29Z; verifier-row timestamp 2026-10-10T20:38; https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games), verbatim: "David Montgomery 1.5 receptions OVER (+119)" — traced in data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md (captured 2026-10-09T13:05:56)]
- research_only tags (cannot set a tier): expert_feed:prop 5, expert_feed:spread 5, expert_feed:total 2, expert_feed:moneyline 1, expert_feed:futures 1, podcast:prop 2, podcast:spread 5, podcast:survivor_pick 1, article:prop 3, article:spread 2, article:moneyline 1; most frequent side/total tags: Houston Texans ×3, Tennessee Titans ×2, Titans +7.5 | Titans +7.5 ×2, UNDER ×1, Houston Texans ML & UNDER ×1, Texans ×1.
- Splits (context): [Source: data/generated/master-intel/w05-pull.json#splits[3], Action Network splits HOU@TEN: spread TEN 32% bets/37% money, over 77%/73%, ML TEN 6%/9% (context only), captured 2026-10-10T17:55:26Z]

### 10. Disposition

| Market | Captured price | P(win|no push) | Break-even | Margin (pp) | At mkt wt 0.8 (pp) | FTN dev | SRS dev | Checks a/b/c/d | Label |
|---|---|---|---|---|---|---|---|---|---|
| TEN +7 | -113 BKR | 55.7% | 53.0% | 2.7 | -0.2 | 4.74 | 4.42 | ✗/✗/✓/✓ | pass |
| HOU -7 | -103 BKR | 44.3% | 50.7% | -6.4 | -3.6 | -4.74 | -4.42 | ✗/✗/✗/✓ | pass |
| Over 37.5 | -108 BKR | 53.6% | 51.9% | 1.7 | -0.1 | 4.6 | — | ✗/✗/✓/✓ | pass |
| Under 37.5 | -108 BKR | 46.4% | 51.9% | -5.5 | -3.7 | -4.6 | — | ✗/✗/✗/✓ | pass |

Invalidators: [line] TEN +7.5 at <= -115 (re-evaluate); [line] total 36.5 or lower; [availability] Nico Collins or C.J. Stroud status change.


### Game state and thesis

**Game script.** This is the lowest total on the slate, 37.5, with HOU -7 (-103) and TEN +7 (-113) [Source: data/generated/props/bookmaker-live-2026-10-10-week5.json, BKR HOU@TEN HOU -7 (home TEN +7 -113 / away HOU -7 -103), total 37.5 (O -108/U -108), ML HOU -344/TEN +289, captured 2026-10-10T22:26:41Z], implying roughly 22–15. Both teams are 0-4 [Source: data/generated/team-profiles/team-power-ratings-2026.json, HOU SRS -6.688, net pts/g -6.25, pythag 0.3504, record 0-4, generated 2026-10-10T07:06:04Z] [Source: data/generated/team-profiles/team-power-ratings-2026.json, TEN SRS -10.882, net pts/g -7, pythag 0.2738, record 0-4, generated 2026-10-10T07:06:04Z]. The expected script is a field-position game with few explosive plays and Houston's pass rush deciding drives. The alternative is that neither offense can finish, and a one-score game lands on or inside the key number.

**Away team (HOU).** C.J. Stroud has taken every Houston start [Source: data/vault-seed/nflverse/player_stats_weekly.csv, HOU QB attempts>=10 by week: wk1 C.J. Stroud 38 att; wk2 C.J. Stroud 55 att; wk3 C.J. Stroud 27 att; wk4 C.J. Stroud 31 att]. The offense protects him well [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/pass-protection — PRESS% HOU = 24.6 (rank 5/32), captured 2026-10-09T21:53:39Z] but cannot run [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/rushing-analytics — EPA/ATT HOU = -0.221 (rank 29/32), captured 2026-10-09T21:53:39Z]. The defense is second in sack rate [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-defense/pass-rush — SK% HOU = 8.8 (rank 2/32), captured 2026-10-09T21:53:39Z] but 24th in dropback EPA allowed [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-defense/passing-analytics — EPA/DB HOU = 0.122 (rank 24/32), captured 2026-10-09T21:53:39Z]. Tank Dell is on IR [Source: data/player-availability/latest.json#events[529], Tank Dell (HOU) IR: "Dell (knee) has been ruled out for Sunday's game against the Titans.", published 2026-10-09T21:09Z, captured 2026-10-10T16:45:17Z].

**Home team (TEN).** Cam Ward's offense is 31st in points per game [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/overview — PT/GM TEN = 13.8 (rank 31/32), captured 2026-10-09T21:53:39Z] and 31st in plays per game [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/tempo — PLY/GM TEN = 54.0 (rank 31/32), captured 2026-10-09T21:53:39Z]. Tennessee's pass defense is 28th in dropback EPA [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-defense/passing-analytics — EPA/DB TEN = 0.196 (rank 28/32), captured 2026-10-09T21:53:39Z], and its secondary is missing Amani Hooker and Kendell Brooks [Source: data/secondary-matchups/secondary-matchup-vulnerability-2026-w05.json#matchups[6], TEN defense vs HOU: scheme match_zone,single_high; absences Kendell Brooks ir; Dominique Hampton ir; Amani Hooker out; Joshua Williams ir (manual context, capped/qualitative; absences re-validated against data/player-availability/latest.json), generated 2026-10-10T17:31:50Z].

**Matchup mechanics.** Houston's receivers, led by Nico Collins, against a depleted Tennessee secondary is the main mechanism for HOU covering. Tennessee's slow tempo works the other way by limiting how many possessions Houston gets. Weather is not material [Source: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json, Open-Meteo forecast HOU@TEN sampled 2026-10-11T17:00:00Z: 66°F, wind 13.5 km/h gusts 24.8 km/h dir 305°, precip prob 4% / 0 mm (forecast, not observation), captured 2026-10-10T17:56:55Z].

**Market comparison.** The market opened HOU -6.5 / 39.5 [Source: data/odds/actionnetwork-openers-2026-w05.json, Action Network 'Open' book HOU@TEN home line +6.5, total 39.5, recorded 2026-10-05T00:06:56Z; opener context only, pulled 2026-10-08T03:36:16Z]. The blend projects HOU by about 5 with a total near 38.7. TEN +7 covers in 52.7% of draws, with a 5.3% push [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[HOU@TEN].simulation, blend home margin -5.15 / total 38.65; MC home cover 0.527, away cover 0.419, push 0.053, over 0.536, under 0.464; 100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z]. At -113, that clears break-even by less than the 3-point Tier-1 margin and fails the 80%-market-weight check. ESPN's traced David Montgomery receptions-over pick [Source: data/generated/master-intel/w05-expert-verified.json#rows[402] (ESPN NFL; Ben Solak, Seth Walder, Matt Bowen and Mike Clay; article published 2026-10-09T12:58:29Z; verifier-row timestamp 2026-10-10T20:38; https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games), verbatim: "David Montgomery 1.5 receptions OVER (+119)" — traced in data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md (captured 2026-10-09T13:05:56)] is a prop and does not touch the side.

**Thesis / counter-thesis.** [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[HOU@TEN].dispositions, TEN +7 -113 BKR: P(win|no push) 55.7% vs break-even 53.0%, mkt-wt-0.8 -0.2pp → pass, computed from run 2026-10-10T22:55:19Z] Pass. The lean is TEN +7, but it is too thin to carry a tier. The counter is that Houston's secondary absences favor it more than FTN's team averages show. The disposition changes if TEN +7.5 is available at a normal price, or if the total drops to 36.5 while the model holds near 38.7.


---

## CIN@MIA — pass

Kickoff 2026-10-11T17:00Z · Hard Rock Stadium · ESPN 401872982

### 1–2. Market baseline and implied score

| Book | Spread (home line) | Total | Moneyline (away/home) | Captured |
|---|---|---|---|---|
| BKR (baseline) | MIA +7 (-113) / CIN -7 (-103) | 43.5 (O -113 / U -103) | -310 / +263 (no-vig home 26.7%) | 2026-10-10T22:26:10Z |
| BEO | MIA +7 (-115) / CIN (-105) | 44 | -330 / +267 | 2026-10-10T21:15:15Z |
| AN open (context) | MIA +7.5 | 44.0 | — | 2026-10-05T01:01:25Z |
| SuperContest (contest) | CIN -7 | — | — | user-verified 2026-10-09; no capture time |

Market-implied score: CIN 25.25 – MIA 18.25 (BKR).

### 3. FTN team analytics (season-to-date, Weeks 1–4)

| FTN table — field | CIN (rank) | MIA (rank) |
|---|---|---|
| team-offense/efficiency — EPA/PLY | 0.042 (10) | -0.141 (30) |
| team-offense/efficiency — SUCC% | 44.6 (12) | 34.8 (31) |
| team-offense/passing-analytics — EPA/DB | 0.12 (14) | -0.113 (27) |
| team-offense/rushing-analytics — EPA/ATT | -0.131 (19) | -0.182 (25) |
| team-offense/pass-protection — PRESS% | 26.3 (9) | 33.1 (24) |
| team-offense/pass-protection — SK% | 5.3 (14) | 8.7 (28) |
| team-offense/tempo — PLY/GM | 62.3 (15) | 52.5 (32) |
| team-offense/tendencies — DPBK% | 68.7 (2) | 60.5 (15) |
| team-offense/overview — PT/GM | 21.3 (14) | 11.5 (32) |
| team-defense/efficiency — EPA/PLY | -0.037 (11) | 0.063 (27) |
| team-defense/passing-analytics — EPA/DB | -0.001 (8) | 0.308 (30) |
| team-defense/rush-analytics — EPA/ATT | -0.112 (13) | -0.207 (6) |
| team-defense/pass-rush — PRESS% | 29.3 (17) | 19.4 (31) |
| team-defense/pass-rush — SK% | 8.5 (4) | 3.2 (28) |
| team-defense/pass-rush — BLZ% | 15.9 (32) | 29.0 (17) |
| team-defense/overview — PT/GM | 18.3 (7) | 25.3 (21) |

Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, captured 2026-10-09T21:53:39Z. Ranks 1 = best (defensive EPA and offensive pressure/sack/turnover allowed ranked low-is-good).

### 4. Power ratings

| Team | Record | SRS | Net pts/g | Pythag | Model rank |
|---|---|---|---|---|---|
| CIN | 2-2 | 4.317 | 3 | 0.5776 | 8 |
| MIA | 0-4 | -3.623 | -13.75 | 0.1342 | 32 |

Source: data/generated/team-profiles/team-power-ratings-2026.json (generated 2026-10-10T07:06:04Z; 2026 season-to-date; provenance note inconsistency G17).

### 5. Availability and role

- **CIN** QB: Same starting QB all 4 weeks per nflverse weekly (attempts>=10)
- **MIA** QB: Same starting QB all 4 weeks per nflverse weekly (attempts>=10)

### 6. Weather / venue

- [Source: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json, Open-Meteo forecast CIN@MIA sampled 2026-10-11T17:00:00Z: 89.6°F, wind 15.7 km/h gusts 20.5 km/h dir 171°, precip prob 2% / 0 mm (forecast, not observation), captured 2026-10-10T17:56:55Z]

### 7. Secondary-matchup context (manual, capped, qualitative)

- CIN offense vs MIA defense (match_zone, two_high, quarters; coverage_first): absences Ronnie Harrison Jr. ir (availability re-check: absence confirmed OUT/IR/PUP); Darrell Baker Jr. pup (availability re-check: absence confirmed OUT/IR/PUP); Dante Trader Jr. limited (availability re-check: no current absence status); Reese Taylor out (availability re-check: absence confirmed OUT/IR/PUP); Storm Duck out (availability re-check: absence confirmed OUT/IR/PUP); listed targets Ja'Marr Chase, Mike Gesicki, Colbie Young, Tee Higgins.
- MIA offense vs CIN defense (match_zone, single_high; aggressive): absences Jalen Davis ir (availability re-check: absence confirmed OUT/IR/PUP); Ja'Sir Taylor ir (availability re-check: absence confirmed OUT/IR/PUP); Kyle Dugger out (availability re-check: absence confirmed OUT/IR/PUP); listed targets Chris Bell, Malik Washington, Greg Dulcich.

### 8. Simulation

| Quantity | Blend (60/25/15) | Market-only |
|---|---|---|
| Home margin / total mean | -8.69 / 42.81 | -7 / 43.5 |
| MIA cover +7 | 42.6% | 47.4% |
| CIN cover -7 | 52.2% | 47.4% |
| Spread push | 5.2% | 5.2% |
| Over 43.5 | 47.9% | 50.0% |
| Under 43.5 | 52.1% | 50.0% |
| MIA win | 21.9% | 25.8% |

100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z. Calibration caveat: dispersion and key numbers from the pinned 2018–2025 artifact; blend weights unbacktested.

### 9. Expert / article / podcast / split evidence

- Qualified: [Source: data/generated/master-intel/w05-expert-verified.json#rows[383] (VSiN; Dustin Swedelson; article published Fri, 09 Oct 2026 20:20:28 +0000; verifier-row timestamp 2026-10-10T20:38; https://vsin.com/nfl/favorite-week-5-nfl-player-props-from-dustin-swedelson-and-optaai/), verbatim: "Greg Dulcich Over 26.5 Receiving Yards (-125)" — traced in data/research-intel/source-evidence/2026-10-10-vsin-week5-current-feed.json#records[url=https://vsin.com/nfl/favorite-week-5-nfl-player-props-from-dustin-swedelson-and-optaai/] (captured 2026-10-10T18:25:43)]
- Qualified: [Source: data/generated/master-intel/w05-expert-verified.json#rows[384] (VSiN; Dustin Swedelson; article published Fri, 09 Oct 2026 20:20:28 +0000; verifier-row timestamp 2026-10-10T20:38; https://vsin.com/nfl/favorite-week-5-nfl-player-props-from-dustin-swedelson-and-optaai/), verbatim: "Chase Brown Over 66.5 Rushing Yards (-114)" — traced in data/research-intel/source-evidence/2026-10-10-vsin-week5-current-feed.json#records[url=https://vsin.com/nfl/favorite-week-5-nfl-player-props-from-dustin-swedelson-and-optaai/] (captured 2026-10-10T18:25:43)]
- research_only tags (cannot set a tier): expert_feed:prop 2, expert_feed:spread 3, podcast:prop 3, podcast:spread 3, article:prop 5, article:spread 2, article:moneyline 2; most frequent side/total tags: Miami Dolphins ×2, spread FAVORITE -7.5 ×2, Dolphins +7 | Dolphins +7 ×2, Cincinnati Bengals ×1, spread MIA 7.5 ×1, Bengals ML | Bengals ML ×1.
- Splits (context): [Source: data/generated/master-intel/w05-pull.json#splits[5], Action Network splits CIN@MIA: spread MIA 25% bets/14% money, over 71%/81%, ML MIA 5%/2% (context only), captured 2026-10-10T17:55:26Z]

### 10. Disposition

| Market | Captured price | P(win|no push) | Break-even | Margin (pp) | At mkt wt 0.8 (pp) | FTN dev | SRS dev | Checks a/b/c/d | Label |
|---|---|---|---|---|---|---|---|---|---|
| MIA +7 | -113 BKR | 44.9% | 53.0% | -8.1 | -5.7 | -7.18 | 0.67 | ✗/✗/✗/✓ | pass |
| CIN -7 | -103 BKR | 55.1% | 50.7% | 4.3 | 1.9 | 7.18 | -0.67 | ✓/✓/✗/✓ | pass |
| Over 43.5 | -113 BKR | 47.9% | 53.0% | -5.2 | -4.1 | -2.75 | — | ✗/✗/✗/✓ | pass |
| Under 43.5 | -103 BKR | 52.1% | 50.7% | 1.4 | 0.3 | 2.75 | — | ✗/✓/✓/✓ | pass |

Invalidators: [availability] Ja'Marr Chase active/inactive confirmation; [availability] Tee Higgins status; [line] CIN -6.5 or -7.5 (moves off 7); [weather] heat index; 89.6°F forecast.


### Game state and thesis

**Game script.** CIN -7 (-103), total 43.5 [Source: data/generated/props/bookmaker-live-2026-10-10-week5.json, BKR CIN@MIA CIN -7 (home MIA +7 -113 / away CIN -7 -103), total 43.5 (O -113/U -103), ML CIN -310/MIA +263, captured 2026-10-10T22:26:10Z], implying roughly 25–18. The expected script is a Bengals passing game working against a Dolphins pass defense that ranks 30th in dropback EPA [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-defense/passing-analytics — EPA/DB MIA = 0.308 (rank 30/32), captured 2026-10-09T21:53:39Z], in forecast heat of 89.6°F [Source: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json, Open-Meteo forecast CIN@MIA sampled 2026-10-11T17:00:00Z: 89.6°F, wind 15.7 km/h gusts 20.5 km/h dir 171°, precip prob 2% / 0 mm (forecast, not observation), captured 2026-10-10T17:56:55Z]. The alternative is a Cincinnati offense without a full receiving corps settling for field goals.

**Away team (CIN).** Burrow has taken every 2026 Bengals start [Source: data/vault-seed/nflverse/player_stats_weekly.csv, CIN QB attempts>=10 by week: wk1 Joe Burrow 35 att; wk2 Joe Burrow 31 att; wk3 Joe Burrow 37 att; wk4 Joe Burrow 54 att]. The offense is pass-first by dropback rate [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/tendencies — DPBK% CIN = 68.7 (rank 2/32), captured 2026-10-09T21:53:39Z] and middle of the pack in EPA/play [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — EPA/PLY CIN = 0.042 (rank 10/32), captured 2026-10-09T21:53:39Z]. Ja'Marr Chase remains in the concussion protocol and is questionable [Source: data/player-availability/latest.json#events[228], Ja'Marr Chase (CIN) QUESTIONABLE: "Ja'Marr Chase QUESTIONABLE", published 2026-10-10T18:43Z, captured 2026-10-10T16:45:17Z]; Tee Higgins is also questionable [Source: data/player-availability/latest.json#events[229], Tee Higgins (CIN) QUESTIONABLE: "Tee Higgins QUESTIONABLE", published 2026-10-10T18:42Z, captured 2026-10-10T16:45:17Z]. The defense's sack rate is fourth [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-defense/pass-rush — SK% CIN = 8.5 (rank 4/32), captured 2026-10-09T21:53:39Z].

**Home team (MIA).** Miami is the weakest offense in the FTN set: 32nd in points per game [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/overview — PT/GM MIA = 11.5 (rank 32/32), captured 2026-10-09T21:53:39Z] and 31st in success rate [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — SUCC% MIA = 34.8 (rank 31/32), captured 2026-10-09T21:53:39Z]. Malik Willis has made every start [Source: data/vault-seed/nflverse/player_stats_weekly.csv, MIA QB attempts>=10 by week: wk1 Malik Willis 27 att; wk2 Malik Willis 23 att; wk3 Malik Willis 36 att; wk4 Malik Willis 17 att]. The rated profile is 0-4 [Source: data/generated/team-profiles/team-power-ratings-2026.json, MIA SRS -3.623, net pts/g -13.75, pythag 0.1342, record 0-4, generated 2026-10-10T07:06:04Z].

**Matchup mechanics.** Miami's very low pressure rate [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-defense/pass-rush — PRESS% MIA = 19.4 (rank 31/32), captured 2026-10-09T21:53:39Z] gives Burrow clean pockets. The key variable is who he throws to if Chase sits. Miami's secondary also has absences [Source: data/secondary-matchups/secondary-matchup-vulnerability-2026-w05.json#matchups[8], MIA defense vs CIN: scheme match_zone,two_high,quarters; absences Ronnie Harrison Jr. ir; Darrell Baker Jr. pup; Dante Trader Jr. limited; Reese Taylor out; Storm Duck out (manual context, capped/qualitative; absences re-validated against data/player-availability/latest.json), generated 2026-10-10T17:31:50Z].

**Market comparison.** The line opened CIN -7.5 / 44 [Source: data/odds/actionnetwork-openers-2026-w05.json, Action Network 'Open' book CIN@MIA home line +7.5, total 44.0, recorded 2026-10-05T01:01:25Z; opener context only, pulled 2026-10-08T03:36:16Z]. The blend projects CIN by 8.7 and has CIN -7 at 52.2% with a 5.3% push [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[CIN@MIA].simulation, blend home margin -8.69 / total 42.81; MC home cover 0.426, away cover 0.522, push 0.052, over 0.479, under 0.521; 100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z]. FTN and SRS disagree on the margin. SRS puts CIN only about 6.3 better, so the agreement check fails and the side stays untiered. Two VSiN props from Dustin Swedelson trace to source text: [Source: data/generated/master-intel/w05-expert-verified.json#rows[383] (VSiN; Dustin Swedelson; article published Fri, 09 Oct 2026 20:20:28 +0000; verifier-row timestamp 2026-10-10T20:38; https://vsin.com/nfl/favorite-week-5-nfl-player-props-from-dustin-swedelson-and-optaai/), verbatim: "Greg Dulcich Over 26.5 Receiving Yards (-125)" — traced in data/research-intel/source-evidence/2026-10-10-vsin-week5-current-feed.json#records[url=https://vsin.com/nfl/favorite-week-5-nfl-player-props-from-dustin-swedelson-and-optaai/] (captured 2026-10-10T18:25:43)] and [Source: data/generated/master-intel/w05-expert-verified.json#rows[384] (VSiN; Dustin Swedelson; article published Fri, 09 Oct 2026 20:20:28 +0000; verifier-row timestamp 2026-10-10T20:38; https://vsin.com/nfl/favorite-week-5-nfl-player-props-from-dustin-swedelson-and-optaai/), verbatim: "Chase Brown Over 66.5 Rushing Yards (-114)" — traced in data/research-intel/source-evidence/2026-10-10-vsin-week5-current-feed.json#records[url=https://vsin.com/nfl/favorite-week-5-nfl-player-props-from-dustin-swedelson-and-optaai/] (captured 2026-10-10T18:25:43)]. Dulcich's 2026 game log is 18, 17 and 55 yards [Source: data/vault-seed/nflverse/player_stats_weekly.csv, 2026 Greg Dulcich receiving_yards by week: wk1 18, wk2 17, wk3 55; file through week 4, mtime 2026-10-06T18:44:56Z].

**Thesis / counter-thesis.** [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[CIN@MIA].dispositions, CIN -7 -103 BKR: P(win|no push) 55.1% vs break-even 50.7%, mkt-wt-0.8 +1.9pp → pass, computed from run 2026-10-10T22:55:19Z] Pass on the side and total. The lean is CIN, but the number sits on 7 and the two non-market components disagree. The counter-thesis is that Chase being out removes Cincinnati's main mechanism. (The survivor report's heavy MIA field share is flagged as a likely mapping defect.) The disposition changes if Chase is active and CIN -6.5 appears, or if he is ruled out.


---

## LV@NE — quantitative candidate

Kickoff 2026-10-11T17:00Z · Gillette Stadium · ESPN 401872986

### 1–2. Market baseline and implied score

| Book | Spread (home line) | Total | Moneyline (away/home) | Captured |
|---|---|---|---|---|
| BKR (baseline) | NE -3.5 (-109) / LV +3.5 (-107) | 45 (O -114 / U -102) | +167 / -191 (no-vig home 63.7%) | 2026-10-10T22:26:21Z |
| BEO | NE -3.5 (-110) / LV (-110) | 45 | +160 / -183 | 2026-10-10T21:15:15Z |
| AN open (context) | NE -3.5 | 45.5 | — | 2026-10-05T00:01:36Z |
| SuperContest (contest) | NE -3.5 | — | — | user-verified 2026-10-09; no capture time |

Market-implied score: NE 24.25 – LV 20.75 (BKR).

### 3. FTN team analytics (season-to-date, Weeks 1–4)

| FTN table — field | LV (rank) | NE (rank) |
|---|---|---|
| team-offense/efficiency — EPA/PLY | -0.015 (16) | -0.026 (19) |
| team-offense/efficiency — SUCC% | 41.3 (20) | 42.7 (17) |
| team-offense/passing-analytics — EPA/DB | 0.161 (11) | 0.059 (17) |
| team-offense/rushing-analytics — EPA/ATT | -0.25 (30) | -0.146 (20) |
| team-offense/pass-protection — PRESS% | 32.9 (22) | 29.7 (20) |
| team-offense/pass-protection — SK% | 3.2 (3) | 6.1 (18) |
| team-offense/tempo — PLY/GM | 67.8 (4) | 63.3 (11) |
| team-offense/tendencies — DPBK% | 57.2 (22) | 58.5 (20) |
| team-offense/overview — PT/GM | 28.3 (8) | 14.8 (30) |
| team-defense/efficiency — EPA/PLY | -0.103 (4) | -0.007 (14) |
| team-defense/passing-analytics — EPA/DB | -0.077 (5) | -0.046 (6) |
| team-defense/rush-analytics — EPA/ATT | -0.144 (10) | 0.056 (31) |
| team-defense/pass-rush — PRESS% | 39.5 (2) | 27.0 (22) |
| team-defense/pass-rush — SK% | 8.2 (5) | 5.7 (19) |
| team-defense/pass-rush — BLZ% | 25.2 (23) | 36.9 (8) |
| team-defense/overview — PT/GM | 21.0 (15) | 17.8 (6) |

Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, captured 2026-10-09T21:53:39Z. Ranks 1 = best (defensive EPA and offensive pressure/sack/turnover allowed ranked low-is-good).

### 4. Power ratings

| Team | Record | SRS | Net pts/g | Pythag | Model rank |
|---|---|---|---|---|---|
| LV | 3-1 | 6.191 | 7.75 | 0.678 | 6 |
| NE | 2-2 | 2.402 | -3 | 0.4009 | 17 |

Source: data/generated/team-profiles/team-power-ratings-2026.json (generated 2026-10-10T07:06:04Z; 2026 season-to-date; provenance note inconsistency G17).

### 5. Availability and role

- **LV** QB: Same starting QB all 4 weeks per nflverse weekly (attempts>=10)
- **NE** QB: Same starting QB all 4 weeks per nflverse weekly (attempts>=10)

### 6. Weather / venue

- [Source: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json, Open-Meteo forecast LV@NE sampled 2026-10-11T17:00:00Z: 64.6°F, wind 15.6 km/h gusts 24.1 km/h dir 170°, precip prob 2% / 0 mm (forecast, not observation), captured 2026-10-10T17:56:55Z]

### 7. Secondary-matchup context (manual, capped, qualitative)

- LV offense vs NE defense (man_heavy, single_high; coverage_first): absences Dell Pettus ir (availability re-check: absence confirmed OUT/IR/PUP); Karon Prunty out (availability re-check: absence confirmed OUT/IR/PUP); Channing Canada out (availability re-check: absence confirmed OUT/IR/PUP); Christian Gonzalez out (availability re-check: absence confirmed OUT/IR/PUP); Carlton Davis III out (availability re-check: absence confirmed OUT/IR/PUP); listed targets Tre Tucker, Brock Bowers, Cody White.
- NE offense vs LV defense (zone_heavy, single_high; front_dependent): absences Chigozie Anusiem ir (availability re-check: absence confirmed OUT/IR/PUP); Hezekiah Masses limited (availability re-check: no current absence status); Darien Porter limited (availability re-check: no current absence status); listed targets DeMario Douglas, Romeo Doubs.

### 8. Simulation

| Quantity | Blend (60/25/15) | Market-only |
|---|---|---|
| Home margin / total mean | +0.52 / 42.18 | +3.5 / 45 |
| NE cover -3.5 | 41.6% | 50.0% |
| LV cover +3.5 | 58.4% | 50.0% |
| Spread push | 0.0% | 0.0% |
| Over 45 | 40.0% | 48.5% |
| Under 45 | 57.1% | 48.5% |
| NE win | 56.5% | 64.7% |

100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z. Calibration caveat: dispersion and key numbers from the pinned 2018–2025 artifact; blend weights unbacktested.

### 9. Expert / article / podcast / split evidence

- Qualified: [Source: data/generated/master-intel/w05-expert-verified.json#rows[397] (ESPN NFL; Ben Solak, Seth Walder, Matt Bowen and Mike Clay; article published 2026-10-09T12:58:29Z; verifier-row timestamp 2026-10-10T20:38; https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games), verbatim: "Michael Mayer receiving yards OVER 30.5 (-109)" — traced in data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md (captured 2026-10-09T13:05:56)]
- Qualified: [Source: data/generated/master-intel/w05-expert-verified.json#rows[398] (ESPN NFL; Ben Solak, Seth Walder, Matt Bowen and Mike Clay; article published 2026-10-09T12:58:29Z; verifier-row timestamp 2026-10-10T20:38; https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games), verbatim: "I'll be taking Mayer at this line for a full unit and tracking half a unit on 40+ receiving yards at +165." — traced in data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md (captured 2026-10-09T13:05:56)]
- research_only tags (cannot set a tier): expert_feed:prop 3, expert_feed:moneyline 4, expert_feed:spread 3, podcast:prop 4, podcast:moneyline 1, podcast:spread 4, article:prop 4, article:spread 4, article:total 1, article:moneyline 1; most frequent side/total tags: Las Vegas Raiders ×5, New England Patriots ×2, spread LV 3.5 ×2, spread FAVORITE -3.5 ×2, Raiders +3.5 | Raiders +3.5 ×2, moneyline LV ×1.
- Splits (context): [Source: data/generated/master-intel/w05-pull.json#splits[8], Action Network splits LV@NE: spread NE 28% bets/23% money, over 74%/79%, ML NE 64%/38% (context only), captured 2026-10-10T17:55:26Z]

### 10. Disposition

| Market | Captured price | P(win|no push) | Break-even | Margin (pp) | At mkt wt 0.8 (pp) | FTN dev | SRS dev | Checks a/b/c/d | Label |
|---|---|---|---|---|---|---|---|---|---|
| NE -3.5 | -109 BKR | 41.6% | 52.1% | -10.5 | -6.4 | -8.52 | -5.68 | ✗/✗/✗/✓ | pass |
| LV +3.5 | -107 BKR | 58.4% | 51.7% | 6.7 | 2.6 | 8.52 | 5.68 | ✓/✓/✓/✓ | quantitative candidate |
| Over 45 | -114 BKR | 41.2% | 53.3% | -12.1 | -7.6 | -11.27 | — | ✗/✗/✗/✓ | pass |
| Under 45 | -102 BKR | 58.8% | 50.5% | 8.3 | 3.9 | 11.27 | — | ✓/✓/✓/✓ | quantitative candidate |

Invalidators: [line] LV +3 or shorter (crosses 3) -> different bet; [line] total 43.5 or lower; [availability] Ashton Jeanty / Rhamondre Stevenson status; [availability] NE CB Christian Gonzalez or Carlton Davis upgraded.


### Game state and thesis

**Game script.** NE -3.5 (-109), LV +3.5 (-107), total 45 [Source: data/generated/props/bookmaker-live-2026-10-10-week5.json, BKR LV@NE NE -3.5 (home NE -3.5 -109 / away LV +3.5 -107), total 45 (O -114/U -102), ML LV +167/NE -191, captured 2026-10-10T22:26:21Z], implying roughly 24–21. The modeled script is a low-event game. The Raiders' defense is fourth in EPA/play allowed and second in pressure rate [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-defense/efficiency — EPA/PLY LV = -0.103 (rank 4/32), captured 2026-10-09T21:53:39Z] [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-defense/pass-rush — PRESS% LV = 39.5 (rank 2/32), captured 2026-10-09T21:53:39Z], facing a Patriots offense that is 30th in points per game and 30th in turnover rate [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/overview — PT/GM NE = 14.8 (rank 30/32), captured 2026-10-09T21:53:39Z] [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — TO% NE = 3.16 (rank 30/32), captured 2026-10-09T21:53:39Z]. The alternative is turnover-driven scoring that inflates the total.

**Away team (LV).** Kirk Cousins has taken every start [Source: data/vault-seed/nflverse/player_stats_weekly.csv, LV QB attempts>=10 by week: wk1 Kirk Cousins 30 att; wk2 Kirk Cousins 29 att; wk3 Kirk Cousins 33 att; wk4 Kirk Cousins 52 att]. The passing game is efficient [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/passing-analytics — EPA/DB LV = 0.161 (rank 11/32), captured 2026-10-09T21:53:39Z] and well protected by sack rate [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/pass-protection — SK% LV = 3.2 (rank 3/32), captured 2026-10-09T21:53:39Z], but the run game is 30th in EPA/attempt [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/rushing-analytics — EPA/ATT LV = -0.25 (rank 30/32), captured 2026-10-09T21:53:39Z]. Ashton Jeanty is questionable [Source: data/player-availability/latest.json#events[223], Ashton Jeanty (LV) QUESTIONABLE: "Ashton Jeanty QUESTIONABLE", published 2026-10-10T18:46Z, captured 2026-10-10T16:45:17Z]. Its 28.3 points per game on league-average EPA/play suggests short-field help that may not repeat.

**Home team (NE).** Drake Maye has made every start [Source: data/vault-seed/nflverse/player_stats_weekly.csv, NE QB attempts>=10 by week: wk1 Drake Maye 33 att; wk2 Drake Maye 22 att; wk3 Drake Maye 25 att; wk4 Drake Maye 37 att]. A.J. Brown is on IR [Source: data/player-availability/latest.json#events[31], A.J. Brown (NE) IR: "A.J. Brown IR", published 2026-10-10T23:30Z, captured 2026-10-10T16:45:17Z] and Rhamondre Stevenson is questionable [Source: data/player-availability/latest.json#events[216], Rhamondre Stevenson (NE) QUESTIONABLE: "Rhamondre Stevenson QUESTIONABLE", published 2026-10-10T18:48Z, captured 2026-10-10T16:45:17Z]. The pass defense is sixth in dropback EPA [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-defense/passing-analytics — EPA/DB NE = -0.046 (rank 6/32), captured 2026-10-09T21:53:39Z], but it now loses Christian Gonzalez and Carlton Davis III [Source: data/secondary-matchups/secondary-matchup-vulnerability-2026-w05.json#matchups[10], NE defense vs LV: scheme man_heavy,single_high; absences Dell Pettus ir; Karon Prunty out; Channing Canada out; Christian Gonzalez out; Carlton Davis III out (manual context, capped/qualitative; absences re-validated against data/player-availability/latest.json), generated 2026-10-10T17:31:50Z]. That is the second-largest absence load in the file (qualitative only).

**Matchup mechanics.** New England's missing corners help LV's passing, while its 31st-ranked run defense [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-defense/rush-analytics — EPA/ATT NE = 0.056 (rank 31/32), captured 2026-10-09T21:53:39Z] is offset by LV's inability to run. The cleanest mechanism is LV's pressure on Maye.

**Market comparison.** The market is unchanged from the open [Source: data/odds/actionnetwork-openers-2026-w05.json, Action Network 'Open' book LV@NE home line -3.5, total 45.5, recorded 2026-10-05T00:01:36Z; opener context only, pulled 2026-10-08T03:36:16Z]. The blend projects NE by 0.5 with a 42.2 total. LV +3.5 covers 58.4% and Under 45 hits 57.1%; at an 80% market weight they are 54.3% and 54.4% [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[LV@NE].simulation, blend home margin +0.52 / total 42.18; MC home cover 0.416, away cover 0.584, push 0.000, over 0.400, under 0.571; 100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z]. Both are Tier-1 quantitative candidates and are correlated, since both depend on the LV defense. Public bettors are on LV and the over [Source: data/generated/master-intel/w05-pull.json#splits[8], Action Network splits LV@NE: spread NE 28% bets/23% money, over 74%/79%, ML NE 64%/38% (context only), captured 2026-10-10T17:55:26Z]. ESPN's traced Michael Mayer pick [Source: data/generated/master-intel/w05-expert-verified.json#rows[397] (ESPN NFL; Ben Solak, Seth Walder, Matt Bowen and Mike Clay; article published 2026-10-09T12:58:29Z; verifier-row timestamp 2026-10-10T20:38; https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games), verbatim: "Michael Mayer receiving yards OVER 30.5 (-109)" — traced in data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md (captured 2026-10-09T13:05:56)] was quoted at 30.5; BKR's nearest ladder rung is 28.5.

**Thesis / counter-thesis.** [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[LV@NE].dispositions, LV +3.5 -107 BKR: P(win|no push) 58.4% vs break-even 51.7%, mkt-wt-0.8 +2.6pp → quantitative candidate; Under 45 -102 BKR: P(win|no push) 58.8% vs break-even 50.5%, mkt-wt-0.8 +3.9pp → quantitative candidate, computed from run 2026-10-10T22:55:19Z] The thesis is LV +3.5 and Under 45. The counter is that LV's points-per-game profile outruns its efficiency, and that New England's blitz rate [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-defense/pass-rush — BLZ% NE = 36.9 (rank 8/32), captured 2026-10-09T21:53:39Z] forces Cousins into mistakes. The disposition changes at LV +3 or shorter, which crosses 3 and makes it a different bet, or a total of 43.5 or lower.


---

## MIN@NO — quantitative candidate

Kickoff 2026-10-11T17:00Z · Caesars Superdome · ESPN 401872987

### 1–2. Market baseline and implied score

| Book | Spread (home line) | Total | Moneyline (away/home) | Captured |
|---|---|---|---|---|
| BKR (baseline) | NO +2.5 (-113) / MIN -2.5 (-103) | 41.5 (O -103 / U -113) | -131 / +115 (no-vig home 45.1%) | 2026-10-10T22:25:48Z |
| BEO | NO +1 (+105) / MIN (-125) | 42 | -140 / +120 | 2026-10-10T21:15:15Z |
| AN open (context) | NO +1.5 | 43.0 | — | 2026-10-05T00:30:25Z |
| SuperContest (contest) | MIN -2.5 | — | — | user-verified 2026-10-09; no capture time |

Market-implied score: MIN 22.0 – NO 19.5 (BKR).

### 3. FTN team analytics (season-to-date, Weeks 1–4)

| FTN table — field | MIN (rank) | NO (rank) |
|---|---|---|
| team-offense/efficiency — EPA/PLY | -0.119 (29) | -0.008 (15) |
| team-offense/efficiency — SUCC% | 32.5 (32) | 44.2 (13) |
| team-offense/passing-analytics — EPA/DB | -0.066 (24) | 0.025 (21) |
| team-offense/rushing-analytics — EPA/ATT | -0.185 (26) | -0.077 (16) |
| team-offense/pass-protection — PRESS% | 28.0 (14) | 33.8 (27) |
| team-offense/pass-protection — SK% | 9.8 (31) | 6.1 (19) |
| team-offense/tempo — PLY/GM | 60.0 (18) | 73.0 (2) |
| team-offense/tendencies — DPBK% | 55.0 (25) | 67.8 (3) |
| team-offense/overview — PT/GM | 20.0 (20) | 26.3 (10) |
| team-defense/efficiency — EPA/PLY | -0.184 (1) | 0.134 (30) |
| team-defense/passing-analytics — EPA/DB | -0.164 (1) | 0.171 (26) |
| team-defense/rush-analytics — EPA/ATT | -0.222 (5) | 0.088 (32) |
| team-defense/pass-rush — PRESS% | 40.9 (1) | 28.1 (20) |
| team-defense/pass-rush — SK% | 10.4 (1) | 5.8 (17) |
| team-defense/pass-rush — BLZ% | 72.1 (1) | 33.8 (9) |
| team-defense/overview — PT/GM | 14.3 (2) | 32.0 (32) |

Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, captured 2026-10-09T21:53:39Z. Ranks 1 = best (defensive EPA and offensive pressure/sack/turnover allowed ranked low-is-good).

### 4. Power ratings

| Team | Record | SRS | Net pts/g | Pythag | Model rank |
|---|---|---|---|---|---|
| MIN | 4-0 | 8.477 | 8.75 | 0.7753 | 5 |
| NO | 1-3 | -5.097 | -5.75 | 0.3848 | 24 |

Source: data/generated/team-profiles/team-power-ratings-2026.json (generated 2026-10-10T07:06:04Z; 2026 season-to-date; provenance note inconsistency G17).

### 5. Availability and role

- **MIN** QB: Partial: Wentz wk1-2, Murray wk3-4 (Murray expected; BKR prices Murray passing).
- **NO** QB: Same starting QB all 4 weeks per nflverse weekly (attempts>=10)

### 6. Weather / venue

- [Source: data/research-intel/review/2026-w05-weather-venue.json, MIN@NO weather_status venue_condition_verification_required: do_not_apply_outdoor_weather_without_current venue/roof confirmation; venue Caesars Superdome (ESPN indoor flag True), generated 2026-10-10T17:56:55Z]

### 7. Secondary-matchup context (manual, capped, qualitative)

- MIN offense vs NO defense (man_heavy, single_high; aggressive): absences David Long Jr. ir (availability re-check: absence confirmed OUT/IR/PUP); Rejzohn Wright ir (availability re-check: absence confirmed OUT/IR/PUP); Lorenzo Styles Jr. ir (availability re-check: questionable); listed targets Justin Jefferson, Jordan Addison, Jauan Jennings.
- NO offense vs MIN defense (blitz_heavy, match_zone, two_high; blitz_heavy): absences Jamal Adams ir (availability re-check: absence confirmed OUT/IR/PUP); Charles Demmings out (availability re-check: absence confirmed OUT/IR/PUP); listed targets Bryce Lance, Chris Olave, Devaughn Vele, Juwan Johnson.

### 8. Simulation

| Quantity | Blend (60/25/15) | Market-only |
|---|---|---|
| Home margin / total mean | -6.66 / 38.69 | -2.5 / 41.5 |
| NO cover +2.5 | 38.3% | 50.0% |
| MIN cover -2.5 | 61.7% | 50.0% |
| Spread push | 0.0% | 0.0% |
| Over 41.5 | 41.8% | 50.0% |
| Under 41.5 | 58.2% | 50.0% |
| NO win | 32.8% | 44.3% |

100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z. Calibration caveat: dispersion and key numbers from the pinned 2018–2025 artifact; blend weights unbacktested.

### 9. Expert / article / podcast / split evidence

- Qualified: [Source: data/generated/master-intel/w05-expert-verified.json#rows[388] (VSiN; Adam Burke; article published Fri, 09 Oct 2026 17:02:51 +0000; verifier-row timestamp 2026-10-10T20:38; https://vsin.com/nfl/nfl-player-prop-bets-for-week-5-from-adam-burke/), verbatim: "Aaron Jones (MIN) Longest Rush Over 14.5 Yards (-120)" — traced in data/research-intel/source-evidence/2026-10-10-vsin-week5-current-feed.json#records[url=https://vsin.com/nfl/nfl-player-prop-bets-for-week-5-from-adam-burke/] (captured 2026-10-10T18:25:43)]
- research_only tags (cannot set a tier): expert_feed:prop 6, expert_feed:spread 5, expert_feed:moneyline 5, expert_feed:total 2, expert_feed:teaser 1, podcast:prop 4, podcast:moneyline 3, podcast:teaser 1, podcast:total 1, podcast:spread 3, podcast:totals 1, article:prop 16, article:spread 1, article:moneyline 2; most frequent side/total tags: New Orleans Saints ×7, moneyline NO ×3, Minnesota Vikings ×2, UNDER ×2, spread UNDER 1.5 ×2, Saints ×1.
- Splits (context): [Source: data/generated/master-intel/w05-pull.json#splits[4], Action Network splits MIN@NO: spread NO 45% bets/47% money, over 76%/71%, ML NO 25%/23% (context only), captured 2026-10-10T17:55:26Z]

### 10. Disposition

| Market | Captured price | P(win|no push) | Break-even | Margin (pp) | At mkt wt 0.8 (pp) | FTN dev | SRS dev | Checks a/b/c/d | Label |
|---|---|---|---|---|---|---|---|---|---|
| NO +2.5 | -113 BKR | 38.3% | 53.0% | -14.8 | -8.9 | -10.94 | -9.47 | ✗/✗/✗/✓ | pass |
| MIN -2.5 | -103 BKR | 61.7% | 50.7% | 11.0 | 5.1 | 10.94 | 9.47 | ✓/✓/✓/✓ | quantitative candidate |
| Over 41.5 | -103 BKR | 41.8% | 50.7% | -9.0 | -5.0 | -11.25 | — | ✗/✗/✗/✓ | pass |
| Under 41.5 | -113 BKR | 58.2% | 53.0% | 5.2 | 1.2 | 11.25 | — | ✓/✓/✓/✓ | quantitative candidate |

Invalidators: [line] BKR MIN -3 or worse (crosses 3); BKR/BEO disagreement (-2.5 vs -1) must be resolved by fresh capture; [availability] second MIN OT ruled out (Darrisaw already out; O'Neill setback); [availability] Justin Jefferson / Alvin Kamara status; [line] total 40.5 or lower.


### Game state and thesis

**Game script.** The two books disagree on the number. BKR has MIN -2.5 (-103) and 41.5, and BEO has MIN -1 (-125) and 42 [Source: data/generated/props/bookmaker-live-2026-10-10-week5.json, BKR MIN@NO MIN -2.5 (home NO +2.5 -113 / away MIN -2.5 -103), total 41.5 (O -103/U -113), ML MIN -131/NO +115, captured 2026-10-10T22:25:48Z] [Source: data/generated/props/betonline-live-2026-10-10-week5.json, BEO MIN@NO home NO +1 +105 / away MIN -125, total 42, ML -140/+120, captured 2026-10-10T21:15:15Z (file-level capturedAt)]. BKR is the baseline; the 1.5-point gap is a warning. The modeled script is Minnesota's defense, first in EPA/play allowed [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-defense/efficiency — EPA/PLY MIN = -0.184 (rank 1/32), captured 2026-10-09T21:53:39Z], suppressing a New Orleans offense that plays very fast (second in plays per game [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/tempo — PLY/GM NO = 73.0 (rank 2/32), captured 2026-10-09T21:53:39Z]) but only around league average in efficiency. The alternative is the Saints' blitz-heavy front beating a battered Vikings offensive line.

**Away team (MIN).** Minnesota's offense is 29th in EPA/play and 32nd in success rate [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — EPA/PLY MIN = -0.119 (rank 29/32), captured 2026-10-09T21:53:39Z] [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — SUCC% MIN = 32.5 (rank 32/32), captured 2026-10-09T21:53:39Z]. That sample is split between Wentz and Murray [Source: data/vault-seed/nflverse/player_stats_weekly.csv, MIN QB attempts>=10 by week: wk1 Carson Wentz 19 att; wk2 Carson Wentz 20 att; wk3 Kyler Murray 29 att; wk4 Kyler Murray 37 att], with Murray expected to start. The line is depleted: Christian Darrisaw is out [Source: data/player-availability/latest.json#events[434], Christian Darrisaw (MIN) OUT: "Darrisaw (concussion) has been ruled out for Sunday's game against the Saints.", published 2026-10-10T01:48Z, captured 2026-10-10T16:45:17Z] and Jordan Mason is on IR [Source: data/player-availability/latest.json#events[27], Jordan Mason (MIN) IR: "Jordan Mason IR", published 2026-10-10T23:30Z, captured 2026-10-10T16:45:17Z]. Justin Jefferson practiced Friday and is listed questionable [Source: data/player-availability/latest.json#events[217], Justin Jefferson (MIN) QUESTIONABLE: "Justin Jefferson QUESTIONABLE", published 2026-10-10T18:48Z, captured 2026-10-10T16:45:17Z].

**Home team (NO).** Tyler Shough practiced fully and has no designation [Source: data/player-availability/latest.json#events[321], Tyler Shough (NO) UNKNOWN: "Tyler Shough UNKNOWN", published n/aZ, captured 2026-10-10T16:45:17Z]. Alvin Kamara is questionable [Source: data/player-availability/latest.json#events[214], Alvin Kamara (NO) QUESTIONABLE: "Alvin Kamara QUESTIONABLE", published 2026-10-10T18:49Z, captured 2026-10-10T16:45:17Z]. The defense is 30th in EPA/play allowed [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-defense/efficiency — EPA/PLY NO = 0.134 (rank 30/32), captured 2026-10-09T21:53:39Z]. The Superdome is indoors, so weather is not applicable [Source: data/research-intel/review/2026-w05-weather-venue.json, MIN@NO weather_status venue_condition_verification_required: do_not_apply_outdoor_weather_without_current venue/roof confirmation; venue Caesars Superdome (ESPN indoor flag True), generated 2026-10-10T17:56:55Z].

**Matchup mechanics.** New Orleans throws on two-thirds of dropback-eligible plays [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/tendencies — DPBK% NO = 67.8 (rank 3/32), captured 2026-10-09T21:53:39Z] into Minnesota's best-in-league unit, which favors MIN. Minnesota's sack rate allowed is 31st [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/pass-protection — SK% MIN = 9.8 (rank 31/32), captured 2026-10-09T21:53:39Z], which favors NO. Secondary absences on both sides are modest [Source: data/secondary-matchups/secondary-matchup-vulnerability-2026-w05.json#matchups[12], NO defense vs MIN: scheme man_heavy,single_high; absences David Long Jr. ir; Rejzohn Wright ir; Lorenzo Styles Jr. ir (manual context, capped/qualitative; absences re-validated against data/player-availability/latest.json), generated 2026-10-10T17:31:50Z].

**Market comparison.** The line opened MIN -1.5 / 43 [Source: data/odds/actionnetwork-openers-2026-w05.json, Action Network 'Open' book MIN@NO home line +1.5, total 43.0, recorded 2026-10-05T00:30:25Z; opener context only, pulled 2026-10-08T03:36:16Z]. FTN and SRS both put MIN about 12 or more points better [Source: data/generated/team-profiles/team-power-ratings-2026.json, MIN SRS 8.477, net pts/g 8.75, pythag 0.7753, record 4-0, generated 2026-10-10T07:06:04Z] [Source: data/generated/team-profiles/team-power-ratings-2026.json, NO SRS -5.097, net pts/g -5.75, pythag 0.3848, record 1-3, generated 2026-10-10T07:06:04Z]. The blend projects MIN by 6.7 with a 38.7 total: MIN -2.5 61.7% and Under 41.5 58.3%, falling to 55.9% and 54.2% at an 80% market weight [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[MIN@NO].simulation, blend home margin -6.66 / total 38.69; MC home cover 0.383, away cover 0.617, push 0.000, over 0.417, under 0.583; 100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z]. Both are Tier-1 quantitative candidates and are correlated. Research-only tags lean NO but cannot set a tier. Adam Burke's traced Aaron Jones longest-rush pick [Source: data/generated/master-intel/w05-expert-verified.json#rows[388] (VSiN; Adam Burke; article published Fri, 09 Oct 2026 17:02:51 +0000; verifier-row timestamp 2026-10-10T20:38; https://vsin.com/nfl/nfl-player-prop-bets-for-week-5-from-adam-burke/), verbatim: "Aaron Jones (MIN) Longest Rush Over 14.5 Yards (-120)" — traced in data/research-intel/source-evidence/2026-10-10-vsin-week5-current-feed.json#records[url=https://vsin.com/nfl/nfl-player-prop-bets-for-week-5-from-adam-burke/] (captured 2026-10-10T18:25:43)] has no captured BKR/BEO market.

**Thesis / counter-thesis.** [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[MIN@NO].dispositions, MIN -2.5 -103 BKR: P(win|no push) 61.7% vs break-even 50.7%, mkt-wt-0.8 +5.1pp → quantitative candidate; Under 41.5 -113 BKR: P(win|no push) 58.2% vs break-even 53.0%, mkt-wt-0.8 +1.2pp → quantitative candidate, computed from run 2026-10-10T22:55:19Z] The thesis is MIN -2.5 and the Under. The counter is that Minnesota's offensive line is the weakest unit in the game, and its strong FTN profile was partly built with a different quarterback. The disposition changes if a second Minnesota tackle is ruled out or the BKR number reaches -3.


---

## CLE@NYJ — pass

Kickoff 2026-10-11T17:00Z · MetLife Stadium · ESPN 401872983

### 1–2. Market baseline and implied score

| Book | Spread (home line) | Total | Moneyline (away/home) | Captured |
|---|---|---|---|---|
| BKR (baseline) | NYJ -2.5 (-107) / CLE +2.5 (-109) | 39.5 (O -108 / U -108) | +118 / -135 (no-vig home 55.6%) | 2026-10-10T22:26:01Z |
| BEO | NYJ -1 (-125) / CLE (+105) | 39.5 | +120 / -140 | 2026-10-10T21:15:15Z |
| AN open (context) | NYJ -1.5 | 40.0 | — | 2026-10-05T00:06:56Z |
| SuperContest (contest) | NYJ -2.5 | — | — | user-verified 2026-10-09; no capture time |

Market-implied score: NYJ 21.0 – CLE 18.5 (BKR).

### 3. FTN team analytics (season-to-date, Weeks 1–4)

| FTN table — field | CLE (rank) | NYJ (rank) |
|---|---|---|
| team-offense/efficiency — EPA/PLY | -0.017 (17) | 0.007 (12) |
| team-offense/efficiency — SUCC% | 42.2 (19) | 43.0 (16) |
| team-offense/passing-analytics — EPA/DB | 0.146 (12) | 0.137 (13) |
| team-offense/rushing-analytics — EPA/ATT | -0.275 (31) | -0.193 (27) |
| team-offense/pass-protection — PRESS% | 39.7 (31) | 23.0 (3) |
| team-offense/pass-protection — SK% | 7.8 (25) | 8.6 (27) |
| team-offense/tempo — PLY/GM | 57.5 (27) | 57.5 (26) |
| team-offense/tendencies — DPBK% | 61.3 (14) | 60.4 (16) |
| team-offense/overview — PT/GM | 20.3 (18) | 19.0 (22) |
| team-defense/efficiency — EPA/PLY | 0.016 (18) | -0.021 (12) |
| team-defense/passing-analytics — EPA/DB | 0.038 (13) | 0.076 (19) |
| team-defense/rush-analytics — EPA/ATT | -0.021 (27) | -0.149 (9) |
| team-defense/pass-rush — PRESS% | 36.6 (5) | 16.8 (32) |
| team-defense/pass-rush — SK% | 7.5 (9) | 6.3 (14) |
| team-defense/pass-rush — BLZ% | 24.2 (24) | 37.1 (7) |
| team-defense/overview — PT/GM | 23.8 (19) | 21.0 (16) |

Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, captured 2026-10-09T21:53:39Z. Ranks 1 = best (defensive EPA and offensive pressure/sack/turnover allowed ranked low-is-good).

### 4. Power ratings

| Team | Record | SRS | Net pts/g | Pythag | Model rank |
|---|---|---|---|---|---|
| CLE | 3-1 | 0.405 | -3.5 | 0.4066 | 20 |
| NYJ | 1-3 | -4.359 | -2 | 0.441 | 23 |

Source: data/generated/team-profiles/team-power-ratings-2026.json (generated 2026-10-10T07:06:04Z; 2026 season-to-date; provenance note inconsistency G17).

### 5. Availability and role

- **CLE** QB: Same starting QB all 4 weeks per nflverse weekly (attempts>=10)
- **NYJ** QB: Same starting QB all 4 weeks per nflverse weekly (attempts>=10)

### 6. Weather / venue

- [Source: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json, Open-Meteo forecast CLE@NYJ sampled 2026-10-11T17:00:00Z: 65.8°F, wind 16.6 km/h gusts 37.1 km/h dir 101°, precip prob 78% / 1.8 mm (forecast, not observation), captured 2026-10-10T17:56:55Z]

### 7. Secondary-matchup context (manual, capped, qualitative)

- CLE offense vs NYJ defense (zone_heavy, two_high, quarters; front_dependent): absences Tre Brown ir (availability re-check: absence confirmed OUT/IR/PUP); Minkah Fitzpatrick limited (availability re-check: no current absence status); listed targets Jerry Jeudy, KC Concepcion, Harold Fannin Jr..
- NYJ offense vs CLE defense (man_heavy, single_high, blitz_heavy; aggressive): absences Damarri Mathis ir (availability re-check: absence confirmed OUT/IR/PUP); listed targets Garrett Wilson, Isaiah Williams.

### 8. Simulation

| Quantity | Blend (60/25/15) | Market-only |
|---|---|---|
| Home margin / total mean | +2.31 / 40.30 | +2.5 / 39.5 |
| NYJ cover -2.5 | 49.5% | 50.0% |
| CLE cover +2.5 | 50.5% | 50.0% |
| Spread push | 0.0% | 0.0% |
| Over 39.5 | 52.5% | 50.1% |
| Under 39.5 | 47.5% | 49.9% |
| NYJ win | 54.8% | 55.3% |

100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z. Calibration caveat: dispersion and key numbers from the pinned 2018–2025 artifact; blend weights unbacktested.

### 9. Expert / article / podcast / split evidence

- Qualified: [Source: data/generated/master-intel/w05-expert-verified.json#rows[395] (ESPN NFL; Ben Solak, Seth Walder, Matt Bowen and Mike Clay; article published 2026-10-09T12:58:29Z; verifier-row timestamp 2026-10-10T20:38; https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games), verbatim: "Quinshon Judkins rushing yards UNDER 59.5 (-114)" — traced in data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md (captured 2026-10-09T13:05:56)]
- Qualified: [Source: data/generated/master-intel/w05-expert-verified.json#rows[403] (ESPN NFL; Ben Solak, Seth Walder, Matt Bowen and Mike Clay; article published 2026-10-09T12:58:29Z; verifier-row timestamp 2026-10-10T20:38; https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games), verbatim: "Geno Smith under 0.5 interceptions (+122)" — traced in data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md (captured 2026-10-09T13:05:56)]
- research_only tags (cannot set a tier): expert_feed:prop 3, expert_feed:moneyline 3, expert_feed:spread 4, expert_feed:futures 1, expert_feed:teaser 1, podcast:prop 4, podcast:spread 1, podcast:moneyline 1, podcast:teaser 2, article:prop 3, article:moneyline 2; most frequent side/total tags: New York Jets ×4, Cleveland Browns ×3, spread NYJ -1.5 ×1, moneyline CLE ×1, Jets ML | Jets ML ×1, Cleveland Browns | Browns to win (predicted 17-10) ×1.
- Splits (context): [Source: data/generated/master-intel/w05-pull.json#splits[6], Action Network splits CLE@NYJ: spread NYJ 16% bets/23% money, over 72%/59%, ML NYJ 31%/32% (context only), captured 2026-10-10T17:55:26Z]

### 10. Disposition

| Market | Captured price | P(win|no push) | Break-even | Margin (pp) | At mkt wt 0.8 (pp) | FTN dev | SRS dev | Checks a/b/c/d | Label |
|---|---|---|---|---|---|---|---|---|---|
| NYJ -2.5 | -107 BKR | 49.5% | 51.7% | -2.2 | -2.0 | 2.62 | -5.66 | ✗/✗/✗/✓ | pass |
| CLE +2.5 | -109 BKR | 50.5% | 52.1% | -1.6 | -1.9 | -2.62 | 5.66 | ✗/✗/✗/✓ | pass |
| Over 39.5 | -108 BKR | 52.5% | 51.9% | 0.6 | -0.6 | 3.19 | — | ✗/✗/✓/✓ | pass |
| Under 39.5 | -108 BKR | 47.5% | 51.9% | -4.4 | -3.2 | -3.19 | — | ✗/✗/✗/✓ | pass |

Invalidators: [weather] precipitation/wind forecast refresh (78% precip, gusts 37 km/h); [line] BKR moves to NYJ -1 (joins BEO).


### Game state and thesis

**Game script.** NYJ -2.5 (-107), total 39.5 [Source: data/generated/props/bookmaker-live-2026-10-10-week5.json, BKR CLE@NYJ NYJ -2.5 (home NYJ -2.5 -107 / away CLE +2.5 -109), total 39.5 (O -108/U -108), ML CLE +118/NYJ -135, captured 2026-10-10T22:26:01Z], implying roughly 21–18.5. BEO has NYJ only -1 [Source: data/generated/props/betonline-live-2026-10-10-week5.json, BEO CLE@NYJ home NYJ -1 -125 / away CLE +105, total 39.5, ML +120/-140, captured 2026-10-10T21:15:15Z (file-level capturedAt)]. The forecast is the main driver: a 78% chance of precipitation with gusts of 37 km/h at MetLife [Source: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json, Open-Meteo forecast CLE@NYJ sampled 2026-10-11T17:00:00Z: 65.8°F, wind 16.6 km/h gusts 37.1 km/h dir 101°, precip prob 78% / 1.8 mm (forecast, not observation), captured 2026-10-10T17:56:55Z]. That points to a grinding, run-first game. The alternative is a turnover-driven swing in the rain.

**Away team (CLE).** Deshaun Watson has started every game [Source: data/vault-seed/nflverse/player_stats_weekly.csv, CLE QB attempts>=10 by week: wk1 Deshaun Watson 22 att; wk2 Deshaun Watson 30 att; wk3 Deshaun Watson 30 att; wk4 Deshaun Watson 33 att]. The Browns' dropback EPA is respectable [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/passing-analytics — EPA/DB CLE = 0.146 (rank 12/32), captured 2026-10-09T21:53:39Z], but they allow the second-highest pressure rate [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/pass-protection — PRESS% CLE = 39.7 (rank 31/32), captured 2026-10-09T21:53:39Z] and are 31st in rushing EPA [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/rushing-analytics — EPA/ATT CLE = -0.275 (rank 31/32), captured 2026-10-09T21:53:39Z]. Mason Graham is out [Source: data/player-availability/latest.json#events[473], Mason Graham (CLE) OUT: "Graham (knee/ankle) has been ruled out ahead of Sunday's game against the Jets, Daniel Oyefusi of ESPN.com reports.", published 2026-10-10T00:17Z, captured 2026-10-10T16:45:17Z].

**Home team (NYJ).** Geno Smith has started every game [Source: data/vault-seed/nflverse/player_stats_weekly.csv, NYJ QB attempts>=10 by week: wk1 Geno Smith 24 att; wk2 Geno Smith 41 att; wk3 Geno Smith 37 att; wk4 Geno Smith 15 att] and the offense avoids turnovers [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — TO% NYJ = 0.43 (rank 4/32), captured 2026-10-09T21:53:39Z]. Breece Hall is out [Source: data/player-availability/latest.json#events[212], Breece Hall (NYJ) OUT: "Breece Hall OUT", published 2026-10-10T18:49Z, captured 2026-10-10T16:45:17Z]. The Jets' run defense allowed a 232-yard rushing game in Week 4, which ESPN's write-up discounts as game-script driven [Source: data/generated/master-intel/w05-expert-verified.json#rows[395] (ESPN NFL; Ben Solak, Seth Walder, Matt Bowen and Mike Clay; article published 2026-10-09T12:58:29Z; verifier-row timestamp 2026-10-10T20:38; https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games), verbatim: "Quinshon Judkins rushing yards UNDER 59.5 (-114)" — traced in data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md (captured 2026-10-09T13:05:56)].

**Matchup mechanics.** The question is whether Cleveland can run at all. Quinshon Judkins's 2026 game log is 33, 21, 70 and 53 yards [Source: data/vault-seed/nflverse/player_stats_weekly.csv, 2026 Quinshon Judkins rushing_yards by week: wk1 33, wk2 21, wk3 70, wk4 53; file through week 4, mtime 2026-10-06T18:44:56Z], so ESPN's traced Under 59.5 pick has 2026 usage support. Neither BKR nor BEO captured that market at that number. ESPN's traced Geno Smith interceptions-under pick [Source: data/generated/master-intel/w05-expert-verified.json#rows[403] (ESPN NFL; Ben Solak, Seth Walder, Matt Bowen and Mike Clay; article published 2026-10-09T12:58:29Z; verifier-row timestamp 2026-10-10T20:38; https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games), verbatim: "Geno Smith under 0.5 interceptions (+122)" — traced in data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md (captured 2026-10-09T13:05:56)] is also uncaptured.

**Market comparison.** The line opened NYJ -1.5 / 40 [Source: data/odds/actionnetwork-openers-2026-w05.json, Action Network 'Open' book CLE@NYJ home line -1.5, total 40.0, recorded 2026-10-05T00:06:56Z; opener context only, pulled 2026-10-08T03:36:16Z]. FTN and SRS point in opposite directions (FTN NYJ by 5, SRS CLE by 3). The blend lands almost exactly on the market: NYJ -2.5 49.5% and Over 39.5 52.5% [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[CLE@NYJ].simulation, blend home margin +2.31 / total 40.30; MC home cover 0.495, away cover 0.505, push 0.000, over 0.525, under 0.475; 100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z]. Bettors are heavily on CLE [Source: data/generated/master-intel/w05-pull.json#splits[6], Action Network splits CLE@NYJ: spread NYJ 16% bets/23% money, over 72%/59%, ML NYJ 31%/32% (context only), captured 2026-10-10T17:55:26Z].

**Thesis / counter-thesis.** [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[CLE@NYJ].dispositions, Over 39.5 -108 BKR: P(win|no push) 52.5% vs break-even 51.9%, mkt-wt-0.8 -0.6pp → pass, computed from run 2026-10-10T22:55:19Z] Pass. There is no model disagreement with the market, and the weather increases variance without a direction the model can price. The counter-thesis to any CLE lean is the Jets' turnover avoidance in poor conditions. The disposition changes if the BKR number moves to NYJ -1, joining BEO, and FTN's NYJ edge then clears the thresholds, or if the precipitation forecast hardens enough that a weather-driven Under thesis is worth refreshing.


---

## IND@PIT — quantitative candidate

Kickoff 2026-10-11T17:00Z · Acrisure Stadium · ESPN 401872985

### 1–2. Market baseline and implied score

| Book | Spread (home line) | Total | Moneyline (away/home) | Captured |
|---|---|---|---|---|
| BKR (baseline) | PIT -3 (+103) / IND +3 (-118) | 43.5 (O -108 / U -108) | +126 / -145 (no-vig home 57.2%) | 2026-10-10T22:25:39Z |
| BEO | PIT -2.5 (-115) / IND (-105) | 43.5 | +128 / -148 | 2026-10-10T21:15:15Z |
| AN open (context) | PIT -2.5 | 44.5 | — | 2026-10-05T00:08:55Z |
| SuperContest (contest) | PIT -2.5 | — | — | user-verified 2026-10-09; no capture time |

Market-implied score: PIT 23.25 – IND 20.25 (BKR).

### 3. FTN team analytics (season-to-date, Weeks 1–4)

| FTN table — field | IND (rank) | PIT (rank) |
|---|---|---|
| team-offense/efficiency — EPA/PLY | -0.066 (24) | -0.115 (28) |
| team-offense/efficiency — SUCC% | 42.7 (18) | 40.2 (25) |
| team-offense/passing-analytics — EPA/DB | -0.205 (31) | -0.147 (29) |
| team-offense/rushing-analytics — EPA/ATT | 0.119 (2) | -0.051 (10) |
| team-offense/pass-protection — PRESS% | 27.1 (11) | 26.2 (8) |
| team-offense/pass-protection — SK% | 5.6 (16) | 7.6 (24) |
| team-offense/tempo — PLY/GM | 63.3 (13) | 64.0 (9) |
| team-offense/tendencies — DPBK% | 56.9 (23) | 67.2 (5) |
| team-offense/overview — PT/GM | 25.5 (12) | 16.3 (29) |
| team-defense/efficiency — EPA/PLY | 0.059 (25) | -0.001 (16) |
| team-defense/passing-analytics — EPA/DB | 0.109 (23) | 0.054 (16) |
| team-defense/rush-analytics — EPA/ATT | -0.017 (28) | -0.074 (18) |
| team-defense/pass-rush — PRESS% | 23.5 (29) | 23.8 (28) |
| team-defense/pass-rush — SK% | 5.9 (16) | 7.7 (8) |
| team-defense/pass-rush — BLZ% | 20.3 (30) | 28.5 (18) |
| team-defense/overview — PT/GM | 26.0 (23) | 18.8 (9) |

Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, captured 2026-10-09T21:53:39Z. Ranks 1 = best (defensive EPA and offensive pressure/sack/turnover allowed ranked low-is-good).

### 4. Power ratings

| Team | Record | SRS | Net pts/g | Pythag | Model rank |
|---|---|---|---|---|---|
| IND | 2-2 | -2.243 | -0.5 | 0.4885 | 15 |
| PIT | 2-2 | -0.624 | -2.5 | 0.4282 | 19 |

Source: data/generated/team-profiles/team-power-ratings-2026.json (generated 2026-10-10T07:06:04Z; 2026 season-to-date; provenance note inconsistency G17).

### 5. Availability and role

- **IND** QB: Same starting QB all 4 weeks per nflverse weekly (attempts>=10)
- **PIT** QB: Same starting QB all 4 weeks per nflverse weekly (attempts>=10)

### 6. Weather / venue

- [Source: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json, Open-Meteo forecast IND@PIT sampled 2026-10-11T17:00:00Z: 64.4°F, wind 25.2 km/h gusts 58 km/h dir 118°, precip prob 54% / 0 mm (forecast, not observation), captured 2026-10-10T17:56:55Z]

### 7. Secondary-matchup context (manual, capped, qualitative)

- IND offense vs PIT defense (man_heavy, single_high, blitz_heavy; aggressive): absences Israel Mukuamu ir (availability re-check: name not on roster — unverified); Donte Kent pup (availability re-check: absence confirmed OUT/IR/PUP); Jamel Dean out (availability re-check: absence confirmed OUT/IR/PUP); DeShon Elliott ir (availability re-check: absence confirmed OUT/IR/PUP); Jalen Ramsey limited (availability re-check: questionable); listed targets Josh Downs, Keenan Allen.
- PIT offense vs IND defense (zone_heavy, single_high; coverage_first): absences Cameron Mitchell ir (availability re-check: absence confirmed OUT/IR/PUP); listed targets DK Metcalf, Roman Wilson.

### 8. Simulation

| Quantity | Blend (60/25/15) | Market-only |
|---|---|---|
| Home margin / total mean | +2.85 / 41.53 | +3 / 43.5 |
| PIT cover -3 | 44.8% | 45.1% |
| IND cover +3 | 45.3% | 45.1% |
| Spread push | 9.9% | 9.7% |
| Over 43.5 | 44.1% | 50.0% |
| Under 43.5 | 55.9% | 50.0% |
| PIT win | 59.9% | 60.1% |

100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z. Calibration caveat: dispersion and key numbers from the pinned 2018–2025 artifact; blend weights unbacktested.

### 9. Expert / article / podcast / split evidence

- Qualified: [Source: data/generated/master-intel/w05-expert-verified.json#rows[387] (VSiN; Adam Burke; article published Fri, 09 Oct 2026 17:02:51 +0000; verifier-row timestamp 2026-10-10T20:38; https://vsin.com/nfl/nfl-player-prop-bets-for-week-5-from-adam-burke/), verbatim: "Daniel Jones (IND) Under 209.5 Passing Yards (-111)" — traced in data/research-intel/source-evidence/2026-10-10-vsin-week5-current-feed.json#records[url=https://vsin.com/nfl/nfl-player-prop-bets-for-week-5-from-adam-burke/] (captured 2026-10-10T18:25:43)]
- Qualified: [Source: data/generated/master-intel/w05-expert-verified.json#rows[390] (ESPN NFL; Ben Solak, Seth Walder, Matt Bowen and Mike Clay; article published 2026-10-09T12:58:29Z; verifier-row timestamp 2026-10-10T20:38; https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games), verbatim: "Picks: Steelers -2.5 (-118), Under 44.5 (-118)" — traced in data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md (captured 2026-10-09T13:05:56)]
- Qualified: [Source: data/generated/master-intel/w05-expert-verified.json#rows[391] (ESPN NFL; Ben Solak, Seth Walder, Matt Bowen and Mike Clay; article published 2026-10-09T12:58:29Z; verifier-row timestamp 2026-10-10T20:38; https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games), verbatim: "Top prop: Jonathan Taylor rushing + receiving yards OVER 105.5 (-114)" — traced in data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md (captured 2026-10-09T13:05:56)]
- research_only tags (cannot set a tier): expert_feed:prop 7, expert_feed:spread 3, expert_feed:moneyline 3, expert_feed:teaser 1, expert_feed:total 1, podcast:prop 3, podcast:spread 1, podcast:total 1, podcast:teaser 2, podcast:totals 1, article:prop 2, article:spread 2, article:moneyline 1; most frequent side/total tags: Pittsburgh Steelers ×5, Steelers -2.5 | Steelers -2.5 ×2, Indianapolis Colts ×1, OVER ×1, spread PIT -2.5 ×1, total OVER 44.5 ×1.
- Splits (context): [Source: data/generated/master-intel/w05-pull.json#splits[7], Action Network splits IND@PIT: spread PIT 36% bets/43% money, over 72%/58%, ML PIT 59%/76% (context only), captured 2026-10-10T17:55:26Z]

### 10. Disposition

| Market | Captured price | P(win|no push) | Break-even | Margin (pp) | At mkt wt 0.8 (pp) | FTN dev | SRS dev | Checks a/b/c/d | Label |
|---|---|---|---|---|---|---|---|---|---|
| PIT -3 | +103 BKR | 49.7% | 49.3% | 0.4 | 0.5 | -0.74 | 0.23 | ✗/✓/✗/✓ | pass |
| IND +3 | -118 BKR | 50.3% | 54.1% | -3.8 | -3.9 | 0.74 | -0.23 | ✗/✗/✗/✓ | pass |
| Over 43.5 | -108 BKR | 44.1% | 51.9% | -7.8 | -4.9 | -7.9 | — | ✗/✗/✗/✓ | pass |
| Under 43.5 | -108 BKR | 55.9% | 51.9% | 4.0 | 1.0 | 7.9 | — | ✓/✓/✓/✓ | quantitative candidate |

Invalidators: [weather] forecast clears (wind < 20 km/h, precip < 30%) -> removes qualitative support; [line] total 42 or lower; [availability] Jonathan Taylor status.


### Game state and thesis

**Game script.** PIT -3 (+103) / IND +3 (-118), total 43.5 [Source: data/generated/props/bookmaker-live-2026-10-10-week5.json, BKR IND@PIT PIT -3 (home PIT -3 +103 / away IND +3 -118), total 43.5 (O -108/U -108), ML IND +126/PIT -145, captured 2026-10-10T22:25:39Z], implying roughly 23–20; BEO has PIT -2.5 (-115) [Source: data/generated/props/betonline-live-2026-10-10-week5.json, BEO IND@PIT home PIT -2.5 -115 / away IND -105, total 43.5, ML +128/-148, captured 2026-10-10T21:15:15Z (file-level capturedAt)]. The modeled script is a low-efficiency game in poor weather: sustained wind of 25 km/h, gusts to 58 km/h and a 54% chance of rain at Acrisure [Source: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json, Open-Meteo forecast IND@PIT sampled 2026-10-11T17:00:00Z: 64.4°F, wind 25.2 km/h gusts 58 km/h dir 118°, precip prob 54% / 0 mm (forecast, not observation), captured 2026-10-10T17:56:55Z], which is the most material forecast on the slate. Both passing offenses are already bottom five by dropback EPA [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/passing-analytics — EPA/DB IND = -0.205 (rank 31/32), captured 2026-10-09T21:53:39Z] [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/passing-analytics — EPA/DB PIT = -0.147 (rank 29/32), captured 2026-10-09T21:53:39Z]. The alternative is turnovers creating short fields: the Colts are 28th in turnover rate [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — TO% IND = 2.77 (rank 28/32), captured 2026-10-09T21:53:39Z].

**Away team (IND).** Daniel Jones has started every game [Source: data/vault-seed/nflverse/player_stats_weekly.csv, IND QB attempts>=10 by week: wk1 Daniel Jones 31 att; wk2 Daniel Jones 31 att; wk3 Daniel Jones 36 att; wk4 Daniel Jones 34 att]. The Colts' identity is the run game, second in rushing EPA/attempt [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/rushing-analytics — EPA/ATT IND = 0.119 (rank 2/32), captured 2026-10-09T21:53:39Z], built on Jonathan Taylor [Source: data/vault-seed/nflverse/player_stats_weekly.csv, 2026 Jonathan Taylor rushing_yards+receiving_yards by week: wk1 121, wk2 132, wk3 72, wk4 97; file through week 4, mtime 2026-10-06T18:44:56Z]. Alec Pierce is on IR [Source: data/player-availability/latest.json#events[180], Alec Pierce (IND) IR: "Alec Pierce IR", published 2026-10-10T23:30Z, captured 2026-10-10T16:45:17Z].

**Home team (PIT).** Aaron Rodgers has started every game [Source: data/vault-seed/nflverse/player_stats_weekly.csv, PIT QB attempts>=10 by week: wk1 Aaron Rodgers 40 att; wk2 Aaron Rodgers 39 att; wk3 Aaron Rodgers 34 att; wk4 Aaron Rodgers 40 att]. Pittsburgh's offense is 28th in EPA/play [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — EPA/PLY PIT = -0.115 (rank 28/32), captured 2026-10-09T21:53:39Z]. Pittsburgh's secondary is missing Jamel Dean and DeShon Elliott [Source: data/secondary-matchups/secondary-matchup-vulnerability-2026-w05.json#matchups[16], PIT defense vs IND: scheme man_heavy,single_high,blitz_heavy; absences Israel Mukuamu ir; Donte Kent pup; Jamel Dean out; DeShon Elliott ir; Jalen Ramsey limited (manual context, capped/qualitative; absences re-validated against data/player-availability/latest.json), generated 2026-10-10T17:31:50Z], which helps Indianapolis receivers, but wind limits that edge.

**Matchup mechanics.** Wind and rain [Source: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json, Open-Meteo forecast IND@PIT sampled 2026-10-11T17:00:00Z: 64.4°F, wind 25.2 km/h gusts 58 km/h dir 118°, precip prob 54% / 0 mm (forecast, not observation), captured 2026-10-10T17:56:55Z] push both teams toward the run, and Taylor's volume [Source: data/vault-seed/nflverse/player_stats_weekly.csv, 2026 Jonathan Taylor rushing_yards+receiving_yards by week: wk1 121, wk2 132, wk3 72, wk4 97; file through week 4, mtime 2026-10-06T18:44:56Z] shortens the game. That supports the Under more than either side.

**Market comparison.** The line opened PIT -2.5 / 44.5 [Source: data/odds/actionnetwork-openers-2026-w05.json, Action Network 'Open' book IND@PIT home line -2.5, total 44.5, recorded 2026-10-05T00:08:55Z; opener context only, pulled 2026-10-08T03:36:16Z]. The blend projects PIT by 2.8 with a 41.5 total. The side is flat because 3 is the most common margin: a push is 9.9% [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[IND@PIT].simulation, blend home margin +2.85 / total 41.53; MC home cover 0.448, away cover 0.453, push 0.099, over 0.441, under 0.559; 100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z]. Under 43.5 hits 55.9% of draws, about 4 points over break-even, and holds at the 80% market weight by only 1 point. It is a thin Tier-1 candidate. ESPN's traced pick was Under 44.5 [Source: data/generated/master-intel/w05-expert-verified.json#rows[390] (ESPN NFL; Ben Solak, Seth Walder, Matt Bowen and Mike Clay; article published 2026-10-09T12:58:29Z; verifier-row timestamp 2026-10-10T20:38; https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games), verbatim: "Picks: Steelers -2.5 (-118), Under 44.5 (-118)" — traced in data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md (captured 2026-10-09T13:05:56)]. The total has since dropped a point, so that support is downgraded. Adam Burke's traced Daniel Jones Under 209.5 passing yards [Source: data/generated/master-intel/w05-expert-verified.json#rows[387] (VSiN; Adam Burke; article published Fri, 09 Oct 2026 17:02:51 +0000; verifier-row timestamp 2026-10-10T20:38; https://vsin.com/nfl/nfl-player-prop-bets-for-week-5-from-adam-burke/), verbatim: "Daniel Jones (IND) Under 209.5 Passing Yards (-111)" — traced in data/research-intel/source-evidence/2026-10-10-vsin-week5-current-feed.json#records[url=https://vsin.com/nfl/nfl-player-prop-bets-for-week-5-from-adam-burke/] (captured 2026-10-10T18:25:43)] cites the weather, and Jones's 2026 log is 166, 210, 235 and 143 [Source: data/vault-seed/nflverse/player_stats_weekly.csv, 2026 Daniel Jones passing_yards by week: wk1 166, wk2 210, wk3 235, wk4 143; file through week 4, mtime 2026-10-06T18:44:56Z]. That market was not captured at BKR or BEO.

**Thesis / counter-thesis.** [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[IND@PIT].dispositions, Under 43.5 -108 BKR: P(win|no push) 55.9% vs break-even 51.9%, mkt-wt-0.8 +1.0pp → quantitative candidate, computed from run 2026-10-10T22:55:19Z] The thesis is Under 43.5. The counter is short-field scoring from turnovers. The disposition changes if the forecast clears before kickoff, which would remove the weather support, or if the total falls to 42 or lower and the remaining model margin disappears.


---

## NYG@WAS — conflicted

Kickoff 2026-10-11T17:00Z · Northwest Stadium · ESPN 401872988

### 1–2. Market baseline and implied score

| Book | Spread (home line) | Total | Moneyline (away/home) | Captured |
|---|---|---|---|---|
| BKR (baseline) | WAS -3.5 (-108) / NYG +3.5 (-108) | 41.5 (O -103 / U -113) | +159 / -182 (no-vig home 62.6%) | 2026-10-10T22:26:30Z |
| BEO | WAS -3.5 (-111) / NYG (-109) | 41.5 | +161 / -185 | 2026-10-10T21:15:15Z |
| AN open (context) | WAS -3.5 | 44.5 | — | 2026-10-05T00:12:55Z |
| SuperContest (contest) | WAS -3.5 | — | — | user-verified 2026-10-09; no capture time |

Market-implied score: WAS 22.5 – NYG 19.0 (BKR).

### 3. FTN team analytics (season-to-date, Weeks 1–4)

| FTN table — field | NYG (rank) | WAS (rank) |
|---|---|---|
| team-offense/efficiency — EPA/PLY | -0.058 (23) | -0.051 (22) |
| team-offense/efficiency — SUCC% | 39.3 (26) | 38.3 (29) |
| team-offense/passing-analytics — EPA/DB | 0.028 (19) | 0.031 (18) |
| team-offense/rushing-analytics — EPA/ATT | -0.152 (21) | -0.174 (24) |
| team-offense/pass-protection — PRESS% | 33.1 (25) | 34.4 (28) |
| team-offense/pass-protection — SK% | 8.7 (29) | 3.2 (4) |
| team-offense/tempo — PLY/GM | 61.0 (17) | 65.3 (8) |
| team-offense/tendencies — DPBK% | 52.0 (28) | 60.2 (17) |
| team-offense/overview — PT/GM | 19.0 (23) | 20.5 (17) |
| team-defense/efficiency — EPA/PLY | -0.003 (15) | 0.031 (19) |
| team-defense/passing-analytics — EPA/DB | 0.034 (12) | 0.101 (22) |
| team-defense/rush-analytics — EPA/ATT | -0.063 (20) | -0.094 (17) |
| team-defense/pass-rush — PRESS% | 27.1 (21) | 25.7 (25) |
| team-defense/pass-rush — SK% | 2.1 (31) | 4.6 (22) |
| team-defense/pass-rush — BLZ% | 33.3 (10) | 47.4 (2) |
| team-defense/overview — PT/GM | 18.3 (8) | 29.0 (30) |

Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, captured 2026-10-09T21:53:39Z. Ranks 1 = best (defensive EPA and offensive pressure/sack/turnover allowed ranked low-is-good).

### 4. Power ratings

| Team | Record | SRS | Net pts/g | Pythag | Model rank |
|---|---|---|---|---|---|
| NYG | 3-1 | -4.141 | 0.75 | 0.5221 | 14 |
| WAS | 1-3 | -11.37 | -8.5 | 0.3156 | 30 |

Source: data/generated/team-profiles/team-power-ratings-2026.json (generated 2026-10-10T07:06:04Z; 2026 season-to-date; provenance note inconsistency G17).

### 5. Availability and role

- **NYG** QB: Partial: Dart wk1 (now IR), Winston wk2-4 (Winston expected).
- **WAS** QB: QB change: Daniels wk1-2, Mariota wk2-3, Kaliakmanis wk4; Daniels confirmed Wk5 starter (Quinn, availability row 2026-10-09). FTN/SRS sample mostly backups.

- **Structural staleness:** WAS — FTN/SRS do not describe the Week 5 starting QB; Tier 1 barred.

### 6. Weather / venue

- [Source: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json, Open-Meteo forecast NYG@WAS sampled 2026-10-11T17:00:00Z: 68.4°F, wind 12.8 km/h gusts 26.3 km/h dir 113°, precip prob 72% / 0 mm (forecast, not observation), captured 2026-10-10T17:56:55Z]

### 7. Secondary-matchup context (manual, capped, qualitative)

- NYG offense vs WAS defense (zone_heavy, two_high; passive): absences Tyler Owens out (availability re-check: absence confirmed OUT/IR/PUP); Percy Butler out (availability re-check: absence confirmed OUT/IR/PUP); Trey Amos ir (availability re-check: questionable); Nick Cross out (availability re-check: absence confirmed OUT/IR/PUP); listed targets Malik Nabers, Isaiah Likely.
- WAS offense vs NYG defense (man_heavy, blitz_heavy; blitz_heavy): absences Paulson Adebo ir (availability re-check: absence confirmed OUT/IR/PUP); Jarrick Bernard-Converse ir (availability re-check: absence confirmed OUT/IR/PUP); Thaddeus Dixon ir (availability re-check: absence confirmed OUT/IR/PUP); Jason Pinnock out (availability re-check: absence confirmed OUT/IR/PUP); listed targets Terry McLaurin, Antonio Williams.

### 8. Simulation

| Quantity | Blend (60/25/15) | Market-only |
|---|---|---|
| Home margin / total mean | +1.18 / 40.69 | +3.5 / 41.5 |
| WAS cover -3.5 | 43.3% | 50.0% |
| NYG cover +3.5 | 56.7% | 50.0% |
| Spread push | 0.0% | 0.0% |
| Over 41.5 | 47.2% | 50.0% |
| Under 41.5 | 52.8% | 50.0% |
| WAS win | 58.2% | 64.7% |

100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z. Calibration caveat: dispersion and key numbers from the pinned 2018–2025 artifact; blend weights unbacktested.

### 9. Expert / article / podcast / split evidence

- Qualified: [Source: data/generated/master-intel/w05-expert-verified.json#rows[394] (ESPN NFL; Ben Solak, Seth Walder, Matt Bowen and Mike Clay; article published 2026-10-09T12:58:29Z; verifier-row timestamp 2026-10-10T20:38; https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games), verbatim: "Washington Commanders -3.5 vs. New York Giants" — traced in data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md (captured 2026-10-09T13:05:56)]
- research_only tags (cannot set a tier): expert_feed:prop 3, expert_feed:teaser 1, expert_feed:spread 4, podcast:prop 4, podcast:spread 6, article:prop 5, article:spread 2, article:moneyline 1; most frequent side/total tags: New York Giants ×2, spread WAS -3.5 ×2, spread NYG 3.5 ×2, Giants ×1, Washington Commanders ×1, spread NYG 3 ×1.
- Splits (context): [Source: data/generated/master-intel/w05-pull.json#splits[2], Action Network splits NYG@WAS: spread WAS 28% bets/27% money, over 77%/62%, ML WAS 55%/50% (context only), captured 2026-10-10T17:55:26Z]

### 10. Disposition

| Market | Captured price | P(win|no push) | Break-even | Margin (pp) | At mkt wt 0.8 (pp) | FTN dev | SRS dev | Checks a/b/c/d | Label |
|---|---|---|---|---|---|---|---|---|---|
| WAS -3.5 | -108 BKR | 43.3% | 51.9% | -8.6 | -5.2 | -3.81 | -9.12 | ✗/✗/✗/✗ | pass |
| NYG +3.5 | -108 BKR | 56.7% | 51.9% | 4.8 | 1.4 | 3.81 | 9.12 | ✓/✓/✓/✗ | conflicted |
| Over 41.5 | -103 BKR | 47.2% | 50.7% | -3.5 | -1.9 | -3.23 | — | ✗/✗/✗/✗ | pass |
| Under 41.5 | -113 BKR | 52.8% | 53.0% | -0.3 | -1.9 | 3.23 | — | ✗/✗/✓/✗ | pass |

Invalidators: [availability] Terry McLaurin ruled out; [availability] Jayden Daniels limited/inactive; [line] WAS -3 (onto key number); [evidence] structural QB staleness in FTN/SRS (WAS).


### Game state and thesis

**Game script.** WAS -3.5 (-108), total 41.5 [Source: data/generated/props/bookmaker-live-2026-10-10-week5.json, BKR NYG@WAS WAS -3.5 (home WAS -3.5 -108 / away NYG +3.5 -108), total 41.5 (O -103/U -113), ML NYG +159/WAS -182, captured 2026-10-10T22:26:30Z]. The total has dropped three points from a 44.5 open [Source: data/odds/actionnetwork-openers-2026-w05.json, Action Network 'Open' book NYG@WAS home line -3.5, total 44.5, recorded 2026-10-05T00:12:55Z; opener context only, pulled 2026-10-08T03:36:16Z], with a 72% chance of rain [Source: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json, Open-Meteo forecast NYG@WAS sampled 2026-10-11T17:00:00Z: 68.4°F, wind 12.8 km/h gusts 26.3 km/h dir 113°, precip prob 72% / 0 mm (forecast, not observation), captured 2026-10-10T17:56:55Z]. The expected script is Jayden Daniels returning to a Washington offense run by backups, against a Giants offense 31st in explosive-play rate [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — EXP% NYG = 6.1 (rank 31/32), captured 2026-10-09T21:53:39Z]. The alternative is Daniels limited by the elbow and the game turning on Winston turnovers.

**Away team (NYG).** Jameis Winston has started weeks 2–4 [Source: data/vault-seed/nflverse/player_stats_weekly.csv, NYG QB attempts>=10 by week: wk1 Jaxson Dart 29 att; wk2 Jameis Winston 27 att; wk3 Jameis Winston 22 att; wk4 Jameis Winston 29 att], and Jaxson Dart is on IR [Source: data/player-availability/latest.json#events[52], Jaxson Dart (NYG) IR: "Jaxson Dart IR", published 2026-10-10T23:30Z, captured 2026-10-10T16:45:17Z]. Malik Nabers practiced Friday on a sore knee [Source: data/player-availability/latest.json#events[327], Malik Nabers (NYG) UNKNOWN: "Malik Nabers UNKNOWN", published n/aZ, captured 2026-10-10T16:45:17Z]. The Giants' 3-1 record overstates their efficiency [Source: data/generated/team-profiles/team-power-ratings-2026.json, NYG SRS -4.141, net pts/g 0.75, pythag 0.5221, record 3-1, generated 2026-10-10T07:06:04Z].

**Home team (WAS).** Head coach Dan Quinn confirmed Daniels will start [Source: data/player-availability/latest.json#events[371], Jayden Daniels (WAS) UNKNOWN: "Jayden Daniels UNKNOWN", published n/aZ, captured 2026-10-10T16:45:17Z], and Marcus Mariota is out [Source: data/player-availability/latest.json#events[523], Marcus Mariota (WAS) OUT: "Mariota (knee) has been ruled out for Sunday's game against the Giants.", published 2026-10-09T21:35Z, captured 2026-10-10T16:45:17Z]. Terry McLaurin is questionable with a hamstring [Source: data/player-availability/latest.json#events[204], Terry McLaurin (WAS) QUESTIONABLE: "Terry McLaurin QUESTIONABLE", published 2026-10-10T18:52Z, captured 2026-10-10T16:45:17Z]. Washington's 2026 quarterback history is Daniels, Daniels/Mariota, Mariota, Kaliakmanis [Source: data/vault-seed/nflverse/player_stats_weekly.csv, WAS QB attempts>=10 by week: wk1 Jayden Daniels 34 att; wk2 Jayden Daniels 17 att; wk2 Marcus Mariota 16 att; wk3 Marcus Mariota 31 att; wk4 Athan Kaliakmanis 33 att]. That means its offensive efficiency [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — EPA/PLY WAS = -0.051 (rank 22/32), captured 2026-10-09T21:53:39Z] and power rating [Source: data/generated/team-profiles/team-power-ratings-2026.json, WAS SRS -11.37, net pts/g -8.5, pythag 0.3156, record 1-3, generated 2026-10-10T07:06:04Z] mostly measure backups.

**Matchup mechanics.** Washington blitzes at the second-highest rate in the league [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-defense/pass-rush — BLZ% WAS = 47.4 (rank 2/32), captured 2026-10-09T21:53:39Z], and that pressure against Winston's interception risk is the mechanism ESPN's traced pick relies on: [Source: data/generated/master-intel/w05-expert-verified.json#rows[394] (ESPN NFL; Ben Solak, Seth Walder, Matt Bowen and Mike Clay; article published 2026-10-09T12:58:29Z; verifier-row timestamp 2026-10-10T20:38; https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games), verbatim: "Washington Commanders -3.5 vs. New York Giants" — traced in data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md (captured 2026-10-09T13:05:56)]. The manual secondary file tags that coverage "passive" [Source: data/secondary-matchups/secondary-matchup-vulnerability-2026-w05.json#matchups[18], WAS defense vs NYG: scheme zone_heavy,two_high; absences Tyler Owens out; Percy Butler out; Trey Amos ir; Nick Cross out (manual context, capped/qualitative; absences re-validated against data/player-availability/latest.json), generated 2026-10-10T17:31:50Z]; FTN's measured rate is used and the conflict is recorded.

**Market comparison.** The blend projects WAS by only about 1, with NYG +3.5 at 56.7% [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[NYG@WAS].simulation, blend home margin +1.18 / total 40.69; MC home cover 0.433, away cover 0.567, push 0.000, over 0.472, under 0.528; 100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z]. That rests on FTN and SRS samples without Daniels, so it is structurally stale and excluded from Tier 1. The only qualified named-expert pick, ESPN's WAS -3.5, sits on the other side. Bettors favor NYG [Source: data/generated/master-intel/w05-pull.json#splits[2], Action Network splits NYG@WAS: spread WAS 28% bets/27% money, over 77%/62%, ML WAS 55%/50% (context only), captured 2026-10-10T17:55:26Z].

**Thesis / counter-thesis.** [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[NYG@WAS].dispositions, NYG +3.5 -108 BKR: P(win|no push) 56.7% vs break-even 51.9%, mkt-wt-0.8 +1.4pp → conflicted, computed from run 2026-10-10T22:55:19Z] The label is conflicted. The counter to a WAS lean is that Daniels's elbow and McLaurin's hamstring may limit the passing game in rain. The label changes if McLaurin is ruled out, which favors NYG, or if the line reaches WAS -3, which makes it a different bet and turns the ESPN pick into a price-moved row.


---

## DEN@LAC — quantitative candidate

Kickoff 2026-10-11T20:05Z · SoFi Stadium · ESPN 401872989

### 1–2. Market baseline and implied score

| Book | Spread (home line) | Total | Moneyline (away/home) | Captured |
|---|---|---|---|---|
| BKR (baseline) | LAC +3.5 (-103) / DEN -3.5 (-113) | 42 (O -114 / U -102) | -194 / +170 (no-vig home 35.9%) | 2026-10-10T22:26:52Z |
| BEO | LAC +3.5 (-108) / DEN (-112) | 42 | -180 / +157 | 2026-10-10T21:15:15Z |
| AN open (context) | LAC +3.5 | 43.5 | — | 2026-10-05T00:12:55Z |
| SuperContest (contest) | DEN -3.5 | — | — | user-verified 2026-10-09; no capture time |

Market-implied score: DEN 22.75 – LAC 19.25 (BKR).

### 3. FTN team analytics (season-to-date, Weeks 1–4)

| FTN table — field | DEN (rank) | LAC (rank) |
|---|---|---|
| team-offense/efficiency — EPA/PLY | -0.023 (18) | -0.159 (32) |
| team-offense/efficiency — SUCC% | 40.9 (23) | 40.4 (24) |
| team-offense/passing-analytics — EPA/DB | -0.005 (22) | -0.151 (30) |
| team-offense/rushing-analytics — EPA/ATT | -0.053 (12) | -0.17 (22) |
| team-offense/pass-protection — PRESS% | 31.3 (21) | 39.3 (30) |
| team-offense/pass-protection — SK% | 2.8 (2) | 8.3 (26) |
| team-offense/tempo — PLY/GM | 58.0 (24) | 61.3 (16) |
| team-offense/tendencies — DPBK% | 62.1 (12) | 59.2 (19) |
| team-offense/overview — PT/GM | 17.0 (27) | 16.8 (28) |
| team-defense/efficiency — EPA/PLY | 0.048 (24) | -0.044 (9) |
| team-defense/passing-analytics — EPA/DB | 0.054 (15) | 0.074 (18) |
| team-defense/rush-analytics — EPA/ATT | 0.041 (30) | -0.165 (8) |
| team-defense/pass-rush — PRESS% | 31.6 (10) | 31.3 (11) |
| team-defense/pass-rush — SK% | 5.1 (20) | 7.8 (6) |
| team-defense/pass-rush — BLZ% | 38.6 (6) | 26.6 (20) |
| team-defense/overview — PT/GM | 22.0 (17) | 26.0 (24) |

Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, captured 2026-10-09T21:53:39Z. Ranks 1 = best (defensive EPA and offensive pressure/sack/turnover allowed ranked low-is-good).

### 4. Power ratings

| Team | Record | SRS | Net pts/g | Pythag | Model rank |
|---|---|---|---|---|---|
| DEN | 2-2 | 5.862 | -5 | 0.3619 | 18 |
| LAC | 0-4 | -9.313 | -9.75 | 0.2521 | 31 |

Source: data/generated/team-profiles/team-power-ratings-2026.json (generated 2026-10-10T07:06:04Z; 2026 season-to-date; provenance note inconsistency G17).

### 5. Availability and role

- **DEN** QB: Same starting QB all 4 weeks per nflverse weekly (attempts>=10)
- **LAC** QB: Same starting QB all 4 weeks per nflverse weekly (attempts>=10)

### 6. Weather / venue

- [Source: data/research-intel/review/2026-w05-weather-venue.json, DEN@LAC weather_status venue_condition_verification_required: do_not_apply_outdoor_weather_without_current venue/roof confirmation; venue SoFi Stadium (ESPN indoor flag False), generated 2026-10-10T17:56:55Z]

### 7. Secondary-matchup context (manual, capped, qualitative)

- DEN offense vs LAC defense (match_zone, two_high, quarters; coverage_first): absences Derwin James Jr. out (availability re-check: absence confirmed OUT/IR/PUP); Donte Jackson out (availability re-check: absence confirmed OUT/IR/PUP); listed targets Evan Engram, Courtland Sutton, Jaylen Waddle, Marvin Mims Jr..
- LAC offense vs DEN defense (man_heavy, single_high, blitz_heavy; blitz_heavy): absences Riley Moss out (availability re-check: absence confirmed OUT/IR/PUP); Pat Surtain II out (availability re-check: absence confirmed OUT/IR/PUP); Talanoa Hufanga limited (availability re-check: no current absence status); listed targets Ladd McConkey, Charlie Kolar, Tre' Harris.

### 8. Simulation

| Quantity | Blend (60/25/15) | Market-only |
|---|---|---|
| Home margin / total mean | -4.47 / 39.70 | -3.5 / 42 |
| LAC cover +3.5 | 47.2% | 50.0% |
| DEN cover -3.5 | 52.8% | 50.0% |
| Spread push | 0.0% | 0.0% |
| Over 42 | 41.6% | 48.5% |
| Under 42 | 55.4% | 48.4% |
| LAC win | 32.3% | 34.8% |

100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z. Calibration caveat: dispersion and key numbers from the pinned 2018–2025 artifact; blend weights unbacktested.

### 9. Expert / article / podcast / split evidence

- Qualified: [Source: data/generated/master-intel/w05-expert-verified.json#rows[385] (VSiN; Dustin Swedelson; article published Fri, 09 Oct 2026 20:20:28 +0000; verifier-row timestamp 2026-10-10T20:38; https://vsin.com/nfl/favorite-week-5-nfl-player-props-from-dustin-swedelson-and-optaai/), verbatim: "Omarion Hampton Over 38.5 Rushing Yards (-113)" — traced in data/research-intel/source-evidence/2026-10-10-vsin-week5-current-feed.json#records[url=https://vsin.com/nfl/favorite-week-5-nfl-player-props-from-dustin-swedelson-and-optaai/] (captured 2026-10-10T18:25:43)]
- Qualified: [Source: data/generated/master-intel/w05-expert-verified.json#rows[386] (VSiN; Dustin Swedelson; article published Fri, 09 Oct 2026 20:20:28 +0000; verifier-row timestamp 2026-10-10T20:38; https://vsin.com/nfl/favorite-week-5-nfl-player-props-from-dustin-swedelson-and-optaai/), verbatim: "Bo Nix Over 13.5 Rushing Yards (-117)" — traced in data/research-intel/source-evidence/2026-10-10-vsin-week5-current-feed.json#records[url=https://vsin.com/nfl/favorite-week-5-nfl-player-props-from-dustin-swedelson-and-optaai/] (captured 2026-10-10T18:25:43)]
- research_only tags (cannot set a tier): expert_feed:prop 4, expert_feed:moneyline 2, expert_feed:spread 5, expert_feed:total 1, podcast:prop 2, podcast:spread 7, podcast:totals 2, article:prop 3, article:spread 2, article:moneyline 1; most frequent side/total tags: Los Angeles Chargers ×6, spread LAC 3.5 ×4, totals UNDER 42.5 ×2, Chargers +3.5 | Chargers +3.5 ×2, Broncos ×1, UNDER ×1.
- Splits (context): [Source: data/generated/master-intel/w05-pull.json#splits[10], Action Network splits DEN@LAC: spread LAC 47% bets/48% money, over 69%/56%, ML LAC 14%/20% (context only), captured 2026-10-10T17:55:26Z]

### 10. Disposition

| Market | Captured price | P(win|no push) | Break-even | Margin (pp) | At mkt wt 0.8 (pp) | FTN dev | SRS dev | Checks a/b/c/d | Label |
|---|---|---|---|---|---|---|---|---|---|
| LAC +3.5 | -103 BKR | 47.2% | 50.7% | -3.5 | -2.1 | 2.16 | -10.07 | ✗/✗/✗/✓ | pass |
| DEN -3.5 | -113 BKR | 52.8% | 53.0% | -0.3 | -1.7 | -2.16 | 10.07 | ✗/✗/✗/✓ | pass |
| Over 42 | -114 BKR | 42.9% | 53.3% | -10.4 | -6.8 | -9.18 | — | ✗/✗/✗/✓ | pass |
| Under 42 | -102 BKR | 57.1% | 50.5% | 6.6 | 3.0 | 9.18 | — | ✓/✓/✓/✓ | quantitative candidate |

Invalidators: [line] total 41 or lower, or 43+ with model unchanged; [availability] Ladd McConkey status; LAC OL further losses; [venue] ESPN indoor flag False vs nflverse dome conflict (SoFi).


### Game state and thesis

**Game script.** DEN -3.5 (-113), LAC +3.5 (-103), total 42 [Source: data/generated/props/bookmaker-live-2026-10-10-week5.json, BKR DEN@LAC DEN -3.5 (home LAC +3.5 -103 / away DEN -3.5 -113), total 42 (O -114/U -102), ML DEN -194/LAC +170, captured 2026-10-10T22:26:52Z], implying roughly 22.75–19.25. SoFi Stadium has a covered roof; nflverse lists a dome while ESPN's venue flag says not indoor, so weather is not applied and the conflict is recorded [Source: data/research-intel/review/2026-w05-weather-venue.json, DEN@LAC weather_status venue_condition_verification_required: do_not_apply_outdoor_weather_without_current venue/roof confirmation; venue SoFi Stadium (ESPN indoor flag False), generated 2026-10-10T17:56:55Z]. The modeled script is a Chargers offense that cannot sustain drives: 32nd in EPA/play and DVOA [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — EPA/PLY LAC = -0.159 (rank 32/32), captured 2026-10-09T21:53:39Z], and 31st in turnover rate [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — TO% LAC = 3.67 (rank 31/32), captured 2026-10-09T21:53:39Z]. The alternative is Denver's banged-up secondary giving up chunk plays.

**Away team (DEN).** Bo Nix has started every game [Source: data/vault-seed/nflverse/player_stats_weekly.csv, DEN QB attempts>=10 by week: wk1 Bo Nix 28 att; wk2 Bo Nix 31 att; wk3 Bo Nix 34 att; wk4 Bo Nix 42 att]. Denver's offense is middling in EPA [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — EPA/PLY DEN = -0.023 (rank 18/32), captured 2026-10-09T21:53:39Z] but rarely takes sacks [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/pass-protection — SK% DEN = 2.8 (rank 2/32), captured 2026-10-09T21:53:39Z]. Pat Surtain II and Riley Moss are out [Source: data/secondary-matchups/secondary-matchup-vulnerability-2026-w05.json#matchups[21], DEN defense vs LAC: scheme man_heavy,single_high,blitz_heavy; absences Riley Moss out; Pat Surtain II out; Talanoa Hufanga limited (manual context, capped/qualitative; absences re-validated against data/player-availability/latest.json), generated 2026-10-10T17:31:50Z], a real cost against Ladd McConkey, who is himself questionable [Source: data/player-availability/latest.json#events[221], Ladd McConkey (LAC) QUESTIONABLE: "Ladd McConkey QUESTIONABLE", published 2026-10-10T18:46Z, captured 2026-10-10T16:45:17Z].

**Home team (LAC).** Justin Herbert has started every game [Source: data/vault-seed/nflverse/player_stats_weekly.csv, LAC QB attempts>=10 by week: wk1 Justin Herbert 27 att; wk2 Justin Herbert 27 att; wk3 Justin Herbert 34 att; wk4 Justin Herbert 31 att], behind a weakened line: Rashawn Slater is on IR [Source: data/player-availability/latest.json#events[398], Rashawn Slater (LAC) IR: "The Chargers placed Slater (ankle) on injured reserve Friday.", published 2026-10-10T02:51Z, captured 2026-10-10T16:45:17Z] and the line allows the third-highest pressure rate [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/pass-protection — PRESS% LAC = 39.3 (rank 30/32), captured 2026-10-09T21:53:39Z]. Quentin Johnston [Source: data/player-availability/latest.json#events[222], Quentin Johnston (LAC) OUT: "Quentin Johnston OUT", published 2026-10-10T18:46Z, captured 2026-10-10T16:45:17Z] and Derwin James Jr. [Source: data/player-availability/latest.json#events[469], Derwin James Jr. (LAC) OUT: "James (hamstring) has been ruled out against the Broncos on Sunday.", published 2026-10-10T00:28Z, captured 2026-10-10T16:45:17Z] are out. The power rating is 0-4 [Source: data/generated/team-profiles/team-power-ratings-2026.json, LAC SRS -9.313, net pts/g -9.75, pythag 0.2521, record 0-4, generated 2026-10-10T07:06:04Z].

**Matchup mechanics.** Depleted secondaries [Source: data/secondary-matchups/secondary-matchup-vulnerability-2026-w05.json#matchups[21], DEN defense vs LAC: scheme man_heavy,single_high,blitz_heavy; absences Riley Moss out; Pat Surtain II out; Talanoa Hufanga limited (manual context, capped/qualitative; absences re-validated against data/player-availability/latest.json), generated 2026-10-10T17:31:50Z] [Source: data/secondary-matchups/secondary-matchup-vulnerability-2026-w05.json#matchups[20], LAC defense vs DEN: scheme match_zone,two_high,quarters; absences Derwin James Jr. out; Donte Jackson out (manual context, capped/qualitative; absences re-validated against data/player-availability/latest.json), generated 2026-10-10T17:31:50Z] argue for points; two bottom-half offenses by EPA argue against. FTN's total is 32.8, far under the market [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[DEN@LAC].simulation, blend home margin -4.47 / total 39.70; MC home cover 0.472, away cover 0.528, push 0.000, over 0.416, under 0.554; 100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z].

**Market comparison.** The line is unchanged from the open [Source: data/odds/actionnetwork-openers-2026-w05.json, Action Network 'Open' book DEN@LAC home line +3.5, total 43.5, recorded 2026-10-05T00:12:55Z; opener context only, pulled 2026-10-08T03:36:16Z]. SRS has DEN 13.6 better while FTN has only 1.3, so the side fails the agreement check. Under 42 hits 57.1% conditional, and 53.5% at an 80% market weight [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[DEN@LAC].simulation, blend home margin -4.47 / total 39.70; MC home cover 0.472, away cover 0.528, push 0.000, over 0.416, under 0.554; 100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z]. It is a Tier-1 quantitative candidate. Bettors lean over [Source: data/generated/master-intel/w05-pull.json#splits[10], Action Network splits DEN@LAC: spread LAC 47% bets/48% money, over 69%/56%, ML LAC 14%/20% (context only), captured 2026-10-10T17:55:26Z]. Two VSiN props from Dustin Swedelson trace to source: [Source: data/generated/master-intel/w05-expert-verified.json#rows[385] (VSiN; Dustin Swedelson; article published Fri, 09 Oct 2026 20:20:28 +0000; verifier-row timestamp 2026-10-10T20:38; https://vsin.com/nfl/favorite-week-5-nfl-player-props-from-dustin-swedelson-and-optaai/), verbatim: "Omarion Hampton Over 38.5 Rushing Yards (-113)" — traced in data/research-intel/source-evidence/2026-10-10-vsin-week5-current-feed.json#records[url=https://vsin.com/nfl/favorite-week-5-nfl-player-props-from-dustin-swedelson-and-optaai/] (captured 2026-10-10T18:25:43)] and [Source: data/generated/master-intel/w05-expert-verified.json#rows[386] (VSiN; Dustin Swedelson; article published Fri, 09 Oct 2026 20:20:28 +0000; verifier-row timestamp 2026-10-10T20:38; https://vsin.com/nfl/favorite-week-5-nfl-player-props-from-dustin-swedelson-and-optaai/), verbatim: "Bo Nix Over 13.5 Rushing Yards (-117)" — traced in data/research-intel/source-evidence/2026-10-10-vsin-week5-current-feed.json#records[url=https://vsin.com/nfl/favorite-week-5-nfl-player-props-from-dustin-swedelson-and-optaai/] (captured 2026-10-10T18:25:43)]. Nix's 2026 rushing log is 2, 6, 7 and 10 yards [Source: data/vault-seed/nflverse/player_stats_weekly.csv, 2026 Bo Nix rushing_yards by week: wk1 2, wk2 6, wk3 7, wk4 10; file through week 4, mtime 2026-10-06T18:44:56Z], which contradicts that pick on 2026 form. Hampton's is 43, 94, 56, 45 [Source: data/vault-seed/nflverse/player_stats_weekly.csv, 2026 Omarion Hampton rushing_yards by week: wk1 43, wk2 94, wk3 56, wk4 45; file through week 4, mtime 2026-10-06T18:44:56Z].

**Thesis / counter-thesis.** [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[DEN@LAC].dispositions, Under 42 -102 BKR: P(win|no push) 57.1% vs break-even 50.5%, mkt-wt-0.8 +3.0pp → quantitative candidate, computed from run 2026-10-10T22:55:19Z] The thesis is Under 42. The counter is two depleted secondaries producing explosive passes. The disposition changes if McConkey is active and the total moves to 41 or lower, or if the total rises to 43 or higher while the model stays near 39.7.


---

## DET@ARI — quantitative candidate

Kickoff 2026-10-11T20:25Z · State Farm Stadium · ESPN 401872991

### 1–2. Market baseline and implied score

| Book | Spread (home line) | Total | Moneyline (away/home) | Captured |
|---|---|---|---|---|
| BKR (baseline) | ARI +5.5 (-106) / DET -5.5 (-110) | 54.5 (O -107 / U -109) | -254 / +218 (no-vig home 30.5%) | 2026-10-10T22:27:10Z |
| BEO | ARI +5.5 (-110) / DET (-110) | 54.5 | -255 / +211 | 2026-10-10T21:15:15Z |
| AN open (context) | ARI +4.5 | 53.5 | — | 2026-10-05T04:59:05Z |
| SuperContest (contest) | DET -5.5 | — | — | user-verified 2026-10-09; no capture time |

Market-implied score: DET 30.0 – ARI 24.5 (BKR).

### 3. FTN team analytics (season-to-date, Weeks 1–4)

| FTN table — field | DET (rank) | ARI (rank) |
|---|---|---|
| team-offense/efficiency — EPA/PLY | 0.137 (7) | -0.039 (21) |
| team-offense/efficiency — SUCC% | 49.1 (4) | 45.6 (11) |
| team-offense/passing-analytics — EPA/DB | 0.242 (6) | -0.034 (23) |
| team-offense/rushing-analytics — EPA/ATT | -0.059 (14) | -0.047 (9) |
| team-offense/pass-protection — PRESS% | 25.3 (6) | 24.5 (4) |
| team-offense/pass-protection — SK% | 4.6 (11) | 4.3 (8) |
| team-offense/tempo — PLY/GM | 66.8 (6) | 65.8 (7) |
| team-offense/tendencies — DPBK% | 65.2 (9) | 62.0 (13) |
| team-offense/overview — PT/GM | 29.8 (4) | 20.3 (19) |
| team-defense/efficiency — EPA/PLY | 0.156 (31) | 0.06 (26) |
| team-defense/passing-analytics — EPA/DB | 0.267 (29) | 0.311 (31) |
| team-defense/rush-analytics — EPA/ATT | -0.063 (19) | -0.23 (4) |
| team-defense/pass-rush — PRESS% | 32.1 (9) | 25.0 (27) |
| team-defense/pass-rush — SK% | 7.8 (7) | 6.5 (12) |
| team-defense/pass-rush — BLZ% | 31.1 (14) | 23.4 (25) |
| team-defense/overview — PT/GM | 31.8 (31) | 27.8 (28) |

Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, captured 2026-10-09T21:53:39Z. Ranks 1 = best (defensive EPA and offensive pressure/sack/turnover allowed ranked low-is-good).

### 4. Power ratings

| Team | Record | SRS | Net pts/g | Pythag | Model rank |
|---|---|---|---|---|---|
| DET | 2-2 | -3.252 | -2 | 0.4615 | 21 |
| ARI | 1-3 | -6.928 | -7.5 | 0.3313 | 27 |

Source: data/generated/team-profiles/team-power-ratings-2026.json (generated 2026-10-10T07:06:04Z; 2026 season-to-date; provenance note inconsistency G17).

### 5. Availability and role

- **DET** QB: Same starting QB all 4 weeks per nflverse weekly (attempts>=10)
- **ARI** QB: Same starting QB all 4 weeks per nflverse weekly (attempts>=10)

### 6. Weather / venue

- [Source: data/research-intel/review/2026-w05-weather-venue.json, DET@ARI weather_status venue_condition_verification_required: do_not_apply_outdoor_weather_without_current venue/roof confirmation; venue State Farm Stadium (ESPN indoor flag True), generated 2026-10-10T17:56:55Z]

### 7. Secondary-matchup context (manual, capped, qualitative)

- DET offense vs ARI defense (zone_heavy, two_high, match_zone; front_dependent): absences Joey Blount ir (availability re-check: absence confirmed OUT/IR/PUP); Will Johnson ir (availability re-check: absence confirmed OUT/IR/PUP); Kitan Crawford ir (availability re-check: absence confirmed OUT/IR/PUP); Andrew Wingard out (availability re-check: absence confirmed OUT/IR/PUP); listed targets Amon-Ra St. Brown, Isaac TeSlaa, Jameson Williams, Sam LaPorta.
- ARI offense vs DET defense (match_zone, two_high, quarters; front_dependent): absences Kerby Joseph pup (availability re-check: absence confirmed OUT/IR/PUP); Avonte Maddox ir (availability re-check: absence confirmed OUT/IR/PUP); Thomas Harper ir (availability re-check: absence confirmed OUT/IR/PUP); Rock Ya-Sin out (availability re-check: absence confirmed OUT/IR/PUP); Brian Branch out (availability re-check: absence confirmed OUT/IR/PUP); D.J. Reed limited (availability re-check: no current absence status); listed targets Trey McBride, Kendrick Bourne, Michael Wilson.

### 8. Simulation

| Quantity | Blend (60/25/15) | Market-only |
|---|---|---|
| Home margin / total mean | -4.57 / 56.93 | -5.5 / 54.5 |
| ARI cover +5.5 | 52.6% | 50.0% |
| DET cover -5.5 | 47.4% | 50.0% |
| Spread push | 0.0% | 0.0% |
| Over 54.5 | 57.4% | 50.0% |
| Under 54.5 | 42.6% | 50.0% |
| ARI win | 32.3% | 30.1% |

100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z. Calibration caveat: dispersion and key numbers from the pinned 2018–2025 artifact; blend weights unbacktested.

### 9. Expert / article / podcast / split evidence

- Qualified named-expert picks: none for this game.
- research_only tags (cannot set a tier): expert_feed:prop 7, expert_feed:moneyline 2, expert_feed:spread 6, expert_feed:total 1, podcast:prop 2, podcast:spread 6, podcast:survivor_pick 1, podcast:totals 2, article:prop 8, article:moneyline 1; most frequent side/total tags: Arizona Cardinals ×4, Detroit Lions ×2, spread ARI 4.5 ×2, totals OVER 53.5 ×2, spread DET -4.5 ×2, Lions ×1.
- Splits (context): [Source: data/generated/master-intel/w05-pull.json#splits[12], Action Network splits DET@ARI: spread ARI 48% bets/41% money, over 57%/61%, ML ARI 8%/2% (context only), captured 2026-10-10T17:55:26Z]

### 10. Disposition

| Market | Captured price | P(win|no push) | Break-even | Margin (pp) | At mkt wt 0.8 (pp) | FTN dev | SRS dev | Checks a/b/c/d | Label |
|---|---|---|---|---|---|---|---|---|---|
| ARI +5.5 | -106 BKR | 52.6% | 51.5% | 1.2 | -0.1 | 1.66 | 3.43 | ✗/✗/✓/✓ | pass |
| DET -5.5 | -110 BKR | 47.4% | 52.4% | -5.0 | -3.7 | -1.66 | -3.43 | ✗/✗/✗/✓ | pass |
| Over 54.5 | -107 BKR | 57.4% | 51.7% | 5.7 | 2.0 | 9.73 | — | ✓/✓/✓/✓ | quantitative candidate |
| Under 54.5 | -109 BKR | 42.6% | 52.1% | -9.5 | -5.8 | -9.73 | — | ✗/✗/✗/✓ | pass |

Invalidators: [line] total 56 or higher; [availability] Brian Branch or Kerby Joseph upgraded to active; [availability] Marvin Harrison Jr. trade status.


### Game state and thesis

**Game script.** DET -5.5 (-110), total 54.5, tied for the highest on the slate [Source: data/generated/props/bookmaker-live-2026-10-10-week5.json, BKR DET@ARI DET -5.5 (home ARI +5.5 -106 / away DET -5.5 -110), total 54.5 (O -107/U -109), ML DET -254/ARI +218, captured 2026-10-10T22:27:10Z], implying roughly 30–24.5. State Farm Stadium is flagged indoor by ESPN, and no outdoor weather is applied [Source: data/research-intel/review/2026-w05-weather-venue.json, DET@ARI weather_status venue_condition_verification_required: do_not_apply_outdoor_weather_without_current venue/roof confirmation; venue State Farm Stadium (ESPN indoor flag True), generated 2026-10-10T17:56:55Z]. The modeled script is high volume: both teams run more than 65 plays a game [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/tempo — PLY/GM DET = 66.8 (rank 6/32), captured 2026-10-09T21:53:39Z] [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/tempo — PLY/GM ARI = 65.8 (rank 7/32), captured 2026-10-09T21:53:39Z], and both defenses rank in the bottom third by EPA/play [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-defense/efficiency — EPA/PLY DET = 0.156 (rank 31/32), captured 2026-10-09T21:53:39Z] [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-defense/efficiency — EPA/PLY ARI = 0.06 (rank 26/32), captured 2026-10-09T21:53:39Z]. The alternative is Arizona's short-passing offense, last in explosive-play rate [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — EXP% ARI = 3.8 (rank 32/32), captured 2026-10-09T21:53:39Z], running long drives and draining possessions.

**Away team (DET).** Jared Goff has started every game [Source: data/vault-seed/nflverse/player_stats_weekly.csv, DET QB attempts>=10 by week: wk1 Jared Goff 39 att; wk2 Jared Goff 38 att; wk3 Jared Goff 32 att; wk4 Jared Goff 52 att]. Detroit's offense has no turnovers [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — TO% DET = 0.0 (rank 1/32), captured 2026-10-09T21:53:39Z] and ranks sixth in dropback EPA [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/passing-analytics — EPA/DB DET = 0.242 (rank 6/32), captured 2026-10-09T21:53:39Z]. The defense is the problem: Kerby Joseph (PUP), Brian Branch, Rock Ya-Sin and Avonte Maddox are all missing from the secondary [Source: data/secondary-matchups/secondary-matchup-vulnerability-2026-w05.json#matchups[23], DET defense vs ARI: scheme match_zone,two_high,quarters; absences Kerby Joseph pup; Avonte Maddox ir; Thomas Harper ir; Rock Ya-Sin out; Brian Branch out; D.J. Reed limited (manual context, capped/qualitative; absences re-validated against data/player-availability/latest.json), generated 2026-10-10T17:31:50Z]. That is the largest absence load in the file (qualitative only). Branch's status is confirmed in the availability feed [Source: data/player-availability/latest.json#events[455], Brian Branch (DET) OUT: "Branch (Achilles) has been ruled out ahead of Sunday's game against the Cardinals.", published 2026-10-10T00:56Z, captured 2026-10-10T16:45:17Z].

**Home team (ARI).** Jacoby Brissett has started every game [Source: data/vault-seed/nflverse/player_stats_weekly.csv, ARI QB attempts>=10 by week: wk1 Jacoby Brissett 37 att; wk2 Jacoby Brissett 28 att; wk3 Jacoby Brissett 52 att; wk4 Jacoby Brissett 35 att]. Marvin Harrison Jr. is listed out with a trade pending [Source: data/player-availability/latest.json#events[390], Marvin Harrison Jr. (ARI) OUT: "A trade for Harrison will not be completed 'until after Sunday's games are played,' but the Cardinals 'feel comfortable enough' knowing it will occur that they ", published 2026-10-10T15:35Z, captured 2026-10-10T16:45:17Z], so targets shift to Trey McBride and Michael Wilson. Arizona is 1-3 [Source: data/generated/team-profiles/team-power-ratings-2026.json, ARI SRS -6.928, net pts/g -7.5, pythag 0.3313, record 1-3, generated 2026-10-10T07:06:04Z].

**Matchup mechanics.** Arizona's efficient, underneath passing (11th in success rate [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — SUCC% ARI = 45.6 (rank 11/32), captured 2026-10-09T21:53:39Z]) against Detroit's depleted secondary should produce long scoring drives. Goff's efficiency against a bottom-third Arizona defense supplies the other half of the scoring.

**Market comparison.** The total opened at 53.5 and the side at DET -4.5 [Source: data/odds/actionnetwork-openers-2026-w05.json, Action Network 'Open' book DET@ARI home line +4.5, total 53.5, recorded 2026-10-05T04:59:05Z; opener context only, pulled 2026-10-08T03:36:16Z]. FTN's total is 64.2, and the blend total is 56.9, so Over 54.5 hits 57.4% conditional and 53.7% at an 80% market weight [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[DET@ARI].simulation, blend home margin -4.57 / total 56.93; MC home cover 0.526, away cover 0.474, push 0.000, over 0.574, under 0.426; 100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z]. It is a Tier-1 quantitative candidate. The side is close to the market (ARI +5.5 at 52.6%) and is a pass. Bettors and money lean over [Source: data/generated/master-intel/w05-pull.json#splits[12], Action Network splits DET@ARI: spread ARI 48% bets/41% money, over 57%/61%, ML ARI 8%/2% (context only), captured 2026-10-10T17:55:26Z]. No qualified named-expert pick exists for this game.

**Thesis / counter-thesis.** [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[DET@ARI].dispositions, Over 54.5 -107 BKR: P(win|no push) 57.4% vs break-even 51.7%, mkt-wt-0.8 +2.0pp → quantitative candidate, computed from run 2026-10-10T22:55:19Z] The thesis is Over 54.5. The counter is that 54.5 already prices most of the defensive news and that Arizona's lack of explosive plays caps its scoring. The disposition changes if the total reaches 56 or higher, or if Branch or Joseph is upgraded to active.


---

## SF@SEA — quantitative candidate

Kickoff 2026-10-11T20:25Z · Lumen Field · ESPN 401872992

### 1–2. Market baseline and implied score

| Book | Spread (home line) | Total | Moneyline (away/home) | Captured |
|---|---|---|---|---|
| BKR (baseline) | SEA -3 (-122) / SF +3 (+105) | 46.5 (O -104 / U -112) | +149 / -171 (no-vig home 61.1%) | 2026-10-10T22:27:01Z |
| BEO | SEA -3 (-118) / SF (-102) | 46 | +149 / -170 | 2026-10-10T21:15:15Z |
| AN open (context) | SEA -3 | 47.0 | — | 2026-10-05T00:14:55Z |
| SuperContest (contest) | SEA -3 | — | — | user-verified 2026-10-09; no capture time |

Market-implied score: SEA 24.75 – SF 21.75 (BKR).

### 3. FTN team analytics (season-to-date, Weeks 1–4)

| FTN table — field | SF (rank) | SEA (rank) |
|---|---|---|
| team-offense/efficiency — EPA/PLY | 0.278 (1) | 0.001 (14) |
| team-offense/efficiency — SUCC% | 53.5 (1) | 43.9 (14) |
| team-offense/passing-analytics — EPA/DB | 0.565 (1) | 0.193 (10) |
| team-offense/rushing-analytics — EPA/ATT | -0.057 (13) | -0.22 (28) |
| team-offense/pass-protection — PRESS% | 20.3 (1) | 28.3 (16) |
| team-offense/pass-protection — SK% | 0.0 (1) | 4.7 (12) |
| team-offense/tempo — PLY/GM | 57.0 (28) | 59.3 (22) |
| team-offense/tendencies — DPBK% | 53.9 (26) | 53.6 (27) |
| team-offense/overview — PT/GM | 30.5 (2) | 24.8 (13) |
| team-defense/efficiency — EPA/PLY | 0.013 (17) | -0.142 (2) |
| team-defense/passing-analytics — EPA/DB | 0.06 (17) | -0.078 (4) |
| team-defense/rush-analytics — EPA/ATT | -0.058 (21) | -0.239 (3) |
| team-defense/pass-rush — PRESS% | 25.8 (24) | 36.9 (4) |
| team-defense/pass-rush — SK% | 3.9 (26) | 7.4 (10) |
| team-defense/pass-rush — BLZ% | 31.0 (15) | 21.5 (28) |
| team-defense/overview — PT/GM | 16.0 (3) | 16.8 (5) |

Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, captured 2026-10-09T21:53:39Z. Ranks 1 = best (defensive EPA and offensive pressure/sack/turnover allowed ranked low-is-good).

### 4. Power ratings

| Team | Record | SRS | Net pts/g | Pythag | Model rank |
|---|---|---|---|---|---|
| SF | 4-0 | 14.043 | 14.5 | 0.8219 | 1 |
| SEA | 3-1 | 1.698 | 8 | 0.703 | 7 |

Source: data/generated/team-profiles/team-power-ratings-2026.json (generated 2026-10-10T07:06:04Z; 2026 season-to-date; provenance note inconsistency G17).

### 5. Availability and role

- **SF** QB: Same starting QB all 4 weeks per nflverse weekly (attempts>=10)
- **SEA** QB: Partial: Lock wk1-2, Darnold wk3-4 (Darnold expected; BEO prices Darnold).

### 6. Weather / venue

- [Source: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json, Open-Meteo forecast SF@SEA sampled 2026-10-11T20:00:00Z: 59°F, wind 14.2 km/h gusts 23 km/h dir 353°, precip prob 0% / 0 mm (forecast, not observation), captured 2026-10-10T17:56:55Z]

### 7. Secondary-matchup context (manual, capped, qualitative)

- SF offense vs SEA defense (match_zone, single_high, two_high; aggressive): absences Bud Clark ir (availability re-check: absence confirmed OUT/IR/PUP); Julian Neal out (availability re-check: absence confirmed OUT/IR/PUP); Terrion Arnold out (availability re-check: absence confirmed OUT/IR/PUP); listed targets Deebo Samuel, George Kittle, Mike Evans, Brandin Cooks.
- SEA offense vs SF defense (zone_heavy, two_high, quarters; front_dependent): absences Darrick Forrest ir (availability re-check: absence confirmed OUT/IR/PUP); Nate Hobbs ir (availability re-check: absence confirmed OUT/IR/PUP); Upton Stout limited (availability re-check: questionable); Marques Sigle out (availability re-check: absence confirmed OUT/IR/PUP); listed targets Cooper Kupp, Jaxon Smith-Njigba, AJ Barner.

### 8. Simulation

| Quantity | Blend (60/25/15) | Market-only |
|---|---|---|
| Home margin / total mean | -1.15 / 47.91 | +3 / 46.5 |
| SEA cover -3 | 33.7% | 45.1% |
| SF cover +3 | 56.8% | 45.1% |
| Spread push | 9.5% | 9.7% |
| Over 46.5 | 54.4% | 50.0% |
| Under 46.5 | 45.6% | 50.0% |
| SEA win | 48.4% | 60.1% |

100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z. Calibration caveat: dispersion and key numbers from the pinned 2018–2025 artifact; blend weights unbacktested.

### 9. Expert / article / podcast / split evidence

- Qualified: [Source: data/generated/master-intel/w05-expert-verified.json#rows[393] (ESPN NFL; Ben Solak, Seth Walder, Matt Bowen and Mike Clay; article published 2026-10-09T12:58:29Z; verifier-row timestamp 2026-10-10T20:38; https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games), verbatim: "San Francisco 49ers at Seattle Seahawks total points UNDER 45.5 (-105)" — traced in data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md (captured 2026-10-09T13:05:56)]
- research_only tags (cannot set a tier): expert_feed:prop 6, expert_feed:spread 4, expert_feed:moneyline 3, expert_feed:total 2, podcast:prop 2, podcast:total 1, podcast:spread 4, podcast:totals 1, article:prop 7, article:spread 1, article:moneyline 1; most frequent side/total tags: Seattle Seahawks ×5, UNDER ×2, spread SEA -2.5 ×2, San Francisco 49ers ×1, Seahawks ×1, total UNDER 47.5 ×1.
- Splits (context): [Source: data/generated/master-intel/w05-pull.json#splits[11], Action Network splits SF@SEA: spread SEA 19% bets/14% money, over 72%/71%, ML SEA 47%/42% (context only), captured 2026-10-10T17:55:26Z]

### 10. Disposition

| Market | Captured price | P(win|no push) | Break-even | Margin (pp) | At mkt wt 0.8 (pp) | FTN dev | SRS dev | Checks a/b/c/d | Label |
|---|---|---|---|---|---|---|---|---|---|
| SEA -3 | -122 BKR | 37.3% | 54.9% | -17.7 | -11.4 | -8.34 | -13.74 | ✗/✗/✗/✓ | pass |
| SF +3 | +105 BKR | 62.7% | 48.8% | 13.9 | 7.7 | 8.34 | 13.74 | ✓/✓/✓/✓ | quantitative candidate |
| Over 46.5 | -104 BKR | 54.4% | 51.0% | 3.4 | 1.2 | 5.62 | — | ✓/✓/✓/✓ | conflicted |
| Under 46.5 | -112 BKR | 45.6% | 52.8% | -7.2 | -5.0 | -5.62 | — | ✗/✗/✗/✓ | price moved |

Invalidators: [line] SF +2.5 or shorter (crosses 3) -> different bet; [availability] Trent Williams downgraded; any further SF DL loss; [evidence] no BKR player props captured.


### Game state and thesis

**Game script.** SEA -3 (-122), SF +3 (+105), total 46.5 [Source: data/generated/props/bookmaker-live-2026-10-10-week5.json, BKR SF@SEA SEA -3 (home SEA -3 -122 / away SF +3 +105), total 46.5 (O -104/U -112), ML SF +149/SEA -171, captured 2026-10-10T22:27:01Z], implying roughly 24.75–21.75. BEO is the same side number with a 46 total [Source: data/generated/props/betonline-live-2026-10-10-week5.json, BEO SF@SEA home SEA -3 -118 / away SF -102, total 46, ML +149/-170, captured 2026-10-10T21:15:15Z (file-level capturedAt)]. The central matchup is the league's most efficient offense against one of its best defenses: San Francisco is first in EPA/play, DVOA and dropback EPA [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — EPA/PLY SF = 0.278 (rank 1/32), captured 2026-10-09T21:53:39Z] [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/passing-analytics — EPA/DB SF = 0.565 (rank 1/32), captured 2026-10-09T21:53:39Z], and Seattle is second in EPA/play allowed [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-defense/efficiency — EPA/PLY SEA = -0.142 (rank 2/32), captured 2026-10-09T21:53:39Z]. The expected script is San Francisco moving the ball in a slow-paced game [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/tempo — PLY/GM SF = 57.0 (rank 28/32), captured 2026-10-09T21:53:39Z]; the alternative is Seattle protecting a lead. Weather is mild [Source: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json, Open-Meteo forecast SF@SEA sampled 2026-10-11T20:00:00Z: 59°F, wind 14.2 km/h gusts 23 km/h dir 353°, precip prob 0% / 0 mm (forecast, not observation), captured 2026-10-10T17:56:55Z].

**Away team (SF).** Brock Purdy has started every game [Source: data/vault-seed/nflverse/player_stats_weekly.csv, SF QB attempts>=10 by week: wk1 Brock Purdy 34 att; wk2 Brock Purdy 22 att; wk3 Brock Purdy 27 att; wk4 Brock Purdy 30 att] behind a line that has allowed no sacks [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/pass-protection — SK% SF = 0.0 (rank 1/32), captured 2026-10-09T21:53:39Z]. The defensive front is gutted: Nick Bosa [Source: data/player-availability/latest.json#events[439], Nick Bosa (SF) OUT: "Bosa (calf) has been ruled out ahead of Sunday's game against the Seahawks.", published 2026-10-10T01:33Z, captured 2026-10-10T16:45:17Z], Mykel Williams [Source: data/player-availability/latest.json#events[435], Mykel Williams (SF) OUT: "Williams (knee) is listed as questionable ahead of Sunday's game against the Seahawks.", published 2026-10-10T01:46Z, captured 2026-10-10T16:45:17Z] and James Thompson Jr. [Source: data/player-availability/latest.json#events[399], James Thompson Jr. (SF) OUT: "Thompson (ankle) has been ruled out for Sunday's game against the Seahawks.", published 2026-10-10T02:50Z, captured 2026-10-10T16:45:17Z] are all out. The power rating is the best in the league [Source: data/generated/team-profiles/team-power-ratings-2026.json, SF SRS 14.043, net pts/g 14.5, pythag 0.8219, record 4-0, generated 2026-10-10T07:06:04Z].

**Home team (SEA).** Sam Darnold started weeks 3–4 after Drew Lock [Source: data/vault-seed/nflverse/player_stats_weekly.csv, SEA QB attempts>=10 by week: wk1 Drew Lock 22 att; wk2 Drew Lock 26 att; wk3 Sam Darnold 45 att; wk4 Sam Darnold 22 att], a partial change that the run rules do not count as structural. Zach Charbonnet is out [Source: data/player-availability/latest.json#events[669], Zach Charbonnet (SEA) OUT: "Zach Charbonnet OUT", published 2026-10-09T07:00Z, captured 2026-10-10T16:45:17Z]. Seattle's run game is 28th in EPA/attempt [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/rushing-analytics — EPA/ATT SEA = -0.22 (rank 28/32), captured 2026-10-09T21:53:39Z].

**Matchup mechanics.** San Francisco's protection against Seattle's coverage [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/pass-protection — PRESS% SF = 20.3 (rank 1/32), captured 2026-10-09T21:53:39Z] defines the game; Seattle's offense facing no Bosa [Source: data/player-availability/latest.json#events[439], Nick Bosa (SF) OUT: "Bosa (calf) has been ruled out ahead of Sunday's game against the Seahawks.", published 2026-10-10T01:33Z, captured 2026-10-10T16:45:17Z] is the main threat to an SF cover.

**Market comparison.** The market is essentially unchanged from SEA -3 / 47 at the open [Source: data/odds/actionnetwork-openers-2026-w05.json, Action Network 'Open' book SF@SEA home line -3, total 47.0, recorded 2026-10-05T00:14:55Z; opener context only, pulled 2026-10-08T03:36:16Z]. The blend projects SEA by only 1.1: SF +3 wins 56.8% of draws with a 9.5% push, which is 62.7% conditional against a 48.8% break-even at +105, and 56.4% at an 80% market weight [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[SF@SEA].simulation, blend home margin -1.15 / total 47.91; MC home cover 0.337, away cover 0.568, push 0.095, over 0.544, under 0.456; 100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z]. It is the strongest Tier-1 side, with the caveat that it is driven by a four-game sample. The model's Over (54.4%) is conflicted: ESPN's traced Under 45.5 [Source: data/generated/master-intel/w05-expert-verified.json#rows[393] (ESPN NFL; Ben Solak, Seth Walder, Matt Bowen and Mike Clay; article published 2026-10-09T12:58:29Z; verifier-row timestamp 2026-10-10T20:38; https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games), verbatim: "San Francisco 49ers at Seattle Seahawks total points UNDER 45.5 (-105)" — traced in data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md (captured 2026-10-09T13:05:56)] opposes it, and that pick's number has since moved up a point. Bettors and money are heavily on SF [Source: data/generated/master-intel/w05-pull.json#splits[11], Action Network splits SF@SEA: spread SEA 19% bets/14% money, over 72%/71%, ML SEA 47%/42% (context only), captured 2026-10-10T17:55:26Z]. BKR published no player props for this game.

**Thesis / counter-thesis.** [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[SF@SEA].dispositions, SF +3 +105 BKR: P(win|no push) 62.7% vs break-even 48.8%, mkt-wt-0.8 +7.7pp → quantitative candidate; Over 46.5 -104 BKR: P(win|no push) 54.4% vs break-even 51.0%, mkt-wt-0.8 +1.2pp → conflicted; Under 46.5 -112 BKR: P(win|no push) 45.6% vs break-even 52.8%, mkt-wt-0.8 -5.0pp → price moved, computed from run 2026-10-10T22:55:19Z] The thesis is SF +3 at plus money. The counter is that San Francisco's depleted pass rush lets Darnold have his best game. The disposition changes if the line moves to SF +2.5, which crosses 3 and makes it a different bet, or if Trent Williams is downgraded.


---

## BAL@ATL — conflicted

Kickoff 2026-10-12T00:20Z · Mercedes-Benz Stadium · ESPN 401872993

### 1–2. Market baseline and implied score

| Book | Spread (home line) | Total | Moneyline (away/home) | Captured |
|---|---|---|---|---|
| BKR (baseline) | ATL -3 (-117) / BAL +3 (+102) | 44 (O -103 / U -113) | +140 / -161 (no-vig home 59.7%) | 2026-10-10T22:27:32Z |
| BEO | ATL -3.5 (+100) / BAL (-120) | 43.5 | +149 / -170 | 2026-10-10T21:15:15Z |
| AN open (context) | ATL +4.5 | 47.5 | — | 2026-10-05T01:51:05Z |
| SuperContest (contest) | ATL -3.5 | — | — | user-verified 2026-10-09; no capture time |

Market-implied score: ATL 23.5 – BAL 20.5 (BKR).

### 3. FTN team analytics (season-to-date, Weeks 1–4)

| FTN table — field | BAL (rank) | ATL (rank) |
|---|---|---|
| team-offense/efficiency — EPA/PLY | 0.165 (4) | 0.025 (11) |
| team-offense/efficiency — SUCC% | 50.6 (3) | 52.6 (2) |
| team-offense/passing-analytics — EPA/DB | 0.349 (2) | -0.116 (28) |
| team-offense/rushing-analytics — EPA/ATT | -0.031 (7) | 0.122 (1) |
| team-offense/pass-protection — PRESS% | 28.5 (17) | 20.4 (2) |
| team-offense/pass-protection — SK% | 5.7 (17) | 6.5 (20) |
| team-offense/tempo — PLY/GM | 59.8 (21) | 57.0 (29) |
| team-offense/tendencies — DPBK% | 51.5 (29) | 40.8 (32) |
| team-offense/overview — PT/GM | 29.0 (6) | 21.0 (16) |
| team-defense/efficiency — EPA/PLY | -0.015 (13) | -0.069 (6) |
| team-defense/passing-analytics — EPA/DB | -0.009 (7) | 0.013 (10) |
| team-defense/rush-analytics — EPA/ATT | -0.027 (24) | -0.291 (1) |
| team-defense/pass-rush — PRESS% | 30.8 (13) | 34.4 (8) |
| team-defense/pass-rush — SK% | 4.5 (23) | 3.8 (27) |
| team-defense/pass-rush — BLZ% | 30.8 (16) | 22.6 (26) |
| team-defense/overview — PT/GM | 24.0 (20) | 20.0 (13) |

Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, captured 2026-10-09T21:53:39Z. Ranks 1 = best (defensive EPA and offensive pressure/sack/turnover allowed ranked low-is-good).

### 4. Power ratings

| Team | Record | SRS | Net pts/g | Pythag | Model rank |
|---|---|---|---|---|---|
| BAL | 3-1 | -0.709 | 5 | 0.6103 | 11 |
| ATL | 2-2 | 0.381 | 1 | 0.5252 | 13 |

Source: data/generated/team-profiles/team-power-ratings-2026.json (generated 2026-10-10T07:06:04Z; 2026 season-to-date; provenance note inconsistency G17).

### 5. Availability and role

- **BAL** QB: QB change: Lamar Jackson threw every BAL 2026 attempt; OUT (ankle); Tyler Huntley starts. FTN/SRS sample is Lamar-only.
- **ATL** QB: Partial: Rush wk1-2, Penix wk3-4 (Penix expected).

- **Structural staleness:** BAL — FTN/SRS do not describe the Week 5 starting QB; Tier 1 barred.

### 6. Weather / venue

- [Source: data/research-intel/review/2026-w05-weather-venue.json, BAL@ATL weather_status venue_condition_verification_required: do_not_apply_outdoor_weather_without_current venue/roof confirmation; venue Mercedes-Benz Stadium (ESPN indoor flag True), generated 2026-10-10T17:56:55Z]

### 7. Secondary-matchup context (manual, capped, qualitative)

- BAL offense vs ATL defense (match_zone, two_high, quarters; balanced): absences A.J. Terrell Jr. ir (availability re-check: absence confirmed OUT/IR/PUP); listed targets Zay Flowers, Mark Andrews, Devontez Walker, Rashod Bateman.
- ATL offense vs BAL defense (man_heavy, single_high, blitz_heavy; aggressive): absences T.J. Tampa Jr. ir (availability re-check: absence confirmed OUT/IR/PUP); Jahquez Robinson ir (availability re-check: absence confirmed OUT/IR/PUP); Marlon Humphrey limited (availability re-check: questionable); listed targets Drake London, Jahan Dotson, Kyle Pitts, Olamide Zaccheaus.

### 8. Simulation

| Quantity | Blend (60/25/15) | Market-only |
|---|---|---|
| Home margin / total mean | +1.32 / 45.46 | +3 / 44 |
| ATL cover -3 | 40.2% | 45.1% |
| BAL cover +3 | 50.0% | 45.1% |
| Spread push | 9.8% | 9.7% |
| Over 44 | 52.9% | 48.5% |
| Under 44 | 44.0% | 48.5% |
| ATL win | 55.2% | 60.1% |

100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z. Calibration caveat: dispersion and key numbers from the pinned 2018–2025 artifact; blend weights unbacktested.

### 9. Expert / article / podcast / split evidence

- Qualified: [Source: data/generated/master-intel/w05-expert-verified.json#rows[396] (ESPN NFL; Ben Solak, Seth Walder, Matt Bowen and Mike Clay; article published 2026-10-09T12:58:29Z; verifier-row timestamp 2026-10-10T20:38; https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games), verbatim: "Zay Flowers 6+ receptions (-109)" — traced in data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md (captured 2026-10-09T13:05:56)]
- research_only tags (cannot set a tier): expert_feed:prop 9, expert_feed:spread 4, expert_feed:total 3, expert_feed:moneyline 3, expert_feed:teaser 1, podcast:prop 3, podcast:total 1, podcast:spread 3, podcast:totals 2, article:spread 4, article:prop 12, article:moneyline 1; most frequent side/total tags: Atlanta Falcons ×4, Baltimore Ravens ×3, Ravens +3.5 | Ravens +3.5 ×3, OVER ×2, spread BAL 3 ×2, totals UNDER 45 ×2.
- Splits (context): [Source: data/generated/master-intel/w05-pull.json#splits[13], Action Network splits BAL@ATL: spread ATL 45% bets/51% money, over 73%/66%, ML ATL 54%/74% (context only), captured 2026-10-10T17:55:26Z]

### 10. Disposition

| Market | Captured price | P(win|no push) | Break-even | Margin (pp) | At mkt wt 0.8 (pp) | FTN dev | SRS dev | Checks a/b/c/d | Label |
|---|---|---|---|---|---|---|---|---|---|
| ATL -3 | -117 BKR | 44.6% | 53.9% | -9.4 | -6.5 | -6.53 | -0.3 | ✗/✗/✗/✗ | pass |
| BAL +3 | +102 BKR | 55.4% | 49.5% | 5.9 | 3.1 | 6.53 | 0.3 | ✓/✓/✓/✗ | conflicted |
| Over 44 | -103 BKR | 54.6% | 50.7% | 3.8 | 1.6 | 5.85 | — | ✓/✓/✓/✗ | conflicted |
| Under 44 | -113 BKR | 45.4% | 53.0% | -7.6 | -5.3 | -5.85 | — | ✗/✗/✗/✗ | pass |

Invalidators: [availability] Zay Flowers ruled out; [evidence] structural QB staleness in FTN/SRS (BAL: Lamar-only sample); [line] BKR ATL -3.5 (BEO already -3.5).


### Game state and thesis

**Game script.** ATL -3 (-117), BAL +3 (+102), total 44 [Source: data/generated/props/bookmaker-live-2026-10-10-week5.json, BKR BAL@ATL ATL -3 (home ATL -3 -117 / away BAL +3 +102), total 44 (O -103/U -113), ML BAL +140/ATL -161, captured 2026-10-10T22:27:32Z]. BEO hangs ATL -3.5 and 43.5 [Source: data/generated/props/betonline-live-2026-10-10-week5.json, BEO BAL@ATL home ATL -3.5 +100 / away BAL -120, total 43.5, ML +149/-170, captured 2026-10-10T21:15:15Z (file-level capturedAt)]. The line opened BAL -4.5 / 47.5 [Source: data/odds/actionnetwork-openers-2026-w05.json, Action Network 'Open' book BAL@ATL home line +4.5, total 47.5, recorded 2026-10-05T01:51:05Z; opener context only, pulled 2026-10-08T03:36:16Z], a 7.5-point swing through 3 and 7 after Lamar Jackson was ruled out [Source: data/player-availability/latest.json#events[232], Lamar Jackson (BAL) OUT: "Lamar Jackson OUT", published 2026-10-10T18:40Z, captured 2026-10-10T16:45:17Z]. The modeled script is Atlanta's run game, first in rushing EPA/attempt and the most run-heavy offense [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/rushing-analytics — EPA/ATT ATL = 0.122 (rank 1/32), captured 2026-10-09T21:53:39Z] [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/tendencies — DPBK% ATL = 40.8 (rank 32/32), captured 2026-10-09T21:53:39Z], controlling the clock indoors. The alternative is Tyler Huntley's quick game keeping Baltimore in it through Zay Flowers.

**Away team (BAL).** Every 2026 Baltimore pass attempt was thrown by Lamar Jackson [Source: data/vault-seed/nflverse/player_stats_weekly.csv, BAL QB attempts>=10 by week: wk1 Lamar Jackson 25 att; wk2 Lamar Jackson 31 att; wk3 Lamar Jackson 20 att; wk4 Lamar Jackson 20 att]. Its fourth-ranked EPA/play [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — EPA/PLY BAL = 0.165 (rank 4/32), captured 2026-10-09T21:53:39Z] and power rating [Source: data/generated/team-profiles/team-power-ratings-2026.json, BAL SRS -0.709, net pts/g 5, pythag 0.6103, record 3-1, generated 2026-10-10T07:06:04Z] therefore say nothing about Huntley, who starts [Source: data/player-availability/latest.json#events[559], Tyler Huntley (BAL) ACTIVE_NEWS: "Huntley will start Sunday night's game against the Falcons after Lamar Jackson (ankle) was ruled out Friday, Jeff Zrebiec of The Athletic reports.", published 2026-10-09T17:40Z, captured 2026-10-10T16:45:17Z]. Trey Hendrickson [Source: data/player-availability/latest.json#events[478], Trey Hendrickson (BAL) OUT: "Hendrickson (finger) has been ruled out ahead of Sunday's game against the Falcons, Adam Caplan of SiriusXM NFL Radio reports.", published 2026-10-10T00:05Z, captured 2026-10-10T16:45:17Z] and center Cam Jurgens [Source: data/player-availability/latest.json#events[419], Cam Jurgens (BAL) OUT: "Jurgens (concussion) has been ruled out ahead of Sunday's game against the Falcons, Adam Caplan of SiriusXM NFL Radio reports.", published 2026-10-10T02:13Z, captured 2026-10-10T16:45:17Z] are also out, and Flowers is questionable [Source: data/player-availability/latest.json#events[233], Zay Flowers (BAL) QUESTIONABLE: "Zay Flowers QUESTIONABLE", published 2026-10-10T18:40Z, captured 2026-10-10T16:45:17Z].

**Home team (ATL).** Michael Penix started weeks 3–4 after Cooper Rush [Source: data/vault-seed/nflverse/player_stats_weekly.csv, ATL QB attempts>=10 by week: wk1 Cooper Rush 22 att; wk2 Cooper Rush 17 att; wk2 Jack Strand 15 att; wk3 Michael Penix Jr. 25 att; wk4 Michael Penix Jr. 20 att]. The offense is 29th in turnover rate [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — TO% ATL = 3.07 (rank 29/32), captured 2026-10-09T21:53:39Z]. A.J. Terrell Jr. is on IR [Source: data/secondary-matchups/secondary-matchup-vulnerability-2026-w05.json#matchups[26], ATL defense vs BAL: scheme match_zone,two_high,quarters; absences A.J. Terrell Jr. ir (manual context, capped/qualitative; absences re-validated against data/player-availability/latest.json), generated 2026-10-10T17:31:50Z].

**Matchup mechanics.** Atlanta's run game against a Baltimore front missing Hendrickson favors ATL, while Atlanta's turnovers are Baltimore's best route to a cover. ESPN's traced Flowers pick captures the mechanism: [Source: data/generated/master-intel/w05-expert-verified.json#rows[396] (ESPN NFL; Ben Solak, Seth Walder, Matt Bowen and Mike Clay; article published 2026-10-09T12:58:29Z; verifier-row timestamp 2026-10-10T20:38; https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games), verbatim: "Zay Flowers 6+ receptions (-109)" — traced in data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md (captured 2026-10-09T13:05:56)]. BEO has Flowers over 5.5 receptions at -105, and he is questionable.

**Market comparison.** The blend leans BAL +3 (50.0% with a 9.8% push) and Over 44 [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[BAL@ATL].simulation, blend home margin +1.32 / total 45.46; MC home cover 0.402, away cover 0.500, push 0.098, over 0.529, under 0.440; 100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z]. Both leans come from Lamar-only FTN and SRS samples, so both are labeled conflicted. Bettor counts are balanced while money leans ATL [Source: data/generated/master-intel/w05-pull.json#splits[13], Action Network splits BAL@ATL: spread ATL 45% bets/51% money, over 73%/66%, ML ATL 54%/74% (context only), captured 2026-10-10T17:55:26Z].

**Thesis / counter-thesis.** [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[BAL@ATL].dispositions, BAL +3 +102 BKR: P(win|no push) 55.4% vs break-even 49.5%, mkt-wt-0.8 +3.1pp → conflicted; Over 44 -103 BKR: P(win|no push) 54.6% vs break-even 50.7%, mkt-wt-0.8 +1.6pp → conflicted, computed from run 2026-10-10T22:55:19Z] No thesis is tiered. A qualitative ATL lean follows the Lamar news, which the market has already priced with a 7.5-point move. The counter is Atlanta's turnovers. The label changes if a Huntley-adjusted input set becomes available, or if Flowers is ruled out, which removes Baltimore's main pass target.


---

## BUF@LAR — pass

Kickoff 2026-10-13T00:15Z · SoFi Stadium · ESPN 401872994

### 1–2. Market baseline and implied score

| Book | Spread (home line) | Total | Moneyline (away/home) | Captured |
|---|---|---|---|---|
| BKR (baseline) | LAR -3.5 (-106) / BUF +3.5 (-108) | 54.5 (O -108 / U -108) | +164 / -188 (no-vig home 63.3%) | 2026-10-10T22:27:43Z |
| BEO | LAR -3.5 (-105) / BUF (-115) | 54.5 | +153 / -175 | 2026-10-10T21:15:15Z |
| AN open (context) | LAR -2.5 | 53.5 | — | 2026-10-05T00:25:25Z |
| SuperContest (contest) | LAR -3 | — | — | user-verified 2026-10-09; no capture time |

Market-implied score: LAR 29.0 – BUF 25.5 (BKR).

### 3. FTN team analytics (season-to-date, Weeks 1–4)

| FTN table — field | BUF (rank) | LAR (rank) |
|---|---|---|
| team-offense/efficiency — EPA/PLY | 0.162 (5) | 0.003 (13) |
| team-offense/efficiency — SUCC% | 46.7 (9) | 46.4 (10) |
| team-offense/passing-analytics — EPA/DB | 0.268 (4) | 0.06 (16) |
| team-offense/rushing-analytics — EPA/ATT | 0.02 (5) | -0.098 (17) |
| team-offense/pass-protection — PRESS% | 28.3 (15) | 25.6 (7) |
| team-offense/pass-protection — SK% | 6.5 (21) | 3.4 (5) |
| team-offense/tempo — PLY/GM | 60.0 (19) | 69.0 (3) |
| team-offense/tendencies — DPBK% | 57.5 (21) | 63.8 (10) |
| team-offense/overview — PT/GM | 31.8 (1) | 19.8 (21) |
| team-defense/efficiency — EPA/PLY | 0.105 (29) | -0.122 (3) |
| team-defense/passing-analytics — EPA/DB | 0.191 (27) | -0.129 (2) |
| team-defense/rush-analytics — EPA/ATT | -0.031 (23) | -0.113 (12) |
| team-defense/pass-rush — PRESS% | 34.7 (7) | 30.2 (15) |
| team-defense/pass-rush — SK% | 6.0 (15) | 5.0 (21) |
| team-defense/pass-rush — BLZ% | 32.9 (11) | 32.4 (13) |
| team-defense/overview — PT/GM | 26.8 (26) | 19.3 (11) |

Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, captured 2026-10-09T21:53:39Z. Ranks 1 = best (defensive EPA and offensive pressure/sack/turnover allowed ranked low-is-good).

### 4. Power ratings

| Team | Record | SRS | Net pts/g | Pythag | Model rank |
|---|---|---|---|---|---|
| BUF | 3-1 | 0.787 | 5 | 0.6002 | 9 |
| LAR | 2-2 | 2.861 | 0.5 | 0.5141 | 12 |

Source: data/generated/team-profiles/team-power-ratings-2026.json (generated 2026-10-10T07:06:04Z; 2026 season-to-date; provenance note inconsistency G17).

### 5. Availability and role

- **BUF** QB: Same starting QB all 4 weeks per nflverse weekly (attempts>=10)
- **LAR** QB: Same starting QB all 4 weeks per nflverse weekly (attempts>=10)

### 6. Weather / venue

- [Source: data/research-intel/review/2026-w05-weather-venue.json, BUF@LAR weather_status venue_condition_verification_required: do_not_apply_outdoor_weather_without_current venue/roof confirmation; venue SoFi Stadium (ESPN indoor flag False), generated 2026-10-10T17:56:55Z]

### 7. Secondary-matchup context (manual, capped, qualitative)

- BUF offense vs LAR defense (zone_heavy, two_high; front_dependent): absences Jaylen Watson limited (availability re-check: questionable); Quentin Lake setback (availability re-check: questionable); Kamren Kinchens limited (availability re-check: no current absence status); listed targets DJ Moore, Dalton Kincaid, Khalil Shakir, Keon Coleman.
- LAR offense vs BUF defense (zone_heavy, two_high, quarters; coverage_first): absences Dorian Strong ir (availability re-check: absence confirmed OUT/IR/PUP); Jordan Hancock ir (availability re-check: absence confirmed OUT/IR/PUP); Dee Alford setback (availability re-check: questionable); listed targets Puka Nacua, Jordan Whittington, Colby Parkinson, Davante Adams.

### 8. Simulation

| Quantity | Blend (60/25/15) | Market-only |
|---|---|---|
| Home margin / total mean | +4.29 / 54.19 | +3.5 / 54.5 |
| LAR cover -3.5 | 52.0% | 50.0% |
| BUF cover +3.5 | 48.0% | 50.0% |
| Spread push | 0.0% | 0.0% |
| Over 54.5 | 49.1% | 50.0% |
| Under 54.5 | 50.8% | 50.0% |
| LAR win | 66.6% | 64.7% |

100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z. Calibration caveat: dispersion and key numbers from the pinned 2018–2025 artifact; blend weights unbacktested.

### 9. Expert / article / podcast / split evidence

- Qualified named-expert picks: none for this game.
- research_only tags (cannot set a tier): expert_feed:prop 6, expert_feed:spread 3, expert_feed:moneyline 3, expert_feed:teaser 3, expert_feed:total 1, podcast:prop 3, podcast:moneyline 2, podcast:spread 4, podcast:teaser 1, article:spread 2, article:prop 2, article:moneyline 1, article:total 1; most frequent side/total tags: Buffalo Bills ×3, Los Angeles Rams ×2, moneyline BUF ×2, spread LAR -2.5 ×2, spread UNDER 3 ×2, Bills ×1.
- Splits (context): [Source: data/generated/master-intel/w05-pull.json#splits[14], Action Network splits BUF@LAR: spread LAR 26% bets/36% money, over 63%/71%, ML LAR 45%/54% (context only), captured 2026-10-10T17:55:26Z]

### 10. Disposition

| Market | Captured price | P(win|no push) | Break-even | Margin (pp) | At mkt wt 0.8 (pp) | FTN dev | SRS dev | Checks a/b/c/d | Label |
|---|---|---|---|---|---|---|---|---|---|
| LAR -3.5 | -106 BKR | 52.0% | 51.5% | 0.5 | -0.3 | 3.07 | 0.18 | ✗/✗/✓/✓ | pass |
| BUF +3.5 | -108 BKR | 48.0% | 51.9% | -3.9 | -3.1 | -3.07 | -0.18 | ✗/✗/✗/✓ | pass |
| Over 54.5 | -108 BKR | 49.1% | 51.9% | -2.8 | -2.4 | -1.24 | — | ✗/✗/✗/✓ | pass |
| Under 54.5 | -108 BKR | 50.8% | 51.9% | -1.1 | -1.4 | 1.24 | — | ✗/✗/✓/✓ | pass |

Invalidators: [time] Monday re-capture required (kickoff 2026-10-13T00:15Z); all Saturday prices > 48h old at kickoff; [line] LAR -3 or BUF +4 appears; [evidence] BEO captured no player props.


### Game state and thesis

**Game script.** LAR -3.5 (-106), BUF +3.5 (-108), total 54.5, tied for the highest on the slate [Source: data/generated/props/bookmaker-live-2026-10-10-week5.json, BKR BUF@LAR LAR -3.5 (home LAR -3.5 -106 / away BUF +3.5 -108), total 54.5 (O -108/U -108), ML BUF +164/LAR -188, captured 2026-10-10T22:27:43Z], implying roughly 29–25.5. This is Monday night at SoFi, a covered-roof venue [Source: data/research-intel/review/2026-w05-weather-venue.json, BUF@LAR weather_status venue_condition_verification_required: do_not_apply_outdoor_weather_without_current venue/roof confirmation; venue SoFi Stadium (ESPN indoor flag False), generated 2026-10-10T17:56:55Z]. The expected script is a shootout pace: the Rams are third in plays per game [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/tempo — PLY/GM LAR = 69.0 (rank 3/32), captured 2026-10-09T21:53:39Z], and Buffalo leads the league in explosive-play rate [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — EXP% BUF = 15.0 (rank 1/32), captured 2026-10-09T21:53:39Z]. The alternative is the Rams' defense, third in EPA/play allowed [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-defense/efficiency — EPA/PLY LAR = -0.122 (rank 3/32), captured 2026-10-09T21:53:39Z], slowing Josh Allen.

**Away team (BUF).** Allen has started every game [Source: data/vault-seed/nflverse/player_stats_weekly.csv, BUF QB attempts>=10 by week: wk1 Josh Allen 29 att; wk2 Josh Allen 31 att; wk3 Josh Allen 26 att; wk4 Josh Allen 33 att] and the offense is fifth in EPA/play [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-offense/efficiency — EPA/PLY BUF = 0.162 (rank 5/32), captured 2026-10-09T21:53:39Z]. The defense is the weakness, in the bottom tier by EPA/play allowed [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, FTN team-defense/efficiency — EPA/PLY BUF = 0.105 (rank 29/32), captured 2026-10-09T21:53:39Z]. Khalil Shakir has a setback note [Source: data/player-availability/latest.json#events[944], Khalil Shakir (BUF) ACTIVE_NEWS: "Shakir turned seven catches (on eight targets) into 82 yards during the Bills' 29-26 loss to the Patriots on Sunday. He also lost a fumble.", published 2026-10-06T00:13Z, captured 2026-10-10T16:45:17Z].

**Home team (LAR).** Matthew Stafford has started every game [Source: data/vault-seed/nflverse/player_stats_weekly.csv, LAR QB attempts>=10 by week: wk1 Matthew Stafford 25 att; wk2 Matthew Stafford 31 att; wk3 Matthew Stafford 55 att; wk4 Matthew Stafford 51 att]. Myles Garrett is on IR [Source: data/player-availability/latest.json#events[199], Myles Garrett (LAR) IR: "Myles Garrett IR", published 2026-10-10T23:30Z, captured 2026-10-10T16:45:17Z]. Buffalo's secondary absences [Source: data/secondary-matchups/secondary-matchup-vulnerability-2026-w05.json#matchups[29], BUF defense vs LAR: scheme zone_heavy,two_high,quarters; absences Dorian Strong ir; Jordan Hancock ir; Dee Alford setback (manual context, capped/qualitative; absences re-validated against data/player-availability/latest.json), generated 2026-10-10T17:31:50Z] give Puka Nacua a favorable draw.

**Matchup mechanics.** The Rams' pace and Buffalo's explosiveness both point to volume [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[BUF@LAR].simulation, blend home margin +4.29 / total 54.19; MC home cover 0.520, away cover 0.480, push 0.000, over 0.491, under 0.508; 100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z]. The Rams' defensive efficiency and Garrett's absence [Source: data/player-availability/latest.json#events[199], Myles Garrett (LAR) IR: "Myles Garrett IR", published 2026-10-10T23:30Z, captured 2026-10-10T16:45:17Z] partly offset each other.

**Market comparison.** The line opened LAR -2.5 / 53.5 [Source: data/odds/actionnetwork-openers-2026-w05.json, Action Network 'Open' book BUF@LAR home line -2.5, total 53.5, recorded 2026-10-05T00:25:25Z; opener context only, pulled 2026-10-08T03:36:16Z]. The blend projects LAR by 4.3 with a 54.2 total, giving LAR -3.5 52.0% and Over 54.5 49.2% [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[BUF@LAR].simulation, blend home margin +4.29 / total 54.19; MC home cover 0.520, away cover 0.480, push 0.000, over 0.491, under 0.508; 100,000 draws, seed 20261010, run 2026-10-10T22:55:19Z]. Neither clears the thresholds. The SuperContest line is LAR -3, half a point better than the market [Source: data/supercontest/week-05-2026-verified-lines.json#lines[14], SuperContest LAR -3 vs BUF (contest line only; user-verified 2026-10-09, no capture time; file home/away orientation matches)]. BetOnline captured no player props for this game, and BKR's props are the only priced player menu.

**Thesis / counter-thesis.** [Source: data/research-intel/proposed/2026-w05-opus-synthesis.json#games[BUF@LAR].dispositions, LAR -3.5 -106 BKR: P(win|no push) 52.0% vs break-even 51.5%, mkt-wt-0.8 -0.3pp → pass, computed from run 2026-10-10T22:55:19Z] Pass. The model is within noise of the market. The counter to the slight LAR lean is Buffalo's explosiveness against a Rams team without Garrett. Kickoff is Tue 2026-10-13 00:15Z, so every price here will be more than 48 hours old by then. The disposition changes only after a Monday re-capture; if LAR -3 or BUF +4 appears, re-run the game.


---

## Evidence conflicts preserved

| Game | Conflict |
|---|---|
| NYG@WAS | Model lean NYG +3.5 (stale WAS QB sample) vs ESPN traced WAS -3.5 (rows[394]); FTN BLZ% 47.4 (2nd) vs secondary file "passive" tag. |
| SF@SEA | Model Over 46.5 (54.4%) vs ESPN traced Under 45.5 (rows[393]); the source number has moved +1, so neither carries a tier. Model SF +3 vs heavy public SF and research-only SEA tags. |
| CHI@GB | Model CHI -1.5 (stale CHI QB sample) vs research-only tags split GB/CHI; ESPN traced Bagent INT over (rows[400]). |
| BAL@ATL | Model BAL +3 / Over (Lamar-only sample) vs market move of 7.5 points toward ATL. |
| MIN@NO | Model MIN -2.5 vs research-only NO tags (7) and BEO MIN -1 vs BKR -2.5. |
| IND@PIT | ESPN traced Under 44.5 (rows[390]) agrees with the model, but the number has moved −1, so that support is downgraded. |
| DEN@LAC | VSiN traced Bo Nix rush O13.5 (rows[386]) vs Nix 2026 game log 2/6/7/10 rush yds. |
| PHI@JAX | Line moved −3.5 → −7.5 through 3 and 7; any source quoting −7 or shorter is a different bet. |

## Delta checklist (required before any use; not yet run)

| Window | Kickoff UTC | Kickoff PT | Run checklist by | Items |
|---|---|---|---|---|
| PHI@JAX | 2026-10-11T13:30Z | 2026-10-11 06:30 PT | ≈05:00 PT Sun | official inactives/starters; fresh BKR+BEO capture (≤3h); weather/venue recheck; ESPN status; source-pick repricing; roster vet --fetch |
| 1 PM ET window (8 games) | 2026-10-11T17:00Z | 2026-10-11 10:00 PT | ≈08:30 PT Sun | official inactives/starters; fresh BKR+BEO capture (≤3h); weather/venue recheck; ESPN status; source-pick repricing; roster vet --fetch |
| DEN@LAC / DET@ARI / SF@SEA | 2026-10-11T20:05–20:25Z | 2026-10-11 13:05–13:25 PT | ≈11:35 PT Sun | official inactives/starters; fresh BKR+BEO capture (≤3h); weather/venue recheck; ESPN status; source-pick repricing; roster vet --fetch |
| BAL@ATL (SNF) | 2026-10-12T00:20Z | 2026-10-11 17:20 PT | ≈15:50 PT Sun | official inactives/starters; fresh BKR+BEO capture (≤3h); weather/venue recheck; ESPN status; source-pick repricing; roster vet --fetch |
| BUF@LAR (MNF) | 2026-10-13T00:15Z | 2026-10-12 17:15 PT | ≈15:45 PT Mon | official inactives/starters; fresh BKR+BEO capture (≤3h); weather/venue recheck; ESPN status; source-pick repricing; roster vet --fetch |

## Model limits

- The FTN and SRS components are raw four-game samples with no opponent adjustment. They drive every deviation from the market here, and their 40% combined weight is the prompt contract, not a fitted value.
- The probabilities are comparison signals. They are not calibrated edges and they were not backtested.
- Game-level output says nothing about player props. The prop menu is generated rows with 2026 usage context only.
- Inputs current as of the captures above. Official inactives were not yet available.

