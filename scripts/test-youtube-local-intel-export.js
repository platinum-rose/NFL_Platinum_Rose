#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, 'data', 'shadow-harness', 'reports', 'youtube-futures-intel-review-latest.json');
const STATUS_PATH = path.join(ROOT, 'data', 'shadow-harness', 'review', 'youtube-futures-intel-review-status.json');
const TMP_DIR = path.join(ROOT, 'data', 'shadow-harness', 'tmp', 'youtube-local-intel-export-test');
const TEST_STATUS_PATH = path.join(TMP_DIR, 'status.json');
const TEST_REPORT_PATH = path.join(TMP_DIR, 'report.json');
const TEST_QUEUE_PATH = path.join(TMP_DIR, 'queue.json');
const TEST_MD_PATH = path.join(TMP_DIR, 'queue.md');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

execFileSync(process.execPath, ['scripts/build-youtube-futures-intel-review.js'], {
  cwd: ROOT,
  stdio: 'inherit'
});

const realStatus = readJson(STATUS_PATH);
const realReport = readJson(REPORT_PATH);
const firstClean = realStatus.items.find(item => item.review_flags.length === 0);
assert(firstClean, 'expected at least one clean review item to promote in fixture');
const firstCleanPick = realReport.picks.find(item => item.item_id === firstClean.item_id);
assert(firstCleanPick, 'expected clean status item to exist in report picks');

const forbiddenPick = {
  ...firstCleanPick,
  item_id: 'forbidden_youtube_b9_fixture_pick',
  episode_id: 'youtube-b9NL40Zogkw',
  episode_title: 'Forbidden QB List Fixture',
  video_url: 'https://www.youtube.com/watch?v=b9NL40Zogkw',
};
writeJson(TEST_REPORT_PATH, {
  ...realReport,
  picks: [...(realReport.picks || []), forbiddenPick],
});

const testStatus = {
  ...realStatus,
  generated_at: new Date().toISOString(),
  items: [
    ...realStatus.items.map(item => ({
      ...item,
      status: item.item_id === firstClean.item_id ? 'promote_to_local_intel' : 'pending_review',
      reviewer_notes: item.item_id === firstClean.item_id ? 'fixture promotion only' : item.reviewer_notes
    })),
    {
      item_id: forbiddenPick.item_id,
      item_type: 'pick',
      status: 'promote_to_local_intel',
      episode_id: forbiddenPick.episode_id,
      team: forbiddenPick.team,
      market: forbiddenPick.market,
      review_flags: [],
      reviewer_notes: 'fixture forbidden promotion should not export',
    },
  ],
};
writeJson(TEST_STATUS_PATH, testStatus);

execFileSync(process.execPath, [
  'scripts/export-youtube-futures-local-intel.js',
  '--report-file', TEST_REPORT_PATH,
  '--status-file', TEST_STATUS_PATH,
  '--out', TEST_QUEUE_PATH,
  '--markdown-out', TEST_MD_PATH
], {
  cwd: ROOT,
  stdio: 'inherit'
});

const exported = readJson(TEST_QUEUE_PATH);
assert(exported.exported_items === 1, `expected exactly one exported item; got ${exported.exported_items}`);
assert(exported.cohort.item_count === 1, 'queue should report the accepted cohort size');
assert(exported.cohort.forbidden_episode_evidence_absent === true, 'queue cohort should be clean of forbidden episodes');
assert(exported.skipped_items === testStatus.items.length - 2, 'skipped count should exclude the two promoted fixture rows before forbidden filtering');
assert(exported.items.length === 1, 'queue should contain exactly one item');
assert(exported.items[0].item_id === firstClean.item_id, 'exported item should match the promoted status item');
assert(exported.items[0].reviewer_notes === 'fixture promotion only', 'reviewer notes should flow through to export');
assert(!exported.items.some(item => item.status === 'pending_review'), 'pending items must not export');
assert(!JSON.stringify(exported.items).includes('youtube-b9NL40Zogkw'), 'forbidden episode item must not export');
assert(fs.existsSync(TEST_MD_PATH), 'markdown export should be written');

console.log('YouTube local intel export fixture passed.');
