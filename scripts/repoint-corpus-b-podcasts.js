#!/usr/bin/env node
// scripts/repoint-corpus-b-podcasts.js
// ════════════════════════════════════════════════════════════════
// DATA-LAYER-LOCKDOWN item 1 (docs/specs/CANONICAL_DATA_LAYER_AUDIT_2026-08-30.md
// §3b / §7 / TASK_BOARD.md DATA-LAYER-LOCKDOWN row).
//
// Re-points Corpus B's exhaustive podcast extraction
// (scratch/*_master_100percent_exhaustive.md) into Corpus A's canonical
// table (podcast_host_summaries), matched by shared episode identity --
// NOT a fuzzy dedup, NOT a conflict-resolution policy between two opinions.
//
// Per the audit (§3b), the match key is real: both data/podcasts/m6-diarized/
// and data/podcasts/m6-diarized-all/ contain identical diarized-transcript
// filenames, confirmed by direct comparison (54/54 shared files, identical
// episode_id in both manifests). A master report's own "Episode ID:" header
// is trusted ONLY after being verified against m6-diarized-all/manifest.json
// -- some master reports (article/topical roundups) carry a fabricated or
// non-transcript "Episode ID" that does not correspond to any real episode.
// This script checks the manifest before treating a match as real.
//
// SCOPE GUARD: podcast_host_summaries.futures is FUTURES-ONLY (season-long
// outcome bets), per podcast-host-summary.js's own NFL_ONLY_GUARD. Corpus B's
// master reports mix weekly game bets, teaser strategy, betting theory, and
// fantasy-draft ADP content in with real futures. Only rows categorized
// explicit_recommendation / conditional_watchlist / pass_fade, on a
// season-long market (not a single game), are eligible -- weekly_bet,
// market_context, and draft_contest_only rows are excluded by design, not
// oversight. Forcing those into the futures table would corrupt Layer 3's
// input, which is exactly what this whole audit was about preventing.
//
// Default is a dry run (report-only, no writes). Writes require --write AND
// (for now) an explicit --episode <uuid> allowlist -- this script does NOT
// blanket-write every eligible episode automatically, because "eligible episode
// already has existing podcast_host_summaries rows" is a real judgment call
// (upgrade vs. leave alone) that this session flagged for Andy rather than
// resolved unilaterally. See the printed report's UPGRADE CANDIDATE section.
//
// Usage:
//   node scripts/repoint-corpus-b-podcasts.js                 # dry run, all candidates
//   node scripts/repoint-corpus-b-podcasts.js --write --episode c3687b92-9964-4f38-83ee-b986cb1951a2
// ════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCRATCH_DIR = path.resolve(ROOT, 'scratch');
const MANIFEST_PATH = path.resolve(ROOT, 'data/podcasts/m6-diarized-all/manifest.json');

const argv = process.argv.slice(2);
const WRITE = argv.includes('--write');
const EPISODE_ALLOWLIST = new Set(
  argv.flatMap((a, i) => (a === '--episode' && argv[i + 1] ? [argv[i + 1]] : []))
);

const MODEL_TAG = 'antigravity-master-100pct';
const ATTRIBUTION_METHOD = 'antigravity_master_extraction';

const ELIGIBLE_CATEGORIES = new Set(['explicit_recommendation', 'conditional_watchlist', 'pass_fade']);
const EXCLUDED_CATEGORIES = new Set(['weekly_bet', 'market_context', 'draft_contest_only']);

const SINGLE_GAME_RE = /\bvs\.?\b|\(week\s*\d+\)|\bweek\s*\d+\b/i;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ─── Parsing ─────────────────────────────────────────────────────────────

function splitRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

function stripMd(s) {
  return String(s ?? '').replace(/\*\*/g, '').trim();
}

function extractEpisodeId(text) {
  const m = /Episode ID:\*{0,2}\s*`?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})`?/i.exec(text);
  return m ? m[1] : null;
}

function extractTable(text) {
  const secMatch = /^## 1\.[^\n]*\n/m.exec(text);
  if (!secMatch) return [];
  const rest = text.slice(secMatch.index + secMatch[0].length);
  const nextSec = rest.search(/^## \d+\./m);
  const body = nextSec >= 0 ? rest.slice(0, nextSec) : rest;
  const lines = body.split('\n').filter((l) => l.trim().startsWith('|'));
  if (lines.length < 2) return [];
  const header = splitRow(lines[0]).map((h) => h.toLowerCase());
  const rows = [];
  for (const line of lines.slice(1)) {
    if (/^-+$/.test(line.replace(/[|\s]/g, ''))) continue; // separator row
    const cells = splitRow(line);
    if (cells.length < header.length) continue;
    const row = {};
    header.forEach((h, i) => { row[h] = stripMd(cells[i]); });
    rows.push(row);
  }
  return rows;
}

// Map an "Expert" cell (possibly multiple names joined by " / ") to a list
// of individual host names, stripping parenthetical nicknames like "(DBro)".
function splitExperts(cell) {
  return String(cell || '')
    .split('/')
    .map((s) => s.replace(/\([^)]*\)/g, '').trim())
    .filter(Boolean);
}

