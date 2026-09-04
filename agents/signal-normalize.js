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
//   • podcast host summaries (podcast_host_summaries.futures[] — ALREADY structured
//                         {subject, subject_market, quote, lean, confidence} per
//                         agents/podcast-host-summary.js, full-transcript fidelity,
//                         no 12k-truncation. Bypasses the LLM classification step
//                         below entirely — it's pre-classified, so running it
//                         through the LLM again would just be paying to re-derive
//                         what's already in the row. 2026-09-04 Tier-4 wiring: this
//                         table had 105 rows / 527 items sitting completely unread
//                         by the dossier before this.)
//   • research pick signals (research_pick_signals — ALSO already structured
//                         {team_or_market, bet_type, lean, rationale, confidence}
//                         via agents/research-intel-ingest.js's regex extraction.
//                         2026-09-04 Tier-4 wiring: portfolio-dossier.js only ever
//                         reads this table through buildLeanView(), an INLINE
//                         FALLBACK that never runs once a normalized-signals
//                         sidecar exists (which it always does now) — so all 650+
//                         rows here were reaching nothing, a dead `else` branch.
//                         Free/code-only like host summaries, but this table is
//                         52% verbatim article-headline echoes and >60% CFB/other
//                         sports (this is a raw regex-extraction dump, not a
//                         curated pick feed) — gatherPickSignalRows() below drops
//                         both classes before resolving a team, plus a targeted
//                         guard for state-qualifier college-name collisions
//                         (normalizeTeam's bare "carolina" alias matching "North
//                         Carolina +9.5" and resolving it to the Panthers.)
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
//   flags: --model gpt-4o | claude-fable-5   --limit N   --source article|podcast_intel|podcast_pick|expert|podcast_host_summary|pick_signal
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and OPENAI_API_KEY and/or ANTHROPIC_API_KEY
// ═══════════════════════════════════════════════════════════════════════════════

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { normalizeTeam } from '../src/lib/teams.js';
import { isNflBettingIntel } from './lib/sportsRelevanceFilter.js';
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

// ── podcast host summaries: ALREADY-STRUCTURED signals, no LLM needed ─────────
// podcast_host_summaries.futures[] items carry {subject, subject_market, quote,
// lean, confidence} straight from agents/podcast-host-summary.js's own
// extraction — a host/guest naming a team (or occasionally a player) with a
// directional lean and a confidence score. Classifying market/direction here
// in code, instead of re-running it through normalizeBatch()'s LLM call,
// keeps this source free and matches scripts/verify-intel-sources.js's own
// established handling of this exact table (extractTeam/extractMarket there;
// this uses the same team-resolution approach via normalizeTeam, and a market
// taxonomy aligned to SYSTEM_PROMPT's {superbowl, conference, division, wins,
// playoffs, game, award, prop, other} so downstream consumers — ODDS_SIGNAL_MARKETS
// in portfolio-dossier.js, the adjacent_signals split — treat these identically
// to LLM-derived rows.
const HOST_SUMMARY_LEAN = { favor: 'back', against: 'fade', over: 'over', under: 'under', neutral: 'na' };

function classifyHostSummaryMarket(subjectMarket) {
  const t = String(subjectMarket || '').toLowerCase();
  if (/win_total|^wins?$/.test(t)) return 'wins';
  if (/playoffs?/.test(t)) return 'playoffs';
  if (/super_bowl_matchup/.test(t)) return 'game';
  if (/super_bowl/.test(t)) return 'superbowl';
  if (/^(afc|nfc)_(east|west|north|south)/.test(t)) return 'division';
  if (/^(afc|nfc)$|conference/.test(t)) return 'conference';
  if (/\broy\b|rookie_of_the_year|\bmvp\b|coach_of_the_year|gm_of_the_year|comeback_player/.test(t)) return 'award';
  if (/yards_leader|touchdowns_leader|player_prop|rushing|receiving|passing/.test(t)) return 'prop';
  if (/week_\d+/.test(t)) return 'game';
  return 'other';
}

