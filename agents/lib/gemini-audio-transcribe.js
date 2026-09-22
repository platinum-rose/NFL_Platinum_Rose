// agents/lib/gemini-audio-transcribe.js
// ═══════════════════════════════════════════════════════════════════════════════
// Diarized transcription via Gemini's audio-understanding endpoint — the
// default transcription path for multi-host shows (podcast_feeds.needs_
// diarization = true) as of 2026-09-24. Replaces the old AssemblyAI-only
// branch in agents/podcast-ingest.js, which had NO fallback for these 5 shows
// (Sharp or Square, Even Money, BettingPros Podcast, The Athletic Football
// Show, Move the Sticks) and went fully dark when AssemblyAI's balance went
// negative on 2026-09-21 (see handoffs/2026-09-22-...-gemini-podcast-
// pipeline-handoff.md). Single-host shows are unaffected — they keep using
// the free Groq/Whisper path in podcast-ingest.js untouched.
//
// This is deliberately narrower than the full migration proposed in
// docs/antigravity/GEMINI_AUDIO_MIGRATION_SPEC.md (which would also replace
// Groq for single-host shows and skip the separate text-extraction pass).
// Here, Gemini only replaces the TRANSCRIPTION + DIARIZATION leg; the
// existing extractPicksAndIntel() text-extraction chain (GPT-4o -> Claude ->
// Gemini) in podcast-ingest.js runs unchanged on the transcript this module
// returns.
//
// Unlike AssemblyAI (which accepts a public audio_url directly), Gemini's
// File API needs the bytes uploaded, so this module downloads the FULL
// episode first — no MAX_AUDIO_BYTES truncation like podcast-ingest.js's
// downloadAudio(), since diarized shows are exactly the ones where losing the
// back half of a 60-90 min episode would cost the most (Gemini supports up to
// 9.5h / ~2GB of audio per file, so there is no need to truncate).
//
// Contract: transcribeWithGeminiAudio() returns the SAME shape as
// transcribeWithAssemblyAI(url, {diarize:true}) —
//   { text: string, utterances: [{speaker, text, start, end (seconds)}] }
// — with anonymous speaker labels ('A','B',...) in order of first appearance,
// so agents/lib/speaker-attribution.js needs no changes at all.
//
// Docs: https://ai.google.dev/gemini-api/docs/audio
//       https://ai.google.dev/gemini-api/docs/files
// ═══════════════════════════════════════════════════════════════════════════════

