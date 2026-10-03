# Week 4 Podcast Bridge Complete — Resume for Preliminary Synthesis

**Date:** 2026-10-03 PT
**Branch / base:** `main` (remote synchronized at session close)
**Scope completed:** read-only Weekly Master Intel evidence integration; no betting, account, ledger, official-pick, portfolio, or further Supabase mutation.

## What landed

`scripts/master-intel/pull.mjs` now reads **promoted only** rows from
`podcast_gemini_intel` and writes them into the generated weekly pull under
`podcast_gemini`. This corrects the former gap where the master pull counted
processed transcripts but did not carry Antigravity's promoted Gemini evidence
into the narrative-input bundle.

The pull retains episode title/publication time, model, promotion timestamp,
named speaker, source timestamp, rationale/quote, and structured pick/note
fields. It is source evidence only: it must not be treated as a card,
recommendation, or execution instruction.

Validated fresh Week 4 result:

- 17 promoted episodes
- 155 speaker-attributed structured picks
- 96 speaker-attributed analysis notes
- 0 rows missing episode/promotion provenance
- 0 picks or notes missing a named speaker

Run:

```powershell
node scripts/master-intel/pull.mjs --week 4 --season 2026
```

The output is intentionally ignored: `data/generated/master-intel/w04-pull.json`.
Do not force-add it. The generated pull at close showed `signals=681`,
`notes=592`, `expert=86`, `splits=16`, `podcasts=19`, and the podcast counts above.

## Other verified Week 4 inputs

- Action Network betting splits were refreshed earlier in this session: 16 games.
- The Week 1–3 ESPN-based team baseline was rebuilt:
  `reports/analysis/week4-intel/WEEK4_MATCHUP_INTEL.md` and
  `reports/analysis/week4-intel/week4-team-baselines.json` (16 matchups / 32 teams).
- Strict roster validation previously passed for Week 4. Re-run it after a new
  digest/card/narrative names players:

```powershell
npm run roster:vet -- --week 4 --date 2026-10-02 --fetch --strict
```

## Important interpretation rules

1. The promoted podcast table is a reviewed source lane, not automatic
   recommendation promotion. Reconcile conflicting speaker positions and verify
   current market price before using an item in a narrative or card.
2. Clean any candidate used in a card/digest: exclude prior-game material,
   non-NFL/next-week material, period markets mislabelled as full-game, and
   player props with missing/ambiguous players. Do not repair player/team data
   from memory; use the roster gate.
3. PIT@CLE is final. Do not use it for the remaining Sunday-slate synthesis.
4. Do not make Supabase writes, paid model calls, sportsbooks/account actions,
   ledger changes, official-pick promotion, or wagers during preliminary
   synthesis.

## Fresh-session resume prompt

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard on main.

Goal: build a read-only preliminary Week 4 synthesis from the current evidence
basket. This is analysis only: do not place bets, touch sportsbook accounts,
mutate ledger/portfolio/official picks, write Supabase, call paid models, or
promote recommendations.

Start with live Git, preserving the heavily dirty shared worktree:
  git fetch
  git status --short --branch
  git rev-list --left-right --count '@{u}...HEAD'
Never reset, clean, stash, revert, or use git add -A.

Read, in this order:
  AGENTS.md
  CLAUDE.md
  docs/antigravity/CANONICAL_EXTRACTION_PIPELINE.md
  docs/MASTER_INTEL_REPORT_FORMAT.md
  docs/MASTER_INTEL_REPORT_RUNBOOK.md
  handoffs/2026-10-03-0000-codex-week4-podcast-bridge-prelim-synthesis-resume.md

Refresh the read-only synthesis bundle:
  node scripts/master-intel/pull.mjs --week 4 --season 2026

Confirm the pull includes podcast_gemini_summary with 17 promoted episodes,
155 picks, and 96 notes. Treat the promoted Gemini rows as source evidence
only; preserve named speaker, episode, timestamp, and supporting quote.

Use these primary inputs:
  data/generated/master-intel/w04-pull.json
  reports/analysis/week4-intel/WEEK4_MATCHUP_INTEL.md
  reports/analysis/week4-intel/week4-team-baselines.json
  current Week 4 BKR lines/splits/injury inputs already in the repository

Exclude PIT@CLE because it is final. Do not silently manufacture an official
card. Produce a preliminary, clearly labeled research synthesis that, per
remaining game, separates: market state, betting splits, team-performance
baseline, sourced podcast/expert viewpoints (including disagreement), relevant
injury/weather caveats, and the counter-case. Mark stale/missing evidence
plainly. Do not claim line movement unless baseline/current captures support it.

Before writing any player named in a digest, card, narrative, or matchup seed,
run:
  npm run roster:vet -- --week 4 --date 2026-10-02 --fetch --strict
Stop on BLOCK; do not correct names from memory.

Finish by reporting what is ready, missing/stale, and the exact prerequisites
for the final Saturday-night narrative/card build. Do not commit or push unless
explicitly asked.
```

## Verification and Git scope

- `node scripts/master-intel/pull.mjs --week 4 --season 2026` completed with
  the counts above.
- Provenance summary check passed.
- `git diff --check -- scripts/master-intel/pull.mjs` passed.
- This handoff commit must contain only this file and `scripts/master-intel/pull.mjs`.
