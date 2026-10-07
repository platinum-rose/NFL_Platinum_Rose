# Query Dialect Migration — Phase 4 Proposal v4 (Site 5: `nfl_trench_ratings`, Response to Codex's Third Review)

**Date:** 2026-09-11
**Supersedes:** `docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_PHASE4_SITE5_v3_2026-09-11.md` (v3), which came back **changes requested** (2 P2, no new P1 — the prior P1 is resolved). Still a proposal only: no migration run, no Supabase write, no code changed.

## Verdict on the review

Both P2s confirmed correct on re-reading v3 against the module's own logic.

- **P2 (blank credentials contradict cases 1-3):** confirmed. `agents/lib/bettorday-trench.js`'s Supabase branch is gated by `if (SB_URL && SB_KEY)`, and `SB_URL = sbUrl ?? process.env.SUPABASE_URL` only falls back to `process.env` on `null`/`undefined` — but an explicit empty string `''` is falsy on its own, so `if ('' && '')` is `false` regardless of `process.env`. v3's instruction to pass `sbUrl: ''`/`sbKey: ''` for "every case that must avoid live Supabase" would make cases 1-3 (Supabase success, thrown-query fallback, empty-query fallback) skip the Supabase branch entirely and fall straight to the local-file branch — meaning case 1 would never actually exercise success at all, and cases 2/3 would be indistinguishable from each other and from case 4. A real gap in the test plan, not just a wording issue. Fixed below with non-empty sentinel credentials for cases 1-3, mocked `createClient`/`fetchAllRows`, and an explicit assertion that `fetchAllRows` was actually called (so a silently-skipped branch can't pass).
- **P2 (local fallback has no PK enforcement):** confirmed. My v3 reasoning — "once `as_of_date`, `season`, and `week` all match, the row IS the same row by the table's primary key" — is only true for Supabase-sourced rows, which are protected by the real database constraint. `data/intel/bettorday_trench_ratings_2026.json` (the local fallback file) has no enforced uniqueness at all; two rows there could share the full natural key while carrying different measurement values, and the reducer as written would silently pick whichever happened to be encountered first once the three-level tie policy is exhausted. This is a genuine gap the v3 tie policy didn't close. Fixed below: the reducer now detects a full-key tie explicitly and either no-ops (identical duplicate) or fails loud (conflicting duplicate) rather than falling through to array-order-dependent behavior.

## 1. Reducer fix, revised — explicit full-key-tie handling

`isNewer()` now returns a **tri-state** (`true`/`false`/`null`) instead of a boolean, so the caller can distinguish "genuinely newer/older" from "exhausted all three tiebreak levels, still tied":

```js
// Field-level comparison: null distinguishes "found a decisive difference"
// (true/false) from "as_of_date, season, and week all match" (null) -- the
// caller needs that third case to detect a full natural-key tie, not just
// treat it as "not newer."
const isNewer = (candidate, incumbent) => {
  if (candidate.as_of_date !== incumbent.as_of_date) return candidate.as_of_date > incumbent.as_of_date;
  if (candidate.season !== incumbent.season) return candidate.season > incumbent.season;
  if (candidate.week !== incumbent.week) return candidate.week > incumbent.week;
  return null; // full natural-key tie -- see below
};

// The six non-key measurement columns this table carries (everything in
// the select besides the grouping/key fields team, metric_type, and the
// as_of_date/season/week the tie policy above already covers).
const MEASUREMENT_FIELDS = ['rank_overall', 'score_overall', 'run_block_z', 'pass_block_z', 'run_defense_z', 'pass_rush_z'];
const sameMeasurements = (a, b) => MEASUREMENT_FIELDS.every((f) => a[f] === b[f]);

const latest = new Map();
for (const r of rows) {
  const key = `${r.team}|${r.metric_type}`;
  const existing = latest.get(key);
  if (!existing) { latest.set(key, r); continue; }
  const newer = isNewer(r, existing);
  if (newer === true) { latest.set(key, r); continue; }
  if (newer === false) continue;
  // newer === null: (team, season, week, metric_type, as_of_date) all
  // match. Supabase's real primary key (migration 053) makes this
  // impossible for two DISTINCT rows from that source -- this branch is
  // dead code for a Supabase-sourced read, kept only as a defensive
  // universal check. The local JSON fallback
  // (data/intel/bettorday_trench_ratings_2026.json) has no enforced
  // uniqueness at all, so this branch is reachable there. If the
  // measurement fields also match, it's a harmless duplicate -- no-op,
  // keep the incumbent. If they differ, there is no principled way to
  // pick a winner between two rows claiming the same identity with
  // different values -- fail loud rather than silently keeping whichever
  // happened to be encountered first in file order.
  if (!sameMeasurements(r, existing)) {
    throw new Error(
      `loadBettorDayTrenchEvidence: conflicting duplicate rows for team=${r.team} metric_type=${r.metric_type} ` +
      `season=${r.season} week=${r.week} as_of_date=${r.as_of_date} -- identical key, different measurements`
    );
  }
  // identical duplicate -- no-op, existing row is kept.
}
```

This mirrors the project's existing "fail loud on unresolvable ambiguity" pattern (`agents/lib/row-reduction.js`'s `isBetterRow()` does the same thing for a missing secondary key) rather than introducing a new philosophy.

