# Futures Synthesis Readiness Handoff - 2026-08-11

## Current State

- Branch: `main`
- Verified HEAD: `85fee49` (`docs: mark LINT_CLEANUP_BACKLOG_2026-08-09.md complete (212/212)`)
- Tracking: `main...origin/main [ahead 14]`
- Working tree: dirty by design after futures-data refresh; preserve unrelated boundaries and stage narrowly.
- Explicit guardrails: no paid/frontier model/API calls, Supabase writes, official-pick approvals, production recommendation persistence, portfolio/open-parlay changes, or git push without Andy's explicit approval.

## Completed This Session

- Fixed F-29b Official Picks confidence formatting in `src/components/official-picks/OfficialPicksTab.jsx`; confidence values like `55` no longer render as `5500.0%`.
- Marked F-29b complete in `TASK_BOARD.md`.
- Refreshed research/article intel: latest article review has 101 articles, 1 actual pick, 59 market leads, 299 analysis notes.
- Re-authorized YouTube OAuth, rediscovered account sources, and refreshed YouTube futures candidate discovery.
- Fixed the YouTube futures candidate filter so non-NFL football futures, e.g. MAC football previews, are excluded from Gemini futures eligibility.
- Processed new YouTube/podcast-video futures observations, including NFC South, NFC West, AFC South, Ravens preview, and Hall of Fame Game context.
- Rebuilt YouTube futures review, agent intel summary, freshness reconciliation, podcast deep dives, and expert dossiers.
- Processed Aug 10 BKR, BetUS, and BetOnline odds imports.
- Added BetOnline Aug 10 screenshot normalization via `scripts/build-betonline-0810-import.js` and `docs/FUTURES_ODDS_BETONLINE_2026-08-10_MANUAL_REVIEW.md`.
- Archived processed raw odds sources under `docs/Futures_Odds/_processed/`.
- Patched source audit so archived processed odds sources are still found.
- Refreshed prediction-market mapping/coherence, player availability, starter-impact digest, projected-starters estimate, training-camp scout, article review, and source audit.

## Current Readiness Snapshot

- Source audit: frontier-ready/passable. Latest JSON: `.nfl/source-audit/nfl-intel-source-audit-2026-08-11T08-12-47-917Z.json`; latest HTML: `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`.
- Primary book odds:
  - `data/futures-imports/bookmaker-2026-08-10.json` - 256 rows.
  - `data/futures-imports/betus-2026-08-10.json` - 416 rows.
  - `data/futures-imports/betonline-2026-08-10.json` - 127 rows.
  - Caveat: BetOnline is missing Tampa Bay win total and does not include make-playoffs screenshots.
- Podcast/YouTube:
  - `data/shadow-harness/reports/youtube-futures-intel-review-latest.json`: 16 observed, 14 usable, 87 extracted picks, 65 notes, missing 0, reprocess 2.
  - `data/shadow-harness/review/podcast-youtube-freshness-latest.json`: accepted 45, review-only 82.
  - Caveat: two old QB-list reprocess rows are stale/manual-recovery weirdness, not true blockers.
- Articles:
  - `data/research-intel/review/article-intel-review-latest.json`: 101 articles, 1 actual pick, 59 market leads, 299 notes.
- Availability/starters/training camp:
  - `data/player-availability/latest.json`: 850 events, 32 teams.
  - `data/player-availability/impact-digest-latest.json`: 216 starter-matched events.
  - `data/projected-starters/2026/latest.json`: 224 estimated starter signals; manual depth-chart rows 0, so all 32 teams need manual depth-chart confirmation.
  - `data/training-camp/2026/latest.json`: 322 items, 31 teams with intel, 1 team without intel.
- Prediction markets:
  - `data/prediction-markets/team-market-map-latest.json`: 745 mapped, 1248 unmapped, 1542 liquidity warnings.
  - `data/prediction-markets/cross-market-coherence-latest.json`: 32 teams, 15 incoherent, 20 ladder inversions, 1 nesting violation.
  - Use as consensus/context only, not execution prices.

