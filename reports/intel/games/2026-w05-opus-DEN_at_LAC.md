# Week 5 DEN@LAC: single-game synthesis (opus)

Now ~06:50Z (Sat 10-10 ~23:50 PT), HEAD fb2ad66; kickoff 20:05Z (Sun 13:05 PT). BKR captured 06:21Z (23:21 PT), BEO 06:24Z (23:24 PT). These early-Sunday captures are fresh now, but the recommendation windows end at 12:21Z / 12:24Z (05:21 / 05:24 PT), before kickoff; after that nothing here is price-valid without a recapture. [Source: game-packets/2026-w05/DEN_at_LAC.md, BKR/BEO captured_at and window, 2026-10-11T06:35Z build]

**Disposition: conflicted. Tier: 2-. No side pick, no total lean. Edge 0.0 / 0.0.**

## Game script

The market expects a slow, low-scoring division game: Denver by 3.5, total 42, implied score DEN 22.75 to LAC 19.25. [Source: packet, market-implied score, BKR 06:21Z] Both offenses play at a below-average pace (FTN team-offense tempo PLY/GM: DEN 58.0, LAC 61.3; quant tempo_z about -1.1 for both). I expect the Chargers' patched line to decide most drives. [Source: FTN team-offense/tempo, 2026 GP4]

## Away state: Denver (2-2)

Denver beat JAX 20-13 and LAR 30-26 at home. On the road it lost 10-31 at KC and 14-24 at SF. Those four opponents are a combined 13-3, so the -20 point differential overstates the weakness. DEN has 7 days of rest, its bye comes in week 10, and SEA (3-1) visits next. Schedule fact only; four games is a small sample. [Source: packet, team state DEN, 2026-10-11]

## Home state: Los Angeles (0-4)

The Chargers lost to ARI 14-26 and LV 14-26 at home, then 16-24 at BUF and 23-30 at SEA. Every loss came by 7 to 12 points, against opponents with a combined 10-6 record. LAC also has 7 days of rest, its bye comes in week 7, and it plays at KC next. A loss here drops LAC to 0-5 and 0-2 in the division, behind KC (4-0). A Denver win reaches 3-2 and 1-1 in the division. [Source: packet, standings AFC West, 2026-10-11]

## Matchup mechanics

Chargers' protection against Denver's rush is the central matchup. FTN team-offense/pass-protection shows LAC with SK% 8.3%, PRESS% 39.3% and EPA/DB -0.359 under pressure. Even its clean-pocket split (EPA/DB__2 -0.017) is below zero. The ESPN injury report now lists Joe Alt OT and Kayode Awosika G as Out, Rashawn Slater OT and Trevor Penning G on IR, and Branson Taylor G as Questionable. Isaiah World OT and Trey Pipkins III OT sit in the ESPN roster IR/Out group, which is unconfirmed. Denver's FTN team-defense/pass-rush shows PRESS% 31.6%, SK% 5.1% and BLZ% 38.6%. [Source: ESPN injury report, LAC, 2026-10-11T06:35Z] [Source: FTN team-defense/pass-rush DEN]

The receiving side cuts the other way. Denver's top two corners, Pat Surtain II and Riley Moss, are both Out on the ESPN injury report. DEN's pass defense was already leaky (FTN team-defense/passing-analytics EPA/DB 0.054, EXP% 16.0%). LAC's FTN aDOT of 8.8 means Justin Herbert would normally attack that. However, Quentin Johnston and Brenen Thompson are Out and Ladd McConkey is Questionable on the injury report, so the targets left to exploit the missing corners are thin. [Source: ESPN injury report, DEN/LAC, 2026-10-11T06:35Z] [Source: FTN team-offense/passing-analytics LAC]

Denver throws short (aDOT 5.3; dropbacks DPBK% 62.1% of plays): clean-pocket EPA/DB__2 0.311 and SUCC%__2 55.6%, but pressured EPA/DB -0.700. LAC pressures at a similar rate (PRESS% 31.3%, SK% 7.8%) but is without Derwin James Jr. and Donte Jackson (injury report Out). Running is poor for Denver: LAC's FTN rush defense allows EPA/ATT -0.165, and DEN's rushing EPA/ATT is -0.053. [Source: FTN team-offense/pass-protection DEN; FTN team-defense/rush-analytics LAC]

