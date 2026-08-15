import { describe, expect, it } from 'vitest';
import { computeTeamSizingGates, NAMED_PLAYER_SIZING_CAP_TIERS, validateNamedStatusReview } from '../../agents/lib/named-status-review.js';

function makeReviewPayload(overrides = []) {
  return {
    cases: [
      {
        id: 'named-status-buf-connor-mcgovern-2026-08-11',
        player_name: 'Connor McGovern',
        expected_team: 'BUF',
        observed_team_assignments: ['BUF'],
        review_status: 'withheld_pending_confirmation',
        eligible_for_synthesis: false,
        disposition: 'Keep in needs-confirmation context.',
      },
      {
        id: 'named-status-gb-micah-parsons-2026-08-11',
        player_name: 'Micah Parsons',
        expected_team: 'GB',
        observed_team_assignments: ['DAL', 'GB'],
        review_status: 'conflicted_team_assignment',
        eligible_for_synthesis: false,
        disposition: 'Withhold from team aggregates until resolved.',
      },
      ...overrides,
    ],
  };
}

describe('computeTeamSizingGates', () => {
  it('gates every team a currently-unresolved case touches, including the whole conflicted-assignment set', () => {
    const gates = computeTeamSizingGates(makeReviewPayload());
    expect(gates.schema).toBe('named_player_sizing_gates_v1');
    expect(Object.keys(gates.teams).sort()).toEqual(['BUF', 'DAL', 'GB']);
    expect(gates.teams.BUF.players).toEqual(['Connor McGovern']);
    // DAL is gated even though it's not Parsons' "expected" team — the
    // dispute is precisely about which team he belongs to, so both
    // disputed sides must be capped, not just the expected one.
    expect(gates.teams.DAL.players).toEqual(['Micah Parsons']);
    expect(gates.teams.GB.players).toEqual(['Micah Parsons']);
  });

  it('caps every gated team to the small/speculative stake tiers', () => {
    const gates = computeTeamSizingGates(makeReviewPayload());
    for (const team of Object.values(gates.teams)) {
      expect(team.blocked_full_sleeve).toBe(true);
      expect(team.max_stake_tier_allowed).toEqual(NAMED_PLAYER_SIZING_CAP_TIERS);
    }
  });

  it('never gates a resolved (eligible_for_synthesis: true) case', () => {
    const gates = computeTeamSizingGates({
      cases: [{
        id: 'named-status-resolved-example',
        player_name: 'Resolved Player',
        expected_team: 'KC',
        observed_team_assignments: ['KC'],
        review_status: 'confirmed_current',
        eligible_for_synthesis: true,
      }],
    });
    expect(gates.gated_team_count).toBe(0);
    expect(gates.teams.KC).toBeUndefined();
  });

  it('handles an empty/missing payload without throwing', () => {
    expect(computeTeamSizingGates({}).gated_team_count).toBe(0);
    expect(computeTeamSizingGates(undefined).gated_team_count).toBe(0);
  });

  it('groups multiple distinct unresolved cases on the same team into one gate entry', () => {
    const gates = computeTeamSizingGates(makeReviewPayload([{
      id: 'named-status-buf-second-case',
      player_name: 'Another Bills Player',
      expected_team: 'BUF',
      observed_team_assignments: ['BUF'],
      review_status: 'withheld_pending_confirmation',
      eligible_for_synthesis: false,
    }]));
    expect(gates.teams.BUF.players).toEqual(['Connor McGovern', 'Another Bills Player']);
    expect(gates.teams.BUF.case_ids).toHaveLength(2);
  });
});

// 2026-08-13 Codex review finding #4: fetchNamedPlayerSizingGates() in
// agents/portfolio-dossier.js now calls validateNamedStatusReview() and
// fails hard (or stamps an explicit blocking marker under an opt-out flag)
// instead of silently returning "no gate" on any read/parse error. These
// tests cover the pure validation logic that decision is built on.
function validEvidence(n = 1) {
  return Array.from({ length: n }, (_, i) => ({ artifact_path: `data/x-${i}.json`, evidence_id: `ev-${i}` }));
}

