#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  buildSnapshot,
  dedupeItems,
  nowIso,
  parseArgs,
  todayPacificDate,
  writeSnapshotAndReports,
} from './training-camp-intel.js';
import { buildAvailabilitySnapshotFromEvents } from '../agents/lib/player-availability.js';
import { writeAvailabilitySnapshotAndReports } from './build-player-availability.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

export async function normalizeTeamEvidenceArtifacts(options = {}) {
  const season = Number(options.season || 2026);
  const generatedAt = options.generatedAt || nowIso();
  const date = options.date || todayPacificDate();
  const trainingCampPath = path.resolve(ROOT, options.trainingCamp || path.join('data', 'training-camp', String(season), 'latest.json'));
  const availabilityPath = path.resolve(ROOT, options.availability || path.join('data', 'player-availability', 'latest.json'));
  const campInput = await readJson(trainingCampPath);
  const availabilityInput = await readJson(availabilityPath);

  const campItems = dedupeItems(campInput.items || []);
  const priorCampNormalization = campInput.meta?.normalization || null;
  const normalizedFeedHealth = Array.isArray(campInput.meta?.feed_health)
    ? campInput.meta.feed_health.map((feed) => ({
      ...feed,
      legacy_kept_rows: feed.legacy_kept_rows ?? feed.kept_items ?? 0,
      kept_items: campItems.filter((item) => item.source === feed.source).length,
      team_identity_normalized: true,
    }))
    : null;
  const campInputDir = path.resolve(ROOT, campInput.meta?.input_dir || path.join('data', 'training-camp', String(season), 'manual'));
  const campSnapshot = buildSnapshot({
    season,
    generatedAt,
    items: campItems,
    inputDir: campInputDir,
    feedHealth: normalizedFeedHealth,
  });
  campSnapshot.meta.normalization = {
    schema: 'team_evidence_normalization_v1',
    normalized_at: generatedAt,
    source_path: path.relative(ROOT, trainingCampPath),
    source_generated_at: priorCampNormalization?.source_generated_at || campInput.meta?.generated_at || null,
    input_item_count: priorCampNormalization?.input_item_count ?? (campInput.items || []).length,
    input_snapshot_item_count: (campInput.items || []).length,
    output_item_count: campSnapshot.items.length,
    removed_duplicate_rows: (priorCampNormalization?.input_item_count ?? (campInput.items || []).length) - campSnapshot.items.length,
    network_fetches: false,
    model_calls: false,
    supabase_writes: false,
  };

  const priorAvailabilityNormalization = availabilityInput.meta?.normalization || null;
  const availabilitySnapshot = buildAvailabilitySnapshotFromEvents({
    season,
    generatedAt,
    events: availabilityInput.events || [],
    sourceHealth: availabilityInput.meta?.source_health || [],
    normalization: {
      schema: 'team_evidence_normalization_v1',
      normalized_at: generatedAt,
      source_path: path.relative(ROOT, availabilityPath),
      source_generated_at: priorAvailabilityNormalization?.source_generated_at || availabilityInput.meta?.generated_at || null,
      input_event_count: priorAvailabilityNormalization?.input_event_count ?? (availabilityInput.events || []).length,
      input_snapshot_event_count: (availabilityInput.events || []).length,
      network_fetches: false,
      model_calls: false,
      supabase_writes: false,
    },
  });
  availabilitySnapshot.meta.normalization.output_event_count = availabilitySnapshot.events.length;
  availabilitySnapshot.meta.normalization.removed_duplicate_rows = availabilitySnapshot.meta.normalization.input_event_count - availabilitySnapshot.events.length;
  const campDerivedAvailabilityEvents = availabilitySnapshot.events.filter((event) => event.source_type !== 'structured_injury').length;
  availabilitySnapshot.meta.source_health = (availabilitySnapshot.meta.source_health || []).map((source) => (
    source.source === 'Training camp snapshot'
      ? {
        source: source.source,
        status: 'review',
        evidence: `${campDerivedAvailabilityEvents} normalized camp-derived availability event(s) retained; upstream camp now has ${campSnapshot.meta.item_count} unique evidence item(s).`,
        reason: 'Team identity/deduplication is complete; V01 availability contradiction review and full re-extraction remain pending.',
      }
      : source
  ));

  const validations = {
    training_camp: campSnapshot.meta.team_identity_validation,
    player_availability: availabilitySnapshot.meta.team_identity_validation,
  };
  const blocked = Object.values(validations).some((validation) => validation.status !== 'pass');

  if (options.write) {
    if (blocked) throw new Error('Refusing to write: team-identity validation is blocked.');
    const trainingCampOutputs = await writeSnapshotAndReports(
      campSnapshot,
      path.dirname(trainingCampPath),
      path.join(ROOT, '.nfl', 'training-camp'),
      date,
    );
    const availabilityOutputs = await writeAvailabilitySnapshotAndReports(availabilitySnapshot, { date });
    return {
      campSnapshot,
      availabilitySnapshot,
      validations,
      outputs: { training_camp: trainingCampOutputs, player_availability: availabilityOutputs },
    };
  }

  return { campSnapshot, availabilitySnapshot, validations, outputs: null };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await normalizeTeamEvidenceArtifacts({
    season: Number(args.season || 2026),
    date: args.date || null,
    generatedAt: args['generated-at'] || null,
    trainingCamp: args['training-camp'] || null,
    availability: args.availability || null,
    write: args.write === true,
  });

  const camp = result.campSnapshot.meta;
  const availability = result.availabilitySnapshot.meta;
  console.log(`Training camp: ${camp.normalization.input_item_count} -> ${camp.item_count} rows; identity=${camp.team_identity_validation.status}.`);
  console.log(`Player availability: ${availability.normalization.input_event_count} -> ${availability.event_count} rows; identity=${availability.team_identity_validation.status}.`);
  console.log(result.outputs
    ? 'Normalized artifacts written locally. No network, model, Supabase, recommendation, or portfolio action was performed.'
    : 'Dry run only. Pass --write to replace the dated/latest local artifacts after validation.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.stack || err.message);
    process.exitCode = 1;
  });
}
