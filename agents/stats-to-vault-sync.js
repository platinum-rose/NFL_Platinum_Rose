// agents/stats-to-vault-sync.js
// ═══════════════════════════════════════════════════════════════════════════════
// F-16: Stats-to-Vault Sync Agent
//
// Bridges nfl_team_season_stats → vault_notes so the BETTING agent can access
// historical EPA, formation tendencies, and ATS records during matchup analysis.
//
// Writes:
//   NFL/Teams/<ABBR>.md             — updates "## Season Stats" section per team
//   NFL/Reference/TeamStats-<Y>.md  — league-wide rankings per season
//
// Usage:
//   node agents/stats-to-vault-sync.js [--dry-run] [--seasons 2023,2024,2025]
//                                      [--team <ABBR>]
//
// Schedule:  Run before season start + after weekly seed-historical-stats runs
//
// Env vars:
//   SUPABASE_URL              (required)
//   SUPABASE_SERVICE_ROLE_KEY (required)
//   STATS_SEASONS             CSV override, default: last 3 completed seasons
// ═══════════════════════════════════════════════════════════════════════════════

import { mkdir, writeFile } from 'node:fs/promises';
import path                 from 'node:path';
import { createHash }       from 'node:crypto';
import { fileURLToPath }    from 'node:url';

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { ensureVaultFrontmatter } from './lib/vaultFrontmatter.js';

const __filename   = fileURLToPath(import.meta.url);
const __dirname    = path.dirname(__filename);
const ROOT         = path.resolve(__dirname, '..');
const RECEIPTS_DIR = path.join(ROOT, '.nfl', 'receipts');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN      = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';

// Default: the 3 most recent completed seasons.
// NFL regular season ends in January, so in calendar year Y the most recent
// complete season is Y-1.  e.g. in 2026 → seasons 2023, 2024, 2025.
const CURRENT_YEAR     = new Date().getFullYear();
const DEFAULT_SEASONS  = [CURRENT_YEAR - 3, CURRENT_YEAR - 2, CURRENT_YEAR - 1];

const seasonsArg = process.argv.indexOf('--seasons');
const SEASONS    = seasonsArg !== -1
  ? process.argv[seasonsArg + 1].split(',').map(Number).filter(Boolean)
  : (process.env.STATS_SEASONS
      ? process.env.STATS_SEASONS.split(',').map(Number)
      : DEFAULT_SEASONS);

const teamArg   = process.argv.indexOf('--team');
const ONLY_TEAM = teamArg !== -1 ? process.argv[teamArg + 1].toUpperCase() : null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
}

function nowDate() {
  return new Date().toISOString().slice(0, 10);
}

function sha256(v) {
  return createHash('sha256').update(String(v)).digest('hex').slice(0, 8);
}

/** Format a numeric value to `decimals` decimal places, or '—' if null/NaN. */
function fmt(v, decimals = 3) {
  if (v == null || isNaN(Number(v))) return '—';
  return Number(v).toFixed(decimals);
}

/** Format a 0-1 rate as a percentage string, or '—'. */
function pct(v) {
  if (v == null || isNaN(Number(v))) return '—';
  return (Number(v) * 100).toFixed(1) + '%';
}

/** Format a numeric rank as '#N', or '—'. */
function rank(n) {
  if (n == null) return '—';
  return `#${n}`;
}

// ─── Vault note section splicing ─────────────────────────────────────────────

const STATS_SECTION_HEADER = '## Season Stats';
const STATS_SECTION_FENCE  = '<!-- stats-auto-end -->';

/**
 * Splice the auto-generated "## Season Stats" section into an existing note.
 * Everything above STATS_SECTION_HEADER is preserved verbatim.
 * If the header is absent the section is appended.
 */
function spliceStatsSection(existingContent, newSection) {
  const headerIdx = existingContent.indexOf(`\n${STATS_SECTION_HEADER}`);
  if (headerIdx === -1) {
    return existingContent.trimEnd() + '\n\n' + newSection + '\n';
  }
  return existingContent.slice(0, headerIdx) + '\n' + newSection + '\n';
}

// ─── Markdown builders ────────────────────────────────────────────────────────

/**
 * Build the "## Season Stats" section for one team's vault note.
 * `rows` must already be sorted newest-first.
 */
