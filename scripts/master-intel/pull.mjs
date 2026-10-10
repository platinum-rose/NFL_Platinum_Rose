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
const rawSignals = await all('research_pick_signals', 'source,author,bet_type,event_ref,team_or_market,lean,rationale,captured_at', q => q.gte('captured_at', WS));
// Two extraction passes can write the same pick twice (one with the author set, one null; "anytime TD"
// vs "touchdowns"; "rushing_yards" vs "rushing yards"). Collapse them per tweet/article + player + market + lean.
// Keeps the row with an author, then the longer rationale. Rows without an event_ref are never merged.
const normMarket = (m) => { const x = String(m || '').toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  if (/^(anytime )?(td|touchdowns?)( scorer)?$/.test(x)) return 'td'; if (/^(rush(ing)?) (yds|yards)$/.test(x)) return 'rushing yards';
  if (/^(rec(eiving)?) (yds|yards)$/.test(x)) return 'receiving yards'; if (/^(pass(ing)?) (yds|yards)$/.test(x)) return 'passing yards'; return x; };
const normLean = (l) => String(l || '').toUpperCase().replace(/\bYES\b/, 'OVER').replace(/\s+/g, ' ').trim();
function dedupeSignals(rows) {
  const keep = new Map(); const out = [];
  for (const r of rows) {
    if (!r.event_ref) { out.push(r); continue; }
    const parts = String(r.team_or_market || '').split(' - ');
    const key = [r.event_ref, parts[0].toLowerCase().trim(), normMarket(parts.length > 1 ? parts.slice(1).join(' - ') : r.bet_type), normLean(r.lean)].join('|');
    const prev = keep.get(key);
    if (!prev) { keep.set(key, out.length); out.push(r); continue; }
    const cur = out[prev];
    const better = (!cur.author && r.author) || ((!!cur.author === !!r.author) && (r.rationale || '').length > (cur.rationale || '').length);
    if (better) out[prev] = r;
  }
  return out;
}
// Explicit, auditable per-week exclusions (e.g. a prior-week slate thread that landed inside this week's window).
let exclusions = [];
try { exclusions = (JSON.parse(fs.readFileSync('data/research-intel/week-exclusions.json', 'utf8'))[String(WEEK)]) || []; } catch {}
const exRefs = new Map(exclusions.filter(e => e.event_ref).map(e => [e.event_ref, e.reason]));
const expertEx = exclusions.filter(e => e.expert);
const isExpertExcluded = (r) => expertEx.find(e => e.expert === r.expert && e.selection === r.selection && (!e.visitor || e.visitor === r.visitor) && (!e.home || e.home === r.home));
const dedupedSignals = dedupeSignals(rawSignals);

