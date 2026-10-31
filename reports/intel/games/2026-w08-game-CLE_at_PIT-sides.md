# CLE @ PIT — Week 8 game synthesis, pass `sides`

- **As of:** Fri 2026-10-30 ~11:25 PM PT (2026-10-31T06:25Z)
- **Kickoff:** Sun 11/1 10:00 AM PT (18:00Z), Acrisure Stadium (outdoor, grass). Inactives ~8:30 AM PT.
- **Packet built:** 2026-10-31T06:09:16Z (`scratch/w08-game-synthesis-queue-sides.json`) · **roster_vet:** PASS (roster age 8.5h)

## Recommendation box

| Market | Pick @ BKR | Tier | Fair | Edge | Playable to |
|---|---|---|---|---|---|
| SPREAD | **CLE +3.5 -113** | C | PIT -2.5 | 1.0 pt (crosses the 3) | +3.5 at -110 or better is the real play; -113 is break-even per sim; **pass at +3** or at +3.5 -115 or worse |
| TOTAL | **PASS** (38.5, o-106 / u-110) | PASS | 38.5–39 | ~0 | Under only if 39.5 comes back; over only at 37.5 or lower |
| MONEYLINE / SU | **PASS** (CLE +163 / PIT -188) | PASS | PIT -152 / CLE +152 (excl. tie) | ~1.6 win-prob pts on CLE | CLE ML playable at +175 or better |
| SuperContest | **CLE +3.5** (contest line PIT -3.5 = BKR, 0 gap) | C+ | | sim 52.7% cover, no vig | best use of this read |
| Pool | SU winner **PIT**, confidence **5/16**; BUK BUK: PIT | | | | |

Card flags: spread `parlay_leg_ok` = n (52.7% leg at -113 juice); `standalone_preferred` = n (edge too thin); `supercontest_candidate` = y.

## Game script

