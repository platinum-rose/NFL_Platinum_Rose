import { describe, expect, it } from 'vitest';
import { buildRebuildPlan } from '../../scripts/rebuild-futures-evidence.js';

describe('futures evidence deterministic rebuild plan', () => {
  it('keeps dependency order, shared generated time, and explicit audit handoff', () => {
    const generatedAt = '2026-08-12T04:30:00.000Z';
    const sourceAudit = '.nfl/source-audit/nfl-intel-source-audit-2026-08-12T04-30-00-000Z.json';
    const contextOut = '.nfl/portfolio/frontier-synthesis-context-2026-08-12.json';
    const plan = buildRebuildPlan({
      generatedAt,
      date: '2026-08-12',
      sourceAudit,
      contextOut,
    });

    expect(plan.map((step) => step.step)).toEqual([
      'normalize team evidence',
      'reconcile availability evidence',
      'rebuild projected starters',
      'rebuild availability impact digest',
      'rebuild prediction-market map',
      'rebuild prediction-market coherence',
      'rebuild YouTube review/status',
      'rebuild YouTube local queue',
      'rebuild YouTube agent summary',
      'rebuild podcast/YouTube freshness',
      'rebuild local odds execution validation',
      'rebuild strict source audit',
      'validate and rebuild synthesis context',
    ]);
    for (const step of plan) {
      expect(step.args).toContain('--generated-at');
      expect(step.args).toContain(generatedAt);
    }
    expect(plan.at(-1).args).toContain('--source-audit');
    expect(plan.at(-1).args).toContain(sourceAudit);
    expect(plan.at(-1).args).toContain('--out');
    expect(plan.at(-1).args).toContain(contextOut);
  });
});
