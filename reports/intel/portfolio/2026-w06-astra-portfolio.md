# Platinum Rose — Week 6 Astra portfolio
As of Oct 17, 2026, 7:57 PM PT. Generated 2026-10-18T02:57:48.021Z. HEAD 29d829d (note only). Proposed research; no execution or promotion. Exactly 12 ranked picks, 3 parlays, 3 teasers and five contest selections. All prices are captured or explicitly price-est.

Kickoffs: Sunday October 18, 06:30 / 10:00 / 13:05 / 13:25 / 17:20 PT; Monday October 19, 17:15 PT. [Source: scratch/w06-astra-synthesis-queue.json, packets[].kickoff_utc, queue built 2026-10-17]

Data ages at generation: BKR 7.3h; BEO start 5.7h; spread/total splits 8.7h; stale moneyline splits 47.5h; roster source 4.6h. Ages in inherited game prose were not current ages. FTN is the accepted weekly October 16 context.

## Gate notes

- Current activation explicitly treats pins, roster/status, kickoff and conditions as notes; no hashes rechecked and roster:vet not rerun.
- HEAD 29d829d differs from earlier ea74728 and HOU-attempt b33e1bc. CHI report uses ccd8753. These describe different snapshots, not a fresh common preflight.
- RUNLOG includes earlier STOPPED and COMPLETE entries; HOU outputs were preserved through the later stopped attempt. Existing report claims are inherited, not recertified.
- Stored roster receipt is PASS with 10 UNVERIFIED rows and one QUESTIONABLE row; it is not an official inactive list. No unresolved Najee or ambiguous alias prop is needed for this card.
- Article gate was cleared by disposition 2026-10-17; 8303 excluded. Old blocked/unresolved strings persist in some reports. Article leads are publish-time, execution-unverified and not promoted.
- Full schedule comes from queued packet kickoff timestamps: earliest 2026-10-18 06:30 PT, latest 2026-10-19 17:15 PT. No live scoreboard was consulted; calendar windows remain inherited.
- BKR 12:40 PT and BEO 14:15-14:16 PT are asynchronous captures. Comparing them is not proof both numbers remain available or that the later move is wrong.
- All official inactives remain pending in inherited reports. Williams assumed to play; Brown assumed active with uncertain workload; Barkley reporter hedge unresolved. BAL/TB backup-QB scenarios retained as reported.
- IND/ATL roof unknown; LV fixed dome. No outdoor weather adjustment applied to those venues. WAS/SF wind exceeds gust and is rejected as a wind input.
- Moneyline split source is 2026-10-16T03:30Z; fresh big-money-flag last_seen timestamps do not refresh the underlying observation. Moneyline splits carry no scoring weight.
- FTN weekly cadence accepted; some GP=4 versus ESPN=5 and KC bye/stale_1wk notes remain. Team blend is not independently backtested and contains no calibrated QB replacement term.
- Some source quotes are structured-only, internally contradictory or unverified against raw captions. No new verbatim quote is asserted here; same-author/show signals are not additive independent votes.
- Existing reports contain inconsistent exact-key-number percentages and price-change advice. New calculations use only margin-simulator.mjs; outcome thresholds are evaluated at a fixed anchored distribution, with exact center-shift compensation.
- Week-5 output validator is not suitable for this Week-6 portfolio schema. Manual structural checks and simulator selftest are used.
- No A grades: all selected numerical edges are small and every prop lacks a calibrated hit-rate estimate.

## Ranking method

50 + clamp(5*edge_pts,-20,20) + 6*consensus + 4*price_vs_market - 5*news_risk + 2*correlation_value - model_risk_penalty. Percentage-point probability minus price break-even, with pushes excluded. Props: unknown edge, numerical component zero, missing-model penalty 4. ML penalty 12 for tail/settlement sensitivity. Contest threshold 50% is a neutral comparison, not a cash break-even. Consensus and price -2 to +2; news 0 to 3. Consensus is an analyst rubric after discounting duplicate/stale leads, not a raw speaker count. Correlation -0.5 for totals, zero otherwise before explicit portfolio constraints. Publish-time availability/price quality, not an extra model probability; line advantage is already in fixed-distribution edge. Negative for moved-away analyst lines. Lower news risk, then stable id for equally robust captures. Stafford and Tucker score ties are not evidence of a meaningful rank difference.

All two-sided spreads, totals and moneylines on BKR and parsed BEO game_lines, plus five sourced priced prop leads; both locked contest sides per game. Not an exhaustive search over thousands of unsupported prop ladders. Rank is relative to this evidence set, not a declaration that twelve profitable offers exist. A would require robust cross-source support and price margin; none qualifies. B = thin positive conditional edge; C = missing model, near-zero/negative edge or a fragile premise. Confidence units 1–3 are ordinal confidence only; used here: B=2, C=1.

Exactly 12 primary picks, at most three props. At most one side/total/ML per game; a separate prop can coexist but is explicitly correlated. Stroud over excluded from the selected twelve because it conflicts with the adopted HOU wind/under thesis, not because of a gate. Primary score ordering is retained among eligible picks; combinations and locked contest alternatives are separate menus, not additional independent convictions. No report gate removed a candidate by itself.

Simulator selftest passed. For alternate line L and total T, margin input = original opinion + (L-L0) + centerShift0-centerShiftNew; total input = original opinion + (T0-T) + totalCenterShift0-totalCenterShiftNew. This preserves the exact distribution instead of recentering at every offer. Mechanical translation is not an additional opinion adjustment. All opinion adjustments are within the 2-point soft cap. Conditional sensitivity estimates, not validated independent forecasts; no prop/parlay/teaser joint calibration. Normalize strict home win by (1-tie), and away equivalently, assuming regulation tie voids two-way ML; actual rules require confirmation.

## Slate board — 13 games

| Game | Inherited lean / tier | Chosen cash comparison; sim / BE / edge pp | Quant gap: home margin / total | Opener to BKR | Consensus / split read | Availability / flip |
| --- | --- | --- | --- | --- | --- | --- |
| HOU@JAX | Under 42.5 / research_only | HOU@JAX Under 42.5 -110 BEO; 53.03 / 52.38 / 0.65 | 2.35 / 0.21 | {"home_spread":-2.5,"total":43.5,"ml":{"HOU":125,"JAX":-151},"spread_at":"2026-10-12T00:06:35Z"} -> home -2.5 / 42 | Anderson, Makinen and Bowen lean under; BEO 42.5 retains their number. The quantitative blend instead has 42.21 and 68% of total money is over. Article 8332 has ambiguous game mapping and is not an extra vote. Over money 68%. | London gust forecast is not an observation; official inactives pending. Drop the under preference if gusts ease materially or total falls below 42.5 without cheaper odds; refresh before 06:30 PT. |
| NYJ@NE | NYJ +7 / 2- | NYJ +7 -103 BKR; 51.46 / 50.74 / 0.72 | -1.24 / -0.43 | {"nyj_spread":7.5,"ne_spread":-7.5,"total":44.5,"ml":{"NYJ":280,"NE":-366},"spread_at":"2026-10-12T00:02:55Z","total_at":"2026-10-12T03:05:25Z"} -> home -7 / 43.5 | About four independent podcast episodes favor NYJ, mostly at +7.5. FTN/blend implies NE by 5.76; 74% spread tickets and 72% money favor NE. Brown return offsets part of the dog case. Over money 67%. | Brown activated/questionable; assumed active, normal workload uncertain. Brown full workload weakens NYJ; Brown out strengthens it. Below +7 or worse than -103 loses the narrow price advantage. |
| PIT@TB | TB +2.5 / 2- | TB +2.5 -105 BEO; 51.31 / 51.22 / 0.09 | 1.06 / 0.32 | {"captured_at":"2026-10-12T01:00:25Z","source":"data/odds/actionnetwork-openers-2026-w06.json","spread":{"PIT":-2.5,"TB":2.5,"TB_odds":-103},"total":40.5,"moneyline":{"PIT":-150,"TB":125}} -> home +2.5 / 39 | Action Network, Tucker show and VSiN favor TB; Erickson favors PIT. Quant points slightly toward TB, but has no QB replacement term; 75% spread money favors PIT. Over money 76%. | Assume Daniels starts as reported; no probability assigned to the QB scenario. If QB news changes, reassess the direction; TB +3 improves protection, +2 or -110 at +2.5 weakens the selection. |
| BAL@CLE | CLE +3 / skip | CLE +3 -105 BEO; 51.43 / 51.22 / 0.21 | 0.54 / -0.55 | {"BAL_spread":-4.5,"total":41,"BAL_ml":-219,"CLE_ml":180,"at":"2026-10-12"} -> home +3 / 40.5 | CLE analyst cluster mostly took +4.5 to +5.5; the +3 BEO price is only narrowly supported by the shrunken quant. Lamar-conditional BAL endorsements receive zero weight. Over money 71%. | Huntley assumed starter; inactives and CLE skill/defensive status pending. Lamar returning changes the premise; +2.5 loses key-number protection; +3 needs -105 or better for this tiny central edge. |
| CHI@ATL | ATL +3 contest only / 2- | CHI@ATL Over 52.5 -108 BKR; 51.52 / 51.92 / -0.4 | -0.11 / 0.5 | {"spread":"CHI -2","total":48,"ml":"CHI -129 / ATL +102","at":"2026-10-12T00:22Z"} -> home +1 / 52.5 | FTN pass-offense/SRS favors CHI with Williams. ATL supporters generally held +3 or +3.5, not +1. Spread money 68% ATL; disagreement keeps cash conviction low. Over money 70%. | News-dependent Williams scenario, Penix and roof status. Williams out switches cash preference to ATL/under; Penix out with Williams active switches toward CHI. Keep contest ATL +3 as the base scenario. |
| TEN@IND | Under 45 / research_only | TEN@IND Under 45 -110 BEO; 53.13 / 52.38 / 0.75 | -0.38 / -0.32 | {"captured_at":"2026-10-12T04:30:15Z","home_spread":-7,"home_spread_odds":-106,"total":44,"ml":{"TEN":255,"IND":-325}} -> home -7 / 44.5 | Quant total 44.18 and Fitzmaurice under lean agree, but 69% total money is over. TEN ATS voices do not imply IND cannot win outright. Over money 69%. | IND retractable roof unknown; do not apply outdoor forecast. Skill-player availability pending. Roof open with material weather requires a new read; total below 44.5 or negative offensive injury reversal weakens under. |
| CAR@PHI | Under 39; CAR contest +1.5 / research_only | CAR@PHI Under 39 -108 BKR; 53.11 / 51.92 / 1.19 | -0.07 / 0.53 | {"source":"data/odds/actionnetwork-openers-2026-w06.json /games/CAR@PHI","sp_home":-1.5,"sp_at":"2026-10-12T00:09:15Z","total":42.5,"ml":{"CAR":-100,"PHI":-122}} -> home +3 / 39 | McKee/slow PHI support under qualitatively, but quant total 39.53 and 73% over money disagree. Most CAR side endorsements predate the 4.5-point move. Over money 73%. | Assume McKee starts; Barkley absence remains a reporter hedge; Moton likely available per later article. Barkley and other weapons active weakens under. CAR +1.5 belongs only to the locked contest, not a cash offer. |
| NO@NYG | NYG +1.5 contest / skip | NYG ML -101 BKR; 51.15 / 50.25 / 0.9 | -0.53 / 0.41 | {"home_spread":-1.5,"total":45.5,"spread_at":"2026-10-12T00:08:25Z"} -> home -1 / 46 | Quant home margin 0.47 vs market 1 favors NO a little. NYG analysts mostly took +1.5; over backers took 44-44.5, while Fezzik preferred under 45.5. Over money 76%. | Thomas/Carter, Olave/Kamara and other inactives; Likely TD price/rationale unresolved. Both NYG tackles out weakens contest NYG; a QB change overrides the base scenario. Cash -1 is not contest +1.5. |
| ARI@LAR | ARI +13.5, expensive / research_only | ARI@LAR Over 51 -110 BEO; 53.13 / 52.38 / 0.75 | -2.1 / -0.07 | {"home_spread":-12.5,"total":52,"ml":{"ARI":510,"LAR":-706},"at":"2026-10-12"} -> home -13.5 / 52 | Tuley/Erickson/Hunter/Tucker lean ARI; Kezirian/Anderson backed cheaper LAR numbers. Quant home margin 11.40 versus market 13.5 favors ARI, but ARI -117 is expensive. Over money 65%. | ARI OL/skill and LAR secondary inactives; BEO spread 12.5 conflicts with earlier BKR 13.5. ARI +14 at reasonable juice improves; confirmed extra ARI OL losses weaken it. Do not call BKR 13.5 live. |
| BUF@LV | LV +4.5 / 2- | LV +4.5 -108 BKR; 52.68 / 51.92 / 0.76 | 1.86 / -0.1 | {"source":"data/odds/actionnetwork-openers-2026-w06.json","LV_spread":6,"LV_price":-110,"total":53.5,"ml":{"BUF":-275,"LV":222},"spread_at":"2026-10-12T05:05:15Z","total_at":"2026-10-12T01:02:05Z","cross_book":true} -> home +4.5 / 53.5 | Millman, Stuckey and Anderson took LV +5.5; present +4.5 is worse. Quant/FTN blend favors LV relative to spread, although BUF offense is stronger and Makinen backed BUF. Over money 83%. | BUF receiver availability; Allen/Cousins inactives; fixed dome means no outdoor weather input. LV below +4.5 or more than -108 weakens this thin edge; both BUF receivers returning makes the counter-case stronger. |
| LAC@KC | KC -7.5; under price moved / skip | KC -7.5 -108 BKR; 51.4 / 51.92 / -0.52 | 1.76 / -0.24 | {"source":"data/odds/actionnetwork-openers-2026-w06.json","kc_spread":-7.5,"total":43.5,"ml":{"LAC":320,"KC":-420},"sp_at":"2026-10-12T00:29:55Z"} -> home -7.5 / 41.5 | Quant projects KC by 9.26; KC support is largely straight-up/teaser, not ATS confirmation. Anderson/Erickson/Makinen unders were 42.5+, above current 41-41.5. Over money 69%. | LAC OL and KC skill inactives; outdoor forecast moderate, refresh gusts. KC -6.5 is materially better; new LAC OL loss supports KC. Under needs 42.5 or materially cheaper juice. |
| DAL@GB | DAL +1.5 qualitative / teaser / research_only | GB -1 -110 BEO; 51.25 / 52.38 / -1.13 | 0.08 / 0.26 | {"home_spread":-0.5,"total":52,"ml":{"DAL":-111,"GB":-110},"captured_at":"2026-10-12T00:06:15Z"} -> home -1.5 / 53 | Maldonado/Erickson favor DAL; Makinen/GB voices disagree. Quant has no usable gap. Over has 86% money and 97% public-contest support, not an independent edge. Over money 86%. | GB DL absences, DAL defensive availability; Love/Prescott and Lambeau weather refresh. DAL +2.5/+3 improves; BEO +1 is worse than BKR +1.5. Love passing lead 272.5 is now 280.5, so do not recycle the old number. |
| WAS@SF | SF -7.5 / research_only | SF -7.5 -108 BEO; 52.65 / 51.92 / 0.73 | 1.22 / -0.31 | {"sf_spread":-7.5,"total":51,"ml":{"WAS":330,"SF":-425},"ts":"2026-10-12T00:05:40Z"} -> home -8 / 51.5 | Kezirian/Perrault/Pisapia and Erickson favored SF -7.5; BEO retains that line versus BKR -8. Quant agrees, while 80% spread money makes it crowded. Over money 77%. | Monday inactives, Bosa/Evans/OL; wind greater than gust field is invalid and is not used. Bosa plus OL loss shifts toward WAS; -8 is worse than captured -7.5. Refresh Monday before relying on the card. |

