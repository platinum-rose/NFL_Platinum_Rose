import { describe, expect, it } from 'vitest';
import { isNflRelevantEpisode } from '../../agents/lib/nfl-relevance.js';

describe('isNflRelevantEpisode', () => {
  it('keeps explicit NFL and NFL-adjacent fantasy titles', () => {
    expect(isNflRelevantEpisode('2026 NFL Quarterback Rankings | Part 1')).toBe(true);
    expect(isNflRelevantEpisode('Fantasy Football Deep Dive with Sean Koerner | Part 2')).toBe(true);
    expect(isNflRelevantEpisode('NFL TRAINING CAMP QUESTIONS with Ben Solak of ESPN')).toBe(true);
  });

  it('skips non-NFL titles surfaced by podcast ingest dry runs', () => {
    expect(isNflRelevantEpisode('3M Open Betting Preview | 2026')).toBe(false);
    expect(isNflRelevantEpisode('10 College Football Storylines Every Bettor Needs to Know Before Week 1')).toBe(false);
    expect(isNflRelevantEpisode('Underrated Gambling Movies with Michael Lasker')).toBe(false);
    expect(isNflRelevantEpisode('Gambling Stories & the Future of Hollywood with Screenwriter Allan')).toBe(false);
  });
});
