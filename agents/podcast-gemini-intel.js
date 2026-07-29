#!/usr/bin/env node
// agents/podcast-gemini-intel.js
// ═══════════════════════════════════════════════════════════════════════════════
// PodcastGeminiIntelAgent — Phase 5 of docs/PODCAST_HOLISTIC_INTEL_EXTRACTION_PLAN.md.
//
// Production Gemini --live-youtube extraction, wired to Supabase + the Obsidian
// vault. A NEW sibling agent alongside agents/podcast-ingest.js (untouched —
// its Groq/AssemblyAI/Whisper+GPT-4o loop keeps running in parallel). This
// agent runs against episodes with a resolved podcast_episodes.youtube_url
// (see scripts/resolve-youtube-episode-urls.js, Phase 5 step 1) and extracts
// both picks and analysis_notes (Phase 1's expanded schema) via the same
// google-genai Python runner already proven in scripts/run_gemini_youtube_
// shadow.py across 11 real bench episodes (Phases 1-4).
//
// Non-destructive: writes to podcast_gemini_intel (migration 045), keyed by
// (episode_id, model). Rows land with promoted_at = null — a REAL review gate,
// not bookkeeping (unlike the local shadow-harness's JSON review-status file,
// which nothing enforces). Only promoted_at IS NOT NULL rows are vault-written
// or visible to get_youtube_futures_intel (src/lib/agentTools.js).
//
// Vault notes are written PER HOST, matching the plan's step 5 literally:
// NFL/Podcasts/<Show>/<Host>/<pub_date>-<slug>-gemini-intel.md. Unlike the
// AssemblyAI/GPT-4o pipeline (podcast-host-summary.js), Gemini doesn't need
// audio-diarization speaker-mapping to get here — Phase 1's schema already
// has the model name a "speaker" per pick/note directly. Attribution is just
// canonicalizing that raw name string against the show's known host roster
// (src/lib/experts.js::findExpert, same roster search_podcast_picks/
// speaker-attribution.js already use) at promotion time — a pick/note with
// no resolvable host lands in an explicit "Unattributed" bucket/note rather
// than being silently dropped or merged into a host it doesn't belong to.
//
// Usage:
//   node agents/podcast-gemini-intel.js --dry-run             # no writes; prints plan
//   node agents/podcast-gemini-intel.js                        # extract + write (promoted_at stays null)
//   node agents/podcast-gemini-intel.js --limit 3               # cap episodes this run
//   node agents/podcast-gemini-intel.js --episode <uuid>         # single podcast_episodes.id
//   node agents/podcast-gemini-intel.js --overwrite              # redo even if a row exists for this model
//   node agents/podcast-gemini-intel.js --review                 # print all unpromoted rows for human review
//   node agents/podcast-gemini-intel.js --promote --episode <uuid>  # promote ONE row (sets promoted_at, writes vault note)
//   node agents/podcast-gemini-intel.js --promote --all             # promote ALL currently-unpromoted rows
//   node agents/podcast-gemini-intel.js --promote --all --no-vault  # promote without vault write
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY,
//      OBSIDIAN_API_URL (default https://localhost:27123), OBSIDIAN_API_KEY
// ═══════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import https from 'node:https';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { normalizePick, normalizeNote, classifyPick, classifyNote } from '../scripts/lib/gemini-pick-normalize.js';
import { findExpert } from '../src/lib/experts.js';

const ROOT = process.cwd();
const MODEL_NAME = 'gemini-3.5-flash';

// ─── Config / args ────────────────────────────────────────────────────────────

const argVal = (name, fallback = null) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const hasFlag = (name) => process.argv.includes(name);

