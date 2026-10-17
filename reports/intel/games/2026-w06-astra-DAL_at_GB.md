# Astra W06 - DAL@GB (proposed synthesis)

As-of: Sat 10/17 ~3:40 PM PT. Generated: 2026-10-17T22:40:03Z. HEAD: ea74728e1e1f174f047755719896b90460c2eb64 (branch claude/w5-prop-cards-2026-10-11). Kickoff: Sun 10/18 5:20 PM PT (2026-10-19T00:20Z). Packet: queue e5832e56..., packet 674601fa... (/packets/11), session prompt c2bf2b1b.... Pins re-verified: queue, packet, session prompt, launch sheet and 51 of 52 packet source hashes match; the 52nd (w06-roster-vet.json) is the self-rewriting receipt, read only (PASS, roster snapshot 2026-10-17T22:22:11Z, age 0.2h at receipt; npm run roster:vet not rerun per instruction).

## Disposition
**conflicted / tier research_only.** The market (GB -1.5, 53) and the quantitative model (GB +1.58 margin, 53.26 total) agree within 0.1 / 0.26 points, so there is no price edge. Qualitative sources split on the side, and the over is real in the podcast/public lanes but crowded. Nothing here is a candidate; this is a proposal for Andy to react to, not a play. [Source: queue packet /market, /team_dossier/quantitative]

## Team form and schedule
- DAL 2-3, 27.6 ppg / 27.2 papg, 5.76 ypp offense but 6.42 ypp allowed, turnover margin -3, SRS -3.27 (rank 24), model composite rank 18. GB 3-2, 20.8 ppg / 22.4 papg, 4.70 ypp allowed, turnover margin +3, third-down 27.6%, 3 three-and-outs per game, SRS +1.07 (rank 15), model rank 17. [Source: packet /team_dossier/team_signals, ESPN game_log through week 5]
- Profile: DAL is the better offense and much worse defense; GB wins with takeaways (9 vs 6 giveaways) rather than efficiency. Turnover margin is the likeliest regression candidate on both sides.
- GB beat CHI 31-7 last Sunday per the Hargrave injury note. [Source: availability layer, GB reported_out_ir comment 2026-10-12]

## Availability and QB
- QBs: Dak Prescott (DAL) and Jordan Love (GB), both ESPN depth chart, roster-identity matched, not team confirmation. [Source: packet /availability/quarterbacks]
- GB reported out: Micah Parsons (DE, knee), Javon Hargrave (DT, Achilles), Jonathan Ford (DT), Jordon Riley (DT, Achilles), Benjamin St-Juste (CB), Skyy Moore (WR); Josh Jacobs (RB) is on the Commissioner's Exempt List and eligible as soon as Week 7. Questionable: Cisse, Monk, Banks, Campbell. DAL reported out: Drew Shelton (OT), Cobie Durant (CB); questionable: LT Overton, Joey Porter Jr. (full participant Thursday), DeMarvion Overshown (limited), Ameer Speed. [Source: data/research-intel/availability/2026-w06-availability-layer.json games[12], 2026-10-12 to 10-16]
- The GB defensive line is gutted; this is the strongest concrete piece of context for DAL offense / points, but it is already in the number. Official inactives decide.

## Weather and venue
Forecast 50.7F, 0% precipitation, wind 14 km/h, gusts 30.2 km/h (about 19 mph), direction 203 deg; no material flag. Forecast only (Open-Meteo, 10/17 1:16 PM PT = 20:16Z). [Source: packet /weather]

## FTN and quantitative
- Model means: GB 27.42, DAL 25.84, margin GB +1.58, total 53.26; anchor diff vs board 0 / 0. Offense z: DAL +1.34, GB -0.90; defense weakness z: DAL 1.82, GB 0.67; tempo z: DAL +1.93, GB -0.98; secondary adjustments GB +0.16, DAL -0.07. [Source: packet /team_dossier/quantitative, model 2026-10-17T21:11Z]
- The z-scores point to a high-variance DAL-driven game against a slow GB tempo; mean total is a hair over the line. FTN is weekly-cadence accepted context, original capture 10/13-10/16, not an expert tier.
- Model probabilities are provisional context only, not independent of the market.

## Market (captured, not live offers)
| Item | Opener (10/12 00:06Z) | Bookmaker 12:40 PM PT (19:40Z) |
|---|---|---|
| Spread | GB -0.5 (-107) | GB -1.5 (-105) / DAL +1.5 (-111) |
| Total | 52 | 53 (o-108 / u-108) |
| Moneyline | DAL -111 / GB -110 | DAL +100 / GB -113 |
Movement: GB 1.0 point stiffer, total +1 (cross-book opener vs one book - a note, not a signal). Locked SuperContest line GB -1.5 (10/15 2:29 PM PT) is unchanged. No executable live prices. [Source: packet /market]

