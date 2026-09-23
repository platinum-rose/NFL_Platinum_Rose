import { describe, expect, it } from 'vitest';
import { classifyTeaser, isWongLeg, teaserLabel, dedupeKey, marketLineFor } from '../../agents/lib/pick-normalize.js';
import { gradeSpread } from '../../src/lib/picksDatabase.js';

// schedule.json `spread` = home line (real Week 3 values, 9/22).
const CAR_CLE = { home: 'CLE', visitor: 'CAR', spread: 2.5 };
const LAC_BUF = { home: 'BUF', visitor: 'LAC', spread: -7 };
const ARI_SF  = { home: 'SF',  visitor: 'ARI', spread: -8.5 };
const MIN_TB  = { home: 'TB',  visitor: 'MIN', spread: 1.5 };
const NE_JAX  = { home: 'JAX', visitor: 'NE',  spread: -3 };
const NOLINE  = { home: 'X',   visitor: 'Y',   spread: 0 };

describe('classifyTeaser — Even Money 2026 Week 3 (implied 6-pt legs)', () => {
  it('Browns +8.5 vs market +2.5 -> Wong teaser leg', () => {
    const t = classifyTeaser({ type: 'spread', line: 8.5, selection: 'Cleveland Browns' }, CAR_CLE, true);
    expect(t).toMatchObject({ points: 6, teasedLine: 8.5, originalLine: 2.5, marketLine: 2.5, wong: true, basis: 'implied' });
  });
  it('Bucs +7.5 vs market +1.5 -> Wong', () => {
    expect(classifyTeaser({ type: 'spread', line: 7.5 }, MIN_TB, true).wong).toBe(true);
  });
  it('49ers -2.5 vs market -8.5 -> Wong favourite leg', () => {
    expect(classifyTeaser({ type: 'spread', line: -2.5 }, ARI_SF, true)).toMatchObject({ originalLine: -8.5, wong: true });
  });
  it('Bills -1 vs market -7 -> teaser leg but NOT Wong (starts on the 7)', () => {
    expect(classifyTeaser({ type: 'spread', line: -1 }, LAC_BUF, true)).toMatchObject({ originalLine: -7, wong: false });
  });
});

describe('classifyTeaser — leaves real spread picks alone', () => {
  it('Patriots +3 at market +3 is a spread', () => {
    expect(classifyTeaser({ type: 'spread', line: 3 }, NE_JAX, false)).toBeNull();
  });
  it('Jaguars -2.5 vs -3 market (half-point off) is a spread', () => {
    expect(classifyTeaser({ type: 'spread', line: -2.5 }, NE_JAX, true)).toBeNull();
  });
  it('no posted line (spread 0) -> cannot infer, stays a spread', () => {
    expect(classifyTeaser({ type: 'spread', line: 8.5 }, NOLINE, true)).toBeNull();
  });
  it('totals / moneylines never become teasers by inference', () => {
    expect(classifyTeaser({ type: 'total', line: 48.5 }, CAR_CLE, true)).toBeNull();
    expect(classifyTeaser({ type: 'moneyline', line: 8.5 }, CAR_CLE, true)).toBeNull();
  });
});

describe('classifyTeaser — explicit mentions', () => {
  it('"teasing the Chiefs" quoting the pre-tease line -> teased line computed', () => {
    const t = classifyTeaser({ type: 'spread', line: -8.5, summary: 'Teasing the 49ers down' }, ARI_SF, true);
    expect(t).toMatchObject({ teasedLine: -2.5, originalLine: -8.5, wong: true, basis: 'explicit' });
  });
  it('explicit 7-point teaser quoting the teased line', () => {
    const t = classifyTeaser({ type: 'teaser', line: 9.5, summary: '7 point teaser leg' }, CAR_CLE, true);
    expect(t).toMatchObject({ points: 7, teasedLine: 9.5, originalLine: 2.5 });
  });
});

describe('isWongLeg / label', () => {
  it('boundaries', () => {
    expect([1.5, 2.5, -7.5, -8.5].every(isWongLeg)).toBe(true);
    expect([1, 3, -7, -9, 3.5, null].some(isWongLeg)).toBe(false);
  });
  it('label text', () => {
    const t = classifyTeaser({ type: 'spread', line: 8.5 }, CAR_CLE, true);
    expect(teaserLabel(t, 'CLE')).toBe('[TEASER — 6-pt Wong teaser leg: CLE +2.5 → +8.5; market +2.5; inferred from line vs market]');
  });
  it('marketLineFor flips for the visitor', () => {
    expect(marketLineFor(LAC_BUF, false)).toBe(7);
  });
});

describe('dedupeKey', () => {
  const base = { episodeId: 'ep1', host: 'Sharp or Square', gameId: '401872957', pickType: 'spread', selection: 'Jacksonville Jaguars' };
  it('same host + episode + game + type + selection collide', () => {
    expect(dedupeKey(base)).toBe(dedupeKey({ ...base, selection: 'jacksonville  jaguars ' }));
  });
  it('different host, episode, type or side do not', () => {
    expect(dedupeKey(base)).not.toBe(dedupeKey({ ...base, host: 'Chad Millman' }));
    expect(dedupeKey(base)).not.toBe(dedupeKey({ ...base, episodeId: 'ep2' }));
    expect(dedupeKey(base)).not.toBe(dedupeKey({ ...base, pickType: 'teaser' }));
    expect(dedupeKey(base)).not.toBe(dedupeKey({ ...base, selection: 'New England Patriots' }));
  });
});

describe('teaser legs grade like spreads at the teased line', () => {
  it('Browns +8.5 (home) lose by 7 -> WIN; lose by 9 -> LOSS', () => {
    const pick = { pickType: 'teaser', isHomeTeam: true, line: 8.5 };
    expect(gradeSpread(pick, 20, 27)).toBe('WIN');
    expect(gradeSpread(pick, 20, 29)).toBe('LOSS');
  });
});
