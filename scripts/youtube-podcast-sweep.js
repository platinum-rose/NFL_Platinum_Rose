#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { isNflRelevantEpisode } from '../agents/lib/nfl-relevance.js';
import {
  DEFAULT_CLIENT_PATH,
  DEFAULT_TOKEN_PATH,
  getAccessToken,
  readJson,
  writeJson,
  youtubeGet
} from './lib/youtube-oauth.js';

const ROOT = process.cwd();
const SOURCE_CONFIG_PATH = path.join(ROOT, 'config', 'youtube-podcast-sources.local.json');
const STATE_PATH = path.join(ROOT, 'data', 'podcasts', 'youtube-discovery-state.json');
const CANDIDATES_PATH = path.join(ROOT, 'data', 'podcasts', 'youtube-discovery-candidates-2026.json');
const SHADOW_OBS_DIR = path.join(ROOT, 'data', 'shadow-harness', 'observations');
const SHADOW_REPORT_DIR = path.join(ROOT, 'data', 'shadow-harness', 'reports');

function argValue(name, fallback = null) {
  const idx = process.argv.indexOf(name);
  return idx === -1 ? fallback : process.argv[idx + 1];
}

function argValues(name) {
  const values = [];
  for (let i = 0; i < process.argv.length; i += 1) {
    if (process.argv[i] === name && i + 1 < process.argv.length) values.push(process.argv[i + 1]);
  }
  return values;
}

const args = new Set(process.argv.slice(2));
const useAllCandidates = args.has('--all-candidates');
const runGemini = args.has('--run-gemini');
const rescan = args.has('--rescan');
const includeShorts = args.has('--include-shorts');
const scoreOnly = args.has('--score-only');
const runSavedFutures = args.has('--run-saved-futures');
const skipExisting = args.has('--skip-existing');
const noChannelSweep = args.has('--no-channel-sweep') || args.has('--urls-only');
const maxPerRun = Number(argValue('--max-per-run', 5));
const maxPerChannel = Number(argValue('--max-per-channel', 0));
const lookbackDays = Number(argValue('--lookback-days', 14));
const minDurationMinutes = Number(argValue('--min-duration-minutes', 10));
const geminiScope = argValue('--gemini-scope', 'futures');
const minFuturesScore = Number(argValue('--min-futures-score', 3));
const clientPath = argValue('--client', DEFAULT_CLIENT_PATH);
const tokenPath = argValue('--token', DEFAULT_TOKEN_PATH);
const segmentSeconds = Number(argValue('--segment-seconds', 0));
const maxRetries = Number(argValue('--max-retries', 0));
const retryDelaySeconds = Number(argValue('--retry-delay-seconds', 20));
const explicitUrls = [
  ...argValues('--url'),
  ...argValues('--urls').flatMap(value => String(value).split(/[\s,]+/)),
].map(value => value.trim()).filter(Boolean);
const explicitPlaylistIds = [
  ...argValues('--playlist-id'),
  ...argValues('--playlist-ids').flatMap(value => String(value).split(/[\s,]+/)),
  ...argValues('--playlist-url').map(extractYouTubePlaylistId),
  ...argValues('--playlist-urls').flatMap(value => String(value).split(/[\s,]+/)).map(extractYouTubePlaylistId),
].filter(Boolean).map(value => value.trim());
const onlyCandidateIds = new Set([
  ...argValues('--only-id'),
  ...argValues('--only-ids').flatMap(value => String(value).split(/[\s,]+/)),
].map(value => value.trim()).filter(Boolean).map(value => (
  value.startsWith('youtube-') ? value : `youtube-${value}`
)));

const FUTURES_SCORE_RULES = [
  { score: 6, label: 'explicit futures', patterns: ['futures', 'future bets', 'futures card'] },
  { score: 5, label: 'season markets', patterns: ['win total', 'win totals', 'division winner', 'division winners', 'make the playoffs', 'playoff predictions', 'super bowl'] },
  { score: 5, label: 'awards markets', patterns: [' mvp', 'rookie of the year', 'offensive player of the year', 'defensive player of the year', 'coach of the year', 'award sleepers'] },
  { score: 4, label: 'betting slate', patterns: ['best bets', 'betting picks', 'betting predictions', 'betting preview', 'longshot', 'long shot', 'sleeper bet'] },
  { score: 3, label: 'season-long intel', patterns: ['training camp', 'injury storylines', 'season preview', 'nfl season', 'schedule release', 'quarterback rankings', 'top 10 quarterbacks', 'top 10 nfl starting quarterbacks', 'top 20 nfl quarterbacks', 'greatest qbs', 'nfl receiving rooms', 'coaching changes', 'offseason moves'] },
  { score: 2, label: 'team/player context', patterns: ['nfc north', 'afc ', 'nfc ', 'chiefs', 'broncos', 'texans', 'giants', 'cardinals', 'starting quarterback'] }
];

