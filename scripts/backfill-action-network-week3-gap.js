#!/usr/bin/env node
// scripts/backfill-action-network-week3-gap.js
// ═══════════════════════════════════════════════════════════
// DATA-LAYER-LOCKDOWN item 1 -- Action Network live-feed outage backfill.
//
// BACKGROUND (2026-08-31 finding): research_intel_notes has carried ZERO
// Action Network rows since 2026-08-25, while every other active feed
// (PFF, VSiN, Sharp Football, BettingPros, Rotowire, Pro Football Talk,
// Walter Football) kept ingesting normally through 2026-08-31. Root cause
// confirmed live: `https://www.actionnetwork.com/nfl/feed` now returns
// HTTP 403 (CloudFront bot-block). agents/research-intel-ingest.js's
// fetchFeed() treats a non-OK response as a soft per-feed
// `status: 'unavailable'` rather than throwing (see its `if (!res.ok)`
// branch) -- so the GitHub Actions workflow has reported green/success on
// every run through this entire window (confirmed via 15 recent runs on
// the GitHub API) while silently dropping all new Action Network content.
// This is logged as its own bug row on TASK_BOARD.md (see B-actionnetwork
// -feed-403) for an actual fix/reroute; THIS script is only the one-time
// backfill for the specific gap the outage created.
//
// The 10 Action Network preseason-Week-3 (Aug 28) game-preview files in
// Antigravity's Corpus B (scratch/action_network_*_preseason_week3_aug28_
// master_100percent_exhaustive.md) are the exact same "one article per
// game" format the live feed successfully caught for Week 2 on 2026-08-22
// (10 matching research_intel_notes rows, captured in one batch at
// 19:14 UTC that day) -- they are what the live feed would have captured
// for Week 3 had it not been blocked starting ~08-25. Andy authorized
// (2026-08-31) treating these 10 specifically as a one-time stopgap
// backfill for a confirmed feed outage -- NOT a general policy of treating
// Corpus B as a primary source.
//
// Each file already carries a real Action Network URL, a **Published:**
// timestamp, and a "## Candidate Extraction" block (Format A) with an
// explicit pick -- this script:
//   1. Inserts one research_intel_notes row per file (same shape
//      research-intel-ingest.js's own live insert path uses: source,
//      source_type, url/canonical_url/url_hash, content_hash, title,
//      summary, published_at, confidence=0.74 matching the live feed's own
//      configured confidence for this source, author). Guarded by a
//      url_hash existence check first, so a partial prior run or a live
//      feed recovery that already caught one of these URLs is never
//      double-inserted.
//   2. Extracts the "Explicit pick" field from each file's Candidate
//      Extraction block (same classifyBetType()/splitPicks()/
//      cleanPickText() logic as scripts/repoint-corpus-b-articles.js) and
//      inserts it into research_pick_signals against the new note_id.
//
// Default is a dry run (report-only, no writes). --write persists.
//
// Usage:
//   node scripts/backfill-action-network-week3-gap.js
//   node scripts/backfill-action-network-week3-gap.js --write
// ══════════════════════════════════════════════════════════════

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRATCH_DIR = path.join(__dirname, '..', 'scratch');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const WRITE = process.argv.includes('--write');

const FILES = [
  'action_network_bengals_eagles_preseason_week3_aug28_master_100percent_exhaustive.md',
  'action_network_buccaneers_jaguars_preseason_week3_aug28_master_100percent_exhaustive.md',
  'action_network_cardinals_packers_preseason_week3_aug28_master_100percent_exhaustive.md',
  'action_network_commanders_ravens_preseason_week3_aug28_master_100percent_exhaustive.md',
  'action_network_falcons_dolphins_preseason_week3_aug28_master_100percent_exhaustive.md',
  'action_network_giants_jets_preseason_week3_aug28_master_100percent_exhaustive.md',
  'action_network_saints_cowboys_preseason_week3_aug28_master_100percent_exhaustive.md',
  'action_network_seahawks_chiefs_preseason_week3_aug28_master_100percent_exhaustive.md',
  'action_network_texans_panthers_preseason_week3_aug28_master_100percent_exhaustive.md',
  'action_network_vikings_broncos_preseason_week3_aug28_master_100percent_exhaustive.md',
];

const SOURCE = 'Action Network';
const SOURCE_TYPE = 'betting';
const CONFIDENCE = 0.74; // matches agents/research-intel-ingest.js's FEEDS[] entry for this source

