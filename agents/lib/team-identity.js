import { getTeamAbbreviation, NFL_TEAMS } from '../../src/lib/teams.js';

const AMBIGUOUS_CITY_ALIASES = new Set(['los angeles', 'new york']);
const NEVER_INFER_ALIASES = new Set(['la']);
const GENERIC_LONG_ALIASES = new Set(['football team']);

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function escapeRegex(value) {
  return String(value).split(/\s+/).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
}

function firstMatch(text, alias, flags) {
  const pattern = new RegExp(`(^|[^A-Za-z0-9])(${escapeRegex(alias)})(?=$|[^A-Za-z0-9])`, flags);
  const match = pattern.exec(String(text || ''));
  return match ? match.index + match[1].length : -1;
}

export function canonicalTeamAbbreviation(value) {
  return getTeamAbbreviation(value) || null;
}

export function canonicalTeamList(values = []) {
  const list = Array.isArray(values) ? values : [values];
  return unique(list.map(canonicalTeamAbbreviation));
}

export function sourcePrimaryTeam(source) {
  const match = String(source || '').trim().match(/^([A-Z]{2,3})\s+Beat\s+-/i);
  return match ? canonicalTeamAbbreviation(match[1].toUpperCase()) : null;
}

function aliasesForTeam(team) {
  const longAliases = unique([
    team.fullName,
    team.name,
    team.city,
    ...(team.aliases || []),
  ]).filter((alias) => {
    const normalized = String(alias).trim().toLowerCase();
    return normalized.length >= 4
      && !AMBIGUOUS_CITY_ALIASES.has(normalized)
      && !GENERIC_LONG_ALIASES.has(normalized)
      && !NEVER_INFER_ALIASES.has(normalized);
  });

  const shortAliases = unique([
    team.abbreviation,
    ...(team.altAbbreviations || []),
  ].map((alias) => String(alias || '').trim().toUpperCase()))
    .filter((alias) => alias && !NEVER_INFER_ALIASES.has(alias.toLowerCase()));

  return { longAliases, shortAliases };
}

/**
 * Find team mentions in prose without treating ordinary words such as "no"
 * or "was" as abbreviations. Short codes must preserve uppercase in the
 * source text. Shared-city aliases never select NYG/NYJ or LAC/LAR by city.
 */
export function findTeamMentions(text = '') {
  const mentions = [];

  for (const team of Object.values(NFL_TEAMS)) {
    const { longAliases, shortAliases } = aliasesForTeam(team);
    let best = null;

    for (const alias of longAliases) {
      const index = firstMatch(text, alias, 'i');
      if (index >= 0 && (!best || index < best.index || (index === best.index && alias.length > best.alias.length))) {
        best = { team: team.abbreviation, index, alias, match_type: 'name_or_city' };
      }
    }

    for (const alias of shortAliases) {
      const index = firstMatch(text, alias, '');
      if (index >= 0 && (!best || index < best.index || (index === best.index && alias.length > best.alias.length))) {
        best = { team: team.abbreviation, index, alias, match_type: 'uppercase_abbreviation' };
      }
    }

    if (best) mentions.push(best);
  }

  return mentions.sort((a, b) => a.index - b.index || b.alias.length - a.alias.length || a.team.localeCompare(b.team));
}

export function inferTeamMentions(text = '') {
  return unique(findTeamMentions(text).map((mention) => mention.team));
}

/**
 * Resolve one primary owner for an evidence item. A feed/source team is
 * authoritative; additional explicit or prose-mentioned teams are related
 * entities and do not receive duplicate aggregate rows.
 */
