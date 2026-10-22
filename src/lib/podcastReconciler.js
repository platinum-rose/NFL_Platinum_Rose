// src/lib/podcastReconciler.js
// ═══════════════════════════════════════════════════════════════════════════════
// Dual-podcast pick reconciliation (ATLAS spec 2026-10-20 §1A).
//
// Two pipelines extract picks from the same shows:
//   1. Audio RSS → Whisper/AssemblyAI → GPT-4o  (podcast_transcripts.picks)
//      pick shape: { category, subject, selection, team1, team2, line, summary,
//                    confidence, quality_score, week, season, speaker?, ... }
//   2. YouTube → Gemini                          (podcast_gemini_intel.picks)
//      pick shape: { team, market, side, line, price, week, speaker,
//                    source_timestamp, rationale }
// Both reference the same podcast_episodes.id, so an episode that exists on
// Spotify/RSS AND YouTube gets its picks counted twice unless reconciled.
//
// reconcilePodcastPicks(audioPicks, youtubePicks) merges cross-pipeline
// duplicates into ONE pick and passes single-pipeline picks through unchanged.
//
// IMPORTANT: a match is NOT corroboration. The audio feed and the YouTube
// video are the same host saying the same thing once — two transcriptions of
// one opinion. So a merged pick counts exactly once, gets NO confidence boost
// and NO extra consensus weight. `dual_extraction: true` only records that
// both extraction pipelines agreed on what was said (an extraction-quality
// signal), nothing about the pick itself.
//
// Pure module — no Supabase / network / DOM. Safe for browser + Node tests.
// ═══════════════════════════════════════════════════════════════════════════════

import { getTeamAbbreviation } from './teams.js';

export const SOURCE_AUDIO = 'audio_rss';
export const SOURCE_YOUTUBE = 'youtube_gemini';
export const DUAL_SOURCE_BADGE = 'Audio + Video (same pick, counted once)';
export const PUBLISH_WINDOW_MS = 48 * 3600 * 1000;
export const DEFAULT_CONFIDENCE = 0.75;

const TIERS = ['Low', 'Medium', 'High'];

// ─── Normalizers ──────────────────────────────────────────────────────────────

/** "The Bill Simmons Podcast" → "bill simmons". */
export function normalizeShowName(raw) {
  if (!raw) return null;
  let s = String(raw).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  s = s.replace(/^the\s+/, '');
  s = s.replace(/\s+(podcast|show|pod)$/g, '').replace(/\s+(podcast|show|pod)$/g, '');
  return s.trim() || null;
}

const HOST_ALIASES = {
  bill: 'bill_simmons', simmons: 'bill_simmons', 'bill simmons': 'bill_simmons',
  sal: 'cousin_sal', 'cousin sal': 'cousin_sal', 'sal iacono': 'cousin_sal',
  'warren sharp': 'warren_sharp', sharp: 'warren_sharp',
};

/** "Cousin Sal" / "Sal" → "cousin_sal"; unknown names → snake_case slug. */
export function normalizeHostName(raw) {
  if (!raw) return null;
  const clean = String(raw).toLowerCase()
    .replace(/\b(mr|mrs|ms|dr)\.?\s+/g, '')
    .replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  if (!clean || clean === 'unknown' || /^speaker\s*\w?$/.test(clean)) return null;
  return HOST_ALIASES[clean] || clean.replace(/\s+/g, '_');
}

/** Any team string (mascot, city, abbreviation) → canonical abbreviation, else null. */
export function normalizeTeamKey(raw) {
  if (!raw) return null;
  const up = String(raw).trim().toUpperCase();
  if (['OVER', 'UNDER', 'YES', 'NO', 'UNKNOWN', 'UNK', 'TOTAL'].includes(up)) return null;
  if (up === 'WSH') return 'WAS';
  if (up === 'JAC') return 'JAX';
  const abbr = getTeamAbbreviation(raw);
  return abbr ? String(abbr).toUpperCase() : null;
}

/**
 * For fields that can ONLY hold a team (team1/team2/team/subject): 'NO' is the
 * Saints, not the word "no". normalizeTeamKey() rejects it because free-form
 * selection/side fields use YES/NO; using it on team fields dropped the Saints.
 */
