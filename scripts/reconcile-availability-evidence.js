#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildAvailabilitySnapshotFromEvents } from '../agents/lib/player-availability.js';
import { writeAvailabilitySnapshotAndReports } from './build-player-availability.js';
import { nowIso, parseArgs, todayPacificDate } from './training-camp-intel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

export async function reconcileAvailabilityEvidence(options = {}) {
  const season = Number(options.season || 2026);
  const generatedAt = options.generatedAt || nowIso();
  const date = options.date || todayPacificDate();
  const availabilityPath = path.resolve(
    ROOT,
    options.availability || path.join('data', 'player-availability', 'latest.json'),
  );
  const input = options.inputPayload || await readJson(availabilityPath);
  const namedStatusReview = await readJson(path.join(ROOT, 'data', 'projected-starters', String(season), 'named-status-review.json'));
  const sourceHealth = (input.meta?.source_health || []).map((source) => (
    source.source === 'Training camp snapshot'
      ? {
        ...source,
        status: 'review',
        reason: 'Team identity and deterministic status/text conflict labeling are complete; full availability re-extraction and human confirmation remain pending.',
      }
      : source
  ));

  const snapshot = buildAvailabilitySnapshotFromEvents({
    season,
    generatedAt,
    events: input.events || [],
    sourceHealth,
    normalization: input.meta?.normalization || null,
    namedStatusReview,
  });
  snapshot.meta.evidence_reconciliation = {
    schema: 'availability_evidence_reconciliation_v1',
    reconciled_at: generatedAt,
    source_path: path.relative(ROOT, availabilityPath),
    source_generated_at: input.meta?.generated_at || null,
    input_event_count: (input.events || []).length,
    output_event_count: snapshot.events.length,
    conflicted_intel_count: snapshot.meta.conflicted_intel_count,
    unflagged_contradiction_count: snapshot.meta.availability_evidence_validation.unflagged_contradiction_count,
    network_fetches: false,
    model_calls: false,
    supabase_writes: false,
    official_picks_generated: false,
  };

  const validations = {
    team_identity: snapshot.meta.team_identity_validation,
    availability_evidence: snapshot.meta.availability_evidence_validation,
    named_status_review: snapshot.meta.named_status_review_validation,
  };
  const blocked = Object.values(validations).some((validation) => validation.status !== 'pass');

  if (options.write) {
    if (blocked) throw new Error('Refusing to write: availability evidence validation is blocked.');
    const outputs = await writeAvailabilitySnapshotAndReports(snapshot, { date });
    return { snapshot, validations, outputs };
  }
  return { snapshot, validations, outputs: null };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await reconcileAvailabilityEvidence({
    season: Number(args.season || 2026),
    generatedAt: args['generated-at'] || null,
    date: args.date || null,
    availability: args.availability || null,
    write: args.write === true,
  });
  const meta = result.snapshot.meta;
  console.log(`Availability evidence: ${meta.event_count} events; eligible=${meta.synthesis_eligible_count}; conflicted=${meta.conflicted_intel_count}; validation=${meta.availability_evidence_validation.status}.`);
  console.log(result.outputs
    ? 'Reconciled availability artifacts written locally. No network, model, Supabase, recommendation, or portfolio action was performed.'
    : 'Dry run only. Pass --write to replace the dated/latest local availability artifacts after validation.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.stack || err.message);
    process.exitCode = 1;
  });
}
