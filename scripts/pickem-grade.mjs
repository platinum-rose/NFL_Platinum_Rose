// scripts/pickem-grade.mjs
// ─────────────────────────────────────────────────────────────────────────────
// Grade a week's pick'em / confidence-pool picks against final scores.
//   picks:   data/pickem/picks-2026-wNN.json (what Andy actually submitted);
//            games missing there fall back to data/pickem/plan-2026-wNN.json
//            and are marked from_plan.
//   scores:  Supabase game_results (written by nfl-auto-grade), or --results-file
// Writes data/pickem/results-2026-wNN.json and prints a per-pool summary.
// Usage: node scripts/pickem-grade.mjs --week 3 [--results-file rows.json]
// ─────────────────────────────────────────────────────────────────────────────
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { gradePool, normTeam } from './lib/pickem.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SEASON = 2026;
const arg = (n) => { const i = process.argv.indexOf(n); return i !== -1 ? process.argv[i + 1] : null; };
const pad = (w) => String(w).padStart(2, '0');
const readJson = async (p, fb = null) => { try { return JSON.parse(await readFile(p, 'utf8')); } catch { return fb; } };

async function loadResults(week) {
  if (arg('--results-file')) return readJson(path.resolve(arg('--results-file')), []);
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / key missing in .env (or pass --results-file).');
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb.from('game_results')
    .select('home_team, away_team, home_score, away_score, status, week')
    .eq('season', SEASON).eq('week', week);
  if (error) throw new Error(`game_results: ${error.message}`);
  return data || [];
}

async function main() {
  const week = Number(arg('--week'));
  if (!week) throw new Error('--week is required');
  const cfg = await readJson(path.join(ROOT, 'data', 'pickem', `pools-${SEASON}.json`));
  const picksFile = await readJson(path.join(ROOT, 'data', 'pickem', `picks-${SEASON}-w${pad(week)}.json`), { pools: {} });
  const planFile = await readJson(path.join(ROOT, 'data', 'pickem', `plan-${SEASON}-w${pad(week)}.json`), { plans: [] });
  const results = await loadResults(week);

  const pools = cfg.pools.map(pool => {
    const submitted = picksFile.pools?.[pool.id] || {};
    const plan = planFile.plans.find(p => p.pool_id === pool.id);
    const picks = Object.entries(submitted).map(([team, v]) => ({ team: normTeam(team), confidence: v.confidence ?? null, status: v.status || 'submitted' }));
    const covered = new Set(picks.map(p => p.team));
    for (const p of plan?.picks || []) {
      if (covered.has(p.team) || covered.has(p.opp)) continue;
      picks.push({ team: p.team, confidence: p.confidence ?? null, status: 'from_plan' });
    }
    const graded = gradePool(picks, results, pool.format);
    return { pool_id: pool.id, format: pool.format, ...graded, from_plan: picks.filter(p => p.status === 'from_plan').length };
  });

  const out = { schema: 'pickem_results_v1', season: SEASON, week, graded_at: new Date().toISOString(), pools };
  const outPath = path.join(ROOT, 'data', 'pickem', `results-${SEASON}-w${pad(week)}.json`);
  await writeFile(outPath, JSON.stringify(out, null, 2) + '\n');
  for (const p of pools) {
    console.log(`  ${p.pool_id.padEnd(17)} ${p.points}/${p.max_points} pts · ${p.correct}/${p.graded} correct (${p.total - p.graded} pending)${p.from_plan ? ` · ${p.from_plan} picks taken from the plan (not confirmed)` : ''}`);
  }
  console.log(`✅ ${path.relative(ROOT, outPath)}`);
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
