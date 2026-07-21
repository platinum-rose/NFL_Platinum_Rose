#!/usr/bin/env node
// agents/podcast-reextract.js
// ═══════════════════════════════════════════════════════════════════════════════
// PodcastReExtractAgent — re-analyze ALREADY-TRANSCRIBED podcast episodes.
//
// Why this exists:
//   The original ingest (podcast-ingest.js) fed only the first ~12,000 characters
//   of each transcript to GPT-4o — roughly the opening 15-20% of an episode — so
//   the bulk of every episode's intel was never analyzed. The raw transcript is
//   already stored in podcast_transcripts.transcript_text, so we can re-extract
//   for free (no re-transcription): chunk the FULL transcript, extract per chunk,
//   merge + dedupe.
//
// Non-destructive: writes to podcast_reextractions (migration 030), keyed by
//   (episode_id, model). The baseline podcast_transcripts.picks/.intel is left
//   intact for A/B comparison.
//
// NOTE (2026-07-20): the "--model fable-5" idea once planned for THIS script
// is superseded, not built here. Andy's decision was to replace the whole
// Fable re-eval concept with a dedicated per-host Futures pipeline instead
// (agents/podcast-host-summary.js) — see docs/PODCAST_HOST_SUMMARY_PIPELINE_PLAN.md.
// A Fable-5 comparison pass, if built, belongs on that pipeline (its Phase 4),
// not here. This script's --model flag stays generic/gpt-4o-only; passing
// fable-5 here would just fail against OpenAI's API, not route anywhere.
//
// Also persists each episode's intel to the Obsidian vault as a markdown note
//   (NFL/Podcasts/<Show>/<pub_date>-<slug>.md) via the Local REST API.
//
// Usage:
//   node agents/podcast-reextract.js --dry-run          # no writes; prints A/B counts
//   node agents/podcast-reextract.js                    # write DB + Obsidian
//   node agents/podcast-reextract.js --limit 5          # cap episodes this run
//   node agents/podcast-reextract.js --episode <uuid>   # single episode
//   node agents/podcast-reextract.js --since 2026-07-01 # only episodes on/after date
//   node agents/podcast-reextract.js --no-vault         # skip Obsidian write
//   node agents/podcast-reextract.js --overwrite        # redo even if a row exists for this model
//   node agents/podcast-reextract.js --model gpt-4o     # model knob (default gpt-4o)
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY,
//      OBSIDIAN_API_URL (default https://localhost:27123), OBSIDIAN_API_KEY
// ═══════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import https from 'node:https';
import { createClient } from '@supabase/supabase-js';
import { chunkTranscript } from './lib/chunk-text.js';

// ─── Config / args ────────────────────────────────────────────────────────────

const argVal = (name, fallback = null) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const hasFlag = (name) => process.argv.includes(name);

const DRY_RUN    = hasFlag('--dry-run');
const NO_VAULT   = hasFlag('--no-vault');
const OVERWRITE  = hasFlag('--overwrite');
const MODEL      = argVal('--model', 'gpt-4o');
const LIMIT      = Number(argVal('--limit', '0')) || 0;
const ONE_EP     = argVal('--episode', null);
const SINCE      = argVal('--since', null);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_KEY   = process.env.OPENAI_API_KEY;
const OBSIDIAN_URL = (process.env.OBSIDIAN_API_URL || 'https://localhost:27123').replace(/\/$/, '');
const OBSIDIAN_KEY = process.env.OBSIDIAN_API_KEY || '';

// Chunking: overlap so a pick/insight straddling a boundary is seen whole.
const CHUNK_CHARS  = 12_000;
const CHUNK_OVERLAP = 1_000;
const MAX_INTEL     = 30;   // dedup cap across all chunks
const CALL_DELAY_MS = 400;  // gentle pacing between OpenAI calls

// ─── Extraction prompt (reused from podcast-ingest.js, chunk-aware) ────────────

