#!/usr/bin/env node
// scripts/verify-intel-sources.js
// ═══════════════════════════════════════════════════════════════════════════════
// Layer 2 (Verification & Reconciliation) — first real implementation.
// See docs/specs/CANONICAL_DATA_LAYER_AUDIT_2026-08-30.md §7 for the architecture
// this is built against.
//
// Runs four checks over the two Supabase-native lean-signal sources that feed
// agents/portfolio-dossier.js today (research_pick_signals, podcast_host_summaries):
//   1. Relevance/fidelity  — is this actually NFL content / a well-formed extraction?
//   2. Freshness           — how old is this signal?
//   3. Corroboration       — do independent sources agree on the same team/market?
//   4. Conflict            — do sources (podcast leans specifically, which carry a
//                            clean favor/fade/over/under enum) actively disagree?
//
// FLOW-THROUGH MODE (Andy, 2026-08-30): this script NEVER deletes, blocks, or
// mutates the source rows. It only stamps a verification_status onto a
// companion table (migration 049_intel_verification.sql) so real throughput
// can be observed before any gate is tightened. Every fact still reaches
// portfolio-dossier.js regardless of its status.
//
// Usage:
//   node scripts/verify-intel-sources.js --dry-run        (default; prints a
//                                                          summary, writes nothing)
//   node scripts/verify-intel-sources.js --write           (upserts results into
//                                                          public.intel_verification
//                                                          -- requires migration 049
//                                                          applied first)
//   node scripts/verify-intel-sources.js --write --limit 500
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (required)
// ═══════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { normalizeTeam } from '../src/lib/teams.js';

const argv = process.argv.slice(2);
const WRITE = argv.includes('--write');
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const LIMIT = parseInt(getArg('--limit', '2000'), 10);
const STALE_DAYS = parseInt(getArg('--stale-days', '45'), 10);

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SB_URL || !SB_KEY) {
  console.error('✖ Need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}
const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });

// ─── Check 1: relevance ────────────────────────────────────────────────────
// research_pick_signals is fed by NFL-labeled RSS feeds, but this repo's own
// feed comments admit at least one feed ("Action Network") is not guaranteed
// NFL-only. Caught live during this audit: a real Cavaliers/Pistons NBA row
// sitting in research_pick_signals. This check is a cheap first line of
// defense, not a substitute for the deeper extraction-fidelity work still
// needed (comparing an extracted claim back to its actual source text).
const NON_NFL_KEYWORDS = [
  'nba', 'nhl', 'mlb', 'ncaa basketball', 'college basketball', 'march madness',
  'cavaliers', 'pistons', 'celtics', 'warriors', 'lakers', 'yankees', 'dodgers',
  'red sox', 'nuggets', 'timberwolves', 'thunder', 'mavericks', 'clippers',
  'nba playoffs', 'nhl playoffs', 'stanley cup', 'world series', 'nba finals',
];
const NFL_KEYWORDS = [
  'nfl', 'super bowl', 'quarterback', 'touchdown', 'field goal', 'preseason',
  'training camp', 'gm', 'head coach', 'offensive line', 'defensive line',
  'wide receiver', 'running back', 'cornerback', 'linebacker', 'tight end',
];

function checkRelevance(text) {
  const t = (text || '').toLowerCase();
  const hasNonNfl = NON_NFL_KEYWORDS.some((k) => t.includes(k));
  const hasNflSignal = NFL_KEYWORDS.some((k) => t.includes(k)) || !!extractTeam(text);
  if (hasNonNfl && !hasNflSignal) return { relevant: false, reason: 'non_nfl_content' };
  if (hasNonNfl && hasNflSignal) return { relevant: true, reason: 'mixed_content_flagged', flagged: true };
  return { relevant: true, reason: hasNflSignal ? 'nfl_keywords_matched' : 'no_strong_signal_either_way' };
}

// ─── Check 2: freshness ────────────────────────────────────────────────────
function ageDays(iso) {
  if (!iso) return null;
  const ms = Date.now() - Date.parse(iso);
  return Number.isFinite(ms) ? ms / 86400000 : null;
}

