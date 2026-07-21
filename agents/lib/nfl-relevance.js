// agents/lib/nfl-relevance.js
// ═══════════════════════════════════════════════════════════════════════════════
// NFL relevance pre-filter, extracted from agents/podcast-ingest.js (2026-07-20,
// S291) so scripts/podcast-diarize-backfill.js can apply the SAME filter when
// selecting already-ingested episodes to re-diarize, not just newly-discovered
// RSS items.
//
// Why this matters: podcast-ingest.js's filter only ran at ingest time, going
// forward. Episodes ingested before that filter existed (or from a run where a
// title's non-NFL signal wasn't yet in the hint list) can still sit in
// podcast_transcripts unfiltered — e.g. a "WORLD CUP FINAL BETTING PREVIEW"
// episode on Sharp or Square got selected by an early, date-only-sorted version
// of the backfill script's target picker and burned a real AssemblyAI
// diarization call on non-NFL content (caught live during the first M6 pilot
// run, 2026-07-20). Applying this filter at SELECTION time (not just ingest
// time) closes that gap for any already-ingested backlog, not just new items.
//
// Most configured feeds are multi-sport betting shows (Action Network, Even
// Money, The Favorites, Sharp or Square, BettingPros), so their RSS/backlog
// carries plenty of non-NFL episodes (PGA, NBA, MLB, UFC, World Cup, VC
// crossovers). Permissive by design: skip only on an unambiguous non-NFL
// signal; always keep anything with an explicit NFL/team hint; keep
// generically-titled betting episodes (e.g. "Best Bets July 14"), which may
// still contain NFL segments.
// ═══════════════════════════════════════════════════════════════════════════════

export const NFL_TITLE_HINTS = [
  'nfl', 'football', 'super bowl', 'afc', 'nfc', 'quarterback', ' qb ', 'training camp',
  'cardinals', 'falcons', 'ravens', 'bills', 'panthers', 'bears', 'bengals', 'browns',
  'cowboys', 'broncos', 'lions', 'packers', 'texans', 'colts', 'jaguars', 'chiefs',
  'raiders', 'chargers', 'dolphins', 'vikings', 'patriots', 'saints', 'giants',
  'jets', 'eagles', 'steelers', '49ers', 'niners', 'seahawks', 'buccaneers',
  'titans', 'commanders',
];

export const NON_NFL_TITLE_HINTS = [
  'pga', 'golf', 'masters', 'ryder cup', 'liv golf',
  'nba', 'wnba', 'basketball',
  'mlb', 'baseball', 'world series',
  'nhl', 'hockey', 'stanley cup',
  'soccer', 'premier league', ' epl ', 'uefa', 'champions league', 'la liga', ' mls ', 'world cup',
  'ufc', 'mma', 'boxing', 'fight night',
  'tennis', 'wimbledon', ' atp ', ' wta ',
  'nascar', 'formula 1', ' f1 ', 'indycar',
  'venture capital', 'venture capitalist', 'crypto', 'stock market', 'wall street',
  'college basketball', 'cbb',
];

/**
 * Permissive NFL-relevance check on an episode title.
 * Keep if any explicit NFL hint is present; else skip only if a clear non-NFL
 * sport/topic signal is present; otherwise keep (generic betting episode).
 */
export function isNflRelevantEpisode(title) {
  const t = ` ${String(title ?? '').toLowerCase()} `;
  if (NFL_TITLE_HINTS.some(h => t.includes(h))) return true;
  if (NON_NFL_TITLE_HINTS.some(h => t.includes(h))) return false;
  return true;
}
