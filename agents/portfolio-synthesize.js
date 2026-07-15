// agents/portfolio-synthesize.js
// ═══════════════════════════════════════════════════════════════════════════════
// A/B Portfolio Synthesis (S274)  —  Opus 4.8 + Fable 5 on the identical dossier
//
// Takes the compact dossier from portfolio-dossier.js and asks two top-tier models
// to produce a ranked, defensible betting portfolio under a STRICT output contract:
// every play must carry a fair price, an edge, a confidence, a one-line thesis, and
// — non-negotiable — its single strongest disconfirming factor. It then DIFFS the
// two models: plays both surface = high conviction; plays only one surfaces = flagged
// for your judgment. Includes a Week-1 correlation / timing layer (bet-now vs
// wait-for-a-result vs pair-with-a-correlated-Week-1-bet).
//
// This is DECISION SUPPORT. It proposes; you decide. Nothing here places a bet.
//
// Output:
//   • .nfl/portfolio/portfolio-<date>.html   (reviewable, open in browser)
//   • .nfl/portfolio/portfolio-<date>.md
//   • .nfl/portfolio/portfolio-<date>.raw.json  (both models' raw returns, for audit)
//
// Usage:
//   node agents/portfolio-synthesize.js --dossier .nfl/portfolio/dossier-<date>.json
//     [--models claude-opus-4-8,claude-fable-5] [--max-plays 15] [--only opus|fable|gpt]
//   GPT-4o fallback (funded OpenAI key) — get a portfolio without Anthropic credits:
//     node agents/portfolio-synthesize.js --models gpt-4o --dossier <path>
//   Mixed A/B once Anthropic is funded:  --models claude-opus-4-8,claude-fable-5
//
// Env: ANTHROPIC_API_KEY and/or OPENAI_API_KEY  (loaded from .env). Models starting
//      gpt-/o1-/o3- route to OpenAI; everything else to Anthropic.
// ═══════════════════════════════════════════════════════════════════════════════

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, '.nfl', 'portfolio');

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const DOSSIER = getArg('--dossier', null);
const MODELS = getArg('--models', 'claude-opus-4-8,claude-fable-5').split(',').map((s) => s.trim()).filter(Boolean);
const MAX_PLAYS = parseInt(getArg('--max-plays', '15'), 10);
const ONLY = getArg('--only', null); // 'opus' | 'fable' — run a single model
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!DOSSIER) { console.error('✖ pass --dossier <path to dossier-*.json>'); process.exit(1); }
if (!ANTHROPIC_KEY && !OPENAI_KEY) { console.error('✖ Need ANTHROPIC_API_KEY or OPENAI_API_KEY in .env'); process.exit(1); }
const isOpenAI = (m) => /^(gpt|o[13])/i.test(m); // route gpt-4o / o1 / o3 to OpenAI, else Anthropic

const SYSTEM_PROMPT = `You are a disciplined NFL futures + betting-market analyst producing a REVIEWABLE portfolio for a human bettor who makes all final decisions. You are decision support, not an instruction to bet. Be calibrated and skeptical, never promotional.

You receive a DOSSIER of pre-computed market state: for each futures market/team you get the vig-stripped fair probability (median across books), the best available price and which book holds it, a value_gap (fair_prob minus best-price implied prob; positive = the backer is getting a better number than fair), cross-book divergence, recent line movement per book (move_prob, positive = shortened/steamed), and an aggregated lean count from articles/experts/podcasts (a=article, e=expert, p=podcast; net_over/net_under = direction) with sample notes.

RULES:
- Use ONLY the dossier. Never invent prices, teams, or markets. If a market is thin/absent (offseason markets return no odds), say so and do not fabricate a play.
- A real edge needs a REASON the market is wrong, not just a positive value_gap (which can be stale juice or a book error). Cross-reference divergence, movement, and lean before trusting a gap.
- Every recommendation MUST include its single strongest DISCONFIRMING factor — the best reason NOT to make the bet. A play with no honest counter-case is not ready.
- Prefer a small number of well-supported plays over breadth. Cap core plays at ${MAX_PLAYS}.
- Stake tiers are relative sizing guidance only (core > standard > small > speculative), never dollar amounts.

WEEK-1 CORRELATION & TIMING (important):
- For each futures view, assess whether an imminent Week 1 (or early-season) result is a CATALYST that will move this futures price. If waiting for that result is likely to yield a materially better number — and the current price is not itself a fleeting value that will vanish — set timing.action = "wait" with the specific trigger and the expected direction/size of the move.
- Identify Week 1 sides/totals that are CORRELATED with a futures position (same team, same thesis) — either as a complementary add or as a hedge. Populate correlated_week1.
- If the value is now and waiting risks losing it, set timing.action = "bet_now" and say why the price won't improve.
- timing.action ∈ {"bet_now","wait","pair","pass"}.

Return STRICT JSON only (no prose, no markdown fences), shape:
{
  "recommendations": [
    {
      "market": "superbowl|conference_afc|division_nfc_east|wins|playoffs|...",
      "selection": "<team or over/under X.5>",
      "book": "<book holding the price>",
      "price": <american odds number>,
      "model_fair_prob": <0..1>,
      "edge_pct": <number, model_fair_prob*payout - 1, in %>,
      "confidence": <0..100>,
      "stake_tier": "core|standard|small|speculative",
      "thesis": "<=2 sentences",
      "disconfirming_factor": "the single best reason not to bet it",
      "timing": { "action": "bet_now|wait|pair|pass", "trigger": "<what to watch, e.g. 'Team loses Week 1'>", "expected_move": "<direction/size>", "rationale": "<=1 sentence" },
      "correlated_week1": [ { "game": "<matchup or team>", "bet": "<side/total>", "relationship": "complement|hedge" } ]
    }
  ],
  "watch": [ { "market": "...", "selection": "...", "why": "on the radar but not a play yet" } ],
  "portfolio_notes": "<=4 sentences on overall construction, correlation clusters, and coverage gaps"
}`;

