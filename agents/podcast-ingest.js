// agents/podcast-ingest.js
// PodcastIngestAgent — polls configured RSS feeds, transcribes new episodes,
// extracts NFL picks + intel via GPT-4o, writes to Supabase.
//
// Runtime:    Node.js 20+ ESM (GitHub Actions)
// Schedule:   Every Friday 8am UTC (see .github/workflows/podcast-ingest.yml)
// Env vars:   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
// Optional:   GROQ_API_KEY       — free Whisper via Groq (7200 sec/hr limit)
//             ASSEMBLYAI_API_KEY — fallback if Groq rate-limited; passes URL directly, no download
//             GEMINI_API_KEY     — diarized-show transcription (see below) + extraction fallback #2
//             DRY_RUN=true       — discover episodes but skip transcription + writes
//             MAX_PER_RUN=2      — limit new episodes processed per run (default: 3)
//
// Transcription priority (single-host shows): Groq → AssemblyAI → OpenAI Whisper
// Transcription priority (diarized/multi-host shows, podcast_feeds.needs_diarization):
//   Gemini (native diarization) → AssemblyAI (speaker_labels), since 2026-09-24 — see
//   handoffs/2026-09-22-...-gemini-podcast-pipeline-handoff.md. Before that, diarized
//   shows were AssemblyAI-only with no fallback at all, which went fully dark for a
//   week when AssemblyAI's balance went negative.

import 'dotenv/config';    // load .env for local runs (no-op in CI where secrets are real env vars)
import { createClient }    from '@supabase/supabase-js';
import { createWriteStream, readFileSync, unlinkSync, statSync } from 'node:fs';
import { pipeline }        from 'node:stream/promises';
import { tmpdir }          from 'node:os';
import { join }            from 'node:path';
import { transcribeWithAssemblyAI } from './lib/assemblyai-transcribe.js';
import { transcribeWithGeminiAudio } from './lib/gemini-audio-transcribe.js';
import { isNflRelevantEpisode } from './lib/nfl-relevance.js';
import {
  parseProviderOrder,
  runExtractionChain,
  liveProviderCount,
  ExtractionUnavailableError,
} from './lib/extraction-providers.js';
import { planEpisodeQueue, DEFAULT_MAX_EPISODE_AGE_DAYS } from './lib/episode-queue.js';
import { chunkTranscript } from './lib/chunk-text.js';
import { mergePicks, mergeIntel } from './lib/extraction-merge.js';

// ─── Config ───────────────────────────────────────────────────────────────────

const MAX_RETRIES      = 3;
// Hard ceiling (default 10 min). Raise via MAX_RUNTIME_MINUTES for backlog runs (~1 min/episode);
// keep it below the workflow's timeout-minutes.
const MAX_RUNTIME_MS   = Number(process.env.MAX_RUNTIME_MINUTES || 10) * 60 * 1000;
const MAX_AUDIO_BYTES  = 24 * 1024 * 1024; // 24 MB (Whisper limit is 25 MB)
const MAX_PER_RUN      = parseInt(process.env.MAX_PER_RUN ?? '3', 10);
// Episodes published longer ago than this are left queued, not processed (set higher for a
// deliberate backfill, e.g. MAX_EPISODE_AGE_DAYS=365).
const MAX_EPISODE_AGE_DAYS = Number(process.env.MAX_EPISODE_AGE_DAYS || DEFAULT_MAX_EPISODE_AGE_DAYS);
const DRY_RUN          = process.env.DRY_RUN === 'true';

const SUPABASE_URL      = process.env.SUPABASE_URL;
const SUPABASE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_KEY        = process.env.OPENAI_API_KEY;
const GROQ_KEY          = process.env.GROQ_API_KEY;          // optional — free Whisper via Groq
const ASSEMBLYAI_KEY    = process.env.ASSEMBLYAI_API_KEY;    // optional — fallback if Groq rate-limited
const ANTHROPIC_KEY     = process.env.ANTHROPIC_API_KEY;     // optional — pick/intel extraction fallback #1 (Claude)
const GEMINI_KEY        = process.env.GEMINI_API_KEY;        // optional — diarized-show transcription (default since 2026-09-24) + pick/intel extraction (first by default)
// Extraction provider order (2026-09-19): Gemini first (cheapest / free-tier eligible), then
// Claude, then GPT-4o. Override with EXTRACTION_PROVIDER_ORDER="gpt-4o,claude,gemini".
const EXTRACTION_ORDER  = parseProviderOrder(process.env.EXTRACTION_PROVIDER_ORDER);
// gemini-3.6-flash is a current stable id (checked 2026-09-19); gemini-2.0-flash is shut down.
const GEMINI_EXTRACTION_MODEL = process.env.GEMINI_EXTRACTION_MODEL || 'gemini-3.6-flash';

// Transcription provider priority:
//   1. Groq         — free, 7200 sec/hr limit, drop-in Whisper-compatible
//   2. AssemblyAI   — paid (~$0.37/hr Best), no file download needed, no size/rate limit
//   3. OpenAI       — paid ($0.006/min), last resort
const TRANSCRIBE_URL   = GROQ_KEY
  ? 'https://api.groq.com/openai/v1/audio/transcriptions'
  : 'https://api.openai.com/v1/audio/transcriptions';
const TRANSCRIBE_KEY   = GROQ_KEY ?? OPENAI_KEY;
const TRANSCRIBE_MODEL = GROQ_KEY ? 'whisper-large-v3' : 'whisper-1';
const USE_ASSEMBLYAI   = !!ASSEMBLYAI_KEY && !GROQ_KEY; // only use if Groq unavailable