async function gatherHostSummaryRows() {
  const rows = [];
  let itemCount = 0, droppedNoTeam = 0;
  for (let from = 0; ; from += 1000) {
    const { data: page, error } = await sb.from('podcast_host_summaries')
      .select('id, host, futures, created_at')
      .order('id', { ascending: true })
      .range(from, from + 999);
    if (error) { console.warn(`   ⚠ podcast_host_summaries: ${error.message} — host-summary lane truncated at ${rows.length} row(s)`); break; }
    if (!page?.length) break;
    for (const r of page) {
      const futures = Array.isArray(r.futures) ? r.futures : [];
      futures.forEach((f, idx) => {
        itemCount++;
        // subject usually names the team ("Steelers", "Los Angeles Chargers");
        // subject_market occasionally does too ("NFC_East") but never resolves
        // where subject doesn't, so it's a same-tier fallback, not a downgrade.
        const canon = normalizeTeam(f.subject) || normalizeTeam(f.subject_market);
        if (!canon) { droppedNoTeam++; return; } // player-only prop/award lean with no team context — same drop rule normalizeBatch() applies to unresolved teams
        const direction = HOST_SUMMARY_LEAN[String(f.lean || '').toLowerCase()] || 'na';
        rows.push({
          model: MODEL, source_type: 'podcast_host_summary', source_ref: `hostsum:${r.id}:${idx}`,
          author: f.host || r.host || null,
          raw_text: [f.subject, f.subject_market, f.quote].filter(Boolean).join(' — ').slice(0, 600),
          team: canon,
          market: classifyHostSummaryMarket(f.subject_market),
          direction,
          strength: typeof f.confidence === 'number' ? Math.max(0, Math.min(1, f.confidence / 100)) : null,
          is_nfl: true,
          rationale: (f.quote || f.prediction || '').slice(0, 200),
        });
      });
    }
    if (page.length < 1000) break;
  }
  console.log(`   podcast host summaries: ${itemCount} item(s), ${rows.length} team-resolved (${droppedNoTeam} dropped — no team context, e.g. a player-only prop/award lean)`);
  return rows;
}

// ── research pick signals: ALREADY-STRUCTURED, but a raw regex-extraction dump
// with heavy noise — no LLM needed, but three drop filters guard the noise before
// resolving a team (see header comment for the full rationale):
//   1. isNflBettingIntel() — excludes CFB/CBB/other-sport rows (the 45%+ CFB share).
//   2. headline-echo — team_or_market === lean and looks like an article title
//      (raw extraction fell back to the whole headline, not a real pick).
//   3. state-qualifier collision guard — normalizeTeam() matches bare city/state
//      aliases word-by-word anywhere in the string ("carolina" in "North Carolina
//      +9.5" → Panthers). No NFL team name carries a directional qualifier, so
//      any "North/South/East/West/Central/Western/Eastern <word>" shape is CFB,
//      never a real NFL line — drop before resolution, don't guess.
const PICK_SIGNAL_ECHO_MIN_LEN = 40;
const PICK_SIGNAL_STATE_QUALIFIER_RE = /\b(north|south|east|west|central|western|eastern)\s+[a-z]/i;

function isPickSignalHeadlineEcho(row) {
  return row.team_or_market === row.lean && String(row.team_or_market || '').length > PICK_SIGNAL_ECHO_MIN_LEN;
}

function classifyPickSignalMarket(betType, text) {
  const t = String(text || '').toLowerCase();
  if (betType === 'spread' || betType === 'moneyline' || betType === 'total') return 'game';
  if (betType === 'futures') {
    if (/\bdivision\b/.test(t)) return 'division';
    if (/\bconference\b|\bafc\b|\bnfc\b/.test(t)) return 'conference';
    if (/\bplayoffs?\b/.test(t)) return 'playoffs';
    if (/mvp|coach of the year|rookie|comeback player|gm of the year/.test(t)) return 'award';
    if (/win total|\bwins?\b/.test(t)) return 'wins';
    if (/super bowl/.test(t)) return 'superbowl';
    return 'superbowl'; // futures with no more specific cue — SB odds are the dominant futures shape in this table
  }
  return 'other';
}

// Same back/fade/over/under heuristic buildLeanView() already applies to this
// table's inline-fallback path — kept identical so a team's lean count doesn't
// shift just because it's now reached through the normalized-signals path.
function pickSignalDirection(lean) {
  const d = String(lean || '').toLowerCase();
  if (/\bunder\b/.test(d)) return 'under';
  if (/\bover\b/.test(d)) return 'over';
  if (/\b(fade|against|avoid|no|short)\b/.test(d)) return 'fade';
  return 'back';
}

