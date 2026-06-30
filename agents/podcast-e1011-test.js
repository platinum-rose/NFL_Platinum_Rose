// agents/podcast-e1011-test.js
// ═══════════════════════════════════════════════════════════════════════════════
// One-off E1011 pipeline test — BettingPros Podcast, Ep 1011
// "NFL Futures: Best Division, Playoff, and No. 1 Seed Bets in 2026"
// Hosts: Seth Woolcock + Andrew Erickson | Runtime: ~57 min
//
// This script demonstrates what the production pipeline SHOULD do:
//   ✅ Full audio download (no 24 MB cap)
//   ✅ AssemblyAI transcription with REAL speaker diarization
//   ✅ Chunked extraction across full transcript (not just first 12K chars)
//   ✅ Anthropic Claude for extraction (fallback when OpenAI quota exceeded)
//   ✅ HTML report output with per-speaker attribution
//
// Usage (Windows PowerShell from project root):
//   node agents/podcast-e1011-test.js
//
// Env vars used (all already in .env):
//   ASSEMBLYAI_API_KEY  — transcription with speaker diarization (preferred)
//   ANTHROPIC_API_KEY   — extraction via Claude Sonnet (preferred over OpenAI)
//   OPENAI_API_KEY      — extraction fallback if Anthropic unavailable
//   GROQ_API_KEY        — transcription fallback (fast, free, no diarization)
//
// Output:
//   .nfl/reports/bettingpros-e1011-intel.html  ← open in browser
//   .nfl/reports/bettingpros-e1011-raw.json    ← full transcript + picks JSON
// ═══════════════════════════════════════════════════════════════════════════════

import { createWriteStream, readFileSync, unlinkSync, statSync, existsSync } from 'node:fs';
import { mkdir, writeFile }   from 'node:fs/promises';
import { pipeline }           from 'node:stream/promises';
import { tmpdir }             from 'node:os';
import { join, resolve }      from 'node:path';
import { fileURLToPath }      from 'node:url';
import 'dotenv/config';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT      = resolve(__dirname, '..');
const OUT_DIR   = join(ROOT, '.nfl', 'reports');

const OPENAI_KEY    = process.env.OPENAI_API_KEY;
const GROQ_KEY      = process.env.GROQ_API_KEY;
const ASSEMBLYAI_KEY = process.env.ASSEMBLYAI_API_KEY;
const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY;

const RSS_URL    = 'https://www.omnycontent.com/d/playlist/e73c998e-6e60-432f-8610-ae210140c5b1/80c4e557-2a08-4bc7-92ea-b2d70144b89e/76a7de50-facb-42a2-b042-b2d70144b8af/podcast.rss';
const TARGET_EP  = '1011';

// Chunked extraction: overlap chunks slightly so picks that span a chunk boundary
// aren't missed. 10K chars ≈ 15 min of speech; overlap by 500 chars.
const CHUNK_SIZE    = 10_000;
const CHUNK_OVERLAP = 500;

// ─── RSS parsing ──────────────────────────────────────────────────────────────

function grabTag(xml, t) {
  const a = xml.indexOf(`<${t}`); if (a < 0) return null;
  const b = xml.indexOf('>', a) + 1;
  const c = xml.indexOf(`</${t}>`, b);
  return c < 0 ? null : xml.slice(b, c).replace(/<!\[CDATA\[|\]\]>/g, '').trim();
}
function grabAttr(xml, t, at) {
  const m = xml.match(new RegExp(`<${t}[^>]+${at}="([^"]+)"`, 'i'));
  return m ? m[1] : null;
}
function parseDuration(raw) {
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  const p = raw.split(':').map(Number);
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  return null;
}

