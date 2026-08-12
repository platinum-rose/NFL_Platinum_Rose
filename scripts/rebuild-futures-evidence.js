#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateArticleEvidence, validateFuturesEvidenceBundle } from './lib/futures-evidence-gates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const ARTIFACTS = Object.freeze({
  article: 'data/research-intel/review/article-intel-review-latest.json',
  camp: 'data/training-camp/2026/latest.json',
  availability: 'data/player-availability/latest.json',
  starters: 'data/projected-starters/2026/latest.json',
  impact: 'data/player-availability/impact-digest-latest.json',
  predictionMap: 'data/prediction-markets/team-market-map-latest.json',
  coherence: 'data/prediction-markets/cross-market-coherence-latest.json',
  youtubeReview: 'data/shadow-harness/reports/youtube-futures-intel-review-latest.json',
  youtubeStatus: 'data/shadow-harness/review/youtube-futures-intel-review-status.json',
  youtubeQueue: 'data/shadow-harness/review/youtube-futures-local-intel-queue.json',
  youtubeSummary: 'data/shadow-harness/review/youtube-futures-agent-intel-summary.json',
  freshness: 'data/shadow-harness/review/podcast-youtube-freshness-latest.json',
  oddsExecution: 'data/futures-imports/odds-execution-validation-latest.json',
});

function argValue(argv, name, fallback = null) {
  const index = argv.indexOf(name);
  return index >= 0 && index + 1 < argv.length ? argv[index + 1] : fallback;
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.resolve(ROOT, relativePath), 'utf8'));
}

function schemaOf(payload) {
  return payload?.schema || payload?.meta?.schema || (payload?.schema_version ? `schema_version_${payload.schema_version}` : null);
}

function generatedAtOf(payload) {
  return payload?.generated_at || payload?.meta?.generated_at || null;
}

function inputsOf(payload) {
  return payload?.inputs || payload?.meta?.inputs || payload?.collection || null;
}

function validationsOf(payload) {
  const explicit = payload?.validation_results || payload?.meta?.validation_results;
  if (explicit) return explicit;
  const meta = payload?.meta || {};
  return Object.fromEntries(Object.entries(meta).filter(([key]) => key.endsWith('_validation')));
}

async function fileRecord(relativePath) {
  const absolutePath = path.resolve(ROOT, relativePath);
  const raw = await readFile(absolutePath);
  const payload = JSON.parse(raw.toString('utf8'));
  return {
    path: relativePath.replace(/\\/g, '/'),
    sha256: createHash('sha256').update(raw).digest('hex'),
    bytes: raw.length,
    schema: schemaOf(payload),
    generated_at: generatedAtOf(payload),
    inputs: inputsOf(payload),
    validation_results: validationsOf(payload),
  };
}

async function loadBundle(sourceAudit = null) {
  const entries = await Promise.all(Object.entries(ARTIFACTS).map(async ([name, relativePath]) => [name, await readJson(relativePath)]));
  const bundle = Object.fromEntries(entries);
  if (sourceAudit) bundle.sourceAudit = await readJson(sourceAudit);
  return bundle;
}

function command(step, args) {
  return { step, args };
}

export function buildRebuildPlan({ generatedAt, date, sourceAudit, contextOut }) {
  const shared = ['--generated-at', generatedAt];
  return [
    command('normalize team evidence', ['scripts/normalize-team-evidence-artifacts.js', '--write', '--date', date, ...shared]),
    command('reconcile availability evidence', ['scripts/reconcile-availability-evidence.js', '--write', '--date', date, ...shared]),
    command('rebuild projected starters', ['scripts/build-projected-starters.js', '--date', date, ...shared]),
    command('rebuild availability impact digest', ['scripts/build-availability-impact-digest.js', '--date', date, ...shared]),
    command('rebuild prediction-market map', ['scripts/build-prediction-market-map.js', '--date', date, ...shared]),
    command('rebuild prediction-market coherence', ['scripts/build-cross-market-coherence.js', '--date', date, ...shared]),
    command('rebuild YouTube review/status', ['scripts/build-youtube-futures-intel-review.js', ...shared]),
    command('rebuild YouTube local queue', ['scripts/export-youtube-futures-local-intel.js', ...shared]),
    command('rebuild YouTube agent summary', ['scripts/build-youtube-futures-agent-intel-summary.js', ...shared]),
    command('rebuild podcast/YouTube freshness', ['scripts/build-podcast-youtube-freshness-reconciliation.js', ...shared]),
    command('rebuild local odds execution validation', ['scripts/build-futures-odds-execution-validation.js', ...shared]),
    command('rebuild strict source audit', ['scripts/build-intel-source-audit-report.js', '--strict', ...shared]),
    command('validate and rebuild synthesis context', [
      'scripts/build-futures-synthesis-context.js',
      '--date', date,
      '--out', contextOut,
      '--source-audit', sourceAudit,
      ...shared,
    ]),
  ];
}

