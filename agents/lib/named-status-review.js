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
