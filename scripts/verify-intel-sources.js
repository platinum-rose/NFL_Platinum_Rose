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
export const STALE_DAYS = parseInt(getArg('--stale-days', '45'), 10);
export const RECENCY_WINDOW_DAYS = parseInt(getArg('--recency-window-days', '21'), 10);

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
  // pro leagues
  'nba', 'nhl', 'mlb', 'ncaa basketball', 'college basketball', 'march madness',
  'cavaliers', 'pistons', 'celtics', 'warriors', 'lakers', 'yankees', 'dodgers',
  'red sox', 'nuggets', 'timberwolves', 'thunder', 'mavericks', 'clippers',
  'nba playoffs', 'nhl playoffs', 'stanley cup', 'world series', 'nba finals',
  'padres', 'mariners', 'sparks', // WNBA/MLB names seen live in the feed
  // college football (shares Saturday-fall betting-content feeds with NFL,
  // but is a different sport entirely) — found live 2026-08-30: "Wake Forest
  // TOLEDO +10", "VSiN College Football Betting Guide", etc.
  'college football', 'ncaaf', 'cfb', 'bowl game', 'heisman',
  // golf, soccer/World Cup, tennis, motorsport, combat sports — all seen
  // live in the same aggregator feeds
  'british open', 'pga', 'masters tournament', 'ryder cup', 'dechambeau',
  'world cup', 'premier league', 'champions league', 'uefa', 'fifa', 'la liga',
  'wimbledon', 'us open tennis', 'nascar', 'formula 1', 'grand prix',
  'ufc', 'boxing match',
];
const NFL_KEYWORDS = [
  'nfl', 'super bowl', 'quarterback', 'touchdown', 'field goal', 'preseason',
  'training camp', 'gm', 'head coach', 'offensive line', 'defensive line',
  'wide receiver', 'running back', 'cornerback', 'linebacker', 'tight end',
  // NFL-specific conference/award shorthand — unambiguous (college
  // conferences are SEC/ACC/Big Ten/etc, never "AFC"/"NFC"), and these
  // headlines routinely name a division/award with no other NFL keyword
  // present at all. Caught live 2026-08-30: "Who Will be the NFC West
  // Champion According to Polymarket?" was falsely rejected without these.
  'afc', 'nfc', 'mvp', 'oroy', 'droy', 'opoy', 'dpoy',
  'rookie of the year', 'coach of the year', 'offensive rookie', 'defensive rookie',
];

// A signal only counts as relevant when it carries POSITIVE evidence of NFL
// content (an NFL keyword, or a matched NFL team). The absence of both an
// NFL signal and a known non-NFL keyword used to default to "relevant" —
// that was the bug: this repo's own feed comments admit at least one feed
// ("Action Network") mixes sports, and the NON_NFL_KEYWORDS list can never
// be exhaustive. Live sample caught by triage-unverified-intel.js on
// 2026-08-30: college football lines, a British Open recap, and a World Cup
// final preview were all sitting in `unverified` because neither list
// matched — they should have been `rejected`. Requiring a positive NFL
// signal, rather than requiring a matched non-NFL keyword to reject, closes
// that gap without needing NON_NFL_KEYWORDS to cover every other sport.
export function checkRelevance(text, sourceTable) {
  // podcast_host_summaries is NOT a mixed-sport feed — it's produced by
  // agents/podcast-host-summary.js from named NFL podcasts/episodes only
  // (see that file's header). Its rows are short structured fragments
  // (player name + enum market label, e.g. "Josh Allen — MVP — ...") that
  // legitimately have no "nfl"/"quarterback"-type keyword and no team name
  // in them at all (an MVP or receiving-yards-leader lean names a player,
  // not a team). Applying the keyword filter there produced real false
  // rejects (Josh Allen MVP, AJ Brown receiving yards, a draft prospect's
  // ROY lean) during testing on 2026-08-30. Trust the source instead —
  // fidelity is already checked separately via the `fidelity` fields
  // fetchPodcastSignals() attaches (has_quote / has_subject / confidence
  // well-formed).
  if (sourceTable === 'podcast_host_summaries') {
    return { relevant: true, reason: 'podcast_source_trusted_nfl_only' };
  }
  const t = (text || '').toLowerCase();
  const hasNonNfl = NON_NFL_KEYWORDS.some((k) => t.includes(k));
  const hasNflSignal = NFL_KEYWORDS.some((k) => t.includes(k)) || !!extractTeam(text);
  if (hasNflSignal && hasNonNfl) return { relevant: true, reason: 'mixed_content_flagged', flagged: true };
  if (hasNflSignal) return { relevant: true, reason: 'nfl_keywords_matched' };
  if (hasNonNfl) return { relevant: false, reason: 'non_nfl_content' };
  return { relevant: false, reason: 'no_nfl_signal_found' };
}

