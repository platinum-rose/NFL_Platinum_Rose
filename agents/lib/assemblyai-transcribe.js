// agents/lib/assemblyai-transcribe.js
// ═══════════════════════════════════════════════════════════════════════════════
// Shared AssemblyAI transcription helper — submit + poll, with optional speaker
// diarization. Extracted from agents/podcast-ingest.js (2026-07-20, S291) so
// scripts/podcast-diarize-backfill.js can reuse the exact same submit/poll/
// error-handling logic instead of duplicating it. podcast-ingest.js now imports
// this module; behavior is byte-identical to the original inline version.
//
// Docs: https://www.assemblyai.com/docs/api-reference/transcripts/submit
// ═══════════════════════════════════════════════════════════════════════════════

const ASSEMBLYAI_BASE = 'https://api.assemblyai.com/v2';

/**
 * Submits an audio URL to AssemblyAI for transcription and polls until complete.
 * AssemblyAI accepts a public URL directly — no file download required.
 *
 * @param {string} audioUrl  Public URL of the audio file
 * @param {{ diarize?: boolean, apiKey?: string }} [opts]  Pass diarize:true for
 *   multi-host shows (see podcast_feeds.needs_diarization) — requests
 *   AssemblyAI's built-in speaker_labels so co-hosts can be attributed to real
 *   names downstream via agents/lib/speaker-attribution.js, instead of guessed
 *   from flat text. apiKey defaults to process.env.ASSEMBLYAI_API_KEY (read at
 *   call time, not module load time, so this module has no import-time env
 *   dependency).
 * @returns {Promise<{ text: string, utterances: Array<{speaker: string, text: string, start: number, end: number}> }>}
 */
export async function transcribeWithAssemblyAI(audioUrl, { diarize = false, apiKey } = {}) {
  const key = apiKey ?? process.env.ASSEMBLYAI_API_KEY;
  if (!key) throw new Error('ASSEMBLYAI_API_KEY is not set');

  console.log(`    🎤 Using AssemblyAI (URL-based, no download)${diarize ? ' + speaker diarization' : ''}`);

  const headers = {
    'Authorization': key,
    'Content-Type':  'application/json',
  };

  // 1. Submit transcription job
  const submitRes = await fetch(`${ASSEMBLYAI_BASE}/transcript`, {
    method:  'POST',
    headers,
    body:    JSON.stringify({
      audio_url: audioUrl,
      language_code: 'en',
      speech_models: ['universal-2'],
      ...(diarize ? { speaker_labels: true } : {}),
    }),
    signal:  AbortSignal.timeout(30_000),
  });

  if (!submitRes.ok) {
    const err = await submitRes.text();
    throw new Error(`AssemblyAI submit failed: ${err}`);
  }

  const { id: transcriptId } = await submitRes.json();
  if (!transcriptId) throw new Error('AssemblyAI: no transcript ID returned');

  console.log(`    ⏳ AssemblyAI job submitted — id: ${transcriptId}`);

  // 2. Poll until complete (status: queued → processing → completed | error)
  const POLL_INTERVAL_MS = 10_000;         // gentle interval — AssemblyAI throttles rapid status polls
  const MAX_WAIT_MS      = 25 * 60 * 1000; // 25 min ceiling (podcast episodes can be long)
  const startPoll        = Date.now();
  let   pollFailures     = 0;

  while (true) {
    if (Date.now() - startPoll > MAX_WAIT_MS) {
      throw new Error(`AssemblyAI: timed out after ${MAX_WAIT_MS / 60000} min`);
    }

    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

    // A single slow/aborted status check must NOT kill the episode — AssemblyAI keeps
    // transcribing server-side regardless. Retry transient poll errors until MAX_WAIT_MS;
    // only a real 'error' status or the overall ceiling ends the attempt.
    let result;
    try {
      const pollRes = await fetch(`${ASSEMBLYAI_BASE}/transcript/${transcriptId}`, {
        headers,
        signal: AbortSignal.timeout(20_000),
      });
      if (!pollRes.ok) throw new Error(`HTTP ${pollRes.status}: ${await pollRes.text()}`);
      result = await pollRes.json();
      pollFailures = 0;
    } catch (err) {
      pollFailures += 1;
      const elapsedMin = ((Date.now() - startPoll) / 60000).toFixed(1);
      console.log(`    ⏳ poll retry ${pollFailures} (${elapsedMin}m elapsed) — ${err.message}`);
      continue;
    }

    if (result.status === 'completed') {
      const wordCount = result.words?.length ?? result.text?.split(/\s+/).length ?? 0;
      // utterances only present when speaker_labels:true was requested; each is
      // { speaker: 'A'|'B'|..., text, start, end (ms) }. Convert start/end to
      // seconds to match the {start,end} convention used everywhere else in
      // this codebase (see agents/lib/speaker-attribution.js).
      const utterances = (result.utterances ?? []).map(u => ({
        speaker: u.speaker,
        text:    u.text ?? '',
        start:   (u.start ?? 0) / 1000,
        end:     (u.end ?? 0) / 1000,
      }));
      console.log(`    ✍ AssemblyAI complete — ${wordCount.toLocaleString()} words${utterances.length ? `, ${utterances.length} diarized turns` : ''}`);
      return { text: result.text ?? '', utterances };
    }

    if (result.status === 'error') {
      throw new Error(`AssemblyAI transcription error: ${result.error ?? 'unknown'}`);
    }

    // Still queued or processing — log progress
    const elapsedMin = ((Date.now() - startPoll) / 60000).toFixed(1);
    console.log(`    ⏳ AssemblyAI status: ${result.status} (${elapsedMin}m elapsed)`);
  }
}
