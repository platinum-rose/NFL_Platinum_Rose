# Futures Portfolio Frontier Synthesis Packet - 2026-07-30

Purpose: package the current accepted evidence for a maximum-effort frontier-model narrative analysis of the 2026 NFL futures portfolio.

Status: market-price evidence packet prepared; source gate is now PASSABLE after a fresh approved live training-camp RSS scout and player-availability build. No paid model/API call was made. No Supabase write, official-pick approval, production recommendation persistence, portfolio mutation, or open-parlay change was made.

## Current Decision Point

Resolve this before the frontier-model run:

1. BetOnline is now manually normalized from the July 29 screenshots into `data/futures-imports/betonline-2026-07-29.json`.
2. The fresh approved live training-camp RSS scout has refreshed `data/training-camp/2026/latest.json` and `data/training-camp/2026/training-camp-intel-2026-07-30.json` with 19 items across 10 teams.
3. The fresh player-availability snapshot has been built from ESPN structured injuries plus training-camp availability-like notes into `data/player-availability/latest.json`.
4. Ask explicit approval for any paid/frontier model call before synthesis.

## Verified Source Gate

- Source-readiness checklist: `docs/FUTURES_SYNTHESIS_SOURCE_READINESS_2026-07-30.md`
- Last fully passing source audit JSON: `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T07-41-18-119Z.json`
- Latest dashboard copy: `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`
- Last fully passing audit generated at: `2026-07-30T07:41:18.119Z`
- Last fully passing verdict: `PASSABLE`
- Last fully passing counts: Current 2 / Review 17 / Stale 0 / Blocked 0 / Missing 0 / Context 7 / Inference 1
- Current frontier ready: true for local source freshness. Paid/frontier model execution still requires explicit approval.
- Guardrails observed by the audit: live_fetches false, model_calls false, supabase_writes false, official_pick_approvals false, portfolio_mutations false
- Current written check: `npm.cmd run intel:source-audit` returned `PASSABLE`, Current 2 / Review 18 / Stale 0 / Blocked 0 / Missing 0 / Context 7 / Inference 1.
- Current written audit JSON: `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T16-50-56-165Z.json`
- Current written audit HTML: `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T16-50-56-165Z.html`
- July 31 addendum: `npm.cmd run intel:source-audit` returned `BLOCKED`, Current 2 / Review 20 / Stale 3 / Blocked 0 / Missing 0 / Context 12 / Inference 1. The three stale rows are the July 29 normalized primary-book exports for BetOnline, BetUS, and Bookmaker/BKR. Expert dossiers are present as a context row: 13 dossiers, 3 local-recovery signals, 0 missing dossier files.
- July 31 audit JSON: `.nfl/source-audit/nfl-intel-source-audit-2026-07-31T18-51-51-486Z.json`
- July 31 audit HTML/latest copy: `.nfl/source-audit/nfl-intel-source-audit-2026-07-31T18-51-51-486Z.html` and `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`

Out of scope for this packet:

- DraftKings/FanDuel bet-slip parser implementation or verification.
- Weekly/live props source wiring.
- DraftKings/FanDuel prices as placeable evidence.
- Official-picks approval/proposal persistence.
- Supabase writes or portfolio mutation.
- Open-parlay filling, closing, or reliance as guaranteed capacity.

## Current Market Inputs

| Source | Current status | Use |
|---|---|---|
| `data/futures-imports/betus-2026-07-29.json` | Current normalized primary-book import, 416 rows | Placeable-price evidence after normal portfolio gates. Markets: conference AFC/NFC, all divisions, playoffs, Super Bowl, exact Super Bowl matchup, wins. |
| `data/futures-imports/bookmaker-2026-07-29.json` | Current normalized primary-book import, 128 rows | Placeable-price evidence after normal portfolio gates. Markets: conference AFC/NFC, all divisions, Super Bowl, wins. |
| `data/futures-imports/betonline-2026-07-29.json` | Current manually normalized primary-book import, 160 rows | Placeable-price evidence for listed BetOnline markets after normal portfolio gates. Markets: Super Bowl, conference AFC/NFC, all divisions, playoffs Yes, and wins. |
| `docs/FUTURES_ODDS_BETONLINE_2026-07-29_MANUAL_REVIEW.md` | Manual review table generated from all nine July 29 BetOnline screenshots | Source trace for the normalized import; preserves playoff No-side prices that the current futures import schema does not store. |
| `docs/Futures_Odds/BetUS_ALL_0729` | Current raw sportsbook export, 72,799 chars / 1,998 lines, last written 2026-07-29 9:16 PM local | Raw authority for current BetUS futures prices until superseded by a newer export. |
| `docs/Futures_Odds/BKR_Odds_0729` | Current raw sportsbook export, 43,015 chars / 3,694 lines, last written 2026-07-29 9:00 PM local | Raw authority for current Bookmaker/BKR prices until superseded by a newer export. |
| BetOnline July 29 screenshots | Current screenshots exist, last written 2026-07-29 9:34-9:41 PM local | Normalized for listed markets. Exact Super Bowl matchup is still unavailable from BetOnline in this bundle. |
| `data/futures-imports/betonline-2026-07-14.json` | Superseded structured import, 128 rows | Excluded from current exact-price use. Use `betonline-2026-07-29.json` instead. |
| TheOddsAPI receipt | One available futures market, 14 unavailable markets, 128 rows, 15 API calls | Public market shape and consensus context only. Betting recommendations still need primary-book quotes or an explicit Vegas-proxy alert. |