Two bottom-12 offenses by EPA/play (CLE -0.033 #20, PIT -0.056 #27) and top-13 defenses [Source: data/generated/team-dossiers/2026-w08/CLE.md, PIT.md, nflverse through W7]. Expect a field-goal-driven game decided late. Cleveland has been outscored 58-13 in first quarters (worst in the NFL) and has not won a 1Q outright [Source: news_notes SharpFootball 2026-10-30; an_primer W8_custom_1793135171341]. So PIT probably leads early and CLE pressures its way back. CLE is 5-1 in one-score games, and the W4 meeting was CLE 27-24 with 5 sacks of Rodgers. A 3-point PIT win, the most common NFL margin (15.4% exact-3 in the sim), is the middle of the outcome range. The hook is the whole bet.

## QB / availability

- QBs: **Deshaun Watson (CLE)** vs **Aaron Rodgers (PIT)**; neither on an injury report [Source: qb_operator_notes / scratch/w08-qb-confirmations-1030.md, Fri 9:25 PM PT, labeled web-checked by Claude, not Andy-confirmed]. CLE activated QB Dillon Gabriel off IR 10/26 (depth only) [Source: news_notes ESPN 2026-10-26].
- **CLE Questionable:** OT Tytus Howard (concussion, DNP Wed), S Daniel Thomas, CB Myles Harden (hamstring, slot CB) [Source: news_notes PFT 2026-10-30 "Browns list three players as questionable"; availability feed]. DE Jared Verse (knee) carries **no designation** [Source: availability, Cabot via ESPN 2026-10-30]. **If Howard is out**, CLE's pass protection (9.6% sack rate, 37.7% pressure allowed per FTN) gets worse against T.J. Watt. That trims about 0.25 pt from the CLE lean, but it does not flip the pick.
- **PIT:** CB Doneiko Slaughter **OUT**, CB Brandin Echols **OUT**, CB Israel Mukuamu IR, CB Donte Kent PUP, WR Ben Skowronek Q (calf) [Source: availability 2026-10-30; secondary_matchups; qb_operator_notes]. That leaves PIT's corner depth thin against a CLE receiver group that just posted 491 yards (Concepcion 8-129, Fannin 6-91 in W7).

## Market

- **AN open** (Sun 10/25 5 PM PT): PIT -3.5 (-116), total 39.5, ML PIT -200 / CLE +164 [Source: market.an_opener].
- **BKR now** (Fri 6:52 PM PT paste; per-game board 2026-10-31T01:51:46Z shows identical numbers): PIT -3.5 **-103** / CLE +3.5 **-113**, o/u 38.5 (-106/-110), ML -188/+163 [Source: data/generated/props/bookmaker-gamelines-2026-10-31-week8.raw.txt; bookmaker-live-2026-10-31-browns-at-steelers.json]. BetOnline Thu: PIT -3 -125, 39.5 [Source: betonline-live-2026-10-29].
- Movement: the number is unchanged, but the price moved 13 cents **toward CLE**. The book now charges more for CLE +3.5 and the PIT ML has shortened. Total **down 1 (39.5→38.5)**.
- Splits (AN, 2026-10-31T02:06Z): spread bets 52% / money 49% CLE (no sharp flag); ML 82% bets / 85% money PIT; total 75% bets / 78% money **over**. No 10-point money-vs-bets gap. The total dropped a full point against roughly 78% over money, which is **reverse line movement toward the under**. BetMGM: CLE +3.5 is the #2 most-bet side with 67% of money [Source: news_notes John Ewing/B. Fawkes 2026-10-30]. **The public is on CLE.**
- SuperContest line PIT -3.5 (captured 10/29) equals BKR. No gap.

## Quantitative

- **Power:** PIT SRS +3.82 (#8) vs CLE -1.43 (#21). Model rank PIT #10, CLE #22 [Source: power_ratings]. Raw SRS plus 1.5 HFA implies about PIT -6.5. That number is noisy over 7 games and overstates the gap.
- **Market win totals:** CLE 9.53 vs PIT 10.22 [Source: prediction_markets]. The market sees them as near-equal, which with HFA implies about PIT -2.5 to -3.
- **FTN (via dossiers):** DVOA net PIT +10.1% (off +1.7, def -8.4) vs CLE -3.4% (off -11.2, def -7.8), which favors PIT. Pressure is the key matchup. CLE's defense pressures at 32.6% (41.4% quick pressure) vs PIT's 20.9%. Rodgers under pressure: EPA/DB **-0.601**, 40.9% pressure-to-sack [Source: FTN through W7]. Rodgers faces man coverage 40% of the time, the most in the league, with a 52% completion rate against it. CLE played man on 71% of snaps and pressured him at a season-high 42% in W4 [Source: news_notes SharpFootball 2026-10-30].
- **Secondary matchups:** PIT pass D vulnerability "medium" (4.8), CLE pass D "watch" (2.18) [Source: secondary_matchups; coach names there are stale and ignored].
- **Weather:** 18.5°C, 1% precip, 7 km/h wind. Not material.

**Adjustments** (home-positive, total margin_adj **-1.0**, inside the 2.0 soft cap):
1. PIT returning from Paris without a bye: -0.5. Teams off an International game on ≤7 days rest are 1-9 ATS since 2025 [an_primer W8_custom_1793204745771].
2. CLE pressure/man vs Rodgers: -0.5 [SharpFootball 10/30; FTN].
3. PIT CB depth (2 OUT, IR, PUP): -0.25 [availability].
4. Offset for PIT's better power/DVOA, CLE's weak pass protection and slow starts, and Howard Q: +0.25.

total_adj **0.0**. The RLM under and both offenses' poor EPA are offset by CLE/PIT season game totals averaging 39.9 and 41.6, the 51-point W4 meeting, thin PIT corners, and BKR team totals summing to 39 (17.5 + 21.5).

| Run (BKR -3.5 / 38.5) | CLE cover | PIT cover | Over | PIT win | Tie |
|---|---|---|---|---|---|
| Baseline | 50.0% | 50.0% | 50.0% | 64.1% | 2.3% |
| margin -1.0 | **52.7%** | 47.3% | 50.0% | 61.6% | 2.3% |
| margin -1.5 (sensitivity) | 54.0% | 46.0% | — | 60.3% | — |
| margin -1.0, total ±0.5 | — | — | 51.5% / 48.5% | — | — |
| BKR -3 view (adj -0.5) | 51.4% excl. push (8.3% push) | — | — | 58.9% | — |

Break-even at -113 is 53.05%, so **CLE +3.5 -113 is about break-even**. The pick needs -110 or better, or the SuperContest (no vig). CLE ML: about 39.6% excl. ties vs 38.0% break-even at +163. That is too thin to play.

## Expert / podcast / article agreement

- **CLE +3.5:** Matt Perrault (BettingPros pull and YouTube = one opinion), Andrew Erickson (BettingPros YouTube "fade intl no-bye"), Chad Millman (Sharp or Square; pull and YouTube = one), Steve Fezzik (Ross Tucker), Even Money (listed twice = one), Tuley (VSiN best bet; notes 67/33 Browns in ATS contests) [Source: expert_picks_pull 10/27–10/29; youtube_picks_approved; pick_signals VSiN 10/29]. All were priced at +3.5, and the number has not moved, only the juice (-110 to -113).
- **PIT:** Sean Koerner (AN PRO), PIT -3.5 at ATS confidence #9 of 26, projection -3.7 (edge 0.9%) [youtube_picks_approved, article_chrome 10/28]. PFT predicts PIT 16-13, a CLE cover ATS. Evan Abrams trends lean PIT: Steelers 22-1 SU / 16-7 ATS at home vs CLE since 2004, Kemp-reffed favorites 30-10 ATS, Rodgers 39-25-1 ATS in QB-revenge games [an_primer]. Bet Labs systems on CLE: "Great Condition Div Road Dogs" 388-297-20, "Road Dog, No Playoffs Recently" [an_primer]. Division dogs are 23-10 ATS this season.
- **Total:** Unders from Even Money, BettingPros, Fezzik (3-team under parlay leg; not comparable as a straight bet), all at 39.5, with PFT implying 29. Over: ESPN o39.5 -105 [pick_signals 10/30]. The touts' value at 39.5 is gone at 38.5.
- Dropped: John Ewing "U 8.5" is the CLE season win total (5.5→8.5), not a game pick.

## Counter-case

- **CLE +3.5:** Tout and public consensus on CLE is overwhelming, and the book is pricing it (-113). Fading the crowd has been right before. PIT has better SRS/DVOA, a home dominance streak that is old but real, and Rodgers' revenge record. CLE's pass protection (25 sacks) faces Watt, and Howard may sit. A 1Q hole could force Watson into giveaways and a 7-to-10-point PIT win. Koerner, the sharpest numbers source in the packet, is on PIT.
- **Total PASS (if under is right):** RLM against 78% over money says sharp under, and both offenses are bad. **(If over is right):** PIT corners are depleted, CLE just scored 27 on 491 yards, and the W4 meeting went 51.
- **ML PASS:** At +163 CLE wins 38% of the time by the market. If you trust the -1.5 view (60.3% PIT), CLE ML has value of about 1.7 points before any tie risk.

## Ambiguity / missing data

- The Friday official injury report was not directly verified. The web search returned no current-week page and the PFT link was blocked. CLE statuses come from the PFT 10/30 headline plus the availability feed.
- The QB file is labeled "web-checked by Claude (not Andy-confirmed)" despite the `qb_operator_notes` field name.
- The availability feed is flagged needs_human_review across the board. The ESPN status block in both dossiers is "missing".
- `article_selections` and `props_intel_articles` are empty. The Hribar worksheet is paywalled and only partly captured.
- The International-return trend is a small sample (10 games).

## Pre-kickoff delta checklist

1. **Line goes to PIT -3 (any price):** spread becomes PASS (51.4% excl. push). Contest line stays -3.5.
2. **CLE +3.5 goes to -115 or worse:** PASS for betting; keep for the SuperContest.
3. **CLE +4 appears:** upgrade to B.
4. **Tytus Howard OUT** at 8:30 AM PT inactives: trim to -0.75; still CLE in the contest, betting only at -110 or better.
5. **Verse or Myles Harden scratched**, or Watt out: re-run.
6. **Total back to 39.5:** under becomes a C lean. **37.5 or lower:** over becomes a C lean.
7. **CLE ML +175 or better:** CLE ML becomes a C.

## Gate notes

- missing_inputs: none. roster_vet PASS (8.5h). Kickoff has not passed.
- Friday injury web check found no current page (see Ambiguity). Packet statuses were used.
- `qb_operator_notes` source file says it is not Andy-confirmed.
- secondary_matchups coach/player notes (Tomlin/Austin, Schwartz, Minkah Fitzpatrick) are stale and ignored. The dossiers name Monken and McCarthy.
- youtube_picks_approved: Brandon Anderson's McLaughlin rationale references the Chiefs/Denver (likely a misattributed game). It is a props item and was not used here.
- Duplicate opinions collapsed: Even Money ×2, Perrault ×2, Millman ×2, BettingPros/Erickson.
