#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs, nowIso } from './training-camp-intel.js';
import { indexNamedStatusReviews, validateNamedStatusReview } from '../agents/lib/named-status-review.js';

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
  if (event.status_conflict?.code) return event.status_conflict.code;
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

function digestEvent(event, starterRow, namedReview = null) {
  const warning = classificationWarning(event);
  const namedConflict = namedReview?.review_status === 'conflicted_team_assignment';
  const namedWithheld = Boolean(namedReview && namedReview.eligible_for_synthesis !== true);
  const explicitConflict = event.evidence_status === 'conflicted_intel' || namedConflict;
  const synthesisEligible = event.synthesis_eligible !== false && !warning && !namedWithheld;
  const penalty = explicitConflict ? 40 : (namedWithheld ? 30 : (warning ? 18 : 0));
  const score = Math.max(0, scoreEvent(event, starterRow) - penalty);
  const signal = explicitConflict
    ? 'conflicted_intel'
    : namedWithheld
      ? 'needs_confirmation'
      : warning
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
    evidence_status: explicitConflict ? 'conflicted_intel' : (event.evidence_status || 'unverified_no_conflict_detected'),
    synthesis_eligible: synthesisEligible,
    named_status_review: namedReview ? {
      expected_team: namedReview.expected_team,
      observed_team_assignments: namedReview.observed_team_assignments || [],
      review_status: namedReview.review_status,
      human_verified: namedReview.human_verified === true,
      missing: namedReview.missing || [],
      disposition: namedReview.disposition || null,
    } : null,
    needs_human_review: true,
  };
}

function teamSummary(team, events) {
  const top = events.slice(0, 8);
  const eligible = events.filter((event) => event.synthesis_eligible === true);
  const worsening = eligible.filter((event) => event.availability_trend === 'worsening');
  const improving = eligible.filter((event) => event.availability_trend === 'improving');
  return {
    team,
    event_count: events.length,
    synthesis_eligible_count: eligible.length,
    conflicted_intel_count: events.filter((event) => event.signal === 'conflicted_intel').length,
    needs_confirmation_count: events.filter((event) => event.signal === 'needs_confirmation').length,
    classification_review_count: events.filter((event) => event.signal === 'classification_review').length,
    top_score: eligible[0]?.score || 0,
    worsening_count: worsening.length,
    improving_count: improving.length,
    starter_matched_count: eligible.filter((event) => event.starter_match).length,
    qb_events: eligible.filter((event) => event.impact_bucket === 'qb_major').length,
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
    '## Conflicted / Withheld Intel',
    '',
  ];

  for (const event of [...digest.conflicted_events, ...digest.needs_confirmation_events]) {
    const player = event.player_name ? `${event.player_name}${event.position ? ` (${event.position})` : ''}` : 'Team item';
    lines.push(`- ${event.team} ${player}: ${event.signal}; synthesis eligible no`);
    if (event.classification_warning) lines.push(`  - Classification warning: ${event.classification_warning}`);
    if (event.named_status_review) lines.push(`  - Named review: ${event.named_status_review.review_status}; missing ${(event.named_status_review.missing || []).join('; ')}`);
    lines.push(`  - Evidence: ${event.evidence || event.summary}`);
  }

  lines.push('', '## Top Availability Signals', '');

  for (const event of digest.top_events.filter((item) => item.synthesis_eligible).slice(0, 40)) {
    const player = event.player_name ? `${event.player_name}${event.position ? ` (${event.position})` : ''}` : 'Team item';
    lines.push(`- ${event.team} ${player}: ${event.signal}, score ${event.score}`);
    lines.push(`  - ${event.availability_trend}/${event.event_type} | ${event.impact_bucket} | markets ${event.linked_markets.join(', ')}`);
    if (event.starter_match) lines.push(`  - Starter match: ${event.starter_match.role}, confidence ${event.starter_match.starter_confidence}, sources ${event.starter_match.source_count}`);
    if (event.classification_warning) lines.push(`  - Classification warning: ${event.classification_warning}`);
    lines.push(`  - Evidence: ${event.evidence || event.summary}`);
  }

  lines.push('', '## Team Digest', '', '| Team | Events | Eligible | Conflicted | Needs Confirmation | Top Score | Worsening | Improving | Starter Matched | QB | OL Worsening | DL Worsening |', '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (const team of Object.values(digest.teams).sort((a, b) => b.top_score - a.top_score || a.team.localeCompare(b.team))) {
    lines.push(`| ${team.team} | ${team.event_count} | ${team.synthesis_eligible_count} | ${team.conflicted_intel_count} | ${team.needs_confirmation_count} | ${team.top_score} | ${team.worsening_count} | ${team.improving_count} | ${team.starter_matched_count} | ${team.qb_events} | ${team.offensive_line_worsening} | ${team.defensive_front_worsening} |`);
  }
  return `${lines.join('\n')}\n`;
}

