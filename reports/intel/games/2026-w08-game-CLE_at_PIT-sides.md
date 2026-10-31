# CLE @ PIT: Week 8 game synthesis, pass `sides` (Saturday re-run)

- **As of:** Sat 2026-10-31 ~3:20 PM PT (22:20Z)
- **Kickoff:** Sun 11/1 10:00 AM PT (18:00Z), Acrisure Stadium (outdoor). Inactives ~8:30 AM PT.
- **Packet built:** 2026-10-31T21:55:40Z (`scratch/w08-game-synthesis-queue-sides.json`) · **roster_vet:** PASS (roster age 0.3h; 14 UNVERIFIED league-wide)
- Friday version: `reports/intel/games/_friday-w08/2026-w08-game-CLE_at_PIT-sides.md` (06:25Z)

## Recommendation box

| Market | Pick @ BKR | Tier | Fair | Edge | Playable to |
|---|---|---|---|---|---|
| SPREAD | **CLE +3.5 -113** | C | PIT -2.5 | 1.0 pt (crosses the 3) | Worth betting only at -110 or better. At -113 the sim is break-even (52.7% vs 53.05% needed). **Pass at +3**, or at +3.5 -115 or worse |
| TOTAL | **PASS** (38.5, o-106 / u-110) | PASS | 38.5–39 | ~0 | Under becomes a C at 39.5+; over becomes a C at 37.5 or lower |
| MONEYLINE / SU | **PASS** (CLE +164 / PIT -189) | PASS | PIT -152 / CLE +152 (excl. tie) | ~1.7 win-prob pts on CLE | CLE ML playable at +175 or better |
| SuperContest | **CLE +3.5. Keep it in the Dashboard AI five** (contest PIT -3.5 = BKR, 0 gap) | C+ | | sim 52.7% cover, no vig | |
| Pool | SU winner **PIT**, confidence **5/16**; BUK BUK: PIT | | | | |

Card flags: spread `parlay_leg_ok` = n (a 52.7% leg at -113 juice); `standalone_preferred` = n (edge too thin); `supercontest_candidate` = y.

## Changes vs Friday

1. **BKR price unchanged.** Sat 2:26 PM PT paste and per-game board at 21:27:52Z: CLE +3.5 -113 / PIT -3.5 -103, o/u 38.5 -106/-110. ML moved one cent: PIT -188 → -189, CLE +163 → +164. Team totals are still CLE 17.5 (o+106) and PIT 21.5 (o+112). 1H line: PIT -2.5 -113, 1H total 19 [Source: bookmaker-gamelines-2026-10-31-week8.raw.txt; bookmaker-live-2026-10-31-browns-at-steelers.json 21:27Z]. No line crossed a threshold.
2. **Splits are almost flat** (AN 21:23Z vs 02:06Z). Spread: 52% of bets / 49% of money on CLE, the same as Friday. Total: 73% of bets / 74% of money on the over, down from 75/78. ML: 83/83 on PIT, from 82/85. The total held at 38.5 even with about 74% of over money, so the reverse-line-movement under read still stands. The over-money share softened a little.
3. **Tytus Howard (CLE RT, concussion) returned to practice Friday** after two DNPs. He is listed Questionable and needs clearance from an independent neurologist [Source: NBC Sports/Rotoworld player page, fetched Sat]. That is better for CLE than Friday's "DNP Wed" read. It removes some of Friday's +0.25 offset, but I kept margin_adj at -1.0 (see below). Jared Verse and Elgton Jenkins both practiced Thursday and carry no designation.
4. **New Saturday signals:**
   - VSiN Wes Reynolds Under 39.5 (captured 14:54Z). This is another under taken at 39.5, so its value is gone at 38.5.
   - Lock & Cash "Browns +160" upset (X, published Fri 19:19Z, bookmarked Sat 21:50Z). The price is now +164.
   - ESPN's "Week 8 predictions" teaser asks "Browns pulling an upset?". It has no captured selection and I did not count it.