Board citations: [Source: data/research-intel/proposed/games-w06/2026-w06-astra-HOU_at_JAX.json, market_snapshot, adjustments, ambiguities, 2026-10-17T22:42:00Z] [Source: data/research-intel/proposed/games-w06/2026-w06-astra-NYJ_at_NE.json, market_snapshot, adjustments, ambiguities, 2026-10-17T22:43:32Z] [Source: data/research-intel/proposed/games-w06/2026-w06-astra-PIT_at_TB.json, market_snapshot, adjustments, ambiguities, 2026-10-17T22:45:59Z] [Source: data/research-intel/proposed/games-w06/2026-w06-astra-BAL_at_CLE.json, market_snapshot, adjustments, ambiguities, 2026-10-17T22:41:54Z] [Source: data/research-intel/proposed/games-w06/2026-w06-astra-CHI_at_ATL.json, market_snapshot, adjustments, ambiguities, 2026-10-18T02:19:54Z] [Source: data/research-intel/proposed/games-w06/2026-w06-astra-TEN_at_IND.json, market_snapshot, adjustments, ambiguities, 2026-10-17T22:40:00Z] [Source: data/research-intel/proposed/games-w06/2026-w06-astra-CAR_at_PHI.json, market_snapshot, adjustments, ambiguities, 2026-10-17T22:40:00Z] [Source: data/research-intel/proposed/games-w06/2026-w06-astra-NO_at_NYG.json, market_snapshot, adjustments, ambiguities, 2026-10-17T22:41:27Z] [Source: data/research-intel/proposed/games-w06/2026-w06-astra-ARI_at_LAR.json, market_snapshot, adjustments, ambiguities, 2026-10-17T22:39Z] [Source: data/research-intel/proposed/games-w06/2026-w06-astra-BUF_at_LV.json, market_snapshot, adjustments, ambiguities, 2026-10-17T22:45:48Z] [Source: data/research-intel/proposed/games-w06/2026-w06-astra-LAC_at_KC.json, market_snapshot, adjustments, ambiguities, 2026-10-17T22:43:34Z] [Source: data/research-intel/proposed/games-w06/2026-w06-astra-DAL_at_GB.json, market_snapshot, adjustments, ambiguities, 2026-10-17T22:40:03Z] [Source: data/research-intel/proposed/games-w06/2026-w06-astra-WAS_at_SF.json, market_snapshot, adjustments, ambiguities, 2026-10-17T22:40:00Z] [Source: data/research-intel/proposed/2026-w06-quantitative-synthesis.json, games[].means/features, 2026-10-17T21:11:11.361Z] [Source: data/generated/master-intel/w06-splits-all.json, games[].spread/total, 2026-10-17T18:14:06Z]

## Top 12 picks

| Rank | Pick | Captured odds / book | BE % | Conditional sim % | Edge pp | Grade / confidence | Score |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | LV +4.5 | -108 / BKR | 51.92 | 52.68 | 0.76 | B / 2 | 58.8 |
| 2 | HOU@JAX Under 42.5 | -110 / BEO | 52.38 | 53.03 | 0.65 | B / 2 | 56.26 |
| 3 | TEN@IND Under 45 | -110 / BEO | 52.38 | 53.13 | 0.75 | B / 2 | 53.73 |
| 4 | NYJ +7 | -103 / BKR | 50.74 | 51.46 | 0.72 | B / 2 | 53.61 |
| 5 | SF -7.5 | -108 / BEO | 51.92 | 52.65 | 0.73 | B / 2 | 52.63 |
| 6 | TB +2.5 | -105 / BEO | 51.22 | 51.31 | 0.09 | C / 1 | 52.46 |
| 7 | Matthew Stafford passing yards Under 286.5 | -109 / BKR | 52.15 | not modeled | unknown | C / 1 | 51 |
| 8 | Tre Tucker receiving yards Over 38.5 | -114 / BKR | 53.27 | not modeled | unknown | C / 1 | 51 |
| 9 | ARI@LAR Over 51 | -110 / BEO | 52.38 | 53.13 | 0.75 | C / 1 | 47.74 |
| 10 | CLE +3 | -105 / BEO | 51.22 | 51.43 | 0.21 | C / 1 | 46.05 |
| 11 | KC -7.5 | -108 / BKR | 51.92 | 51.4 | -0.52 | C / 1 | 42.4 |
| 12 | GB -1 | -110 / BEO | 52.38 | 51.25 | -1.13 | C / 1 | 42.34 |


### 1. LV +4.5 -108 — B
Thin positive conditional price edge with some supporting intel; not robust enough for A. Keep +1 LV, about half the quant +1.86 gap; total zero. [Source: data/odds/BKR_current_lines_1017_1240_buildfmt, row BUF@LV, 2026-10-17T19:40:00Z] [Source: data/research-intel/proposed/games-w06/2026-w06-astra-BUF_at_LV.json, adjustments, market_snapshot, ambiguities, delta_checklist, 2026-10-17T22:45:48Z] [Source: reports/intel/games/2026-w06-astra-BUF_at_LV.md, Expert / podcast / article agreement; Props; Counter-case, 2026-10-17T22:45:48Z] [Source: data/research-intel/proposed/2026-w06-quantitative-synthesis.json, games[event=BUF @ LV].means/features, 2026-10-17T21:11:11.361Z]

Market / analytics / expert comparison: Millman, Stuckey and Anderson took LV +5.5; present +4.5 is worse. Quant/FTN blend favors LV relative to spread, although BUF offense is stronger and Makinen backed BUF.

Counter-case: BUF offensive efficiency and turnover regression can overwhelm LV; the short-rest snap claim is not independently verified.

Price sensitivity: Conditional fair American price about -111 at the identical line; probability excludes pushes (ML excludes ties). Require better than fair to allow a margin for uncertainty. Change condition: LV below +4.5 or more than -108 weakens this thin edge; both BUF receivers returning makes the counter-case stronger.

Scenario and last look: BUF receiver availability; Allen/Cousins inactives; fixed dome means no outdoor weather input. Captured offer only; not verified live. Conditional on the stated judgment adjustment and fixed earlier board anchor; not an independently validated forecast. Confirm active participants and expected roles. Recheck the same line, odds, market and book. BUF receiver availability; Allen/Cousins inactives; fixed dome means no outdoor weather input. LV below +4.5 or more than -108 weakens this thin edge; both BUF receivers returning makes the counter-case stronger.

### 2. HOU@JAX Under 42.5 -110 — B
Thin positive conditional price edge with some supporting intel; not robust enough for A. Keep the report margin at zero; split side opinions offset the large unbacktested JAX model gap. Use only -0.5 total for the forecast gust/pace hypothesis. [Source: data/research-intel/source-evidence/2026-10-17-betonline-week6-props-parsed.json, /rows/5, 2026-10-17T21:15:26.601Z] [Source: data/research-intel/proposed/games-w06/2026-w06-astra-HOU_at_JAX.json, adjustments, market_snapshot, ambiguities, delta_checklist, 2026-10-17T22:42:00Z] [Source: reports/intel/games/2026-w06-astra-HOU_at_JAX.md, Expert / podcast / article agreement; Props; Counter-case, 2026-10-17T22:42:00Z] [Source: data/research-intel/proposed/2026-w06-quantitative-synthesis.json, games[event=HOU @ JAX].means/features, 2026-10-17T21:11:11.361Z]

Market / analytics / expert comparison: Anderson, Makinen and Bowen lean under; BEO 42.5 retains their number. The quantitative blend instead has 42.21 and 68% of total money is over. Article 8332 has ambiguous game mapping and is not an extra vote.

Counter-case: A pass-heavy game or turnovers can produce quick points; the over money and quantitative total disagree with the under.

Price sensitivity: Conditional fair American price about -113 at the identical line; probability excludes pushes (ML excludes ties). Require better than fair to allow a margin for uncertainty. Change condition: Drop the under preference if gusts ease materially or total falls below 42.5 without cheaper odds; refresh before 06:30 PT.

Scenario and last look: London gust forecast is not an observation; official inactives pending. Captured offer only; not verified live. Conditional on the stated judgment adjustment and fixed earlier board anchor; not an independently validated forecast. Confirm active participants and expected roles. Recheck the same line, odds, market and book. London gust forecast is not an observation; official inactives pending. Drop the under preference if gusts ease materially or total falls below 42.5 without cheaper odds; refresh before 06:30 PT.

### 3. TEN@IND Under 45 -110 — B
Thin positive conditional price edge with some supporting intel; not robust enough for A. Keep -0.4 toward TEN and -0.5 total; slow TEN pace offsets faster IND pace. [Source: data/research-intel/source-evidence/2026-10-17-betonline-week6-props-parsed.json, /rows/361, 2026-10-17T21:15:50.077Z] [Source: data/research-intel/proposed/games-w06/2026-w06-astra-TEN_at_IND.json, adjustments, market_snapshot, ambiguities, delta_checklist, 2026-10-17T22:40:00Z] [Source: reports/intel/games/2026-w06-astra-TEN_at_IND.md, Expert / podcast / article agreement; Props; Counter-case, 2026-10-17T22:40:00Z] [Source: data/research-intel/proposed/2026-w06-quantitative-synthesis.json, games[event=TEN @ IND].means/features, 2026-10-17T21:11:11.361Z]

Market / analytics / expert comparison: Quant total 44.18 and Fitzmaurice under lean agree, but 69% total money is over. TEN ATS voices do not imply IND cannot win outright.

Counter-case: IND defense allows sustained scoring and its faster offense can push the game above 45.

Price sensitivity: Conditional fair American price about -113 at the identical line; probability excludes pushes (ML excludes ties). Require better than fair to allow a margin for uncertainty. Change condition: Roof open with material weather requires a new read; total below 44.5 or negative offensive injury reversal weakens under.

Scenario and last look: IND retractable roof unknown; do not apply outdoor forecast. Skill-player availability pending. Captured offer only; not verified live. Conditional on the stated judgment adjustment and fixed earlier board anchor; not an independently validated forecast. Confirm active participants and expected roles. Recheck the same line, odds, market and book. IND retractable roof unknown; do not apply outdoor forecast. Skill-player availability pending. Roof open with material weather requires a new read; total below 44.5 or negative offensive injury reversal weakens under.

### 4. NYJ +7 -103 — B
Thin positive conditional price edge with some supporting intel; not robust enough for A. Keep -0.5 toward NYJ: shrink the quant -1.24 and allow +0.5 for Brown likely returning; total -0.3. [Source: data/odds/BKR_current_lines_1017_1240_buildfmt, row NYJ@NE, 2026-10-17T19:40:00Z] [Source: data/research-intel/proposed/games-w06/2026-w06-astra-NYJ_at_NE.json, adjustments, market_snapshot, ambiguities, delta_checklist, 2026-10-17T22:43:32Z] [Source: reports/intel/games/2026-w06-astra-NYJ_at_NE.md, Expert / podcast / article agreement; Props; Counter-case, 2026-10-17T22:43:32Z] [Source: data/research-intel/proposed/2026-w06-quantitative-synthesis.json, games[event=NYJ @ NE].means/features, 2026-10-17T21:11:11.361Z]

