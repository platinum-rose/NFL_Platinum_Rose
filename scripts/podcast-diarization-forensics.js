#!/usr/bin/env node
// Read-only forensic check for podcast diarization state.
// No AssemblyAI/model calls. No Supabase writes.

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const argVal = (name, fallback = null) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const hasFlag = (name) => process.argv.includes(name);

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SHOW = argVal('--show', 'BettingPros Podcast');
const TERMS = [];
for (let i = 0; i < process.argv.length; i += 1) {
  if (['--term', '--title', '--episode', '--date'].includes(process.argv[i]) && process.argv[i + 1]) {
    TERMS.push(process.argv[i + 1].toLowerCase());
    i += 1;
  }
}
if (!TERMS.length) {
  TERMS.push('ep. 1013', '1013', 'week 1 betting predictions', '2026-07-01');
  TERMS.push('ep. 1018', '1018', 'favorite long shot picks', '2026-07-15');
}

function usage() {
  console.log(`
Read-only Supabase forensic check for podcast diarization.

Usage:
  node scripts/podcast-diarization-forensics.js
  node scripts/podcast-diarization-forensics.js --show "BettingPros Podcast" --term "Ep. 1018"
  node scripts/podcast-diarization-forensics.js --json

Env:
  SUPABASE_URL or VITE_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, or VITE_SUPABASE_ANON_KEY
`);
}

function textLen(value) {
  return typeof value === 'string' ? value.length : 0;
}

function summarizeSegments(segments) {
  const arr = Array.isArray(segments) ? segments : [];
  const speakers = [...new Set(arr.map((u) => u?.speaker).filter(Boolean))];
  const turnsWithTime = arr.filter((u) => u?.start != null || u?.end != null).length;
  return { count: arr.length, speakers, turnsWithTime };
}

function fileStatus(filePath) {
  if (!filePath) return null;
  try {
    const stat = fs.statSync(filePath);
    return { exists: true, size: stat.size, mtime: stat.mtime.toISOString() };
  } catch {
    return { exists: false };
  }
}

function matchesEpisode(ep) {
  const haystack = [
    ep.title,
    ep.pub_date,
    ep.guid,
    ep.audio_url,
  ].filter(Boolean).join(' ').toLowerCase();
  return TERMS.some((term) => haystack.includes(term));
}

