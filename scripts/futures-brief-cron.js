#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const checkpointArg = (() => {
  const i = argv.indexOf('--checkpoint-hours');
  return i >= 0 ? ['--checkpoint-hours', argv[i + 1]] : [];
})();

function run(label, script, args = []) {
  console.log(`\n${label}`);
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}`);
  }
}

try {
  run('Updating futures CLV checkpoints', 'scripts/update-futures-clv-from-snapshots.js', [
    ...checkpointArg,
    ...(dryRun ? ['--dry-run'] : []),
  ]);
  run('Sending NFL daily brief', 'agents/nfl-daily-brief.js', [
    ...(dryRun ? ['--dry-run'] : []),
  ]);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

