#!/usr/bin/env node
// agents/podcast-host-summary.js
// ═══════════════════════════════════════════════════════════════════════════════
// PodcastHostSummaryAgent — per-HOST detailed Futures analysis, replacing the
// deferred "Fable re-eval" stub in podcast-reextract.js.
//
// For each episode, produces a detailed summary of what each host said about
// every Future discussed (division/conference winners, Super Bowl, MVP/awards,
// win totals, etc.) — their prediction/lean, confidence, any stats or historical
// data they cited, and a supporting quote/paraphrase. Scope is deliberately
// FUTURES only, not game-level picks (spread/ML/total) — those are already
// covered by podcast_transcripts.picks / podcast_reextractions.
//
// Attribution:
//   - Single-host shows (Sharp Football Analysis / Warren Sharp): the whole
//     transcript is that one host, no diarization needed.
//   - Multi-host shows (Sharp or Square, Even Money, The Favorites,
//     BettingPros Podcast, Action Network Sports Betting — see
//     agents/lib/speaker-attribution.js SHOW_CONFIG): requires
//     podcast_transcripts.speaker_segments (AssemblyAI diarized utterances,
//     migrations 032/033). Episodes from these shows with NO speaker_segments
//     yet (ingested before diarization was turned on) are SKIPPED, not
//     guessed at — see docs/PODCAST_HOST_SUMMARY_PIPELINE_PLAN.md Phase 3 for
//     the backfill decision.
//
// Non-destructive / A/B-ready like podcast_reextractions: writes to
// podcast_host_summaries (migration 035), keyed by (episode_id, host, model).
// A future Fable-5 comparison pass (Phase 4 of the plan doc) writes its own
// rows alongside these without touching them.
//
// Usage:
//   node agents/podcast-host-summary.js --dry-run          # no writes; prints what would happen
//   node agents/podcast-host-summary.js                    # write DB + Obsidian
//   node agents/podcast-host-summary.js --limit 5           # cap episodes this run
//   node agents/podcast-host-summary.js --episode <uuid>    # single episode
//   node agents/podcast-host-summary.js --since 2026-07-01  # only episodes on/after date
//   node agents/podcast-host-summary.js --no-vault          # skip Obsidian write
//   node agents/podcast-host-summary.js --overwrite         # redo even if rows exist for this model
//   node agents/podcast-host-summary.js --model gpt-4o      # model knob (default gpt-4o)
//
//   node agents/podcast-host-summary.js --vault-sync        # DB-only vault write, no AssemblyAI/GPT-4o
//   node agents/podcast-host-summary.js --vault-sync --dry-run     # preview which notes would be written
//   node agents/podcast-host-summary.js --vault-sync --overwrite   # re-write notes even if vault_path already set
//
// --vault-sync mode: reads existing podcast_host_summaries rows (already-extracted
// futures, from a prior --no-vault run) and just writes/updates the Obsidian notes --
// zero AssemblyAI/GPT-4o calls, zero new cost. Built 2026-07-21 so a run done with
// --no-vault (e.g. from M6, which can't reach Obsidian) can have its notes written
// later from a machine that CAN reach Obsidian, without re-burning extraction cost.
// Only syncs rows where vault_path IS NULL, unless --overwrite forces a re-sync of
// everything (e.g. after a buildHostVaultNote template change).
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY,
//      OBSIDIAN_API_URL (default https://localhost:27123), OBSIDIAN_API_KEY
// ═══════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import https from 'node:https';
import { pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { chunkTranscript } from './lib/chunk-text.js';
import { buildSpeakerMap, applySpeakerMap, buildLabeledTranscript, loadShowConfig } from './lib/speaker-attribution.js';
import { ensureObsidianReachable } from './lib/obsidian-launch.js';

// ─── Config / args ────────────────────────────────────────────────────────────

const argVal = (name, fallback = null) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const hasFlag = (name) => process.argv.includes(name);

const DRY_RUN    = hasFlag('--dry-run');
const NO_VAULT   = hasFlag('--no-vault');
const OVERWRITE  = hasFlag('--overwrite');
const VAULT_SYNC = hasFlag('--vault-sync');
const MODEL      = argVal('--model', 'gpt-4o');
const LIMIT      = Number(argVal('--limit', '0')) || 0;
const ONE_EP     = argVal('--episode', null);
const SINCE      = argVal('--since', null);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_KEY   = process.env.OPENAI_API_KEY;
const OBSIDIAN_URL = (process.env.OBSIDIAN_API_URL || 'https://localhost:27123').replace(/\/$/, '');
const OBSIDIAN_KEY = process.env.OBSIDIAN_API_KEY || '';

const MAX_FUTURES_PER_HOST = 40; // dedup cap per host per episode
const CALL_DELAY_MS = 400;

// ─── Extraction prompt ─────────────────────────────────────────────────────────

const NFL_ONLY_GUARD = `This podcast is a general sports-betting show, not NFL-exclusive -- chunks
may discuss MLB, NBA, golf, UFC, or other non-NFL topics. Only extract futures
about actual NFL teams, players, or NFL-specific award/outcome markets. If a
chunk's subject is a non-NFL team, player, league, or contest, DO NOT extract
it, and DO NOT substitute, rename, or remap it onto an NFL-sounding subject or
market to force a fit -- e.g. a Phillies-vs-Braves NL East prediction must
NEVER be relabeled as an Eagles/NFC East prediction, even loosely. When in
doubt whether something is NFL, leave it out.
Do NOT extract predictions about contest formats, prize pools, pool sizes, or
platforms (e.g. "this survivor contest will sell out," "Circa/Splash Sports
will get more entries") -- these are not on-field outcome bets, even when the
contest itself is NFL-themed.
Do NOT extract single-game picks (spread/moneyline/total/player prop tied to
one specific game or week, e.g. "Steelers -2.5 in Week 1") -- only season-long
outcome bets count as futures (division/conference/Super Bowl winner,
MVP/awards, win totals, playoff seeding, season-long player props like
"over 7.5 rushing TDs on the season").`;

const SYSTEM_SINGLE_HOST = `You are an NFL betting podcast analyst.
Extract every FUTURE (season-long outcome bet -- division winner, conference
winner, Super Bowl winner, MVP/awards, win totals, playoff seeding, etc.)
discussed in this transcript chunk.
${NFL_ONLY_GUARD}
Return ONLY valid JSON -- no prose, no markdown fences.`;

const SYSTEM_MULTI_HOST = (hostNames) => `You are an NFL betting podcast analyst.
This transcript chunk is labeled by speaker: lines look like "[M:SS] Host Name: text".
Extract every FUTURE (season-long outcome bet -- division winner, conference
winner, Super Bowl winner, MVP/awards, win totals, playoff seeding, etc.)
discussed, attributed to whichever labeled host actually said it.
${NFL_ONLY_GUARD}
The "host" field MUST be exactly one of: ${hostNames.map(h => `"${h}"`).join(', ')}.
Return ONLY valid JSON -- no prose, no markdown fences.`;

const USER_PROMPT = (chunk, idx, total) => `
Transcript chunk ${idx} of ${total} (analyze only what is present in this chunk):
---
${chunk}
---

Return JSON with this exact shape:
{
  "futures": [
    {
      "host": "string (host name, or omit/ignore if this is a single-host show)",
      "subject_market": "string (e.g. 'AFC_North', 'MVP', 'Super_Bowl', 'NFC_West_Win_Total')",
      "subject": "string (e.g. 'Ravens', 'Josh Allen')",
      "prediction": "string, the host's stated pick/lean in their own words",
      "lean": "favor | against | over | under | neutral",
      "confidence": number (50-95; use 65 if unstated),
      "stats_cited": ["string, any stats/historical data referenced"],
      "quote": "string, direct quote or close paraphrase, max ~300 chars"
    }
  ]
}

Rules:
- NFL only. If this chunk has no NFL futures content, return { "futures": [] } -- do not force non-NFL content (other leagues, contest/pool predictions, single-game picks) into this shape just to have something to return.
- "subject" must be a real NFL team or player actually named in this chunk. Never substitute a non-NFL team/player name onto an NFL-sounding subject_market.
- Only include futures clearly stated as the host's own prediction/lean, not just mentioning a market exists.
- subject_market should use the taxonomy style already seen above (division codes like 'AFC_North', or 'MVP'/'Super_Bowl'/'Offensive_ROY' etc.) -- your best consistent guess if the exact code isn't obvious.
`.trim();

async function extractChunk(chunk, idx, total, { multiHost, hostNames }) {
  const system = multiHost ? SYSTEM_MULTI_HOST(hostNames) : SYSTEM_SINGLE_HOST;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.1,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: USER_PROMPT(chunk, idx, total) },
      ],
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return parseExtractionResponse(data.choices?.[0]?.message?.content ?? '{}');
}

