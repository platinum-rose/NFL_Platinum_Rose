#!/usr/bin/env node

// ═══════════════════════════════════════════════════════════════════════════════
// EXPANSION F · Cross-market coherence / internal arbitrage (Lev 4, FREE-PLUMB)
// ═══════════════════════════════════════════════════════════════════════════════
// A team's own prediction markets should imply one consistent win probability.
// They often don't. This builder consumes prices already in hand (the Kalshi /
// Polymarket team-market map) and detects pure-math incoherence — no new data
// acquisition, no LLM calls, no network. Two coherence checks per team:
//
//   1. Win-total ladder monotonicity  — P(win >= N games) must be non-increasing
//      in N. An inversion (e.g. P(>=9) > P(>=8)) is a rounding/soft-line error.
//      Also derives the market-implied median win total via linear interpolation.
//   2. Championship nesting            — P(Super Bowl) <= P(Conference) <=
//      P(make playoffs), and P(Division) <= P(make playoffs). A violation is a
//      code-detectable arbitrage signal (edge_type: math); the model explains it.
//
// Market identity is re-classified from contract TITLES here (not the upstream
// `market` label), because the mapper buckets seed / conf-champ / player-prop
// contracts imprecisely. Coherence math is only as honest as its rung labels.
//
// Feeds proposed dossier field:
//   market_snapshot.cross_market_coherence
//     { implied_win_pct_by_market, max_divergence, softest_market }
// ═══════════════════════════════════════════════════════════════════════════════

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

// Tolerances (percentage points) that absorb vig + integer-cent rounding noise
// before a divergence is treated as a genuine incoherence signal.
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
  const nums = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (!nums.length) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

/**
 * Re-classify a contract title into a coherence rung. Order matters: more
 * specific patterns are tested before generic ones.
 * @param {string} title
 * @returns {{ rung: string, threshold?: number }}
 */
function classifyRung(title) {
  const t = String(title || '').toLowerCase();
  const winMatch =
    t.match(/(?:win )?at least (\d+)\s*(?:games|wins)/) || t.match(/(\d+)\+\s*(?:wins|games)/);
  if (winMatch) return { rung: 'win_total', threshold: Number(winMatch[1]) };
  if (/\bseed\b/.test(t)) return { rung: 'seed' };
  if (/(?:afc|nfc)\s+(?:north|south|east|west)/.test(t) || /\bdivision\b/.test(t)) {
    return { rung: 'division' };
  }
  if (/(?:afc|nfc)\s+(?:championship|conference)/.test(t) || /win the (?:afc|nfc)\b/.test(t)) {
    return { rung: 'conference' };
  }
  if (/super\s*bowl|league champ|\bchampionship\b/.test(t)) return { rung: 'super_bowl' };
  if (/playoff|postseason/.test(t)) return { rung: 'make_playoffs' };
  return { rung: 'other' };
}

/**
 * Interpolate the win total N at which the survival curve P(wins >= N) crosses
 * 50%. Returns the market-implied median win total.
 * @param {Array<{threshold:number, implied_prob:number}>} points sorted asc
 * @returns {number|null}
 */
