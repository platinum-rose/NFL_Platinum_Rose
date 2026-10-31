# ATL @ TB — Week 8 game synthesis, pass `sides`

As of: Fri 2026-10-30 ~11:25 PM PT (2026-10-31T06:23Z) · Kickoff: Sun 11/1 10:00 AM PT (inactives ~8:30 AM PT) · Packet built 2026-10-31T06:09Z · roster_vet: PASS (roster 8.5 h old, 2 UNVERIFIED slate-wide) · Venue: Raymond James Stadium, outdoors, grass

## Recommendation box

| Market | Call | Tier | Fair | Edge | Playable-to |
|---|---|---|---|---|---|
| SPREAD | **PASS. Lean TB -2.5 -108 (BKR)** | PASS (lean TB) | TB -3.0 | +0.5 pts vs BKR | Becomes TB C at -2.5 -103 or better, or -2 -110. Pass at -3. ATL only at +3.5 or better |
| TOTAL | **UNDER 43.5 -112 (BKR)** | C | 42.5 | 1.0 pt | Playable to 43.5 -115 or 44 any price. Pass at 43 or lower |
| MONEYLINE / SU | **PASS (ML)**. SU winner TB | PASS | TB about -140 | about 0 | TB ML playable at -125 or better |
| SuperContest | TB -2.5 (contest line = BKR) is a lean only. **Not a candidate** (sim 51.3%) | n | | | |
| Pool | SU **TB**, confidence **5/16** (low) | | | | |

Prices are from the BKR capture of Fri 6:52 PM PT [Source: data/generated/props/bookmaker-gamelines-2026-10-31-week8.raw.txt]. The per-game BKR board (capturedAt 2026-10-31T01:51Z, 6:51 PM PT) has identical rows, so there is no newer number [Source: prop_boards.bookmaker].

## Game script

This is a low-explosive divisional game between two of the league's weaker offenses. ATL ranks #23 in EPA/play on offense and TB ranks #28 [Source: dossiers ATL.md/TB.md, nflverse thru W7]. ATL leans on the run (48.6% rush rate, rushing DVOA +4.9%) and runs into TB's elite run defense (rush DVOA -21.5%, EPA/att -0.163, stuff rate 25%) [Source: FTN via dossiers, 7-game rows]. That pushes ATL into Penix dropbacks against a blitz-heavy Bowles defense: TB blitzes 42% of the time and has the #3 EPA defense. ATL's protection collapses under pressure (EPA/DB -1.10 when pressured) [Source: FTN pass-protection]. TB's pass offense is poor (EPA/DB -0.152, sack rate 8.7%) and loses WR Emeka Egbuka (OUT). RT Luke Goedeke is Questionable (calf, DNP Wed/Thu). Expect TB to lean on Bucky Irving (24-106-2 in W7) and grind. Most likely outcome: a 20-17/23-17 TB-type game. Both teams' W7 wins were inflated by +4 turnover margins (ATL 4.7 YPP vs SF's 6.2, "fluke win of the week" per @lockandcash; TB 43-13 vs CAR) [Source: dossiers game logs; news_notes].

## QB / availability

- QBs: Michael Penix Jr. (ATL) vs Baker Mayfield (TB), both confirmed [Source: qb_operator_notes, scratch/w08-qb-confirmations-1030.md]. Mayfield (right thumb) was a full participant Wednesday with no designation [Source: buccaneers.com Oct 28 injury report].
- ATL: RB Brian Robinson Jr. OUT (hamstring), so Bijan Robinson gets 80%+ of snaps. WR Olamide Zaccheaus Q (shoulder), LB Divine Deablo Q (forearm). The feed also lists Ebukam, Snowden, Bowman Jr. and Avieon Terrell as Q (FantasyPros, needs review). CBs A.J. Terrell and C.J. Henderson carry no designation. DE James Pearce Jr. is serving an 8-game suspension (announced Aug 14), so he is out and already baked into the season stats [Source: availability; web: newstribune.com 2026-08-14].
- TB: WR Emeka Egbuka OUT (foot). RB Kenny Gainwell Q (expected to play). **RT Luke Goedeke Q (calf, DNP Wed/Thu)** [Source: availability; buccaneers.com Oct 30 headline].
- If Goedeke is out, TB's 8.7% sack rate faces a 24.9% ATL blitz rate. That shaves ~0.5 off TB and strengthens the under. If he's in, the lean on TB stands.

