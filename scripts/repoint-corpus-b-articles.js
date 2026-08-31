#!/usr/bin/env node
// scripts/repoint-corpus-b-articles.js
// ═══════════════════════════════════════════════════════════
// DATA-LAYER-LOCKDOWN item 1, article-side, Format A
// (docs/specs/CANONICAL_DATA_LAYER_AUDIT_2026-08-30.md §7 layer-2 check #3).
//
// Article analogue of scripts/repoint-corpus-b-podcasts.js, scoped to
// Format A only: the 15 scratch/*_master_100percent_exhaustive.md reports
// that carry a "## Candidate Extraction" block (Action Network + BettingPros
// picks articles) -- a distinct, already-structured extraction pipeline
// from the narrative "Team-by-Team & Player-by-Player" reports (Format B,
// handled separately, more conservatively, later).
//
// Corpus A here is research-intel-ingest.js's crude regex pass over RSS
// teaser/body text (spread/total pattern match only -- moneyline picks are
// NOT caught by that regex; see e.g. note 2445 where "Detroit Lions
// MoneyLine (+172 via ProphetX)" never made it into research_pick_signals).
// Corpus B's "Explicit pick(s):" field is human-legible and already
// filtered to one matchup's real picks -- richer, not a second competing
// opinion.
//
// research_pick_signals has NO natural upsert key (unlike
// podcast_host_summaries' episode_id/host/model). Dedup here is content-key
// based, same key shape research-intel-ingest.js itself already uses for
// its own within-run dedup: lowercase(team_or_market)+'|'+bet_type, scoped
// to note_id. A pick already present under that key (from the live
// pipeline OR a prior run of this script) is skipped, not re-inserted --
// this makes the script naturally idempotent and blurs the GAP-FILL vs
// UPGRADE distinction the podcast script needed: every note just gets
// whatever picks aren't already there.
//
// bet_type is derived by reusing research-intel-ingest.js's own
// classifyBetType() against the pick TEXT, not by trusting Corpus B's own
// "Market type(s):" field -- confirmed necessary: the two BettingPros
// roundup files (predictions_week_3_friday/saturday) list market types as
// a DEDUPED SET, not a parallel array aligned to each pick, so positional
// zipping would silently mislabel picks.
//
// SCOPE GUARD: matched-but-unmatchable-cleanly picks are skipped and
// reported, never guessed at -- e.g. the Vikings/Broncos file's
// "Over 38.5 - NO 52%" (two different pick shapes joined with " - ",
// genuinely ambiguous which is the real explicit pick).
//
// SCOPE GUARD: the 10 Action Network files have NO research_intel_notes
// row at all (never ingested by that source). Inserting them means
// treating Corpus B as a PRIMARY source, not de-duplicating against an
// existing one -- a different, bigger decision than this script makes.
// They are surveyed and reported, never written here.
//
// Default is a dry run (report-only, no writes). --write persists.
//
// Usage:
//   node scripts/repoint-corpus-b-articles.js
//   node scripts/repoint-corpus-b-articles.js --write
// ══════════════════════════════════════════════════════════════

import 'dotenv/config';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRATCH_DIR = path.join(__dirname, '..', 'scratch');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const WRITE = process.argv.includes('--write');

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
  // e.g. "- Matchup: Cincinnati Bengals vs Philadelphia Eagles"
  const re = new RegExp(`^-\\s*${label}\\s*:\\s*(.+)$`, 'im');
  const m = block.match(re);
  return m ? m[1].trim() : null;
}

function extractUrl(text) {
  const m = text.match(/^\*\*URL:\*\*\s*\[.*?\]\((https?:\/\/[^\s)]+)\)/m)
    || text.match(/^\*\*URL:\*\*\s*(https?:\/\/\S+)/m);
  return m ? m[1].trim() : null;
}

function extractHeaderField(text, label) {
  const m = text.match(new RegExp(`^\\*\\*${label}:\\*\\*\\s*(.+)$`, 'm'));
  return m ? m[1].trim() : null;
}

