/**
 * Unit tests for scripts/props/dkp-event-feed-capture.mjs (pure decode + gate helpers).
 * Fixture: real DK Predictions feed responses for DAL @ GB (event 34118185), captured 2026-10-18.
 * Run: npx vitest run tests/unit/dkpEventFeed.test.js
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  americanOf, classifyMarket, decodeFeedResponses, validateEventCapture, TAB_STEPS,
  eventIdFromInput, summarizeRows, weekWindow,
} from '../../scripts/props/dkp-event-feed-capture.mjs';

const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'dkp-feed-dal-gb-2026-10-18.json'), 'utf8'));
const decoded = decodeFeedResponses(fixture.responses, '34118185');

describe('helpers', () => {
  it('parses DK unicode-minus American odds', () => {
    expect(americanOf({ american: '\u2212178' })).toBe(-178);
    expect(americanOf({ american: '+127' })).toBe(127);
    expect(americanOf(undefined)).toBeNull();
  });
  it('classifies market types', () => {
    expect(classifyMarket('Anytime Touchdown Scorer')).toBe('atd_1_plus');
    expect(classifyMarket('1st Touchdown Scorer')).toBe('first_td');
    expect(classifyMarket('Receiving Yards Milestones')).toBe('rec_yds');
    expect(classifyMarket('Total Points - 1st Half')).toBe('1h_game_total');
    expect(classifyMarket('Something New')).toBe('other');
    // Defensive chips (added 2026-10-29): combined T+A must not fall into solo tackles.
    expect(classifyMarket('Tackles + Assists Milestones')).toBe('tackles_assists');
    expect(classifyMarket('Tackles and Assists O/U')).toBe('tackles_assists');
    expect(classifyMarket('', 'Xavier McKinney Tackles + Assists')).toBe('tackles_assists');
    expect(classifyMarket('Tackles Milestones')).toBe('tackles');
    expect(classifyMarket('Solo Tackles O/U')).toBe('tackles');
    expect(classifyMarket('Assists Milestones')).toBe('assists');
    expect(classifyMarket('Sacks Milestones')).toBe('sacks');
  });
  it('extracts event ids from ids and URLs', () => {
    expect(eventIdFromInput('34118185')).toBe('34118185');
    expect(eventIdFromInput('https://predictions.draftkings.com/en/event/dal-cowboys-%40-gb-packers/34118185')).toBe('34118185');
  });
  it('week window covers Monday night', () => {
    const w = weekWindow(6);
    expect(new Date('2026-10-20T00:15:00Z') <= w.end).toBe(true);
    expect(new Date('2026-10-13T00:00:00Z') >= w.start).toBe(true);
  });
});

describe('decodeFeedResponses on the DAL@GB fixture', () => {
  it('resolves the event and teams', () => {
    expect(decoded.event.eventId).toBe('34118185');
    expect(decoded.event.away).toBe('DAL');
    expect(decoded.event.home).toBe('GB');
  });
  it('decodes anytime TD with DK American odds and team', () => {
    const lloyd = decoded.rows.find(r => r.market === 'atd_1_plus' && r.player === 'MarShawn Lloyd');
    expect(lloyd.american).toBe(-113);
    expect(lloyd.team).toBe('GB');
    const javonte = decoded.rows.find(r => r.market === 'atd_1_plus' && r.player === 'Javonte Williams');
    expect(javonte.american).toBe(-178);
    expect(javonte.team).toBe('DAL');
  });
  it('decodes O/U lines with points and main-line flag', () => {
    const o = decoded.rows.find(r => r.market === 'pass_yds' && r.kind === 'ou' && r.player === 'Dak Prescott' && r.side === 'Over');
    expect(o.line).toBe(277.5);
    expect(o.american).toBe(-113);
    expect(o.isMainLine).toBe(true);
  });
  it('turns integer milestones into half-point equivalents', () => {
    const m = decoded.rows.find(r => r.kind === 'milestone' && r.market === 'rec_yds' && r.player === 'CeeDee Lamb' && r.milestone === 80);
    expect(m.lineEquiv).toBe(79.5);
  });
  it('covers the markets a prop card needs and passes the gate', () => {
    const by = summarizeRows(decoded.rows);
    for (const k of ['atd_1_plus', 'first_td', 'td_2_plus', 'pass_yds', 'pass_td', 'rec_yds', 'rec', 'rush_yds', 'carries', 'team_total', 'sacks']) {
      expect(by[k]).toBeGreaterThan(0);
    }
    const gate = validateEventCapture(decoded, { expectTeams: ['DAL', 'GB'] });
    expect(gate.defects).toEqual([]);
    expect(gate.pass).toBe(true);
  });
  it('fails the gate on a wrong game or an empty feed', () => {
    expect(validateEventCapture(decoded, { expectTeams: ['NE', 'CHI'] }).pass).toBe(false);
    const empty = decodeFeedResponses([], '1');
    expect(validateEventCapture(empty).pass).toBe(false);
  });
});

describe('defensive tab chips', () => {
  it('clicks every defensive chip so tackles markets load', () => {
    const def = TAB_STEPS.find(([tab]) => tab === 'DEFENSIVE');
    expect(def[1]).toEqual(['Tackles + Assists', 'Tackles', 'Assists']);
  });
});
