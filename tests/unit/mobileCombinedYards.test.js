import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

// Exercise the real inline grader without invoking the networked tracker CLI.
const source = readFileSync(new URL('../../scripts/generate-live-tracker-mobile.mjs', import.meta.url), 'utf8');
const numericHelpers = [source.match(/^const num = .*$/m)[0], source.match(/^const frac = .*$/m)[0]].join('\n');
const stats = source.slice(source.indexOf('const STAT ='), source.indexOf('// ---------- grading'));
const grader = source.slice(source.indexOf('async function gradeLeg('), source.indexOf('\nconst legTeams'));
const leg = {
  player: 'Saquon Barkley', market: 'rushing_receiving_yards', target_stat: 'rushing_receiving_yards',
  selection: 'Saquon Barkley 60+ Rushing + Receiving Yards', line: 59.5, direction: 'over',
};

async function grade(groups, completed = false) {
  const players = new Map([['barkley', { groups }]]);
  const gradeLeg = vm.runInNewContext(`${numericHelpers}\n${stats}\n${grader}\ngradeLeg`, {
    findEvent: (events) => events[0], loadBox: async () => players,
    findPlayer: (box) => box.get('barkley'),
  });
  return gradeLeg(leg, [{ id: 'fixture', state: completed ? 'post' : 'in', completed, awayScore: 0, homeScore: 0 }]);
}

describe('mobile combined rushing and receiving yards', () => {
  it('combines both categories to fulfill a 60+ leg at exactly 60', async () => {
    expect(await grade({ rushing: { rushingYards: '40' }, receiving: { receivingYards: '20' } }))
      .toMatchObject({ status: 'WON', value: 60, locked: true, now: '60 rush+rec yds' });
  });

  it('keeps 59 yards live until the final whistle, then grades it lost', async () => {
    const groups = { rushing: { rushingYards: '40' }, receiving: { receivingYards: '19' } };
    expect(await grade(groups)).toMatchObject({ status: 'LIVE', value: 59, locked: false });
    expect(await grade(groups, true)).toMatchObject({ status: 'LOST', value: 59, locked: true });
  });

  it.each(['rushing', 'receiving'])('handles a missing other category when %s alone clears the line', async (category) => {
    const field = category === 'rushing' ? 'rushingYards' : 'receivingYards';
    expect(await grade({ [category]: { [field]: '60' } })).toMatchObject({ status: 'WON', value: 60 });
  });
});
