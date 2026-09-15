#!/usr/bin/env node

/**
 * reconcile-settlement.mjs
 *
 * Automated post-game reconciliation and grading engine for Andy's officially placed
 * betting portfolio and the Alejandro 50/50 split ledger.
 *
 * Capabilities:
 *  1. Fetches official final boxscores from ESPN API (with CDN fallback).
 *  2. Extracts player boxscore stats across passing, rushing, receiving, defense, and turnovers.
 *  3. Grades each leg and wager in data/official-picks/user-placed-wagers-2026.json.
 *  4. Accounts for promo credit tickets ($0 cash risk) vs cash risk wagers.
 *  5. Calculates Alejandro's 50/50 split accounting (stakes, winnings, net bill owe/owed).
 *  6. Updates user-placed-wagers-2026.json, alejandro-ledger-history.json, and writes markdown report.
 *
 * Usage:
 *  node scripts/reconcile-settlement.mjs [--dry-run] [--week <num>] [--game-id <espnEventId>] [--split-ticket <id>]
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncPlacedWagersToBankroll } from './sync-placed-wagers-to-bankroll.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const WAGERS_FILE = path.join(ROOT, 'data', 'official-picks', 'user-placed-wagers-2026.json');
const ALEJANDRO_HISTORY_FILE = path.join(ROOT, 'data', 'official-picks', 'alejandro-ledger-history.json');
const REPORT_MD_FILE = path.join(ROOT, 'docs', 'tracked-wagers', 'reconciliation-latest.md');
const REPORT_JSON_FILE = path.join(ROOT, 'docs', 'tracked-wagers', 'reconciliation-latest.json');

// Known ESPN event IDs for season 2026
const EVENT_MAP = {
  'melbourne': '401872657',
  'SF@LAR': '401872657',
  'LARvsSF': '401872657'
};

async function fetchEspnBoxscore(eventId) {
  const endpoints = [
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${eventId}`,
    `https://cdn.espn.com/core/nfl/boxscore?xhr=1&gameId=${eventId}`
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'NFL-Dashboard-Reconciler/1.0' } });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {
      // try fallback
    }
  }
  throw new Error(`Failed to fetch boxscore for ESPN Event ID ${eventId}`);
}

function parseBoxscore(data) {
  // 1. Teams & Score
  const headerComp = data.header?.competitions?.[0] || data.competitions?.[0];
  const competitors = headerComp?.competitors || [];
  const homeComp = competitors.find(c => c.homeAway === 'home');
  const awayComp = competitors.find(c => c.homeAway === 'away');

  const homeScore = parseInt(homeComp?.score ?? '0', 10);
  const awayScore = parseInt(awayComp?.score ?? '0', 10);
  const homeAbbr = (homeComp?.team?.abbreviation || '').toUpperCase();
  const awayAbbr = (awayComp?.team?.abbreviation || '').toUpperCase();

  const isCompleted = headerComp?.status?.type?.completed === true || 
                      headerComp?.status?.type?.name === 'STATUS_FINAL' ||
                      data.format?.status?.type?.completed === true;

  // 2. Individual Player Stats
  const players = {};
  const boxTeams = data.boxscore?.players || [];
  for (const team of boxTeams) {
    for (const statGroup of team.statistics || []) {
      const catName = statGroup.name; // e.g. passing, rushing, receiving, defensive, interceptions
      for (const ath of statGroup.athletes || []) {
        const name = ath.athlete?.displayName || ath.athlete?.name;
        if (!name) continue;
        if (!players[name]) players[name] = {};
        players[name][catName] = ath.stats || [];
      }
    }
  }

  return {
    isCompleted,
    homeTeam: homeAbbr,
    awayTeam: awayAbbr,
    homeScore,
    awayScore,
    totalPoints: homeScore + awayScore,
    players
  };
}

function getPlayerStat(players, playerName, category, index) {
  let pStats = players[playerName];
  if (!pStats) {
    const key = Object.keys(players).find(k => k.toLowerCase() === playerName.toLowerCase() || k.includes(playerName) || playerName.includes(k));
    if (key) pStats = players[key];
  }
  if (!pStats || !pStats[category]) return 0;
  const raw = pStats[category][index];
  if (!raw) return 0;
  return parseFloat(raw) || 0;
}

function getSelectedTeam(selection, teamHint, box) {
  const sel = (selection || '').toLowerCase();
  const hint = (teamHint || '').toUpperCase();
  if (hint === box.homeTeam) return 'home';
  if (hint === box.awayTeam) return 'away';

  const nickMap = {
    'SF': ['49ers', 'niners', 'san francisco'],
    'LAR': ['rams', 'los angeles rams', 'la rams'],
    'DET': ['lions', 'detroit'],
    'NO': ['saints', 'new orleans'],
    'JAX': ['jaguars', 'jags', 'jacksonville'],
    'CLE': ['browns', 'cleveland'],
    'PHI': ['eagles', 'philadelphia'],
    'WAS': ['commanders', 'washington'],
    'TB': ['buccaneers', 'bucs', 'tampa', 'tampa bay'],
    'CIN': ['bengals', 'cincinnati'],
    'CAR': ['panthers', 'carolina'],
    'CHI': ['bears', 'chicago']
  };

  const homeNicks = [box.homeTeam.toLowerCase(), ...(nickMap[box.homeTeam] || [])];
  for (const n of homeNicks) {
    if (sel.includes(n)) return 'home';
  }

  const awayNicks = [box.awayTeam.toLowerCase(), ...(nickMap[box.awayTeam] || [])];
  for (const n of awayNicks) {
    if (sel.includes(n)) return 'away';
  }

  return 'home';
}

function gradeLeg(leg, box, force = false) {
  const { market, line, selection, player, team } = leg;
  let actual = null;
  let status = 'PENDING';

  if (!box) {
    return { status: 'PENDING', actual: null };
  }

  // 1. Game-level markets
  if (market === 'spread') {
    const side = getSelectedTeam(selection, team, box);
    const teamScore = side === 'home' ? box.homeScore : box.awayScore;
    const oppScore = side === 'home' ? box.awayScore : box.homeScore;

    const margin = teamScore - oppScore;
    actual = margin > 0 ? `+${margin}` : `${margin}`;
    const effSpread = line ?? 0;
    if (margin + effSpread > 0) status = 'WON';
    else if (margin + effSpread === 0) status = 'PUSH';
    else status = 'LOST';
  } else if (market === 'moneyline') {
    const side = getSelectedTeam(selection, team, box);
    const teamScore = side === 'home' ? box.homeScore : box.awayScore;
    const oppScore = side === 'home' ? box.awayScore : box.homeScore;
    actual = `${teamScore}-${oppScore}`;
    if (teamScore > oppScore) status = 'WON';
    else if (teamScore === oppScore) status = 'PUSH';
    else status = 'LOST';
  } else if (market === 'total') {
    actual = box.totalPoints;
    const isUnder = selection.toLowerCase().includes('under');
    if (isUnder) {
      if (box.totalPoints < line) status = 'WON';
      else if (box.totalPoints === line) status = 'PUSH';
      else status = 'LOST';
    } else {
      if (box.totalPoints > line) status = 'WON';
      else if (box.totalPoints === line) status = 'PUSH';
      else status = 'LOST';
    }
  } else if (market === 'open_slot') {
    status = 'OPEN';
    actual = 'Slot Open';
  }
  // 2. Player Props
  else if (player) {
    if (market === 'anytime_touchdown') {
      const rushTDs = getPlayerStat(box.players, player, 'rushing', 3);
      const recTDs = getPlayerStat(box.players, player, 'receiving', 3);
      const defTDs = getPlayerStat(box.players, player, 'defensive', 6);
      actual = rushTDs + recTDs + defTDs;
      status = actual >= 1 ? 'WON' : 'LOST';
    } else if (market === 'receptions') {
      actual = getPlayerStat(box.players, player, 'receiving', 0);
      status = actual > (line ?? 0) ? 'WON' : 'LOST';
    } else if (market === 'receiving_yards') {
      actual = getPlayerStat(box.players, player, 'receiving', 1);
      status = actual > (line ?? 0) ? 'WON' : 'LOST';
    } else if (market === 'rushing_yards') {
      actual = getPlayerStat(box.players, player, 'rushing', 1);
      status = actual > (line ?? 0) ? 'WON' : 'LOST';
    } else if (market === 'passing_yards') {
      actual = getPlayerStat(box.players, player, 'passing', 1);
      status = actual > (line ?? 0) ? 'WON' : 'LOST';
    } else if (market === 'passing_tds') {
      actual = getPlayerStat(box.players, player, 'passing', 3);
      status = actual > (line ?? 0) ? 'WON' : 'LOST';
    } else if (market === 'interceptions') {
      actual = getPlayerStat(box.players, player, 'passing', 4);
      status = actual > (line ?? 0) ? 'WON' : 'LOST';
    } else if (market === 'sacks') {
      actual = getPlayerStat(box.players, player, 'defensive', 2);
      status = actual > (line ?? 0) ? 'WON' : 'LOST';
    } else if (market === 'tackles_assists') {
      actual = getPlayerStat(box.players, player, 'defensive', 0);
      status = actual > (line ?? 0) ? 'WON' : 'LOST';
    }
  }

  return { status, actual };
}

export async function reconcilePortfolio({ dryRun = false, force = false, week = 1, eventId = '401872657', splitTickets = [], splitAll = false } = {}) {
  console.log(`\n🏈 Running Placed Wager & Alejandro Settlement Reconciliation...`);
  console.log(`   Source: ${path.relative(ROOT, WAGERS_FILE)}`);
  console.log(`   Mode: ${dryRun ? '🔍 DRY RUN (No writes)' : '💾 COMMIT (Writing ledger)'}`);
  if (force) console.log(`   ⚡ FORCE MODE: Grading current in-progress stats as final.`);
  if (splitAll) console.log(`   🤝 SPLIT ALL: Marking all placed wagers as 50/50 Alejandro split.`);
  else if (splitTickets.length > 0) console.log(`   🤝 SPLIT TICKETS: Marking ${splitTickets.length} wagers as 50/50 Alejandro split.`);

  const rawWagers = await readFile(WAGERS_FILE, 'utf8');
  const wagers = JSON.parse(rawWagers);

  // Load existing Alejandro History
  let alejandroHistory = {
    updated_at: new Date().toISOString(),
    total_cash_staked: 0,
    alejandro_cost_share: 0,
    alejandro_cashed_share: 0,
    alejandro_net_balance: 0,
    records: []
  };

  try {
    const rawHist = await readFile(ALEJANDRO_HISTORY_FILE, 'utf8');
    alejandroHistory = JSON.parse(rawHist);
  } catch {
    // First run or file doesn't exist yet
  }

  // Fetch boxscore for Melbourne
  console.log(`   Fetching ESPN Game Summary for Event ID ${eventId}...`);
  const espnData = await fetchEspnBoxscore(eventId);
  const box = parseBoxscore(espnData);
  console.log(`   Game State: ${box.awayTeam} ${box.awayScore} @ ${box.homeTeam} ${box.homeScore} (${box.isCompleted ? 'FINAL' : 'IN PROGRESS'})`);

  let totalCashRisk = 0;
  let totalPromoRisk = 0;
  let totalCashedPayout = 0;
  let totalSettledProfit = 0;

  let alejandroActiveStakes = 0;
  let alejandroActiveCost = 0;
  let alejandroActiveCashed = 0;

  const gradedWagers = [];

  for (const bet of wagers) {
    const isMelbourneTicket = bet.game === 'SF @ LAR' || bet.game?.includes('SF @ LAR');
    const isPromo = bet.is_promo_credit || bet.funding_type === 'promo_credit';
    const cashRisk = isPromo ? 0 : (bet.cash_risk_usd ?? bet.stake_usd ?? 0);
    const promoRisk = isPromo ? (bet.promo_credit_stake_usd ?? bet.stake_usd ?? 0) : 0;

    totalCashRisk += cashRisk;
    totalPromoRisk += promoRisk;

    // Check if wager is split with Alejandro
    const isSplit = splitAll || splitTickets.includes(bet.id) || bet.is_split === true || bet.split_partner === 'Alejandro' || false;

    // Grade legs
    let allLegsWon = true;
    let anyLegLost = false;
    let anyLegPending = false;
    let anyLegOpen = false;

    const gradedLegs = (bet.legs || []).map(leg => {
      // If this leg is for the Melbourne game, grade it against the boxscore
      const legIsMelbourne = !leg.game || leg.game === 'SF @ LAR' || leg.opponent === 'SF' || leg.opponent === 'LAR';
      if (legIsMelbourne) {
        const { status, actual } = gradeLeg(leg, box);
        if (status === 'LOST') anyLegLost = true;
        if (status === 'PENDING') anyLegPending = true;
        if (status === 'OPEN') anyLegOpen = true;
        if (status !== 'WON') allLegsWon = false;
        return {
          ...leg,
          actual_stat: actual,
          status
        };
      } else {
        // Multi-game Sunday leg (pending)
        if (leg.status === 'OPEN') anyLegOpen = true;
        else anyLegPending = true;
        allLegsWon = false;
        return leg;
      }
    });

    let finalTicketStatus = bet.status;
    let finalResult = bet.result;
    let gradedAt = bet.graded_at;

    if (isMelbourneTicket && !anyLegOpen && !anyLegPending) {
      // All legs are completed or game is final
      if (box.isCompleted || force) {
        if (anyLegLost) {
          finalTicketStatus = 'SETTLED';
          finalResult = 'loss';
          gradedAt = new Date().toISOString();
        } else if (allLegsWon) {
          finalTicketStatus = 'SETTLED';
          finalResult = 'win';
          gradedAt = new Date().toISOString();
          totalCashedPayout += bet.potential_payout_usd || 0;
          totalSettledProfit += bet.potential_profit_usd || 0;
        }
      } else {
        finalTicketStatus = 'LIVE';
        finalResult = null;
      }
    } else if (anyLegOpen || anyLegPending) {
      // Partial progress (like Bookmaker 7-Team Open Parlay)
      finalTicketStatus = 'PENDING';
      finalResult = null;
      if (gradedLegs.some(l => l.status === 'WON')) {
        bet.progress_notes = 'Leg 1 (SF +4) WON. Advancing to Sunday games.';
      }
    }

    if (finalResult === 'loss') {
      totalSettledProfit -= cashRisk;
    }

    // Alejandro Split Accounting
    if (isSplit) {
      alejandroActiveStakes += cashRisk;
      const costShare = cashRisk * 0.5;
      alejandroActiveCost += costShare;

      let cashedShare = 0;
      if (finalResult === 'win') {
        cashedShare = (bet.potential_payout_usd || 0) * 0.5;
        alejandroActiveCashed += cashedShare;
      }

      // Record in ledger
      const existingRecord = alejandroHistory.records.find(r => r.ticket_id === bet.id);
      const rec = {
        ticket_id: bet.id,
        ticket_type: bet.ticket_type,
        book: bet.book,
        description: bet.game_title || bet.game,
        total_stake: cashRisk,
        alejandro_stake_share: costShare,
        is_promo: isPromo,
        status: finalTicketStatus,
        result: finalResult || 'pending',
        payout_share: cashedShare,
        net_impact: cashedShare - costShare,
        updated_at: new Date().toISOString()
      };

      if (existingRecord) {
        Object.assign(existingRecord, rec);
      } else {
        alejandroHistory.records.push(rec);
      }
    }

    gradedWagers.push({
      ...bet,
      status: finalTicketStatus,
      result: finalResult,
      graded_at: gradedAt,
      legs: gradedLegs
    });
  }

  // Summary Alejandro Ledger
  const totalCost = alejandroHistory.records.reduce((acc, r) => acc + (r.alejandro_stake_share || 0), 0);
  const totalCashed = alejandroHistory.records.reduce((acc, r) => acc + (r.payout_share || 0), 0);
  const netBalance = totalCashed - totalCost;

  alejandroHistory.updated_at = new Date().toISOString();
  alejandroHistory.total_cash_staked = alejandroActiveStakes;
  alejandroHistory.alejandro_cost_share = totalCost;
  alejandroHistory.alejandro_cashed_share = totalCashed;
  alejandroHistory.alejandro_net_balance = netBalance;
  alejandroHistory.summary = netBalance < 0
    ? `Alejandro Castro owes Andy $${Math.abs(netBalance).toFixed(2)}`
    : netBalance > 0
      ? `Andy owes Alejandro Castro $${netBalance.toFixed(2)}`
      : 'All split accounts are settled ($0.00)';

  // Build Markdown Summary
  const mdReport = `# 🏈 NFL Settlement & Ledger Reconciliation Report
**Generated:** ${new Date().toISOString()}  
**Slate / Event:** Week 1 Season Opener (SF @ LAR - Melbourne)  
**Game Result:** **${box.awayTeam} ${box.awayScore}, ${box.homeTeam} ${box.homeScore}** (Total: ${box.awayScore + box.homeScore} points)

---

## 📊 Portfolio Summary

| Metric | Cash Risk | Promo Risk | Total Value |
| :--- | :--- | :--- | :--- |
| **Total Placed Wagers** | **$${totalCashRisk.toFixed(2)}** | **$${totalPromoRisk.toFixed(2)}** | **$${(totalCashRisk + totalPromoRisk).toFixed(2)}** |
| **Total Payout Cashed** | **$${totalCashedPayout.toFixed(2)}** | - | **$${totalCashedPayout.toFixed(2)}** |
| **Settled Net P&L** | **$${totalSettledProfit.toFixed(2)}** | $0.00 Cash Loss | **$${totalSettledProfit.toFixed(2)}** |

---

## 🎫 Ticket Grading Breakdown

${gradedWagers.map((w, idx) => `
### ${idx + 1}. ${w.game_title || w.game} — ${w.book} (${w.ticket_type})
* **Ticket ID:** \`${w.id}\`
* **Stake:** $${(w.cash_risk_usd ?? w.stake_usd ?? 0).toFixed(2)} ${w.is_promo_credit ? '(Promo Credit)' : '(Cash)'}
* **Status:** **${w.status}** (${w.result ? w.result.toUpperCase() : 'IN PROGRESS'})
* **Potential Payout:** $${(w.potential_payout_usd || 0).toFixed(2)}
* **Leg Results:**
${(w.legs || []).map(l => `  - ${l.status === 'WON' ? '✅' : l.status === 'LOST' ? '❌' : l.status === 'OPEN' ? '🟢' : '🟡'} **${l.player || l.selection}**: ${l.status} (Target: \`${l.line ?? '-'}\`, Actual: \`${l.actual_stat ?? '-'}\`)`).join('\n')}
`).join('\n')}

---

## 🤝 Alejandro Castro Split Accounting Ledger

* **Alejandro Castro Active Split Records:** ${alejandroHistory.records.length} wagers
* **Total Stakes Split (50%):** $${totalCost.toFixed(2)}
* **Total Cashed Share (50%):** $${totalCashed.toFixed(2)}
* **Current Ledger Balance:** **${alejandroHistory.summary}**

${alejandroHistory.records.length === 0 ? '_No split wagers logged yet. Toggle split on any ticket in the Live Tracker or CLI._' : `
| Ticket ID | Description | Total Stake | Alejandro Share (50%) | Result | Payout Share | Net Impact |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${alejandroHistory.records.map(r => `| \`${r.ticket_id.slice(0, 16)}...\` | ${r.description} | $${r.total_stake.toFixed(2)} | $${r.alejandro_stake_share.toFixed(2)} | ${r.result.toUpperCase()} | $${r.payout_share.toFixed(2)} | **${r.net_impact >= 0 ? '+' : ''}$${r.net_impact.toFixed(2)}** |`).join('\n')}
`}

---
*Report generated by NFL Toolbox Reconciliation Engine.*
`;

  if (!dryRun) {
    await writeFile(WAGERS_FILE, JSON.stringify(gradedWagers, null, 2), 'utf8');
    await writeFile(ALEJANDRO_HISTORY_FILE, JSON.stringify(alejandroHistory, null, 2), 'utf8');
    await mkdir(path.dirname(REPORT_MD_FILE), { recursive: true });
    await writeFile(REPORT_MD_FILE, mdReport, 'utf8');
    await writeFile(REPORT_JSON_FILE, JSON.stringify({
      generated_at: new Date().toISOString(),
      summary: {
        totalCashRisk,
        totalPromoRisk,
        totalCashedPayout,
        totalSettledProfit,
        alejandro: alejandroHistory
      },
      wagers: gradedWagers
    }, null, 2), 'utf8');

    console.log(`\n✅ Successfully reconciled portfolio!`);
    console.log(`   Updated wagers: ${path.relative(ROOT, WAGERS_FILE)}`);
    console.log(`   Updated Alejandro Ledger: ${path.relative(ROOT, ALEJANDRO_HISTORY_FILE)}`);
    console.log(`   Generated Report: ${path.relative(ROOT, REPORT_MD_FILE)}`);

    // Synchronize reconciled wagers directly to Supabase and public/
    try {
      await syncPlacedWagersToBankroll({ quiet: false });
    } catch (syncErr) {
      console.warn(`   ⚠️ Bankroll sync warning:`, syncErr.message);
    }
  } else {
    console.log(`\n🔍 [DRY RUN] Reconciliation preview complete. No files modified.`);
    console.log('\n' + mdReport);
  }

  return {
    gradedWagers,
    alejandroHistory,
    totalCashRisk,
    totalPromoRisk,
    totalCashedPayout,
    totalSettledProfit
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const splitAll = args.includes('--split-all');
  const splitTickets = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--split-ticket' && args[i + 1]) {
      splitTickets.push(args[i + 1]);
      i++;
    }
  }
  const weekIdx = args.indexOf('--week');
  const week = weekIdx >= 0 ? parseInt(args[weekIdx + 1], 10) : 1;
  const gameIdx = args.indexOf('--game-id');
  const eventId = gameIdx >= 0 ? args[gameIdx + 1] : '401872657';

  reconcilePortfolio({ dryRun, force, week, eventId, splitAll, splitTickets })
    .then(() => {
      process.exitCode = 0;
    })
    .catch(err => {
      console.error(`❌ Reconciliation failed:`, err);
      process.exit(1);
    });
}
