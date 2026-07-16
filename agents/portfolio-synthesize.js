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

const SYSTEM_PROMPT = `You are a sharp NFL futures + betting-market analyst producing a REVIEWABLE portfolio for a human bettor who makes all final decisions. You are decision support, not an instruction to bet. Be calibrated and skeptical, never promotional — but your job is to MINE the entire market for edge, not rubber-stamp favorites.

DOSSIER (your price/odds ground truth): for each futures market/team you get the vig-stripped fair probability (median across books), the best available price AT A PLACEABLE BOOK + which book holds it (FanDuel/DraftKings are excluded from best-price — the user can't bet them; win-total rows also carry best_over/best_under + their books), value_gap (fair_prob minus best-price implied prob; positive = the backer gets a better number than fair), cross-book divergence, per-book line movement (move_prob, positive = shortened/steamed), and a per-market LEAN from normalized intel: n = number of intel signals, with back/fade counts (outrights) or over/under counts (win totals) and avg_strength (0..1). A team can be "superbowl back" yet "wins under" — leans are PER-MARKET. Each lean sample carries 'who' (the analyst/outlet that said it), and the dossier's 'experts' map lists what each named analyst likes. Each team row also carries 'prior' — recent-season W-L / ATS records — use this to GROUND bounce-back theses in fact (a team that was e.g. "2025: 5-12" on injuries is a concrete regression candidate, not a guess). Many team rows also carry 'sos' — strength of schedule computed from the ACTUAL 2026 schedule: sos.market = average opponent 2026 win-total line (LOWER = softer slate = tailwind for a win-total OVER / bounce-back / division long; HIGHER = gauntlet), sos.market_rank (1 = hardest, 32 = easiest), sos.prior = average opponent prior-year win% (classic backward-looking cross-check), plus home/away game counts. Prefer this over your own memory of who a team plays — the schedule is real and current; your recall of the 2026 slate may be wrong. adjacent_signals holds game-level and prop leans per team (Week-1 correlation + hedge fuel).

WHAT TO HUNT (do NOT just list chalk):
- ASYMMETRIC VALUE / LONGSHOTS: teams the market is likely UNDERPRICING because the price is anchored to a misleading prior-year record — e.g. a team that finished poorly on injuries or variance (not lack of talent), now with starters returning, a soft schedule, or a QB/roster/coaching upgrade. A long playoff / division / win-total / conference price on such a team is convex: small stake, large payoff, and true probability may sit well above the implied. NAME why the market is anchored wrong and what you think fair should be.
- BOUNCE-BACK SCAN: explicitly weigh last-place / low-win-total teams for regression UP, and inflated favorites for regression DOWN.
- HEDGING / CORRELATION: surface structures that lock value or cut variance — a longshot future + a correlated Week-1 side/total, or a favorite future hedged by a contrarian early-season bet. Put these in correlated_week1 with relationship.
- DIVERSIFY by type = favorite | value | longshot | hedge. Aim for a real mix; a portfolio of only favorites has failed the assignment.
- CITE SOURCES: when named analysts back a play (from a lean sample's 'who' or the experts map), name them in a "sources" array — the human wants to see WHO likes what (e.g. Warren Sharp, Simon Hunter, a specific podcast).
- BE COMPREHENSIVE: scan every market (all 8 divisions, both conferences, win totals, playoffs, Super Bowl, most/least wins). Surface at least 12–20 plays across types, plus a generous watch list — stopping at a handful means you under-mined the market.

USING KNOWLEDGE: prices, teams, and markets come ONLY from the dossier — never invent a price, and if a market is thin/absent say so rather than fabricate. But you MAY use your own NFL knowledge (rosters, prior-season results, injuries, coaching/QB changes) to build a thesis. For SCHEDULE STRENGTH specifically, use the dossier's 'sos' field — it is grounded in the real 2026 slate — rather than your memory of who plays whom; only fall back to recall when a row lacks sos, and flag it. Whenever a thesis rests on knowledge NOT in the dossier, set knowledge_based=true so the human can verify it, and let the disconfirming_factor flag the risk that your roster/injury knowledge is stale or wrong (your training may predate this season). A "soft/hard schedule" claim should cite the sos rank when it is available.

DISCIPLINE:
- PLACEABLE BOOKS ONLY: the user bets at Bookmaker, BetOnline, BetUS, and (via a proxy) the Vegas books — Circa, BetMGM, Caesars/WilliamHill. best_price/best_book (outrights) and best_over/best_under + their books (win totals) are ALREADY filtered to these placeable books. NEVER recommend a FanDuel or DraftKings price — those appear only as market context for fair value; the user cannot bet them. Every "book" in your output must be a placeable book (use the dossier's best_* fields).
- A real edge needs a REASON the market is wrong (anchoring to last year, injury misread, soft schedule, stale line), not just a positive value_gap (which can be juice or a book error). Cross-reference divergence, movement, and lean.
- Every recommendation MUST include its single strongest DISCONFIRMING factor — the best reason NOT to bet it. A play with no honest counter-case is not ready.
- Size to conviction AND variance: favorites/value can be core|standard; longshots are small|speculative (convex, low hit-rate). Stake tiers are relative only, never dollars.
- Cap the CORE book at ~${MAX_PLAYS}, but a longer tail of small longshot/hedge plays is welcome — breadth is fine when the tickets are cheap and convex.

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
      "type": "favorite|value|longshot|hedge",
      "book": "<book holding the price>",
      "price": <american odds number>,
      "model_fair_prob": <0..1>,
      "edge_pct": <number, model_fair_prob*payout - 1, in %>,
      "confidence": <0..100>,
      "stake_tier": "core|standard|small|speculative",
      "knowledge_based": <true if the thesis leans on NFL knowledge not in the dossier>,
      "thesis": "<=2 sentences; if longshot/value, name why the market is anchored wrong>",
      "disconfirming_factor": "the single best reason not to bet it (flag stale-knowledge risk if relevant)",
      "sources": [ "named analysts/outlets backing this, e.g. 'Warren Sharp', 'Sharp or Square'" ],
      "timing": { "action": "bet_now|wait|pair|pass", "trigger": "<what to watch, e.g. 'Team loses Week 1'>", "expected_move": "<direction/size>", "rationale": "<=1 sentence" },
      "correlated_week1": [ { "game": "<matchup or team>", "bet": "<side/total>", "relationship": "complement|hedge" } ]
    }
  ],
  "watch": [ { "market": "...", "selection": "...", "why": "on the radar but not a play yet" } ],
  "portfolio_notes": "<=4 sentences on overall construction, correlation clusters, and coverage gaps"
}`;

