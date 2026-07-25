#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(import.meta.dirname, '..');
const argv = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : fallback;
};
const manifestPath = path.resolve(ROOT, getArg('--manifest', 'tests/fixtures/futures-benchmark/v0.2/manifest.json'));
const manifest = readJson(manifestPath);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function exists(rel) {
  return fs.existsSync(path.resolve(ROOT, rel));
}
function globPortfolioRaw() {
  const dir = path.join(ROOT, '.nfl', 'portfolio');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => /^portfolio-\d{4}-\d{2}-\d{2}-corpus-.+\.raw\.json$/.test(name))
    .map((name) => path.join(dir, name));
}
function pass(id, detail) {
  return { id, ok: true, detail };
}
function fail(id, detail) {
  return { id, ok: false, detail };
}
function closeTo(x, target, tol) {
  return Math.abs(Number(x) - target) <= tol;
}
function suitePath(name) {
  return path.join(path.dirname(manifestPath), `${name}.json`);
}
function readSuite(name) {
  const file = suitePath(name);
  return fs.existsSync(file) ? readJson(file) : null;
}
function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
function expandedCaseCount(suite) {
  if (!suite) return 0;
  return (suite.cases || []).length + (suite.case_groups || []).reduce((sum, g) => sum + Number(g.count || 0), 0);
}
function resolvedObservationCount(suite) {
  if (!suite) return 0;
  return (suite.observations || []).filter((o) => (
    o.counts_toward_sample_minimum !== false && o.sample_eligible !== false &&
    (o.outcome != null || o.closing_price != null || o.closing_prob != null)
  )).length;
}
function forecastObservationSuite(manifest, suite) {
  const rel = manifest.development_inputs?.forecast_observations || suite?.observation_ledger;
  if (!rel) return suite;
  const file = path.resolve(ROOT, rel);
  if (!fs.existsSync(file)) return suite;
  const ledger = readJson(file);
  return { ...(suite || {}), observations: ledger.observations || [], external_ledger: rel };
}
function scoreFrozenSuite(name, cfg) {
  let suite = readSuite(name);
  if (name === 'forecast_market') suite = forecastObservationSuite(manifest, suite);
  if (!suite) return [fail(`suite.${name}.exists`, `${name}.json missing`)];
  const file = suitePath(name);
  const count = name === 'forecast_market' ? resolvedObservationCount(suite) : expandedCaseCount(suite);
  const min = cfg.minimum_cases ?? cfg.minimum_observations ?? 0;
  const checks = [
    pass(`suite.${name}.exists`, `${path.basename(file)} sha256=${sha256(file).slice(0, 12)}`),
  ];
  checks.push(count >= min
    ? pass(`suite.${name}.sample_minimum`, `${count}/${min}`)
    : fail(`suite.${name}.sample_minimum`, `${count}/${min}`));
  if (cfg.current_cases != null && name !== 'forecast_market' && Number(cfg.current_cases) !== count) {
    checks.push(fail(`suite.${name}.manifest_count`, `manifest current_cases=${cfg.current_cases}, expanded=${count}`));
  }
  if (cfg.current_observations != null && name === 'forecast_market' && Number(cfg.current_observations) !== count) {
    checks.push(fail(`suite.${name}.manifest_count`, `manifest current_observations=${cfg.current_observations}, resolved=${count}`));
  }
  if (suite.leakage_policy !== 'held_out_from_development_fixtures') {
    checks.push(fail(`suite.${name}.leakage_policy`, 'missing held-out leakage policy'));
  }
  if (name === 'forecast_market' && suite.external_ledger) {
    checks.push(pass('suite.forecast_market.observation_ledger', suite.external_ledger));
  }
  return checks;
}

