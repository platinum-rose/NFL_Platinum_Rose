// agents/futures-intel-report-v2.js
// ═══════════════════════════════════════════════════════════════════════════════
// F-21: Futures Intel Report v2  —  on-demand, full-coverage NFL futures report
//
// Supersedes futures-intel-report.js (v1). Adds, on top of v1's odds tables +
// line-movement + sharp/public value-spots:
//
//   • All 8 tracked futures categories, incl. Most Wins / Least Wins
//   • COVERAGE AUDIT  — enumerates every configured intel source and whether it
//                       produced data in the window, so nothing is silently missed
//                       (newsletters + automated X are flagged DEFERRED, not hidden)
//   • EXPERT GROUPING — every recommendation pivoted by analyst / source
//   • HYBRID NARRATIVE— per-category Claude synthesis (deterministic verdict if no key)
//   • Clean reader-friendly HTML output (+ Markdown), stored in Supabase futures_reports
//
// Outputs:
//   • Supabase  public.futures_reports   (html + markdown + structured model)
//   • Supabase  public.vault_notes       NFL/Futures/FuturesIntel-Latest.md (+ dated)
//   • Local     .nfl/reports/FuturesIntel-<date>.html   (artifact for review)
//   • Receipt   .nfl/receipts/futures-intel-v2-<ts>.json
//
// Usage:
//   node agents/futures-intel-report-v2.js [--dry-run] [--sample] [--season 2026]
//                                          [--trigger scheduled|on_demand_ui|skill|manual]
//
// Env:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (required unless --sample)
//   REPORT_LOOKBACK_DAYS  (default 7)   INTEL_LOOKBACK_DAYS (default 30)
// ═══════════════════════════════════════════════════════════════════════════════

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT         = path.resolve(__dirname, '..');
const RECEIPTS_DIR = path.join(ROOT, '.nfl', 'receipts');
const REPORTS_DIR  = path.join(ROOT, '.nfl', 'reports');
const SCHEDULE_PATH = path.join(ROOT, 'public', 'schedule.json');

// Load 2026 schedule at startup (non-fatal — SoS degrades gracefully if missing)
let SCHEDULE_GAMES = [];
try {
  const raw = JSON.parse(await readFile(SCHEDULE_PATH, 'utf8'));
  SCHEDULE_GAMES = Array.isArray(raw) ? raw : (raw.games || []);
  console.log(`  [schedule] ${SCHEDULE_GAMES.length} games loaded`);
} catch (e) {
  console.warn(`  [warn] schedule.json not loaded: ${e.message}`);
}

// ── Flags / config ──────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const hasFlag = (f) => argv.includes(f);
const argVal  = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };

const DRY_RUN = hasFlag('--dry-run') || process.env.DRY_RUN === 'true';
const SAMPLE  = hasFlag('--sample');
const SEASON  = Number(argVal('--season', new Date().getUTCFullYear()));
const TRIGGER = argVal('--trigger', 'scheduled');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SIGNAL_DAYS = Number(process.env.REPORT_LOOKBACK_DAYS ?? 7);   // intel/tweets/signals recency
const INTEL_DAYS  = Number(process.env.INTEL_LOOKBACK_DAYS ?? 30);   // articles recency
// Odds history: futures move over weeks/months and are captured sporadically (manual exports +
// daily API). Analyze the FULL season's snapshot_time series, not a fixed recency bucket.
// ODDS_SINCE optionally floors the series at an ISO date (default: whole season).
const ODDS_SINCE = process.env.ODDS_SINCE || null;

const SHARP_BOOKS  = new Set(['betonline', 'bookmaker', 'betus']);
const PUBLIC_BOOKS = new Set(['draftkings', 'fanduel', 'betmgm', 'caesars']);
const DIVERGENCE_THRESHOLD = 0.05; // 5 percentage points

// ── The 8 tracked futures categories (display order) ─────────────────────────
const CATEGORIES = [
  { id: 'superbowl',        label: 'Super Bowl Winner',       markets: ['superbowl'],          kind: 'outright',  topN: 32 },
  { id: 'conference',       label: 'Conference Winners',      markets: ['conference_afc', 'conference_nfc'], kind: 'grouped', topN: 8 },
  { id: 'division',         label: 'Division Winners',        markets: ['division_afc_east','division_afc_north','division_afc_south','division_afc_west','division_nfc_east','division_nfc_north','division_nfc_south','division_nfc_west'], kind: 'grouped', topN: 4 },
  { id: 'wins',             label: 'Total Team Wins',         markets: ['wins'],               kind: 'wins_total', topN: 32 },
  { id: 'playoffs',         label: 'To Make the Playoffs',    markets: ['playoffs'],           kind: 'outright',  topN: 20 },
  { id: 'superbowl_matchup',label: 'Super Bowl Exact Matchup',markets: ['superbowl_matchup'],  kind: 'outright',  topN: 15 },
  { id: 'most_wins',        label: 'Most Wins',               markets: ['most_wins'],          kind: 'wins_rank', proxyFrom: 'superbowl', dir: 'desc', topN: 10 },
  { id: 'least_wins',       label: 'Least Wins',              markets: ['least_wins'],         kind: 'wins_rank', proxyFrom: 'superbowl', dir: 'asc',  topN: 10 },
];

const MARKET_LABELS = {
  superbowl: 'Super Bowl Winner',
  playoffs: 'To Make the Playoffs',
  most_wins: 'Most Wins',
  least_wins: 'Least Wins',
  superbowl_matchup: 'Super Bowl Exact Matchup',
  conference_afc: 'AFC Championship', conference_nfc: 'NFC Championship',
  division_afc_east: 'AFC East', division_afc_north: 'AFC North', division_afc_south: 'AFC South', division_afc_west: 'AFC West',
  division_nfc_east: 'NFC East', division_nfc_north: 'NFC North', division_nfc_south: 'NFC South', division_nfc_west: 'NFC West',
};

// ── Configured intel sources (the universe we audit coverage against) ────────
// type: rss_article | podcast | tweet | newsletter ; status: active | manual | deferred
const EXPECTED_SOURCES = [
  // RSS / article feeds (research-intel-ingest.js)
  { name: 'Action Network',     type: 'rss_article', status: 'active' },
  { name: 'BettingPros',        type: 'rss_article', status: 'active' },
  { name: 'ESPN NFL',           type: 'rss_article', status: 'active' },
  { name: 'VSiN',               type: 'rss_article', status: 'active' },
  { name: 'Sharp Football',     type: 'rss_article', status: 'active' },
  { name: 'Pro Football Talk',  type: 'rss_article', status: 'active' },
  { name: 'PFF',                type: 'rss_article', status: 'active' },
  { name: 'Rotowire NFL',       type: 'rss_article', status: 'active' },
  { name: 'Football Outsiders', type: 'rss_article', status: 'active' },
  // Podcasts (podcast_feeds table)
  { name: 'Sharp or Square',              type: 'podcast', status: 'active' },
  { name: 'Even Money',                   type: 'podcast', status: 'active' },
  { name: 'Action Network Sports Betting',type: 'podcast', status: 'active' },
  { name: 'Sharp Football Analysis',      type: 'podcast', status: 'active' },
  // Tweets (tweet-ingest.js — manual paste path; x-sharp-ingest dormant)
  { name: 'Sharp X / Twitter (manual paste)', type: 'tweet',      status: 'manual' },
  { name: 'Sharp X / Twitter (automated)',    type: 'tweet',      status: 'deferred', note: 'x-sharp-ingest dormant — awaiting self-hosted RSSHub on M6' },
  // Newsletters — not yet ingested
  { name: 'Email newsletters',            type: 'newsletter', status: 'deferred', note: 'No Gmail/IMAP ingest agent yet — tracked in backlog' },
];

const FUTURES_KEYWORDS = [
  'super bowl odds', 'futures', 'win total', 'championship odds', 'division odds',
  'playoff odds', 'mvp odds', 'outright', 'early lines', 'season projection',
  'title contender', 'best record', 'worst record', 'most wins', 'fewest wins',
  'win totals', 'over/under wins', 'to make the playoffs',
];

// ── Small helpers ────────────────────────────────────────────────────────────
const nowIso = () => new Date().toISOString();
const dateStr = (d = new Date()) => d.toISOString().slice(0, 10);

function americanToImplied(a) {
  if (a == null || isNaN(a)) return null;
  return a > 0 ? 100 / (a + 100) : Math.abs(a) / (Math.abs(a) + 100);
}
function impliedToAmerican(p) {
  if (p == null || p <= 0 || p >= 1) return null;
  return p >= 0.5 ? -Math.round((p / (1 - p)) * 100) : Math.round(((1 - p) / p) * 100);
}
const fmtOdds  = (a) => (a == null || isNaN(a)) ? 'n/a' : (a >= 0 ? `+${a}` : `${a}`);
const fmtPct   = (p) => (p == null || isNaN(p)) ? '—' : `${(p * 100).toFixed(1)}%`;
const fmtDelta = (d) => (d == null || isNaN(d)) ? '—' : `${d >= 0 ? '+' : ''}${(d * 100).toFixed(1)}pp`;
const isFuturesRelevant = (t) => !!t && FUTURES_KEYWORDS.some((k) => t.toLowerCase().includes(k));

// NFL-specific relevance: require NFL content, reject other sports
const NFL_TERMS_POS = ['nfl', 'super bowl', 'quarterback', 'nfc ', 'afc ', ' nfc', ' afc', 'fantasy football', 'running back', 'wide receiver', 'tight end', 'cornerback', 'linebacker', 'defensive end', 'safety nfl', 'offensive line', 'touchdown', 'nfl mvp', 'nfl draft', 'nfl season', 'nfl odds', 'nfl futures', 'nfl playoff', 'nfl win total'];
const NON_NFL_TERMS = ['world cup', 'fifa', 'uefa', ' soccer', 'premier league', 'champions league', 'serie a', 'bundesliga', 'la liga', 'mls cup', 'copa america', ' nba ', ' nhl ', 'mlb ', 'tennis', 'wimbledon', 'ufc ', 'boxing', 'pga tour', 'formula 1', ' f1 ', 'nascar', 'olympics'];
const isNflRelevant = (title, summary) => {
  const txt = (String(title || '') + ' ' + String(summary || '')).toLowerCase();
  if (NON_NFL_TERMS.some((k) => txt.includes(k))) return false;
  // Require an explicit NFL term — the futures fallback is too permissive for multi-sport sites
  return NFL_TERMS_POS.some((k) => txt.includes(k));
};

// 32-team division map (used for grouping in Playoffs section)
const TEAM_DIVISION = {
  'Kansas City Chiefs': 'AFC West',   'Los Angeles Chargers': 'AFC West',  'Denver Broncos': 'AFC West',      'Las Vegas Raiders': 'AFC West',
  'Baltimore Ravens':  'AFC North',   'Pittsburgh Steelers': 'AFC North',  'Cleveland Browns': 'AFC North',   'Cincinnati Bengals': 'AFC North',
  'Houston Texans':    'AFC South',   'Indianapolis Colts': 'AFC South',   'Tennessee Titans': 'AFC South',   'Jacksonville Jaguars': 'AFC South',
  'Buffalo Bills':     'AFC East',    'Miami Dolphins': 'AFC East',        'New York Jets': 'AFC East',       'New England Patriots': 'AFC East',
  'Philadelphia Eagles':'NFC East',   'Dallas Cowboys': 'NFC East',        'New York Giants': 'NFC East',     'Washington Commanders': 'NFC East',
  'Detroit Lions':     'NFC North',   'Green Bay Packers': 'NFC North',    'Minnesota Vikings': 'NFC North',  'Chicago Bears': 'NFC North',
  'Atlanta Falcons':   'NFC South',   'New Orleans Saints': 'NFC South',   'Tampa Bay Buccaneers': 'NFC South','Carolina Panthers': 'NFC South',
  'Los Angeles Rams':  'NFC West',    'Seattle Seahawks': 'NFC West',      'San Francisco 49ers': 'NFC West', 'Arizona Cardinals': 'NFC West',
};
const DIVISION_ORDER = ['AFC East','AFC North','AFC South','AFC West','NFC East','NFC North','NFC South','NFC West'];

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SPARK = '▁▂▃▄▅▆▇█';
function sparkline(vals) {
  const v = vals.filter((x) => x != null && !isNaN(x));
  if (v.length < 2) return '';
  const min = Math.min(...v), max = Math.max(...v), span = (max - min) || 1;
  return v.map((x) => SPARK[Math.min(SPARK.length - 1, Math.round(((x - min) / span) * (SPARK.length - 1)))]).join('');
}

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
}