Market / analytics / expert comparison: About four independent podcast episodes favor NYJ, mostly at +7.5. FTN/blend implies NE by 5.76; 74% spread tickets and 72% money favor NE. Brown return offsets part of the dog case.

Counter-case: A full Brown workload and NE efficiency advantage can turn a close contest into a double-digit win.

Price sensitivity: Conditional fair American price about -106 at the identical line; probability excludes pushes (ML excludes ties). Require better than fair to allow a margin for uncertainty. Change condition: Brown full workload weakens NYJ; Brown out strengthens it. Below +7 or worse than -103 loses the narrow price advantage.

Scenario and last look: Brown activated/questionable; assumed active, normal workload uncertain. Captured offer only; not verified live. Conditional on the stated judgment adjustment and fixed earlier board anchor; not an independently validated forecast. Confirm active participants and expected roles. Recheck the same line, odds, market and book. Brown activated/questionable; assumed active, normal workload uncertain. Brown full workload weakens NYJ; Brown out strengthens it. Below +7 or worse than -103 loses the narrow price advantage. Alternative: If Brown is fully active and NE gains additional weapons, use LV +4.5 as a substitute rather than force the NYJ leg.

### 5. SF -7.5 -108 — B
Thin positive conditional price edge with some supporting intel; not robust enough for A. Keep +0.5 SF/-0.3 total; no wind input. Shrink quant +1.22 for injuries and small sample. [Source: data/research-intel/source-evidence/2026-10-17-betonline-week6-props-parsed.json, /rows/975, 2026-10-17T21:16:24.641Z] [Source: data/research-intel/proposed/games-w06/2026-w06-astra-WAS_at_SF.json, adjustments, market_snapshot, ambiguities, delta_checklist, 2026-10-17T22:40:00Z] [Source: reports/intel/games/2026-w06-astra-WAS_at_SF.md, Expert / podcast / article agreement; Props; Counter-case, 2026-10-17T22:40:00Z] [Source: data/research-intel/proposed/2026-w06-quantitative-synthesis.json, games[event=WAS @ SF].means/features, 2026-10-17T21:11:11.361Z]

Market / analytics / expert comparison: Kezirian/Perrault/Pisapia and Erickson favored SF -7.5; BEO retains that line versus BKR -8. Quant agrees, while 80% spread money makes it crowded.

Counter-case: Bosa/receiver limitations and SF efficiency regression can allow a WAS backdoor cover.

Price sensitivity: Conditional fair American price about -111 at the identical line; probability excludes pushes (ML excludes ties). Require better than fair to allow a margin for uncertainty. Change condition: Bosa plus OL loss shifts toward WAS; -8 is worse than captured -7.5. Refresh Monday before relying on the card.

Scenario and last look: Monday inactives, Bosa/Evans/OL; wind greater than gust field is invalid and is not used. Captured offer only; not verified live. Conditional on the stated judgment adjustment and fixed earlier board anchor; not an independently validated forecast. Confirm active participants and expected roles. Recheck the same line, odds, market and book. Monday inactives, Bosa/Evans/OL; wind greater than gust field is invalid and is not used. Bosa plus OL loss shifts toward WAS; -8 is worse than captured -7.5. Refresh Monday before relying on the card. Alternative: If Bosa and key OL availability worsen, substitute KC -7.5; both are C-level at their weaker prices.

### 6. TB +2.5 -105 — C
Only C: the central edge is below 0.3 percentage points and news can overwhelm it. Keep +0.5 toward TB, approximately half the quant +1.06; total zero because opposing effects cancel. [Source: data/research-intel/source-evidence/2026-10-17-betonline-week6-props-parsed.json, /rows/249, 2026-10-17T21:15:35.667Z] [Source: data/research-intel/proposed/games-w06/2026-w06-astra-PIT_at_TB.json, adjustments, market_snapshot, ambiguities, delta_checklist, 2026-10-17T22:45:59Z] [Source: reports/intel/games/2026-w06-astra-PIT_at_TB.md, Expert / podcast / article agreement; Props; Counter-case, 2026-10-17T22:45:59Z] [Source: data/research-intel/proposed/2026-w06-quantitative-synthesis.json, games[event=PIT @ TB].means/features, 2026-10-17T21:11:11.361Z]

Market / analytics / expert comparison: Action Network, Tucker show and VSiN favor TB; Erickson favors PIT. Quant points slightly toward TB, but has no QB replacement term; 75% spread money favors PIT.

Counter-case: TB protection and an operator-recorded replacement QB can fail against PIT; a three-point PIT win beats +2.5.

Price sensitivity: Conditional fair American price about -105 at the identical line; probability excludes pushes (ML excludes ties). Require better than fair to allow a margin for uncertainty. Change condition: If QB news changes, reassess the direction; TB +3 improves protection, +2 or -110 at +2.5 weakens the selection.

Scenario and last look: Assume Daniels starts as reported; no probability assigned to the QB scenario. Captured offer only; not verified live. Conditional on the stated judgment adjustment and fixed earlier board anchor; not an independently validated forecast. Confirm active participants and expected roles. Recheck the same line, odds, market and book. Assume Daniels starts as reported; no probability assigned to the QB scenario. If QB news changes, reassess the direction; TB +3 improves protection, +2 or -110 at +2.5 weakens the selection. Alternative: If the reported Daniels start changes, substitute NYJ +7 at the shown captured price; avoid treating a QB change as a free upgrade.

### 7. Matthew Stafford passing yards Under 286.5 -109 — C
Only C: no player probability model; improved publish-time price does not establish value. Solak article 8208 U283.5 -113; BKR offers three more yards and cheaper juice. Large favorite can lean on its run game, but that is qualitative. [Source: data/research-intel/source-evidence/2026-10-17-bookmaker-week6-sgp-parsed.json, /rows/2735, 2026-10-17T19:42:02.398Z] [Source: data/research-intel/proposed/games-w06/2026-w06-astra-ARI_at_LAR.json, adjustments, market_snapshot, ambiguities, delta_checklist, 2026-10-17T22:39Z] [Source: reports/intel/games/2026-w06-astra-ARI_at_LAR.md, Expert / podcast / article agreement; Props; Counter-case, 2026-10-17T22:39Z] [Source: data/research-intel/proposed/2026-w06-quantitative-synthesis.json, games[event=ARI @ LAR].means/features, 2026-10-17T21:11:11.361Z]

Market / analytics / expert comparison: Solak article 8208 U283.5 -113; BKR offers three more yards and cheaper juice. Large favorite can lean on its run game, but that is qualitative. Team FTN/quant does not estimate this player market; no independent prop edge assigned.

Counter-case: ARI defensive absences and a persistent pass-heavy LAR plan can generate 300 yards even in a win.

Price sensitivity: No independent fair price available: need hit rate above 52.15% at -109. Use the displayed captured price or better; this is a comparison threshold, not proven break-even value. Change condition: Under 283.5 or worse than -113 loses the lead-relative improvement; confirm Stafford and LAR/ARI inactives.

Scenario and last look: ARI OL/skill and LAR secondary inactives; BEO spread 12.5 conflicts with earlier BKR 13.5. Captured offer only; not verified live. No modeled hit rate or model-derived fair price. Confirm active participants and expected roles. Recheck the same line, odds, market and book. ARI OL/skill and LAR secondary inactives; BEO spread 12.5 conflicts with earlier BKR 13.5. ARI +14 at reasonable juice improves; confirmed extra ARI OL losses weaken it. Do not call BKR 13.5 live.

### 8. Tre Tucker receiving yards Over 38.5 -114 — C
Only C: no player probability model; improved publish-time price does not establish value. Swedelson article 8266 O38.5 -120; same line now -114. Better juice, but no fitted player distribution. [Source: data/research-intel/source-evidence/2026-10-17-bookmaker-week6-sgp-parsed.json, /rows/3297, 2026-10-17T19:42:14.049Z] [Source: data/research-intel/proposed/games-w06/2026-w06-astra-BUF_at_LV.json, adjustments, market_snapshot, ambiguities, delta_checklist, 2026-10-17T22:45:48Z] [Source: reports/intel/games/2026-w06-astra-BUF_at_LV.md, Expert / podcast / article agreement; Props; Counter-case, 2026-10-17T22:45:48Z] [Source: data/research-intel/proposed/2026-w06-quantitative-synthesis.json, games[event=BUF @ LV].means/features, 2026-10-17T21:11:11.361Z]

Market / analytics / expert comparison: Swedelson article 8266 O38.5 -120; same line now -114. Better juice, but no fitted player distribution. Team FTN/quant does not estimate this player market; no independent prop edge assigned.

Counter-case: Volume can concentrate in Bowers and LV may sustain fewer drives than the game total suggests.

Price sensitivity: No independent fair price available: need hit rate above 53.27% at -114. Use the displayed captured price or better; this is a comparison threshold, not proven break-even value. Change condition: Full role and active status; above 38.5 or worse than -120 removes the small price improvement.

Scenario and last look: BUF receiver availability; Allen/Cousins inactives; fixed dome means no outdoor weather input. Captured offer only; not verified live. No modeled hit rate or model-derived fair price. Confirm active participants and expected roles. Recheck the same line, odds, market and book. BUF receiver availability; Allen/Cousins inactives; fixed dome means no outdoor weather input. LV below +4.5 or more than -108 weakens this thin edge; both BUF receivers returning makes the counter-case stronger.

### 9. ARI@LAR Over 51 -110 — C
Only C: cross-time line discrepancy and weak independent confirmation can explain the apparent advantage. Use the report zero total adjustment and hold its 52-point baseline fixed. BEO Over 51 is one point lower; this creates only a conditional cross-capture price comparison. [Source: data/research-intel/source-evidence/2026-10-17-betonline-week6-props-parsed.json, /rows/492, 2026-10-17T21:16:04.402Z] [Source: data/research-intel/proposed/games-w06/2026-w06-astra-ARI_at_LAR.json, adjustments, market_snapshot, ambiguities, delta_checklist, 2026-10-17T22:39Z] [Source: reports/intel/games/2026-w06-astra-ARI_at_LAR.md, Expert / podcast / article agreement; Props; Counter-case, 2026-10-17T22:39Z] [Source: data/research-intel/proposed/2026-w06-quantitative-synthesis.json, games[event=ARI @ LAR].means/features, 2026-10-17T21:11:11.361Z]

Market / analytics / expert comparison: Quant total 51.93 is close to the original BKR 52; BEO 51 is lower. Public over support is context only; no independent edge is inferred from the crowd.

Counter-case: ARI may fail to contribute and LAR can slow down after taking a lead; the later 51 may reflect information missing from the earlier 52 baseline.

Price sensitivity: Conditional fair American price about -113 at the identical line; probability excludes pushes (ML excludes ties). Require better than fair to allow a margin for uncertainty. Change condition: At 52 the central edge disappears. Confirm why the later board fell before treating Over 51 as value.

Scenario and last look: ARI OL/skill and LAR secondary inactives; BEO spread 12.5 conflicts with earlier BKR 13.5. Captured offer only; not verified live. Conditional on the stated judgment adjustment and fixed earlier board anchor; not an independently validated forecast. Confirm active participants and expected roles. Recheck the same line, odds, market and book. ARI OL/skill and LAR secondary inactives; BEO spread 12.5 conflicts with earlier BKR 13.5. ARI +14 at reasonable juice improves; confirmed extra ARI OL losses weaken it. Do not call BKR 13.5 live.

### 10. CLE +3 -105 — C
Only C: the central edge is below 0.3 percentage points and news can overwhelm it. Keep +0.5 CLE and -0.5 total, close to the quantitative +0.54/-0.55; season BAL numbers reflect Lamar-era play. [Source: data/research-intel/source-evidence/2026-10-17-betonline-week6-props-parsed.json, /rows/289, 2026-10-17T21:15:40.066Z] [Source: data/research-intel/proposed/games-w06/2026-w06-astra-BAL_at_CLE.json, adjustments, market_snapshot, ambiguities, delta_checklist, 2026-10-17T22:41:54Z] [Source: reports/intel/games/2026-w06-astra-BAL_at_CLE.md, Expert / podcast / article agreement; Props; Counter-case, 2026-10-17T22:41:54Z] [Source: data/research-intel/proposed/2026-w06-quantitative-synthesis.json, games[event=BAL @ CLE].means/features, 2026-10-17T21:11:11.361Z]

Market / analytics / expert comparison: CLE analyst cluster mostly took +4.5 to +5.5; the +3 BEO price is only narrowly supported by the shrunken quant. Lamar-conditional BAL endorsements receive zero weight.

Counter-case: BAL supporting cast and Huntley mobility may be enough against a weak CLE offense.

Price sensitivity: Conditional fair American price about -106 at the identical line; probability excludes pushes (ML excludes ties). Require better than fair to allow a margin for uncertainty. Change condition: Lamar returning changes the premise; +2.5 loses key-number protection; +3 needs -105 or better for this tiny central edge.

Scenario and last look: Huntley assumed starter; inactives and CLE skill/defensive status pending. Captured offer only; not verified live. Conditional on the stated judgment adjustment and fixed earlier board anchor; not an independently validated forecast. Confirm active participants and expected roles. Recheck the same line, odds, market and book. Huntley assumed starter; inactives and CLE skill/defensive status pending. Lamar returning changes the premise; +2.5 loses key-number protection; +3 needs -105 or better for this tiny central edge.

