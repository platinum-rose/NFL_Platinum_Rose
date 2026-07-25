#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { GENERATED_DIR, ROOT, parseArgs } from './lib/profile-snapshot-utils.js';

const args = parseArgs();
const APPLY = args.apply === true;
const CHUNK = Number(args.chunk || 100);

const ALLOWED = {
  team_analytic_snapshots: {
    conflict: 'season,week,team,source_key,snapshot_at',
    prefixes: ['team-analytic-snapshots-'],
  },
  team_dvoa_snapshots: {
    conflict: 'season,week,team,source_key,snapshot_at',
    prefixes: ['team-dvoa-snapshots-'],
  },
  team_coaching_tendency_snapshots: {
    conflict: 'season,week,team,source_key,snapshot_at',
    prefixes: ['team-coaching-tendency-snapshots-'],
  },
};

function matchesTable(file, table) {
  return ALLOWED[table]?.prefixes.some((prefix) => file.startsWith(prefix));
}

async function readArtifact(filePath) {
  const payload = JSON.parse(await readFile(filePath, 'utf8'));
  const table = payload.meta?.target_table;
  if (!ALLOWED[table]) throw new Error(`${filePath}: unsupported target_table ${table}`);
  if (!Array.isArray(payload.rows)) throw new Error(`${filePath}: expected { rows: [...] }`);
  return { table, rows: payload.rows, meta: payload.meta || {} };
}

async function discoverFiles() {
  if (args.file) return [path.resolve(ROOT, args.file)];
  const dir = path.resolve(ROOT, args.dir || GENERATED_DIR);
  const season = args.season ? String(args.season) : null;
  const table = args.table || null;
  if (table && !ALLOWED[table]) throw new Error(`unsupported --table ${table}`);
  const files = await readdir(dir);
  return files
    .filter((file) => file.endsWith('.json'))
    .filter((file) => !season || file.includes(season))
    .filter((file) => !table || matchesTable(file, table))
    .map((file) => path.join(dir, file))
    .sort();
}

function dbClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for --apply');
  return createClient(url, key, { auth: { persistSession: false } });
}

function groupByTable(artifacts) {
  const grouped = {};
  for (const artifact of artifacts) {
    const g = grouped[artifact.table] ||= { rows: [], files: [] };
    g.rows.push(...artifact.rows);
    g.files.push(artifact.meta?.source || artifact.meta?.generated_at || artifact.table);
  }
  return grouped;
}

function previewRow(row) {
  return {
    season: row.season,
    week: row.week,
    team: row.team,
    source_key: row.source_key,
    snapshot_at: row.snapshot_at,
  };
}

async function upsertTable(sb, table, rows) {
  let written = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const { error } = await sb.from(table).upsert(slice, { onConflict: ALLOWED[table].conflict });
    if (error) throw new Error(`${table} batch ${Math.floor(i / CHUNK) + 1}: ${error.message}`);
    written += slice.length;
  }
  return written;
}

async function main() {
  const files = await discoverFiles();
  if (!files.length) {
    console.log('No generated profile snapshot files matched.');
    return;
  }
  const artifacts = [];
  for (const file of files) {
    const artifact = await readArtifact(file);
    artifacts.push(artifact);
  }
  const grouped = groupByTable(artifacts);
  const mode = APPLY ? 'APPLY' : 'DRY RUN';
  console.log(`Profile snapshot seed ${mode}`);
  console.log(`Files: ${files.map((f) => path.relative(ROOT, f).replace(/\\/g, '/')).join(', ')}`);

  for (const [table, info] of Object.entries(grouped)) {
    const seasons = [...new Set(info.rows.map((r) => r.season))].sort();
    const teams = new Set(info.rows.map((r) => r.team).filter(Boolean));
    console.log(`- ${table}: ${info.rows.length} row(s), ${teams.size} team(s), seasons ${seasons.join(', ')}`);
    console.log(`  sample: ${JSON.stringify(info.rows.slice(0, 2).map(previewRow))}`);
  }

  if (!APPLY) {
    console.log('No database writes performed. Re-run with --apply only after migration 044 has been applied and the user explicitly approves a Supabase write.');
    return;
  }

  const sb = dbClient();
  for (const [table, info] of Object.entries(grouped)) {
    const written = await upsertTable(sb, table, info.rows);
    console.log(`upserted ${written} row(s) into ${table}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
