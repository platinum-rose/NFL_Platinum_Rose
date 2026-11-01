import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const out = path.join(root, 'reports/engineering/week8-secondary-refresh');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
await fs.mkdir(path.join(out, 'raw-depth'), { recursive: true });
await fs.mkdir(path.join(out, 'backups'), { recursive: true });
const seedPaths = [
  'data/secondary-matchups/manual/coverage-schemes-2026.json',
  'data/secondary-matchups/manual/secondary-roles-2026.json',
  'data/secondary-matchups/manual/receiver-roles-2026.json',
  'data/secondary-matchups/latest.json',
  'docs/secondary-matchups/secondary-matchup-vulnerability-latest.md',
  'docs/secondary-matchups/secondary-matchup-vulnerability-latest.html',
];
const baselinePath = path.join(out, 'baseline.json');
try { await fs.access(baselinePath); } catch {
  const files = [];
  for (const rel of seedPaths) {
    try {
      const bytes = await fs.readFile(path.join(root, rel));
      const backup = path.join(out, 'backups', rel.replaceAll('/', '__'));
      await fs.writeFile(backup, bytes, { flag: 'wx' });
      if (sha(await fs.readFile(backup)) !== sha(bytes)) throw new Error(`Backup mismatch: ${rel}`);
      files.push({ path: rel, sha256: sha(bytes), backup: path.relative(root, backup).replaceAll('\\', '/') });
    } catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  const availability = await fs.readFile(path.join(root, 'data/player-availability/latest.json'));
  const roster = await fs.readFile(path.join(root, 'data/nfl-rosters/espn-full-rosters-latest.json'));
  await fs.writeFile(baselinePath, JSON.stringify({
    recorded_at: new Date().toISOString(), files,
    availability: { path: 'data/player-availability/latest.json', sha256: sha(availability), generated_at: JSON.parse(availability).meta.generated_at },
    roster: { path: 'data/nfl-rosters/espn-full-rosters-latest.json', sha256: sha(roster), generated_at: JSON.parse(roster).generated_at },
  }, null, 2) + '\n', { flag: 'wx' });
}

let receipts = [];
try { receipts = JSON.parse(await fs.readFile(path.join(out, 'capture-receipts.json'), 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
async function capture(url, filename) {
  const target = path.join(out, 'raw-depth', filename);
  try {
    const text = await fs.readFile(target, 'utf8');
    return JSON.parse(text);
  } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const response = await fetch(url, { headers: { 'User-Agent': 'NFLDashboard-FreePublicDepthReview/1.0' }, signal: AbortSignal.timeout(30000) });
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  const parsed = JSON.parse(text);
  await fs.writeFile(target, text, { flag: 'wx' });
  receipts.push({ source_url: url, observed_at: new Date().toISOString(), path: path.relative(root, target).replaceAll('\\', '/'), sha256: sha(text), bytes: Buffer.byteLength(text), status: response.status });
  await fs.writeFile(path.join(out, 'capture-receipts.json'), JSON.stringify(receipts, null, 2) + '\n');
  return parsed;
}

const catalog = await capture('https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams', 'teams.json');
const teams = catalog.sports[0].leagues[0].teams.map(({ team }) => ({ id: team.id, abbreviation: team.abbreviation }));
if (teams.length !== 32) throw new Error(`Expected 32 teams, got ${teams.length}`);
let cursor = 0;
const failures = [];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < teams.length) {
    const t = teams[cursor++];
    try {
      const raw = await capture(`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2026/teams/${t.id}/depthcharts`, `${t.abbreviation}.json`);
      console.log(`${t.abbreviation}: ${raw.items?.length ?? 0} depth groups`);
    } catch (e) { failures.push({ team: t.abbreviation, error: e.message }); console.log(`${t.abbreviation}: ${e.message}`); }
  }
}));
await fs.writeFile(path.join(out, 'capture-failures.json'), JSON.stringify(failures, null, 2) + '\n');
await fs.writeFile(path.join(out, 'capture-receipts.json'), JSON.stringify(receipts, null, 2) + '\n');
console.log(JSON.stringify({ teams: teams.length, failures: failures.length, new_captures: receipts.length }));
if (failures.length) process.exitCode = 1;
