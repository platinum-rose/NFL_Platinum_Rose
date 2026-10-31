# KC @ DEN — Week 8 game synthesis, pass `sides`

As-of: Fri 2026-10-30 11:25 PM PT · Kickoff: Sun 11/1 1:25 PM PT (Empower Field, outdoors) · Inactives ~11:55 AM PT Sun · Packet built 2026-10-31T06:09:16Z · roster_vet PASS (roster age 8.5h, 2 UNVERIFIED league-wide, none used here)

## Recommendation box

- **SPREAD: PASS** (lean KC -1 -107 BKR) | tier PASS | fair KC -1.4 | edge 0.4 pts on KC | playable KC to -1 -110; DEN becomes a C look only at +2.5 or better
- **TOTAL: PASS** (lean UNDER 40.5 -110 BKR) | tier PASS | fair 39.7 | edge 0.8 pts under (sim under 52.4% = break-even at -110) | becomes UNDER tier C at 41 -110, tier B at 41.5+
- **MONEYLINE/SU: KC -113 BKR** | tier C | fair KC -121 (54.7% excl. tie) | +1.6 pp over break-even 53.1% | playable to -115; pass at -120 or worse
- **SuperContest:** contest line KC -1 (same as BKR) → not a candidate (n). If forced: KC.
- **Pool:** SU winner KC · confidence 3/16 (BUK BUK straight-up: KC, low conviction).
- Card fit: parlay_leg_ok **n** for spread/total (coin flips), ML KC only as a low-weight leg; standalone_preferred n.

Sources for prices: BKR paste 10/30 6:52 PM PT [Source: data/generated/props/bookmaker-gamelines-2026-10-31-week8.raw.txt] = BKR per-game board capturedAt 2026-10-31T01:52:11Z, identical numbers (KC -1 -107 / DEN +1 -109, o40.5 -105 / u40.5 -110, ML KC -113 / DEN +100) [Source: prop_boards.bookmaker.path]. BetOnline 10/29 4:11 PM PT: KC -1 -115, 40.5 -110 both, ML KC -120 / DEN +100 [Source: betonline-live-2026-10-29-chiefs-at-broncos.json].

## Game script

