#!/usr/bin/env node
// scripts/export-vault-to-md.js
// ═══════════════════════════════════════════════════════════════════════════════
// One-shot export: Supabase vault_notes → local Obsidian vault filesystem
//
// Run this on M6 (where the Obsidian vault lives) to pull all agent-generated
// notes from Supabase and write them as .md files into your local vault.
// Obsidian picks up the files automatically — no plugin or API required.
//
// Typical setup on M6:
//   1. Set env vars in .env (copy from .env.example)
//   2. Add a crontab entry to run after GHA agents complete, e.g.:
//      30 8 * * 1,3,5 cd ~/projects/NFL_Dashboard && node scripts/export-vault-to-md.js
//
// Usage:
//   node scripts/export-vault-to-md.js
//   node scripts/export-vault-to-md.js --dry-run
//   node scripts/export-vault-to-md.js --prefix NFL/Teams
//   node scripts/export-vault-to-md.js --source agent
//
// Required env vars:
//   VAULT_DIR               — absolute path to your local Obsidian vault root
//                             e.g. /home/andrewlrose/ObsidianVault
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Optional env vars:
//   EXPORT_PREFIX           — only export notes whose path starts with this
//                             (overridden by --prefix flag)
//   EXPORT_SOURCE           — only export notes with this source value
//                             (overridden by --source flag)
// ═══════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import path from 'node:path';
import { mkdir, writeFile, access, rename, rm } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { ensureVaultFrontmatter } from '../agents/lib/vaultFrontmatter.js';

// ─── Config ───────────────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes('--dry-run');

const PREFIX_ARG = process.argv.find(a => a.startsWith('--prefix='))?.slice(9)
  ?? (process.argv.includes('--prefix')
    ? process.argv[process.argv.indexOf('--prefix') + 1]
    : null);
const PREFIX = PREFIX_ARG ?? process.env.EXPORT_PREFIX ?? null;

const SOURCE_ARG = process.argv.find(a => a.startsWith('--source='))?.slice(9)
  ?? (process.argv.includes('--source')
    ? process.argv[process.argv.indexOf('--source') + 1]
    : null);
const SOURCE_FILTER = SOURCE_ARG ?? process.env.EXPORT_SOURCE ?? null;

const VAULT_DIR   = (process.env.VAULT_DIR || '').replace(/\/$/, '');
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const PAGE_SIZE   = 200;
const RECEIPT_DIR = path.join(process.cwd(), '.nfl', 'receipts');

// ─── Validation ───────────────────────────────────────────────────────────────

if (!VAULT_DIR) {
  console.error('[export] VAULT_DIR is not set. Point it at your Obsidian vault root.');
  console.error('         e.g. export VAULT_DIR=/home/andrewlrose/ObsidianVault');
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[export] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}

// Verify VAULT_DIR exists so we don't silently create a wrong directory
try {
  await access(VAULT_DIR);
} catch {
  console.error(`[export] VAULT_DIR does not exist: ${VAULT_DIR}`);
  console.error('         Create it first or check the path.');
  process.exit(1);
}

// ─── Supabase client ──────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowIso() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

/**
 * Fetch all vault_notes rows from Supabase using cursor pagination.
 * @returns {Promise<Array<{path: string, content: string, source: string}>>}
 */
async function fetchAllNotes() {
  const rows = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from('vault_notes')
      .select('path, content, source, updated_at')
      .order('path', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (PREFIX) {
      // PostgREST ilike for prefix match
      query = query.ilike('path', `${PREFIX}%`);
    }
    if (SOURCE_FILTER) {
      query = query.eq('source', SOURCE_FILTER);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Supabase fetch failed (range ${from}–${from + PAGE_SIZE - 1}): ${error.message}`);
    }
    if (!data || data.length === 0) break;

    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

/**
 * Write a single note to the vault filesystem.
 * Creates parent directories as needed.
 * @param {string} notePath  - vault-relative path, e.g. "NFL/Teams/KC.md"
 * @param {string} content   - markdown content
 * @returns {Promise<'written'|'skipped'>}
 */
async function writeNote(notePath, content) {
  // Ensure .md extension
  const filePath = notePath.endsWith('.md') ? notePath : `${notePath}.md`;
  const absPath  = path.resolve(VAULT_DIR, filePath);
  const vaultRoot = path.resolve(VAULT_DIR);
  if (absPath !== vaultRoot && !absPath.startsWith(vaultRoot + path.sep)) {
    throw new Error(`path traversal blocked: ${notePath}`);
  }
  const dir      = path.dirname(absPath);

  if (DRY_RUN) return 'skipped';

  await mkdir(dir, { recursive: true });
  const noteContent = ensureVaultFrontmatter(content ?? '', {
    title: filePath.replace(/^NFL\//, '').replace(/\.md$/i, '').replace(/\//g, ' - '),
    sourceSystem: 'nfl-vault-export',
    sourceType: 'exported-vault-note',
    tags: ['nfl-dashboard-export'],
  });
  const tmpPath = `${absPath}.tmp.${process.pid}.${Date.now()}`;
  try {
    await writeFile(tmpPath, noteContent, 'utf8');
    await rename(tmpPath, absPath);
  } catch (err) {
    await rm(tmpPath, { force: true }).catch(() => {});
    throw err;
  }
  return 'written';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log(`\n[export] Supabase vault_notes → ${VAULT_DIR}`);
if (PREFIX)        console.log(`         prefix filter : ${PREFIX}`);
if (SOURCE_FILTER) console.log(`         source filter : ${SOURCE_FILTER}`);
if (DRY_RUN)       console.log(`         DRY RUN — no files will be written\n`);

let written = 0;
let failed  = 0;

const notes = await fetchAllNotes();
console.log(`[export] ${notes.length} notes fetched from Supabase\n`);

for (const note of notes) {
  try {
    const result = await writeNote(note.path, note.content);
    if (result === 'written') {
      console.log(`  [OK]      ${note.path}`);
    } else {
      console.log(`  [DRY RUN] ${note.path}`);
    }
    written++;
  } catch (err) {
    console.error(`  [FAIL]    ${note.path} — ${err.message}`);
    failed++;
  }
}

// ─── Receipt ──────────────────────────────────────────────────────────────────

const receipt = {
  run_at: new Date().toISOString(),
  dry_run: DRY_RUN,
  vault_dir: VAULT_DIR,
  prefix_filter: PREFIX ?? null,
  source_filter: SOURCE_FILTER ?? null,
  notes_fetched: notes.length,
  notes_written: written,
  failures: failed,
};

if (!DRY_RUN) {
  await mkdir(RECEIPT_DIR, { recursive: true });
  const rcptFile = path.join(RECEIPT_DIR, `vault-export-${nowIso()}.json`);
  await writeFile(rcptFile, JSON.stringify(receipt, null, 2), 'utf8');
  console.log(`\n[export] Receipt → ${rcptFile}`);
}

console.log(`\nDone. ${written} written, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
