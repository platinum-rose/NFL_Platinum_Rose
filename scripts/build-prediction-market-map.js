#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { NFL_TEAMS, getTeamAbbreviation, normalizeTeam } from '../src/lib/teams.js';
import { parseArgs, nowIso } from './training-camp-intel.js';
import { validatePredictionMarketMap } from './lib/futures-evidence-gates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_SEASON = 2026;
const OUT_DIR = path.join(ROOT, 'data', 'prediction-markets');
const DOCS_DIR = path.join(ROOT, 'docs', 'prediction-markets');

export const COHERENCE_MARKETS = new Set([
  'wins',
  'make_playoffs',
  'division',
  'conference',
  'super_bowl',
]);

const TEAM_ROWS = Object.values(NFL_TEAMS);
const ABBR_TO_TEAM = Object.fromEntries(TEAM_ROWS.map((team) => [team.abbreviation, team]));
const TICKER_ABBR_TO_TEAM = new Map();
for (const team of TEAM_ROWS) {
  for (const alias of [team.abbreviation, ...team.altAbbreviations]) {
    const key = String(alias || '').toUpperCase();
    if (!key) continue;
    if (TICKER_ABBR_TO_TEAM.has(key) && TICKER_ABBR_TO_TEAM.get(key) !== team.abbreviation) {
      TICKER_ABBR_TO_TEAM.set(key, null);
    } else {
      TICKER_ABBR_TO_TEAM.set(key, team.abbreviation);
    }
  }
}

const CITY_TO_TEAM = new Map();
for (const team of TEAM_ROWS) {
  const key = team.city.toLowerCase();
  if (CITY_TO_TEAM.has(key) && CITY_TO_TEAM.get(key) !== team.abbreviation) {
    CITY_TO_TEAM.set(key, null);
  } else {
    CITY_TO_TEAM.set(key, team.abbreviation);
  }
}

const BLOCKED_SERIES = [
  [/^KXNFLDIVISIONORDER/, 'division_order'],
  [/^KXNFLDIVISIONWINS/, 'division_win_count'],
  [/^KXNFLDIVMOSTWINS/, 'division_most_wins'],
  [/^KXNFLDIVLEASTWINS/, 'division_least_wins'],
  [/^KXNFL1SEED/, 'seed'],
  [/^KXNFLSTAGEOFELIM/, 'stage_of_elimination'],
  [/^KXNFL(?:MVP|DPOTY|DROTY|PROOTY|CPOTY|WPMOTY)/, 'player_award'],
  [/^KXNFL(?:SEASON|LEADER)/, 'player_stat'],
  [/^KXLEADERNFL/, 'player_stat'],
  [/^KXNFL(?:TRADE|NEXTTEAM|RETURN)/, 'player_status'],
  [/^KXSTARTINGQBWEEK1/, 'player_status'],
  [/^KXNFLDRAFTTOP/, 'draft'],
  [/^KXSUPERBOWLHEADLINE/, 'headline'],
];

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

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function exactPhrase(text, phrase) {
  return new RegExp(`\\b${escapeRegex(phrase)}\\b`, 'i').test(text);
}

function taxonomyResult(contractTaxonomy, market = null, source = 'unsupported') {
  return {
    contract_taxonomy: contractTaxonomy,
    market,
    taxonomy_source: source,
    team_mapping_allowed: COHERENCE_MARKETS.has(market),
    coherence_supported: COHERENCE_MARKETS.has(market),
  };
}

/**
 * Classify the contract before attempting team identity. Series identifiers and
 * specific title shapes take precedence over broad upstream market labels.
 */
