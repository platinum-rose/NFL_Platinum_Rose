# CIN @ BAL — Week 7 game synthesis, pass `sides`
As of: Fri 2026-10-23 18:30 PT · Kickoff: Sun 10/25 10:00 PT (1:00 ET), M&T Bank Stadium (outdoor, grass) · Packet built: 2026-10-24T01:26:41Z · roster_vet: PASS (age 0.0 h; 1 INFO, 1 UNVERIFIED) · Inactives: Sun ~08:30 PT

## Recommendation box
- **SPREAD:** PASS at BKR (lean CIN +1 -113) | C-lean | fair BAL -0.2 | edge 0.8 pts to CIN | +1 -113 is below breakeven on the sim (52.1% excl push vs 53.1% needed); playable only at CIN +1.5 or +1 at -105 or better
- **TOTAL:** UNDER 48.5 -107 (BKR) | C | fair 47.1 | edge 1.4 pts | playable to 47.5 -110; pass at 47 or if Lamar is announced active and full-go before kickoff
- **MONEYLINE / SU:** CIN ML -102 (BKR) | C | fair CIN ~-104 (50.9% excl tie) | marginal | playable to -105; pass at -110 or worse
- **SuperContest:** CIN +2.5 (locked line) | B | edge 2.3 pts vs contest line | sim 56.0% | `supercontest_candidate: y`
- **Pool:** SU CIN, confidence 3/16 (coin-flip game; would drop to 1–2 if Lamar is confirmed active, rise to 6 if he is inactive)
- Card fit: `parlay_leg_ok`: ML yes as a small leg only before inactives, preferred after a Lamar-OUT confirmation; Under no (QB-status correlation). `standalone_preferred`: SC CIN +2.5 yes; others no (edges too thin).

