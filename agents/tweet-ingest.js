// agents/tweet-ingest.js
// ═══════════════════════════════════════════════════════════════════════════════
// Tweet Ingest Agent — manual sharp-intel drop tool
//
// Processes files dropped into data/tweet-drops/:
//   *.png / *.jpg / *.jpeg / *.webp  — vision AI extracts tweet content
//   *.txt                             — paste format (see HOWTO.md)
//   *.json                            — [{handle, text, url?, date?}] array
//
// Vision provider priority (first key found in .env wins):
//   1. Claude  — ANTHROPIC_API_KEY or VITE_ANTHROPIC_API_KEY
//   2. Gemini  — GEMINI_API_KEY or GOOGLE_API_KEY
//   3. OpenAI  — OPENAI_API_KEY or VITE_OPENAI_API_KEY
//
// Writes to Supabase research_intel_notes (source_type: 'tweet').
// Archives processed files to data/tweet-drops/processed/YYYY-MM-DD/.
// Writes a receipt to .nfl/receipts/.
//
// Usage:
//   node agents/tweet-ingest.js
//   node agents/tweet-ingest.js --dry-run
//
// Env vars (all optional — text/JSON work with no API key):
//   SUPABASE_URL              (required for live run)
//   SUPABASE_SERVICE_ROLE_KEY (required for live run)
//   ANTHROPIC_API_KEY / VITE_ANTHROPIC_API_KEY
//   GEMINI_API_KEY / GOOGLE_API_KEY
//   OPENAI_API_KEY / VITE_OPENAI_API_KEY
// ═══════════════════════════════════════════════════════════════════════════════

import { readdir, readFile, mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __filename   = fileURLToPath(import.meta.url);
const __dirname    = path.dirname(__filename);
const ROOT         = path.resolve(__dirname, '..');
const DROP_DIR     = path.join(ROOT, 'data', 'tweet-drops');
const ARCHIVE_DIR  = path.join(DROP_DIR, 'processed');
const RECEIPTS_DIR = path.join(ROOT, '.nfl', 'receipts');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Vision API keys — resolved in priority order at startup
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY || null;
const GEMINI_KEY    = process.env.GEMINI_API_KEY    || process.env.GOOGLE_API_KEY          || null;
const OPENAI_KEY    = process.env.OPENAI_API_KEY    || process.env.VITE_OPENAI_API_KEY     || null;

const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';

const CLAUDE_MODEL  = 'claude-sonnet-4-6';
const GEMINI_MODEL  = 'gemini-2.0-flash';
const OPENAI_MODEL  = 'gpt-4o';
const TWEET_CONFIDENCE = 0.75;
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const SKIP_FILES = new Set(['HOWTO.md', 'TEMPLATE.md', '.gitkeep', '.DS_Store']);

// ─── Shared extraction prompt ─────────────────────────────────────────────────

const EXTRACTION_SYSTEM = `You are extracting tweet/post data from a screenshot for an NFL betting analytics system.
Return ONLY valid JSON. No markdown fences, no explanation.`;

const EXTRACTION_PROMPT = `Extract all tweets or posts visible in this screenshot.

For each tweet, extract:
- handle: the @username who posted it (include the @ symbol)
- text: the full tweet text (preserve meaning; collapse line breaks to spaces)
- url: the tweet URL if visible (e.g. https://x.com/...)
- date: the date/time if visible (ISO format preferred, or as shown)

If the image contains a chart, table, or stat graphic instead of a tweet,
describe the key data in the text field and set handle to "@unknown" unless
a source is visible in the image.

Return a JSON array — even for a single tweet:
[
  {"handle": "@VSiN", "text": "...", "url": "...", "date": "..."},
  {"handle": "@ActionNetworkHQ", "text": "...", "url": null, "date": null}
]`;

function parseVisionResponse(raw) {
  const jsonStr = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
  const parsed = JSON.parse(jsonStr);
  return Array.isArray(parsed) ? parsed : [parsed];
}

function mediaType(ext) {
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png')  return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/png';
}

// ─── Vision provider: Claude ──────────────────────────────────────────────────

async function extractViaClaude(base64, ext) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: EXTRACTION_SYSTEM,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType(ext), data: base64 } },
          { type: 'text', text: EXTRACTION_PROMPT },
        ],
      }],
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude ${response.status}: ${err.slice(0, 200)}`);
  }
  const result = await response.json();
  return parseVisionResponse(result.content?.[0]?.text || '[]');
}

// ─── Vision provider: Gemini ──────────────────────────────────────────────────

async function extractViaGemini(base64, ext) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: mediaType(ext), data: base64 } },
          { text: `${EXTRACTION_SYSTEM}\n\n${EXTRACTION_PROMPT}` },
        ],
      }],
      generationConfig: { maxOutputTokens: 1024, temperature: 0.1 },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini ${response.status}: ${err.slice(0, 200)}`);
  }
  const result = await response.json();
  const raw = result.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  return parseVisionResponse(raw);
}

