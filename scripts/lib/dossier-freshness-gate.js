// Dossier freshness/hash-stamping gate (2026-08-13).
//
// Problem this closes: after the August 12 evidence-lane cleanup,
// .nfl/portfolio/dossier-2026-08-11.json remained the only portfolio dossier
// on disk and still predates that cleanup — confirmed independently in
// docs/NFL_FUTURES_SYNTHESIS_INCIDENT_REVIEW_CLAUDE_RESPONSE_2026-08-13.md.
// Nothing structurally prevented a future synthesis run from silently
// pointing at that stale dossier. See
// docs/FUTURES_ARTICLE_REACQUISITION_AND_GATES_DESIGN_2026-08-13.md §3.
//
// Two halves, deliberately separated:
//   - stampEvidenceLaneVersions() / collectEvidenceLaneStats() do local file
//     I/O (hashing, stat) — Node-only, no network, safe to run in any
//     sandbox since they never touch Supabase or an external API.
//   - checkDossierFreshness() is a PURE function (no I/O) — same convention
//     as agents/lib/win-dist.js and agents/lib/board-validate.js — so it's
//     fully unit-testable without touching the filesystem at all.

import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

export const DOSSIER_FRESHNESS_SCHEMA = 'dossier_freshness_gate_v1';

// The local evidence-lane files a portfolio dossier build should reflect.
// Paths are relative to the repo root. Keep in sync with
// scripts/build-futures-synthesis-context.js's own local-file list — this is
// a read-only freshness check on the same lanes, not a new source of truth.
export const EVIDENCE_LANE_FILES = Object.freeze([
  { key: 'articles', path: 'data/research-intel/review/article-intel-review-latest.json' },
  { key: 'availability', path: 'data/player-availability/latest.json' },
  { key: 'projected_starters', path: 'data/projected-starters/2026/latest.json' },
  { key: 'named_status_review', path: 'data/projected-starters/2026/named-status-review.json' },
  { key: 'training_camp', path: 'data/training-camp/2026/latest.json' },
  { key: 'prediction_market_map', path: 'data/prediction-markets/team-market-map-latest.json' },
  { key: 'prediction_market_coherence', path: 'data/prediction-markets/cross-market-coherence-latest.json' },
  { key: 'odds_execution_validation', path: 'data/futures-imports/odds-execution-validation-latest.json' },
  { key: 'youtube_freshness', path: 'data/shadow-harness/review/podcast-youtube-freshness-latest.json' },
]);

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Reads every EVIDENCE_LANE_FILES entry off disk (relative to rootDir) and
 * returns {key, path, sha256, mtimeMs, missing} for each. Missing files are
 * reported, not thrown on — a dossier build should proceed with whatever
 * evidence exists (same fail-open convention as every other optional local
 * signal in agents/portfolio-dossier.js), the freshness GATE is what should
 * surface the gap, not a crash.
 */
export async function collectEvidenceLaneStats(rootDir, files = EVIDENCE_LANE_FILES) {
  const results = [];
  for (const file of files) {
    const absPath = path.join(rootDir, file.path);
    try {
      const [buf, st] = await Promise.all([readFile(absPath), stat(absPath)]);
      results.push({
        key: file.key,
        path: file.path,
        sha256: sha256(buf),
        mtime: st.mtime.toISOString(),
        missing: false,
      });
    } catch (_err) {
      results.push({ key: file.key, path: file.path, sha256: null, mtime: null, missing: true });
    }
  }
  return results;
}

/**
 * Convenience wrapper: collects current stats and shapes them into the
 * meta.evidence_lane_versions map a dossier build should stamp onto itself.
 */
export async function stampEvidenceLaneVersions(rootDir, files = EVIDENCE_LANE_FILES) {
  const stats = await collectEvidenceLaneStats(rootDir, files);
  return {
    schema: DOSSIER_FRESHNESS_SCHEMA,
    stamped_at: new Date().toISOString(),
    lanes: Object.fromEntries(stats.map((s) => [s.key, s])),
  };
}

