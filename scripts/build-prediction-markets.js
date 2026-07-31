#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  calculateNetOdds,
} from '../src/lib/predictionMarkets.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'data', 'prediction-markets');
const DOCS_DIR = path.join(ROOT, 'docs', 'prediction-markets');

const KALSHI_BASE = 'https://api.elections.kalshi.com/trade-api/v2';
const POLYMARKET_BASE = 'https://gamma-api.polymarket.com';

function todayPacificDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}

function nowIso() {
  return new Date().toISOString();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const SAMPLE_BENCHMARKS = {
  KC: { book: 'BetOnline', odds: '+550' },
  SF: { book: 'BetOnline', odds: '+600' },
  DET: { book: 'BetOnline', odds: '-135' },
  BAL: { book: 'BetOnline', odds: '+700' },
  BUF: { book: 'BetOnline', odds: '+800' },
  PHI: { book: 'BetOnline', odds: '+650' },
  GB: { book: 'BetOnline', odds: '+1200' },
};

// Stable NFL outright series roots (fallback floor). Runtime discovery via
// GET /series?category=Sports unions any additional KXNFL* series so new markets
// self-add. Roots can drift year to year — discovery is the source of truth.
const KALSHI_NFL_SERIES_ROOTS = [
  'KXNFLCHAMP',
  'KXSBWINNER',
  'KXNFLCONF',
  'KXNFLDIV',
  'KXNFLWINS',
  'KXNFLPLAYOFF',
];

// Polymarket keyword-search terms for NFL outright discovery (public-search supports q).
const POLYMARKET_NFL_SEARCH_TERMS = ['Super Bowl', 'NFL division', 'NFL conference', 'NFL win total'];

const FETCH_HEADERS = { Accept: 'application/json', 'User-Agent': 'NFLDashboard/1.0' };

// Classify a contract into a dossier market_type from its title/series text.
function inferMarketType(text) {
  const s = String(text || '').toLowerCase();
  if (/super\s?bowl|sb\b|win the super bowl|kxsbwinner|kxnflchamp/.test(s)) return 'super_bowl';
  if (/conference|afc champ|nfc champ|kxnflconf/.test(s)) return 'conference';
  if (/division|kxnfldiv/.test(s)) return 'division';
  if (/make (the )?playoffs|miss (the )?playoffs|reach the playoffs|kxnflplayoff/.test(s)) {
    return 'make_playoffs';
  }
  if (/win total|regular[- ]season wins|total wins|\bo\/u\b.*wins|kxnflwins|\bwins\b/.test(s)) {
    return 'win_totals';
  }
  return 'general';
}

// Discover NFL series roots at runtime, unioned with the hard-coded floor.
async function discoverKalshiNflSeries() {
  const roots = new Set(KALSHI_NFL_SERIES_ROOTS);
  try {
    const res = await fetch(`${KALSHI_BASE}/series?category=Sports`, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const payload = await res.json();
      for (const s of payload.series || []) {
        const ticker = s.ticker || s.series_ticker || '';
        const title = s.title || '';
        if (/^KXNFL/i.test(ticker) || /\bnfl\b|super bowl|afc|nfc/i.test(`${title} ${ticker}`)) {
          if (ticker) roots.add(ticker);
        }
      }
    }
  } catch (err) {
    console.warn('Kalshi series discovery fallback:', err.message);
  }
  return [...roots];
}

async function fetchKalshiNflMarkets() {
  const seriesRoots = await discoverKalshiNflSeries();
  const contracts = [];
  const MAX_PAGES = 20;

  for (const seriesTicker of seriesRoots) {
    let cursor = null;
    let pages = 0;
    do {
      let payload;
      try {
        const url = new URL(`${KALSHI_BASE}/markets`);
        url.searchParams.set('series_ticker', seriesTicker);
        url.searchParams.set('status', 'open');
        url.searchParams.set('limit', '100');
        if (cursor) url.searchParams.set('cursor', cursor);
        const res = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(10000) });
        if (!res.ok) break;
        payload = await res.json();
      } catch {
        break; // Series failed — skip to next, never abort the whole run
      }

      for (const m of payload.markets || []) {
        const yesAskCents = m.yes_ask_dollars ? Math.round(parseFloat(m.yes_ask_dollars) * 100) : null;
        const yesBidCents = m.yes_bid_dollars ? Math.round(parseFloat(m.yes_bid_dollars) * 100) : null;
        const lastCents = m.last_price_dollars
          ? Math.round(parseFloat(m.last_price_dollars) * 100)
          : yesAskCents || 50;

        if (!lastCents || lastCents <= 0 || lastCents >= 100) continue;

        const netEval = calculateNetOdds({ priceCents: lastCents, exchange: 'kalshi', applyFee: true });

        contracts.push({
          id: `kalshi_${m.ticker}`,
          title: m.title || m.yes_sub_title || seriesTicker,
          ticker: m.ticker,
          series_ticker: seriesTicker,
          exchange: 'kalshi',
          market_type: inferMarketType(`${m.title || ''} ${m.yes_sub_title || ''} ${seriesTicker}`),
          price_cents: lastCents,
          yes_bid_cents: yesBidCents,
          yes_ask_cents: yesAskCents,
          gross_american_odds: netEval.grossAmericanOdds,
          net_american_odds: netEval.netAmericanOdds,
          decimal_odds: netEval.decimalOdds,
          implied_probability_pct: Number((netEval.grossProb * 100).toFixed(1)),
          volume_24h: Math.round(parseFloat(m.volume_24h_fp || m.volume_24h || '0')),
          updated_at: nowIso(),
        });
      }

      cursor = payload.cursor || null;
      pages += 1;
    } while (cursor && pages < MAX_PAGES);
  }

  return contracts;
}

