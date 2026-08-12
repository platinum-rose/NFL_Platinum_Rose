# HANDOFF_PROMPT.md - NFL Platinum Rose

## Current Session Summary

- Date: 2026-08-12 UTC / 2026-08-12 Pacific.
- Branch: `main`.
- Current local HEAD: `f54712351b663b45c95db643c792241fbebe5019`.
- Parity verified: local `HEAD`, cached `origin/main`, and M6 checkout all resolve to `f54712351b663b45c95db643c792241fbebe5019`.
- Working tree: G01-G03 futures evidence cleanup checkpoint is committed locally; unrelated dirty boundaries remain unstaged.
- Latest timestamped handoff: `handoffs/2026-08-12-0054-futures-evidence-cleanup-postcommit-handoff.md`.
- Current objective: continue after the completed futures evidence cleanup G01-G03 tranche.
- Local checkpoint commit: `961b6e9` (`fix: gate and verify futures evidence rebuild`). No git push has been performed.
- Completed roadmap items: A01/A02/A05 and G01/G02/G03 in `docs/FUTURES_EVIDENCE_CLEANUP_ROADMAP_2026-08-11.md`.
- Latest article review: 292 records, complete requested DB window, zero unresolved pick-oriented rows, zero `actual_picks`, and 10 explicit selections held out for price/venue verification.
- Latest strict source audit: `PASSABLE`, Current 2 / Review 25 / Stale 0 / Blocked 0 / Missing 0 / Context 12.
- Latest deterministic rebuild manifest: `.nfl/rebuild/futures-evidence-rebuild-2026-08-12T05-30-00-000Z.json`.
- Latest final verification receipt: `.nfl/verification/futures-evidence-verification-2026-08-12T05-40-00-000Z.json`, PASS.
- Unstaged dirty boundaries to preserve unless explicitly approved: `TASK_BOARD.md`, `WORKING-CONTEXT.md`, `Complete_with_Docusign_Personal_Use_-_Andrew_NFL_Dashboard_Yahoo_API_agreement.pdf`, and `docs/antigravity/recovery/youtube-qoCm4G2Jmng-contested-datapoints-review.md`.
- Guardrails: no paid/frontier model/API calls, Supabase writes, official-pick actions, production recommendation persistence, portfolio/open-parlay mutations, git push, or broad staging without explicit approval.

> Rolling session handoff. Read this first in a fresh session, then read `HANDOFF.md`, `WORKING-CONTEXT.md`, `TASK_BOARD.md`, and `handoffs/2026-08-12-0054-futures-evidence-cleanup-postcommit-handoff.md`.

## Persistent Backlogs

> Read the source file and mark items there, not in this handoff.

| Backlog | File | Open Items | Last Touched |
|---|---|---:|---|
| NFL Dashboard Audit Findings | `docs/NFL_AUDIT_BACKLOG.md` | Review current file before editing; this handoff did not modify it. | 2026-07-27 |
| Season Readiness | `docs/SEASON_READINESS_SMOKE_TEST_LATEST.md` | 6 watch items, 0 fails after service recovery. | 2026-07-30 |

## Last Session Summary

- Date: 2026-07-30 UTC / 2026-07-29 Pacific.
- Branch: `main`.
- Current pushed HEAD: `6d8acdc`.
- Working tree: dirty by design; stage narrowly.
- Latest timestamped handoff: `handoffs/2026-07-30-1259-codex-protocol-access-handoff.md`.
- Detailed crash-recovery handoff: `handoffs/2026-07-30-0635-crash-recovery-source-audit-handoff.md`.
- Prior completed checkpoint: `handoffs/2026-07-29-0405-season-readiness-youtube-futures-handoff.md`.
- Verification:
  - `npm.cmd run smoke:season -- --require-services --dev-base http://localhost:5174/platinum-rose-app` passed with `READY WITH WATCH ITEMS`.
  - Counts: PASS 11 / WARN 6 / FAIL 0 / INFO 1.
  - Dashboard, schedule asset, YouTube intel asset, official-picks inbox, and M6 health all returned HTTP 200.
  - `npm.cmd run intel:source-audit` was recalibrated around futures-portfolio synthesis freshness, excluding DK/FD bet-slip parser and weekly live-props plumbing from the current gate.
  - Last fully passing audit was `PASSABLE`: Current 2 / Review 17 / Stale 0 / Blocked 0 / Missing 0 / Context 7.
  - Current source audit is `PASSABLE`: Current 2 / Review 18 / Stale 0 / Blocked 0 / Missing 0 / Context 7. A fresh approved live RSS scout refreshed the app-facing July 30 training-camp files to 19 items across 10 teams, and player availability covers 796 events across all 32 teams with OL and defensive-front cluster flags.
  - Current source-audit artifacts: `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T16-50-56-165Z.json`, `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T16-50-56-165Z.html`, and `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`.
