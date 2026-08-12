#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildFuturesOddsExecutionValidation } from './lib/futures-odds-execution.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DEFAULT_FILES = {
  'data/futures-imports/bookmaker-2026-08-10.json': 'Bookmaker/BKR',
  'data/futures-imports/betus-2026-08-10.json': 'BetUS',
  'data/futures-imports/betonline-2026-08-10.json': 'BetOnline',
};

function argValue(name, fallback) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && idx + 1 < process.argv.length ? process.argv[idx + 1] : fallback;
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(ROOT, relativePath), 'utf8'));
}

function mdCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();
}

function renderMarkdown(snapshot) {
  const lines = [
    `# Futures Odds Execution Validation - ${snapshot.meta.generated_at.slice(0, 10)}`,
    '',
    '> Local validation only. This does not create official picks, write Supabase, call a model, or mutate portfolio state.',
    '',
    '## Summary',
    '',
    `- Rows checked: ${snapshot.meta.rows_total}`,
    `- Execution-reference eligible rows: ${snapshot.meta.execution_reference_eligible_rows}`,
    `- Context-only rows: ${snapshot.meta.context_only_rows}`,
    `- Monitor-only exacta rows: ${snapshot.meta.monitor_only_exacta_rows}`,
    `- Exacta pairs: ${snapshot.meta.exacta_pairs}`,
    `- Exacta execution-claim pairs allowed: ${snapshot.meta.exacta_execution_claim_allowed_pairs}`,
    '',
    '## Source Snapshots',
    '',
    '| Source | Rows | Latest Snapshot | Execution-Reference | Monitor-Only Exacta | Context-Only |',
    '|---|---:|---|---:|---:|---:|',
  ];

  for (const [sourcePath, source] of Object.entries(snapshot.sources)) {
    lines.push(`| ${mdCell(sourcePath)} | ${source.rows} | ${source.latest_snapshot_date || ''} | ${source.execution_reference_eligible_rows} | ${source.monitor_only_exacta_rows} | ${source.context_only_rows} |`);
  }

  lines.push(
    '',
    '## Bills/Packers Exacta Gate',
    '',
  );

  if (snapshot.bills_packers_exacta) {
    const gate = snapshot.bills_packers_exacta;
    lines.push(
      `- Status: ${gate.status}`,
      `- Books: ${gate.books.join(', ') || 'none'}`,
      `- Placeable book count: ${gate.placeable_book_count}`,
      `- Best local price: ${gate.best_price ?? ''}`,
      `- Execution claim allowed: ${gate.execution_claim_allowed}`,
      '',
      '| Book | Selection | Price | Snapshot | Reasons |',
      '|---|---|---:|---|---|',
    );
    for (const row of gate.rows) {
      lines.push(`| ${row.book} | ${mdCell(row.selection)} | ${row.price ?? ''} | ${row.snapshot_time || ''} | ${(row.exclusion_reasons || []).join(', ')} |`);
    }
  } else {
    lines.push('_No exact two-team Bills/Packers row exists in the local imports._');
  }

  lines.push(
    '',
    '## Guardrails',
    '',
    '- BKR, BetUS, and BetOnline rows need current local snapshot timestamps and numeric prices to be execution-reference eligible.',
    '- Non-placeable books remain context-only.',
    '- Super Bowl exacta rows require exact two-team parsing and at least two placeable books before any execution claim is allowed.',
    '- Simulation-only exacta prices are never execution claims.',
  );
  return `${lines.join('\n')}\n`;
}

export async function buildFuturesOddsExecutionValidationArtifact(options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const date = generatedAt.slice(0, 10);
  const files = options.files || DEFAULT_FILES;
  const sources = {};
  for (const sourcePath of Object.keys(files)) {
    sources[sourcePath] = await readJson(sourcePath);
  }

  const snapshot = buildFuturesOddsExecutionValidation({
    sources,
  }, {
    generatedAt,
    season: options.season || 2026,
    currentSnapshotDate: options.currentSnapshotDate || '2026-08-10',
  });

  if (options.dryRun) return { snapshot, outputs: null };

  const dataDir = path.join(ROOT, 'data', 'futures-imports');
  const docsDir = path.join(ROOT, 'docs');
  await mkdir(dataDir, { recursive: true });
  await mkdir(docsDir, { recursive: true });
  const jsonPath = path.join(dataDir, `odds-execution-validation-${date}.json`);
  const latestJsonPath = path.join(dataDir, 'odds-execution-validation-latest.json');
  const mdPath = path.join(docsDir, `FUTURES_ODDS_EXECUTION_VALIDATION_${date}.md`);
  const latestMdPath = path.join(docsDir, 'FUTURES_ODDS_EXECUTION_VALIDATION_LATEST.md');
  const markdown = renderMarkdown(snapshot);
  await writeFile(jsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  await writeFile(latestJsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  await writeFile(mdPath, markdown, 'utf8');
  await writeFile(latestMdPath, markdown, 'utf8');
  return { snapshot, outputs: { jsonPath, latestJsonPath, mdPath, latestMdPath } };
}

async function main() {
  const { snapshot, outputs } = await buildFuturesOddsExecutionValidationArtifact({
    generatedAt: argValue('--generated-at', '2026-08-11T12:00:00.000Z'),
    currentSnapshotDate: argValue('--current-snapshot-date', '2026-08-10'),
    dryRun: process.argv.includes('--dry-run'),
  });
  console.log(`Futures odds execution validation complete: execution_reference=${snapshot.meta.execution_reference_eligible_rows}, exacta_monitor=${snapshot.meta.monitor_only_exacta_rows}.`);
  console.log(`Bills/Packers exacta status: ${snapshot.bills_packers_exacta?.status || 'missing'}.`);
  console.log('No live model/API calls, Supabase writes, official picks, or portfolio mutations were attempted.');
  if (outputs) {
    console.log(`JSON: ${outputs.latestJsonPath}`);
    console.log(`Markdown: ${outputs.latestMdPath}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.stack || err.message);
    process.exit(1);
  });
}