const DRY_RUN   = hasFlag('--dry-run');
const OVERWRITE = hasFlag('--overwrite');
const NO_VAULT  = hasFlag('--no-vault');
const REVIEW    = hasFlag('--review');
const PROMOTE   = hasFlag('--promote');
const PROMOTE_ALL = hasFlag('--all');
const LIMIT     = Number(argVal('--limit', '0')) || 0;
const ONE_EP    = argVal('--episode', null);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OBSIDIAN_URL = (process.env.OBSIDIAN_API_URL || 'https://localhost:27123').replace(/\/$/, '');
const OBSIDIAN_KEY = process.env.OBSIDIAN_API_KEY || '';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(s) {
  return String(s ?? 'episode').toLowerCase()
    .replace(/&amp;|&/g, 'and').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 60) || 'episode';
}

function vaultPathFor({ show, host, pubDate, title }) {
  const date = (pubDate || '').slice(0, 10) || 'undated';
  return `NFL/Podcasts/${slugify(show)}/${slugify(host)}/${date}-${slugify(title)}-gemini-intel.md`;
}

const UNATTRIBUTED = 'Unattributed';

// Gemini already names a "speaker" per pick/note (Phase 1 schema) -- no
// audio-diarization mapping needed, just canonicalization against the show's
// known host roster. A blank/missing speaker, or one findExpert can't match
// at all, goes to the explicit UNATTRIBUTED bucket rather than being dropped
// or folded into a real host's note.
function resolveHostName(rawSpeaker, showName) {
  const raw = String(rawSpeaker || '').trim();
  if (!raw) return UNATTRIBUTED;
  const expert = findExpert(raw, { sourceHint: showName });
  if (expert && !expert.isShow) return expert.name;
  // findExpert found only a show-level entry (or nothing) -- keep the raw
  // Gemini-given name rather than discarding it; it's real information even
  // if we can't canonicalize it against a known roster entry.
  return raw;
}

/**
 * Group an episode's picks + notes by resolved host name. Returns a Map of
 * host -> { picks: [], notes: [] }, iteration-ordered by first appearance
 * (UNATTRIBUTED, if present, is not forced to any particular position).
 */
function groupByHost(picks, notes, showName) {
  const groups = new Map();
  const bucket = (hostName) => {
    if (!groups.has(hostName)) groups.set(hostName, { picks: [], notes: [] });
    return groups.get(hostName);
  };
  for (const p of picks) bucket(resolveHostName(p.speaker, showName)).picks.push(p);
  for (const n of notes) bucket(resolveHostName(n.speaker, showName)).notes.push(n);
  return groups;
}

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

function buildVaultNote({ show, host, title, pubDate, picks, notes, model, youtubeUrl }) {
  const date = (pubDate || '').slice(0, 10) || 'undated';
  const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const pickRows = picks.length
    ? picks.map(p => `| ${esc(p.market)} | ${esc(p.team)} | ${esc(p.side)} | ${p.line ?? '—'} | ${p.week ?? '—'} | ${esc(p.rationale).slice(0, 120)} | ${p.confidence ?? '—'} |`).join('\n')
    : '| — | (no picks) | — | — | — | — | — |';
  const noteRows = notes.length
    ? notes.map(n => `| ${esc(n.note_type)} | ${esc((n.teams || []).join(', '))} | ${esc((n.players || []).join(', '))} | ${esc(n.topic)} | ${esc(n.summary).slice(0, 160)} | ${esc(n.confidence)} |`).join('\n')
    : '| — | — | — | (no notes) | — | — |';

  return `---
sensitivity: green
source_system: podcast-gemini-intel
show: ${show}
host: ${JSON.stringify(host)}
title: ${JSON.stringify(title ?? '')}
pub_date: ${date}
picks_count: ${picks.length}
notes_count: ${notes.length}
model: ${model}
youtube_url: ${youtubeUrl}
generated: ${new Date().toISOString()}
---

# ${show} — ${host} — ${title ?? 'Episode'}
*Published: ${date} · Gemini video extraction (${model}) · promoted after human review*
${host === UNATTRIBUTED ? '\n> Gemini did not give (or we could not resolve) a specific host for these items — see the raw `speaker` field on each item if attribution matters here.\n' : ''}
## Picks

| Market | Team | Side | Line | Week | Rationale | Conf |
|--------|------|------|------|------|-----------|------|
${pickRows}

## Analysis & Context Notes

| Type | Teams | Players | Topic | Summary | Conf |
|------|-------|---------|-------|---------|------|
${noteRows}
`;
}

