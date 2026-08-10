#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getTeamAbbreviation, NFL_TEAMS } from '../src/lib/teams.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_SEASON = 2026;
const DEFAULT_REPORT_DIR = path.join(ROOT, '.nfl', 'training-camp');

const SIGNAL_RULES = [
  ['injury', /\b(injur(?:y|ed)|limited|did not practice|returned|setback|pup|nfi|questionable|doubtful|out)\b/i],
  ['depth_chart', /\b(first[- ]team|second[- ]team|starter|backup|competition|depth chart|reps?|rotat(?:e|ed|ion))\b/i],
  ['role_usage', /\b(slot reps?|target share|red zone|third down|two[- ]minute|packages?|route|carry|touches)\b/i],
  ['coach_quote', /\b(coach says|coordinator says|press conference|quote|said)\b/i],
  ['beat_consensus', /\b(multiple reports|beat writers agree|camp buzz|consensus|several reporters)\b/i],
  ['roster_move', /\b(signed|waived|traded|released|activated|claimed|roster move)\b/i],
  ['preseason_usage', /\b(preseason snaps?|starters playing|snap count|drive count|hall of fame game)\b/i],
  ['scheme', /\b(motion|play action|tempo|pressure|coverage|personnel grouping|blitz|zone|man coverage)\b/i],
  ['market_move', /\b(line movement|win total move|futures price move|odds moved|market move)\b/i],
];

const HIGH_VALUE_TERMS = /\b(qb|quarterback|offensive line|ol\b|left tackle|pass rush|edge|corner|cb\b|injury|starter|first[- ]team)\b/i;
const STARTER_TERMS = /\b(starter|first[- ]team|limited|returned|competition|red zone|two[- ]minute|pressure)\b/i;
const ROTATION_TERMS = /\b(rotation|reps?|coach|coordinator|scheme|motion|play action|package)\b/i;
const SOFT_TERMS = /\b(buzz|could|might|early|soft|low confidence|background)\b/i;

const LINKED_MARKET_RULES = [
  ['wins', /\b(win total|wins?|season|starter|injury|qb|offensive line|defense|schedule)\b/i],
  ['make_playoffs', /\b(playoff|wild card|division|conference|starter|qb|injury|pass rush)\b/i],
  ['division', /\b(division|afc east|afc north|afc south|afc west|nfc east|nfc north|nfc south|nfc west)\b/i],
  ['conference', /\b(conference|afc|nfc|playoff)\b/i],
  ['super_bowl', /\b(super bowl|championship|anchor|futures)\b/i],
  ['week_1_spread', /\b(week 1|early-season|preseason|starter|injury|line movement)\b/i],
];

export function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      out._.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

export function todayPacificDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function nowIso() {
  return new Date().toISOString();
}

export function sha(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

function canonicalTeamAbbr(value) {
  const abbr = getTeamAbbreviation(value);
  return abbr || null;
}

export function allTeams() {
  return Object.entries(NFL_TEAMS)
    .map(([nick, team]) => ({
      nick,
      team: team.abbreviation,
      full_name: team.fullName,
      division: team.division,
      conference: team.conference,
    }))
    .sort((a, b) => a.team.localeCompare(b.team));
}

function splitList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  return String(value)
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

function parseScalar(value) {
  const raw = String(value ?? '').trim();
  if (raw.startsWith('[') && raw.endsWith(']')) return splitList(raw);
  if (raw === 'null') return null;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return raw.replace(/^['"]|['"]$/g, '');
}

function parseFrontmatter(text) {
  const match = String(text).match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: text };
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!m) continue;
    meta[m[1].trim()] = parseScalar(m[2]);
  }
  return { meta, body: match[2].trim() };
}

function parseTextHeaders(text) {
  const meta = {};
  const lines = String(text).split(/\r?\n/);
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) {
      bodyStart = i + 1;
      break;
    }
    const m = line.match(/^([A-Za-z][A-Za-z ]+):\s*(.*)$/);
    if (!m) {
      bodyStart = i;
      break;
    }
    const key = m[1].trim().toLowerCase().replace(/\s+/g, '_');
    meta[key] = parseScalar(m[2]);
  }
  return { meta, body: lines.slice(bodyStart).join('\n').trim() };
}