### 11. KC -7.5 -108 — C
Only C: central simulator probability is below the captured price break-even. Keep +0.5 KC/-0.5 total; shrink raw quant +1.76 because OL injuries were already in the market. [Source: data/odds/BKR_current_lines_1017_1240_buildfmt, row LAC@KC, 2026-10-17T19:40:00Z] [Source: data/research-intel/proposed/games-w06/2026-w06-astra-LAC_at_KC.json, adjustments, market_snapshot, ambiguities, delta_checklist, 2026-10-17T22:43:34Z] [Source: reports/intel/games/2026-w06-astra-LAC_at_KC.md, Expert / podcast / article agreement; Props; Counter-case, 2026-10-17T22:43:34Z] [Source: data/research-intel/proposed/2026-w06-quantitative-synthesis.json, games[event=LAC @ KC].means/features, 2026-10-17T21:11:11.361Z]

Market / analytics / expert comparison: Quant projects KC by 9.26; KC support is largely straight-up/teaser, not ATS confirmation. Anderson/Erickson/Makinen unders were 42.5+, above current 41-41.5.

Counter-case: LAC can keep a divisional game close; KC scoring or a short field can defeat a low total.

Price sensitivity: Conditional fair American price about -106 at the identical line; probability excludes pushes (ML excludes ties). Require better than fair to allow a margin for uncertainty. Change condition: KC -6.5 is materially better; new LAC OL loss supports KC. Under needs 42.5 or materially cheaper juice.

Scenario and last look: LAC OL and KC skill inactives; outdoor forecast moderate, refresh gusts. Captured offer only; not verified live. Conditional on the stated judgment adjustment and fixed earlier board anchor; not an independently validated forecast. Confirm active participants and expected roles. Recheck the same line, odds, market and book. LAC OL and KC skill inactives; outdoor forecast moderate, refresh gusts. KC -6.5 is materially better; new LAC OL loss supports KC. Under needs 42.5 or materially cheaper juice.

### 12. GB -1 -110 — C
Only C: central simulator probability is below the captured price break-even. Use zero opinion adjustment and compare BEO GB -1 to fixed BKR -1.5 distribution. This is a relative line improvement, but its 51.25% remains below -110 break-even. [Source: data/research-intel/source-evidence/2026-10-17-betonline-week6-props-parsed.json, /rows/799, 2026-10-17T21:16:19.175Z] [Source: data/research-intel/proposed/games-w06/2026-w06-astra-DAL_at_GB.json, adjustments, market_snapshot, ambiguities, delta_checklist, 2026-10-17T22:40:03Z] [Source: reports/intel/games/2026-w06-astra-DAL_at_GB.md, Expert / podcast / article agreement; Props; Counter-case, 2026-10-17T22:40:03Z] [Source: data/research-intel/proposed/2026-w06-quantitative-synthesis.json, games[event=DAL @ GB].means/features, 2026-10-17T21:11:11.361Z]

Market / analytics / expert comparison: Makinen/Gibbs/Bogman favor GB, while Maldonado/Erickson favor DAL. The quant gap is essentially zero. BEO -1 is a better GB number than BKR -1.5 but costs more juice.

Counter-case: DAL offensive tempo and GB defensive-line absences can produce an outright road win.

Price sensitivity: Conditional fair American price about -105 at the identical line; probability excludes pushes (ML excludes ties). Require better than fair to allow a margin for uncertainty. Change condition: GB -1 at about -105 or better reaches central break-even; -1.5 at -110 worsens it. New GB defensive losses favor DAL.

Scenario and last look: GB DL absences, DAL defensive availability; Love/Prescott and Lambeau weather refresh. Captured offer only; not verified live. Conditional on the stated judgment adjustment and fixed earlier board anchor; not an independently validated forecast. Confirm active participants and expected roles. Recheck the same line, odds, market and book. GB DL absences, DAL defensive availability; Love/Prescott and Lambeau weather refresh. DAL +2.5/+3 improves; BEO +1 is worse than BKR +1.5. Love passing lead 272.5 is now 280.5, so do not recycle the old number.

## Parlays — exactly 3


### 1. Safest of these three; 2-leg favorites
KC ML -393 (BKR) + IND ML -296 (BKR). Combined -147 / decimal 1.6783 **price-est.**; break-even 59.59% if all legs settle as wins/losses. price-est.; product of captured decimal prices, without boost or same-game adjustment; no executable combined quote.

Separate games; two favored teams reduce the number of uncertain player-volume assumptions. KC/IND moneyline prices are expensive, so this remains C. Weakest leg: IND: the report slightly shades TEN relative to its spread, and IND -296 already requires 74.75% to win. High hit-rate construction is not proof of value. Swap-out: SF ML -380 (BEO). No calibrated joint probability. Products of marginal probabilities would be rough independence illustrations only; pushes/voids require actual book settlement rules. Grade C / 1 confidence unit.

[Source: data/odds/BKR_current_lines_1017_1240_buildfmt, row LAC@KC, 2026-10-17T19:40:00Z] [Source: data/odds/BKR_current_lines_1017_1240_buildfmt, row TEN@IND, 2026-10-17T19:40:00Z] Swap [Source: data/research-intel/source-evidence/2026-10-17-betonline-week6-props-parsed.json, /rows/976, 2026-10-17T21:16:24.641Z]

### 2. Value comparison; 3 legs
LV +4.5 -108 (BKR) + NYJ +7 -103 (BKR) + HOU@JAX Under 42.5 -110 (BEO). Combined +625 / decimal 7.2464 **price-est.**; break-even 13.8% if all legs settle as wins/losses. price-est.; product of captured decimal prices, without boost or same-game adjustment; no executable combined quote.

Three separate games and distinct dog/total cases; all single-leg central advantages are under one percentage point. Price-est. combines BKR and BEO rows, so no single book is known to offer it. Weakest leg: NYJ +7: Brown workload and the lost +7.5 hook can erase the edge; a push reprices the parlay. Swap-out: TEN@IND Under 45 -110 (BEO). No calibrated joint probability. Products of marginal probabilities would be rough independence illustrations only; pushes/voids require actual book settlement rules. Grade C / 1 confidence unit.

[Source: data/odds/BKR_current_lines_1017_1240_buildfmt, row BUF@LV, 2026-10-17T19:40:00Z] [Source: data/odds/BKR_current_lines_1017_1240_buildfmt, row NYJ@NE, 2026-10-17T19:40:00Z] [Source: data/research-intel/source-evidence/2026-10-17-betonline-week6-props-parsed.json, /rows/5, 2026-10-17T21:15:26.601Z] Swap [Source: data/research-intel/source-evidence/2026-10-17-betonline-week6-props-parsed.json, /rows/361, 2026-10-17T21:15:50.077Z]

### 3. Upside player-prop parlay with Sunday-night final leg
Matthew Stafford passing yards Under 286.5 -109 (BKR) + Tre Tucker receiving yards Over 38.5 -114 (BKR) + Ryan Flournoy 4+ receptions +126 (BKR). Combined +713 / decimal 8.1346 **price-est.**; break-even 12.29% if all legs settle as wins/losses. price-est.; product of captured decimal prices, without boost or same-game adjustment; no executable combined quote.

Three different games, ending with DAL@GB. Bowers is a replacement for Tucker, not an additional same-game leg. No player/joint model supports a success estimate. Weakest leg: Flournoy 4+ receptions: role/target distribution is unmodeled and this is a late-game upside leg, not a high-confidence floor. Swap-out: Brock Bowers 8+ receptions +126 (BKR). No calibrated joint probability. Products of marginal probabilities would be rough independence illustrations only; pushes/voids require actual book settlement rules. Grade C / 1 confidence unit.

[Source: data/research-intel/source-evidence/2026-10-17-bookmaker-week6-sgp-parsed.json, /rows/2735, 2026-10-17T19:42:02.398Z] [Source: data/research-intel/source-evidence/2026-10-17-bookmaker-week6-sgp-parsed.json, /rows/3297, 2026-10-17T19:42:14.049Z] [Source: data/research-intel/source-evidence/2026-10-17-bookmaker-week6-sgp-parsed.json, /rows/4086, 2026-10-17T19:42:41.486Z] Swap [Source: data/research-intel/source-evidence/2026-10-17-bookmaker-week6-sgp-parsed.json, /rows/3269, 2026-10-17T19:42:14.049Z]

## Teasers — exactly 3

Each is a two-team, six-point comparison at -120 **price-est.**, not a captured standard offer. Break-even 54.55%; equal independent leg hurdle 73.85%. No calibrated teaser or joint probability is claimed. No 3-team teaser is justified by the weak leg margins.

### 1. KC -7.5 → -1.5 + HOU +2.5 → +8.5
Both cross 3 and 7. Illustrative single-leg diagnostics: KC 73.23%; HOU 72.81%. At least one illustrative leg misses the 73.85% equal-leg hurdle. Do not describe this construction as demonstrated positive value. Weakest diagnostic: HOU. Grade C / 1 confidence unit. Both legs cross 3 and 7 using captured BKR lines. No third leg: overlapping exposures and weak diagnostic margins do not justify it. Refresh HOU London weather / DAL outdoor weather where applicable; no current source claims an unconfirmed starting QB for these selected games. Book-specific teaser eligibility, pushes, ties and odds are unknown; no numeric joint probability asserted. [Source: data/odds/BKR_current_lines_1017_1240_buildfmt, corresponding signed spread rows, 2026-10-17T19:40:00Z]

### 2. KC -7.5 → -1.5 + DAL +1.5 → +7.5
Both cross 3 and 7. Illustrative single-leg diagnostics: KC 73.23%; DAL 72.69%. At least one illustrative leg misses the 73.85% equal-leg hurdle. Do not describe this construction as demonstrated positive value. Weakest diagnostic: DAL. Grade C / 1 confidence unit. Both legs cross 3 and 7 using captured BKR lines. No third leg: overlapping exposures and weak diagnostic margins do not justify it. Refresh HOU London weather / DAL outdoor weather where applicable; no current source claims an unconfirmed starting QB for these selected games. Book-specific teaser eligibility, pushes, ties and odds are unknown; no numeric joint probability asserted. [Source: data/odds/BKR_current_lines_1017_1240_buildfmt, corresponding signed spread rows, 2026-10-17T19:40:00Z]

### 3. HOU +2.5 → +8.5 + DAL +1.5 → +7.5
Both cross 3 and 7. Illustrative single-leg diagnostics: HOU 72.81%; DAL 72.69%. At least one illustrative leg misses the 73.85% equal-leg hurdle. Do not describe this construction as demonstrated positive value. Weakest diagnostic: DAL. Grade C / 1 confidence unit. Both legs cross 3 and 7 using captured BKR lines. No third leg: overlapping exposures and weak diagnostic margins do not justify it. Refresh HOU London weather / DAL outdoor weather where applicable; no current source claims an unconfirmed starting QB for these selected games. Book-specific teaser eligibility, pushes, ties and odds are unknown; no numeric joint probability asserted. [Source: data/odds/BKR_current_lines_1017_1240_buildfmt, corresponding signed spread rows, 2026-10-17T19:40:00Z]

## SuperContest five — locked lines only

Rank by conditional expected contest points (win + half push), with the common composite as a tie-breaker. These are price-specific contest comparisons, not executable cash offers.

| Rank | Locked selection | Current BKR same team | Line advantage | Conditional cover / push % | Expected contest points | Composite |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | CAR +1.5 | -3 | +4.5 | 64.83 / 0 | 0.6483 | 66 |
| 2 | CLE +5.5 | +3 | +2.5 | 60.32 / 0 | 0.6032 | 69 |
| 3 | ATL +3 | +1 | +2 | 57.57 / 8.17 | 0.5695 | 61 |
| 4 | NYG +1.5 | -1 | +2.5 | 54.76 / 0 | 0.5476 | 66 |
| 5 | LV +4.5 | +4.5 | 0 | 52.68 / 0 | 0.5268 | 70.41 |

Expected contest points assumes 1 for a win and 0.5 for a push; it is not a calibrated contest prediction or an eligibility check. [Source: data/supercontest/week-06-lines.json, games[], 2026-10-15T21:29:08.453Z] Fixed-distribution mechanical translations preserve the earlier BKR anchor; no new opinion adjustment was added.

1. CAR +1.5: McKee/slow PHI support under qualitatively, but quant total 39.53 and 73% over money disagree. Most CAR side endorsements predate the 4.5-point move. Flip: Barkley and other weapons active weakens under. CAR +1.5 belongs only to the locked contest, not a cash offer. [Source: data/research-intel/proposed/games-w06/2026-w06-astra-CAR_at_PHI.json, market_snapshot and adjustments, 2026-10-17T22:40:00Z]

2. CLE +5.5: CLE analyst cluster mostly took +4.5 to +5.5; the +3 BEO price is only narrowly supported by the shrunken quant. Lamar-conditional BAL endorsements receive zero weight. Flip: Lamar returning changes the premise; +2.5 loses key-number protection; +3 needs -105 or better for this tiny central edge. [Source: data/research-intel/proposed/games-w06/2026-w06-astra-BAL_at_CLE.json, market_snapshot and adjustments, 2026-10-17T22:41:54Z]