## Market

- AN open (Sun 10/25 5 PM PT): TB -1.5 -110, total 45.0, ML TB -125/ATL +104. BKR now: TB -2.5 -108, total 43.5, ML -135/+118. The line moved **1 pt toward TB** and the total dropped **1.5 pts**. The AN primer lists the total open at 45.5, but the AN openers file (45.0) is the baseline [Source: market.an_opener; an_primer.game].
- The SuperContest line is TB -2.5, the same as BKR (0 gap) [Source: data/supercontest/week-08-lines.json, 10/29].
- Splits (AN, 7:06 PM PT):
  - Spread: ATL 58% of bets and 62% of money. No flag (4 pts). The line still moved toward TB, which is reverse line movement against ATL money. Simon Hunter cites "respected sharp money on TB".
  - Total: Over 70% of bets but only 47% of money. **23-pt gap, so the sharp money is on the UNDER**.
  - ML: ATL 48% of bets, 72% of money. **24-pt gap, so the money is on ATL ML** [Source: splits; an_primer.public].
- BetMGM conflicts: 66% of money there is on TB -2.5 [Source: news_notes, @johnewing 10/30]. The side markets are split, but the total signal is clean.

## Quantitative

- Power: SRS TB 3.69 (#10) vs ATL 2.86 (#12). Net PPG TB +1.6 vs ATL -0.3. Pythag TB .542 vs ATL .493. Model rank TB 12 / ATL 15 [Source: power_ratings].
- Market-implied ranks are TB 22 and ATL 19. TB's z-delta of -1.17 means the market rates TB below its results. TB is 1-5 in one-score games with a Pythag delta of -1.79 (most unlucky in the league) [Source: TB.md].
- FTN DVOA: TB off -9.1 / def -16.2 (net +7.1). ATL off -3.9 / def -8.6 (net +4.7).
- Neutral-field estimates: TB +1 to +2.5 from DVOA/EPA, +0.8 from SRS. Adding ~1.5 HFA gives a **fair TB -3.0** (range -2.3 to -3.8). Koerner projects -2.6 [Source: youtube_picks_approved, Koerner PRO].
- Secondary matchups: TB secondary is on "watch" (CB Josh Hayes IR), which slightly helps ATL slot targets. ATL secondary is on "watch" (Henderson playing), with a slot/TE-middle lean for Chris Godwin Jr. and Cade Otton [Source: secondary_matchups].
- Weather (Open-Meteo): 25 °C, wind 21 km/h (~13 mph), gusts 29 km/h (~18 mph), 45% chance of precip, 0.8 mm. Rated review_required. The Bet Labs "Med to High Wind" Under system (1297-1122-32) applies [Source: weather; an_primer systems].

Simulator (calibration 2018-2025, sdMargin 12.77, sdTotal 13.13), home line -2.5, total 43.5:

| Run | margin_adj | total_adj | TB cover | ATL cover | Over | Under | TB win |
|---|---|---|---|---|---|---|---|
| Baseline | 0 | 0 | 50.0% | 50.0% | 50.0% | 50.0% | 56.1% (tie 2.4%) |
| **Adopted** | **+0.5** | **-1.0** | **51.3%** | 48.7% | 47.0% | **53.0%** | 57.4% |
| Stress | +1.0 | -1.5 | 52.6% | 47.4% | 45.5% | 54.5% | 58.7% |

Breakevens are 51.9% at -108, 52.8% at -112 and 57.4% at -135. The adopted TB cover (51.3%) is **below** breakeven at -108, so the spread is a PASS. The under clears breakeven by only 0.2 pts, so it stays tier C. The ML is at breakeven, so it's a pass. The SuperContest line equals BKR, so the same 51.3% applies and it is too thin.

Adjustments (under the 2.0 soft cap):
- margin +0.5: TB run defense vs ATL's run-centric offense (FTN), TB one-score/Pythag underrating (dossier/power), and model-vs-market rank gap. Partly offset by Egbuka OUT, Goedeke Q and the TB home-favorite ATS history.
- total -1.0: wind/rain forecast plus Bet Labs wind system (-0.5), and both offenses bottom-10 in EPA plus TB #3 defense (-0.5). The sharp under money is not added because the 1.5-pt move already prices it.

## Expert / podcast / article agreement

- **TB -2.5:** Brandon Anderson (Action Network; one opinion across the pull and YouTube), Stuckey (AN video), Matt Moore (AN), Simon Hunter (Sharp or Square; two mentions on one show = one opinion), Sean Koerner (ATS confidence #11/26, only a 0.7% edge). PFT projects TB 27-20 (SU/ML).
- **ATL:** Steve Makinen (VSiN best bet, +2.5). BettingPros (+1.5, 10/28) is stale: the line moved 1 pt against them and they would be at +2.5 now. Teasers are not comparable to the full-game number: Tuley (VSiN) ATL +8.5 and Stuckey's ATL teaser leg.
- **UNDER:** Brandon Anderson (Under 45.5) and Steve Fezzik/Even Money (Ross Tucker show, Under 45.5, 3-team parlay leg; one opinion). Both were priced at 45.5, so **2 pts of that value is gone** at 43.5.
- **OVER:** BettingPros at 45 (stale). PFT's projected 47.
- The Action Network primer trends lean ATL:
  - TB 1-11 ATS at home since 2025.
  - Mayfield 13-27-1 ATS as a home favorite.
  - NFC South favorites 16-34-1 ATS.
  - Division dogs 23-10 ATS in 2026.
  - "30-40 rule" fade (21-32-1).
  - Bowles 5-12 ATS off a 10+ point win.
  - Pro-TB counterweight: Stefanski 5-11 ATS as a divisional road dog. Bet Labs systems exist on both sides [Source: an_primer, Evan Abrams 10/30].

## Counter-cases

- **Lean TB:** Trend stacking is overwhelmingly ATL, and ML money is 72% on ATL. TB is without its WR1 (Egbuka) and possibly its RT. Its pass offense (EPA/DB -0.152) may not produce enough to win by 3. ATL won 2 of its 3 road games.
- **Under:** Seasonal scoring runs higher, at ATL 49.1 and TB 44.7 combined points per game. ATL is 7-0 to the 1Q over and 6-1 to the 1H over [an_primer], so an early ATL script and turnovers (12 ATL giveaways) can blow through 43.5 even in wind.
- **ML pass:** If the TB underrating is real (Pythag delta -1.79), -135 is cheap.

## Ambiguity / missing data

- Head coach conflict: the dossier lists ATL HC Raheem Morris, but its coaching block is historical_context_only. The AN primer and the Falcons site (Week 8 Stefanski media availability) say **Kevin Stefanski**, so I used Stefanski. Coach-specific trends are low weight.
- ATL WR room: the packet does not mention Drake London, and the web depth-chart page fetched was from 2024 (stale). WR1 status is unverified. This doesn't move the sides read.
- An AN slate trend tags ATL with an "International Series on deck" spot. ATL's Week 9 venue is unverified.
- missing_inputs is empty. article_selections and props_intel_articles are empty.

## Pre-kickoff delta checklist

1. Goedeke inactive (8:30 AM PT): margin -0.5, keep the spread PASS, under adds +0.5 confidence.
2. TB moves to -3 at BKR: hard pass on TB, ATL +3 becomes a look (C) only with Goedeke out. TB -2 or -2.5 at -103 or better: TB becomes tier C.
3. Total moves to 44+: Under upgrades to B. Total moves to 43 or lower: Under becomes a PASS.
4. Game-day wind of 15+ mph sustained or steady rain: Under confirms. Calm and dry: Under drops to PASS.
5. Zaccheaus/Deablo inactive: minor. Gainwell inactive: Irving's volume goes up, no side change.

## Gate notes

- missing_inputs: none. roster_vet PASS (8.5 h).
- Kickoff has not passed, so this is a forward pick.
- Dossier coaching is stale (Morris vs Stefanski), resolved with the AN primer and Falcons site. Coach names in secondary_matchups (e.g. Jimmy Lake) were ignored per rule.
- player-availability/latest.json has known bugs. Verified on the web:
  - Egbuka OUT; Gainwell and Goedeke Q (buccaneers.com).
  - Pearce's 8-game suspension (Aug 2026 reports).
  - The ATL "Q" rows dated 07:00Z from FantasyPros are not confirmed by the team site.
- The Falcons depth-chart URL returned a 2024 page and was disregarded.
