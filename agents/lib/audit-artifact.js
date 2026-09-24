// agents/lib/audit-artifact.js
//
// All-Stage-1-failed audit artifact (rev 15/19 design review, Codex-approved).
//
// Today, before this fix, the early return `if (!ok.length) { ...; return; }`
// happens ~150-170 lines before the normal `.raw.json` write, so nothing is
// ever written to disk when every Stage-1 model fails — the only trace is a
// console.error. This module builds and writes a failure-only artifact using
// `runIdentity` (built once, immediately before the Stage-1 model loop begins
// — NOT the full `meta` object, which in production isn't constructed until
// well after the all-Stage-1-failed early return would fire; reusing `meta`
// there would risk a real ReferenceError/TDZ).
//
// Path is run-ID-qualified under its own `failed/` subdirectory, since the
// normal write path (`portfolio-<date><suffix>.*`) has no run ID and could
// otherwise collide with/overwrite a same-day successful artifact.

import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

// Pure — built once, immediately before the Stage-1 model loop begins, so a
// failure-only artifact and any normal artifact from the same run share the
// identical run_id (Codex rev 18 fix: avoids the meta-construction ordering
// bug described above).
export function buildRunIdentity({ date, season, watchlistPath, watchlistCount, promotionsPath, promotionsCount, suppressed, noPersistEnforcedBySuppression, dossierProvenance }) {
  return {
    run_id: randomUUID(),
    date,
    season,
    watchlist_path: watchlistPath ?? null,
    watchlist_count: watchlistCount ?? 0,
    promotions_path: promotionsPath ?? null,
    promotions_count: promotionsCount ?? 0,
    suppressed: !!suppressed,
    no_persist_enforced_by_suppression: !!noPersistEnforcedBySuppression,
    // rev-23-followup3 fix (Codex finding #4): the exact dossier source
    // this run used -- resolved path, SHA-256 of its raw bytes, and its
    // own self-reported meta.generated_at (null when absent/unpinned).
    // Present on BOTH a normal run's `meta` and an all-Stage-1-failed
    // artifact, since both spread runIdentity (see portfolio-synthesize.js
    // and buildFailureAuditArtifact() below) -- a failed run still used a
    // real dossier file and that provenance is worth keeping.
    dossier_provenance: dossierProvenance ?? null,
  };
}

// Pure — assembles the failure artifact content. `raw` is the per-model
// Stage-1 raw-capture map ({ [model]: { text, usage } | { text, usage, error } }
// per the merge fix below). Skeptic/Risk-Editor are marked
// 'not_reached_due_to_upstream_failure' since Stage 1 never produced anything
// for them to review.
export function buildFailureAuditArtifact(runIdentity, raw) {
  return {
    ...runIdentity,
    artifact_status: 'stage1_all_failed',
    audit_raw_unsanitized: {
      stage1: raw,
      skeptic: { status: 'not_reached_due_to_upstream_failure' },
      risk_editor: { status: 'not_reached_due_to_upstream_failure' },
    },
  };
}

// Writes the failure artifact to <outDir>/failed/portfolio-<date>-<run_id>.failed.raw.json
// via write-to-temp-then-rename for atomicity. Returns the final path.
export async function writeAuditArtifact(outDir, artifact) {
  const failedDir = path.join(outDir, 'failed');
  await mkdir(failedDir, { recursive: true });
  const finalPath = path.join(failedDir, `portfolio-${artifact.date}-${artifact.run_id}.failed.raw.json`);
  const tmpPath = `${finalPath}.tmp-${randomUUID()}`;
  await writeFile(tmpPath, JSON.stringify(artifact, null, 2));
  await rename(tmpPath, finalPath);
  return finalPath;
}
