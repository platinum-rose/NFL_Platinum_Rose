import { describe, expect, it } from 'vitest';
import { extractTeamScoringCounts, gradeTeamCountLeg } from '../../scripts/lib/team-scoring-counts.mjs';

const fixture = () => ({
  header: { id: 'game', competitions: [{ status: { type: { state: 'in', completed: false } }, competitors: [
    { team: { id: '23', abbreviation: 'PIT' }, score: '7' },
    { team: { id: '5', abbreviation: 'CLE' }, score: '0' },
  ] }] },
  scoringPlays: [{ team: { id: '23' }, type: { text: 'Passing Touchdown', abbreviation: 'TD' } }],
  boxscore: { players: [{ team: { abbreviation: 'PIT' }, statistics: [
    { name: 'passing', keys: ['passingTouchdowns'], athletes: [{ stats: ['1'] }] },
    { name: 'receiving', keys: ['receivingTouchdowns'], athletes: [{ stats: ['1'] }] },
  ] }] },
});
const leg = { team: 'PIT', eventId: 'game', market: 'team_touchdowns', direction: 'under', line: 2.5 };

describe('team scoring counts', () => {
  it('counts a passing touchdown once, including defense and return scores', () => {
    const summary = fixture();
    expect(extractTeamScoringCounts(summary, 'game').PIT.touchdowns).toBe(1);
    summary.scoringPlays.push(...['Interception Return Touchdown', 'Kickoff Return Touchdown'].map((text) => ({ team: { id: '23' }, type: { text, abbreviation: 'TD' } })));
    expect(extractTeamScoringCounts(summary).PIT.touchdowns).toBe(3);
  });

  it('reads made FG totals without adding attempts, extra points, or duplicate athlete rows', () => {
    const summary = fixture();
    summary.boxscore.players[0].statistics.push({ name: 'kicking', keys: ['fieldGoalsMade/fieldGoalAttempts', 'extraPointsMade/extraPointAttempts'], totals: ['1/2', '1/1'], athletes: [{ stats: ['1/2', '1/1'] }] });
    summary.scoringPlays.push({ team: { id: '23' }, scoringType: { name: 'field-goal' }, type: { text: 'Field Goal Good', abbreviation: 'FG' } });
    expect(extractTeamScoringCounts(summary).PIT.fieldGoals).toBe(1);
    expect(extractTeamScoringCounts(summary).CLE.fieldGoals).toBe(0);
  });

  it('does not turn missing, mismatched, or conflicting evidence into zero', () => {
    const summary = fixture();
    expect(extractTeamScoringCounts(summary, 'different')).toEqual({});
    delete summary.scoringPlays;
    expect(extractTeamScoringCounts(summary).PIT.touchdowns).toBeNull();
    expect(gradeTeamCountLeg(leg, extractTeamScoringCounts(summary)).status).toBe('CHECK');
    summary.scoringPlays = [];
    summary.boxscore.players[0].statistics.push({ name: 'kicking', keys: ['fieldGoalsMade/fieldGoalAttempts'], totals: ['-'] });
    expect(extractTeamScoringCounts(summary).PIT.fieldGoals).toBeNull();
    summary.scoringPlays = [{ team: { id: '23' }, type: { text: 'Field Goal Good', abbreviation: 'FG' } }];
    summary.boxscore.players[0].statistics.at(-1).totals = ['2/2'];
    expect(extractTeamScoringCounts(summary).PIT.fieldGoals).toBeNull();
  });

  it('keeps PIT under 2.5 live at one or two, loses at three, and wins only at final', () => {
    const counts = extractTeamScoringCounts(fixture());
    expect(gradeTeamCountLeg(leg, counts)).toMatchObject({ status: 'LIVE', value: 1, locked: false });
    counts.PIT.touchdowns = 2;
    expect(gradeTeamCountLeg(leg, counts).status).toBe('LIVE');
    counts.PIT.touchdowns = 3;
    expect(gradeTeamCountLeg(leg, counts).status).toBe('LOST');
    counts.PIT.touchdowns = 2;
    counts.PIT.completed = true;
    expect(gradeTeamCountLeg(leg, counts).status).toBe('WON');
  });

  it('hits the FG over at two, loses at final with one, and supports integer pushes', () => {
    const counts = extractTeamScoringCounts(fixture());
    const fg = { ...leg, market: 'team_field_goals', direction: 'over', line: 1.5 };
    counts.PIT.fieldGoals = 1;
    expect(gradeTeamCountLeg(fg, counts).status).toBe('LIVE');
    counts.PIT.fieldGoals = 2;
    expect(gradeTeamCountLeg(fg, counts).status).toBe('WON');
    counts.PIT.completed = true;
    counts.PIT.fieldGoals = 1;
    expect(gradeTeamCountLeg(fg, counts).status).toBe('LOST');
    expect(gradeTeamCountLeg({ ...fg, line: 1 }, counts).status).toBe('PUSH');
    expect(gradeTeamCountLeg({ ...fg, eventId: 'other' }, counts).status).toBe('CHECK');
  });

  it('can run unchanged inside the standalone desktop page', () => {
    const browserExtract = new Function(`return (${extractTeamScoringCounts.toString()})`)();
    const browserGrade = new Function(`return (${gradeTeamCountLeg.toString()})`)();
    expect(browserGrade(leg, browserExtract(fixture()))).toEqual(gradeTeamCountLeg(leg, extractTeamScoringCounts(fixture())));
  });
});
