# Query Dialect Migration — Phase 3c Proposal v2 (Response to Codex's Review)

**Date:** 2026-09-11
**Supersedes:** `docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_PHASE3C_2026-09-11.md` (v1), which Codex reviewed and returned **changes requested** (2 P1, 1 P2, 1 P3). Still a proposal only — no Phase 3c code has been written.

## Verdict on the review

All four findings are correct; none contested.

- The two P1s are real correctness/process gaps in the proposal, not stylistic notes: one is a genuine "this test cannot run as designed" problem (site 4's wiring test would trigger `signal-normalize.js`'s entire top-level script on import — the exact class of bug Phase 3b's `import.meta.url` guard fixed in `portfolio-dossier.js`, which v1 failed to carry over to the other file that needed it); the other is v1 mischaracterizing a genuine new product decision (imposing a "most recent first" order where none existed before) as if it were merely preserving existing behavior.
- The P2 (site 1's all-candidates-fail path) was left as an explicit open question in v1 rather than resolved — correctly flagged as unresolved, since a proposal shouldn't hand a decision to the reviewer.
- The P3 is a plain factual error in v1's prose (site 2): the current code already selects `game_id`; v1's write-up said it didn't.

## Finding responses

### P1 — Site 4's wiring test cannot safely import `gatherItems()` (v1:142)

**Confirmed independently:** `agents/signal-normalize.js` has no exports at all (`grep -n "export " agents/signal-normalize.js` returns nothing) and its entire body runs inside a top-level `(async () => { ... })().catch(...)` IIFE (lines 412-478) with no `import.meta.url`/`process.argv[1]` guard — unlike `portfolio-dossier.js`, which got exactly this guard in the Phase 3b fix round for the identical reason. Importing this file for any test, as v1's Site 4 test plan required, would execute the live script: LLM calls, file writes, and a real Supabase upsert. There is also no pre-existing `signal-normalize.js` test file to model a safe pattern on — v1's claim that its test plan would be "mirroring the article lane's existing test coverage" was itself wrong; no such coverage exists (`find tests -iname "*signal*normal*"` returns nothing). This will be new test coverage, not a mirror of something already proven safe.

**Resolution:** add the same `import.meta.url` guard `portfolio-dossier.js` already carries, and export both the new `buildExpertPicksRequest()` and `gatherItems()` itself:

```js
export function buildExpertPicksRequest() {
  return {
    sb, table: 'user_picks',
    select: 'id, pick_type, selection, home, visitor, rationale, expert, created_at',
    filters: [{ column: 'source', op: 'eq', value: 'EXPERT' }],
  };
}

export async function gatherItems() {
  // ...unchanged body, including the revised expert-lane block from v1...
}

// was: (async () => { ... })().catch(...);
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  (async () => {
    // ...unchanged script body, now calling the exported gatherItems()...
  })().catch((e) => { console.error('✖', e.message); process.exitCode = 1; });
}
```

This is now a real wiring test, not a hypothetical one: `vi.mock()` on `fetchAllRows`, import the real exported `gatherItems()`, call it, assert on the mocked primitive's actual call arguments — the same pattern Phase 3b's `pickSignalFloor.test.js` established for `portfolio-dossier.js`. New file: `tests/unit/gatherItemsExpertLane.test.js` (or added to an existing `signal-normalize`-scoped test file if Codex prefers consolidating).

### P1 — "Newest-first" is a new product choice, not preserved behavior (v1:140-142)

**Confirmed:** the current code has no `.order()` on this query at all — PostgREST/Postgres make no row-order guarantee without one. v1's claim ("same product behavior as before... most recent expert picks first") asserts a "before" that was never actually defined; there was no reliable order prior to this change, arbitrary or otherwise. Imposing `created_at` descending is a sensible, defensible choice — it matches the `article` lane's existing convention and gives `LIMIT`-truncation a meaningful "most recent" semantic instead of an accidental one — but it's new behavior this proposal is choosing, not behavior it's carrying forward, and that distinction matters given this project's standing rule that product decisions (like the Aug-10 signal floor in Phase 3b) get surfaced explicitly rather than folded silently into a "shape migration."

**Resolution:** flagging this explicitly, not silently: **this proposal recommends `created_at` descending (most-recent-first) as the expert-pick lane's order once truncation applies, and requests Andy's/Codex's explicit sign-off on that as a product choice**, separate from approving the exhaustive-read/wiring-test mechanics, which stand regardless of which order is chosen. If a different order is preferred (e.g., preserving whatever the current arbitrary DB order happens to produce today, or ordering by something else), the same `fetchAllRows()` + explicit-JS-sort mechanism accommodates it — only the comparator in the `.sort()` call changes.

### P2 — Site 1's all-candidates-fail behavior, resolved (v1:41-43)

**Confirmed current behavior:** if all three column-list candidates error, `data` stays `null`, the grouping loop runs over `data || []` (i.e., nothing), and `fetchTeamStats()` returns an empty `byTeam` object — with **no warning logged at all**. This is already true today, independent of this migration; v1 correctly identified it but left the question of whether to preserve, fix, or change it unresolved.

**Resolution:** preserve the non-fatal degrade (this table isn't essential enough to fail the whole dossier build over), but close the actual gap — the missing warning, which is inconsistent with every other fetch function in this file (all of which `console.warn` on a degrade). Concretely:

```js
async function fetchTeamStats() {
  let data = null;
  for (const cols of TEAM_STATS_COLUMN_CANDIDATES) {
    try { data = await fetchAllRows('fetchTeamStats', buildTeamStatsRequest(cols)); break; }
    catch { /* try the next, narrower candidate -- unchanged fallback intent */ }
  }
  if (data === null) {
    console.warn('   ⚠ nfl_team_season_stats: all column-list candidates failed — team stats disabled');
  }
  // ...unchanged byTeam grouping + season-desc sort over (data || [])...
}
```

This does not throw (matching the existing soft-degrade default other non-essential context fetches use, e.g. `fetchRefereeTendencies()`, `fetchSchedule()`) and does not silently swallow the failure either — it surfaces exactly like every sibling function's degrade path. Test plan addition: a third wiring test asserting that when all three candidates fail, `fetchTeamStats()` returns `{}` and the warning fires (spy on `console.warn`).

### P3 — `game_id` is already selected in `fetchSchedule()`'s current code (v1:69)

**Confirmed:** the live `fetchSchedule()` (`agents/portfolio-dossier.js:1135-1142`) already includes `game_id` as the first column in its existing `.select()` string. v1's prose ("the existing `.select()` doesn't request it, so `fetchAllRows()` auto-injects and strips it as usual") was simply wrong — the target-shape code sample itself was correct (it also lists `game_id` first), only the surrounding explanation was in error.

**Corrected text:** `game_id` is already selected by the current code and stays selected in the migrated version unchanged; since it's already present in `select`, `fetchAllRows()`'s auto-inject/strip logic is a no-op here (the `needsCursorInjection` check finds it already in `requestedCols` and does nothing) — there is no transparency concern to note because nothing is being injected or stripped in the first place.

## Unchanged from v1

Sites 1-3's shape assignments (`fetchAllRows()` for `nfl_team_season_stats`, `games`, `referee_tendencies`), the `TABLE_UNIQUE_KEYS` analysis (no new entries needed), the `referee_tendencies` DB-uniqueness argument (migration `040_referee_tendencies.sql:23`), the `nfl_trench_ratings` (site 5) carve-out, the three rowcap-scanner false-positive notes, and the overall single-batch sequencing recommendation are all unaffected by this round's findings and stand as written in v1.

## Revised test plan summary (all four sites)

1. **Site 1** (`fetchTeamStats`): wiring test for the first-candidate-fails/second-succeeds fallback path (unchanged from v1) + **new**: all-three-fail returns `{}` and logs the warning above.
2. **Site 2** (`fetchSchedule`): wiring test asserting the exact request shape, `game_id` already present and unaffected (corrected framing, no behavior change).
3. **Site 3** (`fetchRefereeTendencies`): wiring test + grouping unit test (unchanged from v1).
4. **Site 4** (`gatherItems` expert lane): **revised** — `signal-normalize.js` gets the `import.meta.url` guard and exports `gatherItems()`/`buildExpertPicksRequest()` in the same change; wiring test then imports the real function and mocks `fetchAllRows`, following the Phase 3b `pickSignalFloor.test.js` pattern exactly (not "mirroring" nonexistent prior coverage); sort-correctness test unchanged from v1; and the `created_at`-descending choice is called out for explicit sign-off rather than presented as preserved behavior.
