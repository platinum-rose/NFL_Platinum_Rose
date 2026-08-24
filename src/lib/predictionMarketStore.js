// src/lib/predictionMarketStore.js
// ════════════════════════════════════════════════════════════════════════════════
// PREDICTION MARKET DATA STORE & RECONCILIATION HELPER
// Loads latest Kalshi / Polymarket aggregated contracts and matches them by team/game.
// ═══════════════════════════════════════════════════════════════════════════════

import sampleContracts from '../../data/prediction-markets/sample-nfl-contracts.json';
import latestSnapshot from '../../data/prediction-markets/latest.json';
import { calculateNetOdds } from './predictionMarkets.js';
import { normalizeTeam } from './teams.js';

// Alias map to handle team code variations (e.g. KC vs KAN, SF vs SFO, GB vs GNB)
const TEAM_ALIASES = {
  KAN: 'KC', KCC: 'KC',
  SFO: 'SF',
  GNB: 'GB',
  NWE: 'NE',
  NOR: 'NO',
  TAM: 'TB',
  WAS: 'WSH', WDC: 'WSH',
  LVR: 'LV', OAK: 'LV',
  LAC: 'LAC', SD: 'LAC',
  LAR: 'LAR', STL: 'LAR',
};

function normalizeCode(code) {
  if (!code) return '';
  const upper = String(code).trim().toUpperCase();
  return TEAM_ALIASES[upper] || upper;
}

/**
 * Get all ingested contracts from latest snapshot or sample fallback.
 * @returns {Array} List of normalized prediction market contract objects
 */
export function getPredictionMarketContracts() {
  if (latestSnapshot && Array.isArray(latestSnapshot.contracts) && latestSnapshot.contracts.length > 0) {
    return latestSnapshot.contracts;
  }
  return sampleContracts.map((c) => {
    const net = calculateNetOdds({ priceCents: c.last_price || c.yes_ask || 50, exchange: c.exchange });
    return {
      ...c,
      price_cents: c.last_price || c.yes_ask || 50,
      net_american_odds: net.netAmericanOdds,
      gross_american_odds: net.grossAmericanOdds,
      decimal_odds: net.decimalOdds,
    };
  });
}

/**
 * Get prediction market contracts matching a specific team and market type.
 * @param {string} teamAbbr - Team abbreviation (e.g. 'KC', 'DET', 'SF')
 * @param {string} [marketType] - 'super_bowl', 'win_totals', 'division', 'game'
 * @returns {Array} List of matching contracts sorted by volume/liquidity
 */
