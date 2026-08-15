# Futures Article Reacquisition + Synthesis Gates — Design

**Date:** 2026-08-13
**Status:** Design + initial build, approved by Andy for design/build (not for live network fetch, Supabase writes, commit, or push — those remain separately gated)
**Builds on:** `docs/NFL_FUTURES_SYNTHESIS_INCIDENT_REVIEW_CLAUDE_BRIEF_2026-08-13.md`, `docs/NFL_FUTURES_SYNTHESIS_INCIDENT_REVIEW_CLAUDE_RESPONSE_2026-08-13.md`, `docs/NFL_FUTURES_SYNTHESIS_CODEX_CLAUDE_COMPARISON_2026-08-13.md`

Four pieces, in build order:

## 1. Canonical execution-venue registry

**Finding, corrected from the incident-review docs:** there isn't a simple 2-way mismatch. There are four separate venue lists in the codebase:

| Location | Venues |
|---|---|
| `agents/portfolio-dossier.js` `BETTABLE_BOOKS` (env-overridable) | bookmaker, betonline, betus, betmgm, caesars, williamhill_us, williamhill, circa, mgm (6 real venues, 9 keys w/ aliases) |
| `src/lib/supabase.js` `PLACEABLE_BOOKS` | same 9 keys — comment says it deliberately mirrors the dossier default |
| `agents/portfolio-synthesize.js` prompt text | same 6 venues in prose |
| `scripts/lib/futures-odds-execution.js` `PLACEABLE_BOOKS` | **only 3**: bookmaker, betus, betonline |

Three of four already agree. Only the **execution validator** — the gate that decided the Bills-Packers exacta needs a second placeable book — is narrower, silently excluding the three proxy-access Vegas books (BetMGM, Caesars/WilliamHill, Circa) from ever counting toward execution eligibility.

Per Andy's own authoritative venue list in the incident brief (§1, "Execution venues"): Bookmaker/BKR, BetUS, BetOnline, BetMGM via proxy, Caesars/William Hill via proxy, Circa via proxy, Kalshi, Polymarket are all currently usable. So the fix is to **widen the execution validator to match the other three lists**, not arbitrarily pick one.

**Build:** new `scripts/lib/execution-venue-registry.js`, single source of truth, consumed by all four locations. Sportsbooks and prediction-market venues (Kalshi/Polymarket) are modeled separately — PM venues need bid/ask/fill/fee equivalence (not yet built, tracked as its own follow-up, not silently folded into the sportsbook execution check).

## 2. Named-player sizing gate

**Finding:** the evidence-lane gate already exists and is solid — `agents/lib/named-status-review.js` validates McGovern/Parsons as `eligible_for_synthesis: false`, and `build-projected-starters.js`/`build-availability-impact-digest.js` already exclude them from eligible rows and flag `needs_human_review: true` on the raw events.

**What's actually missing:** none of that reaches the portfolio dossier or the synthesis output. `agents/portfolio-dossier.js` and `agents/portfolio-synthesize.js` have zero references to `named_status_review` or `eligible_for_synthesis` (confirmed by direct grep — zero matches in both files). `fetchPlayerAvailabilityContext()`'s event mappers pass `needs_human_review` through but drop the richer `named_status_review` object, and there is no code-level cap — only a prompt instruction ("MUST cite injuries/player_availability or set needs_human_review=true") that a model output isn't structurally forced to honor.

**Build:** `computeTeamSizingGates()` added to `agents/lib/named-status-review.js`, grouping unresolved cases by team (both `expected_team` and every `observed_team_assignments` entry, since Parsons' conflict is precisely about which team he belongs to). Wired into the dossier as `team_profiles[team].named_player_sizing_gate` and top-level `meta.named_player_sizing_gates`. A deterministic **post-output** enforcement gate (`scripts/lib/futures-evidence-gates.js`) downgrades or flags any model recommendation that assigns full-sleeve sizing to a gated team — this is the part that makes it a real gate rather than a prompt request, directly answering the audit's criticism of "loose output validation."

## 3. Dossier freshness/hash stamping

**Finding:** `.nfl/portfolio/dossier-2026-08-11.json` is still the only dossier on disk and still predates the August 12 evidence cleanup — confirmed by both the Claude response and Codex's comparison. Nothing currently prevents a future run from silently reusing it.

**Build:** `agents/portfolio-dossier.js`'s `meta` gains an `evidence_lane_versions` map — `{path, sha256, mtime}` for every local evidence-lane file it read (article review, availability, projected starters, training camp, prediction markets). New standalone `scripts/check-dossier-freshness.js` (pure local file reads, no network) compares a dossier's stamped versions against the current on-disk files and fails loudly if any evidence file is newer than the dossier — exactly the "stale-dossier-silently-reused" failure mode this closes. Runs before `portfolio-synthesize.js` as a preflight, and can be run standalone against `dossier-2026-08-11.json` today to demonstrate it would correctly flag that file as stale (its stamped versions predate the Aug-12 rebuild).

## 4. Article/source reacquisition

**Root cause found and fixed:** `agents/research-intel-ingest.js:22` — `const BODY_MAX_CHARS = 4_000;` — a hardcoded ingest-time truncation that permanently discards everything past 4,000 characters when an article body is first fetched. This is exactly why 181 records cluster in the 3,900-4,573-character band Codex flagged: it's not natural article-length variance, it's this constant. `research_intel_notes.body` is a plain Postgres `text` column (migration `011_research_intel_fts.sql`) with no length constraint, so raising the cap needs no schema change. Raised to 20,000 chars (generous for a betting-analysis article, still bounded to avoid pathological pages) and the function now records whether it hit the new cap, so future truncation is detectable instead of invisible.

**Build:** `scripts/reacquire-article-sources.js` — reads `data/research-intel/review/article-intel-review-latest.json`, selects the 31 `metadata_only` + 181 `suspected_ingest_cap` records (212 total, matching the brief's count), and for each: re-fetches the URL with the raised cap, SHA-256-hashes the new body, preserves the old (truncated/empty) body alongside the new one rather than overwriting, records a retrieval timestamp, and — where the article contains multiple distinct picks (the Tyler Shough/Fernando Mendoza source is a confirmed real example) — splits it into one candidate selection per pick instead of flattening. Inaccessible URLs (404, timeout, paywall) are marked `unavailable` explicitly, never silently dropped or reconstructed from memory. Output is a new versioned file, not an in-place overwrite of the current review artifact.

**Cannot be live-verified from this sandbox** — outbound network access has been confirmed unavailable here in every prior session that tried (F-31, and re-confirmed for this repo's own live ingest agents). Built defensively per this repo's established pattern (see the FantasyPros integration's raw-vs-mapped diagnostic approach): every network/parsing assumption is isolated into pure, unit-testable functions, with a `--dry-run` mode that exercises the full pipeline against local fixtures. Needs Andy's native run to actually re-fetch the 212 URLs.

## What this does not do

Does not place bets, mark official picks, mutate the portfolio, write Supabase, make paid model/API calls, commit, or push. Does not run a fresh synthesis. Does not resolve McGovern/Parsons — it makes their unresolved status structurally impossible to ignore in sizing, not resolved. Does not build Kalshi/Polymarket normalization (separate follow-up per the brief §10).
