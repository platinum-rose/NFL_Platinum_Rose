#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CANDIDATES_PATH = path.join(ROOT, 'data', 'podcasts', 'youtube-discovery-candidates-2026.json');
const OBS_DIR = path.join(ROOT, 'data', 'shadow-harness', 'observations');
const RECOVERY_DIR = path.join(ROOT, 'data', 'shadow-harness', 'recovery');
const DOC_DIR = path.join(ROOT, 'docs', 'antigravity', 'recovery');

const QB_TEAM_MAP = {
  'Josh Allen': 'BUF',
  'Lamar Jackson': 'BAL',
  'Joe Burrow': 'CIN',
  'Patrick Mahomes': 'KC',
  'Matthew Stafford': 'LAR',
  'Drake Maye': 'NE',
  'Dak Prescott': 'DAL',
  'Jordan Love': 'GB',
  'Justin Herbert': 'LAC',
  'Caleb Williams': 'CHI',
  'Brock Purdy': 'SF',
  'Jalen Hurts': 'PHI',
  'Baker Mayfield': 'TB',
  'Trevor Lawrence': 'JAX',
  'Jared Goff': 'DET',
  'Sam Darnold': 'SEA'
};

function argValue(name, fallback = null) {
  const idx = process.argv.indexOf(name);
  return idx === -1 ? fallback : process.argv[idx + 1];
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

function mdCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();
}

function htmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function youtubeTimestamp(url, seconds) {
  if (!url || !Number.isFinite(seconds)) return url || '';
  return `${url}${url.includes('?') ? '&' : '?'}t=${Math.max(0, Math.round(seconds))}s`;
}

function parseRawResponse(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'string') return [raw];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(row => {
      if (typeof row !== 'string') return row;
      try {
        return JSON.parse(row);
      } catch {
        return { raw_text: row };
      }
    });
    return [parsed];
  } catch {
    return [{ raw_text: raw }];
  }
}

function normalizeNote(note, fallbackSegment = null) {
  const players = Array.isArray(note.players) ? note.players.filter(Boolean).map(String) : [];
  const teams = Array.isArray(note.teams) ? note.teams.filter(Boolean).map(String) : [];
  return {
    note_type: String(note.note_type || 'other'),
    teams,
    players,
    topic: String(note.topic || ''),
    summary: String(note.summary || ''),
    speaker: note.speaker || null,
    source_timestamp: Number(note.source_timestamp || note.timestamp || 0),
    quote: String(note.quote || ''),
    confidence: note.confidence || 'stated',
    recovery_source: fallbackSegment
  };
}

function noteKey(note) {
  return [
    (note.players || []).join(','),
    note.topic.toLowerCase().replace(/\s+/g, ' ').trim(),
    note.summary.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 120)
  ].join('|');
}

function playerFromNote(note) {
  for (const player of note.players || []) {
    if (QB_TEAM_MAP[player]) return player;
  }
  for (const player of Object.keys(QB_TEAM_MAP)) {
    const haystack = `${note.topic} ${note.summary} ${note.quote}`;
    if (new RegExp(`\\b${player.replace(/\s+/g, '\\s+')}\\b`, 'i').test(haystack)) return player;
  }
  return null;
}

function parseRankedPlayers(note) {
  const text = `${note.topic}. ${note.summary}`;
  if (!/\b(top\s*10|ranked list|rankings)\b/i.test(text)) return [];
  const matches = [...text.matchAll(/(?:^|[\s,:])(\d{1,2})\.\s*([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){0,3})(?=,|\s+\d{1,2}\.|\.|$)/g)];
  const seenRanks = new Set();
  return matches
    .map(match => ({
      rank: Number(match[1]),
      player: match[2].trim().replace(/[.;:]+$/g, '').replace(/\s+/g, ' ')
    }))
    .filter(row => row.rank >= 1 && row.rank <= 32 && QB_TEAM_MAP[row.player])
    .filter(row => {
      if (seenRanks.has(row.rank)) return false;
      seenRanks.add(row.rank);
      return true;
    })
    .sort((a, b) => a.rank - b.rank);
}

function extractExpertRankedLists(notes, candidate) {
  const rankedLists = [];
  for (const note of notes) {
    const rankedPlayers = parseRankedPlayers(note);
    if (rankedPlayers.length < 5) continue;
    rankedLists.push({
      speaker: note.speaker || 'Unknown',
      topic: note.topic,
      source_timestamp: note.source_timestamp,
      timestamp_url: youtubeTimestamp(candidate.url, note.source_timestamp),
      recovery_source: note.recovery_source,
      summary: note.summary,
      ranks: rankedPlayers.map(row => ({
        ...row,
        team: QB_TEAM_MAP[row.player]
      }))
    });
  }
  return rankedLists;
}

