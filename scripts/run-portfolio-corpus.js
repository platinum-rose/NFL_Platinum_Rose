#!/usr/bin/env node
/*
 * scripts/run-portfolio-corpus.js
 *
 * Offline corpus runner for agents/portfolio-synthesize.js.
 * It feeds curated analyst JSON into a mocked fetch(), runs the real CLI flow,
 * and checks the generated raw/report artifacts. No API or Supabase calls.
 *
 * Usage:
 *   node scripts/run-portfolio-corpus.js
 *   node scripts/run-portfolio-corpus.js --scenario scenario-book-bills-packers
 *   node scripts/run-portfolio-corpus.js --list
 */

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CORPUS_DIR = path.join(ROOT, 'tests', 'fixtures', 'portfolio-corpus');
const OUT_DIR = path.join(ROOT, '.nfl', 'portfolio');

const argv = process.argv.slice(2);
const getArg = (flag, fallback = null) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : fallback;
};
const LIST_ONLY = argv.includes('--list');
const KEEP_GOING = argv.includes('--keep-going');
const ONLY_SCENARIO = getArg('--scenario');

function safeSuffix(s) {
  return String(s || '').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '');
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function corpusFiles() {
  const files = (await readdir(CORPUS_DIR))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => path.join(CORPUS_DIR, f));
  if (!ONLY_SCENARIO) return files;
  const wanted = ONLY_SCENARIO.endsWith('.json') ? ONLY_SCENARIO.slice(0, -5) : ONLY_SCENARIO;
  return files.filter((f) => path.basename(f, '.json') === wanted || path.basename(f, '.json').includes(wanted));
}

function childScript() {
  return `
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const scenario = JSON.parse(await readFile(process.env.PORTFOLIO_CORPUS_SCENARIO, 'utf8'));
const models = scenario.models || ['gpt-4o'];
const responses = scenario.responses || {};
const queue = [];

if (responses.stage1_by_model) {
  for (const model of models) queue.push(responses.stage1_by_model[model] || responses.stage1 || {});
} else {
  for (let i = 0; i < models.length; i += 1) queue.push(responses.stage1 || {});
}
if (!scenario.skip_committee) {
  queue.push(responses.skeptic || { verdicts: [] });
  queue.push(responses.risk_editor || { finalized: [], passes: [], portfolio_notes: '', scenario_review: null });
}

let call = 0;
global.fetch = async (url) => {
  const payload = queue[call];
  call += 1;
  if (!payload) {
    return {
      ok: false,
      status: 500,
      json: async () => ({ error: 'portfolio corpus mock queue exhausted' }),
      text: async () => 'portfolio corpus mock queue exhausted'
    };
  }
  const text = JSON.stringify(payload);
  const usage = { prompt_tokens: 10 * call, completion_tokens: 100 * call, total_tokens: 110 * call };
  if (String(url).includes('anthropic.com')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ content: [{ type: 'text', text }], usage: { input_tokens: usage.prompt_tokens, output_tokens: usage.completion_tokens } }),
      text: async () => ''
    };
  }
  return {
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content: text } }], usage }),
    text: async () => ''
  };
};

process.env.OPENAI_API_KEY ||= 'offline-local-test';
process.env.ANTHROPIC_API_KEY ||= 'offline-local-test';
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
delete process.env.SUPABASE_URL;

const args = [
  '--dossier', scenario.dossier || '.nfl/portfolio/dossier-2026-07-22.json',
  '--models', models.join(','),
  '--primary', (scenario.primary || []).join(','),
  '--no-persist',
  '--out-suffix', process.env.PORTFOLIO_CORPUS_SUFFIX
];
if (scenario.skip_committee) args.push('--skip-committee');
if (scenario.max_plays) args.push('--max-plays', String(scenario.max_plays));

process.argv = [process.argv[0], 'agents/portfolio-synthesize.js', ...args];
const scriptUrl = pathToFileURL(path.join(process.cwd(), 'agents', 'portfolio-synthesize.js')).href;
await import(scriptUrl + '?corpus=' + encodeURIComponent(scenario.id || 'unknown') + '&t=' + Date.now());
`;
}

function pathFromOutput(stdout, suffix) {
  const re = new RegExp(`([A-Z]:\\\\[^\\r\\n]*portfolio-\\d{4}-\\d{2}-\\d{2}-${escapeRegExp(suffix)}\\.html)`, 'i');
  const match = stdout.match(re);
  if (match) return match[1];
  const today = new Date().toISOString().slice(0, 10);
  return path.join(OUT_DIR, `portfolio-${today}-${suffix}.html`);
}

function eq(failures, label, actual, expected) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function hasAll(failures, label, actualList, expectedList) {
  const actual = new Set(actualList);
  for (const expected of expectedList || []) {
    if (!actual.has(expected)) failures.push(`${label}: missing ${JSON.stringify(expected)} in ${JSON.stringify(actualList)}`);
  }
}

function includesText(failures, label, haystack, needles) {
  for (const needle of needles || []) {
    if (!String(haystack).includes(needle)) failures.push(`${label}: missing text ${JSON.stringify(needle)}`);
  }
}

function collectLegs(raw) {
  return [
    ...((raw.hedge_baskets?.valid || []).flatMap((b) => b.legs || [])),
    ...((raw.parlay_ladders?.valid || []).flatMap((l) => l.legs || [])),
  ];
}

function legMatches(leg, expected) {
  return Object.entries(expected).every(([key, val]) => leg?.[key] === val);
}