3. ATL +3: FTN pass-offense/SRS favors CHI with Williams. ATL supporters generally held +3 or +3.5, not +1. Spread money 68% ATL; disagreement keeps cash conviction low. Flip: Williams out switches cash preference to ATL/under; Penix out with Williams active switches toward CHI. Keep contest ATL +3 as the base scenario. [Source: data/research-intel/proposed/games-w06/2026-w06-astra-CHI_at_ATL.json, market_snapshot and adjustments, 2026-10-18T02:19:54Z]

4. NYG +1.5: Quant home margin 0.47 vs market 1 favors NO a little. NYG analysts mostly took +1.5; over backers took 44-44.5, while Fezzik preferred under 45.5. Flip: Both NYG tackles out weakens contest NYG; a QB change overrides the base scenario. Cash -1 is not contest +1.5. [Source: data/research-intel/proposed/games-w06/2026-w06-astra-NO_at_NYG.json, market_snapshot and adjustments, 2026-10-17T22:41:27Z]

5. LV +4.5: Millman, Stuckey and Anderson took LV +5.5; present +4.5 is worse. Quant/FTN blend favors LV relative to spread, although BUF offense is stronger and Makinen backed BUF. Flip: LV below +4.5 or more than -108 weakens this thin edge; both BUF receivers returning makes the counter-case stronger. [Source: data/research-intel/proposed/games-w06/2026-w06-astra-BUF_at_LV.json, market_snapshot and adjustments, 2026-10-17T22:45:48Z]

## Portfolio view

- KC appears in favorite parlay and two teasers; HOU and DAL each appear in two teasers. Those combinations are not independent diversification.
- LV side and Tucker receiving over share LV offense exposure; the value parlay repeats LV.
- Stafford under and ARI/LAR over can both hit through rushing and ARI scoring, but their dependence is unknown. They are never paired in a same-game combination here.
- HOU under and HOU teaser are linked to a close/low-scoring game script.
- News outcomes correlate several selections and contest choices; confidence units are ordinal labels, not amounts or additive allocations.
| Game | Primary picks | Parlay legs | Teaser legs | Contest |
| --- | --- | --- | --- | --- |
| BUF@LV | 2 | 2 | 0 | 1 |
| HOU@JAX | 1 | 1 | 2 | 0 |
| LAC@KC | 1 | 1 | 2 | 0 |
| DAL@GB | 1 | 1 | 2 | 0 |
| ARI@LAR | 2 | 1 | 0 | 0 |
| TEN@IND | 1 | 1 | 0 | 0 |
| NYJ@NE | 1 | 1 | 0 | 0 |
| BAL@CLE | 1 | 0 | 0 | 1 |
| WAS@SF | 1 | 0 | 0 | 0 |
| PIT@TB | 1 | 0 | 0 | 0 |
| CAR@PHI | 0 | 0 | 0 | 1 |
| NO@NYG | 0 | 0 | 0 | 1 |
| CHI@ATL | 0 | 0 | 0 | 1 |

GB -1 primary and DAL +7.5 teaser oppose directions but have an overlapping win range (GB wins by 2 through 7); they are price-specific alternatives, not independent evidence.

Do nothing until the relevant information arrives (these are action notes, not synthesis stops):
- Treat every card item as a proposal until Andy sees the actual current price and participant status.
- Resolve Williams/Brown workload before relying on affected scenario weights; keep the filled menu visible.
- Do not copy the three teaser prices without a book quote and settlement rules.
- Do not treat stale moneyline splits or bad SF wind data as confirmation.

Sunday / Monday refresh:
- Sunday before 06:30 PT: HOU/JAX inactives, London wind/gust forecast, same BEO 42.5 total and HOU +2.5 teaser base.
- Sunday morning: Williams decision; assume active until new evidence, then rotate ATL/under scenario if out. Verify Penix and ATL roof.
- Brown active status and expected snaps; NYJ +7 price sensitivity. No Brown prop is on the card.
- Confirm McKee starting, Barkley reporter hedge, PHI receiving availability and Moton update; affects CAR contest position.
- Confirm Huntley and Daniels scenarios, CLE skill/defensive inactives, and PIT/TB pass protection.
- IND roof and skill inactives; do not apply outdoor forecasts without open-roof confirmation.
- Likely team/active status and actual NYG anytime-TD price if revisiting that lead; Cleveland rationale is not transferable. No Likely TD leg here.
- Sunday afternoon: Allen/Cousins/Tucker/Bowers, Stafford and ARI/LAR absences; confirm exact prop thresholds and prices.
- Sunday night: Love/Prescott, Flournoy role, GB defensive line and DAL defensive inactives; Lambeau weather.
- Monday: Bosa/Evans/SF OL and WAS skill availability; repair wind/gust evidence before any weather thesis; SF -7.5 price.
- For every combination: obtain one executable combined quote and actual push/void rules; source-price products are estimates only.

## Not played and why

- HOU@JAX: Other sides/totals/ML in this game scored lower or duplicated the chosen core outcome; no missing price interpreted as injury.
- NYJ@NE: Other sides/totals/ML in this game scored lower or duplicated the chosen core outcome; no missing price interpreted as injury.
- PIT@TB: Other sides/totals/ML in this game scored lower or duplicated the chosen core outcome; no missing price interpreted as injury.
- BAL@CLE: Other sides/totals/ML in this game scored lower or duplicated the chosen core outcome; no missing price interpreted as injury.
- CHI@ATL: No primary cash selection: Williams/roof uncertainty and lost ATL +3 price leave only a locked contest advantage.
- TEN@IND: Other sides/totals/ML in this game scored lower or duplicated the chosen core outcome; no missing price interpreted as injury.
- CAR@PHI: No primary cash selection: weaker composite than the twelve under the portfolio constraints.
- NO@NYG: No primary cash selection: current NYG -1 removes the old dog price, while locked NYG +1.5 remains useful in the contest.
- ARI@LAR: Other sides/totals/ML in this game scored lower or duplicated the chosen core outcome; no missing price interpreted as injury.
- BUF@LV: Other sides/totals/ML in this game scored lower or duplicated the chosen core outcome; no missing price interpreted as injury.
- LAC@KC: Other sides/totals/ML in this game scored lower or duplicated the chosen core outcome; no missing price interpreted as injury.
- DAL@GB: Other sides/totals/ML in this game scored lower or duplicated the chosen core outcome; no missing price interpreted as injury.
- WAS@SF: Other sides/totals/ML in this game scored lower or duplicated the chosen core outcome; no missing price interpreted as injury.
- cross-slate: LV/ARI/NYJ moneylines are scored but do not displace the same-game side/total; tail-based win probabilities are less robust and incur a 12-point scoring penalty.
- props: Stroud over conflicts with HOU under; Bijan over lost four yards from the analyst number; Flournoy 4+ is reserved for the upside combination. Unpriced TD leads remain source notes, not invented live quotes.

## Candidate scoring audit

