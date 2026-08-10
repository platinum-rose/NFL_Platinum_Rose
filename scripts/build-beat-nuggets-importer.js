#!/usr/bin/env node

/**
 * scripts/build-beat-nuggets-importer.js
 * ════════════════════════════════════════════════════════════════════════════════
 * Beat Reporter Nugget Importer & Pipeline Synthesizer
 *
 * Scans manual/copied 32BeatWriters & local beat reporter notes in `data/beat-reports/raw/`
 * and converts them into structured team-by-team intel snapshots.
 *
 * Input:  data/beat-reports/raw/*.json
 * Output: data/beat-reports/2026/latest.json & data/training-camp/2026/latest.json
 *
 * Zero API calls. Pure local data normalization.
 * ════════════════════════════════════════════════════════════════════════════════
 */

import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { getTeamAbbreviation, normalizeTeam } from '../src/lib/teams.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'data', 'beat-reports', 'raw');
const OUT_DIR = path.join(ROOT, 'data', 'beat-reports', '2026');
const OUT_FILE = path.join(OUT_DIR, 'latest.json');
const CAMP_FILE = path.join(ROOT, 'data', 'training-camp', '2026', 'latest.json');

function sha(value) {
  return createHash('sha256').update(String(value)).digest('hex').slice(0, 12);
}

async function main() {
  console.log('🏈 Running Beat Reporter Nugget Importer...');

  await mkdir(RAW_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  let files = [];
  try {
    files = await readdir(RAW_DIR);
  } catch {
    files = [];
  }

  const jsonFiles = files.filter(f => f.endsWith('.json'));
  console.log(`   Found ${jsonFiles.length} raw beat report file(s) in data/beat-reports/raw/`);

  const nuggets = [];

  for (const file of jsonFiles) {
    try {
      const content = JSON.parse(await readFile(path.join(RAW_DIR, file), 'utf8'));
      const items = Array.isArray(content) ? content : (content.nuggets || content.notes || []);

      for (const item of items) {
        const teamAbbr = getTeamAbbreviation(item.team || item.team_abbr);
        if (!teamAbbr) continue;

        nuggets.push({
          id: `beat_${sha([teamAbbr, item.player || '', item.headline || item.note].join('|'))}`,
          team: teamAbbr,
          team_nick: normalizeTeam(teamAbbr),
          player: item.player || null,
          position: item.position || null,
          category: item.category || 'beat_report',
          headline: item.headline || item.title || 'Beat Reporter Update',
          note: item.note || item.text || item.summary || '',
          source: item.source || '32BeatWriters / Beat Reporter',
          reporter: item.reporter || null,
          source_url: item.source_url || item.url || null,
          sentiment: item.sentiment || 'neutral',
          confidence: item.confidence || 0.85,
          timestamp: item.timestamp || new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn(`⚠️ Warning: Could not parse ${file}:`, err.message);
    }
  }

  // Load current training camp intel snapshot to merge beat nuggets.
  // FLAGGED (lint cleanup, 2026-08-10, not fixed): this is read but the
  // actual merge into `output` below was apparently never implemented --
  // `campSnapshot` isn't referenced again anywhere in this file. Needs
  // Andy's call on whether the merge is still wanted; left in place rather
  // than deleting a real file read that matches its own comment's stated
  // intent, or guessing at the merge logic during a lint-only pass.
  let campSnapshot = { meta: {}, teams: {} };
  try {
    // eslint-disable-next-line no-unused-vars
    campSnapshot = JSON.parse(await readFile(CAMP_FILE, 'utf8'));
  } catch {
    // intentionally empty — keep the default snapshot if the file is missing/unparseable
  }

  const output = {
    meta: {
      schema: 'beat_reports_snapshot_v1',
      season: 2026,
      generated_at: new Date().toISOString(),
      raw_file_count: jsonFiles.length,
      nugget_count: nuggets.length,
    },
    nuggets,
  };

  await writeFile(OUT_FILE, JSON.stringify(output, null, 2));

  console.log(`✅ Beat Reporter Nugget Importer completed!`);
  console.log(`   Nuggets Processed: ${nuggets.length}`);
  console.log(`   Saved Snapshot:    ${OUT_FILE}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