function scoreDossier(dossier) {
  const checks = [];
  const wins = dossier.synthesis_input?.wins || [];
  const playoffs = dossier.synthesis_input?.playoffs || [];
  const exactPos = dossier.synthesis_input?.division_exact_position || [];
  checks.push(wins.length === 32 ? pass('contract.wins_32', '32 canonical wins rows') : fail('contract.wins_32', `${wins.length} wins rows`));
  checks.push(playoffs.length === 32 ? pass('contract.playoffs_32', '32 canonical playoffs rows') : fail('contract.playoffs_32', `${playoffs.length} playoffs rows`));
  checks.push(exactPos.length === 128 ? pass('contract.exact_position_128', '128 exact-position rows') : fail('contract.exact_position_128', `${exactPos.length} exact-position rows`));
  checks.push(wins.every((r) => r.win_dist?.mu != null) ? pass('forecast.win_dist_all', 'win_dist on all wins rows') : fail('forecast.win_dist_all', 'missing win_dist on some wins rows'));
  checks.push(wins.every((r) => r.sim_win_total?.over_ci90?.lower != null && r.sim_win_total?.under_ci90?.lower != null)
    ? pass('forecast.win_total_uncertainty', 'simulated win-total side intervals on all wins rows')
    : fail('forecast.win_total_uncertainty', 'missing simulated win-total intervals'));
  checks.push(playoffs.every((r) => r.sim?.prob_ci90?.lower != null)
    ? pass('forecast.playoff_uncertainty', 'simulated playoff intervals on all teams')
    : fail('forecast.playoff_uncertainty', 'missing simulated playoff intervals'));
  checks.push((dossier.schedule || []).filter((g) => g.season_type == null || Number(g.season_type) === 2).length >= 272
    ? pass('forecast.schedule_embedded', 'regular-season schedule embedded')
    : fail('forecast.schedule_embedded', 'regular-season schedule missing or incomplete'));
  return checks;
}

function scoreSimulation(sim) {
  if (!sim) return [fail('simulation.exists', 'sim artifact missing')];
  const c = sim.conservation || {};
  const divOk = Object.values(c.division_sums || {}).every((x) => closeTo(x, 1, 0.01));
  return [
    closeTo(c.playoffs_sum, 14, 0.01) ? pass('sim.playoffs_conservation', 'playoff probabilities sum to 14') : fail('sim.playoffs_conservation', `sum=${c.playoffs_sum}`),
    closeTo(c.superbowl_sum, 1, 0.01) ? pass('sim.superbowl_conservation', 'Super Bowl probabilities sum to 1') : fail('sim.superbowl_conservation', `sum=${c.superbowl_sum}`),
    closeTo(c.matchup_sum, 1, 0.01) ? pass('sim.matchup_conservation', 'matchup probabilities sum to 1') : fail('sim.matchup_conservation', `sum=${c.matchup_sum}`),
    divOk ? pass('sim.division_conservation', 'each division sums to 1') : fail('sim.division_conservation', JSON.stringify(c.division_sums || {})),
    (sim.meta?.ratings_mae ?? 99) <= 0.1 ? pass('sim.ratings_mae', `ratings MAE ${sim.meta.ratings_mae}`) : fail('sim.ratings_mae', `ratings MAE ${sim.meta?.ratings_mae}`),
  ];
}

function scoreLedger(ledger) {
  const op = ledger?.open_parlays || {};
  return [
    ledger?.units?.futures_usd === 20 ? pass('personalization.futures_unit', '$20 futures unit') : fail('personalization.futures_unit', 'missing $20 futures unit'),
    ledger?.positions?.some((p) => p.id === 'bills_packers_exacta' && p.stake_usd === 100 && p.price === 6500)
      ? pass('personalization.exacta_loaded', 'Bills/Packers exacta loaded')
      : fail('personalization.exacta_loaded', 'Bills/Packers exacta missing'),
    op.eligible_as_required_hedge_resource === false
      ? pass('personalization.open_parlay_policy', 'open parlays excluded as guaranteed hedge capacity')
      : fail('personalization.open_parlay_policy', 'open parlays can be misread as guaranteed capacity'),
  ];
}

function outcomeValue(outcome) {
  if (outcome === 'won') return 1;
  if (outcome === 'lost') return 0;
  return null;
}

function clampProb(p) {
  if (p == null || Number.isNaN(Number(p))) return null;
  return Math.min(0.999999, Math.max(0.000001, Number(p)));
}

function mean(xs) {
  const clean = xs.filter((x) => x != null && Number.isFinite(Number(x))).map(Number);
  return clean.length ? clean.reduce((s, x) => s + x, 0) / clean.length : null;
}
function round(x, n = 4) {
  return x == null ? null : Math.round(Number(x) * 10 ** n) / 10 ** n;
}

