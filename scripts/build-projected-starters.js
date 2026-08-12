#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { NFL_TEAMS, getTeamAbbreviation, normalizeTeam } from '../src/lib/teams.js';
import { indexNamedStatusReviews, validateNamedStatusReview } from '../agents/lib/named-status-review.js';
import { parseArgs, nowIso } from './training-camp-intel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_SEASON = 2026;
const OUT_DIR = path.join(ROOT, 'data', 'projected-starters', String(DEFAULT_SEASON));
const DOCS_DIR = path.join(ROOT, 'docs', 'projected-starters');

const STARTER_PATTERNS = [
  ['starter', /\b(starter|starting|starts?|first[- ]team|no\.?\s*1|number one|top (?:kicker|tight end|receiver|back)|lead(?:ing)? back)\b/i],
  ['primary_role', /\b(primary|featured|lead role|key role|key component|work ahead|open training camp as|expected to (?:serve|remain|lead|open)|set to (?:lead|retain|reprise))\b/i],
  ['competition', /\b(competing|competition|candidate|battle|split first-team|sharing first-team|rotation|complementary|backup|behind)\b/i],
  ['roster_signal', /\b(signed|claimed|agreed to terms|contract|waivers?|roster)\b/i],
];

const POSITION_UNITS = {
  QB: 'offense',
  RB: 'offense',
  FB: 'offense',
  WR: 'offense',
  TE: 'offense',
  T: 'offensive_line',
  OT: 'offensive_line',
  G: 'offensive_line',
  OG: 'offensive_line',
  C: 'offensive_line',
  OL: 'offensive_line',
  DE: 'defense',
  DT: 'defense',
  DL: 'defense',
  NT: 'defense',
  EDGE: 'defense',
  OLB: 'defense',
  LB: 'defense',
  CB: 'defense',
  S: 'defense',
  DB: 'defense',
  K: 'special_teams',
  PK: 'special_teams',
  P: 'special_teams',
};

function sha(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

async function readJson(relativePath, fallback = null) {
  try {
    return JSON.parse(await readFile(path.join(ROOT, relativePath), 'utf8'));
  } catch (err) {
    if (fallback !== null && err.code === 'ENOENT') return fallback;
    throw err;
  }
}

function compact(value, maxChars = 300) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  return clean.length > maxChars ? `${clean.slice(0, maxChars - 3).trim()}...` : clean;
}

function roleFromTags(tags) {
  if (tags.includes('starter') || tags.includes('primary_role')) return 'likely_starter_or_primary';
  if (tags.includes('competition')) return 'competition_or_rotation';
  return 'roster_depth_signal';
}

function confidenceFromTags(tags, sourceType) {
  let score = 0.42;
  if (tags.includes('starter')) score += 0.28;
  if (tags.includes('primary_role')) score += 0.2;
  if (tags.includes('competition')) score += 0.08;
  if (sourceType === 'manual_depth_chart') score += 0.18;
  return Number(Math.min(score, 0.94).toFixed(2));
}

function unitForPosition(position) {
  return POSITION_UNITS[String(position || '').toUpperCase()] || 'other';
}

const CANONICAL_PLAYER_TEAMS = {
  'Jalen Ramsey': 'MIA',
  'Nate Hobbs': 'LV',
  'Darnell Mooney': 'ATL',
  'Javonte Williams': 'DEN',
  'Evan Engram': 'JAX',
  'Jahan Dotson': 'WAS',
  'Cooper Kupp': 'LAR',
  'Rasul Douglas': 'BUF',
  'Isiah Pacheco': 'KC',
  'Hollywood Brown': 'KC',
  'Jakobi Meyers': 'LV',
  'Joshua Palmer': 'LAC',
  'Adonai Mitchell': 'IND',
  'Jauan Jennings': 'SF',
  'George Pickens': 'DAL',
  'Aaron Rodgers': 'PIT',
  'Russell Wilson': 'NYJ',
  'Justin Fields': 'NYJ',
};