- Live/paid model calls during recovery: none by Codex.
- Supabase writes during recovery: none by Codex.
- Official-pick approvals: none.
- Open parlay changes: none.
- Latest pushed checkpoint: Training Camp Intel UI tab added and mojibake cleaned in `29065e9`; post-pipeline task plan committed in `26c85b2`.
- New pushed checkpoints after `12aa0cf`: fantasy value board (`4436095`), guarded overnight ops automation (`c797669`), secondary-matchup seed-gap exposure (`8695b57`), stale retry artifact gitignore cleanup (`d7fb7a0`), Antigravity `.agents/skills/` configs (`de5c9c0`), and Antigravity handoff refresh (`6d8acdc`).

## Current Objective

Continue from the crash-recovery triage checkpoint. The current objective is a maximum-effort frontier-model futures portfolio synthesis using the prepared local evidence packet. BetOnline July 29 screenshots are normalized, the fresh approved live training-camp RSS scout is written, player availability is snapshotted, and the source audit is passable. DK/FD bet-slip parsers and weekly live props are out of scope for this focus.

## Completed In Recovery

- Recovered local services after the crash:
  - Dashboard at `http://localhost:5174/platinum-rose-app/`.
  - Official picks inbox at `http://127.0.0.1:8787/api/inbox`.
  - M6 health at `http://127.0.0.1:5060/health`.
