# Astra W06 - BAL @ CLE (proposed synthesis, not a wager)

- As-of: Sat 10/17 ~3:40 PM PT. Generated: 2026-10-17T22:40:02Z. HEAD: ea74728e1e1f174f047755719896b90460c2eb64 (branch claude/w5-prop-cards-2026-10-11).
- Kickoff: Sun 10/18 10:00 AM PT (2026-10-18T17:00Z), Cleveland (outdoor). Packet: /packets/3, sha256 4058d090b3e7c560e8660a27e050d61e06dadf8ebb066235879e2585ccf70afe (queue e5832e56..., session prompt c2bf2b1b...). Relaunch after the prompt-hash re-pin; earlier STOPPED stub overwritten.
- Gates: queue/packet/prompt hashes match current board; all 52 packet sources hash-clean except w06-roster-vet.json (self-rewriting receipt: read only, status PASS, roster snapshot 2026-10-17T22:22:11Z, age 0.2h at read; roster:vet not rerun per instruction). Kickoff in future; ESPN capture shows no game underway.

## Disposition

**price moved - tier skip.** Lean (informational only): CLE +3 / Under 40.5, both with no priced edge. Every podcast CLE spread pick was made at +4.5 to +5.5; the board is now BAL -3 (CLE +3 -106), so 1.5 to 2.5 points of that value, including the 4 and the half-point at 3.5, is gone. The simulator at the 12:40 PM board gives CLE +3 about 51.4% to 52.9% ex-push under my adjustments vs a 51.5% break-even at -106: no edge. Under 40.5 (-112, break-even 52.8%) models 51.5% to 53.0%: marginal at best. Honest pass preferred over a thin candidate. It becomes a tier 2- watch only on better juice (see checklist).

## Team form and schedule context

- BAL 4-1: 29.2 ppg / 23.8 papg, 6.36 ypp, +3 turnover margin, SRS +1.05 (rank 16), net ppg +5.4 [Source: packet team_dossier team:BAL season_profile_espn/power, through week 5]. These five games are Lamar-era; the offense is not the same unit with Huntley, and the model has no QB-change term.
- CLE 3-2: 18.6 ppg / 22.4 papg, 4.72 ypp, 30.6% third down, 45.5% red-zone TD, -1 turnover margin, SRS -0.87 (rank 20), net ppg -3.8 [Source: packet team_dossier team:CLE]. Weak offense; the dog case rests on price and home-divisional trends, not on team quality.
- Divisional rematch (ESPN article 8325 "Monken rematch" is not pick content).

## Availability / QB

- BAL: Lamar Jackson OUT (ESPN depth chart qb_note "Lamar Jackson Out;"); Tyler Huntley starts, operator-recorded, official inactives pending [Source: data/research-intel/source-evidence/espn-status-w06.json teams/BAL, 2026-10-17T02:03:26Z; packet availability.quarterbacks]. Out: C Cam Jurgens, DT Broderick Washington Jr., TE Matt Hibner. WR Ja'Kobi Lane is IR but his comment text says "questionable" - internal conflict, treat as not playing unconfirmed.
- CLE: Deshaun Watson per captured depth chart (not team confirmation). Out: G Teven Jenkins, DT Mike Hall Jr. Questionable: LB Schwesinger, DT Mason Graham, RB Quinshon Judkins, DE Barnett. WR Concepcion cleared protocol per ESPN story 8241 (packet candidate list; not a pick source).
- ESPN file is 10/17 02:03Z; the narrative file cites "Friday finals". Official inactives decide.
- Lamar-conditional content is VOID/stale: Makinen BAL -4.5 "if Jackson plays; pass if he doesn't" (VSiN 8108); Action Network Undery BAL ML/-3.5/Over 42.5 + Henry/Andrews legs (8245, written assuming Lamar); ESPN Walder Browns D/ST ATD +700 (8208, same premise); Sharp or Square quote "Lamar Jackson is 2-8 ATS coming off a win" is also moot.

## Weather / venue

Forecast (Open-Meteo, Sat 1:16 PM PT, forecast not observation): 57F, 0% precip, wind 15.2 km/h, gusts 22.3 km/h, direction 187 deg; packet materiality "no_material_flag_in_current_forecast" [Source: data/research-intel/review/2026-w06-weather-venue.json /rows/3]. Stuckey's Under 43 cited weather impact; the forecast does not support it (narrative note agrees). Kickoff-day refresh pending.

