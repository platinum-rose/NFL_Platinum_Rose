import assert from 'node:assert/strict';
import { runSkepticStage, runRiskEditorStage, buildRiskEditorUserPrompt } from './agents/lib/committee.js';
import { buildScopedRiskEditorUserPrompt } from './agents/lib/scoped-prompts.js';

let failures = 0;
function check(name, fn) { try { fn(); console.log(`  ok  - ${name}`); } catch (e) { failures++; console.log(`  FAIL - ${name}: ${e.message}`); } }

await (async () => {
  console.log('=== runSkepticStage / runRiskEditorStage raw-preservation-on-failure (no network, mocked callModel) ===');

  await (async () => {
    const candidates = [{ key: 'k1', market: 'wins', selection: 'x', confidence: 50 }];
    // Simulate: model call succeeds, but returns unparseable JSON -> parse-phase failure.
    const callModel = async () => ({ text: 'not json at all {{{', usage: { in: 10, out: 5 } });
    const result = await runSkepticStage(candidates, { systemPrompt: 'sys', model: 'm', callModel });
    check('skeptic parse-failure preserves raw text/usage', () => {
      assert.equal(result.status, 'attempt_failed');
      assert.equal(result.failure_phase, 'parse');
      assert.equal(result.raw.text, 'not json at all {{{');
      assert.deepEqual(result.raw.usage, { in: 10, out: 5 });
    });
  })();

  await (async () => {
    // call-phase failure: raw stays undefined (nothing was ever received) -- a legitimate "did not run" shape.
    const callModel = async () => { throw new Error('network down'); };
    const result = await runSkepticStage([{ key: 'k1', market: 'wins' }], { systemPrompt: 'sys', model: 'm', callModel });
    check('skeptic call-failure reports phase=call with undefined raw text', () => {
      assert.equal(result.status, 'attempt_failed');
      assert.equal(result.failure_phase, 'call');
      assert.equal(result.raw.text, undefined);
    });
  })();

  await (async () => {
    const survivors = [{ key: 'k1', market: 'wins', selection: 'x' }];
    const callModel = async () => ({ text: '{"finalized": [', usage: { in: 1, out: 1 } }); // malformed JSON -> parse failure
    const result = await runRiskEditorStage(survivors, {}, { systemPrompt: 'sys', model: 'm', callModel });
    check('risk/editor parse-failure preserves raw text/usage', () => {
      assert.equal(result.status, 'attempt_failed');
      assert.equal(result.failure_phase, 'parse');
      assert.equal(result.raw.text, '{"finalized": [');
    });
  })();

  await (async () => {
    // Verify buildUserPrompt injection: scoped builder must be used when passed,
    // and must NOT include correlated_week1 or a "SCENARIO STRUCTURES" block,
    // unlike the default (full/unscoped) builder.
    const survivors = [{ key: 'k1', market: 'wins', selection: 'x', correlated_week1: ['a'] }];
    let capturedUserPrompt = null;
    const callModel = async (model, systemPrompt, userPrompt) => { capturedUserPrompt = userPrompt; return { text: '{"finalized":[],"passes":[]}', usage: {} }; };
    await runRiskEditorStage(survivors, { hedge_baskets: [{ x: 1 }] }, { systemPrompt: 'sys', model: 'm', callModel, buildUserPrompt: buildScopedRiskEditorUserPrompt });
    check('injected scoped buildUserPrompt is actually used (no correlated_week1, no SCENARIO STRUCTURES)', () => {
      assert.ok(capturedUserPrompt, 'prompt was captured');
      assert.ok(!capturedUserPrompt.includes('correlated_week1'));
      assert.ok(!capturedUserPrompt.includes('SCENARIO STRUCTURES'));
      assert.ok(!capturedUserPrompt.includes('scenario_review'));
    });

    let capturedDefault = null;
    const callModel2 = async (model, systemPrompt, userPrompt) => { capturedDefault = userPrompt; return { text: '{"finalized":[],"passes":[]}', usage: {} }; };
    await runRiskEditorStage(survivors, { hedge_baskets: [{ x: 1 }] }, { systemPrompt: 'sys', model: 'm', callModel: callModel2 }); // no buildUserPrompt -> default
    check('default (non-suppressed) path still uses full buildRiskEditorUserPrompt (contains correlated_week1/SCENARIO STRUCTURES)', () => {
      assert.ok(capturedDefault.includes('correlated_week1'));
      assert.ok(capturedDefault.includes('SCENARIO STRUCTURES'));
    });
  })();

  console.log(`\n${failures === 0 ? 'ALL PROBES PASSED' : failures + ' PROBE(S) FAILED'}`);
  process.exit(failures === 0 ? 0 : 1);
})();
