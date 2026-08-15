#!/usr/bin/env node
// scripts/reacquire-article-sources.js
//
// Re-fetches the 31 metadata_only + 181 suspected_ingest_cap article records
// identified in data/research-intel/review/article-intel-review-latest.json,
// now that agents/research-intel-ingest.js's BODY_MAX_CHARS root cause is
// fixed (was 4,000, now 20,000). See
// docs/FUTURES_ARTICLE_REACQUISITION_AND_GATES_DESIGN_2026-08-13.md §4 and
// scripts/lib/article-reacquisition.js for the pure logic this wraps.
//
// CANNOT be live-verified from this sandbox — confirmed no outbound network
// access here (same root cause as every other live-ingest agent in this
// repo, F-31). Run natively:
//
//   node scripts/reacquire-article-sources.js --dry-run
//   node scripts/reacquire-article-sources.js --limit 10 --out data/research-intel/reacquisition/article-reacquisition-2026-08-13-probe10.json
//   node scripts/reacquire-article-sources.js --resume --out data/research-intel/reacquisition/article-reacquisition-2026-08-13-full.json
//
// 2026-08-13 Codex review finding #7: added --resume/--out/--concurrency/
// --domain-limit/--timeout-ms/--retry/--summary-only and a JSONL progress
// file, so a full 212-record native run can be interrupted and resumed
// without re-fetching everything or silently hammering one slow domain.
//
// Output: a NEW versioned file (default data/research-intel/reacquisition/
// article-reacquisition-<date>.json, override with --out) — never overwrites
// article-intel-review-latest.json. Promoting recovered bodies back into
// research_intel_notes (a Supabase write) is a deliberately separate,
// explicitly-approved next step, not part of this script — see
// scripts/lib/article-reacquisition.js's promotion-review fields
// (promotion_status stays 'pending_review' for every record this writes).

import { mkdir, readFile, writeFile, appendFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildReacquiredRecord,
  detectCandidateSelections,
  selectReacquisitionTargets,
  summarizeReacquisitionRun,
} from './lib/article-reacquisition.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REVIEW_PATH = path.join(ROOT, 'data', 'research-intel', 'review', 'article-intel-review-latest.json');
const OUT_DIR = path.join(ROOT, 'data', 'research-intel', 'reacquisition');

const argv = process.argv.slice(2);
const getArg = (flag, fallback) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : fallback; };
const getAllArgs = (flag) => argv.reduce((acc, a, i) => { if (a === flag) acc.push(argv[i + 1]); return acc; }, []);

const DRY_RUN = argv.includes('--dry-run');
const RESUME = argv.includes('--resume');
const SUMMARY_ONLY = argv.includes('--summary-only');
const LIMIT = argv.includes('--limit') ? Number(getArg('--limit', '0')) : Infinity;
const FETCH_TIMEOUT_MS = Number(getArg('--timeout-ms', '8000'));
const RETRY_COUNT = Number(getArg('--retry', '0'));
const CONCURRENCY = Math.max(1, Number(getArg('--concurrency', '1')));
const DOMAIN_THROTTLE_MS = Number(getArg('--domain-throttle-ms', '1000'));
const BODY_MAX_CHARS = 20_000; // kept in sync with agents/research-intel-ingest.js's raised cap

const today = new Date().toISOString().slice(0, 10);
const OUT_PATH = (() => {
  const custom = getArg('--out', null);
  if (!custom) return path.join(OUT_DIR, `article-reacquisition-${today}.json`);
  return path.isAbsolute(custom) ? custom : path.join(ROOT, custom);
})();
const PROGRESS_PATH = getArg('--progress-file', `${OUT_PATH}.progress.jsonl`);

// --domain-limit example.com=5 --domain-limit rotoworld.com=10
const DOMAIN_LIMITS = new Map(getAllArgs('--domain-limit').map((pair) => {
  const [domain, n] = String(pair).split('=');
  return [domain.toLowerCase(), Number(n)];
}));

function hostnameOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return 'unknown';
  }
}

function sleep(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

async function fetchOne(url) {
  let lastError = null;
  for (let attempt = 0; attempt <= RETRY_COUNT; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PlatinumRoseBot/1.0)' },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!res.ok) return { ok: false, httpStatus: res.status };
      const html = await res.text();
      return { ok: true, rawHtml: html.slice(0, BODY_MAX_CHARS * 8) }; // generous pre-strip cap; stripHtmlToText applies the real one
    } catch (err) {
      lastError = err.name === 'TimeoutError' || err.name === 'AbortError' ? 'timeout' : err.message;
      if (attempt < RETRY_COUNT) await sleep(300 * (attempt + 1)); // small linear backoff
    }
  }
  return { ok: false, error: lastError };
}

async function loadResumeState() {
  if (!RESUME) return { doneIds: new Set(), priorRecords: [] };
  try {
    await access(PROGRESS_PATH);
  } catch {
    return { doneIds: new Set(), priorRecords: [] };
  }
  const raw = await readFile(PROGRESS_PATH, 'utf8');
  const priorRecords = raw.split('\n').filter(Boolean).map((line) => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);
  const doneIds = new Set(priorRecords.map((r) => r.id));
  return { doneIds, priorRecords };
}