// ─── Check 2: freshness ────────────────────────────────────────────────────
export function ageDays(iso) {
  if (!iso) return null;
  const ms = Date.now() - Date.parse(iso);
  return Number.isFinite(ms) ? ms / 86400000 : null;
}

// ─── team extraction (best-effort, used for corroboration grouping only) ──
export function extractTeam(text) {
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

// ─── market extraction (used to scope corroboration/conflict comparisons —
// a "favor" on the Super Bowl and a "fade" on the win total are not a
// conflict, they're two different bets on the same team) ─────────────────
const MARKET_PATTERNS = [
  [/super\s*bowl/i, 'superbowl'],
  [/\b(afc|nfc)\s*(championship|conference)?\b|\bconference\b/i, 'conference'],
  [/\bdivision(al)?\b/i, 'division'],
  [/\bplayoffs?\b|\bmake.the.playoffs?\b/i, 'playoffs'],
  [/\bwin.total|\bregular.season.wins|\bover\/under.*wins|\bwins\b/i, 'wins'],
  [/\bmvp\b|\bopoy\b|\bdpoy\b|\brookie.of.the.year\b|\bcoach.of.the.year\b|\boroy\b|\bdroy\b/i, 'award'],
  [/\bspread\b|\bpoint.spread\b|\bats\b|[+-]\d+(\.\d+)?\b/, 'spread'],
  [/\btotal\b|\bover\/under\b|\bo\/u\b/i, 'total'],
  [/\bmoneyline\b|\bml\b/i, 'moneyline'],
];

export function extractMarket(text, explicitMarket) {
  if (explicitMarket) return String(explicitMarket).toLowerCase().replace(/[^a-z]+/g, '_');
  const t = String(text || '');
  for (const [pattern, label] of MARKET_PATTERNS) {
    if (pattern.test(t)) return label;
  }
  return 'general';
}

export async function fetchResearchSignals(limit) {
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
    market: extractMarket([r.team_or_market, r.rationale].filter(Boolean).join(' ')),
  }));
}

export async function fetchPodcastSignals(limit) {
  const { data, error } = await sb
    .from('podcast_host_summaries')
    .select('id, host, futures, created_at, vault_path')
    .limit(limit);
  if (error) throw new Error(`podcast_host_summaries: ${error.message}`);
  const rows = [];
  for (const r of data || []) {
    const futures = Array.isArray(r.futures) ? r.futures : [];
    futures.forEach((f, idx) => {
      rows.push({
        source_table: 'podcast_host_summaries',
        // NOT String(r.id) alone — an episode summary carries many future
        // mentions (one row, many array entries) and every mention shared
        // the parent's id, which collided on the (source_table, source_id)
        // unique constraint the first time --write ran against migration
        // 049 ("ON CONFLICT DO UPDATE command cannot affect row a second
        // time"). Suffix with the array index to give each mention its own
        // identity — stable across re-runs since `futures` order comes
        // straight from the stored jsonb column.
        source_id: `${r.id}:${idx}`,
        text: [f.subject, f.subject_market, f.quote].filter(Boolean).join(' — '),
        source_name: f.host || r.host || 'unknown',
        lean_direction: (f.lean || '').toLowerCase() || null,
        confidence: f.confidence,
        timestamp: r.created_at,
        team: extractTeam(f.subject) || extractTeam(f.subject_market),
        market: extractMarket(f.subject_market, f.subject_market),
        fidelity: {
          has_quote: !!(f.quote && f.quote.length >= 20),
          has_subject: !!f.subject,
          confidence_well_formed: typeof f.confidence === 'number' && f.confidence >= 0 && f.confidence <= 100,
        },
      });
    });
  }
  return rows;
}

const OPPOSING_DIRECTIONS = [['favor', 'fade'], ['over', 'under'], ['back', 'fade']];

