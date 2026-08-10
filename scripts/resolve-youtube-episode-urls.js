#!/usr/bin/env node
// scripts/resolve-youtube-episode-urls.js
// ═══════════════════════════════════════════════════════════════════════════════
// Phase 5 step 1 of docs/PODCAST_HOLISTIC_INTEL_EXTRACTION_PLAN.md.
//
// Automates YouTube URL resolution for RSS-ingested podcast_episodes rows, so
// agents/podcast-gemini-intel.js has a real video URL to run Gemini
// --live-youtube extraction against. For each podcast_feeds row with a known
// YouTube channel mapping (config/podcast-feed-youtube-channels.json), lists
// that channel's uploads (OAuth-wired via scripts/lib/youtube-oauth.js, same
// call shape as listChannelUploads() in scripts/youtube-podcast-sweep.js —
// duplicated here rather than imported, since that script executes its whole
// CLI flow at module scope and isn't safe to import as a library) and
// fuzzy-matches (fuzzball.token_set_ratio) each unmatched episode's title
// against the channel's video titles, requiring the match to also land within
// a configurable publish-date window of the episode's pub_date.
//
// SAFE BY DEFAULT: dry-run unless --apply is passed. A wrong automated match
// here would silently misattribute a real YouTube video (and therefore a real
// Gemini extraction) to the wrong episode in production — same class of
// mistake flagged in ATLAS's own lessons-learned (never fabricate an
// unverified match). Always review the dry-run table before --apply.
//
// Episodes with no confident match are left with youtube_url = null and keep
// flowing through the existing GPT-4o/AssemblyAI pipeline (agents/podcast-
// ingest.js) untouched — this is the documented fallback, not an error.
//
// Usage:
//   node scripts/resolve-youtube-episode-urls.js                    # dry-run, all mapped feeds
//   node scripts/resolve-youtube-episode-urls.js --feed "Sharp or Square"
//   node scripts/resolve-youtube-episode-urls.js --min-score 90 --date-window-days 5
//   node scripts/resolve-youtube-episode-urls.js --apply             # write matches to Supabase
//   node scripts/resolve-youtube-episode-urls.js --apply --limit 5
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Requires: config/youtube-oauth-client.json + data/secrets/youtube-oauth-token.json
//   already set up (npm run youtube:oauth) — silent refresh, no interactive
//   auth needed if a valid refresh_token is already on disk.
// ═══════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { token_set_ratio as tokenSetRatio } from 'fuzzball';
import {
  DEFAULT_CLIENT_PATH,
  DEFAULT_TOKEN_PATH,
  getAccessToken,
  youtubeGet,
} from './lib/youtube-oauth.js';

const ROOT = process.cwd();
const CHANNEL_MAP_PATH = path.join(ROOT, 'config', 'podcast-feed-youtube-channels.json');

const argVal = (name, fallback = null) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const hasFlag = (name) => process.argv.includes(name);

