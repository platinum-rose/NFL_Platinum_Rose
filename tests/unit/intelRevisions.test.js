import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { planRevisions, revisionHash, REVISION_MIN_HOURS } from '../../agents/lib/intel-revisions.js';

const sha256 = (v) => createHash('sha256').update(v).digest('hex');
const primerUrl = 'https://www.actionnetwork.com/nfl/nfl-betting-primer-trends-stats-systems-for-every-game';
const base = sha256(primerUrl);
const note = (published_at, url = primerUrl) => ({
  url, canonical_url: url, url_hash: sha256(url), title: 'NFL Betting Primer', published_at,
});

describe('planRevisions', () => {
  it('turns a weekly in-place rewrite of a stored URL into a revision row', () => {
    const stored = new Map([[base, '2026-09-07T20:00:00.000Z']]);
    const { revisions, revisionHashByBase } = planRevisions([note('2026-09-22T19:26:36.000Z')], stored, sha256);
    expect(revisions).toHaveLength(1);
    expect(revisions[0].url_hash).toBe(revisionHash(sha256, primerUrl, '2026-09-22T19:26:36.000Z'));
    expect(revisions[0].url_hash).not.toBe(base);
    expect(revisions[0].url).toBe(primerUrl);
    expect(revisionHashByBase.get(base)).toBe(revisions[0].url_hash);
  });

  it('ignores brand-new URLs (normal insert path handles them)', () => {
    const { revisions } = planRevisions([note('2026-09-22T19:26:36.000Z')], new Map(), sha256);
    expect(revisions).toHaveLength(0);
  });

  it('ignores small pubDate bumps under the threshold', () => {
    const stored = new Map([[base, '2026-09-22T08:00:00.000Z']]);
    const { revisions } = planRevisions([note('2026-09-22T19:26:36.000Z')], stored, sha256);
    expect(REVISION_MIN_HOURS).toBeGreaterThan(11);
    expect(revisions).toHaveLength(0);
  });

  it('collapses same-day republishes onto one revision hash', () => {
    const a = revisionHash(sha256, primerUrl, '2026-09-22T15:00:00.000Z');
    const b = revisionHash(sha256, primerUrl, '2026-09-22T23:59:00.000Z');
    expect(a).toBe(b);
    expect(revisionHash(sha256, primerUrl, '2026-09-29T15:00:00.000Z')).not.toBe(a);
  });

  it('skips items with no pubDate or no stored date', () => {
    const stored = new Map([[base, null]]);
    expect(planRevisions([note('2026-09-22T19:26:36.000Z')], stored, sha256).revisions).toHaveLength(0);
    const stored2 = new Map([[base, '2026-09-07T20:00:00.000Z']]);
    expect(planRevisions([note(null)], stored2, sha256).revisions).toHaveLength(0);
  });
});