## Experts, podcasts, articles
- GB side: VSiN Makinen 8108 GB -1.5 (10/15); PFT Florio 8054 GB 27-24; ESPN Maldonado/Moody/Walder 8187 GB in all three; Joe Gibbs (Sharp) "I still lean to the Green Bay Packers at home."; Scott Bogman "I would take the home team minus the one." (priced -1, now -1.5: worse); VSiN Zachary Cohen Packers ML +120 (10/14, stale price); The Favorites GB ML (quote/URL gaps).
- DAL side: ESPN Maldonado 8331 Cowboys +1.5 (+102); BettingPros Erickson 8332 Cowboys moneyline and /picks/102 "I'll take the Dallas Cowboys, as painful as that sounds" (DAL +1.5, unchanged); teasers: Stuckey, Fezzik and Tucker (DAL to +7.5, teaser legs not comparable to the full-game number). ESPN betting insight in 8187: DAL 5-0 SU/ATS as road dogs of 3 or less since 2024 (unverified stat).
- Flag - Action Network 8238 (Planovsky) contradicts itself (Packers moneyline vs later "Pick: Under" 53.5), carries a Seahawks-Broncos template error and prediction-market prices. Not usable as a lead for either side or total.
- Total: Over from Kezirian, Gibbs ("And I do like the over on Sunday night." - rationale: Wrolstad crew 4-0 to the over), Bogman (52.5, now 53). Average Joe consensus Over 53 97% and GB -1 69% (VSiN Burke 8365): context, not edge.
- Reading: sides are split with credible names on both sides (Makinen vs Erickson/Maldonado) and the big trend claim is unverified, so no agreement; totals lean over but the over is the most crowded position on the board.

## Splits (spread/total 10/17 18:14Z, 3h old; ML Thursday pull 42.6h old)
Spread: DAL 55% tickets / 62% money; GB 45% / 38%. Total: over 62% tickets / 86% money; under 38% / 14%. Moneyline split (GB 57% tickets / 43% money) withheld as stale. Money is on DAL and heavily on the over. [Source: packet /betting_splits]

## Simulator (scripts/intel/margin-simulator.mjs; selftest passed; GB -1.5, total 53)
| Run | margin_adj | total_adj | GB cover | Over (incl push mass 3.0%) | Note |
|---|---|---|---|---|---|
| Baseline | 0 | 0 | 50.0% | 48.5 / under 48.5 | GB win 52.4% excl tie |
| GB lean | +0.5 | 0 | 51.3% | 48.5 | GB win 53.7% |
| DAL lean | -0.5 | 0 | 48.7% | 48.5 | DAL cover 51.3% |
| DAL lean | -1.0 | 0 | 47.4% | 48.5 | DAL cover 52.6% |
| Over lean | 0 | +1 | 50.0% | 51.5 (excl push 53.1) | |
| Under lean | 0 | -1 | 50.0% | 45.5 / under 51.5 | |
Adopted adjustment: 0 / 0 (model sits on the market). Hypothesis rows are judgment brackets, each within the 2.0 cap: -0.5/-1.0 for GB DL attrition, DAL offense/tempo and the road-dog trend; +0.5 for GB home field and turnover edge; +/-1 on the total for over crowding vs offensive/tempo z-scores. Probabilities are conditional on the hypothetical adjustment, not forecasts. A half-point of margin is worth about 1.3 cover points here, so the DAL case needs ~1 point of real edge to matter.

## Props (verified BKR rows, captured 2026-10-17T19:42:41Z; no sportsbook visited, availability at capture only)
- Jordan Love pass yds O/U 280.5 (-116/+100) [rows 3950-51]; Dak Prescott O/U 272.5 (-106/-110) [3948-49]. Podcast Love O272.5 is now 8 yards stiffer.
- Christian Watson: rec O4.5 -130 / U +111 [4053-54]; rec yds O74.5 -116 [4145]; first TD +906 [4357] (VSiN Burke 8136 had +950). Matthew Golden: rec O5.5 +135 [4051], rec yds O65.5 -117 [4143], first TD +995 [4375] (8136 had +1100). Ryan Flournoy rec O3.5 +118 [4043] (Meaney +130). MarShawn Lloyd rush 80+ +440 [4317] (8336, matchup inferred, +550 at publish); carries O/U 11.5 -108.
- Omitted: all anytime-TD and Watson 2+ TD +950 (no Bookmaker TD-scorer rows), Golden longest-reception 40+ +350, Golden ATD +280; BEO rows (no player names in the packet selection field); DraftKings Predictions (reference only). No joint model exists for props.

## Counter-case
Both sides, because neither is clean. For DAL: GB's front is missing Parsons, Hargrave, Ford and Riley; DAL is the better offense by z-score and ypp; DAL +1.5 is a short dog with money (62%) and ESPN's unverified 5-0 road-dog trend. For GB: DAL allows 6.42 ypp and -3 turnover margin; GB is +3 and at home; DAL's Porter and Overshown are questionable; the over has 86% of money and a 97% public consensus, historically the zone where the number is already priced in or inflated. Under 53 has the opposite crowd on its side but GB's slow tempo (z -0.98) is the only structural argument.

## Ambiguity / missing data
See the ambiguities list in the JSON (11 items): article contradictions (8238 above all), opposite-side leads, unverified ESPN trend, stale ML splits, no official inactives, forecast-only weather, unverifiable TD props, publish-vs-current prices, and the leftover temp file scratch/.tmp_dalgb_rest.txt (created by mistake; delete manually). Validator not run (Week 5 pinned); manual self-check done.

## Pre-kickoff delta checklist
1. Official inactives about 90 min out: Love and Prescott; GB DL/CB outs; DAL Porter, Overshown, Overton.
2. Price: DAL +2.5 or +3 turns the DAL case into a 2- candidate; GB -3 only if DAL defensive injuries grow.
3. Total: 54+ without news adds under value; 51.5 or lower with wind/gusts over 35 km/h reduces over interest. Over at 53 is crowded, not edge.
4. Kickoff-day weather refresh (open-air Lambeau).
5. Re-price props only against fresh BKR/BEO rows with actual timestamps; verify Lloyd's role after Jacobs' exempt-list status.