const QB_LIST_SUBJECTS = [
  ['Josh Allen', ['Josh Allen', 'Allen']],
  ['Lamar Jackson', ['Lamar Jackson', 'Lamar']],
  ['Joe Burrow', ['Joe Burrow', 'Burrow']],
  ['Patrick Mahomes', ['Patrick Mahomes', 'Mahomes']],
  ['Matthew Stafford', ['Matthew Stafford', 'Stafford']],
  ['Drake Maye', ['Drake Maye', 'Maye']],
  ['Dak Prescott', ['Dak Prescott', 'Dak']],
  ['Jordan Love', ['Jordan Love']],
  ['Justin Herbert', ['Justin Herbert', 'Herbert']],
  ['Caleb Williams', ['Caleb Williams']],
  ['Brock Purdy', ['Brock Purdy', 'Purdy']],
  ['Jalen Hurts', ['Jalen Hurts', 'Hurts']],
  ['Baker Mayfield', ['Baker Mayfield', 'Baker']],
  ['Trevor Lawrence', ['Trevor Lawrence']],
  ['Jared Goff', ['Jared Goff', 'Goff']],
  ['Sam Darnold', ['Sam Darnold', 'Darnold']]
];

const FANTASY_CONTEXT_PATTERNS = [
  'fantasy football',
  'fantasy qb',
  'fantasy flex',
  'mock draft',
  'dynasty',
  'adp',
  'draft strategy',
  'auction draft',
  'best ball',
  'waiver',
  'start sit',
  'sleepers, breakouts',
  'breakouts & busts',
  'tiers unveiled',
  'tiers explained',
  'draft board'
];

const TEAM_FIXUPS = {
  LOS: 'LAC'
};

const YES_NO_MARKETS = new Set([
  'division_winner',
  'conference_winner',
  'conference_no_1_seed',
  'super_bowl_winner',
  'mvp',
  'opoy',
  'dpoy',
  'oroy',
  'droy',
  'coach_of_the_year',
  'no_1_overall_pick'
]);

function slugifyVideo(videoId) {
  return `youtube-${videoId}`;
}

function extractYouTubeVideoId(raw) {
  const value = String(raw || '').trim();
  if (!value) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || null;
    if (host.endsWith('youtube.com')) {
      if (url.pathname === '/watch') return url.searchParams.get('v');
      const shorts = url.pathname.match(/^\/shorts\/([A-Za-z0-9_-]{11})/);
      if (shorts) return shorts[1];
      const embed = url.pathname.match(/^\/embed\/([A-Za-z0-9_-]{11})/);
      if (embed) return embed[1];
    }
  } catch {
    return null;
  }
  return null;
}

function extractYouTubePlaylistId(raw) {
  const value = String(raw || '').trim();
  if (!value) return null;
  if (/^[A-Za-z0-9_-]{12,}$/.test(value) && !/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    return url.searchParams.get('list');
  } catch {
    return null;
  }
}

function normalizeUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function parseRawModelResponse(observation) {
  const raw = observation?.run?.raw_model_response || observation?.raw_model_response;
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function textHasAlias(text, alias) {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
}

function rankedQbCompletenessIssue(candidate, observation) {
  const title = String(candidate.title || '');
  if (!/\btop\s*10\b/i.test(title) || !/\b(qbs?|quarterbacks?)\b/i.test(title)) return null;

  const payload = parseRawModelResponse(observation);
  const speakerSegments = payload?.speaker_segments || [];
  const transcriptText = speakerSegments.map(segment => segment.text || '').join('\n');
  if (!transcriptText.trim()) return null;

  const structuredText = JSON.stringify({
    extracted_picks: observation?.run?.extracted_picks || [],
    analysis_notes: observation?.run?.analysis_notes || []
  });

  const discussedSubjects = QB_LIST_SUBJECTS
    .filter(([, aliases]) => aliases.some(alias => textHasAlias(transcriptText, alias)))
    .map(([name]) => name);
  const structuredSubjects = QB_LIST_SUBJECTS
    .filter(([, aliases]) => aliases.some(alias => textHasAlias(structuredText, alias)))
    .map(([name]) => name);

  if (discussedSubjects.length < 10) return null;
  const requiredStructuredSubjects = Math.max(8, Math.ceil(discussedSubjects.length * 0.75));
  if (structuredSubjects.length >= requiredStructuredSubjects) return null;

  const missingSubjects = discussedSubjects.filter(name => !structuredSubjects.includes(name));
  return [
    `ranked QB list coverage incomplete: raw transcript references ${discussedSubjects.length} QB subjects`,
    `but structured picks/notes cover ${structuredSubjects.length}`,
    `missing ${missingSubjects.slice(0, 10).join(', ')}`
  ].join('; ');
}

function parseIsoDurationSeconds(raw) {
  const match = String(raw || '').match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;
  const [, days = 0, hours = 0, minutes = 0, seconds = 0] = match.map(v => Number(v || 0));
  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

function normalizeExtractedMarket(raw) {
  const clean = String(raw || 'general').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (clean.includes('win_total') || clean === 'wins' || clean.includes('season_win')) return 'win_total';
  if (clean.includes('make_playoff') || clean === 'playoffs') return 'make_playoffs';
  if (clean.includes('division_winner') || clean.includes('division_champion') || clean.includes('division_champ') || clean.includes('afc_south_champ')) return 'division_winner';
  if (clean.includes('conference_no_1_seed') || clean.includes('no_1_seed') || clean.includes('number_1_seed') || clean.includes('number_one_seed')) return 'conference_no_1_seed';
  if (clean.includes('super_bowl')) return 'super_bowl_winner';
  if (clean.includes('conference_champion') || clean.includes('conference_winner') || clean.includes('nfc_conference') || clean.includes('afc_conference') || clean.includes('nfc_champion') || clean.includes('afc_champion')) return 'conference_winner';
  if (clean.includes('overall_pick') || clean.includes('no_1_overall') || clean.includes('number_1_overall')) return 'no_1_overall_pick';
  if (clean.includes('mvp') || clean.includes('most_valuable_player')) return 'mvp';
  if (clean === 'opoy' || clean.includes('offensive_player_of_the_year')) return 'opoy';
  if (clean === 'dpoy' || clean.includes('defensive_player_of_the_year')) return 'dpoy';
  if (clean === 'oroy' || clean.includes('offensive_rookie_of_the_year')) return 'oroy';
  if (clean === 'droy' || clean.includes('defensive_rookie_of_the_year')) return 'droy';
  if (clean.includes('coach_of_the_year')) return 'coach_of_the_year';
  // Mirrored from build-youtube-futures-intel-review.js during the "fix now"
  // pass (Phase 4 manual quality read): these raw slugs were falling through
  // to the generic `return clean` with no canonical name.
  if (clean.includes('comeback_player')) return 'comeback_player_of_the_year';
  if (clean.includes('fewest_win')) return 'fewest_wins';
  if (clean.includes('receiving_yard')) return 'season_receiving_yards';
  if (clean.includes('passing_yard')) return 'season_passing_yards';
  if (clean.includes('passing_touchdown') || clean.includes('passing_td')) return 'season_passing_tds';
  if (clean.includes('interception')) return 'interceptions_leader';
  if (clean.includes('rushing_touchdown') && clean.includes('leader')) return 'rushing_tds_leader';
  if (clean.includes('rushing_touchdown') || clean.includes('rushing_td')) return 'season_rushing_tds';
  return clean;
}

function normalizeExtractedSide(raw, market, team = null) {
  const clean = String(raw || 'UNKNOWN').trim().toUpperCase();
  // Mirrored fix 2026-07-28 (see gemini-podcast-shadow-harness.js /
  // build-youtube-futures-intel-review.js same-day comments): Gemini often
  // puts the picked team's own code in `side` for YES/NO markets rather than
  // a literal YES token -- short-circuit that case before any substring
  // heuristics run, confirmed necessary by a direct scan of all 13 real
  // processed episodes (11/85 picks, 13%, had a wrong side value).
  if (YES_NO_MARKETS.has(market) && team && clean === String(team).toUpperCase()) return 'YES';
  if (YES_NO_MARKETS.has(market) && (clean === 'UNKNOWN' || clean.includes('OVER') || clean.includes('WIN') || clean.includes('YES') || clean.includes('TO WIN'))) return 'YES';
  if (YES_NO_MARKETS.has(market) && (clean.includes('NO') || clean.includes('UNDER') || clean.includes('FADE'))) return 'NO';
  // Bug fix mirrored from build-youtube-futures-intel-review.js: "UNKNOWN"
  // contains the substring "NO", so the .includes('NO') fallback below was
  // silently mis-classifying every missing/null side as "NO" for markets
  // outside YES_NO_MARKETS (e.g. survivor_pick/pickem_pick with side: null).
  if (clean === 'UNKNOWN') return 'UNKNOWN';
  if (clean.includes('OVER')) return 'OVER';
  if (clean.includes('UNDER')) return 'UNDER';
  if (clean.includes('YES') || clean.includes('WIN')) return 'YES';
  if (clean.includes('NO')) return 'NO';
  return clean;
}

function normalizeExtractedPick(p) {
  const market = normalizeExtractedMarket(p.market);
  const team = TEAM_FIXUPS[String(p.team || '').toUpperCase()] || p.team;
  return {
    ...p,
    team,
    market,
    side: normalizeExtractedSide(p.side || p.selection, market, team),
    line: p.line != null && p.line !== '' ? Number(p.line) : null,
    price: p.price != null && p.price !== '' ? Number(p.price) : null,
    source_timestamp: Number(p.source_timestamp || p.timestamp || 0)
  };
}

function textIncludes(text, pattern) {
  return text.includes(pattern);
}

function scoreFuturesIntel(title) {
  const text = ` ${String(title || '').toLowerCase()} `;
  const reasons = [];
  let score = 0;

  for (const rule of FUTURES_SCORE_RULES) {
    const matched = rule.patterns.filter(pattern => textIncludes(text, pattern));
    if (matched.length > 0) {
      score += rule.score;
      reasons.push(`${rule.label}: ${matched.join(', ')}`);
    }
  }

  const fantasyMatches = FANTASY_CONTEXT_PATTERNS.filter(pattern => textIncludes(text, pattern));
  const hasStrongFuturesSignal = score >= 5;
  if (fantasyMatches.length > 0 && !hasStrongFuturesSignal) {
    score -= 4;
    reasons.push(`fantasy lane penalty: ${fantasyMatches.join(', ')}`);
  }

  const normalizedScore = Math.max(0, score);
  let lane = 'general_nfl';
  if (fantasyMatches.length > 0 && !hasStrongFuturesSignal) lane = 'fantasy';
  if (normalizedScore >= minFuturesScore && lane !== 'fantasy') lane = 'futures_intel';

  return {
    score: normalizedScore,
    lane,
    gemini_futures_eligible: lane === 'futures_intel',
    reasons
  };
}

function loadExistingCandidates() {
  if (!fs.existsSync(CANDIDATES_PATH)) {
    return {
      generated_at: new Date().toISOString(),
      status: 'candidate_only',
      guardrail: 'Local YouTube discovery candidates only. Do not treat as ingested transcripts, official recommendations, or production betting intel until explicitly promoted.',
      episodes: []
    };
  }
  return readJson(CANDIDATES_PATH);
}

function loadState() {
  if (!fs.existsSync(STATE_PATH)) {
    return { seen_video_ids: [], last_sweep_at: null };
  }
  return readJson(STATE_PATH);
}

function selectChannels(config) {
  const candidates = config.candidate_channels || [];
  const include = new Set(config.include_channel_ids || []);
  if (useAllCandidates) return candidates;
  if (include.size === 0) return [];
  return candidates.filter(channel => include.has(channel.channel_id));
}

async function listChannelUploads(channelId, accessToken) {
  const channels = await youtubeGet('channels', {
    part: 'contentDetails,snippet',
    id: channelId,
    maxResults: 1
  }, accessToken);
  const channel = channels.items?.[0];
  const uploadsPlaylistId = channel?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) return [];

  const videos = [];
  let pageToken = '';
  for (let page = 0; page < 2; page += 1) {
    const pageJson = await youtubeGet('playlistItems', {
      part: 'snippet,contentDetails',
      playlistId: uploadsPlaylistId,
      maxResults: 50,
      pageToken
    }, accessToken);
    videos.push(...(pageJson.items || []));
    pageToken = pageJson.nextPageToken || '';
    if (!pageToken) break;
  }

  const mapped = videos.map(item => ({
    video_id: item.contentDetails?.videoId || item.snippet?.resourceId?.videoId,
    title: item.snippet?.title || '',
    description: item.snippet?.description || '',
    published_at: item.contentDetails?.videoPublishedAt || item.snippet?.publishedAt || null,
    channel_id: channelId,
    channel_title: channel.snippet?.title || item.snippet?.channelTitle || ''
  })).filter(video => video.video_id);

  return hydrateVideoDetails(mapped, accessToken);
}

async function listPlaylistVideos(playlistId, accessToken) {
  const videos = [];
  let pageToken = '';
  for (let page = 0; page < 2; page += 1) {
    const pageJson = await youtubeGet('playlistItems', {
      part: 'snippet,contentDetails',
      playlistId,
      maxResults: 50,
      pageToken
    }, accessToken);
    videos.push(...(pageJson.items || []));
    pageToken = pageJson.nextPageToken || '';
    if (!pageToken) break;
  }

  const mapped = videos.map(item => ({
    video_id: item.contentDetails?.videoId || item.snippet?.resourceId?.videoId,
    title: item.snippet?.title || '',
    description: item.snippet?.description || '',
    published_at: item.contentDetails?.videoPublishedAt || item.snippet?.publishedAt || null,
    channel_id: item.snippet?.videoOwnerChannelId || item.snippet?.channelId || '',
    channel_title: item.snippet?.videoOwnerChannelTitle || item.snippet?.channelTitle || '',
    playlist_id: playlistId
  })).filter(video => video.video_id);

  return hydrateVideoDetails(mapped, accessToken);
}

async function listVideosById(videoIds, accessToken) {
  const ids = [...new Set(videoIds.filter(Boolean))];
  const videos = [];
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const details = await youtubeGet('videos', {
      part: 'snippet,contentDetails',
      id: batch.join(',')
    }, accessToken);
    for (const item of details.items || []) {
      videos.push({
        video_id: item.id,
        title: item.snippet?.title || '',
        description: item.snippet?.description || '',
        published_at: item.snippet?.publishedAt || null,
        channel_id: item.snippet?.channelId || '',
        channel_title: item.snippet?.channelTitle || '',
        duration_seconds: parseIsoDurationSeconds(item.contentDetails?.duration)
      });
    }
  }
  return videos;
}

