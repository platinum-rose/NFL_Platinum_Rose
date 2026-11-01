import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Exercise the inline build-time summarizer without running the networked CLI.
const source = readFileSync(new URL('../../scripts/generate-live-tracker-mobile.mjs', import.meta.url), 'utf8');
const body = source.slice(source.indexOf('function summarizeTicket('), source.indexOf('// ---------- page'));
const summarize = new Function('legTeams', 'normAbbr', `return (${body.trim()})`)(() => [], (t) => t);
const ticket = {
  stake_usd: 6, legs: [{ leg_num: 1 }, { leg_num: 2 }, { leg_num: 3 }],
  round_robin: { combinations: [[1, 2], [1, 3], [2, 3]].map((leg_nums) => ({ leg_nums, stake_usd: 2, to_win_usd: 6 })) },
};

describe('mobile round-robin money', () => {
  it('deducts stakes of losing combinations from the remaining maximum profit', () => {
    const result = summarize(ticket, ['WON', 'PENDING', 'LOST'].map((status) => ({ status })));
    expect(result).toMatchObject({ state: 'open', alive: 1, returnedUsd: 0, maxProfitUsd: 2 });
  });
  it('reports net profit after all original stakes when one combination cashes', () => {
    const result = summarize(ticket, ['WON', 'WON', 'LOST'].map((status) => ({ status })));
    expect(result).toMatchObject({ state: 'cashed', cashed: 1, returnedUsd: 8, maxProfitUsd: 2 });
  });
});
