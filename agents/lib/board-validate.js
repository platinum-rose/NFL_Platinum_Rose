// agents/lib/board-validate.js
// F-33 — mechanical board validator (spec-win-dist-and-coherence-sim.md, §A.5).
//
// Pure functions, no I/O (same convention as agents/lib/win-dist.js). Runs
// against an already-parsed dossier (agents/portfolio-dossier.js's output)
// and a single candidate recommendation object (portfolio-synthesize.js's
// parsed model output shape) and returns a list of violation strings.
//
// Locked decision #3 (annotate-and-keep): this module NEVER mutates or drops
// a candidate. Callers are responsible for stamping the returned violations
// onto the candidate (e.g. `candidate.validation = violations`) and keeping
// it visible — rendered red in HTML — rather than silently dropping it.
//
// This is deliberately additive to, not a replacement for,
// portfolio-synthesize.js's existing validateRecommendationStrict(), which
// already hard-invalidates (drops) candidates with a fabricated market,
// selection, book, price, or a stale quote. board-validate.js covers the
// specific mechanical checks the spec calls out that strict validation does
// not: book-is-bettable, the thin-market/n_books>=3 kill switch (which is
// what mechanically kills most_wins/least_wins cards per the spec), the
// superbowl_matchup sim-price-only policy (locked decision #4), an
// independent recomputed-edge cross-check against the dossier, and (added
// 2026-08-13) a named-player sizing-gate check — see
// docs/FUTURES_ARTICLE_REACQUISITION_AND_GATES_DESIGN_2026-08-13.md §2.

import { NAMED_PLAYER_SIZING_CAP_TIERS } from './named-status-review.js';
import { normalizeTeam } from '../../src/lib/teams.js';

const DEFAULT_BETTABLE_BOOKS = 'bookmaker,betonline,betus,betmgm,caesars,williamhill_us,williamhill,circa,mgm';

