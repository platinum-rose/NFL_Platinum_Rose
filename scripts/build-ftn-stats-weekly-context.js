#!/usr/bin/env node

/**
 * Build a local, model-facing FTN Stats IQ weekly context artifact.
 *
 * This is deliberately a source-evidence adapter, not a projection or pick model.
 * It imports the first-party CSVs the user exported from the rendered FTN site,
 * preserves their table/schema provenance, and maps each row to a canonical NFL
 * team where possible. Downstream synthesis must retain it as context only.
 *
 * Usage:
 *   node scripts/build-ftn-stats-weekly-context.js
 *   node scripts/build-ftn-stats-weekly-context.js --input-dir C:\\Users\\andre\\Downloads
 *   node scripts/build-ftn-stats-weekly-context.js --out data/research-intel/review/custom.json
 */

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { NFL_TEAMS, normalizeTeam } from '../src/lib/teams.js';
import { getNFLWeekInfo } from '../src/lib/constants.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_INPUT_DIR = path.join(process.env.USERPROFILE || 'C:\\Users\\andre', 'Downloads');
const DEFAULT_OUT = 'data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json';
const REQUIRED_EXPORTS = [
  'passing/overview', 'passing/efficiency', 'passing/analytics', 'passing/pressure', 'passing/air-yards',
  'rushing/overview', 'rushing/efficiency', 'rushing/analytics', 'rushing/usage',
  'receiving/overview', 'receiving/efficiency', 'receiving/analytics', 'receiving/usage', 'receiving/air-yards',
  'coverage/overview', 'coverage/analytics', 'coverage/air-yards',
  'pass-rush/overview', 'pass-rush/analytics',
  'rush-defense/overview', 'rush-defense/efficiency', 'rush-defense/defensive-personnel',
  'pass-protection/overview', 'pass-protection/analytics',
  'team-offense/overview', 'team-offense/efficiency', 'team-offense/tempo', 'team-offense/passing-analytics',
  'team-offense/rushing-analytics', 'team-offense/tendencies', 'team-offense/pass-protection',
  'team-defense/overview', 'team-defense/efficiency', 'team-defense/passing-analytics', 'team-defense/rush-analytics',
  'team-defense/pass-rush',
];

const arg = (name, fallback = null) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
};

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted && char === '"' && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === ',') {
      row.push(value);
      value = '';
    } else if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(value);
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    if (row.some((cell) => cell !== '')) rows.push(row);
  }
  return rows;
};

const uniqueColumns = (columns) => {
  const seen = new Map();
  return columns.map((column) => {
    const count = (seen.get(column) || 0) + 1;
    seen.set(column, count);
    return count === 1 ? column : `${column}__${count}`;
  });
};

const inferTableIdentity = (filename) => {
  const stem = filename.replace(/^stats-iq-/, '').replace(/\.csv$/i, '');
  const categories = [
    'team-offense', 'team-defense', 'pass-protection', 'rush-defense',
    'pass-rush', 'receiving', 'rushing', 'coverage', 'passing',
  ];
  const category = categories.find((candidate) => stem === candidate || stem.startsWith(`${candidate}-`));
  if (!category) return { category: 'unknown', subpage: stem };
  return { category, subpage: stem.slice(category.length).replace(/^-/, '') || 'overview' };
};

const toTeamAbbr = (value) => {
  const canonicalName = normalizeTeam(value || '');
  return NFL_TEAMS[canonicalName]?.abbreviation || null;
};

