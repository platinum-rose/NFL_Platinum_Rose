import { describe, expect, it } from 'vitest';
import { formatExpertSelection } from '../../agents/lib/expert-pick-selection.js';

describe('formatExpertSelection', () => {
  it('keeps player and market on over/under props', () => {
    expect(formatExpertSelection({ type: 'player_prop', player: 'Bijan Robinson', selection: 'OVER', market: 'rushing and receiving yards' }))
      .toBe('Bijan Robinson OVER rushing and receiving yards');
  });

  it('does not repeat a market the selection already names', () => {
    expect(formatExpertSelection({ type: 'player_prop', player: 'Terry McLaurin', selection: 'Anytime TD', market: 'anytime TD' }))
      .toBe('Terry McLaurin Anytime TD');
  });

  it('falls back to the raw selection when no player is given', () => {
    expect(formatExpertSelection({ type: 'player_prop', selection: 'OVER' })).toBe('OVER');
  });

  it('leaves side/total picks unchanged', () => {
    expect(formatExpertSelection({ type: 'spread', selection: 'Chicago Bears' })).toBe('Chicago Bears');
    expect(formatExpertSelection({ type: 'total', selection: 'UNDER' })).toBe('UNDER');
  });

  it('labels futures with their market', () => {
    expect(formatExpertSelection({ type: 'futures', selection: 'Mike LaFleur', market: 'Coach of the Year' }))
      .toBe('Mike LaFleur (Coach of the Year)');
  });
});