// ─── Vision provider: OpenAI GPT-4o ──────────────────────────────────────────

async function extractViaOpenAI(base64, ext) {
  const dataUrl = `data:${mediaType(ext)};base64,${base64}`;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
          { type: 'text', text: `${EXTRACTION_SYSTEM}\n\n${EXTRACTION_PROMPT}` },
        ],
      }],
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI ${response.status}: ${err.slice(0, 200)}`);
  }
  const result = await response.json();
  return parseVisionResponse(result.choices?.[0]?.message?.content || '[]');
}

// ─── Vision dispatcher ────────────────────────────────────────────────────────

async function extractFromImage(filePath) {
  const providers = [
    ANTHROPIC_KEY && { name: 'Claude',  fn: extractViaClaude },
    GEMINI_KEY    && { name: 'Gemini',  fn: extractViaGemini },
    OPENAI_KEY    && { name: 'OpenAI',  fn: extractViaOpenAI },
  ].filter(Boolean);

  if (providers.length === 0) {
    throw new Error(
      'No vision API key found. Set ANTHROPIC_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY in .env.'
    );
  }

  const imageBuffer = await readFile(filePath);
  const base64 = imageBuffer.toString('base64');
  const ext = path.extname(filePath).toLowerCase().slice(1);

  let lastErr;
  for (const { name, fn } of providers) {
    try {
      console.log(`    Trying ${name}…`);
      const result = await fn(base64, ext);
      console.log(`    ✓ ${name} extracted ${result.length} tweet(s)`);
      return result;
    } catch (err) {
      console.warn(`    ✗ ${name} failed: ${err.message}`);
      lastErr = err;
    }
  }
  throw new Error(`All vision providers failed. Last error: ${lastErr.message}`);
}

// ─── Text file parser ─────────────────────────────────────────────────────────
// Format: @handle on first line, tweet text, optional URL. Tweets separated by ---.

function parseTextFile(content) {
  const blocks = content.split(/^---+\s*$/m).map(b => b.trim()).filter(Boolean);
  const tweets = [];
  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    let handle = '@unknown';
    let url = null;
    const textLines = [];
    for (const line of lines) {
      if (/^@\w+/.test(line) && !textLines.length && handle === '@unknown') {
        handle = line.split(/\s/)[0];
      } else if (/^https?:\/\//i.test(line)) {
        url = line;
      } else {
        textLines.push(line);
      }
    }
    const text = textLines.join(' ').trim();
    if (text) tweets.push({ handle, text, url, date: null });
  }
  return tweets;
}

// ─── JSON file parser ─────────────────────────────────────────────────────────

function parseJsonFile(content, filePath) {
  try {
    const parsed = JSON.parse(content);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    return arr
      .filter(t => t && typeof t.text === 'string')
      .map(t => ({ handle: t.handle || '@unknown', text: t.text, url: t.url || null, date: t.date || null }));
  } catch (err) {
    throw new Error(`Invalid JSON in ${path.basename(filePath)}: ${err.message}`);
  }
}

// ─── Note + signal builders ───────────────────────────────────────────────────

function sha256(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

function canonicalizeUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    u.hash = '';
    const allowed = new URLSearchParams();
    for (const [k, v] of u.searchParams.entries()) {
      if (!k.toLowerCase().startsWith('utm_')) allowed.append(k, v);
    }
    u.search = allowed.toString();
    return u.toString();
  } catch { return rawUrl; }
}

function buildNote(handle, text, url, date) {
  const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
  const contentHash = sha256(`${cleanHandle}|${text}`);
  const canonical = url ? canonicalizeUrl(url) : `tweet://screenshot/${contentHash}`;
  return {
    source: cleanHandle,
    source_type: 'tweet',
    url: url || canonical,
    canonical_url: canonical,
    url_hash: sha256(canonical),
    content_hash: contentHash,
    title: text.replace(/\s+/g, ' ').trim().slice(0, 120),
    summary: text.replace(/\s+/g, ' ').trim().slice(0, 800),
    published_at: date ? new Date(date).toISOString() : new Date().toISOString(),
    confidence: TWEET_CONFIDENCE,
  };
}

