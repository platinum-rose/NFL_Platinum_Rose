import { describe, expect, it } from 'vitest';
import { devigPair, fitWinDist, probAtLeast, probOverLine, tailTable } from '../../agents/lib/win-dist.js';

describe('win-dist', () => {
  it('power-devigs a standard two-sided line to fair probabilities', () => {
    const d = devigPair(-110, -110);
    expect(d.method).toBe('power');
    expect(d.pOver + d.pUnder).toBeCloseTo(1, 3);
    expect(d.pOver).toBeCloseTo(0.5, 3);
  });

  it('fits mu and sigma from multiple distinct lines', () => {
    const dist = fitWinDist([
      { line: 7.5, q: 0.72, w: 1 },
      { line: 8.5, q: 0.59, w: 1 },
      { line: 9.5, q: 0.45, w: 1 },
    ]);
    expect(dist.fit_quality).toBe('ok');
    expect(dist.sigma_source).toBe('fit');
    expect(dist.mu).toBeGreaterThan(8);
    expect(dist.mu).toBeLessThan(10);
    expect(dist.sigma).toBeGreaterThan(1.8);
    expect(dist.sigma).toBeLessThan(3.6);
  });

  it('uses sigma prior for one-line teams', () => {
    const dist = fitWinDist([{ line: 9.5, q: 0.5, w: 1 }]);
    expect(dist.sigma_source).toBe('prior');
    expect(dist.sigma).toBeCloseTo(2.7, 3);
    expect(dist.mu).toBeCloseTo(9.5, 2);
  });

  it('produces monotonic tails', () => {
    const dist = { mu: 9, sigma: 2.7 };
    const tails = tailTable(dist, { min: 6, max: 11 });
    expect(tails['6']).toBeGreaterThan(tails['7']);
    expect(tails['10']).toBeGreaterThan(tails['11']);
    expect(probAtLeast(dist, 9)).toBeGreaterThan(probAtLeast(dist, 11));
    expect(probOverLine(dist, 8.5)).toBeCloseTo(probAtLeast(dist, 9), 4);
  });
});
