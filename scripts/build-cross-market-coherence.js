#!/usr/bin/env node

// Deterministic cross-market coherence over explicitly eligible local contracts.
// The mapper owns taxonomy, season, team identity, fee, liquidity, and settlement
// eligibility. This builder uses only rows explicitly marked actionable for math;
// it never upgrades a legacy or caveated artifact into an execution source.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { probabilityToAmerican } from '../src/lib/predictionMarkets.js';
import { parseArgs, nowIso } from './training-camp-intel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_SEASON = 2026;
const OUT_DIR = path.join(ROOT, 'data', 'prediction-markets');
const DOCS_DIR = path.join(ROOT, 'docs', 'prediction-markets');

const LADDER_TOLERANCE_PCT = 1;
const NESTING_TOLERANCE_PCT = 2;

async function readJson(relativePath, fallback = null) {
  try {
    return JSON.parse(await readFile(path.join(ROOT, relativePath), 'utf8'));
  } catch (err) {
    if (fallback !== null && err.code === 'ENOENT') return fallback;
    throw err;
  }
}

function median(values) {
  const nums = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!nums.length) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

/** Consume the mapper's exact market taxonomy; do not reclassify broad title text. */
export function classifyCoherenceRung(row) {
  const market = String(row.market || '');
  if (market === 'wins') {
    const title = String(row.title || '').toLowerCase();
    const match =
      title.match(/(?:win )?at least (\d+)\s*(?:games|wins)/) ||
      title.match(/(\d+)\+\s*(?:wins|games)/);
    return match
      ? { rung: 'win_total', threshold: Number(match[1]) }
      : { rung: 'other', exclusion_reason: 'win_threshold_unparsed' };
  }
  if (market === 'division') return { rung: 'division' };
  if (market === 'conference') return { rung: 'conference' };
  if (market === 'super_bowl') return { rung: 'super_bowl' };
  if (market === 'make_playoffs') return { rung: 'make_playoffs' };
  return { rung: 'other', exclusion_reason: 'unsupported_mapper_taxonomy' };
}

function impliedMedianWins(points) {
  if (points.length < 2) return null;
  for (let i = 0; i < points.length - 1; i += 1) {
    const hi = points[i];
    const lo = points[i + 1];
    if (hi.implied_prob >= 50 && lo.implied_prob <= 50) {
      const span = hi.implied_prob - lo.implied_prob;
      if (span <= 0) return hi.threshold;
      const frac = (hi.implied_prob - 50) / span;
      return Math.round((hi.threshold + frac * (lo.threshold - hi.threshold)) * 100) / 100;
    }
  }
  return null;
}

function fairAmerican(pct) {
  if (!Number.isFinite(pct)) return null;
  return probabilityToAmerican(pct / 100);
}

