#!/usr/bin/env node
// scripts/intel/reextract-week-signals.mjs — re-read a week's stored research-intel articles with the
// current body fetch (agents/lib/article-body.js) and pick parser (extractBodySignals in
// agents/lib/analytical-picks.js), and compare against the research_pick_signals already stored.
//
// Andy, 2026-10-03: "Let's do a real run, so we can go over the results with a fine toothed comb."
// A live ingest run only sees articles that are new since the last run (the local 30-min sweep inserts
// them first, teaser-only), so this replays the parser over the week's notes instead.
//
// Steps (each re-runnable; bodies are cached locally, gitignored):
//   --fetch [--max 60]   fetch up to N article bodies not yet cached (stored body is the fallback)
//   (default)            report: data/generated/master-intel/w<NN>-signal-reextract.json +
//                        reports/intel/signal-reextract-<season>-w<NN>.md
//   --write              insert the NEW signals (deduped per note on team_or_market|bet_type) and replace
//                        stored bodies that were truncated or shorter than the fresh fetch. Never deletes.
// usage: node scripts/intel/reextract-week-signals.mjs --week 4 [--fetch --max 60] [--write]
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { fetchArticleBody, BODY_MAX_CHARS } from '../../agents/lib/article-body.js';
import { extractBodySignals } from '../../agents/lib/analytical-picks.js';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const WEEK = Number(arg('--week')); const SEASON = Number(arg('--season', 2026));
if (!WEEK) { console.error('usage: --week N [--fetch --max N] [--write]'); process.exit(1); }
const FETCH = process.argv.includes('--fetch'); const MAX = Number(arg('--max', 60)); const WRITE = process.argv.includes('--write');
const WS = new Date(Date.parse('2026-09-08T04:00:00Z') + (WEEK - 1) * 7 * 86400000 - 86400000);   // same window as pull.mjs
const WW = String(WEEK).padStart(2, '0');
// research-intel-ingest.js feeds (Twitter bookmark signals come from a different agent and are left alone)
const SOURCES = ['Action Network', 'BettingPros', 'Walter Football', 'ESPN NFL', 'VSiN', 'Sharp Football', 'Pro Football Talk', 'PFF', 'Rotowire NFL'];
const CACHE = `data/intel/articles/${SEASON}-w${WW}/_ingest-bodies`;
fs.mkdirSync(CACHE, { recursive: true });
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

let notes = [], from = 0;
for (;;) {
  const { data, error } = await s.from('research_intel_notes').select('id,source,source_type,confidence,title,url,body,captured_at,author')
    .in('source', SOURCES).gte('captured_at', WS.toISOString()).order('id').range(from, from + 499);
  if (error) throw error; notes = notes.concat(data); if (data.length < 500) break; from += 500;
}
const cacheFile = (n) => path.join(CACHE, `${n.id}.txt`);
if (FETCH) {
  let done = 0, ok = 0;
  for (const n of notes) {
    if (fs.existsSync(cacheFile(n))) continue;
    if (done >= MAX) break;
    const body = await fetchArticleBody(n.url, BODY_MAX_CHARS); done++;
    fs.writeFileSync(cacheFile(n), body ? body : '', 'utf8'); if (body) ok++;
    await new Promise((r) => setTimeout(r, 250));
  }
  const left = notes.filter((n) => !fs.existsSync(cacheFile(n))).length;
  console.log(`fetched ${ok}/${done} this call; ${left} notes still to fetch of ${notes.length}`);
  if (left > 0 && !WRITE) process.exit(0);
}

