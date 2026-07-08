#!/usr/bin/env node
// agents/obsidian-vault-sync.js
// ═══════════════════════════════════════════════════════════════════════════════
// One-shot sync: Obsidian Local REST API → Supabase vault_notes table
//
// Run this manually (or via cron) to copy notes from your local Obsidian NFL
// vault into the shared Supabase backend. After syncing you can flip
// VITE_VAULT_BACKEND=supabase in your production hosting env and betting
// partners will see the same reference notes without needing Obsidian.
//
// Usage:
//   node agents/obsidian-vault-sync.js
//   node agents/obsidian-vault-sync.js --dry-run
//   node agents/obsidian-vault-sync.js --prefix NFL/Reference
//
// Required env vars:
//   OBSIDIAN_API_URL  (default https://localhost:27123)
//   OBSIDIAN_API_KEY  (from Obsidian > Local REST API plugin settings)
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Optional env var:
//   VAULT_SYNC_ALLOWED_TIERS  (default "green") -- comma-separated sensitivity
//     tiers permitted to export into the partner-readable vault_notes table.
//     See the sensitivity-tier guardrail note below.
//
// The Obsidian Local REST API plugin must be installed, enabled, and running.
// Plugin: https://github.com/coddingtonbear/obsidian-local-rest-api
//
// ── Sensitivity-tier guardrail (fixed 2026-07-07, Fable audit Finding 1) ──────
// vault_notes is readable via the anon key by design (betting partners see
// these notes). Before this fix, this script copied every note under the NFL/
// prefix with no check on the vault's sensitivity: frontmatter at all -- the
// fail-safe rule used everywhere else in the family vault ("missing/invalid
// sensitivity -> treat as private, never export") was not applied here.
// parseSensitivity() below applies that same fail-safe default (missing or
// unrecognised -> 'red', never exported). Only tiers listed in
// VAULT_SYNC_ALLOWED_TIERS (default: green only) are exported; everything
// else is skipped and logged (path + tier, never content) so a mis-filed or
// unlabeled note doesn't silently leak to partners. Whether yellow-tier
// (partner-visible betting IP) should ever be allowed here is a business
// decision for the operator, not something this script should assume --
// override via VAULT_SYNC_ALLOWED_TIERS=green,yellow if desired.
// ═══════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import https from 'node:https';
import path from 'node:path';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// ─── Config ───────────────────────────────────────────────────────────────────

const DRY_RUN       = process.argv.includes('--dry-run');
const RECEIPT_DIR   = path.join(process.cwd(), '.nfl', 'receipts');

const OBSIDIAN_URL  = (process.env.OBSIDIAN_API_URL  || 'https://localhost:27123').replace(/\/$/, '');
const OBSIDIAN_KEY  = process.env.OBSIDIAN_API_KEY   || '';

const NFL_PREFIX_ARG = process.argv.find(a => a.startsWith('--prefix='))?.slice(9);
const NFL_PREFIX    = NFL_PREFIX_ARG || 'NFL';

const SUPABASE_URL      = process.env.SUPABASE_URL             || '';
const SUPABASE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const CHUNK_SIZE = 50;  // upsert batch size

// ─── Sensitivity-tier guardrail (Finding 1, fixed 2026-07-07) ─────────────────

const VALID_SENSITIVITY = new Set(['red', 'orange', 'yellow', 'green']);

/** Fail-safe default: missing or unrecognised sensitivity is never exported. */
const DEFAULT_SENSITIVITY = 'red';

/**
 * Tiers this partner-readable sync is allowed to export. Conservative default
 * (green only) -- whether yellow (partner-visible betting IP) is acceptable
 * is the operator's call, made via env, not assumed by this script.
 */
