// agents/lib/scope-enforcement.js
//
// Two-layer scope enforcement for the frozen pre-kickoff Make-the-Playoffs /
// Win-Totals-only synthesis run (rev 8-19 design review, Codex-approved;
// hardened rev-20-review and rev-21-review, Codex CHANGES REQUESTED
// findings addressed 2026-09-12). This run is scoped to ONLY the 'wins' and
// 'playoffs' markets for all 32 teams -- every other market (superbowl,
// superbowl_matchup, conference_afc, conference_nfc, division_*, most_wins,
// least_wins) and every scenario-book structure (hedge baskets, parlay
// ladders, portfolio strategy, scenario_review, Week-1 correlation/pairing)
// is out of scope for this specific run and must never reach the final
// report or persistence.
//
// Structural vs lexical enforcement (standing design principle since rev 8):
// enforce that prohibited keys/objects/non-scope markets are STRUCTURALLY
// absent. Do NOT attempt recursive prose/keyword scanning of free-text
// fields for incidental words appearing naturally -- a thesis that happens
// to mention "hedge" in prose is not itself in-scope evidence of a
// violation.
//
// Layer 1 -- early quarantine, immediately after each model's Stage-1
// response is parsed, BEFORE assignment into byModel. Two schema-validation
// passes followed by three cleanup operations, in order, on a NEW
// deep-cleaned object (never mutates the input):
//   (0) schema/type rejection -- throws (inside the CLI's existing per-model
//       try/catch), never a silent return of an empty/default shape, and
//       never a silent per-row drop. A malformed recommendation/watch row
//       fails this model's ENTIRE Stage-1 response for this run, the same
//       as a JSON-parse failure would. rev-21-review P1 fix (finding #3):
//       previously only market/type/edge_type/timing.action were type-
//       checked -- every other contract field (selection, book, price,
//       model_fair_prob, edge_pct, confidence, stake_tier, knowledge_based,
//       market_view, football_view, thesis, disconfirming_factor,
//       bet_threshold, needs_human_review, evidence_ids, sources, and each
//       timing.* sub-field) now gets the same "must be the right type when
//       present" treatment, so an object-valued `selection` or a string-
//       valued `confidence` fails closed instead of silently reaching
//       downstream code that assumes the documented shape.
//   (1) whole-row removal for an out-of-scope market, a forbidden pick type
//       (checked on BOTH `type` and `edge_type`), or a forbidden timing
//       action -- applied to BOTH recommendations AND watch rows.
//   (2) top-level scenario-collection removal (hedge_baskets/parlay_ladders/
//       portfolio_strategy/scenario_review/correlated_week1) without
//       discarding sibling valid recommendations or watch entries.
//   (3) per-recommendation AND per-watch-row prohibited-key removal (e.g.
//       correlated_week1) WITHOUT discarding the candidate itself.
// Quarantine counts AND per-row reasons (rev-21-review P1 fix, finding #3:
// the diagnostic was previously aggregate-count-only -- "recommendations_
// removed: 3" with no way to see WHICH 3 rows or WHY) are attached to the
// cleaned object as `__quarantine` so the CLI can log and persist exactly
// what quarantine removed and why.
//
// Layer 2 -- final assertion, placed at the exact gap between
// `buildWatchlistReview()` and `rankByAxis()` in the CLI, AND (rev-21-review
// P1 fix, finding #4) a second call immediately before the CLI writes
// `.raw.json`, checking the ACTUAL assembled report-facing payload object
// (everything the CLI is about to persist except audit_raw_unsanitized) --
// not a hand-picked subset assembled earlier that predates
// sportsbook_promotions/human_watchlist/official_proposal_inbox existing.
// Both calls throw a descriptive, path-reporting Error (caught by the
// existing top-level `.catch()`) if anything out-of-scope survived
// quarantine/committee/validation/promotions/watchlist/proposal export. The
// one thing this deliberately does NOT walk is `audit_raw_unsanitized` (the
// untouched raw model-call text/JSON), which the CLI must exclude from what
// it passes in -- that raw text may legitimately contain any word or field
// by pure coincidence of a model's own vocabulary and is never itself
// report-facing, so scanning it would be trivially exploitable in the other
// direction (a model could invent any container name) and would wrongly
// flag legitimate raw text.