function buildTeamStatsSection(abbr, rows) {
  const lines = [
    STATS_SECTION_HEADER,
    '',
    `_Auto-updated: ${nowDate()} — source: nflverse PBP_`,
    '',
  ];

  for (const r of rows) {
    const rec = `${r.wins ?? '?'}-${r.losses ?? '?'}${r.ties ? `-${r.ties}` : ''}`;
    const ats = r.ats_wins != null
      ? `${r.ats_wins}-${r.ats_losses}-${r.ats_pushes ?? 0}`
      : '—';

    lines.push(`### ${r.season} Season`);
    lines.push('');
    lines.push('| Metric | Value | Rank |');
    lines.push('|--------|-------|------|');
    lines.push(`| Record | ${rec} | — |`);
    lines.push(`| Off EPA/Play | ${fmt(r.off_epa_per_play)} | ${rank(r.off_epa_rank)} |`);
    lines.push(`| Def EPA/Play | ${fmt(r.def_epa_per_play)} | ${rank(r.def_epa_rank)} |`);
    if (r.shotgun_rate   != null) lines.push(`| Shotgun Rate   | ${pct(r.shotgun_rate)} | — |`);
    if (r.no_huddle_rate != null) lines.push(`| No-Huddle Rate | ${pct(r.no_huddle_rate)} | — |`);
    if (r.pass_rate      != null) lines.push(`| Pass Rate      | ${pct(r.pass_rate)} | — |`);
    lines.push(`| ATS Record | ${ats} | — |`);
    if (r.home_ats_record) lines.push(`| Home ATS | ${r.home_ats_record} | — |`);
    if (r.away_ats_record) lines.push(`| Away ATS | ${r.away_ats_record} | — |`);
    lines.push('');
  }

  lines.push(STATS_SECTION_FENCE);
  return lines.join('\n');
}

/**
 * Build NFL/Reference/TeamStats-{season}.md — league-wide ranking tables.
 */