## Important Caveats For Synthesis

- Treat BKR, BetUS, and BetOnline as primary execution-price sources.
- Treat public/API odds and prediction markets as market-shape context unless a price is explicitly placeable.
- Podcast/YouTube/article intel is research context unless promoted through the appropriate human review gate.
- Review-only/context-only podcast items are not picks.
- The Ravens preview produced useful AFC North/BAL context but its pick-shaped rows need review and lack prices.
- Hall of Fame Game extraction is preseason/game-pick context, not futures.
- Projected starters are estimated from local language only; manual depth charts are the biggest remaining quality caveat.
- Futures can be added in-season. For every candidate, evaluate whether the current price is worth taking now or whether schedule shape, injury uncertainty, early-season volatility, public narrative, or expected market drift creates a better wait-for-entry setup.
- The portfolio is Bills/Packers-centered: evaluate Bills and Packers Super Bowl futures as primary anchors, Bills-Packers exact matchup/exacta as the ultimate payout target if placeable/price-shoppable, and supplemental futures as playoff hedge/ladder/coverage tools around that core rather than isolated picks.
- Carry forward the July 30 portfolio constraints from `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md`: futures bankroll `$500`, futures unit `$20`, allowed unit sizes 0.25u/0.5u/1u/2u, Bills SB target cap `$200`, Packers SB target cap `$200`, and open parlays as open/unverified contingent assets only.
- Carry forward the filled goal-context worksheet from `docs/FUTURES_PORTFOLIO_GOAL_CONTEXT_QUESTIONS_2026-08-11.md`: balanced EV plus one-large-payout path; keep `$200-$250` uncommitted for in-season adds through about Week 8; Bills/Packers remain conviction anchors while better standalone alternate paths can be shown with thesis; Bills-Packers exacta minimum worse-than-current entry `+4500`; 2u allowed for any high-edge candidate; longshots can be up to 1u; consider 20%-of-intended-stake FOMO starter positions when a good line might improve; payout path matters more than CLV; stale lines require manual confirmation.
- Use the human-maintained watchlist as evaluation targets, not betting instructions: `buf-anchor-atb`, `gb-anchor-atb`, `nyg-wins-over`, `cin-atb`, `no-playoffs`, and `kc-sb-exactas`.
- Also force-evaluate Chargers, Lions, and Cowboys.
- Exact Super Bowl matchup/exacta plays are monitor-only unless exact two-team rows exist and secondary price-shopping validation is satisfied.
- Require multiple-book confirmation for exactas/thin markets only. Kalshi, Polymarket, and major Vegas books through proxy are placeable if fee/liquidity adjusted; DraftKings/FanDuel and other California-unavailable online books are context only.
- Treat open parlays as sunk/contingent upside, reliable enough for exposure math, and possible late-season hedge paths. Existing open parlays are past expiration but not removed; new open parlays have a 30-day expiration notice requiring at least one open leg filled to stay active. Parlay-fill ideas may be recommended only as future-approval-required.
- Trust sportsbook prices, prediction markets, expert dossiers, and articles most; expert agreement is context only; pending/review-only podcast and article rows are weak context; cite analyst/source conflict explicitly.
- Mark starter-sensitive plays needs-depth-chart-confirmation; weight roster factors QB, OL, WR/TE, pass rush, secondary, coaching, schedule; force-check Patrick Mahomes injury status for Kansas City.
- Any official tracked paper pick still requires placeable book/source, timestamped odds, minimum edge threshold, confidence grade, written football/market rationale, disconfirming factor, evidence IDs, and human verification.

## Resume Prompt

