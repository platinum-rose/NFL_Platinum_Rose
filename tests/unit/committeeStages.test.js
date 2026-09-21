// tests/unit/committeeStages.test.js
// rev-22-review finding #6: direct automated coverage for
// agents/lib/committee.js's runSkepticStage()/runRiskEditorStage() (see
// scopedDossier.test.js header note). No network -- callModel is always a
// mocked async function.
//
// rev-23-followup2 (Codex finding): the rev-22/rev-23 versions of these
// tests only checked KEY coverage (every candidate/survivor accounted for
// exactly once) -- a verdict/finalized/passes entry that was contract-
// incomplete (e.g. { "key": "a" } alone) still passed. This revision
// replaces every fixture with a genuinely complete, contract-valid entry
// and adds missing/wrong-type/invalid-enum tests for every required field,
// plus duplicate-input-key tests for the candidates/survivors arrays
// themselves (not just the model's response).
import { describe, expect, it } from 'vitest';
import { runSkepticStage, runRiskEditorStage, buildRiskEditorUserPrompt } from '../../agents/lib/committee.js';

const candidates = [
  { key: 'k1', market: 'wins', selection: 'x', confidence: 60, needs_human_review: false, correlated_week1: ['a'] },
  { key: 'k2', market: 'wins', selection: 'y', confidence: 50, needs_human_review: false },
];

// A genuinely complete, contract-valid verdict per candidate in `candidates`.
function fullVerdicts(overrides = {}) {
  return {
    verdicts: [
      { key: 'k1', skeptic_note: 'Thesis holds up.', confidence_delta: 5, verdict: 'hold' },
      { key: 'k2', skeptic_note: 'Weak evidence chain.', confidence_delta: -10, verdict: 'downgrade' },
    ],
    ...overrides,
  };
}

// A genuinely complete, contract-valid finalized/passes split covering
// both survivors in `candidates` (used as `survivors` in the Risk/Editor
// tests below).
function fullRiskOutput(overrides = {}) {
  return {
    finalized: [
      { key: 'k1', bet_threshold: '-120', needs_human_review: false, stake_tier: 'standard', risk_note: 'Solid, no correlation concerns.' },
    ],
    passes: [
      { key: 'k2', reason: 'Too correlated with k1.' },
    ],
    portfolio_notes: 'One core position, one pass for correlation.',
    ...overrides,
  };
}

// A genuinely complete, contract-valid scenario_review (rev-23-followup4,
// Codex finding #6) -- required in normal (non-suppressed) mode only; see
// RISK_EDITOR_SYSTEM_PROMPT's "Return STRICT JSON only" spec.
function fullScenarioReview(overrides = {}) {
  return {
    max_exposure_note: 'Total exposure stays within tolerance.',
    funded_liability_note: 'No funded liability concerns.',
    coverage_note: 'Covers both in-scope markets.',
    concentration_note: 'No single-team concentration risk.',
    hedge_optionality_note: 'No hedge optionality to note.',
    needs_human_review: false,
    ...overrides,
  };
}

// rev-23-followup4 fix (Codex finding #6): every fixture/test above and
// below this point is exercising OTHER parts of the Risk/Editor contract
// (bet_threshold, stake_tier, portfolio_notes, ...), not scenario_review --
// defaulting the shared mock to `suppressed: true` keeps their existing,
// unrelated expectations intact (scenario_review stays optional under
// suppression) while the dedicated describe block below explicitly tests
// BOTH modes for scenario_review itself.
function mockCall(text) {
  return { systemPrompt: 's', model: 'm', callModel: async () => ({ text, usage: {} }), suppressed: true };
}

