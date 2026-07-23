#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const noPersist = args.includes('--no-persist');
const suite = args.includes('--suite') ? args[args.indexOf('--suite') + 1] : 'preconditions';
const repeats = args.includes('--repeats') ? Number(args[args.indexOf('--repeats') + 1]) : 1;
const dossier = path.join(ROOT, '.nfl', 'portfolio', 'dossier-2026-07-22.json');
const ledger = path.join(ROOT, 'data', 'futures-imports', 'andy-portfolio-ledger-2026.json');

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}
function run(name, command, commandArgs) {
  const r = spawnSync(command, commandArgs, { cwd: ROOT, encoding: 'utf8', shell: false });
  return { name, status: r.status, stdout: r.stdout.trim(), stderr: r.stderr.trim() };
}

const checks = [];
checks.push({ id: 'mode.no_persist', ok: noPersist, detail: '--no-persist is required for benchmark mode.' });
checks.push({ id: 'suite.full', ok: suite === 'full', detail: `Requested suite=${suite}; promotion protocol expects suite=full.` });
checks.push({ id: 'repeats.5', ok: repeats === 5, detail: `Requested repeats=${repeats}; promotion protocol expects repeats=5.` });
checks.push({ id: 'dossier.exists', ok: fs.existsSync(dossier), detail: dossier });
checks.push({ id: 'ledger.exists', ok: fs.existsSync(ledger), detail: ledger });
checks.push({ id: 'forecast.win_dist', ok: exists('agents/lib/win-dist.js'), detail: 'Matched-line win distribution module must exist.' });
checks.push({ id: 'forecast.schedule_sim', ok: exists('agents/portfolio-simulate.js'), detail: 'Schedule simulation module must exist.' });
checks.push({ id: 'benchmark.fixture_package', ok: exists('tests/fixtures/futures-benchmark'), detail: 'Held-out benchmark package must be frozen.' });
checks.push({ id: 'benchmark.scorer', ok: exists('scripts/score-futures-benchmark.js'), detail: 'Automated scorer must exist.' });

const conformance = run('dossier_conformance', process.execPath, ['scripts/futures-dossier-conformance.js', '--dossier', dossier]);
checks.push({ id: 'dossier.conformance', ok: conformance.status === 0, detail: conformance.status === 0 ? conformance.stdout : conformance.stderr.split('\n').slice(0, 8).join(' | ') });

const scorer = run('benchmark_scorer', process.execPath, ['scripts/score-futures-benchmark.js']);
const scorerVerdict = (scorer.stdout.match(/VERDICT:\s*(.+)/) || [])[1] || null;
const scorerRan = !!scorerVerdict;
const scorerEvidenceGap = scorerVerdict === 'SHADOW ONLY - INSUFFICIENT EVIDENCE';
checks.push({
  id: 'benchmark.scorer_result',
  ok: scorer.status === 0 || scorerEvidenceGap,
  detail: scorerRan ? `VERDICT: ${scorerVerdict}` : scorer.stderr.split('\n').slice(0, 8).join(' | '),
});

const failed = checks.filter(c => !c.ok);
console.log('# Futures Analyst Benchmark Preconditions');
console.log(`suite=${suite} repeats=${repeats} no_persist=${noPersist}`);
for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'} ${c.id}: ${c.detail}`);

if (failed.length || scorerEvidenceGap) {
  console.log(`\nVERDICT: ${failed.length ? 'NOT READY TO BENCHMARK' : 'SHADOW ONLY - INSUFFICIENT EVIDENCE'}`);
  console.log('No live model/API calls were made. No benchmark report was persisted.');
  process.exitCode = 1;
} else {
  console.log('\nVERDICT: READY FOR FULL BENCHMARK HARNESS');
  console.log('This precondition runner is read-only; implement comparison arms/scoring before promotion.');
}
