# Week 5 market lines — compiled Wed 2026-10-07 (Claude Team 2)

**Status: PARTIAL.** Books, Kalshi, BKR (12/15, 2 days old) and injury news are in. **Missing:** Action Network openers (blocked from the bridge shell, 403), SuperContest Week 5 lines (`data/supercontest/week-05-lines.json` not present), fresh BKR board. Evidence only, no wagering synthesis.

- Books: Supabase `game_odds_snapshots` (week 5, captured 2026-10-07 21:00Z = 14:00 PT), DK / FD / MGM, filtered `captured_at >= 2026-08-25`. Spreads are the HOME team's; consensus = median of the three books.
- **Move since open** is a proxy: consensus vs the BKR 10/05 12:05 PT paste (a different book, ~2 days old). It is not an AN-opener move. Re-base once the AN openers exist. Sign = change in the HOME spread / total in points (e.g. DAL -10 to -8.5 = +1.5, DAL laying fewer; JAX -6 to -7.5 = -1.5, JAX laying more).
- Kalshi = away/home win contract price in cents (not sportsbook odds).

| Game | Kickoff PT | BKR 10/05 (home sp / tot) | DK | FD | MGM | Consensus | Move vs BKR (sp / tot) | Kalshi win % | Contest | Flags / news |
|---|---|---|---|---|---|---|---|---|---|---|
| TB @ DAL | Thu 10/08 17:15 | DAL -10 / 47.5 | DAL -8.5 / 47.5 / +360·-470 | DAL -8.5 / 47.5 / +370·-480 | DAL -8.5 / 47.5 / +350·-450 | DAL -8.5 / 47.5 | +1.5 / +0 | TB 21 DAL 80 | n/a | **spread move +1.5; QB change** — QB: Mayfield OUT (thumb); TB Winfield/Morrison/Dennis OUT, DAL Overshown/Durant OUT |
| PHI @ JAX | Sun 10/11 06:30 | JAX -6 / 43 | JAX -7 / 42.5 / +280·-355 | JAX -7.5 / 41.5 / +300·-375 | JAX -7.5 / 42 / +280·-350 | JAX -7.5 / 42 | -1.5 / -1 | PHI 24 JAC 77 | n/a | **spread move -1.5** — Barkley hamstring (not seen), L. Johnson retired, Jurgens protocol |
| MIN @ NO | Sun 10/11 10:00 | not on paste | NO +1.5 / 42.5 / -125·+105 | NO +1.5 / 42.5 / -134·+114 | NO +2 / 42 / -130·+110 | NO +1.5 / 42.5 | n/a | NO 45 MIN 56 | n/a | Addison, Kamara DNP |
| IND @ PIT | Sun 10/11 10:00 | PIT -2.5 / 44.5 | PIT -2.5 / 44.5 / +124·-148 | PIT -2.5 / 44.5 / +114·-134 | PIT -2.5 / 44.5 / +120·-145 | PIT -2.5 / 44.5 | +0 / +0 | PIT 58 IND 43 | n/a | Heyward, Ramsey, Dean DNP; K. Allen limited |
| CLE @ NYJ | Sun 10/11 10:00 | NYJ -2.5 / 40 | NYJ -1.5 / 39.5 / +105·-125 | NYJ -1.5 / 40.5 / +108·-126 | NYJ -2 / 40 / +110·-130 | NYJ -1.5 / 40 | +1 / +0 | NYJ 55 CLE 46 | n/a |  |
| CIN @ MIA | Sun 10/11 10:00 | MIA +7 / 41.5 | MIA +6.5 / 42.5 / -340·+270 | MIA +6.5 / 42.5 / -300·+245 | MIA +6.5 / 42.5 / -325·+260 | MIA +6.5 / 42.5 | -0.5 / +1 | MIA 26 CIN 75 | n/a | Chase concussion protocol, Higgins DNP |
| LV @ NE | Sun 10/11 10:00 | NE -3.5 / 45.5 | NE -3.5 / 45.5 / +164·-198 | NE -3.5 / 44.5 / +164·-196 | NE -3.5 / 45 / +165·-200 | NE -3.5 / 45 | +0 / -0.5 | NE 64 LV 36 | n/a |  |
| NYG @ WAS | Sun 10/11 10:00 | WAS -3 / 43.5 | WAS -3.5 / 42.5 / +145·-175 | WAS -3.5 / 42.5 / +164·-196 | WAS -3.5 / 42.5 / +155·-190 | WAS -3.5 / 42.5 | -0.5 / -1 | WAS 63 NYG 38 | n/a | Nabers, McLaurin, Diggs, Mariota DNP |
| HOU @ TEN | Sun 10/11 10:00 | TEN +7 / 40 | TEN +7.5 / 37.5 / -355·+280 | TEN +7.5 / 37.5 / -370·+295 | TEN +7.5 / 37.5 / -375·+300 | TEN +7.5 / 37.5 | +0.5 / -2.5 | TEN 24 HOU 77 | n/a | **total move -2.5** — Anderson DNP; Collins/Dell limited |
| CHI @ GB | Sun 10/11 10:00 | GB +3 / 45 | GB +2.5 / 45.5 / -135·+114 | GB +2.5 / 45.5 / -134·+114 | GB +2 / 46 / -135·+110 | GB +2.5 / 45.5 | -0.5 / +0.5 | GB 45 CHI 56 | n/a | **QB change** — QB: C. Williams out, Bagent starts; GB lost E. Cooper (Achilles) |
| DEN @ LAC | Sun 10/11 13:05 | LAC +3.5 / 42 | LAC +3.5 / 42.5 / -185·+154 | LAC +3.5 / 42.5 / -176·+148 | LAC +3.5 / 42 / -175·+145 | LAC +3.5 / 42.5 | +0 / +0.5 | LAC 38 DEN 63 | n/a | DEN without Surtain |
| SF @ SEA | Sun 10/11 13:25 | SEA -3 / 46.5 | SEA -2.5 / 45.5 / +130·-155 | SEA -3 / 45.5 / +136·-162 | SEA -3 / 46 / +138·-165 | SEA -3 / 45.5 | +0 / -1 | SF 40 SEA 60 | n/a |  |
| DET @ ARI | Sun 10/11 13:25 | ARI +4 / 54.5 | ARI +5.5 / 54.5 / -250·+205 | ARI +5.5 / 54.5 / -240·+198 | ARI +5.5 / 54.5 / -250·+200 | ARI +5.5 / 54.5 | +1.5 / +0 | DET 70 ARI 31 | n/a | **spread move +1.5** — DET defense ranked last, 4 safeties out |
| BAL @ ATL | Sun 10/11 17:20 | not on paste | ATL -3.5 / 43.5 / +150·-180 | ATL -3.5 / 43.5 / +152·-180 | ATL -3.5 / 43.5 / +155·-185 | ATL -3.5 / 43.5 | n/a | BAL 39 ATL 62 | n/a | **QB change** — QB: Lamar non-participant (ankle), Huntley likely QB1; Hendrickson/Humphrey DNP |
| BUF @ LAR | Mon 10/12 17:15 | not on paste | LAR -3 / 54.5 / +136·-162 | LAR -3 / 54.5 / +138·-164 | LAR -3 / 54.5 / +135·-160 | LAR -3 / 54.5 | n/a | LAR 61 BUF 41 | n/a | BUF Allen/Kincaid starters; Bills Wk3 credit -> LAR ATS (Andy places) |

Cell format for books: `home spread / total / away ML · home ML`.

## Flags

- **TB@DAL**: spread move +1.5, QB change
- **PHI@JAX**: spread move -1.5
- **HOU@TEN**: total move -2.5
- **CHI@GB**: QB change
- **DET@ARI**: spread move +1.5
- **BAL@ATL**: QB change

## Notes

- TB @ DAL: BKR had DAL -10; US books are at -8.5 with Mayfield out. Kalshi has DAL ~80% to win (cadence report). Books disagree with BKR by 1.5 on the same game, so confirm with a fresh BKR paste before reading this as movement.
- Books disagree with each other by 0.5-1 pt on PHI @ JAX (DK -7 vs FD/MGM -7.5), SF @ SEA (DK -2.5 vs -3), CLE @ NYJ and MIN @ NO. Those are 0.5-pt middle/shop spots, not a signal.
- Contest vs book middle check (>= 1.5 pts) cannot run: no Week 5 contest lines yet.
- Open items: AN openers (`python3 scripts/master-intel/actionnetwork_openers.py --week 5` on the laptop), fresh BKR board for MIN @ NO, BAL @ ATL, BUF @ LAR, SuperContest lines from Andy.
