#!/usr/bin/env node

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  assertYoutubeCohortClean,
  buildYoutubeCohort,
} from './lib/youtube-futures-cohort.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DEFAULT_WINDOW_START = '2026-07-24';
const DEFAULT_WINDOW_END = '2026-07-30';
const ANCHOR_TEAMS = ['BUF', 'GB', 'CIN', 'KC', 'NO', 'NYG'];
const REVIEW_STATUSES = new Set(['pending_review', 'needs_review']);
const ACCEPTED_STATUS = 'promote_to_local_intel';

function argValue(name, fallback) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && idx + 1 < process.argv.length ? process.argv[idx + 1] : fallback;
}

async function readJson(relativePath, fallback = null) {
  try {
    return JSON.parse(await readFile(path.join(ROOT, relativePath), 'utf8'));
  } catch (err) {
    if (fallback !== null && err.code === 'ENOENT') return fallback;
    throw err;
  }
}

function compact(value, maxChars = 320) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, maxChars - 3).trim()}...`;
}

function mdCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();
}

function dateKey(value) {
  if (!value) return null;
  const direct = String(value).match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if (direct) return direct;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return null;
  return new Date(time).toISOString().slice(0, 10);
}

function inWindow(value, start, end) {
  const key = dateKey(value);
  return key !== null && key >= start && key <= end;
}

function countBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item) || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function itemTeams(item) {
  if (Array.isArray(item.teams)) return item.teams.filter(Boolean);
  if (item.team) return [item.team];
  return [];
}

function statusIndex(status) {
  return new Map((status.items || []).map((item) => [item.item_id, item]));
}

function joinReviewItems(report, status) {
  const statuses = statusIndex(status);
  const picks = (report.picks || []).map((item) => ({
    ...item,
    item_type: 'pick',
    status: statuses.get(item.item_id)?.status || item.status || 'missing_from_status',
    reviewer_notes: statuses.get(item.item_id)?.reviewer_notes || '',
  }));
  const notes = (report.notes || []).map((item) => ({
    ...item,
    item_type: 'note',
    status: statuses.get(item.item_id)?.status || item.status || 'missing_from_status',
    reviewer_notes: statuses.get(item.item_id)?.reviewer_notes || '',
  }));
  return [...picks, ...notes];
}

function observedCandidateIds(observationFiles) {
  return new Set(
    observationFiles
      .map((name) => name.match(/^(youtube-[^-]+(?:[-_][A-Za-z0-9]+)*)-shadow-youtube\.json$/)?.[1])
      .filter(Boolean),
  );
}

async function listObservationFiles(relativeDir) {
  try {
    const dir = path.join(ROOT, relativeDir);
    return (await readdir(dir)).filter((name) => name.endsWith('-shadow-youtube.json'));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function candidateDate(candidate) {
  return dateKey(candidate.published_at || candidate.date);
}

function candidateRow(candidate, observed) {
  return {
    id: candidate.id,
    show: candidate.show,
    title: candidate.title,
    date: candidateDate(candidate),
    published_at: candidate.published_at || null,
    url: candidate.url || candidate.source_url || null,
    content_lane: candidate.content_lane || 'unknown',
    futures_score: Number(candidate.futures_score || 0),
    gemini_futures_eligible: Boolean(candidate.gemini_futures_eligible),
    mapping_status: candidate.mapping_status || 'unknown',
    observed,
    status: observed
      ? 'observed_existing_local_gemini_run'
      : candidate.gemini_futures_eligible
        ? 'unobserved_futures_candidate'
        : 'candidate_not_futures_eligible',
    notes: candidate.notes || '',
  };
}

function anchorRows(anchors, summary, joinedReviewItems) {
  const acceptedPicks = summary.items || [];
  const acceptedNotes = summary.notes || [];
  return anchors.map((team) => {
    const acceptedTeamPicks = acceptedPicks.filter((item) => item.team === team);
    const acceptedTeamNotes = acceptedNotes.filter((note) => (note.teams || []).includes(team));
    const reviewOnly = joinedReviewItems.filter((item) => (
      REVIEW_STATUSES.has(item.status)
      && itemTeams(item).includes(team)
    ));
    const acceptedStatusRows = joinedReviewItems.filter((item) => (
      item.status === ACCEPTED_STATUS
      && itemTeams(item).includes(team)
    ));
    return {
      team,
      accepted_pick_count: acceptedTeamPicks.length,
      accepted_note_count: acceptedTeamNotes.length,
      accepted_status_rows: acceptedStatusRows.length,
      pending_or_needs_review_count: reviewOnly.length,
      accepted_markets: [...new Set(acceptedTeamPicks.map((item) => item.market).filter(Boolean))].sort(),
      review_only_items: reviewOnly.slice(0, 8).map((item) => ({
        item_id: item.item_id,
        item_type: item.item_type,
        status: item.status,
        lane: item.item_lane || item.note_type || 'context',
        market: item.market || null,
        topic: item.topic || item.episode_title || '',
        evidence: compact(item.supporting_quote || item.quote || item.summary || item.rationale),
        source: {
          episode_id: item.episode_id,
          episode_title: item.episode_title,
          show: item.show,
          source_timestamp: item.source_timestamp || null,
          timestamp_url: item.timestamp_url || null,
        },
      })),
    };
  });
}

function renderMarkdown(snapshot) {
  const lines = [
    `# Podcast/YouTube Freshness Reconciliation - ${snapshot.meta.generated_at.slice(0, 10)}`,
    '',
    '> Local research freshness and review-status reconciliation only. This does not promote picks, write Supabase, call a model, or mutate production recommendations.',
    '',
    `Window: ${snapshot.meta.window_start} through ${snapshot.meta.window_end}`,
    `Accepted YouTube local-intel picks: ${snapshot.youtube.accepted.exported_items}`,
    `Accepted YouTube local-intel notes: ${snapshot.youtube.accepted.exported_notes}`,
    `Accepted cohort fingerprint: ${snapshot.youtube.accepted.cohort.fingerprint_sha256}`,
    `Review-status rows: ${snapshot.youtube.review_status.total_items}`,
    `Podcast deep dives in window: ${snapshot.podcast.window_episode_count}`,
    `YouTube candidates in window: ${snapshot.youtube.candidates.window_candidate_count}`,
    `Futures-eligible YouTube candidates in window: ${snapshot.youtube.candidates.window_futures_eligible_count}`,
    '',
    '## Review Separation',
    '',
    '| Status | Count |',
    '|---|---:|',
    ...Object.entries(snapshot.youtube.review_status.by_status).sort(([a], [b]) => a.localeCompare(b)).map(([status, count]) => `| ${status} | ${count} |`),
    '',
    '## Anchor Coverage',
    '',
    '| Team | Accepted Picks | Accepted Notes | Pending/Needs Review | Accepted Markets |',
    '|---|---:|---:|---:|---|',
    ...snapshot.anchors.map((row) => `| ${row.team} | ${row.accepted_pick_count} | ${row.accepted_note_count} | ${row.pending_or_needs_review_count} | ${row.accepted_markets.join(', ') || 'none'} |`),
    '',
    '## July 24-30 YouTube Candidates',
    '',
  ];

  if (snapshot.youtube.candidates.window_candidates.length) {
    lines.push('| Date | Status | Score | Lane | Title |');
    lines.push('|---|---|---:|---|---|');
    for (const candidate of snapshot.youtube.candidates.window_candidates) {
      lines.push(`| ${candidate.date || ''} | ${candidate.status} | ${candidate.futures_score} | ${candidate.content_lane} | ${mdCell(candidate.title)} |`);
    }
  } else {
    lines.push('_No local YouTube candidates are dated inside this window._');
  }

  lines.push('', '## July 24-30 Podcast Deep Dives', '');
  if (snapshot.podcast.window_episodes.length) {
    lines.push('| Published | Show | Episode | Beats |');
    lines.push('|---|---|---|---:|');
    for (const episode of snapshot.podcast.window_episodes) {
      lines.push(`| ${episode.pub_date || ''} | ${mdCell(episode.show)} | ${mdCell(episode.title)} | ${episode.beat_count || 0} |`);
    }
  } else {
    lines.push('_No generated podcast deep dives are dated inside this window. Latest generated deep-dive episode is listed below._');
    if (snapshot.podcast.latest_episode) {
      lines.push('', `Latest: ${snapshot.podcast.latest_episode.pub_date} - ${snapshot.podcast.latest_episode.show} - ${mdCell(snapshot.podcast.latest_episode.title)}`);
    }
  }

  lines.push('', '## Anchor Review Queue', '');
  for (const anchor of snapshot.anchors.filter((row) => row.pending_or_needs_review_count > 0)) {
    lines.push(`### ${anchor.team}`, '');
    for (const item of anchor.review_only_items) {
      lines.push(`- ${item.status} ${item.item_type}: ${item.lane}${item.market ? ` / ${item.market}` : ''}`);
      lines.push(`  - Source: ${item.source.episode_title || item.source.episode_id || 'unknown'}`);
      if (item.evidence) lines.push(`  - Evidence: ${item.evidence}`);
    }
    lines.push('');
  }

  lines.push('## Guardrails', '');
  lines.push('- Accepted rows come only from `promote_to_local_intel` status.');
  lines.push('- Pending, needs-review, context-only, and rejected rows remain excluded from the agent summary.');
  lines.push('- No live model/API calls were made.');
  lines.push('- No Supabase writes were made.');
  lines.push('- No official picks or production recommendations were created.');
  return `${lines.join('\n')}\n`;
}