export function getContractsForTeam(teamAbbr, marketType = null) {
  const targetTeam = normalizeCode(teamAbbr);
  const all = getPredictionMarketContracts();

  return all.filter((c) => {
    const title = (c.title || '').toUpperCase();
    const ticker = (c.ticker || '').toUpperCase();
    const teamMatch = c.team ? normalizeCode(c.team) === targetTeam : title.includes(targetTeam) || ticker.includes(targetTeam);

    if (!teamMatch) return false;
    if (!marketType) return true;

    if (marketType === 'super_bowl' || marketType === 'superbowl') {
      return /SUPER BOWL|SB|CHAMPION/i.test(title) || c.market_type === 'super_bowl';
    }
    if (marketType === 'win_totals' || marketType === 'wins') {
      return /WINS|OVER|UNDER/i.test(title) || c.market_type === 'win_totals';
    }
    if (marketType === 'division') {
      return /DIVISION|NFC|AFC/i.test(title) || c.market_type === 'division';
    }
    return true;
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Game/matchup contract matching
//
// Contracts are matched to a specific game in two stages:
//
// 1. TEAM MATCH -- every NFL team name mentioned as a *whole token* in the
//    contract's title + ticker (and its `team` field, if set) is extracted via
//    `normalizeTeam()` (src/lib/teams.js) -- the app's single source of truth
//    for team-name resolution -- specifically because it already guards
//    against short-code false positives (e.g. "NE" must not match inside
//    "ONE", "CAR" must not match inside "CARSON", "TB" must not match inside
//    "FOOTBALL"). A naive `text.includes(code)` substring check (the original
//    approach here) does NOT have that guard and was confirmed via
//    source-level audit to misattribute ~56% of scheduled games to an
//    unrelated single-team contract (award/win-totals/division markets whose
//    title or ticker happened to contain another team's 2-3 letter code as a
//    substring of an ordinary word). BOTH the visitor and home team must be
//    present as whole tokens to even be considered a candidate.
//
// 2. EXPLICIT HEAD-TO-HEAD WORDING -- a candidate must also contain a
//    head-to-head connector ("vs.", "versus", "@", "at") in its title. This
//    rules out contracts that merely *mention* both teams in passing (e.g.
//    "NFL: Will the Rams beat the 49ers by more than 3.5 points in their
//    January 30 matchup?" -- a hypothetical future/postseason prop, not a
//    ticket for any specific scheduled game on the loaded slate) from being
//    treated as this game's matchup contract at all.
//
// 3. DATE AGREEMENT -- when a scheduled kickoff (`gameDateStr`, ISO/parsable)
//    is supplied, a candidate's contract date -- parsed from an ISO
//    `YYYY-MM-DD` in the ticker/title, or a "Month Day" mention in the title
//    (e.g. "January 30 matchup") -- must agree with the scheduled kickoff
//    within a small tolerance (to absorb UTC-vs-local calendar-day rollover
//    for late-kickoff games). This was added after a live-data audit
//    (2026-08-21, Codex review) found the team-only match alone was still
//    attaching wrong-season, wrong-week, and preseason-dated contracts to
//    regular-season games with the same two teams (division rivals play
//    twice a season; preseason + regular-season meetings both exist in the
//    ingested contract set). A contract whose date conflicts with the
//    scheduled game is never used, even if it's the only team-matching
//    candidate -- a wrong-date contract is strictly worse than no badge.
//    A contract with NO parseable date is only used when it is the single
//    remaining ambiguity-free candidate; if there are zero or more than one
//    such undated candidates (and no dated one agrees), no badge is shown
//    rather than guessing.
//
// `market_type` is intentionally NOT used as a filter here: the ingested
// data tags some genuine two-team matchup contracts (e.g. "NFL Saturday:
// Giants vs. Eagles") as `division`/`conference` rather than `general`, so a
// market_type allowlist would silently drop real matchup contracts.
// ─────────────────────────────────────────────────────────────────────────────

const MATCHUP_CONNECTOR_RE = /\bvs\.?\b|\bversus\b|\b@\b|\bat\b/i;

const MONTH_NAMES = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

// Tolerance for "does this contract's date match the scheduled kickoff".
// 1.5 days absorbs the UTC-vs-local calendar-day rollover for late-kickoff
// games (e.g. a Sunday Night Football game at 8:20pm ET is already the next
// calendar day in UTC) without being loose enough to let a different week's
// game through.
const DATE_TOLERANCE_DAYS = 1.5;

/**
 * Extract a best-effort date from a contract's title/ticker.
 * @returns {{year:number|null, month:number, day:number, timestamp:number|null}|null}
 */
function extractContractDate(contract) {
  const text = `${contract.title || ''} ${contract.ticker || ''}`;

  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    const timestamp = Date.UTC(year, month - 1, day);
    if (!Number.isNaN(timestamp)) return { year, month, day, timestamp };
  }

  const named = text.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})\b/i
  );
  if (named) {
    const month = MONTH_NAMES[named[1].toLowerCase()];
    const day = Number(named[2]);
    if (month && day >= 1 && day <= 31) return { year: null, month, day, timestamp: null };
  }

  return null;
}

/** Does a parsed contract date agree with the scheduled kickoff? */
function contractDateAgrees(gameDate, contractDate) {
  if (!gameDate || !contractDate) return false;

  if (contractDate.timestamp != null) {
    const diffDays = Math.abs(gameDate.getTime() - contractDate.timestamp) / 86400000;
    return diffDays <= DATE_TOLERANCE_DAYS;
  }

  // Month/day-only mention (no year in the text, e.g. "their January 30
  // matchup") -- compare calendar month/day against the scheduled kickoff,
  // ignoring year, since an NFL season spans a calendar-year boundary.
  const gameMonth = gameDate.getUTCMonth() + 1;
  const gameDay = gameDate.getUTCDate();
  return contractDate.month === gameMonth && Math.abs(contractDate.day - gameDay) <= 1;
}

