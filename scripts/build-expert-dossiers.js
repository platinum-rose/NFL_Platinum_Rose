#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const HOST_CITATIONS_PATH = path.join(ROOT, 'data', 'generated', 'host-citations-latest.json');
const RECOVERY_DIR = path.join(ROOT, 'data', 'shadow-harness', 'recovery');
const OUT_DIR = path.join(ROOT, 'data', 'expert-dossiers');
const DOC_DIR = path.join(ROOT, 'docs', 'antigravity', 'expert-dossiers');

function slugify(value) {
  return String(value || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown';
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2));
  fs.renameSync(tmpPath, filePath);
}

function htmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function mdCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();
}

function loadHostCitationStats() {
  if (!fs.existsSync(HOST_CITATIONS_PATH)) return new Map();
  const data = readJson(HOST_CITATIONS_PATH);
  const byHost = new Map();
  for (const citation of data.citations || []) {
    const host = citation.host || 'Unknown';
    const row = byHost.get(host) || {
      citation_count: 0,
      sentiment_counts: {},
      team_counts: {},
      market_counts: {},
      latest_citations: []
    };
    row.citation_count += 1;
    row.sentiment_counts[citation.sentiment] = (row.sentiment_counts[citation.sentiment] || 0) + 1;
    row.team_counts[citation.team] = (row.team_counts[citation.team] || 0) + 1;
    row.market_counts[citation.market] = (row.market_counts[citation.market] || 0) + 1;
    row.latest_citations.push(citation);
    byHost.set(host, row);
  }

  for (const row of byHost.values()) {
    row.latest_citations = row.latest_citations
      .sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0))
      .slice(0, 12);
    row.top_teams = Object.entries(row.team_counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([team, count]) => ({ team, count }));
    row.top_markets = Object.entries(row.market_counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([market, count]) => ({ market, count }));
  }
  return byHost;
}

function loadRecoverySignals() {
  if (!fs.existsSync(RECOVERY_DIR)) return [];
  const files = fs.readdirSync(RECOVERY_DIR).filter(name => name.endsWith('-local-recovery.json'));
  const signals = [];
  for (const file of files) {
    const recovery = readJson(path.join(RECOVERY_DIR, file));
    for (const list of recovery.expert_ranked_lists || []) {
      signals.push({
        signal_type: 'ranked_list',
        source_lane: recovery.status || 'local_recovery_context_only',
        authority: 'context_only',
        usable_for_frontier_synthesis: recovery.recovery_summary?.usable_for_frontier_synthesis === true,
        requires_manual_review: true,
        expert: list.speaker,
        show: recovery.episode?.show || null,
        episode_id: recovery.episode?.id || null,
        episode_title: recovery.episode?.title || null,
        source_url: recovery.episode?.url || null,
        timestamp_url: list.timestamp_url || null,
        source_timestamp: list.source_timestamp ?? null,
        recovery_source: list.recovery_source || null,
        topic: list.topic,
        summary: list.summary,
        ranks: list.ranks || [],
        inference_use: 'Use only to interpret analyst priors, tendencies, and possible blind spots. Do not use as pick support or price evidence.'
      });
    }
  }
  return signals;
}

function signalObservations(signal) {
  if (signal.signal_type !== 'ranked_list') return [];
  return signal.ranks.map(row => ({
    kind: 'player_rank',
    subject: row.player,
    team: row.team,
    rank: row.rank,
    summary: `${signal.expert} ranked ${row.player} #${row.rank} in ${signal.topic}.`,
    source_lane: signal.source_lane,
    authority: signal.authority,
    evidence: {
      episode_id: signal.episode_id,
      episode_title: signal.episode_title,
      timestamp_url: signal.timestamp_url,
      recovery_source: signal.recovery_source
    }
  }));
}

