import { describe, expect, it } from 'vitest';
import {
  americanToImpliedProbability,
  buildAiMatchupPackets,
  noVigTwoWay,
  probabilityToAmerican,
} from '../../scripts/props/build-ai-matchup-packets.mjs';

describe('ai matchup packet builder', () => {
  it('converts American odds to break-even probability', () => {
    expect(americanToImpliedProbability(-113)).toBeCloseTo(0.5305, 4);
    expect(americanToImpliedProbability(120)).toBeCloseTo(0.4545, 4);
    expect(probabilityToAmerican(0.5305)).toBe(-113);
  });

  it('computes two-way no-vig probabilities', () => {
    const result = noVigTwoWay(
      { side: 'Over', odds: -115 },
      { side: 'Under', odds: -115 },
    );

    expect(result.hold).toBeCloseTo(0.0698, 4);
    expect(result.sides[0]).toMatchObject({
      side: 'Over',
      breakEven: 0.5349,
      noVigProbability: 0.5,
      noVigAmerican: 100,
    });
    expect(result.sides[1].noVigProbability).toBe(0.5);
  });

  it('builds packets with BEO price math, BKR ladder context, movement, and review contract', () => {
    const betonline = {
      events: [{ game: 'New York Giants @ Los Angeles Rams' }],
      rows: [
        {
          book: 'BEO',
          player: 'Malik Nabers',
          team: 'NYG',
          market: 'rec_yds',
          marketTitle: 'Malik Nabers NYG Receiving Yards',
          selection: 'Over 65.5 Receiving Yards',
          side: 'Over',
          line: 65.5,
          odds: 105,
        },
        {
          book: 'BEO',
          player: 'Malik Nabers',
          team: 'NYG',
          market: 'rec_yds',
          marketTitle: 'Malik Nabers NYG Receiving Yards',
          selection: 'Under 65.5 Receiving Yards',
          side: 'Under',
          line: 65.5,
          odds: -135,
        },
      ],
    };
    const bookmaker = {
      event: 'New York Giants @ Los Angeles Rams',
      rows: [
        {
          book: 'BKR',
          player: 'Malik Nabers',
          market: 'rec_yds',
          sectionTitle: 'Giants vs Rams: Malik Nabers Receiving Yards',
          selection: 'Malik Nabers 62+',
          line: 62,
          odds: -107,
        },
        {
          book: 'BKR',
          player: 'Malik Nabers',
          market: 'rec_yds',
          sectionTitle: 'Giants vs Rams: Malik Nabers Receiving Yards',
          selection: 'Malik Nabers 72+',
          line: 72,
          odds: 126,
        },
      ],
    };
    const bookmakerBaseline = {
      rows: [
        {
          book: 'BKR',
          player: 'Malik Nabers',
          market: 'rec_yds',
          sectionTitle: 'Malik Nabers Receiving Yards',
          selection: 'Malik Nabers 72+',
          line: 72,
          odds: 140,
        },
      ],
    };

    const result = buildAiMatchupPackets({ betonline, bookmaker, bookmakerBaseline });
    expect(result.summary).toMatchObject({ packets: 1, players: 1, markets: 1 });

    const packet = result.packets[0];
    expect(packet.packetId).toBe('malik-nabers-rec_yds');
    expect(packet.priceMath.twoWay.hold).toBeGreaterThan(0);
    expect(packet.currentBoard.bookmakerNearest.map((row) => row.selection)).toEqual([
      'Malik Nabers 62+',
      'Malik Nabers 72+',
    ]);
    expect(packet.movement.bookmaker).toContainEqual(expect.objectContaining({
      selection: 'Malik Nabers 72+',
      beforeOdds: 140,
      currentOdds: 126,
      oddsMove: -14,
    }));
    expect(packet.missingFactsChecklist).toContain('Active/inactive status');
    expect(packet.aiReviewContract.allowedConclusions).toContain('needs_more_info');
    expect(packet.aiReviewContract.prompt).toContain('Do not recommend a bet');
  });

  it('attaches Bookmaker touchdown-list rows when the player is stored in selection', () => {
    const betonline = {
      events: [{ game: 'New York Giants @ Los Angeles Rams' }],
      rows: [
        {
          book: 'BEO',
          player: 'Davante Adams',
          team: 'LAR',
          market: 'atd',
          marketTitle: 'Davante Adams LAR Score a Touchdown',
          selection: 'Yes',
          side: 'Yes',
          line: null,
          odds: -130,
        },
        {
          book: 'BEO',
          player: 'Davante Adams',
          team: 'LAR',
          market: 'atd',
          marketTitle: 'Davante Adams LAR Score a Touchdown',
          selection: 'No',
          side: 'No',
          line: null,
          odds: 100,
        },
      ],
    };
    const bookmaker = {
      event: 'New York Giants @ Los Angeles Rams',
      rows: [
        {
          book: 'BKR',
          player: 'Player To Score 1+ Touchdown',
          market: 'atd_1_plus',
          sectionTitle: 'Giants vs Rams: Player To Score 1+ Touchdown',
          selection: 'Davante Adams',
          line: null,
          odds: -119,
        },
      ],
    };

    const result = buildAiMatchupPackets({ betonline, bookmaker });
    const packet = result.packets[0];

    expect(packet.packetId).toBe('davante-adams-atd');
    expect(packet.currentBoard.bookmakerNearest).toContainEqual(expect.objectContaining({
      book: 'BKR',
      player: 'Davante Adams',
      market: 'atd',
      sourceMarket: 'atd_1_plus',
      selection: 'Davante Adams',
      odds: -119,
    }));
  });

  it('canonicalizes duplicate anytime touchdown list and yes/no rows into one packet', () => {
    const betonline = {
      events: [{ game: 'New York Giants @ Los Angeles Rams' }],
      rows: [
        {
          book: 'BEO',
          player: 'Kyren Williams',
          team: 'LAR',
          market: 'atd_1_plus',
          marketTitle: 'Anytime Touchdown Scorer',
          selection: 'Anytime Touchdown Scorer',
          side: 'Yes',
          line: null,
          odds: -165,
        },
        {
          book: 'BEO',
          player: 'Kyren Williams',
          team: 'LAR',
          market: 'atd',
          marketTitle: 'Kyren Williams LAR Score a Touchdown',
          selection: 'Yes',
          side: 'Yes',
          line: null,
          odds: -165,
        },
        {
          book: 'BEO',
          player: 'Kyren Williams',
          team: 'LAR',
          market: 'atd',
          marketTitle: 'Kyren Williams LAR Score a Touchdown',
          selection: 'No',
          side: 'No',
          line: null,
          odds: 135,
        },
      ],
    };
    const bookmaker = {
      event: 'New York Giants @ Los Angeles Rams',
      rows: [
        {
          book: 'BKR',
          player: 'Player To Score 1+ Touchdown',
          market: 'atd_1_plus',
          sectionTitle: 'Giants vs Rams: Player To Score 1+ Touchdown',
          selection: 'Kyren Williams',
          line: null,
          odds: -130,
        },
      ],
    };

    const result = buildAiMatchupPackets({ betonline, bookmaker });

    expect(result.summary).toMatchObject({ packets: 1, players: 1, markets: 1 });
    expect(result.packets[0]).toMatchObject({
      packetId: 'kyren-williams-atd',
      market: 'atd',
      marketLabel: 'Anytime touchdown scorer',
    });
    expect(result.packets[0].currentBoard.betonline.map((row) => row.selection)).toEqual(['Yes', 'No']);
    expect(result.packets[0].priceMath.twoWay.sides.map((side) => side.side)).toEqual(['Yes', 'No']);
  });
});