function extractTitle(text) {
  const m = text.match(/^#\s*(.+?)(?::\s*100% .*Master Intelligence Report)?\s*$/m);
  return m ? m[1].trim() : null;
}

// A candidate pick segment is only trusted as an independent pick if it has
// its own team/market subject -- a leading capitalized word/phrase, or an
// Over/Under total shape. Bare trailing commentary ("bet to +3") gets
// merged back into the previous segment instead of becoming a phantom pick.
function looksLikeIndependentPick(seg) {
  const s = seg.trim();
  if (/^(Over|Under)\s+\d/i.test(s)) return true;
  if (/^[A-Z][A-Za-z0-9.&' -]{1,40}\s(?:\+|-)\d/.test(s)) return true; // "Ravens -3.5"
  if (/^[A-Z][A-Za-z0-9.&' -]{1,40}\s+(Moneyline|MoneyLine|to Win)\b/.test(s)) return true;
  if (/^[A-Z][A-Za-z0-9.&' -]{1,40}\s+\d+%/.test(s)) return true; // "Cowboys 55%"
  if (/^[A-Z][A-Za-z0-9.&' -]{1,40}\s+(Over|Under)\s+\d/i.test(s)) return true; // "Cowboys Over 1.5 Field Goals"
  return false;
}

function splitPicks(raw) {
  const segments = raw.split(';').map((s) => s.trim()).filter(Boolean);
  const picks = [];
  for (const seg of segments) {
    if (looksLikeIndependentPick(seg) || picks.length === 0) {
      picks.push(seg);
    } else {
      picks[picks.length - 1] += `; ${seg}`; // trailing commentary, not a new pick
    }
  }
  return picks;
}

// Strip trailing "(...)" odds/sportsbook parenthetical for a clean
// team_or_market label. Flags (ambiguous: true) rather than guessing when
// a pick contains an un-parenthesized " - " joining two different shapes
// (e.g. "Over 38.5 - NO 52%").
function cleanPickText(raw) {
  let s = raw.trim();
  if (/\s-\s/.test(s.replace(/\([^)]*\)/g, '')) && !/^\d+(\.\d+)?\s-\s\d+(\.\d+)?$/.test(s)) {
    // an un-parenthesized " - " outside any parenthetical is a real red flag
    // for "two things joined", UNLESS it's just a plain number range.
    if (/\bNO\s+\d+%|\bYES\s+\d+%/.test(s) || /%.*-.*%/.test(s)) {
      return { text: s, ambiguous: true, reason: 'contains multiple joined pick shapes' };
    }
  }
  s = s.replace(/\s*\([^)]*\)\s*$/, '').trim();
  return { text: s, ambiguous: false };
}

async function loadCandidates() {
  const files = (await readdir(SCRATCH_DIR)).filter((f) => f.endsWith('_master_100percent_exhaustive.md'));
  const out = [];
  for (const f of files) {
    const raw = await readFile(path.join(SCRATCH_DIR, f), 'utf8');
    const text = raw.replace(/\r\n/g, '\n');
    if (!/## Candidate Extraction/.test(text)) continue; // Format A only
    const url = extractUrl(text);
    if (!url) continue;
    const block = text.split('## Candidate Extraction')[1].split(/\n## /)[0];
    const matchup = extractField(block, 'Matchup');
    const pickField = extractField(block, 'Explicit pick\\(s\\)') || extractField(block, 'Explicit pick');
    const source = extractHeaderField(text, 'Source');
    const author = extractHeaderField(text, 'Author');
    const title = extractTitle(text);
    out.push({ file: f, url, matchup, pickField, source, author, title });
  }
  return out;
}

async function main() {
  const candidates = await loadCandidates();
  console.log(`Format A candidates (## Candidate Extraction block): ${candidates.length}\n`);

  if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase credentials.'); process.exit(1); }
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  let totalNewPicks = 0, totalSkippedDup = 0, totalAmbiguous = 0, totalUnmatchedNotes = 0;
  const toWrite = []; // { noteId, row }

  for (const c of candidates) {
    console.log(`\n- ${c.file}`);
    console.log(`  Source: ${c.source} | URL: ${c.url}`);
    if (!c.pickField) {
      console.log(`  -> SKIP: no "Explicit pick(s):" field found in Candidate Extraction block.`);
      continue;
    }

    const canonical = canonicalizeUrl(c.url);
    const hash = sha256(canonical);
    let { data: note } = await supabase
      .from('research_intel_notes')
      .select('id, title')
      .eq('url_hash', hash)
      .maybeSingle();
    if (!note) {
      const { data: fb } = await supabase
        .from('research_intel_notes')
        .select('id, title')
        .or(`url.eq.${c.url},canonical_url.eq.${c.url}`);
      if (fb && fb.length) note = fb[0];
    }

    if (!note) {
      totalUnmatchedNotes++;
      console.log(`  -> NO research_intel_notes match -- net-new-insert decision, out of scope here. Not written.`);
      continue;
    }

    const { data: existingSignals } = await supabase
      .from('research_pick_signals')
      .select('team_or_market, bet_type')
      .eq('note_id', note.id);
    const existingKeys = new Set(
      (existingSignals || []).map((s) => `${String(s.team_or_market).toLowerCase().trim()}|${s.bet_type}`)
    );

    const rawPicks = splitPicks(c.pickField);
    for (const raw of rawPicks) {
      const { text, ambiguous, reason } = cleanPickText(raw);
      if (ambiguous) {
        totalAmbiguous++;
        console.log(`  -> AMBIGUOUS, skipped (needs human read): "${raw}" (${reason})`);
        continue;
      }
      const bet_type = classifyBetType(text);
      const key = `${text.toLowerCase().trim()}|${bet_type}`;
      if (existingKeys.has(key)) {
        totalSkippedDup++;
        console.log(`  -> already present, skipped: "${text}" (${bet_type})`);
        continue;
      }
      totalNewPicks++;
      console.log(`  -> NEW pick: "${text}" (${bet_type})`);
      toWrite.push({
        noteId: note.id,
        row: {
          note_id: note.id,
          source: c.source,
          author: c.author || null,
          team_or_market: text,
          bet_type,
          lean: text,
          rationale: c.title,
          event_ref: c.url,
          confidence: null, // filled in below once note.confidence is known
        },
      });
      existingKeys.add(key); // guard against dup picks within the same file
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`New picks ready to write: ${totalNewPicks}`);
  console.log(`Already present (skipped): ${totalSkippedDup}`);
  console.log(`Ambiguous (skipped, needs human read): ${totalAmbiguous}`);
  console.log(`Unmatched to research_intel_notes (Action Network, out of scope): ${totalUnmatchedNotes}`);

  if (!WRITE) {
    console.log(`\n[dry-run] No writes performed. Re-run with --write to persist the ${totalNewPicks} new picks above.`);
    return;
  }
  if (!toWrite.length) { console.log('\nNothing to write.'); return; }

  // Fill in confidence from each note's own base confidence, same tier
  // research-intel-ingest.js uses for its "explicit" regex matches
  // (baseConfidence - 0.08), since Corpus B's picks are equally explicit.
  const noteIds = [...new Set(toWrite.map((w) => w.noteId))];
  const { data: notes } = await supabase.from('research_intel_notes').select('id, confidence').in('id', noteIds);
  const confByNote = new Map((notes || []).map((n) => [n.id, Number(n.confidence)]));

  const rows = toWrite.map((w) => ({
    ...w.row,
    confidence: Number(((confByNote.get(w.noteId) ?? 0.6) - 0.08).toFixed(3)),
  }));

  const { error } = await supabase.from('research_pick_signals').insert(rows);
  if (error) { console.error(`Insert failed: ${error.message}`); process.exit(1); }
  console.log(`\nDone. Wrote ${rows.length} new research_pick_signals rows.`);
}

main().catch((err) => { console.error(`Fatal: ${err.message}`); process.exit(1); });