// ─── team extraction (best-effort, used for corroboration grouping only) ──
function extractTeam(text) {
  if (!text) return null;
  const words = String(text).toLowerCase().split(/[^a-z0-9]+/);
  for (let n = 3; n >= 1; n--) {
    for (let i = 0; i <= words.length - n; i++) {
      const candidate = words.slice(i, i + n).join(' ');
      if (!candidate) continue;
      const team = normalizeTeam(candidate);
      if (team) return team;
    }
  }
  return null;
}

async function fetchResearchSignals(limit) {
  const { data, error } = await sb
    .from('research_pick_signals')
    .select('id, team_or_market, source, lean, rationale, confidence, captured_at, author')
    .limit(limit);
  if (error) throw new Error(`research_pick_signals: ${error.message}`);
  return (data || []).map((r) => ({
    source_table: 'research_pick_signals',
    source_id: String(r.id),
    text: [r.team_or_market, r.rationale].filter(Boolean).join(' — '),
    source_name: r.author || r.source || 'unknown',
    lean_direction: null, // research_pick_signals doesn't carry a clean enum lean today
    confidence: r.confidence,
    timestamp: r.captured_at,
    team: extractTeam(r.team_or_market) || extractTeam(r.rationale),
  }));
}

async function fetchPodcastSignals(limit) {
  const { data, error } = await sb
    .from('podcast_host_summaries')
    .select('id, host, futures, created_at, vault_path')
    .limit(limit);
  if (error) throw new Error(`podcast_host_summaries: ${error.message}`);
  const rows = [];
  for (const r of data || []) {
    const futures = Array.isArray(r.futures) ? r.futures : [];
    for (const f of futures) {
      rows.push({
        source_table: 'podcast_host_summaries',
        source_id: String(r.id),
        text: [f.subject, f.subject_market, f.quote].filter(Boolean).join(' — '),
        source_name: f.host || r.host || 'unknown',
        lean_direction: (f.lean || '').toLowerCase() || null,
        confidence: f.confidence,
        timestamp: r.created_at,
        team: extractTeam(f.subject) || extractTeam(f.subject_market),
        fidelity: {
          has_quote: !!(f.quote && f.quote.length >= 20),
          has_subject: !!f.subject,
          confidence_well_formed: typeof f.confidence === 'number' && f.confidence >= 0 && f.confidence <= 100,
        },
      });
    }
  }
  return rows;
}

function summarizeCorroboration(allSignals) {
  // Group by team, regardless of source table, to see how many independent
  // named sources are actually talking about the same team.
  const byTeam = new Map();
  for (const s of allSignals) {
    if (!s.team) continue;
    if (!byTeam.has(s.team)) byTeam.set(s.team, []);
    byTeam.get(s.team).push(s);
  }
  const results = new Map(); // source_table:source_id -> {status, reason, corroborating_sources}
  for (const [team, signals] of byTeam) {
    const distinctSources = new Set(signals.map((s) => `${s.source_table}:${s.source_name}`));
    const directions = signals.map((s) => s.lean_direction).filter(Boolean);
    const distinctDirections = new Set(directions);
    // Conflict: two+ podcast-style clean-enum leans disagree (favor vs fade, over vs under)
    const OPPOSING = [['favor', 'fade'], ['over', 'under'], ['back', 'fade']];
    const hasConflict = OPPOSING.some(([a, b]) => distinctDirections.has(a) && distinctDirections.has(b));
    for (const s of signals) {
      const key = `${s.source_table}:${s.source_id}`;
      if (hasConflict) {
        results.set(key, { status: 'conflicting', reason: `sources disagree on ${team}`, corroborating_sources: distinctSources.size });
      } else if (distinctSources.size >= 2) {
        results.set(key, { status: 'verified', reason: `${distinctSources.size} independent sources agree on ${team}`, corroborating_sources: distinctSources.size });
      } else if (!results.has(key)) {
        results.set(key, { status: 'unverified', reason: `only 1 source (${team}), not yet corroborated`, corroborating_sources: 1 });
      }
    }
  }
  return results;
}

