// scripts/pickem-card.mjs
// ─────────────────────────────────────────────────────────────────────────────
// Weekly pick'em / confidence-pool card (2026-09-24).
//
// Reads (0 TheOddsAPI credits):
//   - Supabase game_odds_snapshots moneyline rows for the week (closing line per
//     game once it has kicked off), or --odds-file <json rows> offline
//   - data/pickem/pools-2026.json          pool formats, prizes, strategy profiles, standings
//   - data/pickem/leans-2026-wNN.json      dogs the betting card's evidence likes (optional)
//   - data/pickem/picks-2026-wNN.json      picks already made / locked per pool (optional)
// Writes:
//   - data/pickem/plan-2026-wNN.json
//   - reports/pickem/2026-wNN-pickem.md
//
// Usage: node scripts/pickem-card.mjs [--week 3] [--odds-file rows.json]
// ─────────────────────────────────────────────────────────────────────────────
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { buildGames, planPool } from './lib/pickem.mjs';

const require = createRequire(import.meta.url);
const { weekFromDate } = require('../packages/shared/src/week-utils');

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const SEASON = 2026;

function arg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : null;
}
const pad = (w) => String(w).padStart(2, '0');

async function readJson(p, fallback = null) {
  try { return JSON.parse(await readFile(p, 'utf8')); } catch { return fallback; }
}