Nothing else about the reducer, the `fetchAllRows()` request shape (still the 11-field select from v3), or the module's structure changes from v3.

## 2. Test plan, revised — sentinel credentials for cases 1-3, explicit call assertions, new duplicate-handling cases

Full list for `tests/unit/bettordayTrench.test.js`:

1. **Supabase success:** non-empty sentinel credentials (`sbUrl: 'https://sentinel.test'`, `sbKey: 'sentinel-key'`); mock `@supabase/supabase-js`'s `createClient` (via `vi.mock`) to return a stub client, and mock `fetchAllRows` to resolve with rows for two teams across two `as_of_date`s each. **Assert `fetchAllRows` was actually called** with the exact request shape (table, the 11-field select, no filters) — this is the check that would have caught v3's blank-credential gap, so it stays as a permanent guard against a silently-skipped branch passing.
2. **`fetchAllRows()` throws → local-file fallback:** same sentinel credentials and mocks as case 1, but `fetchAllRows` mocked to reject. Assert it was called (same guard), then assert the local-file branch ran (`sourceMode: 'local_file'`, correct output from a fixture).
3. **Empty Supabase result → local-file fallback:** same sentinel credentials and mocks, `fetchAllRows` mocked to resolve `[]`. Assert it was called, then assert the same fallback behavior as case 2 — kept as a distinct case from case 2 because the code path differs (the `if (data?.length)` guard vs. the `catch` block), even though the externally-observable result is the same.
4. **No credentials + no local file → documented empty shape:** unchanged from v3 — explicit `sbUrl: ''`/`sbKey: ''`, no fixture, asserts `{ byTeam: {}, sourceMode: 'none' }`. This is the one case where blank credentials are actually correct, since it's specifically testing the no-credentials branch.
5. **Tie-break — same `as_of_date`, different `season`/`week`:** unchanged from v3 — both array orders, higher `season` (or, at equal season, higher `week`) wins.
6. **Tie-break — different `as_of_date`:** unchanged from v3 — both array orders, higher `as_of_date` wins.
7. **Local-fallback identical duplicate:** two fixture rows sharing the full natural key (`team`, `metric_type`, `season`, `week`, `as_of_date`) with identical measurement fields — asserts no throw and the row is kept (whichever one — the no-op case).
8. **Local-fallback conflicting duplicate:** same full-key setup as case 7, but with at least one differing measurement field — asserts the function throws, and asserts the thrown message identifies the conflicting key (team/metric_type/season/week/as_of_date), not just a generic error.

## 3. Unchanged from v3

- The prose correction (11-field select).
- The stale-comment replacement at `agents/portfolio-synthesize.js:3664-3667`.
- Keeping `season`/`week` internal to the reducer's comparison, not added to the `byTeam` output shape (Codex confirmed this explicitly in the v3 review — no consumer requirement to expose them, so they stay internal).
- Everything in Part 1 (schema migration): additive-only `id` + separate unique constraint, composite PK untouched, migration `055` still available, the corrected writer inventory, the staging verification checklist.
- Dormant-lane framing; zero call sites for the loader in `portfolio-synthesize.js`; the 2026-09-08 decision to drop BettorDay from the prompt is unaffected.
- Schema authorization (Part 1) and code authorization (Part 2) kept separate.
- The dirty-tree scope note (`portfolio-preflight.js`'s roster-week hunk, `RULES.md`'s season-threshold exception) — still explicitly out of scope, not re-proposed.

## What I need from you

Unchanged: authorization to run the Part 1 schema migration (staging first) against the real database, and sign-off to send this v4 back to Codex for re-review before either part is applied.
