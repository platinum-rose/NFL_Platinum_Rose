// tests/unit/dossierProvenance.test.js
// rev-23-followup3 (Codex finding #4): direct coverage for
// agents/lib/dossier-provenance.js, plus the threading of its output
// through agents/lib/audit-artifact.js's buildRunIdentity() into BOTH a
// normal run's `meta` and the all-Stage-1-failed audit artifact (both
// spread runIdentity, so one buildRunIdentity() test with the field
// present proves both inherit it).
import { createHash } from 'node:crypto';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { computeDossierProvenance, assertDossierProvenancePinned, assertDossierProvenanceApproved } from '../../agents/lib/dossier-provenance.js';
import { buildRunIdentity, buildFailureAuditArtifact } from '../../agents/lib/audit-artifact.js';

describe('computeDossierProvenance', () => {
  it('hashes the exact raw bytes given, not a re-serialization of the parsed object', () => {
    const rawText = '{"meta":{"season":2026,"generated_at":"2026-09-01T00:00:00Z"},"synthesis_input":{}}';
    const parsed = JSON.parse(rawText);
    const provenance = computeDossierProvenance('/some/dir/dossier-2026-09-01.json', rawText, parsed);
    expect(provenance.resolved_path).toBe('/some/dir/dossier-2026-09-01.json');
    expect(provenance.sha256).toBe(createHash('sha256').update(rawText, 'utf8').digest('hex'));
    expect(provenance.generated_at).toBe('2026-09-01T00:00:00Z');
  });

  it('resolves a relative path to an absolute one', () => {
    // rev-23-followup4 fix (Codex finding #8): `resolved_path.startsWith('/')`
    // asserts POSIX-only absolute-path syntax -- on Windows, path.resolve()
    // legitimately produces a drive-letter path like "C:\\...\\dossier.json",
    // which never starts with "/". path.isAbsolute() is the actual
    // platform-correct check for "is this resolved", and comparing against
    // path.resolve()'s own output (rather than a hardcoded separator
    // assumption) proves the same thing on every platform.
    const rawText = '{}';
    const provenance = computeDossierProvenance('relative/dossier.json', rawText, {});
    expect(path.isAbsolute(provenance.resolved_path)).toBe(true);
    expect(provenance.resolved_path).toBe(path.resolve('relative/dossier.json'));
  });

  it('records generated_at as null when meta.generated_at is absent, rather than throwing', () => {
    const rawText = '{"meta":{"season":2026}}';
    const provenance = computeDossierProvenance('/x/dossier.json', rawText, JSON.parse(rawText));
    expect(provenance.generated_at).toBeNull();
  });

  it('a single-byte difference in raw text produces a different hash (content-fingerprint sensitivity)', () => {
    const a = computeDossierProvenance('/x/d.json', '{"meta":{"generated_at":"t"}}', { meta: { generated_at: 't' } });
    const b = computeDossierProvenance('/x/d.json', '{"meta":{"generated_at":"u"}}', { meta: { generated_at: 'u' } });
    expect(a.sha256).not.toBe(b.sha256);
  });
});

describe('assertDossierProvenancePinned', () => {
  it('throws when generated_at is null', () => {
    expect(() => assertDossierProvenancePinned({ resolved_path: '/x', sha256: 'abc', generated_at: null }))
      .toThrow(/meta\.generated_at is missing or not a string/);
  });

  it('throws when generated_at is present but not a string', () => {
    expect(() => assertDossierProvenancePinned({ resolved_path: '/x', sha256: 'abc', generated_at: 12345 }))
      .toThrow(/meta\.generated_at is missing or not a string/);
  });

  it('does not throw when generated_at is a non-empty string', () => {
    expect(() => assertDossierProvenancePinned({ resolved_path: '/x', sha256: 'abc', generated_at: '2026-09-01T00:00:00Z' }))
      .not.toThrow();
  });
});

