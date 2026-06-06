// agents/vault-seed.js
// ═══════════════════════════════════════════════════════════════════════════════
// Vault Seed Agent — Reference Data Ingestion
//
// Reads source files from data/vault-seed/{pff,ats,splits,dvoa,nflverse,manual}/
// and upserts structured Markdown notes into the vault_notes Supabase table.
//
// Supported formats:
//   CSV  — auto-detected schema (PFF grades, ATS records, splits, DVOA, nflverse)
//   JSON — array of objects with the same schemas as CSV
//   MD   — pass-through to NFL/Reference/<filename>
//
// Usage:
//   node agents/vault-seed.js [--dry-run] [--dir <subdir>] [--file <path>] [--team <ABBR>]
//
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ═══════════════════════════════════════════════════════════════════════════════

import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync }      from 'node:fs';
import path                from 'node:path';
import { createHash }      from 'node:crypto';
import { fileURLToPath }   from 'node:url';

import { createClient }    from '@supabase/supabase-js';
import 'dotenv/config';

const __filename   = fileURLToPath(import.meta.url);
const __dirname    = path.dirname(__filename);
const ROOT         = path.resolve(__dirname, '..');
const SEED_DIR     = path.join(ROOT, 'data', 'vault-seed');
const RECEIPTS_DIR = path.join(ROOT, '.nfl', 'receipts');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DRY_RUN   = process.argv.includes('--dry-run');
const _dirIdx   = process.argv.indexOf('--dir');
const _fileIdx  = process.argv.indexOf('--file');
const _teamIdx  = process.argv.indexOf('--team');
const ONLY_DIR  = _dirIdx  !== -1 ? process.argv[_dirIdx  + 1] || null : null;
const ONLY_FILE = _fileIdx !== -1 ? process.argv[_fileIdx + 1] || null : null;
const ONLY_TEAM = _teamIdx !== -1 ? process.argv[_teamIdx + 1]?.toUpperCase() || null : null;

// ─── Team normalization (inline — avoids ESM/browser import complexity) ───────

const TEAM_ABBR_MAP = {
  'arizona cardinals': 'ARI', 'atlanta falcons': 'ATL', 'baltimore ravens': 'BAL',
  'buffalo bills': 'BUF', 'carolina panthers': 'CAR', 'chicago bears': 'CHI',
  'cincinnati bengals': 'CIN', 'cleveland browns': 'CLE', 'dallas cowboys': 'DAL',
  'denver broncos': 'DEN', 'detroit lions': 'DET', 'green bay packers': 'GB',
  'houston texans': 'HOU', 'indianapolis colts': 'IND', 'jacksonville jaguars': 'JAX',
  'kansas city chiefs': 'KC', 'las vegas raiders': 'LV', 'los angeles chargers': 'LAC',
  'los angeles rams': 'LAR', 'miami dolphins': 'MIA', 'minnesota vikings': 'MIN',
  'new england patriots': 'NE', 'new orleans saints': 'NO', 'new york giants': 'NYG',
  'new york jets': 'NYJ', 'philadelphia eagles': 'PHI', 'pittsburgh steelers': 'PIT',
  'san francisco 49ers': 'SF', 'seattle seahawks': 'SEA', 'tampa bay buccaneers': 'TB',
  'tennessee titans': 'TEN', 'washington commanders': 'WAS',
  // common short names
  'cardinals':'ARI','falcons':'ATL','ravens':'BAL','bills':'BUF','panthers':'CAR',
  'bears':'CHI','bengals':'CIN','browns':'CLE','cowboys':'DAL','broncos':'DEN',
  'lions':'DET','packers':'GB','texans':'HOU','colts':'IND','jaguars':'JAX',
  'chiefs':'KC','raiders':'LV','chargers':'LAC','rams':'LAR','dolphins':'MIA',
  'vikings':'MIN','patriots':'NE','saints':'NO','giants':'NYG','jets':'NYJ',
  'eagles':'PHI','steelers':'PIT','49ers':'SF','niners':'SF','seahawks':'SEA',
  'buccaneers':'TB','bucs':'TB','titans':'TEN','commanders':'WAS',
  // abbreviations
  'ari':'ARI','atl':'ATL','bal':'BAL','buf':'BUF','car':'CAR','chi':'CHI',
  'cin':'CIN','cle':'CLE','dal':'DAL','den':'DEN','det':'DET','gb':'GB',
  'hou':'HOU','ind':'IND','jax':'JAX','kc':'KC','lv':'LV','lac':'LAC',
  'lar':'LAR','la':'LAR','mia':'MIA','min':'MIN','ne':'NE','no':'NO',
  'nyg':'NYG','nyj':'NYJ','phi':'PHI','pit':'PIT','sf':'SF','sea':'SEA',
  'tb':'TB','ten':'TEN','was':'WAS',
};

