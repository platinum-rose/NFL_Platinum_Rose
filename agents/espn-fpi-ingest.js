// agents/espn-fpi-ingest.js
// Free replacement/companion for real DVOA (Football Outsiders/FTN DVOA is now
// subscriber-only -- see claude/handoff notes). Pulls ESPN's Football Power
// Index from their public (undocumented) powerindex endpoint, which is free
// and updates weekly during the season, and writes it as a DVOA-shaped input
// file that the existing build-dvoa-snapshots.js / seed-team-profile-snapshots.js
// pipeline already knows how to consume -- so this script's only job is
// fetch + validate + reshape, not a new Supabase-writing path.
//
// IMPORTANT: this is FPI, not DVOA. The output file reuses DVOA-shaped column
// names (total_dvoa/off_dvoa/def_dvoa/st_dvoa) purely because that's the input
// schema build-dvoa-snapshots.js already parses -- downstream in Supabase the
// row is tagged with source_key 'espn_fpi' / source_name 'ESPN FPI', so it is
// never confused with real Football-Outsiders/FTN DVOA. FPI and DVOA are both
// "opponent-adjusted efficiency" ratings but are computed differently and are
// NOT on the same numeric scale -- don't average them together downstream.
//
// ESPN's FPI is defined additively: FPI == OFF + DEF + ST (verified against
// live data for multiple teams before writing this). This script asserts that
// relationship for every team it ingests as a live schema-drift guard: if ESPN
// ever reorders/renames the fields in that "fpi" category array, the sum check
// will fail loudly instead of silently writing mislabeled offense/defense
// numbers into the database.
//
// Usage:
//   node agents/espn-fpi-ingest.js --season 2026 --week 2
//   node agents/espn-fpi-ingest.js --season 2026 --week 2 --dry-run
//
// If the live ESPN fetch is blocked by network egress policy, save the raw
// powerindex response (or a trimmed copy keeping teams[].team + the 'fpi'
// category) to a file and reshape it offline with the same validation path:
//   node agents/espn-fpi-ingest.js --season 2026 --week 2 \
//     --from-file data/vault-seed/dvoa/_raw/espn-powerindex-2026-w2.json
//
// Then feed the result through the existing pipeline:
//   node scripts/build-dvoa-snapshots.js --season 2026 --week 2 \
//     --input data/vault-seed/dvoa/espn-fpi-2026-w2.json \
//     --source-key espn_fpi --source-name "ESPN FPI"
//   node scripts/seed-team-profile-snapshots.js --season 2026 --table team_dvoa_snapshots --apply

import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { getTeamAbbreviation, normalizeTeam } from '../src/lib/teams.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'data', 'vault-seed', 'dvoa');

const ESPN_POWERINDEX = 'https://site.web.api.espn.com/apis/fitt/v3/sports/football/nfl/powerindex';

const SUM_CHECK_TOLERANCE = 0.05;

function parseArgs(argv = process.argv.slice(2)) {
  const out = { season: 2026, dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--season') out.season = Number(argv[++i]);
    else if (arg === '--week') out.week = Number(argv[++i]);
    else if (arg === '--out') out.out = argv[++i];
    else if (arg === '--dry-run') out.dryRun = true;
    else if (arg === '--from-file') out.fromFile = argv[++i];
  }
  return out;
}

function canonicalFromEspnTeam(teamObj) {
  const display = teamObj?.displayName || teamObj?.name || '';
  const abbr = teamObj?.abbreviation || '';
  const canonical = normalizeTeam(display) || normalizeTeam(abbr) || display || abbr;
  const stdAbbr = getTeamAbbreviation(canonical) || String(abbr).toUpperCase();
  return { canonical, abbreviation: stdAbbr, displayName: display || canonical };
}