function scoreForecastLedger(ledger) {
  if (!ledger) return [fail('forecast_observations.exists', 'forecast observation ledger missing')];
  const rows = ledger.observations || [];
  const eligible = rows.filter((o) => o.sample_eligible !== false);
  const resolved = eligible.filter((o) => o.counts_toward_sample_minimum !== false && (o.closing_price != null || o.closing_implied_prob != null || o.outcome != null));
  const clvRows = resolved.filter((o) => o.clv_pct != null);
  const settled = resolved.map((o) => ({ p: clampProb(o.forecast_prob), y: outcomeValue(o.outcome) })).filter((o) => o.p != null && o.y != null);
  const brier = mean(settled.map((o) => (o.p - o.y) ** 2));
  const logLoss = mean(settled.map((o) => -(o.y * Math.log(o.p) + (1 - o.y) * Math.log(1 - o.p))));
  const medianClv = clvRows.length ? clvRows.map((o) => Number(o.clv_pct)).sort((a, b) => a - b)[Math.floor((clvRows.length - 1) / 2)] : null;
  return [
    pass('forecast_observations.total', `${rows.length} row(s), ${eligible.length} sample-eligible`),
    pass('forecast_observations.resolved', `${resolved.length} resolved row(s)`),
    pass('forecast_observations.clv_rows', `${clvRows.length} CLV row(s)${medianClv == null ? '' : `, median ${round(medianClv, 4)}%`}`),
    pass('forecast_observations.settled_rows', `${settled.length} settled calibration row(s)${brier == null ? '' : `, brier ${round(brier, 6)}, log_loss ${round(logLoss, 6)}`}`),
  ];
}

function scoreCorpus(rawFiles) {
  const checks = [];
  checks.push(rawFiles.length >= 5 ? pass('portfolio.corpus_outputs', `${rawFiles.length} corpus raw outputs`) : fail('portfolio.corpus_outputs', `${rawFiles.length} corpus raw outputs`));
  let finalCount = 0, invalidatedCount = 0, staleOrNegativeCount = 0, strategyCount = 0, payoffTables = 0, exactaRoles = 0;
  for (const file of rawFiles) {
    const raw = readJson(file);
    finalCount += raw.final?.length || 0;
    invalidatedCount += (raw.passed || []).filter((p) => p.stage === 'validator').length;
    staleOrNegativeCount += (raw.passed || []).filter((p) => /stale|non-positive EV|line .*does not match/i.test(p.reason || '')).length;
    const strategy = raw.portfolio_strategy?.final;
    if (strategy?.status === 'active') {
      strategyCount++;
      for (const basket of strategy.coverage_baskets || []) {
        if (basket.terminal_payoff_table?.scenarios?.length) payoffTables++;
        for (const leg of basket.legs || []) if (leg.exacta_role) exactaRoles++;
      }
    }
    for (const rec of raw.final || []) {
      if ((rec.code_edge_pct ?? rec.edge_pct ?? 0) <= 0 && !/hedge/i.test(`${rec.type || ''} ${rec.edge_type || ''}`)) {
        checks.push(fail('portfolio.negative_ev_final', `${path.basename(file)} kept ${rec.key}`));
      }
    }
  }
  checks.push(pass('portfolio.final_count_shadow', `${finalCount} final corpus recommendations after hard gates`));
  checks.push(pass('portfolio.validator_invalidations', `${invalidatedCount} validator invalidations retained`));
  checks.push(staleOrNegativeCount >= 1 ? pass('portfolio.hard_gate_coverage', `${staleOrNegativeCount} stale/negative/line violations caught`) : fail('portfolio.hard_gate_coverage', 'no hard-gate violations exercised'));
  checks.push(strategyCount >= 2 ? pass('portfolio.scenario_books', `${strategyCount} active scenario books`) : fail('portfolio.scenario_books', `${strategyCount} active scenario books`));
  checks.push(payoffTables >= 1 ? pass('portfolio.terminal_payoff_tables', `${payoffTables} terminal payoff table(s)`) : fail('portfolio.terminal_payoff_tables', 'no terminal payoff tables found'));
  checks.push(exactaRoles >= 1 ? pass('portfolio.exacta_role_taxonomy', `${exactaRoles} exacta leg role labels`) : fail('portfolio.exacta_role_taxonomy', 'no exacta role labels found'));
  return checks;
}

