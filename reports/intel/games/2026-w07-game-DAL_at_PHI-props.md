# DAL @ PHI — Week 7 game synthesis, pass `props` (MNF island)

As-of: Sat 10/24 2:39 PM PT (2026-10-24T21:39Z) · Kickoff: Mon 10/26 5:15 PM PT · Packet built 2026-10-24T21:33:58Z · roster_vet: PASS (13.3h; 1 INFO / 9 UNVERIFIED) · BKR prop board captured 2026-10-24T20:27:13Z · BKR has no TD board yet; BetOnline player props are not posted yet (48 game/special rows only).

## Recommendation box: props

Every price is from the BKR board (2026-10-24T20:27Z). The usage basis is nflverse weekly W1–W6 (`data/vault-seed/nflverse/player_stats_weekly.csv`). The board has **no PHI player rows** (McKee, Barkley, Smith and Goedert are all unavailable) and **no tackle markets**.

| # | Player | Market | Line | Price | Book | Basis (W1–W6) | Tier | parlay_leg_ok | card_slot |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Javonte Williams | Rush yds **U** | 63.5 | -110 | BKR | 41/30/98/62/45/41, over 1 of 6, 3.6 YPC; PHI rush D DVOA -8.2% | **B** | y | island-T1 |
| 2 | CeeDee Lamb | Receptions **O** | 6.5 | -132 | BKR | 28% target share, 69 targets; over in 4 of 6; PHI match-zone slot/underneath boost | **B** | y | standalone / SGP anchor |
| 3 | Dak Prescott | Completions **O** | 23.5 | -109 | BKR | 22/26/25/32/24/34, over 5 of 6; 70.9% dropback rate | **B** | y | island-T2 |
| 4 | Jake Ferguson | Rec yds **U** | 19.5 | -111 | BKR | 6/43/23/11/19/13, under 4 of 6; Spann-Ford is taking 12-personnel and red-zone snaps (AN, 10/23) | **C+** | y | island-T2 |
| 5 | Dak Prescott | Pass TD **U** | 1.5 | +110 | BKR | 1 TD in four straight games; Williams has 7 rush TDs in 6 games and scored in every game | **C** | y | island-T2 |
| 6 | George Pickens | Receptions **O** | 4.5 | -144 | BKR | 22% target share; over 4 of 6; shoulder, full practice Fri | **C** | y | flex |
| 7 | Ryan Flournoy | Receptions **O** (alt) | 3.5 | +102 | BKR | 15% share, 9 targets in W6; over 3 of 6; slot boost | **C** | y | island-T2 |
| 8 | Lamb (alt) | Receptions **O** | 7.5 | +140 | BKR | same basis as #2 | C | y | island-T1 |

