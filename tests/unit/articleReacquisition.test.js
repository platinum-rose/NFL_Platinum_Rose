import { describe, expect, it } from 'vitest';
import {
  buildReacquiredRecord,
  detectCandidateSelections,
  selectReacquisitionTargets,
  sha256Hex,
  stripHtmlToText,
  summarizeReacquisitionRun,
} from '../../scripts/lib/article-reacquisition.js';

function makeReview(articles) {
  return { articles };
}

describe('selectReacquisitionTargets', () => {
  it('selects only metadata_only and suspected_ingest_cap records', () => {
    const targets = selectReacquisitionTargets(makeReview([
      { id: 1, url: 'https://a', body_evidence_status: 'metadata_only', body_chars: 0 },
      { id: 2, url: 'https://b', body_evidence_status: 'suspected_ingest_cap', body_chars: 4000 },
      { id: 3, url: 'https://c', body_evidence_status: 'body_available', body_chars: 1200 },
    ]));
    expect(targets.map((t) => t.id)).toEqual([1, 2]);
  });

  it('matches the real repo article-intel-review-latest.json count exactly (212 = 31 + 181)', async () => {
    // Loads the actual on-disk artifact — this test doubles as a live
    // regression check that the real data still matches the documented
    // incident-review counts.
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const reviewPath = path.join(process.cwd(), 'data/research-intel/review/article-intel-review-latest.json');
    const review = JSON.parse(await fs.readFile(reviewPath, 'utf8'));
    const targets = selectReacquisitionTargets(review);
    const expected = (review.summary.body_evidence.metadata_only || 0) + (review.summary.body_evidence.suspected_ingest_cap || 0);
    expect(targets.length).toBe(expected);
  });

  it('handles a missing/empty articles array', () => {
    expect(selectReacquisitionTargets({})).toEqual([]);
    expect(selectReacquisitionTargets(undefined)).toEqual([]);
  });
});

describe('stripHtmlToText', () => {
  it('removes script/style/nav/header/footer blocks and tags, collapses whitespace', () => {
    const html = '<html><head><style>.x{color:red}</style></head><body><nav>Menu</nav><header>Site Header</header><p>Real   article\ntext.</p><footer>Copyright</footer></body></html>';
    const text = stripHtmlToText(html);
    expect(text).not.toContain('Menu');
    expect(text).not.toContain('Site Header');
    expect(text).not.toContain('Copyright');
    expect(text).not.toContain('color:red');
    expect(text).toContain('Real article text.');
  });

  it('handles empty/null input', () => {
    expect(stripHtmlToText('')).toBe('');
    expect(stripHtmlToText(null)).toBe('');
  });
});

