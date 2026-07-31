import { describe, expect, it } from 'vitest';
import {
  extractYouTubePlaylistId,
  extractYouTubeVideoId,
  roundRobinBuckets,
  scoreFuturesIntel,
} from '../../scripts/youtube-podcast-sweep.js';

describe('youtube podcast sweep discovery helpers', () => {
  it('extracts video and playlist ids from watch URLs', () => {
    const topQbs = 'https://www.youtube.com/watch?v=qoCm4G2Jmng&list=PLMKiHjDBsM5GEP600xtbnKz6Lyo66U2BB&index=2';
    const nfcSouth = 'https://www.youtube.com/watch?v=OAxHvrVUPpw&list=PLMKiHjDBsM5GEP600xtbnKz6Lyo66U2BB&index=1';

    expect(extractYouTubeVideoId(topQbs)).toBe('qoCm4G2Jmng');
    expect(extractYouTubeVideoId(nfcSouth)).toBe('OAxHvrVUPpw');
    expect(extractYouTubePlaylistId(topQbs)).toBe('PLMKiHjDBsM5GEP600xtbnKz6Lyo66U2BB');
  });

  it('scores the missed Sharp or Square titles as futures intel', () => {
    const topQbs = scoreFuturesIntel("TOP 10 QUARTERBACKS: NFL Betting Experts' Rankings & Analysis of Greatest QBs For 2026 NFL Season");
    const nfcSouth = scoreFuturesIntel('NFC SOUTH BETTING PREVIEW: Gambling Expert Picks, Predictions & Strategies for 2026 NFL Season');

    expect(topQbs.gemini_futures_eligible).toBe(true);
    expect(topQbs.lane).toBe('futures_intel');
    expect(nfcSouth.gemini_futures_eligible).toBe(true);
    expect(nfcSouth.lane).toBe('futures_intel');
  });

  it('round-robins candidates so later channels are not starved by earlier channels', () => {
    const selected = roundRobinBuckets([
      ['action-1', 'action-2', 'action-3'],
      ['warren-1'],
      ['sharp-square-1', 'sharp-square-2'],
    ], 4);

    expect(selected).toEqual(['action-1', 'warren-1', 'sharp-square-1', 'action-2']);
  });
});