- Re-ran service-aware season smoke successfully.
- Regenerated source audit after service recovery:
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T06-37-17-726Z.json`
  - `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T06-37-17-726Z.html`
  - `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`
- Created `handoffs/2026-07-30-0635-crash-recovery-source-audit-handoff.md`.
- Split safe recovered work into narrow commits:
  - `87476f0` - Document crash recovery source audit state.
  - `0e64d66` - Add local source and article intel review tooling.
  - `9273269` - Import July 29 primary futures odds.
  - `642349e` - Refresh July 30 training camp intel snapshot.
  - `96376e1` - Recalibrate futures synthesis source audit.
  - `0cd942a` - Add futures synthesis source readiness checklist.
  - `f6cee97` - Clean podcast deep-dive synthesis evidence.
  - `817ec29` - Update futures synthesis handoff checkpoint.
  - `5b2db46` - Add frontier futures synthesis evidence packet.
  - `1c5cdee` - Document training camp source recovery.
  - `b0b57ed` - Point source audit at recovered camp snapshot.
- Created `handoffs/2026-07-30-0655-workstream-triage-handoff.md`.
- Refreshed `HANDOFF.md` and this rolling handoff so future sessions resume from the Camp Intel UI checkpoint.
- Recalibrated `scripts/build-intel-source-audit-report.js`:
  - Execution-only DK/FD bet-slip parser and weekly live-props checks no longer block the futures-synthesis freshness gate.
  - Stale structured BetOnline rows no longer count as stale if current July 29 BetOnline screenshots are present; the report requires manual review/normalization before using BetOnline as source of truth.
  - Review items no longer fail the frontier gate by themselves; they must be accepted, rejected, or caveated before model synthesis.
  - Empty training-camp latest snapshots now include the recovered 16-item snapshot path in the audit action.
- Added `docs/FUTURES_SYNTHESIS_SOURCE_READINESS_2026-07-30.md` as the current source-acceptance checklist.
- Expanded podcast/deep-dive ad/legal filtering, regenerated the 57-episode deep-dive set, and documented source acceptance plus verification receipts in `docs/FUTURES_SYNTHESIS_SOURCE_READINESS_2026-07-30.md` and `docs/FUTURES_SYNTHESIS_REQUIREMENT_AUDIT_2026-07-30.md`.
- Added `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md` as the model-ready local evidence packet and approval-gated run path.
- Added BetOnline July 29 normalization:
  - `scripts/build-betonline-0729-import.js`
  - `data/futures-imports/betonline-2026-07-29.json`
  - `docs/FUTURES_ODDS_BETONLINE_2026-07-29_MANUAL_REVIEW.md`
  - `npm.cmd run futures:betonline-0729`, `node scripts/build-betonline-0729-import.js --check-only`, and `node scripts/ingest-futures-json.js --file data/futures-imports/betonline-2026-07-29.json --dry-run` passed with 160 rows and no DB write.
- Added local player-availability layer:
  - `agents/lib/player-availability.js`
  - `scripts/build-player-availability.js`
  - `data/player-availability/latest.json`
  - `docs/player-availability/player-availability-latest.md`
  - `npm.cmd run player-availability:live` generated 796 events across 32 teams with 121 improving, 194 worsening, 26 OL worsening, and 36 defensive-front worsening; no Supabase writes or model calls.

## Recovered Workstream Status

- New source audit tooling:
  - `scripts/build-intel-source-audit-report.js`
  - `npm.cmd run intel:source-audit`
  - `.nfl/source-audit/`
  - `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`
  - Status: committed in `0e64d66`, with latest successful report committed in `87476f0`.
- New article intel review tooling:
  - `scripts/build-article-intel-review.js`
  - `npm.cmd run article:intel-review`
  - `data/research-intel/review/`
  - `docs/article-intel-review/`
  - Status: committed in `0e64d66`.
- Research feed hardening:
  - `agents/research-intel-ingest.js`
  - Walter Football RSS added.
  - All-sports/non-NFL filtering tightened.
  - Status: committed in `0e64d66`.
- Training-camp refresh:
  - `data/training-camp/2026/latest.json`
  - `data/training-camp/2026/training-camp-intel-2026-07-30.json`
  - Latest receipt: 19 items, 32 teams, 10 teams with intel, Football Outsiders fetch failed.
  - Status: committed in `642349e`; recovery copy preserved under `data/training-camp/2026/recovered/`; `.nfl/training-camp/` reports and receipts remain untracked.
- Futures import/parser work:
  - `data/futures-imports/betus-2026-07-29.json`
  - `data/futures-imports/bookmaker-2026-07-29.json`
  - `scripts/parse-futures-text.js` guard for BetUS alternate season wins.
  - Status: committed in `9273269`.
- Podcast/deep-dive refresh:
  - Large generated changes under `data/podcasts/m6-diarized-all/`.
  - New July 21-23 episode files.
  - `docs/podcast-transcript-deep-dives/index.json` now shows 57 episodes.
  - Status: committed in `f6cee97`; ad/legal filter expanded again to catch sponsored-by copy and regenerated. Hard promo/legal scan is clean; remaining sportsbook mentions are price/context references.
- BetOnline July 29 normalization:
  - `scripts/build-betonline-0729-import.js` generates the import and manual review doc from all nine BEO screenshots.
  - `data/futures-imports/betonline-2026-07-29.json` has 160 rows: Super Bowl, AFC/NFC conference, all divisions, playoffs Yes, and wins.
  - `docs/FUTURES_ODDS_BETONLINE_2026-07-29_MANUAL_REVIEW.md` preserves playoff No-side prices not represented in the current uniform import schema.
  - Status: local-only and no-write verified; no Supabase promotion has happened.
- Player availability:
  - `scripts/build-player-availability.js` builds local JSON/Markdown/HTML from the ESPN injuries API plus training-camp availability-like notes.
  - `agents/portfolio-dossier.js` now includes compact `player_availability` per team for futures synthesis.
  - `agents/portfolio-synthesize.js` preserves `player_availability` in the compact model prompt and labels this section as injuries and player availability.
  - Status: local-only, review-context only; no Supabase writes, no official picks, and no model calls.
- Ops/documentation:
  - `scripts/overnight.js` adds research intel, training-camp scout, and daily brief steps.
  - New untracked `docs/NFL_DASHBOARD_USER_GUIDE.md`.
  - New untracked `infra/systemd/nfl-overnight.service` and `.timer`.
  - Status: still dirty; review separately because this changes live-fetch automation assumptions and contains Linux/encoding/command assumptions.

## Immediate Next Steps

1. Ask explicit approval before any paid/frontier model synthesis call.

2. Use `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md` as the evidence packet for the approval-gated frontier-model run, including `docs/player-availability/player-availability-latest.md` as injury/return context.

3. Keep no Supabase writes, recommendation persistence, official-pick approvals/proposals, or open-parlay changes without explicit approval.

4. Review `scripts/overnight.js`, `docs/NFL_DASHBOARD_USER_GUIDE.md`, and `infra/systemd/` separately before committing any ops automation.

5. Clean older retry artifacts only after deciding they are no longer useful crash-window evidence.

## Guardrails

- Do not make live paid model/API calls without explicit approval.
- Do not write Supabase, approve official picks, persist production recommendations, or modify open parlays without explicit approval.
- Podcast/YouTube/article/training-camp intel is reviewed local context only, not an official pick ledger.
- Keep QA output and generated artifacts distinct from analyst opinions or betting authorization.
- Stage narrowly; do not use `git add -A`.
- On resume, scan project-local `.codex/rules/`, `.codex/hooks.json`, `skills/`, `agents/`, and hook folders before planning. Use relevant local `SKILL.md` guidance and project agents/workflows when they fit the task, while keeping guardrails and explicit-approval boundaries intact.

## Futures Portfolio Goal Context

Filled worksheet: `docs/FUTURES_PORTFOLIO_GOAL_CONTEXT_QUESTIONS_2026-08-11.md`.

Use these preferences as current personalization input for the futures synthesis:

- Goal: balanced mix of expected value and a realistic path to one large payout. Ultimate goal is profit, with practical success measured by multiple playoff/Super Bowl routes alive late plus live hedge optionality.
- Portfolio cadence: build a chunk of preseason positions now, then use them to direct position changes or enhancements through about Week 8. Keep roughly `$200-$250` of the `$500` bankroll uncommitted for in-season opportunities.
- Core spine: Bills and Packers remain conviction anchors and rooting interests. The model may challenge them or present better standalone alternate paths, but those alternatives need a thesis and reasoning rather than replacing the spine by default.
- Exacta/matchup: Bills-Packers exact matchup remains the ultimate payout target. Minimum acceptable worse-than-current entry is `+4500`; monitor-only until multiple books confirm exact two-team rows and secondary price shopping.
- Ladders: Bills AFC, Packers NFC, Bills division, Packers division, and related positions can be used as ladders, not dismissed as redundant exposure.
- Sizing: 2u can be used for any high-edge candidate, not only anchors. Longshots can go up to 1u. Start with a wider basket of smaller correlated shots, then whittle down to the positions Andy likes best.
- Exposure: avoid heavy over-leverage on a single team except Bills/Packers. If the model wants more concentration on another team, it must call out total team-linked exposure across SB/conference/division/wins/playoffs/exactas/open parlays.
- Buy-now vs wait: if a good line may improve later, consider a 20%-of-intended-stake FOMO starter position, then add if the better setup arrives. A rough wait threshold is about 10% better expected entry. Payout path matters more than CLV, but line movement still informs timing and price quality.
- Schedule/narrative: the synthesis must use strength of schedule and intel to identify teams likely to start slow and improve. Public narrative inflation is unknown and should be evaluated from podcast/article/expert/market context where possible.
- Venues: BKR, BetUS, BetOnline, Kalshi, Polymarket, and major Vegas sportsbooks through proxy are placeable. DraftKings/FanDuel and other California-unavailable online books are not execution venues, though they may be context if clearly labeled.
- Confirmation: require two-book confirmation for exactas and thin markets only. Prediction markets may be execution venues if edge is net of fees and liquidity. Stale lines need manual confirmation before recommendation.
- Watchlist: current real-interest targets remain Bills ATB, Packers ATB, Giants wins over, Bengals ATB, Saints playoffs, Chiefs SB/exactas; also force-evaluate Chargers, Lions, and Cowboys. The model may pass on any watchlist target, but must give full reasoning.
- Open parlays: treat existing open parlays as sunk/contingent upside, reliable enough for exposure math, and a possible path to late-season hedging. Existing open parlays are past expiration but not removed; new open parlays will have a 30-day expiration notice requiring at least one open leg to be filled to keep active. Parlay-fill ideas may be recommended, but future approval is required before any fill or change.
- Intel weighting: trust sportsbook prices, prediction markets, expert dossiers, and articles most. Expert agreement is context only. Pending/review-only podcast and article rows can be summarized as weak context. Cite analyst/source conflict explicitly.
- Roster/injury: estimated starters are preliminary only; starter-sensitive plays should be marked needs-depth-chart-confirmation. Futures weight order: QB, OL, WR/TE, pass rush, secondary, coaching, schedule. OL cluster injuries are a stronger downgrade than skill-position uncertainty. Defensive-front injuries can boost opponent offense or win-total context. Force-check Patrick Mahomes injury status for Kansas City.
- Output: rank by action priority. Every candidate needs a status label. Include a final bankroll table showing current, proposed, and remaining exposure. Produce official-pick-ready writeups only for candidates that pass all gates, while preserving the guardrail that no official pick is created, approved, or persisted without explicit approval. Include a what-would-change-my-mind section for each major recommendation.

## Resume Command

```text
Resume in E:\dev\projects\NFL_Dashboard. First read HANDOFF.md, HANDOFF_PROMPT.md, WORKING-CONTEXT.md, TASK_BOARD.md, docs/LINT_CLEANUP_BACKLOG_2026-08-09.md, docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md, docs/spec-win-dist-and-coherence-sim.md, docs/FUTURES_PORTFOLIO_GOAL_CONTEXT_QUESTIONS_2026-08-11.md, and handoffs\2026-08-11-0209-futures-synthesis-readiness-handoff.md. Verify git status before edits. Current verified state: main is ahead of origin/main by 14 commits at 85fee49; working tree is intentionally dirty after futures-data refresh; preserve unrelated dirty/untracked boundaries and stage narrowly.