function buildUserPrompt(dossier) {
  const m = dossier.meta;
  return `DOSSIER META: season ${m.season}, ${m.snapshot_count} snapshots, books=${(m.books || []).join(',')}, markets=${(m.market_types || []).join(',')}. Signal counts: ${JSON.stringify(m.signal_counts)}.

Offseason note: many markets (division, conference, awards, playoffs, matchup) may have limited or single-book coverage until preseason; weight coverage in your confidence. The Super Bowl market is the most liquid right now.

SYNTHESIS INPUT (per market, sorted by strongest signal first):
${JSON.stringify(dossier.synthesis_input)}

Produce the portfolio JSON per the contract. Focus your strongest convictions where odds coverage, divergence, movement, and lean align. Explicitly use the Week-1 timing layer where a near-term result is a price catalyst.`;
}

// manual abort timer we always clear — avoids a dangling libuv handle at exit (Node v24)
async function withTimeout(ms, fn) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms); t.unref?.();
  try { return await fn(ac.signal); } finally { clearTimeout(t); }
}

async function callModel(model, userContent) {
  const t0 = Date.now();
  const openai = isOpenAI(model);
  if (openai && !OPENAI_KEY) throw new Error('OPENAI_API_KEY not set');
  if (!openai && !ANTHROPIC_KEY) throw new Error('ANTHROPIC_API_KEY not set');

  const out = await withTimeout(300_000, async (signal) => {
    if (openai) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model, temperature: 0.4, max_tokens: 16000, response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userContent }],
        }),
        signal,
      });
      if (!res.ok) throw new Error(`${model} HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const data = await res.json();
      return { text: data.choices?.[0]?.message?.content ?? '', usage: data.usage };
    }
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model, max_tokens: 16000, temperature: 0.4, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: userContent }] }),
      signal,
    });
    if (!res.ok) throw new Error(`${model} HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    return { text: data.content?.map((c) => c.text).join('') ?? '', usage: data.usage };
  });
  console.log(`   ✓ ${model} in ${((Date.now() - t0) / 1000).toFixed(1)}s (${out.usage?.output_tokens ?? out.usage?.completion_tokens ?? '?'} out-tokens)`);
  return out;
}

// tolerant JSON extraction (strips fences / surrounding prose)
function parseJSON(text) {
  let t = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const s = t.indexOf('{'), e = t.lastIndexOf('}');
  if (s >= 0 && e > s) t = t.slice(s, e + 1);
  return JSON.parse(t);
}

const norm = (r) => `${(r.market || '').toLowerCase()}|${(r.selection || '').toLowerCase().replace(/[^a-z0-9. ]/g, '').trim()}`;

