import { describe, expect, it } from 'vitest';
import { buildPropStackReport } from '../../scripts/props/run-prop-stack-agent.mjs';

describe('prop stack agent', () => {
  it('deduplicates ATD market shapes and builds compact thesis stacks', () => {
    const packetArtifact = {
      schema: 'ai_prop_matchup_packets_v1',
      event: 'New York Giants @ Los Angeles Rams',
      packets: [
        {
          packetId: 'kyren-williams-atd',
          player: 'Kyren Williams',
          team: 'LAR',
          market: 'atd',
          marketLabel: 'Anytime touchdown scorer',
          currentBoard: {
            betonline: [
              { player: 'Kyren Williams', market: 'atd', selection: 'Yes', side: 'Yes', odds: -165, breakEven: 0.6226 },
              { player: 'Kyren Williams', market: 'atd', selection: 'No', side: 'No', odds: 135, breakEven: 0.4255 },
            ],
          },
        },
        {
          packetId: 'kyren-williams-rush_yds',
          player: 'Kyren Williams',
          team: 'LAR',
          market: 'rush_yds',
          marketLabel: 'Rushing yards',
          currentBoard: {
            betonline: [
              { player: 'Kyren Williams', market: 'rush_yds', selection: 'Over 63.5 Rushing Yards', side: 'Over', odds: -115, breakEven: 0.5349 },
            ],
          },
        },
        {
          packetId: 'puka-nacua-rec',
          player: 'Puka Nacua',
          team: 'LAR',
          market: 'rec',
          marketLabel: 'Receptions',
          currentBoard: {
            betonline: [
              { player: 'Puka Nacua', market: 'rec', selection: 'Over 5.5 Receptions', side: 'Over', odds: 120, breakEven: 0.4545 },
            ],
          },
        },
      ],
    };
    const auditReport = {
      schema: 'prop_audit_agent_report_v1',
      event: 'New York Giants @ Los Angeles Rams',
      summary: { auditedSides: 3 },
      allAudits: [
        {
          player: 'Kyren Williams',
          market: 'atd',
          marketLabel: 'Anytime touchdown scorer',
          side: 'Yes',
          selection: 'Yes',
          offeredOdds: -165,
          offeredBreakEven: 0.6226,
          score: 0.046,
          conclusion: 'candidate_for_human_review',
          reasons: ['single canonical ATD row'],
        },
        {
          player: 'Kyren Williams',
          market: 'rush_yds',
          marketLabel: 'Rushing yards',
          side: 'Over',
          selection: 'Over 63.5 Rushing Yards',
          offeredOdds: -115,
          offeredBreakEven: 0.5349,
          score: 0.01,
          conclusion: 'pass',
          reasons: [],
        },
        {
          player: 'Puka Nacua',
          market: 'rec',
          marketLabel: 'Receptions',
          side: 'Over',
          selection: 'Over 5.5 Receptions',
          offeredOdds: 120,
          offeredBreakEven: 0.4545,
          score: 0.022,
          conclusion: 'price_watch',
          reasons: [],
        },
      ],
    };

    const report = buildPropStackReport(packetArtifact, auditReport);
    const scoringStack = report.stacks.find((stack) => stack.type === 'scoring_role');

    expect(scoringStack).toBeTruthy();
    expect(scoringStack.legs.map((leg) => `${leg.player}|${leg.market}`)).toEqual([
      'Kyren Williams|atd',
      'Kyren Williams|rush_yds',
      'Puka Nacua|rec',
    ]);
    expect(new Set(scoringStack.legs.map((leg) => `${leg.player}|${leg.market}`)).size).toBe(scoringStack.legs.length);
    expect(report.methodology.join(' ')).toContain('ATD and Anytime Touchdown Scorer cannot appear as separate stack legs');
  });
});