function buildUserPrompt(dossier) {
  const m = dossier.meta;
  return `DOSSIER META: season ${m.season}, ${m.snapshot_count} snapshots, books=${(m.books || []).join(',')}, markets=${(m.market_types || []).join(',')}. Intel: ${JSON.stringify(m.intel_coverage)}.

Offseason note: many markets (division, conference, awards, playoffs, matchup) may have limited or single-book coverage until preseason; weight coverage in your confidence. Super Bowl and win-total markets are the most liquid now — win totals especially are where bounce-back / longshot value tends to hide.

SYNTHESIS INPUT (per market, sorted by strongest signal first; lean is per-market with back/fade/over/under counts + avg_strength):
${JSON.stringify(dossier.synthesis_input)}

ADJACENT SIGNALS (game-level + prop leans per team — use for Week-1 correlation and hedges):
${JSON.stringify(dossier.adjacent_signals || {})}

Produce the portfolio JSON per the contract. Deliberately MINE for asymmetric value and bounce-back longshots — name why the market is anchored wrong — not just favorites; build hedges where correlation lets you lock value or cut variance; and use the Week-1 timing layer where a near-term result is a price catalyst.`;
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
    <div class="rh"><b>${esc(r.selection)}</b> <span class="mk">${esc(r.market)}</span> <span class="typ">${esc(r.type || '')}</span>${r.knowledge_based ? ' <span class="kb">⚑ knowledge</span>' : ''}
      <span class="pr">${esc(r.price)} @${esc(r.book)}</span>
      <span class="tier ${esc(r.stake_tier)}">${esc(r.stake_tier)}</span>
      <span class="conf">conf ${esc(r.confidence)}</span></div>
    <div class="meta">fair ${esc(r.model_fair_prob)} · edge ${esc(r.edge_pct)}% ${name ? `· <i>${esc(name)}</i>` : ''}</div>
    <div class="th">${esc(r.thesis)}</div>
    <div class="dis">⚠ ${esc(r.disconfirming_factor)}</div>
    ${r.sources?.length ? `<div class="src">📣 ${esc(r.sources.join(', '))}</div>` : ''}
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
  const line = (name, r) => `- [${(r.type || '?').toUpperCase()}] **${r.selection}** (${r.market}) ${r.price}@${r.book} · ${r.stake_tier} · conf ${r.confidence} · edge ${r.edge_pct}%${r.knowledge_based ? ' · ⚑knowledge' : ''}\n  - ${r.thesis}\n  - ⚠ ${r.disconfirming_factor}${r.sources?.length ? `\n  - 📣 sources: ${r.sources.join(', ')}` : ''}\n  - timing: **${r.timing?.action}**${r.timing?.trigger ? ` — ${r.timing.trigger}` : ''}${r.timing?.expected_move ? ` (${r.timing.expected_move})` : ''}\n  - _${name}_`;
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
