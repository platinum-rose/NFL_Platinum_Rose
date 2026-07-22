// agents/portfolio-synthesize.js
// ═══════════════════════════════════════════════════════════════════════════════
// Analyst-Committee Portfolio Synthesis (S274, committee rewrite 2026-07-22)
//
// Takes the compact dossier from portfolio-dossier.js through a 3-stage committee:
//   Stage 1 (Market+Football Analyst) — one call per --models entry (A/B by
//     default, Opus 4.8 + Fable 5), each producing a full candidate portfolio
//     under a strict schema (fair price, edge, confidence, market_view +
//     football_view split, thesis, disconfirming factor, edge_type, bet_threshold,
//     needs_human_review, evidence_ids, timing). mergeStage1() flattens the A/B
//     results into one candidate list with per-model agreement preserved.
//   Stage 2 (Skeptic) — a SEPARATE model call that did not generate these picks;
//     its only job is to attack each one and return hold/downgrade/kill.
//   Stage 3 (Risk/Portfolio + Editor) — a separate call that sees ALL surviving
//     candidates TOGETHER (needed for correlation/exposure judgment), finalizes
//     bet_threshold/needs_human_review/stake_tier, and can pass on a candidate
//     for portfolio reasons distinct from the Skeptic's reasons.
// rankByAxis() (code, not model output) then groups the survivors into six views:
// strongest math edge, strongest thesis edge, strongest stale-price edge, best
// low-correlation adds, longshots, and passes/kills (shown, not hidden).
//
// This is DECISION SUPPORT. It proposes; you decide. Nothing here places a bet.
//
// Output:
//   • .nfl/portfolio/portfolio-<date>.html   (reviewable, open in browser)
//   • .nfl/portfolio/portfolio-<date>.md
//   • .nfl/portfolio/portfolio-<date>.raw.json  (every stage's raw returns, for audit)
//   • Supabase `futures_recommendations` (migration 042) — one row per final
//     recommendation, for future backtesting/calibration. Skipped automatically
//     if SUPABASE_SERVICE_ROLE_KEY isn't set, or with --no-persist.
//
// Usage:
//   node agents/portfolio-synthesize.js --dossier .nfl/portfolio/dossier-<date>.json
//     [--models claude-opus-4-8,claude-fable-5] [--max-plays 15] [--only opus|fable|gpt]
//     [--skeptic-model <model>] [--risk-model <model>] [--skip-committee] [--no-persist]
//   GPT-4o fallback (funded OpenAI key) — get a portfolio without Anthropic credits:
//     node agents/portfolio-synthesize.js --models gpt-4o --dossier <path>
//   Quick single-pass (no Skeptic/Risk calls, original S274 behavior):
//     node agents/portfolio-synthesize.js --dossier <path> --skip-committee
//
// Env: ANTHROPIC_API_KEY and/or OPENAI_API_KEY (required). SUPABASE_URL +
//      SUPABASE_SERVICE_ROLE_KEY (optional, enables persistence). All from .env.
//      Models starting gpt-/o1-/o3- route to OpenAI; everything else to Anthropic.
// ═══════════════════════════════════════════════════════════════════════════════

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
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
// Analyst committee (2026-07-22 follow-up): stage 1 (Market+Football Analyst,
// the original A/B call above) -> stage 2 Skeptic -> stage 3 Risk/Editor.
// --skip-committee falls back to the original single-pass behavior (cheaper/
// faster; use when you just want a quick look). --skeptic-model/--risk-model
// default to the first stage-1 model so a single-model run needs no new flags.
const SKIP_COMMITTEE = argv.includes('--skip-committee');
const NO_PERSIST = argv.includes('--no-persist');
const SKEPTIC_MODEL = getArg('--skeptic-model', MODELS[0]);
const RISK_MODEL = getArg('--risk-model', MODELS[0]);
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!DOSSIER) { console.error('✖ pass --dossier <path to dossier-*.json>'); process.exit(1); }
if (!ANTHROPIC_KEY && !OPENAI_KEY) { console.error('✖ Need ANTHROPIC_API_KEY or OPENAI_API_KEY in .env'); process.exit(1); }
const isOpenAI = (m) => /^(gpt|o[13])/i.test(m); // route gpt-4o / o1 / o3 to OpenAI, else Anthropic