async function loadOddsRows(week) {
  const file = arg('--odds-file');
  if (file) return readJson(path.resolve(file), []);
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / key missing in .env (or pass --odds-file).');
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const since = new Date(Date.now() - 10 * 86400 * 1000).toISOString();
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from('game_odds_snapshots')
      .select('game_id, home_team, away_team, commence_time, book, market, home_price, away_price, captured_at')
      .eq('season', SEASON).eq('week', week).eq('market', 'moneyline')
      .gte('captured_at', since)
      .order('id', { ascending: true })
      .range(from, from + 999);
    if (error) throw new Error(`game_odds_snapshots: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

const ptTime = (iso) => new Date(iso).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', weekday: 'short', hour: 'numeric', minute: '2-digit' });
const pct = (p) => `${(p * 100).toFixed(1)}%`;

function renderPool(pool, plan, now) {
  const lines = [];
  lines.push(`## ${pool.name}`);
  lines.push(`${pool.format === 'confidence' ? 'Confidence' : 'Straight-up'} · ${pool.entrants_note || pool.entrants} entrants · prizes: ${pool.prizes.join(', ')} · strategy: **${pool.strategy}**`);
  if (pool.standings) {
    const s = pool.standings;
    lines.push(`Standings (${s.as_of || '?'}): rank ${s.rank ?? '?'} of ${s.entrants ?? pool.entrants}, ${s.points ?? '?'} pts${s.leader_points != null ? ` (leader ${s.leader_points})` : ''}${s.notes ? ` — ${s.notes}` : ''}`);
  } else {
    lines.push('Standings: not entered yet.');
  }
  lines.push('');
  lines.push(`Expected ${pool.format === 'confidence' ? 'points' : 'wins'}: **${plan.ev}** vs market-only ${plan.baseline_ev} (cost ${plan.ev_cost}).`);
  lines.push('');
  const head = pool.format === 'confidence' ? '| Conf | Pick | vs | Win % | Kickoff (PT) | Status | Note |' : '| Pick | vs | Win % | Kickoff (PT) | Status | Note |';
  lines.push(head);
  lines.push(head.replace(/[^|]+/g, '---'));
  for (const p of plan.picks) {
    const started = new Date(p.commence_time) <= now;
    const status = p.source === 'locked' ? p.status : (started ? 'KICKED OFF — not recorded' : 'open');
    const note = p.source === 'heavy_fade' ? `heavy-fav fade (tier ${p.tier}): ${p.why}`
      : p.source === 'coinflip_flip' ? `coin-flip flip (tier ${p.tier}): ${p.why}`
      : p.against_market ? 'against market (locked)' : '';
    const cells = [p.team, p.opp, pct(p.p), ptTime(p.commence_time), status, note];
    lines.push(`| ${pool.format === 'confidence' ? `${p.confidence} | ` : ''}${cells.join(' | ')} |`);
  }
  lines.push('');
  return lines.join('\n');
}

async function main() {
  const now = new Date();
  const week = Number(arg('--week') || weekFromDate(now.toISOString(), SEASON));
  const cfg = await readJson(path.join(ROOT, 'data', 'pickem', `pools-${SEASON}.json`));
  if (!cfg) throw new Error('data/pickem/pools-2026.json missing');
  const leans = (await readJson(path.join(ROOT, 'data', 'pickem', `leans-${SEASON}-w${pad(week)}.json`), { leans: [] })).leans || [];
  const picksFile = await readJson(path.join(ROOT, 'data', 'pickem', `picks-${SEASON}-w${pad(week)}.json`), { pools: {} });

  const rows = await loadOddsRows(week);
  const games = buildGames(rows);
  if (!games.length) throw new Error(`No Week ${week} moneyline rows in game_odds_snapshots.`);
  const oddsAsOf = games.map(g => g.odds_captured_at).filter(Boolean).sort().at(-1);
  console.log(`🏈 Week ${week}: ${games.length} games · odds as of ${oddsAsOf} · ${leans.length} evidence leans`);

  const plans = cfg.pools.map(pool => ({ pool, plan: planPool(pool, games, leans, picksFile.pools?.[pool.id] || {}) }));

  const out = {
    schema: 'pickem_plan_v1', season: SEASON, week, generated_at: now.toISOString(), odds_as_of: oddsAsOf,
    source: arg('--odds-file') ? `file:${arg('--odds-file')}` : 'supabase:game_odds_snapshots (moneyline, de-vigged, book average)',
    games, plans: plans.map(x => x.plan),
  };
  await mkdir(path.join(ROOT, 'reports', 'pickem'), { recursive: true });
  const planPath = path.join(ROOT, 'data', 'pickem', `plan-${SEASON}-w${pad(week)}.json`);
  await writeFile(planPath, JSON.stringify(out, null, 2) + '\n');

  const md = [
    `# ${SEASON} Week ${week} — pick'em & confidence pools`,
    '',
    `Generated ${now.toISOString()} by \`scripts/pickem-card.mjs\`. Win % = de-vigged moneyline averaged across books (odds as of ${oddsAsOf}; closing line for games already started). Evidence leans: \`data/pickem/leans-${SEASON}-w${pad(week)}.json\`. Picks already made: \`data/pickem/picks-${SEASON}-w${pad(week)}.json\`. Proposals only — Andy submits.`,
    '',
    ...plans.map(({ pool, plan }) => renderPool(pool, plan, now)),
    '## How the strategies work',
    '- **market** — every favorite; confidence ranked by win probability (maximizes expected points; cumulative prizes).',
    '- **weekly_leverage** — market ranking plus ≤1 heavy-favorite fade at a low slot and ≤2 contrarian sides on near coin flips, each backed by tier 1–2 evidence, within the pool\'s expected-points budget.',
    '- **su_flips** — straight-up favorites; flip ≤2 near coin flips where tier 1–2 evidence backs the dog.',
    '',
  ].join('\n');
  const mdPath = path.join(ROOT, 'reports', 'pickem', `${SEASON}-w${pad(week)}-pickem.md`);
  await writeFile(mdPath, md);

  for (const { pool, plan } of plans) {
    const flips = plan.flips.map(f => `${f.team}${f.confidence ? `@${f.confidence}` : ''}`).join(', ') || 'none';
    console.log(`  ${pool.id.padEnd(17)} EV ${plan.ev} (market ${plan.baseline_ev}, cost ${plan.ev_cost}) · against market: ${flips}`);
  }
  console.log(`✅ ${path.relative(ROOT, mdPath)} · ${path.relative(ROOT, planPath)}`);
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
