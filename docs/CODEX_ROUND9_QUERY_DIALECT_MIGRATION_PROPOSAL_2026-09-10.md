# Query Dialect Migration Proposal — Codex Round 9 Response

**Date:** 2026-09-10
**Trigger:** Codex round 9 recommended replacing `agents/portfolio-preflight.js`'s construct-by-construct AST pattern-matching with a restricted, auditable Supabase query dialect enforced by an ESLint rule. This document scopes that migration for Codex's confirmation before any implementation begins. No code has been changed as part of this document — it is a proposal only.

## 1. Why a proposal, not a patch

Rounds 3–8 fixed eight real fail-opens in the scanner's pattern-matching (relation-scope keys, `head` option handling, parse-failure sentinels, gate-aggregation coverage — see the round-7 and round-8 handoff docs). Round 9 found three findings that are not new shapes of the same bug — they're proof the approach itself has a ceiling:

1. A query assigned to a variable can be mutated after the scanner inspects it (`const q = sb.from(...).limit(500); q.limit(2000);`).
2. A terminal method can be silently overridden later in the same chain (`.single()` then `.csv()`).
3. Discovery and wrapper-trust are name-based, not binding-based (a computed `.from()` access, or a locally shadowed function that happens to be named `fetchAllKeyset`).

All three exploit the fact that the scanner reasons about *what a snippet of syntax looks like*, not *what value the code actually produces at runtime*. No amount of additional pattern-matching closes that gap — each fix only narrows the specific shape found, and JS gives you infinitely many ways to construct an equivalent-looking-but-different runtime value. Codex's recommendation — allowlist a small number of provably-safe shapes, reject everything else automatically, verify by binding not by name — is the right fix because it stops trying to model arbitrary JavaScript and instead defines a small, closed language the scanner (and a linter) can fully verify.

## 2. Current call-site inventory

All Supabase call sites live in the three files `agents/portfolio-preflight.js` already scans (`SCANNED_SOURCES`), plus the shared pagination helper they call into:

- `agents/portfolio-dossier.js`
- `agents/signal-normalize.js`
- `agents/portfolio-synthesize.js`
- `agents/lib/supabase-pagination.js` (the `fetchAllKeyset` helper itself — not a call site, the approved primitive)

Full grep-verified inventory (`.from(`, `.limit(`, `.range(`, `.single(`, `.maybeSingle(`, `head: true`, `fetchAllKeyset`, `fetchAllPaged`) across all three files, grouped by the shape each site should end up matching:

### Already compliant with a keyset-style shape (no change needed)
- `portfolio-synthesize.js:1346` — `fetchAllKeyset('team notes fetch', {...})`
- `portfolio-synthesize.js:1487` — `fetchAllKeyset('master reports fetch', {...})`

These are the gold standard: the helper owns `.order()`/`.gt()`/`.limit()` entirely: the caller supplies only `table`, `select`, `cursorColumn`, `pageSize`, `applyFilters`. This is Shape 4 below, already implemented correctly once (round-2 Codex fix) — the migration reuses it as-is.

### Already compliant with a literal-bound shape (no change needed, but should be the reference example for Shape 3)
- `portfolio-synthesize.js:1301-1304` — `sb.from('vault_notes').select(...).in('path', docPaths).limit(999)`, with a runtime `throw` immediately above it if `docPaths.length > 999`. This is the only call site in the codebase today that *proves* its literal bound is safe rather than just asserting a number — it's the model for what Shape 3 should require everywhere else.

### Needs migration — offset-pagination sites NOT using a shared, self-owning helper
These currently rely on either a hand-rolled inline loop, or a callback-based helper (`fetchAllPaged`) that hands `.range()` ownership to the *caller* — the same "genuine wrapper that could still get it wrong" problem Codex already made the team close for `fetchAllKeyset` in round 2, but which was never applied to the offset-pagination side:

- `portfolio-dossier.js:263-272` (`fetchSnapshots`, `futures_odds_snapshots`) — fully inline loop, not wrapped in any named helper at all.
- `portfolio-dossier.js:251-259` (`fetchAllPaged` itself) + its 3 call sites: `:311-316` (`player_injuries`), `:1072-1078` (`game_odds_snapshots`), `:1150-1155` (`nfl_rosters`, per season/week).
- `signal-normalize.js:157-165` (`podcast_host_summaries`), `:248-256` (`research_pick_signals`), `:309-316` (`research_intel_notes`) — three more hand-rolled `.range(from, from + 999)` loops, structurally identical to `fetchAllPaged`'s pattern but not even routed through that helper.

