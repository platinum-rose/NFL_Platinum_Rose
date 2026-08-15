import { describe, expect, it } from 'vitest';
import { checkDossierFreshness, synthesisPreflightDecision } from '../../scripts/lib/dossier-freshness-gate.js';

function stats(overrides = {}) {
  const base = {
    articles: { key: 'articles', path: 'a.json', sha256: 'aaa', mtime: '2026-08-12T00:00:00.000Z', missing: false },
    availability: { key: 'availability', path: 'b.json', sha256: 'bbb', mtime: '2026-08-12T00:00:00.000Z', missing: false },
  };
  return Object.values({ ...base, ...overrides });
}

describe('checkDossierFreshness — hash mode (dossier has evidence_lane_versions)', () => {
  it('passes when every current hash matches the dossier-stamped hash', () => {
    const dossierMeta = {
      generated_at: '2026-08-12T06:00:00.000Z',
      evidence_lane_versions: { lanes: { articles: { sha256: 'aaa' }, availability: { sha256: 'bbb' } } },
    };
    const result = checkDossierFreshness(dossierMeta, stats());
    expect(result.mode).toBe('hash');
    expect(result.status).toBe('pass');
    expect(result.stale_lane_count).toBe(0);
  });

  it('flags a lane whose current hash differs from what the dossier stamped', () => {
    const dossierMeta = {
      generated_at: '2026-08-12T06:00:00.000Z',
      evidence_lane_versions: { lanes: { articles: { sha256: 'OLD_HASH' }, availability: { sha256: 'bbb' } } },
    };
    const result = checkDossierFreshness(dossierMeta, stats());
    expect(result.status).toBe('stale');
    expect(result.stale_lane_count).toBe(1);
    expect(result.stale_lanes[0].key).toBe('articles');
    expect(result.stale_lanes[0].dossier_sha256).toBe('OLD_HASH');
    expect(result.stale_lanes[0].current_sha256).toBe('aaa');
  });

  it('flags a lane that was missing/unstamped when the dossier was built but exists now', () => {
    const dossierMeta = {
      generated_at: '2026-08-12T06:00:00.000Z',
      evidence_lane_versions: { lanes: { articles: { sha256: 'aaa' } } }, // no 'availability' entry at all
    };
    const result = checkDossierFreshness(dossierMeta, stats());
    expect(result.status).toBe('stale');
    expect(result.stale_lanes.some((l) => l.key === 'availability')).toBe(true);
  });

  it('reports missing current files separately from staleness', () => {
    const dossierMeta = {
      generated_at: '2026-08-12T06:00:00.000Z',
      evidence_lane_versions: { lanes: { articles: { sha256: 'aaa' }, availability: { sha256: 'bbb' } } },
    };
    const result = checkDossierFreshness(dossierMeta, stats({ availability: { key: 'availability', path: 'b.json', sha256: null, mtime: null, missing: true } }));
    expect(result.missing_lane_count).toBe(1);
    expect(result.missing_lanes).toEqual(['availability']);
    // a missing current file is not itself a staleness verdict on that lane
    expect(result.stale_lanes.some((l) => l.key === 'availability')).toBe(false);
  });
});

describe('checkDossierFreshness — legacy mtime-fallback mode (older dossiers with no stamp)', () => {
  it('exactly reproduces the real dossier-2026-08-11.json failure mode: every lane refreshed on/after 2026-08-12 must be flagged stale', () => {
    const dossierMeta = { generated_at: '2026-08-11T21:36:53.950Z' }; // no evidence_lane_versions — the real shape
    const currentStats = [
      { key: 'articles', path: 'a.json', sha256: 'x', mtime: '2026-08-12T07:11:53.593Z', missing: false },
      { key: 'availability', path: 'b.json', sha256: 'y', mtime: '2026-08-13T09:13:59.818Z', missing: false },
    ];
    const result = checkDossierFreshness(dossierMeta, currentStats);
    expect(result.mode).toBe('legacy_mtime');
    expect(result.status).toBe('stale');
    expect(result.stale_lane_count).toBe(2);
  });

  it('passes when every evidence file predates the dossier generated_at', () => {
    const dossierMeta = { generated_at: '2026-08-13T00:00:00.000Z' };
    const currentStats = [
      { key: 'articles', path: 'a.json', sha256: 'x', mtime: '2026-08-12T00:00:00.000Z', missing: false },
    ];
    const result = checkDossierFreshness(dossierMeta, currentStats);
    expect(result.status).toBe('pass');
  });
});

describe('checkDossierFreshness — unknown mode', () => {
  it('returns unknown when the dossier has neither a stamp nor a generated_at', () => {
    const result = checkDossierFreshness({}, stats());
    expect(result.mode).toBe('unknown');
    expect(result.status).toBe('unknown');
  });

  it('handles a null/undefined dossierMeta without throwing', () => {
    expect(checkDossierFreshness(null, stats()).status).toBe('unknown');
    expect(checkDossierFreshness(undefined, []).status).toBe('unknown');
  });
});