describe('assertDossierProvenanceApproved (rev-23-followup4, Codex finding #3)', () => {
  const provenance = { resolved_path: '/abs/dossier-2026-09-12.json', sha256: 'a'.repeat(64), generated_at: '2026-09-10T00:00:00Z' };
  function approvedContract(overrides = {}) {
    return {
      resolved_path: '/abs/dossier-2026-09-12.json',
      sha256: 'a'.repeat(64),
      generated_at: '2026-09-10T00:00:00Z',
      kickoff_at: '2026-09-11T00:00:00Z',
      ...overrides,
    };
  }

  it('throws when no approved contract is supplied at all (undefined/null)', () => {
    expect(() => assertDossierProvenanceApproved(provenance, undefined)).toThrow(/no approved-dossier contract was supplied/);
    expect(() => assertDossierProvenanceApproved(provenance, null)).toThrow(/no approved-dossier contract was supplied/);
  });

  it('throws when the approved contract is not a plain object', () => {
    expect(() => assertDossierProvenanceApproved(provenance, 'not-an-object')).toThrow(/no approved-dossier contract was supplied/);
  });

  it.each(['resolved_path', 'sha256', 'generated_at', 'kickoff_at'])('throws when the approved contract is missing "%s"', (field) => {
    const bad = approvedContract();
    delete bad[field];
    expect(() => assertDossierProvenanceApproved(provenance, bad)).toThrow(new RegExp(`missing a non-empty "${field}" string`));
  });

  it('throws when sha256 is not a valid 64-char hex string', () => {
    expect(() => assertDossierProvenanceApproved(provenance, approvedContract({ sha256: 'not-hex' })))
      .toThrow(/not a valid 64-character hex SHA-256/);
  });

  it('throws when generated_at is not a parseable timestamp', () => {
    expect(() => assertDossierProvenanceApproved(provenance, approvedContract({ generated_at: 'not-a-date' })))
      .toThrow(/"generated_at".*is not a parseable timestamp/);
  });

  it('throws when kickoff_at is not a parseable timestamp', () => {
    expect(() => assertDossierProvenanceApproved(provenance, approvedContract({ kickoff_at: 'not-a-date' })))
      .toThrow(/"kickoff_at".*is not a parseable timestamp/);
  });

  it('throws when generated_at is not strictly before kickoff_at', () => {
    expect(() => assertDossierProvenanceApproved(provenance, approvedContract({ generated_at: '2026-09-12T00:00:00Z', kickoff_at: '2026-09-11T00:00:00Z' })))
      .toThrow(/must be strictly BEFORE its own kickoff_at/);
  });

  it('throws on a resolved_path mismatch', () => {
    expect(() => assertDossierProvenanceApproved(provenance, approvedContract({ resolved_path: '/abs/some-other-dossier.json' })))
      .toThrow(/resolved_path mismatch/);
  });

  it('throws on a sha256 mismatch (content does not match the approved snapshot)', () => {
    expect(() => assertDossierProvenanceApproved(provenance, approvedContract({ sha256: 'b'.repeat(64) })))
      .toThrow(/sha256 mismatch/);
  });

  it('throws on a generated_at mismatch', () => {
    expect(() => assertDossierProvenanceApproved(provenance, approvedContract({ generated_at: '2026-09-09T00:00:00Z', kickoff_at: '2026-09-11T00:00:00Z' })))
      .toThrow(/generated_at mismatch/);
  });

  it('does not throw when every field matches and generated_at is strictly pre-kickoff', () => {
    expect(() => assertDossierProvenanceApproved(provenance, approvedContract())).not.toThrow();
  });
});

describe('buildRunIdentity threads dossier_provenance into both consumers (rev-23-followup3, Codex finding #4)', () => {
  const dossierProvenance = { resolved_path: '/abs/dossier-2026-09-12.json', sha256: 'deadbeef', generated_at: '2026-09-12T00:00:00Z' };
  const baseArgs = {
    date: '2026-09-12', season: 2026, watchlistPath: null, watchlistCount: 0,
    promotionsPath: null, promotionsCount: 0, suppressed: true, noPersistEnforcedBySuppression: true,
    dossierProvenance,
  };

  it('a normal run\'s meta object (built by spreading runIdentity) carries dossier_provenance', () => {
    const runIdentity = buildRunIdentity(baseArgs);
    expect(runIdentity.dossier_provenance).toEqual(dossierProvenance);
    const meta = { ...runIdentity, stage1_errors: null, quarantine: null };
    expect(meta.dossier_provenance).toEqual(dossierProvenance);
  });

  it('an all-Stage-1-failed audit artifact (buildFailureAuditArtifact spreads runIdentity) also carries dossier_provenance', () => {
    const runIdentity = buildRunIdentity(baseArgs);
    const failureArtifact = buildFailureAuditArtifact(runIdentity, { modelA: { error: 'boom' } });
    expect(failureArtifact.dossier_provenance).toEqual(dossierProvenance);
    expect(failureArtifact.artifact_status).toBe('stage1_all_failed');
  });

  it('defaults dossier_provenance to null when not supplied, rather than throwing or omitting the key', () => {
    const { dossierProvenance: _omit, ...withoutProvenance } = baseArgs;
    const runIdentity = buildRunIdentity(withoutProvenance);
    expect(runIdentity.dossier_provenance).toBeNull();
  });
});
