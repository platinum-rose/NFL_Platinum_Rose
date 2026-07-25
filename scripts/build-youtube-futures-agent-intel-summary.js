#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const QUEUE_PATH = path.join(ROOT, 'data', 'shadow-harness', 'review', 'youtube-futures-local-intel-queue.json');
const OUT_JSON = path.join(ROOT, 'data', 'shadow-harness', 'review', 'youtube-futures-agent-intel-summary.json');
const OUT_MD = path.join(ROOT, 'docs', 'antigravity', 'youtube-futures-agent-intel-summary.md');
// Public copy so the browser-side FUTURES/BETTING agent tools can fetch it
// via LOCAL_DATA.YOUTUBE_FUTURES_INTEL (src/lib/apiConfig.js) — same pattern
// as public/schedule.json. Read-only research context; never written to
// Supabase and never treated as a production recommendation.
const OUT_PUBLIC = path.join(ROOT, 'public', 'youtube-futures-agent-intel-summary.json');

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

function groupBy(items, keyFn) {
  const groups = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

function sortItems(items) {
  return [...items].sort((a, b) => (
    String(a.team).localeCompare(String(b.team))
    || String(a.market).localeCompare(String(b.market))
    || String(a.source?.episode_title || '').localeCompare(String(b.source?.episode_title || ''))
    || Number(a.source?.source_timestamp || 0) - Number(b.source?.source_timestamp || 0)
  ));
}

function compactItem(item) {
  return {
    item_id: item.item_id,
    lane: item.item_lane,
    team: item.team,
    market: item.market,
    side: item.side,
    line: item.line,
    price: item.price,
    speaker: item.speaker,
    rationale: item.rationale,
    supporting_quote: item.supporting_quote || '',
    review_flags: item.review_flags || [],
    reviewer_notes: item.reviewer_notes || '',
    source: {
      episode_id: item.source?.episode_id,
      episode_title: item.source?.episode_title,
      show: item.source?.show,
      timestamp_url: item.source?.timestamp_url,
      source_timestamp: item.source?.source_timestamp
    }
  };
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || 'unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

if (!fs.existsSync(QUEUE_PATH)) {
  throw new Error(`Missing local intel queue. Run npm.cmd run youtube:export-local-intel first: ${QUEUE_PATH}`);
}

const queue = readJson(QUEUE_PATH);
const items = sortItems(queue.items || []);
const badLions = items.filter(item => (
  item.team === 'DET'
  && item.market === 'division_winner'
  && Number(item.price) === 1500
));
if (badLions.length > 0) {
  throw new Error('Rejected DET division_winner +1500 leaked into local agent summary.');
}

const byTeam = [...groupBy(items, item => item.team).entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([team, teamItems]) => ({
    team,
    count: teamItems.length,
    lanes: countBy(teamItems, 'item_lane'),
    markets: [...groupBy(teamItems, item => item.market).entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([market, marketItems]) => ({
        market,
        count: marketItems.length,
        items: sortItems(marketItems).map(compactItem)
      }))
  }));

const byMarket = [...groupBy(items, item => item.market).entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([market, marketItems]) => ({
    market,
    count: marketItems.length,
    teams: [...new Set(marketItems.map(item => item.team))].sort()
  }));

const summary = {
  generated_at: new Date().toISOString(),
  status: 'local_agent_intel_summary_only',
  guardrail: 'Reviewed local podcast intel for agent context only. This is not an official pick ledger, production recommendation, Supabase write, or parlay mutation.',
  source_queue: path.relative(ROOT, QUEUE_PATH),
  exported_items: items.length,
  counts: {
    by_lane: countBy(items, 'item_lane'),
    by_team: countBy(items, 'team'),
    by_market: countBy(items, 'market')
  },
  rejected_leak_checks: {
    det_division_winner_plus_1500: badLions.length
  },
  by_team: byTeam,
  by_market: byMarket,
  items: items.map(compactItem)
};

writeJson(OUT_JSON, summary);
writeJson(OUT_PUBLIC, summary);

const lines = [
  '# YouTube Futures Agent Intel Summary',
  '',
  `Generated: ${summary.generated_at}`,
  '',
  '> Reviewed local podcast intel for agent context only. This does not create official picks, production recommendations, Supabase writes, or parlay changes.',
  '',
  '## Summary',
  '',
  `- Exported local intel items: ${summary.exported_items}`,
  `- Source queue: ${summary.source_queue}`,
  `- Rejected DET division_winner +1500 leak check: ${summary.rejected_leak_checks.det_division_winner_plus_1500}`,
  '',
  '## Lane Counts',
  '',
  '| Lane | Count |',
  '|---|---:|',
  ...Object.entries(summary.counts.by_lane).sort(([a], [b]) => a.localeCompare(b)).map(([lane, count]) => `| ${lane} | ${count} |`),
  '',
  '## Market Counts',
  '',
  '| Market | Count | Teams |',
  '|---|---:|---|',
  ...byMarket.map(row => `| ${row.market} | ${row.count} | ${row.teams.join(', ')} |`),
  '',
  '## Team Intel',
  ''
];

for (const teamGroup of byTeam) {
  lines.push(`### ${teamGroup.team}`, '');
  for (const marketGroup of teamGroup.markets) {
    lines.push(`#### ${marketGroup.market}`, '');
    lines.push('| Lane | Side | Line | Price | Source | Flags | Quote | Rationale |');
    lines.push('|---|---|---:|---:|---|---|---|---|');
    for (const item of marketGroup.items) {
      lines.push(`| ${item.lane} | ${item.side} | ${item.line ?? ''} | ${priceText(item.price)} | [${mdCell(item.source.episode_title)}](${item.source.timestamp_url}) | ${(item.review_flags || []).join(', ')} | ${mdCell(item.supporting_quote)} | ${mdCell(item.rationale)} |`);
    }
    lines.push('');
  }
}

fs.mkdirSync(path.dirname(OUT_MD), { recursive: true });
fs.writeFileSync(OUT_MD, `${lines.join('\n')}\n`);

console.log(`Wrote YouTube futures agent intel JSON: ${OUT_JSON}`);
console.log(`Wrote YouTube futures agent intel public copy: ${OUT_PUBLIC}`);
console.log(`Wrote YouTube futures agent intel Markdown: ${OUT_MD}`);
console.log(`Agent summary: items=${summary.exported_items} det_bad_leaks=${summary.rejected_leak_checks.det_division_winner_plus_1500}`);
