# Query Dialect Migration — Phase 4 Proposal v2 (Site 5: `nfl_trench_ratings`, Response to Codex's First Review)

**Date:** 2026-09-11
**Supersedes:** `docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_PHASE4_SITE5_2026-09-11.md` (v1), which Codex reviewed and returned **changes requested** (3 P1, 1 P2). Still a proposal only — no migration run, no Supabase write, no code changed.

## Verdict on the review

All four findings confirmed correct, independently re-verified against tracked HEAD and the live file contents (not re-assumed from v1's own claims):

- **Finding 1 (writer inventory):** confirmed. `git cat-file -e HEAD:agents/bettorday-newsletter-ingest.js` succeeds — the file is tracked at HEAD. `git status --short agents/bettorday-newsletter-ingest.js` shows ` D agents/bettorday-newsletter-ingest.js` — a working-tree deletion, unrelated to this proposal (part of the ~710-line dirty tree already on record from Phase 3c's handoff, left untouched per the standing scoped-staging constraint). `git show HEAD:agents/bettorday-newsletter-ingest.js` confirms lines 263-264: `.from('nfl_trench_ratings').upsert(trenchRatings, { onConflict: 'team,season,week,metric_type,as_of_date' })`. v1's "no writer exists" claim was wrong — it inferred absence from the dirty working tree instead of checking tracked HEAD. Corrected below.
- **Finding 2 (PK replacement unnecessary):** confirmed against `agents/lib/supabase-pagination.js`'s actual code, not just the design intent — `tableUniqueKey()` (`supabase-pagination.js:118-125`) only reads `TABLE_UNIQUE_KEYS[table]` and requires that column to be unique; nothing in `fetchAllRows()`, `fetchByUniqueValues()`, or `fetchTopRows()` checks or requires that column to be the table's *primary* key. Codex's alternative is strictly safer and accomplishes the same thing. Adopted.
- **Finding 3 (import safety):** confirmed directly. `grep -n "^export" agents/portfolio-synthesize.js` returns nothing — no exports at all. `grep -n "import.meta.url" agents/portfolio-synthesize.js` matches only an unrelated `__dirname` computation, no guard. The file's last lines are a bare `(async () => { ... })().catch((e) => { ... });` — an anonymous top-level IIFE that runs the entire synthesis pipeline immediately on import, exactly as Codex described. v1 never proposed a test file for this site and so never surfaced this — the gap was real. Corrected below with a module extraction.
- **Finding 4 (dormant, not live):** confirmed. `grep -n "_loadBettorDayTrenchEvidence" agents/portfolio-synthesize.js` returns only the function's own definition (line 1664) — zero call sites anywhere in the file. Independently confirmed against `docs/audits/2026-09-08-intel-pipeline-map/PRE_COMMITTEE_CHECKLIST.md:168-172`: "Dead `bettorday_trench` evidence lane removed from `scripts/lib/dossier-freshness-gate.js`... BettorDay is fully removed from the prompt." v1 mischaracterized this as closing a live truncation risk; it closes a latent one in currently-dormant code. Reframed below.

The 576-live-row count is taken on faith — this device-bridge shell still has no live Supabase access (unchanged from every prior handoff note), so I can't independently re-run that check myself. Flagging it as Codex-reported, not independently confirmed by me.

## 1. Corrected writer inventory

`agents/bettorday-newsletter-ingest.js` (tracked at HEAD, currently a working-tree deletion unrelated to this change — not touched by this proposal) is the live writer. It upserts with `onConflict: 'team,season,week,metric_type,as_of_date'` — the exact natural key. Since Part 1's revised migration (below) leaves the composite primary key untouched and only *adds* a separate `id unique` constraint, this upsert's conflict target is completely unaffected — verified by reading the upsert call directly, not inferred.

## 2. Part 1 — Schema migration, revised: composite PK stays, `id` is additive-only

Proposed file: `supabase/migrations/055_nfl_trench_ratings_surrogate_key.sql` (migration number `055` confirmed still available):

```sql
-- Site 5 of the query-dialect migration needs a single-column unique key
-- so nfl_trench_ratings can use fetchAllRows()/fetchByUniqueValues()
-- (agents/lib/supabase-pagination.js). fetchAllRows()'s tableUniqueKey()
-- only requires TABLE_UNIQUE_KEYS[table] to name a UNIQUE column -- it
-- does not need to be the table's primary key (verified directly against
-- supabase-pagination.js, not assumed) -- so the existing composite
-- primary key (team, season, week, metric_type, as_of_date) is left
-- COMPLETELY UNCHANGED. agents/bettorday-newsletter-ingest.js (tracked at
-- HEAD) upserts onto that exact composite key
-- (onConflict: 'team,season,week,metric_type,as_of_date') -- leaving the
-- primary key untouched means that upsert's conflict target, and default
-- upsert semantics generally, are unaffected by this migration.

alter table public.nfl_trench_ratings
  add column id bigint generated always as identity;

alter table public.nfl_trench_ratings
  add constraint nfl_trench_ratings_id_key unique (id);

comment on column public.nfl_trench_ratings.id is
  'Surrogate key added 2026-09-11 solely so this table can use the '
  'fetchAllRows()/fetchByUniqueValues() query-dialect primitives '
  '(agents/lib/supabase-pagination.js), which require a single-column '
  'unique key. Does not replace or participate in the table''s primary '
  'key -- the original 5-column natural key (team, season, week, '
  'metric_type, as_of_date) remains the primary key, unchanged, and '
  'remains the upsert conflict target used by '
  'agents/bettorday-newsletter-ingest.js.';
```

This is a strictly smaller, more additive change than v1's drop-and-recreate-the-PK approach — no constraint is dropped, the table is not left briefly without a primary key mid-migration, and the known writer's upsert path is provably unaffected rather than merely "appears compatible."

**Staging verification checklist** (run against a staging copy before this touches production, per Codex's list — none of this has been run yet):

- [ ] Row count before == row count after (no rows dropped or duplicated by the `ALTER TABLE`).
- [ ] Every row's new `id` is non-null.
- [ ] `select count(distinct id) from nfl_trench_ratings` equals `select count(*) from nfl_trench_ratings` (identity values are genuinely unique, not just present).
- [ ] The original composite primary key constraint is still present and unchanged (`\d nfl_trench_ratings` / `information_schema.table_constraints`).
- [ ] The new `nfl_trench_ratings_id_key` unique constraint is present.
- [ ] `agents/bettorday-newsletter-ingest.js`'s existing natural-key upsert still succeeds against the staged table (run the ingest agent, or a minimal repro of its exact `.upsert(..., { onConflict: 'team,season,week,metric_type,as_of_date' })` call, against staging).
- [ ] `fetchAllRows()` called against the staged table returns the full row count with no truncation (paginates past 1000 if staging is seeded with >1000 rows, or at minimum returns exactly the staged count for a smaller seed).

## 3. Part 2 — Code migration, revised: import-safe module extraction

New file: `agents/lib/bettorday-trench.js` — a small, side-effect-free module the function moves into, so a test can import it directly without ever importing `agents/portfolio-synthesize.js` (which would run the live synthesis pipeline, per Finding 3). This also adds the `fetchAllRows` import Codex noted was missing from v1's plan — it lives in this new module's own import list, not retrofitted into `portfolio-synthesize.js`'s existing `fetchAllKeyset` import (that import is for the two already-migrated `vault_notes`/master-reports reads and is unrelated to this site).

```js
// agents/lib/bettorday-trench.js
//
// Extracted from agents/portfolio-synthesize.js (2026-09-11, Phase 4 / Site 5
// of the query-dialect migration -- Codex review, Finding 3): that file has
// no exports and no import.meta.url guard, and ends in a top-level anonymous
// IIFE that runs the full synthesis pipeline immediately on import -- so a
// wiring test cannot safely import it. This module has zero top-level side
// effects and is safe to import directly from a test.
//
// STATUS: DORMANT. Andy's 2026-09-08 decision
// (docs/audits/2026-09-08-intel-pipeline-map/PRE_COMMITTEE_CHECKLIST.md:168)
// removed the BettorDay trench evidence lane from the synthesis prompt
// entirely. Nothing in agents/portfolio-synthesize.js calls this function
// today (confirmed: zero call sites). This module hardens the dormant read
// against the same unbounded-read pattern Phase 3c closed elsewhere;
// re-wiring it back into the live synthesis prompt is a separate decision
// requiring Andy's explicit sign-off, not part of this change.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchAllRows } from './supabase-pagination.js';

const DEFAULT_LOCAL_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)), '..', '..',
  'data', 'intel', 'bettorday_trench_ratings_2026.json',
);

export async function loadBettorDayTrenchEvidence({ sbUrl, sbKey, localPath } = {}) {
  const empty = { byTeam: {}, sourceMode: 'none' };
  let rows = null;
  let sourceMode = 'none';

  const SB_URL = sbUrl ?? process.env.SUPABASE_URL;
  const SB_KEY = sbKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (SB_URL && SB_KEY) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });
      const data = await fetchAllRows('loadBettorDayTrenchEvidence', {
        sb, table: 'nfl_trench_ratings',
        select: 'team, metric_type, rank_overall, score_overall, run_block_z, pass_block_z, run_defense_z, pass_rush_z, as_of_date',
        filters: [],
      });
      if (data?.length) { rows = data; sourceMode = 'supabase'; }
    } catch (err) {
      console.warn(`  [WARN] bettorday trench evidence (supabase): ${err.message}`);
    }
  }

  if (!rows) {
    try {
      const raw = await readFile(localPath ?? DEFAULT_LOCAL_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) { rows = parsed; sourceMode = 'local_file'; }
    } catch {
      // No local file either -- genuinely nothing available yet, not an error.
    }
  }

  if (!rows) return empty;

  // Keep only the most-recent as_of_date per (team, metric_type) -- both
  // sources can carry more than one date's rows. Order-independent by
  // construction -- fetchAllRows() makes no delivery-order guarantee, and
  // this reducer never relies on one.
  const latest = new Map();
  for (const r of rows) {
    const key = `${r.team}|${r.metric_type}`;
    const existing = latest.get(key);
    if (!existing || r.as_of_date > existing.as_of_date) latest.set(key, r);
  }

  const byTeam = {};
  for (const r of latest.values()) {
    byTeam[r.team] ||= {};
    const slot = r.metric_type === 'team_composite' ? 'team_composite'
      : r.metric_type === 'schedule_sos' ? 'schedule_sos'
      : null;
    if (!slot) continue; // unknown metric_type -- skip rather than guess
    byTeam[r.team][slot] = {
      rank_overall: r.rank_overall,
      score_overall: r.score_overall,
      run_block_z: r.run_block_z,
      pass_block_z: r.pass_block_z,
      run_defense_z: r.run_defense_z,
      pass_rush_z: r.pass_rush_z,
      as_of_date: r.as_of_date,
    };
  }

  return { byTeam, sourceMode };
}
```

`agents/portfolio-synthesize.js:1664-1728`'s inline `_loadBettorDayTrenchEvidence()` definition is deleted entirely (not just refactored in place) and replaced with nothing — since there are zero call sites today, there is nothing left in this file that needs to reference it. Re-wiring it in the future means adding `import { loadBettorDayTrenchEvidence } from './lib/bettorday-trench.js';` at that future call site, which is out of scope here and gated on Andy's sign-off per Finding 4.

`TABLE_UNIQUE_KEYS` gets the same one-line addition as v1:

```js
nfl_trench_ratings: 'id',
```

with the same removal of the now-inaccurate exclusion comment above the map.

## 4. Reframing (Finding 4)

This is **dormant-lane hardening, not a fix to a currently-live truncation risk**. `_loadBettorDayTrenchEvidence()` has no call site in the current synthesis pipeline; the BettorDay trench evidence lane was deliberately removed from the prompt on 2026-09-08. This work does not block, change, or touch the currently-running (fully-enhanced) portfolio synthesis in any way. Its value is purely: (a) the table itself still exists and is written to independently by the ingest agent regardless of whether synthesis reads it, so it's still subject to the same latent unbounded-read risk the moment anyone re-wires the loader back in; and (b) closing it now, while extracting the function into its own testable module, is cheap and leaves the dormant code in a safer state for whenever it's reconnected — which is a separate, future, Andy-authorized decision, not implied or requested here.

## 5. Test plan (revised)

1. `tests/unit/supabasePagination.test.js:220-224` and `:333-334` — replace the "no key exists, throws" assertions with `TABLE_UNIQUE_KEYS.nfl_trench_ratings === 'id'` plus a normal passing wiring test, matching the file's existing pattern for other tables.
2. New `tests/unit/bettordayTrench.test.js`, importing `agents/lib/bettorday-trench.js` directly (never `portfolio-synthesize.js`):
   - Mock `fetchAllRows` to return rows for two teams across two `as_of_date`s each; assert the exact request shape (table, six-column-plus-`as_of_date` select, no filters).
   - Assert the reducer keeps the newer `as_of_date` row per `(team, metric_type)` regardless of array order — feed rows in both ascending and descending order as two separate cases.
   - **Local-file fallback coverage (Codex Finding 7 — confirmed none exists today, grepped `tests/`):** a new case that unsets `sbUrl`/`sbKey` (or mocks a Supabase failure) and points `localPath` at a small fixture JSON file, asserting `sourceMode: 'local_file'` and correct `byTeam` output — this is the first unit test this function has ever had for that branch.
   - A case with both `sbUrl`/`sbKey` unset and no local file present, asserting the `{ byTeam: {}, sourceMode: 'none' }` empty-result shape.

## Explicitly out of scope for this document (unchanged from v1)

- Building or modifying the ingest agent — `agents/bettorday-newsletter-ingest.js` is tracked, working, and untouched by this proposal.
- Re-wiring `loadBettorDayTrenchEvidence()` back into the live synthesis prompt — a separate, future, Andy-authorized decision.
- The ESLint enforcement rule remains its own not-yet-started phase.

## What I need from you

Unchanged from v1: authorization to run the Part 1 schema migration (now additive-only, no PK drop) against the real database, and sign-off to send this v2 back to Codex for re-review before either part is applied.