export async function buildAvailabilityImpactDigest(options = {}) {
  const season = Number(options.season || DEFAULT_SEASON);
  const generatedAt = options.generatedAt || nowIso();
  const availabilityInput = options.availability || path.join('data', 'player-availability', 'latest.json');
  const projectedStartersInput = options.projectedStarters || path.join('data', 'projected-starters', String(season), 'latest.json');
  const namedStatusReviewInput = options.namedStatusReview || path.join('data', 'projected-starters', String(season), 'named-status-review.json');
  const availability = await readJson(availabilityInput);
  const projectedStarters = await readJson(projectedStartersInput, { players: [] });
  const namedStatusReview = await readJson(
    namedStatusReviewInput,
    { cases: [] },
  );
  const namedReviewValidation = validateNamedStatusReview(namedStatusReview);
  const namedReviews = indexNamedStatusReviews(namedStatusReview);
  const starters = starterIndex(projectedStarters);

  const digestEvents = [];
  for (const event of availability.events || []) {
    const key = `${event.team_abbr}|${String(event.player_name || '').toLowerCase()}`;
    const starterRow = starters.get(key) || null;
    const namedReview = namedReviews.get(String(event.player_name || '').toLowerCase()) || null;
    if (isGenericActiveNews(event, starterRow) && !namedReview) continue;
    const digest = digestEvent(event, starterRow, namedReview);
    if (!digest.synthesis_eligible || digest.score >= 28 || digest.starter_match || digest.availability_trend === 'worsening') {
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
      synthesis_eligible_count: digestEvents.filter((event) => event.synthesis_eligible).length,
      conflicted_intel_count: digestEvents.filter((event) => event.signal === 'conflicted_intel').length,
      needs_confirmation_count: digestEvents.filter((event) => event.signal === 'needs_confirmation').length,
      classification_review_count: digestEvents.filter((event) => event.signal === 'classification_review').length,
      starter_matched_count: digestEvents.filter((event) => event.synthesis_eligible && event.starter_match).length,
      projected_starters_schema: projectedStarters.meta?.schema || null,
      named_status_review_validation: namedReviewValidation,
      inputs: {
        availability: {
          path: availabilityInput,
          generated_at: availability.meta?.generated_at || null,
          evidence_validation_status: availability.meta?.availability_evidence_validation?.status || null,
        },
        projected_starters: {
          path: projectedStartersInput,
          generated_at: projectedStarters.meta?.generated_at || null,
          named_review_validation_status: projectedStarters.meta?.named_status_review_validation?.status || null,
        },
        named_status_review: {
          path: namedStatusReviewInput,
          reviewed_at: namedStatusReview.meta?.reviewed_at || null,
          validation_status: namedReviewValidation.status,
        },
      },
      recommendation_status: 'research_context_only_not_picks',
      guardrails: {
        live_model_calls: false,
        network_fetches: false,
        supabase_writes: false,
        official_picks_generated: false,
      },
    },
    top_events: digestEvents,
    conflicted_events: digestEvents.filter((event) => event.signal === 'conflicted_intel'),
    needs_confirmation_events: digestEvents.filter((event) => event.signal === 'needs_confirmation'),
    teams: Object.fromEntries(Object.entries(teams).map(([team, events]) => [team, teamSummary(team, events)])),
  };

  if (options.dryRun) return { digest, outputs: null };
  if (namedReviewValidation.status !== 'pass') {
    throw new Error('Refusing to write availability impact digest: named status review validation is blocked.');
  }

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
    namedStatusReview: args['named-status-review'] || null,
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

// Windows drive-letter-casing fix (see agents/fantasy-value-report.js for full note) —
// compare via pathToFileURL, not path.resolve() === fileURLToPath().
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
