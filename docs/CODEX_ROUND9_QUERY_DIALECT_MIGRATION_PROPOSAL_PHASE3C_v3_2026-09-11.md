# Query Dialect Migration — Phase 3c Proposal v3 (Response to Codex's Third Review)

**Date:** 2026-09-11
**Supersedes:** `docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_PHASE3C_v2_2026-09-11.md` (v2), which Codex reviewed and returned **changes requested** (2 P1). Still a proposal only — no Phase 3c code has been written.

## Verdict on the review

Both P1s are correct; neither contested. v2's Site 4 fix was on the right track (add the guard, export what a test needs) but incomplete on both counts:

- The guard v2 proposed wrapped an inline anonymous `(async () => { ... })()` *inside* the `import.meta.url` check. That's cosmetically similar to `portfolio-dossier.js`'s guard but not structurally the same thing. `portfolio-dossier.js`'s actual (Codex-approved) pattern extracts a **named** `async function main() { ... }` (line 1993) and the guard (line 2107) does nothing but call it: `if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) { main().catch(...); }`. v2 never did that extraction for `signal-normalize.js` — it left the script body as an anonymous function expression, just relocated inside the `if`. An anonymous function assigned to nothing can't be referenced, exported, or unit-tested independently, and — more to the point — nothing about wrapping an IIFE in an `if` changes what runs the moment the *module* is imported, as opposed to what runs when the *script* is invoked; those are two different questions, and v2's diff conflated them by describing the wrap as "the guard" without checking it against the actual precedent line-by-line.
- Independently of the guard's shape, `gatherItems()` is not safe to import for a single-lane test regardless of guarding, because it is one function covering all three lanes (article / podcast_intel+podcast_pick / expert), gated by a `want(sourceType)` closure that defaults to **true for every lane** whenever `--source`/`ONLY_SOURCE` is unset. A wiring test that imports the real `gatherItems()` to exercise only the expert lane, calls it with no `ONLY_SOURCE` set, and mocks `fetchAllRows()` would still run the article lane's live hand-rolled `research_intel_notes` pagination loop and the podcast lane's live `sb.from('podcast_transcripts')...limit(300)` call for real — neither of those two lanes goes through `fetchAllRows()` at all (they call `sb` directly), so mocking that one primitive does nothing to silence them. v2's test-plan text ("mocks `fetchAllRows`, import the real exported `gatherItems()`, call it, assert on the mocked primitive's actual call arguments") is exactly the shape of test that trips over this.

## Finding responses

### P1 — Main guard does not make the module import-safe (v2:20-43)

**Confirmed independently, against the actual precedent file:** `agents/portfolio-dossier.js:1993` defines `async function main() { ... }` — a named, standalone function — and the guard at `agents/portfolio-dossier.js:2107` is nothing but `if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) { main().catch((e) => { console.error('✖', e.message); process.exitCode = 1; }); }`. v2's diff for `signal-normalize.js` did not do this extraction; it kept the script body as an unnamed `(async () => { ... })()` sitting directly inside the `if`, which is not the same shape and doesn't give the module a function any test (or anything else) could reference.

Separately confirmed, re-reading `signal-normalize.js`'s full top-of-file (lines 1-65) side-by-side with `portfolio-dossier.js`'s: both files run identical-shaped code unconditionally at module scope — `argv`/`getArg` parsing off the live `process.argv`, `SB_URL`/`SB_KEY` presence checks that call `process.exit(1)` on failure, and an unconditional `createClient()` call. This is not something v2 introduced or something new to `signal-normalize.js`; `portfolio-dossier.js` has run this exact pattern since before Phase 3b, and that file is already imported today by five existing test files (`boardValidate.test.js`, `evidenceTierGate.test.js`, `namedStatusReviewSizingGates.test.js`, `pickSignalFloor.test.js`, `rowReduction.test.js`) against the project's real `.env` (`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are present, so the `process.exit(1)` branch never fires in test runs). So this module-scope code is not part of what's flagged here, and isn't something this proposal needs to change to close this finding — the finding is specifically about the guard/function shape, which v2 got wrong relative to the precedent it claimed to follow.

**Resolution:** extract a named `main()`, matching `portfolio-dossier.js` line-for-line in structure:

```js
// was, at module scope: (async () => { ... entire script body ... })().catch((e) => { ... });

async function main() {
  console.log(`🧭 signal-normalize — model ${MODEL}${DRY ? ' (DRY RUN)' : ''}${ONLY_SOURCE ? ` source=${ONLY_SOURCE}` : ''}`);
  const items = await gatherItems();
  // ...unchanged script body, otherwise identical to the current top-level IIFE...
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => { console.error('✖', e.message); process.exitCode = 1; });
}
```

`fileURLToPath` is already imported at the top of `signal-normalize.js` (used for `OUT_DIR`), so this needs no new import. Nothing else in the file changes shape — `main()`'s body is a verbatim move of the current IIFE's body, not a rewrite.

### P1 — `gatherItems` test still reaches unrelated live lanes (v2:43)

**Confirmed independently:** `gatherItems()` (lines 297-364) is a single function with three `if (want(sourceType))` blocks — article, podcast (intel+pick), expert — where `want = (s) => !ONLY_SOURCE || ONLY_SOURCE === s`. With `ONLY_SOURCE` unset (the default, and the only state a plain `import` + call gives you unless the test also fakes `process.argv` before import, which is fragile and order-dependent with ESM), all three blocks run. The article lane does its own hand-rolled `sb.from('research_intel_notes')` pagination loop (not `fetchAllRows()`); the podcast lane does a plain `sb.from('podcast_transcripts')...limit(300)` (also not `fetchAllRows()`). Mocking `fetchAllRows()` — which nothing in `gatherItems()` currently calls at all, since this is exactly the call site Phase 3c is proposing to migrate onto it — silences nothing in the other two lanes; they'd hit the real `sb` client and the real database on every test run.

