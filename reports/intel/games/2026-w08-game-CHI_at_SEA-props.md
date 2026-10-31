# CHI @ SEA: Week 8 game synthesis, pass `props` (Monday Night Football)

As-of: Fri 2026-10-30 ~11:40 PM PT · Kickoff: Mon 11/2 5:15 PM PT (2026-11-03T01:15Z) · Inactives ~3:45 PM PT Mon · Packet built_at 2026-10-31T06:09:18Z · roster_vet PASS (age 8.5h, 2 UNVERIFIED slate-wide, none in this game's picks) · Book: BKR per-game board, capturedAt 2026-10-31T01:52:39Z (Fri 6:52 PM PT)

## Recommendation box

| # | Player | Market | Line | Price | Book | capturedAt | Projection / basis | Tier | parlay_leg_ok |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Caleb Williams (CHI) | Pass yds **UNDER** | 227.5 | -108 | BKR | 01:52:39Z | ~205: CHI 255 pass yd/g vs SEA allowing 158/g (DVOA -20.4%, EXP% 6.0%) | **B** | y |
| 2 | Jaxon Smith-Njigba (SEA) | Receptions **OVER** | 7.5 | +105 | BKR | 01:52:39Z | ~8.5: 11.1 tgt/g, 36.1% share, 8.3 rec/g; CHI CBALL% 69.5% | **B** | y |
| 3 | Jaxon Smith-Njigba (SEA) | Rec yds **OVER** | 99.5 | -108 | BKR | 01:52:39Z | ~108: 124 yd/g; CHI EPA/DB allowed +0.036 | C | n (same outcome as #2; pick one) |
| 4 | Caleb Williams (CHI) | Pass TD **UNDER** | 1.5 | -155 | BKR | 01:52:39Z | ~1.0/g: CHI 7 pass TD / 14 rush TD in 7 g | C | y (juice) |
| 5 | Colston Loveland (CHI) | Rec yds **UNDER** (if active) | 42.5 | +105 | BKR | 01:52:39Z | ~38: 35 yd/g, 5.8 yd/tgt; Q (neck), limited Fri | C | n (status risk) |
| 6 | AJ Barner (SEA) | Rec yds **UNDER** | 29.5 | -108 | BKR | 01:52:39Z | ~25: 26 yd/g; more chip work with LT Cross OUT | C | y |
| - | Sam Darnold (SEA) | Pass yds | 238.5 | O -115 / U -101 | BKR | 01:52:39Z | ~240 (SEA 247/g, CHI allows 241/g) | **PASS** | - |
| - | Luther Burden III / Rome Odunze | Rec yds | 52.5 / 40.5 | -108 / -107 (U) | BKR | 01:52:39Z | lean unders, no edge beyond #1 | PASS | - |

**7e Anytime TD candidates (BKR, 01:52:39Z):** D'Andre Swift -126 (top: 7 rush TD in 7 g; Monangai DNP Fri), Jaxon Smith-Njigba -126 (8 TD), Emanuel Wilson -145 (SEA lead RB; the Charbonnet split is a risk), Luther Burden III +209, Colston Loveland +209 (if active; Kmet IR), AJ Barner +209, Cooper Kupp +238. DK Predictions (reference only, 10/29 03:20Z) has Swift and JSN at -108, so BKR is pricing both shorter.
**8a First TD candidates (BKR):** Swift +562, JSN +562, Emanuel Wilson +453 (only if Charbonnet is inactive or limited), longshot Burden +949. Ben Johnson's Bears are 3-0 1H SU/ATS on MNF [Source: an_primer, Evan Abrams 2026-10-30], which supports a CHI first score.

## Game script (agrees with sides synthesis)

Sides synthesis: CHI +3 (C), UNDER 46 (C), fair SEA -2 / 44.5, SU SEA [Source: data/research-intel/proposed/games-w08/2026-w08-game-CHI_at_SEA-sides.json, 2026-10-31T06:25Z]. The re-run sim with the same adjustments (margin -1.0, total -1.5) gives a mean margin of SEA +2.5 and a mean total of 44.5, which implies about SEA 23.5 / CHI 21. Both are under BKR team totals of 24.5 / 21.5. Seattle's defense is the best unit on the field (3.96 YPP allowed, 158 pass yd/g, 36.4% pressure). Seattle's offense moves through one player: JSN gets 36% of targets and is the first read on 81% of throws [Source: FTN receiving usage, SEA.md / ftn-stats-iq…latest.json, 2026-10-30T22:00Z]. The prop picks follow that script: Caleb's passing is suppressed, and SEA's volume runs through JSN against a Chicago pass defense that allows the most yards per attempt [Source: expert_picks_pull, Rich Hribar 2026-10-30]. Prior Caleb vs Macdonald meeting: 6-3 [Source: an_primer].

## QB / availability

- QBs: Caleb Williams vs Sam Darnold, confirmed [Source: qb_operator_notes].
- SEA: LT Charles Cross OUT and LB Drake Thomas OUT. New G Quenton Nelson starts. RB Zach Charbonnet Q (limited Fri). WR Rashid Shaheed Q (knee). RB Jadarian Price is listed IR but was full on Friday. If Shaheed is OUT, JSN's target share rises → upgrade #2 toward A-, and Barner/Kupp gain volume → weakens #6. If Charbonnet is active, Wilson's TD equity splits.
- CHI: TE Cole Kmet IR. TE Loveland Q (neck, limited Fri). RB Monangai Q (DNP Fri; per a 10/28 report his chances were improving). CHI added DT Jeffery Simmons by trade 10/29 and has DE Montez Sweat back. CB Beanie Bishop Jr. carries a "SUSPENSION" flag (FantasyPros, needs review). If confirmed, CHI loses its slot CB, which helps #2/#3.
- For a Monday game the final injury report comes out Saturday. Friday statuses are practice-based only (web check: [Heavy, 10/28](https://heavy.com/?p=6520124); [SBR Week 8 injury report](https://www.sportsbookreview.com/picks/nfl/injury-report-injuries-betting-impact-week-8-2026/)).

## Market

The BKR spread and total are unchanged from the sides pass: SEA -3 -119, total 46. AN open was 47, so the total dropped 1 point against 79% of the money on the over. Rich Hribar's Darnold over was priced at 232.5 -114. BKR is now 238.5, a move of 6 yards past his number, which removes the edge relative to my ~240 projection. That is why Darnold is a PASS. The BKR CHI team total U21.5 -115 matches the model's CHI ~21 (noted only; it is not a player prop). The BetOnline board has game lines and specials only (no player props), so it does not price any pick here.

## Quantitative basis

- CHI offense: 72.1 plays/g, 55% dropback, pass DVOA 25.4%, but only 7 pass TD vs 14 rush TD. Under pressure Caleb's EPA/DB is 0.027 vs 0.501 clean [Source: CHI.md FTN].
- SEA defense: pass DVOA -20.4%, EXP% 6.0%, 8 INT, 8 pass TD allowed in 7 g [Source: SEA.md FTN].
- SEA offense: 247 pass yd/g, rush EPA/att -0.233. Darnold's EPA/DB is -0.729 under pressure, and Cross is out.
- CHI defense: 241 pass yd/g allowed, CPOE allowed +1.55, OPEN% 54.3%.
- Simulator (calibration sha 0ea35592…, selftest pass): `--home-line -3 --total 46 --margin-adj -1.0 --total-adj -1.5` gives mean margin 2.48, mean total 44.5. Props have no calibrated joint model; the projections above are judgment from rates, not model probabilities.

## Expert / podcast agreement

- Rich Hribar (Warren Sharp; written + YouTube = one opinion): Darnold O232.5 (-114). This is the closest expert prop. It indirectly supports #2/#3 (SEA passing volume), but the line has moved.
- No expert prop on Caleb or Loveland in the packet. Doug Kezirian (SEA -3: "Macdonald limits explosives, off-script pressure on Caleb") supports #1. Caleb's 8-2-1 road-over trend (Abrams) argues against #1.
- Brandon Anderson, Fezzik, Even Money and Lock & Cash all have CHI +3.5 spreads, which are not prop signals.

## Counter-case

1. **Caleb U227.5:** if CHI trails, it keeps throwing (72 plays/g). Caleb's road games have gone over the total by 12.3 PPG. SEA's 158 yd/g came partly against weak passing teams.
2. **JSN O7.5 rec:** CHI could bracket him with two-high looks. Pressure with Cross out could produce sacks and throwaways instead of completions. An 8-INT QB adds variance.
3. **JSN O99.5:** the same risks as #2 plus SEA EXP% dependence; one long play decides it.
4. **Caleb U1.5 TD:** CHI's red-zone TD rate is 0.75-0.80 over the last two weeks. A short field after a Darnold turnover would hurt this pick.
5. **Loveland U42.5:** with Kmet on IR he had 12 targets in W7.
6. **Barner U29.5:** if Shaheed is out, the TE target share rises.

## Ambiguity / missing data

- `missing_inputs`: BetOnline player props thin/missing (30 rows; no player props). No pick depends on BOL. Re-run Saturday ~2 PM PT.
- FTN player tables undercount games played (Caleb GP 4, Darnold GP 6), so team tables were used for yardage baselines.
- No BKR rush-yd lines for Swift, Wilson or Monangai, and no Caleb rush line, so no rushing prop is possible.
- The Beanie Bishop suspension and Jadarian Price IR status are unverified.

## Pre-kickoff delta checklist

1. Saturday final report: Shaheed OUT → JSN #2 to A-, drop #6. Loveland OUT → #5 void; move Loveland's ATD equity to Sam Roush (+664).
2. Charbonnet active → drop Wilson from First TD and keep Swift/JSN. Monangai OUT → Swift ATD becomes a stronger lean.
3. Caleb pass yds moves to 220.5 or lower → #1 drops to C; below 215.5 → pass.
4. JSN rec moves to 8.5 → pass #2 (keep #3 if yds ≤ 102.5).
5. Total moves to 47+ → recheck #1/#4. Total 44.5 or lower → keep.
6. Monday inactives ~3:45 PM PT: Simmons active; Bishop status.

## Gate notes

- Roster vet PASS (8.5h). Kickoff not passed. missing_inputs noted (BOL thin); no pick capped by it.
- Operator notes were used for QB/availability. The Price IR vs full-practice conflict and the Bishop flag are listed as unverified.
- One web search for final designations. MNF final report is due Saturday, so none were published yet.
- No BKR QB INT legs, no stakes, no wagers.