// The loaders (--replace) re-insert rows with captured_at = now, so a Week 2 tweet loaded today looks like a Week ${WEEK} signal.
// Date X/Twitter signals by the tweet itself (the post time is encoded in the status id) and keep only tweets posted inside the window.
const tweetPostedMs = (u) => { const m = String(u || '').match(/(?:x|twitter)\.com\/[^/]+\/status\/(\d+)/); return m ? Number((BigInt(m[1]) >> 22n) + 1288834974657n) : null; };
const WS_MS = Date.parse(WS);
const preWindow = (r) => { const ms = tweetPostedMs(r.event_ref); return ms != null && ms < WS_MS; };
const manuallyExcluded = dedupedSignals.filter(r => exRefs.has(r.event_ref));
const excludedSignals = [
  ...manuallyExcluded.map(r => ({ ...r, excluded_reason: exRefs.get(r.event_ref) })),
  ...dedupedSignals.filter(r => !exRefs.has(r.event_ref) && preWindow(r)).map(r => ({ ...r, excluded_reason: 'tweet posted before the week window (loader re-stamped captured_at)' })),
];
const stalePosts = dedupedSignals.filter(r => !exRefs.has(r.event_ref) && preWindow(r));
const signals = dedupedSignals.filter(r => !exRefs.has(r.event_ref) && !preWindow(r));
console.log(`signals dropped as pre-window tweets: ${stalePosts.length}`);
if (excludedSignals.length) console.log(`signals excluded for week ${WEEK}: ${excludedSignals.length}`);
console.log(`signals deduped: ${rawSignals.length} -> ${signals.length}`);
const notes = await all('research_intel_notes', 'source,title,summary,published_at,captured_at,url', q => q.gte('captured_at', WS));
const expertRaw = await all('user_picks', 'expert,pick_type,selection,line,visitor,home,rationale,created_at', q => q.eq('source', 'EXPERT').gte('created_at', WS));
const expert = expertRaw.filter(r => !isExpertExcluded(r));
const splits = await all('game_splits', '*', q => q.eq('season', SEASON).eq('week', WEEK));
const feedHealth = await all('feed_health', 'source,last_status,last_reason,consecutive_failures,last_success_at,last_checked_at');
const podcasts = await all('podcast_transcripts', 'processed_at', q => q.gte('processed_at', WS));
// These are human-promoted Gemini extractions, not the older transcript-count signal
// above. Keep the source trail intact so the narrative writer can distinguish a
// named speaker's stated view from the ordinary signals/notes feeds. Do not turn
// these into recommendations here: cleaning and roster validation happen in the
// separate weekly synthesis/digest step.
const geminiIntel = await all(
  'podcast_gemini_intel',
  'episode_id,model,picks,analysis_notes,promoted_at,created_at,podcast_episodes(title,pub_date)',
  q => q.not('promoted_at', 'is', null).gte('created_at', WS)
);
const podcastGemini = geminiIntel.map(row => {
  const episode = Array.isArray(row.podcast_episodes) ? row.podcast_episodes[0] : row.podcast_episodes;
  return {
    episode_id: row.episode_id,
    episode_title: episode?.title || null,
    episode_published_at: episode?.pub_date || null,
    model: row.model,
    promoted_at: row.promoted_at,
    created_at: row.created_at,
    picks: (row.picks || []).map(pick => ({
      ...pick,
      rationale: (pick.rationale || '').slice(0, 500),
    })),
    analysis_notes: (row.analysis_notes || []).map(note => ({
      ...note,
      summary: (note.summary || '').slice(0, 700),
      quote: (note.quote || '').slice(0, 500),
    })),
  };
});
const podcastGeminiPickCount = podcastGemini.reduce((total, row) => total + row.picks.length, 0);
const podcastGeminiNoteCount = podcastGemini.reduce((total, row) => total + row.analysis_notes.length, 0);
const out = {
  schema: 'master_intel_pull_v2', week: WEEK, season: SEASON, window_start: WS, pulled_at: new Date().toISOString(),
  excluded_signals: excludedSignals,
  signals: signals.map(r => ({ ...r, rationale: (r.rationale || '').slice(0, 240) })),
  notes: notes.map(r => ({ ...r, summary: (r.summary || '').slice(0, 300) })),
  excluded_expert: expertRaw.filter(isExpertExcluded).map(r => ({ ...r, excluded_reason: isExpertExcluded(r).reason })),
  expert: expert.map(r => ({ ...r, rationale: (r.rationale || '').slice(0, 240) })),
  splits, feed_health: feedHealth, podcast_transcripts_processed: podcasts.length,
  // Promoted source material only. These rows remain evidence, not card picks.
  podcast_gemini: podcastGemini,
  podcast_gemini_summary: {
    promoted_episodes: podcastGemini.length,
    picks: podcastGeminiPickCount,
    analysis_notes: podcastGeminiNoteCount,
  },
};
const f = `data/generated/master-intel/w${String(WEEK).padStart(2, '0')}-pull.json`;
fs.writeFileSync(f, JSON.stringify(out));
console.log(`${f}: signals=${signals.length} notes=${notes.length} expert=${expert.length} splits=${splits.length} feeds=${feedHealth.length} podcasts=${podcasts.length} geminiEpisodes=${podcastGemini.length} geminiPicks=${podcastGeminiPickCount} geminiNotes=${podcastGeminiNoteCount}`);