BetOnline screenshot files normalized for listed markets:

- `docs/Futures_Odds/BEO_Conf_0729.PNG`
- `docs/Futures_Odds/BEO_Div_0729.PNG`
- `docs/Futures_Odds/BEO_MakePlayoffs1_0729.PNG`
- `docs/Futures_Odds/BEO_MakePlayoffs2_0729.PNG`
- `docs/Futures_Odds/BEO_MakePlayoffs3_0729.PNG`
- `docs/Futures_Odds/BEO_RegWins1_0729.PNG`
- `docs/Futures_Odds/BEO_RegWins2_0729.PNG`
- `docs/Futures_Odds/BEO_RegWins3_0729.PNG`
- `docs/Futures_Odds/BEO_SB_0729.PNG`

Manual normalization verification: `npm.cmd run futures:betonline-0729`, `node scripts/build-betonline-0729-import.js --check-only`, and `node scripts/ingest-futures-json.js --file data/futures-imports/betonline-2026-07-29.json --dry-run` all passed with 160 rows.

## Portfolio Inputs

- Futures bankroll: `$500`
- Futures unit: `$20`
- Allowed unit sizes: 0.25u, 0.5u, 1u, 2u
- Cutoff policy: futures proposals before `2026-09-09T12:00:00-07:00`; in-season futures may remain candidates if new dislocations appear.
- Known anchor amplifier: `$100` on Bills vs Packers exact Super Bowl matchup at `+6500`, status open.
- Bills Super Bowl anchor: target cap `$200`; actual entry tickets and blended price are not supplied.
- Packers Super Bowl anchor: target cap `$200`; actual entry tickets and blended price are not supplied.
- Open parlays: 6 tickets, 11 open slots, `$162.50` risked, displayed potential win `$3,327.12`; preserve as open/unverified contingent assets only.

Official tracked paper pick requirements remain active:

- Placeable book/source.
- Timestamped odds.
- Minimum edge threshold.
- Confidence grade.
- Written rationale with market view, football view, and disconfirming factor.
- Evidence IDs.
- Human verification before official tracking.

## Watchlist Targets

Use the human-maintained watchlist as evaluation targets, not betting instructions:

- `buf-anchor-atb`: Buffalo Bills across wins over, playoffs, division, AFC, Super Bowl, and exacta coverage.
- `gb-anchor-atb`: Green Bay Packers across wins over, playoffs, division, NFC, Super Bowl, and exacta coverage.
- `nyg-wins-over`: New York Giants win-total over.
- `cin-atb`: Cincinnati Bengals across board.
- `no-playoffs`: New Orleans Saints make playoffs.
- `kc-sb-exactas`: Kansas City Chiefs Super Bowl and exacta coverage.

Exacta and Super Bowl matchup plays are monitor-only until secondary market/price-shopping validation resolves against actual two-team rows.

## Intel Inputs