const ALL_ABBRS = [...new Set(Object.values(TEAM_ABBR_MAP))];

function toAbbr(input) {
  if (!input) return null;
  const clean = String(input).toLowerCase().trim();
  return TEAM_ABBR_MAP[clean] || null;
}

// ─── CSV Parser (no external dep) ─────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '_'));
  const rows = lines.slice(1)
    .filter(l => l.trim())
    .map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
    });
  return { headers, rows };
}

// ─── Schema Detection ─────────────────────────────────────────────────────────

const SCHEMAS = {
  pff: {
    detect: (headers) => headers.some(h => h.includes('grade')) && headers.some(h => h.includes('team')),
    teamCol: (headers) => headers.find(h => h === 'team_name' || h === 'team' || h === 'franchise'),
    yearCol: (headers) => headers.find(h => h === 'season' || h === 'year'),
    label: 'PFF Grades',
    vaultPrefix: 'NFL/Reference/PFF',
    teamVaultPrefix: 'NFL/Teams',
    teamSuffix: 'PFF',
    tags: ['pff', 'grades', 'reference'],
  },
  ats: {
    detect: (headers) => headers.some(h => h.includes('ats_wins') || h.includes('ats_pct') || (h.includes('ats') && h.includes('win'))),
    teamCol: (headers) => headers.find(h => h === 'team' || h === 'team_name'),
    yearCol: (headers) => headers.find(h => h === 'season' || h === 'year'),
    label: 'ATS Records',
    vaultPrefix: 'NFL/Reference/ATS',
    teamVaultPrefix: 'NFL/Teams',
    teamSuffix: 'ATS',
    tags: ['ats', 'betting', 'reference'],
  },
  splits: {
    detect: (headers) => headers.some(h => h.includes('ticket_pct') || h.includes('money_pct') || h.includes('spread_pct')),
    teamCol: (headers) => headers.find(h => h === 'home_team' || h === 'team'),
    yearCol: (headers) => headers.find(h => h === 'season' || h === 'year' || h === 'game_date'),
    label: 'Betting Splits',
    vaultPrefix: 'NFL/Reference/Splits',
    teamVaultPrefix: 'NFL/Teams',
    teamSuffix: 'Splits',
    tags: ['splits', 'betting', 'reference'],
  },
  dvoa: {
    detect: (headers) => headers.some(h => h === 'total_dvoa' || h === 'off_dvoa' || h.includes('dvoa')),
    teamCol: (headers) => headers.find(h => h === 'team' || h === 'team_name'),
    yearCol: (headers) => headers.find(h => h === 'season' || h === 'year'),
    label: 'DVOA',
    vaultPrefix: 'NFL/Reference/DVOA',
    teamVaultPrefix: 'NFL/Teams',
    teamSuffix: 'DVOA',
    tags: ['dvoa', 'analytics', 'reference'],
  },
  nflverse: {
    // Matches PBP-style data (posteam/defteam/epa) and nfl_data_py player/team stats
    // (passing_epa, rushing_epa, recent_team + position).
    detect: (headers) =>
      headers.some(h => h === 'posteam' || h === 'defteam' || h === 'epa' || h.includes('epa_per')) ||
      headers.some(h => h === 'passing_epa' || h === 'rushing_epa' || h === 'receiving_epa') ||
      (headers.includes('recent_team') && headers.includes('position')),
    teamCol: (headers) => headers.find(h => h === 'posteam' || h === 'defteam' || h === 'recent_team' || h === 'team'),
    yearCol: (headers) => headers.find(h => h === 'season' || h === 'year'),
    label: 'nflverse',
    vaultPrefix: 'NFL/Reference/nflverse',
    teamVaultPrefix: 'NFL/Teams',
    teamSuffix: 'EPA',
    tags: ['epa', 'nflverse', 'analytics', 'reference'],
  },
  // ── Schedules / game results (nfl_data_py import_schedules / import_games) ──
  // games.csv (completed only) and schedules.csv both match; dir-name hint
  // routes games.csv → 'games' and schedules.csv → 'schedules' schema.
  games: {
    detect: (headers) =>
      headers.includes('home_team') && headers.includes('away_team') && headers.includes('spread_line'),
    teamCol: (headers) => headers.find(h => h === 'home_team'),
    yearCol: (headers) => headers.find(h => h === 'season'),
    label: 'Game Results',
    vaultPrefix: 'NFL/Reference/GameResults',
    teamVaultPrefix: 'NFL/Teams',
    teamSuffix: 'Schedule',
    tags: ['schedule', 'games', 'nflverse', 'reference'],
  },
  schedules: {
    detect: (headers) =>
      headers.includes('home_team') && headers.includes('away_team') && headers.includes('spread_line'),
    teamCol: (headers) => headers.find(h => h === 'home_team'),
    yearCol: (headers) => headers.find(h => h === 'season'),
    label: 'Schedule',
    vaultPrefix: 'NFL/Reference/Schedules',
    teamVaultPrefix: 'NFL/Teams',
    teamSuffix: 'Schedule',
    tags: ['schedule', 'games', 'nflverse', 'reference'],
  },
  // ── FTN charting (nfl_data_py import_ftn_data) — play-level, no team col ──
  ftn: {
    detect: (headers) => headers.some(h => h === 'ftn_game_id' || h === 'n_pass_rushers' || h === 'n_blitzers'),
    teamCol: (_headers) => null,   // play-level data — no team column; league-wide note only
    yearCol: (headers) => headers.find(h => h === 'season'),
    label: 'FTN Charting',
    vaultPrefix: 'NFL/Reference/FTN',
    teamVaultPrefix: 'NFL/Teams',
    teamSuffix: 'FTN',
    tags: ['ftn', 'charting', 'analytics', 'nflverse', 'reference'],
  },
  // ── ESPN QBR / team efficiency (nfl_data_py import_espn_data) ────────────
  espn: {
    detect: (headers) => headers.some(h => h === 'qbr_total' || h === 'qb_team' || h === 'qbr_raw'),
    teamCol: (headers) => headers.find(h => h === 'qb_team' || h === 'team'),
    yearCol: (headers) => headers.find(h => h === 'season'),
    label: 'ESPN QBR',
    vaultPrefix: 'NFL/Reference/ESPN',
    teamVaultPrefix: 'NFL/Teams',
    teamSuffix: 'QBR',
    tags: ['espn', 'qbr', 'analytics', 'nflverse', 'reference'],
  },
};