export const ALLOWED_MARKETS = new Set(['wins', 'playoffs']);
export const FORBIDDEN_TYPES = new Set(['hedge']);
export const FORBIDDEN_TIMING_ACTIONS = new Set(['pair']);
export const SCENARIO_TOP_LEVEL_KEYS = ['hedge_baskets', 'parlay_ladders', 'portfolio_strategy', 'scenario_review', 'correlated_week1'];
export const PER_RECOMMENDATION_PROHIBITED_KEYS = ['correlated_week1'];
// The complete set of structurally-forbidden keys the final recursive
// assertion rejects wherever they appear in the derived-output tree,
// regardless of value -- PRESENCE of the key is the violation, not a truthy
// value.
export const STRUCTURAL_FORBIDDEN_KEYS = new Set([
  'hedge_baskets', 'parlay_ladders', 'portfolio_strategy', 'scenario_review', 'correlated_week1',
]);
// rev-23-followup3 fix (Codex finding #2): STRUCTURAL_FORBIDDEN_KEYS only
// catches a forbidden container by its exact literal key name -- a rename
// (correlated_week1 -> correlated_positions) previously bypassed it
// entirely, a gap this file's own tests used to document as "accepted"
// rather than close. Codex's rev-23-followup3 review requires closing it,
// not merely disclosing it: every KNOWN rename of a structurally-forbidden
// key is enumerated here and rejected the same way. This is NOT a claim
// that every future rename is caught automatically -- see the file header
// on the lexical-vs-structural limitation -- only that every alias this
// engagement has actually discovered is now closed.
export const KNOWN_SCOPE_ALIASES = new Set(['correlated_positions']);
// rev-23-followup3 fix (Codex finding #2): a bare STRING reference inside
// `evidence_ids` naming an evidence root this run's scoped dossier never
// contains (e.g. "prediction_markets.playoff_prob") is itself a scope leak
// even though it is not a forbidden container -- it is a citation into
// data that cannot legitimately exist in a scoped run's input, so its mere
// presence in a report-facing evidence_ids array means either a
// hallucinated citation or a genuine leak upstream. Checked against the
// FIRST dot-delimited path segment (the root), not a substring match.
// rev-23-followup4 fix (Codex finding #4): the scoped dossier
// (agents/lib/scoped-dossier.js's SCOPED_TEAM_PROFILE_KEYS) never carries
// 'vault_analytical_reads'/'master_reports' (Tier 3) or
// 'training_camp_intel' (Tier 4), and the scoped dossier builder also never
// copies the top-level 'adjacent_signals' field -- every one of these is a
// removed lane for this run, not just prediction_markets, so a report-facing
// evidence_ids citation into any of them is the same class of leak/
// hallucination as a prediction_markets citation and must be rejected the
// same way.
export const EXCLUDED_EVIDENCE_ROOTS = new Set([
  'prediction_markets', 'vault_analytical_reads', 'master_reports', 'training_camp_intel', 'adjacent_signals',
]);

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function assertRequiredString(row, field, where) {
  if (typeof row[field] !== 'string' || !row[field]) {
    throw new Error(`quarantineStage1: ${where}.${field} is missing or not a non-empty string (got ${JSON.stringify(row[field])})`);
  }
}
function assertRequiredNumber(row, field, where) {
  if (typeof row[field] !== 'number' || !Number.isFinite(row[field])) {
    throw new Error(`quarantineStage1: ${where}.${field} is missing or not a finite number (got ${JSON.stringify(row[field])})`);
  }
}
function assertRequiredBoolean(row, field, where) {
  if (typeof row[field] !== 'boolean') {
    throw new Error(`quarantineStage1: ${where}.${field} is missing or not a boolean (got ${typeof row[field]})`);
  }
}
function assertRequiredStringArray(row, field, where) {
  if (!Array.isArray(row[field]) || row[field].some((v) => typeof v !== 'string')) {
    throw new Error(`quarantineStage1: ${where}.${field} is missing or not an array of strings (got ${JSON.stringify(row[field])})`);
  }
}