// existing signals for these notes
let prior = [];
for (let i = 0; i < notes.length; i += 200) {
  const { data, error } = await s.from('research_pick_signals').select('id,note_id,source,team_or_market,bet_type,lean,rationale,confidence,captured_at')
    .in('note_id', notes.slice(i, i + 200).map((n) => n.id));
  if (error) throw error; prior = prior.concat(data);
}
const key = (x) => `${String(x.team_or_market).toLowerCase().trim()}|${x.bet_type}`;
const out = { schema: 'signal_reextract_v1', season: SEASON, week: WEEK, generated_at: new Date().toISOString(), window_start: WS.toISOString(), notes: [] };
const insert = [], bodyUpdates = [];
for (const n of notes) {
  const cached = fs.existsSync(cacheFile(n)) ? fs.readFileSync(cacheFile(n), 'utf8') : null;
  const fresh = cached && cached.length > 0 ? cached : null;
  const body = fresh || n.body || '';
  const via = fresh ? 'fresh fetch' : n.body ? 'stored body (fetch failed or not cached)' : 'no body';
  const sigs = body ? extractBodySignals({ source: n.source, sourceType: n.source_type, confidence: n.confidence ?? 0.6, url: n.url, title: n.title, body }) : [];
  const old = prior.filter((p) => p.note_id === n.id);
  const oldKeys = new Set(old.map(key)); const newKeys = new Set(sigs.map(key));
  const rec = { id: n.id, source: n.source, title: n.title, url: n.url, captured_at: n.captured_at, via,
    stored_chars: (n.body || '').length, fresh_chars: fresh ? fresh.length : null,
    kept: sigs.filter((x) => oldKeys.has(key(x))).map((x) => ({ market: x.team_or_market, bet_type: x.bet_type, rationale: x.rationale })),
    added: sigs.filter((x) => !oldKeys.has(key(x))).map((x) => ({ market: x.team_or_market, bet_type: x.bet_type, lean: x.lean, rationale: x.rationale, confidence: x.confidence })),
    old_only: old.filter((x) => !newKeys.has(key(x))).map((x) => ({ signal_id: x.id, market: x.team_or_market, bet_type: x.bet_type, rationale: x.rationale })) };
  if (rec.kept.length || rec.added.length || rec.old_only.length) out.notes.push(rec);
  for (const x of sigs.filter((x) => !oldKeys.has(key(x)))) insert.push({ note_id: n.id, source: x.source, author: n.author || null, team_or_market: x.team_or_market,
    bet_type: x.bet_type, lean: x.lean, rationale: x.rationale, event_ref: x.event_ref, confidence: x.confidence });
  if (fresh && fresh.length > (n.body || '').length + 200) bodyUpdates.push({ id: n.id, body: fresh });
}
const T = (f) => out.notes.reduce((a, r) => a + r[f].length, 0);
out.totals = { notes_scanned: notes.length, notes_with_signals: out.notes.length, fresh_bodies: notes.filter((n) => fs.existsSync(cacheFile(n)) && fs.statSync(cacheFile(n)).size > 0).length,
  stored_signals: prior.length, kept: T('kept'), added: T('added'), old_only: T('old_only'), body_updates: bodyUpdates.length };
out.by_source = {};
for (const r of out.notes) { const b = out.by_source[r.source] ||= { notes: 0, kept: 0, added: 0, old_only: 0 }; b.notes++; b.kept += r.kept.length; b.added += r.added.length; b.old_only += r.old_only.length; }
fs.writeFileSync(`data/generated/master-intel/w${WW}-signal-reextract.json`, JSON.stringify(out, null, 1), 'utf8');
const esc = (t) => String(t || '').replace(/\|/g, '/').replace(/\s+/g, ' ');
const L = [`# Signal re-extraction review: ${SEASON} Week ${WEEK}`, '', `Generated ${out.generated_at} by \`scripts/intel/reextract-week-signals.mjs\`. `
  + `Notes captured since ${WS.toISOString().slice(0, 16)}Z from the research-intel-ingest feeds, re-read with the current body fetch and pick parser, compared with the signals already stored. `
  + `**kept** = both agree · **added** = new parser finds it, not stored yet · **old only** = stored (old open-regex extractor or RSS teaser), new parser does not produce it.`, '',
  `| | Notes | Kept | Added | Old only |`, '|---|---|---|---|---|',
  ...Object.entries(out.by_source).sort((a, b) => b[1].old_only + b[1].added - a[1].old_only - a[1].added).map(([k, v]) => `| ${k} | ${v.notes} | ${v.kept} | ${v.added} | ${v.old_only} |`),
  `| **Total** | ${out.totals.notes_with_signals} | ${out.totals.kept} | ${out.totals.added} | ${out.totals.old_only} |`, '',
  `Bodies: ${out.totals.fresh_bodies} fresh fetches of ${notes.length} notes; ${bodyUpdates.length} stored bodies are shorter than the fresh fetch (truncated or teaser-only).`, ''];
for (const r of out.notes.sort((a, b) => a.source.localeCompare(b.source) || a.id - b.id)) {
  L.push(`## ${esc(r.source)} · [${esc(r.title).slice(0, 110)}](${r.url})`, `note ${r.id} · ${r.captured_at.slice(0, 16)} · body: ${r.via} (stored ${r.stored_chars}, fresh ${r.fresh_chars ?? '-'})`, '');
  for (const x of r.kept) L.push(`- kept · ${x.bet_type} **${esc(x.market)}** — ${esc(x.rationale).slice(0, 160)}`);
  for (const x of r.added) L.push(`- **added** · ${x.bet_type} **${esc(x.market)}** — ${esc(x.rationale).slice(0, 160)}`);
  for (const x of r.old_only) L.push(`- old only · ${x.bet_type} ${esc(x.market)} — ${esc(x.rationale).slice(0, 160)}`);
  L.push('');
}
fs.writeFileSync(`reports/intel/signal-reextract-${SEASON}-w${WW}.md`, L.join('\n') + '\n', 'utf8');
console.log(JSON.stringify(out.totals)); console.table(out.by_source);
if (!WRITE) { console.log('report only -- pass --write to insert the added signals and update truncated bodies'); process.exit(0); }
for (let i = 0; i < insert.length; i += 200) {
  const { error } = await s.from('research_pick_signals').insert(insert.slice(i, i + 200));
  if (error) throw error;
}
let bu = 0;
for (const u of bodyUpdates) { const { error } = await s.from('research_intel_notes').update({ body: u.body }).eq('id', u.id); if (!error) bu++; }
console.log(`inserted ${insert.length} signals; updated ${bu} bodies`);