const SYSTEM_PROMPT = `You are a sharp NFL futures + betting-market analyst producing a REVIEWABLE portfolio for a human bettor who makes all final decisions. You are decision support, not an instruction to bet. Be calibrated and skeptical, never promotional — but your job is to MINE the entire market for edge, not rubber-stamp favorites.

DOSSIER (your price/odds ground truth): for each futures market/team you get the vig-stripped fair probability (median across books), the best available price AT A PLACEABLE BOOK + which book holds it (FanDuel/DraftKings are excluded from best-price — the user can't bet them; win-total rows also carry best_over/best_under + their books), value_gap (fair_prob minus best-price implied prob; positive = the backer gets a better number than fair), cross-book divergence, per-book line movement (move_prob, positive = shortened/steamed), and a per-market LEAN from normalized intel: n = number of intel signals, with back/fade counts (outrights) or over/under counts (win totals) and avg_strength (0..1). A team can be "superbowl back" yet "wins under" — leans are PER-MARKET. Each lean sample carries 'who' (the analyst/outlet that said it), and the dossier's 'experts' map lists what each named analyst likes. Each team row also carries 'prior' — recent-season W-L / ATS records — use this to GROUND bounce-back theses in fact (a team that was e.g. "2025: 5-12" on injuries is a concrete regression candidate, not a guess). Many team rows also carry 'sos' — strength of schedule computed from the ACTUAL 2026 schedule: sos.market = average opponent 2026 win-total line (LOWER = softer slate = tailwind for a win-total OVER / bounce-back / division long; HIGHER = gauntlet), sos.market_rank (1 = hardest, 32 = easiest), sos.prior = average opponent prior-year win% (classic backward-looking cross-check), plus home/away game counts. Prefer this over your own memory of who a team plays — the schedule is real and current; your recall of the 2026 slate may be wrong. adjacent_signals holds game-level and prop leans per team (Week-1 correlation + hedge fuel).

NEW (2026-07-22): each team row also carries four season-aggregate signals, all optional — a null/zero-count signal means "not enough data yet", not "no edge here", especially early in the season:
- 'analytics' — current-season EPA/play (off/def) with league rank (1=best) and formation tendencies (shotgun/no-huddle/pass rate), from real play-by-play, not box scores. Use to CONFIRM or CHALLENGE a record-based thesis (e.g. a team that's 6-1 but def_epa_rank 28 is a regression-down candidate; a 2-5 team with off_epa_rank 8 is a bad-variance bounce-back candidate, not a bad team).
- 'schedule_context' — games/short_rest_games/avg_rest/div_games for the team's OWN 2026 slate (distinct from sos, which is about opponent quality). A high short_rest_games count is a real tailwind for UNDER/fade theses late in a stretch; treat rest_known < games as partial-season coverage.
- 'officiating_context' — games_with_ref/avg_total_points/avg_total_penalties, averaged across the specific referees already assigned to this team's known games. Ties are USUALLY 0 games early in a season (refs aren't assigned until close to kickoff) — only use this when games_with_ref is meaningfully >0, and always cite its own 'confidence' field ("very low" samples should never carry a thesis alone).
- 'clv_signal' — n_tracked/avg_closing_move_toward_team (positive = the line has been closing MORE in this team's favor than this app's own tracked-open number) plus sharp_lean_games/public_fade_games from betting-splits divergence (money% vs ticket%). A team with several sharp_lean_games and a positive avg_closing_move is a real "the smart market likes this team" signal, distinct from and complementary to your own analytics-based read — cite it as market behavior, not your own opinion.
Separately, the top-level dossier.roster_churn map (not per-market — one entry per team) holds the LATEST week-over-week roster diff: adds/drops/status_changes counts between the two most-recent nflverse roster snapshots. High churn (especially drops/status_changes on a short list) is a real instability signal for win-total unders or fading a division favorite — but it is a raw personnel-movement count, not itself injury-specific, so treat it as a prompt to dig further, not a standalone thesis.

WIN-TOTAL MATH (2026-07-22 fix — previously wins rows had NO code-owned fair probability or edge at all; use these now instead of eyeballing the raw price): each wins row carries 'over_fair_prob'/'under_fair_prob' — a vig-stripped fair probability computed ONLY from books that share the SAME line as the best price (never mixed across lines — an Over 8.5 -105 and an Over 9.5 +120 are NOT the same bet and are never blended) — plus 'best_over_edge_pct'/'best_under_edge_pct' computed directly from that fair prob against the best placeable price, and 'line_consensus_confidence' (over_n_books/under_n_books — how many books actually agree at that specific line; treat a 1-book confidence figure as much weaker than a 4-book one). 'line_value_signal' flags when books disagree on the line itself (>0.5 spread) — treat consensus_line/edge loosely when that fires. Use best_over_edge_pct/best_under_edge_pct as your primary win-total edge signal, not vibes off the raw price.

INJURIES (2026-07-22 addition): each team row carries 'injuries' when available — injury_count, key_position_flags (which of QB/OL/EDGE/CB/WR1/RB1/TE1 groups have a real absence), qb_status, and freshness (how recent the report is). Any thesis that leans on roster health MUST either cite this field or set needs_human_review=true — do not assume health status from memory when this field is present and contradicts it.

WHAT TO HUNT (do NOT just list chalk):
- ASYMMETRIC VALUE / LONGSHOTS: teams the market is likely UNDERPRICING because the price is anchored to a misleading prior-year record — e.g. a team that finished poorly on injuries or variance (not lack of talent), now with starters returning, a soft schedule, or a QB/roster/coaching upgrade. A long playoff / division / win-total / conference price on such a team is convex: small stake, large payoff, and true probability may sit well above the implied. NAME why the market is anchored wrong and what you think fair should be.
- BOUNCE-BACK SCAN: explicitly weigh last-place / low-win-total teams for regression UP, and inflated favorites for regression DOWN.
- HEDGING / CORRELATION: surface structures that lock value or cut variance — a longshot future + a correlated Week-1 side/total, or a favorite future hedged by a contrarian early-season bet. Put these in correlated_week1 with relationship.
- DIVERSIFY by type = favorite | value | longshot | hedge. Aim for a real mix; a portfolio of only favorites has failed the assignment.
- CITE SOURCES: when named analysts back a play (from a lean sample's 'who' or the experts map), name them in a "sources" array — the human wants to see WHO likes what (e.g. Warren Sharp, Simon Hunter, a specific podcast).
- EPA/SCHEDULE/CLV DIVERGENCE FROM RECORD: when 'analytics' materially disagrees with a team's raw record/price (e.g. good EPA ranks but a bad record, or the reverse), that gap IS a thesis — name the specific rank/number, don't just gesture at "underlying metrics." Same for a real rest-differential or CLV/sharp-money signal that most bettors reading the record wouldn't see.
- BE COMPREHENSIVE: scan every market (all 8 divisions, both conferences, win totals, playoffs, Super Bowl, most/least wins). Surface at least 12–20 plays across types, plus a generous watch list — stopping at a handful means you under-mined the market.

USING KNOWLEDGE: prices, teams, and markets come ONLY from the dossier — never invent a price, and if a market is thin/absent say so rather than fabricate. But you MAY use your own NFL knowledge (rosters, prior-season results, injuries, coaching/QB changes) to build a thesis. For SCHEDULE STRENGTH specifically, use the dossier's 'sos' field — it is grounded in the real 2026 slate — rather than your memory of who plays whom; only fall back to recall when a row lacks sos, and flag it. For CURRENT FORM, prefer 'analytics' (real EPA/play-by-play) over your own recall of who's playing well — your training may predate this season's actual play. Whenever a thesis rests on knowledge NOT in the dossier, set knowledge_based=true so the human can verify it, and let the disconfirming_factor flag the risk that your roster/injury knowledge is stale or wrong (your training may predate this season). A "soft/hard schedule" claim should cite the sos rank when it is available.

DISCIPLINE:
- PLACEABLE BOOKS ONLY: the user bets at Bookmaker, BetOnline, BetUS, and (via a proxy) the Vegas books — Circa, BetMGM, Caesars/WilliamHill. best_price/best_book (outrights) and best_over/best_under + their books (win totals) are ALREADY filtered to these placeable books. NEVER recommend a FanDuel or DraftKings price — those appear only as market context for fair value; the user cannot bet them. Every "book" in your output must be a placeable book (use the dossier's best_* fields).
- A real edge needs a REASON the market is wrong (anchoring to last year, injury misread, soft schedule, stale line, EPA/record divergence, roster churn, sharp CLV move), not just a positive value_gap (which can be juice or a book error). Cross-reference divergence, movement, and lean.
- SMALL-SAMPLE SIGNALS: 'officiating_context' and 'clv_signal' are built from very few games early in a season — never let either one carry a thesis alone (check games_with_ref / n_tracked and the officiating confidence field first); they should corroborate a thesis already grounded in analytics/sos/lean, not originate one on their own until sample sizes grow.
- Every recommendation MUST include its single strongest DISCONFIRMING factor — the best reason NOT to bet it. A play with no honest counter-case is not ready.
- Size to conviction AND variance: favorites/value can be core|standard; longshots are small|speculative (convex, low hit-rate). Stake tiers are relative only, never dollars.
- Cap the CORE book at ~${MAX_PLAYS}, but a longer tail of small longshot/hedge plays is welcome — breadth is fine when the tickets are cheap and convex.

WEEK-1 CORRELATION & TIMING (important):
- For each futures view, assess whether an imminent Week 1 (or early-season) result is a CATALYST that will move this futures price. If waiting for that result is likely to yield a materially better number — and the current price is not itself a fleeting value that will vanish — set timing.action = "wait" with the specific trigger and the expected direction/size of the move.
- Identify Week 1 sides/totals that are CORRELATED with a futures position (same team, same thesis) — either as a complementary add or as a hedge. Populate correlated_week1.
- If the value is now and waiting risks losing it, set timing.action = "bet_now" and say why the price won't improve.
- timing.action ∈ {"bet_now","wait","pair","pass"}.

ROLE SPLIT (2026-07-22 follow-up — you are doing two jobs per recommendation, keep them visibly separate): for every recommendation, write 'market_view' (1 sentence: where/how this price differs from fair/consensus — value_gap, book_divergence, movement — pure market-structure read) SEPARATELY from 'football_view' (1 sentence: does the team's actual context — analytics/EPA, schedule_context, roster_churn, prior record — justify or contradict what the market is pricing). Don't blend them into one sentence; a real edge often needs BOTH to agree, and a mismatch between the two (market says X, football context says the opposite) is itself worth flagging as a disconfirming factor.

EDGE TYPE (for downstream ranking — pick the single best-fitting category, code will group by this, so be honest about which this actually is):
- "math"        — the edge is fundamentally a pricing/vig/divergence story: value_gap or book_divergence carries the case more than any narrative.
- "thesis"       — the edge rests on a real football-context argument (EPA/record divergence, schedule, roster, injury/coaching change) more than raw price.
- "stale_price"  — the price hasn't moved to reflect something that's already happened or is common knowledge (a result, an injury, a public roster move) — name what should have moved it and hasn't.
- "hedge"        — this play's primary purpose is to lock value or cut variance against another position, not a standalone edge.
- "longshot"     — convex, high-variance, low-probability-but-underpriced; sized small/speculative on purpose.

Return STRICT JSON only (no prose, no markdown fences), shape:
{
  "recommendations": [
    {
      "market": "superbowl|conference_afc|division_nfc_east|wins|playoffs|...",
      "selection": "<team or over/under X.5>",
      "type": "favorite|value|longshot|hedge",
      "edge_type": "math|thesis|stale_price|hedge|longshot",
      "book": "<book holding the price>",
      "price": <american odds number>,
      "model_fair_prob": <0..1>,
      "edge_pct": <number, model_fair_prob*payout - 1, in %>,
      "confidence": <0..100>,
      "stake_tier": "core|standard|small|speculative",
      "knowledge_based": <true if the thesis leans on NFL knowledge not in the dossier>,
      "market_view": "<=1 sentence — pure price/consensus read",
      "football_view": "<=1 sentence — does team context agree with the market>",
      "thesis": "<=2 sentences; if longshot/value, name why the market is anchored wrong>",
      "disconfirming_factor": "the single best reason not to bet it (flag stale-knowledge risk if relevant)",
      "bet_threshold": "<the worst price still worth taking, e.g. '-115 or better' — below this, pass>",
      "needs_human_review": <true if this thesis rests on something you're materially unsure of — thin data, conflicting signals, or knowledge_based with real staleness risk>,
      "evidence_ids": [ "<short pointers to WHICH dossier fields backed this, e.g. 'analytics.off_epa_rank', 'sos.market_rank', 'clv_signal.sharp_lean_games', 'lean.samples[0]' — lets a human trace the claim back to its source>" ],
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
  const sig = m.signal_coverage || {};
  return `DOSSIER META: season ${m.season}, ${m.snapshot_count} snapshots, books=${(m.books || []).join(',')}, markets=${(m.market_types || []).join(',')}. Intel: ${JSON.stringify(m.intel_coverage)}.

