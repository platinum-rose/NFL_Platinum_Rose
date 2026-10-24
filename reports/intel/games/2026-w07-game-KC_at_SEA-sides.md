# KC @ SEA — Week 7 game synthesis, pass `sides`

- As of: Fri 2026-10-23 18:31 PT (2026-10-24T01:31Z)
- Kickoff: Sun 10/25 17:20 PT (SNF, Lumen Field, outdoors) — inactives ~15:50 PT Sun
- Packet built: 2026-10-24T01:26:41Z (`scratch/w07-game-synthesis-queue-sides.json`)
- roster_vet: PASS (roster source 2026-10-23T15:00Z, age 0.0h; 1 INFO / 1 UNVERIFIED)

## Recommendation box

| Market | Pick @ BKR | Tier | Fair | Edge | Playable to |
|---|---|---|---|---|---|
| SPREAD | **KC +2.5 -102** | C | SEA -1.5 | 1.0 pt | +2.5 to -115; +3 any price under -125 is a B; **pass at +2** |
| TOTAL | **PASS** (lean Under 42.5 -106) | PASS | 42.0 | 0.5 pt | Under becomes C at 43.5+; never over |
| MONEYLINE | **KC +134** (alternative to the spread, not both) | C | KC +109 / SEA -109ish (sim 47.8% KC) | ~5 pct pts | to +125; pass at +120 or shorter |
| SU (pools) | **SEA** (coin flip) | — | SEA 52% | — | — |

- **SuperContest:** contest line KC +2.5 (= BKR). `supercontest_candidate`: **n** — 1-pt edge with reverse line movement against it; only a fill if the week lacks better slots.
- **Pool:** BUK BUK straight-up SEA; confidence **2/16** (lowest tier — the sim has it 52/48).
- Card flags: `parlay_leg_ok` n for the side (thin edge, correlated with KC OL news); `standalone_preferred` n (no big-margin read here).

## Game script

Best defense in the game by EPA meets the worst offense: SEA defense is #2 EPA/play (-0.138), KC defense #4 (-0.092); KC offense #5 (+0.139), SEA offense #25 (-0.085) [Source: data/generated/team-dossiers/2026-w07/{KC,SEA}.md, nflverse through W6]. Expected shape: low-event first half (BKR 1H SEA -1, total 21 [Source: bookmaker-live-2026-10-23-chiefs-at-seahawks.json, 2026-10-23T20:12Z]), KC leaning on Kenneth Walker III against a SEA run defense that is elite (-28.6% rush DVOA), and SEA trying to throw to Smith-Njigba/Kupp against Spagnuolo pressure. The swing variable is Darnold under pressure: -0.795 EPA/DB, -141% DVOA when pressured, 7 INT and 8.3% sack rate on the season [Source: SEA.md FTN, through W6]. KC's offsetting weakness is its left tackle spot (see below) against a SEA front with 16 sacks / 7.5% sack rate. Most likely margins cluster at SEA by 1–3; the KC-cover path is a 20-17 / 23-20 game decided by a Darnold giveaway.

## QB / availability

- QBs: Mahomes (KC) and Darnold (SEA) starting [Source: packet qb_operator_notes (Andy-confirmed: SEA Sam Darnold); KC.md availability "QB: Patrick Mahomes [ok]"]. SEA backup Drew Lock (elbow) Questionable — only matters if Darnold leaves.
- **KC final report (Fri):** OUT — OL Jaylon Moore (concussion), WR Rashee Rice (hamstring/knee), RB Brashard Smith (hamstring). Q — CB L'Jarius Sneed (knee, LP), LB Cooper McDonald (knee, LP). Kelce (ankle) no designation. LT Josh Simmons on IR [Source: chiefs.com Week 7 injury report, 2026-10-23; ESPN 2026-10-22 Simmons IR]. Both of KC's tackle options for the left side are out — the biggest single KC downgrade. Xavier Worthy is again the top WR [Source: Rotowire 2026-10-23T22:22Z].
- **SEA final report (Fri):** OUT — RB Zach Charbonnet (knee; season debut delayed), LB Drake Thomas (ankle), LB Chazz Surratt. Q — S Nick Emmanwori (hip; slot role in secondary feed), QB Drew Lock (elbow). TE Elijah Arroyo out (shoulder surgery). Emanuel Wilson leads the backfield [Source: packet availability (John Boyle, seahawks.com via ESPN, 2026-10-24T00:43–00:55Z); Rotowire game page]. FantasyPros also lists DeMarcus Lawrence, Uchenna Nwosu, Connor O'Toole as Q (dated 10/23 00:00, not on the Rotowire final) — unverified.
- If Emmanwori is OUT: SEA slot coverage thins (secondary feed tags `slot_wr_boost`, `inside_seam_boost`) — mild KC+ (Kelce/Royals). If Sneed is OUT: KC secondary depth loses a starter vs Kupp/JSN — mild SEA+. Neither flips the pick alone; a Lawrence/Nwosu absence would (weakens the pass rush that is SEA's best answer to KC's tackle hole).