**Resolution:** split the expert lane out of `gatherItems()` into its own function, `gatherExpertPicks()`, migrated onto `fetchAllRows()` and exported on its own — so a wiring test calls exactly one function that does exactly one thing, with no `want()`/`ONLY_SOURCE` branching left to worry about:

```js
export function buildExpertPicksRequest() {
  return {
    sb, table: 'user_picks',
    select: 'id, pick_type, selection, home, visitor, rationale, expert, created_at',
    filters: [{ column: 'source', op: 'eq', value: 'EXPERT' }],
  };
}

export async function gatherExpertPicks() {
  const data = await fetchAllRows('gatherExpertPicks', buildExpertPicksRequest());
  const sorted = [...data].sort((a, b) => {
    const at = Date.parse(a.created_at); const bt = Date.parse(b.created_at);
    const av = Number.isFinite(at) ? at : -Infinity;
    const bv = Number.isFinite(bt) ? bt : -Infinity;
    if (av !== bv) return bv - av;
    return (b.id ?? '').localeCompare?.(a.id ?? '') ?? 0;   // user_picks.id is text, not numeric
  });
  const items = [];
  for (const p of sorted) {
    const text = [p.pick_type, p.selection, p.home && `${p.visitor} @ ${p.home}`, p.rationale].filter(Boolean).join(' | ');
    if (text.trim()) items.push({ source_type: 'expert_pick', source_ref: `pick:${p.id}`, raw_text: text, author: p.expert || 'expert' });
  }
  return items;
}

async function gatherItems() {
  const items = [];
  const want = (s) => !ONLY_SOURCE || ONLY_SOURCE === s;
  if (want('article')) { /* unchanged article lane */ }
  if (want('podcast_intel') || want('podcast_pick')) { /* unchanged podcast lane */ }
  if (want('expert')) { items.push(...(await gatherExpertPicks())); }
  return LIMIT ? items.slice(0, LIMIT) : items;
}
```

(One correction from v2's sample here: `user_picks.id` is a client-generated `text` primary key per `supabase/migrations/004_user_data.sql`, not numeric — v2's earlier `(b.id ?? 0) - (a.id ?? 0)` tie-breaker pattern, carried over by habit from the article lane's integer `id`, would silently NaN-compare on this table. Using `localeCompare` for the tiebreak here is the correct fix, confirmed against the schema before writing this, not assumed from the article lane's shape.)

`gatherItems()` itself does not need to be exported for this test — only `gatherExpertPicks()` and `buildExpertPicksRequest()` do. The wiring test imports `gatherExpertPicks`, `vi.mock()`s `fetchAllRows`, calls it, and asserts on the mocked primitive's call arguments and on the returned items' shape/order — with zero risk of touching the article or podcast lanes, since neither is reachable from that one function. New file: `tests/unit/gatherExpertPicks.test.js`.

This also make the `created_at`-descending choice (still awaiting sign-off, see below) easier to isolate later: if a different order is chosen, only `gatherExpertPicks()`'s internal `.sort()` comparator changes, and only that one test's assertions need updating — nothing about the article/podcast lanes or `gatherItems()`'s own shape is affected either way.

## Still open — not a technical finding, a product sign-off

Per Codex's third review: the mechanics of `created_at` DESC (then `id` DESC as tiebreak — corrected above to a string compare) are endorsed as "the appropriate policy," but this remains **a recommendation awaiting Andy's explicit product authorization**, separate from Codex's technical sign-off on the exhaustive-read/wiring-test mechanics. This proposal does not mark that item resolved — it stays flagged as pending sign-off. If Andy prefers a different order (e.g., no explicit order beyond `id` DESC, or something else entirely), only `gatherExpertPicks()`'s `.sort()` comparator changes; nothing else about this proposal depends on which order is picked.

## Unchanged from v1/v2

Sites 1-3's shape assignments and schema analysis, the `TABLE_UNIQUE_KEYS` analysis (no new entries needed), the `nfl_trench_ratings` (site 5) carve-out, the three rowcap-scanner false-positive notes, the team-stats all-candidates-fail warning (P2, v2), the `game_id`-already-selected correction (P3, v2), and the overall single-batch sequencing recommendation are all unaffected by this round's findings and stand as written.

## Revised test plan summary (all four sites)

1. **Site 1** (`fetchTeamStats`): wiring test for the first-candidate-fails/second-succeeds fallback path + all-three-fail returns `{}` and logs the warning (unchanged from v2).
2. **Site 2** (`fetchSchedule`): wiring test asserting the exact request shape, `game_id` already present and unaffected (unchanged from v2).
3. **Site 3** (`fetchRefereeTendencies`): wiring test + grouping unit test (unchanged from v1/v2).
4. **Site 4** (expert picks): `signal-normalize.js` gets (a) a named `main()` extracted from the current top-level IIFE, called from an `import.meta.url` guard matching `portfolio-dossier.js`'s exact structure, and (b) the expert lane split out of `gatherItems()` into its own exported `gatherExpertPicks()`/`buildExpertPicksRequest()`, migrated onto `fetchAllRows()`. New test file `tests/unit/gatherExpertPicks.test.js` imports only `gatherExpertPicks`, mocks `fetchAllRows`, and asserts request shape + sort order — with no live-lane exposure. The `created_at`-descending sort order remains flagged for explicit sign-off, not presented as resolved.
