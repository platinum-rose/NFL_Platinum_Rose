# BAL @ BUF — Week 8 2026 — pass: sides

- As of: Fri 2026-10-30 ~11:25 PM PT (2026-10-31T06:25Z)
- Kickoff: Sun 11/1 10:00 AM PT (18:00Z), Highmark Stadium (outdoor). Inactives ~8:30 AM PT Sunday.
- Packet built: 2026-10-31T06:09:16Z (scratch/w08-game-synthesis-queue-sides.json) · roster_vet: PASS (roster age 8.5h, 2 UNVERIFIED league-wide)

## Recommendation box

| Market | Pick @ BKR | Tier | Fair | Edge | Playable to |
|---|---|---|---|---|---|
| SPREAD | **BAL +3 -105** (lean) | C | BUF -2.5 | +0.5 pt | +3 at -115 or better; PASS at +2.5 |
| TOTAL | **Over 55 -101** | B | 56 | +1.0 pt | B to o55 -110; C at o55.5; PASS at 56+ |
| MONEYLINE | **PASS** (BAL +143 / BUF -165) | PASS | BUF -137 / BAL +137 (approx.) | ~1% on BAL | BAL becomes C at +155 or better |
| SuperContest | **BAL +3.5** (contest line BUF -3.5) | B | BUF -2.5 | +1.0 pt across 3 | supercontest_candidate: **Y** |
| Pool (SU / conf.) | **BUF** straight up | — | 58.9% (sim adj., ties excl. 57.7%) | — | pool_confidence **4/16** (low) |

Card-fit: spread parlay_leg_ok **N** (key-number 3 push, thin); total parlay_leg_ok **Y** (pairs with no side); standalone_preferred N for both (edges are modest). [Source: Bookmaker capture 2026-10-30 6:52 PM PT, data/generated/props/bookmaker-gamelines-2026-10-31-week8.raw.txt; per-game board data/generated/props/bookmaker-live-2026-10-31-ravens-at-bills.json capturedAt 2026-10-31T01:51:10Z — same numbers]

## Game script

