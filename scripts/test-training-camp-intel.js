#!/usr/bin/env node

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTrainingCampIntel } from './training-camp-intel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FIXTURE_DIR = path.join(ROOT, 'tests', 'fixtures', 'training-camp-intel', 'manual');

function fail(failures, id, message) {
  failures.push(`${id}: ${message}`);
}

const tempRoot = await mkdtemp(path.join(tmpdir(), 'training-camp-intel-'));
try {
  const outDir = path.join(tempRoot, 'data');
  const reportDir = path.join(tempRoot, 'reports');
  const { snapshot, outputs } = await buildTrainingCampIntel({
    season: 2026,
    inputDir: FIXTURE_DIR,
    outDir,
    reportDir,
    date: '2026-08-02',
    generatedAt: '2026-08-02T20:00:00.000Z',
  });

  const failures = [];
  const teamKeys = Object.keys(snapshot.teams || {});
  if (snapshot.meta.team_count !== 32) fail(failures, 'team_count', `expected 32, got ${snapshot.meta.team_count}`);
  if (teamKeys.length !== 32) fail(failures, 'team_map', `expected 32 team entries, got ${teamKeys.length}`);
  for (const team of ['ARI', 'BUF', 'CIN', 'DET', 'GB']) {
    if (!snapshot.teams[team]) fail(failures, 'team_presence', `missing ${team}`);
  }
  if ((snapshot.teams.BUF?.items || []).length < 1) fail(failures, 'buf_items', 'expected Bills manual item');
  const billsPackersItem = snapshot.items.find((item) => item.source_url === 'https://example.com/bills-packers-camp');
  if (billsPackersItem?.team !== 'BUF' || !billsPackersItem?.related_teams?.includes('GB')) {
    fail(failures, 'shared_item_ownership', 'expected one Bills-primary item with Packers retained as related');
  }
  if ((snapshot.teams.CIN?.items || []).length < 1) fail(failures, 'cin_items', 'expected Bengals manual item');
  if ((snapshot.teams.DET?.items || []).length < 1) fail(failures, 'det_items', 'expected Lions structured JSON item');
  if ((snapshot.teams.ARI?.items || []).length !== 0) fail(failures, 'empty_team', 'expected Cardinals to appear with zero items');
  if (!snapshot.items.every((item) => item.source && item.captured_at && item.raw_excerpt && item.summary && item.betting_relevance)) {
    fail(failures, 'required_fields', 'one or more items missed source/captured/excerpt/summary/relevance');
  }
  if (!snapshot.items.some((item) => item.signal_type === 'depth_chart')) fail(failures, 'classification', 'expected a depth_chart signal');
  if (!snapshot.items.some((item) => item.signal_type === 'scheme')) fail(failures, 'classification', 'expected a scheme signal');
  if (!snapshot.items.some((item) => item.anchor_relevance.includes('Bills'))) fail(failures, 'anchor', 'expected Bills anchor relevance');
  if (!snapshot.items.some((item) => item.anchor_relevance.includes('Packers'))) fail(failures, 'anchor', 'expected Packers anchor relevance');
  if (snapshot.meta.team_identity_validation?.status !== 'pass') fail(failures, 'team_identity', 'expected passing team-identity validation');
  if (snapshot.meta.item_count !== snapshot.meta.unique_evidence_count) fail(failures, 'dedupe', 'expected aggregate item count to equal unique evidence count');
  for (const output of Object.values(outputs || {})) {
    if (!output) fail(failures, 'outputs', 'missing output path');
  }

  if (failures.length) {
    console.error(`Training camp intel fixture FAILED (${failures.length})`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log('Training camp intel fixture passed.');
  console.log(`Coverage: ${snapshot.meta.team_count} teams, ${snapshot.meta.item_count} items.`);
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
