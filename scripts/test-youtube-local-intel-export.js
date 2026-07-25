#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, 'data', 'shadow-harness', 'reports', 'youtube-futures-intel-review-latest.json');
const STATUS_PATH = path.join(ROOT, 'data', 'shadow-harness', 'review', 'youtube-futures-intel-review-status.json');
const TMP_DIR = path.join(ROOT, 'data', 'shadow-harness', 'tmp', 'youtube-local-intel-export-test');
const TEST_STATUS_PATH = path.join(TMP_DIR, 'status.json');
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
const firstClean = realStatus.items.find(item => item.review_flags.length === 0);
assert(firstClean, 'expected at least one clean review item to promote in fixture');

const testStatus = {
  ...realStatus,
  generated_at: new Date().toISOString(),
  items: realStatus.items.map(item => ({
    ...item,
    status: item.item_id === firstClean.item_id ? 'promote_to_local_intel' : 'pending_review',
    reviewer_notes: item.item_id === firstClean.item_id ? 'fixture promotion only' : item.reviewer_notes
  }))
};
writeJson(TEST_STATUS_PATH, testStatus);

execFileSync(process.execPath, [
  'scripts/export-youtube-futures-local-intel.js',
  '--report-file', REPORT_PATH,
  '--status-file', TEST_STATUS_PATH,
  '--out', TEST_QUEUE_PATH,
  '--markdown-out', TEST_MD_PATH
], {
  cwd: ROOT,
  stdio: 'inherit'
});

const exported = readJson(TEST_QUEUE_PATH);
assert(exported.exported_items === 1, `expected exactly one exported item; got ${exported.exported_items}`);
assert(exported.skipped_items === realStatus.items.length - 1, 'skipped count should exclude only the promoted item');
assert(exported.items.length === 1, 'queue should contain exactly one item');
assert(exported.items[0].item_id === firstClean.item_id, 'exported item should match the promoted status item');
assert(exported.items[0].reviewer_notes === 'fixture promotion only', 'reviewer notes should flow through to export');
assert(!exported.items.some(item => item.status === 'pending_review'), 'pending items must not export');
assert(fs.existsSync(TEST_MD_PATH), 'markdown export should be written');

console.log('YouTube local intel export fixture passed.');
