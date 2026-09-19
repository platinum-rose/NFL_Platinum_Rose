// Regression 2026-09-19: feed-by-feed processing let the first feeds burn MAX_PER_RUN on stale
// Week 1 episodes while later feeds (Action Network, BettingPros, ...) were never reached.
import { describe, expect, it } from 'vitest';
import { planEpisodeQueue } from '../../agents/lib/episode-queue.js';

const NOW = '2026-09-19T08:00:00Z';
const ep = (feed, pub_date) => ({ title: `${feed} ${pub_date}`, pub_date, _feed: { name: feed } });

describe('planEpisodeQueue', () => {
  it('orders newest-first across feeds regardless of feed order', () => {
    const { queue } = planEpisodeQueue([
      ep('Sharp or Square', '2026-09-13T12:00:00Z'),
      ep('Sharp or Square', '2026-09-10T12:00:00Z'),
      ep('Action Network', '2026-09-16T12:00:00Z'),
      ep('BettingPros', '2026-09-17T12:00:00Z'),
    ], { now: NOW });
    expect(queue.map((e) => e._feed.name)).toEqual(['BettingPros', 'Action Network', 'Sharp or Square', 'Sharp or Square']);
  });

  it('leaves episodes older than maxAgeDays out of the queue', () => {
    const { queue, tooOld } = planEpisodeQueue([
      ep('A', '2026-09-17T00:00:00Z'),
      ep('B', '2026-09-01T00:00:00Z'),
    ], { now: NOW, maxAgeDays: 10 });
    expect(queue).toHaveLength(1);
    expect(tooOld.map((e) => e._feed.name)).toEqual(['B']);
  });

  it('keeps undated episodes but puts them last', () => {
    const { queue } = planEpisodeQueue([ep('X', null), ep('Y', '2026-09-15T00:00:00Z')], { now: NOW });
    expect(queue.map((e) => e._feed.name)).toEqual(['Y', 'X']);
  });

  it('allows a backfill with a large maxAgeDays', () => {
    const { queue, tooOld } = planEpisodeQueue([ep('Old', '2026-02-24T00:00:00Z')], { now: NOW, maxAgeDays: 365 });
    expect(queue).toHaveLength(1);
    expect(tooOld).toHaveLength(0);
  });
});