function runAssertions({ scenario, raw, md }) {
  const failures = [];
  const expect = scenario.expect || {};
  const strategy = raw.portfolio_strategy?.final || {};
  const exposure = strategy.exposure_summary || {};

  if (expect.final_count != null) eq(failures, 'final_count', raw.final?.length || 0, expect.final_count);
  if (expect.passed_count != null) eq(failures, 'passed_count', raw.passed?.length || 0, expect.passed_count);
  if (expect.killed_count != null) eq(failures, 'killed_count', raw.killed?.length || 0, expect.killed_count);
  if (expect.valid_hedge_baskets != null) eq(failures, 'valid_hedge_baskets', raw.hedge_baskets?.valid?.length || 0, expect.valid_hedge_baskets);
  if (expect.valid_parlay_ladders != null) eq(failures, 'valid_parlay_ladders', raw.parlay_ladders?.valid?.length || 0, expect.valid_parlay_ladders);
  if (expect.invalidated_stacks != null) eq(failures, 'invalidated_stacks', raw.invalidated_stacks?.length || 0, expect.invalidated_stacks);
  if (expect.unresolved_ladder_leg_count != null) {
    const count = (raw.parlay_ladders?.valid || []).reduce((acc, ladder) => acc + (ladder.unresolved_legs?.length || 0), 0);
    eq(failures, 'unresolved_ladder_leg_count', count, expect.unresolved_ladder_leg_count);
  }
  if (expect.portfolio_status != null) eq(failures, 'portfolio_status', strategy.status, expect.portfolio_status);
  if (expect.coverage_count != null) eq(failures, 'coverage_count', strategy.coverage_positions?.length || 0, expect.coverage_count);
  if (expect.unresolved_raw_coverage_count != null) eq(failures, 'unresolved_raw_coverage_count', strategy.unresolved_raw_coverage_positions?.length || 0, expect.unresolved_raw_coverage_count);
  if (expect.ladder_count != null) eq(failures, 'ladder_count', strategy.ladder_stacks?.length || 0, expect.ladder_count);

  hasAll(failures, 'anchors', (strategy.anchor_positions || []).map((a) => a.team), expect.anchor_teams_include);
  hasAll(failures, 'coverage', (strategy.coverage_positions || []).map((c) => c.selection), expect.coverage_selections_include);
  hasAll(failures, 'ladders', (strategy.ladder_stacks || []).map((l) => l.team), expect.ladder_teams_include);

  for (const [key, val] of Object.entries(expect.exposure_summary || {})) eq(failures, `exposure_summary.${key}`, exposure[key], val);

  const legs = collectLegs(raw);
  for (const expected of expect.resolved_legs_include || []) {
    if (!legs.some((leg) => legMatches(leg, expected))) failures.push(`resolved_legs_include: missing ${JSON.stringify(expected)}`);
  }
  for (const expected of expect.no_resolved_legs_include || []) {
    if (legs.some((leg) => legMatches(leg, expected))) failures.push(`no_resolved_legs_include: unexpectedly found ${JSON.stringify(expected)}`);
  }

  if (expect.invalidated_stack_reason_includes?.length) {
    const reasons = (raw.invalidated_stacks || []).map((x) => x.reason || '').join('\n');
    includesText(failures, 'invalidated_stack_reason_includes', reasons, expect.invalidated_stack_reason_includes);
  }
  if (expect.report_contains?.length) includesText(failures, 'report_contains', md, expect.report_contains);

  return failures;
}

async function loadScenario(file) {
  const scenario = JSON.parse(await readFile(file, 'utf8'));
  scenario.id ||= path.basename(file, '.json');
  return scenario;
}

async function runScenario(file) {
  const scenario = await loadScenario(file);
  const suffix = safeSuffix(scenario.output_suffix || `corpus-${scenario.id}`);
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', childScript()], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORTFOLIO_CORPUS_SCENARIO: file,
      PORTFOLIO_CORPUS_SUFFIX: suffix,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'offline-local-test',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || 'offline-local-test',
      SUPABASE_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
    },
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 8,
  });

  if (result.status !== 0) {
    return {
      ok: false,
      scenario,
      failures: [`child process exited ${result.status}`, result.stdout.trim(), result.stderr.trim()].filter(Boolean),
    };
  }

  const htmlPath = pathFromOutput(result.stdout, suffix);
  const rawPath = htmlPath.replace(/\.html$/i, '.raw.json');
  const mdPath = htmlPath.replace(/\.html$/i, '.md');
  if (!existsSync(rawPath)) return { ok: false, scenario, failures: [`missing raw output: ${rawPath}`] };

  const raw = JSON.parse(await readFile(rawPath, 'utf8'));
  const md = existsSync(mdPath) ? await readFile(mdPath, 'utf8') : '';
  const failures = runAssertions({ scenario, raw, md });
  return { ok: failures.length === 0, scenario, failures, rawPath, mdPath, htmlPath };
}

const files = await corpusFiles();
if (LIST_ONLY) {
  for (const file of files) {
    const scenario = await loadScenario(file);
    console.log(`${scenario.id}: ${scenario.description || path.basename(file)}`);
  }
  process.exit(0);
}

if (!files.length) {
  console.error(`No corpus scenarios matched${ONLY_SCENARIO ? `: ${ONLY_SCENARIO}` : ''}.`);
  process.exit(1);
}

let failed = 0;
for (const file of files) {
  const result = await runScenario(file);
  if (result.ok) {
    console.log(`PASS ${result.scenario.id}`);
    console.log(`     raw: ${result.rawPath}`);
  } else {
    failed += 1;
    console.error(`FAIL ${result.scenario.id}`);
    for (const failure of result.failures) console.error(`     ${failure}`);
    if (!KEEP_GOING) break;
  }
}

if (failed) {
  console.error(`\n${failed} portfolio corpus scenario(s) failed.`);
  process.exit(1);
}

console.log(`\n${files.length} portfolio corpus scenario(s) passed.`);