All of these need to move onto one new shared helper (Shape 5, proposed below) that owns ordering/range/limit itself, the same way `fetchAllKeyset` already does — closing the exact class of bug Codex flagged in round 2 for keyset pagination, which was never extended to offset pagination.

### Needs reclassification — literal `.limit(n)` sites where n does not actually prove safety
- `portfolio-dossier.js:278-281` (`fetchPickSignals`, `research_pick_signals`, `.limit(1000)`)
- `portfolio-dossier.js:284-287` (`fetchUserPicks`, `user_picks`, `.limit(1000)`)
- `signal-normalize.js:346` (`user_picks`, `.eq('source','EXPERT').limit(1000)`)
- `portfolio-dossier.js:861-865`, `:927-931`, `:968-972` (`team_analytic_snapshots`, `team_dvoa_snapshots`, `team_coaching_tendency_snapshots`, all `.limit(2000)`)

`.limit(1000)` sits exactly at PostgREST's own silent-truncation cap — it can never prove the table doesn't have more rows than that; it just requests the same amount the server would have handed back anyway. `.limit(2000)` is worse: the codebase's own comment at `portfolio-dossier.js:246` already calls this pattern "inert," since PostgREST still only returns 1000 regardless of what's asked for — so today these three sites can silently be reading half a table with no signal that anything was cut off. None of these should qualify for Shape 3 (which requires the literal bound to be *proven* safe, per the `vault_notes` example above, not just asserted). Each one needs an owner decision: either migrate to the Shape 5 pagination helper, or add the same kind of runtime-verified small-table assertion `vault_notes` uses (e.g., "this table is application-bounded to under N rows by construction, verified how").

### New finding surfaced by this inventory pass (not previously flagged in any round)
- `portfolio-synthesize.js:1676-1678` (`nfl_trench_ratings`) — `sb.from('nfl_trench_ratings').select(...).order('as_of_date', {ascending: false})` with **no `.limit()`, `.range()`, or `.single()` at all**. This is a genuinely unbounded read sitting in the pipeline today. It happens to be inside `SCANNED_SOURCES`, so the existing scanner's row-cap check should already be classifying it against the table's live row count (fine if small, BLOCK if not) — but it was not called out by name in any round-3-through-9 finding, and it's exactly the kind of site the new dialect's default-deny posture would catch automatically rather than relying on the row-cap check to happen to still be scanning it correctly. Flagging it here for Codex to confirm whether it's already covered or is a live gap.

### Writes (a different risk category, not row-cap at all)
- `signal-normalize.js:450` — `sb.from('normalized_signals').upsert(chunk, { onConflict: '...' })`
- `portfolio-synthesize.js:3406` — `sb.from('futures_recommendations').upsert(rows, { onConflict: '...' })`
- `portfolio-synthesize.js:3444` — `sb.from('futures_recommendation_runs').insert(rows)`

These aren't unbounded-read risks (nothing here can silently truncate what's written), but they're still Supabase call sites the scanner currently has no explicit opinion on. The proposed dialect gives them their own shape (Shape 6) so the linter recognizes and validates them too, rather than the scanner only ever looking at reads.

## 3. Proposed dialect — six allowed shapes

Every shape shares four structural rules, which is what actually closes all three round-9 findings (not the per-shape logic — the shared rules do the work):