// Resolve the Polymarket NFL tag id once (gamma /events supports tag_id, not query).
async function resolvePolymarketNflTagId() {
  // Primary: direct slug lookup.
  try {
    const res = await fetch(`${POLYMARKET_BASE}/tags/slug/nfl`, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const tag = await res.json();
      const id = tag?.id ?? tag?.data?.id;
      if (id != null) return id;
    }
  } catch (err) {
    console.warn('Polymarket tag slug fallback:', err.message);
  }
  // Fallback: scan the tag list for an nfl slug/label.
  try {
    const res = await fetch(`${POLYMARKET_BASE}/tags?limit=500`, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const payload = await res.json();
      const tags = Array.isArray(payload) ? payload : payload.data || [];
      const nfl = tags.find(
        (t) => String(t.slug || '').toLowerCase() === 'nfl' || String(t.label || '').toLowerCase() === 'nfl'
      );
      if (nfl?.id != null) return nfl.id;
    }
  } catch (err) {
    console.warn('Polymarket tag list fallback:', err.message);
  }
  return null;
}

function normalizePolymarketEvents(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.events || payload?.data || [];
}

async function fetchPolymarketEventsByTag(tagId) {
  if (tagId == null) return [];
  try {
    const url = new URL(`${POLYMARKET_BASE}/events`);
    url.searchParams.set('tag_id', String(tagId));
    url.searchParams.set('closed', 'false');
    url.searchParams.set('limit', '100');
    const res = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    return normalizePolymarketEvents(await res.json());
  } catch (err) {
    console.warn('Polymarket tag events fallback:', err.message);
    return [];
  }
}

async function fetchPolymarketEventsBySearch(term) {
  try {
    const url = new URL(`${POLYMARKET_BASE}/public-search`);
    url.searchParams.set('q', term);
    const res = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const payload = await res.json();
    // public-search returns a composite; events may sit under .events or .data.
    return normalizePolymarketEvents(payload);
  } catch (err) {
    console.warn(`Polymarket search fallback (${term}):`, err.message);
    return [];
  }
}