| Source | Current artifact | Synthesis use |
|---|---|---|
| YouTube/Gemini futures export | `data/shadow-harness/review/youtube-futures-agent-intel-summary.json`, generated `2026-07-29T04:00:31.515Z`, 45 exported local-intel items, 0 DET `+1500` leak checks | Use promoted local futures intel only. Do not use pending/context rows as accepted picks. |
| YouTube review status | `data/shadow-harness/review/youtube-futures-intel-review-status.json`, generated `2026-07-29T04:00:17.820Z`, 115 total review rows | Context for review coverage: 45 promoted, 10 rejected, 11 context-only, 46 pending review, 3 needs review. |
| Podcast/YouTube freshness reconciliation | `docs/antigravity/podcast-youtube-freshness-latest.md` and `data/shadow-harness/review/podcast-youtube-freshness-latest.json` | July 24-30 source-freshness/gap context. Use accepted rows only; keep pending/reprocess-required rows out of accepted intel. |
| Expert dossiers | `data/expert-dossiers/latest.json` plus `data/expert-dossiers/*.json`; human review docs under `docs/antigravity/expert-dossiers/` | Compact analyst-prior/bias context. Use for interpreting named analyst tendencies or possible blind spots only. Do not use as price evidence, official-pick support, or standalone recommendation evidence; `local_recovery_context_only` rows require manual review. |
| M6 podcast deep dives | `docs/podcast-transcript-deep-dives/index.json`, generated `2026-07-30T08:48:17.626Z`, 57 episodes | Current transcript narrative base. Latest episode is the July 23 BettingPros futures-card episode with 48 beats. |
| Podcast ad/legal cleanup | `scripts/build-podcast-transcript-deep-dives.js` and `agents/lib/speaker-attribution.js` checks passed; regenerated output has no hard ad/legal matches | Expanded hard promo/legal scan is clean, including sponsored-by copy. Remaining sportsbook mentions are price/context references. |
| Article review | `data/research-intel/review/article-intel-review-latest.json`, generated `2026-07-30T05:14:49.488Z` | Research context only: 39 articles reviewed, 0 actual picks, 8 market leads, 8 pick leads, 103 analysis notes. |
| Training camp snapshot | Fresh approved live RSS scout snapshot is in `data/training-camp/2026/latest.json` and `data/training-camp/2026/training-camp-intel-2026-07-30.json` with 19 items across 10 teams | Source gate cleared; review/highlight camp notes before synthesis. |
| Training-camp coverage fill | `docs/training-camp/training-camp-coverage-fill-latest.md` | All-32 local context coverage map. Canonical camp intel remains thinner; do not over-weight non-source-stamped filler. |
| Player availability snapshot | `data/player-availability/latest.json`, generated `2026-07-30T16:50:29.570Z`, 796 events across 32 teams | Injury, return-to-practice, Active/PUP/IR/out, limited/snap-count, OL cluster risk, and defensive-front cluster risk. Use OL risks as possible offense/scoring impairment and defensive-front risks as possible reciprocal opponent-offense boosts. |
| Starter-impact availability digest | `docs/player-availability/starter-impact-digest-latest.md` and `data/player-availability/impact-digest-latest.json` | Compact impact layer over raw availability. Use to identify futures-sensitive availability risks while preserving source/status uncertainty. |
| Projected/likely starters | `docs/projected-starters/projected-starters-latest.md` | Estimated depth-chart layer for matching availability and market theses to likely starters. Manual depth-chart rows remain missing unless separately supplied. |
| Prediction-market context | `docs/prediction-markets/prediction-market-context-latest.md`, `docs/prediction-markets/cross-market-coherence-latest.md`, and `data/prediction-markets/team-market-map-latest.json` | Kalshi/Polymarket context and sportsbook-vs-prediction-market mismatch triage. Use mapped/liquid rows as consensus context only, not sportsbook execution pricing. |
| 2026 projection baseline | `data/generated/team-profiles/team-power-ratings-2025.json` and `data/generated/team-profiles/team-regression-snapshots-2025-w18.json` | Baseline team-strength and regression context if not already embedded in the generated portfolio dossier. Label as projection context, not market evidence. |
| Season readiness smoke | Latest documented state: READY WITH WATCH ITEMS, PASS 11 / WARN 6 / FAIL 0 | Product-readiness context only. Watch items are not source-freshness blockers. |

## Synthesis Rules

The frontier-model synthesis should:

- Separate known, estimated, and missing inputs.
- Treat current BetUS, Bookmaker/BKR, and normalized BetOnline July 29 imports as current placeable-price evidence for listed markets.
- Use `docs/FUTURES_ODDS_BETONLINE_2026-07-29_MANUAL_REVIEW.md` for BetOnline playoff No-side prices; the normalized import stores playoff Yes prices only to match the existing schema.
- Treat TheOddsAPI/public rows as consensus context, not execution quotes.
- Treat articles, training camp, player availability, projected starters, prediction markets, expert dossiers, and podcasts as research/intel context, not automatic betting authority.
- Use player availability to identify futures-sensitive return/setback risk, especially QB, major skill, trench, and defensive core players, then require price and portfolio validation before any bet recommendation.
- Use expert dossiers only to interpret named analyst priors or potential blind spots. Do not cite them as price evidence, accepted pick evidence, or official-pick support.
- Recommend, pass, or watch with a trigger; do not force targets.
- Include source references, price thresholds, timing triggers, disconfirming factors, and sizing against the `$20` futures unit and `$500` cap.
- Account for existing Bills/Packers anchor exposure and the open Bills/Packers exacta.
- Keep exactas monitor-only unless exact two-team rows and secondary price-shopping validation are explicitly satisfied.
- Keep open parlays open/unverified unless the user explicitly approves a change.
- Ask for human approval before any official tracked paper pick or persisted recommendation.

## Approval-Gated Run Path

Do not run these without explicit approval:

1. Fresh dossier build if it requires Supabase/service credentials:
   - `node agents/portfolio-dossier.js --season 2026`
2. Frontier-model synthesis:
   - `node agents/portfolio-synthesize.js --dossier <fresh-dossier-json> --models <approved-frontier-model> --shadow-slim --no-persist --primary "Buffalo Bills,Green Bay Packers" --out-suffix frontier-2026-07-30`
   - Expert dossier context is loaded automatically from `data/expert-dossiers/latest.json` when present; override with `--expert-dossiers <path>` if a dated packet is preferred.

The existing local `.nfl/portfolio/dossier-2026-07-23.json` is stale relative to this July 29/30 source packet and should not be treated as final ground truth for the model run.

## July 31 Inference Coverage Addendum

Before any paid/frontier synthesis, review `docs/FUTURES_INFERENCE_PACKET_COVERAGE_AUDIT_2026-07-31.md`. It records the expert-dossier wiring and flags local artifacts that were added after the original July 30 packet framing, including projected starters, starter-impact availability, training-camp coverage fill, prediction-market context, cross-market coherence, and 2026 projection baselines.

## Immediate Next Step

Recommended next move: refresh or explicitly waive the now-stale July 29 primary-book exports before any paid/frontier model call, then run the synthesis using accepted local intel, expert dossiers, current sportsbook prices, cleaned podcast deep dives, article intel, training-camp context, projected starters, prediction-market context, and player availability.

## Resume Prompt

Resume Platinum Rose NFL in `E:\dev\projects\NFL_Dashboard`. Read `HANDOFF.md`, `HANDOFF_PROMPT.md`, `WORKING-CONTEXT.md`, `TASK_BOARD.md`, `docs/FUTURES_SYNTHESIS_SOURCE_READINESS_2026-07-30.md`, `docs/FUTURES_SYNTHESIS_REQUIREMENT_AUDIT_2026-07-30.md`, `docs/TRAINING_CAMP_SOURCE_RECONCILIATION_2026-07-30.md`, `docs/player-availability/player-availability-latest.md`, `docs/FUTURES_INFERENCE_PACKET_COVERAGE_AUDIT_2026-07-31.md`, and `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md` first. Current objective is a maximum-effort frontier-model futures portfolio narrative and recommendation synthesis, using current accepted local sources and excluding DraftKings/FanDuel bet-slip parser work plus weekly/live props plumbing from the current focus. Verified state: expert dossiers are built locally with 13 dossiers and are loaded automatically by `agents/portfolio-synthesize.js`; projected starters, starter-impact availability, training-camp coverage fill, prediction-market context, cross-market coherence, and 2026 projection baselines are now named in the packet. BetUS, Bookmaker/BKR, and BetOnline July 29 imports are normalized and dry-run ingestable, but the July 31 source audit now marks those three normalized primary-book exports stale; latest audit is BLOCKED with Current 2 / Review 20 / Stale 3 / Blocked 0 / Missing 0 / Context 12 / Inference 1. No model/API call, Supabase write, official-pick action, production recommendation persistence, portfolio mutation, or open-parlay change was made. Immediate next step: refresh or explicitly waive the stale July 29 primary-book exports before any paid/frontier model call, then run synthesis only with explicit approval. Guardrails: no paid model/API call, no Supabase write, no official-pick approval/proposal persistence, no production recommendation persistence, and no open-parlay changes without explicit approval.
