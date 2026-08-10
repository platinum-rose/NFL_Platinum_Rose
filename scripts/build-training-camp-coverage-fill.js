#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { NFL_TEAMS } from '../src/lib/teams.js';
import { allTeams, nowIso, parseArgs } from './training-camp-intel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_SEASON = 2026;
const DATA_DIR = path.join(ROOT, 'data', 'training-camp', String(DEFAULT_SEASON));
const DOCS_DIR = path.join(ROOT, 'docs', 'training-camp');

const CAMP_NOTE_TYPES = new Set(['training_camp_intel', 'injury_or_health', 'depth_chart_or_role']);
const ANCHOR_TEAMS = new Set(['BUF', 'GB', 'CIN', 'KC', 'NO', 'NYG']);

async function readJson(relativePath, fallback = null) {
  try {
    return JSON.parse(await readFile(path.join(ROOT, relativePath), 'utf8'));
  } catch (err) {
    if (fallback !== null && err.code === 'ENOENT') return fallback;
    throw err;
  }
}

function sha(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

function compact(value, maxChars = 360) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, maxChars - 3).trim()}...`;
}

function sourceDate(source = {}) {
  return source.published_at || source.captured_at || null;
}

function candidateId(prefix, team, key) {
  return `${prefix}_${sha(`${team}|${key}`).slice(0, 16)}`;
}

function marketSet(...lists) {
  return [...new Set(lists.flat().filter(Boolean))];
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function aliasesForTeam(abbr) {
  const team = Object.values(NFL_TEAMS).find((row) => row.abbreviation === abbr);
  if (!team) return [abbr];
  return [
    team.fullName,
    team.name,
    team.city,
    ...(team.aliases || []),
    ...(team.altAbbreviations || []),
    team.abbreviation.length > 2 ? team.abbreviation : null,
  ].filter(Boolean);
}

function textMentionsTeam(team, text) {
  const aliases = aliasesForTeam(team);
  return aliases.some((alias) => new RegExp(`\\b${escapeRegExp(alias)}\\b`, 'i').test(text));
}

function campCandidatesForTeam(team, campTeam) {
  return (campTeam?.items || []).slice(0, 5).map((item) => ({
    id: item.id || candidateId('camp_existing', team, `${item.source_url}|${item.summary}`),
    team,
    coverage_source: 'existing_training_camp_snapshot',
    status: 'existing_camp_intel',
    confidence: Number(item.confidence ?? 0.62),
    signal_type: item.signal_type || 'other',
    player: item.player || null,
    summary: compact(item.summary || item.raw_excerpt),
    evidence: compact(item.raw_excerpt || item.summary, 480),
    source: item.source || 'Training camp snapshot',
    source_url: item.source_url || null,
    published_at: item.published_at || item.captured_at || null,
    linked_markets: item.linked_markets || ['wins'],
    needs_human_review: Boolean(item.needs_human_review),
  }));
}

function articleCandidates(review, existingCampTeams) {
  const byTeam = new Map();
  for (const note of review.analysis_notes || []) {
    if (!CAMP_NOTE_TYPES.has(note.note_type) && !(note.relevance_tags || []).includes('training_camp_intel')) continue;
    for (const team of note.teams || []) {
      if (existingCampTeams.has(team)) continue;
      const source = note.source || {};
      const teamEvidenceText = [
        note.topic,
        note.summary,
        note.quote,
        source.title,
        source.url,
      ].filter(Boolean).join(' ');
      if (!textMentionsTeam(team, teamEvidenceText)) continue;
      if (!byTeam.has(team)) byTeam.set(team, []);
      byTeam.get(team).push({
        id: candidateId('camp_article', team, `${note.item_id}|${note.quote || note.summary}`),
        team,
        coverage_source: 'local_article_review',
        status: 'coverage_fill_candidate',
        confidence: note.confidence === 'reported' ? 0.66 : 0.52,
        signal_type: note.note_type === 'injury_or_health' ? 'injury' : 'training_camp_context',
        player: (note.players || [])[0] || null,
        summary: compact(note.topic || note.summary),
        evidence: compact(note.quote || note.summary, 480),
        source: source.source || 'Article review',
        source_url: source.url || null,
        published_at: sourceDate(source),
        linked_markets: ['wins', 'make_playoffs'],
        needs_human_review: true,
      });
    }
  }
  return byTeam;
}

function availabilityCandidates(digest, teamsWithStrongerCoverage) {
  const byTeam = new Map();
  const seen = new Set();
  const events = [...(digest.top_events || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
  for (const event of events) {
    const team = event.team;
    if (!team || teamsWithStrongerCoverage.has(team)) continue;
    const key = `${team}|${event.player_name || ''}|${event.summary || event.evidence}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!byTeam.has(team)) byTeam.set(team, []);
    if (byTeam.get(team).length >= 3) continue;
    byTeam.get(team).push({
      id: candidateId('camp_availability', team, `${event.id}|${event.evidence || event.summary}`),
      team,
      coverage_source: 'starter_impact_availability_digest',
      status: 'availability_context_fill',
      confidence: event.starter_match ? 0.6 : 0.48,
      signal_type: event.signal === 'negative_availability' ? 'injury' : 'availability_context',
      player: event.player_name || null,
      summary: compact(event.summary),
      evidence: compact(event.evidence || event.summary, 480),
      source: event.source || 'Availability digest',
      source_url: event.source_url || null,
      published_at: event.published_at || null,
      linked_markets: event.linked_markets || ['wins'],
      needs_human_review: true,
    });
  }
  return byTeam;
}

