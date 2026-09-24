# Pre-Committee Checklist — Everything to fix/test before spending on
# another `portfolio-synthesize.js` paid run

Compiled 2026-09-08, companion to `INTEL_PIPELINE_MAP.md` in this folder
(read that first for the architecture — this doc is the task list it
implies).

**UPDATED 2026-09-08 (same day, follow-up session):** Stage 0's two
preflight fixes are done and verified live. The Antigravity master-report
corpus (79 exhaustive extraction reports, previously fully synced to
Supabase but invisible to the prompt) is now bridged into the prompt,
verified via a mocked (`--prompt-only`) dry-run. BettorDay is fully removed
from the prompt (not just deprioritized). Two real prompt-size bugs found
and fixed (duplicate injury events across `player_availability` sublists;
unbounded per-book price maps in `SYNTHESIS INPUT`), saving ~32K tokens.
Committee `MODELS` default moved off the old claude-opus-4-8/claude-fable-5
onto the current-generation claude-opus-5/claude-fable-5-1 (1M-token context
at standard pricing, per Anthropic's current docs), which changes Stage 4's
prompt-size math substantially — see that section below. Everything else in
this doc is still an open punch-list item exactly as originally written
unless marked otherwise inline.

**UPDATED 2026-09-08 (third pass — Codex independent review, triage, and
three-way reconciliation):** Codex reviewed `CODEX_REVIEW_FUTURES_PORTFOLIO_
PIPELINE_2026-09-08.md` (the spec doc, companion to this checklist) plus the
live pipeline code and returned 6 findings (2 P1, 3 P2, 1 P3, plus a P2 on
podcast coverage). Claude fixed 5 of the 6 and corrected the 6th's
denominator rather than flipping its threshold outright; Antigravity and
Codex each independently reconciled and verified the fixes against live
code (see `handoffs/2026-09-08-1322-claude-codex-review-triage-handoff.md`,
`handoffs/2026-09-08-1335-antigravity-reconciliation-handoff.md`,
`handoffs/2026-09-08-1336-codex-claude-triage-reconciliation-handoff.md`).
Separately, Andy staged and ingested fresh BKR (Bookmaker) and BetUS futures
odds today, clearing those two books' staleness. Full detail on all of this
is folded into Stage 0 and Stage 1 below, and into Decision #3. **New team
structure as of this pass**: Antigravity has moved to owning the
podcast+article ingestion pipeline; Claude and Codex now work the
portfolio-synthesis pipeline in parallel, Claude on implementation, Codex on
independent review/approval before anything ships.

## Recommended stage breakdown, and why

The pipeline runs in a strict pipe: raw sources → normalization →
dossier assembly → prompt assembly → model committee → validation →
output/persistence. A bug introduced at any stage can look like a symptom
at a much later stage (e.g. a bad regex in ingestion shows up three stages
later as "the model cited a price that doesn't exist"), which is exactly
why this has been hard to pin down by testing the whole thing at once.
Testing stage-by-stage, cheapest/most-deterministic first, means every
failure you find is attributable to one place:

1. **Stage 0 — Meta-tooling.** Fix the preflight gate and evidence-gate
   scripts themselves first. Everything downstream trusts their PASS/BLOCK
   verdicts; two real blind spots were found in them this session
   (Section 9 of the map doc). No point re-running them for real signal
   until they're accurate.
2. **Stage 1 — Raw ingestion.** Per-source: is it landing, is it fresh, is
   it complete, is it correctly filtered (NFL-relevant, right season). Pure
   data-presence checks, no code logic to reason about yet.
3. **Stage 2 — Normalization funnel.** `signal-normalize.js` in isolation:
   does every lane it's supposed to read actually produce
   `normalized_signals` rows, and are the ones NOT supposed to go through it
   reaching the dossier some other correct way.
4. **Stage 3 — Dossier assembly.** `portfolio-dossier.js` end to end: every
   `fetch*()` lane populated, correct run order, `signal_coverage`
   self-report matches reality, sim-patch applied.
5. **Stage 4 — Prompt assembly ("what does the model actually see").**
   `--shadow-slim` retention, team-key-split, `adjacent_signals` shape,
   `experts` block, prompt size — this is the D-stage of the preflight tool,
   already largely passing, but re-verify after any Stage 1-3 fix since a
   fixed upstream lane can expose a new slimming bug downstream (more real
   data = more rows to slim = new edge cases).
6. **Stage 5 — Prompt content quality (source weighting).** The
   interpretive-guidance gap found this session: add explicit trust/weight
   framing for the currently-unexplained lanes, test that the model's
   output actually reflects it (this is the one stage that can't be
   verified without at least one real or mocked model call).
7. **Stage 6 — Model committee logic, mocked (zero spend).** Stage 1 →
   Skeptic → Risk/Editor merge logic, using the existing mocked-fetch
   harness pattern (real dossier, fake model responses) — proves the
   plumbing without paying for real model calls.
8. **Stage 7 — Validation gates.** `board-validate.js`,
   `namedPlayerSizingViolations`, the article/prediction-market/team-identity
   evidence gates in `scripts/lib/futures-evidence-gates.js` — re-run each
   and get a current, dated pass/fail number.
9. **Stage 8 — Output & persistence.** HTML/MD rendering, official-proposal
   export, the two Supabase writes (`futures_recommendations`,
   `futures_recommendation_runs`) — confirm they're gated correctly behind
   `--no-persist` / authorization, and that a prior real run's output can be
   trusted (Stage E "previous-run forensics" in the preflight tool).
10. **Stage 9 — Full mocked dry-run rehearsal.** Only after 1-8 are clean:
    one end-to-end run with real dossier data but mocked model responses
    (same harness as the 2026-09-03 board-validator dry run), inspect the
    full rendered report by eye, THEN — and only then — spend on a real
    paid run.

---

## Stage 0 — Fix the meta-tooling

- [x] **Fix `podcast_extraction_coverage` check in `agents/portfolio-preflight.js`**
      to count `podcast_host_summaries` instead of only `podcast_reextractions`.
      DONE and verified.
- [x] **Add season-phase awareness to `agents/portfolio-preflight.js`'s
      Stage A.** DONE and verified.
- [x] **Re-run `agents/portfolio-preflight.js --json` after both fixes above.**
      DONE: preflight went from 7 BLOCK / 7 WARN / 18 PASS to 3 BLOCK / 8
      WARN / 21 PASS. That's the current trustworthy baseline — but note the
      intel-source integrity audit (a *separate* strict gate, run inside
      `portfolio-synthesize.js` itself) still reported BLOCKED as of today's
      dry-run (Current 2 | Review 17 | Stale 7 | Blocked 1 | Missing 0 |
      Context 13) — that gate has not been cleared, only bypassed with
      `--allow-blocked-intel` for testing purposes.
- [ ] **Decide whether `scripts/lib/futures-evidence-gates.js`'s gates are
      wired into an actual pre-run block**, or are informational-only right
      now. If a gate can fail and a paid run still proceeds anyway, that's a
      wiring gap worth closing before spending money.
- [x] **Full `agents/portfolio-preflight.js` gate now enforced inside
      `agents/portfolio-synthesize.js` itself** (Codex review P2, fixed
      2026-09-08). Previously the synthesizer only ran its own narrower
      intel-source-audit and dossier-freshness checks — a real run could
      proceed even while live preflight reported
      `safe_to_run_paid_synthesis: false`. Now `portfolio-synthesize.js`
      spawns the full preflight gate before any non-`--prompt-only` run and
      hard-blocks on any BLOCK lane, with a documented
      `--allow-unsafe-preflight` override for a deliberate, visible
      exception. Note: `scripts/lib/futures-evidence-gates.js` (the item
      directly above) is a separate module, not wired into either gate —
      still genuinely open.
- [x] **`loadMasterReportEvidence()` unpaginated/nondeterministic Supabase
      read, fixed** (Codex review P1, `agents/portfolio-synthesize.js`).
      Was reading `vault_notes` with no `.range()`/ordering, taking
      whatever order Postgres happened to return; now paginates in 500-row
      pages with `.order('path', { ascending: true })`, same pattern as
      `fetchAllPaged()` elsewhere in this codebase.
- [x] **Team-scoped master-report matching could attach a report to the
      wrong team, fixed** (Codex review P2). Was plain substring
      `nameForMatch.includes(alias)`; now word-boundary regex
      (`\bALIAS\b`, case-insensitive) via a new `escapeRegExp()` +
      `TEAM_ALIAS_PATTERNS` construct — live-tested, matches correctly and
      no longer false-positives on a substring inside a longer word.
- [x] **`loadVaultReferenceEvidence()`'s two `vault_notes` reads, fixed
      (2026-09-09, live preflight A:rowcap BLOCK).** `vault_notes` grew past
      PostgREST's silent 1000-row cap, and preflight's call-site scanner
      flagged both reads in `agents/portfolio-synthesize.js` (~line 1264,
      1275) as truncating risk. On inspection, only one was a real bug: the
      reference-docs read (`.in('path', docPaths)`, `docPaths` always exactly
      `Object.values(REFERENCE_DOC_FILES).length` = 6 entries) can never
      return more rows than the array it's given, so it was a false positive
      from the scanner not recognizing `.in()` bounding — made the bound
      explicit anyway with a matching `.limit(docPaths.length)`, so the site
      is honestly self-documenting as safe rather than safe by accident of
      the array's current size. The team-notes read
      (`.like('path', 'NFL/Teams/%')`, no bound) was the genuine risk — could
      silently drop team deep-reads past row 1000 with zero signal to
      anyone. Fixed with the same `.range()` pagination + `.order('path',
      {ascending: true})` deterministic-tiebreaker convention used by
      `loadMasterReportEvidence()` two items above and
      `scripts/export-vault-to-md.js`'s `fetchAllNotes()`. Verified live:
      `agents/portfolio-preflight.js`'s `A:rowcap` lane went from 2 BLOCK to
      a clean PASS (0 truncating), total preflight BLOCK count dropped from
      5 to 3 (the 3 remaining are genuine data-staleness gaps — caesars/
      circa odds, player-availability, prediction-markets — not code).
      `node --check` clean, scoped eslint zero errors, full focused suite
      129/129 still passing (no test coverage existed for this function
      before or after — it has no unit tests, only the live preflight
      check). Nothing staged, committed, or pushed.
- [x] **Dead `bettorday_trench` evidence lane removed from
      `scripts/lib/dossier-freshness-gate.js`, fixed** (Codex review P1).
      BettorDay is fully removed from the prompt, but the freshness gate
      still tracked this lane with a 10-day max age, meaning an
      intentionally-dead lane could still BLOCK/WARN a real run. Lane and
      its max-age override both removed.
- [x] **Stale roster-churn warning text, fixed** (Codex review P3). The
      `nfl_rosters` preflight check still called the fixed pagination bug
      an "ARMED LANDMINE" needing a fix before week 2. Rewritten to say the
      pagination is already fixed (commit `65d47e3`, 2026-09-04) and the
      current single-week state is an expected preseason data-timing gap,
      not a code risk.
- [x] **`podcast_extraction_coverage` denominator corrected to exclude
      non-NFL episodes** (Codex review P2, refined after Andy flagged the
      denominator itself looked wrong). The check used to divide by ALL
      `podcast_transcripts` rows (167), including episodes from
      multi-sport feeds that are clearly non-NFL (Academy Awards, March
      Madness, NBA Finals, several UFC cards, World Cup, PGA majors,
      Kentucky Derby/Belmont) and should never have needed a host-summary
      extraction. Now filters both sides of the ratio through the existing
      `isNflRelevantEpisode()` filter (already used by `podcast-ingest.js`
      and `podcast-diarize-backfill.js`, just never applied here).
      Corrected live number: **55/128 NFL-relevant transcripts (43.0%)**,
      not 56/167 (33.5%). Still real backlog, still below the 90% PASS
      threshold — left as WARN, not flipped to BLOCK, since that would
      still block nearly every run today; the fix was making the number
      honest, not changing the policy.

## Stage 1 — Raw ingestion, per source

For each row: confirm it's landing, confirm freshness against a cadence
that makes sense (call out ones that should legitimately wait for the
season vs. ones that are just stale from neglect), confirm known bugs are
actually fixed in production (not just fixed in a local test).

- [x] **`futures_odds_snapshots` — Bookmaker and BetUS refreshed
      2026-09-08.** Andy pasted fresh BKR (`docs/Futures_Odds/BKR_Odds_0908`,
      256 rows across all 16 market types) and BetUS
      (`docs/Futures_Odds/BetUS_Odds_0908`, 480 rows, including 256
      Super Bowl matchup combos) text exports. Parsed via the existing
      `scripts/parse-futures-text.js --book bookmaker|betus` →
      `data/futures-imports/{bookmaker,betus}-2026-09-08.json` →
      `scripts/ingest_futures_json.py` (dry-run verified first, then
      written) — idempotent upsert into `futures_odds_snapshots`. Live
      preflight now shows both books at 0.9 days fresh. **Still open**:
      `caesars` is 10 days stale and `circa` has never been captured, so
      this lane still reports BLOCK overall — not a code problem, needs
      Andy to source fresh data for those two books specifically.
- [ ] **`player_injuries`** — re-check freshness (was fine as of the last
      preflight run, re-verify it still is by the time of the real run).
      Confirm the `normalizeInjuryStatus()` spelling-coverage check still
      passes (it did as of 2026-09-08) — this one silently dropped every
      "Injured Reserve" row before it was fixed, worth a periodic recheck
      whenever the underlying source's spelling conventions might drift.
- [ ] **`data/player-availability/latest.json`** (25.7d stale, limit 7d) —
      confirm whether this lane is meant to run on a fixed weekly cadence
      regardless of season phase (practice reports run in preseason too) or
      whether its staleness is itself a symptom of the same "nothing to
      report yet" pattern as the stats tables. If it should be running now,
      rebuild it; if not, adjust the preflight's `maxAgeDays` assumption for
      this lane during the offseason/preseason window.
- [ ] **`data/expert-dossiers/latest.json`** (18.0d stale, limit 14d) —
      rebuild via `scripts/build-expert-dossiers.js` + `build-host-citations.js`.
- [ ] **`data/prediction-markets/latest.json`** (16.2d stale, limit 7d) —
      rebuild via `scripts/build-prediction-market-map.js` →
      `scripts/build-cross-market-coherence.js` (pure local transform, no
      network/Supabase — cheap and safe to re-run).
- [ ] **`team_coaching_tendency_snapshots`** — empty for every season.
      Either this pipeline was never actually run (check
      `scripts/build-coaching-tendency-snapshots.js` /
      `build-coaching-scheme-classifier.js` for whether they've ever been
      executed against real data), or the table itself has a wiring problem.
      Full evidence lane (`coaching_profile`) currently contributing nothing
      to every dossier.
- [x] **`nfl_rosters` pagination — CORRECTION 2026-09-08, this checklist
      (and `INTEL_PIPELINE_MAP.md`) had this WRONG.** Verified by reading
      the live code: `fetchRosterChurn()` was already fixed for both the
      week-discovery read AND the per-week row read in commit `65d47e3`
      (2026-09-04), four days before this checklist was even compiled — the
      function now pages week-discovery until 2 distinct weeks are found (or
      returns `{}` gracefully), and pages every per-week row read via
      `fetchAllPaged()` rather than trusting a single 1,000-row slice. This
      checklist's "still needs pagination fixed" language was stale/carried
      over without re-checking the current code. Live-verified today: Supabase
      currently holds 3,686 `nfl_rosters` rows for 2026, ALL of them week 1 —
      that's expected (week 1 kickoff is 2026-09-11, roster cuts/practice-squad
      churn for week 2 hasn't happened yet), not a bug. No code change needed
      here. `roster_churn` will start populating on its own once week 2 data
      lands; worth a quick live re-check after kickoff, but nothing to fix.
- [ ] **11 RSS/JSON research-intel feeds** — re-confirm current feed_health:
      as of the last recorded check, 9/11 healthy (THE WINDOW still 403 in
      production, deprioritized; Football Outsiders permanently dead,
      accepted). Re-verify nothing regressed since.
- [ ] **Podcast ingestion (`podcast_transcripts`, `podcast_episodes`)** —
      confirm the `skipped_non_nfl` relevance filter is still working
      correctly on new episodes (53/256 filtered as of this check). Resume
      the `podcast-reextract.js` OR `podcast-host-summary.js` pass on the
      111 transcribed episodes that still lack a host summary (see Stage 0
      note on which table should be the tracked target).
- [ ] **`x_sharp_tweets`** — confirm whether the current indirect path
      (via `intel-to-vault-sync.js` → `vault_notes`) is intentional and
      sufficient, or whether this deserves a direct read into
      `signal-normalize.js` like `research_pick_signals` got in the
      2026-09-04 Tier-4 fix. Andy's call — depends on how much signal is
      actually in this table vs. noise.
- [ ] **`nfl_trench_ratings` (BettorDay)** — confirm whether Supabase has
      live data yet (migration 053) or whether the pipeline is still
      running off the local-file fallback (`sourceMode` in the loader's
      return value tells you which).
- [ ] **Article evidence corpus** — re-run `scripts/build-article-intel-review.js`
      fresh (it's a Supabase read, not a write) to get a current unresolved
      count; it was 108 as of 2026-09-03 and the underlying corpus keeps
      growing.
- [ ] **`data/prediction-markets`** ticker-parsing gotcha — spot-check that
      `predictionMarketTeamFromTicker()` / the `KXNFLWINS` special-case
      parsing in `fetchPredictionMarkets()` still correctly resolves every
      team after any upstream format change from the data vendor.

## Stage 2 — Normalization funnel (`agents/signal-normalize.js`)

- [ ] Confirm all 5 lanes (RSS articles, podcast free-text intel, podcast
      structured picks, expert picks/`user_picks`, podcast host summaries)
      are producing `normalized_signals` rows with sane team/market
      resolution — spot check for false team-name matches (the documented
      "carolina" → Panthers false-positive-on-college-lines guard should
      still be catching these).
- [ ] Confirm `research_pick_signals` filtering (drops CFB/other-sport rows,
      drops verbatim headline echoes) is still working as intended — this
      table is described in the code as "52% verbatim article-headline
      echoes and >60% CFB/other sports," so the filter is load-bearing, not
      cosmetic.
- [ ] Decide on the `x_sharp_tweets` question from Stage 1 and implement if
      Andy wants it added as a sixth lane.
- [ ] Spot-check normalized signal output for a handful of teams by hand:
      does the direction/strength look right against the source text it was
      derived from?

## Stage 3 — Dossier assembly (`agents/portfolio-dossier.js`)

- [ ] Confirm correct run order is actually followed for the real build:
      `signal-normalize.js` → `portfolio-dossier.js` → `portfolio-simulate.js`.
      The preflight tool's Stage C already checks this (signals-vs-dossier
      timestamp comparison, sim-patch presence) — make it part of the
      standard pre-run ritual, not an afterthought.
- [ ] After Stage 1/2 fixes land, rebuild a fresh dossier and check
      `meta.signal_coverage` / `signal_coverage` for zeroed lanes — it
      currently reports zero coverage for `coaching_profile`, `officiating`,
      `roster_churn`, which should shrink or explain itself once those
      Stage 1 items are addressed.
- [ ] Confirm `fetchNamedPlayerSizingGates()` still hard-fails correctly if
      `named-status-review.json` is stale or invalid (this is the one lane
      explicitly designed to block rather than degrade silently — good
      pattern, worth confirming it still triggers on a deliberately-broken
      test file).

## Stage 4 — Prompt assembly / slimming

- [ ] Re-run the preflight tool's Stage D checks (market-row-retention,
      positive-edge-loss, team-key-split, adjacent_signals-shape,
      dropped-profile-fields, experts-block, prompt-size) against the FRESH
      dossier built in Stage 3 — all six passed against the 2026-09-04
      dossier; confirm they still pass once real data volume changes (more
      rows from fixed lanes can expose a slimming edge case that didn't
      exist when those lanes were empty).
