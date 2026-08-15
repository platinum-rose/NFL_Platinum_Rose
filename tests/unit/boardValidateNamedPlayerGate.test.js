import { describe, expect, it } from 'vitest';
import { namedPlayerSizingViolations, validateBoard } from '../../agents/lib/board-validate.js';

function makeGatedDossier() {
  return {
    synthesis_input: {
      wins: [
        {
          team: 'Bills', team_nick: 'Bills', consensus_line: 6.5,
          line_consensus_confidence: { over_n_books: 3, under_n_books: 3 },
          best_over_edge_pct: 3.5, best_under_edge_pct: -2.1,
          books: { bookmaker: { line: 6.5, over: 130, under: -150, over_edge: 3.5, under_edge: -2.1 } },
        },
        {
          team: 'Chiefs', team_nick: 'Chiefs', consensus_line: 10.5,
          line_consensus_confidence: { over_n_books: 4, under_n_books: 4 },
          best_over_edge_pct: 2.0, best_under_edge_pct: -1.0,
          books: { bookmaker: { line: 10.5, over: 110, under: -130, over_edge: 2.0, under_edge: -1.0 } },
        },
      ],
      superbowl_matchup: [
        { team_a: 'Bills', team_b: 'Packers', n_books: 1, best_price: 6500, best_book: 'betus', books: { betus: { price: 6500 } } },
      ],
    },
    team_profiles: {
      Bills: {
        named_player_sizing_gate: {
          blocked_full_sleeve: true,
          max_stake_tier_allowed: ['small', 'speculative'],
          players: ['Connor McGovern'],
          case_ids: ['named-status-buf-connor-mcgovern-2026-08-11'],
        },
      },
      Packers: {
        named_player_sizing_gate: {
          blocked_full_sleeve: true,
          max_stake_tier_allowed: ['small', 'speculative'],
          players: ['Micah Parsons'],
          case_ids: ['named-status-gb-micah-parsons-2026-08-11'],
        },
      },
      Chiefs: { named_player_sizing_gate: null },
    },
  };
}

describe('namedPlayerSizingViolations', () => {
  it('flags a core/standard stake on a gated team', () => {
    const dossier = makeGatedDossier();
    const row = dossier.synthesis_input.wins[0];
    const violations = namedPlayerSizingViolations(dossier, row, { stake_tier: 'core' });
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain('named_player_sizing_gate');
    expect(violations[0]).toContain('Connor McGovern');
  });

  it('does not flag a small/speculative stake on a gated team', () => {
    const dossier = makeGatedDossier();
    const row = dossier.synthesis_input.wins[0];
    expect(namedPlayerSizingViolations(dossier, row, { stake_tier: 'small' })).toEqual([]);
    expect(namedPlayerSizingViolations(dossier, row, { stake_tier: 'speculative' })).toEqual([]);
  });

  it('does not flag any stake on a team with no gate', () => {
    const dossier = makeGatedDossier();
    const row = dossier.synthesis_input.wins[1]; // Chiefs — not gated
    expect(namedPlayerSizingViolations(dossier, row, { stake_tier: 'core' })).toEqual([]);
  });

  it('flags an exacta at core/standard if EITHER leg is gated, even the non-primary side', () => {
    const dossier = makeGatedDossier();
    const row = dossier.synthesis_input.superbowl_matchup[0]; // Bills vs Packers, both gated
    const violations = namedPlayerSizingViolations(dossier, row, { stake_tier: 'standard' });
    expect(violations).toHaveLength(2); // both Bills and Packers legs are gated
    expect(violations.some((v) => v.includes('Bills'))).toBe(true);
    expect(violations.some((v) => v.includes('Packers'))).toBe(true);
  });

  it('is a no-op when the dossier has no team_profiles at all (back-compat with older dossiers)', () => {
    const row = { team: 'Bills', team_nick: 'Bills' };
    expect(namedPlayerSizingViolations({}, row, { stake_tier: 'core' })).toEqual([]);
    expect(namedPlayerSizingViolations(undefined, row, { stake_tier: 'core' })).toEqual([]);
  });

  it('is wired into validateBoard end-to-end via findRow', () => {
    const dossier = makeGatedDossier();
    const violations = validateBoard({
      market: 'wins', selection: 'Bills Over 6.5', book: 'bookmaker', price: 130, edge_pct: 3.5, stake_tier: 'core',
    }, dossier);
    expect(violations.some((v) => v.startsWith('named_player_sizing_gate'))).toBe(true);
  });

  it('validateBoard stays clean for the same candidate at an allowed stake tier', () => {
    const dossier = makeGatedDossier();
    const violations = validateBoard({
      market: 'wins', selection: 'Bills Over 6.5', book: 'bookmaker', price: 130, edge_pct: 3.5, stake_tier: 'speculative',
    }, dossier);
    expect(violations.some((v) => v.startsWith('named_player_sizing_gate'))).toBe(false);
  });

  // 2026-08-13 Codex review finding #5: team_profiles is keyed by
  // normalizeTeam()'s nickname, but row team fields aren't guaranteed to
  // already be in that form. These regressions cover full-name and
  // abbreviation team fields resolving through normalizeTeam().
  it('a row with team: "Buffalo Bills" (full name, no team_nick) still triggers the Bills gate', () => {
    const dossier = makeGatedDossier();
    const row = { team: 'Buffalo Bills', consensus_line: 6.5, line_consensus_confidence: { over_n_books: 3, under_n_books: 3 } };
    const violations = namedPlayerSizingViolations(dossier, row, { stake_tier: 'core' });
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain('Connor McGovern');
  });

  it('an exacta row with team_a: "BUF" and team_b: "GB" (abbreviations) still triggers both gates', () => {
    const dossier = makeGatedDossier();
    const row = { team_a: 'BUF', team_b: 'GB', n_books: 1 };
    const violations = namedPlayerSizingViolations(dossier, row, { stake_tier: 'standard' });
    expect(violations).toHaveLength(2);
    expect(violations.some((v) => v.includes('Connor McGovern'))).toBe(true);
    expect(violations.some((v) => v.includes('Micah Parsons'))).toBe(true);
  });

  it('an exacta with one gated (abbreviation) side and one non-gated side reports only the gated side', () => {
    const dossier = makeGatedDossier();
    const row = { team_a: 'BUF', team_b: 'KC' }; // KC (Chiefs) is explicitly not gated in the fixture
    const violations = namedPlayerSizingViolations(dossier, row, { stake_tier: 'core' });
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain('Bills');
    expect(violations[0]).toContain('Connor McGovern');
  });

  it('does not double-report when raw and normalized forms resolve to the same profile key', () => {
    const dossier = makeGatedDossier();
    const row = { team: 'Bills', team_nick: 'Buffalo Bills' }; // both resolve to the same "Bills" profile
    const violations = namedPlayerSizingViolations(dossier, row, { stake_tier: 'core' });
    expect(violations).toHaveLength(1);
  });
});
