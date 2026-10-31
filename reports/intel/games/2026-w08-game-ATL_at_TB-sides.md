# ATL @ TB — Week 8 game synthesis, pass `sides` (Saturday re-run)

As of: Sat 2026-10-31 ~3:15 PM PT · Kickoff: Sun 11/1 10:00 AM PT (inactives ~8:30 AM PT) · Packet built 2026-10-31T21:55Z · roster_vet: PASS (roster 0.3 h old; 14 UNVERIFIED slate-wide) · Raymond James Stadium, outdoors

## Recommendation box

| Market | Call | Tier | Fair | Edge | Playable-to |
|---|---|---|---|---|---|
| SPREAD | **PASS — lean TB -2.5 -108 (BKR)** | PASS (lean TB) | TB -3.0 | +0.5 pt | TB becomes C at -2.5 -103 or better, or -2 -110; pass at -3. ATL only at +3.5 or better |
| TOTAL | **UNDER 43.5 -112 (BKR)** | C | 42.5 | 1.0 pt | Playable to 43.5 -115 or 44 at any price; pass at 43 or lower |
| MONEYLINE / SU | **PASS (ML)**; SU winner **TB** | PASS | TB about -140 | about 0 | TB ML at -125 or better |
| SuperContest | TB -2.5 (contest line = BKR) is a lean only, **not a candidate** (sim 51.3%) | n | | | |
| Pool | SU **TB**, confidence **5/16** | | | | |

Prices are from the BKR per-game board, capturedAt 2026-10-31T21:27Z (2:27 PM PT). That matches the 2:26 PM PT game-lines paste exactly: ATL +2.5 -108 / TB -2.5 -108, o43.5 -104 / u43.5 -112, ML ATL +118 / TB -135. BKR team totals are ATL 20.5 and TB 22.5, which implies 43 [Source: data/generated/props/bookmaker-live-2026-10-31-falcons-at-buccaneers.json; bookmaker-gamelines-2026-10-31-week8.raw.txt].

## Changes vs Friday

Friday's run was Fri 11:25 PM PT, on packet 06:09Z [Source: reports/intel/games/_friday-w08/2026-w08-game-ATL_at_TB-sides.md].
1. **Picks and tiers: unchanged.** The spread is still a PASS with a TB lean, the Under 43.5 -112 is still C, the ML is still a PASS, SU TB at 5/16, and the contest line is still not a candidate. The simulator inputs and outputs are identical.
2. **BKR: unchanged.** The Fri 6:52 PM capture and the Sat 2:26 PM capture show the same spread, total, ML and prices.
3. **Splits (AN, Sat 2:23 PM PT):**
   - Spread: ATL 59% of bets / 64% of money (Fri 58/62). The gap is still under 10, so no flag.
   - Total: Over 73% of bets / 53% of money. The under-money gap narrowed from 23 to **20 pts** and is still a sharp-under flag.
   - ML: ATL 49% of bets / 73% of money. The gap is unchanged at 24 pts toward ATL ML.
   [Source: packet splits, captured 2026-10-31T21:23Z]
4. **New total signal: the Action Network PRO "High Winds" system (Under 43.5).** It is a system, not an expert. Its basis is avg wind 10+ mph (58% historical under), thunderstorm risk and a dome team playing outdoors [Source: youtube_picks_approved, AN PRO/Kolodziej, updated 10/31 1:33 PM PT]. It overlaps the Bet Labs "Med to High Wind" system already counted in Friday's -0.5 weather adjustment, so it is **not** added again. It confirms the weather read but does not raise the tier.
5. **New side signal:** VSiN Wes Reynolds, Buccaneers ML at -126 [Source: pick_signals, captured 10/31 14:54Z]. At BKR -135 that pick is 9 cents worse than his price, so it does not move the ML off PASS.
6. **New prop-only items (not used for sides):** Phil Wood (BettingPros) Mayfield 300+ pass yds +680, Trent Conner Pitts o3.5 rec (PrizePicks), Sal Vetri Bijan o79.5 rush, and Cody Brown alt legs (Bijan 60+, Irving 40+).
7. **Availability:** LB Divine Deablo is now listed **OUT** (Friday: Q). The packet still shows WR Egbuka OUT for TB, Gainwell Q, and Brian Robinson Jr. OUT. Goedeke is not in the Saturday feed at all, so his status is unresolved. Deablo out is a small negative for ATL's run fit vs Irving. It is not worth a rating move.
8. **Weather input is unchanged** (Open-Meteo file mtime 10/31 01:02Z, not refreshed).