// rev-22-review P2 fix (finding #3): rev-21's version type-checked every
// field ONLY when present, leaving every field but `market` optional --
// Codex found a bare `{ "market": "wins" }` recommendation survived
// quarantine untouched, which is not what "full-contract validation"
// claimed. Every field in the documented Stage-1 recommendation contract
// (agents/lib/scoped-prompts.js's buildScopedSystemPrompt() JSON shape,
// mirrored by the unscoped SYSTEM_PROMPT) is now REQUIRED and type-checked
// -- a model that omits one fails this candidate's schema check the same
// way a wrong-typed field always has. `entry_plan` remains genuinely
// optional -- it is not part of the Stage-1 contract at all; only the
// Risk/Editor stage ever adds it, downstream of this quarantine.
const STRING_FIELDS_RECOMMENDATION = [
  'selection', 'type', 'edge_type', 'book', 'stake_tier', 'market_view',
  'football_view', 'thesis', 'disconfirming_factor', 'bet_threshold',
];
const NUMBER_FIELDS_RECOMMENDATION = ['price', 'model_fair_prob', 'edge_pct', 'confidence'];
const BOOLEAN_FIELDS_RECOMMENDATION = ['knowledge_based', 'needs_human_review'];
const STRING_ARRAY_FIELDS_RECOMMENDATION = ['evidence_ids', 'sources'];
const STRING_FIELDS_WATCH = ['selection', 'why'];
const TIMING_STRING_FIELDS = ['action', 'trigger', 'expected_move', 'rationale'];

// Schema/type validation for one recommendation or watch row -- layer 1 op
// (0). Throws with a descriptive reason on ANY structural violation; the
// caller (quarantineStage1) runs this over every row BEFORE any content
// filtering, so a malformed row fails the whole parsed response rather than
// being silently filtered or silently accepted. Every documented contract
// field is REQUIRED and type-checked (rev-22-review fix -- see above).
function assertRowSchema(row, kind, index) {
  const where = `${kind}[${index}]`;
  if (!isPlainObject(row)) {
    throw new Error(`quarantineStage1: ${where} is not a plain object (got ${row === null ? 'null' : Array.isArray(row) ? 'array' : typeof row})`);
  }
  if (typeof row.market !== 'string' || !row.market) {
    throw new Error(`quarantineStage1: ${where}.market is missing or not a non-empty string (got ${JSON.stringify(row.market)})`);
  }

  if (kind === 'recommendations') {
    for (const field of STRING_FIELDS_RECOMMENDATION) assertRequiredString(row, field, where);
    for (const field of NUMBER_FIELDS_RECOMMENDATION) assertRequiredNumber(row, field, where);
    for (const field of BOOLEAN_FIELDS_RECOMMENDATION) assertRequiredBoolean(row, field, where);
    for (const field of STRING_ARRAY_FIELDS_RECOMMENDATION) assertRequiredStringArray(row, field, where);
    if (!isPlainObject(row.timing)) {
      throw new Error(`quarantineStage1: ${where}.timing is missing or not an object (got ${row.timing === undefined ? 'undefined' : Array.isArray(row.timing) ? 'array' : typeof row.timing})`);
    }
    for (const field of TIMING_STRING_FIELDS) assertRequiredString(row.timing, field, `${where}.timing`);
  } else {
    for (const field of STRING_FIELDS_WATCH) assertRequiredString(row, field, where);
    assertOptionalScopeFields(row, where);
  }
}

