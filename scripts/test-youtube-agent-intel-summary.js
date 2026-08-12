#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const SUMMARY_PATH = path.join(ROOT, 'data', 'shadow-harness', 'review', 'youtube-futures-agent-intel-summary.json');
const QUEUE_PATH = path.join(ROOT, 'data', 'shadow-harness', 'review', 'youtube-futures-local-intel-queue.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

execFileSync(process.execPath, ['scripts/export-youtube-futures-local-intel.js'], {
  cwd: ROOT,
  stdio: 'inherit'
});

execFileSync(process.execPath, ['scripts/build-youtube-futures-agent-intel-summary.js'], {
  cwd: ROOT,
  stdio: 'inherit'
});

const summary = readJson(SUMMARY_PATH);
const queue = readJson(QUEUE_PATH);
assert(summary.status === 'local_agent_intel_summary_only', 'summary status should remain local-only');
assert(summary.exported_items === queue.exported_items, `expected ${queue.exported_items} promoted items; got ${summary.exported_items}`);
assert(summary.cohort?.schema === 'youtube_reviewed_local_intel_cohort_v1', 'summary must report reviewed cohort schema');
assert(summary.cohort.item_count === queue.cohort.item_count, 'summary cohort size should match queue cohort size');
assert(summary.cohort.fingerprint_sha256 === queue.cohort.fingerprint_sha256, 'summary cohort fingerprint should match queue');
assert(summary.rejected_leak_checks.det_division_winner_plus_1500 === 0, 'bad Lions row leaked through rejection check');
assert(!summary.items.some(item => item.team === 'DET' && item.market === 'division_winner' && Number(item.price) === 1500), 'bad Lions item present in summary items');
assert(summary.counts.by_lane.futures_pick === queue.exported_items, 'futures pick count should match the promoted queue');
assert(!summary.items.some(item => item.source?.episode_id === 'b9NL40Zogkw'), 'reprocess-required QB-list episode leaked into agent summary');
assert(!summary.items.some(item => item.source?.episode_id === 'youtube-b9NL40Zogkw'), 'forbidden b9NL40Zogkw episode leaked into agent summary');
assert(!summary.items.some(item => item.source?.episode_id === 'youtube-qoCm4G2Jmng'), 'forbidden qoCm4G2Jmng episode leaked into agent summary');
assert(!summary.items.some(item => item.team === 'TEN' && item.market === 'win_total' && item.side === 'OVER'), 'fabricated TEN win-total item present in summary items');
assert(summary.items.some(item => item.team === 'DET' && item.market === 'division_winner' && Number(item.price) === 160), 'expected verified Lions division winner item');
assert(summary.by_team.some(group => group.team === 'LAC'), 'expected Chargers intel group');
assert(summary.by_market.some(group => group.market === 'division_winner'), 'expected division winner market group');

console.log('YouTube agent intel summary fixture passed.');