function detectSchema(headers, dirName, fileName = null) {
  // Filename hint takes highest priority (disambiguates files with identical headers)
  if (fileName && SCHEMAS[fileName]) {
    const s = SCHEMAS[fileName];
    if (s.detect(headers)) return { name: fileName, ...s };
  }
  // Dir-name hint
  if (dirName && SCHEMAS[dirName]) {
    const s = SCHEMAS[dirName];
    if (s.detect(headers)) return { name: dirName, ...s };
  }
  // Auto-detect
  for (const [name, schema] of Object.entries(SCHEMAS)) {
    if (schema.detect(headers)) return { name, ...schema };
  }
  return null;
}

// ─── Note Formatters ──────────────────────────────────────────────────────────

function now() { return new Date().toISOString().slice(0, 10); }
function sha8(v) { return createHash('sha256').update(String(v)).digest('hex').slice(0, 8); }
function fmtNum(v) { return (v == null || v === '') ? '—' : (isNaN(+v) ? v : (+v).toFixed(2)); }

/** Build a Markdown table from an array of objects */
function mdTable(rows, cols) {
  if (!rows.length) return '_No data_';
  const header = `| ${cols.join(' | ')} |`;
  const sep    = `| ${cols.map(() => '---').join(' | ')} |`;
  const body   = rows.map(r => `| ${cols.map(c => r[c] ?? '—').join(' | ')} |`).join('\n');
  return `${header}\n${sep}\n${body}`;
}

/** Format a generic CSV schema into a league-wide reference note */
function buildLeagueNote(schema, rows, year, headers) {
  const teamCol = schema.teamCol(headers);
  const metricCols = headers.filter(h => h !== teamCol && h !== schema.yearCol(headers));
  const displayCols = [teamCol, ...metricCols].slice(0, 10); // cap columns

  const tableRows = rows.map(r => {
    const abbr = toAbbr(r[teamCol]) || r[teamCol];
    return { ...r, [teamCol]: abbr };
  });

  return `# ${schema.label} — ${year} Season

_Source: vault-seed ingestion | Updated: ${now()}_

${mdTable(tableRows, displayCols)}

_${rows.length} teams. Auto-generated from vault-seed CSV._
`;
}

