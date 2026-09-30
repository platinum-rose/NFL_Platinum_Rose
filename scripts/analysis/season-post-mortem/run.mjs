import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { boxSummary, gradeLeg, gradeRoundRobin, normalizeTeam } from './grade.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const outDir = path.join(ROOT, 'reports/analysis/w1-3-deep/codex');
const args = process.argv.slice(2);
const weeks = (args[args.indexOf('--weeks') + 1] || '1-3').split('-').map(Number);
const selectedWeeks = new Set(Array.from({ length: weeks[1] - weeks[0] + 1 }, (_, i) => weeks[0] + i));
const csv = (rows, columns) => [columns.join(','), ...rows.map((row) => columns.map((column) => JSON.stringify(row[column] ?? '')).join(','))].join('\n') + '\n';

function loadBoxes() {
  const dir = path.join(ROOT, 'data/fantasy/boxscores');
  return fs.readdirSync(dir).filter((file) => file.endsWith('.json')).map((file) => boxSummary(JSON.parse(fs.readFileSync(path.join(dir, file)))));
}
function boxFor(leg, boxes) {
  const evidence = [leg.team, leg.opponent, leg.game].filter(Boolean).join(' ');
  const claimedTeams = new Set(Object.keys({
    ...Object.fromEntries([...evidence.matchAll(/\b(?:ARI|ATL|BAL|BUF|CAR|CHI|CIN|CLE|DAL|DEN|DET|GB|HOU|IND|JAC|JAX|KC|LV|LVR|LAC|LAR|MIA|MIN|NE|NO|NYG|NYJ|PHI|PIT|SF|SEA|TB|TEN|WAS|WSH)\b/g)].map((match) => [normalizeTeam(match[0]), true])),
    [normalizeTeam(leg.team)]: Boolean(normalizeTeam(leg.team)),
    [normalizeTeam(leg.opponent)]: Boolean(normalizeTeam(leg.opponent)),
  }));
  claimedTeams.delete('null');
  return boxes.find((box) => [...claimedTeams].filter((team) => box.teams[team]).length >= 2) || null;
}
function baseline() {
  const files = [
    path.join(ROOT, 'reports/bets/season-recap/w1legs.json'),
    path.join(ROOT, 'reports/bets/season-recap/w2legs.json'),
    path.join(ROOT, 'reports/bets/week3-recap/w3legs.json'),
  ];
  const rows = files.flatMap((file) => {
    const parsed = JSON.parse(fs.readFileSync(file));
    return Array.isArray(parsed) ? parsed : parsed.legs || [];
  });
  return new Map(rows.map((row) => [`${row.ticket}|${row.label}`, {
    result: row.result === 'W' ? 'WON' : row.result === 'L' ? 'LOST' : row.result === 'P' ? 'PUSH' : String(row.result || '').toUpperCase(),
    origin: row.origin ?? '', ai_src: (row.ai_src || []).join('|'),
  }]));
}

const wagers = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/official-picks/user-placed-wagers-2026.json')))
  .filter((ticket) => selectedWeeks.has(ticket.week));