/** Build coherence signals from actionable-coherence rows only. */
export function buildTeamCoherence(rows) {
  const byTeam = new Map();
  for (const row of rows) {
    if (!row.team) continue;
    const pct = Number(row.implied_probability_pct);
    if (!Number.isFinite(pct) || pct <= 0 || pct >= 100) continue;
    const { rung, threshold } = classifyCoherenceRung(row);
    if (rung === 'other') continue;
    if (!byTeam.has(row.team)) {
      byTeam.set(row.team, { team: row.team, team_nick: row.team_nick || null, rungs: new Map() });
    }
    const entry = byTeam.get(row.team);
    const key = rung === 'win_total' ? `win_total:${threshold}` : rung;
    if (!entry.rungs.has(key)) entry.rungs.set(key, { rung, threshold: threshold ?? null, probs: [] });
    entry.rungs.get(key).probs.push(pct);
  }

  const results = [];
  for (const entry of byTeam.values()) {
    const ladderPoints = [];
    const impliedByMarket = { super_bowl: null, conference: null, division: null, make_playoffs: null };
    for (const bucket of entry.rungs.values()) {
      const probability = median(bucket.probs);
      if (probability === null) continue;
      if (bucket.rung === 'win_total') {
        ladderPoints.push({ threshold: bucket.threshold, implied_prob: probability });
      } else {
        impliedByMarket[bucket.rung] = probability;
      }
    }
    ladderPoints.sort((a, b) => a.threshold - b.threshold);

    const ladderViolations = [];
    for (let i = 0; i < ladderPoints.length - 1; i += 1) {
      const from = ladderPoints[i];
      const to = ladderPoints[i + 1];
      const delta = to.implied_prob - from.implied_prob;
      if (delta > LADDER_TOLERANCE_PCT) {
        ladderViolations.push({
          from: from.threshold,
          to: to.threshold,
          delta_pct: Math.round(delta * 100) / 100,
        });
      }
    }

    const nestingRules = [
      { constraint: 'super_bowl<=conference', lower: 'super_bowl', higher: 'conference' },
      { constraint: 'conference<=make_playoffs', lower: 'conference', higher: 'make_playoffs' },
      { constraint: 'super_bowl<=make_playoffs', lower: 'super_bowl', higher: 'make_playoffs' },
      { constraint: 'division<=make_playoffs', lower: 'division', higher: 'make_playoffs' },
    ];
    const nestingViolations = [];
    for (const rule of nestingRules) {
      const lowerPct = impliedByMarket[rule.lower];
      const higherPct = impliedByMarket[rule.higher];
      if (lowerPct === null || higherPct === null) continue;
      const divergence = lowerPct - higherPct;
      if (divergence > NESTING_TOLERANCE_PCT) {
        nestingViolations.push({
          constraint: rule.constraint,
          lower_market: rule.lower,
          lower_pct: lowerPct,
          higher_market: rule.higher,
          higher_pct: higherPct,
          divergence_pct: Math.round(divergence * 100) / 100,
        });
      }
    }

    let maxDivergence = 0;
    let softestMarket = null;
    for (const violation of nestingViolations) {
      if (violation.divergence_pct > maxDivergence) {
        maxDivergence = violation.divergence_pct;
        softestMarket = violation.lower_market;
      }
    }
    for (const violation of ladderViolations) {
      if (violation.delta_pct > maxDivergence) {
        maxDivergence = violation.delta_pct;
        softestMarket = `win_total_${violation.to}`;
      }
    }

    results.push({
      team: entry.team,
      team_nick: entry.team_nick,
      coherence_basis: 'actionable_coherence_contracts_only',
      implied_win_pct_by_market: impliedByMarket,
      fair_american_by_market: {
        super_bowl: fairAmerican(impliedByMarket.super_bowl),
        conference: fairAmerican(impliedByMarket.conference),
        division: fairAmerican(impliedByMarket.division),
        make_playoffs: fairAmerican(impliedByMarket.make_playoffs),
      },
      win_total_ladder: {
        points: ladderPoints,
        monotonic: ladderViolations.length === 0,
        violations: ladderViolations,
        implied_median_wins: impliedMedianWins(ladderPoints),
      },
      championship_ladder: {
        coherent: nestingViolations.length === 0,
        violations: nestingViolations,
      },
      max_divergence_pct: Math.round(maxDivergence * 100) / 100,
      softest_market: softestMarket,
      edge_type: maxDivergence > 0 ? 'math' : null,
    });
  }

  results.sort((a, b) => b.max_divergence_pct - a.max_divergence_pct || a.team.localeCompare(b.team));
  return results;
}

function countByTeam(rows) {
  const counts = new Map();
  for (const row of rows) {
    if (!row.team) continue;
    counts.set(row.team, (counts.get(row.team) || 0) + 1);
  }
  return counts;
}