/** Format per-team section for a given team's rows */
function buildTeamNote(schema, teamRows, abbr, year, headers) {
  const teamCol  = schema.teamCol(headers);
  const yearCol  = schema.yearCol(headers);
  const metricCols = headers.filter(h => h !== teamCol && h !== yearCol);

  const metrics = metricCols.map(col => {
    const val = teamRows[0]?.[col] ?? '—';
    return `- **${col.replace(/_/g, ' ')}:** ${fmtNum(val)}`;
  }).join('\n');

  return `## ${schema.label} — ${year}

_Updated: ${now()}_

${metrics}
`;
}

/** Build or extend a per-team vault note with a new section */
function mergeTeamSection(existingContent, newSection, sectionHeader) {
  if (!existingContent) return `# Team Reference Note\n\n${newSection}`;
  // Replace existing section if present
  const re = new RegExp(`## ${sectionHeader}[\\s\\S]*?(?=\\n## |$)`, '');
  if (re.test(existingContent)) {
    return existingContent.replace(re, newSection);
  }
  return existingContent.trim() + '\n\n' + newSection;
}

// ─── Supabase Upsert ──────────────────────────────────────────────────────────

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
}

async function upsertNote(supabase, { path: vaultPath, content, tags, source = 'agent' }, results) {
  const entry = { path: vaultPath, status: null };
  if (DRY_RUN) {
    entry.status = 'dry-run';
    console.log(`  [DRY-RUN] ${vaultPath} (${content.length} chars)`);
    results.push(entry);
    return;
  }
  const { error } = await supabase.from('vault_notes')
    .upsert({ path: vaultPath, content, tags, source }, { onConflict: 'path' });
  if (error) {
    entry.status = 'error';
    entry.error  = error.message;
    console.error(`  [FAIL] ${vaultPath}: ${error.message}`);
  } else {
    entry.status = 'ok';
    console.log(`  [OK]   ${vaultPath}`);
  }
  results.push(entry);
}

// ─── File Processors ──────────────────────────────────────────────────────────

async function processCSV(supabase, filePath, dirName, results) {
  const text = await readFile(filePath, 'utf-8');
  const { headers, rows } = parseCSV(text);
  if (!headers.length || !rows.length) {
    console.warn(`  [SKIP] ${filePath}: empty or unparseable`);
    return;
  }

  const schema = detectSchema(headers, dirName, path.basename(filePath, path.extname(filePath)));
  if (!schema) {
    console.warn(`  [SKIP] ${filePath}: unknown schema (headers: ${headers.slice(0,6).join(', ')})`);
    return;
  }

  const teamCol = schema.teamCol(headers);
  const yearCol = schema.yearCol(headers);

  // Determine year: from data or filename
  const yearFromData = rows[0]?.[yearCol];
  const yearFromFile = filePath.match(/20(\d{2})/)?.[0];
  const year = yearFromData || yearFromFile || new Date().getFullYear() - 1;

  console.log(`  Schema: ${schema.label} | year: ${year} | teams: ${rows.length} rows`);

  // ── League-wide reference note ──
  const leaguePath = `${schema.vaultPrefix}-${year}.md`;
  if (!ONLY_TEAM) {
    const leagueContent = buildLeagueNote(schema, rows, year, headers);
    await upsertNote(supabase, {
      path: leaguePath,
      content: leagueContent,
      tags: [...schema.tags, `season-${year}`],
    }, results);
  }

  // ── Per-team notes ──
  if (!teamCol) return;

  // Group rows by team
  const byTeam = new Map();
  for (const row of rows) {
    const abbr = toAbbr(row[teamCol]);
    if (!abbr) continue;
    if (ONLY_TEAM && abbr !== ONLY_TEAM) continue;
    if (!byTeam.has(abbr)) byTeam.set(abbr, []);
    byTeam.get(abbr).push(row);
  }

  for (const [abbr, teamRows] of byTeam) {
    const teamPath    = `${schema.teamVaultPrefix}/${abbr}-${schema.teamSuffix}.md`;
    const sectionHeader = `${schema.label} — ${year}`;
    const newSection    = buildTeamNote(schema, teamRows, abbr, year, headers);

    // Read existing note and merge
    let existingContent = null;
    if (!DRY_RUN) {
      const { data } = await supabase.from('vault_notes').select('content').eq('path', teamPath).maybeSingle();
      existingContent = data?.content ?? null;
    }
    const merged = mergeTeamSection(existingContent, newSection, sectionHeader);
    await upsertNote(supabase, {
      path: teamPath,
      content: merged,
      tags: [...schema.tags, `team-${abbr.toLowerCase()}`, `season-${year}`],
    }, results);
  }
}

