#!/usr/bin/env node

/**
 * add-placed-wager.mjs
 *
 * Interactive CLI & automated ingest utility for Andy's officially placed
 * betting portfolio (data/official-picks/user-placed-wagers-2026.json).
 *
 * Automatically calculates decimal odds & payouts, enforces bankroll safeguards
 * ($0 cash risk for promo credits), tags 50/50 Alejandro Castro split agreements,
 * and re-compiles the Sunday Multi-Game Live Tracker.
 *
 * Usage:
 *  Interactive Mode:
 *    node scripts/add-placed-wager.mjs
 *
 *  CLI / Flag Mode:
 *    node scripts/add-placed-wager.mjs \
 *      --title "Saints @ Lions Core SGP" \
 *      --game "NO @ DET" \
 *      --book "BetOnline" \
 *      --type "Same Game Parlay (3 Legs)" \
 *      --stake 10 \
 *      --odds "+450" \
 *      --legs "Amon-Ra Over 72.5 Rec Yds; Jahmyr Gibbs 1+ TD; Detroit Lions ML" \
 *      --split
 *
 *  JSON / File Mode:
 *    node scripts/add-placed-wager.mjs --json '{"game_title":"Sunday Play",...}'
 *    node scripts/add-placed-wager.mjs --file ./scratch/my-sunday-bets.json
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { generateLiveTracker } from './generate-live-tracker.mjs';
import { syncPlacedWagersToBankroll } from './sync-placed-wagers-to-bankroll.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const WAGERS_PATH = path.join(ROOT, 'data', 'official-picks', 'user-placed-wagers-2026.json');

function parseAmericanOdds(oddsStr) {
  const clean = String(oddsStr).trim();
  const num = parseInt(clean, 10);
  if (isNaN(num)) return { american: '+100', decimal: 2.0 };
  if (num > 0) {
    return {
      american: `+${num}`,
      decimal: parseFloat((1 + num / 100).toFixed(2))
    };
  } else {
    return {
      american: `${num}`,
      decimal: parseFloat((1 + 100 / Math.abs(num)).toFixed(2))
    };
  }
}

function calculatePayout(stake, oddsAmerican) {
  const { decimal } = parseAmericanOdds(oddsAmerican);
  const payout = parseFloat((stake * decimal).toFixed(2));
  const profit = parseFloat((payout - stake).toFixed(2));
  return { payout, profit, decimal };
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
}

export async function addPlacedWagers(newWagersList, { rebuildTracker = true, week = 1 } = {}) {
  const raw = await readFile(WAGERS_PATH, 'utf8');
  const existingWagers = JSON.parse(raw);

  const added = [];

  for (const item of newWagersList) {
    const timestamp = Date.now();
    const bookSlug = slugify(item.book || 'book');
    const titleSlug = slugify(item.game_title || item.game || 'bet');
    const id = item.id || `bet_${timestamp}_${bookSlug}_${titleSlug}`;

    const isPromo = item.is_promo_credit === true || item.funding_type === 'promo_credit';
    const stake = parseFloat(item.stake_usd ?? item.stake ?? 10);
    const cashRisk = isPromo ? 0 : parseFloat(item.cash_risk_usd ?? stake);
    const promoStake = isPromo ? parseFloat(item.promo_credit_stake_usd ?? stake) : 0;

    const oddsAmerican = item.odds_american || item.odds || '+100';
    const { payout, profit, decimal } = calculatePayout(stake, oddsAmerican);
    const potentialPayout = item.potential_payout_usd ? parseFloat(item.potential_payout_usd) : payout;
    const potentialProfit = item.potential_profit_usd ? parseFloat(item.potential_profit_usd) : (isPromo ? potentialPayout : profit);

    const isSplit = item.is_split === true || item.split_partner === 'Alejandro';

    // Parse legs
    let legs = [];
    if (Array.isArray(item.legs)) {
      legs = item.legs.map((l, idx) => ({
        leg_num: l.leg_num || idx + 1,
        player: l.player || null,
        team: l.team || null,
        opponent: l.opponent || null,
        market: l.market || 'selection',
        selection: l.selection || String(l),
        line: l.line ?? null,
        price: l.price || '-110',
        target_stat: l.target_stat || null,
        status: l.status || 'PENDING',
        source: l.source || l.expert || 'Model Edge'
      }));
    } else if (typeof item.legs === 'string') {
      legs = item.legs.split(/[;\n]/).map(s => s.trim()).filter(Boolean).map((text, idx) => {
        const parts = text.split('•').map(p => p.trim());
        const sel = parts[0] || text;
        const src = parts[1] || 'Research Intel';
        return {
          leg_num: idx + 1,
          selection: sel,
          market: 'prop',
          status: 'PENDING',
          source: src
        };
      });
    }

    const wagerRecord = {
      id,
      placed_at: item.placed_at || new Date().toISOString(),
      date: item.date || new Date().toISOString().split('T')[0],
      season: item.season || 2026,
      week: item.week || week,
      game: item.game || 'NFL Multi-Game Slate',
      game_title: item.game_title || item.title || item.game || 'NFL Wager',
      book: item.book || 'BetOnline',
      ticket_type: item.ticket_type || (legs.length > 1 ? `Same Game Parlay (${legs.length} Legs)` : 'Straight'),
      category: item.category || (legs.length > 1 ? 'Parlay' : 'Single'),
      funding_type: isPromo ? 'promo_credit' : 'cash',
      is_promo_credit: isPromo,
      cash_risk_usd: cashRisk,
      promo_credit_stake_usd: promoStake,
      stake_usd: stake,
      units: parseFloat((cashRisk / 10).toFixed(2)),
      odds_american: oddsAmerican.startsWith('+') || oddsAmerican.startsWith('-') ? oddsAmerican : `+${oddsAmerican}`,
      odds_decimal: decimal,
      potential_profit_usd: potentialProfit,
      potential_payout_usd: potentialPayout,
      status: item.status || 'LIVE',
      result: null,
      graded_at: null,
      external_url: item.external_url || null,
      is_split: isSplit,
      split_partner: isSplit ? 'Alejandro Castro' : null,
      legs
    };

    existingWagers.push(wagerRecord);
    added.push(wagerRecord);
  }

  await writeFile(WAGERS_PATH, JSON.stringify(existingWagers, null, 2), 'utf8');
  console.log(`\n✅ Successfully added ${added.length} wager(s) to ${path.relative(ROOT, WAGERS_PATH)}`);

  // Synchronize new wagers immediately to Supabase user_bankroll_bets & public/
  try {
    await syncPlacedWagersToBankroll({ quiet: true });
    console.log(`   ✅ Synced new wager(s) to Supabase bankroll pipeline`);
  } catch (syncErr) {
    console.warn(`   ⚠️ Bankroll sync warning:`, syncErr.message);
  }

  if (rebuildTracker) {
    console.log(`🏈 Rebuilding Sunday Multi-Game Live Tracker...`);
    await generateLiveTracker({ week });
  }

  return added;
}

async function runInteractive() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = q => new Promise(res => rl.question(q, res));

  console.log(`\n======================================================`);
  console.log(`🏈  ANDY'S NFL DASHBOARD: ADD OFFICIAL PLACED WAGER  🏈`);
  console.log(`======================================================\n`);

  try {
    const title = (await ask(`1. Ticket Title [e.g. Saints @ Lions Core SGP]: `)).trim() || 'Sunday Core SGP';
    const game = (await ask(`2. Matchup [e.g. NO @ DET or Multi-Game]: `)).trim() || 'NO @ DET';
    const book = (await ask(`3. Sportsbook [BetOnline / Bookmaker.eu / DraftKings]: `)).trim() || 'BetOnline';
    const ticketType = (await ask(`4. Ticket Type [e.g. Same Game Parlay (3 Legs) / Spread]: `)).trim() || 'Same Game Parlay';
    const stakeStr = (await ask(`5. Stake ($) [default 10]: `)).trim() || '10';
    const oddsStr = (await ask(`6. Odds [e.g. +450 or -110]: `)).trim() || '+450';
    const isPromoStr = (await ask(`7. Is Promo Credit ($0 Cash Risk)? [y/N]: `)).trim().toLowerCase();
    const isPromo = isPromoStr === 'y' || isPromoStr === 'yes';

    const isSplitStr = (await ask(`8. Split 50/50 with Alejandro Castro? [y/N]: `)).trim().toLowerCase();
    const isSplit = isSplitStr === 'y' || isSplitStr === 'yes';

    console.log(`\n9. Enter Legs (One per line or semicolon-separated. Enter empty line when done):`);
    const legsList = [];
    while (true) {
      const legInput = (await ask(`   Leg ${legsList.length + 1}: `)).trim();
      if (!legInput) break;
      legsList.push(legInput);
    }

    if (legsList.length === 0) {
      legsList.push(`${title} • Model Edge`);
    }

    rl.close();

    const wager = {
      game_title: title,
      game,
      book,
      ticket_type: ticketType,
      stake_usd: parseFloat(stakeStr) || 10,
      odds_american: oddsStr,
      is_promo_credit: isPromo,
      is_split: isSplit,
      legs: legsList
    };

    const added = await addPlacedWagers([wager], { rebuildTracker: true });

    console.log(`\n======================================================`);
    console.log(`🎉 TICKET SUCCESSFULLY LOGGED & READY FOR TRACKING!`);
    console.log(`   Ticket ID:    ${added[0].id}`);
    console.log(`   Game/Title:   ${added[0].game_title} (${added[0].game})`);
    console.log(`   Book:         ${added[0].book}`);
    console.log(`   Stake:        $${added[0].stake_usd.toFixed(2)} (${isPromo ? '🎁 $0 CASH PROMO' : 'CASH RISK'})`);
    console.log(`   Odds/Payout:  ${added[0].odds_american} → $${added[0].potential_payout_usd.toFixed(2)}`);
    console.log(`   50/50 Split:  ${isSplit ? '🤝 Alejandro Castro (50%)' : 'No'}`);
    console.log(`   Legs:         ${added[0].legs.length} leg(s)`);
    console.log(`======================================================\n`);
  } catch (err) {
    rl.close();
    console.error(`❌ Error in interactive prompt:`, err);
  }
}

// CLI Execution Entrypoint
const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage:
  node scripts/add-placed-wager.mjs [options]

Options:
  --title <text>        Ticket title (e.g. "Sunday Core SGP")
  --game <matchup>      Game matchup (e.g. "NO @ DET")
  --book <book>         Sportsbook (BetOnline, DraftKings, Bookmaker.eu)
  --type <text>         Ticket type (e.g. "Same Game Parlay (3 Legs)")
  --stake <num>         Total stake in USD (default 10)
  --odds <text>         American odds (e.g. "+450", "-110")
  --promo               Flag: fund with Promo Credit ($0 Cash Risk)
  --split               Flag: 50/50 split agreement with Alejandro Castro
  --legs <text>         Semicolon-separated leg strings (e.g. "Gibbs 1+ TD; Lions ML")
  --json <string>       Raw JSON wager object or array of objects
  --file <path>         Path to JSON file containing wagers to append
  --no-rebuild          Skip rebuilding live tracker HTML
  --help, -h            Show this help text
`);
    process.exit(0);
  }

  const jsonArgIdx = args.indexOf('--json');
  const fileArgIdx = args.indexOf('--file');

  if (jsonArgIdx >= 0 && args[jsonArgIdx + 1]) {
    const rawJson = args[jsonArgIdx + 1];
    const parsed = JSON.parse(rawJson);
    const list = Array.isArray(parsed) ? parsed : [parsed];
    addPlacedWagers(list).catch(err => {
      console.error(`❌ Failed to add wager from JSON:`, err);
      process.exit(1);
    });
  } else if (fileArgIdx >= 0 && args[fileArgIdx + 1]) {
    const filePath = path.resolve(process.cwd(), args[fileArgIdx + 1]);
    readFile(filePath, 'utf8')
      .then(raw => JSON.parse(raw))
      .then(parsed => Array.isArray(parsed) ? parsed : [parsed])
      .then(list => addPlacedWagers(list))
      .catch(err => {
        console.error(`❌ Failed to add wager from file:`, err);
        process.exit(1);
      });
  } else if (args.length > 0) {
    // Flag-based parsing
    const getArg = flag => {
      const idx = args.indexOf(flag);
      return idx >= 0 && args[idx + 1] ? args[idx + 1] : null;
    };

    const title = getArg('--title') || 'Sunday Wager';
    const game = getArg('--game') || 'NFL Sunday Slate';
    const book = getArg('--book') || 'BetOnline';
    const type = getArg('--type') || 'Same Game Parlay';
    const stake = parseFloat(getArg('--stake') || '10');
    const odds = getArg('--odds') || '+100';
    const promo = args.includes('--promo');
    const split = args.includes('--split');
    const legsRaw = getArg('--legs') || `${title} • Research Intel`;
    const noRebuild = args.includes('--no-rebuild');

    const wager = {
      game_title: title,
      game,
      book,
      ticket_type: type,
      stake_usd: stake,
      odds_american: odds,
      is_promo_credit: promo,
      is_split: split,
      legs: legsRaw
    };

    addPlacedWagers([wager], { rebuildTracker: !noRebuild }).catch(err => {
      console.error(`❌ Failed to add wager:`, err);
      process.exit(1);
    });
  } else {
    // No args: run interactive wizard
    runInteractive();
  }
}
