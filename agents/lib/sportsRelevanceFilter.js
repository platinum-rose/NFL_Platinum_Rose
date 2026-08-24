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

export function isFootballOrCbbBettingIntel(text = '') {
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