Offseason note: many markets (division, conference, awards, playoffs, matchup) may have limited or single-book coverage until preseason; weight coverage in your confidence. Super Bowl and win-total markets are the most liquid now — win totals especially are where bounce-back / longshot value tends to hide.

SIGNAL COVERAGE (2026-07-22 follow-up — how many of the 32 teams have each new per-team signal populated so far; low counts early in the season are expected, not a data bug): ${JSON.stringify(sig)}. Each team row below carries 'analytics' (EPA/formation), 'schedule_context' (own rest/travel), 'officiating_context' (assigned-referee tendencies, usually sparse pre-season), and 'clv_signal' (closing-line move + sharp-split divergence) per the field guide in your system prompt — use them where present, and don't treat an absent one as a negative signal, just an unavailable one.

SYNTHESIS INPUT (per market, sorted by strongest signal first; lean is per-market with back/fade/over/under counts + avg_strength):
${JSON.stringify(dossier.synthesis_input)}

ADJACENT SIGNALS (game-level + prop leans per team — use for Week-1 correlation and hedges):
${JSON.stringify(dossier.adjacent_signals || {})}

ROSTER CHURN (latest week-over-week nflverse roster diff per team — adds/drops/status_changes; a personnel-instability signal, not itself injury-specific):
${JSON.stringify(dossier.roster_churn || {})}

Produce the portfolio JSON per the contract. Deliberately MINE for asymmetric value and bounce-back longshots — name why the market is anchored wrong — not just favorites; build hedges where correlation lets you lock value or cut variance; and use the Week-1 timing layer where a near-term result is a price catalyst.`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYST COMMITTEE (2026-07-22 follow-up, per Andy + Codex's second-opinion review)
//
// Stage 1 (above): Market+Football Analyst — one call per model in --models,
// same as the original A/B design. Stage 2 and 3 below are NEW: independent
// model calls that see stage 1's output but were not the ones that generated
// it, so their skepticism/sizing isn't anchored on the same reasoning chain.
//   Stage 1 (Market+Football Analyst) -> mergeStage1() flattens A/B into one
//     candidate list, keeping per-model agreement visible.
//   Stage 2 (Skeptic) -> attacks each candidate independently; can kill one
//     outright or strengthen its disconfirming factor.
//   Stage 3 (Risk/Portfolio + Editor) -> sees ALL surviving candidates TOGETHER
//     (needed for correlation/exposure judgment), finalizes bet_threshold/
//     needs_human_review/stake_tier, and can pass on a candidate for portfolio
//     reasons distinct from the Skeptic's reasons.
// rankByAxis() (below, code-owned per Codex's own principle: the model
// proposes, code ranks/audits) then groups the stage-3 survivors into
// Codex's six categories using the edge_type stage 1 already tagged.
// ═══════════════════════════════════════════════════════════════════════════════

const SKEPTIC_SYSTEM_PROMPT = `You are the SKEPTIC on a betting-analyst committee. You did NOT generate these recommendations — a different analysis pass did. Your only job is to attack each one independently and report whether it survives.

