// Canonical execution-venue registry (2026-08-13).
//
// Before this file, "which books can the Creator actually bet at" was defined
// FOUR separate times in this repo and had drifted out of sync:
//   - agents/portfolio-dossier.js's BETTABLE_BOOKS (6 venues, 9 keys w/ aliases)
//   - src/lib/supabase.js's PLACEABLE_BOOKS (same 6 venues — explicitly said to
//     mirror the dossier default, but as a second hand-copied list)
//   - agents/portfolio-synthesize.js's prompt text (same 6 venues, in prose)
//   - scripts/lib/futures-odds-execution.js's PLACEABLE_BOOKS (only 3 venues —
//     silently excluded the three proxy-access Vegas books from execution
//     eligibility, which is what made the Bills-Packers exacta's "needs a
//     second placeable book" gate stricter than Andy's own stated venue list)
//
// This module is the single source of truth. It has NO Node built-ins (no fs,
// no path) so it is safe to import from both server-side agents/scripts AND
// browser code — do not add Node-only imports here. Lives under src/lib/
// (not scripts/lib/) because agents/portfolio-dossier.js already imports
// browser-shared code from src/lib/ (see its `normalizeTeam` import from
// src/lib/teams.js) — this repo's established pattern is src/lib/ as the
// shared-code home, not the other direction.
//
// Source of truth for the venue list itself: Andy's authoritative "Execution
// venues" statement in
// docs/NFL_FUTURES_SYNTHESIS_INCIDENT_REVIEW_CLAUDE_BRIEF_2026-08-13.md §1.

export const EXECUTION_VENUE_REGISTRY_SCHEMA = 'execution_venue_registry_v1';

// Sportsbooks the Creator can place a real bet at today.
// `access: 'direct'` — no proxy needed. `access: 'proxy'` — requires a
// VPN/geo proxy. Both count as placeable for pricing/thesis purposes; keep
// them distinguishable so a stricter direct-only execution check can be built
// later without re-inventing a new list.
export const SPORTSBOOK_VENUES = Object.freeze([
  { key: 'bookmaker', label: 'Bookmaker/BKR', access: 'direct', aliases: ['bkr'] },
  { key: 'betus', label: 'BetUS', access: 'direct', aliases: [] },
  { key: 'betonline', label: 'BetOnline', access: 'direct', aliases: [] },
  { key: 'betmgm', label: 'BetMGM', access: 'proxy', aliases: ['mgm'] },
  { key: 'caesars', label: 'Caesars/William Hill', access: 'proxy', aliases: ['williamhill', 'williamhill_us', 'william_hill'] },
  { key: 'circa', label: 'Circa', access: 'proxy', aliases: [] },
]);

// Prediction-market venues. These are NOT sportsbooks. Execution eligibility
// for these requires a separate bid/ask/fillable-size/fee/settlement
// equivalence check against the matching sportsbook market — not yet built
// (see docs/FUTURES_ARTICLE_REACQUISITION_AND_GATES_DESIGN_2026-08-13.md §1).
// Never fold these into SPORTSBOOK_VENUES or a sportsbook-price execution gate.
export const PREDICTION_MARKET_VENUES = Object.freeze([
  { key: 'kalshi', label: 'Kalshi', aliases: [] },
  { key: 'polymarket', label: 'Polymarket', aliases: [] },
]);

// Market-context-only books: useful for fair-value/divergence reads, but the
// Creator cannot place a bet there. Never treat as placeable/execution-eligible.
export const MARKET_CONTEXT_ONLY_VENUES = Object.freeze([
  { key: 'draftkings', label: 'DraftKings', aliases: ['dk'] },
  { key: 'fanduel', label: 'FanDuel', aliases: ['fd'] },
]);

function allKeys(venue) {
  return [venue.key, ...(venue.aliases || [])];
}

// Every recognized sportsbook key/alias -> canonical key, lowercase.
export const SPORTSBOOK_KEY_INDEX = Object.freeze(
  Object.fromEntries(SPORTSBOOK_VENUES.flatMap((venue) => allKeys(venue).map((alias) => [alias, venue.key]))),
);

// Set of every accepted sportsbook key/alias — mirrors the `Set`-of-keys shape
// src/lib/supabase.js's PLACEABLE_BOOKS previously hand-maintained.
export const PLACEABLE_SPORTSBOOK_KEYS = Object.freeze(new Set(SPORTSBOOK_VENUES.flatMap(allKeys)));

// canonical key -> display label — mirrors the `Map` shape
// scripts/lib/futures-odds-execution.js previously hand-maintained.
export const PLACEABLE_SPORTSBOOK_LABELS = new Map(SPORTSBOOK_VENUES.map((venue) => [venue.key, venue.label]));

export function isPlaceableSportsbook(book) {
  const key = String(book ?? '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(SPORTSBOOK_KEY_INDEX, key);
}

export function canonicalSportsbookKey(book) {
  const key = String(book ?? '').trim().toLowerCase();
  return SPORTSBOOK_KEY_INDEX[key] || null;
}

export function sportsbookAccessType(book) {
  const canonical = canonicalSportsbookKey(book);
  return SPORTSBOOK_VENUES.find((venue) => venue.key === canonical)?.access || null;
}

export function isPredictionMarketVenue(venue) {
  const key = String(venue ?? '').trim().toLowerCase();
  return PREDICTION_MARKET_VENUES.some((pm) => pm.key === key);
}

// Builds the "PLACEABLE BOOKS ONLY" prompt sentence from the registry, so the
// synthesis prompt can never silently drift from the code-level venue list
// again the way it did before this file existed.
export function placeableVenuesPromptSentence() {
  const direct = SPORTSBOOK_VENUES.filter((v) => v.access === 'direct').map((v) => v.label);
  const proxy = SPORTSBOOK_VENUES.filter((v) => v.access === 'proxy').map((v) => v.label);
  const pmLabels = PREDICTION_MARKET_VENUES.map((v) => v.label);
  return `PLACEABLE BOOKS ONLY: the user bets directly at ${direct.join(', ')}, and via a proxy at `
    + `${proxy.join(', ')}. best_price/best_book (outrights) and best_over/best_under + their books `
    + `(win totals) are ALREADY filtered to these placeable books. NEVER recommend a `
    + `${MARKET_CONTEXT_ONLY_VENUES.map((v) => v.label).join(' or ')} price — those appear only as market `
    + `context for fair value; the user cannot bet them. Every "book" in your output must be a placeable `
    + `book (use the dossier's best_* fields). ${pmLabels.join(' and ')} are separate execution candidates `
    + `only when their net executable price (after fees, accounting for bid/ask and fillable size) beats `
    + `the equivalent sportsbook price — treat them as market context, not a placeable "book", unless the `
    + `dossier explicitly marks a prediction-market row execution-eligible.`;
}