/** Parse the model's JSON response, tolerant of stray markdown fences. Exported for tests. */
export function parseExtractionResponse(raw) {
  const cleaned = String(raw ?? '').replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  let parsed;
  try { parsed = JSON.parse(cleaned); }
  catch { parsed = { futures: [] }; }
  return Array.isArray(parsed.futures) ? parsed.futures : [];
}

// ─── Attribution planning ──────────────────────────────────────────────────────

/**
 * Decide how to process one episode: which mode, which hosts, and what text
 * to feed the extractor. Pure/exported for testing -- no network calls.
 *
 * @returns {{mode: 'single_host'|'multi_host'|'skip', host?: string, text?: string,
 *            hostNames?: string[], attributionMethodFor?: (host:string)=>string, reason?: string}}
 */
export function planEpisodeProcessing({ feed, transcript }) {
  if (!feed?.needs_diarization) {
    return {
      mode: 'single_host',
      host: feed?.expert || feed?.name || 'Unknown',
      text: transcript?.transcript_text || '',
    };
  }

  const utterances = Array.isArray(transcript?.speaker_segments) ? transcript.speaker_segments : [];
  if (!utterances.length) {
    return {
      mode: 'skip',
      reason: `${feed.name} needs diarization but this episode has no speaker_segments (ingested before diarization was enabled) -- needs backfill re-transcription, see Phase 3`,
    };
  }

  const config = loadShowConfig(feed.name);
  if (!config) {
    return { mode: 'skip', reason: `${feed.name} not found in speaker-attribution SHOW_CONFIG` };
  }

  const speakerMap = buildSpeakerMap(utterances, feed.name);
  const labeled = applySpeakerMap(utterances, speakerMap);
  const text = buildLabeledTranscript(labeled);
  const hostNames = [...new Set(Object.values(speakerMap))];

  return {
    mode: 'multi_host',
    hostNames,
    text,
    attributionMethodFor: (host) => (host === 'Guest' ? 'unknown' : 'host_map'),
  };
}