// ─── Gemini extraction (subprocess call, same pattern as
// scripts/gemini-podcast-shadow-harness.js::runLiveGeminiYoutube) ─────────────

function runGeminiExtraction({ youtubeUrl, title, show, pubDate, durationSecs }) {
  const pyScript = path.join(ROOT, 'scripts', 'run_gemini_youtube_shadow.py');
  const cliArgs = [
    pyScript,
    '--url', youtubeUrl,
    '--episode-title', title || 'NFL Podcast',
    '--show', show || 'Podcast',
    '--date', (pubDate || '').slice(0, 10) || '2026',
  ];
  // Added 2026-07-28: same full-duration-coverage fix as
  // scripts/gemini-podcast-shadow-harness.js::runLiveGeminiYoutube. Pass the
  // episode's real runtime when known so Gemini doesn't stop analyzing a long
  // episode partway through (confirmed failure mode, see coverage_assessment).
  if (durationSecs) cliArgs.push('--duration-seconds', String(Math.round(durationSecs)));

  const rawOutput = execFileSync('python', cliArgs, { encoding: 'utf8' });
  const jsonRes = JSON.parse(rawOutput);
  if (jsonRes.error) throw new Error(jsonRes.error);

  const parsed = jsonRes.parsed_json || {};
  const coverage = jsonRes.coverage_assessment || null;
  if (coverage?.suspected_incomplete) {
    console.error(`⚠️  Suspected incomplete extraction for ${youtubeUrl}: ${coverage.reason}`);
  }
  return {
    picks: (parsed.extracted_picks || []).map(normalizePick),
    notes: (parsed.analysis_notes || []).map(normalizeNote),
    quote_timestamps: parsed.quote_timestamps || [],
    cost_usd: jsonRes.estimated_cost_usd || 0,
    latency_ms: jsonRes.latency_ms || 0,
    input_tokens: jsonRes.input_tokens || 0,
    output_tokens: jsonRes.output_tokens || 0,
    coverage_assessment: coverage,
  };
}

// ─── Extract mode ─────────────────────────────────────────────────────────────

