#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const EXPECTED_PATH = path.join(ROOT, 'data', 'shadow-harness', 'fixtures', 'youtube-futures-intel-review-expected.json');
const REPORT_PATH = path.join(ROOT, 'data', 'shadow-harness', 'reports', 'youtube-futures-intel-review-latest.json');
const STATUS_PATH = path.join(ROOT, 'data', 'shadow-harness', 'review', 'youtube-futures-intel-review-status.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertObjectEquals(actual, expected, label) {
  const normalize = obj => Object.fromEntries(Object.entries(obj || {}).sort(([a], [b]) => a.localeCompare(b)));
  const actualJson = JSON.stringify(normalize(actual));
  const expectedJson = JSON.stringify(normalize(expected));
  assert(actualJson === expectedJson, `${label} mismatch. Expected ${expectedJson}; got ${actualJson}`);
}

execFileSync(process.execPath, ['scripts/build-youtube-futures-intel-review.js'], {
  cwd: ROOT,
  stdio: 'inherit'
});

const expected = readJson(EXPECTED_PATH);
const report = readJson(REPORT_PATH);
const status = readJson(STATUS_PATH);

assert(report.futures_candidates === expected.futures_candidates, 'futures candidate count drifted');
assert(report.observed_episodes === expected.observed_episodes, 'observed episode count drifted');
assert(report.missing_observations === expected.missing_observations, 'missing observation count drifted');
assert(report.total_extracted_picks === expected.total_extracted_picks, 'extracted pick count drifted');
assertObjectEquals(report.item_lane_counts, expected.item_lane_counts, 'item lane counts');
assertObjectEquals(report.review_flag_counts, expected.review_flag_counts, 'review flag counts');

for (const needle of expected.must_include) {
  if (needle.extracted_pick_count !== undefined) {
    const episode = report.episodes.find(item => item.id === needle.episode_id);
    assert(episode, `missing expected episode ${needle.episode_id}`);
    assert(
      episode.extracted_pick_count === needle.extracted_pick_count,
      `episode ${needle.episode_id} expected ${needle.extracted_pick_count} picks; got ${episode.extracted_pick_count}`
    );
    continue;
  }

  const pick = report.picks.find(item => Object.entries(needle).every(([key, value]) => item[key] === value));
  assert(pick, `missing expected pick shape ${JSON.stringify(needle)}`);
}

assert(status.items.length === report.picks.length, 'review status item count must match report pick count');
assert(status.allowed_statuses.includes('promote_to_local_intel'), 'status ledger must support local intel promotion');
assert(status.allowed_statuses.includes('reject'), 'status ledger must support rejection');

const lionsDivision = report.picks.find(item => (
  item.episode_id === 'youtube-4OxpAX6UJlM'
  && item.team === 'DET'
  && item.market === 'division_winner'
  && item.price === 1500
));
assert(lionsDivision, 'expected suspicious Lions division winner extraction to remain visible');
assert(lionsDivision.review_flags.includes('price_not_in_quote'), 'Lions division price should be flagged as unsupported by quote');
assert(lionsDivision.review_flags.includes('suspicious_price_shape'), 'Lions division price should be flagged as suspicious shape');
const lionsStatus = status.items.find(item => item.item_id === lionsDivision.item_id);
assert(
  lionsStatus?.status === 'needs_review' || lionsStatus?.status === 'reject',
  'Lions suspicious price should remain blocked from promotion'
);

console.log('YouTube futures intel review fixture passed.');
