#!/usr/bin/env node

import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { parseArgs, readJson, ROOT } from './lib/profile-snapshot-utils.js';

const DEFAULT_CONFIG = 'data/futures-imports/platinum-rose-ai-official-2026.json';
const DEFAULT_LEDGER = 'data/official-picks/platinum-rose-ai-2026.json';
const DEFAULT_PROPOSAL_DIR = 'data/official-picks/proposals';
const DEFAULT_ACTIVE_PROPOSAL_DIR = path.join(DEFAULT_PROPOSAL_DIR, 'active');
const DEFAULT_PROMOTED_PROPOSAL_DIR = path.join(DEFAULT_PROPOSAL_DIR, 'promoted');
const DEFAULT_REJECTED_PROPOSAL_DIR = path.join(DEFAULT_PROPOSAL_DIR, 'rejected');
const DEFAULT_REPORT_DIR = '.nfl/official-picks';

const VALID_LIFECYCLES = new Set(['proposal', 'human_verified', 'official_paper', 'graded', 'void', 'superseded']);
const VALID_RESULTS = new Set(['pending', 'won', 'lost', 'push', 'void', 'half_won', 'half_lost', 'superseded']);

function usage() {
  return `
Usage:
  node scripts/official-pick-ledger.js init [--ledger <path>]
  node scripts/official-pick-ledger.js new [--scope futures|weekly] [--team <team>] [--market-type <type>] [--selection <text>] [--out <path>]
  node scripts/official-pick-ledger.js inbox [--inbox-dir <path>] [--out-dir <path>]
  node scripts/official-pick-ledger.js approve --file <proposal.json> [--ledger <path>]
  node scripts/official-pick-ledger.js promote --file <proposal.json> [--ledger <path>]
  node scripts/official-pick-ledger.js reject --file <proposal.json> --reason <text>
  node scripts/official-pick-ledger.js validate --file <proposal.json> [--strict]
  node scripts/official-pick-ledger.js validate --pick-id <id> [--ledger <path>] [--strict]
  node scripts/official-pick-ledger.js propose --file <proposal.json> [--ledger <path>]
  node scripts/official-pick-ledger.js verify --pick-id <id> --source-ref <ref> [--observed-at <iso>] [--ledger <path>]
  node scripts/official-pick-ledger.js lock --pick-id <id> [--ledger <path>]
  node scripts/official-pick-ledger.js grade --pick-id <id> --result <result> [--net-units <n>] [--note <text>] [--ledger <path>]
  node scripts/official-pick-ledger.js list [--status <lifecycle>] [--ledger <path>]
  node scripts/official-pick-ledger.js summary [--ledger <path>]
  node scripts/official-pick-ledger.js report [--ledger <path>] [--out-dir <path>]
`.trim();
}

function resolveRepoPath(filePath) {
  return path.resolve(ROOT, filePath || DEFAULT_LEDGER);
}

function nowIso() {
  return new Date().toISOString();
}