describe('runSkepticStage — degenerate/partial-response rejection', () => {
  it('fails on a literal {} response', async () => {
    const r = await runSkepticStage(candidates, mockCall('{}'));
    expect(r.status).toBe('attempt_failed');
    expect(r.failure_phase).toBe('parse');
  });

  it('fails on an empty verdicts array when candidates were sent', async () => {
    const r = await runSkepticStage(candidates, mockCall(JSON.stringify({ verdicts: [] })));
    expect(r.status).toBe('attempt_failed');
  });

  it('succeeds on zero candidates with an empty verdicts array', async () => {
    const r = await runSkepticStage([], mockCall(JSON.stringify({ verdicts: [] })));
    expect(r.status).toBe('success');
  });

  it('fails on a partial response covering only some candidates', async () => {
    const r = await runSkepticStage(candidates, mockCall(JSON.stringify(fullVerdicts({ verdicts: [fullVerdicts().verdicts[0]] }))));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/missing verdict\(s\) for: k2/);
  });

  it('fails on a duplicate verdict key', async () => {
    const dup = fullVerdicts();
    dup.verdicts = [dup.verdicts[0], { ...dup.verdicts[0] }, dup.verdicts[1]];
    const r = await runSkepticStage(candidates, mockCall(JSON.stringify(dup)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/duplicate verdict/);
  });

  it('fails on a verdict referencing an unknown key', async () => {
    const bad = fullVerdicts();
    bad.verdicts[1] = { ...bad.verdicts[1], key: 'kXXX' };
    const r = await runSkepticStage(candidates, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/unknown key/);
  });

  it('fails on an invalid verdict enum value', async () => {
    const bad = fullVerdicts();
    bad.verdicts[0] = { ...bad.verdicts[0], verdict: 'maybe' };
    const r = await runSkepticStage(candidates, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/invalid|missing "verdict"/);
  });

  it('fails on a key-only verdict entry (the exact regression case Codex reproduced)', async () => {
    const r = await runSkepticStage(candidates, mockCall(JSON.stringify({ verdicts: [{ key: 'a' }] })));
    expect(r.status).toBe('attempt_failed');
    // 'a' isn't even one of the sent candidate keys, so the unknown-key
    // check fires first -- confirming the entry is rejected either way.
    expect(r.error).toMatch(/unknown key "a"/);
  });

  it('fails on a contract-incomplete verdict entry for a REAL candidate key (key-only, still short-circuits before defaulting to hold)', async () => {
    const r = await runSkepticStage(candidates, mockCall(JSON.stringify({ verdicts: [{ key: 'k1' }, fullVerdicts().verdicts[1]] })));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/skeptic_note/);
  });

  it('fails on a non-object verdict entry', async () => {
    const r = await runSkepticStage(candidates, mockCall(JSON.stringify({ verdicts: ['nope', fullVerdicts().verdicts[1]] })));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/not a plain object/);
  });

  it('fails on a missing skeptic_note', async () => {
    const bad = fullVerdicts();
    delete bad.verdicts[0].skeptic_note;
    const r = await runSkepticStage(candidates, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/skeptic_note is missing/);
  });

  it('fails on a non-string skeptic_note', async () => {
    const bad = fullVerdicts();
    bad.verdicts[0].skeptic_note = 42;
    const r = await runSkepticStage(candidates, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/skeptic_note is missing/);
  });

  it('fails on a missing confidence_delta', async () => {
    const bad = fullVerdicts();
    delete bad.verdicts[0].confidence_delta;
    const r = await runSkepticStage(candidates, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/confidence_delta is missing/);
  });

  it('fails on a non-numeric confidence_delta', async () => {
    const bad = fullVerdicts();
    bad.verdicts[0].confidence_delta = 'a lot';
    const r = await runSkepticStage(candidates, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/confidence_delta is missing/);
  });

  it('fails on a missing verdict field', async () => {
    const bad = fullVerdicts();
    delete bad.verdicts[0].verdict;
    const r = await runSkepticStage(candidates, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/missing "verdict"/);
  });

  it('fails on an empty-string stronger_disconfirming_factor when present', async () => {
    const bad = fullVerdicts();
    bad.verdicts[0].stronger_disconfirming_factor = '';
    const r = await runSkepticStage(candidates, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/stronger_disconfirming_factor is missing/);
  });

  it('succeeds with a valid stronger_disconfirming_factor present', async () => {
    const ok = fullVerdicts();
    ok.verdicts[0].stronger_disconfirming_factor = 'Actually a bigger risk than stated.';
    const r = await runSkepticStage(candidates, mockCall(JSON.stringify(ok)));
    expect(r.status).toBe('success');
  });

  it('fails on a duplicate key within the INPUT candidates array itself', async () => {
    const dupCandidates = [candidates[0], { ...candidates[0] }];
    const r = await runSkepticStage(dupCandidates, mockCall(JSON.stringify(fullVerdicts({ verdicts: [fullVerdicts().verdicts[0]] }))));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/duplicate key "k1" among its own input/);
  });

  it('succeeds on a complete, valid, one-verdict-per-candidate response', async () => {
    const r = await runSkepticStage(candidates, mockCall(JSON.stringify(fullVerdicts())));
    expect(r.status).toBe('success');
    expect(r.survivors.map((s) => s.key)).toEqual(['k1', 'k2']);
    expect(r.killed).toEqual([]);
  });

  it('routes a "kill" verdict candidate out of survivors (still requires the full contract)', async () => {
    const withKill = fullVerdicts();
    withKill.verdicts[1] = { ...withKill.verdicts[1], verdict: 'kill' };
    const r = await runSkepticStage(candidates, mockCall(JSON.stringify(withKill)));
    expect(r.status).toBe('success');
    expect(r.survivors.map((s) => s.key)).toEqual(['k1']);
    expect(r.killed.map((k) => k.key)).toEqual(['k2']);
  });
});

