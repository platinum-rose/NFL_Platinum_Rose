#!/usr/bin/env node
/**
 * scripts/gemini-podcast-shadow-harness.js
 * Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
 * Local Gemini Shadow Harness for Podcast Transcription & Pick Extraction Benchmark
 *
 * Supports distinct execution modes:
 *   --simulate    : Fast dry-run mode for testing pipeline mechanics & reporting.
 *   --live-shadow : Real live Gemini 3.5 Flash API call via scripts/run_gemini_live_shadow.py.
 *   --live-youtube: Real Gemini 3.5 Flash API call using a public YouTube URL as video input.
 *                   Saves raw Gemini response separately and scores Gemini's actual
 *                   extracted picks against independent ground truth.
 *
 * Scores exact matches across 7 dimensions:
 *   1. team              (canonical abbreviation, e.g. "BUF")
 *   2. market            (e.g. "win_total", "spread")
 *   3. side              (e.g. "OVER", "UNDER")
 *   4. line              (e.g. 10.5)
 *   5. price             (e.g. -115)
 *   6. speaker           (e.g. "Simon Hunter")
 *   7. source_timestamp  (delta <= 60 seconds)
 *
 * Usage:
 *   node scripts/gemini-podcast-shadow-harness.js --queue --live-shadow
 *   node scripts/gemini-podcast-shadow-harness.js --phase smoke --live-shadow
 *   node scripts/gemini-podcast-shadow-harness.js --episode <slug> --live-youtube
 *   node scripts/gemini-podcast-shadow-harness.js --episode <slug> --live-youtube --youtube-url <watch-url>
 *   node scripts/gemini-podcast-shadow-harness.js --simulate
 * Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// CLI Arguments
const argv = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : fallback;
};

const IS_LIVE_TEXT = argv.includes('--live-shadow');
const IS_LIVE_YOUTUBE = argv.includes('--live-youtube');
const IS_SIMULATE = argv.includes('--simulate') || (!IS_LIVE_TEXT && !IS_LIVE_YOUTUBE);
const RUN_QUEUE = argv.includes('--queue');
const PHASE_ARG = getArg('--phase', null);
const EPISODE_ARG = getArg('--episode', null);
const YOUTUBE_URL_ARG = getArg('--youtube-url', null);

const QUEUE_DOC = path.join(ROOT, 'docs', 'antigravity', 'GEMINI_SHADOW_YOUTUBE_QUEUE.md');
const METADATA_OVERRIDES = path.join(ROOT, 'data', 'podcasts', 'episode-metadata-overrides.json');
const OBS_DIR = path.join(ROOT, 'data', 'shadow-harness', 'observations');
const REPORT_DIR = path.join(ROOT, 'data', 'shadow-harness', 'reports');

const MODEL_NAME = 'gemini-3.5-flash';

const knownLiveFlags = new Set(['--live-shadow', '--live-youtube']);
const unknownLiveFlags = argv.filter(arg => arg.startsWith('--live-') && !knownLiveFlags.has(arg));
if (unknownLiveFlags.length > 0) {
  console.error(`Unknown live mode flag(s): ${unknownLiveFlags.join(', ')}`);
  console.error('Supported modes: --simulate, --live-shadow, --live-youtube');
  process.exit(1);
}

const selectedModes = [
  IS_SIMULATE ? 'simulate' : null,
  IS_LIVE_TEXT ? 'live-shadow' : null,
  IS_LIVE_YOUTUBE ? 'live-youtube' : null
].filter(Boolean);

if (selectedModes.length !== 1) {
  console.error(`Choose exactly one mode. Selected: ${selectedModes.join(', ') || 'none'}`);
  console.error('Supported modes: --simulate, --live-shadow, --live-youtube');
  process.exit(1);
}

const EXECUTION_MODE = selectedModes[0];

// Canonical Team Normalization Map
const TEAM_MAP = {
  'arizona': 'ARI', 'cardinals': 'ARI', 'ari': 'ARI',
  'atlanta': 'ATL', 'falcons': 'ATL', 'atl': 'ATL',
  'baltimore': 'BAL', 'ravens': 'BAL', 'bal': 'BAL',
  'buffalo': 'BUF', 'bills': 'BUF', 'buf': 'BUF',
  'carolina': 'CAR', 'panthers': 'CAR', 'car': 'CAR',
  'chicago': 'CHI', 'bears': 'CHI', 'chi': 'CHI',
  'cincinnati': 'CIN', 'bengals': 'CIN', 'cin': 'CIN',
  'cleveland': 'CLE', 'browns': 'CLE', 'cle': 'CLE',
  'dallas': 'DAL', 'cowboys': 'DAL', 'dal': 'DAL',
  'denver': 'DEN', 'broncos': 'DEN', 'den': 'DEN',
  'detroit': 'DET', 'lions': 'DET', 'det': 'DET',
  'green bay': 'GB', 'packers': 'GB', 'gb': 'GB',
  'houston': 'HOU', 'texans': 'HOU', 'hou': 'HOU',
  'indianapolis': 'IND', 'colts': 'IND', 'ind': 'IND',
  'jacksonville': 'JAX', 'jags': 'JAX', 'jaguars': 'JAX', 'jax': 'JAX',
  'kansas city': 'KC', 'chiefs': 'KC', 'kc': 'KC',
  'las vegas': 'LV', 'raiders': 'LV', 'lv': 'LV',
  'la chargers': 'LAC', 'chargers': 'LAC', 'lac': 'LAC',
  'la rams': 'LAR', 'rams': 'LAR', 'lar': 'LAR',
  'miami': 'MIA', 'dolphins': 'MIA', 'mia': 'MIA',
  'minnesota': 'MIN', 'vikings': 'MIN', 'min': 'MIN',
  'new england': 'NE', 'patriots': 'NE', 'pats': 'NE', 'ne': 'NE',
  'new orleans': 'NO', 'saints': 'NO', 'no': 'NO',
  'ny giants': 'NYG', 'giants': 'NYG', 'nyg': 'NYG',
  'ny jets': 'NYJ', 'jets': 'NYJ', 'nyj': 'NYJ',
  'philadelphia': 'PHI', 'eagles': 'PHI', 'phi': 'PHI',
  'pittsburgh': 'PIT', 'steelers': 'PIT', 'pit': 'PIT',
  'san francisco': 'SF', '49ers': 'SF', 'niners': 'SF', 'sf': 'SF',
  'seattle': 'SEA', 'seahawks': 'SEA', 'sea': 'SEA',
  'tampa bay': 'TB', 'buccaneers': 'TB', 'bucs': 'TB', 'tb': 'TB',
  'tennessee': 'TEN', 'titans': 'TEN', 'ten': 'TEN',
  'washington': 'WAS', 'commanders': 'WAS', 'was': 'WAS'
};

function normalizeTeam(raw) {
  if (!raw) return 'UNK';
  const clean = String(raw).trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');
  if (clean === 'los') return 'LAC';
  return TEAM_MAP[clean] || String(raw).toUpperCase().slice(0, 3);
}

function normalizeSide(raw, market = 'general') {
  if (!raw) return 'UNKNOWN';
  const clean = String(raw).trim().toUpperCase();
  const yesNoMarket = [
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
  ].includes(market);
  if (yesNoMarket && (clean === 'UNKNOWN' || clean.includes('OVER') || clean.includes('WIN') || clean.includes('YES') || clean.includes('TO WIN'))) return 'YES';
  if (yesNoMarket && (clean.includes('NO') || clean.includes('UNDER') || clean.includes('FADE'))) return 'NO';
  if (clean.includes('OVER')) return 'OVER';
  if (clean.includes('UNDER')) return 'UNDER';
  if (['YES', 'Y', 'WIN', 'WINNER', 'TO WIN'].some(v => clean === v || clean.includes(v))) return 'YES';
  if (['NO', 'N', 'FADE'].some(v => clean === v || clean.includes(v))) return 'NO';
  return clean;
}

function normalizeMarket(raw) {
  if (!raw) return 'general';
  const clean = String(raw).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (clean.includes('win_total') || clean === 'wins' || clean.includes('season_win')) return 'win_total';
  if (clean.includes('make_playoff') || clean === 'playoffs') return 'make_playoffs';
  if (clean.includes('division_winner') || clean.includes('division_champion') || clean.includes('division_champ') || clean.includes('afc_south_champ') || clean.includes('afc_north_champ') || clean.includes('afc_east_champ') || clean.includes('afc_west_champ') || clean.includes('nfc_south_champ') || clean.includes('nfc_north_champ') || clean.includes('nfc_east_champ') || clean.includes('nfc_west_champ')) return 'division_winner';
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
  // with no canonical name (this file's normalizeSide is already safe against
  // the separate UNKNOWN/NO substring bug fixed in the other two files).
  if (clean.includes('comeback_player')) return 'comeback_player_of_the_year';
  if (clean.includes('fewest_win')) return 'fewest_wins';
  if (clean.includes('receiving_yard')) return 'season_receiving_yards';
  if (clean.includes('passing_yard')) return 'season_passing_yards';
  if (clean.includes('passing_touchdown') || clean.includes('passing_td')) return 'season_passing_tds';
  if (clean.includes('interception')) return 'interceptions_leader';
  if (clean.includes('rushing_touchdown') && clean.includes('leader')) return 'rushing_tds_leader';
  if (clean.includes('rushing_touchdown') || clean.includes('rushing_td')) return 'season_rushing_tds';
  if (clean.includes('spread')) return 'spread';
  if (clean.includes('future')) return 'futures';
  if (clean.includes('prop')) return 'player_prop';
  return clean;
}

function normalizePick(p) {
  const market = normalizeMarket(p.market);
  return {
    team: normalizeTeam(p.team),
    market,
    side: normalizeSide(p.side || p.selection, market),
    line: p.line != null && p.line !== '' ? Number(p.line) : null,
    price: p.price != null && p.price !== '' ? Number(p.price) : null,
    week: p.week != null && p.week !== '' ? Number(p.week) : null,
    speaker: p.speaker || 'Host',
    source_timestamp: Number(p.source_timestamp || p.timestamp || 0),
    rationale: p.rationale || ''
  };
}

// Phase 1 (2026-07-27): the analysis_notes array added to the Gemini prompt
// contract (scripts/run_gemini_youtube_shadow.py / run_gemini_live_shadow.py)
// has to be carried through this harness too, or it silently gets dropped
// before it ever reaches the observation file that
// scripts/build-youtube-futures-intel-review.js reads.
function normalizeNote(n) {
  const teams = Array.isArray(n.teams)
    ? n.teams.map((t) => normalizeTeam(t)).filter((t) => t && t !== 'UNK')
    : [];
  const players = Array.isArray(n.players) ? n.players.filter(Boolean).map(String) : [];
  return {
    note_type: String(n.note_type || 'other').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    teams,
    players,
    topic: n.topic || '',
    summary: n.summary || '',
    speaker: n.speaker || '',
    source_timestamp: Number(n.source_timestamp || n.timestamp || 0),
    quote: n.quote || '',
    confidence: n.confidence || 'stated'
  };
}

/**
 * Parse Queue File
 */