const ALLOWED_EXPORT_TIERS = new Set(
  (process.env.VAULT_SYNC_ALLOWED_TIERS || 'green')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

// ─── Validation ───────────────────────────────────────────────────────────────

if (!OBSIDIAN_KEY) {
  console.error('[sync] OBSIDIAN_API_KEY not set. Set it in .env.');
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[sync] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}

// ─── Supabase client ──────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ─── Obsidian REST helpers ────────────────────────────────────────────────────

/**
 * Obsidian Local REST API uses a self-signed cert on localhost.
 * node-fetch/https must bypass cert verification for localhost only.
 */
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function obsidianFetch(endpoint, opts = {}) {
  const { default: fetch } = await import('node-fetch');
  const url = `${OBSIDIAN_URL}${endpoint}`;
  const res = await fetch(url, {
    ...opts,
    agent: httpsAgent,
    headers: {
      Authorization: `Bearer ${OBSIDIAN_KEY}`,
      Accept: 'application/json',
      ...(opts.headers || {}),
    },
  });
  return res;
}

/**
 * List all .md files under a vault folder, recursing into subfolders.
 *
 * Fixed 2026-07 (found while live-testing the Finding 1 fix): the real NFL/
 * folder has no .md files directly at its own root -- everything lives one
 * level deeper under NFL/Futures/, NFL/Reference/, NFL/Teams/. The original
 * implementation only inspected the immediate folder listing, filtered out
 * every entry ending in "/" (i.e. every subfolder), and silently returned
 * zero notes -- this had apparently never been exercised against the real
 * nested vault structure before. Depth-capped as a defensive guard against a
 * pathological/cyclic vault structure, not because deep nesting is expected.
 *
 * @param {string} prefix - e.g. "NFL" or "NFL/Reference"
 * @param {number} depth - internal recursion guard, do not pass explicitly
 * @returns {Promise<string[]>}
 */
async function listNotes(prefix, depth = 0) {
  if (depth > 8) {
    console.warn(`[sync] listNotes: max recursion depth exceeded at "${prefix}", stopping`);
    return [];
  }

  const res = await obsidianFetch(`/vault/${encodeURIComponent(prefix)}/`);
  if (res.status === 404) {
    console.warn(`[sync] Folder not found in Obsidian vault: ${prefix}`);
    return [];
  }
  if (!res.ok) {
    console.error(`[sync] Obsidian list error ${res.status} for "${prefix}"`);
    return [];
  }
  const data = await res.json();
  const entries = data.files || [];

  const notes = [];
  for (const entry of entries) {
    const fullPath = `${prefix}/${entry}`;
    if (entry.endsWith('/')) {
      // Subfolder -- recurse (strip the trailing slash for the next prefix)
      notes.push(...(await listNotes(fullPath.slice(0, -1), depth + 1)));
    } else if (entry.endsWith('.md')) {
      notes.push(fullPath);
    }
  }
  return notes;
}

/**
 * Fetch the markdown content of a single note.
 * @param {string} notePath - vault-relative path
 * @returns {Promise<string|null>}
 */
async function fetchNote(notePath) {
  const res = await obsidianFetch(`/vault/${encodeURIComponent(notePath)}`, {
    headers: { Accept: 'text/markdown' },
  });
  if (!res.ok) {
    console.warn(`[sync] Could not fetch note ${notePath}: HTTP ${res.status}`);
    return null;
  }
  return res.text();
}

/**
 * Parse the `sensitivity:` key out of a note's YAML frontmatter.
 * Fail-safe (same rule as the rest of the family vault, G5): missing or
 * unrecognised sensitivity defaults to 'red' -- never exported.
 * @param {string} content - Raw note content, including frontmatter if present
 * @returns {string} one of 'red' | 'orange' | 'yellow' | 'green'
 */
function parseSensitivity(content) {
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!fmMatch) return DEFAULT_SENSITIVITY;

  const fm = fmMatch[1];
  const match = fm.match(/^sensitivity\s*:\s*(.+)$/m);
  const raw = match?.[1]?.trim().toLowerCase() ?? '';
  return VALID_SENSITIVITY.has(raw) ? raw : DEFAULT_SENSITIVITY;
}

/**
 * Strip the leading YAML frontmatter block (if any) before the note content
 * is embedded/stored. The frontmatter (e.g. `sensitivity: green`) is metadata
 * for the sync guardrail, not part of the note's substance -- leaving it in
 * `content` just adds noise ahead of the actual text for anything that reads
 * or embeds this field downstream.
 * @param {string} content - Raw note content, including frontmatter if present
 * @returns {string} content with any leading frontmatter block removed
 */