// Content-scope check -- layer 1 op (1). Only ever called on a row that has
// already passed assertRowSchema, so market/type/edge_type/timing.action
// are known to be strings (or absent) here. Returns the violation reason
// string, or null when the row is in scope (rev-21-review P1 fix, finding
// #3: previously a bare boolean, so quarantineStage1 could only report
// COUNTS removed, never WHY any specific row was removed).
function scopeViolationReason(row) {
  const market = row.market.toLowerCase();
  if (!ALLOWED_MARKETS.has(market)) return `out-of-scope market "${row.market}"`;
  const type = String(row.type || '').toLowerCase();
  if (type && FORBIDDEN_TYPES.has(type)) return `forbidden type "${row.type}"`;
  const edgeType = String(row.edge_type || '').toLowerCase();
  if (edgeType && FORBIDDEN_TYPES.has(edgeType)) return `forbidden edge_type "${row.edge_type}"`;
  const action = String(row.timing?.action || '').toLowerCase();
  if (action && FORBIDDEN_TIMING_ACTIONS.has(action)) return `forbidden timing.action "${row.timing.action}"`;
  return null;
}

// rev-23-followup3 fix (Codex finding #3): watch rows previously only had
// `selection`/`why` type-checked -- `type`, `edge_type`, and `timing`
// (specifically `timing.action`) are recognized on ANY row by
// scopeViolationReason() below (it reads row.type/row.edge_type/
// row.timing?.action generically, regardless of `kind`), so an in-scope
// watch row carrying an object-valued `type`, a numeric `edge_type`, or an
// object-valued `timing.action` previously reached scopeViolationReason()
// with a value that silently coerced to the string "[object Object]" via
// `String(row.type || '')` and simply never matched a forbidden value --
// it did NOT throw, and did NOT get removed; it survived quarantine and
// the final assertion unchanged. These three fields are OPTIONAL on a
// watch row (the documented watch contract is market/selection/why only),
// but per the "full-contract validation" standard already applied to
// recommendations (rev-22-review), any of them that IS present must be
// well-typed or the whole Stage-1 response fails closed -- never silently
// coerced, silently dropped, or silently passed through.
function assertOptionalScopeFields(row, where) {
  if (row.type !== undefined) assertRequiredString(row, 'type', where);
  if (row.edge_type !== undefined) assertRequiredString(row, 'edge_type', where);
  if (row.timing !== undefined) {
    if (!isPlainObject(row.timing)) {
      throw new Error(`quarantineStage1: ${where}.timing is present but not an object (got ${Array.isArray(row.timing) ? 'array' : typeof row.timing})`);
    }
    if (row.timing.action !== undefined) assertRequiredString(row.timing, 'action', `${where}.timing`);
  }
}

// rev-23-followup3 fix (Codex finding #3): stripProhibitedKeys() previously
// returned `{ ...row }` -- a SHALLOW copy. Every nested object/array field
// (timing, evidence_ids, sources, entry_plan, ...) still pointed at the
// exact same object instances as the original parsed-JSON input, so any
// later in-place mutation of a cleaned/returned row's nested field (by
// this file or any downstream consumer) would silently mutate the raw
// parsed input too, and vice versa. A full recursive deep clone (safe here
// because every row is itself the product of JSON.parse -- no functions,
// Dates, Maps, or cycles can be present) removes this sharing entirely.
function deepClonePlain(value) {
  if (Array.isArray(value)) return value.map(deepClonePlain);
  if (isPlainObject(value)) {
    const out = {};
    for (const [key, v] of Object.entries(value)) out[key] = deepClonePlain(v);
    return out;
  }
  return value;
}

function stripProhibitedKeys(row) {
  if (!row || typeof row !== 'object') return row;
  const clean = deepClonePlain(row);
  for (const key of PER_RECOMMENDATION_PROHIBITED_KEYS) delete clean[key];
  return clean;
}