async function findEpisode(rssUrl, epNumber) {
  console.log(`📡 Fetching RSS feed...`);
  const res = await fetch(rssUrl, {
    headers: { 'User-Agent': 'NFL-Platinum-Rose-PodcastAgent/1.0' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`RSS fetch failed: HTTP ${res.status}`);
  const xml = await res.text();

  const items = xml.split('<item>').slice(1);
  console.log(`  ↳ ${items.length} items in feed`);

  for (const item of items) {
    const ep    = grabTag(item, 'itunes:episode');
    const title = grabTag(item, 'title') ?? '';
    if (ep === epNumber || title.includes(`Ep. ${epNumber}`) || title.includes(`E${epNumber}`)) {
      return {
        episode:  ep ?? epNumber,
        title:    title,
        pubDate:  grabTag(item, 'pubDate'),
        audioUrl: grabAttr(item, 'enclosure', 'url'),
        duration: parseDuration(grabTag(item, 'itunes:duration')),
        desc:     grabTag(item, 'description') ?? grabTag(item, 'itunes:summary'),
      };
    }
  }

  // Fallback: just take the first item (most recent) and warn
  console.warn(`  ⚠ Episode ${epNumber} not found by number/title — using most recent episode`);
  const item = items[0];
  return {
    episode:  grabTag(item, 'itunes:episode') ?? '?',
    title:    grabTag(item, 'title') ?? '(untitled)',
    pubDate:  grabTag(item, 'pubDate'),
    audioUrl: grabAttr(item, 'enclosure', 'url'),
    duration: parseDuration(grabTag(item, 'itunes:duration')),
    desc:     grabTag(item, 'description') ?? grabTag(item, 'itunes:summary'),
  };
}

// ─── Audio download (NO size cap for this test) ───────────────────────────────

async function downloadAudio(url) {
  const tmpPath = join(tmpdir(), `bettingpros-e1011-${Date.now()}.mp3`);
  console.log(`\n⬇  Downloading full audio...`);
  console.log(`   URL: ${url.slice(0, 80)}...`);

  // HEAD to get size
  let sizeBytes = null;
  try {
    const head = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(15_000) });
    const cl = head.headers.get('content-length');
    if (cl) sizeBytes = parseInt(cl, 10);
  } catch { /* HEAD not supported by some CDNs */ }

  if (sizeBytes) {
    console.log(`   Declared size: ${(sizeBytes / 1024 / 1024).toFixed(1)} MB`);
  }

  const res = await fetch(url, {
    headers: { 'User-Agent': 'NFL-Platinum-Rose-PodcastAgent/1.0' },
    signal: AbortSignal.timeout(300_000), // 5 min for large file
  });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);

  await pipeline(res.body, createWriteStream(tmpPath));
  const actual = statSync(tmpPath).size;
  console.log(`   Downloaded: ${(actual / 1024 / 1024).toFixed(1)} MB → ${tmpPath}`);
  return { filePath: tmpPath, sizeBytes: actual };
}

// ─── Transcription — AssemblyAI (speaker diarization) or Whisper fallback ─────

/**
 * AssemblyAI: submit audio URL directly (no download size limit), get back
 * full transcript + speaker labels (SPEAKER_A, SPEAKER_B, ...) per utterance.
 */
