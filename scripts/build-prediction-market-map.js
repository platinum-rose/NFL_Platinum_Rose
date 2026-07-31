#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NFL_TEAMS, getTeamAbbreviation, normalizeTeam } from '../src/lib/teams.js';
import { parseArgs, nowIso } from './training-camp-intel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_SEASON = 2026;
const OUT_DIR = path.join(ROOT, 'data', 'prediction-markets');
const DOCS_DIR = path.join(ROOT, 'docs', 'prediction-markets');

const ABBR_TO_TEAM = Object.fromEntries(Object.values(NFL_TEAMS).map((team) => [team.abbreviation, team]));

async function readJson(relativePath, fallback = null) {
  try {
    return JSON.parse(await readFile(path.join(ROOT, relativePath), 'utf8'));
  } catch (err) {
    if (fallback !== null && err.code === 'ENOENT') return fallback;
    throw err;
  }
}

function compact(value, maxChars = 220) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  return clean.length > maxChars ? `${clean.slice(0, maxChars - 3).trim()}...` : clean;
}

function teamFromContract(contract) {
  const text = [contract.title, contract.ticker].filter(Boolean).join(' ');
  const tickerAbbr = String(contract.ticker || '').match(/(?:^|[^A-Z])(ARI|ATL|BAL|BUF|CAR|CHI|CIN|CLE|DAL|DEN|DET|GB|GNB|HOU|IND|JAX|JAC|KC|LAC|LAR|LV|MIA|MIN|NE|NO|NYG|NYJ|PHI|PIT|SF|SEA|TB|TEN|WAS|WSH)(?:[^A-Z]|$)/i)?.[1];
  if (tickerAbbr) {
    const team = getTeamAbbreviation(tickerAbbr);
    if (team) return { team, method: 'ticker_abbreviation', confidence: 0.92 };
  }

  for (const team of Object.values(NFL_TEAMS)) {
    const patterns = [team.fullName, team.city, team.name, team.abbreviation, ...team.altAbbreviations]
      .filter(Boolean)
      .map((name) => new RegExp(`\\b${String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'));
    if (patterns.some((pattern) => pattern.test(text))) {
      return { team: team.abbreviation, method: 'title_team_alias', confidence: 0.78 };
    }
  }

  const normalized = normalizeTeam(text);
  if (normalized) {
    return { team: getTeamAbbreviation(normalized), method: 'fuzzy_team_alias', confidence: 0.62 };
  }
  return { team: null, method: 'unmapped', confidence: 0 };
}

function marketType(contract) {
  const text = [contract.title, contract.ticker, contract.market_type].filter(Boolean).join(' ');
  if (/super bowl|champion/i.test(text)) return 'super_bowl';
  if (/playoff|postseason|endstreak/i.test(text)) return 'make_playoffs';
  if (/win total|wins|regular season/i.test(text)) return 'wins';
  if (/division/i.test(text)) return 'division';
  if (/conference|afc|nfc/i.test(text)) return 'conference';
  return 'unmapped';
}

function seasonFromContract(contract, fallbackSeason) {
  const text = [contract.title, contract.ticker].filter(Boolean).join(' ');
  if (/\b2026\b/.test(text) || /\b2627\b/.test(text)) return 2026;
  const year = text.match(/\b20(2[6-9]|3[0-9])\b/)?.[0];
  return year ? Number(year) : fallbackSeason;
}

function mapContract(contract, season) {
  const team = teamFromContract(contract);
  const market = marketType(contract);
  const mapped = Boolean(team.team && market !== 'unmapped');
  const spread = contract.yes_bid_cents != null && contract.yes_ask_cents != null
    ? Math.max(0, Number(contract.yes_ask_cents) - Number(contract.yes_bid_cents))
    : null;
  const lowLiquidity = Number(contract.volume_24h || 0) <= 0;
  return {
    id: contract.id,
    exchange: contract.exchange,
    ticker: contract.ticker || null,
    title: contract.title,
    team: team.team,
    team_nick: team.team ? normalizeTeam(team.team) : null,
    market,
    season: seasonFromContract(contract, season),
    side: 'yes',
    price_cents: contract.price_cents ?? null,
    implied_probability_pct: contract.implied_probability_pct ?? null,
    gross_american_odds: contract.gross_american_odds ?? null,
    net_american_odds: contract.net_american_odds ?? null,
    volume_24h: contract.volume_24h ?? null,
    bid_ask_spread_cents: spread,
    liquidity_warning: lowLiquidity || (spread !== null && spread >= 8),
    mapping_confidence: Number((mapped ? Math.min(team.confidence, market === 'unmapped' ? 0 : 0.86) : team.confidence).toFixed(2)),
    mapping_method: team.method,
    mapped,
    unmapped_reason: mapped
      ? null
      : !team.team
        ? 'no_team_match'
        : 'no_supported_market_match',
    updated_at: contract.updated_at || null,
  };
}

function renderMarkdown(snapshot) {
  const lines = [
    `# Prediction Market Context Map - ${snapshot.meta.generated_at.slice(0, 10)}`,
    '',
    '> Consensus context only. Prediction markets are not sportsbook execution prices and do not authorize recommendations.',
    '',
    `Generated: ${snapshot.meta.generated_at}`,
    `Contracts: ${snapshot.meta.contract_count} | Mapped: ${snapshot.meta.mapped_count} | Unmapped: ${snapshot.meta.unmapped_count} | Liquidity warnings: ${snapshot.meta.liquidity_warning_count}`,
    '',
    '## Mapped Contracts',
    '',
    '| Exchange | Team | Market | Price | Net Odds | Volume 24h | Confidence | Warning | Title |',
    '|---|---|---|---:|---:|---:|---:|---|---|',
  ];

  for (const row of snapshot.mapped.slice(0, 120)) {
    const net = row.net_american_odds > 0 ? `+${row.net_american_odds}` : row.net_american_odds;
    lines.push(`| ${row.exchange} | ${row.team || ''} | ${row.market} | ${row.price_cents ?? ''} | ${net ?? ''} | ${row.volume_24h ?? ''} | ${row.mapping_confidence} | ${row.liquidity_warning ? 'yes' : 'no'} | ${compact(row.title, 90)} |`);
  }

  lines.push('', '## Unmapped Contracts', '', '| Exchange | Reason | Title |', '|---|---|---|');
  for (const row of snapshot.unmapped.slice(0, 80)) {
    lines.push(`| ${row.exchange} | ${row.unmapped_reason} | ${compact(row.title, 100)} |`);
  }
  return `${lines.join('\n')}\n`;
}

export async function buildPredictionMarketMap(options = {}) {
  const season = Number(options.season || DEFAULT_SEASON);
  const generatedAt = options.generatedAt || nowIso();
  const source = await readJson(options.source || path.join('data', 'prediction-markets', 'latest.json'), { contracts: [] });
  const rows = (source.contracts || []).map((contract) => mapContract(contract, season));
  const mapped = rows.filter((row) => row.mapped);
  const unmapped = rows.filter((row) => !row.mapped);
  const snapshot = {
    meta: {
      schema: 'prediction_market_team_map_v1',
      season,
      generated_at: generatedAt,
      source_generated_at: source.meta?.generated_at || null,
      contract_count: rows.length,
      mapped_count: mapped.length,
      unmapped_count: unmapped.length,
      liquidity_warning_count: rows.filter((row) => row.liquidity_warning).length,
      recommendation_status: 'consensus_context_only_not_execution_prices',
      guardrails: {
        live_model_calls: false,
        network_fetches: false,
        supabase_writes: false,
        official_picks_generated: false,
      },
    },
    mapped,
    unmapped,
    contracts: rows,
  };

  if (options.dryRun) return { snapshot, outputs: null };

  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(DOCS_DIR, { recursive: true });
  const date = options.date || generatedAt.slice(0, 10);
  const jsonPath = path.join(OUT_DIR, `team-market-map-${date}.json`);
  const latestPath = path.join(OUT_DIR, 'team-market-map-latest.json');
  const mdPath = path.join(DOCS_DIR, `prediction-market-context-${date}.md`);
  const latestMdPath = path.join(DOCS_DIR, 'prediction-market-context-latest.md');
  const markdown = renderMarkdown(snapshot);
  await writeFile(jsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  await writeFile(latestPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  await writeFile(mdPath, markdown, 'utf8');
  await writeFile(latestMdPath, markdown, 'utf8');
  return { snapshot, outputs: { jsonPath, latestPath, mdPath, latestMdPath } };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { snapshot, outputs } = await buildPredictionMarketMap({
    season: Number(args.season || DEFAULT_SEASON),
    source: args.source || null,
    date: args.date || null,
    dryRun: args['dry-run'] === true || args['no-persist'] === true,
  });
  console.log(`Prediction market map complete: ${snapshot.meta.mapped_count} mapped, ${snapshot.meta.unmapped_count} unmapped.`);
  console.log(`Liquidity warnings: ${snapshot.meta.liquidity_warning_count}`);
  if (outputs) {
    console.log(`Map: ${outputs.latestPath}`);
    console.log(`Markdown: ${outputs.latestMdPath}`);
  } else {
    console.log('--dry-run/--no-persist: map/report files were not written.');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