function normalizeExcerpt(value, maxChars = 700) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, maxChars - 3).trim()}...`;
}

function extractBettingRelevance(body, fallback = '') {
  const match = String(body || '').match(/Betting relevance:\s*([\s\S]*)/i);
  return normalizeExcerpt(match ? match[1] : fallback, 360);
}

function stripLabeledSections(body) {
  return String(body || '').replace(/Betting relevance:\s*[\s\S]*$/i, '').trim();
}

function summarize(body, provided) {
  if (provided) return normalizeExcerpt(provided, 220);
  const clean = stripLabeledSections(body).replace(/\s+/g, ' ').trim();
  const sentence = clean.match(/^(.+?[.!?])\s/)?.[1] || clean;
  return normalizeExcerpt(sentence, 220);
}

function classifySignal(text) {
  for (const [type, re] of SIGNAL_RULES) {
    if (re.test(text)) return type;
  }
  return 'other';
}

function strengthFor(text, signalType) {
  if (HIGH_VALUE_TERMS.test(text) && ['injury', 'depth_chart', 'role_usage', 'scheme'].includes(signalType)) return 0.82;
  if (STARTER_TERMS.test(text)) return 0.72;
  if (ROTATION_TERMS.test(text)) return 0.56;
  if (SOFT_TERMS.test(text)) return 0.34;
  return signalType === 'other' ? 0.18 : 0.45;
}

function confidenceFor(sourceType) {
  const type = String(sourceType || 'manual').toLowerCase();
  if (type === 'official_media' || type === 'team_site') return 0.82;
  if (type === 'beat_report') return 0.74;
  if (type === 'structured_feed' || type === 'rss') return 0.68;
  if (type === 'manual') return 0.62;
  return 0.55;
}

function linkedMarkets(text) {
  const out = [];
  for (const [market, re] of LINKED_MARKET_RULES) {
    if (re.test(text)) out.push(market);
  }
  return out.length ? out : ['wins'];
}

function anchorRelevance(team, text) {
  const out = [];
  if (team === 'BUF' || /\b(bills|buffalo|buf)\b/i.test(text)) out.push('Bills');
  if (team === 'GB' || /\b(packers|green bay|gb)\b/i.test(text)) out.push('Packers');
  if (/\b(hedge|opponent|playoff|afc|nfc|division|wild card)\b/i.test(text)) out.push('hedge');
  if (!['BUF', 'GB'].includes(team) && /\b(bills|packers|anchor|opponent)\b/i.test(text)) out.push('opponent');
  return [...new Set(out)];
}

export function inferTeams(meta, body) {
  const rawTeams = splitList(meta.teams || meta.team);
  const fromMeta = rawTeams.map(canonicalTeamAbbr).filter(Boolean);
  if (fromMeta.length) return [...new Set(fromMeta)];

  const found = [];
  for (const team of Object.values(NFL_TEAMS)) {
    const aliases = [team.abbreviation, team.fullName, team.name, team.city, ...(team.altAbbreviations || [])];
    if (aliases.some((alias) => new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(body))) {
      found.push(team.abbreviation);
    }
  }
  return [...new Set(found)];
}

function normalizeTags(value, signalType) {
  return [...new Set(['camp', signalType, ...splitList(value)])].filter(Boolean);
}

export function toIntelRecord({ raw, team, sourceFile, season, capturedFallback }) {
  const body = raw.body ?? raw.raw_excerpt ?? raw.summary ?? '';
  const summary = summarize(body, raw.summary);
  const sourceType = raw.source_type || 'manual';
  const signalType = raw.signal_type || classifySignal(`${summary} ${body}`);
  const publishedAt = raw.published_at || null;
  const capturedAt = raw.captured_at || capturedFallback;
  const sourceUrl = raw.source_url || raw.url || null;
  const dedupeKey = raw.dedupe_key || sourceUrl || sha(`${sourceFile}|${team}|${summary}|${body}`);
  const id = raw.id || `camp_${sha([season, team, raw.source || 'Manual', dedupeKey, summary].join('|')).slice(0, 16)}`;
  const relevance = raw.betting_relevance || extractBettingRelevance(body, 'Needs human review for betting relevance.');
  const textForRules = `${summary} ${body} ${relevance}`;

  return {
    id,
    season,
    team,
    player: raw.player ?? null,
    position: raw.position ?? null,
    source: raw.source || 'Manual note',
    source_type: sourceType,
    source_url: sourceUrl,
    published_at: publishedAt,
    captured_at: capturedAt,
    signal_type: signalType,
    signal_strength: Number(raw.signal_strength ?? strengthFor(textForRules, signalType)),
    confidence: Number(raw.confidence ?? confidenceFor(sourceType)),
    summary,
    raw_excerpt: normalizeExcerpt(raw.raw_excerpt || stripLabeledSections(body), 700),
    betting_relevance: relevance,
    linked_markets: raw.linked_markets || linkedMarkets(textForRules),
    anchor_relevance: raw.anchor_relevance || anchorRelevance(team, textForRules),
    needs_human_review: raw.needs_human_review ?? true,
    tags: normalizeTags(raw.tags, signalType),
    dedupe_key: dedupeKey,
    source_file: sourceFile ? path.relative(ROOT, sourceFile) : null,
  };
}

async function listInputFiles(inputDir) {
  if (!existsSync(inputDir)) return [];
  const entries = await readdir(inputDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /\.(md|markdown|txt|json)$/i.test(entry.name))
    .map((entry) => path.join(inputDir, entry.name))
    .sort();
}

async function parseManualFile(filePath, season, capturedFallback) {
  const ext = path.extname(filePath).toLowerCase();
  const text = await readFile(filePath, 'utf8');

  if (ext === '.json') {
    const parsed = JSON.parse(text);
    const rows = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.items) ? parsed.items : [parsed]);
    return rows.flatMap((row) => {
      const body = row.body ?? row.raw_excerpt ?? row.summary ?? '';
      const teams = inferTeams(row, body);
      return teams.map((team) => toIntelRecord({ raw: row, team, sourceFile: filePath, season, capturedFallback }));
    });
  }

  const parsed = ext === '.md' || ext === '.markdown'
    ? parseFrontmatter(text)
    : parseTextHeaders(text);
  const raw = { ...parsed.meta, body: parsed.body };
  const teams = inferTeams(raw, parsed.body);
  return teams.map((team) => toIntelRecord({ raw, team, sourceFile: filePath, season, capturedFallback }));
}

export function dedupeItems(items) {
  const byKey = new Map();
  for (const item of items) {
    const key = `${item.team}|${item.dedupe_key}`;
    const existing = byKey.get(key);
    if (!existing || String(item.captured_at).localeCompare(String(existing.captured_at)) > 0) {
      byKey.set(key, item);
    }
  }
  return [...byKey.values()].sort((a, b) =>
    a.team.localeCompare(b.team) ||
    String(b.published_at || b.captured_at).localeCompare(String(a.published_at || a.captured_at)) ||
    b.signal_strength - a.signal_strength
  );
}

export function buildSnapshot({ season, generatedAt, items, inputDir, feedHealth = null }) {
  const teamRows = {};
  for (const team of allTeams()) {
    teamRows[team.team] = { ...team, items: [] };
  }
  for (const item of items) {
    if (teamRows[item.team]) teamRows[item.team].items.push(item);
  }

  const teamsWithIntel = Object.values(teamRows).filter((team) => team.items.length > 0).length;
  const highPriority = items.filter((item) => item.signal_strength >= 0.7).length;
  return {
    meta: {
      schema: 'training_camp_intel_snapshot_v1',
      season,
      generated_at: generatedAt,
      input_dir: path.relative(ROOT, inputDir),
      team_count: Object.keys(teamRows).length,
      teams_with_intel: teamsWithIntel,
      teams_without_intel: Object.keys(teamRows).length - teamsWithIntel,
      item_count: items.length,
      high_priority_count: highPriority,
      local_only: true,
      recommendation_status: 'intel_only_not_picks',
      guardrails: {
        live_model_calls: false,
        // F-30b: true only when the Phase 2 RSS scout performed a live fetch
        // (feedHealth present) — Phase 1 manual-only builds stay false.
        network_fetches: Boolean(feedHealth),
        supabase_writes: false,
        official_picks_generated: false,
      },
      // F-30b — per-feed fetch outcomes from the RSS scout, surfaced in the
      // report so a failed/rate-limited feed is visible, not silent. Null
      // for manual-only (Phase 1) builds.
      feed_health: feedHealth,
    },
    items,
    teams: teamRows,
  };
}

function fmtDate(value) {
  if (!value) return 'unknown date';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().replace('.000Z', 'Z');
}

function staleLabel(item, generatedAt, warnAfterHours = 72) {
  const base = item.published_at || item.captured_at;
  const then = base ? new Date(base).getTime() : NaN;
  if (!Number.isFinite(then)) return 'date unknown';
  const age = (new Date(generatedAt).getTime() - then) / 36e5;
  if (age > warnAfterHours) return `stale ${Math.round(age)}h`;
  return `fresh ${Math.max(0, Math.round(age))}h`;
}

function itemLine(item, generatedAt) {
  const source = [item.source, fmtDate(item.published_at), staleLabel(item, generatedAt)].filter(Boolean).join(' | ');
  const review = item.needs_human_review ? ' | human review' : '';
  const player = item.player ? ` (${item.player}${item.position ? `, ${item.position}` : ''})` : '';
  return `- [${item.signal_type}]${player} ${item.summary} (${source}${review})\n  - Relevance: ${item.betting_relevance}\n  - Markets: ${item.linked_markets.join(', ')}${item.anchor_relevance.length ? ` | Anchor: ${item.anchor_relevance.join(', ')}` : ''}`;
}

export function renderMarkdown(snapshot) {
  const { meta } = snapshot;
  const lines = [
    `# Training Camp Intel Snapshot - ${meta.generated_at.slice(0, 10)}`,
    '',
    '> Local intelligence review only. This report is not a betting recommendation sheet and does not authorize official Platinum Rose AI picks.',
    '',
    `Season: ${meta.season}`,
    `Generated: ${meta.generated_at}`,
    `Coverage: ${meta.team_count} teams | ${meta.teams_with_intel} with intel | ${meta.teams_without_intel} not collected yet`,
    `Items: ${meta.item_count} | High priority: ${meta.high_priority_count}`,
    '',
  ];

  // F-30b — feed health table, only present when the RSS scout ran live.
  if (Array.isArray(meta.feed_health) && meta.feed_health.length) {
    lines.push('## Feed Health (RSS Scout)', '');
    lines.push('| Source | Status | Items Kept | Notes |', '|---|---|---|---|');
    for (const feed of meta.feed_health) {
      const notes = feed.reason || '';
      lines.push(`| ${feed.source} | ${feed.status} | ${feed.kept_items ?? 0} | ${notes} |`);
    }
    lines.push('');
  }

  lines.push('## Team Coverage', '');
  for (const team of Object.values(snapshot.teams)) {
    lines.push(`### ${team.full_name} (${team.team})`, '');
    if (!team.items.length) {
      lines.push('_No current camp intel collected yet. This does not mean no news; it means no local item has been imported._', '');
      continue;
    }
    const groups = team.items.reduce((acc, item) => {
      (acc[item.signal_type] ??= []).push(item);
      return acc;
    }, {});
    for (const [signalType, items] of Object.entries(groups)) {
      lines.push(`#### ${signalType}`, '');
      for (const item of items) lines.push(itemLine(item, meta.generated_at));
      lines.push('');
    }
  }
  return `${lines.join('\n')}\n`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderHtml(snapshot) {
  const { meta } = snapshot;
  const feedHealthSection = Array.isArray(meta.feed_health) && meta.feed_health.length
    ? `<h2>Feed Health (RSS Scout)</h2>
    <table class="feed-health">
      <thead><tr><th>Source</th><th>Status</th><th>Items Kept</th><th>Notes</th></tr></thead>
      <tbody>
        ${meta.feed_health.map((feed) => `<tr class="status-${escapeHtml(feed.status)}">
          <td>${escapeHtml(feed.source)}</td>
          <td>${escapeHtml(feed.status)}</td>
          <td>${feed.kept_items ?? 0}</td>
          <td class="muted">${escapeHtml(feed.reason || '')}</td>
        </tr>`).join('\n')}
      </tbody>
    </table>`
    : '';
  const itemCard = (item) => `<li>
    <div><strong>${escapeHtml(item.signal_type)}</strong> ${item.player ? `<span class="muted">${escapeHtml(item.player)}</span>` : ''}</div>
    <p>${escapeHtml(item.summary)}</p>
    <p class="muted">${escapeHtml(item.source)} | ${escapeHtml(fmtDate(item.published_at))} | ${escapeHtml(staleLabel(item, meta.generated_at))}${item.needs_human_review ? ' | human review' : ''}</p>
    <p><span class="label">Relevance</span> ${escapeHtml(item.betting_relevance)}</p>
    <p class="muted">Markets: ${escapeHtml(item.linked_markets.join(', '))}${item.anchor_relevance.length ? ` | Anchor: ${escapeHtml(item.anchor_relevance.join(', '))}` : ''}</p>
  </li>`;

  const teamSections = Object.values(snapshot.teams).map((team) => {
    const body = team.items.length
      ? `<ul>${team.items.map(itemCard).join('\n')}</ul>`
      : '<p class="empty">No current camp intel collected yet. This does not mean no news; it means no local item has been imported.</p>';
    return `<details class="team" ${team.items.length ? 'open' : ''}>
      <summary>${escapeHtml(team.full_name)} (${escapeHtml(team.team)}) <span>${team.items.length}</span></summary>
      ${body}
    </details>`;
  }).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Training Camp Intel Snapshot</title>
  <style>
    :root { color-scheme: light; --ink:#16202a; --muted:#607080; --line:#d7dee8; --paper:#fff; --band:#f5f7fa; --accent:#0f766e; --warn:#a16207; }
    body { margin:0; font:14px/1.45 system-ui,-apple-system,Segoe UI,sans-serif; color:var(--ink); background:var(--band); }
    header { padding:28px 32px 20px; background:var(--paper); border-bottom:1px solid var(--line); }
    main { max-width:1180px; margin:0 auto; padding:24px; }
    h1 { margin:0 0 6px; font-size:28px; letter-spacing:0; }
    h2 { margin:28px 0 12px; font-size:18px; }
    .muted { color:var(--muted); font-size:12px; }
    .notice { margin-top:12px; padding:10px 12px; border-left:4px solid var(--warn); background:#fff8e6; }
    .metrics { display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:10px; margin:18px 0; }
    .metric { background:var(--paper); border:1px solid var(--line); border-radius:8px; padding:12px; }
    .metric strong { display:block; font-size:22px; }
    .panel, details.team { background:var(--paper); border:1px solid var(--line); border-radius:8px; margin:10px 0; }
    .panel { padding:14px; }
    summary { cursor:pointer; padding:12px 14px; font-weight:700; display:flex; justify-content:space-between; gap:12px; }
    ul { margin:0; padding:0 14px 14px 34px; }
    li { margin:10px 0; }
    p { margin:5px 0; }
    .label { font-size:12px; font-weight:700; color:var(--accent); text-transform:uppercase; }
    .empty { color:var(--muted); padding:0 14px 14px; }
    table.feed-health { width:100%; border-collapse:collapse; background:var(--paper); border:1px solid var(--line); border-radius:8px; overflow:hidden; margin-bottom:18px; }
    table.feed-health th, table.feed-health td { text-align:left; padding:8px 12px; border-bottom:1px solid var(--line); font-size:13px; }
    table.feed-health tr.status-error td, table.feed-health tr.status-unavailable td { color:var(--warn); }
  </style>
</head>
<body>
  <header>
    <h1>Training Camp Intel Snapshot</h1>
    <div class="muted">Generated ${escapeHtml(meta.generated_at)} | Season ${escapeHtml(meta.season)}</div>
    <div class="notice">Local intelligence review only. This report is not a betting recommendation sheet and does not authorize official Platinum Rose AI picks.</div>
  </header>
  <main>
    <section class="metrics">
      <div class="metric"><span>Teams</span><strong>${meta.team_count}</strong></div>
      <div class="metric"><span>With Intel</span><strong>${meta.teams_with_intel}</strong></div>
      <div class="metric"><span>Not Collected Yet</span><strong>${meta.teams_without_intel}</strong></div>
      <div class="metric"><span>High Priority</span><strong>${meta.high_priority_count}</strong></div>
    </section>
    ${feedHealthSection}
    <h2>Team Coverage</h2>
    ${teamSections}
  </main>
</body>
</html>`;
}

async function readSnapshot(snapshotPath) {
  return JSON.parse(await readFile(snapshotPath, 'utf8'));
}

export async function writeSnapshotAndReports(snapshot, outDir, reportDir, date) {
  await mkdir(outDir, { recursive: true });
  await mkdir(reportDir, { recursive: true });
  const jsonPath = path.join(outDir, `training-camp-intel-${date}.json`);
  const latestPath = path.join(outDir, 'latest.json');
  const mdPath = path.join(reportDir, `training-camp-intel-${date}.md`);
  const htmlPath = path.join(reportDir, `training-camp-intel-${date}.html`);

  await writeFile(jsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  await writeFile(latestPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  await writeFile(mdPath, renderMarkdown(snapshot), 'utf8');
  await writeFile(htmlPath, renderHtml(snapshot), 'utf8');
  return { jsonPath, latestPath, mdPath, htmlPath };
}

/**
 * Parse every manual note/article in `inputDir` into flat intel records
 * (pre-dedup). Extracted so the F-30b RSS scout can combine these with
 * live-fetched items and run a single dedupeItems()/buildSnapshot() pass.
 */
export async function parseManualDirectory(inputDir, season, capturedFallback) {
  const files = await listInputFiles(inputDir);
  const parsed = [];
  for (const file of files) {
    parsed.push(...await parseManualFile(file, season, capturedFallback));
  }
  return { files, items: parsed };
}

export async function buildTrainingCampIntel(options = {}) {
  const season = Number(options.season || DEFAULT_SEASON);
  const generatedAt = options.generatedAt || nowIso();
  const date = options.date || generatedAt.slice(0, 10) || todayPacificDate();
  const inputDir = path.resolve(ROOT, options.inputDir || path.join('data', 'training-camp', String(season), 'manual'));
  const outDir = path.resolve(ROOT, options.outDir || path.join('data', 'training-camp', String(season)));
  const reportDir = path.resolve(ROOT, options.reportDir || DEFAULT_REPORT_DIR);
  const capturedFallback = options.capturedAt || generatedAt;

  const { files, items: parsed } = await parseManualDirectory(inputDir, season, capturedFallback);
  const items = dedupeItems(parsed);
  const snapshot = buildSnapshot({ season, generatedAt, items, inputDir });

  if (options.dryRun) {
    return { snapshot, files, outputs: null };
  }
  const outputs = await writeSnapshotAndReports(snapshot, outDir, reportDir, date);
  return { snapshot, files, outputs };
}

export async function renderReportFromSnapshot(options = {}) {
  const season = Number(options.season || DEFAULT_SEASON);
  const snapshotPath = path.resolve(ROOT, options.snapshot || path.join('data', 'training-camp', String(season), 'latest.json'));
  const reportDir = path.resolve(ROOT, options.reportDir || DEFAULT_REPORT_DIR);
  const snapshot = await readSnapshot(snapshotPath);
  const date = options.date || snapshot.meta?.generated_at?.slice(0, 10) || todayPacificDate();
  await mkdir(reportDir, { recursive: true });
  const mdPath = path.join(reportDir, `training-camp-intel-${date}.md`);
  const htmlPath = path.join(reportDir, `training-camp-intel-${date}.html`);
  await writeFile(mdPath, renderMarkdown(snapshot), 'utf8');
  await writeFile(htmlPath, renderHtml(snapshot), 'utf8');
  return { snapshot, outputs: { mdPath, htmlPath } };
}

async function main() {
  const [command = 'build', ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  const season = Number(args.season || DEFAULT_SEASON);
  const inputDir = args['manual-dir'] || args.input || path.join('data', 'training-camp', String(season), 'manual');
  const reportDir = args['report-dir'] || DEFAULT_REPORT_DIR;
  const date = args.date || null;

  if (command === 'build') {
    const { snapshot, files, outputs } = await buildTrainingCampIntel({
      season,
      inputDir,
      reportDir,
      date,
      dryRun: args['dry-run'] === true,
    });
    console.log(`Training camp intel build complete: ${snapshot.meta.item_count} items from ${files.length} manual file(s).`);
    console.log(`Coverage: ${snapshot.meta.team_count} teams, ${snapshot.meta.teams_with_intel} with intel, ${snapshot.meta.teams_without_intel} not collected yet.`);
    if (args['no-persist']) console.log('No Supabase or production recommendation persistence was attempted.');
    if (outputs) {
      console.log(`Snapshot: ${outputs.jsonPath}`);
      console.log(`Latest: ${outputs.latestPath}`);
      console.log(`Markdown: ${outputs.mdPath}`);
      console.log(`HTML: ${outputs.htmlPath}`);
    }
    return;
  }

  if (command === 'report') {
    const { outputs } = await renderReportFromSnapshot({
      season,
      snapshot: args.snapshot,
      reportDir,
      date,
    });
    console.log(`Markdown: ${outputs.mdPath}`);
    console.log(`HTML: ${outputs.htmlPath}`);
    return;
  }

  throw new Error(`Unknown command: ${command}. Use build or report.`);
}

// Windows drive-letter-casing fix (see agents/fantasy-value-report.js for full note) —
// compare via pathToFileURL, not path.resolve() === fileURLToPath().
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