async function hydrateVideoDetails(mapped, accessToken) {
  const detailsById = new Map();
  for (let i = 0; i < mapped.length; i += 50) {
    const batch = mapped.slice(i, i + 50);
    const details = await youtubeGet('videos', {
      part: 'contentDetails',
      id: batch.map(video => video.video_id).join(',')
    }, accessToken);
    for (const item of details.items || []) {
      detailsById.set(item.id, item);
    }
  }

  return mapped.map(video => {
    const details = detailsById.get(video.video_id);
    return {
      ...video,
      duration_seconds: parseIsoDurationSeconds(details?.contentDetails?.duration)
    };
  });
}

function toCandidate(video, { source = 'channel_upload' } = {}) {
  const id = slugifyVideo(video.video_id);
  return withFuturesScoring({
    id,
    show: video.channel_title || 'YouTube',
    date: (video.published_at || '').slice(0, 10) || 'unknown',
    title: video.title,
    url: normalizeUrl(video.video_id),
    source_url: normalizeUrl(video.video_id),
    channel_id: video.channel_id,
    playlist_id: video.playlist_id || null,
    published_at: video.published_at,
    duration_seconds: video.duration_seconds,
    mapping_status: 'unmapped',
    notes: source === 'explicit_url'
      ? 'Explicitly queued from supplied YouTube URL; local candidate only.'
      : source === 'playlist'
        ? 'Auto-discovered from configured/supplied YouTube playlist; local candidate only.'
        : 'Auto-discovered from subscribed YouTube channel; local candidate only.'
  });
}

