#!/usr/bin/env node
// agents/portfolio-preflight.js
// ═══════════════════════════════════════════════════════════════════════════════
// PortfolioPreflightGate — FREE, READ-ONLY end-to-end validation of every input
// the futures committee consumes, run BEFORE any paid portfolio-synthesize.js run.
//
// Why this exists (2026-09-04, after a full end-to-end audit):
//   The pipeline degrades SILENTLY at every seam. The 2026-09-02 run emitted a
//   complete-looking 32KB HTML report with final:0 recommendations and exit 0,
//   after one model died mid-JSON. Stale 2025 analytics, a PostgREST 1000-row
//   cap, an injury filter that never matches "Injured Reserve", a team-key split
//   that halves every non-wins market, and a --shadow-slim path that drops 80%
//   of market rows all pass unnoticed. This gate makes each of those loud.
//
// GUARANTEES: makes ZERO paid API calls. Performs ZERO writes (no Supabase
//   inserts/updates, no file writes except an optional --out report). Safe to
//   run any time, as often as you like.
//
// Usage:
//   node agents/portfolio-preflight.js                  # human report, exit 1 on any BLOCK
//   node agents/portfolio-preflight.js --json           # machine-readable
//   node agents/portfolio-preflight.js --warn-only      # never exit non-zero
//   node agents/portfolio-preflight.js --dossier <path> # check a specific dossier
//   node agents/portfolio-preflight.js --model gpt-4o   # which signals sidecar to expect
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ═══════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFile, readdir, stat } from 'node:fs/promises';
// Validate the SHIPPING logic, never a copy of it — see agents/lib/injury-status.js
import { normalizeInjuryStatus, INJURY_RELEVANT_STATUS } from './lib/injury-status.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const argVal = (n, d = null) => { const i = process.argv.indexOf(n); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const hasFlag = (n) => process.argv.includes(n);

const JSON_OUT  = hasFlag('--json');
const WARN_ONLY = hasFlag('--warn-only');
const MODEL     = argVal('--model', 'gpt-4o');
const SEASON    = Number(argVal('--season', '2026'));
const NOW       = Date.now();

const sb = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// ─── Result collection ────────────────────────────────────────────────────────

const results = [];
const add = (stage, lane, status, detail, fix = null) =>
  results.push({ stage, lane, status, detail, fix });

const BLOCK = 'BLOCK', WARN = 'WARN', PASS = 'PASS', ERROR = 'ERROR';

const daysSince = (ts) => ts ? (NOW - new Date(ts).getTime()) / 86400000 : null;
const fmtAge = (d) => d == null ? 'unknown' : `${d.toFixed(1)}d`;

/** Wrap a check so a schema surprise reports as ERROR instead of crashing the gate. */
async function check(stage, lane, fn) {
  try { await fn(); }
  catch (e) { add(stage, lane, ERROR, `check itself failed: ${e.message}`); }
}

// ─── Supabase helpers (read-only) ─────────────────────────────────────────────

