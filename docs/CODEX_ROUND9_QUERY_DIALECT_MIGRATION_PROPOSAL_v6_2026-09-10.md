# Query Dialect Migration Proposal v6 — Response to Codex's v5 Review

**Date:** 2026-09-10
**Supersedes:** `docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v5_2026-09-10.md` (v5), which Codex reviewed and returned: gate-report fix **approved**; migration proposal **changes requested** (1 P1, 2 P2, 1 P3 note). This document responds to each, verified against live code and live Supabase row data this round. Still a proposal only for the migration itself — no pipeline read call sites have been rewritten yet.

## Verdict on the review

Finding 1 is real and is the same category of bug the v4→v5 round itself introduced and then found: `fetchAllRows()` guarantees completeness, never order, and v5's own per-site audit missed one more consumer that depends on order — not a keyed reduction this time, but a straight list truncation (`items.slice(0, LIMIT)`). Findings 2 and 3 are both real gaps in specification, not in the migration's direction. Finding 4 is a bookkeeping correction to v5's own text, verified directly against live row counts this round; it doesn't change any proposed fix.

## Finding-by-finding response

### Finding 1 (P1) — the result-order audit missed a third failure mode: ordered-list truncation

Confirmed. `agents/signal-normalize.js`'s `gatherItems()` (article lane, ~lines 296–313) exhaustively paginates `research_intel_notes` today with `.order('captured_at', desc).order('id', desc)` — correct, newest-first, deterministic. Those rows are pushed onto a shared `items` array in that order, and `gatherItems()`'s final line, `return LIMIT ? items.slice(0, LIMIT) : items;`, means the array's overall order is behaviorally significant whenever `--limit` is passed: the newest N items get processed, not an arbitrary N.

This is a different failure mode than v5's Finding 2, which was about **keyed reductions** (first/last-wins per team/player/game) silently picking the wrong row. This is about an **unkeyed list truncation** silently picking the wrong subset of rows. `fetchAllRows()`'s PK-ascending pagination would satisfy "every row visited" while handing back oldest-first order, so `items.slice(0, LIMIT)` under the migration would keep the *oldest* N articles instead of the newest — the opposite of current behavior — with no error, since the code has no way to know delivery order changed.

**Resolution:** add a third category to the per-site audit, alongside "keyed reduction" (Finding 2, v5) and "count/pass-through" (no ordering dependency): **ordered-list consumption**. The rule for this category: any exhaustively-read result that is later sliced, truncated, or otherwise treated as ranked must be explicitly re-sorted by the business ordering field immediately after the exhaustive read returns, never assumed from fetch order. Concretely, `gatherItems()`'s article lane fetch is unchanged (still exhaustive, still `fetchAllRows()`-shaped once migrated), but its output is explicitly sorted before being pushed onto `items`:

```js
// After fetchAllRows() returns (order = arbitrary, PK-ascending):
const notes = await fetchAllRows('research_intel_notes', { select: 'id, title, summary, source, author, captured_at' });
notes.sort((a, b) => {
  const byTs = compareTimestampsDesc(a.captured_at, b.captured_at); // see Finding 2 below
  return byTs !== 0 ? byTs : (b.id - a.id); // id DESC as the deterministic secondary key
});
```

This closes the specific site Codex named. It also generalizes the standing rule going forward, since `signal-normalize.js` is exactly the kind of consumer (fetch-then-slice) most likely to reappear elsewhere in the pipeline as more sites migrate — the audit going into implementation now explicitly checks every migrated site against three categories, not two: keyed reduction, ordered-list truncation, and no dependency.

### Finding 2 (P2) — reducer specifications need complete tie/null rules