function withFuturesScoring(candidate) {
  const futures = scoreFuturesIntel(candidate.title);
  return {
    ...candidate,
    content_lane: futures.lane,
    futures_score: futures.score,
    futures_score_reasons: futures.reasons,
    gemini_futures_eligible: futures.gemini_futures_eligible
  };
}

function mergeCandidates(existing, additions) {
  const byId = new Map((existing.episodes || []).map(ep => [ep.id, withFuturesScoring(ep)]));
  for (const candidate of additions) {
    if (!byId.has(candidate.id)) byId.set(candidate.id, withFuturesScoring(candidate));
  }
  return {
    ...existing,
    generated_at: new Date().toISOString(),
    episodes: [...byId.values()]
  };
}

function filterSweepVideos(videos, { seen, cutoffMs }) {
  return videos.filter(video => {
    const publishedMs = video.published_at ? Date.parse(video.published_at) : 0;
    if (publishedMs && publishedMs < cutoffMs) return false;
    if (!rescan && seen.has(video.video_id)) return false;
    if (!includeShorts && video.duration_seconds !== null && video.duration_seconds < minDurationMinutes * 60) return false;
    if (!isNflRelevantEpisode(video.title)) return false;
    return true;
  });
}

function roundRobinBuckets(buckets, limit) {
  const selected = [];
  const maxDepth = Math.max(0, ...buckets.map(bucket => bucket.length));
  for (let idx = 0; idx < maxDepth; idx += 1) {
    for (const bucket of buckets) {
      if (bucket[idx]) selected.push(bucket[idx]);
      if (limit > 0 && selected.length >= limit) return selected;
    }
  }
  return selected;
}

function runGeminiForCandidate(candidate) {
  const startedAtMs = Date.now();
  const args = [
    'scripts/gemini-podcast-shadow-harness.js',
    '--episode', candidate.id,
    '--live-youtube',
    '--youtube-url', candidate.url
  ];
  if (candidate.duration_seconds) {
    args.push('--duration-seconds', String(Math.round(candidate.duration_seconds)));
  }
  if (segmentSeconds > 0) {
    args.push('--segment-seconds', String(Math.round(segmentSeconds)));
  }
  if (maxRetries > 0) {
    args.push('--max-retries', String(Math.round(maxRetries)));
    args.push('--retry-delay-seconds', String(Math.round(retryDelaySeconds)));
  }

  const result = spawnSync(process.execPath, args, {
    cwd: ROOT,
    stdio: 'inherit'
  });

  const observation = loadFreshObservation(candidate, startedAtMs);
  if (!observation) {
    return {
      candidate,
      status: 'failed',
      exit_status: result.status,
      reason: `No fresh observation was saved for ${candidate.id}. Gemini may have failed before extraction completed.`
    };
  }

  const reprocessReason = observationReprocessReason(candidate, observation);
  if (reprocessReason) {
    persistObservationReprocess(candidate, observation, reprocessReason);
    return {
      candidate,
      observation,
      status: 'reprocess_required',
      exit_status: result.status,
      reason: reprocessReason
    };
  }

  if (result.status !== 0) {
    return {
      candidate,
      observation,
      status: 'failed',
      exit_status: result.status,
      reason: `Extractor exited with status ${result.status}.`
    };
  }

  return {
    candidate,
    observation,
    status: 'complete',
    exit_status: result.status,
    reason: null
  };
}