5. **No new CLE@PIT side or total picks** in the Saturday YouTube extraction (file status `pending_andy_review`, 21:47Z). The new Sharp or Square episode (Simon Hunter) has no CLE@PIT pick. The BettingPros Saturday refresh and the chrome-article file add nothing for this game (Koerner PIT -3.5 is unchanged).
6. **Availability feed (Sat 21:31Z)** has no new Out on either side. PIT CB Echols and Slaughter are still OUT, and Mukuamu (IR) and Kent (PUP) have new timestamps. `qb_operator_notes` is now **empty** in the packet. QBs come from the AN primer and `scratch/w08-qb-confirmations-1030.md`: Watson vs Rodgers.
7. **Verdict: no change.** The SuperContest CLE +3.5 still holds at the contest line.

## Game script

Both offenses rank in the bottom 12 by EPA/play (CLE -0.033 #20, PIT -0.056 #27), and both defenses rank in the top 13 [Source: team dossiers 2026-w08, nflverse through W7]. Expect a game driven by field goals and decided late. CLE has been outscored 58-13 in first quarters and has not won a first quarter outright, so PIT probably leads early [Source: SharpFootball 10/30; an_primer]. CLE's pressure gives it a path back. CLE is 5-1 in one-score games, and the Week 4 meeting went CLE 27-24 with five sacks of Rodgers. A 3-point PIT win is the modal outcome (15.4% exact-3 in the sim), so the hook is the whole bet.

## QB / availability

- QBs are **Deshaun Watson (CLE)** and **Aaron Rodgers (PIT)**. Neither is on an injury report. CLE QB Dillon Gabriel was activated off IR on 10/26 and is depth only [Source: an_primer; ESPN 10/26].
- **CLE Questionable:** OT Tytus Howard (concussion; practiced Friday), S Daniel Thomas, slot CB Myles Harden (hamstring) [Source: PFT 10/30; availability].
  - **If Howard is out,** CLE's protection gets worse against Watt. CLE allows a 9.6% sack rate and 37.7% pressure [FTN]. Trim the view to -0.75. The SuperContest pick stays; a bet needs -110.
  - **If Howard is in,** the view holds at -1.0, or slightly better.
- **PIT:** CBs Slaughter and Echols are OUT, Mukuamu is on IR, Kent is on PUP, and WR Skowronek is Questionable. PIT's corner depth is thin.

## Market

- **AN open** (Sun 10/25 5 PM PT): PIT -3.5 (-116), total 39.5, ML -200/+164. **BKR now:** PIT -3.5 -103, 38.5.
  - Spread: the number has not moved. The price moved 13 cents toward CLE: the book charges more for +3.5.
  - Total: down 1.
- **SuperContest:** PIT -3.5 (captured 10/29), the same as BKR. No gap.
- **Splits:** no 10-point money-vs-bets gap on any market, so no sharp flag. The public is on CLE ATS: BetMGM has 67% of money on CLE and it is the #2 most-bet side [John Ewing / B. Fawkes 10/30]. The ML and the over are public.

## Quantitative

- **Power ratings:** PIT SRS +3.82 (#8) vs CLE -1.43 (#21). Raw SRS plus home field implies about PIT -6.5, which is noisy.
- **Market win totals** (prediction markets): PIT 10.22 vs CLE 9.53. With home field that implies about PIT -2.5 to -3.
- **FTN DVOA:** PIT net +10.1% vs CLE -3.4%. The key matchup is CLE's pressure against Rodgers:
  - Rodgers under pressure: EPA/DB -0.601, with 40.9% of pressures becoming sacks.
  - CLE's defensive pressure rate is 32.6%.
  - CLE played man coverage on 71% of snaps in Week 4. Rodgers completes 52% against man [SharpFootball 10/30].
- **Weather:** 18.5°C, 1% precip, 7 km/h wind. Not material.

**Adjustments** (home-positive; margin_adj **-1.0**, the same as Friday):
- -0.5 for PIT's international return without a bye (1-9 ATS since 2025).
- -0.5 for CLE's pressure and man coverage against Rodgers.
- -0.25 for PIT's thin CB depth.
- +0.25 offset for PIT's better power/DVOA, CLE's sack rate and slow starts, and Howard's status.

Howard practicing would argue for about -1.25. I held -1.0 because the neurologist clearance is still pending, and I show -1.25 as a sensitivity run.

total_adj **0.0**. Pulling the under: the reverse-line-movement read and two poor offenses. Pulling the over: season game totals of 39.9 and 41.6, the 51 points in Week 4, PIT's thin corners, and BKR team totals that sum to 39.

| Run (BKR -3.5 / 38.5) | CLE cover | Over | PIT win | Tie |
|---|---|---|---|---|
| Baseline | 50.0% | 50.0% | 64.1% | ~2.3% |
| margin -1.0 | **52.7%** | 50.0% | 61.6% | ~2.3% |
| margin -1.25 (Howard plays) | 53.3% | — | 60.9% | — |
| margin -1.0, total ±0.5 | — | 51.5% / 48.5% | — | — |
| BKR -3 view (adj -0.5) | 51.4% excl. push (8.3% push) | — | 58.9% | — |

- **Spread:** break-even at -113 is 53.05%, so at the current price this is break-even unless Howard is confirmed active.
- **CLE ML:** 39.6% excl. ties vs 37.9% needed at +164. Too thin.
- **SuperContest** (same line, no vig): 52.7%.

## Expert / podcast / article agreement

- **CLE +3.5:** Matt Perrault (pull + YouTube = 1), Andrew Erickson, Chad Millman (pull + YouTube = 1), Steve Fezzik, Even Money (×2 = 1), Tuley (VSiN best bet). All were priced at +3.5, and the number has not moved. CLE ML: Lock & Cash (+160).
- **PIT:** Sean Koerner, ATS confidence #9/26 with a -3.7 projection (Oct 28). PFT predicts 16-13, a PIT win that does not cover. Evan Abrams trends lean PIT: 22-1 SU at home vs CLE since 2004, Kemp-reffed favorites 30-10 ATS, Rodgers 39-25-1 in QB-revenge games. Bet Labs systems on CLE: Div Road Dogs 388-297-20. Division dogs are 23-10 ATS this season.
- **Total:** Unders from Even Money, BettingPros, Fezzik (parlay leg) and Wes Reynolds (new), all at 39.5. Over: ESPN o39.5. PFT's score implies 29. Every tout under was taken at 39.5, and the number is now 38.5.

## Counter-case

- **CLE +3.5:** The consensus is lopsided and the book is charging for it (-113). PIT has the better SRS/DVOA, a long home streak and Rodgers' revenge record. Koerner, the sharpest numbers source here, is on PIT. A first-quarter hole could force Watson into giveaways and a 7-10 point loss.
- **Total PASS:** The under case is reverse line movement against ~74% over money, plus two bad offenses. The over case is PIT's depleted corners and the 51-point first meeting.
- **ML PASS:** If you trust the -1.25 view, CLE wins 40.2% excl. ties, which is value of about 2.3 points before tie risk.

## Ambiguity / missing data

- No current Friday official report was found for either team in a single search. The steelers.com hit was the 2021 report. Howard's status comes from the NBC player page, which carries no date. PIT designations come from the packet feed (ESPN/FantasyPros, needs_human_review).
- `qb_operator_notes` is empty Saturday. The QB file is labeled web-checked by Claude, not Andy-confirmed.
- The ESPN status blocks in both dossiers are "missing". `article_selections` and `props_intel_articles` are empty.

## Pre-kickoff delta checklist

1. **PIT -3 at any price:** spread becomes a PASS. The contest line stays -3.5.
2. **CLE +3.5 at -115 or worse:** PASS for betting; keep in the SuperContest.
3. **CLE +4 appears:** upgrade to B. **CLE +3.5 at -110 or better:** the C becomes playable.
4. **Howard OUT at 8:30 AM PT:** trim to -0.75. Still CLE in the contest. **Howard active:** -1.25, so -113 is marginally playable.
5. **Verse, Harden or Watt scratched:** re-run.
6. **Total at 39.5:** under becomes a C. **Total at 37.5 or lower:** over becomes a C.
7. **CLE ML +175 or better:** a C.

## Gate notes

- missing_inputs: none. roster_vet PASS (0.3h). Kickoff has not passed.
- The required injury check found no current official report page; Howard's status came from a news page.
- `qb_operator_notes` is empty.
- I ignored the stale coach and player names in secondary_matchups (Tomlin/Austin, Schwartz, Fitzpatrick). The dossiers and the AN primer name Monken and McCarthy.
- youtube_picks_approved: Brandon Anderson's McLaughlin rationale references Chiefs/Denver, which looks misattributed. It is a props item and was not used.
