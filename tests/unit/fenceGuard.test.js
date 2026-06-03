// tests/unit/fenceGuard.test.js
import { describe, it, expect } from 'vitest';
import {
  validateFences,
  findSection,
  replaceSection,
  replaceManySections,
  FenceCorruptionError,
} from '../../agents/lib/fenceGuard.js';

describe('validateFences', () => {
  it('passes on empty / fenceless content', () => {
    expect(() => validateFences('')).not.toThrow();
    expect(() => validateFences('# Hello\n\nNo fences here.')).not.toThrow();
  });

  it('passes on a single balanced section', () => {
    const md = '## A\n<!-- auto-start:v1 -->\nbody\n<!-- auto-end -->\n';
    expect(() => validateFences(md)).not.toThrow();
  });

  it('passes on multiple balanced sections', () => {
    const md = [
      '## A\n<!-- auto-start:v1 -->\na\n<!-- auto-end -->',
      '## B\n<!-- auto-start:v1 -->\nb\n<!-- auto-end -->',
    ].join('\n\n');
    expect(() => validateFences(md)).not.toThrow();
  });

  it('throws on orphan auto-end', () => {
    expect(() => validateFences('xx\n<!-- auto-end -->\n')).toThrow(
      FenceCorruptionError,
    );
  });

  it('throws on unterminated auto-start', () => {
    expect(() =>
      validateFences('## A\n<!-- auto-start:v1 -->\nbody\n'),
    ).toThrow(FenceCorruptionError);
  });

  it('throws on nested auto-start (no intervening end)', () => {
    const md =
      '<!-- auto-start:v1 -->\n<!-- auto-start:v1 -->\n<!-- auto-end -->\n<!-- auto-end -->';
    expect(() => validateFences(md)).toThrow(FenceCorruptionError);
  });
});

describe('findSection', () => {
  it('returns null when header is missing', () => {
    expect(findSection('# Top\n\n## Other\n', '## Missing')).toBeNull();
  });

  it('returns null when header exists but no fence follows', () => {
    expect(findSection('## A\nplain text\n', '## A')).toBeNull();
  });

  it('locates a fenced section and exposes its body', () => {
    const md = [
      '# Top',
      '',
      '## A',
      '<!-- auto-start:v1 -->',
      'hello world',
      '<!-- auto-end -->',
      '',
    ].join('\n');
    const s = findSection(md, '## A');
    expect(s).not.toBeNull();
    expect(s.body).toBe('hello world');
  });
});

describe('replaceSection', () => {
  it('appends a new fenced section when header does not exist', () => {
    const out = replaceSection({
      content: '# Top\n\nIntro paragraph.',
      header: '## Podcast Intel',
      body: 'fresh body',
      version: 'v1',
    });
    expect(out).toContain('## Podcast Intel');
    expect(out).toContain('<!-- auto-start:v1 -->');
    expect(out).toContain('fresh body');
    expect(out).toContain('<!-- auto-end -->');
    expect(out.startsWith('# Top')).toBe(true);
  });

  it('replaces an existing fenced section in place, preserving prior content', () => {
    const md = [
      '# Top',
      '',
      'Manual intro stays.',
      '',
      '## A',
      '<!-- auto-start:v1 -->',
      'OLD',
      '<!-- auto-end -->',
      '',
      '## Manual After',
      'survives',
      '',
    ].join('\n');
    const out = replaceSection({
      content: md,
      header: '## A',
      body: 'NEW',
    });
    expect(out).toContain('Manual intro stays.');
    expect(out).toContain('NEW');
    expect(out).not.toContain('OLD');
    expect(out).toContain('## Manual After');
    expect(out).toContain('survives');
  });

  it('refuses to write when existing fences are corrupt', () => {
    const md = '## A\n<!-- auto-start:v1 -->\nbody\n'; // missing end
    expect(() =>
      replaceSection({ content: md, header: '## A', body: 'x' }),
    ).toThrow(FenceCorruptionError);
  });

  it('round-trips: replacing twice with the same body is a no-op', () => {
    const start = '## H\n<!-- auto-start:v1 -->\nbody\n<!-- auto-end -->\n';
    const a = replaceSection({ content: start, header: '## H', body: 'body' });
    const b = replaceSection({ content: a, header: '## H', body: 'body' });
    expect(b).toBe(a);
  });
});

describe('replaceManySections', () => {
  it('updates multiple sections and preserves manual content between them', () => {
    const md = [
      '# Team KC',
      '',
      'Manual intro about KC.',
      '',
      '## Podcast Intel',
      '<!-- auto-start:v1 -->',
      'OLD intel',
      '<!-- auto-end -->',
      '',
      '## Manual Notes',
      'My notes about Mahomes.',
      '',
      '## Season Trend',
      '<!-- auto-start:v1 -->',
      'OLD trend',
      '<!-- auto-end -->',
      '',
    ].join('\n');
    const out = replaceManySections({
      content: md,
      sections: [
        { header: '## Podcast Intel', body: 'NEW intel' },
        { header: '## Season Trend', body: 'NEW trend' },
      ],
    });
    expect(out).toContain('Manual intro about KC.');
    expect(out).toContain('My notes about Mahomes.');
    expect(out).toContain('NEW intel');
    expect(out).toContain('NEW trend');
    expect(out).not.toContain('OLD intel');
    expect(out).not.toContain('OLD trend');
  });
});