// Same env override + default set as portfolio-dossier.js's BETTABLE_BOOKS —
// duplicated intentionally ("code owns math", per this codebase's existing
// convention of small standalone scripts not cross-importing each other).
export function bettableBooks(env = process.env) {
  return new Set(
    (env.BETTABLE_BOOKS || DEFAULT_BETTABLE_BOOKS)
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

// Locked decision #4: superbowl_matchup is sim-price context only, never a
// card, regardless of how many books quote it — same class as thin markets.
export const SIM_PRICE_ONLY_MARKETS = new Set(['superbowl_matchup']);

function normBook(b) {
  return String(b || '').trim().toLowerCase();
}

export function isWinsRow(row) {
  return row?.consensus_line != null;
}

export function sideOfSelection(selection) {
  const s = String(selection || '').toLowerCase();
  if (/\bunder\b/.test(s)) return 'under';
  if (/\bover\b/.test(s)) return 'over';
  return null;
}

// Number of books actually quoting this market/row — the mechanical basis
// for the n_books >= 3 kill switch. Wins rows track over/under n_books
// separately (line_consensus_confidence); other rows carry a flat n_books.
export function nBooksFor(row) {
  if (row == null) return null;
  if (isWinsRow(row)) {
    const over = row.line_consensus_confidence?.over_n_books ?? 0;
    const under = row.line_consensus_confidence?.under_n_books ?? 0;
    return Math.max(over, under);
  }
  if (row.n_books != null) return row.n_books;
  return row.books ? Object.keys(row.books).length : null;
}

/**
 * Finds the dossier synthesis_input row for a candidate's market+selection.
 * Deliberately simpler than portfolio-synthesize.js's own findDossierRow
 * (module-private, not exported) — good enough for the mechanical checks
 * here, which only need *a* matching row, not the full fuzzy-match nuance
 * that function needs for prompt-building.
 */
export function findRow(dossier, candidate) {
  const rows = dossier?.synthesis_input?.[candidate?.market];
  if (!rows?.length) return null;
  const sel = String(candidate?.selection || '').toLowerCase();
  if (!sel) return null;

  if (candidate.market === 'superbowl_matchup') {
    return rows.find((r) => {
      const a = String(r.team_a || '').toLowerCase();
      const b = String(r.team_b || '').toLowerCase();
      return (a && sel.includes(a)) && (b && sel.includes(b));
    }) || null;
  }

  for (const r of rows) {
    const team = String(r.team || r.team_nick || '').toLowerCase();
    if (team && sel.includes(team)) return r;
  }
  return null;
}

/**
 * The book+line+price combo actually quoted in the dossier row for this
 * candidate's book+price. Returns null if no such combo exists.
 *
 * 2026-09-03 fix (Andy, dry-run finding): single-price markets (superbowl,
 * conference_*, division_*, playoffs, superbowl_matchup, ...) never carry a
 * per-book `books` map from portfolio-dossier.js -- only wins-total rows do
 * (`books: v.per_book`, the only `books:` assignment in
 * buildSynthesisInput()'s wins branch; the else/non-wins branch only ever
 * sets `moves`, a move_prob map, never book-level price entries). Before
 * this fix, `!row?.books` short-circuited to null for every non-wins
 * candidate regardless of whether its book/price was real, so
 * `validateBoard()` flagged "no_matching_quote" on essentially every
 * superbowl/conference/division/playoffs pick -- even ones citing the
 * dossier's own real best_book/best_price -- while
 * validateRecommendationStrict() in portfolio-synthesize.js (which checks
 * best_book/best_price directly) correctly did not. Confirmed via a mocked
 * dry run using a real dossier row (Packers to win NFC Championship,
 * 1200@caesars -- the dossier's own current best price) that still tripped
 * this false positive. Added a non-wins branch that checks best_book/
 * best_price directly, same exact-match discipline (PRICE_TOLERANCE = 0 in
 * portfolio-synthesize.js) as the wins branch below and as
 * validateRecommendationStrict()'s own check.
 */
export function quotedComboFor(row, candidate) {
  const bookKey = normBook(candidate?.book);
  if (!bookKey) return null;

  if (isWinsRow(row)) {
    if (!row?.books) return null;
    const entry = row.books[bookKey] ?? row.books[candidate.book];
    if (!entry) return null;
    if (entry.over != null && Number(entry.over) === Number(candidate.price)) {
      return { line: entry.line, price: entry.over, side: 'over', edge_pct: null };
    }
    if (entry.under != null && Number(entry.under) === Number(candidate.price)) {
      return { line: entry.line, price: entry.under, side: 'under', edge_pct: null };
    }
    return null;
  }

  // Non-wins (single-price) row: prefer a per-book `books` map if one is
  // ever present (kept for forward-compatibility, e.g. a future dossier
  // change), otherwise fall back to the row's top-level best_book/
  // best_price -- the only price data these rows actually carry today.
  if (row?.books) {
    const entry = row.books[bookKey] ?? row.books[candidate.book];
    if (entry?.price != null && Number(entry.price) === Number(candidate.price)) {
      return { line: null, price: entry.price, side: null, edge_pct: null };
    }
  }
  if (row?.best_book && normBook(row.best_book) === bookKey && row.best_price != null && Number(row.best_price) === Number(candidate.price)) {
    return { line: null, price: row.best_price, side: null, edge_pct: null };
  }
  return null;
}

/**
 * The dossier's own code-owned edge, in percent, for this candidate — used
 * to cross-check against what the model claimed (candidate.edge_pct).
 * Prefers candidate.code_edge_pct if the caller already ran
 * validateRecommendationStrict() (same units: edgePctFromFair, EV-based
 * percent) — falls back to the win-dist-fitted best_over/under_edge_pct for
 * wins rows when running standalone.
 */
export function recomputedEdgePct(row, candidate) {
  if (candidate?.code_edge_pct != null) return candidate.code_edge_pct;
  if (!row) return null;
  if (isWinsRow(row)) {
    const side = sideOfSelection(candidate?.selection);
    if (side === 'under') return row.best_under_edge_pct ?? null;
    if (side === 'over') return row.best_over_edge_pct ?? null;
  }
  return null;
}

const EDGE_TOLERANCE_PCT = 2;

/**
 * Runs every mechanical check against one candidate and returns a list of
 * violation strings (empty if clean). Never mutates candidate or row.
 */
export function validateBoard(candidate, dossier) {
  const violations = [];
  if (!candidate) return violations;

  const row = findRow(dossier, candidate);
  if (!row) {
    violations.push(`no_dossier_row: no dossier row found for market="${candidate.market}" selection="${candidate.selection}".`);
    return violations; // nothing further to mechanically check without a row
  }

  if (SIM_PRICE_ONLY_MARKETS.has(candidate.market)) {
    violations.push(`sim_price_only_market: "${candidate.market}" is sim-price context only per locked decision #4 and must never be carded as a recommendation.`);
  }

  const nBooks = nBooksFor(row);
  if (nBooks != null && nBooks < 3) {
    violations.push(`thin_market: only ${nBooks} book(s) quote this market/side (< 3 required) — sim.prob is the only fair reference for a thin market, not a placeable card.`);
  }

  const bettable = bettableBooks();
  if (candidate.book && !bettable.has(normBook(candidate.book))) {
    violations.push(`book_not_bettable: "${candidate.book}" is not in BETTABLE_BOOKS — the user cannot place this bet at this book.`);
  }

  let combo = null;
  if (candidate.book && candidate.price != null) {
    combo = quotedComboFor(row, candidate);
    if (!combo) {
      violations.push(`no_matching_quote: no book+line+price combo in the dossier matches ${candidate.price} @ ${candidate.book} for "${candidate.selection}".`);
    }
  }

  const dossierEdgePct = recomputedEdgePct(row, candidate);
  if (dossierEdgePct != null && candidate.edge_pct != null) {
    const diff = Math.abs(Number(dossierEdgePct) - Number(candidate.edge_pct));
    if (diff > EDGE_TOLERANCE_PCT) {
      violations.push(`edge_mismatch: dossier-computed edge is ${dossierEdgePct}%, model claimed ${candidate.edge_pct}% (diff ${Math.round(diff * 100) / 100}pts > ${EDGE_TOLERANCE_PCT}pt tolerance).`);
    }
  }

  violations.push(...namedPlayerSizingViolations(dossier, row, candidate));
  violations.push(...evidenceTierViolations(candidate));

  return violations;
}

/**
 * 2026-08-13: deterministic enforcement for
 * agents/lib/named-status-review.js's computeTeamSizingGates(). A team with
 * an unresolved named-player case (e.g. Connor McGovern's withheld Bills
 * role, Micah Parsons' conflicted Dallas/Green Bay ownership) is stamped
 * team_profiles[team].named_player_sizing_gate by portfolio-dossier.js. This
 * is the piece that makes the gate real rather than a prompt request the
 * model can ignore: any candidate touching a gated team at stake_tier
 * core/standard is flagged here regardless of what the model claimed.
 *
 * teamsForRow() covers both the plain per-team rows (row.team/team_nick) and
 * superbowl_matchup's two-team exact rows (row.team_a/team_b) — a gate on
 * EITHER side of an exacta must still flag it, since a two-leg bet is only
 * as sound as its shakiest leg.
 */
function teamsForRow(row) {
  const teams = [row?.team, row?.team_nick, row?.team_a, row?.team_b]
    .filter(Boolean)
    .map((t) => String(t));
  return [...new Set(teams)];
}

// 2026-08-13 Codex review fix (finding #5): dossier.team_profiles is keyed
// by normalizeTeam()'s canonical nickname (e.g. "Bills") — see
// portfolio-dossier.js's fetchNamedPlayerSizingGates(), which builds byTeam
// the same way. Row team fields can be a raw nickname already (common case,
// cheap exact match), a full name ("Buffalo Bills"), or an abbreviation
// ("BUF"). Try the raw value first, then fall back to the normalized
// nickname, so a row using a full name or abbreviation still triggers the
// gate instead of silently missing it because the raw string never equals
// the profiles key.
function resolveTeamProfile(profiles, rawTeam) {
  if (!rawTeam) return null;
  if (profiles[rawTeam]) return { key: rawTeam, profile: profiles[rawTeam] };
  const nick = normalizeTeam(rawTeam);
  if (nick && profiles[nick]) return { key: nick, profile: profiles[nick] };
  return null;
}

export function namedPlayerSizingViolations(dossier, row, candidate) {
  const violations = [];
  const profiles = dossier?.team_profiles || {};
  const seenKeys = new Set();
  for (const rawTeam of teamsForRow(row)) {
    const resolved = resolveTeamProfile(profiles, rawTeam);
    if (!resolved || seenKeys.has(resolved.key)) continue;
    seenKeys.add(resolved.key);
    const gate = resolved.profile?.named_player_sizing_gate;
    if (!gate?.blocked_full_sleeve) continue;
    const allowedTiers = gate.max_stake_tier_allowed || NAMED_PLAYER_SIZING_CAP_TIERS;
    const tier = String(candidate?.stake_tier || '').toLowerCase();
    if (tier && !allowedTiers.includes(tier)) {
      const players = (gate.players || []).join(', ') || 'an unresolved named-player case';
      violations.push(`named_player_sizing_gate: "${resolved.key}" has an unresolved named-player case (${players}) — stake_tier "${tier}" exceeds the allowed cap (${allowedTiers.join('|')}) until it's resolved.`);
    }
  }
  return violations;
}

/**
 * 2026-09-08 (Andy's guarded-with-enforcement policy, round 2, then
 * corrected round 3 per Codex's second review) -- classifies an
 * evidence_id (a dot-path pointer like 'analytics.off_epa_rank',
 * 'vault_analytical_reads.some_key', 'lean.samples[0].who') into the
 * SYSTEM_PROMPT SOURCE HIERARCHY's four tiers, keyed off the path's first
 * segment.
 *
 * Round 2 defaulted anything unmatched to Tier 1 ("general class of
 * structured/computed dossier evidence"). Codex's second review flagged
 * this as fail-open: historical raw.json outputs contain many evidence_id
 * shapes this narrow denylist doesn't recognize (market-row prefixes like
 * 'wins.*'/'division_*.*'/'conference_*.*', 'dossier.team_profiles.*',
 * 'team_profiles.*', 'bettorday_trench', etc.) -- under the round-2
 * default, all of those silently counted as Tier 1 "qualifying" grounding,
 * which is exactly backwards for a guarded policy: an ID we don't
 * recognize should never count as strong evidence.
 *
 * Round 3 fix: explicit Tier 1 ALLOWLIST built directly from
 * agents/portfolio-dossier.js's actual row-level and team-profile field
 * names (fair_prob, fair_american, best_price/best_prob, value_gap,
 * book_divergence, n_books, per_book, books, moves, move_prob,
 * consensus_line, line_spread, over/under_fair_prob, best_over/under,
 * best_over/under_edge_pct, line_consensus_confidence, line_value_signal,
 * sim, sim_win_total; profile-level prior, sos, analytics, dvoa,
 * coaching_profile, schedule_context, officiating_context, clv_signal,
 * injuries, player_availability, prediction_markets; top-level roster_churn,
 * adjacent_signals -- note the latter two structurally never resolve via
 * the current evidenceRowFor() merge, a separate pre-existing gap not
 * addressed here, but that just means they can't wrongly count as
 * grounding either). Anything NOT in this allowlist and NOT matched to
 * Tier 2/3/4 returns tier `null` ("unrecognized") rather than defaulting to
 * Tier 1 -- unrecognized IDs are treated as NOT qualifying grounding by
 * hasQualifyingGrounding() below, closing the fail-open gap.
 *
 * Round 4 fix (Codex's final round-3 review, P1 "identity metadata bypasses
 * the grounding gate"): `team` was in this allowlist, but it's the row's
 * own team-name string -- present on essentially every dossier row
 * regardless of whether there's any real analytical support behind a play,
 * so a Tier-3/4-only candidate could cite evidence_id "team" alone and
 * still pass hasQualifyingGrounding() at core/unflagged. Removed `team`,
 * and (per Codex's instruction to "review other locator/display-only roots
 * under the same substantive-evidence rule") also removed `best_book`,
 * `best_over_book`, `best_under_book` -- these are book-name labels
 * (identifying WHICH sportsbook, e.g. "bookmaker"/"fanduel"), not price or
 * edge data themselves; citing one alone carries no evidentiary weight
 * either, for the same reason `team` didn't. The paired numeric fields
 * that actually carry the signal (`best_price`, `best_over`, `best_under`,
 * `best_prob`, `value_gap`, etc.) remain Tier 1 -- this only removes the
 * identity/locator siblings that add no substance on their own.
 */
const TIER1_FIELD_ROOTS = new Set([
  // market-row fields (agents/portfolio-dossier.js row shape) -- excludes
  // `team`/`best_book`/`best_over_book`/`best_under_book`: identity/locator
  // labels, not substantive evidence on their own (round 4).
  'fair_prob', 'fair_american', 'best_price', 'best_prob',
  'value_gap', 'book_divergence', 'n_books', 'per_book', 'books', 'moves',
  'move_prob', 'consensus_line', 'line_spread', 'over_fair_prob', 'under_fair_prob',
  'best_over', 'best_under',
  'best_over_edge_pct', 'best_under_edge_pct', 'line_consensus_confidence',
  'line_value_signal', 'sim', 'sim_win_total',
  // team-profile fields (agents/portfolio-dossier.js slimTeamProfile keepKeys)
  'prior', 'sos', 'analytics', 'dvoa', 'coaching_profile', 'schedule_context',
  'officiating_context', 'clv_signal', 'injuries', 'player_availability',
  'prediction_markets',
  // top-level dossier maps
  'roster_churn', 'adjacent_signals',
]);
const TIER4_FIELD_PREFIXES = new Set(['training_camp_intel']);
const TIER3_FIELD_PREFIXES = new Set(['vault_analytical_reads', 'master_reports']);
const TIER2_FIELD_PREFIXES = new Set(['experts']);

/**
 * Round 5 fix (2026-09-09, Codex's final cumulative session-close review --
 * P1 "any resolved lean.* field qualifies as Tier 2"). classifyEvidenceTier()
 * used to treat ANY field under the `lean` root -- including bare aggregate
 * counts like `lean.n`, `lean.avg_strength`, `lean.back/fade/over/under` --
 * as Tier 2 ("a specific, dated, directional call"), because it only ever
 * looked at the path's first segment. Codex reproduced a core/unreviewed
 * candidate grounded ONLY by `lean.n = 1` passing as qualifying evidence --
 * a tally is not a named call. Only a citation of an actual sample entry
 * (`lean.samples[...]`, which resolves to a specific { who, dir, strength,
 * why } record) counts as Tier 2 now; the aggregate roll-up fields classify
 * as null (unrecognized / non-qualifying), same fail-closed treatment as
 * round 3's unrecognized-shape fix.
 */
function classifyLeanEvidence(evidenceId) {
  return /^lean\.samples\b/.test(evidenceId) ? 2 : null;
}

/**
 * Round 6 fix (2026-09-09, Codex round-5 review -- P1 "Tier-1 metadata
 * bypass remains open"). Round 5's TIER1_METADATA_LEAF_DENYLIST checked
 * only the `root.child` shape (2 path segments) against a hardcoded list
 * of full paths. Codex's independent probe found this both too shallow
 * (metadata can be arbitrarily nested -- `player_availability.
 * key_returns[0].source`, `books.betmgm.source_row_id` -- neither of
 * which is 2 segments, and `books.betmgm.*` has a DYNAMIC middle segment
 * per sportsbook, which no static full-path enumeration can ever cover)
 * and too narrow (new metadata leaf NAMES keep appearing under different
 * roots: `season`/`is_current_season`/`seasons_behind`, `source`/
 * `source_key`/`source_row_id`/`source_name`, `snapshot_at`/`observed_at`/
 * `published_at`, `staleness_note`/`attribution_note`/`freshness`,
 * `availability_status`).
 *
 * Fix: classify by the path's LAST segment (the leaf field name) against
 * a denylist of known metadata/provenance leaf names, not by a fixed
 * root.child shape. This is depth- and dynamic-key-agnostic -- it doesn't
 * matter how deep the leaf is nested or what the intermediate keys are
 * (a book name, an array index), only what the final field is actually
 * called. `pathLeaf()` strips array-index brackets the same way the
 * existing head-extraction regex does. A new metadata leaf name
 * discovered later should be added to this Set directly, the same way
 * `team` was added to round 4's root-removal list -- this still doesn't
 * try to infer "substantive" from naming patterns beyond exact leaf-name
 * matches, to avoid new false positives on genuinely substantive fields
 * that happen to share a word with a metadata field (e.g. `status` alone,
 * as in an injury status, is NOT denylisted -- only the more specific
 * `availability_status`, a book-row operational flag, is).
 */
const TIER1_METADATA_LEAF_NAME_DENYLIST = new Set([
  // identity / provenance / freshness metadata -- never the substance of a
  // citation, regardless of which Tier-1 root container it's nested under.
  // round 5 seeded this with 8 fields found by a targeted repro; round 6
  // replaced the root.child shape with this leaf-name shape but only added
  // the leaf names needed to close that round's specific findings; round 7
  // (2026-09-09) replaces reactive patching with a full reviewed inventory
  // of every metadata-shaped leaf actually written under a Tier-1 root in
  // agents/portfolio-dossier.js (quoteMeta(), fetchPlayerAvailabilityContext(),
  // fetchDvoaSnapshots(), fetchCoachingProfiles(), the injuries builder, the
  // roster-churn current/prior stamps). A new metadata leaf discovered later
  // should still be added directly -- this is a best-effort inventory, not a
  // closed-form guarantee -- but it is no longer built one Codex example at a
  // time.
  'season', 'week', 'seasons_behind', 'is_current_season',
  'source', 'source_key', 'source_name', 'source_url', 'source_row_id',
  'attribution_note', 'staleness_note', 'freshness',
  // 2026-09-09 (Codex P1, flagged 2026-09-09): mergeAnalytics()'s new
  // field_provenance record (base_season + base_only_fields) is
  // resolution metadata for isCurrentSeasonForEvidence(), never itself
  // substantive evidence -- block the whole subtree by leaf name, same as
  // every other metadata field here.
  'field_provenance',
  'snapshot_at', 'observed_at', 'published_at', 'quote_age_hours',
  'availability_status', 'needs_human_review',
  // identity-only labels -- WHO/WHAT is being described, not evidence about
  // them. Same principle as round 4's removal of the bare `team` root:
  // knowing a name isn't a corroborating signal by itself.
  'player_name', 'name', 'head_coach', 'offensive_coordinator', 'defensive_coordinator',
  // sample-window / expiry bounds -- when the underlying data was measured
  // or stops being valid, not what it says.
  'sample_start', 'sample_end', 'stale_after',
]);

function pathSegments(evidenceId) {
  return String(evidenceId || '').split(/[.[\]]/).filter(Boolean);
}

/**
 * Returns 1 | 2 | 3 | 4 | null. null means "not a recognized field root, or
 * a recognized root's metadata-only/aggregate-only descendant" -- NOT
 * Tier 1. Callers that need a yes/no "does this count as qualifying
 * grounding" answer should use hasQualifyingGrounding() below, not compare
 * against a specific tier number.
 */
export function classifyEvidenceTier(evidenceId) {
  const id = String(evidenceId || '');
  const head = id.split(/[.[]/)[0];
  if (TIER4_FIELD_PREFIXES.has(head)) return 4;
  if (TIER3_FIELD_PREFIXES.has(head)) return 3;
  if (head === 'lean') return classifyLeanEvidence(id);
  if (TIER2_FIELD_PREFIXES.has(head)) return 2;
  if (TIER1_FIELD_ROOTS.has(head)) {
    // round 8 (Codex round-7 review P1): checking only the FINAL segment
    // let a denied leaf be "rescued" back to Tier 1 just by appending
    // another property -- `analytics.staleness_note.length`,
    // `dvoa.source_name.length`, `analytics.staleness_note.0` all resolved
    // in the live dossier and passed as Tier 1 under the old last-segment-
    // only check, because `length`/`0` (a string-indexing access) is not
    // itself a denied name even though it's hanging off a denied one. Fix:
    // if ANY segment along the path -- not only the last -- is a denied
    // metadata leaf name, the whole path is non-qualifying. A citation
    // can't launder a metadata field into "real evidence" by reading a
    // property off of it.
    const segments = pathSegments(id);
    if (segments.some((seg) => TIER1_METADATA_LEAF_NAME_DENYLIST.has(String(seg).toLowerCase()))) return null;
    return 1;
  }
  return null;
}

/**
 * 2026-09-09 (Andy's explicit policy call after the P1 #1 prior-season
 * evidence-framing remediation): a resolved Tier 1 citation into a field
 * group whose stamped is_current_season is explicitly false (last season's
 * numbers standing in as a preseason prior -- true right now, pre-kickoff
 * for 2026) no longer counts as full, self-sufficient Tier 1 grounding. The
 * data is real and now honestly labeled ([Nyr prior] in markdown, staleness
 * fields on every consumer per the P1 #1 fix), so it can still CORROBORATE
 * a pick alongside genuine Tier 1/2/3 support -- but per
 * hasQualifyingGrounding's Tier-1-only-originates rule, it can no longer
 * independently ORIGINATE a core/standard stake. Demoted to Tier 2: the
 * same treatment as a dated, named analyst quote -- real support, not
 * sufficient alone.
 *
 * classifyEvidenceTier() itself is deliberately left untouched (still a
 * pure path classifier with no season awareness) so its existing unit
 * tests keep describing it correctly. This sits one layer up and only
 * applies where the resolved evidence entry actually carries season-
 * staleness info -- entries stamped by resolveEvidenceIds() in
 * portfolio-synthesize.js, which resolves each citation's immediate parent
 * container and copies its is_current_season flag (null when the citation
 * has no such parent, e.g. a bare top-level root like best_price -- in
 * that case this is a no-op passthrough to classifyEvidenceTier()).
 */
export function effectiveEvidenceTier(entry) {
  const tier = classifyEvidenceTier(entry?.id);
  if (tier === 1 && entry?.is_current_season === false) return 2;
  return tier;
}

const CAP_TIERS_FOR_NARRATIVE_ONLY = ['small', 'speculative'];

/**
 * True iff the candidate has at least one RESOLVED evidence_id that
 * classifies as Tier 1 (structured/computed dossier evidence). False for:
 * zero resolved evidence, resolved evidence that's only Tier 2/3/4, and
 * resolved evidence with unrecognized field roots (round-3 fix -- these no
 * longer count as Tier 1 by default).
 *
 * Round 5 policy change (2026-09-09, Andy's explicit call after the SOURCE
 * HIERARCHY prose was found to contradict itself -- see the prose block in
 * agents/portfolio-synthesize.js): a CORE or STANDARD stake now requires
 * genuine Tier 1 support. Tier 2 (named/dated analyst corroboration) is no
 * longer sufficient on its own -- it remains real corroboration alongside
 * Tier 1, but a Tier-2-only candidate is now treated the same as a
 * Tier-3/4-only one: forced to needs_human_review + small/speculative by
 * enforceEvidenceTierGate() below. This also resolves round 4's
 * `lean.n`-qualifies-as-Tier-2 bypass structurally, independent of the
 * classifyEvidenceTier() fix above -- even a LEGITIMATE, fully-dated Tier 2
 * citation can no longer unlock a core/standard stake by itself.
 */
export function hasQualifyingGrounding(candidate) {
  const resolved = (candidate?.evidence_resolved || []).filter((e) => e?.resolved);
  return resolved.some((e) => effectiveEvidenceTier(e) === 1);
}

/**
 * 2026-09-08 (Andy's guarded-with-enforcement policy, Codex-reviewed,
 * round-3 corrected; tightened round 5 -- Tier 1 is now mandatory, Tier 2
 * alone no longer qualifies): a candidate that lacks qualifying Tier 1
 * grounding -- whether because it cites nothing, cites only Tier 2/3/4, or
 * cites evidence_ids this classifier doesn't recognize -- must be
 * needs_human_review=true and stake_tier small/speculative, per
 * SYSTEM_PROMPT's SOURCE HIERARCHY / GUARDED POLICY. This annotator is kept
 * (annotate-and-keep convention, same as namedPlayerSizingViolations()
 * above) so the violation strings still render in reports, but round 3
 * ALSO adds enforceEvidenceTierGate() below, which actually normalizes the
 * candidate's values -- Codex's second review found that annotation alone
 * left unsafe stake_tier/needs_human_review values reaching reports,
 * proposal export, and persistence unchanged.
 */
export function evidenceTierViolations(candidate) {
  if (hasQualifyingGrounding(candidate)) return [];

  const resolved = (candidate?.evidence_resolved || []).filter((e) => e?.resolved);
  const tiers = [...new Set(resolved.map((e) => effectiveEvidenceTier(e)))].sort();
  const reason = resolved.length
    ? `no resolved evidence_id classifies as Tier 1 (resolved tiers seen: ${tiers.map((t) => (t == null ? 'unrecognized' : t)).join(',') || 'none'})`
    : 'no resolved evidence_ids at all';

  const violations = [];
  const tier = String(candidate?.stake_tier || '').toLowerCase();
  if (tier && !CAP_TIERS_FOR_NARRATIVE_ONLY.includes(tier)) {
    violations.push(`evidence_tier_gate: ${reason} -- stake_tier "${tier}" exceeds the allowed cap (${CAP_TIERS_FOR_NARRATIVE_ONLY.join('|')}) per the guarded-with-enforcement SOURCE HIERARCHY policy.`);
  }
  if (!candidate?.needs_human_review) {
    violations.push(`evidence_tier_gate: ${reason} -- needs_human_review must be true per the guarded-with-enforcement SOURCE HIERARCHY policy.`);
  }
  return violations;
}

/**
 * 2026-09-08 (round 3, Codex's second review -- P1 "violations do not
 * enforce the policy"): unlike the rest of this module, this function DOES
 * NOT follow the annotate-and-keep convention -- it returns a NEW object
 * (never mutates its input) with `needs_human_review` and `stake_tier`
 * actually normalized to safe values when the candidate lacks qualifying
 * Tier 1 grounding (round 5: Tier 2 alone no longer qualifies). Andy's
 * explicit guarded-with-enforcement policy
 * requires this specific gate to be a real value-forcing enforcement step,
 * not just a flag reviewers might miss in a `validation` array -- Codex
 * confirmed via direct probe that annotate-only left the unsafe
 * core/unflagged candidate unchanged all the way through to report/
 * proposal/persistence.
 *
 * Call this on `final` in the pipeline tail, AFTER validateBoardBatch()
 * (so violations are already stamped for display) and BEFORE ranking,
 * proposal export, report rendering, and persistence -- i.e. before every
 * downstream consumer of `final`.
 */
export function enforceEvidenceTierGate(candidate) {
  if (hasQualifyingGrounding(candidate)) return candidate;

  const tier = String(candidate?.stake_tier || '').toLowerCase();
  const alreadySafe = candidate?.needs_human_review === true && CAP_TIERS_FOR_NARRATIVE_ONLY.includes(tier);
  if (alreadySafe) return candidate;

  return {
    ...candidate,
    needs_human_review: true,
    stake_tier: CAP_TIERS_FOR_NARRATIVE_ONLY.includes(tier) ? candidate.stake_tier : 'small',
    evidence_tier_enforced: true,
  };
}

/**
 * 2026-09-08 (round 3, Codex's second review -- P2 "exactas resolve only
 * team_a context"): teamProfileForRow() in portfolio-synthesize.js only
 * ever merges team_a's profile for a superbowl_matchup row (it has no
 * team_nick, and the lookup key falls back to team_a), so team_b's
 * structured evidence is unrepresented and can collide with team_a's
 * same-named fields -- meaning evidence_tier classification for an exacta
 * candidate can't be trusted to reflect BOTH teams' real grounding.
 *
 * Rather than build team-qualified evidence-ID resolution (a bigger, riskier
 * change), this applies locked decision #4 more completely: superbowl_matchup
 * is "sim-price context only, never a card" -- SIM_PRICE_ONLY_MARKETS /
 * validateBoard() already annotates this via the sim_price_only_market
 * violation, but nothing previously stopped a superbowl_matchup candidate
 * from still reaching `final`. partitionSimPriceOnly() actually excludes
 * them from `final`, mirroring the existing passed/invalidated exclusion
 * pattern already used elsewhere in the pipeline tail. superbowl_matchup
 * legitimately still appears elsewhere (hedge_baskets/parlay_ladders legs,
 * watchlistReview) -- those are separate arrays, untouched by filtering
 * `final`.
 */
export function isSimPriceOnlyCandidate(candidate) {
  return SIM_PRICE_ONLY_MARKETS.has(candidate?.market);
}

export function partitionSimPriceOnly(candidates = []) {
  const kept = [];
  const excluded = [];
  for (const c of candidates) {
    if (isSimPriceOnlyCandidate(c)) {
      excluded.push({
        ...c,
        excluded_reason: `sim_price_only_market: "${c.market}" is sim-price context only per locked decision #4 and is excluded from final recommendations (round-3 enforcement, Codex second-review P2).`,
        stage: 'board_validator',
      });
    } else {
      kept.push(c);
    }
  }
  return { kept, excluded };
}

/**
 * 2026-09-09 (round 5, Codex's final cumulative session-close review --
 * P1 prose contradiction, resolved by Andy's explicit clarification): the
 * SOURCE HIERARCHY prose describes Tier 4 (training_camp_intel) as "never
 * a primary driver, only color for a thesis already grounded above it,"
 * but a separate paragraph explicitly allowed a Tier-4-ONLY play (small/
 * speculative + reviewed) -- two different policies for the same case.
 * Andy's call: Tier 4 must NEVER be allowed to be the entire basis for a
 * play, at any stake size -- it only bolsters a thesis that already has
 * Tier 1/2/3 support. This is stricter than Tier 3, which the guarded
 * policy still permits to originate a small/speculative, flagged play
 * alone (unchanged).
 *
 * Capping to small/speculative (enforceEvidenceTierGate's normal treatment
 * for "lacks qualifying grounding") is NOT sufficient here, because that
 * treatment is exactly what the policy says IS allowed for Tier-3-only --
 * a Tier-4-only candidate needs to never reach `final` at all. Mirrors
 * partitionSimPriceOnly()'s exclude-with-reason pattern rather than
 * inventing a new mechanism.
 */
export function isTier4OnlyCandidate(candidate) {
  const evidence = candidate?.evidence_resolved || [];
  // Round 6 fix (2026-09-09, Codex round-5 review -- P1 "partitionTier4Only()
  // is bypassable with non-evidence"). Round 5's version required EVERY
  // resolved citation to classify as exactly Tier 4, which Codex's direct
  // probe broke four ways: adding one resolved-but-non-qualifying citation
  // (`team`, or any unrecognized field) alongside the Tier 4 one flipped
  // `every(...)` to false and let the candidate through unexcluded; an
  // UNRESOLVED Tier-4-only citation (no resolved evidence at all) also
  // returned false, because `resolved.length === 0` short-circuited before
  // ever looking at what was cited. Neither case has any real Tier 1/2/3
  // support -- they're exactly what "Tier 4 cannot originate a play" is
  // supposed to catch.
  //
  // Corrected predicate (Codex's own phrasing): a candidate is
  // Tier-4-originated if it cites Tier 4 AT ALL (resolved or not -- an
  // unresolved citation is still evidence the model reached for) AND has
  // NO resolved, qualifying Tier 1/2/3 support. A genuinely mixed-evidence
  // candidate (Tier 4 alongside real Tier 1/2/3) is correctly NOT excluded
  // here -- that's Tier 4 doing its allowed job of adding color to a
  // thesis grounded above it.
  const hasQualifyingTier123Support = evidence.some((e) => {
    if (!e?.resolved) return false;
    const t = effectiveEvidenceTier(e);
    return t === 1 || t === 2 || t === 3;
  });
  if (hasQualifyingTier123Support) return false;
  return evidence.some((e) => effectiveEvidenceTier(e) === 4);
}

export function partitionTier4Only(candidates = []) {
  const kept = [];
  const excluded = [];
  for (const c of candidates) {
    if (isTier4OnlyCandidate(c)) {
      excluded.push({
        ...c,
        excluded_reason: 'tier4_only_evidence: cites Tier 4 (training_camp_intel) with no resolved, qualifying Tier 1/2/3 support -- color-only narrative cannot originate a play at any stake size per SOURCE HIERARCHY (Andy\'s 2026-09-09 clarification), and is excluded from final recommendations.',
        stage: 'board_validator',
      });
    } else {
      kept.push(c);
    }
  }
  return { kept, excluded };
}

export function validateBoardBatch(candidates = [], dossier) {
  return candidates.map((c) => {
    const violations = validateBoard(c, dossier);
    return violations.length ? { ...c, validation: violations } : c;
  });
}

// ── Evidence path resolver (moved here from portfolio-synthesize.js in round 8,
// Codex round-7 review P1) ───────────────────────────────────────────────────
// Stage 1 candidates cite evidence_ids as dot-path pointers into a dossier
// row/team-profile object (e.g. 'analytics.off_epa_rank', 'lean.samples[0].who').
// This resolves those pointers back to their actual dossier value. Moved into
// this evidence-tier-gate module (rather than staying a private helper in
// portfolio-synthesize.js) specifically so it can be unit tested directly --
// portfolio-synthesize.js runs a top-level IIFE on import and can't safely be
// imported by a test file.
//
// round 8 hardening: the original version did unrestricted `cur[p]` property
// access, which Codex's round-7 review showed was exploitable two ways, both
// verified against the live dossier:
//   1. Appending a further property to an already-denied metadata leaf
//      "laundered" it back into a resolvable value -- `analytics.
//      staleness_note.length` resolved to a number (the string's length),
//      `analytics.staleness_note.0` resolved to the string's first
//      character -- neither is real dossier evidence, both are JavaScript
//      reading a language-level property off a string primitive.
//   2. Because `cur[p]` doesn't distinguish own from inherited properties,
//      a citation path could walk the prototype chain --
//      `analytics.constructor`, `analytics.toString`, `analytics.__proto__`
//      all resolved to real (non-dossier) values.
// Fix: traversal is only allowed into a plain object or a real array -- once
// `cur` is a primitive (string/number/boolean), it's terminal and any further
// segment fails to resolve. A string-keyed segment must be an own,
// enumerable property of the current object (via `propertyIsEnumerable()`
// -- note this permits an own enumerable ACCESSOR/getter, not only a data
// property; dossier objects are plain JSON.parse() output, which never
// has getters, so this distinction has no practical effect on real input,
// per Codex's round-10 review), and `__proto__`/
// `constructor`/`prototype` are rejected outright regardless of what that
// check would say about them.
//
// round 9 (Codex round-8 review P2->concrete P1): the round-8 fix checked
// this with `hasOwnProperty()`, but that only tests "own", not "enumerable"
// -- and Array's `length` is an own, NON-enumerable property. So
// `lean.samples.length` passed `hasOwnProperty()`, resolved to the array's
// count, and (since any `lean.*` path classifies Tier 2 per the still-
// syntactic-not-semantic Tier 2 gap) rescued a Tier-4-only candidate --
// an exact, reproducible bare-count bypass of the same shape as the
// already-rejected `lean.n`. Fixed by using `propertyIsEnumerable()`
// instead of `hasOwnProperty()`, exactly as this comment always claimed
// the code did -- `propertyIsEnumerable()` requires BOTH own and
// enumerable, so `length` (own, non-enumerable) now correctly fails,
// while ordinary own data properties like `who`/`dir`/`strength` (own,
// enumerable) are unaffected.
export function resolvePath(obj, pathStr) {
  if (obj == null || !pathStr) return undefined;
  const parts = String(pathStr).split('.').flatMap((seg) => {
    const m = seg.match(/^([^[]+)(\[(\d+)\])?$/);
    if (!m) return [seg];
    return m[3] != null ? [m[1], Number(m[3])] : [m[1]];
  });
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    const isArray = Array.isArray(cur);
    const isPlainObject = !isArray && typeof cur === 'object';
    if (!isArray && !isPlainObject) return undefined;
    if (typeof p === 'number') {
      // round 10 (Codex round-9 review P2 hardening): bounds checking alone
      // doesn't guarantee `cur[p]` reads an actual array ELEMENT -- a sparse
      // array combined with a polluted Array.prototype (e.g.
      // `Array.prototype[0] = {...}`) has `p` in bounds but backed by an
      // inherited prototype property, not an own one, at that index. Not
      // reachable through the current dossier (no sparse arrays observed),
      // and requires pre-existing prototype pollution to matter at all, but
      // the numeric branch should honor the same own/enumerable invariant
      // the string branch enforces below, not just bounds. `propertyIsEnumerable()`
      // on an array index requires the slot to be a real, own, enumerable
      // element -- a hole (sparse slot) falling through to a polluted
      // prototype property fails this check.
      if (!isArray || p < 0 || p >= cur.length) return undefined;
      if (!Object.prototype.propertyIsEnumerable.call(cur, p)) return undefined;
      cur = cur[p];
      continue;
    }
    if (typeof p !== 'string' || p === '__proto__' || p === 'constructor' || p === 'prototype') return undefined;
    if (!Object.prototype.propertyIsEnumerable.call(cur, p)) return undefined;
    cur = cur[p];
  }
  return cur;
}


// 2026-09-09 (Andy's evidence-tier-cap policy decision): resolves the
// season-freshness that applies to a given evidence citation path within a
// dossier row, so the tier-gate layer above can tell a citation into
// honestly-labeled prior-season fallback data (portfolio-dossier.js's
// staleness stamping) from real current-season evidence, without
// classifyEvidenceTier()/effectiveEvidenceTier() themselves needing any
// row/season awareness.
//
// 2026-09-09 (Codex P1, flagged 2026-09-09): moved here from
// portfolio-synthesize.js (round 9, same rationale as resolvePath()'s round
// 8 move -- portfolio-synthesize.js's top-level IIFE runs main()
// unconditionally on import, so a pure function living only there can't be
// unit-tested without executing the whole synthesis pipeline) and rewritten
// to fix a real correctness gap: the original only checked a citation's
// IMMEDIATE parent container, so `analytics.raw.ftn_charting.
// blitz_rate_faced` (three levels under `analytics`'s is_current_season
// flag) and bare-root citations like plain `analytics` (no dotted parent at
// all) both bypassed the cap, retaining Tier 1 with is_current_season: null.
//
// Fixed via (a) a full ancestor walk from the citation's own path up to the
// top-level root, taking the first ancestor that carries an enumerable
// is_current_season flag, and (b) field-accurate resolution for the
// `analytics` root specifically, whose mergeAnalytics() (portfolio-
// dossier.js) flattens two independently-sourced objects (base season
// stats + advanced analytics) under one root-level flag -- a base-only
// field (e.g. pass_rate) needs to resolve against BASE's own season stamp,
// not whichever source's flag the flat spread happened to leave on the
// root. mergeAnalytics() stamps an explicit, plain-JSON-serializable
// `field_provenance` record ({ base_season, base_only_fields }) precisely
// so this function can make that distinction; field_provenance is itself
// denylisted in TIER1_METADATA_LEAF_NAME_DENYLIST so it can never be cited
// as evidence directly.
export function isCurrentSeasonForEvidence(id, dossierRow) {
  const segments = String(id || '').split('.').filter(Boolean);
  if (!segments.length) return null;

  // Field-accurate resolution for the analytics root's mixed-source fields.
  const root = resolvePath(dossierRow, segments[0]);
  const fieldProvenance = root && typeof root === 'object' && !Array.isArray(root)
    && Object.prototype.propertyIsEnumerable.call(root, 'field_provenance')
    ? root.field_provenance
    : null;
  if (fieldProvenance) {
    if (segments.length >= 2 && fieldProvenance.base_only_fields?.includes(segments[1])) {
      return fieldProvenance.base_season?.is_current_season ?? null;
    }
    if (segments.length === 1) {
      // Bare-root citation of a mixed-source object (e.g. plain
      // 'analytics'): treat it as stale if EITHER source is stale, since a
      // bare citation could be read as covering any field within.
      const baseCurrent = fieldProvenance.base_season?.is_current_season;
      const rootCurrent = Object.prototype.propertyIsEnumerable.call(root, 'is_current_season')
        ? root.is_current_season
        : null;
      if (baseCurrent === false || rootCurrent === false) return false;
      return rootCurrent ?? baseCurrent ?? null;
    }
  }

  // General case: walk every ancestor from the citation's own path up to
  // the top-level root, taking the first one that carries the flag. This
  // closes both the nested-path bypass (deep citations under a Tier-1 root
  // that only stamps the flag at the root) and the bare-root bypass (a
  // citation with no dotted parent still resolves against itself).
  for (let depth = segments.length; depth >= 1; depth -= 1) {
    const path = segments.slice(0, depth).join('.');
    const obj = resolvePath(dossierRow, path);
    if (obj && typeof obj === 'object' && !Array.isArray(obj)
        && Object.prototype.propertyIsEnumerable.call(obj, 'is_current_season')) {
      return obj.is_current_season;
    }
  }
  return null;
}
