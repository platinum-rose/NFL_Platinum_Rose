#!/usr/bin/env node
// One-off backfill: add `sensitivity: green` frontmatter to NFL vault notes
// that were auto-generated without any sensitivity tag (Fable audit follow-up,
// 2026-07-08). NFL team/stat notes are public sports data, not family-sensitive
// content, but the vault-sync guardrail (Finding 1 fix) fails-safe to `red` for
// any note missing a valid `sensitivity:` key, which currently blocks all 255
// NFL notes from export.
//
// Per E:\data\Obsidian\CLAUDE.md writer rules:
//   - Atomic writes only (temp file + rename), never partial/in-place.
//   - Never bulk-write through a Linux<->NTFS bridge without hash verification.
//     This script is written to be run NATIVELY on Windows (not from the
//     Cowork sandbox), and hash-verifies every file it touches.
//
// Usage:
//   node scripts/tag-nfl-sensitivity.js "E:\data\Obsidian\NFL" --dry-run
//   node scripts/tag-nfl-sensitivity.js "E:\data\Obsidian\NFL"
//
// Idempotent: files that already have a `sensitivity:` key (any value) are
// left untouched and reported as "already tagged".

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const root = args.find(a => !a.startsWith('--'));

if (!root) {
  console.error('Usage: node scripts/tag-nfl-sensitivity.js <vault-folder> [--dry-run]');
  process.exit(1);
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const SENSITIVITY_KEY_RE = /^sensitivity:\s*\S+/m;

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

async function atomicWrite(filePath, content) {
  const tmpPath = `${filePath}.tmp.${process.pid}.${Date.now()}`;
  try {
    await fs.writeFile(tmpPath, content, 'utf8');
    await fs.rename(tmpPath, filePath);
  } catch (err) {
    try { await fs.unlink(tmpPath); } catch (_) { /* best-effort */ }
    throw err;
  }
}

function addSensitivityGreen(original) {
  const match = original.match(FRONTMATTER_RE);
  if (match) {
    const body = match[1];
    if (SENSITIVITY_KEY_RE.test(body)) {
      return null; // already tagged, no change
    }
    const newFrontmatter = `---\n${body}\nsensitivity: green\n---\n`;
    return original.slice(0, match[0].length).replace(match[0], newFrontmatter) +
           original.slice(match[0].length);
  }
  // No frontmatter block at all — prepend one.
  return `---\nsensitivity: green\n---\n\n${original}`;
}

async function main() {
  const files = await walk(root);
  const results = { tagged: [], already: [], errors: [] };

  for (const filePath of files) {
    try {
      const before = await fs.readFile(filePath, 'utf8');
      const beforeHash = sha256(Buffer.from(before, 'utf8'));
      const updated = addSensitivityGreen(before);

      if (updated === null) {
        results.already.push(path.relative(root, filePath));
        continue;
      }

      if (DRY_RUN) {
        results.tagged.push({ file: path.relative(root, filePath), beforeHash, dryRun: true });
        continue;
      }

      await atomicWrite(filePath, updated);

      const after = await fs.readFile(filePath, 'utf8');
      const afterHash = sha256(Buffer.from(after, 'utf8'));
      if (after !== updated) {
        throw new Error('post-write readback mismatch — write may be corrupted');
      }

      results.tagged.push({
        file: path.relative(root, filePath),
        beforeHash,
        afterHash,
        bytesBefore: Buffer.byteLength(before, 'utf8'),
        bytesAfter: Buffer.byteLength(after, 'utf8'),
      });
    } catch (err) {
      results.errors.push({ file: path.relative(root, filePath), error: err.message });
    }
  }

  console.log(`\n${DRY_RUN ? '[DRY RUN] ' : ''}Sensitivity backfill for: ${root}`);
  console.log(`  Total .md files scanned : ${files.length}`);
  console.log(`  Already tagged (skipped): ${results.already.length}`);
  console.log(`  ${DRY_RUN ? 'Would tag' : 'Tagged'}                : ${results.tagged.length}`);
  console.log(`  Errors                  : ${results.errors.length}`);

  if (results.errors.length) {
    console.log('\nErrors:');
    for (const e of results.errors) console.log(`  - ${e.file}: ${e.error}`);
  }

  const receiptDir = path.join(process.cwd(), '.nfl', 'receipts');
  await fs.mkdir(receiptDir, { recursive: true });
  const receiptPath = path.join(
    receiptDir,
    `tag-nfl-sensitivity-${DRY_RUN ? 'dryrun-' : ''}${Date.now()}.json`
  );
  await fs.writeFile(receiptPath, JSON.stringify({ root, dryRun: DRY_RUN, ...results }, null, 2), 'utf8');
  console.log(`\nReceipt written -> ${receiptPath}`);

  if (results.errors.length) process.exitCode = 1;
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
