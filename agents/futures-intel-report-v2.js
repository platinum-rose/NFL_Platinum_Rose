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
//   ANTHROPIC_API_KEY                         (optional — enables narrative layer)
//   FUTURES_NARRATIVE_MODEL                   (default claude-sonnet-4-6)
//   REPORT_LOOKBACK_DAYS  (default 7)   INTEL_LOOKBACK_DAYS (default 30)
// ═══════════════════════════════════════════════════════════════════════════════

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT         = path.resolve(__dirname, '..');
const RECEIPTS_DIR = path.join(ROOT, '.nfl', 'receipts');
const REPORTS_DIR  = path.join(ROOT, '.nfl', 'reports');

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
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const NARRATIVE_MODEL = process.env.FUTURES_NARRATIVE_MODEL || 'claude-sonnet-4-6';

const SIGNAL_DAYS = Number(process.env.REPORT_LOOKBACK_DAYS ?? 7);   // intel/tweets/signals recency
const INTEL_DAYS  = Number(process.env.INTEL_LOOKBACK_DAYS ?? 30);   // articles recency
// Odds history: futures move over weeks/months and are captured sporadically (manual exports +
// daily API). Analyze the FULL season's snapshot_time series, not a fixed recency bucket.
// ODDS_SINCE optionally floors the series at an ISO date (default: whole season).
const ODDS_SINCE = process.env.ODDS_SINCE || null;

const SHARP_BOOKS  = new Set(['betonline', 'bookmaker']);
const PUBLIC_BOOKS = new Set(['draftkings', 'fanduel', 'betmgm', 'caesars']);
const DIVERGENCE_THRESHOLD = 0.08; // 8 percentage points

// ── The 8 tracked futures categories (display order) ─────────────────────────
const CATEGORIES = [
  { id: 'superbowl',        label: 'Super Bowl Winner',       markets: ['superbowl'],          kind: 'outright',  topN: 12 },
  { id: 'conference',       label: 'Conference Winners',      markets: ['conference_afc', 'conference_nfc'], kind: 'grouped', topN: 8 },
  { id: 'division',         label: 'Division Winners',        markets: ['division_afc_east','division_afc_north','division_afc_south','division_afc_west','division_nfc_east','division_nfc_north','division_nfc_south','division_nfc_west'], kind: 'grouped', topN: 4 },
  { id: 'wins',             label: 'Total Team Wins',         markets: ['wins'],               kind: 'wins_total', topN: 32 },
  { id: 'playoffs',         label: 'To Make the Playoffs',    markets: ['playoffs'],           kind: 'outright',  topN: 20 },
  { id: 'superbowl_matchup',label: 'Super Bowl Exact Matchup',markets: ['superbowl_matchup'],  kind: 'outright',  topN: 15 },
  { id: 'most_wins',        label: 'Most Wins',               markets: ['most_wins'],          kind: 'wins_rank', proxyFrom: 'superbowl', dir: 'desc', topN: 10 },
  { id: 'least_wins',       label: 'Least Wins',              markets: ['least_wins'],         kind: 'wins_rank', proxyFrom: 'superbowl', dir: 'asc',  topN: 10 },
];

