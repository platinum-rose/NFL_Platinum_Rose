#!/usr/bin/env node
// scripts/triage-unverified-intel.js
// ═══════════════════════════════════════════════════════════════════════════════
// Layer 2 companion tool — answers "how do I evaluate the `unverified` bucket?"
//
// `verify-intel-sources.js` tags a signal `unverified` for two structurally
// different reasons that get flattened into one status:
//   (a) single_source     — exactly one recent, on-topic source has an opinion.
//                            Nothing is wrong with it; it just hasn't been
//                            corroborated yet. This is the bulk of the bucket
//                            and is mostly a WAITING problem, not a fixing one.
//   (b) stale_uncorroborated — an older signal, outside the recency window,
//                            that never got corroborated before it aged out.
//                            Lowest-value bucket — least likely to still matter.
//   (c) no_team_extracted  — extractTeam() found nothing, so the signal never
//                            even entered a corroboration group. This is a
//                            DATA-QUALITY gap (normalizeTeam/team regex miss),
//                            not a "needs more sources" problem, and is the
//                            one category actually worth fixing in code.
//
// This script re-runs the same fetch/scoring pipeline as verify-intel-sources.js
// (dry-run only, no writes, no dependency on migration 049) and buckets the
// `unverified` set by reason, then ranks each bucket so a human reviewer can
// spend their attention where it's most likely to pay off:
//   - single_source: highest confidence + most recent first (best candidates
//     to manually sanity-check against the raw podcast/article right now,
//     since they're the ones most likely to firm up into next week's picks)
//   - no_team_extracted: raw text surfaced so team-extraction gaps can be
//     patched in src/lib/teams.js / extractTeam()'s n-gram matcher
//   - stale_uncorroborated: just counted — not worth line-by-line review
//
// Usage:
//   node scripts/triage-unverified-intel.js                  (top 15 per bucket)
//   node scripts/triage-unverified-intel.js --top 30
//   node scripts/triage-unverified-intel.js --limit 2000
// ═══════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import {
  fetchResearchSignals,
  fetchPodcastSignals,
  summarizeCorroboration,
  checkRelevance,
  ageDays,
  RECENCY_WINDOW_DAYS,
  STALE_DAYS,
} from './verify-intel-sources.js';

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const LIMIT = parseInt(getArg('--limit', '2000'), 10);
const TOP = parseInt(getArg('--top', '15'), 10);

function classifyUnverifiedReason(s, corrob) {
  if (!s.team) return 'no_team_extracted';
  if (corrob.corroborating_sources >= 1 && /not yet corroborated/.test(corrob.reason || '')) return 'single_source';
  return 'stale_uncorroborated';
}

async function main() {
  console.log(`Unverified-signal triage — limit=${LIMIT}, top=${TOP} per bucket\n`);

  const [researchSignals, podcastSignals] = await Promise.all([
    fetchResearchSignals(LIMIT),
    fetchPodcastSignals(LIMIT),
  ]);
  const allSignals = [...researchSignals, ...podcastSignals];
  const corroboration = summarizeCorroboration(allSignals, RECENCY_WINDOW_DAYS);

  const buckets = { single_source: [], no_team_extracted: [], stale_uncorroborated: [] };

  for (const s of allSignals) {
    const relevance = checkRelevance(s.text);
    if (!relevance.relevant) continue; // rejected, not unverified — out of scope here
    const age = ageDays(s.timestamp);
    if (age != null && age > STALE_DAYS) continue; // stale takes priority in the real script
    const corrob = corroboration.get(`${s.source_table}:${s.source_id}`) || { status: 'unverified', reason: 'no team extracted', corroborating_sources: 0 };
    if (corrob.status !== 'unverified') continue;

    const bucket = classifyUnverifiedReason(s, corrob);
    buckets[bucket].push({ ...s, age_days: age, corrob_reason: corrob.reason });
  }

  console.log('─── Unverified bucket breakdown ─────────────────────');
  console.log(`  single_source (1 fresh source, no 2nd opinion yet)   ${buckets.single_source.length}`);
  console.log(`  no_team_extracted (extractTeam() found nothing)      ${buckets.no_team_extracted.length}`);
  console.log(`  stale_uncorroborated (aged out before corroborated)  ${buckets.stale_uncorroborated.length}`);
  console.log(`  total unverified                                     ${buckets.single_source.length + buckets.no_team_extracted.length + buckets.stale_uncorroborated.length}\n`);

  console.log(`─── single_source — top ${Math.min(TOP, buckets.single_source.length)} by confidence, then recency ───`);
  console.log('    (best candidates to sanity-check right now — most likely to firm up)\n');
  buckets.single_source
    .sort((a, b) => (b.confidence ?? -1) - (a.confidence ?? -1) || (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0))
    .slice(0, TOP)
    .forEach((s) => {
      const conf = s.confidence != null ? `conf ${s.confidence}` : 'conf n/a';
      const age = s.age_days != null ? `${Math.round(s.age_days)}d old` : 'age n/a';
      console.log(`  [${s.source_table}:${s.source_id}] (${s.team}/${s.market}, ${conf}, ${age}, ${s.source_name})`);
      console.log(`    ${s.text.slice(0, 140)}`);
    });

  console.log(`\n─── no_team_extracted — top ${Math.min(TOP, buckets.no_team_extracted.length)} (fix in extractTeam/normalizeTeam) ───\n`);
  buckets.no_team_extracted.slice(0, TOP).forEach((s) => {
    console.log(`  [${s.source_table}:${s.source_id}] ${s.text.slice(0, 140)}`);
  });

  console.log(`\n─── stale_uncorroborated — ${buckets.stale_uncorroborated.length} total, not sampled (low review value) ───`);
  console.log('    These aged out of the recency window without a 2nd source ever showing up.');
  console.log('    Fastest fix isn\'t reading them one by one — it\'s widening corroboration');
  console.log('    sources (Twitter/X bookmarks + the Antigravity corpus aren\'t wired into');
  console.log('    this check yet per docs/specs/CANONICAL_DATA_LAYER_AUDIT_2026-08-30.md).');
  console.log('    Re-run this script after that bridge lands and this count should drop.\n');
}

main().catch((e) => { console.error('✖', e.message); process.exit(1); });