function inferLean(selection, category) {
  const s = selection.toUpperCase();
  if (category === 'pass_fade') return 'against';
  if (/\bOVER\b/.test(s)) return 'over';
  if (/\bUNDER\b/.test(s)) return 'under';
  if (/\bFADE\b/.test(s)) return 'against';
  return 'favor';
}

function inferConfidence(confidenceCell) {
  const s = confidenceCell.toLowerCase();
  if (s.includes('high')) return 70;
  if (s.includes('medium')) return 50;
  if (s.includes('low') || s.includes('longshot') || s.includes('secondary')) return 35;
  return 50;
}

// Best-effort market-taxonomy normalization, matched loosely against the
// conventions already live in podcast_host_summaries (AFC_X/NFC_X, X_Win_Total,
// X_Playoffs, X_One_Seed, MVP, Super_Bowl, Win_Total). Not guaranteed to match
// an exact existing token -- flagged in the report for a human glance, not
// silently trusted.
function inferSubjectMarket(entityMarket, selection) {
  const em = `${entityMarket} ${selection}`;
  const divMatch = /\b(AFC|NFC)\s*(East|West|North|South)?\b/i.exec(em);
  const winTotal = /win total|wins\b|\bover\b.*wins|\bunder\b.*wins/i.test(em);
  const oneSeed = /no\.?\s*1 seed|one seed|#1 seed/i.test(em);
  const playoffs = /make.*playoffs|playoff appearance|miss.*playoff/i.test(em);
  const superBowl = /super bowl/i.test(em);
  const mvp = /\bmvp\b/i.test(em);
  const roy = /rookie of the year|\broy\b/i.test(em);

  if (superBowl) return 'Super_Bowl';
  if (mvp) return 'MVP';
  if (roy) return /offensive/i.test(em) ? 'Offensive_ROY' : /defensive/i.test(em) ? 'Defensive_ROY' : 'ROY';
  if (divMatch) {
    const conf = divMatch[1].toUpperCase();
    const div = divMatch[2] ? `_${divMatch[2][0].toUpperCase()}${divMatch[2].slice(1).toLowerCase()}` : '';
    if (oneSeed) return `${conf}_One_Seed`;
    if (playoffs) return `${conf}${div}_Playoffs`;
    if (winTotal) return `${conf}${div}_Win_Total`;
    return `${conf}${div}`;
  }
  if (playoffs) return 'Playoffs';
  if (winTotal) return 'Win_Total';
  return 'Other';
}

function subjectFromEntity(entityMarket) {
  // Strip trailing "(Season Long)" / "Win Total" / "(Week N)" qualifiers to
  // leave a clean subject (team/player) name.
  return entityMarket
    .replace(/\(season long\)/i, '')
    .replace(/win total/i, '')
    .replace(/\(week\s*\d+\)/i, '')
    .trim()
    .replace(/\s{2,}/g, ' ');
}

