// agents/nfl-daily-brief.js
// ═══════════════════════════════════════════════════════════════════════════════
// NFL Daily Brief — Email Digest Agent
//
// Generates and emails a daily NFL intelligence digest to andrewlrose@hotmail.com.
//
// Sections (adaptive — sections with no data are hidden automatically):
//   1. Futures Snapshot  — Top 10 Super Bowl odds + notable movers
//   2. Sharp Signals     — Last 48h sharp/analyst tweets
//   3. Intel Digest      — Research articles (last 7 days)
//   4. Injury Report     — Active injuries (last 7 days, in-season only)
//   5. Upcoming Games    — This week's lines (in-season only)
//
// Usage:
//   node agents/nfl-daily-brief.js             # send email
//   node agents/nfl-daily-brief.js --dry-run   # print HTML, no email
//
// Env vars:
//   SUPABASE_URL              (required)
//   SUPABASE_SERVICE_ROLE_KEY (required)
//   GMAIL_ADDRESS             (required unless --dry-run)
//   GMAIL_APP_PASSWORD        (required unless --dry-run)
//   TO_EMAIL                  default: andrewlrose@hotmail.com
//   TWEET_LOOKBACK_HOURS      default: 48
//   INTEL_LOOKBACK_DAYS       default: 7
//   INJURY_LOOKBACK_DAYS      default: 7
//   GAMES_LOOKAHEAD_DAYS      default: 8
// ═══════════════════════════════════════════════════════════════════════════════

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import 'dotenv/config';

const __filename  = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const ROOT        = path.resolve(__dirname, '..');
const RECEIPTS_DIR = path.join(ROOT, '.nfl', 'receipts');

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GMAIL_ADDR   = process.env.GMAIL_ADDRESS;
const GMAIL_PASS   = process.env.GMAIL_APP_PASSWORD;
const TO_EMAIL     = process.env.TO_EMAIL || 'andrewlrose@hotmail.com';
const DRY_RUN      = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';

const TWEET_HOURS  = Number(process.env.TWEET_LOOKBACK_HOURS || 48);
const INTEL_DAYS   = Number(process.env.INTEL_LOOKBACK_DAYS  || 7);
const INJURY_DAYS  = Number(process.env.INJURY_LOOKBACK_DAYS || 7);
const GAMES_DAYS   = Number(process.env.GAMES_LOOKAHEAD_DAYS || 8);

// Teams with most betting interest — top 10 for futures snapshot
const SB_TOP_TEAMS = [
  'KC', 'PHI', 'BAL', 'BUF', 'SF', 'DET', 'HOU', 'LAC', 'DAL', 'GB',
];

const SHARP_BOOKS  = new Set(['betonline', 'bookmaker', 'pinnacle']);

// Keywords that flag an article as NFL-relevant
const NFL_KEYWORDS = [
  'nfl', 'football', 'quarterback', 'super bowl', 'playoff', 'draft',
  'touchdown', 'receiver', 'running back', 'offensive line', 'defensive',
  'wide receiver', 'tight end', 'coach', 'head coach', 'offensive coordinator',
  'free agent', 'trade', 'injury report', 'week ', 'spread', 'over/under',
  'futures', 'win total', 'division', 'conference', 'afc', 'nfc',
  'chiefs', 'eagles', 'ravens', 'bills', '49ers', 'lions', 'texans', 'chargers',
  'cowboys', 'packers', 'bears', 'steelers', 'patriots', 'jets', 'giants',
  'dolphins', 'browns', 'bengals', 'broncos', 'raiders', 'seahawks', 'rams',
  'cardinals', 'falcons', 'saints', 'panthers', 'buccaneers', 'vikings',
  'commanders', 'titans', 'colts', 'jaguars',
];

