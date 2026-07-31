#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, nowIso } from './training-camp-intel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_SEASON = 2026;
const OUT_DIR = path.join(ROOT, 'data', 'player-availability');
const DOCS_DIR = path.join(ROOT, 'docs', 'player-availability');

const IMPACT_POINTS = {
  qb_major: 42,
  offensive_line_major: 30,
  defensive_front_major: 28,
  defensive_major: 22,
  skill_major: 20,
  starter_uncertain: 18,
  depth_only: 4,
};

const TREND_POINTS = {
  worsening: 18,
  improving: 10,
  stable: 4,
  unknown: 1,
};

const EVENT_POINTS = {
  ir: 22,
  pup: 18,
  out: 18,
  doubtful: 14,
  setback: 16,
  suspension: 12,
  return_to_practice: 10,
  limited_return: 8,
  limited: 5,
  active_news: 1,
  status_update: 2,
};

const MARKET_POINTS = {
  super_bowl: 8,
  conference: 6,
  division: 5,
  make_playoffs: 4,
  wins: 3,
  player_props: 1,
  fantasy: 1,
};

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

function starterIndex(projectedStarters) {
  const index = new Map();
  for (const row of projectedStarters.players || []) {
    const key = `${row.team}|${String(row.player_name || '').toLowerCase()}`;
    const existing = index.get(key);
    if (!existing || row.starter_confidence > existing.starter_confidence) index.set(key, row);
  }
  return index;
}

function isGenericActiveNews(event, starterRow) {
  if (starterRow) return false;
  if (event.availability_trend === 'worsening') return false;
  if (event.event_type !== 'active_news' && event.event_type !== 'status_update') return false;
  return !/starter|starting|first[- ]team|no\.?\s*1|primary|key role|return|pup|injur|limited|out|questionable/i.test([
    event.short_summary,
    event.supporting_quote,
  ].filter(Boolean).join(' '));
}

function scoreEvent(event, starterRow) {
  let score = 0;
  score += IMPACT_POINTS[event.impact_bucket] ?? 8;
  score += TREND_POINTS[event.availability_trend] ?? 0;
  score += EVENT_POINTS[event.event_type] ?? 0;
  for (const market of event.linked_markets || []) score += MARKET_POINTS[market] ?? 0;
  if (starterRow) score += Math.round((starterRow.starter_confidence || 0.5) * 24);
  if (event.availability_group === 'offensive_line' && event.availability_trend === 'worsening') score += 10;
  if (event.availability_group === 'defensive_front' && event.availability_trend === 'worsening') score += 8;
  if (event.needs_human_review) score += 2;
  return score;
}

function classificationWarning(event) {
  const text = [event.short_summary, event.supporting_quote].filter(Boolean).join(' ');
  if (
    event.availability_trend === 'worsening' &&
    /\b(activated .*off|removed from .*pup|cleared|full speed|participat(?:ed|es|ing)|returned to practice|all set to participate|on the field participating|good to go)\b/i.test(text)
  ) {
    return 'worsening_label_conflicts_with_improving_text';
  }
  if (
    event.availability_trend === 'improving' &&
    /\b(will miss|miss the start|out for the season|season-ending|placed on|not practicing|did not participate)\b/i.test(text)
  ) {
    return 'improving_label_conflicts_with_setback_text';
  }
  return null;
}

function digestEvent(event, starterRow) {
  const warning = classificationWarning(event);
  const score = Math.max(0, scoreEvent(event, starterRow) - (warning ? 18 : 0));
  const signal = warning
    ? 'classification_review'
    : event.availability_trend === 'worsening'
    ? 'negative_availability'
    : event.availability_trend === 'improving'
      ? 'positive_availability'
      : 'review_context';
  return {
    id: event.id,
    team: event.team_abbr,
    player_name: event.player_name || null,
    position: event.position || null,
    unit: event.availability_group || 'other',
    event_type: event.event_type,
    availability_trend: event.availability_trend,
    impact_bucket: event.impact_bucket,
    starter_match: starterRow ? {
      role: starterRow.role,
      starter_confidence: starterRow.starter_confidence,
      source_count: starterRow.source_count,
    } : null,
    score,
    signal,
    linked_markets: event.linked_markets || ['wins'],
    source: event.source,
    source_url: event.source_url || null,
    published_at: event.published_at || null,
    summary: compact(event.short_summary),
    evidence: compact(event.supporting_quote || event.short_summary, 420),
    classification_warning: warning,
    needs_human_review: true,
  };
}

function teamSummary(team, events) {
  const top = events.slice(0, 8);
  const worsening = events.filter((event) => event.availability_trend === 'worsening');
  const improving = events.filter((event) => event.availability_trend === 'improving');
  return {
    team,
    event_count: events.length,
    top_score: top[0]?.score || 0,
    worsening_count: worsening.length,
    improving_count: improving.length,
    starter_matched_count: events.filter((event) => event.starter_match).length,
    qb_events: events.filter((event) => event.impact_bucket === 'qb_major').length,
    offensive_line_worsening: worsening.filter((event) => event.unit === 'offensive_line').length,
    defensive_front_worsening: worsening.filter((event) => event.unit === 'defensive_front').length,
    top_events: top,
  };
}