function buildLeagueStatsNote(season, rows) {
  const offSorted = [...rows].sort(
    (a, b) => (b.off_epa_per_play ?? -99) - (a.off_epa_per_play ?? -99),
  );
  const defSorted = [...rows].sort(
    (a, b) => (a.def_epa_per_play ?? 99) - (b.def_epa_per_play ?? 99),
  );
  const atsSorted = [...rows].sort(
    (a, b) => (b.ats_wins ?? 0) - (a.ats_wins ?? 0),
  );
  const hasTendencies = rows.some(r => r.shotgun_rate != null);

  const lines = [
    `# ${season} NFL Team Stats`,
    '',
    `_Auto-generated: ${nowDate()} — source: nflverse PBP_`,
    '',
    '## Offensive EPA Rankings',
    '',
    '| Rank | Team | Off EPA/Play | W-L | Off Rank |',
    '|------|------|-------------|-----|----------|',
  ];

  offSorted.forEach((r, i) => {
    const rec = `${r.wins ?? '?'}-${r.losses ?? '?'}`;
    lines.push(
      `| ${i + 1} | ${r.team} | ${fmt(r.off_epa_per_play)} | ${rec} | ${rank(r.off_epa_rank)} |`,
    );
  });

  lines.push('');
  lines.push('## Defensive EPA Rankings');
  lines.push('');
  lines.push('| Rank | Team | Def EPA/Play | Off EPA/Play |');
  lines.push('|------|------|-------------|-------------|');

  defSorted.forEach((r, i) => {
    lines.push(
      `| ${i + 1} | ${r.team} | ${fmt(r.def_epa_per_play)} | ${fmt(r.off_epa_per_play)} |`,
    );
  });

  if (hasTendencies) {
    const tendSorted = [...rows].sort(
      (a, b) => (b.shotgun_rate ?? 0) - (a.shotgun_rate ?? 0),
    );
    lines.push('');
    lines.push('## Formation Tendencies');
    lines.push('');
    lines.push('| Team | Shotgun % | No-Huddle % | Pass % |');
    lines.push('|------|-----------|-------------|--------|');
    for (const r of tendSorted) {
      lines.push(
        `| ${r.team} | ${pct(r.shotgun_rate)} | ${pct(r.no_huddle_rate)} | ${pct(r.pass_rate)} |`,
      );
    }
  }

  lines.push('');
  lines.push('## ATS Records');
  lines.push('');
  lines.push('| Rank | Team | ATS W-L-P | Home ATS | Away ATS |');
  lines.push('|------|------|-----------|----------|----------|');

  atsSorted.forEach((r, i) => {
    const ats = r.ats_wins != null
      ? `${r.ats_wins}-${r.ats_losses}-${r.ats_pushes ?? 0}`
      : '—';
    lines.push(
      `| ${i + 1} | ${r.team} | ${ats} | ${r.home_ats_record || '—'} | ${r.away_ats_record || '—'} |`,
    );
  });

  lines.push('');
  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const supabase = getSupabase();

  console.log(`\n${DRY_RUN ? '[DRY RUN] ' : ''}stats-to-vault-sync`);
  console.log(`  Seasons : ${SEASONS.join(', ')}`);
  if (ONLY_TEAM) console.log(`  Team    : ${ONLY_TEAM}`);
  console.log('');

  // ── Fetch stats ─────────────────────────────────────────────────────────────

  const { data: rows, error: fetchErr } = await supabase
    .from('nfl_team_season_stats')
    .select('*')
    .in('season', SEASONS)
    .order('season', { ascending: false })
    .order('team',   { ascending: true });

  if (fetchErr) throw new Error(`Stats fetch: ${fetchErr.message}`);
  if (!rows || rows.length === 0) {
    console.log('  No rows found — run seed-historical-stats.py first.');
    return;
  }
  console.log(`  Fetched ${rows.length} team-season rows`);

  // ── Group by team (for per-team vault notes) ─────────────────────────────────

  const byTeam = {};
  for (const r of rows) {
    if (ONLY_TEAM && r.team !== ONLY_TEAM) continue;
    if (!byTeam[r.team]) byTeam[r.team] = [];
    byTeam[r.team].push(r); // already newest-first from ORDER BY
  }

  // ── Group by season (for league-wide reference notes) ───────────────────────

  const bySeason = {};
  for (const r of rows) {
    if (!bySeason[r.season]) bySeason[r.season] = [];
    bySeason[r.season].push(r);
  }

  const teams = Object.keys(byTeam).sort();
  let updated = 0;
  let failed  = 0;

  // ── Update NFL/Teams/<ABBR>.md ───────────────────────────────────────────────

  for (const abbr of teams) {
    const vaultPath = `NFL/Teams/${abbr}.md`;
    const teamRows  = byTeam[abbr];

    let existing = '';
    const { data: noteRow, error: noteErr } = await supabase
      .from('vault_notes')
      .select('content')
      .eq('path', vaultPath)
      .maybeSingle();

    if (noteErr) {
      console.error(`  [FAIL] ${abbr}: fetch error — ${noteErr.message}`);
      failed++;
      continue;
    }
    if (noteRow) existing = noteRow.content || '';

    const statsSection = buildTeamStatsSection(abbr, teamRows);
    const rawContent   = spliceStatsSection(existing, statsSection);
    const newContent   = ensureVaultFrontmatter(rawContent, {
      title: `${abbr} NFL Team Note`,
      sourceSystem: 'stats-to-vault-sync',
      sourceType: 'team-stats',
      tags: ['team', abbr.toLowerCase(), 'stats', 'auto-stats'],
    })
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control chars
      .replace(/[\uD800-\uDFFF]/g, '');                   // lone surrogates

    if (DRY_RUN) {
      console.log(`  [DRY RUN] ${vaultPath} — ${teamRows.length} season(s): ${teamRows.map(r => r.season).join(', ')}`);
      updated++;
      continue;
    }

    const { error: upsertErr } = await supabase
      .from('vault_notes')
      .upsert(
        {
          path:   vaultPath,
          content: newContent,
          tags:   ['team', abbr.toLowerCase(), 'stats', 'auto-stats'],
          source: 'agent',
        },
        { onConflict: 'path' },
      );

    if (upsertErr) {
      console.error(`  [FAIL] ${vaultPath}: ${upsertErr.message}`);
      failed++;
    } else {
      console.log(`  [OK] ${vaultPath} (${teamRows.map(r => r.season).join(', ')})`);
      updated++;
    }
  }

  // ── Write NFL/Reference/TeamStats-{season}.md ────────────────────────────────

  if (!ONLY_TEAM) {
    for (const season of [...SEASONS].sort((a, b) => b - a)) {
      const seasonRows = bySeason[season];
      if (!seasonRows || seasonRows.length === 0) continue;

      const refPath    = `NFL/Reference/TeamStats-${season}.md`;
      const refContent = ensureVaultFrontmatter(buildLeagueStatsNote(season, seasonRows), {
        title: `NFL Team Stats ${season}`,
        sourceSystem: 'stats-to-vault-sync',
        sourceType: 'team-stats-reference',
        tags: ['reference', 'stats', `season-${season}`, 'auto-stats'],
      });

      if (DRY_RUN) {
        console.log(`  [DRY RUN] ${refPath} — ${seasonRows.length} teams`);
        updated++;
        continue;
      }

      const { error } = await supabase
        .from('vault_notes')
        .upsert(
          {
            path:    refPath,
            content: refContent,
            tags:    ['reference', 'stats', `season-${season}`, 'auto-stats'],
            source:  'agent',
          },
          { onConflict: 'path' },
        );

      if (error) {
        console.error(`  [FAIL] ${refPath}: ${error.message}`);
        failed++;
      } else {
        console.log(`  [OK] ${refPath}`);
        updated++;
      }
    }
  }

  // ── Write receipt ──────────────────────────────────────────────────────────

  const receipt = {
    run_at:               new Date().toISOString(),
    dry_run:              DRY_RUN,
    seasons:              SEASONS,
    only_team:            ONLY_TEAM,
    rows_read:            rows.length,
    vault_notes_updated:  updated,
    failures:             failed,
  };

  await mkdir(RECEIPTS_DIR, { recursive: true });
  const rcptFile = path.join(
    RECEIPTS_DIR,
    `stats-vault-${nowDate()}-${sha256(SEASONS.join(','))}.json`,
  );
  await writeFile(rcptFile, JSON.stringify(receipt, null, 2), 'utf8');

  console.log(`\nDone. ${updated} vault notes updated, ${failed} failed.\n`);
}

main().catch(err => {
  console.error('\nFatal:', err.message);
  process.exit(1);
});