## FTN and quantitative

- Quant model (rebuilt on the 12:40 PM BKR board at 2026-10-17T21:11Z): means BAL 21.2 / CLE 18.7, total 39.95, home margin -2.46; CLE +3 cover 51.5% ex-push, Under 51.7%; model-vs-market adjustment +0.54 margin toward CLE, -0.55 total [Source: data/research-intel/proposed/2026-w06-quantitative-synthesis.json games[BAL @ CLE]; tables drop spread signs, direction read from BKR].
- Model features: BAL offense_z +1.49 vs CLE -0.34; CLE tempo_z -0.96. BAL offense_z is Lamar-era and likely overstated with Huntley; the market has already moved 1.5 points for it.
- FTN weekly context (2026-10-16T22:00Z) is a quantitative input only; no team-level FTN edge extracted for this report beyond what the model consumed.

## Market (captured, not live offers)

| Item | Value | Source / time |
|---|---|---|
| Opener (Action Network) | BAL -4.5 (CLE +4.5 -108), total 41, BAL -219 / CLE +180 | openers, 2026-10-12 |
| Current board (Bookmaker, 12:40 PM PT) | BAL -3 -110 / CLE +3 -106; O40.5 -104 / U40.5 -112; BAL -171 / CLE +154 | BKR_current_lines_1017_1240_buildfmt, rows 1291-1296, 2026-10-17T19:40Z |
| Movement | Spread 1.5 points toward CLE, total -0.5 | opener to board |
| SuperContest locked | BAL -5.5 | week-06-lines.json, 10/15 2:29 PM PT (reference, not executable) |

No executable live price was verified; no sportsbook was visited.

## Expert / podcast / article agreement

- Spread, CLE side (approved YouTube signals, one vote per speaker, priced at publish time): Simon Hunter +4.5 (Sharp or Square), Ross Tucker +4.5 (2 units), Joe Pisapia +4.5, Matt Perrault +4.5, Joe Gibbs ~+5 ("going to side with the Browns here at home catching the points"; line described as approximate), Andrew Erickson +5.5 (also sprinkle CLE ML). All six moved 1.5 to 2.5 points to the current +3. Two of these (Gibbs, Erickson) recorded with Lamar status unknown. Not independent of each other's market read (same public number).
- Totals: Stuckey Under 43 (Action Network Podcast), now 2.5 points above the 40.5 board; weather premise unsupported.
- Articles (analyst leads, not picks): BettingPros Erickson (8332) CLE +3 in body vs +5.5 in play list (internally inconsistent); Tuley (VSiN) Browns +5 best bet with pool context; ESPN panel (8187) BAL SU in all three, CLE 7-1 ATS as home dog, listed BAL -5.5/51.5 looks stale; PFT Florio (8054) BAL 27-24 (SU context only); Action Network (8245) BAL side - void/stale per Lamar.
- Trend claims (CLE 7-1 ATS home dog since 2025; divisional home dogs 6-2 ATS; ref cover rates) are quoted second-hand from the sources above; I did not verify them and do not use them as edge.
- Disagreement: article/ESPN SU picks favor BAL; ATS picks favor CLE. The ATS cluster is priced against a number that no longer exists.

## Splits (ages stated)

Spread (captured Sat 10/17 11:14 AM PT): BAL tickets 59% / money 54%; CLE 41% / 46%. Total (same time): Over tickets 80% / money 71%. Total moved down 0.5 despite 80% Over tickets, a weak signal consistent with professional Under money; not independently verified. Moneyline splits are the Thursday-night pull (~42.6h old, CLE ML 8% bettors / 7% money) and are withheld as stale [Source: w06-splits-all.json /games/3].

## Simulator (scripts/intel/margin-simulator.mjs; selftest passed; home = CLE +3, total 40.5)

Conditional probabilities from a market-calibrated pmf, ex-push where noted; pushes: side ~8.3%.