function diffModels(byModel) {
  const names = Object.keys(byModel);
  const index = {}; // key -> { key, market, selection, models: {name: rec} }
  for (const name of names) {
    for (const r of (byModel[name].recommendations || [])) {
      const k = norm(r);
      (index[k] ??= { key: k, market: r.market, selection: r.selection, models: {} }).models[name] = r;
    }
  }
  const consensus = [], divergent = [];
  for (const e of Object.values(index)) {
    (Object.keys(e.models).length === names.length && names.length > 1 ? consensus : divergent).push(e);
  }
  const convScore = (e) => Object.values(e.models).reduce((a, r) => a + (r.confidence || 0), 0) / Object.keys(e.models).length;
  consensus.sort((a, b) => convScore(b) - convScore(a));
  divergent.sort((a, b) => convScore(b) - convScore(a));
  return { names, consensus, divergent };
}

// ── render ───────────────────────────────────────────────────────────────────
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
function recCard(name, r, tag) {
  const t = r.timing || {};
  const wk1 = (r.correlated_week1 || []).map((w) => `${esc(w.game)}: ${esc(w.bet)} (${esc(w.relationship)})`).join('; ');
  return `<div class="rec ${tag}">
    <div class="rh"><b>${esc(r.selection)}</b> <span class="mk">${esc(r.market)}</span>
      <span class="pr">${esc(r.price)} @${esc(r.book)}</span>
      <span class="tier ${esc(r.stake_tier)}">${esc(r.stake_tier)}</span>
      <span class="conf">conf ${esc(r.confidence)}</span></div>
    <div class="meta">fair ${esc(r.model_fair_prob)} · edge ${esc(r.edge_pct)}% ${name ? `· <i>${esc(name)}</i>` : ''}</div>
    <div class="th">${esc(r.thesis)}</div>
    <div class="dis">⚠ ${esc(r.disconfirming_factor)}</div>
    <div class="tim"><b>${esc(t.action)}</b>${t.trigger ? ` — trigger: ${esc(t.trigger)}` : ''}${t.expected_move ? ` · ${esc(t.expected_move)}` : ''}${t.rationale ? ` — ${esc(t.rationale)}` : ''}</div>
    ${wk1 ? `<div class="wk">Wk1 correlated: ${wk1}</div>` : ''}
  </div>`;
}
function renderHTML(diff, byModel, meta) {
  const { names, consensus, divergent } = diff;
  const consHtml = consensus.map((e) => {
    const r = Object.values(e.models)[0]; // show first model's card, note agreement
    const confs = names.map((n) => e.models[n] ? `${n.split('-')[1]}:${e.models[n].confidence}` : '').filter(Boolean).join(' / ');
    return recCard(`both models · ${confs}`, r, 'consensus');
  }).join('');
  const divHtml = divergent.map((e) => {
    const name = Object.keys(e.models)[0];
    return recCard(`${name} only`, e.models[name], 'divergent');
  }).join('');
  const watch = names.flatMap((n) => (byModel[n].watch || []).map((w) => `<li><b>${esc(w.selection)}</b> <span class="mk">${esc(w.market)}</span> — ${esc(w.why)} <i>(${esc(n)})</i></li>`)).join('');
  const notes = names.map((n) => `<p><b>${esc(n)}:</b> ${esc(byModel[n].portfolio_notes)}</p>`).join('');
  return `<!doctype html><meta charset="utf-8"><title>NFL Portfolio ${meta.date}</title>
<style>
 body{font:15px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;max-width:920px;margin:24px auto;padding:0 16px;color:#1a1a1a}
 h1{margin:0 0 4px} .sub{color:#666;margin-bottom:20px}
 h2{margin:26px 0 10px;padding-bottom:6px;border-bottom:2px solid #eee}
 .banner{background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:10px 14px;margin:14px 0;font-size:13px}
 .rec{border:1px solid #e5e7eb;border-left-width:4px;border-radius:8px;padding:10px 12px;margin:10px 0}
 .rec.consensus{border-left-color:#16a34a;background:#f0fdf4}
 .rec.divergent{border-left-color:#f59e0b;background:#fffbeb}
 .rh{display:flex;gap:8px;align-items:center;flex-wrap:wrap} .mk{font-size:11px;background:#eef2ff;color:#3730a3;padding:1px 6px;border-radius:4px}
 .pr{font-weight:600} .tier{font-size:11px;padding:1px 6px;border-radius:4px;background:#e5e7eb;text-transform:uppercase}
 .tier.core{background:#dcfce7} .tier.speculative{background:#fee2e2} .conf{margin-left:auto;color:#666;font-size:12px}
 .meta{color:#666;font-size:12px;margin:3px 0} .th{margin:4px 0} .dis{color:#b45309;font-size:13px;margin:3px 0}
 .tim{font-size:12px;background:#f8fafc;padding:4px 8px;border-radius:4px;margin-top:4px} .wk{font-size:12px;color:#4338ca;margin-top:3px}
 li{margin:5px 0}
</style>
<h1>NFL Futures Portfolio — A/B</h1>
<div class="sub">${meta.date} · models: ${esc(names.join(' + '))} · season ${esc(meta.season)}</div>
<div class="banner"><b>Decision support only.</b> These are model proposals for your review — not instructions to bet. Sizing and whether to play at all are your call. Every play lists its strongest disconfirming factor; read it first.</div>
<h2>High conviction — both models agree (${consensus.length})</h2>${consHtml || '<p>None both models surfaced.</p>'}
<h2>Flagged — one model only, your judgment (${divergent.length})</h2>${divHtml || '<p>None.</p>'}
<h2>Watch list</h2><ul>${watch || '<li>None.</li>'}</ul>
<h2>Construction notes</h2>${notes}`;
}
function renderMD(diff, byModel, meta) {
  const { names, consensus, divergent } = diff;
  const line = (name, r) => `- **${r.selection}** (${r.market}) ${r.price}@${r.book} · ${r.stake_tier} · conf ${r.confidence} · edge ${r.edge_pct}%\n  - ${r.thesis}\n  - ⚠ ${r.disconfirming_factor}\n  - timing: **${r.timing?.action}**${r.timing?.trigger ? ` — ${r.timing.trigger}` : ''}${r.timing?.expected_move ? ` (${r.timing.expected_move})` : ''}\n  - _${name}_`;
  const L = [`# NFL Futures Portfolio (A/B) — ${meta.date}`, '', `Models: ${names.join(' + ')} · season ${meta.season}`, '',
    '> Decision support only — proposals for review, not instructions to bet.', '',
    `## High conviction — both models agree (${consensus.length})`];
  for (const e of consensus) { const r = Object.values(e.models)[0]; L.push(line(`both: ${names.map((n) => e.models[n] ? `${n}:${e.models[n].confidence}` : '').filter(Boolean).join(' / ')}`, r)); }
  L.push('', `## Flagged — one model only (${divergent.length})`);
  for (const e of divergent) { const n = Object.keys(e.models)[0]; L.push(line(`${n} only`, e.models[n])); }
  L.push('', '## Construction notes');
  for (const n of names) L.push(`**${n}:** ${byModel[n].portfolio_notes || ''}`);
  return L.join('\n');
}

