# Handoff - 2026-07-30 14:52 Pacific

Session: Codex data-gathering sprint planning for frontier futures synthesis

## Objective

Prepare a fresh-session implementation sprint for improving the NFL 2026 knowledge base before any frontier-model futures synthesis. The sprint should resolve the known data weaknesses around training-camp coverage, podcast/YouTube freshness, raw futures market normalization, noisy player availability, 2026 projection baselines, prediction-market mapping, and likely-starter context.

## Current Decision

Use a fresh NFL-focused session rather than beginning implementation here.

Reasons:

- Antigravity is currently mid-session on NFL work.
- NFL_Dashboard has pre-existing uncommitted protocol/handoff edits.
- ATLAS has an unrelated local guide edit from this thread and is ahead of origin by one local commit.
- This sprint will touch multiple data contracts, scripts, reports, and source-audit lanes; starting in a clean task reduces collision risk.

## Verified Local State

- Workspace: `E:\dev\projects\NFL_Dashboard`.
- Current visible NFL dirty state:
  - `M .codex/rules/session.md`
  - `M CONTEXT_HANDOFF_PROTOCOL.md`
  - `?? handoffs/2026-07-30-1259-codex-protocol-access-handoff.md`
  - This new handoff file after creation.
- Current ATLAS boundary:
  - `E:\dev\ATLAS` is `main...origin/main [ahead 1]`.
  - `docs/USER_GUIDE_DASHBOARD.html` has an uncommitted guide edit adding the manual dropped futures odds parser utility.
  - `?? ~/` exists and was not touched.
- No live model/API call was made for this plan.
- No Supabase write, official-pick approval/proposal persistence, production recommendation persistence, portfolio mutation, or open-parlay change was made.

## Existing Data Evidence To Read

- `HANDOFF.md`
- `HANDOFF_PROMPT.md`
- `WORKING-CONTEXT.md`
- `TASK_BOARD.md`
- `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md`
- `docs/FUTURES_SYNTHESIS_SOURCE_READINESS_2026-07-30.md`
- `docs/FUTURES_SYNTHESIS_REQUIREMENT_AUDIT_2026-07-30.md`
- `docs/TRAINING_CAMP_SOURCE_RECONCILIATION_2026-07-30.md`
- `docs/player-availability/player-availability-latest.md`
- `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`
- Latest source-audit JSON under `.nfl/source-audit/`, currently observed as `.nfl/source-audit/nfl-intel-source-audit-2026-07-30T17-35-33-704Z.json`.

## Sprint Workstreams

### 1. Fill Training-Camp Team Coverage

Goal: get all 32 teams to collected or explicitly reviewed-empty, prioritizing `BUF`, `GB`, `CIN`, `KC`, `NO`, `NYG`, then the remaining missing teams.

Suggested artifacts:

- `data/training-camp/2026/manual/*.md`
- `data/training-camp/2026/latest.json`
- `docs/training-camp/training-camp-coverage-gap-report.md`

Use existing local/manual training-camp pipeline first. Preserve source stamps. Keep `not collected yet` explicit only where collection was actually attempted or consciously deferred.

### 2. Run Podcast/YouTube Freshness Sweep

Goal: capture July 24-30 NFL futures/team-preview episodes and reconcile missing anchor teams, especially `BUF`, `GB`, `KC`, `CIN`, `NO`, `NYG`, plus prior missing teams.

Suggested artifacts:

- `data/shadow-harness/review/youtube-futures-local-intel-queue.json`
- `data/shadow-harness/review/youtube-futures-intel-review-status.json`
- `data/shadow-harness/review/youtube-futures-agent-intel-summary.json`
- `docs/antigravity/youtube-futures-agent-intel-summary.md`

Do not treat `pending_review` or `needs_review` rows as accepted. Rejected rows must not leak into agent summaries.

### 3. Expand Raw BKR/BetUS Market Memory Normalization

Goal: structure more of the raw July 29 sportsbook memory without pretending inference markets are direct betting recommendations.

Existing commands:

```powershell
node scripts/parse-futures-text.js --file docs/Futures_Odds/BKR_Odds_0729 --book bookmaker --out data/futures-imports/bookmaker-2026-07-29.json --date 2026-07-29
node scripts/parse-futures-text.js --file docs/Futures_Odds/BetUS_ALL_0729 --book betus --out data/futures-imports/betus-2026-07-29.json --date 2026-07-29
npm.cmd run futures:betonline-0729
node scripts/ingest-futures-json.js --file data/futures-imports/bookmaker-2026-07-29.json --dry-run
node scripts/ingest-futures-json.js --file data/futures-imports/betus-2026-07-29.json --dry-run
```

Target additions:

- BetOnline playoff No-side values into structured local JSON.
- BKR/BetUS exactas and alternate win ladders.
- Player stat-race and award markets as inference-only context.
- Validation report showing row counts by book/market/team.

No Supabase write without explicit approval.

### 4. Build Impact Availability Digest

Goal: reduce the 790 availability events into a ranked futures-relevant digest.

Suggested artifacts:

- `data/player-availability/impact-digest-latest.json`
- `docs/player-availability/starter-impact-digest-latest.md`