async function rowCount(table, filters = {}) {
  let q = sb.from(table).select('*', { count: 'exact', head: true });
  for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Try a list of candidate timestamp columns; return {col, ts} for the newest. */
async function newestTs(table, cols, filters = {}) {
  for (const col of cols) {
    try {
      let q = sb.from(table).select(col).order(col, { ascending: false }).limit(1);
      for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
      const { data, error } = await q;
      if (error) continue;
      if (data?.length && data[0][col]) return { col, ts: data[0][col] };
    } catch { /* try next */ }
  }
  return { col: null, ts: null };
}

// ─── Local file helpers ───────────────────────────────────────────────────────

async function readJsonIf(rel) {
  const p = path.join(ROOT, rel);
  try {
    const [txt, st] = await Promise.all([readFile(p, 'utf8'), stat(p)]);
    return { path: p, rel, json: JSON.parse(txt), mtime: st.mtimeMs, bytes: st.size };
  } catch (e) { return { path: p, rel, error: e.code || e.message }; }
}

/**
 * A file's mtime lies when a rebuild re-derives stale upstream content.
 * Always prefer an embedded content timestamp when one exists.
 */
function contentTs(json) {
  if (!json || typeof json !== 'object') return null;
  return json?.meta?.generated_at || json.generated_at || json.as_of ||
         json.updated_at || json?.meta?.source_generated_at || json.created || null;
}

// ══════════════════════════════════════════════════════════════════════════════
// STAGE A — DATABASE SOURCES: populated, fresh, and not silently row-capped
// ══════════════════════════════════════════════════════════════════════════════

// PostgREST silently caps any unpaginated .select() at 1000 rows — no error, no
// warning. Rather than trusting a hand-maintained list of which readers are
// unpaginated (a list that goes stale the moment someone fixes one, and then
// reports a fixed reader as broken forever), this scans the actual source of the
// pipeline agents and decides per call site. Self-updating by construction.
const SCANNED_SOURCES = [
  'agents/portfolio-dossier.js',
  'agents/signal-normalize.js',
  'agents/portfolio-synthesize.js',
];

/**
 * Find every `from('<table>')` call site in a source file and judge whether that
 * particular read is bounded safely. A site is SAFE when it paginates
 * (`.range(` / `fetchAllPaged`), only counts (`head: true`), expects one row
 * (`.single()` / `.maybeSingle()`), or takes a deliberate sub-1000 `.limit(n)`.
 * Anything else on a table of >=1000 rows is silently truncated.
 */
function scanCallSites(src, file) {
  const sites = [];
  for (const m of src.matchAll(/\.from\(\s*['"]([a-zA-Z0-9_]+)['"]\s*\)/g)) {
    const table = m[1];
    const line = src.slice(0, m.index).split('\n').length;
    const win = src.slice(m.index, m.index + 900);
    const stop = win.search(/\n\s*(async\s+)?function\s/);
    const scope = stop > 0 ? win.slice(0, stop) : win;

    const paginated = /\.range\(/.test(scope) || /fetchAllPaged/.test(src.slice(Math.max(0, m.index - 400), m.index + 900));
    const countOnly = /head:\s*true/.test(scope);
    const singleRow = /\.(maybe)?[Ss]ingle\(/.test(scope);
    const limitM = scope.match(/\.limit\(\s*(\d+)\s*\)/);
    const boundedSmall = limitM && Number(limitM[1]) < 1000;

    sites.push({
      table, file, line,
      safe: paginated || countOnly || singleRow || boundedSmall,
      why: paginated ? 'paginated' : countOnly ? 'count-only' : singleRow ? 'single-row'
           : boundedSmall ? `bounded .limit(${limitM[1]})` : (limitM ? `.limit(${limitM[1]}) — inert, PostgREST caps at 1000` : 'unpaginated'),
    });
  }
  return sites;
}

async function stageA() {
  if (!sb) { add('A:database', 'supabase', BLOCK, 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — cannot validate any DB lane'); return; }

  // --- Current-season team analytics: the "current form" the model is told to trust
  await check('A:database', 'nfl_team_season_stats', async () => {
    const cur = await rowCount('nfl_team_season_stats', { season: SEASON });
    if (cur === 0) {
      const { ts } = await newestTs('nfl_team_season_stats', ['updated_at', 'created_at']);
      add('A:database', 'nfl_team_season_stats', BLOCK,
        `ZERO rows for season ${SEASON} (last updated ${fmtAge(daysSince(ts))} ago). currentAnalytics() silently serves the ${SEASON - 1} row instead, and SYSTEM_PROMPT tells the model to trust it as "this season's actual play".`,
        'portfolio-dossier.js:360 — refuse to present a prior-season row as current form');
    } else if (cur < 32) {
      add('A:database', 'nfl_team_season_stats', WARN, `only ${cur}/32 teams have ${SEASON} rows`);
    } else {
      add('A:database', 'nfl_team_season_stats', PASS, `${cur} rows for ${SEASON}`);
    }
  });

  await check('A:database', 'team_analytic_snapshots', async () => {
    const cur = await rowCount('team_analytic_snapshots', { season: SEASON });
    if (cur === 0) {
      add('A:database', 'team_analytic_snapshots', BLOCK,
        `ZERO rows for season ${SEASON}. fetchAdvancedAnalytics() hard-filters .eq('season',${SEASON}) then falls back to a local file filtered on filename includes('${SEASON}') — which matches nothing. Result: success_rate, cpoe, explosive_*, pressure_*, sack_* are 0/32 with NO warning printed.`,
        'portfolio-dossier.js:588 — fail loud when the season filter returns nothing');
    } else add('A:database', 'team_analytic_snapshots', PASS, `${cur} rows for ${SEASON}`);
  });

  await check('A:database', 'team_coaching_tendency_snapshots', async () => {
    const total = await rowCount('team_coaching_tendency_snapshots');
    if (total === 0) add('A:database', 'team_coaching_tendency_snapshots', WARN,
      'table is empty for ALL seasons — coaching_profile is 0/32 in every dossier');
    else add('A:database', 'team_coaching_tendency_snapshots', PASS, `${total} rows`);
  });

  // --- Odds: per-placeable-book staleness. A 25-day-old price on a placeable
  //     book is demoted but never dropped, so it can still surface as best_price.
  await check('A:database', 'futures_odds_snapshots', async () => {
    const total = await rowCount('futures_odds_snapshots', { season: SEASON });
    if (total === 0) { add('A:database', 'futures_odds_snapshots', BLOCK, `no ${SEASON} odds rows at all`); return; }

    const PLACEABLE = ['bookmaker', 'betus', 'betonline', 'betmgm', 'caesars', 'circa'];
    const MAX_QUOTE_AGE_DAYS = 3; // mirrors MAX_QUOTE_AGE_HOURS=72 in portfolio-dossier.js:86
    const stale = [], missing = [], fresh = [];
    for (const book of PLACEABLE) {
      const { ts } = await newestTs('futures_odds_snapshots', ['snapshot_time', 'captured_at', 'created_at'], { season: SEASON, book });
      if (!ts) { missing.push(book); continue; }
      const age = daysSince(ts);
      if (age > MAX_QUOTE_AGE_DAYS) stale.push(`${book} ${fmtAge(age)}`); else fresh.push(`${book} ${fmtAge(age)}`);
    }
    const detail = `${total} rows. placeable books — fresh: ${fresh.join(', ') || 'none'}${stale.length ? ` | STALE: ${stale.join(', ')}` : ''}${missing.length ? ` | NEVER CAPTURED: ${missing.join(', ')}` : ''}`;
    if (stale.length || missing.length) {
      add('A:database', 'futures_odds_snapshots', BLOCK, detail,
        'Stale placeable quotes are demoted but still emitted as best_price. Re-ingest before running, or accept that best_price may be a weeks-old number you cannot actually bet.');
    } else add('A:database', 'futures_odds_snapshots', PASS, detail);
  });

  // --- Schedule
  await check('A:database', 'games', async () => {
    const { data, error } = await sb.from('games').select('season_type, home_team, away_team').eq('season', SEASON).limit(1000);
    if (error) throw new Error(error.message);
    const reg = (data || []).filter(g => g.season_type === 2);
    const teams = new Set(); reg.forEach(g => { teams.add(g.home_team); teams.add(g.away_team); });
    if (reg.length !== 272 || teams.size !== 32)
      add('A:database', 'games', WARN, `${reg.length} regular-season games / ${teams.size} teams (expected 272 / 32)`);
    else add('A:database', 'games', PASS, `272 regular-season games, all 32 teams`);
  });

  // --- Roster churn needs >=2 distinct weeks or it silently returns {}
  await check('A:database', 'nfl_rosters', async () => {
    const { data, error } = await sb.from('nfl_rosters').select('week').eq('season', SEASON).order('week', { ascending: false }).limit(1000);
    if (error) throw new Error(error.message);
    const weeks = [...new Set((data || []).map(r => r.week))];
    if (weeks.length < 2) {
      add('A:database', 'nfl_rosters', WARN,
        `only ${weeks.length} distinct week(s) for ${SEASON} — fetchRosterChurn() returns {} silently (no warn). roster_churn is empty in the prompt.`,
        'ARMED LANDMINE: once week 2 lands, the unpaginated per-week read (1000 of ~3575 rows) will diff two arbitrary 28% slices and emit hundreds of fake adds/drops per team. Paginate portfolio-dossier.js:799 BEFORE week 2.');
    } else add('A:database', 'nfl_rosters', PASS, `${weeks.length} weeks available`);
  });

  // --- Injuries: freshness AND the status-whitelist bug
  await check('A:database', 'player_injuries', async () => {
    const { ts } = await newestTs('player_injuries', ['captured_at', 'created_at', 'updated_at']);
    const age = daysSince(ts);
    if (age == null || age > 3) add('A:database', 'player_injuries', WARN, `newest injury row is ${fmtAge(age)} old`);
    else add('A:database', 'player_injuries', PASS, `newest injury row ${fmtAge(age)} old`);

    // The dossier filter is a lowercase whitelist: {out, doubtful, ir, pup, questionable}.
    // Real DB values include "Injured Reserve", which lowercases to "injured reserve"
    // and never equals "ir" — so every IR designation is silently discarded.
    // NOTE: this scan MUST paginate. An earlier version used .limit(1000) and was
    // silently truncated by the very PostgREST cap this gate exists to catch —
    // it never saw an "Injured Reserve" row and wrongly reported PASS.
    const counts = {};
    for (let from = 0; ; from += 1000) {
      const { data, error } = await sb.from('player_injuries').select('injury_status').range(from, from + 999);
      if (error) throw new Error(error.message);
      if (!data.length) break;
      for (const r of data) { const s = (r.injury_status || '').trim(); if (s) counts[s] = (counts[s] || 0) + 1; }
      if (data.length < 1000) break;
    }
    // Run each real DB spelling through the shipping normalizer: anything that is
    // neither 'active' nor a recognized relevant status is silently dropped by the
    // dossier, so it must surface here.
    const dropped = Object.entries(counts)
      .filter(([s]) => {
        const n = normalizeInjuryStatus(s);
        return n !== 'active' && n !== null && !INJURY_RELEVANT_STATUS.has(n);
      })
      .sort((a, b) => b[1] - a[1]);
    if (dropped.length) {
      const tot = dropped.reduce((a, [, n]) => a + n, 0);
      add('A:database', 'player_injuries.status_filter', BLOCK,
        `normalizeInjuryStatus() does not recognize ${tot} non-Active injury row(s): ${dropped.map(([s, n]) => `"${s}"=${n}`).join(', ')} — these are silently dropped from the dossier.`,
        'agents/lib/injury-status.js — add these spellings to normalizeInjuryStatus() / INJURY_RELEVANT_STATUS');
    } else {
      const kept = Object.entries(counts).filter(([s]) => { const n = normalizeInjuryStatus(s); return n !== 'active' && n !== null; })
        .reduce((a, [, n]) => a + n, 0);
      add('A:database', 'player_injuries.status_filter', PASS, `every non-Active status is recognized (${kept} relevant rows across ${Object.keys(counts).length} distinct spellings)`);
    }
  });

  // --- Intel lanes
  await check('A:database', 'normalized_signals', async () => {
    const total = await rowCount('normalized_signals');
    const { ts } = await newestTs('normalized_signals', ['created_at', 'updated_at']);
    const age = daysSince(ts);
    if (total === 0) add('A:database', 'normalized_signals', BLOCK, 'table empty');
    else if (age > 7) add('A:database', 'normalized_signals', WARN, `${total} rows, newest ${fmtAge(age)} old`);
    else add('A:database', 'normalized_signals', PASS, `${total} rows, newest ${fmtAge(age)} old`);
  });

  await check('A:database', 'podcast_extraction_coverage', async () => {
    const transcripts = await rowCount('podcast_transcripts');
    let reex = 0; try { reex = await rowCount('podcast_reextractions'); } catch { /* table may not exist */ }
    const pct = transcripts ? (reex / transcripts * 100) : 0;
    if (pct < 100) {
      add('A:database', 'podcast_extraction_coverage', BLOCK,
        `${reex}/${transcripts} transcripts (${pct.toFixed(1)}%) have a full-transcript re-extraction. podcast-ingest.js only ever sent the first 12,000 chars to the model, so the rest are extracted from ~24% of their content.`,
        'Run agents/podcast-reextract.js to completion, THEN point signal-normalize.js at podcast_reextractions (it currently reads podcast_transcripts only).');
    } else add('A:database', 'podcast_extraction_coverage', PASS, `${reex}/${transcripts} re-extracted`);
  });

  await check('A:database', 'podcast_host_summaries', async () => {
    const total = await rowCount('podcast_host_summaries');
    if (total === 0) { add('A:database', 'podcast_host_summaries', PASS, 'empty'); return; }
    // 2026-09-04 Tier-4 fix: wired into agents/signal-normalize.js's
    // gatherHostSummaryRows() (pre-classified, no LLM cost) -> normalized_signals
    // sidecar -> portfolio-dossier.js's makeNormalizedFindLean(). Check the actual
    // source for that wiring rather than assuming the old "never read" state --
    // same self-referential-gate lesson as the injury-status/market-row-retention
    // checks: verify against real code, don't freeze an old finding as permanent.
    const src = await readFile(path.join(ROOT, 'agents', 'signal-normalize.js'), 'utf8');
    const wired = /gatherHostSummaryRows|from\('podcast_host_summaries'\)/.test(src);
    if (wired) add('A:database', 'podcast_host_summaries', PASS,
      `${total} rows of FULL-transcript-fidelity host extraction are wired into signal-normalize.js -> normalized_signals -> the dossier.`);
    else add('A:database', 'podcast_host_summaries', WARN,
      `${total} rows of FULL-transcript-fidelity host extraction exist and are NOT read by portfolio-dossier.js or portfolio-synthesize.js. The one intel source without the 12k truncation bug never reaches the report.`,
      'Wire podcast_host_summaries into the dossier, or generate the docs/Futures_Picks_Summary_<date>.md that loadPodcastEvidenceIndex() looks for (nothing in the repo produces it).');
  });

  // --- Silent 1000-row cap: judge every real call site against its table size
  await check('A:rowcap', 'scan', async () => {
    const sites = [];
    for (const rel of SCANNED_SOURCES) {
      try { sites.push(...scanCallSites(await readFile(path.join(ROOT, rel), 'utf8'), rel)); }
      catch { /* file may not exist in a given checkout */ }
    }
    const risky = sites.filter(x => !x.safe);
    const tables = [...new Set(risky.map(x => x.table))];

    const sizes = {};
    for (const t of tables) { try { sizes[t] = await rowCount(t); } catch { sizes[t] = null; } }

    const truncating = risky.filter(x => (sizes[x.table] ?? 0) >= 1000);
    const fine = risky.filter(x => (sizes[x.table] ?? 0) < 1000 && sizes[x.table] !== null);

    if (truncating.length) {
      for (const x of truncating) {
        add('A:rowcap', `${x.table} @ ${x.file}:${x.line}`, BLOCK,
          `${sizes[x.table].toLocaleString()} rows, read ${x.why} — PostgREST silently returns 1000 (${(1000 / sizes[x.table] * 100).toFixed(1)}%).`,
          'Add a .range() pagination loop (fetchAllPaged() in portfolio-dossier.js is the shared helper).');
      }
    }
    const safeCount = sites.length - risky.length;
    add('A:rowcap', 'call-site scan', truncating.length ? WARN : PASS,
      `${sites.length} Supabase read sites across ${SCANNED_SOURCES.length} agents: ${safeCount} safely bounded, ${truncating.length} truncating, ${fine.length} unbounded but on small tables.`);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// STAGE B — LOCAL FILE LANES: exist, and are fresh by CONTENT date not mtime
// ══════════════════════════════════════════════════════════════════════════════
// The existing freshness gate hashes files and detects drift only. A file frozen
// since August has a stable hash and passes forever. These are absolute-age checks.

const FILE_LANES = [
  { rel: 'data/player-availability/latest.json', maxAgeDays: 7,  required: true,  feeds: 'player_availability (32/32 teams)' },
  { rel: `data/training-camp/${SEASON}/latest.json`, maxAgeDays: 14, required: false, feeds: 'training_camp_intel' },
  { rel: 'data/expert-dossiers/latest.json',    maxAgeDays: 14, required: false, feeds: 'expertDossierLine in the prompt' },
  { rel: 'data/prediction-markets/latest.json', maxAgeDays: 7,  required: false, feeds: 'prediction_markets (NOT WIRED to the report)' },
];

async function stageB() {
  for (const lane of FILE_LANES) {
    await check('B:files', lane.rel, async () => {
      const f = await readJsonIf(lane.rel);
      if (f.error) {
        add('B:files', lane.rel, lane.required ? BLOCK : WARN,
          `missing or unreadable (${f.error}) — the loader swallows this and returns {} with no warning`, `feeds ${lane.feeds}`);
        return;
      }
      const cts = contentTs(f.json);
      const age = daysSince(cts) ?? daysSince(f.mtime);
      const src = cts ? 'content timestamp' : 'file mtime';
      if (age != null && age > lane.maxAgeDays) {
        add('B:files', lane.rel, BLOCK, `${fmtAge(age)} old by ${src} (limit ${lane.maxAgeDays}d) — feeds ${lane.feeds}`,
          'Rebuild this lane, or accept that the model is reasoning on stale inputs.');
      } else add('B:files', lane.rel, PASS, `${fmtAge(age)} old by ${src}`);
    });
  }

  // Money/policy inputs: these soft-fail to null and the run proceeds unsized.
  const MONEY = [
    { rel: 'data/futures-imports/platinum-rose-ai-official-2026.json', label: 'contract (bankroll + sizing_map)', maxAgeDays: null },
    { rel: 'data/futures-imports/andy-portfolio-ledger-2026.json',     label: 'ledger (live exposure)',           maxAgeDays: 21 },
    { rel: 'data/futures-imports/futures-watchlist-2026.json',         label: 'watchlist',                        maxAgeDays: 21 },
  ];
  for (const m of MONEY) {
    await check('B:money', m.label, async () => {
      const f = await readJsonIf(m.rel);
      if (f.error) {
        add('B:money', m.label, BLOCK,
          `${m.rel} missing (${f.error}). loadOfficialConfig/loadLedger/loadWatchlist all catch and return null, then the run continues and sizes every proposal with NO bankroll rules.`,
          'This should be a hard failure in portfolio-synthesize.js, not a console.warn.');
        return;
      }
      const cts = contentTs(f.json);
      const age = daysSince(cts);
      // The contract carries a hard cutoff date the code never checks.
      if (f.json?.futures_portfolio?.cutoff_utc || f.json?.cutoff_utc) {
        const cutoff = f.json?.futures_portfolio?.cutoff_utc || f.json?.cutoff_utc;
        const daysToCutoff = -daysSince(cutoff);
        if (daysToCutoff < 0) add('B:money', 'contract.cutoff', BLOCK, `cutoff_utc ${cutoff} has PASSED (${Math.abs(daysToCutoff).toFixed(1)}d ago) and nothing in the code notices`);
        else add('B:money', 'contract.cutoff', PASS, `cutoff_utc ${cutoff} in ${daysToCutoff.toFixed(1)}d`);
      }
      if (m.maxAgeDays && age != null && age > m.maxAgeDays)
        add('B:money', m.label, WARN, `${fmtAge(age)} stale — the committee sizes against exposure this old`);
      else add('B:money', m.label, PASS, age == null ? 'present' : `${fmtAge(age)} old`);
    });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// STAGE C — RUN-ORDER INTEGRITY: is the dossier built from the CURRENT signals?
// ══════════════════════════════════════════════════════════════════════════════

async function findLatestDossier() {
  const explicit = argVal('--dossier');
  if (explicit) return path.isAbsolute(explicit) ? explicit : path.join(ROOT, explicit);
  const dir = path.join(ROOT, '.nfl', 'portfolio');
  const files = (await readdir(dir)).filter(f => /^dossier-\d{4}-\d{2}-\d{2}.*\.json$/.test(f)).sort();
  return files.length ? path.join(dir, files[files.length - 1]) : null;
}

let DOSSIER = null;

async function stageC() {
  await check('C:runorder', 'dossier', async () => {
    const p = await findLatestDossier();
    if (!p) { add('C:runorder', 'dossier', BLOCK, 'no dossier-<date>.json found in .nfl/portfolio/ — run portfolio-dossier.js first'); return; }
    DOSSIER = JSON.parse(await readFile(p, 'utf8'));
    const age = daysSince(DOSSIER?.meta?.generated_at);
    const rel = path.relative(ROOT, p);
    if (age > 1) add('C:runorder', 'dossier', WARN, `${rel} is ${fmtAge(age)} old`);
    else add('C:runorder', 'dossier', PASS, `${rel}, ${fmtAge(age)} old`);
  });

  // The sidecar is the dominant intel path. If it was regenerated AFTER the
  // dossier was built, the dossier silently carries fewer signals and its own
  // intel_coverage faithfully reports the smaller number, so nothing looks wrong.
  await check('C:runorder', 'signals-vs-dossier', async () => {
    const sidecarRel = path.join('.nfl', 'portfolio', `normalized-signals-${MODEL}.json`);
    const f = await readJsonIf(sidecarRel);
    if (f.error) {
      add('C:runorder', 'signals-vs-dossier', BLOCK,
        `${sidecarRel} missing (${f.error}). loadNormalizedSignals() catches this and returns null, silently downgrading experts{} and adjacent_signals{} to empty.`);
      return;
    }
    const sidecarCount = Array.isArray(f.json?.signals) ? f.json.signals.length : 0;
    const dossierCount = DOSSIER?.meta?.intel_coverage?.signals ?? null;
    const sidecarTs = contentTs(f.json);
    const dossierTs = DOSSIER?.meta?.generated_at;

    if (dossierCount == null) { add('C:runorder', 'signals-vs-dossier', WARN, 'dossier has no meta.intel_coverage.signals to compare'); return; }
    if (sidecarTs && dossierTs && new Date(sidecarTs) > new Date(dossierTs)) {
      const lost = sidecarCount - dossierCount;
      add('C:runorder', 'signals-vs-dossier', BLOCK,
        `RUN ORDER VIOLATION: signals sidecar regenerated at ${sidecarTs} (${sidecarCount} signals) AFTER the dossier was built at ${dossierTs} (${dossierCount} signals). The dossier is missing ${lost} signals (${(lost / sidecarCount * 100).toFixed(0)}% of available intel) and reports the smaller number as if correct.`,
        'Re-run portfolio-dossier.js. Correct order is always: signal-normalize -> portfolio-dossier -> portfolio-synthesize.');
    } else if (sidecarCount !== dossierCount) {
      add('C:runorder', 'signals-vs-dossier', WARN, `sidecar has ${sidecarCount} signals, dossier used ${dossierCount}`);
    } else add('C:runorder', 'signals-vs-dossier', PASS, `${sidecarCount} signals, dossier in sync`);
  });

  // portfolio-simulate.js patches sim fields into the dossier in place. Without
  // it, the CI90-lower-bound invalidation rule silently never fires.
  await check('C:runorder', 'sim-patch', async () => {
    if (!DOSSIER) return;
    if (!DOSSIER?.meta?.sim_version) {
      add('C:runorder', 'sim-patch', WARN,
        'dossier is NOT sim-patched (no meta.sim_version). deterministicFairLowerFor() returns null, so the "edge_lower_bound <= 0" invalidation rule is a silent no-op — a gate that reads as active in the code but never fires.',
        'Run portfolio-simulate.js after portfolio-dossier.js.');
    } else add('C:runorder', 'sim-patch', PASS, `sim_version ${DOSSIER.meta.sim_version}`);
  });

  // Coverage counters the dossier computes about itself.
  await check('C:runorder', 'signal_coverage', async () => {
    if (!DOSSIER) return;
    const sc = DOSSIER.signal_coverage || DOSSIER?.meta?.signal_coverage || {};
    const zeros = Object.entries(sc).filter(([k, v]) => typeof v === 'number' && v === 0 && /^teams_with_/.test(k));
    if (zeros.length) add('C:runorder', 'signal_coverage', WARN,
      `dossier reports ZERO team coverage for: ${zeros.map(([k]) => k.replace('teams_with_', '')).join(', ')}`);
    else add('C:runorder', 'signal_coverage', PASS, 'no zeroed team-coverage counters');
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// STAGE D — PROMPT ASSEMBLY SIMULATION (no model call, no cost)
// ══════════════════════════════════════════════════════════════════════════════
// Replays what --shadow-slim actually ships to the model, so data destroyed at
// the prompt seam is visible BEFORE paying. Limits are parsed out of the real
// source file so this cannot drift out of sync with the code it validates.

async function parseSlimLimits() {
  const src = await readFile(path.join(ROOT, 'agents', 'portfolio-synthesize.js'), 'utf8');
  const block = src.match(/const\s+limits\s*=\s*\{([\s\S]*?)\}/);
  const limits = {};
  if (block) for (const m of block[1].matchAll(/([A-Za-z0-9_']+)\s*:\s*(\d+)/g)) limits[m[1].replace(/'/g, '')] = Number(m[2]);
  const defM = src.match(/limits\[market\]\s*\?\?\s*(\d+)/);
  const keepM = src.match(/const\s+keepKeys\s*=\s*\[([\s\S]*?)\]/);
  const profM = src.match(/slimTeamProfile[\s\S]{0,400}?\[([\s\S]*?)\]/);
  return {
    limits,
    fallback: defM ? Number(defM[1]) : null,
    keepKeys: keepM ? [...keepM[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : [],
    profileKeys: profM ? [...profM[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : [],
  };
}

async function stageD() {
  if (!DOSSIER) return;
  const cfg = await parseSlimLimits();
  const synthSrc = await readFile(path.join(ROOT, 'agents', 'portfolio-synthesize.js'), 'utf8');

  // Mirrors the real edgeValue()/takeRows() algorithm in portfolio-synthesize.js so this
  // check tracks the actual current ranking rather than a frozen snapshot of an old bug.
  // Falls back to the old abs-value ranking if that source no longer looks like the
  // signed-edge-first version, so a future regression still gets caught instead of
  // silently validated against dead logic.
  const usesSignedEdgeRanking = /function\s+edgeValue\s*\(/.test(synthSrc) && /positive\.slice\(0,\s*n\)/.test(synthSrc);
  function gateEdgeValue(row) {
    if (row.consensus_line != null) {
      const over = row.best_over_edge_pct, under = row.best_under_edge_pct;
      if (over == null && under == null) return null;
      return Math.max(over ?? -Infinity, under ?? -Infinity);
    }
    if (row.value_gap != null) return row.value_gap;
    if (row.sim?.gap != null) return row.sim.gap;
    return null;
  }
  function gateEdgeMagnitude(row) {
    if (row.consensus_line != null) return Math.max(Math.abs(row.best_over_edge_pct ?? 0), Math.abs(row.best_under_edge_pct ?? 0));
    if (row.sim?.gap != null) return Math.abs(row.sim.gap);
    return Math.abs(row.value_gap ?? row.book_divergence ?? 0);
  }
  function gateTakeRows(rows, n) {
    if (!usesSignedEdgeRanking) return [...rows].sort((a, b) => gateEdgeMagnitude(b) - gateEdgeMagnitude(a)).slice(0, n);
    const all = [...rows];
    const positive = all.filter((r) => { const v = gateEdgeValue(r); return v != null && v > 0; });
    const posSet = new Set(positive);
    const rest = all.filter((r) => !posSet.has(r));
    positive.sort((a, b) => (gateEdgeValue(b) ?? -Infinity) - (gateEdgeValue(a) ?? -Infinity));
    rest.sort((a, b) => gateEdgeMagnitude(b) - gateEdgeMagnitude(a));
    const kept = positive.slice(0, n);
    if (kept.length < n) kept.push(...rest.slice(0, n - kept.length));
    return kept;
  }

  // D1 — how many market rows survive slimming, and are positive-edge rows lost?
  await check('D:prompt', 'market-row-retention', async () => {
    const si = DOSSIER.synthesis_input || {};
    let total = 0, kept = 0;
    const starved = [], edgeLoss = [];
    for (const [market, rows] of Object.entries(si)) {
      if (!Array.isArray(rows)) continue;
      const n = cfg.limits[market] ?? cfg.fallback ?? 4;
      total += rows.length; kept += Math.min(rows.length, n);
      if (!(market in cfg.limits) && rows.length > n) starved.push(`${market} ${rows.length}->${n}`);

      const keptRows = gateTakeRows(rows, n);
      const keptSet = new Set(keptRows);
      const droppedRows = rows.filter(r => !keptSet.has(r));
      const posDropped = droppedRows.filter(r => (gateEdgeValue(r) ?? 0) > 0);
      const posKept = keptRows.filter(r => (gateEdgeValue(r) ?? 0) > 0);
      if (posDropped.length && posKept.length === 0)
        edgeLoss.push(`${market}: all ${posDropped.length} positive-edge row(s) dropped, ${n} negative-edge rows kept`);
    }
    const pct = total ? ((total - kept) / total * 100) : 0;
    if (starved.length) add('D:prompt', 'market-row-retention', BLOCK,
      `${starved.length} market(s) still fall through to the undifferentiated ?? ${cfg.fallback} default instead of an explicit limit sized for that market: ${starved.slice(0, 8).join(', ')}${starved.length > 8 ? ` (+${starved.length - 8} more)` : ''}. Meanwhile SYSTEM_PROMPT orders the model to "scan every market (all 8 divisions...)".`,
      'portfolio-synthesize.js — give every market its own explicit entry in the limits map.');
    else if (pct > 80) add('D:prompt', 'market-row-retention', WARN,
      `--shadow-slim ships ${kept}/${total} market rows — ${pct.toFixed(1)}% dropped, but every market now has an explicit, sized limit (no silent ?? ${cfg.fallback} default left). The drop is concentrated in the largest combinatorial/candidate-pool markets (superbowl_matchup, awards) — re-check those limits as real coverage grows.`);
    else add('D:prompt', 'market-row-retention', PASS, `${kept}/${total} rows kept (${pct.toFixed(1)}% dropped) — every market has an explicit limit, none silently default`);

    if (edgeLoss.length) add('D:prompt', 'positive-edge-loss', BLOCK,
      `${usesSignedEdgeRanking ? 'Even with signed-edge-first ranking' : 'takeRows() still ranks by Math.abs(value_gap), so positive-EV longshots lose to negative-edge chalk'}. Markets where EVERY positive-edge row is dropped: ${edgeLoss.slice(0, 6).join(' | ')}${edgeLoss.length > 6 ? ` (+${edgeLoss.length - 6} more)` : ''}`,
      usesSignedEdgeRanking
        ? 'portfolio-synthesize.js — widen the limit for these markets so their positive-edge rows fit.'
        : 'portfolio-synthesize.js — rank by signed edge, or always retain positive-value_gap rows.');
    else add('D:prompt', 'positive-edge-loss', PASS, usesSignedEdgeRanking
      ? 'takeRows() ranks positive-edge rows first — no market loses all of its positive-edge rows to the budget'
      : 'no market loses all of its positive-edge rows');
  });

  // D2 — the team-key split: same team appearing twice per market under
  // different name spellings, halving the book pool behind each row.
  await check('D:prompt', 'team-key-split', async () => {
    const si = DOSSIER.synthesis_input || {};
    const split = [];
    for (const [market, rows] of Object.entries(si)) {
      // Same exclusion rule as canonicalizeSnapshots' isPlayerOrMultiSideMarket:
      // award_* are player names (two players can share a surname), exacta and
      // division_exact_position are compound position labels, and
      // superbowl_matchup is a two-sided "A vs B" label. None are team keys.
      const m = String(market).toLowerCase();
      if (!Array.isArray(rows) || m === 'superbowl_matchup' || m === 'exacta'
          || m === 'division_exact_position' || m.startsWith('award_')) continue;
      const byLast = {};
      for (const r of rows) {
        const name = String(r.team || r.selection || '?');
        const last = name.trim().split(/\s+/).pop().toLowerCase();
        (byLast[last] ??= []).push(name);
      }
      const dupes = Object.entries(byLast).filter(([, names]) => new Set(names).size > 1);
      if (dupes.length) split.push(`${market} (${dupes.length} team(s), e.g. ${[...new Set(dupes[0][1])].join(' / ')})`);
    }
    if (split.length) add('D:prompt', 'team-key-split', BLOCK,
      `The same team appears as multiple rows per market because buildOddsView groups on the raw book-supplied name: ${split.slice(0, 5).join('; ')}${split.length > 5 ? ` (+${split.length - 5} more markets)` : ''}. Each row devigs against only half the book pool, so the model sees two contradictory best prices for one bet — and validateRecommendationStrict (PRICE_TOLERANCE=0) will kill a pick that cites the better one.`,
      'portfolio-dossier.js:835 + :231-236 — normalize the team key for ALL markets, not just wins/playoffs.');
    else add('D:prompt', 'team-key-split', PASS, 'one row per team per market');
  });

  // D3 — adjacent_signals shape mismatch: producer emits an array, the slimmer
  // reads object properties off it, so every field comes back null.
  await check('D:prompt', 'adjacent_signals-shape', async () => {
    const adj = DOSSIER.adjacent_signals || {};
    const teams = Object.entries(adj);
    if (!teams.length) { add('D:prompt', 'adjacent_signals-shape', WARN, 'adjacent_signals is empty'); return; }
    const arrayShaped = teams.filter(([, v]) => Array.isArray(v)).length;
    // The old bug was slimDossierForPrompt reading .game_lean_count/.games/.props/.strongest
    // off an array — those accessors are the actual bug signature, not the array shape
    // itself. If the source no longer contains that accessor pattern, the mismatch is fixed
    // (whether via a passthrough or a real reshape) regardless of what shape the producer emits.
    const stillReadsObjectFields = /adjacent_signals[\s\S]{0,400}?game_lean_count\s*\?\?\s*[a-zA-Z0-9_.]*\.games/.test(synthSrc);
    if (arrayShaped > 0 && stillReadsObjectFields) {
      const [t, v] = teams.find(([, v]) => Array.isArray(v));
      add('D:prompt', 'adjacent_signals-shape', BLOCK,
        `SHAPE MISMATCH: producer emits adjacent_signals[team] as an ARRAY (${arrayShaped}/${teams.length} teams, e.g. ${t} has ${v.length} entries), but slimDossierForPrompt reads .game_lean_count/.games/.props/.strongest off it — all undefined. Under --shadow-slim the model receives {game_lean_count:null, prop_lean_count:null, strongest:null} for EVERY team: 100% of this block's content destroyed, while the prompt still tells the model to build correlated_week1 from it.`,
        'portfolio-synthesize.js:490-494 — handle the array shape (or pass adjacent_signals through unmodified).');
    } else add('D:prompt', 'adjacent_signals-shape', PASS, arrayShaped > 0
      ? `producer emits an array (${arrayShaped}/${teams.length} teams) and the slimmer no longer reads object-only fields off it — passed through intact`
      : 'shape matches what the slimmer expects');
  });

  // D4 — populated dossier fields the slimmer silently strips, and prompt
  // instructions that reference blocks the model is never sent.
  await check('D:prompt', 'dropped-profile-fields', async () => {
    const profiles = DOSSIER.team_profiles || {};
    const sample = Object.values(profiles);
    if (!sample.length) { add('D:prompt', 'dropped-profile-fields', WARN, 'no team_profiles'); return; }
    const populated = (key) => sample.filter(p => p && p[key] != null && (typeof p[key] !== 'object' || Object.keys(p[key]).length)).length;
    const CRITICAL = ['training_camp_intel', 'officiating_context', 'named_player_sizing_gate'];
    const lost = CRITICAL.filter(k => populated(k) > 0 && cfg.profileKeys.length && !cfg.profileKeys.includes(k))
                          .map(k => `${k} (populated on ${populated(k)}/${sample.length} teams)`);
    if (lost.length) add('D:prompt', 'dropped-profile-fields', BLOCK,
      `slimTeamProfile strips these populated fields before the model sees them: ${lost.join(', ')}. named_player_sizing_gate in particular is described in SYSTEM_PROMPT as "a hard cap, not a suggestion".`,
      'portfolio-synthesize.js:466-468 — add them to the keep-list, or delete the prompt text that promises them.');
    else add('D:prompt', 'dropped-profile-fields', PASS, 'no populated critical profile field is stripped');
  });

  await check('D:prompt', 'experts-block', async () => {
    const experts = DOSSIER.experts || {};
    const n = Object.keys(experts).length;
    if (n === 0) { add('D:prompt', 'experts-block', PASS, 'no experts map to lose'); return; }
    // The bug was buildUserPrompt's template literal never referencing dossier.experts /
    // promptDossier.experts at all. Check the actual source for that reference rather than
    // assuming it's still missing.
    const promptSendsExperts = /EXPERTS[\s\S]{0,200}?promptDossier\.experts/.test(synthSrc)
      || /experts:\s*dossier\.experts/.test(synthSrc);
    if (!promptSendsExperts) add('D:prompt', 'experts-block', BLOCK,
      `dossier.experts holds ${n} named analysts but is NEVER serialized into the prompt (buildUserPrompt sends only team_profiles, synthesis_input, adjacent_signals, roster_churn) — while SYSTEM_PROMPT instructs the model to "CITE SOURCES ... from the experts map". The model is told to consult a map it never receives.`,
      'portfolio-synthesize.js:399-417 — send it, or remove the two SYSTEM_PROMPT clauses that reference it.');
    else add('D:prompt', 'experts-block', PASS, `${n} named analysts are serialized into the prompt`);
  });

  // D5 — will the prompt even fit? Non-slim is ~331K tokens against 200K models.
  await check('D:prompt', 'prompt-size', async () => {
    const blocks = {
      team_profiles: DOSSIER.team_profiles, synthesis_input: DOSSIER.synthesis_input,
      adjacent_signals: DOSSIER.adjacent_signals, roster_churn: DOSSIER.roster_churn,
    };
    const chars = Object.values(blocks).reduce((a, b) => a + JSON.stringify(b ?? {}).length, 0);
    const tokens = Math.round(chars / 4);
    if (tokens > 190000) add('D:prompt', 'prompt-size', WARN,
      `full (non-slim) prompt is ~${tokens.toLocaleString()} tokens — exceeds the 200K context of the configured models, so --shadow-slim is effectively MANDATORY and all of its drops above are the real operating path.`);
    else add('D:prompt', 'prompt-size', PASS, `~${tokens.toLocaleString()} tokens`);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// STAGE E — PRIOR-RUN FORENSICS: did the last paid run actually succeed?
// ══════════════════════════════════════════════════════════════════════════════

async function stageE() {
  await check('E:lastrun', 'previous-run', async () => {
    const dir = path.join(ROOT, '.nfl', 'portfolio');
    let files = [];
    try { files = (await readdir(dir)).filter(f => /^portfolio-.*\.raw\.json$/.test(f)).sort(); }
    catch { /* no prior runs on disk yet */ }
    if (!files.length) { add('E:lastrun', 'previous-run', PASS, 'no prior run to inspect'); return; }
    const p = path.join(dir, files[files.length - 1]);
    const raw = JSON.parse(await readFile(p, 'utf8'));
    const rel = path.relative(ROOT, p);
    const finalN = Array.isArray(raw.final) ? raw.final.length : null;
    const candN  = Array.isArray(raw.candidates) ? raw.candidates.length : null;
    const failed = Object.entries(raw.raw || {}).filter(([, v]) => v && v.error).map(([m]) => m);

    const notes = [];
    if (finalN === 0) notes.push(`final: 0 recommendations from ${candN} candidates — yet it still rendered a full report and exited 0`);
    if (failed.length) notes.push(`model(s) FAILED mid-run with no banner in the report: ${failed.join(', ')}`);
    if (raw?.meta?.committee_ran === false) notes.push('committee did not run (stage 1 only)');

    if (notes.length) add('E:lastrun', 'previous-run', WARN,
      `${rel} — ${notes.join(' | ')}. This is what a silent half-failure looks like; treat that report as untrustworthy.`,
      'portfolio-synthesize.js:3096/:3150/:3202 — exit non-zero (or render a hard banner) on any model error, committee crash, or final.length === 0.');
    else add('E:lastrun', 'previous-run', PASS, `${rel} — ${finalN} recommendations, no model errors`);
  });
}

// ══════════════════════════════════════════════════════════════════════════════

async function main() {
  await stageA();
  await stageB();
  await stageC();
  await stageD();
  await stageE();

  const blocks = results.filter(r => r.status === BLOCK);
  const warns  = results.filter(r => r.status === WARN);
  const errs   = results.filter(r => r.status === ERROR);
  const passes = results.filter(r => r.status === PASS);

  if (JSON_OUT) {
    console.log(JSON.stringify({
      generated_at: new Date().toISOString(), season: SEASON, model: MODEL,
      summary: { block: blocks.length, warn: warns.length, error: errs.length, pass: passes.length },
      safe_to_run_paid_synthesis: blocks.length === 0,
      results,
    }, null, 2));
  } else {
    const icon = { BLOCK: '[BLOCK]', WARN: '[WARN ]', PASS: '[ pass]', ERROR: '[ERROR]' };
    console.log('\n' + '='.repeat(78));
    console.log('  PORTFOLIO PREFLIGHT — free, read-only. No paid API calls, no writes.');
    console.log('='.repeat(78));
    let lastStage = null;
    for (const r of results) {
      if (r.stage !== lastStage) { console.log(`\n── ${r.stage} ${'─'.repeat(Math.max(0, 72 - r.stage.length))}`); lastStage = r.stage; }
      console.log(`${icon[r.status]} ${r.lane}`);
      if (r.status !== PASS) {
        console.log(`         ${r.detail}`);
        if (r.fix) console.log(`         FIX: ${r.fix}`);
      } else console.log(`         ${r.detail}`);
    }
    console.log('\n' + '='.repeat(78));
    console.log(`  ${blocks.length} BLOCK · ${warns.length} WARN · ${errs.length} ERROR · ${passes.length} pass`);
    console.log('='.repeat(78));
    if (blocks.length) {
      console.log('\n  DO NOT RUN PAID SYNTHESIS. Blocking issues:\n');
      blocks.forEach((b, i) => console.log(`   ${i + 1}. [${b.stage}] ${b.lane}`));
      console.log('');
    } else {
      console.log('\n  SAFE TO RUN PAID SYNTHESIS — every validated lane is present, fresh and wired.\n');
    }
  }

  if (!WARN_ONLY && blocks.length > 0) process.exit(1);
}

main().catch(e => { console.error('preflight crashed:', e); process.exit(2); });