Goal: run a maximum-effort NFL futures synthesis using the freshest local data and the filled goal-context worksheet, only after explicit approval for any paid/frontier model/API call. Treat synthesis as research and decision support, not bet placement. Before synthesis, verify current data lanes: Aug 10 BKR/BetUS/BetOnline imports, prediction-market map/coherence, YouTube/podcast review/freshness/agent summary, article intel review, availability/impact digest/projected starters/training camp, latest source audit, and the July 30 futures packet constraints. Use BKR/BetUS/BetOnline, Kalshi, Polymarket, and major Vegas sportsbooks through proxy as possible execution venues when placeable and fee/liquidity adjusted; use DraftKings/FanDuel/other unavailable online books as context only.

Synthesis output must separate actionable now, watch/trigger, wait for better in-season entry, needs price, needs depth-chart or injury confirmation, conflicted intel, and pass. Rank by action priority and give every candidate a status label. Personal portfolio objective: balanced EV plus one-large-payout path, building around Bills and Packers as primary Super Bowl conviction anchors while allowing better standalone alternate paths if the model gives a clear thesis. Evaluate Bills-Packers exact Super Bowl matchup/exacta as the ultimate payout target if placeable, price-shoppable, and at least +4500; exactas remain monitor-only until exact two-team rows and multiple-book confirmation are satisfied. Judge supplemental futures by standalone edge and by how they hedge, ladder, or create playoff optionality around that Bills/Packers-centered portfolio. Bills AFC, Packers NFC, division, playoff, and related positions can be ladder pieces rather than redundant exposure by default.

