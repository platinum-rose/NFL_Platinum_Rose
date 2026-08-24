# Futures Synthesis Prompt Handoff - 2026-08-11 13:55 PT

## Current State

- Branch: `main`
- Verified HEAD: `85fee49` (`docs: mark LINT_CLEANUP_BACKLOG_2026-08-09.md complete (212/212)`)
- Tracking: `main...origin/main [ahead 14]`
- Working tree: intentionally dirty after futures-data refresh and prompt-context edits; preserve unrelated dirty/untracked boundaries and stage narrowly.
- Latest prior timestamped handoff: `handoffs/2026-08-11-0209-futures-synthesis-readiness-handoff.md`
- Current handoff: `handoffs/2026-08-11-1355-futures-synthesis-prompt-handoff.md`

## What Changed This Session

- Created and filled-in-context worksheet:
  - `docs/FUTURES_PORTFOLIO_GOAL_CONTEXT_QUESTIONS_2026-08-11.md`
- Ingested the filled worksheet into the reusable maximum-effort futures synthesis prompt.
- Updated the prompt context in:
  - `HANDOFF_PROMPT.md`
  - `handoffs/2026-08-11-0209-futures-synthesis-readiness-handoff.md`
- No synthesis was run.
- No fresh dossier was built.
- No paid/frontier model/API call was made.
- No Supabase write, official-pick approval, production recommendation persistence, portfolio/open-parlay mutation, open-parlay fill/close, git stage, commit, or push was performed.

## Current Prompt Improvements

The reusable prompt now carries forward the filled goal-context worksheet:

- Portfolio objective is a balanced mix of EV and a realistic one-large-payout path.
- Practical success is multiple playoff/Super Bowl routes alive late plus live hedge optionality; ultimate goal remains profit.
- Keep roughly `$200-$250` of the `$500` bankroll uncommitted for in-season opportunities through about Week 8.
- Bills/Packers remain conviction anchors and rooting interests, while stronger standalone alternate paths can be presented with thesis and reasoning.
- Bills-Packers exact matchup/exacta remains the ultimate payout target, with minimum worse-than-current acceptable entry `+4500`.
- Exactas stay monitor-only until exact two-team rows plus multiple-book confirmation and secondary price shopping.
- Bills AFC, Packers NFC, division, playoff, and related positions can be ladder pieces rather than automatically redundant exposure.
- 2u can be used for any high-edge candidate; longshots can size up to 1u.
- If a good current line may improve later, the synthesis should consider a 20%-of-intended-stake FOMO starter position and define the add trigger.
- Payout path matters more than CLV, but CLV/line movement still informs timing and price quality.
- BKR, BetUS, BetOnline, Kalshi, Polymarket, and major Vegas sportsbooks through proxy are possible execution venues when placeable and fee/liquidity adjusted.
- DraftKings/FanDuel and other California-unavailable online books are context only.
- Two-book confirmation is required for exactas and thin markets only.
- Stale lines need manual confirmation before recommendation.
- Watchlist targets are real-interest evaluation targets, not instructions: Bills ATB, Packers ATB, Giants wins over, Bengals ATB, Saints playoffs, Chiefs SB/exactas, plus force-evaluate Chargers, Lions, and Cowboys.
- The model may pass on any watchlist item but must give full reasoning.
- Open parlays are sunk/contingent upside, reliable enough for exposure math, and possible late-season hedge paths; parlay-fill ideas may be recommended only as future-approval-required.
- Trust sportsbook prices, prediction markets, expert dossiers, and articles most.
- Expert agreement is context only; pending/review-only podcast and article rows are weak context; cite analyst/source conflict explicitly.
- Starter-sensitive plays should be marked needs-depth-chart-confirmation.
- Roster weighting order: QB, OL, WR/TE, pass rush, secondary, coaching, schedule.
- OL cluster injuries are a strong downgrade; defensive-front injuries can boost opponent offense/win-total context.
- Force-check Patrick Mahomes injury status for Kansas City.
- Output should be ranked by action priority, give every candidate a status label, include a bankroll table, include official-pick-ready writeups only for candidates that pass all gates, and include a what-would-change-my-mind section for each major recommendation.

## Dirty Worktree Boundaries

The current dirty tree is broad and mostly belongs to the futures-data refresh from the prior readiness session. Do not sweep-stage.

Prompt/handoff files touched by the current prompt-context work:

