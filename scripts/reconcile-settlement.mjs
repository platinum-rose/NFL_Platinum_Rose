#!/usr/bin/env node

/**
 * Grade placed wagers against completed ESPN games for one NFL week.
 *
 * The command is deliberately local-only: even a committed reconciliation
 * never synchronizes the bankroll or Supabase. The caller must authorize
 * those independent actions separately.
 *
 * Usage:
 *   node scripts/reconcile-settlement.mjs --week <n> [--dry-run] [--season <yyyy>]
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getNFLWeekInfo } from '../src/lib/constants.js';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const WAGERS_FILE = path.join(ROOT, 'data', 'official-picks', 'user-placed-wagers-2026.json');
const REPORT_MD_FILE = path.join(ROOT, 'docs', 'tracked-wagers', 'reconciliation-latest.md');
const REPORT_JSON_FILE = path.join(ROOT, 'docs', 'tracked-wagers', 'reconciliation-latest.json');
const ESPN_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';

const TEAM_ALIASES = new Map([
  ['LA', 'LAR'], ['LAR', 'LAR'], ['SF', 'SF'], ['JAC', 'JAX'], ['JAX', 'JAX'],
  ['WSH', 'WAS'], ['WAS', 'WAS'], ['TB', 'TB'], ['TAM', 'TB'], ['NE', 'NE'],
]);

const normalizeTeam = (value) => TEAM_ALIASES.get(String(value || '').toUpperCase()) || String(value || '').toUpperCase();
const eventKey = (away, home) => `${normalizeTeam(away)}@${normalizeTeam(home)}`;
const isFinal = (status) => status?.completed === true || status?.name === 'STATUS_FINAL';

function gameKeyFromLeg(leg) {
  const match = String(leg.game || '').toUpperCase().match(/\b([A-Z]{2,3})\s*@\s*([A-Z]{2,3})\b/);
  if (match) return eventKey(match[1], match[2]);
  if (leg.team && leg.opponent) return eventKey(leg.team, leg.opponent);
  return null;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'NFL-Dashboard-Reconciler/2.0' } });
  if (!response.ok) throw new Error(`ESPN request failed (${response.status}): ${url}`);
  return response.json();
}

async function fetchWeekScoreboard({ season, week }) {
  const data = await fetchJson(`${ESPN_SCOREBOARD}?dates=${season}&seasontype=2&week=${week}`);
  return (data.events || []).map((event) => {
    const comp = event.competitions?.[0];
    const home = comp?.competitors?.find((item) => item.homeAway === 'home');
    const away = comp?.competitors?.find((item) => item.homeAway === 'away');
    if (!home || !away) return null;
    return {
      id: event.id,
      key: eventKey(away.team?.abbreviation, home.team?.abbreviation),
      awayTeam: normalizeTeam(away.team?.abbreviation),
      homeTeam: normalizeTeam(home.team?.abbreviation),
      awayScore: Number(away.score),
      homeScore: Number(home.score),
      completed: isFinal(event.status?.type),
    };
  }).filter(Boolean);
}

async function fetchBoxscore(eventId) {
  const data = await fetchJson(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${eventId}`);
  const comp = data.header?.competitions?.[0];
  const home = comp?.competitors?.find((item) => item.homeAway === 'home');
  const away = comp?.competitors?.find((item) => item.homeAway === 'away');
  const players = {};
  for (const team of data.boxscore?.players || []) {
    for (const group of team.statistics || []) {
      for (const athlete of group.athletes || []) {
        const name = athlete.athlete?.displayName;
        if (!name) continue;
        players[name] ||= {};
        players[name][group.name] = athlete.stats || [];
      }
    }
  }
  return {
    id: eventId,
    homeTeam: normalizeTeam(home?.team?.abbreviation),
    awayTeam: normalizeTeam(away?.team?.abbreviation),
    homeScore: Number(home?.score),
    awayScore: Number(away?.score),
    totalPoints: Number(home?.score) + Number(away?.score),
    completed: isFinal(comp?.status?.type),
    players,
  };
}

// "Deebo Samuel" must match ESPN's "Deebo Samuel Sr.", "James Cook" -> "James Cook III".
const normName = (value) => String(value || '').toLowerCase()
  .replace(/\b(sr|jr|ii|iii|iv|v)\b\.?/g, '').replace(/[.'’-]/g, '').replace(/\s+/g, ' ').trim();

function playerStat(players, playerName, category, index) {
  let record = players[playerName];
  if (!record) {
    const key = Object.keys(players).find((name) => normName(name) === normName(playerName));
    record = key ? players[key] : null;
  }
  return Number(record?.[category]?.[index]) || 0;
}

function selectedSide(leg, box) {
  const team = normalizeTeam(leg.team);
  if (team === box.homeTeam) return 'home';
  if (team === box.awayTeam) return 'away';
  const text = String(leg.selection || '').toLowerCase();
  if (text.includes(box.awayTeam.toLowerCase())) return 'away';
  return 'home';
}

export function gradeLeg(leg, box) {
  if (!box?.completed) return { status: 'PENDING', actual: null };
  const line = Number(leg.line ?? 0);
  const market = String(leg.market || '').toLowerCase();
  if (market === 'open_slot') return { status: 'OPEN', actual: 'Slot Open' };

  if (market === 'spread' || market === 'moneyline') {
    const side = selectedSide(leg, box);
    const score = side === 'home' ? box.homeScore : box.awayScore;
    const opponentScore = side === 'home' ? box.awayScore : box.homeScore;
    const margin = score - opponentScore;
    if (market === 'moneyline') return { status: margin > 0 ? 'WON' : margin === 0 ? 'PUSH' : 'LOST', actual: `${score}-${opponentScore}` };
    return { status: margin + line > 0 ? 'WON' : margin + line === 0 ? 'PUSH' : 'LOST', actual: margin > 0 ? `+${margin}` : String(margin) };
  }
  if (market === 'total') {
    const under = String(leg.selection || '').toLowerCase().includes('under');
    const actual = box.totalPoints;
    return { status: under ? (actual < line ? 'WON' : actual === line ? 'PUSH' : 'LOST') : (actual > line ? 'WON' : actual === line ? 'PUSH' : 'LOST'), actual };
  }
  if (!leg.player) return { status: 'PENDING', actual: null };

  const statSpec = {
    anytime_touchdown: ['rushing', 3, true],
    receptions: ['receiving', 0], receiving_yards: ['receiving', 1],
    rushing_yards: ['rushing', 1], passing_yards: ['passing', 1],
    passing_tds: ['passing', 3], passing_touchdowns: ['passing', 3],
    interceptions: ['passing', 4], pass_interceptions: ['passing', 4], interceptions_thrown: ['passing', 4], sacks: ['defensive', 2], tackles_assists: ['defensive', 0],
  }[market];
  if (!statSpec) return { status: 'PENDING', actual: null };
  const actual = statSpec[2]
    ? playerStat(box.players, leg.player, 'rushing', 3) + playerStat(box.players, leg.player, 'receiving', 3) + playerStat(box.players, leg.player, 'defensive', 6)
    : playerStat(box.players, leg.player, statSpec[0], statSpec[1]);
  return { status: actual > line ? 'WON' : actual === line ? 'PUSH' : 'LOST', actual };
}

const toDecimal = (price) => {
  const n = Number(String(price ?? '-110').replace('+', ''));
  if (!Number.isFinite(n) || n === 0) return 1 + 100 / 110;
  return n > 0 ? 1 + n / 100 : 1 + 100 / Math.abs(n);
};
const round2 = (value) => Math.round(value * 100) / 100;

function combinations(items, size) {
  if (size === 0) return [[]];
  if (items.length < size) return [];
  const [first, ...rest] = items;
  return [...combinations(rest, size - 1).map((combo) => [first, ...combo]), ...combinations(rest, size)];
}

function ticketOutcome(bet, legs) {
  const hasPending = legs.some((leg) => leg.status === 'PENDING' || leg.status === 'OPEN');
  const stake = Number(bet.cash_risk_usd ?? bet.stake_usd ?? 0);
  if (bet.round_robin) {
    // A Round Robin can remain alive despite losing selections, so it is not
    // settled while any leg is pending. Once every leg is final, the result
    // comes from the combination payouts: a "win" must return more than the
    // stake. Payout is computed from logged leg prices and flagged for
    // confirmation against the book's ticket.
    if (hasPending) return { status: 'PENDING', result: null };
    const size = Number(bet.round_robin.teams_per_combination || 2);
    const combos = combinations(legs, size);
    const perCombo = combos.length ? stake / combos.length : 0;
    let payout = 0;
    for (const combo of combos) {
      if (combo.some((leg) => leg.status === 'LOST')) continue;
      payout += perCombo * combo.reduce((acc, leg) => acc * (leg.status === 'PUSH' ? 1 : toDecimal(leg.price)), 1);
    }
    payout = round2(payout);
    const result = payout > stake + 0.005 ? 'win' : payout < stake - 0.005 ? 'loss' : 'push';
    return { status: 'SETTLED', result, settled_payout_usd: payout, profit_usd: round2(payout - stake), payout_source: 'computed_from_leg_prices' };
  }
  if (legs.some((leg) => leg.status === 'LOST')) return { status: 'SETTLED', result: 'loss', settled_payout_usd: 0, profit_usd: -stake };
  if (hasPending) return { status: 'PENDING', result: null };
  const payout = Number(bet.potential_payout_usd ?? 0);
  return { status: 'SETTLED', result: 'win', settled_payout_usd: payout, profit_usd: round2(payout - stake) };
}

function buildReport({ season, week, games, wagers }) {
  const finalGames = games.filter((game) => game.completed);
  const pendingGames = games.filter((game) => !game.completed);
  const affected = wagers.filter((bet) => Number(bet.week) === week);
  return `# NFL Week ${week} settlement preview\n\n` +
    `Generated: ${new Date().toISOString()}  \nSeason: ${season}  \nMode: completed games only; pending games are never graded.\n\n` +
    `## ESPN scoreboard\n\n` +
    `Final (${finalGames.length}): ${finalGames.map((game) => `${game.awayTeam} ${game.awayScore} @ ${game.homeTeam} ${game.homeScore}`).join('; ') || 'none'}\n\n` +
    `Pending (${pendingGames.length}): ${pendingGames.map((game) => `${game.awayTeam} @ ${game.homeTeam}`).join('; ') || 'none'}\n\n` +
    `## Week ${week} tickets (${affected.length})\n\n` +
    affected.map((bet) => `- ${bet.id}: **${bet.status}**${bet.result ? ` (${bet.result})` : ''}`).join('\n') + '\n';
}

export async function reconcilePortfolio({ dryRun = true, week, season } = {}) {
  if (!Number.isInteger(week) || week < 1) throw new Error('A valid regular-season --week is required.');
  const wagers = JSON.parse(await readFile(WAGERS_FILE, 'utf8'));
  const games = await fetchWeekScoreboard({ season, week });
  const boxes = new Map();
  for (const game of games.filter((item) => item.completed)) boxes.set(game.key, await fetchBoxscore(game.id));

  const reconciled = wagers.map((bet) => {
    if (Number(bet.week) !== week) return bet;
    // Never re-grade a settled ticket: it may carry manual grades or the book's
    // actual payout, which a fresh ESPN pass must not overwrite.
    if (bet.status === 'SETTLED') return bet;
    const legs = (bet.legs || []).map((leg) => {
      const box = boxes.get(gameKeyFromLeg(leg));
      if (!box) return leg.status === 'OPEN' ? leg : { ...leg, status: 'PENDING' };
      const grade = gradeLeg(leg, box);
      return { ...leg, status: grade.status, actual_stat: grade.actual };
    });
    const outcome = ticketOutcome(bet, legs);
    return { ...bet, ...outcome, graded_at: outcome.status === 'SETTLED' ? new Date().toISOString() : bet.graded_at, legs };
  });

  const report = buildReport({ season, week, games, wagers: reconciled });
  console.log(report);
  if (!dryRun) {
    await writeFile(WAGERS_FILE, JSON.stringify(reconciled, null, 2), 'utf8');
    await mkdir(path.dirname(REPORT_MD_FILE), { recursive: true });
    await writeFile(REPORT_MD_FILE, report, 'utf8');
    await writeFile(REPORT_JSON_FILE, JSON.stringify({ generated_at: new Date().toISOString(), season, week, games, wagers: reconciled.filter((bet) => Number(bet.week) === week) }, null, 2), 'utf8');
  }
  return { games, wagers: reconciled, report };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const args = process.argv.slice(2);
  const info = getNFLWeekInfo();
  const weekIndex = args.indexOf('--week');
  const seasonIndex = args.indexOf('--season');
  const week = weekIndex >= 0 ? Number(args[weekIndex + 1]) : info.week;
  const season = seasonIndex >= 0 ? Number(args[seasonIndex + 1]) : info.season;
  reconcilePortfolio({ dryRun: args.includes('--dry-run'), week, season })
    .catch((error) => { console.error(`Reconciliation failed: ${error.message}`); process.exitCode = 1; });
}