const main = async () => {
  const inputDir = path.resolve(arg('--input-dir', DEFAULT_INPUT_DIR));
  const outPath = path.resolve(ROOT, arg('--out', DEFAULT_OUT));
  const filenames = (await fs.readdir(inputDir))
    .filter((filename) => /^stats-iq-(passing|rushing|receiving|coverage|pass-rush|rush-defense|pass-protection|team-offense|team-defense)-.+\.csv$/i.test(filename))
    .sort((left, right) => left.localeCompare(right));

  const availableSpecs = new Set(filenames.map((filename) => {
    const { category, subpage } = inferTableIdentity(filename);
    return `${category}/${subpage}`;
  }));
  const missingExports = REQUIRED_EXPORTS.filter((spec) => !availableSpecs.has(spec));

  if (missingExports.length) {
    throw new Error(
      `FTN context requires ${REQUIRED_EXPORTS.length} current table exports. Missing from ${inputDir}: ${missingExports.join(', ')}`,
    );
  }

  const tables = [];
  const records = [];
  const perTeam = new Map();
  const sourceCaptureTimes = [];

  for (const filename of filenames) {
    const absolutePath = path.join(inputDir, filename);
    const raw = await fs.readFile(absolutePath, 'utf8');
    const stat = await fs.stat(absolutePath);
    sourceCaptureTimes.push(stat.mtimeMs);
    const rows = parseCsv(raw);
    const [sourceColumns = [], ...sourceRows] = rows;
    const columns = uniqueColumns(sourceColumns);
    const { category, subpage } = inferTableIdentity(filename);
    const sourceUrl = `https://stats.ftnfantasy.com/stats/${category}/${subpage}`;

    tables.push({
      category,
      subpage,
      source_url: sourceUrl,
      exported_filename: filename,
      row_count: sourceRows.length,
      source_columns: sourceColumns,
      model_columns: columns,
      sha256: crypto.createHash('sha256').update(raw).digest('hex'),
    });

    for (const values of sourceRows) {
      const metrics = Object.fromEntries(columns.map((column, index) => [column, values[index] ?? '']));
      const team = toTeamAbbr(metrics.Team || metrics.team || metrics.TEAM || '');
      const record = { category, subpage, team_abbr: team || null, metrics };
      records.push(record);
      if (!team) continue;
      if (!perTeam.has(team)) perTeam.set(team, []);
      perTeam.get(team).push(record);
    }
  }

  const team_context = Object.fromEntries(
    [...perTeam.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([team, teamRecords]) => [team, {
      team,
      record_count: teamRecords.length,
      records: teamRecords,
    }]),
  );
  const sourceCaptureStartedAt = new Date(Math.min(...sourceCaptureTimes));
  const sourceCaptureCompletedAt = new Date(Math.max(...sourceCaptureTimes));
  const inferredWeek = getNFLWeekInfo(sourceCaptureCompletedAt).week;
  const requestedWeek = arg('--week', null);
  if (requestedWeek !== null && Number(requestedWeek) !== Number(inferredWeek)) {
    throw new Error(
      `FTN export capture is Week ${inferredWeek}, but --week ${requestedWeek} was requested. Re-export all FTN tables for the current week instead of reusing stale context.`,
    );
  }

  const output = {
    schema: 'ftn_stats_iq_weekly_synthesis_context_v1',
    generated_at: new Date().toISOString(),
    season: 2026,
    season_type: 'REG',
    week: Number(requestedWeek || inferredWeek),
    source: 'FTN Stats IQ rendered-table CSV exports',
    source_capture_started_at: sourceCaptureStartedAt.toISOString(),
    source_capture_completed_at: sourceCaptureCompletedAt.toISOString(),
    status: 'available_context_only',
    recommendation_status: 'statistical_context_only_not_recommendations',
    execution_authorized: false,
    drafting_guidance: [
      'Use these statistics to explain matchup context and test narratives, not as a standalone pick generator.',
      'Reconcile current injury, starter, weather, and market evidence separately before drafting a recommendation.',
      'Name the relevant FTN table and statistic when citing a value; retain countervailing evidence.',
    ],
    input_directory: inputDir,
    table_count: tables.length,
    required_table_count: REQUIRED_EXPORTS.length,
    record_count: records.length,
    unmapped_record_count: records.filter((record) => !record.team_abbr).length,
    tables,
    team_context,
    caveats: [
      'The captured exports use the source site default filters visible at export time: 2026 and REG.',
      'This artifact contains season-to-date statistics, not forward projections or price evidence.',
      'Duplicate source headers are preserved with __2, __3 suffixes in model_columns only; source_columns retain the original FTN schema.',
    ],
  };

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`FTN weekly context: ${tables.length} tables, ${records.length} rows, ${Object.keys(team_context).length} mapped teams.`);
  console.log(`Wrote ${path.relative(ROOT, outPath).replaceAll(path.sep, '/')}`);
};

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