const MARKET_LABELS = {
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
    .select('id, source, source_type, title, summary, url, published_at, confidence')
    .gte('captured_at', since).order('published_at', { ascending: false }).limit(400);
  if (error) throw new Error(`fetchIntelNotes: ${error.message}`);
  return data || [];
}
async function fetchPickSignals(sb, noteIds) {
  if (!noteIds.length) return [];
  const { data, error } = await sb.from('research_pick_signals')
    .select('note_id, source, team_or_market, bet_type, lean, rationale, confidence, captured_at')
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
    teams.push({
      team, ...cur, movement: movementOf(bb),
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
  const byBook = {};
  for (const r of picked) byBook[r.book] = Number(r.line);
  return {
    line: avg(picked.map((r) => Number(r.line))),
    over: overs.length ? Math.round(avg(overs)) : null,
    under: unders.length ? Math.round(avg(unders)) : null,
    byBook,
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
    teams.push({ team, line: cur.line, over: cur.over, under: cur.under, byBook: cur.byBook, movement: winLineMovement(bb) });
  }
  return teams.sort((a, b) => b.line - a.line); // most wins first
}
function winsHasLines(grouped) {
  const mm = grouped.get('wins');
  if (!mm || !mm.size) return false;
  for (const bb of mm.values()) for (const arr of bb.values()) if (arr.some(hasLine)) return true;
  return false;
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
        cat.subsections.push({ label: def.label, kind: 'wins', teams: buildWinTotalsSummary(grouped.get('wins')).slice(0, def.topN) });
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
        const sorted = def.dir === 'asc' ? teams.slice().reverse() : teams;
        cat.present = true; cat.source = 'dedicated';
        cat.subsections.push({ label: def.label, teams: sorted.slice(0, def.topN) });
      } else if (winsHasLines(grouped)) {
        const teams = buildWinTotalsSummary(grouped.get('wins')); // desc by line
        const ranked = def.dir === 'asc' ? teams.slice().reverse() : teams;
        cat.present = true; cat.source = 'wins_line';
        cat.note = `Ranked by consensus win-total line (${def.dir === 'desc' ? 'highest' : 'lowest'} first) from loaded sportsbook lines.`;
        cat.subsections.push({ label: def.label, kind: 'wins', teams: ranked.slice(0, def.topN) });
      } else {
        const proxy = grouped.get(def.proxyFrom);
        if (proxy && proxy.size) {
          const teams = buildMarketSummary(proxy);
          const ranked = def.dir === 'asc' ? teams.slice().reverse() : teams;
          cat.present = true; cat.source = 'proxy';
          cat.note = `Proxy ranking from Super Bowl title-market consensus (${def.dir === 'desc' ? 'favorites' : 'longshots'} first) — no win-total lines or dedicated market loaded yet. Replaced automatically once those arrive.`;
          cat.subsections.push({ label: `${def.label} (proxy)`, teams: ranked.slice(0, def.topN) });
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
      cat.subsections.push({ label: MARKET_LABELS[m] || def.label, teams: teams.slice(0, def.topN) });
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
          consensus: t.consensus, opening: t.opening, firstDate: t.firstDate, lastDate: t.lastDate,
          points: t.points, spark: sparkline(t.series.map((s) => s.consensus)) });
    }
  }
  return movers.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 25);
}
function buildValueSpots(grouped) {
  const spots = [];
  for (const [mt, mm] of grouped.entries()) {
    for (const t of buildMarketSummary(mm)) {
      if (t.divergence != null && Math.abs(t.divergence) >= DIVERGENCE_THRESHOLD)
        spots.push({ market: MARKET_LABELS[mt] || mt, team: t.team, divergence: t.divergence, sharpImplied: t.sharpImplied, publicImplied: t.publicImplied });
    }
  }
  return spots.sort((a, b) => Math.abs(b.divergence) - Math.abs(a.divergence)).slice(0, 20);
}

// ── Expert grouping ──────────────────────────────────────────────────────────
function buildExpertGroups(signals, notes, tweets) {
  const groups = new Map();
  const ensure = (src) => { if (!groups.has(src)) groups.set(src, { source: src, signals: [], articles: [], tweets: [] }); return groups.get(src); };
  for (const s of signals) ensure(s.source).signals.push(s);
  for (const n of notes) if (isFuturesRelevant(n.title) || isFuturesRelevant(n.summary)) ensure(n.source).articles.push(n);
  for (const t of tweets) if (isFuturesRelevant(t.text)) ensure(`@${t.author_handle}`).tweets.push(t);
  return [...groups.values()].sort((a, b) =>
    (b.signals.length * 3 + b.articles.length + b.tweets.length) - (a.signals.length * 3 + a.articles.length + a.tweets.length));
}

