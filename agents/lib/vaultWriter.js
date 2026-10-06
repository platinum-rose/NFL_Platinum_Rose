// Shared Obsidian vault writer for NFL_Dashboard (the one writer path; see E:\data\Obsidian\CLAUDE.md
// "Writer rules": atomic writes, no bulk writes through the Linux<->NTFS mount, sensitivity on every note).
// Used by scripts/export-vault-to-md.js (Supabase vault_notes -> vault) and scripts/archive/weekly-archive.mjs
// (local weekly archive -> vault). Run it natively on Windows/M6, not through a VM mount.
import path from 'node:path';
import { createHash } from 'node:crypto';
import { mkdir, writeFile, readFile, rename, rm } from 'node:fs/promises';
import { ensureVaultFrontmatter } from './vaultFrontmatter.js';

const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

/**
 * Atomically write one note under vaultDir. Returns 'written' | 'unchanged' | 'skipped' (dry run).
 * notePath is vault-relative (e.g. "NFL/2026/Week 04/Index.md"). Frontmatter is added only when the
 * content has none; every note ends up with a sensitivity key (default green: public sports data).
 */
export async function writeVaultNote(vaultDir, notePath, content, frontmatter = {}, { dryRun = false, verify = true } = {}) {
  if (!vaultDir) throw new Error('vaultDir is required (set VAULT_DIR)');
  const filePath = notePath.endsWith('.md') ? notePath : `${notePath}.md`;
  const vaultRoot = path.resolve(vaultDir);
  const absPath = path.resolve(vaultRoot, filePath);
  if (absPath !== vaultRoot && !absPath.startsWith(vaultRoot + path.sep)) throw new Error(`path traversal blocked: ${notePath}`);
  const body = ensureVaultFrontmatter(content ?? '', frontmatter);
  if (!/^---[\s\S]*?\nsensitivity:\s*(red|orange|yellow|green)\b/m.test(body)) throw new Error(`note has no valid sensitivity key: ${notePath}`);
  if (dryRun) return 'skipped';
  try {
    const cur = await readFile(absPath, 'utf8');
    // ignore the created/modified stamps when deciding whether anything changed
    const strip = (s) => s.replace(/^(created|modified): .*$/gm, '');
    if (strip(cur) === strip(body)) return 'unchanged';
  } catch { /* new note */ }
  await mkdir(path.dirname(absPath), { recursive: true });
  const tmpPath = `${absPath}.tmp.${process.pid}.${Date.now()}`;
  try {
    await writeFile(tmpPath, body, 'utf8');
    await rename(tmpPath, absPath);
  } catch (err) {
    await rm(tmpPath, { force: true }).catch(() => {});
    throw err;
  }
  if (verify) {
    const back = await readFile(absPath, 'utf8');
    if (sha(back) !== sha(body)) throw new Error(`hash mismatch after write: ${notePath}`);
  }
  return 'written';
}