function evidenceGaps(manifest) {
  const gaps = [];
  for (const [suite, cfg] of Object.entries(manifest.suites || {})) {
    const min = cfg.minimum_cases ?? cfg.minimum_observations ?? 0;
    let fileSuite = readSuite(suite);
    if (suite === 'forecast_market') fileSuite = forecastObservationSuite(manifest, fileSuite);
    const cur = suite === 'forecast_market' ? resolvedObservationCount(fileSuite) : expandedCaseCount(fileSuite);
    if (cur < min) gaps.push({ suite, cur, min });
  }
  return gaps;
}

function evidenceGapReport(manifest) {
  return evidenceGaps(manifest).map((g) => {
    const cfg = manifest.suites?.[g.suite] || {};
    return {
      ...g,
      missing: g.min - g.cur,
      gate: cfg.evidence_gate || (g.suite === 'forecast_market' ? 'real_outcome_or_closing_price_required' : 'fixture_count_required'),
    };
  });
}

const input = manifest.development_inputs || {};
const dossierPath = path.resolve(ROOT, input.dossier || '.nfl/portfolio/dossier-2026-07-22.json');
const simPath = path.resolve(ROOT, input.simulation || '.nfl/portfolio/sim-2026-07-22.json');
const ledgerPath = path.resolve(ROOT, input.personalization_ledger || 'data/futures-imports/andy-portfolio-ledger-2026.json');
const forecastLedgerPath = path.resolve(ROOT, input.forecast_observations || 'data/futures-benchmark/forecast-observations.json');

const mechanical = [];
mechanical.push(exists(path.relative(ROOT, dossierPath)) ? pass('artifact.dossier', path.relative(ROOT, dossierPath)) : fail('artifact.dossier', 'missing'));
mechanical.push(exists(path.relative(ROOT, simPath)) ? pass('artifact.sim', path.relative(ROOT, simPath)) : fail('artifact.sim', 'missing'));
mechanical.push(exists(path.relative(ROOT, ledgerPath)) ? pass('artifact.ledger', path.relative(ROOT, ledgerPath)) : fail('artifact.ledger', 'missing'));

const dossier = fs.existsSync(dossierPath) ? readJson(dossierPath) : null;
const sim = fs.existsSync(simPath) ? readJson(simPath) : null;
const ledger = fs.existsSync(ledgerPath) ? readJson(ledgerPath) : null;
const forecastLedger = fs.existsSync(forecastLedgerPath) ? readJson(forecastLedgerPath) : null;
if (dossier) mechanical.push(...scoreDossier(dossier));
mechanical.push(...scoreSimulation(sim));
if (ledger) mechanical.push(...scoreLedger(ledger));
mechanical.push(...scoreForecastLedger(forecastLedger));
mechanical.push(...scoreCorpus(globPortfolioRaw()));
for (const [name, cfg] of Object.entries(manifest.suites || {})) mechanical.push(...scoreFrozenSuite(name, cfg));

const gaps = evidenceGapReport(manifest);
const failedMechanical = mechanical.filter((c) => !c.ok && !/\.sample_minimum$/.test(c.id));

console.log('# Futures Benchmark Scorer');
console.log(`suite=${manifest.suite_version} status=${manifest.status}`);
console.log(`manifest=${path.relative(ROOT, manifestPath)}`);
console.log('## Mechanical gates');
for (const c of mechanical) console.log(`${c.ok ? 'PASS' : 'FAIL'} ${c.id}: ${c.detail}`);
console.log('## Evidence minimums');
for (const g of gaps) console.log(`FAIL ${g.suite}: ${g.cur}/${g.min} (${g.missing} missing; gate=${g.gate})`);
if (!gaps.length) console.log('PASS sample_minimums: satisfied');
console.log('## Shadow policy');
console.log(`live_api_calls_allowed=${manifest.promotion_policy?.live_api_calls_allowed === true}`);
console.log(`production_report_persistence_allowed=${manifest.promotion_policy?.production_report_persistence_allowed === true}`);
console.log(`open_parlay_modification_allowed=${manifest.promotion_policy?.open_parlay_modification_allowed === true}`);

if (failedMechanical.length) {
  console.log('VERDICT: SHADOW ONLY - QUALITY GAP');
  process.exitCode = 1;
} else if (gaps.length) {
  console.log('VERDICT: SHADOW ONLY - INSUFFICIENT EVIDENCE');
  process.exitCode = 1;
} else {
  console.log('VERDICT: MECHANICAL SAMPLE MINIMUMS SATISFIED');
}
