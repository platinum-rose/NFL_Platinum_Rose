#!/usr/bin/env node
// scripts/dedupe-twitter-bookmarks.mjs -- one-off cleanup of duplicates the bookmark pipeline wrote before
// the 2026-10-10 fixes (OCR rows without author, placeholder-author filenames).
//   node scripts/dedupe-twitter-bookmarks.mjs              # DRY RUN: report only, writes nothing
//   node scripts/dedupe-twitter-bookmarks.mjs --local      # move duplicate local .md files into _dupes/ (reversible)
//   node scripts/dedupe-twitter-bookmarks.mjs --apply      # back up, then DELETE duplicate Supabase rows
//   add --include-line-matches to also delete OCR rows that match a text row only by player + line (market label differs;
//   a few of these are cases where the OCR market label is the correct one, so they are off by default)
// Signals: a null-author row is deleted only when an author-tagged (or earlier) row on the same note is the same pick
// per dedupeSignalRows(); author-tagged rows are never deleted. vault_notes: for a tweet id under several paths, the
// path matching the preferred local filename (real handle > twitter_user > unknown) is kept.
import 'dotenv/config';
import fs from 'node:fs'; import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { dedupeSignalRows, signalKey } from '../agents/lib/tweet-pick-signals.js';

const APPLY = process.argv.includes('--apply'); const LOCAL = process.argv.includes('--local');
const SRC = 'Twitter/X Bookmarks (Personal)';
const DIR = path.join('.nfl', 'reports', 'twitter-bookmarks');
const rank = (f) => { const h = f.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/-\d{10,}\.md$/, '').toLowerCase(); return h === 'unknown' ? 2 : h === 'twitter_user' ? 1 : 0; };
const tid = (f) => (String(f).match(/-(\d{10,})\.md$/) || [])[1];
const preferred = (names) => [...names].sort((a, b) => (rank(b) - rank(a)) * -1 || a.localeCompare(b))[0];

// ---- local files
const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith('.md')) : [];
const byId = new Map(); files.forEach((f) => { const i = tid(f); if (i) (byId.get(i) || byId.set(i, []).get(i)).push(f); });
const keepByTweet = new Map(); const localMoves = [];
for (const [i, names] of byId) { const keep = preferred(names); keepByTweet.set(i, keep); names.filter((n) => n !== keep).forEach((n) => localMoves.push({ id: i, from: n, keep })); }
console.log(`local: ${files.length} files, ${localMoves.length} duplicate file(s) across ${new Set(localMoves.map((m) => m.id)).size} tweet id(s)`);
localMoves.forEach((m) => console.log(`  ${LOCAL ? 'move' : 'would move'} ${m.from}  (keeping ${m.keep})`));
if (LOCAL) { fs.mkdirSync(path.join(DIR, '_dupes'), { recursive: true }); localMoves.forEach((m) => fs.renameSync(path.join(DIR, m.from), path.join(DIR, '_dupes', m.from))); console.log(`moved ${localMoves.length} file(s) to ${path.join(DIR, '_dupes')}`); }

// ---- supabase
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function all(t, cols, f) { let o = [], from = 0; for (;;) { let q = s.from(t).select(cols).range(from, from + 999); if (f) q = f(q); const { data, error } = await q; if (error) throw new Error(`${t}: ${error.message}`); o = o.concat(data); if (data.length < 1000) return o; from += 1000; } }

const sigs = await all('research_pick_signals', 'id,note_id,author,team_or_market,bet_type,lean,confidence,source,event_ref,rationale,captured_at', (q) => q.eq('source', SRC));
const byNote = new Map(); sigs.forEach((r) => (byNote.get(r.note_id) || byNote.set(r.note_id, []).get(r.note_id)).push(r));
const INCLUDE_LINE = process.argv.includes('--include-line-matches');
const delSigs = []; const lineOnly = [];
for (const rows of byNote.values()) {
  const ordered = [...rows].sort((a, b) => (!!b.author - !!a.author) || a.id - b.id); // tagged first, then oldest
  const kept = new Set(dedupeSignalRows(ordered).map((r) => r.id));
  ordered.filter((r) => !kept.has(r.id) && !r.author).forEach((r) => {
    const exact = ordered.some((t) => kept.has(t.id) && signalKey(t) === signalKey(r));
    if (exact || INCLUDE_LINE) delSigs.push(r); else lineOnly.push(r);
  });
}
const tagged = sigs.filter((r) => r.author).length;
console.log(`signals: ${sigs.length} rows (${tagged} author-tagged); ${delSigs.length} duplicate null-author row(s) to delete; 0 author-tagged rows touched`);
if (lineOnly.length) console.log(`  ${lineOnly.length} more OCR row(s) match a text row only by player + line -- left alone (use --include-line-matches to delete)`);
delSigs.slice(0, 8).forEach((r) => console.log(`  [${r.id}] note ${r.note_id} ${r.team_or_market} ${r.lean}`));

const vault = await all('vault_notes', 'path', (q) => q.like('path', 'NFL/Bookmarks/%'));
const vById = new Map(); vault.forEach((v) => { const i = tid(v.path); if (i) (vById.get(i) || vById.set(i, []).get(i)).push(v.path); });
const delVault = [];
for (const [i, paths] of vById) { if (paths.length < 2) continue; const keepName = keepByTweet.get(i) || preferred(paths.map((p) => p.split('/').pop())); paths.filter((p) => p.split('/').pop() !== keepName).forEach((p) => delVault.push(p)); }
console.log(`vault_notes: ${vault.length} rows; ${delVault.length} duplicate path(s) to delete`);
delVault.forEach((p) => console.log(`  ${p}`));

if (!APPLY) { console.log('\nDRY RUN -- nothing deleted. Re-run with --apply to back up and delete.'); process.exit(0); }
// ---- apply: backup first, abort if the backup can't be written
const ts = new Date().toISOString().replace(/[:.]/g, '-');
fs.mkdirSync('data/generated', { recursive: true });
const bp = `data/generated/dedupe-twitter-bookmarks-backup-${ts}.json`;
const vaultRows = delVault.length ? await all('vault_notes', '*', (q) => q.in('path', delVault)) : [];
fs.writeFileSync(bp, JSON.stringify({ signals: delSigs, vault_notes: vaultRows }, null, 2));
console.log(`backup written: ${bp} (${delSigs.length} signals, ${vaultRows.length} vault_notes)`);
for (let i = 0; i < delSigs.length; i += 100) { const { error } = await s.from('research_pick_signals').delete().in('id', delSigs.slice(i, i + 100).map((r) => r.id)); if (error) throw new Error(error.message); }
if (delVault.length) { const { error } = await s.from('vault_notes').delete().in('path', delVault); if (error) throw new Error(error.message); }
console.log(`deleted ${delSigs.length} signal row(s) and ${delVault.length} vault_notes row(s).`);
