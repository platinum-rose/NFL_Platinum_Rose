# CIN @ BAL: Week 7 game synthesis, pass `props`
As of Sat 2026-10-24 ~15:15 PT · Kickoff Sun 10/25 10:00 PT (1:00 ET), M&T Bank Stadium (outdoor) · props packet built 2026-10-24T21:33:58Z · roster_vet PASS (age 13.3 h; 1 INFO, 9 UNVERIFIED) · Inactives about 08:30 PT Sunday

> **REFERENCE ONLY. Reprice when BKR or BEO post.** Neither Bookmaker (64 rows, game and quarter lines only, no player props; captured 2026-10-24T20:26Z) nor BetOnline (6 rows, game lines; 21:15Z) has posted player props for this game. Every price below is a DraftKings Predictions contract (pre-fee consensus %, captured **Fri 2026-10-23T19:10Z, before Lamar was ruled out**) or "no price yet". **This game needs a Sunday-morning recapture (BKR and BEO, ideally after 08:30 PT inactives) before any prop goes on a ticket.** Tiers are provisional and capped at C under gate rule 1 (missing prop boards).

## Updated sides view under Huntley (newest BKR, 2026-10-24T20:26Z)
- **SPREAD:** PASS. BKR CIN -2 -125 (BEO CIN -2.5 -115). The sim gives CIN 51.3% excl push at -2, but -125 needs 55.6%. Fair CIN -2.5, so the value is gone. **SuperContest CIN +2.5 (locked) moves to A-**: the move to CIN -2/-2.5 confirms a 4.5 to 5 point gap.
- **TOTAL:** UNDER 47.5 -108 (BKR) moves to **B**. Sim under 56.1% (total-adj -2.0, Huntley view about 45.5). Playable to 47 -110 (BEO U47 -105 is fine); pass at 46.5.
- **ML:** PASS at CIN -160 (BEO -150). Sim CIN 57.4% vs 61.5% needed; fair about CIN -135. Pool SU CIN, confidence about 6/16.

## Prop shortlist (reference only; reprice when BKR/BEO post)
| # | Player | Market | Line | Ref price (book, capturedAt) | Projection / basis | Tier (prov.) | card_slot | parlay_leg_ok |
|---|---|---|---|---|---|---|---|---|
| 1 | Demetrius Knight Jr. (CIN LB) | Tackles+assists OVER | not posted | none (BKR/BEO pending) | 42 combined in 5 g (8.4/g, team lead). BAL runs 45.8% of the time with Henry at about 22 carries/g, and the Huntley script is more run-heavy | C (B on reprice if line ≤7.5) | 7a | y |
| 2 | Barrett Carter (CIN LB) | Tackles+assists OVER | not posted | none | 41 combined in 5 g (8.2/g). Same run-heavy script | C (B if ≤6.5) | 7d | y |
| 3 | Roquan Smith (BAL LB) | Tackles+assists OVER | not posted | none | 19 solo + 28 ast in 6 g (about 7.8/g; one source). CIN 65% dropback, quick game (TTT 2.36, aDOT 7.2) feeds short catches into LB range; S Hawkins OUT | C | 7a | y |
| 4 | Joe Burrow | Passing TDs OVER 1.5 | not posted | none | 11 pass TD in 5 g (2.2/g), TD% 5.8; Hawkins out opens te_middle/slot. Against: BAL D has allowed 5 pass TD in 6 g, and a Huntley game may cut CIN volume | C | 7a | y (at -150 or longer) |
| 5 | Tee Higgins | Receptions OVER | not posted | none | Team-high 43 targets in 5 g (8.6/g, about 23% share), 27 rec. Proven share; BAL CB T.J. Tampa IR | C | 7d | y |
| 6 | Derrick Henry | Anytime TD | 1+ | DKP 65% (-186), 10/23 19:10Z | 7 rush TD in 6 g; with Huntley starting, the red-zone work leans even more on Henry. BKR implies a BAL team total near 22.75 | C (B on reprice ≥ -200) | 7e | y (within -350) |
| 7 | Mike Gesicki | Anytime TD | 1+ | DKP 23% (+335), 10/23 19:10Z | 4 TD on 17 targets; te_middle boost from Hawkins OUT | C | 7e | y |
| 8 | Ja'Marr Chase | Anytime TD | 1+ | DKP 46% (+117), 10/23 19:10Z | 4 TD in 5 g; opportunity score 9 vs a man-heavy, blitz-heavy BAL D | C | 7e | y |