function parseQueueDoc() {
  if (!fs.existsSync(QUEUE_DOC)) return [];
  const content = fs.readFileSync(QUEUE_DOC, 'utf8');
  const items = [];
  content.split('\n').forEach((line) => {
    if (line.trim().startsWith('|') && line.includes('data/podcasts/')) {
      const parts = line.split('|').map((s) => s.trim());
      if (parts.length >= 8) {
        const priority = parseInt(parts[1], 10);
        const date = parts[2];
        const show = parts[3];
        const episodeTitle = parts[4];
        const youtubeTarget = parts[5];
        const baselinePathMatch = parts[7].match(/`(data\/podcasts\/[^`]+)`/);
        if (baselinePathMatch) {
          const relPath = baselinePathMatch[1];
          items.push({
            priority,
            date,
            show,
            episodeTitle,
            youtubeTarget,
            baselineRelPath: relPath,
            episodeSlug: path.basename(relPath, '.json')
          });
        }
      }
    }
  });
  return items.sort((a, b) => a.priority - b.priority);
}

const PHASE_PRIORITIES = {
  smoke: [1, 2, 16],
  betting: [3, 5, 7, 8],
  intel: [4, 9, 10, 11, 12, 13],
  diarization: [6, 14, 15]
};

function loadBaselineFile(relPath) {
  const fullPath = path.resolve(ROOT, relPath);
  return fs.existsSync(fullPath) ? JSON.parse(fs.readFileSync(fullPath, 'utf8')) : null;
}

function loadMetadataOverrides() {
  if (!fs.existsSync(METADATA_OVERRIDES)) return [];
  const payload = JSON.parse(fs.readFileSync(METADATA_OVERRIDES, 'utf8'));
  return Array.isArray(payload.episodes) ? payload.episodes : [];
}

function normalizeComparableTitle(raw) {
  return String(raw || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMarkdownUrl(raw) {
  const text = String(raw || '');
  const markdownMatch = text.match(/\]\((https?:\/\/[^)]+)\)/);
  if (markdownMatch) return markdownMatch[1];
  const directMatch = text.match(/https?:\/\/\S+/);
  return directMatch ? directMatch[0] : null;
}

function isDirectYoutubeWatchUrl(raw) {
  if (!raw) return false;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      return url.pathname === '/watch' && url.searchParams.has('v');
    }
    if (host === 'youtu.be') {
      return url.pathname.length > 1;
    }
  } catch {
    return false;
  }
  return false;
}

function findYoutubeUrl(item) {
  if (YOUTUBE_URL_ARG && isDirectYoutubeWatchUrl(YOUTUBE_URL_ARG)) return YOUTUBE_URL_ARG;

  const fromQueue = extractMarkdownUrl(item.youtubeTarget);
  if (isDirectYoutubeWatchUrl(fromQueue)) return fromQueue;

  const overrides = loadMetadataOverrides();
  const targetTitle = normalizeComparableTitle(item.episodeTitle);
  const targetDate = String(item.date || '').slice(0, 10);
  const match = overrides.find(entry => {
    const titleMatches = normalizeComparableTitle(entry.title) === targetTitle;
    const dateMatches = !entry.pub_date || String(entry.pub_date).slice(0, 10) === targetDate;
    return titleMatches && dateMatches && isDirectYoutubeWatchUrl(entry.source_url);
  }) || overrides.find(entry => {
    return normalizeComparableTitle(entry.title) === targetTitle && isDirectYoutubeWatchUrl(entry.source_url);
  });

  return match?.source_url || null;
}

function getBaselineGroundTruth(baselineJson) {
  if (!baselineJson) return [];
  if (Array.isArray(baselineJson.extracted_picks) && baselineJson.extracted_picks.length > 0) {
    return baselineJson.extracted_picks.map(p => ({
      team: normalizeTeam(p.team),
      market: normalizeMarket(p.market),
      side: normalizeSide(p.side || p.selection),
      line: Number(p.line || 0),
      price: p.price != null ? Number(p.price) : null,
      speaker: p.speaker || 'Host',
      source_timestamp: Number(p.source_timestamp || p.timestamp || 0)
    }));
  }
  return [];
}

/**
 * Execute LIVE Gemini 3.5 Flash API via Python Runner
 */
function runLiveGeminiShadow(item) {
  const pyScript = path.join(ROOT, 'scripts', 'run_gemini_live_shadow.py');
  const fullPath = path.resolve(ROOT, item.baselineRelPath);

  try {
    const rawOutput = execFileSync('python', [pyScript, '--baseline', fullPath], { encoding: 'utf8' });
    const jsonRes = JSON.parse(rawOutput);

    const parsedJson = jsonRes.parsed_json || {};
    const rawPicks = parsedJson.extracted_picks || [];

    const extractedPicks = rawPicks.map(normalizePick);
    const analysisNotes = (parsedJson.analysis_notes || []).map(normalizeNote);

    return {
      run_id: `live_gemini_${crypto.randomBytes(6).toString('hex')}`,
      mode: 'live-shadow',
      model: MODEL_NAME,
      input_source: jsonRes.mode || 'text_prompt',
      latency_ms: jsonRes.latency_ms || 2500,
      estimated_cost_usd: jsonRes.estimated_cost_usd || 0.006,
      input_tokens: jsonRes.input_tokens || 0,
      output_tokens: jsonRes.output_tokens || 0,
      raw_model_response: jsonRes.raw_model_response || '',
      extracted_picks: extractedPicks,
      analysis_notes: analysisNotes,
      quote_timestamps: parsedJson.quote_timestamps || []
    };
  } catch (err) {
    console.error(`   Ã¢ÂÅ’ Live Gemini API Execution Error: ${err.message}`);
    return null;
  }
}

/**
 * Execute LIVE Gemini 3.5 Flash API using the public YouTube URL as video input.
 */
function runLiveGeminiYoutube(item) {
  const youtubeUrl = findYoutubeUrl(item);
  if (!youtubeUrl) {
    console.error(`   No direct YouTube watch URL found for ${item.episodeSlug}. Add source_url to ${path.relative(ROOT, METADATA_OVERRIDES)} or the queue file.`);
    return null;
  }

  const pyScript = path.join(ROOT, 'scripts', 'run_gemini_youtube_shadow.py');
  try {
    const rawOutput = execFileSync('python', [
      pyScript,
      '--url', youtubeUrl,
      '--episode-title', item.episodeTitle,
      '--show', item.show,
      '--date', item.date
    ], { encoding: 'utf8' });
    const jsonRes = JSON.parse(rawOutput);

    if (jsonRes.error) {
      console.error(`   Live YouTube Gemini Error: ${jsonRes.error}`);
      return null;
    }

    const parsedJson = jsonRes.parsed_json || {};
    const rawPicks = parsedJson.extracted_picks || [];
    const extractedPicks = rawPicks.map(normalizePick);
    const analysisNotes = (parsedJson.analysis_notes || []).map(normalizeNote);

    return {
      run_id: `youtube_gemini_${crypto.randomBytes(6).toString('hex')}`,
      mode: 'live-youtube',
      model: MODEL_NAME,
      input_source: jsonRes.mode || 'youtube_video_url',
      youtube_url: youtubeUrl,
      latency_ms: jsonRes.latency_ms || 0,
      estimated_cost_usd: jsonRes.estimated_cost_usd || 0,
      input_tokens: jsonRes.input_tokens || 0,
      output_tokens: jsonRes.output_tokens || 0,
      raw_model_response: jsonRes.raw_model_response || '',
      extracted_picks: extractedPicks,
      analysis_notes: analysisNotes,
      quote_timestamps: parsedJson.quote_timestamps || []
    };
  } catch (err) {
    console.error(`   Live YouTube Gemini API Execution Error: ${err.message}`);
    const stdout = String(err.stdout || '').trim();
    const stderr = String(err.stderr || '').trim();
    if (stdout) console.error(`   Live YouTube Gemini stdout: ${stdout}`);
    if (stderr) console.error(`   Live YouTube Gemini stderr: ${stderr}`);
    return null;
  }
}

/**
 * Execute SIMULATED Shadow Runner (Dry-Run Mode)
 */
function runSimulatedShadow(item, baselineJson) {
  const durationSecs = baselineJson?.episode?.duration_secs || 1800;
  const inputAudioTokens = Math.round(durationSecs * 32);
  const costUsd = Number((((inputAudioTokens + 1250) / 1_000_000) * 0.10 + (2100 / 1_000_000) * 0.40).toFixed(6));

  return {
    run_id: `sim_shadow_${crypto.randomBytes(6).toString('hex')}`,
    mode: 'simulate',
    model: MODEL_NAME,
    input_source: 'baseline_ground_truth_simulation',
    latency_ms: Math.round(1800 + Math.random() * 400),
    estimated_cost_usd: costUsd,
    input_tokens: inputAudioTokens,
    output_tokens: 2100,
    raw_model_response: "[SIMULATED DRY-RUN RESPONSE]",
    extracted_picks: getBaselineGroundTruth(baselineJson),
    analysis_notes: [],
    quote_timestamps: []
  };
}

/**
 * Score Gemini Extracted Picks against Baseline Ground Truth
 */
function scoreShadowObservation(baselinePicks, shadowPicks, timestampToleranceSecs = 60) {
  let matchedTeam = 0, matchedMarket = 0, matchedSide = 0, matchedLine = 0, matchedPrice = 0, matchedSpeaker = 0, matchedTimestamp = 0;
  let fullExactMatches = 0;

  const totalGt = baselinePicks.length;
  const totalExt = shadowPicks.length;
  const matchedIndices = new Set();

  if (totalGt === 0) {
    return {
      score_status: 'not_scored',
      score_reason: 'No explicit extracted_picks ground truth exists for this baseline episode.',
      total_ground_truth: 0,
      total_shadow_extracted: totalExt,
      full_exact_matches: 0,
      precision_pct: 'not scored',
      recall_pct: 'not scored',
      f1_score_pct: 'not scored',
      dimension_accuracy: {
        team: null,
        market: null,
        side: null,
        line: null,
        price: null,
        speaker: null,
        source_timestamp: null
      }
    };
  }

  shadowPicks.forEach((sp) => {
    let bestMatchIdx = -1;
    baselinePicks.forEach((bp, idx) => {
      if (matchedIndices.has(idx)) return;
      const isTeam = bp.team === sp.team;
      const isMarket = bp.market === sp.market;
      const isSide = bp.side === sp.side;
      const isLine = bp.line === sp.line;
      const isPrice = bp.price === sp.price || (bp.price == null && sp.price == null);
      const isSpeaker = bp.speaker === sp.speaker;
      const isTimestamp = Math.abs(bp.source_timestamp - sp.source_timestamp) <= timestampToleranceSecs;

      if (isTeam && isMarket && isSide && isLine && isPrice && isSpeaker && isTimestamp) {
        bestMatchIdx = idx;
      }
    });

    if (bestMatchIdx !== -1) {
      matchedIndices.add(bestMatchIdx);
      fullExactMatches++;
      matchedTeam++; matchedMarket++; matchedSide++; matchedLine++; matchedPrice++; matchedSpeaker++; matchedTimestamp++;
    } else {
      const partial = baselinePicks.find((bp) => bp.team === sp.team && bp.side === sp.side);
      if (partial) {
        if (partial.team === sp.team) matchedTeam++;
        if (partial.market === sp.market) matchedMarket++;
        if (partial.side === sp.side) matchedSide++;
        if (partial.line === sp.line) matchedLine++;
        if (partial.price === sp.price) matchedPrice++;
        if (partial.speaker === sp.speaker) matchedSpeaker++;
        if (Math.abs(partial.source_timestamp - sp.source_timestamp) <= timestampToleranceSecs) matchedTimestamp++;
      }
    }
  });

  const precision = totalExt > 0 ? (fullExactMatches / totalExt) * 100 : 0;
  const recall = totalGt > 0 ? (fullExactMatches / totalGt) * 100 : 0;
  const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return {
    total_ground_truth: totalGt,
    total_shadow_extracted: totalExt,
    full_exact_matches: fullExactMatches,
    precision_pct: Number(precision.toFixed(2)),
    recall_pct: Number(recall.toFixed(2)),
    f1_score_pct: Number(f1.toFixed(2)),
    dimension_accuracy: {
      team: Number(((matchedTeam / totalGt) * 100).toFixed(2)),
      market: Number(((matchedMarket / totalGt) * 100).toFixed(2)),
      side: Number(((matchedSide / totalGt) * 100).toFixed(2)),
      line: Number(((matchedLine / totalGt) * 100).toFixed(2)),
      price: Number(((matchedPrice / totalGt) * 100).toFixed(2)),
      speaker: Number(((matchedSpeaker / totalGt) * 100).toFixed(2)),
      source_timestamp: Number(((matchedTimestamp / totalGt) * 100).toFixed(2))
    }
  };
}

async function main() {
  const modeLabel = EXECUTION_MODE === 'live-youtube'
    ? 'LIVE GEMINI 3.5 FLASH YOUTUBE VIDEO MODE'
    : EXECUTION_MODE === 'live-shadow'
      ? 'LIVE GEMINI 3.5 FLASH TRANSCRIPT MODE'
      : 'SIMULATED DRY-RUN MODE';
  console.log(`\nÃ°Å¸Å½â„¢Ã¯Â¸Â Gemini Podcast Shadow Harness Benchmark [${modeLabel}]`);
  console.log(`Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â`);

  const queueItems = parseQueueDoc();
  let targetItems = queueItems;

  if (PHASE_ARG) {
    const priorities = PHASE_PRIORITIES[PHASE_ARG.toLowerCase()];
    if (priorities) targetItems = queueItems.filter(i => priorities.includes(i.priority));
  } else if (EPISODE_ARG) {
    targetItems = queueItems.filter(i => i.episodeSlug.includes(EPISODE_ARG));
  }

  if (targetItems.length === 0 && IS_LIVE_YOUTUBE && EPISODE_ARG && YOUTUBE_URL_ARG) {
    targetItems = [{
      priority: 'manual',
      date: 'manual',
      show: 'YouTube Discovery',
      episodeTitle: EPISODE_ARG,
      youtubeTarget: YOUTUBE_URL_ARG,
      baselineRelPath: null,
      episodeSlug: EPISODE_ARG
    }];
  }

  if (targetItems.length === 0) {
    console.log(`Ã¢Å¡Â Ã¯Â¸Â No matching queue items found.`);
    return;
  }

  if (YOUTUBE_URL_ARG && (!IS_LIVE_YOUTUBE || targetItems.length !== 1)) {
    console.error('--youtube-url can only be used with --live-youtube and exactly one --episode target.');
    process.exit(1);
  }

  const results = [];
  let totalCostUsd = 0;
  let totalLatencyMs = 0;

  for (const item of targetItems) {
    console.log(`\nÃ¢â€“Â¶Ã¯Â¸Â [P${item.priority}] Processing: ${item.episodeSlug}`);
    const baselineJson = item.baselineRelPath ? loadBaselineFile(item.baselineRelPath) : null;
    if (!baselineJson) {
      console.log(`   Ã¢Å¡Â Ã¯Â¸Â Baseline file missing: ${item.baselineRelPath} (skipping)`);
      if (EXECUTION_MODE === 'live-youtube') {
        console.log('   Baseline: none supplied; running YouTube discovery extraction without scoring');
      } else {
        continue;
      }
    }

    const baselinePicks = baselineJson ? getBaselineGroundTruth(baselineJson) : [];

    let shadowRun;
    if (EXECUTION_MODE === 'live-youtube') {
      shadowRun = runLiveGeminiYoutube(item);
    } else if (EXECUTION_MODE === 'live-shadow') {
      shadowRun = runLiveGeminiShadow(item);
    } else {
      shadowRun = runSimulatedShadow(item, baselineJson);
    }

    if (!shadowRun) continue;

    const scoring = scoreShadowObservation(baselinePicks, shadowRun.extracted_picks);

    totalCostUsd += shadowRun.estimated_cost_usd;
    totalLatencyMs += shadowRun.latency_ms;

    // Save RAW Gemini Model Response Separately
    fs.mkdirSync(OBS_DIR, { recursive: true });
    const artifactSuffix = EXECUTION_MODE === 'live-youtube'
      ? 'youtube'
      : EXECUTION_MODE === 'live-shadow'
        ? 'transcript'
        : 'simulate';
    const rawFile = path.join(OBS_DIR, `${item.episodeSlug}-raw-gemini-${artifactSuffix}.json`);
    fs.writeFileSync(rawFile, JSON.stringify({
      episode_slug: item.episodeSlug,
      mode: shadowRun.mode,
      model: MODEL_NAME,
      input_source: shadowRun.input_source,
      youtube_url: shadowRun.youtube_url || null,
      raw_model_response: shadowRun.raw_model_response,
      quote_timestamps: shadowRun.quote_timestamps
    }, null, 2));

    // Save Scored Shadow Observation
    const obsRecord = {
      episode_slug: item.episodeSlug,
      show: item.show,
      date: item.date,
      priority: item.priority,
      mode: shadowRun.mode,
      model: MODEL_NAME,
      input_source: shadowRun.input_source,
      run: shadowRun,
      scoring
    };

    const obsFile = path.join(OBS_DIR, `${item.episodeSlug}-shadow-${artifactSuffix}.json`);
    fs.writeFileSync(obsFile, JSON.stringify(obsRecord, null, 2));

    const scoreStatus = typeof scoring.f1_score_pct === 'number'
      ? `${scoring.f1_score_pct}% | Precision: ${scoring.precision_pct}% | Recall: ${scoring.recall_pct}%`
      : `not scored (${scoring.score_reason})`;
    console.log(`   Score Status: ${scoreStatus}`);
    console.log(`   Ã°Å¸â€™Â¾ Raw Gemini Saved : ${path.basename(rawFile)}`);
    console.log(`   Ã°Å¸â€™Â¾ Observation Saved: ${path.basename(obsFile)}`);
    console.log(`   Real Match F1 Score: ${scoreStatus}`);
    console.log(`   Ã¢ÂÂ±Ã¯Â¸Â Latency: ${shadowRun.latency_ms} ms | Cost: $${shadowRun.estimated_cost_usd}`);

    results.push(obsRecord);
  }

  if (results.length > 0) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
    const reportFile = path.join(REPORT_DIR, `queue-benchmark-report-${EXECUTION_MODE}.json`);
    const scoredResults = results.filter(r => typeof r.scoring.f1_score_pct === 'number');
    const avgF1 = scoredResults.length > 0
      ? Number((scoredResults.reduce((sum, r) => sum + r.scoring.f1_score_pct, 0) / scoredResults.length).toFixed(2))
      : null;
    const avgLatency = Math.round(totalLatencyMs / results.length);

    const report = {
      evaluated_at: new Date().toISOString(),
      mode: EXECUTION_MODE,
      model: MODEL_NAME,
      total_episodes_evaluated: results.length,
      total_episodes_scored: scoredResults.length,
      average_f1_score_pct: avgF1,
      total_cost_usd: Number(totalCostUsd.toFixed(6)),
      average_latency_ms: avgLatency,
      queue_runs: results
    };

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    const summaryScore = scoredResults.length > 0 ? `${avgF1.toFixed(2)}%` : 'not scored';
    console.log(`\nSaved Batch Benchmark Report: ${reportFile}`);
    console.log(`\nQUEUE BENCHMARK SUMMARY REPORT [${MODEL_NAME}]`);
    console.log(`  Execution Mode       : ${EXECUTION_MODE}`);
    console.log(`  Episodes Evaluated   : ${results.length}`);
    console.log(`  Episodes Scored      : ${scoredResults.length}`);
    console.log(`  Real 7-Field F1 Score: ${summaryScore}`);
    console.log(`  Total Real Cost      : $${totalCostUsd.toFixed(5)} USD`);
    console.log(`  Real Average Latency : ${avgLatency} ms`);
    return;
    console.log(`\nÃ°Å¸â€™Â¾ Saved Batch Benchmark Report: ${reportFile}`);
  }

  console.log(`\nÃ°Å¸Ââ€  QUEUE BENCHMARK SUMMARY REPORT [${MODEL_NAME}]`);
  console.log(`Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â`);
  console.log(`  Ã¢â‚¬Â¢ Execution Mode         : ${EXECUTION_MODE}`);
  console.log(`  Ã¢â‚¬Â¢ Model                  : ${MODEL_NAME}`);
  console.log(`  Ã¢â‚¬Â¢ Episodes Evaluated     : ${results.length}`);
  console.log(`  Ã¢â‚¬Â¢ Real 7-Field F1 Score  : ${results.length > 0 ? (results.reduce((s, r) => s + r.scoring.f1_score_pct, 0) / results.length).toFixed(2) : 0}%`);
  console.log(`  Ã¢â‚¬Â¢ Total Real Cost        : $${totalCostUsd.toFixed(5)} USD`);
  console.log(`  Ã¢â‚¬Â¢ Real Average Latency   : ${results.length > 0 ? Math.round(totalLatencyMs / results.length) : 0} ms`);
  console.log(`Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â\n`);
}

main().catch(err => console.error('CRITICAL Harness Error:', err));
