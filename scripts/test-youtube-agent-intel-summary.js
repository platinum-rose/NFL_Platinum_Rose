#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const SUMMARY_PATH = path.join(ROOT, 'data', 'shadow-harness', 'review', 'youtube-futures-agent-intel-summary.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

execFileSync(process.execPath, ['scripts/build-youtube-futures-agent-intel-summary.js'], {
  cwd: ROOT,
  stdio: 'inherit'
});

const summary = readJson(SUMMARY_PATH);
assert(summary.status === 'local_agent_intel_summary_only', 'summary status should remain local-only');
assert(summary.exported_items === 45, `expected 45 promoted items; got ${summary.exported_items}`);
assert(summary.rejected_leak_checks.det_division_winner_plus_1500 === 0, 'bad Lions row leaked through rejection check');
assert(!summary.items.some(item => item.team === 'DET' && item.market === 'division_winner' && Number(item.price) === 1500), 'bad Lions item present in summary items');
assert(summary.counts.by_lane.futures_pick === 45, 'expected 45 futures pick items');
assert(!summary.items.some(item => item.team === 'TEN' && item.market === 'win_total' && item.side === 'OVER'), 'fabricated TEN win-total item present in summary items');
assert(summary.items.some(item => item.team === 'DET' && item.market === 'division_winner' && Number(item.price) === 160), 'expected verified Lions division winner item');
assert(summary.by_team.some(group => group.team === 'LAC'), 'expected Chargers intel group');
assert(summary.by_market.some(group => group.market === 'division_winner'), 'expected division winner market group');

console.log('YouTube agent intel summary fixture passed.');
