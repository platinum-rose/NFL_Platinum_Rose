# Handoff - 2026-08-13 02:44 Pacific

Session: Claude (Cowork) — design/build of the article reacquisition workflow + synthesis gates, per Andy's explicit approval following the Codex incident brief / Claude response / Codex-Claude comparison chain | Model: Claude (Sonnet 5)

## Current Git status and HEAD

- Branch: `main`. Observed HEAD: `82385b3` ("feat(twitter-bookmarks): add Gemini 2.0 Vision OCR for tweet graphics and stage player prop candidate proposals") — **this advanced twice during this session** (was `c29157a` at the start, `82385b3` now via two more Twitter-bookmarks-lane commits: `6140315`, `82385b3`). `main...origin/main` shows no ahead/behind delta, so these are pushed. Re-check before any further action — a concurrent session is still actively committing.
- **A second concurrent session (not this one) is also mid-flight on frontend UI work right now** — discovered via `git status`, not something I started or reviewed: new `src/components/fantasy/FantasyHub.jsx`, `src/components/futures/FuturesHub.jsx`, `src/components/intel/UnifiedIntelHub.jsx`, plus modified `src/App.jsx` and `src/components/layout/Header.jsx`. Also modified/new: `data/player-availability/*`, `data/training-camp/2026/*`, `docs/player-availability/*`, `scripts/build-player-availability.js`, `data/research-intel/local/2026-07-13-the-window-emr-ratings.json`, `data/research-intel/substack/2026-07-13-the-window-emr-ratings.json`. **I did not touch any of these — do not attribute them to this handoff, and the next session should not assume they're finished/reviewed.**

## Exact files changed by THIS session (Claude/Cowork, reacquisition + gates build)

**Design doc:**
- `docs/FUTURES_ARTICLE_REACQUISITION_AND_GATES_DESIGN_2026-08-13.md` — new. Covers all four pieces below.

**1. Canonical execution-venue registry** (fixes a real inconsistency: the odds-execution validator only recognized 3 of the 6 venues Andy actually bets at, silently stricter than his own stated venue list):
- `src/lib/executionVenues.js` — new. Single source of truth (6 sportsbooks with direct/proxy access tags, 2 prediction-market venues, 2 market-context-only books).
- `scripts/lib/execution-venue-registry.js` — new, thin re-export shim (kept for a `scripts/lib/*`-style import path; couldn't delete after briefly creating it there first due to a sandbox file-permission quirk, so it's a redirect, not dead weight).
- `scripts/lib/futures-odds-execution.js` — edited: `PLACEABLE_BOOKS` now derives from the registry (was hardcoded to 3 venues, now correctly recognizes all 6).
- `src/lib/supabase.js` — edited: `PLACEABLE_BOOKS` re-exports the registry's `PLACEABLE_SPORTSBOOK_KEYS` instead of a second hand-copied Set.
- `agents/portfolio-dossier.js` — edited: `BETTABLE_BOOKS` defaults from the registry (env override still works).
- `agents/portfolio-synthesize.js` — edited: the "PLACEABLE BOOKS ONLY" prompt sentence is now generated from the registry (`placeableVenuesPromptSentence()`) instead of hand-written prose that had already drifted.
- Note found along the way: `agents/lib/board-validate.js`'s own `DEFAULT_BETTABLE_BOOKS` is a **5th** copy of this list — but its header comment explicitly documents this as an intentional decoupling choice for this codebase's "pure functions, no cross-imports" module family, and its list already had all 6 venues correct. Left untouched, noted in the design doc.
- Tests: `tests/unit/executionVenues.test.js` (new, 7 tests).

