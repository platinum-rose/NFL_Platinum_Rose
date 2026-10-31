# NE @ MIA — Week 8 game synthesis, pass `sides` (Saturday re-run)

- As of: Sat 2026-10-31 ~3:30 PM PT (22:30 UTC)
- Kickoff: Sun 11/1 1:25 PM PT (21:25 UTC), Hard Rock Stadium (outdoor). Inactives about 11:55 AM PT Sunday.
- Packet built: 2026-10-31T21:55:40Z (`scratch/w08-game-synthesis-queue-sides.json`) · roster_vet: **PASS** (roster age 0.3 h; 14 UNVERIFIED league-wide, none cited here) · missing_inputs: none
- Friday baseline: `reports/intel/games/_friday-w08/2026-w08-game-NE_at_MIA-sides.md` (as of Fri ~11:25 PM PT)

## Recommendation box

| Market | Pick @ BKR | Tier | Fair | Edge | Playable to |
|---|---|---|---|---|---|
| SPREAD | **PASS at MIA +7 -117** (lean MIA) | PASS (C lean) | NE -6 | 1.0 pt to MIA | MIA +7 at -110 or better, or any +7.5 (C). Pass at +7 -115 or worse, or +6.5 |
| TOTAL | **UNDER 43.5 -111** | **B** | 41.5 | 2.0 pts | to 42.5 -115. Pass at 42 or lower |
| MONEYLINE / SU | PASS (NE -340 / MIA +286). SU winner **NE** | PASS | NE ~71.7% (fair ~-253) | NE overpriced. MIA +286 is about 2 pts above break-even on the model, which is too thin | MIA ML only at +300 or better (C) |
| SuperContest | **MIA +7** (contest line NE -7) | C | NE -6 | 1.0 pt | candidate = yes, mid/low slot |
| Pool | SU: **NE** · confidence **9/16** (was 11) | — | — | — | drop to 8 if Sunday wind holds 20+ mph |

[Source: data/generated/props/bookmaker-live-2026-10-31-patriots-at-dolphins.json capturedAt 2026-10-31T21:28:24Z (Sat 2:28 PM PT), which matches bookmaker-gamelines-2026-10-31-week8.raw.txt (Sat ~2:26 PM PT). Both were captured after the Brown/Henderson news.]