async function processJSON(supabase, filePath, dirName, results) {
  const text = await readFile(filePath, 'utf-8');
  let data;
  try { data = JSON.parse(text); } catch (e) {
    console.warn(`  [SKIP] ${filePath}: invalid JSON`);
    return;
  }
  const rows = Array.isArray(data) ? data : data.data ?? data.rows ?? [];
  if (!rows.length) { console.warn(`  [SKIP] ${filePath}: no rows`); return; }

  // Convert to CSV-like and reuse CSV processor
  const headers = Object.keys(rows[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const normalised = rows.map(r => Object.fromEntries(
    Object.entries(r).map(([k, v]) => [k.toLowerCase().replace(/\s+/g, '_'), v])
  ));

  const schema = detectSchema(headers, dirName);
  if (!schema) {
    console.warn(`  [SKIP] ${filePath}: unknown schema`);
    return;
  }

  // Minimal: write a league-wide note
  const yearCol = schema.yearCol(headers);
  const year = normalised[0]?.[yearCol] || filePath.match(/20(\d{2})/)?.[0] || new Date().getFullYear() - 1;
  const leaguePath = `${schema.vaultPrefix}-${year}.md`;
  const leagueContent = buildLeagueNote(schema, normalised, year, headers);
  if (!ONLY_TEAM) {
    await upsertNote(supabase, {
      path: leaguePath,
      content: leagueContent,
      tags: [...schema.tags, `season-${year}`],
    }, results);
  }
}

async function processMarkdown(supabase, filePath, results) {
  const content  = await readFile(filePath, 'utf-8');
  const basename = path.basename(filePath, '.md');
  const vaultPath = `NFL/Reference/${basename}.md`;
  await upsertNote(supabase, {
    path: vaultPath,
    content,
    tags: ['manual', 'reference'],
    source: 'manual',
  }, results);
}

// ─── Directory Walker ─────────────────────────────────────────────────────────

async function processDir(supabase, dirPath, dirName, results) {
  if (!existsSync(dirPath)) return;
  const entries = await readdir(dirPath);
  for (const entry of entries) {
    if (entry.startsWith('.') || entry === 'README.md') continue;
    const full = path.join(dirPath, entry);
    const ext  = path.extname(entry).toLowerCase();
    console.log(`\nProcessing: ${entry}`);
    if (ext === '.csv')        await processCSV(supabase, full, dirName, results);
    else if (ext === '.json')  await processJSON(supabase, full, dirName, results);
    else if (ext === '.md')    await processMarkdown(supabase, full, results);
    else console.warn(`  [SKIP] unsupported file type: ${ext}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🏈 vault-seed.js | dry-run=${DRY_RUN} | dir=${ONLY_DIR || 'all'} | team=${ONLY_TEAM || 'all'}\n`);

  const supabase = DRY_RUN ? null : getSupabase();
  const results  = [];
  const started  = Date.now();

  if (ONLY_FILE) {
    // Single-file mode
    const dirName = path.basename(path.dirname(ONLY_FILE));
    const ext = path.extname(ONLY_FILE).toLowerCase();
    console.log(`\nProcessing: ${ONLY_FILE}`);
    if (ext === '.csv')       await processCSV(supabase, ONLY_FILE, dirName, results);
    else if (ext === '.json') await processJSON(supabase, ONLY_FILE, dirName, results);
    else if (ext === '.md')   await processMarkdown(supabase, ONLY_FILE, results);
    else console.warn(`Unsupported file type: ${ext}`);
  } else {
    const subDirs = ONLY_DIR ? [ONLY_DIR] : Object.keys(SCHEMAS).concat(['manual']);
    for (const dir of subDirs) {
      const dirPath = path.join(SEED_DIR, dir);
      console.log(`\n── ${dir}/ ─────────────────────`);
      await processDir(supabase, dirPath, dir, results);
    }
  }

  // ── Receipt ──
  await mkdir(RECEIPTS_DIR, { recursive: true });
  const receipt = {
    run_at:   new Date().toISOString(),
    dry_run:  DRY_RUN,
    duration_ms: Date.now() - started,
    total:    results.length,
    ok:       results.filter(r => r.status === 'ok').length,
    skipped:  results.filter(r => r.status === 'dry-run').length,
    errors:   results.filter(r => r.status === 'error').length,
    notes:    results,
  };

  const receiptPath = path.join(RECEIPTS_DIR, `vault-seed-${Date.now()}.json`);
  if (!DRY_RUN) {
    await writeFile(receiptPath, JSON.stringify(receipt, null, 2));
    console.log(`\nReceipt: ${receiptPath}`);
  }

  console.log(`\n✅ Done — ${receipt.ok} written | ${receipt.errors} errors | ${receipt.skipped} dry-run | ${receipt.duration_ms}ms`);
  if (receipt.errors > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