- `HANDOFF_PROMPT.md`
- `docs/FUTURES_PORTFOLIO_GOAL_CONTEXT_QUESTIONS_2026-08-11.md`
- `handoffs/2026-08-11-0209-futures-synthesis-readiness-handoff.md`
- `handoffs/2026-08-11-1355-futures-synthesis-prompt-handoff.md`
- `HANDOFF.md` if updated to point at this handoff

Important existing dirty/untracked refresh boundaries to preserve unless intentionally working that lane:

- `data/futures-imports/*2026-08-10.json`
- `data/expert-dossiers/*.json`
- `data/player-availability/*`
- `data/prediction-markets/*`
- `data/projected-starters/2026/*`
- `data/shadow-harness/**`
- `data/training-camp/2026/*`
- `docs/antigravity/**`
- `docs/article-intel-review/**`
- `docs/player-availability/**`
- `docs/prediction-markets/**`
- `docs/projected-starters/**`
- `docs/FUTURES_ODDS_BETONLINE_2026-08-10_MANUAL_REVIEW.md`
- `scripts/build-betonline-0810-import.js`
- `scripts/build-intel-source-audit-report.js`
- `scripts/parse-futures-text.js`
- `scripts/youtube-podcast-sweep.js`
- `src/components/official-picks/OfficialPicksTab.jsx`
- `TASK_BOARD.md`

## Immediate Next Step

Start a fresh session to act on the prompt. The fresh session should:

1. Re-read the first-read files listed in the resume prompt.
2. Verify git status and preserve the dirty boundaries.
3. Confirm whether Andy approves any required live/paid/frontier model/API call and any fresh dossier build.
4. If approved, build/verify the fresh dossier only within the explicit approval boundary.
5. Run the maximum-effort synthesis with `--no-persist`, Bills/Packers primary spine, and the current personalized prompt context.
6. Return research output only unless Andy separately approves official-pick tracking, persistence, portfolio/open-parlay mutation, or parlay fill/close.

## Guardrails

- Do not run paid/frontier model/API calls without explicit approval.
- Do not build a fresh dossier if it requires credentials/service access without explicit approval.
- Do not write Supabase without explicit approval.
- Do not approve official picks or persist official-pick proposals without explicit approval.
- Do not persist production recommendations without explicit approval.
- Do not mutate portfolio/open parlays, fill/close parlays, or treat parlay-fill ideas as authorized actions without explicit approval.
- Do not stage broadly; do not use `git add -A`.
- Do not push git without explicit approval.
- No unapplied Supabase migration is part of this handoff task.

## Resume Prompt

