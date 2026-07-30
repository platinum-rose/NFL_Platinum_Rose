#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildAvailabilitySnapshot,
  parseInjuryType,
} from '../agents/lib/player-availability.js';
import { parseArgs, todayPacificDate, nowIso } from './training-camp-intel.js';

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

async function fetchEspnInjuries() {
  const response = await fetch(ESPN_INJURIES_URL, {
    headers: { 'User-Agent': 'NFL-Platinum-Rose-PlayerAvailability/1.0' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`ESPN injuries API returned ${response.status}`);
  const payload = await response.json();
  return payload.injuries || [];
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

function renderMarkdown(snapshot) {
  const lines = [
    `# Player Availability Snapshot - ${snapshot.meta.generated_at.slice(0, 10)}`,
    '',
    '> Local availability intel only. This report is not a betting recommendation sheet and does not authorize official Platinum Rose AI picks.',
    '',
    `Season: ${snapshot.meta.season}`,
    `Generated: ${snapshot.meta.generated_at}`,
    `Events: ${snapshot.meta.event_count} | Teams: ${snapshot.meta.teams_with_events} | Improving: ${snapshot.meta.improving_count} | Worsening: ${snapshot.meta.worsening_count} | Major: ${snapshot.meta.major_count}`,
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
    lines.push(`Events: ${team.event_count} | Improving: ${team.improving_count} | Worsening: ${team.worsening_count} | Major: ${team.major_count}`, '');
    for (const event of team.events) {
      const player = event.player_name ? `${event.player_name}${event.position ? ` (${event.position})` : ''}` : 'Team item';
      lines.push(`- **${event.availability_trend}/${event.event_type}** ${player}: ${event.short_summary}`);
      lines.push(`  - Source: ${event.source}${event.published_at ? ` | ${event.published_at}` : ''}`);
      lines.push(`  - Markets: ${event.linked_markets.join(', ')} | Impact: ${event.impact_bucket}${event.needs_human_review ? ' | human review' : ''}`);
      if (event.supporting_quote) lines.push(`  - Evidence: ${event.supporting_quote}`);
    }
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

function renderHtml(snapshot) {
  const rows = Object.values(snapshot.teams)
    .sort((a, b) => b.major_count - a.major_count || b.event_count - a.event_count || a.team_abbr.localeCompare(b.team_abbr))
    .map((team) => `<section class="team">
      <h2>${escapeHtml(team.team_abbr)} <span>${team.event_count} events</span></h2>
      <p class="muted">Improving ${team.improving_count} | Worsening ${team.worsening_count} | Major ${team.major_count}</p>
      <ul>
        ${team.events.map((event) => `<li>
          <strong>${escapeHtml(event.availability_trend)} / ${escapeHtml(event.event_type)}</strong>
          ${escapeHtml(event.player_name || 'Team item')}${event.position ? ` <span class="muted">${escapeHtml(event.position)}</span>` : ''}
          <p>${escapeHtml(event.short_summary)}</p>
          <p class="muted">${escapeHtml(event.source)}${event.published_at ? ` | ${escapeHtml(event.published_at)}` : ''}</p>
          <p class="muted">Markets: ${escapeHtml(event.linked_markets.join(', '))} | Impact: ${escapeHtml(event.impact_bucket)}${event.needs_human_review ? ' | human review' : ''}</p>
        </li>`).join('\n')}
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
      <div class="metric"><span>Teams</span><strong>${snapshot.meta.teams_with_events}</strong></div>
      <div class="metric"><span>Improving</span><strong>${snapshot.meta.improving_count}</strong></div>
      <div class="metric"><span>Worsening</span><strong>${snapshot.meta.worsening_count}</strong></div>
      <div class="metric"><span>Major</span><strong>${snapshot.meta.major_count}</strong></div>
    </section>
  </header>
  <main>${rows || '<p>No availability events found.</p>'}</main>
</body>
</html>`;
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

  const campPath = options.trainingCamp || path.join('data', 'training-camp', String(season), 'latest.json');
  const camp = await readJson(campPath, null);
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
  });

  if (options.dryRun) return { snapshot, outputs: null };

  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(DOCS_DIR, { recursive: true });
  const jsonPath = path.join(OUT_DIR, `player-availability-${date}.json`);
  const latestPath = path.join(OUT_DIR, 'latest.json');
  const mdPath = path.join(DOCS_DIR, `player-availability-${date}.md`);
  const htmlPath = path.join(DOCS_DIR, `player-availability-${date}.html`);
  const latestMdPath = path.join(DOCS_DIR, 'player-availability-latest.md');
  const latestHtmlPath = path.join(DOCS_DIR, 'player-availability-latest.html');

  await writeFile(jsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  await writeFile(latestPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  const markdown = renderMarkdown(snapshot);
  const html = renderHtml(snapshot);
  await writeFile(mdPath, markdown, 'utf8');
  await writeFile(latestMdPath, markdown, 'utf8');
  await writeFile(htmlPath, html, 'utf8');
  await writeFile(latestHtmlPath, html, 'utf8');
  return { snapshot, outputs: { jsonPath, latestPath, mdPath, latestMdPath, htmlPath, latestHtmlPath } };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { snapshot, outputs } = await buildPlayerAvailability({
    season: Number(args.season || DEFAULT_SEASON),
    date: args.date || null,
    liveInjuries: args['live-injuries'] === true || String(args['live-injuries']).toLowerCase() === 'true',
    injuryJson: args['injury-json'] || null,
    trainingCamp: args['training-camp'] || null,
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

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
