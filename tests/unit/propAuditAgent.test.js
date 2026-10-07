import { describe, expect, it } from 'vitest';
import { auditPackets, interpolateLadderProbability } from '../../scripts/props/run-prop-audit-agent.mjs';

describe('prop audit agent', () => {
  it('interpolates Bookmaker ladder probabilities around a target threshold', () => {
    const result = interpolateLadderProbability([
      { line: 62, breakEven: 0.5169, selection: 'Malik Nabers 62+' },
      { line: 72, breakEven: 0.4425, selection: 'Malik Nabers 72+' },
    ], 66);

    expect(result.method).toBe('interpolated_ladder');
    expect(result.probability).toBeCloseTo(0.4871, 4);
    expect(result.support.map((row) => row.selection)).toEqual(['Malik Nabers 62+', 'Malik Nabers 72+']);
  });

  it('returns conservative human-review candidates from price gaps, not official picks', () => {
    const packetArtifact = {
      schema: 'ai_prop_matchup_packets_v1',
      event: 'New York Giants @ Los Angeles Rams',
      packets: [
        {
          packetId: 'test-player-rec',
          event: 'New York Giants @ Los Angeles Rams',
          player: 'Test Player',
          market: 'rec',
          marketLabel: 'Receptions',
          priceMath: {
            twoWay: {
              hold: 0.05,
              sides: [
                { side: 'Over', noVigProbability: 0.48, noVigAmerican: 108 },
                { side: 'Under', noVigProbability: 0.52, noVigAmerican: -108 },
              ],
            },
          },
          currentBoard: {
            betonline: [
              {
                book: 'BEO',
                player: 'Test Player',
                market: 'rec',
                selection: 'Over 2.5 Receptions',
                side: 'Over',
                line: 2.5,
                odds: 140,
                breakEven: 0.4167,
              },
              {
                book: 'BEO',
                player: 'Test Player',
                market: 'rec',
                selection: 'Under 2.5 Receptions',
                side: 'Under',
                line: 2.5,
                odds: -170,
                breakEven: 0.6296,
              },
            ],
            bookmakerLadder: [
              { book: 'BKR', selection: 'Test Player 3+', line: 3, odds: -110, breakEven: 0.5238 },
            ],
          },
          movement: {
            bookmaker: [
              { selection: 'Test Player 3+', line: 3, beforeOdds: 100, currentOdds: -110, oddsMove: -210 },
            ],
          },
          missingFactsChecklist: ['Active/inactive status'],
        },
      ],
    };

    const report = auditPackets(packetArtifact, { top: 5 });

    expect(report.summary.auditedSides).toBe(2);
    expect(report.topCandidates[0]).toMatchObject({
      player: 'Test Player',
      side: 'Over',
      conclusion: 'candidate_for_human_review',
      guardrail: 'This is a price-audit ranking for human review, not an official pick or bet instruction.',
    });
    expect(report.topCandidates[0].score).toBeGreaterThan(0.1);
    expect(report.topCandidates[0].reasons.join(' ')).toContain('BKR movement');
  });
});
