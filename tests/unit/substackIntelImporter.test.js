import { describe, it, expect } from 'vitest';
import { SUBSTACK_POST_EMR_2026, buildResearchNoteRecord, buildFullArticleBody } from '../../scripts/build-substack-intel-importer.js';

describe('build-substack-intel-importer', () => {
  it('contains proper source citation and author metadata', () => {
    expect(SUBSTACK_POST_EMR_2026.source).toBe('THE WINDOW (Matt Russell)');
    expect(SUBSTACK_POST_EMR_2026.author).toBe('Matt Russell');
    expect(SUBSTACK_POST_EMR_2026.url).toBe('https://mrussauthentic.substack.com/p/2026-nfl-betting-estimating-every');
  });

  it('builds research note record with all 32 team entries', () => {
    const record = buildResearchNoteRecord(SUBSTACK_POST_EMR_2026);
    expect(record.id).toBe('substack_200307567_emr');
    expect(record.source_type).toBe('newsletter');
    expect(record.metadata.team_notes_count).toBe(32);
    expect(record.metadata.publication).toBe('THE WINDOW');
    expect(record.metadata.hfa.standard_hfa).toBe(1.5);
  });

  it('formats full article body with team notes and HFA rules', () => {
    const body = buildFullArticleBody(SUBSTACK_POST_EMR_2026);
    expect(body).toContain('# 2026 NFL Betting: Estimating every NFL teams’ power rating in the betting market');
    expect(body).toContain('Matt Russell (THE WINDOW (Matt Russell))');
    expect(body).toContain('Baseline HFA: 1.5 pts');
    expect(body).toContain('LAR');
    expect(body).toContain('DET');
    expect(body).toContain('Myles Garrett');
  });
});