| Run | margin-adj (CLE+) | total-adj | CLE cover (ex-push) | Under (ex-push) | Reason |
|---|---|---|---|---|---|
| Baseline | 0 | 0 | 50.0% | 50.0% | market |
| H1 quant-aligned | +0.5 | -0.5 | 51.4% | 51.5% | model +0.54 / -0.55; BAL Lamar-era stats overstate Huntley offense |
| H2 Huntley-heavy | +1.0 | -1.0 | 52.9% | 53.0% | assumes market only half-priced the QB change |
| H3 BAL-mobility | -1.0 | 0 | 47.1% | 50.0% | Huntley rushing/QB-mobility upside the model ignores; CLE offense poor |
| H3b | -1.0 | +0.5 | 47.1% | 48.5% | same, with more BAL scoring |
| Cap probe | +2.0 | -2.0 | 55.7% | 56.0% | soft cap only; not endorsed |

Break-evens: CLE +3 -106 = 51.5%; Under 40.5 -112 = 52.8%; Over 40.5 -104 = 51.0%. My central case is H1; it clears neither threshold. Adjustments stay inside the 2.0 soft cap.

## Props (verified rows only)

BetOnline (captured 2026-10-17T21:15:40Z, raw-price verified, roster identity matched) has fantasy-point, target and anytime-TD rows, availability "available_at_capture_only". Reference prices only: Huntley ATD +325, fantasy pts O/U 14.5 -115/-115; Watson ATD +525, FP 14.5 -115/-115; Henry ATD -150 / No +120, FP 16.5 -115; Flowers ATD +210; Andrews ATD +275, targets 5.5 -115; Judkins ATD +160 (Judkins is Questionable); Fannin ATD +250. Bookmaker has no player-tagged rows (0 of 60). I make no prop recommendation: no joint model, QB change repricing unproven, and the Action Network Henry rush O89.5 and Andrews rec O29.5 legs have no matching current row.

## Ambiguity / missing data

- Official inactives (Huntley, Watson, Judkins, Graham, Schwesinger) pending; ESPN data are 10/17 02:03Z.
- queue packet_pins block still lists the pre-requeue packet hashes (BAL@CLE 9668500b...); the activation, launch board, and independently computed canonical hash all give 4058d090.... I treated the board/activation as governing; controller should refresh the stale packet_pins block.
- Bookmaker thin coverage (no player rows) and stale moneyline splits: coverage notes.
- Gibbs line "about plus five" is approximate; Erickson article body vs play list conflict; Lane IR/questionable conflict; second-hand ATS trends unverified.
- Validator scripts/intel/validate-game-output.py is hard-pinned to Week 5 paths and was not run; manual self-check done (no forbidden keys, disposition/tier pair valid, adjustments within caps, claims sourced or in this section).
- Fourth-quarter, alt-line, SGP and teaser content was not compared to the full-game number.

## Counter-case

Taking BAL -3: a 4-1 team with +3 turnover margin, 6.36 ypp and a defense allowing 5.2 ypp against a Browns offense at 4.72 ypp, 30.6% on third down and 45.5% in the red zone; Cleveland's SRS is -0.87. The market only moved 1.5 points for the biggest QB downgrade on the slate, and Huntley has real mobility and a deep supporting cast (Henry, Flowers, Andrews). Home-dog ATS trends are small-sample. If CLE's offense cannot score, +3 fails on a field goal-plus margin, and 3 is the most common margin (~15.6% mass at exactly 3 per the simulator).

## Pre-kickoff delta checklist

1. Official inactives (~90 min before kickoff): confirm Huntley starts and Watson; a surprise Lamar activation reverts the market toward -4.5 to -5.5 and invalidates the CLE-side thesis context.
2. Price crossing: the simulator is re-centered on whatever line is entered, so a line move alone does not create edge (checked: CLE +3.5 with H1 gives 51.3% ex-push; Under at 41.5 or 39.5 gives 51.5%). A tier 2- watch needs better juice only: CLE +3 at about -100 or better (break-even 50.0%, H1 51.4%) or Under 40.5 at -105 or better (break-even 51.2%). Anything worse stays skip.
3. If the market moves to CLE +2.5 or shorter after inactives confirm Huntley/Watson, the Huntley discount is fully priced; keep skip.
4. Kickoff-day weather refresh: a material wind or precipitation flag (none in current forecast) would support the Under; do not assume it.
5. Judkins/Schwesinger/Graham news and any late BAL OL moves.
6. Re-run strict roster gate with --fetch on kickoff morning; changed roster snapshot requires requeue.
