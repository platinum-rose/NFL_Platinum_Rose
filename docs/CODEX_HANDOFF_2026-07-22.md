# Codex Handoff — NFL_Dashboard Futures/Betting Analyst (2026-07-22)

Paste this whole document to Codex as the opening message of a new session. It's written to be self-contained — Codex won't have access to the ATLAS memory/HANDOFF system this project also uses, so everything needed to pick up cleanly is below.

## Where things are

Repo: `E:\dev\projects\NFL_Dashboard` (a Vite/React app + a set of standalone Node scripts under `agents/` and `scripts/` that don't go through the app build). Git HEAD as of this handoff: `690a826` on `main`, clean tree except 4 harmless empty scratch files (`agents/_verify_*_tmp.mjs` — untracked, safe to ignore or delete).

Key files for this thread:
- `agents/portfolio-dossier.js` — pulls live Supabase data (odds snapshots, team stats, schedule, injuries, referee/CLV signals, expert picks, podcast intel) into one JSON "dossier" for the LLM to reason over. Run: `node agents/portfolio-dossier.js --season 2026`.
- `agents/portfolio-synthesize.js` — feeds the dossier through a 3-stage Analyst Committee (Market+Football Analyst → Skeptic → Risk/Portfolio Editor), then code-owned validation, then ranking/rendering. Run: `node agents/portfolio-synthesize.js --dossier "<path from previous command's output>"`.
- `docs/FUTURES_ANALYST_WORKFLOW_SUMMARY_2026-07-22.md` — the fuller design writeup from the session that built the 3-stage committee.
- `docs/FUTURES_ANALYST_CODEX_REVIEW_2026-07-22.md` — a prior Codex review of that design. **Section 0 of this doc ("Add a Playoff Scenario Portfolio Layer") is the actual open task for you — see below.**
- `docs/NFL_AUDIT_BACKLOG.md` — has one long-standing open, non-blocking item (`GAMEID-FORMAT`, 3 incompatible `game_id` formats across live tables) unrelated to this thread.

## What's been built and verified so far

The 3-stage committee (Market+Football Analyst → independent Skeptic → Risk/Portfolio Editor), a code-owned `validateRecommendation()` that never trusts the model's self-reported `edge_pct` (always recomputes from `model_fair_prob` + `price`), an `evidence_ids` resolver that traces a recommendation's claims back to real dossier fields, and a backtesting log (Supabase `futures_recommendations` + `futures_recommendation_runs`, migrations 041–043, all confirmed live) were all built and code-reviewed in a prior session — see the workflow summary doc above for the full design.

**This session (the one handing off to you) did two things:**

### 1. Found and fixed two real bugs on the pipeline's first-ever live run

Running `portfolio-dossier.js` → `portfolio-synthesize.js` against real data for the first time immediately failed: gpt-4o rejected the prompt at 310,552 tokens (its 128K limit). Root cause: `buildSynthesisInput()` in `portfolio-dossier.js` was inlining a full copy of each team's season-aggregate context (prior record, strength-of-schedule, EPA/analytics, rest/schedule context, officiating tendencies, CLV signal, injuries) onto **every market row for that team** — with a team appearing in up to ~11 different markets, that's up to 11x duplication per team, ~740 rows total this run.

While fixing that, also found a real *correctness* bug, not just a size one: `normalizeTeam()` (in `src/lib/teams.js`) silently resolves a compound "Team A vs Team B" string (used by the `superbowl_matchup` market) to only its first matching team — so every matchup row's attached context blob was actually just team A's data, mislabeled as if it described the whole pairing. Team B's context wasn't duplicated, it was silently dropped and misattributed.

**Fix (commit `1a399bb`):** added a `team_profiles` top-level map to the dossier — each team's season-aggregate context computed exactly once, referenced by market rows via `team_nick` (single-team rows) or explicit `team_a`/`team_b` (matchup rows) instead of inlined. `portfolio-synthesize.js`'s evidence resolver was updated to merge a row's matched team profile back in before resolving `evidence_ids`, so citations like `analytics.off_epa_rank` still resolve exactly as before. Verified against the real dossier already on disk (`.nfl/portfolio/dossier-2026-07-22.json`) — synthesis payload dropped from 896,511 to 244,767 characters (**-72.7%**, roughly 224K → 61K tokens), and the matchup mislabeling was confirmed fixed (both teams now correctly identified).

Re-ran for real afterward (`node agents/portfolio-synthesize.js --dossier <path> --models gpt-4o`, since Anthropic credits were empty — see cost note below): succeeded end-to-end, 5 final recommendations. **`validateRecommendation()` immediately proved its worth** — it caught the model overstating (or in one case, sign-flipping) its own edge_pct on 4 of the 5 final picks, all before Andy ever saw the raw model claim.

### 2. Built a hedge-basket / parlay-ladder portfolio-construction feature (v1) — commit `690a826`

Andy described his own real strategy: primary conviction positions (this session: Bills, Packers) hedged by a spread of small stakes on long-odds `superbowl_matchup` combinations among other teams with real deep-run probability (Lions, Rams, Ravens, Chiefs, Eagles) — "playing several numbers on a roulette field." Separately, same-team sequential stacks where an early leg's payout funds a later leg's stake (e.g. Bears Over 9.5 wins → Make Playoffs → Super Bowl; Dolphins Over wins → Make Playoffs → small AFC bet).

Built as: a new `--primary "Team A,Team B"` CLI flag on `portfolio-synthesize.js`; two new SYSTEM_PROMPT sections instructing the model to propose (not compute) `hedge_baskets` and `parlay_ladders`; and code-owned math (`ladderMath()` / `hedgeBasketMath()`, relative "units" not dollars — matches the existing `stake_tier` convention) that resolves every named leg against the dossier's *real* placeable price (never a model-cited one, same discipline as `validateRecommendation()`), computes payout/liability, and flags or invalidates legs that don't resolve. New HTML/MD render sections. Tested via a 6-check synthetic harness (hand-calculated math, real-price resolution ignoring model-cited prices, partial-resolution flagging, full-invalidation, matchup-row resolution) plus a full offline integration smoke test of `main()` with `fetch()` stubbed — both passed clean.

## The actual open task for you

**While this was being built, `docs/FUTURES_ANALYST_CODEX_REVIEW_2026-07-22.md` was updated externally** (not by the session that just handed off — presumably Andy ran this exact strategy idea through you or a prior Codex session directly) with a new Section 0, **"Add a Playoff Scenario Portfolio Layer,"** now listed as *implementation-order item #1* — ahead of the validator, win-total math fix, etc., all of which are already shipped. That section's taxonomy is richer than the v1 that just shipped:

- `strategy_type: "playoff_scenario_book"` wrapper
- `anchor_positions` / `coverage_positions` / `ladder_stacks` (the ladder shape has per-step `role` tags: `funding_leg`, `option_bet`)
- A six-way role taxonomy: `anchor_bet`, `ladder_bet`, `coverage_bet`, `option_bet`, `pocket_hedge`, `dead_cost`, `funded_liability`
- A `playoff_hedge_plan` section for hedges placed **after** real playoff matchups are known (`trigger` / `action` / `reserved_bankroll`) — this doesn't exist in the v1 at all; v1 only covers pre-playoff basket/ladder construction.
- Suggested as a first-class report section: "Scenario Book / Playoff Hedge Map"

**Andy has not decided** whether to rename/rework the v1 (`hedge_baskets`/`parlay_ladders` in `portfolio-synthesize.js`, committed `690a826`) to match this richer taxonomy, or keep the v1 shipped and treat the richer version as a v2 extension. That decision — and the implementation if you/he decide to do the richer version — is the open work. Read Section 0 of `docs/FUTURES_ANALYST_CODEX_REVIEW_2026-07-22.md` in full before deciding; it also has a `Risk/Portfolio Editor` evaluation checklist (max exposure if all legs fail, effective cost basis if early legs win, whether exacta coverage spans enough plausible playoff paths, conference/division/QB-injury concentration) that the v1's Skeptic/Risk stages don't currently receive at all — v1 explicitly does NOT push hedge_baskets/parlay_ladders through the Skeptic/Risk committee stages (noted as a deliberate v1 scope cut in the code comments), which the richer spec's evaluation checklist would require if adopted.

## Known issue you should fix before trusting today's output files

A smoke test run during this session's development (stubbing `fetch()` to test the new code path without spending real API credits) wrote its dummy output to the same date-based filenames the real run had already produced: `.nfl/portfolio/portfolio-2026-07-22.html` and `.raw.json` currently contain **dummy smoke-test data**, not the real picks. `.nfl/portfolio/portfolio-2026-07-22.md` was recovered (the exact original text was still in the session transcript) and is trustworthy. **Re-run `portfolio-synthesize.js` for real** (same dossier, same command as above) before reading or trusting the `.html`/`.raw.json` files for today's date. If you build anything that writes to these same date-based paths, consider adding a `--out-suffix` or similar to avoid this collision class again during your own testing.

## Cost reference (measured + estimated, gpt-4o run from tonight)

Real numbers from tonight's run: Stage 1 used 96,046 prompt + 3,036 completion tokens (the only stage the code currently logs `usage` for); Stage 2/3 are much smaller (compact candidate summaries only, not the full dossier) — roughly 1,700 and 800 prompt tokens respectively, estimated. At gpt-4o's $2.50/$10.00 per million tokens (input/output), the whole run cost about **$0.29**. The as-designed two-model Claude committee (Opus 4.8 + Fable 5, default `--models`) would run Stage 1 twice and at higher per-token rates — Opus 4.8 $5/$25, Fable 5 $10/$50 per million — estimated **~$1.70/run**; Andy's Anthropic credits were empty tonight, hence the gpt-4o fallback. If you want exact cost tracking, `usage` currently isn't captured for the Skeptic/Risk stages (`raw2` in `main()`) — an easy addition if it matters to you.

## Working conventions established in this codebase (please keep following them)

- **Code owns math, never the model.** Every number a model reports gets recomputed from primitives (price + fair_prob) server-side before being trusted; see `validateRecommendation()` and the new `ladderMath()`/`hedgeBasketMath()` for the pattern.
- **Code owns validation, not just math.** Citations (`evidence_ids`) get resolved against real dossier data and reported as resolved/unresolved — never silently assumed true.
- **Partial failure is flagged, not hidden or hard-failed.** A recommendation/ladder/basket with some but not all legs/evidence resolving gets `status: 'flagged'` with the specific gap listed; only *zero* resolution is `'invalid'`.
- **Testing pattern:** this codebase has no test harness for the `agents/*.js` scripts (they're not part of the vitest suite, which only covers `src/lib/agentTools.js`). The established pattern for verifying changes to these scripts is a standalone synthetic `.mjs` scratch script that copies the exact new pure functions (not a reimplementation) and asserts hand-calculated expected values, plus (for anything touching `main()`'s control flow) an offline integration smoke test that stubs `global.fetch` and dynamically imports the real file — **just be careful about output-path collisions when doing this, per the Known Issue above.**
- **`node --check <file>` before considering any edit done**, and run `npx vitest run tests/unit/agentTools.test.js` (89 tests) if you touch `src/lib/agentTools.js` or `src/lib/supabase.js`.
- Git is normal on Andy's own machine — no special handling needed there (a Cowork sandbox used earlier in this project's history had an NTFS-mount quirk requiring `mv` instead of `rm` on stale `.git/*.lock` files; that's sandbox-specific and shouldn't apply to you running natively).
