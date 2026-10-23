// Validation-only preflight. This does not run a model, repair inputs, or approve picks.
// Run from the existing checkout: node reports/intel/2026-w05-astra-citation-validator.mjs
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = p => fs.readFileSync(path.join(root, p));
const hash = p => crypto.createHash('sha256').update(read(p)).digest('hex');
const verifier = 'data/generated/master-intel/w05-expert-verified.json';
const calibration = 'data/research-intel/proposed/2026-w05-historical-market-calibration.json';
const csv = 'data/vault-seed/nflverse/games-full-1999-2026.csv';
const resultPath = 'reports/intel/2026-w05-astra-citation-validation.json';
const pins = {
  head: '7ef79fff37c4cab99fd3b23699452dc1fafcfcdc',
  calibration: '0ea3559255d4b31fb919d585d9f07fdd542ea2f0bccb5745eb9b73ecd5935d33',
  csv: '51f762960b078c5a10ab61e79716cdfc22162ba91a357a42b620f1f816f0fc51',
};
const actual = {
  head: execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim(),
  calibration: hash(calibration), csv: hash(csv),
  embedded_csv: JSON.parse(read(calibration)).source.sha256,
};
const pinFailures = Object.keys(pins).filter(k => pins[k] !== actual[k]);
if (actual.embedded_csv !== pins.csv) pinFailures.push('embedded_csv');
const data = JSON.parse(read(verifier));
const idKeys = ['source_row_id', 'sourceRowId', 'row_id', 'rowId', 'id', 'note_id', 'signal_id', 'pick_id'];
const nonempty = v => (typeof v === 'string' && v.trim().length > 0) || typeof v === 'number';
const failures = [];
const byKind = {};
for (const [index, row] of data.rows.entries()) {
  if (row.verdict !== 'verified') continue;
  const issues = [];
  if (!idKeys.some(key => nonempty(row[key]))) issues.push('missing_source_row_id');
  if (typeof row.url !== 'string' || !/^https?:\/\//.test(row.url)) issues.push('missing_retained_url');
  if (typeof row.published !== 'string' || !Number.isFinite(Date.parse(row.published))) issues.push('missing_source_timestamp');
  if (typeof row.quote !== 'string' || !row.quote.trim()) issues.push('missing_supporting_quote');
  const counts = byKind[row.kind] ??= {verified: 0, failed: 0, issues: {}};
  counts.verified++;
  if (issues.length) {
    counts.failed++;
    for (const issue of issues) counts.issues[issue] = (counts.issues[issue] || 0) + 1;
    // This pointer locates a defect. It is not a fabricated upstream source-row ID.
    failures.push({pointer: `${verifier}#/rows/${index}`, kind: row.kind, issues});
  }
}
const failed = pinFailures.length > 0 || failures.length > 0;
const report = {
  schema: 'astra_citation_input_preflight_v1', checked_at: new Date().toISOString(),
  status: failed ? 'FAIL_STOP_BEFORE_SYNTHESIS' : 'PROVENANCE_FIELDS_PRESENT_FURTHER_VALIDATION_REQUIRED',
  pins, actual, pin_failures: pinFailures,
  source: {path: verifier, sha256: hash(verifier), generated_at: data.generated_at},
  verified_rows: Object.values(byKind).reduce((n, x) => n + x.verified, 0),
  failed_rows: failures.length, by_kind: byKind, failures,
  scope: 'Required citation fields on verifier-verified inputs only. Field presence is necessary, never sufficient.',
  not_performed: ['upstream source-ID resolution', 'raw-source verbatim quote matching', 'claimed team/player/game validation', 'market-price citation validation', 'simulation', 'synthesis'],
  recommendation_citations_issued: 0,
};
// Preserve prior/concurrent artifacts; a repeated run prints findings without overwriting.
if (!fs.existsSync(path.join(root, resultPath))) fs.writeFileSync(path.join(root, resultPath), JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({status: report.status, pin_failures: pinFailures, verified_rows: report.verified_rows, failed_rows: failures.length, by_kind: byKind, result_path: resultPath}, null, 2));
process.exitCode = failed ? 1 : 2; // Never imply that presence-only validation approved citations.
