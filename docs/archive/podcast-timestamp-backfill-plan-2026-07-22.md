# Podcast Timestamp Backfill Plan - 2026-07-22

Purpose: populate `source_timestamp` in podcast host-summary futures rows before overwriting existing vault notes or regenerating narrative summaries.

## Safety Boundary

- Do not run `agents/podcast-host-summary.js --overwrite` without explicit approval.
- Do not make live model/API calls until the target set and expected cost/blast radius are reviewed.
- Prefer a narrow target set tied to futures-report evidence before doing an all-episode overwrite.

## Backfill Sequence

1. Inventory candidate episodes.
   - Read `podcast_transcripts` rows that have NFL futures evidence and `speaker_segments` with start times.
   - Split rows into: timestamped diarized segments available, transcript text only, and no usable transcript.

2. Choose the overwrite scope.
   - Narrow option: only episodes linked from `docs/podcast-narratives/index.json` or current portfolio evidence.
   - Broad option: all host-summary rows whose underlying transcript has timestamped `speaker_segments`.

3. Dry-run the vault impact.
   - Use `agents/podcast-host-summary.js --vault-sync --dry-run` after extraction is complete to preview note rewrites.
   - Confirm that the regenerated notes include the `Time` column before rebuilding narratives.

4. Regenerate in order.
   - Re-extract approved host summaries with `source_timestamp`.
   - Vault-sync the already-extracted rows.
   - Run `npm.cmd run podcast-narratives`.
   - Re-run the portfolio corpus scenario and verify source badges upgrade from `Named Expert, No Timestamp` or `Unattributed Speaker` to `Named Expert + Timestamp` only when the source row truly has both fields.

## Acceptance Checks

- No invented timestamps: missing source line times remain blank.
- Existing host attribution is preserved unless the extractor gives a stronger diarized speaker match.
- Narrative markdown and HTML both show the `Time` column.
- Portfolio cards keep the source-quality badge visible.
- No Supabase writes or live model calls happen outside the explicitly approved backfill run.
