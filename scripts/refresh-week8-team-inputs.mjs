#!/usr/bin/env node
// Scoped local Week 8 preparation. Network retrieval is deliberately separate.
// Preserve the pre-refresh inputs and output checkpoints before any replacement.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import Papa from 'papaparse';
import { normalizeTeam, getTeamAbbreviation } from '../src/lib/teams.js';

const root = process.cwd();
const work = 'reports/engineering/week8-profile-refresh';
const gamesPath = 'data/vault-seed/nflverse/games.csv';
const teamPath = 'data/vault-seed/nflverse/team_stats.csv';
const resultPath = 'reports/analysis/week7-postmortem/espn-game-results-2026-10-26.csv';
const espnTeamPath = 'reports/analysis/week7-postmortem/espn-team-stats-2026-10-26.csv';
const providerPath = `${work}/team-stats-provider-2026.csv`;
const hash = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const readCsv = (p) => {
  const parsed = Papa.parse(fs.readFileSync(p, 'utf8'), { header: true, skipEmptyLines: true });
  assert.equal(parsed.errors.length, 0, `CSV parse failed: ${p}`);
  return parsed;
};
const teamKey = (value) => {
  const canonical = normalizeTeam(value);
  assert.ok(canonical, `Unknown team: ${value}`);
  const abbreviation = getTeamAbbreviation(canonical);
  return abbreviation === 'LAR' ? 'LA' : abbreviation === 'WSH' ? 'WAS' : abbreviation;
};
const now = new Date().toISOString();
fs.mkdirSync(`${work}/backups`, { recursive: true });
assert.ok(!fs.existsSync(`${work}/refresh-manifest.json`), 'Refresh already has a manifest; inspect it before repeating.');
const generatedDir = 'data/generated/team-profiles';
const existingOutputs = fs.readdirSync(generatedDir)
  .filter((name) => name.endsWith('.json') && name.includes('2026'))
  .map((name) => `${generatedDir}/${name}`);