```text
Resume in E:\dev\projects\NFL_Dashboard to act on the finalized maximum-effort futures synthesis prompt. First read HANDOFF.md, HANDOFF_PROMPT.md, WORKING-CONTEXT.md, TASK_BOARD.md, docs/LINT_CLEANUP_BACKLOG_2026-08-09.md, docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md, docs/spec-win-dist-and-coherence-sim.md, docs/FUTURES_PORTFOLIO_GOAL_CONTEXT_QUESTIONS_2026-08-11.md, handoffs\2026-08-11-0209-futures-synthesis-readiness-handoff.md, and handoffs\2026-08-11-1355-futures-synthesis-prompt-handoff.md. Verify git status before edits. Current verified state: main is ahead of origin/main by 14 commits at 85fee49; working tree is intentionally dirty after futures-data refresh and prompt-context edits; preserve unrelated dirty/untracked boundaries and stage narrowly.

Goal: set up and, only with explicit approval for any required paid/frontier model/API call or credentialed fresh dossier build, run the maximum-effort NFL futures synthesis using the freshest local data and filled goal-context worksheet. Treat synthesis as research and decision support, not bet placement. Before synthesis, verify current data lanes: Aug 10 BKR/BetUS/BetOnline imports, prediction-market map/coherence, YouTube/podcast review/freshness/agent summary, article intel review, availability/impact digest/projected starters/training camp, latest source audit, and July 30 packet constraints. Use BKR/BetUS/BetOnline, Kalshi, Polymarket, and major Vegas sportsbooks through proxy as possible execution venues when placeable and fee/liquidity adjusted; use DraftKings/FanDuel/other unavailable online books as context only.

Synthesis output must separate actionable now, watch/trigger, wait for better in-season entry, needs price, needs depth-chart or injury confirmation, conflicted intel, and pass. Rank by action priority and give every candidate a status label. Personal portfolio objective: balanced EV plus one-large-payout path, building around Bills and Packers as primary Super Bowl conviction anchors while allowing better standalone alternate paths if the model gives a clear thesis. Evaluate Bills-Packers exact Super Bowl matchup/exacta as the ultimate payout target if placeable, price-shoppable, and at least +4500; exactas remain monitor-only until exact two-team rows and multiple-book confirmation are satisfied. Judge supplemental futures by standalone edge and by how they hedge, ladder, or create playoff optionality around that Bills/Packers-centered portfolio. Bills AFC, Packers NFC, division, playoff, and related positions can be ladder pieces rather than redundant exposure by default.

Carry forward $500 futures bankroll, $20 unit, allowed sizes 0.25u/0.5u/1u/2u, Bills Super Bowl target cap $200, Packers Super Bowl target cap $200, and a target reserve of $200-$250 for in-season opportunities through about Week 8. 2u is allowed for any high-edge candidate; longshots can be sized up to 1u. If a current line is good but a better entry may appear, consider a 20%-of-intended-stake FOMO starter position and define the add trigger. Avoid heavy over-leverage on a single team except Bills/Packers; show total team-linked exposure across SB/conference/division/wins/playoffs/exactas/open parlays when recommending concentration. Official tracked paper picks still require placeable book/source, timestamped odds, minimum edge threshold, confidence grade, written market view, football view, disconfirming factor, evidence IDs, and human verification.

For every candidate include market, team/player/side, best current price and book, fair price or edge if locally derivable, source references/evidence IDs, data confidence, risks, opposing/conflicting intel, disconfirming factor, correlation exposure, proposed size in $20 units against the $500 bankroll, whether to buy now or wait, expected in-season price-change path, and exact trigger if not actionable now. Buy-now vs wait analysis must use schedule shape, expected rough starts, injury uncertainty, public narrative, market drift, and line movement/CLV where snapshots exist. Compare current BKR/BetUS/BetOnline against prior imports and market/context lanes where available; label movement as steam, stale, adverse move, no meaningful movement, or insufficient history. Do not treat stale lines as automatic bets; stale lines need manual confirmation. Explain whether movement improves edge, confirms market agreement, or warns that the price is gone. Payout path matters more than CLV, but CLV still informs timing and price quality. Use matched-line win-total edges, board-validator flags, and schedule Monte Carlo coherence fields where present; where value_gap is null or market depth is thin, treat sim probability as context and require placeable validation before carding anything.

Use the human watchlist as real-interest evaluation targets, not instructions: Bills ATB, Packers ATB, Giants wins over, Bengals ATB, Saints make playoffs, Chiefs SB/exactas, plus force-evaluate Chargers, Lions, and Cowboys. The model may pass on any watchlist item but must give full reasoning. Treat open parlays as sunk/contingent upside, reliable enough for exposure math, and a possible late-season hedge path; existing open parlays are past expiration but not removed, and new open parlays have a 30-day expiration notice requiring at least one open leg filled to stay active. Recommend parlay-fill ideas only as future-approval-required.

Trust sportsbook prices, prediction markets, expert dossiers, and articles most. Treat expert agreement as context, not authority; summarize pending/review-only podcast and article rows only as weak context; cite analyst/source conflict explicitly. Mark starter-sensitive plays needs-depth-chart-confirmation because projected starters are estimated. Weight roster factors in this order: QB, OL, WR/TE, pass rush, secondary, coaching, schedule. Treat OL cluster injuries as a strong downgrade, defensive-front injuries as possible boosts to opponent offense/win-total context, and force-check Patrick Mahomes injury status for Kansas City.

Final output should include a bankroll table showing current, proposed, and remaining exposure; official-pick-ready writeups for candidates that pass all gates; and a what-would-change-my-mind section for each major recommendation. Guardrails: do not run paid/frontier model/API calls, build a fresh dossier, write Supabase, approve official picks, persist recommendations, mutate portfolio/open parlays, fill/close parlays, stage broadly, or push git without explicit approval. If running the existing portfolio synthesis CLI after explicit approval, prefer the established Bills/Packers run shape and no-persist boundary, updated to a fresh dossier: node agents/portfolio-synthesize.js --dossier <fresh-dossier-json> --models <approved-frontier-model> --shadow-slim --no-persist --primary "Buffalo Bills,Green Bay Packers" --out-suffix <dated-suffix>.
```