function renderMarkdown(snapshot) {
  const lines = [
    `# Cross-Market Coherence - ${snapshot.meta.artifact_date}`,
    '',
    '> Consensus context only. Actionable means eligible for deterministic coherence math, not approved or executable.',
    '> Liquidity-warned/ineligible rows are excluded from the calculations. Settlement terms remain unverified.',
    '',
    `Generated: ${snapshot.meta.generated_at}`,
    `Eligible-context contracts: ${snapshot.meta.eligible_context_contract_count} | Actionable coherence contracts: ${snapshot.meta.actionable_contract_count} | Context-only contracts: ${snapshot.meta.context_only_contract_count}`,
    `Eligible-context teams: ${snapshot.meta.eligible_context_team_count} | Actionable teams: ${snapshot.meta.team_count} | Execution-eligible contracts: ${snapshot.meta.execution_eligible_contract_count}`,
    `Incoherent actionable teams: ${snapshot.meta.incoherent_count} | Ladder inversions: ${snapshot.meta.ladder_inversion_count} | Nesting violations: ${snapshot.meta.nesting_violation_count}`,
    `Source liquidity warnings: ${snapshot.meta.source_liquidity_warning_count} (${snapshot.meta.source_liquidity_warning_rate_pct}%)`,
    '',
    '## Required Caveats',
    '',
    '- Gross yes-price probabilities drive coherence; fee-adjusted net odds remain preserved in the team-market map.',
    '- Liquidity-warned rows can contribute to eligible-context counts but never to actionable coherence probabilities.',
    '- Settlement terms are not locally verified, so this artifact is not an execution source.',
    '',
    '## Actionable Coherence by Team (most incoherent first)',
    '',
    '| Team | Eligible Context | Actionable | Max Div % | Softest | SB% | Conf% | Div% | Playoff% | Impl. Median Wins | Ladder Mono |',
    '|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---|',
  ];
  for (const row of snapshot.teams) {
    const markets = row.implied_win_pct_by_market;
    lines.push(
      `| ${row.team} | ${row.contract_counts.eligible_context} | ${row.contract_counts.actionable} | ` +
        `${row.max_divergence_pct} | ${row.softest_market || ''} | ${markets.super_bowl ?? ''} | ` +
        `${markets.conference ?? ''} | ${markets.division ?? ''} | ${markets.make_playoffs ?? ''} | ` +
        `${row.win_total_ladder.implied_median_wins ?? ''} | ${row.win_total_ladder.monotonic ? 'yes' : 'no'} |`,
    );
  }

  const flagged = snapshot.teams.filter((row) => row.max_divergence_pct > 0);
  if (flagged.length) {
    lines.push('', '## Detected Actionable-Coherence Inconsistencies', '');
    for (const row of flagged) {
      lines.push(`### ${row.team} - max divergence ${row.max_divergence_pct}pp`);
      for (const violation of row.championship_ladder.violations) {
        lines.push(
          `- Nesting: ${violation.lower_market} (${violation.lower_pct}%) > ` +
            `${violation.higher_market} (${violation.higher_pct}%) by ${violation.divergence_pct}pp`,
        );
      }
      for (const violation of row.win_total_ladder.violations) {
        lines.push(
          `- Ladder inversion: P(>=${violation.to}) exceeds P(>=${violation.from}) by ${violation.delta_pct}pp`,
        );
      }
      lines.push('');
    }
  }
  return `${lines.join('\n')}\n`;
}