const EXTRACTION_SYSTEM = `You are an NFL betting analyst.
Extract all betting picks and notable analysis from the transcript chunk.
Ignore non-NFL sports (golf/PGA, NBA, MLB, etc.) entirely — return nothing for them.
Return ONLY valid JSON — no prose, no markdown fences.`;

const EXTRACTION_USER = (chunk, source, idx, total) => `
Source: ${source}
Transcript chunk ${idx} of ${total} (analyze only what is present in this chunk):
---
${chunk}
---

Return JSON with this exact shape:
{
  "picks": [
    {
      "selection": "string (team name, OVER, or UNDER)",
      "team1": "string (home team or first team)",
      "team2": "string (away team or second team)",
      "type": "spread | moneyline | total | futures",
      "line": number | null,
      "summary": "string (brief rationale, max 200 chars)",
      "units": number,
      "confidence": number,
      "game_date": "YYYY-MM-DD | null"
    }
  ],
  "intel": [ "string (key NFL insight, injury note, weather, sharp-money report, etc.)" ]
}

Rules:
- NFL only. If this chunk is about another sport or has no NFL content, return { "picks": [], "intel": [] }.
- Only include picks clearly stated as recommendations.
- "selection" for spreads/ML = the team getting the pick; for totals = "OVER"/"UNDER" (uppercase).
- "line" = spread number (negative for favored) or the total number, else null.
- "units" 1-5 (use 1 if unstated); "confidence" 50-95 (use 65 if unstated).
- "intel" = concise NFL analytical points, not picks.
`.trim();

// ─── OpenAI extraction over one chunk ─────────────────────────────────────────

async function extractChunk(chunk, source, idx, total) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.1,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM },
        { role: 'user',   content: EXTRACTION_USER(chunk, source, idx, total) },
      ],
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? '{}';
  const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  let parsed;
  try { parsed = JSON.parse(cleaned); }
  catch { parsed = { picks: [], intel: [] }; }
  return {
    picks: Array.isArray(parsed.picks) ? parsed.picks : [],
    intel: Array.isArray(parsed.intel) ? parsed.intel : [],
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickKey(p) {
  return [p.selection, p.team1, p.team2, p.type, p.line]
    .map(v => String(v ?? '').toLowerCase().trim()).join('|');
}

function mergePicks(all) {
  const byKey = new Map();
  for (const p of all) {
    const k = pickKey(p);
    const prev = byKey.get(k);
    // keep the higher-confidence instance on a duplicate
    if (!prev || Number(p.confidence ?? 0) > Number(prev.confidence ?? 0)) byKey.set(k, p);
  }
  return [...byKey.values()];
}

function mergeIntel(all) {
  const seen = new Set();
  const out = [];
  for (const item of all) {
    const s = String(item ?? '').trim();
    if (!s) continue;
    const norm = s.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push(s);
    if (out.length >= MAX_INTEL) break;
  }
  return out;
}

function slugify(s) {
  return String(s ?? 'episode').toLowerCase()
    .replace(/&amp;|&/g, 'and').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 60) || 'episode';
}

