import { createHash } from 'node:crypto';
import { getTeamAbbreviation, normalizeTeam } from '../../src/lib/teams.js';

const STATUS_ALIASES = [
  ['IR', /\b(injured reserve|injury reserve|\bir\b)\b/i],
  ['PUP', /\b(physically unable to perform|\bpup\b|active\/pup|reserve\/pup)\b/i],
  ['SUSPENSION', /\b(suspension|suspended)\b/i],
  ['OUT', /\bout\b/i],
  ['DOUBTFUL', /\bdoubtful\b/i],
  ['QUESTIONABLE', /\bquestionable\b/i],
  ['PROBABLE', /\bprobable\b/i],
  ['ACTIVE_NEWS', /\bactive\b/i],
];

const RETURN_PATTERNS = [
  /\b(return(?:ed|s|ing)? to practice|returns? to practice|back at practice|practices? for the first time)\b/i,
  /\b(takes part|participat(?:ed|es|ing)|full participant|doing individual drills|full-team drills)\b/i,
  /\b(cleared|activated|removed from (?:the )?pup|passed (?:his )?physical)\b/i,
];

const SETBACK_PATTERNS = [
  /\b(setback|flare[- ]up|carted off|suffered|torn|tear|will miss|expected to miss|not practicing|did not participate|placed on)\b/i,
  /\b(out for the season|season-ending|surgery)\b/i,
];

const LIMITED_PATTERNS = [
  /\b(limited|individual drills|not full|ramp(?:ing)? up|managed reps|eased back|pitch count)\b/i,
  /\b(snap count|limited snap|workload restriction)\b/i,
];

const MARKET_RULES = [
  ['wins', /\b(qb|quarterback|starter|injur|practice|pup|ir|snap count|offensive line|edge|corner|wr|rb|te)\b/i],
  ['division', /\b(qb|quarterback|starter|division|playoff|pup|ir|return|setback)\b/i],
  ['conference', /\b(qb|quarterback|super bowl|conference|playoff|return|setback)\b/i],
  ['super_bowl', /\b(qb|quarterback|super bowl|championship|return|setback)\b/i],
  ['player_props', /\b(qb|wr|rb|te|receiver|rusher|passer|snap count|targets?|carries|touches)\b/i],
  ['fantasy', /\b(qb|wr|rb|te|fantasy|targets?|carries|touches|snap count)\b/i],
];

const KEY_POSITION_GROUPS = {
  QB: 'qb_major',
  RB: 'skill_major',
  WR: 'skill_major',
  TE: 'skill_major',
  FB: 'skill_major',
  T: 'trench_major',
  G: 'trench_major',
  C: 'trench_major',
  OL: 'trench_major',
  OT: 'trench_major',
  OG: 'trench_major',
  DE: 'defensive_major',
  DT: 'defensive_major',
  DL: 'defensive_major',
  EDGE: 'defensive_major',
  OLB: 'defensive_major',
  LB: 'defensive_major',
  CB: 'defensive_major',
  S: 'defensive_major',
  DB: 'defensive_major',
};

function sha(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

export function normalizeInjuryStatus(value) {
  const raw = String(value || '').trim();
  if (!raw) return 'UNKNOWN';
  for (const [status, pattern] of STATUS_ALIASES) {
    if (pattern.test(raw)) return status;
  }
  return raw.toUpperCase().replace(/\s+/g, '_');
}

export function parseInjuryType(shortComment) {
  if (!shortComment) return null;
  const match = String(shortComment).match(/\(([a-z][^)]{1,29})\)/i);
  return match ? match[1].toLowerCase() : null;
}