**2. Named-player sizing gate** (the evidence-lane gate for Connor McGovern/Micah Parsons already existed and was solid — `agents/lib/named-status-review.js` already flagged both `eligible_for_synthesis: false`. What was missing: neither the portfolio dossier nor the synthesis prompt/output ever referenced it — confirmed by grep, zero hits in both files before this session):
- `agents/lib/named-status-review.js` — edited: added `computeTeamSizingGates()`, groups every currently-unresolved case by every team it touches (both `expected_team` and all `observed_team_assignments` — Parsons' case gates both GB and DAL, since the dispute is precisely which team he belongs to).
- `agents/portfolio-dossier.js` — edited: loads `data/projected-starters/2026/named-status-review.json` locally (no network), stamps `team_profiles[team].named_player_sizing_gate` and `meta.named_player_sizing_gates`.
- `agents/lib/board-validate.js` — edited: new exported `namedPlayerSizingViolations()`, wired into `validateBoard()`. This is the actual enforcement — flags any candidate at `stake_tier` core/standard on a gated team, checking both legs of a `superbowl_matchup` exacta.
- `agents/portfolio-synthesize.js` — edited: added prompt guidance explaining the gate and that it's enforced mechanically, not a suggestion.
- Tests: `tests/unit/namedStatusReviewSizingGates.test.js` (new, 5 tests), `tests/unit/boardValidateNamedPlayerGate.test.js` (new, 6 tests).
- **Live-verified locally** (pure local-file read, no network needed): ran `computeTeamSizingGates()` against the real `named-status-review.json` — correctly gates BUF (McGovern), GB and DAL (Parsons, both disputed sides).

**3. Dossier freshness/hash stamping** (closes the exact `dossier-2026-08-11.json`-predates-cleanup gap both incident-review docs flagged):
- `scripts/lib/dossier-freshness-gate.js` — new. Pure `checkDossierFreshness()` (hash mode for stamped dossiers, mtime-fallback mode for older ones) + local-I/O `collectEvidenceLaneStats()`/`stampEvidenceLaneVersions()`.
- `scripts/check-dossier-freshness.js` — new standalone CLI, no network needed.
- `agents/portfolio-dossier.js` — edited: stamps `meta.evidence_lane_versions` (hash+mtime per evidence-lane file) on every build.
- `agents/portfolio-synthesize.js` — edited: preflight check at the top of `main()` — refuses to run against a stale dossier unless `--allow-stale-dossier` is passed.
- Tests: `tests/unit/dossierFreshnessGate.test.js` (new, 8 tests).
- **Live-verified against the real repo**: `node scripts/check-dossier-freshness.js --dossier .nfl/portfolio/dossier-2026-08-11.json` correctly reports STALE across all 9 evidence lanes, exit code 1. `node agents/portfolio-synthesize.js --dossier .nfl/portfolio/dossier-2026-08-11.json --prompt-only` correctly refuses to proceed with the same finding, before touching any API key or network call.

**4. Article/source reacquisition:**
- `agents/research-intel-ingest.js` — edited: `BODY_MAX_CHARS` raised from 4,000 to 20,000 (confirmed root cause of the 181 `suspected_ingest_cap` records — Postgres `text` column, no schema change needed) + a warning log if the new cap is still hit.
- `scripts/lib/article-reacquisition.js` — new. Pure functions: `selectReacquisitionTargets()`, `stripHtmlToText()`, `buildReacquiredRecord()` (never overwrites, marks `unavailable` explicitly rather than fabricating), `detectCandidateSelections()` (conservative regex-based multi-pick surfacing — NOT a full NLP splitter, always for human review), `summarizeReacquisitionRun()`.
- `scripts/reacquire-article-sources.js` — new CLI wrapper (the only genuinely network-touching new piece). Supports `--dry-run` and `--limit N`.
- Tests: `tests/unit/articleReacquisition.test.js` (new, 16 tests, including a live regression check against the real `article-intel-review-latest.json` confirming the 212-target count = 31 + 181 exactly).
- **Live-verified**: `--dry-run --limit 5` correctly listed 5 real targets and confirmed the 212 total. A real (non-dry-run) `--limit 1` attempt correctly confirmed this sandbox has no outbound network access (same as every other live-ingest agent in this repo, F-31) — got `unavailable (fetch failed)`, marked honestly, nothing fabricated. **The full 212-record run needs Andy's native machine.**

**Test-artifact cleanup note:** the `--limit 1` live-network test above wrote a real output file, `data/research-intel/reacquisition/article-reacquisition-2026-08-13.json`. Couldn't delete it (sandbox file-permission quirk), so I overwrote its content with an explicit "THIS IS NOT A REAL RUN" note instead — it'll be silently replaced by Andy's real run since both share today's date. Not misleading if seen, but worth knowing it's there.

**Verification performed across the whole session:**
- `node --check` clean on every touched/new `.js` file.
- `npx eslint` clean (zero errors, zero warnings) on all 13 touched/new source files.
- Full existing test suite (68 files, all of them — ran in 5 batches due to a sandbox tool-call time limit around ~170s, not a real hang) plus the 5 new test files: **all passing, zero regressions.** Total roughly 1,150+ individual test assertions across the full suite.
- `npx vite build` (to a side `--outDir` since the normal `dist/` had a stale-file permission issue unrelated to my changes) — succeeded cleanly, 2,741 modules transformed, confirming `src/lib/executionVenues.js` and the `supabase.js` edit are safe in the frontend bundle.
- Two live, real (not simulated) runs against actual repo data: the freshness-gate CLI against the real stale dossier, and the reacquisition CLI's dry-run + a real network attempt.

## Unresolved blockers / next steps

- **`dist-verify-2026-08-13/` is a leftover build-verification directory** at repo root — couldn't `rm -rf` it (same permission quirk). Harmless (it's gitignored-pattern `dist*` almost certainly, but confirm) — safe to delete whenever file permissions cooperate; not meant to be committed.
- **The actual 212-article reacquisition has not run for real** — needs Andy (or a session with real network access) to run `node scripts/reacquire-article-sources.js` natively. Recommend `--limit 10` first to spot-check before the full run.
- **Recovered article bodies are not yet promoted anywhere** — `scripts/reacquire-article-sources.js` deliberately only writes a local `data/research-intel/reacquisition/article-reacquisition-<date>.json` file. Promoting recovered bodies back into `research_intel_notes` is a Supabase write and needs its own separate approval — not attempted, not designed in detail yet.
- **`detectCandidateSelections()` is explicitly a conservative heuristic**, not a real NLP splitter — it will miss unusual phrasing and should never auto-promote to `actual_picks`. Every candidate it finds needs human/LLM review, same as the rest of this repo's pick-extraction pipeline.
- **The two other approved-but-not-yet-built pieces from the design doc's own "what this does not do" section remain open**: Kalshi/Polymarket bid/ask/fee normalization against sportsbook markets (§10 in both incident-review docs) was explicitly scoped OUT of this session as a separate follow-up, not forgotten.
- **McGovern/Parsons themselves are still unresolved** — the sizing gate makes that structurally impossible to ignore now, but doesn't resolve the underlying facts. Still needs current, timestamped confirmation.
- **Nothing has been committed or pushed.** All of the above sits as uncommitted, unstaged changes alongside the pre-existing dirty boundaries and the concurrent frontend-refactor session's in-flight work. A narrow commit (touching only the files listed under "Exact files changed by THIS session" above, none of the concurrent UI/availability work) needs Andy's explicit approval.