export function classifyContractTaxonomy(contract) {
  const series = String(contract.series_ticker || '').toUpperCase();
  const ticker = String(contract.ticker || '').toUpperCase();
  const title = String(contract.title || '');
  const text = `${title} ${ticker}`;
  const declared = String(contract.market_type || contract.event_type || '').toLowerCase();

  for (const [pattern, label] of BLOCKED_SERIES) {
    if (pattern.test(series) || pattern.test(ticker)) return taxonomyResult(label, null, 'series_gate');
  }

  if (/which season .* next make the playoffs/i.test(title) || /ENDSTREAK/.test(series + ticker)) {
    return taxonomyResult('multi_season', null, 'title_gate');
  }
  if (
    /\b(?:next team|play for .* next|starting (?:quarterback|qb)|traded?|trade|player of the year|mvp|rookie of the year|return to play)\b/i.test(
      title,
    )
  ) {
    return taxonomyResult('player_or_transaction', null, 'title_gate');
  }
  if (/\b(?:seed|stage of elimination|highest scoring team|lowest scoring team)\b/i.test(title)) {
    return taxonomyResult('team_context_non_coherence', null, 'title_gate');
  }

  if (series === 'KXNFLWINS') return taxonomyResult('team_win_total', 'wins', 'series_ticker');
  if (series === 'KXNFLPLAYOFF') return taxonomyResult('team_make_playoffs', 'make_playoffs', 'series_ticker');
  if (/^KXNFL(?:AFC|NFC)(?:EAST|WEST|NORTH|SOUTH)$/.test(series)) {
    return taxonomyResult('team_division_winner', 'division', 'series_ticker');
  }
  if (/^KXNFL(?:AFC|NFC)CHAMP$/.test(series)) {
    return taxonomyResult('team_conference_winner', 'conference', 'series_ticker');
  }
  if (series === 'KXSB') return taxonomyResult('team_super_bowl_winner', 'super_bowl', 'series_ticker');

  if (/(?:win )?at least \d+\s*(?:games|wins)|\d+\+\s*(?:wins|games)|\bwin total\b/i.test(text)) {
    return taxonomyResult('team_win_total', 'wins', 'title');
  }
  if (/\b(?:make|qualify for|reach) (?:the )?(?:playoffs|postseason)\b|playoff qualifiers?/i.test(title)) {
    return taxonomyResult('team_make_playoffs', 'make_playoffs', 'title');
  }
  if (/(?:win|winner of).*(?:AFC|NFC) (?:North|South|East|West)\b|\bdivision (?:winner|champion)/i.test(title)) {
    return taxonomyResult('team_division_winner', 'division', 'title');
  }
  if (/(?:AFC|NFC) (?:Conference )?Championship|win the (?:AFC|NFC)\b/i.test(title)) {
    return taxonomyResult('team_conference_winner', 'conference', 'title');
  }
  if (/Super\s*Bowl|NFL league championship|Pro Football Championship|league champ/i.test(title)) {
    return taxonomyResult('team_super_bowl_winner', 'super_bowl', 'title');
  }

  const declaredMarkets = {
    win_totals: ['team_win_total', 'wins'],
    wins: ['team_win_total', 'wins'],
    make_playoffs: ['team_make_playoffs', 'make_playoffs'],
    division: ['team_division_winner', 'division'],
    conference: ['team_conference_winner', 'conference'],
    super_bowl: ['team_super_bowl_winner', 'super_bowl'],
  };
  if (declaredMarkets[declared]) {
    const [contractTaxonomy, market] = declaredMarkets[declared];
    return taxonomyResult(contractTaxonomy, market, 'declared_market_type');
  }

  return taxonomyResult('unsupported_or_unknown', null, 'unsupported');
}