// Simple fixed-size worker pool + per-domain throttle. Concurrency defaults
// to 1 (sequential) — this hits real third-party news sites (ESPN, PFF,
// NBC, Rotowire, VSiN, etc.), so the default must stay polite.
async function runPool(targets, worker) {
  const lastFetchAtByDomain = new Map();
  const domainCounts = new Map();
  let cursor = 0;
  const results = new Array(targets.length);

  async function next() {
    while (cursor < targets.length) {
      const i = cursor;
      cursor += 1;
      const target = targets[i];
      const domain = hostnameOf(target.url);

      const limit = DOMAIN_LIMITS.get(domain);
      const countSoFar = domainCounts.get(domain) || 0;
      if (limit != null && countSoFar >= limit) {
        results[i] = { skipped: true, target, reason: `domain_limit_reached (${domain} >= ${limit})` };
        continue;
      }
      domainCounts.set(domain, countSoFar + 1);

      const lastAt = lastFetchAtByDomain.get(domain) || 0;
      const waitMs = lastAt + DOMAIN_THROTTLE_MS - Date.now();
      if (waitMs > 0) await sleep(waitMs);
      lastFetchAtByDomain.set(domain, Date.now());

      results[i] = await worker(target, i);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, next));
  return results;
}

async function main() {
  const review = JSON.parse(await readFile(REVIEW_PATH, 'utf8'));
  const allTargets = selectReacquisitionTargets(review);
  const targets = Number.isFinite(LIMIT) ? allTargets.slice(0, LIMIT) : allTargets;

  console.log(`Article review: ${REVIEW_PATH}`);
  console.log(`Reacquisition targets: ${allTargets.length} (${review.summary?.body_evidence?.metadata_only ?? '?'} metadata-only + ${review.summary?.body_evidence?.suspected_ingest_cap ?? '?'} suspected-cap)`);
  if (targets.length !== allTargets.length) console.log(`Running against a --limit ${LIMIT} subset: ${targets.length} record(s).`);

  if (DRY_RUN) {
    console.log('\n--dry-run: listing targets only, no network calls made.\n');
    for (const t of targets) console.log(`  [${t.body_evidence_status}] id=${t.id} ${t.url}`);
    return;
  }

  const { doneIds, priorRecords } = await loadResumeState();
  if (RESUME && doneIds.size) {
    console.log(`--resume: ${doneIds.size} record(s) already completed in ${PROGRESS_PATH}, skipping those.`);
  }
  const remainingTargets = targets.filter((t) => !doneIds.has(t.id));

  await mkdir(OUT_DIR, { recursive: true });
  if (!RESUME || !doneIds.size) {
    // fresh progress file for a non-resumed (or first) run
    await writeFile(PROGRESS_PATH, '');
  }

  let completed = 0;
  const results = await runPool(remainingTargets, async (target) => {
    completed += 1;
    if (!SUMMARY_ONLY) process.stdout.write(`  (${completed}/${remainingTargets.length}) fetching id=${target.id} ${target.url} ... `);
    const outcome = await fetchOne(target.url);
    const record = buildReacquiredRecord(target, outcome);
    if (record.status === 'recovered') {
      record.candidate_selections = detectCandidateSelections(record.new_body);
    }
    await appendFile(PROGRESS_PATH, `${JSON.stringify(record)}\n`);
    if (!SUMMARY_ONLY) {
      console.log(record.status === 'recovered'
        ? `recovered (${record.new_body_chars} chars, ${record.candidate_selections.length} candidate selection(s))`
        : `unavailable (${record.reason})`);
    }
    return record;
  });

  const skipped = results.filter((r) => r?.skipped);
  const newRecords = results.filter((r) => r && !r.skipped);
  if (skipped.length) {
    console.log(`\n${skipped.length} target(s) skipped due to --domain-limit:`);
    for (const s of skipped) console.log(`  - id=${s.target.id} ${s.target.url} (${s.reason})`);
  }

  const records = [...priorRecords, ...newRecords];
  const summary = summarizeReacquisitionRun(records);
  await writeFile(OUT_PATH, JSON.stringify({
    schema: 'article_reacquisition_run_v1',
    generated_at: new Date().toISOString(),
    source_review: REVIEW_PATH,
    resumed_from_progress_file: RESUME ? PROGRESS_PATH : null,
    skipped_domain_limit_count: skipped.length,
    summary,
    records,
  }, null, 2));

  console.log(`\n✅ wrote ${OUT_PATH}`);
  console.log(`   progress file (safe to --resume from): ${PROGRESS_PATH}`);
  console.log(`   recovered: ${summary.recovered}, unavailable: ${summary.unavailable}, improved-over-previous: ${summary.improved}`);
  console.log('   NOTE: this is a local artifact only. Every record starts promotion_status=pending_review.');
  console.log('   Promoting recovered bodies into research_intel_notes (a Supabase write) is a separate,');
  console.log('   explicitly-approved step — not run by this script.');
}

main().catch((err) => {
  console.error('✖', err.message);
  process.exitCode = 1;
});