// Pure. Throws on any schema violation (op 0); returns a NEW object for
// everything else. The returned object carries a `__quarantine` diagnostic
// field (never itself scope-sensitive) so the CLI can log and persist what
// quarantine actually removed and why, per-row.
export function quarantineStage1(parsed) {
  if (!isPlainObject(parsed)) {
    throw new Error(`quarantineStage1: expected a parsed Stage-1 object, got ${parsed === null ? 'null' : Array.isArray(parsed) ? 'array' : typeof parsed}`);
  }
  // rev-23-followup4 fix (Codex finding #1): "recommendations"/"watch" were
  // previously only type-checked WHEN PRESENT -- a literal `{}` response (no
  // recommendations, no watch, no portfolio_notes at all) satisfied both
  // "when present" checks vacuously and fell straight through to become a
  // successful, empty Stage-1 model result instead of failing this attempt.
  // A genuine, contract-following Stage-1 response always carries both
  // arrays (even if empty) and a non-empty portfolio_notes string -- all
  // three are now unconditionally required, matching the full-contract
  // standard already applied to individual recommendation/watch rows.
  if (!Array.isArray(parsed.recommendations)) {
    throw new Error(`quarantineStage1: "recommendations" is missing or not an array (got ${parsed.recommendations === undefined ? 'undefined' : Array.isArray(parsed.recommendations) ? 'array' : typeof parsed.recommendations})`);
  }
  if (!Array.isArray(parsed.watch)) {
    throw new Error(`quarantineStage1: "watch" is missing or not an array (got ${parsed.watch === undefined ? 'undefined' : Array.isArray(parsed.watch) ? 'array' : typeof parsed.watch})`);
  }
  if (typeof parsed.portfolio_notes !== 'string' || !parsed.portfolio_notes) {
    throw new Error(`quarantineStage1: "portfolio_notes" is missing or not a non-empty string (got ${JSON.stringify(parsed.portfolio_notes)})`);
  }

  const rawRecommendations = parsed.recommendations;
  const rawWatch = parsed.watch;
  rawRecommendations.forEach((row, i) => assertRowSchema(row, 'recommendations', i));
  rawWatch.forEach((row, i) => assertRowSchema(row, 'watch', i));

  // rev-23-followup4 fix (Codex finding #7): `{ ...parsed }` is only a
  // SHALLOW copy of the top level -- any top-level field this function
  // doesn't recognize and doesn't explicitly overwrite below (an
  // unrecognized nested object/array the model included) still pointed at
  // the exact same object/array instance as the original parsed input.
  // stripProhibitedKeys()/deepClonePlain() already close this gap for
  // recommendation/watch ROWS (rev-23-followup3); this closes it for the
  // TOP-LEVEL object itself, so the returned `cleaned` object never shares
  // any nested reference with `parsed`, recognized or not.
  const cleaned = deepClonePlain(parsed);
  const removedTopLevelKeys = [];
  for (const key of SCENARIO_TOP_LEVEL_KEYS) {
    if (Object.prototype.hasOwnProperty.call(cleaned, key)) removedTopLevelKeys.push(key);
    delete cleaned[key];
  }

  const recommendationRemovals = [];
  const inScopeRecommendations = rawRecommendations.filter((row, i) => {
    const reason = scopeViolationReason(row);
    if (reason === null) return true;
    recommendationRemovals.push({ index: i, market: row.market, selection: row.selection ?? null, reason });
    return false;
  });
  const watchRemovals = [];
  const inScopeWatch = rawWatch.filter((row, i) => {
    const reason = scopeViolationReason(row);
    if (reason === null) return true;
    watchRemovals.push({ index: i, market: row.market, selection: row.selection ?? null, reason });
    return false;
  });
  const recommendations = inScopeRecommendations.map(stripProhibitedKeys);
  const watch = inScopeWatch.map(stripProhibitedKeys);

  cleaned.recommendations = recommendations;
  cleaned.watch = watch;
  cleaned.__quarantine = {
    removed_top_level_keys: removedTopLevelKeys,
    recommendations_seen: rawRecommendations.length,
    recommendations_removed: recommendationRemovals.length,
    recommendations_removed_detail: recommendationRemovals,
    watch_seen: rawWatch.length,
    watch_removed: watchRemovals.length,
    watch_removed_detail: watchRemovals,
  };
  return cleaned;
}