async function main() {
  if (hasFlag('--help') || hasFlag('-h')) {
    usage();
    return;
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase env. Need SUPABASE_URL/VITE_SUPABASE_URL and a read key.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  const { data: feeds, error: fErr } = await supabase
    .from('podcast_feeds')
    .select('id, name, expert, needs_diarization, rss_url')
    .ilike('name', `%${SHOW}%`);
  if (fErr) throw new Error(`load feeds: ${fErr.message}`);
  if (!feeds?.length) {
    console.log(`No feed found matching "${SHOW}".`);
    return;
  }

  const feedIds = feeds.map((f) => f.id);
  const { data: episodes, error: eErr } = await supabase
    .from('podcast_episodes')
    .select('id, feed_id, guid, title, pub_date, published_at, audio_url, duration_secs, status, processed_at')
    .in('feed_id', feedIds)
    .order('pub_date', { ascending: false });
  if (eErr) throw new Error(`load episodes: ${eErr.message}`);

  const selectedEpisodes = (episodes || []).filter(matchesEpisode);
  const epIds = selectedEpisodes.map((e) => e.id);

  let transcripts = [];
  let summaries = [];
  if (epIds.length) {
    const { data: tData, error: tErr } = await supabase
      .from('podcast_transcripts')
      .select('id, episode_id, model_used, extraction_model, extraction_quality_score, processed_at, whisper_minutes, audio_path, transcript_path, transcript_text, transcript_excerpt, speaker_segments, picks, intel')
      .in('episode_id', epIds);
    if (tErr) throw new Error(`load transcripts: ${tErr.message}`);
    transcripts = tData || [];

    const { data: sData, error: sErr } = await supabase
      .from('podcast_host_summaries')
      .select('episode_id, host, model, attribution_method, chunk_count, transcript_chars, vault_path, created_at, futures')
      .in('episode_id', epIds)
      .order('created_at', { ascending: false });
    if (sErr) throw new Error(`load host summaries: ${sErr.message}`);
    summaries = sData || [];
  }

  const transcriptByEpisode = new Map(transcripts.map((t) => [t.episode_id, t]));
  const summariesByEpisode = new Map();
  for (const s of summaries) {
    if (!summariesByEpisode.has(s.episode_id)) summariesByEpisode.set(s.episode_id, []);
    summariesByEpisode.get(s.episode_id).push(s);
  }

  const result = {
    show: SHOW,
    terms: TERMS,
    feeds: feeds.map((f) => ({
      name: f.name,
      expert: f.expert,
      needs_diarization: f.needs_diarization,
      rss_url: f.rss_url,
    })),
    episodes: selectedEpisodes.map((ep) => {
      const feed = feeds.find((f) => f.id === ep.feed_id);
      const tr = transcriptByEpisode.get(ep.id);
      const seg = summarizeSegments(tr?.speaker_segments);
      const hostRows = summariesByEpisode.get(ep.id) || [];
      return {
        id: ep.id,
        show: feed?.name,
        title: ep.title,
        pub_date: ep.pub_date || ep.published_at,
        status: ep.status,
        duration_secs: ep.duration_secs,
        audio_url: ep.audio_url,
        feed_needs_diarization: feed?.needs_diarization,
        transcript: tr ? {
          id: tr.id,
          processed_at: tr.processed_at,
          model_used: tr.model_used,
          extraction_model: tr.extraction_model,
          extraction_quality_score: tr.extraction_quality_score,
          whisper_minutes: tr.whisper_minutes,
          transcript_text_chars: textLen(tr.transcript_text),
          transcript_excerpt_chars: textLen(tr.transcript_excerpt),
          audio_path: tr.audio_path,
          audio_path_status: fileStatus(tr.audio_path),
          transcript_path: tr.transcript_path,
          transcript_path_status: fileStatus(tr.transcript_path),
          speaker_segments_count: seg.count,
          speaker_labels: seg.speakers,
          speaker_segments_with_time: seg.turnsWithTime,
          picks_count: Array.isArray(tr.picks) ? tr.picks.length : null,
          intel_count: Array.isArray(tr.intel) ? tr.intel.length : null,
        } : null,
        host_summaries: hostRows.map((s) => ({
          host: s.host,
          model: s.model,
          attribution_method: s.attribution_method,
          chunk_count: s.chunk_count,
          transcript_chars: s.transcript_chars,
          futures_count: Array.isArray(s.futures) ? s.futures.length : null,
          vault_path: s.vault_path,
          created_at: s.created_at,
        })),
      };
    }),
  };

  if (hasFlag('--json')) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`Podcast diarization forensics: ${SHOW}`);
  console.log(`Terms: ${TERMS.join(', ')}`);
  for (const f of result.feeds) {
    console.log(`\nFeed: ${f.name}`);
    console.log(`  expert=${f.expert} needs_diarization=${f.needs_diarization}`);
  }
  if (!result.episodes.length) {
    console.log('\nNo matching episodes found.');
    return;
  }
  for (const ep of result.episodes) {
    console.log(`\n${ep.pub_date || 'undated'} - ${ep.title}`);
    console.log(`  episode_id=${ep.id}`);
    console.log(`  status=${ep.status} duration=${ep.duration_secs ?? '?'}s feed_needs_diarization=${ep.feed_needs_diarization}`);
    console.log(`  audio_url=${ep.audio_url || '(missing)'}`);
    if (!ep.transcript) {
      console.log('  transcript: MISSING');
    } else {
      const t = ep.transcript;
      console.log(`  transcript: model_used=${t.model_used || '(null)'} extraction_model=${t.extraction_model || '(null)'} processed_at=${t.processed_at || '(null)'}`);
      console.log(`  transcript size: text=${t.transcript_text_chars} chars excerpt=${t.transcript_excerpt_chars} chars`);
      console.log(`  speaker_segments: ${t.speaker_segments_count} turn(s), labels=${t.speaker_labels.join(', ') || '(none)'}, timed_turns=${t.speaker_segments_with_time}`);
      console.log(`  paths: transcript_path=${t.transcript_path || '(null)'} ${t.transcript_path_status ? JSON.stringify(t.transcript_path_status) : ''}`);
      console.log(`         audio_path=${t.audio_path || '(null)'} ${t.audio_path_status ? JSON.stringify(t.audio_path_status) : ''}`);
      console.log(`  extracted: picks=${t.picks_count ?? '?'} intel=${t.intel_count ?? '?'}`);
    }
    if (!ep.host_summaries.length) {
      console.log('  host_summaries: none');
    } else {
      console.log('  host_summaries:');
      for (const s of ep.host_summaries) {
        console.log(`    - ${s.host} ${s.model} ${s.attribution_method} futures=${s.futures_count} chunks=${s.chunk_count} chars=${s.transcript_chars} created=${s.created_at}`);
      }
    }

    if (ep.feed_needs_diarization && (!ep.transcript || ep.transcript.speaker_segments_count === 0)) {
      console.log(`  NEXT: needs paid diarization backfill if attribution is worth it:`);
      console.log(`        node scripts/podcast-diarize-backfill.js --episode ${ep.id} --dry-run`);
      console.log(`        node scripts/podcast-diarize-backfill.js --episode ${ep.id}`);
    }
  }
}

main().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