const baseline = Object.fromEntries([gamesPath, teamPath, ...existingOutputs].map((p) => [p, hash(p)]));
for (const [p, digest] of Object.entries(baseline)) {
  const backup = `${work}/backups/${p.replaceAll('/', '__')}`;
  if (!fs.existsSync(backup)) {
    fs.copyFileSync(p, backup);
    assert.equal(hash(backup), digest);
  }
  baseline[p] = hash(backup);
}
const oldGames = readCsv(`${work}/backups/${gamesPath.replaceAll('/', '__')}`);
const oldTeamStats = readCsv(`${work}/backups/${teamPath.replaceAll('/', '__')}`);
const results = readCsv(resultPath).data;
const espnTeams = readCsv(espnTeamPath).data;
const provider = readCsv(providerPath).data;
assert.equal(results.length, 14);
assert.equal(espnTeams.length, 28);
assert.ok(results.every((r) => Number(r.week) === 7 && r.status === 'FINAL'));
const provider2026 = provider.filter((r) => Number(r.season) === 2026 && r.season_type === 'REG' && Number(r.week) <= 7);
assert.equal(provider2026.length, 214);
assert.equal(provider2026.filter((r) => Number(r.week) === 7).length, 28);
const providerKeys = new Set(provider2026.map((r) => `${r.game_id}|${teamKey(r.team)}`));
assert.equal(providerKeys.size, 214);
const additions = [];
const teamChecks = [];
for (const r of results) {
  const boxPath = r.boxscore_file.replaceAll('\\', '/');
  const box = JSON.parse(fs.readFileSync(boxPath, 'utf8'));
  const comp = box.header?.competitions?.[0];
  assert.equal(String(box.header.id), String(r.event_id));
  assert.equal(Number(box.header.week?.number ?? box.header.week), 7);
  assert.equal(comp.status.type.completed, true);
  for (const side of ['away', 'home']) {
    const competitor = comp.competitors.find((c) => c.homeAway === side);
    assert.equal(teamKey(competitor.team.abbreviation), teamKey(r[side]));
    assert.equal(Number(competitor.score), Number(r[`${side}_score`]));
  }
  const away = teamKey(r.away);
  const home = teamKey(r.home);
  const gameId = `2026_07_${away}_${home}`;
  const sides = provider2026.filter((p) => p.game_id === gameId);
  assert.equal(sides.length, 2, `Provider matchup missing: ${gameId}`);
  assert.ok(sides.some((p) => teamKey(p.team) === away && teamKey(p.opponent_team) === home));
  assert.ok(sides.some((p) => teamKey(p.team) === home && teamKey(p.opponent_team) === away));
  const kickoff = new Date(r.kickoff_utc);
  const gameday = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(kickoff);
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'long' }).format(kickoff);
  const gametime = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(kickoff);
  const row = Object.fromEntries(oldGames.meta.fields.map((field) => [field, '']));
  Object.assign(row, { game_id: gameId, season: '2026', game_type: 'REG', week: '7', gameday, weekday, gametime, away_team: away, away_score: r.away_score, home_team: home, home_score: r.home_score, location: 'Home', result: String(Number(r.home_score) - Number(r.away_score)), total: String(Number(r.home_score) + Number(r.away_score)), espn: r.event_id, source_provider: 'ESPN saved final summary', source_artifact: boxPath, source_updated_at: r.snapshot_updated_at });
  additions.push(row);
  for (const p of sides) {
    const e = espnTeams.find((e) => String(e.event_id) === String(r.event_id) && teamKey(e.team) === teamKey(p.team));
    assert.ok(e);
    const attempts = Number(e.completionAttempts.split('/')[1]);
    assert.equal(Number(p.attempts), attempts, `Attempt mismatch: ${gameId} ${p.team}`);
    assert.equal(Number(p.carries), Number(e.rushingAttempts), `Carry mismatch: ${gameId} ${p.team}`);
    assert.equal(Number(p.passing_yards) + Number(p.sack_yards_lost) + Number(p.rushing_yards), Number(e.totalYards), `Yard mismatch: ${gameId} ${p.team}`);
    teamChecks.push({ game_id: gameId, team: p.team, espn_event_id: r.event_id, attempts, yards: Number(e.totalYards), status: 'pass' });
  }
}
const priorCurrentGames = oldGames.data.filter((r) => Number(r.season) === 2026 && r.game_type === 'REG' && Number(r.week) <= 6);
assert.equal(priorCurrentGames.length, 93);
const mergedGames = [...oldGames.data.filter((r) => !(Number(r.season) === 2026 && Number(r.week) === 7)), ...additions];
const currentGames = mergedGames.filter((r) => Number(r.season) === 2026 && r.game_type === 'REG');
assert.equal(currentGames.length, 107);
assert.equal(new Set(currentGames.map((r) => r.game_id)).size, 107);
assert.equal(new Set(currentGames.flatMap((r) => [teamKey(r.home_team), teamKey(r.away_team)])).size, 32);
const mergedTeamStats = [...oldTeamStats.data.filter((r) => Number(r.season) !== 2026), ...provider2026];
const fields = [...oldGames.meta.fields, 'source_provider', 'source_artifact', 'source_updated_at'].filter((v, i, a) => a.indexOf(v) === i);
const newGamesText = Papa.unparse(mergedGames, { columns: fields, newline: '\n' }) + '\n';
const newTeamText = Papa.unparse(mergedTeamStats, { columns: oldTeamStats.meta.fields, newline: '\n' }) + '\n';
for (const [p, text] of [[gamesPath, newGamesText], [teamPath, newTeamText]]) {
  const intended = crypto.createHash('sha256').update(text).digest('hex');
  assert.ok(hash(p) === baseline[p] || hash(p) === intended, `Concurrent modification: ${p}`);
}
fs.writeFileSync(gamesPath, newGamesText);
fs.writeFileSync(teamPath, newTeamText);
const manifest = { generated_at: now, season: 2026, through_week: 7, inputs: Object.fromEntries([resultPath, espnTeamPath, providerPath].map((p) => [p, hash(p)])), baseline, games: { completed: 107, week7: 14, teams: 32, provenance: 'Prior93preserved;14savedESPNfinals added with source columns' }, team_stats: { current_season_rows: 214, week7: 28, provenance: 'Exact provider team-week rows; historical seasons preserved', ordinary_boxscores_used_for_epa_or_cpoe: false }, cross_checks: teamChecks, missing_game_columns: ['Week7coach,closingodds,rest,weather andstadiumfields are deliberatelyblank; these were not supplied by result exports.'], builders: [] };
for (const [script, args] of [
  ['build-power-ratings.js', ['--season', '2026']],
  ['build-team-analytics-snapshots.js', ['--season', '2026', '--week', '7']],
  ['build-coaching-tendency-snapshots.js', ['--season', '2026', '--week', '7']],
  ['build-regression-signals.js', ['--season', '2026', '--week', '7']],
]) {
  const result = spawnSync(process.execPath, [`scripts/${script}`, ...args, '--snapshot-at', now], { cwd: root, encoding: 'utf8', timeout: 120000 });
  manifest.builders.push({ script, exit_code: result.status, output: result.stdout, error: result.stderr });
  assert.equal(result.status, 0, `${script}: ${result.stderr}`);
}
const python = 'C:/Users/andre/AppData/Local/Python/pythoncore-3.14-64/python.exe';
// The complete saved team-game reports drive standings. Ignore malformed older
// cache references only in this isolated wrapper; never modify those raw files.
const standingsWrapper = `import glob,json,runpy,sys\noriginal=glob.glob\nskipped=[]\ndef valid_references(pattern):\n result=[]\n for f in original(pattern):\n  try:\n   with open(f,encoding='utf-8') as h: json.load(h)\n   result.append(f)\n  except (ValueError,OSError) as e: skipped.append({'path':f,'error':str(e)})\n return result\nglob.glob=valid_references\nsys.argv=['scripts/build-team-standings.py','--season','2026','--week','7']\nrunpy.run_path('scripts/build-team-standings.py',run_name='__main__')\nwith open('${work}/standings-skipped-references.json','w',encoding='utf-8') as h: json.dump(skipped,h,indent=2)\n`;
fs.writeFileSync(`${work}/run-standings.py`, standingsWrapper);
const standings = spawnSync(python, [`${work}/run-standings.py`], { cwd: root, encoding: 'utf8', timeout: 120000 });
manifest.builders.push({ script: 'build-team-standings.py', exit_code: standings.status, output: standings.stdout, error: standings.stderr });
assert.equal(standings.status, 0, standings.stderr);
manifest.outputs = {};
for (const file of ['team-power-ratings-2026.json', 'team-analytic-snapshots-2026-w7.json', 'team-coaching-tendency-snapshots-2026-w7.json', 'team-regression-snapshots-2026-w7.json', 'team-standings-2026-w07.json']) {
  const p = `${generatedDir}/${file}`;
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  assert.equal(j.rows.length, 32, `Expected32teams: ${p}`);
  j.meta.input_reconciliation = { manifest: `${work}/refresh-manifest.json`, completed_games: 107, through_week: 7, results_source: resultPath, team_statistics_source: providerPath };
  if (file.includes('coaching')) j.meta.week7_limitations = 'Week 7 closing-line and coach fields are missing in the ESPN result bridge; ATS counts exclude Week 7 and coach names remain last known from earlier input rows.';
  if (file.includes('analytic')) j.meta.feature_quality = 'Current-season EPA/CPOE uses exact provider team-week data. FTN play-charting rates are not refreshed by the Stats IQ browser exports; inspect per-row raw.ftn_charting coverage. Missing play-level/charting features remain null.';
  if (file.includes('power')) for (const row of j.rows) row.attribution_note = row.attribution_note.replace('prior-season results', '2026 current-season results through Week 7');
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  manifest.outputs[p] = { sha256: hash(p), rows: j.rows.length, week: j.meta.week ?? j.meta.through_week ?? 7 };
}
manifest.skipped_standings_references = JSON.parse(fs.readFileSync(`${work}/standings-skipped-references.json`, 'utf8'));
fs.writeFileSync(`${work}/refresh-manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ completed_games: 107, team_rows: 214, week7_cross_checks: teamChecks.length, outputs: manifest.outputs }, null, 2));
