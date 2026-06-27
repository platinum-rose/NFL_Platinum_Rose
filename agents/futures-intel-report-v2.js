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

const SHARP_BOOKS  = new Set(['betonline', 'bookmaker', 'betus']);
const PUBLIC_BOOKS = new Set(['draftkings', 'fanduel', 'betmgm', 'caesars']);
const DIVERGENCE_THRESHOLD = 0.08; // 8 percentage points

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
        const sorted = def.dir === 'asc' ? teams.slice().reverse() : teams;
        cat.present = true; cat.source = 'dedicated';
        cat.subsections.push({ label: def.label, teams: sorted });
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
          points: t.points, spark: sparkline(t.series.map((s) => s.consensus)) });
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

function buildValueSpots(grouped, notes = [], signals = []) {
  const spots = [];
  for (const [mt, mm] of grouped.entries()) {
    for (const t of buildMarketSummary(mm)) {
      if (t.divergence != null && Math.abs(t.divergence) >= DIVERGENCE_THRESHOLD) {
        const market = MARKET_LABELS[mt] || mt;
        spots.push({
          market,
          team: t.team,
          divergence: t.divergence,
          sharpImplied: t.sharpImplied,
          publicImplied: t.publicImplied,
          currentBooks: t.allBooks || {},
          openingBooks: t.openingBooks || {},
          sourceLinks: valueSpotSourceLinks(market, t.team, notes, signals),
        });
      }
    }
  }
  return spots.sort((a, b) => Math.abs(b.divergence) - Math.abs(a.divergence)).slice(0, 20);
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
  for (const n of notes) if (isFuturesRelevant(n.title) || isFuturesRelevant(n.summary)) ensure(n.source).articles.push(n);
  for (const t of tweets) if (isFuturesRelevant(t.text)) ensure(`@${t.author_handle}`).tweets.push(t);
  return [...groups.values()].sort((a, b) =>
    (b.signals.length * 3 + b.articles.length + b.tweets.length) - (a.signals.length * 3 + a.articles.length + a.tweets.length));
}