Inputs:

- `data/player-availability/latest.json`
- new projected/likely-starters data layer
- training-camp availability-like notes

Rank QB, OL, defensive front, secondary, WR/RB/TE role changes, and kicker. Separate depth-only and generic active-news rows from actual starter-impact rows.

### 5. Add 2026 Projection Baseline Layer

Goal: give the frontier model a structured preseason baseline rather than scattered priors.

Suggested artifacts:

- `data/generated/team-profiles/team-2026-preseason-projection-baseline.json`
- `docs/team-profiles/team-2026-preseason-projection-baseline.md`

Combine:

- projected starters and roster likelihood
- starter-impact availability digest
- July 29 market-implied win totals and futures prices
- 2025 DVOA/EPA/coaching snapshots
- OL/DL strength
- coordinator/scheme changes
- schedule difficulty, travel, rest, and early-season context
- training-camp and podcast/article context

Every team should expose `known`, `estimated`, and `missing` fields.

### 6. Map Prediction-Market Contracts

Goal: make Kalshi/Polymarket useful as consensus context without confusing them for sportsbook execution prices.

Suggested artifacts:

- `data/prediction-markets/team-market-map-latest.json`
- `docs/prediction-markets/prediction-market-context-latest.md`

Map each contract to team, market, season, side, price, implied probability, volume, exchange, spread/liquidity warning, and mapping confidence. Ambiguous contracts stay unmapped with a reason.

### 7. Add Projected / Likely Starters Data Layer

Goal: bridge availability and projection data with actual player importance.

Suggested artifacts:

- `data/projected-starters/2026/manual/`
- `data/projected-starters/2026/latest.json`
- `docs/projected-starters/projected-starters-latest.md`

Recommended source types:

- ESPN all-32 depth charts
- RotoWire all-32 depth charts
- Ourlads all-32 depth charts and rosters
- FantasyPros skill-position depth charts
- official team rosters
- beat 53-man roster projections and camp battle reports

Suggested row fields:

- `team`
- `player_name`
- `position`
- `unit`
- `role`
- `starter_confidence`
- `roster_confidence`
- `source_count`
- `sources`
- `evidence_tags`
- `impact_bucket`
- `needs_human_review`

Use consensus scoring rather than a single source of truth.

## Recommended Sprint Order

1. Data contracts and missing-output conventions.
2. Projected starters / likely starters layer.
3. Impact availability digest.
4. Training camp all-32 coverage fill.
5. Raw BKR/BetUS/BetOnline market normalization expansion.
6. Podcast/YouTube July 24-30 freshness sweep and human-review reconciliation.
7. 2026 projection baseline.
8. Prediction-market mapping.
9. Source-audit integration and frontier packet rebuild.

## Guardrails

- No paid/frontier model calls without explicit approval.
- No Supabase writes without explicit approval.
- No official-pick approvals, official-pick proposal persistence, or production recommendation persistence without explicit approval.
- No open-parlay changes without explicit approval.
- Podcast, YouTube, article, training-camp, projected-starter, prediction-market, and availability outputs are research context until explicitly promoted.
- Stage narrowly; do not use `git add -A`.
- Preserve Antigravity's active session work and unrelated dirty files.

## Resume Prompt

```text
Resume Platinum Rose NFL data-gathering sprint in E:\dev\projects\NFL_Dashboard. First read HANDOFF.md, HANDOFF_PROMPT.md, WORKING-CONTEXT.md, TASK_BOARD.md, docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md, docs/FUTURES_SYNTHESIS_SOURCE_READINESS_2026-07-30.md, docs/FUTURES_SYNTHESIS_REQUIREMENT_AUDIT_2026-07-30.md, docs/TRAINING_CAMP_SOURCE_RECONCILIATION_2026-07-30.md, docs/player-availability/player-availability-latest.md, docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html, and handoffs/2026-07-30-1452-data-gathering-sprint-handoff.md. Before planning, scan .codex/rules/, .codex/hooks.json, skills/, agents/, .agents/skills/, and hook folders for relevant project-local guidance. Objective: implement the local/read-only data-gathering sprint before any frontier futures synthesis: projected/likely starters, impact availability digest, training-camp all-32 coverage fill, podcast/YouTube July 24-30 freshness reconciliation, expanded raw BKR/BetUS/BetOnline market normalization, 2026 projection baseline, prediction-market mapping, and source-audit integration. Verified state: source gate was previously PASSABLE; July 29 BKR/BetUS/BetOnline odds exist locally; player availability exists with about 790 events across all 32 teams; training camp has 19 items across 10 teams and needs coverage fill; YouTube promoted summary has 45 accepted local-intel items but misses some anchor teams; no live model/API call, Supabase write, official-pick action, production recommendation persistence, or open-parlay mutation was made for this handoff. Immediate next step: inspect current git status, preserve Antigravity/dirty-work boundaries, then start with data contracts for projected starters and impact availability digest. Guardrails: no paid/frontier model calls, no Supabase writes, no official-pick approvals/proposals/persistence, no production recommendation persistence, and no open-parlay changes without explicit approval; stage narrowly and do not use git add -A.
```