Carry forward $500 futures bankroll, $20 unit, allowed sizes 0.25u/0.5u/1u/2u, Bills Super Bowl target cap $200, Packers Super Bowl target cap $200, and a target reserve of $200-$250 for in-season opportunities through about Week 8. 2u is allowed for any high-edge candidate; longshots can be sized up to 1u. If a current line is good but a better entry may appear, consider a 20%-of-intended-stake FOMO starter position and define the add trigger. Avoid heavy over-leverage on a single team except Bills/Packers; show total team-linked exposure across SB/conference/division/wins/playoffs/exactas/open parlays when recommending concentration. Official tracked paper picks still require placeable book/source, timestamped odds, minimum edge threshold, confidence grade, written market view, football view, disconfirming factor, evidence IDs, and human verification.

For every candidate include market, team/player/side, best current price and book, fair price or edge if locally derivable, source references/evidence IDs, data confidence, risks, opposing/conflicting intel, disconfirming factor, correlation exposure, proposed size in $20 units against the $500 bankroll, whether to buy now or wait, expected in-season price-change path, and exact trigger if not actionable now. Buy-now vs wait analysis must use schedule shape, expected rough starts, injury uncertainty, public narrative, market drift, and line movement/CLV where snapshots exist. Compare current BKR/BetUS/BetOnline against prior imports and market/context lanes where available; label movement as steam, stale, adverse move, no meaningful movement, or insufficient history. Do not treat stale lines as automatic bets; stale lines need manual confirmation. Explain whether movement improves edge, confirms market agreement, or warns that the price is gone. Payout path matters more than CLV, but CLV still informs timing and price quality. Use matched-line win-total edges, board-validator flags, and schedule Monte Carlo coherence fields where present; where value_gap is null or market depth is thin, treat sim probability as context and require placeable validation before carding anything.