All 149 captured cash/prop candidate rows considered. Duplicate book offers are retained here; selection uses the highest composite per game/market/direction before portfolio constraints. E is already multiplied by 5 and clipped; other columns are raw rubric inputs. Props have unknown edge, not zero measured edge.
| Candidate / book | Odds | Sim / BE % | Edge pp / E | Consensus | Price | News | Correlation | Model penalty | Composite |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LV +4.5 / BKR | -108 | 52.68 / 51.92 | 0.76 / 3.8 | 2 | -0.5 | 1 | 0 | 0 | 58.8 |
| LV +4.5 / BEO | -110 | 52.68 / 52.38 | 0.3 / 1.51 | 2 | -0.5 | 1 | 0 | 0 | 56.51 |
| HOU@JAX Under 42.5 / BEO | -110 | 53.03 / 52.38 | 0.65 / 3.26 | 1.5 | 0 | 1 | -0.5 | 0 | 56.26 |
| TEN@IND Under 45 / BEO | -110 | 53.13 / 52.38 | 0.75 / 3.73 | 1 | 0 | 1 | -0.5 | 0 | 53.73 |
| NYJ +7 / BKR | -103 | 51.46 / 50.74 | 0.72 / 3.61 | 2 | -0.5 | 2 | 0 | 0 | 53.61 |
| HOU@JAX Under 42 / BKR | -106 | 51.56 / 51.46 | 0.11 / 0.53 | 1.5 | 0 | 1 | -0.5 | 0 | 53.53 |
| TEN@IND Under 44.5 / BKR | -104 | 51.52 / 50.98 | 0.54 / 2.68 | 1 | 0 | 1 | -0.5 | 0 | 52.68 |
| SF -7.5 / BEO | -108 | 52.65 / 51.92 | 0.73 / 3.63 | 1.5 | 0 | 2 | 0 | 0 | 52.63 |
| TB +2.5 / BEO | -105 | 51.31 / 51.22 | 0.09 / 0.46 | 2 | 0 | 2 | 0 | 0 | 52.46 |
| LV ML / BKR | +194 | 35.84 / 34.01 | 1.83 / 9.13 | 2 | -0.5 | 1 | 0 | 12 | 52.13 |
| NYJ +7 / BEO | -105 | 51.46 / 51.22 | 0.24 / 1.21 | 2 | -0.5 | 2 | 0 | 0 | 51.21 |
| Tre Tucker receiving yards Over 38.5 / BKR | -114 | unknown / 53.27 | unknown / 0 | 1 | 1 | 1 | 0 | 4 | 51 |
| Matthew Stafford passing yards Under 286.5 / BKR | -109 | unknown / 52.15 | unknown / 0 | 1 | 1 | 1 | 0 | 4 | 51 |
| LV ML / BEO | +192 | 35.84 / 34.25 | 1.59 / 7.96 | 2 | -0.5 | 1 | 0 | 12 | 50.96 |
| TB +2.5 / BKR | -109 | 51.31 / 52.15 | -0.84 / -4.21 | 2 | 0 | 2 | 0 | 0 | 47.79 |
| ARI@LAR Over 51 / BEO | -110 | 53.13 / 52.38 | 0.75 / 3.74 | 0 | 0 | 1 | -0.5 | 0 | 47.74 |
| ARI ML / BKR | +613 | 15.29 / 14.03 | 1.27 / 6.33 | 1 | 0.5 | 1 | 0 | 12 | 47.33 |
| NYJ ML / BKR | +284 | 27.77 / 26.04 | 1.73 / 8.66 | 2 | -0.5 | 2 | 0 | 12 | 46.66 |
| SF -8 / BKR | -108 | 51.45 / 51.92 | -0.48 / -2.38 | 1.5 | 0 | 2 | 0 | 0 | 46.62 |
| CLE +3 / BEO | -105 | 51.43 / 51.22 | 0.21 / 1.05 | 1.5 | -1 | 2 | 0 | 0 | 46.05 |
| C.J. Stroud passing yards Over 255.5 / BKR | +109 | unknown / 47.85 | unknown / 0 | 1 | 1 | 2 | 0 | 4 | 46 |
| NYJ ML / BEO | +280 | 27.77 / 26.32 | 1.46 / 7.29 | 2 | -0.5 | 2 | 0 | 12 | 45.29 |
| CLE +3 / BKR | -106 | 51.43 / 51.46 | -0.03 / -0.13 | 1.5 | -1 | 2 | 0 | 0 | 44.87 |
| ARI ML / BEO | +586 | 15.29 / 14.58 | 0.71 / 3.57 | 1 | 0.5 | 1 | 0 | 12 | 44.57 |
| HOU +2.5 / BKR | -105 | 50 / 51.22 | -1.22 / -6.1 | 1 | -0.5 | 1 | 0 | 0 | 42.9 |
| HOU +2.5 / BEO | -105 | 50 / 51.22 | -1.22 / -6.1 | 1 | -0.5 | 1 | 0 | 0 | 42.9 |
| WAS@SF Under 52 / BEO | -110 | 52.5 / 52.38 | 0.12 / 0.61 | 0.5 | 0 | 2 | -0.5 | 0 | 42.61 |
| KC -7.5 / BKR | -108 | 51.4 / 51.92 | -0.52 / -2.6 | 0 | 0 | 1 | 0 | 0 | 42.4 |
| KC -7.5 / BEO | -108 | 51.4 / 51.92 | -0.52 / -2.6 | 0 | 0 | 1 | 0 | 0 | 42.4 |
| GB -1 / BEO | -110 | 51.25 / 52.38 | -1.13 / -5.66 | 0.5 | 0 | 1 | 0 | 0 | 42.34 |
| GB -1.5 / BKR | -105 | 50 / 51.22 | -1.22 / -6.1 | 0.5 | 0 | 1 | 0 | 0 | 41.9 |
| CLE ML / BEO | +155 | 40.93 / 39.22 | 1.72 / 8.6 | 1.5 | -1 | 2 | 0 | 12 | 41.6 |
| TB ML / BKR | +123 | 45.11 / 44.84 | 0.27 / 1.36 | 2 | 0 | 2 | 0 | 12 | 41.36 |
| LAC@KC Under 41.5 / BKR | -113 | 51.52 / 53.05 | -1.54 / -7.68 | 1.5 | -1 | 1 | -0.5 | 0 | 41.32 |
| ARI +13.5 / BKR | -117 | 51.48 / 53.92 | -2.43 / -12.17 | 1 | 0.5 | 1 | 0 | 0 | 40.83 |
| CLE ML / BKR | +154 | 40.93 / 39.37 | 1.56 / 7.82 | 1.5 | -1 | 2 | 0 | 12 | 40.82 |
| WAS@SF Under 51.5 / BKR | -105 | 50.91 / 51.22 | -0.31 / -1.54 | 0.5 | 0 | 2 | -0.5 | 0 | 40.46 |
| TB ML / BEO | +122 | 45.11 / 45.05 | 0.07 / 0.35 | 2 | 0 | 2 | 0 | 12 | 40.35 |
| ARI@LAR Over 52 / BKR | -103 | 50 / 50.74 | -0.74 / -3.69 | 0 | 0 | 1 | -0.5 | 0 | 40.31 |
| Ryan Flournoy receptions Over 3.5 / BKR | +118 | unknown / 45.87 | unknown / 0 | 0.5 | -1 | 1 | 0 | 4 | 40 |
| DAL@GB Under 53.5 / BEO | -110 | 51.52 / 52.38 | -0.86 / -4.31 | 0 | 0 | 1 | -0.5 | 0 | 39.69 |
| GB ML / BKR | -113 | 53.74 / 53.05 | 0.69 / 3.43 | 0.5 | 0 | 1 | 0 | 12 | 39.43 |
| TEN +7 / BKR | -115 | 51.17 / 53.49 | -2.32 / -11.59 | 1 | 0 | 1 | 0 | 0 | 39.41 |
| TEN +7 / BEO | -115 | 51.17 / 53.49 | -2.32 / -11.59 | 1 | 0 | 1 | 0 | 0 | 39.41 |
| DAL@GB Over 53 / BKR | -108 | 50 / 51.92 | -1.92 / -9.62 | 1 | -0.5 | 1 | -0.5 | 0 | 38.38 |
| CAR@PHI Under 39 / BKR | -108 | 53.11 / 51.92 | 1.19 / 5.96 | -0.5 | -1 | 2 | -0.5 | 0 | 37.96 |
| IND -7 / BKR | -101 | 48.83 / 50.25 | -1.42 / -7.09 | 0 | 0 | 1 | 0 | 0 | 37.91 |
| TEN ML / BEO | +260 | 27.54 / 27.78 | -0.23 / -1.17 | 1 | 0 | 1 | 0 | 12 | 37.83 |
| LAR -13.5 / BKR | +101 | 48.52 / 49.75 | -1.23 / -6.17 | 0.5 | -1 | 1 | 0 | 0 | 37.83 |
| LAR -12.5 / BEO | -110 | 51.1 / 52.38 | -1.28 / -6.39 | 0.5 | -1 | 1 | 0 | 0 | 37.61 |
| GB ML / BEO | -115 | 53.74 / 53.49 | 0.25 / 1.25 | 0.5 | 0 | 1 | 0 | 12 | 37.25 |
| LAC@KC Under 41 / BEO | -110 | 49.99 / 52.38 | -2.39 / -11.93 | 1.5 | -1 | 1 | -0.5 | 0 | 37.07 |
| CAR@PHI Under 39 / BEO | -110 | 53.11 / 52.38 | 0.73 / 3.67 | -0.5 | -1 | 2 | -0.5 | 0 | 35.67 |
| ARI +12.5 / BEO | -110 | 48.9 / 52.38 | -3.48 / -17.42 | 1 | 0.5 | 1 | 0 | 0 | 35.58 |
| BUF@LV Under 53.5 / BKR | -107 | 50 / 51.69 | -1.69 / -8.45 | 0 | 0 | 1 | -0.5 | 0 | 35.55 |
| PIT@TB Over 39 / BKR | -103 | 50 / 50.74 | -0.74 / -3.69 | 0 | 0 | 2 | -0.5 | 0 | 35.31 |
| CHI@ATL Over 52.5 / BKR | -108 | 51.52 / 51.92 | -0.4 / -2.02 | 0.5 | 0 | 3 | -0.5 | 0 | 34.98 |
| NYG ML / BKR | -101 | 51.15 / 50.25 | 0.9 / 4.5 | 1 | -1 | 2 | 0 | 12 | 34.5 |
| BAL@CLE Under 40.5 / BKR | -112 | 51.51 / 52.83 | -1.32 / -6.58 | 1 | -1 | 2 | -0.5 | 0 | 34.42 |
| DAL@GB Under 53 / BKR | -108 | 50 / 51.92 | -1.92 / -9.62 | 0 | 0 | 1 | -0.5 | 0 | 34.38 |
| TEN ML / BKR | +251 | 27.54 / 28.49 | -0.95 / -4.73 | 1 | 0 | 1 | 0 | 12 | 34.27 |
| BUF@LV Over 53.5 / BKR | -109 | 50 / 52.15 | -2.15 / -10.77 | 0.5 | -0.5 | 1 | -0.5 | 0 | 34.23 |
| NYG -1 / BKR | -101 | 48.66 / 50.25 | -1.59 / -7.96 | 1 | -1 | 2 | 0 | 0 | 34.04 |
| NYJ@NE Under 43.5 / BKR | -108 | 50.91 / 51.92 | -1.01 / -5.06 | 0 | 0 | 2 | -0.5 | 0 | 33.94 |
| BUF@LV Over 53.5 / BEO | -110 | 50 / 52.38 | -2.38 / -11.9 | 0.5 | -0.5 | 1 | -0.5 | 0 | 33.1 |
| IND -7 / BEO | -105 | 48.83 / 51.22 | -2.39 / -11.94 | 0 | 0 | 1 | 0 | 0 | 33.06 |
| Bijan Robinson rushing yards Over 93.5 / BKR | -108 | unknown / 51.92 | unknown / 0 | 1 | -1 | 3 | 0 | 4 | 33 |
| JAX -2.5 / BKR | -111 | 50 / 52.61 | -2.61 / -13.03 | 0.5 | -0.5 | 1 | 0 | 0 | 32.97 |
| CAR -3 / BKR | -114 | 51.43 / 53.27 | -1.84 / -9.19 | 1 | -1 | 2 | 0 | 0 | 32.81 |
| BUF@LV Under 53.5 / BEO | -110 | 50 / 52.38 | -2.38 / -11.9 | 0 | 0 | 1 | -0.5 | 0 | 32.1 |
| CAR -3 / BEO | -115 | 51.43 / 53.49 | -2.06 / -10.28 | 1 | -1 | 2 | 0 | 0 | 31.72 |
| HOU ML / BKR | +123 | 43.78 / 44.84 | -1.06 / -5.31 | 1 | -0.5 | 1 | 0 | 12 | 31.69 |
| NO@NYG Over 46 / BKR | -112 | 51.56 / 52.83 | -1.27 / -6.33 | 0.5 | -1 | 2 | -0.5 | 0 | 31.67 |
| LAC ML / BKR | +326 | 23.37 / 23.47 | -0.11 / -0.54 | 0.5 | -1 | 1 | 0 | 12 | 31.46 |
| DAL +1.5 / BKR | -111 | 50 / 52.61 | -2.61 / -13.03 | 0.5 | -1 | 1 | 0 | 0 | 30.97 |
| HOU ML / BEO | +122 | 43.78 / 45.05 | -1.26 / -6.32 | 1 | -0.5 | 1 | 0 | 12 | 30.68 |
| NYJ@NE Over 43 / BEO | -110 | 50.63 / 52.38 | -1.75 / -8.76 | 0 | 0 | 2 | -0.5 | 0 | 30.24 |
| LAC@KC Over 41.5 / BKR | -103 | 48.48 / 50.74 | -2.25 / -11.27 | -0.5 | 0 | 1 | -0.5 | 0 | 29.73 |
| NO +1 / BKR | -115 | 51.34 / 53.49 | -2.14 / -10.72 | 0 | 0 | 2 | 0 | 0 | 29.28 |
| ATL +1 / BKR | -103 | 49.19 / 50.74 | -1.55 / -7.73 | 1 | -1 | 3 | 0 | 0 | 29.27 |
| PIT@TB Under 39.5 / BEO | -115 | 51.52 / 53.49 | -1.97 / -9.84 | 0 | 0 | 2 | -0.5 | 0 | 29.16 |
| LAC@KC Over 41 / BEO | -110 | 50.01 / 52.38 | -2.38 / -11.88 | -0.5 | 0 | 1 | -0.5 | 0 | 29.12 |
| BAL@CLE Under 40 / BEO | -110 | 49.99 / 52.38 | -2.39 / -11.94 | 1 | -1 | 2 | -0.5 | 0 | 29.06 |
| SF ML / BEO | -380 | 77.56 / 79.17 | -1.6 / -8.02 | 1.5 | 0 | 2 | 0 | 12 | 28.98 |
| ARI@LAR Under 52 / BKR | -113 | 50 / 53.05 | -3.05 / -15.26 | 0 | 0 | 1 | -0.5 | 0 | 28.74 |
| JAX -2.5 / BEO | -115 | 50 / 53.49 | -3.49 / -17.44 | 0.5 | -0.5 | 1 | 0 | 0 | 28.56 |
| DAL@GB Over 53.5 / BEO | -110 | 48.48 / 52.38 | -3.9 / -19.5 | 1 | -0.5 | 1 | -0.5 | 0 | 28.5 |
| LAC ML / BEO | +313 | 23.37 / 24.21 | -0.85 / -4.24 | 0.5 | -1 | 1 | 0 | 12 | 27.76 |
| LAC +7.5 / BKR | -108 | 48.6 / 51.92 | -3.33 / -16.63 | 0.5 | -1 | 1 | 0 | 0 | 27.37 |
| SF ML / BKR | -390 | 77.56 / 79.59 | -2.03 / -10.14 | 1.5 | 0 | 2 | 0 | 12 | 26.86 |
| NO@NYG Under 46 / BKR | -104 | 48.44 / 50.98 | -2.54 / -12.72 | 0 | 0 | 2 | -0.5 | 0 | 26.28 |
| JAX ML / BKR | -137 | 56.22 / 57.81 | -1.59 / -7.94 | 0.5 | -0.5 | 1 | 0 | 12 | 26.06 |
| DAL +1 / BEO | -110 | 48.75 / 52.38 | -3.63 / -18.14 | 0.5 | -1 | 1 | 0 | 0 | 25.86 |
| PIT@TB Over 39.5 / BEO | -105 | 48.48 / 51.22 | -2.74 / -13.7 | 0 | 0 | 2 | -0.5 | 0 | 25.3 |
| NYJ@NE Over 43.5 / BKR | -108 | 49.09 / 51.92 | -2.83 / -14.17 | 0 | 0 | 2 | -0.5 | 0 | 24.83 |
| PHI +3 / BKR | -102 | 48.57 / 50.5 | -1.93 / -9.64 | -1 | 0 | 2 | 0 | 0 | 24.36 |
| BAL@CLE Over 40 / BEO | -110 | 50.01 / 52.38 | -2.37 / -11.87 | -0.5 | 0 | 2 | -0.5 | 0 | 24.13 |
| ARI@LAR Under 51 / BEO | -110 | 46.87 / 52.38 | -5.51 / -20 | 0 | 0 | 1 | -0.5 | 0 | 24 |
| LAC +7.5 / BEO | -112 | 48.6 / 52.83 | -4.23 / -20 | 0.5 | -1 | 1 | 0 | 0 | 24 |
| NYJ@NE Under 43 / BEO | -110 | 49.37 / 52.38 | -3.01 / -15.05 | 0 | 0 | 2 | -0.5 | 0 | 23.95 |
| CHI -1 / BKR | -113 | 50.81 / 53.05 | -2.24 / -11.22 | 0 | 0 | 3 | 0 | 0 | 23.78 |
| PIT@TB Under 39 / BKR | -113 | 50 / 53.05 | -3.05 / -15.26 | 0 | 0 | 2 | -0.5 | 0 | 23.74 |
| BAL@CLE Over 40.5 / BKR | -104 | 48.49 / 50.98 | -2.49 / -12.47 | -0.5 | 0 | 2 | -0.5 | 0 | 23.53 |
| CAR@PHI Over 39 / BKR | -108 | 46.89 / 51.92 | -5.04 / -20 | 0.5 | 0 | 2 | -0.5 | 0 | 22 |
| CAR@PHI Over 39 / BEO | -110 | 46.89 / 52.38 | -5.5 / -20 | 0.5 | 0 | 2 | -0.5 | 0 | 22 |
| BUF -4.5 / BKR | -108 | 47.32 / 51.92 | -4.61 / -20 | -0.5 | 0 | 1 | 0 | 0 | 22 |
| BUF -4.5 / BEO | -110 | 47.32 / 52.38 | -5.06 / -20 | -0.5 | 0 | 1 | 0 | 0 | 22 |
| JAX ML / BEO | -142 | 56.22 / 58.68 | -2.46 / -12.3 | 0.5 | -0.5 | 1 | 0 | 12 | 21.7 |
| IND ML / BKR | -296 | 72.46 / 74.75 | -2.29 / -11.46 | 0 | 0 | 1 | 0 | 12 | 21.54 |
| CAR ML / BKR | -173 | 61.67 / 63.37 | -1.7 / -8.49 | 1 | -1 | 2 | 0 | 12 | 21.51 |
| WAS@SF Over 51.5 / BKR | -111 | 49.09 / 52.61 | -3.52 / -17.59 | 0 | 0 | 2 | -0.5 | 0 | 21.41 |
| TEN@IND Over 44.5 / BKR | -112 | 48.48 / 52.83 | -4.35 / -20 | -0.5 | 0 | 1 | -0.5 | 0 | 21 |
| TEN@IND Over 45 / BEO | -110 | 46.87 / 52.38 | -5.51 / -20 | -0.5 | 0 | 1 | -0.5 | 0 | 21 |
| PHI +3 / BEO | -105 | 48.57 / 51.22 | -2.65 / -13.26 | -1 | 0 | 2 | 0 | 0 | 20.74 |
| CAR ML / BEO | -175 | 61.67 / 63.64 | -1.96 / -9.82 | 1 | -1 | 2 | 0 | 12 | 20.18 |
| HOU@JAX Over 42 / BKR | -110 | 48.44 / 52.38 | -3.94 / -19.72 | -0.5 | -0.5 | 1 | -0.5 | 0 | 19.28 |
| PHI ML / BKR | +157 | 38.33 / 38.91 | -0.58 / -2.91 | -1 | 0 | 2 | 0 | 12 | 19.09 |
| HOU@JAX Over 42.5 / BEO | -110 | 46.97 / 52.38 | -5.41 / -20 | -0.5 | -0.5 | 1 | -0.5 | 0 | 19 |
| WAS@SF Over 52 / BEO | -110 | 47.5 / 52.38 | -4.88 / -20 | 0 | 0 | 2 | -0.5 | 0 | 19 |
| PIT -2.5 / BKR | -107 | 48.69 / 51.69 | -3 / -15.01 | -1 | 0 | 2 | 0 | 0 | 18.99 |
| CHI ML / BKR | -119 | 53.3 / 54.34 | -1.04 / -5.2 | 0 | 0 | 3 | 0 | 12 | 17.8 |
| KC ML / BKR | -393 | 76.63 / 79.72 | -3.08 / -15.41 | 0 | 0 | 1 | 0 | 12 | 17.59 |
| KC ML / BEO | -395 | 76.63 / 79.8 | -3.16 / -15.82 | 0 | 0 | 1 | 0 | 12 | 17.18 |
| WAS +8 / BKR | -108 | 48.55 / 51.92 | -3.37 / -16.85 | -1 | 0 | 2 | 0 | 0 | 17.15 |
| CHI@ATL Under 52.5 / BKR | -108 | 48.48 / 51.92 | -3.44 / -17.21 | 0 | 0 | 3 | -0.5 | 0 | 16.79 |
| WAS ML / BKR | +324 | 22.44 / 23.58 | -1.15 / -5.74 | -1 | 0 | 2 | 0 | 12 | 16.26 |
| PHI ML / BEO | +153 | 38.33 / 39.53 | -1.2 / -5.99 | -1 | 0 | 2 | 0 | 12 | 16.01 |
| BAL -3 / BKR | -110 | 48.57 / 52.38 | -3.81 / -19.06 | -1 | 0 | 2 | 0 | 0 | 14.94 |
| LAR ML / BKR | -746 | 84.71 / 88.18 | -3.47 / -17.36 | 0.5 | -1 | 1 | 0 | 12 | 14.64 |
| ATL ML / BKR | +105 | 46.7 / 48.78 | -2.08 / -10.39 | 1 | -1 | 3 | 0 | 12 | 14.61 |
| IND ML / BEO | -320 | 72.46 / 76.19 | -3.74 / -18.68 | 0 | 0 | 1 | 0 | 12 | 14.32 |
| NE -7 / BKR | -113 | 48.54 / 53.05 | -4.51 / -20 | -1 | 0 | 2 | 0 | 0 | 14 |
| NE -7 / BEO | -115 | 48.54 / 53.49 | -4.95 / -20 | -1 | 0 | 2 | 0 | 0 | 14 |
| PIT -2.5 / BEO | -115 | 48.69 / 53.49 | -4.8 / -20 | -1 | 0 | 2 | 0 | 0 | 14 |
| BAL -3 / BEO | -115 | 48.57 / 53.49 | -4.92 / -20 | -1 | 0 | 2 | 0 | 0 | 14 |
| WAS +7.5 / BEO | -112 | 47.35 / 52.83 | -5.48 / -20 | -1 | 0 | 2 | 0 | 0 | 14 |
| DAL ML / BKR | +100 | 46.26 / 50 | -3.74 / -18.69 | 0.5 | -1 | 1 | 0 | 12 | 13.31 |
| LAR ML / BEO | -850 | 84.71 / 89.47 | -4.77 / -20 | 0.5 | -1 | 1 | 0 | 12 | 12 |
| DAL ML / BEO | -105 | 46.26 / 51.22 | -4.96 / -20 | 0.5 | -1 | 1 | 0 | 12 | 12 |
| WAS ML / BEO | +303 | 22.44 / 24.81 | -2.38 / -11.88 | -1 | 0 | 2 | 0 | 12 | 10.12 |
| BUF ML / BKR | -217 | 64.16 / 68.45 | -4.29 / -20 | -0.5 | 0 | 1 | 0 | 12 | 10 |
| BUF ML / BEO | -230 | 64.16 / 69.7 | -5.54 / -20 | -0.5 | 0 | 1 | 0 | 12 | 10 |
| NO ML / BKR | -112 | 48.85 / 52.83 | -3.98 / -19.9 | 0 | 0 | 2 | 0 | 12 | 8.1 |
| PIT ML / BKR | -141 | 54.89 / 58.51 | -3.62 / -18.1 | -1 | 0 | 2 | 0 | 12 | 3.9 |
| PIT ML / BEO | -142 | 54.89 / 58.68 | -3.79 / -18.96 | -1 | 0 | 2 | 0 | 12 | 3.04 |
| NE ML / BKR | -338 | 72.23 / 77.17 | -4.94 / -20 | -1 | 0 | 2 | 0 | 12 | 2 |
| NE ML / BEO | -350 | 72.23 / 77.78 | -5.55 / -20 | -1 | 0 | 2 | 0 | 12 | 2 |
| BAL ML / BKR | -171 | 59.07 / 63.1 | -4.03 / -20 | -1 | 0 | 2 | 0 | 12 | 2 |
| BAL ML / BEO | -177 | 59.07 / 63.9 | -4.83 / -20 | -1 | 0 | 2 | 0 | 12 | 2 |


