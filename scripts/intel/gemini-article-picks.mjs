#!/usr/bin/env node
// scripts/intel/gemini-article-picks.mjs — Gemini pass over pick-heavy article BODIES that the regex
// extractor (agents/lib/analytical-picks.js) turns into 0 signals (PFF anytime-TD bets, Sharp Football
// player props, ESPN betting guide, Action Network prop lists).
// Default = dry run: calls Gemini, writes data/generated/master-intel/w<NN>-article-gemini-picks.json for review.
// --write inserts the NEW signals (deduped against stored signals for the same note). Never deletes.
// usage: node scripts/intel/gemini-article-picks.mjs --week 5 [--ids 7140,7198] [--max 12] [--min-signals 3] [--write]
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { callGemini } from '../../agents/lib/gemini-master-extractor.js';
import { buildTextPickSignalRows, TWEET_PICK_PROMPT, dedupeSignalRows, signalKey } from '../../agents/lib/tweet-pick-signals.js';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const WEEK = Number(arg('--week')); if (!WEEK) { console.error('usage: --week N [--ids a,b] [--max N] [--min-signals N] [--write]'); process.exit(1); }
const WRITE = process.argv.includes('--write'); const MAX = Number(arg('--max', 12)); const MINSIG = Number(arg('--min-signals', 3));
const IDS = (arg('--ids', '') || '').split(',').map(Number).filter(Boolean);
const WW = String(WEEK).padStart(2, '0');
const WS = new Date(Date.parse('2026-09-08T04:00:00Z') + (WEEK - 1) * 7 * 86400000 - 86400000);
const SOURCES = ['Action Network', 'BettingPros', 'ESPN NFL', 'VSiN', 'Sharp Football', 'PFF', 'Rotowire NFL', 'Walter Football'];
const TITLE = /anytime touchdown|touchdown bets|prop bets|player props|best bets|picks|predictions|parlay|betting guide|bets/i;
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

let q = s.from('research_intel_notes').select('id,source,title,url,body,author,captured_at,published_at').in('source', SOURCES);
q = IDS.length ? q.in('id', IDS) : q.gte('published_at', WS.toISOString());
const { data: notes0, error } = await q.order('id', { ascending: false }).limit(400);
if (error) throw error;
const notes = (IDS.length ? notes0 : notes0.filter((n) => TITLE.test(n.title || '') && (n.body || '').length > 1500));
const { data: prior } = await s.from('research_pick_signals').select('note_id').in('note_id', notes.map((n) => n.id));
const cnt = {}; for (const p of prior || []) cnt[p.note_id] = (cnt[p.note_id] || 0) + 1;
// skip articles the regex path already mined well, and week-4 recaps/previous-week content
const targets = notes.filter((n) => IDS.length || (cnt[n.id] || 0) < MINSIG).slice(0, MAX);
console.log('candidates:', notes.map((n) => `${n.id}(${cnt[n.id] || 0})`).join(' '));
console.log(`${notes.length} candidate articles; ${targets.length} with < ${MINSIG} stored signals (max ${MAX})`);

const PROMPT = `${TWEET_PICK_PROMPT}

This input is a betting ARTICLE for NFL Week ${WEEK} of the 2026 season. Extract EVERY concrete recommended bet the article writer makes
(sides, totals, moneylines, anytime-TD and other player props, parlay legs, teasers). Include the game as "AWAY@HOME" using 2-3 letter NFL
team abbreviations in a "game" field on each pick, and put the player's team in the rationale if unclear. Skip games from other weeks
(e.g. Week 4 recap results) and college. Return {"picks":[...]} only.`;

const out = [], rows = [];
for (const n of targets) {
  let picks = [];
  try {
    const gem = await callGemini(`${PROMPT}\n\nTITLE: ${n.title}\nSOURCE: ${n.source}\n\n${(n.body || '').slice(0, 60000)}`);
    const txt = gem.text;
    const m = String(txt).match(/\{[\s\S]*\}/); picks = JSON.parse(m ? m[0] : '{"picks":[]}').picks || [];
    if (!picks.length || process.argv.includes('--debug')) { fs.mkdirSync('data/generated/master-intel/gemini-debug', { recursive: true }); fs.writeFileSync(`data/generated/master-intel/gemini-debug/${n.id}.txt`, `BODY CHARS: ${(n.body || '').length}\n--- RAW ---\n${txt}`); }
  } catch (e) { console.warn(`note ${n.id} failed: ${e.message.slice(0, 160)}`); continue; }
  for (const p of picks) if (p.game && p.rationale) p.rationale = `[${p.game}] ${p.rationale}`;
  const built = buildTextPickSignalRows(picks, { noteId: n.id, eventRef: n.url, sourceLabel: n.source, author: n.author || null }).map((r) => ({ ...r, confidence: 0.6 }));
  out.push({ id: n.id, source: n.source, title: n.title, url: n.url, stored: cnt[n.id] || 0, picks: built.length, rows: built });
  rows.push(...built);
  console.log(`  ${n.id} ${n.source} | ${String(n.title).slice(0, 60)} | stored ${cnt[n.id] || 0} -> gemini ${built.length}`);
}
const deduped = dedupeSignalRows(rows);
fs.mkdirSync('data/generated/master-intel', { recursive: true });
fs.writeFileSync(`data/generated/master-intel/w${WW}-article-gemini-picks.json`, JSON.stringify({ generated_at: new Date().toISOString(), articles: out }, null, 1));
console.log(`total ${rows.length} rows (${deduped.length} after dedupe) -> data/generated/master-intel/w${WW}-article-gemini-picks.json`);
if (!WRITE) { console.log('dry run -- review the JSON, then re-run with --write'); process.exit(0); }
const { data: have } = await s.from('research_pick_signals').select('note_id,team_or_market,lean').in('note_id', targets.map((n) => n.id));
const seen = new Set((have || []).map((r) => `${r.note_id}|${signalKey(r)}`));
const fresh = deduped.filter((r) => !seen.has(`${r.note_id}|${signalKey(r)}`));
for (let i = 0; i < fresh.length; i += 200) { const { error: e } = await s.from('research_pick_signals').insert(fresh.slice(i, i + 200)); if (e) throw e; }
console.log(`inserted ${fresh.length} signals`);