Turnovers favor Denver: LAC has 9 giveaways (TO% 3.67%, INTW% 7.5%). [Source: FTN team-offense/efficiency and passing-analytics LAC] The ESPN depth chart and injury report resolve the starting QBs as Bo Nix and Justin Herbert. Trey Lance is on IR, which does not affect Herbert. [Source: packet Quarterbacks, ESPN 06:35Z]

Power ratings (SRS DEN +5.862, LAC -9.313; net PPG -5.0 vs -9.75) are 2026 four-game values (matches_2026 true; attribution text stale); no adjustment. Venue is covered but open-sided; the Open-Meteo capture has no DEN@LAC entry, so no weather adjustment. [Source: packet power ratings; 2026-10-10-week5-weather-openmeteo.json, 17:56Z]

## Market

BKR (06:21Z): DEN -3.5 -113 / LAC +3.5 -103; total 42, -108 both sides; moneyline -195/+171. BEO (06:24Z): DEN -3.5 -112 / +3.5 -108; total 42, -110; moneyline -188/+164. No book conflict. Action Network (10-09 19:41Z) had DEN -3.5 -103 and a total of 41.5. Since then the spread juice has moved toward Denver and the total is up half a point. The packet carries no Action Network opener. Splits (context only): DEN 54% spread tickets, 86% ML tickets; Over 69% tickets. The line sits just past the key number 3. At home line 3 the simulator's side_push is 8.27%, the value of the hook. The SuperContest labels are reversed for this game; its favorite field shows DEN -3.5. [Source: props files BKR/BEO game_lines; Action Network splits 2026-10-09T19:41Z; margin-simulator.mjs]

## Thesis and counter-thesis

Only one tier-eligible outlet exists: VSiN, with two rows (w05-expert-verified.json#rows[455] and #rows[567]), both on Chargers +3.5 at the current number. The Action Network, Even Money and Jeremiah/Brooks rows on LAC are corroboration-only, as are the BettingPros, Pro Football Talk and podcast rows on DEN. For the home dog: both DEN starting corners Out, DEN 0-2 away, a hook past 3. Against: the provisional quant pass leans DEN (home margin -4.39 vs -3.5), the protection numbers agree, and the LAC line losses postdate most source rows. One outlet against named mechanical inputs is a conflict, not an edge; I hold 0.0. The strongest reason I am wrong: if Denver's corner losses matter more than LAC's line losses, LAC +3.5 is the right side.

Zero-edge simulator: home cover 0.500, away cover 0.500, side push 0; Over 0.4848, Under 0.4848, total push 0.0304 (50/50 excluding pushes). These are conditional on the hypothesis, not calibrated edges.

## Gaps

- No weather forecast for an open-sided venue; no Action Network opener.
- The FTN tables predate the current LAC line injuries and the DEN corner injuries.
- Quant pass (-4.39) disagrees with the market by about 0.9 points toward DEN.
- ESPN roster IR/Out group (unconfirmed): DEN Lohner, Crum, Bailey, Henningsen, Deiter, Gargiulo; LAC Njoku, Perryman, World, Lambert-Smith, Pipkins.
- Recommendation windows lapse at 12:21Z / 12:24Z, before kickoff.
- Global warnings: corroboration-only rows, the SuperContest label reversal (this game included), and MIN@NO and CLE@NYJ book conflicts elsewhere.

## Pre-kickoff delta checklist

- Official inactives and starters (LAC OL: Taylor; WR: McConkey; TE: Kolar; CB: Shelley).
- Fresh BKR/BEO capture after 12:21Z; check whether the line moves through 3.
- Weather and roof recheck for the venue.
- Game status (not relocated).
- Reprice the VSiN LAC +3.5 rows if the line reaches +3 or lower.
