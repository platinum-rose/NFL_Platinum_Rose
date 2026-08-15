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
 */
export function quotedComboFor(row, candidate) {
  const bookKey = normBook(candidate?.book);
  if (!bookKey || !row?.books) return null;
  const entry = row.books[bookKey] ?? row.books[candidate.book];
  if (!entry) return null;

  if (isWinsRow(row)) {
    if (entry.over != null && Number(entry.over) === Number(candidate.price)) {
      return { line: entry.line, price: entry.over, side: 'over', edge_pct: null };
    }
    if (entry.under != null && Number(entry.under) === Number(candidate.price)) {
      return { line: entry.line, price: entry.under, side: 'under', edge_pct: null };
    }
    return null;
  }

  if (entry.price != null && Number(entry.price) === Number(candidate.price)) {
    return { line: null, price: entry.price, side: null, edge_pct: null };
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
 * Convenience batch runner — validates a list of candidates against one
 * dossier, returning a new array with `validation` stamped onto each
 * candidate (annotate-and-keep: always the full input list back, same
 * order, nothing dropped).
 */
export function validateBoardBatch(candidates = [], dossier) {
  return candidates.map((c) => {
    const violations = validateBoard(c, dossier);
    return violations.length ? { ...c, validation: violations } : c;
  });
}