function dedupeCandidates(candidates) {
  const seen = new Set();
  const out = [];
  for (const candidate of candidates) {
    const key = `${candidate.coverage_source}|${candidate.team}|${candidate.source_url || ''}|${candidate.evidence}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(candidate);
  }
  return out;
}

function teamStatus(candidates) {
  if (candidates.some((candidate) => candidate.status === 'existing_camp_intel')) return 'existing_camp_intel';
  if (candidates.some((candidate) => candidate.coverage_source === 'local_article_review')) return 'local_source_fill_ready_for_review';
  if (candidates.some((candidate) => candidate.coverage_source === 'starter_impact_availability_digest')) return 'availability_context_only_needs_camp_source';
  return 'still_missing_manual_camp_source';
}

function renderMarkdown(snapshot) {
  const lines = [
    `# Training Camp All-32 Coverage Fill - ${snapshot.meta.generated_at.slice(0, 10)}`,
    '',
    '> Local research coverage only. This does not promote picks, write Supabase, or mutate production recommendations.',
    '',
    `Canonical camp snapshot: ${snapshot.meta.canonical_teams_with_intel}/32 teams with camp intel, ${snapshot.meta.canonical_teams_without_intel}/32 still missing canonical camp notes.`,
    `Coverage-fill context: ${snapshot.meta.teams_with_any_local_context}/32 teams have at least one local camp/article/availability item.`,
    `Manual camp-source still needed: ${snapshot.meta.teams_needing_manual_camp_source}/32 teams.`,
    '',
    '## Coverage Summary',
    '',
    '| Team | Status | Items | Article Fill | Availability Fill | Anchor |',
    '|---|---|---:|---:|---:|---|',
  ];

  for (const team of snapshot.teams) {
    lines.push(`| ${team.team} | ${team.coverage_status} | ${team.candidate_count} | ${team.article_candidate_count} | ${team.availability_candidate_count} | ${team.anchor_team ? 'yes' : ''} |`);
  }

  lines.push('', '## Review Queue', '');
  for (const team of snapshot.teams.filter((row) => row.coverage_status !== 'existing_camp_intel')) {
    lines.push(`### ${team.team} - ${team.full_name}`);
    if (!team.candidates.length) {
      lines.push('', '- Still missing local camp/article/availability context. Manual source-stamped camp note required.', '');
      continue;
    }
    for (const item of team.candidates.slice(0, 4)) {
      lines.push(`- ${item.coverage_source}: ${item.signal_type}${item.player ? ` (${item.player})` : ''}`);
      lines.push(`  - Evidence: ${item.evidence || item.summary}`);
      lines.push(`  - Source: ${item.source}${item.published_at ? `, ${item.published_at}` : ''}${item.source_url ? ` (${item.source_url})` : ''}`);
    }
    lines.push('');
  }

  lines.push('## Guardrails', '');
  lines.push('- No live model/API calls were made by this builder.');
  lines.push('- No Supabase writes were made.');
  lines.push('- No official picks or production recommendations were created.');
  lines.push('- Availability-only rows are context placeholders until source-stamped camp coverage is added.');
  return `${lines.join('\n')}\n`;
}

