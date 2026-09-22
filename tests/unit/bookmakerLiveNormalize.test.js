import { describe, expect, it } from 'vitest';
import { normalizeBookmakerLiveCapture, stripGamePrefix } from '../../scripts/props/bookmaker-live-normalize.mjs';

describe('bookmaker-live-normalize', () => {
  it('strips a leading "<Team> vs <Team>:" game prefix from section titles', () => {
    expect(stripGamePrefix('Giants vs Rams: Player To Score 1st Touchdown')).toBe('Player To Score 1st Touchdown');
    expect(stripGamePrefix('Giants vs Rams : Most Rushing Yds')).toBe('Most Rushing Yds');
    expect(stripGamePrefix('Jaxson Dart Carries')).toBe('Jaxson Dart Carries');
  });

  it('fixes the TD-scorer player field regression (player set to section title, real name in selection)', () => {
    const payload = {
      rows: [
        {
          book: 'BKR',
          market: 'first_td',
          player: 'Player To Score 1st Touchdown',
          sectionTitle: 'Giants vs Rams: Player To Score 1st Touchdown',
          selection: 'Chris Manhertz',
          odds: 3231,
        },
        {
          book: 'BKR',
          market: 'atd_1_plus',
          player: 'Anytime Touchdown Scorer',
          sectionTitle: 'Giants vs Rams: Anytime Touchdown Scorer',
          selection: 'Kyren Williams',
          odds: -165,
        },
      ],
      summary: {},
    };

    const result = normalizeBookmakerLiveCapture(payload);

    expect(result.rows[0].player).toBe('Chris Manhertz');
    expect(result.rows[1].player).toBe('Kyren Williams');
    expect(result.normalization.tdScorerPlayerFieldFixed).toBe(2);
  });

  it('does not touch a TD-scorer row whose player field is already correct', () => {
    const payload = {
      rows: [
        {
          market: 'first_td',
          player: 'Chris Manhertz',
          sectionTitle: 'Giants vs Rams: Player To Score 1st Touchdown',
          selection: 'Chris Manhertz',
          odds: 3231,
        },
      ],
      summary: {},
    };

    const result = normalizeBookmakerLiveCapture(payload);
    expect(result.rows[0].player).toBe('Chris Manhertz');
    expect(result.normalization.tdScorerPlayerFieldFixed).toBe(0);
  });

  it('reclassifies carries rows misclassified as unknown due to the game-prefixed section title', () => {
    const payload = {
      rows: [
        {
          market: 'unknown',
          player: 'Jaxson Dart Carries',
          sectionTitle: 'Giants vs Rams: Jaxson Dart Carries',
          selection: 'Jaxson Dart 5+',
          line: 5,
          odds: -366,
        },
        {
          market: 'unknown',
          player: 'Alternative Lines',
          sectionTitle: 'Giants vs Rams: Alternative Lines',
          selection: 'New York Giants',
          odds: -451,
        },
      ],
      summary: {},
    };

    const result = normalizeBookmakerLiveCapture(payload);

    expect(result.rows[0]).toMatchObject({ market: 'carries', player: 'Jaxson Dart' });
    expect(result.rows[1].market).toBe('unknown');
    expect(result.normalization.carriesReclassified).toBe(1);
  });

  it('recomputes market counts in the summary after normalization', () => {
    const payload = {
      rows: [
        {
          market: 'unknown',
          player: 'Kyren Williams Carries',
          sectionTitle: 'Giants vs Rams: Kyren Williams Carries',
          selection: 'Kyren Williams 8+',
          line: 8,
          odds: -200,
        },
      ],
      summary: { markets: { unknown: 1 } },
    };

    const result = normalizeBookmakerLiveCapture(payload);
    expect(result.summary.markets).toEqual({ carries: 1 });
  });
});
