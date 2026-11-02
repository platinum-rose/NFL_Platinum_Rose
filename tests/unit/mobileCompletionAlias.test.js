import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('../../scripts/generate-live-tracker-mobile.mjs', import.meta.url), 'utf8');
const numericHelpers = [source.match(/^const num = .*$/m)[0], source.match(/^const frac = .*$/m)[0]].join('\n');
const stats = source.slice(source.indexOf('const STAT ='), source.indexOf('// ---------- grading'));
const grader = source.slice(source.indexOf('async function gradeLeg('), source.indexOf('\nconst legTeams'));

describe('mobile legacy completion labels during a live game', () => {
  it.each(['pass_completions', 'completions'])('grades %s with target_stat completions from the QB completion count', async (market) => {
    const players = new Map([['mckee', { groups: { passing: { 'completions/passingAttempts': '21/30' } } }]]);
    const gradeLeg = vm.runInNewContext(`${numericHelpers}\n${stats}\n${grader}\ngradeLeg`, {
      findEvent: (events) => events[0], loadBox: async () => players,
      findPlayer: (box) => box.get('mckee'),
    });
    const result = await gradeLeg({ player: 'Tanner McKee', market, target_stat: 'completions',
      selection: 'Tanner McKee 21+ Passing Completions', line: 20.5, direction: 'over' },
    [{ id: 'fixture', state: 'in', completed: false, awayScore: 0, homeScore: 0 }]);
    expect(result).toMatchObject({ status: 'WON', value: 21, now: '21 cmp', locked: true });
  });
});