/** Infer the NFL season start year without defaulting undated rows into scope. */
export function inferContractSeason(contract, taxonomy = classifyContractTaxonomy(contract)) {
  const explicit = Number(contract.season);
  if (Number.isInteger(explicit) && explicit >= 2000) return { season: explicit, source: 'contract_field' };

  const title = String(contract.title || '');
  const ticker = String(contract.ticker || '').toUpperCase();
  const range = title.match(/\b(20\d{2})\s*[-/]\s*(?:20)?\d{2}\b/);
  if (range) return { season: Number(range[1]), source: 'title_season_range' };

  const seasonPhrase = title.match(/\b(20\d{2})(?:-\d{2})?\s+(?:NFL|Pro Football|regular )?season\b/i);
  if (seasonPhrase) return { season: Number(seasonPhrase[1]), source: 'title_season' };

  const titleYear = title.match(/\b(20\d{2})\b/)?.[1];
  if (titleYear) {
    const year = Number(titleYear);
    if (taxonomy.market === 'super_bowl' || taxonomy.market === 'conference') {
      return { season: year - 1, source: 'title_postseason_event_year' };
    }
    return { season: year, source: 'title_year' };
  }

  const tickerRange = ticker.match(/(?:^|[^0-9])(20)?(2\d)(2\d)(?:[^0-9]|$)/);
  if (tickerRange && Number(tickerRange[3]) === Number(tickerRange[2]) + 1) {
    return { season: 2000 + Number(tickerRange[2]), source: 'ticker_season_range' };
  }

  const settlementYear = ticker.match(/-(2[4-9])(?=[A-Z-]|$)/)?.[1];
  if (settlementYear && COHERENCE_MARKETS.has(taxonomy.market)) {
    return { season: 1999 + Number(settlementYear), source: 'ticker_postseason_settlement_year' };
  }

  return { season: null, source: 'unknown' };
}

function tickerTeamCandidates(ticker) {
  const raw = String(ticker || '');
  // Exchange tickers are structured uppercase identifiers. Lowercase slug IDs
  // are prose-like and can contain unsafe tokens such as "no" or "la".
  if (raw !== raw.toUpperCase()) return [];
  const upper = raw.toUpperCase();
  const aliases = [...TICKER_ABBR_TO_TEAM.keys()].sort((a, b) => b.length - a.length).join('|');
  const matches = upper.matchAll(new RegExp(`(?:^|[^A-Z])(${aliases})(?=[^A-Z]|$)`, 'g'));
  const teams = new Set();
  for (const match of matches) {
    const team = TICKER_ABBR_TO_TEAM.get(match[1]);
    if (team) teams.add(team);
  }
  return [...teams];
}

/** Resolve one team only after taxonomy and season gates have passed. */
export function teamFromContract(contract) {
  if (contract.team) {
    const normalized = normalizeTeam(contract.team);
    const abbreviation = normalized ? getTeamAbbreviation(normalized) : getTeamAbbreviation(contract.team);
    if (abbreviation) return { team: abbreviation, method: 'contract_team_field', confidence: 0.98 };
  }

  const tickerTeams = tickerTeamCandidates(contract.ticker);
  if (tickerTeams.length === 1) {
    return { team: tickerTeams[0], method: 'ticker_abbreviation', confidence: 0.96 };
  }
  if (tickerTeams.length > 1) {
    return { team: null, method: 'ambiguous_ticker_teams', confidence: 0 };
  }

  const title = String(contract.title || '');
  const strongMatches = new Set();
  for (const team of TEAM_ROWS) {
    if (exactPhrase(title, team.fullName) || exactPhrase(title, team.name)) strongMatches.add(team.abbreviation);
  }
  if (strongMatches.size === 1) {
    return { team: [...strongMatches][0], method: 'title_team_name', confidence: 0.9 };
  }
  if (strongMatches.size > 1) {
    return { team: null, method: 'ambiguous_title_teams', confidence: 0 };
  }

  const abbreviatedCityTeams = [
    [/\bNew York G\b/i, 'NYG'],
    [/\bNew York J\b/i, 'NYJ'],
    [/\bLos Angeles C\b/i, 'LAC'],
    [/\bLos Angeles R\b/i, 'LAR'],
  ].filter(([pattern]) => pattern.test(title));
  if (abbreviatedCityTeams.length === 1) {
    return { team: abbreviatedCityTeams[0][1], method: 'title_disambiguated_city_initial', confidence: 0.88 };
  }

  const cityMatches = new Set();
  for (const [city, team] of CITY_TO_TEAM.entries()) {
    if (team && exactPhrase(title, city)) cityMatches.add(team);
  }
  if (cityMatches.size === 1) {
    return { team: [...cityMatches][0], method: 'title_unique_city', confidence: 0.78 };
  }

  const ambiguousCity = /\b(?:New York|Los Angeles)\b/i.test(title);
  return {
    team: null,
    method: ambiguousCity ? 'ambiguous_shared_city' : 'unmapped',
    confidence: 0,
  };
}

