# LV @ NYJ — Week 8 game synthesis, pass `props`

- As-of: Fri 2026-10-30 ~11:35 PM PT (2026-10-31T06:35Z) · Kickoff: Sun 11/1 10:00 AM PT (MetLife, outdoors) · Inactives ~8:30 AM PT Sun
- Packet built_at: 2026-10-31T06:09:18Z (scratch/w08-game-synthesis-queue-props.json) · roster_vet: PASS (8.5 h, 2 UNVERIFIED league-wide; none in this game)
- Prop board: BKR per-game file `data/generated/props/bookmaker-live-2026-10-31-raiders-at-jets.json`, capturedAt **2026-10-31T01:50:37Z** (Fri 6:50 PM PT), 439 rows. BetOnline board has game specials only (no player props). DraftKings Predictions: reference only.
- Built on the sides synthesis (reports/intel/games/2026-w08-game-LV_at_NYJ-sides.md): spread/total/ML PASS, fair NYJ -1.75, total 45.5–46, LV can't run, Cousins throws often into a depleted Jets pass rush.

## Recommendation box (all BKR, capturedAt 2026-10-31T01:50:37Z)

| # | Player | Market | Pick | Price | Basis (nflverse W1–7 / FTN) | Tier | Playable to | Parlay leg |
|---|---|---|---|---|---|---|---|---|
| 1 | Brock Bowers (LV TE) | Rec yds | **o68.5** | -109 | 116/86/110/70/73 in 5 games (avg 91, 5/5 over); 10.4 tgt/g, TGT/RTE 24.6%; NYJ shell weak to TE-middle | **B** | o74.5 | y |
| 2 | Ashton Jeanty (LV RB) | Rec yds | **o27.5** | -110 | 45/15/37/68/50/36/61 (6/7 over, avg 45); 6.4 tgt/g, 26% TGT/RTE | **B** | o31.5 | y |
| 3 | Ashton Jeanty | Carries | **u13.5** | +103 | Carries 23/21/19/15/10/10/8: three straight at 10 or fewer; Washington Jr took 9 and 6 in W6–7; LV rush EPA -0.255 | **B** | u12.5 at -115 | y |
| 4 | Kirk Cousins (LV QB) | Pass yds | **o239.5** | -107 | 160/253/248/365/243/313/295 (6/7 over, avg 268); 36.7 att/g; NYJ missing Ossai, Sweat, likely Bailey | **B** | o249.5 | y |
| 5 | Ashton Jeanty | Rush yds | u49.5 | -106 | Last 4: 58/27/22/15; 3.1 YPC; correlated with #3 (use one) | C | u44.5 | n (dup of #3) |
| 6 | Kirk Cousins | Pass TDs | o1.5 | -109 | 2+ TD in 6/7; only 3 LV rush TDs all year, so LV scores through the air; NYJ allows 1.6 pass TD/g | C | o1.5 at -125 | n |
| 7 | Omar Cooper Jr. (NYJ WR) | Rec yds | o41.5 | -110 | 103 and 115 the last two weeks (12 tgt); 3-game sample | C | o45.5 | n |
| 8 | Geno Smith (NYJ QB) | Pass yds | o225.5 | -108 | 232 avg, 252/287 the last two; LV allows 245 pass yd/g, 6.5 YPP last 4 | C | o230.5 | n |

Passed: **Garrett Wilson rec yds o65.5 -118** (Erickson's o59.5 has moved 6 yards; 44 and 26 the last two weeks; playable only at 60.5 or lower). **Tre Tucker o48.5** (median 44 with Bowers active; the 97 and 103 the last two weeks are a real counter). **Mason Taylor o22.5 -109** is a lean only (24/33/62, rising role). No BKR QB INT legs for SGPs.

**7e Anytime-TD candidates (BKR atd_1_plus):** 1) Brock Bowers +100 (B; TD in 3/5; DK ref +122) · 2) Tre Tucker +228 (C+; TD in 3/7 including W6 and W7; DK +257) · 3) Garrett Wilson +180 (C; 3/7) · 4) Omar Cooper Jr. +222 (C; TD in both of the last 2) · 5) Ashton Jeanty -107 (C; 3/7 games, price is short) · 6) Mason Taylor +337 (C; 2 TD in W7) · 7) Braelon Allen -126 **only if Breece Hall is inactive** (C; 2 TD in 7). BKR prices Hall and Allen identically (-126 / +481 FTD), which looks like a placeholder: recheck after inactives.

**8a First-TD candidates (BKR first_td):** Bowers +660 (top), Jeanty +597, Tucker +987, Wilson +798, Allen +481 (only if Hall is out). Lean is toward LV scoring first: Glenn's Jets are 4-17-3 in first halves, opponents average 15.5 first-half points, and Geno is 16-6 to the 1H under [Source: packet an_primer, Evan Abrams 2026-10-30].

## Game script (from the sides pass)

A near pick'em (BKR NYJ -1 -115, 45.5; team totals LV 22.5, NYJ 23.5). LV cannot run (rush EPA/att -0.255, success 30.4%, DVOA -27%) and Jeanty's carries have collapsed. Kubiak's offense routes volume through Cousins (neutral pass rate 0.613), Bowers and Jeanty as a receiver. The Jets lose Ossai, Sweat and (Doubtful) Bailey up front, so Cousins should get clean pockets. That supports props 1–4. The Jets play slow and short (Geno aDOT 6.6), but LV's defense has allowed 3.25 pts/drive over its last four games, which supports a moderate Geno/Cooper over [Source: sides md; FTN via team dossiers; Hribar worksheet 10/28].