// ─── Supabase client ──────────────────────────────────────────────────────────

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing Supabase env vars');
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ─── Custom errors ──────────────────────────────────────────────────────────────

/** Thrown when the transcription API hits its hourly rate limit. Not retryable. */
class RateLimitError extends Error {
  constructor(retryAfterSecs) {
    const mins = retryAfterSecs ? Math.ceil(retryAfterSecs / 60) : '?';
    super(`Groq rate limit reached — retry in ~${mins} min`);
    this.name = 'RateLimitError';
    this.retryAfterSecs = retryAfterSecs;
  }
}

// ─── Lightweight RSS parser ───────────────────────────────────────────────────

/** Extract text content between the first occurrence of <tag...>...</tag> */
function tag(xml, tagName) {
  const open  = new RegExp(`<${tagName}(?:\\s[^>]*)?>`, 'i');
  const close = new RegExp(`<\\/${tagName}>`, 'i');
  const openM = xml.match(open);
  if (!openM) return null;
  const start = openM.index + openM[0].length;
  const closeM = xml.slice(start).match(close);
  if (!closeM) return null;
  return xml.slice(start, start + closeM.index).replace(/<!\[CDATA\[|\]\]>/g, '').trim();
}

/** Extract attribute value from a self-closing or open tag */
function attr(xml, tagName, attrName) {
  const tagRe = new RegExp(`<${tagName}[^>]+${attrName}\\s*=\\s*["']([^"']+)["']`, 'i');
  const m = xml.match(tagRe);
  return m ? m[1] : null;
}

/** Parse <itunes:duration> — handles HH:MM:SS and plain seconds */
function parseDuration(raw) {
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  const parts = raw.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

/**
 * Parse an RSS feed XML string into an array of episode objects.
 * Only returns episodes published in the last 7 days to limit scope.
 */
function parseRssFeed(xml) {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;

  // Split on <item> boundaries
  const items = xml.split(/<item[\s>]/).slice(1);

  return items.flatMap(itemXml => {
    const pubDateStr = tag(itemXml, 'pubDate');
    const pubDate    = pubDateStr ? new Date(pubDateStr) : null;

    // Skip episodes older than 7 days
    if (pubDate && pubDate.getTime() < cutoff) return [];

    const guid     = tag(itemXml, 'guid') ?? attr(itemXml, 'guid', 'isPermaLink') ?? null;
    const title    = tag(itemXml, 'title');
    const audioUrl = attr(itemXml, 'enclosure', 'url');
    const duration = parseDuration(tag(itemXml, 'itunes:duration'));

    if (!guid || !audioUrl) return [];

    return [{
      guid,
      title:         title ?? '(untitled)',
      pub_date:      pubDate?.toISOString() ?? null,
      audio_url:     audioUrl,
      duration_secs: duration,
    }];
  });
}

// ─── RSS fetching ─────────────────────────────────────────────────────────────

// ─── NFL relevance pre-filter ────────────────────────────────────────────────
// Moved to agents/lib/nfl-relevance.js (2026-07-20, S291) so
// scripts/podcast-diarize-backfill.js can apply the same filter when selecting
// already-ingested episodes to re-diarize, not just newly-discovered RSS items.
// Imported at the top of this file; behavior is unchanged.

async function fetchRss(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'NFL-Platinum-Rose-PodcastAgent/1.0' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`RSS fetch failed: HTTP ${res.status} for ${url}`);
  return res.text();
}

// ─── Audio download ───────────────────────────────────────────────────────────

/**
 * Downloads audio to a temp file. If Content-Length > MAX_AUDIO_BYTES,
 * uses a Range request to fetch only the first MAX_AUDIO_BYTES (partial MP3 —
 * Whisper handles truncated MP3 gracefully since frames are sequential).
 * Returns { filePath, isPartial, sizeBytes }.
 */
async function downloadAudio(url) {
  const tmpPath = join(tmpdir(), `pr-podcast-${Date.now()}.mp3`);

  // Check file size via HEAD request first
  let isPartial = false;
  let sizeBytes = null;
  try {
    const head = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(15_000),
    });
    const cl = head.headers.get('content-length');
    if (cl) sizeBytes = parseInt(cl, 10);
  } catch {
    // HEAD not supported by some CDNs — proceed with GET
  }

  const headers = { 'User-Agent': 'NFL-Platinum-Rose-PodcastAgent/1.0' };
  if (sizeBytes !== null && sizeBytes > MAX_AUDIO_BYTES) {
    headers['Range'] = `bytes=0-${MAX_AUDIO_BYTES - 1}`;
    isPartial = true;
    console.log(`  ↳ Large file (${(sizeBytes / 1024 / 1024).toFixed(1)} MB) — fetching first 24 MB`);
  }

  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok && res.status !== 206) {
    throw new Error(`Audio download failed: HTTP ${res.status}`);
  }

  await pipeline(res.body, createWriteStream(tmpPath));

  const actualSize = statSync(tmpPath).size;
  if (actualSize > MAX_AUDIO_BYTES) {
    // Shouldn't happen after Range request, but truncate just in case
    isPartial = true;
  }

  return { filePath: tmpPath, isPartial, sizeBytes: actualSize };
}

// ─── Whisper transcription ────────────────────────────────────────────────────

