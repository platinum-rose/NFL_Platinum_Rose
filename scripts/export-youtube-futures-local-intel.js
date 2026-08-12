#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  assertYoutubeCohortClean,
  buildYoutubeCohort,
  isForbiddenYoutubeEpisode,
  PROMOTED_LOCAL_INTEL_STATUS,
} from './lib/youtube-futures-cohort.js';

const ROOT = process.cwd();
const DEFAULT_REPORT_PATH = path.join(ROOT, 'data', 'shadow-harness', 'reports', 'youtube-futures-intel-review-latest.json');
const DEFAULT_STATUS_PATH = path.join(ROOT, 'data', 'shadow-harness', 'review', 'youtube-futures-intel-review-status.json');
const DEFAULT_QUEUE_PATH = path.join(ROOT, 'data', 'shadow-harness', 'review', 'youtube-futures-local-intel-queue.json');
const DEFAULT_MD_PATH = path.join(ROOT, 'docs', 'antigravity', 'youtube-futures-local-intel-queue.md');

function argValue(name, fallback) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && idx + 1 < process.argv.length ? process.argv[idx + 1] : fallback;
}

const reportPath = path.resolve(ROOT, argValue('--report-file', DEFAULT_REPORT_PATH));
const statusPath = path.resolve(ROOT, argValue('--status-file', DEFAULT_STATUS_PATH));
const outPath = path.resolve(ROOT, argValue('--out', DEFAULT_QUEUE_PATH));
const mdPath = path.resolve(ROOT, argValue('--markdown-out', DEFAULT_MD_PATH));
const generatedAt = argValue('--generated-at', new Date().toISOString());

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function mdCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();
}

function priceText(price) {
  if (price == null || Number.isNaN(Number(price))) return '';
  const n = Number(price);
  return n > 0 ? `+${n}` : String(n);
}