export function teamFieldKey(raw) {
  if (raw && String(raw).trim().toUpperCase() === 'NO') return 'NO';
  return normalizeTeamKey(raw);
}

const FUTURES_HINTS = ['win_total', 'playoff', 'division', 'conference', 'super_bowl', 'mvp', 'opoy', 'dpoy', 'roy', 'coach', 'overall_pick', 'leader', 'season_', 'fewest', 'comeback', 'future'];

/**
 * Raw category/market + side → one of:
 * spread | total_over | total_under | moneyline | prop | futures | pickem | other
 */
export function normalizeBetType(rawType, rawSide) {
  const t = String(rawType || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  const side = String(rawSide || '').toUpperCase();
  if (['spread', 'ats', 'side', 'against_the_spread', 'game_line', 'line'].includes(t)) return 'spread';
  if (['moneyline', 'ml', 'straight_up', 'h2h'].includes(t)) return 'moneyline';
  if (['total', 'totals', 'o/u', 'o_u', 'over_under', 'over', 'under', 'game_total'].includes(t)) {
    if (t === 'under' || side.includes('UNDER')) return 'total_under';
    if (t === 'over' || side.includes('OVER')) return 'total_over';
    return 'total_over';
  }
  if (t === 'total_over' || t === 'total_under') return t;
  if (t.startsWith('player_') || t === 'prop' || t === 'props') return 'prop';
  if (t === 'survivor_pick' || t === 'pickem_pick') return 'pickem';
  if (FUTURES_HINTS.some(h => t.includes(h))) return 'futures';
  return t || 'other';
}

function normalizePlayer(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();
  return s || null;
}

function normalizeSubMarket(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return s || null;
}

/**
 * Futures market → one shared taxonomy so audio (`subject_market`, e.g.
 * 'Super_Bowl', 'AFC_North', 'NFC_West_Win_Total', 'Offensive_ROY') and Gemini
 * (`market`, e.g. 'super_bowl_winner', 'division_winner', 'win_total', 'oroy')
 * labels for the same bet compare equal.
 */
export function normalizeFuturesSubMarket(raw) {
  const s = normalizeSubMarket(raw);
  if (!s) return null;
  if (s.includes('win_total') || s === 'wins' || s === 'regular_season_wins' || s.includes('season_win')) return 'win_total';
  // Super Bowl MVP is a player award, not the title — check before super_bowl.
  if ((s.includes('super_bowl') || s.includes('superbowl') || /^sb(_|$)/.test(s)) && s.includes('mvp')) return 'sb_mvp';
  if (s.includes('super_bowl') || s.includes('superbowl') || s === 'sb' || s === 'sb_winner' || s === 'title' || s === 'championship') return 'super_bowl_winner';
  // Seeding before playoffs: 'playoff_no_1_seed' / 'afc_1_seed' are seed bets.
  if (/(^|_)1_seed/.test(s) || s.includes('number_1_seed') || s.includes('one_seed') || s.includes('top_seed') || s === 'bye' || s.includes('first_round_bye')) return 'conference_no_1_seed';
  // "Miss playoffs" is the opposite bet — never let it share a market with "make".
  if (s.includes('miss_playoff') || s.includes('no_playoff') || s.includes('miss_the_playoff')) return 'miss_playoffs';
  if (s.includes('playoff')) return 'make_playoffs';
  if (s === 'division_winner' || s.includes('division') || /^(afc|nfc)_(north|south|east|west)/.test(s)) return 'division_winner';
  if (s === 'afc' || s === 'nfc' || s.includes('conference') || /^(afc|nfc)_champ/.test(s)) return 'conference_winner';
  if (s.includes('overall_pick') || s.includes('first_pick') || s === 'no_1_pick') return 'no_1_overall_pick';
  if (s.includes('mvp') || s.includes('most_valuable')) return 'mvp';
  if (s === 'opoy' || s.includes('offensive_player')) return 'opoy';
  if (s === 'dpoy' || s.includes('defensive_player')) return 'dpoy';
  if (s === 'oroy' || s.includes('offensive_roy') || s.includes('offensive_rookie')) return 'oroy';
  if (s === 'droy' || s.includes('defensive_roy') || s.includes('defensive_rookie')) return 'droy';
  if (s === 'coy' || s === 'coty' || s.includes('coach')) return 'coach_of_the_year';
  if (s === 'cpoy' || s.includes('comeback')) return 'comeback_player_of_the_year';
  if (s.includes('fewest_win')) return 'fewest_wins';
  return s;
}

function toNum(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toMs(v) {
  if (!v) return null;
  const n = Date.parse(v);
  return Number.isFinite(n) ? n : null;
}

/** 0..1 → Low/Medium/High. */
export function confidenceTier(conf) {
  if (typeof conf === 'string') {
    const hit = TIERS.find(t => t.toLowerCase() === conf.toLowerCase());
    if (hit) return hit;
  }
  const n = toNum(conf);
  if (n == null) return 'Medium';
  if (n < 0.6) return 'Low';
  if (n < 0.8) return 'Medium';
  return 'High';
}


/**
 * Player-prop stat → shared key so audio ('Passing Yards', 'pass_yds') and
 * Gemini ('player_passing_yds') labels for the same stat compare equal.
 * Generic labels ('player_prop', 'prop') return null = "stat unknown".
 */
export function normalizePropSubMarket(raw) {
  let s = normalizeSubMarket(raw);
  if (!s || ['prop', 'props', 'player_prop', 'player_props'].includes(s)) return null;
  s = s
    .replace(/^player_/, '')
    .replace(/passing/g, 'pass')
    .replace(/rushing/g, 'rush')
    .replace(/receiving/g, 'rec')
    .replace(/receptions/g, 'recs')
    .replace(/reception(?=_)/g, 'rec')   // 'reception_yds' = receiving yards
    .replace(/reception$/g, 'recs')      // 'player_reception' = receptions
    // Singular and plural forms must compare equal ('pass_td' = 'pass_tds').
    .replace(/touchdowns?/g, 'tds')
    .replace(/(^|_)td$/g, '$1tds')
    .replace(/yards?/g, 'yds')
    .replace(/interceptions?/g, 'ints')
    .replace(/(^|_)int$/g, '$1ints')
    .replace(/completions?/g, 'comps')
    .replace(/(^|_)comp$/g, '$1comps')
    .replace(/attempts?/g, 'atts')
    .replace(/(^|_)att$/g, '$1atts');
  return s || null;
}

/** First real numeric confidence (0..1; 0..100 rescaled), or null if none was extracted. */
function explicitConfidence(...vals) {
  for (const v of vals) {
    const n = toNum(v);
    if (n != null) return n > 1 ? n / 100 : n;
  }
  return null;
}

/** A subject that isn't a team is treated as the player (props / player-award futures). */
function playerFromSubject(betType, subject) {
  if (!subject || (betType !== 'prop' && betType !== 'futures')) return null;
  return teamFieldKey(subject) ? null : subject;
}

// ─── Canonical pick ──────────────────────────────────────────────────────────

/**
 * Audio row: either a _flattenPodcastPicks row ({ episode_id, pub_date,
 * expert, feed_name, pick }) or a bare pick object carrying its own context.
 */
function canonicalAudio(row, idx) {
  const pick = row?.pick && typeof row.pick === 'object' ? row.pick : (row || {});
  const ctx = row?.pick ? row : pick;
  const betType = normalizeBetType(pick.category || pick.bet_type || pick.type || pick.market, pick.selection);
  const t1 = teamFieldKey(pick.team1);
  const t2 = teamFieldKey(pick.team2);
  const subjTeam = teamFieldKey(pick.subject);
  const rawTeam = teamFieldKey(pick.team);
  // selection may be a YES/NO answer, so it only counts as 'NO' (Saints) when
  // the Saints appear in ANY of the pick's team fields (team1 OR team2 OR
  // subject OR team) and the market isn't a Yes/No one (make/miss playoffs),
  // where 'NO' is the answer, not the team.
  const futuresMarket = betType === 'futures' ? normalizeFuturesSubMarket(pick.subject_market || pick.market) : null;
  const yesNoMarket = futuresMarket === 'make_playoffs' || futuresMarket === 'miss_playoffs';
  const hasSaints = [t1, t2, subjTeam, rawTeam].includes('NO');
  const selTeam = (!yesNoMarket && hasSaints && String(pick.selection || '').trim().toUpperCase() === 'NO')
    ? 'NO'
    : (normalizeTeamKey(pick.selection) || subjTeam || rawTeam);
  const teams = [t1, t2, selTeam, rawTeam].filter(Boolean);
  const explicit = explicitConfidence(pick.quality_score, pick.extraction_quality_score, pick.confidence);
  const conf = explicit ?? DEFAULT_CONFIDENCE;
  return {
    source: SOURCE_AUDIO,
    idx,
    raw: row,
    pick,
    episodeId: ctx.episode_id ?? pick.episode_id ?? null,
    episodeTitle: ctx.episode_title ?? pick.episode_title ?? null,
    show: normalizeShowName(ctx.feed_name ?? ctx.show_name ?? pick.show_name ?? null),
    showLabel: ctx.feed_name ?? ctx.show_name ?? pick.show_name ?? null,
    expert: ctx.expert ?? pick.expert ?? null,
    host: normalizeHostName(pick.speaker ?? pick.host ?? null),
    week: toNum(pick.week ?? ctx.week),
    season: toNum(pick.season ?? ctx.season),
    pubMs: toMs(ctx.pub_date ?? pick.pub_date ?? pick.game_date),
    pubDate: ctx.pub_date ?? pick.pub_date ?? null,
    betType,
    team: betType === 'total_over' || betType === 'total_under' ? null : selTeam,
    teams: [...new Set(teams)],
    player: normalizePlayer(pick.player || pick.player_name || playerFromSubject(betType, pick.subject)),
    subMarket: betType === 'futures' ? normalizeFuturesSubMarket(pick.subject_market || pick.market)
      : betType === 'prop' ? normalizePropSubMarket(pick.subject_market || pick.market)
      : normalizeSubMarket(pick.subject_market || pick.market),
    hasExplicitConfidence: explicit != null,
    side: String(pick.selection || '').toUpperCase() || null,
    line: toNum(pick.line),
    price: toNum(pick.odds_american ?? pick.price),
    confidence: conf,
    reasoning: pick.summary || pick.reasoning_summary || pick.rationale || '',
    quote: pick.notable_quote || pick.quote || pick.transcript_excerpt || pick.summary || '',
    timestampSecs: toNum(pick.source_timestamp_secs ?? pick.source_timestamp),
  };
}

/** YouTube row: _flattenGeminiIntel item ({ item_type:'pick', team, market, side, ... }) or raw Gemini pick. */
function canonicalVideo(row, idx) {
  const r = row || {};
  const rawSide = r.side || r.lean || r.selection || null;
  const betType = normalizeBetType(r.market || r.category, rawSide);
  const team = teamFieldKey(r.team) || normalizeTeamKey(rawSide);
  // Only a per-pick confidence counts as explicit — the row-level
  // extraction_quality_score describes the whole episode, not this pick.
  const videoExplicit = explicitConfidence(r.confidence);
  const leanLine = typeof r.lean === 'string' ? toNum((r.lean.match(/-?\d+(\.\d+)?/) || [])[0]) : null;
  const teams = [team, ...(Array.isArray(r.teams) ? r.teams.map(teamFieldKey) : [])].filter(Boolean);
  return {
    source: SOURCE_YOUTUBE,
    idx,
    raw: row,
    pick: r,
    episodeId: r.episode_id ?? null,
    episodeTitle: r.episode_title ?? null,
    show: normalizeShowName(r.feed_name ?? r.show_name ?? null),
    showLabel: r.feed_name ?? r.show_name ?? null,
    expert: r.expert ?? null,
    host: normalizeHostName(r.speaker ?? r.host ?? null),
    week: toNum(r.week),
    season: toNum(r.season),
    pubMs: toMs(r.pub_date),
    pubDate: r.pub_date ?? null,
    betType,
    team: betType === 'total_over' || betType === 'total_under' ? null : team,
    teams: [...new Set(teams)],
    player: normalizePlayer(r.player || r.player_name || playerFromSubject(betType, r.subject)),
    subMarket: betType === 'futures' ? normalizeFuturesSubMarket(r.market)
      : betType === 'prop' ? normalizePropSubMarket(r.market)
      : normalizeSubMarket(r.market),
    hasExplicitConfidence: videoExplicit != null,
    side: String(rawSide || '').toUpperCase() || null,
    line: toNum(r.line) ?? leanLine,
    price: toNum(r.price),
    // Gemini picks carry no per-pick confidence today; a missing value stays
    // "unknown" (DEFAULT_CONFIDENCE for display) and never outranks a real one.
    confidence: videoExplicit ?? DEFAULT_CONFIDENCE,
    reasoning: r.rationale || r.supporting_quote || r.summary || '',
    quote: r.supporting_quote || r.quote || r.rationale || '',
    timestampSecs: toNum(r.source_timestamp),
  };
}

/** Stable string key describing what a pick is about (used for grouping/debug). */
export function buildPickCorroborationKey(c) {
  const bucket = c.week != null ? `w${c.week}` : (c.pubMs != null ? `d${new Date(c.pubMs).toISOString().slice(0, 10)}` : 'w?');
  const target = c.player || c.team || (c.teams.length ? [...c.teams].sort().join('@') : '?');
  return [c.season ?? '?', bucket, c.show ?? '?', c.host ?? '?', target, c.betType].join(':');
}

function sameBucket(a, b) {
  if (a.episodeId && b.episodeId && a.episodeId === b.episodeId) return true;
  if (!a.show || !b.show || a.show !== b.show) return false;
  if (a.season != null && b.season != null && a.season !== b.season) return false;
  if (a.week != null && b.week != null) return a.week === b.week;
  // week unknown on at least one side → 48h publish window
  if (a.pubMs != null && b.pubMs != null) return Math.abs(a.pubMs - b.pubMs) <= PUBLISH_WINDOW_MS;
  return false;
}

function sameTarget(a, b) {
  if (a.betType !== b.betType) return false;
  if (a.host && b.host && a.host !== b.host) return false;
  if (a.betType === 'prop') {
    // Props need a named player on BOTH sides — two different players on the
    // same team must never collapse into one pick.
    if (!a.player || !b.player || a.player !== b.player) return false;
    // Same player, different stat (pass yds vs rush yds) = two different picks.
    if (a.subMarket && b.subMarket && a.subMarket !== b.subMarket) return false;
    const da = sideDir(a.side); const db = sideDir(b.side);
    if (['OVER', 'UNDER'].includes(da) && ['OVER', 'UNDER'].includes(db) && da !== db) return false;
    return true;
  }
  if (a.betType === 'futures') {
    if (a.subMarket && b.subMarket && a.subMarket !== b.subMarket) return false;
    // A bare team code is the target, not a direction ('NO' = Saints).
    // A side naming the pick's own team is the target, not a direction
    // ('NO' on a Saints pick = Saints; 'NO' on a Cowboys pick = "No").
    // Except in Yes/No markets (make/miss playoffs): there 'NO' is always the
    // answer, so Saints YES vs Saints NO must never merge.
    const yesNo = ['make_playoffs', 'miss_playoffs'].includes(a.subMarket) || ['make_playoffs', 'miss_playoffs'].includes(b.subMarket);
    const betDir = (x, own) => {
      const k = String(x || '').trim().toUpperCase();
      if (!k || (!yesNo && own && k === own) || normalizeTeamKey(x)) return null;
      return sideDir(x);
    };
    const da = betDir(a.side, a.team); const db = betDir(b.side, b.team);
    const DIRS = ['OVER', 'UNDER', 'YES', 'NO'];
    if (DIRS.includes(da) && DIRS.includes(db) && da !== db) return false;
    // Player awards (MVP, OPOY, ROY…) match on the player; team futures on the team.
    if (a.player || b.player) return !!(a.player && b.player && a.player === b.player);
    return !!(a.team && b.team && a.team === b.team);
  }
  if (a.betType === 'total_over' || a.betType === 'total_under') {
    if (!a.teams.length || !b.teams.length) return false;
    return a.teams.some(t => b.teams.includes(t));
  }
  return !!(a.team && b.team && a.team === b.team);
}

function sideDir(side) {
  const s = String(side || '').toUpperCase();
  if (/\bOVER\b|^O\d/.test(s)) return 'OVER';
  if (/\bUNDER\b|^U\d/.test(s)) return 'UNDER';
  if (/^YES\b/.test(s)) return 'YES';
  if (/^NO\b/.test(s)) return 'NO';
  return s;
}

function longer(a, b) {
  const sa = String(a || '');
  const sb = String(b || '');
  return sb.length > sa.length ? [sb, sa] : [sa, sb];
}

// ─── Output builders ─────────────────────────────────────────────────────────

function legacyPickShape(c, extra = {}) {
  // Audio-pipeline shape so existing filters/UI (selection/team1/team2/category)
  // keep working on YouTube-only and merged picks too.
  const base = c.source === SOURCE_AUDIO ? { ...c.pick } : {
    category: c.betType.startsWith('total') ? 'total' : c.betType === 'futures' ? 'future' : c.betType,
    // Props and player-award futures are about the PLAYER, not his team.
    subject: (c.betType === 'prop' || (c.betType === 'futures' && c.player))
      ? (c.pick.player || c.team || null)
      : (c.team || c.teams[0] || c.pick.player || null),
    player: c.pick.player || null,
    subject_market: c.subMarket,
    selection: c.betType.startsWith('total') ? sideDir(c.side) || (c.betType === 'total_under' ? 'UNDER' : 'OVER')
      : ((c.subMarket === 'win_total' || c.betType === 'prop') && ['OVER', 'UNDER'].includes(sideDir(c.side))) ? sideDir(c.side)
      : (['make_playoffs', 'miss_playoffs'].includes(c.subMarket) && ['YES', 'NO'].includes(sideDir(c.side))) ? sideDir(c.side)
      : (c.betType === 'futures' && c.player) ? (c.pick.player || c.pick.player_name || c.pick.subject || c.player)
      : (c.team || c.player || c.side),
    team1: c.teams[0] || null,
    team2: c.teams[1] || null,
    line: c.line,
    odds_american: c.price,
    summary: c.reasoning,
    confidence: c.confidence,
    week: c.week,
    season: c.season,
    market: c.pick.market,
    speaker: c.pick.speaker,
    source_timestamp_secs: c.timestampSecs,
  };
  return { ...base, ...extra };
}

function emitSingle(c) {
  const tier = confidenceTier(c.confidence);
  const meta = {
    dual_extraction: false,
    sources: [c.source],
    sourceBadge: c.source === SOURCE_AUDIO ? 'Audio' : 'Video',
    confidence_tier: tier,
  };
  return {
    key: buildPickCorroborationKey(c),
    ...meta,
    bet_type: c.betType,
    team: c.team,
    teams: c.teams,
    player: c.player,
    week: c.week,
    season: c.season,
    show: c.show,
    show_name: c.showLabel,
    host: c.host,
    expert: c.expert,
    episode_id: c.episodeId,
    episode_title: c.episodeTitle,
    pub_date: c.pubDate,
    line: c.line,
    line_variants: c.line != null ? [c.line] : [],
    confidence: c.confidence,
    reasoning_summary: c.reasoning,
    notable_quote: c.quote,
    alternate_quote: null,
    audio: c.source === SOURCE_AUDIO ? c.raw : null,
    video: c.source === SOURCE_YOUTUBE ? c.raw : null,
    source_timestamp_secs: c.source === SOURCE_AUDIO ? c.timestampSecs : null,
    video_timestamp: c.source === SOURCE_YOUTUBE ? c.timestampSecs : null,
    pick: legacyPickShape(c, meta),
  };
}

function emitMerged(a, v) {
  // Same opinion heard twice → keep ONE extraction's real confidence, never a
  // boost. A defaulted (missing) confidence can never outrank a real one, so a
  // Low audio pick stays Low even though Gemini picks default to 0.75.
  const primary = (v.hasExplicitConfidence && (!a.hasExplicitConfidence || v.confidence > a.confidence)) ? v : a;
  const conf = primary.confidence;
  const tier = confidenceTier(conf);
  const [reasoning] = longer(a.reasoning, v.reasoning);
  const [quote, otherQuote] = longer(a.quote, v.quote);
  const lineVariants = [...new Set([a.line, v.line].filter(l => l != null))];
  const meta = {
    dual_extraction: true,
    sources: [SOURCE_AUDIO, SOURCE_YOUTUBE],
    sourceBadge: DUAL_SOURCE_BADGE,
    confidence_tier: tier,
  };
  const teams = [...new Set([...a.teams, ...v.teams])];
  return {
    key: buildPickCorroborationKey(a),
    ...meta,
    bet_type: a.betType,
    team: a.team || v.team,
    teams,
    player: a.player || v.player,
    week: a.week ?? v.week,
    season: a.season ?? v.season,
    show: a.show || v.show,
    show_name: a.showLabel || v.showLabel,
    host: a.host || v.host,
    expert: a.expert || v.expert,
    episode_id: a.episodeId || v.episodeId,
    episode_title: a.episodeTitle || v.episodeTitle,
    pub_date: a.pubDate || v.pubDate,
    line: primary.line ?? a.line ?? v.line,
    line_variants: lineVariants,
    confidence: conf,
    reasoning_summary: reasoning,
    notable_quote: quote,
    alternate_quote: otherQuote || null,
    audio: a.raw,
    video: v.raw,
    source_timestamp_secs: a.timestampSecs,
    video_timestamp: v.timestampSecs,
    pick: legacyPickShape({ ...a, teams }, {
      ...meta,
      team1: a.pick.team1 || teams[0] || null,
      team2: a.pick.team2 || teams.find(t => t !== (a.pick.team1 || teams[0])) || null,
      line: primary.line ?? a.line ?? v.line,
      line_variants: lineVariants,
      summary: reasoning,
      quality_score: conf,
      confidence: conf,
      notable_quote: quote,
      alternate_quote: otherQuote || null,
      video_timestamp: v.timestampSecs,
    }),
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Merge audio-pipeline and YouTube-pipeline picks.
 *
 * @param {Array} audioPicks   _flattenPodcastPicks rows or bare audio picks
 * @param {Array} youtubePicks _flattenGeminiIntel pick items or bare Gemini picks
 * @param {{ includeUnpromoted?: boolean }} [opts] — YouTube rows carrying
 *        `promoted_at: null` are dropped unless includeUnpromoted is true.
 * @returns {Array} unified picks (audio order first, then YouTube-only)
 */
export function reconcilePodcastPicks(audioPicks = [], youtubePicks = [], { includeUnpromoted = false } = {}) {
  const audio = (Array.isArray(audioPicks) ? audioPicks : []).map(canonicalAudio);
  const video = (Array.isArray(youtubePicks) ? youtubePicks : [])
    .filter(r => r && (r.item_type == null || r.item_type === 'pick'))
    .filter(r => includeUnpromoted || !('promoted_at' in r) || r.promoted_at != null)
    .map(canonicalVideo);

  const used = new Set();
  const out = [];
  for (const a of audio) {
    let best = null;
    let bestScore = -Infinity;
    for (const v of video) {
      if (used.has(v.idx)) continue;
      if (!sameTarget(a, v) || !sameBucket(a, v)) continue;
      let score = 0;
      if (a.episodeId && a.episodeId === v.episodeId) score += 10;
      if (a.host && a.host === v.host) score += 3;
      if (a.line != null && v.line != null) score -= Math.abs(a.line - v.line);
      if (score > bestScore) { best = v; bestScore = score; }
    }
    if (best) {
      used.add(best.idx);
      out.push(emitMerged(a, best));
    } else {
      out.push(emitSingle(a));
    }
  }
  for (const v of video) {
    if (!used.has(v.idx)) out.push(emitSingle(v));
  }
  return out;
}

/** Count of picks that were collapsed (useful for UI/telemetry). */
export function summarizeReconciliation(unified = []) {
  const dual_extraction = unified.filter(p => p.dual_extraction).length;
  return {
    total: unified.length,
    dual_extraction,
    audio_only: unified.filter(p => !p.dual_extraction && p.sources[0] === SOURCE_AUDIO).length,
    youtube_only: unified.filter(p => !p.dual_extraction && p.sources[0] === SOURCE_YOUTUBE).length,
    duplicates_removed: dual_extraction, // each merge removed exactly one duplicate
  };
}
