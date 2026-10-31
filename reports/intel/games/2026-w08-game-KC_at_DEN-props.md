# KC @ DEN: Week 8 game synthesis, pass `props`

As-of: Fri 2026-10-30 11:37 PM PT · Kickoff: Sun 11/1 1:25 PM PST (Empower Field, outdoors; DST ends Sunday) · Inactives ~11:55 AM PT Sun · Packet built 2026-10-31T06:09Z · roster_vet PASS (8.5h; 2 UNVERIFIED league-wide, none in this game)

Prices: Bookmaker per-game board, capturedAt **2026-10-31T01:52:11Z** (280 rows, 13 unavailable = all RJ Harvey rows) [Source: prop_boards.bookmaker.path]. The BetOnline board (10/29 23:11Z) has no player props, only specials and TD/FG totals. DraftKings Predictions (10/29 03:20Z, before Harvey was ruled out) is reference only.

## Recommendation box

| # | Player | Market | Line | Price | Book | capturedAt | Basis (2026 nflverse W1–W7) | Tier | parlay_leg_ok |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Bo Nix | Rush yds **UNDER** | 15.5 | -107 | BKR | 01:52Z | 3/9/7/10/10/3/75; 6 of 7 under, median 9 | **B** | y |
| 2 | Bo Nix | Completions **UNDER** | 20.5 | -104 | BKR | 01:52Z | 17/22/17/25/16/17/15; 5 of 7 under, W1 vs KC 17 | **B** | y |
| 3 | Kenneth Walker III | Rush yds **OVER** | 87.5 | -110 | BKR | 01:52Z | 173/117/70/177/128/36; 4 of 6 over, W1 vs DEN 23-173 | **B** | y |
| 4 | Patrick Mahomes | Completions **UNDER** | 20.5 | -113 | BKR | 01:52Z | 15/32/20/15/23/19; 4 of 6 under, W1 vs DEN 15 | C | y (small) |
| 5 | Xavier Worthy | Rec yds **UNDER** | 30.5 | -111 | BKR | 01:52Z | 18/25/20/70/73/11; 4 of 6 under, all without Rice | C | n |
| 6 | Evan Engram | Rec yds **UNDER** | 22.5 | -109 | BKR | 01:52Z | 43/17/0/6/55/13/2; 5 of 7 under; 39% snaps W7 | C (status-dependent: Waddle Q) | n |
| 7 | Emmett Johnson | Receptions **OVER** | 1.5 | +140 | BKR | 01:52Z | 2/2/0/1/2/2; 4 of 6 hit; break-even 41.7% | C | n |
| 8 | Noah Gray | Receptions **OVER** | 1.5 | +105 | BKR | 01:52Z | 1/0/3/2/3/3; 4 of 6, 4 of last 4 | C | n |

Hit rates are small-sample history, not model probabilities. No calibrated prop model exists [Source: data/nflverse/2026/play_by_play_2026.csv.gz, snap_counts_2026.csv, mtime 2026-10-30 04:45Z].

**7e Anytime-TD candidates (BKR, 01:52Z):** Kenneth Walker III -171 (B; 19 carries inside the 10, 8 TDs in 6 games, scored in 4 of 6) · J.K. Dobbins +190 (B; Denver's goal-line back with 8 of its 11 RB carries inside the 5, a TD in 3 straight games, and Harvey OUT) · Rashee Rice +210 (C; 4 red-zone targets in 3 games) · Travis Kelce +221 (C; Hufanga OUT opens the middle) · Courtland Sutton +209 (C; Denver's leader with 7 red-zone targets) · Jonah Coleman +160 (C-; lead back, but Dobbins gets the goal-line work) · Xavier Worthy +200 (alt). Jaylen Waddle +200 only if active (**Questionable**, status-dependent).

**8a First-TD candidates:** BKR has **no first-TD market on this board**, so there is no executable row. The DK Predictions prices below (10/28, reference only) are the board to recheck Saturday: Walker +376 (scored KC's first TD in 2 of the 5 games KC scored a TD), Dobbins +809 (scored DEN's first TD in W5 and W6), Kelce +809, Coleman +809. Rice is not listed on DK.