function isNFLRelevant(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return NFL_KEYWORDS.some(kw => lower.includes(kw));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hoursAgo(h) {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

function daysAgo(d) {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();
}

function daysFromNow(d) {
  return new Date(Date.now() + d * 24 * 60 * 60 * 1000).toISOString();
}

function fmtOdds(american) {
  if (american == null || isNaN(american)) return 'n/a';
  return american >= 0 ? `+${american}` : `${american}`;
}

function fmtPct(prob) {
  if (prob == null || isNaN(prob)) return '—';
  return `${(prob * 100).toFixed(1)}%`;
}

function americanToImplied(american) {
  if (!american) return null;
  if (american > 0) return 100 / (american + 100);
  return Math.abs(american) / (Math.abs(american) + 100);
}

function nowStr() {
  return new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'long', month: 'short', day: 'numeric',
    year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function dateStr(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
}

// ── Data fetchers ─────────────────────────────────────────────────────────────

async function fetchFuturesSnapshot(supabase) {
  // Get most recent snapshot for each team on the Super Bowl market
  const since = daysAgo(3);
  const { data, error } = await supabase
    .from('futures_odds_snapshots')
    .select('team, book, odds, implied_prob, captured_at')
    .eq('market_type', 'superbowl')
    .gte('captured_at', since)
    .order('captured_at', { ascending: false });

  if (error) {
    console.warn(`fetchFuturesSnapshot: ${error.message}`);
    return [];
  }
  return data || [];
}

async function fetchFuturesMovers(supabase) {
  // Oldest snapshots in last 7 days for movement comparison
  const since = daysAgo(7);
  const { data, error } = await supabase
    .from('futures_odds_snapshots')
    .select('team, book, odds, implied_prob, captured_at, market_type')
    .eq('market_type', 'superbowl')
    .gte('captured_at', since)
    .order('captured_at', { ascending: true });

  if (error) {
    console.warn(`fetchFuturesMovers: ${error.message}`);
    return [];
  }
  return data || [];
}

async function fetchSharpTweets(supabase) {
  const since = hoursAgo(TWEET_HOURS);
  const { data, error } = await supabase
    .from('x_sharp_tweets')
    .select('author_handle, author_tier, text, tweet_url, published_at')
    .gte('published_at', since)
    .in('author_tier', ['sharp', 'analyst'])
    .order('published_at', { ascending: false })
    .limit(20);

  if (error) {
    console.warn(`fetchSharpTweets: ${error.message}`);
    return [];
  }
  return data || [];
}

async function fetchIntelNotes(supabase) {
  const since = daysAgo(INTEL_DAYS);
  const { data, error } = await supabase
    .from('research_intel_notes')
    .select('source, title, summary, url, published_at, confidence')
    .gte('captured_at', since)
    .order('confidence', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(15);

  if (error) {
    console.warn(`fetchIntelNotes: ${error.message}`);
    return [];
  }
  const rows = data || [];
  // Filter to NFL-relevant content only (table contains multi-sport articles)
  return rows.filter(r => isNFLRelevant(r.title) || isNFLRelevant(r.summary));
}

async function fetchInjuries(supabase) {
  const since = daysAgo(INJURY_DAYS);
  const { data, error } = await supabase
    .from('player_injuries')
    .select('player_name, team_abbr, position, injury_status, injury_type, short_comment, reported_at')
    .gte('reported_at', since)
    .in('injury_status', ['Out', 'Doubtful', 'IR'])
    .order('reported_at', { ascending: false })
    .limit(30);

  if (error) {
    console.warn(`fetchInjuries: ${error.message}`);
    return [];
  }
  return data || [];
}

async function fetchUpcomingGames(supabase) {
  const now  = new Date().toISOString();
  const soon = daysFromNow(GAMES_DAYS);
  const { data, error } = await supabase
    .from('game_odds_snapshots')
    .select('game_id, home_team, away_team, commence_time, book, market, home_price, away_price, spread, total, captured_at')
    .gte('commence_time', now)
    .lte('commence_time', soon)
    .order('commence_time', { ascending: true });

  if (error) {
    console.warn(`fetchUpcomingGames: ${error.message}`);
    return [];
  }
  return data || [];
}

// ── Analysis helpers ──────────────────────────────────────────────────────────

/**
 * Build top-10 Super Bowl odds table from snapshot rows.
 * Returns array of { team, sharpOdds, publicOdds, consensusProb } sorted by prob.
 */
function buildSBTable(rows) {
  // Get most-recent row per team per book
  const latest = new Map(); // `${team}:${book}` → row
  for (const row of rows) {
    const key = `${row.team}:${row.book}`;
    if (!latest.has(key) || row.captured_at > latest.get(key).captured_at) {
      latest.set(key, row);
    }
  }

  // Group by team
  const byTeam = new Map();
  for (const row of latest.values()) {
    if (!byTeam.has(row.team)) byTeam.set(row.team, []);
    byTeam.get(row.team).push(row);
  }

  const teams = [];
  for (const [team, teamRows] of byTeam) {
    const sharpRow  = teamRows.find(r => SHARP_BOOKS.has(r.book));
    const publicRow = teamRows.find(r => !SHARP_BOOKS.has(r.book));
    const probs     = teamRows
      .map(r => r.implied_prob ?? americanToImplied(r.odds))
      .filter(Boolean);
    const consensusProb = probs.length
      ? probs.reduce((a, b) => a + b, 0) / probs.length
      : null;

    teams.push({
      team,
      sharpOdds:     sharpRow  ? fmtOdds(sharpRow.odds)  : '—',
      publicOdds:    publicRow ? fmtOdds(publicRow.odds) : '—',
      consensusProb: consensusProb ? fmtPct(consensusProb) : '—',
      rawProb:       consensusProb ?? 0,
    });
  }

  return teams
    .sort((a, b) => b.rawProb - a.rawProb)
    .slice(0, 10);
}

/**
 * Identify biggest movers over the window.
 * Returns array of { team, direction, delta, currentOdds, oldOdds }.
 */
function buildMovers(allRows) {
  if (!allRows.length) return [];

  // For each team: oldest row vs newest row (consensus books only)
  const oldest = new Map();
  const newest = new Map();

  for (const row of allRows) {
    const ts = row.captured_at;
    if (!oldest.has(row.team) || ts < oldest.get(row.team).captured_at) {
      oldest.set(row.team, row);
    }
    if (!newest.has(row.team) || ts > newest.get(row.team).captured_at) {
      newest.set(row.team, row);
    }
  }

  const movers = [];
  for (const [team, newRow] of newest) {
    const oldRow = oldest.get(team);
    if (!oldRow || oldRow.captured_at === newRow.captured_at) continue;
    const newProb = newRow.implied_prob ?? americanToImplied(newRow.odds);
    const oldProb = oldRow.implied_prob ?? americanToImplied(oldRow.odds);
    if (!newProb || !oldProb) continue;
    const delta = newProb - oldProb;
    if (Math.abs(delta) < 0.015) continue; // skip tiny noise
    movers.push({
      team,
      direction:   delta > 0 ? '📈' : '📉',
      delta:       `${delta > 0 ? '+' : ''}${(delta * 100).toFixed(1)}pp`,
      currentOdds: fmtOdds(newRow.odds),
      oldOdds:     fmtOdds(oldRow.odds),
    });
  }

  return movers.sort((a, b) => Math.abs(parseFloat(b.delta)) - Math.abs(parseFloat(a.delta))).slice(0, 5);
}

/**
 * Deduplicate game odds and extract consensus spread/total per game.
 */
function buildGamesTable(rows) {
  const games = new Map();
  for (const row of rows) {
    if (!games.has(row.game_id)) {
      games.set(row.game_id, {
        game_id:      row.game_id,
        home_team:    row.home_team,
        away_team:    row.away_team,
        commence_time: row.commence_time,
        spread:       null,
        total:        null,
        moneyline_home: null,
        moneyline_away: null,
      });
    }
    const g = games.get(row.game_id);
    // Prefer DraftKings for display
    if (row.market === 'spread' && row.spread != null) g.spread = row.spread;
    if (row.market === 'total'  && row.total  != null) g.total  = row.total;
    if (row.market === 'moneyline') {
      g.moneyline_home = row.home_price;
      g.moneyline_away = row.away_price;
    }
  }
  return [...games.values()].sort(
    (a, b) => new Date(a.commence_time) - new Date(b.commence_time),
  );
}

// ── HTML template helpers ─────────────────────────────────────────────────────

const CSS = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         background: #0d0d0d; color: #e5e5e5; margin: 0; padding: 0; }
  .wrapper { max-width: 680px; margin: 0 auto; background: #141414; }
  .header  { background: linear-gradient(135deg, #1a3c5e 0%, #0d2137 100%);
             padding: 24px 32px; }
  .header h1 { margin: 0; font-size: 22px; color: #fff; letter-spacing: -0.3px; }
  .header .sub { color: #8db4d4; font-size: 13px; margin-top: 4px; }
  .section { padding: 20px 32px; border-bottom: 1px solid #222; }
  .section:last-child { border-bottom: none; }
  .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase;
                   letter-spacing: 0.8px; color: #5b9bd5; margin: 0 0 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; color: #888; font-weight: 600; padding: 4px 8px 8px 0;
       border-bottom: 1px solid #2a2a2a; }
  td { padding: 6px 8px 6px 0; border-bottom: 1px solid #1e1e1e; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  .team  { font-weight: 700; color: #fff; }
  .up    { color: #4ade80; }
  .down  { color: #f87171; }
  .odds  { font-family: 'SF Mono', 'Consolas', monospace; color: #d1b854; }
  .pct   { font-family: 'SF Mono', 'Consolas', monospace; color: #93c5fd; }
  .tweet { background: #1a1a1a; border-left: 3px solid #1d9bf0;
           padding: 10px 14px; margin-bottom: 10px; border-radius: 0 4px 4px 0; }
  .tweet .handle { color: #1d9bf0; font-size: 12px; font-weight: 700;
                   margin-bottom: 4px; }
  .tweet .tier   { background: #1d9bf044; color: #93c5fd; font-size: 10px;
                   font-weight: 700; padding: 1px 6px; border-radius: 10px;
                   vertical-align: middle; margin-left: 6px; }
  .tweet .text   { font-size: 13px; line-height: 1.5; color: #d4d4d4; }
  .tweet .meta   { font-size: 11px; color: #555; margin-top: 6px; }
  .intel-item    { margin-bottom: 14px; padding-bottom: 14px;
                   border-bottom: 1px solid #1e1e1e; }
  .intel-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  .intel-title   { font-weight: 600; color: #e5e5e5; font-size: 13px; margin-bottom: 4px; }
  .intel-title a { color: #93c5fd; text-decoration: none; }
  .intel-summary { font-size: 12px; color: #888; line-height: 1.5; }
  .intel-meta    { font-size: 11px; color: #555; margin-top: 4px; }
  .conf-high { color: #4ade80; }
  .conf-med  { color: #d1b854; }
  .conf-low  { color: #888; }
  .badge     { display: inline-block; padding: 1px 7px; border-radius: 10px;
               font-size: 10px; font-weight: 700; margin-left: 4px; }
  .badge-out   { background: #7f1d1d; color: #fca5a5; }
  .badge-doubt { background: #78350f; color: #fcd34d; }
  .badge-ir    { background: #1e1b4b; color: #a5b4fc; }
  .footer  { padding: 16px 32px; text-align: center; font-size: 11px; color: #444; }
  .no-data { color: #444; font-style: italic; font-size: 13px; }
`;

function injuryBadge(status) {
  if (status === 'Out')     return '<span class="badge badge-out">OUT</span>';
  if (status === 'Doubtful') return '<span class="badge badge-doubt">DOUBTFUL</span>';
  if (status === 'IR')      return '<span class="badge badge-ir">IR</span>';
  return `<span class="badge" style="background:#222;color:#888;">${status}</span>`;
}

function confClass(conf) {
  if (!conf) return 'conf-low';
  if (conf >= 0.7) return 'conf-high';
  if (conf >= 0.4) return 'conf-med';
  return 'conf-low';
}

function tweetTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function gameTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

// ── Section renderers ─────────────────────────────────────────────────────────

function renderFutures(sbRows, moverRows) {
  const table = buildSBTable(sbRows);
  const movers = buildMovers(moverRows);

  if (!table.length) {
    return `<div class="section">
      <div class="section-title">🏆 Super Bowl Futures</div>
      <p class="no-data">No futures data available.</p>
    </div>`;
  }

  const rows = table.map(t => `
    <tr>
      <td class="team">${t.team}</td>
      <td class="pct">${t.consensusProb}</td>
      <td class="odds">${t.sharpOdds}</td>
      <td class="odds">${t.publicOdds}</td>
    </tr>`).join('');

  const moverHtml = movers.length ? `
    <div style="margin-top:16px;">
      <div class="section-title" style="margin-bottom:10px;">📊 7-Day Movers</div>
      <table>
        <thead><tr>
          <th>Team</th><th>Move</th><th>Now</th><th>Was</th>
        </tr></thead>
        <tbody>${movers.map(m => `
          <tr>
            <td class="team">${m.team}</td>
            <td class="${m.direction === '📈' ? 'up' : 'down'}">${m.direction} ${m.delta}</td>
            <td class="odds">${m.currentOdds}</td>
            <td class="odds">${m.oldOdds}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>` : '';

  return `<div class="section">
    <div class="section-title">🏆 Super Bowl Futures — Top 10</div>
    <table>
      <thead><tr>
        <th>Team</th><th>Consensus %</th><th>Sharp</th><th>Public</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${moverHtml}
  </div>`;
}

function renderTweets(tweets) {
  if (!tweets.length) {
    return `<div class="section">
      <div class="section-title">⚡ Sharp Signals (${TWEET_HOURS}h)</div>
      <p class="no-data">No sharp tweets in the last ${TWEET_HOURS} hours.</p>
    </div>`;
  }

  const items = tweets.slice(0, 8).map(t => `
    <div class="tweet">
      <div class="handle">@${t.author_handle}
        <span class="tier">${(t.author_tier || '').toUpperCase()}</span>
      </div>
      <div class="text">${escapeHtml(t.text || '')}</div>
      <div class="meta">${tweetTime(t.published_at)}${t.tweet_url
        ? ` · <a href="${t.tweet_url}" style="color:#555;">view</a>` : ''}</div>
    </div>`).join('');

  return `<div class="section">
    <div class="section-title">⚡ Sharp Signals (last ${TWEET_HOURS}h)</div>
    ${items}
  </div>`;
}

function renderIntel(notes) {
  if (!notes.length) {
    return `<div class="section">
      <div class="section-title">📰 Intel Digest (${INTEL_DAYS}d)</div>
      <p class="no-data">No research notes in the last ${INTEL_DAYS} days.</p>
    </div>`;
  }

  const items = notes.slice(0, 8).map(n => {
    const titleEl = n.url
      ? `<a href="${n.url}">${escapeHtml(n.title || 'Untitled')}</a>`
      : escapeHtml(n.title || 'Untitled');
    const confEl = n.confidence != null
      ? `<span class="${confClass(n.confidence)}">${Math.round(n.confidence * 100)}% conf</span> · `
      : '';
    const source = n.source ? `<strong>${escapeHtml(n.source)}</strong> · ` : '';
    return `<div class="intel-item">
      <div class="intel-title">${titleEl}</div>
      ${n.summary ? `<div class="intel-summary">${escapeHtml(n.summary)}</div>` : ''}
      <div class="intel-meta">${source}${confEl}${n.published_at
        ? new Date(n.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : ''}</div>
    </div>`;
  }).join('');

  return `<div class="section">
    <div class="section-title">📰 Intel Digest (last ${INTEL_DAYS} days)</div>
    ${items}
  </div>`;
}

function renderInjuries(injuries) {
  if (!injuries.length) return ''; // hidden in offseason

  // Group by team
  const byTeam = new Map();
  for (const inj of injuries) {
    if (!byTeam.has(inj.team_abbr)) byTeam.set(inj.team_abbr, []);
    byTeam.get(inj.team_abbr).push(inj);
  }

  const rows = [...byTeam.entries()].sort((a, b) => a[0].localeCompare(b[0])).flatMap(
    ([team, players]) => players.map(p => `
      <tr>
        <td class="team">${team}</td>
        <td>${escapeHtml(p.player_name)} <em style="color:#666;font-size:11px;">${p.position || ''}</em></td>
        <td>${injuryBadge(p.injury_status)}</td>
        <td style="color:#888;font-size:12px;">${escapeHtml(p.injury_type || p.short_comment || '—')}</td>
      </tr>`),
  ).join('');

  return `<div class="section">
    <div class="section-title">🏥 Injury Report</div>
    <table>
      <thead><tr>
        <th>Team</th><th>Player</th><th>Status</th><th>Type</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function renderGames(gameRows) {
  const games = buildGamesTable(gameRows);
  if (!games.length) return ''; // hidden in offseason

  const rows = games.map(g => {
    const spreadStr = g.spread != null
      ? (g.spread < 0 ? `${g.home_team} ${g.spread}` : `${g.away_team} -${g.spread}`)
      : '—';
    return `<tr>
      <td style="color:#888;font-size:12px;">${gameTime(g.commence_time)}</td>
      <td class="team">${g.away_team} @ ${g.home_team}</td>
      <td class="odds">${spreadStr}</td>
      <td class="odds">${g.total != null ? `O/U ${g.total}` : '—'}</td>
      <td class="odds" style="font-size:12px;">${fmtOdds(g.moneyline_away)} / ${fmtOdds(g.moneyline_home)}</td>
    </tr>`;
  }).join('');

  return `<div class="section">
    <div class="section-title">🎲 Upcoming Games (next ${GAMES_DAYS} days)</div>
    <table>
      <thead><tr>
        <th>Time (PST)</th><th>Game</th><th>Spread</th><th>Total</th><th>ML</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Email builder ─────────────────────────────────────────────────────────────

function buildEmail(sections) {
  const today = nowStr();
  const body = sections.join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>NFL Daily Brief</title>
  <style>${CSS}</style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🏈 NFL Daily Brief</h1>
      <div class="sub">${today} · andrewlrose@gmail.com</div>
    </div>
    ${body}
    <div class="footer">
      Generated by NFL Dashboard · <a href="https://github.com/andrewlrose/NFL_Dashboard" style="color:#333;">github.com/andrewlrose/NFL_Dashboard</a>
    </div>
  </div>
</body>
</html>`;
}

function buildPlainText(sbTable, tweets, notes, injuries, games) {
  const lines = [`NFL Daily Brief — ${nowStr()}`, ''];

  if (sbTable.length) {
    lines.push('SUPER BOWL FUTURES', '─'.repeat(40));
    sbTable.forEach(t => {
      lines.push(`${t.team.padEnd(5)} ${t.consensusProb.padEnd(8)} Sharp: ${t.sharpOdds}  Public: ${t.publicOdds}`);
    });
    lines.push('');
  }

  if (tweets.length) {
    lines.push(`SHARP SIGNALS (last ${TWEET_HOURS}h)`, '─'.repeat(40));
    tweets.slice(0, 5).forEach(t => {
      lines.push(`@${t.author_handle} [${t.author_tier}]`);
      lines.push(t.text || '');
      lines.push('');
    });
  }

  if (notes.length) {
    lines.push(`INTEL DIGEST (last ${INTEL_DAYS}d)`, '─'.repeat(40));
    notes.slice(0, 5).forEach(n => {
      lines.push(`• ${n.title || 'Untitled'} (${n.source || ''})`);
      if (n.summary) lines.push(`  ${n.summary}`);
    });
    lines.push('');
  }

  if (injuries.length) {
    lines.push('INJURY REPORT', '─'.repeat(40));
    injuries.slice(0, 10).forEach(i => {
      lines.push(`${i.team_abbr} — ${i.player_name} (${i.position || ''}): ${i.injury_status}`);
    });
    lines.push('');
  }

  if (games.length) {
    const gamesTable = buildGamesTable(games);
    if (gamesTable.length) {
      lines.push(`UPCOMING GAMES (next ${GAMES_DAYS}d)`, '─'.repeat(40));
      gamesTable.forEach(g => {
        lines.push(`${g.away_team} @ ${g.home_team} — ${gameTime(g.commence_time)}`);
      });
      lines.push('');
    }
  }

  return lines.join('\n');
}

// ── Mailer ────────────────────────────────────────────────────────────────────

async function sendEmail(subject, htmlBody, textBody) {
  if (!GMAIL_ADDR || !GMAIL_PASS) {
    throw new Error(
      'GMAIL_ADDRESS and GMAIL_APP_PASSWORD env vars are required to send email.',
    );
  }

  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user: GMAIL_ADDR, pass: GMAIL_PASS },
  });

  const info = await transport.sendMail({
    from: `"NFL Dashboard" <${GMAIL_ADDR}>`,
    to:   TO_EMAIL,
    subject,
    html: htmlBody,
    text: textBody,
  });

  return info.messageId;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${DRY_RUN ? '[DRY RUN] ' : ''}NFL Daily Brief — ${dateStr()}`);
  console.log('='.repeat(55));

  const supabase = getSupabase();

  // Fetch all data in parallel
  console.log('Fetching data from Supabase...');
  const [sbSnaps, sbMovers, tweets, notes, injuries, gameRows] = await Promise.all([
    fetchFuturesSnapshot(supabase),
    fetchFuturesMovers(supabase),
    fetchSharpTweets(supabase),
    fetchIntelNotes(supabase),
    fetchInjuries(supabase),
    fetchUpcomingGames(supabase),
  ]);

  console.log(`  SB snapshots:  ${sbSnaps.length} rows`);
  console.log(`  Sharp tweets:  ${tweets.length} rows`);
  console.log(`  Intel notes:   ${notes.length} rows`);
  console.log(`  Injuries:      ${injuries.length} rows`);
  console.log(`  Upcoming games:${gameRows.length} rows`);

  // Build SB table for plain text
  const sbTable = buildSBTable(sbSnaps);

  // Render HTML sections
  const sections = [
    renderFutures(sbSnaps, sbMovers),
    renderTweets(tweets),
    renderIntel(notes),
    renderInjuries(injuries),
    renderGames(gameRows),
  ];

  const htmlBody = buildEmail(sections);
  const textBody = buildPlainText(sbTable, tweets, notes, injuries, gameRows);

  const today   = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  const subject = `🏈 NFL Brief — ${today}`;

  if (DRY_RUN) {
    console.log(`\nSubject: ${subject}`);
    console.log('─'.repeat(55));
    console.log(textBody);
    console.log('\n[HTML body generated — add --email flag or remove --dry-run to send]');
  } else {
    console.log(`\nSending to ${TO_EMAIL}...`);
    const msgId = await sendEmail(subject, htmlBody, textBody);
    console.log(`✓ Sent — message ID: ${msgId}`);
  }

  // Write receipt
  await mkdir(RECEIPTS_DIR, { recursive: true });
  const receipt = {
    agent:    'nfl-daily-brief',
    run_at:   new Date().toISOString(),
    dry_run:  DRY_RUN,
    to:       DRY_RUN ? null : TO_EMAIL,
    subject,
    stats: {
      sb_snapshots: sbSnaps.length,
      sharp_tweets: tweets.length,
      intel_notes:  notes.length,
      injuries:     injuries.length,
      game_rows:    gameRows.length,
    },
    success: true,
  };
  const receiptFile = path.join(
    RECEIPTS_DIR,
    `nfl-daily-brief-${dateStr()}.json`,
  );
  await writeFile(receiptFile, JSON.stringify(receipt, null, 2));
  console.log(`Receipt: ${receiptFile}`);
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
