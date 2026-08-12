#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const TMP_DIR = path.join(ROOT, 'data', 'shadow-harness', 'tmp', 'youtube-cohort-cleanup-test');
const CONTEXT_PATH = path.join(TMP_DIR, 'frontier-synthesis-context-test.json');
const STATUS_PATH = path.join(ROOT, 'data', 'shadow-harness', 'review', 'youtube-futures-intel-review-status.json');
const QUEUE_PATH = path.join(ROOT, 'data', 'shadow-harness', 'review', 'youtube-futures-local-intel-queue.json');
const SUMMARY_PATH = path.join(ROOT, 'data', 'shadow-harness', 'review', 'youtube-futures-agent-intel-summary.json');
const FRESHNESS_PATH = path.join(ROOT, 'data', 'shadow-harness', 'review', 'podcast-youtube-freshness-latest.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function fingerprint(payload, pathLabel) {
  const value = payload?.fingerprint_sha256;
  assert(value && typeof value === 'string', `${pathLabel} missing cohort fingerprint`);
  return value;
}

execFileSync(process.execPath, ['scripts/build-youtube-futures-intel-review.js'], { cwd: ROOT, stdio: 'inherit' });
execFileSync(process.execPath, ['scripts/export-youtube-futures-local-intel.js'], { cwd: ROOT, stdio: 'inherit' });
execFileSync(process.execPath, ['scripts/build-youtube-futures-agent-intel-summary.js'], { cwd: ROOT, stdio: 'inherit' });
execFileSync(process.execPath, [
  'scripts/build-podcast-youtube-freshness-reconciliation.js',
  '--generated-at',
  '2026-08-11T12:00:00.000Z',
], { cwd: ROOT, stdio: 'inherit' });
execFileSync(process.execPath, [
  'scripts/build-futures-synthesis-context.js',
  '--out',
  CONTEXT_PATH,
], { cwd: ROOT, stdio: 'inherit' });

const status = readJson(STATUS_PATH);
const queue = readJson(QUEUE_PATH);
const summary = readJson(SUMMARY_PATH);
const freshness = readJson(FRESHNESS_PATH);
const context = readJson(CONTEXT_PATH);

const fingerprints = new Set([
  fingerprint(status.accepted_cohort, 'status accepted cohort'),
  fingerprint(queue.cohort, 'queue cohort'),
  fingerprint(summary.cohort, 'summary cohort'),
  fingerprint(freshness.youtube?.accepted?.cohort, 'freshness accepted cohort'),
  fingerprint(context.reviewed_media?.accepted_summary?.cohort, 'synthesis context accepted cohort'),
]);
assert(fingerprints.size === 1, `expected one shared YouTube cohort fingerprint; got ${[...fingerprints].join(', ')}`);

for (const cohort of [
  status.accepted_cohort,
  queue.cohort,
  summary.cohort,
  freshness.youtube.accepted.cohort,
  context.reviewed_media.accepted_summary.cohort,
]) {
  assert(cohort.item_count === 43, `expected reviewed cohort size 43; got ${cohort.item_count}`);
  assert(cohort.forbidden_episode_evidence_absent === true, 'forbidden episode evidence must be absent from accepted cohort');
}

const contextText = fs.readFileSync(CONTEXT_PATH, 'utf8');
for (const forbidden of ['youtube-b9NL40Zogkw', 'youtube-qoCm4G2Jmng']) {
  assert(!contextText.includes(forbidden), `${forbidden} leaked into synthesis context`);
}

console.log('YouTube cohort cleanup fixture passed.');