function impliedMedianWins(points) {
  if (points.length < 2) return null;
  for (let i = 0; i < points.length - 1; i += 1) {
    const hi = points[i]; // lower threshold, higher prob
    const lo = points[i + 1]; // higher threshold, lower prob
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

/**
 * Build per-team coherence from mapped prediction-market rows.
 * @param {Array<object>} mapped
 * @returns {Array<object>}
 */
function buildTeamCoherence(mapped) {
  const byTeam = new Map();
  for (const row of mapped) {
    if (!row.team) continue;
    const pct = Number(row.implied_probability_pct);
    if (!Number.isFinite(pct)) continue;
    const { rung, threshold } = classifyRung(row.title);
    if (rung === 'other' || rung === 'seed') continue;
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
    // Win-total ladder (median prob per threshold, sorted ascending by N).
    const ladderPoints = [];
    const impliedByMarket = { super_bowl: null, conference: null, division: null, make_playoffs: null };
    for (const bucket of entry.rungs.values()) {
      const p = median(bucket.probs);
      if (p === null) continue;
      if (bucket.rung === 'win_total') {
        ladderPoints.push({ threshold: bucket.threshold, implied_prob: p });
      } else {
        impliedByMarket[bucket.rung] = p;
      }
    }
    ladderPoints.sort((a, b) => a.threshold - b.threshold);

    // 1. Win-total monotonicity.
    const ladderViolations = [];
    for (let i = 0; i < ladderPoints.length - 1; i += 1) {
      const from = ladderPoints[i];
      const to = ladderPoints[i + 1];
      const delta = to.implied_prob - from.implied_prob; // should be <= 0
      if (delta > LADDER_TOLERANCE_PCT) {
        ladderViolations.push({
          from: from.threshold,
          to: to.threshold,
          delta_pct: Math.round(delta * 100) / 100,
        });
      }
    }

    // 2. Championship nesting constraints.
    const nesting = [
      { constraint: 'super_bowl<=conference', lower: 'super_bowl', higher: 'conference' },
      { constraint: 'conference<=make_playoffs', lower: 'conference', higher: 'make_playoffs' },
      { constraint: 'super_bowl<=make_playoffs', lower: 'super_bowl', higher: 'make_playoffs' },
      { constraint: 'division<=make_playoffs', lower: 'division', higher: 'make_playoffs' },
    ];
    const nestingViolations = [];
    for (const rule of nesting) {
      const lowerPct = impliedByMarket[rule.lower];
      const higherPct = impliedByMarket[rule.higher];
      if (lowerPct === null || higherPct === null) continue;
      const divergence = lowerPct - higherPct; // should be <= 0
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

    // Max divergence + softest (overpriced) market across all checks.
    let maxDivergence = 0;
    let softestMarket = null;
    for (const v of nestingViolations) {
      if (v.divergence_pct > maxDivergence) {
        maxDivergence = v.divergence_pct;
        softestMarket = v.lower_market; // the leg priced too high vs its superset
      }
    }
    for (const v of ladderViolations) {
      if (v.delta_pct > maxDivergence) {
        maxDivergence = v.delta_pct;
        softestMarket = `win_total_${v.to}`; // the higher-N leg priced above its subset
      }
    }

    const fairByMarket = {
      super_bowl: fairAmerican(impliedByMarket.super_bowl),
      conference: fairAmerican(impliedByMarket.conference),
      division: fairAmerican(impliedByMarket.division),
      make_playoffs: fairAmerican(impliedByMarket.make_playoffs),
    };

    results.push({
      team: entry.team,
      team_nick: entry.team_nick,
      implied_win_pct_by_market: impliedByMarket,
      fair_american_by_market: fairByMarket,
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

  results.sort((a, b) => b.max_divergence_pct - a.max_divergence_pct);
  return results;
}

function renderMarkdown(snapshot) {
  const lines = [
    `# Cross-Market Coherence - ${snapshot.meta.generated_at.slice(0, 10)}`,
    '',
    '> Consensus context only. Prediction markets are not sportsbook execution prices',
    '> and do not authorize recommendations. Incoherence flags are pure-math signals',
    '> derived from prices already in hand.',
    '',
    `Generated: ${snapshot.meta.generated_at}`,
    `Teams: ${snapshot.meta.team_count} | Incoherent: ${snapshot.meta.incoherent_count} | ` +
      `Ladder inversions: ${snapshot.meta.ladder_inversion_count} | ` +
      `Nesting violations: ${snapshot.meta.nesting_violation_count}`,
    '',
    '## Coherence by Team (most incoherent first)',
    '',
    '| Team | Max Div % | Softest | SB% | Conf% | Div% | Playoff% | Impl. Median Wins | Ladder Mono |',
    '|---|---:|---|---:|---:|---:|---:|---:|---|',
  ];
  for (const row of snapshot.teams) {
    const m = row.implied_win_pct_by_market;
    lines.push(
      `| ${row.team} | ${row.max_divergence_pct} | ${row.softest_market || ''} | ` +
        `${m.super_bowl ?? ''} | ${m.conference ?? ''} | ${m.division ?? ''} | ` +
        `${m.make_playoffs ?? ''} | ${row.win_total_ladder.implied_median_wins ?? ''} | ` +
        `${row.win_total_ladder.monotonic ? 'yes' : 'no'} |`,
    );
  }

  const flagged = snapshot.teams.filter((r) => r.max_divergence_pct > 0);
  if (flagged.length) {
    lines.push('', '## Detected Incoherences', '');
    for (const row of flagged) {
      lines.push(`### ${row.team} - max divergence ${row.max_divergence_pct}pp`);
      for (const v of row.championship_ladder.violations) {
        lines.push(
          `- Nesting: ${v.lower_market} (${v.lower_pct}%) > ${v.higher_market} (${v.higher_pct}%) ` +
            `by ${v.divergence_pct}pp`,
        );
      }
      for (const v of row.win_total_ladder.violations) {
        lines.push(
          `- Ladder inversion: P(>=${v.to}) exceeds P(>=${v.from}) by ${v.delta_pct}pp`,
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
  const source = await readJson(
    options.source || path.join('data', 'prediction-markets', 'team-market-map-latest.json'),
    { mapped: [] },
  );
  const teams = buildTeamCoherence(source.mapped || []);
  const ladderInversions = teams.reduce((n, t) => n + t.win_total_ladder.violations.length, 0);
  const nestingViolations = teams.reduce((n, t) => n + t.championship_ladder.violations.length, 0);

  const snapshot = {
    meta: {
      schema: 'prediction_market_cross_market_coherence_v1',
      season,
      generated_at: generatedAt,
      source_generated_at: source.meta?.generated_at || null,
      team_count: teams.length,
      incoherent_count: teams.filter((t) => t.max_divergence_pct > 0).length,
      ladder_inversion_count: ladderInversions,
      nesting_violation_count: nestingViolations,
      ladder_tolerance_pct: LADDER_TOLERANCE_PCT,
      nesting_tolerance_pct: NESTING_TOLERANCE_PCT,
      recommendation_status: 'consensus_context_only_not_execution_prices',
      target_field: 'market_snapshot.cross_market_coherence',
      guardrails: {
        live_model_calls: false,
        network_fetches: false,
        supabase_writes: false,
        official_picks_generated: false,
      },
    },
    teams,
  };

  if (options.dryRun) return { snapshot, outputs: null };

  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(DOCS_DIR, { recursive: true });
  const date = options.date || generatedAt.slice(0, 10);
  const jsonPath = path.join(OUT_DIR, `cross-market-coherence-${date}.json`);
  const latestPath = path.join(OUT_DIR, 'cross-market-coherence-latest.json');
  const mdPath = path.join(DOCS_DIR, `cross-market-coherence-${date}.md`);
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
    `Cross-market coherence complete: ${snapshot.meta.team_count} teams, ` +
      `${snapshot.meta.incoherent_count} incoherent ` +
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

// Windows drive-letter-casing fix (see agents/fantasy-value-report.js for full note) —
// compare via pathToFileURL, not path.resolve() === fileURLToPath().
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