const boxes = loadBoxes();
const prior = baseline();
const terminal = new Set(['WON', 'LOST', 'PUSH']);
const legs = wagers.flatMap((ticket) => ticket.legs.map((leg, index) => {
  const result = gradeLeg(leg, boxFor(leg, boxes));
  const baseline = prior.get(`${ticket.id}|${leg.selection}`) ?? null;
  const baselineResult = baseline?.result ?? null;
  const ledgerStatus = String(leg.status || '').toUpperCase();
  const ledgerComparison = !terminal.has(result.result) ? 'independent_unresolved'
    : !terminal.has(ledgerStatus) ? `ledger_${ledgerStatus.toLowerCase() || 'missing'}`
      : ledgerStatus === result.result ? 'match' : 'terminal_mismatch';
  const baselineComparison = !baselineResult ? 'not_published'
    : !terminal.has(result.result) ? 'independent_unresolved'
      : !terminal.has(baselineResult) ? `baseline_${baselineResult.toLowerCase()}`
        : baselineResult === result.result ? 'match' : 'terminal_mismatch';
  return {
    week: ticket.week, book: ticket.book, ticket: ticket.id, structure: ticket.ticket_type, leg: index + 1,
    game: leg.game, player: leg.player, market: leg.market, direction: leg.selection, line: leg.line ?? null, price: leg.price ?? null,
    implied_prob: null, result: result.result, actual: result.actual, evidence: result.reason ?? 'local_espn_boxscore',
    ledger_status: ledgerStatus, ledger_comparison: ledgerComparison, baseline_result: baselineResult, baseline_comparison: baselineComparison,
    baseline_origin: baseline?.origin ?? '', baseline_ai_sources: baseline?.ai_src ?? '',
    disagreement: ledgerComparison === 'terminal_mismatch' ? 'ledger' : baselineComparison === 'terminal_mismatch' ? 'baseline' : '',
  };
}));
const tickets = wagers.map((ticket) => {
  const ticketLegs = legs.filter((leg) => leg.ticket === ticket.id);
  const rr = /round robin/i.test(ticket.ticket_type);
  const rrSize = Number(ticket.ticket_type.match(/(\d+)\s*(?:team|leg)/i)?.[1]) || 2;
  const comboResults = rr ? gradeRoundRobin(ticketLegs.map((leg) => leg.result), rrSize) : [];
  const result = rr ? (comboResults.includes('WON') ? 'PARTIAL_OR_WON' : comboResults.includes('UNRESOLVED') ? 'UNRESOLVED' : 'LOST')
    : ticketLegs.some((leg) => leg.result === 'LOST') ? 'LOST' : ticketLegs.every((leg) => leg.result === 'WON') ? 'WON' : 'UNRESOLVED';
  return { week: ticket.week, book: ticket.book, ticket: ticket.id, structure: ticket.ticket_type, stake_usd: ticket.stake_usd, ledger_result: ticket.result, independent_result: result, legs: ticketLegs.length, unresolved_legs: ticketLegs.filter((leg) => leg.result === 'UNRESOLVED').length, rr_combos: comboResults.length, rr_wins: comboResults.filter((value) => value === 'WON').length };
});
const summary = {
  generated_at: new Date().toISOString(), weeks: [...selectedWeeks], tickets: tickets.length, legs: legs.length,
  result_counts: Object.fromEntries(Object.entries(Object.groupBy(legs, (leg) => leg.result)).map(([key, values]) => [key, values.length])),
  ledger_terminal_mismatches: legs.filter((leg) => leg.disagreement === 'ledger').length,
  baseline_terminal_mismatches: legs.filter((leg) => leg.disagreement === 'baseline').length,
  ledger_comparison_counts: Object.fromEntries(Object.entries(Object.groupBy(legs, (leg) => leg.ledger_comparison)).map(([key, values]) => [key, values.length])),
  baseline_comparison_counts: Object.fromEntries(Object.entries(Object.groupBy(legs, (leg) => leg.baseline_comparison)).map(([key, values]) => [key, values.length])),
  unresolved_by_reason: Object.fromEntries(Object.entries(Object.groupBy(legs.filter((leg) => leg.result === 'UNRESOLVED'), (leg) => leg.evidence)).map(([key, values]) => [key, values.length])),
};
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'legs_all.csv'), csv(legs, ['week','book','ticket','structure','leg','game','player','market','direction','line','price','implied_prob','result','actual','evidence','ledger_status','ledger_comparison','baseline_result','baseline_comparison','baseline_origin','baseline_ai_sources','disagreement']));
fs.writeFileSync(path.join(outDir, 'tickets_all.csv'), csv(tickets, ['week','book','ticket','structure','stake_usd','ledger_result','independent_result','legs','unresolved_legs','rr_combos','rr_wins']));
fs.writeFileSync(path.join(outDir, 'regrade_legs.json'), JSON.stringify(legs, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'regrade_summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