**PASS:** Coleman receiving (the experts' o8.5 was priced before Harvey was ruled out; BKR now has 22.5, a 14-yard worse number, and his receptions o2.5 is -152), Coleman rush 44.5, Dobbins rush 28.5, Rice 4.5 rec / 53.5 yds (first game back from a hamstring, snap count unknown), Kelce 44.5 (coin flip), both QBs' passing yards and pass TDs, Walker carries 19.5 (3 of 6 over).

## Game script (agrees with the sides synthesis)

The sides pass projects a low-40s or lower field-position game. KC is a small favorite (fair KC -1.4, total 39.7), the ML lean is KC, and the total leans under [Source: reports/intel/games/2026-w08-game-KC_at_DEN-sides.md]. In that script KC wins by leaning on Walker and short passes, and Denver's offense (25th in EPA, 29% three-and-out rate, 5.8 YPA) stalls. That points to Walker volume overs, Nix unders, and capped KC receiving yardage. The Week 1 meeting followed this pattern: KC ran 35-224 (Walker 23-173), Mahomes completed 15, and Nix went 17/28 for 131 [Source: pbp W1].

## QB / availability

Mahomes vs Nix, both confirmed [Source: scratch/w08-qb-confirmations-1030.md]. **Official Friday designations** [Source: confirmations file, corrected 11:45 PM; chiefs.com Week 8 injury report]: KC CB Sneed **Q**, CB Delane **Q**. DEN DL Zach Allen **Q**, S Brandon Jones **Q**, WR Waddle **Q** (chest, LP), LT Bolles **Q**. **OUT:** DEN RB RJ Harvey (knee), DEN S Hufanga (marked "unverified vs official" in the confirmations file). Rice will play, and Kelce has no designation [Source: news_notes ESPN/Rotowire 10/30]. None of the 8 picks is on a Questionable player, but several depend on Q players:
- **Waddle out:** Engram under → PASS (more TE targets), Nix completions under stays.
- **Sneed and Delane both out:** Nix completions under drops to C.
- **Zach Allen active:** small hit to Walker over (still B). Allen and B. Jones both out → Walker over and Kelce ATD get a bump.
- Harvey out leaves Coleman as the lead back (49% of snaps in W7 with Harvey at 26%), with Dobbins (23%) still getting the goal-line carries [Source: snap_counts W7; pbp inside-5 carries].

## Market

The BKR board posts DEN at 19.5 (o -121) and KC at 20.5 (u -110), against a game total of 40.5 (u -110). BetOnline TD total is 4.5 (u -130) [Source: betonline-live-2026-10-29]. AN open was 42 and the line has since fallen 1.5, with Caesars sharp money on under 41.5 [Source: sides synthesis; news_notes @PatrickE_Vegas]. Splits: sharp money flag on DEN spread and ML. Over has 77% of tickets but the line moved down, so the movement is reverse line movement toward the under. The low game total and the cheap DEN TT over both fit "Denver scores some, but not through the air." BKR shades ATD favorites: Walker is -171 at BKR vs -127 on DK, and Dobbins is +190 vs +233.

## Quantitative

- DEN D allowed 133 rush yds/g (933 over 7 games) [Source: FTN team-defense/overview via DEN.md]. By game: 224/95/116/142/155/113/94 [Source: pbp]. Rush DVOA -11.2% says the unit is better than that raw total.
- KC D allowed 17/22/20/31/22/20 completions [Source: pbp]. KC sacks 3.0% and pressure 36.8% → few Nix scramble triggers [Source: KC.md FTN pass-rush].
- Nix aDOT 5.7, YPA 5.8, CPOE -2.6%. Harvey (25 catches on 28 targets) was his highest-percentage outlet and is OUT [Source: DEN.md FTN; pbp].
- Snaps W7: Worthy 87%, Kelce 83%, Walker 74%, Gray 53%, E. Johnson 26%. Sutton 70%, Waddle 56%, Coleman 49%, Engram 39% [Source: snap_counts].
- Simulator (game-level, re-run from the sides inputs: DEN +1, 40.5, margin -0.4, total -0.8; selftest all PASS): KC cover 51.1%, under 52.4%. This is context only and does not price any prop.

## Expert / podcast / article agreement

- **Coleman o8.5 rec yds:** Warren Sharp (YouTube + pull = one opinion) and Brandon Anderson (AN, plus 15+/20+ escalators). Both were priced before Harvey was ruled out. At 22.5 the market has absorbed the role change → PASS, and there is no expert pick at this number.
- **Under / low scoring:** Sharp Football KC TT u20.5, BettingPros u42.5, Even Money u41.5, Caesars sharp u41.5. AN primer: Payton 7-0 to the under vs Reid, KC 10-0 to the under off a loss, DEN 4-0 to the under with Blakeman, DEN 1H under 18-8 [Source: an_primer, 2026-10-30]. These support the QB unders and the Worthy under.
- **Against:** No expert player-prop picks in the packet back any of picks 1–8, so they rest on usage data. Simon Hunter's DEN thesis ("personnel to exploit KC's thin WR group") and Abrams' note that "Vance Joseph has contained Mahomes" both fit Mahomes/Worthy unders. Nobody in the packet argues for a big Walker game, and ESPN's preview asks "Can the Broncos slow Walker?" [Source: news_notes ESPN 10/30].

## Counter-case

1. **Nix rush u15.5:** He ran for 75 in W7, and Payton calls designed QB runs in the red zone (Nix has 4 carries inside the 10). One scramble on third-and-long breaks it.
2. **Nix cmp u20.5:** KC's pass D DVOA is 14% (soft), and both KC corners are Q. If DEN trails, Nix throws 40+ times (42 att in W4 → 25 cmp).
3. **Walker o87.5:** DEN's rush DVOA is good, Allen may return, and Walker had 14-36 at SEA when KC trailed. A DEN lead kills his volume.
4. **Mahomes cmp u20.5:** Rice's return adds a high-catch-rate slot, and KC went 32 completions vs IND.
5. **Worthy u30.5:** DEN may be without both safeties (Hufanga OUT, B. Jones Q), and Worthy had 70 and 73 in two of his last three games. One deep ball covers.
6. **Engram u22.5:** With Harvey out (and Waddle Q), short targets get redistributed toward the TEs.
7. **E. Johnson o1.5 rec:** Rice's return and Walker's role could push him to 0–1 targets (W3, W4).
8. **Gray o1.5 rec:** Rice returning eats middle targets, and Gray had 0–1 catches in W1–W2 when Rice played.

## Ambiguity / missing data

- missing_inputs: BetOnline player-prop board thin/missing (32 rows, no player props). The BOL comparison is capped, and the board needs a re-run Saturday ~2 PM.
- No BKR first-TD market. DK first-TD prices predate the Harvey news.
- Hufanga OUT is "unverified vs official report" in the confirmations file. The official status of Bolles/Allen/Jones is Q.
- The secondary_matchups block lists no KC secondary absences and carries coach names. The coach names were ignored (rule 7).
- Rice's snap share in his first game back is unknown, and it affects picks 4, 5 and 8.

## Pre-kickoff delta checklist

1. Inactives 11:55 AM PT. If Waddle is OUT → Engram under PASS. If Sneed and Delane are both OUT → Nix cmp under to C. If Allen and B. Jones are both OUT → Walker over stays B and Kelce ATD goes to B-.
2. Prices: Nix rush under playable to 13.5 (PASS at 12.5 or -125). Nix cmp under playable to 19.5 -120. Walker over playable to 92.5 (PASS at 95.5). Mahomes cmp under playable at 20.5 to -120 (PASS at 19.5). Worthy under playable to 27.5. Engram under playable to 19.5. E. Johnson o1.5 needs +120 or better. Gray o1.5 needs -110 or better.
3. Re-pull BetOnline props Saturday ~2 PM PT and look for better numbers on picks 1–3. Capture a BKR first-TD board if one posts.
4. If the game total moves to 42 or higher (an over move), downgrade picks 2, 4 and 5 one tier.

## Gate notes

- missing_inputs[]: BetOnline props thin. That caps BOL comparisons only, and all picks are priced on BKR. roster_vet PASS (8.5h). Kickoff not passed.
- Designations follow the official Friday report (Q, not OUT) via scratch/w08-qb-confirmations-1030.md. The web check found the chiefs.com Week 8 injury report ([chiefs.com](https://www.chiefs.com/news/week-8-injury-report-chiefs-vs-broncos-2026)), and the sides pass already verified it.
- The roster gate was not rerun (per the rule). No props are on UNVERIFIED players. Harvey rows are unavailable on BKR → excluded.
- Props are history- and usage-based. No model probabilities are claimed. Picks 1/2/3/4 are positively correlated (a KC-control script) and are not independent legs for an SGP. No BKR QB INT legs were used.