async function transcribeAudio(filePath) {
  const audioBuffer = readFileSync(filePath);
  const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });

  const form = new FormData();
  form.append('file', blob, 'episode.mp3');
  form.append('model', TRANSCRIBE_MODEL);
  form.append('language', 'en');
  form.append('response_format', 'text');

  console.log(`    🎤 Using ${GROQ_KEY ? 'Groq (free)' : 'OpenAI'} Whisper (${TRANSCRIBE_MODEL})`);

  const res = await fetch(TRANSCRIBE_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TRANSCRIBE_KEY}` },
    body: form,
    signal: AbortSignal.timeout(300_000), // 5 min for long audio
  });

  if (!res.ok) {
    const errText = await res.text();
    // Detect Groq rate limit — don't retry, let the episode stay 'pending'
    try {
      const errJson = JSON.parse(errText);
      if (errJson?.error?.code === 'rate_limit_exceeded') {
        // Parse retry-after seconds from the error message if available
        const match = errJson.error.message.match(/(\d+)m(\d+(?:\.\d+)?)s/);
        const secs  = match ? parseInt(match[1]) * 60 + parseFloat(match[2]) : null;
        throw new RateLimitError(secs);
      }
    } catch (e) {
      if (e instanceof RateLimitError) throw e;
    }
    throw new Error(`Whisper error: ${errText}`);
  }

  return res.text(); // whisper-1 + response_format=text returns plain string
}

// ─── AssemblyAI transcription ─────────────────────────────────────────────────
// Moved to agents/lib/assemblyai-transcribe.js (2026-07-20, S291) so
// scripts/podcast-diarize-backfill.js can reuse the exact same submit/poll
// logic. Imported at the top of this file; behavior is unchanged. Still uses
// ASSEMBLYAI_KEY (from this file's env consts, below) implicitly via
// transcribeWithAssemblyAI's process.env.ASSEMBLYAI_API_KEY default.

// ─── Pick extraction via GPT-4o ───────────────────────────────────────────────

// FULL-TRANSCRIPT EXTRACTION (2026-09-19): this prompt used to send only the first 12,000 chars
// — the first ~10-15 minutes of a 40-100k-char episode — so shows like "10 Best Bets" yielded 2
// picks. Known since July (agents/podcast-reextract.js was written for it) but never fixed here.
// Now the whole transcript is extracted in overlapping chunks and merged.
const EXTRACTION_CHUNK_CHARS   = Number(process.env.EXTRACTION_CHUNK_CHARS || 30000);
const EXTRACTION_CHUNK_OVERLAP = 1500;
const EXTRACTION_CALL_DELAY_MS = Number(process.env.EXTRACTION_CALL_DELAY_MS || 1500); // gentle on free-tier RPM

const EXTRACTION_SYSTEM = `You are an NFL betting analyst. 
Extract all betting picks and notable analysis from the transcript chunk.
Return ONLY valid JSON — no prose, no markdown fences.`;

const EXTRACTION_USER = (transcript, source, idx = 1, total = 1) => `
Source: ${source}
Transcript chunk ${idx} of ${total} (analyze everything present in this chunk; other chunks are handled separately):
---
${transcript}
---

Return JSON with this exact shape:
{
  "picks": [
    {
      "selection": "string (team name, OVER, or UNDER, or the prop outcome e.g. 'Anytime TD')",
      "player": "string | null (player name for player props, else null)",
      "market": "string | null (prop market e.g. 'receiving yards', 'anytime TD', 'pass attempts'; null for game lines)",
      "team1": "string (home team or first team)",
      "team2": "string (away team or second team)",
      "type": "spread | moneyline | total | player_prop | futures",
      "line": number | null,
      "summary": "string (brief rationale, max 200 chars)",
      "units": number (1-5),
      "confidence": number (50-95),
      "game_date": "YYYY-MM-DD | null"
    }
  ],
  "intel": [
    "string (key insight, injury note, weather, sharp money report, etc.)"
  ]
}

Rules:
- Only include picks that are clearly stated as recommendations
- DO NOT OMIT WOULD BET POSITIONS OR PARLAYS. Extract both WOULD BET positions (including division winner parlays, multi-leg division tickets, futures, player props) and WOULD NOT BET / PASS positions. If an expert passes on a win total or standalone line, explicitly extract any recommended alternative WOULD BET positions (such as parlaying division winners, exact finishing order, or player props).
- ALWAYS CAPTURE EXACT ODDS, LINES, AND SPECIFIC PROPS (e.g., '17 to 1 Super Bowl', '9 to 1 NFC Conference', '+125 Division'). Never abbreviate a position to a vague statement like 'betting on long shots' without detailing the exact market, line, and odds mentioned.
- Preserve all decimal numbers (e.g. '10.5 wins', '9.5 wins') and odds numbers completely. Ensure footnote citations or markers do not truncate or distort numbers in the text.
- "selection" for spreads/ML = the team getting the pick
- "selection" for totals = "OVER" or "UNDER" (uppercase)
- Player props: type = "player_prop", fill "player" and "market", "selection" = OVER/UNDER (or the outcome), "line" = the prop number or American odds for yes/no props
- Every distinct recommended bet is its own pick — a "10 best bets" segment should produce ~10 picks
- "line" = the spread number (negative for favored) or the total number
- "units" = bet size 1-5 (use 1 if not mentioned)
- "confidence" = 50-95 (use 65 if not mentioned)
- "intel" = up to 10 key analytical points from THIS chunk (not picks, just context)
- If no picks found, return { "picks": [], "intel": [] }
`.trim();

function parsePicksIntelJson(raw, modelLabel) {
  // Strip markdown code fences if the model returned them anyway
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    const parsed = JSON.parse(clean);
    return {
      picks: Array.isArray(parsed.picks) ? parsed.picks : [],
      intel: Array.isArray(parsed.intel) ? parsed.intel : [],
    };
  } catch {
    throw new Error(`${modelLabel} returned invalid JSON: ${clean.slice(0, 200)}`);
  }
}

async function extractPicksAndIntelOpenAI(transcript, sourceName, idx = 1, total = 1) {
  if (!OPENAI_KEY) throw new Error('GPT-4o error: OPENAI_API_KEY not set');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0.1,
      max_tokens: 8192,
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM },
        { role: 'user',   content: EXTRACTION_USER(transcript, sourceName, idx, total) },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GPT-4o error: ${err}`);
  }

  const data = await res.json();
  const raw  = data.choices?.[0]?.message?.content?.trim() ?? '{}';
  return parsePicksIntelJson(raw, 'GPT-4o');
}