For each candidate you receive (market, selection, price, book, model_fair_prob, edge_pct, confidence, thesis, disconfirming_factor, market_view, football_view, sources, knowledge_based, evidence_ids):
- Actively look for reasons the thesis is WRONG, not reasons to agree. Consider: is the "edge" just juice or a book pricing error rather than a real mispricing? Is the football_view thesis actually supported by the cited evidence_ids, or is it a plausible-sounding story with thin backing? Is the existing disconfirming_factor actually the strongest one, or is there a bigger risk the analyst missed? If knowledge_based is true, is the cited knowledge plausibly stale (analyst training may predate this season's actual events)?
- Do NOT rewrite the thesis or invent a new pick — you are auditing, not re-analyzing.
- Assign a confidence_delta: a negative number (typically -5 to -40) if you found a real weakness, 0 if the thesis holds up under attack, and (rarely, max +5) if the existing disconfirming_factor is actually weaker than stated and the case is more solid than the original confidence suggests.
- verdict: "hold" (thesis survives, keep as-is aside from the delta), "downgrade" (real weakness found but still worth including), or "kill" (the case doesn't hold up at all — should not appear in the final portfolio).
- If you found a stronger or more precise disconfirming factor than the one given, provide it in stronger_disconfirming_factor; otherwise omit that field.

Return STRICT JSON only: { "verdicts": [ { "key": "<the candidate's key, copied exactly>", "skeptic_note": "<=2 sentences on what you found>", "confidence_delta": <number>, "verdict": "hold|downgrade|kill", "stronger_disconfirming_factor": "<optional>" } ] }`;

function buildSkepticUserPrompt(candidates) {
  const compact = candidates.map((c) => ({
    key: c.key, market: c.market, selection: c.selection, price: c.price, book: c.book,
    model_fair_prob: c.model_fair_prob, edge_pct: c.edge_pct, confidence: c.confidence,
    edge_type: c.edge_type, knowledge_based: c.knowledge_based,
    market_view: c.market_view, football_view: c.football_view, thesis: c.thesis,
    disconfirming_factor: c.disconfirming_factor, sources: c.sources, evidence_ids: c.evidence_ids,
  }));
  return `CANDIDATES (${compact.length}) — attack each one independently:\n${JSON.stringify(compact)}\n\nReturn one verdict per candidate, matched by "key".`;
}

const RISK_EDITOR_SYSTEM_PROMPT = `You are the RISK/PORTFOLIO ANALYST and final EDITOR on a betting-analyst committee. You receive the candidates that survived an independent Skeptic pass (already attacked once — do not re-litigate the thesis itself). Your job is purely PORTFOLIO-LEVEL:

- Look across ALL surviving candidates together (not one at a time) for correlation: multiple plays that would all win/lose together (same team, same division, same underlying driver) inflate real risk beyond what each play's own confidence suggests — note this in portfolio_notes and consider trimming or downgrading stake_tier on the redundant ones.
- Set bet_threshold per candidate: the worst price still worth taking given its edge — below that price, the edge is gone. Be a real number/line, not vague.
- Set needs_human_review: true for anything resting on thin data, real disagreement between market_view and football_view, a "downgrade" verdict from the Skeptic, or correlation with 2+ other candidates.
- Set (or revise) stake_tier: core|standard|small|speculative — favorites/value can be core|standard; longshots and anything correlated with a bigger position should be small|speculative.
- You MAY pass on a candidate for portfolio reasons even if the Skeptic held it — e.g. too correlated with a bigger, better-supported play, or the book/portfolio is already overexposed to that team/division. Put these in "passes" with a reason distinct from the Skeptic's own reasoning.
- Do not add new picks. Only finalize sizing/thresholds or pass on what you were given.

Return STRICT JSON only: { "finalized": [ { "key": "<copied exactly>", "bet_threshold": "<...>", "needs_human_review": <bool>, "stake_tier": "core|standard|small|speculative", "risk_note": "<=1 sentence" } ], "passes": [ { "key": "<copied exactly>", "reason": "<why this doesn't make the final book>" } ], "portfolio_notes": "<=4 sentences on correlation clusters, overall exposure, coverage gaps>" }`;

function buildRiskEditorUserPrompt(candidates) {
  const compact = candidates.map((c) => ({
    key: c.key, market: c.market, selection: c.selection, type: c.type, edge_type: c.edge_type,
    price: c.price, book: c.book, edge_pct: c.edge_pct, confidence: c.confidence, stake_tier: c.stake_tier,
    thesis: c.thesis, disconfirming_factor: c.disconfirming_factor, skeptic_note: c.skeptic_note,
    skeptic_verdict: c.skeptic_verdict, correlated_week1: c.correlated_week1,
  }));
  return `SURVIVING CANDIDATES (${compact.length}, post-Skeptic) — judge the PORTFOLIO as a whole:\n${JSON.stringify(compact)}\n\nReturn one finalized entry per surviving candidate you keep, plus any you pass on, matched by "key".`;
}

// Flattens the A/B (or single-model) stage-1 results into one candidate list,
// keyed by normalized market|selection, carrying per-model agreement visibly
// instead of collapsing straight to a binary consensus/divergent split.
function mergeStage1(byModel) {
  const names = Object.keys(byModel);
  const index = {};
  for (const name of names) {
    for (const r of (byModel[name].recommendations || [])) {
      const key = norm(r);
      const e = (index[key] ??= { key, market: r.market, selection: r.selection, models: {} });
      e.models[name] = r;
    }
  }
  const candidates = [];
  for (const e of Object.values(index)) {
    const modelNames = Object.keys(e.models);
    // representative version: highest-confidence model's take carries the working fields forward
    const rep = modelNames.map((n) => e.models[n]).sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
    const avgConfidence = modelNames.reduce((a, n) => a + (e.models[n].confidence || 0), 0) / modelNames.length;
    candidates.push({
      ...rep,
      key: e.key,
      confidence: Math.round(avgConfidence),
      agreement: { count: modelNames.length, of: names.length, models: modelNames },
      stage1_versions: e.models,
    });
  }
  candidates.sort((a, b) => (b.agreement.count - a.agreement.count) || ((b.confidence || 0) - (a.confidence || 0)));
  return { names, candidates };
}

function clampConfidence(n) { return Math.max(0, Math.min(100, Math.round(n))); }

// manual abort timer we always clear — avoids a dangling libuv handle at exit (Node v24)
async function withTimeout(ms, fn) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms); t.unref?.();
  try { return await fn(ac.signal); } finally { clearTimeout(t); }
}

async function callModel(model, systemPrompt, userContent) {
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
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
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
      body: JSON.stringify({ model, max_tokens: 16000, temperature: 0.4, system: systemPrompt, messages: [{ role: 'user', content: userContent }] }),
      signal,
    });
    if (!res.ok) throw new Error(`${model} HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    return { text: data.content?.map((c) => c.text).join('') ?? '', usage: data.usage };
  });
  console.log(`   ✓ ${model} in ${((Date.now() - t0) / 1000).toFixed(1)}s (${out.usage?.output_tokens ?? out.usage?.completion_tokens ?? '?'} out-tokens)`);
  return out;
}

// tolerant JSON extraction (strips fences / surrounding prose) — handles both
// object ({...}) and array ([...]) top-level shapes, since stage 2/3 return
// { "verdicts": [...] } / { "finalized": [...], "passes": [...] } objects too.
function parseJSON(text) {
  let t = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const firstObj = t.indexOf('{'), lastObj = t.lastIndexOf('}');
  const firstArr = t.indexOf('['), lastArr = t.lastIndexOf(']');
  const useObj = firstObj >= 0 && (firstArr < 0 || firstObj <= firstArr);
  if (useObj && lastObj > firstObj) t = t.slice(firstObj, lastObj + 1);
  else if (firstArr >= 0 && lastArr > firstArr) t = t.slice(firstArr, lastArr + 1);
  return JSON.parse(t);
}

const norm = (r) => `${(r.market || '').toLowerCase()}|${(r.selection || '').toLowerCase().replace(/[^a-z0-9. ]/g, '').trim()}`;

// ── Math helpers (duplicated from portfolio-dossier.js — "code owns math" per
// Codex's own stated principle; the validator below must never trust the
// model's self-reported edge_pct, it must recompute it) ────────────────────────
const round = (n, d = 4) => (n == null ? null : Math.round(n * 10 ** d) / 10 ** d);
const decimalPayout = (price) => (price == null ? null : (price > 0 ? price / 100 + 1 : 100 / Math.abs(price) + 1));
const edgePctFromFair = (fairProb, price) => (fairProb == null || price == null) ? null : round((fairProb * decimalPayout(price) - 1) * 100, 2);