function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

// Copied verbatim from agents/research-intel-ingest.js.
function canonicalizeUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    u.hash = '';
    const allowed = new URLSearchParams();
    for (const [k, v] of u.searchParams.entries()) {
      const key = k.toLowerCase();
      if (key.startsWith('utm_') || key === 'fbclid' || key === 'gclid') continue;
      allowed.append(k, v);
    }
    u.search = allowed.toString();
    return u.toString();
  } catch {
    return rawUrl;
  }
}

// Copied verbatim from agents/research-intel-ingest.js.
function classifyBetType(text) {
  const t = text.toLowerCase();
  if (/\bover\b|\bunder\b/.test(t)) return 'total';
  if (/\+\d+(\.\d+)?|-\d+(\.\d+)?/.test(t)) return 'spread';
  if (/moneyline|\bml\b/.test(t)) return 'moneyline';
  if (/mvp|coach of the year|rookie|division|conference|super bowl/.test(t)) return 'futures';
  return 'other';
}

function extractField(block, label) {
  const re = new RegExp(`^-\\s*${label}\\s*:\\s*(.+)$`, 'im');
  const m = block.match(re);
  return m ? m[1].trim() : null;
}

function extractHeaderField(text, label) {
  const m = text.match(new RegExp(`^\\*\\*${label}:\\*\\*\\s*(.+)$`, 'm'));
  return m ? m[1].trim() : null;
}