function validRequiredCasesPayload(overrides = {}) {
  return {
    cases: [
      {
        id: 'named-status-buf-connor-mcgovern-2026-08-11',
        player_name: 'Connor McGovern',
        expected_team: 'BUF',
        observed_team_assignments: ['BUF'],
        review_status: 'withheld_pending_confirmation',
        human_verified: false,
        eligible_for_synthesis: false,
        human_review_required: true,
        missing: ['confirmed_current_role'],
        evidence: validEvidence(1),
        ...(overrides.mcgovern || {}),
      },
      {
        id: 'named-status-gb-micah-parsons-2026-08-11',
        player_name: 'Micah Parsons',
        expected_team: 'GB',
        observed_team_assignments: ['DAL', 'GB'],
        review_status: 'conflicted_team_assignment',
        human_verified: false,
        eligible_for_synthesis: false,
        human_review_required: true,
        missing: ['team_assignment_confirmation'],
        evidence: validEvidence(1),
        ...(overrides.parsons || {}),
      },
    ],
  };
}

describe('validateNamedStatusReview', () => {
  it('passes on a well-formed payload containing both required cases', () => {
    const result = validateNamedStatusReview(validRequiredCasesPayload());
    expect(result.status).toBe('pass');
    expect(result.missing_required_case_count).toBe(0);
    expect(result.invalid_case_count).toBe(0);
  });

  it('blocks when the payload is missing (empty/undefined) — both required cases absent', () => {
    expect(validateNamedStatusReview({}).status).toBe('blocked');
    expect(validateNamedStatusReview({}).missing_required_case_count).toBe(2);
    expect(validateNamedStatusReview(undefined).status).toBe('blocked');
  });

  it('blocks when only one required case is present', () => {
    const payload = validRequiredCasesPayload();
    payload.cases = [payload.cases[0]]; // drop the Parsons/GB case
    const result = validateNamedStatusReview(payload);
    expect(result.status).toBe('blocked');
    expect(result.missing_required_case_count).toBe(1);
    expect(result.missing_required_cases[0]).toMatchObject({ team: 'GB', player_name: 'Micah Parsons' });
  });

  it('blocks when a required case is present but malformed (missing evidence reference)', () => {
    const payload = validRequiredCasesPayload({ mcgovern: { evidence: [] } });
    const result = validateNamedStatusReview(payload);
    expect(result.status).toBe('blocked');
    expect(result.invalid_case_count).toBeGreaterThan(0);
    expect(result.invalid_cases.some((c) => c.player_name === 'Connor McGovern')).toBe(true);
  });

  it('blocks when a required case has an invalid review_status', () => {
    const payload = validRequiredCasesPayload({ parsons: { review_status: 'not_a_real_status' } });
    const result = validateNamedStatusReview(payload);
    expect(result.status).toBe('blocked');
    expect(result.invalid_cases.some((c) => c.player_name === 'Micah Parsons')).toBe(true);
  });

  it('blocks when a withheld case is missing its non-eligibility guardrails', () => {
    const payload = validRequiredCasesPayload({ mcgovern: { eligible_for_synthesis: true } });
    const result = validateNamedStatusReview(payload);
    expect(result.status).toBe('blocked');
    expect(result.invalid_cases.some((c) => c.reason === 'withheld_case_missing_non_eligibility_guardrails')).toBe(true);
  });

  it('a valid current McGovern/Parsons payload gates Bills, Packers, and Cowboys as expected once it passes validation', () => {
    const payload = validRequiredCasesPayload();
    expect(validateNamedStatusReview(payload).status).toBe('pass');
    const gates = computeTeamSizingGates(payload);
    expect(Object.keys(gates.teams).sort()).toEqual(['BUF', 'DAL', 'GB']);
  });
});