function loadObservation(candidate) {
  const obsPath = path.join(SHADOW_OBS_DIR, `${candidate.id}-shadow-youtube.json`);
  if (!fs.existsSync(obsPath)) return null;
  const observation = readJson(obsPath);
  observation.run = observation.run || {};
  observation.run.extracted_picks = (observation.run.extracted_picks || []).map(normalizeExtractedPick);
  return observation;
}

function loadFreshObservation(candidate, startedAtMs) {
  const obsPath = path.join(SHADOW_OBS_DIR, `${candidate.id}-shadow-youtube.json`);
  if (!fs.existsSync(obsPath)) return null;
  const stat = fs.statSync(obsPath);
  if (stat.mtimeMs + 1000 < startedAtMs) return null;
  return loadObservation(candidate);
}

function persistObservationReprocess(candidate, observation, reason) {
  observation.reprocess_required = true;
  observation.reprocess_reason = reason;
  observation.quality_flags = [...new Set([
    ...(observation.quality_flags || []),
    reason.includes('ranked QB list coverage incomplete') ? 'ranked_qb_list_coverage_incomplete' : 'reprocess_required'
  ])];
  const obsPath = path.join(SHADOW_OBS_DIR, `${candidate.id}-shadow-youtube.json`);
  writeJson(obsPath, observation);
}

function observationReprocessReason(candidate, observation) {
  if (observation?.reprocess_required === true) {
    return observation.reprocess_reason || 'Observation requires reprocess.';
  }
  const knownDuration = Number(candidate.duration_seconds || 0);
  const coverage = observation?.run?.coverage_assessment || observation?.coverage_assessment || {};
  if (coverage.suspected_incomplete === true) return coverage.reason || 'Gemini coverage was incomplete.';

  const rankedListIssue = rankedQbCompletenessIssue(candidate, observation);
  if (rankedListIssue) return rankedListIssue;

  if (!knownDuration) return null;

  const durationUsed = Number(coverage.duration_used_for_check || 0);
  if (durationUsed > 0 && durationUsed < knownDuration * 0.85) {
    return `coverage check used ${durationUsed}s, but YouTube metadata says the video is ${knownDuration}s`;
  }
  const lastCovered = Number(coverage.last_covered_timestamp || 0);
  if (lastCovered > 0 && lastCovered < knownDuration * 0.85) {
    return `last covered timestamp ${lastCovered}s is short of known video duration ${knownDuration}s`;
  }
  return null;
}

function observationNeedsReprocess(candidate, observation) {
  return Boolean(observationReprocessReason(candidate, observation));
}

function hasObservation(candidate) {
  const obsPath = path.join(SHADOW_OBS_DIR, `${candidate.id}-shadow-youtube.json`);
  if (!fs.existsSync(obsPath)) return false;
  const observation = readJson(obsPath);
  return !observationNeedsReprocess(candidate, observation);
}