## Game script

This is a low-explosive divisional game. ATL is #23 and TB #28 in offensive EPA/play [Source: team dossiers ATL.md/TB.md, via Friday report]. ATL's run-first attack (Bijan Robinson with ~80% snaps while Brian Robinson Jr. is out) runs into TB's top-5 DVOA run and pass defense [Source: Stuckey, AN video t=1017s]. That pushes Penix into dropbacks against a blitz-heavy Bowles scheme [Source: secondary_matchups coverage_scheme]. Without Egbuka, TB leans on Bucky Irving and Godwin in the slot vs ATL's quarters/match zone. The modal outcome is TB by a field goal in the low 40s. Winds of 13 mph gusting 18, with a 45% chance of precip, suppress the deep game [Source: packet weather].

## QB / availability

- QBs: Michael Penix Jr. (ATL) vs Baker Mayfield (TB), with no backup flag on either side [Source: an_primer.game]. Mayfield's status shows UNKNOWN in FantasyPros, a known feed artifact. Friday confirmed he was a full participant with no designation.
- ATL: Brian Robinson Jr. OUT, Deablo OUT and Billy Bowman Jr. OUT. Zaccheaus, Ebukam, Snowden, Beaux Collins and Avieon Terrell are Q. James Pearce Jr. is suspended. CB C.J. Henderson has no designation [Source: availability; ESPN via secondary_matchups 10/30 21:23Z].
- TB: Egbuka OUT (foot) and Gainwell Q (hip) [Source: Rotowire 10/30]. **RT Luke Goedeke was Q on Friday's report (calf, DNP Wed/Thu)** [Source: Friday report, buccaneers.com 10/30]. If Goedeke is out, take ~0.5 off TB and add a little to the under. TB's lean would then drop to a flat pass. If he is in, the lean on TB stands. The flip trigger is TB inactives at ~8:30 AM PT.
- Web check (this run): I could not get a fresh final report. SI's 10/27 preview lists Zaccheaus, Deablo, B. Robinson Jr., A. Terrell and Bowman (ATL), and Egbuka, Winfield Jr. and Goedeke (TB). The Bucs' Oct 30 report page did not load.

## Market

- **AN open** (Sun 10/25 5 PM PT): TB -1.5 -110, total 45.0, ML -125/+104. BKR now: TB -2.5, total 43.5, ML -135/+118. That is **1 pt toward TB** and the total **down 1.5**. TB moved up with 59–64% of tickets and money on ATL, which is mild reverse movement.
- SuperContest: TB -2.5, the same as BKR (0 gap) [Source: data/supercontest/week-08-lines.json].
- Splits are in "Changes vs Friday". The sharp flag is on the **Under** (73% of bets vs 53% of money). Money also leans to **ATL ML** (24-pt gap), which contradicts the spread movement.

## Quantitative