function extractTitle(text) {
  const m = text.match(/^#\s*(.+)\s*$/m);
  return m ? m[1].trim() : null;
}

// A candidate pick segment is only trusted as an independent pick if it
// has its own team/market subject -- copied verbatim from
// scripts/repoint-corpus-b-articles.js (same false-merge guard that
// caught the "Jets +3.5 (-105); bet to +3" and "Over 38.5 - NO 52%"
// shapes in this exact file set).
function looksLikeIndependentPick(seg) {
  const s = seg.trim();
  if (/^(Over|Under)\s+\d/i.test(s)) return true;
  if (/^[A-Z][A-Za-z0-9.&' -]{1,40}\s(?:\+|-)\d/.test(s)) return true;
  if (/^[A-Z][A-Za-z0-9.&' -]{1,40}\s+(Moneyline|MoneyLine|to Win)\b/.test(s)) return true;
  if (/^[A-Z][A-Za-z0-9.&' -]{1,40}\s+\d+%/.test(s)) return true;
  if (/^[A-Z][A-Za-z0-9.&' -]{1,40}\s+(Over|Under)\s+\d/i.test(s)) return true;
  return false;
}

function splitPicks(raw) {
  const segments = raw.split(';').map((s) => s.trim()).filter(Boolean);
  const picks = [];
  for (const seg of segments) {
    if (looksLikeIndependentPick(seg) || picks.length === 0) {
      picks.push(seg);
    } else {
      picks[picks.length - 1] += `; ${seg}`;
    }
  }
  return picks;
}

// Copied verbatim from scripts/repoint-corpus-b-articles.js: flags
// (ambiguous: true) rather than guessing when a pick contains an
// un-parenthesized " - " joining two different shapes.
function cleanPickText(raw) {
  let s = raw.trim();
  if (/\s-\s/.test(s.replace(/\([^)]*\)/g, '')) && !/^\d+(\.\d+)?\s-\s\d+(\.\d+)?$/.test(s)) {
    if (/\bNO\s+\d+%|\bYES\s+\d+%/.test(s) || /%.*-.*%/.test(s)) {
      return { text: s, ambiguous: true, reason: 'contains multiple joined pick shapes' };
    }
  }
  s = s.replace(/\s*\([^)]*\)\s*$/, '').trim();
  return { text: s, ambiguous: false };
}

async function loadCandidates() {
  const out = [];
  for (const f of FILES) {
    const raw = await readFile(path.join(SCRATCH_DIR, f), 'utf8');
    const text = raw.replace(/\r\n/g, '\n');
    const url = extractHeaderField(text, 'URL');
    const published = extractHeaderField(text, 'Published');
    const author = extractHeaderField(text, 'Author');
    const title = extractTitle(text);
    const block = text.includes('## Candidate Extraction')
      ? text.split('## Candidate Extraction')[1].split(/\n## /)[0]
      : '';
    const matchup = extractField(block, 'Matchup');
    const pickField = extractField(block, 'Explicit pick');
    out.push({ file: f, url, published, author, title, matchup, pickField });
  }
  return out;
}

async function main() {
  const candidates = await loadCandidates();
  console.log(`Action Network Week 3 gap-backfill candidates: ${candidates.length}\n`);

  if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase credentials.'); process.exit(1); }
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const toInsertNotes = [];
  const notePlan = [];
  let totalAmbiguous = 0;

  for (const c of candidates) {
    console.log(`- ${c.file}`);
    console.log(`  ${c.matchup} | ${c.url}`);
    if (!c.url || !c.title || !c.published) {
      console.log(`  -> SKIP: missing URL/title/published date.`);
      continue;
    }
    const canonical = canonicalizeUrl(c.url);
    const url_hash = sha256(canonical);
    const { data: existing } = await supabase
      .from('research_intel_notes')
      .select('id')
      .eq('url_hash', url_hash)
      .maybeSingle();
    if (existing) {
      console.log(`  -> already exists as note ${existing.id} (feed must have recovered or a prior run inserted it) -- skipped.`);
      continue;
    }
    const summary = `${c.matchup} -- NFL preseason Week 3 prediction/pick/odds article.`;
    const note = {
      source: SOURCE,
      source_type: SOURCE_TYPE,
      url: c.url,
      canonical_url: canonical,
      url_hash,
      content_hash: sha256(`${c.title}|${summary}`),
      title: c.title,
      summary,
      published_at: c.published,
      confidence: CONFIDENCE,
      author: c.author || null,
    };
    console.log(`  -> NEW note: "${c.title}" (published ${c.published})`);
    const picks = [];
    if (c.pickField) {
      for (const raw of splitPicks(c.pickField)) {
        const { text, ambiguous, reason } = cleanPickText(raw);
        if (ambiguous) {
          totalAmbiguous++;
          console.log(`     AMBIGUOUS, skipped (needs human read): "${raw}" (${reason})`);
          continue;
        }
        console.log(`     pick: "${text}" (raw: "${raw}")`);
        picks.push({ raw, text });
      }
    } else {
      console.log(`     no Explicit pick field found -- note inserted without a signal.`);
    }
    toInsertNotes.push(note);
    notePlan.push({ url_hash, picks, matchup: c.matchup, author: c.author, title: c.title, url: c.url });
  }

  console.log(`\n=== Summary ===`);
  console.log(`New notes ready to write: ${toInsertNotes.length}`);
  console.log(`New pick signals ready to write: ${notePlan.reduce((n, p) => n + p.picks.length, 0)}`);
  console.log(`Ambiguous picks skipped (needs human read): ${totalAmbiguous}`);

  if (!WRITE) {
    console.log(`\n[dry-run] No writes performed. Re-run with --write to persist the above.`);
    return;
  }
  if (!toInsertNotes.length) { console.log('\nNothing to write.'); return; }

  const { data: insertedNotes, error: noteErr } = await supabase
    .from('research_intel_notes')
    .insert(toInsertNotes)
    .select('id, url_hash');
  if (noteErr) { console.error(`Insert notes failed: ${noteErr.message}`); process.exit(1); }
  console.log(`\nInserted ${insertedNotes.length} new research_intel_notes rows.`);

  const noteIdByHash = new Map(insertedNotes.map((n) => [n.url_hash, n.id]));
  const signalRows = [];
  for (const plan of notePlan) {
    const noteId = noteIdByHash.get(plan.url_hash);
    if (!noteId) continue;
    for (const p of plan.picks) {
      const bet_type = classifyBetType(p.text);
      signalRows.push({
        note_id: noteId,
        source: SOURCE,
        author: plan.author || null,
        team_or_market: p.text,
        bet_type,
        lean: p.raw,
        rationale: plan.title,
        event_ref: plan.url,
        confidence: Number((CONFIDENCE - 0.08).toFixed(3)), // same "explicit regex match" tier research-intel-ingest.js uses
      });
    }
  }

  if (signalRows.length) {
    const { error: sigErr } = await supabase.from('research_pick_signals').insert(signalRows);
    if (sigErr) { console.error(`Insert signals failed: ${sigErr.message}`); process.exit(1); }
    console.log(`Inserted ${signalRows.length} new research_pick_signals rows.`);
  }

  console.log('\nDone.');
}

main().catch((err) => { console.error(`Fatal: ${err.message}`); process.exit(1); });
