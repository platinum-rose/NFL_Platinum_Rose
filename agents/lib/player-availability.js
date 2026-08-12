import { createHash } from 'node:crypto';
import { getTeamAbbreviation, normalizeTeam } from '../../src/lib/teams.js';
import {
  auditTeamIdentity,
  canonicalTeamList,
  inferTeamMentions,
  mergeRelatedTeams,
  resolveEvidenceTeamOwnership,
  sourcePrimaryTeam,
} from './team-identity.js';

const STATUS_ALIASES = [
  ['IR', /\b(injured reserve|injury reserve|\bir\b)\b/i],
  ['PUP', /\b(physically unable to perform|\bpup\b|active\/pup|reserve\/pup|active\/non-football|active\/nfi|non-football injury|non-football illness)\b/i],
  ['SUSPENSION', /\b(suspension|suspended)\b/i],
  ['OUT', /\bout\b/i],
  ['DOUBTFUL', /\bdoubtful\b/i],
  ['QUESTIONABLE', /\bquestionable\b/i],
  ['PROBABLE', /\bprobable\b/i],
  ['ACTIVE_NEWS', /\bactive\b/i],
];

const PUP_TEXT_PATTERNS = [
  /\b(active\/pup|active\/physically unable|placed on (?:the )?active\/pup|placed on (?:the )?pup|reserve\/pup|physically unable to perform)\b/i,
  /\b(active\/non-football|active\/nfi|non-football injury|non-football illness|placed on (?:the )?active\/non-football)\b/i,
];

const IR_TEXT_PATTERNS = [
  /\b(placed on (?:the )?injured reserve|placed on (?:the )?ir\b|season-ending injured reserve)\b/i,
];