async function fetchPolymarketNflMarkets() {
  const seen = new Set();
  const events = [];
  const collect = (list) => {
    for (const ev of list || []) {
      const key = ev.id || ev.slug || ev.ticker;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      events.push(ev);
    }
  };

  const tagId = await resolvePolymarketNflTagId();
  collect(await fetchPolymarketEventsByTag(tagId));
  for (const term of POLYMARKET_NFL_SEARCH_TERMS) {
    collect(await fetchPolymarketEventsBySearch(term));
  }

  const contracts = [];
  for (const event of events) {
    for (const market of event.markets || []) {
      let prices;
      try {
        prices = JSON.parse(market.outcomePrices || '[]');
      } catch {
        continue; // Malformed price payload — skip this market
      }
      const yesPrice = prices[0] ? parseFloat(prices[0]) : null;
      if (!yesPrice || yesPrice <= 0 || yesPrice >= 1) continue;

      const cents = Math.round(yesPrice * 100);
      const netEval = calculateNetOdds({ priceCents: cents, exchange: 'polymarket', applyFee: true });

      contracts.push({
        id: `poly_${market.id || market.slug}`,
        title: market.question || event.title,
        ticker: market.slug || event.slug,
        exchange: 'polymarket',
        market_type: inferMarketType(`${market.question || ''} ${event.title || ''}`),
        price_cents: cents,
        gross_american_odds: netEval.grossAmericanOdds,
        net_american_odds: netEval.netAmericanOdds,
        decimal_odds: netEval.decimalOdds,
        implied_probability_pct: Number((netEval.grossProb * 100).toFixed(1)),
        volume_24h: Math.round(parseFloat(market.volume24hr || '0')),
        updated_at: nowIso(),
      });
    }
  }
  return contracts;
}

function renderMarkdown(snapshot) {
  const lines = [
    `# Prediction Market Snapshot (Kalshi & Polymarket) - ${snapshot.meta.generated_at.slice(0, 10)}`,
    '',
    '> Live fee-adjusted American odds aggregated from prediction platforms for market shopping and corroboration.',
    '',
    `Generated: ${snapshot.meta.generated_at}`,
    `Total Contracts: ${snapshot.meta.contract_count} | Kalshi: ${snapshot.meta.kalshi_count} | Polymarket: ${snapshot.meta.polymarket_count}`,
    '',
    '## Aggregated Contracts & Fee-Adjusted Odds',
    '',
    '| Exchange | Market / Contract | Price (¢) | Gross Odds | Net Fee-Adjusted Odds | Decimal Payout | Implied Prob |',
    '|---|---|---|---|---|---|---|',
  ];

  for (const c of snapshot.contracts) {
    const gross = c.gross_american_odds > 0 ? `+${c.gross_american_odds}` : `${c.gross_american_odds}`;
    const net = c.net_american_odds > 0 ? `+${c.net_american_odds}` : `${c.net_american_odds}`;
    lines.push(`| ${c.exchange.toUpperCase()} | ${c.title} | ${c.price_cents}¢ | ${gross} | **${net}** | ${c.decimal_odds}x | ${c.implied_probability_pct}% |`);
  }

  lines.push('', '## Source Health', '');
  for (const h of snapshot.meta.source_health || []) {
    lines.push(`- **${h.source}**: ${h.status} (${h.evidence})`);
  }

  return `${lines.join('\n')}\n`;
}