// Pure. Throws a descriptive, path-reporting Error on the first violation
// found anywhere in the tree; returns undefined (void) when `root` is
// clean. `root` should be the complete assembled derived-output object the
// caller intends to report/persist, EXCLUDING `audit_raw_unsanitized` (see
// file header). Safe to call on any plain object/array tree -- primitives
// are ignored, and a shared/cyclic reference is only visited once.
export function assertScopeClean(root) {
  const seen = new Set();
  function walk(node, path) {
    if (node === null || typeof node !== 'object') return;
    if (seen.has(node)) return;
    seen.add(node);

    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${path}[${i}]`));
      return;
    }

    for (const key of STRUCTURAL_FORBIDDEN_KEYS) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        throw new Error(`Scope assertion failed at ${path}: forbidden key "${key}" is present (value: ${JSON.stringify(node[key])}). A suppressed run must omit this key entirely, not merely null/empty it.`);
      }
    }
    // rev-23-followup3 fix (Codex finding #2): reject known renamed
    // aliases of a forbidden container the same way -- presence, not
    // value, is the violation. The `audit_raw_unsanitized` exemption is
    // unchanged: it is enforced by the CALLER excluding that subtree from
    // `root` before calling this function (see file header), not by any
    // special-case inside this walk.
    for (const key of KNOWN_SCOPE_ALIASES) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        throw new Error(`Scope assertion failed at ${path}: forbidden key "${key}" is present (value: ${JSON.stringify(node[key])}) -- this is a known renamed alias of a structurally-forbidden container (see KNOWN_SCOPE_ALIASES). A suppressed run must omit this key entirely, not merely rename it.`);
      }
    }
    // rev-23-followup3 fix (Codex finding #2): reject a bare string
    // reference into an excluded evidence root inside `evidence_ids`.
    if (Array.isArray(node.evidence_ids)) {
      for (const evidenceId of node.evidence_ids) {
        if (typeof evidenceId !== 'string') continue;
        const root = evidenceId.split('.')[0];
        if (EXCLUDED_EVIDENCE_ROOTS.has(root)) {
          throw new Error(`Scope assertion failed at ${path}.evidence_ids: references excluded evidence root "${root}" (full reference: ${JSON.stringify(evidenceId)}). This run's scoped dossier never contains data under this root -- the reference must be removed.`);
        }
      }
    }

    if (typeof node.market === 'string') {
      const market = node.market.toLowerCase();
      if (!ALLOWED_MARKETS.has(market)) {
        throw new Error(`Scope assertion failed at ${path}: out-of-scope market "${node.market}". A suppressed run must contain only ${[...ALLOWED_MARKETS].join('/')} candidates.`);
      }
      for (const field of ['type', 'edge_type']) {
        const value = String(node[field] || '').toLowerCase();
        if (value && FORBIDDEN_TYPES.has(value)) {
          throw new Error(`Scope assertion failed at ${path}: forbidden ${field} "${node[field]}".`);
        }
      }
      const action = String(node.timing?.action || '').toLowerCase();
      if (action && FORBIDDEN_TIMING_ACTIONS.has(action)) {
        throw new Error(`Scope assertion failed at ${path}: forbidden timing.action "${node.timing.action}".`);
      }
    }

    // rev-21-review P1 fix (finding #4): a promotion object names its
    // in-scope-ness via promotion.eligible_market.market_type, not a bare
    // `market` field -- walk that shape too so sportsbook_promotions is
    // actually covered by this assertion when the caller includes it in
    // `root` (see the CLI's second assertScopeClean() call, immediately
    // before .raw.json is written).
    if (isPlainObject(node.promotion) && isPlainObject(node.promotion.eligible_market)) {
      const marketType = String(node.promotion.eligible_market.market_type || '').toLowerCase();
      if (marketType && !ALLOWED_MARKETS.has(marketType)) {
        throw new Error(`Scope assertion failed at ${path}.promotion.eligible_market: out-of-scope market_type "${node.promotion.eligible_market.market_type}". A suppressed run must reference only ${[...ALLOWED_MARKETS].join('/')} promotions.`);
      }
    }

    for (const [key, value] of Object.entries(node)) {
      // rev-23-followup4 fix (Codex finding #2): `__quarantine` (attached by
      // quarantineStage1() above) is audit metadata DOCUMENTING content that
      // was already removed for being out of scope -- e.g.
      // recommendations_removed_detail entries carry the ORIGINAL
      // `market`/`reason` of a row that was filtered OUT, precisely so a
      // human can see what got quarantined and why. Walking into it means
      // this same assertion rejects the run for recording that it correctly
      // quarantined an out-of-scope market, which is the opposite of the
      // intended behavior and would make useful audit detail impossible to
      // keep. This skip is scoped to the literal `__quarantine` key only --
      // every real report/proposal-facing sibling (recommendations, watch,
      // candidates, final, ...) is still walked and fully checked; nothing
      // about real candidate scope-checking is weakened.
      if (key === '__quarantine') continue;
      walk(value, `${path}.${key}`);
    }
  }
  walk(root, '$');
}