## Changes vs Friday
1. **Availability (official):** patriots.com's Saturday 10/31 report lists **WR A.J. Brown OUT** (ankle/knee), **RB TreVeyon Henderson OUT** (illness) and **T Marcus Bryant OUT** (ankle; new to this report). On Friday Brown and Henderson were both Questionable. CB Carlton Davis III (neck) and LB Christian Elliss (chest) remain Q [Source: patriots.com/news/week-8-injury-report-patriots-at-dolphins-x9227, fetched Sat; news_notes ESPN 17:42Z, Rotowire 17:07Z/17:10Z]. The "career ending"/trade-talk tweet (S_CharlesNFL 10/30) is **unverified and not used**.
2. **Margin adjustment +0.5 → +1.0 (toward MIA).** Fair line NE -6.5 → **NE -6**.
3. **BKR price:** the spread and total did not move (NE -7 +101 / MIA +7 -117; 43.5 o-105/u-111). The 1H (NE -3.5 -113, 22) and team totals (NE 25.5, MIA 17.5) also held. The **ML moved toward NE**: -324/+273 → **-340/+286**. The market absorbed the Brown news with no move in the spread.
4. **Splits (AN, 21:23Z):** spread NE 76% bets / 76% money (Friday 75/76). Over 78% bets / **74% money** (Friday 77/77). The over money now runs 4 pts below over tickets: not a sharp flag, but it leans under.
5. **New total signal:** the Action Network PRO "High Winds" system flags **Under 43.5** (Kolodziej article, updated Sat 1:33 PM PT; avg wind 10+ mph, 58% historical; thunderstorm risk). This is a system, not an expert.
6. **New article/X rows:** Dan Servodidio (BettingPros, 10/31) parlays NE ML (-325) with Hunter Henry ATD at +208. Lock & Cash (X, captured Sat 21:51Z) and Wes Reynolds (VSiN) both teaser **NE -1**. Sal Vetri's A.J. Brown o59.5 rec yds is **void** (Brown is out). The 9 Saturday podcast episodes produced no new NE@MIA side or total picks; their game picks are props, for the props pass.
7. **Simulator:** MIA cover 51.5% → 52.9% (still below the 53.9% break-even at -117). Under unchanged at 56.0%. MIA win 27.2% → 28.3%.
8. **Recommendation tiers are unchanged.** Pool confidence 11 → 9 (Friday's stated trigger: Brown out).
9. **Weather input was not refreshed:** the packet still carries the Fri 01:02Z Open-Meteo file, and a fresh pull from the device failed (no network to open-meteo). The AN PRO system on Saturday afternoon is the only newer wind corroboration.

## Game script
NE comes in with 10 days of rest after its TNF loss in Chicago. MIA is on normal rest after its first win [Source: an_primer Abrams trends; dossiers]. The NE offense now has no Brown (27% target share since his return, per Sal Vetri's tweet) and no RB2 Henderson, and it has lost a tackle (Bryant). The passing game shifts toward DeMario Douglas, Efton Chism III and Hunter Henry, who are all matched against MIA's two-high match-zone weaknesses (slot, seam, TE middle) [Source: secondary_matchups sec_8bdb0b27c5de8324]. A narrower set of targets in forecast wind (32 km/h ≈ 20 mph, gusts 38 km/h, 80% rain [Source: packet weather, Fri forecast]) points to a lower-possession, field-position game. MIA plays slowly and leans on the run (Ollie Gordon has 88+ rush yds in 3 straight games [Source: expert_picks_pull Anderson]). Most likely outcome: NE by 3-10, total in the high 30s to low 40s.

## QB / availability
- QBs per the packet: **Drake Maye (NE)** and **Malik Willis (MIA)**. Neither is flagged as a backup [Source: an_primer.game; projected_starters]. qb_operator_notes is empty in this rebuild; Friday's Andy confirmations named the same QBs.
- NE OUT: Brown, Henderson, T Marcus Bryant. NE Q: CB Davis III, LB Elliss [Source: patriots.com Sat report].
- MIA (Friday report; no Saturday section): G/T Kadyn Proctor OUT (concussion), CB JuJu Brents Q, CB Reese Taylor Q [Source: patriots.com page, MIA Fri 10/30 section].
- **If Davis/Elliss sit**, MIA's offense gets a small bump (+0.25 toward MIA, which does not change a tier). **If Brents or Taylor sit**, NE's slot/TE targets gain, which slightly cuts the under's edge.

## Market
- **AN open** NE -7.5 (-113 home), 44.5 (primer says 45) → **BKR now** NE -7 / 43.5. That is 0.5 pt toward MIA and 1-1.5 pts down on the total, against about 76-78% of public tickets on NE and the over: reverse line movement on both.
- SuperContest NE -7 equals BKR. The contest has no juice, so MIA +7 there avoids the -117.
- Splits: no 10+ pt money/ticket gap on the side. The over shows a 4-pt ticket>money gap (leans under). The ML is 96% NE.

## Quantitative
- Power: NE SRS +5.80 (#6) vs MIA -6.14 (#27). Model rank #9 vs #30 [Source: packet power_ratings]. Raw SRS says about NE -9 at MIA, regressed for NE's turnover luck and MIA's soft schedule (Friday analysis). Brown out removes about 1 pt from NE.
- Prediction markets: NE median wins 10.7, MIA 3.9 (context only).
- **Simulator** (calibration 2018-2025, sha 0ea35592; all self-tests pass; probabilities exclude pushes):

| Run | home-line / total | margin / total adj | MIA cover | push | Over / Under | MIA win |
|---|---|---|---|---|---|---|
| Baseline | +7 / 43.5 | 0 / 0 | 50.0% | 5.6% | 50.0 / 50.0 | 26.1% |
| **Adjusted (view; = SC line)** | +7 / 43.5 | **+1.0 / -2.0** | **52.9%** | 5.6% | **44.0 / 56.0** | 28.3% |
| Friday view | +7 / 43.5 | +0.5 / -2.0 | 51.5% | 5.6% | 44.0 / 56.0 | 27.2% |
| Sensitivity | +7 / 43.5 | +1.5 / -1.0 | 54.4% | 5.6% | 47.0 / 53.0 | 29.5% |
| If +7.5 appears | +7.5 / 43.5 | +1.0 / -2.0 | 52.8% | 0 | 44.0 / 56.0 | 26.1% |

Break-evens: MIA +7 -117 needs 53.9%, and the view gives 52.9%, so **pass**. Under -111 needs 52.6%, and the view gives 56.0%. MIA ML +286 needs 25.9% against a model 28.3%. That edge is too dependent on the model for a pick, because the baseline already sits 1 pt above the market's no-vig 25.1%.

Adjustments (home-positive):
- margin +1.0: Brown OUT (confirmed), Henderson OUT, T Bryant OUT, wind compressing a pass-first favorite's margin, and reverse line movement against 76% NE money.
- total -2.0 (soft cap): ~20 mph wind and 80% rain [Fri Open-Meteo], AN PRO High Winds under system (Sat), Hochuli games 60-44-2 to the under [an_primer], MIA's slow tempo, NE's thinner set of targets.

## Expert / podcast / article agreement
- **MIA side:** Sean Koerner (AN PRO, MIA +7, ATS confidence #3/26, proj +6.5); Brandon Anderson (MIA +7.5 parlay leg, now stale); BettingPros, Sharp or Square and Even Money (MIA +7.5 from 10/27-10/28, 0.5 pt stale). Trends from Evan Abrams: 6+ pt favorites 8-21-3 ATS, division dogs 23-10 ATS, Hochuli favorites 43-60-2 ATS, NE 3-10-1 ATS at Miami since 2012.
- **NE side:** PFT (31-20); Steve Krebs (NE ML -370); Servodidio (NE ML in a parlay); teaser NE -1 from Lock & Cash and Wes Reynolds (VSiN). Note that teasers are not comparable to -7. Trends from Abrams: Vrabel 5-0 SU/ATS with NE off a SU loss; Maye 16-0 SU and 12-4 ATS as a 3+ pt favorite; rest-advantage favorites 15-3-1 ATS.
- **Total:** Under is backed by the AN PRO High Winds system, the Hochuli under trend, the market drop and the over money lagging tickets. Over is backed by Vrabel 12-3 to the over against the AFC East and PFT's projected 51. No named expert in the packet has a full-game total pick.

## Counter-case
- **Under:** Miami rain is often a short burst, and if Sunday's wind is under 12 mph the main reason is gone. MIA's defense is #30 in EPA/play allowed. Turnovers on a wet field produce short-field points. NE's team total of 25.5 already covers 59% of 43.5.
- **MIA lean:** NE has the rest edge and a Vrabel bounce-back record. The market did not move off -7 after the Brown news, which suggests books rate Brown, at less than full health, as worth little. Maye has never lost as a 3+ pt favorite.
- **NE SU:** about 28% MIA upset chance in a wind-driven, low-possession game.

## Ambiguity / missing data
- The weather forecast is about 44 h old at the time of writing, and the device could not refresh Open-Meteo.
- MIA has no Saturday injury section (Friday designations are used).
- AN total open is 44.5 in the openers file vs 45 in the primer.
- qb_operator_notes is empty in this rebuild. The QBs come from the AN primer and projected_starters, and match Friday's confirmations.

## Pre-kickoff delta checklist
1. **Wind (Sunday morning):** under 12 mph sustained → total adjustment -1.0, Under drops to C, and pass at 43. 20+ mph → Under stays B and pool confidence drops to 8.
2. **Price:** MIA +7.5 or +7 at -110 or better → MIA side C. Under 42.5 or lower → pass at 42. MIA ML +300 or better → C.
3. **Inactives (~11:55 AM PT):** Davis III, Elliss (NE), and Brents, Taylor (MIA). Any late MIA OL loss beyond Proctor shades toward NE.
4. Ignore further "Brown career" chatter unless it comes from the team or a tier-1 reporter (no effect on this game; he is already out).

## Gate notes
- missing_inputs: none. roster_vet PASS (0.3 h). Kickoff has not passed, so these are forward picks.
- One official injury search was made, and it was successful (patriots.com 10/31). The packet feed's OUT tags for Brown and Henderson agree with it.
- The stale staff names in secondary_matchups ("Jerod Mayo", "Anthony Weaver") were ignored. HCs are Vrabel and Hafley per the AN primer and dossiers.
- The weather input is stale (Friday). The device curl to Open-Meteo failed, and this is flagged rather than blocking.
- The roster gate was not rerun. Nothing was committed and nothing was written to Supabase.
