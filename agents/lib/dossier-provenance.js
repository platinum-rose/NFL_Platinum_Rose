// agents/lib/dossier-provenance.js
//
// rev-23-followup3 fix (Codex finding #4): "A suppressed run must
// verify/record the exact approved dossier source, including resolved
// path, SHA-256, and original meta.generated_at. Do not merely label any
// structurally complete dossier 'frozen pre-kickoff.'"
//
// Before this fix, a suppressed (frozen pre-kickoff) run's only trace of
// WHICH dossier file it actually used was the --dossier CLI argument as
// typed (relative, unresolved, and never recorded anywhere durable) and
// prose/comments asserting the run is "frozen pre-kickoff" -- nothing
// computed or persisted an actual content fingerprint, and nothing checked
// that the dossier could even attest its own generation time. A dossier
// that is structurally complete (every required market row present, see
// scoped-dossier.js's assertDossierShape()) is a NECESSARY but not
// SUFFICIENT condition for being the specific frozen snapshot that was
// reviewed and approved -- two different dossier files can both be
// structurally complete. This module computes and records the provenance
// that lets a human later confirm which exact file, by content, a given
// run actually used.

import { createHash } from 'node:crypto';
import path from 'node:path';

// Pure over its inputs. `rawText` MUST be the exact bytes read from disk
// BEFORE JSON.parse -- hashing a re-serialization of the parsed object
// would hash something that may differ from the file on disk (whitespace,
// key order) and could then attest to content the approver never actually
// saw.
export function computeDossierProvenance(dossierPath, rawText, parsedDossier) {
  return {
    resolved_path: path.resolve(dossierPath),
    sha256: createHash('sha256').update(rawText, 'utf8').digest('hex'),
    generated_at: parsedDossier?.meta?.generated_at ?? null,
  };
}