```text
Resume in E:\dev\projects\NFL_Dashboard. First read HANDOFF.md, HANDOFF_PROMPT.md, WORKING-CONTEXT.md, TASK_BOARD.md, docs/LINT_CLEANUP_BACKLOG_2026-08-09.md, docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md, docs/spec-win-dist-and-coherence-sim.md, docs/FUTURES_PORTFOLIO_GOAL_CONTEXT_QUESTIONS_2026-08-11.md, and handoffs\2026-08-11-0209-futures-synthesis-readiness-handoff.md. Verify git status before edits. Current verified state: main is ahead of origin/main by 14 commits at 85fee49; working tree is intentionally dirty after futures-data refresh; preserve unrelated dirty/untracked boundaries and stage narrowly. Guardrails: no paid/frontier model/API calls, Supabase writes, official-pick approvals, production recommendation persistence, portfolio/open-parlay changes, open-parlay filling/closing, or git push without explicit approval.

Goal: run a maximum-effort NFL futures synthesis using the freshest local data and filled goal-context worksheet. Treat it as research/decision support, not bet placement. Before synthesis, verify current data lanes: Aug 10 BKR/BetUS/BetOnline imports, prediction-market map/coherence, YouTube/podcast review/freshness/agent summary, article intel review, availability/impact digest/projected starters/training camp, latest source audit, and July 30 packet constraints. Use BKR/BetUS/BetOnline, Kalshi, Polymarket, and major Vegas sportsbooks through proxy as possible execution venues when placeable and fee/liquidity adjusted; use DraftKings/FanDuel/other unavailable online books as context only.

Synthesis output must separate actionable now, watch/trigger, wait for better in-season entry, needs price, needs depth-chart or injury confirmation, conflicted intel, and pass. Rank by action priority and give every candidate a status label. Personal portfolio objective: balanced EV plus one-large-payout path, building around Bills and Packers as primary Super Bowl conviction anchors while allowing better standalone alternate paths if the model gives a clear thesis. Evaluate Bills-Packers exact Super Bowl matchup/exacta as the ultimate payout target if placeable, price-shoppable, and at least +4500; exactas remain monitor-only until exact two-team rows and multiple-book confirmation are satisfied. Judge supplemental futures by standalone edge and by how they hedge, ladder, or create playoff optionality around that Bills/Packers-centered portfolio. Bills AFC, Packers NFC, division, playoff, and related positions can be ladder pieces rather than redundant exposure by default.

Carry forward $500 futures bankroll, $20 unit, allowed sizes 0.25u/0.5u/1u/2u, Bills Super Bowl target cap $200, Packers Super Bowl target cap $200, and a target reserve of $200-$250 for in-season opportunities through about Week 8. 2u is allowed for any high-edge candidate; longshots can be sized up to 1u. If a current line is good but a better entry may appear, consider a 20%-of-intended-stake FOMO starter position and define the add trigger. Avoid heavy over-leverage on a single team except Bills/Packers; show total team-linked exposure across SB/conference/division/wins/playoffs/exactas/open parlays when recommending concentration. Official tracked paper picks still require placeable book/source, timestamped odds, minimum edge threshold, confidence grade, written market view, football view, disconfirming factor, evidence IDs, and human verification.

For every candidate include market, team/player/side, best current price and book, fair price or edge if locally derivable, source references/evidence IDs, data confidence, risks, opposing/conflicting intel, disconfirming factor, correlation exposure, proposed size in $20 units against the $500 bankroll, whether to buy now or wait, expected in-season price-change path, and exact trigger if not actionable now. Buy-now vs wait analysis must use schedule shape, expected rough starts, injury uncertainty, public narrative, market drift, and line movement/CLV where snapshots exist. Compare current BKR/BetUS/BetOnline against prior imports and market/context lanes where available; label movement as steam, stale, adverse move, no meaningful movement, or insufficient history. Do not treat stale lines as automatic bets; stale lines need manual confirmation. Explain whether movement improves edge, confirms market agreement, or warns that the price is gone. Payout path matters more than CLV, but CLV still informs timing and price quality. Use matched-line win-total edges, board-validator flags, and schedule Monte Carlo coherence fields where present; where value_gap is null or market depth is thin, treat sim probability as context and require placeable validation before carding anything.

Use the human watchlist as real-interest evaluation targets, not instructions: Bills ATB, Packers ATB, Giants wins over, Bengals ATB, Saints make playoffs, Chiefs SB/exactas, plus force-evaluate Chargers, Lions, and Cowboys. The model may pass on any watchlist item but must give full reasoning. Treat open parlays as sunk/contingent upside, reliable enough for exposure math, and a possible late-season hedge path; existing open parlays are past expiration but not removed, and new open parlays have a 30-day expiration notice requiring at least one open leg filled to stay active. Recommend parlay-fill ideas only as future-approval-required.

Trust sportsbook prices, prediction markets, expert dossiers, and articles most. Treat expert agreement as context, not authority; summarize pending/review-only podcast and article rows only as weak context; cite analyst/source conflict explicitly. Mark starter-sensitive plays needs-depth-chart-confirmation because projected starters are estimated. Weight roster factors in this order: QB, OL, WR/TE, pass rush, secondary, coaching, schedule. Treat OL cluster injuries as a strong downgrade, defensive-front injuries as possible boosts to opponent offense/win-total context, and force-check Patrick Mahomes injury status for Kansas City.

Final output should include a bankroll table showing current, proposed, and remaining exposure; official-pick-ready writeups for candidates that pass all gates; and a what-would-change-my-mind section for each major recommendation. Do not create official picks or persist recommendations without Andy's approval.

If running the existing portfolio synthesis CLI after explicit approval, prefer the established Bills/Packers run shape and no-persist boundary, updated to a fresh dossier: `node agents/portfolio-synthesize.js --dossier <fresh-dossier-json> --models <approved-frontier-model> --shadow-slim --no-persist --primary "Buffalo Bills,Green Bay Packers" --out-suffix <dated-suffix>`.
```