Two top-8 offenses (EPA/play BUF #1 0.204, BAL #8 0.088) against bottom-half defenses (BUF #31 0.128, BAL #22 0.044) [Source: team dossiers 2026-w08, nflverse through W7]. Bills games average a league-high 61.3 combined points; BUF leads the league in points/drive on offense (3.13) and allows the most (2.76) [Source: article_notes, Hribar worksheet 2026-10-28]. Expected shape: early exchange of scoring drives; Lamar back after three missed games with BAL 4-0 SU/ATS in first halves of his 2026 starts [Source: an_primer W8_custom_1793124435108]; BUF's rested offense (bye W7) controls the second half — Brandon Anderson's BAL 1H / BUF 2H double result is the same read. A one-score game near 3 is the modal outcome (sim: 15.6% exact margin 3).

## QB / availability

- **Lamar Jackson (ankle, high-ankle sprain): cleared, will play** — coach Jesse Minter confirmed Friday [Source: availability ESPN 2026-10-30T17:36Z; qb_operator_notes]. Full practices Wed/Thu. SportMD: "mild dip in rushing" expected [Source: news_notes 2026-10-26]. **If Lamar is a surprise inactive → Tyler Huntley**: flip to BUF -3 lean / Under lean; pass BAL everywhere (Huntley-era BAL scored 30, 10, 13).
- **BAL Out**: G Vega Ioane (MCL), S Jaylinn Hawkins (knee). RB Adam Randall Q. S Kyle Hamilton no designation. LB Roquan Smith was limited Thursday — Friday designation not in packet.
- **BUF Out**: S C.J. Gardner-Johnson (suspension), WR Tyrell Shavers. **Questionable**: WR DJ Moore (shoulder; Andy note: expected to play), TE Dalton Kincaid (chest; expected), RT Spencer Brown (back), nickel Dee Alford (ankle), DT Greg Gaines, LB TJ Parker. CBs Dorian Strong and Jordan Hancock on IR. [Source: availability BUF block, ESPN/RotoWire/PFT 2026-10-30; news_notes ESPN "Bills making contingencies" 2026-10-30T18:56Z]
- BUF secondary is thin (CJGJ out, two CB on IR, nickel Q) right as Lamar returns — supports BAL points and the Over.

## Market

- **Spread**: AN open BUF -3.5 (Sun 10/25) → BKR BUF -3 -111 / BAL +3 -105. Half-point toward BAL as Lamar news firmed. SuperContest locked BUF -3.5 (10/29) — BKR is 0.5 worse for BAL than the contest.
- **Total**: AN open 53.5 (packet an_opener; AN primer lists 51.5 as consensus open) → BKR 55 (o -101 / u -115). Up 1.5–3.5 points. The juice on the under (-115) means BKR is shading toward 55.5.
- **Moneyline**: AN open BUF -191 / BAL +159 → BKR -165 / +143.
- **Splits** (AN 2026-10-31T02:06Z): spread BUF 57% bets / 38–39% money → **sharp flag on BAL** (19-pt gap). Total Over 50–51% bets / 83% money → **sharp flag on Over** (32-pt gap). ML 88–89% bets and money on BUF (no gap). Caesars reported sharp Over action at 52.5 and 53.5 [Source: news_notes @PatrickE_Vegas 2026-10-29]. BetMGM: Bills -3 is the #1 most-bet side by tickets [Source: news_notes @BFawkes22 2026-10-30] — public on BUF, money on BAL.

## Quantitative

- Power: BUF SRS +3.33 (#11), model rank #8; BAL SRS -0.90 (#20), rank #18 [Source: power_ratings]. BAL's numbers include three Huntley starts (2-1 W/L but 10 and 13 points in the last two); with Lamar W1–W4 BAL was 3-1, +40. Prediction markets: BAL make-playoffs 63%, BUF 93% — context only.
- FTN: BUF offense DVOA 29.0%, pass EPA/DB 0.331, 21.9% explosive pass rate; BUF defense pass DVOA 27.3%, EPA/DB allowed 0.234 (bad). BAL offense pass DVOA 45.7% (Lamar-weighted), rush EPA -0.080; BAL defense rush DVOA -10.5% (good), pass DVOA 8.8%. BUF FTN is stale_1wk (through W6, bye) [Source: dossiers / ftn-stats-iq-weekly-synthesis-context-latest.json 2026-10-30T22:00Z].
- Secondary matchups: BUF offense vs BAL defense tier **high** (severity 6.15; Hawkins out, Hamilton hybrid role); BAL offense vs BUF defense tier **medium** (2.7; slot/TE/underneath boosts for Flowers/Andrews) [Source: secondary_matchups W8]. Ignore coach names inside that block (stale).
- Weather: 18.5°C, 0% precip, wind 9 km/h, gust 13 — immaterial [Source: weather Open-Meteo].
- Adjustments: **margin_adj -0.5** (home-positive): Lamar return + BUF secondary depth/CJGJ out and sharp money on BAL, partly offset by BUF bye rest edge and BAL OL loss (Ioane). **total_adj +1.0**: both offenses top-8 EPA vs #31/#22 defenses, BUF games 61.3 avg, depleted BUF secondary, sharp Over money; trimmed for Lamar rushing dip and the late-season high-total regression trend.

| Sim run | BAL cover | BUF cover | push | BAL cover excl push | Over | Under | Over excl push | BUF win |
|---|---|---|---|---|---|---|---|---|
| BKR -3 / 55, baseline | 45.9% | 45.9% | 8.3% | 50.0% | 48.5% | 48.5% | 50.0% | 60.1% |
| BKR -3 / 55, adj (-0.5, +1.0) | 47.2% | 44.6% | 8.3% | 51.4% | 51.5% | 45.5% | 53.1% | 58.9% |
| Contest -3.5 / 55, baseline | 50.0% | 50.0% | 0 | 50.0% | — | — | — | 64.1% |
| Contest -3.5, adj (-1.0 vs 3.5, +1.0) | 52.7% | 47.3% | 0 | 52.7% | 51.5% | 45.5% | 53.1% | 61.6% |

Break-evens: BAL +3 -105 needs 51.2% excl push (sim 51.4% → near zero edge, hence C); Over 55 -101 needs 50.2% (sim 53.1%); BAL +143 needs 41.2% (sim ~42.3% excl tie → PASS). [Source: scripts/intel/margin-simulator.mjs, calibration 2018-2025 sha 0ea35592, selftest passed]

## Expert / podcast / article agreement

Deduped (same person across audio/YouTube/pull counted once):
- **BAL +3.5/+3**: Joe Gibbs (Warren Sharp), Stuckey (Action Network: Lamar 13-2 ATS as dog), Steve Fezzik (Ross Tucker), Simon Hunter and Chad Millman (Sharp or Square), Even Money, BettingPros panel, Steve Makinen (VSiN, at +3), Lock & Cash, Action Network game video (unnamed host). Almost all priced at **+3.5**; the line is now **+3** — half a point (through the key number) is gone at BKR.
- **BUF**: Matt Perrault (BUF -3.5), Seth Woolcock (BUF -3 and BUF ML parlay anchor), PFT (Bills 28-24). Sean Koerner projects BUF -3.3 (ATS confidence #7 of 26, slight BAL at +3.5) — at +3 his number is on BUF's side.
- **Total**: BettingPros Over 53.5; Sharp Football best bet Bills TT Over 28.5; Abrams trends (BAL 13-2 Over off a loss; BAL 5-0 Over as road dog; BUF 6-0 4Q Over). No named Under pick found. John Ewing "BAL U10.5 / BUF O12.5" are season win totals, not this game — excluded.
- Props noted for the props pass only (Flowers o80.5, Lamar rush yds, Allen rushing TDs).

## Counter-cases

- **BAL +3**: BUF off a bye vs BAL off a 35-13 loss; rest-advantage teams are 22-8-1 ATS this season and 15-3-1 ATS as favorites [Source: an_primer slate]. Lamar is 3-12 ATS outdoors since 2025; BUF won and covered the last three home meetings vs Lamar; BAL is 1-6 3Q ATS. First game back from a high-ankle sprain with a backup guard. Koerner's number (3.3) says +3 is slightly the wrong side of the key.
- **Over 55**: the move already happened (sharps bet 52.5–53.5, not 55); totals 53+ from Week 7 on are 33-44-1 to the Over over the last decade; Lamar's rushing may be capped; BUF's under-center/play-action shift and BAL's strong run defense could shorten the game. BAL games have gone 23 and 48 in the last two.
- **PASS ML**: BAL +143 is only about a 1-point edge; Lamar health variance cuts both ways.

## Ambiguity / missing data

- `missing_inputs[]` empty. BUF FTN tables stale by a week (bye) — low impact.
- **BUF head coach conflict**: the dossier lists Sean McDermott; the AN primer and a PFT headline (2026-10-30) put Joe Brady as BUF head coach. Not used in the thesis; dossier rule noted.
- Roquan Smith Friday designation not confirmed in the packet. The web search for the final Friday report returned no fetchable 2026 W8 page; designations above come from packet ESPN/RotoWire/PFT items dated 2026-10-30.
- Total opener: AN opener file 53.5 vs AN primer total_open 51.5 — movement is 1.5 to 3.5 depending on source.
- The availability feed lists Hamilton as limited Thursday, then no designation Friday — treated as playing.

## Pre-kickoff delta checklist

1. Lamar inactive / limited (8:30 AM PT inactives): flip to BUF -3 lean, Under lean, pass BAL in the contest.
2. BKR moves to BAL +2.5: pass the spread. BAL +3.5 shows up: upgrade to B.
3. Total to 55.5: Over drops to C; 56+: pass. Back to 54.5: Over B+.
4. DJ Moore or Spencer Brown inactive: small BAL nudge (+0.5) and slight Under nudge on Moore; Brown out helps the BAL pass rush.
5. Dee Alford out (nickel) on top of CJGJ: strengthens the Over and Flowers/Andrews angles.
6. Any late Roquan Smith downgrade: Over/BUF nudge.

## Gate notes

- missing_inputs: none.
- roster_vet: PASS (8.5h old) — no player props in this pass.
- Kickoff not passed (forward picks valid).
- QB facts taken from qb_operator_notes (Andy-confirmed) + ESPN Friday (Minter confirmed).
- One web search for the Friday injury report done; it returned no usable 2026 W8 page (CBS fetch failed, ESPN page empty). The packet's 10/30 Friday items were used.
- Coaching: secondary_matchups coverage note names a stale BAL DC ("Orr") — ignored. BUF HC conflict noted above.
- Expert dedup: Gibbs, Anderson, Perrault and Sharp or Square appear in both expert_picks_pull and youtube_picks_approved — one opinion each; Lock & Cash duplicate already dropped by packet.
