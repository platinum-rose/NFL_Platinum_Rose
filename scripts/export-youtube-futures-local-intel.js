#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

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
const promotedStatuses = (statusLedger.items || []).filter(item => item.status === 'promote_to_local_intel');

const exportedItems = promotedStatuses.map(status => {
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
    speaker: pick.speaker || null,
    rationale: pick.rationale || '',
    supporting_quote: pick.supporting_quote || '',
    review_flags: pick.review_flags || [],
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

const missingReportItems = exportedItems.filter(item => item.export_error);
const cleanItems = exportedItems.filter(item => !item.export_error);

const payload = {
  generated_at: new Date().toISOString(),
  status: 'local_intel_queue_only',
  guardrail: 'Local reviewed intel queue only. This is not an official pick ledger, production recommendation, Supabase write, or parlay mutation.',
  source_report: path.relative(ROOT, reportPath),
  source_status_ledger: path.relative(ROOT, statusPath),
  promoted_status: 'promote_to_local_intel',
  total_status_items: (statusLedger.items || []).length,
  exported_items: cleanItems.length,
  skipped_items: (statusLedger.items || []).length - promotedStatuses.length,
  missing_report_items: missingReportItems,
  grouped_counts: {
    by_lane: groupCount(cleanItems, 'item_lane'),
    by_team: groupCount(cleanItems, 'team'),
    by_market: groupCount(cleanItems, 'market')
  },
  items: cleanItems
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
  `- Skipped review items: ${payload.skipped_items}`,
  `- Missing report items: ${payload.missing_report_items.length}`,
  `- Source status: ${path.relative(ROOT, statusPath)}`,
  `- Source report: ${path.relative(ROOT, reportPath)}`,
  '',
  '## Exported Intel',
  '',
  '| Lane | Team | Market | Side | Line | Price | Episode | Time | Notes | Quote | Rationale |',
  '|---|---|---|---|---:|---:|---|---|---|---|---|',
  ...cleanItems.map(item => `| ${item.item_lane} | ${item.team} | ${item.market} | ${item.side} | ${item.line ?? ''} | ${priceText(item.price)} | ${mdCell(item.source.episode_title)} | [${item.source.source_timestamp}s](${item.source.timestamp_url}) | ${mdCell(item.reviewer_notes)} | ${mdCell(item.supporting_quote)} | ${mdCell(item.rationale)} |`)
];

fs.mkdirSync(path.dirname(mdPath), { recursive: true });
fs.writeFileSync(mdPath, `${lines.join('\n')}\n`);

console.log(`Wrote local intel queue JSON: ${outPath}`);
console.log(`Wrote local intel queue Markdown: ${mdPath}`);
console.log(`Exported ${payload.exported_items} promoted item(s); skipped ${payload.skipped_items}.`);
if (missingReportItems.length > 0) {
  console.log(`Missing report items: ${missingReportItems.length}`);
}
