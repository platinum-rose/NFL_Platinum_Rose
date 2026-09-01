#!/usr/bin/env node
// scripts/repoint-corpus-b-articles-format-b.js
// ═══════════════════════════════════════════════════════════
// DATA-LAYER-LOCKDOWN item 1, article-side, Format B.
//
// Format B is the 22 narrative "Team-by-Team & Player-by-Player" master
// reports (PFF game recaps/rankings, one VSiN preseason-picks roundup, one
// Sharp Football Super Bowl odds tracker) surveyed in the prior session
// alongside Format A (see scripts/repoint-corpus-b-articles.js) and
// docs/specs/CANONICAL_DATA_LAYER_AUDIT_2026-08-30.md §7. Unlike Format A's
// "## Candidate Extraction" block (a purpose-built structured field set),
// these reports are almost entirely narrative prose -- most will and should
// legitimately yield zero picks. This script is deliberately more
// conservative than the Format A script:
//
//   1. HARDCODED FILE LIST. Only the exact 22 files identified in the prior
//      session's survey are read -- no glob, no "files without a Candidate
//      Extraction block" heuristic -- so this can never accidentally sweep
//      in the 3 corrupted VSiN refusal files (empty body, would extract
//      nothing anyway but shouldn't be silently treated as "0 picks found"
//      the same way a real empty article is) or the Reddit AMA file (a
//      Q&A transcript, not a "Team-by-Team" narrative report, never
//      surveyed as Format B).
//
//   2. LABELED-FIELDS-ONLY, ONE SECTION ONLY. Every report in this corpus
//      shares a "**Betting & Fantasy Rationale:**" section (ending at the
//      next "**Key Citations...**" section). Extraction reads ONLY inside
//      that section, and ONLY lines that are themselves a bolded label
//      ending in Bet/Pick/Lock/Lean (case-insensitive): "Betting Pick",
//      "Best Favorite Bet", "Best Sleeper Bet", "Best Bet", "Bet", "Pick",
//      "Lock", "Lean". This deliberately EXCLUDES sibling bolded labels in
//      the same section that read like picks but aren't ("Betting Trends",
//      "Betting Strategy", "Justification", "Rationale") -- confirmed
//      necessary against the Sharp Football Super Bowl file, which has all
//      of the above side by side. Nothing outside this section (Executive
//      Summary, Team-by-Team breakdown, Key Citations) is scanned at all,
//      so a player's bolded name/stat line elsewhere in the report can
//      never be mistaken for a pick.
//
//   3. CONTEXT-AWARE, TITLE-ASSISTED CLASSIFICATION. classifyBetType() is
//      reused verbatim from research-intel-ingest.js (via
//      repoint-corpus-b-articles.js's copy) but called against
//      `${title} ${text}` rather than the pick text alone -- required
//      because "Best Favorite Bet: Los Angeles Rams (+550)" contains no
//      total/spread/moneyline shape or "super bowl" keyword on its own;
//      only the report's title ("Super Bowl 61 Betting Odds Tracker...")
//      carries the futures-market context. Verified this doesn't
//      over-fire: the one other file with real picks (VSiN's Week 3
//      predictions roundup) has spread/total-shaped text that classifies
//      correctly with or without the title.
//
// Matching against research_intel_notes is by canonicalized-URL hash,
// identical to the Format A script -- confirmed live (2026-08-31 probe)
// that PFF, Sharp Football, and VSiN are all active ingested sources
// (282 / 173 / 159 rows respectively) and all three of this corpus's
// real-pick files (VSiN Week 3 picks, Sharp Football SB61 tracker, and the
// PFF Baltimore recap used as a probe) already resolve to an existing note
// -- so, unlike the 10 unmatched Action Network files in Format A, Format B
// is NOT expected to raise the "treat Corpus B as a primary source"
// question; any file that fails to match is reported, not written, exactly
// like Format A's guard.
//
// Dedup against research_pick_signals uses the same content-key
// (lowercase(team_or_market)+'|'+bet_type, scoped to note_id) as Format A,
// making this naturally idempotent and safe to re-run.
//
// Default is a dry run (report-only, no writes). --write persists.
//
// Usage:
//   node scripts/repoint-corpus-b-articles-format-b.js
//   node scripts/repoint-corpus-b-articles-format-b.js --write
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