function starterSignalFromEvent(event) {
  if (!event?.player_name || !event.position) return null;
  const text = [event.short_summary, event.supporting_quote, event.status_raw, event.source].filter(Boolean).join(' ');
  const evidenceTags = STARTER_PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([tag]) => tag);
  if (!evidenceTags.length) return null;
  
  // Use canonical team mapping if player is known, otherwise fall back to event.team_abbr
  const canonicalTeam = CANONICAL_PLAYER_TEAMS[event.player_name.trim()];
  const team = canonicalTeam || getTeamAbbreviation(event.team_abbr) || event.team_abbr;

  return {
    id: `starter_${sha([team, event.player_name, event.position, event.source_url || event.id].join('|')).slice(0, 16)}`,
    team,
    team_nick: normalizeTeam(team),
    player_name: event.player_name,
    position: event.position,
    unit: unitForPosition(event.position),
    role: roleFromTags(evidenceTags),
    starter_confidence: confidenceFromTags(evidenceTags, event.source_type),
    roster_confidence: Number(Math.max(0.6, confidenceFromTags(evidenceTags, event.source_type) - 0.04).toFixed(2)),
    source_count: 1,
    sources: [{
      source: event.source,
      source_type: event.source_type,
      source_url: event.source_url || null,
      published_at: event.published_at || null,
      evidence: compact(event.supporting_quote || event.short_summary),
    }],
    evidence_tags: evidenceTags,
    impact_bucket: event.impact_bucket || 'depth_only',
    needs_human_review: true,
    confidence_basis: 'local_availability_starter_language',
  };
}

async function readManualStarterRows(manualDir) {
  let entries = [];
  try {
    entries = await readdir(manualDir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }

  const rows = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const payload = JSON.parse(await readFile(path.join(manualDir, entry.name), 'utf8'));
    const items = Array.isArray(payload) ? payload : payload.players || payload.rows || [];
    for (const item of items) {
      const team = getTeamAbbreviation(item.team || item.team_abbr) || item.team || item.team_abbr;
      if (!team || !item.player_name) continue;
      const source = item.source || entry.name;
      rows.push({
        id: item.id || `starter_${sha([team, item.player_name, item.position, source].join('|')).slice(0, 16)}`,
        team,
        team_nick: normalizeTeam(team),
        player_name: item.player_name,
        position: item.position || null,
        unit: item.unit || unitForPosition(item.position),
        role: item.role || 'manual_projection',
        starter_confidence: Number(item.starter_confidence ?? 0.82),
        roster_confidence: Number(item.roster_confidence ?? 0.86),
        source_count: Number(item.source_count ?? 1),
        sources: item.sources || [{
          source,
          source_type: 'manual_depth_chart',
          source_url: item.source_url || null,
          published_at: item.published_at || null,
          evidence: compact(item.evidence || item.note || ''),
        }],
        evidence_tags: item.evidence_tags || ['manual_projection'],
        impact_bucket: item.impact_bucket || 'starter_uncertain',
        needs_human_review: item.needs_human_review ?? true,
        confidence_basis: item.confidence_basis || 'manual_depth_chart',
      });
    }
  }
  return rows;
}

function mergeStarterRows(rows) {
  const byPlayer = new Map();
  for (const row of rows) {
    const key = `${row.team}|${String(row.player_name).toLowerCase()}|${row.position || ''}`;
    const existing = byPlayer.get(key);
    if (!existing) {
      byPlayer.set(key, row);
      continue;
    }
    existing.source_count += row.source_count || 1;
    existing.sources.push(...(row.sources || []));
    existing.evidence_tags = [...new Set([...existing.evidence_tags, ...row.evidence_tags])];
    existing.starter_confidence = Number(Math.max(existing.starter_confidence, row.starter_confidence).toFixed(2));
    existing.roster_confidence = Number(Math.max(existing.roster_confidence, row.roster_confidence).toFixed(2));
    if (row.confidence_basis === 'manual_depth_chart') existing.confidence_basis = row.confidence_basis;
    if (row.role === 'manual_projection') existing.role = row.role;
  }
  return [...byPlayer.values()];
}

