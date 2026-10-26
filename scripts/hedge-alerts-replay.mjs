#!/usr/bin/env node
/**
 * Replay check for scripts/lib/hedge-alerts.mjs using the real W7 SNF spot
 * (KC @ SEA, 2026-10-25, closing DraftKings SEA -3 / O/U 43.5, final SEA 20-3).
 * Exits non-zero if the module stops flagging it the way it should.
 *   node scripts/hedge-alerts-replay.mjs
 */
import { buildHedgeAlerts, alertMessage, hedgeOutcome } from './lib/hedge-alerts.mjs';

const E = '401873022';
const side = (team, line, sel) => ({ kind: 'side', team, line, eventId: E, selection: sel });
const prop = (sel) => ({ kind: 'prop', dir: 'over', eventId: E, selection: sel });
const tickets = [
  { id: '740512242', book: 'BKR', title: 'BKR 6-team flex', stake: 15, pay: 368.39, open: [side('KC', 3.5, 'KC +3.5')] },
  { id: '740506458', book: 'BKR', title: 'BKR teaser', stake: 30, pay: 75, open: [side('KC', 8, 'KC +8')] },
  { id: '1008725429', book: 'BEO', title: 'BEO dog ML RR', stake: 20, pay: 10.58, open: [side('KC', 0, 'KC ML')],
    rr: { banked: 0, combos: [{ ret: 10.58, openLegs: [side('KC', 0, 'KC ML')] }] } },
  { id: '740822735', book: 'BKR', title: 'BKR SGP pairs', stake: 20, pay: 345.34,
    open: [side('SEA', 0, 'SEA ML'), { kind: 'total', dir: 'over', line: 41, eventId: E, selection: 'Over 41' }] },
  { id: '45488862', book: 'DKP', title: 'DKP 5-pick', stake: 4.94, pay: 77, open: [prop('Darnold 1+ INT')] },
  { id: '45474408', book: 'DKP', title: 'DKP 4-pick', stake: 5.12, pay: 69, open: [prop('Mahomes 2+ pass TD')] },
];
const events = new Map([[E, { id: E, home: 'SEA', away: 'KC', state: 'pre', label: 'KC @ SEA' }]]);
const odds = new Map([[E, { provider: 'DraftKings', home: 'SEA', away: 'KC', spreadHome: -3, spreadOddsHome: -108, spreadOddsAway: -112,
  homeML: -162, awayML: 136, ou: 43.5, overOdds: -105, underOdds: -115 }]]);

const alerts = buildHedgeAlerts(tickets, events, odds);
for (const a of alerts) console.log(alertMessage(a));
const flex = alerts.find((a) => a.type === 'last_game' && a.ticketId === '740512242');
const gap = alerts.find((a) => a.type === 'game_gap');
const fails = [];
if (!flex) fails.push('no last_game alert for the $368 flex');
else if (flex.hedge.market !== 'SEA -3') fails.push(`flex hedge is ${flex.hedge.market}, expected SEA -3`);
if (!gap) fails.push('no game_gap alert for KC @ SEA');
else {
  const dead = gap.table.filter((c) => c.dead).map((c) => `${c.margin}/${c.total}`);
  if (!dead.some((d) => d.startsWith('SEA by 8+') && d.includes('Under'))) fails.push(`dead cells ${dead.join(', ')} miss SEA 8+/Under`);
  // The suggested cover must have won at the actual final (SEA 20, KC 3).
  const [team, ln] = gap.hedge.market.split(' ');
  const mk = /^(Over|Under)$/.test(team) ? { kind: 'total', dir: team.toLowerCase(), line: Number(ln) } : { kind: 'side', team, line: ln === 'ML' ? 0 : Number(ln) };
  if (!hedgeOutcome(mk, odds.get(E), 17, 23)) fails.push(`game cover ${gap.hedge.market} would have lost at SEA 20-3`);
}
if (fails.length) { console.error('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('PASS: flex hedge SEA -3, dead zone SEA 8+/Under, cover wins at the 20-3 final');
