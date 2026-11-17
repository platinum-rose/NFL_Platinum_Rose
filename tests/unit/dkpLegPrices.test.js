import { describe, expect, it } from 'vitest';
import { matchLeg, priceDkpTicket } from '../../scripts/props/dkp-leg-prices.mjs';

const rows = [
  { market: 'rec', kind: 'milestone', player: 'Tyler Warren', side: '5+', lineEquiv: 4.5, american: 150, game: 'IND@HOU' },
  { market: 'rec', kind: 'ou', player: 'Tyler Warren', side: 'Over', line: 4.5, american: -120, game: 'IND@HOU' },
  { market: 'rush_yds', kind: 'ou', player: 'Jonathan Taylor', side: 'Under', line: 80.5, american: -110, game: 'IND@HOU' },
  { market: 'atd_1_plus', kind: 'main', player: 'Jonathan Taylor', side: 'Yes', label: 'Jonathan Taylor', american: 105, game: 'IND@HOU' },
  { market: 'sacks', kind: 'main', player: 'Will Anderson Jr.', side: 'Yes', label: '0.5+', american: 140, game: 'IND@HOU' },
  { market: 'other', marketType: 'Field Goals Made Milestones', kind: 'milestone', player: "Ka'imi Fairbairn", side: '2+', lineEquiv: 1.5, american: 130, game: 'IND@HOU' },
  { market: 'spread', kind: 'ou', label: 'HOU Texans', side: 'Home', line: -3.5, american: -105, game: 'IND@HOU' },
];
const leg = (o) => ({ game: 'IND @ HOU', direction: 'over', ...o });

describe('DKP feed price at logging (Andy 2026-11-17)', () => {
  it('matches milestones before O/U and respects Unders', () => {
    expect(matchLeg(leg({ market: 'receptions', player: 'Tyler Warren', line: 4.5 }), rows).american).toBe(150);
    expect(matchLeg(leg({ market: 'rushing_yards', player: 'Jonathan Taylor', line: 80.5, direction: 'under' }), rows).american).toBe(-110);
  });
  it('matches yes markets, sacks, legacy FG rows and spreads', () => {
    expect(matchLeg(leg({ market: 'anytime_td', player: 'Jonathan Taylor', line: 0.5 }), rows).american).toBe(105);
    expect(matchLeg(leg({ market: 'sacks', player: 'Will Anderson', line: 0.5 }), rows).american).toBe(140);
    expect(matchLeg(leg({ market: 'field_goals_made', player: "Ka'imi Fairbairn", line: 1.5 }), rows).american).toBe(130);
    expect(matchLeg(leg({ market: 'spread', team: 'HOU', line: -3.5, direction: 'cover' }), rows).american).toBe(-105);
  });
  it('never overwrites a price and lists unmatched legs', () => {
    const t = { week: 11, legs: [leg({ market: 'receptions', player: 'Tyler Warren', line: 4.5, price: 200 }), leg({ market: 'pass_interceptions', player: 'C.J. Stroud', line: 0.5 })] };
    const r = priceDkpTicket(t, [{ file: 'f.json', capturedAt: '2026-11-19T20:00:00Z', rows }]);
    expect(t.legs[0].price).toBe(200);
    expect(r.missing).toHaveLength(1);
  });
});
