# BAL @ BUF — Week 8 2026 — pass: props

- As of: Fri 2026-10-30 ~11:35 PM PT (2026-10-31T06:35Z)
- Kickoff: Sun 11/1 10:00 AM PT (18:00Z), Highmark Stadium (outdoor). Inactives ~8:30 AM PT Sunday.
- Packet built: 2026-10-31T06:09:18Z (scratch/w08-game-synthesis-queue-props.json) · roster_vet: PASS (8.5h, 2 UNVERIFIED league-wide, none in this game)
- Executable board: Bookmaker per-game file `data/generated/props/bookmaker-live-2026-10-31-ravens-at-bills.json`, capturedAt **2026-10-31T01:51:10Z** (602 rows). BetOnline has game lines only (6 rows, 2026-10-29T23:10Z). DraftKings Predictions (2026-10-29T03:20Z) is reference only.

## Recommendation box

| # | Player | Market | Line | Price | Book | capturedAt | Basis | Tier | parlay_leg_ok |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Zay Flowers (BAL) | Rec yds **Over** | 84.5 | -108 | BKR | 01:51Z 10/31 | 6 GP: 101 yd/g, 26.6% TGT share, YPRR 3.32; with Lamar 150/84/118; BUF allows 299 pass yd/g | **B** | Y |
| 2 | Lamar Jackson (BAL) | Pass TD **Over** | 1.5 | -102 | BKR | 01:51Z | 6 TD in 3.5 starts; BUF allowed 15 pass TD in 6 games; CJGJ out, 2 CB on IR | **B** | Y |
| 3 | James Cook III (BUF) | Rush yds **Over** | 83.5 | -109 | BKR | 01:51Z | 104.5 yd/g, 5.4 YPC, 4/6 over 83.5; favored-script volume; BAL light box 37% (5.2 YPC to RBs) | **B** | Y |
| 4 | Lamar Jackson (BAL) | Pass yds **Over** | 237.5 | -108 | BKR | 01:51Z | 10.1 YPA; BUF pass D EPA/DB 0.234 (bad); trailing script forces volume | C | N (correlated with #2) |
| 5 | Keon Coleman (BUF) | Rec yds **Over** | 30.5 | -108 | BKR | 01:51Z | 49 yd/g, 4/6 over 30.5, 3 TD; DJ Moore (shoulder) Q | C | N |
| 6 | DJ Moore (BUF) | Rec yds **Under** | 55.5 | -108 | BKR | 01:51Z | AC-joint shoulder, missed W5-W6; 33.9% snap share in 4 GP; 2 of 4 games under 12 yds | C | N |
| 7 | Mark Andrews (BAL) | Rec yds **Under** | 28.5 | -108 | BKR | 01:51Z | Under in 5 straight; YPRR 1.15, aDOT 6.8, 0% explosive | C | N |
| — | Lamar Jackson rush yds 25.5 | PASS | | o -104 / u -111 | BKR | | Two-way: ankle dip vs career rushing | PASS | — |
| — | Derrick Henry rush yds 78.5 | PASS | | -111 / -104 | BKR | | BUF run D DVOA -8.4% vs Henry 93.5 yd/g with Lamar | PASS | — |

No model probabilities: props have no calibrated joint model. Prices are BKR at capture; re-check before acting.

**7e Anytime-TD candidates (BKR atd_1_plus):** 1. **Josh Allen -171** (8 rush TD in 6 games, a rush TD in 5 of 6; tier B) · 2. **Derrick Henry -267** (TD in all 4 Lamar starts, 7 total; short price, safest leg) · 3. **James Cook -171** (6 TD, TD in 5 of 6; Prop Guru backs it) · 4. **Zay Flowers +125** (3 TD, alpha target vs depleted secondary) · 5. Dalton Kincaid +170 (only if active) · 6. Keon Coleman +250 (3 TD on 19 catches) · 7. Mark Andrews +202 (red-zone role). DK Predictions reference: Henry -233, Cook -163, Allen -156, Flowers +163.

**8a First-TD candidates (BKR first_td):** **Derrick Henry +489** (BAL 4-0 1H ATS with Lamar and the NFL's best 1H team, +65), **James Cook +496**, **Josh Allen +527**, value shot **Zay Flowers +987**.

## Game script (agrees with the sides pass)

The sides pass has BAL +3 (C), **Over 55 (B)**, BUF to win straight up (58.9%), and a fair line of BUF -2.5 / 56 [Source: reports/intel/games/2026-w08-game-BAL_at_BUF-sides.md, 2026-10-31T06:25Z]. Expected shape: Lamar's offense starts fast (BAL 4-0 1H SU/ATS in his starts [Source: an_primer W8_custom_1793124435108]), then BUF's rested offense controls the second half. That points to BAL passing volume (Flowers, Lamar TDs), Cook carries late with a lead, and a high TD count. Props 1–3 all fit an Over 55 script. If the game goes Under, #1, #2 and #4 lose together.

## QB / availability

- **Lamar Jackson: cleared, will play** (Minter, Fri 10/30) [Source: qb_operator_notes; availability ESPN 2026-10-30T17:36Z]. **If Lamar is inactive → Tyler Huntley**: void every Lamar prop, drop Flowers to C (Huntley games: 53/66/137), and move to Henry/BUF overs.
- **BUF Questionable:** DJ Moore (shoulder; Andy note: expected to play), Dalton Kincaid (chest; expected), RT Spencer Brown, nickel Dee Alford, DT Greg Gaines, LB TJ Parker. **Out:** S C.J. Gardner-Johnson (suspension), WR Tyrell Shavers [Source: qb_operator_notes; availability BUF; news_notes ESPN 2026-10-30T18:56Z].
- **BAL Out:** G Vega Ioane, S Jaylinn Hawkins. RB Adam Randall Q. Kyle Hamilton has no designation [Source: availability BAL].
- Note that the BKR board lists BUF RB "Re'Mahn Davis" (Ray Davis in the feed); no pick on him.

## Market / board

- Game: BAL +3 -105 / BUF -3 -111, o55 -101 / u55 -115, 1H BUF -1.5 / 27, team-total 1H BAL o12.5 -121 [Source: BKR board 01:51Z].
- Analyst numbers were priced earlier: Flowers o80.5 (Brandon Anderson) and o81.5 -115 (Chris Welsh, BettingPros) are now **84.5**, so 3–4 yards of value are gone. Anderson's Lamar o25.5 rush is still 25.5 (BKR o -104).
- Splits: sharp money on BAL spread (38% money vs 57% bets on BUF) and on the Over (83% money / 51% bets) [Source: splits AN 2026-10-31T02:06Z]. Both support the BAL passing overs.

## Quantitative basis

- nflverse weekly through W7 [Source: data/vault-seed/nflverse/player_stats_weekly.csv]: Flowers 150, 84, 118 (Lamar), 53, 66, 137 (Huntley). Lamar pass TD 1, 1, 2, 2 (W4 partial); pass yds 324, 235, 186, 222. Cook rush 57, 135, 154, 75, 111, 95. Coleman rec yds 1, 63, 37, 116, 7, 59. Moore 100, 0, 67, 11. Andrews 49, 49, 24, 27, 28, 4, 23. Allen rush TD 2, 2, 2, 1, 1, 0.
- FTN [Source: ftn-stats-iq-weekly-synthesis-context-latest.json; BUF stale_1wk]: BUF defense pass DVOA 27.3%, EPA/DB 0.234, OPEN% 61.9%, 1,792 pass yds and 15 pass TD allowed in 6; rush D DVOA -8.4% (good). BAL rush D DVOA -10.5%.
- Secondary matchups: BAL offense vs BUF tags slot_wr_boost / te_middle_boost / underneath_volume_boost; Flowers is the alpha target [Source: secondary_matchups W8].
- Sim (context only, sides): BKR -3/55 adjusted (-0.5, +1.0) → mean total 56.0, Over 53.1% excl push; selftest passed [Source: scripts/intel/margin-simulator.mjs, run 06:32Z].

## Expert agreement / disagreement

- **For:** Brandon Anderson (Flowers o80.5, Lamar o25.5 rush, Allen 2+ rush TD +350, Lamar 40+ rush +250, Cuevas longest catch, Allen 10+ carries); Chris Welsh (Flowers o81.5: "every WR1 facing Buffalo has hit"); The Prop Guru (Cook ATD); Sal Bets (Moore ATD); Cody Brown alt ladders (Allen 200+ pass, Flowers 50+, Cook 50+); Sharp Football Bills team total o28.5.
- **Against / caution:** Rich Hribar (Lamar didn't run late last year after an ankle return); SportMD expects a "mild dip in rushing". No named expert takes an under on Flowers or Cook.
- Data flag: the Anderson "235 receiving yards per game with Lamar" rationale is a transcription error. The real number is about 117 per game.

## Counter-cases

1. **Flowers o84.5**: BUF plays zone-heavy two-high (Cover 4/6), which caps deep shots. A Henry-heavy plan with Lamar's ankle limited could cut BAL's passes to 20 (W3/W4 levels), and he went 84 in one of those.
2. **Lamar o1.5 TD**: Henry steals the red-zone TDs (7 rush TD), and Lamar threw 1 TD in 2 of 4 starts.
3. **Cook o83.5**: BAL run D is top-10 by DVOA and Allen's under-center play-action volume can shift touches. Cook had 12–13 carries in 2 of 6 games.
4. **Lamar o237.5**: 1 of 3 full starts over (324). BAL's passing rate is 55%.
5. **Coleman o30.5**: A healthy Moore takes snaps, and Coleman had 1 and 7 yards in two games.
6. **Moore u55.5**: He went 100 and 67 when healthy, and BAL has two safeties out.
7. **Andrews u28.5**: Lamar's return (49, 49 in W1–W2) and the TE-middle boost with CJGJ out.

## Ambiguity / missing data

- missing_inputs: **BetOnline player-prop board thin (6 rows)**. Every pick is BKR-only and capped where noted. Re-run Saturday ~2 PM.
- Friday final injury reports: one web search returned no W8 Friday report (only W3/W6 Moore items, one noting an AC-joint sprain). Packet 10/30 items used.
- BUF HC conflict (dossier McDermott vs AN primer and PFT naming Joe Brady) does not affect props.
- Lamar W4 was a partial game (Huntley 9 attempts), so his per-start averages understate a full game.

## Pre-kickoff delta checklist

1. Lamar inactive → void Lamar props; Flowers to C; add Henry o78.5 lean.
2. DJ Moore inactive → Moore under voids; Coleman to B; Shakir/Kincaid targets up.
3. Kincaid inactive → drop him from ATD; small Coleman/Shakir bump.
4. Flowers moves to 89.5+ → pass. Cook to 88.5+ → C. Lamar TD o1.5 at -125 or worse → C.
5. Total drops below 54 → downgrade #1, #2 and #4 one tier.
6. Dee Alford out → Flowers (slot) to B+.

## Gate notes

- missing_inputs: BetOnline prop board thin. Noted, so all picks are single-book (BKR).
- roster_vet PASS (8.5h). Kickoff not passed.
- Player status from qb_operator_notes, then the availability feed. No team/role stated from memory.
- One Friday-injury web search done; nothing usable for W8.
- No BKR QB INT legs used. DK Predictions used as reference only.