Two top-8 EPA defenses (KC #6, DEN #8) against one good offense (KC #7) and one poor one (DEN #25) [Source: team dossiers, nflverse through W7]. Denver's offense lives on short fields and defense: 29.1% three-and-out rate, 24.5 yds/drive vs KC's 11.1% and 36.9 [Source: FTN tempo via DEN.md/KC.md]. Expect a field-position game in the low 40s at most: Denver leans on Dobbins/Coleman with Harvey out, KC on Walker plus a returning Rashee Rice. Denver's pass rush (7.0% sack rate, 21 sacks) against KC protection that was rattled in a 3-20 loss at Seattle (213 yds) is the swing. The Week 1 meeting was KC 31-10 at Arrowhead (DEN 176 yds, 3.7 YPP) [Source: KC.md game log].

## QB / availability

QBs: Patrick Mahomes vs Bo Nix, both confirmed starters [Source: qb_operator_notes; scratch/w08-qb-confirmations-1030.md]. Mahomes is on the report (knee, full practice, no designation) [Source: chiefs.com Week 8 injury report, Fri 10/30].

**Designation conflict, so here are both scenarios.** The operator notes list KC CB Mansoor Delane OUT, CB L'Jarius Sneed OUT, DEN DL Zach Allen OUT, S Brandon Jones OUT. The official Friday report on chiefs.com lists Sneed (knee, LP) **Q**, Delane (shoulder, DNP) **Q**, Allen (hamstring, LP) **Q**, B. Jones (hamstring, LP) **Q**. The FantasyPros feed in the packet agrees with the official report. Confirmed OUT: DEN RB RJ Harvey (knee), DEN S Talanoa Hufanga (ankle), KC DT Omarr Norman-Lott (knee). Also Q: DEN WR Jaylen Waddle (chest, LP), DEN LT Garett Bolles (hip, LP), KC DE Mason Thomas (personal). Rashee Rice (hamstring) and Travis Kelce (ankle) have no designation and will play [Source: news_notes ESPN/Rotowire 10/30].
- If DEN is without both safeties plus Allen, the edge tilts to KC (deep and middle-of-field targets: Rice, Kelce, Worthy) [Source: secondary_matchups DEN-def severity 3.53 "medium", needs human review]. That supports the KC lean and pulls the under lean toward neutral.
- If both KC corners are out, Denver's limited pass game gets help, but only if Waddle plays. If Waddle and Bolles are both out, DEN's offense drops another notch.
- The 11:55 AM PT inactives settle all of this.

## Market

- AN open (Sun 10/25): KC -1.5, total 42.0 (primer lists 42.5), ML KC -125 / DEN +104 → now KC -1, 40.5, KC -113 / DEN +100. The spread moved 0.5 toward DEN, the ML shortened by 12 cents, and the total fell 1.5 to 2 points [Source: market.an_opener; an_primer.game].
- Contest line KC -1 = BKR. No gap.
- AN splits 10/30 7:06 PM PT: spread KC 52% bets / 42-43% money, DEN 48% / 58% money → **+10 money gap on DEN (sharp flag DEN)**. ML DEN 33% bets / 44% money (+11, sharp flag DEN). Total over 77% bets / 73% money, no sharp gap, but the total *dropped* against 77% over tickets → reverse line movement to the under [Source: splits, captured 2026-10-31T02:06Z].
- Counter-signal: BetMGM had 81% of money on KC -1.5 [Source: news_notes, @johnewing 10/30]. Caesars reported sharp action on **Under 41.5** [Source: news_notes, @PatrickE_Vegas 10/29].
- Prediction markets (context only): KC division 62%, DEN 36%. Win-total medians KC 12.8, DEN 11.6 [Source: prediction_markets].

## Quantitative

| Metric | KC | DEN |
|---|---|---|
| SRS / rank | 3.77 / #9 | 0.81 / #15 |
| Net PPG | +6.7 | +0.4 |
| Pythag (delta) | .685 (+0.89) | .512 (+1.41, 4-0 one-score) |
| Model rank | #5 | #16 |
| EPA/play off / def | 0.105 / -0.048 | -0.049 / -0.044 |
| FTN off DVOA / def DVOA | 18.9% / -2.2% | -2.2% / -11.1% |

[Source: power_ratings; dossiers; FTN latest 2026-10-30T22:00Z]. The ratings imply about KC -2.5 to -3 at a neutral site, so about KC -1 to -1.5 in Denver. Denver's record outruns its point differential (+3), and the betting market rates DEN as #5 against the model's #16. That gap makes DEN the inflated side.

Simulator (`margin-simulator.mjs`, selftest all PASS):

| Run | home line | total | margin adj | total adj | KC cover (excl push) | Under | KC win (excl tie) |
|---|---|---|---|---|---|---|---|
| Baseline BKR | DEN +1 | 40.5 | 0 | 0 | 50.0% | 50.0% | 53.6% |
| Adjusted BKR | DEN +1 | 40.5 | -0.4 | -0.8 | 51.1% | 52.4% | 54.7% |
| SuperContest | DEN +1 (contest = BKR) | — | -0.4 | — | 51.1% | — | — |

Adjustments (home-positive): **margin -0.4** = power-rating/EPA gap and DEN's one-score luck, plus DEN missing Hufanga/Harvey (Allen, B. Jones Q); partly offset by sharp money on DEN and Denver's home record (17 of last 19 per Erickson). **Total -0.8** = Caesars sharp under plus reverse line movement against 77% over tickets, two top-8 defenses, and DEN's 29% three-and-out rate. Offsets: depleted DEN secondary, Rice return, and 18.8°C with 9 km/h wind at kickoff [Source: weather]. Break-evens are KC -107 = 51.7%, under -110 = 52.4%, ML -113 = 53.1%. Only the ML clears its break-even, and only barely.

## Expert / podcast / article agreement

**DEN side (picked at +1.5/+2, now +1, so 0.5 to 1 point worse):** Evan Abrams (Action Network, two YouTube shows = one opinion), Steve Fezzik (Ross Tucker), Simon Hunter (Sharp or Square, YouTube + pull = one opinion), Sean Koerner (DEN +1.5 ATS #5/26; his projection DEN +0.7 leaves only about 0.3 pts at +1), Even Money (+1.5), BettingPros article (+2), Andrew Erickson (DEN ML, Polymarket 48%), PFT (DEN 17-13). Stuckey's DEN teaser leg is not comparable to the full-game number.
**KC side:** Steve Makinen (VSiN, KC -1.5, now -1 = better price), BettingPros early KC ML -125 (now -113, better).
**Under:** BettingPros u42.5, Even Money u41.5, Sharp Football KC team total u20.5 (BKR KC TT 20.5, under -110), Caesars sharp u41.5. All got 1 to 2 better numbers than 40.5. No named over picks. The pick_signals row for John Ewing "O 11.5" is win-total movement, not this game → excluded.
**AN primer trends:** Under: Payton 7-0 under vs Reid; KC 17-4 under vs AFC West; KC 10-0 under off a loss; KC 16-3 under at totals ≤44; DEN 4-0 under with referee Clete Blakeman. DEN: home division dogs 23-10 ATS in 2026; Mahomes 0-4 ATS in Denver since 2021; Mahomes 0-9 ATS in November since 2024 (this kicks off Nov 1). KC: Mahomes 6-0 SU/ATS in road division games as a dog or a favorite of 3.5 or less; Bet Labs "Business Trip, Off Loss on Road" system on KC; teams off a multi-score loss 75-46-2 ATS next game [Source: an_primer, published 2026-10-30].

Read: the touts and trends lean DEN, and the numbers and price lean KC. With the line at -1, they roughly cancel.

## Counter-case

- **ML KC:** Denver is unbeaten at home (3-0), has 4-0 one-score wins, a 7.0% sack rate, and sharp ML money (+11 gap). KC scored 3 points last week, and ESPN coverage questions its receiver depth. Nix's teams are 23-2 SU when allowing ≤20.
- **Spread lean KC:** All of the above, plus the line moved toward DEN against a ticket majority on KC.
- **Total lean under:** DEN may be without both starting safeties plus Allen, Rice returns to a slot/middle-friendly matchup, Mile High altitude in mild weather, and the 40.5 number already absorbed the under move (it crossed 41).

## Ambiguity / missing data

- Operator OUT list vs official Friday Q on Delane, Sneed, Allen and B. Jones (see QB section).
- The dossiers show availability as "missing" (no ESPN status). The secondary_matchups block shows **no** KC secondary absences, which conflicts with both sources.
- AN opener total is 42.0 in the file and 42.5 in the primer.
- BetMGM's 81% of money on KC conflicts with AN's 58% of money on DEN. They are book-specific pools.
- No BKR capture newer than 6:52 PM PT.
- Coach names in the secondary_matchups notes were ignored per rule 7.

## Pre-kickoff delta checklist

1. Inactives 11:55 AM PT: if DEN's Allen **and** B. Jones are out, upgrade ML KC to C+ and spread KC -1 to tier C. If both KC CBs are out **and** Waddle plays, drop the KC ML to PASS.
2. Total reaches 41 or more → UNDER tier C. 41.5 or more → tier B. 39.5 or less → full pass.
3. Spread KC -1.5 → still PASS. DEN +2.5 or better → DEN tier C (division-dog plus sharp-money thesis).
4. KC ML -120 or worse → PASS.
5. Bolles out (DEN LT) → small under/KC bump.

## Gate notes

- missing_inputs[] empty. roster_vet PASS (8.5h). Kickoff not passed.
- Injury designations conflict between the operator notes and the official chiefs.com Friday report. Both scenarios are shown, and no pick depends on a single player.
- The availability feed has known misclassification. The KC secondary_absences list is empty in the secondary_matchups output.
- FTN in the dossiers is through W6 (stale_1wk). The packet FTN context is 2026-10-30T22:00Z.
- Expert picks were repriced to the current line; win-total tweets were excluded.
- This is one game only. No other game's output was read.
