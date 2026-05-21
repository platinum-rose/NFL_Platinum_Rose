// agents/injury-ingest.js
// ═══════════════════════════════════════════════════════════════════════════════
// F-19: Player Injury Ingest Agent
//
// Polls the ESPN NFL injuries API and upserts records into player_injuries.
// Captures:
//   - All injury-flagged players (Out, Doubtful, Questionable, Probable, IR, PUP)
//   - Active players that have a shortComment (practice reports, OTA news)
//   - Skips Active players with no comment (no news value)
//
// Usage:
//   node agents/injury-ingest.js [--dry-run]
//
// Env vars:
//   SUPABASE_URL              (required)
//   SUPABASE_SERVICE_ROLE_KEY (required)
//   DRY_RUN                   'true' to skip writes (default: false)
//   INJURY_STATUS_FILTER      comma-separated statuses to capture (blank = all
//                             non-trivial). e.g. 'Out,Doubtful,Questionable'
// ═══════════════════════════════════════════════════════════════════════════════

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __filename   = fileURLToPath(import.meta.url);
const __dirname    = path.dirname(__filename);
const ROOT         = path.resolve(__dirname, '..');
const RECEIPTS_DIR = path.join(ROOT, '.nfl', 'receipts');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN      = process.argv.includes('--dry-run') ||
                     process.env.DRY_RUN === 'true';

// Optional status filter — omit to capture all non-trivial records.
const STATUS_FILTER = process.env.INJURY_STATUS_FILTER
  ? new Set(process.env.INJURY_STATUS_FILTER.split(',').map(s => s.trim()))
  : null;

const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries';
const UA       = 'NFL-Platinum-Rose-InjuryIngest/1.0';
const UPSERT_BATCH = 100;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract ESPN player ID from the athlete links array (playercard href). */
function extractPlayerId(athlete) {
  const link = (athlete?.links ?? []).find(l =>
    Array.isArray(l.rel)
      ? l.rel.includes('playercard')
      : String(l.rel).includes('playercard')
  );
  if (!link?.href) return null;
  const m = link.href.match(/\/id\/(\d+)\//);
  return m ? m[1] : null;
}

/**
 * Parse body-part hint from a shortComment parenthetical.
 * "Nolen (knee) did not participate…" → "knee"
 * Matches 2–30 char contents to avoid matching team abbreviations like "(ARI)".
 */
function parseInjuryType(shortComment) {
  if (!shortComment) return null;
  const m = shortComment.match(/\(([a-z][^)]{1,29})\)/i);
  return m ? m[1].toLowerCase() : null;
}

// ─── Fetch + parse ────────────────────────────────────────────────────────────

async function fetchInjuries() {
  const res = await fetch(ESPN_URL, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`ESPN injuries API returned ${res.status}`);
  const data = await res.json();
  return data.injuries ?? [];
}

function flattenRecords(teamGroups) {
  const records = [];

  for (const group of teamGroups) {
    for (const inj of group.injuries ?? []) {
      const status       = inj.status ?? 'Unknown';
      const shortComment = inj.shortComment || null;

      // Skip Active players with no update — no actionable content.
      if (status === 'Active' && !shortComment) continue;

      // Apply optional status filter.
      if (STATUS_FILTER && !STATUS_FILTER.has(status)) continue;

      records.push({
        espn_injury_id: inj.id,
        espn_player_id: extractPlayerId(inj.athlete),
        player_name:    inj.athlete?.displayName ?? 'Unknown',
        team_abbr:      inj.athlete?.team?.abbreviation ?? '',
        position:       inj.athlete?.position?.abbreviation ?? null,
        injury_status:  status,
        injury_type:    parseInjuryType(shortComment),
        short_comment:  shortComment,
        long_comment:   inj.longComment || null,
        reported_at:    inj.date ? new Date(inj.date).toISOString() : null,
      });
    }
  }

  return records;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\ninjury-ingest');
  if (DRY_RUN) console.log('  [DRY RUN] — no writes');

  const teamGroups = await fetchInjuries();
  console.log(`  ESPN returned ${teamGroups.length} team groups`);

  const records = flattenRecords(teamGroups);
  const byStatus = records.reduce((acc, r) => {
    acc[r.injury_status] = (acc[r.injury_status] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`  Parsed ${records.length} records:`, byStatus);

  if (DRY_RUN) {
    const flagged = records.filter(r => r.injury_status !== 'Active');
    console.log('\n  Sample injury-flagged players:');
    flagged.slice(0, 8).forEach(r => {
      const type = r.injury_type ? ` (${r.injury_type})` : '';
      const snip = r.short_comment
        ? ` — ${r.short_comment.slice(0, 70)}`
        : '';
      console.log(
        `    [${r.injury_status}] ${r.player_name} ` +
        `${r.team_abbr}/${r.position ?? '?'}${type}${snip}`
      );
    });
    console.log(`\n  Would upsert ${records.length} rows → player_injuries`);
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  let upserted = 0;
  let errors   = 0;

  for (let i = 0; i < records.length; i += UPSERT_BATCH) {
    const batch = records.slice(i, i + UPSERT_BATCH);
    const { error } = await supabase
      .from('player_injuries')
      .upsert(batch, { onConflict: 'espn_injury_id', ignoreDuplicates: false });
    if (error) {
      console.error(
        `  [BATCH ERROR] rows ${i}–${i + batch.length}: ${error.message}`
      );
      errors += batch.length;
    } else {
      upserted += batch.length;
    }
  }

  console.log(`\n  [OK] ${upserted} upserted, ${errors} errors`);

  // Write receipt
  await mkdir(RECEIPTS_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const receipt = {
    agent:       'injury-ingest',
    ran_at:      new Date().toISOString(),
    dry_run:     DRY_RUN,
    team_groups: teamGroups.length,
    total:       records.length,
    upserted,
    errors,
    by_status:   byStatus,
  };
  await writeFile(
    path.join(RECEIPTS_DIR, `injury-ingest-${ts}.json`),
    JSON.stringify(receipt, null, 2),
    'utf8'
  );

  if (errors > 0) process.exit(1);
}

run().catch(err => {
  console.error('[injury-ingest] Fatal:', err.message);
  process.exit(1);
});
