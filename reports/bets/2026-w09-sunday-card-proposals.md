# Week 9 Sunday card: AI proposals (draft Fri 11/06 ~1:30 PM PT)

Inputs: slate packet (Fri 1:00 PM rebuild), Friday cadence (`logs/cadence-reports/2026-w09-friday.md`), FTN Stats IQ Week 9 context,
podcast digest (units / best bets / leans), Kalshi game markets, Thursday-night odds snapshot + BEO 11/05-06 game lines.
**No Sunday player-prop prices yet**: rungs are targets; set each to the lowest rung offered in Saturday's captures (BKR sign-in first), every leg inside -350.
All logged in `data/official-picks/ai-proposals/2026-w09.json` at proposal time. Nothing placed.

| ID | Ticket | Legs | Why |
|---|---|---|---|
| S1 `w09-sun-s1-rush-early` | BEO cash, 3-leg prop parlay | **Gibbs 80+ rush yds** (DET @ MIA) · **Javonte Williams 60+** (DAL @ IND) · **Kenneth Walker 50+** (NYJ @ KC) | Rush offense vs bottom rush defense: DET rush O #4 vs MIA #26 (Gibbs 23-29 car, 116-153 yds L3); IND rush D #30 (Javonte 24-25 car in 2 of 3); NYJ rush D #24 with KC -10 game script. All 10 AM PT. |
| S2 `w09-sun-s2-rush-late` | BEO cash, 3-leg prop parlay | **Judkins 50+** (CLE @ NO) · **Woody Marks 50+** (HOU @ LAC) · **Irving 60+** (TB @ CHI) | NO rush D #32 and a rookie-start QB push CLE to the run (gate: CLE inactives); Montgomery OUT -> Marks 15-19 car vs LAC rush D #27; Irving 19-27 car vs CHI rush D #20 (Thu DNP was rest, full Fri). |
| S3 `w09-sun-s3-teaser` | BEO cash, 6-pt teaser | **CAR +8.5 · ATL +9 · GB +9** | Each moves through 3 and 7. CAR is Simon Hunter's best bet on two shows, and both CAR and GB are 2u teaser legs from Fezzik and Tucker; ATL +3 (Tucker 1u). GB D DVOA #4. |
| S4 `w09-sun-s4-dogs` *(optional)* | BEO cash, 3-leg sides | ARI +8.5 · WAS +4.5 · MIN +3 | Same reads as the SC five at market numbers. **Conflicts with Q5's SEA ML leg** (an ARI win kills Q5); skip it if you'd rather not hedge Q5. |
| Tackles `w09-sun-tackles-candidates` | candidates (BKR single-game or BEO) | Sonny Styles 8+ · Josiah Trotter 8+ · Al-Shaair 8+ · Jack Gibbens 7+ · Cashman 8+ (MNF) | Styles 13/13/8 L3 vs LAR rush O #3; Trotter 12/10/6 vs a Swift-heavy CHI; TNF tackles reads went 2-0. Ernest Jones dropped (ankle, Q). |

**Rules check (C1-C5, manual):** every cash ticket is 3 legs; each read is on one ticket only; no receiving props; no totals; CLE@NO (C4, shaky QB)
carries only a single Judkins prop, no same-team stack; no round robins. No full-game spreads inside prop parlays; nothing at BKR except single-game tickets.

**Passed on:** HOU@LAC Under 40.5 (Fezzik/Tucker 2u; a total, fine for a game-line ticket, but the LAC offense is too bad to need it);
MIA +7 (Tucker 2u best bet; conflicts with S1's Gibbs read); CMC (hamstring Q all week); DEN/CAR backs (split roles).

**Saturday:** BKR sign-in -> `runbkrprops.cmd` / `rundkprops.cmd` / `runbolprops.cmd` -> set rungs and prices, re-log any changed legs (`ai_record.py add` upserts by id),
recheck Nabers / Skattebo / Saquon / Wirfs / St. Brown, then paste each slip before placing.
