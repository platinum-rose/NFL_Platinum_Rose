// tests/unit/scopedDossier.test.js
//
// rev-22-review finding #6: none of the seven new frontier-synthesis
// helper modules had direct automated regression coverage -- the adversarial
// probes proving each fix lived only in throwaway repo-root scripts
// (_rev20_verify_scope.mjs etc.), invisible to `npx vitest run`. This file
// (and scopeEnforcement.test.js, committeeStages.test.js) promote that
// coverage into the real suite.
import { describe, expect, it } from 'vitest';
import { NFL_TEAMS } from '../../src/lib/teams.js';
import { buildScopedDossier, SCOPED_MARKETS } from '../../agents/lib/scoped-dossier.js';

const CANONICAL_TEAMS = Object.keys(NFL_TEAMS);

function makeRow(team, overrides = {}) {
  return { team, team_nick: team, fair_prob: 0.5, best_price: -110, ...overrides };
}

function makeDossier(overrides = {}) {
  const team_profiles = {};
  const wins = [];
  const playoffs = [];
  for (const team of CANONICAL_TEAMS) {
    team_profiles[team] = {
      team, prior: { wins: 8 }, sos: { market: 8.5 }, analytics: { off_epa_rank: 10 },
      injuries: { injury_count: 0 }, player_availability: {}, extra_unscoped_field: 'should be dropped',
    };
    wins.push(makeRow(team));
    playoffs.push(makeRow(team));
  }
  return {
    meta: { season: 2026, snapshot_count: 100, books: ['fanduel'], local_futures_imports: { prediction_market_map: { path: 'x' } } },
    synthesis_input: { wins, playoffs, superbowl: [{ team: 'Bills' }] },
    experts: {
      'Analyst A': [{ team: 'Bills', market: 'wins', direction: 'over', strength: 0.6 }, { team: 'Bills', market: 'superbowl', direction: 'back', strength: 0.5 }],
      'Analyst B': [{ team: 'Chiefs', market: 'superbowl', direction: 'back', strength: 0.7 }],
    },
    adjacent_signals: { should: 'be dropped' },
    sos: { should: 'be dropped' },
    injuries: { should: 'be dropped' },
    player_availability: { should: 'be dropped' },
    schedule: [{ should: 'be dropped' }],
    detail: { superbowl: { should: 'be dropped' } },
    roster_churn: { Bills: { adds: [] } },
    team_profiles,
    ...overrides,
  };
}

describe('buildScopedDossier — allowlist shape', () => {
  it('returns exactly the five allowlisted top-level keys', () => {
    const scoped = buildScopedDossier(makeDossier());
    expect(Object.keys(scoped).sort()).toEqual(['experts', 'meta', 'roster_churn', 'synthesis_input', 'team_profiles'].sort());
  });

  it('drops every out-of-scope top-level field (detail/schedule/sos/injuries/player_availability/adjacent_signals)', () => {
    const scoped = buildScopedDossier(makeDossier());
    for (const key of ['detail', 'schedule', 'sos', 'injuries', 'player_availability', 'adjacent_signals']) {
      expect(key in scoped).toBe(false);
    }
  });

  it('meta only carries season/snapshot_count/books, not local_futures_imports', () => {
    const scoped = buildScopedDossier(makeDossier());
    expect(Object.keys(scoped.meta).sort()).toEqual(['books', 'season', 'snapshot_count'].sort());
  });

  it('synthesis_input only carries wins/playoffs, never superbowl or any other market', () => {
    const scoped = buildScopedDossier(makeDossier());
    expect(Object.keys(scoped.synthesis_input).sort()).toEqual([...SCOPED_MARKETS].sort());
  });

  it('team_profiles drops the extra unscoped field on every team', () => {
    const scoped = buildScopedDossier(makeDossier());
    for (const team of CANONICAL_TEAMS) {
      expect('extra_unscoped_field' in scoped.team_profiles[team]).toBe(false);
    }
  });

  it('experts are filtered to only wins/playoffs picks, dropping analysts with none in scope', () => {
    const scoped = buildScopedDossier(makeDossier());
    expect(Object.keys(scoped.experts)).toEqual(['Analyst A']);
    expect(scoped.experts['Analyst A']).toHaveLength(1);
    expect(scoped.experts['Analyst A'][0].market).toBe('wins');
  });
});

describe('buildScopedDossier — fail-closed input validation', () => {
  it('throws on a non-object dossier', () => {
    expect(() => buildScopedDossier(null)).toThrow(/not a plain object/);
  });

  it('throws when team_profiles is missing a canonical team', () => {
    const d = makeDossier();
    delete d.team_profiles[CANONICAL_TEAMS[0]];
    expect(() => buildScopedDossier(d)).toThrow(/team\(s\)/);
  });

  it('throws when team_profiles has an extra/non-canonical team', () => {
    const d = makeDossier();
    d.team_profiles.FakeTeam = d.team_profiles[CANONICAL_TEAMS[0]];
    expect(() => buildScopedDossier(d)).toThrow(/32/);
  });

  it('throws when a market is missing from synthesis_input', () => {
    const d = makeDossier();
    delete d.synthesis_input.wins;
    expect(() => buildScopedDossier(d)).toThrow(/synthesis_input\.wins is missing or not an array/);
  });

  it('throws when a market array is not an array', () => {
    const d = makeDossier();
    d.synthesis_input.wins = 'nope';
    expect(() => buildScopedDossier(d)).toThrow(/synthesis_input\.wins is missing or not an array/);
  });

  it('throws when a market array has fewer than 32 rows', () => {
    const d = makeDossier();
    d.synthesis_input.wins = [d.synthesis_input.wins[0]];
    expect(() => buildScopedDossier(d)).toThrow(/has 1 row\(s\), expected exactly 32/);
  });

  it('throws when a market array has a duplicate team_nick (even at 32 rows total)', () => {
    const d = makeDossier();
    d.synthesis_input.wins[5] = { ...d.synthesis_input.wins[5], team_nick: d.synthesis_input.wins[0].team_nick };
    expect(() => buildScopedDossier(d)).toThrow(/duplicate team_nick/);
  });

  it('throws when a market row is not a plain object', () => {
    const d = makeDossier();
    d.synthesis_input.playoffs[3] = 'nope';
    expect(() => buildScopedDossier(d)).toThrow(/is not a plain object/);
  });

  it('throws when experts is present but not a plain object', () => {
    const d = makeDossier();
    d.experts = 'nope';
    expect(() => buildScopedDossier(d)).toThrow(/experts is present but not a plain object/);
  });

  it('does not throw on a real, complete, valid dossier shape', () => {
    expect(() => buildScopedDossier(makeDossier())).not.toThrow();
  });
});
