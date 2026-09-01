// agents/lib/sportsRelevanceFilter.js
// ═══════════════════════════════════════════════════════════════════════════════
// Sports Relevance Gate for Personal Twitter Bookmarks & Ingestion
// Isolates ONLY NFL / Pro Football betting & fantasy intel.
// Excludes CFB (College Football), CBB (College Basketball), and non-NFL sports.
// ═══════════════════════════════════════════════════════════════════════════════

const NFL_SPECIFIC_KEYWORDS = [
  'nfl', 'super bowl', 'fantasy football', 'touchdown', 'quarterback', 'qb',
  'chiefs', 'ravens', '49ers', 'eagles', 'bills', 'cowboys', 'patriots', 'packers', 'bears',
  'lions', 'dolphins', 'texans', 'bengals', 'browns', 'steelers', 'jaguars', 'colts',
  'broncos', 'raiders', 'chargers', 'rams', 'seahawks', 'cardinals', 'falcons', 'panthers',
  'saints', 'buccaneers', 'vikings', 'titans', 'giants', 'jets', 'commanders',
  'mahomes', 'lamar', 'mccaffrey', 'allen', 'burrow', 'hurts', 'stroud', 'darnold',
  'nabers', 'harrison jr', 'pacheco', 'chase', 'jefferson', 'lamb', 'hill', 'kelce'
];

const GENERIC_BETTING_TERMS = [
  'ats', 'spread', 'moneyline', 'over/under', 'steam', 'sharp', 'closing line', 'parlay', 'teaser', 'win total', 'player prop'
];

const EXCLUDED_KEYWORDS = [
  // College sports exclusions (CFB & CBB)
  'cfb', 'college football', 'ncaa football', 'ncaa fbs', 'sec football', 'big ten football',
  'cbb', 'ncaa basketball', 'college basketball', 'march madness', 'final four', 'bracket', 'hoops',
  'college hoops', 'kenpom', 'barttorvik', 'net rating', 'z-rating',
  // Non-target topics
  'crypto', 'bitcoin', 'eth', 'nft', 'politics', 'election', 'democrat', 'republican',
  'recipe', 'movie', 'actor', 'hollywood', 'gaming', 'ps5', 'xbox', 'nba', 'mlb', 'baseball'
];

function hasKeyword(content, kw) {
  return new RegExp(`\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(content);
}

// 2026-09-01: a second, narrower gate used ONLY to decide whether a bookmark
// bridges into research_intel_notes/research_pick_signals (the betting
// committee's evidence pool) -- NOT whether it passes isNflBettingIntel above,
// which stays broad so vault_notes/local files keep capturing it for Andy's
// own reference either way.
//
// Andy's own framing (2026-09-01): fantasy content about a player's breakout
// potential, usage, or role IS betting-relevant (it feeds prop/line thinking)
// -- it's fantasy DRAFT mechanics specifically (pick-slot value, ADP-vs-
// projection framing, round-by-round strategy) that isn't. Real examples that
// shaped this: "#NFL Injury Updates ... Suspect ADP will rise" and "Bookmark
// this for your fantasy drafts (and bets)" both mention draft/ADP in passing
// but are genuine usage/injury signal -- KEEP. "1.11 AND 1.12 ARE SECRETLY
// THE BEST DRAFT SPOTS" and "YOU'RE WASTING THE 1.01 OR 1.02" are pure
// draft-slot strategy -- EXCLUDE. So a bare "adp" mention is deliberately NOT
// a trigger by itself (too many false positives against legitimate injury/
// usage content); only pick-slot notation (a near-unique fantasy-draft
// convention -- real betting lines/totals use one decimal digit, e.g. -2.5,
// 38.5, never a zero-padded two-digit pick number like "1.11") and explicit
// draft-strategy phrasing trigger the exclusion.
const DRAFT_MECHANICS_PHRASES = [
  'dominate your draft', 'draft spot', 'draft spots', 'mock draft',
  'draft board', 'draft kit', 'draft prep', 'draft strategy',
  'best ball draft', 'auction draft', 'snake draft', 'keeper league',
  'dynasty rankings',
];
const DRAFT_PICK_SLOT_RE = /\b\d{1,2}\.\d{2}\b/; // e.g. "1.01", "1.11", "1.12" (round.pick)

export function isFantasyDraftMechanics(text = '') {
  const content = String(text).toLowerCase();
  if (DRAFT_MECHANICS_PHRASES.some((kw) => hasKeyword(content, kw))) return true;
  return DRAFT_PICK_SLOT_RE.test(content);
}

export function isNflBettingIntel(text = '') {
  const content = String(text).toLowerCase();

  // 1. Exclude non-target topics (including CFB and CBB)
  if (EXCLUDED_KEYWORDS.some(kw => hasKeyword(content, kw))) {
    return { isRelevant: false, sport: null, reason: 'Matched non-target exclusion keyword (CFB/CBB/Other)' };
  }

  // 2. Check NFL specific match
  const nflMatch = NFL_SPECIFIC_KEYWORDS.filter(kw => hasKeyword(content, kw));
  const bettingMatch = GENERIC_BETTING_TERMS.filter(kw => hasKeyword(content, kw));

  if (nflMatch.length >= 1) {
    return {
      isRelevant: true,
      sport: 'NFL',
      matched_keywords: [...nflMatch, ...bettingMatch]
    };
  }

  return {
    isRelevant: false,
    sport: null,
    reason: 'Did not match NFL specific keywords'
  };
}
