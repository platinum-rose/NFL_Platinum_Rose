#!/usr/bin/env node
// scripts/podcast-diarize-backfill.js
// ═══════════════════════════════════════════════════════════════════════════════
// Backfills AssemblyAI speaker diarization (podcast_transcripts.speaker_segments)
// for already-ingested episodes on the 5 multi-host shows (see
// agents/lib/speaker-attribution.js SHOW_CONFIG). Those 161 already-ingested
// episodes predate the 2026-07-20 diarization switch-on, so
// agents/podcast-host-summary.js currently SKIPS all of them for multi-host
// shows (no speaker_segments to attribute against) — this script is what fills
// that gap in.
//
// Built parameterized (--limit-per-show) so the SAME script covers two distinct
// uses without duplicated code:
//   1. A small pilot batch (e.g. --limit-per-show 2, ~5-10 episodes across the
//      5 multi-host shows) to sanity-check attribution + extraction quality
//      before trusting this at scale — Phase 3 step 1 of
//      docs/PODCAST_HOST_SUMMARY_PIPELINE_PLAN.md.
//   2. The full 134-episode backfill (Phase 3 step 3 / task 9) once Andy
//      approves the ~$50-75 one-time AssemblyAI cost — just re-run with a
//      higher --limit-per-show (or omit it — 0 means "no cap").
//
// Cost note: AssemblyAI's Best tier is ~$0.37/hr of audio (rough order of
// magnitude, not a precise quote — same figure used throughout the plan doc).
// This script logs a running estimate from podcast_episodes.duration_secs
// before doing any paid work, and again in the dry-run preview.
//
// NFL relevance: selection applies the same permissive title filter
// podcast-ingest.js uses at discovery time (agents/lib/nfl-relevance.js) so
// non-NFL backlog episodes (found live during the first pilot run, 2026-07-20
// — a "World Cup Final Preview" episode on Sharp or Square got selected before
// this filter existed here) don't burn a paid diarization call. An explicit
// --episode override bypasses this filter, same as it bypasses needs_diarization
// and the already-diarized check — an explicit ask is always honored.
//
// Usage:
//   node scripts/podcast-diarize-backfill.js --dry-run                    # preview only, no API calls
//   node scripts/podcast-diarize-backfill.js --limit-per-show 2           # pilot batch (default)
//   node scripts/podcast-diarize-backfill.js --limit-per-show 0           # no cap -- full backfill
//   node scripts/podcast-diarize-backfill.js --show "Sharp or Square"     # one show only
//   node scripts/podcast-diarize-backfill.js --episode <uuid>             # single episode override
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ASSEMBLYAI_API_KEY
// ═══════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { pathToFileURL } from 'node:url';
import { transcribeWithAssemblyAI } from '../agents/lib/assemblyai-transcribe.js';
import { isNflRelevantEpisode } from '../agents/lib/nfl-relevance.js';

// ─── Config / args ────────────────────────────────────────────────────────────

const argVal = (name, fallback = null) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const hasFlag = (name) => process.argv.includes(name);

const DRY_RUN        = hasFlag('--dry-run');
const LIMIT_PER_SHOW = Number(argVal('--limit-per-show', '2'));
const SHOW_FILTER    = argVal('--show', null);
const ONE_EPISODE    = argVal('--episode', null);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ASSEMBLYAI_HOURLY_RATE_USD = 0.37; // Best tier, rough order of magnitude -- see plan doc

// ─── Selection logic (pure, exported for tests) ────────────────────────────────

/**
 * Picks which episodes to (re-)diarize this run.
 *
 * @param {Object} args
 * @param {Array<{id: string, name: string, needs_diarization: boolean}>} args.feeds
 * @param {Array<{id: string, feed_id: string, title: string, pub_date: string|null,
 *   audio_url: string, duration_secs: number|null}>} args.episodes
 * @param {Array<{episode_id: string, speaker_segments: any}>} args.transcripts
 * @param {number} args.limitPerShow  0 (or negative) means no cap.
 * @param {string|null} [args.showFilter]  Case-insensitive substring match on feed name.
 * @param {string|null} [args.episodeId]  If set, overrides everything else --
 *   returns just that one episode (still resolved against feeds/episodes so the
 *   caller has feed context), regardless of needs_diarization, existing
 *   speaker_segments, or NFL-relevance (an explicit --episode ask is treated
 *   as "re-run this one").
 * @returns {Array<{episode: Object, feed: Object}>}  Newest-first within each feed.
 */
export function selectBackfillTargets({ feeds, episodes, transcripts, limitPerShow, showFilter = null, episodeId = null }) {
  const feedById = new Map(feeds.map(f => [f.id, f]));
  const episodeById = new Map(episodes.map(e => [e.id, e]));

  if (episodeId) {
    const ep = episodeById.get(episodeId);
    if (!ep) return [];
    const feed = feedById.get(ep.feed_id);
    if (!feed) return [];
    return [{ episode: ep, feed }];
  }

  const hasSegments = new Set(
    transcripts
      .filter(t => Array.isArray(t.speaker_segments) && t.speaker_segments.length > 0)
      .map(t => t.episode_id)
  );

  const diarizedFeeds = feeds.filter(f => {
    if (!f.needs_diarization) return false;
    if (showFilter && !f.name.toLowerCase().includes(showFilter.toLowerCase())) return false;
    return true;
  });
  const diarizedFeedIds = new Set(diarizedFeeds.map(f => f.id));

  const byFeed = new Map();
  for (const ep of episodes) {
    if (!diarizedFeedIds.has(ep.feed_id)) continue;
    if (hasSegments.has(ep.id)) continue; // already diarized -- skip
    // Same permissive title filter podcast-ingest.js applies at discovery time
    // (agents/lib/nfl-relevance.js) -- applied here too so already-ingested
    // non-NFL backlog (e.g. a "World Cup Final Preview" episode that predates
    // or slipped past that filter) doesn't burn a paid diarization call. Found
    // live during the first pilot run, 2026-07-20 -- see plan doc Phase 3.
    if (!isNflRelevantEpisode(ep.title)) continue;
    if (!byFeed.has(ep.feed_id)) byFeed.set(ep.feed_id, []);
    byFeed.get(ep.feed_id).push(ep);
  }

  const cap = Number.isFinite(limitPerShow) && limitPerShow > 0 ? limitPerShow : Infinity;
  const out = [];
  for (const feed of diarizedFeeds) {
    const eps = (byFeed.get(feed.id) ?? [])
      .slice()
      .sort((a, b) => String(b.pub_date || '').localeCompare(String(a.pub_date || '')));
    for (const ep of eps.slice(0, cap)) {
      out.push({ episode: ep, feed });
    }
  }
  return out;
}

