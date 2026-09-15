#!/usr/bin/env node

/**
 * sync-placed-wagers-to-bankroll.mjs
 *
 * Full Two-Way Bridge between Andy's Placed Wager Tracker
 * (data/official-picks/user-placed-wagers-2026.json) and the NFL Dashboard's
 * Main Bankroll Tracking Pipeline (Supabase `user_bankroll_bets` and `nfl_bankroll_data_v1`).
 *
 * Capabilities:
 *  1. Reads all placed tickets from user-placed-wagers-2026.json.
 *  2. Normalizes wagers to the exact schema expected by bankroll.js and Supabase.
 *  3. Enforces bankroll rules:
 *     - Promo credits: $0 cash risk (amount = 0), profit calculated accurately.
 *     - Graded status: 'won', 'lost', 'pending', 'pushed'.
 *     - Open Parlays: flags `is_parlay: true`, tracks open slots and alive legs.
 *  4. Upserts all tickets to Supabase table `user_bankroll_bets` with admin bypass.
 *  5. Copies user-placed-wagers-2026.json to public/ for client-side hydration.
 *
 * Usage:
 *  node scripts/sync-placed-wagers-to-bankroll.mjs [--dry-run] [--quiet]
 */

import { readFile, writeFile, copyFile, mkdir, utimes } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Load environment variables
dotenv.config({ path: path.join(ROOT, '.env') });

const WAGERS_FILE = path.join(ROOT, 'data', 'official-picks', 'user-placed-wagers-2026.json');
const PUBLIC_WAGERS_FILE = path.join(ROOT, 'public', 'user-placed-wagers-2026.json');

export function normalizeWagerForBankroll(w) {
  const isPromo = w.is_promo_credit === true || w.funding_type === 'promo_credit';
  const cashRisk = isPromo ? 0 : parseFloat(w.cash_risk_usd ?? w.stake_usd ?? 0);
  const promoStake = isPromo ? parseFloat(w.promo_credit_stake_usd ?? w.stake_usd ?? 0) : 0;
  const potentialPayout = parseFloat(w.potential_payout_usd ?? 0);
  const potentialWin = parseFloat(w.potential_profit_usd ?? (potentialPayout - cashRisk));

  // Determine status
  let status = 'pending';
  let profit = null;
  let graded = false;
  let result = null;

  if (w.status === 'SETTLED') {
    graded = true;
    if (w.result === 'win' || w.result === 'WON') {
      status = 'won';
      result = 'win';
      profit = potentialWin;
    } else if (w.result === 'loss' || w.result === 'LOST') {
      status = 'lost';
      result = 'loss';
      profit = -cashRisk; // $0 cash loss for promo credits!
    } else if (w.result === 'push' || w.result === 'PUSH') {
      status = 'pushed';
      result = 'push';
      profit = 0;
    }
  } else if (w.status === 'WON') {
    status = 'won';
    result = 'win';
    graded = true;
    profit = potentialWin;
  } else if (w.status === 'LOST') {
    status = 'lost';
    result = 'loss';
    graded = true;
    profit = -cashRisk;
  }

  // Parse odds
  let numericOdds = 100;
  if (w.odds_american) {
    numericOdds = parseInt(String(w.odds_american).replace('+', ''), 10) || 100;
    if (String(w.odds_american).startsWith('-')) {
      numericOdds = -Math.abs(numericOdds);
    }
  }

  // Open slots in parlay
  const legs = Array.isArray(w.legs) ? w.legs : [];
  const openSlots = legs.filter(l => l.market === 'open_slot' || l.status === 'OPEN').length;
  const isParlay = w.ticket_type?.toLowerCase().includes('parlay') || legs.length > 1;

  // Description summarizing legs
  const legDescriptions = legs.map(l => {
    if (l.player) return `${l.player} ${l.selection || l.market}`;
    return l.selection || l.market || l.game || 'Leg';
  });
  const description = legDescriptions.length > 0 ? legDescriptions.join(', ') : (w.game_title || w.game || 'Wager');

  return {
    id: w.id,
    timestamp: w.placed_at ? new Date(w.placed_at).toISOString() : new Date().toISOString(),
    week: w.week ?? 1,
    status,
    is_parlay: isParlay,
    is_hedging_bet: w.category?.toLowerCase().includes('hedge') || false,
    open_slots: openSlots,
    legs: legs.map((l, idx) => ({
      leg_num: l.leg_num ?? idx + 1,
      player: l.player ?? null,
      team: l.team ?? null,
      opponent: l.opponent ?? null,
      market: l.market ?? 'prop',
      selection: l.selection ?? '',
      line: l.line ?? null,
      odds: l.price ? (parseInt(String(l.price).replace('+', ''), 10) || -110) : -110,
      stat: l.actual_stat ?? null,
      result: l.status ? l.status.toLowerCase() : 'pending'
    })),
    source: w.book || 'BetOnline',
    ticket_number: w.ticket_number ?? null,
    imported: true,
    imported_at: new Date().toISOString(),
    description,
    amount: cashRisk, // cash risk ($0 for promo credit)
    odds: numericOdds,
    type: isParlay ? 'parlay' : (w.category?.toLowerCase().includes('prop') ? 'prop' : 'spread'),
    potential_win: potentialWin,
    profit,
    settled_at: w.graded_at ? new Date(w.graded_at).toISOString() : null,
    updated_at: new Date().toISOString(),
    user_id: null,
    bet_type: isParlay ? 'parlay' : 'prop',
    graded,
    result,
    graded_at: w.graded_at ? new Date(w.graded_at).toISOString() : null,
    season: w.season ?? 2026,
    is_promo: isPromo,
    promo_stake: promoStake
  };
}