// Fallback #1: Claude (Anthropic Messages API). Same system/user prompts as
// GPT-4o so extraction quality/shape stays comparable. Wired 2026-09-14 after
// the OpenAI account ran out of billing credits and stalled the whole podcast
// pipeline for days with no extraction fallback at all (transcription already
// had a Groq->AssemblyAI fallback chain -- extraction had none).
async function extractPicksAndIntelClaude(transcript, sourceName, idx = 1, total = 1) {
  if (!ANTHROPIC_KEY) throw new Error('Claude error: ANTHROPIC_API_KEY not set');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type':      'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      temperature: 0.1,
      system: EXTRACTION_SYSTEM,
      messages: [
        { role: 'user', content: EXTRACTION_USER(transcript, sourceName, idx, total) },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude error: ${err}`);
  }

  const data = await res.json();
  const raw  = data.content?.[0]?.text?.trim() ?? '{}';
  return parsePicksIntelJson(raw, 'Claude');
}

// Fallback #2: Gemini (generateContent REST API). Last resort if both
// OpenAI and Anthropic are down/out of credits.
async function extractPicksAndIntelGemini(transcript, sourceName, idx = 1, total = 1) {
  if (!GEMINI_KEY) throw new Error('Gemini error: GEMINI_API_KEY not set');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EXTRACTION_MODEL}:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: EXTRACTION_SYSTEM }] },
        contents: [
          { role: 'user', parts: [{ text: EXTRACTION_USER(transcript, sourceName, idx, total) }] },
        ],
        // JSON mode avoids fenced/prose output; 8192 leaves room for a full pick list
        // (2048 risked truncated JSON on long betting shows).
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192, responseMimeType: 'application/json' },
      }),
      signal: AbortSignal.timeout(60_000),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error: ${err}`);
  }

  const data = await res.json();
  const raw  = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '{}';
  return parsePicksIntelJson(raw, 'Gemini');
}

// Pick/intel extraction with automatic fallback: GPT-4o -> Claude -> Gemini.
// Each provider is only attempted if its API key is configured. Returns the
// extraction result plus which model actually produced it, so the caller can
// record real provenance in podcast_transcripts.model_used instead of always
// claiming "gpt-4o" even when a fallback silently kicked in.
const EXTRACTION_PROVIDERS = {
  'gemini': { key: 'gemini', label: GEMINI_EXTRACTION_MODEL,  keyPresent: !!GEMINI_KEY,    run: extractPicksAndIntelGemini },
  'claude': { key: 'claude', label: 'claude-sonnet-4-5',      keyPresent: !!ANTHROPIC_KEY, run: extractPicksAndIntelClaude },
  'gpt-4o': { key: 'gpt-4o', label: 'gpt-4o',                 keyPresent: !!OPENAI_KEY,    run: extractPicksAndIntelOpenAI },
};
const ORDERED_EXTRACTION_PROVIDERS = EXTRACTION_ORDER.map((k) => EXTRACTION_PROVIDERS[k]);
// Providers that failed with billing/auth errors this run (e.g. OpenAI "no credits").
const deadExtractionProviders = new Set();