Use the human watchlist as real-interest evaluation targets, not instructions: Bills ATB, Packers ATB, Giants wins over, Bengals ATB, Saints make playoffs, Chiefs SB/exactas, plus force-evaluate Chargers, Lions, and Cowboys. The model may pass on any watchlist item but must give full reasoning. Treat open parlays as sunk/contingent upside, reliable enough for exposure math, and a possible late-season hedge path; existing open parlays are past expiration but not removed, and new open parlays have a 30-day expiration notice requiring at least one open leg filled to stay active. Recommend parlay-fill ideas only as future-approval-required.

Trust sportsbook prices, prediction markets, expert dossiers, and articles most. Treat expert agreement as context, not authority; summarize pending/review-only podcast and article rows only as weak context; cite analyst/source conflict explicitly. Mark starter-sensitive plays needs-depth-chart-confirmation because projected starters are estimated. Weight roster factors in this order: QB, OL, WR/TE, pass rush, secondary, coaching, schedule. Treat OL cluster injuries as a strong downgrade, defensive-front injuries as possible boosts to opponent offense/win-total context, and force-check Patrick Mahomes injury status for Kansas City.

Final output should include a bankroll table showing current, proposed, and remaining exposure; official-pick-ready writeups for candidates that pass all gates; and a what-would-change-my-mind section for each major recommendation. Guardrails: do not run paid/frontier model/API calls, build a fresh dossier, write Supabase, approve official picks, persist recommendations, mutate portfolio/open parlays, fill/close parlays, or push git without explicit approval. If running the existing portfolio synthesis CLI after explicit approval, prefer the established Bills/Packers run shape and no-persist boundary, updated to a fresh dossier: `node agents/portfolio-synthesize.js --dossier <fresh-dossier-json> --models <approved-frontier-model> --shadow-slim --no-persist --primary "Buffalo Bills,Green Bay Packers" --out-suffix <dated-suffix>`.
```