- SRS TB 3.69 (#10) vs ATL 2.86 (#12). Net PPG +1.6 vs -0.3, Pythag .542 vs .493, model rank 12 vs 15. The market ranks TB 22nd (z-delta -1.17), so it underrates TB vs results [Source: power_ratings]. Prediction markets show TB with a 7.18 median win total (context only).
- Fair TB -3.0 (range -2.3 to -3.8). Koerner projects -2.6 [Source: Koerner PRO, 10/28].
- Simulator (2018–2025 calibration, sdMargin 12.77, sdTotal 13.13), home -2.5, total 43.5:

| Run | margin_adj | total_adj | TB cover | ATL cover | Over | Under | TB win |
|---|---|---|---|---|---|---|---|
| Baseline | 0 | 0 | 50.0% | 50.0% | 50.0% | 50.0% | 56.1% |
| **Adopted** | **+0.5** | **-1.0** | **51.3%** | 48.7% | 47.0% | **53.0%** | 57.4% |
| Stress | +1.0 | -2.0 | 52.6% | 47.4% | 44.0% | 56.0% | 58.7% |

- Breakevens are 51.9% at -108, 52.8% at -112 and 57.4% at -135:
  - TB cover (51.3%) is below breakeven, so PASS.
  - The Under clears by about 0.2 pts, so tier C.
  - The ML sits at breakeven.
  - The contest line equals BKR, so the same 51.3% applies.
- Adjustments: margin +0.5 for TB run defense vs ATL's run-heavy offense and TB's Pythag/one-score underrating, net of Egbuka OUT and Goedeke Q. Total -1.0 for wind/rain plus wind systems (-0.5) and both offenses in the bottom 10 in EPA vs TB's #3 defense (-0.5). Under money is not added, because the 45 → 43.5 move already prices it.

## Expert / podcast / article agreement

- **TB -2.5:** Brandon Anderson (AN), Stuckey (AN), Matt Moore (AN), Simon Hunter (Sharp or Square; 2 mentions = 1 opinion), and Koerner (#11 of 26, 0.7% edge). **TB ML/SU:** Wes Reynolds (VSiN, -126, new) and PFT (TB 27-20).
- **ATL:** Steve Makinen (VSiN best bet, +2.5). BettingPros took +1.5 on 10/28, a stale price now 1 pt better. Teaser legs are not comparable to the full-game number: Tuley ATL +8.5 and Stuckey's ATL teaser. @lockandcash says to avoid ATL in teasers.
- **UNDER:** Brandon Anderson (u45.5), Fezzik/Even Money (u45.5, parlay leg) and AN PRO High Winds (u43.5, system, new). Both expert unders were priced at 45.5, so 2 pts of their value is gone.
- **OVER:** BettingPros (45, stale) and PFT's implied 47.
- AN primer trends lean ATL:
  - TB 1-11 ATS at home since 2025.
  - Mayfield 13-27-1 ATS as a home favorite.
  - NFC South favorites 16-34-1 ATS.
  - Division dogs 23-10 ATS.
  - 30-40 rule fade.
  - Bowles 5-12 ATS off a 10+ point win.
  - Pro-TB counterweight: Stefanski 5-11 ATS as a divisional road dog [Source: an_primer, Evan Abrams 10/30].

## Counter-cases

- **Lean TB:** The trend stack and ML money (73%) are on ATL. TB is without Egbuka and possibly its RT, and its pass offense (EPA/DB -0.152) may not win by 3. Divisional dogs are 23-10 ATS this season.
- **Under:** ATL is 7-0 to the 1Q over and 6-1 to the 1H over. Combined season scoring averages are ATL 49.1 and TB 44.7. Turnovers inflated both W7 wins, and a short-field script clears 43.5 easily.
- **ML pass:** If TB's Pythag underrating (-1.79) is real, -135 is cheap.

## Ambiguity / missing data

- Final Friday designations could not be re-pulled this run. Goedeke and Winfield Jr. are unresolved in the Saturday feed.
- The weather file was not refreshed after Friday 6:02 PM PT, and the thunderstorm risk comes only from the AN PRO system blurb.
- Coach naming: the dossier lists Raheem Morris (historical block). The AN primer and the Falcons site say **Kevin Stefanski**, and this report uses Stefanski. Ignore coach names in secondary_matchups.
- FantasyPros rows carry needs_human_review (e.g., Mayfield UNKNOWN).

## Pre-kickoff delta checklist

- Goedeke inactive: spread lean → flat PASS, and the Under gains a little.
- TB -3 at BKR: hard pass on TB. ATL +3 -110 or better: re-evaluate ATL to PASS/C.
- Total ≤43: drop the Under to PASS. Total 44+: the Under upgrades toward B.
- Game-day radar shows thunderstorms or sustained wind of 15+ mph: Under to B. Calm and dry: Under to PASS.
- TB ML -125 or better: ML to C.

## Gate notes

- missing_inputs[]: none.
- roster_vet: PASS (0.3 h). Applies to props only; no props were picked on this pass.
- Kickoff has not passed, so this is a forward pick.
- QB facts come from an_primer and Friday's confirmations (qb_operator_notes is empty).
- The final injury report web check was partial (see Ambiguity).
- The weather input is stale relative to Saturday.