async function main() {
  console.log(`Layer 2 verification run — ${WRITE ? 'WRITE mode' : 'DRY RUN (no writes)'}, limit=${LIMIT}, stale-days=${STALE_DAYS}\n`);

  const [researchSignals, podcastSignals] = await Promise.all([
    fetchResearchSignals(LIMIT),
    fetchPodcastSignals(LIMIT),
  ]);
  const allSignals = [...researchSignals, ...podcastSignals];
  console.log(`Fetched ${researchSignals.length} research_pick_signals rows, ${podcastSignals.length} podcast_host_summaries future-mentions.\n`);

  const corroboration = summarizeCorroboration(allSignals);

  const finalResults = [];
  const tally = { verified: 0, stale: 0, unverified: 0, conflicting: 0, rejected: 0 };
  const rejectedSamples = [];
  const conflictSamples = [];

  for (const s of allSignals) {
    const relevance = checkRelevance(s.text);
    const age = ageDays(s.timestamp);
    const corrob = corroboration.get(`${s.source_table}:${s.source_id}`) || { status: 'unverified', reason: 'no team extracted', corroborating_sources: 0 };

    let status, reason;
    if (!relevance.relevant) {
      status = 'rejected';
      reason = relevance.reason;
      rejectedSamples.push({ source: s.source_table, id: s.source_id, text: s.text.slice(0, 100) });
    } else if (corrob.status === 'conflicting') {
      status = 'conflicting';
      reason = corrob.reason;
      conflictSamples.push({ team: reason, sources: corrob.corroborating_sources });
    } else if (age != null && age > STALE_DAYS) {
      status = 'stale';
      reason = `${Math.round(age)} days old (threshold ${STALE_DAYS})`;
    } else {
      status = corrob.status; // verified or unverified
      reason = corrob.reason;
    }

    tally[status] = (tally[status] || 0) + 1;
    finalResults.push({
      source_table: s.source_table,
      source_id: s.source_id,
      verification_status: status,
      checks: { relevance, age_days: age, corroboration: corrob, fidelity: s.fidelity || null },
      reason,
      corroborating_sources: corrob.corroborating_sources || 0,
    });
  }

  console.log('─── Tally ───────────────────────────────────────────');
  for (const [k, v] of Object.entries(tally)) console.log(`  ${k.padEnd(12)} ${v}`);
  console.log(`  ${'total'.padEnd(12)} ${finalResults.length}\n`);

  if (rejectedSamples.length) {
    console.log(`─── Rejected as non-NFL (${rejectedSamples.length}) — sample ───`);
    for (const r of rejectedSamples.slice(0, 10)) console.log(`  [${r.source}:${r.id}] ${r.text}`);
    console.log('');
  }
  if (conflictSamples.length) {
    console.log(`─── Conflicts detected (${conflictSamples.length}) — sample ───`);
    for (const c of conflictSamples.slice(0, 10)) console.log(`  ${c.team} (${c.sources} sources)`);
    console.log('');
  }

  if (!WRITE) {
    console.log('Dry run complete — no writes made. Re-run with --write once migration 049 is applied to persist these results to public.intel_verification.');
    return;
  }

  console.log(`Writing ${finalResults.length} rows to public.intel_verification...`);
  const BATCH = 500;
  for (let i = 0; i < finalResults.length; i += BATCH) {
    const batch = finalResults.slice(i, i + BATCH).map((r) => ({
      source_table: r.source_table,
      source_id: r.source_id,
      verification_status: r.verification_status,
      checks: r.checks,
      reason: r.reason,
      corroborating_sources: r.corroborating_sources,
      checked_at: new Date().toISOString(),
    }));
    const { error } = await sb.from('intel_verification').upsert(batch, { onConflict: 'source_table,source_id' });
    if (error) {
      if (error.message?.includes("Could not find the table 'public.intel_verification'")) {
        console.error("✖ Table public.intel_verification doesn't exist yet. Apply supabase/migrations/049_intel_verification.sql first.");
        process.exit(1);
      }
      throw new Error(`write failed: ${error.message}`);
    }
  }
  console.log('✅ Done.');
}

main().catch((e) => { console.error('✖', e.message); process.exit(1); });