const RETURN_PATTERNS = [
  /\b(return(?:ed|s|ing)? to practice|returns? to practice|back at practice|practices? for the first time|first practice back)\b/i,
  /\b(takes part|participat(?:ed|es|ing)|full participant|doing individual drills|full-team drills|cleared to participate)\b/i,
  /\b(cleared|activated|removed from (?:the )?pup|passed (?:his )?physical|looked good)\b/i,
  /\b(active in (?:[a-z]+'?s? )?(?:training camp )?practice|7-on-7|11-on-11)\b/i,
];

const EXPLICIT_SETBACK_PATTERNS = [
  /\b(suffered a setback|suffered a new|re-injured|reinjured|aggravated|carted off|left practice early|underwent surgery|out for the season|season-ending|expected to miss)\b/i,
  /\b(will miss|not practicing|did not participate|unable to practice|ruled out|suffered an issue)\b/i,
];

const SETBACK_PATTERNS = [
  /\b(setback|flare[- ]up|carted off|suffered a setback|re-injured|torn|tear|will miss|expected to miss|not practicing|did not participate|placed on)\b/i,
  /\b(out for the season|season-ending|underwent surgery)\b/i,
];

const LIMITED_PATTERNS = [
  /\b(limited|individual drills|not full|ramp(?:ing)? up|managed reps|eased back|pitch count)\b/i,
  /\b(snap count|limited snap|workload restriction)\b/i,
];

const HISTORICAL_CONTEXT_PATTERNS = [
  /\b(last (?:season|year)|in 202[0-5]|past (?:season|year)|prior (?:season|year)|previous (?:season|year)|former injury|recovering from offseason|offseason (?:surgery|rehab))\b/i,
  /\b(fully (?:recovered|cleared|healthy)|100 (?:percent|%|percent)|no restrictions|full contact|cleared for contact|cleared to play)\b/i,
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
  T: 'offensive_line_major',
  G: 'offensive_line_major',
  C: 'offensive_line_major',
  OL: 'offensive_line_major',
  OT: 'offensive_line_major',
  OG: 'offensive_line_major',
  DE: 'defensive_front_major',
  DT: 'defensive_front_major',
  DL: 'defensive_front_major',
  NT: 'defensive_front_major',
  EDGE: 'defensive_front_major',
  OLB: 'defensive_major',
  LB: 'defensive_major',
  CB: 'defensive_major',
  S: 'defensive_major',
  DB: 'defensive_major',
};

const AVAILABILITY_GROUPS = {
  QB: 'quarterback',
  RB: 'offensive_skill',
  WR: 'offensive_skill',
  TE: 'offensive_skill',
  FB: 'offensive_skill',
  T: 'offensive_line',
  G: 'offensive_line',
  C: 'offensive_line',
  OL: 'offensive_line',
  OT: 'offensive_line',
  OG: 'offensive_line',
  DE: 'defensive_front',
  DT: 'defensive_front',
  DL: 'defensive_front',
  NT: 'defensive_front',
  EDGE: 'defensive_front',
  OLB: 'linebacker',
  LB: 'linebacker',
  CB: 'secondary',
  S: 'secondary',
  DB: 'secondary',
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
  const body = String(text || '');
  let normalized = normalizeInjuryStatus(status);

  // If status is generically "Active" or "Active_News", check if the body text explicitly states PUP, NFI, or IR placement:
  if (normalized === 'ACTIVE_NEWS' || normalized === 'UNKNOWN') {
    if (PUP_TEXT_PATTERNS.some((re) => re.test(body))) normalized = 'PUP';
    else if (IR_TEXT_PATTERNS.some((re) => re.test(body))) normalized = 'IR';
  }

  if (normalized === 'IR') return { event_type: 'ir', availability_trend: 'worsening' };
  if (normalized === 'PUP') return { event_type: 'pup', availability_trend: 'worsening' };
  if (normalized === 'SUSPENSION') return { event_type: 'suspension', availability_trend: 'worsening' };
  if (normalized === 'OUT') return { event_type: 'out', availability_trend: 'worsening' };
  if (normalized === 'DOUBTFUL') return { event_type: 'doubtful', availability_trend: 'worsening' };

  const isReturn = RETURN_PATTERNS.some((re) => re.test(body));
  const isLimited = LIMITED_PATTERNS.some((re) => re.test(body));
  const isExplicitSetback = EXPLICIT_SETBACK_PATTERNS.some((re) => re.test(body));
  const hasHistoricalContext = HISTORICAL_CONTEXT_PATTERNS.some((re) => re.test(body));

  if (isReturn && (!isExplicitSetback || hasHistoricalContext)) {
    return {
      event_type: isLimited ? 'limited_return' : 'return_to_practice',
      availability_trend: 'improving',
    };
  }

  if (normalized === 'QUESTIONABLE' && isExplicitSetback && !hasHistoricalContext) {
    return { event_type: 'setback', availability_trend: 'worsening' };
  }

  if (isLimited && !isExplicitSetback) {
    return { event_type: 'limited', availability_trend: 'stable' };
  }

  if (isExplicitSetback && !hasHistoricalContext) {
    return { event_type: 'setback', availability_trend: 'worsening' };
  }

  if (normalized === 'ACTIVE_NEWS') return { event_type: 'active_news', availability_trend: 'unknown' };
  if (normalized === 'PROBABLE') return { event_type: 'probable', availability_trend: 'improving' };
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

export function availabilityGroup(position) {
  const pos = String(position || '').toUpperCase();
  return AVAILABILITY_GROUPS[pos] || 'other';
}

export function clusterAvailabilitySummary(events = []) {
  const summary = {
    offensive_line: { total: 0, worsening: 0, improving: 0, cluster_risk: false },
    defensive_front: { total: 0, worsening: 0, improving: 0, cluster_risk: false, opponent_offense_boost_risk: false },
  };

  for (const event of events || []) {
    const group = event.availability_group || availabilityGroup(event.position);
    if (!summary[group]) continue;
    summary[group].total += 1;
    if (event.availability_trend === 'worsening') summary[group].worsening += 1;
    if (event.availability_trend === 'improving') summary[group].improving += 1;
  }

  summary.offensive_line.cluster_risk = summary.offensive_line.worsening >= 2;
  summary.defensive_front.cluster_risk = summary.defensive_front.worsening >= 2;
  summary.defensive_front.opponent_offense_boost_risk = summary.defensive_front.worsening >= 1;
  return summary;
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
  const dedupeKey = record.espn_injury_id || record.dedupe_key || record.source_url || `${team}|${playerName}|${status}|${event_type}`;
  const evidenceId = record.evidence_id || `availability_evidence_${sha([
    record.source_type || 'structured_injury',
    record.source || 'ESPN injuries API',
    dedupeKey,
    playerName.toLowerCase(),
    event_type,
  ].join('|')).slice(0, 20)}`;
  const id = `avail_${sha([options.season || 2026, evidenceId].join('|')).slice(0, 16)}`;
  const teamIdentity = resolveEvidenceTeamOwnership({
    declaredTeam: team,
    source: record.source || 'ESPN injuries API',
    text,
  });

  return {
    id,
    evidence_id: evidenceId,
    season: Number(options.season || 2026),
    player_name: playerName,
    team_abbr: teamIdentity.primary_team,
    primary_team: teamIdentity.primary_team,
    related_teams: teamIdentity.related_teams,
    team_identity: { ...teamIdentity, contract_origin: 'resolved_v1' },
    team_nick: normalizeTeam(teamIdentity.primary_team) || null,
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
    availability_group: availabilityGroup(record.position),
    dedupe_key: dedupeKey,
    // F-26c §4 — FantasyPros /nfl/injuries carries two fields ESPN's free feed
    // doesn't have at all: a literal numeric play probability, and Wed/Thu/Fri
    // practice-report participation. Only FantasyPros records populate these
    // (undefined on every ESPN/training-camp record) — kept as optional
    // passthrough fields on the shared event shape rather than a separate
    // source-specific object, per the scope doc's "no new merge logic needed"
    // design. Not yet consumed by build-availability-impact-digest.js's
    // scoring (that's a phase-2 change, see scope doc §4) — carried through
    // now so it's available when that lands.
    probability_of_playing: record.probability_of_playing != null ? Number(record.probability_of_playing) : null,
    practice_1: record.practice_1 ?? null,
    practice_2: record.practice_2 ?? null,
    practice_3: record.practice_3 ?? null,
  };
}

export function availabilityEventFromTrainingCampItem(item, options = {}) {
  const text = [item.summary, item.raw_excerpt, item.betting_relevance, item.signal_type].filter(Boolean).join(' ');
  const statusHint = item.signal_type === 'injury' ? text : item.status_raw;
  const { event_type, availability_trend } = classifyAvailabilityEvent({ status: statusHint, text });
  if (!['return_to_practice', 'limited_return', 'limited', 'setback', 'pup', 'ir', 'out', 'doubtful', 'probable', 'active_news'].includes(event_type)) {
    return null;
  }
  const teamIdentity = resolveEvidenceTeamOwnership({
    declaredTeam: item.primary_team || item.team,
    declaredTeams: item.related_teams || [],
    source: item.source,
    sourceTeam: item.team_identity?.source_team,
    text,
  });
  const team = teamIdentity.primary_team || getTeamAbbreviation(item.team) || item.team || '';
  const sourceUrl = item.source_url || null;
  const dedupeKey = item.dedupe_key || sourceUrl || item.id;
  const evidenceId = `availability_evidence_${sha([
    item.source_type || 'training_camp',
    item.source || 'Training camp snapshot',
    item.evidence_id || dedupeKey,
    String(item.player || item.summary || '').toLowerCase(),
    event_type,
  ].join('|')).slice(0, 20)}`;
  const id = `avail_${sha([options.season || item.season || 2026, evidenceId].join('|')).slice(0, 16)}`;

  return {
    id,
    evidence_id: evidenceId,
    season: Number(options.season || item.season || 2026),
    player_name: item.player || null,
    team_abbr: team,
    primary_team: team,
    related_teams: mergeRelatedTeams(team, item.related_teams, teamIdentity.related_teams, item.team),
    team_identity: {
      ...teamIdentity,
      primary_team: team,
      related_teams: mergeRelatedTeams(team, item.related_teams, teamIdentity.related_teams, item.team),
      contract_origin: 'resolved_v1',
    },
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
    availability_group: availabilityGroup(item.position),
    dedupe_key: dedupeKey,
  };
}

export function dedupeAvailabilityEvents(events = []) {
  const byKey = new Map();
  for (const rawEvent of events.filter(Boolean)) {
    const resolved = resolveEvidenceTeamOwnership({
      declaredTeam: rawEvent.primary_team || rawEvent.team_abbr,
      declaredTeams: rawEvent.related_teams || [],
      source: rawEvent.source,
      sourceTeam: rawEvent.team_identity?.source_team,
      text: `${rawEvent.short_summary || ''} ${rawEvent.supporting_quote || ''}`,
    });
    const primaryTeam = resolved.primary_team || rawEvent.team_abbr;
    if (!primaryTeam) continue;
    const evidenceId = rawEvent.evidence_id || `availability_evidence_${sha([
      rawEvent.source_type || rawEvent.source,
      rawEvent.dedupe_key || rawEvent.source_url || rawEvent.id,
      String(rawEvent.player_name || rawEvent.short_summary || '').toLowerCase(),
      rawEvent.event_type,
    ].join('|')).slice(0, 20)}`;
    const event = {
      ...rawEvent,
      evidence_id: evidenceId,
      team_abbr: primaryTeam,
      primary_team: primaryTeam,
      related_teams: mergeRelatedTeams(primaryTeam, rawEvent.related_teams, resolved.related_teams, rawEvent.team_abbr),
      team_identity: {
        ...resolved,
        ownership_source: sourcePrimaryTeam(rawEvent.source)
          ? 'source_prefix'
          : (rawEvent.team_identity?.ownership_source || resolved.ownership_source),
        flags: [...new Set([...(rawEvent.team_identity?.flags || []), ...resolved.flags])],
        contract_origin: rawEvent.team_identity?.contract_origin || (rawEvent.team_identity ? 'resolved_v1' : 'legacy_normalized'),
      },
      team_nick: normalizeTeam(primaryTeam) || rawEvent.team_nick || null,
    };
    event.team_identity.primary_team = event.primary_team;
    event.team_identity.related_teams = event.related_teams;

    const key = evidenceId;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, event);
      continue;
    }

    const winner = String(event.captured_at || event.published_at).localeCompare(String(existing.captured_at || existing.published_at)) > 0
      ? event
      : existing;
    const legacyGroup = [existing, event].some((candidate) => candidate.team_identity?.contract_origin === 'legacy_normalized');
    const inferredPrimary = legacyGroup
      ? inferTeamMentions(`${winner.short_summary || ''} ${winner.supporting_quote || ''}`)[0]
      : null;
    const primary = sourcePrimaryTeam(winner.source) || inferredPrimary || winner.primary_team || winner.team_abbr;
    const related = mergeRelatedTeams(
      primary,
      existing.related_teams,
      event.related_teams,
      existing.team_abbr,
      event.team_abbr,
    );
    byKey.set(key, {
      ...winner,
      team_abbr: primary,
      primary_team: primary,
      related_teams: related,
      team_nick: normalizeTeam(primary) || winner.team_nick || null,
      team_identity: {
        ...(winner.team_identity || {}),
        primary_team: primary,
        related_teams: related,
        mentioned_teams: canonicalTeamList([
          ...(existing.team_identity?.mentioned_teams || []),
          ...(event.team_identity?.mentioned_teams || []),
        ]),
        flags: [...new Set([
          ...(existing.team_identity?.flags || []),
          ...(event.team_identity?.flags || []),
        ])],
      },
    });
  }
  return [...byKey.values()].sort((a, b) =>
    String(b.published_at || b.captured_at).localeCompare(String(a.published_at || a.captured_at)) ||
    a.team_abbr.localeCompare(b.team_abbr)
  );
}

export function buildAvailabilitySnapshot({ season = 2026, generatedAt = new Date().toISOString(), injuryRecords = [], trainingCampItems = [], sourceHealth = [] } = {}) {
  const injuryEvents = injuryRecords.map((record) => availabilityEventFromInjuryRecord(record, { season, generatedAt }));
  const campEvents = trainingCampItems.map((item) => availabilityEventFromTrainingCampItem(item, { season, generatedAt })).filter(Boolean);
  return buildAvailabilitySnapshotFromEvents({
    season,
    generatedAt,
    events: [...injuryEvents, ...campEvents],
    sourceHealth,
  });
}

export function buildAvailabilitySnapshotFromEvents({
  season = 2026,
  generatedAt = new Date().toISOString(),
  events: rawEvents = [],
  sourceHealth = [],
  normalization = null,
} = {}) {
  const events = dedupeAvailabilityEvents(rawEvents);
  const teamIdentityValidation = auditTeamIdentity(events, { teamField: 'team_abbr' });
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
      offensive_line_count: 0,
      offensive_line_worsening_count: 0,
      defensive_front_count: 0,
      defensive_front_worsening_count: 0,
      cluster_risks: null,
      events: [],
    };
    team.event_count += 1;
    if (event.availability_trend === 'improving') team.improving_count += 1;
    if (event.availability_trend === 'worsening') team.worsening_count += 1;
    if (event.impact_bucket !== 'depth_only') team.major_count += 1;
    if (event.availability_group === 'offensive_line') {
      team.offensive_line_count += 1;
      if (event.availability_trend === 'worsening') team.offensive_line_worsening_count += 1;
    }
    if (event.availability_group === 'defensive_front') {
      team.defensive_front_count += 1;
      if (event.availability_trend === 'worsening') team.defensive_front_worsening_count += 1;
    }
    if (team.events.length < 12) team.events.push(event);
  }

  for (const team of Object.values(teams)) {
    team.cluster_risks = clusterAvailabilitySummary(events.filter((event) => event.team_abbr === team.team_abbr));
  }

  return {
    meta: {
      schema: 'player_availability_snapshot_v1',
      season,
      generated_at: generatedAt,
      event_count: events.length,
      unique_evidence_count: teamIdentityValidation.unique_evidence_count,
      teams_with_events: Object.keys(teams).length,
      improving_count: events.filter((e) => e.availability_trend === 'improving').length,
      worsening_count: events.filter((e) => e.availability_trend === 'worsening').length,
      major_count: events.filter((e) => e.impact_bucket !== 'depth_only').length,
      offensive_line_worsening_count: events.filter((e) => e.availability_group === 'offensive_line' && e.availability_trend === 'worsening').length,
      defensive_front_worsening_count: events.filter((e) => e.availability_group === 'defensive_front' && e.availability_trend === 'worsening').length,
      teams_with_ol_cluster_risk: Object.values(teams).filter((team) => team.cluster_risks?.offensive_line?.cluster_risk).length,
      teams_with_defensive_front_cluster_risk: Object.values(teams).filter((team) => team.cluster_risks?.defensive_front?.cluster_risk).length,
      recommendation_status: 'availability_intel_only_not_picks',
      guardrails: {
        live_model_calls: false,
        supabase_writes: false,
        official_picks_generated: false,
      },
      source_health: sourceHealth,
      team_identity_validation: teamIdentityValidation,
      ...(normalization ? { normalization } : {}),
    },
    events,
    teams,
  };
}
