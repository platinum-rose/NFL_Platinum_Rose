import assert from 'node:assert/strict';
import { quarantineStage1, assertScopeClean, checkStartupInvariant, ALLOWED_MARKETS, STRUCTURAL_FORBIDDEN_KEYS } from './agents/lib/scope-enforcement.js';

let failures = 0;
function check(name, fn) {
  try { fn(); console.log(`  ok  - ${name}`); }
  catch (e) { failures++; console.log(`  FAIL - ${name}: ${e.message}`); }
}

// rev-22-review fix: assertRowSchema() now requires the FULL Stage-1
// recommendation contract (not just market/selection/type/edge_type), so
// every fixture below that needs a row to survive schema validation uses
// this full-contract builder; fixtures that deliberately test an
// out-of-scope/forbidden VALUE still only override what they're testing.
function fullRow(overrides = {}) {
  return {
    market: 'wins', selection: 'x', type: 'value', edge_type: 'thesis', book: 'draftkings',
    price: -110, model_fair_prob: 0.55, edge_pct: 5, confidence: 60, stake_tier: 'standard',
    knowledge_based: false, market_view: 'mv', football_view: 'fv', thesis: 't',
    disconfirming_factor: 'd', bet_threshold: '-120', needs_human_review: false,
    evidence_ids: ['a'], sources: ['s'],
    timing: { action: 'bet_now', trigger: 'tr', expected_move: 'em', rationale: 'r' },
    ...overrides,
  };
}
function fullWatchRow(overrides = {}) {
  return { market: 'wins', selection: 'x', why: 'y', ...overrides };
}

console.log('=== quarantineStage1 adversarial probes (Codex rev-20-review) ===');

check('null recommendation row REJECTS the whole response (throws), not silently dropped', () => {
  assert.throws(() => quarantineStage1({ recommendations: [null], watch: [] }), /is not a plain object/);
});

check('object-valued type is rejected by schema (throws)', () => {
  assert.throws(() => quarantineStage1({ recommendations: [fullRow({ type: { weird: true } })], watch: [] }), /\.type is missing or not a non-empty string/);
});

check('market-only row (missing the rest of the contract) is rejected by schema (throws)', () => {
  assert.throws(() => quarantineStage1({ recommendations: [{ market: 'wins' }], watch: [] }), /\.selection is missing or not a non-empty string/);
});

check('edge_type: "hedge" is stripped even though type is fine', () => {
  const out = quarantineStage1({ recommendations: [fullRow({ edge_type: 'hedge' })], watch: [] });
  assert.equal(out.recommendations.length, 0);
});

check('watch row with timing.action "pair" and correlated_week1 is removed', () => {
  const out = quarantineStage1({ recommendations: [], watch: [{ ...fullWatchRow(), timing: { action: 'pair' }, correlated_week1: ['z'] }] });
  assert.equal(out.watch.length, 0);
});

check('watch row with in-scope market and no forbidden fields survives, stripped of prohibited keys', () => {
  const out = quarantineStage1({ recommendations: [], watch: [{ ...fullWatchRow({ market: 'playoffs' }), correlated_week1: ['z'] }] });
  assert.equal(out.watch.length, 1);
  assert.equal('correlated_week1' in out.watch[0], false);
});

check('top-level scenario_review and correlated_week1 are stripped', () => {
  const out = quarantineStage1({ recommendations: [], watch: [], scenario_review: { note: 'x' }, correlated_week1: ['a'] });
  assert.equal('scenario_review' in out, false);
  assert.equal('correlated_week1' in out, false);
});

check('out-of-scope market row is dropped, in-scope survives', () => {
  const out = quarantineStage1({ recommendations: [
    fullRow({ market: 'superbowl', selection: 'a' }),
    fullRow({ market: 'wins', selection: 'b' }),
  ], watch: [] });
  assert.equal(out.recommendations.length, 1);
  assert.equal(out.recommendations[0].selection, 'b');
});

check('__quarantine counts are accurate', () => {
  const out = quarantineStage1({ recommendations: [
    fullRow({ market: 'superbowl', selection: 'a' }),
    fullRow({ market: 'wins', selection: 'b' }),
  ], watch: [], hedge_baskets: [{}], parlay_ladders: [], portfolio_strategy: null });
  assert.equal(out.__quarantine.recommendations_seen, 2);
  assert.equal(out.__quarantine.recommendations_removed, 1);
  assert.deepEqual(out.__quarantine.removed_top_level_keys.sort(), ['hedge_baskets', 'parlay_ladders', 'portfolio_strategy'].sort());
});

console.log('=== assertScopeClean adversarial probes ===');

check('present correlated_week1: null still throws (key presence is the violation)', () => {
  assert.throws(() => assertScopeClean({ final: [{ key: 'k1', market: 'wins', correlated_week1: null }] }), /forbidden key "correlated_week1"/);
});

check('edge_type: "hedge" is caught even when type is clean', () => {
  assert.throws(() => assertScopeClean({ final: [{ key: 'k1', market: 'wins', type: 'value', edge_type: 'hedge' }] }), /forbidden edge_type/);
});

check('timing.action "pair" is caught', () => {
  assert.throws(() => assertScopeClean({ final: [{ key: 'k1', market: 'playoffs', timing: { action: 'pair' } }] }), /forbidden timing\.action/);
});

check('nested stage1_versions market row is caught (not just top-level final)', () => {
  assert.throws(() => assertScopeClean({
    candidates: [{ key: 'k1', market: 'wins', stage1_versions: { modelA: { market: 'superbowl', selection: 'x' } } }],
  }), /out-of-scope market "superbowl"/);
});

check('clean tree passes with no throw', () => {
  assertScopeClean({
    byModel: { modelA: { recommendations: [{ market: 'wins', type: 'value', edge_type: 'thesis', timing: { action: 'bet_now' } }], watch: [] } },
    final: [{ key: 'k1', market: 'playoffs', type: 'favorite' }],
    passed: [], killed: [], watchlistReview: [], portfolioStrategy: null, scenarioReview: null,
  });
});

console.log('=== checkStartupInvariant ===');

check('suppression without --disable-live-context-bridges fails closed', () => {
  const r = checkStartupInvariant({ suppressed: true, noPersist: true, proposalOutDir: null, watchlist: { items: [] }, disableLiveContextBridges: false });
  assert.equal(r.ok, false);
  assert.ok(r.problems.some((p) => p.includes('--disable-live-context-bridges')));
});

check('suppression with all four requirements met passes', () => {
  const r = checkStartupInvariant({ suppressed: true, noPersist: true, proposalOutDir: null, watchlist: { items: [] }, disableLiveContextBridges: true });
  assert.equal(r.ok, true);
});

console.log(`\n${failures === 0 ? 'ALL PROBES PASSED' : failures + ' PROBE(S) FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
