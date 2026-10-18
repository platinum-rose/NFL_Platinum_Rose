---
name: ASTRA_W06_PORTFOLIO_SESSION
role: Fresh-session prompt - Week 6 slate portfolio (top-12 picks, parlays, teasers) built on the 13 Astra game reports
category: dev
docsOnly: true
created: 2026-10-17
---

# Astra Week 6 - slate portfolio session (Platinum Rose)

## Activation (paste as the first message of a fresh session)

```text
Run the Platinum Rose Week 6 Astra PORTFOLIO synthesis (all 13 games at once).
Repo: E:\dev\projects\NFL_Dashboard (device_bash: $HOME/mnt/dev/projects/NFL_Dashboard).
Read agents/dev/ASTRA_W06_PORTFOLIO_SESSION_PROMPT.md and follow it.
NO PINS, NO STOP GATES, NO EMPTY OUTPUTS: every gate/hash/roster/kickoff/condition issue is a note, never a stop. You MUST output exactly 12 ranked picks, 3 parlays and 3 teasers, plus the SuperContest five.
Outputs: reports/intel/portfolio/2026-w06-astra-portfolio.md ; data/research-intel/proposed/portfolio-w06/2026-w06-astra-portfolio.json ; append one line to reports/intel/games/2026-w06-astra-RUNLOG.md.
```

## 1. Mission

Turn the 13 per-game Astra reports into one decision-ready slate card: the 12 best picks, parlays and teasers, ranked, with price sensitivity and a reason each. It is a proposal Andy reacts to. You place nothing.

The per-game reports are deliberately cautious (many say `research_only` or `skip` because a single game showed under ~1 point of simulator edge). That caution is an input, not your output. Your job is RELATIVE: across the whole slate, which 12 are best? A pick can be thin and still rank in the top 12; say so with a conviction grade instead of dropping it.

## 2. The no-empty-output rules (these override everything below)

1. You MUST produce exactly 12 ranked picks, 3 parlays, 3 teasers and the SuperContest five. If fewer than 12 clear a normal bar, fill the card with the best remaining and label each with conviction A / B / C and a one-line "why it is only a C". Never return "no plays", "insufficient edge", or a shorter list.
2. Gates, pins, HEAD, hashes, roster status, kickoff time, open conditions and stale data are NOTES. Record them in `Gate notes` and as per-pick caveats. They never stop the run, never remove a pick from consideration on their own, and never justify an empty section.
3. Unconfirmed availability (Caleb Williams, A.J. Brown, inactives, roof): use the stated scenario that is more likely, name the flip condition, and keep the pick. For a pick whose whole case depends on unconfirmed news, mark it `news-dependent` and pair it with a hedge or an alternative; do not drop it.
4. If a price is not in the captured boards (BKR/BEO) use the best available number and mark it `price-est.`; show the break-even price so Andy can check it at the book. A missing price alone never removes a pick.
5. If you are unsure between two readings, pick one, state the other in one line, and move on. Do not ask questions; do not wait.
6. Finish in one pass. Do not re-hash files, do not rerun `roster:vet`, do not re-verify things already marked verified in the game reports.

Hard prohibitions (the only rules that bind): no wagers or sportsbook clicks, no TheOddsAPI, no Supabase writes, no paid model/API calls (Gemini, AssemblyAI, OpenAI), no changes to the ledger/portfolio/official picks, no git add -A / reset / clean / stash / commit / push. Touch only the output files in section 7. Stakes: give no dollar amounts; use relative weight (1-3 units of "confidence") only.

## 3. Inputs (read in this order; stop reading when you have enough)

1. All 13 game reports: `reports/intel/games/2026-w06-astra-*_at_*.md` and the structured `data/research-intel/proposed/games-w06/2026-w06-astra-*.json` (disposition, tier, adjustments, sim_runs, market_snapshot, ambiguities, delta_checklist). Read the JSON first, then only the report sections you need. Run log: `reports/intel/games/2026-w06-astra-RUNLOG.md`.
2. Market: `data/odds/BKR_current_lines_1017_1240_buildfmt` (Sat 12:40 PM PT baseline), BetOnline artifacts (`BEO`, latest 2:15 PM PT), `data/supercontest/week-06-lines.json` (contest locked lines), `data/generated/master-intel/w06-splits-all.json` (spread/total splits 11:14 AM PT; moneyline splits are the stale Thursday pull, state the age).
3. Analytics: `data/research-intel/proposed/2026-w06-quantitative-synthesis.json`, FTN context (weekly, current as of 10/16), `data/generated/master-intel/big-money-flags-2026-w06.json`, `w06-expert-verified.json`.
4. Wider intel: `data/podcasts/youtube-extracted-picks-2026-w06.json` (APPROVED signals; reprice, note line movement), `data/research-intel/review/w06-article-leads-read-2026-10-17.json` (26 read sources; analyst leads, not picks), `data/generated/master-intel/w06-email-props-cody-brown.json`, `scratch/w06-astra-synthesis-queue.json` (packets, if you need a source row).
5. Roster/availability: `data/generated/master-intel/w06-roster-vet.json` (read only; do not rerun). Never infer player team/role/status from memory. Roster map uses WSH; schedule uses WAS.
6. Weather/venue: `data/research-intel/review/2026-w06-weather-venue.json` (forecast, not observation). ATL and IND are retractable roofs; LV is a fixed dome.
7. Simulator: `scripts/intel/margin-simulator.mjs` (run `--selftest` once). It re-centres on whatever line you give it, so a line move changes the call only through the price. Judgment adjustments are yours, stated with a reason each (soft cap 2.0 points, hard cap 3.0). Props, team totals, SGPs and teasers have no calibrated joint model: do not present them as model probabilities.