function flattenObservationPayload(observation) {
  const run = observation.run || {};
  const rawPayloads = parseRawResponse(run.raw_model_response);
  const segmentRows = [];
  const notes = [];
  const picks = [];

  rawPayloads.forEach((payload, index) => {
    const coverage = payload.coverage_check || {};
    const segmentLabel = coverage.segment_start_seconds != null
      ? `segment_${index + 1}_${coverage.segment_start_seconds}_${coverage.segment_end_seconds}`
      : `payload_${index + 1}`;
    const speakerSegments = payload.speaker_segments || [];
    const firstText = speakerSegments[0]?.text || '';
    const semanticIssue = index > 0 && /welcome to sharp or square|presented by hard rock bet/i.test(firstText)
      ? 'possible_repeated_intro'
      : null;

    segmentRows.push({
      index: index + 1,
      segment_start_seconds: coverage.segment_start_seconds ?? null,
      segment_end_seconds: coverage.segment_end_seconds ?? null,
      last_analyzed_timestamp: coverage.last_analyzed_timestamp ?? null,
      reached_end_of_video: coverage.reached_end_of_video ?? null,
      speaker_segment_count: speakerSegments.length,
      extracted_pick_count: (payload.extracted_picks || []).length,
      analysis_note_count: (payload.analysis_notes || []).length,
      semantic_issue: semanticIssue,
      first_text_preview: firstText.slice(0, 160)
    });

    for (const note of payload.analysis_notes || []) notes.push(normalizeNote(note, segmentLabel));
    for (const pick of payload.extracted_picks || []) picks.push({ ...pick, recovery_source: segmentLabel });
  });

  if (rawPayloads.length === 0) {
    for (const note of run.analysis_notes || []) notes.push(normalizeNote(note, 'observation_run'));
    for (const pick of run.extracted_picks || []) picks.push({ ...pick, recovery_source: 'observation_run' });
  }

  return { segmentRows, notes, picks };
}

function buildRecovery(candidate, observation) {
  const { segmentRows, notes, picks } = flattenObservationPayload(observation);
  const byKey = new Map();
  for (const note of notes) {
    const key = noteKey(note);
    if (!byKey.has(key)) byKey.set(key, note);
  }
  const dedupedNotes = [...byKey.values()];
  const qbNotes = dedupedNotes
    .map(note => ({ ...note, primary_player: playerFromNote(note) }))
    .filter(note => note.primary_player)
    .sort((a, b) => (a.source_timestamp || 0) - (b.source_timestamp || 0));

  const playersCovered = [...new Set(qbNotes.map(note => note.primary_player))];
  const segmentIssues = segmentRows.filter(row => row.semantic_issue);
  const explicitPicks = picks.filter(pick => pick.market || pick.rationale);
  const expertRankedLists = extractExpertRankedLists(dedupedNotes, candidate);

  return {
    generated_at: new Date().toISOString(),
    status: 'local_recovery_context_only',
    guardrail: 'Local recovery uses saved Gemini artifacts only. It is not a clean transcript, not a usable Gemini extraction, not a production recommendation, and not an official pick source.',
    episode: {
      id: candidate.id,
      title: candidate.title,
      show: candidate.show,
      url: candidate.url,
      date: candidate.date || null
    },
    source_observation: {
      reprocess_required: observation.reprocess_required === true,
      reprocess_reason: observation.reprocess_reason || null,
      quality_flags: observation.quality_flags || [],
      estimated_cost_usd: observation.run?.estimated_cost_usd ?? null
    },
    recovery_summary: {
      segment_payloads_seen: segmentRows.length,
      segment_payloads_with_semantic_issues: segmentIssues.length,
      raw_analysis_notes_seen: notes.length,
      deduped_analysis_notes: dedupedNotes.length,
      qb_notes_recovered: qbNotes.length,
      qb_subjects_covered: playersCovered.length,
      expert_ranked_lists_recovered: expertRankedLists.length,
      explicit_pick_like_items_seen: explicitPicks.length,
      usable_for_frontier_synthesis: false
    },
    segment_audit: segmentRows,
    expert_ranked_lists: expertRankedLists,
    qb_subjects_covered: playersCovered.map(player => ({ player, team: QB_TEAM_MAP[player] })),
    recovered_qb_notes: qbNotes.map(note => ({
      player: note.primary_player,
      team: QB_TEAM_MAP[note.primary_player],
      note_type: note.note_type,
      topic: note.topic,
      summary: note.summary,
      speaker: note.speaker,
      source_timestamp: note.source_timestamp,
      timestamp_url: youtubeTimestamp(candidate.url, note.source_timestamp),
      quote: note.quote,
      confidence: note.confidence,
      recovery_source: note.recovery_source
    })),
    explicit_pick_like_items: explicitPicks
  };
}

