#!/usr/bin/env node
import path from 'node:path';
import {
  ROOT,
  canonicalTeam,
  fileStamp,
  num,
  parseArgs,
  readCsv,
  readJson,
  writeJsonArtifact,
} from './lib/profile-snapshot-utils.js';

const args = parseArgs();

function defaultInput(season) {
  return path.join(ROOT, 'data', 'vault-seed', 'dvoa', `dvoa-${season}.json`);
}

function value(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== '') return row[key];
  }
  return null;
}

async function readInput(filePath) {
  if (filePath.toLowerCase().endsWith('.json')) {
    const parsed = await readJson(filePath);
    return Array.isArray(parsed) ? parsed : (parsed.rows || parsed.data || []);
  }
  return readCsv(filePath);
}

function toSnapshot(row, meta) {
  const team = canonicalTeam(value(row, ['team', 'Team', 'TEAM']));
  if (!team) return null;
  return {
    season: Number(value(row, ['season', 'Season'])) || meta.season,
    week: args.week ? Number(args.week) : null,
    team,
    source_key: args['source-key'] || 'imported_dvoa',
    source_name: args['source-name'] || 'Imported DVOA snapshot',
    source_url: args['source-url'] || null,
    snapshot_at: meta.generated_at,
    games_played: args.games ? Number(args.games) : null,
    overall_dvoa: num(value(row, ['total_dvoa', 'overall_dvoa', 'dvoa', 'Total DVOA', 'DVOA'])),
    overall_dvoa_rank: num(value(row, ['rk', 'total_rank', 'overall_dvoa_rank', 'rank', 'Rk'])),
    offensive_dvoa: num(value(row, ['off_dvoa', 'offensive_dvoa', 'Off DVOA'])),
    offensive_dvoa_rank: num(value(row, ['off_rk', 'off_rank', 'offensive_dvoa_rank', 'Off Rank'])),
    defensive_dvoa: num(value(row, ['def_dvoa', 'defensive_dvoa', 'Def DVOA'])),
    defensive_dvoa_rank: num(value(row, ['def_rk', 'def_rank', 'defensive_dvoa_rank', 'Def Rank'])),
    special_teams_dvoa: num(value(row, ['st_dvoa', 'special_teams_dvoa', 'ST DVOA'])),
    special_teams_dvoa_rank: num(value(row, ['st_rk', 'st_rank', 'special_teams_dvoa_rank', 'ST Rank'])),
    weighted_dvoa: num(value(row, ['wei_dvoa', 'weighted_dvoa', 'Weighted DVOA'])),
    weighted_dvoa_rank: num(value(row, ['wei_rk', 'weighted_dvoa_rank', 'Weighted Rank'])),
    attribution_note: args['attribution-note'] || 'Imported source-stamped DVOA snapshot. DVOA is not computed locally by this dashboard.',
    raw: {
      source_file: path.relative(ROOT, meta.input).replace(/\\/g, '/'),
      source_file_mtime: meta.source_file_mtime,
      imported_row: row,
    },
  };
}

async function main() {
  const season = Number(args.season || 2025);
  const input = path.resolve(ROOT, args.input || defaultInput(season));
  const generated_at = args['snapshot-at'] || new Date().toISOString();
  const rows = await readInput(input);
  const meta = {
    generated_at,
    season,
    input,
    source_file_mtime: await fileStamp(input),
  };
  const snapshots = rows
    .map((row) => toSnapshot(row, meta))
    .filter(Boolean)
    .sort((a, b) => a.team.localeCompare(b.team));
  const payload = {
    meta: {
      generated_at,
      season,
      row_count: snapshots.length,
      source: path.relative(ROOT, input).replace(/\\/g, '/'),
      target_table: 'team_dvoa_snapshots',
      write_mode: 'local_json_only',
    },
    rows: snapshots,
  };
  const out = await writeJsonArtifact(`team-dvoa-snapshots-${season}.json`, payload, args.out);
  console.log(`wrote ${out}`);
  console.log(`DVOA snapshots: ${snapshots.length} teams, season ${season}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