## Market

- AN open (Sun 10/18 5:00 PM PT): SEA -2 -110, total 42.5, ML KC +109 / SEA -132 [Source: market.an_opener].
- BKR now: KC +2.5 -102 / SEA -2.5 -114, o42.5 -110 / u42.5 -106, ML KC +134 / SEA -154 — Andy paste ~11:40 PT and per-game board 2026-10-23T20:12Z are identical (newest number) [Source: bookmaker-gamelines-2026-10-23-week7.raw.txt; bookmaker-live-…json].
- Movement: SEA +0.5 and juice now on SEA (-114) **while ~89% of spread bets and 88% of spread money are on KC** [Source: splits, AN 2026-10-23T19:40Z]. That is reverse line movement — the strongest SEA signal in the packet. No 10-point bets/money gaps (spread 11/12 home; ML home 26 bets/17 money = KC money +9; total over 80/89 = +9), so no formal sharp flag.
- SuperContest locked KC +2.5 (captured 2026-10-22T15:03Z) — no gap to BKR.
- DK Predictions (reference only, 19:10Z): SEA -2.5 54%, ML SEA 58%, Over 42.5 52%.
- Total: unchanged at 42.5 despite 89% over money; a bookmarked Caesars note reports sharp Under 44.5/43.5 [Source: news_notes, X @PatrickE_Vegas 2026-10-22T13:28Z] — books that opened higher came down.

## Quantitative