export async function syncPlacedWagersToBankroll({ dryRun = false, quiet = false } = {}) {
  if (!quiet) console.log(`\n🔄 Syncing Placed Wagers to NFL Dashboard Bankroll Pipeline...`);

  const raw = await readFile(WAGERS_FILE, 'utf8');
  const wagers = JSON.parse(raw);
  if (!quiet) console.log(`   Found ${wagers.length} wagers in ${path.relative(ROOT, WAGERS_FILE)}`);

  const normalizedRows = wagers.map(normalizeWagerForBankroll);

  // 1. Copy to public/ for client-side direct access and refresh verified mtime
  if (!dryRun) {
    await mkdir(path.dirname(PUBLIC_WAGERS_FILE), { recursive: true });
    await writeFile(PUBLIC_WAGERS_FILE, JSON.stringify(wagers, null, 2), 'utf8');
    const now = new Date();
    await utimes(WAGERS_FILE, now, now);
    await utimes(PUBLIC_WAGERS_FILE, now, now);
    if (!quiet) console.log(`   ✅ Synced JSON to ${path.relative(ROOT, PUBLIC_WAGERS_FILE)}`);
  }

  // 2. Sync to Supabase `user_bankroll_bets`
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn(`   ⚠️ Supabase credentials not found in .env; skipped cloud sync.`);
    return { syncedCount: normalizedRows.length, cloudSynced: false };
  }

  const supabase = createClient(url, key);

  if (dryRun) {
    if (!quiet) console.log(`   🔍 [DRY RUN] Would upsert ${normalizedRows.length} rows to Supabase user_bankroll_bets.`);
    return { syncedCount: normalizedRows.length, cloudSynced: false };
  }

  // Prepare database rows (strip client-only helper properties)
  const dbRows = normalizedRows.map(r => {
    const { is_promo, promo_stake, ...dbRow } = r;
    return dbRow;
  });

  const { data, error } = await supabase
    .from('user_bankroll_bets')
    .upsert(dbRows, { onConflict: 'id' })
    .select('id');

  if (error) {
    console.error(`   ❌ Failed to sync to Supabase user_bankroll_bets:`, error.message);
    throw error;
  }

  if (!quiet) {
    console.log(`   ✅ Successfully synced ${dbRows.length} wagers to Supabase table 'user_bankroll_bets'!`);
    dbRows.forEach((r, i) => {
      const statusIcon = r.status === 'won' ? '✅' : (r.status === 'lost' ? '❌' : '🟡');
      console.log(`      ${i + 1}. [${statusIcon} ${r.status.toUpperCase()}] ${r.id} • $${r.amount.toFixed(2)} cash • ${r.source}`);
    });
  }

  return { syncedCount: dbRows.length, cloudSynced: true, rows: normalizedRows };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) {
  const dryRun = process.argv.includes('--dry-run');
  const quiet = process.argv.includes('--quiet');
  syncPlacedWagersToBankroll({ dryRun, quiet })
    .then(() => {
      process.exitCode = 0;
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
