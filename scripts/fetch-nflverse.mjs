#!/usr/bin/env node
// scripts/fetch-nflverse.mjs
// Downloads free nflverse season files used by the defensive props layer:
//   snap_counts_<season>.csv and play_by_play_<season>.csv.gz
// into data/nflverse/<season>/. Read-only public GitHub release assets; no keys.
// Usage: node scripts/fetch-nflverse.mjs [--season 2026]
import { mkdir, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const i = process.argv.indexOf('--season');
const season = i > -1 ? process.argv[i + 1] : '2026';
const BASE = 'https://github.com/nflverse/nflverse-data/releases/download';
const FILES = [
  { url: `${BASE}/snap_counts/snap_counts_${season}.csv`, name: `snap_counts_${season}.csv` },
  { url: `${BASE}/pbp/play_by_play_${season}.csv.gz`, name: `play_by_play_${season}.csv.gz` },
];

const dir = path.join(ROOT, 'data', 'nflverse', season);
await mkdir(dir, { recursive: true });
for (const f of FILES) {
  const out = path.join(dir, f.name);
  const tmp = `${out}.part`;
  // curl honors proxy settings and follows GitHub's redirect to the asset host.
  execFileSync('curl', ['-sSfL', '-m', '300', '-o', tmp, f.url], { stdio: 'inherit' });
  execFileSync(process.platform === 'win32' ? 'cmd' : 'mv', process.platform === 'win32' ? ['/c', 'move', '/y', tmp, out] : [tmp, out]);
  console.log(`${f.name}: ${(await stat(out)).size} bytes`);
}