// Startup invariant -- checked before the dossier read, before any model
// call, before any write (the very first lines of the CLI body). Returns
// { ok: true } or { ok: false, problems: [...] } rather than throwing, so
// the CLI can render it the same way as the existing freshness-preflight
// checks (one console.error line per problem).
// rev-21-review P1 fix (finding #4): suppression also now requires that
// any loaded sportsbook promotions reference only in-scope markets -- the
// CLI's promotions default (betonline-superbowl-futures-promo-2026.json) is
// explicitly Super-Bowl-market content, and nothing previously stopped that
// default (or any other out-of-scope --promotions file) from flowing
// straight into a suppressed run's .raw.json.
export function checkStartupInvariant({ suppressed, noPersist, proposalOutDir, watchlist, disableLiveContextBridges, promotions }) {
  if (!suppressed) return { ok: true, problems: [] };
  const problems = [];
  if (!noPersist) problems.push('suppression requires --no-persist');
  if (!disableLiveContextBridges) problems.push('suppression requires --disable-live-context-bridges (this run is frozen-input; live Supabase-backed context bridges must be off)');
  if (proposalOutDir) problems.push('suppression rejects --proposal-out-dir (fails loudly rather than silently no-opping)');
  const items = watchlist?.items;
  if (!Array.isArray(items)) {
    problems.push('suppression requires a successfully loaded watchlist with an "items" array -- missing, unreadable, or malformed all fail closed');
  } else if (items.length !== 0) {
    problems.push(`suppression requires an EXACTLY EMPTY watchlist "items" array (found ${items.length})`);
  }
  const promoList = promotions?.promotions;
  if (promoList !== undefined && promoList !== null) {
    if (!Array.isArray(promoList)) {
      problems.push('suppression requires promotions to be a successfully loaded { promotions: [...] } shape when present -- malformed fails closed');
    } else {
      const outOfScope = promoList.filter((p) => {
        const marketType = String(p?.promotion?.eligible_market?.market_type || '').toLowerCase();
        return !ALLOWED_MARKETS.has(marketType);
      });
      if (outOfScope.length) {
        const example = outOfScope[0]?.promotion?.eligible_market?.market_type ?? 'unknown';
        problems.push(`suppression requires every loaded promotion's eligible_market.market_type to be ${[...ALLOWED_MARKETS].join('/')} (found ${outOfScope.length} out-of-scope offer(s), e.g. market_type "${example}") -- pass --promotions pointing at an in-scope file, or one that resolves to no offers, under suppression`);
      }
    }
  }
  return problems.length ? { ok: false, problems } : { ok: true, problems: [] };
}
