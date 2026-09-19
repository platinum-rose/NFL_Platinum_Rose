import { describe, expect, it } from 'vitest';
import { extractAuthorThread, mergeThread, tweetTextFromResult } from '../../agents/lib/tweet-thread.js';

const tw = (id, user, text, replyTo = null, extra = {}) => ({
  __typename: 'Tweet',
  rest_id: id,
  legacy: { id_str: id, user_id_str: user, full_text: text, in_reply_to_status_id_str: replyTo, ...extra },
});

function detail(tweets) {
  return {
    data: {
      threaded_conversation_with_injections_v2: {
        instructions: [{
          type: 'TimelineAddEntries',
          entries: [
            { content: { itemContent: { tweet_results: { result: tweets[0] } } } },
            { content: { items: tweets.slice(1).map((t) => ({ item: { itemContent: { tweet_results: { result: t } } } })) } },
          ],
        }],
      },
    },
  };
}

describe('tweet thread extraction', () => {
  it('prefers long-form note_tweet text over the truncated legacy text', () => {
    const r = tw('1', 'a', 'truncated…');
    r.note_tweet = { note_tweet_results: { result: { text: 'full long post text' } } };
    expect(tweetTextFromResult(r)).toBe('full long post text');
    expect(tweetTextFromResult({ __typename: 'TweetWithVisibilityResults', tweet: r })).toBe('full long post text');
  });

  it("keeps only the author's own reply chain", () => {
    const json = detail([
      tw('1', 'author', 'NFL ATS picks for EVERY Week 2 game ⤵️'),
      tw('2', 'author', 'CHI -4.5', '1', { extended_entities: { media: [{ media_url_https: 'https://img/2.jpg' }] } }),
      tw('9', 'someone', 'fade', '1'),
      tw('3', 'author', 'TB -8.5', '2'),
      tw('4', 'author', 'reply to a fan', '9'),
    ]);
    const thread = extractAuthorThread(json, '1');
    expect(thread.map((t) => t.id)).toEqual(['1', '2', '3']);
    const merged = mergeThread(thread);
    expect(merged.text).toContain('[2/3] CHI -4.5');
    expect(merged.media_urls).toEqual(['https://img/2.jpg']);
  });

  it('returns an empty thread when the focal tweet is missing', () => {
    expect(extractAuthorThread({}, '1')).toEqual([]);
  });

  it('leaves a single tweet unchanged', () => {
    expect(mergeThread([{ id: '1', text: 'solo', media_urls: [] }]).text).toBe('solo');
  });
});

describe('videos and thread cues', () => {
  it('splits photos from videos and keeps the best mp4', async () => {
    const { mediaUrlsFromResult, videosFromResult, looksLikeThreadStarter } = await import('../../agents/lib/tweet-thread.js');
    const r = tw('5', 'a', 'clip', null, {
      extended_entities: {
        media: [
          { type: 'photo', media_url_https: 'https://img/p.jpg' },
          {
            type: 'video',
            media_url_https: 'https://img/poster.jpg',
            video_info: {
              duration_millis: 61000,
              variants: [
                { content_type: 'application/x-mpegURL', url: 'https://v/x.m3u8' },
                { content_type: 'video/mp4', bitrate: 832000, url: 'https://v/low.mp4' },
                { content_type: 'video/mp4', bitrate: 2176000, url: 'https://v/high.mp4' },
              ],
            },
          },
        ],
      },
    });
    expect(mediaUrlsFromResult(r)).toEqual(['https://img/p.jpg']);
    expect(videosFromResult(r)).toEqual([
      { tweet_id: '5', type: 'video', url: 'https://v/high.mp4', poster: 'https://img/poster.jpg', duration_ms: 61000 },
    ]);
    expect(looksLikeThreadStarter('🧵 Circa Survivor Week 2 Strategy')).toBe(true);
    expect(looksLikeThreadStarter('Lions starting OL for TNF')).toBe(false);
  });
});

describe('relevance gate second tier', () => {
  it('accepts NFL betting posts that name no team', async () => {
    const { isNflBettingIntel } = await import('../../agents/lib/sportsRelevanceFilter.js');
    expect(isNflBettingIntel('Here are my ten favorite plus money props for Week 2').isRelevant).toBe(true);
    expect(isNflBettingIntel('🧵 Circa Survivor Week 2 Strategy & Picks').isRelevant).toBe(true);
    expect(isNflBettingIntel("Here's my moneyline pick for every Red Zone game").isRelevant).toBe(true);
    expect(isNflBettingIntel('College football Week 2 picks').isRelevant).toBe(false);
    expect(isNflBettingIntel('Great recipe for week 2 of meal prep').isRelevant).toBe(false);
  });
});