function stripFrontmatter(content) {
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

/**
 * Derive tags from the note path.
 * "NFL/Reference/CoachTendencies.md" → ["reference", "coaching-tendencies"]
 * "NFL/Sessions/2026-09-07.md"       → ["session", "2026-09-07"]
 * @param {string} notePath
 * @returns {string[]}
 */
function tagsFromPath(notePath) {
  const parts = notePath.split('/');
  const tags = ['obsidian_sync'];
  // second segment is the folder category (Reference, Sessions, Teams, etc.)
  if (parts.length >= 2) {
    tags.push(parts[1].toLowerCase().replace(/\s+/g, '-'));
  }
  // filename without extension as a tag
  const basename = parts[parts.length - 1].replace('.md', '').toLowerCase().replace(/\s+/g, '-');
  if (basename && !tags.includes(basename)) tags.push(basename);
  return tags;
}

// ─── Supabase upsert helpers ──────────────────────────────────────────────────

async function upsertBatch(rows) {
  const { error } = await supabase
    .from('vault_notes')
    .upsert(rows, { onConflict: 'path' });
  if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
}

// ─── Receipt writer ───────────────────────────────────────────────────────────

function writeReceipt(stats) {
  try {
    fs.mkdirSync(RECEIPT_DIR, { recursive: true });
    const date = new Date().toISOString().slice(0, 10);
    const ts   = Date.now();
    const file = path.join(RECEIPT_DIR, `obsidian-vault-sync-${date}-${ts}.json`);
    fs.writeFileSync(file, JSON.stringify({ ...stats, created_at: new Date().toISOString() }, null, 2));
    console.log(`[sync] Receipt written → ${file}`);
  } catch (e) {
    console.warn('[sync] Could not write receipt:', e.message);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[sync] Starting Obsidian → Supabase vault sync`);
  console.log(`[sync] Vault prefix: ${NFL_PREFIX}`);
  console.log(`[sync] Obsidian URL: ${OBSIDIAN_URL}`);
  console.log(`[sync] Dry run: ${DRY_RUN}`);

  const startMs = Date.now();

  // 1. List all notes under NFL_PREFIX
  const notePaths = await listNotes(NFL_PREFIX);
  console.log(`[sync] Found ${notePaths.length} notes in Obsidian under "${NFL_PREFIX}"`);

  if (notePaths.length === 0) {
    console.log('[sync] Nothing to sync. Exiting.');
    return;
  }

  console.log(`[sync] Allowed export tiers: ${[...ALLOWED_EXPORT_TIERS].join(', ') || '(none configured!)'}`);

  // 2. Fetch content for each note (sequential to avoid hammering localhost)
  const rows = [];
  const skippedForSensitivity = [];
  let fetchErrors = 0;

  for (const notePath of notePaths) {
    process.stdout.write(`  Fetching ${notePath} ... `);
    const content = await fetchNote(notePath);
    if (content === null) {
      console.log('SKIP (fetch error)');
      fetchErrors++;
      continue;
    }

    // Finding 1 guardrail: skip (and log) any note not in an explicitly
    // allowed tier, fail-safe default 'red' for missing/invalid frontmatter.
    const sensitivity = parseSensitivity(content);
    if (!ALLOWED_EXPORT_TIERS.has(sensitivity)) {
      console.log(`SKIP (sensitivity=${sensitivity}, not in allowed export tiers)`);
      skippedForSensitivity.push({ path: notePath, sensitivity });
      continue;
    }

    rows.push({
      path:    notePath,
      content: stripFrontmatter(content).trim(),
      tags:    tagsFromPath(notePath),
      source:  'obsidian_sync',
    });
    console.log(`OK (${content.length} chars, sensitivity=${sensitivity})`);

    // Polite delay — don't thrash the local plugin
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n[sync] Fetched ${rows.length}/${notePaths.length} notes (${fetchErrors} fetch errors, ${skippedForSensitivity.length} skipped by sensitivity tier)`);
  if (skippedForSensitivity.length > 0) {
    console.log('[sync] Skipped notes (path + tier only, no content logged):');
    for (const s of skippedForSensitivity) console.log(`    - ${s.path} (${s.sensitivity})`);
  }

  if (DRY_RUN) {
    console.log('[sync] DRY RUN — skipping Supabase upserts. Sample row:');
    if (rows[0]) console.log(JSON.stringify({ ...rows[0], content: rows[0].content.slice(0, 200) + '...' }, null, 2));
    writeReceipt({
      mode: 'dry_run',
      prefix: NFL_PREFIX,
      found: notePaths.length,
      fetched: rows.length,
      errors: fetchErrors,
      skipped_sensitivity: skippedForSensitivity,
    });
    return;
  }

  // 3. Upsert in chunks
  let upserted = 0;
  let upsertErrors = 0;

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    try {
      await upsertBatch(chunk);
      upserted += chunk.length;
      console.log(`[sync] Upserted chunk ${Math.floor(i / CHUNK_SIZE) + 1} (${upserted}/${rows.length})`);
    } catch (e) {
      console.error(`[sync] Chunk upsert failed:`, e.message);
      upsertErrors += chunk.length;
    }
  }

  const elapsedMs = Date.now() - startMs;
  const stats = {
    mode:         'live',
    prefix:       NFL_PREFIX,
    found:        notePaths.length,
    fetched:      rows.length,
    fetch_errors: fetchErrors,
    skipped_sensitivity: skippedForSensitivity,
    allowed_tiers: [...ALLOWED_EXPORT_TIERS],
    upserted,
    upsert_errors: upsertErrors,
    elapsed_ms:   elapsedMs,
  };

  console.log('\n[sync] ─────── Summary ───────');
  console.log(`  Notes found:    ${stats.found}`);
  console.log(`  Notes fetched:  ${stats.fetched}`);
  console.log(`  Skipped (tier): ${stats.skipped_sensitivity.length}`);
  console.log(`  Upserted:       ${stats.upserted}`);
  console.log(`  Errors:         ${stats.fetch_errors + stats.upsert_errors}`);
  console.log(`  Elapsed:        ${elapsedMs}ms`);
  console.log('');

  writeReceipt(stats);

  if (upsertErrors > 0) {
    console.error(`[sync] Completed with ${upsertErrors} upsert errors.`);
    process.exit(1);
  }

  console.log('[sync] Done. Flip VITE_VAULT_BACKEND=supabase in your hosting env to use the synced notes.');
}

main().catch(err => {
  console.error('[sync] Fatal:', err.message);
  process.exit(1);
});
