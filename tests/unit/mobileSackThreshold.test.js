import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

// Exercise the CLI's real grader with a supplied box score, without rebuilding trackers.
const source = readFileSync(new URL('../../scripts/generate-live-tracker-mobile.mjs', import.meta.url), 'utf8');
const numericHelpers = [source.match(/^const num = .*$/m)[0], source.match(/^const frac = .*$/m)[0]].join('\n');
const stats = source.slice(source.indexOf('const STAT ='), source.indexOf('// ---------- grading'));
const grader = source.slice(source.indexOf('async function gradeLeg('), source.indexOf('\nconst legTeams'));

async function grade(selection, line, sacks, completed) {
  const players = new Map([['oweh', { groups: { defensive: { sacks: String(sacks) } } }]]);
  const gradeLeg = vm.runInNewContext(`${numericHelpers}\n${stats}\n${grader}\ngradeLeg`, {
    findEvent: (events) => events[0], loadBox: async () => players,
    findPlayer: (box) => box.get('oweh'),
  });
  return gradeLeg({ player: 'Odafe Oweh', market: 'sacks', target_stat: 'sacks', selection, line, direction: 'over' },
    [{ id: 'fixture', state: completed ? 'post' : 'in', completed, awayScore: 0, homeScore: 0 }]);
}

describe('mobile explicit sack thresholds', () => {
  it('fulfills 0.5+ Total Sacks with a credited half-sack', async () => {
    expect(await grade('Odafe Oweh 0.5+ Total Sacks', 0.5, 0.5, false))
      .toMatchObject({ status: 'WON', value: 0.5, locked: true });
  });
  it('leaves zero sacks live, then grades the final zero as lost', async () => {
    expect(await grade('Odafe Oweh 0.5+ Total Sacks', 0.5, 0, false))
      .toMatchObject({ status: 'LIVE', value: 0, locked: false, now: '0 sacks · needs 0.5 more' });
    expect(await grade('Odafe Oweh 0.5+ Total Sacks', 0.5, 0, true))
      .toMatchObject({ status: 'LOST', value: 0, locked: true });
  });
  it('requires a full sack when the receipt instead says 1+', async () => {
    expect(await grade('Odafe Oweh 1+ Sacks', 0.5, 0.5, true)).toMatchObject({ status: 'LOST' });
    expect(await grade('Odafe Oweh 1+ Sacks', 0.5, 1, false)).toMatchObject({ status: 'WON' });
  });
  it('preserves strict over/under behavior for an ordinary Over 0.5 line', async () => {
    expect(await grade('Odafe Oweh Over 0.5 Sacks', 0.5, 0.5, true))
      .toMatchObject({ status: 'PUSH', value: 0.5 });
  });
});