export function resolveEvidenceTeamOwnership({
  declaredTeam = null,
  declaredTeams = [],
  source = null,
  sourceTeam = null,
  text = '',
} = {}) {
  const feedTeam = canonicalTeamAbbreviation(sourceTeam);
  const prefixTeam = sourcePrimaryTeam(source);
  const authoritativeTeam = feedTeam || prefixTeam;
  const declared = canonicalTeamList([
    ...(Array.isArray(declaredTeam) ? declaredTeam : [declaredTeam]),
    ...(Array.isArray(declaredTeams) ? declaredTeams : [declaredTeams]),
  ]);
  const mentioned = inferTeamMentions(text);
  const primaryTeam = authoritativeTeam || declared[0] || mentioned[0] || null;
  const flags = [];

  if (feedTeam && prefixTeam && feedTeam !== prefixTeam) flags.push('feed_source_prefix_mismatch');
  if (authoritativeTeam && declared.some((team) => team !== authoritativeTeam)) flags.push('declared_source_team_mismatch');
  if (!authoritativeTeam && declared.length > 1) flags.push('multiple_declared_teams');
  // 2026-09-03 fix (Andy, production-readiness pass): this used to fire on
  // ANY 2+-team mention with no authoritative source - which is the NORMAL
  // shape of a wire-feed game recap ("Bears' 24-0 run" mentioning CHI and
  // CLE, the two teams that played each other). Auditing the actual 2026-08-16
  // training-camp snapshot found 33 flagged items: 30 were exactly this
  // two-team-recap case, where first-mention correctly matched the headline's
  // real subject team every single time (verified by hand against the source
  // text) and the OTHER team is already captured correctly in related_teams
  // below - there was no real ambiguity, just an overly blunt trigger that
  // hard-BLOCKED the whole file over normal data. The remaining 3 were
  // genuinely ambiguous multi-team roundups (3-6 teams mentioned, e.g. a
  // "Preseason Week 1 Recap" spanning six teams) where guessing a single
  // primary really would misattribute the intel - those still correctly flag.
  // Threshold: 3+ mentioned teams with no authoritative source is genuine
  // ambiguity; exactly 2 is the ordinary two-team-matchup case and is handled
  // correctly by the existing first-mention-primary + related-teams logic.
  if (!authoritativeTeam && !declared.length && mentioned.length > 2) flags.push('ambiguous_inferred_primary');
  if (!primaryTeam) flags.push('missing_primary_team');

  const relatedTeams = unique([
    ...declared,
    ...mentioned,
    ...(feedTeam && prefixTeam && feedTeam !== prefixTeam ? [prefixTeam] : []),
  ]).filter((team) => team !== primaryTeam);

  return {
    primary_team: primaryTeam,
    related_teams: relatedTeams,
    mentioned_teams: mentioned,
    source_team: authoritativeTeam,
    ownership_source: feedTeam
      ? 'feed_team'
      : prefixTeam
        ? 'source_prefix'
        : declared.length
          ? 'declared_team'
          : mentioned.length
            ? 'inferred_first_mention'
            : 'missing',
    flags: unique(flags),
  };
}

export function mergeRelatedTeams(primaryTeam, ...lists) {
  return unique(lists.flatMap((list) => Array.isArray(list) ? list : [list]).map(canonicalTeamAbbreviation))
    .filter((team) => team !== primaryTeam);
}