function runStep(step) {
  const result = spawnSync(process.execPath, step.args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) throw new Error(`${step.step} failed with exit ${result.status}`);
}

async function main() {
  const argv = process.argv.slice(2);
  const generatedAt = argValue(argv, '--generated-at', new Date().toISOString());
  if (!Number.isFinite(new Date(generatedAt).getTime())) throw new Error(`Invalid --generated-at: ${generatedAt}`);
  const date = argValue(argv, '--date', generatedAt.slice(0, 10));
  const write = argv.includes('--write');
  const planOnly = argv.includes('--plan');
  const stamp = generatedAt.replace(/[:.]/g, '-');
  const sourceAudit = `.nfl/source-audit/nfl-intel-source-audit-${stamp}.json`;
  const contextOut = argValue(argv, '--context-out', `.nfl/portfolio/frontier-synthesis-context-${date}.json`);
  const manifestOut = argValue(argv, '--manifest-out', `.nfl/rebuild/futures-evidence-rebuild-${stamp}.json`);
  const plan = buildRebuildPlan({ generatedAt, date, sourceAudit, contextOut });

  if (planOnly) {
    console.log(JSON.stringify({ generated_at: generatedAt, date, write, plan }, null, 2));
    return;
  }

  const currentBundle = await loadBundle();
  const articleValidation = validateArticleEvidence(currentBundle.article);
  if (articleValidation.status !== 'pass') {
    console.error('Futures evidence rebuild BLOCKED before downstream writes.');
    for (const blocker of articleValidation.blockers) console.error(`- ${blocker}`);
    console.error('Rebuild the complete read-only article corpus and finish human review before rerunning with --write.');
    process.exitCode = 2;
    return;
  }

  if (!write) {
    const validation = validateFuturesEvidenceBundle(currentBundle);
    console.log(`Futures evidence preflight: ${validation.status.toUpperCase()}`);
    for (const blocker of validation.blockers) console.log(`- ${blocker}`);
    console.log('No artifacts were rewritten. Pass --write only after every upstream hard gate is ready.');
    if (validation.status !== 'pass') process.exitCode = 2;
    return;
  }

  for (const step of plan) {
    console.log(`\n[${step.step}]`);
    runStep(step);
  }

  const rebuiltBundle = await loadBundle(sourceAudit);
  const validation = validateFuturesEvidenceBundle(rebuiltBundle);
  if (validation.status !== 'pass') {
    throw new Error(`Rebuilt evidence bundle is blocked: ${validation.blockers.join('; ')}`);
  }
  const artifactRecords = await Promise.all(Object.values(ARTIFACTS).map(fileRecord));
  artifactRecords.push(await fileRecord(sourceAudit), await fileRecord(contextOut));
  const manifest = {
    schema: 'futures_evidence_rebuild_manifest_v1',
    generated_at: generatedAt,
    artifact_date: date,
    status: 'pass',
    guardrails: {
      network_fetches: false,
      model_calls: false,
      supabase_writes: false,
      official_pick_actions: false,
      recommendation_persistence: false,
      portfolio_mutations: false,
    },
    dependency_order: plan.map((step) => step.step),
    validation_results: validation,
    artifacts: artifactRecords,
  };
  await mkdir(path.dirname(path.resolve(ROOT, manifestOut)), { recursive: true });
  await writeFile(path.resolve(ROOT, manifestOut), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`Rebuild manifest: ${manifestOut}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
