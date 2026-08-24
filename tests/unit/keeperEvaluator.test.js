// tests/unit/keeperEvaluator.test.js
import { describe, it, expect } from 'vitest';
import { evaluateRosterKeepers, reconcileRosterWithDraftBoard } from '../../src/lib/keeperEvaluator';
// Note: generateDraftStrategyInsights (same module) has no test coverage here —
// flagged 2026-08-22 lint cleanup, not added in this pass (would need its own
// scoped test cases, out of scope for a lint fix).

describe('keeperEvaluator - 9 Official Keeper Rules', () => {
  const sampleMarket = [
    { player: "Ja'Marr Chase", position: 'WR', adp: 2, proj_points: 300 }, // Round 1
    { player: 'Nico Collins', position: 'WR', adp: 8, proj_points: 250 }, // Round 1
    { player: 'Trey McBride', position: 'TE', adp: 22, proj_points: 200 }, // Round 2
    { player: 'Joe Burrow', position: 'QB', adp: 32, proj_points: 280 }, // Round 3
    { player: 'Kyle Monangai', position: 'RB', adp: 110, proj_points: 150 }, // Round 10
    { player: 'Rachaad White', position: 'RB', adp: 160, proj_points: 120 }, // Late Round 14+
  ];

  it('Rule 1: Disallows Round 1 and Round 2 drafted keepers', () => {
    const roster = [
      { player: "Ja'Marr Chase", position: 'WR', lastSeasonRound: 1, acquisitionType: 'Drafted (Round 1)', draftTeam: 'Team A' },
    ];
    const evaluated = evaluateRosterKeepers(roster, sampleMarket, 12);
    expect(evaluated[0].isEligible).toBe(false);
    expect(evaluated[0].ineligibilityReason).toContain('Rule 1');
  });

  it('Rule 2 & Rule 6: Applies -2 discount and Late Round 14+ floor cap', () => {
    const roster = [
      { player: 'Nico Collins', position: 'WR', lastSeasonRound: 7, acquisitionType: 'Drafted (Round 7)', draftTeam: 'Team A' },
      { player: 'Rachaad White', position: 'RB', lastSeasonRound: 15, acquisitionType: 'Drafted (Round 15)', draftTeam: 'Team A' },
    ];
    const evaluated = evaluateRosterKeepers(roster, sampleMarket, 12);

    // Nico Collins: Rd 7 -> Rd 5 (-2 rule)
    const nico = evaluated.find(p => p.player === 'Nico Collins');
    expect(nico.thisSeasonKeeperCost).toBe(5);
    expect(nico.isEligible).toBe(true);

    // Rachaad White: Rd 15 -> Rd 14 floor cap (Rule 6)
    const rachaad = evaluated.find(p => p.player === 'Rachaad White');
    expect(rachaad.thisSeasonKeeperCost).toBe(14);
    expect(rachaad.isEligible).toBe(true);
  });

  it('Rule 5 Addendum: Resets dropped player to Round 10 FA cost (Joe Burrow Rule)', () => {
    const draftBoard = [
      { player: 'Joe Burrow', position: 'QB', keeperCostRound: 3, draftTeam: 'Team Original' },
    ];
    const finalRoster = [
      { player: 'Joe Burrow', position: 'QB', draftTeam: 'Fat Lazy Americans' },
    ];
    const reconciled = reconcileRosterWithDraftBoard(finalRoster, draftBoard);
    const evaluated = evaluateRosterKeepers(reconciled, sampleMarket, 12);

    const burrow = evaluated.find(p => p.player === 'Joe Burrow');
    expect(burrow.isEligible).toBe(true);
    expect(burrow.thisSeasonKeeperCost).toBe(10); // Resets to Round 10!
    expect(burrow.surplusRounds).toBe(7); // Cost 10 vs expected Rd 3 = +7 Rounds Surplus (S-Tier Lock!)
    expect(burrow.keeperTier).toBe('S-Tier');
  });

  it('Rule 9: Resolves same-round keeper collisions per team', () => {
    const roster = [
      { player: 'Nico Collins', position: 'WR', lastSeasonRound: 7, status: 'keeper', draftTeam: 'Team A' }, // Cost 5
      { player: 'Trey McBride', position: 'TE', lastSeasonRound: 7, status: 'keeper', draftTeam: 'Team A' }, // Cost 5 -> Bumps to 4
    ];
    const evaluated = evaluateRosterKeepers(roster, sampleMarket, 12);
    const costs = evaluated.map(p => p.thisSeasonKeeperCost);
    expect(costs).toContain(5);
    expect(costs).toContain(4);
  });
});