// ── Coverage audit ───────────────────────────────────────────────────────────
function buildCoverageAudit(counts, notes = []) {
  // Group fetched articles by source name for the expandable URL list
  const bySource = {};
  for (const n of notes) { if (!bySource[n.source]) bySource[n.source] = []; bySource[n.source].push(n); }
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

  // Preferred books (CA-legal offshore); DK/FD retained for proxy reference only
  const PREF_BOOKS = ['betonline', 'bookmaker', 'betus'];
  const BOOK_SHORT = { betonline: 'BOL', bookmaker: 'BKR', betus: 'BTU', draftkings: 'DK', fanduel: 'FD', betmgm: 'MGM', caesars: 'CZR' };

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
    const cls = d >= 0 ? 'up' : 'dn';
    const arrow = d >= 0 ? '▲' : '▼';
    return '<span class="delt ' + cls + '">' + arrow + ' ' + fmtFn(d) + '</span>';
  };
  const deltaOdds = (d) => delt(d, fmtDelta);
  const deltaLine = (d) => (d == null || d === 0) ? '<span class="na">—</span>' : delt(d, fmtLineDelta);

  // Implied-probability bar cell (<td> included) — string concat
  const probBar = (p) => {
    if (p == null || isNaN(p)) return '<td class="na">—</td>';
    const pct = p * 100;
    const w = Math.min(Math.round(pct * 2.8), 100);
    const cls = pct >= 30 ? 'hi' : pct >= 12 ? 'md' : 'lo';
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
  // Win totals: SoS placeholder column + collapse after collapseAfter teams
  const winsTable = (teams, collapseAfter = 16) => {
    const thead = '<thead><tr><th>Team</th><th colspan="2">Win Total</th><th>Over</th><th>Under</th><th>Δ</th><th>SoS</th></tr></thead>';
    const mkRow = (t) => '<tr>' +
      '<td class="tm">' + esc(t.team) + '</td>' +
      '<td class="mono big-line">' + (t.line != null ? t.line.toFixed(1) : '—') + '</td>' +
      '<td class="line-bar-cell"><div class="line-bar" style="width:' + Math.min(Math.round(((t.line || 0) / 17) * 100), 100) + '%"></div></td>' +
      '<td class="mono">' + fmtOdds(t.over) + '</td>' +
      '<td class="mono">' + fmtOdds(t.under) + '</td>' +
      '<td>' + deltaLine(t.movement) + '</td>' +
      '<td class="sos-cell"><span class="sos-na">—</span></td>' +
      '</tr>';
    const above = teams.slice(0, collapseAfter);
    const below = teams.slice(collapseAfter);
    const hidRows = below.length
      ? '<details class="tbl-expand"><summary>' + below.length + ' more teams</summary>' +
        '<div class="tbl-wrap" style="border-radius:0 0 10px 10px;border-top:none"><table>' +
        thead + '<tbody>' + below.map(mkRow).join('') + '</tbody></table></div></details>'
      : '';
    return '<div class="tbl-wrap"><table>' + thead + '<tbody>' + above.map(mkRow).join('') + '</tbody></table>' + hidRows + '</div>';
  };

  // Outright table: BOL/BKR/BTU primary, DK/FD muted, Best(Pref), collapse after collapseAfter
  const outrightTable = (teams, collapseAfter = 32) => {
    const thead = '<thead><tr>' +
      '<th>Team</th><th>Prob</th><th>Consensus</th>' +
      '<th>BOL</th><th>BKR</th><th>BTU</th><th>Best</th>' +
      '<th class="muted">DK</th><th class="muted">FD</th>' +
      '<th>Δ open</th></tr></thead>';
    const fmtCell = (v, muted) => {
      if (v == null) return '<td class="na mono' + (muted ? ' muted' : '') + '">—</td>';
      const n = typeof v === 'number' ? v : parseInt(v, 10);
      const cls = isNaN(n) ? '' : n <= -200 ? ' c-fav' : n >= 500 ? ' c-dog' : '';
      return '<td class="mono' + (muted ? ' muted' : '') + cls + '">' + fmtOdds(v) + '</td>';
    };
    const mkRow = (t) => {
      const bp = bestPref(t.allBooks || {});
      const bestCell = bp
        ? '<td class="mono best-odds"><b>' + fmtOdds(bp.odds) + '</b> <span class="book-tag">' + BOOK_SHORT[bp.book] + '</span></td>'
        : '<td class="na mono">—</td>';
      return '<tr>' +
        '<td class="tm">' + esc(t.team) + '</td>' +
        probBar(t.consensus) +
        '<td class="mono ac">' + fmtOdds(impliedToAmerican(t.consensus)) + '</td>' +
        fmtCell(t.allBooks?.betonline, false) +
        fmtCell(t.allBooks?.bookmaker, false) +
        fmtCell(t.allBooks?.betus, false) +
        bestCell +
        fmtCell(t.allBooks?.draftkings, true) +
        fmtCell(t.allBooks?.fanduel, true) +
        '<td>' + deltaOdds(t.movement) + '</td>' +
        '</tr>';
    };
    const above = teams.slice(0, collapseAfter);
    const below = teams.slice(collapseAfter);
    const hidRows = below.length
      ? '<details class="tbl-expand"><summary>' + below.length + ' more teams</summary>' +
        '<div class="tbl-wrap" style="border-radius:0 0 10px 10px;border-top:none"><table>' +
        thead + '<tbody>' + below.map(mkRow).join('') + '</tbody></table></div></details>'
      : '';
    return '<div class="tbl-wrap"><table>' + thead + '<tbody>' + above.map(mkRow).join('') + '</tbody></table>' + hidRows + '</div>';
  };

  // ── Category section ─────────────────────────────────────────────────────────
  const catSection = (cat) => {
    const collapseAfter = cat.id === 'superbowl' ? 10 : 16;
    const liveTag = !cat.present ? '<span class="b b-mute">no data</span>'
      : cat.source === 'proxy' ? '<span class="b b-info">proxy</span>'
      : '<span class="b b-ok">live</span>';
    const content = !cat.present
      ? '<p class="empty-note">' + esc(cat.note || 'No market data in window.') + '</p>'
      : cat.subsections.map((sub) => {
          const tbl = sub.kind === 'wins' ? winsTable(sub.teams, collapseAfter) : outrightTable(sub.teams, collapseAfter);
          return (cat.subsections.length > 1 ? '<h3 class="sub-head">' + esc(sub.label) + '</h3>' : '') + tbl;
        }).join('');
    const verdictHtml = model.narratives[cat.id]
      ? '<div class="verdict"><div class="verdict-label">Verdict</div><div class="verdict-body">' + prose(model.narratives[cat.id]) + '</div></div>'
      : '';
    const noteHtml = cat.note && cat.present ? '<div class="cat-note">' + esc(cat.note) + '</div>' : '';
    return '<section id="' + cat.id + '" class="card cat-card">' +
      '<div class="cat-head"><h2>' + esc(cat.label) + '</h2>' + liveTag + '</div>' +
      verdictHtml + noteHtml + content + '</section>';
  };

  // ── Movement — card grid for top movers, table for the rest ─────────────────
  const topMovers  = model.movers.slice(0, 9);
  const restMovers = model.movers.slice(9);

  const moverCard = (m) => {
    const cls = m.delta >= 0 ? 'up' : 'dn';
    const openChips = bookOddsChips(m.openingBooks || {});
    const curChips  = bookOddsChips(m.currentBooks  || {});
    return '<div class="mover-card ' + cls + '">' +
      '<div class="mc-delta">' + (m.delta >= 0 ? '▲' : '▼') + ' ' + fmtDelta(m.delta) + '</div>' +
      '<div class="mc-team">' + esc(m.team) + '</div>' +
      '<div class="mc-market">' + esc(m.market) + '</div>' +
      '<div class="mc-spark">' + esc(m.spark || '—') + '</div>' +
      '<div class="mc-odds-section">' +
        '<div class="mc-odds-row"><span class="mc-odds-lbl">Open</span>' + openChips + '</div>' +
        '<div class="mc-odds-row"><span class="mc-odds-lbl">Now</span>' + curChips + '</div>' +
      '</div>' +
      '<div class="mc-meta">' + fmtPct(m.opening) + ' → ' + fmtPct(m.consensus) + ' · ' + esc(m.firstDate || '?') + ' → ' + esc(m.lastDate || '?') + '</div>' +
      '</div>';
  };

  const moverRestTable = restMovers.length
    ? '<div class="tbl-wrap" style="margin-top:14px"><table>' +
      '<thead><tr><th>Team</th><th>Market</th><th>Opening</th><th>Current</th><th>Net Δ</th><th>Trend</th><th>Window</th></tr></thead><tbody>' +
      restMovers.map((m) =>
        '<tr>' +
        '<td class="tm">' + esc(m.team) + '</td><td>' + esc(m.market) + '</td>' +
        '<td class="mono">' + fmtPct(m.opening) + '</td><td class="mono">' + fmtPct(m.consensus) + '</td>' +
        '<td>' + deltaOdds(m.delta) + '</td>' +
        '<td class="spark">' + esc(m.spark || '—') + '</td>' +
        '<td class="mono na">' + esc(m.firstDate || '—') + '→' + esc(m.lastDate || '—') + ' (' + m.points + ')</td>' +
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
  const valueHtml = model.valueSpots.length
    ? '<div class="spots-grid">' + model.valueSpots.map((s) => {
        const labelCls = s.divergence > 0 ? 'sharp' : 'overbet';
        const lbl = s.divergence > 0 ? '🔪 Sharp Lean' : '🚨 Overbet';
        const chipsNow  = (s.currentBooks  && Object.keys(s.currentBooks).length)  ? bookOddsChips(s.currentBooks)  : '';
        const chipsOpen = (s.openingBooks  && Object.keys(s.openingBooks).length)   ? bookOddsChips(s.openingBooks)  : '';
        const explain = s.divergence > 0
          ? 'Preferred sharp books imply a higher win probability than public books. That can point to sharper support or a stale public price.'
          : 'Public books imply a higher win probability than preferred sharp books. Treat this as possible public tax or an overbet favorite.';
        const src = (s.sourceLinks || []).length
          ? '<div class="spot-sources"><span>Context</span>' + s.sourceLinks.map((l) =>
              '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.source || 'Source') + ': ' + esc(l.title || 'Article') + '</a>'
            ).join('') + '</div>'
          : '<div class="spot-sources no-src"><span>Context</span><em>Odds-derived signal; no matching expert article linked in this window.</em></div>';
        return '<div class="spot-card ' + labelCls + '">' +
          '<div class="spot-label">' + lbl + '</div>' +
          '<div class="spot-team">' + esc(s.team) + '</div>' +
          '<div class="spot-market">' + esc(s.market) + '</div>' +
          '<div class="spot-nums">' +
            '<span>Sharp <b>' + fmtPct(s.sharpImplied) + '</b></span>' +
            '<span class="spot-gap">' + fmtDelta(s.divergence) + '</span>' +
            '<span>Public <b>' + fmtPct(s.publicImplied) + '</b></span>' +
          '</div>' +
          '<div class="spot-explain">' + esc(explain) + '</div>' +
          (chipsNow  ? '<div class="spot-chips"><span class="spot-chips-lbl">Now</span>'  + chipsNow  + '</div>' : '') +
          (chipsOpen ? '<div class="spot-chips"><span class="spot-chips-lbl">Open</span>' + chipsOpen + '</div>' : '') +
          src +
          '</div>';
      }).join('') + '</div>'
    : '<div class="empty-state">' +
      '<div class="es-icon">🎯</div>' +
      '<div class="es-head">No divergence above threshold</div>' +
      '<div class="es-sub">Value spots fire when sharp-book implied probability exceeds public-book by ≥' + Math.round(DIVERGENCE_THRESHOLD * 100) + 'pp. Public books (DK/FD/BetMGM) currently only price the Super Bowl market — conference/division/playoffs value spots will appear once those markets open pre-season.</div>' +
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
.card-head{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.card-head h2{font-size:17px;font-weight:700}
/* ── Category cards ─────────────────────────────────────────────────────────── */
.cat-card{border-left:3px solid var(--ac)}
.cat-head{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.cat-head h2{font-size:17px;font-weight:700}
.sub-head{font-size:11.5px;font-weight:600;color:var(--tx2);text-transform:uppercase;letter-spacing:.06em;margin:16px 0 6px}
.cat-note{color:var(--amber);font-size:12.5px;margin-bottom:10px;line-height:1.5}
.empty-note{color:var(--tx3);font-size:13px;font-style:italic;padding:8px 0}
/* ── Verdict ────────────────────────────────────────────────────────────────── */
.verdict{background:linear-gradient(to right,rgba(61,130,247,.1),transparent);border-left:3px solid var(--ac);border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:14px}
.verdict-label{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--ac);margin-bottom:4px}
.verdict-body{font-size:13.5px;color:var(--tx);line-height:1.7}
/* ── Tables ─────────────────────────────────────────────────────────────────── */
.tbl-wrap{overflow-x:auto;border-radius:10px;border:1px solid var(--bd)}
table{width:100%;border-collapse:collapse;font-size:13.5px}
thead tr{background:var(--s2)}
th{text-align:left;font-size:11px;font-weight:600;color:var(--tx3);text-transform:uppercase;letter-spacing:.05em;padding:9px 12px;border-bottom:1px solid var(--bd);white-space:nowrap}
td{padding:8px 12px;border-bottom:1px solid var(--bd)}
tr:last-child td{border-bottom:none}
tr:hover td{background:rgba(255,255,255,.018)}
.tm{font-weight:600;color:var(--tx);white-space:nowrap}
.mono{font-variant-numeric:tabular-nums;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.ac{color:var(--ac);font-weight:700}
.na{color:var(--tx3)}
.muted{color:var(--tx3);font-size:12px}
th.muted{opacity:.5}
.c-fav{color:var(--green)}
.c-dog{color:var(--amber)}
/* ── Best odds cell ─────────────────────────────────────────────────────────── */
.best-odds{color:var(--amber);font-weight:700}
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
.mc-spark{font-size:20px;letter-spacing:3px;color:var(--spark);margin-bottom:4px;line-height:1}
.mc-odds-section{margin:8px 0;display:flex;flex-direction:column;gap:5px}
.mc-odds-row{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.mc-odds-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--tx3);width:28px;flex-shrink:0}
.mc-meta{font-size:11px;color:var(--tx3);font-variant-numeric:tabular-nums;margin-top:4px}
/* ── Sparkline (table) ──────────────────────────────────────────────────────── */
.spark{font-size:16px;letter-spacing:2px;color:var(--spark)}
/* ── Value spot cards ───────────────────────────────────────────────────────── */
.spots-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}
.spot-card{background:var(--s2);border:1px solid var(--bd);border-radius:10px;padding:14px 16px}
.spot-card.sharp{border-left:3px solid var(--green)}.spot-card.overbet{border-left:3px solid var(--red)}
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
  <div class="card-head"><h2>📈 Line Movement</h2><span style="font-size:13px;color:var(--tx2)">since opening snapshot · BOL/BKR/BTU</span></div>
  ${movementHtml}
</section>

<section id="value" class="card">
  <div class="card-head"><h2>🎯 Value Spots</h2><span style="font-size:13px;color:var(--tx2)">sharp / public ≥ ${Math.round(DIVERGENCE_THRESHOLD * 100)}pp</span></div>
  ${valueHtml}
</section>

${model.categories.map(catSection).join('')}

<section id="experts" class="card">
  <div class="card-head"><h2>🗣️ Expert Signals</h2></div>
  ${expertHtml}
</section>

<section id="coverage" class="card">
  <div class="card-head"><h2>📋 Coverage Audit</h2></div>
  ${coverageHtml}
</section>

</div>
<footer style="max-width:1100px;margin:0 auto;padding:16px 20px 40px">
  Generated ${esc(model.generatedAt)} · Sharp books: BetOnline (BOL) · Bookmaker (BKR) · BetUS (BTU) · Public ref: DraftKings · FanDuel · narrative: ${esc(model.engine.narrative)} · Not betting advice.
</footer>
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
  const expertGroups = buildExpertGroups(signals, notes, tweets);
  const valueSpots = buildValueSpots(grouped, notes, signals);
  const coverage = buildCoverageAudit(counts, notes);
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