// The exact 22 Format B files (PFF x20, VSiN x1, Sharp Football x1),
// per the 2026-08-31 survey. Deliberately hardcoded -- see header comment.
const FORMAT_B_FILES = [
  'article_2026_nfl_linebacker_unit_rankings_49ers__master_100percent_exhaustive.md',
  'article_2026_nfl_preseason_notable_schematic_tea_master_100percent_exhaustive.md',
  'article_fantasy_football_10_biggest_reactions_to_master_100percent_exhaustive.md',
  'article_fantasy_football_2026_preseason_week_3_i_master_100percent_exhaustive.md',
  'article_fantasy_football_2026_week_3_preseason_r_master_100percent_exhaustive.md',
  'article_fantasy_football_running_back_rankings_t_master_100percent_exhaustive.md',
  'article_highest_graded_nfl_rookies_after_week_2__master_100percent_exhaustive.md',
  'article_nfl_preseason_predictions_and_picks_week_master_100percent_exhaustive.md',
  'article_nfl_preseason_week_2_recap_atlanta_falco_master_100percent_exhaustive.md',
  'article_nfl_preseason_week_2_recap_baltimore_rav_master_100percent_exhaustive.md',
  'article_nfl_preseason_week_2_recap_buffalo_bills_master_100percent_exhaustive.md',
  'article_nfl_preseason_week_2_recap_chicago_bears_master_100percent_exhaustive.md',
  'article_nfl_preseason_week_2_recap_dallas_cowboy_master_100percent_exhaustive.md',
  'article_nfl_preseason_week_2_recap_immediate_fan_master_100percent_exhaustive.md',
  'article_nfl_preseason_week_2_recap_kansas_city_c_master_100percent_exhaustive.md',
  'article_nfl_preseason_week_2_recap_new_orleans_s_master_100percent_exhaustive.md',
  'article_nfl_preseason_week_2_recap_new_york_gian_master_100percent_exhaustive.md',
  'article_nfl_preseason_week_2_recap_philadelphia__master_100percent_exhaustive.md',
  'article_nfl_preseason_week_2_recap_seattle_seaha_master_100percent_exhaustive.md',
  'article_nfl_preseason_week_2_recap_washington_co_master_100percent_exhaustive.md',
  'article_nfl_preseason_week_2_team_of_the_week_03_master_100percent_exhaustive.md',
  'article_super_bowl_61_betting_odds_tracker_live__master_100percent_exhaustive.md',
  // Added 2026-09-01: Antigravity re-extracted these 3 files (previously LLM-refusal
  // placeholders) with real content and a validation guard against recurrence.
  'article_nfl_preseason_week_2_results_seahawks_ti_master_100percent_exhaustive.md',
  'article_nfl_preseason_week_3_best_bets_master_100percent_exhaustive.md',
  'article_nfl_preseason_week_3_starting_quarterbac_master_100percent_exhaustive.md',
];

function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

// Copied verbatim from agents/research-intel-ingest.js (via repoint-corpus-b-articles.js).
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
  const m = text.match(/^#\s*(.+?)(?::\s*100% .*(?:Master Intelligence Report|Master Breakdown))?\s*$/m);
  return m ? m[1].trim() : null;
}

// Strip a trailing "(...)" odds/sportsbook parenthetical for a clean
// team_or_market label; the raw value (with parenthetical) is kept
// separately as `lean` for a human to read the full context later.
function cleanPickText(raw) {
  return raw.trim().replace(/\s*\([^)]*\)\s*$/, '').trim();
}

// Bolded label allowlist: only labels that themselves end in one of these
// pick-indicating words are trusted. "Betting Trends" / "Betting Strategy" /
// "Justification" / "Rationale" are deliberately excluded even though they
// live in the same section -- see header comment point 2.
const LABEL_RE = /^\s*-\s*\*\*([A-Za-z][A-Za-z /]*?(?:Bet|Pick|Lock|Lean)s?)\s*:\*\*\s*(.+)$/i;

// A "matchup/team context" header inside the rationale section: either a
// numbered game header ("1. **Patriots vs. Browns:**") or a bare bolded
// team/subject line with nothing else on it ("- **Best Favorite Bet:**" is
// NOT this -- it has trailing content after the colon, this pattern
// requires the bold span to be the entire line's content).
function isContextHeader(line) {
  const m = line.match(/^\s*(?:\d+\.\s*)?\*\*(.+?):\*\*\s*$/);
  return m ? m[1].trim() : null;
}