async function gatherPickSignalRows() {
  const rows = [];
  let total = 0, droppedNonNfl = 0, droppedEcho = 0, droppedCollision = 0, droppedAmbiguous = 0, droppedNoTeam = 0;
  for (let from = 0; ; from += 1000) {
    const { data: page, error } = await sb.from('research_pick_signals')
      .select('id, source, author, team_or_market, bet_type, lean, rationale, confidence, captured_at')
      .order('id', { ascending: true })
      .range(from, from + 999);
    if (error) { console.warn(`   ⚠ research_pick_signals: ${error.message} — pick-signal lane truncated at ${rows.length} row(s)`); break; }
    if (!page?.length) break;
    for (const r of page) {
      total++;
      const relevanceText = `${r.team_or_market || ''} ${r.rationale || ''}`;
      if (!isNflBettingIntel(relevanceText).isRelevant) { droppedNonNfl++; continue; }
      if (isPickSignalHeadlineEcho(r)) { droppedEcho++; continue; }
      if (PICK_SIGNAL_STATE_QUALIFIER_RE.test(r.team_or_market || '')) { droppedCollision++; continue; }
      // Some rows carry two concatenated team fragments (upstream extraction
      // corruption — e.g. "Browns New England Patriots -2.5", genuinely a
      // Patriots line, mislabeled with a stray "Browns" prefix). Resolving
      // word-by-word and requiring a SINGLE distinct canonical team catches
      // this rather than silently taking whichever team's alias word happens
      // to appear first, which is what a bare normalizeTeam() call would do.
      const distinctTeams = new Set(
        String(r.team_or_market || '').split(/\s+/)
          .map((w) => normalizeTeam(w))
          .filter(Boolean)
      );
      if (distinctTeams.size > 1) { droppedAmbiguous++; continue; }
      const canon = distinctTeams.size === 1 ? [...distinctTeams][0] : normalizeTeam(r.team_or_market);
      if (!canon) { droppedNoTeam++; continue; }
      rows.push({
        model: MODEL, source_type: 'pick_signal', source_ref: `pick:${r.id}`,
        author: r.author || r.source || null,
        raw_text: [r.team_or_market, r.rationale].filter(Boolean).join(' — ').slice(0, 600),
        team: canon,
        market: classifyPickSignalMarket(r.bet_type, `${r.team_or_market} ${r.rationale}`),
        direction: pickSignalDirection(r.lean),
        strength: typeof r.confidence === 'number' ? Math.max(0, Math.min(1, r.confidence)) : null,
        is_nfl: true,
        rationale: (r.rationale || '').slice(0, 200),
      });
    }
    if (page.length < 1000) break;
  }
  console.log(`   research pick signals: ${total} row(s), ${rows.length} team-resolved (dropped ${droppedNonNfl} non-NFL/CFB, ${droppedEcho} headline-echo, ${droppedCollision} state-qualifier collision, ${droppedAmbiguous} ambiguous multi-team, ${droppedNoTeam} no team match)`);
  return rows;
}