/**
 * Resolve a model-returned host string to one of the known hosts for this
 * episode (case-insensitive exact match). Falls back to a clearly-marked
 * bucket rather than silently mis-attributing or dropping the future.
 * Exported for tests.
 */
export function resolveHost(rawHost, knownHosts) {
  const raw = String(rawHost ?? '').trim();
  if (!raw) return 'Unclear';
  const hit = knownHosts.find(h => h.toLowerCase() === raw.toLowerCase());
  return hit ?? 'Unclear';
}

// ─── Merge / dedupe ─────────────────────────────────────────────────────────────

function futureKey(f) {
  return [f.subject_market, f.subject, String(f.prediction ?? '').toLowerCase().trim().slice(0, 80)]
    .map(v => String(v ?? '').toLowerCase().trim()).join('|');
}

/** Dedupe a host's futures list, keeping the higher-confidence instance on a duplicate. Exported for tests. */
export function mergeFutures(all) {
  const byKey = new Map();
  for (const f of all) {
    const k = futureKey(f);
    const prev = byKey.get(k);
    if (!prev || Number(f.confidence ?? 0) > Number(prev.confidence ?? 0)) byKey.set(k, f);
  }
  return [...byKey.values()].slice(0, MAX_FUTURES_PER_HOST);
}

function slugify(s) {
  return String(s ?? 'episode').toLowerCase()
    .replace(/&amp;|&/g, 'and').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 60) || 'episode';
}