function renderHtml(snapshot) {
  const rows = snapshot.contracts
    .map((c) => {
      const gross = c.gross_american_odds > 0 ? `+${c.gross_american_odds}` : `${c.gross_american_odds}`;
      const net = c.net_american_odds > 0 ? `+${c.net_american_odds}` : `${c.net_american_odds}`;
      return `<tr>
        <td><strong>${escapeHtml(c.exchange.toUpperCase())}</strong></td>
        <td>${escapeHtml(c.title)}</td>
        <td className="mono">${c.price_cents}¢</td>
        <td className="mono">${gross}</td>
        <td className="mono highlight">${net}</td>
        <td className="mono">${c.decimal_odds}x</td>
        <td className="mono">${c.implied_probability_pct}%</td>
      </tr>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Prediction Market Odds Snapshot</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; }
    h1 { color: #10b981; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; background: #1e293b; border-radius: 8px; overflow: hidden; }
    th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #334155; }
    th { background: #0f172a; color: #94a3b8; font-size: 0.75rem; text-transform: uppercase; }
    .mono { font-family: monospace; }
    .highlight { color: #34d399; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Prediction Market Odds Snapshot</h1>
  <p>Generated: ${escapeHtml(snapshot.meta.generated_at)}</p>
  <p>Contracts: ${snapshot.meta.contract_count} | Kalshi: ${snapshot.meta.kalshi_count} | Polymarket: ${snapshot.meta.polymarket_count}</p>
  <table>
    <thead>
      <tr>
        <th>Exchange</th>
        <th>Contract</th>
        <th>Price</th>
        <th>Gross Odds</th>
        <th>Net Fee-Adjusted</th>
        <th>Decimal</th>
        <th>Implied Prob</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(DOCS_DIR, { recursive: true });

  console.log('Fetching live prediction market data...');
  const kalshiContracts = await fetchKalshiNflMarkets();
  const polyContracts = await fetchPolymarketNflMarkets();

  let contracts = [...kalshiContracts, ...polyContracts];

  // Fallback sample data if APIs return 0 results during offseason/transition
  if (contracts.length === 0) {
    const sampleSeed = JSON.parse(await readFile(path.join(OUT_DIR, 'sample-nfl-contracts.json'), 'utf8'));
    contracts = sampleSeed.map((c) => {
      const netEval = calculateNetOdds({ priceCents: c.last_price || c.yes_ask || 50, exchange: c.exchange });
      return {
        ...c,
        price_cents: c.last_price || c.yes_ask || 50,
        gross_american_odds: netEval.grossAmericanOdds,
        net_american_odds: netEval.netAmericanOdds,
        decimal_odds: netEval.decimalOdds,
        implied_probability_pct: Number((netEval.grossProb * 100).toFixed(1)),
      };
    });
  }

  const generatedAt = nowIso();
  const snapshot = {
    meta: {
      schema: 'prediction_markets_snapshot_v1',
      generated_at: generatedAt,
      contract_count: contracts.length,
      kalshi_count: contracts.filter((c) => c.exchange === 'kalshi').length,
      polymarket_count: contracts.filter((c) => c.exchange === 'polymarket').length,
      source_health: [
        { source: 'Kalshi API v2', status: kalshiContracts.length ? 'available' : 'fallback', evidence: `${kalshiContracts.length} contract(s)` },
        { source: 'Polymarket API', status: polyContracts.length ? 'available' : 'fallback', evidence: `${polyContracts.length} contract(s)` },
      ],
    },
    contracts,
  };

  const today = todayPacificDate();
  const snapshotFile = path.join(OUT_DIR, `prediction-markets-${today}.json`);
  const latestFile = path.join(OUT_DIR, 'latest.json');
  const mdFile = path.join(DOCS_DIR, 'prediction-markets-latest.md');
  const htmlFile = path.join(DOCS_DIR, 'prediction-markets-latest.html');

  await writeFile(snapshotFile, JSON.stringify(snapshot, null, 2), 'utf8');
  await writeFile(latestFile, JSON.stringify(snapshot, null, 2), 'utf8');
  await writeFile(mdFile, renderMarkdown(snapshot), 'utf8');
  await writeFile(htmlFile, renderHtml(snapshot), 'utf8');

  console.log(`Prediction market build complete: ${contracts.length} contracts.`);
  console.log(`Snapshot: ${snapshotFile}`);
  console.log(`Latest: ${latestFile}`);
  console.log(`Markdown: ${mdFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