describe('runRiskEditorStage — degenerate/partial-response rejection', () => {
  const survivors = candidates;

  it('fails on a literal {} response', async () => {
    const r = await runRiskEditorStage(survivors, {}, mockCall('{}'));
    expect(r.status).toBe('attempt_failed');
    expect(r.failure_phase).toBe('parse');
  });

  it('fails when both finalized and passes are empty for nonzero survivors', async () => {
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify({ finalized: [], passes: [], portfolio_notes: 'n/a' })));
    expect(r.status).toBe('attempt_failed');
  });

  it('succeeds on zero survivors with both arrays empty', async () => {
    const r = await runRiskEditorStage([], {}, mockCall(JSON.stringify({ finalized: [], passes: [], portfolio_notes: 'No survivors.' })));
    expect(r.status).toBe('success');
  });

  it('fails on a partial response covering only some survivors', async () => {
    const bad = fullRiskOutput({ passes: [] });
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/missing "finalized"\/"passes" entry for: k2/);
  });

  it('fails when a key appears in both finalized and passes', async () => {
    const bad = fullRiskOutput();
    bad.passes = [...bad.passes, { key: 'k1', reason: 'also passing on it' }];
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/BOTH "finalized" and "passes"/);
  });

  it('fails on a duplicate finalized key', async () => {
    const bad = fullRiskOutput();
    bad.finalized = [bad.finalized[0], { ...bad.finalized[0] }];
    bad.passes = [];
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/duplicate "finalized"/);
  });

  it('fails on a finalized entry referencing an unknown key', async () => {
    const bad = fullRiskOutput();
    bad.finalized[0] = { ...bad.finalized[0], key: 'kXXX' };
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/unknown key/);
  });

  it('fails on the exact regression case Codex reproduced: {finalized:[{key:"a"}],passes:[]}', async () => {
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify({ finalized: [{ key: 'a' }], passes: [], portfolio_notes: 'n/a' })));
    expect(r.status).toBe('attempt_failed');
    // "a" isn't a real survivor key, but the contract-completeness check on
    // the entry itself (bet_threshold/needs_human_review/stake_tier/
    // risk_note) is what must fire even for a real key -- see the
    // dedicated "key-only finalized entry for a REAL survivor" test below.
  });

  it('fails on a key-only finalized entry for a REAL survivor key (contract-incomplete, not just unknown-key)', async () => {
    const bad = { finalized: [{ key: 'k1' }, fullRiskOutput().finalized[0]].slice(0, 1).concat([{ key: 'k2', bet_threshold: '-105', needs_human_review: false, stake_tier: 'small', risk_note: 'ok' }]), passes: [], portfolio_notes: 'n/a' };
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/bet_threshold is missing/);
  });

  it('fails on a non-object finalized entry', async () => {
    const bad = fullRiskOutput();
    bad.finalized = ['nope'];
    bad.passes = [{ key: 'k2', reason: 'x' }];
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/not a plain object/);
  });

  it('fails on a missing bet_threshold', async () => {
    const bad = fullRiskOutput();
    delete bad.finalized[0].bet_threshold;
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/bet_threshold is missing/);
  });

  it('fails on a non-string bet_threshold', async () => {
    const bad = fullRiskOutput();
    bad.finalized[0].bet_threshold = -120;
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/bet_threshold is missing/);
  });

  it('fails on a missing needs_human_review', async () => {
    const bad = fullRiskOutput();
    delete bad.finalized[0].needs_human_review;
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/needs_human_review is missing/);
  });

  it('fails on a non-boolean needs_human_review', async () => {
    const bad = fullRiskOutput();
    bad.finalized[0].needs_human_review = 'false';
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/needs_human_review is missing/);
  });

  it('fails on a missing stake_tier', async () => {
    const bad = fullRiskOutput();
    delete bad.finalized[0].stake_tier;
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/stake_tier/);
  });

  it('fails on an invalid stake_tier value', async () => {
    const bad = fullRiskOutput();
    bad.finalized[0].stake_tier = 'yolo';
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/stake_tier.*invalid|invalid.*stake_tier/);
  });

  it('fails on a missing risk_note', async () => {
    const bad = fullRiskOutput();
    delete bad.finalized[0].risk_note;
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/risk_note is missing/);
  });

  it('fails on an entry_plan missing pattern:"scale_in"', async () => {
    const bad = fullRiskOutput();
    bad.finalized[0].entry_plan = { pattern: 'wait', add_trigger: 'x', note: 'y' };
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/entry_plan\.pattern must be "scale_in"/);
  });

  it('fails on an entry_plan with a missing add_trigger', async () => {
    const bad = fullRiskOutput();
    bad.finalized[0].entry_plan = { pattern: 'scale_in', note: 'y' };
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/entry_plan\.add_trigger is missing/);
  });

  it('fails on an entry_plan with an empty-string note', async () => {
    const bad = fullRiskOutput();
    bad.finalized[0].entry_plan = { pattern: 'scale_in', add_trigger: 'x', note: '' };
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/entry_plan\.note is missing/);
  });

  it('succeeds with a valid scale_in entry_plan present', async () => {
    const ok = fullRiskOutput();
    ok.finalized[0].entry_plan = { pattern: 'scale_in', add_trigger: 'price improves to -105', note: 'Thesis intact, price is the only issue.' };
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify(ok)));
    expect(r.status).toBe('success');
  });

  it('fails on a non-object passes entry', async () => {
    const bad = fullRiskOutput();
    bad.passes = ['nope'];
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/not a plain object/);
  });

  it('fails on a missing pass reason', async () => {
    const bad = fullRiskOutput();
    delete bad.passes[0].reason;
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/reason is missing/);
  });

  it('fails on an empty-string pass reason', async () => {
    const bad = fullRiskOutput();
    bad.passes[0].reason = '';
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/reason is missing/);
  });

  it('fails on a missing portfolio_notes', async () => {
    const bad = fullRiskOutput();
    delete bad.portfolio_notes;
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/"portfolio_notes"/);
  });

  it('fails on a non-string portfolio_notes', async () => {
    const bad = fullRiskOutput();
    bad.portfolio_notes = 42;
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify(bad)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/"portfolio_notes"/);
  });

  it('succeeds WITHOUT scenario_review present (the out-of-scope structure must not be required)', async () => {
    const ok = fullRiskOutput();
    expect('scenario_review' in ok).toBe(false);
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify(ok)));
    expect(r.status).toBe('success');
  });

  it('fails on a duplicate key within the INPUT survivors array itself', async () => {
    const dupSurvivors = [survivors[0], { ...survivors[0] }];
    const single = { finalized: [fullRiskOutput().finalized[0]], passes: [], portfolio_notes: 'n/a' };
    const r = await runRiskEditorStage(dupSurvivors, {}, mockCall(JSON.stringify(single)));
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/duplicate key "k1" among its own input/);
  });

  it('succeeds on a complete, valid, non-overlapping response with the full contract on every entry', async () => {
    const r = await runRiskEditorStage(survivors, {}, mockCall(JSON.stringify(fullRiskOutput())));
    expect(r.status).toBe('success');
    expect(r.final.map((f) => f.key)).toEqual(['k1']);
    expect(r.passed.map((p) => p.key)).toEqual(['k2']);
    expect(r.portfolioNotes).toBe('One core position, one pass for correlation.');
  });
});