async function fetchPowerIndex(season) {
  const url = `${ESPN_POWERINDEX}?season=${season}&limit=40`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (nfl-dashboard research agent)' } });
  if (!res.ok) {
    throw new Error(`ESPN powerindex request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function extractFpiRow(team, season) {
  const categories = team.categories || [];
  const fpi = categories.find((c) => c.name === 'fpi');
  if (!fpi || !Array.isArray(fpi.values) || fpi.values.length < 5) return { error: 'missing fpi category/values' };

  const [total, off, def, st, rank] = fpi.values;
  if (![total, off, def, st, rank].every((v) => typeof v === 'number' && Number.isFinite(v))) {
    return { error: 'fpi values are not all finite numbers' };
  }

  // Schema-drift guard: ESPN's FPI is defined as OFF + DEF + ST == overall FPI.
  const reconstructed = off + def + st;
  if (Math.abs(reconstructed - total) > SUM_CHECK_TOLERANCE) {
    return { error: `sum check failed: off(${off}) + def(${def}) + st(${st}) = ${reconstructed.toFixed(3)}, expected ~${total}` };
  }

  const { canonical, displayName } = canonicalFromEspnTeam(team.team);
  if (!canonical) return { error: `could not resolve canonical team name from ${JSON.stringify(team.team)}` };

  return {
    row: {
      season,
      team: canonical,
      total_dvoa: Number(total.toFixed(3)),
      off_dvoa: Number(off.toFixed(3)),
      def_dvoa: Number(def.toFixed(3)),
      st_dvoa: Number(st.toFixed(3)),
      rk: Math.round(rank),
      espn_team_id: team.team?.id ?? null,
      espn_display_name: displayName,
    },
  };
}

async function main() {
  const args = parseArgs();
  if (!Number.isFinite(args.season)) throw new Error('--season is required, e.g. --season 2026');

  let payload;
  if (args.fromFile) {
    const fromPath = path.resolve(ROOT, args.fromFile);
    console.log(`--from-file: reading cached ESPN powerindex payload from ${fromPath} (no live fetch)`);
    payload = JSON.parse(await readFile(fromPath, 'utf8'));
  } else {
    payload = await fetchPowerIndex(args.season);
  }
  const teams = payload.teams || [];
  if (teams.length === 0) throw new Error('ESPN powerindex returned no teams -- aborting rather than writing an empty file');

  const week = args.week ?? payload.currentSeason?.type?.week?.number ?? null;

  const rows = [];
  const skipped = [];
  for (const team of teams) {
    const { row, error } = extractFpiRow(team, args.season);
    if (error) {
      skipped.push({ team: team.team?.abbreviation || team.team?.displayName || '?', error });
      continue;
    }
    rows.push(row);
  }

  console.log(`ESPN FPI: parsed ${rows.length}/${teams.length} teams for season ${args.season}${week ? `, week ${week}` : ''}`);
  if (skipped.length > 0) {
    console.warn(`skipped ${skipped.length} team(s):`);
    for (const s of skipped) console.warn(`  - ${s.team}: ${s.error}`);
  }

  // Fail loudly rather than silently seed a partial/garbage snapshot.
  const skipRate = skipped.length / teams.length;
  if (skipRate > 0.1) {
    throw new Error(`too many teams failed the FPI schema check (${skipped.length}/${teams.length}) -- ESPN likely changed their response shape; not writing output`);
  }

  rows.sort((a, b) => a.team.localeCompare(b.team));

  if (args.dryRun) {
    console.log('--dry-run: not writing a file. Sample rows:');
    console.log(JSON.stringify(rows.slice(0, 3), null, 2));
    return;
  }

  const defaultName = `espn-fpi-${args.season}${week ? `-w${week}` : ''}.json`;
  const outPath = args.out ? path.resolve(ROOT, args.out) : path.join(OUT_DIR, defaultName);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
  console.log(`wrote ${outPath}`);
  console.log('');
  console.log('Next steps to load into Supabase:');
  console.log(`  node scripts/build-dvoa-snapshots.js --season ${args.season}${week ? ` --week ${week}` : ''} --input ${path.relative(ROOT, outPath)} --source-key espn_fpi --source-name "ESPN FPI"`);
  console.log(`  node scripts/seed-team-profile-snapshots.js --season ${args.season} --table team_dvoa_snapshots --apply`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