export async function buildPodcastYoutubeFreshnessReconciliation(options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const windowStart = options.windowStart || DEFAULT_WINDOW_START;
  const windowEnd = options.windowEnd || DEFAULT_WINDOW_END;
  const summary = await readJson(options.agentSummary || 'data/shadow-harness/review/youtube-futures-agent-intel-summary.json', { items: [], notes: [], counts: {} });
  const status = await readJson(options.reviewStatus || 'data/shadow-harness/review/youtube-futures-intel-review-status.json', { items: [] });
  const report = await readJson(options.reviewReport || 'data/shadow-harness/reports/youtube-futures-intel-review-latest.json', { picks: [], notes: [], episodes: [] });
  const candidates = await readJson(options.youtubeCandidates || 'data/podcasts/youtube-discovery-candidates-2026.json', { episodes: [] });
  const deepDive = await readJson(options.podcastDeepDiveIndex || 'docs/podcast-transcript-deep-dives/index.json', { episodes: [] });
  const observationDir = options.observationDir || 'data/shadow-harness/observations';
  const observationFiles = options.observationFiles || await listObservationFiles(observationDir);
  const observedIds = observedCandidateIds(observationFiles);

  const joined = joinReviewItems(report, status);
  const candidateRows = (candidates.episodes || []).map((candidate) => candidateRow(candidate, observedIds.has(candidate.id)));
  const windowCandidates = candidateRows.filter((candidate) => inWindow(candidate.date || candidate.published_at, windowStart, windowEnd));
  const windowEpisodes = (deepDive.episodes || []).filter((episode) => inWindow(episode.pub_date, windowStart, windowEnd));
  const sortedDeepDiveEpisodes = [...(deepDive.episodes || [])].sort((a, b) => String(b.pub_date || '').localeCompare(String(a.pub_date || '')));
  const reviewStatusItems = status.items || [];
  const acceptedItems = summary.items || [];
  const acceptedNotes = summary.notes || [];
  assertYoutubeCohortClean(acceptedItems, acceptedNotes, 'Podcast/YouTube freshness accepted cohort');
  const acceptedCohort = buildYoutubeCohort({ items: acceptedItems, notes: acceptedNotes });
  if (summary.cohort?.fingerprint_sha256 && summary.cohort.fingerprint_sha256 !== acceptedCohort.fingerprint_sha256) {
    throw new Error(`YouTube cohort fingerprint mismatch: summary=${summary.cohort.fingerprint_sha256} freshness=${acceptedCohort.fingerprint_sha256}`);
  }
  const rejectedLeakChecks = summary.rejected_leak_checks || {};

  const snapshot = {
    meta: {
      schema: 'podcast_youtube_freshness_reconciliation_v1',
      generated_at: generatedAt,
      window_start: windowStart,
      window_end: windowEnd,
      recommendation_status: 'research_context_only_not_picks',
      inputs: {
        agent_summary: options.summaryPath || 'data/shadow-harness/review/youtube-futures-agent-intel-summary.json',
        status_ledger: options.statusPath || 'data/shadow-harness/review/youtube-futures-intel-review-status.json',
        review_report: options.reviewReport || 'data/shadow-harness/reports/youtube-futures-intel-review-latest.json',
        candidates: options.candidatesPath || 'data/podcasts/youtube-discovery-candidates-2026.json',
        deep_dive_index: options.deepDivePath || 'docs/podcast-transcript-deep-dives/index.json',
      },
      validation_results: {
        cohort_status: acceptedCohort.forbidden_episode_evidence_absent === true ? 'pass' : 'blocked',
        cohort_fingerprint_sha256: acceptedCohort.fingerprint_sha256,
        cohort_item_count: acceptedCohort.item_count,
      },
      guardrails: {
        live_model_calls: false,
        network_fetches: false,
        supabase_writes: false,
        official_picks_generated: false,
        production_recommendation_persistence: false,
      },
    },
    youtube: {
      accepted: {
        generated_at: summary.generated_at || null,
        cohort: acceptedCohort,
        exported_items: acceptedItems.length,
        exported_notes: acceptedNotes.length,
        by_team: summary.counts?.by_team || countBy(acceptedItems, (item) => item.team),
        by_market: summary.counts?.by_market || countBy(acceptedItems, (item) => item.market),
        rejected_leak_checks: rejectedLeakChecks,
      },
      review_status: {
        generated_at: status.generated_at || null,
        total_items: reviewStatusItems.length,
        by_status: countBy(reviewStatusItems, (item) => item.status),
        by_item_type_status: countBy(reviewStatusItems, (item) => `${item.item_type || 'pick'}:${item.status}`),
        review_only_count: reviewStatusItems.filter((item) => REVIEW_STATUSES.has(item.status)).length,
      },
      review_report: {
        generated_at: report.generated_at || null,
        observed_episodes: report.observed_episodes || 0,
        missing_observations: report.missing_observations || 0,
        total_extracted_picks: report.total_extracted_picks || 0,
        total_analysis_notes: report.total_analysis_notes || 0,
      },
      candidates: {
        generated_at: candidates.generated_at || null,
        total_candidates: candidateRows.length,
        total_futures_eligible: candidateRows.filter((candidate) => candidate.gemini_futures_eligible).length,
        observed_candidate_count: candidateRows.filter((candidate) => candidate.observed).length,
        window_candidate_count: windowCandidates.length,
        window_futures_eligible_count: windowCandidates.filter((candidate) => candidate.gemini_futures_eligible).length,
        window_observed_count: windowCandidates.filter((candidate) => candidate.observed).length,
        window_candidates: windowCandidates,
        unobserved_futures_candidates: candidateRows.filter((candidate) => candidate.gemini_futures_eligible && !candidate.observed),
      },
    },
    podcast: {
      generated_at: deepDive.generated_at || null,
      source_dir: deepDive.source_dir || null,
      total_deep_dives: deepDive.count || (deepDive.episodes || []).length,
      latest_episode: sortedDeepDiveEpisodes[0] || null,
      window_episode_count: windowEpisodes.length,
      window_episodes: windowEpisodes,
    },
    anchors: anchorRows(ANCHOR_TEAMS, summary, joined),
  };

  if (options.dryRun) return { snapshot, outputs: null };

  const dataDir = path.resolve(ROOT, options.outDir || 'data/shadow-harness/review');
  const docsDir = path.resolve(ROOT, options.docsDir || 'docs/antigravity');
  await mkdir(dataDir, { recursive: true });
  await mkdir(docsDir, { recursive: true });
  const date = generatedAt.slice(0, 10);
  const jsonPath = path.join(dataDir, `podcast-youtube-freshness-${date}.json`);
  const latestJsonPath = path.join(dataDir, 'podcast-youtube-freshness-latest.json');
  const mdPath = path.join(docsDir, `podcast-youtube-freshness-${date}.md`);
  const latestMdPath = path.join(docsDir, 'podcast-youtube-freshness-latest.md');
  const markdown = renderMarkdown(snapshot);
  await writeFile(jsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  await writeFile(latestJsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  await writeFile(mdPath, markdown, 'utf8');
  await writeFile(latestMdPath, markdown, 'utf8');
  return { snapshot, outputs: { jsonPath, latestJsonPath, mdPath, latestMdPath } };
}

async function main() {
  const { snapshot, outputs } = await buildPodcastYoutubeFreshnessReconciliation({
    generatedAt: argValue('--generated-at', new Date().toISOString()),
    windowStart: argValue('--window-start', DEFAULT_WINDOW_START),
    windowEnd: argValue('--window-end', DEFAULT_WINDOW_END),
    dryRun: process.argv.includes('--dry-run'),
  });
  console.log(`Podcast/YouTube freshness reconciliation complete: accepted=${snapshot.youtube.accepted.exported_items}, review-only=${snapshot.youtube.review_status.review_only_count}.`);
  console.log(`Window candidates=${snapshot.youtube.candidates.window_candidate_count}, futures-eligible=${snapshot.youtube.candidates.window_futures_eligible_count}, podcast deep dives=${snapshot.podcast.window_episode_count}.`);
  console.log('No live model/API calls, Supabase writes, official picks, or production recommendation persistence were attempted.');
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
