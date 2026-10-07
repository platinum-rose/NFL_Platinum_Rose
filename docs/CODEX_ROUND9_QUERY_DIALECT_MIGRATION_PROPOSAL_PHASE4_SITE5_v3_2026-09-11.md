# Query Dialect Migration — Phase 4 Proposal v3 (Site 5: `nfl_trench_ratings`, Response to Codex's Second Review)

**Date:** 2026-09-11
**Supersedes:** `docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_PHASE4_SITE5_v2_2026-09-11.md` (v2). Codex's technical design approval on v2 was itself withdrawn in the same review pass that caught the unrelated Phase 3c clean-checkout break (now resolved — commit `5ab2d9b`, see that commit's message for detail) — v2 came back **changes requested** (2 P1, 2 P2). Still a proposal only: no migration run, no Supabase write, no code changed.

## Verdict on the review

Both P1s confirmed correct. The Phase 3c P1 (unrelated to this document) is handled separately — resolved via commit `5ab2d9b`. This document responds only to the two Phase-4-specific findings.

- **P1 (reducer not actually order-independent):** confirmed by re-reading `docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_PHASE4_SITE5_v2_2026-09-11.md` line 143 against `supabase/migrations/053_bettorday_intel.sql:35-49`. The v2 reducer keys only on `team|metric_type` and advances only when `r.as_of_date > existing.as_of_date` (strictly greater) — but the table's actual primary key is `(team, season, week, metric_type, as_of_date)`, meaning two rows can share `team`, `metric_type`, AND `as_of_date` while differing in `season` or `week` (e.g. a `week: 0` preseason baseline and a `week: 1` in-season update captured/backfilled on the same calendar date). When `as_of_date` ties, `>` is false both ways, so the reducer silently keeps whichever row happened to arrive first — a real, previously-unexamined delivery-order dependency. Fixed below with an explicit three-level tie policy.
- **P2 (test/cleanup items):** all four confirmed still outstanding (re-checked directly, not re-assumed from v2): the select string is 9 fields, not 6+1; `agents/portfolio-synthesize.js:3664-3667`'s comment ("`loadBettorDayTrenchEvidence()` is left defined below (unused) rather than deleted...") is still there and still describes code v2's own plan deletes; the 4-case test list (success / thrown-error-fallback / empty-fallback / no-credentials-no-file) with explicit credential isolation was specified in v2's test plan already but is restated here for completeness since it's part of what Codex asked to fold in; schema/code authorization staying separate is unchanged (already the design, no drift to correct).

## 1. Reducer fix — explicit three-level tie policy

Tie policy, as Codex suggested: `as_of_date` descending, then `season` descending, then `week` descending. Once all three are equal, the row is literally the same row by the table's primary key (`team, season, week, metric_type, as_of_date` all match) — no further tiebreak is needed or possible.

`season` and `week` are not in v2's select — they need to be added (select grows from 9 fields to 11: `team, season, week, metric_type, rank_overall, score_overall, run_block_z, pass_block_z, run_defense_z, pass_rush_z, as_of_date`).

Revised reducer inside `loadBettorDayTrenchEvidence()` (`agents/lib/bettorday-trench.js`, per v2's module extraction — unchanged from v2 otherwise):

```js
// Keep only the most-recent row per (team, metric_type). "Most recent" is
// as_of_date DESC, then season DESC, then week DESC -- the schema's real
// primary key is (team, season, week, metric_type, as_of_date), so two
// rows can share team + metric_type + an EQUAL as_of_date while differing
// in season or week (e.g. a week-0 preseason baseline and a week-1
// in-season update captured/backfilled the same calendar day). A plain
// as_of_date-only comparison is order-dependent on that tie; this fully
// resolves it -- once as_of_date, season, and week all match, the row IS
// the same row by the table's primary key, so no further tiebreak exists
// or is needed.
const isNewer = (candidate, incumbent) => {
  if (candidate.as_of_date !== incumbent.as_of_date) return candidate.as_of_date > incumbent.as_of_date;
  if (candidate.season !== incumbent.season) return candidate.season > incumbent.season;
  return candidate.week > incumbent.week;
};

const latest = new Map();
for (const r of rows) {
  const key = `${r.team}|${r.metric_type}`;
  const existing = latest.get(key);
  if (!existing || isNewer(r, existing)) latest.set(key, r);
}
```

Updated `fetchAllRows()` request shape (select grows to 11 fields; filters unchanged, still `[]`):

```js
const data = await fetchAllRows('loadBettorDayTrenchEvidence', {
  sb, table: 'nfl_trench_ratings',
  select: 'team, season, week, metric_type, rank_overall, score_overall, run_block_z, pass_block_z, run_defense_z, pass_rush_z, as_of_date',
  filters: [],
});
```

Nothing else in `agents/lib/bettorday-trench.js`'s design changes from v2 — same module extraction (import-safety fix for Finding 3 of the *first* review round), same dormant-lane framing, same local-file fallback shape, same `byTeam` output shape (the `season`/`week` fields are used only inside the reducer's comparison and are not added to the output objects, matching v2's existing field list there — unless you'd rather they be exposed too; flagging this as a small open question rather than assuming).