function classifyBetType(text) {
  const t = text.toLowerCase();
  if (/\bover\b|\bunder\b/.test(t)) return 'total';
  if (/\+\d+(\.\d+)?|-\d+(\.\d+)?/.test(t)) return 'spread';
  if (/moneyline|\bml\b/.test(t)) return 'moneyline';
  if (/mvp|coach of the year|rookie|division|conference|super bowl/.test(t)) return 'futures';
  return 'other';
}

function extractSignals(handle, text, url) {
  const lower = text.toLowerCase();
  const signals = [];
  const matches = text.match(
    /\b[A-Z][A-Za-z .&'-]{2,30}\s(?:\+|-)\d+(?:\.\d+)?\b|\b(?:Over|Under)\s\d+(?:\.\d+)?\b/g
  ) || [];
  for (const m of matches.slice(0, 3)) {
    signals.push({
      source: handle,
      team_or_market: m,
      bet_type: classifyBetType(m),
      lean: m,
      rationale: text.slice(0, 220),
      event_ref: url,
      confidence: Number((TWEET_CONFIDENCE - 0.05).toFixed(3)),
    });
  }
  if (!signals.length && /pick|best bet|lean|prediction|odds|sharp|steam|fade|tail/i.test(lower)) {
    signals.push({
      source: handle,
      team_or_market: text.slice(0, 80),
      bet_type: classifyBetType(text),
      lean: text.slice(0, 80),
      rationale: text.slice(0, 220),
      event_ref: url,
      confidence: Number((TWEET_CONFIDENCE - 0.10).toFixed(3)),
    });
  }
  return signals;
}

// ─── Supabase ─────────────────────────────────────────────────────────────────

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
}

async function insertNotes(supabase, notes) {
  if (!notes.length) return { inserted: [], skipped: 0 };
  const unique = Array.from(new Map(notes.map(n => [n.url_hash, n])).values());
  const { data: existing, error: lookupErr } = await supabase
    .from('research_intel_notes')
    .select('url_hash')
    .in('url_hash', unique.map(n => n.url_hash));
  if (lookupErr) throw new Error(`Lookup failed: ${lookupErr.message}`);
  const existingHashes = new Set((existing || []).map(e => e.url_hash));
  const newNotes = unique.filter(n => !existingHashes.has(n.url_hash));
  if (!newNotes.length) return { inserted: [], skipped: unique.length };
  const { data, error } = await supabase.from('research_intel_notes').insert(newNotes).select('id,url_hash');
  if (error) throw new Error(`Insert failed: ${error.message}`);
  return { inserted: data || [], skipped: unique.length - newNotes.length };
}

async function insertSignals(supabase, signals, insertedHashes) {
  if (!signals.length) return 0;
  const toInsert = signals.filter(s => {
    if (!s.event_ref) return true;
    return insertedHashes.has(sha256(canonicalizeUrl(s.event_ref)));
  });
  if (!toInsert.length) return 0;
  const { error } = await supabase.from('research_pick_signals').insert(toInsert);
  if (error) throw new Error(`Signal insert failed: ${error.message}`);
  return toInsert.length;
}

// ─── Archive + receipt ────────────────────────────────────────────────────────

async function archiveFile(filePath) {
  const today = new Date().toISOString().slice(0, 10);
  const destDir = path.join(ARCHIVE_DIR, today);
  await mkdir(destDir, { recursive: true });
  await rename(filePath, path.join(destDir, path.basename(filePath)));
}