export function classifyAvailabilityEvent({ status, text = '' } = {}) {
  const normalized = normalizeInjuryStatus(status);
  const body = String(text || '');

  if (normalized === 'IR') return { event_type: 'ir', availability_trend: 'worsening' };
  if (normalized === 'PUP') return { event_type: 'pup', availability_trend: 'worsening' };
  if (normalized === 'SUSPENSION') return { event_type: 'suspension', availability_trend: 'worsening' };
  if (normalized === 'OUT') return { event_type: 'out', availability_trend: 'worsening' };
  if (normalized === 'DOUBTFUL') return { event_type: 'doubtful', availability_trend: 'worsening' };
  if (normalized === 'QUESTIONABLE' && SETBACK_PATTERNS.some((re) => re.test(body))) {
    return { event_type: 'setback', availability_trend: 'worsening' };
  }
  if (RETURN_PATTERNS.some((re) => re.test(body))) {
    return { event_type: LIMITED_PATTERNS.some((re) => re.test(body)) ? 'limited_return' : 'return_to_practice', availability_trend: 'improving' };
  }
  if (LIMITED_PATTERNS.some((re) => re.test(body))) {
    return { event_type: 'limited', availability_trend: 'stable' };
  }
  if (SETBACK_PATTERNS.some((re) => re.test(body))) {
    return { event_type: 'setback', availability_trend: 'worsening' };
  }
  if (normalized === 'PROBABLE') return { event_type: 'probable', availability_trend: 'improving' };
  if (normalized === 'ACTIVE_NEWS') return { event_type: 'active_news', availability_trend: 'unknown' };
  return { event_type: 'status_update', availability_trend: 'unknown' };
}

export function linkedMarketsForAvailability(text = '') {
  const out = [];
  for (const [market, pattern] of MARKET_RULES) {
    if (pattern.test(text)) out.push(market);
  }
  return out.length ? [...new Set(out)] : ['wins'];
}

export function impactBucket(position, text = '') {
  const pos = String(position || '').toUpperCase();
  if (KEY_POSITION_GROUPS[pos]) return KEY_POSITION_GROUPS[pos];
  if (/\b(starting|starter|pro bowl|all-pro|franchise|key player|star)\b/i.test(text)) return 'starter_uncertain';
  return 'depth_only';
}

function compactSummary(value, maxChars = 260) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  return clean.length > maxChars ? `${clean.slice(0, maxChars - 3).trim()}...` : clean;
}

export function availabilityEventFromInjuryRecord(record, options = {}) {
  const text = [record.position, record.short_comment, record.long_comment, record.status_raw, record.injury_status].filter(Boolean).join(' ');
  const team = getTeamAbbreviation(record.team_abbr) || record.team_abbr || '';
  const status = normalizeInjuryStatus(record.injury_status || record.status_raw);
  const { event_type, availability_trend } = classifyAvailabilityEvent({ status, text });
  const injuryType = record.injury_type || parseInjuryType(record.short_comment);
  const playerName = record.player_name || 'Unknown';
  const capturedAt = record.captured_at || options.generatedAt || new Date().toISOString();
  const sourceUrl = record.source_url || 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries';
  const id = `avail_${sha([options.season || 2026, team, playerName, status, event_type, sourceUrl].join('|')).slice(0, 16)}`;

  return {
    id,
    season: Number(options.season || 2026),
    player_name: playerName,
    team_abbr: team,
    team_nick: normalizeTeam(team) || null,
    position: record.position || null,
    source: record.source || 'ESPN injuries API',
    source_type: record.source_type || 'structured_injury',
    source_url: sourceUrl,
    published_at: record.reported_at || null,
    captured_at: capturedAt,
    event_type,
    availability_trend,
    status_raw: record.injury_status || record.status_raw || null,
    normalized_status: status,
    injury_type: injuryType,
    short_summary: compactSummary(record.short_comment || record.long_comment || `${playerName} ${status}`),
    supporting_quote: compactSummary(record.short_comment || record.long_comment || '', 420),
    confidence: Number(record.confidence ?? 0.78),
    needs_human_review: true,
    linked_markets: linkedMarketsForAvailability(text),
    impact_bucket: impactBucket(record.position, text),
    dedupe_key: record.espn_injury_id || record.source_url || `${team}|${playerName}|${status}|${event_type}`,
  };
}