export function auditTeamIdentity(records = [], {
  teamField = 'team',
  evidenceField = 'evidence_id',
} = {}) {
  const evidenceCounts = new Map();
  let sourcePrefixRows = 0;
  let authoritativeSourceRows = 0;
  let primarySourceMismatches = 0;
  let missingPrimaryTeams = 0;
  let missingEvidenceIds = 0;
  let relatedTeamReferences = 0;
  let ambiguousPrimaryRows = 0;
  let correctedSourceAssignments = 0;

  for (const record of records) {
    const primary = canonicalTeamAbbreviation(record?.[teamField]);
    const prefixTeam = sourcePrimaryTeam(record?.source);
    const sourceTeam = canonicalTeamAbbreviation(record?.team_identity?.source_team) || prefixTeam;
    if (prefixTeam) sourcePrefixRows += 1;
    if (sourceTeam) {
      authoritativeSourceRows += 1;
      if (sourceTeam !== primary) primarySourceMismatches += 1;
    }
    if (!primary) missingPrimaryTeams += 1;
    relatedTeamReferences += canonicalTeamList(record?.related_teams || []).filter((team) => team !== primary).length;
    if ((record?.team_identity?.flags || []).includes('ambiguous_inferred_primary')) ambiguousPrimaryRows += 1;
    if ((record?.team_identity?.flags || []).includes('declared_source_team_mismatch')) correctedSourceAssignments += 1;

    const evidenceId = record?.[evidenceField] || record?.dedupe_key || record?.source_url || record?.id;
    if (evidenceId) evidenceCounts.set(evidenceId, (evidenceCounts.get(evidenceId) || 0) + 1);
    else missingEvidenceIds += 1;
  }

  const duplicateEvidenceRows = [...evidenceCounts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  // 2026-09-03 fix (Andy, production-readiness pass): mismatches/missing-
  // team/missing-evidence-id/duplicate-evidence are unambiguous correctness
  // bugs in the data - any nonzero count means something is actually wrong
  // and should keep blocking. ambiguous_inferred_primary is different: each
  // flagged record is ALREADY self-quarantined (its primary-team guess is
  // visibly flagged, not silently trusted), so a handful of genuinely
  // ambiguous multi-team roundup articles in an otherwise-clean 225-item feed
  // is not itself evidence the feed is broken - it's evidence three specific
  // items need a human's eyes, which the flag already surfaces per-record. A
  // hard block over 3 flagged-and-visible records was throwing away 222 good
  // ones. Block on volume instead: >5% ambiguous is the real signal that
  // team-identity resolution is failing systemically for this source (this
  // is what the original bug looked like: 33/225 = 14.7%).
  const ambiguousRatio = records.length ? ambiguousPrimaryRows / records.length : 0;
  const status = primarySourceMismatches === 0
    && missingPrimaryTeams === 0
    && missingEvidenceIds === 0
    && duplicateEvidenceRows === 0
    && ambiguousRatio <= 0.05
    ? 'pass'
    : 'blocked';

  return {
    schema: 'team_identity_validation_v1',
    status,
    row_count: records.length,
    unique_evidence_count: evidenceCounts.size,
    duplicate_evidence_rows: duplicateEvidenceRows,
    source_prefix_rows: sourcePrefixRows,
    authoritative_source_rows: authoritativeSourceRows,
    primary_source_mismatch_count: primarySourceMismatches,
    missing_primary_team_count: missingPrimaryTeams,
    missing_evidence_id_count: missingEvidenceIds,
    related_team_reference_count: relatedTeamReferences,
    ambiguous_inferred_primary_count: ambiguousPrimaryRows,
    corrected_source_assignment_count: correctedSourceAssignments,
  };
}

export function teamIdentityValidationBlockers(validation) {
  if (!validation || validation.schema !== 'team_identity_validation_v1') {
    return ['legacy artifact has no team-identity validation'];
  }

  // 2026-09-03 fix (Andy, production-readiness pass): this used to add an
  // "ambiguous inferred primary team(s)" blocker for ANY nonzero count,
  // independent of auditTeamIdentity()'s own status calculation - so even
  // after that function correctly started distinguishing "a handful of
  // flagged-and-visible edge cases in an otherwise-clean feed" (pass) from
  // "systemic team-identity failure" (blocked, >5% ambiguous), this function
  // re-applied the old any-nonzero-blocks rule on top of it and silently
  // overrode the more correct judgment. The two must use the same rule:
  // report ambiguous count as informational detail whenever status is
  // 'pass' (so it's still visible in the evidence line - not hidden, just
  // not blocking), and only add it to the actual BLOCKER list when it's
  // part of why status came back non-'pass'.
  return [
    ...(validation.status !== 'pass' ? [`team identity status=${validation.status}`] : []),
    ...((validation.primary_source_mismatch_count || 0) > 0
      ? [`${validation.primary_source_mismatch_count} primary/source-team mismatch(es)`]
      : []),
    ...((validation.duplicate_evidence_rows || 0) > 0
      ? [`${validation.duplicate_evidence_rows} duplicate evidence row(s)`]
      : []),
    ...((validation.missing_primary_team_count || 0) > 0
      ? [`${validation.missing_primary_team_count} missing primary team(s)`]
      : []),
    ...((validation.missing_evidence_id_count || 0) > 0
      ? [`${validation.missing_evidence_id_count} missing evidence ID(s)`]
      : []),
    ...(validation.status !== 'pass' && (validation.ambiguous_inferred_primary_count || 0) > 0
      ? [`${validation.ambiguous_inferred_primary_count} ambiguous inferred primary team(s)`]
      : []),
  ];
}