**Passes:** Dak pass yds 266.5 (avg 273, but the script favours DAL leading). Dak o1.5 pass TD at -129 (I make 2+ TDs about 48%). Dak rush 9.5 (no matchup fit). Lamb 80.5 yds (3 of 6). Javonte carries 16.5 (correlated with #1, so pick one). Javonte receptions 2.5.

**Anytime TD** (DK Predictions, **reference only**, captured 10/23 19:10Z; BKR and BetOnline ATD boards are pending, so reprice Monday):
1. **Javonte Williams -163.** 7 TDs, scored in all 6 games, and gets DAL's goal-line work. Best probability, low payout. (card_slot 7e-ATD)
2. **CeeDee Lamb +127.** 4 TDs and the alpha in the red zone. (7e-ATD)
3. **Darius Cooper +488.** He has 3 of PHI's 9 passing TDs, and with DeVonta Smith and Dontayvion Wicks both out he is now a starting WR. Best value on PHI. (7e-ATD / island-T3)
4. **George Pickens +170.** (7e-ATD / island-T3)
5. **Brevyn Spann-Ford +733** (AN has +850). Backed by the AN expert and Brandon Anderson on YouTube; they count as two signals, from different shows. (island-T3)
- Saquon Barkley at +108 only if he is active: 0 TDs in 4 games, and Dameon Pierce scored the W6 rushing TD, so pass at this price. Dallas Goedert: no TD leg (DNP Thu/Fri, status unclear).

**First TD:** **Javonte Williams +376** (fair is about +330: he has ~39% of DAL's TDs and DAL has ~60% to score first) · **Darius Cooper +2400** (fair about +1900) · Spann-Ford +2400 (flier) · Lamb +614 (about fair, a pass unless BKR offers +700). (card_slot 8a-FirstTD)

**Monday reprice targets (no captured row, so no pick yet):** tackles + assists for Jihaad Campbell (7.8/g), Zack Baun (7.8/g) and Caleb Downs (7.2/g, 12 tackles in W6). DAL runs only 29% of plays, so PHI's LBs see mostly passes; Downs gets volume against PHI's run-first plan. McKee pass TD U1.5: one TD on 45 attempts in W6, behind an OL cluster, facing a 27.5% blitz rate. McKee rush yds under, if it posts: he had one carry for 0 yards in W6 and is a pocket passer, which is the matchup fit. No INT props until a line exists.

## Side and total with Smith and Wicks OUT (Saturday restatement)

- **Spread:** BKR moved to **DAL -4 -112 / PHI +4 -104** (20:27Z). My fair line moves to **DAL -4.5** with PHI's top two WRs out, so **PASS at +4**. PHI +4.5 -110 at BetOnline (21:15Z) or in the SuperContest is a C at most. Sim: PHI covers 48.6% at +4 (margin-adj -0.5).
- **Total:** **UNDER 44 -108 upgraded to B** (fair 41.5). Sim under is 57.8% excluding pushes (total-adj -2.5). PHI's team TD u2.5 at -200 on BetOnline agrees. Playable to 43; pass at 42.5.
- **ML / SU:** pass. SU winner DAL; the confidence pick moves up to 7/16.

## Game script

DAL controls the game with a short passing game against Vic Fangio-style match zone (slot, seam and TE-middle boosts), while PHI uses run-first ball control under backup Tanner McKee. PHI has a 37.5% three-and-out rate and gave up 7.0% sacks. PHI's healthy pass-catchers are Makai Lemon, Darius Cooper, Dameon Pierce and the TEs; none has a proven target share, so there are no PHI receptions props. DAL's most likely path is 20–24 points built on high completion volume (Dak over 23.5), with goal-line finishes by Williams rather than passing TDs. PHI scores 13–17. [Source: sides report 2026-10-24T01:30Z; dossiers 2026-w07; secondary_matchups]

## QB / availability

- PHI is starting Tanner McKee; Jalen Hurts is on IR for the season [qb_operator_notes]. **OUT: DeVonta Smith, Dontayvion Wicks, Nolan Smith, Michael Carter II** (Andy, Sat). **Barkley Q** (expected to play). **Goedert unverified.** My search found no Saturday designation (DNP Thu and Fri, knee), so all Goedert props and legs are omitted. *If Goedert is out*, the targets go to Lemon and Cooper (more Cooper ATD value).
- DAL: Pickens was a full participant Friday. Turpin (ribs) did not practice Thursday. Dee Winters was 0 tackles in W6 and is doubtful, which leaves Barham and Downs to soak up tackles. Jalen Thompson (S) is out.
- Inactives: Mon 10/26 at 3:45 PM PT.

## Market

AN opened DAL -5.5 / 45 → BKR now -4 / 44, which is reverse line movement against 66–71% of bets and money on DAL. ML splits carry a sharp flag on PHI (18% of bets vs 31% of money). Contest line DAL -4.5. [splits 2026-10-23T19:40Z]

## Island 3-tier ladder: PRELIM (reprice on BetOnline Monday; SGP correlation will change the prices)

No leg repeats across tiers. Prices are BKR/DK multiplied as straight parlays.

- **Tier 1 ($10 @ +600–1000):** Lamb o7.5 rec +140 · Javonte u63.5 rush -110 · Under 44 -108 → about **+780**.
- **Tier 2 ($5 @ +1800–3000):** Dak o23.5 cmp -109 · Ferguson u19.5 rec yds -111 · Flournoy o3.5 rec +102 · Dak u1.5 pass TD +110 · Eagles 1Q team total u3.5 -144 (BKR) → about **+2,520**.
- **Tier 3 moonshot ($5 @ +6500–20000):** ATD Darius Cooper +488 · Pickens +170 · Spann-Ford +733 → about **+13,100** (DK reference prices).
- No shared anchor: three different scripts. Tier 1 is DAL controlling and the game staying low. Tier 2 is DAL's short passing with goal-line finishes by Williams. Tier 3 is a passing-TD scramble. If BetOnline's Monday prices push a tier outside its band, swap Lamb o7.5 for o6.5 (Tier 1) or add or drop the 1Q leg (Tier 2).

## Counter-case

- **Javonte u63.5:** if DAL leads by 14 or more, he could reach 22+ carries; he hit 98 yards in W3 on 19 carries.
- **Lamb/Dak volume:** a comfortable DAL lead cuts dropbacks, and W5 (2 catches) shows Lamb's floor.
- **Under:** DAL's defense ranks #32 in EPA per play; one short field off a DAL giveaway (1.2 per game) flips the total.
- **Dak u1.5 TD:** PHI allows 8 passing TDs, and DAL's red-zone TD rate is 77%.

## Ambiguity / missing data

BetOnline player props are missing (missing_inputs). The BKR TD board is missing. No tackle markets were captured. Goedert's status is unverified. Hollywood Brown appears in the PHI news feed but has no PHI rows in the 2026 weekly stats, so he is omitted. The availability feed duplicates Nolan Smith (DE/LB) and Epenesa.

## Pre-kickoff delta checklist

1. BetOnline props post: price tackles for Campbell, Baun and Downs, McKee pass-TD u1.5, and ATD/FTD. Reprice every ladder tier.
2. Goedert official status: if out, upgrade Cooper ATD; if active, no change.
3. If Barkley is inactive: Pierce ATD comes into play, and PHI's total gets weaker (under stays B).
4. Price crossings: Javonte rush 59.5 or lower, pass; Lamb rec 7.5 at -150 or worse, pass the alt; total 42.5, pass the under.
5. Inactives at 3:45 PM PT Mon. **A leg on a player missing from the box score = LOST.**

## Gate notes

- Roster PASS at 13.3h; not rerun. Andy's operator notes are used for every PHI status.
- I ran one web search for Goedert's status and found nothing for Saturday; he is left unverified.
- BetOnline thin: no player props, so all props are priced at BKR; DK prices are reference only.
- Coach names in `secondary_matchups` are ignored, per rule 7.
- No gate stopped the run.
