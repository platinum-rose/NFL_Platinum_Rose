# Query Dialect Migration — Phase 3c Proposal (sites 1-4)

**Date:** 2026-09-11
**Status:** Proposal only. No code has been written for this phase. Builds on the approved `docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v8_2026-09-10.md` design and the Phase 1-3b primitives/precedents it produced; does not reopen any of that.

## Why this document exists

Phases 1-3b closed out the query-dialect migration's originally-scoped call sites. Before assuming nothing was left, every remaining `sb.from()` read in the betting-pipeline scope (`portfolio-dossier.js`, `portfolio-preflight.js`, `signal-normalize.js`, `portfolio-synthesize.js`) was read directly against the approved primitives in `agents/lib/supabase-pagination.js`. Three of the `A:rowcap` scanner's BLOCK entries turned out to be false positives (bounded `.upsert()`/`.insert()` writes the scanner's static pattern-match can't distinguish from unbounded reads: `normalized_signals` upsert, `futures_recommendations` upsert, `futures_recommendation_runs` insert — no fix needed, flagged for Codex's awareness only, not proposed here). Five sites turned out to be genuine, never-migrated reads. This proposal covers four of them. The fifth, `_loadBettorDayTrenchEvidence()` (`nfl_trench_ratings`, `portfolio-synthesize.js:1675`), is deliberately excluded: it may not have a stable unique key available for `fetchAllRows()`'s cursor until the still-unauthorized `nfl_trench_ratings` surrogate-key schema migration lands, so it needs a separate decision, not folded in here.

None of the four tables below needed a new `TABLE_UNIQUE_KEYS` entry — `nfl_team_season_stats`, `referee_tendencies`, and `user_picks` are already declared (`id`), and `games` is already declared (`game_id`), all landed in Phase 1 even though no call site used them yet. That significantly de-risks this phase: no primitive changes, no new schema questions, purely call-site migration.

## Site 1 — `fetchTeamStats()` (`agents/portfolio-dossier.js:431`, table `nfl_team_season_stats`)

**Current shape:** a hand-rolled schema-tolerance loop — tries three progressively smaller `.select()` column lists (newest-migration EPA/formation columns first, falling back to bare win/loss/ATS columns) against `.gte('season', 2023).lte('season', SEASON)`, no `.limit()`, stops at the first that doesn't error. Relies entirely on PostgREST's implicit 1000-row cap; ~4 seasons × 32 teams is comfortably under it today, but nothing guards against that changing, and the read pattern is exactly what this migration exists to eliminate.

**Consumption:** every row goes into a `byTeam[nick]` array (no reduction, no truncation), then each team's array is sorted by season descending in JS. Fully order-independent on the read side — pagination order does not matter, since every row is kept and the existing JS sort already handles presentation order.

**Target shape:** `fetchAllRows()`, exhaustive, per candidate column list, preserving the existing schema-tolerance fallback:

```js
export function buildTeamStatsRequest(cols) {
  return {
    sb, table: 'nfl_team_season_stats', select: cols,
    filters: [
      { column: 'season', op: 'gte', value: 2023 },
      { column: 'season', op: 'lte', value: SEASON },
    ],
  };
}

async function fetchTeamStats() {
  let data = null;
  for (const cols of TEAM_STATS_COLUMN_CANDIDATES) {
    try { data = await fetchAllRows('fetchTeamStats', buildTeamStatsRequest(cols)); break; }
    catch { /* try the next, narrower candidate -- unchanged fallback intent */ }
  }
  // ...unchanged byTeam grouping + season-desc sort...
}
```

`fetchAllRows()` throws instead of returning `{ error }`, so the fallback loop's `if (!r.error)` becomes a `try/catch` around each candidate — same fallback behavior, adapted to the primitive's error contract. `TEAM_STATS_COLUMN_CANDIDATES` is the existing three-string array, extracted to a constant so the wiring test can assert on it directly.

**Test plan:** a wiring test mocking `fetchAllRows` to fail for the first candidate and succeed on the second, asserting (a) it was called with the first candidate's exact request shape before falling back, (b) it was called with the second candidate's exact request shape, and (c) a third candidate is never attempted once the second succeeds. A second test proves all three candidates failing propagates rather than silently returning `null`-as-empty (matching current behavior, where `data` staying `null` produces an empty `byTeam` rather than a thrown error — confirm this is still the desired behavior with Andy/Codex, since it's an existing soft-degrade this migration should preserve, not an artifact of the change).

## Site 2 — `fetchSchedule()` (`agents/portfolio-dossier.js:1135`, table `games`)

**Current shape:** `sb.from('games').select(...).eq('season', SEASON)`, no `.limit()` at all — relies entirely on the implicit 1000-row cap. A full season (regular + preseason + playoffs) is comfortably under 1000 today, same caveat as site 1.

**Consumption:** returned array is used for a full aggregation (rest-day/short-week/division-game counts per team, `agents/portfolio-dossier.js:1672-1727`) and a straight `.map()` into the dossier's `schedule` field (`:2086`) — no reduction, no truncation, fully order-independent.

**Target shape:** `fetchAllRows()`, exhaustive, single filter:

```js
export function buildScheduleRequest() {
  return {
    sb, table: 'games',
    select: 'game_id, season, week, season_type, home_team, away_team, home_abbrev, away_abbrev, ' +
      'away_rest, home_rest, div_game, referee, closing_spread_line, closing_total_line',
    filters: [{ column: 'season', op: 'eq', value: SEASON }],
  };
}

async function fetchSchedule() {
  try { return await fetchAllRows('fetchSchedule', buildScheduleRequest()); }
  catch (e) { console.warn(`   ⚠ schedule: ${e.message} — SoS disabled`); return []; }
}
```

`game_id` is already the table's declared cursor column (`TABLE_UNIQUE_KEYS.games`); the existing `.select()` doesn't request it, so `fetchAllRows()` auto-injects and strips it as usual — no downstream code touches `game_id`, so this is transparent.

**Test plan:** a wiring test asserting `fetchSchedule()` calls `fetchAllRows('fetchSchedule', { table: 'games', filters: [{ column: 'season', op: 'eq', value: SEASON }], select: <the exact string above> })`, plus the existing degrade-to-`[]`-on-error behavior preserved and tested.

## Site 3 — `fetchRefereeTendencies()` (`agents/portfolio-dossier.js:1198`, table `referee_tendencies`)

**Current shape:** `sb.from('referee_tendencies').select(...)`, no filter, no `.limit()` — reads the entire table unpaginated.

**Schema check (migration `040_referee_tendencies.sql:23`):** `referee text not null unique`, and the table's own header comment confirms "One row per referee... re-derived and upserted wholesale each time `scripts/derive_referee_tendencies.py` runs." The consuming code (`byRef[r.referee] = r`) is therefore safe regardless of read/pagination order today — there is a database-enforced guarantee of at most one row per key, not an assumption this migration needs to defend against. This table is also small (one row per NFL referee, on the order of dozens), so the risk here is more about consistency-with-the-dialect than an active truncation threat — but a genuinely unbounded read on a table with no cap is still the exact pattern this migration exists to close off, and costs nothing to fix.

**Target shape:** `fetchAllRows()`, exhaustive, no filter:

```js
export function buildRefereeTendenciesRequest() {
  return {
    sb, table: 'referee_tendencies',
    select: 'referee, games_officiated, avg_total_points, avg_total_penalties, home_win_pct',
    filters: [],
  };
}

async function fetchRefereeTendencies() {
  let data;
  try { data = await fetchAllRows('fetchRefereeTendencies', buildRefereeTendenciesRequest()); }
  catch (e) { console.warn(`   ⚠ referee_tendencies: ${e.message} — officiating context disabled`); return {}; }
  const byRef = {};
  for (const r of data || []) byRef[r.referee] = r; // safe: referee is DB-unique (migration 040)
  return byRef;
}
```

**Test plan:** a wiring test asserting the exact request shape passed to `fetchAllRows()`, plus a unit test on the (unchanged) `byRef` grouping using two distinct referees to confirm no cross-contamination.

## Site 4 — `gatherItems()`'s `expert` lane (`agents/signal-normalize.js:367`, table `user_picks`, `source = 'EXPERT'`)

**Current shape:** `sb.from('user_picks').select('id, pick_type, selection, home, visitor, rationale, expert').eq('source', 'EXPERT').limit(1000)` — no `.order()` at all. This is the site the Phase 2 review (finding #2) explicitly flagged and left unfixed, on the grounds that a JS-side sort of an arbitrarily-PostgREST-chosen 1000-row slice cannot recover the rows PostgREST already discarded — only full pagination fixes it.

**Consumption:** `gatherItems()` accumulates items from multiple lanes (article, podcast, expert) into one `items` array, which the function's final line truncates: `return LIMIT ? items.slice(0, LIMIT) : items`. This is the same "ordered-list consumption" category the `article` lane was already fixed for in Phase 2 (`agents/signal-normalize.js:297-329`, `research_intel_notes`) — an exhaustive, unordered-by-the-database fetch must be explicitly re-sorted in JS before this function's own truncation, or the truncation silently depends on delivery order the new primitive doesn't guarantee (`fetchAllRows()` paginates PK-ascending only, by `id`, which for `user_picks` is a client-generated `text` primary key of the form `"{source}-{gameId}-{type}-{ts}"` — not a recency order).

**`user_picks.created_at`** (`supabase/migrations/004_user_data.sql`) is the natural recency field, matching how the `article` lane sorts by `captured_at` desc. It is not currently selected by this lane and needs to be added.

**Target shape:** `fetchAllRows()`, exhaustive, filtered by `source = 'EXPERT'`, with an explicit JS sort by parsed `created_at` descending (tiebreak: `id` descending, lexicographic — consistent with the `id` column's text type) before this function's own `items.slice(0, LIMIT)`:

```js
export function buildExpertPicksRequest() {
  return {
    sb, table: 'user_picks',
    select: 'id, pick_type, selection, home, visitor, rationale, expert, created_at',
    filters: [{ column: 'source', op: 'eq', value: 'EXPERT' }],
  };
}

// inside gatherItems(), replacing the current expert-lane block:
if (want('expert')) {
  let data;
  try { data = await fetchAllRows('gatherItems:expert', buildExpertPicksRequest()); }
  catch (e) { console.warn(`   ⚠ user_picks (expert): ${e.message} — expert-pick lane disabled`); data = []; }
  data.sort((a, b) => {
    const at = Date.parse(a.created_at); const bt = Date.parse(b.created_at);
    const av = Number.isFinite(at) ? at : -Infinity;
    const bv = Number.isFinite(bt) ? bt : -Infinity;
    if (av !== bv) return bv - av;
    return String(b.id ?? '').localeCompare(String(a.id ?? ''));
  });
  for (const p of data) {
    const text = [p.pick_type, p.selection, p.home && `${p.visitor} @ ${p.home}`, p.rationale].filter(Boolean).join(' | ');
    if (text.trim()) items.push({ source_type: 'expert_pick', source_ref: `pick:${p.id}`, raw_text: `[${p.expert || 'expert'}] ${text}`, author: p.expert || 'expert' });
  }
}
```

This finally closes the Phase-2-flagged gap: exhaustive read (no more silently-discarded rows beyond an arbitrary 1000), explicit deterministic sort (no more dependence on delivery order the new primitive doesn't promise), same product behavior as before once `LIMIT` truncation is reached (most recent expert picks first).

**Test plan:** (1) a wiring test asserting the exact request shape passed to `fetchAllRows()`; (2) a sort-correctness test feeding rows with out-of-order `created_at` (including a tie, including a missing/unparseable `created_at`) and asserting the resulting order; (3) confirm this lane's contribution to `gatherItems()`'s final `items.slice(0, LIMIT)` still yields the most-recent-first items an integration test would expect, mirroring the `article` lane's existing test coverage.

## Migration sequencing

Independent sites, no ordering dependency between them — propose reviewing and merging as one Phase 3c batch (all four are small, mechanical, well-precedented changes, unlike Phase 3b's product-decision-bearing season floor), but happy to split into separate sub-phases if Codex or Andy prefers narrower review batches.

## Explicitly out of scope for this document

- `_loadBettorDayTrenchEvidence()` / `nfl_trench_ratings` (site 5) — excluded pending the schema-migration decision noted above.
- The three rowcap-scanner false positives (`normalized_signals`, `futures_recommendations`, `futures_recommendation_runs`) — no code change proposed; noted so Codex doesn't independently "fix" a non-bug, and so the scanner's own pattern-matching limitation is on record.
- The real ESLint rule enforcing this dialect — still gated on all migration sub-phases landing first, per v8's original sequencing.
- Anything under `nfl_trench_ratings`'s schema, Yahoo/fantasy files, paid synthesis, or portfolio/bankroll mutation — all separately gated, unauthorized, and untouched by this proposal.