export function mapContract(contract, requestedSeason) {
  const taxonomy = classifyContractTaxonomy(contract);
  const inferredSeason = inferContractSeason(contract, taxonomy);
  const seasonEligible = inferredSeason.season === requestedSeason;
  const team = !taxonomy.team_mapping_allowed
    ? { team: null, method: 'taxonomy_gate', confidence: 0 }
    : !seasonEligible
      ? { team: null, method: 'season_gate', confidence: 0 }
      : teamFromContract(contract);
  const mapped = Boolean(team.team && taxonomy.coherence_supported && seasonEligible);

  const bid = contract.yes_bid_cents == null ? null : Number(contract.yes_bid_cents);
  const ask = contract.yes_ask_cents == null ? null : Number(contract.yes_ask_cents);
  const spread = Number.isFinite(bid) && Number.isFinite(ask) ? ask - bid : null;
  const volume = contract.volume_24h == null ? null : Number(contract.volume_24h);
  const liquidityWarningReasons = [];
  if (!Number.isFinite(volume) || volume <= 0) liquidityWarningReasons.push('zero_or_missing_24h_volume');
  if (spread !== null && spread < 0) liquidityWarningReasons.push('inverted_order_book');
  if (spread !== null && spread >= 8) liquidityWarningReasons.push('wide_bid_ask_spread');
  const liquidityWarning = liquidityWarningReasons.length > 0;

  const probability = Number(contract.implied_probability_pct);
  const usableProbability = Number.isFinite(probability) && probability > 0 && probability < 100;
  const feeAdjustedOddsAvailable = Number.isFinite(Number(contract.net_american_odds));
  const contextEligible = mapped && usableProbability;
  const actionableCoherenceEligible = contextEligible && !liquidityWarning && feeAdjustedOddsAvailable;

  let unmappedReason = null;
  if (!taxonomy.coherence_supported) unmappedReason = `unsupported_taxonomy:${taxonomy.contract_taxonomy}`;
  else if (inferredSeason.season === null) unmappedReason = 'unknown_season';
  else if (!seasonEligible) unmappedReason = `wrong_season:${inferredSeason.season}`;
  else if (!team.team) unmappedReason = team.method;

  const contextExclusionReasons = [];
  if (!mapped && unmappedReason) contextExclusionReasons.push(unmappedReason);
  if (mapped && !usableProbability) contextExclusionReasons.push('missing_or_invalid_probability');
  const actionableExclusionReasons = [...contextExclusionReasons];
  if (contextEligible && liquidityWarning) actionableExclusionReasons.push(...liquidityWarningReasons);
  if (contextEligible && !feeAdjustedOddsAvailable) actionableExclusionReasons.push('fee_adjusted_odds_missing');

  return {
    id: contract.id,
    exchange: contract.exchange,
    ticker: contract.ticker || null,
    series_ticker: contract.series_ticker || null,
    title: contract.title,
    contract_taxonomy: taxonomy.contract_taxonomy,
    taxonomy_source: taxonomy.taxonomy_source,
    taxonomy_supported: taxonomy.coherence_supported,
    team: team.team,
    team_nick: team.team ? ABBR_TO_TEAM[team.team]?.name || normalizeTeam(team.team) : null,
    market: taxonomy.market || 'unmapped',
    season: inferredSeason.season,
    season_source: inferredSeason.source,
    season_scope_status: inferredSeason.season === null ? 'unknown' : seasonEligible ? 'eligible' : 'wrong_season',
    side: 'yes',
    price_cents: contract.price_cents ?? null,
    implied_probability_pct: contract.implied_probability_pct ?? null,
    gross_american_odds: contract.gross_american_odds ?? null,
    net_american_odds: contract.net_american_odds ?? null,
    fee_adjustment_status: feeAdjustedOddsAvailable ? 'net_odds_available' : 'net_odds_missing',
    volume_24h: contract.volume_24h ?? null,
    bid_ask_spread_cents: spread,
    liquidity_warning: liquidityWarning,
    liquidity_warning_reasons: liquidityWarningReasons,
    settlement_terms_status: 'not_present_in_local_snapshot',
    mapping_confidence: Number((mapped ? Math.min(team.confidence, 0.9) : team.confidence).toFixed(2)),
    mapping_method: team.method,
    mapped,
    unmapped_reason: unmappedReason,
    context_eligible: contextEligible,
    actionable_coherence_eligible: actionableCoherenceEligible,
    execution_eligible: false,
    context_exclusion_reasons: contextExclusionReasons,
    actionable_exclusion_reasons: actionableExclusionReasons,
    updated_at: contract.updated_at || null,
  };
}

