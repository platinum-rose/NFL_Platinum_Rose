// agents/lib/supabase-pagination.js
// Shared keyset/cursor pagination helper for Supabase reads on a table that
// has grown (or could grow) past PostgREST's silent 1000-row unpaginated cap.
//
// 2026-09-09 (Codex review, P2 -- "the scanner recognizes keyset syntax
// without proving pagination"): agents/portfolio-preflight.js's rowcap
// scanner previously judged a call site "safely keyset-paginated" purely by
// structural pattern-matching -- `.order(col)` + `.gt(col, ...)` +
// `.limit(...)` all present in one statement -- which a one-shot query with
// those three calls but NO loop and NO advancing cursor would also match,
// making that pattern fail-open. The durable fix Codex recommended: a
// shared helper the scanner recognizes EXPLICITLY BY NAME, the same way it
// already trusts `fetchAllPaged` (portfolio-dossier.js) for offset
// pagination -- calling this function is what actually proves iteration,
// not a structural guess about the query shape.
//
// 2026-09-09 revision (Codex round-2 review, same P2 finding, flagged
// again): the original version accepted an unconstrained `buildQuery`
// callback that built the ENTIRE query, ordering/cursor-filter/limit
// included. Codex found two real problems with that:
//   (1) the scanner's "is this .from() call wrapped in fetchAllKeyset"
//       check was pure text proximity (does the string "fetchAllKeyset"
//       appear somewhere in the preceding N characters) -- spoofable by a
//       stray comment, or by an unrelated already-closed fetchAllKeyset()
//       call earlier in the file.
//   (2) even a GENUINE wrapper call could still get pagination wrong --
//       ignore the cursor, omit `.order()`, or filter on a non-unique
//       column -- since fetchAllKeyset() itself never validated any of
//       that; it just awaited whatever buildQuery() handed back.
// Fixed both by taking ownership of the actual pagination clauses here
// instead of delegating them to the caller: this helper now builds
// `.order(cursorColumn, {ascending: true}).gt(cursorColumn, cursor ?? '')
// .limit(pageSize)` itself, every call, unconditionally. The caller
// supplies only `table`, `select`, and an optional `applyFilters(query)`
// for base WHERE-clause-style filters (`.like()`, `.not()`, `.eq()`, etc)
// -- it has no way to touch ordering, the cursor filter, or the limit, so
// there is no "genuine wrapper that gets it wrong" case left to worry
// about. This also makes the scanner-side detection strictly easier and
// more honest (see portfolio-preflight.js's isLexicallyInsideCall()): a
// caller's own source no longer contains `.order()/.gt()/.limit()` calls
// at all, because this file's `sb.from(table)` uses a variable table name,
// which the scanner's literal-string `.from('...')` matcher does not even
// register as a call site to classify.
export async function fetchAllKeyset(label, { sb, table, select, cursorColumn, pageSize, applyFilters }) {
  if (!pageSize || pageSize <= 0) throw new Error(`fetchAllKeyset(${label}): pageSize must be a positive number`);
  if (!table || !select || !cursorColumn || !sb) {
    throw new Error(`fetchAllKeyset(${label}): sb, table, select, and cursorColumn are all required`);
  }
  const rows = [];
  let cursor = null;
  for (;;) {
    let query = sb.from(table).select(select);
    if (applyFilters) query = applyFilters(query);
    // Ownership of ordering, the cursor filter, and the limit lives here,
    // not in the caller -- see the 2026-09-09 revision note above.
    query = query
      .order(cursorColumn, { ascending: true })
      .gt(cursorColumn, cursor ?? '') // '' sorts before every real (non-empty) key, so the first page (cursor still null) matches everything, identical to no filter at all
      .limit(pageSize);
    const { data, error } = await query;
    if (error) throw new Error(`${label}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    const last = data[data.length - 1];
    const nextCursor = last?.[cursorColumn];
    if (nextCursor == null) {
      // A page came back full (== pageSize) but its last row has no value
      // for the cursor column -- advancing would either loop forever on
      // the same page or silently drop rows. Fail loud rather than either.
      throw new Error(`${label}: keyset cursor column "${cursorColumn}" is null/missing on the last row of a full page -- cannot safely advance`);
    }
    cursor = nextCursor;
  }
  return rows;
}