// ── Evidence resolver (2026-07-22 follow-up, Codex review item #4) ─────────────
// Stage 1 candidates cite evidence_ids as dot-path pointers into the dossier row
// that (supposedly) backed the claim — e.g. 'analytics.off_epa_rank',
// 'sos.market_rank', 'clv_signal.sharp_lean_games', 'lean.samples[0].who'. This
// resolves those pointers back to their actual dossier value so a human (or
// validateRecommendation, code-owned per Codex's own principle) can check the
// claim traces to something real rather than a plausible-sounding fabrication.
// Supports one level of array indexing per path segment.
function resolvePath(obj, pathStr) {
  if (obj == null || !pathStr) return undefined;
  const parts = String(pathStr).split('.').flatMap((seg) => {
    const m = seg.match(/^([^\[]+)(\[(\d+)\])?$/);
    if (!m) return [seg];
    return m[3] != null ? [m[1], Number(m[3])] : [m[1]];
  });
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

// Finds the dossier synthesis_input row a candidate's claims should trace back
// to: match on market key (exact — candidate.market must equal a dossier
// synthesis_input key) then fuzzy-match team name against the free-text
// selection (selection is often a sentence like "Chiefs Over 9.5", not the
// bare team name, so exact equality is unreliable).
function findDossierRow(dossier, candidate) {
  const rows = dossier?.synthesis_input?.[candidate?.market];
  if (!rows || !rows.length) return null;
  const sel = (candidate.selection || '').toLowerCase();
  if (!sel) return null;
  let best = null, bestScore = 0;
  for (const r of rows) {
    const team = (r.team || '').toLowerCase();
    if (!team) continue;
    if (sel.includes(team)) return r; // strong match: full team name appears in the selection text
    const teamWords = team.split(/\s+/).filter((w) => w.length > 3);
    const score = teamWords.filter((w) => sel.includes(w)).length;
    if (score > bestScore) { bestScore = score; best = r; }
  }
  return bestScore > 0 ? best : null;
}

// Resolves a candidate's evidence_ids against its matched dossier row. Returns
// one entry per id: { id, value, resolved }. resolved=false means the pointer
// didn't resolve to anything (bad path, or no dossier row match at all) — a
// signal the citation may be fabricated or the row-match failed, not proof of
// fraud on its own (some fields are legitimately null/absent).
function resolveEvidenceIds(evidenceIds, dossierRow) {
  if (!evidenceIds?.length) return [];
  return evidenceIds.map((id) => {
    if (!dossierRow) return { id, value: null, resolved: false };
    const value = resolvePath(dossierRow, id);
    return { id, value: value === undefined ? null : value, resolved: value !== undefined && value !== null };
  });
}

// ── Code-owned validation (2026-07-22 follow-up, Codex review — item #1 priority:
// "Code owns math. Code owns validation.") Runs AFTER the Risk/Editor stage and
// BEFORE ranking. For each final candidate: confirms the market/selection exists
// in the dossier, confirms the cited book/price match the dossier's placeable
// best-price fields for that selection (hard-invalidates fabricated or stale
// ones), recomputes edge_pct from the model's own model_fair_prob + price
// (never trusts the model's arithmetic), checks whether evidence_ids actually
// resolve, and downgrades an edge_type="math" claim the dossier's own edge
// fields don't support. Hard-invalid candidates are NOT silently dropped from
// final — they're returned with status 'invalid' so main() can route them to a
// separate invalidated[] list for the audit trail.
const PRICE_TOLERANCE = 0.05; // 5% relative tolerance on decimal payout (rounding/snapshot drift)
const MATH_EDGE_MIN_PCT = 1;  // below this, dossier fields don't really support a "math" edge_type

function sideOfSelection(selection) {
  const s = (selection || '').toLowerCase();
  if (/\bunder\b/.test(s)) return 'under';
  if (/\bover\b/.test(s)) return 'over';
  return null;
}

function validateRecommendation(candidate, dossier) {
  const notes = [];
  const row = findDossierRow(dossier, candidate);
  if (!row) {
    return { status: 'invalid', candidate, reason: `No dossier row found for market="${candidate.market}" selection="${candidate.selection}" — cannot verify this pick against real data.` };
  }

  const isWinsRow = row.consensus_line != null;
  const side = isWinsRow ? sideOfSelection(candidate.selection) : null;
  let expectedBook = null, expectedPrice = null;
  if (isWinsRow) {
    if (side === 'under') { expectedBook = row.best_under_book; expectedPrice = row.best_under; }
    else if (side === 'over') { expectedBook = row.best_over_book; expectedPrice = row.best_over; }
    else notes.push('could not determine over/under side from selection text — book/price not checked against a specific side.');
  } else {
    expectedBook = row.best_book; expectedPrice = row.best_price;
  }

  // book check — hard-invalid on mismatch (only when there's an expected book to check)
  if (expectedBook && candidate.book && candidate.book.toLowerCase() !== expectedBook.toLowerCase()) {
    return { status: 'invalid', candidate, reason: `Cited book "${candidate.book}" does not match the dossier's placeable best-price book "${expectedBook}" for ${candidate.selection} (${candidate.market}).` };
  }

  // price check — hard-invalid if materially off (fabricated or stale price)
  if (expectedPrice != null && candidate.price != null) {
    const dp1 = decimalPayout(candidate.price), dp2 = decimalPayout(expectedPrice);
    if (dp1 != null && dp2 != null && Math.abs(dp1 - dp2) / dp2 > PRICE_TOLERANCE) {
      return { status: 'invalid', candidate, reason: `Cited price ${candidate.price} does not match the dossier's price ${expectedPrice} at ${expectedBook} for ${candidate.selection} (>${PRICE_TOLERANCE * 100}% off) — likely stale or fabricated.` };
    }
  }

  // recompute edge_pct — code owns the math, never the model's self-reported figure
  const next = { ...candidate };
  if (candidate.model_fair_prob != null && candidate.price != null) {
    const recomputed = edgePctFromFair(candidate.model_fair_prob, candidate.price);
    if (recomputed != null) {
      if (candidate.edge_pct != null && Math.abs(recomputed - candidate.edge_pct) > 2) {
        notes.push(`edge_pct recomputed from model_fair_prob/price: ${recomputed}% (model reported ${candidate.edge_pct}%) — using code-verified figure.`);
      }
      next.edge_pct = recomputed;
    }
  }

  // evidence check — attach resolution for rendering regardless of outcome
  const evidenceResolved = resolveEvidenceIds(candidate.evidence_ids, row);
  next.evidence_resolved = evidenceResolved;
  let needsReview = !!candidate.needs_human_review;
  if (candidate.evidence_ids?.length && !evidenceResolved.some((e) => e.resolved)) {
    notes.push('none of the cited evidence_ids resolved against the matched dossier row — citations may be fabricated or mis-keyed.');
    needsReview = true;
  }

  // math edge_type support check — downgrade to thesis if the dossier's own
  // edge fields don't back a pure math claim
  if (candidate.edge_type === 'math') {
    const support = isWinsRow
      ? (side === 'under' ? Math.abs(row.best_under_edge_pct ?? 0)
        : side === 'over' ? Math.abs(row.best_over_edge_pct ?? 0)
        : Math.max(Math.abs(row.best_over_edge_pct ?? 0), Math.abs(row.best_under_edge_pct ?? 0)))
      : Math.abs((row.value_gap ?? row.book_divergence ?? 0) * 100);
    if (support < MATH_EDGE_MIN_PCT) {
      notes.push(`edge_type downgraded math→thesis: dossier's own edge fields (${round(support, 2)}%) don't support a pure math edge — treat as thesis-driven if kept.`);
      next.edge_type = 'thesis';
      needsReview = true;
    }
  }

  next.needs_human_review = needsReview;
  if (notes.length) next.validation_notes = notes;
  return { status: notes.length ? 'flagged' : 'ok', candidate: next };
}

// ── Stage 2 (Skeptic) merge ────────────────────────────────────────────────────
// Applies each verdict onto its candidate by key; kills go to a separate list
// (with the reason) instead of silently disappearing.
function applySkepticVerdicts(candidates, verdicts) {
  const byKey = new Map(candidates.map((c) => [c.key, c]));
  const vByKey = new Map((verdicts || []).map((v) => [v.key, v]));
  const survivors = [], killed = [];
  for (const c of candidates) {
    const v = vByKey.get(c.key);
    if (!v) { survivors.push({ ...c, skeptic_note: null, skeptic_verdict: 'unreviewed' }); continue; }
    const next = {
      ...c,
      confidence: clampConfidence((c.confidence || 0) + (v.confidence_delta || 0)),
      skeptic_note: v.skeptic_note || null,
      skeptic_verdict: v.verdict || 'hold',
      disconfirming_factor: v.stronger_disconfirming_factor || c.disconfirming_factor,
    };
    if (v.verdict === 'kill') killed.push({ ...c, reason: v.skeptic_note || 'Skeptic pass killed this candidate.', stage: 'skeptic' });
    else survivors.push(next);
  }
  return { survivors, killed };
}

// ── Stage 3 (Risk/Editor) merge ────────────────────────────────────────────────
function applyRiskEditor(candidates, riskOutput) {
  const finalizedByKey = new Map((riskOutput.finalized || []).map((f) => [f.key, f]));
  const passKeys = new Set((riskOutput.passes || []).map((p) => p.key));
  const final = [], passed = [];
  for (const c of candidates) {
    if (passKeys.has(c.key)) {
      const p = (riskOutput.passes || []).find((x) => x.key === c.key);
      passed.push({ ...c, reason: p?.reason || 'Risk/Editor pass excluded this from the final book.', stage: 'risk_editor' });
      continue;
    }
    const f = finalizedByKey.get(c.key);
    final.push(f ? {
      ...c,
      bet_threshold: f.bet_threshold ?? c.bet_threshold ?? null,
      needs_human_review: f.needs_human_review ?? c.needs_human_review ?? false,
      stake_tier: f.stake_tier || c.stake_tier,
      risk_note: f.risk_note || null,
    } : { ...c, risk_note: null });
  }
  return { final, passed };
}

// ── Ranking (code-owned, deterministic — Codex's own principle: the model
// proposes, code ranks/audits) — groups the final survivors into six views.
// A candidate CAN appear in more than one bucket (e.g. a longshot that's also
// a stale-price story); this mirrors "rank into views," not "partition."
function rankByAxis(final) {
  const byEdgeType = (t) => final.filter((c) => c.edge_type === t);
  const mathEdge = byEdgeType('math').length ? byEdgeType('math') : [...final];
  mathEdge.sort((a, b) => Math.abs(b.edge_pct || 0) - Math.abs(a.edge_pct || 0));

  const thesisEdge = byEdgeType('thesis');
  thesisEdge.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  const stalePriceEdge = byEdgeType('stale_price');
  stalePriceEdge.sort((a, b) => Math.abs(b.edge_pct || 0) - Math.abs(a.edge_pct || 0));

  const lowCorrelationAdds = final
    .filter((c) => !(c.correlated_week1 && c.correlated_week1.length) && c.stake_tier !== 'speculative')
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  const longshots = final
    .filter((c) => c.stake_tier === 'speculative' || c.type === 'longshot' || c.edge_type === 'longshot')
    .sort((a, b) => Math.abs(b.edge_pct || 0) - Math.abs(a.edge_pct || 0));

  return {
    math_edge: mathEdge.slice(0, MAX_PLAYS),
    thesis_edge: thesisEdge,
    stale_price_edge: stalePriceEdge,
    low_correlation_adds: lowCorrelationAdds,
    longshots,
  };
}

// ── render ───────────────────────────────────────────────────────────────────
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
function recCard(r) {
  const t = r.timing || {};
  const wk1 = (r.correlated_week1 || []).map((w) => `${esc(w.game)}: ${esc(w.bet)} (${esc(w.relationship)})`).join('; ');
  const agree = r.agreement ? `${r.agreement.count}/${r.agreement.of} models` : '';
  return `<div class="rec ${esc(r.edge_type || '')}">
    <div class="rh"><b>${esc(r.selection)}</b> <span class="mk">${esc(r.market)}</span> <span class="typ">${esc(r.type || '')}</span> <span class="et">${esc(r.edge_type || '')}</span>${r.knowledge_based ? ' <span class="kb">⚑ knowledge</span>' : ''}${r.needs_human_review ? ' <span class="hr">👤 review</span>' : ''}
      <span class="pr">${esc(r.price)} @${esc(r.book)}</span>
      <span class="tier ${esc(r.stake_tier)}">${esc(r.stake_tier)}</span>
      <span class="conf">conf ${esc(r.confidence)}</span></div>
    <div class="meta">fair ${esc(r.model_fair_prob)} · edge ${esc(r.edge_pct)}% ${agree ? `· <i>${esc(agree)}</i>` : ''}${r.bet_threshold ? ` · threshold: ${esc(r.bet_threshold)}` : ''}</div>
    ${r.market_view ? `<div class="mv"><b>Market:</b> ${esc(r.market_view)}</div>` : ''}
    ${r.football_view ? `<div class="fv"><b>Football:</b> ${esc(r.football_view)}</div>` : ''}
    <div class="th">${esc(r.thesis)}</div>
    <div class="dis">⚠ ${esc(r.disconfirming_factor)}</div>
    ${r.skeptic_note ? `<div class="sk">🕵 Skeptic (${esc(r.skeptic_verdict)}): ${esc(r.skeptic_note)}</div>` : ''}
    ${r.risk_note ? `<div class="rn">⚖ Risk: ${esc(r.risk_note)}</div>` : ''}
    ${r.evidence_resolved?.length ? `<div class="ev">🔗 ${r.evidence_resolved.map((e) => `${esc(e.id)}${e.resolved ? `=${esc(JSON.stringify(e.value))}` : ' <span class="unresolved">(unresolved)</span>'}`).join(', ')}</div>` : (r.evidence_ids?.length ? `<div class="ev">🔗 ${esc(r.evidence_ids.join(', '))} <span class="unresolved">(unresolved — no dossier row match)</span></div>` : '')}
    ${r.sources?.length ? `<div class="src">📣 ${esc(r.sources.join(', '))}</div>` : ''}
    <div class="tim"><b>${esc(t.action)}</b>${t.trigger ? ` — trigger: ${esc(t.trigger)}` : ''}${t.expected_move ? ` · ${esc(t.expected_move)}` : ''}${t.rationale ? ` — ${esc(t.rationale)}` : ''}</div>
    ${wk1 ? `<div class="wk">Wk1 correlated: ${wk1}</div>` : ''}
  </div>`;
}
function renderHTML(ranked, passed, killed, byModel, meta) {
  const names = Object.keys(byModel);
  const section = (title, list, empty) => `<h2>${esc(title)} (${list.length})</h2>${list.length ? list.map(recCard).join('') : `<p>${esc(empty)}</p>`}`;
  const watch = names.flatMap((n) => (byModel[n].watch || []).map((w) => `<li><b>${esc(w.selection)}</b> <span class="mk">${esc(w.market)}</span> — ${esc(w.why)} <i>(${esc(n)})</i></li>`)).join('');
  const passList = [...killed, ...passed].map((p) => `<li><b>${esc(p.selection)}</b> <span class="mk">${esc(p.market)}</span> — ${esc(p.reason)} <i>(${esc(p.stage)})</i></li>`).join('');
  const notes = names.map((n) => `<p><b>${esc(n)}:</b> ${esc(byModel[n].portfolio_notes)}</p>`).join('');
  return `<!doctype html><meta charset="utf-8"><title>NFL Portfolio ${meta.date}</title>
<style>
 body{font:15px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;max-width:920px;margin:24px auto;padding:0 16px;color:#1a1a1a}
 h1{margin:0 0 4px} .sub{color:#666;margin-bottom:20px}
 h2{margin:26px 0 10px;padding-bottom:6px;border-bottom:2px solid #eee}
 .banner{background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:10px 14px;margin:14px 0;font-size:13px}
 .rec{border:1px solid #e5e7eb;border-left-width:4px;border-radius:8px;padding:10px 12px;margin:10px 0;border-left-color:#94a3b8}
 .rec.math{border-left-color:#2563eb} .rec.thesis{border-left-color:#16a34a} .rec.stale_price{border-left-color:#f59e0b}
 .rec.hedge{border-left-color:#8b5cf6} .rec.longshot{border-left-color:#dc2626}
 .rh{display:flex;gap:8px;align-items:center;flex-wrap:wrap} .mk{font-size:11px;background:#eef2ff;color:#3730a3;padding:1px 6px;border-radius:4px}
 .et{font-size:10px;background:#f1f5f9;color:#475569;padding:1px 6px;border-radius:4px;text-transform:uppercase}
 .hr{font-size:11px;color:#b45309}
 .pr{font-weight:600} .tier{font-size:11px;padding:1px 6px;border-radius:4px;background:#e5e7eb;text-transform:uppercase}
 .tier.core{background:#dcfce7} .tier.speculative{background:#fee2e2} .conf{margin-left:auto;color:#666;font-size:12px}
 .meta{color:#666;font-size:12px;margin:3px 0} .mv,.fv{font-size:13px;margin:2px 0} .th{margin:4px 0} .dis{color:#b45309;font-size:13px;margin:3px 0}
 .sk{color:#7c3aed;font-size:12px;margin:3px 0} .rn{color:#0369a1;font-size:12px;margin:3px 0} .ev{color:#64748b;font-size:11px;margin:2px 0}
 .tim{font-size:12px;background:#f8fafc;padding:4px 8px;border-radius:4px;margin-top:4px} .wk{font-size:12px;color:#4338ca;margin-top:3px}
 .unresolved{color:#b91c1c;font-weight:600}
 li{margin:5px 0}
</style>
<h1>NFL Futures Portfolio — Analyst Committee</h1>
<div class="sub">${meta.date} · models: ${esc(names.join(' + '))} · season ${esc(meta.season)}${meta.committee_ran === false ? ' · <b>committee skipped (stage 1 only)</b>' : ''}</div>
<div class="banner"><b>Decision support only.</b> These are model proposals for your review — not instructions to bet. Sizing and whether to play at all are your call. Every play lists its strongest disconfirming factor and (once through the committee) a Skeptic verdict; read both first.</div>
${section('Strongest math edge', ranked.math_edge, 'None.')}
${section('Strongest thesis edge', ranked.thesis_edge, 'None tagged thesis-driven.')}
${section('Strongest stale-price edge', ranked.stale_price_edge, 'None tagged stale-price.')}
${section('Best low-correlation portfolio adds', ranked.low_correlation_adds, 'None.')}
${section('Longshots (high risk / high upside)', ranked.longshots, 'None.')}
<h2>Passed / killed (${passed.length + killed.length})</h2><ul>${passList || '<li>None.</li>'}</ul>
<h2>Watch list</h2><ul>${watch || '<li>None.</li>'}</ul>
<h2>Construction notes</h2>${notes}`;
}
function renderMD(ranked, passed, killed, byModel, meta) {
  const names = Object.keys(byModel);
  const line = (r) => `- [${(r.type || '?').toUpperCase()}/${(r.edge_type || '?').toUpperCase()}] **${r.selection}** (${r.market}) ${r.price}@${r.book} · ${r.stake_tier} · conf ${r.confidence} · edge ${r.edge_pct}%${r.knowledge_based ? ' · ⚑knowledge' : ''}${r.needs_human_review ? ' · 👤review' : ''}${r.bet_threshold ? ` · threshold ${r.bet_threshold}` : ''}\n${r.market_view ? `  - Market: ${r.market_view}\n` : ''}${r.football_view ? `  - Football: ${r.football_view}\n` : ''}  - ${r.thesis}\n  - ⚠ ${r.disconfirming_factor}${r.skeptic_note ? `\n  - 🕵 Skeptic (${r.skeptic_verdict}): ${r.skeptic_note}` : ''}${r.risk_note ? `\n  - ⚖ Risk: ${r.risk_note}` : ''}${r.evidence_resolved?.length ? `\n  - 🔗 ${r.evidence_resolved.map((e) => `${e.id}${e.resolved ? `=${JSON.stringify(e.value)}` : ' (unresolved)'}`).join(', ')}` : (r.evidence_ids?.length ? `\n  - 🔗 ${r.evidence_ids.join(', ')} (unresolved — no dossier row match)` : '')}${r.sources?.length ? `\n  - 📣 sources: ${r.sources.join(', ')}` : ''}\n  - timing: **${r.timing?.action}**${r.timing?.trigger ? ` — ${r.timing.trigger}` : ''}${r.timing?.expected_move ? ` (${r.timing.expected_move})` : ''}`;
  const section = (title, list) => {
    const L = [`## ${title} (${list.length})`];
    if (!list.length) L.push('None.');
    for (const r of list) L.push(line(r));
    L.push('');
    return L;
  };
  const L = [`# NFL Futures Portfolio (Analyst Committee) — ${meta.date}`, '', `Models: ${names.join(' + ')} · season ${meta.season}`, '',
    '> Decision support only — proposals for review, not instructions to bet.', ''];
  L.push(...section('Strongest math edge', ranked.math_edge));
  L.push(...section('Strongest thesis edge', ranked.thesis_edge));
  L.push(...section('Strongest stale-price edge', ranked.stale_price_edge));
  L.push(...section('Best low-correlation portfolio adds', ranked.low_correlation_adds));
  L.push(...section('Longshots', ranked.longshots));
  L.push(`## Passed / killed (${passed.length + killed.length})`);
  for (const p of [...killed, ...passed]) L.push(`- **${p.selection}** (${p.market}) — ${p.reason} _(${p.stage})_`);
  L.push('', '## Construction notes');
  for (const n of names) L.push(`**${n}:** ${byModel[n].portfolio_notes || ''}`);
  return L.join('\n');
}

// ── persistence (backtesting foundation) ───────────────────────────────────────
// Logs the final book to Supabase (migration 042, extended by 043 with run_id)
// so results can eventually be graded — see docs/FUTURES_AGENT_DATA_INVENTORY
// doc for what's built vs. deferred. Non-fatal: local .html/.md/.raw.json
// always get written regardless of whether this succeeds, so a missing/blocked
// Supabase connection never loses the run's output.
//
// 2026-07-22 follow-up (Codex review — backtesting log completeness): the
// original unique(run_date, key) constraint meant a second same-day run
// silently overwrote the first. Migration 043 adds run_id (one per invocation,
// meta.run_id below) and repoints the uniqueness to (run_id, key), so re-runs
// on the same date no longer clobber each other.
async function persistRecommendations(final, meta) {
  if (NO_PERSIST) { console.log('   (persistence skipped: --no-persist)'); return; }
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SB_URL || !SB_KEY) { console.log('   (persistence skipped: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set)'); return; }
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });
    const rows = final.map((r) => ({
      run_id: meta.run_id, run_date: meta.date, season: meta.season, key: r.key, market: r.market, selection: r.selection,
      edge_type: r.edge_type || null, type: r.type || null, book: r.book || null, price: r.price ?? null,
      model_fair_prob: r.model_fair_prob ?? null, edge_pct: r.edge_pct ?? null, confidence: r.confidence ?? null,
      stake_tier: r.stake_tier || null, knowledge_based: !!r.knowledge_based,
      thesis: r.thesis || null, disconfirming_factor: r.disconfirming_factor || null,
      market_view: r.market_view || null, football_view: r.football_view || null,
      skeptic_note: r.skeptic_note || null, skeptic_verdict: r.skeptic_verdict || null,
      bet_threshold: r.bet_threshold || null, needs_human_review: !!r.needs_human_review,
      sources: r.sources || [], evidence_ids: r.evidence_ids || [],
      timing: r.timing || null, correlated_week1: r.correlated_week1 || null,
      models: r.agreement || null, status: 'pending',
    }));
    const { error } = await sb.from('futures_recommendations').upsert(rows, { onConflict: 'run_id,key' });
    if (error) throw new Error(error.message);
    console.log(`   ✅ persisted ${rows.length} recommendations to futures_recommendations (run_id=${meta.run_id})`);
  } catch (e) {
    console.warn(`   ⚠ persistence failed (local files still written): ${e.message}`);
  }
}