// Memoized per-contract team-name index so repeated getContractForGame()
// calls (one per rendered matchup card -- up to 300+ per dashboard render)
// don't re-tokenize the full ~2k-contract list on every call.
let _teamIndexCache = null; // { contracts, index: [{ contract, teams: Set }] }

function extractContractTeams(contract) {
  const text = `${contract.title || ''} ${contract.ticker || ''}`;
  const tokens = text.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  const teams = new Set();
  for (const token of tokens) {
    const team = normalizeTeam(token);
    if (team) teams.add(team);
  }
  if (contract.team) {
    const team = normalizeTeam(contract.team);
    if (team) teams.add(team);
  }
  return teams;
}

function getContractTeamIndex() {
  const contracts = getPredictionMarketContracts();
  if (_teamIndexCache && _teamIndexCache.contracts === contracts) {
    return _teamIndexCache.index;
  }
  const index = contracts.map((contract) => ({ contract, teams: extractContractTeams(contract) }));
  _teamIndexCache = { contracts, index };
  return index;
}

/**
 * Find the prediction market contract for a specific head-to-head game
 * matchup. Only returns a contract that explicitly names BOTH teams (as
 * whole tokens) with head-to-head wording, and whose date (when parseable)
 * agrees with the scheduled kickoff -- award/division/win-totals/futures
 * contracts, and contracts about a *different* game between the same two
 * teams (rematches, preseason vs. regular season, prior seasons), are never
 * returned here.
 * @param {string} visitorAbbr - Visitor team code (e.g. 'BAL')
 * @param {string} homeAbbr - Home team code (e.g. 'KC')
 * @param {string|null} [gameDateStr] - Scheduled kickoff, ISO/parsable by `Date`.
 *   Strongly recommended: without it, a contract is only used when it is the
 *   single unambiguous team-matching, correctly-worded candidate.
 * @returns {Object|null} Best prediction market contract for the matchup
 */
export function getContractForGame(visitorAbbr, homeAbbr, gameDateStr = null) {
  const visitorTeam = normalizeTeam(visitorAbbr);
  const homeTeam = normalizeTeam(homeAbbr);
  if (!visitorTeam || !homeTeam) return null;

  const index = getContractTeamIndex();
  const teamMatches = index.filter(({ teams }) => teams.has(visitorTeam) && teams.has(homeTeam));
  if (teamMatches.length === 0) return null;

  const candidates = teamMatches.filter(({ contract }) => MATCHUP_CONNECTOR_RE.test(contract.title || ''));
  if (candidates.length === 0) return null;

  const gameDate = gameDateStr ? new Date(gameDateStr) : null;
  const validGameDate = gameDate && !Number.isNaN(gameDate.getTime()) ? gameDate : null;

  const dated = [];
  const undated = [];
  for (const entry of candidates) {
    const contractDate = extractContractDate(entry.contract);
    if (contractDate) dated.push({ ...entry, contractDate });
    else undated.push(entry);
  }

  if (validGameDate) {
    const agreeing = dated.filter((e) => contractDateAgrees(validGameDate, e.contractDate));
    if (agreeing.length > 0) {
      agreeing.sort((a, b) => (b.contract.volume_24h || 0) - (a.contract.volume_24h || 0));
      return agreeing[0].contract;
    }
    // Dated candidates exist but none agree with the scheduled kickoff --
    // these are real contracts about a different date (a rematch, a prior
    // season, or a preseason meeting), not this game. Do not fall through
    // to an undated guess when we have concrete evidence of a mismatch.
    if (dated.length > 0) return null;
  } else if (dated.length === 1) {
    // No scheduled date to compare against -- a single, unambiguous dated
    // candidate is still safe to trust.
    return dated[0].contract;
  } else if (dated.length > 1) {
    return null; // ambiguous without a game date to disambiguate
  }

  if (undated.length === 1) return undated[0].contract;
  return null; // zero, or multiple ambiguous, undated candidates -- don't guess
}