function buildTeams(rows, namedReviews = []) {
  const teams = {};
  for (const team of Object.values(NFL_TEAMS)) {
    teams[team.abbreviation] = {
      team: team.abbreviation,
      team_name: team.fullName,
      coverage_status: 'needs_manual_depth_chart',
      known: [],
      estimated: [],
      missing: ['verified all-position depth chart', 'manual source count reconciliation'],
      players: [],
      named_status_reviews: [],
    };
  }

  for (const row of rows) {
    const team = teams[row.team];
    if (!team) continue;
    team.players.push(row);
    if (row.confidence_basis === 'manual_depth_chart') team.known.push(`${row.player_name} ${row.position || ''}`.trim());
    else team.estimated.push(`${row.player_name} ${row.position || ''}`.trim());
  }

  for (const team of Object.values(teams)) {
    team.players.sort((a, b) =>
      b.starter_confidence - a.starter_confidence ||
      String(a.unit).localeCompare(String(b.unit)) ||
      String(a.player_name).localeCompare(String(b.player_name))
    );
    if (team.players.length) {
      team.coverage_status = team.known.length ? 'manual_and_estimated_signals' : 'estimated_from_local_starter_language';
      team.missing = team.known.length
        ? ['independent second-source depth-chart reconciliation']
        : ['manual all-position depth chart', 'independent source confirmation'];
    }
  }

  for (const review of namedReviews) {
    const team = teams[review.expected_team];
    if (!team) continue;
    team.named_status_reviews.push({
      player_name: review.player_name,
      review_status: review.review_status,
      eligible_for_synthesis: review.eligible_for_synthesis === true,
      missing: review.missing || [],
    });
    if (review.eligible_for_synthesis !== true) {
      team.missing = [...new Set([
        ...team.missing,
        `${review.player_name}: ${review.review_status.replace(/_/g, ' ')}`,
      ])];
    }
  }
  return teams;
}

