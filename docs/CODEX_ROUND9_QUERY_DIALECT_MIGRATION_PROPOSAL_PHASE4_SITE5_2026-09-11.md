# Query Dialect Migration — Phase 4 Proposal (Site 5: `nfl_trench_ratings`)

**Date:** 2026-09-11
**Status:** Proposal only. No migration has been run, no Supabase write has occurred, no code has been changed. Builds on the approved `docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v8_2026-09-10.md` design and Phase 3c (closed 2026-09-11, commit `2e47611`), which explicitly carved this site out.

## Why this document exists

Phase 3c's own scoping note (`docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_PHASE3C_2026-09-11.md`) named `_loadBettorDayTrenchEvidence()` (`nfl_trench_ratings`, `agents/portfolio-synthesize.js:1675`) as the fifth genuine unmigrated read site and excluded it because the table "may not have a stable unique key available for `fetchAllRows()`'s cursor until the still-unauthorized `nfl_trench_ratings` surrogate-key schema migration lands." `agents/lib/supabase-pagination.js:120-126` independently confirms this — `nfl_trench_ratings` is the one table deliberately absent from `TABLE_UNIQUE_KEYS`, with a comment stating it "has only a 5-column composite primary key... and cannot be used with `fetchAllRows()`/`fetchTopRows()` until a separately authorized, additive surrogate-key migration lands." This document is that separate proposal.

Two decisions are gated here, not one, per the standing rules (no Supabase writes/migrations without per-change authorization; no commits without explicit approval):

1. **Part 1 — the schema migration itself** (adds a surrogate key, removes nothing).
2. **Part 2 — the code migration** onto `fetchAllRows()`, which only makes sense once Part 1 exists.

Nothing in this document executes on its own. It's written to go to Codex for technical review once you're ready, and Part 1 additionally needs your explicit go-ahead before it ever touches the real database.

## Current state (verified directly against the repo, not assumed)

**Schema** (`supabase/migrations/053_bettorday_intel.sql:35-49`):

```sql
create table if not exists public.nfl_trench_ratings (
  team            text not null,
  season          integer not null,
  week            integer not null,
  metric_type     text not null,
  rank_overall    integer,
  score_overall   numeric(4,2),
  run_block_z     numeric(4,2),
  pass_block_z    numeric(4,2),
  run_defense_z   numeric(4,2),
  pass_rush_z     numeric(4,2),
  as_of_date      date not null,
  source          text not null default 'bettorday',
  primary key (team, season, week, metric_type, as_of_date)
);
```

No single-column unique or primary key exists — confirmed, this is the only table in the codebase's schema with a composite-only key that any pipeline code reads.

**Read site** (`agents/portfolio-synthesize.js:1664-1727`, `_loadBettorDayTrenchEvidence()`): `sb.from('nfl_trench_ratings').select(...).order('as_of_date', {ascending:false})` — no season/week filter, no `.limit()`. Relies entirely on PostgREST's implicit 1000-row cap, exactly the pattern this migration exists to close off. Falls back to a local file (`data/intel/bettorday_trench_ratings_2026.json`) if Supabase env vars are unset or the query returns nothing.

**Current scale:** the local fallback file has 64 rows — 32 teams × 2 `metric_type`s, all `week: 0` (preseason baseline), captured `2026-09-02`. Comfortably under the 1000-row cap today. I also grepped `agents/` and `scripts/` for any write path to this table and found none — no ingest agent in this repo currently upserts `nfl_trench_ratings`. It appears to be populated by something outside this codebase's tracked scope, or manually. That's a separate, pre-existing gap, not something this proposal fixes — flagging only because it means I can't independently verify the *actual* Supabase row count from here (this shell has no live network either, per the standing note). At full scale — 32 teams × 2 `metric_type`s × up to ~19 `as_of_date`s across a season if the newsletter updates weekly — this reaches roughly 1,200+ rows, past the cap. Same latent-truncation risk class as the four sites Phase 3c already closed.

**Consumption:** the reducer at lines 1705-1712 already picks the newest row per `(team, metric_type)` by explicit comparison —

```js
const key = `${r.team}|${r.metric_type}`;
const existing = latest.get(key);
if (!existing || r.as_of_date > existing.as_of_date) latest.set(key, r);
```