All 26 locked contest-side comparisons:
| Selection | Cover / push % | Edge vs 50 pp | Consensus | News | Composite |
| --- | --- | --- | --- | --- | --- |
| LV +4.5 | 52.68 / 0 | 2.68 | 2 | 1 | 70.41 |
| CLE +5.5 | 60.32 / 0 | 10.32 | 1.5 | 2 | 69 |
| CAR +1.5 | 64.83 / 0 | 14.83 | 1 | 2 | 66 |
| NYG +1.5 | 54.76 / 0 | 4.76 | 1 | 2 | 66 |
| SF -7.5 | 52.65 / 0 | 2.65 | 1.5 | 2 | 62.25 |
| ATL +3 | 57.57 / 8.17 | 7.57 | 1 | 3 | 61 |
| NYJ +7 | 51.46 / 5.57 | 1.46 | 2 | 2 | 59.31 |
| TB +2.5 | 51.31 / 0 | 1.31 | 2 | 2 | 58.55 |
| TEN +7 | 51.17 / 5.56 | 1.17 | 1 | 1 | 56.85 |
| LAR -12.5 | 51.1 / 0 | 1.1 | 0.5 | 1 | 53.52 |
| KC -7.5 | 51.4 / 0 | 1.4 | 0 | 1 | 52.02 |
| HOU +2.5 | 50 / 0 | 0 | 1 | 1 | 51 |
| JAX -2.5 | 50 / 0 | 0 | 0.5 | 1 | 48 |
| DAL +1.5 | 50 / 0 | 0 | 0.5 | 1 | 48 |
| GB -1.5 | 50 / 0 | 0 | 0.5 | 1 | 48 |
| ARI +12.5 | 48.9 / 0 | -1.1 | 1 | 1 | 45.48 |
| LAC +7.5 | 48.6 / 0 | -1.4 | 0.5 | 1 | 40.98 |
| IND -7 | 48.83 / 5.56 | -1.17 | 0 | 1 | 39.15 |
| BUF -4.5 | 47.32 / 0 | -2.68 | -0.5 | 1 | 28.59 |
| PIT -2.5 | 48.69 / 0 | -1.31 | -1 | 2 | 27.45 |
| NE -7 | 48.54 / 5.57 | -1.46 | -1 | 2 | 26.69 |
| WAS +7.5 | 47.35 / 0 | -2.65 | -1 | 2 | 20.75 |
| NO -1.5 | 45.24 / 0 | -4.76 | 0 | 2 | 20 |
| CHI -3 | 42.43 / 8.17 | -7.57 | 0 | 3 | 15 |
| BAL -5.5 | 39.68 / 0 | -10.32 | -1 | 2 | 14 |
| PHI -1.5 | 35.17 / 0 | -14.83 | -1 | 2 | 14 |


## Ambiguity / missing data

No executable book check, fresh roster run, live scoreboard, fresh weather observation, independent prop distribution or calibrated joint model was added. All inherited issues below remain notes; stale time figures quoted in those issue strings belong to the source report and are superseded by the current header ages.

### HOU@JAX
- Official inactives not yet available; ESPN statuses ~20h old.
- Weather is forecast only (2026-10-17 1:16 PM PT); Anderson drizzly claim vs 11% / 0 mm precip.
- Moneyline splits 42.6h old, withheld; spread/total splits ~4.5h old.
- Several expert quotes unverified against raw source or missing url (Hunter, Makinen, Cohen, PFT); article 8332 internally inconsistent; 8369 and 8054 stubs/no selection; 8303 excluded.
- Collins 100+ vs JAX count conflicts (5 of 5 vs 5 of 6).
- BKR has no ATD market; Rodriguez Jr. U16.5 unavailable in BKR/BEO; Walsh Stroud SGP legs not captured.
- validate-game-output.py is Week 5 pinned and was not run; manual self-check done.
- Board and narratives files contain other games; only HOU@JAX rows used.
[Source: data/research-intel/proposed/games-w06/2026-w06-astra-HOU_at_JAX.json, ambiguities, 2026-10-17T22:42:00Z]

### NYJ@NE
- A.J. Brown: ESPN/Reiss likely activation and RotoWire activated-questionable vs dossier IR (stale 02:04Z); no Brown leg; +0.5 adjustment is judgment
- Official inactives not available (due about 8:30 AM PT 10/18): Brown, Henderson, Campbell, Cooper, Sadiq, Belton
- Kickoff-day weather refresh not done; forecast benign
- Moneyline splits stale about 42.6h at manifest; withheld
- Sharp or Square attribution: expert feed row has NE -7 while Millman/Hunter video backs Jets +7.5
- Packet narrative says Brown on IR; stale vs 10/17 items
- Quant file contest field null (script expects a different SuperContest filename); flagged, not material
- FTN used only via quant features; no independent FTN mining
- YouTube quotes taken from packet rows; caption files not opened (quote_quality verify-before-quoting)
- Article premises priced at publish (ESPN panel at NE -7.5/43.5); PFT article listed unresolved in source id list but carried as lead
- Prompt activation template still says article gate unresolved/STOP; board, queue, prompt section 3 say cleared 2026-10-17; followed board/queue
- W5 validator not run (hard-wired to Week 5); manual self-check done
- RUNLOG tail displayed other games' lines when read for append check; not used
[Source: data/research-intel/proposed/games-w06/2026-w06-astra-NYJ_at_NE.json, ambiguities, 2026-10-17T22:43:32Z]

### PIT@TB
- Official inactives pending (TB QB, Metcalf, Dowdle, Ramsey, Dean, Tucker, Morrison, Trotter); tier capped at 2-, player legs omitted
- Unknown whether market has priced Daniels: line PIT -2.5 since 10/12 opener and 10/15 contest lock through the 10/16 Mayfield Out report; no intermediate line history in packet
- Daniels background thin: only ESPN article text 'Rookie quarterback Jalon Daniels' (flagged garbled) and Anderson remark
- FTN tables show GP 4 for both teams vs ESPN 5 games; capture window 10/9-10/13
- Unsourced narrative claims not used: TB allows six receptions per game to TEs, highest PROE matchup per Sharp, Sharp Wednesday wind readings; Hribar 82% route claim is a rationale quote not a pinned stat
- Expert registry conflicts: ESPN Bowen under 39.5 row rejected in registry but included as lead with caveat; Makinen and Erickson rows carry ingest-cap or inconsistency notes
- Moneyline splits 42.6h stale and withheld; spread and total splits 11:14 AM PT will change
- Roster gate UNVERIFIED touching this game: Mar'Keise Irving, Kenneth Gainwell, Israel Mukuamu; no inference made
- scripts/intel/validate-game-output.py hardcodes the Week 5 packet dir; not run; manual self-check done (forbidden keys, disposition/tier pairing, adjustment caps, unsourced claims)
- Quantitative tables and live-market-comparison drop spread signs; direction read from the Bookmaker board file
- Mayfield and Daniels from ESPN and operator approval; official inactives decide
- Najee Harris is on NYG, not PIT; no Najee items used
[Source: data/research-intel/proposed/games-w06/2026-w06-astra-PIT_at_TB.json, ambiguities, 2026-10-17T22:45:59Z]

