// agents/signal-normalize.js
// ═══════════════════════════════════════════════════════════════════════════════
// Signal normalization (S274, intel-extraction build #1)
//
// Turns raw, unstructured intel into clean, team-canonical, DIRECTIONAL signals:
//   • RSS articles      (research_intel_notes: title + summary)
//   • podcast intel      (podcast_transcripts.intel[] — the free-text STRINGS the
//                         dossier currently drops; ~466 of them)
//   • podcast picks      (podcast_transcripts.picks[])
//   • expert picks       (user_picks, source=EXPERT)
//
// An LLM decides, per item: is this an actionable NFL betting lean (not just a
// mention / news)? If so it emits {team, market, direction, strength}. Teams are
// then canonicalized through src/lib/teams.js normalizeTeam and non-resolving /
// non-NFL rows are dropped. Output → Supabase public.normalized_signals (A/B by model).
//
// This is a DATA-PREP pass, not a judgment pass — gpt-4o is the sensible default;
// reserve Fable for the portfolio synthesis. Non-destructive; raw tables untouched.
//
// Usage:
//   node agents/signal-normalize.js --dry-run            # extract + print, no DB write
//   node agents/signal-normalize.js                      # live upsert to normalized_signals
//   flags: --model gpt-4o | claude-fable-5   --limit N   --source article|podcast_intel|podcast_pick|expert
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and OPENAI_API_KEY and/or ANTHROPIC_API_KEY
// ═══════════════════════════════════════════════════════════════════════════════

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { normalizeTeam } from '../src/lib/teams.js';
import 'dotenv/config';

const OUT_DIR = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), '.nfl', 'portfolio');

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const DRY = argv.includes('--dry-run');
const MODEL = getArg('--model', 'gpt-4o');
const LIMIT = parseInt(getArg('--limit', '0'), 10) || 0;   // 0 = all
const ONLY_SOURCE = getArg('--source', null);
const BATCH = parseInt(getArg('--batch', '12'), 10);

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
if (!SB_URL || !SB_KEY) { console.error('✖ Need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env'); process.exit(1); }
const isOpenAI = (m) => /^(gpt|o[13])/i.test(m);
if (isOpenAI(MODEL) && !OPENAI_KEY) { console.error('✖ OPENAI_API_KEY not set'); process.exit(1); }
if (!isOpenAI(MODEL) && !ANTHROPIC_KEY) { console.error('✖ ANTHROPIC_API_KEY not set'); process.exit(1); }
const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });

const SYSTEM_PROMPT = `You convert raw NFL betting intel into structured signals. For each NUMBERED item decide whether it expresses an ACTIONABLE NFL betting lean — a view that a team/market will over- or under-perform — as opposed to a mere mention, injury/roster news, human-interest, or another sport.

For each item return zero or more signals. Rules:
- is_nfl=false for anything about NBA/MLB/UFC/NCAA/golf/soccer/etc. (return no signals for those).
- A signal needs a DIRECTION. "Team X is a consensus Super Bowl pick" → back. "X will come up short / fade X" → fade. Win-total views → over/under. If an item is NFL but expresses no directional lean (pure context/news), return is_nfl=true with an empty signals array.
- team = the NFL team the signal is about (full name or nickname). market ∈ {superbowl, conference, division, wins, playoffs, game, award, prop, other}. direction ∈ {back, fade, over, under, na}. strength = 0..1 (how strong/confident the lean reads).

Return STRICT JSON only:
{ "results": [ { "i": <item number>, "is_nfl": <bool>, "signals": [ { "team": "<team>", "market": "<market>", "direction": "<direction>", "strength": <0..1>, "rationale": "<=12 words" } ] } ] }`;

async function withTimeout(ms, fn) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms); t.unref?.();
  try { return await fn(ac.signal); } finally { clearTimeout(t); }
}
async function callLLM(userContent) {
  return withTimeout(120_000, async (signal) => {
    if (isOpenAI(MODEL)) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, temperature: 0.1, max_tokens: 4096, response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userContent }] }),
        signal,
      });
      if (!res.ok) throw new Error(`${MODEL} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return (await res.json()).choices?.[0]?.message?.content ?? '{}';
    }
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 4096, temperature: 0.1, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: userContent }] }),
      signal,
    });
    if (!res.ok) throw new Error(`${MODEL} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return (await res.json()).content?.map((c) => c.text).join('') ?? '{}';
  });
}
function parseJSON(text) {
  let t = String(text).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const s = t.indexOf('{'), e = t.lastIndexOf('}');
  if (s >= 0 && e > s) t = t.slice(s, e + 1);
  return JSON.parse(t);
}