function renderMarkdown(recovery) {
  const lines = [
    `# Local YouTube Recovery: ${recovery.episode.title}`,
    '',
    `Generated: ${recovery.generated_at}`,
    '',
    '> Context only. This recovery uses saved local Gemini artifacts from a failed/reprocess-required extraction. Do not treat it as a clean transcript, official pick source, or production recommendation.',
    '',
    '## Episode',
    '',
    `- ID: ${recovery.episode.id}`,
    `- Show: ${recovery.episode.show}`,
    `- URL: ${recovery.episode.url}`,
    `- Observation reprocess required: ${recovery.source_observation.reprocess_required}`,
    `- Reprocess reason: ${recovery.source_observation.reprocess_reason || ''}`,
    '',
    '## Recovery Summary',
    '',
    `- Segment payloads seen: ${recovery.recovery_summary.segment_payloads_seen}`,
    `- Segment payloads with semantic issues: ${recovery.recovery_summary.segment_payloads_with_semantic_issues}`,
    `- Raw analysis notes seen: ${recovery.recovery_summary.raw_analysis_notes_seen}`,
    `- Deduped analysis notes: ${recovery.recovery_summary.deduped_analysis_notes}`,
    `- QB notes recovered: ${recovery.recovery_summary.qb_notes_recovered}`,
    `- QB subjects covered: ${recovery.recovery_summary.qb_subjects_covered}`,
    `- Expert ranked lists recovered: ${recovery.recovery_summary.expert_ranked_lists_recovered}`,
    `- Usable for frontier synthesis: ${recovery.recovery_summary.usable_for_frontier_synthesis}`,
    '',
    '## Expert Ranked Lists',
    '',
    ...recovery.expert_ranked_lists.flatMap(list => [
      `### ${list.speaker}: ${list.topic}`,
      '',
      `- Timestamp: [${list.source_timestamp}s](${list.timestamp_url})`,
      `- Recovery source: ${list.recovery_source}`,
      '',
      '| Rank | Player | Team |',
      '|---:|---|---|',
      ...list.ranks.map(row => `| ${row.rank} | ${mdCell(row.player)} | ${row.team} |`),
      ''
    ]),
    '## QB Subjects Covered',
    '',
    '| Player | Team |',
    '|---|---|',
    ...recovery.qb_subjects_covered.map(row => `| ${mdCell(row.player)} | ${row.team} |`),
    '',
    '## Recovered QB Notes',
    '',
    '| Player | Team | Topic | Speaker | Timestamp | Source | Summary |',
    '|---|---|---|---|---:|---|---|',
    ...recovery.recovered_qb_notes.map(note => `| ${mdCell(note.player)} | ${note.team} | ${mdCell(note.topic)} | ${mdCell(note.speaker || '')} | [${note.source_timestamp}s](${note.timestamp_url}) | ${mdCell(note.recovery_source)} | ${mdCell(note.summary)} |`),
    '',
    '## Segment Audit',
    '',
    '| Segment | Window | Last Analyzed | Notes | Picks | Issue | Preview |',
    '|---:|---|---:|---:|---:|---|---|',
    ...recovery.segment_audit.map(row => `| ${row.index} | ${row.segment_start_seconds ?? ''}-${row.segment_end_seconds ?? ''} | ${row.last_analyzed_timestamp ?? ''} | ${row.analysis_note_count} | ${row.extracted_pick_count} | ${mdCell(row.semantic_issue || '')} | ${mdCell(row.first_text_preview)} |`)
  ];
  return `${lines.join('\n')}\n`;
}