export async function buildCrossMarketCoherence(options = {}) {
  const season = Number(options.season || DEFAULT_SEASON);
  const generatedAt = options.generatedAt || nowIso();
  const artifactDate = options.date || generatedAt.slice(0, 10);
  const source = options.sourceData ||
    (await readJson(
      options.source || path.join('data', 'prediction-markets', 'team-market-map-latest.json'),
      { contracts: [] },
    ));
  const rows = source.contracts || source.mapped || [];
  const explicitEligibilityContract = source.meta?.schema === 'prediction_market_team_map_v2';
  const eligibleContextRows = explicitEligibilityContract
    ? rows.filter(
        (row) => row.mapped === true && row.season === season && row.context_eligible === true,
      )
    : [];
  const actionableRows = explicitEligibilityContract
    ? eligibleContextRows.filter((row) => row.actionable_coherence_eligible === true)
    : [];

  const contextCounts = countByTeam(eligibleContextRows);
  const actionableCounts = countByTeam(actionableRows);
  const teams = buildTeamCoherence(actionableRows).map((team) => ({
    ...team,
    contract_counts: {
      eligible_context: contextCounts.get(team.team) || 0,
      actionable: actionableCounts.get(team.team) || 0,
      context_only: Math.max(0, (contextCounts.get(team.team) || 0) - (actionableCounts.get(team.team) || 0)),
    },
  }));
  const ladderInversions = teams.reduce((count, team) => count + team.win_total_ladder.violations.length, 0);
  const nestingViolations = teams.reduce(
    (count, team) => count + team.championship_ladder.violations.length,
    0,
  );
  const sourceLiquidityWarnings = Number.isFinite(Number(source.meta?.liquidity_warning_count))
    ? Number(source.meta.liquidity_warning_count)
    : rows.filter((row) => row.liquidity_warning).length;
  const sourceLiquidityWarningRate = Number.isFinite(Number(source.meta?.liquidity_warning_rate_pct))
    ? Number(source.meta.liquidity_warning_rate_pct)
    : rows.length
      ? Number(((sourceLiquidityWarnings / rows.length) * 100).toFixed(2))
      : 0;

  const snapshot = {
    meta: {
      schema: 'prediction_market_cross_market_coherence_v2',
      season,
      artifact_date: artifactDate,
      generated_at: generatedAt,
      source_generated_at: source.meta?.generated_at || null,
      source_schema: source.meta?.schema || null,
      source_contract_count: rows.length,
      explicit_eligibility_contract: explicitEligibilityContract,
      eligible_context_contract_count: eligibleContextRows.length,
      actionable_contract_count: actionableRows.length,
      context_only_contract_count: Math.max(0, eligibleContextRows.length - actionableRows.length),
      excluded_contract_count: Math.max(0, rows.length - eligibleContextRows.length),
      eligible_context_team_count: new Set(eligibleContextRows.map((row) => row.team)).size,
      team_count: teams.length,
      execution_eligible_contract_count: rows.filter((row) => row.execution_eligible === true).length,
      liquidity_warned_context_count: eligibleContextRows.filter((row) => row.liquidity_warning).length,
      fee_missing_context_count: eligibleContextRows.filter(
        (row) => row.fee_adjustment_status !== 'net_odds_available',
      ).length,
      source_liquidity_warning_count: sourceLiquidityWarnings,
      source_liquidity_warning_rate_pct: sourceLiquidityWarningRate,
      incoherent_count: teams.filter((team) => team.max_divergence_pct > 0).length,
      ladder_inversion_count: ladderInversions,
      nesting_violation_count: nestingViolations,
      ladder_tolerance_pct: LADDER_TOLERANCE_PCT,
      nesting_tolerance_pct: NESTING_TOLERANCE_PCT,
      coherence_basis: 'actionable_coherence_contracts_only',
      recommendation_status: 'consensus_context_only_not_execution_source',
      execution_source_status: 'blocked_settlement_terms_unverified',
      target_field: 'market_snapshot.cross_market_coherence',
      caveats: [
        'Gross yes-price probabilities drive coherence; fee-adjusted net odds remain in the source map.',
        'Liquidity-warned and otherwise ineligible rows are excluded from actionable coherence math.',
        'Settlement terms are not locally verified; this artifact is not an execution source.',
      ],
      guardrails: {
        live_model_calls: false,
        network_fetches: false,
        supabase_writes: false,
        official_picks_generated: false,
        portfolio_mutations: false,
      },
    },
    teams,
  };

  if (options.dryRun) return { snapshot, outputs: null };

  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(DOCS_DIR, { recursive: true });
  const jsonPath = path.join(OUT_DIR, `cross-market-coherence-${artifactDate}.json`);
  const latestPath = path.join(OUT_DIR, 'cross-market-coherence-latest.json');
  const mdPath = path.join(DOCS_DIR, `cross-market-coherence-${artifactDate}.md`);
  const latestMdPath = path.join(DOCS_DIR, 'cross-market-coherence-latest.md');
  const markdown = renderMarkdown(snapshot);
  await writeFile(jsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  await writeFile(latestPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  await writeFile(mdPath, markdown, 'utf8');
  await writeFile(latestMdPath, markdown, 'utf8');
  return { snapshot, outputs: { jsonPath, latestPath, mdPath, latestMdPath } };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { snapshot, outputs } = await buildCrossMarketCoherence({
    season: Number(args.season || DEFAULT_SEASON),
    source: args.source || null,
    date: args.date || null,
    dryRun: args['dry-run'] === true || args['no-persist'] === true,
  });
  console.log(
    `Cross-market coherence complete: ${snapshot.meta.eligible_context_contract_count} eligible-context contracts, ` +
      `${snapshot.meta.actionable_contract_count} actionable for math, ${snapshot.meta.team_count} actionable teams.`,
  );
  console.log(
    `Incoherent actionable teams: ${snapshot.meta.incoherent_count} ` +
      `(${snapshot.meta.ladder_inversion_count} ladder inversions, ` +
      `${snapshot.meta.nesting_violation_count} nesting violations).`,
  );
  if (outputs) {
    console.log(`Coherence: ${outputs.latestPath}`);
    console.log(`Markdown: ${outputs.latestMdPath}`);
  } else {
    console.log('--dry-run/--no-persist: coherence/report files were not written.');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