// Suppressed runs only: fail closed when the dossier cannot attest its own
// generation timestamp. Being structurally complete is not enough to call
// a dossier "frozen pre-kickoff" -- this run must also be able to pin WHEN
// the frozen snapshot it is using claims to have been produced.
export function assertDossierProvenancePinned(provenance) {
  if (!provenance.generated_at || typeof provenance.generated_at !== 'string') {
    throw new Error(
      `Dossier provenance check failed at ${provenance.resolved_path} (sha256 ${provenance.sha256}): `
      + `meta.generated_at is missing or not a string (got ${JSON.stringify(provenance.generated_at)}). `
      + 'A suppressed "frozen pre-kickoff" run must be able to pin the exact generation timestamp of its '
      + 'dossier -- being structurally complete is not sufficient on its own.',
    );
  }
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

const SHA256_HEX_RE = /^[0-9a-f]{64}$/i;

// rev-23-followup4 fix (Codex finding #3): assertDossierProvenancePinned()
// above only proves a dossier can attest ITS OWN generation timestamp --
// that is necessary but NOT sufficient to call it THE approved frozen
// pre-kickoff snapshot. Two different dossier files can each be
// structurally complete and self-consistently "pinned" while neither is
// the specific file a human actually reviewed and signed off on for this
// run. This asserts the run's computed provenance matches an EXPLICIT,
// externally-supplied approved contract -- { resolved_path, sha256,
// generated_at, kickoff_at } -- rather than merely recording whatever
// path/hash/timestamp happened to be passed via --dossier.
//
// This module never invents the approved contract's values. There is
// currently no pre-existing "approved dossier contract" file and no
// pre-existing season-kickoff-cutoff constant anywhere in this codebase
// (confirmed by exhaustive search across agents/, src/, scripts/, and
// docs/ as of this fix) -- Andy must supply, via a JSON file passed to the
// CLI's --approved-dossier-contract flag:
//   - resolved_path:  the exact absolute path of the dossier file he has
//                      actually reviewed and approved as the frozen
//                      pre-kickoff snapshot for this run.
//   - sha256:          that file's SHA-256, computed over its exact raw
//                      bytes (the same value this module's own
//                      computeDossierProvenance() would report for it).
//   - generated_at:    that dossier's own meta.generated_at, copied
//                      exactly.
//   - kickoff_at:      the ISO-8601 instant of this season's Week-1
//                      kickoff (or whatever cutoff Andy considers the
//                      boundary of "pre-kickoff" for this run), so
//                      generated_at can be verified as strictly BEFORE it
//                      without this module hardcoding a date of its own
//                      (see RULES.md's standing "never hardcode a wall-
//                      clock date threshold" rule).
// Until that contract is supplied and matches, every suppressed run fails
// closed here -- this is the CORRECT and INTENDED behavior, not a defect:
// absent an explicit approved identity, nothing should be able to
// self-certify as "frozen pre-kickoff."
export function assertDossierProvenanceApproved(provenance, approvedContract) {
  if (!isPlainObject(approvedContract)) {
    throw new Error(
      'Dossier provenance check failed: no approved-dossier contract was supplied. Pass '
      + '--approved-dossier-contract <path to a JSON file>, where that file is '
      + '{ "resolved_path": "<the exact absolute path of the dossier Andy has reviewed and approved>", '
      + '"sha256": "<its SHA-256, over the exact raw file bytes>", '
      + '"generated_at": "<that dossier\'s own meta.generated_at, copied exactly>", '
      + '"kickoff_at": "<ISO-8601 instant of this season\'s Week-1 kickoff, or whatever cutoff Andy '
      + 'considers the boundary of pre-kickoff>" }. This value cannot be invented by this tool -- Andy must '
      + 'supply the real values himself.',
    );
  }
  for (const field of ['resolved_path', 'sha256', 'generated_at', 'kickoff_at']) {
    if (typeof approvedContract[field] !== 'string' || !approvedContract[field]) {
      throw new Error(`Dossier provenance check failed: approved-dossier contract is missing a non-empty "${field}" string (got ${JSON.stringify(approvedContract[field])}).`);
    }
  }
  if (!SHA256_HEX_RE.test(approvedContract.sha256)) {
    throw new Error(`Dossier provenance check failed: approved-dossier contract's "sha256" is not a valid 64-character hex SHA-256 (got ${JSON.stringify(approvedContract.sha256)}).`);
  }
  const generatedAtMs = Date.parse(approvedContract.generated_at);
  if (!Number.isFinite(generatedAtMs)) {
    throw new Error(`Dossier provenance check failed: approved-dossier contract's "generated_at" (${JSON.stringify(approvedContract.generated_at)}) is not a parseable timestamp.`);
  }
  const kickoffAtMs = Date.parse(approvedContract.kickoff_at);
  if (!Number.isFinite(kickoffAtMs)) {
    throw new Error(`Dossier provenance check failed: approved-dossier contract's "kickoff_at" (${JSON.stringify(approvedContract.kickoff_at)}) is not a parseable timestamp.`);
  }
  if (!(generatedAtMs < kickoffAtMs)) {
    throw new Error(`Dossier provenance check failed: approved-dossier contract's generated_at (${JSON.stringify(approvedContract.generated_at)}) must be strictly BEFORE its own kickoff_at (${JSON.stringify(approvedContract.kickoff_at)}) to qualify as a pre-kickoff snapshot.`);
  }
  if (provenance.resolved_path !== approvedContract.resolved_path) {
    throw new Error(`Dossier provenance check failed: resolved_path mismatch -- this run's dossier is ${JSON.stringify(provenance.resolved_path)}, the approved contract names ${JSON.stringify(approvedContract.resolved_path)}.`);
  }
  if (provenance.sha256 !== approvedContract.sha256) {
    throw new Error(`Dossier provenance check failed: sha256 mismatch -- this run's dossier hashes to ${provenance.sha256}, the approved contract names ${approvedContract.sha256}. The dossier's content does not match the approved snapshot.`);
  }
  if (provenance.generated_at !== approvedContract.generated_at) {
    throw new Error(`Dossier provenance check failed: generated_at mismatch -- this run's dossier reports ${JSON.stringify(provenance.generated_at)}, the approved contract names ${JSON.stringify(approvedContract.generated_at)}.`);
  }
}