## Final Prompt Review Resume Prompt

```text
Resume in E:\dev\projects\NFL_Dashboard for a final review of the maximum-effort futures synthesis prompt before running synthesis. First read HANDOFF.md, HANDOFF_PROMPT.md, WORKING-CONTEXT.md, TASK_BOARD.md, docs/LINT_CLEANUP_BACKLOG_2026-08-09.md, docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md, docs/spec-win-dist-and-coherence-sim.md, and handoffs\2026-08-11-0209-futures-synthesis-readiness-handoff.md. Verify git status before edits. Current verified state from the prior session: main is ahead of origin/main by 14 commits at 85fee49; working tree is intentionally dirty after futures-data refresh; preserve unrelated dirty/untracked boundaries and stage narrowly.

Goal: audit the max-effort synthesis prompt itself, not run synthesis yet. Confirm it fully carries forward the July 30 futures packet and persistent portfolio preferences: Bills/Packers as the primary Super Bowl anchor spine, Bills-Packers exact matchup/exacta as the ultimate payout target if placeable and price-shoppable, supplemental futures as hedge/ladder/playoff optionality, $500 bankroll, $20 unit, 0.25u/0.5u/1u/2u sizing, Bills/Packers SB target caps, watchlist targets as evaluation targets only, exactas monitor-only until exact two-team rows plus secondary price shopping, open parlays as open/unverified contingent assets only, and official tracked paper-pick requirements.

Also verify the prompt requires buy-now vs wait-for-better-in-season-entry analysis for every candidate, using schedule shape, expected rough starts, injury uncertainty, public narrative, market drift, and line movement/CLV where snapshots exist. It should require movement labels such as steam, stale, adverse move, no meaningful movement, or insufficient history, and should not treat stale lines as automatic bets.

Output: identify any missing prompt requirements, patch the handoff prompt if needed, and then provide the final reusable synthesis prompt. Do not run paid/frontier model/API calls, build a fresh dossier, write Supabase, approve official picks, persist recommendations, mutate portfolio/open parlays, fill/close parlays, or push git without explicit approval.
```