function extractRationaleSection(text) {
  const m = text.match(/\*\*Betting (?:& Fantasy )?Rationale:?\*\*\n([\s\S]*?)(?=\n\*\*Key Citations|\n\*\*Sources?\b|$)/i);
  return m ? m[1] : null;
}

function extractLabeledPicks(text) {
  const section = extractRationaleSection(text);
  if (!section) return { found: false, picks: [] };
  const picks = [];
  let currentContext = null;
  for (const line of section.split('\n')) {
    const ctx = isContextHeader(line);
    if (ctx) { currentContext = ctx; continue; }
    const m = line.match(LABEL_RE);
    if (m) {
      picks.push({ label: m[1].trim(), raw: m[2].trim(), context: currentContext });
    }
  }
  return { found: true, picks };
}

async function loadCandidates() {
  const out = [];
  for (const f of FORMAT_B_FILES) {
    const raw = await readFile(path.join(SCRATCH_DIR, f), 'utf8');
    const text = raw.replace(/\r\n/g, '\n');
    const url = extractUrl(text);
    const source = extractHeaderField(text, 'Source');
    const author = extractHeaderField(text, 'Author');
    const title = extractTitle(text);
    const { found, picks } = extractLabeledPicks(text);
    out.push({ file: f, url, source, author, title, sectionFound: found, picks });
  }
  return out;
}

async function main() {
  const candidates = await loadCandidates();
  console.log(`Format B files: ${candidates.length}\n`);

  if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase credentials.'); process.exit(1); }
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  let totalNewPicks = 0, totalSkippedDup = 0, totalUnmatchedNotes = 0, totalZeroPickFiles = 0, totalNoSectionFiles = 0;
  const toWrite = [];

  for (const c of candidates) {
    console.log(`\n- ${c.file}`);
    console.log(`  Source: ${c.source} | URL: ${c.url}`);
    if (!c.sectionFound) {
      totalNoSectionFiles++;
      console.log(`  -> SKIP: no "Betting & Fantasy Rationale" section found at all.`);
      continue;
    }
    if (!c.picks.length) {
      totalZeroPickFiles++;
      console.log(`  -> 0 labeled picks (expected for most of this corpus -- narrative-only report).`);
      continue;
    }

    if (!c.url) {
      console.log(`  -> SKIP: no URL, cannot match to research_intel_notes.`);
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

    for (const p of c.picks) {
      const text = cleanPickText(p.raw);
      const bet_type = classifyBetType(`${c.title || ''} ${text}`);
      const key = `${text.toLowerCase().trim()}|${bet_type}`;
      const contextNote = p.context ? ` [context: ${p.context}]` : '';
      if (existingKeys.has(key)) {
        totalSkippedDup++;
        console.log(`  -> already present, skipped: "${p.label}: ${text}" (${bet_type})${contextNote}`);
        continue;
      }
      totalNewPicks++;
      console.log(`  -> NEW pick: "${p.label}: ${text}" (${bet_type})${contextNote}`);
      toWrite.push({
        noteId: note.id,
        row: {
          note_id: note.id,
          source: c.source,
          author: c.author || null,
          team_or_market: text,
          bet_type,
          lean: p.raw,
          rationale: p.context ? `${p.label} (${p.context}) -- ${c.title}` : `${p.label} -- ${c.title}`,
          event_ref: c.url,
          confidence: null,
        },
      });
      existingKeys.add(key);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Files with no rationale section found: ${totalNoSectionFiles}`);
  console.log(`Files with 0 labeled picks (expected for most): ${totalZeroPickFiles}`);
  console.log(`New picks ready to write: ${totalNewPicks}`);
  console.log(`Already present (skipped): ${totalSkippedDup}`);
  console.log(`Unmatched to research_intel_notes: ${totalUnmatchedNotes}`);

  if (!WRITE) {
    console.log(`\n[dry-run] No writes performed. Re-run with --write to persist the ${totalNewPicks} new picks above.`);
    return;
  }
  if (!toWrite.length) { console.log('\nNothing to write.'); return; }

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