/** Sum duration_secs across a target list, in hours. Exported for tests. */
export function estimateAudioHours(targets) {
  const secs = targets.reduce((sum, { episode }) => sum + (Number(episode.duration_secs) || 0), 0);
  return secs / 3600;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('❌ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
  if (!DRY_RUN && !process.env.ASSEMBLYAI_API_KEY) { console.error('❌ Missing ASSEMBLYAI_API_KEY'); process.exit(1); }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  console.log('PodcastDiarizeBackfill start');
  console.log(`  dryRun=${DRY_RUN} limitPerShow=${LIMIT_PER_SHOW || '(no cap)'}${SHOW_FILTER ? ` show="${SHOW_FILTER}"` : ''}${ONE_EPISODE ? ` episode=${ONE_EPISODE}` : ''}`);

  const { data: feeds, error: fErr } = await supabase
    .from('podcast_feeds')
    .select('id, name, expert, needs_diarization');
  if (fErr) { console.error(`❌ load feeds: ${fErr.message}`); process.exit(1); }

  const feedIds = feeds.map(f => f.id);
  const { data: episodes, error: eErr } = await supabase
    .from('podcast_episodes')
    .select('id, title, pub_date, feed_id, audio_url, duration_secs')
    .in('feed_id', feedIds);
  if (eErr) { console.error(`❌ load episodes: ${eErr.message}`); process.exit(1); }

  const { data: transcripts, error: tErr } = await supabase
    .from('podcast_transcripts')
    .select('episode_id, speaker_segments');
  if (tErr) { console.error(`❌ load transcripts: ${tErr.message}`); process.exit(1); }

  const targets = selectBackfillTargets({
    feeds, episodes, transcripts,
    limitPerShow: LIMIT_PER_SHOW,
    showFilter: SHOW_FILTER,
    episodeId: ONE_EPISODE,
  });

  if (!targets.length) {
    console.log('  Nothing to backfill (no matching episodes missing speaker_segments).');
    return;
  }

  const hours = estimateAudioHours(targets);
  console.log(`\n  ${targets.length} episode(s) selected across ${new Set(targets.map(t => t.feed.id)).size} show(s)`);
  console.log(`  ~${hours.toFixed(2)} audio hour(s) → rough AssemblyAI estimate: $${(hours * ASSEMBLYAI_HOURLY_RATE_USD).toFixed(2)}`);
  for (const { episode, feed } of targets) {
    console.log(`    [${feed.name}] ${(episode.pub_date || '').slice(0, 10) || 'undated'} — "${String(episode.title || '').slice(0, 70)}"`);
  }

  if (DRY_RUN) {
    console.log('\n  [dry-run] no transcription performed.');
    return;
  }

  let done = 0, errors = 0;
  const startedAt = Date.now();

  for (const { episode, feed } of targets) {
    console.log(`\n  🎙 [${feed.name}] "${String(episode.title || '').slice(0, 66)}"`);
    try {
      const result = await transcribeWithAssemblyAI(episode.audio_url, { diarize: true });
      // upsert, not update: most already-ingested episodes have NO podcast_transcripts
      // row yet (transcript extraction is a separate, costlier step podcast-ingest.js
      // only runs going forward, not against the historical backlog) -- a plain
      // .update() silently matches zero rows in that case (PostgREST returns no
      // error either way), so the paid AssemblyAI diarization result was being
      // thrown away for any episode without a pre-existing row. Found 2026-07-21
      // reviewing the pilot output: 7 of 10 diarized episodes never landed in the DB.
      const { data: upData, error: upErr } = await supabase
        .from('podcast_transcripts')
        .upsert(
          { episode_id: episode.id, transcript_text: result.text, speaker_segments: result.utterances },
          { onConflict: 'episode_id' }
        )
        .select('episode_id');
      if (upErr) throw new Error(`transcript upsert failed: ${upErr.message}`);
      if (!upData?.length) throw new Error('transcript upsert reported success but wrote 0 rows');
      console.log(`     ✅ upserted — ${result.utterances.length} diarized turns`);
      done++;
    } catch (err) {
      errors++;
      console.error(`     ❌ ${err.message}`);
    }
  }

  const elapsedMin = ((Date.now() - startedAt) / 60000).toFixed(1);
  console.log(`\n📊 Done in ${elapsedMin}m. backfilled=${done} errors=${errors} of ${targets.length}`);
  if (errors > 0) process.exit(1);
}

// Windows-safe direct-execution guard -- see scripts/podcast-coverage.js for
// why a plain `file://${process.argv[1]}` comparison silently never fires on
// Windows (backslash vs forward-slash path mismatch).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(err => { console.error(`Fatal: ${err.message}`); process.exit(1); });
}
