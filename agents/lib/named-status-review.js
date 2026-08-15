const REQUIRED_CASES = [
  { team: 'BUF', player_name: 'Connor McGovern' },
  { team: 'GB', player_name: 'Micah Parsons' },
];

const ALLOWED_REVIEW_STATUSES = new Set([
  'confirmed_current',
  'withheld_pending_confirmation',
  'conflicted_team_assignment',
]);

function playerKey(playerName) {
  return String(playerName || '').trim().toLowerCase();
}

function caseKey(team, playerName) {
  return `${String(team || '').trim().toUpperCase()}|${playerKey(playerName)}`;
}

export function indexNamedStatusReviews(payload = {}) {
  return new Map((payload.cases || []).map((item) => [playerKey(item.player_name), item]));
}

export function validateNamedStatusReview(payload = {}) {
  const cases = Array.isArray(payload.cases) ? payload.cases : [];
  const indexed = new Map(cases.map((item) => [caseKey(item.expected_team || item.team, item.player_name), item]));
  const caseKeys = cases.map((item) => caseKey(item.expected_team || item.team, item.player_name));
  const duplicateCaseCount = caseKeys.length - new Set(caseKeys).size;
  const missingRequiredCases = REQUIRED_CASES.filter((required) => !indexed.has(caseKey(required.team, required.player_name)));
  const invalidCases = [];

  for (const item of cases) {
    const evidence = Array.isArray(item.evidence) ? item.evidence : [];
    const missing = Array.isArray(item.missing) ? item.missing : [];
    if (!item.player_name || !item.expected_team || !ALLOWED_REVIEW_STATUSES.has(item.review_status)) {
      invalidCases.push({ player_name: item.player_name || null, reason: 'missing_identity_or_invalid_review_status' });
      continue;
    }
    if (!evidence.length || evidence.some((row) => !row.artifact_path || !row.evidence_id)) {
      invalidCases.push({ player_name: item.player_name, reason: 'missing_local_evidence_reference' });
    }
    if (item.review_status === 'confirmed_current') {
      if (item.human_verified !== true || item.eligible_for_synthesis !== true || !item.confirmation_source_url) {
        invalidCases.push({ player_name: item.player_name, reason: 'confirmation_missing_human_and_source_guardrails' });
      }
    } else if (item.human_verified !== false || item.eligible_for_synthesis !== false || item.human_review_required !== true || !missing.length) {
      invalidCases.push({ player_name: item.player_name, reason: 'withheld_case_missing_non_eligibility_guardrails' });
    }
  }

  const blockers = missingRequiredCases.length + invalidCases.length + duplicateCaseCount;
  return {
    schema: 'named_status_review_validation_v1',
    status: blockers ? 'blocked' : 'pass',
    required_case_count: REQUIRED_CASES.length,
    recorded_case_count: cases.length,
    confirmed_count: cases.filter((item) => item.review_status === 'confirmed_current').length,
    withheld_count: cases.filter((item) => item.review_status !== 'confirmed_current').length,
    synthesis_eligible_count: cases.filter((item) => item.eligible_for_synthesis === true).length,
    missing_required_case_count: missingRequiredCases.length,
    missing_required_cases: missingRequiredCases,
    invalid_case_count: invalidCases.length,
    invalid_cases: invalidCases,
    duplicate_case_count: duplicateCaseCount,
  };
}

// 2026-08-13: this validation gate has existed at the evidence-lane level
// (projected starters, availability, impact digest all already exclude
// unresolved named cases and set needs_human_review). What was missing is
// any propagation into the portfolio dossier or synthesis output — neither
// agents/portfolio-dossier.js nor agents/portfolio-synthesize.js referenced
// named_status_review or eligible_for_synthesis at all before this change.
// See docs/FUTURES_ARTICLE_REACQUISITION_AND_GATES_DESIGN_2026-08-13.md §2.
//
// Stake-tier vocabulary matches agents/portfolio-synthesize.js's
// stake_tier enum (core|standard|small|speculative, see line ~194) and the
// incident brief's own stake vocabulary — "conviction exception" there maps
// to this repo's small/speculative tiers, never core/standard, while a named
// case remains unresolved.
export const NAMED_PLAYER_SIZING_CAP_TIERS = Object.freeze(['small', 'speculative']);

function sizingCaseKey(item) {
  return caseKey(item.expected_team || item.team, item.player_name);
}

/**
 * Groups every currently-unresolved named-status case (eligible_for_synthesis
 * !== true) by every team it touches — both the case's expected_team AND
 * every team in observed_team_assignments, since a case like Micah Parsons'
 * is precisely a dispute about WHICH team he belongs to; capping only the
 * "expected" team would let a thesis on the other disputed team through
 * uncapped. Confirmed/resolved cases (eligible_for_synthesis === true) never
 * produce a gate entry.
 *
 * Pure function, no I/O — same convention as the rest of this file and
 * agents/lib/board-validate.js/win-dist.js.
 */
export function computeTeamSizingGates(payload = {}) {
  const cases = Array.isArray(payload.cases) ? payload.cases : [];
  const byTeam = {};
  for (const item of cases) {
    if (item.eligible_for_synthesis === true) continue;
    const teams = new Set([
      ...(item.expected_team ? [String(item.expected_team).trim().toUpperCase()] : []),
      ...(Array.isArray(item.observed_team_assignments)
        ? item.observed_team_assignments.map((team) => String(team).trim().toUpperCase())
        : []),
    ]);
    for (const team of teams) {
      if (!team) continue;
      if (!byTeam[team]) {
        byTeam[team] = {
          blocked_full_sleeve: true,
          max_stake_tier_allowed: NAMED_PLAYER_SIZING_CAP_TIERS,
          case_ids: [],
          players: [],
          reasons: [],
        };
      }
      const entry = byTeam[team];
      entry.case_ids.push(item.id || sizingCaseKey(item));
      if (item.player_name && !entry.players.includes(item.player_name)) entry.players.push(item.player_name);
      entry.reasons.push(`${item.player_name || 'unnamed player'}: ${item.review_status || 'unresolved'}${item.disposition ? ` — ${item.disposition}` : ''}`);
    }
  }
  return {
    schema: 'named_player_sizing_gates_v1',
    generated_at: new Date().toISOString(),
    source_case_count: cases.length,
    gated_team_count: Object.keys(byTeam).length,
    teams: byTeam,
  };
}