// ── Data fetchers ────────────────────────────────────────────────────────────
async function fetchSnapshots(sb) {
  // Full-season history, oldest→newest, paginated past PostgREST's 1000-row cap.
  const PAGE = 1000;
  let from = 0;
  const all = [];
  for (;;) {
    let q = sb.from('futures_odds_snapshots')
      .select('market_type, team, book, odds, implied_prob, line, over_price, under_price, captured_at, snapshot_time, season')
      .eq('season', SEASON)
      .order('snapshot_time', { ascending: true })
      .range(from, from + PAGE - 1);
    if (ODDS_SINCE) q = q.gte('snapshot_time', ODDS_SINCE);
    const { data, error } = await q;
    if (error) throw new Error(`fetchSnapshots: ${error.message}`);
    all.push(...(data || []));
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}
async function fetchIntelNotes(sb) {
  const since = new Date(Date.now() - INTEL_DAYS * 864e5).toISOString();
  const { data, error } = await sb.from('research_intel_notes')
    .select('id, source, source_type, title, summary, url, published_at, confidence, author')
    .gte('captured_at', since).order('published_at', { ascending: false }).limit(400);
  if (error) throw new Error(`fetchIntelNotes: ${error.message}`);
  return data || [];
}
async function fetchPickSignals(sb, noteIds) {
  if (!noteIds.length) return [];
  const { data, error } = await sb.from('research_pick_signals')
    .select('note_id, source, author, team_or_market, bet_type, lean, rationale, confidence, captured_at')
    .in('note_id', noteIds).order('confidence', { ascending: false }).limit(200);
  if (error) throw new Error(`fetchPickSignals: ${error.message}`);
  return data || [];
}
async function fetchSharpTweets(sb) {
  const since = new Date(Date.now() - SIGNAL_DAYS * 864e5).toISOString();
  const { data, error } = await sb.from('x_sharp_tweets')
    .select('author_handle, author_tier, text, tweet_url, published_at')
    .gte('captured_at', since).order('published_at', { ascending: false }).limit(400);
  if (error) return []; // table may be empty/dormant — non-fatal
  return data || [];
}
// Coverage inventory: per-source item counts seen in the window.
async function fetchCoverageCounts(sb) {
  const sinceIntel = new Date(Date.now() - INTEL_DAYS * 864e5).toISOString();
  const counts = { rss_article: {}, podcast: {}, tweet: {} };
  const { data: notes } = await sb.from('research_intel_notes')
    .select('source').gte('captured_at', sinceIntel).limit(2000);
  for (const n of notes || []) counts.rss_article[n.source] = (counts.rss_article[n.source] || 0) + 1;
  // Podcasts: count recent episodes per feed name
  const { data: feeds } = await sb.from('podcast_feeds').select('id, name');
  const feedById = Object.fromEntries((feeds || []).map((f) => [f.id, f.name]));
  const { data: eps } = await sb.from('podcast_episodes')
    .select('feed_id').gte('created_at', sinceIntel).limit(2000);
  for (const e of eps || []) { const nm = feedById[e.feed_id]; if (nm) counts.podcast[nm] = (counts.podcast[nm] || 0) + 1; }
  const { data: tw } = await sb.from('x_sharp_tweets').select('author_handle')
    .gte('captured_at', new Date(Date.now() - SIGNAL_DAYS * 864e5).toISOString()).limit(2000);
  counts.tweet['Sharp X / Twitter (manual paste)'] = (tw || []).length;
  return counts;
}

// ATS history (last 4 seasons) keyed by team abbreviation.
async function fetchAtsAndSchedule(sb) {
  try {
    const { data, error } = await sb.from('nfl_team_season_stats')
      .select('team, season, ats_wins, ats_losses')
      .gte('season', 2022).lte('season', 2025);
    if (error) { console.warn('[warn] nfl_team_season_stats:', error.message); return { atsSummary: {} }; }
    const byAbbr = {};
    for (const r of data || []) {
      if (!byAbbr[r.team]) byAbbr[r.team] = { wins: 0, losses: 0, seasons: 0 };
      byAbbr[r.team].wins   += (r.ats_wins   || 0);
      byAbbr[r.team].losses += (r.ats_losses || 0);
      byAbbr[r.team].seasons++;
    }
    const atsSummary = {};
    for (const [abbr, d] of Object.entries(byAbbr)) {
      const total = d.wins + d.losses;
      atsSummary[abbr] = { pct: total > 0 ? d.wins / total : null, seasons: d.seasons, wins: d.wins, losses: d.losses };
    }
    console.log(`  [ats] ${Object.keys(atsSummary).length} teams loaded (2022-2025)`);
    return { atsSummary };
  } catch (e) {
    console.warn('[warn] fetchAtsAndSchedule:', e.message);
    return { atsSummary: {} };
  }
}

// ── Odds analysis (consensus, divergence, movement) ──────────────────────────
// Time-ordered series per market_type → team → book (sorted oldest→newest by snapshot_time).
function groupSeries(rows) {
  const g = new Map();
  for (const row of rows) {
    if (!g.has(row.market_type)) g.set(row.market_type, new Map());
    const mm = g.get(row.market_type);
    if (!mm.has(row.team)) mm.set(row.team, new Map());
    const bb = mm.get(row.team);
    if (!bb.has(row.book)) bb.set(row.book, []);
    bb.get(row.book).push(row);
  }
  const ts = (r) => new Date(r.snapshot_time || r.captured_at).getTime();
  for (const mm of g.values()) for (const bb of mm.values())
    for (const arr of bb.values()) arr.sort((a, b) => ts(a) - ts(b));
  return g;
}
const seriesProb = (r) => (r.implied_prob != null ? Number(r.implied_prob) : americanToImplied(r.odds));
const validProb = (p) => p != null && !isNaN(p) && p > 0 && p < 1;
const snapDay = (r) => String(r.snapshot_time || r.captured_at).slice(0, 10);
const pickLatest = (arr) => arr[arr.length - 1];
const pickEarliest = (arr) => arr[0];

// Consensus across books using a per-book picker (latest / earliest snapshot), with sharp/public split.
function consensusOf(bookSeries, pick) {
  const all = [], sharp = [], pub = [], allBooks = {};
  for (const [book, arr] of bookSeries.entries()) {
    if (!arr.length) continue;
    const r = pick(arr); const p = seriesProb(r);
    allBooks[book] = r.odds;
    if (!validProb(p)) continue;
    all.push(p);
    if (SHARP_BOOKS.has(book)) sharp.push(p);
    if (PUBLIC_BOOKS.has(book)) pub.push(p);
  }
  if (!all.length) return null;
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const sharpImplied = sharp.length ? avg(sharp) : null;
  const publicImplied = pub.length ? avg(pub) : null;
  return {
    consensus: avg(all), sharpImplied, publicImplied,
    divergence: (sharpImplied != null && publicImplied != null) ? sharpImplied - publicImplied : null,
    allBooks,
  };
}
// Forward-filled consensus timeline across all distinct snapshot dates (trajectory / sparkline).
function consensusTimeline(bookSeries) {
  const days = [...new Set([...bookSeries.values()].flat().map(snapDay))].sort();
  const out = [];
  for (const d of days) {
    const probs = [];
    for (const arr of bookSeries.values()) {
      let cur = null;
      for (const r of arr) { if (snapDay(r) <= d) cur = r; else break; }
      if (cur) { const p = seriesProb(cur); if (validProb(p)) probs.push(p); }
    }
    if (probs.length) out.push({ t: d, consensus: probs.reduce((x, y) => x + y, 0) / probs.length });
  }
  return out;
}
// Net movement since opening = avg over books (with ≥2 obs) of (latestProb − earliestProb). Null if none.
function movementOf(bookSeries) {
  const deltas = [];
  for (const arr of bookSeries.values()) {
    if (arr.length < 2) continue;
    const a = seriesProb(pickEarliest(arr)), b = seriesProb(pickLatest(arr));
    if (validProb(a) && validProb(b)) deltas.push(b - a);
  }
  return deltas.length ? deltas.reduce((x, y) => x + y, 0) / deltas.length : null;
}
function buildMarketSummary(mm) {
  const teams = [];
  for (const [team, bb] of mm.entries()) {
    const cur = consensusOf(bb, pickLatest);
    if (!cur) continue;
    const series = consensusTimeline(bb);
    const openingBooks = {};
    for (const [book, arr] of bb.entries()) {
      if (arr.length) { const r = pickEarliest(arr); if (r?.odds != null) openingBooks[book] = r.odds; }
    }
    teams.push({
      team, ...cur, movement: movementOf(bb),
      openingBooks,
      opening: series.length ? series[0].consensus : null,
      firstDate: series.length ? series[0].t : null,
      lastDate: series.length ? series[series.length - 1].t : null,
      points: series.length, series,
    });
  }
  return teams.sort((a, b) => b.consensus - a.consensus);
}

// ── Win-total (line-based) analysis ──────────────────────────────────────────
const fmtLineDelta = (d) => (d == null || isNaN(d)) ? '—' : `${d >= 0 ? '+' : ''}${d.toFixed(1)}`;

const hasLine = (r) => r && r.line != null && !isNaN(Number(r.line));
// Consensus win-total line across books using a per-book picker (latest / earliest line obs).
function winConsensusOf(bookSeries, pick) {
  const picked = [];
  for (const arr of bookSeries.values()) {
    const wl = arr.filter(hasLine);
    if (wl.length) picked.push(pick(wl));
  }
  if (!picked.length) return null;
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const overs = picked.map((r) => r.over_price).filter((v) => v != null).map(Number);
  const unders = picked.map((r) => r.under_price).filter((v) => v != null).map(Number);
  const byBook = {}, overByBook = {}, underByBook = {};
  for (const r of picked) {
    byBook[r.book] = Number(r.line);
    if (r.over_price  != null) overByBook[r.book]  = Number(r.over_price);
    if (r.under_price != null) underByBook[r.book] = Number(r.under_price);
  }
  return {
    line: avg(picked.map((r) => Number(r.line))),
    over: overs.length ? Math.round(avg(overs)) : null,
    under: unders.length ? Math.round(avg(unders)) : null,
    byBook, overByBook, underByBook,
  };
}
// Win-total line movement = avg over books (with ≥2 line obs) of (latestLine − earliestLine).
function winLineMovement(bookSeries) {
  const deltas = [];
  for (const arr of bookSeries.values()) {
    const wl = arr.filter(hasLine);
    if (wl.length < 2) continue;
    deltas.push(Number(pickLatest(wl).line) - Number(pickEarliest(wl).line));
  }
  return deltas.length ? deltas.reduce((x, y) => x + y, 0) / deltas.length : null;
}
function buildWinTotalsSummary(mm) {
  const teams = [];
  for (const [team, bb] of mm.entries()) {
    const cur = winConsensusOf(bb, pickLatest);
    if (!cur) continue;
    teams.push({ team, line: cur.line, over: cur.over, under: cur.under, byBook: cur.byBook, overByBook: cur.overByBook, underByBook: cur.underByBook, movement: winLineMovement(bb) });
  }
  return teams.sort((a, b) => b.line - a.line); // most wins first
}
function winsHasLines(grouped) {
  const mm = grouped.get('wins');
  if (!mm || !mm.size) return false;
  for (const bb of mm.values()) for (const arr of bb.values()) if (arr.some(hasLine)) return true;
  return false;
}

// Attach SoS + ATS enrichment to all kind:'wins' teams across all categories.
// Must be called after buildCategoryModel so team objects already exist.
function enrichWinTotals(categories, { atsSummary = {}, schedule = [] } = {}) {
  // Build full-name → abbr map from schedule
  const nameToAbbr = {};
  for (const g of schedule) {
    if (g.visitorName && g.visitor) nameToAbbr[g.visitorName] = g.visitor;
    if (g.homeName    && g.home)    nameToAbbr[g.homeName]    = g.home;
  }

  // Win totals map (full name → consensus line) for SoS opponent lookup
  const winsCat = categories.find((c) => c.id === 'wins');
  const baseTeams = winsCat?.subsections.flatMap((s) => s.teams || []) || [];
  const winsMap = {};
  for (const t of baseTeams) if (t.line != null) winsMap[t.team] = t.line;

  // Compute raw SoS (sum of opponents' projected win totals)
  const sosRaw = {};
  for (const t of baseTeams) {
    const abbr = nameToAbbr[t.team];
    if (!abbr) continue;
    const opps = schedule
      .filter((g) => g.visitor === abbr || g.home === abbr)
      .map((g) => g.visitor === abbr ? g.homeName : g.visitorName)
      .filter(Boolean);
    const oppWins = opps.map((opp) => winsMap[opp]).filter((v) => v != null);
    sosRaw[t.team] = oppWins.length ? oppWins.reduce((a, b) => a + b, 0) : null;
  }

  // Rank: 1 = hardest (highest opponent win-total sum)
  const sorted = Object.entries(sosRaw)
    .filter(([, v]) => v != null).sort(([, a], [, b]) => b - a);
  const sosRank = Object.fromEntries(sorted.map(([name], i) => [name, i + 1]));

  if (sorted.length) {
    const [hardName, hardVal] = sorted[0];
    const [easyName, easyVal] = sorted[sorted.length - 1];
    console.log(`  [sos] computed for ${sorted.length} teams | hardest: ${hardName} (${hardVal?.toFixed(1)}) | easiest: ${easyName} (${easyVal?.toFixed(1)})`);
  }

  // Apply enrichment to ALL kind:'wins' subsections across all categories
  for (const cat of categories) {
    for (const sub of cat.subsections) {
      if (sub.kind !== 'wins') continue;
      for (const t of sub.teams || []) {
        const abbr = nameToAbbr[t.team];
        t.sos      = sosRaw[t.team]  ?? null;
        t.sosRank  = sosRank[t.team] ?? null;
        t.sosTotal = sorted.length;            // pool size — used for relative quartile colouring
        t.ats      = (abbr && atsSummary[abbr]) ? atsSummary[abbr] : null;
      }
    }
  }
}

// ── Build the category model ─────────────────────────────────────────────────
function buildCategoryModel(grouped) {
  const cats = [];
  for (const def of CATEGORIES) {
    const cat = { id: def.id, label: def.label, kind: def.kind, present: false, subsections: [], note: null };

    // Total Team Wins — line-based table from real win-total data.
    if (def.kind === 'wins_total') {
      if (winsHasLines(grouped)) {
        cat.present = true;
        cat.subsections.push({ label: def.label, kind: 'wins', teams: buildWinTotalsSummary(grouped.get('wins')) });
      } else {
        cat.note = 'Win-total lines not loaded yet — seed them with `node agents/win-totals-ingest.js` (manual, from BetOnline/Bookmaker) or wait for TheOddsAPI season-wins (~Jul–Aug).';
      }
      cats.push(cat);
      continue;
    }

    if (def.kind === 'wins_rank') {
      // 1) dedicated outright market → 2) real win-total lines → 3) Super Bowl proxy.
      const direct = grouped.get(def.markets[0]);
      if (direct && direct.size) {
        const teams = buildMarketSummary(direct);
        // Dedicated market: highest probability = most likely outcome = show first (no reversal).
        // dir-based reversal only applies to proxy/wins_line where direction is inferred from another market.
        cat.present = true; cat.source = 'dedicated';
        cat.subsections.push({ label: def.label, teams });
      } else if (winsHasLines(grouped)) {
        const teams = buildWinTotalsSummary(grouped.get('wins')); // desc by line
        const ranked = def.dir === 'asc' ? teams.slice().reverse() : teams;
        cat.present = true; cat.source = 'wins_line';
        cat.note = `Ranked by consensus win-total line (${def.dir === 'desc' ? 'highest' : 'lowest'} first) from loaded sportsbook lines.`;
        cat.subsections.push({ label: def.label, kind: 'wins', teams: ranked });
      } else {
        const proxy = grouped.get(def.proxyFrom);
        if (proxy && proxy.size) {
          const teams = buildMarketSummary(proxy);
          const ranked = def.dir === 'asc' ? teams.slice().reverse() : teams;
          cat.present = true; cat.source = 'proxy';
          cat.note = `Proxy ranking from Super Bowl title-market consensus (${def.dir === 'desc' ? 'favorites' : 'longshots'} first) — no win-total lines or dedicated market loaded yet. Replaced automatically once those arrive.`;
          cat.subsections.push({ label: `${def.label} (proxy)`, teams: ranked });
        }
      }
      cats.push(cat);
      continue;
    }

    const present = def.markets.filter((m) => grouped.has(m) && grouped.get(m).size);
    if (!present.length) {
      cat.note = 'No live market data in window (market may open Jul–Aug, or ingest has not yet run this window).';
      cats.push(cat);
      continue;
    }
    cat.present = true;
    for (const m of present) {
      const teams = buildMarketSummary(grouped.get(m));
      cat.subsections.push({ label: MARKET_LABELS[m] || def.label, teams });
    }
    cats.push(cat);
  }
  return cats;
}

// ── Line movement + value spots (cross-market) ───────────────────────────────
function buildMovers(grouped) {
  const movers = [];
  for (const [mt, mm] of grouped.entries()) {
    if (mt === 'wins') continue; // win-total movement is shown as line deltas in its own table
    for (const t of buildMarketSummary(mm)) {
      if (t.movement != null && Math.abs(t.movement) >= 0.01)
        movers.push({ market: MARKET_LABELS[mt] || mt, team: t.team, delta: t.movement,
          consensus: t.consensus, opening: t.opening,
          currentBooks: t.allBooks || {}, openingBooks: t.openingBooks || {},
          firstDate: t.firstDate, lastDate: t.lastDate,
          points: t.points,
          series: t.series || [],                                      // full series for SVG sparkline
          spark: sparkline(t.series.map((s) => s.consensus)) });       // kept for Markdown renderer
    }
  }
  return movers.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 25);
}

function valueSpotSourceLinks(market, team, notes = [], signals = []) {
  const links = [];
  const seen = new Set();
  const teamLower = String(team || '').toLowerCase();
  const nickLower = teamLower.split(' ').at(-1);
  const marketWords = String(market || '').toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  const noteById = new Map(notes.map((n) => [n.id, n]));
  const add = (n, why) => {
    if (!n?.url || seen.has(n.url)) return;
    seen.add(n.url);
    links.push({ source: n.source, title: n.title || n.url, url: n.url, why });
  };

  for (const s of signals) {
    const text = [s.team_or_market, s.bet_type, s.lean, s.rationale].filter(Boolean).join(' ').toLowerCase();
    const teamHit = text.includes(teamLower) || (nickLower && text.includes(nickLower));
    const marketHit = marketWords.some((w) => text.includes(w));
    if (teamHit || marketHit) add(noteById.get(s.note_id), teamHit ? 'team signal' : 'market signal');
  }
  for (const n of notes) {
    const text = [n.title, n.summary].filter(Boolean).join(' ').toLowerCase();
    const teamHit = text.includes(teamLower) || (nickLower && text.includes(nickLower));
    const marketHit = marketWords.some((w) => text.includes(w));
    if (teamHit || marketHit) add(n, teamHit ? 'team article' : 'market article');
    if (links.length >= 3) break;
  }
  return links.slice(0, 3);
}

const SPREAD_THRESHOLD    = 200; // min American-odds gap for outright futures (SB/conf/div/playoffs)
const WINS_OU_THRESHOLD   = 10;  // min American-odds gap for win-total O/U prices (tight market)
const BOOK_SHORT = { betonline: 'BOL', bookmaker: 'BKR', betus: 'BTU', draftkings: 'DK', fanduel: 'FD', betmgm: 'MGM', caesars: 'CZR' };

// Strict expert signal match: team_or_market must contain the team's last word (nickname)
function expertSignalsForTeam(team, signals = []) {
  const nick = String(team || '').toLowerCase().split(' ').at(-1);
  return signals
    .filter((s) => {
      const t = String(s.team_or_market || '').toLowerCase();
      return nick && t.includes(nick);
    })
    .slice(0, 4);
}