## QB / availability

- QBs: Kirk Cousins (LV), Geno Smith (NYJ) [Source: packet qb_operator_notes, scratch/w08-qb-confirmations-1030.md]. Neither QB is on an injury report.
- Official Friday report (raiders.com Week 8 report, also used in the sides pass; this pass's web search returned the same report): **LV** Out: DE Patrick Johnson, TE Carter Runyon; Q: WR Jack Bech, G/C Jackson Powers-Johnson. Bowers (calf) was limited Wednesday, full Thursday, and has no designation. **NYJ** Out: EDGE Joseph Ossai, OL Max Mitchell, DT T'Vondre Sweat; Doubtful: EDGE David Bailey; Q: RB Breece Hall (quad), OL Dylan Parham.
- Conflict: qb_operator_notes lists Bailey as OUT; the official report and the ESPN news note (10/30) say Doubtful. Either way, plan on no Bailey.
- **If Hall is out:** Allen (lead back for 4 games; 17-104 in W7) takes the RB TD equity and the ATD #7 becomes live. **If Hall is in:** drop Allen. BKR posted no NYJ RB yardage props.
- **If Bowers is a surprise inactive** (calf): void #1, upgrade Mayer/Tucker volume, and Cousins' yards drop to C.

## Market notes

- Every pick is priced on the BKR board at 01:50Z; game rows match the 6:52 PM PT paste (NYJ -1 -115, 45.5).
- Expert prices compared with BKR: Welsh (BettingPros) Jeanty rec yds o27.5 -114 → BKR 27.5 -110 (same number, better price; agrees with #2). Erickson Wilson o59.5 -115 → BKR 65.5 (6 yds worse → pass). Cody Brown's 22-leg FanDuel parlay legs (Bowers 60+, Jeanty 3+ rec, Tucker 20+) are alt lines and not comparable; they only confirm the direction [Source: packet youtube_picks_approved].
- Splits: 82% of tickets on LV and 78% of the money on the over; neither crosses the 10-point sharp flag [Source: packet splits, AN 2026-10-31T02:06Z].

## Expert agreement vs disagreement

- **Agree:** Chris Welsh (Jeanty rec yds over), Cody Brown (Bowers/Jeanty/Tucker alt overs), Andrew Erickson (Wilson over, but the number moved), PFF (Wilson "primed" vs LV, 10/30).
- **Disagree / caution:** BettingPros and PFT see a low total (under 44.5; 24-17), which cuts against the Geno over and Cousins TDs. Evan Abrams: Geno is 16-6 to the 1H under. ESPN (Rich Cimini, 10/28–29) on Wilson's frustration cut both ways: Glenn says "we want to get him the ball," but he caught 26 yards in W7.

## Counter-case

- **Bowers o68.5:** a calf injury mid-week, and the W6–7 trend (70, 73) is sliding toward the number. The NYJ secondary was good before injuries (pass D 203 yd/g, though against the 4th-easiest schedule). The coverage-note coach names are stale.
- **Jeanty rec o27.5 / carries u13.5:** if LV leads early, Jeanty gets clock-killing carries (up to 15) and check-downs drop. Sweat's absence opens the middle.
- **Cousins o239.5:** NYJ's slow pace (58.6 plays/g) caps LV's plays. W1 (160) shows the floor when the run works. A Jets pass rush with 19 sacks can still get home against an LV line with Powers-Johnson questionable.
- **Geno / Cooper overs:** a 1H-under QB, a 2-game sample for Cooper, and Wilson's pledged targets may come out of Cooper's share.

## Ambiguity / missing data

- missing_inputs: the BetOnline player-prop board is thin (26 rows, game specials only). Re-run Saturday ~2 PM; no BOL price is quoted here.
- BKR's identical Hall/Allen ATD and FTD prices look like a placeholder.
- No NYJ RB rush-yardage props are posted (Hall Q).
- The qb_operator_notes file is Claude-web-checked, not Andy-confirmed, and its Bailey OUT disagrees with the official Doubtful.
- Projections are simple game-log and usage bases, not a calibrated prop model. The simulator applies only to the spread and total.

## Pre-kickoff delta checklist

- Inactives (8:30 AM PT): Hall (decides Allen ATD #7), Bowers (#1, ATD #1), Powers-Johnson (pass protection for #4), Bech (target share).
- Price crossings: Bowers above 74.5 → pass; Jeanty rec above 31.5 → pass; carries line at 12.5 → only at -115 or better; Cousins above 249.5 → pass; Wilson down to 60.5 → tier C over.
- BetOnline Sunday props Saturday ~2 PM: shop #1–4 if better than BKR.
- Spread/total moves: NYJ -2.5 or a total of 47+ would change the script (more LV passing volume if trailing).

## Gate notes

1. missing_inputs: BetOnline props thin → no BOL picks; BKR is the only executable book.
2. roster_vet PASS (8.5 h). All named players were verified on espn-full-rosters-latest (LV: Bowers, Tucker, Jeanty, Mayer, Washington Jr.; NYJ: Wilson, Cooper Jr., M. Taylor, Allen, Hall).
3. Kickoff not passed.
4. Roles come from the packet, FTN usage and nflverse weekly (data/vault-seed/nflverse/player_stats_weekly.csv, W1–7). The `player-availability` feed has NYJ null.
5. The Hall Q scenario is written as if-in/if-out above.
6. One web search for the Friday report matched the raiders.com report already used in the sides pass.
7. Stale coach names in secondary_matchups were ignored.
