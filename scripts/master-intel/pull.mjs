#!/usr/bin/env node
// scripts/master-intel/pull.mjs — Supabase READ-ONLY pull for the weekly Master Intel Report.
// usage: node scripts/master-intel/pull.mjs --week 3 [--season 2026]
// Writes data/generated/master-intel/w<NN>-pull.json (gitignored with data/generated).
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const WEEK = Number(arg('--week')); const SEASON = Number(arg('--season', 2026));
if (!WEEK) { console.error('usage: --week N'); process.exit(1); }
// Week N window: Tuesday 04:00Z after week N-1's MNF through the next Tuesday (same convention as weekly-synthesis-preflight).
const WS = new Date(Date.parse('2026-09-08T04:00:00Z') + (WEEK - 1) * 7 * 86400000 - 86400000).toISOString();
const s = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function all(table, cols, build) {
  let out = [], from = 0;
  for (;;) {
    let q = s.from(table).select(cols).range(from, from + 999);
    q = build ? build(q) : q;
    const { data, error } = await q;
    if (error) { console.warn(`${table}: ${error.message}`); return out; }
    out = out.concat(data); if (data.length < 1000) return out; from += 1000;
  }
}
const signals = await all('research_pick_signals', 'source,author,bet_type,event_ref,team_or_market,lean,rationale,captured_at', q => q.gte('captured_at', WS));
const notes = await all('research_intel_notes', 'source,title,summary,published_at,captured_at,url', q => q.gte('captured_at', WS));
const expert = await all('user_picks', 'expert,pick_type,selection,line,visitor,home,rationale,created_at', q => q.eq('source', 'EXPERT').gte('created_at', WS));
const splits = await all('game_splits', '*', q => q.eq('season', SEASON).eq('week', WEEK));
const feedHealth = await all('feed_health', 'source,last_status,last_reason,consecutive_failures,last_success_at,last_checked_at');
const podcasts = await all('podcast_transcripts', 'processed_at', q => q.gte('processed_at', WS));
const out = {
  schema: 'master_intel_pull_v1', week: WEEK, season: SEASON, window_start: WS, pulled_at: new Date().toISOString(),
  signals: signals.map(r => ({ ...r, rationale: (r.rationale || '').slice(0, 240) })),
  notes: notes.map(r => ({ ...r, summary: (r.summary || '').slice(0, 300) })),
  expert: expert.map(r => ({ ...r, rationale: (r.rationale || '').slice(0, 240) })),
  splits, feed_health: feedHealth, podcast_transcripts_processed: podcasts.length,
};
const f = `data/generated/master-intel/w${String(WEEK).padStart(2, '0')}-pull.json`;
fs.writeFileSync(f, JSON.stringify(out));
console.log(`${f}: signals=${signals.length} notes=${notes.length} expert=${expert.length} splits=${splits.length} feeds=${feedHealth.length} podcasts=${podcasts.length}`);