import { createWriteStream, readFileSync, unlinkSync, statSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com';
// Same model id podcast-ingest.js already uses for text extraction (checked
// stable 2026-09-19; gemini-2.0-flash is shut down). Override with
// GEMINI_AUDIO_MODEL if a dedicated transcription model becomes the better
// choice later.
const DEFAULT_MODEL = process.env.GEMINI_AUDIO_MODEL || process.env.GEMINI_EXTRACTION_MODEL || 'gemini-3.6-flash';

function guessMimeType(url) {
  const clean = url.split('?')[0].toLowerCase();
  if (clean.endsWith('.m4a')) return 'audio/mp4';
  if (clean.endsWith('.wav')) return 'audio/wav';
  if (clean.endsWith('.ogg')) return 'audio/ogg';
  if (clean.endsWith('.flac')) return 'audio/flac';
  if (clean.endsWith('.aac')) return 'audio/aac';
  return 'audio/mpeg'; // mp3 default — nearly all podcast RSS enclosures
}

/**
 * Downloads the full episode audio with no size cap. Deliberately NOT reusing
 * podcast-ingest.js's downloadAudio(), which truncates at MAX_AUDIO_BYTES
 * (24 MB, a Whisper limit) — that would cut off the back half of exactly the
 * long, multi-host shows this path exists for. Gemini handles far larger
 * files via the File API.
 */
async function downloadFullAudio(url) {
  const tmpPath = join(tmpdir(), `pr-podcast-gemini-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.audio`);
  const res = await fetch(url, {
    headers: { 'User-Agent': 'NFL-Platinum-Rose-PodcastAgent/1.0' },
    signal: AbortSignal.timeout(180_000),
  });
  if (!res.ok) throw new Error(`Gemini audio download failed: HTTP ${res.status}`);
  await pipeline(res.body, createWriteStream(tmpPath));
  return { filePath: tmpPath, sizeBytes: statSync(tmpPath).size, mimeType: guessMimeType(url) };
}

/** Resumable upload to Gemini's File API. Returns the file resource (name, uri, mimeType, state). */
async function uploadToGeminiFileApi(filePath, sizeBytes, mimeType, apiKey, displayName) {
  const startRes = await fetch(`${GEMINI_BASE}/upload/v1beta/files?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(sizeBytes),
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: displayName } }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!startRes.ok) throw new Error(`Gemini file upload (start) failed: ${await startRes.text()}`);
  const uploadUrl = startRes.headers.get('x-goog-upload-url');
  if (!uploadUrl) throw new Error('Gemini file upload: no upload URL returned in x-goog-upload-url header');

  const bytes = readFileSync(filePath);
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': String(sizeBytes),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    },
    body: bytes,
    signal: AbortSignal.timeout(300_000),
  });
  if (!uploadRes.ok) throw new Error(`Gemini file upload (bytes) failed: ${await uploadRes.text()}`);
  const { file } = await uploadRes.json();
  if (!file?.uri || !file?.name) throw new Error(`Gemini file upload: malformed response ${JSON.stringify(file)}`);
  return file;
}

/** Polls until the uploaded file leaves PROCESSING state (required for audio/video). */
async function waitForFileActive(fileName, apiKey) {
  const MAX_WAIT_MS = 5 * 60 * 1000;
  const start = Date.now();
  while (true) {
    const res = await fetch(`${GEMINI_BASE}/v1beta/${fileName}?key=${apiKey}`, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`Gemini file status check failed: ${await res.text()}`);
    const file = await res.json();
    if (file.state === 'ACTIVE') return file;
    if (file.state === 'FAILED') throw new Error(`Gemini file processing failed: ${JSON.stringify(file.error ?? {})}`);
    if (Date.now() - start > MAX_WAIT_MS) throw new Error('Gemini file processing timed out after 5 min');
    await new Promise((r) => setTimeout(r, 5000));
  }
}

/** Best-effort cleanup — uploaded files auto-expire after 48h regardless, so failures here are non-fatal. */
async function deleteGeminiFile(fileName, apiKey) {
  try {
    await fetch(`${GEMINI_BASE}/v1beta/${fileName}?key=${apiKey}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    // ignore — non-fatal
  }
}

const DIARIZATION_PROMPT = `Listen to this entire podcast episode audio and produce a diarized transcript.

Return ONLY valid JSON (no markdown code fences, no commentary before or after) in exactly this shape:
{"utterances": [{"speaker": "A", "text": "...", "start": 0.0, "end": 4.2}, ...]}

Rules:
- One entry per continuous turn of speech by a single speaker.
- Label speakers anonymously as "A", "B", "C", etc. in the order they first speak in the episode. Do NOT guess or output real names — a separate step maps these labels to real hosts later.
- "start" and "end" are seconds from the beginning of the audio, as numbers (not strings, not MM:SS).
- Cover the FULL episode from start to end in chronological order. Do not skip ad breaks, banter, or cross-talk — include everything, a later step filters ads out.
- Transcribe speech verbatim (light cleanup of "um"/"uh" filler is fine); do not summarize, paraphrase, or omit sections for brevity.
- If speakers talk over each other, split into separate consecutive utterances as best you can rather than merging them.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    utterances: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          speaker: { type: 'string' },
          text: { type: 'string' },
          start: { type: 'number' },
          end: { type: 'number' },
        },
        required: ['speaker', 'text', 'start', 'end'],
      },
    },
  },
  required: ['utterances'],
};

function extractJsonText(text) {
  const trimmed = String(text ?? '').trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenced ? fenced[1].trim() : trimmed;
}

/**
 * Transcribes + diarizes a podcast episode via Gemini's audio-understanding
 * model. Drop-in compatible with transcribeWithAssemblyAI(url, {diarize:true}).
 *
 * @param {string} audioUrl  Public URL of the episode audio (RSS enclosure)
 * @param {{apiKey?: string, model?: string, displayName?: string}} [opts]
 * @returns {Promise<{text: string, utterances: Array<{speaker:string,text:string,start:number,end:number}>}>}
 */
export async function transcribeWithGeminiAudio(audioUrl, { apiKey, model, displayName } = {}) {
  const key = apiKey ?? process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  const useModel = model ?? DEFAULT_MODEL;

  console.log(`    🎤 Using Gemini (${useModel}) + native diarization (no download cap)`);
  const { filePath, sizeBytes, mimeType } = await downloadFullAudio(audioUrl);
  console.log(`    📦 ${(sizeBytes / 1024 / 1024).toFixed(1)} MB — uploading to Gemini File API...`);

  let uploadedFileName = null;
  try {
    const uploaded = await uploadToGeminiFileApi(filePath, sizeBytes, mimeType, key, displayName ?? 'podcast-episode');
    uploadedFileName = uploaded.name;

    console.log(`    ⏳ Waiting for Gemini to finish processing the upload...`);
    const active = await waitForFileActive(uploaded.name, key);

    console.log(`    🧠 Requesting diarized transcript (this can take a few minutes for long episodes)...`);

    // The generateContent call is the longest-running, most network-exposed
    // leg of this pipeline (a 90-min diarization request can run for several
    // minutes), so it is the leg most likely to hit a transient connection
    // drop (socket reset, DNS blip, TLS hiccup) rather than an actual API
    // error. Node's fetch() collapses all of those into a bare
    // "TypeError: fetch failed" with the real reason in err.cause, so one
    // retry here is cheap insurance against a one-off network fault —
    // especially important right now since AssemblyAI (the fallback for this
    // whole module) is balance-blocked and offers no safety net of its own.
    const GENERATION_ATTEMPTS = 2;
    let genRes;
    for (let attempt = 1; attempt <= GENERATION_ATTEMPTS; attempt++) {
      try {
        genRes = await fetch(`${GEMINI_BASE}/v1beta/models/${useModel}:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [
                { fileData: { mimeType: active.mimeType ?? mimeType, fileUri: active.uri } },
                { text: DIARIZATION_PROMPT },
              ],
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 65536,
              responseMimeType: 'application/json',
              responseSchema: RESPONSE_SCHEMA,
            },
          }),
          // Long episodes -> long generation. Diarizing a 90-min show can take
          // several minutes; give it real room rather than the 60s ceiling used
          // for text-only extraction calls elsewhere in this codebase.
          signal: AbortSignal.timeout(600_000),
        });
        break;
      } catch (err) {
        if (attempt >= GENERATION_ATTEMPTS) throw err;
        console.warn(`    ⚠ Gemini generateContent network error (${err.message}${err.cause ? `, cause: ${err.cause}` : ''}) — retrying (${attempt}/${GENERATION_ATTEMPTS - 1})...`);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }

    if (!genRes.ok) {
      const err = await genRes.text();
      throw new Error(`Gemini audio transcription failed: ${err}`);
    }

    const data = await genRes.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) {
      const finishReason = data.candidates?.[0]?.finishReason;
      throw new Error(`Gemini audio transcription: empty response (finishReason=${finishReason ?? 'unknown'})`);
    }

    let parsed;
    try {
      parsed = JSON.parse(extractJsonText(raw));
    } catch (e) {
      throw new Error(`Gemini audio transcription: could not parse JSON response (${e.message})`);
    }

    const utterances = (Array.isArray(parsed.utterances) ? parsed.utterances : []).map((u) => ({
      speaker: String(u.speaker ?? 'A'),
      text: String(u.text ?? ''),
      start: Number(u.start ?? 0),
      end: Number(u.end ?? 0),
    })).filter((u) => u.text.trim().length > 0);

    if (utterances.length === 0) {
      throw new Error('Gemini audio transcription: no utterances returned');
    }

    const text = utterances.map((u) => u.text).join(' ').trim();
    console.log(`    ✍ Gemini complete — ${text.split(/\s+/).length.toLocaleString()} words, ${utterances.length} diarized turns`);
    return { text, utterances };
  } finally {
    if (uploadedFileName) await deleteGeminiFile(uploadedFileName, key);
    try { unlinkSync(filePath); } catch { /* tmp file cleanup best-effort */ }
  }
}