## Game script
Two scripts, one switch. **Lamar active:** he is hobbled by a high-ankle sprain (limited all week; limp noted after Wednesday's practice), so BAL leans on Derrick Henry against a CIN run defense that graded last in the preseason trench composite (run D z -1.96), with Lamar's passing (10.1 YPA, DVOA 41.7% in 4 games) doing damage from the pocket. Burrow's quick game (TTT 2.36) goes after a BAL secondary missing S Jaylinn Hawkins (out) and CB T.J. Tampa (IR), against a man-heavy, blitz-heavy look (BAL BLZ% 31.3). Roughly a 24-22 BAL game. **Huntley starts (3rd straight):** BAL scored 30 at ATL and 10 at CLE with him; a lower-variance run-first script in the high teens or low 20s, and CIN rested off a W6 bye wins the possession battle. Roughly CIN 23-20.
[Source: team_dossiers CIN.md/BAL.md built 2026-10-22T22:58Z; secondary_matchups; qb_operator_notes]

## QB / availability
- **Lamar Jackson: QUESTIONABLE** (left high-ankle sprain; limited Wed/Thu/Fri; Minter "still being evaluated"; Rotowire: "potential game-time decision"). Missed W5 and W6. Andy-confirmed note: decision Sat/Sun, may be held to 11:30 ET inactives (08:30 PT). [Source: qb_operator_notes; news_notes Rotowire 2026-10-23T19:50Z, ESPN 2026-10-23T19:59Z]
- **If OUT → Tyler Huntley** starts (Ryan Mink, Ravens official site, 2026-10-23T23:25Z). Skylar Thompson to IR (FantasyPros 2026-10-24T01:20Z), so the QB2 behind the starter is thin.
- **If IN:** likely limited mobility. The run-threat discount matters more than the passing discount.
- **Official Friday report (web, ESPN page mirror modified 2026-10-23 20:28 ET):** BAL: Lamar Jackson Q, DT Broderick Washington Jr. Q (ankle), S Jaylinn Hawkins OUT (knee), LB Tavius Robinson OUT (pectoral, season). CIN: no game designations listed; IR only (TE Tanner Hudson, LB Swayze Bozeman, CB Jalen Davis, WR Andrei Iosivas, OT Brian Parker II). S Kyle Dugger (CIN, Q in the 10/22 dossier) was a full participant Thursday and is not on the Friday list. [Source: surprisesports.com/scores/nfl/bengals-vs-ravens-401873012 (ESPN feed); availability.BAL]
- BAL returns: G Andrew Vorhees, WR Rashod Bateman and TE Matt Hibner were full on Thursday.

## Market
- **Spread:** AN open BAL -3 (-103), Sun 10/18 → BKR BAL -1 / CIN +1 -113 (Andy paste ~11:40 PT Fri; BKR board re-captured 2026-10-23T20:11Z, identical numbers). **2.0 points of movement toward CIN, through 3, 2.5 and 1.5.** The market is pricing a meaningful chance that Lamar sits.
- **Contest line:** BAL -2.5 (captured 2026-10-22T15:03Z), 1.5 pts better for CIN than BKR.
- **Total:** AN open 50.5 → BKR 48.5 (o-109/u-107). Caesars reported sharp Under 51 early in the week [Source: news_notes, @PatrickE_Vegas 2026-10-22].
- **ML:** AN open CIN +133 / BAL -161 → BKR CIN -102 / BAL -111. DK Predictions (reference only): BAL 51% / CIN 50%; CIN -1.5 at 49%.
- **Splits (Action Network, 2026-10-23T19:40Z):** spread CIN 72% bets / 78% money (6-pt gap, below flag). **ML: CIN 42% bets / 64% money, a 22-pt gap. Sharp flag on CIN ML.** Total: Over 36% bets / 41% money (5-pt tilt toward the over in money; no flag).

## Quantitative
- Power: CIN SRS 4.6 (#7), model #8; BAL SRS 0.68 (#15), model #11. Market-implied win totals: BAL 11.26 (#7), CIN 10.81 (#9). The market rates BAL higher than the model does (delta +0.37). [Source: power_ratings]
- Efficiency (nflverse through W6): BAL off EPA/play 0.120 (#6), def 0.004 (#18); CIN off 0.074 (#9), def -0.029 (#14). BAL's season numbers include ~10 quarters of Huntley.
- FTN: CIN pass DVOA 30.2%, sack rate 8.5% generated (pressure-driven defense). Under pressure CIN allows 4.0 YPA (Hribar). BAL pass-pro allows UPRES 43.9%, and Lamar's pressured EPA/DB is -0.261. A hobbled Lamar raises the CIN pass-rush leverage. [Source: ftn_team_context_selector via dossiers, generated 2026-10-20; article_notes Sharp worksheet]
- Secondary matchups: BAL D vulnerability tier medium (Hawkins out → te_middle/slot boost; Ja'Marr Chase opportunity score 9). CIN D medium (slot CB Jalen Davis IR → slot/seam boost for Zay Flowers and Mark Andrews). Coach names in those notes are ignored as stale.
- Weather: 63°F, 0% precipitation, wind 3 mph. No flag.

**Adjustments (home-positive):** margin -0.8 vs BKR -1 (blend: Lamar-in view BAL -2 at ~60% / Huntley view CIN -2.5 at ~40% → BAL -0.2; plus CIN bye-rest edge, BAL S/LB losses, offset by Lamar's 11-2 SU record vs CIN). Total -1.4 (Huntley scenario ~45, hobbled Lamar ~48.5; 60/40 blend 47.1).

| Run | Line | Adj (m/t) | BAL cover | CIN cover | Push | Over | Under | BAL win excl tie |
|---|---|---|---|---|---|---|---|---|
| Baseline BKR | -1 / 48.5 | 0 / 0 | 48.8% | 48.8% | 2.4% | 50.0% | 50.0% | 51.2% |
| **Adjusted BKR** | -1 / 48.5 | -0.8 / -1.4 | 46.7% | **50.9%** (52.1% excl push) | 2.4% | 45.8% | **54.2%** | 49.1% |
| Baseline contest | -2.5 | 0 | 50.0% | 50.0% | 0 | — | — | 54.9% |
| **Adjusted contest** | -2.5 | -2.3 / -1.4 | 44.0% | **56.0%** | 0 | 45.8% | 54.2% | 48.8% |
| Scenario: Lamar in | -1 | +1.0 / 0 | 52.7% excl push | 47.3% | 2.4% | 50.0% | 50.0% | 53.8% |
| Scenario: Huntley (capped) | -1 | -3.0 / -3.0 | 42.0% excl push | 58.0% | 2.4% | 41.0% | 59.0% | 43.4% |

The Huntley scenario's view (BAL +2.5 = -3.5 vs line) exceeds the 3.0 hard cap, so it was capped. The contest adjustment (-2.3) is above the 2.0 soft cap; that is justified because it is the same view measured against a stale, 1.5-pt-wider locked line.

## Expert / podcast / article agreement
- **CIN side:** Ross Tucker and Steve Fezzik (same episode, so one opinion: "Best Bet", CIN +3, 2u); Simon Hunter (CIN +3/+3.5); Action Network (CIN +2.5); Steve Makinen/VSiN (CIN -1.5 Best Bet, 2026-10-22); John Ewing (division dogs 20-8 ATS, Bet Labs trend); FATBOSS rest-advantage trend (CIN listed). **Repriced:** most CIN leads were placed at +2.5 to +3.5; BKR is now +1, so 1.5–2.5 pts of their value is gone. Makinen's CIN -1.5 is still better than the market (BKR has CIN as roughly a pick'em).
- **BAL side:** PFT (BAL 28-24); Sharp Football's Hribar notes BAL 11-2 vs CIN with Lamar starting and a shootout history (41-38, 35-34 in 2024).
- Total: PFT 52 (over) vs Caesars sharp Under 51. ESPN preview has no extractable pick. The article_selections row is a Makinen MIN/IND string carrying a CIN fragment; only the CIN -1.5 piece is used (duplicated row).

## Counter-case
- **CIN ML / spread:** if Lamar plays at even 80%, BAL is the better roster at home (opener -3), and the move to -1 has overshot. BAL's 11-2 record vs CIN with Lamar is the strongest single prior on the board. Hendrickson's revenge spot against a CIN line that has struggled on the edge.
- **Under:** Lamar active plus the rivalry's shootout history (two 70+ games in 2024), perfect weather, a BAL secondary down Hawkins against Chase, and over money at 41% vs 36% bets. Both offenses rank top-10 in EPA.
- **SC CIN +2.5:** a healthy-enough Lamar makes BAL -2.5 roughly fair, and a BAL 3-point win (the most common margin, ~16%) beats us.

## Ambiguity / missing data
- Lamar probability (~60% plays) is my estimate from limited-all-week plus "game-time decision" reporting; no injury-model output exists in the packet.
- Packet `missing_inputs[]` is empty. Projected starters lack second-source depth reconciliation. CIN FTN team tables are stale by one week (through W5; CIN had a W6 bye, so nothing is lost).
- BKR team-total rows (24.5/24.5) are unparsed or unavailable; not used.
- The availability feed listed Kyle Dugger under CIN with a Baltimore radio source (known misclassification pattern). The Friday official list omits him, so he is treated as available.

## Pre-kickoff delta checklist
1. **Lamar ruled OUT (Sat or 08:30 PT inactives):** SC CIN +2.5 → A-; CIN ML → B (fair ~CIN -140; play to -125); Under → B if still ≥47.5; pool confidence → 6. Expect BKR to move to CIN -1.5/-2.5 quickly, so a Saturday OUT report is the time to act.
2. **Lamar announced active and full participant / no limitations:** CIN ML → PASS; Under → PASS; SC CIN +2.5 → C (still +EV vs fair BAL -2, but thin).
3. Price: BKR CIN +1.5 or better makes the spread a C play over the ML; total ≤47 → pass the under; CIN ML -110 or worse → pass.
4. BAL DT Broderick Washington Jr. inactive: small CIN run-game bump (no change to tiers).

## Gate notes
- Roster vet PASS (fresh); 1 UNVERIFIED item is not in this game's pick path.
- missing_inputs: none.
- QB status unresolved (Lamar Q): both scenarios presented; picks are blended and tiered C accordingly.
- Availability feed misclassification noted (Dugger team tag); verified against the Friday report via web.
- Secondary-matchup coverage notes carry stale DC names ("Orr", "Anarumo"), which are ignored; dossier HCs (Zac Taylor, Jesse Minter) are authoritative.
- Kickoff not passed; forward picks valid.

Sources: packet `scratch/w07-game-synthesis-queue-sides.json` (CIN@BAL, built 2026-10-24T01:26Z); `data/generated/props/bookmaker-gamelines-2026-10-23-week7.raw.txt`; `data/generated/props/bookmaker-live-2026-10-23-bengals-at-ravens.json` (20:11Z); `data/generated/props/draftkings-predictions-live-2026-10-23-bengals-at-ravens.json` (19:10Z, reference); `data/generated/team-dossiers/2026-w07/{CIN,BAL}.md`; `scripts/intel/margin-simulator.mjs` (selftest PASS); web: surprisesports.com ESPN injury mirror (mod. 2026-10-23 20:28 ET), si.com Lamar odds article (2026-10-20).