## 2. Test plan — reversed-order equal-date cases added, credentials explicitly isolated

Full revised list for the new `tests/unit/bettordayTrench.test.js` (importing `agents/lib/bettorday-trench.js` directly, never `portfolio-synthesize.js` — per the first review round's Finding 3, unchanged):

1. **Supabase success:** mock `fetchAllRows` to return rows for two teams across two `as_of_date`s each; assert the exact request shape (table, the 11-field select above, no filters).
2. **`fetchAllRows()` throws → local-file fallback:** mock a rejection, point `localPath` at a fixture, assert `sourceMode: 'local_file'` and correct output.
3. **Empty Supabase result → local-file fallback:** mock `fetchAllRows` resolving `[]`, same fixture, same fallback assertion (distinct from case 2 — an empty array is not an error, and v2/v3's code treats `!rows` the same way for both `null`-from-catch and an empty array only via the `if (data?.length)` guard, so this exercises that guard specifically rather than the catch block).
4. **No credentials + no local file → documented empty shape:** `{ byTeam: {}, sourceMode: 'none' }`.
5. **Tie-break correctness — same `as_of_date`, different `season`/`week`:** two rows, same `team`/`metric_type`/`as_of_date`, different `season` or `week`; assert the higher `season` (or, at equal season, higher `week`) wins **regardless of array order** — feed the pair in both orders as two separate cases (this is the direct test of the P1 fix above).
6. **Tie-break correctness — genuinely different `as_of_date`:** unchanged from v2's original plan (higher `as_of_date` wins, both array orders).

**Credential isolation, explicit per Codex's clarification:** every case that must not reach live Supabase passes `sbUrl: ''` and `sbKey: ''` explicitly (not `undefined`) — the module's `SB_URL = sbUrl ?? process.env.SUPABASE_URL` only falls back to `process.env` on `null`/`undefined`, not on an empty string, so an omitted/undefined arg in a test would silently risk live credentials from the environment.

## 3. Prose correction

The select is **11 fields** (after adding `season`, `week` above) — not "six plus `as_of_date`" (v1's error) and not "nine fields" (v2's field count before this fix, which was itself already a correction of v1 — restating here since the field count changes again with this revision).

## 4. Stale comment fix — `agents/portfolio-synthesize.js:3664-3667`

Current text:

```js
// loadBettorDayTrenchEvidence() is left defined below (unused) rather than
// deleted, in case Andy resumes a paid BettorDay subscription later and
// wants this reconnected -- do not call it or re-add 'bettorday_trench' to
// slimTeamProfile's keepKeys without checking with Andy first.
```

This becomes inaccurate once this proposal's Part 2 (code migration) lands, since the function moves out of this file entirely rather than staying "defined below (unused)." Replacement text:

```js
// loadBettorDayTrenchEvidence() now lives in agents/lib/bettorday-trench.js
// (extracted there so it's testable in isolation -- see that file's header
// comment) rather than being defined in this file. Not imported or called
// here, in case Andy resumes a paid BettorDay subscription later and wants
// this reconnected -- do not import/call it or re-add 'bettorday_trench' to
// slimTeamProfile's keepKeys without checking with Andy first.
```

## 5. Unchanged from v2

- Part 1 (schema migration): additive-only `id bigint generated always as identity` + separate `unique (id)` constraint, composite primary key untouched. Migration number `055` still available (re-confirmed: `ls supabase/migrations/055*` still finds nothing).
- The corrected writer inventory (`agents/bettorday-newsletter-ingest.js`, tracked at HEAD, upserts on the natural key — unaffected by this migration).
- The staging verification checklist (row count preserved, every `id` non-null, `count(distinct id) = count(*)`, composite PK unchanged, new unique constraint present, the ingest agent's upsert still succeeds, `fetchAllRows()` returns the full count).
- Framing as dormant-lane hardening, not a current synthesis blocker (`_loadBettorDayTrenchEvidence` — soon `loadBettorDayTrenchEvidence` in its own module — still has zero call sites in `portfolio-synthesize.js`; the 2026-09-08 decision to drop BettorDay from the prompt is unaffected and unchanged by this proposal).
- Keeping schema authorization (Part 1) and code authorization (Part 2, gated on Part 1's `id` constraint actually existing) separate.

## 6. P2 — dirty-tree scope (restated, no action taken)

`agents/portfolio-preflight.js`'s approved roster-week pagination hunk and `RULES.md`'s Andy-approved season-threshold exception are both still sitting in the broader ~714-entry dirty tree, unrelated to and untouched by this proposal or the recent Phase 3c catch-up commit (`5ab2d9b`). Neither is a runtime prerequisite for this site. Restating, not re-proposing: they need their own separate, narrowly-scoped review and authorization whenever Andy wants to take them up — not bundled into Phase 4/Site 5.

## What I need from you

Unchanged from v2: authorization to run the Part 1 schema migration (staging first) against the real database, and sign-off to send this v3 back to Codex for re-review before either part is applied.