function buildValueSpots(grouped, notes = [], signals = []) {
  const divSpots = [], spreadSpots = [], winsOuCards = [];
  const PREF_ARR = ['betonline', 'bookmaker', 'betus'];

  for (const [mt, mm] of grouped.entries()) {
    if (mt === 'wins') continue; // handled separately below with O/U logic
    for (const t of buildMarketSummary(mm)) {
      const market = MARKET_LABELS[mt] || mt;

      // Type 1: sharp/public divergence (requires public book data in DB)
      if (t.divergence != null && Math.abs(t.divergence) >= DIVERGENCE_THRESHOLD) {
        divSpots.push({
          spotType: 'divergence', market, team: t.team,
          divergence: t.divergence,
          sharpImplied: t.sharpImplied, publicImplied: t.publicImplied,
          currentBooks: t.allBooks || {}, openingBooks: t.openingBooks || {},
          expertSignals: expertSignalsForTeam(t.team, signals),
        });
      }

      // Type 2: inter-sharp-book price spread (works with BOL/BKR/BTU only)
      const vals = PREF_ARR.map((b) => ({ b, v: t.allBooks?.[b] })).filter((x) => x.v != null);
      if (vals.length >= 2) {
        const maxE = vals.reduce((a, x) => x.v > a.v ? x : a);
        const minE = vals.reduce((a, x) => x.v < a.v ? x : a);
        const spread = maxE.v - minE.v;
        if (spread >= SPREAD_THRESHOLD) {
          spreadSpots.push({
            spotType: 'spread', market, team: t.team,
            bestBook: maxE.b, worstBook: minE.b,
            bestOdds: maxE.v, worstOdds: minE.v, spread,
            currentBooks: t.allBooks || {}, openingBooks: t.openingBooks || {},
            expertSignals: expertSignalsForTeam(t.team, signals),
          });
        }
      }
    }
  }

  // Type 3: Win total O/U — one card per team, line + over + under in one view
  const winsMap = grouped.get('wins');
  if (winsMap) {
    for (const [team, bb] of winsMap.entries()) {
      const latest = winConsensusOf(bb, pickLatest);
      if (!latest) continue;
      const { overByBook = {}, underByBook = {}, byBook = {}, line } = latest;

      // Detect per-book line disagreement
      const lineVals = PREF_ARR.map((b) => ({ b, v: byBook[b] })).filter((x) => x.v != null);
      const uniqueLines = [...new Set(lineVals.map((x) => x.v))];
      const lineNote = uniqueLines.length > 1
        ? PREF_ARR.filter((b) => byBook[b] != null).map((b) => (BOOK_SHORT[b] || b) + ' ' + byBook[b]).join(' / ')
        : null;

      // Over prices
      const overVals = PREF_ARR.map((b) => ({ b, v: overByBook[b] })).filter((x) => x.v != null);
      const overBest = overVals.length >= 2 ? overVals.reduce((a, x) => x.v > a.v ? x : a) : null;
      const overWorst = overVals.length >= 2 ? overVals.reduce((a, x) => x.v < a.v ? x : a) : null;
      const overSpread = overBest && overWorst ? overBest.v - overWorst.v : 0;

      // Under prices
      const underVals = PREF_ARR.map((b) => ({ b, v: underByBook[b] })).filter((x) => x.v != null);
      const underBest = underVals.length >= 2 ? underVals.reduce((a, x) => x.v > a.v ? x : a) : null;
      const underWorst = underVals.length >= 2 ? underVals.reduce((a, x) => x.v < a.v ? x : a) : null;
      const underSpread = underBest && underWorst ? underBest.v - underWorst.v : 0;

      // Only include if there's at least one meaningful price gap or a line discrepancy
      if (overSpread < WINS_OU_THRESHOLD && underSpread < WINS_OU_THRESHOLD && !lineNote) continue;

      winsOuCards.push({
        spotType: 'wins_ou', team, line,
        lineNote,
        overPrices: overVals,   // [{b, v}] for all books
        underPrices: underVals,
        overBest, overWorst, overSpread,
        underBest, underWorst, underSpread,
        expertSignals: expertSignalsForTeam(team, signals),
      });
    }
  }
  winsOuCards.sort((a, b) => Math.max(b.overSpread, b.underSpread) - Math.max(a.overSpread, a.underSpread));

  divSpots.sort((a, b) => Math.abs(b.divergence) - Math.abs(a.divergence));

  // Group spread spots by team — one card per team, all markets listed inside
  const spreadByTeam = new Map();
  for (const s of spreadSpots) {
    if (!spreadByTeam.has(s.team)) {
      spreadByTeam.set(s.team, {
        spotType: 'spread', team: s.team,
        markets: [],
        sourceLinks: s.sourceLinks, // use first match's links
      });
    }
    spreadByTeam.get(s.team).markets.push({
      market: s.market,
      bestBook: s.bestBook, worstBook: s.worstBook,
      bestOdds: s.bestOdds, worstOdds: s.worstOdds,
      spread: s.spread,
    });
  }
  // Within each card: sort markets by spread desc; card sort by largest single-market spread
  const mergedSpread = [...spreadByTeam.values()].map((card) => {
    card.markets.sort((a, b) => b.spread - a.spread);
    card.maxSpread = card.markets[0].spread;
    return card;
  }).sort((a, b) => b.maxSpread - a.maxSpread);

  return [...divSpots, ...mergedSpread, ...winsOuCards].slice(0, 25);
}

// ── Expert grouping ──────────────────────────────────────────────────────────
function buildExpertGroups(signals, notes, tweets) {
  // Build lookup so each signal can carry its linked article's summary + URL
  const noteById = Object.fromEntries(notes.map((n) => [String(n.id), n]));
  const groups = new Map();
  const ensure = (src) => { if (!groups.has(src)) groups.set(src, { source: src, signals: [], articles: [], tweets: [] }); return groups.get(src); };
  for (const s of signals) {
    const linked = noteById[String(s.note_id)];
    ensure(s.source).signals.push({ ...s, articleTitle: linked?.title, articleUrl: linked?.url, articleSummary: linked?.summary });
  }
  for (const n of notes) if (isNflRelevant(n.title, n.summary)) ensure(n.source).articles.push(n);
  for (const t of tweets) if (isFuturesRelevant(t.text)) ensure(`@${t.author_handle}`).tweets.push(t);
  return [...groups.values()].sort((a, b) =>
    (b.signals.length * 3 + b.articles.length + b.tweets.length) - (a.signals.length * 3 + a.articles.length + a.tweets.length));
}

// ── Coverage audit ───────────────────────────────────────────────────────────
function buildCoverageAudit(counts, notes = []) {
  // Group fetched articles by source name for the expandable URL list
  const bySource = {};
  for (const n of notes) {
    if (!isNflRelevant(n.title, n.summary)) continue; // exclude non-NFL content
    if (!bySource[n.source]) bySource[n.source] = [];
    bySource[n.source].push(n);
  }
  const rows = EXPECTED_SOURCES.map((s) => {
    const seen = (counts[s.type] && counts[s.type][s.name]) || 0;
    const articles = (bySource[s.name] || []).slice(0, 12); // up to 12 most recent
    let state;
    if (s.status === 'deferred') state = 'deferred';
    else if (seen > 0) state = 'covered';
    else state = s.status === 'manual' ? 'awaiting_input' : 'no_data';
    return { ...s, seen, state, articles };
  });
  const summary = {
    active: rows.filter((r) => r.status === 'active').length,
    covered: rows.filter((r) => r.state === 'covered').length,
    no_data: rows.filter((r) => r.state === 'no_data').length,
    deferred: rows.filter((r) => r.state === 'deferred').length,
  };
  return { rows, summary };
}


// ── Deterministic verdict helpers ─────────────────────────────────────────────
// Maps a cat.id to a mover's market label string (from MARKET_LABELS).
function catMatchesMarket(catId, marketLabel) {
  const ml = (marketLabel || '').toLowerCase();
  if (catId === 'superbowl' || catId === 'superbowl_matchup') return ml.includes('super bowl');
  if (catId === 'conference') return ml.includes('championship') || ml.includes('conference');
  if (catId === 'division') return /afc |nfc /.test(ml) && !ml.includes('championship');
  if (catId === 'playoffs') return ml.includes('playoff');
  if (catId === 'most_wins') return ml.includes('most wins');
  if (catId === 'least_wins') return ml.includes('least wins');
  return false;
}
// Maps a cat.id to a pick signal's bet_type / team_or_market text.
function catSignalMatch(catId, s) {
  const text = ((s.bet_type || '') + ' ' + (s.team_or_market || '')).toLowerCase();
  if (catId === 'superbowl' || catId === 'superbowl_matchup') return /super.?bowl|sb winner|nfl champion/i.test(text);
  if (catId === 'conference') return /conf(erence)?|afc champ|nfc champ/i.test(text);
  if (catId === 'division') return /div(ision)?|afc (east|north|south|west)|nfc (east|north|south|west)/i.test(text);
  if (catId === 'wins') return /win.?total|wins o\b|wins u\b|season wins/i.test(text);
  if (catId === 'playoffs') return /playoff|make the playoffs|postseason/i.test(text);
  if (catId === 'most_wins') return /most wins/i.test(text);
  if (catId === 'least_wins') return /least wins/i.test(text);
  return false;
}