**Passed on purpose:** Huntley rushing (about 6 att/25 yds per start, and CIN's run D stuffs 30% of runs (STF 30%); no matchup fit). Huntley INT (0 INT on 72 att; no fit). Chase Brown ATD at DKP 48% (+108): CIN has only 2 rush TD in 5 g and Brown averages 3.5 YPC, so the price is too short. BAL WR/TE ATDs: the DKP prices were set before the Lamar-out news and are stale high.

**ATD candidates (7e, 7-leg):** Henry -186 (anchor), Ja'Marr Chase +117, Gesicki +335; longshot Josh Cuevas +900 (Action Network and Brandon Anderson YouTube carry the same rationale, so count it as **one opinion**; rookie TE in 2-TE sets).
**First-TD candidates (8a):** Henry +400 (DKP 20%), Ja'Marr Chase +733 (12%), Gesicki +1900 (5%). **2+ TD (8b):** Henry +257 (DKP 28%).

## Game script (Huntley scenario, from the sides report)
A lower-variance, run-first BAL plan (Huntley led 30 at ATL and 10 at CLE; 19/31, 165 yds, 1 TD at CLE). CIN, rested off its W6 bye, wins the possession battle; roughly CIN 23-20. That script supports LB tackle overs on both sides (BAL runs, CIN throws short), Henry as BAL's scoring path, and Burrow carrying CIN's TDs through the air.

## QB / availability
- **Lamar Jackson OUT** (Baltimore Banner, Sat 4:01 PM ET; Andy-confirmed in `qb_operator_notes`). **Tyler Huntley** makes his 3rd straight start. Skylar Thompson is on IR, so the backup QB is thin. The packet's `projected_starters` still lists Lamar as "known"; that entry is stale.
- Friday report (from the sides report): BAL S Jaylinn Hawkins OUT, LB Tavius Robinson OUT (season), DT Broderick Washington Jr. Q. CIN has no game designations (IR only: TE Hudson, LB Bozeman, CB J. Davis, WR Iosivas).
- Any player missing from the box score = LOST. Confirm Knight, Carter, Smith, Higgins and Gesicki are active at 08:30 PT.

## Market
- BKR moved from CIN +1 -113 (Fri) to **CIN -2 -125** (Sat 20:26Z); the total went 48.5 to **47.5**; the ML went CIN -102 to **-160**. BEO: CIN -2.5 -115, 47, CIN -150. AN open was BAL -3 / 50.5, so the side has swung 5 points since the opener.
- 1H BKR: CIN -0.5 -107, o/u 23.5. Team totals on BKR are unavailable (rows flagged); 1H TT CIN 12.5 / BAL 10.5.
- Splits (AN, Fri 19:40Z, before the news): ML CIN 42% bets / 64% money, a sharp flag on CIN that has now been paid.

## Counter-case
- **Tackle overs:** a CIN blowout lead flips BAL to passing and caps CIN LB volume; a sloppy BAL day with short drives also lowers snap counts.
- **Burrow o1.5 TD:** BAL's pass D has been stingy (5 TD allowed), and a lead-protecting CIN team runs late.
- **Henry ATD:** in Huntley's CLE game BAL scored 10 and Henry ran 17 times for 58 yards with a lost fumble. A dead offense sinks every BAL TD leg.
- **Higgins receptions:** Chase or Gesicki could take the red-zone and middle work; 27 catches on 43 targets is only a 63% catch rate.

## Ambiguity / missing data
- No executable player-prop rows exist anywhere (`missing_inputs`: BKR and BEO boards thin). DKP does not list tackles, yardage or pass-TD markets at all, so props 1-5 have no price.
- The DKP TD prices are from before the Lamar-out news. Expect BAL ATDs to drift longer and CIN ATDs shorter.
- Tackle totals come from public box-score aggregators (ESPN for CIN, statscrew for BAL, updated 10/23); these are single-source and unverified against nflverse.

## Pre-kickoff delta checklist
1. **Sunday 07:30-09:30 PT: recapture BKR and BEO** props for this game. No prop goes on a ticket without a captured row.
2. Reprice gates: Knight o7.5 or lower, Carter o6.5 or lower, Smith o7.5 or lower at -130 or longer; Burrow o1.5 TD at -150 or longer; Henry ATD -200 or longer (barrier -350).
3. Inactives at 08:30 PT: any listed player inactive = drop the leg.
4. Under 47.5 turns into a pass at 46.5; SC CIN +2.5 is already locked.

## Gate notes
- `missing_inputs`: BKR (64 rows) and BEO (6 rows) have no player props, so every prop is capped at C and labeled reference only.
- roster_vet PASS (13.3 h); the UNVERIFIED items are not in this game's pick path. `projected_starters` QB entry is stale (Lamar listed).
- QB status is resolved (OUT); the Huntley scenario is used throughout.
- Kickoff has not passed; these are forward proposals only, with no tickets or stakes.

Sources: `scratch/w07-game-synthesis-queue-props.json` (CIN@BAL, built 2026-10-24T21:33Z); `data/generated/props/bookmaker-live-2026-10-24-bengals-at-ravens.json` (20:26Z); `data/generated/props/betonline-live-2026-10-24-bengals-at-ravens.json` (21:15Z); `data/generated/props/draftkings-predictions-live-2026-10-23-bengals-at-ravens.json` (19:10Z, reference); `reports/intel/games/2026-w07-game-CIN_at_BAL-sides.md`; `data/generated/team-dossiers/2026-w07/{CIN,BAL}.md`; `scripts/intel/margin-simulator.mjs` (selftest PASS); web: africa.espn.com/nfl/team/stats/_/name/cincinnati (2026), statscrew.com/football/stats/t-BAL/y-2026 (updated 10/23), thefantasyfootballers.com Huntley W6 line.