function renderMarkdown(snapshot) {
  const lines = [
    `# Projected Starters Snapshot - ${snapshot.meta.generated_at.slice(0, 10)}`,
    '',
    '> Local projected/likely-starter evidence only. This is research context, not a depth-chart source of truth and not a betting recommendation.',
    '',
    `Season: ${snapshot.meta.season}`,
    `Generated: ${snapshot.meta.generated_at}`,
    `Players: ${snapshot.meta.player_count} | Teams with signals: ${snapshot.meta.teams_with_signals} | Manual rows: ${snapshot.meta.manual_row_count} | Estimated rows: ${snapshot.meta.estimated_row_count}`,
    '',
    '## Coverage',
    '',
    '| Team | Status | Players | Missing |',
    '|---|---:|---:|---|',
  ];

  for (const team of Object.values(snapshot.teams).sort((a, b) => a.team.localeCompare(b.team))) {
    lines.push(`| ${team.team} | ${team.coverage_status} | ${team.players.length} | ${team.missing.join('; ')} |`);
  }

  lines.push('', '## Named Status Review Gate', '');
  for (const review of snapshot.named_status_reviews || []) {
    lines.push(`- ${review.expected_team} ${review.player_name}: ${review.review_status}; synthesis eligible ${review.eligible_for_synthesis ? 'yes' : 'no'}`);
    lines.push(`  - Missing: ${(review.missing || []).join('; ') || 'none'}`);
    lines.push(`  - Disposition: ${review.disposition}`);
  }

  lines.push('', '## Player Signals', '');
  for (const team of Object.values(snapshot.teams).filter((t) => t.players.length).sort((a, b) => a.team.localeCompare(b.team))) {
    lines.push(`### ${team.team}`, '');
    for (const player of team.players.slice(0, 18)) {
      lines.push(`- ${player.player_name} (${player.position || 'UNK'}): ${player.role}, starter ${player.starter_confidence}, roster ${player.roster_confidence}`);
      lines.push(`  - Tags: ${player.evidence_tags.join(', ')} | Impact: ${player.impact_bucket} | Review: ${player.needs_human_review ? 'yes' : 'no'}`);
      const source = player.sources[0];
      if (source?.evidence) lines.push(`  - Evidence: ${source.evidence}`);
    }
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

export async function buildProjectedStarters(options = {}) {
  const season = Number(options.season || DEFAULT_SEASON);
  const generatedAt = options.generatedAt || nowIso();
  const availabilityInput = options.availability || path.join('data', 'player-availability', 'latest.json');
  const namedStatusReviewInput = options.namedStatusReview || path.join('data', 'projected-starters', String(season), 'named-status-review.json');
  const availability = await readJson(availabilityInput, { events: [] });
  const namedStatusReview = await readJson(
    namedStatusReviewInput,
    { cases: [] },
  );
  const namedReviewValidation = validateNamedStatusReview(namedStatusReview);
  const namedReviewIndex = indexNamedStatusReviews(namedStatusReview);
  const manualDir = path.join(ROOT, options.manualDir || path.join('data', 'projected-starters', String(season), 'manual'));
  const manualRows = await readManualStarterRows(manualDir);
  const estimatedRows = (availability.events || [])
    .filter((event) => event.synthesis_eligible !== false)
    .filter((event) => namedReviewIndex.get(String(event.player_name || '').toLowerCase())?.eligible_for_synthesis !== false)
    .map(starterSignalFromEvent)
    .filter(Boolean);
  const eligibleManualRows = manualRows.filter((row) => namedReviewIndex.get(String(row.player_name || '').toLowerCase())?.eligible_for_synthesis !== false);
  const players = mergeStarterRows([...eligibleManualRows, ...estimatedRows]);
  const teams = buildTeams(players, namedStatusReview.cases || []);
  const snapshot = {
    meta: {
      schema: 'projected_starters_snapshot_v1',
      season,
      generated_at: generatedAt,
      source_policy: 'manual_depth_chart_rows_plus_local_availability_starter_language',
      player_count: players.length,
      manual_row_count: manualRows.length,
      eligible_manual_row_count: eligibleManualRows.length,
      estimated_row_count: estimatedRows.length,
      withheld_named_manual_row_count: manualRows.length - eligibleManualRows.length,
      teams_with_signals: Object.values(teams).filter((team) => team.players.length).length,
      teams_needing_manual_depth_chart: Object.values(teams).filter((team) => !team.known.length).length,
      named_status_review_validation: namedReviewValidation,
      inputs: {
        availability: {
          path: availabilityInput,
          generated_at: availability.meta?.generated_at || null,
          evidence_validation_status: availability.meta?.availability_evidence_validation?.status || null,
        },
        named_status_review: {
          path: namedStatusReviewInput,
          reviewed_at: namedStatusReview.meta?.reviewed_at || null,
          validation_status: namedReviewValidation.status,
        },
        manual_directory: path.relative(ROOT, manualDir),
      },
      recommendation_status: 'research_context_only_not_picks',
      guardrails: {
        live_model_calls: false,
        network_fetches: false,
        supabase_writes: false,
        official_picks_generated: false,
      },
    },
    named_status_reviews: namedStatusReview.cases || [],
    teams,
    players,
  };

  if (options.dryRun) return { snapshot, outputs: null };
  if (namedReviewValidation.status !== 'pass') {
    throw new Error('Refusing to write projected starters: named status review validation is blocked.');
  }

  const outDir = path.join(ROOT, 'data', 'projected-starters', String(season));
  await mkdir(outDir, { recursive: true });
  await mkdir(DOCS_DIR, { recursive: true });
  const date = options.date || generatedAt.slice(0, 10);
  const jsonPath = path.join(outDir, `projected-starters-${date}.json`);
  const latestPath = path.join(outDir, 'latest.json');
  const mdPath = path.join(DOCS_DIR, `projected-starters-${date}.md`);
  const latestMdPath = path.join(DOCS_DIR, 'projected-starters-latest.md');
  const markdown = renderMarkdown(snapshot);
  await writeFile(jsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  await writeFile(latestPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  await writeFile(mdPath, markdown, 'utf8');
  await writeFile(latestMdPath, markdown, 'utf8');
  return { snapshot, outputs: { jsonPath, latestPath, mdPath, latestMdPath } };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { snapshot, outputs } = await buildProjectedStarters({
    season: Number(args.season || DEFAULT_SEASON),
    availability: args.availability || null,
    manualDir: args['manual-dir'] || null,
    namedStatusReview: args['named-status-review'] || null,
    date: args.date || null,
    dryRun: args['dry-run'] === true || args['no-persist'] === true,
  });

  console.log(`Projected starters build complete: ${snapshot.meta.player_count} player signal(s), ${snapshot.meta.teams_with_signals} team(s).`);
  console.log(`Manual rows ${snapshot.meta.manual_row_count} | estimated rows ${snapshot.meta.estimated_row_count} | teams needing manual depth chart ${snapshot.meta.teams_needing_manual_depth_chart}`);
  if (outputs) {
    console.log(`Snapshot: ${outputs.latestPath}`);
    console.log(`Markdown: ${outputs.latestMdPath}`);
  } else {
    console.log('--dry-run/--no-persist: snapshot/report files were not written.');
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