async function extractPicksAndIntel(transcript, sourceName) {
  const chunks = chunkTranscript(transcript || '', EXTRACTION_CHUNK_CHARS, EXTRACTION_CHUNK_OVERLAP);
  if (chunks.length === 0) return { picks: [], intel: [], extractionModel: 'none', chunkCount: 0 };
  const allPicks = [];
  const allIntel = [];
  const modelsUsed = new Set();
  for (let i = 0; i < chunks.length; i++) {
    const { result, provider } = await runExtractionChain(
      ORDERED_EXTRACTION_PROVIDERS, deadExtractionProviders, [chunks[i], sourceName, i + 1, chunks.length], console
    );
    allPicks.push(...(Array.isArray(result?.picks) ? result.picks : []));
    allIntel.push(...(Array.isArray(result?.intel) ? result.intel : []));
    modelsUsed.add(provider.label);
    if (i < chunks.length - 1 && EXTRACTION_CALL_DELAY_MS > 0) await new Promise((r) => setTimeout(r, EXTRACTION_CALL_DELAY_MS));
  }
  return {
    picks: mergePicks(allPicks),
    intel: mergeIntel(allIntel),
    extractionModel: [...modelsUsed].join('/'),
    chunkCount: chunks.length,
  };
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchWithRetry(fn, retries = MAX_RETRIES) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      // Rate limit / no-usable-extractor errors are never retryable within the same run
      if (err instanceof RateLimitError || err instanceof ExtractionUnavailableError) throw err;
      lastErr = err;
      if (i < retries - 1) {
        const delay = 2 ** i * 1000;
        console.warn(`  ↳ Retry ${i + 1}/${retries - 1} after ${delay}ms: ${err.message}`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

// ─── Re-extract mode (no transcription) ───────────────────────────────────────
// REEXTRACT_SINCE=YYYY-MM-DD re-runs full-transcript extraction over transcripts ALREADY stored
// in podcast_transcripts (episodes published on/after that date) and overwrites their picks/intel.
// Nothing is re-transcribed, so no AssemblyAI/Groq cost. Episodes whose picks were already
// promoted to signals (picks_promoted_at set) are skipped unless REEXTRACT_INCLUDE_PROMOTED=true,
// because pick-extraction.js ids promoted picks by index and re-promoting would duplicate them.
const REEXTRACT_SINCE            = process.env.REEXTRACT_SINCE || '';
const REEXTRACT_INCLUDE_PROMOTED = String(process.env.REEXTRACT_INCLUDE_PROMOTED || '').toLowerCase() === 'true';

async function reextractStored(supabase) {
  console.log(`♻️  RE-EXTRACT mode: stored transcripts for episodes published since ${REEXTRACT_SINCE}` +
    ` (include promoted: ${REEXTRACT_INCLUDE_PROMOTED}, cap ${MAX_PER_RUN})`);
  const { data: eps, error: epErr } = await supabase
    .from('podcast_episodes')
    .select('id, title, pub_date, feed_id')
    .gte('pub_date', REEXTRACT_SINCE)
    .order('pub_date', { ascending: false });
  if (epErr) throw new Error(`episode query failed: ${epErr.message}`);
  const epById = new Map((eps ?? []).map((e) => [e.id, e]));
  if (epById.size === 0) { console.log('  nothing to do'); return { processed: 0, errors: 0 }; }

  const { data: feeds } = await supabase.from('podcast_feeds').select('id, name, expert');
  const feedById = new Map((feeds ?? []).map((f) => [f.id, f]));

  const { data: rows, error: txErr } = await supabase
    .from('podcast_transcripts')
    .select('episode_id, transcript_text, picks, intel, model_used, picks_promoted_at')
    .in('episode_id', [...epById.keys()]);
  if (txErr) throw new Error(`transcript query failed: ${txErr.message}`);

  const work = (rows ?? [])
    .filter((r) => r.transcript_text)
    .sort((a, b) => String(epById.get(b.episode_id)?.pub_date).localeCompare(String(epById.get(a.episode_id)?.pub_date)));

  let processed = 0, errors = 0, skippedPromoted = 0;
  const startedAt = Date.now();
  for (const row of work) {
    if (processed >= MAX_PER_RUN) { console.log(`  ⏭ Reached MAX_PER_RUN (${MAX_PER_RUN})`); break; }
    if (Date.now() - startedAt > MAX_RUNTIME_MS) { console.log('  ⏭ Reached MAX_RUNTIME_MINUTES'); break; }
    const ep = epById.get(row.episode_id);
    const feed = feedById.get(ep.feed_id) || {};
    if (row.picks_promoted_at && !REEXTRACT_INCLUDE_PROMOTED) {
      skippedPromoted++;
      console.log(`  ⏭ promoted already, skipped: [${feed.name}] "${String(ep.title).slice(0, 60)}"`);
      continue;
    }
    const before = { picks: Array.isArray(row.picks) ? row.picks.length : 0, intel: Array.isArray(row.intel) ? row.intel.length : 0 };
    console.log(`\n  🎙 [${feed.name}] ${String(ep.pub_date).slice(0, 10)} "${String(ep.title).slice(0, 60)}" (${row.transcript_text.length.toLocaleString()} chars)`);
    try {
      const { picks, intel, extractionModel, chunkCount } = await fetchWithRetry(
        () => extractPicksAndIntel(row.transcript_text, feed.expert || feed.name)
      );
      console.log(`    ✅ ${picks.length} picks, ${intel.length} intel over ${chunkCount} chunk(s) via ${extractionModel} (was ${before.picks}/${before.intel})`);
      processed++;
      if (DRY_RUN) continue;
      const transcriptionLeg = String(row.model_used || 'unknown').split('+')[0];
      const { error: upErr } = await supabase
        .from('podcast_transcripts')
        .update({ picks, intel, model_used: `${transcriptionLeg}+${extractionModel}` })
        .eq('episode_id', row.episode_id);
      if (upErr) throw new Error(`update failed: ${upErr.message}`);
    } catch (err) {
      if (err instanceof ExtractionUnavailableError) {
        console.error(`    ⛔ ${err.message} — stopping re-extract run`);
        errors++;
        break;
      }
      console.error(`    ❌ ${err.message}`);
      errors++;
    }
  }
  console.log(`\n📊 Re-extract complete: ${processed} updated, ${skippedPromoted} skipped (already promoted), ${errors} error(s)`);
  return { processed, errors };
}

// ─── Main run ─────────────────────────────────────────────────────────────────

async function run() {
  const startedAt = Date.now();

  // Need at least one extraction provider, or every transcription we pay for is wasted.
  if (liveProviderCount(ORDERED_EXTRACTION_PROVIDERS, deadExtractionProviders) === 0) {
    console.error('❌ No extraction provider key set (GEMINI_API_KEY / ANTHROPIC_API_KEY / OPENAI_API_KEY)');
    process.exit(1);
  }
  if (!GROQ_KEY && !ASSEMBLYAI_KEY && !OPENAI_KEY) {
    console.error('❌ No transcription provider key set (GROQ_API_KEY / ASSEMBLYAI_API_KEY / OPENAI_API_KEY)');
    process.exit(1);
  }
  console.log(`🤖 Extraction order: ${ORDERED_EXTRACTION_PROVIDERS.map((p) => `${p.label}${p.keyPresent ? '' : ' (no key)'}`).join(' → ')}`);
  if (DRY_RUN) console.log('🔍 DRY RUN mode — no Supabase writes, no transcription');

  const supabase = getSupabase();

  if (REEXTRACT_SINCE) {
    const { errors } = await reextractStored(supabase);
    if (errors > 0) process.exit(1);
    return;
  }

  // 1. Load active feeds from Supabase
  const { data: feeds, error: feedErr } = await supabase
    .from('podcast_feeds')
    .select('*')
    .eq('active', true);

  if (feedErr) { console.error('❌ Failed to load feeds:', feedErr.message); process.exit(1); }
  console.log(`📡 Loaded ${feeds.length} active feeds`);

  let totalDiscovered = 0;
  let totalProcessed  = 0;
  let totalAttempted  = 0; // successes AND failures count toward MAX_PER_RUN (failures cost money too)
  let totalErrors     = 0;
  let stopRun         = false;
  const candidates    = []; // every feed's processable episodes; ordered globally after discovery

  for (const feed of feeds) {
    if (stopRun) break;
    if (Date.now() - startedAt > MAX_RUNTIME_MS) {
      console.warn('⏱ Approaching max runtime — stopping early');
      break;
    }

    console.log(`\n📻 ${feed.name}`);

    // 2. Fetch + parse RSS
    let episodes;
    try {
      const xml = await fetchWithRetry(() => fetchRss(feed.rss_url));
      episodes  = parseRssFeed(xml);
      console.log(`  ↳ ${episodes.length} recent episodes in feed`);
    } catch (err) {
      console.error(`  ❌ RSS fetch failed: ${err.message}`);
      continue;
    }

    if (episodes.length === 0) continue;

    // 3. Filter out already-known guids
    const guids = episodes.map(e => e.guid);
    const { data: existing } = await supabase
      .from('podcast_episodes')
      .select('guid, id, status')
      .in('guid', guids);

    const knownMap   = new Map((existing ?? []).map(r => [r.guid, r]));
    const discovered = episodes.filter(e => !knownMap.has(e.guid));
    const newEps     = discovered.filter(e => {
      if (isNflRelevantEpisode(e.title)) return true;
      console.log(`  ⏭ skip (non-NFL): "${(e.title ?? '').slice(0, 70)}"`);
      return false;
    });
    console.log(`  ↳ ${newEps.length} new (${knownMap.size} known, ${discovered.length - newEps.length} skipped non-NFL)`);

    // 4. Insert new episodes as 'pending' in Supabase
    if (newEps.length > 0 && !DRY_RUN) {
      const insertRows = newEps.map(ep => ({
        feed_id:       feed.id,
        guid:          ep.guid,
        title:         ep.title,
        pub_date:      ep.pub_date,
        audio_url:     ep.audio_url,
        duration_secs: ep.duration_secs,
        status:        'pending',
      }));
      const { error: insertErr } = await supabase
        .from('podcast_episodes')
        .insert(insertRows);
      if (insertErr) {
        console.error(`  ❌ Insert episodes failed: ${insertErr.message}`);
        continue;
      }
    }

    totalDiscovered += newEps.length;

    // 4b. Also pick up any already-discovered but unprocessed episodes from DB
    //     (status='pending' or 'error') so they don't get stuck forever.
    const { data: queued } = await supabase
      .from('podcast_episodes')
      .select('id, guid, title, audio_url, duration_secs, pub_date')
      .eq('feed_id', feed.id)
      .in('status', ['pending', 'error'])
      .order('pub_date', { ascending: false })
      .limit(10);

    const queuedIds = (queued ?? []).map(row => row.id).filter(Boolean);
    let queuedWithTranscripts = new Set();
    if (queuedIds.length > 0) {
      const { data: existingTranscripts, error: transcriptErr } = await supabase
        .from('podcast_transcripts')
        .select('episode_id')
        .in('episode_id', queuedIds);
      if (transcriptErr) {
        console.warn(`  ⚠ transcript lookup failed: ${transcriptErr.message}`);
      } else {
        queuedWithTranscripts = new Set((existingTranscripts ?? []).map(row => row.episode_id));
      }
    }

    const staleDoneIds = queuedIds.filter(id => queuedWithTranscripts.has(id));
    if (staleDoneIds.length > 0) {
      console.log(`  ↳ ${staleDoneIds.length} queued episode(s) already have transcripts; skipping retry`);
      if (!DRY_RUN) {
        const { error: staleErr } = await supabase
          .from('podcast_episodes')
          .update({ status: 'done', error_msg: null })
          .in('id', staleDoneIds);
        if (staleErr) console.warn(`  ⚠ stale status repair failed: ${staleErr.message}`);
      }
    }

    // Merge: new episodes (use RSS data) + queued-from-DB (use DB row).
    // Use a Map keyed by guid to deduplicate.
    const toProcessMap = new Map();
    for (const ep of newEps) {
      toProcessMap.set(ep.guid, { ...ep, _fromRss: true });
    }
    for (const row of (queued ?? [])) {
      if (queuedWithTranscripts.has(row.id)) continue;
      if (!toProcessMap.has(row.guid)) {
        toProcessMap.set(row.guid, {
          guid:          row.guid,
          title:         row.title ?? '(untitled)',
          audio_url:     row.audio_url,
          duration_secs: row.duration_secs,
          pub_date:      row.pub_date ?? null,
          _dbId:         row.id,   // already in DB — skip the id lookup step
        });
      }
    }

    const skippedNonNflIds = [];
    const toProcess = [...toProcessMap.values()].filter(ep => {
      if (isNflRelevantEpisode(ep.title)) return true;
      console.log(`  ⏭ skip (non-NFL backlog): "${(ep.title ?? '').slice(0, 70)}"`);
      if (ep._dbId) skippedNonNflIds.push(ep._dbId);
      return false;
    });
    if (skippedNonNflIds.length > 0 && !DRY_RUN) {
      const { error: skipErr } = await supabase
        .from('podcast_episodes')
        .update({ status: 'skipped_non_nfl', error_msg: null })
        .in('id', skippedNonNflIds);
      if (skipErr) console.warn(`  ⚠ non-NFL skip status update failed: ${skipErr.message}`);
    }
    if (toProcess.length === 0) {
      console.log(`  ✅ No episodes to process`);
      continue;
    }
    console.log(`  ↳ ${toProcess.length} episode(s) queued for processing`);
    for (const ep of toProcess) candidates.push({ ...ep, _feed: feed });
  }

  // 5. Process episodes NEWEST-FIRST ACROSS ALL FEEDS (up to MAX_PER_RUN total), skipping
  //    anything older than MAX_EPISODE_AGE_DAYS (left queued). See agents/lib/episode-queue.js.
  const { queue: runQueue, tooOld } = planEpisodeQueue(candidates, { now: new Date(), maxAgeDays: MAX_EPISODE_AGE_DAYS });
  console.log(`\n🗂  ${candidates.length} candidate episode(s) across feeds; processing newest-first (cap ${MAX_PER_RUN})`);
  if (tooOld.length > 0) {
    console.log(`  ⏭ ${tooOld.length} older than ${MAX_EPISODE_AGE_DAYS} days left queued (set MAX_EPISODE_AGE_DAYS to backfill)`);
  }
  {
    for (const ep of runQueue) {
      const feed = ep._feed;
      if (stopRun) break;
      if (totalAttempted >= MAX_PER_RUN) {
        console.log(`  ⏭ Reached MAX_PER_RUN (${MAX_PER_RUN}) — remaining episodes queued`);
        break;
      }
      if (Date.now() - startedAt > MAX_RUNTIME_MS) break;

      console.log(`\n  🎙 [${feed.name}] ${(ep.pub_date ?? '').slice(0, 10)} "${ep.title.slice(0, 70)}"`);
      totalAttempted++;

      // Fetch the episode's DB id (use cached _dbId for pre-existing rows)
      let episodeId = ep._dbId ?? null;
      if (!DRY_RUN && !episodeId) {
        const { data: row } = await supabase
          .from('podcast_episodes')
          .select('id')
          .eq('guid', ep.guid)
          .single();
        episodeId = row?.id;
      }

      if (DRY_RUN) {
        console.log(`  ✅ [DRY RUN] Would transcribe + extract picks`);
        continue;
      }

      // Mark as 'transcribing'
      await supabase
        .from('podcast_episodes')
        .update({ status: 'transcribing' })
        .eq('id', episodeId);

      // Multi-host shows need real diarization for per-host attribution (see
      // agents/lib/speaker-attribution.js). Single-host shows keep using the
      // free Groq default; diarization would be wasted spend for them.
      //
      // 2026-09-24: diarized shows now default to Gemini (agents/lib/gemini-
      // audio-transcribe.js), which does native speaker diarization and has
      // no AssemblyAI-style balance dependency. AssemblyAI is kept as a
      // fallback if Gemini fails or GEMINI_API_KEY isn't set — before this
      // change, diarized shows were AssemblyAI-only with NO fallback, which
      // is what left 5 shows fully blocked when AssemblyAI's balance went
      // negative on 2026-09-21.
      const wantsDiarization = feed.needs_diarization === true;

      let tmpFile  = null;
      let modelUsed = 'whisper'; // transcription leg only; extraction model appended after step 5d
      try {
        let transcript;
        let speakerSegments = [];

        if (wantsDiarization) {
          // 5a. Diarized path — Gemini first (native diarization, no
          // download-size cap), falling back to AssemblyAI if Gemini fails
          // or no GEMINI_API_KEY is configured.
          if (GEMINI_KEY) {
            try {
              modelUsed = 'gemini-diarized';
              const result = await transcribeWithGeminiAudio(ep.audio_url, { displayName: ep.title });
              transcript = result.text;
              speakerSegments = result.utterances;
            } catch (err) {
              if (ASSEMBLYAI_KEY) {
                console.warn(`    ⚠ Gemini diarization failed (${err.message}) — falling back to AssemblyAI`);
                modelUsed = 'assemblyai-diarized';
                const result = await transcribeWithAssemblyAI(ep.audio_url, { diarize: true });
                transcript = result.text;
                speakerSegments = result.utterances;
              } else {
                throw err; // no fallback available — propagate
              }
            }
          } else if (ASSEMBLYAI_KEY) {
            modelUsed = 'assemblyai-diarized';
            const result = await transcribeWithAssemblyAI(ep.audio_url, { diarize: true });
            transcript = result.text;
            speakerSegments = result.utterances;
          } else {
            throw new Error('Diarized show but neither GEMINI_API_KEY nor ASSEMBLYAI_API_KEY is set');
          }

        } else if (USE_ASSEMBLYAI) {
          // 5a. AssemblyAI path (Groq unavailable) — submit URL directly, no download needed
          modelUsed  = 'assemblyai';
          transcript = (await transcribeWithAssemblyAI(ep.audio_url)).text;

        } else {
          // 5a. Whisper path (Groq or OpenAI) — download first
          modelUsed = GROQ_KEY ? 'groq-whisper-large-v3' : 'whisper-1';
          console.log(`    ⬇ Downloading audio...`);
          const { filePath, isPartial, sizeBytes } = await fetchWithRetry(
            () => downloadAudio(ep.audio_url)
          );
          tmpFile = filePath;

          console.log(`    📦 ${(sizeBytes / 1024 / 1024).toFixed(1)} MB${isPartial ? ' (partial)' : ''}`);

          // Update file_size + is_partial in DB
          await supabase
            .from('podcast_episodes')
            .update({ file_size_bytes: sizeBytes, is_partial: isPartial })
            .eq('id', episodeId);

          // 5b. Whisper transcription — fall through to AssemblyAI if Groq rate-limited
          console.log(`    🎤 Transcribing via Whisper...`);
          try {
            transcript = await fetchWithRetry(() => transcribeAudio(filePath));
            const wordCount = transcript.split(/\s+/).length;
            console.log(`    ✍ ${wordCount.toLocaleString()} words transcribed`);
          } catch (err) {
            if (err instanceof RateLimitError && ASSEMBLYAI_KEY) {
              console.warn(`    ⚠ Groq rate-limited — falling back to AssemblyAI`);
              modelUsed  = 'assemblyai';
              transcript = (await transcribeWithAssemblyAI(ep.audio_url)).text;
            } else {
              throw err; // propagate — no fallback available
            }
          }
        }

        // 5c. Mark as 'extracting'
        await supabase
          .from('podcast_episodes')
          .update({ status: 'extracting' })
          .eq('id', episodeId);

        // 5d. Pick + intel extraction — GPT-4o, falling back to Claude then
        // Gemini if a provider is down or out of credits (see
        // extractPicksAndIntel's fallback chain above, wired 2026-09-14).
        console.log(`    🤖 Extracting picks + intel...`);
        const { picks, intel, extractionModel } = await fetchWithRetry(
          () => extractPicksAndIntel(transcript, feed.expert)
        );
        console.log(`    ✅ ${picks.length} picks, ${intel.length} intel items (via ${extractionModel})`);
        // modelUsed so far is just the transcription leg (e.g.
        // 'groq-whisper-large-v3'); append which extraction model actually
        // produced the picks so podcast_transcripts.model_used reflects
        // reality even when a fallback silently kicked in.
        modelUsed = `${modelUsed}+${extractionModel}`;

        // 5e. Write transcript to Supabase
        const whisperMinutes = ep.duration_secs ? Math.ceil(ep.duration_secs / 60) : null;
        const { error: txErr } = await supabase
          .from('podcast_transcripts')
          .insert({
            episode_id:       episodeId,
            transcript_text:  transcript,
            picks:            picks,
            intel:            intel,
            whisper_minutes:  whisperMinutes,
            model_used:       modelUsed,
            speaker_segments: speakerSegments,
          });

        if (txErr) throw new Error(`Transcript insert failed: ${txErr.message}`);

        // 5f. Mark episode as 'done'
        await supabase
          .from('podcast_episodes')
          .update({ status: 'done' })
          .eq('id', episodeId);

        totalProcessed++;

      } catch (err) {
        // Rate limit: mark back as pending (not error) so next run retries.
        // Stop processing remaining episodes — they'll all fail the same way.
        // No extraction provider left (all out of credits / bad keys): stop the whole run
        // now so we don't pay to transcribe more episodes we can't extract. Leave the
        // episode 'pending' so it is retried once a provider is fixed.
        if (err instanceof ExtractionUnavailableError) {
          console.error(`    ⛔ ${err.message}`);
          console.error('    ⛔ Stopping run: fix a provider key/credits, then re-run.');
          totalErrors++;
          stopRun = true;
          if (episodeId && !DRY_RUN) {
            await supabase
              .from('podcast_episodes')
              .update({ status: 'pending', error_msg: err.message.slice(0, 500) })
              .eq('id', episodeId);
          }
          break;
        }
        if (err instanceof RateLimitError) {
          console.warn(`    ⏳ ${err.message} — stopping this run early`);
          if (episodeId) {
            await supabase
              .from('podcast_episodes')
              .update({ status: 'pending', error_msg: null })
              .eq('id', episodeId);
          }
          stopRun = true; // (previously claimed but not enforced — other feeds kept going)
          break;
        }

        console.error(`    ❌ Processing failed: ${err.message}`);
        totalErrors++;

        if (episodeId) {
          await supabase
            .from('podcast_episodes')
            .update({ status: 'error', error_msg: err.message.slice(0, 500) })
            .eq('id', episodeId);
        }
      } finally {
        // Always clean up temp file
        if (tmpFile) {
          try { unlinkSync(tmpFile); } catch { /* ignore */ }
        }
      }
    }
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`\n📊 Run complete in ${elapsed}s`);
  console.log(`   Discovered: ${totalDiscovered} new episodes`);
  console.log(`   Processed:  ${totalProcessed} transcribed + extracted`);
  console.log(`   Errors:     ${totalErrors}`);

  if (totalErrors > 0) process.exit(1);
}

run().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