function buildDossiers() {
  const citationStats = loadHostCitationStats();
  const recoverySignals = loadRecoverySignals();
  const experts = new Set([
    ...citationStats.keys(),
    ...recoverySignals.map(signal => signal.expert).filter(Boolean)
  ]);

  return [...experts].sort((a, b) => a.localeCompare(b)).map(expert => {
    const hostStats = citationStats.get(expert) || {
      citation_count: 0,
      sentiment_counts: {},
      top_teams: [],
      top_markets: [],
      latest_citations: []
    };
    const signals = recoverySignals.filter(signal => signal.expert === expert);
    return {
      expert,
      slug: slugify(expert),
      schema_version: 'expert_dossier_v1',
      generated_at: new Date().toISOString(),
      status: 'local_context_profile',
      guardrail: 'Expert dossiers are context for interpreting analyst priors and possible bias. They are not betting authority, not price evidence, and not official-pick support unless a signal is separately promoted through an approved review gate.',
      source_coverage: {
        host_citation_count: hostStats.citation_count,
        local_recovery_signal_count: signals.length,
        local_recovery_context_only_count: signals.filter(signal => signal.source_lane === 'local_recovery_context_only').length
      },
      host_citation_profile: {
        sentiment_counts: hostStats.sentiment_counts,
        top_teams: hostStats.top_teams,
        top_markets: hostStats.top_markets,
        latest_citations: hostStats.latest_citations
      },
      tendency_signals: signals,
      observations: signals.flatMap(signalObservations)
    };
  });
}

function renderMarkdown(dossier) {
  const lines = [
    `# Expert Dossier: ${dossier.expert}`,
    '',
    `Generated: ${dossier.generated_at}`,
    '',
    `> ${dossier.guardrail}`,
    '',
    '## Coverage',
    '',
    `- Host citations: ${dossier.source_coverage.host_citation_count}`,
    `- Local recovery signals: ${dossier.source_coverage.local_recovery_signal_count}`,
    `- Context-only recovery signals: ${dossier.source_coverage.local_recovery_context_only_count}`,
    '',
    '## Host Citation Profile',
    '',
    `- Sentiment counts: ${JSON.stringify(dossier.host_citation_profile.sentiment_counts)}`,
    `- Top teams: ${dossier.host_citation_profile.top_teams.map(row => `${row.team} (${row.count})`).join(', ') || 'none'}`,
    `- Top markets: ${dossier.host_citation_profile.top_markets.map(row => `${row.market} (${row.count})`).join(', ') || 'none'}`,
    '',
    '## Tendency Signals',
    '',
    '| Type | Source lane | Topic | Timestamp | Inference use |',
    '|---|---|---|---|---|',
    ...dossier.tendency_signals.map(signal => `| ${mdCell(signal.signal_type)} | ${mdCell(signal.source_lane)} | ${mdCell(signal.topic)} | ${signal.timestamp_url ? `[${signal.source_timestamp}s](${signal.timestamp_url})` : ''} | ${mdCell(signal.inference_use)} |`),
    '',
    '## Ranked-List Observations',
    '',
    '| Subject | Team | Rank | Evidence |',
    '|---|---|---:|---|',
    ...dossier.observations.map(obs => `| ${mdCell(obs.subject)} | ${mdCell(obs.team)} | ${obs.rank ?? ''} | ${obs.evidence?.timestamp_url ? `[source](${obs.evidence.timestamp_url})` : mdCell(obs.evidence?.episode_id || '')} |`)
  ];
  return `${lines.join('\n')}\n`;
}

function renderIndexMarkdown(dossiers) {
  const lines = [
    '# Expert Dossiers Index',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '> Local expert dossiers are compact inference context. They do not promote picks or provide price evidence.',
    '',
    '| Expert | Host citations | Recovery signals | Dossier |',
    '|---|---:|---:|---|',
    ...dossiers.map(dossier => `| ${mdCell(dossier.expert)} | ${dossier.source_coverage.host_citation_count} | ${dossier.source_coverage.local_recovery_signal_count} | [Markdown](${dossier.slug}.md) |`)
  ];
  return `${lines.join('\n')}\n`;
}