function groupCount(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || 'unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

if (!fs.existsSync(reportPath)) throw new Error(`Missing review report: ${reportPath}`);
if (!fs.existsSync(statusPath)) throw new Error(`Missing review status ledger: ${statusPath}`);

const report = readJson(reportPath);
const statusLedger = readJson(statusPath);
const picksById = new Map((report.picks || []).map(item => [item.item_id, item]));
const notesById = new Map((report.notes || []).map(item => [item.item_id, item]));
const promotedStatuses = (statusLedger.items || []).filter(item => item.status === PROMOTED_LOCAL_INTEL_STATUS);
const promotedPickStatuses = promotedStatuses.filter(item => (item.item_type || 'pick') === 'pick');
const promotedNoteStatuses = promotedStatuses.filter(item => item.item_type === 'note');

const exportedItems = promotedPickStatuses.map(status => {
  const pick = picksById.get(status.item_id);
  if (!pick) {
    return {
      item_id: status.item_id,
      export_error: 'status_item_missing_from_review_report',
      reviewer_notes: status.reviewer_notes || ''
    };
  }

  return {
    item_id: pick.item_id,
    item_lane: pick.item_lane,
    team: pick.team,
    market: pick.market,
    side: pick.side,
    line: pick.line,
    price: pick.price,
    week: pick.week ?? null,
    speaker: pick.speaker || null,
    rationale: pick.rationale || '',
    supporting_quote: pick.supporting_quote || '',
    review_flags: pick.review_flags || [],
    human_verification: pick.human_verification || null,
    disputed: pick.disputed || null,
    reviewer_notes: status.reviewer_notes || '',
    source: {
      episode_id: pick.episode_id,
      episode_title: pick.episode_title,
      show: pick.show,
      video_url: pick.video_url,
      source_timestamp: pick.source_timestamp,
      timestamp_url: pick.timestamp_url
    }
  };
});

const exportedNotes = promotedNoteStatuses.map(status => {
  const note = notesById.get(status.item_id);
  if (!note) {
    return {
      item_id: status.item_id,
      export_error: 'status_item_missing_from_review_report',
      reviewer_notes: status.reviewer_notes || ''
    };
  }

  return {
    item_id: note.item_id,
    relevance_tags: note.relevance_tags || [],
    note_type: note.note_type,
    teams: note.teams || [],
    players: note.players || [],
    topic: note.topic || '',
    summary: note.summary || '',
    speaker: note.speaker || null,
    confidence: note.confidence || 'stated',
    quote: note.quote || '',
    review_flags: note.review_flags || [],
    reviewer_notes: status.reviewer_notes || '',
    source: {
      episode_id: note.episode_id,
      episode_title: note.episode_title,
      show: note.show,
      video_url: note.video_url,
      source_timestamp: note.source_timestamp,
      timestamp_url: note.timestamp_url
    }
  };
});

const missingReportItems = [...exportedItems, ...exportedNotes].filter(item => item.export_error);
const cleanItems = exportedItems.filter(item => !item.export_error && !isForbiddenYoutubeEpisode(item));
const cleanNotes = exportedNotes.filter(item => !item.export_error && !isForbiddenYoutubeEpisode(item));
assertYoutubeCohortClean(cleanItems, cleanNotes, 'YouTube local intel queue');
const cohort = buildYoutubeCohort({ items: cleanItems, notes: cleanNotes, includeForbiddenEpisodeIds: false });

function groupCountMulti(items, key) {
  return items.reduce((acc, item) => {
    for (const value of (item[key] || [])) acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

const payload = {
  schema: 'youtube_futures_local_intel_queue_v1',
  generated_at: generatedAt,
  status: 'local_intel_queue_only',
  guardrail: 'Local reviewed intel queue only. This is not an official pick ledger, production recommendation, Supabase write, or parlay mutation.',
  source_report: path.relative(ROOT, reportPath),
  source_status_ledger: path.relative(ROOT, statusPath),
  promoted_status: PROMOTED_LOCAL_INTEL_STATUS,
  cohort,
  inputs: {
    review_report: path.relative(ROOT, reportPath),
    review_report_generated_at: report.generated_at || null,
    status_ledger: path.relative(ROOT, statusPath),
    status_ledger_generated_at: statusLedger.generated_at || null,
  },
  validation_results: {
    cohort_status: cohort.forbidden_episode_evidence_absent === true ? 'pass' : 'blocked',
    missing_report_item_count: missingReportItems.length,
  },
  total_status_items: (statusLedger.items || []).length,
  exported_items: cleanItems.length,
  exported_notes: cleanNotes.length,
  skipped_items: (statusLedger.items || []).length - promotedStatuses.length,
  missing_report_items: missingReportItems,
  grouped_counts: {
    by_lane: groupCount(cleanItems, 'item_lane'),
    by_team: groupCount(cleanItems, 'team'),
    by_market: groupCount(cleanItems, 'market')
  },
  note_grouped_counts: {
    by_relevance_tag: groupCountMulti(cleanNotes, 'relevance_tags')
  },
  items: cleanItems,
  notes: cleanNotes
};

writeJson(outPath, payload);

const lines = [
  '# YouTube Futures Local Intel Queue',
  '',
  `Generated: ${payload.generated_at}`,
  '',
  '> Local reviewed intel only. This does not create official picks, production recommendations, Supabase writes, or parlay changes.',
  '',
  '## Summary',
  '',
  `- Exported items: ${payload.exported_items}`,
  `- Exported notes: ${payload.exported_notes}`,
  `- Cohort fingerprint: ${payload.cohort.fingerprint_sha256}`,
  `- Skipped review items: ${payload.skipped_items}`,
  `- Missing report items: ${payload.missing_report_items.length}`,
  `- Source status: ${path.relative(ROOT, statusPath)}`,
  `- Source report: ${path.relative(ROOT, reportPath)}`,
  '',
  '## Exported Intel',
  '',
  '| Lane | Team | Market | Side | Line | Price | Week | Episode | Time | Notes | Quote | Rationale |',
  '|---|---|---|---|---:|---:|---:|---|---|---|---|---|',
  ...cleanItems.map(item => `| ${item.item_lane} | ${item.team} | ${item.market} | ${item.side} | ${item.line ?? ''} | ${priceText(item.price)} | ${item.week ?? ''} | ${mdCell(item.source.episode_title)} | [${item.source.source_timestamp}s](${item.source.timestamp_url}) | ${mdCell(item.reviewer_notes)} | ${mdCell(item.supporting_quote)} | ${mdCell(item.rationale)} |`),
  '',
  '## Exported Analysis Notes',
  '',
  cleanNotes.length > 0
    ? '| Tags | Note Type | Teams | Players | Episode | Time | Confidence | Notes | Summary | Quote |'
    : '_No analysis notes promoted yet._',
  ...(cleanNotes.length > 0 ? [
    '|---|---|---|---|---|---|---|---|---|---|',
    ...cleanNotes.map(note => `| ${(note.relevance_tags || []).join(', ')} | ${note.note_type} | ${mdCell((note.teams || []).join(', '))} | ${mdCell((note.players || []).join(', '))} | ${mdCell(note.source.episode_title)} | [${note.source.source_timestamp}s](${note.source.timestamp_url}) | ${note.confidence} | ${mdCell(note.reviewer_notes)} | ${mdCell(note.summary)} | ${mdCell(note.quote)} |`)
  ] : [])
];

fs.mkdirSync(path.dirname(mdPath), { recursive: true });
fs.writeFileSync(mdPath, `${lines.join('\n')}\n`);

console.log(`Wrote local intel queue JSON: ${outPath}`);
console.log(`Wrote local intel queue Markdown: ${mdPath}`);
console.log(`Exported ${payload.exported_items} promoted item(s), ${payload.exported_notes} promoted note(s); skipped ${payload.skipped_items}.`);
if (missingReportItems.length > 0) {
  console.log(`Missing report items: ${missingReportItems.length}`);
}
