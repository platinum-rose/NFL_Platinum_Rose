// agents/lib/row-reduction.js
// ═══════════════════════════════════════════════════════════════════════════════
// Round 9 v8 "best row per key" reduction rule, extracted so it is directly
// unit-testable (portfolio-dossier.js is a top-level script with no exports).
//
// Rule, in order:
//   1. parse both timestamps;
//   2. if exactly one side is null/invalid, the valid side wins;
//   3. if both valid and unequal, the numerically better one wins;
//   4. if both valid-and-equal OR both null/invalid, fall through to the
//      table's declared secondary key ("id" -- descending for latest-row
//      reducers, ascending for the one earliest-row reducer,
//      fetchGameOddsOpen()).
// When the secondary key itself is unusable (missing on either side), this
// throws by default -- a tie/double-invalid with no usable tiebreaker is a
// contract violation for a query that is supposed to select it. Pass
// allowMissingSecondaryKey: true only for a row source that has no primary
// key by design (e.g. a locally-generated fallback file), in which case the
// incumbent is kept rather than guessing.
// ═══════════════════════════════════════════════════════════════════════════════

export function isBetterRow(candidate, incumbent, { tsField, idField, direction, allowMissingSecondaryKey = false }) {
  if (!incumbent) return true;
  const parse = (r) => { const t = Date.parse(r?.[tsField]); return Number.isFinite(t) ? t : null; };
  const cTs = parse(candidate);
  const iTs = parse(incumbent);
  if (cTs !== null && iTs === null) return true;
  if (cTs === null && iTs !== null) return false;
  if (cTs !== null && iTs !== null && cTs !== iTs) {
    return direction === 'latest' ? cTs > iTs : cTs < iTs;
  }
  const cId = candidate?.[idField];
  const iId = incumbent?.[idField];
  if (cId == null || iId == null) {
    // 2026-09-10 fix (Phase 2 review finding #3): the finalized v7 rule has no
    // first-seen branch -- a tie or double-invalid timestamp always falls
    // through to the secondary key. All six database call sites this module
    // now serves add "id" to their own select(), so a missing id there is a
    // genuine contract violation and should fail loud, not silently resurrect
    // delivery-order dependence. The one legitimate exception is a row source
    // that was never going to have a real PK by design (e.g. locally-generated
    // fallback-file rows) -- those callers must opt in explicitly.
    if (allowMissingSecondaryKey) return false;
    throw new Error(`isBetterRow: secondary key "${idField}" is missing on the candidate or incumbent row for a tied/invalid-timestamp comparison -- add "${idField}" to this query's select(), or pass allowMissingSecondaryKey: true if this row source genuinely has no primary key by design`);
  }
  return direction === 'latest' ? cId > iId : cId < iId;
}

// Reduce `rows` to one "best" row per team nickname (via normalizeTeamFn),
// then map each survivor through mapRow. tsField/idField/direction feed
// isBetterRow() above; default is the common "latest wins" case.
export function latestByTeam(rows, mapRow, normalizeTeamFn, { tsField = 'snapshot_at', idField = 'id', allowMissingSecondaryKey = false } = {}) {
  const bestRaw = {};
  for (const r of rows || []) {
    const nick = normalizeTeamFn(r.team);
    if (!nick) continue;
    if (isBetterRow(r, bestRaw[nick], { tsField, idField, direction: 'latest', allowMissingSecondaryKey })) {
      bestRaw[nick] = r;
    }
  }
  const out = {};
  for (const [nick, r] of Object.entries(bestRaw)) out[nick] = mapRow(r);
  return out;
}