function renderHtml(dossier) {
  const signalRows = dossier.tendency_signals.map(signal => `
    <tr>
      <td>${htmlEscape(signal.signal_type)}</td>
      <td>${htmlEscape(signal.source_lane)}</td>
      <td>${htmlEscape(signal.topic)}</td>
      <td>${signal.timestamp_url ? `<a href="${htmlEscape(signal.timestamp_url)}">${htmlEscape(signal.source_timestamp)}s</a>` : ''}</td>
      <td>${htmlEscape(signal.inference_use)}</td>
    </tr>
  `).join('');
  const obsRows = dossier.observations.map(obs => `
    <tr>
      <td>${htmlEscape(obs.subject)}</td>
      <td>${htmlEscape(obs.team)}</td>
      <td>${htmlEscape(obs.rank ?? '')}</td>
      <td>${obs.evidence?.timestamp_url ? `<a href="${htmlEscape(obs.evidence.timestamp_url)}">source</a>` : htmlEscape(obs.evidence?.episode_id || '')}</td>
    </tr>
  `).join('');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Expert Dossier - ${htmlEscape(dossier.expert)}</title>
  <style>
    body{margin:0;background:#f6f7f9;color:#172033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.45}
    main{max-width:1100px;margin:0 auto;padding:28px}
    h1{font-size:28px;margin:0 0 8px;letter-spacing:0}
    h2{font-size:18px;margin:28px 0 10px;letter-spacing:0}
    .guard{border:1px solid #fed7aa;background:#fff7ed;color:#9a3412;padding:12px;border-radius:6px;font-weight:650}
    .metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin:16px 0}
    .metric{background:#fff;border:1px solid #d9dee7;border-radius:6px;padding:12px}
    .metric span{display:block;color:#5f6b7a;font-size:12px}.metric strong{font-size:24px}
    table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #d9dee7}
    th,td{border-bottom:1px solid #d9dee7;padding:9px 10px;text-align:left;vertical-align:top;font-size:13px}
    th{background:#eef2f7;color:#344054}a{color:#1f6feb;text-decoration:none}a:hover{text-decoration:underline}
  </style>
</head>
<body><main>
  <h1>${htmlEscape(dossier.expert)}</h1>
  <div class="guard">${htmlEscape(dossier.guardrail)}</div>
  <section class="metrics">
    <div class="metric"><span>Host citations</span><strong>${dossier.source_coverage.host_citation_count}</strong></div>
    <div class="metric"><span>Recovery signals</span><strong>${dossier.source_coverage.local_recovery_signal_count}</strong></div>
    <div class="metric"><span>Observations</span><strong>${dossier.observations.length}</strong></div>
  </section>
  <h2>Tendency Signals</h2>
  <table><thead><tr><th>Type</th><th>Source lane</th><th>Topic</th><th>Timestamp</th><th>Use</th></tr></thead><tbody>${signalRows}</tbody></table>
  <h2>Ranked-List Observations</h2>
  <table><thead><tr><th>Subject</th><th>Team</th><th>Rank</th><th>Evidence</th></tr></thead><tbody>${obsRows}</tbody></table>
</main></body></html>
`;
}

const dossiers = buildDossiers();
const generatedAt = new Date().toISOString();
const index = {
  schema_version: 'expert_dossiers_index_v1',
  generated_at: generatedAt,
  status: 'local_context_profiles',
  guardrail: 'Expert dossiers are compact inference context only. They are not price evidence, official-pick authority, or production recommendation support.',
  source_files: {
    host_citations: fs.existsSync(HOST_CITATIONS_PATH) ? path.relative(ROOT, HOST_CITATIONS_PATH) : null,
    recovery_dir: fs.existsSync(RECOVERY_DIR) ? path.relative(ROOT, RECOVERY_DIR) : null
  },
  dossier_count: dossiers.length,
  dossiers: dossiers.map(dossier => ({
    expert: dossier.expert,
    slug: dossier.slug,
    source_coverage: dossier.source_coverage,
    path: `data/expert-dossiers/${dossier.slug}.json`
  }))
};

writeJson(path.join(OUT_DIR, 'latest.json'), index);
fs.mkdirSync(DOC_DIR, { recursive: true });
fs.writeFileSync(path.join(DOC_DIR, 'index.md'), renderIndexMarkdown(dossiers));
for (const dossier of dossiers) {
  writeJson(path.join(OUT_DIR, `${dossier.slug}.json`), dossier);
  fs.writeFileSync(path.join(DOC_DIR, `${dossier.slug}.md`), renderMarkdown(dossier));
  fs.writeFileSync(path.join(DOC_DIR, `${dossier.slug}.html`), renderHtml(dossier));
}

console.log(`Wrote expert dossier index: ${path.join(OUT_DIR, 'latest.json')}`);
console.log(`Wrote expert dossier docs: ${DOC_DIR}`);
console.log(`Expert dossier summary: dossiers=${dossiers.length} recovery_signals=${dossiers.reduce((sum, d) => sum + d.source_coverage.local_recovery_signal_count, 0)} observations=${dossiers.reduce((sum, d) => sum + d.observations.length, 0)}`);