async function runExtract(supabase) {
  let epQuery = supabase
    .from('podcast_episodes')
    .select('id, title, pub_date, feed_id, youtube_url')
    .not('youtube_url', 'is', null);
  if (ONE_EP) epQuery = epQuery.eq('id', ONE_EP);
  epQuery = epQuery.order('pub_date', { ascending: false });
  const { data: episodes, error: epErr } = await epQuery;
  if (epErr) { console.error(`❌ load episodes: ${epErr.message}`); process.exit(1); }
  if (!episodes?.length) { console.log('No episodes with a resolved youtube_url found. Run scripts/resolve-youtube-episode-urls.js first.'); return; }

  const feedIds = [...new Set(episodes.map(e => e.feed_id))];
  const { data: feeds } = await supabase.from('podcast_feeds').select('id, name, expert').in('id', feedIds);
  const feedById = new Map((feeds || []).map(f => [f.id, f]));

  let done = new Set();
  if (!OVERWRITE) {
    const { data: existing } = await supabase.from('podcast_gemini_intel').select('episode_id').eq('model', MODEL_NAME);
    done = new Set((existing || []).map(r => r.episode_id));
  }

  let work = episodes.filter(e => OVERWRITE || !done.has(e.id));
  if (LIMIT) work = work.slice(0, LIMIT);

  console.log(`PodcastGeminiIntelAgent (extract) start`);
  console.log(`  model=${MODEL_NAME} dryRun=${DRY_RUN} overwrite=${OVERWRITE} candidates=${episodes.length} to_run=${work.length} (${done.size} already done, skipped)`);

  let wrote = 0, errors = 0, totalCost = 0;

  for (const ep of work) {
    const feed = feedById.get(ep.feed_id) || {};
    const show = feed.name || 'Unknown Show';
    console.log(`\n  🎬 "${String(ep.title || '').slice(0, 66)}" [${show}]`);
    console.log(`     youtube_url=${ep.youtube_url}`);

    if (DRY_RUN) {
      console.log(`     [dry-run] would run Gemini extraction and upsert podcast_gemini_intel`);
      continue;
    }

    try {
      const result = runGeminiExtraction({ youtubeUrl: ep.youtube_url, title: ep.title, show, pubDate: ep.pub_date });
      totalCost += Number(result.cost_usd || 0);
      console.log(`     ✅ picks=${result.picks.length} notes=${result.notes.length} cost=$${result.cost_usd} latency=${result.latency_ms}ms`);

      const { error: upErr } = await supabase
        .from('podcast_gemini_intel')
        .upsert({
          episode_id: ep.id,
          model: MODEL_NAME,
          youtube_url: ep.youtube_url,
          picks: result.picks,
          analysis_notes: result.notes,
          quote_timestamps: result.quote_timestamps,
          cost_usd: result.cost_usd,
          latency_ms: result.latency_ms,
          input_tokens: result.input_tokens,
          output_tokens: result.output_tokens,
          // promoted_at intentionally omitted -- stays null until --promote.
        }, { onConflict: 'episode_id,model' });
      if (upErr) throw new Error(`upsert failed: ${upErr.message}`);
      wrote++;
    } catch (err) {
      errors++;
      console.error(`     ❌ ${err.message}`);
    }
  }

  console.log(`\n📊 Done. episodes=${work.length} written=${wrote} errors=${errors} total_cost=$${totalCost.toFixed(4)}`);
  if (!DRY_RUN && wrote > 0) console.log(`   Run --review to see unpromoted rows, then --promote to publish.`);
}

// ─── Review mode ──────────────────────────────────────────────────────────────

async function runReview(supabase) {
  const { data: rows, error } = await supabase
    .from('podcast_gemini_intel')
    .select('id, episode_id, model, picks, analysis_notes, cost_usd, created_at, podcast_episodes(title, pub_date, feed_id)')
    .is('promoted_at', null)
    .order('created_at', { ascending: false });
  if (error) { console.error(`❌ ${error.message}`); process.exit(1); }
  if (!rows?.length) { console.log('No unpromoted podcast_gemini_intel rows.'); return; }

  const feedIds = [...new Set(rows.map(r => r.podcast_episodes?.feed_id).filter(Boolean))];
  const { data: feeds } = await supabase.from('podcast_feeds').select('id, name').in('id', feedIds);
  const feedById = new Map((feeds || []).map(f => [f.id, f]));

  console.log(`${rows.length} unpromoted row(s) pending human review:\n`);
  for (const row of rows) {
    const ep = row.podcast_episodes || {};
    const show = feedById.get(ep.feed_id)?.name || 'Unknown Show';
    const picks = row.picks || [];
    const notes = row.analysis_notes || [];
    const hostGroups = groupByHost(picks, notes, show);
    console.log(`  episode_id=${row.episode_id} "${ep.title || '(unknown)'}" (${(ep.pub_date || '').slice(0, 10)}) [${show}]`);
    console.log(`    picks=${picks.length} notes=${notes.length} cost=$${row.cost_usd} model=${row.model}`);
    console.log(`    would promote to ${hostGroups.size} vault note(s), hosts=[${[...hostGroups.keys()].join(', ')}]`);
    for (const p of picks.slice(0, 5)) {
      console.log(`    · [${classifyPick(p)}] host=${resolveHostName(p.speaker, show)} ${p.team} ${p.market} ${p.side} ${p.line ?? ''} week=${p.week ?? '-'} — ${(p.rationale || '').slice(0, 80)}`);
    }
    if (picks.length > 5) console.log(`      ...+${picks.length - 5} more picks`);
    for (const n of notes.slice(0, 3)) {
      console.log(`    · [note:${classifyNote(n).join(',')}] host=${resolveHostName(n.speaker, show)} ${n.note_type}: ${(n.summary || '').slice(0, 80)}`);
    }
    if (notes.length > 3) console.log(`      ...+${notes.length - 3} more notes`);
    console.log('');
  }
  console.log(`Promote with: node agents/podcast-gemini-intel.js --promote --episode <episode_id>`);
  console.log(`           or: node agents/podcast-gemini-intel.js --promote --all`);
}