async function transcribeWithAssemblyAI(audioUrl) {
  if (!ASSEMBLYAI_KEY) throw new Error('ASSEMBLYAI_API_KEY not set');
  console.log(`\n🎤 Transcribing via AssemblyAI (speaker diarization enabled)...`);
  console.log(`   Submitting URL directly — no download size limit.`);

  const BASE = 'https://api.assemblyai.com/v2';
  const headers = { 'Authorization': ASSEMBLYAI_KEY, 'Content-Type': 'application/json' };

  // Submit with speaker_labels for diarization
  const sub = await fetch(`${BASE}/transcript`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      audio_url:     audioUrl,
      language_code: 'en',
      speaker_labels: true,          // ← real diarization: SPEAKER_A, SPEAKER_B
      speakers_expected: 2,          // Woolcock + Erickson
      speech_models: ['universal-3-pro', 'universal-2'],  // 'best' deprecated; array form required
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!sub.ok) throw new Error(`AssemblyAI submit failed: ${await sub.text()}`);
  const { id } = await sub.json();
  console.log(`   Job ID: ${id} — polling...`);

  // Poll until complete
  const MAX_WAIT = 30 * 60 * 1000; // 30 min
  const start = Date.now();
  while (true) {
    if (Date.now() - start > MAX_WAIT) throw new Error('AssemblyAI timed out after 30 min');
    await new Promise(r => setTimeout(r, 8_000));

    const poll = await fetch(`${BASE}/transcript/${id}`, { headers, signal: AbortSignal.timeout(15_000) });
    if (!poll.ok) throw new Error(`AssemblyAI poll error: ${await poll.text()}`);
    const result = await poll.json();

    if (result.status === 'completed') {
      const wordCount = result.words?.length ?? result.text?.split(/\s+/).length ?? 0;
      console.log(`   ✍ ${wordCount.toLocaleString()} words | ${result.utterances?.length ?? 0} utterances`);
      console.log(`   🎙 Speakers detected: ${new Set((result.utterances ?? []).map(u => u.speaker)).size}`);

      // Build enriched text with speaker labels interspersed
      const utterances = result.utterances ?? [];
      const labeledText = utterances.map(u => {
        const mm = String(Math.floor(u.start / 1000 / 60)).padStart(2,'0');
        const ss = String(Math.floor((u.start / 1000) % 60)).padStart(2,'0');
        return `[${mm}:${ss}] ${u.speaker}: ${u.text}`;
      }).join('\n');

      // Segments for HTML timestamp view
      const segments = utterances.map(u => ({
        start:   u.start / 1000,
        end:     u.end / 1000,
        text:    u.text,
        speaker: u.speaker,
      }));

      return {
        text:       result.text ?? '',
        labeledText,              // speaker-tagged version used for extraction
        segments,
        words:      result.words ?? [],
        duration:   result.audio_duration ?? null,
        speakerMap: {}, // populated below if names can be inferred
      };
    }

    if (result.status === 'error') throw new Error(`AssemblyAI error: ${result.error}`);
    const elapsed = ((Date.now() - start) / 60000).toFixed(1);
    console.log(`   ⏳ ${result.status} (${elapsed}m elapsed)...`);
  }
}

/**
 * Whisper fallback (Groq or OpenAI) — no speaker diarization, but fast.
 * Used only if AssemblyAI key is missing.
 */
async function transcribeWithWhisper(filePath) {
  const provider = GROQ_KEY ? 'Groq (whisper-large-v3, free)' : 'OpenAI (whisper-1)';
  const endpoint = GROQ_KEY
    ? 'https://api.groq.com/openai/v1/audio/transcriptions'
    : 'https://api.openai.com/v1/audio/transcriptions';
  const key   = GROQ_KEY ?? OPENAI_KEY;
  const model = GROQ_KEY ? 'whisper-large-v3' : 'whisper-1';

  if (!key) throw new Error('No transcription key available (need GROQ_API_KEY or OPENAI_API_KEY)');
  console.log(`\n🎤 Transcribing via ${provider}...`);

  const audioBuffer = readFileSync(filePath);
  const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
  const form = new FormData();
  form.append('file', blob, 'episode.mp3');
  form.append('model', model);
  form.append('language', 'en');
  form.append('response_format', 'verbose_json');

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}` },
    body: form,
    signal: AbortSignal.timeout(600_000),
  });
  if (!res.ok) throw new Error(`Whisper transcription failed: ${(await res.text()).slice(0, 300)}`);

  const data = await res.json();
  const text = data.text ?? '';
  console.log(`   ✍ ${text.split(/\s+/).length.toLocaleString()} words | ⚠ No speaker diarization`);
  return { text, labeledText: text, segments: data.segments ?? [], words: data.words ?? [], duration: data.duration ?? null };
}

async function transcribe(audioUrl, filePath) {
  // Prefer AssemblyAI: handles full file via URL, gives real speaker diarization
  if (ASSEMBLYAI_KEY) return transcribeWithAssemblyAI(audioUrl);
  // Whisper fallback: needs local file, no diarization
  if (!filePath) throw new Error('Whisper fallback requires local file path');
  return transcribeWithWhisper(filePath);
}

// ─── Chunked GPT-4o extraction ────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an NFL betting analyst extracting picks and intel from a podcast transcript chunk.
Return ONLY valid JSON — no prose, no markdown fences.
The source is the BettingPros Podcast, Episode 1011, hosted by Seth Woolcock and Andrew Erickson.
Focus on NFL futures: division winners, playoff qualifiers, No. 1 seeds, longshot team futures.`;

