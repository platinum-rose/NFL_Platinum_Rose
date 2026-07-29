// scripts/lib/gemini-pick-normalize.js
// ═══════════════════════════════════════════════════════════════════════════════
// Shared normalization for Gemini's extracted_picks / analysis_notes schema
// (docs/PODCAST_HOLISTIC_INTEL_EXTRACTION_PLAN.md Phase 1).
//
// This logic already exists hand-duplicated 3x in the codebase (scripts/
// build-youtube-futures-intel-review.js, scripts/youtube-podcast-sweep.js,
// scripts/gemini-podcast-shadow-harness.js) — the Phase 4 manual quality read
// found and had to mirror 3 real bug fixes across all 3 copies (a 12-pick
// market-taxonomy gap, and the "UNKNOWN contains substring NO" side bug).
// Rather than adding a 4th hand-mirrored copy for the new production agent
// (agents/podcast-gemini-intel.js), this module is the single source of
// truth going forward for any NEW consumer. The existing 3 copies are left
// as-is here (each is already live-verified production code; retrofitting
// them to import this module is a separate, deliberate follow-up, not bundled
// into the Phase 5 production-wiring change).
// ═══════════════════════════════════════════════════════════════════════════════

export const TEAM_FIXUPS = { JAC: 'JAX', LOS: 'LAC' };

export const VALID_TEAMS = new Set([
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET', 'GB',
  'HOU', 'IND', 'JAX', 'KC', 'LV', 'LAC', 'LAR', 'MIA', 'MIN', 'NE', 'NO', 'NYG',
  'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB', 'TEN', 'WAS',
]);

export const YES_NO_MARKETS = new Set([
  'division_winner', 'conference_winner', 'conference_no_1_seed', 'super_bowl_winner',
  'mvp', 'opoy', 'dpoy', 'oroy', 'droy', 'coach_of_the_year', 'no_1_overall_pick',
]);

export const FUTURES_MARKETS = new Set([
  'win_total', 'make_playoffs', 'division_winner', 'conference_winner', 'conference_no_1_seed',
  'super_bowl_winner', 'mvp', 'opoy', 'dpoy', 'oroy', 'droy', 'coach_of_the_year',
  'no_1_overall_pick',
  'comeback_player_of_the_year', 'fewest_wins', 'interceptions_leader', 'rushing_tds_leader',
  'season_receiving_yards', 'season_passing_yards', 'season_passing_tds', 'season_rushing_tds',
]);

export const NON_FUTURES_BETTING_MARKETS = new Set([
  'spread', 'game_line', 'moneyline', 'total', 'player_prop', 'player_receiving_yds',
]);

export const SURVIVOR_PICKEM_MARKETS = new Set(['survivor_pick', 'pickem_pick']);

export const NOTE_TYPE_TAG_MAP = {
  team_evaluation: ['matchup_analysis'],
  player_evaluation: ['fantasy_intel'],
  injury_or_health: ['injury_intel'],
  roster_or_depth_chart: ['roster_transaction_intel'],
  coaching_or_scheme: ['matchup_analysis'],
  matchup_analysis: ['matchup_analysis'],
  schedule_context: ['market_context'],
  fantasy_relevance: ['fantasy_intel'],
  market_sentiment: ['market_context'],
  other: ['market_context'],
};

export function normalizeMarket(raw) {
  const clean = String(raw || 'general').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (clean.includes('win_total') || clean === 'wins' || clean.includes('season_win')) return 'win_total';
  if (clean.includes('make_playoff') || clean === 'playoffs') return 'make_playoffs';
  if (clean.includes('division_winner') || clean.includes('division_champion') || clean.includes('division_champ') || clean.includes('afc_south_champ')) return 'division_winner';
  if (clean.includes('conference_no_1_seed') || clean.includes('no_1_seed') || clean.includes('number_1_seed') || clean.includes('number_one_seed')) return 'conference_no_1_seed';
  if (clean.includes('super_bowl')) return 'super_bowl_winner';
  if (clean.includes('conference_champion') || clean.includes('conference_winner') || clean.includes('nfc_conference') || clean.includes('afc_conference') || clean.includes('nfc_champion') || clean.includes('afc_champion')) return 'conference_winner';
  if (clean.includes('overall_pick') || clean.includes('no_1_overall') || clean.includes('number_1_overall')) return 'no_1_overall_pick';
  if (clean.includes('mvp') || clean.includes('most_valuable_player')) return 'mvp';
  if (clean === 'opoy' || clean.includes('offensive_player_of_the_year')) return 'opoy';
  if (clean === 'dpoy' || clean.includes('defensive_player_of_the_year')) return 'dpoy';
  if (clean === 'oroy' || clean.includes('offensive_rookie_of_the_year')) return 'oroy';
  if (clean === 'droy' || clean.includes('defensive_rookie_of_the_year')) return 'droy';
  if (clean.includes('coach_of_the_year')) return 'coach_of_the_year';
  if (clean.includes('comeback_player')) return 'comeback_player_of_the_year';
  if (clean.includes('fewest_win')) return 'fewest_wins';
  if (clean.includes('receiving_yard')) return 'season_receiving_yards';
  if (clean.includes('passing_yard')) return 'season_passing_yards';
  if (clean.includes('passing_touchdown') || clean.includes('passing_td')) return 'season_passing_tds';
  if (clean.includes('interception')) return 'interceptions_leader';
  if (clean.includes('rushing_touchdown') && clean.includes('leader')) return 'rushing_tds_leader';
  if (clean.includes('rushing_touchdown') || clean.includes('rushing_td')) return 'season_rushing_tds';
  return clean;
}