function renderMarkdown(snapshot) {
  const lines = [
    `# Prediction Market Context Map - ${snapshot.meta.artifact_date}`,
    '',
    '> Consensus context only. Prediction markets are not sportsbook execution prices and do not authorize recommendations.',
    '> Actionable below means eligible for coherence math only; settlement terms remain unverified and execution eligibility is zero.',
    '',
    `Generated: ${snapshot.meta.generated_at}`,
    `Contracts: ${snapshot.meta.contract_count} | Mapped: ${snapshot.meta.mapped_count} | Unmapped: ${snapshot.meta.unmapped_count}`,
    `Eligible context: ${snapshot.meta.eligible_context_count} | Actionable coherence: ${snapshot.meta.actionable_count} | Execution eligible: ${snapshot.meta.execution_eligible_count}`,
    `Liquidity warnings: ${snapshot.meta.liquidity_warning_count} (${snapshot.meta.liquidity_warning_rate_pct}%) | Wrong-season mapped: ${snapshot.meta.wrong_season_mapped_count}`,
    '',
    '## Required Caveats',
    '',
    '- Fee-adjusted net odds are retained separately from gross yes-price probabilities.',
    '- Zero-volume and wide/inverted-spread rows remain eligible context when otherwise valid, but are excluded from actionable coherence math.',
    '- Settlement terms are not present in the local snapshot, so no row is an execution source.',
    '',
    '## Mapped Contracts',
    '',
    '| Exchange | Team | Market | Season | Price | Net Odds | Volume 24h | Context | Coherence | Warning | Title |',
    '|---|---|---|---:|---:|---:|---:|---|---|---|---|',
  ];

  for (const row of snapshot.mapped.slice(0, 120)) {
    const net = row.net_american_odds > 0 ? `+${row.net_american_odds}` : row.net_american_odds;
    lines.push(
      `| ${row.exchange} | ${row.team || ''} | ${row.market} | ${row.season ?? ''} | ${row.price_cents ?? ''} | ` +
        `${net ?? ''} | ${row.volume_24h ?? ''} | ${row.context_eligible ? 'yes' : 'no'} | ` +
        `${row.actionable_coherence_eligible ? 'yes' : 'context only'} | ${row.liquidity_warning ? 'yes' : 'no'} | ` +
        `${compact(row.title, 90)} |`,
    );
  }

  lines.push('', '## Unmapped Contracts', '', '| Exchange | Taxonomy | Season | Reason | Title |', '|---|---|---:|---|---|');
  for (const row of snapshot.unmapped.slice(0, 80)) {
    lines.push(
      `| ${row.exchange} | ${row.contract_taxonomy} | ${row.season ?? ''} | ${row.unmapped_reason} | ${compact(row.title, 100)} |`,
    );
  }
  return `${lines.join('\n')}\n`;
}