// 2026-08-13 Codex review finding #3: missing lanes and unknown freshness
// used to fall through as 'pass'/only-warn. status now distinguishes them,
// and synthesisPreflightDecision() blocks on each class independently.
describe('checkDossierFreshness — status now distinguishes missing from pass (finding #3)', () => {
  it('reports status "missing" (not "pass") when a lane is stamped-matching but a different lane is absent from disk', () => {
    const dossierMeta = {
      generated_at: '2026-08-12T06:00:00.000Z',
      evidence_lane_versions: { lanes: { articles: { sha256: 'aaa' }, availability: { sha256: 'bbb' } } },
    };
    const result = checkDossierFreshness(dossierMeta, stats({ availability: { key: 'availability', path: 'b.json', sha256: null, mtime: null, missing: true } }));
    expect(result.status).toBe('missing');
    expect(result.missing_lane_count).toBe(1);
  });

  it('legacy mtime mode with a missing current lane also reports "missing", not "pass"', () => {
    const dossierMeta = { generated_at: '2026-08-13T00:00:00.000Z' };
    const currentStats = [
      { key: 'articles', path: 'a.json', sha256: 'x', mtime: '2026-08-12T00:00:00.000Z', missing: false },
      { key: 'named_status_review', path: 'nsr.json', sha256: null, mtime: null, missing: true },
    ];
    const result = checkDossierFreshness(dossierMeta, currentStats);
    expect(result.mode).toBe('legacy_mtime');
    expect(result.status).toBe('missing');
  });

  it('stale takes priority over missing when both are present', () => {
    const dossierMeta = {
      generated_at: '2026-08-12T06:00:00.000Z',
      evidence_lane_versions: { lanes: { articles: { sha256: 'OLD' } } },
    };
    const result = checkDossierFreshness(dossierMeta, [
      { key: 'articles', path: 'a.json', sha256: 'NEW', mtime: '2026-08-12T00:00:00.000Z', missing: false },
      { key: 'availability', path: 'b.json', sha256: null, mtime: null, missing: true },
    ]);
    expect(result.status).toBe('stale');
    expect(result.stale_lane_count).toBe(1);
    expect(result.missing_lane_count).toBe(1);
  });
});

describe('synthesisPreflightDecision', () => {
  it('blocks on a hash-mode dossier with matching hashes but one missing current lane', () => {
    const result = checkDossierFreshness(
      { generated_at: '2026-08-12T06:00:00.000Z', evidence_lane_versions: { lanes: { articles: { sha256: 'aaa' } } } },
      [
        { key: 'articles', path: 'a.json', sha256: 'aaa', mtime: '2026-08-12T00:00:00.000Z', missing: false },
        { key: 'availability', path: 'b.json', sha256: null, mtime: null, missing: true },
      ],
    );
    const decision = synthesisPreflightDecision(result);
    expect(decision.allowed).toBe(false);
    expect(decision.blocking_reasons).toContain('missing_lanes');
  });

  it('blocks a legacy mtime-mode dossier with a missing current lane', () => {
    const result = checkDossierFreshness(
      { generated_at: '2026-08-13T00:00:00.000Z' },
      [{ key: 'named_status_review', path: 'nsr.json', sha256: null, mtime: null, missing: true }],
    );
    const decision = synthesisPreflightDecision(result);
    expect(decision.allowed).toBe(false);
    expect(decision.blocking_reasons).toContain('missing_lanes');
  });

  it('blocks unknown dossier freshness unless explicitly overridden', () => {
    const result = checkDossierFreshness({}, stats());
    expect(synthesisPreflightDecision(result).allowed).toBe(false);
    expect(synthesisPreflightDecision(result).blocking_reasons).toContain('unknown_freshness');
    expect(synthesisPreflightDecision(result, { allowUnknown: true }).allowed).toBe(true);
  });

  it('each override only lifts its own failure class, not the others', () => {
    const dossierMeta = {
      generated_at: '2026-08-12T06:00:00.000Z',
      evidence_lane_versions: { lanes: { articles: { sha256: 'OLD' } } },
    };
    const result = checkDossierFreshness(dossierMeta, [
      { key: 'articles', path: 'a.json', sha256: 'NEW', mtime: '2026-08-12T00:00:00.000Z', missing: false },
      { key: 'availability', path: 'b.json', sha256: null, mtime: null, missing: true },
    ]);
    // stale AND missing both present; allowing only stale should still block on missing.
    const staleOnlyOverride = synthesisPreflightDecision(result, { allowStale: true });
    expect(staleOnlyOverride.allowed).toBe(false);
    expect(staleOnlyOverride.blocking_reasons).toEqual(['missing_lanes']);

    const bothOverridden = synthesisPreflightDecision(result, { allowStale: true, allowMissing: true });
    expect(bothOverridden.allowed).toBe(true);
  });

  it('allows a fully clean pass-status result with no overrides needed', () => {
    const result = checkDossierFreshness(
      { generated_at: '2026-08-12T06:00:00.000Z', evidence_lane_versions: { lanes: { articles: { sha256: 'aaa' } } } },
      [{ key: 'articles', path: 'a.json', sha256: 'aaa', mtime: '2026-08-12T00:00:00.000Z', missing: false }],
    );
    expect(result.status).toBe('pass');
    expect(synthesisPreflightDecision(result)).toMatchObject({ allowed: true, blocking_reasons: [] });
  });
});