// ─── Obsidian note (node-fetch + self-signed-cert agent) ──────────────────────

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function obsidianPut(notePath, markdown) {
  const { default: fetch } = await import('node-fetch');
  const url = `${OBSIDIAN_URL}/vault/${notePath.split('/').map(encodeURIComponent).join('/')}`;
  const res = await fetch(url, {
    method: 'PUT',
    agent: httpsAgent,
    headers: { Authorization: `Bearer ${OBSIDIAN_KEY}`, 'Content-Type': 'text/markdown' },
    body: markdown,
  });
  if (!res.ok) throw new Error(`Obsidian PUT ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

function buildVaultNote({ show, title, pubDate, picks, intel, model, chunkCount }) {
  const date = (pubDate || '').slice(0, 10) || 'undated';
  const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const pickRows = picks.length
    ? picks.map(p =>
        `| ${esc(p.type)} | ${esc(p.selection)} | ${p.line ?? '—'} | ${esc(p.summary).slice(0, 120)} | ${p.units ?? 1} | ${p.confidence ?? '—'} |`
      ).join('\n')
    : '| — | (no picks) | — | — | — | — |';
  const intelBullets = intel.length ? intel.map(i => `- ${esc(i)}`).join('\n') : '- (none)';
  return `---
sensitivity: green
source_system: podcast-reextract
show: ${show}
title: ${JSON.stringify(title ?? '')}
pub_date: ${date}
picks_count: ${picks.length}
intel_count: ${intel.length}
model: ${model}
chunks_analyzed: ${chunkCount}
generated: ${new Date().toISOString()}
---

# ${show} — ${title ?? 'Episode'}
*Published: ${date} · re-extracted (full transcript, ${chunkCount} chunks) via ${model}*

## Picks

| Type | Selection | Line | Rationale | Units | Conf |
|------|-----------|------|-----------|-------|------|
${pickRows}

## Intel

${intelBullets}
`;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('❌ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
  if (!OPENAI_KEY) { console.error('❌ Missing OPENAI_API_KEY'); process.exit(1); }
  if (!NO_VAULT && !DRY_RUN && !OBSIDIAN_KEY) {
    console.error('❌ Missing OBSIDIAN_API_KEY (or pass --no-vault). Is Obsidian + Local REST API running?');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  console.log('PodcastReExtractAgent start');
  console.log(`  model=${MODEL} dryRun=${DRY_RUN} vault=${!NO_VAULT} overwrite=${OVERWRITE}`
    + `${LIMIT ? ` limit=${LIMIT}` : ''}${ONE_EP ? ` episode=${ONE_EP}` : ''}${SINCE ? ` since=${SINCE}` : ''}`);

  // 1. Load transcripts (raw text is already stored — no re-transcription needed).
  let tq = supabase
    .from('podcast_transcripts')
    .select('episode_id, transcript_text, picks, intel, model_used');
  if (ONE_EP) tq = tq.eq('episode_id', ONE_EP);
  const { data: transcripts, error: tErr } = await tq;
  if (tErr) { console.error(`❌ load transcripts: ${tErr.message}`); process.exit(1); }
  if (!transcripts?.length) { console.log('  No transcripts found.'); return; }

  // 2. Load episode + feed metadata (separate queries — robust to relationship naming).
  const epIds = [...new Set(transcripts.map(t => t.episode_id))];
  const { data: episodes } = await supabase
    .from('podcast_episodes').select('id, title, pub_date, feed_id, status').in('id', epIds);
  const epById = new Map((episodes || []).map(e => [e.id, e]));
  const feedIds = [...new Set((episodes || []).map(e => e.feed_id))];
  const { data: feeds } = await supabase
    .from('podcast_feeds').select('id, name, expert').in('id', feedIds);
  const feedById = new Map((feeds || []).map(f => [f.id, f]));

  // 3. Which episodes already have a re-extraction for this model (skip unless --overwrite).
  let done = new Set();
  if (!OVERWRITE) {
    const { data: existing } = await supabase
      .from('podcast_reextractions').select('episode_id').eq('model', MODEL);
    done = new Set((existing || []).map(r => r.episode_id));
  }

  // 4. Build the work list.
  let work = transcripts
    .map(t => ({ t, ep: epById.get(t.episode_id) }))
    .filter(({ t, ep }) => ep && (t.transcript_text || '').length > 0);
  if (SINCE) work = work.filter(({ ep }) => (ep.pub_date || '') >= SINCE);
  work = work.filter(({ t }) => OVERWRITE || !done.has(t.episode_id));
  work.sort((a, b) => String(b.ep.pub_date || '').localeCompare(String(a.ep.pub_date || '')));
  if (LIMIT) work = work.slice(0, LIMIT);

  console.log(`  ${work.length} episode(s) to re-extract (${done.size} already done for ${MODEL}, skipped)`);

  let totalNewPicks = 0, totalBasePicks = 0, totalNewIntel = 0, totalBaseIntel = 0, wrote = 0, notes = 0, errors = 0;

  for (const { t, ep } of work) {
    const feed = feedById.get(ep.feed_id) || {};
    const show = feed.name || 'Unknown Show';
    const source = feed.expert || show;
    const text = t.transcript_text || '';
    const chunks = chunkTranscript(text);
    const basePicks = Array.isArray(t.picks) ? t.picks.length : 0;
    const baseIntel = Array.isArray(t.intel) ? t.intel.length : 0;

    console.log(`\n  🎙 "${String(ep.title || '').slice(0, 66)}" [${show}]`);
    console.log(`     ${text.length.toLocaleString()} chars → ${chunks.length} chunk(s) | baseline: ${basePicks} picks, ${baseIntel} intel`);

    try {
      const allPicks = [], allIntel = [];
      for (let i = 0; i < chunks.length; i++) {
        const { picks, intel } = await extractChunk(chunks[i], source, i + 1, chunks.length);
        allPicks.push(...picks);
        allIntel.push(...intel);
        process.stdout.write(`     · chunk ${i + 1}/${chunks.length}: +${picks.length} picks, +${intel.length} intel\r`);
        await new Promise(r => setTimeout(r, CALL_DELAY_MS));
      }
      const picks = mergePicks(allPicks);
      const intel = mergeIntel(allIntel);
      console.log(`\n     ✅ merged: ${picks.length} picks, ${intel.length} intel  (was ${basePicks}/${baseIntel})`);

      totalNewPicks += picks.length; totalBasePicks += basePicks;
      totalNewIntel += intel.length; totalBaseIntel += baseIntel;

      // Build the Obsidian note (path even in dry-run so we can show it).
      const vaultPath = `NFL/Podcasts/${slugify(show)}/${(ep.pub_date || '').slice(0, 10) || 'undated'}-${slugify(ep.title)}.md`;

      if (DRY_RUN) {
        console.log(`     [dry-run] would upsert podcast_reextractions + write ${NO_VAULT ? '(vault skipped)' : vaultPath}`);
        continue;
      }

      // Write re-extraction (upsert on episode_id+model).
      const { error: upErr } = await supabase
        .from('podcast_reextractions')
        .upsert({
          episode_id: t.episode_id, model: MODEL, picks, intel,
          chunk_count: chunks.length, transcript_chars: text.length,
          baseline_picks: basePicks, baseline_intel: baseIntel,
          vault_path: NO_VAULT ? null : vaultPath,
        }, { onConflict: 'episode_id,model' });
      if (upErr) throw new Error(`upsert failed: ${upErr.message}`);
      wrote++;

      if (!NO_VAULT) {
        const md = buildVaultNote({ show, title: ep.title, pubDate: ep.pub_date, picks, intel, model: MODEL, chunkCount: chunks.length });
        await obsidianPut(vaultPath, md);
        notes++;
        console.log(`     📝 vault: ${vaultPath}`);
      }
    } catch (err) {
      errors++;
      console.error(`     ❌ ${err.message}`);
    }
  }

  console.log(`\n📊 Done. episodes=${work.length} written=${wrote} vaultNotes=${notes} errors=${errors}`);
  console.log(`   picks: ${totalBasePicks} (baseline) → ${totalNewPicks} (re-extracted)`);
  console.log(`   intel: ${totalBaseIntel} (baseline) → ${totalNewIntel} (re-extracted)`);
  if (DRY_RUN) console.log('   [dry-run] no writes performed.');
}

main().catch(err => { console.error(`Fatal: ${err.message}`); process.exit(1); });