export async function buildPredictionMarketMap(options = {}) {
  const season = Number(options.season || DEFAULT_SEASON);
  const generatedAt = options.generatedAt || nowIso();
  const artifactDate = options.date || generatedAt.slice(0, 10);
  const source = options.sourceData ||
    (await readJson(options.source || path.join('data', 'prediction-markets', 'latest.json'), { contracts: [] }));
  const rows = (source.contracts || []).map((contract) => mapContract(contract, season));
  const mapped = rows.filter((row) => row.mapped);
  const unmapped = rows.filter((row) => !row.mapped);
  const liquidityWarningCount = rows.filter((row) => row.liquidity_warning).length;
  const taxonomyCounts = Object.fromEntries(
    [...new Set(rows.map((row) => row.contract_taxonomy))]
      .sort()
      .map((taxonomy) => [taxonomy, rows.filter((row) => row.contract_taxonomy === taxonomy).length]),
  );
  const snapshot = {
    meta: {
      schema: 'prediction_market_team_map_v2',
      season,
      artifact_date: artifactDate,
      generated_at: generatedAt,
      source_generated_at: source.meta?.generated_at || null,
      contract_count: rows.length,
      mapped_count: mapped.length,
      unmapped_count: unmapped.length,
      eligible_context_count: rows.filter((row) => row.context_eligible).length,
      actionable_count: rows.filter((row) => row.actionable_coherence_eligible).length,
      context_only_count: rows.filter((row) => row.context_eligible && !row.actionable_coherence_eligible).length,
      execution_eligible_count: rows.filter((row) => row.execution_eligible).length,
      liquidity_warning_count: liquidityWarningCount,
      liquidity_warning_rate_pct: rows.length
        ? Number(((liquidityWarningCount / rows.length) * 100).toFixed(2))
        : 0,
      wrong_season_contract_count: rows.filter((row) => row.season_scope_status === 'wrong_season').length,
      unknown_season_contract_count: rows.filter((row) => row.season_scope_status === 'unknown').length,
      wrong_season_mapped_count: mapped.filter((row) => row.season !== season).length,
      taxonomy_counts: taxonomyCounts,
      recommendation_status: 'consensus_context_only_not_execution_source',
      execution_source_status: 'blocked_settlement_terms_unverified',
      coherence_eligibility_definition:
        'Mapped supported 2026 team future with a usable probability, no liquidity warning, and fee-adjusted net odds present.',
      caveats: [
        'Fee-adjusted net odds are retained separately from gross yes-price probabilities.',
        'Liquidity-warned rows are context-only and excluded from actionable coherence math.',
        'Settlement terms are absent from the local snapshot; execution eligibility is always false.',
      ],
      guardrails: {
        live_model_calls: false,
        network_fetches: false,
        supabase_writes: false,
        official_picks_generated: false,
        portfolio_mutations: false,
      },
    },
    mapped,
    unmapped,
    contracts: rows,
  };
  snapshot.meta.inputs = {
    source_path: options.source || path.join('data', 'prediction-markets', 'latest.json'),
    source_generated_at: source.meta?.generated_at || null,
    source_contract_count: (source.contracts || []).length,
  };
  snapshot.meta.validation_results = {
    prediction_market_map: validatePredictionMarketMap(snapshot, season),
  };

  if (options.dryRun) return { snapshot, outputs: null };

  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(DOCS_DIR, { recursive: true });
  const jsonPath = path.join(OUT_DIR, `team-market-map-${artifactDate}.json`);
  const latestPath = path.join(OUT_DIR, 'team-market-map-latest.json');
  const mdPath = path.join(DOCS_DIR, `prediction-market-context-${artifactDate}.md`);
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
    generatedAt: args['generated-at'] || null,
    dryRun: args['dry-run'] === true || args['no-persist'] === true,
  });
  console.log(`Prediction market map complete: ${snapshot.meta.mapped_count} mapped, ${snapshot.meta.unmapped_count} unmapped.`);
  console.log(
    `Eligible context: ${snapshot.meta.eligible_context_count}; actionable coherence: ${snapshot.meta.actionable_count}; ` +
      `execution eligible: ${snapshot.meta.execution_eligible_count}.`,
  );
  console.log(
    `Liquidity warnings: ${snapshot.meta.liquidity_warning_count} (${snapshot.meta.liquidity_warning_rate_pct}%).`,
  );
  if (outputs) {
    console.log(`Map: ${outputs.latestPath}`);
    console.log(`Markdown: ${outputs.latestMdPath}`);
  } else {
    console.log('--dry-run/--no-persist: map/report files were not written.');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