function rowToFutures(row) {
  const category = (row.category || '').toLowerCase();
  if (!ELIGIBLE_CATEGORIES.has(category)) return { skip: true, reason: `category=${category || '(none)'}` };
  const entityMarket = row['entity / market'] || '';
  if (SINGLE_GAME_RE.test(entityMarket)) return { skip: true, reason: 'single-game reference' };

  const selection = row['selection / line'] || '';
  const rationale = row['source timecode & rationale summary'] || '';
  const experts = splitExperts(row.expert || '');
  if (!experts.length) return { skip: true, reason: 'no expert attributed' };

  const lean = inferLean(selection, category);
  const confidence = inferConfidence(row['actionable confidence / unit'] || '');
  const subject_market = inferSubjectMarket(entityMarket, selection);
  const subject = subjectFromEntity(entityMarket);
  const quote = rationale.replace(/^\[[\d:\s-]+\]\s*/, '').trim();

  return {
    skip: false,
    perHost: experts.map((host) => ({
      host,
      lean,
      quote,
      subject,
      confidence,
      prediction: selection,
      stats_cited: [],
      subject_market,
    })),
  };
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  const manifestIds = new Set(manifest.map((m) => m.episode_id));

  const files = (await readdir(SCRATCH_DIR)).filter((f) => f.endsWith('_master_100percent_exhaustive.md'));

  const candidates = [];
  for (const f of files) {
    const full = path.join(SCRATCH_DIR, f);
    const text = await readFile(full, 'utf8');
    const episodeId = extractEpisodeId(text);
    if (!episodeId) continue; // article/topical report, no episode claim at all
    candidates.push({ file: f, episodeId, verified: manifestIds.has(episodeId), text });
  }

  console.log(`Scanned ${files.length} master reports; ${candidates.length} carry an "Episode ID:" field.`);
  const unverified = candidates.filter((c) => !c.verified);
  console.log(`  ${candidates.length - unverified.length} verified against m6-diarized-all/manifest.json (real transcript identity).`);
  if (unverified.length) {
    console.log(`  ${unverified.length} carry an Episode ID NOT in the manifest -- excluded, not guessed at:`);
    for (const c of unverified) console.log(`    - ${c.file} (${c.episodeId})`);
  }

  const verified = candidates.filter((c) => c.verified);

  let supabase = null;
  const existingByEpisode = new Map();
  if (SUPABASE_URL && SUPABASE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const ids = verified.map((c) => c.episodeId);
    const { data, error } = await supabase.from('podcast_host_summaries').select('episode_id,host,model,futures').in('episode_id', ids);
    if (error) { console.error(`  ⚠ could not load existing rows: ${error.message}`); }
    else for (const r of data) {
      if (!existingByEpisode.has(r.episode_id)) existingByEpisode.set(r.episode_id, []);
      existingByEpisode.get(r.episode_id).push(r);
    }
  } else {
    console.log('  ⚠ no Supabase credentials; existing-row comparison skipped.');
  }

  console.log(`\n=== Per-episode eligibility ===`);
  const toWrite = []; // { episodeId, file, perHostFutures: Map<host, futures[]> }

  for (const c of verified) {
    const rows = extractTable(c.text);
    const perHost = new Map();
    const skipped = [];
    for (const row of rows) {
      const r = rowToFutures(row);
      if (r.skip) { skipped.push(r.reason); continue; }
      for (const f of r.perHost) {
        if (!perHost.has(f.host)) perHost.set(f.host, []);
        perHost.get(f.host).push(f);
      }
    }
    const totalEligible = [...perHost.values()].reduce((n, arr) => n + arr.length, 0);
    const existing = existingByEpisode.get(c.episodeId) || [];

    console.log(`\n- ${c.file}`);
    console.log(`  episode_id=${c.episodeId}`);
    console.log(`  table rows: ${rows.length} total, ${totalEligible} eligible futures across ${perHost.size} host(s); ${skipped.length} excluded (${[...new Set(skipped)].join(', ') || 'n/a'})`);
    console.log(`  existing podcast_host_summaries rows: ${existing.length ? existing.map((r) => `${r.host}[${r.model}]:${(r.futures || []).length}`).join(', ') : '(none)'}`);

    if (totalEligible === 0) {
      console.log(`  -> SKIP: no futures-eligible content in this episode's master report.`);
      continue;
    }
    if (existing.length === 0) {
      console.log(`  -> GAP-FILL CANDIDATE: currently zero rows in podcast_host_summaries; clean insert, no conflict.`);
      toWrite.push({ episodeId: c.episodeId, file: c.file, perHost });
    } else {
      console.log(`  -> UPGRADE CANDIDATE (needs a decision, not auto-written): episode already has rows from a different pipeline/model.`);
      console.log(`     Corpus B offers ${totalEligible} row(s) with named-expert attribution; existing rows may have finer per-chunk granularity or placeholder host names ("Guest").`);
      console.log(`     Not writing automatically -- flagged for review, per this session's decision not to force upgrade/replace logic without checking each case.`);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`${toWrite.length} episode(s) ready as clean gap-fill inserts: ${toWrite.map((w) => w.episodeId).join(', ') || '(none)'}`);

  if (!WRITE) {
    console.log(`\n[dry-run] No writes performed. Re-run with --write --episode <uuid> (one or more) to persist gap-fill candidates.`);
    return;
  }
  if (!supabase) { console.error('Cannot write: no Supabase credentials.'); process.exit(1); }
  if (!EPISODE_ALLOWLIST.size) { console.error('Cannot write: --write requires at least one --episode <uuid>.'); process.exit(1); }

  let wrote = 0, errors = 0;
  for (const w of toWrite) {
    if (!EPISODE_ALLOWLIST.has(w.episodeId)) continue;
    for (const [host, futures] of w.perHost) {
      const { error } = await supabase.from('podcast_host_summaries').upsert({
        episode_id: w.episodeId,
        host,
        model: MODEL_TAG,
        attribution_method: ATTRIBUTION_METHOD,
        futures,
        chunk_count: null,
        transcript_chars: null,
        vault_path: null,
      }, { onConflict: 'episode_id,host,model' });
      if (error) { console.error(`  ❌ ${w.episodeId} / ${host}: ${error.message}`); errors++; continue; }
      console.log(`  ✅ ${w.episodeId} / ${host}: wrote ${futures.length} futures (model=${MODEL_TAG})`);
      wrote++;
    }
  }
  console.log(`\nDone. rows written=${wrote} errors=${errors}`);
}

main().catch((err) => { console.error(`Fatal: ${err.message}`); process.exit(1); });