// ── main ─────────────────────────────────────────────────────────────────────
(async () => {
  const dossier = JSON.parse(await readFile(DOSSIER, 'utf8'));
  const userContent = buildUserPrompt(dossier);
  const models = ONLY ? MODELS.filter((m) => m.includes(ONLY)) : MODELS;
  console.log(`🧠 Synthesizing portfolio with: ${models.join(' + ')}`);

  const byModel = {}; const raw = {};
  for (const model of models) {
    try {
      const { text, usage } = await callModel(model, userContent);
      raw[model] = { text, usage };
      byModel[model] = parseJSON(text);
      console.log(`   ${model}: ${(byModel[model].recommendations || []).length} plays, ${(byModel[model].watch || []).length} watch`);
    } catch (e) {
      console.error(`   ✖ ${model}: ${e.message}`);
      raw[model] = { error: e.message };
    }
  }
  const ok = Object.keys(byModel);
  if (!ok.length) { console.error('✖ no model returned a valid portfolio'); process.exitCode = 1; return; }

  const diff = diffModels(byModel);
  const meta = { date: new Date().toISOString().slice(0, 10), season: dossier.meta.season };
  await mkdir(OUT_DIR, { recursive: true });
  const base = path.join(OUT_DIR, `portfolio-${meta.date}`);
  await writeFile(`${base}.html`, renderHTML(diff, byModel, meta));
  await writeFile(`${base}.md`, renderMD(diff, byModel, meta));
  await writeFile(`${base}.raw.json`, JSON.stringify({ meta, models: ok, raw, parsed: byModel }, null, 2));
  console.log(`\n✅ ${base}.html`);
  console.log(`✅ ${base}.md`);
  console.log(`   consensus (both): ${diff.consensus.length} · flagged (one model): ${diff.divergent.length}`);
  console.log(`   open: Start-Process "${base}.html"`);
})().catch((e) => { console.error('✖', e.message); process.exitCode = 1; });
