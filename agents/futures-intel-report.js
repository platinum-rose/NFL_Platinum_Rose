// agents/futures-intel-report.js
// ═══════════════════════════════════════════════════════════════════════════════
// F-20: Futures Intel Report Agent
//
// Generates a Markdown Futures Intel Report three times per week from:
//   • futures_odds_snapshots  — current consensus lines + 7-day movement
//   • research_intel_notes    — expert futures articles (last 30 days)
//   • research_pick_signals   — futures-specific pick signals
//   • x_sharp_tweets          — sharp X/Twitter futures signals (last 7 days)
//
// Writes report to vault_notes at:
//   NFL/Futures/FuturesIntel-YYYY-MM-DD.md   (dated)
//   NFL/Futures/FuturesIntel-Latest.md        (always-current alias)
//
// Schedule: Mon/Wed/Fri 14:00 UTC (see .github/workflows/futures-intel-report.yml)
//
// Usage:
//   node agents/futures-intel-report.js [--dry-run]
//
// Env vars:
//   SUPABASE_URL              (required)
//   SUPABASE_SERVICE_ROLE_KEY (required)
//   REPORT_LOOKBACK_DAYS      default: 7  (tweets + movement window)
//   INTEL_LOOKBACK_DAYS       default: 30 (research articles window)
// ═══════════════════════════════════════════════════════════════════════════════

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { ensureVaultFrontmatter } from './lib/vaultFrontmatter.js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT         = path.resolve(__dirname, '..');
const RECEIPTS_DIR = path.join(ROOT, '.nfl', 'receipts');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN      = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';
const SIGNAL_DAYS  = Number(process.env.REPORT_LOOKBACK_DAYS ?? 7);
const INTEL_DAYS   = Number(process.env.INTEL_LOOKBACK_DAYS ?? 30);

// Sharp books (consensus-setter tier) vs public (retail-facing)
const SHARP_BOOKS  = new Set(['betonline', 'bookmaker']);
const PUBLIC_BOOKS = new Set(['draftkings', 'fanduel', 'betmgm', 'caesars']);

// Divergence threshold (implied probability %) to flag a value spot
const DIVERGENCE_THRESHOLD = 0.08; // 8 percentage points

// Market display labels and ordering
const MARKET_LABELS = {
  superbowl:              'Super Bowl Winner',
  conference_afc:         'AFC Championship',
  conference_nfc:         'NFC Championship',
  division_afc_east:      'AFC East',
  division_afc_north:     'AFC North',
  division_afc_south:     'AFC South',
  division_afc_west:      'AFC West',
  division_nfc_east:      'NFC East',
  division_nfc_north:     'NFC North',
  division_nfc_south:     'NFC South',
  division_nfc_west:      'NFC West',
  wins:                   'Regular Season Win Total',
  playoffs:               'Make the Playoffs',
  superbowl_matchup:      'Exact Super Bowl Matchup',
  award_mvp:              'MVP Award',
  award_offensive_player_of_year: 'Offensive Player of the Year',
  award_defensive_player_of_year: 'Defensive Player of the Year',
  award_offensive_rookie_of_year: 'Offensive Rookie of the Year',
  award_defensive_rookie_of_year: 'Defensive Rookie of the Year',
  award_comeback_player_of_year:  'Comeback Player of the Year',
  award_coach_of_year:    'Coach of the Year',
};