- **R1 — Single unbroken expression.** The entire call, from `sb.from(...)` through its terminal method, must be one expression, directly `await`-ed (`await sb.from(...)....`) or directly returned. **No assignment of the builder to a variable before the terminal call.** This alone closes Finding 1 (builder mutation) — `const q = sb.from(...); q.limit(2000);` simply isn't a legal shape; the linter rejects the assignment itself, not the mutation.
- **R2 — Literal table name.** `.from()`'s argument must be a plain string literal. `sb.from(tableVar)`, `sb['from'](...)`, and any computed access are all rejected outright. This closes half of Finding 3 (the computed `.from()` case) structurally, before the "is this table resolvable" question even comes up.
- **R3 — No calls after the shape's defined terminal method.** Each shape below names its terminal call; nothing may be chained after it. `.single().csv()` is rejected because `.csv()` appears after `.single()`, which Shape 1 does not permit — the rule doesn't need to know what `.csv()` does, only that a shape's terminal position is exclusive. This closes Finding 2.
- **R4 — Pagination and count/single trust is by verified import binding, not identifier text.** Where a shape names a specific helper (`fetchAllKeyset`, the proposed `fetchAllRanged`), the rule resolves the call's callee through the file's actual `import` bindings (via ESLint's scope analysis, not a text/regex match) and only trusts it if it resolves to that literal export from that literal module path. A locally defined or shadowed function of the same name resolves to a different binding and is rejected. This closes the other half of Finding 3.

The six shapes:

1. **Single-row lookup** — `sb.from('<table>').select(...)[.filters...].single()` or `.maybeSingle()`, terminal (R3). Use: any lookup keyed on a unique column.
2. **Count-only** — `sb.from('<table>').select(<cols>, { count: 'exact', head: true })`, with the options object at `select()`'s actual argument position (2nd arg) and containing only literal properties — no spread, no computed keys (this reuses the round-7/8 `resolvesToHeadTrue` logic, now as an allow-condition instead of a pattern to detect). Terminal at `.select()`; nothing may follow it.
3. **Small proven-bounded read** — `sb.from('<table>').select(...)[.filters...].limit(<literal N ≤ 999>)`, terminal at `.limit()`, **and** the call site must carry a runtime assertion (a `throw` guarding the actual input bound, as `vault_notes` does today at line 1298) proving N is never silently exceeded — not just an asserted-safe-looking number. A bare `.limit(1000)`/`.limit(2000)` with no such proof does not qualify (see the reclassification list above).
4. **Keyset pagination** — a call to `fetchAllKeyset(label, { sb, table, select, cursorColumn, pageSize, applyFilters })`, resolved by import binding to `agents/lib/supabase-pagination.js`. Already implemented; unchanged.
5. **Offset/range pagination** — a call to a new, equally self-owning `fetchAllRanged(label, { sb, table, select, pageSize, applyFilters, orderBy })` helper (proposed below), resolved by import binding to the same lib file. Replaces every hand-rolled `.range()` loop and the current callback-based `fetchAllPaged`.
6. **Bounded write** — `sb.from('<table>').upsert(<rows>, { onConflict: '<literal>' })` or `sb.from('<table>').insert(<rows>)`, terminal at `.upsert()`/`.insert()`. `<rows>` must be an identifier (not inlined), keeping the actual row-construction logic outside the linted expression itself, which the rule doesn't attempt to validate — only that the write call site itself isn't hiding a chained read or a builder mutation.

Anything not matching one of these six shapes is rejected by default — no seventh escape hatch, per Codex's "reject everything outside them" recommendation.

## 4. Proposed `fetchAllRanged()` helper

Mirrors `fetchAllKeyset()`'s design exactly — the helper owns pagination entirely, the caller supplies only what varies:

```js
// agents/lib/supabase-pagination.js (addition)

// Shared offset/range pagination helper, mirroring fetchAllKeyset()'s design:
// this function owns .order()/.range()/pageSize entirely so there is no
// "genuine wrapper that still gets it wrong" case (the same problem Codex's
// round-2 review closed for fetchAllKeyset by taking ownership of the cursor
// clause away from the caller). Replaces every hand-rolled `.range()` loop
// and the callback-based fetchAllPaged() pattern -- callers no longer touch
// .range()/.order() at all, so there is nothing in their own source for a
// scanner (or a human) to have to prove correct.
export async function fetchAllRanged(label, { sb, table, select, pageSize, applyFilters, orderBy }) {
  if (!pageSize || pageSize <= 0) throw new Error(`fetchAllRanged(${label}): pageSize must be a positive number`);
  if (!table || !select || !sb || !orderBy?.column) {
    throw new Error(`fetchAllRanged(${label}): sb, table, select, and orderBy.column are all required`);
  }
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    let query = sb.from(table).select(select);
    if (applyFilters) query = applyFilters(query);
    query = query
      .order(orderBy.column, { ascending: orderBy.ascending ?? true })
      .range(from, from + pageSize - 1);
    const { data, error } = await query;
    if (error) throw new Error(`${label}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return rows;
}
```

Note: `player_injuries` and `nfl_rosters` order by a tiebreaker column in addition to the primary sort column today (`captured_at` + `espn_player_id`) because `captured_at` alone isn't a total order. `orderBy` here takes a single column; if this matters for correctness (it does — see `portfolio-dossier.js`'s own comment at line 310), `orderBy` should become `{ columns: [...] }` (plural) applying each in sequence, or the helper should require the caller's `select` to include a genuinely-unique tiebreaker and document that requirement. Flagging this as an open design question for Codex rather than deciding it unilaterally, since it affects correctness, not just safety.

## 5. Proposed ESLint rule (draft, for review — not wired into the repo's eslint config)

```js
// eslint-rules/no-freeform-supabase-query.js  (PROPOSED — not yet added to .eslintrc)
//
// Enforces the six-shape Supabase query dialect from the round-9 migration
// proposal. Runs at lint time, before code ever reaches portfolio-preflight.js's
// runtime scanner -- catches an out-of-dialect query the moment it's written,
// rather than in a later Codex review round.
//
// Approach: for every CallExpression whose callee resolves (by traversing
// MemberExpressions) back to a `sb.from(<literal>)` root, walk the full chain
// of method calls built on top of it and require the chain to match exactly
// one of the six allowed shapes. Any `.from()` call reachable only through a
// non-literal or computed argument is rejected immediately (R2) without
// attempting shape matching at all. A `.from()` root discovered via an
// identifier that was itself assigned from a `sb.from(...)` expression
// (rather than being the same expression) is rejected under R1 before shape
// matching, by construction -- the rule only ever starts walking a chain from
// a `sb.from()` CallExpression appearing directly as the object of a
// MemberExpression, never from a variable reference.