// ── Coverage audit ───────────────────────────────────────────────────────────
function buildCoverageAudit(counts) {
  const rows = EXPECTED_SOURCES.map((s) => {
    const seen = (counts[s.type] && counts[s.type][s.name]) || 0;
    let state;
    if (s.status === 'deferred') state = 'deferred';
    else if (seen > 0) state = 'covered';
    else state = s.status === 'manual' ? 'awaiting_input' : 'no_data';
    return { ...s, seen, state };
  });
  const summary = {
    active: rows.filter((r) => r.status === 'active').length,
    covered: rows.filter((r) => r.state === 'covered').length,
    no_data: rows.filter((r) => r.state === 'no_data').length,
    deferred: rows.filter((r) => r.state === 'deferred').length,
  };
  return { rows, summary };
}

// ── Hybrid narrative (Claude, optional) ──────────────────────────────────────
async function callClaude(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: NARRATIVE_MODEL, max_tokens: 700, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}`);
  const j = await res.json();
  return (j.content || []).map((c) => c.text || '').join('').trim();
}
function deterministicVerdict(cat, movers, spots) {
  if (!cat.present) return cat.note || 'No market data available in the current window.';
  const top = cat.subsections[0]?.teams?.[0];
  const catMovers = movers.filter((m) => m.market.toLowerCase().includes(cat.label.split(' ')[0].toLowerCase())).slice(0, 2);
  const catSpots = spots.filter((s) => s.market.toLowerCase().includes(cat.label.split(' ')[0].toLowerCase())).slice(0, 2);
  const bits = [];
  if (top && cat.subsections[0]?.kind === 'wins') bits.push(`Highest projected: ${top.team} ${top.line.toFixed(1)} wins (O ${fmtOdds(top.over)} / U ${fmtOdds(top.under)}).`);
  else if (top) bits.push(`Consensus favorite: ${top.team} at ${fmtPct(top.consensus)} (${fmtOdds(impliedToAmerican(top.consensus))}).`);
  if (catMovers.length) bits.push(`Notable move: ${catMovers.map((m) => `${m.team} ${fmtDelta(m.delta)}`).join(', ')}.`);
  if (catSpots.length) bits.push(`Sharp/public gap: ${catSpots.map((s) => `${s.team} ${fmtDelta(s.divergence)}`).join(', ')}.`);
  if (cat.source === 'proxy') bits.push('(Proxy ranking — treat as directional until the dedicated market opens.)');
  return bits.join(' ') || 'Market present; no standout movement or divergence in window.';
}
async function buildNarratives(cats, expertGroups, movers, spots) {
  const out = {};
  const expertBlurb = expertGroups.slice(0, 8).map((g) => {
    const recs = g.signals.slice(0, 4).map((s) => `${s.team_or_market} ${s.lean} [${s.bet_type}]`).join('; ');
    return `${g.source}: ${recs || `${g.articles.length} article(s), ${g.tweets.length} tweet(s)`}`;
  }).join('\n');

  for (const cat of cats) {
    if (!ANTHROPIC_KEY) { out[cat.id] = deterministicVerdict(cat, movers, spots); continue; }
    try {
      const teamLines = cat.subsections.flatMap((s) => s.teams.slice(0, 8).map((t) =>
        s.kind === 'wins'
          ? `${t.team}: ${t.line.toFixed(1)} win total (O ${fmtOdds(t.over)} / U ${fmtOdds(t.under)}), line move ${fmtLineDelta(t.movement)}`
          : `${t.team}: ${fmtPct(t.consensus)} consensus, move ${fmtDelta(t.movement)}, sharp/public gap ${fmtDelta(t.divergence)}`)).join('\n');
      const prompt = [
        `You are a sharp NFL futures analyst. Write a concise (3–5 sentence) recommendation for the "${cat.label}" market for the ${SEASON} season.`,
        `Synthesize the consensus odds, line movement, and sharp/public divergence below with expert opinion. Name the best value side(s) and whether line movement bolsters or refutes them. No hedging filler.`,
        cat.source === 'proxy' ? 'NOTE: this ranking is a proxy from the Super Bowl market; flag that the dedicated market is not open yet.' : '',
        `\nMARKET DATA:\n${teamLines || '(no live odds)'}`,
        `\nEXPERT SIGNALS (all markets):\n${expertBlurb || '(none in window)'}`,
      ].filter(Boolean).join('\n');
      out[cat.id] = await callClaude(prompt);
    } catch (e) {
      console.warn(`  [warn] narrative fallback for ${cat.id}: ${e.message}`);
      out[cat.id] = deterministicVerdict(cat, movers, spots);
    }
  }
  return out;
}

// ── Renderers ────────────────────────────────────────────────────────────────
function teamRow(t) {
  return { team: t.team, american: fmtOdds(impliedToAmerican(t.consensus)), pct: fmtPct(t.consensus),
    dk: fmtOdds(t.allBooks?.draftkings), fd: fmtOdds(t.allBooks?.fanduel),
    bol: fmtOdds(t.allBooks?.betonline), bm: fmtOdds(t.allBooks?.bookmaker),
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
        L.push('| Team | Consensus | Implied | DK | FD | BetOnline | Bookmaker | Δ since open |', '|---|---|---|---|---|---|---|---|');
        for (const t of sub.teams.map(teamRow)) L.push(`| ${t.team} | ${t.american} | ${t.pct} | ${t.dk} | ${t.fd} | ${t.bol} | ${t.bm} | ${t.moveStr} |`);
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
    L.push('| Market | Team | Sharp | Public | Gap | Signal |', '|---|---|---|---|---|---|');
    for (const s of model.valueSpots) L.push(`| ${s.market} | ${s.team} | ${fmtPct(s.sharpImplied)} | ${fmtPct(s.publicImplied)} | ${fmtDelta(s.divergence)} | ${s.divergence > 0 ? '🔪 sharp lean' : '🚨 overbet' } |`);
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
  const moveCell = (d) => d == null ? '<span class="muted">—</span>' :
    `<span class="${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '▲' : '▼'} ${fmtDelta(d)}</span>`;
  const lineMoveCell = (d) => (d == null || d === 0) ? '<span class="muted">—</span>' :
    `<span class="${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '▲' : '▼'} ${fmtLineDelta(d)}</span>`;
  const winsTable = (teams) => `
      <table>
        <thead><tr><th>Team</th><th>Win Total</th><th>Over</th><th>Under</th><th>Δ</th></tr></thead>
        <tbody>${teams.map((t) => `<tr><td class="team">${esc(t.team)}</td><td class="mono">${t.line.toFixed(1)}</td><td class="mono">${fmtOdds(t.over)}</td><td class="mono">${fmtOdds(t.under)}</td><td>${lineMoveCell(t.movement)}</td></tr>`).join('')}</tbody>
      </table>`;
  const stateBadge = { covered: '<span class="b ok">covered</span>', no_data: '<span class="b warn">no data</span>',
    awaiting_input: '<span class="b info">awaiting paste</span>', deferred: '<span class="b mute">deferred</span>' };

  const navItems = model.categories.map((c) => `<a href="#${c.id}">${esc(c.label)}</a>`).join('');

  const catHtml = model.categories.map((cat) => {
    const subs = cat.present ? cat.subsections.map((sub) => `
      ${cat.subsections.length > 1 ? `<h3>${esc(sub.label)}</h3>` : ''}
      ${sub.kind === 'wins' ? winsTable(sub.teams) : `<table>
        <thead><tr><th>Team</th><th>Consensus</th><th>Implied</th><th>DK</th><th>FD</th><th>BetOnline</th><th>Bookmaker</th><th>Δ since open</th></tr></thead>
        <tbody>${sub.teams.map(teamRow).map((t) => `<tr><td class="team">${esc(t.team)}</td><td class="mono">${t.american}</td><td class="mono">${t.pct}</td><td class="mono">${t.dk}</td><td class="mono">${t.fd}</td><td class="mono">${t.bol}</td><td class="mono">${t.bm}</td><td>${moveCell(t.move)}</td></tr>`).join('')}</tbody>
      </table>`}`).join('') : `<p class="empty">${esc(cat.note || 'No data in window.')}</p>`;
    return `<section id="${cat.id}" class="card">
      <h2>${esc(cat.label)} ${cat.source === 'proxy' ? '<span class="b info">proxy</span>' : ''}</h2>
      ${model.narratives[cat.id] ? `<div class="verdict"><span class="vlabel">Verdict</span> ${esc(model.narratives[cat.id])}</div>` : ''}
      ${cat.note && cat.present ? `<p class="note">${esc(cat.note)}</p>` : ''}
      ${subs}
    </section>`;
  }).join('');

  const coverageRows = model.coverage.rows.map((r) => `<tr>
    <td>${esc(r.name)}</td><td class="mono">${esc(r.type)}</td>
    <td>${stateBadge[r.state]}${r.note ? `<div class="subnote">${esc(r.note)}</div>` : ''}</td>
    <td class="mono">${r.seen}</td></tr>`).join('');

  const moversRows = model.movers.length ? model.movers.map((m) => `<tr><td>${esc(m.market)}</td><td class="team">${esc(m.team)}</td><td class="mono">${fmtPct(m.opening)}</td><td class="mono">${fmtPct(m.consensus)}</td><td>${moveCell(m.delta)}</td><td class="spark">${esc(m.spark)}</td><td class="mono muted">${esc(m.firstDate || '—')}→${esc(m.lastDate || '—')} (${m.points})</td></tr>`).join('') : '<tr><td colspan="7" class="empty">No significant movement across loaded snapshots.</td></tr>';
  const spotsRows = model.valueSpots.length ? model.valueSpots.map((s) => `<tr><td>${esc(s.market)}</td><td class="team">${esc(s.team)}</td><td class="mono">${fmtPct(s.sharpImplied)}</td><td class="mono">${fmtPct(s.publicImplied)}</td><td class="mono">${fmtDelta(s.divergence)}</td><td>${s.divergence > 0 ? '<span class="up">🔪 sharp lean</span>' : '<span class="down">🚨 overbet</span>'}</td></tr>`).join('') : '<tr><td colspan="6" class="empty">No divergence ≥ threshold.</td></tr>';

  const expertHtml = model.expertGroups.length ? model.expertGroups.map((g) => `
    <div class="expert">
      <h4>${esc(g.source)} <span class="count">${g.signals.length}🎯 ${g.articles.length}📄 ${g.tweets.length}🐦</span></h4>
      <ul>
        ${g.signals.slice(0, 8).map((s) => `<li><b>${esc(s.team_or_market)}</b> — <span class="lean">${esc(String(s.lean).toUpperCase())}</span> <span class="mono">[${esc(s.bet_type)}]</span>${s.confidence ? ` <span class="muted">(${Math.round(s.confidence * 100)}%)</span>` : ''}${s.rationale ? `<div class="subnote">${esc(s.rationale)}</div>` : ''}</li>`).join('')}
        ${g.articles.slice(0, 4).map((a) => `<li>📄 <a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.title || 'Article')}</a></li>`).join('')}
        ${g.tweets.slice(0, 4).map((t) => `<li>🐦 ${esc(String(t.text).slice(0, 160))}</li>`).join('')}
      </ul>
    </div>`).join('') : '<p class="empty">No expert futures signals in window.</p>';

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>NFL Futures Intel Report — ${esc(model.reportDate)}</title>
<style>
:root{--bg:#0f1217;--card:#171b22;--card2:#1d2230;--bd:#2a3140;--tx:#e7ecf3;--mut:#8c97a8;--ac:#4ea1ff;--ok:#34d399;--warn:#fbbf24;--down:#f87171;--up:#34d399;--info:#60a5fa;}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--tx);font:15px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
.wrap{max-width:1080px;margin:0 auto;padding:28px 20px 80px}
header.top{border-bottom:1px solid var(--bd);padding-bottom:16px;margin-bottom:20px}
h1{font-size:26px;margin:0 0 6px}.sub{color:var(--mut);font-size:13px}
nav.toc{position:sticky;top:0;background:rgba(15,18,23,.92);backdrop-filter:blur(6px);display:flex;flex-wrap:wrap;gap:6px;padding:10px 0;margin-bottom:18px;border-bottom:1px solid var(--bd);z-index:5}
nav.toc a{font-size:12px;color:var(--mut);text-decoration:none;border:1px solid var(--bd);border-radius:999px;padding:3px 10px}
nav.toc a:hover{color:var(--tx);border-color:var(--ac)}
.card{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:18px 20px;margin:14px 0}
h2{font-size:19px;margin:0 0 10px;display:flex;align-items:center;gap:8px}h3{font-size:14px;color:var(--mut);margin:14px 0 6px;text-transform:uppercase;letter-spacing:.04em}
h4{margin:0 0 6px;font-size:15px}
table{width:100%;border-collapse:collapse;margin:6px 0 4px;font-size:13.5px}
th{text-align:left;color:var(--mut);font-weight:600;border-bottom:1px solid var(--bd);padding:6px 8px;font-size:11.5px;text-transform:uppercase;letter-spacing:.03em}
td{padding:6px 8px;border-bottom:1px solid #20262f}tr:last-child td{border-bottom:none}
.team{font-weight:600}.mono{font-variant-numeric:tabular-nums;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.up{color:var(--up)}.down{color:var(--down)}.muted{color:var(--mut)}
.spark{letter-spacing:1px;color:var(--ac);font-size:14px}
.verdict{background:var(--card2);border-left:3px solid var(--ac);border-radius:6px;padding:10px 12px;margin:6px 0 12px;font-size:14px}
.vlabel{display:inline-block;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--ac);font-weight:700;margin-right:6px}
.note{color:var(--warn);font-size:12.5px;margin:2px 0 8px}.subnote{color:var(--mut);font-size:12px;margin-top:2px}
.empty{color:var(--mut);font-style:italic;padding:8px 0}
.b{display:inline-block;font-size:11px;font-weight:700;padding:1px 8px;border-radius:999px}
.b.ok{background:rgba(52,211,153,.15);color:var(--ok)}.b.warn{background:rgba(251,191,36,.15);color:var(--warn)}
.b.info{background:rgba(96,165,250,.15);color:var(--info)}.b.mute{background:rgba(140,151,168,.15);color:var(--mut)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media(max-width:760px){.grid2{grid-template-columns:1fr}}
.expert{background:var(--card2);border:1px solid var(--bd);border-radius:10px;padding:12px 14px;margin:8px 0}
.expert ul{margin:6px 0 0;padding-left:18px}.expert li{margin:3px 0}.lean{color:var(--ac);font-weight:700}
.count{font-size:11px;color:var(--mut);font-weight:400;margin-left:6px}
footer{color:var(--mut);font-size:12px;border-top:1px solid var(--bd);margin-top:24px;padding-top:14px}
.summary{display:flex;gap:18px;flex-wrap:wrap;margin:4px 0 10px;font-size:13px}
.summary b{font-size:18px;display:block}
</style></head><body><div class="wrap">
<header class="top">
  <h1>🏈 NFL Futures Intel Report</h1>
  <div class="sub">${esc(model.reportDate)} · Season ${model.season} · trigger: ${esc(model.trigger)} · odds: full-season history · ${INTEL_DAYS}d articles / ${SIGNAL_DAYS}d signals · narrative: ${esc(model.engine.narrative)}</div>
</header>
<nav class="toc"><a href="#coverage">Coverage</a>${navItems}<a href="#movement">Movement</a><a href="#value">Value</a><a href="#experts">Experts</a></nav>

<section id="coverage" class="card">
  <h2>📋 Coverage Audit</h2>
  <div class="summary">
    <div><b>${model.coverage.summary.active}</b> active sources</div>
    <div><b class="up">${model.coverage.summary.covered}</b> covered this window</div>
    <div><b style="color:var(--warn)">${model.coverage.summary.no_data}</b> no data</div>
    <div><b class="muted">${model.coverage.summary.deferred}</b> deferred</div>
  </div>
  <table><thead><tr><th>Source</th><th>Type</th><th>Status</th><th>Items</th></tr></thead><tbody>${coverageRows}</tbody></table>
</section>

${catHtml}

<section id="movement" class="card">
  <h2>📈 Line Movement — Offseason <span class="muted" style="font-size:13px">since opening snapshot</span></h2>
  <table><thead><tr><th>Market</th><th>Team</th><th>Opening</th><th>Current</th><th>Net Δ</th><th>Trend</th><th>Window</th></tr></thead><tbody>${moversRows}</tbody></table>
</section>

<section id="value" class="card">
  <h2>🎯 Value Spots <span class="muted" style="font-size:13px">sharp/public ≥ ${Math.round(DIVERGENCE_THRESHOLD * 100)}pp</span></h2>
  <table><thead><tr><th>Market</th><th>Team</th><th>Sharp</th><th>Public</th><th>Gap</th><th>Signal</th></tr></thead><tbody>${spotsRows}</tbody></table>
</section>

<section id="experts" class="card">
  <h2>🗣️ Recommendations by Expert / Source</h2>
  ${expertHtml}
</section>

<footer>Generated ${esc(model.generatedAt)} · odds via TheOddsAPI consensus snapshots (sharp: BetOnline, Bookmaker · public: DraftKings, FanDuel, BetMGM, Caesars) · narrative engine: ${esc(model.engine.narrative)}. Not betting advice.</footer>
</div></body></html>`;
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
  if (SAMPLE) {
    snapshots = sampleSnapshots();
    const s = sampleIntel(); notes = s.notes; signals = s.signals; tweets = s.tweets;
    counts = { rss_article: { 'Action Network': 5, 'Sharp Football': 3, 'VSiN': 2, 'PFF': 4, 'ESPN NFL': 6 }, podcast: { 'Sharp or Square': 1, 'Even Money': 1 }, tweet: { 'Sharp X / Twitter (manual paste)': 1 } };
  } else {
    const sb = getSupabase();
    [snapshots, notes, tweets, counts] = await Promise.all([fetchSnapshots(sb), fetchIntelNotes(sb), fetchSharpTweets(sb), fetchCoverageCounts(sb)]);
    signals = await fetchPickSignals(sb, notes.map((n) => n.id));
  }

  const grouped = groupSeries(snapshots);
  const categories = buildCategoryModel(grouped);
  const movers = buildMovers(grouped);
  const valueSpots = buildValueSpots(grouped);
  const expertGroups = buildExpertGroups(signals, notes, tweets);
  const coverage = buildCoverageAudit(counts);
  const narratives = await buildNarratives(categories, expertGroups, movers, valueSpots);

  const model = {
    season: SEASON, reportDate, generatedAt: nowIso(), trigger: TRIGGER,
    engine: { narrative: ANTHROPIC_KEY ? `claude (${NARRATIVE_MODEL})` : 'deterministic' },
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