// ─── Obsidian vault note ────────────────────────────────────────────────────────

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

/** Build the per-(episode, host) vault note markdown. Exported for tests. */
export function buildHostVaultNote({ show, host, title, pubDate, futures, model, attributionMethod, chunkCount }) {
  const date = (pubDate || '').slice(0, 10) || 'undated';
  const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const rows = futures.length
    ? futures.map(f =>
        `| ${esc(f.subject_market)} | ${esc(f.subject)} | ${esc(f.prediction).slice(0, 140)} | ${esc(f.lean)} | ${f.confidence ?? '—'} | ${(f.stats_cited || []).map(esc).join('; ')} |`
      ).join('\n')
    : '| — | (no futures discussed) | — | — | — | — |';
  const quotes = futures.filter(f => f.quote).map(f => `- **${esc(f.subject)}**: "${esc(f.quote)}"`).join('\n') || '- (none)';
  return `---
sensitivity: green
source_system: podcast-host-summary
show: ${show}
host: ${host}
title: ${JSON.stringify(title ?? '')}
pub_date: ${date}
futures_count: ${futures.length}
model: ${model}
attribution_method: ${attributionMethod}
chunks_analyzed: ${chunkCount}
generated: ${new Date().toISOString()}
---

# ${host} on ${show} — ${title ?? 'Episode'}
*Published: ${date} · attribution: ${attributionMethod} · via ${model}*

## Futures discussed

| Market | Subject | Prediction | Lean | Conf | Stats cited |
|--------|---------|-----------|------|------|--------------|
${rows}

## Quotes

${quotes}
`;
}

// ─── --vault-sync mode: DB-only, no AssemblyAI/GPT-4o ──────────────────────────

/**
 * Writes/updates Obsidian notes from ALREADY-EXTRACTED podcast_host_summaries
 * rows -- no OpenAI calls, no re-extraction. Requires episode/feed metadata
 * (title, pub_date, show name) to rebuild the same vault_path + note shape
 * main() would have used, since a --no-vault run stored vault_path as null.
 */