const APPROVED_HELPERS = {
  fetchAllKeyset: { module: './lib/supabase-pagination.js' },
  fetchAllRanged: { module: './lib/supabase-pagination.js' },
};

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Restrict Supabase queries to the six approved dialect shapes (round-9 migration).',
    },
    schema: [],
    messages: {
      dynamicTable: "sb.from() must be called with a literal table name, not a variable, member access, or computed expression -- static analysis cannot prove which table a dynamic name resolves to.",
      assignedBuilder: "A Supabase query builder must be awaited in the same expression it's built in ({{table}}). Assigning it to a variable before calling terminal methods allows the query to be silently mutated after this point -- build and await it as one unbroken chain instead.",
      noMatchingShape: "This query on '{{table}}' does not match any of the six approved shapes (single-row lookup, count-only, small proven-bounded read, fetchAllKeyset, fetchAllRanged, or bounded write). See docs/QUERY_DIALECT.md.",
      unapprovedHelperBinding: "'{{name}}' is called here but does not resolve to the approved {{name}} export from {{module}} -- a locally defined or shadowed function of the same name is not a substitute for the audited pagination helper.",
      chainedAfterTerminal: "No method may be chained after '{{terminalMethod}}()' in this shape -- '{{table}}' has a call ({{extra}}) after the shape's terminal method, which can silently override its contract (e.g. .single().csv()).",
      unprovenLimit: "'.limit({{n}})' on '{{table}}' is not accompanied by a runtime assertion proving {{n}} is never exceeded (see the vault_notes reference pattern) -- either add that proof or migrate this read to fetchAllRanged/fetchAllKeyset.",
    },
  },
  create(context) {
    const sourceCode = context.getSourceCode();

    function resolvesToImportedHelper(node, helperName) {
      // Resolve `node` (an Identifier used as a call callee) through scope
      // analysis to its actual binding, and check that binding is an
      // ImportSpecifier importing `helperName` from the approved module path
      // -- NOT a text/name match. A local `function fetchAllKeyset() {}` or
      // `const fetchAllKeyset = ...` in the same file resolves to a different
      // binding (a FunctionDeclaration/VariableDeclarator, not an
      // ImportSpecifier) and returns false here.
      const scope = context.getScope();
      const variable = findVariable(scope, node.name);
      if (!variable || variable.defs.length !== 1) return false;
      const def = variable.defs[0];
      if (def.type !== 'ImportBinding') return false;
      const importDecl = def.parent;
      const approved = APPROVED_HELPERS[helperName];
      return (
        def.node.imported?.name === helperName &&
        importDecl.source.value === approved.module
      );
    }

    function findVariable(scope, name) {
      while (scope) {
        const v = scope.variables.find((x) => x.name === name);
        if (v) return v;
        scope = scope.upper;
      }
      return null;
    }

    function getLiteralTableName(fromCall) {
      const arg = fromCall.arguments[0];
      return arg && arg.type === 'Literal' && typeof arg.value === 'string' ? arg.value : null;
    }

    return {
      // Case A: fetchAllKeyset(...) / fetchAllRanged(...) direct calls.
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && APPROVED_HELPERS[node.callee.name]) {
          if (!resolvesToImportedHelper(node.callee, node.callee.name)) {
            context.report({
              node,
              messageId: 'unapprovedHelperBinding',
              data: { name: node.callee.name, module: APPROVED_HELPERS[node.callee.name].module },
            });
          }
          return; // valid Shape 4/5 call (or already reported) -- nothing else to check
        }

        // Case B: a chain rooted at sb.from(...).
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.property.name === 'from' &&
          node.callee.object.name /* heuristic: matches the project's `sb` client identifier */
        ) {
          const table = getLiteralTableName(node);
          if (table === null) {
            context.report({ node, messageId: 'dynamicTable' });
            return;
          }
          // R1: this rule only ever reaches here by starting from a
          // `sb.from(...)` CallExpression that is itself the `.object` of an
          // outer MemberExpression (walked below) -- it never starts from an
          // Identifier reference, so an assigned-then-reused builder is
          // structurally invisible to this branch and therefore never
          // classified as any approved shape; a separate check (below) flags
          // the assignment itself so the rejection is explicit rather than silent.
          checkChainShape(node, table);
        }
      },

      // Flags `const q = sb.from(...)...` assignments directly, so the
      // rejection is an explicit, actionable lint error rather than the
      // query simply never matching a shape with no clear reason why.
      VariableDeclarator(node) {
        if (
          node.init &&
          isSupabaseBuilderChain(node.init)
        ) {
          const table = findRootTableName(node.init);
          context.report({ node, messageId: 'assignedBuilder', data: { table: table || '(unknown)' } });
        }
      },
    };

    // checkChainShape / isSupabaseBuilderChain / findRootTableName: walk the
    // MemberExpression/CallExpression chain upward from `node` to its
    // outermost call, collecting method names and argument shapes in order,
    // then match against the five read shapes + Shape 6 (write) exactly as
    // specified in section 3. Full implementation intentionally omitted from
    // this proposal -- the chain-walking and options-object literal-shape
    // logic can reuse portfolio-preflight.js's existing, already-adversarially-
    // tested `collectChainedCalls()`, `propertyKeyName()`, and
    // `resolvesToHeadTrue()` almost verbatim, since those functions already do
    // the "read a real call chain and its literal option shapes off the AST"
    // work this rule also needs -- only the accept/reject policy differs
    // (allowlist-and-match here vs. detect-known-bad-shapes there).
  },
};
```

This draft is deliberately not a finished, mergeable rule — the chain-walking helpers it calls out (`checkChainShape`, `isSupabaseBuilderChain`, `findRootTableName`) are left as stubs pointing at the existing, already-hardened AST-walking code in `portfolio-preflight.js` that should be extracted and shared rather than rewritten. The point of including it here is to show Codex the actual enforcement mechanism (scope-based import resolution for R4, structural rejection for R1/R2, chain-position matching for R3) rather than just describing it in prose.

## 6. Migration sequencing (proposed, not started)

1. Add `fetchAllRanged()` to `agents/lib/supabase-pagination.js` (section 4) — new code, no existing call site touched yet.
2. Migrate the four offset-pagination call sites in `portfolio-dossier.js` and the three in `signal-normalize.js` onto `fetchAllRanged()`, one file at a time, each verified against its existing test coverage before moving to the next.
3. Resolve the four `.limit(1000)`/`.limit(2000)` sites flagged in section 2 — either onto `fetchAllRanged()` or with a `vault_notes`-style runtime-proven bound, decided per table by whoever owns the actual row-growth expectations for each (this is a product/data decision, not just a mechanical rewrite).
4. Resolve `nfl_trench_ratings` (the new finding) the same way.
5. Only once 1–4 are done and re-verified: build the real ESLint rule from this draft, wire it into `.eslintrc`, and only then retire the corresponding pattern-matching logic in `portfolio-preflight.js`'s scanner (the two should run in parallel for at least one full round so a regression in the new rule doesn't silently remove coverage the old scanner had).

No step in this sequence has been started. This document is the scope for Codex to confirm or redirect before 1 begins.

## 7. Standing constraints (unchanged)

Same as every round this session: no commits, cleanup, reset, stash, broad staging, or push without Andy's explicit approval; no Supabase writes without per-write authorization; no paid committee synthesis without explicit authorization; no betting picks/official-pick promotions/portfolio mutations without explicit authorization; no Yahoo Fantasy work. This document itself makes no code changes — `agents/lib/supabase-pagination.js`, `agents/portfolio-dossier.js`, `agents/signal-normalize.js`, and `agents/portfolio-synthesize.js` are all unmodified.
