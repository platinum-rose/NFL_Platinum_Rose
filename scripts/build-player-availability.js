#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import 'dotenv/config'; // F-26c §4: needed for FANTASYPROS_API_KEY — this script
// never needed env vars before (ESPN's injuries API takes no key), so dotenv
// was never loaded here. Found live 2026-08-10: FantasyPros injuries fetches
// failed with "Missing FANTASYPROS_API_KEY" even with a real key sitting in
// .env, because nothing had loaded it into process.env yet.
import {
  buildAvailabilitySnapshot,
  parseInjuryType,
} from '../agents/lib/player-availability.js';
import { parseArgs, todayPacificDate, nowIso } from './training-camp-intel.js';
import { fantasyProsGet } from '../agents/lib/fantasypros-client.js';
import { flattenFantasyProsInjuries } from '../agents/lib/fantasypros-injuries.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_SEASON = 2026;
const OUT_DIR = path.join(ROOT, 'data', 'player-availability');
const DOCS_DIR = path.join(ROOT, 'docs', 'player-availability');
const ESPN_INJURIES_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries';

async function readJson(relativePath, fallback = null) {
  try {
    return JSON.parse(await readFile(path.join(ROOT, relativePath), 'utf8'));
  } catch (err) {
    if (fallback !== null && err.code === 'ENOENT') return fallback;
    throw err;
  }
}

