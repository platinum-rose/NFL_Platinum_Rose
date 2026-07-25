#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CANDIDATES_PATH = path.join(ROOT, 'data', 'podcasts', 'youtube-discovery-candidates-2026.json');
const OBS_DIR = path.join(ROOT, 'data', 'shadow-harness', 'observations');
const REPORT_DIR = path.join(ROOT, 'data', 'shadow-harness', 'reports');
const REVIEW_DIR = path.join(ROOT, 'data', 'shadow-harness', 'review');
const REVIEW_STATUS_PATH = path.join(REVIEW_DIR, 'youtube-futures-intel-review-status.json');
const DOC_DIR = path.join(ROOT, 'docs', 'antigravity');

const TEAM_FIXUPS = { JAC: 'JAX', LOS: 'LAC' };
const VALID_TEAMS = new Set([
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET', 'GB',
  'HOU', 'IND', 'JAX', 'KC', 'LV', 'LAC', 'LAR', 'MIA', 'MIN', 'NE', 'NO', 'NYG',
  'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB', 'TEN', 'WAS'
]);
const YES_NO_MARKETS = new Set([
  'division_winner', 'conference_winner', 'conference_no_1_seed', 'super_bowl_winner',
  'mvp', 'opoy', 'dpoy', 'oroy', 'droy', 'coach_of_the_year', 'no_1_overall_pick'
]);
const FUTURES_MARKETS = new Set([
  'win_total', 'make_playoffs', 'division_winner', 'conference_winner', 'conference_no_1_seed',
  'super_bowl_winner', 'mvp', 'opoy', 'dpoy', 'oroy', 'droy', 'coach_of_the_year',
  'no_1_overall_pick'
]);
const NON_FUTURES_BETTING_MARKETS = new Set([
  'spread', 'game_line', 'moneyline', 'total', 'player_prop', 'player_receiving_yds'
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function normalizeMarket(raw) {
  const clean = String(raw || 'general').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (clean.includes('win_total') || clean === 'wins' || clean.includes('season_win')) return 'win_total';
  if (clean.includes('make_playoff') || clean === 'playoffs') return 'make_playoffs';
  if (clean.includes('division_winner') || clean.includes('division_champion') || clean.includes('division_champ') || clean.includes('afc_south_champ')) return 'division_winner';
  if (clean.includes('conference_no_1_seed') || clean.includes('no_1_seed') || clean.includes('number_1_seed')) return 'conference_no_1_seed';
  if (clean.includes('super_bowl')) return 'super_bowl_winner';
  if (clean.includes('conference_champion') || clean.includes('conference_winner') || clean.includes('nfc_conference') || clean.includes('afc_conference')) return 'conference_winner';
  if (clean.includes('overall_pick') || clean.includes('no_1_overall') || clean.includes('number_1_overall')) return 'no_1_overall_pick';
  if (clean === 'mvp' || clean.includes('most_valuable_player')) return 'mvp';
  if (clean === 'opoy' || clean.includes('offensive_player_of_the_year')) return 'opoy';
  if (clean === 'dpoy' || clean.includes('defensive_player_of_the_year')) return 'dpoy';
  if (clean === 'oroy' || clean.includes('offensive_rookie_of_the_year')) return 'oroy';
  if (clean === 'droy' || clean.includes('defensive_rookie_of_the_year')) return 'droy';
  if (clean.includes('coach_of_the_year')) return 'coach_of_the_year';
  return clean;
}

function normalizeSide(raw, market) {
  const clean = String(raw || 'UNKNOWN').trim().toUpperCase();
  if (YES_NO_MARKETS.has(market) && (clean === 'UNKNOWN' || clean.includes('OVER') || clean.includes('WIN') || clean.includes('YES') || clean.includes('TO WIN'))) return 'YES';
  if (YES_NO_MARKETS.has(market) && (clean.includes('NO') || clean.includes('UNDER') || clean.includes('FADE'))) return 'NO';
  if (clean.includes('OVER')) return 'OVER';
  if (clean.includes('UNDER')) return 'UNDER';
  if (clean.includes('YES') || clean.includes('WIN')) return 'YES';
  if (clean.includes('NO')) return 'NO';
  return clean;
}

function normalizePick(p) {
  const market = normalizeMarket(p.market);
  const team = TEAM_FIXUPS[String(p.team || '').toUpperCase()] || String(p.team || 'UNK').toUpperCase();
  return {
    ...p,
    team,
    market,
    side: normalizeSide(p.side || p.selection, market),
    line: p.line != null && p.line !== '' ? Number(p.line) : null,
    price: p.price != null && p.price !== '' ? Number(p.price) : null,
    source_timestamp: Number(p.source_timestamp || p.timestamp || 0),
    rationale: p.rationale || ''
  };
}

function youtubeTimestamp(url, seconds) {
  if (!url || !Number.isFinite(seconds)) return url || '';
  return `${url}${url.includes('?') ? '&' : '?'}t=${Math.max(0, Math.round(seconds))}s`;
}

function mdCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();
}

function priceText(price) {
  if (price == null || Number.isNaN(Number(price))) return '';
  const n = Number(price);
  return n > 0 ? `+${n}` : String(n);
}

function priceMentionedInQuote(price, quote) {
  if (price == null || Number.isNaN(Number(price))) return true;
  const n = Math.abs(Number(price));
  const text = String(quote || '').toLowerCase().replace(/[^a-z0-9+.-]+/g, ' ');
  const numeric = String(n);
  const decimal = `${Math.floor(n / 100)}${n % 100 === 0 ? '' : `.${String(n % 100).padStart(2, '0')}`}`;
  return text.includes(`+${numeric}`)
    || text.includes(`plus ${numeric}`)
    || text.includes(numeric)
    || text.includes(`${decimal} to 1`)
    || text.includes(`${decimal}-to-1`);
}

function suspiciousPriceShape(pick) {
  if (pick.price == null || Number.isNaN(Number(pick.price))) return false;
  const price = Number(pick.price);
  if (pick.market === 'division_winner' && price >= 1000) return true;
  if (pick.market === 'make_playoffs' && Math.abs(price) >= 800) return true;
  if (pick.market === 'win_total' && Math.abs(price) >= 400) return true;
  return false;
}

function findSupportingQuote(row, pick) {
  const quotes = row.observation.run?.quote_timestamps || [];
  const target = Number(pick.source_timestamp || 0);
  let best = null;
  for (const quote of quotes) {
    const delta = Math.abs(Number(quote.timestamp || 0) - target);
    if (delta > 90) continue;
    if (!best || delta < best.delta) best = { ...quote, delta };
  }
  return best;
}

function stablePickId(pick) {
  return [
    pick.episode_id,
    pick.team || 'UNK',
    pick.market || 'general',
    pick.side || 'UNKNOWN',
    pick.line ?? '',
    pick.price ?? '',
    pick.source_timestamp || 0
  ].join('__');
}

function classifyPick(pick) {
  const text = `${pick.episode_title || ''} ${pick.market || ''} ${pick.rationale || ''}`.toLowerCase();
  if (NON_FUTURES_BETTING_MARKETS.has(pick.market)) return 'non_futures_betting';
  if (text.includes('injury') || text.includes('acl') || text.includes('achilles') || text.includes('ligament') || pick.market === 'player_decision') return 'injury_intel';
  if (text.includes('training camp') || text.includes('camp') || text.includes('sic score')) return 'training_camp_intel';
  if (FUTURES_MARKETS.has(pick.market)) return 'futures_pick';
  return 'market_context';
}

function defaultReviewStatus(pick) {
  if (pick.review_flags.includes('non_futures_market')) return 'context_only';
  if (pick.review_flags.length > 0) return 'needs_review';
  return 'pending_review';
}

function reviewFlags(pick) {
  const flags = [];
  if (!VALID_TEAMS.has(pick.team)) flags.push('invalid_team');
  if (!pick.market || pick.market === 'general') flags.push('unclear_market');
  if (pick.market && !FUTURES_MARKETS.has(pick.market)) flags.push('non_futures_market');
  if (!pick.side || pick.side === 'UNKNOWN') flags.push('unclear_side');
  if (pick.market === 'win_total' && pick.line == null) flags.push('missing_win_total_line');
  if (pick.price == null) flags.push('missing_price');
  if (pick.price != null && !priceMentionedInQuote(pick.price, pick.supporting_quote)) flags.push('price_not_in_quote');
  if (suspiciousPriceShape(pick)) flags.push('suspicious_price_shape');
  if (!pick.source_timestamp) flags.push('missing_timestamp');
  if (!pick.rationale || pick.rationale.length < 20) flags.push('thin_rationale');
  return flags;
}

function loadObservation(candidate) {
  const obsPath = path.join(OBS_DIR, `${candidate.id}-shadow-youtube.json`);
  if (!fs.existsSync(obsPath)) return null;
  const observation = readJson(obsPath);
  const picks = (observation.run?.extracted_picks || []).map(normalizePick);
  return {
    candidate,
    observation,
    picks,
    obsPath
  };
}

function loadReviewStatus() {
  if (!fs.existsSync(REVIEW_STATUS_PATH)) {
    return {
      generated_at: new Date().toISOString(),
      status: 'local_review_status_only',
      guardrail: 'Human-editable local status file. This does not promote official picks or write production recommendations.',
      items: []
    };
  }
  return readJson(REVIEW_STATUS_PATH);
}

function writeReviewStatus(existing, picks) {
  const existingById = new Map((existing.items || []).map(item => [item.item_id, item]));
  const items = picks.map(pick => {
    const prior = existingById.get(pick.item_id) || {};
    const status = prior.status && prior.status !== 'pending_review'
      ? prior.status
      : defaultReviewStatus(pick);
    return {
      item_id: pick.item_id,
      status,
      item_lane: pick.item_lane,
      episode_id: pick.episode_id,
      episode_title: pick.episode_title,
      team: pick.team,
      market: pick.market,
      side: pick.side,
      line: pick.line,
      price: pick.price,
      source_timestamp: pick.source_timestamp,
      review_flags: pick.review_flags,
      supporting_quote: pick.supporting_quote || '',
      reviewer_notes: prior.reviewer_notes || '',
      updated_at: prior.updated_at || null
    };
  });
  writeJson(REVIEW_STATUS_PATH, {
    generated_at: new Date().toISOString(),
    status: 'local_review_status_only',
    guardrail: 'Human-editable local status file. This does not promote official picks or write production recommendations.',
    allowed_statuses: ['pending_review', 'needs_review', 'context_only', 'promote_to_local_intel', 'reject'],
    items
  });
}

if (!fs.existsSync(CANDIDATES_PATH)) {
  throw new Error(`Missing candidates file: ${CANDIDATES_PATH}`);
}

const candidates = readJson(CANDIDATES_PATH).episodes || [];
const futuresCandidates = candidates
  .filter(candidate => candidate.gemini_futures_eligible)
  .sort((a, b) => (b.futures_score || 0) - (a.futures_score || 0));
const rows = futuresCandidates.map(loadObservation).filter(Boolean);
const missing = futuresCandidates.filter(candidate => !fs.existsSync(path.join(OBS_DIR, `${candidate.id}-shadow-youtube.json`)));

const allPicks = [];
for (const row of rows) {
  for (const pick of row.picks) {
    const supportingQuote = findSupportingQuote(row, pick);
    const rowPick = {
      episode_id: row.candidate.id,
      episode_title: row.candidate.title,
      show: row.candidate.show,
      video_url: row.candidate.url,
      timestamp_url: youtubeTimestamp(row.candidate.url, pick.source_timestamp),
      ...pick,
      supporting_quote: supportingQuote?.quote || '',
      supporting_quote_topic: supportingQuote?.topic || '',
      supporting_quote_timestamp: supportingQuote?.timestamp ?? null,
      supporting_quote_delta_seconds: supportingQuote?.delta ?? null
    };
    rowPick.review_flags = reviewFlags(rowPick);
    allPicks.push(rowPick);
  }
}

const duplicateKeys = new Map();
for (const pick of allPicks) {
  const key = [pick.team, pick.market, pick.side, pick.line ?? '', pick.price ?? ''].join('|');
  duplicateKeys.set(key, (duplicateKeys.get(key) || 0) + 1);
}
for (const pick of allPicks) {
  const key = [pick.team, pick.market, pick.side, pick.line ?? '', pick.price ?? ''].join('|');
  if ((duplicateKeys.get(key) || 0) > 1) pick.review_flags.push('duplicate_candidate');
}

for (const pick of allPicks) {
  pick.item_id = stablePickId(pick);
  pick.item_lane = classifyPick(pick);
}

const existingReviewStatus = loadReviewStatus();
writeReviewStatus(existingReviewStatus, allPicks);

const laneCounts = allPicks.reduce((acc, pick) => {
  acc[pick.item_lane] = (acc[pick.item_lane] || 0) + 1;
  return acc;
}, {});
const flagCounts = allPicks.reduce((acc, pick) => {
  for (const flag of pick.review_flags) acc[flag] = (acc[flag] || 0) + 1;
  return acc;
}, {});

const summary = {
  generated_at: new Date().toISOString(),
  status: 'local_review_only',
  guardrail: 'Do not promote these Gemini-derived observations to official picks or production recommendations without human review.',
  futures_candidates: futuresCandidates.length,
  observed_episodes: rows.length,
  missing_observations: missing.length,
  total_extracted_picks: allPicks.length,
  flagged_picks: allPicks.filter(pick => pick.review_flags.length > 0).length,
  item_lane_counts: laneCounts,
  review_flag_counts: flagCounts,
  total_cost_usd: Number(rows.reduce((sum, row) => sum + Number(row.observation.run?.estimated_cost_usd || 0), 0).toFixed(6)),
  average_latency_ms: rows.length ? Math.round(rows.reduce((sum, row) => sum + Number(row.observation.run?.latency_ms || 0), 0) / rows.length) : 0
};

const report = {
  ...summary,
  missing,
  episodes: rows.map(row => ({
    id: row.candidate.id,
    show: row.candidate.show,
    title: row.candidate.title,
    url: row.candidate.url,
    futures_score: row.candidate.futures_score,
    cost_usd: row.observation.run?.estimated_cost_usd || 0,
    latency_ms: row.observation.run?.latency_ms || 0,
    extracted_pick_count: row.picks.length,
    no_pick_context: row.picks.length === 0 ? 'No explicit betting picks extracted; review as contextual intel only.' : null
  })),
  picks: allPicks
};

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.mkdirSync(DOC_DIR, { recursive: true });
const jsonOut = path.join(REPORT_DIR, 'youtube-futures-intel-review-latest.json');
const mdOut = path.join(DOC_DIR, 'youtube-futures-intel-review-latest.md');
writeJson(jsonOut, report);

const lines = [
  '# YouTube Futures Intel Review',
  '',
  `Generated: ${summary.generated_at}`,
  '',
  '> Local review only. Do not promote Gemini-derived observations to official picks or production recommendations without human review.',
  '',
  '## Summary',
  '',
  `- Futures candidates: ${summary.futures_candidates}`,
  `- Observed episodes: ${summary.observed_episodes}`,
  `- Missing observations: ${summary.missing_observations}`,
  `- Extracted picks/leads: ${summary.total_extracted_picks}`,
  `- Flagged picks/leads: ${summary.flagged_picks}`,
  `- Total Gemini cost: $${summary.total_cost_usd}`,
  `- Average latency: ${summary.average_latency_ms} ms`,
  `- Review status file: ${path.relative(ROOT, REVIEW_STATUS_PATH)}`,
  '',
  '## Lane Counts',
  '',
  '| Lane | Count |',
  '|---|---:|',
  ...Object.entries(summary.item_lane_counts).sort(([a], [b]) => a.localeCompare(b)).map(([lane, count]) => `| ${lane} | ${count} |`),
  '',
  '## Flag Counts',
  '',
  '| Flag | Count |',
  '|---|---:|',
  ...Object.entries(summary.review_flag_counts).sort(([a], [b]) => a.localeCompare(b)).map(([flag, count]) => `| ${flag} | ${count} |`),
  '',
  '## Episode Coverage',
  '',
  '| Score | Picks | Cost | Episode | URL |',
  '|---:|---:|---:|---|---|',
  ...report.episodes.map(ep => `| ${ep.futures_score ?? ''} | ${ep.extracted_pick_count} | $${Number(ep.cost_usd).toFixed(5)} | ${mdCell(ep.title)} | ${ep.url} |`),
  '',
  '## Extracted Picks And Leans',
  '',
  '| Lane | Episode | Team | Market | Side | Line | Price | Speaker | Time | Flags | Quote | Rationale |',
  '|---|---|---|---|---|---:|---:|---|---|---|---|---|',
  ...allPicks.map(pick => `| ${pick.item_lane} | ${mdCell(pick.episode_title)} | ${pick.team} | ${pick.market} | ${pick.side} | ${pick.line ?? ''} | ${priceText(pick.price)} | ${mdCell(pick.speaker)} | [${pick.source_timestamp}s](${pick.timestamp_url}) | ${pick.review_flags.join(', ')} | ${mdCell(pick.supporting_quote)} | ${mdCell(pick.rationale)} |`)
];

if (missing.length > 0) {
  lines.push('', '## Missing Observations', '');
  for (const item of missing) lines.push(`- ${item.id}: ${item.title} (${item.url})`);
}

fs.writeFileSync(mdOut, `${lines.join('\n')}\n`);
console.log(`Wrote YouTube futures review JSON: ${jsonOut}`);
console.log(`Wrote YouTube futures review Markdown: ${mdOut}`);
console.log(`Wrote YouTube futures review status: ${REVIEW_STATUS_PATH}`);
console.log(`Review summary: episodes=${summary.observed_episodes} picks=${summary.total_extracted_picks} flagged=${summary.flagged_picks} missing=${summary.missing_observations}`);
