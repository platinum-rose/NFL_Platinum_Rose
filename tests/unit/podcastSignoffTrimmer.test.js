// tests/unit/podcastSignoffTrimmer.test.js
import { describe, it, expect } from 'vitest';
import {
  trimPodcastCommercials,
  trimPodcastText,
  SHOW_SIGNOFF_RULES,
} from '../../agents/lib/gemini-master-extractor.js';

describe('Podcast Sign-Off Trimmer (Even Money & Outro Cleanup)', () => {
  it('identifies Even Money sign-off pattern', () => {
    const rule = SHOW_SIGNOFF_RULES.find(r => r.name === 'Even Money');
    expect(rule).toBeDefined();

    const sample1 = 'Good luck everybody. Hope you guys win some money.';
    const sample2 = 'Good luck, everybody. Hope you guys win some money this weekend.';
    const sample3 = 'Other than that, good luck everybody. Enjoy the game.';
    const sample4 = 'Thanks for tuning in to the Even Money Podcast.';

    expect(rule.signoffRegex.test(sample1)).toBe(true);
    expect(rule.signoffRegex.test(sample2)).toBe(true);
    expect(rule.signoffRegex.test(sample3)).toBe(true);
    expect(rule.signoffRegex.test(sample4)).toBe(true);
  });

  it('trims post-roll commercial segments following Ross Tucker sign-off', () => {
    const segments = [
      { speaker: 'A', text: 'Broncos are getting 3. I take Denver.', start: 10, end: 15 },
      {
        speaker: 'A',
        text: 'Patreon.com RT Media be a member. Good luck everybody. Hope you guys win some money.',
        start: 16,
        end: 22,
      },
      { speaker: 'B', text: 'Now you can watch ESPN college game day on Disney Plus.', start: 23, end: 35 },
      { speaker: 'C', text: 'This episode is brought to you by ChatGPT.', start: 36, end: 50 },
    ];

    const trimmed = trimPodcastCommercials('Even Money — 2026 NFL Week 1 Bets', 'Even Money', segments);

    expect(trimmed.length).toBe(2);
    expect(trimmed[0].text).toContain('Broncos are getting 3');
    expect(trimmed[1].text).toBe('Patreon.com RT Media be a member. Good luck everybody. Hope you guys win some money.');
    expect(trimmed.some(s => s.text.includes('Disney Plus'))).toBe(false);
    expect(trimmed.some(s => s.text.includes('ChatGPT'))).toBe(false);
  });

  it('trims post-roll commercial segments when sign-off is split across adjacent speaker segments', () => {
    const splitSegments = [
      { speaker: 'A', text: 'Broncos are getting 3. Good luck everybody.', start: 10, end: 15 },
      {
        speaker: 'B',
        text: 'Hope you guys win some money. Sign up for DraftKings Sportsbook now!',
        start: 16,
        end: 25,
      },
      { speaker: 'C', text: 'Use promo code ROSS for 100% deposit match.', start: 26, end: 40 },
    ];

    const trimmed = trimPodcastCommercials('Even Money — 2026 NFL Week 1 Bets', 'Even Money', splitSegments);

    expect(trimmed.length).toBe(2);
    expect(trimmed[0].text).toBe('Broncos are getting 3. Good luck everybody.');
    expect(trimmed[1].text).toBe('Hope you guys win some money.');
    expect(trimmed.some(s => s.text.includes('DraftKings'))).toBe(false);
    expect(trimmed.some(s => s.text.includes('promo code'))).toBe(false);
  });

  it('trims raw text after sign-off', () => {
    const raw = 'We love the Chiefs spread. Good luck everybody. Hope you guys win some money. Sign up for DraftKings sportsbook now!';
    const trimmed = trimPodcastText('Even Money Podcast', 'Even Money', raw);

    expect(trimmed).toBe('We love the Chiefs spread. Good luck everybody. Hope you guys win some money.');
    expect(trimmed).not.toContain('DraftKings sportsbook now');
  });

  it('leaves non-Even Money shows intact', () => {
    const segments = [
      { speaker: 'A', text: 'Good luck everybody in your survivor pools!', start: 0, end: 10 },
      { speaker: 'B', text: 'Check back next week.', start: 11, end: 15 },
    ];

    const result = trimPodcastCommercials('BettingPros Podcast Ep. 1051', 'BettingPros', segments);
    expect(result.length).toBe(2);
  });
});