function writeGeminiBatchReport(runResults, { label = 'saved-futures' } = {}) {
  const queueRuns = runResults
    .map(result => result.observation)
    .filter(Boolean);
  const reprocessRows = runResults.filter(result => result.status === 'reprocess_required');
  const failedRows = runResults.filter(result => result.status === 'failed');
  const completeRows = runResults.filter(result => result.status === 'complete');
  const totalCostUsd = queueRuns.reduce((sum, row) => sum + Number(row.run?.estimated_cost_usd || 0), 0);
  const totalLatencyMs = queueRuns.reduce((sum, row) => sum + Number(row.run?.latency_ms || 0), 0);
  const usableRuns = completeRows
    .map(result => result.observation)
    .filter(Boolean);
  const totalPicks = usableRuns.reduce((sum, row) => sum + (row.run?.extracted_picks || []).length, 0);
  const scoredResults = usableRuns.filter(row => typeof row.scoring?.f1_score_pct === 'number');
  const averageF1 = scoredResults.length
    ? Number((scoredResults.reduce((sum, row) => sum + row.scoring.f1_score_pct, 0) / scoredResults.length).toFixed(2))
    : null;

  const report = {
    evaluated_at: new Date().toISOString(),
    mode: 'live-youtube',
    model: 'gemini-3.5-flash',
    batch_label: label,
    total_candidates_attempted: runResults.length,
    total_episodes_evaluated: usableRuns.length,
    total_episodes_scored: scoredResults.length,
    reprocess_required_count: reprocessRows.length,
    extraction_failure_count: failedRows.length,
    average_f1_score_pct: averageF1,
    total_cost_usd: Number(totalCostUsd.toFixed(6)),
    average_cost_usd: queueRuns.length ? Number((totalCostUsd / queueRuns.length).toFixed(6)) : 0,
    total_latency_ms: totalLatencyMs,
    average_latency_ms: queueRuns.length ? Math.round(totalLatencyMs / queueRuns.length) : 0,
    total_extracted_picks: totalPicks,
    reprocess_queue: reprocessRows.map(result => ({
      episode_slug: result.candidate.id,
      reason: result.reason,
      command: `npm.cmd run youtube:run-futures-candidates -- --only-id ${result.candidate.id} --max-per-run 1 --run-gemini`
    })),
    failed_extractions: failedRows.map(result => ({
      episode_slug: result.candidate.id,
      reason: result.reason,
      exit_status: result.exit_status
    })),
    queue_runs: queueRuns
  };

  fs.mkdirSync(SHADOW_REPORT_DIR, { recursive: true });
  const safeStamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(SHADOW_REPORT_DIR, `${label}-gemini-batch-report-${safeStamp}.json`);
  const latestPath = path.join(SHADOW_REPORT_DIR, `${label}-gemini-batch-report-latest.json`);
  writeJson(reportPath, report);
  writeJson(latestPath, report);
  return { reportPath, latestPath, report };
}

function shouldRunGemini(candidate) {
  if (geminiScope === 'all') return true;
  if (geminiScope === 'futures') return candidate.gemini_futures_eligible === true;
  if (geminiScope === 'none') return false;
  throw new Error(`Unsupported --gemini-scope value: ${geminiScope}. Use futures, all, or none.`);
}