/**
 * Pure comparison — no I/O. Two modes:
 *
 *   1. Hash mode (preferred): if the dossier's own
 *      meta.evidence_lane_versions.lanes[key].sha256 differs from the
 *      CURRENT file's sha256 (passed in as currentStats), that lane changed
 *      after the dossier was built — flag it. This catches every real change
 *      (a rebuild, a fix, a cleanup pass), not just ones that happen to
 *      bump mtime.
 *   2. Legacy/no-stamp mode: older dossiers (e.g. dossier-2026-08-11.json)
 *      have no evidence_lane_versions at all. Falls back to comparing the
 *      dossier's meta.generated_at against each current evidence file's
 *      mtime — if any evidence file is newer than the dossier itself, the
 *      dossier predates it and must be treated as stale. This is exactly
 *      the check that would have caught dossier-2026-08-11.json being
 *      reused after the August 12 cleanup: every cleaned evidence file has
 *      a 2026-08-12 mtime, all newer than the dossier's 2026-08-11 generated_at.
 *
 * Returns {status: 'pass'|'stale'|'missing'|'unknown', stale_lanes, missing_lanes, mode}.
 *
 * `status` is a lossy human-readable rollup (priority: unknown > stale >
 * missing > pass) — a dossier can have both stale AND missing lanes at once,
 * so callers that need to make a blocking decision should read
 * `stale_lane_count`/`missing_lane_count`/`mode` directly (see
 * synthesisPreflightDecision() below) rather than branching on `status` alone.
 */
export function checkDossierFreshness(dossierMeta, currentStats) {
  const generatedAt = dossierMeta?.generated_at ? new Date(dossierMeta.generated_at) : null;
  const stampedLanes = dossierMeta?.evidence_lane_versions?.lanes || null;
  const staleLanes = [];
  const missingLanes = [];
  const mode = stampedLanes ? 'hash' : (generatedAt ? 'legacy_mtime' : 'unknown');

  for (const current of currentStats) {
    if (current.missing) {
      missingLanes.push(current.key);
      continue;
    }
    if (mode === 'hash') {
      const stamped = stampedLanes[current.key];
      if (!stamped || stamped.missing) {
        staleLanes.push({ key: current.key, reason: 'lane was missing when the dossier was built, now present' });
      } else if (stamped.sha256 !== current.sha256) {
        staleLanes.push({ key: current.key, reason: 'lane content changed since the dossier was built', dossier_sha256: stamped.sha256, current_sha256: current.sha256 });
      }
    } else if (mode === 'legacy_mtime') {
      const currentMtime = new Date(current.mtime);
      if (currentMtime > generatedAt) {
        staleLanes.push({ key: current.key, reason: 'evidence file is newer than the dossier (no evidence_lane_versions stamp to compare by hash)', dossier_generated_at: dossierMeta.generated_at, current_mtime: current.mtime });
      }
    }
  }

  return {
    schema: DOSSIER_FRESHNESS_SCHEMA,
    mode,
    // 2026-08-13 Codex review fix (finding #3): missing lanes now produce
    // their own 'missing' status instead of silently rolling up to 'pass'.
    // Priority when multiple conditions apply: unknown > stale > missing > pass.
    status: mode === 'unknown'
      ? 'unknown'
      : (staleLanes.length ? 'stale' : (missingLanes.length ? 'missing' : 'pass')),
    stale_lane_count: staleLanes.length,
    stale_lanes: staleLanes,
    missing_lane_count: missingLanes.length,
    missing_lanes: missingLanes,
  };
}

/**
 * Pure decision function — no I/O, not tied to any CLI flag names — so a
 * synthesis preflight (or any other caller) can decide whether to proceed
 * against a checkDossierFreshness() result, with each failure class
 * independently overridable. This is deliberately separate from `status`
 * above: a single broad "ignore everything" override was flagged in review
 * as too permissive, since stale/missing/unknown are different risk classes
 * (evidence changed vs. evidence absent vs. freshness simply unknowable).
 *
 * @param freshnessResult - the object returned by checkDossierFreshness()
 * @param overrides        - { allowStale, allowMissing, allowUnknown } — all
 *                            default false (block by default).
 * @returns {allowed, status, blocking_reasons: string[]}
 */
export function synthesisPreflightDecision(freshnessResult, overrides = {}) {
  const { allowStale = false, allowMissing = false, allowUnknown = false } = overrides;
  const blockingReasons = [];

  if (freshnessResult.mode === 'unknown' && !allowUnknown) {
    blockingReasons.push('unknown_freshness');
  }
  if (freshnessResult.stale_lane_count > 0 && !allowStale) {
    blockingReasons.push('stale_lanes');
  }
  if (freshnessResult.missing_lane_count > 0 && !allowMissing) {
    blockingReasons.push('missing_lanes');
  }

  return {
    allowed: blockingReasons.length === 0,
    status: freshnessResult.status,
    blocking_reasons: blockingReasons,
  };
}