export async function buildTrainingCampCoverageFill(options = {}) {
  const season = Number(options.season || DEFAULT_SEASON);
  const generatedAt = options.generatedAt || nowIso();
  const date = options.date || generatedAt.slice(0, 10);
  const camp = await readJson(options.camp || path.join('data', 'training-camp', String(season), 'latest.json'), { teams: {}, meta: {} });
  const review = await readJson(options.articleReview || path.join('data', 'research-intel', 'review', 'article-intel-review-latest.json'), { analysis_notes: [] });
  const digest = await readJson(options.availabilityDigest || path.join('data', 'player-availability', 'impact-digest-latest.json'), { top_events: [] });

  const existingCampTeams = new Set(Object.values(camp.teams || {}).filter((team) => (team.items || []).length).map((team) => team.team));
  const articleByTeam = articleCandidates(review, existingCampTeams);
  const strongerCoverage = new Set([...existingCampTeams, ...articleByTeam.keys()]);
  const availabilityByTeam = availabilityCandidates(digest, strongerCoverage);

  const teams = allTeams().map((teamInfo) => {
    const existing = campCandidatesForTeam(teamInfo.team, camp.teams?.[teamInfo.team]);
    const articles = (articleByTeam.get(teamInfo.team) || []).slice(0, 3);
    const availability = (availabilityByTeam.get(teamInfo.team) || []).slice(0, 3);
    const candidates = dedupeCandidates([...existing, ...articles, ...availability]);
    const sourceCounts = candidates.reduce((counts, candidate) => {
      counts[candidate.coverage_source] = (counts[candidate.coverage_source] || 0) + 1;
      return counts;
    }, {});
    const status = teamStatus(candidates);
    return {
      team: teamInfo.team,
      full_name: teamInfo.full_name,
      division: teamInfo.division,
      conference: teamInfo.conference,
      anchor_team: ANCHOR_TEAMS.has(teamInfo.team),
      coverage_status: status,
      candidate_count: candidates.length,
      existing_camp_item_count: existing.length,
      article_candidate_count: sourceCounts.local_article_review || 0,
      availability_candidate_count: sourceCounts.starter_impact_availability_digest || 0,
      linked_markets: marketSet(...candidates.map((candidate) => candidate.linked_markets)),
      candidates,
    };
  });

  const teamsWithAnyLocalContext = teams.filter((team) => team.candidate_count > 0).length;
  const teamsNeedingManualCampSource = teams.filter((team) => team.coverage_status !== 'existing_camp_intel').length;
  const snapshot = {
    meta: {
      schema: 'training_camp_coverage_fill_v1',
      season,
      generated_at: generatedAt,
      recommendation_status: 'research_context_only_not_picks',
      canonical_snapshot_generated_at: camp.meta?.generated_at || null,
      canonical_teams_with_intel: camp.meta?.teams_with_intel || existingCampTeams.size,
      canonical_teams_without_intel: camp.meta?.teams_without_intel ?? teamsNeedingManualCampSource,
      teams_with_any_local_context: teamsWithAnyLocalContext,
      teams_needing_manual_camp_source: teamsNeedingManualCampSource,
      local_article_review_notes: (review.analysis_notes || []).length,
      availability_digest_events: (digest.top_events || []).length,
      guardrails: {
        live_model_calls: false,
        network_fetches: false,
        supabase_writes: false,
        official_picks_generated: false,
        production_recommendation_persistence: false,
      },
    },
    teams,
  };

  if (options.dryRun) return { snapshot, outputs: null };

  const dataDir = path.resolve(ROOT, options.outDir || path.join('data', 'training-camp', String(season)));
  const docsDir = path.resolve(ROOT, options.docsDir || DOCS_DIR);
  await mkdir(dataDir, { recursive: true });
  await mkdir(docsDir, { recursive: true });
  const jsonPath = path.join(dataDir, `coverage-fill-${date}.json`);
  const latestJsonPath = path.join(dataDir, 'coverage-fill-latest.json');
  const mdPath = path.join(docsDir, `training-camp-coverage-fill-${date}.md`);
  const latestMdPath = path.join(docsDir, 'training-camp-coverage-fill-latest.md');
  const markdown = renderMarkdown(snapshot);
  await writeFile(jsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  await writeFile(latestJsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  await writeFile(mdPath, markdown, 'utf8');
  await writeFile(latestMdPath, markdown, 'utf8');
  return { snapshot, outputs: { jsonPath, latestJsonPath, mdPath, latestMdPath } };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { snapshot, outputs } = await buildTrainingCampCoverageFill({
    season: args.season,
    date: args.date,
    dryRun: args['dry-run'] === true,
  });
  console.log(`Training camp coverage fill complete: ${snapshot.meta.teams_with_any_local_context}/32 teams have local context.`);
  console.log(`Manual camp-source still needed: ${snapshot.meta.teams_needing_manual_camp_source}/32 teams.`);
  console.log('No Supabase writes, official picks, or production recommendation persistence were attempted.');
  if (outputs) {
    console.log(`JSON: ${outputs.latestJsonPath}`);
    console.log(`Markdown: ${outputs.latestMdPath}`);
  }
}

// Windows drive-letter-casing fix (see agents/fantasy-value-report.js for full note) —
// compare via pathToFileURL, not path.resolve() === fileURLToPath().
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.stack || err.message);
    process.exit(1);
  });
}
