#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { validateYoutubeArtifacts } from './lib/futures-evidence-gates.js';

const ROOT = process.cwd();
const REVIEW_PATH = path.join(ROOT, 'data', 'shadow-harness', 'reports', 'youtube-futures-intel-review-latest.json');
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

const review = readJson(REVIEW_PATH);
const status = readJson(STATUS_PATH);
const queue = readJson(QUEUE_PATH);
const summary = readJson(SUMMARY_PATH);
const freshness = readJson(FRESHNESS_PATH);

const validation = validateYoutubeArtifacts({
  reviewReport: review,
  status,
  queue,
  summary,
  freshness,
});
assert(validation.status === 'pass', `YouTube cohort validation blocked: ${validation.blockers.join('; ')}`);

const fingerprints = new Set([
  fingerprint(status.accepted_cohort, 'status accepted cohort'),
  fingerprint(queue.cohort, 'queue cohort'),
  fingerprint(summary.cohort, 'summary cohort'),
  fingerprint(freshness.youtube?.accepted?.cohort, 'freshness accepted cohort'),
  fingerprint(review.accepted_cohort, 'review accepted cohort'),
]);
assert(fingerprints.size === 1, `expected one shared YouTube cohort fingerprint; got ${[...fingerprints].join(', ')}`);

for (const cohort of [
  status.accepted_cohort,
  queue.cohort,
  summary.cohort,
  freshness.youtube.accepted.cohort,
  review.accepted_cohort,
]) {
  assert(cohort.item_count === 43, `expected reviewed cohort size 43; got ${cohort.item_count}`);
  assert(cohort.forbidden_episode_evidence_absent === true, 'forbidden episode evidence must be absent from accepted cohort');
}

const acceptedText = JSON.stringify({
  promoted_status_items: (status.items || []).filter((item) => item.status === 'promote_to_local_intel'),
  queue_items: queue.items,
  queue_notes: queue.notes,
  summary_items: summary.items,
  summary_notes: summary.notes,
});
for (const forbidden of ['youtube-b9NL40Zogkw', 'youtube-qoCm4G2Jmng']) {
  assert(!acceptedText.includes(forbidden), `${forbidden} leaked into accepted synthesis inputs`);
}

console.log('YouTube cohort cleanup fixture passed without rewriting canonical artifacts.');