## 4. Known facts (verify against the game reports; do not infer)

- PHI: Hurts OUT, McKee starts. Millman's CAR +1.5 predates that; CAR is now about -3.
- BAL: Lamar Jackson out per ESPN, Huntley starts; Lamar-conditional article/podcast picks are void. TB: Mayfield out per ESPN, Daniels operator-recorded.
- CHI: Williams unconfirmed until Sunday morning. NE: A.J. Brown day-to-day. WAS RB Croskey-Merritt reported Out.
- Isaiah Likely is on NYG; his anytime-TD (+225) is unverified. Najee Harris: unresolved, do not use.
- SEA@DEN is final and out of scope.
- WAS@SF weather file has impossible wind/gust values: make no wind claim there.

## 5. Method

1. Build the board: one row per game with the per-game lean, tier, sim cover % vs break-even at the captured price, market vs model gap, opener-to-current movement, split/consensus read, key availability risk and the flip condition.
2. Score every candidate (sides, totals, moneylines, verified-price props, contest lines) on one comparable scale: `edge_pts` (sim cover % minus break-even, or model-vs-market points), `consensus` (independent expert/article/podcast agreement after repricing), `price_vs_market` (is the number still there?), `news_risk`, `correlation_value`. Show the scores in a table. Rank by a transparent composite; ties go to the more robust pick (less news-dependent, price still available).
3. Counter-case for each of the 12: one sentence on why the other side is right.
4. Compare against the "greater body of intel": for each pick, state where market data, analytics (quant model/FTN) and expert intel agree or disagree, and what that does to conviction. Disagreement lowers the grade; it does not delete the pick.
5. Honesty: if the sim shows ~0 edge, say so in the grade (C) rather than inflating the number. Never present a prop, parlay or teaser as a calibrated probability.

## 6. Required sections

1. **Header**: as-of PT time, generated UTC, HEAD (note only), kickoff windows, data ages.
2. **Gate notes**: every issue found, one line each, none of them blocking.
3. **Slate board** (13 rows, section 5.1).
4. **Top 12 picks**, ranked 1-12: game, market (side/total/ML/prop), line and price at the captured board, break-even, sim/model cover %, conviction A/B/C, 1-3 confidence units, reasons with `[Source: path, field, timestamp]`, counter-case, what would change it, last-look checklist (inactives, roof, line). Include at most 3 props, and only with a captured price (else `price-est.`).
5. **Parlays (exactly 3)**: a) safest 2-3 leg, b) value 3-4 leg, c) one upside/island-style player-prop parlay. Legs from different games unless a same-game pairing has a stated positive correlation. Show combined price estimate, the weakest leg, and a swap-out leg. Flag that parlay probabilities are rough products, not calibrated.
6. **Teasers (exactly 3)**: 2-team (and one 3-team if justified) 6-point teasers using captured lines. Prefer legs that cross 3 and 7 (favorites moving from about -7.5 to -8.5 down to -1.5/-2.5, underdogs from about +1.5/+2.5 up to +7.5/+8.5), exclude totals unless clearly justified, and avoid legs with unconfirmed QB/weather risk. If teaser prices were not captured, use the standard -120 for 2-team as `price-est.` and show the break-even (about 54.5% per teaser at -120, so each leg about 73.8%) and your estimate of whether the legs clear it.
7. **SuperContest five**: five picks on the locked contest lines (`week-06-lines.json`), one side per game, ranked, with a note where contest line differs from the current market (contest numbers are stale; a pick can be right at the contest number and wrong at today's number).
8. **Portfolio view**: correlation/overlap across picks, the games you are most exposed to, a "do nothing until X" list, and a Sunday-morning refresh list (Williams decision, inactives, A.J. Brown, Barkley hedge, Likely price, IND/ATL roof, weather).
9. **Not played and why**: the games/markets that missed the cut, one line each.
10. **Ambiguity / missing data**: named, not smoothed over.

## 7. Outputs (the Claude team reads these from the repo)

- Report: `reports/intel/portfolio/2026-w06-astra-portfolio.md` (create the directory if needed).
- Structured: `data/research-intel/proposed/portfolio-w06/2026-w06-astra-portfolio.json` with keys: generated_at, head, gate_notes[], board[], picks[12], parlays[3], teasers[3], supercontest_five[5], portfolio_view, not_played[], ambiguities[], refresh_list[]. No `ticket`, `stake`, `wager_amount`, `bet_slip` or `payout` keys.
- Run log: append ONE line to `reports/intel/games/2026-w06-astra-RUNLOG.md`: `UTC time | PORTFOLIO | HEAD | COMPLETE | 12 picks / 3 parlays / 3 teasers | files`.
- Do not commit. Finish with a short summary: the 12 picks in order (one line each), the 3 parlays, the 3 teasers, the top 2 risks, and the output paths. Andy or the Claude team stages the paths by name.
