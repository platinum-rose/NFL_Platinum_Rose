import { describe, it, expect } from 'vitest';
import { extractDefensiveRows, buildProfiles, buildStatCrewFactors, buildMatchupSheet, positionGroup } from '../../scripts/build-defensive-props.mjs';

const athlete = (id, name, stats) => ({ athlete: { id, displayName: name }, stats });
const summary = (week, homeScore, awayScore, safetyTot, safetySolo) => ({
  header: { id: `ev${week}`, week, season: { year: 2026 }, competitions: [{ status: { type: { completed: true } }, competitors: [
    { homeAway: 'home', score: String(homeScore), team: { abbreviation: 'GB' } },
    { homeAway: 'away', score: String(awayScore), team: { abbreviation: 'CAR' } },
  ] }] },
  boxscore: {
    teams: [
      { team: { abbreviation: 'GB' }, statistics: [{ name: 'totalOffensivePlays', displayValue: '60' }, { name: 'rushingAttempts', displayValue: '25' }, { name: 'completionAttempts', displayValue: '20/32' }] },
      { team: { abbreviation: 'CAR' }, statistics: [{ name: 'totalOffensivePlays', displayValue: '70' }, { name: 'rushingAttempts', displayValue: '30' }, { name: 'completionAttempts', displayValue: '25/38' }, { name: 'sacksYardsLost', displayValue: '2-14' }] },
    ],
    players: [
      { team: { abbreviation: 'GB' }, statistics: [
        { name: 'defensive', keys: ['totalTackles', 'soloTackles', 'sacks', 'tacklesForLoss', 'passesDefended', 'QBHits', 'defensiveTouchdowns'],
          athletes: [athlete('1', 'Safety One', [String(safetyTot), String(safetySolo), '0', '0', '1', '0', '0']), athlete('2', 'Backer Two', ['10', '6', '1', '1', '0', '2', '0'])] },
        { name: 'interceptions', athletes: [athlete('1', 'Safety One', ['1', '12', '0'])] },
      ] },
    ],
  },
});

describe('defensive props builder', () => {
  it('maps position groups', () => {
    expect(positionGroup('SS')).toBe('S');
    expect(positionGroup('MLB')).toBe('LB');
    expect(positionGroup('DT')).toBe('DL');
    expect(positionGroup('CB')).toBe('CB');
  });

  it('extracts per-defender rows with opponent context', () => {
    const rows = extractDefensiveRows(summary(1, 24, 17, 4, 3), { positionsById: { 1: 'S', 2: 'LB' } });
    const s = rows.find(r => r.player === 'Safety One');
    expect(s).toMatchObject({ team: 'GB', opp: 'CAR', home: true, tackles_assists: 4, solo: 3, assists: 1, interceptions: 1, group: 'S', opp_plays: 70, opp_rush_att: 30, opp_pass_att: 38, final_margin: 7 });
    expect(s.tackle_share).toBeCloseTo(4 / 14, 3);
  });

  it('builds hit rates and win/loss splits', () => {
    const rows = [summary(1, 24, 17, 3, 2), summary(2, 10, 20, 6, 4), summary(3, 30, 10, 4, 4)]
      .flatMap(s => extractDefensiveRows(s, { positionsById: { 1: 'S', 2: 'LB' } }));
    const p = buildProfiles(rows).profiles.find(x => x.player === 'Safety One');
    expect(p.game_log_ta).toEqual([3, 6, 4]);
    expect(p.hit_rate_ta['4+']).toBeCloseTo(0.67, 2);
    expect(p.splits.team_lost.avg_ta).toBe(6);
    expect(p.int_game_rate).toBe(1);
    const crews = buildStatCrewFactors(rows);
    expect(crews.crews.GB.home_games).toBe(3);
  });

  it('drops injured and off-roster players from the matchup sheet', () => {
    const rows = [1, 2, 3].flatMap(w => extractDefensiveRows(summary(w, 20, 10, 5, 3), { positionsById: { 1: 'S', 2: 'LB' } }));
    const { profiles } = buildProfiles(rows);
    const schedule = [{ id: 'x', week: 4, home: 'GB', visitor: 'CAR' }];
    const opp = { offenses: { CAR: { plays_factor: 1, group_factors: { S: 1.2, LB: 1 } } } };
    const sheet = buildMatchupSheet(profiles, opp, { crews: {} }, schedule, 4, {
      rosterById: { 1: { team: 'GB', status: 'active' }, 2: { team: 'GB', status: 'active' } },
      availability: { 'Backer Two|GB': 'OUT' },
    });
    expect(sheet.map(r => r.player)).toEqual(['Safety One']);
    expect(sheet[0].proj_ta).toBe(6);
    expect(sheet.excluded).toEqual([{ player: 'Backer Two', team: 'GB', reason: 'OUT' }]);
  });
});