// Keywords that flag a research article as futures-relevant
const FUTURES_KEYWORDS = [
  'super bowl odds', 'futures', 'win total', 'championship odds',
  'division odds', 'playoff odds', 'mvp odds', 'outright',
  'early lines', 'season projection', 'title contender',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function nowIso() {
  return new Date().toISOString();
}

function dateStr(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

/** Convert American odds integer to implied probability [0, 1]. */
function americanToImplied(american) {
  if (american > 0) return 100 / (american + 100);
  return Math.abs(american) / (Math.abs(american) + 100);
}

/** Convert implied probability [0, 1] to American odds integer (rounded). */
function impliedToAmerican(prob) {
  if (prob <= 0 || prob >= 1) return null;
  if (prob >= 0.5) return -Math.round((prob / (1 - prob)) * 100);
  return Math.round(((1 - prob) / prob) * 100);
}

/** Format American odds for display: +150, -200, ±0 → 'n/a'. */
function fmtOdds(american) {
  if (american == null || isNaN(american)) return 'n/a';
  return american >= 0 ? `+${american}` : `${american}`;
}

/** Format implied probability as percentage string: 0.333 → '33.3%'. */
function fmtPct(prob) {
  if (prob == null || isNaN(prob)) return '—';
  return `${(prob * 100).toFixed(1)}%`;
}

/** Format a signed implied-prob delta for display. */
function fmtDelta(delta) {
  if (delta == null || isNaN(delta)) return '—';
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${(delta * 100).toFixed(1)}pp`;
}

/** Return true if the text contains a futures-relevant keyword. */
function isFuturesRelevant(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return FUTURES_KEYWORDS.some(kw => lower.includes(kw));
}

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
}

// ── Data fetchers ─────────────────────────────────────────────────────────────

/**
 * Fetch all futures snapshots from the past SIGNAL_DAYS × 2 days so we can
 * compare most-recent vs earliest-in-window for movement calculations.
 * Returns an array of raw snapshot rows.
 */
async function fetchSnapshots(supabase) {
  const since = new Date(
    Date.now() - SIGNAL_DAYS * 2 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from('futures_odds_snapshots')
    .select('market_type, team, book, odds, implied_prob, captured_at, season')
    .gte('captured_at', since)
    .order('captured_at', { ascending: true });

  if (error) throw new Error(`fetchSnapshots: ${error.message}`);
  return data || [];
}

/**
 * Fetch futures-relevant research intel notes from the past INTEL_DAYS days.
 */
async function fetchIntelNotes(supabase) {
  const since = new Date(
    Date.now() - INTEL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from('research_intel_notes')
    .select('id, source, title, summary, url, published_at, confidence')
    .gte('captured_at', since)
    .order('published_at', { ascending: false })
    .limit(200);

  if (error) throw new Error(`fetchIntelNotes: ${error.message}`);
  const rows = data || [];
  return rows.filter(r =>
    isFuturesRelevant(r.title) || isFuturesRelevant(r.summary),
  );
}

/**
 * Fetch futures-relevant pick signals (joined to intel notes already filtered).
 */
async function fetchPickSignals(supabase, noteIds) {
  if (noteIds.length === 0) return [];
  const since = new Date(
    Date.now() - INTEL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from('research_pick_signals')
    .select(
      'note_id, source, team_or_market, bet_type, lean, rationale, confidence, captured_at',
    )
    .in('note_id', noteIds)
    .gte('captured_at', since)
    .order('confidence', { ascending: false })
    .limit(50);

  if (error) throw new Error(`fetchPickSignals: ${error.message}`);
  return data || [];
}

/**
 * Fetch sharp tweets mentioning futures topics from the past SIGNAL_DAYS days.
 */
async function fetchSharpTweets(supabase) {
  const since = new Date(
    Date.now() - SIGNAL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from('x_sharp_tweets')
    .select('author_handle, author_tier, text, tweet_url, published_at')
    .gte('captured_at', since)
    .in('author_tier', ['sharp', 'analyst'])
    .order('published_at', { ascending: false })
    .limit(300);

  if (error) throw new Error(`fetchSharpTweets: ${error.message}`);
  const rows = data || [];
  return rows.filter(r => isFuturesRelevant(r.text));
}

// ── Analysis ──────────────────────────────────────────────────────────────────

/**
 * Group snapshots into a nested map:
 *   marketType → team → { recent: { book → row }, oldest: { book → row } }
 *
 * "Recent" = snapshots within the last 24h.
 * "Oldest" = snapshots from earliest bucket in the window (for movement calc).
 */
function groupSnapshots(rows) {
  const cutoffRecent = Date.now() - 24 * 60 * 60 * 1000;
  const cutoffOld    = Date.now() - SIGNAL_DAYS * 24 * 60 * 60 * 1000;

  // marketType → team → bucket ('recent'|'old') → book → row
  const grouped = new Map();

  for (const row of rows) {
    const ts = new Date(row.captured_at || row.snapshot_time).getTime();
    const bucket = ts >= cutoffRecent ? 'recent' : (ts >= cutoffOld ? 'old' : null);
    if (!bucket) continue;

    if (!grouped.has(row.market_type)) grouped.set(row.market_type, new Map());
    const marketMap = grouped.get(row.market_type);

    if (!marketMap.has(row.team)) marketMap.set(row.team, { recent: {}, old: {} });
    const teamData = marketMap.get(row.team);

    // Keep the most recent row per (bucket, book)
    const existing = teamData[bucket][row.book];
    const rowTime  = ts;
    const existTime = existing
      ? new Date(existing.captured_at || existing.snapshot_time).getTime()
      : 0;

    if (!existing || (bucket === 'recent' && rowTime > existTime)) {
      teamData[bucket][row.book] = row;
    } else if (bucket === 'old' && rowTime < existTime) {
      teamData[bucket][row.book] = row;
    }
  }

  return grouped;
}

/**
 * Compute consensus line and sharp/public divergence for a team in a market.
 * Returns:
 *   { consensus, sharpImplied, publicImplied, divergence, allBooks }
 */
function computeTeamLine(recentBooks) {
  const bookEntries = Object.entries(recentBooks);
  if (bookEntries.length === 0) return null;

  const allProbs    = [];
  const sharpProbs  = [];
  const publicProbs = [];

  for (const [book, row] of bookEntries) {
    const prob = row.implied_prob != null
      ? Number(row.implied_prob)
      : americanToImplied(row.odds);
    if (isNaN(prob) || prob <= 0 || prob >= 1) continue;
    allProbs.push(prob);
    if (SHARP_BOOKS.has(book))  sharpProbs.push(prob);
    if (PUBLIC_BOOKS.has(book)) publicProbs.push(prob);
  }

  if (allProbs.length === 0) return null;

  const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  const consensus    = avg(allProbs);
  const sharpImplied = sharpProbs.length  > 0 ? avg(sharpProbs)  : null;
  const publicImplied = publicProbs.length > 0 ? avg(publicProbs) : null;
  const divergence = (sharpImplied != null && publicImplied != null)
    ? sharpImplied - publicImplied
    : null;

  // Build per-book odds map for table display
  const allBooks = {};
  for (const [book, row] of bookEntries) {
    allBooks[book] = row.odds;
  }

  return {
    consensus,
    sharpImplied,
    publicImplied,
    divergence,
    allBooks,
  };
}

/**
 * Build a sorted array of team summaries for a market, including movement.
 * Sorted by consensus implied probability descending (favorites first).
 */
function buildMarketSummary(marketMap) {
  const teams = [];

  for (const [team, buckets] of marketMap.entries()) {
    const line = computeTeamLine(buckets.recent);
    if (!line) continue;

    // Movement: consensus now vs consensus 7 days ago
    const oldLine = Object.keys(buckets.old).length > 0
      ? computeTeamLine(buckets.old)
      : null;
    const movement = (oldLine != null)
      ? line.consensus - oldLine.consensus
      : null;

    teams.push({
      team,
      consensus:     line.consensus,
      sharpImplied:  line.sharpImplied,
      publicImplied: line.publicImplied,
      divergence:    line.divergence,
      allBooks:      line.allBooks,
      movement,
    });
  }

  // Sort favorites first (highest implied prob)
  return teams.sort((a, b) => b.consensus - a.consensus);
}

// ── Markdown builders ─────────────────────────────────────────────────────────

function buildMarketTable(teams, topN = 10) {
  const rows = teams.slice(0, topN);
  if (rows.length === 0) return '_No data available._\n';

  const lines = [];
  lines.push(
    '| Team | Consensus | Implied % | DraftKings | FanDuel | BetOnline | Bookmaker | 7d Δ |',
    '|------|-----------|-----------|-----------|---------|-----------|----------|------|',
  );

  for (const t of rows) {
    const dk  = fmtOdds(t.allBooks['draftkings']);
    const fd  = fmtOdds(t.allBooks['fanduel']);
    const bol = fmtOdds(t.allBooks['betonline']);
    const bm  = fmtOdds(t.allBooks['bookmaker']);
    const chg = t.movement != null ? fmtDelta(t.movement) : '—';
    lines.push(
      `| ${t.team} | ${fmtOdds(impliedToAmerican(t.consensus))} | ${fmtPct(t.consensus)} | ${dk} | ${fd} | ${bol} | ${bm} | ${chg} |`,
    );
  }

  return lines.join('\n') + '\n';
}

function buildMovementSection(grouped) {
  // Collect all movers: (market, team, delta)
  const movers = [];

  for (const [marketType, marketMap] of grouped.entries()) {
    const teams = buildMarketSummary(marketMap);
    for (const t of teams) {
      if (t.movement != null && Math.abs(t.movement) >= 0.01) {
        movers.push({ marketType, team: t.team, delta: t.movement, consensus: t.consensus });
      }
    }
  }

  if (movers.length === 0) return '_No significant line movement in the past 7 days._\n';

  // Sort: biggest absolute move first
  movers.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const lines = [
    '| Market | Team | Current | 7d Δ | Direction |',
    '|--------|------|---------|------|-----------|',
  ];

  for (const m of movers.slice(0, 20)) {
    const label = MARKET_LABELS[m.marketType] || m.marketType;
    const dir   = m.delta >= 0 ? '📈 Shortening' : '📉 Drifting';
    lines.push(
      `| ${label} | ${m.team} | ${fmtPct(m.consensus)} | ${fmtDelta(m.delta)} | ${dir} |`,
    );
  }

  return lines.join('\n') + '\n';
}

function buildValueSpotsSection(grouped) {
  const spots = [];

  for (const [marketType, marketMap] of grouped.entries()) {
    const teams = buildMarketSummary(marketMap);
    for (const t of teams) {
      if (t.divergence != null && Math.abs(t.divergence) >= DIVERGENCE_THRESHOLD) {
        spots.push({
          marketType,
          team:          t.team,
          divergence:    t.divergence,
          sharpImplied:  t.sharpImplied,
          publicImplied: t.publicImplied,
          consensus:     t.consensus,
        });
      }
    }
  }

  if (spots.length === 0) return '_No sharp/public divergence ≥8pp detected._\n';

  spots.sort((a, b) => Math.abs(b.divergence) - Math.abs(a.divergence));

  const lines = [
    '| Market | Team | Sharp % | Public % | Gap | Signal |',
    '|--------|------|---------|----------|-----|--------|',
  ];

  for (const s of spots.slice(0, 15)) {
    const label  = MARKET_LABELS[s.marketType] || s.marketType;
    const signal = s.divergence > 0
      ? '🔪 **Sharp Lean** (sharps higher than retail)'
      : '🚨 **Overbet** (retail higher than sharps)';
    lines.push(
      `| ${label} | ${s.team} | ${fmtPct(s.sharpImplied)} | ${fmtPct(s.publicImplied)} | ${fmtDelta(s.divergence)} | ${signal} |`,
    );
  }

  return lines.join('\n') + '\n';
}

function buildIntelSection(notes, signals) {
  if (notes.length === 0 && signals.length === 0) {
    return '_No futures-relevant expert intel in the past 30 days._\n';
  }

  const lines = [];

  if (signals.length > 0) {
    lines.push('### Pick Signals\n');
    for (const s of signals.slice(0, 10)) {
      const conf = s.confidence ? ` *(${Math.round(s.confidence * 100)}% confidence)*` : '';
      lines.push(
        `- **${s.team_or_market}** — ${s.lean.toUpperCase()} [${s.bet_type}]${conf}`,
      );
      if (s.rationale) lines.push(`  > ${s.rationale}`);
    }
    lines.push('');
  }

  if (notes.length > 0) {
    lines.push('### Recent Articles\n');
    for (const n of notes.slice(0, 15)) {
      const pub = n.published_at ? n.published_at.slice(0, 10) : '?';
      lines.push(`- **${n.source}** (${pub}) — [${n.title || 'Article'}](${n.url})`);
      if (n.summary) lines.push(`  > ${n.summary.slice(0, 200)}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function buildTweetsSection(tweets) {
  if (tweets.length === 0) {
    return '_No futures-relevant sharp tweets in the past 7 days._\n';
  }

  const lines = [];
  for (const t of tweets.slice(0, 20)) {
    const pub = t.published_at ? t.published_at.slice(0, 10) : '?';
    lines.push(
      `- **@${t.author_handle}** (${pub}) — [tweet](${t.tweet_url})`,
      `  > ${t.text.slice(0, 280).replace(/\n/g, ' ')}`,
      '',
    );
  }

  return lines.join('\n');
}

// ── Full report ───────────────────────────────────────────────────────────────

function buildReport(grouped, intelNotes, pickSignals, sharpTweets, reportDate) {
  const lines = [];

  lines.push(
    `# NFL Futures Intel Report — ${reportDate}`,
    '',
    `> Auto-generated Mon/Wed/Fri | Intel window: ${INTEL_DAYS}d articles, ${SIGNAL_DAYS}d signals`,
    `> Sharp books: BetOnline, Bookmaker | Public books: DraftKings, FanDuel`,
    '',
  );

  // ── Per-market sections ────────────────────────────────────────────────────
  const SECTION_ORDER = [
    'superbowl',
    'conference_afc', 'conference_nfc',
    'division_afc_east', 'division_afc_north', 'division_afc_south', 'division_afc_west',
    'division_nfc_east', 'division_nfc_north', 'division_nfc_south', 'division_nfc_west',
    'wins', 'playoffs', 'superbowl_matchup',
    'award_mvp', 'award_offensive_player_of_year', 'award_defensive_player_of_year',
    'award_offensive_rookie_of_year', 'award_defensive_rookie_of_year',
    'award_comeback_player_of_year', 'award_coach_of_year',
  ];

  // Markets present in data but not in the order list (future-proofing)
  const extra = [...grouped.keys()].filter(k => !SECTION_ORDER.includes(k));
  const allOrdered = [...SECTION_ORDER, ...extra];

  for (const marketType of allOrdered) {
    if (!grouped.has(marketType)) continue;
    const marketMap = grouped.get(marketType);
    const label     = MARKET_LABELS[marketType] || marketType;
    const teams     = buildMarketSummary(marketMap);

    // Division / award markets: show all; flagship markets: top 10
    const topN = marketType.startsWith('division_') ? 4 : 10;

    lines.push(`## ${label}`, '');
    lines.push(buildMarketTable(teams, topN));
  }

  // ── Line Movement ──────────────────────────────────────────────────────────
  lines.push('## Line Movement (7-Day)', '');
  lines.push(buildMovementSection(grouped));

  // ── Value Spots ────────────────────────────────────────────────────────────
  lines.push(`## Value Spots (Sharp/Public Divergence ≥${Math.round(DIVERGENCE_THRESHOLD * 100)}pp)`, '');
  lines.push(buildValueSpotsSection(grouped));

  // ── Expert Intel ──────────────────────────────────────────────────────────
  lines.push('## Expert Intel', '');
  lines.push(buildIntelSection(intelNotes, pickSignals));

  // ── Sharp Action ──────────────────────────────────────────────────────────
  lines.push('## Sharp X/Twitter Action', '');
  lines.push(buildTweetsSection(sharpTweets));

  // ── Footer ─────────────────────────────────────────────────────────────────
  lines.push(
    '---',
    `_Report generated at ${nowIso()} UTC. Data from TheOddsAPI snapshots and curated intel sources._`,
    '',
  );

  return lines.join('\n');
}

// ── Vault write ───────────────────────────────────────────────────────────────

async function writeToVault(supabase, content, reportDate) {
  const datedPath  = `NFL/Futures/FuturesIntel-${reportDate}.md`;
  const latestPath = 'NFL/Futures/FuturesIntel-Latest.md';

  const sanitized = content
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[\uD800-\uDFFF]/g, '');

  const upserts = [
    { path: datedPath,  tags: ['futures', 'intel', 'auto-report'] },
    { path: latestPath, tags: ['futures', 'intel', 'latest', 'auto-report'] },
  ];

  for (const { path: notePath, tags } of upserts) {
    const noteContent = ensureVaultFrontmatter(sanitized, {
      title: `NFL Futures Intel Report - ${reportDate}`,
      sourceSystem: 'futures-intel-report',
      sourceType: 'futures-report',
      tags,
    });
    const { error } = await supabase
      .from('vault_notes')
      .upsert(
        { path: notePath, content: noteContent, tags, source: 'agent' },
        { onConflict: 'path' },
      );
    if (error) throw new Error(`Vault write to ${notePath}: ${error.message}`);
    console.log(`  [OK] vault → ${notePath}`);
  }
}

async function writeReceipt(receipt) {
  await mkdir(RECEIPTS_DIR, { recursive: true });
  const ts    = nowIso().replace(/[:.]/g, '-');
  const fpath = path.join(RECEIPTS_DIR, `futures-intel-${ts}.json`);
  await writeFile(fpath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
  return fpath;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const startTime  = Date.now();
  const reportDate = dateStr();

  console.log(`🏈 FuturesIntelReport starting — ${reportDate}`);
  console.log(`   Intel window : ${INTEL_DAYS}d articles | ${SIGNAL_DAYS}d signals`);
  console.log(`   Dry run      : ${DRY_RUN}`);

  const supabase = getSupabase();

  // ── Fetch all data ─────────────────────────────────────────────────────────
  console.log('\n📥 Fetching data…');

  const [snapshots, intelNotes, sharpTweets] = await Promise.all([
    fetchSnapshots(supabase),
    fetchIntelNotes(supabase),
    fetchSharpTweets(supabase),
  ]);

  const noteIds = intelNotes.map(n => n.id);
  const pickSignals = await fetchPickSignals(supabase, noteIds);

  console.log(`   Snapshots    : ${snapshots.length} rows`);
  console.log(`   Intel notes  : ${intelNotes.length} futures-relevant`);
  console.log(`   Pick signals : ${pickSignals.length}`);
  console.log(`   Sharp tweets : ${sharpTweets.length} futures-relevant`);

  // ── Analyse ────────────────────────────────────────────────────────────────
  const grouped = groupSnapshots(snapshots);
  console.log(`\n📊 Markets with data: ${grouped.size}`);
  for (const [m, teams] of grouped.entries()) {
    console.log(`   ${m}: ${teams.size} teams`);
  }

  // ── Build report ───────────────────────────────────────────────────────────
  const report = buildReport(grouped, intelNotes, pickSignals, sharpTweets, reportDate);
  console.log(`\n📝 Report built — ${report.length} chars`);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Skipping vault write. Report preview (first 500 chars):');
    console.log(report.slice(0, 500));
    console.log('…');
  } else {
    console.log('\n💾 Writing to vault…');
    await writeToVault(supabase, report, reportDate);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const receipt = {
    run_at:             nowIso(),
    dry_run:            DRY_RUN,
    report_date:        reportDate,
    signal_days:        SIGNAL_DAYS,
    intel_days:         INTEL_DAYS,
    snapshots_fetched:  snapshots.length,
    markets_with_data:  grouped.size,
    intel_notes:        intelNotes.length,
    pick_signals:       pickSignals.length,
    sharp_tweets:       sharpTweets.length,
    report_chars:       report.length,
    elapsed_s:          Number(elapsed),
  };

  const rcptPath = await writeReceipt(receipt);
  console.log(`\n✅ Done in ${elapsed}s | receipt → ${path.basename(rcptPath)}`);
}

main().catch(err => {
  console.error('[futures-intel-report] Fatal:', err.message);
  process.exit(1);
});
