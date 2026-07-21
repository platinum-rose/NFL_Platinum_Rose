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
  // Named PGA Tour events -- Action Network's remaining backlog is mostly this
  // tour's annual rotation, and none of these titles say "golf" or "pga"
  // explicitly. Found live 2026-07-21 reviewing the task-9 dry-run: 20 of 23
  // Action Network episodes selected were golf previews with 0 NFL content.
  'travelers championship', 'memorial tournament', 'charles schwab challenge',
  'byron nelson', 'truist championship', 'rbc heritage', 'valero texas open',
  'houston open', 'valspar championship', 'players championship',
  'arnold palmer invitational', 'john deere classic', 'canadian open',
  'cadillac championship', 'scottish open', 'the open championship',
  'us open betting', 'genesis invitational', 'invitational betting preview',
  'nba', 'wnba', 'basketball',
  'mlb', 'baseball', 'world series',
  'nhl', 'hockey', 'stanley cup',
  'soccer', 'premier league', ' epl ', 'uefa', 'champions league', 'la liga', ' mls ', 'world cup',
  'ufc', 'mma', 'boxing', 'fight night',
  'tennis', 'wimbledon', ' atp ', ' wta ',
  'nascar', 'formula 1', ' f1 ', 'indycar',
  'venture capital', 'venture capitalist', 'crypto', 'stock market', 'wall street',
  'college basketball', 'cbb', 'march madness', 'final four', 'sweet 16', 'elite eight',
  // Horse racing -- Kentucky Derby / Preakness / Belmont are the Triple Crown,
  // none of them say a sport name in the title.
  'kentucky derby', 'preakness', 'belmont stakes', 'triple crown',
  // Non-sport award shows that showed up in the backlog (e.g. "Academy Awards
  // Betting Preview") -- these hosts also bet on entertainment markets.
  'academy awards', 'oscars', 'grammys', 'emmys',
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
