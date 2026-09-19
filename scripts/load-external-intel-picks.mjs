#!/usr/bin/env node
// Loads Grok thread-capture CSVs and Antigravity video notes into research_pick_signals.
//
//   node scripts/load-external-intel-picks.mjs --dry-run          # parse + report, no writes
//   node scripts/load-external-intel-picks.mjs --emit-json=out.json
//   node scripts/load-external-intel-picks.mjs                    # insert (Supabase)
//   node scripts/load-external-intel-picks.mjs --replace          # replace earlier Grok/Antigravity rows for the same tweets
//
// Each pick attaches to the research_intel_notes row of its tweet (matched on url); picks
// whose tweet has no note are inserted with note_id null. Existing identical signals
// (same note/tweet + team_or_market + bet_type + lean) are skipped, so re-runs are safe.
import 'dotenv/config';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { parseCsv, parseVideoNote, toSignalRows } from '../agents/lib/external-intel-picks.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANUAL = path.join(ROOT, 'data', 'vault-seed', 'manual');
const argv = process.argv.slice(2);
const DRY = argv.includes('--dry-run');
const emit = (argv.find((a) => a.startsWith('--emit-json=')) || '').split('=')[1];

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p)); else out.push(p);
  }
  return out;
}

const files = await walk(MANUAL);
const grok = files.filter((f) => /grok-.*\.csv$/i.test(path.basename(f)));
const video = files.filter((f) => /^twitter-video-\d+\.md$/i.test(path.basename(f)));

const all = [];
const skipped = [];
// A re-run CSV supersedes earlier CSVs for the same tweet: newest file wins per tweet_url.
const { stat } = await import('node:fs/promises');
const grokByAge = (await Promise.all(grok.map(async (f) => ({ f, t: (await stat(f)).mtimeMs })))).sort((a, b) => b.t - a.t);
const claimed = new Set();
for (const { f } of grokByAge) {
  const parsed = parseCsv(await readFile(f, 'utf8'));
  const own = parsed.filter((p) => !claimed.has(p.tweet_url));
  for (const p of parsed) if (p.tweet_url) claimed.add(p.tweet_url);
  if (own.length < parsed.length) console.log(`  ${path.relative(ROOT, f)}: ${parsed.length - own.length} row(s) superseded by a newer Grok CSV`);
  const r = toSignalRows(own, { sourceLabel: 'Twitter/X Bookmarks (Grok thread capture)' });
  all.push(...r.rows); skipped.push(...r.skipped.map((s) => ({ ...s, file: path.relative(ROOT, f) })));
}
for (const f of video) {
  const r = toSignalRows(parseVideoNote(await readFile(f, 'utf8')), { sourceLabel: 'Twitter/X Bookmarks (Antigravity video)' });
  all.push(...r.rows); skipped.push(...r.skipped.map((s) => ({ ...s, file: path.relative(ROOT, f) })));
}
console.log(`Files: ${grok.length} Grok CSV, ${video.length} video notes -> ${all.length} pick rows, ${skipped.length} skipped`);
for (const s of skipped) console.log(`  skip (${s.reason}) ${s.file}: ${s.pick.author || '?'} ${s.pick.team_or_market || ''}`);

if (emit) { await writeFile(path.resolve(emit), JSON.stringify(all, null, 2)); console.log(`Wrote ${emit}`); }
if (DRY || emit) process.exit(0);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const urls = [...new Set(all.map((r) => r.tweet_url))];
// --replace: drop previously loaded external-intel rows for these tweets first
// (so a Grok re-run replaces, not duplicates, the earlier capture).
if (argv.includes('--replace')) {
  const { error: delErr, count } = await supabase.from('research_pick_signals')
    .delete({ count: 'exact' })
    .in('event_ref', urls)
    .in('source', ['Twitter/X Bookmarks (Grok thread capture)', 'Twitter/X Bookmarks (Antigravity video)']);
  if (delErr) throw new Error(delErr.message);
  console.log(`--replace: removed ${count} earlier Grok/Antigravity row(s) for these tweets`);
}
const { data: notes, error: nErr } = await supabase.from('research_intel_notes').select('id,url').in('url', urls);
if (nErr) throw new Error(nErr.message);
const noteByUrl = new Map((notes || []).map((n) => [n.url, n.id]));
const { data: existing } = await supabase.from('research_pick_signals')
  .select('event_ref,team_or_market,bet_type,lean').in('event_ref', urls);
const key = (r) => `${r.event_ref}|${String(r.team_or_market).toLowerCase()}|${r.bet_type}|${String(r.lean).toLowerCase()}`;
const seen = new Set((existing || []).map(key));
const toInsert = [];
for (const { tweet_url, ...r } of all) {
  const row = { ...r, note_id: noteByUrl.get(tweet_url) ?? null };
  if (seen.has(key(row))) continue;
  seen.add(key(row));
  toInsert.push(row);
}
if (toInsert.length) {
  const { error } = await supabase.from('research_pick_signals').insert(toInsert);
  if (error) throw new Error(error.message);
}
console.log(`Inserted ${toInsert.length} (already present: ${all.length - toInsert.length}); ${toInsert.filter((r) => r.note_id == null).length} without a matching tweet note.`);