function extractPlayerId(athlete) {
  const link = (athlete?.links ?? []).find((candidate) =>
    Array.isArray(candidate.rel)
      ? candidate.rel.includes('playercard')
      : String(candidate.rel || '').includes('playercard')
  );
  if (!link?.href) return null;
  const match = link.href.match(/\/id\/(\d+)\//);
  return match ? match[1] : null;
}

export function flattenEspnInjuryGroups(teamGroups = [], { capturedAt = nowIso() } = {}) {
  const records = [];
  for (const group of teamGroups || []) {
    for (const injury of group.injuries || []) {
      const status = injury.status || 'Unknown';
      const shortComment = injury.shortComment || null;
      if (status === 'Active' && !shortComment) continue;
      records.push({
        espn_injury_id: injury.id,
        espn_player_id: extractPlayerId(injury.athlete),
        player_name: injury.athlete?.displayName || 'Unknown',
        team_abbr: injury.athlete?.team?.abbreviation || '',
        position: injury.athlete?.position?.abbreviation || null,
        injury_status: status,
        injury_type: parseInjuryType(shortComment),
        short_comment: shortComment,
        long_comment: injury.longComment || null,
        reported_at: injury.date ? new Date(injury.date).toISOString() : null,
        captured_at: capturedAt,
        source: 'ESPN injuries API',
        source_type: 'structured_injury',
        source_url: ESPN_INJURIES_URL,
      });
    }
  }
  return records;
}

export function shouldFetchFantasyProsInjuries(options = {}) {
  if (options.liveFantasyProsInjuries === false) return false;
  if (options.noLiveFantasyProsInjuries === true) return false;
  return true;
}

async function fetchEspnInjuries() {
  const response = await fetch(ESPN_INJURIES_URL, {
    headers: { 'User-Agent': 'NFL-Platinum-Rose-PlayerAvailability/1.0' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`ESPN injuries API returned ${response.status}`);
  const payload = await response.json();
  return payload.injuries || [];
}

// F-26c §4 — real upgrade over ESPN's free-text-only feed: FantasyPros carries
// a literal numeric probability_of_playing plus Wed/Thu/Fri practice-report
// participation, neither of which ESPN's injuries endpoint exposes at all. See
// agents/lib/fantasypros-injuries.js's header for the important caveat that its
// field-name mapping is unconfirmed (built without a working live call from
// this sandbox — see TASK_BOARD F-31) and needs a native-machine dry-run before
// this is trusted the way the ESPN path already is.
async function fetchFantasyProsInjuries({ year, week } = {}) {
  const data = await fantasyProsGet('/nfl/injuries', {
    params: { year, week, include_probabilities: true },
  });
  if (data?.message) throw new Error(`FantasyPros injuries error: ${data.message}`);
  return data;
}

function trainingCampItems(snapshot) {
  if (!snapshot?.items?.length) return [];
  return snapshot.items.filter((item) => item.signal_type === 'injury' || /injur|practice|pup|limited|return|setback|snap count/i.test([
    item.summary,
    item.raw_excerpt,
    item.betting_relevance,
  ].filter(Boolean).join(' ')));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderAvailabilityMarkdown(snapshot) {
  const lines = [
    `# Player Availability Snapshot - ${snapshot.meta.generated_at.slice(0, 10)}`,
    '',
    '> Local availability intel only. This report is not a betting recommendation sheet and does not authorize official Platinum Rose AI picks.',
    '',
    `Season: ${snapshot.meta.season}`,
    `Generated: ${snapshot.meta.generated_at}`,
    `Events: ${snapshot.meta.event_count} | Synthesis eligible: ${snapshot.meta.synthesis_eligible_count ?? snapshot.meta.event_count} | Conflicted intel: ${snapshot.meta.conflicted_intel_count || 0} | Teams: ${snapshot.meta.teams_with_events} | Improving: ${snapshot.meta.improving_count} | Worsening: ${snapshot.meta.worsening_count} | Major: ${snapshot.meta.major_count}`,
    `OL worsening: ${snapshot.meta.offensive_line_worsening_count || 0} | Defensive-front worsening: ${snapshot.meta.defensive_front_worsening_count || 0} | OL cluster teams: ${snapshot.meta.teams_with_ol_cluster_risk || 0} | Defensive-front cluster teams: ${snapshot.meta.teams_with_defensive_front_cluster_risk || 0}`,
    '',
    '## Source Health',
    '',
    '| Source | Status | Evidence |',
    '|---|---|---|',
  ];

  for (const source of snapshot.meta.source_health || []) {
    lines.push(`| ${source.source} | ${source.status} | ${source.evidence || source.reason || ''} |`);
  }

  lines.push('', '## Team Events', '');
  for (const team of Object.values(snapshot.teams).sort((a, b) => b.major_count - a.major_count || b.event_count - a.event_count || a.team_abbr.localeCompare(b.team_abbr))) {
    lines.push(`### ${team.team_abbr}`, '');
    lines.push(`Events: ${team.event_count} | Synthesis eligible: ${team.synthesis_eligible_count ?? team.event_count} | Conflicted intel: ${team.conflicted_intel_count || 0} | Improving: ${team.improving_count} | Worsening: ${team.worsening_count} | Major: ${team.major_count}`, '');
    lines.push(`OL: ${team.offensive_line_count || 0} total / ${team.offensive_line_worsening_count || 0} worsening${team.cluster_risks?.offensive_line?.cluster_risk ? ' / cluster risk' : ''} | Defensive front: ${team.defensive_front_count || 0} total / ${team.defensive_front_worsening_count || 0} worsening${team.cluster_risks?.defensive_front?.cluster_risk ? ' / cluster risk' : ''}${team.cluster_risks?.defensive_front?.opponent_offense_boost_risk ? ' / opponent offense boost risk' : ''}`, '');
    for (const event of team.events) {
      const player = event.player_name ? `${event.player_name}${event.position ? ` (${event.position})` : ''}` : 'Team item';
      lines.push(`- **${event.availability_trend}/${event.event_type}** ${player}: ${event.short_summary}`);
      lines.push(`  - Source: ${event.source}${event.published_at ? ` | ${event.published_at}` : ''}`);
      lines.push(`  - Markets: ${event.linked_markets.join(', ')} | Impact: ${event.impact_bucket} | Group: ${event.availability_group || 'other'}${event.needs_human_review ? ' | human review' : ''}`);
      if (event.status_conflict) lines.push(`  - Conflicted intel: ${event.status_conflict.code}; excluded from synthesis aggregates`);
      if (event.supporting_quote) lines.push(`  - Evidence: ${event.supporting_quote}`);
    }
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

export function renderAvailabilityHtml(snapshot) {
  const rows = Object.values(snapshot.teams)
    .sort((a, b) => b.major_count - a.major_count || b.event_count - a.event_count || a.team_abbr.localeCompare(b.team_abbr))
    .map((team) => `<section class="team">
      <h2>${escapeHtml(team.team_abbr)} <span>${team.event_count} events</span></h2>
      <p class="muted">Eligible ${team.synthesis_eligible_count ?? team.event_count} | Conflicted ${team.conflicted_intel_count || 0} | Improving ${team.improving_count} | Worsening ${team.worsening_count} | Major ${team.major_count}</p>
      <p class="muted">OL ${team.offensive_line_count || 0}/${team.offensive_line_worsening_count || 0} worsening${team.cluster_risks?.offensive_line?.cluster_risk ? ' | OL cluster risk' : ''} | Defensive front ${team.defensive_front_count || 0}/${team.defensive_front_worsening_count || 0} worsening${team.cluster_risks?.defensive_front?.cluster_risk ? ' | defensive-front cluster risk' : ''}${team.cluster_risks?.defensive_front?.opponent_offense_boost_risk ? ' | opponent offense boost risk' : ''}</p>
      <ul>
        ${team.events.map((event) => `<li>
          <strong>${escapeHtml(event.availability_trend)} / ${escapeHtml(event.event_type)}</strong>
          ${escapeHtml(event.player_name || 'Team item')}${event.position ? ` <span class="muted">${escapeHtml(event.position)}</span>` : ''}
          <p>${escapeHtml(event.short_summary)}</p>
          <p class="muted">${escapeHtml(event.source)}${event.published_at ? ` | ${escapeHtml(event.published_at)}` : ''}</p>
          <p class="muted">Markets: ${escapeHtml(event.linked_markets.join(', '))} | Impact: ${escapeHtml(event.impact_bucket)} | Group: ${escapeHtml(event.availability_group || 'other')}${event.needs_human_review ? ' | human review' : ''}</p>
${event.status_conflict ? `          <p class="muted">Conflicted intel: ${escapeHtml(event.status_conflict.code)} | excluded from synthesis aggregates</p>\n` : ''}        </li>`).join('\n')}
      </ul>
    </section>`)
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Player Availability Snapshot</title>
  <style>
    body { margin:0; font:14px/1.45 system-ui,-apple-system,Segoe UI,sans-serif; color:#172033; background:#f4f6f8; }
    header, main { max-width:1120px; margin:0 auto; padding:24px; }
    header { background:#fff; border-bottom:1px solid #d9e0ea; max-width:none; }
    h1 { margin:0 0 6px; font-size:28px; letter-spacing:0; }
    h2 { margin:0; display:flex; justify-content:space-between; gap:12px; }
    h2 span, .muted { color:#667085; font-size:12px; font-weight:500; }
    .notice { margin-top:12px; padding:10px 12px; border-left:4px solid #0f766e; background:#ecfdf5; }
    .metrics { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; margin-top:18px; }
    .metric, .team { background:#fff; border:1px solid #d9e0ea; border-radius:8px; padding:14px; }
    .metric strong { display:block; font-size:24px; }
    .team { margin:12px 0; }
    li { margin:12px 0; }
    p { margin:4px 0; }
  </style>
</head>
<body>
  <header>
    <h1>Player Availability Snapshot</h1>
    <div class="muted">Generated ${escapeHtml(snapshot.meta.generated_at)} | Season ${escapeHtml(snapshot.meta.season)}</div>
    <div class="notice">Local availability intel only. Review/highlight before using in futures synthesis.</div>
    <section class="metrics">
      <div class="metric"><span>Events</span><strong>${snapshot.meta.event_count}</strong></div>
      <div class="metric"><span>Synthesis Eligible</span><strong>${snapshot.meta.synthesis_eligible_count ?? snapshot.meta.event_count}</strong></div>
      <div class="metric"><span>Conflicted Intel</span><strong>${snapshot.meta.conflicted_intel_count || 0}</strong></div>
      <div class="metric"><span>Teams</span><strong>${snapshot.meta.teams_with_events}</strong></div>
      <div class="metric"><span>Improving</span><strong>${snapshot.meta.improving_count}</strong></div>
      <div class="metric"><span>Worsening</span><strong>${snapshot.meta.worsening_count}</strong></div>
      <div class="metric"><span>Major</span><strong>${snapshot.meta.major_count}</strong></div>
      <div class="metric"><span>OL Worsening</span><strong>${snapshot.meta.offensive_line_worsening_count || 0}</strong></div>
      <div class="metric"><span>DL Worsening</span><strong>${snapshot.meta.defensive_front_worsening_count || 0}</strong></div>
      <div class="metric"><span>OL Cluster Teams</span><strong>${snapshot.meta.teams_with_ol_cluster_risk || 0}</strong></div>
      <div class="metric"><span>DL Cluster Teams</span><strong>${snapshot.meta.teams_with_defensive_front_cluster_risk || 0}</strong></div>
    </section>
  </header>
  <main>${rows || '<p>No availability events found.</p>'}</main>
</body>
</html>`;
}

export async function writeAvailabilitySnapshotAndReports(snapshot, { date, outDir = OUT_DIR, docsDir = DOCS_DIR } = {}) {
  const artifactDate = date || snapshot.meta.generated_at.slice(0, 10) || todayPacificDate();
  await mkdir(outDir, { recursive: true });
  await mkdir(docsDir, { recursive: true });
  const jsonPath = path.join(outDir, `player-availability-${artifactDate}.json`);
  const latestPath = path.join(outDir, 'latest.json');
  const mdPath = path.join(docsDir, `player-availability-${artifactDate}.md`);
  const htmlPath = path.join(docsDir, `player-availability-${artifactDate}.html`);
  const latestMdPath = path.join(docsDir, 'player-availability-latest.md');
  const latestHtmlPath = path.join(docsDir, 'player-availability-latest.html');

  await writeFile(jsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  await writeFile(latestPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  const markdown = renderAvailabilityMarkdown(snapshot);
  const html = renderAvailabilityHtml(snapshot);
  await writeFile(mdPath, markdown, 'utf8');
  await writeFile(latestMdPath, markdown, 'utf8');
  await writeFile(htmlPath, html, 'utf8');
  await writeFile(latestHtmlPath, html, 'utf8');
  return { jsonPath, latestPath, mdPath, latestMdPath, htmlPath, latestHtmlPath };
}

export async function buildPlayerAvailability(options = {}) {
  const season = Number(options.season || DEFAULT_SEASON);
  const generatedAt = options.generatedAt || nowIso();
  const date = options.date || generatedAt.slice(0, 10) || todayPacificDate();
  const sourceHealth = [];
  let injuryRecords = [];

  if (options.liveInjuries) {
    try {
      const groups = await fetchEspnInjuries();
      injuryRecords = flattenEspnInjuryGroups(groups, { capturedAt: generatedAt });
      sourceHealth.push({
        source: 'ESPN injuries API',
        status: 'available',
        evidence: `${groups.length} team groups; ${injuryRecords.length} parsed rows.`,
      });
    } catch (err) {
      sourceHealth.push({ source: 'ESPN injuries API', status: 'error', reason: err.message });
    }
  } else if (options.injuryJson) {
    const payload = await readJson(options.injuryJson);
    const groups = payload.injuries || payload;
    injuryRecords = flattenEspnInjuryGroups(groups, { capturedAt: generatedAt });
    sourceHealth.push({
      source: options.injuryJson,
      status: 'file',
      evidence: `${Array.isArray(groups) ? groups.length : 0} team groups; ${injuryRecords.length} parsed rows.`,
    });
  } else {
    sourceHealth.push({ source: 'ESPN injuries API', status: 'skipped', reason: 'Pass --live-injuries to fetch.' });
  }

  // F-26c §4 — additive, not a replacement: pushed onto the same injuryRecords
  // array ESPN already populated above, both flowing into one
  // buildAvailabilitySnapshot() call. No cross-source dedupe pass (Andy's call,
  // scope doc §7 open question 7 — resolved 2026-08-09: keep both as
  // independent corroborating entries; dedupeAvailabilityEvents()'s existing
  // per-source-URL keying already keeps them as separate events).
  if (shouldFetchFantasyProsInjuries(options)) {
    try {
      const data = await fetchFantasyProsInjuries({ year: options.fantasyProsYear || season, week: options.fantasyProsWeek });
      const fpRecords = flattenFantasyProsInjuries(data, { capturedAt: generatedAt });
      injuryRecords = [...injuryRecords, ...fpRecords];
      sourceHealth.push({
        source: 'FantasyPros injuries API',
        status: 'available',
        evidence: `${fpRecords.length} parsed rows.`,
      });
    } catch (err) {
      sourceHealth.push({ source: 'FantasyPros injuries API', status: 'error', reason: err.message });
    }
  } else {
    sourceHealth.push({ source: 'FantasyPros injuries API', status: 'skipped', reason: 'Disabled with --no-live-fantasypros-injuries.' });
  }

  const campPath = options.trainingCamp || path.join('data', 'training-camp', String(season), 'latest.json');
  const camp = await readJson(campPath, null);
  const namedStatusReview = await readJson(
    options.namedStatusReview || path.join('data', 'projected-starters', String(season), 'named-status-review.json'),
    { cases: [] },
  );
  const campItems = trainingCampItems(camp);
  sourceHealth.push({
    source: 'Training camp snapshot',
    status: camp ? 'available' : 'missing',
    evidence: camp ? `${campItems.length} availability-like item(s) from ${camp.meta?.item_count || 0} camp item(s).` : `Missing ${campPath}.`,
  });

  const snapshot = buildAvailabilitySnapshot({
    season,
    generatedAt,
    injuryRecords,
    trainingCampItems: campItems,
    sourceHealth,
    namedStatusReview,
  });

  if (options.dryRun) return { snapshot, outputs: null };

  const outputs = await writeAvailabilitySnapshotAndReports(snapshot, { date });
  return { snapshot, outputs };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { snapshot, outputs } = await buildPlayerAvailability({
    season: Number(args.season || DEFAULT_SEASON),
    date: args.date || null,
    liveInjuries: args['live-injuries'] === true || String(args['live-injuries']).toLowerCase() === 'true',
    injuryJson: args['injury-json'] || null,
    trainingCamp: args['training-camp'] || null,
    namedStatusReview: args['named-status-review'] || null,
    liveFantasyProsInjuries: args['no-live-fantasypros-injuries'] === true
      ? false
      : !(args['live-fantasypros-injuries'] === false || String(args['live-fantasypros-injuries']).toLowerCase() === 'false'),
    noLiveFantasyProsInjuries: args['no-live-fantasypros-injuries'] === true,
    fantasyProsYear: args['fp-year'] ? Number(args['fp-year']) : null,
    fantasyProsWeek: args['fp-week'] ? Number(args['fp-week']) : null,
    dryRun: args['dry-run'] === true || args['no-persist'] === true,
  });

  console.log(`Player availability build complete: ${snapshot.meta.event_count} events, ${snapshot.meta.teams_with_events} teams.`);
  console.log(`Improving ${snapshot.meta.improving_count} | Worsening ${snapshot.meta.worsening_count} | Major ${snapshot.meta.major_count}`);
  for (const source of snapshot.meta.source_health) {
    console.log(`  [${source.status}] ${source.source}${source.evidence ? ` - ${source.evidence}` : ''}${source.reason ? ` (${source.reason})` : ''}`);
  }
  if (outputs) {
    console.log(`Snapshot: ${outputs.jsonPath}`);
    console.log(`Latest: ${outputs.latestPath}`);
    console.log(`Markdown: ${outputs.latestMdPath}`);
    console.log(`HTML: ${outputs.latestHtmlPath}`);
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