- [x] Watch prompt-size specifically — UPDATED 2026-09-08: with the
      Antigravity master-report bridge added, the shadow-slimmed prompt was
      257,813 tokens; after fixing two real bugs (duplicate injury events
      across `player_availability` sublists, and unbounded per-book price
      maps on every `SYNTHESIS INPUT` row) it's down to 225,788 tokens.
      Separately, `MODELS` moved to claude-opus-5/claude-fable-5-1, which
      carry a standard-priced 1M-token context (no surcharge, no beta
      header, per Anthropic's current docs) — so the 200K-context ceiling
      this checklist was written against no longer applies to the models
      the pipeline actually calls. Net: prompt size is no longer a
      truncation risk. The two trims are still worth keeping (lower
      per-run cost, less irrelevant volume for the model to weigh), but
      this is no longer a gating concern for Stage 9. If Stage 1 fixes add
      substantially more real data later, re-verify the slim budget isn't
      starving new lanes the same way it once did older ones — that
      general caution still holds even with more headroom.

## Stage 5 — Prompt content quality / source weighting

- [x] UPDATED 2026-09-08 (Claude): Added interpretive/trust guidance to
      `SYSTEM_PROMPT` for `vault_analytical_reads`, `training_camp_intel`,
      and `master_reports`. Each field's bullet in the TEAM PROFILES section
      now states its trust tier inline, and a standalone "SOURCE HIERARCHY"
      paragraph (new, ~26 lines) spells out a 4-tier weighting: Tier 1
      price/computed signals (primary), Tier 2 named+timestamped analyst
      leans (corroboration), Tier 3 vault_analytical_reads/master_reports
      (supplementary narrative — flag needs_human_review if a play rests on
      Tier 3 alone), Tier 4 training_camp_intel (color only). `bettorday_trench`
      confirmed moot — already fully removed from the prompt (Decision #2),
      no lane left to write guidance for. `node --check` clean, `eslint`
      clean (0 errors), verified live in `--prompt-only` output (system
      prompt now 26,117 chars; full shadow-slim prompt 232,800 tokens vs the
      225,788 recorded 2026-09-08 morning — the increase is this addition;
      no longer a truncation risk per the earlier 1M-context-model note).
      Diff is isolated to this addition only (confirmed against a
      pre-edit backup) — nothing else in `portfolio-synthesize.js` touched.
      Uncommitted, per standing guardrail.
- [x] UPDATED 2026-09-08 (Claude): wrote the explicit source-hierarchy
      statement (see above) — followed the example framing from this
      checklist's own draft (price action primary, named analyst leans
      corroboration, narrative context supplementary/non-overriding) and
      extended it with an explicit 4th tier for training_camp_intel and a
      concrete escalation rule (Tier-3-only theses get needs_human_review).
      Not yet reviewed by Andy — flag for his sign-off before this is
      treated as final wording, per this stage's own instruction to draft
      for review.
- [x] RESOLVED 2026-09-08 (Claude, per Andy's explicit policy decision
      "guarded-with-enforcement"): rewrote the SOURCE HIERARCHY paragraph to
      remove the Tier 1/Tier 3 self-contradiction Codex flagged. New wording:
      Tier 1/2 grounding is required for a CORE/STANDARD stake; a Tier-3/4-
      only-backed play MAY still be proposed but MUST be
      `needs_human_review=true` and `small`/`speculative` — never
      core/standard. Also folded the six previously-unclassified structured
      fields into Tier 1 as an explicit list (`dvoa`, `coaching_profile`,
      `officiating_context`, `prediction_markets`, `injuries`/
      `player_availability`, `roster_churn`), framed as a general class
      ("real, traceable structured data") with a pointer back to each
      field's own existing freshness/small-sample caveats rather than
      restating them. Tier 3 wording also now explicitly states that a
      trusted host/outlet's NAME inside `vault_analytical_reads`/
      `master_reports` does NOT promote the whole container to Tier 2 —
      only an individual claim with its own normalized speaker+timestamp+
      market/direction (i.e. an actual Tier 2 lean) would qualify.
- [ ] REOPENED 2026-09-08 (Codex follow-up review) — Claude added the
      intended detection path, but the escalation rule is not yet mechanically
      forced as Andy specified:
      1. `agents/lib/board-validate.js`: new `classifyEvidenceTier(id)`
         (dot-path first-segment classifier — defaults to Tier 1 unless
         matched to Tier 2/3/4's field sets, so new structured fields land
         in Tier 1 automatically) and `evidenceTierViolations(candidate)`,
         wired into `validateBoard()` alongside the existing
         `namedPlayerSizingViolations()` (same annotate-and-keep pattern
         per this file's locked decision #3 — never mutates, stamps a
         visible violation string instead). Fires only when a candidate's
         RESOLVED `evidence_ids` trace to Tier 3/4 ONLY (no Tier 1/2) —
         flags a cap violation if `stake_tier` isn't small/speculative, and
         a separate violation if `needs_human_review` isn't true. Runs on
         `final` (post Risk/Editor) via the existing `validateBoardBatch`
         call site, so it detects a flag/cap violation any earlier stage
         missed. It does not currently reverse or normalize the unsafe
         values. Covered by 20 inline
         assertions run against the actual module (tier classification for
         all four tiers including the six newly-added Tier 1 fields, a
         direct-team-row Tier-3-only case, a Tier-4-only case, a properly-
         flagged/capped case, a Tier-1-mixed case, a Tier-2-only case, and
         a zero-resolved-evidence case) — all 20 passed.
      2. `agents/portfolio-synthesize.js` `applyRiskEditor()`: fixed the
         actual bug Codex found — `f.needs_human_review ?? c.needs_human_review
         ?? false` used `??`, which only falls through on null/undefined,
         so a Risk/Editor pass explicitly writing `false` silently erased
         an earlier Stage 1/Skeptic `true`. Changed to
         `!!(c.needs_human_review || f.needs_human_review)` — monotonic OR,
         a flag once raised can no longer be un-raised by a later stage.
      3. `RISK_EDITOR_SYSTEM_PROMPT` + `buildRiskEditorUserPrompt()`: the
         Risk/Editor previously never even received the incoming
         `needs_human_review` value or `evidence_ids`, so it had no way to
         honor the guarded policy even cooperatively — both are now passed
         through, and the prompt explicitly states the floor (can only add
         `true`, never clear it) and the guarded-policy cap (Tier-3/4-only
         evidence stays small/speculative + flagged). This is belt-and-
         suspenders with the mechanical fixes above, not a substitute for
         them — the code-owned checks are what actually holds if the model
         ignores this.
      `node --check` clean on both files, `eslint` clean (0 errors), diffed
      against pre-edit backups to confirm changes are isolated to exactly
      this work. Live preflight re-run: unchanged 3 BLOCK/8 WARN/22 PASS
      (expected — doesn't inspect prompt/validator code).  `--prompt-only`
      dry-run confirmed the new guarded-policy language and all six newly-
      classified field names are present in the actual rendered
      `system_prompt` (27,912 chars; shadow-slim prompt now ~233,520
      tokens, still no truncation risk).
      Also added a 21st assertion confirming the gate covers a two-team
      `superbowl_matchup` exacta candidate identically to a direct team row
      (the check is evidence-based, not row-shape-based, so this was
      expected but is now actually verified, not assumed) — passed.
      **Still needs**: the real Stage 6 mocked-model-call verification (see
      Stage 6 below) — none of this has been exercised through an actual
      model response yet, only through code-level unit assertions and
      prompt assembly. Also still needs Andy's sign-off on the exact
      wording now that the P1 contradiction is resolved.
      **Codex follow-up result:** the rewritten hierarchy cleanly implements
      Andy's guarded policy, the monotonic OR in `applyRiskEditor()` is
      correct, and giving the Risk/Editor the incoming review flag and
      `evidence_ids` is useful low-cost defense in depth. The remaining P1 is
      downstream enforcement: `evidenceTierViolations()` only returns strings
      and `validateBoardBatch()` only adds `validation`; the candidate remains
      `needs_human_review=false`/`stake_tier=core`. The report still displays
      those unsafe values beside a generic board-validator badge,
      `candidateToOfficialProposal()` omits `candidate.validation` and can
      export the candidate as proposal-ready at core units, and
      `persistRecommendations()` stores the original false/core values. Add a
      code-owned normalization step before ranking/export/persistence that
      forces `needs_human_review=true` and downgrades core/standard to small
      (or speculative), while retaining the board violation as an audit note.
      Make the focused assertions durable tests, then run Stage 6 end to end.
      **Classifier follow-up:** replace default-to-Tier-1 prefix matching with
      an explicit allowlist of qualifying Tier-1/2 roots and fail unknown,
      missing, or unresolved evidence closed to the guarded state. Across 32
      existing `.raw.json` artifacts, evidence IDs include canonical paths but
      also `wins.*`, `division_*.*`, `dossier.team_profiles.*`,
      `team_profiles.*`, and composite-key shapes; several encode a nested
      `lean` below a non-Tier-2 first segment. The current first-segment rule
      would call any resolved unknown/metadata/new narrative field Tier 1, and
      empty evidence bypasses both this gate and strict validation's
      all-unresolved check.
      **Exacta follow-up:** the direct helper assertion pre-populated
      `evidence_resolved`, so it did not exercise real exacta resolution.
      `teamProfileForRow()` merges only `team_a`; Tier-3/4 evidence belonging
      to `team_b` cannot resolve through the current unqualified path scheme.
      Add a real integration case with both profiles/namespaced IDs, or make
      the existing sim-price-only policy actually exclude exactas before
      proposal export/persistence rather than merely annotate them.

- [x] RESOLVED 2026-09-08 (Claude, round 3 — addresses all three of Codex's
      P1/P1/P2 findings above):
      1. **Real enforcement, not just annotation** (P1 "violations do not
         enforce the policy"). `agents/lib/board-validate.js` adds
         `enforceEvidenceTierGate(candidate)` — a pure function (never
         mutates its input; returns a NEW object, or the SAME reference
         unchanged when nothing needs to change) that actually forces
         `needs_human_review: true` and downgrades `stake_tier` to `'small'`
         (leaving an already small/speculative tier alone) whenever
         `hasQualifyingGrounding(candidate)` is false, tagging the result
         `evidence_tier_enforced: true`. `agents/portfolio-synthesize.js`
         now calls `final = final.map(enforceEvidenceTierGate)` in the
         pipeline tail, immediately after `validateBoardBatch()` and BEFORE
         `rankByAxis()`, `exportOfficialProposalDrafts()`, the raw.json
         write, `persistRecommendations()`, and `persistRecommendationRuns()`
         — i.e. before every downstream consumer of `final`, per Codex's
         explicit closure criterion. `evidenceTierViolations()` (the
         annotator) is kept as-is for the visible `validation` audit trail
         — this is additive, not a replacement.
      2. **Fail-closed classifier, not fail-open** (P1 "unknown evidence
         defaults to primary"). `classifyEvidenceTier()` no longer defaults
         unmatched IDs to Tier 1. It now checks an explicit `TIER1_FIELD_ROOTS`
         allowlist (built directly from `agents/portfolio-dossier.js`'s real
         row-level and team-profile field names — `fair_prob`, `value_gap`,
         `analytics`, `dvoa`, `coaching_profile`, `officiating_context`,
         `prediction_markets`, `injuries`/`player_availability`,
         `roster_churn`, etc.) and returns `null` ("unrecognized") for
         anything else — including the concrete noncanonical shapes Codex
         named (`wins.*`, `division_*.*`, `conference_*.*`,
         `dossier.team_profiles.*`, `team_profiles.*`, `bettorday_trench`).
         A new `hasQualifyingGrounding(candidate)` helper is the single
         source of truth for "does this candidate have real Tier 1/2
         support" — true only when at least one RESOLVED evidence_id
         classifies as Tier 1 or 2. This closes both the fail-open-classifier
         gap and the empty-`evidence_ids` bypass in one helper (no resolved
         evidence at all, resolved-but-narrative-only, and
         resolved-but-unrecognized all now fail the same way).
      3. **Exacta team_b gap — excluded, not patched** (P2 "exactas resolve
         only team_a context"). Rather than build team-qualified evidence-ID
         resolution (bigger, riskier), applied Codex's suggested simpler
         alternative: new `isSimPriceOnlyCandidate()` /
         `partitionSimPriceOnly()` in `board-validate.js` actually EXCLUDE
         `superbowl_matchup` candidates from `final` (mirroring locked
         decision #4 — "sim-price context only, never a card" — which
         `validateBoard()` already annotated but didn't enforce). Wired into
         the pipeline tail right before the tier-gate step; excluded
         candidates are stamped with an `excluded_reason` and `stage:
         'board_validator'` and appended to `passed` (same pattern as the
         existing `invalidated`/`passed` exclusion elsewhere in this file).
         Grepped all `superbowl_matchup` usages first to confirm this is
         safe — it only ever legitimately appears elsewhere via
         `hedge_baskets`/`parlay_ladders` legs and `watchlistReview`, both
         separate arrays untouched by filtering `final`.
      **Verification:** `node --check` clean on both files; `eslint` clean
      (0 errors) on both files plus the new test file; new durable suite
      `tests/unit/evidenceTierGate.test.js` (29 tests, replacing the round-2
      scratch-script assertions) covers tier classification (all 4 tiers
      plus the 8 concrete unrecognized shapes Codex named),
      `hasQualifyingGrounding`, `evidenceTierViolations` (incl.
      no-mutation), `enforceEvidenceTierGate` (incl. same-reference no-op
      vs. new-object-on-change, non-mutation of the original, and the
      already-speculative-stays-speculative case), and the sim-price-only
      partition (incl. non-mutation, empty-list, and a synthetic exacta
      case) — all pass. Existing related suites re-run clean alongside it:
      `boardValidate.test.js` (25), `boardValidateNamedPlayerGate.test.js`
      (11), `namedStatusReviewSizingGates.test.js` (12),
      `dataGatheringSprint.test.js` (7) — 84 tests total, zero regressions.
      `agents/portfolio-preflight.js` re-run: 3 BLOCK/8 WARN/22 pass,
      unchanged from the round-2 baseline (all pre-existing data-staleness
      issues, unrelated to this code). Diffed both changed files against
      fresh pre-edit backups to confirm the changes are isolated to exactly
      this work. No model calls, preflight rerun beyond the read-only check
      above, writes, staging, commit, or push were performed.
      **Still needs**: Codex re-review of this round, then Stage 6's real
      mocked end-to-end run (still not attempted — this only exercises the
      new logic through unit tests and static checks, not an actual
      model-response-shaped run, per Codex's own instruction that Stage 6
      "should run after the P1 corrections, [and] should not be used to
      bless the current annotate-only behavior").

- [x] BLOCKING FOLLOW-UP 2026-09-08 (Codex round-3 final review) — RESOLVED
      round 4 (Claude): the real enforcement step is correctly placed and
      exactas are now removed from `final`, but the Tier-1 allowlist
      included identity-only `team`. Because the strict validator resolves
      `team` from a normal dossier row, `hasQualifyingGrounding()` returned
      true and `enforceEvidenceTierGate()` left a `core` / unreviewed
      candidate unchanged. **Fix**: removed `team` from `TIER1_FIELD_ROOTS`
      in `agents/lib/board-validate.js`. Per Codex's instruction to "review
      other locator/display-only roots under the same substantive-evidence
      rule," also removed `best_book`, `best_over_book`, `best_under_book`
      — these are book-NAME labels (which sportsbook, e.g. "bookmaker"),
      not price/edge data, so citing one alone is the same identity-only
      bypass `team` was. The paired numeric fields that actually carry
      signal (`best_price`, `best_prob`, `best_over`, `best_under`,
      `value_gap`, etc.) are untouched and remain Tier 1. Added 7 new
      regression tests to `tests/unit/evidenceTierGate.test.js` (now 36
      total) including Codex's exact repro (`evidence_ids: ['team']` alone
      forced to `needs_human_review: true` / `stake_tier: 'small'`), the
      book-locator-only case, confirmation the paired price fields still
      classify Tier 1, and confirmation a candidate with `team` PLUS a real
      Tier 1 field is still correctly treated as grounded (not
      over-punished). `node --check`/eslint clean; full related suite
      re-run clean (91 tests: evidenceTierGate 36, boardValidate 25,
      boardValidateNamedPlayerGate 11, namedStatusReviewSizingGates 12,
      dataGatheringSprint 7 — zero regressions); preflight unchanged (3
      BLOCK/8 WARN/22 pass, pre-existing data staleness only); diffed
      against a fresh pre-edit backup — change isolated to the allowlist
      edit and its doc comment in `board-validate.js` alone,
      `portfolio-synthesize.js` untouched this round.
      **Not addressed this round (Codex's own disposition: "P2
      correctness/overguarding, not an unsafe bypass")**: allowlist
      completeness against real production evidence_id shapes (some real
      structured roots may be missing and thus safely overguarded; three
      recognized top-level roots — `roster_churn`, `adjacent_signals`,
      `experts` — still can't resolve through the current
      `evidenceRowFor()` merge). Codex's recommendation stands: treat this
      as an explicit Stage 6 acceptance check rather than a round-5 code
      change. Full prior evidence: `handoffs/2026-09-08-2256-codex-
      guarded-policy-round3-final-review-handoff.md`. Round-4 detail:
      `handoffs/2026-09-08-2308-claude-guarded-policy-round4-handoff.md`.

- [x] CODEX SIGN-OFF 2026-09-08 (spot-check of round 4): no blocking
      findings. `team`/`best_book`/`best_over_book`/`best_under_book` now
      classify as unrecognized and correctly force
      `needs_human_review: true` + `stake_tier: small` on a candidate that
      cites only one of them (independently probed and confirmed). Removing
      the book-name locator fields was appropriate, not scope creep — "they
      are locators, not evidence." No other identity/locator-only field
      found remaining in the allowlist. `n_books`, `per_book`, `books`, and
      `line_consensus_confidence` were specifically checked and judged
      legitimately substantive (market depth / actual cross-book
      observations / quantified consensus quality) — reasonable Tier 1
      under the current policy; Codex suggests Stage 6 include an
      `n_books`-only case to confirm this boundary is intentional, but
      does not block on it. Verification independently reproduced: syntax
      + eslint clean, 91/91 tests across the five related files, direct
      probes confirming all four removed roots now enforce the guarded
      state. **Codex's verdict: Stage 5's guarded-with-enforcement policy
      is code-complete and ready for Stage 6's mocked, zero-spend run** —
      the remaining allowlist-completeness/unreachable-top-level-field
      items are to be carried into Stage 6 as acceptance checks, not
      further Stage 5 blockers. No files changed, staged, committed, or
      pushed this pass; no model calls, persistence, or betting actions.

## Stage 6 — Model committee logic (mocked, zero spend)

- [x] Include the `n_books`-only test case Codex suggested — confirm a
      candidate grounded solely by a bare `n_books` count is intentionally
      treated as adequate Tier-1 structured support (not another
      identity/locator-style gap like `team` was) — flag to Andy if this
      boundary looks wrong once exercised end to end.

      **DONE 2026-09-09 (Claude, mocked zero-spend run).** Rams/`most_wins`
      candidate grounded solely by `evidence_ids: ['n_books']` (real dossier
      value 24) survived with `stake_tier: core` unchanged and no
      `evidence_tier_gate` validation message — confirms the boundary
      behaves as Codex expected. See
      `handoffs/2026-09-09-0010-claude-stage6-mocked-verification-handoff.md`.

- [x] Re-run the mocked-fetch dry-run harness (the same pattern used
      2026-09-03 for the board-validator fix: `node --import
      file://.../mock-fetch-preload.mjs agents/portfolio-synthesize.js
      --dossier <fresh-dossier> --only opus --skip-intel-audit --no-persist
      --out-suffix DRYRUN-<date>`) against the FRESH dossier from Stage 3,
      with the Stage 5 prompt changes in place.

      **DONE 2026-09-09 (Claude).** Original 2026-09-03 harness no longer
      existed in the repo; rebuilt an equivalent from scratch
      (`~/scratch/stage6-mock-preload.mjs`) informed by the current
      `callModel()` fetch call sites. Ran against
      `.nfl/portfolio/dossier-2026-09-04.json` with
      `--out-suffix DRYRUN-stage6-2026-09-09`, `--no-persist`, zero real
      model calls (hard-throws on any unmocked fetch target). Full command
      and results in
      `handoffs/2026-09-09-0010-claude-stage6-mocked-verification-handoff.md`.

- [ ] Confirm Stage 1 (candidates) → Skeptic → Risk/Editor merge logic still
      behaves: `applySkepticVerdicts()`, `applyRiskEditor()`, the
      `entry_plan` scale-in feature, `rankByAxis()`.

      **CORRECTED 2026-09-09 (Codex final review, P2) — NOT done, overstated.**
      Originally marked done based on: mocked Stage 2 returned
      `{verdicts: []}` and Stage 3 returned an empty `{finalized: [], passes: []}`
      so all 8 candidates fell through both merges unchanged by design
      (isolating Stage 5's own enforcement rather than Skeptic/Risk-Editor
      cooperative behavior) — pipeline ran end to end with no merge-logic
      errors, 6 of 8 candidates reached `final`, reports rendered
      successfully. Codex's final cumulative review correctly flagged this
      as exercising only the no-op/fallthrough path, not real Skeptic
      hold/downgrade/kill application, Risk/Editor tier/review updates, the
      monotonic review-flag merge under an actual editor response,
      `entry_plan.scale_in` propagation, Risk/Editor passes, or meaningful
      ranking changes. No focused tests currently reference
      `applySkepticVerdicts()` or `applyRiskEditor()`. Still open: rerun
      Stage 6 with a mock matrix that actually returns non-empty
      Stage 2/3 responses exercising hold/downgrade/kill and tier/review
      updates before marking this done again.

- [x] Confirm the mocked run actually exercises the newly-weighted lanes
      (craft mock responses that reference `vault_analytical_reads`,
      `master_reports`, and `training_camp_intel`; include Tier-3/4-only and
      mixed-tier cases, then verify the final review flag/stake cap survives
      the Risk/Editor merge and post-hoc validation). This is not perfectly
      representative of a real model call, but it is free and catches gross
      prompt-wiring and enforcement errors. `bettorday_trench` is intentionally
      absent because it no longer reaches the prompt.

      **DONE 2026-09-09, partially — CORRECTED by Codex review.** Four
      candidates (Raiders, Dolphins, Titans, Cardinals) were correctly
      forced to `stake_tier: small` with a self-documenting
      `evidence_tier_gate:` validation message surviving into both the raw
      JSON and the rendered `.md` report ("Needs Review · 🚫 BOARD
      VALIDATOR FLAG"). **Correction**: the Dolphins candidate's mocked
      `vault_analytical_reads.some_report_id` evidence_id did NOT resolve
      (`resolved: false` — the id was a placeholder not present in the real
      dossier), so Dolphins actually went through the same "no resolved
      evidence_ids at all" branch as Raiders/Titans, not a genuine
      resolved-Tier-3 branch as originally claimed here — three instances
      of one branch, not three distinct ones. A genuinely-resolved Tier-3
      (`vault_analytical_reads`) or Tier-4 (`training_camp_intel`) citation
      was NOT exercised through this run — both remain unit-verified only
      (`tests/unit/evidenceTierGate.test.js`), tracked as future
      integration-acceptance coverage, not a blocker. Two of the 8 planned
      candidates (canonical-Tier-1 "stays core," and the
      `superbowl_matchup` exacta exclusion via `partitionSimPriceOnly()`)
      also did not reach their intended checkpoint — both were invalidated
      one step earlier by `validateRecommendationStrict()` for reasons
      unrelated to Stage 5 (a mocked win-total line that didn't match the
      real dossier line, and an exacta whose lower-bound edge under
      code-owned uncertainty was negative). Codex's assessment: none of
      this blocks Stage 5/6 closure — `partitionSimPriceOnly()` has direct
      unit coverage (incl. the team-a/team-b collision case) and is wired
      unconditionally before enforcement/ranking/rendering/persistence.
      Codex re-ran the focused suites clean (61/61,  `evidenceTierGate` +
      `boardValidate`) and recommends Andy's sign-off prose state plainly
      that exacta exclusion and resolved Tier-3/Tier-4 paths remain
      unit-verified rather than end-to-end verified. Full detail (including
      Codex's full addendum) in
      `handoffs/2026-09-09-0010-claude-stage6-mocked-verification-handoff.md`.

- [x] **CODEX SIGN-OFF 2026-09-09**: Stage 5/6 close, proceed to Stage 7.
      Reviewed the Stage 6 run's raw/rendered outputs directly, caught the
      Dolphins-branch mischaracterization above, confirmed the enforcement
      mechanism itself (evidence-tier gate forcing `stake_tier` + the
      `evidence_tier_gate:` message surviving into rendered output) is
      demonstrated correctly on the other three forced candidates plus both
      non-forced ones. Flagged that the disposable mock harness
      (`~/scratch/stage6-mock-preload.mjs`) was deleted after the run, so
      its zero-network construction can't be independently re-inspected —
      recommend preserving the harness file or a hash/receipt of it
      alongside future mocked-run outputs for reproducibility.

## ⚠️ REOPENED 2026-09-09 — Codex's final cumulative session review found NEW blocking issues

**Stage 5/6 is NOT closed.** The "CODEX SIGN-OFF" and "APPROVED AS-IS"
entries directly above were superseded within the same session by a
requested final cumulative review, which came back NOT CLEAN. Full detail:
`handoffs/2026-09-09-0100-codex-final-review-stage5-reopened-handoff.md`.
Do not treat any "Stage 5/6 fully closed" language above as current status
— read the reopened-review handoff first.

- [ ] **P1 — Any resolved `lean.*` field qualifies as Tier 2, no named/
      timestamped call required.** `classifyEvidenceTier()`
      (`agents/lib/board-validate.js` ~line 369) classifies by first path
      segment only, so `lean.n`, `lean.back`, `lean.fade`,
      `lean.avg_strength`, `lean.samples[0].who` all qualify as Tier 2.
      Codex reproduced: a core/unreviewed candidate grounded ONLY by
      `lean.n = 1` passes `hasQualifyingGrounding()` and is NOT forced by
      `enforceEvidenceTierGate()`. The real dossier has 106 rows with
      `lean` data — reachable, not synthetic. Worse: `portfolio-dossier.js`
      (~line 1324) strips timestamps when building lean samples — across
      348 current lean samples, 0 have a timestamp — so even the
      "intended" `lean.samples[0].who` case can't legitimately satisfy the
      prose's own "dated call" definition of Tier 2. Needs: path/shape-
      level validation (not just root-level), and the dossier producer
      fixed to retain timestamps.

- [ ] **P1 — Round 4's metadata-only-field fix was incomplete.** Removing
      `team`/`best_book`/`best_over_book`/`best_under_book` was correct
      but the classifier still trusts every descendant of an allowed
      Tier-1 root. Codex found real, resolvable metadata-only descendants
      that currently qualify as Tier 1 and let a core/unreviewed candidate
      through unchanged: `analytics.season`, `analytics.staleness_note`,
      `dvoa.source_name`, `dvoa.snapshot_at`, `injuries.freshness`,
      `player_availability.snapshot_at`, `prediction_markets.snapshot_at`,
      `prior.season`. Same essential problem as `team` — these identify
      provenance/age/context, not direction or value. Round 4's "no other
      identity/locator-only field found" conclusion was accurate for a
      root-level review but is now superseded by this deeper path-level
      finding.

- [ ] **P1 — The SOURCE HIERARCHY prose Andy approved contradicts
      itself**, independent of the code bugs above. Line 214 says a
      core/standard stake needs Tier 1 support; line 218 says Tier 1 OR
      Tier 2 permits core/standard (and the enforcement code implements
      the looser line-218 rule). Separately, Tier 4 is described (lines
      206, 217) as never a primary driver/color-only, yet the
      guarded-policy paragraph explicitly permits a Tier-4-ONLY play
      (small/speculative + reviewed) — two different policies in the same
      prompt. Andy's "approved as-is" sign-off approved text that
      disagrees with itself. **Needs Andy's explicit clarification before
      further implementation**: (1) can a genuinely validated Tier-2-only
      call support core/standard, or is Tier 1 mandatory; (2) can
      Tier-4-only evidence originate a small/review play, or must Tier 4
      always accompany higher-tier grounding.

- [ ] **P2 — Stage 6's committee-merge-logic checklist item (marked
      done above) is overstated.** The mock's Stage 2 returned
      `{verdicts: []}` and Stage 3 returned `{finalized: [], passes: []}`
      — this exercises only the no-op/fallthrough route. Does NOT
      demonstrate: Skeptic hold/downgrade/kill application, Risk/Editor
      tier or review updates, the monotonic review-flag merge under an
      actual editor response, `entry_plan.scale_in` propagation,
      Risk/Editor passes, or meaningful ranking changes. No focused tests
      currently reference `applySkepticVerdicts()` or `applyRiskEditor()`.
      Mark that earlier checklist item as incomplete/no-op-only, not done.

**What still verified cleanly in this final review** (per Codex): the
five suites still pass 91/91 total (`evidenceTierGate` 36,
`boardValidate` 25, `boardValidateNamedPlayerGate` 11,
`namedStatusReviewSizingGates` 12, `dataGatheringSprint` 7); scoped lint
zero errors; nothing staged, staged diff empty; `HEAD` still `0fc6112`,
one commit ahead of `origin/main`, predating rounds 3/4; `portfolio-
synthesize.js` unmodified by round 4/Stage 6 as claimed; the round-3
enforcement wiring is present as documented; the Stage 6 addendum's
Dolphins correction and exacta/Tier-3/4 qualifications are accurately
recorded.

**Codex's explicit recommendation — reopen Stage 5 narrowly to:**
1. Resolve the two prose-policy contradictions with Andy.
2. Replace root-only qualification with substantive path/shape
   validation (likely a more granular allowlist, or an explicit denylist
   of metadata leaf fields under each Tier-1/2 root).
3. Fix `portfolio-dossier.js` to preserve lean-sample timestamps, and
   mechanically validate them for Tier-2 qualification.
4. Add regressions for `lean.n`, `lean.avg_strength`, the 8 metadata-only
   Tier-1 descendants above, and a legitimate fully-formed Tier-2
   citation (once timestamps are restored).
5. Correct the checklist's Stage 6 merge-logic status.
6. Rerun a better mock matrix (one that actually exercises Skeptic
   hold/downgrade/kill and Risk/Editor updates) before restoring closure.

No files were changed, staged, committed, or pushed, and no model/database
calls were made during this review.

## Round 5 — Andy's policy clarifications + Codex's 6-point fix list implemented (2026-09-09), pending fresh Codex review

- [x] **Andy's policy answers (2026-09-09), resolving the P1 prose
      contradiction above:**
      1. Tier 1 is now MANDATORY for a core/standard stake — a genuinely
         valid, dated Tier 2 citation no longer suffices alone (tightens
         the original guarded policy).
      2. Tier 4 (training_camp_intel) can NEVER originate a play at any
         stake size, including small/speculative — it may only bolster a
         thesis already grounded in Tier 1/2/3. This is stricter than
         Tier 3, which may still originate a small/speculative, flagged
         play alone (unchanged).

- [x] **Prevalence check run before implementing** (see chat transcript /
      handoff for full numbers): dossier-level exposure is real — 106
      market rows carry `lean` data, 45 with `lean.n` ≤ 2 (thin), 530
      lean samples with zero timestamps across the board, ~224 resolvable
      metadata-only Tier-1-labeled citations (8 fields × 32 teams). Actual
      committee OUTPUT exposure across the 6 genuine dated production runs
      (46 real candidates with cited evidence) is currently zero — no real
      run has hit this bypass yet. It DID appear in 9 core/standard test
      fixture candidates grounded only in `lean.samples[0]`, confirming
      the door is reachable, not just theoretical.

- [x] **Code fixes implemented, `node --check` + scoped eslint clean, full
      focused suite 107/107 passing (91 prior + 16 new regressions):**
      1. `classifyEvidenceTier()` (`agents/lib/board-validate.js`):
         `lean.*` aggregate/count fields (`lean.n`, `lean.avg_strength`,
         `lean.back/fade/over/under`) no longer classify as Tier 2 — only
         an actual `lean.samples[...]` citation does. A new
         `TIER1_METADATA_LEAF_DENYLIST` excludes the 8 metadata-only
         descendants Codex found (`analytics.season`,
         `analytics.staleness_note`, `dvoa.source_name`,
         `dvoa.snapshot_at`, `injuries.freshness`,
         `player_availability.snapshot_at`,
         `prediction_markets.snapshot_at`, `prior.season`) from Tier 1,
         checked at the `root.child` path shape rather than root-only.
      2. `hasQualifyingGrounding()`: now requires Tier 1 specifically
         (was Tier 1 OR 2), implementing Andy's Tier-1-mandatory decision.
      3. New `isTier4OnlyCandidate()` / `partitionTier4Only()`
         (mirroring the existing `partitionSimPriceOnly()` exclude-with-
         reason pattern) — a candidate whose only resolved evidence is
         Tier 4 is excluded from `final` entirely, not merely capped.
         Wired into `agents/portfolio-synthesize.js`'s pipeline tail
         immediately alongside `partitionSimPriceOnly()`, before the
         Tier 1/2 enforcement gate.
      4. SOURCE HIERARCHY prose (`agents/portfolio-synthesize.js`
         SYSTEM_PROMPT, ~lines 214-218, 671) rewritten to state the
         Tier-1-mandatory rule and the Tier-4-can-never-originate rule
         without contradiction, superseding the "APPROVED AS-IS" sign-off
         below (Andy has now approved the corrected replacement, not the
         self-contradictory original).
      5. **Timestamp passthrough fix** (Andy's follow-up question,
         2026-09-09): traced why 0 of 348 lean samples had a timestamp —
         confirmed it's a pure transform-layer bug, not missing source
         data. `research_pick_signals.captured_at` and
         `podcast_host_summaries.created_at` ARE selected from the DB in
         both `agents/signal-normalize.js` and (separately)
         `agents/portfolio-dossier.js`'s own `fetchPickSignals()`, but
         were never copied into the row/sample objects built downstream.
         Fixed in `gatherPickSignalRows()` and `gatherHostSummaryRows()`
         (signal-normalize.js) and in `makeNormalizedFindLean()` /
         `buildLeanView()`'s `add()` (portfolio-dossier.js) — all now
         carry `captured_at` through to `lean.samples[*].captured_at`.
         **One path remains unfixed and is flagged, not silently patched
         over**: `normalizeBatch()`'s LLM-normalization path never
         captured a date on its source `items` in the first place (one
         level further upstream than the other two paths) — needs
         separate follow-up before that specific path's lean samples can
         carry timestamps too.
      6. Corrected the Stage 6 committee-merge-logic checklist item below
         (Confirm Stage 1 → Skeptic → Risk/Editor merge logic) from `[x]`
         back to `[ ]` per Codex's P2 finding — still needs a real mock
         matrix exercising non-empty Stage 2/3 responses.
      7. Added 16 new regression tests to
         `tests/unit/evidenceTierGate.test.js` covering all of the above
         (lean aggregate-vs-sample classification, the 8 metadata-leak
         fields, the Tier-1-mandatory `hasQualifyingGrounding` change,
         and the new Tier-4-only exclusion) plus updated one pre-existing
         test that asserted the now-superseded "Tier 2 alone qualifies"
         behavior.

- [ ] **NOT done as part of round 5** (deliberately deferred, called out
      to Codex explicitly rather than silently skipped): the
      `normalizeBatch()` LLM-path timestamp gap (above); a fresh Stage 6
      mock matrix exercising real Skeptic/Risk-Editor behavior (item 6 of
      Codex's list); whether `isTier4OnlyCandidate()`'s hard-exclusion
      design (vs. capping) is the right mechanical treatment, or whether
      it should also examine `hedge_baskets`/`parlay_ladders` legs and
      `watchlistReview` the way `partitionSimPriceOnly()`'s docstring
      notes those arrays are separate and untouched.

**Next**: get a fresh Codex review of this round before treating Stage 5/6
as closed again — do not reuse "closed"/"fully verified" language from
before this reopening until Codex explicitly signs off on the corrected
version.

## Round 6 — Codex round-5 review response (2026-09-09): 2 of 3 P1s fixed + verified, 1 P1 needs Andy's decision, P2 prose/comment cleanup done

Codex's round-5 review (relayed via
`handoffs/2026-09-09-0314-claude-codex-review-prompt-round5-fixes.md`) found
round 5's fixes were real but incomplete: two P1 bypasses in the code that
round 5 shipped, and one P1 gap (hedge/parlay structures) that predates
round 5 entirely and round 5 never touched. Full findings preserved in the
chat/handoff record; summary of the response below.

- [x] **P1 fixed — Tier-1 metadata bypass.** Round 5's
      `TIER1_METADATA_LEAF_DENYLIST` checked only the `root.child` shape
      (2 path segments) against 8 hardcoded full paths. Codex's
      independent probe found real, resolvable bypasses this couldn't
      catch by construction: deeper nesting
      (`player_availability.key_returns[0].source`,
      `player_availability.key_returns[0].published_at` — 3+ segments)
      and a DYNAMIC middle key per sportsbook
      (`books.betmgm.source_row_id`, `books.betmgm.observed_at`,
      `books.betmgm.availability_status` — no static path enumeration
      could ever cover every book name), plus new leaf names round 5
      simply hadn't seen yet (`analytics.is_current_season`,
      `analytics.seasons_behind`, `dvoa.season`, `dvoa.source_key`,
      `dvoa.attribution_note`, `sim.source`, `sim_win_total.source`).
      **Fix**: replaced the root.child full-path denylist with a
      LEAF-NAME denylist (`TIER1_METADATA_LEAF_NAME_DENYLIST` in
      `agents/lib/board-validate.js`) checked against the path's LAST
      segment regardless of depth or what the intermediate keys are —
      depth- and dynamic-key-agnostic by construction. Consolidated leaf
      names: `season`, `seasons_behind`, `is_current_season`, `source`,
      `source_key`, `source_name`, `source_row_id`, `attribution_note`,
      `staleness_note`, `freshness`, `snapshot_at`, `observed_at`,
      `published_at`, `availability_status`. Verified real substantive
      fields sharing a root with these (e.g. `player_availability.
      key_returns[0].status`, `books.betmgm.price`) still classify Tier 1
      — the fix doesn't overreach into genuine evidence.

- [x] **P1 fixed — `partitionTier4Only()` bypassable with non-evidence.**
      Round 5's `isTier4OnlyCandidate()` required EVERY resolved citation
      to be exactly Tier 4 (`resolved.every(...)`). Codex's direct probe
      broke this four ways Codex enumerated explicitly: adding one
      resolved-but-non-qualifying citation (`team`, or any unrecognized
      field) alongside the Tier 4 one flipped `every()` false and let the
      candidate through unexcluded; an UNRESOLVED Tier-4-only citation
      (zero resolved evidence) also returned false because the
      `resolved.length === 0` guard short-circuited before ever checking
      what was cited. **Fix**: corrected predicate per Codex's own
      phrasing — a candidate is Tier-4-originated if it cites Tier 4 AT
      ALL (resolved or not) AND has no resolved, qualifying Tier 1/2/3
      support. All four of Codex's probe cases now behave correctly
      (verified as regression tests, see below); the one case Codex
      confirmed was already correct (Tier 4 + resolved Tier 3 → kept)
      remains correct.

- [x] **P1 resolved by Andy's explicit decision (2026-09-09) — 
      hedge_baskets/parlay_ladders EXEMPT from SOURCE HIERARCHY.** Their
      output contract (`agents/portfolio-synthesize.js` ~line 291) has no
      `evidence_ids` field, and their validators
      (`validateParlayLadder()`/`validateHedgeBasket()`, ~line 2314) only
      resolve legs against dossier prices — no evidence-tier check of any
      kind, confirmed reachable (a model could originate one purely from
      Tier-4 training-camp buzz with zero citation trail). Codex offered
      two paths: (a) add real evidence enforcement to these structures, or
      (b) an explicit policy decision that they're exempt as "scenario
      structures." **Andy chose (b)**: hedge baskets and parlay ladders
      are insurance/combo structures built around theses that, if
      core/standard, are already evidence-gated on the primary candidates
      list — not new standalone plays needing their own citation trail.
      Documented as a deliberate decision, not a silent gap: a new
      "SCOPE" sentence in SYSTEM_PROMPT's GUARDED POLICY paragraph states
      the exemption explicitly (and that real evidence should still be
      used in the thesis prose where available — the exemption is from
      mechanical enforcement, not from doing real analysis), and matching
      code comments sit directly above `validateParlayLadder()`/
      `validateHedgeBasket()` so a future review sees this as intentional
      rather than re-flagging it as an oversight. The human watchlist
      never needed this treatment (Codex confirmed): it's deterministic
      from a user-provided watchlist and dossier pricing, not
      model-originated.

- [x] **P2 fixed — prose/comment/log inconsistencies.** SOURCE HIERARCHY
      prose (`agents/portfolio-synthesize.js` SYSTEM_PROMPT): the "all
      fields under these containers count as Tier 1" line (contradicting
      the metadata denylist) now carries an explicit EXCEPTION clause for
      identity/provenance/freshness metadata; "this is about relative
      weight, not exclusion" now scopes itself explicitly to sit BELOW
      the hard Tier-1-mandatory/Tier-4-exclusion rules rather than
      reading as if it walked them back. Stale "Tier 1/2" language in
      `agents/lib/board-validate.js` (docstrings + the
      `evidenceTierViolations()` violation-message text) and
      `agents/portfolio-synthesize.js` (pipeline-tail comments + the
      `evidence-tier gate` console.log line) updated to say "Tier 1"
      (round 5 made Tier 2 alone non-qualifying; the comments/user-facing
      strings hadn't caught up). The old checklist sign-off entry below
      ("APPROVED AS-IS 2026-09-09") is now marked SUPERSEDED in place
      (struck through, not deleted, to preserve history) with an explicit
      note that Andy approved the corrected round-5/6 prose, not the
      self-contradictory text that entry describes.

- [ ] **P2 NOT fixed, deliberately deferred (same as round 5) — Tier 2 is
      still syntactic, not semantic.** Any `lean.samples[...]` citation
      qualifies as Tier 2 regardless of whether that specific sample
      actually has a name, date, and direction (an isolated `.who` field
      alone still counts). Since Tier 1 is now mandatory, this can't
      unlock core/standard by itself, but it can still support a
      small/speculative play "underneath" Tier 4 without being the real,
      complete corroboration the prose describes. Not fixed because the
      LLM-normalization signal path still doesn't carry timestamps at all
      (a separate, already-flagged gap) — a hard mechanical "must have a
      real date" check right now would disqualify most Tier-2 citations
      from that lane, which may be too strict before that gap closes.
      Flagged to Codex again rather than silently left out of this round
      too.

**Verification (round 6):** `node --check` clean on both changed files;
scoped eslint zero errors; full focused suite 118/118 passing (107 prior +
11 new regression tests reproducing Codex's exact probe cases for both P1
fixes). Nothing staged, committed, or pushed.

**Next**: send round 6 (all three P1s now addressed — 2 fixed in code,
1 resolved by Andy's explicit exemption decision above) back to Codex for
another pass — do not treat Stage 5/6 as closed until Codex confirms this
round is clean, including the still-open P2 item (Tier 2 syntactic-not-
semantic) above.


## Round 7 — Codex round-6 review response (2026-09-09): metadata denylist rebuilt from a full inventory, hedge/parlay rationale corrected, stale diagnostics fixed

Codex's round-6 review found the round-6 leaf-name denylist fix was
structurally correct but still incomplete (new leak examples: `quote_age_hours`,
`needs_human_review`, `player_name`, `name`, `source_url`, `week`), and that
the hedge_baskets/parlay_ladders exemption's stated rationale ("already
evidence-gated on the primary candidates list") does not hold mechanically —
nothing cross-checks `primary_hedged_against` or a parlay leg's team against
whether that team's primary candidate actually survived the SOURCE HIERARCHY
gates. Round 7 addresses both, plus the stale-text items, per Codex's own
"narrow round 7" recommendation.

- [x] **Metadata leaf-name denylist rebuilt from a reviewed inventory, not
      reactive patching.** Grepped every metadata-shaped leaf name actually
      written under a Tier-1 root across `agents/portfolio-dossier.js`
      (`quoteMeta()`, `fetchPlayerAvailabilityContext()`,
      `fetchDvoaSnapshots()`, `fetchCoachingProfiles()`, the injuries
      builder, the roster-churn current/prior stamps) rather than reacting
      to only the 6 named examples. `TIER1_METADATA_LEAF_NAME_DENYLIST` in
      `agents/lib/board-validate.js` grew from 14 to 26 entries: added
      `week`, `source_url`, `quote_age_hours`, `needs_human_review`,
      `player_name`, `name`, `head_coach`, `offensive_coordinator`,
      `defensive_coordinator`, `sample_start`, `sample_end`, `stale_after`.
      `head_coach`/`offensive_coordinator`/`defensive_coordinator` are
      denied as identity-only labels (same principle as round 4's removal
      of the bare `team` root — knowing a name isn't a corroborating
      signal). `sample_start`/`sample_end`/`stale_after` are denied as
      sample-window/expiry bounds (same category as `snapshot_at`).
      **Deliberately kept as Tier 1** (substantive, not metadata):
      `games_sample` under `coaching_profile` — a sample-size qualifier is
      itself a confidence signal, unlike a pure identity/freshness field,
      the same reasoning that already keeps `n_books` (a Tier-1 root
      itself) out of the denylist. Verified via regression tests that this
      doesn't overreach: `coaching_profile.fourth_down_aggression_rate`,
      `.neutral_pass_rate`, `.games_sample`, `.coordinator_continuity` all
      still classify Tier 1.
      Comment above the Set now documents this is a best-effort inventory,
      not a closed-form guarantee, and says so plainly rather than
      implying completeness.

- [x] **Hedge_baskets/parlay_ladders exemption rationale corrected to
      match what the code actually does.** Codex's finding: round 6's
      SCOPE sentence in SYSTEM_PROMPT and the code comment above
      `validateParlayLadder()`/`validateHedgeBasket()` both claimed these
      structures "are already evidence-gated on the primary candidates
      list" — but `primary_hedged_against` is optional free text, never
      cross-checked against the primary list or its evidence, so nothing
      actually verifies a hedge/parlay references a primary candidate that
      survived `hasQualifyingGrounding()`/`enforceEvidenceTierGate()`/
      `partitionTier4Only()`. **Andy's original decision (exempt as
      scenario structures) is unchanged** — this round does not add
      enforcement code, since that would contradict the decision already
      made. What changed is honesty: both the SYSTEM_PROMPT SCOPE sentence
      and the code comment now state plainly that this is an ACCEPTED,
      UNENFORCED risk — a hedge/parlay could in principle be built around
      a thesis that Tier-4-only training-camp buzz alone would never have
      justified as a primary play, wrapped as "insurance" instead — rather
      than asserting a code-level invariant that doesn't exist. The code
      comment explicitly warns future readers not to re-add "already
      gated" language without actually building the cross-check.

- [x] **Stale diagnostic text fixed (Codex's remaining P2 items):**
  - `agents/lib/board-validate.js`'s `partitionTier4Only()` exclusion
    reason string said "all resolved evidence classifies as Tier 4" —
    false since round 6's predicate fix (a candidate can cite Tier 4
    unresolved, or alongside a non-qualifying resolved citation, and
    still be Tier-4-only). Corrected to "cites Tier 4 ... with no
    resolved, qualifying Tier 1/2/3 support."
  - `agents/portfolio-synthesize.js`'s pipeline-tail comment above the
    `partitionTier4Only(final)` call still described the superseded
    "ONLY resolved evidence is Tier 4" (`every()`-based) behavior.
    Rewritten to describe the actual, round-6-corrected predicate.
  - `tests/unit/evidenceTierGate.test.js` had a test title
    ("isTier4OnlyCandidate is true only when EVERY resolved evidence_id
    is Tier 4") describing the superseded behavior even though the test
    body itself was a simple non-adversarial case that still passes
    under the corrected predicate. Retitled to say what it actually
    tests and point to the round-6 adversarial describe block below it
    for the bypass-resistant cases.
  - `tests/unit/evidenceTierGate.test.js` line ~107 wrongly asserted
    `classifyEvidenceTier('player_availability.key_returns[0].player_name')`
    returns `1` (Tier 1) — this was simply wrong even under round 6's
    rules once `player_name` is recognized as identity metadata.
    Corrected to `.toBeNull()`.

- [x] **New regression tests added** for every newly-denied leaf name
      (`quote_age_hours`, `needs_human_review`, `player_name`, `name`,
      `source_url`, `week`, plus the `coaching_profile` fields), each
      combined with Tier 4 evidence per Codex's explicit request — i.e.
      confirming a Tier-4 candidate whose only other citation is one of
      these newly-denied fields is still correctly classified as
      Tier-4-only, not accidentally rescued into "mixed evidence."

**Verification (round 7):** `node --check` clean on all three changed
files (`agents/lib/board-validate.js`, `agents/portfolio-synthesize.js`,
`tests/unit/evidenceTierGate.test.js`); scoped eslint zero errors; full
focused suite 121/121 passing (118 prior + 3 new test blocks covering the
expanded denylist, the non-overreach check, and the Tier-4-combined
regressions). Nothing staged, committed, or pushed.

**Next**: send round 7 back to Codex — same ask as every round: don't say
"clean" unless it actually is.


## Round 8 — Codex round-7 review response (2026-09-09): denylist checks every path segment, resolvePath() hardened against prototype/primitive traversal

Codex's round-7 review confirmed all of round 7's named-example fixes held,
but found the underlying mechanism was still structurally bypassable two
ways — not by missing leaf names this time, but by how the resolver and
classifier walk a path at all. Verified against the live dossier with real
resolving values, not hypotheticals. Round 8 fixes both; no new leaf names
were added (this round is about path traversal, not vocabulary).

- [x] **classifyEvidenceTier() now checks every path segment, not only the
      final one.** Codex's exact finding: `analytics.staleness_note.length`,
      `dvoa.source_name.length`, `injuries.freshness.length`, `books.
      betmgm.source_row_id.length`, and `analytics.staleness_note.0` all
      resolved to real values in the live dossier and classified as Tier 1,
      because the check only looked at the last path segment (`length`,
      `0`) — neither of which is itself a denied name — while ignoring that
      a denied name (`staleness_note`, `source_name`, `freshness`,
      `source_row_id`) sat earlier in the same path. A denied metadata leaf
      was being "laundered" back into Tier 1 just by reading a further
      property off of it. Fixed in `agents/lib/board-validate.js`: if ANY
      segment along the path matches the denylist, the whole path is
      non-qualifying — not just the last one.

- [x] **resolvePath() hardened against prototype-chain and terminal-value
      traversal — moved to `agents/lib/board-validate.js` in the process.**
      Codex's exact finding: `analytics.constructor`, `analytics.toString`,
      and `analytics.__proto__` all resolved to real (non-dossier) values
      via unrestricted `cur[p]` property access, and separately, appending
      `.length` or a numeric string-index (`.0`) to an already-resolved
      string field read a JavaScript-level property off that primitive
      rather than failing. Fixed with two restrictions: (1) traversal is
      only allowed into a plain object or a real array — a primitive
      already reached is terminal, so `.length`/`.0` on a string now fails
      to resolve; (2) a string-keyed segment must be an actual OWN,
      enumerable data property (`Object.prototype.hasOwnProperty`), and
      `__proto__`/`constructor`/`prototype` are rejected outright regardless
      of what `hasOwnProperty` would report. `resolvePath()` was also moved
      out of `agents/portfolio-synthesize.js` (a top-level-IIFE script that
      can't safely be imported by a test file) into `agents/lib/board-
      validate.js` so it can be unit tested directly — `portfolio-
      synthesize.js` now imports it from there; behavior at the one real
      call site (`resolveEvidenceIds()`) is unchanged.

- [x] **Regression tests added** for both fixes: every one of Codex's exact
      probe strings (`analytics.staleness_note.length`, `dvoa.source_name.
      length`, `injuries.freshness.length`, `books.betmgm.source_row_id.
      length`, `analytics.staleness_note.0`, `analytics.constructor`,
      `analytics.toString`, `analytics.__proto__`) now has a test asserting
      it returns `null`/`undefined`, plus sanity checks that ordinary
      nested-path and array-index resolution (`lean.samples[0].who`,
      `player_availability.key_returns[0].status`) is unaffected, and that
      a merely-missing (not malicious) property still resolves to
      `undefined` rather than being flagged as an attack.

- [ ] **P2/accepted risk, noted not fixed (Codex's own framing, not a
      to-do)**: Codex reclassified the hedge_baskets/parlay_ladders
      exemption from "implementation bypass" to "deliberate policy
      exception" now that round 7's wording is honest — no code change
      requested, just recommended Andy revisit before scenario outputs
      become actionable betting proposals. Recorded here as accepted, not
      pending.

- [x] **`coaching_profile.games_sample` stays Tier 1** — Codex confirmed
      this round-7 judgment call is defensible and consistent with the
      `n_books` precedent; explicitly said not to add it to the denylist.
      No change.

**Verification (round 8):** `node --check` clean on both changed files
(`agents/lib/board-validate.js`, `agents/portfolio-synthesize.js`); scoped
eslint zero errors; focused suite (evidenceTierGate, boardValidate,
boardValidateNamedPlayerGate, namedStatusReviewSizingGates,
dataGatheringSprint) 127/127 passing (121 from round 7 + 6 new test
blocks: the every-segment denylist check, and 5 resolvePath() tests
covering the constructor/toString/__proto__ and terminal-value/length/
numeric-index bypasses plus ordinary-resolution and out-of-range/missing-
property sanity checks). Nothing staged, committed, or pushed.

**Next**: send round 8 back to Codex — same ask as every round.


## Round 9 — Codex round-8 review response (2026-09-09): resolvePath()'s own-property check switched from hasOwnProperty() to propertyIsEnumerable(), closing the `lean.samples.length` bare-count bypass

Codex's round-8 review confirmed both P1 path-traversal fixes held under
a fresh adversarial probe (no alternative prototype, primitive, symbol,
or inherited-property route found), but surfaced one concrete, exact
reproduction of the already-known, already-deferred Tier-2
syntactic-not-semantic gap: `lean.samples.length` resolved to the array's
count and classified Tier 2, which could rescue a Tier-4-only candidate
— the same shape of bug as the already-rejected `lean.n`, just reached
through the resolver instead of the classifier.

- [x] **resolvePath()'s string-keyed-property check now actually does
      what its own comment always said it did.** Round 8's comment
      claimed the check required an "OWN, enumerable" property, but the
      code only called `hasOwnProperty()`, which tests ownership, not
      enumerability. `Array.prototype.length` is an own, NON-enumerable
      property, so `lean.samples.length` passed the round-8 check and
      resolved to a real number. Fixed in `agents/lib/board-validate.js`
      by switching to `Object.prototype.propertyIsEnumerable.call(cur, p)`,
      which requires both — `length` now correctly fails to resolve,
      while ordinary own+enumerable properties (`who`, `dir`, `strength`,
      array elements accessed by numeric index) are unaffected.

- [x] **Regression test added** reproducing Codex's exact repro
      (`resolvePath({lean:{samples:[...]}}, 'lean.samples.length')` now
      `undefined`), plus a sanity check that ordinary array-element
      access via `lean.samples[0].who` / `lean.samples[1].dir` still
      resolves correctly.

- [ ] **Not fixed, same deferral as rounds 5-8**: Tier 2 is still
      syntactic, not semantic — `classifyEvidenceTier('lean.samples.
      length')` itself still returns `2` on the string alone (the fix is
      at the resolver, which now correctly marks that citation
      unresolved, not at the classifier). Codex's own framing: full
      closure of this specific bypass shape requires the semantic
      validation already deferred four rounds running (a genuine named,
      directional, timestamped sample), which is still blocked on the
      `normalizeBatch()` LLM-path timestamp gap. Not conflating this
      round's narrow resolver fix with that larger, still-open item.

**Verification (round 9):** `node --check` clean on the one changed file
(`agents/lib/board-validate.js`); scoped eslint zero errors; focused
suite (evidenceTierGate, boardValidate, boardValidateNamedPlayerGate,
namedStatusReviewSizingGates, dataGatheringSprint) 128/128 passing (127
from round 8 + 1 new test block). Nothing staged, committed, or pushed.

**Next**: send round 9 back to Codex — same ask as every round.


## Round 10 — Codex round-9 review response (2026-09-09): numeric array-index branch now enforces the same own/enumerable invariant as the string branch

Codex's round-9 review confirmed the exact `lean.samples.length` bypass
was closed, and ran a fresh adversarial probe across the resolver's other
surfaces (non-enumerable string properties, primitive traversal,
inherited named properties, symbols, malformed/negative/missing/
out-of-range paths) — all correctly rejected. One remaining gap: the
numeric-index branch (array element access, e.g. `lean.samples[0]`) only
did bounds checking, then read `cur[p]` directly, without the same
own/enumerable check the string branch enforces. Codex demonstrated this
with a sparse array combined with a polluted `Array.prototype` — not
reachable through the current dossier (958 arrays inspected, no holes
found) and requiring pre-existing prototype pollution to matter, so
explicitly lower risk than the prior model-controlled paths, but it
contradicted the resolver's own stated guarantee.

- [x] **Numeric array-index access now also requires an own, enumerable
      element**, not just an in-bounds index. `agents/lib/board-
      validate.js`'s numeric branch adds
      `Object.prototype.propertyIsEnumerable.call(cur, p)` after the
      bounds check and before `cur[p]` — a sparse-array hole that would
      otherwise fall through to a polluted prototype property at that
      index now fails to resolve, matching the invariant the string
      branch already enforces.

- [x] **Regression test added** reproducing Codex's exact repro (a
      length-1 sparse array with `Array.prototype[0]` polluted;
      `resolvePath(..., 'lean.samples[0].who')` now `undefined`, prototype
      pollution cleaned up in a `finally`), plus a sanity check that
      ordinary in-bounds numeric indexing into a real (non-sparse) array
      is unaffected.

- [ ] **Confirmed unchanged (Codex's own framing, not a gap)**:
      `lean.samples` itself still resolves to the whole array and
      classifies Tier 2 even if empty or containing incomplete samples —
      this is the already-deferred classifier/semantic gap (Tier 2 is
      syntactic, not semantic), not a resolver failure, and stays out of
      scope for this narrow round same as round 9.

**Verification (round 10):** `node --check` clean on the one changed file
(`agents/lib/board-validate.js`); scoped eslint zero errors (one unused
`eslint-disable` directive caught and removed during this round); focused
suite (evidenceTierGate, boardValidate, boardValidateNamedPlayerGate,
namedStatusReviewSizingGates, dataGatheringSprint) 129/129 passing (128
from round 9 + 1 new test block). Nothing staged, committed, or pushed.

**Next**: send round 10 back to Codex — same ask as every round.


## Resolver-hardening thread CLOSED (2026-09-09, Codex's round-10 review)

Codex's round-10 review confirmed the numeric-index fix closes the
sparse-array/prototype-pollution case (sparse hole + polluted prototype,
a prototype GETTER at an index, dense own elements, dot-form numeric
access, and `length`/`constructor`/`__proto__`/`Symbol.iterator`/
negative/out-of-range indices all behave correctly), confirmed the
own/enumerable invariant is now applied consistently across both the
string and numeric branches, and explicitly said **no round 11 is
needed for `resolvePath()`** — the resolver-hardening thread (rounds
8-10) is done.

Two minor, non-blocking observations from that review were applied
anyway since they were essentially free:
- [x] The code comment said a string-keyed segment must be an own,
      enumerable "data property," which is technically imprecise --
      `propertyIsEnumerable()` also permits an own enumerable
      ACCESSOR/getter. Comment corrected to say "property" and note
      explicitly that dossier objects are plain `JSON.parse()` output,
      which never has getters, so this has no practical effect on real
      input.
- [x] The round-10 regression test deleted `Array.prototype[0]` in its
      `finally` block. Improved to capture and restore any
      pre-existing property descriptor at that index instead of a blind
      delete, for better test isolation (no real environment should
      have one, but the test no longer assumes that).

**Verification (polish pass):** `node --check` clean; scoped eslint zero
errors; focused suite 129/129 passing (unchanged count -- these were
comment/hygiene-only edits, no new test cases). Nothing staged,
committed, or pushed.

**What's left**: Codex's own framing, confirmed across rounds 9 and 10 --
the remaining `lean.samples` container/incomplete-sample behavior (any
`lean.samples[...]` citation syntactically classifies Tier 2 regardless
of whether that specific sample has a genuine name/date/direction) is
the already-scoped Tier-2 semantic-not-syntactic gap, tracked separately
since round 5, and is NOT a resolver defect. It remains blocked on the
`normalizeBatch()` LLM-normalization-path timestamp gap (source `items`
never carry a date in the first place -- see round 5's investigation).
Closing it is a larger piece of work than any of rounds 5-10 and should
be scoped as its own item, not folded into a reflexive "round 11."


## Andy's SOURCE HIERARCHY prose sign-off

- [x] **SUPERSEDED 2026-09-09 — see Round 5/6 above.** The entry below is
      preserved as history, not current status: Codex's final cumulative
      review (same day) found the approved prose self-contradictory, Andy
      then answered the two clarifying questions it raised (Tier 1
      mandatory; Tier 4 can never originate alone), and the prose was
      rewritten in round 5 and further tightened in round 6 to remove the
      contradictions Codex's round-5 review still found (the "all fields
      under these containers count as Tier 1" line, and "relative weight,
      not exclusion" reading as if it walked back the Tier-4 hard
      exclusion). Andy has approved the CORRECTED replacement prose, not
      the text described below — do not cite this entry as evidence the
      original "Tier 1/2 required" wording is still the policy.

- [x] ~~APPROVED AS-IS 2026-09-09 (Andy).~~ Andy reviewed the SOURCE
      HIERARCHY prose in `agents/portfolio-synthesize.js`'s SYSTEM_PROMPT
      (the "SOURCE HIERARCHY — HOW TO WEIGH NARRATIVE CONTEXT AGAINST
      PRICE" block and its "GUARDED POLICY" paragraph, ~lines 213-215) and
      approved the wording as currently written, with no changes requested.
      This closes the one remaining non-code item from the guarded-with-
      enforcement policy chain — the enforcement mechanics were already
      Codex-verified through Stage 6; this sign-off confirms the prose
      describing the policy to the model matches Andy's actual intent
      (Tier 1/2 required for core/standard stake; Tier 3/4-only plays may
      still be proposed but forced to needs_human_review + small/
      speculative; a trusted name in narrative doesn't promote it to Tier
      2 without an independent dated/named Tier-2 lean).

## Stage 7 — Validation gates

- [ ] Re-run `agents/lib/board-validate.js`'s `quotedComboFor()` logic
      against the fresh dossier — confirm the 2026-09-03 fix (shipped in
      `b6a3bf0`) still resolves non-wins-market prices correctly with real
      current data, not just the original test row.
- [ ] Re-run `scripts/build-article-intel-review.js` for a current
      unresolved-record count (108 as of 2026-09-03 — get today's number).
- [ ] Re-run the prediction-market map/coherence gates
      (`validatePredictionArtifacts`) against the freshly-rebuilt
      `data/prediction-markets/latest.json` from Stage 1.
- [ ] Confirm `namedPlayerSizingViolations()` still fires correctly for the
      McGovern/Parsons-class named-player cases in the current
      `named-status-review.json`.
- [ ] Spot-check `explicitTeamCollision()`'s hard-coded NYJ/NYG and LAC/LAR
      disambiguation still matches current prediction-market ticker/title
      formats (vendor format changes could silently break a hard-coded
      regex like this).
- [ ] Confirm the `FORBIDDEN_YOUTUBE_EPISODES` exclusion list is still
      correct/complete — worth a quick check of whatever incident caused
      those two episode IDs to be blacklisted, to see if a third one has
      since shown the same problem.

## Stage 8 — Output & persistence

- [ ] Confirm `--no-persist` truly disables both Supabase write call sites
      (`futures_recommendations` upsert, `futures_recommendation_runs`
      insert) for every dry run between now and the real run — a persisted
      write from an accidental dry-run-without-the-flag would violate the
      standing no-writes-without-authorization guardrail.
- [ ] Run the preflight tool's Stage E (previous-run forensics) against
      whatever the last real `.raw.json` run file is, to confirm the last
      actual paid run didn't silently half-fail (`final: 0`, a model error
      with no banner, etc.) — if it did, that report should be treated as
      untrustworthy regardless of anything else on this checklist.
- [ ] Confirm official-proposal export (`exportOfficialProposalDrafts()`)
      only fires when explicitly requested (`--proposal-out-dir`), consistent
      with the standing no-official-pick-promotion guardrail.

## Stage 9 — Full mocked dry-run rehearsal (the actual gate before spending)

- [ ] With Stages 0-8 clean: one full mocked dry-run end to end, fresh
      dossier, current prompt (with Stage 5 additions), `--no-persist`.
- [ ] Read the full rendered HTML/MD report by eye, end to end — not just
      the diffs the automated checks report. Look specifically for: does
      any recommendation cite `training_camp_intel`,
      `vault_analytical_reads`, or `master_reports` in a way that is
      appropriately weighted; do Tier-3/4-only cases retain the required
      review flag and stake cap; does every price cited actually exist in
      the fresh dossier; does the report read as internally consistent.
- [ ] Get Andy's explicit sign-off on the mocked report before authorizing
      the first real paid run.
- [ ] Only then: run `agents/portfolio-preflight.js` one final time as the
      actual go/no-go gate, and if it's clean, proceed with a real run.

---

## Decisions RESOLVED by Andy (2026-09-08) — verified against live data, converted to action items

### 1. Sharp Twitter accounts (Evan Silva, SurvivorAtlas, SalBets, etc.)

Verified: `x-sharp-ingest.js`/`x_sharp_tweets` is the WRONG mechanism — its
own config file (`config/sharp-accounts.json`) says it's been intentionally
**DORMANT since it was consolidated into the RSS pipeline**; every account
in it is a media outlet (PFF, ESPN, Rotowire, etc.), never personal sharp
bettors, and it's explicitly marked "do not re-enable." Safe to ignore/retire.

The RIGHT mechanism already exists: **`agents/twitter-bookmarks-agent.js`**,
run by a local Windows background process (`Launch Twitter Harvester.cmd` /
the silent `.vbs` launcher → `scripts/twitter-bookmarks-cron.js --daemon`)
that reads bookmarks from Andy's own "platinumRose" Twitter account using
his personal session cookies. **It does work** — confirmed 23 real captured
bookmarks between 2026-08-03 and 2026-09-01 from genuine sharp-bettor/
analyst accounts: Steve Fezzik, Warren Sharp, VSiN, John Paulsen (4for4),
Patrick Everson, SAL VETRI, Cody Brown Bets, and others. Evan Silva and
SurvivorAtlas specifically are NOT in that captured set yet.

**Real, concrete problem found**: nothing has been captured since
2026-09-01 (7 days ago as of this check), and `.env`'s
`PERSONAL_TWITTER_AUTH_TOKEN` is currently **blank**. That's almost
certainly why it stopped — X's personal-session auth tokens expire
periodically and need to be refreshed from a live browser session.

- [ ] **Action for Andy**: re-authenticate the personal Twitter session
      (grab a fresh `auth_token`/`ct0` cookie pair from a logged-in browser
      session on the platinumRose account) and update `.env`, then restart
      the harvester daemon (`Launch Twitter Harvester.cmd`).
- [ ] **Action for Andy**: this agent only ever captures what's actually
      bookmarked — it's not a fixed account list. If Evan Silva/SurvivorAtlas/
      SalBets aren't showing up, the fix is bookmarking their tweets on the
      platinumRose account going forward, not a config change here.
- [ ] Once the daemon is confirmed running again, spot-check a few days
      later that new bookmarks are landing in `research_intel_notes`
      (`source = 'Twitter/X Bookmarks (Personal)'`).
- [ ] Retire/ignore `x-sharp-ingest.js` and `x_sharp_tweets` — dead weight,
      not worth further engineering time.

### 2. Source weighting — deprioritize BettorDay, elevate named podcasts/articles

Andy's call: BettorDay is currently unpaid, so its proprietary grades are
likely thin-to-nonexistent behind a paywall — treat it as a throwaway
source for now. The AI should instead lean on transcript extractions and
RSS article summaries from five specific shows Andy has manually followed
for years: **Sharp or Square, Even Money, BettingPros, Action Network, and
The Favorites**.

Good news, verified live: **the infrastructure for this already exists and
is already the dominant content in the one intel lane that matters most.**
All 5 shows are configured, active podcast feeds. Current coverage:

| Show | Transcribed episodes | With a full host summary |
|---|---|---|
| Sharp or Square | 46 | 16 |
| Action Network Sports Betting | 29 | 4 |
| Even Money | 27 | 14 |
| BettingPros Podcast | 17 | 7 |
| The Favorites | 21 | 14 |
| **Total** | **140** | **55** |

That "55" is effectively ALL of the 56 host summaries that exist anywhere
in the repo — meaning the one pipeline lane with full-transcript fidelity
(no 12k-char truncation) has, so far, already been built almost entirely
out of exactly the shows Andy wants prioritized. That's a much better
starting point than it looked like before this conversation. Action Network
is also a live RSS article feed on top of its podcast (166 article rows
captured as of this check), and BettingPros is too (113 rows) — both
already flowing into `research_intel_notes`.

- [ ] **Run `agents/podcast-host-summary.js` on the remaining ~85
      transcribed episodes across these 5 shows** that don't have a host
      summary yet (46+29+27+17+21 = 140 done, only 55 summarized) — this is
      now the single highest-leverage podcast task, more targeted than the
      generic "111 episodes need summaries" figure from the original map,
      since it's specifically the shows Andy said matter most.
- [ ] **Add explicit `SYSTEM_PROMPT` guidance** naming these 5 shows/RSS
      sources as the primary corroborating-evidence tier (alongside named,
      timestamped analyst leans generally) — still open, folded into the
      Stage 5 item above. UPDATE: the `bettorday_trench` half of this item
      is resolved — Andy chose full removal, not a downgrade; it's gone
      from `slimTeamProfile`'s `keepKeys` entirely as of 2026-09-08, so
      it can no longer reach the prompt at all. `loadBettorDayTrenchEvidence()`
      is left defined but unused, per the inline comment at its call site,
      in case Andy resumes the subscription later.
- [ ] **Decide whether to keep running `agents/bettorday-newsletter-ingest.js`
      at all** going forward, or pause/retire it now that it's explicitly a
      throwaway source — no point spending ingest time/API calls on it if
      it'll never be trusted.
- [ ] Re-verify feed_health / article counts for the other 6 RSS feeds
      (Sharp Football Analysis, ProFootballTalk, PFF, Rotowire, VSiN, THE
      WINDOW, WalterFootball, Football Outsiders) with a properly paginated
      query — the quick check run during this session hit Supabase's
      1000-row read cap and only reflects 4 of 8 remaining sources
      (Action Network 166, BettingPros 113, ESPN NFL 604, PFF 117); get a
      complete picture before finalizing the weighting language.

### 3. Freshness thresholds — relax for preseason, confirmed

**UPDATE 2026-09-08, same day:** Andy staged and ingested fresh BKR and
BetUS odds today (not tomorrow as originally planned) — see the Stage 1
`futures_odds_snapshots` item above. That cleared the staleness block for
those two books specifically (both now 0.9 days fresh); `caesars` and
`circa` remain open and still keep this lane at BLOCK overall. Separately,
and more durably: Andy confirmed the "too old" thresholds on the local
JSON files (player-availability, expert-dossiers, prediction-markets)
should be relaxed specifically for the preseason window — the underlying
data doesn't change as fast right now, and older "stale" market values are
still relevant context, not garbage to discard.

- [ ] Add a preseason-aware freshness mode to `agents/portfolio-preflight.js`'s
      `FILE_LANES` config (Stage B) — e.g. a wider `maxAgeDays` when the
      season hasn't started yet (same season-phase check needed for the
      Stage A false-alarm fix), so the tool stops flagging expected
      quietness as a blocker.
- [x] Re-ran `agents/portfolio-preflight.js` after today's BKR/BetUS
      ingest — `bookmaker` and `betus` both confirmed 0.9 days fresh.
      `futures_odds_snapshots` still reports BLOCK overall, now solely on
      `caesars` (10.0d stale) and `circa` (never captured) — those two
      still need a fresh capture from Andy.

### 4. Stage ordering — confirmed, proceeding as originally proposed.

---