describe('runSkeptic/RiskEditorStage — raw preservation and scoped-prompt injection', () => {
  it('preserves raw text/usage on a skeptic parse failure', async () => {
    const r = await runSkepticStage(candidates, mockCall('not json'));
    expect(r.status).toBe('attempt_failed');
    expect(r.failure_phase).toBe('parse');
    expect(r.raw.text).toBe('not json');
  });

  it('reports phase=call with no raw text when callModel itself throws', async () => {
    const r = await runSkepticStage(candidates, { systemPrompt: 's', model: 'm', callModel: async () => { throw new Error('network down'); } });
    expect(r.status).toBe('attempt_failed');
    expect(r.failure_phase).toBe('call');
    expect(r.raw.text).toBeUndefined();
  });

  it('uses an injected scoped buildUserPrompt (no correlated_week1/SCENARIO STRUCTURES) when provided', async () => {
    let capturedPrompt = null;
    const scopedBuilder = (survivorsArg) => `SCOPED ONLY: ${JSON.stringify(survivorsArg.map((s) => s.key))}`;
    await runRiskEditorStage(candidates, {}, {
      systemPrompt: 's', model: 'm', buildUserPrompt: scopedBuilder, suppressed: true,
      callModel: async (_m, _s, userPrompt) => { capturedPrompt = userPrompt; return { text: JSON.stringify(fullRiskOutput({ finalized: [fullRiskOutput().finalized[0], { key: 'k2', bet_threshold: '-110', needs_human_review: false, stake_tier: 'standard', risk_note: 'fine' }], passes: [] })), usage: {} }; },
    });
    expect(capturedPrompt).not.toMatch(/correlated_week1/);
    expect(capturedPrompt).not.toMatch(/SCENARIO STRUCTURES/);
    expect(capturedPrompt).toMatch(/SCOPED ONLY/);
  });

  it('defaults to the full buildRiskEditorUserPrompt (contains correlated_week1/SCENARIO STRUCTURES) when no override is given', async () => {
    let capturedPrompt = null;
    await runRiskEditorStage(candidates, {}, {
      systemPrompt: 's', model: 'm', suppressed: true,
      callModel: async (_m, _s, userPrompt) => { capturedPrompt = userPrompt; return { text: JSON.stringify(fullRiskOutput({ finalized: [fullRiskOutput().finalized[0], { key: 'k2', bet_threshold: '-110', needs_human_review: false, stake_tier: 'standard', risk_note: 'fine' }], passes: [] })), usage: {} }; },
    });
    expect(capturedPrompt).toBe(buildRiskEditorUserPrompt(candidates, {}));
    expect(capturedPrompt).toMatch(/correlated_week1/);
    expect(capturedPrompt).toMatch(/SCENARIO STRUCTURES/);
  });
});