— which is order-independent by construction. Unlike Site 4 (`gatherItems()`'s expert lane in Phase 3c), which needed a *new* explicit JS sort added before its truncation, this site's consumption is already safe regardless of what order rows arrive in. This is a pure read-shape swap.

**Existing test coverage that assumes no key exists:** `tests/unit/supabasePagination.test.js:220-224` and `:333-334` explicitly assert `TABLE_UNIQUE_KEYS.nfl_trench_ratings` is `undefined` and that `fetchAllRows()`/`fetchByUniqueValues()` throw for this table. These currently encode "this table cannot use the dialect" as a permanent invariant. Once a key is added, that invariant becomes false and both tests need to be rewritten, not just left passing — calling this out now so it isn't missed in review.

## Part 1 — Schema migration (needs your explicit authorization, separate from Codex's code review)

Proposed file: `supabase/migrations/055_nfl_trench_ratings_surrogate_key.sql`. Purely additive — the existing composite key is preserved as a unique constraint, not dropped in spirit, only its role as *the* primary key changes:

```sql
-- Site 5 of the query-dialect migration needs a single-column unique key
-- so nfl_trench_ratings can use fetchAllRows()/fetchByUniqueValues() like
-- every other table in TABLE_UNIQUE_KEYS (agents/lib/supabase-pagination.js).
-- The table's existing 5-column natural key (team, season, week,
-- metric_type, as_of_date) is PRESERVED as a unique constraint, not
-- dropped -- any future ingest agent that upserts on that combination
-- keeps working unchanged. Nothing currently in this repo writes to this
-- table (verified: no upsert call site found in agents/ or scripts/), so
-- there is no known write path to break today, but the constraint is kept
-- anyway since it documents the real business key and protects whatever
-- ingest process populates this table from outside this codebase.

alter table public.nfl_trench_ratings
  add column id bigint generated always as identity;

alter table public.nfl_trench_ratings
  drop constraint nfl_trench_ratings_pkey;

alter table public.nfl_trench_ratings
  add constraint nfl_trench_ratings_pkey primary key (id);

alter table public.nfl_trench_ratings
  add constraint nfl_trench_ratings_natural_key
  unique (team, season, week, metric_type, as_of_date);

comment on column public.nfl_trench_ratings.id is
  'Surrogate key added 2026-09-11 solely so this table can use the '
  'fetchAllRows()/fetchByUniqueValues() query-dialect primitives '
  '(agents/lib/supabase-pagination.js), which require a single-column '
  'unique key. The 5-column natural key is preserved as a separate '
  'unique constraint, not replaced -- see nfl_trench_ratings_natural_key.';
```

Risk notes for Codex:

- **RLS:** unaffected. The existing `nfl_trench_ratings` read/write policies (migration 053) aren't scoped to specific columns or the PK by name.
- **Downstream references:** this table's natural key is not referenced as a foreign key anywhere — confirmed no `references public.nfl_trench_ratings` in any `supabase/migrations/*.sql` file. `_loadBettorDayTrenchEvidence()` is the only reader in the codebase.
- **Identity backfill:** adding a `generated always as identity` column to a table with existing rows auto-populates sequential values for those rows (Postgres 10+ behavior) — I have **not** run this against the project's real database to confirm (this shell's egress is blocked, same as noted in the last handoff), so treat this as unverified, not asserted-working. Should be confirmed against a scratch/staging copy, or by Codex in an environment with live access, before the real migration runs.
- **Reversibility:** a clean rollback (drop the `id` PK/constraint, restore the original composite PK) loses no data either direction, since the natural-key constraint stays in place throughout.

## Part 2 — Code migration (only once Part 1 has actually landed)

Add one entry to `TABLE_UNIQUE_KEYS` (`agents/lib/supabase-pagination.js:128`):

```js
nfl_trench_ratings: 'id',
```

and remove the now-inaccurate comment above the map (lines ~120-126) explaining why it's excluded.

Target shape for the Supabase branch of `_loadBettorDayTrenchEvidence()` (`agents/portfolio-synthesize.js:1671-1687`) — the local-file fallback branch (1689-1701) is untouched:

```js
if (SB_URL && SB_KEY) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });
    const data = await fetchAllRows('_loadBettorDayTrenchEvidence', {
      sb, table: 'nfl_trench_ratings',
      select: 'team, metric_type, rank_overall, score_overall, run_block_z, pass_block_z, run_defense_z, pass_rush_z, as_of_date',
      filters: [],
    });
    if (data?.length) { rows = data; sourceMode = 'supabase'; }
  } catch (err) {
    console.warn(`  [WARN] bettorday trench evidence (supabase): ${err.message}`);
  }
}
```

Two behavior notes, flagged explicitly rather than silently changed:

1. The current code has `.order('as_of_date', {ascending:false})`; `fetchAllRows()` makes no delivery-order guarantee (its own doc comment: Shape 4 "makes NO claim about delivery order relative to any other column"). Dropping the `.order()` is safe here **only** because the reducer already picks the max `as_of_date` per key by explicit comparison rather than by trusting array order — confirmed by reading it, not assumed. This is the opposite situation from Site 4 in Phase 3c, which needed a *new* sort added for exactly this reason; this site needed one and already has it.
2. `fetchAllRows()` throws on error internally, same as the current inline `if (error) throw new Error(...)` — the outer `try { data = await fetchAllRows(...) } catch (err) { console.warn(...) }` shape and the degrade-to-local-file fallback behavior are unchanged.

## Test plan

1. Rewrite `tests/unit/supabasePagination.test.js:220-224` and `:333-334` — replace the "no key exists, throws" assertions with the mirror-image: `TABLE_UNIQUE_KEYS.nfl_trench_ratings === 'id'`, plus a normal passing wiring test against it, matching the pattern already used for the other tables in that file.
2. New wiring test for `_loadBettorDayTrenchEvidence()`'s Supabase branch: mock `fetchAllRows` to return rows for two teams across two `as_of_date`s each; assert the exact request shape (table, six-column-plus-`as_of_date` select, no filters); and assert the reducer keeps the newer `as_of_date` row per `(team, metric_type)` **regardless of array order** — feed the mock rows in both ascending and descending `as_of_date` order as two separate cases, proving the reducer doesn't depend on `fetchAllRows()`'s delivery order (this is the direct test of behavior-note 1 above).
3. Confirm whether local-file-fallback behavior already has test coverage; if so, leave it as-is (only the Supabase branch changes).

## Explicitly out of scope for this document

- Building an actual ingest agent for `nfl_trench_ratings` — none exists in this repo today; that's a separate, unrelated gap.
- The ESLint enforcement rule remains its own not-yet-started phase.

## What I need from you

1. Authorization to run the Part 1 schema migration against the real database — nothing has been touched yet.
2. Sign-off on sending this document to Codex for technical review before either part is applied, per the standing incremental-review process. Happy to split Part 1 (schema) and Part 2 (code) into separately-reviewed sub-phases if you'd rather gate them independently — they don't have to land together.
