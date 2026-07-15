// agents/portfolio-dossier.js
// ═══════════════════════════════════════════════════════════════════════════════
// Portfolio Analysis Dossier assembler (S274)
//
// Purpose: pull every signal the futures-intel report already ingests and pre-
// compute the *decision-relevant* structure into ONE compact payload that a
// top-tier model can reason over — the input side of the A/B portfolio pass.
//
// It does NOT make recommendations. It computes, per market/team:
//   • latest price + vig-stripped fair probability per book
//   • cross-book divergence (the sharpest edge signal — where books disagree)
//   • best available price + which book holds it
//   • line movement over the snapshot history (steam vs drift, in prob + odds)
//   • per-market lean from the normalized signal layer (signal-normalize.js), with
//     the old inline resolver kept as a fallback when no normalized sidecar exists
//
// Output:
//   • .nfl/portfolio/dossier-<date>.json   { meta, synthesis_input, adjacent_signals, detail }
//   • .nfl/portfolio/dossier-<date>.md     human-readable summary
// synthesis_input is the compact view the synthesis script sends to the models.
//
// Usage:
//   node agents/portfolio-dossier.js [--season 2026] [--since 2026-06-01]
//                                    [--model gpt-4o] [--signals <path to normalized-signals-*.json>]
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (loaded from .env via dotenv)
// ═══════════════════════════════════════════════════════════════════════════════

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { normalizeTeam } from '../src/lib/teams.js';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, '.nfl', 'portfolio');

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const SEASON = parseInt(getArg('--season', '2026'), 10);
const SINCE = getArg('--since', null); // ISO date lower-bound on snapshot_time
const MODEL = getArg('--model', 'gpt-4o'); // which normalized-signals-<model>.json to read
const SIGNALS_PATH = getArg('--signals', null); // explicit override path

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SB_URL || !SB_KEY) { console.error('✖ Need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env'); process.exit(1); }
const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });

// ── odds math ────────────────────────────────────────────────────────────────
const americanToProb = (a) => {
  if (a == null || Number.isNaN(a)) return null;
  return a > 0 ? 100 / (a + 100) : -a / (-a + 100);
};
const probToAmerican = (p) => {
  if (!p || p <= 0 || p >= 1) return null;
  return p >= 0.5 ? -Math.round((p / (1 - p)) * 100) : Math.round(((1 - p) / p) * 100);
};
const median = (xs) => {
  const s = xs.filter((x) => x != null).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const round = (x, n = 4) => (x == null ? null : Number(x.toFixed(n)));

// Multiway markets whose per-book implied probs should be normalized to strip vig.
const MULTIWAY = new Set(['superbowl', 'conference_afc', 'conference_nfc',
  'division_afc_east', 'division_afc_north', 'division_afc_south', 'division_afc_west',
  'division_nfc_east', 'division_nfc_north', 'division_nfc_south', 'division_nfc_west',
  'most_wins', 'least_wins', 'superbowl_matchup']);

// ── fetchers ───────────────────────────────────────────────────────────────
async function fetchSnapshots() {
  const PAGE = 1000; let from = 0; const all = [];
  for (;;) {
    let q = sb.from('futures_odds_snapshots')
      .select('market_type, team, selection, book, odds, price, implied_prob, line, over_price, under_price, snapshot_time, season')
      .eq('season', SEASON).order('snapshot_time', { ascending: true }).range(from, from + PAGE - 1);
    if (SINCE) q = q.gte('snapshot_time', SINCE);
    const { data, error } = await q;
    if (error) throw new Error(`snapshots: ${error.message}`);
    all.push(...(data || []));
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}
async function fetchPickSignals() {
  const { data } = await sb.from('research_pick_signals')
    .select('source, author, team_or_market, bet_type, lean, rationale, confidence, captured_at')
    .order('captured_at', { ascending: false }).limit(1000);
  return data || [];
}
async function fetchUserPicks() {
  const { data } = await sb.from('user_picks')
    .select('source, pick_type, selection, home, visitor, line, confidence, expert, rationale, created_at, result')
    .order('created_at', { ascending: false }).limit(1000);
  return data || [];
}
async function fetchPodcastIntel() {
  const { data } = await sb.from('podcast_transcripts')
    .select('intel, picks, processed_at, podcast_episodes ( title, pub_date )')
    .order('processed_at', { ascending: false }).limit(300);
  return data || [];
}

// ── core: collapse snapshots into per market/team state ──────────────────────
function buildOddsView(snaps) {
  const g = {};
  for (const r of snaps) {
    const mk = r.market_type, tm = r.team || r.selection || '?', bk = r.book || '?';
    ((g[mk] ??= {})[tm] ??= {})[bk] ??= [];
    g[mk][tm][bk].push(r);
  }

  const markets = {};
  for (const [mk, teams] of Object.entries(g)) {
    const isWins = mk === 'wins';
    const teamOut = {};
    const bookOverround = {}; // book -> sum(latest implied) across teams (multiway vig)
    if (MULTIWAY.has(mk)) {
      for (const [, books] of Object.entries(teams)) {
        for (const [bk, rows] of Object.entries(books)) {
          const last = rows[rows.length - 1];
          const ip = last.implied_prob ?? americanToProb(last.price ?? last.odds);
          if (ip != null) bookOverround[bk] = (bookOverround[bk] || 0) + ip;
        }
      }
    }

    for (const [tm, books] of Object.entries(teams)) {
      const perBook = {};
      const fairProbs = [];
      let bestPrice = null, bestBook = null;
      const winsLines = [];
      for (const [bk, rows] of Object.entries(books)) {
        const first = rows[0], last = rows[rows.length - 1];
        if (isWins) {
          perBook[bk] = {
            line: last.line, over: last.over_price, under: last.under_price,
            over_prob: round(americanToProb(last.over_price)),
            under_prob: round(americanToProb(last.under_price)),
            first_line: first.line, last_line: last.line,
            snapshots: rows.length, first_time: first.snapshot_time, last_time: last.snapshot_time,
          };
          if (last.line != null) winsLines.push(last.line);
        } else {
          const priceNow = last.price ?? last.odds;
          const ipRaw = last.implied_prob ?? americanToProb(priceNow);
          const or = bookOverround[bk];
          const fair = (MULTIWAY.has(mk) && or) ? ipRaw / or : ipRaw;
          if (fair != null) fairProbs.push(fair);
          const firstPrice = first.price ?? first.odds;
          perBook[bk] = {
            price: priceNow, implied: round(ipRaw), fair: round(fair),
            first_price: firstPrice, last_price: priceNow,
            move_prob: round((ipRaw ?? 0) - (americanToProb(firstPrice) ?? ipRaw ?? 0)),
            snapshots: rows.length, first_time: first.snapshot_time, last_time: last.snapshot_time,
          };
          if (priceNow != null && (bestPrice == null || priceNow > bestPrice)) { bestPrice = priceNow; bestBook = bk; }
        }
      }

      if (isWins) {
        const overProbs = Object.values(perBook).map((b) => b.over_prob).filter((x) => x != null);
        teamOut[tm] = {
          type: 'wins', consensus_line: median(winsLines),
          line_spread: winsLines.length ? round(Math.max(...winsLines) - Math.min(...winsLines), 2) : null,
          over_prob_median: round(median(overProbs)), per_book: perBook,
        };
      } else {
        const impliedList = Object.values(perBook).map((b) => b.implied).filter((x) => x != null);
        const fairList = fairProbs.filter((x) => x != null);
        const divergence = impliedList.length ? round(Math.max(...impliedList) - Math.min(...impliedList)) : null;
        const fairMed = round(median(fairList));
        teamOut[tm] = {
          type: 'outright',
          fair_prob: fairMed, fair_american: probToAmerican(fairMed),
          best_price: bestPrice, best_book: bestBook,
          best_prob: round(americanToProb(bestPrice)),
          book_divergence: divergence, n_books: impliedList.length,
          per_book: perBook,
        };
        const bp = americanToProb(bestPrice);
        teamOut[tm].value_gap = (bp != null && fairMed != null) ? round(fairMed - bp) : null;
      }
    }
    markets[mk] = teamOut;
  }
  return markets;
}

// ════════════ NORMALIZED SIGNAL LEAN LAYER (preferred) ════════════════════════
// Reads signal-normalize.js output (.nfl/portfolio/normalized-signals-<model>.json):
// per-(team,market) directional signals. Keyed per market so a team can be
// "superbowl back" yet "wins under" simultaneously.
const ODDS_SIGNAL_MARKETS = new Set(['superbowl', 'wins', 'playoffs', 'division', 'conference']);
function toSignalMarket(dossierMk) {
  if (dossierMk === 'superbowl' || dossierMk === 'wins' || dossierMk === 'playoffs') return dossierMk;
  if (dossierMk.startsWith('division_')) return 'division';
  if (dossierMk.startsWith('conference_')) return 'conference';
  return null; // most_wins/least_wins/superbowl_matchup have no direct signal market
}
async function loadNormalizedSignals() {
  const p = SIGNALS_PATH || path.join(OUT_DIR, `normalized-signals-${MODEL}.json`);
  try {
    const raw = JSON.parse(await readFile(p, 'utf8'));
    return { path: p, signals: Array.isArray(raw.signals) ? raw.signals : [] };
  } catch { return null; }
}
function makeNormalizedFindLean(signals) {
  const byTeamMarket = {};   // `${team}|${signalMarket}` -> {back,fade,over,under,n,strength,samples}
  const adjacentByTeam = {}; // team -> [{market,direction,strength,why}] for game/prop/etc.
  for (const s of signals) {
    if (s.is_nfl === false) continue;
    const team = normalizeTeam(s.team); if (!team) continue;
    const mk = String(s.market || '').toLowerCase();
    const dir = String(s.direction || 'na').toLowerCase();
    if (ODDS_SIGNAL_MARKETS.has(mk)) {
      const e = (byTeamMarket[`${team}|${mk}`] ??= { back: 0, fade: 0, over: 0, under: 0, n: 0, strength: 0, samples: [] });
      if (['back', 'fade', 'over', 'under'].includes(dir)) e[dir]++;
      e.n++; e.strength += (typeof s.strength === 'number' ? s.strength : 0.5);
      if (e.samples.length < 5) e.samples.push({ dir, strength: s.strength ?? null, src: s.source_type, why: (s.rationale || '').slice(0, 120) });
    } else {
      (adjacentByTeam[team] ??= []).push({ market: mk, direction: dir, strength: s.strength ?? null, why: (s.rationale || '').slice(0, 120) });
    }
  }
  const findLean = (team, dossierMk) => {
    const canon = normalizeTeam(team); if (!canon) return null;
    const sMk = toSignalMarket(dossierMk); if (!sMk) return null;
    const e = byTeamMarket[`${canon}|${sMk}`]; if (!e) return null;
    return { back: e.back, fade: e.fade, over: e.over, under: e.under, n: e.n, avg_strength: round(e.strength / e.n, 2), samples: e.samples };
  };
  return { findLean, adjacentByTeam, combos: Object.keys(byTeamMarket).length };
}

// ── inline fallback lean layer (used only when no normalized sidecar) ─────────
const NON_NFL = /\b(nba|ncaa|college|cbb|mlb|baseball|world series|cy young|al mvp|nl mvp|ufc|mma|fighter|flyweight|bantamweight|pga|golf|open championship|scottish open|world cup|fifa|soccer|premier league|nhl|hockey|tennis|wnba|pistons|celtics|lakers|bulls|knicks|nets|heat|bucks|warriors|yankees|dodgers)\b/i;
function resolveNflTeam(str, contextText) {
  if (!str) return null;
  if (contextText && NON_NFL.test(contextText)) return null;
  return normalizeTeam(str) || null;
}
function buildLeanView(pickSignals, userPicks, podcastRows) {
  const leans = {};
  const cov = { article: { kept: 0, dropped: 0 }, expert: { kept: 0, dropped: 0 },
    podcast_pick: { kept: 0, dropped: 0 }, podcast_intel_unparsed: 0 };
  const add = (team, bucket, dir, conf, note, who) => {
    const e = (leans[team] ??= { team, article: 0, expert: 0, podcast: 0, back: 0, fade: 0, over: 0, under: 0, samples: [] });
    e[bucket]++;
    const d = String(dir || '').toLowerCase();
    if (/\bunder\b/.test(d)) e.under++;
    else if (/\bover\b/.test(d)) e.over++;
    else if (/\b(fade|against|avoid|no|short)\b/.test(d)) e.fade++;
    else e.back++;
    if (e.samples.length < 6) e.samples.push({ src: who, dir: dir || 'back', conf: conf ?? null, note: (note || '').slice(0, 200) });
  };
  for (const s of pickSignals) {
    const ctx = `${s.team_or_market || ''} ${s.bet_type || ''} ${s.lean || ''} ${s.rationale || ''}`;
    const team = resolveNflTeam(s.team_or_market, ctx) || resolveNflTeam(s.lean, ctx);
    if (!team) { cov.article.dropped++; continue; }
    cov.article.kept++;
    add(team, 'article', s.lean || s.bet_type, s.confidence, s.rationale || s.team_or_market, s.author || s.source);
  }
  for (const p of userPicks) {
    const ctx = `${p.selection || ''} ${p.home || ''} ${p.visitor || ''} ${p.rationale || ''}`;
    const team = resolveNflTeam(p.selection, ctx) || resolveNflTeam(p.home, ctx);
    if (!team) { cov.expert.dropped++; continue; }
    cov.expert.kept++;
    const dir = /^(over|under)$/i.test(p.selection || '') ? p.selection : p.pick_type;
    add(team, 'expert', dir, p.confidence, p.rationale, p.expert || p.source);
  }
  for (const row of podcastRows) {
    const intel = Array.isArray(row.intel) ? row.intel : [];
    cov.podcast_intel_unparsed += intel.length;
    const picks = Array.isArray(row.picks) ? row.picks : [];
    const show = row.podcast_episodes?.title || 'podcast';
    for (const pk of picks) {
      const ctx = `${pk.selection || ''} ${pk.team1 || ''} ${pk.team2 || ''} ${pk.summary || ''}`;
      const team = resolveNflTeam(pk.selection, ctx) || resolveNflTeam(pk.team1, ctx) || resolveNflTeam(pk.team2, ctx);
      if (!team) { cov.podcast_pick.dropped++; continue; }
      cov.podcast_pick.kept++;
      add(team, 'podcast', pk.type || pk.lean, pk.confidence, pk.summary, show);
    }
  }
  const findLean = (team) => {
    const canon = normalizeTeam(team); if (!canon) return null;
    const e = leans[canon]; if (!e) return null;
    return { article: e.article, expert: e.expert, podcast: e.podcast, back: e.back, fade: e.fade, over: e.over, under: e.under, samples: e.samples };
  };
  return { findLean, coverage: cov };
}

// ── compact synthesis input ──────────────────────────────────────────────────
function buildSynthesisInput(markets, findLean) {
  const out = {};
  for (const [mk, teams] of Object.entries(markets)) {
    const rows = [];
    for (const [tm, v] of Object.entries(teams)) {
      if (v.type === 'wins') {
        rows.push({ team: tm, consensus_line: v.consensus_line, line_spread: v.line_spread,
          over_prob_median: v.over_prob_median, books: v.per_book, lean: findLean(tm, mk) });
      } else {
        rows.push({ team: tm, fair_prob: v.fair_prob, fair_american: v.fair_american,
          best_price: v.best_price, best_book: v.best_book, best_prob: v.best_prob,
          value_gap: v.value_gap, book_divergence: v.book_divergence, n_books: v.n_books,
          moves: Object.fromEntries(Object.entries(v.per_book).map(([b, d]) => [b, d.move_prob])),
          lean: findLean(tm, mk) });
      }
    }
    rows.sort((a, b) => (Math.abs(b.value_gap ?? b.book_divergence ?? 0)) - (Math.abs(a.value_gap ?? a.book_divergence ?? 0)));
    out[mk] = rows;
  }
  return out;
}

// ── markdown summary ─────────────────────────────────────────────────────────
function leanTag(l) {
  if (!l) return '';
  const dir = [l.back ? `back${l.back}` : '', l.fade ? `fade${l.fade}` : '', l.over ? `o${l.over}` : '', l.under ? `u${l.under}` : ''].filter(Boolean).join('/');
  if (l.n != null) return ` · lean n${l.n}${dir ? ` (${dir})` : ''}${l.avg_strength != null ? ` @${l.avg_strength}` : ''}`;
  return ` · lean a${l.article}/e${l.expert}/p${l.podcast}${dir ? ` (${dir})` : ''}`;
}
function toMarkdown(meta, synth) {
  const ic = meta.intel_coverage;
  const intelLine = ic.mode === 'normalized'
    ? `Intel: ${ic.signals} normalized signals, ${ic.team_market_combos} team-market combos, ${ic.adjacent_teams} teams with adjacent (game/prop) signals`
    : `Intel (inline fallback): article ${ic.article?.kept ?? 0}, expert ${ic.expert?.kept ?? 0}, podcast-picks ${ic.podcast_pick?.kept ?? 0}`;
  const L = [`# Portfolio Dossier — ${meta.generated_at}`, '',
    `Season ${meta.season} · ${meta.snapshot_count} snapshots · books: ${meta.books.join(', ')}`, intelLine, ''];
  for (const [mk, rows] of Object.entries(synth)) {
    L.push(`## ${mk}  (${rows.length})`);
    for (const r of rows.slice(0, 8)) {
      if (r.consensus_line != null) {
        L.push(`- **${r.team}** wins line ${r.consensus_line} (spread ${r.line_spread ?? '-'}), O% ${r.over_prob_median ?? '-'}${leanTag(r.lean)}`);
      } else {
        L.push(`- **${r.team}** fair ${r.fair_prob} (${r.fair_american}) · best ${r.best_price} @${r.best_book} · value_gap ${r.value_gap} · book_div ${r.book_divergence}${leanTag(r.lean)}`);
      }
    }
    L.push('');
  }
  return L.join('\n');
}

// ── main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`📊 Portfolio dossier — season ${SEASON}${SINCE ? ` since ${SINCE}` : ''}`);
  const [snaps, pickSignals, userPicks, podcastRows] = await Promise.all([
    fetchSnapshots(), fetchPickSignals(), fetchUserPicks(), fetchPodcastIntel(),
  ]);
  const books = [...new Set(snaps.map((s) => s.book))].sort();
  console.log(`   ${snaps.length} snapshots · ${pickSignals.length} article signals · ${userPicks.length} expert picks · ${podcastRows.length} podcast transcripts`);
  console.log(`   books: ${books.join(', ')}`);

  const markets = buildOddsView(snaps);

  // Prefer the normalized signal layer; fall back to the inline resolver.
  let findLean, adjacent_signals = {}, intel_coverage;
  const norm = await loadNormalizedSignals();
  if (norm && norm.signals.length) {
    const nf = makeNormalizedFindLean(norm.signals);
    findLean = nf.findLean; adjacent_signals = nf.adjacentByTeam;
    intel_coverage = { mode: 'normalized', signals: norm.signals.length, team_market_combos: nf.combos, adjacent_teams: Object.keys(adjacent_signals).length, source: path.basename(norm.path) };
    console.log(`   intel: normalized signals — ${norm.signals.length} signals, ${nf.combos} team-market combos, ${intel_coverage.adjacent_teams} teams with adjacent signals (${intel_coverage.source})`);
  } else {
    const inline = buildLeanView(pickSignals, userPicks, podcastRows);
    findLean = inline.findLean; intel_coverage = { mode: 'inline', ...inline.coverage };
    console.log(`   intel: inline fallback (run agents/signal-normalize.js for the richer layer) — article ${inline.coverage.article.kept}, expert ${inline.coverage.expert.kept}, podcast-picks ${inline.coverage.podcast_pick.kept}`);
  }

  const synthesis_input = buildSynthesisInput(markets, findLean);

  const meta = {
    generated_at: new Date().toISOString(), season: SEASON, since: SINCE,
    snapshot_count: snaps.length, books, market_types: Object.keys(markets),
    signal_counts: { article: pickSignals.length, expert: userPicks.length, podcast_transcripts: podcastRows.length },
    intel_coverage,
  };
  const dossier = { meta, synthesis_input, adjacent_signals, detail: markets };

  await mkdir(OUT_DIR, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const jsonPath = path.join(OUT_DIR, `dossier-${date}.json`);
  const mdPath = path.join(OUT_DIR, `dossier-${date}.md`);
  await writeFile(jsonPath, JSON.stringify(dossier, null, 2));
  await writeFile(mdPath, toMarkdown(meta, synthesis_input));
  console.log(`✅ wrote ${jsonPath}`);
  console.log(`✅ wrote ${mdPath}`);
  console.log(`   next: node agents/portfolio-synthesize.js --dossier "${jsonPath}"`);
})().catch((e) => { console.error('✖', e.message); process.exitCode = 1; });