export function summarizeCorroboration(allSignals, recencyWindowDays) {
  // Group by (team, market) — not team alone. A "favor" on the Super Bowl and
  // a "fade" on the win total for the same team are two different bets, not
  // a contradiction. Within each group, only compare DIRECTION among signals
  // that fall inside a recency window of the group's most recent signal —
  // a host taking the Browns "over" in February and another taking them
  // "under" in August aren't disagreeing, the roster changed. The February
  // take gets marked superseded, not conflicting.
  const byGroup = new Map();
  for (const s of allSignals) {
    if (!s.team) continue;
    const key = `${s.team}|${s.market || 'general'}`;
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key).push(s);
  }

  const results = new Map(); // source_table:source_id -> {status, reason, corroborating_sources}
  for (const [groupKey, signals] of byGroup) {
    const [team, market] = groupKey.split('|');
    const timestamps = signals.map((s) => Date.parse(s.timestamp)).filter(Number.isFinite);
    const mostRecent = timestamps.length ? Math.max(...timestamps) : null;
    const windowMs = recencyWindowDays * 86400000;

    const recent = signals.filter((s) => {
      const t = Date.parse(s.timestamp);
      return mostRecent != null && Number.isFinite(t) && (mostRecent - t) <= windowMs;
    });
    const older = signals.filter((s) => !recent.includes(s));

    const recentDistinctSources = new Set(recent.map((s) => `${s.source_table}:${s.source_name}`));
    const recentDirections = new Set(recent.map((s) => s.lean_direction).filter(Boolean));
    const hasConflict = OPPOSING_DIRECTIONS.some(([a, b]) => recentDirections.has(a) && recentDirections.has(b));

    for (const s of recent) {
      const key = `${s.source_table}:${s.source_id}`;
      if (hasConflict) {
        results.set(key, { status: 'conflicting', reason: `sources disagree on ${team} (${market}) within the last ${recencyWindowDays}d`, corroborating_sources: recentDistinctSources.size });
      } else if (recentDistinctSources.size >= 2) {
        results.set(key, { status: 'verified', reason: `${recentDistinctSources.size} independent sources agree on ${team} (${market})`, corroborating_sources: recentDistinctSources.size });
      } else {
        results.set(key, { status: 'unverified', reason: `only 1 recent source on ${team} (${market}), not yet corroborated`, corroborating_sources: 1 });
      }
    }
    // Older signals in the same (team, market) group whose direction no longer
    // matches the recent consensus are superseded, not "conflicting" — they
    // were a real take at the time, just outdated by newer analysis.
    for (const s of older) {
      const key = `${s.source_table}:${s.source_id}`;
      const disagreesWithRecent = s.lean_direction && recentDirections.size &&
        OPPOSING_DIRECTIONS.some(([a, b]) => (recentDirections.has(a) && s.lean_direction === b) || (recentDirections.has(b) && s.lean_direction === a));
      if (disagreesWithRecent) {
        results.set(key, { status: 'stale', reason: `earlier take on ${team} (${market}) superseded by newer analysis`, corroborating_sources: 0 });
      } else if (!results.has(key)) {
        results.set(key, { status: 'unverified', reason: `older signal on ${team} (${market}), outside the ${recencyWindowDays}d recency window`, corroborating_sources: 0 });
      }
    }
  }
  return results;
}

async function main() {
  console.log(`Layer 2 verification run — ${WRITE ? 'WRITE mode' : 'DRY RUN (no writes)'}, limit=${LIMIT}, stale-days=${STALE_DAYS}, recency-window-days=${RECENCY_WINDOW_DAYS}\n`);

  const [researchSignals, podcastSignals] = await Promise.all([
    fetchResearchSignals(LIMIT),
    fetchPodcastSignals(LIMIT),
  ]);
  const allSignals = [...researchSignals, ...podcastSignals];
  console.log(`Fetched ${researchSignals.length} research_pick_signals rows, ${podcastSignals.length} podcast_host_summaries future-mentions.\n`);

  const corroboration = summarizeCorroboration(allSignals, RECENCY_WINDOW_DAYS);

  const finalResults = [];
  const tally = { verified: 0, stale: 0, unverified: 0, conflicting: 0, rejected: 0 };
  const rejectedSamples = [];
  const conflictSamples = [];

  for (const s of allSignals) {
    const relevance = checkRelevance(s.text, s.source_table);
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

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error('✖', e.message); process.exit(1); });
}