async function runVaultSync(supabase) {
  if (!OBSIDIAN_KEY) {
    console.error('❌ Missing OBSIDIAN_API_KEY. --vault-sync must run from a machine that can reach Obsidian Local REST API.');
    process.exit(1);
  }

  console.log('PodcastHostSummaryAgent --vault-sync start');
  console.log(`  model=${MODEL} dryRun=${DRY_RUN} overwrite=${OVERWRITE}`);

  if (!DRY_RUN) await ensureObsidianReachable({ url: `${OBSIDIAN_URL}/`, obsidianKey: OBSIDIAN_KEY });

  let sq = supabase
    .from('podcast_host_summaries')
    .select('episode_id, host, attribution_method, futures, chunk_count, vault_path')
    .eq('model', MODEL);
  if (!OVERWRITE) sq = sq.is('vault_path', null);
  const { data: rows, error: sErr } = await sq;
  if (sErr) { console.error(`❌ load podcast_host_summaries: ${sErr.message}`); process.exit(1); }
  if (!rows?.length) { console.log('  Nothing to sync (no rows missing a vault_path -- pass --overwrite to re-sync everything).'); return; }

  const epIds = [...new Set(rows.map(r => r.episode_id))];
  const { data: episodes } = await supabase
    .from('podcast_episodes').select('id, title, pub_date, feed_id').in('id', epIds);
  const epById = new Map((episodes || []).map(e => [e.id, e]));
  const feedIds = [...new Set((episodes || []).map(e => e.feed_id))];
  const { data: feeds } = await supabase
    .from('podcast_feeds').select('id, name').in('id', feedIds);
  const feedById = new Map((feeds || []).map(f => [f.id, f]));

  console.log(`  ${rows.length} row(s) to sync`);

  let written = 0, errors = 0;
  for (const row of rows) {
    const ep = epById.get(row.episode_id);
    const feed = ep ? feedById.get(ep.feed_id) : null;
    if (!ep || !feed) {
      console.error(`  ❌ ${row.episode_id}/${row.host}: missing episode or feed metadata, skipping`);
      errors++;
      continue;
    }

    const vaultPath = `NFL/Podcasts/${slugify(feed.name)}/${slugify(row.host)}/${(ep.pub_date || '').slice(0, 10) || 'undated'}-${slugify(ep.title)}.md`;
    console.log(`  📝 [${feed.name}] ${row.host}: "${String(ep.title || '').slice(0, 60)}" → ${vaultPath}`);

    if (DRY_RUN) continue;

    try {
      const md = buildHostVaultNote({
        show: feed.name, host: row.host, title: ep.title, pubDate: ep.pub_date,
        futures: row.futures || [], model: MODEL,
        attributionMethod: row.attribution_method, chunkCount: row.chunk_count,
      });
      await obsidianPut(vaultPath, md);

      const { error: upErr } = await supabase
        .from('podcast_host_summaries')
        .update({ vault_path: vaultPath })
        .eq('episode_id', row.episode_id).eq('host', row.host).eq('model', MODEL);
      if (upErr) throw new Error(`vault_path update failed: ${upErr.message}`);

      written++;
    } catch (err) {
      console.error(`     ❌ ${err.message}`);
      errors++;
    }
  }

  console.log(`\n📊 Done. rows=${rows.length} written=${written} errors=${errors}`);
  if (DRY_RUN) console.log('   [dry-run] no writes performed.');
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('❌ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  if (VAULT_SYNC) { await runVaultSync(supabase); return; }

  if (!OPENAI_KEY) { console.error('❌ Missing OPENAI_API_KEY'); process.exit(1); }
  if (!NO_VAULT && !DRY_RUN && !OBSIDIAN_KEY) {
    console.error('❌ Missing OBSIDIAN_API_KEY (or pass --no-vault). Is Obsidian + Local REST API running?');
    process.exit(1);
  }
  if (!NO_VAULT && !DRY_RUN) {
    await ensureObsidianReachable({ url: `${OBSIDIAN_URL}/`, obsidianKey: OBSIDIAN_KEY });
  }

  console.log('PodcastHostSummaryAgent start');
  console.log(`  model=${MODEL} dryRun=${DRY_RUN} vault=${!NO_VAULT} overwrite=${OVERWRITE}`
    + `${LIMIT ? ` limit=${LIMIT}` : ''}${ONE_EP ? ` episode=${ONE_EP}` : ''}${SINCE ? ` since=${SINCE}` : ''}`);

  // 1. Load transcripts.
  let tq = supabase
    .from('podcast_transcripts')
    .select('episode_id, transcript_text, speaker_segments');
  if (ONE_EP) tq = tq.eq('episode_id', ONE_EP);
  const { data: transcripts, error: tErr } = await tq;
  if (tErr) { console.error(`❌ load transcripts: ${tErr.message}`); process.exit(1); }
  if (!transcripts?.length) { console.log('  No transcripts found.'); return; }

  // 2. Load episode + feed metadata.
  const epIds = [...new Set(transcripts.map(t => t.episode_id))];
  const { data: episodes } = await supabase
    .from('podcast_episodes').select('id, title, pub_date, feed_id').in('id', epIds);
  const epById = new Map((episodes || []).map(e => [e.id, e]));
  const feedIds = [...new Set((episodes || []).map(e => e.feed_id))];
  const { data: feeds } = await supabase
    .from('podcast_feeds').select('id, name, expert, needs_diarization').in('id', feedIds);
  const feedById = new Map((feeds || []).map(f => [f.id, f]));

  // 3. Which episodes already have host-summary rows for this model (skip unless --overwrite).
  let done = new Set();
  if (!OVERWRITE) {
    const { data: existing } = await supabase
      .from('podcast_host_summaries').select('episode_id').eq('model', MODEL);
    done = new Set((existing || []).map(r => r.episode_id));
  }

  // 4. Build the work list.
  let work = transcripts
    .map(t => ({ t, ep: epById.get(t.episode_id), feed: epById.get(t.episode_id) ? feedById.get(epById.get(t.episode_id).feed_id) : null }))
    .filter(({ ep, feed }) => ep && feed);
  if (SINCE) work = work.filter(({ ep }) => (ep.pub_date || '') >= SINCE);
  work = work.filter(({ t }) => OVERWRITE || !done.has(t.episode_id));
  work.sort((a, b) => String(b.ep.pub_date || '').localeCompare(String(a.ep.pub_date || '')));
  if (LIMIT) work = work.slice(0, LIMIT);

  console.log(`  ${work.length} episode(s) to process (${done.size} already done for ${MODEL}, skipped)`);

  let processed = 0, skipped = 0, wrote = 0, notes = 0, errors = 0;

  for (const { t, ep, feed } of work) {
    console.log(`\n  🎙 "${String(ep.title || '').slice(0, 66)}" [${feed.name}]`);

    const plan = planEpisodeProcessing({ feed, transcript: t });
    if (plan.mode === 'skip') {
      console.log(`     ⏭ skipped — ${plan.reason}`);
      skipped++;
      continue;
    }

    const multiHost = plan.mode === 'multi_host';
    const hostNames = multiHost ? plan.hostNames : [plan.host];
    const text = plan.text;
    const chunks = chunkTranscript(text);
    console.log(`     ${text.length.toLocaleString()} chars → ${chunks.length} chunk(s) | hosts: ${hostNames.join(', ')}`);

    try {
      const allFutures = [];
      for (let i = 0; i < chunks.length; i++) {
        const futures = await extractChunk(chunks[i], i + 1, chunks.length, { multiHost, hostNames });
        for (const f of futures) {
          const host = multiHost ? resolveHost(f.host, hostNames) : plan.host;
          allFutures.push({ ...f, host });
        }
        process.stdout.write(`     · chunk ${i + 1}/${chunks.length}: +${futures.length} futures\r`);
        await new Promise(r => setTimeout(r, CALL_DELAY_MS));
      }

      // Group by resolved host.
      const byHost = new Map();
      for (const f of allFutures) {
        if (!byHost.has(f.host)) byHost.set(f.host, []);
        byHost.get(f.host).push(f);
      }

      console.log(`\n     ✅ ${allFutures.length} raw futures across ${byHost.size} host(s)`);

      for (const [host, rawFutures] of byHost) {
        const futures = mergeFutures(rawFutures);
        const attributionMethod = multiHost ? plan.attributionMethodFor(host) : 'single_host';
        const vaultPath = `NFL/Podcasts/${slugify(feed.name)}/${slugify(host)}/${(ep.pub_date || '').slice(0, 10) || 'undated'}-${slugify(ep.title)}.md`;

        if (DRY_RUN) {
          console.log(`     [dry-run] ${host}: would upsert ${futures.length} futures (${attributionMethod}) + write ${NO_VAULT ? '(vault skipped)' : vaultPath}`);
          continue;
        }

        const { error: upErr } = await supabase
          .from('podcast_host_summaries')
          .upsert({
            episode_id: t.episode_id,
            host,
            model: MODEL,
            attribution_method: attributionMethod,
            futures,
            chunk_count: chunks.length,
            transcript_chars: text.length,
            vault_path: NO_VAULT ? null : vaultPath,
          }, { onConflict: 'episode_id,host,model' });
        if (upErr) { console.error(`     ❌ ${host}: upsert failed: ${upErr.message}`); errors++; continue; }
        wrote++;

        if (!NO_VAULT) {
          const md = buildHostVaultNote({ show: feed.name, host, title: ep.title, pubDate: ep.pub_date, futures, model: MODEL, attributionMethod, chunkCount: chunks.length });
          await obsidianPut(vaultPath, md);
          notes++;
          console.log(`     📝 ${host}: ${vaultPath}`);
        }
      }
      processed++;
    } catch (err) {
      errors++;
      console.error(`     ❌ ${err.message}`);
    }
  }

  console.log(`\n📊 Done. episodes=${work.length} processed=${processed} skipped=${skipped} rowsWritten=${wrote} vaultNotes=${notes} errors=${errors}`);
  if (DRY_RUN) console.log('   [dry-run] no writes performed.');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(err => { console.error(`Fatal: ${err.message}`); process.exit(1); });
}
