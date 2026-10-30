import { describe, it, expect } from 'vitest';
import { parseBetOnlineSgpText, inferTeams } from '../../scripts/props/betonline-sgp-ladder-parse.mjs';
import { dkThreshold, normalizeDkRow, implied } from '../../scripts/props/build-defensive-boards.mjs';
import { validateDefenseCapture, classifyMarket } from '../../scripts/props/dkp-event-feed-capture.mjs';
import { priceOffers } from '../../scripts/build-defensive-props.mjs';

const BOARD = [
  'Game Markets (Parlays only)', '', 'handicap win ', 'CAR (+3.5)', ' -110', '', 'GB (-3.5)', ' -115', '',
  'receptions (Exact)', 'Some Receiver', 'Carolina Panthers', '3', '+400', '',
  'Tackles + Assists', '', 'Xavier McKinney', '', 'Green Bay Packers', '', '4+', '', '-271', '', '5+', '', '-124', '',
  'Isaiah McDuffie', 'Green Bay Packers', '8+', '-213', '9+', '-106', '',
  'Sacks', 'Lukas Van Ness', 'Green Bay Packers', '1+', '+150', '2+', '+900', '',
  'Interceptions', 'Evan Williams', 'Green Bay Packers', '1+', '+624', '',
  'Pass Interceptions', 'Bryce Young', 'Carolina Panthers', '1+', '-130',
].join('\n');

describe('BetOnline SGP ladder parser', () => {
  const { rows } = parseBetOnlineSgpText(BOARD, { game: 'CAR@GB', capturedAt: '2026-10-29T22:59:00Z' });
  it('reads every defensive ladder rung with its price', () => {
    const ta = rows.filter(r => r.market === 'tackles_assists');
    expect(ta.map(r => [r.player, r.threshold, r.american])).toEqual([
      ['Xavier McKinney', 4, -271], ['Xavier McKinney', 5, -124], ['Isaiah McDuffie', 8, -213], ['Isaiah McDuffie', 9, -106]]);
    expect(ta[0]).toMatchObject({ team: 'GB', line: 3.5, book: 'BEO' });
    expect(rows.find(r => r.market === 'sacks' && r.threshold === 2).american).toBe(900);
    expect(rows.find(r => r.market === 'def_int').player).toBe('Evan Williams');
    expect(rows.find(r => r.market === 'pass_int')).toMatchObject({ player: 'Bryce Young', team: 'CAR', american: -130 });
  });
  it('skips Exact/Bands sections', () => {
    expect(rows.some(r => r.player === 'Some Receiver')).toBe(false);
  });
  it('infers the teams from the spread lines', () => {
    expect(inferTeams(BOARD)).toEqual(['CAR', 'GB']);
  });
});

describe('defensive board collector', () => {
  it('maps DK labels to N+ thresholds', () => {
    expect(dkThreshold({ label: '0.5+' })).toBe(1);
    expect(dkThreshold({ label: '4+' })).toBe(4);
    expect(dkThreshold({ label: 'Over 6.5' })).toBe(7);
    expect(dkThreshold({ line: 3.5 })).toBe(4);
  });
  it('keeps only yes/over defensive DK rows', () => {
    const base = { market: 'tackles_assists', player: 'X', team: 'GB', label: '4+', american: -150, side: 'Yes' };
    expect(normalizeDkRow(base, 'CAR@GB', 't')).toMatchObject({ book: 'DKP', threshold: 4, line: 3.5 });
    expect(normalizeDkRow({ ...base, side: 'No' }, 'CAR@GB', 't')).toBeNull();
    expect(normalizeDkRow({ ...base, market: 'rec_yds' }, 'CAR@GB', 't')).toBeNull();
    expect(implied(-300)).toBeCloseTo(0.75, 3);
    expect(implied(150)).toBeCloseTo(0.4, 3);
  });
});

describe('DK defense-only capture gate', () => {
  it('passes a defensive-only feed and classifies T+A apart from solo tackles', () => {
    const rows = Array.from({ length: 6 }, (_, i) => ({ market: i % 2 ? 'tackles_assists' : 'sacks', american: 120 }));
    expect(validateDefenseCapture({ event: { eventId: '1', away: 'CAR', home: 'GB' }, rows }).pass).toBe(true);
    expect(validateDefenseCapture({ event: { eventId: '1', away: 'CAR', home: 'GB' }, rows: rows.slice(0, 2) }).pass).toBe(false);
    expect(classifyMarket('Tackles + Assists Milestones')).toBe('tackles_assists');
  });
});

describe('pricing offers against the sheet', () => {
  it('computes model probability, edge and EV with the role/vacated shift', () => {
    const profiles = [{ player: 'Xavier McKinney', team: 'GB', game_log_ta: [3, 4, 5, 5, 1, 3, 10], sack_game_rate: 0 }];
    const sheet = [{ player: 'Xavier McKinney', team: 'GB', game: 'CAR @ GB', group: 'S', avg_ta: 4.43, proj_ta: 4.5, shift: 0 }];
    const [o] = priceOffers([{ book: 'BEO', player: 'Xavier McKinney', team: 'GB', market: 'tackles_assists', threshold: 4, american: -271 }], sheet, profiles);
    expect(o.model_prob).toBeCloseTo(0.10 + 0.67 * (4 / 7), 2);
    expect(o.implied).toBeCloseTo(0.73, 2);
    expect(o.edge).toBeLessThan(-0.2);
    const [shifted] = priceOffers([{ book: 'BEO', player: 'Xavier McKinney', team: 'GB', market: 'tackles_assists', threshold: 4, american: -271 }], [{ ...sheet[0], shift: 1 }], profiles);
    expect(shifted.model_prob).toBeCloseTo(0.10 + 0.67 * (6 / 7), 2);
  });
});

describe('drop-folder capture time', () => {
  it('reads file-name times as Pacific regardless of the process timezone', async () => {
    const { pacificToIso } = await import('../../scripts/props/betonline-sgp-ladder-parse.mjs');
    expect(pacificToIso('2026-10-29', '15', '59')).toBe('2026-10-29T22:59:00.000Z'); // PDT
    expect(pacificToIso('2026-11-15', '10', '00')).toBe('2026-11-15T18:00:00.000Z'); // PST
  });
});