const APPLY = hasFlag('--apply');
const FEED_FILTER = argVal('--feed', null);
const LIMIT = Number(argVal('--limit', '0')) || 0;
const MIN_SCORE = Number(argVal('--min-score', '85'));
const DATE_WINDOW_DAYS = Number(argVal('--date-window-days', '7'));
const clientPath = argVal('--client', DEFAULT_CLIENT_PATH);
const tokenPath = argVal('--token', DEFAULT_TOKEN_PATH);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function normalizeComparableTitle(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Duplicated from scripts/youtube-podcast-sweep.js::listChannelUploads (not
// imported — that script runs its whole CLI flow at module scope). Same
// existing-codebase pattern as the 3 hand-mirrored pick-normalization copies
// flagged in the Phase 4 quality read.

// config/podcast-feed-youtube-channels.json can specify either a known
// channel_id (UC..., 24 chars) or a channel_handle (e.g. "bettingpros",
// with or without the leading @) when the real channel_id hasn't been
// confirmed yet -- resolved here via the YouTube Data API's channels?
// forHandle= lookup so a wrong guessed UC-string is never hardcoded.
async function resolveChannelId(feedMap, accessToken) {
  if (feedMap.channel_id && /^UC[\w-]{22}$/.test(feedMap.channel_id)) {
    return feedMap.channel_id;
  }
  const handle = String(feedMap.channel_handle || feedMap.channel_id || '').replace(/^@/, '');
  if (!handle) return null;
  const res = await youtubeGet('channels', {
    part: 'id,snippet',
    forHandle: `@${handle}`,
    maxResults: 1,
  }, accessToken);
  const found = res.items?.[0];
  if (!found) return null;
  return found.id;
}

async function listChannelUploads(channelId, accessToken) {
  const channels = await youtubeGet('channels', {
    part: 'contentDetails,snippet',
    id: channelId,
    maxResults: 1,
  }, accessToken);
  const channel = channels.items?.[0];
  const uploadsPlaylistId = channel?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) return [];

  const videos = [];
  let pageToken = '';
  for (let page = 0; page < 4; page += 1) {
    const pageJson = await youtubeGet('playlistItems', {
      part: 'snippet,contentDetails',
      playlistId: uploadsPlaylistId,
      maxResults: 50,
      pageToken,
    }, accessToken);
    videos.push(...(pageJson.items || []));
    pageToken = pageJson.nextPageToken || '';
    if (!pageToken) break;
  }

  return videos.map(item => ({
    video_id: item.contentDetails?.videoId || item.snippet?.resourceId?.videoId,
    title: item.snippet?.title || '',
    published_at: item.contentDetails?.videoPublishedAt || item.snippet?.publishedAt || null,
  })).filter(video => video.video_id);
}

function daysBetween(a, b) {
  if (!a || !b) return Infinity;
  const ms = Math.abs(new Date(a).getTime() - new Date(b).getTime());
  return ms / (1000 * 60 * 60 * 24);
}

function bestMatch(episode, videos) {
  const targetTitle = normalizeComparableTitle(episode.title);
  let best = null;
  for (const video of videos) {
    const score = tokenSetRatio(targetTitle, normalizeComparableTitle(video.title));
    const dateDelta = daysBetween(episode.pub_date, video.published_at);
    if (!best || score > best.score) {
      best = { video, score, dateDelta };
    }
  }
  return best;
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  if (!fs.existsSync(CHANNEL_MAP_PATH)) {
    console.error(`❌ Missing ${CHANNEL_MAP_PATH}. See config/podcast-feed-youtube-channels.json.`);
    process.exit(1);
  }

  const channelMap = readJson(CHANNEL_MAP_PATH);
  let feeds = channelMap.feeds || [];
  if (FEED_FILTER) feeds = feeds.filter(f => f.feed_name.toLowerCase() === FEED_FILTER.toLowerCase());
  if (feeds.length === 0) {
    console.log('No mapped feeds to resolve (check --feed spelling or config/podcast-feed-youtube-channels.json).');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  const accessToken = await getAccessToken({ clientPath, tokenPath });

  console.log(`Resolving YouTube URLs for ${feeds.length} feed(s). mode=${APPLY ? 'APPLY' : 'DRY-RUN'} minScore=${MIN_SCORE} dateWindowDays=${DATE_WINDOW_DAYS}`);
  if (channelMap._status) console.log(`⚠️  ${channelMap._status}`);

  let totalMatched = 0, totalUnmatched = 0, totalWritten = 0;
  const uploadsCache = new Map(); // resolved channel_id -> videos[] (2+ feeds can share one channel, e.g. The Favorites + Action Network Sports Betting both post to Action Network's channel)

  for (const feedMap of feeds) {
    const { data: feedRows, error: feedErr } = await supabase
      .from('podcast_feeds')
      .select('id, name')
      .eq('name', feedMap.feed_name);
    if (feedErr || !feedRows?.length) {
      console.log(`\n⚠️  Feed "${feedMap.feed_name}" not found in podcast_feeds — skipping.`);
      continue;
    }
    const feedId = feedRows[0].id;

    let epQuery = supabase
      .from('podcast_episodes')
      .select('id, title, pub_date, youtube_url')
      .eq('feed_id', feedId)
      .is('youtube_url', null)
      .order('pub_date', { ascending: false });
    if (LIMIT) epQuery = epQuery.limit(LIMIT);
    const { data: episodes, error: epErr } = await epQuery;
    if (epErr) {
      console.log(`\n⚠️  Failed to load episodes for "${feedMap.feed_name}": ${epErr.message}`);
      continue;
    }
    if (!episodes?.length) {
      console.log(`\n"${feedMap.feed_name}": no unmatched episodes.`);
      continue;
    }

    const resolvedChannelId = await resolveChannelId(feedMap, accessToken);
    if (!resolvedChannelId) {
      console.log(`\n⚠️  "${feedMap.feed_name}": could not resolve channel_id/channel_handle "${feedMap.channel_id || feedMap.channel_handle}" — skipping.`);
      continue;
    }

    console.log(`\n"${feedMap.feed_name}" (channel: ${feedMap.channel_title}, resolved=${resolvedChannelId}, ${feedMap.confidence}) — ${episodes.length} unmatched episode(s)`);
    if (!uploadsCache.has(resolvedChannelId)) {
      uploadsCache.set(resolvedChannelId, await listChannelUploads(resolvedChannelId, accessToken));
    }
    const videos = uploadsCache.get(resolvedChannelId);
    console.log(`  Listed ${videos.length} channel upload(s).`);

    for (const episode of episodes) {
      const match = bestMatch(episode, videos);
      const confidentDate = match && match.dateDelta <= DATE_WINDOW_DAYS;
      const confident = match && match.score >= MIN_SCORE && confidentDate;

      if (!match) {
        console.log(`  ✗ no candidates: "${episode.title}"`);
        totalUnmatched++;
        continue;
      }

      const url = `https://www.youtube.com/watch?v=${match.video.video_id}`;
      const dateNote = Number.isFinite(match.dateDelta) ? `${match.dateDelta.toFixed(1)}d apart` : 'no pub date';
      if (confident) {
        console.log(`  ✓ score=${match.score} (${dateNote}) "${episode.title}" -> ${url}`);
        totalMatched++;
        if (APPLY) {
          const { error: upErr } = await supabase
            .from('podcast_episodes')
            .update({ youtube_url: url })
            .eq('id', episode.id);
          if (upErr) console.log(`    ❌ write failed: ${upErr.message}`);
          else totalWritten++;
        }
      } else {
        console.log(`  ? low-confidence score=${match.score} (${dateNote}) "${episode.title}" ~ "${match.video.title}" — not applied`);
        totalUnmatched++;
      }
    }
  }

  console.log(`\n📊 Done. confident_matches=${totalMatched} unmatched_or_low_confidence=${totalUnmatched}${APPLY ? ` written=${totalWritten}` : ''}`);
  if (!APPLY) console.log('   [dry-run] no writes performed. Review matches above, then re-run with --apply.');
}

main().catch(err => { console.error(`Fatal: ${err.message}`); process.exit(1); });
