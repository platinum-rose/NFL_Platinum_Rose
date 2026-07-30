// agents/portfolio-dossier.js
// ═══════════════════════════════════════════════════════════════════════════════
// Portfolio Analysis Dossier assembler (S274)
//
// Pre-computes the decision-relevant market structure into ONE compact payload a
// top-tier model can reason over — the input side of the A/B portfolio pass.
// Per market/team: vig-stripped fair prob, cross-book divergence, best price+book,
// line movement, per-market normalized lean (with analyst attribution), prior-year
// record grounding, plus an `experts` roster and `adjacent_signals` for correlation.
//
// Output: .nfl/portfolio/dossier-<date>.json { meta, synthesis_input, experts,
//         adjacent_signals, detail }  and a .md summary.
//
// Usage: node agents/portfolio-dossier.js [--season 2026] [--since <ISO>]
//        [--model gpt-4o] [--signals <path>]
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ═══════════════════════════════════════════════════════════════════════════════

import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { normalizeTeam } from '../src/lib/teams.js';
import { classifyMove, devigPair, fitWinDist, probOverLine, tailTable } from './lib/win-dist.js';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, '.nfl', 'portfolio');

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const SEASON = parseInt(getArg('--season', '2026'), 10);
const SINCE = getArg('--since', null);
const MODEL = getArg('--model', 'gpt-4o');
const SIGNALS_PATH = getArg('--signals', null);

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SB_URL || !SB_KEY) { console.error('✖ Need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env'); process.exit(1); }
const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });

// ── odds math ────────────────────────────────────────────────────────────────
const americanToProb = (a) => {
  if (a == null || Number.isNaN(a)) return null;
  return a > 0 ? 100 / (a + 100) : -a / (-a + 100);
};
const probToAmerican = (p) => {
  if (!p || p <= 0 || p >= 1) return null;
  return p >= 0.5 ? -Math.round((p / (1 - p)) * 100) : Math.round(((1 - p) / p) * 100);
};
// decimal payout multiplier per unit staked (e.g. +150 -> 2.5x, -110 -> 1.909x)
const decimalPayout = (price) => (price == null ? null : (price > 0 ? price / 100 + 1 : 100 / Math.abs(price) + 1));
// edge_pct definition shared with portfolio-synthesize.js's contract: fair_prob*payout - 1, in %
const edgePctFromFair = (fairProb, price) => (fairProb == null || price == null) ? null : round((fairProb * decimalPayout(price) - 1) * 100, 2);
const median = (xs) => {
  const s = xs.filter((x) => x != null).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const round = (x, n = 4) => (x == null ? null : Number(x.toFixed(n)));

const MULTIWAY = new Set(['superbowl', 'conference_afc', 'conference_nfc',
  'division_afc_east', 'division_afc_north', 'division_afc_south', 'division_afc_west',
  'division_nfc_east', 'division_nfc_north', 'division_nfc_south', 'division_nfc_west',
  'most_wins', 'least_wins', 'superbowl_matchup', 'division_exact_position']);
// 2026-07-22 fix (Codex review): the hardcoded MULTIWAY set above never
// included award_* markets (award_mvp, award_opoy, etc. — one book/vig pool
// per award, same structural shape as division/conference/superbowl). Without
// this, award odds entering futures_odds_snapshots would get devigged as if
// single-outcome, silently wrong. isMultiway() is used everywhere MULTIWAY.has()
// used to be checked directly.
const isMultiway = (mk) => MULTIWAY.has(mk) || mk.startsWith('award_');
const MAX_QUOTE_AGE_HOURS = Number(process.env.FUTURES_MAX_QUOTE_AGE_HOURS || 72);

// Books the user can actually place at (BKR/BEO/BetUS directly; Vegas books via a
// proxy). FanDuel/DraftKings are EXCLUDED from best-price selection — they still
// inform fair value/divergence, but are never offered as the price to bet.
// Override with BETTABLE_BOOKS env (comma-separated book keys).
const BETTABLE_BOOKS = new Set((process.env.BETTABLE_BOOKS
  || 'bookmaker,betonline,betus,betmgm,caesars,williamhill_us,williamhill,circa,mgm')
  .split(',').map((s) => s.trim().toLowerCase()));

function normalizeBook(book) {
  return String(book || '?').trim().toLowerCase();
}
function quoteAgeHours(observedAt, asOf = new Date()) {
  const t = observedAt ? new Date(observedAt).getTime() : NaN;
  if (!Number.isFinite(t)) return null;
  return round((asOf.getTime() - t) / 36e5, 2);
}
function quoteMeta(row, asOf = new Date()) {
  const observedAt = row?.snapshot_time || row?.captured_at || null;
  const ageHours = quoteAgeHours(observedAt, asOf);
  return {
    observed_at: observedAt,
    quote_age_hours: ageHours,
    availability_status: ageHours == null ? 'missing_observed_at' : (ageHours <= MAX_QUOTE_AGE_HOURS ? 'current' : 'stale'),
    source_row_id: [
      row?.market_type,
      row?.team,
      row?.selection,
      row?.book,
      observedAt,
    ].filter(Boolean).join('|') || null,
  };
}
function freshnessRank(meta) {
  if (!meta) return -1;
  if (meta.availability_status === 'current') return 2;
  if (meta.availability_status === 'missing_observed_at') return 0;
  return 1;
}
function isBetterOffer(price, meta, bestPrice, bestMeta) {
  if (price == null) return false;
  if (bestPrice == null) return true;
  if (price !== bestPrice) return price > bestPrice;
  const rank = freshnessRank(meta);
  const bestRank = freshnessRank(bestMeta);
  if (rank !== bestRank) return rank > bestRank;
  const age = meta?.quote_age_hours;
  const bestAge = bestMeta?.quote_age_hours;
  if (age != null && bestAge != null && age !== bestAge) return age < bestAge;
  return false;
}
function parseWinSideLabel(label) {
  const m = String(label || '').match(/^(.+?)\s+(Over|Under)\s+(\d+(?:\.\d+)?)\s*$/i);
  if (!m) return null;
  const team = normalizeTeam(m[1]) || m[1].trim();
  return { team, side: m[2].toLowerCase(), line: Number(m[3]) };
}
function parsePlayoffSideLabel(label) {
  const m = String(label || '').match(/^(.+?)\s+(Yes|No)\s*$/i);
  if (!m) return null;
  const team = normalizeTeam(m[1]) || m[1].trim();
  return { team, side: m[2].toLowerCase() };
}
function parseExactPositionLabel(label) {
  const m = String(label || '').match(/^(.+?)\s+(1st|2nd|3rd|4th)$/i);
  if (!m) return null;
  const team = normalizeTeam(m[1]) || m[1].trim();
  return { team, position: m[2].toLowerCase() };
}
function canonicalizeSnapshots(snaps) {
  const out = [];
  const wins = new Map();
  const playoffs = new Map();
  for (const r of snaps || []) {
    const mk = r.market_type;
    const book = normalizeBook(r.book);
    const when = r.snapshot_time || r.captured_at || '';
    if (mk === 'wins') {
      const parsed = parseWinSideLabel(r.team) || parseWinSideLabel(r.selection);
      if (parsed && r.line == null && r.over_price == null && r.under_price == null) {
        const key = [mk, parsed.team, book, when, parsed.line].join('|');
        const e = wins.get(key) || { ...r, team: parsed.team, selection: parsed.team, book, line: parsed.line, odds: null, price: null, implied_prob: null, over_price: null, under_price: null, _legacy_side_rows: [] };
        if (parsed.side === 'over') e.over_price = r.price ?? r.odds;
        if (parsed.side === 'under') e.under_price = r.price ?? r.odds;
        e._legacy_side_rows.push({ side: parsed.side, label: r.team || r.selection, price: r.price ?? r.odds, observed_at: when });
        wins.set(key, e);
        continue;
      }
    }
    if (mk === 'playoffs') {
      const parsed = parsePlayoffSideLabel(r.team) || parsePlayoffSideLabel(r.selection);
      if (parsed) {
        const key = [mk, parsed.team, book, when].join('|');
        const e = playoffs.get(key) || { ...r, team: parsed.team, selection: 'Yes', book, odds: null, price: null, implied_prob: null, yes_price: null, no_price: null, _legacy_side_rows: [] };
        if (parsed.side === 'yes') {
          e.yes_price = r.price ?? r.odds;
          e.price = r.price ?? r.odds;
          e.odds = r.odds ?? r.price;
          e.implied_prob = r.implied_prob ?? americanToProb(e.price);
        }
        if (parsed.side === 'no') e.no_price = r.price ?? r.odds;
        e._legacy_side_rows.push({ side: parsed.side, label: r.team || r.selection, price: r.price ?? r.odds, observed_at: when });
        playoffs.set(key, e);
        continue;
      }
    }
    if (mk === 'division_exact_position') {
      const parsed = parseExactPositionLabel(r.team) || parseExactPositionLabel(r.selection);
      if (parsed) out.push({ ...r, team: `${parsed.team} ${parsed.position}`, selection: parsed.position, exact_position: parsed.position, exact_position_team: parsed.team, book });
      else out.push({ ...r, book });
      continue;
    }
    if (mk === 'wins' || mk === 'playoffs') {
      const team = normalizeTeam(r.team) || r.team;
      out.push({ ...r, team, selection: normalizeTeam(r.selection) || r.selection || team, book });
      continue;
    }
    out.push({ ...r, book });
  }
  out.push(...wins.values(), ...playoffs.values());
  return out;
}

// ── fetchers ───────────────────────────────────────────────────────────────
async function fetchSnapshots() {
  const PAGE = 1000; let from = 0; const all = [];
  for (;;) {
    let q = sb.from('futures_odds_snapshots')
      .select('market_type, team, selection, book, odds, price, implied_prob, line, over_price, under_price, snapshot_time, season')
      .eq('season', SEASON).order('snapshot_time', { ascending: true }).range(from, from + PAGE - 1);
    if (SINCE) q = q.gte('snapshot_time', SINCE);
    const { data, error } = await q;
    if (error) throw new Error(`snapshots: ${error.message}`);
    all.push(...(data || []));
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}
async function fetchPickSignals() {
  const { data } = await sb.from('research_pick_signals')
    .select('source, author, team_or_market, bet_type, lean, rationale, confidence, captured_at')
    .order('captured_at', { ascending: false }).limit(1000);
  return data || [];
}
async function fetchUserPicks() {
  const { data } = await sb.from('user_picks')
    .select('source, pick_type, selection, home, visitor, line, confidence, expert, rationale, created_at, result')
    .order('created_at', { ascending: false }).limit(1000);
  return data || [];
}
// Injuries as a first-class batch signal (2026-07-22, Codex review). Table:
// player_injuries (migration 016, ESPN-sourced, ingested Mon/Wed/Thu/Fri).
// Rolls up to team + POSITION-GROUP granularity (QB/OL/EDGE/CB/skill) — this
// table has no depth-chart rank, so true "WR1 vs WR3" precision Codex asked
// for isn't available here without a join to nfl_rosters.depth_chart_position;
// noted as a known limitation rather than faked. Filters out benign "Active"
// news items — this feed logs a lot of noise-tier entries alongside real
// absences, and only Out/Doubtful/IR/PUP/Questionable are decision-relevant.
const INJURY_POSITION_GROUPS = {
  QB: 'QB',
  T: 'OL', G: 'OL', C: 'OL', OL: 'OL', OT: 'OL', OG: 'OL',
  DE: 'EDGE', OLB: 'EDGE', EDGE: 'EDGE',
  CB: 'CB', DB: 'CB',
  WR: 'skill', RB: 'skill', TE: 'skill', FB: 'skill',
};
const INJURY_RELEVANT_STATUS = new Set(['out', 'doubtful', 'ir', 'pup', 'questionable']);
async function fetchInjuryContext() {
  const { data, error } = await sb.from('player_injuries')
    .select('espn_player_id, player_name, team_abbr, position, injury_status, injury_type, reported_at, captured_at')
    .order('captured_at', { ascending: false })
    .limit(2000);
  if (error) { console.warn(`   ⚠ player_injuries: ${error.message} — injury context disabled`); return {}; }

  // de-dup to the latest report per player (rows already newest-first)
  const seen = new Set();
  const latest = [];
  for (const r of data || []) {
    const k = r.espn_player_id || `${r.player_name}|${r.team_abbr}`;
    if (seen.has(k)) continue;
    seen.add(k); latest.push(r);
  }

  const byTeam = {};
  for (const r of latest) {
    const status = (r.injury_status || '').toLowerCase();
    if (!INJURY_RELEVANT_STATUS.has(status)) continue;
    const nick = normalizeTeam(r.team_abbr); if (!nick) continue;
    const group = INJURY_POSITION_GROUPS[(r.position || '').toUpperCase()] || 'other';
    const t = (byTeam[nick] ??= { injury_count: 0, key_position_flags: new Set(), qb_status: null, most_recent: null, players: [] });
    t.injury_count++;
    if (group !== 'other') t.key_position_flags.add(group);
    if (group === 'QB') t.qb_status = r.injury_status; // most recent QB report wins (rows are newest-first)
    const ts = r.reported_at || r.captured_at;
    if (ts && (!t.most_recent || new Date(ts) > new Date(t.most_recent))) t.most_recent = ts;
    if (t.players.length < 8) t.players.push({ name: r.player_name, position: r.position, status: r.injury_status, type: r.injury_type });
  }
  const out = {};
  for (const [team, t] of Object.entries(byTeam)) {
    out[team] = {
      injury_count: t.injury_count,
      key_position_flags: [...t.key_position_flags],
      qb_status: t.qb_status,
      freshness: t.most_recent,
      players: t.players,
    };
  }
  return out;
}
async function fetchPodcastIntel() {
  const { data } = await sb.from('podcast_transcripts')
    .select('intel, picks, processed_at, podcast_episodes ( title, pub_date )')
    .order('processed_at', { ascending: false }).limit(300);
  return data || [];
}
// prior-year performance + current-form analytics — grounds bounce-back theses
// in facts, not model memory. Extended S296-follow-up (2026-07-22) to also pull
// EPA/formation-tendency columns (migration 014/015) that were already in this
// table but never surfaced to the synthesis model — previously only wins/
// losses/ATS made it into the dossier.
async function fetchTeamStats() {
  let data = null;
  for (const cols of [
    'team, season, wins, losses, ats_wins, ats_losses, off_epa_per_play, def_epa_per_play, off_epa_rank, def_epa_rank, shotgun_rate, no_huddle_rate, pass_rate',
    'team, season, wins, losses, ats_wins, ats_losses',
    'team, season, ats_wins, ats_losses',
  ]) {
    const r = await sb.from('nfl_team_season_stats').select(cols).gte('season', 2023).lte('season', SEASON);
    if (!r.error) { data = r.data; break; }
  }
  const byTeam = {}; // canonical nickname -> [{season,wins,losses,ats_wins,ats_losses,off_epa_per_play,...}], season-desc
  for (const r of data || []) {
    const nick = normalizeTeam(r.team); if (!nick) continue;
    (byTeam[nick] ??= []).push(r);
  }
  for (const k of Object.keys(byTeam)) byTeam[k].sort((a, b) => b.season - a.season);
  return byTeam;
}
// Most-recent-season EPA/formation snapshot for a team, or null if the table
// has no row with those columns populated yet (common for a season in progress
// before enough games have been played to seed nfl_team_season_stats).
function currentAnalytics(seasons) {
  if (!seasons || !seasons.length) return null;
  const r = seasons[0]; // already sorted season-desc by fetchTeamStats
  if (r.off_epa_per_play == null && r.def_epa_per_play == null) return null;
  return {
    season: r.season,
    off_epa_per_play: r.off_epa_per_play ?? null,
    def_epa_per_play: r.def_epa_per_play ?? null,
    off_epa_rank: r.off_epa_rank ?? null,
    def_epa_rank: r.def_epa_rank ?? null,
    shotgun_rate: r.shotgun_rate ?? null,
    no_huddle_rate: r.no_huddle_rate ?? null,
    pass_rate: r.pass_rate ?? null,
  };
}
function latestByTeam(rows, mapRow) {
  const out = {};
  for (const r of rows || []) {
    const nick = normalizeTeam(r.team);
    if (!nick || out[nick]) continue;
    out[nick] = mapRow(r);
  }
  return out;
}
async function loadGeneratedProfileRows(prefix) {
  const dir = path.join(ROOT, 'data', 'generated', 'team-profiles');
  try {
    const files = (await readdir(dir))
      .filter((name) => name.startsWith(prefix) && name.endsWith('.json') && name.includes(String(SEASON)));
    const payloads = [];
    for (const file of files) {
      try {
        const payload = JSON.parse(await readFile(path.join(dir, file), 'utf8'));
        if (Array.isArray(payload.rows) && Number(payload.meta?.season) === SEASON) {
          payloads.push({ file, generated_at: payload.meta?.generated_at || '', rows: payload.rows });
        }
      } catch {
        // Ignore malformed local review artifacts; Supabase remains primary.
      }
    }
    payloads.sort((a, b) => String(b.generated_at).localeCompare(String(a.generated_at)));
    return payloads[0]?.rows || [];
  } catch {
    return [];
  }
}
async function fetchTrainingCampIntel() {
  const latestPath = path.join(ROOT, 'data', 'training-camp', String(SEASON), 'latest.json');
  try {
    const raw = await readFile(latestPath, 'utf8');
    const parsed = JSON.parse(raw);
    const byTeam = {};
    if (parsed && parsed.teams) {
      for (const [team, value] of Object.entries(parsed.teams)) {
        const norm = normalizeTeam(team);
        if (!norm) continue;
        const items = Array.isArray(value) ? value : (value.items || []);
        const compactItems = items.slice(0, 5).map((it) => ({
          id: it.id,
          signal_type: it.signal_type,
          summary: it.summary,
          source: it.source,
          published_at: it.published_at,
          signal_strength: it.signal_strength,
          confidence: it.confidence,
          linked_markets: it.linked_markets || [],
        }));
        byTeam[norm] = {
          snapshot_at: parsed.meta?.generated_at || parsed.snapshot_at || null,
          items_count: items.length,
          high_priority_count: items.filter((x) => (x.signal_strength || 0) >= 0.7).length,
          nuggets: compactItems,
        };
      }
    }
    return byTeam;
  } catch (_err) {
    return {};
  }
}

async function fetchPlayerAvailabilityContext() {
  const latestPath = path.join(ROOT, 'data', 'player-availability', 'latest.json');
  try {
    const parsed = JSON.parse(await readFile(latestPath, 'utf8'));
    const byTeam = {};
    for (const [abbr, team] of Object.entries(parsed.teams || {})) {
      const nick = normalizeTeam(abbr);
      if (!nick) continue;
      const events = team.events || [];
      const improving = events
        .filter((event) => event.availability_trend === 'improving')
        .slice(0, 6)
        .map((event) => ({
          player_name: event.player_name,
          position: event.position,
          event_type: event.event_type,
          impact_bucket: event.impact_bucket,
          summary: event.short_summary,
          source: event.source,
          published_at: event.published_at,
          needs_human_review: event.needs_human_review,
        }));
      const worsening = events
        .filter((event) => event.availability_trend === 'worsening')
        .slice(0, 6)
        .map((event) => ({
          player_name: event.player_name,
          position: event.position,
          event_type: event.event_type,
          status: event.normalized_status,
          impact_bucket: event.impact_bucket,
          summary: event.short_summary,
          source: event.source,
          published_at: event.published_at,
          needs_human_review: event.needs_human_review,
        }));
      const snapCountRisks = events
        .filter((event) => /limited|snap_count/.test(event.event_type) || /snap count|limited snap|pitch count/i.test(event.short_summary || ''))
        .slice(0, 6)
        .map((event) => ({
          player_name: event.player_name,
          position: event.position,
          event_type: event.event_type,
          summary: event.short_summary,
          source: event.source,
          published_at: event.published_at,
        }));
      const mapAvailabilityEvent = (event) => ({
        player_name: event.player_name,
        position: event.position,
        event_type: event.event_type,
        status: event.normalized_status,
        impact_bucket: event.impact_bucket,
        availability_group: event.availability_group,
        summary: event.short_summary,
        source: event.source,
        published_at: event.published_at,
        needs_human_review: event.needs_human_review,
      });
      const offensiveLineRisks = events
        .filter((event) => event.availability_group === 'offensive_line' && event.availability_trend === 'worsening')
        .slice(0, 8)
        .map(mapAvailabilityEvent);
      const defensiveFrontRisks = events
        .filter((event) => event.availability_group === 'defensive_front' && event.availability_trend === 'worsening')
        .slice(0, 8)
        .map(mapAvailabilityEvent);
      byTeam[nick] = {
        snapshot_at: parsed.meta?.generated_at || null,
        event_count: team.event_count || events.length,
        improving_count: team.improving_count || 0,
        worsening_count: team.worsening_count || 0,
        major_count: team.major_count || 0,
        offensive_line_worsening_count: team.offensive_line_worsening_count || 0,
        defensive_front_worsening_count: team.defensive_front_worsening_count || 0,
        cluster_risks: team.cluster_risks || null,
        key_returns: improving,
        key_absences: worsening,
        snap_count_risks: snapCountRisks,
        offensive_line_risks: offensiveLineRisks,
        defensive_front_risks: defensiveFrontRisks,
        needs_human_review: events.some((event) => event.needs_human_review),
      };
    }
    return byTeam;
  } catch (_err) {
    return {};
  }
}

async function fetchAdvancedAnalytics() {
  const { data, error } = await sb.from('team_analytic_snapshots')
    .select('season, week, team, source_key, source_name, source_url, snapshot_at, games_played, off_epa_per_play, def_epa_per_play, off_epa_rank, def_epa_rank, epa_per_dropback, qb_epa_per_dropback, dropback_success_rate, success_rate, cpoe, explosive_play_rate, explosive_pass_rate, explosive_run_rate, pressure_rate_allowed, pressure_rate_generated, sack_rate_allowed, sack_rate_generated, neutral_pass_rate, early_down_pass_rate, shotgun_rate, no_huddle_rate, play_action_rate, motion_rate, attribution_note')
    .eq('season', SEASON)
    .order('snapshot_at', { ascending: false })
    .limit(2000);
  if (error) {
    console.warn(`   team_analytic_snapshots unavailable: ${error.message} - advanced analytics disabled`);
    const localRows = await loadGeneratedProfileRows('team-analytic-snapshots-');
    if (localRows.length) console.warn(`   using ${localRows.length} local generated analytics row(s)`);
    return latestByTeam(localRows, (r) => r);
  }
  if (!(data || []).length) {
    const localRows = await loadGeneratedProfileRows('team-analytic-snapshots-');
    if (localRows.length) console.warn(`   using ${localRows.length} local generated analytics row(s)`);
    return latestByTeam(localRows, (r) => r);
  }
  return latestByTeam(data, (r) => ({
    season: r.season ?? null,
    week: r.week ?? null,
    source_key: r.source_key ?? null,
    source_name: r.source_name ?? null,
    source_url: r.source_url ?? null,
    snapshot_at: r.snapshot_at ?? null,
    games_played: r.games_played ?? null,
    off_epa_per_play: r.off_epa_per_play ?? null,
    def_epa_per_play: r.def_epa_per_play ?? null,
    off_epa_rank: r.off_epa_rank ?? null,
    def_epa_rank: r.def_epa_rank ?? null,
    epa_per_dropback: r.epa_per_dropback ?? null,
    qb_epa_per_dropback: r.qb_epa_per_dropback ?? null,
    dropback_success_rate: r.dropback_success_rate ?? null,
    success_rate: r.success_rate ?? null,
    cpoe: r.cpoe ?? null,
    explosive_play_rate: r.explosive_play_rate ?? null,
    explosive_pass_rate: r.explosive_pass_rate ?? null,
    explosive_run_rate: r.explosive_run_rate ?? null,
    pressure_rate_allowed: r.pressure_rate_allowed ?? null,
    pressure_rate_generated: r.pressure_rate_generated ?? null,
    sack_rate_allowed: r.sack_rate_allowed ?? null,
    sack_rate_generated: r.sack_rate_generated ?? null,
    neutral_pass_rate: r.neutral_pass_rate ?? null,
    early_down_pass_rate: r.early_down_pass_rate ?? null,
    shotgun_rate: r.shotgun_rate ?? null,
    no_huddle_rate: r.no_huddle_rate ?? null,
    play_action_rate: r.play_action_rate ?? null,
    motion_rate: r.motion_rate ?? null,
    attribution_note: r.attribution_note ?? null,
  }));
}
async function fetchDvoaSnapshots() {
  const { data, error } = await sb.from('team_dvoa_snapshots')
    .select('season, week, team, source_key, source_name, source_url, snapshot_at, games_played, overall_dvoa, overall_dvoa_rank, offensive_dvoa, offensive_dvoa_rank, defensive_dvoa, defensive_dvoa_rank, special_teams_dvoa, special_teams_dvoa_rank, weighted_dvoa, weighted_dvoa_rank, attribution_note')
    .eq('season', SEASON)
    .order('snapshot_at', { ascending: false })
    .limit(2000);
  if (error) {
    console.warn(`   team_dvoa_snapshots unavailable: ${error.message} - DVOA disabled`);
    const localRows = await loadGeneratedProfileRows('team-dvoa-snapshots-');
    if (localRows.length) console.warn(`   using ${localRows.length} local generated DVOA row(s)`);
    return latestByTeam(localRows, (r) => r);
  }
  if (!(data || []).length) {
    const localRows = await loadGeneratedProfileRows('team-dvoa-snapshots-');
    if (localRows.length) console.warn(`   using ${localRows.length} local generated DVOA row(s)`);
    return latestByTeam(localRows, (r) => r);
  }
  return latestByTeam(data, (r) => ({
    season: r.season ?? null,
    week: r.week ?? null,
    source_key: r.source_key ?? null,
    source_name: r.source_name ?? null,
    source_url: r.source_url ?? null,
    snapshot_at: r.snapshot_at ?? null,
    games_played: r.games_played ?? null,
    overall_dvoa: r.overall_dvoa ?? null,
    overall_dvoa_rank: r.overall_dvoa_rank ?? null,
    offensive_dvoa: r.offensive_dvoa ?? null,
    offensive_dvoa_rank: r.offensive_dvoa_rank ?? null,
    defensive_dvoa: r.defensive_dvoa ?? null,
    defensive_dvoa_rank: r.defensive_dvoa_rank ?? null,
    special_teams_dvoa: r.special_teams_dvoa ?? null,
    special_teams_dvoa_rank: r.special_teams_dvoa_rank ?? null,
    weighted_dvoa: r.weighted_dvoa ?? null,
    weighted_dvoa_rank: r.weighted_dvoa_rank ?? null,
    attribution_note: r.attribution_note ?? null,
  }));
}
async function fetchCoachingProfiles() {
  const { data, error } = await sb.from('team_coaching_tendency_snapshots')
    .select('season, week, team, head_coach, offensive_coordinator, defensive_coordinator, source_key, source_name, source_url, snapshot_at, sample_start, sample_end, games_sample, coordinator_continuity, fourth_down_aggression_rate, fourth_down_aggression_tier, neutral_pass_rate, early_down_pass_rate, shotgun_rate, no_huddle_rate, play_action_rate, motion_rate, rpo_rate, pace_seconds_per_play, red_zone_pass_rate, two_minute_aggression_tier, ats_by_role, trend_notes, stale_after')
    .eq('season', SEASON)
    .order('snapshot_at', { ascending: false })
    .limit(2000);
  if (error) {
    console.warn(`   team_coaching_tendency_snapshots unavailable: ${error.message} - coaching profiles disabled`);
    const localRows = await loadGeneratedProfileRows('team-coaching-tendency-snapshots-');
    if (localRows.length) console.warn(`   using ${localRows.length} local generated coaching row(s)`);
    return latestByTeam(localRows, (r) => r);
  }
  if (!(data || []).length) {
    const localRows = await loadGeneratedProfileRows('team-coaching-tendency-snapshots-');
    if (localRows.length) console.warn(`   using ${localRows.length} local generated coaching row(s)`);
    return latestByTeam(localRows, (r) => r);
  }
  return latestByTeam(data, (r) => ({
    season: r.season ?? null,
    week: r.week ?? null,
    head_coach: r.head_coach ?? null,
    offensive_coordinator: r.offensive_coordinator ?? null,
    defensive_coordinator: r.defensive_coordinator ?? null,
    source_key: r.source_key ?? null,
    source_name: r.source_name ?? null,
    source_url: r.source_url ?? null,
    snapshot_at: r.snapshot_at ?? null,
    sample_start: r.sample_start ?? null,
    sample_end: r.sample_end ?? null,
    games_sample: r.games_sample ?? null,
    coordinator_continuity: r.coordinator_continuity ?? null,
    fourth_down_aggression_rate: r.fourth_down_aggression_rate ?? null,
    fourth_down_aggression_tier: r.fourth_down_aggression_tier ?? null,
    neutral_pass_rate: r.neutral_pass_rate ?? null,
    early_down_pass_rate: r.early_down_pass_rate ?? null,
    shotgun_rate: r.shotgun_rate ?? null,
    no_huddle_rate: r.no_huddle_rate ?? null,
    play_action_rate: r.play_action_rate ?? null,
    motion_rate: r.motion_rate ?? null,
    rpo_rate: r.rpo_rate ?? null,
    pace_seconds_per_play: r.pace_seconds_per_play ?? null,
    red_zone_pass_rate: r.red_zone_pass_rate ?? null,
    two_minute_aggression_tier: r.two_minute_aggression_tier ?? null,
    ats_by_role: r.ats_by_role ?? null,
    trend_notes: r.trend_notes ?? null,
    stale_after: r.stale_after ?? null,
  }));
}
function mergeAnalytics(base, advanced) {
  if (!base && !advanced) return null;
  return { ...(base || {}), ...(advanced || {}) };
}
// 2026 schedule spine — grounds strength-of-schedule in the ACTUAL released slate,
// not the model's (possibly stale) memory of who plays whom. Extended S296-follow-up
// to also carry the migration-039 game-context columns (rest/travel, div flag,
// referee, closing lines) needed for the new schedule/officiating/CLV signals below
// — same query, no extra round-trip, since SoS already needed this table.
async function fetchSchedule() {
  const { data, error } = await sb.from('games')
    .select('game_id, season, week, season_type, home_team, away_team, home_abbrev, away_abbrev, ' +
      'away_rest, home_rest, div_game, referee, closing_spread_line, closing_total_line')
    .eq('season', SEASON);
  if (error) { console.warn(`   ⚠ schedule: ${error.message} — SoS disabled`); return []; }
  return data || [];
}
// Earliest-tracked spread snapshot per game this season, for CLV comparison
// against games.closing_spread_line (migration 039's nflverse consensus close).
// Table: game_odds_snapshots — separate from futures_odds_snapshots (fetchSnapshots).
async function fetchGameOddsOpen() {
  const { data, error } = await sb.from('game_odds_snapshots')
    .select('game_id, season, week, home_team, away_team, market, spread, captured_at')
    .eq('season', SEASON).eq('market', 'spread')
    .order('captured_at', { ascending: true });
  if (error) { console.warn(`   ⚠ game_odds_snapshots: ${error.message} — CLV disabled`); return []; }
  const earliest = {}; // game key -> first row seen (rows already ordered oldest-first)
  for (const r of data || []) {
    const key = `${r.season}-${r.week}-${normalizeTeam(r.home_team)}-${normalizeTeam(r.away_team)}`;
    if (!(key in earliest)) earliest[key] = r;
  }
  return earliest;
}
// Latest betting-splits snapshot per game this season, for sharp-divergence
// (money% vs ticket%) as a CLV-adjacent signal. Table: game_splits_history
// (migration 024) — first tool/pipeline ever to read it for this purpose (S296).
async function fetchGameSplitsLatest() {
  const { data, error } = await sb.from('game_splits_history')
    .select('game_id, season, week, home_team, away_team, spread_home_bettors, spread_home_money, captured_at')
    .eq('season', SEASON)
    .order('captured_at', { ascending: true }); // oldest-first so the loop below keeps the LAST (latest) row per game
  if (error) { console.warn(`   ⚠ game_splits_history: ${error.message} — sharp-divergence disabled`); return {}; }
  const latest = {};
  for (const r of data || []) {
    const key = `${r.season}-${r.week}-${normalizeTeam(r.home_team)}-${normalizeTeam(r.away_team)}`;
    latest[key] = r; // overwritten each time -> ends up on the latest row since input is oldest-first
  }
  return latest;
}
// Per-referee historical tendencies (migration 040) — small samples, always
// carry games_officiated alongside any average so the model can judge confidence.
async function fetchRefereeTendencies() {
  const { data, error } = await sb.from('referee_tendencies')
    .select('referee, games_officiated, avg_total_points, avg_total_penalties, home_win_pct');
  if (error) { console.warn(`   ⚠ referee_tendencies: ${error.message} — officiating context disabled`); return {}; }
  const byRef = {};
  for (const r of data || []) byRef[r.referee] = r;
  return byRef;
}
// Latest two distinct (season, week) roster snapshots league-wide (migration 038,
// weekly nflverse refresh) — enough to diff week-over-week churn per team without
// a per-team round-trip. Same diff logic as agentTools.js's get_roster_churn tool.
async function fetchRosterChurn() {
  const { data: weeksData, error: weeksErr } = await sb.from('nfl_rosters')
    .select('season, week').eq('season', SEASON)
    .order('season', { ascending: false }).order('week', { ascending: false }).limit(2000);
  if (weeksErr || !weeksData?.length) return {};
  const seen = new Set(); const targetWeeks = [];
  for (const { season, week } of weeksData) {
    const k = `${season}-${week}`;
    if (seen.has(k)) continue;
    seen.add(k); targetWeeks.push({ season, week });
    if (targetWeeks.length >= 2) break;
  }
  if (targetWeeks.length < 2) return {}; // not enough history yet (early offseason/preseason)

  const rows = [];
  for (const { season, week } of targetWeeks) {
    const { data, error } = await sb.from('nfl_rosters')
      .select('season, week, team, gsis_id, full_name, status')
      .eq('season', season).eq('week', week);
    if (!error) rows.push(...(data || []));
  }
  const byTeamWeek = {}; // team -> season-week key -> Map(playerKey -> row)
  for (const r of rows) {
    const nick = normalizeTeam(r.team); if (!nick) continue;
    const wk = `${r.season}-${r.week}`;
    ((byTeamWeek[nick] ??= {})[wk] ??= new Map()).set(r.gsis_id || r.full_name, r);
  }
  const churnByTeam = {};
  for (const [team, weeks] of Object.entries(byTeamWeek)) {
    const keys = Object.keys(weeks).sort().reverse(); // most recent first (lexicographic season-week is fine within one season)
    if (keys.length < 2) continue;
    const [curKey, priorKey] = keys;
    const cur = weeks[curKey], prior = weeks[priorKey];
    let adds = 0, drops = 0, statusChanges = 0;
    for (const [k, row] of cur) {
      if (!prior.has(k)) adds++;
      else if (prior.get(k).status !== row.status) statusChanges++;
    }
    for (const k of prior.keys()) if (!cur.has(k)) drops++;
    const [curSeason, curWeek] = curKey.split('-').map(Number);
    const [priorSeason, priorWeek] = priorKey.split('-').map(Number);
    churnByTeam[team] = { current: { season: curSeason, week: curWeek }, prior: { season: priorSeason, week: priorWeek }, adds, drops, status_changes: statusChanges };
  }
  return churnByTeam;
}

// ── odds view ────────────────────────────────────────────────────────────────
function buildOddsView(snaps) {
  const g = {};
  const normalized = canonicalizeSnapshots(snaps);
  const asOf = new Date();
  for (const r of normalized) {
    const mk = r.market_type, tm = r.team || r.selection || '?', bk = normalizeBook(r.book);
    ((g[mk] ??= {})[tm] ??= {})[bk] ??= [];
    g[mk][tm][bk].push(r);
  }
  const markets = {};
  for (const [mk, teams] of Object.entries(g)) {
    const isWins = mk === 'wins';
    const isPlayoffs = mk === 'playoffs';
    const teamOut = {};
    const bookOverround = {};
    const exactPositionOverround = {};
    if (isMultiway(mk)) {
      for (const [, books] of Object.entries(teams)) {
        for (const [bk, rows] of Object.entries(books)) {
          const last = rows[rows.length - 1];
          const ip = last.implied_prob ?? americanToProb(last.price ?? last.odds);
          if (ip != null) bookOverround[bk] = (bookOverround[bk] || 0) + ip;
        }
      }
    }
    if (mk === 'division_exact_position') {
      for (const [tm, books] of Object.entries(teams)) {
        for (const [bk, rows] of Object.entries(books)) {
          const last = rows[rows.length - 1];
          const key = `${bk}|${last.exact_position_team || tm}`;
          const ip = last.implied_prob ?? americanToProb(last.price ?? last.odds);
          if (ip != null) exactPositionOverround[key] = (exactPositionOverround[key] || 0) + ip;
        }
      }
    }
    for (const [tm, books] of Object.entries(teams)) {
      const perBook = {};
      const fairProbs = [];
      let bestPrice = null, bestBook = null, bestMeta = null;
      const winsLines = [];
      const winFitPoints = [];
      for (const [bk, rows] of Object.entries(books)) {
        const first = rows[0], last = rows[rows.length - 1];
        if (isWins) {
          winFitPoints.push(...buildWinFitPointsFromRows(rows));
          // Same-book devig (self-consistent: uses THIS book's own over+under
          // pair at THIS book's own line, never mixed with another book's line —
          // see the line-grouped aggregation below for why that matters).
          const oImp = americanToProb(last.over_price), uImp = americanToProb(last.under_price);
          const or = (oImp != null && uImp != null) ? oImp + uImp : null;
          perBook[bk] = {
            line: last.line, over: last.over_price, under: last.under_price,
            over_prob: round(americanToProb(last.over_price)), under_prob: round(americanToProb(last.under_price)),
            fair_over: or ? round(oImp / or) : null, fair_under: or ? round(uImp / or) : null,
            first_line: first.line, last_line: last.line, snapshots: rows.length,
            ...quoteMeta(last, asOf),
          };
          if (last.line != null) winsLines.push(last.line);
        } else if (isPlayoffs) {
          const yesPrice = last.yes_price ?? last.price ?? last.odds;
          const noPrice = last.no_price ?? null;
          const yesImp = americanToProb(yesPrice);
          const noImp = americanToProb(noPrice);
          const or = (yesImp != null && noImp != null) ? yesImp + noImp : null;
          const fairYes = or ? yesImp / or : yesImp;
          if (fairYes != null) fairProbs.push(fairYes);
          const firstPrice = first.yes_price ?? first.price ?? first.odds;
          const meta = quoteMeta(last, asOf);
          perBook[bk] = {
            yes_price: yesPrice, no_price: noPrice,
            yes_implied: round(yesImp), no_implied: round(noImp),
            fair_yes: round(fairYes), fair_no: or ? round(noImp / or) : null,
            move_prob: round((yesImp ?? 0) - (americanToProb(firstPrice) ?? yesImp ?? 0)),
            snapshots: rows.length,
            ...meta,
          };
          if (BETTABLE_BOOKS.has(bk) && isBetterOffer(yesPrice, meta, bestPrice, bestMeta)) { bestPrice = yesPrice; bestBook = bk; bestMeta = meta; }
        } else {
          const priceNow = last.price ?? last.odds;
          const ipRaw = last.implied_prob ?? americanToProb(priceNow);
          const or = mk === 'division_exact_position' ? exactPositionOverround[`${bk}|${last.exact_position_team || tm}`] : bookOverround[bk];
          const fair = (isMultiway(mk) && or) ? ipRaw / or : ipRaw;
          if (fair != null) fairProbs.push(fair);
          const firstPrice = first.price ?? first.odds;
          const meta = quoteMeta(last, asOf);
          perBook[bk] = {
            price: priceNow, implied: round(ipRaw), fair: round(fair),
            move_prob: round((ipRaw ?? 0) - (americanToProb(firstPrice) ?? ipRaw ?? 0)), snapshots: rows.length,
            ...meta,
          };
          if (BETTABLE_BOOKS.has(bk) && isBetterOffer(priceNow, meta, bestPrice, bestMeta)) { bestPrice = priceNow; bestBook = bk; bestMeta = meta; }
        }
      }
      if (isWins) {
        const overProbs = Object.values(perBook).map((b) => b.over_prob).filter((x) => x != null);
        let bOver = null, bOverBk = null, bUnder = null, bUnderBk = null; // best placeable prices
        let bOverMeta = null, bUnderMeta = null;
        for (const [bk, pb] of Object.entries(perBook)) {
          if (!BETTABLE_BOOKS.has(bk)) continue;
          if (isBetterOffer(pb.over, pb, bOver, bOverMeta)) { bOver = pb.over; bOverBk = bk; bOverMeta = pb; }
          if (isBetterOffer(pb.under, pb, bUnder, bUnderMeta)) { bUnder = pb.under; bUnderBk = bk; bUnderMeta = pb; }
        }

        // 2026-07-22 fix (Codex review): win-total rows previously had no
        // code-owned fair probability or edge at all (only raw prices + a
        // median over-side implied prob) — the model was reasoning blind on
        // these, and the sort below had nothing meaningful to sort by. Fair
        // probs are grouped by LINE, never mixed across lines — Codex's own
        // example: "Over 8.5 -105 is not directly comparable to Over 9.5 +120."
        // A book's best price is only compared against fair probs computed
        // from OTHER books sharing that exact line; line_consensus_confidence
        // tells the model (and validator) how many books actually agree.
        const byLine = {};
        for (const pb of Object.values(perBook)) {
          if (pb.line == null || pb.fair_over == null) continue;
          (byLine[pb.line] ??= []).push(pb);
        }
        const fairAtLine = (line) => {
          const group = byLine[line];
          if (!group?.length) return null;
          return { over: round(median(group.map((g) => g.fair_over))), under: round(median(group.map((g) => g.fair_under))), n_books: group.length };
        };
        const overFair = bOverBk ? fairAtLine(perBook[bOverBk].line) : null;
        const underFair = bUnderBk ? fairAtLine(perBook[bUnderBk].line) : null;
        const winDist = fitWinDist(winFitPoints);
        const consensusFirstQ = median(Object.values(perBook).map((b) => b.fair_over).filter((x) => x != null));
        const consensusLastQ = median(Object.values(perBook).map((b) => b.fair_over).filter((x) => x != null));
        let bestEdgeOver = null, bestEdgeUnder = null;
        for (const [bk, pb] of Object.entries(perBook)) {
          pb.over_edge = matchedWinEdge(winDist, pb.line, pb.over, 'over');
          pb.under_edge = matchedWinEdge(winDist, pb.line, pb.under, 'under');
          pb.move_class = classifyMove({ first_q: pb.fair_over, last_q: pb.fair_over }, { first_q: consensusFirstQ, last_q: consensusLastQ });
          if (BETTABLE_BOOKS.has(bk) && pb.over_edge != null && (!bestEdgeOver || pb.over_edge > bestEdgeOver.edge)) {
            bestEdgeOver = { book: bk, line: pb.line, price: pb.over, edge: pb.over_edge };
          }
          if (BETTABLE_BOOKS.has(bk) && pb.under_edge != null && (!bestEdgeUnder || pb.under_edge > bestEdgeUnder.edge)) {
            bestEdgeUnder = { book: bk, line: pb.line, price: pb.under, edge: pb.under_edge };
          }
        }

        teamOut[tm] = { type: 'wins', consensus_line: median(winsLines),
          line_spread: winsLines.length ? round(Math.max(...winsLines) - Math.min(...winsLines), 2) : null,
          over_prob_median: round(median(overProbs)),
          best_over: bOver, best_over_book: bOverBk, best_under: bUnder, best_under_book: bUnderBk, per_book: perBook,
          win_dist: winDist, tails: tailTable(winDist), best_edge_over: bestEdgeOver, best_edge_under: bestEdgeUnder,
          over_fair_prob: overFair?.over ?? null, under_fair_prob: underFair?.under ?? null,
          best_over_edge_pct: overFair ? edgePctFromFair(overFair.over, bOver) : null,
          best_under_edge_pct: underFair ? edgePctFromFair(underFair.under, bUnder) : null,
          line_consensus_confidence: { over_n_books: overFair?.n_books ?? 0, under_n_books: underFair?.n_books ?? 0 },
          line_value_signal: (winsLines.length > 1 && (Math.max(...winsLines) - Math.min(...winsLines)) > 0.5)
            ? 'books disagree on the line itself — treat consensus_line/edge loosely until they converge'
            : 'books agree on the line' };
      } else {
        const impliedList = Object.values(perBook).map((b) => b.implied ?? b.yes_implied).filter((x) => x != null);
        const fairMed = round(median(fairProbs.filter((x) => x != null)));
        const divergence = impliedList.length ? round(Math.max(...impliedList) - Math.min(...impliedList)) : null;
        const bp = americanToProb(bestPrice);
        teamOut[tm] = { type: isPlayoffs ? 'playoffs' : 'outright', fair_prob: fairMed, fair_american: probToAmerican(fairMed),
          best_price: bestPrice, best_book: bestBook, best_prob: round(bp),
          book_divergence: divergence, n_books: impliedList.length,
          value_gap: (bp != null && fairMed != null) ? round(fairMed - bp) : null, per_book: perBook,
          best_observed_at: bestBook ? perBook[bestBook]?.observed_at : null,
          best_quote_age_hours: bestBook ? perBook[bestBook]?.quote_age_hours : null,
          best_availability_status: bestBook ? perBook[bestBook]?.availability_status : null };
      }
    }
    markets[mk] = teamOut;
  }
  return markets;
}

function buildWinFitPointsFromRows(rows) {
  const points = [];
  for (const row of [rows?.[0], rows?.[rows.length - 1]].filter(Boolean)) {
    const d = devigPair(row.over_price, row.under_price);
    if (row.line != null && d.pOver != null) {
      points.push({
        line: Number(row.line),
        q: d.pOver,
        w: row === rows?.[rows.length - 1] ? 1 : 0.5,
      });
    }
  }
  return points;
}

function matchedWinEdge(dist, line, price, side) {
  if (!dist?.mu || !dist?.sigma || line == null || price == null) return null;
  const overProb = probOverLine(dist, line);
  const fair = side === 'under' ? (overProb == null ? null : 1 - overProb) : overProb;
  return edgePctFromFair(fair, price);
}

// ════════════ NORMALIZED SIGNAL LEAN LAYER (preferred) ════════════════════════
const ODDS_SIGNAL_MARKETS = new Set(['superbowl', 'wins', 'playoffs', 'division', 'conference']);
function toSignalMarket(dossierMk) {
  if (dossierMk === 'superbowl' || dossierMk === 'wins' || dossierMk === 'playoffs') return dossierMk;
  if (dossierMk.startsWith('division_')) return 'division';
  if (dossierMk.startsWith('conference_')) return 'conference';
  return null;
}
async function loadNormalizedSignals() {
  const p = SIGNALS_PATH || path.join(OUT_DIR, `normalized-signals-${MODEL}.json`);
  try {
    const raw = JSON.parse(await readFile(p, 'utf8'));
    return { path: p, signals: Array.isArray(raw.signals) ? raw.signals : [] };
  } catch { return null; }
}
function makeNormalizedFindLean(signals) {
  const byTeamMarket = {};
  const adjacentByTeam = {};
  const byAuthor = {}; // author -> [{team, market, direction, strength}] — the "experts" roster
  for (const s of signals) {
    if (s.is_nfl === false) continue;
    const team = normalizeTeam(s.team); if (!team) continue;
    const mk = String(s.market || '').toLowerCase();
    const dir = String(s.direction || 'na').toLowerCase();
    const who = s.author || s.source_type;
    if (s.author) (byAuthor[s.author] ??= []).push({ team, market: mk, direction: dir, strength: s.strength ?? null });
    if (ODDS_SIGNAL_MARKETS.has(mk)) {
      const e = (byTeamMarket[`${team}|${mk}`] ??= { back: 0, fade: 0, over: 0, under: 0, n: 0, strength: 0, samples: [] });
      if (['back', 'fade', 'over', 'under'].includes(dir)) e[dir]++;
      e.n++; e.strength += (typeof s.strength === 'number' ? s.strength : 0.5);
      if (e.samples.length < 5) e.samples.push({ who, dir, strength: s.strength ?? null, why: (s.rationale || '').slice(0, 120) });
    } else {
      (adjacentByTeam[team] ??= []).push({ market: mk, direction: dir, strength: s.strength ?? null, who, why: (s.rationale || '').slice(0, 120) });
    }
  }
  const findLean = (team, dossierMk) => {
    const canon = normalizeTeam(team); if (!canon) return null;
    const sMk = toSignalMarket(dossierMk); if (!sMk) return null;
    const e = byTeamMarket[`${canon}|${sMk}`]; if (!e) return null;
    return { back: e.back, fade: e.fade, over: e.over, under: e.under, n: e.n, avg_strength: round(e.strength / e.n, 2), samples: e.samples };
  };
  return { findLean, adjacentByTeam, byAuthor, combos: Object.keys(byTeamMarket).length };
}

// ── inline fallback lean layer (only when no normalized sidecar) ──────────────
const NON_NFL = /\b(nba|ncaa|college|cbb|mlb|baseball|world series|cy young|al mvp|nl mvp|ufc|mma|fighter|flyweight|bantamweight|pga|golf|open championship|scottish open|world cup|fifa|soccer|premier league|nhl|hockey|tennis|wnba|pistons|celtics|lakers|bulls|knicks|nets|heat|bucks|warriors|yankees|dodgers)\b/i;
function resolveNflTeam(str, ctx) {
  if (!str) return null;
  if (ctx && NON_NFL.test(ctx)) return null;
  return normalizeTeam(str) || null;
}
function buildLeanView(pickSignals, userPicks, podcastRows) {
  const leans = {};
  const cov = { article: { kept: 0, dropped: 0 }, expert: { kept: 0, dropped: 0 }, podcast_pick: { kept: 0, dropped: 0 }, podcast_intel_unparsed: 0 };
  const add = (team, bucket, dir, note, who) => {
    const e = (leans[team] ??= { team, article: 0, expert: 0, podcast: 0, back: 0, fade: 0, over: 0, under: 0, samples: [] });
    e[bucket]++;
    const d = String(dir || '').toLowerCase();
    if (/\bunder\b/.test(d)) e.under++; else if (/\bover\b/.test(d)) e.over++;
    else if (/\b(fade|against|avoid|no|short)\b/.test(d)) e.fade++; else e.back++;
    if (e.samples.length < 6) e.samples.push({ who, dir: dir || 'back', note: (note || '').slice(0, 160) });
  };
  for (const s of pickSignals) {
    const ctx = `${s.team_or_market || ''} ${s.bet_type || ''} ${s.lean || ''} ${s.rationale || ''}`;
    const team = resolveNflTeam(s.team_or_market, ctx) || resolveNflTeam(s.lean, ctx);
    if (!team) { cov.article.dropped++; continue; }
    cov.article.kept++; add(team, 'article', s.lean || s.bet_type, s.rationale, s.author || s.source);
  }
  for (const p of userPicks) {
    const ctx = `${p.selection || ''} ${p.home || ''} ${p.visitor || ''} ${p.rationale || ''}`;
    const team = resolveNflTeam(p.selection, ctx) || resolveNflTeam(p.home, ctx);
    if (!team) { cov.expert.dropped++; continue; }
    cov.expert.kept++;
    add(team, 'expert', /^(over|under)$/i.test(p.selection || '') ? p.selection : p.pick_type, p.rationale, p.expert || p.source);
  }
  for (const row of podcastRows) {
    const intel = Array.isArray(row.intel) ? row.intel : [];
    cov.podcast_intel_unparsed += intel.length;
    const picks = Array.isArray(row.picks) ? row.picks : [];
    const show = row.podcast_episodes?.title || 'podcast';
    for (const pk of picks) {
      const ctx = `${pk.selection || ''} ${pk.team1 || ''} ${pk.team2 || ''} ${pk.summary || ''}`;
      const team = resolveNflTeam(pk.selection, ctx) || resolveNflTeam(pk.team1, ctx) || resolveNflTeam(pk.team2, ctx);
      if (!team) { cov.podcast_pick.dropped++; continue; }
      cov.podcast_pick.kept++; add(team, 'podcast', pk.type || pk.lean, pk.summary, show);
    }
  }
  const findLean = (team) => {
    const canon = normalizeTeam(team); if (!canon) return null;
    const e = leans[canon]; if (!e) return null;
    return { article: e.article, expert: e.expert, podcast: e.podcast, back: e.back, fade: e.fade, over: e.over, under: e.under, samples: e.samples };
  };
  return { findLean, coverage: cov };
}

// ════════════ STRENGTH-OF-SCHEDULE GROUNDING ══════════════════════════════════
// Two opponent-quality measures for each team's 2026 slate:
//   • market  — average opponent 2026 win-total consensus line (forward-looking,
//               the sharpest signal: the market's live view of each opponent).
//   • prior   — average opponent most-recent-season win% (classic backward SoS).
// Both get a league rank where 1 = hardest schedule. A soft slate is a tailwind
// for a win-total OVER / bounce-back and adds convexity to a division/playoff long.
function buildOpponents(games) {
  const opp = {}; // canonical nickname -> [{ opp, home }]
  for (const g of games) {
    if (g.season_type != null && g.season_type !== 2) continue; // regular season only
    const h = normalizeTeam(g.home_team) || normalizeTeam(g.home_abbrev);
    const a = normalizeTeam(g.away_team) || normalizeTeam(g.away_abbrev);
    if (!h || !a || h === a) continue;
    (opp[h] ??= []).push({ opp: a, home: true });
    (opp[a] ??= []).push({ opp: h, home: false });
  }
  return opp;
}
function priorWinPct(seasons) {
  if (!seasons) return null;
  for (const s of seasons) { // sorted season-desc; take most recent complete record
    if (s.wins != null && s.losses != null) {
      const g = s.wins + s.losses + (s.ties || 0);
      if (g > 0) return (s.wins + 0.5 * (s.ties || 0)) / g;
    }
  }
  return null;
}
function buildSosView(oppByTeam, winsMarket, priorByTeam) {
  // canonical lookups keyed by nickname
  const winLineByNick = {};
  for (const [tm, v] of Object.entries(winsMarket || {})) {
    const nick = normalizeTeam(tm);
    if (nick && v && v.consensus_line != null) winLineByNick[nick] = v.consensus_line;
  }
  const priorPctByNick = {};
  for (const [nick, seasons] of Object.entries(priorByTeam || {})) {
    const p = priorWinPct(seasons); if (p != null) priorPctByNick[nick] = p;
  }
  const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const raw = {};
  for (const [team, opps] of Object.entries(oppByTeam)) {
    const mkt = [], pri = []; let home = 0, away = 0;
    for (const { opp, home: isHome } of opps) {
      if (isHome) home++; else away++;
      if (winLineByNick[opp] != null) mkt.push(winLineByNick[opp]);
      if (priorPctByNick[opp] != null) pri.push(priorPctByNick[opp]);
    }
    raw[team] = {
      opp_count: opps.length, home_games: home, away_games: away,
      sos_market: round(avg(mkt), 2), sos_market_n: mkt.length,
      sos_prior: round(avg(pri), 3), sos_prior_n: pri.length,
    };
  }
  // league ranks: 1 = hardest (highest opponent quality)
  const rankBy = (key) => {
    Object.entries(raw).filter(([, v]) => v[key] != null)
      .sort((a, b) => b[1][key] - a[1][key])
      .forEach(([t], i) => { raw[t][`${key}_rank`] = i + 1; });
  };
  rankBy('sos_market'); rankBy('sos_prior');
  const findSos = (team) => { const canon = normalizeTeam(team); return canon ? (raw[canon] || null) : null; };
  const withMarket = Object.values(raw).filter((v) => v.sos_market != null).length;
  return { findSos, raw, teams: Object.keys(raw).length, with_market: withMarket };
}
function sosTag(s) {
  if (!s || !s.opp_count) return null;
  return {
    market: s.sos_market, market_rank: s.sos_market_rank,
    prior: s.sos_prior, prior_rank: s.sos_prior_rank,
    home: s.home_games, away: s.away_games,
  };
}

// ════════════ SCHEDULE / OFFICIATING / CLV SIGNALS (2026-07-22 follow-up) ═════
// Rolls the S296 track-2 domains (rest/travel, referee tendencies, CLV/sharp
// splits) up from per-game into one per-team season-aggregate signal each —
// the dossier reasons about FUTURES markets (season-long outrights), so a
// single game's rest differential isn't itself a synthesis input; a team's
// cumulative short-rest-game count, officiating scoring environment, and
// season-to-date closing-line/sharp-money behavior are. Games this season
// mostly won't have `referee` or CLV data populated yet (referees aren't
// assigned until close to kickoff, and CLV needs both a tracked-open snapshot
// AND the game to have closed) — n=0 signals are expected early in the season
// and should read as "not yet available", not "no signal".
function buildTeamSignals(games, oddsOpenByGame, splitsLatestByGame, refereeByName) {
  const schedule = {};   // team -> { games, short_rest_games, avg_rest, div_games }
  const officiating = {}; // team -> { games_with_ref, avg_total_points, avg_total_penalties, refs }
  const clv = {};        // team -> { n_tracked, avg_move_toward_team, sharp_lean_games, public_fade_games }

  const bump = (map, team, init) => (map[team] ??= init());

  for (const g of games) {
    if (g.season_type != null && g.season_type !== 2) continue; // regular season only, matches buildOpponents()
    const home = normalizeTeam(g.home_team) || normalizeTeam(g.home_abbrev);
    const away = normalizeTeam(g.away_team) || normalizeTeam(g.away_abbrev);
    if (!home || !away) continue;
    const key = `${g.season}-${g.week}-${home}-${away}`;

    // ── rest/travel ──
    for (const [team, restDays, isDiv] of [[home, g.home_rest, g.div_game], [away, g.away_rest, g.div_game]]) {
      const s = bump(schedule, team, () => ({ games: 0, rest_known: 0, rest_sum: 0, short_rest_games: 0, div_games: 0 }));
      s.games++;
      if (isDiv) s.div_games++;
      if (restDays != null) {
        s.rest_known++; s.rest_sum += restDays;
        if (restDays < 6) s.short_rest_games++;
      }
    }

    // ── officiating ──
    if (g.referee && refereeByName[g.referee]) {
      const ref = refereeByName[g.referee];
      for (const team of [home, away]) {
        const o = bump(officiating, team, () => ({ games_with_ref: 0, points_sum: 0, penalties_sum: 0, refs: new Set() }));
        o.games_with_ref++; o.points_sum += (ref.avg_total_points || 0); o.penalties_sum += (ref.avg_total_penalties || 0);
        o.refs.add(g.referee);
      }
    }

    // ── CLV / sharp divergence ──
    const closing = g.closing_spread_line;
    const openRow = oddsOpenByGame[key];
    const splitsRow = splitsLatestByGame[key];
    if (closing != null && openRow?.spread != null) {
      const homeMove = round(closing - openRow.spread, 2); // positive = closing line moved MORE toward home favorite
      for (const [team, moveForTeam] of [[home, homeMove], [away, -homeMove]]) {
        const c = bump(clv, team, () => ({ n_tracked: 0, move_sum: 0, sharp_lean_games: 0, public_fade_games: 0, n_splits: 0 }));
        c.n_tracked++; c.move_sum += moveForTeam;
        if (splitsRow?.spread_home_money != null && splitsRow?.spread_home_bettors != null) {
          const divergenceHome = splitsRow.spread_home_money - splitsRow.spread_home_bettors; // positive = sharp $ heavier on home than ticket count
          const divergenceForTeam = team === home ? divergenceHome : -divergenceHome;
          c.n_splits++;
          if (divergenceForTeam >= 5) c.sharp_lean_games++;
          else if (divergenceForTeam <= -5) c.public_fade_games++;
        }
      }
    }
  }

  const scheduleOut = {};
  for (const [team, s] of Object.entries(schedule)) {
    scheduleOut[team] = {
      games: s.games, div_games: s.div_games,
      short_rest_games: s.short_rest_games,
      avg_rest: s.rest_known ? round(s.rest_sum / s.rest_known, 1) : null,
      rest_known: s.rest_known,
    };
  }
  const officiatingOut = {};
  for (const [team, o] of Object.entries(officiating)) {
    officiatingOut[team] = {
      games_with_ref: o.games_with_ref,
      avg_total_points: round(o.points_sum / o.games_with_ref, 1),
      avg_total_penalties: round(o.penalties_sum / o.games_with_ref, 1),
      distinct_refs: o.refs.size,
      confidence: o.games_with_ref >= 4 ? 'low-moderate' : 'very low — few officials known so far',
    };
  }
  const clvOut = {};
  for (const [team, c] of Object.entries(clv)) {
    clvOut[team] = {
      n_tracked: c.n_tracked,
      avg_closing_move_toward_team: round(c.move_sum / c.n_tracked, 2),
      sharp_lean_games: c.sharp_lean_games,
      public_fade_games: c.public_fade_games,
      n_with_splits: c.n_splits,
    };
  }
  return { scheduleOut, officiatingOut, clvOut };
}

// ── compact synthesis input ──────────────────────────────────────────────────
function priorTag(seasons) {
  if (!seasons || !seasons.length) return null;
  return seasons.slice(0, 3).map((s) => {
    const wl = (s.wins != null && s.losses != null) ? `${s.wins}-${s.losses}` : null;
    const ats = (s.ats_wins != null && s.ats_losses != null) ? `${s.ats_wins}-${s.ats_losses} ATS` : null;
    return `${s.season}: ${[wl, ats].filter(Boolean).join(', ')}`;
  });
}
// Splits a "Team A vs Team B" compound selection (superbowl_matchup market)
// into its two canonical team nicknames. 2026-07-22 LIVE-RUN FIX: normalizeTeam()
// alone silently resolves a compound string to only its FIRST matching team
// (it scans word-by-word and returns on the first hit) — this was a real,
// previously-undetected bug. Every superbowl_matchup row's per-team context
// (analytics/sos/injuries/etc) was actually just team A's data, mislabeled as
// if it described the whole pairing; team B's context was silently dropped.
// Matchup rows now carry explicit team_a/team_b instead of a misleading
// single-team blob (see buildSynthesisInput below).
function splitMatchupTeams(tm) {
  const parts = String(tm || '').split(/\s+vs\.?\s+/i);
  if (parts.length !== 2) return null;
  const a = normalizeTeam(parts[0]), b = normalizeTeam(parts[1]);
  return (a && b) ? { a, b } : null;
}
// ── shared team-profile map (2026-07-22 live-run fix) ─────────────────────────
// Season-aggregate signals (prior, sos, analytics, schedule_context,
// officiating_context, clv_signal, injuries) are IDENTICAL for a given team no
// matter which market row it appears on. The original buildSynthesisInput()
// recomputed and INLINED a full copy of this blob onto every single row across
// every market (~740 rows in the first real run, across up to ~11 markets per
// team) — that alone was the majority of why the dossier's first real run blew
// gpt-4o's 128K context (310K tokens actual, and would have exceeded Claude's
// 200K too). Computed ONCE per team here instead; synthesis_input rows below
// now only carry market-specific fields + a team-name reference, and
// portfolio-synthesize.js's prompt builder + evidence resolver look context up
// from this map by team name.
function buildTeamProfiles(teamNicks, priorByTeam, findSos, teamSignals, injuriesByTeam, advancedAnalyticsByTeam = {}, dvoaByTeam = {}, coachingByTeam = {}, trainingCampIntelByTeam = {}, playerAvailabilityByTeam = {}) {
  const { scheduleOut, officiatingOut, clvOut } = teamSignals || {};
  const out = {};
  for (const nick of teamNicks) {
    out[nick] = {
      prior: priorTag(priorByTeam[nick]),
      sos: findSos ? sosTag(findSos(nick)) : null,
      analytics: mergeAnalytics(currentAnalytics(priorByTeam[nick]), advancedAnalyticsByTeam?.[nick]),
      dvoa: dvoaByTeam?.[nick] || null,
      coaching_profile: coachingByTeam?.[nick] || null,
      schedule_context: scheduleOut?.[nick] || null,
      officiating_context: officiatingOut?.[nick] || null,
      clv_signal: clvOut?.[nick] || null,
      injuries: injuriesByTeam?.[nick] || null,
      training_camp_intel: trainingCampIntelByTeam?.[nick] || null,
      player_availability: playerAvailabilityByTeam?.[nick] || null,
    };
  }
  return out;
}
function buildSynthesisInput(markets, findLean) {
  const out = {};
  for (const [mk, teams] of Object.entries(markets)) {
    const rows = [];
    for (const [tm, v] of Object.entries(teams)) {
      const mu = splitMatchupTeams(tm);
      // toSignalMarket() (above) doesn't map 'superbowl_matchup' to anything, so
      // findLean() already returned null for these rows before this fix too —
      // made explicit here rather than left as an incidental side effect.
      const lean = mu ? null : findLean(tm, mk);
      const teamRef = mu ? { team_a: mu.a, team_b: mu.b } : { team_nick: normalizeTeam(tm) };
      if (v.type === 'wins') {
        rows.push({ team: tm, ...teamRef, consensus_line: v.consensus_line, line_spread: v.line_spread,
          over_prob_median: v.over_prob_median,
          over_fair_prob: v.over_fair_prob, under_fair_prob: v.under_fair_prob,
          best_over_edge_pct: v.best_over_edge_pct, best_under_edge_pct: v.best_under_edge_pct,
          line_consensus_confidence: v.line_consensus_confidence,
          line_value_signal: v.line_value_signal,
          win_dist: v.win_dist, tails: v.tails, best_edge_over: v.best_edge_over, best_edge_under: v.best_edge_under,
          best_over: v.best_over, best_over_book: v.best_over_book, best_under: v.best_under, best_under_book: v.best_under_book,
          books: v.per_book, lean });
      } else {
        rows.push({ team: tm, ...teamRef, fair_prob: v.fair_prob, fair_american: v.fair_american,
          best_price: v.best_price, best_book: v.best_book, best_prob: v.best_prob,
          best_observed_at: v.best_observed_at, best_quote_age_hours: v.best_quote_age_hours, best_availability_status: v.best_availability_status,
          value_gap: v.value_gap, book_divergence: v.book_divergence, n_books: v.n_books,
          moves: Object.fromEntries(Object.entries(v.per_book).map(([b, d]) => [b, d.move_prob])),
          lean });
      }
    }
    // 2026-07-22 fix (Codex review): wins rows have no value_gap/book_divergence
    // at all (those are outright-market fields) — every wins row previously
    // sorted as a 0-0 tie, i.e. no real ordering. Use the new best_over/
    // best_under_edge_pct fields for wins rows instead.
    const edgeKey = (r) => (r.consensus_line != null)
      ? Math.max(Math.abs(r.best_over_edge_pct ?? 0), Math.abs(r.best_under_edge_pct ?? 0))
      : Math.abs(r.value_gap ?? r.book_divergence ?? 0);
    rows.sort((a, b) => edgeKey(b) - edgeKey(a));
    out[mk] = rows;
  }
  return out;
}

// ── markdown summary ─────────────────────────────────────────────────────────
function leanTag(l) {
  if (!l) return '';
  const dir = [l.back ? `back${l.back}` : '', l.fade ? `fade${l.fade}` : '', l.over ? `o${l.over}` : '', l.under ? `u${l.under}` : ''].filter(Boolean).join('/');
  if (l.n != null) return ` · lean n${l.n}${dir ? ` (${dir})` : ''}${l.avg_strength != null ? ` @${l.avg_strength}` : ''}`;
  return ` · lean a${l.article}/e${l.expert}/p${l.podcast}${dir ? ` (${dir})` : ''}`;
}
function sosMd(s) {
  if (!s || s.market == null && s.prior == null) return '';
  const hard = s.market_rank != null ? (s.market_rank <= 10 ? 'hard' : s.market_rank >= 23 ? 'soft' : 'avg') : '';
  const parts = [];
  if (s.market != null) parts.push(`mkt ${s.market}${s.market_rank != null ? ` #${s.market_rank}` : ''}${hard ? ` ${hard}` : ''}`);
  if (s.prior != null) parts.push(`prior ${s.prior}${s.prior_rank != null ? ` #${s.prior_rank}` : ''}`);
  return parts.length ? ` · SoS ${parts.join(' / ')}` : '';
}
function analyticsMd(a) {
  if (!a) return '';
  const parts = [];
  if (a.off_epa_per_play != null) parts.push(`off EPA ${a.off_epa_per_play}${a.off_epa_rank != null ? ` #${a.off_epa_rank}` : ''}`);
  if (a.def_epa_per_play != null) parts.push(`def EPA ${a.def_epa_per_play}${a.def_epa_rank != null ? ` #${a.def_epa_rank}` : ''}`);
  if (a.epa_per_dropback != null) parts.push(`EPA/db ${a.epa_per_dropback}`);
  if (a.qb_epa_per_dropback != null) parts.push(`QB EPA/db ${a.qb_epa_per_dropback}`);
  if (a.success_rate != null) parts.push(`success ${a.success_rate}`);
  if (a.cpoe != null) parts.push(`CPOE ${a.cpoe}`);
  return parts.length ? ` · ${parts.join(' / ')}` : '';
}
function dvoaMd(d) {
  if (!d) return '';
  const parts = [];
  if (d.overall_dvoa != null) parts.push(`overall ${d.overall_dvoa}${d.overall_dvoa_rank != null ? ` #${d.overall_dvoa_rank}` : ''}`);
  if (d.offensive_dvoa != null) parts.push(`off ${d.offensive_dvoa}${d.offensive_dvoa_rank != null ? ` #${d.offensive_dvoa_rank}` : ''}`);
  if (d.defensive_dvoa != null) parts.push(`def ${d.defensive_dvoa}${d.defensive_dvoa_rank != null ? ` #${d.defensive_dvoa_rank}` : ''}`);
  return parts.length ? ` · DVOA ${parts.join(' / ')}` : '';
}
function coachingMd(c) {
  if (!c) return '';
  const parts = [];
  if (c.head_coach) parts.push(c.head_coach);
  if (c.fourth_down_aggression_tier) parts.push(`4D ${c.fourth_down_aggression_tier}`);
  if (c.neutral_pass_rate != null) parts.push(`neutral pass ${c.neutral_pass_rate}`);
  if (c.play_action_rate != null) parts.push(`PA ${c.play_action_rate}`);
  return parts.length ? ` · coach ${parts.join(' / ')}` : '';
}
function scheduleMd(s) {
  if (!s || !s.rest_known) return '';
  return ` · rest avg ${s.avg_rest}d (${s.short_rest_games} short-week, ${s.div_games} div)`;
}
function officiatingMd(o) {
  if (!o || !o.games_with_ref) return '';
  return ` · refs(${o.games_with_ref}) avg total ${o.avg_total_points}`;
}
function clvMd(c) {
  if (!c || !c.n_tracked) return '';
  const sharp = c.sharp_lean_games || c.public_fade_games ? ` sharp+${c.sharp_lean_games}/-${c.public_fade_games}` : '';
  return ` · CLV(${c.n_tracked}) move ${c.avg_closing_move_toward_team}${sharp}`;
}
function injuriesMd(inj) {
  if (!inj || !inj.injury_count) return '';
  const flags = inj.key_position_flags?.length ? ` [${inj.key_position_flags.join(',')}]` : '';
  const qb = inj.qb_status ? ` QB:${inj.qb_status}` : '';
  return ` · injuries(${inj.injury_count})${flags}${qb}`;
}
function toMarkdown(meta, synth, experts, teamProfiles) {
  const ic = meta.intel_coverage;
  const intelLine = ic.mode === 'normalized'
    ? `Intel: ${ic.signals} normalized signals, ${ic.team_market_combos} team-market combos, ${ic.experts} analysts, ${ic.adjacent_teams} teams w/ adjacent signals`
    : `Intel (inline fallback): article ${ic.article?.kept ?? 0}, expert ${ic.expert?.kept ?? 0}, podcast-picks ${ic.podcast_pick?.kept ?? 0}`;
  const sc = meta.sos_coverage;
  const sosLine = sc && sc.teams
    ? `SoS: ${sc.teams} teams from ${sc.schedule_games} games (${sc.teams_with_market_sos} w/ market win-total opponents) · rank 1 = hardest`
    : `SoS: no ${meta.season} schedule loaded — omitted`;
  const sig = meta.signal_coverage || {};
  const signalLine = `Signals: ${sig.teams_with_analytics ?? 0} teams w/ EPA analytics · ${sig.teams_with_dvoa ?? 0} w/ DVOA snapshots · ${sig.teams_with_coaching_profile ?? 0} w/ coaching profiles · ${sig.teams_with_schedule_context ?? 0} w/ rest/travel · ${sig.teams_with_officiating ?? 0} w/ referee data · ${sig.teams_with_clv ?? 0} w/ CLV tracking · ${sig.teams_with_roster_churn ?? 0} w/ roster-churn data · ${sig.teams_with_injuries ?? 0} w/ injury data (2026-07-22 follow-up — early-season counts will be low by design, see FUTURES_AGENT_DATA_INVENTORY doc)`;
  const L = [`# Portfolio Dossier — ${meta.generated_at}`, '',
    `Season ${meta.season} · ${meta.snapshot_count} snapshots · books: ${meta.books.join(', ')}`, intelLine, sosLine, signalLine, ''];
  for (const [mk, rows] of Object.entries(synth)) {
    L.push(`## ${mk}  (${rows.length})`);
    for (const r of rows.slice(0, 8)) {
      // 2026-07-22 live-run fix: team-profile fields no longer live inline on the
      // row (see buildTeamProfiles/buildSynthesisInput) — look them up by team
      // name. Matchup rows (team_a/team_b) report team_a's profile here; the .md
      // is a human skim summary, not the model input, so single-team-labeled is
      // an acceptable simplification (better than the old silently-wrong blob).
      const prof = teamProfiles?.[r.team_nick || r.team_a] || {};
      const pr = prof.prior ? ` · prior ${prof.prior[0]}` : '';
      const ss = sosMd(prof.sos);
      const an = analyticsMd(prof.analytics);
      const dv = dvoaMd(prof.dvoa);
      const coach = coachingMd(prof.coaching_profile);
      const sched = scheduleMd(prof.schedule_context);
      const off = officiatingMd(prof.officiating_context);
      const clv = clvMd(prof.clv_signal);
      const inj = injuriesMd(prof.injuries);
      if (r.consensus_line != null) L.push(`- **${r.team}** wins ${r.consensus_line} · O ${r.best_over ?? '-'}@${r.best_over_book ?? '-'} (edge ${r.best_over_edge_pct ?? '-'}%, fair ${r.over_fair_prob ?? '-'}, n${r.line_consensus_confidence?.over_n_books ?? 0}) / U ${r.best_under ?? '-'}@${r.best_under_book ?? '-'} (edge ${r.best_under_edge_pct ?? '-'}%, fair ${r.under_fair_prob ?? '-'}, n${r.line_consensus_confidence?.under_n_books ?? 0})${r.line_value_signal ? ` · ${r.line_value_signal}` : ''}${leanTag(r.lean)}${pr}${ss}${an}${dv}${coach}${sched}${off}${clv}${inj}`);
      else L.push(`- **${r.team}** fair ${r.fair_prob} · best ${r.best_price} @${r.best_book} · value_gap ${r.value_gap} · book_div ${r.book_divergence}${leanTag(r.lean)}${pr}${ss}${an}${dv}${coach}${sched}${off}${clv}${inj}`);
    }
    L.push('');
  }
  if (experts && Object.keys(experts).length) {
    L.push('## Experts / analysts (who likes what)');
    for (const [name, picks] of Object.entries(experts).sort((a, b) => b[1].length - a[1].length).slice(0, 25)) {
      const summary = picks.slice(0, 8).map((p) => `${p.team} ${p.market}/${p.direction}`).join(', ');
      L.push(`- **${name}** (${picks.length}): ${summary}`);
    }
    L.push('');
  }
  return L.join('\n');
}

// ── main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`📊 Portfolio dossier — season ${SEASON}${SINCE ? ` since ${SINCE}` : ''}`);
  const [snaps, pickSignals, userPicks, podcastRows, priorByTeam, games, oddsOpenByGame, splitsLatestByGame, refereeByName, rosterChurnByTeam, injuriesByTeam, advancedAnalyticsByTeam, dvoaByTeam, coachingByTeam, trainingCampIntelByTeam, playerAvailabilityByTeam] = await Promise.all([
    fetchSnapshots(), fetchPickSignals(), fetchUserPicks(), fetchPodcastIntel(), fetchTeamStats(), fetchSchedule(),
    fetchGameOddsOpen(), fetchGameSplitsLatest(), fetchRefereeTendencies(), fetchRosterChurn(), fetchInjuryContext(),
    fetchAdvancedAnalytics(), fetchDvoaSnapshots(), fetchCoachingProfiles(), fetchTrainingCampIntel(), fetchPlayerAvailabilityContext(),
  ]);
  const books = [...new Set(snaps.map((s) => s.book))].sort();
  console.log(`   ${snaps.length} snapshots · ${pickSignals.length} article signals · ${userPicks.length} expert picks · ${podcastRows.length} podcast transcripts · ${Object.keys(priorByTeam).length} teams w/ prior stats · ${games.length} schedule games · ${Object.keys(trainingCampIntelByTeam).length} teams w/ camp intel`);

  const markets = buildOddsView(snaps);

  // strength-of-schedule — depends on the wins market (for the market-implied metric)
  const oppByTeam = buildOpponents(games);
  const sos = buildSosView(oppByTeam, markets.wins || {}, priorByTeam);
  const sos_coverage = { schedule_games: games.length, teams: sos.teams, teams_with_market_sos: sos.with_market };
  if (sos.teams) console.log(`   SoS: ${sos.teams} teams (${sos.with_market} w/ market win-total opponents) from ${games.length} games`);
  else console.log(`   SoS: no ${SEASON} schedule in games table — SoS omitted`);

  // S296 follow-up (2026-07-22): rest/travel, officiating, CLV per-team signals
  const teamSignals = buildTeamSignals(games, oddsOpenByGame, splitsLatestByGame, refereeByName);
  const analyticsTeamSet = new Set([
    ...Object.keys(priorByTeam).filter((t) => currentAnalytics(priorByTeam[t])),
    ...Object.keys(advancedAnalyticsByTeam),
  ]);
  const analyticsTeamCount = analyticsTeamSet.size;
  console.log(`   signals: ${analyticsTeamCount} teams w/ EPA analytics · ${Object.keys(dvoaByTeam).length} w/ DVOA · ${Object.keys(coachingByTeam).length} w/ coaching profiles · ${Object.keys(teamSignals.scheduleOut).length} w/ rest data · ${Object.keys(teamSignals.officiatingOut).length} w/ referee data · ${Object.keys(teamSignals.clvOut).length} w/ CLV tracking · ${Object.keys(rosterChurnByTeam).length} w/ roster-churn data · ${Object.keys(injuriesByTeam).length} w/ injury data · ${Object.keys(trainingCampIntelByTeam).length} w/ camp intel`);

  let findLean, adjacent_signals = {}, experts = {}, intel_coverage;
  const norm = await loadNormalizedSignals();
  if (norm && norm.signals.length) {
    const nf = makeNormalizedFindLean(norm.signals);
    findLean = nf.findLean; adjacent_signals = nf.adjacentByTeam; experts = nf.byAuthor;
    intel_coverage = { mode: 'normalized', signals: norm.signals.length, team_market_combos: nf.combos, experts: Object.keys(experts).length, adjacent_teams: Object.keys(adjacent_signals).length, source: path.basename(norm.path) };
    console.log(`   intel: normalized — ${norm.signals.length} signals, ${nf.combos} combos, ${intel_coverage.experts} analysts, ${intel_coverage.adjacent_teams} adjacent (${intel_coverage.source})`);
  } else {
    const inline = buildLeanView(pickSignals, userPicks, podcastRows);
    findLean = inline.findLean; intel_coverage = { mode: 'inline', ...inline.coverage };
    console.log(`   intel: inline fallback (run agents/signal-normalize.js for the richer layer)`);
  }

  // 2026-07-22 live-run fix: collect every distinct team nickname actually
  // referenced across all markets (handles both single-team rows and
  // "Team A vs Team B" matchup rows) so team_profiles covers exactly what
  // synthesis_input needs — no more, no less.
  const teamNickSet = new Set();
  for (const teams of Object.values(markets)) {
    for (const tm of Object.keys(teams)) {
      const mu = splitMatchupTeams(tm);
      if (mu) { teamNickSet.add(mu.a); teamNickSet.add(mu.b); }
      else { const n = normalizeTeam(tm); if (n) teamNickSet.add(n); }
    }
  }
  const team_profiles = buildTeamProfiles([...teamNickSet], priorByTeam, sos.findSos, teamSignals, injuriesByTeam, advancedAnalyticsByTeam, dvoaByTeam, coachingByTeam, trainingCampIntelByTeam, playerAvailabilityByTeam);

  const synthesis_input = buildSynthesisInput(markets, findLean);
  const signal_coverage = {
    teams_with_analytics: analyticsTeamCount,
    teams_with_dvoa: Object.keys(dvoaByTeam).length,
    teams_with_coaching_profile: Object.keys(coachingByTeam).length,
    teams_with_schedule_context: Object.keys(teamSignals.scheduleOut).length,
    teams_with_officiating: Object.keys(teamSignals.officiatingOut).length,
    teams_with_clv: Object.keys(teamSignals.clvOut).length,
    teams_with_roster_churn: Object.keys(rosterChurnByTeam).length,
    teams_with_injuries: Object.keys(injuriesByTeam).length,
    teams_with_player_availability: Object.keys(playerAvailabilityByTeam).length,
  };
  const meta = {
    generated_at: new Date().toISOString(), season: SEASON, since: SINCE,
    snapshot_count: snaps.length, books, market_types: Object.keys(markets),
    signal_counts: { article: pickSignals.length, expert: userPicks.length, podcast_transcripts: podcastRows.length },
    intel_coverage, sos_coverage, signal_coverage,
  };
  const schedule = games.map((g) => ({
    game_id: g.game_id,
    season: g.season,
    week: g.week,
    season_type: g.season_type,
    home: normalizeTeam(g.home_team || g.home_abbrev),
    away: normalizeTeam(g.away_team || g.away_abbrev),
    div_game: !!g.div_game,
  })).filter((g) => g.home && g.away);
  const dossier = { meta, synthesis_input, experts, adjacent_signals, sos: sos.raw, roster_churn: rosterChurnByTeam, injuries: injuriesByTeam, player_availability: playerAvailabilityByTeam, team_profiles, schedule, detail: markets };

  await mkdir(OUT_DIR, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const jsonPath = path.join(OUT_DIR, `dossier-${date}.json`);
  const mdPath = path.join(OUT_DIR, `dossier-${date}.md`);
  await writeFile(jsonPath, JSON.stringify(dossier, null, 2));
  await writeFile(mdPath, toMarkdown(meta, synthesis_input, experts, team_profiles));
  console.log(`✅ wrote ${jsonPath}`);
  console.log(`✅ wrote ${mdPath}`);
  console.log(`   next: node agents/portfolio-synthesize.js --dossier "${jsonPath}"`);
})().catch((e) => { console.error('✖', e.message); process.exitCode = 1; });