## Next Codex/Andy steps

1. Decide whether to run the real 212-article reacquisition natively now, or hold.
2. Review this session's diff (13 source files + 1 doc + 5 test files) before any commit — narrow-stage only these, never `git add -A` given the concurrent UI work sitting dirty alongside it.
3. Design the promotion path for recovered article bodies (local JSON -> `research_intel_notes.body` update) as its own explicitly-approved step.
4. Pick up the Kalshi/Polymarket normalization design (still open, not started).
5. Whoever has lead next should reconcile this handoff plus whatever the concurrent frontend session leaves behind — check for its own timestamped handoff before assuming its UI work is done/reviewed.

## Resume Prompt

```text
Resume in E:\dev\projects\NFL_Dashboard.

First run `git status --short --branch` and `git log -n 5 --oneline` — HEAD has moved multiple times per session today from concurrent work, re-check before touching anything. Read, in order:
1. handoffs/2026-08-13-0244-claude-reacquisition-gates-build-handoff.md (this file)
2. docs/FUTURES_ARTICLE_REACQUISITION_AND_GATES_DESIGN_2026-08-13.md
3. docs/NFL_FUTURES_SYNTHESIS_CODEX_CLAUDE_COMPARISON_2026-08-13.md
4. docs/NFL_FUTURES_SYNTHESIS_INCIDENT_REVIEW_CLAUDE_BRIEF_2026-08-13.md
5. docs/NFL_FUTURES_SYNTHESIS_INCIDENT_REVIEW_CLAUDE_RESPONSE_2026-08-13.md
6. Any newer timestamped handoff discovered in the filesystem — a second, concurrent session was actively modifying src/App.jsx, src/components/layout/Header.jsx, and adding new FantasyHub.jsx/FuturesHub.jsx/UnifiedIntelHub.jsx components while this session ran; find out what it finished and whether it left its own handoff before assuming anything about that work.

Objective: Andy approved design/build of the article reacquisition workflow and three synthesis gates (execution-venue registry, named-player sizing gate, dossier freshness stamping) on 2026-08-13. All four are built, tested (full existing suite + 42 new tests, zero regressions), lint-clean, and build-clean. Nothing has been committed. The remaining work is: (a) run the real 212-article reacquisition natively (this sandbox has no outbound network access, confirmed again), (b) design the Supabase-write promotion path for recovered bodies as a separately-approved step, (c) decide on a narrow commit of just this session's files, (d) pick up Kalshi/Polymarket normalization (not started).

Verified state: execution-venue registry at src/lib/executionVenues.js recognizes all 6 of Andy's stated venues (was 3 in the odds-execution validator before this session). Named-player sizing gate is wired end-to-end from agents/lib/named-status-review.js through agents/portfolio-dossier.js's meta/team_profiles into agents/lib/board-validate.js's mechanical enforcement — confirmed live against the real McGovern/Parsons cases. Dossier freshness gate confirmed live: .nfl/portfolio/dossier-2026-08-11.json correctly flags STALE (9/9 evidence lanes), and agents/portfolio-synthesize.js now refuses to run against it without --allow-stale-dossier. agents/research-intel-ingest.js's BODY_MAX_CHARS root cause (was 4,000, the source of 181 "suspected_ingest_cap" records) is fixed to 20,000. scripts/reacquire-article-sources.js confirmed working end-to-end except the live fetch itself (sandbox network restriction) — dry-run correctly listed all 212 real targets.

Dirty boundaries: preserve everything — this session's own new/modified files (see "Exact files changed" above), all pre-existing preserved boundaries (TASK_BOARD.md, WORKING-CONTEXT.md, agents/lib/sportsRelevanceFilter.js, docs/FANTASYPROS_API_INTEGRATION_SCOPE_2026-08-09.md, scripts/build-player-availability.js, tests/unit/playerAvailability.test.js, .nfl/gmail-summaries/, data/official-picks/proposals/active/, the Yahoo agreement PDF, the contested YouTube review), the protected incident-review docs and handoffs, AND the concurrent frontend-refactor session's files (src/App.jsx, src/components/layout/Header.jsx, src/components/fantasy/FantasyHub.jsx, src/components/futures/FuturesHub.jsx, src/components/intel/UnifiedIntelHub.jsx, data/player-availability/*, data/training-camp/2026/*, docs/player-availability/*). One leftover artifact to clean up when file permissions allow: dist-verify-2026-08-13/ at repo root (a build-verification-only output, not meant to persist).

Guardrails: no git clean, destructive reset/checkout, blind revert, broad staging, git add -A, commit, or push without Andy's explicit approval. No betting, official picks, portfolio/parlay mutation, Supabase writes, recommendation persistence, paid model/API calls, or fresh synthesis without explicit approval.
```