function buildUserPrompt(chunk, chunkIdx, totalChunks) {
  return `
Transcript chunk ${chunkIdx + 1} of ${totalChunks}:
---
${chunk}
---

Return JSON:
{
  "picks": [
    {
      "selection": "string (team name, OVER, UNDER, or specific futures bet)",
      "team1": "string",
      "team2": "string or null for non-game futures",
      "type": "futures | spread | moneyline | total",
      "market": "division | playoffs | superbowl | conference | wins_total | longshot | other",
      "line": number or null,
      "odds": "string e.g. +350 or null",
      "summary": "string (max 200 chars — what they said)",
      "speaker": "Seth Woolcock | Andrew Erickson | Both | Unknown",
      "units": number (1-5, use 1 if not mentioned),
      "confidence": number (50-95, use 65 if not mentioned),
      "game_date": "YYYY-MM-DD or null"
    }
  ],
  "intel": [
    {
      "point": "string — key analytical insight",
      "team": "string or null",
      "speaker": "Seth Woolcock | Andrew Erickson | Both | Unknown",
      "category": "division | playoffs | superbowl | injury | schedule | sharp_money | general"
    }
  ]
}

Rules:
- Only picks clearly stated as recommendations
- Try to infer speaker from context ("I think...", "Seth, what do you have...")
- NFL futures only — skip PGA, MLB, soccer etc.
- "intel" = substantive analytical points, NOT picks
- If no NFL content in this chunk, return { "picks": [], "intel": [] }
`.trim();
}

function chunkText(text) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
}

function mergePicks(allPicks) {
  // Deduplicate picks by selection+market combination
  const seen = new Map();
  for (const p of allPicks) {
    const key = `${p.selection?.toLowerCase()}|${p.market}|${p.type}`;
    if (!seen.has(key)) {
      seen.set(key, p);
    } else {
      // Keep whichever has more detail
      const existing = seen.get(key);
      if ((p.summary?.length ?? 0) > (existing.summary?.length ?? 0)) {
        seen.set(key, p);
      }
    }
  }
  return [...seen.values()];
}

function mergeIntel(allIntel) {
  // Deduplicate intel by first 60 chars of point text
  const seen = new Set();
  return allIntel.filter(i => {
    const key = (i.point ?? '').slice(0, 60).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function callExtractLLM(chunk, chunkIdx, totalChunks) {
  const userContent = buildUserPrompt(chunk, chunkIdx, totalChunks);

  // Try Anthropic first (claude-sonnet-4-6)
  if (ANTHROPIC_KEY) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 2048,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: userContent }],
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (res.ok) {
      const data = await res.json();
      return data.content?.[0]?.text?.trim() ?? '{}';
    }
    const errText = await res.text();
    console.warn(`   ⚠ Anthropic chunk ${chunkIdx+1} failed (${res.status}) — trying OpenAI: ${errText.slice(0,80)}`);
  }

  // OpenAI fallback
  if (!OPENAI_KEY) throw new Error('No extraction API available (need ANTHROPIC_API_KEY or OPENAI_API_KEY)');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0.1,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userContent },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`OpenAI extraction failed: ${(await res.text()).slice(0,200)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '{}';
}

async function extractChunked(labeledText) {
  if (!ANTHROPIC_KEY && !OPENAI_KEY) throw new Error('Need ANTHROPIC_API_KEY or OPENAI_API_KEY for extraction');

  const provider = ANTHROPIC_KEY ? 'Claude Sonnet' : 'GPT-4o';
  const chunks = chunkText(labeledText);
  console.log(`\n🤖 Extracting intel via ${provider} — ${chunks.length} chunks (full transcript)...`);

  const allPicks = [];
  const allIntel = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`   Chunk ${i + 1}/${chunks.length} (${chunks[i].length.toLocaleString()} chars)...`);
    try {
      const raw   = await callExtractLLM(chunks[i], i, chunks.length);
      const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed.picks)) allPicks.push(...parsed.picks);
      if (Array.isArray(parsed.intel)) allIntel.push(...parsed.intel);
    } catch (err) {
      console.warn(`   ⚠ Chunk ${i+1} failed: ${err.message}`);
    }
    if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 500));
  }

  const picks = mergePicks(allPicks);
  const intel = mergeIntel(allIntel);
  console.log(`   ✅ ${picks.length} unique picks, ${intel.length} unique intel items`);
  return { picks, intel };
}

// ─── HTML report generator ────────────────────────────────────────────────────

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDuration(secs) {
  if (!secs) return 'unknown';
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}m ${s}s`;
}