Agreed on all four points; v5 described the *shape* of the fix (compare, don't trust order) but left the comparison itself underspecified. Specifying now, per site:

**1. Parsed comparison, not raw string `>`.** All `captured_at`/`snapshot_at`/`processed_at` columns are `timestamptz`, which Postgres/PostgREST serializes as ISO-8601 — lexical string comparison happens to agree with chronological order for same-precision, same-offset ISO strings, but is not guaranteed to (mixed fractional-second precision, e.g. `.132603` vs `.63075` as seen live in this project's own `research_pick_signals` data this session, sorts incorrectly as strings past the decimal point once digit counts differ). Every reducer parses first: `const ts = v => { const t = Date.parse(v); return Number.isNaN(t) ? null : t; };` and compares the parsed epoch numbers, never the raw strings.

**2. Null/invalid timestamp handling.** A null or unparseable timestamp must never win a comparison against a valid one — a missing timestamp is not "older," it's "unknown," and an unknown value should never be preferred over known data. Rule, applied uniformly: if the incoming row's parsed timestamp is `null`, skip it unless the currently-held row is *also* `null` (in which case keep whichever was seen first, since there is no better signal available). If the currently-held row is `null` and the incoming row is valid, the incoming row always replaces it regardless of its actual value.

**3. Stable secondary key for exact ties**, resolved per table using each table's real primary key (not a business field that can repeat):
   - `team_analytic_snapshots` / `team_dvoa_snapshots` / `team_coaching_tendency_snapshots` (`latestByTeam()`): secondary key is each table's own `id` (bigserial), descending.
   - `player_injuries` (`fetchInjuryContext()`): Codex is correct that `espn_player_id` cannot break ties — it's the *grouping* key (one player has many injury reports), not a tiebreaker between them. Verified schema (`supabase/migrations/016_player_injuries.sql`): the table has a `bigserial primary key id` column, monotonically increasing with insertion order. Use `id` descending as the secondary key — a later-inserted row is a later-observed report even when `captured_at` (nullable, per Codex) ties or is itself null.
   - `game_odds_snapshots` (`fetchGameOddsOpen()`, keeps the *earliest*/min row): secondary key `id` ascending (lowest id = first inserted = genuinely earliest on a tie).
   - `game_splits_history` (`fetchGameSplitsLatest()`, keeps the *latest*/max row): secondary key `id` descending.

**4. Explicit `week DESC` sort after roster week collection.** For the `nfl_rosters` week-discovery site (`portfolio-preflight.js:831`), v5 already established the fix must independently collect the **set** of distinct `week` values across all fetched rows rather than trusting read order or a `.limit()` cutoff. Making explicit what "the current week" means once that set exists: after collecting the distinct `week` values into an array, `weeks.sort((a, b) => b - a)` and take `weeks[0]` — never assume the set's insertion order (which, from a `Set` built while iterating PK-ascending-paginated rows, reflects whatever order those weeks' rows happened to appear across pages, not numeric order).

### Finding 3 (P2) — `fetchPickSignals()`/`fetchUserPicks()` classification: resolved by product decision

Investigated live (verified against the production Supabase tables this session, 2026-09-10) rather than assumed, per Codex's ask. Findings:

- **`research_pick_signals`**: 975 rows total, spanning 2026-05-17 to present. The raw table carries real off-season noise: rows from May–July 2026 are extracted from the same RSS-ingested feed (`research-intel-ingest.js`, via `research_intel_notes` → `research_pick_signals`) but include non-NFL content — verified live sample includes NBA playoff picks (Cavaliers–Pistons), MLB best-bets, and a casino promo-code article, all attributed `bet_type: 'other'` or `'futures'`. This table's raw insert path has no sport-relevance filter; the filter that exists (`isNflBettingIntel()` in `agents/lib/sportsRelevanceFilter.js`) is only applied downstream, in `signal-normalize.js`'s normalized output — `fetchPickSignals()`'s raw read in `portfolio-dossier.js` is unfiltered and is used directly only as the inline fallback when the normalized signal file is absent.
- **`user_picks`**: 38 rows total, spanning 2026-03-06 to 2026-08-28, all `source = 'EXPERT'` — legitimately football-relevant, extracted from named podcast transcripts (e.g. Sharp or Square, Even Money), not cross-sport noise. Nowhere near the 1,000-row PostgREST cap.

Andy's decision, given the above: both sites move out of the top-N shape entirely.

- **`research_pick_signals`** → exhaustive read (`fetchAllRows()`) with an added `.gte('captured_at', '2026-08-10')` filter — training-camp start, chosen deliberately because it is also where the live data's off-season non-NFL noise ends (175 of 975 live rows predate it; the sampled pre-cutoff rows are the NBA/MLB/promo content above). This follows the same `SEASON`/`--since` pattern `fetchSnapshots()` already uses elsewhere in `portfolio-dossier.js`, rather than introducing a new bounding concept. It is not a substitute for the sport-relevance filter — noise from *after* Aug 10 is still possible and still needs `isNflBettingIntel()` (or equivalent) applied at or before read time, which remains a separate, not-yet-scoped fix — but it removes the entire off-season noise window at the source.
- **`user_picks`** → exhaustive read (`fetchAllRows()`), no date floor. At 38 total rows of legitimate content, a date floor would only discard real data (26 of 38 rows predate Aug 10) for no correctness benefit; the 1,000-row cap this migration exists to guard against is not a near-term risk for this table.

Net effect on the shape inventory: `fetchTopRows()`'s candidate list reverts to the two `podcast_transcripts` sites carried over from v3/v4 (`signal-normalize.js`'s podcast-intel lane and `portfolio-dossier.js`'s equivalent) — `research_pick_signals` and `user_picks` both become ordinary exhaustive-scan sites (one filtered, one not), removing the "is 1,000 an intentional boundary" ambiguity Codex raised, since neither site has a row-count boundary at all anymore.

### Finding 4 (P3) — row-count/table-attribution corrections

Confirmed and corrected against live data (2026-09-10):

- `game_splits_history`: **48 rows total**, not "100k+" as v5's Finding 2 table stated in `fetchGameSplitsLatest()`'s row (`"closing its own pre-existing, independent truncation risk on a 100k+-row table"`). That figure belongs to `game_odds_snapshots` (season 2026: **189,367 rows**, consistent with the pre-existing code comment in `portfolio-dossier.js` noting CLV once ran on 1,000 of 179,336 rows of that same table before Tier-1 remediation — the count has grown since).
- Correction to the claim, not to the fix: `fetchGameSplitsLatest()`'s missing pagination is still a real, worth-fixing latent bug — at 48 rows it is nowhere near today's 1,000-row cap, so unlike the CLV incident this is not a live truncation, but it is the same unguarded pattern that caused that incident and will silently truncate the moment the table crosses 1,000 rows with zero warning. The proposed fix (move to `fetchAllRows()`, Finding 2 above) is unchanged; only the urgency framing is corrected from "already broken" to "correctly identified as the next table this exact failure mode would hit."
- `user_picks` / `research_pick_signals` — v5's Finding 2 text described these as "deliberate recency-bounded reads, not incomplete attempts at exhaustive ones," which is superseded by Finding 3's resolution above: verified live, they were not a deliberate, documented product decision at all (that was the point of Codex's original question), and are now explicitly exhaustive reads per the decision in Finding 3.

## Confirmed resolutions from v5 (unchanged this round)

- Gate-report fix (`buildDisposition()`) — approved by Codex, shipped, independent of the migration's own approval.
- Comparison-based reduction as the general resolution pattern for Finding 2's keyed sites — approved in direction; this round adds the missing tie/null/secondary-key specification (Finding 2 above) and one additional site under a new category (Finding 1 above).
- `fetchTopRows()` secondary-key sourcing from `TABLE_UNIQUE_KEYS` and cap-drift detection via count query — approved.
- Dropping the generic `negate` flag for a dedicated `notLike` — approved.
- Exhaustive `podcast_episodes` read replacing the unbounded `.in()` list — approved.
- Scope-resolved exemption for the two dynamic `.from()` helpers (`rowCount`, `newestTs`) — approved.
- `nextCursor === cursor` exact-value repetition check — approved.
- `nfl_trench_ratings` additive-surrogate-key approach — approved (separately authorized migration, still pending).

## Revised shape count: unchanged at six; two sites reclassified

1. Single-row lookup — `.single()`/`.maybeSingle()`, terminal.
2. Count-only — `.select(cols, { count: 'exact', head: true })`, terminal.
3. Bounded-by-fixed-small-set read — `fetchByUniqueValues()`, scoped to genuinely small, non-growing sets (`vault_notes`).
4. Exhaustive keyset scan — `fetchAllRows()`, empty-page-terminated, cursor-advance-asserted via exact-value repetition, filters support `notLike`. Now explicitly includes two sub-cases per Finding 1: (a) sites whose output feeds a **keyed reduction** must convert that reduction to an explicit, tie/null-specified comparison (Finding 2); (b) sites whose output feeds a **later slice/truncation** must be explicitly re-sorted immediately after the read (Finding 1). `research_pick_signals` (with a `.gte('captured_at', ...)` filter) and `user_picks` (unfiltered) both join this shape per Finding 3.
5. Bounded top-N read — `fetchTopRows()`, hard-capped at `POSTGREST_MAX_ROWS`, secondary sort always the table's declared unique key, cap-drift detected via a count query on short pages. Candidate list reverts to the two `podcast_transcripts` sites (v3/v4).
6. Bounded write — `.upsert()`/`.insert()`, terminal.

## Revised migration sequencing

1. Gate-report fix — done, shipped.
2. Land `fetchAllRows()`, `fetchByUniqueValues()`, `fetchTopRows()` plus `TABLE_UNIQUE_KEYS` in `agents/lib/supabase-pagination.js`, including this round's `notLike`/cap-drift/exact-cursor corrections (carried from v5).
3. Convert the order-dependent sites identified across Finding 2 (v5) and Finding 2 (this round) to explicit, tie/null-specified comparison-based reductions — `latestByTeam()`, and the inline dedup loops in `fetchInjuryContext()` (secondary key `id` desc), `fetchGameOddsOpen()` (secondary key `id` asc), `fetchGameSplitsLatest()` (secondary key `id` desc) — **before** their read call sites are migrated. Hard precondition, not a rewrite detail.
4. Convert the one ordered-list site identified in Finding 1 (`signal-normalize.js`'s `gatherItems()` article lane) to explicit post-fetch sorting — also a hard precondition before that site's read is migrated.
5. Fix the `nfl_rosters` week-discovery site (`portfolio-preflight.js:831`) to collect the distinct `week` set and explicitly sort it descending (Finding 2, point 4) — hard precondition for that site.
6. Separately propose and get authorization for the `nfl_trench_ratings` surrogate-key migration.
7. Migrate the read call sites to their corrected target shapes: `research_pick_signals` (exhaustive, `captured_at >= 2026-08-10`) and `user_picks` (exhaustive, no floor) per Finding 3; the two `podcast_transcripts` sites stay `fetchTopRows()`; flagging (not yet fixing) the independent `signal-normalize.js:345-346` unordered `user_picks` read (no `.order()` before `.limit(1000)`, feeding expert-pick signal extraction) for a later, separately-scoped fix.
8. Build the real ESLint rule with full `RuleTester` coverage.
9. Enable the rule only after steps 3–5's precondition fixes are merged and verified live, and step 7's call-site migration lands — an exhaustive-but-wrong-order or exhaustive-but-unsorted read passing the dialect check would otherwise look identical to a correct one from the rule's perspective.
