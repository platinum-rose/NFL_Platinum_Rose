#!/usr/bin/env node
// Node wrapper for the ROSTER GATE so agents without a working `python3` alias (e.g. Codex on Windows) can run it:
//   npm run roster:vet -- --week 3 --date 2026-09-26 [--strict] [--fetch]
//   npm run roster:fetch
//   npm run roster:test
// Finds Python via $PYTHON, python3, python, py -3, then known install paths. Passes all args through.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCRIPTS = { vet: 'roster_vet.py', fetch: 'fetch_espn_rosters.py', test: 'test_roster_vet.py', seeds: 'rebuild_matchup_seeds.py' };
const [which = 'vet', ...rest] = process.argv.slice(2);
const la = process.env.LOCALAPPDATA || '';
const cands = [
  process.env.PYTHON && [process.env.PYTHON], ['python3'], ['python'], ['py', '-3'],
  la && [path.join(la, 'Python', 'pythoncore-3.14-64', 'python.exe')], la && [path.join(la, 'Python', 'bin', 'python.exe')],
  ['C:\\Users\\andre\\AppData\\Local\\Python\\pythoncore-3.14-64\\python.exe'],
].filter(Boolean);
const py = cands.find(([cmd, ...pre]) => {
  const r = spawnSync(cmd, [...pre, '-c', 'import sys; print(sys.version_info[0])'], { encoding: 'utf8', timeout: 20000 });
  return r.status === 0 && String(r.stdout).trim() === '3';
});
if (!py) { console.error('No Python 3 found. Set PYTHON=<path to python.exe>.'); process.exit(2); }
if (!SCRIPTS[which]) { console.error(`usage: run-roster-vet.mjs <${Object.keys(SCRIPTS).join('|')}> [args]`); process.exit(2); }
const r = spawnSync(py[0], [...py.slice(1), path.join(ROOT, 'scripts', 'nfl-rosters', SCRIPTS[which]), ...rest],
  { cwd: ROOT, stdio: 'inherit', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
process.exit(r.status ?? 1);
