# CHI @ SEA — Week 8 game synthesis, pass `sides` (Monday Night Football) — Saturday re-run

As-of: Sat 2026-10-31 ~3:25 PM PT · Kickoff: Mon 11/2 5:15 PM PT (2026-11-03T01:15Z) · Inactives ~3:45 PM PT Mon · Packet built_at 2026-10-31T21:55:40Z · roster_vet PASS (roster age 0.3h, 14 UNVERIFIED slate-wide)

## Recommendation box

| Market | Pick @ BKR | Tier | Fair | Edge | Playable-to |
|---|---|---|---|---|---|
| SPREAD | **CHI +3 +102** | C (B at +3.5) | SEA -2.25 | ~0.75 pt | +3 at -110 or better; **pass at +2.5** |
| TOTAL | **UNDER 46 -106** (BetOnline u46.5 -110 is the better number if executable) | C | 45.0 | 1.0 pt (1.5 vs BOL 46.5) | to 45.5 -110; pass at 45 |
| MONEYLINE / SU | **PASS** (CHI +154 = model ~39%); SU winner **SEA** | PASS | CHI ~+154 | ~0 | reconsider CHI at +170 |
| SuperContest | **CHI +3** (contest SEA -3 = BKR) — keep in the AI five as the low-confidence slot | C | | | drop for any B-tier alternative |
| Pool | BUK BUK SU: **SEA**; confidence **4/16** | | | | |

Card fit: spread `parlay_leg_ok=n` (8.3% push on 3); under `parlay_leg_ok=y` (thin, C); `standalone_preferred=n` (no large edge).

## Changes vs Friday