// ── gather raw items → [{ source_type, source_ref, raw_text }] ────────────────
async function gatherItems() {
  const items = [];
  const want = (s) => !ONLY_SOURCE || ONLY_SOURCE === s;

  if (want('article')) {
    // research_intel_notes holds 2,761 rows; .limit(1000) meant 64% of the article
    // corpus was never even offered to the normalizer — silently, since PostgREST
    // caps unpaginated reads at 1000 anyway and returns no error. Page through it.
    // captured_at is not unique, so id is the tiebreaker that keeps .range()
    // paging deterministic. (2026-09-04, Tier 1 pipeline remediation.)
    const data = [];
    for (let from = 0; ; from += 1000) {
      const { data: page, error } = await sb.from('research_intel_notes')
        .select('id, title, summary, source, author')
        .order('captured_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, from + 999);
      if (error) { console.warn(`   ⚠ research_intel_notes: ${error.message} — article lane truncated at ${data.length}`); break; }
      if (!page?.length) break;
      data.push(...page);
      if (page.length < 1000) break;
    }
    console.log(`   articles: ${data.length} note(s) loaded`);
    for (const n of data || []) {
      const text = [n.title, n.summary].filter(Boolean).join(' — ');
      if (text.trim()) items.push({ source_type: 'article', source_ref: `note:${n.id}`, raw_text: text, author: n.author || n.source || null });
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
          if (text && text.trim()) items.push({ source_type: 'podcast_intel', source_ref: `t:${row.id}#intel${i}`, raw_text: `[${show}] ${text}`, author: show });
        });
      }
      if (want('podcast_pick') && Array.isArray(row.picks)) {
        row.picks.forEach((pk, i) => {
          const text = [pk.type, pk.selection, pk.team1 && `${pk.team1} vs ${pk.team2}`, pk.summary].filter(Boolean).join(' | ');
          if (text.trim()) items.push({ source_type: 'podcast_pick', source_ref: `t:${row.id}#pick${i}`, raw_text: `[${show}] ${text}`, author: show });
        });
      }
    }
  }
  if (want('expert')) {
    const { data } = await sb.from('user_picks')
      .select('id, pick_type, selection, home, visitor, rationale, expert').eq('source', 'EXPERT').limit(1000);
    for (const p of data || []) {
      const text = [p.pick_type, p.selection, p.home && `${p.visitor} @ ${p.home}`, p.rationale].filter(Boolean).join(' | ');
      if (text.trim()) items.push({ source_type: 'expert_pick', source_ref: `pick:${p.id}`, raw_text: `[${p.expert || 'expert'}] ${text}`, author: p.expert || 'expert' });
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
        author: item.author || null,
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
  console.log(`   ${items.length} raw items (LLM-classified): ${JSON.stringify(bySrc)}`);

  // Pre-classified source — no LLM call, always gathered regardless of --limit
  // (which only bounds the LLM-classified items above; this source is free).
  const wantHostSummaries = !ONLY_SOURCE || ONLY_SOURCE === 'podcast_host_summary';
  const hostSummaryRows = wantHostSummaries ? await gatherHostSummaryRows() : [];
  const wantPickSignals = !ONLY_SOURCE || ONLY_SOURCE === 'pick_signal';
  const pickSignalRows = wantPickSignals ? await gatherPickSignalRows() : [];

  if (!items.length && !hostSummaryRows.length && !pickSignalRows.length) { console.log('   nothing to do'); return; }

  const allRows = [...hostSummaryRows, ...pickSignalRows]; let totalDropped = 0, failed = 0;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    try {
      const { rows, dropped } = await normalizeBatch(batch);
      allRows.push(...rows); totalDropped += dropped;
      process.stdout.write(`\r   batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(items.length / BATCH)} → ${allRows.length} signals`);
    } catch (e) { failed++; console.warn(`\n   ⚠ batch ${i}-${i + BATCH} failed: ${e.message}`); }
  }
  console.log(`\n   extracted ${allRows.length} NFL signals total (${hostSummaryRows.length} pre-classified host-summary + ${pickSignalRows.length} pre-classified pick-signal + ${allRows.length - hostSummaryRows.length - pickSignalRows.length} LLM-classified; dropped ${totalDropped} unresolved/vague; ${failed} batch failures)`);
  // by market/direction summary
  const byMkt = allRows.reduce((a, r) => ((a[`${r.market}/${r.direction}`] = (a[`${r.market}/${r.direction}`] || 0) + 1), a), {});
  console.log(`   ${JSON.stringify(byMkt)}`);
  console.log('   sample:', allRows.slice(0, 5).map((r) => `${r.team} ${r.market} ${r.direction} (${r.strength ?? '?'})`).join(' | '));

  if (DRY) { console.log('   [DRY RUN] no writes'); return; }

  // Always persist to a local JSON sidecar so an expensive extraction is never lost,
  // and so the dossier can read signals without depending on Supabase's schema cache.
  //
  // 2026-09-04 Tier-4 fix: this used to be a flat overwrite, so ANY --source-
  // filtered run (including podcast_host_summary's own free bypass above)
  // silently discarded every OTHER source's already-paid-for LLM signals the
  // moment it wrote the file — a --source expert run, say, would wipe out the
  // article/podcast corpus from the sidecar entirely. Now: only rows whose
  // source_type was actually gathered in THIS run are replaced; every other
  // source_type's existing rows carry over untouched.
  await mkdir(OUT_DIR, { recursive: true });
  const sidecar = path.join(OUT_DIR, `normalized-signals-${MODEL}.json`);
  const sourceTypesThisRun = new Set(allRows.map((r) => r.source_type));
  let existingRows = [];
  try {
    const prior = JSON.parse(await readFile(sidecar, 'utf8'));
    existingRows = Array.isArray(prior?.signals) ? prior.signals : [];
  } catch { /* no prior sidecar for this model yet, or it's unreadable — start fresh */ }
  const carriedOver = existingRows.filter((r) => !sourceTypesThisRun.has(r.source_type));
  const mergedRows = [...carriedOver, ...allRows];
  await writeFile(sidecar, JSON.stringify({ model: MODEL, generated_at: new Date().toISOString(), count: mergedRows.length, signals: mergedRows }, null, 2));
  console.log(`✅ wrote ${mergedRows.length} signals (${allRows.length} from this run + ${carriedOver.length} carried over untouched from other source types) → ${sidecar}`);

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