export function normalizeSide(raw, market, team = null) {
  const clean = String(raw || 'UNKNOWN').trim().toUpperCase();
  // Gemini often puts the picked team's own code in `side` for YES/NO
  // markets rather than a literal YES token (e.g. side:"TEN" for "Titans
  // win the AFC South") -- short-circuit that case before any substring
  // heuristics run. Found necessary 2026-07-28 via a direct scan of all 13
  // real processed episodes (11/85 picks, 13%, had a wrong side value due to
  // this exact gap in the 3 pre-existing hand-mirrored copies of this logic).
  if (YES_NO_MARKETS.has(market) && team && clean === String(team).toUpperCase()) return 'YES';
  if (YES_NO_MARKETS.has(market) && (clean === 'UNKNOWN' || clean.includes('OVER') || clean.includes('WIN') || clean.includes('YES') || clean.includes('TO WIN'))) return 'YES';
  if (YES_NO_MARKETS.has(market) && (clean.includes('NO') || clean.includes('UNDER') || clean.includes('FADE'))) return 'NO';
  // "UNKNOWN" contains the substring "NO" (U-N-K-N-O-W-N) — must short-circuit
  // on the exact sentinel before any substring heuristics run, else every
  // missing/null side (e.g. survivor_pick/pickem_pick) silently becomes "NO".
  if (clean === 'UNKNOWN') return 'UNKNOWN';
  if (clean.includes('OVER')) return 'OVER';
  if (clean.includes('UNDER')) return 'UNDER';
  if (clean.includes('YES') || clean.includes('WIN')) return 'YES';
  if (clean.includes('NO')) return 'NO';
  return clean;
}

export function normalizePick(p) {
  const market = normalizeMarket(p.market);
  const team = TEAM_FIXUPS[String(p.team || '').toUpperCase()] || String(p.team || 'UNK').toUpperCase();
  return {
    ...p,
    team,
    market,
    side: normalizeSide(p.side || p.selection, market, team),
    line: p.line != null && p.line !== '' ? Number(p.line) : null,
    price: p.price != null && p.price !== '' ? Number(p.price) : null,
    week: p.week != null && p.week !== '' ? Number(p.week) : null,
    source_timestamp: Number(p.source_timestamp || p.timestamp || 0),
    rationale: p.rationale || '',
  };
}

export function normalizeNote(n) {
  const teams = Array.isArray(n.teams)
    ? n.teams.map(t => TEAM_FIXUPS[String(t || '').toUpperCase()] || String(t || '').toUpperCase()).filter(t => VALID_TEAMS.has(t))
    : [];
  const players = Array.isArray(n.players) ? n.players.filter(Boolean).map(String) : [];
  return {
    ...n,
    note_type: String(n.note_type || 'other').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    teams,
    players,
    topic: n.topic || '',
    summary: n.summary || '',
    speaker: n.speaker || '',
    source_timestamp: Number(n.source_timestamp || n.timestamp || 0),
    quote: n.quote || '',
    confidence: n.confidence || 'stated',
  };
}

export function classifyPick(pick) {
  if (SURVIVOR_PICKEM_MARKETS.has(pick.market)) return 'survivor_pickem_pick';
  if (NON_FUTURES_BETTING_MARKETS.has(pick.market)) return 'non_futures_betting';
  const text = `${pick.rationale || ''}`.toLowerCase();
  if (text.includes('injury') || text.includes('acl') || text.includes('achilles') || text.includes('ligament')) return 'injury_intel';
  if (text.includes('training camp') || text.includes('camp') || text.includes('sic score')) return 'training_camp_intel';
  if (FUTURES_MARKETS.has(pick.market)) return 'futures_pick';
  return 'market_context';
}

export function classifyNote(note) {
  const tags = new Set(NOTE_TYPE_TAG_MAP[note.note_type] || ['market_context']);
  const text = `${note.topic || ''} ${note.summary || ''} ${note.quote || ''}`.toLowerCase();
  if (text.includes('injury') || text.includes('acl') || text.includes('achilles') || text.includes('ligament')) tags.add('injury_intel');
  if (text.includes('training camp') || text.includes('camp') || text.includes('sic score')) tags.add('training_camp_intel');
  if (text.includes('fantasy') || text.includes('target share') || text.includes('breakout') || text.includes('bust') || text.includes('waiver')) tags.add('fantasy_intel');
  if (text.includes('trade') || text.includes('depth chart') || text.includes('coaching staff') || text.includes('signed') || text.includes('released') || text.includes('cut from')) tags.add('roster_transaction_intel');
  if (text.includes('survivor') || text.includes("pick'em") || text.includes('pickem') || text.includes('pick em')) tags.add('survivor_pickem_intel');
  return Array.from(tags);
}
