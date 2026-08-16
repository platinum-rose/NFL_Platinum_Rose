// agents/lib/sportsRelevanceFilter.js
// ═══════════════════════════════════════════════════════════════════════════════
// Sports Relevance Gate for Personal Twitter Bookmarks & Ingestion
// Isolates ONLY Football (NFL / CFB) and College Basketball (CBB) betting intel.
// ═══════════════════════════════════════════════════════════════════════════════

const NFL_CFB_KEYWORDS = [
  'nfl', 'cfb', 'college football', 'quarterback', 'qb', 'touchdown', 'super bowl',
  'chiefs', 'ravens', '49ers', 'eagles', 'bills', 'cowboys', 'patriots', 'packers', 'bears',
  'lions', 'dolphins', 'texans', 'bengals', 'browns', 'steelers', 'jaguars', 'colts',
  'mahomes', 'lamar', 'mccaffrey', 'allen', 'burrow', 'hurts', 'stroud', 'darnold',
  'ats', 'spread', 'moneyline', 'over/under', 'steam', 'sharp', 'closing line', 'parlay', 'teaser'
];

const CBB_KEYWORDS = [
  'cbb', 'ncaa', 'college basketball', 'march madness', 'final four', 'bracket', 'hoops',
  'duke', 'unc', 'kansas', 'kentucky', 'uconn', 'gonzaga', 'houston', 'purdue', 'auburn',
  'tennessee', 'iowa state', 'creighton', 'marquette', 'baylor', 'arizona', 'alabama',
  'college hoops', 'spread', 'moneyline', 'over/under', 'net rating', 'kenpom', 'barttorvik'
];

const EXCLUDED_KEYWORDS = [
  'crypto', 'bitcoin', 'eth', 'nft', 'politics', 'election', 'democrat', 'republican',
  'recipe', 'movie', 'actor', 'hollywood', 'gaming', 'ps5', 'xbox', 'nba finals', 'mlb baseball'
];

function hasKeyword(content, kw) {
  return new RegExp(`\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(content);
}

export function isFootballOrCbbBettingIntel(text = '') {
  const content = String(text).toLowerCase();

  // 1. Exclude non-target topics
  if (EXCLUDED_KEYWORDS.some(kw => hasKeyword(content, kw))) {
    return { isRelevant: false, sport: null, reason: 'Matched non-target exclusion keyword' };
  }

  // 2. Check NFL / CFB match
  const nflMatch = NFL_CFB_KEYWORDS.filter(kw => hasKeyword(content, kw));
  // 3. Check CBB match
  const cbbMatch = CBB_KEYWORDS.filter(kw => hasKeyword(content, kw));

  if (nflMatch.length >= 1) {
    return {
      isRelevant: true,
      sport: 'NFL',
      matched_keywords: nflMatch
    };
  }

  if (cbbMatch.length >= 1) {
    return {
      isRelevant: true,
      sport: 'NCAA_CBB',
      matched_keywords: cbbMatch
    };
  }

  return {
    isRelevant: false,
    sport: null,
    reason: 'Did not match NFL/CFB or CBB betting keywords'
  };
}