describe('runRiskEditorStage — scenario_review mode distinction (rev-23-followup4, Codex finding #6)', () => {
  const singleSurvivor = [{ key: 'k1', market: 'wins', selection: 'x', confidence: 60, needs_human_review: false }];
  const singleFinalized = { finalized: [{ key: 'k1', bet_threshold: '-120', needs_human_review: false, stake_tier: 'standard', risk_note: 'ok' }], passes: [], portfolio_notes: 'n/a' };

  it('fails in normal (non-suppressed) mode when scenario_review is missing entirely', async () => {
    const r = await runRiskEditorStage(singleSurvivor, {}, {
      systemPrompt: 's', model: 'm', callModel: async () => ({ text: JSON.stringify(singleFinalized), usage: {} }),
    });
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/missing "scenario_review"/);
  });

  it('fails in normal (non-suppressed) mode (suppressed explicitly false) when scenario_review is not a plain object', async () => {
    const bad = { ...singleFinalized, scenario_review: 'nope' };
    const r = await runRiskEditorStage(singleSurvivor, {}, {
      systemPrompt: 's', model: 'm', suppressed: false, callModel: async () => ({ text: JSON.stringify(bad), usage: {} }),
    });
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/missing "scenario_review"/);
  });

  it('fails in normal mode on a scenario_review missing one required field', async () => {
    const scenario_review = fullScenarioReview();
    delete scenario_review.concentration_note;
    const bad = { ...singleFinalized, scenario_review };
    const r = await runRiskEditorStage(singleSurvivor, {}, {
      systemPrompt: 's', model: 'm', callModel: async () => ({ text: JSON.stringify(bad), usage: {} }),
    });
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/scenario_review\.concentration_note/);
  });

  it('fails in normal mode on a scenario_review with a non-boolean needs_human_review', async () => {
    const bad = { ...singleFinalized, scenario_review: fullScenarioReview({ needs_human_review: 'false' }) };
    const r = await runRiskEditorStage(singleSurvivor, {}, {
      systemPrompt: 's', model: 'm', callModel: async () => ({ text: JSON.stringify(bad), usage: {} }),
    });
    expect(r.status).toBe('attempt_failed');
    expect(r.error).toMatch(/scenario_review\.needs_human_review/);
  });

  it('succeeds in normal (non-suppressed) mode when scenario_review is complete and valid', async () => {
    const ok = { ...singleFinalized, scenario_review: fullScenarioReview() };
    const r = await runRiskEditorStage(singleSurvivor, {}, {
      systemPrompt: 's', model: 'm', callModel: async () => ({ text: JSON.stringify(ok), usage: {} }),
    });
    expect(r.status).toBe('success');
    expect(r.scenarioReview).toEqual(fullScenarioReview());
  });

  it('succeeds in suppressed mode WITHOUT scenario_review present -- the out-of-scope structure must not be required', async () => {
    const r = await runRiskEditorStage(singleSurvivor, {}, {
      systemPrompt: 's', model: 'm', suppressed: true, callModel: async () => ({ text: JSON.stringify(singleFinalized), usage: {} }),
    });
    expect(r.status).toBe('success');
    expect(r.scenarioReview).toBeNull();
  });

  it('succeeds in suppressed mode even when scenario_review IS present (not validated, but not rejected either)', async () => {
    const ok = { ...singleFinalized, scenario_review: { garbage: true } };
    const r = await runRiskEditorStage(singleSurvivor, {}, {
      systemPrompt: 's', model: 'm', suppressed: true, callModel: async () => ({ text: JSON.stringify(ok), usage: {} }),
    });
    expect(r.status).toBe('success');
  });
});