// ── gather raw items → [{ source_type, source_ref, raw_text }] ────────────────
async function gatherItems() {
  const items = [];
  const want = (s) => !ONLY_SOURCE || ONLY_SOURCE === s;

  if (want('article')) {
    const { data } = await sb.from('research_intel_notes')
      .select('id, title, summary, source, author').order('captured_at', { ascending: false }).limit(1000);
    for (const n of data || []) {
      const text = [n.title, n.summary].filter(Boolean).join(' — ');
      if (text.trim()) items.push({ source_type: 'article', source_ref: `note:${n.id}`, raw_text: text });
    }
  }
  if (want('podcast_intel') || want('podcast_pick')) {
    const { data } = await sb.from('podcast_transcripts')
      .select('id, intel, picks, podcast_episodes ( title )').order('processed_at', { ascending: false }).limit(300);
    for (const row of data || []) {
      const show = row.podcast_episodes?.title || 'podcast';
      if (want('podcast_intel') && Array.isArray(row.intel)) {
        row.intel.forEach((it, i) => {
          const text = typeof it === 'string' ? it : (it?.summary || it?.text || JSON.stringify(it));
          if (text && text.trim()) items.push({ source_type: 'podcast_intel', source_ref: `t:${row.id}#intel${i}`, raw_text: `[${show}] ${text}` });
        });
      }
      if (want('podcast_pick') && Array.isArray(row.picks)) {
        row.picks.forEach((pk, i) => {
          const text = [pk.type, pk.selection, pk.team1 && `${pk.team1} vs ${pk.team2}`, pk.summary].filter(Boolean).join(' | ');
          if (text.trim()) items.push({ source_type: 'podcast_pick', source_ref: `t:${row.id}#pick${i}`, raw_text: `[${show}] ${text}` });
        });
      }
    }
  }
  if (want('expert')) {
    const { data } = await sb.from('user_picks')
      .select('id, pick_type, selection, home, visitor, rationale, expert').eq('source', 'EXPERT').limit(1000);
    for (const p of data || []) {
      const text = [p.pick_type, p.selection, p.home && `${p.visitor} @ ${p.home}`, p.rationale].filter(Boolean).join(' | ');
      if (text.trim()) items.push({ source_type: 'expert_pick', source_ref: `pick:${p.id}`, raw_text: `[${p.expert || 'expert'}] ${text}` });
    }
  }
  return LIMIT ? items.slice(0, LIMIT) : items;
}

// ── normalize one batch via the LLM → rows ────────────────────────────────────
async function normalizeBatch(batch) {
  const numbered = batch.map((it, i) => `${i}. ${it.raw_text.slice(0, 400)}`).join('\n');
  const parsed = parseJSON(await callLLM(`Items:\n${numbered}`));
  const rows = [];
  let dropped = 0;
  for (const r of parsed.results || []) {
    const item = batch[r.i];
    if (!item) continue;
    if (!r.is_nfl || !Array.isArray(r.signals) || r.signals.length === 0) continue;
    for (const sig of r.signals) {
      const canon = normalizeTeam(sig.team); // canonical NFL nickname or null
      if (!canon) { dropped++; continue; }    // team didn't resolve → drop (non-NFL / vague)
      rows.push({
        model: MODEL, source_type: item.source_type, source_ref: item.source_ref,
        raw_text: item.raw_text.slice(0, 600), team: canon,
        market: (sig.market || 'other').toLowerCase(),
        direction: (sig.direction || 'na').toLowerCase(),
        strength: typeof sig.strength === 'number' ? Math.max(0, Math.min(1, sig.strength)) : null,
        is_nfl: true, rationale: (sig.rationale || '').slice(0, 200),
      });
    }
  }
  return { rows, dropped };
}

// ── main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`🧭 signal-normalize — model ${MODEL}${DRY ? ' (DRY RUN)' : ''}${ONLY_SOURCE ? ` source=${ONLY_SOURCE}` : ''}`);
  const items = await gatherItems();
  const bySrc = items.reduce((a, it) => ((a[it.source_type] = (a[it.source_type] || 0) + 1), a), {});
  console.log(`   ${items.length} raw items: ${JSON.stringify(bySrc)}`);
  if (!items.length) { console.log('   nothing to do'); return; }

  const allRows = []; let totalDropped = 0, failed = 0;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    try {
      const { rows, dropped } = await normalizeBatch(batch);
      allRows.push(...rows); totalDropped += dropped;
      process.stdout.write(`\r   batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(items.length / BATCH)} → ${allRows.length} signals`);
    } catch (e) { failed++; console.warn(`\n   ⚠ batch ${i}-${i + BATCH} failed: ${e.message}`); }
  }
  console.log(`\n   extracted ${allRows.length} NFL signals (dropped ${totalDropped} unresolved/vague; ${failed} batch failures)`);
  // by market/direction summary
  const byMkt = allRows.reduce((a, r) => ((a[`${r.market}/${r.direction}`] = (a[`${r.market}/${r.direction}`] || 0) + 1), a), {});
  console.log(`   ${JSON.stringify(byMkt)}`);
  console.log('   sample:', allRows.slice(0, 5).map((r) => `${r.team} ${r.market} ${r.direction} (${r.strength ?? '?'})`).join(' | '));

  if (DRY) { console.log('   [DRY RUN] no writes'); return; }

  // Always persist to a local JSON sidecar so an expensive extraction is never lost,
  // and so the dossier can read signals without depending on Supabase's schema cache.
  await mkdir(OUT_DIR, { recursive: true });
  const sidecar = path.join(OUT_DIR, `normalized-signals-${MODEL}.json`);
  await writeFile(sidecar, JSON.stringify({ model: MODEL, generated_at: new Date().toISOString(), count: allRows.length, signals: allRows }, null, 2));
  console.log(`✅ wrote ${allRows.length} signals → ${sidecar}`);

  // Best-effort Supabase upsert (durability + cross-model A/B). A missing table is
  // NON-FATAL — the JSON sidecar is authoritative for the portfolio dossier.
  let wrote = 0, dbErr = null;
  for (let i = 0; i < allRows.length; i += 500) {
    const chunk = allRows.slice(i, i + 500);
    const { error } = await sb.from('normalized_signals').upsert(chunk, { onConflict: 'model,source_type,source_ref,team,market' });
    if (error) { dbErr = error.message; break; }
    wrote += chunk.length;
  }
  if (dbErr) console.warn(`   ⚠ Supabase upsert skipped (${dbErr.slice(0, 90)}) — signals saved to JSON; apply migration 031 for the DB copy`);
  else console.log(`✅ upserted ${wrote} rows to normalized_signals (model=${MODEL})`);
})().catch((e) => { console.error('✖', e.message); process.exitCode = 1; });
