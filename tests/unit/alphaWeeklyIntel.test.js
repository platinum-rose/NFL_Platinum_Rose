// Guards the 2026-09-19 permanent fix: the Alpha packet must be built FROM the Friday cadence
// outputs and must refuse to build when they are missing, stale, or for the wrong week.
// (It silently shipped static/preseason data in both Week 1 and Week 2 of 2026.)
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  WEEKLY_INTEL_INPUTS,
  evaluateWeeklyIntelFreshness,
  buildWeeklyIntelSection,
  gameStatusRows,
  weeklyIntelForTeam,
} from '../../agents/lib/alpha-weekly-intel.js';

const NOW = '2026-09-19T08:00:00.000Z';
const fresh = (extra = {}) => ({ meta: { generated_at: '2026-09-19T07:00:00.000Z', ...extra } });

const goodInputs = () => ({
  player_availability: {
    ...fresh(),
    events: [
      { player_name: 'Kyler Murray', team_abbr: 'MIN', position: 'QB', event_type: 'out', status_raw: 'Out', availability_trend: 'worsening', impact_bucket: 'qb_major', source: 'ESPN injuries API' },
      { player_name: 'Bradley Chubb', team_abbr: 'BUF', position: 'LB', event_type: 'active_news', status_raw: 'Active', availability_trend: 'unknown', impact_bucket: 'defensive_major', source: 'ESPN injuries API' },
      { player_name: 'Joe Burrow', team_abbr: 'CIN', position: 'QB', event_type: 'limited', status_raw: 'Questionable', availability_trend: 'stable', impact_bucket: 'qb_major', source: 'ESPN injuries API' },
    ],
  },
  projected_starters: { ...fresh(), players: [{ team: 'MIN', player_name: 'Carson Wentz', position: 'QB', role: 'likely_starter_or_primary', starter_confidence: 0.7, needs_human_review: false }] },
  secondary_matchups: { ...fresh({ week: 2 }), matchups: [{ game_id: 'g1', offense_team: 'CHI', defense_team: 'MIN', vulnerability_tier: 'high', severity_score: 5.7, secondary_absences: [], target_receivers: [] }] },
  player_props_intel: { generated_at: '2026-09-19T07:00:00.000Z', week: 2, summary: { total_props: 1 }, props: [{ player: 'DJ Moore', team: 'CHI' }], parlayCards: [] },
});

describe('Alpha weekly intel freshness gate', () => {
  it('passes when every Friday input is fresh and for the current week', () => {
    const result = evaluateWeeklyIntelFreshness({ inputs: goodInputs(), now: NOW, currentWeek: 2 });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('fails when an input is missing', () => {
    const inputs = goodInputs();
    delete inputs.projected_starters;
    const result = evaluateWeeklyIntelFreshness({ inputs, now: NOW, currentWeek: 2 });
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toMatch(/projected_starters.*missing/);
  });

  it('fails when an input is older than the max age', () => {
    const inputs = goodInputs();
    inputs.player_availability.meta.generated_at = '2026-09-12T07:00:00.000Z';
    const result = evaluateWeeklyIntelFreshness({ inputs, now: NOW, currentWeek: 2 });
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toMatch(/player_availability.*stale/);
  });

  it('fails when the secondary matrix or props are for the wrong week (the Week-1 default bug)', () => {
    const inputs = goodInputs();
    inputs.secondary_matchups.meta.week = 1;
    const result = evaluateWeeklyIntelFreshness({ inputs, now: NOW, currentWeek: 2 });
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toMatch(/secondary_matchups.*week 1 != current week 2/);
  });
});

describe('Alpha weekly intel section', () => {
  it('keeps game-status rows and drops generic Active recap rows', () => {
    const rows = gameStatusRows(goodInputs().player_availability);
    expect(rows.map((r) => r.player_name).sort()).toEqual(['Joe Burrow', 'Kyler Murray']);
  });

  it('slices every Friday output per team', () => {
    const inputs = goodInputs();
    const freshness = evaluateWeeklyIntelFreshness({ inputs, now: NOW, currentWeek: 2 });
    const section = buildWeeklyIntelSection({ inputs, freshness, currentWeek: 2 });
    const min = weeklyIntelForTeam(section, 'MIN');
    expect(min.availability[0].player_name).toBe('Kyler Murray');
    expect(min.projected_starters[0].player_name).toBe('Carson Wentz');
    expect(min.secondary_matchups).toHaveLength(1);
    expect(weeklyIntelForTeam(section, 'CHI').player_props[0].player).toBe('DJ Moore');
  });
});

describe('build-alpha-data-packet.js wiring', () => {
  const scriptSource = fs.readFileSync(path.resolve(__dirname, '../../scripts/build-alpha-data-packet.js'), 'utf8');

  it('reads the Friday inputs and gates on their freshness', () => {
    expect(scriptSource).toContain('readWeeklyIntelInputs');
    expect(scriptSource).toContain('evaluateWeeklyIntelFreshness');
    expect(scriptSource).toMatch(/if \(!freshness\.ok && !allowStale\)/);
  });

  it('does not use the static preseason injury list as the primary injury source', () => {
    expect(scriptSource).not.toMatch(/(?<![\w])injuries:\s*EXPERT_INJURIES\b/);
    expect(scriptSource).not.toMatch(/injuries\[team\.abbreviation\]/);
  });

  it('keeps WEEKLY_INTEL_INPUTS in sync with the Friday cadence outputs', () => {
    expect(Object.values(WEEKLY_INTEL_INPUTS)).toEqual([
      'data/player-availability/latest.json',
      'data/projected-starters/2026/latest.json',
      'data/secondary-matchups/latest.json',
      'data/research-intel/review/player-props-intel-latest.json',
    ]);
  });
});