// 2026-07-22 follow-up (Codex review — backtesting log completeness, item #3):
// futures_recommendations only ever held the FINAL book — everything the
// committee/validator rejected disappeared once the run's .raw.json aged out of
// attention. futures_recommendation_runs (migration 043) persists EVERY
// candidate at EVERY stage — stage1 proposal, skeptic kill, risk/editor pass,
// validator invalidation, and final survivor — one row each, tagged by stage,
// so the full reasoning trail (including what got killed and why) is queryable
// later, not just what made the final cut. Non-fatal, same pattern as above.
async function persistRecommendationRuns(meta, trail) {
  if (NO_PERSIST) return;
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SB_URL || !SB_KEY) return;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });
    const rowFor = (c, stage, reason) => ({
      run_id: meta.run_id, run_date: meta.date, season: meta.season, stage, key: c.key,
      market: c.market || null, selection: c.selection || null, edge_type: c.edge_type || null,
      price: c.price ?? null, book: c.book || null, model_fair_prob: c.model_fair_prob ?? null,
      edge_pct: c.edge_pct ?? null, confidence: c.confidence ?? null,
      reason: reason || null, models: c.agreement || null, payload: c,
    });
    const rows = [
      ...(trail.stage1 || []).map((c) => rowFor(c, 'stage1_candidate', null)),
      ...(trail.killed || []).map((c) => rowFor(c, 'skeptic_killed', c.reason)),
      ...(trail.passed || []).map((c) => rowFor(c, c.stage === 'validator' ? 'validator_invalidated' : 'risk_passed', c.reason)),
      ...(trail.final || []).map((c) => rowFor(c, 'final', null)),
    ];
    if (!rows.length) return;
    const { error } = await sb.from('futures_recommendation_runs').insert(rows);
    if (error) throw new Error(error.message);
    console.log(`   ✅ persisted ${rows.length} candidate-trail rows to futures_recommendation_runs (run_id=${meta.run_id})`);
  } catch (e) {
    console.warn(`   ⚠ candidate-trail persistence failed (local files still written): ${e.message}`);
  }
}