1. **BKR (2:26 PM PT Sat)**: CHI +3 +102 / SEA -3 -118 (Fri +103/-119); o46 -110 / u46 -106 (unchanged); ML CHI +154 / SEA -176 (Fri +156/-178). Board file 21:28:46Z matches; team totals still CHI 21.5 / SEA 24.5; 1H SEA -1.5 -117, 23. Effectively no move. [Source: data/generated/props/bookmaker-gamelines-2026-10-31-week8.raw.txt; bookmaker-live-2026-10-31-bears-at-seahawks.json 2026-10-31T21:28Z]
2. **BetOnline (21:33Z)** shows CHI +3 -105 and **total 46.5** (-110 both) — a half point the under can use. [Source: betonline-live-2026-10-31-bears-at-seahawks.json]
3. **Splits (AN 2:23 PM PT)**: spread SEA 40% bets / 47% money (+7, Fri +9 — no flag); ML CHI 25% bets / 47% money (+22 gap persists — sharp flag on CHI ML); total over 71% bets / **83% money** (Fri 70/79) with the number pinned at 46 → reverse-line pressure toward the under strengthened. [Source: packet splits 2026-10-31T21:23Z]
4. **Availability (Sat)**: WR **Rashid Shaheed ruled OUT** (Fri: Q); RB **Zach Charbonnet no designation — will play**; RB Jadarian Price no designation but **remains on IR** (not yet activated); TE **Colston Loveland cleared**; RB **Kyle Monangai OUT** (Ben Johnson, Sat). [Source: news_notes Rotowire 2026-10-31T16:55Z–20:53Z]
5. **Friday operator notes are gone from this packet** (`qb_operator_notes` empty): Cross OUT and Drake Thomas OUT were operator-confirmed Friday; no Saturday confirmation. ESPN still lists Cross **Doubtful** (high ankle) — carried as "expected out."
6. **New expert/podcast picks (all SEA side or over)**: Evan Abrams SEA -3 -115 and Doug Kezirian SEA -3 -115 (AN Bears-Seahawks best bets; Kezirian already counted Friday = one opinion); Scott Bogman SEA -3.5 -110 and Chris Welsh Over 46.5 (BettingPros MNF preview); Matt Youmans VSiN best bet SEA -3. New CHI-side: Lock & Cash CHI ML +140 (X bookmark, same handle as their +3.5 = one opinion).
7. **Quenton Nelson** trade to SEA verified in packet (ESPN/PFF 10/27; PFT 10/29: starts at LG Monday).
8. **Net effect**: margin view trimmed -1.0 → **-0.75** (Shaheed out helps CHI; Charbonnet's return and a broader SEA expert consensus offset); total view trimmed -1.5 → **-1.0** (market refused to drop below 46 despite Shaheed news; BOL actually 46.5). Picks unchanged in direction, both still C.

## Game script

Seattle's defense is the best unit on the field (3.96 YPP allowed, EPA/play def -0.134, FTN def DVOA -21.1%, 36% pressure); its offense is the weak link (EPA/play -0.048, rush EPA/att -0.261, 12 giveaways) [Source: data/generated/team-dossiers/2026-w08/SEA.md, built 2026-10-31T01:01Z — unchanged since Friday]. Chicago: efficient pass offense (pass DVOA 25.4%, 72 plays/g) with a leaky pass defense (6.10 YPP allowed) [Source: CHI.md]. Without Shaheed, Seattle loses its vertical speed outlet; Charbonnet back gives them a better between-the-tackles option behind Nelson, which shortens the game. Expected: a field-position game, SEA by ~2, total ~45.

## QB / availability

QBs: Caleb Williams vs Sam Darnold [Source: an_primer, home_qb_backup/away_qb_backup false]. Coaches Ben Johnson / Mike Macdonald (primer; ignore the stale coach name in `secondary_matchups`).
- SEA: Shaheed OUT; LT Charles Cross Doubtful/expected out (ESPN, Oct 26 entry); Charbonnet in; Price on IR; Drake Thomas, Byron Murphy II statuses unconfirmed (feed "UNKNOWN"). Nelson starts LG.
- CHI: Monangai OUT; Loveland cleared; DT Jeffery Simmons (traded 10/29) and DE Montez Sweat available; CB Beanie Bishop Jr. "SUSPENSION" (FantasyPros, needs review); LB D'Marco Jackson and CB Malik Muhammad II Q.
- Scenarios: *If Cross is surprisingly active*, drop CHI +3 to PASS. *If Price is activated Monday*, marginal SEA run upgrade, no change. *If Simmons plays 30+ snaps vs a backup LT*, CHI pressure edge grows.

## Market

AN open (Sun 10/25): SEA -3 -113, 47, ML CHI +140 → now SEA -3 -118, 46, CHI +154: juice and ML toward SEA, total down 1 against 83% over money. SuperContest SEA -3 = BKR — no gap [Source: data/supercontest/week-08-lines.json 2026-10-29T16:07Z]. BetMGM: 71% of money on SEA -3 (Ewing, 10/30).

## Quantitative

Power: CHI SRS 6.77 (#4) vs SEA 4.57 (#7); composite z 1.070 vs 1.073 → neutral pick'em, fair ≈ SEA -2 with HFA [Source: packet power_ratings]. Prediction markets: both median 11.4 wins, context only. Rest: CHI 11 days vs SEA 8; rest-advantage teams 22-8-1 ATS; SEA 3rd straight primetime, 5th straight strong opponent [Source: an_primer]. Weather immaterial (9.5°C, calm).

Simulator (cal 2018-2025, sha 0ea35592…), BKR line = contest line:

| Run | margin-adj | total-adj | CHI cover / push | CHI ex-push | Over / Under | SEA win |
|---|---|---|---|---|---|---|
| Baseline -3 / 46 | 0 | 0 | 45.9% / 8.3% | 50.0% | 48.5 / 48.5 | 60.1% |
| **Saturday adjusted -3 / 46** | -0.75 | -1.0 | **47.8% / 8.3%** | **52.1%** | 45.5 / **51.5** (53.1% ex-push) | 58.2% (CHI 39.4%) |
| Friday view (ref) | -1.0 | -1.5 | 48.5% / 8.3% | 52.9% | 44.0 / 53.0 | 57.6% |
| Price check -2.5 | -0.25 | -1.0 | 50.7% | — | — | 55.4% |
| BOL total 46.5 (view 45) | -0.75 | -1.5 | — | — | 45.5 / **54.5** | — |

Adjustments: margin -0.75 = rest edge (+0.5 CHI), Cross out + Shaheed out net of Nelson/Charbonnet (+0.25 CHI). Total -1.0 = elite SEA D, SEA rush inefficiency + Charbonnet clock, no Shaheed explosives, RLM. Break-evens: CHI +3 +102 → 49.5% ex-push (52.1% = small edge); u46 -106 → 51.5% ex-push (53.1%); u46.5 -110 → 52.4% (54.5%). At +2.5 CHI is 50.7% vs 52.4% → pass.

## Expert / podcast / article agreement

- **CHI**: Brandon Anderson (+3.5, also parlay leg = one), Even Money (+3.5), Steve Fezzik (+3.5), Lock & Cash (+3.5 best bet + ML +140 = one), ESPN betting (+3 -105), Tuley (+9 teaser, non-comparable). Koerner projects exactly +3 (0.0%). Four CHI picks were at +3.5 and lost the hook.
- **SEA**: Kezirian (-3, two videos = one), Abrams (-3 -115, new), Bogman (-3.5, new; his "rookie QB" rationale is factually wrong — Williams is not a rookie — discounted), Youmans VSiN (-3 best bet, new), Joe Gibbs (line not stated; Shawn Smith home ATS 29-10-1), Simon (-3), Zachary Cohen (-2.5), PFT (20-14 SU).
- **Total**: Welsh Over 46.5 (new); Hribar Darnold o232.5 pass yds is an over-adjacent argument (Bears allow most YPA); PFT 20-14 implies under.
Net: SEA has the larger and growing expert count; CHI has the sharper money signal (ML +22) and the rest/situational spots.

## Counter-case

- **CHI +3**: SEA's defense is elite and Darnold is 8-0 SU in home night starts since leaving the Jets; Shawn Smith home trend; Saturday's new expert content leaned SEA; juice at -118 says the market wants -3.5. One defensive score loses this.
- **Under 46**: Williams road overs 8-2-1 (+12.3 PPG); Bears allow most YPA → Darnold volume; 83% of money on the over; SEA giveaways create short fields.
- **SEA SU**: sharp ML money says CHI may be 42-45% outright.

## Ambiguity / missing data

`missing_inputs[]` empty. Cross final status not confirmed Saturday (ESPN page stale, Oct 26). Drake Thomas, Byron Murphy II statuses unknown. Bishop suspension unverified. Simmons/Nelson snap shares unknown. Dossiers unchanged since Friday 01:01Z (availability section empty). Saturday BKR prop menu thin (no player props posted).

## Pre-kickoff delta checklist

1. Cross active → CHI side to PASS. 2. CHI +3.5 appears → B + SC primary; SEA -2.5 → pass side. 3. SEA -3 juice past -125 → wait for +3.5. 4. Total 45 → under pass; 47 → under B; take 46.5 wherever offered. 5. Monday inactives 3:45 PM PT: Simmons role, Price activation. 6. CHI ML +170+ with sharp ML split → ML C.

## Gate notes

- roster_vet PASS (0.3h). No props here.
- Kickoff not passed.
- `qb_operator_notes` empty in Saturday packet (Friday had Cross/Drake Thomas OUT) — flagged; ESPN Doubtful used for Cross.
- Final injury check: two web searches + one ESPN fetch; no official Saturday report text found; Saturday status from packet Rotowire notes.
- Secondary-matchups coach/role notes (Eberflus, "rookie" Odunze) ignored as stale.
- SC line equals BKR, so the contest run is the same as the BKR run.

Sources: [ESPN Seahawks injuries](https://insider.espn.com/nfl/team/injuries/_/name/sea); [Seahawks.com injury plan 10/26](https://www.seahawks.com/news/this-week-s-plan-for-rb-jadarian-price-zach-charbonnet-and-other-seahawks-injury-updates); [Sun-Times Bears practice report 10/27](https://chicago.suntimes.com/bears/2026/10/27/bears-practice-report-kyle-monangai-zavier-scott-seahawks-walk-through).
