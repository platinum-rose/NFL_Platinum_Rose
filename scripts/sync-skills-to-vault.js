#!/usr/bin/env node
/**
 * sync-skills-to-vault.js — Seed NFL reference skills into vault_notes
 *
 * Reads skill files from the skills/ directory and upserts their content
 * into the Supabase vault_notes table at the vault paths the BETTING agent
 * expects (NFL/Reference/*.md, NFL/Teams/<ABBR>.md).
 *
 * Run once before the season starts, and after any skill file update.
 *
 * Usage:
 *   node scripts/sync-skills-to-vault.js [--dry-run] [--only <path>]
 *
 * Options:
 *   --dry-run       Print what would be upserted without writing to Supabase
 *   --only <path>   Only sync the specified vault path (e.g. NFL/Reference/KeyNumbers.md)
 *
 * Environment:
 *   SUPABASE_URL       (required)
 *   SUPABASE_ANON_KEY  (required — anon key works if vault_notes RLS is permissive)
 *
 * Seed map (skill file → vault path):
 *   skills/nfl-coaching-tendencies/SKILL.md  →  NFL/Reference/CoachTendencies.md
 *   skills/nfl-analytical-reference/SKILL.md →  NFL/Reference/DVOA.md
 *   skills/nfl-analytical-reference/references/ats-trends.md  →  NFL/Reference/ATS_Trends.md
 *   skills/nfl-key-numbers/SKILL.md          →  NFL/Reference/KeyNumbers.md
 *   skills/nfl-team-notes/references/teams/*.md  →  NFL/Teams/<ABBR>.md (32 files)
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { ensureVaultFrontmatter } from '../agents/lib/vaultFrontmatter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// ─── Parse CLI args ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ONLY_PATH = (() => {
  const i = args.indexOf('--only');
  return i !== -1 ? args[i + 1] : null;
})();

// ─── Load env ─────────────────────────────────────────────────────────────────

// Attempt to load .env via dotenv if available; otherwise fall back to process.env.
try {
  const { config } = await import('dotenv');
  config({ path: join(ROOT, '.env') });
} catch {
  // dotenv not available — rely on process.env being pre-populated
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    '[sync-skills-to-vault] ERROR: SUPABASE_URL and SUPABASE_ANON_KEY ' +
    '(or VITE_ prefixed variants) must be set in environment or .env file.',
  );
  process.exit(1);
}

const supabase = DRY_RUN ? null : createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Seed map ─────────────────────────────────────────────────────────────────

/**
 * Static 1-to-1 skill file → vault path mappings.
 * Each entry: { src: relative-from-root, dest: vault path, tags: [] }
 */
const STATIC_ENTRIES = [
  {
    src: 'skills/nfl-coaching-tendencies/SKILL.md',
    dest: 'NFL/Reference/CoachTendencies.md',
    tags: ['reference', 'coaching'],
  },
  {
    src: 'skills/nfl-analytical-reference/SKILL.md',
    dest: 'NFL/Reference/DVOA.md',
    tags: ['reference', 'analytics'],
  },
  {
    src: 'skills/nfl-analytical-reference/references/ats-trends.md',
    dest: 'NFL/Reference/ATS_Trends.md',
    tags: ['reference', 'ats-trends'],
  },
  {
    src: 'skills/nfl-key-numbers/SKILL.md',
    dest: 'NFL/Reference/KeyNumbers.md',
    tags: ['reference', 'key-numbers'],
  },
];

/**
 * Dynamic team entries: one file per team in skills/nfl-team-notes/references/teams/
 * Each <ABBR>.md → NFL/Teams/<ABBR>.md
 */
function buildTeamEntries() {
  const teamsDir = join(ROOT, 'skills', 'nfl-team-notes', 'references', 'teams');
  if (!existsSync(teamsDir)) return [];
  return readdirSync(teamsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const abbr = basename(f, '.md');
      return {
        src: `skills/nfl-team-notes/references/teams/${f}`,
        dest: `NFL/Teams/${abbr}.md`,
        tags: ['team', abbr.toLowerCase()],
      };
    });
}

const ALL_ENTRIES = [...STATIC_ENTRIES, ...buildTeamEntries()];

// ─── Upsert helper ────────────────────────────────────────────────────────────

async function upsertNote(dest, content, tags) {
  if (DRY_RUN) return;
  const noteContent = ensureVaultFrontmatter(content, {
    title: dest.replace(/^NFL\//, '').replace(/\.md$/i, '').replace(/\//g, ' - '),
    sourceSystem: 'sync-skills-to-vault',
    sourceType: 'skill-reference',
    tags,
  });
  const { error } = await supabase
    .from('vault_notes')
    .upsert(
      { path: dest, content: noteContent, tags, source: 'manual' },
      { onConflict: 'path' },
    );
  if (error) {
    throw new Error(`Supabase upsert failed for ${dest}: ${error.message}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const mode = DRY_RUN ? '[DRY RUN] ' : '';
  console.log(`\n${mode}sync-skills-to-vault — seeding ${ALL_ENTRIES.length} vault notes\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const entry of ALL_ENTRIES) {
    // --only filter
    if (ONLY_PATH && entry.dest !== ONLY_PATH) {
      skipped++;
      continue;
    }

    const srcPath = join(ROOT, entry.src);
    if (!existsSync(srcPath)) {
      console.warn(`  [SKIP] ${entry.dest} — source not found: ${entry.src}`);
      skipped++;
      continue;
    }

    const content = readFileSync(srcPath, 'utf8');

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would upsert: ${entry.dest}`);
      console.log(`            Source: ${entry.src} (${content.length} chars)`);
      console.log(`            Tags:   [${entry.tags.join(', ')}]`);
      success++;
      continue;
    }

    try {
      await upsertNote(entry.dest, content, entry.tags);
      console.log(`  [OK] ${entry.dest}`);
      success++;
    } catch (err) {
      console.error(`  [FAIL] ${entry.dest}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. ${success} upserted, ${skipped} skipped, ${failed} failed.\n`);

  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('[sync-skills-to-vault] Fatal error:', err.message);
  process.exit(1);
});