### BAL@CLE
- Official inactives pending (Huntley, Watson, Judkins, Graham, Schwesinger); ESPN capture 2026-10-17T02:03Z
- queue packet_pins block holds pre-requeue packet hashes (BAL@CLE 9668500b...) while activation/board/computed canonical hash is 4058d090...; board treated as governing
- Bookmaker has no player-tagged rows; moneyline splits stale (~42.6h) and withheld
- Gibbs line approximate; Erickson article body +3 vs list +5.5; Ja'Kobi Lane IR vs questionable text conflict
- Second-hand ATS trends unverified; Lamar-conditional article picks void (Makinen 8108, Undery 8245, Walder 8208)
- validate-game-output.py is Week 5-pinned; not run, manual self-check done
[Source: data/research-intel/proposed/games-w06/2026-w06-astra-BAL_at_CLE.json, ambiguities, 2026-10-17T22:41:54Z]

### CHI@ATL
- Williams status unconfirmed (ESPN Questionable, operator expected to play); P(plays) not modeled
- Roof status unknown; weather not applied
- Official inactives missing
- ATL backup QB depth in availability layer (Tagovailoa, Rush) unverified
- Kyler Gordon row status Out vs comment questionable
- HEAD differs from packet pin; not re-hashed
- Moneyline splits stale 42.6h; BEO thin; no TD rows
- Availability-layer vs BKR board disagree (CHI -3/49.5 vs CHI -1/52.5); BKR governs
- validate-game-output.py pinned to W05; manual self-check only
- Contest H2 margin-adj 4.5 includes 2.0 mechanical line-gap; directional
[Source: data/research-intel/proposed/games-w06/2026-w06-astra-CHI_at_ATL.json, ambiguities, 2026-10-18T02:19:54Z]

### TEN@IND
- Official inactives not available; QBs depth-chart only; Warren/Spears/Mallory/Pierce statuses reported-only and partly contradictory
- Roof status unconfirmed; no weather applied
- Moneyline splits 42.6 h old, withheld; spread/total splits 4.5 h old
- BetOnline has only kicker fantasy-point rows for this game; no TEN QB or TD-scorer props
- FTN team-level figures not extracted (player-level tables only)
- SRS gap (~10.4 pts) versus market/model gap (6.6) unexplained
- Expert quote_quality unverified_against_raw_source for Tuley and PFT; YouTube rationales are packet paraphrase
- agents/dev/ASTRA_W06_GAME_SESSION_PROMPT.md sha256 c2bf2b1bb36979dd7a79b4922a4aa208d4fadf8950ffb41af02ee95edc9ee782 differs from a9b86304... recorded on the launch board (file modified 8s after board build); not a packet source; proceeded and flagged
- validate-game-output.py is Week 5-pinned and was not run; manual self-check done
[Source: data/research-intel/proposed/games-w06/2026-w06-astra-TEN_at_IND.json, ambiguities, 2026-10-17T22:40:00Z]

### CAR@PHI
- Taylor Moton: availability layer (02:03Z 10/17) lists OUT (illness); ESPN 8366 (18:21Z 10/17) says activated and available. Narrative file says out. Treat as likely available; confirm via inactives.
- Barkley OUT: ESPN 8284 headline says ruled out, availability layer cites Kempski 'not spotted'; operator treats as reporter hedge, unconfirmed.
- DeVonta Smith 'appears' to return; Smith/Brown/Wicks listed Questionable in narrative; official inactives decide.
- Millman CAR +1.5 and Kezirian/Erickson(-1.5) CAR picks are pre-Hurts-OUT or unpriced; not comparable to CAR -3.
- Sharp Football CAR -3.5 and VSiN Eagles +8 rows are source_verdict reject; not used.
- Narrative file says over 81% of bets; splits file (11:14 AM PT) says 69% bets / 73% money. Splits file governs.
- Moneyline splits stale (Thursday night). FTN tables are player-level; no team aggregate used.
- Thin Bookmaker board (0 player rows) is a coverage note.
- Week 5 validator not run (pinned to W05 paths); manual self-check done.
[Source: data/research-intel/proposed/games-w06/2026-w06-astra-CAR_at_PHI.json, ambiguities, 2026-10-17T22:40:00Z]

### NO@NYG
- official inactives pending
- kickoff-day weather refresh pending
- moneyline splits stale 42.6h, withheld
- Likely +225 TD unverified/Cleveland rationale; Skattebo alias unresolved; Harris excluded; Robinson and first-drive-sack props unpriced
- Barkley OUT is an unconfirmed reporter hedge
- several podcast/article quotes unverified in packet
- availability header line (NO -1/45.5) and locked contest NO -1.5 are older than the 12:40 PM board
- validate-game-output.py pinned to Week 5; not run; manual self-check done
- roster receipt read only, roster:vet not rerun
[Source: data/research-intel/proposed/games-w06/2026-w06-astra-NO_at_NYG.json, ambiguities, 2026-10-17T22:41:27Z]

### ARI@LAR
- Official inactives not final (Love, Benson, ARI OL, McDuffie, Curl, Collins, Baker)
- ARI OL risk: dossier ol_risk none vs Kezirian 'depleted offensive line'
- Moneyline splits 42h stale, withheld
- Launch-board session-prompt hash a9b86304 differs from current file c2bf2b1b; content consistent
- Higbee ATD +260 and McBride longest reception have no verified captured row
- quant script contest warning: expects week-06-2026-verified-lines.json
- Week 5 validator not run (pinned to W05 paths); manual self-check done
[Source: data/research-intel/proposed/games-w06/2026-w06-astra-ARI_at_LAR.json, ambiguities, 2026-10-17T22:39Z]

### BUF@LV
- Queue packet_pins sha256 for BUF@LV (a6da125a...) does not match the recomputed canonical packet hash (e9701e6c...) that the activation and board pin; same mismatch for all 13 packets; activation/board value treated as governing.
- Packet article block lists unresolved_ids and source_gate blocked_in_source_not_waived while the queue condition and board say the gate was cleared 2026-10-17; article items kept as leads/context only.
- Official inactives not available; availability layer is Fri 7:03 PM PT. DJ Moore and Joshua Palmer questionable; no leg built on them.
- FantasyPros IR vs ESPN roster day-to-day conflict for BUF CBs Dorian Strong and Jordan Hancock and LV CB Chigozie Anusiem; not used.
- Short rest, overtime and 78-defensive-snap claims are podcast/expert-feed assertions, not verified against a box score.
- Several quotes are unverified_against_raw_source; Action Network 'Pick: Bills -4.5' row is rejected not_pick and ignored.
- FTN GP is 4 for both teams versus 5 in ESPN; weekly cadence accepted, treated as one week behind.
- Moneyline splits are 42.6 hours old and withheld.
- No Mayer anytime-TD row exists in BEO and BKR has no TD rows; Fezzik score-first-and-win and the +190 SGP have no row or joint model.
- Quantitative file warns SuperContest lines file not found by its script; week-06-lines.json read directly.
- Roster-vet receipt read not regenerated (PASS, source 2026-10-17T22:22Z).
- Opener to board comparison is cross-book.
- validate-game-output.py is pinned to Week 5 and was not run; manual self-check done for forbidden keys, disposition/tier pairing, adjustment caps and sourcing.
[Source: data/research-intel/proposed/games-w06/2026-w06-astra-BUF_at_LV.json, ambiguities, 2026-10-17T22:45:48Z]

### LAC@KC
- Official inactives not available; all availability is reported status (LAC OL day-to-day group, Lambert-Smith IR/questionable inconsistency, Henley, Sneed, Rice reported Out).
- Under picks priced 42.5/43 vs board 41.5; Erickson 42.5 is a prediction-market number.
- Anderson says total fell from 45.5 but packet opener is 43.5.
- KC -8.5 earlier in week cited by teaser analysts but absent from packet.
- Article 8368 paywalled stub (side not captured); 8332 suspected ingest cap.
- Several expert-feed quotes (Sharp or Square, BettingPros, PFT, Tuley) lack URLs or are unverified against raw; context only.
- Moneyline splits stale (~42.6h), withheld; spread/total splits 11:14 AM PT.
- No current TD-scorer price for Kelce or Hampton; DK Predictions reference-only.
- KC FTN flagged stale_1wk in dossier (W5 bye); weekly cadence accepted by Andy.
- W5 validator not run (pinned to W05 paths); manual self-check done.
- Opened shared board file header while locating the LAC@KC row, which printed other games' market lines; none used.
[Source: data/research-intel/proposed/games-w06/2026-w06-astra-LAC_at_KC.json, ambiguities, 2026-10-17T22:43:34Z]

### DAL@GB
- Article leads contradict each other: Action Network 8238 (Pablo Planovsky, 10/16) says Packers moneyline ('My Pick') and later 'Pick: Under' (53.5) in the same piece, carries a Seahawks-Broncos template error and prediction-market prices. Treated as zero-weight on both side and total; the expert-registry rows for the same outlet (/rows/48, /rows/51) are dispositioned not_pick/rejected_do_not_use.
- Side leads split: GB = VSiN Makinen 8108 (GB -1.5, 10/15), PFT Florio 8054 (GB 27-24), ESPN panel 8187 (GB in all three), Joe Gibbs/Sharp (lean GB), Bogman GB -1; DAL = ESPN Maldonado 8331 (Cowboys +1.5 +102), BettingPros Erickson 8332 (Cowboys moneyline) and /picks/102 (DAL +1.5), teaser legs (Stuckey, Fezzik, Tucker). 8332 Erickson ML vs Makinen GB is outright opposite; SU picks (ESPN/PFT) are context, not edge.
- Total leads: over from Kezirian, Gibbs (Wrolstad crew 4-0 to the over), Bogman (52.5 - now 53, +0.5 worse); under from Action Network 8238 (internally contradicted). Average Joe consensus 97% over 53 (VSiN Burke 8365) is public context, not edge, and a crowding flag. Splits agree: 62% tickets / 86% money over (18:14Z).
- ESPN betting insight 'Cowboys 5-0 SU/ATS as road dogs of 3 or less since 2024' is quoted from 8187 and not independently verified against a primary dataset.
- Moneyline splits (57% home tickets / 43% home money) are the stale Thursday-night pull, 42.6h at manifest; withheld.
- Official inactives not available; availability is ESPN/operator reported. GB reported out: Parsons, Hargrave, Ford, Riley (DL), St-Juste (CB), Skyy Moore (WR); Josh Jacobs on Commissioner's Exempt List (eligible Week 7 per source comment); DAL reported out: Shelton (OT), Durant (CB); DAL questionable: Overton, Porter Jr., Overshown, Speed. Roster-IR/day-to-day unconfirmed groups (DAL 10, GB 9) not enumerated.
- Weather is a forecast (Open-Meteo 10/17 1:16 PM PT), not observation; refresh on kickoff day. Wind and gusts modest; materiality flag none.
- Props: no Bookmaker anytime-TD rows exist. Watson +130/+135 ATD, Watson 2+ TD +950, Golden ATD +280 and Golden longest-reception 40+ +350 (YouTube) are unverifiable against current rows - omitted. BEO rows lack player names in the packet selection field; not used. DraftKings Predictions reference-only.
- Podcast priced figures are publish-time: Love pass yds O272.5 now 280.5 (-116) at BKR (8 yards worse); Watson rec O4.5 -114 now -130; Flournoy rec O3.5 +130 now +118 (BKR). Article Lloyd 80+ rush +550 (8336, matchup inferred) now +440 at BKR; Watson first TD +950 now +906, Golden +1100 now +995 (8136 vs BKR).
- Quantitative model warning: no week-06-2026-verified-lines.json for the contest field; flagged only, no script fix. Locked SuperContest line GB -1.5 (10/15 2:29 PM PT) matches current number.
- Leftover file: an earlier command in this session created scratch/.tmp_dalgb_rest.txt in the repo (mistaken temp dump, not an output file); rm is blocked by the mount. Andy should delete it manually. It is not a source and not staged.
- scripts/intel/validate-game-output.py not run: pinned to Week 5 paths and packet dir. Manual self-check done: no forbidden keys, disposition/tier pairing valid (conflicted -> research_only), adjustments 0 (cap respected), every claim sourced or moved here.
[Source: data/research-intel/proposed/games-w06/2026-w06-astra-DAL_at_GB.json, ambiguities, 2026-10-17T22:40:03Z]

### WAS@SF
- Official inactives pending; Croskey-Merritt Out report postdates the packet availability layer, which still lists him Questionable.
- Wind 18.6 km/h exceeds gust 15.1 km/h in all copies; unresolved; wind claims withheld; forecast ~5 days out.
- Moneyline splits 42.6h stale; spread/total splits 4.4h old and predate 12:40 PM PT board.
- No BetOnline player prop rows for this game; BKR only; no anytime-TD row for WAS players.
- Quote quality: Kezirian structured-segment only; Pisapia unverified in raw; Sharp or Square rows lack URL.
- FTN retained team_context is player-level; no team FTN number cited; nflverse analytic fields null.
- Quant model contest field null (filename mismatch); locked contest -7.5 stale vs -8.
- Michael Evans/Chigoziem Okonkwo aliases UNVERIFIED in roster receipt; no legs used.
- Week 5 validator cannot be pointed at W06 packet schema; manual self-check done.
[Source: data/research-intel/proposed/games-w06/2026-w06-astra-WAS_at_SF.json, ambiguities, 2026-10-17T22:40:00Z]

Structural review: exactly 13 board rows, 12 primary picks (2 props), 3 parlays, 3 teasers and 5 unique-game contest selections; no forbidden transaction keys; model opinion adjustments within caps. Simulator selftest passed. No ledger, official-pick, account or external database change.