- Power: KC SRS 7.42 (#3), net +11.4 PPG (#1), model rank #1; SEA SRS 2.08 (#13), +4.3 (#7), model rank #10 [Source: packet power_ratings]. Raw SRS gap ≈ KC -3.8 with a 1.5 HFA — market disagrees by ~6 points, mostly pricing SEA's 2025 (14-3, DVOA #1) prior and KC's soft schedule (DEN, IND, MIA, LV, LAC 0-6).
- Prediction markets: KC median 12.9 wins (7.9 of 12 remaining), SEA 10.5 (7.5 of 11) — near-equal rest-of-season strength, which supports ~SEA -1.5 at home [Source: prediction_markets].
- Yards/play differential: KC +2.04, SEA +1.40; SEA turnover margin -1 with 12 giveaways [Source: dossiers].
- Rest: SEA played Thu W6 (10 days); KC played Sun. Rest-advantage-at-home trend cited 10-1 ATS [Source: news_notes, X @FATBOSSPICKS — unaudited trend].
- Rotowire projection SEA 22.8–KC 19.8 (SEA -3, 42.6).

Simulator (`margin-simulator.mjs`, selftest PASS; contest line = BKR so one run covers both):

| Run | margin_adj | total_adj | SEA cover | KC cover | Over | Under | SEA win (excl tie) |
|---|---|---|---|---|---|---|---|
| Baseline -2.5 / 42.5 | 0 | 0 | 50.0% | 50.0% | 50.0% | 50.0% | 54.9% |
| Adjusted | -1.0 | -0.5 | 47.4% | **52.6%** | 48.5% | 51.5% | 52.2% |

Adjustments: margin -1.0 (KC efficiency/power edge and futures parity, partly offset by KC's two OT absences, Rice out and SEA rest/home); total -0.5 (two top-4 defenses, Rice out, Charbonnet out, Caesars sharp under, public over without a move). KC +2.5 at -102 needs 50.5% → ~2 pts of EV; Under at -106 needs 51.5% → zero edge, hence PASS.

## Expert / podcast / article agreement

- **KC side:** Emerson Lotzia (KC +2.5), Andrew Erickson (KC +3 -118; Mahomes 13-3-1 ATS as a dog), Simon Hunter (KC +2.5 / tease), Dave Tuley VSiN (KC +8.5 teaser; KC 55/45 in ATS contests, SEA 65/35 SU), Ross Tucker (KC teaser to +8.5 — teaser, not comparable to the full-game number). Sharp Football worksheet: KC 9-3 as a Mahomes dog.
- **SEA side:** Steve Fezzik (SEA -2.5, a top-5 contest pick), Warren Sharp (SEA; 10 days of prep, home after losing 3 of 4), PFT (SEA 27-23).
- **Total:** Under — Warren Sharp (~20-17), Caesars sharp report. Over — PFT score implies 50. Brandon Anderson's "Under 42.5" clip is tagged to this game but its rationale is about Broncos/Chiefs, so it is dropped.
- Article selections tagged SEA (Swift, A.J. Brown, Raridon) belong to other games — dropped.
- Read: the public and the podcast crowd are on KC; the contest sharp (Fezzik) and the market move are on SEA. That split is why this is a C, not a B.

## Counter-case

- **KC +2.5 / KC ML:** The book moved toward SEA against ~89% KC money; that usually means respected money on SEA at -2. KC's left tackle hole against a 7.5% sack-rate front, plus Rice out, cuts into KC's efficiency edge built against weak opponents. SEA outgained DEN 353-168 and lost in OT; turnovers (12) have hidden a solid team, and 10 days of prep at Lumen is real. A 3-point SEA win (16% of outcomes at this number) beats the side and the ML.
- **Under lean (passed):** SEA games have averaged 45 points and KC games 44.6; SEA's giveaways create short fields, and two QBs with good CPOE can push this into the mid-40s.

## Ambiguity / missing data

- `missing_inputs[]` empty. BetOnline board absent (null path).
- KC power numbers differ between packet (SRS 7.42) and dossier (8.61, #3) — different builds; direction is the same.
- FTN KC tables stale by one week (through W5); SEA current.
- SEA Lawrence / Nwosu / O'Toole Q status from FantasyPros only — not confirmed on the final report.
- Brandon Anderson total clip mis-tagged (see above).

## Pre-kickoff delta checklist

1. KC +2.5 drifts to **+3** (any price under -125): upgrade to B and SC candidate y. At **+2 / +1.5**: PASS.
2. KC ML shortens to **+120** or less: PASS ML.
3. Inactives (~15:50 PT Sun): KC starting LT name (Moore/Simmons both out — who starts and whether KC adds a lineman); SEA Lawrence/Nwosu active; Emmanwori/Sneed status.
4. If Darnold is a late scratch (Lock is Q himself): SEA side collapses — KC to B.
5. Total moves to **43.5+**: Under C. Moves to 41.5 or lower: no play.
6. Rain/wind at Lumen beyond the 29% / 13 km/h forecast: reinforces the Under lean.

## Gate notes

- Missing inputs: none. Roster vet PASS, 0.0h old.
- Kickoff not passed; forward picks issued.
- Player roles taken only from packet/dossier availability; Kenneth Walker III on KC confirmed by packet news (PFT 2026-10-19, ESPN 2026-10-23).
- Final injury report: KC from chiefs.com (Friday); SEA Friday section on chiefs.com read "to be updated", so SEA statuses come from the packet's seahawks.com-sourced items (2026-10-24T00:4xZ) plus the Rotowire game page.
- Secondary-matchup coach names ignored per rule; dossiers authoritative (Reid, Macdonald).
- No wagers, stakes, paid APIs, Supabase writes or git actions.