// ─── Promote mode ─────────────────────────────────────────────────────────────

async function runPromote(supabase) {
  if (!ONE_EP && !PROMOTE_ALL) {
    console.error('❌ --promote requires --episode <id> or --all');
    process.exit(1);
  }

  let query = supabase
    .from('podcast_gemini_intel')
    .select('id, episode_id, model, youtube_url, picks, analysis_notes, podcast_episodes(title, pub_date, feed_id)')
    .is('promoted_at', null);
  if (ONE_EP) query = query.eq('episode_id', ONE_EP);
  const { data: rows, error } = await query;
  if (error) { console.error(`❌ ${error.message}`); process.exit(1); }
  if (!rows?.length) { console.log('No matching unpromoted row(s) to promote.'); return; }

  const feedIds = [...new Set(rows.map(r => r.podcast_episodes?.feed_id).filter(Boolean))];
  const { data: feeds } = await supabase.from('podcast_feeds').select('id, name').in('id', feedIds);
  const feedById = new Map((feeds || []).map(f => [f.id, f]));

  let promoted = 0, notesWritten = 0, errors = 0;
  for (const row of rows) {
    const ep = row.podcast_episodes || {};
    const feed = feedById.get(ep.feed_id) || {};
    const show = feed.name || 'Unknown Show';
    const picks = row.picks || [];
    const notes = row.analysis_notes || [];
    const hostGroups = groupByHost(picks, notes, show);

    try {
      const vaultPaths = [];
      if (!NO_VAULT) {
        for (const [host, group] of hostGroups.entries()) {
          const vaultPath = vaultPathFor({ show, host, pubDate: ep.pub_date, title: ep.title });
          const md = buildVaultNote({
            show, host, title: ep.title, pubDate: ep.pub_date,
            picks: group.picks, notes: group.notes,
            model: row.model, youtubeUrl: row.youtube_url,
          });
          await obsidianPut(vaultPath, md);
          vaultPaths.push(vaultPath);
          notesWritten++;
        }
      }
      const { error: upErr } = await supabase
        .from('podcast_gemini_intel')
        .update({ promoted_at: new Date().toISOString(), vault_paths: vaultPaths })
        .eq('id', row.id);
      if (upErr) throw new Error(upErr.message);
      promoted++;
      const hostList = [...hostGroups.keys()].join(', ');
      console.log(`  ✅ promoted episode_id=${row.episode_id} "${ep.title || ''}" hosts=[${hostList}]${NO_VAULT ? '' : ` -> ${vaultPaths.length} vault note(s)`}`);
    } catch (err) {
      errors++;
      console.error(`  ❌ episode_id=${row.episode_id}: ${err.message}`);
    }
  }
  console.log(`\n📊 Promote done. promoted=${promoted} vaultNotes=${notesWritten} errors=${errors}`);
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('❌ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
  if (PROMOTE && !NO_VAULT && !OBSIDIAN_KEY) {
    console.error('❌ Missing OBSIDIAN_API_KEY (or pass --no-vault). Is Obsidian + Local REST API running?');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  if (REVIEW) return runReview(supabase);
  if (PROMOTE) return runPromote(supabase);
  return runExtract(supabase);
}

main().catch(err => { console.error(`Fatal: ${err.message}`); process.exit(1); });