async function main() {
if (!fs.existsSync(SOURCE_CONFIG_PATH)) {
  throw new Error(`Missing source config. Run npm.cmd run youtube:discover-account first: ${SOURCE_CONFIG_PATH}`);
}

const sourceConfig = readJson(SOURCE_CONFIG_PATH);
const channels = selectChannels(sourceConfig);

if (scoreOnly) {
  const rescored = mergeCandidates(loadExistingCandidates(), []);
  writeJson(CANDIDATES_PATH, rescored);
  const counts = rescored.episodes.reduce((acc, episode) => {
    acc[episode.content_lane] = (acc[episode.content_lane] || 0) + 1;
    return acc;
  }, {});
  console.log(`Rescored ${rescored.episodes.length} YouTube candidate(s).`);
  console.log(`Lane counts: ${JSON.stringify(counts)}`);
  console.log(`Saved candidates: ${CANDIDATES_PATH}`);
  return;
}

if (runSavedFutures) {
  const candidates = mergeCandidates(loadExistingCandidates(), []);
  let runnable = candidates.episodes
    .filter(shouldRunGemini)
    .filter(candidate => onlyCandidateIds.size === 0 || onlyCandidateIds.has(candidate.id))
    .sort((a, b) => (b.futures_score || 0) - (a.futures_score || 0));
  if (skipExisting) {
    const before = runnable.length;
    runnable = runnable.filter(candidate => !hasObservation(candidate));
    console.log(`Skip existing observations: ${before - runnable.length} candidate(s) already complete.`);
  }
  runnable = runnable.slice(0, maxPerRun);

  console.log(`Saved futures candidate runner selected ${runnable.length} candidate(s) with scope=${geminiScope}.`);
  for (const candidate of runnable) {
    console.log(`  score=${candidate.futures_score} ${candidate.id} | ${candidate.title}`);
  }

  if (runGemini) {
    console.log('Running Gemini live-youtube extraction for saved candidates...');
    const runResults = [];
    for (const candidate of runnable) {
      const runResult = runGeminiForCandidate(candidate);
      runResults.push(runResult);
      if (runResult.status === 'reprocess_required') {
        console.error(`Reprocess required for ${candidate.id}: ${runResult.reason}`);
      } else if (runResult.status === 'failed') {
        console.error(`Extraction failed for ${candidate.id}: ${runResult.reason}`);
      }
    }
    const { latestPath, report } = writeGeminiBatchReport(runResults, { label: 'saved-futures' });
    console.log(`Saved aggregate Gemini batch report: ${latestPath}`);
    console.log(`Aggregate: attempted=${report.total_candidates_attempted} complete=${report.total_episodes_evaluated} reprocess=${report.reprocess_required_count} failed=${report.extraction_failure_count} picks=${report.total_extracted_picks} cost=$${report.total_cost_usd} avg_latency=${report.average_latency_ms}ms`);
    if (report.reprocess_required_count > 0 || report.extraction_failure_count > 0) process.exitCode = 2;
  } else {
    console.log('Preview only. Add --run-gemini to execute live Gemini extraction calls.');
  }
  return;
}

const state = loadState();
const seen = new Set(state.seen_video_ids || []);
const cutoffMs = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
const accessToken = await getAccessToken({ clientPath, tokenPath });

const explicitVideoIds = explicitUrls.map(extractYouTubeVideoId).filter(Boolean);
const invalidExplicitUrls = explicitUrls.filter(value => !extractYouTubeVideoId(value));
if (invalidExplicitUrls.length > 0) {
  console.warn(`Warning: ignored ${invalidExplicitUrls.length} URL(s) without a YouTube video id.`);
}

const explicitVideos = explicitVideoIds.length > 0
  ? await listVideosById(explicitVideoIds, accessToken)
  : [];
const explicitCandidates = explicitVideos.map(video => toCandidate(video, { source: 'explicit_url' }));

const playlistIds = [...new Set([
  ...(sourceConfig.include_playlist_ids || []),
  ...explicitPlaylistIds,
])];
const playlistCandidates = [];
for (const playlistId of playlistIds) {
  const playlistVideos = await listPlaylistVideos(playlistId, accessToken);
  const eligible = filterSweepVideos(playlistVideos, { seen, cutoffMs })
    .slice(0, maxPerChannel > 0 ? maxPerChannel : maxPerRun);
  playlistCandidates.push(...eligible.map(video => toCandidate(video, { source: 'playlist' })));
}

const channelBuckets = [];
if (!noChannelSweep) {
  const fairPerChannelLimit = maxPerChannel > 0
    ? maxPerChannel
    : Math.max(1, Math.ceil(maxPerRun / Math.max(channels.length, 1)));
  for (const channel of channels) {
    const videos = await listChannelUploads(channel.channel_id, accessToken);
    const eligible = filterSweepVideos(videos, { seen, cutoffMs }).slice(0, fairPerChannelLimit);
    channelBuckets.push(eligible.map(video => toCandidate(video)));
  }
}

const channelCandidates = noChannelSweep ? [] : roundRobinBuckets(channelBuckets, maxPerRun);
const discovered = [...explicitCandidates, ...playlistCandidates, ...channelCandidates];
const candidates = mergeCandidates(loadExistingCandidates(), discovered);
writeJson(CANDIDATES_PATH, candidates);
writeJson(STATE_PATH, {
  last_sweep_at: new Date().toISOString(),
  seen_video_ids: [...new Set([
    ...seen,
    ...discovered.map(item => item.id.replace(/^youtube-/, ''))
  ])]
});

console.log(`YouTube podcast sweep checked ${noChannelSweep ? 0 : channels.length} channel(s) and ${playlistIds.length} playlist(s).`);
console.log(`Explicit YouTube URL candidates queued: ${explicitCandidates.length}`);
console.log(`New NFL-relevant candidate videos: ${discovered.length}`);
console.log(`Saved candidates: ${CANDIDATES_PATH}`);

if (runGemini) {
  const runnable = discovered.filter(shouldRunGemini);
  console.log(`Running Gemini live-youtube extraction for ${runnable.length} candidate(s) with scope=${geminiScope}...`);
  const runResults = [];
  for (const candidate of runnable) {
    const runResult = runGeminiForCandidate(candidate);
    runResults.push(runResult);
    if (runResult.status === 'reprocess_required') {
      console.error(`Reprocess required for ${candidate.id}: ${runResult.reason}`);
    } else if (runResult.status === 'failed') {
      console.error(`Extraction failed for ${candidate.id}: ${runResult.reason}`);
    }
  }
  const { latestPath, report } = writeGeminiBatchReport(runResults, { label: 'youtube-sweep' });
  console.log(`Saved aggregate Gemini batch report: ${latestPath}`);
  console.log(`Aggregate: attempted=${report.total_candidates_attempted} complete=${report.total_episodes_evaluated} reprocess=${report.reprocess_required_count} failed=${report.extraction_failure_count} picks=${report.total_extracted_picks} cost=$${report.total_cost_usd} avg_latency=${report.average_latency_ms}ms`);
  if (report.reprocess_required_count > 0 || report.extraction_failure_count > 0) process.exitCode = 2;
} else {
  console.log('Gemini not run. Add --run-gemini when you want live extraction calls.');
  console.log(`Futures-eligible among new candidates: ${discovered.filter(item => item.gemini_futures_eligible).length}`);
}
}

export {
  extractYouTubePlaylistId,
  extractYouTubeVideoId,
  roundRobinBuckets,
  scoreFuturesIntel,
};

// Windows drive-letter-casing fix (see agents/fantasy-value-report.js for full note) —
// compare via pathToFileURL, not path.resolve() === fileURLToPath().
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(err => {
    console.error(err.stack || err.message);
    process.exit(1);
  });
}