function renderHtml(recovery) {
  const summary = recovery.recovery_summary;
  const issueClass = summary.segment_payloads_with_semantic_issues > 0 ? 'warn' : 'ok';
  const noteCards = recovery.recovered_qb_notes.map(note => `
    <article class="note-card">
      <div class="note-head">
        <span class="team">${htmlEscape(note.team)}</span>
        <strong>${htmlEscape(note.player)}</strong>
        <a href="${htmlEscape(note.timestamp_url)}" target="_blank" rel="noreferrer">${htmlEscape(note.source_timestamp)}s</a>
      </div>
      <div class="topic">${htmlEscape(note.topic)}</div>
      <p>${htmlEscape(note.summary)}</p>
      ${note.quote ? `<blockquote>${htmlEscape(note.quote)}</blockquote>` : ''}
      <div class="meta">${htmlEscape(note.speaker || 'unknown speaker')} · ${htmlEscape(note.recovery_source)} · ${htmlEscape(note.confidence)}</div>
    </article>
  `).join('\n');
  const rankedListCards = recovery.expert_ranked_lists.map(list => `
    <article class="rank-card">
      <div class="rank-head">
        <strong>${htmlEscape(list.speaker)}</strong>
        <span>${htmlEscape(list.topic)}</span>
        <a href="${htmlEscape(list.timestamp_url)}" target="_blank" rel="noreferrer">${htmlEscape(list.source_timestamp)}s</a>
      </div>
      <ol>
        ${list.ranks.map(row => `<li><span>${htmlEscape(row.player)}</span><em>${htmlEscape(row.team)}</em></li>`).join('\n')}
      </ol>
      <div class="meta">${htmlEscape(list.recovery_source)}</div>
    </article>
  `).join('\n');
  const subjectRows = recovery.qb_subjects_covered.map(row => `
    <tr><td>${htmlEscape(row.player)}</td><td>${htmlEscape(row.team)}</td></tr>
  `).join('\n');
  const segmentRows = recovery.segment_audit.map(row => `
    <tr class="${row.semantic_issue ? 'issue' : ''}">
      <td>${row.index}</td>
      <td>${htmlEscape(`${row.segment_start_seconds ?? ''}-${row.segment_end_seconds ?? ''}`)}</td>
      <td>${htmlEscape(row.last_analyzed_timestamp ?? '')}</td>
      <td>${htmlEscape(row.analysis_note_count)}</td>
      <td>${htmlEscape(row.extracted_pick_count)}</td>
      <td>${htmlEscape(row.semantic_issue || '')}</td>
      <td>${htmlEscape(row.first_text_preview)}</td>
    </tr>
  `).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Local Recovery Review - ${htmlEscape(recovery.episode.id)}</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --panel: #ffffff;
      --ink: #172033;
      --muted: #5f6b7a;
      --line: #d9dee7;
      --accent: #1f6feb;
      --warn: #9a3412;
      --warn-bg: #fff7ed;
      --ok: #166534;
      --ok-bg: #f0fdf4;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.45;
    }
    main { max-width: 1180px; margin: 0 auto; padding: 28px; }
    header {
      display: grid;
      gap: 12px;
      padding-bottom: 18px;
      border-bottom: 1px solid var(--line);
    }
    h1 { font-size: 28px; margin: 0; letter-spacing: 0; }
    h2 { font-size: 18px; margin: 28px 0 12px; letter-spacing: 0; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .guardrail {
      border: 1px solid #fed7aa;
      background: var(--warn-bg);
      color: var(--warn);
      padding: 12px;
      border-radius: 6px;
      font-weight: 650;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 10px;
      margin-top: 14px;
    }
    .metric {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 12px;
    }
    .metric span { display: block; color: var(--muted); font-size: 12px; }
    .metric strong { font-size: 24px; }
    .metric.warn { background: var(--warn-bg); border-color: #fed7aa; color: var(--warn); }
    .metric.ok { background: var(--ok-bg); border-color: #bbf7d0; color: var(--ok); }
    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 6px;
      overflow: hidden;
    }
    th, td {
      border-bottom: 1px solid var(--line);
      padding: 9px 10px;
      text-align: left;
      vertical-align: top;
      font-size: 13px;
    }
    th { background: #eef2f7; color: #344054; }
    tr.issue td { background: var(--warn-bg); }
    .notes {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 12px;
    }
    .rank-lists {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 12px;
    }
    .rank-card {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 14px;
    }
    .rank-head {
      display: grid;
      gap: 3px;
      margin-bottom: 10px;
    }
    .rank-head span { color: #344054; font-size: 13px; }
    .rank-card ol {
      margin: 0;
      padding-left: 24px;
    }
    .rank-card li {
      padding: 4px 0;
    }
    .rank-card li em {
      color: var(--muted);
      font-style: normal;
      margin-left: 6px;
      font-size: 12px;
    }
    .note-card {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 14px;
    }
    .note-head {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 6px;
    }
    .team {
      display: inline-flex;
      min-width: 38px;
      justify-content: center;
      border: 1px solid var(--line);
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 12px;
      font-weight: 750;
      background: #f8fafc;
    }
    .topic { color: #344054; font-weight: 650; }
    .note-card p { margin: 8px 0; }
    blockquote {
      margin: 10px 0;
      padding: 8px 10px;
      border-left: 3px solid var(--accent);
      background: #f8fafc;
      color: #344054;
    }
    .meta { color: var(--muted); font-size: 12px; }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>${htmlEscape(recovery.episode.title)}</h1>
      <div><strong>${htmlEscape(recovery.episode.show)}</strong> · <a href="${htmlEscape(recovery.episode.url)}" target="_blank" rel="noreferrer">${htmlEscape(recovery.episode.id)}</a></div>
      <div class="guardrail">${htmlEscape(recovery.guardrail)}</div>
      <div>Reprocess reason: ${htmlEscape(recovery.source_observation.reprocess_reason || '')}</div>
    </header>

    <section class="summary">
      <div class="metric"><span>QB subjects</span><strong>${summary.qb_subjects_covered}</strong></div>
      <div class="metric"><span>QB notes</span><strong>${summary.qb_notes_recovered}</strong></div>
      <div class="metric"><span>Expert lists</span><strong>${summary.expert_ranked_lists_recovered}</strong></div>
      <div class="metric ${issueClass}"><span>Segment issues</span><strong>${summary.segment_payloads_with_semantic_issues}</strong></div>
      <div class="metric warn"><span>Usable for synthesis</span><strong>${summary.usable_for_frontier_synthesis}</strong></div>
    </section>

    <h2>Expert Ranked Lists</h2>
    <section class="rank-lists">${rankedListCards}</section>

    <h2>QB Subjects Covered</h2>
    <table>
      <thead><tr><th>Player</th><th>Team</th></tr></thead>
      <tbody>${subjectRows}</tbody>
    </table>

    <h2>Recovered QB Notes</h2>
    <section class="notes">${noteCards}</section>

    <h2>Segment Audit</h2>
    <table>
      <thead><tr><th>Segment</th><th>Window</th><th>Last</th><th>Notes</th><th>Picks</th><th>Issue</th><th>Preview</th></tr></thead>
      <tbody>${segmentRows}</tbody>
    </table>
  </main>
</body>
</html>
`;
}

const onlyId = argValue('--only-id');
if (!onlyId) {
  throw new Error('Usage: npm.cmd run youtube:recover-local -- --only-id youtube-VIDEO_ID');
}

const normalizedId = onlyId.startsWith('youtube-') ? onlyId : `youtube-${onlyId}`;
const candidates = readJson(CANDIDATES_PATH).episodes || [];
const candidate = candidates.find(row => row.id === normalizedId);
if (!candidate) throw new Error(`No saved YouTube candidate found for ${normalizedId}`);

const obsPath = path.join(OBS_DIR, `${normalizedId}-shadow-youtube.json`);
if (!fs.existsSync(obsPath)) throw new Error(`No saved observation found for ${normalizedId}: ${obsPath}`);

const observation = readJson(obsPath);
const recovery = buildRecovery(candidate, observation);

const jsonOut = path.join(RECOVERY_DIR, `${normalizedId}-local-recovery.json`);
const mdOut = path.join(DOC_DIR, `${normalizedId}-local-recovery.md`);
const htmlOut = path.join(DOC_DIR, `${normalizedId}-local-recovery.html`);
writeJson(jsonOut, recovery);
fs.mkdirSync(path.dirname(mdOut), { recursive: true });
fs.writeFileSync(mdOut, renderMarkdown(recovery));
fs.writeFileSync(htmlOut, renderHtml(recovery));

console.log(`Wrote local recovery JSON: ${jsonOut}`);
console.log(`Wrote local recovery Markdown: ${mdOut}`);
console.log(`Wrote local recovery HTML: ${htmlOut}`);
console.log(`Recovery summary: qb_subjects=${recovery.recovery_summary.qb_subjects_covered} qb_notes=${recovery.recovery_summary.qb_notes_recovered} segment_issues=${recovery.recovery_summary.segment_payloads_with_semantic_issues} usable_for_frontier=${recovery.recovery_summary.usable_for_frontier_synthesis}`);
