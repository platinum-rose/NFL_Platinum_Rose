// src/lib/experts.js
// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED NFL EXPERTS DATABASE - Single Source of Truth
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Expert/Show Database
 * Each entry has:
 * - id: unique identifier
 * - name: display name
 * - source: primary show/outlet for display
 * - sourceType: 'podcast' | 'rss_article' | 'tweet' | 'newsletter' | 'ai'
 * - ingestStatus: 'active' | 'manual' | 'deferred'
 * - note: (optional) context on where intel surfaces
 * - aliases: lowercase variations for name matching in ingested content
 * - isShow: true = the show/outlet itself; false = individual host/author
 * - record/lastWeek: season pick-tracking fields
 */
export const EXPERTS = [

  // ═══════════════════════════════════════════════════════════════════════════
  // SHOWS / SOURCES (id 1–11)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 1,
    name: 'Sharp or Square',
    source: 'Sharp or Square',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'Chad Millman + Simon Hunter. Moved from VSiN to iHeartPodcasts/The Volume. Same Omny RSS feed URL — auto-ingested via podcast_feeds.',
    aliases: ['sharp or square', 'sharpsquare', 'sos'],
    isShow: true,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 2,
    name: 'Even Money',
    source: 'Even Money',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'VSiN podcast — auto-ingested via podcast_feeds',
    aliases: ['even money', 'evenmoney'],
    isShow: true,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 3,
    name: 'Sunday Sixpack',
    source: 'Action Network',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'Action Network podcast — hosts Raybon + Stuckey also appear in Action Network RSS articles',
    aliases: ['sunday sixpack', 'sixpack', '6pack', 'sunday 6pack'],
    isShow: true,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 4,
    name: 'The Favorites',
    source: 'The Favorites',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'Action Network / Playmaker / iHeartPodcasts podcast — relaunched 2025 with hosts Kendra Middleton, Brandon Kravitz, Stuckey. Simon Hunter + Chad Millman departed to launch Sharp or Square.',
    aliases: ['the favorites', 'favorites', 'the faves', 'faves'],
    isShow: true,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 5,
    name: 'Action Network Sports Betting',
    source: 'Action Network',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'Action Network flagship betting podcast — Koerner, Simon Hunter, Brandon Anderson, Collin Wilson + rotating guests',
    aliases: ['action network sports betting', 'action network podcast', 'ansb', 'action podcast'],
    isShow: true,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 6,
    name: 'Betting Primer',
    source: 'Action Network',
    sourceType: 'rss_article',
    ingestStatus: 'active',
    note: 'Weekly betting article by Evan Abrams on Action Network — surfaces via Action Network RSS feed',
    aliases: ['betting primer', 'primer'],
    isShow: true,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 7,
    name: "Tuley's Takes",
    source: 'VSiN',
    sourceType: 'rss_article',
    ingestStatus: 'active',
    note: "Dave Tuley's weekly betting column on VSiN — surfaces via VSiN RSS feed",
    aliases: ["tuley's takes", 'tuleys takes', 'tuley takes', "tuley's"],
    isShow: true,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 8,
    name: 'Sharp Football Analysis',
    source: 'Sharp Football Analysis',
    sourceType: 'rss_article',
    ingestStatus: 'active',
    note: 'Warren Sharp — analytical site + podcast, both ingested',
    aliases: ['sharp football analysis', 'sharp football', 'sharpfootball'],
    isShow: true,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 9,
    name: 'Walter Football',
    source: 'Walter Football',
    sourceType: 'rss_article',
    ingestStatus: 'deferred',
    note: 'walterfootball.com — free betting insight/picks site; scraper not yet built',
    aliases: ['walter football', 'walterfootball', 'walter'],
    isShow: true,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 10,
    name: 'BettingPros Podcast',
    source: 'BettingPros',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'iHeartPodcasts/The Volume weekly show. Rotating roster: Perrault, Pisapia, Furman, Fitzmaurice, Erickson, Welsh, Bogman, Woolcock + guests. Also has daily shows (The Daily Juice, Fast Break Bets) — main feed only for now.',
    aliases: ['bettingpros podcast', 'bettingpros', 'betting pros podcast', 'betting pros'],
    isShow: true,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 11,
    name: 'Lock n Cash',
    source: 'Lock n Cash',
    sourceType: 'tweet',
    ingestStatus: 'manual',
    note: 'Twitter/X feed — manual paste ingest until RSSHub or scraper is available',
    aliases: ['lock n cash', 'lockncash', 'lock and cash', 'lock&cash'],
    isShow: true,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 12,
    name: '32BeatWriters Podcast Network',
    source: '32BeatWriters',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: '32BeatWriters official podcast network & YouTube channel (@32beatwriters) — beat writer reports & fantasy/betting intel',
    aliases: ['32beatwriters podcast network', '32beatwriters', '32 beat writers', '32bw'],
    isShow: true,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 11,
    name: 'Hitman',
    source: 'Hitman',
    sourceType: 'tweet',
    ingestStatus: 'manual',
    note: 'Sharp Twitter/X personality — surfaces via manual tweet paste',
    aliases: ['hitman', 'hit man'],
    isShow: true,
    record: '0-0',
    lastWeek: '0-0',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INDIVIDUAL HOSTS / AUTHORS (id 12+)
  // Note: experts who appear on multiple shows carry aliases for each context.
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 37,
    name: 'Platinum Rose AI',
    source: 'Platinum Rose AI',
    sourceType: 'ai',
    ingestStatus: 'manual',
    note: 'Paper-tracked AI expert. Official picks are locked through the human-verified Platinum Rose AI ledger, not podcast or RSS ingest.',
    aliases: ['platinum rose ai', 'platinum rose', 'pra', 'pr ai'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },

  {
    id: 12,
    name: 'Chad Millman',
    source: 'Sharp or Square',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'Co-host Sharp or Square (iHeartPodcasts/The Volume). Previously co-hosted The Favorites and Sharp or Square on VSiN.',
    aliases: ['chad millman', 'millman', 'chad'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 13,
    name: 'Simon Hunter',
    source: 'Sharp or Square',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'Professional sports bettor. Co-host Sharp or Square (iHeartPodcasts/The Volume). Previously co-hosted The Favorites and Sharp or Square on VSiN.',
    aliases: ['simon hunter', 'hunter', 'simon'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 26,
    name: 'Matt Perrault',
    source: 'BettingPros',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'BettingPros Podcast host/analyst',
    aliases: ['matt perrault', 'perrault'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 27,
    name: 'Joe Pisapia',
    source: 'BettingPros',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'BettingPros Podcast host/analyst',
    aliases: ['joe pisapia', 'pisapia'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 28,
    name: 'Terrell Furman Jr.',
    source: 'BettingPros',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'BettingPros Podcast host/analyst',
    aliases: ['terrell furman', 'furman', 'terrell furman jr', 'tj furman'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 29,
    name: 'Pat Fitzmaurice',
    source: 'BettingPros',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'BettingPros Podcast host/analyst',
    aliases: ['pat fitzmaurice', 'fitzmaurice', 'pat fitz'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 30,
    name: 'Andrew Erickson',
    source: 'BettingPros',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'BettingPros Podcast host/analyst',
    aliases: ['andrew erickson', 'erickson', 'andy erickson'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 31,
    name: 'Chris Welsh',
    source: 'BettingPros',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'BettingPros Podcast host/analyst',
    aliases: ['chris welsh', 'welsh'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 32,
    name: 'Scott Bogman',
    source: 'BettingPros',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'BettingPros Podcast host/analyst',
    aliases: ['scott bogman', 'bogman'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 33,
    name: 'Seth Woolcock',
    source: 'BettingPros',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'BettingPros Podcast host/analyst',
    aliases: ['seth woolcock', 'woolcock', 'seth wilcock', 'wilcock'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 35,
    name: 'Kendra Middleton',
    source: 'The Favorites',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'Co-host The Favorites (relaunched, iHeartPodcasts/Playmaker)',
    aliases: ['kendra middleton', 'middleton', 'kendra'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 36,
    name: 'Brandon Kravitz',
    source: 'The Favorites',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'Co-host The Favorites (relaunched, iHeartPodcasts/Playmaker)',
    aliases: ['brandon kravitz', 'kravitz'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 14,
    name: 'Ross Tucker',
    source: 'Even Money',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'Co-host Even Money (VSiN)',
    aliases: ['ross tucker', 'tucker', 'ross'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 15,
    name: 'Steve Fezzik',
    source: 'Even Money',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'Co-host Even Money (VSiN) — professional sharp bettor',
    aliases: ['steve fezzik', 'fezzik', 'fezzick', 'fezik', 'fezick', 'bezic', 'bessic', 'pezik', 'fesik'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 16,
    name: 'Chris Raybon',
    source: 'Sunday Sixpack',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'Co-host Sunday Sixpack (Action Network) — also appears in Action Network articles',
    aliases: ['chris raybon', 'raybon', 'rayburn', 'rabon'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 17,
    name: 'Stuckey',
    source: 'Sunday Sixpack',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'Co-host Sunday Sixpack (Action Network) — also appears in Action Network articles',
    aliases: ['stuckey', 'stucky', 'stuckie', 'stuck'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 18,
    name: 'Evan Abrams',
    source: 'Action Network',
    sourceType: 'rss_article',
    ingestStatus: 'active',
    note: 'Author of weekly Betting Primer column on Action Network',
    aliases: ['evan abrams', 'abrams', 'evan'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 19,
    name: 'Dave Tuley',
    source: 'VSiN',
    sourceType: 'rss_article',
    ingestStatus: 'active',
    note: "VSiN author — Tuley's Takes weekly column surfaces via VSiN RSS",
    aliases: ['dave tuley', 'tuley', 'david tuley'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 20,
    name: 'Warren Sharp',
    source: 'Sharp Football Analysis',
    sourceType: 'rss_article',
    ingestStatus: 'active',
    note: 'Founder of Sharp Football Analysis — analytical site + podcast both ingested',
    aliases: ['warren sharp', 'sharp', 'warren'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 21,
    name: 'Walter Cherepinsky',
    source: 'Walter Football',
    sourceType: 'rss_article',
    ingestStatus: 'deferred',
    note: 'Author/owner of walterfootball.com — scraper not yet built',
    aliases: ['walter cherepinsky', 'walter football author', 'cherepinsky'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 22,
    name: 'Hitman',
    source: 'Hitman',
    sourceType: 'tweet',
    ingestStatus: 'manual',
    note: 'Sharp Twitter/X personality — manual paste ingest',
    aliases: ['hitman host', 'hitman picks'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 23,
    name: 'Sean Koerner',
    source: 'Action Network',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'Action Network Sports Betting podcast host + Action Network article author',
    aliases: ['sean koerner', 'koerner', 'sean'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 24,
    name: 'Brandon Anderson',
    source: 'Action Network',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'Action Network Sports Betting podcast host + Action Network article author',
    aliases: ['brandon anderson', 'anderson', 'brandon'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },
  {
    id: 25,
    name: 'Collin Wilson',
    source: 'Action Network',
    sourceType: 'podcast',
    ingestStatus: 'active',
    note: 'Action Network Sports Betting podcast host + article author',
    aliases: ['collin wilson', 'wilson', 'collin'],
    isShow: false,
    record: '0-0',
    lastWeek: '0-0',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// PRECOMPUTED LOOKUPS
// ═══════════════════════════════════════════════════════════════════════════════

// Build alias → expert lookup
const _expertAliasLookup = {};
EXPERTS.forEach(expert => {
  expert.aliases.forEach(alias => {
    if (!_expertAliasLookup[alias]) {
      _expertAliasLookup[alias] = [];
    }
    _expertAliasLookup[alias].push(expert);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Find an expert by any name variation (handles misspellings)
 * @param {string} rawName - Raw expert name from transcript/import
 * @param {object} options - { preferShow: boolean, sourceHint: string }
 * @returns {object|null} - Expert object or null
 */
export function findExpert(rawName, options = {}) {
  if (!rawName) return null;

  const { preferShow = false, sourceHint = null } = options;
  const clean = String(rawName).toLowerCase().trim();

  // 1. Direct alias lookup
  if (_expertAliasLookup[clean]) {
    const matches = _expertAliasLookup[clean];

    if (sourceHint) {
      const sourceMatch = matches.find(e =>
        e.source.toLowerCase().includes(sourceHint.toLowerCase())
      );
      if (sourceMatch) return sourceMatch;
    }

    if (preferShow) {
      return matches.find(e => e.isShow) || matches[0];
    }
    return matches.find(e => !e.isShow) || matches[0];
  }

  // 2. Partial match (for compound names like "Ross from Even Money")
  for (const [alias, experts] of Object.entries(_expertAliasLookup)) {
    if (clean.includes(alias) || alias.includes(clean)) {
      if (preferShow) {
        return experts.find(e => e.isShow) || experts[0];
      }
      return experts.find(e => !e.isShow) || experts[0];
    }
  }

  // 3. First name match (e.g. "Ross" → "Ross Tucker")
  const firstName = clean.split(' ')[0];
  if (firstName.length >= 3) {
    for (const expert of EXPERTS) {
      if (expert.name.toLowerCase().startsWith(firstName)) {
        return expert;
      }
    }
  }

  return null;
}

/**
 * Find expert by ID
 * @param {number} id - Expert ID
 * @returns {object|null}
 */
export function getExpertById(id) {
  return EXPERTS.find(e => e.id === id) || null;
}

/**
 * Get all experts for a specific show/source
 * @param {string} source - Show name
 * @returns {object[]}
 */
export function getExpertsBySource(source) {
  const cleanSource = source.toLowerCase();
  return EXPERTS.filter(e =>
    e.source.toLowerCase() === cleanSource && !e.isShow
  );
}

/**
 * Get only show/outlet entries (not individual hosts)
 * @returns {object[]}
 */
export function getShows() {
  return EXPERTS.filter(e => e.isShow);
}

/**
 * Get only individual hosts/authors (not shows)
 * @returns {object[]}
 */
export function getHosts() {
  return EXPERTS.filter(e => !e.isShow);
}

/**
 * Get active sources only (excludes manual and deferred)
 * @returns {object[]}
 */
export function getActiveSources() {
  return EXPERTS.filter(e => e.isShow && e.ingestStatus === 'active');
}

/**
 * Match expert name from AI output (handles common errors)
 * @param {string} rawName - Raw name from AI/transcript
 * @param {object[]} expertList - Optional custom expert list
 * @returns {number} - Expert ID or 0 if not found
 */
export function matchExpertId(rawName, expertList = EXPERTS) {
  const expert = findExpert(rawName);
  if (expert) return expert.id;

  // Fallback: substring match in provided list
  const clean = String(rawName).toLowerCase();
  const match = expertList.find(e =>
    clean.includes(e.name.toLowerCase().split(' ')[0])
  );

  return match ? match.id : 0;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY COMPATIBILITY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * INITIAL_EXPERTS format (for components expecting the old format)
 * Strips internal fields for backward compatibility
 */
export const INITIAL_EXPERTS = EXPERTS.map(({ aliases: _aliases, isShow: _isShow, sourceType: _sourceType, ingestStatus: _ingestStatus, note: _note, ...rest }) => rest);

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════
// Primary:  EXPERTS, findExpert, getExpertById, matchExpertId
// Utility:  getExpertsBySource, getShows, getHosts, getActiveSources
// Legacy:   INITIAL_EXPERTS
