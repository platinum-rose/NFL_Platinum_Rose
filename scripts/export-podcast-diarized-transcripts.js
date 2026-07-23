#!/usr/bin/env node
// Export selected podcast transcripts + speaker_segments from Supabase to files.
// Read-only DB access. No AssemblyAI/model calls. No Supabase writes.

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const argVal = (name, fallback = null) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const hasFlag = (name) => process.argv.includes(name);

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const ALL = hasFlag('--all');
const SHOW_ARG = argVal('--show', null);
const SHOW = SHOW_ARG || (ALL ? null : 'BettingPros Podcast');
const OUT_DIR = argVal('--out-dir', path.join('data', 'podcasts', 'm6-diarized'));
const LIMIT_TURNS = Number(argVal('--limit-turns', '0'));

const TERMS = [];
for (let i = 0; i < process.argv.length; i += 1) {
  if (['--term', '--title', '--episode', '--date'].includes(process.argv[i]) && process.argv[i + 1]) {
    TERMS.push(process.argv[i + 1].toLowerCase());
    i += 1;
  }
}
if (!TERMS.length && !ALL) {
  TERMS.push('ep. 1013', '1013', 'week 1 betting predictions', '2026-07-01');
  TERMS.push('ep. 1018', '1018', 'favorite long shot picks', '2026-07-15');
}

function usage() {
  console.log(`
Export diarized podcast transcripts from Supabase to local files.

Usage:
  node scripts/export-podcast-diarized-transcripts.js
  node scripts/export-podcast-diarized-transcripts.js --all
  node scripts/export-podcast-diarized-transcripts.js --all --show "BettingPros Podcast"
  node scripts/export-podcast-diarized-transcripts.js --show "BettingPros Podcast" --term "Ep. 1018"
  node scripts/export-podcast-diarized-transcripts.js --limit-turns 25

Options:
  --all               Export every matching episode that has speaker_segments.
  --show <name>       Feed/show filter. Default: BettingPros Podcast.
                      With --all and no --show, exports all shows.
  --term <text>       Episode title/date/id search term. Can be repeated.
  --out-dir <dir>     Output directory. Default: data/podcasts/m6-diarized.
  --limit-turns <n>   Export only first n diarized turns to Markdown preview. JSON stays complete.
`);
}

function slugify(value) {
  return String(value || 'episode')
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'episode';
}

function matchesEpisode(ep) {
  if (ALL) return true;
  const haystack = [
    ep.title,
    ep.pub_date,
    ep.guid,
    ep.audio_url,
    ep.id,
  ].filter(Boolean).join(' ').toLowerCase();
  return TERMS.some((term) => haystack.includes(term));
}