async function writeReceipt(payload) {
  await mkdir(RECEIPTS_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(RECEIPTS_DIR, `tweet-ingest-${ts}.json`);
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return filePath;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const startedAt = new Date().toISOString();

  const availableProviders = [
    ANTHROPIC_KEY && 'Claude',
    GEMINI_KEY    && 'Gemini',
    OPENAI_KEY    && 'OpenAI',
  ].filter(Boolean);

  console.log('TweetIngestAgent start');
  console.log(`  dryRun=${DRY_RUN}`);
  console.log(`  visionProviders=[${availableProviders.join(', ') || 'none — image files will fail'}]`);

  await mkdir(DROP_DIR, { recursive: true });

  const entries = await readdir(DROP_DIR);
  const files = entries.filter(e => {
    if (SKIP_FILES.has(e) || e.startsWith('.')) return false;
    const ext = path.extname(e).toLowerCase();
    return IMAGE_EXTS.has(ext) || ext === '.txt' || ext === '.json';
  });

  if (!files.length) {
    console.log('  No files to process in data/tweet-drops/');
    console.log('  Drop .png/.jpg/.webp/.txt/.json files there, then rerun.');
    return;
  }

  console.log(`  Files found: ${files.length}`);

  const supabase = (!DRY_RUN && SUPABASE_URL && SUPABASE_KEY) ? getSupabase() : null;
  const fileResults = [];
  const allNotes = [];
  const allSignals = [];

  for (const filename of files) {
    const filePath = path.join(DROP_DIR, filename);
    const ext = path.extname(filename).toLowerCase();
    const result = { file: filename, status: 'ok', tweets: 0, notes: 0, signals: 0, error: null };

    try {
      let extracted = [];

      if (IMAGE_EXTS.has(ext)) {
        console.log(`\n  [image] ${filename}`);
        extracted = await extractFromImage(filePath);
      } else if (ext === '.txt') {
        console.log(`\n  [text]  ${filename}`);
        extracted = parseTextFile(await readFile(filePath, 'utf-8'));
        console.log(`    Parsed ${extracted.length} tweet(s)`);
      } else if (ext === '.json') {
        console.log(`\n  [json]  ${filename}`);
        extracted = parseJsonFile(await readFile(filePath, 'utf-8'), filePath);
        console.log(`    Parsed ${extracted.length} tweet(s)`);
      }

      result.tweets = extracted.length;
      const notes   = extracted.filter(t => t.text?.trim().length > 5).map(t => buildNote(t.handle, t.text, t.url, t.date));
      const signals = extracted.flatMap(t => extractSignals(t.handle || '@unknown', t.text, t.url));
      result.notes   = notes.length;
      result.signals = signals.length;

      if (DRY_RUN) {
        for (const note of notes) {
          console.log(`    → ${note.source}: "${note.title.slice(0, 80)}"`);
        }
        if (signals.length) console.log(`    ${signals.length} signal(s) detected`);
      }

      allNotes.push(...notes);
      allSignals.push(...signals);
    } catch (err) {
      result.status = 'error';
      result.error  = err.message;
      console.error(`  [ERROR] ${filename}: ${err.message}`);
    }

    fileResults.push(result);
  }

  let insertedNotes = 0, skippedNotes = 0, insertedSignals = 0;

  if (!DRY_RUN && supabase) {
    const { inserted, skipped } = await insertNotes(supabase, allNotes);
    insertedNotes = inserted.length;
    skippedNotes  = skipped;
    const insertedHashes = new Set(inserted.map(n => n.url_hash));
    insertedSignals = await insertSignals(supabase, allSignals, insertedHashes);

    for (const file of files) {
      try { await archiveFile(path.join(DROP_DIR, file)); } catch { /* non-fatal */ }
    }

    console.log(`\n  Inserted notes:   ${insertedNotes}`);
    console.log(`  Skipped (dedup):  ${skippedNotes}`);
    console.log(`  Inserted signals: ${insertedSignals}`);
  } else {
    console.log(`\n  [dry-run] Would insert: ${allNotes.length} notes, ${allSignals.length} signals`);
    console.log(`  [dry-run] Files NOT archived`);
  }

  const receiptPath = await writeReceipt({
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    dry_run: DRY_RUN,
    vision_providers: availableProviders,
    files: fileResults,
    totals: { files_processed: files.length, tweets_extracted: allNotes.length, inserted_notes: insertedNotes, skipped_notes: skippedNotes, inserted_signals: insertedSignals },
  });

  console.log(`  Receipt: ${receiptPath}`);
}

main().catch(err => {
  console.error(`TweetIngestAgent failed: ${err.message}`);
  process.exit(1);
});