describe('buildReacquiredRecord', () => {
  const target = { id: 42, url: 'https://example.com/a', title: 'T', source: 'S', author: 'A', published_at: '2026-08-01', body_evidence_status: 'metadata_only', previous_body_chars: 0 };

  it('marks unavailable (not fabricated) when the fetch itself failed', () => {
    const rec = buildReacquiredRecord(target, { ok: false, error: 'timeout' }, '2026-08-13T00:00:00.000Z');
    expect(rec.status).toBe('unavailable');
    expect(rec.reason).toBe('timeout');
    expect(rec.new_body).toBeNull();
  });

  it('marks unavailable with an http-status reason when no error string is given', () => {
    const rec = buildReacquiredRecord(target, { ok: false, httpStatus: 404 });
    expect(rec.reason).toBe('http_404');
  });

  it('marks unavailable when the page fetched but stripped to nothing', () => {
    const rec = buildReacquiredRecord(target, { ok: true, rawHtml: '<nav></nav>' });
    expect(rec.status).toBe('unavailable');
    expect(rec.reason).toBe('empty_body_after_strip');
  });

  it('marks recovered with a hash and improved=true when real content comes back', () => {
    const rec = buildReacquiredRecord(target, { ok: true, rawHtml: '<p>Full article body text here.</p>' });
    expect(rec.status).toBe('recovered');
    expect(rec.new_body).toBe('Full article body text here.');
    expect(rec.new_body_sha256).toBe(sha256Hex('Full article body text here.'));
    expect(rec.improved).toBe(true);
  });

  it('never overwrites — always carries the previous status/char-count alongside the new result', () => {
    const rec = buildReacquiredRecord({ ...target, body_evidence_status: 'suspected_ingest_cap', previous_body_chars: 4000 }, { ok: true, rawHtml: '<p>New longer body.</p>' });
    expect(rec.previous_body_evidence_status).toBe('suspected_ingest_cap');
    expect(rec.previous_body_chars).toBe(4000);
  });

  // 2026-08-13 Codex review finding #6: promotion-grade fields.
  describe('promotion-review scaffolding', () => {
    it('always starts pending_review and never auto-approves', () => {
      const recovered = buildReacquiredRecord(target, { ok: true, rawHtml: '<p>Body text.</p>' });
      const unavailable = buildReacquiredRecord(target, { ok: false, error: 'timeout' });
      expect(recovered.promotion_status).toBe('pending_review');
      expect(unavailable.promotion_status).toBe('pending_review');
      expect(recovered.reviewer).toBeNull();
      expect(recovered.reviewed_at).toBeNull();
    });

    it('records the Supabase promotion target so a future step does not have to re-derive it', () => {
      const rec = buildReacquiredRecord(target, { ok: true, rawHtml: '<p>Body text.</p>' });
      expect(rec.supabase_table).toBe('research_intel_notes');
      expect(rec.supabase_primary_key_column).toBe('id');
      expect(rec.supabase_primary_key).toBe(target.id);
    });

    it('honestly reports previous_body_sha256/excerpt as unavailable rather than fabricating them', () => {
      const rec = buildReacquiredRecord(target, { ok: true, rawHtml: '<p>Body text.</p>' });
      expect(rec.previous_body_sha256).toBeNull();
      expect(rec.previous_body_excerpt).toBeNull();
      expect(rec.previous_body_unavailable_reason).toBeTruthy();
    });

    it('produces a new_body_excerpt and an "improved" diff_summary when the recovered body is longer', () => {
      const longBody = 'A'.repeat(500);
      const rec = buildReacquiredRecord({ ...target, previous_body_chars: 100 }, { ok: true, rawHtml: `<p>${longBody}</p>` });
      expect(rec.new_body_excerpt.length).toBeLessThanOrEqual(281); // 280 chars + ellipsis
      expect(rec.diff_summary).toContain('longer');
      expect(rec.diff_summary).toContain('100');
    });

    it('produces a "review before promoting" diff_summary when the recovered body is not longer', () => {
      const rec = buildReacquiredRecord({ ...target, previous_body_chars: 4000 }, { ok: true, rawHtml: '<p>Short.</p>' });
      expect(rec.improved).toBe(false);
      expect(rec.diff_summary).toContain('review before promoting');
    });

    it('unavailable records have a null new_body_excerpt and a non-fabricated diff_summary', () => {
      const rec = buildReacquiredRecord(target, { ok: false, error: 'timeout' });
      expect(rec.new_body_excerpt).toBeNull();
      expect(rec.diff_summary).toContain('not recovered');
    });
  });
});

describe('detectCandidateSelections (conservative multi-pick surfacing)', () => {
  it('finds the confirmed real example: two distinct player unders in one article', () => {
    const body = 'Our favorite unders to target this week: Tyler Shough under 3449.5 passing yards at plus money. Also strong: Fernando Mendoza under 2299.5 rushing yards.';
    const found = detectCandidateSelections(body);
    const names = found.map((f) => f.candidate_name);
    expect(names).toContain('Tyler Shough');
    expect(names).toContain('Fernando Mendoza');
    expect(found.find((f) => f.candidate_name === 'Tyler Shough').side).toBe('under');
    expect(found.find((f) => f.candidate_name === 'Tyler Shough').line).toBe(3449.5);
  });

  it('deduplicates the same name/side/line triple mentioned twice', () => {
    const body = 'Buffalo Bills over 10.5 wins is the play. Repeating: Buffalo Bills over 10.5 wins.';
    const found = detectCandidateSelections(body);
    expect(found).toHaveLength(1);
  });

  it('returns an empty array for prose with no over/under selection pattern', () => {
    expect(detectCandidateSelections('Just a general football article with no picks.')).toEqual([]);
  });

  it('handles empty/null input', () => {
    expect(detectCandidateSelections('')).toEqual([]);
    expect(detectCandidateSelections(null)).toEqual([]);
  });
});

describe('summarizeReacquisitionRun', () => {
  it('tallies recovered/unavailable/improved and groups unavailable reasons', () => {
    const records = [
      { status: 'recovered', improved: true },
      { status: 'recovered', improved: false },
      { status: 'unavailable', reason: 'timeout' },
      { status: 'unavailable', reason: 'timeout' },
      { status: 'unavailable', reason: 'http_404' },
    ];
    const summary = summarizeReacquisitionRun(records);
    expect(summary.total).toBe(5);
    expect(summary.recovered).toBe(2);
    expect(summary.unavailable).toBe(3);
    expect(summary.improved).toBe(1);
    expect(summary.unavailable_reasons).toEqual({ timeout: 2, http_404: 1 });
  });

  it('handles an empty run', () => {
    expect(summarizeReacquisitionRun([])).toMatchObject({ total: 0, recovered: 0, unavailable: 0, improved: 0 });
  });
});