function fileTimestamp() {
  return nowIso().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function slug(value, fallback = 'proposal') {
  const text = String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return text || fallback;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmt(value, fallback = '-') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function fmtMoney(value) {
  if (!Number.isFinite(Number(value))) return '-';
  return `$${Number(value).toFixed(2)}`;
}

function fmtUnits(value) {
  if (!Number.isFinite(Number(value))) return '-';
  return `${Number(value).toFixed(4).replace(/\.?0+$/, '')}u`;
}

function fmtPct(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (!Number.isFinite(Number(value))) return '-';
  return `${(Number(value) * 100).toFixed(1)}%`;
}

function fmtDate(value) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toISOString().replace('.000Z', 'Z');
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function writeJson(filePath, payload) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function listJsonFiles(dirPath) {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && !entry.name.startsWith('candidate-inbox-'))
      .map((entry) => path.join(dirPath, entry.name))
      .sort();
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function uniqueArchivePath(targetDir, originalFile) {
  await mkdir(targetDir, { recursive: true });
  const parsed = path.parse(originalFile);
  let candidate = path.join(targetDir, parsed.base);
  if (!(await readJsonIfExists(candidate).catch(() => null))) return candidate;
  candidate = path.join(targetDir, `${parsed.name}-${fileTimestamp()}${parsed.ext}`);
  return candidate;
}

async function archiveProposalFile(filePath, targetDir, statePatch) {
  const absFile = resolveRepoPath(filePath);
  const proposal = await readJson(absFile);
  proposal.inbox_state = {
    ...(proposal.inbox_state || {}),
    ...statePatch,
    updated_at: nowIso(),
  };
  await writeJson(absFile, proposal);
  const dest = await uniqueArchivePath(resolveRepoPath(targetDir), absFile);
  await rename(absFile, dest);
  return dest;
}

function bankrollFor(config, pickScope) {
  if (pickScope === 'weekly') {
    return {
      portfolio_name: 'in_season_weekly',
      bankroll_usd: config.in_season_weekly?.bankroll_usd ?? null,
      unit_size_usd: config.in_season_weekly?.unit_usd ?? null,
      allowed_unit_sizes: config.in_season_weekly?.allowed_unit_sizes ?? [],
    };
  }

  return {
    portfolio_name: 'futures_portfolio',
    bankroll_usd: config.futures_portfolio?.bankroll_usd ?? null,
    unit_size_usd: config.futures_portfolio?.unit_usd ?? null,
    allowed_unit_sizes: config.futures_portfolio?.allowed_unit_sizes ?? [],
  };
}

function createEmptyLedger(config) {
  const at = nowIso();
  return {
    meta: {
      ledger_id: `${config.expert_id}_${config.season}`,
      expert_id: config.expert_id,
      display_name: config.display_name,
      sport: config.sport,
      season: config.season,
      mode: config.mode,
      config_path: DEFAULT_CONFIG,
      created_at: at,
      updated_at: at,
    },
    bankrolls: {
      futures_portfolio: config.futures_portfolio,
      in_season_weekly: config.in_season_weekly,
      sizing_map: config.sizing_map,
    },
    policy: {
      autonomous_betting_allowed: false,
      human_verification_required: true,
      market_holds: config.market_holds ?? [],
    },
    picks: [],
    events: [],
  };
}

async function loadLedger(ledgerPath, config) {
  return (await readJsonIfExists(ledgerPath)) ?? createEmptyLedger(config);
}

function addEvent(ledger, pickId, eventType, fromState, toState, note, payload = {}) {
  ledger.events.push({
    event_id: randomUUID(),
    pick_id: pickId,
    event_type: eventType,
    from_state: fromState ?? null,
    to_state: toState ?? null,
    note: note ?? null,
    payload,
    created_at: nowIso(),
  });
}

function normalizeArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function normalizeStakeTier(config, stakeTier, stakeUnits) {
  if (stakeTier) return stakeTier;
  const sizingMap = config.sizing_map ?? {};
  const match = Object.entries(sizingMap).find(([, units]) => Number(units) === Number(stakeUnits));
  return match?.[0] ?? null;
}

function templateProposal(config, args) {
  const pickScope = args.scope || args['pick-scope'] || 'futures';
  const bankroll = bankrollFor(config, pickScope);
  const stakeTier = args['stake-tier'] || 'speculative';
  const stakeUnits = Number(args['stake-units'] ?? config.sizing_map?.[stakeTier] ?? 0.25);
  return {
    pick_id: randomUUID(),
    pick_scope: pickScope,
    market_type: args['market-type'] || '',
    market: args.market || '',
    selection: args.selection || '',
    team: args.team || '',
    opponent: args.opponent || '',
    book: args.book || '',
    price: args.price === undefined ? null : Number(args.price),
    line: args.line === undefined ? null : Number(args.line),
    stake_tier: stakeTier,
    stake_units: stakeUnits,
    confidence: args.confidence === undefined ? null : Number(args.confidence),
    observed_at: args['observed-at'] || '',
    source_ref: args['source-ref'] || '',
    source_url: args['source-url'] || '',
    bet_threshold: '',
    minimum_edge_pct: null,
    model_fair_prob: null,
    edge_pct: null,
    market_view: '',
    football_view: '',
    thesis: '',
    disconfirming_factor: '',
    evidence_ids: [],
    sources: [],
    data_snapshot: {
      proposal_template: true,
      created_by: 'official-pick-ledger new',
      bankroll_usd: bankroll.bankroll_usd,
      unit_size_usd: bankroll.unit_size_usd,
      allowed_unit_sizes: bankroll.allowed_unit_sizes,
    },
    audit_note: 'Draft proposal. Not official unless human-verified and locked.',
  };
}

function defaultProposalPath(proposal) {
  const parts = [
    'platinum-rose',
    proposal.pick_scope || 'futures',
    proposal.team || proposal.market_type || proposal.selection || 'proposal',
    fileTimestamp(),
  ];
  return path.join(DEFAULT_ACTIVE_PROPOSAL_DIR, `${parts.map((p) => slug(p)).join('-')}.json`);
}

function normalizeProposal(config, raw) {
  const pickScope = raw.pick_scope || raw.scope || 'futures';
  if (!['futures', 'weekly'].includes(pickScope)) {
    throw new Error(`Unsupported pick_scope "${pickScope}". Use futures or weekly.`);
  }

  const bankroll = bankrollFor(config, pickScope);
  const stakeUnits = Number(raw.stake_units ?? raw.units ?? config.sizing_map?.[raw.stake_tier] ?? 0);
  if (!bankroll.allowed_unit_sizes.includes(stakeUnits)) {
    throw new Error(`stake_units must be one of ${bankroll.allowed_unit_sizes.join(', ')} for ${pickScope}.`);
  }

  for (const key of ['market_type', 'selection', 'book']) {
    if (!raw[key]) throw new Error(`Proposal is missing required field: ${key}`);
  }

  if (!raw.thesis || !raw.market_view || !raw.football_view || !raw.disconfirming_factor) {
    throw new Error('Proposal requires thesis, market_view, football_view, and disconfirming_factor.');
  }

  const at = nowIso();
  return {
    pick_id: raw.pick_id || randomUUID(),
    expert_key: config.expert_id,
    sport: config.sport,
    season: Number(raw.season ?? config.season),
    pick_scope: pickScope,
    lifecycle: 'proposal',
    approval_state: 'proposed',
    portfolio_name: raw.portfolio_name || bankroll.portfolio_name,
    bankroll_usd: bankroll.bankroll_usd,
    unit_size_usd: bankroll.unit_size_usd,
    stake_units: stakeUnits,
    stake_usd: Number((stakeUnits * bankroll.unit_size_usd).toFixed(2)),
    stake_tier: normalizeStakeTier(config, raw.stake_tier, stakeUnits),
    confidence: raw.confidence === undefined ? null : Number(raw.confidence),
    confidence_tier: raw.confidence_tier ?? null,
    market_type: raw.market_type,
    market: raw.market ?? null,
    selection: raw.selection,
    bet_type: raw.bet_type ?? null,
    side: raw.side ?? null,
    team: raw.team ?? null,
    opponent: raw.opponent ?? null,
    event_id: raw.event_id ?? null,
    week: raw.week === undefined ? null : Number(raw.week),
    starts_at: raw.starts_at ?? null,
    book: raw.book,
    price: raw.price === undefined || raw.price === null ? null : Number(raw.price),
    line: raw.line === undefined || raw.line === null ? null : Number(raw.line),
    observed_at: raw.observed_at ?? null,
    source_url: raw.source_url ?? null,
    source_ref: raw.source_ref ?? null,
    bet_threshold: raw.bet_threshold ?? null,
    minimum_edge_pct: raw.minimum_edge_pct === undefined ? null : Number(raw.minimum_edge_pct),
    model_fair_prob: raw.model_fair_prob === undefined ? null : Number(raw.model_fair_prob),
    edge_pct: raw.edge_pct === undefined ? null : Number(raw.edge_pct),
    closing_price: null,
    closing_line: null,
    closing_observed_at: null,
    clv_pct: null,
    result_status: 'pending',
    payout_units: null,
    net_units: null,
    resolved_at: null,
    result_note: null,
    source_model: raw.source_model ?? null,
    source_run_id: raw.source_run_id ?? null,
    market_view: raw.market_view,
    football_view: raw.football_view,
    thesis: raw.thesis,
    disconfirming_factor: raw.disconfirming_factor,
    timing: raw.timing ?? null,
    correlated_positions: raw.correlated_positions ?? [],
    evidence_ids: normalizeArray(raw.evidence_ids),
    sources: normalizeArray(raw.sources),
    data_snapshot: raw.data_snapshot ?? {},
    human_verification_required: true,
    human_verified_at: null,
    official_at: null,
    locked_at: null,
    audit_note: raw.audit_note ?? null,
    created_at: at,
    updated_at: at,
  };
}

function findPick(ledger, pickId) {
  const pick = ledger.picks.find((p) => p.pick_id === pickId);
  if (!pick) throw new Error(`No pick found for pick_id ${pickId}.`);
  return pick;
}

function updateLedgerMeta(ledger) {
  ledger.meta.updated_at = nowIso();
}

function isExactaHold(config, pick) {
  const heldMarkets = new Set((config.market_holds ?? []).map((h) => h.market));
  return heldMarkets.has(pick.market_type) || heldMarkets.has(pick.market);
}

function validationReport(config, candidate) {
  const pickScope = candidate.pick_scope || candidate.scope || 'futures';
  const bankroll = bankrollFor(config, pickScope);
  const errors = [];
  const warnings = [];
  const info = [];

  if (!['futures', 'weekly'].includes(pickScope)) errors.push(`pick_scope must be futures or weekly, got "${pickScope}".`);

  const stakeUnits = Number(candidate.stake_units ?? candidate.units ?? config.sizing_map?.[candidate.stake_tier] ?? NaN);
  if (!Number.isFinite(stakeUnits)) {
    errors.push('stake_units is required.');
  } else if (!bankroll.allowed_unit_sizes.includes(stakeUnits)) {
    errors.push(`stake_units must be one of ${bankroll.allowed_unit_sizes.join(', ')} for ${pickScope}.`);
  }

  for (const key of ['market_type', 'selection', 'book']) {
    if (!candidate[key]) errors.push(`${key} is required for proposal intake.`);
  }

  for (const key of ['thesis', 'market_view', 'football_view', 'disconfirming_factor']) {
    if (!candidate[key]) errors.push(`${key} is required for proposal intake.`);
  }

  if (candidate.confidence === null || candidate.confidence === undefined || candidate.confidence === '') {
    warnings.push('confidence is required before lock.');
  } else if (!Number.isFinite(Number(candidate.confidence)) || Number(candidate.confidence) < 0 || Number(candidate.confidence) > 100) {
    errors.push('confidence must be a number from 0 to 100.');
  }

  if (!candidate.observed_at) warnings.push('observed_at is required before lock.');
  if (!candidate.source_ref && !candidate.source_url) warnings.push('source_ref or source_url is required before lock.');
  if (!candidate.bet_threshold && candidate.minimum_edge_pct === null && candidate.minimum_edge_pct === undefined && candidate.edge_pct === null && candidate.edge_pct === undefined) {
    warnings.push('bet_threshold, minimum_edge_pct, or edge_pct is required before lock.');
  }
  if (!normalizeArray(candidate.evidence_ids).length) warnings.push('evidence_ids are required before lock.');
  if (!normalizeArray(candidate.sources).length) warnings.push('sources are recommended for audit quality.');

  if (isExactaHold(config, candidate)) {
    warnings.push('Current exacta/Super Bowl matchup hold: monitor-only until secondary BetOnline price-shopping market exists.');
  }

  if (pickScope === 'weekly' && !candidate.week && !candidate.event_id && !candidate.starts_at) {
    warnings.push('weekly picks should include week, event_id, or starts_at before lock.');
  }

  const proposalReady = errors.length === 0;
  const lockBlockingWarnings = warnings.filter((w) => !w.startsWith('sources are recommended'));
  const verified = candidate.lifecycle === 'human_verified' && candidate.approval_state === 'human_verified';
  const lockReady = proposalReady && verified && lockBlockingWarnings.length === 0;
  if (!verified) info.push('A proposal must be human-verified before it can be locked as official paper.');

  return {
    pick_id: candidate.pick_id ?? null,
    selection: candidate.selection ?? null,
    pick_scope: pickScope,
    proposal_ready: proposalReady,
    lock_ready: lockReady,
    exacta_hold: isExactaHold(config, candidate),
    errors,
    warnings,
    info,
  };
}

function validateLockable(config, pick) {
  if (pick.lifecycle !== 'human_verified' || pick.approval_state !== 'human_verified') {
    throw new Error('Pick must be human_verified before it can become official_paper.');
  }
  if (isExactaHold(config, pick)) {
    throw new Error('This market is monitor-only under the current exacta/Super Bowl matchup hold.');
  }
  const missing = [];
  if (!pick.book) missing.push('book');
  if (!pick.observed_at) missing.push('observed_at');
  if (!pick.source_ref && !pick.source_url) missing.push('source_ref or source_url');
  if (pick.confidence === null || !Number.isFinite(Number(pick.confidence))) missing.push('confidence');
  if (!pick.bet_threshold && pick.minimum_edge_pct === null && pick.edge_pct === null) {
    missing.push('bet_threshold or edge');
  }
  if (!pick.market_view) missing.push('market_view');
  if (!pick.football_view) missing.push('football_view');
  if (!pick.thesis) missing.push('thesis');
  if (!pick.disconfirming_factor) missing.push('disconfirming_factor');
  if (!pick.evidence_ids?.length) missing.push('evidence_ids');
  if (missing.length) throw new Error(`Pick cannot be locked yet. Missing: ${missing.join(', ')}.`);
}

function profitForAmericanOdds(stakeUnits, price) {
  if (!Number.isFinite(Number(price))) return null;
  const odds = Number(price);
  if (odds > 0) return stakeUnits * (odds / 100);
  if (odds < 0) return stakeUnits * (100 / Math.abs(odds));
  return null;
}

function defaultNetUnits(pick, result) {
  const stakeUnits = Number(pick.stake_units);
  const winProfit = profitForAmericanOdds(stakeUnits, pick.price);
  if (result === 'won') return winProfit;
  if (result === 'lost') return -stakeUnits;
  if (result === 'push' || result === 'void' || result === 'superseded') return 0;
  if (result === 'half_won') return winProfit === null ? null : winProfit / 2;
  if (result === 'half_lost') return -stakeUnits / 2;
  return null;
}

function ledgerSummary(ledger) {
  const official = ledger.picks.filter((p) => ['official_paper', 'graded', 'void'].includes(p.lifecycle));
  const graded = ledger.picks.filter((p) => p.lifecycle === 'graded' || p.lifecycle === 'void');
  const pending = ledger.picks.filter((p) => p.result_status === 'pending');
  const netUnits = graded.reduce((sum, pick) => sum + Number(pick.net_units ?? 0), 0);
  const stakedUnits = official.reduce((sum, pick) => sum + Number(pick.stake_units ?? 0), 0);
  const roi = stakedUnits ? netUnits / stakedUnits : null;
  const byResult = graded.reduce((acc, pick) => {
    acc[pick.result_status] = (acc[pick.result_status] || 0) + 1;
    return acc;
  }, {});
  const byLifecycle = ledger.picks.reduce((acc, pick) => {
    acc[pick.lifecycle] = (acc[pick.lifecycle] || 0) + 1;
    return acc;
  }, {});

  return {
    expert: ledger.meta.display_name,
    total_picks: ledger.picks.length,
    proposals: byLifecycle.proposal || 0,
    human_verified: byLifecycle.human_verified || 0,
    official_paper: official.length,
    pending: pending.length,
    graded: graded.length,
    by_lifecycle: byLifecycle,
    by_result: byResult,
    staked_units: Number(stakedUnits.toFixed(4)),
    net_units: Number(netUnits.toFixed(4)),
    roi: roi === null ? null : Number(roi.toFixed(4)),
  };
}

function pickSortValue(pick) {
  return Date.parse(pick.locked_at || pick.human_verified_at || pick.created_at || 0) || 0;
}

function renderPickMarkdown(config, pick) {
  const report = validationReport(config, pick);
  const status = [
    `lifecycle=${pick.lifecycle}`,
    `approval=${pick.approval_state}`,
    `proposal_ready=${report.proposal_ready}`,
    `lock_ready=${report.lock_ready}`,
  ].join(', ');
  const warningLine = report.warnings.length ? `\n  - Warnings: ${report.warnings.join(' | ')}` : '';
  return [
    `### ${pick.selection}`,
    '',
    `- Status: ${status}`,
    `- Market: ${fmt(pick.pick_scope)} / ${fmt(pick.market_type)} / ${fmt(pick.market)}`,
    `- Price: ${fmt(pick.book)} ${fmt(pick.price)}${pick.line === null || pick.line === undefined ? '' : ` / line ${pick.line}`}`,
    `- Stake: ${fmtUnits(pick.stake_units)} (${fmtMoney(pick.stake_usd)})`,
    `- Confidence: ${fmt(pick.confidence)}`,
    `- Result: ${fmt(pick.result_status)} / net ${fmtUnits(pick.net_units)}`,
    `- Observed: ${fmt(pick.observed_at)}`,
    `- Source: ${fmt(pick.source_ref || pick.source_url)}`,
    `- Thesis: ${fmt(pick.thesis)}`,
    `- Disconfirming factor: ${fmt(pick.disconfirming_factor)}`,
    `- Evidence ids: ${pick.evidence_ids?.length ? pick.evidence_ids.join(', ') : '-'}${warningLine}`,
  ].join('\n');
}

function renderMarkdownReport(config, ledger, ledgerPath) {
  const summary = ledgerSummary(ledger);
  const picks = [...ledger.picks].sort((a, b) => pickSortValue(b) - pickSortValue(a));
  const lines = [
    `# ${ledger.meta.display_name} Official Picks Ledger`,
    '',
    `Generated: ${nowIso()}`,
    `Ledger: ${path.relative(ROOT, ledgerPath)}`,
    '',
    '## Summary',
    '',
    `- Total picks: ${summary.total_picks}`,
    `- Proposals: ${summary.proposals}`,
    `- Human verified: ${summary.human_verified}`,
    `- Official paper: ${summary.official_paper}`,
    `- Graded: ${summary.graded}`,
    `- Pending: ${summary.pending}`,
    `- Staked units: ${fmtUnits(summary.staked_units)}`,
    `- Net units: ${fmtUnits(summary.net_units)}`,
    `- ROI: ${fmtPct(summary.roi)}`,
    '',
    '## Guardrails',
    '',
    '- Local report only. No Supabase write.',
    '- Proposals are not official picks until human-verified and locked.',
    '- Exacta and Super Bowl matchup markets are monitor-only while the BetOnline price-shopping hold is active.',
    '',
    '## Picks',
    '',
    picks.length ? picks.map((pick) => renderPickMarkdown(config, pick)).join('\n\n') : '_No picks recorded._',
    '',
  ];
  return lines.join('\n');
}

function portfolioRows(ledger) {
  const official = ledger.picks.filter((p) => ['official_paper', 'graded', 'void'].includes(p.lifecycle));
  const groups = [
    ['futures_portfolio', 'Futures', ledger.bankrolls?.futures_portfolio],
    ['in_season_weekly', 'Weekly', ledger.bankrolls?.in_season_weekly],
  ];

  return groups.map(([key, label, bankroll]) => {
    const picks = official.filter((pick) => pick.portfolio_name === key);
    const staked = picks.reduce((sum, pick) => sum + Number(pick.stake_units ?? 0), 0);
    const pending = picks.filter((pick) => pick.result_status === 'pending').length;
    const graded = picks.filter((pick) => pick.lifecycle === 'graded' || pick.lifecycle === 'void').length;
    const net = picks.reduce((sum, pick) => sum + Number(pick.net_units ?? 0), 0);
    const dollarsAtRisk = picks.reduce((sum, pick) => sum + Number(pick.stake_usd ?? 0), 0);
    return `<tr>
      <td><strong>${escapeHtml(label)}</strong><div class="muted">${escapeHtml(key)}</div></td>
      <td>${escapeHtml(fmtMoney(bankroll?.bankroll_usd))}</td>
      <td>${escapeHtml(fmtMoney(bankroll?.unit_usd))}</td>
      <td>${escapeHtml(picks.length)}</td>
      <td>${escapeHtml(fmtUnits(staked))}<div class="muted">${escapeHtml(fmtMoney(dollarsAtRisk))}</div></td>
      <td>${escapeHtml(pending)}</td>
      <td>${escapeHtml(graded)}</td>
      <td>${escapeHtml(fmtUnits(net))}</td>
    </tr>`;
  }).join('\n');
}

function resultBadgeClass(pick) {
  if (pick.result_status === 'won' || pick.result_status === 'half_won') return 'good';
  if (pick.result_status === 'lost' || pick.result_status === 'half_lost') return 'bad';
  if (pick.result_status === 'pending') return 'info';
  return 'warn';
}

function pickCards(config, picks) {
  if (!picks.length) return '<div class="empty">No picks recorded.</div>';
  return picks.map((pick) => {
    const report = validationReport(config, pick);
    const checks = [...report.errors, ...report.warnings, ...report.info].join(' | ') || 'Clear';
    const price = `${fmt(pick.book)} ${fmt(pick.price, '')}`.trim();
    const line = pick.line === null || pick.line === undefined ? '' : ` / line ${pick.line}`;
    const scope = pick.pick_scope === 'weekly' ? `Weekly${pick.week ? ` / Week ${pick.week}` : ''}` : 'Futures';
    return `<details class="pick-card" open>
      <summary>
        <span>
          <strong>${escapeHtml(pick.selection)}</strong>
          <span class="muted">${escapeHtml(scope)} / ${escapeHtml(fmt(pick.market_type))}</span>
        </span>
        <span class="badge ${resultBadgeClass(pick)}">${escapeHtml(fmt(pick.result_status))}</span>
      </summary>
      <div class="pick-grid">
        <div><span>Stake</span><strong>${escapeHtml(fmtUnits(pick.stake_units))}</strong><small>${escapeHtml(fmtMoney(pick.stake_usd))}</small></div>
        <div><span>Price</span><strong>${escapeHtml(price || '-')}</strong><small>${escapeHtml(line.replace(/^ \/ /, 'Line '))}</small></div>
        <div><span>Confidence</span><strong>${escapeHtml(fmt(pick.confidence))}</strong><small>${escapeHtml(fmt(pick.stake_tier))}</small></div>
        <div><span>Net</span><strong>${escapeHtml(fmtUnits(pick.net_units))}</strong><small>${escapeHtml(fmt(pick.lifecycle))}</small></div>
      </div>
      <dl>
        <dt>Team</dt><dd>${escapeHtml(fmt(pick.team))}${pick.opponent ? ` vs ${escapeHtml(pick.opponent)}` : ''}</dd>
        <dt>Observed</dt><dd>${escapeHtml(fmtDate(pick.observed_at))}</dd>
        <dt>Source</dt><dd>${escapeHtml(fmt(pick.source_ref || pick.source_url))}</dd>
        <dt>Threshold</dt><dd>${escapeHtml(fmt(pick.bet_threshold || pick.minimum_edge_pct || pick.edge_pct))}</dd>
        <dt>Market View</dt><dd>${escapeHtml(fmt(pick.market_view))}</dd>
        <dt>Football View</dt><dd>${escapeHtml(fmt(pick.football_view))}</dd>
        <dt>Disconfirming Factor</dt><dd>${escapeHtml(fmt(pick.disconfirming_factor))}</dd>
        <dt>Evidence</dt><dd>${escapeHtml(pick.evidence_ids?.length ? pick.evidence_ids.join(', ') : '-')}</dd>
        <dt>Checks</dt><dd>${escapeHtml(checks)}</dd>
      </dl>
    </details>`;
  }).join('\n');
}

function renderHtmlReport(config, ledger, ledgerPath) {
  const summary = ledgerSummary(ledger);
  const picks = [...ledger.picks].sort((a, b) => pickSortValue(b) - pickSortValue(a));
  const pendingPicks = picks.filter((pick) => pick.result_status === 'pending');
  const gradedPicks = picks.filter((pick) => pick.lifecycle === 'graded' || pick.lifecycle === 'void');
  const cards = [
    ['Official Paper', summary.official_paper, 'locked fake picks'],
    ['Pending', summary.pending, 'awaiting result'],
    ['Graded', summary.graded, 'settled picks'],
    ['Staked Units', fmtUnits(summary.staked_units), 'paper exposure'],
    ['Net Units', fmtUnits(summary.net_units), 'graded results only'],
    ['ROI', fmtPct(summary.roi), 'net / staked'],
  ].map(([label, value]) => `<div class="metric"><div>${escapeHtml(label)}</div><strong>${escapeHtml(value)}</strong></div>`).join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(ledger.meta.display_name)} Official Picks</title>
  <style>
    :root { color-scheme: light; --ink:#17202a; --muted:#607080; --line:#d8dee6; --paper:#ffffff; --band:#f4f7fb; --good:#0f766e; --warn:#a16207; --bad:#b42318; --info:#2563eb; }
    body { margin:0; font:14px/1.45 system-ui,-apple-system,Segoe UI,sans-serif; color:var(--ink); background:var(--band); }
    header { padding:28px 32px 20px; background:var(--paper); border-bottom:1px solid var(--line); }
    main { max-width:1180px; margin:0 auto; padding:24px; }
    h1 { margin:0 0 6px; font-size:28px; letter-spacing:0; }
    h2 { margin:28px 0 12px; font-size:18px; }
    .muted { color:var(--muted); font-size:12px; }
    .metrics { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:10px; margin-top:18px; }
    .metric { background:var(--paper); border:1px solid var(--line); border-radius:8px; padding:12px; }
    .metric strong { display:block; font-size:20px; margin-top:3px; }
    .panel { background:var(--paper); border:1px solid var(--line); border-radius:8px; padding:14px; margin-top:12px; }
    .guardrails { background:var(--paper); border:1px solid var(--line); border-radius:8px; padding:14px 18px; }
    .guardrails li { margin:4px 0; }
    table { width:100%; border-collapse:collapse; background:var(--paper); border:1px solid var(--line); border-radius:8px; overflow:hidden; }
    th, td { text-align:left; vertical-align:top; border-bottom:1px solid var(--line); padding:10px; }
    th { font-size:12px; text-transform:uppercase; color:var(--muted); background:#eef3f8; }
    tr:last-child td { border-bottom:0; }
    .badge { display:inline-block; border-radius:999px; padding:3px 8px; color:white; font-size:12px; white-space:nowrap; }
    .good { background:var(--good); }
    .warn { background:var(--warn); }
    .bad { background:var(--bad); }
    .info { background:var(--info); }
    .pick-card { background:var(--paper); border:1px solid var(--line); border-radius:8px; margin:10px 0; overflow:hidden; }
    .pick-card summary { cursor:pointer; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 14px; }
    .pick-card summary strong { display:block; font-size:16px; }
    .pick-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:10px; padding:0 14px 12px; }
    .pick-grid div { border:1px solid var(--line); border-radius:8px; padding:10px; }
    .pick-grid span, .pick-grid small { display:block; color:var(--muted); font-size:12px; }
    .pick-grid strong { display:block; font-size:18px; margin:2px 0; }
    dl { display:grid; grid-template-columns:160px 1fr; gap:8px 12px; border-top:1px solid var(--line); margin:0; padding:14px; }
    dt { color:var(--muted); font-size:12px; text-transform:uppercase; }
    dd { margin:0; }
    .empty { text-align:center; color:var(--muted); padding:28px; }
    @media (max-width:700px) {
      dl { grid-template-columns:1fr; }
      .pick-card summary { align-items:flex-start; flex-direction:column; }
    }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(ledger.meta.display_name)} Official Picks Ledger</h1>
    <div class="muted">Generated ${escapeHtml(nowIso())} from ${escapeHtml(path.relative(ROOT, ledgerPath))}</div>
  </header>
  <main>
    <section class="metrics">${cards}</section>
    <h2>Guardrails</h2>
    <ul class="guardrails">
      <li>Local report only. No Supabase write.</li>
      <li>Proposals are not official picks until human-verified and locked.</li>
      <li>Exacta and Super Bowl matchup markets are monitor-only while the BetOnline price-shopping hold is active.</li>
    </ul>
    <h2>Portfolio Exposure</h2>
    <table>
      <thead><tr><th>Portfolio</th><th>Bankroll</th><th>Unit</th><th>Picks</th><th>Staked</th><th>Pending</th><th>Graded</th><th>Net</th></tr></thead>
      <tbody>${portfolioRows(ledger)}</tbody>
    </table>
    <h2>Pending Picks</h2>
    ${pickCards(config, pendingPicks)}
    <h2>Graded Picks</h2>
    ${gradedPicks.length ? pickCards(config, gradedPicks) : '<div class="panel muted">No picks have been graded yet.</div>'}
    <h2>All Picks</h2>
    ${pickCards(config, picks)}
  </main>
</body>
</html>`;
}

async function loadInboxItems(config, inboxDir) {
  const files = await listJsonFiles(inboxDir);
  const items = [];
  for (const file of files) {
    try {
      const proposal = await readJson(file);
      items.push({
        file,
        proposal,
        readiness: validationReport(config, proposal),
      });
    } catch (err) {
      items.push({
        file,
        proposal: null,
        readiness: {
          proposal_ready: false,
          lock_ready: false,
          exacta_hold: false,
          errors: [`Cannot read proposal: ${err.message}`],
          warnings: [],
          info: [],
        },
      });
    }
  }
  return items;
}

function renderInboxMarkdown(items, inboxDir) {
  const lines = [
    '# Platinum Rose AI Candidate Inbox',
    '',
    `Generated: ${nowIso()}`,
    `Active inbox: ${path.relative(ROOT, inboxDir)}`,
    `Active drafts: ${items.length}`,
    '',
    '> Draft proposals only. Promotion records a ledger proposal, not an official paper pick.',
    '',
    '## Active Drafts',
    '',
  ];
  if (!items.length) {
    lines.push('_No active draft proposals._');
  } else {
    for (const item of items) {
      const p = item.proposal || {};
      const status = item.readiness.proposal_ready ? 'proposal-ready' : 'needs work';
      lines.push(`- **${fmt(p.selection)}** (${fmt(p.market_type)}) - ${fmt(p.book)} ${fmt(p.price)} - ${fmtUnits(p.stake_units)} - ${status}${item.readiness.exacta_hold ? ' - exacta hold' : ''}`);
      lines.push(`  - File: ${path.relative(ROOT, item.file)}`);
      if (item.readiness.errors.length) lines.push(`  - Errors: ${item.readiness.errors.join(' | ')}`);
      if (item.readiness.warnings.length) lines.push(`  - Warnings: ${item.readiness.warnings.join(' | ')}`);
      if (item.readiness.info.length) lines.push(`  - Info: ${item.readiness.info.join(' | ')}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

function renderInboxHtml(items, inboxDir) {
  const rows = items.length ? items.map((item) => {
    const p = item.proposal || {};
    const badgeClass = item.readiness.proposal_ready ? 'warn' : 'bad';
    const badge = item.readiness.proposal_ready ? 'Proposal-ready' : 'Needs work';
    const checks = [...item.readiness.errors, ...item.readiness.warnings, ...item.readiness.info].join(' | ') || 'Clear';
    return `<tr>
      <td><span class="badge ${badgeClass}">${escapeHtml(badge)}</span>${item.readiness.exacta_hold ? ' <span class="badge bad">Hold</span>' : ''}</td>
      <td><strong>${escapeHtml(fmt(p.selection))}</strong><div class="muted">${escapeHtml(path.relative(ROOT, item.file))}</div></td>
      <td>${escapeHtml(fmt(p.market_type))}</td>
      <td>${escapeHtml(fmt(p.book))} ${escapeHtml(fmt(p.price, ''))}${p.line === null || p.line === undefined ? '' : `<div class="muted">Line ${escapeHtml(p.line)}</div>`}</td>
      <td>${escapeHtml(fmtUnits(p.stake_units))}</td>
      <td>${escapeHtml(fmt(p.confidence))}</td>
      <td>${escapeHtml(checks)}</td>
    </tr>`;
  }).join('\n') : '<tr><td colspan="7" class="empty">No active draft proposals.</td></tr>';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Platinum Rose AI Candidate Inbox</title>
  <style>
    :root { color-scheme: light; --ink:#17202a; --muted:#607080; --line:#d8dee6; --paper:#ffffff; --band:#f4f7fb; --warn:#a16207; --bad:#b42318; }
    body { margin:0; font:14px/1.45 system-ui,-apple-system,Segoe UI,sans-serif; color:var(--ink); background:var(--band); }
    header { padding:28px 32px 20px; background:var(--paper); border-bottom:1px solid var(--line); }
    main { max-width:1180px; margin:0 auto; padding:24px; }
    h1 { margin:0 0 6px; font-size:28px; letter-spacing:0; }
    .muted { color:var(--muted); font-size:12px; }
    table { width:100%; border-collapse:collapse; background:var(--paper); border:1px solid var(--line); border-radius:8px; overflow:hidden; }
    th, td { text-align:left; vertical-align:top; border-bottom:1px solid var(--line); padding:10px; }
    th { font-size:12px; text-transform:uppercase; color:var(--muted); background:#eef3f8; }
    tr:last-child td { border-bottom:0; }
    .badge { display:inline-block; border-radius:999px; padding:3px 8px; color:white; font-size:12px; white-space:nowrap; background:var(--warn); }
    .bad { background:var(--bad); }
    .empty { text-align:center; color:var(--muted); padding:28px; }
  </style>
</head>
<body>
  <header>
    <h1>Platinum Rose AI Candidate Inbox</h1>
    <div class="muted">Generated ${escapeHtml(nowIso())} from ${escapeHtml(path.relative(ROOT, inboxDir))}</div>
  </header>
  <main>
    <table>
      <thead><tr><th>Readiness</th><th>Selection</th><th>Market</th><th>Price</th><th>Stake</th><th>Confidence</th><th>Checks</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </main>
</body>
</html>`;
}

async function cmdInit({ ledgerPath, config }) {
  const ledger = await loadLedger(ledgerPath, config);
  await writeJson(ledgerPath, ledger);
  console.log(`Ledger ready: ${path.relative(ROOT, ledgerPath)}`);
  console.log(`Picks: ${ledger.picks.length}`);
}

async function cmdNew({ args, config }) {
  const proposal = templateProposal(config, args);
  const outPath = resolveRepoPath(args.out || defaultProposalPath(proposal));
  await writeJson(outPath, proposal);
  console.log(`Draft proposal template created: ${path.relative(ROOT, outPath)}`);
  console.log('Status: draft only, not proposed and not official.');
}

async function cmdValidate({ args, ledgerPath, config }) {
  let candidate;
  let label;
  if (args.file) {
    label = args.file;
    candidate = await readJson(resolveRepoPath(args.file));
  } else if (args['pick-id']) {
    const ledger = await loadLedger(ledgerPath, config);
    label = args['pick-id'];
    candidate = findPick(ledger, args['pick-id']);
  } else {
    throw new Error('validate requires --file <proposal.json> or --pick-id <id>.');
  }

  const report = validationReport(config, candidate);
  console.log(JSON.stringify({ target: label, ...report }, null, 2));
  if (args.strict && (!report.proposal_ready || report.warnings.length)) {
    process.exitCode = 1;
  }
}

async function recordProposalFromFile({ file, ledgerPath, config }) {
  const ledger = await loadLedger(ledgerPath, config);
  const rawProposal = await readJson(resolveRepoPath(file));
  const report = validationReport(config, rawProposal);
  if (!report.proposal_ready) {
    throw new Error(`Proposal is not ready:\n- ${report.errors.join('\n- ')}`);
  }
  const proposal = normalizeProposal(config, rawProposal);
  if (ledger.picks.some((p) => p.pick_id === proposal.pick_id)) {
    throw new Error(`Duplicate pick_id ${proposal.pick_id}.`);
  }
  ledger.picks.push(proposal);
  addEvent(ledger, proposal.pick_id, 'proposal_created', null, 'proposal', proposal.audit_note, {
    selection: proposal.selection,
    market_type: proposal.market_type,
    stake_units: proposal.stake_units,
  });
  updateLedgerMeta(ledger);
  await writeJson(ledgerPath, ledger);
  return proposal;
}

async function cmdPropose({ args, ledgerPath, config }) {
  if (!args.file) throw new Error('propose requires --file <proposal.json>.');
  const proposal = await recordProposalFromFile({ file: args.file, ledgerPath, config });
  console.log(`Proposal recorded: ${proposal.pick_id}`);
  console.log(`${proposal.selection} | ${proposal.book} ${proposal.price ?? ''} | ${proposal.stake_units}u`);
}

async function cmdPromote({ args, ledgerPath, config }) {
  if (!args.file) throw new Error('promote requires --file <proposal.json>.');
  const proposal = await recordProposalFromFile({ file: args.file, ledgerPath, config });
  const dest = await archiveProposalFile(args.file, args['promoted-dir'] || DEFAULT_PROMOTED_PROPOSAL_DIR, {
    state: 'promoted',
    promoted_at: nowIso(),
    ledger_path: path.relative(ROOT, ledgerPath),
    pick_id: proposal.pick_id,
    note: args.note || null,
  });
  console.log(`Draft promoted to ledger proposal: ${proposal.pick_id}`);
  console.log(`Archived draft: ${path.relative(ROOT, dest)}`);
}

function validateApprovableProposal(config, rawProposal) {
  const report = validationReport(config, rawProposal);
  if (!report.proposal_ready) {
    throw new Error(`Draft cannot be approved:\n- ${report.errors.join('\n- ')}`);
  }
  const candidate = normalizeProposal(config, rawProposal);
  candidate.lifecycle = 'human_verified';
  candidate.approval_state = 'human_verified';
  validateLockable(config, candidate);
  return candidate;
}

async function cmdApprove({ args, ledgerPath, config }) {
  if (!args.file) throw new Error('approve requires --file <proposal.json>.');
  const rawProposal = await readJson(resolveRepoPath(args.file));
  const proposal = validateApprovableProposal(config, rawProposal);
  const ledger = await loadLedger(ledgerPath, config);
  if (ledger.picks.some((p) => p.pick_id === proposal.pick_id)) {
    throw new Error(`Duplicate pick_id ${proposal.pick_id}.`);
  }

  const at = args['official-at'] || nowIso();
  proposal.lifecycle = 'official_paper';
  proposal.approval_state = 'official_paper';
  proposal.human_verified_at = at;
  proposal.official_at = at;
  proposal.locked_at = at;
  proposal.updated_at = at;
  proposal.audit_note = args.note || proposal.audit_note;
  ledger.picks.push(proposal);
  addEvent(ledger, proposal.pick_id, 'proposal_created', null, 'proposal', proposal.audit_note, {
    selection: proposal.selection,
    market_type: proposal.market_type,
    stake_units: proposal.stake_units,
    via: 'approve',
  });
  addEvent(ledger, proposal.pick_id, 'human_verified', 'proposal', 'human_verified', args.note ?? 'Approved as valid Platinum Rose AI paper pick.', {
    source_ref: proposal.source_ref,
    source_url: proposal.source_url,
    observed_at: proposal.observed_at,
  });
  addEvent(ledger, proposal.pick_id, 'official_locked', 'human_verified', 'official_paper', args.note ?? null, {
    selection: proposal.selection,
    price: proposal.price,
    stake_units: proposal.stake_units,
  });
  updateLedgerMeta(ledger);
  await writeJson(ledgerPath, ledger);

  const dest = await archiveProposalFile(args.file, args['promoted-dir'] || DEFAULT_PROMOTED_PROPOSAL_DIR, {
    state: 'approved_official_paper',
    approved_at: at,
    ledger_path: path.relative(ROOT, ledgerPath),
    pick_id: proposal.pick_id,
    note: args.note || null,
  });
  console.log(`Draft approved and locked as official paper pick: ${proposal.pick_id}`);
  console.log(`Archived draft: ${path.relative(ROOT, dest)}`);
}

async function cmdReject({ args }) {
  if (!args.file) throw new Error('reject requires --file <proposal.json>.');
  if (!args.reason) throw new Error('reject requires --reason <text>.');
  const dest = await archiveProposalFile(args.file, args['rejected-dir'] || DEFAULT_REJECTED_PROPOSAL_DIR, {
    state: 'rejected',
    rejected_at: nowIso(),
    reason: args.reason,
  });
  console.log(`Draft rejected: ${path.relative(ROOT, dest)}`);
}

async function cmdVerify({ args, ledgerPath, config }) {
  if (!args['pick-id']) throw new Error('verify requires --pick-id <id>.');
  const ledger = await loadLedger(ledgerPath, config);
  const pick = findPick(ledger, args['pick-id']);
  const fromState = pick.lifecycle;
  if (!['proposal', 'human_verified'].includes(pick.lifecycle)) {
    throw new Error(`Only proposal picks can be verified. Current lifecycle: ${pick.lifecycle}.`);
  }
  pick.lifecycle = 'human_verified';
  pick.approval_state = 'human_verified';
  pick.human_verified_at = args['verified-at'] || nowIso();
  pick.observed_at = args['observed-at'] || pick.observed_at;
  pick.source_ref = args['source-ref'] || pick.source_ref;
  pick.source_url = args['source-url'] || pick.source_url;
  pick.audit_note = args.note || pick.audit_note;
  pick.updated_at = nowIso();
  addEvent(ledger, pick.pick_id, 'human_verified', fromState, 'human_verified', args.note ?? null, {
    source_ref: pick.source_ref,
    source_url: pick.source_url,
    observed_at: pick.observed_at,
  });
  updateLedgerMeta(ledger);
  await writeJson(ledgerPath, ledger);
  console.log(`Human verification recorded: ${pick.pick_id}`);
}

async function cmdLock({ args, ledgerPath, config }) {
  if (!args['pick-id']) throw new Error('lock requires --pick-id <id>.');
  const ledger = await loadLedger(ledgerPath, config);
  const pick = findPick(ledger, args['pick-id']);
  validateLockable(config, pick);
  const fromState = pick.lifecycle;
  const at = args['official-at'] || nowIso();
  pick.lifecycle = 'official_paper';
  pick.approval_state = 'official_paper';
  pick.official_at = at;
  pick.locked_at = at;
  pick.updated_at = at;
  addEvent(ledger, pick.pick_id, 'official_locked', fromState, 'official_paper', args.note ?? null, {
    selection: pick.selection,
    price: pick.price,
    stake_units: pick.stake_units,
  });
  updateLedgerMeta(ledger);
  await writeJson(ledgerPath, ledger);
  console.log(`Official paper pick locked: ${pick.pick_id}`);
}

async function cmdGrade({ args, ledgerPath, config }) {
  if (!args['pick-id']) throw new Error('grade requires --pick-id <id>.');
  if (!VALID_RESULTS.has(args.result)) throw new Error(`result must be one of ${[...VALID_RESULTS].join(', ')}.`);
  const ledger = await loadLedger(ledgerPath, config);
  const pick = findPick(ledger, args['pick-id']);
  if (!['official_paper', 'graded'].includes(pick.lifecycle)) {
    throw new Error(`Only official_paper picks can be graded. Current lifecycle: ${pick.lifecycle}.`);
  }
  const fromState = pick.lifecycle;
  const netUnits = args['net-units'] === undefined ? defaultNetUnits(pick, args.result) : Number(args['net-units']);
  if (netUnits === null || !Number.isFinite(Number(netUnits))) {
    throw new Error('Unable to infer net units. Provide --net-units <n>.');
  }
  pick.lifecycle = args.result === 'void' ? 'void' : 'graded';
  pick.result_status = args.result;
  pick.net_units = Number(Number(netUnits).toFixed(4));
  pick.payout_units = args.result === 'won' || args.result === 'half_won' ? pick.net_units : null;
  pick.resolved_at = args['resolved-at'] || nowIso();
  pick.result_note = args.note || pick.result_note;
  pick.updated_at = nowIso();
  addEvent(ledger, pick.pick_id, 'graded', fromState, pick.lifecycle, args.note ?? null, {
    result_status: pick.result_status,
    net_units: pick.net_units,
  });
  updateLedgerMeta(ledger);
  await writeJson(ledgerPath, ledger);
  console.log(`Pick graded: ${pick.pick_id} ${pick.result_status} (${pick.net_units}u)`);
}

async function cmdList({ args, ledgerPath, config }) {
  const ledger = await loadLedger(ledgerPath, config);
  const picks = args.status ? ledger.picks.filter((p) => p.lifecycle === args.status) : ledger.picks;
  if (args.status && !VALID_LIFECYCLES.has(args.status)) {
    throw new Error(`status must be one of ${[...VALID_LIFECYCLES].join(', ')}.`);
  }
  if (!picks.length) {
    console.log('No picks found.');
    return;
  }
  for (const pick of picks) {
    console.log([
      pick.pick_id,
      pick.lifecycle,
      pick.pick_scope,
      pick.selection,
      `${pick.stake_units}u`,
      pick.result_status,
      `${pick.net_units ?? ''}`,
    ].join(' | '));
  }
}

async function cmdSummary({ ledgerPath, config }) {
  const ledger = await loadLedger(ledgerPath, config);
  console.log(JSON.stringify({
    ledger: path.relative(ROOT, ledgerPath),
    ...ledgerSummary(ledger),
  }, null, 2));
}

async function cmdReport({ args, ledgerPath, config }) {
  const ledger = await loadLedger(ledgerPath, config);
  const outDir = resolveRepoPath(args['out-dir'] || DEFAULT_REPORT_DIR);
  await mkdir(outDir, { recursive: true });
  const base = path.join(outDir, `${ledger.meta.ledger_id}-ledger`);
  const htmlPath = `${base}.html`;
  const mdPath = `${base}.md`;
  await writeFile(mdPath, renderMarkdownReport(config, ledger, ledgerPath), 'utf8');
  await writeFile(htmlPath, renderHtmlReport(config, ledger, ledgerPath), 'utf8');
  console.log(`Markdown report: ${mdPath}`);
  console.log(`HTML report: ${htmlPath}`);
}

async function cmdInbox({ args, config }) {
  const inboxDir = resolveRepoPath(args['inbox-dir'] || DEFAULT_ACTIVE_PROPOSAL_DIR);
  const outDir = resolveRepoPath(args['out-dir'] || DEFAULT_REPORT_DIR);
  const items = await loadInboxItems(config, inboxDir);
  await mkdir(outDir, { recursive: true });
  const base = path.join(outDir, 'platinum_rose_ai_candidate_inbox');
  const mdPath = `${base}.md`;
  const htmlPath = `${base}.html`;
  await writeFile(mdPath, renderInboxMarkdown(items, inboxDir), 'utf8');
  await writeFile(htmlPath, renderInboxHtml(items, inboxDir), 'utf8');
  console.log(`Active drafts: ${items.length}`);
  console.log(`Markdown inbox: ${mdPath}`);
  console.log(`HTML inbox: ${htmlPath}`);
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || command === '--help' || command === 'help') {
    console.log(usage());
    return;
  }

  const args = parseArgs(rest);
  const config = await readJson(resolveRepoPath(args.config || DEFAULT_CONFIG));
  const ledgerPath = resolveRepoPath(args.ledger || DEFAULT_LEDGER);

  if (command === 'init') return cmdInit({ args, ledgerPath, config });
  if (command === 'new') return cmdNew({ args, ledgerPath, config });
  if (command === 'inbox') return cmdInbox({ args, ledgerPath, config });
  if (command === 'approve') return cmdApprove({ args, ledgerPath, config });
  if (command === 'promote') return cmdPromote({ args, ledgerPath, config });
  if (command === 'reject') return cmdReject({ args, ledgerPath, config });
  if (command === 'validate') return cmdValidate({ args, ledgerPath, config });
  if (command === 'propose') return cmdPropose({ args, ledgerPath, config });
  if (command === 'verify') return cmdVerify({ args, ledgerPath, config });
  if (command === 'lock') return cmdLock({ args, ledgerPath, config });
  if (command === 'grade') return cmdGrade({ args, ledgerPath, config });
  if (command === 'list') return cmdList({ args, ledgerPath, config });
  if (command === 'summary') return cmdSummary({ args, ledgerPath, config });
  if (command === 'report') return cmdReport({ args, ledgerPath, config });

  throw new Error(`Unknown command: ${command}\n\n${usage()}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