export function availabilityEventFromTrainingCampItem(item, options = {}) {
  const text = [item.summary, item.raw_excerpt, item.betting_relevance, item.signal_type].filter(Boolean).join(' ');
  const statusHint = item.signal_type === 'injury' ? text : item.status_raw;
  const { event_type, availability_trend } = classifyAvailabilityEvent({ status: statusHint, text });
  if (!['return_to_practice', 'limited_return', 'limited', 'setback', 'pup', 'ir', 'out', 'doubtful', 'probable', 'active_news'].includes(event_type)) {
    return null;
  }
  const team = getTeamAbbreviation(item.team) || item.team || '';
  const sourceUrl = item.source_url || null;
  const id = `avail_${sha([options.season || item.season || 2026, team, item.player || item.summary, event_type, sourceUrl || item.id].join('|')).slice(0, 16)}`;

  return {
    id,
    season: Number(options.season || item.season || 2026),
    player_name: item.player || null,
    team_abbr: team,
    team_nick: normalizeTeam(team) || null,
    position: item.position || null,
    source: item.source || 'Training camp snapshot',
    source_type: item.source_type || 'training_camp',
    source_url: sourceUrl,
    published_at: item.published_at || null,
    captured_at: item.captured_at || options.generatedAt || new Date().toISOString(),
    event_type,
    availability_trend,
    status_raw: item.status_raw || null,
    normalized_status: item.status_raw ? normalizeInjuryStatus(item.status_raw) : null,
    injury_type: parseInjuryType(text),
    short_summary: compactSummary(item.summary || item.raw_excerpt),
    supporting_quote: compactSummary(item.raw_excerpt || item.betting_relevance || item.summary, 420),
    confidence: Number(item.confidence ?? 0.68),
    needs_human_review: item.needs_human_review ?? true,
    linked_markets: item.linked_markets?.length ? item.linked_markets : linkedMarketsForAvailability(text),
    impact_bucket: impactBucket(item.position, text),
    dedupe_key: item.dedupe_key || sourceUrl || item.id,
  };
}

export function dedupeAvailabilityEvents(events = []) {
  const byKey = new Map();
  for (const event of events.filter(Boolean)) {
    const key = [
      event.team_abbr,
      event.player_name || event.short_summary,
      event.event_type,
      event.dedupe_key || event.source_url,
    ].join('|');
    const existing = byKey.get(key);
    if (!existing || String(event.captured_at || event.published_at).localeCompare(String(existing.captured_at || existing.published_at)) > 0) {
      byKey.set(key, event);
    }
  }
  return [...byKey.values()].sort((a, b) =>
    String(b.published_at || b.captured_at).localeCompare(String(a.published_at || a.captured_at)) ||
    a.team_abbr.localeCompare(b.team_abbr)
  );
}

export function buildAvailabilitySnapshot({ season = 2026, generatedAt = new Date().toISOString(), injuryRecords = [], trainingCampItems = [], sourceHealth = [] } = {}) {
  const injuryEvents = injuryRecords.map((record) => availabilityEventFromInjuryRecord(record, { season, generatedAt }));
  const campEvents = trainingCampItems.map((item) => availabilityEventFromTrainingCampItem(item, { season, generatedAt })).filter(Boolean);
  const events = dedupeAvailabilityEvents([...injuryEvents, ...campEvents]);
  const teams = {};
  for (const event of events) {
    const key = event.team_abbr || 'UNK';
    const team = teams[key] ??= {
      team_abbr: key,
      team_nick: event.team_nick,
      event_count: 0,
      improving_count: 0,
      worsening_count: 0,
      major_count: 0,
      events: [],
    };
    team.event_count += 1;
    if (event.availability_trend === 'improving') team.improving_count += 1;
    if (event.availability_trend === 'worsening') team.worsening_count += 1;
    if (event.impact_bucket !== 'depth_only') team.major_count += 1;
    if (team.events.length < 12) team.events.push(event);
  }

  return {
    meta: {
      schema: 'player_availability_snapshot_v1',
      season,
      generated_at: generatedAt,
      event_count: events.length,
      teams_with_events: Object.keys(teams).length,
      improving_count: events.filter((e) => e.availability_trend === 'improving').length,
      worsening_count: events.filter((e) => e.availability_trend === 'worsening').length,
      major_count: events.filter((e) => e.impact_bucket !== 'depth_only').length,
      recommendation_status: 'availability_intel_only_not_picks',
      guardrails: {
        live_model_calls: false,
        supabase_writes: false,
        official_picks_generated: false,
      },
      source_health: sourceHealth,
    },
    events,
    teams,
  };
}