function renderMarkdown(digest) {
  const lines = [
    `# Starter Impact Availability Digest - ${digest.meta.generated_at.slice(0, 10)}`,
    '',
    '> Local futures-relevance triage only. This is not a betting recommendation and does not authorize official picks.',
    '',
    `Season: ${digest.meta.season}`,
    `Generated: ${digest.meta.generated_at}`,
    `Source events: ${digest.meta.source_event_count} | Digest events: ${digest.meta.digest_event_count} | Starter-matched: ${digest.meta.starter_matched_count}`,
    '',
    '## Top Availability Signals',
    '',
  ];

  for (const event of digest.top_events.slice(0, 40)) {
    const player = event.player_name ? `${event.player_name}${event.position ? ` (${event.position})` : ''}` : 'Team item';
    lines.push(`- ${event.team} ${player}: ${event.signal}, score ${event.score}`);
    lines.push(`  - ${event.availability_trend}/${event.event_type} | ${event.impact_bucket} | markets ${event.linked_markets.join(', ')}`);
    if (event.starter_match) lines.push(`  - Starter match: ${event.starter_match.role}, confidence ${event.starter_match.starter_confidence}, sources ${event.starter_match.source_count}`);
    if (event.classification_warning) lines.push(`  - Classification warning: ${event.classification_warning}`);
    lines.push(`  - Evidence: ${event.evidence || event.summary}`);
  }

  lines.push('', '## Team Digest', '', '| Team | Events | Top Score | Worsening | Improving | Starter Matched | QB | OL Worsening | DL Worsening |', '|---|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (const team of Object.values(digest.teams).sort((a, b) => b.top_score - a.top_score || a.team.localeCompare(b.team))) {
    lines.push(`| ${team.team} | ${team.event_count} | ${team.top_score} | ${team.worsening_count} | ${team.improving_count} | ${team.starter_matched_count} | ${team.qb_events} | ${team.offensive_line_worsening} | ${team.defensive_front_worsening} |`);
  }
  return `${lines.join('\n')}\n`;
}

export async function buildAvailabilityImpactDigest(options = {}) {
  const season = Number(options.season || DEFAULT_SEASON);
  const generatedAt = options.generatedAt || nowIso();
  const availability = await readJson(options.availability || path.join('data', 'player-availability', 'latest.json'));
  const projectedStarters = await readJson(options.projectedStarters || path.join('data', 'projected-starters', String(season), 'latest.json'), { players: [] });
  const starters = starterIndex(projectedStarters);

  const digestEvents = [];
  for (const event of availability.events || []) {
    const key = `${event.team_abbr}|${String(event.player_name || '').toLowerCase()}`;
    const starterRow = starters.get(key) || null;
    if (isGenericActiveNews(event, starterRow)) continue;
    const digest = digestEvent(event, starterRow);
    if (digest.score >= 28 || digest.starter_match || digest.availability_trend === 'worsening') {
      digestEvents.push(digest);
    }
  }
  digestEvents.sort((a, b) => b.score - a.score || String(b.published_at).localeCompare(String(a.published_at)));

  const teams = {};
  for (const event of digestEvents) {
    teams[event.team] ??= [];
    teams[event.team].push(event);
  }

  const digest = {
    meta: {
      schema: 'starter_impact_availability_digest_v1',
      season,
      generated_at: generatedAt,
      source_event_count: availability.meta?.event_count || (availability.events || []).length,
      digest_event_count: digestEvents.length,
      starter_matched_count: digestEvents.filter((event) => event.starter_match).length,
      projected_starters_schema: projectedStarters.meta?.schema || null,
      recommendation_status: 'research_context_only_not_picks',
      guardrails: {
        live_model_calls: false,
        network_fetches: false,
        supabase_writes: false,
        official_picks_generated: false,
      },
    },
    top_events: digestEvents,
    teams: Object.fromEntries(Object.entries(teams).map(([team, events]) => [team, teamSummary(team, events)])),
  };

  if (options.dryRun) return { digest, outputs: null };

  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(DOCS_DIR, { recursive: true });
  const date = options.date || generatedAt.slice(0, 10);
  const jsonPath = path.join(OUT_DIR, `impact-digest-${date}.json`);
  const latestPath = path.join(OUT_DIR, 'impact-digest-latest.json');
  const mdPath = path.join(DOCS_DIR, `starter-impact-digest-${date}.md`);
  const latestMdPath = path.join(DOCS_DIR, 'starter-impact-digest-latest.md');
  const markdown = renderMarkdown(digest);
  await writeFile(jsonPath, `${JSON.stringify(digest, null, 2)}\n`, 'utf8');
  await writeFile(latestPath, `${JSON.stringify(digest, null, 2)}\n`, 'utf8');
  await writeFile(mdPath, markdown, 'utf8');
  await writeFile(latestMdPath, markdown, 'utf8');
  return { digest, outputs: { jsonPath, latestPath, mdPath, latestMdPath } };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { digest, outputs } = await buildAvailabilityImpactDigest({
    season: Number(args.season || DEFAULT_SEASON),
    availability: args.availability || null,
    projectedStarters: args['projected-starters'] || null,
    date: args.date || null,
    dryRun: args['dry-run'] === true || args['no-persist'] === true,
  });

  console.log(`Availability impact digest complete: ${digest.meta.digest_event_count} digest event(s) from ${digest.meta.source_event_count} source event(s).`);
  console.log(`Starter-matched events: ${digest.meta.starter_matched_count}`);
  if (outputs) {
    console.log(`Digest: ${outputs.latestPath}`);
    console.log(`Markdown: ${outputs.latestMdPath}`);
  } else {
    console.log('--dry-run/--no-persist: digest/report files were not written.');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