// ── main ─────────────────────────────────────────────────────────────────────
(async () => {
  const dossier = JSON.parse(await readFile(DOSSIER, 'utf8'));
  const userContent = buildUserPrompt(dossier);
  const models = ONLY ? MODELS.filter((m) => m.includes(ONLY)) : MODELS;
  console.log(`🧠 Stage 1 (Market+Football Analyst) with: ${models.join(' + ')}`);

  const byModel = {}; const raw = {};
  for (const model of models) {
    try {
      const { text, usage } = await callModel(model, SYSTEM_PROMPT, userContent);
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

  const { candidates } = mergeStage1(byModel);
  console.log(`   merged: ${candidates.length} unique candidates across ${ok.length} model(s)`);

  const meta = { date: new Date().toISOString().slice(0, 10), season: dossier.meta.season, committee_ran: !SKIP_COMMITTEE, run_id: randomUUID() };
  let final = candidates, passed = [], killed = [];
  const raw2 = {};

  if (SKIP_COMMITTEE) {
    console.log('   (committee skipped: --skip-committee — stage 1 candidates used as-is)');
  } else {
    console.log(`🕵 Stage 2 (Skeptic) with: ${SKEPTIC_MODEL}`);
    try {
      const { text } = await callModel(SKEPTIC_MODEL, SKEPTIC_SYSTEM_PROMPT, buildSkepticUserPrompt(candidates));
      raw2.skeptic = text;
      const { verdicts } = parseJSON(text);
      const applied = applySkepticVerdicts(candidates, verdicts);
      console.log(`   skeptic: ${applied.survivors.length} survive, ${applied.killed.length} killed`);
      killed = applied.killed;

      console.log(`⚖ Stage 3 (Risk/Portfolio + Editor) with: ${RISK_MODEL}`);
      const { text: riskText } = await callModel(RISK_MODEL, RISK_EDITOR_SYSTEM_PROMPT, buildRiskEditorUserPrompt(applied.survivors));
      raw2.risk_editor = riskText;
      const riskOutput = parseJSON(riskText);
      const applied2 = applyRiskEditor(applied.survivors, riskOutput);
      final = applied2.final; passed = applied2.passed;
      console.log(`   risk/editor: ${final.length} final, ${passed.length} passed`);
      byModel.__committee_notes = riskOutput.portfolio_notes || null;
    } catch (e) {
      console.error(`   ✖ committee pass failed, falling back to stage-1 candidates as-is: ${e.message}`);
      meta.committee_ran = false;
    }
  }

  // Code-owned validation (2026-07-22 follow-up, Codex review #1 priority) — runs
  // after the committee, before ranking. Recomputes edge_pct, checks book/price
  // against the dossier, resolves evidence_ids, and pulls hard-invalid candidates
  // (fabricated market/selection/book/price) into their own list instead of
  // letting them ride silently into the final book.
  console.log(`🔍 Validating ${final.length} final candidate(s) against dossier ground truth`);
  const validated = final.map((c) => validateRecommendation(c, dossier));
  const invalidated = validated
    .filter((v) => v.status === 'invalid')
    .map((v) => ({ ...v.candidate, reason: v.reason, stage: 'validator' }));
  final = validated.filter((v) => v.status !== 'invalid').map((v) => v.candidate);
  console.log(`   validator: ${final.length} valid (${validated.filter((v) => v.status === 'flagged').length} flagged for human review), ${invalidated.length} invalidated`);
  passed = [...passed, ...invalidated];

  const ranked = rankByAxis(final);
  await mkdir(OUT_DIR, { recursive: true });
  const base = path.join(OUT_DIR, `portfolio-${meta.date}`);
  await writeFile(`${base}.html`, renderHTML(ranked, passed, killed, byModel, meta));
  await writeFile(`${base}.md`, renderMD(ranked, passed, killed, byModel, meta));
  await writeFile(`${base}.raw.json`, JSON.stringify({ meta, models: ok, raw, stage2_3: raw2, candidates, final, passed, killed }, null, 2));
  await persistRecommendations(final, meta);
  await persistRecommendationRuns(meta, { stage1: candidates, killed, passed, final });
  console.log(`\n✅ ${base}.html`);
  console.log(`✅ ${base}.md`);
  console.log(`   final book: ${final.length} · passed/killed: ${passed.length + killed.length}`);
  console.log(`   open: Start-Process "${base}.html"`);
})().catch((e) => { console.error('✖', e.message); process.exitCode = 1; });