function speakerBadge(speaker) {
  const colors = {
    'Seth Woolcock':   '#3b82f6',
    'Andrew Erickson': '#10b981',
    'Both':            '#8b5cf6',
    'Unknown':         '#6b7280',
  };
  const color = colors[speaker] ?? '#6b7280';
  return `<span style="background:${color};color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600">${esc(speaker)}</span>`;
}

function marketBadge(market) {
  const colors = {
    division:   '#f59e0b',
    playoffs:   '#3b82f6',
    superbowl:  '#ef4444',
    conference: '#8b5cf6',
    wins_total: '#06b6d4',
    longshot:   '#ec4899',
    other:      '#6b7280',
  };
  const color = colors[market] ?? '#6b7280';
  return `<span style="background:${color}22;color:${color};border:1px solid ${color}66;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase">${esc(market)}</span>`;
}

function buildHtml(ep, { picks, intel }, transcript, segments) {
  const picksByMarket = {};
  for (const p of picks) {
    const m = p.market ?? 'other';
    if (!picksByMarket[m]) picksByMarket[m] = [];
    picksByMarket[m].push(p);
  }
  const marketOrder = ['division','playoffs','superbowl','conference','wins_total','longshot','other'];

  const picksHtml = marketOrder
    .filter(m => picksByMarket[m]?.length)
    .map(m => {
      const rows = picksByMarket[m].map(p => `
        <div class="pick-card">
          <div class="pick-header">
            <span class="pick-selection">${esc(p.selection)}</span>
            ${marketBadge(p.market)}
            ${p.odds ? `<span class="odds">${esc(p.odds)}</span>` : ''}
            ${speakerBadge(p.speaker)}
          </div>
          ${p.summary ? `<div class="pick-summary">${esc(p.summary)}</div>` : ''}
          <div class="pick-meta">
            ${p.team1 ? `<span>📍 ${esc(p.team1)}${p.team2 ? ' vs ' + esc(p.team2) : ''}</span>` : ''}
            <span>🎯 Confidence: ${p.confidence ?? 65}%</span>
            <span>💰 Units: ${p.units ?? 1}</span>
          </div>
        </div>`).join('');
      return `<h3 class="market-header">${m.replace(/_/g,' ').toUpperCase()}</h3>${rows}`;
    }).join('') || '<p style="color:#6b7280">No picks extracted.</p>';

  const intelHtml = intel.length
    ? intel.map(i => `
        <div class="intel-item">
          <div class="intel-point">${esc(i.point)}</div>
          <div class="intel-meta">
            ${i.team ? `<span>🏈 ${esc(i.team)}</span>` : ''}
            ${speakerBadge(i.speaker)}
            <span class="intel-cat">${esc(i.category ?? 'general')}</span>
          </div>
        </div>`).join('')
    : '<p style="color:#6b7280">No intel extracted.</p>';

  const segmentHtml = segments.slice(0, 30).map(s => {
    const t = Math.floor(s.start);
    const mm = Math.floor(t / 60).toString().padStart(2,'0');
    const ss = (t % 60).toString().padStart(2,'0');
    return `<div class="seg"><span class="ts">[${mm}:${ss}]</span> ${esc(s.text)}</div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>BettingPros Podcast E1011 — Intel Report</title>
<style>
  :root { --bg:#0f172a; --card:#1e293b; --border:#334155; --text:#e2e8f0; --muted:#94a3b8; --accent:#3b82f6; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:var(--bg); color:var(--text); padding:24px; }
  .container { max-width:900px; margin:0 auto; }
  .header { background:linear-gradient(135deg,#1e3a5f,#1e293b); border:1px solid var(--border); border-radius:12px; padding:24px; margin-bottom:24px; }
  .header h1 { font-size:22px; font-weight:700; color:#fff; }
  .header .meta { color:var(--muted); font-size:13px; margin-top:8px; display:flex; gap:16px; flex-wrap:wrap; }
  .section { background:var(--card); border:1px solid var(--border); border-radius:10px; padding:20px; margin-bottom:20px; }
  .section h2 { font-size:16px; font-weight:700; color:#fff; border-bottom:1px solid var(--border); padding-bottom:10px; margin-bottom:16px; }
  .market-header { font-size:13px; font-weight:700; color:var(--muted); letter-spacing:.08em; margin:16px 0 8px; }
  .pick-card { background:#0f172a; border:1px solid var(--border); border-radius:8px; padding:14px; margin-bottom:10px; }
  .pick-header { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:8px; }
  .pick-selection { font-size:16px; font-weight:700; color:#fff; flex:1; }
  .odds { background:#f59e0b22; color:#f59e0b; border:1px solid #f59e0b66; padding:2px 8px; border-radius:4px; font-size:12px; font-weight:700; }
  .pick-summary { color:var(--muted); font-size:13px; line-height:1.5; margin-bottom:8px; }
  .pick-meta { display:flex; gap:12px; font-size:12px; color:#64748b; flex-wrap:wrap; }
  .intel-item { border-left:3px solid var(--accent); padding:10px 14px; margin-bottom:10px; background:#0f172a; border-radius:0 6px 6px 0; }
  .intel-point { font-size:14px; line-height:1.5; margin-bottom:6px; }
  .intel-meta { display:flex; gap:8px; align-items:center; flex-wrap:wrap; font-size:12px; color:var(--muted); }
  .intel-cat { background:#1e293b; padding:2px 8px; border-radius:4px; font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; }
  .stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:12px; }
  .stat { background:#0f172a; border:1px solid var(--border); border-radius:8px; padding:14px; text-align:center; }
  .stat-n { font-size:28px; font-weight:800; color:var(--accent); }
  .stat-l { font-size:11px; color:var(--muted); margin-top:4px; text-transform:uppercase; letter-spacing:.05em; }
  .seg { font-size:12px; color:var(--muted); padding:4px 0; border-bottom:1px solid #1e293b; line-height:1.4; }
  .ts { color:var(--accent); font-family:monospace; font-size:11px; margin-right:8px; }
  .notice { background:#f59e0b11; border:1px solid #f59e0b44; border-radius:8px; padding:12px 16px; margin-bottom:20px; font-size:13px; color:#fbbf24; }
</style>
</head>
<body>
<div class="container">

<div class="header">
  <h1>🏈 BettingPros Podcast — Episode 1011</h1>
  <div class="meta">
    <span>📅 ${esc(ep.pubDate ?? 'Unknown date')}</span>
    <span>🎙 Seth Woolcock + Andrew Erickson</span>
    <span>⏱ ${fmtDuration(ep.duration)}</span>
    <span>📌 ${esc(ep.title)}</span>
  </div>
</div>

<div class="notice">
  ⚡ Generated by podcast-e1011-test.js — full transcript extraction (all ${Math.ceil((transcript?.length ?? 0) / 1000)}K chars, ${Math.ceil((transcript?.length ?? 0) / CHUNK_SIZE)} chunks). Speaker attribution is inferred from context, not verified diarization.
</div>

<div class="section">
  <h2>📊 Summary Stats</h2>
  <div class="stats">
    <div class="stat"><div class="stat-n">${picks.length}</div><div class="stat-l">Total Picks</div></div>
    <div class="stat"><div class="stat-n">${intel.length}</div><div class="stat-l">Intel Items</div></div>
    <div class="stat"><div class="stat-n">${picks.filter(p=>p.market==='division').length}</div><div class="stat-l">Division Bets</div></div>
    <div class="stat"><div class="stat-n">${picks.filter(p=>p.market==='playoffs').length}</div><div class="stat-l">Playoff Bets</div></div>
    <div class="stat"><div class="stat-n">${picks.filter(p=>p.market==='longshot').length}</div><div class="stat-l">Longshots</div></div>
    <div class="stat"><div class="stat-n">${segments.length}</div><div class="stat-l">Segments</div></div>
  </div>
</div>

<div class="section">
  <h2>🎯 Picks & Recommendations</h2>
  ${picksHtml}
</div>

<div class="section">
  <h2>🧠 Key Intel & Analysis</h2>
  ${intelHtml}
</div>

${segments.length > 0 ? `
<div class="section">
  <h2>📝 Transcript Sample (first 30 segments with timestamps)</h2>
  <p style="color:#6b7280;font-size:12px;margin-bottom:12px">Full transcript stored in bettingpros-e1011-raw.json. These timestamps let you seek to any moment in the episode.</p>
  ${segmentHtml}
</div>
` : ''}

<div style="text-align:center;color:#334155;font-size:11px;margin-top:24px">
  Generated ${new Date().toISOString()} · NFL Platinum Rose · ATLAS v2
</div>

</div>
</body>
</html>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🏈 BettingPros Podcast E1011 — Full Pipeline Test');
  console.log('═'.repeat(55));

  // Transcription: AssemblyAI > Groq > OpenAI
  if (!ASSEMBLYAI_KEY && !GROQ_KEY && !OPENAI_KEY) {
    console.error('❌ Need at least one transcription key: ASSEMBLYAI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY');
    process.exit(1);
  }
  // Extraction: Anthropic > OpenAI
  if (!ANTHROPIC_KEY && !OPENAI_KEY) {
    console.error('❌ Need at least one extraction key: ANTHROPIC_API_KEY or OPENAI_API_KEY');
    process.exit(1);
  }
  console.log(`🎤 Transcription: ${ASSEMBLYAI_KEY ? 'AssemblyAI (speaker diarization)' : GROQ_KEY ? 'Groq Whisper (free)' : 'OpenAI Whisper'}`);
  console.log(`🤖 Extraction:    ${ANTHROPIC_KEY ? 'Claude Sonnet' : 'GPT-4o'}\n`);

  await mkdir(OUT_DIR, { recursive: true });

  // 1. Find episode
  const ep = await findEpisode(RSS_URL, TARGET_EP);
  if (!ep.audioUrl) {
    console.error('❌ Could not find audio URL for E1011');
    process.exit(1);
  }
  console.log(`\n📻 Found: "${ep.title}"`);
  console.log(`   Duration: ${fmtDuration(ep.duration)}`);
  console.log(`   Published: ${ep.pubDate}`);

  // 2. Download (only needed for Whisper fallback; AssemblyAI uses URL directly)
  let filePath = null;
  if (!ASSEMBLYAI_KEY) {
    const dl = await downloadAudio(ep.audioUrl);
    filePath = dl.filePath;
  } else {
    console.log(`\n⏭  Skipping local download — AssemblyAI will fetch audio directly`);
  }

  let transcript   = null;
  let labeledText  = null;
  let segments     = [];

  try {
    // 3. Transcribe
    const result = await transcribe(ep.audioUrl, filePath);
    transcript  = result.text;
    labeledText = result.labeledText;   // speaker-tagged for extraction
    segments    = result.segments;

    // 4. Chunked extraction (use speaker-labeled text so Claude can attribute picks)
    const { picks, intel } = await extractChunked(labeledText);

    // 5. Save raw JSON
    const rawPath = join(OUT_DIR, 'bettingpros-e1011-raw.json');
    await writeFile(rawPath, JSON.stringify({
      episode:      ep,
      transcript:   transcript,
      labeledText:  labeledText,
      segments:     segments,
      picks:        picks,
      intel:        intel,
      generated:    new Date().toISOString(),
    }, null, 2));
    console.log(`\n💾 Raw JSON saved: ${rawPath}`);

    // 6. Generate HTML report
    const html     = buildHtml(ep, { picks, intel }, transcript, segments);
    const htmlPath = join(OUT_DIR, 'bettingpros-e1011-intel.html');
    await writeFile(htmlPath, html);
    console.log(`🌐 HTML report saved: ${htmlPath}`);
    console.log(`\n✅ Done! Open the HTML file in your browser.`);
    console.log(`   ${htmlPath}`);

  } finally {
    // Clean up temp audio if downloaded locally
    if (filePath && existsSync(filePath)) {
      unlinkSync(filePath);
      console.log(`\n🗑  Temp audio deleted`);
    }
  }
}

main().catch(err => {
  console.error('\n💥 Fatal:', err.message);
  process.exit(1);
});