function msToStamp(ms) {
  if (ms == null || Number.isNaN(Number(ms))) return '';
  const total = Math.max(0, Math.round(Number(ms) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

function renderMarkdown({ episode, feed, transcript, hostSummaries }) {
  const turns = Array.isArray(transcript.speaker_segments) ? transcript.speaker_segments : [];
  const previewTurns = LIMIT_TURNS > 0 ? turns.slice(0, LIMIT_TURNS) : turns;
  const speakers = [...new Set(turns.map((u) => u?.speaker).filter(Boolean))];
  const lines = [
    `# ${feed.name} - ${episode.title}`,
    '',
    `Published: ${episode.pub_date || 'unknown'}`,
    `Episode ID: ${episode.id}`,
    `Status: ${episode.status}`,
    `Duration: ${episode.duration_secs ?? 'unknown'} seconds`,
    `Audio: ${episode.audio_url || ''}`,
    '',
    `Transcript chars: ${transcript.transcript_text?.length || 0}`,
    `Speaker turns: ${turns.length}`,
    `Speaker labels: ${speakers.join(', ') || 'none'}`,
    '',
    '## Existing Host Summary Rows',
    '',
    ...(hostSummaries.length
      ? hostSummaries.map((s) => `- ${s.host} (${s.model}, ${s.attribution_method}) futures=${Array.isArray(s.futures) ? s.futures.length : 0}`)
      : ['- None']),
    '',
    `## Diarized Turns${LIMIT_TURNS > 0 ? ` - First ${LIMIT_TURNS}` : ''}`,
    '',
  ];
  for (const u of previewTurns) {
    const start = msToStamp(u.start);
    const end = msToStamp(u.end);
    const stamp = start || end ? ` [${start}${end ? `-${end}` : ''}]` : '';
    lines.push(`### Speaker ${u.speaker || '?'}${stamp}`);
    lines.push('');
    lines.push(String(u.text || '').trim());
    lines.push('');
  }
  return lines.join('\n');
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

  let feedQuery = supabase
    .from('podcast_feeds')
    .select('id, name, expert, needs_diarization');
  if (SHOW) feedQuery = feedQuery.ilike('name', `%${SHOW}%`);
  const { data: feeds, error: fErr } = await feedQuery;
  if (fErr) throw new Error(`load feeds: ${fErr.message}`);
  if (!feeds?.length) throw new Error(SHOW ? `No feed found matching "${SHOW}"` : 'No podcast feeds found');

  const feedIds = feeds.map((f) => f.id);
  const { data: episodes, error: eErr } = await supabase
    .from('podcast_episodes')
    .select('id, feed_id, guid, title, pub_date, audio_url, duration_secs, status')
    .in('feed_id', feedIds)
    .order('pub_date', { ascending: false });
  if (eErr) throw new Error(`load episodes: ${eErr.message}`);

  const selected = (episodes || []).filter(matchesEpisode);
  if (!selected.length) {
    console.log(ALL
      ? `No episodes found${SHOW ? ` for ${SHOW}` : ''}.`
      : `No matching ${SHOW || 'podcast'} episodes found for: ${TERMS.join(', ')}`);
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  const epIds = selected.map((e) => e.id);
  const { data: transcripts, error: tErr } = await supabase
    .from('podcast_transcripts')
    .select('episode_id, transcript_text, transcript_excerpt, speaker_segments, model_used, extraction_model, processed_at')
    .in('episode_id', epIds);
  if (tErr) throw new Error(`load transcripts: ${tErr.message}`);

  const { data: summaries, error: sErr } = await supabase
    .from('podcast_host_summaries')
    .select('episode_id, host, model, attribution_method, futures')
    .in('episode_id', epIds);
  if (sErr) throw new Error(`load host summaries: ${sErr.message}`);

  const transcriptByEpisode = new Map((transcripts || []).map((t) => [t.episode_id, t]));
  const summariesByEpisode = new Map();
  for (const row of summaries || []) {
    if (!summariesByEpisode.has(row.episode_id)) summariesByEpisode.set(row.episode_id, []);
    summariesByEpisode.get(row.episode_id).push(row);
  }

  const manifest = [];
  for (const episode of selected) {
    const feed = feeds.find((f) => f.id === episode.feed_id);
    const transcript = transcriptByEpisode.get(episode.id);
    if (!transcript) {
      console.log(`Skipping ${episode.title}: no transcript row`);
      continue;
    }
    if (ALL && !Array.isArray(transcript.speaker_segments)) {
      console.log(`Skipping ${episode.title}: no speaker_segments array`);
      continue;
    }
    if (ALL && transcript.speaker_segments.length === 0) {
      console.log(`Skipping ${episode.title}: no diarized speaker turns`);
      continue;
    }
    const base = `${String(episode.pub_date || '').slice(0, 10) || 'undated'}-${slugify(feed?.name)}-${slugify(episode.title)}`;
    const jsonPath = path.join(OUT_DIR, `${base}.json`);
    const mdPath = path.join(OUT_DIR, `${base}.md`);
    const hostSummaries = summariesByEpisode.get(episode.id) || [];
    const payload = {
      exported_at: new Date().toISOString(),
      feed,
      episode,
      transcript,
      host_summaries: hostSummaries,
    };
    await writeFile(jsonPath, JSON.stringify(payload, null, 2));
    await writeFile(mdPath, renderMarkdown({ episode, feed, transcript, hostSummaries }));
    manifest.push({
      episode_id: episode.id,
      title: episode.title,
      pub_date: episode.pub_date,
      json: jsonPath,
      markdown: mdPath,
      transcript_chars: transcript.transcript_text?.length || 0,
      speaker_segments: Array.isArray(transcript.speaker_segments) ? transcript.speaker_segments.length : 0,
    });
    console.log(`Wrote ${jsonPath}`);
    console.log(`Wrote ${mdPath}`);
  }
  await writeFile(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nExported ${manifest.length} episode(s) to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