function deterministicVerdict(cat, movers, spots, expertGroups = []) {
  if (!cat.present) return cat.note || 'No market data available in the current window.';
  const teams = cat.subsections.flatMap((s) => s.teams || []);
  if (!teams.length) return 'Market present but no team data loaded.';
  const top = teams[0];
  const PREF = ['betonline', 'bookmaker', 'betus'];
  const bits = [];

  // ── Lead: favorite + close contender ──────────────────────────────────────
  if (cat.subsections[0]?.kind === 'wins') {
    const bot = teams[teams.length - 1];
    bits.push(`Win total leader: ${top.team} ${top.line.toFixed(1)} (O ${fmtOdds(top.over)} / U ${fmtOdds(top.under)}).`);
    if (bot && bot.team !== top.team) bits.push(`Floor: ${bot.team} ${bot.line.toFixed(1)} (O ${fmtOdds(bot.over)} / U ${fmtOdds(bot.under)}).`);

    // SoS angle
    const withSos = teams.filter((t) => t.sos != null);
    if (withSos.length >= 2) {
      const hardest = withSos.reduce((a, t) => t.sos > a.sos ? t : a);
      const easiest = withSos.reduce((a, t) => t.sos < a.sos ? t : a);
      bits.push(`Schedule: ${hardest.team} faces the hardest slate (SoS #${hardest.sosRank}, ${hardest.sos.toFixed(1)} opp wins); ${easiest.team} gets the easiest (SoS #${easiest.sosRank}, ${easiest.sos.toFixed(1)}).`);
      // Under risk: high line + hard schedule
      const underRisk = teams.filter((t) => t.line >= 10 && t.sosRank != null && t.sosRank <= 10);
      if (underRisk.length) bits.push(`Under risk: ${underRisk.map((t) => `${t.team} (${t.line.toFixed(1)} line, SoS #${t.sosRank})`).join(', ')} — high expectations vs tough opponents.`);
      // Over value: modest line + easy schedule
      const overValue = teams.filter((t) => t.line != null && t.line <= 9.5 && t.sosRank != null && t.sosRank >= 23);
      if (overValue.length) bits.push(`Over value: ${overValue.map((t) => `${t.team} (${t.line.toFixed(1)} line, SoS #${t.sosRank})`).join(', ')} — soft slate could drive outperformance.`);
    }

    // ATS angle
    const withAts = teams.filter((t) => t.ats?.pct != null);
    if (withAts.length >= 2) {
      const sorted = [...withAts].sort((a, b) => b.ats.pct - a.ats.pct);
      const best = sorted[0], worst = sorted[sorted.length - 1];
      bits.push(`ATS trend: ${best.team} covers ${Math.round(best.ats.pct * 100)}% (${best.ats.seasons}yr); ${worst.team} covers ${Math.round(worst.ats.pct * 100)}% — historical cover rate is a useful regression signal.`);
      // Flag teams with strong ATS + easy schedule
      const doublePos = withAts.filter((t) => t.ats.pct > 0.54 && t.sosRank != null && t.sosRank >= 20);
      if (doublePos.length) bits.push(`Double positive: ${doublePos.map((t) => `${t.team} (${Math.round(t.ats.pct * 100)}% ATS, SoS #${t.sosRank})`).join(', ')} — strong cover rate on a soft schedule.`);
    }
  } else {
    bits.push(`Favorite: ${top.team} at ${fmtPct(top.consensus)} implied (${fmtOdds(impliedToAmerican(top.consensus))}).`);
    if (teams[1] && teams[1].consensus > 0.12)
      bits.push(`Contender: ${teams[1].team} ${fmtOdds(impliedToAmerican(teams[1].consensus))}.`);

    // ── Sleepers: meaningful implied prob but long odds ────────────────────
    const sleepers = teams.filter((t) => t.consensus > 0.04 && t.consensus < 0.12 && impliedToAmerican(t.consensus) > 600);
    if (sleepers.length)
      bits.push(`Sleepers worth a look: ${sleepers.slice(0, 3).map((t) => `${t.team} ${fmtOdds(impliedToAmerican(t.consensus))}`).join(', ')}.`);

    // ── Line movement signals ──────────────────────────────────────────────
    const catMovers = movers.filter((m) => catMatchesMarket(cat.id, m.market)).slice(0, 2);
    if (catMovers.length) {
      const steam = catMovers.filter((m) => m.delta > 0);
      const drift = catMovers.filter((m) => m.delta < 0);
      if (steam.length) bits.push(`Shortening (sharp steam): ${steam.map((m) => `${m.team} ${fmtDelta(m.delta)}`).join(', ')}.`);
      if (drift.length) bits.push(`Drifting (possible value): ${drift.map((m) => `${m.team} ${fmtDelta(m.delta)}`).join(', ')}.`);
    }

    // ── Sharp/public divergence ────────────────────────────────────────────
    const catSpots = spots.filter((s) => catMatchesMarket(cat.id, s.market)).slice(0, 2);
    if (catSpots.length)
      bits.push(`Sharp edge: ${catSpots.map((s) => `${s.team} ${fmtDelta(s.divergence)} sharp/public gap`).join(', ')}.`);
  }

  // ── Price-shopping callout (gap > 500 pts between books) ──────────────────
  const shopable = teams.filter((t) => {
    const vals = PREF.map((b) => t.allBooks?.[b]).filter((v) => v != null);
    return vals.length >= 2 && Math.max(...vals) - Math.min(...vals) > 500;
  });
  if (shopable.length) {
    const ex = shopable[0];
    const vals = PREF.map((b) => ex.allBooks?.[b]).filter((v) => v != null);
    bits.push(`Shop lines: ${ex.team} ranges ${fmtOdds(Math.min(...vals))}–${fmtOdds(Math.max(...vals))} across sharp books.`);
  }

  // ── Expert signal synthesis ───────────────────────────────────────────────
  const catSigs = expertGroups
    .flatMap((g) => g.signals.filter((s) => catSignalMatch(cat.id, s)).map((s) => ({ ...s, _source: g.source })))
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  if (catSigs.length) {
    const leanCounts = {};
    for (const s of catSigs) { const l = (s.lean || 'unknown').toLowerCase(); leanCounts[l] = (leanCounts[l] || 0) + 1; }
    const leanStr = Object.entries(leanCounts).sort((a, b) => b[1] - a[1]).map(([l, n]) => `${n}× ${l}`).join(', ');
    const topSigs = catSigs.slice(0, 3).map((s) => {
      const who = s.author ? `${s.author} (${s._source})` : s._source;
      return `${who} → ${(s.lean || '').toUpperCase()} ${s.team_or_market}${s.rationale ? ` — ${s.rationale}` : ''}`;
    });
    bits.push(`Expert lean (${catSigs.length} signal${catSigs.length > 1 ? 's' : ''}): ${leanStr}. ${topSigs.join('; ')}.`);
  }

  if (cat.source === 'proxy') bits.push('Proxy ranking — treat as directional until the dedicated market opens.');
  if (!bits.length) return 'Market present; no standout signals in current window.';
  return bits.map((b) => '• ' + b).join('\n');
}
function buildNarratives(cats, expertGroups, movers, spots) {
  const out = {};
  for (const cat of cats) {
    out[cat.id] = deterministicVerdict(cat, movers, spots, expertGroups);
  }
  return out;
}

// ── Renderers ────────────────────────────────────────────────────────────────
function teamRow(t) {
  return { team: t.team, american: fmtOdds(impliedToAmerican(t.consensus)), pct: fmtPct(t.consensus),
    dk: fmtOdds(t.allBooks?.draftkings), fd: fmtOdds(t.allBooks?.fanduel),
    bol: fmtOdds(t.allBooks?.betonline), bm: fmtOdds(t.allBooks?.bookmaker), btu: fmtOdds(t.allBooks?.betus),
    move: t.movement, moveStr: fmtDelta(t.movement) };
}

function renderMarkdown(model) {
  const L = [];
  L.push(`# NFL Futures Intel Report — ${model.reportDate}`, '');
  L.push(`> Season ${model.season} · generated ${model.generatedAt} · trigger: ${model.trigger}`);
  L.push(`> Windows: odds = full ${model.season} season history · ${INTEL_DAYS}d articles · ${SIGNAL_DAYS}d signals · Narrative: ${model.engine.narrative}`, '');

  // Coverage audit
  L.push('## Coverage Audit', '');
  L.push(`Configured sources: ${model.coverage.summary.active} active · covered this window: ${model.coverage.summary.covered} · no data: ${model.coverage.summary.no_data} · deferred: ${model.coverage.summary.deferred}`, '');
  L.push('| Source | Type | Status | Items (window) |', '|---|---|---|---|');
  for (const r of model.coverage.rows) {
    const badge = { covered: '✅ covered', no_data: '⚠️ no data', awaiting_input: '✋ awaiting paste', deferred: '⏸️ deferred' }[r.state];
    L.push(`| ${r.name} | ${r.type} | ${badge}${r.note ? ` — ${r.note}` : ''} | ${r.seen} |`);
  }
  L.push('');

  // Categories
  for (const cat of model.categories) {
    L.push(`## ${cat.label}`, '');
    if (model.narratives[cat.id]) L.push(`**Verdict.** ${model.narratives[cat.id]}`, '');
    if (!cat.present) { L.push(`_${cat.note || 'No data.'}_`, ''); continue; }
    if (cat.note) L.push(`> ${cat.note}`, '');
    for (const sub of cat.subsections) {
      if (cat.subsections.length > 1) L.push(`### ${sub.label}`, '');
      if (sub.kind === 'wins') {
        L.push('| Team | Win Total | Over | Under | Δ |', '|---|---|---|---|---|');
        for (const t of sub.teams) L.push(`| ${t.team} | ${t.line.toFixed(1)} | ${fmtOdds(t.over)} | ${fmtOdds(t.under)} | ${fmtLineDelta(t.movement)} |`);
      } else {
        L.push('| Team | Consensus | Implied | BOL | BKR | BTU | DK | FD | Delta since open |', '|---|---|---|---|---|---|---|---|---|');
        for (const t of sub.teams.map(teamRow)) L.push(`| ${t.team} | ${t.american} | ${t.pct} | ${t.bol} | ${t.bm} | ${t.btu} | ${t.dk} | ${t.fd} | ${t.moveStr} |`);
      }
      L.push('');
    }
  }

  // Line movement + value spots
  L.push('## Line Movement — Offseason (since opening snapshot)', '');
  if (model.movers.length) {
    L.push('| Market | Team | Opening | Current | Net Δ | Trend | Window |', '|---|---|---|---|---|---|---|');
    for (const m of model.movers) L.push(`| ${m.market} | ${m.team} | ${fmtPct(m.opening)} | ${fmtPct(m.consensus)} | ${fmtDelta(m.delta)} ${m.delta >= 0 ? '📈' : '📉'} | \`${m.spark || '—'}\` | ${m.firstDate || '—'}→${m.lastDate || '—'} (${m.points}) |`);
  } else L.push('_No significant movement across loaded snapshots._');
  L.push('');
  L.push(`## Value Spots (Sharp/Public ≥${Math.round(DIVERGENCE_THRESHOLD * 100)}pp)`, '');
  if (model.valueSpots.length) {
    L.push('| Market | Team | Sharp | Public | Gap | Signal | Sources |', '|---|---|---|---|---|---|---|');
    for (const s of model.valueSpots) {
      const sources = (s.sourceLinks || []).map((l) => `[${l.source || 'source'}](${l.url})`).join(', ') || 'odds-derived';
      L.push(`| ${s.market} | ${s.team} | ${fmtPct(s.sharpImplied)} | ${fmtPct(s.publicImplied)} | ${fmtDelta(s.divergence)} | ${s.divergence > 0 ? 'sharp lean' : 'possible overbet' } | ${sources} |`);
    }
  } else L.push('_No divergence ≥ threshold._');
  L.push('');

  // Expert grouping
  L.push('## Recommendations by Expert / Source', '');
  if (model.expertGroups.length) {
    for (const g of model.expertGroups) {
      L.push(`### ${g.source}`);
      for (const s of g.signals.slice(0, 8)) L.push(`- **${s.team_or_market}** — ${String(s.lean).toUpperCase()} [${s.bet_type}]${s.confidence ? ` (${Math.round(s.confidence * 100)}%)` : ''}${s.rationale ? ` — ${s.rationale}` : ''}`);
      for (const a of g.articles.slice(0, 4)) L.push(`- 📄 [${a.title || 'Article'}](${a.url})`);
      for (const t of g.tweets.slice(0, 4)) L.push(`- 🐦 ${String(t.text).slice(0, 160).replace(/\n/g, ' ')}`);
      L.push('');
    }
  } else L.push('_No expert futures signals in window._', '');

  L.push('---', `_Generated ${model.generatedAt} · odds via TheOddsAPI snapshots · ${model.engine.narrative} narrative._`, '');
  return L.join('\n');
}

function renderHtml(model) {
  // ── Core helpers ─────────────────────────────────────────────────────────────
  const prose = (s) => esc(s || '').replace(/\n/g, '<br>');

  // SVG line-graph sparkline. series = [{t, consensus}]. isUp drives line color.
  // A dashed reference line is drawn at the opening value so direction-from-start is instant.
  const svgSpark = (series, w = 110, h = 34) => {
    if (!series || series.length < 2) return '<span class="na" style="font-size:11px">no trend data</span>';
    const vals = series.map((s) => Number(s.consensus));
    const minV = Math.min(...vals), maxV = Math.max(...vals);
    const span = (maxV - minV) || 0.001;
    const PAD = 3;
    const xp = (i) => Math.round(PAD + (i / (vals.length - 1)) * (w - PAD * 2));
    const yp = (v) => Math.round(PAD + (1 - (v - minV) / span) * (h - PAD * 2));
    const pts = vals.map((v, i) => xp(i) + ',' + yp(v)).join(' ');
    const openY  = yp(vals[0]);
    const lastX  = xp(vals.length - 1), lastY = yp(vals[vals.length - 1]);
    const isUp   = vals[vals.length - 1] >= vals[0];
    const color  = isUp ? '#22c55e' : '#f05252';
    return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" style="overflow:visible;display:block">' +
      // Opening reference line (dashed, subtle)
      '<line x1="' + PAD + '" y1="' + openY + '" x2="' + (w - PAD) + '" y2="' + openY + '" stroke="#2e3a50" stroke-width="1" stroke-dasharray="3,2"/>' +
      // Trend line
      '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>' +
      // Opening dot (gray)
      '<circle cx="' + PAD + '" cy="' + openY + '" r="2" fill="#5a6d84"/>' +
      // Current dot (colored)
      '<circle cx="' + lastX + '" cy="' + lastY + '" r="2.8" fill="' + color + '"/>' +
      '</svg>';
  };

  // Tiny version for table cells
  const svgSparkSmall = (series) => svgSpark(series, 70, 22);

  // Preferred books (CA-legal offshore); DK/FD retained for proxy reference only
  const PREF_BOOKS = ['betonline', 'bookmaker', 'betus'];

  // Best odds from preferred books: highest American odds = best payout for bettor
  const bestPref = (booksObj) => {
    let best = null, bestBook = null;
    for (const b of PREF_BOOKS) {
      const v = booksObj?.[b];
      if (v == null) continue;
      if (best === null || v > best) { best = v; bestBook = b; }
    }
    return best != null ? { odds: best, book: bestBook } : null;
  };

  // Per-book chips for mover cards (BOL / BKR / BTU only)
  const bookOddsChips = (booksObj) => PREF_BOOKS.map((b) => {
    const v = booksObj?.[b]; const lbl = BOOK_SHORT[b];
    return v != null
      ? '<span class="book-chip">' + lbl + ' <b class="mono">' + fmtOdds(v) + '</b></span>'
      : '<span class="book-chip na">' + lbl + ' <span>—</span></span>';
  }).join('');

  // Delta chip — string concat (avoids nested backtick issues)
  const delt = (d, fmtFn) => {
    if (d == null) return '<span class="na">—</span>';
    const isZero = Math.abs(d) < 0.001;
    const cls = isZero ? 'zero' : d >= 0 ? 'up' : 'dn';
    const arrow = d >= 0 ? '▲' : '▼';
    return '<span class="delt ' + cls + '">' + arrow + ' ' + fmtFn(d) + '</span>';
  };
  const deltaOdds = (d) => delt(d, fmtDelta);
  const deltaLine = (d) => (d == null || d === 0) ? '<span class="na">—</span>' : delt(d, fmtLineDelta);

  // Implied-probability bar cell (<td> included) — linear 0-100% scale
  const probBar = (p) => {
    if (p == null || isNaN(p)) return '<td class="na">—</td>';
    const pct = p * 100;
    const w = Math.min(Math.round(pct), 100); // linear: 50% prob = 50% bar fill
    const cls = pct >= 40 ? 'hi' : pct >= 15 ? 'md' : 'lo';
    return '<td><div class="pbar"><div class="pbar-fill ' + cls + '" style="width:' + w + '%"></div><span>' + fmtPct(p) + '</span></div></td>';
  };

  // Status badge
  const badge = (state) => ({
    covered:        '<span class="b b-ok">✓ covered</span>',
    no_data:        '<span class="b b-warn">no data</span>',
    awaiting_input: '<span class="b b-info">awaiting</span>',
    deferred:       '<span class="b b-mute">deferred</span>',
  }[state] || '');

  // ── Odds tables ──────────────────────────────────────────────────────────────
  // Win totals: SoS placeholder column + optional row truncation
  const winsTable = (teams, collapseAfter = 0) => {
    const thead =
      '<thead>' +
      '<tr>' +
        '<th rowspan="2">Team</th>' +
        '<th rowspan="2" colspan="2">Line</th>' +
        '<th colspan="3" style="text-align:center;padding-bottom:3px;border-bottom:none">Over</th>' +
        '<th colspan="3" style="text-align:center;padding-bottom:3px;border-bottom:none">Under</th>' +
        '<th rowspan="2">Δ</th>' +
        '<th rowspan="2" title="Strength of Schedule — rank by sum of opponents projected win totals (1=hardest, 32=easiest). Tooltip shows raw opp-wins sum.">SoS</th>' +
        '<th rowspan="2" title="ATS cover rate over last 4 seasons (2022–2025).">ATS%</th>' +
      '</tr>' +
      '<tr style="background:var(--s3)">' +
        '<th style="font-size:10px;padding:3px 8px">BOL</th><th style="font-size:10px;padding:3px 8px">BKR</th><th style="font-size:10px;padding:3px 8px">BTU</th>' +
        '<th style="font-size:10px;padding:3px 8px">BOL</th><th style="font-size:10px;padding:3px 8px">BKR</th><th style="font-size:10px;padding:3px 8px">BTU</th>' +
      '</tr>' +
      '</thead>';

    const mkRow = (t, idx) => {
      const hiddenCls = (collapseAfter > 0 && idx >= collapseAfter) ? ' class="hidden-row"' : '';

      // Best Over: highest American odds across BOL/BKR/BTU
      const overVals = PREF_BOOKS.map((b) => ({ b, v: t.overByBook?.[b] })).filter((x) => x.v != null);
      const bestOverBook = overVals.length >= 2 ? overVals.reduce((a, x) => x.v > a.v ? x : a).b : null;

      // Best Under: highest American odds across BOL/BKR/BTU
      const underVals = PREF_BOOKS.map((b) => ({ b, v: t.underByBook?.[b] })).filter((x) => x.v != null);
      const bestUnderBook = underVals.length >= 2 ? underVals.reduce((a, x) => x.v > a.v ? x : a).b : null;

      const ouCell = (side, book) => {
        const v = side === 'over' ? t.overByBook?.[book] : t.underByBook?.[book];
        const isBest = book === (side === 'over' ? bestOverBook : bestUnderBook);
        return v != null
          ? '<td class="mono' + (isBest ? ' disc-hi-max' : '') + '">' + fmtOdds(v) + '</td>'
          : '<td class="na mono">—</td>';
      };

      // SoS cell — quartiles relative to pool size so colour works even with sparse data
      const sosCell = t.sosRank != null
        ? (() => {
            const rank = t.sosRank;
            const n    = t.sosTotal || 32;
            const hard = Math.max(2, Math.ceil(n * 0.25));   // top quartile = tough schedule
            const easy = Math.min(n - 1, Math.floor(n * 0.75)); // bottom quartile = easy schedule
            const cls  = rank <= hard ? 'color:var(--red)' : rank >= easy ? 'color:var(--green)' : 'color:var(--tx2)';
            const lbl  = rank <= hard ? '🔴' : rank >= easy ? '🟢' : '⚪';
            const tip  = 'Opp proj wins: ' + (t.sos?.toFixed(1) || '?') + ' | rank ' + rank + '/' + n + (rank <= hard ? ' (tough)' : rank >= easy ? ' (easy)' : ' (mid)');
            return '<td class="sos-cell" title="' + tip + '"><span style="' + cls + ';font-weight:600">' + lbl + ' #' + rank + '</span></td>';
          })()
        : '<td class="sos-cell"><span class="sos-na">—</span></td>';

      // ATS% cell
      const atsCell = t.ats?.pct != null
        ? (() => {
            const pct = t.ats.pct;
            const col = pct > 0.55 ? 'var(--green)' : pct < 0.45 ? 'var(--red)' : 'var(--tx2)';
            const fw  = (pct > 0.55 || pct < 0.45) ? '700' : '400';
            return '<td style="color:' + col + ';font-weight:' + fw + ';white-space:nowrap">' +
              Math.round(pct * 100) + '% <span style="font-size:10px;color:var(--tx3)">(' + t.ats.seasons + 'yr)</span></td>';
          })()
        : '<td class="na">—</td>';

      return '<tr' + hiddenCls + '>' +
        '<td class="tm">' + esc(t.team) + '</td>' +
        '<td class="mono big-line">' + (t.line != null ? t.line.toFixed(1) : '—') + '</td>' +
        '<td class="line-bar-cell"><div class="line-bar" style="width:' + Math.min(Math.round(((t.line || 0) / 17) * 100), 100) + '%"></div></td>' +
        ouCell('over',  'betonline') + ouCell('over',  'bookmaker') + ouCell('over',  'betus') +
        ouCell('under', 'betonline') + ouCell('under', 'bookmaker') + ouCell('under', 'betus') +
        '<td>' + deltaLine(t.movement) + '</td>' +
        sosCell + atsCell +
        '</tr>';
    };

    const rows = teams.map((t, i) => mkRow(t, i)).join('');
    const showMore = (collapseAfter > 0 && teams.length > collapseAfter)
      ? '<button class="show-more-btn">Show ' + (teams.length - collapseAfter) + ' more ▼</button>'
      : '';
    return '<div class="tbl-wrap"><table>' + thead + '<tbody>' + rows + '</tbody></table>' + showMore + '</div>';
  };

  // Outright table: Open | Prob | Consensus | BOL | BKR | BTU | Best | Change
  // collapseAfter > 0 hides rows beyond that index, adds "Show N more" button.
  // Per-cell discrepancy: amber=highest book, green=lowest book (when gap >1500 pts).
  const outrightTable = (teams, tableId = '', collapseAfter = 0) => {
    const idAttr = tableId ? ' id="' + tableId + '"' : '';
    const thead = '<thead><tr>' +
      '<th title="NFL team">Team</th>' +
      '<th title="Consensus American odds at the first recorded opening snapshot">Open</th>' +
      '<th title="Implied win probability — average across all available books. Higher % = more likely to win.">Prob</th>' +
      '<th title="American odds equivalent of the consensus implied probability (avg across all books). Gives you a quick odds read for the market as a whole.">Consensus</th>' +
      '<th title="BetOnline odds — sharp offshore book.">BOL</th>' +
      '<th title="Bookmaker odds — sharp offshore book.">BKR</th>' +
      '<th title="BetUS odds — sharp offshore book.">BTU</th>' +
      '<th title="Best available price across BOL/BKR/BTU. Shop here for the highest payout.">Best</th>' +
      '<th title="Net change in implied probability (percentage points) since opening snapshot. ▲ = shortening (more favored). ▼ = drifting out.">Change</th></tr></thead>';
    const fmtCell = (v, discCls) => {
      if (v == null) return '<td class="na mono">—</td>';
      const n = typeof v === 'number' ? v : parseInt(v, 10);
      const cls = isNaN(n) ? '' : n <= -200 ? ' c-fav' : n >= 500 ? ' c-dog' : '';
      return '<td class="mono' + cls + (discCls ? ' ' + discCls : '') + '">' + fmtOdds(v) + '</td>';
    };
    const mkRow = (t, idx) => {
      const bp = bestPref(t.allBooks || {});
      const bestCell = bp
        ? '<td class="mono best-odds"><b>' + fmtOdds(bp.odds) + '</b> <span class="book-tag">' + BOOK_SHORT[bp.book] + '</span></td>'
        : '<td class="na mono">—</td>';
      // Per-cell discrepancy: green = highest American odds (best payout for bettor), amber = lowest (worst price)
      const prefVals = PREF_BOOKS.map((b) => t.allBooks?.[b]).filter((v) => v != null);
      const hasDisc = prefVals.length >= 2 && (Math.max(...prefVals) - Math.min(...prefVals)) > 1500;
      const discClsMap = {};
      if (prefVals.length >= 2) {
        const maxVal = Math.max(...prefVals), minVal = Math.min(...prefVals);
        for (const b of PREF_BOOKS) {
          const v = t.allBooks?.[b];
          if (v == null) continue;
          if (v === maxVal) discClsMap[b] = 'disc-hi-max';          // always green = best payout
          else if (v === minVal && hasDisc) discClsMap[b] = 'disc-hi-min'; // amber only for large gap
        }
      }
      const isHidden = collapseAfter > 0 && idx >= collapseAfter;
      const rowClasses = [isHidden ? 'hidden-row' : '', hasDisc ? 'row-disc' : ''].filter(Boolean).join(' ');
      const openCell = t.opening != null
        ? '<td class="mono ac">' + fmtOdds(impliedToAmerican(t.opening)) + '</td>'
        : '<td class="na mono">—</td>';
      return '<tr' + (rowClasses ? ' class="' + rowClasses + '"' : '') + ' data-team="' + esc(t.team) + '">' +
        '<td class="tm">' + esc(t.team) + (hasDisc ? '<span class="disc-badge" title="⚠ Large price gap between books — compare before buying">⚠</span>' : '') + '</td>' +
        openCell +
        probBar(t.consensus) +
        '<td class="mono ac">' + fmtOdds(impliedToAmerican(t.consensus)) + '</td>' +
        fmtCell(t.allBooks?.betonline, discClsMap.betonline) +
        fmtCell(t.allBooks?.bookmaker, discClsMap.bookmaker) +
        fmtCell(t.allBooks?.betus, discClsMap.betus) +
        bestCell +
        '<td>' + deltaOdds(t.movement) + '</td>' +
        '</tr>';
    };
    const rows = teams.map((t, i) => mkRow(t, i)).join('');
    const showMore = (collapseAfter > 0 && teams.length > collapseAfter)
      ? '<button class="show-more-btn">Show ' + (teams.length - collapseAfter) + ' more ▼</button>'
      : '';
    return '<div class="tbl-wrap">' +
      '<table' + idAttr + '>' + thead + '<tbody>' + rows + '</tbody></table>' +
      showMore + '</div>';
  };

  // ── Category section ─────────────────────────────────────────────────────────
  const catSection = (cat) => {
    const liveTag = !cat.present ? '<span class="b b-mute">no data</span>'
      : cat.source === 'proxy' ? '<span class="b b-info">proxy</span>'
      : '<span class="b b-ok">live</span>';

    let content;
    if (!cat.present) {
      content = '<p class="empty-note">' + esc(cat.note || 'No market data in window.') + '</p>';
    } else if (cat.id === 'playoffs') {
      // Group playoffs by division so divisional strength context is visible
      const teams = cat.subsections[0]?.teams || [];
      const byDiv = {};
      for (const t of teams) { const d = TEAM_DIVISION[t.team] || 'Other'; if (!byDiv[d]) byDiv[d] = []; byDiv[d].push(t); }
      content = DIVISION_ORDER.filter((d) => byDiv[d]).map((div) =>
        '<div class="div-head">' + esc(div) + '</div>' + outrightTable(byDiv[div])
      ).join('');
    } else if (cat.id === 'superbowl_matchup') {
      // SB Exact Matchup with team filter
      const teams = cat.subsections[0]?.teams || [];
      // Extract unique individual teams from matchup strings (split on " vs ", "/", or " - ")
      const allTeamNames = new Set();
      for (const t of teams) {
        const parts = t.team.split(/ vs | \/ | - /);
        for (const p of parts) { const clean = p.trim(); if (clean) allTeamNames.add(clean); }
      }
      const sortedNames = [...allTeamNames].sort();
      const filterUi = '<div class="matchup-filter">' +
        '<span class="mf-lbl">Filter teams:</span>' +
        '<div class="mf-chips" id="mf-chips">' +
        sortedNames.map((n) => '<button class="mf-chip" data-team="' + esc(n.toLowerCase()) + '">' + esc(n) + '</button>').join('') +
        '</div>' +
        '<span class="mf-count" id="mf-count">' + teams.length + ' matchups</span>' +
        '<button class="mf-clear" onclick="document.querySelectorAll(\'.mf-chip\').forEach(function(c){c.classList.remove(\'active\')});applyMatchupFilter()">Clear</button>' +
        '</div>';
      content = filterUi + outrightTable(teams, 'matchup-tbl');
    } else {
      content = cat.subsections.map((sub) => {
        const ca = cat.id === 'superbowl'   ? 10
                 : cat.id === 'wins'        ? 10
                 : cat.id === 'conference'  ? 4    // show top 4 per conf, collapse rest
                 : cat.id === 'division'    ? 2    // show top 2 per div, collapse rest
                 : cat.id === 'playoffs'    ? 8
                 : 0;
        const tbl = sub.kind === 'wins' ? winsTable(sub.teams, ca) : outrightTable(sub.teams, '', ca);
        return (cat.subsections.length > 1 ? '<h3 class="sub-head">' + esc(sub.label) + '</h3>' : '') + tbl;
      }).join('');
    }

    const verdictHtml = model.narratives[cat.id]
      ? '<div class="verdict"><div class="verdict-label">Verdict</div><div class="verdict-body">' + prose(model.narratives[cat.id]) + '</div></div>'
      : '';
    const noteHtml = cat.note && cat.present ? '<div class="cat-note">' + esc(cat.note) + '</div>' : '';
    return '<section id="' + cat.id + '" class="card cat-card">' +
      '<div class="cat-head"><button class="sec-toggle" title="Collapse section">▼</button><h2>' + esc(cat.label) + '</h2>' + liveTag + '</div>' +
      '<div class="sec-body">' + verdictHtml + noteHtml + content + '</div></section>';
  };

  // ── Movement — card grid for top movers, table for the rest ─────────────────
  const topMovers  = model.movers.slice(0, 9);
  const restMovers = model.movers.slice(9);

  const moverCard = (m) => {
    const cls = m.delta >= 0 ? 'up' : 'dn';
    // Find best current price among pref books for halo highlight
    let bestBook = null, bestOdds = null;
    for (const b of PREF_BOOKS) {
      const v = m.currentBooks?.[b];
      if (v != null && (bestOdds === null || v > bestOdds)) { bestOdds = v; bestBook = b; }
    }
    // Book grid: header row + opening row + current row
    const bookGrid =
      '<div class="mc-book-grid">' +
        '<div class="mc-bg-hdr"><span>—</span>' + PREF_BOOKS.map((b) => '<span>' + BOOK_SHORT[b] + '</span>').join('') + '</div>' +
        '<div class="mc-bg-row"><span class="lbl">Open</span>' +
          PREF_BOOKS.map((b) => {
            const v = m.openingBooks?.[b];
            return v != null ? '<span class="cv mono">' + fmtOdds(v) + '</span>' : '<span class="na">—</span>';
          }).join('') +
        '</div>' +
        '<div class="mc-bg-row"><span class="lbl">Now</span>' +
          PREF_BOOKS.map((b) => {
            const v = m.currentBooks?.[b];
            if (v == null) return '<span class="na">—</span>';
            return '<span class="cv mono' + (b === bestBook ? ' best-price' : '') + '">' + fmtOdds(v) + '</span>';
          }).join('') +
        '</div>' +
      '</div>';
    return '<div class="mover-card ' + cls + '">' +
      '<div class="mc-delta"><span class="th-tip" data-tip="Net change in implied win probability (percentage points) since the opening snapshot. pp = percentage points. ▲ = shortening (more favored). ▼ = drifting (less favored).">' + (m.delta >= 0 ? '▲' : '▼') + ' ' + fmtDelta(m.delta) + '</span></div>' +
      '<div class="mc-team">' + esc(m.team) + '</div>' +
      '<div class="mc-market">' + esc(m.market) + '</div>' +
      '<div class="mc-spark" title="Implied probability trend — line shows movement across snapshot dates. Dashed line = opening value. Green dot = current.">' + svgSpark(m.series) + '</div>' +
      bookGrid +
      '<div class="mc-meta-row"><span class="mc-meta-lbl">Probability:</span> ' + fmtPct(m.opening) + ' open → ' + fmtPct(m.consensus) + ' now</div>' +
      '<div class="mc-meta-row"><span class="mc-meta-lbl">Window:</span> ' + esc(m.firstDate || '?') + ' → ' + esc(m.lastDate || '?') + ' (' + m.points + ' snapshots)</div>' +
      '</div>';
  };

  const moverRestTable = restMovers.length
    ? '<div class="tbl-wrap" style="margin-top:14px"><table id="mover-rest-tbl">' +
      '<thead><tr>' +
        '<th class="sort-col" onclick="sortMoverTbl(this,0)">Team<span class="si"></span></th>' +
        '<th class="sort-col" onclick="sortMoverTbl(this,1)">Market<span class="si"></span></th>' +
        '<th><span class="th-tip" data-tip="Implied probability at the first recorded snapshot">Open %</span></th>' +
        '<th><span class="th-tip" data-tip="Current implied probability (latest snapshot)">Now %</span></th>' +
        '<th class="sort-col" onclick="sortMoverTbl(this,4)"><span class="th-tip" data-tip="Net change in implied probability since opening (percentage points)">Δ pp</span><span class="si"></span></th>' +
        '<th><span class="th-tip" data-tip="Probability trend line. Dashed = opening level. Green/red dot = current value.">Trend</span></th>' +
        '<th><span class="th-tip" data-tip="Date range of snapshots used for this movement calculation">Window</span></th>' +
      '</tr></thead><tbody>' +
      restMovers.map((m) =>
        '<tr data-market="' + esc(m.market) + '" data-delta="' + (m.delta || 0) + '">' +
        '<td class="tm">' + esc(m.team) + '</td>' +
        '<td>' + esc(m.market) + '</td>' +
        '<td class="mono">' + fmtPct(m.opening) + '</td>' +
        '<td class="mono">' + fmtPct(m.consensus) + '</td>' +
        '<td>' + deltaOdds(m.delta) + '</td>' +
        '<td style="padding:4px 12px">' + svgSparkSmall(m.series) + '</td>' +
        '<td class="mono na">' + esc(m.firstDate || '—') + ' → ' + esc(m.lastDate || '—') + '</td>' +
        '</tr>'
      ).join('') +
      '</tbody></table></div>'
    : '';

  const movementHtml = model.movers.length
    ? '<div class="mover-grid">' + topMovers.map(moverCard).join('') + '</div>' + moverRestTable
    : '<div class="empty-state">' +
      '<div class="es-icon">📈</div>' +
      '<div class="es-head">No significant movement yet</div>' +
      '<div class="es-sub">Movement appears once a market has ≥2 snapshot dates. More snapshots accumulate through the offseason.</div>' +
      '</div>';

  // ── Value spots ──────────────────────────────────────────────────────────────
  // Map a market label to a filter category key
  function spotMarketCat(mkt) {
    const m = (mkt || '').toLowerCase();
    if (m.includes('super bowl')) return 'superbowl';
    if (m.includes('championship') || m.includes('conference')) return 'conference';
    if (/\b(afc|nfc) (east|west|north|south)\b/.test(m) || m.includes('division')) return 'division';
    if (m.includes('win total') || m.includes('total wins') || m.includes('most wins') || m.includes('least wins')) return 'wins';
    if (m.includes('playoff')) return 'playoffs';
    return 'other';
  }
  const SPOT_CAT_LABEL = { superbowl: 'Super Bowl', conference: 'Conference', division: 'Division', wins: 'Win Total', playoffs: 'Playoffs', other: 'Other' };
  const SPOT_CAT_ORDER = ['superbowl', 'conference', 'division', 'wins', 'playoffs', 'other'];

  // Annotate each spot with its categories
  const spotsTagged = model.valueSpots.map((s) => {
    let cats;
    if (s.spotType === 'wins_ou') {
      cats = ['wins'];
    } else if (s.spotType === 'spread') {
      cats = [...new Set((s.markets || []).map((m) => spotMarketCat(m.market)))];
    } else {
      cats = [spotMarketCat(s.market || '')];
    }
    return { ...s, _cats: cats };
  });

  // Count per category for filter badge
  const catCounts = {};
  for (const s of spotsTagged) for (const c of s._cats) catCounts[c] = (catCounts[c] || 0) + 1;

  const filterBar = '<div class="spots-filters" id="spots-filters">' +
    '<button class="spot-filter active" data-filter="all">All <span class="sfc">' + spotsTagged.length + '</span></button>' +
    SPOT_CAT_ORDER.filter((c) => catCounts[c]).map((c) =>
      '<button class="spot-filter" data-filter="' + c + '">' + SPOT_CAT_LABEL[c] + ' <span class="sfc">' + catCounts[c] + '</span></button>'
    ).join('') +
    '</div>';

  // Shared: render expert signals as bullet points
  function expertBullets(signals) {
    if (!signals || !signals.length) return '';
    const items = signals.map((sig) => {
      const byline = sig.author
        ? esc(sig.author) + ' <span class="sig-outlet">(' + esc(sig.source || '') + ')</span>'
        : esc(sig.source || '');
      const lean = sig.lean ? ' → <b>' + esc(sig.lean) + '</b>' : '';
      const why  = sig.rationale ? '<span class="sig-rationale"> — ' + esc(sig.rationale) + '</span>' : '';
      return '<li><span class="sig-source">' + byline + '</span>' + lean + why + '</li>';
    }).join('');
    return '<div class="spot-experts"><div class="spot-experts-lbl">Expert takes</div><ul class="sig-list">' + items + '</ul></div>';
  }

  const valueHtml = model.valueSpots.length
    ? filterBar + '<div class="spots-list" id="spots-list">' + spotsTagged.map((s) => {
        const catsAttr = s._cats.join(' ');
        const catTags  = s._cats.map((c) => '<span class="spot-cat-tag ' + c + '">' + (SPOT_CAT_LABEL[c] || c) + '</span>').join('');
        const experts  = expertBullets(s.expertSignals);

        // ── wins_ou card ──────────────────────────────────────────────────────
        if (s.spotType === 'wins_ou') {
          const lineLabel = s.lineNote ? s.lineNote : (s.line != null ? s.line : '—');
          const mkPriceRow = (side, vals, best, worst) => {
            if (!vals || vals.length < 1) return '';
            const allCols = vals.map((x) => {
              const isBest = best && x.b === best.b;
              const cls = isBest ? ' class="wou-best"' : '';
              return '<td' + cls + '>' + fmtOdds(x.v) + '</td>';
            }).join('');
            return '<tr><td class="wou-side">' + side + '</td>' + allCols + '</tr>';
          };
          const bookHdrs = (s.overPrices || s.underPrices || []).length > 0
            ? (s.overPrices.length ? s.overPrices : s.underPrices).map((x) => '<th>' + (BOOK_SHORT[x.b] || x.b) + '</th>').join('')
            : '';
          const overRow  = mkPriceRow('Over',  s.overPrices,  s.overBest,  s.overWorst);
          const underRow = mkPriceRow('Under', s.underPrices, s.underBest, s.underWorst);
          const lineNote = typeof s.lineNote === 'string'
            ? '<div class="wou-line-note">⚠️ Line mismatch: ' + esc(s.lineNote) + '</div>' : '';
          return '<div class="spot-card wins-ou" data-cats="' + catsAttr + '">' +
            '<div class="spot-card-head">' +
              '<button class="spot-toggle" title="Expand">▶</button>' +
              '<div class="spot-card-meta">' +
                '<span class="spot-team">' + esc(s.team) + '</span>' +
                '<span class="spot-cat-tags">' + catTags + '</span>' +
              '</div>' +
              '<span class="spot-card-count">Win Total ' + esc(String(s.line ?? '—')) + '</span>' +
            '</div>' +
            '<div class="spot-card-body" style="display:none">' +
              lineNote +
              '<table class="wou-tbl"><thead><tr><th></th>' + bookHdrs + '</tr></thead><tbody>' + overRow + underRow + '</tbody></table>' +
              '<div class="spot-explain">Green = best price. Buy the highlighted side/book. ' + (s.lineNote ? 'Line differs by book — verify before betting.' : '') + '</div>' +
              experts +
            '</div>' +
          '</div>';
        }

        // ── spread card (outrights) ───────────────────────────────────────────
        if (s.spotType === 'spread') {
          const n = s.markets?.length || 1;
          const mktRows = (s.markets || []).map((m) => {
            const bLbl = BOOK_SHORT[m.bestBook]  || m.bestBook;
            const wLbl = BOOK_SHORT[m.worstBook] || m.worstBook;
            return '<div class="spread-mkt-row">' +
              '<span class="spread-mkt-name">' + esc(m.market) + '</span>' +
              '<span class="spread-mkt-action">' + bLbl + ' <b>' + fmtOdds(m.bestOdds) + '</b></span>' +
              '<span class="spread-mkt-ctx">(+' + m.spread + ' vs ' + wLbl + ')</span>' +
            '</div>';
          }).join('');
          return '<div class="spot-card spread" data-cats="' + catsAttr + '">' +
            '<div class="spot-card-head">' +
              '<button class="spot-toggle" title="Expand">▶</button>' +
              '<div class="spot-card-meta">' +
                '<span class="spot-team">' + esc(s.team) + '</span>' +
                '<span class="spot-cat-tags">' + catTags + '</span>' +
              '</div>' +
              '<span class="spot-card-count">' + n + ' market' + (n > 1 ? 's' : '') + '</span>' +
            '</div>' +
            '<div class="spot-card-body" style="display:none">' +
              '<div class="spot-label">💰 Shop This Line</div>' +
              '<div class="spread-mkts">' + mktRows + '</div>' +
              '<div class="spot-explain">Buy the best-priced book before lines converge.</div>' +
              experts +
            '</div>' +
          '</div>';
        }

        // ── divergence card (sharp vs public) ─────────────────────────────────
        const chipsNow  = (s.currentBooks && Object.keys(s.currentBooks).length) ? bookOddsChips(s.currentBooks) : '';
        const chipsOpen = (s.openingBooks && Object.keys(s.openingBooks).length)  ? bookOddsChips(s.openingBooks) : '';
        const labelCls = s.divergence > 0 ? 'sharp' : 'overbet';
        const lbl      = s.divergence > 0 ? '🔪 Sharp Lean' : '🚨 Overbet';
        const explain  = s.divergence > 0
          ? 'Sharp books imply a higher win probability than public books — possible sharp support or stale public price.'
          : 'Public books imply higher probability than sharps — possible public tax or overbet favorite.';
        return '<div class="spot-card ' + labelCls + '" data-cats="' + catsAttr + '">' +
          '<div class="spot-card-head">' +
            '<button class="spot-toggle" title="Expand">▶</button>' +
            '<div class="spot-card-meta">' +
              '<span class="spot-team">' + esc(s.team) + '</span>' +
              '<span class="spot-cat-tags">' + catTags + '</span>' +
            '</div>' +
            '<span class="spot-card-count">' + lbl + '</span>' +
          '</div>' +
          '<div class="spot-card-body" style="display:none">' +
            '<div class="spot-market">' + esc(s.market) + '</div>' +
            '<div class="spot-nums">' +
              '<span>Sharp <b>' + fmtPct(s.sharpImplied) + '</b></span>' +
              '<span class="spot-gap">' + fmtDelta(s.divergence) + '</span>' +
              '<span>Public <b>' + fmtPct(s.publicImplied) + '</b></span>' +
            '</div>' +
            '<div class="spot-explain">' + esc(explain) + '</div>' +
            (chipsNow  ? '<div class="spot-chips"><span class="spot-chips-lbl">Now</span>'  + chipsNow  + '</div>' : '') +
            (chipsOpen ? '<div class="spot-chips"><span class="spot-chips-lbl">Open</span>' + chipsOpen + '</div>' : '') +
            experts +
          '</div>' +
        '</div>';
      }).join('') + '</div>'
    : '<div class="empty-state">' +
      '<div class="es-icon">🎯</div>' +
      '<div class="es-head">No value spots above threshold</div>' +
      '<div class="es-sub">Spots fire when sharp books diverge ≥' + Math.round(DIVERGENCE_THRESHOLD * 100) + 'pp vs public books; when outright prices (SB/conf/div/playoffs) spread ≥' + SPREAD_THRESHOLD + ' pts across BOL/BKR/BTU; or when win-total O/U prices spread ≥' + WINS_OU_THRESHOLD + ' pts.</div>' +
      '</div>';

  // ── Expert signals ───────────────────────────────────────────────────────────
  const expertHtml = !model.expertGroups.length
    ? '<div class="empty-state">' +
      '<div class="es-icon">🗣️</div>' +
      '<div class="es-head">No expert futures signals in window</div>' +
      '<div class="es-sub">Signals appear when RSS articles contain futures picks, or when sharp tweets are pasted via the manual tweet tool.</div>' +
      '</div>'
    : model.expertGroups.map((g) => {
        const counts = [
          g.signals.length && (g.signals.length + ' pick' + (g.signals.length > 1 ? 's' : '')),
          g.articles.length && (g.articles.length + ' article' + (g.articles.length > 1 ? 's' : '')),
          g.tweets.length && (g.tweets.length + ' tweet' + (g.tweets.length > 1 ? 's' : '')),
        ].filter(Boolean).join(' · ');
        const signals = g.signals.slice(0, 8).map((s) => {
          const summaryBlock = s.articleSummary
            ? '<blockquote class="signal-summary">' + prose(s.articleSummary) + '</blockquote>'
            : (s.rationale ? '<div class="sub-note">' + esc(s.rationale) + '</div>' : '');
          const srcLink = s.articleUrl
            ? '<div class="signal-src"><a href="' + esc(s.articleUrl) + '" target="_blank" rel="noopener">📄 ' + esc(s.articleTitle || 'Source article') + '</a></div>'
            : '';
          return '<li>' +
            '<span class="lean">' + esc(String(s.lean).toUpperCase()) + '</span> ' +
            '<span class="tm">' + esc(s.team_or_market) + '</span> ' +
            '<span class="mono na">[' + esc(s.bet_type) + ']</span>' +
            (s.confidence ? '<span class="conf">' + Math.round(s.confidence * 100) + '%</span>' : '') +
            summaryBlock + srcLink + '</li>';
        }).join('');
        const articles = g.articles.slice(0, 4).map((a) =>
          '<li>📄 <a href="' + esc(a.url) + '" target="_blank" rel="noopener">' + esc(a.title || 'Article') + '</a></li>'
        ).join('');
        const tweets = g.tweets.slice(0, 4).map((t) =>
          '<li class="tweet-item">🐦 ' + esc(String(t.text).slice(0, 160)) + '</li>'
        ).join('');
        return '<div class="expert-card">' +
          '<div class="expert-head">' +
          '<span class="expert-name">' + esc(g.source) + '</span>' +
          '<span class="expert-counts">' + counts + '</span></div>' +
          '<ul class="expert-list">' + signals + articles + tweets + '</ul></div>';
      }).join('');

  // ── Coverage audit ───────────────────────────────────────────────────────────
  const coverageHtml = (() => {
    const s = model.coverage.summary;
    const statsHtml =
      '<div class="cov-stat"><span class="cs-num">' + s.active + '</span><span class="cs-lbl">configured</span></div>' +
      '<div class="cov-stat up"><span class="cs-num">' + s.covered + '</span><span class="cs-lbl">covered</span></div>' +
      '<div class="cov-stat warn"><span class="cs-num">' + s.no_data + '</span><span class="cs-lbl">no data</span></div>' +
      '<div class="cov-stat na"><span class="cs-num">' + s.deferred + '</span><span class="cs-lbl">deferred</span></div>';
    const rowsHtml = model.coverage.rows.map((r) => {
      const articleList = (r.articles || []).length
        ? '<details class="cov-articles"><summary>' + r.articles.length + ' article' + (r.articles.length > 1 ? 's' : '') + '</summary>' +
          '<ul>' + r.articles.map((a) =>
            '<li><a href="' + esc(a.url || '#') + '" target="_blank" rel="noopener">' + esc(a.title || a.url || 'Article') + '</a></li>'
          ).join('') + '</ul></details>'
        : '';
      return '<tr>' +
        '<td>' + esc(r.name) + '</td>' +
        '<td class="mono na">' + esc(r.type) + '</td>' +
        '<td>' + badge(r.state) + (r.note ? '<div class="sub-note">' + esc(r.note) + '</div>' : '') + articleList + '</td>' +
        '<td class="mono">' + r.seen + '</td>' +
        '</tr>';
    }).join('');
    return '<div class="cov-summary">' + statsHtml + '</div>' +
      '<div class="tbl-wrap"><table><thead><tr><th>Source</th><th>Type</th><th>Status</th><th>#</th></tr></thead>' +
      '<tbody>' + rowsHtml + '</tbody></table></div>';
  })();

  // ── Full document ────────────────────────────────────────────────────────────
  const catNavLinks = model.categories.map((c) => '<a href="#' + c.id + '">' + esc(c.label) + '</a>').join('');
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>NFL Futures Intel — ${esc(model.reportDate)}</title>
<style>
/* ── Design tokens ──────────────────────────────────────────────────────────── */
:root{--bg:#080b0f;--s1:#0f1319;--s2:#161c26;--s3:#1d2536;--bd:#232d3f;--bd2:#2e3a50;--tx:#dce5f0;--tx2:#8fa0b8;--tx3:#5a6d84;--ac:#3d82f7;--green:#22c55e;--red:#f05252;--amber:#f59e0b;--spark:#60a5fa}
/* ── Reset ──────────────────────────────────────────────────────────────────── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--tx);font:14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
a{color:var(--ac);text-decoration:none}a:hover{text-decoration:underline}
/* ── Report header ──────────────────────────────────────────────────────────── */
.rpt-header{background:linear-gradient(135deg,#0d1420 0%,#111827 100%);border-bottom:1px solid var(--bd);padding:28px 20px 20px}
.rpt-header .inner{max-width:1100px;margin:0 auto}
.rpt-title{font-size:24px;font-weight:700;letter-spacing:-.02em;margin-bottom:8px}
.rpt-meta{color:var(--tx2);font-size:12.5px;display:flex;flex-wrap:wrap;gap:6px 14px}
.meta-dot{color:var(--tx3)}
/* ── Sticky nav ─────────────────────────────────────────────────────────────── */
.toc{position:sticky;top:0;z-index:20;background:rgba(8,11,15,.93);backdrop-filter:blur(8px);border-bottom:1px solid var(--bd);padding:0 20px;overflow-x:auto;white-space:nowrap}
.toc-inner{display:flex;gap:4px;align-items:center;max-width:1100px;margin:0 auto;padding:8px 0}
.toc a{flex-shrink:0;font-size:11.5px;font-weight:500;color:var(--tx2);border:1px solid transparent;border-radius:999px;padding:4px 11px;transition:all .15s}
.toc a:hover{color:var(--tx);border-color:var(--bd2);text-decoration:none;background:var(--s2)}
.toc-sep{color:var(--tx3);padding:0 4px;flex-shrink:0;font-size:12px}
/* ── Layout ─────────────────────────────────────────────────────────────────── */
.wrap{max-width:1100px;margin:0 auto;padding:0 20px 100px}
/* ── Cards ──────────────────────────────────────────────────────────────────── */
.card{background:var(--s1);border:1px solid var(--bd);border-radius:14px;padding:20px 22px;margin:14px 0}
.card-head{display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-left:28px;position:relative}
.card-head h2{font-size:17px;font-weight:700}
.cat-head .sec-toggle,.card-head .sec-toggle{position:absolute;left:-22px;top:50%;transform:translateY(-50%);flex-shrink:0;border-radius:0 6px 6px 0;border-left:none}
/* ── Category cards ─────────────────────────────────────────────────────────── */
.cat-card{border-left:3px solid var(--ac)}
.cat-head{display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-left:28px;position:relative}
.cat-head h2{font-size:17px;font-weight:700}
.sub-head{font-size:11.5px;font-weight:600;color:var(--tx2);text-transform:uppercase;letter-spacing:.06em;margin:16px 0 6px}
.cat-note{color:var(--amber);font-size:12.5px;margin-bottom:10px;line-height:1.5}
.empty-note{color:var(--tx3);font-size:13px;font-style:italic;padding:8px 0}
/* ── Verdict ────────────────────────────────────────────────────────────────── */
.verdict{background:linear-gradient(to right,rgba(61,130,247,.1),transparent);border-left:3px solid var(--ac);border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:14px}
.verdict-label{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--ac);margin-bottom:4px}
.verdict-body{font-size:13.5px;color:var(--tx);line-height:1.7}
/* ── Tables ─────────────────────────────────────────────────────────────────── */
.tbl-wrap{overflow-x:hidden;border-radius:10px;border:1px solid var(--bd)}
table{width:100%;border-collapse:collapse;font-size:13.5px}
thead tr{background:var(--s2)}
th{text-align:left;font-size:11px;font-weight:600;color:var(--tx3);text-transform:uppercase;letter-spacing:.05em;padding:9px 12px;border-bottom:1px solid var(--bd);white-space:nowrap}
td{padding:8px 12px;border-bottom:1px solid var(--bd)}
tr:last-child td{border-bottom:none}
tr:hover td{background:rgba(255,255,255,.018)}
.tm{font-weight:600;color:var(--tx);white-space:nowrap;max-width:180px;overflow:hidden;text-overflow:ellipsis}
.mono{font-variant-numeric:tabular-nums;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.ac{color:var(--ac);font-weight:700}
.na{color:var(--tx3)}
.muted{color:var(--tx3);font-size:12px}
th.muted{opacity:.5}
.c-fav{color:var(--green)}
.c-dog{color:var(--amber)}
/* ── Best odds cell ─────────────────────────────────────────────────────────── */
.best-odds{color:var(--green);font-weight:700}
.book-tag{font-size:10px;font-weight:600;color:var(--tx3);vertical-align:middle;margin-left:3px}
/* ── Probability bar ────────────────────────────────────────────────────────── */
.pbar{display:flex;align-items:center;gap:8px;min-width:110px}
.pbar-fill{height:5px;border-radius:3px;flex-shrink:0;transition:width .3s}
.pbar-fill.hi{background:var(--green)}.pbar-fill.md{background:var(--ac)}.pbar-fill.lo{background:var(--tx3)}
.pbar span{font-size:12px;font-variant-numeric:tabular-nums;color:var(--tx2);white-space:nowrap}
/* ── Win-total line bar ─────────────────────────────────────────────────────── */
.big-line{font-size:15px;font-weight:700}
.line-bar-cell{width:70px;vertical-align:middle}
.line-bar{height:4px;background:linear-gradient(90deg,var(--ac),var(--green));border-radius:2px}
/* ── SoS cell ───────────────────────────────────────────────────────────────── */
.sos-cell{white-space:nowrap}
.sos-na{color:var(--tx3);font-size:11px}
.sos-easy{color:var(--green);font-weight:700;font-size:12px}
.sos-hard{color:var(--red);font-weight:700;font-size:12px}
/* ── Delta chip ─────────────────────────────────────────────────────────────── */
.delt{font-size:12px;font-weight:700;white-space:nowrap}
.delt.up{color:var(--green)}.delt.dn{color:var(--red)}
/* ── Collapsible table sections (details/summary) ───────────────────────────── */
.tbl-expand{border-top:1px solid var(--bd)}
.tbl-expand summary{font-size:12px;color:var(--ac);padding:9px 14px;cursor:pointer;user-select:none;list-style:none;background:var(--s2)}
.tbl-expand summary:hover{background:var(--s3)}
.tbl-expand summary::marker,.tbl-expand summary::-webkit-details-marker{display:none}
.tbl-expand summary::before{content:"▶  "}
.tbl-expand[open] summary::before{content:"▼  "}
/* ── Book chips (mover cards + value spots) ─────────────────────────────────── */
.book-chip{display:inline-flex;align-items:center;gap:4px;font-size:11px;background:var(--s3);border:1px solid var(--bd);border-radius:6px;padding:2px 7px;margin:2px 2px 2px 0}
.book-chip.na{color:var(--tx3)}
.book-chip b{font-variant-numeric:tabular-nums}
/* ── Mover cards ────────────────────────────────────────────────────────────── */
.mover-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:10px}
.mover-card{background:var(--s2);border:1px solid var(--bd);border-radius:10px;padding:14px 16px}
.mover-card.up{border-top:2px solid var(--green)}.mover-card.dn{border-top:2px solid var(--red)}
.mc-delta{font-size:22px;font-weight:800;margin-bottom:4px}
.mover-card.up .mc-delta{color:var(--green)}.mover-card.dn .mc-delta{color:var(--red)}
.mc-team{font-size:14px;font-weight:700;margin-bottom:2px}
.mc-market{font-size:12px;color:var(--tx2);margin-bottom:5px}
.mc-spark{margin:6px 0 4px;line-height:0}
.mc-odds-section{margin:8px 0;display:flex;flex-direction:column;gap:5px}
.mc-odds-row{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.mc-odds-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--tx3);width:28px;flex-shrink:0}
.mc-meta{font-size:11px;color:var(--tx3);font-variant-numeric:tabular-nums;margin-top:4px}
/* ── Sparkline SVG (table) ─────────────────────────────────────────────────── */
.spark{line-height:0}
/* ── Value spot filters ─────────────────────────────────────────────────────── */
.spots-filters{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.spot-filter{background:var(--s2);border:1px solid var(--bd);border-radius:20px;color:var(--tx2);font-size:12px;font-weight:600;cursor:pointer;padding:4px 12px;transition:all .15s}
.spot-filter:hover{background:var(--s3);color:var(--tx)}
.spot-filter.active{background:var(--ac);border-color:var(--ac);color:#fff}
.sfc{font-weight:400;opacity:.8;margin-left:3px}
/* ── Value spot cards ───────────────────────────────────────────────────────── */
.spots-list{display:flex;flex-direction:column;gap:6px}
.spot-card{background:var(--s2);border:1px solid var(--bd);border-radius:10px;overflow:hidden}
.spot-card.sharp{border-left:3px solid var(--green)}.spot-card.overbet{border-left:3px solid var(--red)}.spot-card.spread{border-left:3px solid var(--ac)}
/* card header row */
.spot-card-head{display:flex;align-items:center;gap:10px;padding:11px 14px;cursor:pointer;user-select:none}
.spot-card-head:hover{background:var(--s3)}
.spot-toggle{background:none;border:none;color:var(--tx3);font-size:11px;cursor:pointer;padding:0;flex-shrink:0;width:16px;text-align:center;transition:transform .15s}
.spot-card.open>.spot-card-head>.spot-toggle{transform:rotate(90deg)}
.spot-card-meta{display:flex;align-items:center;gap:8px;flex:1;min-width:0}
.spot-cat-tags{display:flex;gap:4px;flex-wrap:wrap}
.spot-cat-tag{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;padding:2px 7px;border-radius:10px;background:var(--s3);color:var(--tx2)}
.spot-cat-tag.superbowl{color:var(--amber);background:rgba(245,158,11,.12)}
.spot-cat-tag.conference{color:#a78bfa;background:rgba(167,139,250,.12)}
.spot-cat-tag.division{color:var(--ac);background:rgba(59,130,246,.12)}
.spot-cat-tag.wins{color:var(--green);background:rgba(34,197,94,.10)}
.spot-cat-tag.playoffs{color:var(--tx2);background:var(--s3)}
.spot-card-count{font-size:11px;color:var(--tx3);white-space:nowrap;flex-shrink:0}
/* card body (collapsible) */
.spot-card-body{padding:10px 14px 14px 40px;border-top:1px solid var(--bd)}
.spot-card.spread .spot-label{color:var(--ac)}
/* wins O/U table */
.spot-card.wins-ou{border-left:3px solid var(--green)}
.wou-tbl{width:100%;border-collapse:collapse;font-size:12.5px;margin:8px 0 6px}
.wou-tbl th{color:var(--tx3);font-weight:600;font-size:11px;text-transform:uppercase;padding:3px 8px;text-align:right;border-bottom:1px solid var(--bd)}
.wou-tbl th:first-child{text-align:left}
.wou-tbl td{padding:5px 8px;text-align:right;font-weight:600;border-bottom:1px solid var(--bd)}
.wou-tbl td:first-child{text-align:left}
.wou-side{color:var(--tx2);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.wou-best{color:var(--green) !important;background:rgba(34,197,94,.10);border-radius:4px}
.wou-line-note{font-size:11px;color:var(--amber);margin-bottom:6px}
/* expert signals in value spots */
.spot-experts{margin-top:10px;border-top:1px solid var(--bd);padding-top:8px}
.spot-experts-lbl{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--tx3);margin-bottom:5px}
.sig-list{margin:0;padding-left:14px;display:flex;flex-direction:column;gap:3px}
.sig-list li{font-size:12px;color:var(--tx2);line-height:1.5}
.sig-source{font-weight:700;color:var(--tx)}
.sig-outlet{font-weight:400;color:var(--tx3)}
.sig-rationale{color:var(--tx3)}
.spread-mkts{display:flex;flex-direction:column;margin:8px 0 10px}
.spread-mkt-row{display:flex;align-items:baseline;gap:8px;padding:6px 0;border-bottom:1px solid var(--bd)}
.spread-mkt-row:last-child{border-bottom:none}
.spread-mkt-name{flex:1;font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--tx3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.spread-mkt-action{color:var(--green);font-size:14px;font-weight:700;white-space:nowrap;flex-shrink:0}
.spread-mkt-ctx{font-size:11px;color:var(--amber);white-space:nowrap;flex-shrink:0}
.spot-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.spot-card.sharp .spot-label{color:var(--green)}.spot-card.overbet .spot-label{color:var(--red)}
.spot-team{font-size:15px;font-weight:700;margin-bottom:2px}
.spot-market{font-size:12px;color:var(--tx2);margin-bottom:10px}
.spot-nums{display:flex;align-items:center;justify-content:space-between;font-size:12.5px;margin-bottom:8px}
.spot-gap{font-size:14px;font-weight:800}
.spot-card.sharp .spot-gap{color:var(--green)}.spot-card.overbet .spot-gap{color:var(--red)}
.spot-explain{font-size:12px;color:var(--tx2);line-height:1.5;margin:7px 0 9px}
.spot-chips{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-top:5px}
.spot-chips-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--tx3);width:30px;flex-shrink:0}
.spot-sources{border-top:1px solid var(--bd);display:flex;flex-direction:column;gap:4px;margin-top:9px;padding-top:8px}
.spot-sources span{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--tx3)}
.spot-sources a{font-size:11.5px;line-height:1.4}
.spot-sources em{font-size:11.5px;color:var(--tx3);font-style:normal;line-height:1.4}
/* ── Expert signals ─────────────────────────────────────────────────────────── */
.expert-card{background:var(--s2);border:1px solid var(--bd);border-radius:10px;padding:14px 16px;margin-bottom:10px}
.expert-head{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:10px}
.expert-name{font-size:14px;font-weight:700}
.expert-counts{font-size:11.5px;color:var(--tx3)}
.expert-list{list-style:none;display:flex;flex-direction:column;gap:12px}
.expert-list li{font-size:13px}
.lean{display:inline-block;font-size:11px;font-weight:700;color:var(--ac);background:rgba(61,130,247,.12);border-radius:4px;padding:1px 6px;margin-right:5px}
.conf{font-size:11px;color:var(--tx3);margin-left:4px}
.sub-note{font-size:12px;color:var(--tx3);margin-top:4px;padding-left:4px}
.signal-summary{font-size:13px;color:var(--tx2);line-height:1.65;border-left:2px solid var(--bd2);padding:6px 12px;margin:8px 0;font-style:italic}
.signal-src{font-size:12px;margin-top:4px}
.tweet-item{color:var(--tx2)}
/* ── Coverage audit ─────────────────────────────────────────────────────────── */
.cov-summary{display:flex;gap:24px;flex-wrap:wrap;margin-bottom:18px}
.cov-stat{display:flex;flex-direction:column;align-items:center;gap:2px}
.cs-num{font-size:30px;font-weight:800;line-height:1}
.cs-lbl{font-size:10.5px;color:var(--tx3);text-transform:uppercase;letter-spacing:.05em}
.cov-stat.up .cs-num{color:var(--green)}.cov-stat.warn .cs-num{color:var(--amber)}.cov-stat.na .cs-num{color:var(--tx3)}
.cov-articles{margin-top:6px}
.cov-articles summary{font-size:11.5px;color:var(--ac);cursor:pointer;user-select:none;list-style:none}
.cov-articles summary::marker,.cov-articles summary::-webkit-details-marker{display:none}
.cov-articles summary::before{content:"▶ "}
.cov-articles[open] summary::before{content:"▼ "}
.cov-articles ul{list-style:none;margin-top:6px;display:flex;flex-direction:column;gap:4px}
.cov-articles li{font-size:12px}
/* ── Badges ─────────────────────────────────────────────────────────────────── */
.b{display:inline-block;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:999px}
.b-ok{background:rgba(34,197,94,.15);color:var(--green)}
.b-warn{background:rgba(245,158,11,.15);color:var(--amber)}
.b-info{background:rgba(61,130,247,.15);color:var(--ac)}
.b-mute{background:rgba(90,109,132,.15);color:var(--tx3)}
/* ── Empty states ───────────────────────────────────────────────────────────── */
.empty-state{padding:32px 20px;text-align:center}
.es-icon{font-size:36px;margin-bottom:10px;opacity:.45}
.es-head{font-size:15px;font-weight:600;color:var(--tx2);margin-bottom:6px}
.es-sub{font-size:13px;color:var(--tx3);max-width:500px;margin:0 auto;line-height:1.6}
/* ── Footer ─────────────────────────────────────────────────────────────────── */
footer{color:var(--tx3);font-size:12px;border-top:1px solid var(--bd);margin-top:32px;padding-top:16px;line-height:1.8}
/* ── Collapsible sections ────────────────────────────────────────────────────── */
.sec-toggle{background:none;border:1px solid var(--bd);border-radius:6px;color:var(--tx2);font-size:11px;cursor:pointer;padding:3px 9px;transition:all .15s;flex-shrink:0}
.sec-toggle:hover{background:var(--s3);color:var(--tx)}
.sec-body{transition:none}
/* ── CSS Tooltips ────────────────────────────────────────────────────────────── */
.th-tip{position:relative;cursor:help}
.th-tip::after{content:attr(data-tip);position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:#1a2234;color:var(--tx);font-size:12px;font-weight:400;white-space:normal;width:220px;text-align:center;padding:7px 11px;border-radius:8px;border:1px solid var(--bd2);z-index:200;opacity:0;pointer-events:none;transition:opacity .12s;line-height:1.55;text-transform:none;letter-spacing:0;box-shadow:0 4px 20px rgba(0,0,0,.45)}
th .th-tip::after{left:0;transform:none}
.th-tip:hover::after{opacity:1}
/* ── Book grid (mover cards) ─────────────────────────────────────────────────── */
.mc-book-grid{margin:8px 0;border:1px solid var(--bd);border-radius:8px;overflow:hidden;font-size:12px}
.mc-bg-hdr{display:grid;grid-template-columns:34px repeat(3,1fr);background:var(--s3);padding:4px 8px;gap:2px}
.mc-bg-hdr span{font-size:9.5px;font-weight:700;color:var(--tx3);text-align:center;text-transform:uppercase;letter-spacing:.05em}
.mc-bg-hdr span:first-child{text-align:left;color:transparent}
.mc-bg-row{display:grid;grid-template-columns:34px repeat(3,1fr);padding:5px 8px;gap:2px;border-top:1px solid var(--bd);align-items:center}
.mc-bg-row .lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--tx3)}
.mc-bg-row .cv{text-align:center;font-variant-numeric:tabular-nums}
.mc-bg-row .na{text-align:center;color:var(--tx3)}
/* ── Best price halo ─────────────────────────────────────────────────────────── */
.best-price{color:var(--green) !important;font-weight:800;background:rgba(34,197,94,.12);border-radius:5px;padding:1px 6px;box-shadow:0 0 0 1.5px rgba(34,197,94,.45)}
/* ── Mover card meta ─────────────────────────────────────────────────────────── */
.mc-meta-row{font-size:11px;color:var(--tx3);margin-top:5px;line-height:1.6;font-variant-numeric:tabular-nums}
.mc-meta-lbl{font-weight:700;color:var(--tx3);margin-right:3px}
/* ── Row discrepancy highlight ───────────────────────────────────────────────── */
.row-disc{background:rgba(245,158,11,.04) !important}
.row-disc .tm::after{content:" ⚠";font-size:10px;color:var(--amber)}
.disc-hi{color:var(--amber) !important;font-weight:700}
.disc-hi-max{color:var(--green) !important;font-weight:700;background:rgba(34,197,94,.10);border-radius:4px;padding:1px 4px}
.disc-hi-min{color:var(--amber) !important;font-weight:700;background:rgba(245,158,11,.14);border-radius:4px;padding:1px 4px}
/* ── Zero-delta orange ───────────────────────────────────────────────────────── */
.delt.zero{color:var(--amber)}
/* ── Row truncation (show-more) ──────────────────────────────────────────────── */
.hidden-row{display:none !important}
.show-more-btn{display:block;margin:6px auto 2px;background:none;border:1px solid var(--bd2);border-radius:6px;color:var(--tx3);font-size:11.5px;padding:4px 14px;cursor:pointer;transition:all .15s}
.show-more-btn:hover{border-color:var(--ac);color:var(--ac)}
/* ── Team chip filter ────────────────────────────────────────────────────────── */
.mf-chips{display:flex;flex-wrap:wrap;gap:5px;flex:1}
.mf-chip{background:var(--s3);border:1px solid var(--bd2);border-radius:20px;color:var(--tx2);font-size:11px;padding:3px 10px;cursor:pointer;transition:all .15s;white-space:nowrap}
.mf-chip:hover{border-color:var(--bd2);color:var(--tx)}
.mf-chip.active{background:var(--ac);border-color:var(--ac);color:#fff;font-weight:700}
/* ── Prob bar — linear 0-100% scale, capped width ───────────────────────────── */
.pbar{min-width:70px;max-width:100px}
/* ── Sortable table ──────────────────────────────────────────────────────────── */
th.sort-col{cursor:pointer;user-select:none;white-space:nowrap}
th.sort-col:hover{color:var(--tx);background:var(--s3)}
th.sort-col .si{font-size:9px;color:var(--tx3);margin-left:3px}
th.sort-col.asc .si::after{content:"↑";color:var(--ac)}
th.sort-col.desc .si::after{content:"↓";color:var(--ac)}
th.sort-col:not(.asc):not(.desc) .si::after{content:"↕"}
/* ── Matchup filter ──────────────────────────────────────────────────────────── */
.matchup-filter{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:14px;padding:10px 14px;background:var(--s2);border-radius:8px;border:1px solid var(--bd)}
.mf-lbl{font-size:11px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.05em;flex-shrink:0}
.mf-input{flex:1;min-width:160px;background:var(--s3);border:1px solid var(--bd2);border-radius:6px;color:var(--tx);font-size:13px;padding:5px 10px;outline:none}
.mf-input:focus{border-color:var(--ac)}
.mf-count{font-size:11.5px;color:var(--tx3)}
.mf-clear{background:none;border:1px solid var(--bd);border-radius:6px;color:var(--tx3);font-size:12px;padding:4px 10px;cursor:pointer;transition:all .15s}
.mf-clear:hover{border-color:var(--bd2);color:var(--tx)}
/* ── Playoff division headers ────────────────────────────────────────────────── */
.div-head{font-size:12px;font-weight:700;color:var(--tx2);text-transform:uppercase;letter-spacing:.06em;margin:18px 0 7px;padding-bottom:5px;border-bottom:1px solid var(--bd)}
/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media(max-width:680px){
  .mover-grid{grid-template-columns:repeat(2,1fr)}
  .spots-grid{grid-template-columns:1fr}
  .rpt-meta{gap:6px 10px}
}
</style></head><body>

<header class="rpt-header">
  <div class="inner">
    <div class="rpt-title">🏈 NFL Futures Intel Report</div>
    <div class="rpt-meta">
      <span>${esc(model.reportDate)}</span>
      <span class="meta-dot">·</span>
      <span>Season ${model.season}</span>
      <span class="meta-dot">·</span>
      <span>${model.categories.filter((c) => c.present).length}/${model.categories.length} categories live</span>
      <span class="meta-dot">·</span>
      <span>${model.meta.snapshots.toLocaleString()} odds rows</span>
      <span class="meta-dot">·</span>
      <span>narrative: ${esc(model.engine.narrative)}</span>
      <span class="meta-dot">·</span>
      <span>trigger: ${esc(model.trigger)}</span>
    </div>
  </div>
</header>

<nav class="toc"><div class="toc-inner">
  <a href="#movement">📈 Movement</a>
  <a href="#value">🎯 Value</a>
  <span class="toc-sep">|</span>
  ${catNavLinks}
  <span class="toc-sep">|</span>
  <a href="#experts">🗣️ Experts</a>
  <a href="#coverage">📋 Coverage</a>
</div></nav>

<div class="wrap">

<section id="movement" class="card">
  <div class="card-head"><button class="sec-toggle" title="Collapse section">▼</button><h2>📈 Line Movement</h2><span style="font-size:13px;color:var(--tx2)">since opening snapshot · BOL/BKR/BTU</span></div>
  <div class="sec-body">${movementHtml}</div>
</section>

<section id="value" class="card">
  <div class="card-head"><button class="sec-toggle" title="Collapse section">▼</button><h2>🎯 Value Spots</h2><span style="font-size:13px;color:var(--tx2)">sharp / public ≥ ${Math.round(DIVERGENCE_THRESHOLD * 100)}pp</span></div>
  <div class="sec-body">${valueHtml}</div>
</section>

${model.categories.map(catSection).join('')}

<section id="experts" class="card">
  <div class="card-head"><button class="sec-toggle" title="Collapse section">▼</button><h2>🗣️ Expert Signals</h2></div>
  <div class="sec-body">${expertHtml}</div>
</section>

<section id="coverage" class="card">
  <div class="card-head"><button class="sec-toggle" title="Collapse section">▼</button><h2>📋 Coverage Audit</h2></div>
  <div class="sec-body">${coverageHtml}</div>
</section>

</div>
<footer style="max-width:1100px;margin:0 auto;padding:16px 20px 40px">
  Generated ${esc(model.generatedAt)} · Sharp books: BetOnline (BOL) · Bookmaker (BKR) · BetUS (BTU) · Public ref: DraftKings · FanDuel · narrative: ${esc(model.engine.narrative)} · Not betting advice.
</footer>
<script>
// ── Event delegation (covers sec-toggle, show-more-btn, mf-chip) ──────────────
document.addEventListener('click', function(e) {
  // Collapsible section toggle
  var btn = e.target.closest('.sec-toggle');
  if (btn) {
    var container = btn.closest('section') || btn.closest('.card');
    var body = container && container.querySelector('.sec-body');
    if (body) {
      var collapsed = body.style.display === 'none';
      body.style.display = collapsed ? '' : 'none';
      btn.textContent = collapsed ? '▼' : '▶';
      btn.title = collapsed ? 'Collapse section' : 'Expand section';
    }
    return;
  }
  // Show more rows
  var smBtn = e.target.closest('.show-more-btn');
  if (smBtn) {
    var wrap = smBtn.closest('.tbl-wrap');
    if (wrap) wrap.querySelectorAll('.hidden-row').forEach(function(r) { r.classList.remove('hidden-row'); });
    smBtn.remove();
    return;
  }
  // Value spot card toggle
  var stBtn = e.target.closest('.spot-toggle') || (e.target.closest('.spot-card-head') ? e.target.closest('.spot-card-head').querySelector('.spot-toggle') : null);
  if (e.target.closest('.spot-card-head') && !e.target.closest('.spot-filter')) {
    var card = e.target.closest('.spot-card');
    if (card) {
      var body = card.querySelector('.spot-card-body');
      var tog  = card.querySelector('.spot-toggle');
      if (body) {
        var open = body.style.display !== 'none';
        body.style.display = open ? 'none' : '';
        card.classList.toggle('open', !open);
        if (tog) { tog.textContent = open ? '▶' : '▼'; tog.title = open ? 'Expand' : 'Collapse'; }
      }
      return;
    }
  }
  // Value spot market filter
  var sfBtn = e.target.closest('.spot-filter');
  if (sfBtn) {
    document.querySelectorAll('.spot-filter').forEach(function(b) { b.classList.remove('active'); });
    sfBtn.classList.add('active');
    var filter = sfBtn.dataset.filter;
    document.querySelectorAll('#spots-list .spot-card').forEach(function(card) {
      var cats = (card.dataset.cats || '').split(' ');
      card.style.display = (filter === 'all' || cats.includes(filter)) ? '' : 'none';
    });
    return;
  }
  // Team chip toggle
  var chip = e.target.closest('.mf-chip');
  if (chip) {
    chip.classList.toggle('active');
    applyMatchupFilter();
    return;
  }
});

// ── Matchup team chip filter ──────────────────────────────────────────────────
function applyMatchupFilter() {
  var chips = document.querySelectorAll('.mf-chip.active');
  var count = document.getElementById('mf-count');
  var tbl = document.getElementById('matchup-tbl');
  if (!tbl) return;
  var activeTeams = Array.from(chips).map(function(c) { return c.dataset.team; });
  var visible = 0;
  tbl.querySelectorAll('tbody tr').forEach(function(row) {
    var team = (row.dataset.team || '').toLowerCase();
    var show = activeTeams.length === 0 || activeTeams.some(function(t) { return team.includes(t); });
    row.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  if (count) count.textContent = visible + ' matchup' + (visible !== 1 ? 's' : '');
}

// ── Sortable movement table ───────────────────────────────────────────────────
function sortMoverTbl(th, colIdx) {
  var tbl = document.getElementById('mover-rest-tbl');
  if (!tbl) return;
  var tbody = tbl.querySelector('tbody');
  var rows = Array.from(tbody.querySelectorAll('tr'));
  var asc = !th.classList.contains('asc');
  tbl.querySelectorAll('th.sort-col').forEach(function(h) { h.classList.remove('asc', 'desc'); });
  th.classList.add(asc ? 'asc' : 'desc');
  rows.sort(function(a, b) {
    var av = colIdx === 4 ? parseFloat(a.dataset.delta || 0) : (a.cells[colIdx] ? a.cells[colIdx].textContent.trim() : '');
    var bv = colIdx === 4 ? parseFloat(b.dataset.delta || 0) : (b.cells[colIdx] ? b.cells[colIdx].textContent.trim() : '');
    if (colIdx === 4) return asc ? av - bv : bv - av;
    return asc ? av.localeCompare(bv) : bv.localeCompare(av);
  });
  rows.forEach(function(r) { tbody.appendChild(r); });
}
</script>
</body></html>`;
}

// ── Sample data (offline review) ─────────────────────────────────────────────
function sampleSnapshots() {
  const now = new Date();
  const old = new Date(Date.now() - 6 * 864e5);
  const mk = (market, team, book, odds, when) => ({ market_type: market, team, book, odds, implied_prob: null, captured_at: when.toISOString(), snapshot_time: when.toISOString(), season: SEASON });
  const rows = [];
  const sb = [['Kansas City Chiefs', 600, 560], ['Buffalo Bills', 700, 720], ['Philadelphia Eagles', 800, 750], ['San Francisco 49ers', 850, 900], ['Baltimore Ravens', 900, 880], ['Detroit Lions', 1000, 950], ['Cincinnati Bengals', 1400, 1500], ['Houston Texans', 1600, 1550]];
  for (const [team, oNow, oOld] of sb) for (const bk of ['draftkings', 'fanduel', 'betonline', 'bookmaker']) {
    rows.push(mk('superbowl', team, bk, oNow + (bk === 'betonline' ? -40 : bk === 'fanduel' ? 30 : 0), now));
    rows.push(mk('superbowl', team, bk, oOld, old));
  }
  for (const [team, o] of [['Kansas City Chiefs', -135], ['Baltimore Ravens', 260], ['Buffalo Bills', 280], ['Houston Texans', 380]]) for (const bk of ['draftkings', 'fanduel', 'betonline', 'bookmaker']) rows.push(mk('conference_afc', team, bk, o, now));
  for (const [team, o] of [['Philadelphia Eagles', 240], ['San Francisco 49ers', 260], ['Detroit Lions', 300], ['Dallas Cowboys', 550]]) for (const bk of ['draftkings', 'fanduel', 'betonline', 'bookmaker']) rows.push(mk('conference_nfc', team, bk, o, now));
  for (const [team, o] of [['Kansas City Chiefs', -200], ['Los Angeles Chargers', 350], ['Denver Broncos', 650], ['Las Vegas Raiders', 750]]) for (const bk of ['draftkings', 'fanduel', 'betonline', 'bookmaker']) rows.push(mk('division_afc_west', team, bk, o, now));
  for (const [team, o] of [['Detroit Lions', -120], ['Green Bay Packers', 200], ['Minnesota Vikings', 450], ['Chicago Bears', 700]]) for (const bk of ['draftkings', 'fanduel', 'betonline', 'bookmaker']) rows.push(mk('division_nfc_north', team, bk, o, now));
  for (const [team, o] of [['Kansas City Chiefs', -240], ['Buffalo Bills', -200], ['Philadelphia Eagles', -180], ['Cleveland Browns', 180], ['New England Patriots', 220]]) for (const bk of ['draftkings', 'fanduel', 'betonline', 'bookmaker']) rows.push(mk('playoffs', team, bk, o, now));
  // Win totals (line-based): [team, lineNow, over, under, lineOld]
  const wins = [
    ['Kansas City Chiefs', 11.5, -120, 100, 11.5], ['Detroit Lions', 11.5, 105, -125, 11.0],
    ['Baltimore Ravens', 11.5, -110, -110, 11.5], ['Buffalo Bills', 11.5, -115, -105, 11.5],
    ['Philadelphia Eagles', 11.5, 100, -120, 11.0], ['San Francisco 49ers', 10.5, -130, 110, 11.0],
    ['Carolina Panthers', 6.5, -115, -105, 6.5], ['New England Patriots', 7.5, 110, -130, 7.0],
  ];
  for (const [team, line, over, under, lineOld] of wins) for (const bk of ['betonline', 'bookmaker']) {
    const adj = bk === 'bookmaker' ? -0.0 : 0;
    rows.push({ market_type: 'wins', team, book: bk, odds: over, implied_prob: null, line: line + adj, over_price: over, under_price: under, captured_at: now.toISOString(), snapshot_time: now.toISOString(), season: SEASON });
    rows.push({ market_type: 'wins', team, book: bk, odds: over, implied_prob: null, line: lineOld, over_price: over, under_price: under, captured_at: old.toISOString(), snapshot_time: old.toISOString(), season: SEASON });
  }
  return rows;
}
function sampleIntel() {
  const notes = [
    { id: 1, source: 'Action Network', title: 'NFL Win Totals: Best bets and early value', summary: 'Lions over 11.5 wins is the early futures play; Bears under getting steam.', url: 'https://actionnetwork.com/nfl/win-totals', published_at: nowIso(), confidence: 0.74 },
    { id: 2, source: 'Sharp Football', title: 'Super Bowl odds and schedule-adjusted projections', summary: 'Ravens are underpriced title contender per situational schedule analysis.', url: 'https://sharpfootballanalysis.com/sb', published_at: nowIso(), confidence: 0.69 },
    { id: 3, source: 'VSiN', title: 'Sharp money on AFC futures', summary: 'Texans division odds shortening on early sharp action.', url: 'https://vsin.com/afc', published_at: nowIso(), confidence: 0.71 },
  ];
  const signals = [
    { note_id: 1, source: 'Action Network', team_or_market: 'Detroit Lions', bet_type: 'win_total', lean: 'over 11.5', rationale: 'Top-5 offense returns intact; soft early schedule.', confidence: 0.7 },
    { note_id: 1, source: 'Action Network', team_or_market: 'Chicago Bears', bet_type: 'win_total', lean: 'under 8.5', rationale: 'Brutal NFC North slate.', confidence: 0.6 },
    { note_id: 2, source: 'Sharp Football', team_or_market: 'Baltimore Ravens', bet_type: 'superbowl', lean: 'back +900', rationale: 'Underpriced vs schedule-adjusted SOS.', confidence: 0.66 },
    { note_id: 3, source: 'VSiN', team_or_market: 'Houston Texans', bet_type: 'division', lean: 'AFC South', rationale: 'Sharp money in early.', confidence: 0.68 },
  ];
  const tweets = [
    { author_handle: 'ActionNetworkHQ', author_tier: 'sharp', text: 'Early sharp futures: Ravens Super Bowl +900 hit limits at multiple shops. Win total overs on DET, HOU.', tweet_url: 'https://x.com/a/1', published_at: nowIso() },
  ];
  return { notes, signals, tweets };
}

// ── Persistence ──────────────────────────────────────────────────────────────
function sanitize(s) { return String(s).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').replace(/[\uD800-\uDFFF]/g, ''); } // eslint-disable-line no-control-regex

async function writeVault(sb, md, reportDate) {
  for (const p of [`NFL/Futures/FuturesIntel-${reportDate}.md`, 'NFL/Futures/FuturesIntel-Latest.md']) {
    const { error } = await sb.from('vault_notes').upsert(
      { path: p, content: sanitize(md), tags: ['futures', 'intel', 'auto-report', 'v2'], source: 'agent' }, { onConflict: 'path' });
    if (error) throw new Error(`vault ${p}: ${error.message}`);
    console.log(`  [OK] vault → ${p}`);
  }
}
async function writeReport(sb, model, md, html) {
  const { error } = await sb.from('futures_reports').insert({
    season: model.season, report_date: model.reportDate, trigger: model.trigger,
    markdown: sanitize(md), html: sanitize(html),
    model: { categories: model.categories, narratives: model.narratives },
    coverage: model.coverage, meta: model.meta,
  });
  if (error) throw new Error(`futures_reports: ${error.message}`);
  console.log('  [OK] futures_reports row inserted');
}
async function writeArtifacts(md, html, reportDate) {
  await mkdir(REPORTS_DIR, { recursive: true });
  const h = path.join(REPORTS_DIR, `FuturesIntel-${reportDate}.html`);
  const m = path.join(REPORTS_DIR, `FuturesIntel-${reportDate}.md`);
  await writeFile(h, html, 'utf8'); await writeFile(m, md, 'utf8');
  return { h, m };
}
async function writeReceipt(r) {
  await mkdir(RECEIPTS_DIR, { recursive: true });
  const p = path.join(RECEIPTS_DIR, `futures-intel-v2-${nowIso().replace(/[:.]/g, '-')}.json`);
  await writeFile(p, JSON.stringify(r, null, 2) + '\n', 'utf8');
  return p;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const t0 = Date.now();
  const reportDate = dateStr();
  console.log(`🏈 FuturesIntelReport v2 — ${reportDate} | season ${SEASON} | trigger ${TRIGGER} | sample=${SAMPLE} dry=${DRY_RUN}`);

  let snapshots, notes, signals, tweets, counts;
  let enrichData = { atsSummary: {}, schedule: SCHEDULE_GAMES };
  if (SAMPLE) {
    snapshots = sampleSnapshots();
    const s = sampleIntel(); notes = s.notes; signals = s.signals; tweets = s.tweets;
    counts = { rss_article: { 'Action Network': 5, 'Sharp Football': 3, 'VSiN': 2, 'PFF': 4, 'ESPN NFL': 6 }, podcast: { 'Sharp or Square': 1, 'Even Money': 1 }, tweet: { 'Sharp X / Twitter (manual paste)': 1 } };
  } else {
    const sb = getSupabase();
    const [_snaps, _notes, _tweets, _counts, _ats] = await Promise.all([
      fetchSnapshots(sb), fetchIntelNotes(sb), fetchSharpTweets(sb), fetchCoverageCounts(sb),
      fetchAtsAndSchedule(sb),
    ]);
    snapshots = _snaps; notes = _notes; tweets = _tweets; counts = _counts;
    enrichData = { atsSummary: _ats.atsSummary, schedule: SCHEDULE_GAMES };
    signals = await fetchPickSignals(sb, notes.map((n) => n.id));
  }

  const grouped = groupSeries(snapshots);

  // ── DIAGNOSTIC (temp — remove after BTU/movers root-cause found) ─────────────
  {
    const _bRows = snapshots.filter(r => r.book === 'betus');
    console.log(`[diag] total rows=${snapshots.length} | betus rows=${_bRows.length}`);
    if (_bRows.length) {
      console.log(`[diag] betus markets: ${[...new Set(_bRows.map(r => r.market_type))].join(', ')}`);
      const _ex = _bRows[0];
      console.log(`[diag] betus[0]: market=${_ex.market_type} team=${_ex.team} odds=${_ex.odds} implied_prob=${_ex.implied_prob} season=${_ex.season}`);
      const _bb = grouped.get(_ex.market_type)?.get(_ex.team);
      const _arr = _bb?.get('betus');
      console.log(`[diag] grouped betus slot: ${_arr ? `found, len=${_arr.length}, odds=${_arr[0]?.odds}` : 'MISSING'}`);
      if (_arr?.length) {
        const _cons = consensusOf(_bb, arr => arr[arr.length - 1]);
        console.log(`[diag] consensusOf result: ${JSON.stringify(_cons)}`);
      }
    } else {
      console.log(`[diag] all book keys: ${[...new Set(snapshots.map(r => r.book))].join(', ')}`);
    }
    // Movement diagnostic: log deltas for all team/market combos with 2+ snapshots
    const _moves = [];
    for (const [mt, mm] of grouped.entries()) {
      if (mt === 'wins') continue;
      for (const [team, bb] of mm.entries()) {
        for (const [book, arr] of bb.entries()) {
          if (arr.length >= 2) {
            const a = seriesProb(arr[0]), b = seriesProb(arr[arr.length - 1]);
            _moves.push(`${mt}/${team}/${book}: ${arr.length} snaps, delta=${((b-a)*100).toFixed(2)}pp`);
          }
        }
      }
    }
    console.log(`[diag] series with 2+ snapshots (${_moves.length}):`, _moves.slice(0, 15).join(' | ') || 'NONE');
  }
  // ── END DIAGNOSTIC ────────────────────────────────────────────────────────────

  const categories = buildCategoryModel(grouped);
  enrichWinTotals(categories, enrichData);
  const movers = buildMovers(grouped);
  console.log(`[diag2] movers: ${movers.length} | top 3: ${movers.slice(0,3).map(m=>`${m.market}/${m.team} delta=${(m.delta*100).toFixed(2)}pp`).join(', ') || 'NONE'}`);
  const expertGroups = buildExpertGroups(signals, notes, tweets);
  const valueSpots = buildValueSpots(grouped, notes, signals);
  console.log(`[diag2] valueSpots: ${valueSpots.length}`);
  const coverage = buildCoverageAudit(counts, notes);
  const narratives = buildNarratives(categories, expertGroups, movers, valueSpots);

  const model = {
    season: SEASON, reportDate, generatedAt: nowIso(), trigger: TRIGGER,
    engine: { narrative: 'deterministic' },
    categories, movers, valueSpots, expertGroups, coverage, narratives,
    meta: { signal_days: SIGNAL_DAYS, intel_days: INTEL_DAYS, snapshots: snapshots.length,
      markets_with_data: grouped.size, intel_notes: notes.length, pick_signals: signals.length,
      sharp_tweets: tweets.length, sample: SAMPLE },
  };

  const md = renderMarkdown(model);
  const html = renderHtml(model);
  console.log(`📝 Built — ${categories.filter((c) => c.present).length}/${categories.length} categories present · ${expertGroups.length} sources · md ${md.length}c html ${html.length}c`);

  const arts = await writeArtifacts(md, html, reportDate);
  console.log(`💾 Artifacts → ${path.relative(ROOT, arts.h)} , ${path.relative(ROOT, arts.m)}`);

  if (!SAMPLE && !DRY_RUN) {
    const sb = getSupabase();
    await writeReport(sb, model, md, html);
    await writeVault(sb, md, reportDate);
  } else {
    console.log(`[${SAMPLE ? 'SAMPLE' : 'DRY-RUN'}] Skipping Supabase writes.`);
  }

  const rcpt = await writeReceipt({ run_at: nowIso(), reportDate, trigger: TRIGGER, sample: SAMPLE, dry_run: DRY_RUN, ...model.meta, elapsed_s: (Date.now() - t0) / 1000 });
  console.log(`✅ Done in ${((Date.now() - t0) / 1000).toFixed(1)}s · receipt ${path.basename(rcpt)}`);
}

main().catch((e) => { console.error('[futures-intel-report-v2] Fatal:', e.message); process.exit(1); });
