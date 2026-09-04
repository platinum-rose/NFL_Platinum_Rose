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
// VAULT REFERENCE BRIDGE (2026-09-01, DATA-LAYER-LOCKDOWN item 3): also pulls
// two things from Supabase vault_notes that never otherwise reach the
// committee -- hand-curated static reference guides (coaching tendencies,
// DVOA/EPA glossary, key numbers, ATS framework) as top-level prompt context,
// and per-team "Analytical Deep-Reads" (narrative article summaries) attached
// to each team's profile. Both are best-effort: skipped silently if
// SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY aren't set. See
// loadVaultReferenceEvidence() for what's deliberately excluded and why
// (raw stat-import files, duplicate injury data, stale season archives).
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
//     [--primary "Buffalo Bills,Green Bay Packers"] [--out-suffix scenario-v2]
//     [--proposal-out-dir data/official-picks/proposals]
//     [--run-instructions <handoff.md>] [--supplemental-context <local-context.json>]
//     [--prompt-only] [--prompt-out <local-preview.json>]
//     [--reasoning-effort max] [--reasoning-mode pro] [--max-output-tokens 32000]
//     [--model-timeout-ms 900000]
//   GPT-4o fallback (funded OpenAI key) — get a portfolio without Anthropic credits:
//     node agents/portfolio-synthesize.js --models gpt-4o --dossier <path>
//   Quick single-pass (no Skeptic/Risk calls, original S274 behavior):
//     node agents/portfolio-synthesize.js --dossier <path> --skip-committee
//
// Env: ANTHROPIC_API_KEY and/or OPENAI_API_KEY (required). SUPABASE_URL +
//      SUPABASE_SERVICE_ROLE_KEY (optional, enables persistence). All from .env.
//      Models starting gpt-/o1-/o3- route to OpenAI; everything else to Anthropic.
//
// SCENARIO BOOK / PLAYOFF HEDGE MAP (2026-07-22, Andy's own portfolio-
// construction strategy): beyond single recommendations, the committee also
// proposes high-odds playoff scenario structures: anchor positions, coverage
// baskets around long-odds matchup combinations, same-team ladders where early
// legs fund later option bets, and playoff hedge plans once real matchups are
// known. The model only proposes WHICH legs and WHY; ladderMath()/
// hedgeBasketMath() (code, relative "units" not dollars, same stake_tier
// convention as everything else) compute numbers from REAL dossier prices,
// never the model's own math -- same discipline as validateRecommendation().
// ═══════════════════════════════════════════════════════════════════════════════

import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { NFL_TEAMS, normalizeTeam } from '../src/lib/teams.js';
import { placeableVenuesPromptSentence } from '../src/lib/executionVenues.js';
import { validateBoardBatch } from './lib/board-validate.js';
import { extractResumePrompt } from './lib/portfolio-local-inputs.js';
import { DEFAULT_LANE_MAX_AGE_DAYS, checkDossierFreshness, collectEvidenceLaneStats, synthesisPreflightDecision } from '../scripts/lib/dossier-freshness-gate.js';
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
const OUT_SUFFIX = getArg('--out-suffix', '').trim();
// Analyst committee (2026-07-22 follow-up): stage 1 (Market+Football Analyst,
// the original A/B call above) -> stage 2 Skeptic -> stage 3 Risk/Editor.
// --skip-committee falls back to the original single-pass behavior (cheaper/
// faster; use when you just want a quick look). --skeptic-model/--risk-model
// default to the first stage-1 model so a single-model run needs no new flags.
const SKIP_COMMITTEE = argv.includes('--skip-committee');
const NO_PERSIST = argv.includes('--no-persist');
// 2026-08-13: preflight gate against scripts/lib/dossier-freshness-gate.js —
// refuses to run a synthesis against a dossier whose evidence has moved on
// since it was built (exactly the dossier-2026-08-11.json failure mode). Set
// --allow-stale-dossier only with a documented reason; this should not
// become a routine override.
const ALLOW_STALE_DOSSIER = argv.includes('--allow-stale-dossier');
// 2026-08-13 Codex review fix (finding #3): missing evidence lanes and an
// unknown freshness state used to only warn, never block. Each failure class
// now needs its own explicit override — a single broad override was flagged
// in review as too permissive for three genuinely different risk classes.
const ALLOW_MISSING_EVIDENCE_LANES = argv.includes('--allow-missing-evidence-lanes');
const ALLOW_UNKNOWN_DOSSIER_FRESHNESS = argv.includes('--allow-unknown-dossier-freshness');
// 2026-09-04 Tier-3 fix: the freshness gate was drift-only, so a lane stale
// since before the dossier was even built never surfaces (see
// scripts/lib/dossier-freshness-gate.js's DEFAULT_LANE_MAX_AGE_DAYS). Opt-in
// per-lane absolute-age check; --allow-expired-evidence-lanes overrides it
// the same way the other three classes are overridden.
const ALLOW_EXPIRED_EVIDENCE_LANES = argv.includes('--allow-expired-evidence-lanes');
// 2026-09-03 fix (Andy, trust audit): scripts/build-intel-source-audit-report.js
// already sweeps every intel source (odds books, prediction markets, article
// evidence, training camp, player availability, ...) and knows how to mark a
// source BLOCKED or STALE - but nothing ever consulted it before a committee
// run. The 2026-09-02 run went out with two hard-BLOCKED sources (prediction-
// market integrity, article evidence integrity) and 7 STALE sources (including
// the exact BetOnline/Bookmaker/BetUS staleness this whole investigation
// started from) and had no way to know any of it, because this check simply
// didn't exist. This has no narrow per-class override like the dossier-
// freshness flags above - full intel integrity is a precondition for every
// run, not a per-lane judgment call. --allow-blocked-intel exists only as a
// documented, loud, last-resort escape hatch (e.g. the audit tool itself is
// down) - it is not a routine flag.
const ALLOW_BLOCKED_INTEL = argv.includes('--allow-blocked-intel');
const SKIP_INTEL_AUDIT = argv.includes('--skip-intel-audit'); // --prompt-only/offline dev iteration only
const SHADOW_SLIM = argv.includes('--shadow-slim');
const SKEPTIC_MODEL = getArg('--skeptic-model', MODELS[0]);
const RISK_MODEL = getArg('--risk-model', MODELS[0]);
const LEDGER_PATH = getArg('--ledger', path.join(ROOT, 'data', 'futures-imports', 'andy-portfolio-ledger-2026.json'));
const WATCHLIST_PATH = getArg('--watchlist', path.join(ROOT, 'data', 'futures-imports', 'futures-watchlist-2026.json'));
const OFFICIAL_CONFIG_PATH = getArg('--official-config', path.join(ROOT, 'data', 'futures-imports', 'platinum-rose-ai-official-2026.json'));
const EXPERT_DOSSIER_INDEX_PATH = getArg('--expert-dossiers', path.join(ROOT, 'data', 'expert-dossiers', 'latest.json'));
const PROPOSAL_OUT_DIR = getArg('--proposal-out-dir', null);
const RUN_INSTRUCTIONS_PATH = getArg('--run-instructions', null);
const SUPPLEMENTAL_CONTEXT_PATH = getArg('--supplemental-context', null);
const PROMPT_ONLY = argv.includes('--prompt-only');
const PROMPT_OUT_PATH = getArg('--prompt-out', path.join(OUT_DIR, 'prompt-preview.json'));
const REASONING_EFFORT = getArg('--reasoning-effort', null);
const REASONING_MODE = getArg('--reasoning-mode', null);
// 2026-09-03 fix (Andy, post-committee-run review): claude-fable-5 truncated
// mid-JSON-array on the 2026-09-02 run - hit exactly 16000 out-tokens (the old
// default cap) and got cut off at position 12750/line 163, producing an
// unparseable partial array. claude-opus-4-8 finished the SAME task in 10041
// tokens on that run, so this wasn't a task-shape problem, just insufficient
// headroom for Fable's more verbose completions. Raised default with real
// margin above what's actually been needed so far.
const MAX_OUTPUT_TOKENS = parseInt(getArg('--max-output-tokens', '24000'), 10);
const MODEL_TIMEOUT_MS = parseInt(getArg('--model-timeout-ms', '300000'), 10);
// 2026-07-22 follow-up (Andy's own portfolio-construction strategy, not a Codex
// finding): his "primary" positions -- teams/markets he already has core
// conviction on (e.g. Bills, Packers) -- inform hedge-basket construction
// (baskets should hedge AGAINST these, not duplicate them) and give the
// committee context on what's already core exposure. Comma-separated team
// names; empty is fine (committee can still propose ladders on its own reads).
const PRIMARY = getArg('--primary', '').split(',').map((s) => s.trim()).filter(Boolean);
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!DOSSIER) { console.error('✖ pass --dossier <path to dossier-*.json>'); process.exit(1); }
if (!ANTHROPIC_KEY && !OPENAI_KEY) { console.error('✖ Need ANTHROPIC_API_KEY or OPENAI_API_KEY in .env'); process.exit(1); }
const isOpenAI = (m) => /^(gpt|o[13])/i.test(m); // route gpt-4o / o1 / o3 to OpenAI, else Anthropic
const usesResponsesApi = (m) => /^gpt-5\.6-sol$/i.test(m);

const SYSTEM_PROMPT = `You are a sharp NFL futures + betting-market analyst producing a REVIEWABLE portfolio for a human bettor who makes all final decisions. You are decision support, not an instruction to bet. Be calibrated and skeptical, never promotional — but your job is to MINE the entire market for edge, not rubber-stamp favorites.

DOSSIER (your price/odds ground truth): for each futures market/team you get the vig-stripped fair probability (median across books), the best available price AT A PLACEABLE BOOK + which book holds it (FanDuel/DraftKings are excluded from best-price — the user can't bet them; win-total rows also carry best_over/best_under + their books), value_gap (fair_prob minus best-price implied prob; positive = the backer gets a better number than fair), cross-book divergence, per-book line movement (move_prob, positive = shortened/steamed), and a per-market LEAN from normalized intel: n = number of intel signals, with back/fade counts (outrights) or over/under counts (win totals) and avg_strength (0..1). A team can be "superbowl back" yet "wins under" — leans are PER-MARKET. Each lean sample carries 'who' (the analyst/outlet that said it), and the dossier's 'experts' map lists what each named analyst likes. Each team's profile (see TEAM PROFILES below) also carries 'prior' — recent-season W-L / ATS records — use this to GROUND bounce-back theses in fact (a team that was e.g. "2025: 5-12" on injuries is a concrete regression candidate, not a guess). Most team profiles also carry 'sos' — strength of schedule computed from the ACTUAL 2026 schedule: sos.market = average opponent 2026 win-total line (LOWER = softer slate = tailwind for a win-total OVER / bounce-back / division long; HIGHER = gauntlet), sos.market_rank (1 = hardest, 32 = easiest), sos.prior = average opponent prior-year win% (classic backward-looking cross-check), plus home/away game counts. Prefer this over your own memory of who a team plays — the schedule is real and current; your recall of the 2026 slate may be wrong. adjacent_signals holds game-level and prop leans per team (Week-1 correlation + hedge fuel).

TEAM PROFILES (2026-07-22 live-run fix — schema change from the original design): the four season-aggregate signals below, plus 'prior' and 'sos', are NOT inlined on every market row anymore — the first real run of this pipeline blew past every model's context window (310K tokens vs gpt-4o's 128K) because the original design copied this whole blob onto ~740 rows across up to 11 markets per team. They now live ONCE per team in the top-level TEAM PROFILES map below, keyed by team name. Each market row still carries either a bare 'team_nick' (single-team markets — look up dossier.team_profiles[team_nick]) or 'team_a'/'team_b' (the superbowl_matchup market, which pairs two teams — look up each side separately). A market row's own fields (fair_prob, best_price, value_gap, moves, consensus_line, etc.) stay exactly as described below; only the team-context signals moved. When citing evidence_ids for a team-context field (e.g. 'analytics.off_epa_rank'), that citation is checked against the row's matched team profile, not the row itself — cite it the same way regardless.

Each team profile carries season-aggregate signals, all optional — a null/zero-count signal means "not enough data yet", not "no edge here", especially early in the season:
- 'analytics' — current-season EPA/play (off/def) with league rank (1=best), EPA per dropback / QB EPA per dropback when populated, success rate, CPOE, explosive rate, pressure/sack profile, and formation tendencies (shotgun/no-huddle/pass rate), from real play-by-play/imported analytic snapshots rather than box scores. Use to CONFIRM or CHALLENGE a record-based thesis (e.g. a team that's 6-1 but def_epa_rank 28 is a regression-down candidate; a 2-5 team with off_epa_rank 8 is a bad-variance bounce-back candidate, not a bad team).
- 'dvoa' — source-stamped imported DVOA snapshot. Treat it as an imported analytic opinion with source/date/attribution, not as a locally computed metric. Cite the specific DVOA rank/value when it supports or contradicts EPA/price.
- 'coaching_profile' — structured coaching tendency snapshot (coach/coordinator continuity, fourth-down tier, neutral/early-down pass rate, play-action/motion/no-huddle/pace, red-zone and two-minute tendencies). It can evolve during the season; cite sample dates/games when using it, and flag stale_after or thin samples.
- 'schedule_context' — games/short_rest_games/avg_rest/div_games for the team's OWN 2026 slate (distinct from sos, which is about opponent quality). A high short_rest_games count is a real tailwind for UNDER/fade theses late in a stretch; treat rest_known < games as partial-season coverage.
- 'officiating_context' — games_with_ref/avg_total_points/avg_total_penalties, averaged across the specific referees already assigned to this team's known games. Ties are USUALLY 0 games early in a season (refs aren't assigned until close to kickoff) — only use this when games_with_ref is meaningfully >0, and always cite its own 'confidence' field ("very low" samples should never carry a thesis alone).
- 'clv_signal' — n_tracked/avg_closing_move_toward_team (positive = the line has been closing MORE in this team's favor than this app's own tracked-open number) plus sharp_lean_games/public_fade_games from betting-splits divergence (money% vs ticket%). A team with several sharp_lean_games and a positive avg_closing_move is a real "the smart market likes this team" signal, distinct from and complementary to your own analytics-based read — cite it as market behavior, not your own opinion.
- 'prediction_markets' (2026-09-04, new) — Kalshi contract-implied probabilities, a SEPARATE market from the sportsbooks the rest of the dossier prices off: 'playoff_prob'/'division_win_prob'/'conference_champ_prob' (0-1) and 'market_implied_win_total' (interpolated from the win-totals ladder in 'win_totals_ladder', not the sportsbook wins row). Treat agreement with the sportsbook price as corroboration, and a meaningful DIVERGENCE between market_implied_win_total and the dossier's own wins-market consensus_line as its own tradeable signal (worth naming explicitly, not averaged away) — Kalshi is a thinner, differently-incentivized market and can lead or lag the books. Snapshot can run stale (check 'snapshot_at'); a null field here means this team just isn't covered by the current contract set, not zero probability.
Separately, the top-level dossier.roster_churn map (not per-market — one entry per team) holds the LATEST week-over-week roster diff: adds/drops/status_changes counts between the two most-recent nflverse roster snapshots. High churn (especially drops/status_changes on a short list) is a real instability signal for win-total unders or fading a division favorite — but it is a raw personnel-movement count, not itself injury-specific, so treat it as a prompt to dig further, not a standalone thesis.

WIN-TOTAL MATH (2026-07-22 fix — previously wins rows had NO code-owned fair probability or edge at all; use these now instead of eyeballing the raw price): each wins row carries 'over_fair_prob'/'under_fair_prob' — a vig-stripped fair probability computed ONLY from books that share the SAME line as the best price (never mixed across lines — an Over 8.5 -105 and an Over 9.5 +120 are NOT the same bet and are never blended) — plus 'best_over_edge_pct'/'best_under_edge_pct' computed directly from that fair prob against the best placeable price, and 'line_consensus_confidence' (over_n_books/under_n_books — how many books actually agree at that specific line; treat a 1-book confidence figure as much weaker than a 4-book one). 'line_value_signal' flags when books disagree on the line itself (>0.5 spread) — treat consensus_line/edge loosely when that fires. Use best_over_edge_pct/best_under_edge_pct as your primary win-total edge signal, not vibes off the raw price.

INJURIES AND PLAYER AVAILABILITY: each team profile carries 'injuries' when available — injury_count, key_position_flags, qb_status, and freshness. It can also carry 'player_availability' from the local availability snapshot: key_returns, key_absences, snap_count_risks, offensive_line_risks, defensive_front_risks, cluster_risks, improving/worsening counts, and review flags. Offensive-line cluster injuries can impair that team's offense, scoring, QB efficiency, and win-total overs. Defensive-front cluster injuries have a reciprocal effect: they may improve the opponent's offensive environment, scoring, rushing/passing efficiency, QB props, and game-total paths. Any thesis that leans on roster health, players returning from injury, snap-count restrictions, PUP/IR timing, setbacks, OL attrition, or defensive-front attrition MUST cite injuries/player_availability or set needs_human_review=true. Do not assume health status from memory when these fields are present and contradict it. NAMED-PLAYER SIZING GATE (2026-08-13): if a team profile carries a non-null named_player_sizing_gate (e.g. an unresolved injury/role status or a disputed team assignment for a specific named player — check its players/reasons fields), that team has at least one fact still under active human review. You may still propose a play on that team, but stake_tier MUST be small or speculative, never core or standard, until the gate clears — this is enforced mechanically after your output (a core/standard stake on a gated team will be flagged), so treat it as a hard cap, not a suggestion.

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
- OFFICIAL PAPER TRACKING: if a Platinum Rose AI official tracking contract is supplied, use its bankrolls, unit sizes, cutoff, stake tiers, and market holds when proposing sizes. Do not mark a play official yourself; every output is a proposal until the human verifies the price/source and approves official paper tracking.
- ${placeableVenuesPromptSentence()}
- A real edge needs a REASON the market is wrong (anchoring to last year, injury misread, soft schedule, stale line, EPA/record divergence, roster churn, sharp CLV move), not just a positive value_gap (which can be juice or a book error). Cross-reference divergence, movement, and lean.
- SMALL-SAMPLE SIGNALS: 'officiating_context' and 'clv_signal' are built from very few games early in a season — never let either one carry a thesis alone (check games_with_ref / n_tracked and the officiating confidence field first); they should corroborate a thesis already grounded in analytics/sos/lean, not originate one on their own until sample sizes grow.
- Every recommendation MUST include its single strongest DISCONFIRMING factor — the best reason NOT to bet it. A play with no honest counter-case is not ready.
- Size to conviction AND variance: favorites/value can be core|standard; longshots are small|speculative (convex, low hit-rate). Stake tiers are relative only, never dollars.
- Cap the CORE book at ~${MAX_PLAYS}, but a longer tail of small longshot/hedge plays is welcome — breadth is fine when the tickets are cheap and convex.

HEDGE BASKETS & PARLAY LADDERS (2026-07-22 addition — beyond single recommendations, propose these two portfolio-construction structures when the dossier supports them; do NOT force either if nothing fits):
- HEDGE BASKET / COVERAGE BETS: if the human's primary positions are given below (a short list of teams they already hold core conviction on), propose a "roulette basket" — several small stakes on superbowl_matchup pairings involving OTHER teams with real deep-run probability (grounded in fair_prob/analytics/sos from their team profiles, not vibes), specifically teams NOT in the primary list. The point is variance insurance if the primary picks miss, not a standalone edge claim — spread coverage across several plausible pairings rather than concentrating. If no primary positions are given, you may still propose a basket around the market's own best-priced deep-run contenders, but say so.
- PARLAY LADDER / LADDER BETS: for a SINGLE team with a real, growing thesis across multiple correlated markets in natural resolution order (win-total settles first, then playoffs, then conference, then Super Bowl), propose a sequenced stack where an earlier leg's win could fund a later leg's stake — i.e., name the team and the ordered legs (each an existing market+selection from the dossier), and give ONE thesis for why this specific team supports a multi-stage stack (e.g. real record-vs-analytics divergence, a soft schedule, a personnel upgrade) — not just "would be nice if it worked."
- PLAYOFF HEDGE PLAN / POCKET HEDGES: propose a few trigger-based hedge actions that happen LATER, once real playoff matchups are known (e.g. "if Bills reach AFC title game against Ravens, price Ravens ML/conference hedge using reserved ladder profit"). These are NOT current bets and do not need dossier price resolution; they are future decision rules with trigger/action/reserved_bankroll.
- ROLE TAXONOMY: use the terms anchor_bet (primary conviction), ladder_bet (early leg funds later leg), coverage_bet (covers a playoff path or matchup branch), option_bet (long-odds ticket bought mainly for later hedge value), pocket_hedge (future playoff bet reserved against an existing ticket), dead_cost (unrecovered cost if legs fail), and funded_liability (later stake paid by earlier wins).
- For BOTH: only cite markets/selections that exist in the dossier (code resolves the real price — you do not need to compute payouts or liability yourself, that's handled after your response).

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
  "hedge_baskets": [
    {
      "primary_hedged_against": ["<team names from the primary list this basket insures, if any>"],
      "thesis": "<=2 sentences on why this spread of longshots is the right insurance",
      "legs": [ { "market": "superbowl_matchup|...", "selection": "<team A vs team B, or other combo selection text>" } ]
    }
  ],
  "parlay_ladders": [
    {
      "team": "<the one team this whole stack is about>",
      "thesis": "<=2 sentences on why THIS team supports a multi-stage stack>",
      "legs": [ { "market": "wins|playoffs|conference_afc|superbowl|...", "selection": "<selection text, ordered earliest-resolving first>", "role": "funding_leg|option_bet" } ]
    }
  ],
  "portfolio_strategy": {
    "strategy_type": "playoff_scenario_book",
    "anchor_positions": ["<primary/core positions, if any>"],
    "coverage_positions": ["<long-odds exacta/matchup coverage tickets>"],
    "ladder_stacks": [
      {
        "team": "<team>",
        "steps": [ { "bet": "<market + selection>", "role": "funding_leg|option_bet" } ],
        "intent": "<how earlier legs fund or lower liability on later legs>"
      }
    ],
    "playoff_hedge_plan": [
      {
        "trigger": "<future playoff condition>",
        "action": "<what to price or bet once that condition is known>",
        "reserved_bankroll": "<pocket stake, ladder winnings, or preassigned reserve>"
      }
    ]
  },
  "portfolio_notes": "<=4 sentences on overall construction, correlation clusters, and coverage gaps"
}`;

async function loadLedger() {
  try {
    return JSON.parse(await readFile(LEDGER_PATH, 'utf8'));
  } catch (e) {
    console.warn(`   ledger unavailable (${LEDGER_PATH}): ${e.message}`);
    return null;
  }
}

async function loadWatchlist() {
  try {
    const parsed = JSON.parse(await readFile(WATCHLIST_PATH, 'utf8'));
    const items = Array.isArray(parsed) ? parsed : parsed.items;
    if (!Array.isArray(items)) throw new Error('expected an array or { items: [...] }');
    return Array.isArray(parsed) ? { items } : { ...parsed, items };
  } catch (e) {
    console.warn(`   watchlist unavailable (${WATCHLIST_PATH}): ${e.message}`);
    return null;
  }
}

async function loadOfficialConfig() {
  try {
    return JSON.parse(await readFile(OFFICIAL_CONFIG_PATH, 'utf8'));
  } catch (e) {
    console.warn(`   official config unavailable (${OFFICIAL_CONFIG_PATH}): ${e.message}`);
    return null;
  }
}

async function loadRunInstructions() {
  if (!RUN_INSTRUCTIONS_PATH) return '';
  const markdown = await readFile(path.resolve(ROOT, RUN_INSTRUCTIONS_PATH), 'utf8');
  return extractResumePrompt(markdown);
}

async function loadSupplementalContext() {
  if (!SUPPLEMENTAL_CONTEXT_PATH) return null;
  return JSON.parse(await readFile(path.resolve(ROOT, SUPPLEMENTAL_CONTEXT_PATH), 'utf8'));
}

async function loadExpertDossiers() {
  try {
    const index = JSON.parse(await readFile(EXPERT_DOSSIER_INDEX_PATH, 'utf8'));
    const dossiers = [];
    for (const row of index.dossiers || []) {
      if (!row.path) continue;
      const full = JSON.parse(await readFile(path.join(ROOT, row.path), 'utf8'));
      dossiers.push({
        expert: full.expert,
        source_coverage: full.source_coverage,
        host_citation_profile: {
          sentiment_counts: full.host_citation_profile?.sentiment_counts || {},
          top_teams: full.host_citation_profile?.top_teams || [],
          top_markets: full.host_citation_profile?.top_markets || []
        },
        tendency_signals: (full.tendency_signals || []).map(signal => ({
          signal_type: signal.signal_type,
          source_lane: signal.source_lane,
          authority: signal.authority,
          requires_manual_review: signal.requires_manual_review,
          topic: signal.topic,
          source_url: signal.source_url,
          timestamp_url: signal.timestamp_url,
          ranks: signal.ranks,
          inference_use: signal.inference_use
        }))
      });
    }
    return {
      schema_version: index.schema_version,
      generated_at: index.generated_at,
      guardrail: index.guardrail,
      dossier_count: dossiers.length,
      dossiers
    };
  } catch (e) {
    console.warn(`   expert dossiers unavailable (${EXPERT_DOSSIER_INDEX_PATH}): ${e.message}`);
    return null;
  }
}

function buildUserPrompt(dossier, ledger = null, watchlist = null, officialConfig = null, expertDossiers = null, runInstructions = '', supplementalContext = null, vaultReferenceDocs = null) {
  const promptDossier = SHADOW_SLIM ? slimDossierForPrompt(dossier) : dossier;
  const m = dossier.meta;
  const sig = m.signal_coverage || {};
  const primaryLine = PRIMARY.length
    ? `YOUR PRIMARY POSITIONS (the human's own core conviction plays — hedge baskets should cover OTHER teams, not these; these are context, not a request to re-recommend them): ${PRIMARY.join(', ')}.\n\n`
    : '';
  const officialLine = officialConfig
    ? `PLATINUM ROSE AI OFFICIAL TRACKING CONTRACT (paper expert rules; proposals only until human verification):\n${JSON.stringify(officialConfig)}\n\n`
    : '';
  const ledgerLine = ledger ? `USER PORTFOLIO LEDGER (authoritative for units, caps, existing tickets, and open-parlay policy; open parlays with eligible_as_required_hedge_resource=false are not guaranteed planning capacity):\n${JSON.stringify(ledger)}\n\n` : '';
  const watchlistLine = watchlist?.items?.length
    ? `HUMAN WATCHLIST TARGETS (explicitly evaluate these markets/teams against the dossier. Do not force a bet: for each target, either recommend it, put it in watch with a timing/price trigger, or pass and say why. Expand "ATB" / across_the_board into the listed markets only; exacta targets should become hedge_basket/coverage candidates only when a matching dossier price exists):\n${JSON.stringify(watchlist)}\n\n`
    : '';
  const expertDossierLine = expertDossiers?.dossiers?.length
    ? `EXPERT DOSSIER CONTEXT (compact analyst-prior/bias signals; use only to interpret named analyst tendencies and possible blind spots. These are NOT price evidence, NOT official-pick support, and local_recovery_context_only signals require manual review):\n${JSON.stringify(expertDossiers)}\n\n`
    : '';
  const runInstructionsLine = runInstructions
    ? `CURRENT RUN INSTRUCTIONS (authoritative portfolio objective, bankroll, status taxonomy, timing requirements, and approval boundaries for this synthesis):\n${runInstructions}\n\n`
    : '';
  const supplementalContextLine = supplementalContext
    ? `SUPPLEMENTAL LOCAL CONTEXT (review/status facts outside the dossier price schema; respect each lane's stated authority and caveats, and never promote context-only or review-only evidence into price authority):\n${JSON.stringify(supplementalContext)}\n\n`
    : '';
  const vaultReferenceLine = vaultReferenceDocs
    ? `HAND-CURATED BETTING REFERENCE GUIDES (static skill-style reference material from the team vault -- coaching tendencies, DVOA/EPA/CPOE glossary + current-season snapshot, key-number distribution, ATS trend framework and current-season records; NOT price evidence and NOT team-specific signal, use only to interpret other evidence):\n${JSON.stringify(vaultReferenceDocs)}\n\n`
    : '';
  return `${runInstructionsLine}${officialLine}${primaryLine}${ledgerLine}${watchlistLine}${expertDossierLine}${supplementalContextLine}${vaultReferenceLine}DOSSIER META: season ${m.season}, ${m.snapshot_count} snapshots, books=${(m.books || []).join(',')}, markets=${(m.market_types || []).join(',')}. Intel: ${JSON.stringify(m.intel_coverage)}.

Offseason note: many markets (division, conference, awards, playoffs, matchup) may have limited or single-book coverage until preseason; weight coverage in your confidence. Super Bowl and win-total markets are the most liquid now — win totals especially are where bounce-back / longshot value tends to hide.

SIGNAL COVERAGE (2026-07-22 follow-up — how many of the 32 teams have each new per-team signal populated so far; low counts early in the season are expected, not a data bug): ${JSON.stringify(sig)}. Each team row below carries 'analytics' (EPA/formation/EPA per dropback when populated), 'dvoa' (source-stamped imported DVOA snapshot), 'coaching_profile' (structured tendencies and coordinator continuity), 'schedule_context' (own rest/travel), 'officiating_context' (assigned-referee tendencies, usually sparse pre-season), and 'clv_signal' (closing-line move + sharp-split divergence) per the field guide in your system prompt — use them where present, and don't treat an absent one as a negative signal, just an unavailable one.

TEAM PROFILES (one entry per team — prior/sos/analytics/dvoa/coaching_profile/schedule_context/officiating_context/clv_signal/injuries, computed ONCE per team; market rows below reference these by 'team_nick', or by 'team_a'/'team_b' for superbowl_matchup pairings):
${JSON.stringify(promptDossier.team_profiles || {})}

SYNTHESIS INPUT (per market, sorted by strongest signal first; lean is per-market with back/fade/over/under counts + avg_strength):
${JSON.stringify(promptDossier.synthesis_input)}

ADJACENT SIGNALS (game-level + prop leans per team — use for Week-1 correlation and hedges):
${JSON.stringify(promptDossier.adjacent_signals || {})}

EXPERTS (named analyst -> their picks, from the normalized intel signals; this is the map SYSTEM_PROMPT tells you to cite sources from):
${JSON.stringify(promptDossier.experts || dossier.experts || {})}

ROSTER CHURN (latest week-over-week nflverse roster diff per team — adds/drops/status_changes; a personnel-instability signal, not itself injury-specific):
${JSON.stringify(promptDossier.roster_churn || {})}

Produce the portfolio JSON per the contract. Deliberately MINE for asymmetric value and bounce-back longshots — name why the market is anchored wrong — not just favorites; build hedges where correlation lets you lock value or cut variance; use the Week-1 timing layer where a near-term result is a price catalyst; and propose hedge_baskets/parlay_ladders plus portfolio_strategy where the dossier genuinely supports a playoff scenario book (do not force any structure).`;
}

function keepKeys(obj, keys) {
  const out = {};
  for (const key of keys) {
    if (obj?.[key] !== undefined) out[key] = obj[key];
  }
  return out;
}

function hasPrimary(row) {
  if (!PRIMARY.length) return false;
  const hay = [row.team, row.team_nick, row.team_a, row.team_b, row.selection].filter(Boolean).join(' ').toLowerCase();
  return PRIMARY.some((p) => hay.includes(p.toLowerCase()) || hay.includes(String(normalizeTeam(p) || '').toLowerCase()));
}

function edgeMagnitude(row) {
  if (row.consensus_line != null) return Math.max(Math.abs(row.best_over_edge_pct ?? 0), Math.abs(row.best_under_edge_pct ?? 0));
  if (row.sim?.gap != null) return Math.abs(row.sim.gap);
  return Math.abs(row.value_gap ?? row.book_divergence ?? 0);
}

// Signed edge (positive = value FOR the bettor), where the row schema supports one.
// null means "no signed-edge concept for this row" (e.g. book_divergence-only rows).
function edgeValue(row) {
  if (row.consensus_line != null) {
    const over = row.best_over_edge_pct;
    const under = row.best_under_edge_pct;
    if (over == null && under == null) return null;
    return Math.max(over ?? -Infinity, under ?? -Infinity);
  }
  if (row.value_gap != null) return row.value_gap;
  if (row.sim?.gap != null) return row.sim.gap;
  return null;
}

// Tier-2 fix: the old version ranked purely by |edge|, so a strong NEGATIVE edge
// (chalk priced short) could bump every genuine positive-edge row out of the slim
// prompt. Positive-edge rows are now always prioritized into the budget first;
// only the leftover slots go to the highest-magnitude remaining rows (chalk, or
// rows with no signed-edge concept at all).
function takeRows(rows, n) {
  const all = [...(rows || [])];
  const positive = all.filter((r) => { const v = edgeValue(r); return v != null && v > 0; });
  const positiveSet = new Set(positive);
  const rest = all.filter((r) => !positiveSet.has(r));
  positive.sort((a, b) => Number(hasPrimary(b)) - Number(hasPrimary(a)) || (edgeValue(b) ?? -Infinity) - (edgeValue(a) ?? -Infinity));
  rest.sort((a, b) => Number(hasPrimary(b)) - Number(hasPrimary(a)) || edgeMagnitude(b) - edgeMagnitude(a));
  const kept = positive.slice(0, n);
  if (kept.length < n) kept.push(...rest.slice(0, n - kept.length));
  return kept;
}

function slimBookMap(books, sideFields = false) {
  return Object.fromEntries(Object.entries(books || {}).map(([book, row]) => [book, sideFields
    ? keepKeys(row, ['line', 'over', 'under', 'fair_over', 'fair_under', 'over_edge', 'under_edge', 'observed_at', 'quote_age_hours', 'availability_status'])
    : keepKeys(row, ['price', 'yes_price', 'no_price', 'fair', 'fair_yes', 'fair_no', 'observed_at', 'quote_age_hours', 'availability_status'])
  ]));
}

function slimMarketRow(row) {
  if (row.consensus_line != null) {
    return {
      ...keepKeys(row, ['team', 'team_nick', 'consensus_line', 'line_spread', 'over_fair_prob', 'under_fair_prob', 'best_over_edge_pct', 'best_under_edge_pct', 'best_over', 'best_over_book', 'best_under', 'best_under_book', 'line_consensus_confidence', 'line_value_signal', 'lean', 'sim_win_total']),
      books: slimBookMap(row.books, true),
    };
  }
  return {
    ...keepKeys(row, ['team', 'team_nick', 'team_a', 'team_b', 'fair_prob', 'fair_american', 'best_price', 'best_book', 'best_prob', 'best_observed_at', 'best_quote_age_hours', 'best_availability_status', 'value_gap', 'book_divergence', 'n_books', 'lean', 'sim']),
    books: row.books ? slimBookMap(row.books, false) : undefined,
  };
}

function slimTeamProfile(profile) {
  return keepKeys(profile, ['team', 'prior', 'sos', 'analytics', 'dvoa', 'coaching_profile', 'schedule_context', 'officiating_context', 'clv_signal', 'injuries', 'player_availability', 'vault_analytical_reads', 'bettorday_trench', 'training_camp_intel', 'named_player_sizing_gate', 'prediction_markets']);
}

function slimDossierForPrompt(dossier) {
  const limits = {
    wins: 32,
    playoffs: 32,
    superbowl: 32,
    conference_afc: 16,
    conference_nfc: 16,
    conference_no_1_seed: 32,
    superbowl_matchup: 80,
    most_wins: 32,
    least_wins: 32,
    division_exact_position: 48,
    exacta: 48,
    award_mvp: 24,
    award_super_bowl_mvp: 24,
    award_offensive_player_of_year: 24,
    award_defensive_player_of_year: 24,
    award_offensive_rookie_of_year: 24,
    award_defensive_rookie_of_year: 24,
    award_comeback_player_of_year: 24,
  };
  const input = {};
  for (const [market, rows] of Object.entries(dossier.synthesis_input || {})) {
    const n = limits[market] ?? 4;
    input[market] = takeRows(rows, n).map(slimMarketRow);
  }
  return {
    team_profiles: Object.fromEntries(Object.entries(dossier.team_profiles || {}).map(([team, profile]) => [team, slimTeamProfile(profile)])),
    synthesis_input: input,
    // Tier-2 fix: the producer (makeNormalizedFindLean in portfolio-dossier.js) emits
    // adjacent_signals[team] as an ARRAY of {market, direction, strength, who, why} leans,
    // not an object with game_lean_count/games/props/strongest — those fields never
    // existed on either shape, so every team was silently zeroed out under --shadow-slim.
    // The whole structure is small (~25KB across all 32 teams), so pass it through as-is
    // rather than build another lossy summary shape.
    adjacent_signals: dossier.adjacent_signals || {},
    roster_churn: dossier.roster_churn || {},
    // Tier-2 fix: dossier.experts (the named-analyst roster SYSTEM_PROMPT tells the model
    // to cite from) was assembled but never serialized into the prompt at all. Also small
    // (~25KB for 86 analysts).
    experts: dossier.experts || {},
  };
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
- If scenario structures are supplied (hedge baskets, parlay ladders, or portfolio_strategy), evaluate them as a scenario book: maximum dead cost if legs fail, effective cost basis if early ladder legs win, whether matchup/exacta coverage spans enough plausible playoff paths, conference/division/QB-driver concentration, and whether each longshot creates real later hedge optionality rather than just another standalone lottery ticket.
- For a surviving anchor_bet-role candidate whose thesis the Skeptic did NOT downgrade, but whose current price makes a full-size entry marginal or slightly negative-edge: instead of passing on it outright, you may recommend a SCALED ENTRY -- a smaller stake_tier now plus an explicit price/condition at which the position would be sized up later. This is not adding a new pick; it is a sizing/timing decision on a candidate you already have. Only use this when the underlying edge case (injury return, roster/coaching change, schedule) is still intact and it is specifically the price that is currently unfavorable -- not when the thesis itself is broken (that is still a pass). When you use this pattern, include an entry_plan on that candidate: { "pattern": "scale_in", "add_trigger": "<price/line/condition that would justify adding to the position>", "note": "<=1 sentence on why partial entry beats an outright pass>" }. Omit entry_plan entirely for a normal full-size entry.
- Do not add new picks. Only finalize sizing/thresholds or pass on what you were given.

Return STRICT JSON only: { "finalized": [ { "key": "<copied exactly>", "bet_threshold": "<...>", "needs_human_review": <bool>, "stake_tier": "core|standard|small|speculative", "risk_note": "<=1 sentence", "entry_plan": { "pattern": "scale_in", "add_trigger": "<...>", "note": "<=1 sentence" } } (entry_plan optional, scale_in pattern only) ], "passes": [ { "key": "<copied exactly>", "reason": "<why this doesn't make the final book>" } ], "scenario_review": { "max_exposure_note": "<=1 sentence>", "funded_liability_note": "<=1 sentence>", "coverage_note": "<=1 sentence>", "concentration_note": "<=1 sentence>", "hedge_optionality_note": "<=1 sentence>", "needs_human_review": <bool> }, "portfolio_notes": "<=4 sentences on correlation clusters, overall exposure, coverage gaps>" }`;

function buildRiskEditorUserPrompt(candidates, scenarioInput = {}) {
  const compact = candidates.map((c) => ({
    key: c.key, market: c.market, selection: c.selection, type: c.type, edge_type: c.edge_type,
    price: c.price, book: c.book, edge_pct: c.edge_pct, confidence: c.confidence, stake_tier: c.stake_tier,
    thesis: c.thesis, disconfirming_factor: c.disconfirming_factor, skeptic_note: c.skeptic_note,
    skeptic_verdict: c.skeptic_verdict, correlated_week1: c.correlated_week1,
  }));
  const scenarios = {
    primary_positions: scenarioInput.primary || [],
    user_portfolio_ledger: scenarioInput.ledger || null,
    hedge_baskets: scenarioInput.hedge_baskets || [],
    parlay_ladders: scenarioInput.parlay_ladders || [],
    portfolio_strategy: scenarioInput.portfolio_strategy || [],
  };
  return `SURVIVING CANDIDATES (${compact.length}, post-Skeptic) — judge the PORTFOLIO as a whole:\n${JSON.stringify(compact)}\n\nSCENARIO STRUCTURES (stage-1 proposals, not yet code-math-validated here — evaluate their portfolio logic, not their arithmetic):\n${JSON.stringify(scenarios)}\n\nReturn one finalized entry per surviving candidate you keep, plus any you pass on, matched by "key", and include scenario_review for the scenario structures.`;
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

  const out = await withTimeout(MODEL_TIMEOUT_MS, async (signal) => {
    if (openai) {
      if (usesResponsesApi(model)) {
        const body = {
          model,
          input: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
          max_output_tokens: MAX_OUTPUT_TOKENS,
          text: { format: { type: 'json_object' } },
          store: false,
        };
        if (REASONING_EFFORT || REASONING_MODE) {
          body.reasoning = {
            ...(REASONING_EFFORT ? { effort: REASONING_EFFORT } : {}),
            ...(REASONING_MODE ? { mode: REASONING_MODE } : {}),
          };
        }
        const res = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal,
        });
        if (!res.ok) throw new Error(`${model} HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
        const data = await res.json();
        if (data.status === 'incomplete' && data.incomplete_details?.reason === 'max_output_tokens') {
          throw new Error(`${model} response truncated at MAX_OUTPUT_TOKENS=${MAX_OUTPUT_TOKENS} (incomplete_details.reason=max_output_tokens, ${data.usage?.output_tokens ?? '?'} out-tokens) - raise --max-output-tokens and retry.`);
        }
        const text = data.output_text || (data.output || [])
          .flatMap((item) => item.content || [])
          .filter((item) => item.type === 'output_text' || item.type === 'text')
          .map((item) => item.text || '')
          .join('');
        return { text, usage: data.usage };
      }
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model, temperature: 0.4, max_tokens: MAX_OUTPUT_TOKENS, response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
        }),
        signal,
      });
      if (!res.ok) throw new Error(`${model} HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const data = await res.json();
      if (data.choices?.[0]?.finish_reason === 'length') {
        throw new Error(`${model} response truncated at MAX_OUTPUT_TOKENS=${MAX_OUTPUT_TOKENS} (finish_reason=length, ${data.usage?.completion_tokens ?? '?'} out-tokens) - raise --max-output-tokens and retry.`);
      }
      return { text: data.choices?.[0]?.message?.content ?? '', usage: data.usage };
    }
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model, max_tokens: MAX_OUTPUT_TOKENS, system: systemPrompt, messages: [{ role: 'user', content: userContent }] }), // temperature omitted: deprecated/rejected by newer Anthropic models (claude-opus-4-8, claude-fable-5)
      signal,
    });
    if (!res.ok) throw new Error(`${model} HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    // 2026-09-03 fix (Andy): surface truncation explicitly instead of letting
    // a cut-off response fall through to a cryptic downstream JSON.parse
    // error (that's what happened with claude-fable-5 on 2026-09-02 - it hit
    // the token cap and the only symptom was "Expected ',' or ']'... at
    // position 12750", with no indication *why*). stop_reason === 'max_tokens'
    // means the API truncated mid-generation - fail loud and specific so a
    // future occurrence is self-diagnosing (raise --max-output-tokens) rather
    // than looking like a malformed-response bug.
    if (data.stop_reason === 'max_tokens') {
      throw new Error(`${model} response truncated at MAX_OUTPUT_TOKENS=${MAX_OUTPUT_TOKENS} (stop_reason=max_tokens, ${data.usage?.output_tokens ?? '?'} out-tokens) - raise --max-output-tokens and retry.`);
    }
    return { text: data.content?.map((c) => c.text).join('') ?? '', usage: data.usage, stop_reason: data.stop_reason };
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
    const m = seg.match(/^([^[]+)(\[(\d+)\])?$/);
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

// Finds the dossier synthesis_input row a market+selection should trace back
// to: match on market key (exact — must equal a dossier synthesis_input key)
// then fuzzy-match team name against the free-text selection (selection is
// often a sentence like "Chiefs Over 9.5", not the bare team name, so exact
// equality is unreliable). Shared by validateRecommendation and the hedge-
// basket/parlay-ladder leg resolver below (2026-07-22 follow-up) — generalized
// to take market/selection directly rather than only a recommendation-shaped
// candidate object.
function findDossierRowFor(dossier, market, selection) {
  const rows = dossier?.synthesis_input?.[market];
  if (!rows || !rows.length) return null;
  const sel = (selection || '').toLowerCase();
  if (!sel) return null;
  if (market === 'superbowl_matchup') {
    const wanted = matchupKeyFromSelection(selection);
    if (!wanted) return null;
    return rows.find((r) => matchupKeyFromRow(r) === wanted) || null;
  }
  // Tier-3 fix: try the canonical team key first — the same normalizeTeam()
  // canonicalization (with its longest-alias-first, word-boundary-aware
  // matching) already used everywhere else in this file via rowTeamMatches().
  // The old fallback below scored raw substring/word overlap against the
  // row's own team text, which can tie-break onto the WRONG team when two
  // teams share a city or a short alias — and since PRICE_TOLERANCE=0, a
  // wrong-team match gets reported back as "cited price does not match the
  // dossier — likely fabricated" against a team the model never meant,
  // instead of a clean "no dossier row found" lookup miss.
  const wantedTeam = normalizeTeam(selection);
  if (wantedTeam) {
    const exact = rows.find((r) => rowTeamMatches(r, wantedTeam));
    if (exact) return exact;
  }
  // Fallback for selection text normalizeTeam can't resolve to a team at all
  // (player-name markets like award_*/exacta, which aren't team-keyed) —
  // unchanged scoring so those markets keep their existing behavior.
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
function findDossierRow(dossier, candidate) {
  return findDossierRowFor(dossier, candidate?.market, candidate?.selection);
}

function rowTeamMatches(row, team) {
  const wanted = normalizeTeam(team);
  if (!wanted) return false;
  return [row?.team, row?.team_nick, row?.team_a, row?.team_b].some((value) => normalizeTeam(value) === wanted);
}

function findWatchlistRow(dossier, team, market) {
  const rows = dossier?.synthesis_input?.[market] || [];
  return rows.find((row) => rowTeamMatches(row, team)) || null;
}

function watchlistQuote(row, target) {
  if (!row) return { text: 'No dossier row', book: null, price: null, edge: null };
  const direction = String(target?.direction || '').toLowerCase();
  if (target?.market === 'wins') {
    const side = direction === 'under' ? 'under' : 'over';
    const price = side === 'under' ? row.best_under : row.best_over;
    const book = side === 'under' ? row.best_under_book : row.best_over_book;
    const fair = side === 'under' ? row.under_fair_prob : row.over_fair_prob;
    const edge = side === 'under' ? row.best_under_edge_pct : row.best_over_edge_pct;
    return {
      text: `${side.toUpperCase()} ${row.consensus_line ?? '?'} ${price ?? '?'}@${book || '?'}`,
      book,
      price,
      fair_prob: fair,
      edge_pct: edge,
    };
  }
  return {
    text: `${row.best_price ?? '?'}@${row.best_book || '?'}`,
    book: row.best_book,
    price: row.best_price,
    fair_prob: row.fair_prob,
    edge_pct: row.value_gap == null ? null : round(row.value_gap * 100, 2),
  };
}

function watchlistStatus(row, quote) {
  if (!row) return 'missing from dossier';
  const simGap = row.sim?.gap ?? row.sim_win_total?.gap ?? null;
  const nBooks = row.n_books ?? row.line_consensus_confidence?.over_n_books ?? null;
  if (quote.edge_pct != null && Number(quote.edge_pct) < 0) return 'negative current edge';
  if (simGap != null && Number(simGap) < 0) return 'simulation below market';
  if (nBooks != null && Number(nBooks) <= 1) return 'thin market';
  return 'reviewable';
}

function buildWatchlistReview(dossier, watchlist) {
  const items = watchlist?.items || [];
  return items.map((item) => {
    const markets = (item.markets || []).flatMap((target) => {
      if (target.market === 'superbowl_matchup') {
        const rows = (dossier?.synthesis_input?.superbowl_matchup || [])
          .filter((row) => rowTeamMatches(row, item.team))
          .slice()
          .sort((a, b) => (Number(a.best_price ?? 0) - Number(b.best_price ?? 0)))
          .slice(0, 8);
        return rows.length
          ? rows.map((row) => {
              const quote = watchlistQuote(row, target);
              return {
                market: target.market,
                direction: target.direction || null,
                selection: row.team,
                quote: quote.text,
                fair_prob: quote.fair_prob,
                edge_pct: quote.edge_pct,
                sim_gap: row.sim?.gap ?? null,
                n_books: row.n_books ?? null,
                status: watchlistStatus(row, quote),
              };
            })
          : [{ market: target.market, direction: target.direction || null, selection: item.team, quote: 'No dossier row', status: 'missing from dossier' }];
      }
      const row = findWatchlistRow(dossier, item.team, target.market);
      const quote = watchlistQuote(row, target);
      return [{
        market: target.market,
        direction: target.direction || null,
        selection: row?.team || item.team,
        quote: quote.text,
        fair_prob: quote.fair_prob,
        edge_pct: quote.edge_pct,
        sim_gap: row?.sim?.gap ?? row?.sim_win_total?.gap ?? null,
        n_books: row?.n_books ?? row?.line_consensus_confidence?.over_n_books ?? null,
        status: watchlistStatus(row, quote),
      }];
    });
    return { ...item, markets };
  });
}

function matchupKeyFromTeams(a, b) {
  const teams = [normalizeTeam(a), normalizeTeam(b)].filter(Boolean);
  return teams.length === 2 ? teams.sort().join('|').toLowerCase() : null;
}

function matchupKeyFromSelection(selection) {
  const parts = String(selection || '').split(/\s+(?:vs\.?|v\.?|versus|at|@)\s+/i);
  if (parts.length < 2) return null;
  return matchupKeyFromTeams(parts[0], parts.slice(1).join(' '));
}

function matchupKeyFromRow(row) {
  if (row?.team_a && row?.team_b) return matchupKeyFromTeams(row.team_a, row.team_b);
  return matchupKeyFromSelection(row?.team);
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

// 2026-07-22 live-run fix: team-context fields (analytics/sos/schedule_context/
// officiating_context/clv_signal/injuries/prior) no longer live inline on the
// dossier row (see portfolio-dossier.js's team_profiles refactor — the original
// per-row inlining was the majority of why the first real run blew past every
// model's context window). Evidence citations like 'analytics.off_epa_rank'
// still name a path AS IF it were on the row, so resolution merges the row's
// matched team profile in before running resolvePath — the model's citation
// syntax doesn't need to change, only where the pointer actually resolves.
function teamProfileForRow(dossier, row) {
  if (!row) return null;
  const key = row.team_nick || row.team_a;
  return (key && dossier?.team_profiles?.[key]) || null;
}
function evidenceRowFor(dossier, row) {
  const profile = teamProfileForRow(dossier, row);
  return profile ? { ...profile, ...row } : row;
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
function marketFamily(market) {
  const m = String(market || '').toLowerCase();
  if (m === 'wins' || m === 'least_wins' || m === 'most_wins') return 'wins';
  if (m === 'playoffs') return 'playoffs';
  if (m === 'superbowl' || m === 'superbowl_matchup') return 'superbowl';
  if (m.startsWith('conference_')) return 'conference';
  if (m.startsWith('division_')) return 'division';
  return m || 'other';
}

function teamAliasesForRow(row) {
  const vals = [row?.team, row?.team_nick, row?.team_a, row?.team_b].filter(Boolean);
  const out = new Set();
  for (const v of vals) {
    out.add(String(v).toLowerCase());
    const n = normalizeTeam(v);
    if (n) out.add(String(n).toLowerCase());
  }
  return out;
}

function signalTeamMatches(signalTeam, aliases) {
  const raw = String(signalTeam || '').toLowerCase();
  const norm = normalizeTeam(signalTeam);
  return aliases.has(raw) || (norm && aliases.has(String(norm).toLowerCase()));
}

function cleanMarkdownCell(value) {
  return String(value ?? '')
    .replace(/\*\*/g, '')
    .replace(/<sub>.*?<\/sub>/gi, '')
    .replace(/&amp;/g, '&')
    .replace(/&mdash;|â€”/g, '-')
    .trim();
}

function splitMarkdownRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cleanMarkdownCell);
}

function parseEpisodeCell(value) {
  const raw = cleanMarkdownCell(value);
  const m = raw.match(/^(.*?)\s+\((\d{4}-\d{2}-\d{2})\)$/);
  return {
    episode: m ? m[1].trim() : raw,
    episode_date: m ? m[2] : null,
    timestamp: null,
  };
}

async function findLatestPodcastSummaryPaths() {
  const docsDir = path.join(ROOT, 'docs');
  let files = [];
  try {
    files = await readdir(docsDir);
  } catch {
    return null;
  }
  const md = files
    .filter((f) => /^Futures_Picks_Summary_\d{4}-\d{2}-\d{2}\.md$/i.test(f))
    .sort()
    .at(-1);
  if (!md) return null;
  const stem = md.replace(/\.md$/i, '');
  const html = files.includes(`${stem}.html`) ? `${stem}.html` : null;
  return {
    md_path: path.join(docsDir, md),
    html_path: html ? path.join(docsDir, html) : null,
  };
}

async function loadPodcastEvidenceIndex() {
  const paths = await findLatestPodcastSummaryPaths();
  const narrativeRows = await loadPodcastNarrativeEvidenceRows();
  if (!paths) return { rows: narrativeRows, summary_url: null, summary_path: null };
  let text = '';
  try {
    text = await readFile(paths.md_path, 'utf8');
  } catch {
    return { rows: [], summary_url: null, summary_path: paths.md_path };
  }

  const summaryPath = paths.html_path || paths.md_path;
  const summaryUrl = pathToFileURL(summaryPath).href;
  let narrativeUrls = new Map();
  try {
    const narrativeIndex = JSON.parse(await readFile(path.join(ROOT, 'docs', 'podcast-narratives', 'index.json'), 'utf8'));
    narrativeUrls = new Map((narrativeIndex.episodes || []).map((ep) => [
      [normalizeSourceText(ep.show), normalizeSourceText(ep.title), ep.pub_date || ''].join('|'),
      ep.html,
    ]));
  } catch {
    narrativeUrls = new Map();
  }
  const rows = [];
  let show = null;
  let host = null;
  let headers = null;

  for (const line of text.split(/\r?\n/)) {
    const showMatch = line.match(/^##\s+(.+?)\s*$/);
    if (showMatch && !line.startsWith('###')) {
      show = cleanMarkdownCell(showMatch[1]);
      host = null;
      headers = null;
      continue;
    }
    const hostMatch = line.match(/^###\s+(.+?)\s*(?:<sub>|$)/);
    if (hostMatch) {
      host = cleanMarkdownCell(hostMatch[1]);
      headers = null;
      continue;
    }
    if (!line.trim().startsWith('|')) {
      headers = null;
      continue;
    }
    const cells = splitMarkdownRow(line);
    if (cells.every((c) => /^-+$/.test(c))) continue;
    if (cells.includes('Subject') && cells.includes('Market') && cells.includes('Episode')) {
      headers = cells;
      continue;
    }
    if (!headers || !show || !host || cells.length < Math.min(headers.length, 6)) continue;

    const row = Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? '']));
    const episode = parseEpisodeCell(row.Episode);
    const subject = cleanMarkdownCell(row.Subject);
    const market = cleanMarkdownCell(row.Market);
    if (!subject || !market || !episode.episode) continue;
    rows.push({
      show,
      host,
      subject,
      subject_team: normalizeTeam(subject) || subject,
      market,
      pick: cleanMarkdownCell(row['Pick (reasoning)']),
      lean: cleanMarkdownCell(row.Lean),
      conviction: cleanMarkdownCell(row.Conviction),
      host_price: cleanMarkdownCell(row['Host price']),
      episode: episode.episode,
      episode_date: episode.episode_date,
      timestamp: episode.timestamp,
      summary_url: narrativeUrls.get([normalizeSourceText(show), normalizeSourceText(episode.episode), episode.episode_date || ''].join('|')) || summaryUrl,
      summary_path: summaryPath,
    });
  }

  return { rows: [...narrativeRows, ...rows], summary_url: summaryUrl, summary_path: summaryPath };
}

// Reference-library bridge (2026-09-01, DATA-LAYER-LOCKDOWN item 3). vault_notes
// holds two genuinely distinct things that never otherwise reach the committee:
// (a) hand-curated/static reference guides (coaching tendencies, DVOA/EPA
// glossary, key numbers, ATS framework) -- NOT sourced from research_intel_notes
// or research_pick_signals, so not a duplicate of anything the dossier already
// carries; (b) per-team "Analytical Deep-Reads" (narrative article summaries)
// that intel-to-vault-sync.js writes into NFL/Teams/<ABBR>.md -- these ARE
// sourced from research_intel_notes, but portfolio-dossier.js only ever pulls
// research_pick_signals (the structured lean/pick rows), never the narrative
// article text itself, so this is real, non-duplicate context too. As of
// 2026-09-01 this reads BOTH of intel-to-vault-sync.js's per-team subsections
// -- "Analytical Deep-Reads" (source_type:'analytical') and "Betting & News"
// (everything else, incl. source_type:'social' -- i.e. every Twitter/X
// Bookmarks note) -- merged by recency. Reading only the first one silently
// dropped all Twitter/X-bookmark intel from the committee prompt even after
// it successfully reached vault_notes; see the loop below for detail.
//
// Deliberately EXCLUDED: the same note's "Injuries" subsection (already in
// dossier.injuries via player_injuries, migration 016 -- bridging it would be
// a pure duplicate); the ABBR-ATS/-PlayerStats/-Schedule/-TeamStats/-QBR
// variant files (raw stat imports, not narrative context, likely already
// reflected in the dossier's own analytics/dvoa fields computed from
// nflverse); WeeklySignals.md (same intel-to-vault-sync source as the
// per-team Analytical Deep-Reads pulled here, just re-aggregated cross-team --
// bridging both would double-count the same articles); the 2026-IDP guide
// (fantasy/IDP-specific, out of scope for this game/futures-market dossier);
// and the *-2022/2023/2024 season-archive dumps (stale bulk imports, not
// living reference material -- see NFL_Reference/{ESPN,Schedules,GameResults,
// PlayerStats*,TeamStats}-202[234].md, ~300KB combined, none hand-curated).
const REFERENCE_DOC_FILES = {
  coach_tendencies: 'CoachTendencies.md',
  analytical_models_glossary: 'DVOA.md',
  dvoa_current_season: 'DVOA-2025.md',
  key_numbers: 'KeyNumbers.md',
  ats_trends_framework: 'ATS_Trends.md',
  ats_current_season: 'ATS-2025.md',
};

async function loadVaultReferenceEvidence() {
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SB_URL || !SB_KEY) {
    return { referenceDocs: null, teamDeepReads: {} };
  }
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });

    const docPaths = Object.values(REFERENCE_DOC_FILES).map((f) => `NFL/Reference/${f}`);
    const { data: docRows, error: docErr } = await sb
      .from('vault_notes')
      .select('path, content')
      .in('path', docPaths);
    if (docErr) throw new Error(`reference docs fetch: ${docErr.message}`);
    const referenceDocs = {};
    for (const [key, file] of Object.entries(REFERENCE_DOC_FILES)) {
      const row = docRows?.find((r) => r.path === `NFL/Reference/${file}`);
      if (row?.content) referenceDocs[key] = row.content;
    }

    const { data: teamRows, error: teamErr } = await sb
      .from('vault_notes')
      .select('path, content')
      .like('path', 'NFL/Teams/%')
      .not('path', 'like', 'NFL/Teams/%-%'); // excludes ABBR-Suffix.md stat-import variants
    if (teamErr) throw new Error(`team notes fetch: ${teamErr.message}`);

    const teamDeepReads = {};
    const itemRe = /-\s*\*\*\[(.+?)\]\((.+?)\)\*\*\s*\u2014\s*(.+?)\s*\((\d{4}-\d{2}-\d{2})\)\n\s*-\s*(.+)/g;
    // 2026-09-01: was 'Analytical Deep-Reads' only, which silently missed
    // everything intel-to-vault-sync.js classifies as source_type !== 'analytical'
    // (its own 'Betting & News' subsection) -- including every Twitter/X
    // Bookmarks note (source_type:'social'), since that's the ONLY vault path
    // Twitter intel has today (research_pick_signals from Twitter is
    // Vision-OCR-only per twitter-bookmarks-agent.js and is near-empty until
    // more betslip screenshots get bookmarked). Verified live: a real
    // Twitter-sourced deep-read landed in NFL/Teams/DEN.md's 'Betting & News'
    // section after a real intel-to-vault-sync.js run, but never reached the
    // synthesis prompt because this regex's section boundary stopped before
    // it. Both subsections share the exact same bullet-item format, so this
    // just reads both and merges by recency instead of one.
    const SECTION_HEADINGS = ['Analytical Deep-Reads', 'Betting & News'];
    for (const row of (teamRows || [])) {
      const m = row.path.match(/^NFL\/Teams\/([A-Z]{2,3})\.md$/);
      if (!m) continue;
      const abbr = m[1];
      const reads = [];
      for (const heading of SECTION_HEADINGS) {
        const sectionRe = new RegExp(`###\\s*${heading}\\n([\\s\\S]*?)(?=\\n#{1,6}\\s|\\n<!--|$)`);
        const section = row.content.match(sectionRe);
        if (!section) continue;
        itemRe.lastIndex = 0;
        let mm;
        while ((mm = itemRe.exec(section[1])) !== null) {
          reads.push({ title: mm[1], url: mm[2], source: mm[3], date: mm[4], summary: mm[5] });
        }
      }
      if (reads.length) {
        // Merged from two subsections -- re-sort by date so the most recent
        // items from EITHER section win the cap, rather than exhausting the
        // cap on whichever heading happened to be read first.
        reads.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
        teamDeepReads[abbr] = reads.slice(0, 8);
      }
    }

    return { referenceDocs, teamDeepReads };
  } catch (err) {
    console.warn(`  [WARN] vault reference evidence: ${err.message}`);
    return { referenceDocs: null, teamDeepReads: {} };
  }
}

// Bridges agents/bettorday-newsletter-ingest.js's trench composite/SOS data
// into the committee prompt. Added 2026-09-02, same pattern as
// loadVaultReferenceEvidence() above: best-effort, silent no-op if
// unavailable, never blocks synthesis. Two data-availability layers,
// checked in order:
//   1. Supabase nfl_trench_ratings (migration 053) -- the live, current
//      source once the ingest agent has actually run non-dry-run.
//   2. Local data/intel/bettorday_trench_ratings_2026.json -- whatever the
//      ingest agent last wrote locally (dry-run included). Falls back here
//      when Supabase creds are absent or the table doesn't exist yet, so
//      this bridge is exercisable/testable before migration 053 is run.
// Per the audit response (docs/specs/BETTORDAY_INTEL_PIPELINE_AUDIT_RESPONSE_2026-09-02.md
// §2) and the e95137d fix, rows are partitioned by metric_type --
// 'team_composite' (a team's own O-line/D-line quality) and 'schedule_sos'
// (the difficulty of the fronts that team's units will face this season).
// These are kept as two separate objects per team, never merged/averaged,
// since they measure different things on different scales.
async function loadBettorDayTrenchEvidence() {
  const empty = { byTeam: {}, sourceMode: 'none' };
  let rows = null;
  let sourceMode = 'none';

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (SB_URL && SB_KEY) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });
      const { data, error } = await sb
        .from('nfl_trench_ratings')
        .select('team, metric_type, rank_overall, score_overall, run_block_z, pass_block_z, run_defense_z, pass_rush_z, as_of_date')
        .order('as_of_date', { ascending: false });
      if (error) throw new Error(error.message);
      if (data?.length) {
        rows = data;
        sourceMode = 'supabase';
      }
    } catch (err) {
      console.warn(`  [WARN] bettorday trench evidence (supabase): ${err.message}`);
    }
  }

  if (!rows) {
    try {
      const localPath = path.join(ROOT, 'data', 'intel', 'bettorday_trench_ratings_2026.json');
      const raw = await readFile(localPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        rows = parsed;
        sourceMode = 'local_file';
      }
    } catch {
      // No local file either -- genuinely nothing available yet, not an error.
    }
  }

  if (!rows) return empty;

  // Keep only the most-recent as_of_date per (team, metric_type) -- both
  // sources can carry more than one date's rows.
  const latest = new Map();
  for (const r of rows) {
    const key = `${r.team}|${r.metric_type}`;
    const existing = latest.get(key);
    if (!existing || r.as_of_date > existing.as_of_date) latest.set(key, r);
  }

  const byTeam = {};
  for (const r of latest.values()) {
    byTeam[r.team] ||= {};
    const slot = r.metric_type === 'team_composite' ? 'team_composite'
      : r.metric_type === 'schedule_sos' ? 'schedule_sos'
      : null;
    if (!slot) continue; // unknown metric_type -- skip rather than guess
    byTeam[r.team][slot] = {
      rank_overall: r.rank_overall,
      score_overall: r.score_overall,
      run_block_z: r.run_block_z,
      pass_block_z: r.pass_block_z,
      run_defense_z: r.run_defense_z,
      pass_rush_z: r.pass_rush_z,
      as_of_date: r.as_of_date,
    };
  }

  return { byTeam, sourceMode };
}

async function loadPodcastNarrativeEvidenceRows() {
  const indexPath = path.join(ROOT, 'docs', 'podcast-narratives', 'index.json');
  let index = null;
  try {
    index = JSON.parse(await readFile(indexPath, 'utf8'));
  } catch {
    return [];
  }
  const rows = [];
  for (const ep of (index.episodes || [])) {
    if (!ep.markdown) continue;
    const mdPath = fileURLToPath(ep.markdown);
    let text = '';
    try {
      text = await readFile(mdPath, 'utf8');
    } catch {
      continue;
    }
    let headers = null;
    let inTable = false;
    for (const line of text.split(/\r?\n/)) {
      if (line.startsWith('## Representative Quotes')) break;
      if (!line.trim().startsWith('|')) {
        if (inTable) headers = null;
        continue;
      }
      const cells = splitMarkdownRow(line);
      if (cells.every((c) => /^-+$/.test(c))) continue;
      if (cells.includes('Expert') && cells.includes('Market') && cells.includes('Subject')) {
        headers = cells;
        inTable = true;
        continue;
      }
      if (!headers || cells.length < headers.length) continue;
      const row = Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? '']));
      if (!row.Subject || !row.Market) continue;
      rows.push({
        show: ep.show,
        host: row.Expert,
        subject: row.Subject,
        subject_team: normalizeTeam(row.Subject) || row.Subject,
        market: row.Market,
        pick: row.Prediction,
        lean: row.Lean,
        conviction: row.Conf,
        host_price: '',
        episode: ep.title,
        episode_date: ep.pub_date,
        timestamp: row.Time && row.Time !== '-' ? row.Time : null,
        summary_url: ep.html,
        summary_path: mdPath,
      });
    }
  }
  return rows;
}

function normalizeSourceText(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function evidenceMarketFamily(market) {
  const m = String(market || '').toLowerCase();
  if (m.includes('win_total') || m === 'win total') return 'wins';
  if (m.includes('playoffs')) return 'playoffs';
  if (m.includes('super_bowl')) return 'superbowl';
  if (/^(afc|nfc)(?:_|$)/.test(m)) {
    return /(east|north|south|west)/.test(m) ? 'division' : 'conference';
  }
  return marketFamily(market);
}

function evidenceDirection(row) {
  const lean = String(row?.lean || '').toLowerCase();
  const pick = String(row?.pick || '').toLowerCase();
  if (/\bunder\b|against|fade|miss playoffs|not going to win/.test(`${lean} ${pick}`)) return 'under';
  if (/\bover\b|favor|back|make playoffs|win the division|win the nfc|win the afc|win the super bowl/.test(`${lean} ${pick}`)) return 'over';
  return null;
}

function directionsCompatible(signalDirection, evidenceDir) {
  const dir = String(signalDirection || '').toLowerCase();
  if (!evidenceDir) return false;
  if (dir === evidenceDir) return true;
  if ((dir === 'back' || dir === 'over') && evidenceDir === 'over') return true;
  if ((dir === 'fade' || dir === 'under') && evidenceDir === 'under') return true;
  return false;
}

function findPodcastEvidence(signal, evidenceIndex) {
  const rows = evidenceIndex?.rows || [];
  if (!rows.length || !signal?.team) return null;
  const signalTeam = normalizeTeam(signal.team) || signal.team;
  const source = normalizeSourceText(signal.who || signal.why || '');
  const sigFamily = marketFamily(signal.market);
  const scored = [];

  for (const row of rows) {
    const rowTeam = normalizeTeam(row.subject_team || row.subject) || row.subject;
    if (normalizeTeam(rowTeam) !== normalizeTeam(signalTeam)) continue;

    let score = 4;
    const rowFamily = evidenceMarketFamily(row.market);
    if (rowFamily === sigFamily) score += 2;
    const rowDir = evidenceDirection(row);
    if (directionsCompatible(signal.direction, rowDir)) score += 2;

    const show = normalizeSourceText(row.show);
    const host = normalizeSourceText(row.host);
    const episode = normalizeSourceText(row.episode);
    let sourceScore = 0;
    if (source && (source === show || source === host || source === episode || episode.includes(source) || source.includes(episode))) sourceScore = 4;
    else if (source && show && source.includes(show)) sourceScore = 2;
    if (!sourceScore) continue;
    score += sourceScore;

    const why = normalizeSourceText(signal.why);
    const pick = normalizeSourceText(row.pick);
    if (why && pick && (why.includes(pick) || pick.includes(why))) score += 1;
    if (row.timestamp) score += 1;
    if (score >= 7) scored.push({ row, score });
  }

  scored.sort((a, b) => b.score - a.score || String(a.row.host).localeCompare(String(b.row.host)));
  return scored[0]?.row || null;
}

function signalAlignment(recMarket, recSide, sigMarket, sigDirection) {
  const recFamily = marketFamily(recMarket);
  const sigFamily = marketFamily(sigMarket);
  const dir = String(sigDirection || '').toLowerCase();
  const positive = dir === 'back' || dir === 'over';
  const negative = dir === 'fade' || dir === 'under';

  // 2026-09-04 fix (NFL_Dashboard intel-pipeline audit): a signal only counts
  // as support/opposition for a futures-market pick when it comes from a
  // futures-compatible family itself. A single-game "game"/prop-market signal
  // is never real evidence for or against a season-long futures claim -- e.g.
  // a Week N spread fade on the Packers says nothing about their NFC
  // Championship odds. Previously, any positive/negative-direction signal
  // fell through to the bottom of this function and was labeled 'aligned' or
  // 'opposing' regardless of market family, which is exactly how a game-level
  // "fade the Packers" signal got cross-attached as opposing/aligned evidence
  // on an unrelated NFC Championship futures candidate. Cross-family signals
  // now always route to 'related' (shown as "mentions the same team but not a
  // clean match for this market") instead.
  const futuresFamilies = ['playoffs', 'conference', 'division', 'superbowl', 'wins'];
  const sigIsFuturesCompatible = futuresFamilies.includes(sigFamily);

  if (recFamily === 'wins') {
    if (sigIsFuturesCompatible) {
      if (recSide === 'over') {
        if (dir === 'over' || positive) return 'aligned';
        if (dir === 'under' || dir === 'fade') return 'opposing';
      }
      if (recSide === 'under') {
        if (dir === 'under' || dir === 'fade') return 'aligned';
        if (dir === 'over' || dir === 'back') return 'opposing';
      }
    }
    return 'related';
  }

  if (['playoffs', 'conference', 'division', 'superbowl'].includes(recFamily)) {
    if (sigIsFuturesCompatible) {
      if (positive) return 'aligned';
      if (negative) return 'opposing';
    }
    return 'related';
  }

  return 'related';
}

function collectDossierSignals(candidate, dossier, row, podcastEvidence) {
  if (!row) return [];
  const aliases = teamAliasesForRow(row);
  const recSide = row.consensus_line != null ? sideOfSelection(candidate.selection) : null;
  const out = [];
  const seen = new Set();
  const add = (signal) => {
    if (!signal?.who || !signalTeamMatches(signal.team || row.team_nick || row.team, aliases)) return;
    const item = {
      who: signal.who,
      team: signal.team || row.team_nick || row.team,
      market: signal.market || row.market || candidate.market,
      direction: signal.direction || signal.dir,
      strength: signal.strength,
      why: signal.why,
      source_type: signal.source_type,
    };
    item.alignment = signalAlignment(candidate.market, recSide, item.market, item.direction);
    const podcastRow = findPodcastEvidence(item, podcastEvidence);
    if (podcastRow) {
      item.podcast_evidence = {
        show: podcastRow.show,
        host: podcastRow.host,
        episode: podcastRow.episode,
        episode_date: podcastRow.episode_date,
        timestamp: podcastRow.timestamp,
        pick: podcastRow.pick,
        lean: podcastRow.lean,
        conviction: podcastRow.conviction,
        host_price: podcastRow.host_price,
        summary_url: podcastRow.summary_url,
      };
    }
    const key = [item.alignment, item.who, item.team, item.market, item.direction, item.strength, item.why].join('|').toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  };

  for (const sample of (row.lean?.samples || [])) {
    add({ ...sample, team: row.team_nick || row.team, market: candidate.market, direction: sample.dir, source_type: 'market-row lean sample' });
  }
  for (const [who, picks] of Object.entries(dossier?.experts || {})) {
    for (const pick of (picks || [])) add({ ...pick, who, source_type: 'normalized experts map' });
  }

  const order = { aligned: 0, opposing: 1, related: 2 };
  return out
    .sort((a, b) => (order[a.alignment] ?? 9) - (order[b.alignment] ?? 9) || (b.strength ?? 0) - (a.strength ?? 0) || String(a.who).localeCompare(String(b.who)))
    .filter((s, i, arr) => {
      const beforeSameBucket = arr.slice(0, i).filter((x) => x.alignment === s.alignment).length;
      return s.alignment === 'aligned' ? beforeSameBucket < 5 : beforeSameBucket < 3;
    });
}

const PRICE_TOLERANCE = 0; // exact line/book/price identity for futures recommendations
const MATH_EDGE_MIN_PCT = 1;  // below this, dossier fields don't really support a "math" edge_type
const MAX_QUOTE_AGE_HOURS = Number(process.env.FUTURES_MAX_QUOTE_AGE_HOURS || 72);

function sideOfSelection(selection) {
  const s = (selection || '').toLowerCase();
  if (/\bunder\b/.test(s)) return 'under';
  if (/\bover\b/.test(s)) return 'over';
  return null;
}
function lineOfSelection(selection) {
  const m = String(selection || '').match(/\b(?:over|under)\s+(\d+(?:\.\d+)?)\b/i);
  return m ? Number(m[1]) : null;
}
function deterministicFairFor(row, side) {
  if (!row) return null;
  if (row.consensus_line != null) {
    if (side === 'under' && row.sim_win_total?.under_prob != null) return row.sim_win_total.under_prob;
    if (side === 'over' && row.sim_win_total?.over_prob != null) return row.sim_win_total.over_prob;
    if (side === 'under') return row.under_fair_prob ?? null;
    if (side === 'over') return row.over_fair_prob ?? null;
    return null;
  }
  if (row.sim?.prob != null) return row.sim.prob;
  return row.fair_prob ?? null;
}
function deterministicFairLowerFor(row, side) {
  if (!row) return null;
  if (row.consensus_line != null) {
    if (side === 'under') return row.sim_win_total?.under_ci90?.lower ?? null;
    if (side === 'over') return row.sim_win_total?.over_ci90?.lower ?? null;
    return null;
  }
  return row.sim?.prob_ci90?.lower ?? null;
}
function isStandaloneRecommendation(candidate) {
  const tag = `${candidate?.edge_type || ''} ${candidate?.type || ''}`.toLowerCase();
  return !/\bhedge\b/.test(tag);
}
function quoteStatusFor(row, book) {
  if (!row || !book) return null;
  if (row.consensus_line != null) return row.books?.[book] || row.books?.[String(book).toLowerCase()] || null;
  return {
    observed_at: row.best_observed_at,
    quote_age_hours: row.best_quote_age_hours,
    availability_status: row.best_availability_status,
  };
}

// NOTE (lint cleanup, 2026-08-10): the original validateRecommendation(candidate, dossier)
// implementation lived here. It was fully superseded by validateRecommendationStrict()
// below (the only one actually called, at the `final.map((c) => validateRecommendationStrict(...))`
// site) and had zero remaining callers or exports — removed as dead code rather than
// prefixed, per docs/LINT_CLEANUP_BACKLOG_2026-08-09.md's UNUSED-VARS guidance. See git
// history for the original body if it's ever needed for reference.

// ── Hedge-basket / parlay-ladder math (2026-07-22, Andy's own portfolio-
// construction strategy — not a Codex finding). Same "code owns math" rule as
// validateRecommendation above: the model names WHICH legs and WHY, code
// computes every number from the dossier's REAL placeable price, never the
// model's own arithmetic. All stakes are relative "units" (default 1/leg) —
// matching the existing stake_tier convention (never real dollars); Andy
// scales to his own bankroll. ───────────────────────────────────────────────
function validateRecommendationStrict(candidate, dossier, podcastEvidence) {
  const notes = [];
  const row = findDossierRow(dossier, candidate);
  if (!row) {
    return { status: 'invalid', candidate, reason: `No dossier row found for market="${candidate.market}" selection="${candidate.selection}" - cannot verify this pick against real data.` };
  }

  const isWinsRow = row.consensus_line != null;
  const side = isWinsRow ? sideOfSelection(candidate.selection) : null;
  let expectedBook = null, expectedPrice = null;
  if (isWinsRow) {
    if (side === 'under') { expectedBook = row.best_under_book; expectedPrice = row.best_under; }
    else if (side === 'over') { expectedBook = row.best_over_book; expectedPrice = row.best_over; }
    else notes.push('could not determine over/under side from selection text - book/price not checked against a specific side.');

    const citedLine = lineOfSelection(candidate.selection);
    const expectedLine = expectedBook ? row.books?.[expectedBook]?.line : null;
    if (citedLine != null && expectedLine != null && citedLine !== expectedLine) {
      return { status: 'invalid', candidate, reason: `Cited win-total line ${citedLine} does not match ${expectedBook}'s dossier line ${expectedLine} for ${candidate.selection}.` };
    }
  } else {
    expectedBook = row.best_book; expectedPrice = row.best_price;
  }

  if (expectedBook && candidate.book && candidate.book.toLowerCase() !== expectedBook.toLowerCase()) {
    return { status: 'invalid', candidate, reason: `Cited book "${candidate.book}" does not match the dossier's placeable best-price book "${expectedBook}" for ${candidate.selection} (${candidate.market}).` };
  }

  if (expectedPrice != null && candidate.price != null) {
    const dp1 = decimalPayout(candidate.price), dp2 = decimalPayout(expectedPrice);
    if (dp1 != null && dp2 != null && Math.abs(dp1 - dp2) / dp2 > PRICE_TOLERANCE) {
      return { status: 'invalid', candidate, reason: `Cited price ${candidate.price} does not exactly match the dossier's price ${expectedPrice} at ${expectedBook} for ${candidate.selection} - likely stale or fabricated.` };
    }
  }

  const q = quoteStatusFor(row, expectedBook);
  // 2026-09-03 fix (Andy, post-committee-run review): a stale quote is not
  // fabricated or unusable data - it's the last real number this book gave
  // us. Hard-invalidating on staleness killed real, reviewable picks (Bills
  // Win Division, Packers Win Total) purely because capture had lagged on
  // one or two books, even while the underlying price was still live in the
  // market. Per Andy's standing instruction: "if lines are not being
  // automatically captured at run-time, the EXISTING numbers should be
  // treated as the current truth." So a stale best-quote no longer kills the
  // recommendation - it flags it for human review before entry instead. This
  // pairs with the isBetterOffer() freshness-first fix in
  // agents/portfolio-dossier.js, which already prefers a fresher quote when
  // one exists; this branch only fires when the best available quote really
  // is the stalest thing on record for that selection.
  let needsReview = !!candidate.needs_human_review;
  if (q?.availability_status === 'stale' || (q?.quote_age_hours != null && q.quote_age_hours > MAX_QUOTE_AGE_HOURS)) {
    notes.push(`Best quote at ${expectedBook} is stale (${q.quote_age_hours}h old, observed_at=${q.observed_at || 'missing'}) - treated as current truth per no-fresh-capture fallback policy; verify live price before entry.`);
    needsReview = true;
  }

  const next = { ...candidate };
  if (candidate.model_fair_prob != null && candidate.price != null) {
    const recomputed = edgePctFromFair(candidate.model_fair_prob, candidate.price);
    if (recomputed != null) {
      if (candidate.edge_pct != null && Math.abs(recomputed - candidate.edge_pct) > 2) {
        notes.push(`edge_pct recomputed from model_fair_prob/price: ${recomputed}% (model reported ${candidate.edge_pct}%) - using code-verified figure.`);
      }
      next.edge_pct = recomputed;
    }
  }

  const codeFair = deterministicFairFor(row, side);
  if (codeFair != null && expectedPrice != null) {
    const codeEdge = edgePctFromFair(codeFair, expectedPrice);
    const codeFairLower = deterministicFairLowerFor(row, side);
    const codeEdgeLower = codeFairLower == null ? null : edgePctFromFair(codeFairLower, expectedPrice);
    next.code_fair_prob = codeFair;
    next.code_edge_pct = codeEdge;
    if (codeFairLower != null) {
      next.code_fair_prob_ci90 = { lower: codeFairLower, upper: row.consensus_line != null
        ? (side === 'under' ? row.sim_win_total?.under_ci90?.upper : row.sim_win_total?.over_ci90?.upper)
        : row.sim?.prob_ci90?.upper };
      next.edge_lower_bound_pct = codeEdgeLower;
    }
    if (isStandaloneRecommendation(candidate) && codeEdge != null && codeEdge <= 0) {
      return { status: 'invalid', candidate: next, reason: `Standalone recommendation is non-positive EV under code-owned fair probability (${codeEdge}%).` };
    }
    if (isStandaloneRecommendation(candidate) && codeEdgeLower != null && codeEdgeLower <= 0) {
      return { status: 'invalid', candidate: next, reason: `Standalone recommendation lower-bound edge is non-positive under code-owned uncertainty (${codeEdgeLower}%).` };
    }
    if (candidate.edge_type === 'math' && codeEdge != null && codeEdge < MATH_EDGE_MIN_PCT) {
      notes.push(`edge_type downgraded math->thesis: code-owned edge is ${codeEdge}%, below the ${MATH_EDGE_MIN_PCT}% math-edge floor.`);
      next.edge_type = 'thesis';
      needsReview = true;
    }
  } else if (isStandaloneRecommendation(candidate)) {
    notes.push('code-owned fair probability unavailable for this market; final standalone recommendation needs human review.');
    needsReview = true;
  }

  const evidenceResolved = resolveEvidenceIds(candidate.evidence_ids, evidenceRowFor(dossier, row));
  next.evidence_resolved = evidenceResolved;
  next.dossier_signals = collectDossierSignals(candidate, dossier, row, podcastEvidence);
  if (candidate.evidence_ids?.length && !evidenceResolved.some((e) => e.resolved)) {
    notes.push('none of the cited evidence_ids resolved against the matched dossier row - citations may be fabricated or mis-keyed.');
    needsReview = true;
  }

  next.needs_human_review = needsReview;
  if (notes.length) next.validation_notes = notes;
  return { status: notes.length ? 'flagged' : 'ok', candidate: next };
}

function proposalSlug(value, fallback = 'proposal') {
  const s = String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || fallback;
}

function stakeUnitsForTier(officialConfig, tier) {
  const sizing = officialConfig?.sizing_map || {};
  return Number(sizing[tier] ?? sizing.speculative ?? 0.25);
}

function lineForProposal(candidate, row) {
  if (!row || row.consensus_line == null) return null;
  const book = candidate.book;
  if (!book) return lineOfSelection(candidate.selection);
  return row.books?.[book]?.line ?? row.books?.[String(book).toLowerCase()]?.line ?? lineOfSelection(candidate.selection);
}

function quoteObservedAt(candidate, row) {
  const q = quoteStatusFor(row, candidate.book);
  return q?.observed_at || row?.best_observed_at || null;
}

function proposalReadiness(config, proposal) {
  const errors = [];
  const warnings = [];
  for (const key of ['market_type', 'selection', 'book']) {
    if (!proposal[key]) errors.push(`${key} is required for proposal intake.`);
  }
  for (const key of ['thesis', 'market_view', 'football_view', 'disconfirming_factor']) {
    if (!proposal[key]) errors.push(`${key} is required for proposal intake.`);
  }
  if (proposal.confidence == null || !Number.isFinite(Number(proposal.confidence))) warnings.push('confidence is required before lock.');
  if (!proposal.observed_at) warnings.push('observed_at is required before lock.');
  if (!proposal.source_ref && !proposal.source_url) warnings.push('source_ref or source_url is required before lock.');
  if (!proposal.bet_threshold && proposal.minimum_edge_pct == null && proposal.edge_pct == null) warnings.push('bet_threshold, minimum_edge_pct, or edge_pct is required before lock.');
  if (!proposal.evidence_ids?.length) warnings.push('evidence_ids are required before lock.');
  const held = new Set((config?.market_holds || []).map((h) => h.market));
  const exactaHold = held.has(proposal.market_type) || held.has(proposal.market);
  if (exactaHold) warnings.push('Current exacta/Super Bowl matchup hold: monitor-only until secondary BetOnline price-shopping market exists.');
  return {
    proposal_ready: errors.length === 0,
    lock_ready: false,
    exacta_hold: exactaHold,
    errors,
    warnings,
    info: ['Draft exported from Futures Agent output. Human verification is required before official paper tracking.'],
  };
}

function candidateToOfficialProposal(candidate, dossier, meta, officialConfig) {
  const row = findDossierRow(dossier, candidate);
  const stakeTier = candidate.stake_tier || 'speculative';
  const stakeUnits = stakeUnitsForTier(officialConfig, stakeTier);
  const observedAt = quoteObservedAt(candidate, row);
  const edge = candidate.code_edge_pct ?? candidate.edge_pct ?? null;
  const team = candidate.display_team || row?.team_nick || row?.team || normalizeTeam(candidate.selection) || '';
  return {
    pick_id: randomUUID(),
    pick_scope: 'futures',
    market_type: candidate.market || 'futures',
    market: candidate.market || 'futures',
    selection: candidate.selection || '',
    team,
    opponent: row?.team_a && row?.team_b ? [row.team_a, row.team_b].filter((t) => t !== team).join(' / ') : '',
    book: candidate.book || '',
    price: candidate.price ?? null,
    line: lineForProposal(candidate, row),
    stake_tier: stakeTier,
    stake_units: stakeUnits,
    confidence: candidate.confidence ?? null,
    observed_at: observedAt || '',
    source_ref: `portfolio-synthesize ${meta.run_id} ${candidate.key || `${candidate.market}|${candidate.selection}`}`,
    source_url: '',
    bet_threshold: candidate.bet_threshold || '',
    minimum_edge_pct: edge,
    model_fair_prob: candidate.model_fair_prob ?? null,
    edge_pct: edge,
    market_view: candidate.market_view || '',
    football_view: candidate.football_view || '',
    thesis: candidate.thesis || '',
    disconfirming_factor: candidate.disconfirming_factor || '',
    evidence_ids: candidate.evidence_ids || [],
    sources: candidate.sources || [],
    timing: candidate.timing || null,
    correlated_positions: candidate.correlated_week1 || [],
    data_snapshot: {
      proposal_exported_by: 'agents/portfolio-synthesize.js',
      exported_at: new Date().toISOString(),
      run_id: meta.run_id,
      portfolio_date: meta.date,
      candidate_key: candidate.key || null,
      candidate_type: candidate.type || null,
      edge_type: candidate.edge_type || null,
      needs_human_review: !!candidate.needs_human_review,
      validation_notes: candidate.validation_notes || [],
      code_fair_prob: candidate.code_fair_prob ?? null,
      code_edge_pct: candidate.code_edge_pct ?? null,
      edge_lower_bound_pct: candidate.edge_lower_bound_pct ?? null,
      agreement: candidate.agreement || null,
      quote_source: {
        observed_at: observedAt,
        book: candidate.book || null,
        market: candidate.market || null,
      },
    },
    audit_note: 'Draft exported from Futures Agent final candidate output. Not official unless human-verified and locked.',
  };
}

function renderProposalInboxMarkdown(manifest) {
  const lines = [
    '# Platinum Rose AI Candidate Inbox',
    '',
    `Generated: ${manifest.generated_at}`,
    `Source run: ${manifest.run_id}`,
    `Proposal count: ${manifest.proposals.length}`,
    '',
    '> Draft proposals only. Nothing here is an official pick until human-verified and locked in the Platinum Rose ledger.',
    '',
    '## Candidates',
    '',
  ];
  if (!manifest.proposals.length) {
    lines.push('_No proposals exported._');
  } else {
    for (const p of manifest.proposals) {
      const status = p.readiness.proposal_ready ? 'proposal-ready' : 'needs work';
      const hold = p.readiness.exacta_hold ? ' - exacta hold' : '';
      lines.push(`- **${p.selection}** (${p.market_type}) - ${p.book} ${p.price ?? ''} - ${p.stake_units}u - ${status}${hold}`);
      if (p.readiness.errors.length) lines.push(`  - Errors: ${p.readiness.errors.join(' | ')}`);
      if (p.readiness.warnings.length) lines.push(`  - Warnings: ${p.readiness.warnings.join(' | ')}`);
      lines.push(`  - File: ${p.file}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

async function exportOfficialProposalDrafts(finalCandidates, dossier, meta, officialConfig) {
  if (!PROPOSAL_OUT_DIR) return null;
  const outDir = path.resolve(ROOT, PROPOSAL_OUT_DIR);
  await mkdir(outDir, { recursive: true });
  const manifest = {
    generated_at: new Date().toISOString(),
    run_id: meta.run_id,
    source: 'agents/portfolio-synthesize.js',
    proposal_out_dir: path.relative(ROOT, outDir),
    proposals: [],
  };
  for (const candidate of finalCandidates) {
    const proposal = candidateToOfficialProposal(candidate, dossier, meta, officialConfig);
    const readiness = proposalReadiness(officialConfig, proposal);
    proposal.data_snapshot.proposal_readiness = readiness;
    const fileName = [
      meta.date,
      proposalSlug(proposal.team || proposal.market_type),
      proposalSlug(proposal.market_type),
      proposalSlug(proposal.selection),
      proposal.pick_id.slice(0, 8),
    ].join('-') + '.json';
    const filePath = path.join(outDir, fileName);
    await writeFile(filePath, JSON.stringify(proposal, null, 2) + '\n', 'utf8');
    manifest.proposals.push({
      pick_id: proposal.pick_id,
      selection: proposal.selection,
      market_type: proposal.market_type,
      book: proposal.book,
      price: proposal.price,
      stake_units: proposal.stake_units,
      file: path.relative(ROOT, filePath),
      readiness,
    });
  }
  const manifestBase = path.join(outDir, `candidate-inbox-${meta.date}-${meta.run_id.slice(0, 8)}`);
  await writeFile(`${manifestBase}.json`, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  await writeFile(`${manifestBase}.md`, renderProposalInboxMarkdown(manifest), 'utf8');
  console.log(`   proposal drafts: ${manifest.proposals.length} exported to ${path.relative(ROOT, outDir)}`);
  console.log(`   candidate inbox: ${manifestBase}.md`);
  return manifest;
}

function legPayout(price, stake = 1) {
  const dp = decimalPayout(price);
  return dp == null ? null : round(stake * dp, 4); // total return (stake + profit) if the leg hits
}
function legProfit(price, stake = 1) {
  const p = legPayout(price, stake);
  return p == null ? null : round(p - stake, 4);
}
// Sequential same-team ladder (e.g. Over 9.5 wins -> Playoffs -> Super Bowl).
// "Self-funding": each leg's net_stake_after_prior_wins assumes every earlier
// leg ALSO hit and its profit is applied toward the next leg's full stake —
// an optimistic planning view (legs resolve in real sequence over a season,
// so this is "if the story keeps playing out", not a guarantee). Reports both
// the full-exposure view (stake every leg independently) and the self-funding
// view side by side so Andy can pick either approach when actually staking.
function ladderMath(legs, unitStake = 1) {
  let bankedProfit = 0;
  const out = [];
  for (const leg of legs) {
    const netStake = round(Math.max(0, unitStake - bankedProfit), 4);
    const fundedByPriorWins = round(Math.min(unitStake, bankedProfit), 4);
    const profit = legProfit(leg.price, unitStake);
    out.push({ ...leg, full_stake: unitStake, net_stake_after_prior_wins: netStake, funded_by_prior_wins: fundedByPriorWins, profit_at_full_stake: profit });
    if (profit != null) bankedProfit += profit; // running total assumes this leg also hit
  }
  return { legs: out, total_full_exposure: round(unitStake * legs.length, 4), final_banked_profit_if_all_hit: round(bankedProfit, 4) };
}
// Hedge basket: N small stakes on combo-market longshots, pure insurance math
// (not an edge claim) — no running/self-funding logic, each leg is independent.
function hedgeBasketMath(legs, unitStake = 1) {
  const out = legs.map((leg) => ({ ...leg, stake: unitStake, payout_if_hit: legPayout(leg.price, unitStake), profit_if_hit: legProfit(leg.price, unitStake) }));
  return { legs: out, total_stake: round(unitStake * legs.length, 4) };
}

// Resolves one named leg (market + selection, as the model wrote it) to its
// REAL dossier price/book — the model's own cited price/book (if any) is
// ignored entirely for these structures; this is planning math, not a claim
// about a specific number, so it always uses the dossier's current placeable
// best price, same fields validateRecommendation checks against.
function resolveLegAgainstDossier(leg, dossier) {
  const row = findDossierRowFor(dossier, leg?.market, leg?.selection);
  if (!row) return { ok: false, reason: `No dossier row for market="${leg?.market}" selection="${leg?.selection}".` };
  const isWinsRow = row.consensus_line != null;
  const side = isWinsRow ? sideOfSelection(leg.selection) : null;
  let book = null, price = null;
  if (isWinsRow) {
    if (side === 'under') { book = row.best_under_book; price = row.best_under; }
    else if (side === 'over') { book = row.best_over_book; price = row.best_over; }
  } else { book = row.best_book; price = row.best_price; }
  if (price == null) return { ok: false, reason: `Dossier has no placeable price for ${leg.selection} (${leg.market}).` };
  return {
    ok: true,
    market: leg.market,
    selection: leg.selection,
    price,
    book,
    code_prob: deterministicFairFor(row, side),
    code_prob_ci90: deterministicFairLowerFor(row, side) == null ? null : {
      lower: deterministicFairLowerFor(row, side),
      upper: isWinsRow
        ? (side === 'under' ? row.sim_win_total?.under_ci90?.upper : row.sim_win_total?.over_ci90?.upper)
        : row.sim?.prob_ci90?.upper,
    },
  };
}
function validateParlayLadder(ladder, dossier) {
  const resolved = [], notes = [];
  for (const leg of (ladder?.legs || [])) {
    const r = resolveLegAgainstDossier(leg, dossier);
    if (r.ok) resolved.push({ ...r, role: leg.role || null }); else notes.push(r.reason);
  }
  if (!resolved.length) return { status: 'invalid', reason: `No legs resolved against the dossier for team="${ladder?.team}": ${notes.join(' ')}` };
  const math = ladderMath(resolved);
  return { status: notes.length ? 'flagged' : 'ok',
    ladder: { team: ladder.team, thesis: ladder.thesis, proposed_by: ladder.proposed_by, ...math, unresolved_legs: notes } };
}
function validateHedgeBasket(basket, dossier) {
  const resolved = [], notes = [];
  for (const leg of (basket?.legs || [])) {
    const r = resolveLegAgainstDossier(leg, dossier);
    if (r.ok) resolved.push({ ...r, role: leg.role || null }); else notes.push(r.reason);
  }
  if (!resolved.length) return { status: 'invalid', reason: `No legs resolved against the dossier: ${notes.join(' ')}` };
  const math = hedgeBasketMath(resolved);
  return { status: notes.length ? 'flagged' : 'ok',
    basket: { primary_hedged_against: basket.primary_hedged_against || [], thesis: basket.thesis, proposed_by: basket.proposed_by, ...math, unresolved_legs: notes } };
}

function sumNumbers(xs) {
  return round(xs.reduce((acc, x) => acc + (Number.isFinite(Number(x)) ? Number(x) : 0), 0), 4);
}
function legLabel(leg) {
  return `${leg.selection || '?'} (${leg.market || '?'})`;
}
function matchupTeams(selection) {
  const parts = String(selection || '').split(/\s+(?:vs\.?|v\.?)\s+/i).map((x) => normalizeTeam(x)).filter(Boolean);
  return parts.length === 2 ? parts : [];
}
function classifyExactaRole(leg, primary = []) {
  if (leg.market !== 'superbowl_matchup') return null;
  const teams = matchupTeams(leg.selection);
  if (teams.length !== 2) return 'unknown_exacta_role';
  const anchors = new Set((primary || []).map((x) => normalizeTeam(x)).filter(Boolean));
  const nAnchors = teams.filter((t) => anchors.has(t)).length;
  if (nAnchors === 2) return 'anchor_correlation_amplifier';
  if (nAnchors === 1) return 'opponent_coverage';
  return 'anchor_failure_coverage';
}
function basketTerminalPayoff(basket) {
  const legs = basket.legs || [];
  const totalStake = basket.total_stake ?? sumNumbers(legs.map((l) => l.stake));
  const scenarios = legs.map((leg) => ({
    scenario: leg.bet,
    prob: leg.code_prob ?? null,
    prob_ci90: leg.code_prob_ci90 ?? null,
    net_units_if_hits: leg.payout_if_hit == null ? null : round(leg.payout_if_hit - totalStake, 4),
    exacta_role: leg.exacta_role || null,
  }));
  const knownProb = scenarios.every((s) => s.prob != null);
  return {
    assumption: 'Basket legs are scored as mutually exclusive terminal winners; unresolved joint paths stay out of expected value.',
    total_stake_units: totalStake,
    expected_net_units: knownProb ? round(scenarios.reduce((sum, s, i) => sum + Number(s.prob) * Number(legs[i].payout_if_hit || 0), 0) - totalStake, 4) : null,
    no_leg_hits_net_units: round(-totalStake, 4),
    scenarios,
  };
}
function collectRawPlayoffHedgePlans(rawStrategies) {
  const plans = [];
  for (const strategy of rawStrategies || []) {
    for (const plan of (strategy.playoff_hedge_plan || [])) {
      plans.push({
        trigger: plan.trigger || null,
        action: plan.action || null,
        reserved_bankroll: plan.reserved_bankroll || null,
        proposed_by: strategy.proposed_by || null,
      });
    }
  }
  return plans;
}
function rawStrategyLabel(x) {
  if (!x) return null;
  if (typeof x === 'string') return x;
  return x.team || x.selection || x.bet || x.position || x.market || null;
}
function collectRawLabels(rawStrategies, key) {
  const labels = [];
  for (const strategy of rawStrategies || []) {
    const xs = strategy[key];
    if (!Array.isArray(xs)) continue;
    for (const x of xs) {
      const label = rawStrategyLabel(x);
      if (label) labels.push(label);
    }
  }
  return [...new Set(labels)];
}
function defaultPlayoffHedgePlans(primary, baskets, ladders) {
  const plans = [];
  if (primary?.length) {
    plans.push({
      trigger: 'Any anchor position reaches a conference championship or the Super Bowl matchup is set.',
      action: 'Price the live opponent hedge and compare guaranteed profit versus holding the anchor ticket.',
      reserved_bankroll: 'Use a preassigned pocket-hedge reserve plus realized ladder profits, if available.',
      proposed_by: 'code_default',
    });
  }
  if (baskets?.length) {
    plans.push({
      trigger: 'A coverage/exacta basket leg becomes live deep in the playoffs.',
      action: 'Price the opposite side or opponent moneyline before kickoff; hedge only if it improves minimum portfolio outcome.',
      reserved_bankroll: 'Use the basket as option value; do not add hedge stake unless the live path creates real lock-in value.',
      proposed_by: 'code_default',
    });
  }
  if (ladders?.length) {
    plans.push({
      trigger: 'A ladder funding leg wins before the next futures leg is placed or hedged.',
      action: 'Allocate realized profit toward the next option bet or keep it as playoff pocket-hedge bankroll.',
      reserved_bankroll: 'Earlier ladder profits first; avoid increasing dead cost if the funding leg misses.',
      proposed_by: 'code_default',
    });
  }
  return plans;
}
function ladderScenario(ladder) {
  const legs = ladder.legs || [];
  const steps = legs.map((leg, i) => ({
    bet: legLabel(leg),
    role: leg.role || (i < legs.length - 1 ? 'funding_leg' : 'option_bet'),
    market: leg.market,
    selection: leg.selection,
    price: leg.price,
    book: leg.book,
    full_stake: leg.full_stake,
    net_stake_after_prior_wins: leg.net_stake_after_prior_wins,
    funded_by_prior_wins: leg.funded_by_prior_wins,
    profit_at_full_stake: leg.profit_at_full_stake,
  }));
  return {
    team: ladder.team || null,
    role: 'ladder_bet',
    thesis: ladder.thesis || null,
    proposed_by: ladder.proposed_by || null,
    steps,
    intent: 'Earlier funding legs can reduce or eliminate the cash cost of later option bets if the team thesis keeps playing out.',
    dead_cost: {
      if_all_legs_prepositioned: ladder.total_full_exposure ?? null,
      if_strict_sequence: steps[0]?.full_stake ?? null,
    },
    funded_liability: {
      by_prior_wins: sumNumbers(steps.map((s) => s.funded_by_prior_wins)),
      final_banked_profit_if_all_hit: ladder.final_banked_profit_if_all_hit ?? null,
    },
    unresolved_legs: ladder.unresolved_legs || [],
  };
}
function basketScenario(basket, primary = []) {
  const legs = (basket.legs || []).map((leg) => ({
    bet: legLabel(leg),
    role: leg.role || 'option_bet',
    market: leg.market,
    selection: leg.selection,
    price: leg.price,
    book: leg.book,
    stake: leg.stake,
    payout_if_hit: leg.payout_if_hit,
    profit_if_hit: leg.profit_if_hit,
    code_prob: leg.code_prob ?? null,
    code_prob_ci90: leg.code_prob_ci90 ?? null,
    exacta_role: classifyExactaRole(leg, primary),
  }));
  const scenario = {
    role: 'coverage_bet',
    primary_hedged_against: basket.primary_hedged_against || [],
    thesis: basket.thesis || null,
    proposed_by: basket.proposed_by || null,
    legs,
    dead_cost: { if_all_legs_fail: basket.total_stake ?? null },
    funded_liability: { if_one_leg_hits: 'See each leg payout_if_hit/profit_if_hit.' },
    unresolved_legs: basket.unresolved_legs || [],
  };
  scenario.terminal_payoff_table = basketTerminalPayoff(scenario);
  return scenario;
}
function coverageKey(selection) {
  return String(selection || '')
    .replace(/\s+\([^)]*\)\s*$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
function addCoveragePosition(out, seen, pos) {
  const key = coverageKey(pos.selection);
  if (!key) return;
  const prior = seen.get(key);
  if (prior) {
    const merged = [...new Set([...(prior.primary_hedged_against || []), ...(pos.primary_hedged_against || [])])];
    prior.primary_hedged_against = merged;
    return;
  }
  seen.set(key, pos);
  out.push(pos);
}
function buildPortfolioStrategy({ primary, baskets, ladders, rawStrategies, scenarioReview, invalidStacks }) {
  const ladderStacks = (ladders || []).map(ladderScenario);
  const coverageBaskets = (baskets || []).map((b) => basketScenario(b, primary));
  const rawAnchors = collectRawLabels(rawStrategies, 'anchor_positions');
  const rawCoverage = collectRawLabels(rawStrategies, 'coverage_positions');
  const anchorNames = [...new Set([...(primary || []), ...rawAnchors])];
  const rawPlans = collectRawPlayoffHedgePlans(rawStrategies);
  const playoffHedgePlan = rawPlans.length ? rawPlans : defaultPlayoffHedgePlans(primary, baskets, ladders);
  const basketStake = sumNumbers((baskets || []).map((b) => b.total_stake));
  const ladderFullExposure = sumNumbers((ladders || []).map((l) => l.total_full_exposure));
  const ladderStrictExposure = sumNumbers((ladders || []).map((l) => l.legs?.[0]?.full_stake));
  const fundedLiability = sumNumbers(ladderStacks.flatMap((l) => (l.steps || []).map((s) => s.funded_by_prior_wins)));
  const coveragePositions = [];
  const seenCoverage = new Map();
  const unresolvedRawCoverage = [];
  for (const basket of coverageBaskets) {
    for (const leg of basket.legs) {
      addCoveragePosition(coveragePositions, seenCoverage, {
        selection: leg.bet,
        role: leg.exacta_role || 'coverage_bet',
        primary_hedged_against: basket.primary_hedged_against,
      });
    }
  }
  for (const selection of rawCoverage) {
    if (seenCoverage.has(coverageKey(selection))) {
      addCoveragePosition(coveragePositions, seenCoverage, { selection, role: 'coverage_bet', primary_hedged_against: [] });
    } else {
      unresolvedRawCoverage.push({
        selection,
        role: 'coverage_bet',
        reason: 'Model proposed this in portfolio_strategy.coverage_positions, but no validated hedge-basket leg resolved it against the dossier.',
      });
    }
  }
  return {
    strategy_type: 'playoff_scenario_book',
    status: (anchorNames.length || baskets?.length || ladders?.length || playoffHedgePlan.length) ? 'active' : 'not_proposed',
    anchor_positions: anchorNames.map((team) => ({
      team,
      role: 'anchor_bet',
      note: (primary || []).includes(team) ? 'Human-provided core conviction position.' : 'Model-proposed scenario-book anchor.',
    })),
    coverage_positions: coveragePositions,
    unresolved_raw_coverage_positions: unresolvedRawCoverage,
    ladder_stacks: ladderStacks,
    coverage_baskets: coverageBaskets,
    playoff_hedge_plan: playoffHedgePlan,
    exposure_summary: {
      basket_total_stake: basketStake,
      ladder_full_exposure: ladderFullExposure,
      max_dead_cost_if_all_prepositioned: round(basketStake + ladderFullExposure, 4),
      max_dead_cost_if_strict_ladders: round(basketStake + ladderStrictExposure, 4),
      funded_liability_if_ladders_hit: fundedLiability,
      invalidated_structure_count: (invalidStacks || []).length,
    },
    role_taxonomy: {
      anchor_bet: 'Primary conviction position.',
      ladder_bet: 'Early leg intended to fund or reduce liability on later legs.',
      coverage_bet: 'High-odds ticket covering a playoff path or matchup branch.',
      anchor_correlation_amplifier: 'Exacta containing both anchor teams; it amplifies the same core thesis rather than hedging it.',
      opponent_coverage: 'Exacta containing exactly one anchor team; it diversifies that anchor path across possible opponents.',
      anchor_failure_coverage: 'Exacta containing no anchor teams; it is the closest matchup-ticket form of anchor-miss coverage.',
      option_bet: 'Long-odds ticket bought mainly for later hedge value.',
      pocket_hedge: 'Future playoff bet reserved against an existing ticket.',
      dead_cost: 'Unrecovered cost if the structure fails.',
      funded_liability: 'Later stake effectively paid by earlier wins.',
    },
    risk_review: scenarioReview || null,
    raw_strategy_count: (rawStrategies || []).length,
  };
}

// ── Stage 2 (Skeptic) merge ────────────────────────────────────────────────────
// Applies each verdict onto its candidate by key; kills go to a separate list
// (with the reason) instead of silently disappearing.
function applySkepticVerdicts(candidates, verdicts) {
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
      // 2026-09-03 (Andy): scale-in/wait-for-better-price pattern for anchor
      // positions -- carries the Risk/Editor's optional entry_plan (smaller
      // stake now + an explicit add_trigger price/condition) through instead
      // of silently dropping it, the way every other risk-editor field here
      // already does. null when the Risk/Editor didn't propose one (the
      // normal case -- a full-size entry or an outright pass).
      entry_plan: f.entry_plan || null,
    } : { ...c, risk_note: null });
  }
  return { final, passed };
}

// ── Ranking (code-owned, deterministic — Codex's own principle: the model
// proposes, code ranks/audits). These are now tags for a single card, not
// repeated page sections; the report renders one recommendation once.
function rankByAxis(final) {
  const byEdgeType = (t) => final.filter((c) => c.edge_type === t);
  const mathEdge = byEdgeType('math').length ? byEdgeType('math') : [...final];
  mathEdge.sort((a, b) => (b.edge_lower_bound_pct ?? b.code_edge_pct ?? b.edge_pct ?? -Infinity) - (a.edge_lower_bound_pct ?? a.code_edge_pct ?? a.edge_pct ?? -Infinity));

  const thesisEdge = byEdgeType('thesis');
  thesisEdge.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  const stalePriceEdge = byEdgeType('stale_price');
  stalePriceEdge.sort((a, b) => (b.edge_lower_bound_pct ?? b.code_edge_pct ?? b.edge_pct ?? -Infinity) - (a.edge_lower_bound_pct ?? a.code_edge_pct ?? a.edge_pct ?? -Infinity));

  const lowCorrelationAdds = final
    .filter((c) => !(c.correlated_week1 && c.correlated_week1.length) && c.stake_tier !== 'speculative')
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  const isTrueLongshot = (c) => c.type === 'longshot' || c.edge_type === 'longshot' || Number(c.price) >= 500;
  const longshots = final
    .filter(isTrueLongshot)
    .sort((a, b) => (b.edge_lower_bound_pct ?? b.code_edge_pct ?? b.edge_pct ?? -Infinity) - (a.edge_lower_bound_pct ?? a.code_edge_pct ?? a.edge_pct ?? -Infinity));

  const ranked = {
    all: final,
    math_edge: mathEdge.slice(0, MAX_PLAYS),
    thesis_edge: thesisEdge,
    stale_price_edge: stalePriceEdge,
    low_correlation_adds: lowCorrelationAdds,
    longshots,
  };
  const categoryDefs = [
    ['math_edge', 'Strongest Math'],
    ['thesis_edge', 'Strongest Thesis'],
    ['stale_price_edge', 'Stale Price'],
    ['low_correlation_adds', 'Low Correlation'],
    ['longshots', 'Longshot'],
  ];
  for (const rec of final) {
    const tags = [];
    for (const [key, label] of categoryDefs) {
      if ((ranked[key] || []).some((x) => x.key === rec.key)) tags.push(label);
    }
    rec.report_tags = tags;
  }
  return ranked;
}

// ── render ───────────────────────────────────────────────────────────────────
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const attr = (s) => esc(s).replace(/"/g, '&quot;');
function labelMarket(market) {
  const m = String(market || '').toLowerCase();
  if (m === 'playoffs') return 'Make the Playoffs';
  if (m === 'wins') return 'Win Total';
  if (m === 'superbowl') return 'Win Super Bowl';
  if (m === 'superbowl_matchup') return 'Super Bowl Matchup';
  if (m === 'conference_afc') return 'Win AFC';
  if (m === 'conference_nfc') return 'Win NFC';
  if (m === 'division_exact_position') return 'Division Finish';
  if (m.startsWith('division_')) return 'Win Division';
  return String(market || 'Market').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
function humanizeMarketRefs(text) {
  return String(text || '')
    .replace(/\(superbowl_matchup\)/g, '(Super Bowl Matchup)')
    .replace(/\(conference_afc\)/g, '(Win AFC)')
    .replace(/\(conference_nfc\)/g, '(Win NFC)')
    .replace(/\(superbowl\)/g, '(Win Super Bowl)')
    .replace(/\(playoffs\)/g, '(Make the Playoffs)')
    .replace(/\(wins\)/g, '(Win Total)')
    .replace(/\bsuperbowl_matchup\b/g, 'Super Bowl Matchup')
    .replace(/\bconference_afc\b/g, 'Win AFC')
    .replace(/\bconference_nfc\b/g, 'Win NFC');
}
function labelType(type) {
  const t = String(type || '').toLowerCase();
  if (t === 'favorite') return 'Favorite Price';
  if (t === 'longshot') return 'Longshot';
  if (t === 'value') return 'Value Price';
  if (t === 'hedge') return 'Hedge / Coverage';
  return String(type || 'Pick Type').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
function labelEdgeType(edgeType) {
  const e = String(edgeType || '').toLowerCase();
  if (e === 'thesis') return 'Thesis Edge';
  if (e === 'math') return 'Math Edge';
  if (e === 'stale_price') return 'Stale Price';
  if (e === 'longshot') return 'Longshot Edge';
  return String(edgeType || 'Edge Type').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
function labelStakeTier(tier) {
  const t = String(tier || '').toLowerCase();
  if (t === 'core') return 'Core Stake';
  if (t === 'standard') return 'Standard Stake';
  if (t === 'small') return 'Small Stake';
  if (t === 'speculative') return 'Small / Speculative';
  return String(tier || 'Stake Tier').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
function labelRole(role) {
  return String(role || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
function percent(n) {
  if (n == null || Number.isNaN(Number(n))) return null;
  return `${round(Number(n) * 100, 1)}%`;
}
function badge(cls, text, help) {
  return `<span class="${esc(cls)}" title="${attr(help)}">${esc(text)}</span>`;
}
function badgeKeyHTML() {
  const items = [
    ['Market', 'What bet market this card is about, such as Make the Playoffs, Win Total, or Super Bowl Matchup.'],
    ['Pick Type', 'The shape of the bet: favorite price, value bet, longshot, or hedge.'],
    ['Edge Type', 'Why it is here: math edge is code-supported price value; thesis-driven means football/portfolio logic carries the case.'],
    ['Needs Review', 'The report is asking for human judgment before action, usually because the price is expensive, evidence conflicts, or portfolio correlation matters.'],
    ['Board Validator Flag', 'A mechanical, code-owned check failed (bettable book, thin-market n_books>=3 kill switch, sim-price-only market policy, or a dossier-edge cross-check) — kept visible per annotate-and-keep policy, not auto-dropped. Treat as a hard stop-and-review, not a stylistic warning.'],
    ['Stake Tier', 'Suggested sizing bucket only. Speculative means small/coverage exposure, not a core position.'],
    ['Fair / Edge', 'Fair is the model probability. Edge is expected value at the shown quote using that fair probability.'],
    ['Simulation', 'Offline code forecast used as validation: probability, uncertainty range, and lower-bound edge when available.'],
    ['Threshold', 'The worst price the report would normally accept. If the current quote is worse than the threshold, it is usually a pass or wait.'],
    ['Source Quality', 'How traceable the supporting source trail is: named expert plus timestamp is strongest; no source trail is weakest.'],
  ];
  return `<details class="key" open><summary>How to read a pick card</summary><p>The first badges name the market, price profile, and why the pick surfaced. Price shows the best placeable book in the dossier. Fair probability is the model estimate; edge compares that fair probability to the current price. Needs Review means the pick has conflict, correlation, expensive pricing, or another reason for human judgment before action.</p><div class="key-grid">${items.map(([k, v]) => `<div><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join('')}</div></details>`;
}
function isNamedPodcastHost(host) {
  return !!host && !/^(guest|unknown|unclear|unattributed)$/i.test(String(host).trim());
}
function sourceQuality(rec) {
  const signals = rec?.dossier_signals || [];
  const podcastSignals = signals.filter((s) => s.podcast_evidence);
  if (podcastSignals.some((s) => isNamedPodcastHost(s.podcast_evidence.host) && s.podcast_evidence.timestamp)) {
    return {
      key: 'named-timestamp',
      label: 'Named Expert + Timestamp',
      help: 'At least one supporting podcast source has a named speaker and timestamp in the local summary.',
    };
  }
  if (podcastSignals.some((s) => isNamedPodcastHost(s.podcast_evidence.host))) {
    return {
      key: 'named-no-timestamp',
      label: 'Named Expert, No Timestamp',
      help: 'At least one supporting podcast source has a named speaker, but the local summary has no timestamp yet.',
    };
  }
  if (podcastSignals.length) {
    return {
      key: 'unattributed',
      label: 'Unattributed Speaker',
      help: 'A matching podcast source exists, but the speaker is unknown, guest-labeled, or unattributed.',
    };
  }
  if (signals.length || rec?.sources?.length || rec?.evidence_resolved?.some((e) => e.resolved)) {
    return {
      key: 'episode-article',
      label: 'Episode-only / Article-only',
      help: 'The report has source or dossier context, but no named timestamped podcast speaker is linked to this card.',
    };
  }
  return {
    key: 'none',
    label: 'No Source Trail',
    help: 'No expert, podcast, article, or resolved dossier source trail is attached to this offline corpus card.',
  };
}
function sourceQualityBadgeHTML(rec) {
  const q = sourceQuality(rec);
  return badge(`sq sq-${q.key}`, q.label, q.help);
}
function sourceLabel(type) {
  if (type === 'market-row lean sample') return 'direct market lean';
  if (type === 'normalized experts map') return 'expert/source map';
  return 'dossier';
}
function marketPhrase(market) {
  const fam = marketFamily(market);
  if (fam === 'wins') return 'win-total';
  if (fam === 'playoffs') return 'playoff';
  if (fam === 'division') return 'division';
  if (fam === 'conference') return 'conference';
  if (fam === 'superbowl') return 'Super Bowl';
  return String(market || 'related');
}
function directionPhrase(direction, market) {
  const dir = String(direction || '').toLowerCase();
  const fam = marketFamily(market);
  if (dir === 'over') return 'liked the Over';
  if (dir === 'under') return 'liked the Under';
  if (dir === 'favor') return fam === 'wins' ? 'leaned Over' : 'backed the team';
  if (dir === 'against') return fam === 'wins' ? 'leaned Under' : 'faded the team';
  if (dir === 'back') return fam === 'wins' ? 'leaned Over' : 'backed the team';
  if (dir === 'fade') return fam === 'wins' ? 'leaned Under' : 'faded the team';
  return 'had a related note';
}
function podcastHostLabel(evidence) {
  const host = evidence?.host;
  if (!host) return null;
  if (/^(guest|unknown|unclear|unattributed)$/i.test(host)) return `Unattributed speaker on ${evidence.show}`;
  return host;
}
function podcastSourceText(evidence) {
  if (!evidence) return null;
  const episode = evidence.episode ? `"${evidence.episode}"` : null;
  const date = evidence.episode_date ? ` (${evidence.episode_date})` : '';
  const time = evidence.timestamp ? ` at ${evidence.timestamp}` : ' (timestamp unavailable in local summary)';
  return `source: ${evidence.show}${episode ? ` - ${episode}` : ''}${date}${time}`;
}
function signalSentence(s) {
  const evidence = s.podcast_evidence;
  const actor = podcastHostLabel(evidence) || s.who;
  const base = `${actor} ${directionPhrase(evidence?.lean || s.direction, s.market)} in the ${marketPhrase(s.market)} market`;
  const source = podcastSourceText(evidence) || `from the ${sourceLabel(s.source_type)}`;
  const strength = s.strength != null ? `confidence ${s.strength}` : null;
  const sourcePick = evidence?.pick && evidence.pick !== s.why ? `source note: ${evidence.pick}` : null;
  const why = s.why ? `dossier note: ${s.why}` : null;
  return [base, source, strength, why, sourcePick].filter(Boolean).join('; ');
}
function signalSentenceHTML(s) {
  const evidence = s.podcast_evidence;
  const sentence = esc(signalSentence(s));
  if (!evidence?.summary_url) return sentence;
  return `${sentence} <a href="${attr(evidence.summary_url)}">podcast summary</a>`;
}
function signalBlockHTML(signals) {
  if (!signals?.length) return '';
  const group = (label) => signals.filter((s) => s.alignment === label);
  const row = (label, explainer, items) => items.length
    ? `<div><b>${esc(label)}:</b> ${esc(explainer)}<ul>${items.map((s) => `<li>${signalSentenceHTML(s)}</li>`).join('')}</ul></div>`
    : '';
  return `<div class="ds"><b>Expert and source context</b><div class="meta">Offline dossier signals only. Podcast names come from the local host-summary file when available; timestamps appear only when the local summary includes one.</div>${row('Supports this pick', 'These signals point in the same general direction as the recommendation.', group('aligned'))}${row('Pushes against it', 'These signals point the other way or warn against the same team thesis.', group('opposing'))}${row('Related, not direct support', 'These mention the same team but are not a clean match for this market.', group('related'))}</div>`;
}
function signalBlockMD(signals) {
  if (!signals?.length) return '';
  const labels = [
    ['aligned', 'Supports this pick'],
    ['opposing', 'Pushes against it'],
    ['related', 'Related, not direct support'],
  ];
  const bits = labels.flatMap(([key, label]) => {
    const items = signals.filter((s) => s.alignment === key);
    return items.length ? [`  - ${label}: ${items.map(signalSentence).join('; ')}`] : [];
  });
  return bits.length ? `\n  - Expert and source context: offline dossier signals only; not fresh analyst claims.\n${bits.join('\n')}` : '';
}
function impliedProbFromPrice(price) {
  const dp = decimalPayout(price);
  return dp ? 1 / dp : null;
}
function simulationSentence(r) {
  if (r?.code_fair_prob == null) return null;
  const simFair = percent(r.code_fair_prob) || r.code_fair_prob;
  const implied = percent(impliedProbFromPrice(r.price));
  const lowProb = r.code_fair_prob_ci90?.lower != null ? percent(r.code_fair_prob_ci90.lower) : null;
  const highProb = r.code_fair_prob_ci90?.upper != null ? percent(r.code_fair_prob_ci90.upper) : null;
  const range = lowProb && highProb ? `uncertainty range ${lowProb}-${highProb}` : null;
  const edge = r.code_edge_pct != null ? `code edge ${r.code_edge_pct}%` : null;
  const lowerEdge = r.edge_lower_bound_pct != null ? `lower-bound edge ${r.edge_lower_bound_pct}%` : null;
  const impliedText = implied ? `market price implies about ${implied}` : null;
  return [`Code forecast estimates this outcome at ${simFair}`, impliedText, range, edge, lowerEdge].filter(Boolean).join('; ') + '.';
}
function simulationBlockHTML(r) {
  const sentence = simulationSentence(r);
  if (!sentence) return '';
  return `<div class="sim"><b>Monte Carlo / code forecast</b><div>${esc(sentence)}</div><div class="meta">Use this as a validation layer: it checks whether the recommendation still works under the offline forecast, not as a standalone order to bet.</div></div>`;
}
function simulationBlockMD(r) {
  const sentence = simulationSentence(r);
  return sentence ? `\n  - Monte Carlo / code forecast: ${sentence} Use this as validation, not a standalone order to bet.` : '';
}
function teamDisplayName(team) {
  const key = normalizeTeam(team) || team;
  return NFL_TEAMS[key]?.fullName || key || 'Other';
}
function groupRecommendationsByTeam(recs = []) {
  const groups = new Map();
  for (const rec of recs) {
    const team = teamDisplayName(rec.display_team || rec.selection);
    if (!groups.has(team)) groups.set(team, []);
    groups.get(team).push(rec);
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}
function reportTags(rec) {
  return rec.report_tags?.length ? rec.report_tags : [labelEdgeType(rec.edge_type)];
}
function anchorId(prefix, value) {
  const slug = String(value || 'section').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section';
  return `${prefix}-${slug}`;
}
function recommendationBlurb(rec) {
  const tags = reportTags(rec).join(' and ');
  const action = rec.timing?.action === 'pass' ? 'is currently a pass/wait' : rec.timing?.action === 'bet_now' ? 'is marked as playable now if the price holds' : 'is mainly a watch/wait candidate';
  const coverage = /coverage|exacta|hedge/i.test(`${rec.thesis || ''} ${rec.market_view || ''} ${rec.football_view || ''} ${rec.risk_note || ''}`)
    ? ' but appears most useful as portfolio or exacta coverage rather than a clean standalone bet'
    : '';
  return `${rec.selection} matches ${tags}; it ${action}${coverage}.`;
}
function quickReadHTML(recs = []) {
  if (!recs.length) return '<p>No final recommendations survived validation.</p>';
  const items = recs.map((r) => `<li>${esc(recommendationBlurb(r))}</li>`).join('');
  return `<div class="quick"><b>Quick read</b><ul>${items}</ul></div>`;
}
function teamQuickReadHTML(rows = []) {
  if (!rows.length) return '';
  return `<div class="team-read">${rows.map((r) => `<p>${esc(recommendationBlurb(r))}</p>`).join('')}</div>`;
}
function teamSectionsHTML(recs = []) {
  const groups = groupRecommendationsByTeam(recs);
  if (!groups.length) return '<p>No final recommendations survived validation.</p>';
  return groups.map(([team, rows]) => `<details class="team-section" id="${attr(anchorId('team', team))}" open><summary>${esc(team)} (${rows.length})</summary>${teamQuickReadHTML(rows)}${rows.map(recCard).join('')}</details>`).join('');
}
function reportTOCHTML(ranked, { ladders = [], baskets = [], passed = [], killed = [], watchCount = 0 } = {}) {
  const teams = groupRecommendationsByTeam(ranked?.all || []);
  const teamLinks = teams.map(([team, rows]) => `<a class="toc-team" href="#${attr(anchorId('team', team))}">${esc(team)} <span>${rows.length}</span></a>`).join('');
  const sections = [
    ['#human-watchlist', 'Human Watchlist', null],
    ['#scenario-book', 'Scenario Book', null],
    ['#parlay-ladders', 'Parlay Ladders', ladders.length],
    ['#hedge-baskets', 'Hedge Baskets', baskets.length],
    ['#passed-killed', 'Passed / Killed', passed.length + killed.length],
    ['#watch-list', 'Watch List', watchCount],
    ['#construction-notes', 'Notes', null],
  ].map(([href, label, count]) => `<a href="${href}">${esc(label)}${count == null ? '' : ` <span>${esc(count)}</span>`}</a>`).join('');
  return `<nav class="toc" aria-label="Report table of contents"><b>Jump to</b><div>${teamLinks || '<span class="muted">No surviving teams</span>'}</div><div>${sections}</div></nav>`;
}
function recCard(r) {
  const t = r.timing || {};
  const wk1 = (r.correlated_week1 || []).map((w) => `${esc(w.game)}: ${esc(w.bet)} (${esc(w.relationship)})`).join('; ');
  const modelAgree = r.agreement ? `${r.agreement.count} of ${r.agreement.of}` : '';
  const thresholdState = r.bet_threshold ? ` Threshold: ${r.bet_threshold}.` : '';
  const fair = percent(r.model_fair_prob) || r.model_fair_prob;
  const tags = reportTags(r).map((tag) => badge('tag', tag, `Report tag: ${tag}.`)).join(' ');
  return `<div class="rec ${esc(r.edge_type || '')}${r.validation?.length ? ' has-validation' : ''}">
    <div class="rh"><div class="pick-main"><b>${esc(r.selection)}</b> ${badge('mk', labelMarket(r.market), `Market: ${labelMarket(r.market)}.`)} ${badge('typ', labelType(r.type), `Price type: ${labelType(r.type)}.`)} ${badge('et', labelEdgeType(r.edge_type), `Edge type: ${labelEdgeType(r.edge_type)}.`)}${tags ? ` ${tags}` : ''}${r.knowledge_based ? ` ${badge('kb', 'Knowledge-Based', 'Uses external football knowledge and needs extra freshness review.')}` : ''}${r.needs_human_review ? ` ${badge('hr', 'Needs Review', 'Human review is required because this pick is expensive, conflicted, or portfolio-sensitive.')}` : ''}${r.validation?.length ? ` ${badge('bv', 'Board Validator Flag', 'Failed one or more mechanical checks (bettable book, thin-market kill switch, or dossier-edge cross-check). Kept visible per annotate-and-keep policy — review before betting.')}` : ''}</div>
      <div class="quote-cluster"><span class="pr" title="${attr(`Best verified placeable quote in the dossier.${thresholdState}`)}">${esc(r.price)} @ ${esc(String(r.book || '').toUpperCase())}</span>
      ${badge(`tier ${esc(r.stake_tier)}`, labelStakeTier(r.stake_tier), `Stake tier: ${labelStakeTier(r.stake_tier)}. This is a sizing bucket, not an instruction to bet.`)}
      <span class="conf" title="${attr('Analyst confidence score on a 0-100 scale.')}">Confidence ${esc(r.confidence)}</span></div></div>
    <div class="meta"><span title="${attr('Model fair probability estimate for this outcome.')}">Fair probability: ${esc(fair)}</span> &middot; <span title="${attr('Expected value at the shown price using model fair probability.')}">Estimated edge: ${esc(r.edge_pct)}%</span> ${modelAgree ? `&middot; <i title="${attr('How many participating models included this recommendation.')}">Models: ${esc(modelAgree)}</i>` : ''}${r.bet_threshold ? ` &middot; <span title="${attr('Worst price the report would normally accept before passing or waiting.')}">Play only at: ${esc(r.bet_threshold)}</span>` : ''}</div>
    <div class="source-line">${sourceQualityBadgeHTML(r)}</div>
    ${r.market_view ? `<div class="mv"><b>Market:</b> ${esc(r.market_view)}</div>` : ''}
    ${r.football_view ? `<div class="fv"><b>Football:</b> ${esc(r.football_view)}</div>` : ''}
    <div class="th">${esc(r.thesis)}</div>
    <div class="dis">⚠ ${esc(r.disconfirming_factor)}</div>
    ${r.validation?.length ? `<div class="bv-flag">🚫 Board validator: ${r.validation.map(esc).join(' &middot; ')}</div>` : ''}
    ${r.skeptic_note ? `<div class="sk">🕵 Skeptic (${esc(r.skeptic_verdict)}): ${esc(r.skeptic_note)}</div>` : ''}
    ${r.risk_note ? `<div class="rn">⚖ Risk: ${esc(r.risk_note)}</div>` : ''}
    ${r.entry_plan?.pattern === 'scale_in' ? `<div class="rn">📐 Scale-in: smaller entry now &middot; add at ${esc(r.entry_plan.add_trigger)}${r.entry_plan.note ? ` — ${esc(r.entry_plan.note)}` : ''}</div>` : ''}
    ${r.evidence_resolved?.length ? `<div class="ev">🔗 ${r.evidence_resolved.map((e) => `${esc(e.id)}${e.resolved ? `=${esc(JSON.stringify(e.value))}` : ' <span class="unresolved">(unresolved)</span>'}`).join(', ')}</div>` : (r.evidence_ids?.length ? `<div class="ev">🔗 ${esc(r.evidence_ids.join(', '))} <span class="unresolved">(unresolved — no dossier row match)</span></div>` : '')}
    ${r.sources?.length ? `<div class="src">📣 ${esc(r.sources.join(', '))}</div>` : ''}
    <div class="tim"><b>${esc(t.action)}</b>${t.trigger ? ` — trigger: ${esc(t.trigger)}` : ''}${t.expected_move ? ` · ${esc(t.expected_move)}` : ''}${t.rationale ? ` — ${esc(t.rationale)}` : ''}</div>
    ${simulationBlockHTML(r)}
    ${signalBlockHTML(r.dossier_signals)}
    ${wk1 ? `<div class="wk">Wk1 correlated: ${wk1}</div>` : ''}
  </div>`;
}
// 2026-07-22 addition: ladder/basket cards render a leg table instead of the
// single-bet recCard shape — a different structure, not a variant of it.
function legCell(leg, c) {
  if (c === 'market') return labelMarket(leg[c]);
  if (c === 'book') return String(leg[c] || '').toUpperCase();
  return leg[c];
}
function legRow(leg, cols) { return `<tr>${cols.map((c) => `<td>${esc(legCell(leg, c))}</td>`).join('')}</tr>`; }
function ladderCard(l) {
  const cols = ['market', 'selection', 'price', 'book', 'full_stake', 'net_stake_after_prior_wins', 'profit_at_full_stake'];
  const head = ['Market', 'Selection', 'Price', 'Book', 'Full stake', 'Net stake (self-funded)', 'Profit if hit'];
  return `<div class="rec ladder">
    <div class="rh"><b>${esc(l.team)}</b> <span class="et">PARLAY LADDER</span>${l.proposed_by ? ` <i>(${esc(l.proposed_by)})</i>` : ''}</div>
    <div class="th">${esc(l.thesis || '')}</div>
    <table class="stack-tbl"><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${(l.legs || []).map((leg) => legRow(leg, cols)).join('')}</tbody></table>
    <div class="meta">Total full exposure: ${esc(l.total_full_exposure)} units · banked profit if every leg hits: ${esc(l.final_banked_profit_if_all_hit)} units</div>
    ${l.unresolved_legs?.length ? `<div class="unresolved">⚠ ${l.unresolved_legs.map(esc).join('; ')}</div>` : ''}
  </div>`;
}
function basketCard(b) {
  const cols = ['market', 'selection', 'price', 'book', 'stake', 'payout_if_hit'];
  const head = ['Market', 'Selection', 'Price', 'Book', 'Stake', 'Payout if hit'];
  return `<div class="rec basket">
    <div class="rh"><b>Hedge basket</b>${b.primary_hedged_against?.length ? ` <span class="mk">vs ${esc(b.primary_hedged_against.join(', '))}</span>` : ''}${b.proposed_by ? ` <i>(${esc(b.proposed_by)})</i>` : ''}</div>
    <div class="th">${esc(b.thesis || '')}</div>
    <table class="stack-tbl"><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${(b.legs || []).map((leg) => legRow(leg, cols)).join('')}</tbody></table>
    <div class="meta">Total staked: ${esc(b.total_stake)} units</div>
    ${b.unresolved_legs?.length ? `<div class="unresolved">⚠ ${b.unresolved_legs.map(esc).join('; ')}</div>` : ''}
  </div>`;
}
function modelNames(byModel) {
  return Object.keys(byModel).filter((n) => !n.startsWith('__'));
}
function scenarioBookHTML(strategy) {
  if (!strategy || strategy.status === 'not_proposed') return '<p>No scenario book proposed this run.</p>';
  const exp = strategy.exposure_summary || {};
  const anchors = (strategy.anchor_positions || []).map((a) => `<li>${esc(a.team)} <span class="et">${esc(labelRole(a.role))}</span></li>`).join('');
  const coverage = (strategy.coverage_positions || []).slice(0, 12).map((c) => `<li>${esc(humanizeMarketRefs(c.selection))} <span class="et">${esc(labelRole(c.role))}</span></li>`).join('');
  const unresolvedCoverage = (strategy.unresolved_raw_coverage_positions || []).map((c) => `<li>${esc(humanizeMarketRefs(c.selection))} <span class="et">${esc(labelRole(c.role))}</span> <span class="hr">${esc(humanizeMarketRefs(c.reason))}</span></li>`).join('');
  const ladders = (strategy.ladder_stacks || []).map((l) => {
    const steps = (l.steps || []).map((s) => `${s.selection || s.bet} ${s.price != null ? `${s.price}@${s.book || '?'}` : ''}`.trim()).join(' -> ');
    return `<li><b>${esc(l.team || 'Ladder')}</b> <span class="et">${esc(l.role)}</span> — strict dead cost ${esc(l.dead_cost?.if_strict_sequence)}u; full exposure ${esc(l.dead_cost?.if_all_legs_prepositioned)}u; funded liability ${esc(l.funded_liability?.by_prior_wins)}u; banked if all hit ${esc(l.funded_liability?.final_banked_profit_if_all_hit)}u${steps ? `<div class="meta">${esc(steps)}</div>` : ''}</li>`;
  }).join('');
  const plans = (strategy.playoff_hedge_plan || []).map((p) => `<li><b>${esc(p.trigger)}</b> — ${esc(p.action)}${p.reserved_bankroll ? ` <i>Reserve: ${esc(p.reserved_bankroll)}</i>` : ''}</li>`).join('');
  const rv = strategy.risk_review || {};
  const riskBits = [rv.max_exposure_note, rv.funded_liability_note, rv.coverage_note, rv.concentration_note, rv.hedge_optionality_note].filter(Boolean);
  return `<div class="scenario">
    <div class="meta">Dead cost if all prepositioned: ${esc(exp.max_dead_cost_if_all_prepositioned)} units · strict-ladder dead cost: ${esc(exp.max_dead_cost_if_strict_ladders)} units · funded liability if ladders hit: ${esc(exp.funded_liability_if_ladders_hit)} units</div>
    ${anchors ? `<h3>Anchors</h3><ul>${anchors}</ul>` : ''}
    ${coverage ? `<h3>Coverage Positions</h3><ul>${coverage}</ul>` : ''}
    ${unresolvedCoverage ? `<h3>Unresolved Coverage Ideas</h3><ul>${unresolvedCoverage}</ul>` : ''}
    ${ladders ? `<h3>Ladder Stacks</h3><ul>${ladders}</ul>` : ''}
    ${plans ? `<h3>Playoff Hedge Plan</h3><ul>${plans}</ul>` : ''}
    ${riskBits.length ? `<h3>Risk Review</h3><ul>${riskBits.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
  </div>`;
}
function watchlistReviewHTML(review = []) {
  if (!review.length) return '<p>No human watchlist loaded.</p>';
  return review.map((item) => {
    const rows = (item.markets || []).map((m) => `<tr><td>${esc(labelMarket(m.market))}</td><td>${esc(m.selection || item.team)}</td><td>${esc(m.direction || '-')}</td><td>${esc(m.quote || '-')}</td><td>${esc(percent(m.fair_prob) || '-')}</td><td>${m.edge_pct == null ? '-' : `${esc(m.edge_pct)}%`}</td><td>${m.sim_gap == null ? '-' : `${esc(round(Number(m.sim_gap) * 100, 2))}%`}</td><td>${esc(m.status || '-')}</td></tr>`).join('');
    return `<details class="fold-section" open><summary>${esc(item.label || item.team)} <span class="et">${esc(item.priority || 'watch')}</span></summary><div class="fold-body"><p class="meta">${esc(item.intent || '')}</p><table class="stack-tbl"><thead><tr><th>Market</th><th>Selection</th><th>Direction</th><th>Quote</th><th>Fair</th><th>Edge/Gap</th><th>Sim Gap</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
  }).join('');
}

// Tier-3 fix: surfaces the three "silently degraded" failure modes (a
// Stage-1 model error, a committee crash, an empty final book) directly in
// the report itself, not just the run log — the whole point being a human
// reviewing the HTML/MD output should not be able to mistake a degraded run
// for a clean one.
function degradationProblems(meta) {
  const problems = [];
  if (meta.stage1_errors?.length) {
    problems.push(`${meta.stage1_errors.length} Stage-1 model call(s) failed and were excluded from this run: ${meta.stage1_errors.map((e) => `${e.model} (${e.error})`).join('; ')}. This report used fewer analysts than configured.`);
  }
  if (meta.committee_ran === false) {
    problems.push(`The Skeptic/Risk committee crashed${meta.committee_error ? ` (${meta.committee_error})` : ''} — this report falls back to unreviewed Stage-1 candidates. No Skeptic verdict, no Risk/Editor pass, no scenario review.`);
  }
  if (meta.final_empty) {
    problems.push('The final book is EMPTY — zero recommendations survived to this report. Treat this run as failed, not as "the model looked and found nothing."');
  }
  return problems;
}
function degradationBannerHTML(meta) {
  const problems = degradationProblems(meta);
  if (!problems.length) return '';
  return `<div class="banner-critical"><b>⚠ DEGRADED RUN — review before trusting this report.</b><ul>${problems.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>`;
}
function degradationBannerMD(meta) {
  const problems = degradationProblems(meta);
  if (!problems.length) return [];
  return ['> ⚠ **DEGRADED RUN — review before trusting this report.**', ...problems.map((p) => `> - ${p}`), ''];
}

function renderHTML(ranked, passed, killed, byModel, meta, ladders = [], baskets = [], portfolioStrategy = null, watchlistReview = []) {
  const names = modelNames(byModel);
  const watch = names.flatMap((n) => (byModel[n].watch || []).map((w) => `<li><b>${esc(humanizeMarketRefs(w.selection))}</b> <span class="mk">${esc(labelMarket(w.market))}</span> — ${esc(humanizeMarketRefs(w.why))} <i>(${esc(n)})</i></li>`)).join('');
  const passList = [...killed, ...passed].map((p) => `<li><b>${esc(humanizeMarketRefs(p.selection))}</b> <span class="mk">${esc(labelMarket(p.market))}</span> — ${esc(humanizeMarketRefs(p.reason))} <i>(${esc(p.stage)})</i></li>`).join('');
  const notes = names.map((n) => `<p><b>${esc(n)}:</b> ${esc(byModel[n].portfolio_notes)}</p>`).join('');
  return `<!doctype html><meta charset="utf-8"><title>NFL Portfolio ${meta.date}</title>
<style>
 body{font:15px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;max-width:920px;margin:24px auto;padding:0 16px;color:#1a1a1a}
 h1{margin:0 0 4px} .sub{color:#666;margin-bottom:20px}
 h2{margin:26px 0 10px;padding-bottom:6px;border-bottom:2px solid #eee}
 .banner{background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:10px 14px;margin:14px 0;font-size:13px}
 .banner-critical{background:#fef2f2;border:2px solid #dc2626;border-radius:8px;padding:10px 14px;margin:14px 0;font-size:13px;color:#7f1d1d}
 .banner-critical b{color:#991b1b}.banner-critical ul{margin:6px 0 0 18px;padding:0}
 .toc{background:#f8fafc;border:1px solid #dbe4ef;border-radius:8px;padding:10px 12px;margin:14px 0 18px;font-size:12px}
 .toc b{display:block;color:#334155;margin-bottom:6px}.toc div{display:flex;gap:6px;flex-wrap:wrap;margin:5px 0}
 .toc a{display:inline-flex;gap:5px;align-items:center;text-decoration:none;color:#334155;border:1px solid #dbe4ef;background:#fff;border-radius:999px;padding:3px 8px}
 .toc a:hover{background:#eef2ff;border-color:#c7d2fe}.toc span{color:#64748b}
 .key{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px;margin:12px 0 18px;font-size:12px}
 .key summary{cursor:pointer;font-weight:700;color:#334155}.key p{margin:7px 0;color:#475569}.key-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:8px 14px;margin-top:8px}
 .key-grid div{display:flex;gap:6px}.key-grid b{min-width:76px;color:#334155}.key-grid span{color:#475569}
 .rec{border:1px solid #e5e7eb;border-left-width:4px;border-radius:8px;padding:10px 12px;margin:10px 0;border-left-color:#94a3b8}
 .rec.math{border-left-color:#2563eb} .rec.thesis{border-left-color:#16a34a} .rec.stale_price{border-left-color:#f59e0b}
 .rec.hedge{border-left-color:#8b5cf6} .rec.longshot{border-left-color:#dc2626}
 .rec.has-validation{border-color:#dc2626;border-left-color:#dc2626}
 .bv{background:#fee2e2;color:#991b1b;border:1px solid #fecaca}
 .bv-flag{color:#991b1b;background:#fef2f2;border:1px solid #fecaca;border-radius:4px;padding:4px 7px;font-size:12px;margin:4px 0;font-weight:600}
 .rh{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap}.pick-main,.quote-cluster{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.quote-cluster{margin-left:auto}
 .mk,.typ,.et,.kb,.hr,.bv,.tier,.tag,.sq{font-size:11px;padding:2px 7px;border-radius:999px;white-space:nowrap}
 .mk{background:#eef2ff;color:#3730a3}.typ{background:#ecfeff;color:#155e75}.et{background:#f1f5f9;color:#475569}.kb{background:#fef3c7;color:#92400e}
 .tag{background:#f5f3ff;color:#6d28d9}
 .sq{display:inline-flex;margin:2px 0;background:#f1f5f9;color:#334155;border:1px solid #cbd5e1}
 .sq-named-timestamp{background:#dcfce7;color:#166534;border-color:#86efac}.sq-named-no-timestamp{background:#e0f2fe;color:#075985;border-color:#7dd3fc}
 .sq-unattributed{background:#fef3c7;color:#92400e;border-color:#fcd34d}.sq-episode-article{background:#f5f3ff;color:#6d28d9;border-color:#ddd6fe}.sq-none{background:#fee2e2;color:#991b1b;border-color:#fecaca}
 .source-line{margin:3px 0}
 .hr{background:#fffbeb;color:#b45309;border:1px solid #fde68a}
 .pr{font-weight:700} .tier{background:#e5e7eb;color:#374151}
 .tier.core{background:#dcfce7} .tier.speculative{background:#fee2e2} .conf{margin-left:auto;color:#666;font-size:12px}
 .meta{color:#666;font-size:12px;margin:3px 0} .mv,.fv{font-size:13px;margin:2px 0} .th{margin:4px 0} .dis{color:#b45309;font-size:13px;margin:3px 0}
 .sk{color:#7c3aed;font-size:12px;margin:3px 0} .rn{color:#0369a1;font-size:12px;margin:3px 0} .ev{color:#64748b;font-size:11px;margin:2px 0}
 .ds,.sim{font-size:12px;margin:5px 0;padding:5px 7px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px}
 .sim{background:#f0fdf4;border-color:#bbf7d0;color:#14532d}.sim .meta{color:#166534}
 .tim{font-size:12px;background:#f8fafc;padding:4px 8px;border-radius:4px;margin-top:4px} .wk{font-size:12px;color:#4338ca;margin-top:3px}
 .unresolved{color:#b91c1c;font-weight:600}
 li{margin:5px 0}
 .rec.ladder{border-left-color:#0891b2} .rec.basket{border-left-color:#ca8a04}
 .stack-tbl{width:100%;border-collapse:collapse;font-size:12px;margin:6px 0}
 .stack-tbl th,.stack-tbl td{border:1px solid #e5e7eb;padding:3px 6px;text-align:left}
 .scenario h3{font-size:14px;margin:10px 0 4px}
 .quick{background:#f8fafc;border:1px solid #dbe4ef;border-radius:8px;padding:10px 14px;margin:14px 0;font-size:13px}
 .quick ul{margin:6px 0 0 18px;padding:0}
 .team-section{border:1px solid #dbe4ef;border-radius:8px;margin:12px 0;background:#fff}
 .team-section summary{cursor:pointer;font-weight:800;font-size:18px;padding:10px 12px;background:#f8fafc;border-radius:8px}
 .team-section[open] summary{border-bottom:1px solid #dbe4ef;border-radius:8px 8px 0 0}
 .team-read{padding:8px 12px 0;color:#334155;font-size:13px}.team-read p{margin:0 0 6px}
 .team-section .rec{margin:10px 12px 12px}
 .fold-section{border:1px solid #dbe4ef;border-radius:8px;margin:14px 0;background:#fff}
 .fold-section summary{cursor:pointer;font-weight:800;font-size:17px;padding:10px 12px;background:#f8fafc;border-radius:8px}
 .fold-section[open] summary{border-bottom:1px solid #dbe4ef;border-radius:8px 8px 0 0}
 .fold-body{padding:2px 12px 12px}.fold-body>.rec{margin:10px 0}.fold-body ul{margin:8px 0 0 18px;padding:0}
</style>
<h1>NFL Futures Portfolio — Analyst Committee</h1>
<div class="sub">${meta.date} · models: ${esc(names.join(' + '))} · season ${esc(meta.season)}${meta.committee_ran === false ? ' · <b>committee skipped (stage 1 only)</b>' : ''}</div>
${degradationBannerHTML(meta)}
<div class="banner"><b>Decision support only.</b> These are model proposals for your review — not instructions to bet. Sizing and whether to play at all are your call. Every play lists its strongest disconfirming factor and (once through the committee) a Skeptic verdict; read both first.</div>
${badgeKeyHTML()}
${reportTOCHTML(ranked, { ladders, baskets, passed, killed, watchCount: names.reduce((sum, n) => sum + (byModel[n].watch || []).length, 0) })}
${quickReadHTML(ranked.all)}
<h2 id="human-watchlist">Human Watchlist Review</h2>${watchlistReviewHTML(watchlistReview)}
<h2>Recommendations by Team</h2>
${teamSectionsHTML(ranked.all)}
<h2 id="scenario-book">Scenario Book / Playoff Hedge Map</h2>${scenarioBookHTML(portfolioStrategy)}
<details class="fold-section" id="parlay-ladders"><summary>Parlay ladders - self-funding stacks (${ladders.length})</summary><div class="fold-body">${ladders.length ? ladders.map(ladderCard).join('') : '<p>None proposed this run.</p>'}</div></details>
<details class="fold-section" id="hedge-baskets"><summary>Hedge baskets - variance insurance (${baskets.length})</summary><div class="fold-body">${baskets.length ? baskets.map(basketCard).join('') : '<p>None proposed this run.</p>'}</div></details>
<details class="fold-section" id="passed-killed"><summary>Passed / killed (${passed.length + killed.length})</summary><div class="fold-body"><ul>${passList || '<li>None.</li>'}</ul></div></details>
<details class="fold-section" id="watch-list"><summary>Watch list</summary><div class="fold-body"><ul>${watch || '<li>None.</li>'}</ul></div></details>
<h2 id="construction-notes">Construction notes</h2>${notes}`;
}
function ladderMD(l) {
  const legLine = (leg) => `    - ${labelMarket(leg.market)}: ${leg.selection} — ${leg.price}@${leg.book} · full stake ${leg.full_stake} · net stake (self-funded) ${leg.net_stake_after_prior_wins} · profit if hit ${leg.profit_at_full_stake}`;
  return [`- **${l.team}** — ${l.thesis || ''}`, ...(l.legs || []).map(legLine),
    `  - total full exposure ${l.total_full_exposure} units · banked profit if all hit ${l.final_banked_profit_if_all_hit} units`,
    ...(l.unresolved_legs?.length ? [`  - ⚠ ${l.unresolved_legs.join('; ')}`] : [])].join('\n');
}
function basketMD(b) {
  const legLine = (leg) => `    - ${labelMarket(leg.market)}: ${leg.selection} — ${leg.price}@${leg.book} · stake ${leg.stake} · payout if hit ${leg.payout_if_hit}`;
  return [`- **Hedge basket**${b.primary_hedged_against?.length ? ` vs ${b.primary_hedged_against.join(', ')}` : ''} — ${b.thesis || ''}`, ...(b.legs || []).map(legLine),
    `  - total staked ${b.total_stake} units`,
    ...(b.unresolved_legs?.length ? [`  - ⚠ ${b.unresolved_legs.join('; ')}`] : [])].join('\n');
}
function scenarioBookMD(strategy) {
  if (!strategy || strategy.status === 'not_proposed') return 'No scenario book proposed this run.';
  const exp = strategy.exposure_summary || {};
  const L = [
    `- Strategy type: ${strategy.strategy_type}`,
    `- Dead cost if all prepositioned: ${exp.max_dead_cost_if_all_prepositioned} units`,
    `- Strict-ladder dead cost: ${exp.max_dead_cost_if_strict_ladders} units`,
    `- Funded liability if ladders hit: ${exp.funded_liability_if_ladders_hit} units`,
  ];
  if (strategy.anchor_positions?.length) {
    L.push('- Anchors: ' + strategy.anchor_positions.map((a) => `${a.team} (${labelRole(a.role)})`).join(', '));
  }
  if (strategy.coverage_positions?.length) {
    L.push('- Coverage positions:');
    for (const c of strategy.coverage_positions.slice(0, 12)) L.push(`  - ${humanizeMarketRefs(c.selection)} (${labelRole(c.role)})`);
  }
  if (strategy.unresolved_raw_coverage_positions?.length) {
    L.push('- Unresolved coverage ideas:');
    for (const c of strategy.unresolved_raw_coverage_positions) L.push(`  - ${humanizeMarketRefs(c.selection)} (${labelRole(c.role)}) - ${humanizeMarketRefs(c.reason)}`);
  }
  if (strategy.ladder_stacks?.length) {
    L.push('- Ladder stacks:');
    for (const l of strategy.ladder_stacks) {
      const steps = (l.steps || []).map((s) => `${humanizeMarketRefs(s.selection || s.bet)}${s.price != null ? ` ${s.price}@${s.book || '?'}` : ''}`).join(' -> ');
      L.push(`  - ${l.team || 'Ladder'} (${labelRole(l.role)}): strict dead cost ${l.dead_cost?.if_strict_sequence} units; full exposure ${l.dead_cost?.if_all_legs_prepositioned} units; funded liability ${l.funded_liability?.by_prior_wins} units; banked if all hit ${l.funded_liability?.final_banked_profit_if_all_hit} units.`);
      if (steps) L.push(`    - ${steps}`);
    }
  }
  if (strategy.playoff_hedge_plan?.length) {
    L.push('- Playoff hedge plan:');
    for (const p of strategy.playoff_hedge_plan) L.push(`  - ${p.trigger}: ${p.action}${p.reserved_bankroll ? ` Reserve: ${p.reserved_bankroll}` : ''}`);
  }
  const rv = strategy.risk_review || {};
  const riskBits = [rv.max_exposure_note, rv.funded_liability_note, rv.coverage_note, rv.concentration_note, rv.hedge_optionality_note].filter(Boolean);
  if (riskBits.length) {
    L.push('- Risk review:');
    for (const bit of riskBits) L.push(`  - ${bit}`);
  }
  return L.join('\n');
}
function watchlistReviewMD(review = []) {
  if (!review.length) return 'No human watchlist loaded.';
  const L = [];
  for (const item of review) {
    L.push(`### ${item.label || item.team}`);
    if (item.intent) L.push(item.intent);
    L.push('', '| Market | Selection | Direction | Quote | Fair | Edge/Gap | Sim Gap | Status |', '|---|---|---|---:|---:|---:|---:|---|');
    for (const m of item.markets || []) {
      L.push(`| ${labelMarket(m.market)} | ${humanizeMarketRefs(m.selection || item.team)} | ${m.direction || '-'} | ${m.quote || '-'} | ${percent(m.fair_prob) || '-'} | ${m.edge_pct == null ? '-' : `${m.edge_pct}%`} | ${m.sim_gap == null ? '-' : `${round(Number(m.sim_gap) * 100, 2)}%`} | ${m.status || '-'} |`);
    }
    L.push('');
  }
  return L.join('\n');
}
function quickReadMD(recs = []) {
  if (!recs.length) return 'No final recommendations survived validation.';
  return recs.map((r) => `- ${recommendationBlurb(r)}`).join('\n');
}
function teamSectionsMD(recs = [], line) {
  const groups = groupRecommendationsByTeam(recs);
  if (!groups.length) return 'No final recommendations survived validation.';
  return groups.map(([team, rows]) => [`### ${team} (${rows.length})`, ...rows.map((r) => `${line(r)}${simulationBlockMD(r)}${signalBlockMD(r.dossier_signals)}`), ''].join('\n')).join('\n');
}
function renderMD(ranked, passed, killed, byModel, meta, ladders = [], baskets = [], portfolioStrategy = null, watchlistReview = []) {
  const names = modelNames(byModel);
  const line = (r) => `- **${r.selection}** · ${labelMarket(r.market)} · ${labelType(r.type)} · ${labelEdgeType(r.edge_type)}${r.needs_human_review ? ' · Needs Review' : ''}${r.validation?.length ? ' · 🚫 BOARD VALIDATOR FLAG' : ''}\n  - Quote: ${r.price}@${r.book} · ${labelStakeTier(r.stake_tier)} · Confidence ${r.confidence}\n  - Fair probability: ${percent(r.model_fair_prob) || r.model_fair_prob} · Estimated edge: ${r.edge_pct}%${r.agreement ? ` · Models: ${r.agreement.count} of ${r.agreement.of}` : ''}${r.bet_threshold ? ` · Play only at: ${r.bet_threshold}` : ''}\n  - Source quality: ${sourceQuality(r).label}\n${r.market_view ? `  - Market: ${r.market_view}\n` : ''}${r.football_view ? `  - Football: ${r.football_view}\n` : ''}  - ${r.thesis}\n  - ⚠ ${r.disconfirming_factor}${r.validation?.length ? `\n  - 🚫 Board validator: ${r.validation.join(' · ')}` : ''}${r.skeptic_note ? `\n  - 🕵 Skeptic (${r.skeptic_verdict}): ${r.skeptic_note}` : ''}${r.risk_note ? `\n  - ⚖ Risk: ${r.risk_note}` : ''}${r.entry_plan?.pattern === 'scale_in' ? `\n  - 📐 Scale-in: smaller entry now, add at ${r.entry_plan.add_trigger}${r.entry_plan.note ? ` — ${r.entry_plan.note}` : ''}` : ''}${r.evidence_resolved?.length ? `\n  - 🔗 ${r.evidence_resolved.map((e) => `${e.id}${e.resolved ? `=${JSON.stringify(e.value)}` : ' (unresolved)'}`).join(', ')}` : (r.evidence_ids?.length ? `\n  - 🔗 ${r.evidence_ids.join(', ')} (unresolved — no dossier row match)` : '')}${r.sources?.length ? `\n  - 📣 sources: ${r.sources.join(', ')}` : ''}\n  - timing: **${r.timing?.action}**${r.timing?.trigger ? ` — ${r.timing.trigger}` : ''}${r.timing?.expected_move ? ` (${r.timing.expected_move})` : ''}`;
  const L = [`# NFL Futures Portfolio (Analyst Committee) — ${meta.date}`, '', `Models: ${names.join(' + ')} · season ${meta.season}`, '',
    ...degradationBannerMD(meta),
    '> Decision support only — proposals for review, not instructions to bet.', '',
    '## How to read a pick card',
    'Market names the bet, Pick Type describes the price profile, and Edge Type explains why the pick surfaced. Fair probability is the model estimate; Estimated edge compares that fair probability to the current price. Play only at is the worst price the report would normally accept. Needs Review means the pick has conflict, correlation, expensive pricing, or another reason for human judgment before action.',
    ''];
  L.push('## Quick read');
  L.push(quickReadMD(ranked.all), '');
  L.push('## Human Watchlist Review');
  L.push(watchlistReviewMD(watchlistReview), '');
  L.push('## Recommendations by Team');
  L.push(teamSectionsMD(ranked.all, line));
  L.push('## Scenario Book / Playoff Hedge Map');
  L.push(scenarioBookMD(portfolioStrategy), '');
  L.push(`## Parlay ladders — self-funding stacks (${ladders.length})`);
  L.push(ladders.length ? ladders.map(ladderMD).join('\n') : 'None proposed this run.', '');
  L.push(`## Hedge baskets — variance insurance (${baskets.length})`);
  L.push(baskets.length ? baskets.map(basketMD).join('\n') : 'None proposed this run.', '');
  L.push(`## Passed / killed (${passed.length + killed.length})`);
  for (const p of [...killed, ...passed]) L.push(`- **${humanizeMarketRefs(p.selection)}** (${labelMarket(p.market)}) — ${humanizeMarketRefs(p.reason)} _(${p.stage})_`);
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

  // 2026-09-03 intel-source-integrity preflight (Andy, trust audit) — runs
  // scripts/build-intel-source-audit-report.js --strict and refuses to start
  // Stage 1 if it reports anything BLOCKED or STALE. This is deliberately a
  // full subprocess call (not a re-implementation of its checks in here) so
  // this gate and the standalone audit report can never silently drift apart
  // the way the dossier-freshness check and this pipeline briefly did.
  if (!SKIP_INTEL_AUDIT) {
    console.log('🔎 Running intel-source integrity audit (scripts/build-intel-source-audit-report.js --strict)...');
    const audit = spawnSync('node', ['scripts/build-intel-source-audit-report.js', '--strict'], {
      cwd: ROOT, encoding: 'utf8',
    });
    const auditOut = `${audit.stdout || ''}${audit.stderr || ''}`.trim();
    if (auditOut) console.log(auditOut.split('\n').map((l) => `   ${l}`).join('\n'));
    if (audit.error) {
      console.error(`✖ intel-source audit could not run: ${audit.error.message}`);
      if (!ALLOW_BLOCKED_INTEL) {
        console.error('  Fix the audit script or pass --allow-blocked-intel (last resort) to proceed without this check.');
        process.exit(1);
      }
      console.warn('⚠ intel-source audit failed to run but --allow-blocked-intel was set — proceeding without this check.');
    } else if (audit.status === 2) {
      console.error('✖ intel-source integrity preflight FAILED — the audit above reports BLOCKED and/or STALE sources.');
      console.error(`  See ${path.join('docs', 'NFL_INTEL_SOURCE_AUDIT_LATEST.html')} for the full breakdown.`);
      if (!ALLOW_BLOCKED_INTEL) {
        console.error('  Resolve every blocked/stale source (or pass --allow-blocked-intel, documented, last resort) before running the committee.');
        process.exit(1);
      }
      console.warn('⚠ intel-source audit found blocked/stale sources but --allow-blocked-intel was set — proceeding anyway. This should not be routine.');
    } else if (audit.status !== 0) {
      console.error(`✖ intel-source audit exited unexpectedly (code ${audit.status}).`);
      if (!ALLOW_BLOCKED_INTEL) {
        console.error('  Investigate scripts/build-intel-source-audit-report.js, or pass --allow-blocked-intel (last resort) to proceed without this check.');
        process.exit(1);
      }
      console.warn('⚠ intel-source audit exited unexpectedly but --allow-blocked-intel was set — proceeding without this check.');
    } else {
      console.log('   intel-source integrity: PASSABLE — no blocked or stale sources.');
    }
  } else {
    console.warn('⚠ --skip-intel-audit set — intel-source integrity was NOT checked. Dev/offline use only.');
  }

  // 2026-08-13 freshness preflight — see scripts/lib/dossier-freshness-gate.js.
  // 2026-08-13 Codex review fix (finding #3): previously only `status ===
  // 'stale'` blocked; missing lanes and unknown freshness only warned and let
  // synthesis proceed. synthesisPreflightDecision() now blocks on all three
  // failure classes unless the matching flag explicitly overrides that one class.
  const freshnessCheck = checkDossierFreshness(dossier.meta, await collectEvidenceLaneStats(ROOT), { maxAgeDays: DEFAULT_LANE_MAX_AGE_DAYS });
  const preflight = synthesisPreflightDecision(freshnessCheck, {
    allowStale: ALLOW_STALE_DOSSIER,
    allowMissing: ALLOW_MISSING_EVIDENCE_LANES,
    allowUnknown: ALLOW_UNKNOWN_DOSSIER_FRESHNESS,
    allowExpired: ALLOW_EXPIRED_EVIDENCE_LANES,
  });
  if (!preflight.allowed) {
    console.error(`✖ dossier freshness preflight FAILED (mode: ${freshnessCheck.mode}, status: ${freshnessCheck.status}) — blocking reasons: ${preflight.blocking_reasons.join(', ')}`);
    if (freshnessCheck.stale_lane_count) {
      console.error(`  ${freshnessCheck.stale_lane_count} STALE evidence lane(s):`);
      for (const lane of freshnessCheck.stale_lanes) console.error(`    - ${lane.key}: ${lane.reason}`);
    }
    if (freshnessCheck.expired_lane_count) {
      console.error(`  ${freshnessCheck.expired_lane_count} EXPIRED evidence lane(s) (older than their max age, regardless of drift):`);
      for (const lane of freshnessCheck.expired_lanes) console.error(`    - ${lane.key}: ${lane.age_days}d old (limit ${lane.max_age_days}d)`);
    }
    if (freshnessCheck.missing_lane_count) {
      console.error(`  ${freshnessCheck.missing_lane_count} MISSING evidence lane(s): ${freshnessCheck.missing_lanes.join(', ')}`);
    }
    if (freshnessCheck.mode === 'unknown') {
      console.error('  Dossier has neither an evidence_lane_versions stamp nor a generated_at timestamp.');
    }
    console.error('  Rebuild the dossier (agents/portfolio-dossier.js) first. To override a specific class with a documented reason, pass'
      + ' --allow-stale-dossier / --allow-missing-evidence-lanes / --allow-unknown-dossier-freshness / --allow-expired-evidence-lanes — each covers only its own failure class.');
    process.exit(1);
  }
  if (freshnessCheck.stale_lane_count && ALLOW_STALE_DOSSIER) {
    console.warn(`⚠ dossier freshness check found ${freshnessCheck.stale_lane_count} stale lane(s) but --allow-stale-dossier was set — proceeding anyway.`);
  }
  if (freshnessCheck.missing_lane_count && ALLOW_MISSING_EVIDENCE_LANES) {
    console.warn(`⚠ dossier freshness check found ${freshnessCheck.missing_lane_count} missing lane(s) but --allow-missing-evidence-lanes was set — proceeding anyway.`);
  }
  if (freshnessCheck.expired_lane_count && ALLOW_EXPIRED_EVIDENCE_LANES) {
    console.warn(`⚠ dossier freshness check found ${freshnessCheck.expired_lane_count} expired lane(s) but --allow-expired-evidence-lanes was set — proceeding anyway.`);
  }
  if (freshnessCheck.mode === 'unknown' && ALLOW_UNKNOWN_DOSSIER_FRESHNESS) {
    console.warn('⚠ dossier freshness could not be determined but --allow-unknown-dossier-freshness was set — proceeding without a freshness guarantee.');
  }

  const ledger = await loadLedger();
  const watchlist = await loadWatchlist();
  const officialConfig = await loadOfficialConfig();
  const runInstructions = await loadRunInstructions();
  const supplementalContext = await loadSupplementalContext();
  if (watchlist?.items?.length) {
    console.log(`   human watchlist: ${watchlist.items.length} target(s) from ${WATCHLIST_PATH}`);
  }
  if (officialConfig?.expert_id) {
    console.log(`   official paper expert: ${officialConfig.display_name || officialConfig.expert_id} from ${OFFICIAL_CONFIG_PATH}`);
  }
  if (runInstructions) {
    console.log(`   run instructions: ${RUN_INSTRUCTIONS_PATH}`);
  }
  if (supplementalContext) {
    console.log(`   supplemental context: ${SUPPLEMENTAL_CONTEXT_PATH}`);
  }
  const expertDossiers = await loadExpertDossiers();
  if (expertDossiers?.dossiers?.length) {
    const signalCount = expertDossiers.dossiers.reduce((sum, row) => sum + (row.tendency_signals?.length || 0), 0);
    console.log(`   expert dossier context: ${expertDossiers.dossiers.length} expert(s), ${signalCount} tendency signal(s) from ${EXPERT_DOSSIER_INDEX_PATH}`);
  }
  const podcastEvidence = await loadPodcastEvidenceIndex();
  if (podcastEvidence.rows.length) {
    console.log(`   podcast source context: ${podcastEvidence.rows.length} offline host-summary pick row(s) from ${podcastEvidence.summary_path}`);
  } else {
    console.log('   podcast source context: no local Futures_Picks_Summary file found; dossier signals will render without host-summary links');
  }
  const abbrToNick = Object.fromEntries(Object.entries(NFL_TEAMS).map(([nick, data]) => [data.abbreviation, nick]));
  const { referenceDocs: vaultReferenceDocs, teamDeepReads } = await loadVaultReferenceEvidence();
  if (vaultReferenceDocs) {
    let teamsWithReads = 0;
    for (const [abbr, reads] of Object.entries(teamDeepReads)) {
      const nick = abbrToNick[abbr];
      if (nick && dossier.team_profiles?.[nick]) {
        dossier.team_profiles[nick].vault_analytical_reads = reads;
        teamsWithReads += 1;
      }
    }
    console.log(`   vault reference bridge: ${Object.keys(vaultReferenceDocs).length} reference guide(s), ${teamsWithReads} team(s) with vault analytical-read context`);
  } else {
    console.log('   vault reference bridge: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set, or fetch failed -- proceeding without it');
  }
  const bettordayTrench = await loadBettorDayTrenchEvidence();
  if (Object.keys(bettordayTrench.byTeam).length) {
    let teamsWithTrench = 0;
    for (const [abbr, metrics] of Object.entries(bettordayTrench.byTeam)) {
      const nick = abbrToNick[abbr];
      if (nick && dossier.team_profiles?.[nick]) {
        dossier.team_profiles[nick].bettorday_trench = metrics;
        teamsWithTrench += 1;
      }
    }
    console.log(`   bettorday trench bridge (${bettordayTrench.sourceMode}): ${Object.keys(bettordayTrench.byTeam).length} team(s) with trench data, ${teamsWithTrench} matched into team_profiles`);
  } else {
    console.log('   bettorday trench bridge: no data available (Supabase table empty/missing and no local data/intel/bettorday_trench_ratings_2026.json) -- proceeding without it');
  }
  const userContent = buildUserPrompt(dossier, ledger, watchlist, officialConfig, expertDossiers, runInstructions, supplementalContext, vaultReferenceDocs);
  if (PROMPT_ONLY) {
    const promptOut = path.resolve(ROOT, PROMPT_OUT_PATH);
    const preview = {
      generated_at: new Date().toISOString(),
      model_calls: false,
      system_prompt: SYSTEM_PROMPT,
      user_prompt: userContent,
      size: {
        system_characters: SYSTEM_PROMPT.length,
        user_characters: userContent.length,
        approximate_tokens_at_four_characters_each: Math.ceil((SYSTEM_PROMPT.length + userContent.length) / 4),
      },
    };
    await mkdir(path.dirname(promptOut), { recursive: true });
    await writeFile(promptOut, `${JSON.stringify(preview, null, 2)}\n`);
    console.log(`   prompt-only preview: ${promptOut}`);
    console.log(`   approximate prompt tokens: ${preview.size.approximate_tokens_at_four_characters_each}`);
    return;
  }
  const models = ONLY ? MODELS.filter((m) => m.includes(ONLY)) : MODELS;
  console.log(`🧠 Stage 1 (Market+Football Analyst) with: ${models.join(' + ')}`);

  const byModel = {}; const raw = {};
  // Tier-3 fix: a per-model Stage-1 failure used to only print to the
  // console — the run continued single-model with `committee_ran` still
  // true and no trace of the failure in the report itself (the actual
  // 2026-09-02 incident: claude-fable-5 died mid-JSON, run silently
  // continued single-model, report rendered clean and exited 0). Collected
  // here so the report can carry a hard banner and the process can signal
  // non-zero on exit even though the run still completes.
  const stage1Errors = [];
  for (const model of models) {
    try {
      const { text, usage } = await callModel(model, SYSTEM_PROMPT, userContent);
      raw[model] = { text, usage };
      byModel[model] = parseJSON(text);
      console.log(`   ${model}: ${(byModel[model].recommendations || []).length} plays, ${(byModel[model].watch || []).length} watch`);
    } catch (e) {
      console.error(`   ✖ ${model}: ${e.message}`);
      raw[model] = { error: e.message };
      stage1Errors.push({ model, error: e.message });
    }
  }
  const ok = Object.keys(byModel);
  if (!ok.length) { console.error('✖ no model returned a valid portfolio'); process.exitCode = 1; return; }
  if (stage1Errors.length) console.error(`   ⚠ ${stage1Errors.length}/${models.length} Stage-1 model(s) failed — continuing with ${ok.length} model(s), but this run and its report are DEGRADED.`);

  const { candidates } = mergeStage1(byModel);
  console.log(`   merged: ${candidates.length} unique candidates across ${ok.length} model(s)`);

  // 2026-07-22 addition: collect scenario-book structures proposed by any
  // model. Stage 3 receives these for portfolio-level review; code below still
  // resolves/math-validates every current-price leg against the dossier.
  const rawHedgeBaskets = ok.flatMap((m) => (byModel[m].hedge_baskets || []).map((b) => ({ ...b, proposed_by: m })));
  const rawParlayLadders = ok.flatMap((m) => (byModel[m].parlay_ladders || []).map((l) => ({ ...l, proposed_by: m })));
  const rawPortfolioStrategies = ok.flatMap((m) => {
    const s = byModel[m].portfolio_strategy;
    if (!s) return [];
    return (Array.isArray(s) ? s : [s]).map((strategy) => ({ ...strategy, proposed_by: m }));
  });

  const meta = { date: new Date().toISOString().slice(0, 10), season: dossier.meta.season, committee_ran: !SKIP_COMMITTEE, run_id: randomUUID(), watchlist_path: watchlist?.items?.length ? WATCHLIST_PATH : null, watchlist_count: watchlist?.items?.length || 0, stage1_errors: stage1Errors.length ? stage1Errors : null };
  let final = candidates, passed = [], killed = [];
  const raw2 = {};
  let scenarioReview = null;

  if (SKIP_COMMITTEE) {
    console.log('   (committee skipped: --skip-committee — stage 1 candidates used as-is)');
  } else {
    console.log(`🕵 Stage 2 (Skeptic) with: ${SKEPTIC_MODEL}`);
    try {
      const { text, usage } = await callModel(SKEPTIC_MODEL, SKEPTIC_SYSTEM_PROMPT, buildSkepticUserPrompt(candidates));
      raw2.skeptic = { text, usage };
      const { verdicts } = parseJSON(text);
      const applied = applySkepticVerdicts(candidates, verdicts);
      console.log(`   skeptic: ${applied.survivors.length} survive, ${applied.killed.length} killed`);
      killed = applied.killed;
      // Tier-3 fix: narrow `final` to the skeptic-filtered survivors NOW, so
      // that if the Stage-3 call below throws, the catch block's fallback is
      // "final stays what the Skeptic already approved" rather than "final
      // reverts to the untouched, pre-Skeptic candidate list" — which would
      // silently resurrect every candidate `killed` above just listed as
      // rejected.
      final = applied.survivors;

      console.log(`⚖ Stage 3 (Risk/Portfolio + Editor) with: ${RISK_MODEL}`);
      const { text: riskText, usage: riskUsage } = await callModel(RISK_MODEL, RISK_EDITOR_SYSTEM_PROMPT, buildRiskEditorUserPrompt(applied.survivors, {
        primary: PRIMARY,
        ledger,
        hedge_baskets: rawHedgeBaskets,
        parlay_ladders: rawParlayLadders,
        portfolio_strategy: rawPortfolioStrategies,
      }));
      raw2.risk_editor = { text: riskText, usage: riskUsage };
      const riskOutput = parseJSON(riskText);
      const applied2 = applyRiskEditor(applied.survivors, riskOutput);
      final = applied2.final; passed = applied2.passed;
      scenarioReview = riskOutput.scenario_review || null;
      console.log(`   risk/editor: ${final.length} final, ${passed.length} passed`);
      byModel.__committee_notes = riskOutput.portfolio_notes || null;
    } catch (e) {
      console.error(`   ✖ committee pass failed, falling back to stage-1 candidates as-is: ${e.message}`);
      meta.committee_ran = false;
      meta.committee_error = e.message;
    }
  }

  // Code-owned validation (2026-07-22 follow-up, Codex review #1 priority) — runs
  // after the committee, before ranking. Recomputes edge_pct, checks book/price
  // against the dossier, resolves evidence_ids, and pulls hard-invalid candidates
  // (fabricated market/selection/book/price) into their own list instead of
  // letting them ride silently into the final book.
  console.log(`🔍 Validating ${final.length} final candidate(s) against dossier ground truth`);
  const validated = final.map((c) => validateRecommendationStrict(c, dossier, podcastEvidence));
  const invalidated = validated
    .filter((v) => v.status === 'invalid')
    .map((v) => ({ ...v.candidate, reason: v.reason, stage: 'validator' }));
  final = validated.filter((v) => v.status !== 'invalid').map((v) => v.candidate);
  console.log(`   validator: ${final.length} valid (${validated.filter((v) => v.status === 'flagged').length} flagged for human review), ${invalidated.length} invalidated`);
  passed = [...passed, ...invalidated];

  // Mechanical board validator (F-33, spec-win-dist-and-coherence-sim.md §A.5).
  // Additive to the strict validation above, not a replacement: annotate-and-
  // keep (locked decision #3) — stamps `validation` violations onto a
  // candidate without dropping it, covering checks strict validation doesn't
  // make (book-is-bettable, n_books>=3 thin-market kill switch, the
  // superbowl_matchup sim-price-only policy, and an independent dossier-edge
  // cross-check). Violating recs stay in `final` and render flagged in HTML.
  final = validateBoardBatch(final, dossier);
  const boardFlagged = final.filter((c) => c.validation?.length).length;
  if (boardFlagged) console.log(`   board validator: ${boardFlagged} candidate(s) flagged (kept, annotated) — see 'validation' on each rec`);
  // Tier-3 fix: an empty final book used to render a complete, clean-looking
  // report and exit 0 — visually indistinguishable from "the model looked
  // and found nothing worth playing" (the actual 2026-09-01/09-02 incidents).
  meta.final_empty = final.length === 0;
  if (meta.final_empty) console.error('   ⚠ final book is EMPTY — zero recommendations survived to this report. This run is DEGRADED, not merely quiet.');

  // Hedge-basket / parlay-ladder validation (code-owned, same pattern as
  // validateRecommendation above) — resolves every leg against the real
  // dossier price, drops structures where NO leg resolved, keeps partial
  // matches flagged with their unresolved legs visible rather than hidden.
  console.log(`🧺 Validating ${rawHedgeBaskets.length} hedge basket(s) + ${rawParlayLadders.length} parlay ladder(s)`);
  const basketResults = rawHedgeBaskets.map((b) => validateHedgeBasket(b, dossier));
  const ladderResults = rawParlayLadders.map((l) => validateParlayLadder(l, dossier));
  const validBaskets = basketResults.filter((r) => r.status !== 'invalid').map((r) => r.basket);
  const validLadders = ladderResults.filter((r) => r.status !== 'invalid').map((r) => r.ladder);
  const invalidStacks = [...basketResults, ...ladderResults].filter((r) => r.status === 'invalid');
  console.log(`   ${validBaskets.length} valid basket(s), ${validLadders.length} valid ladder(s) (${invalidStacks.length} invalidated: no leg resolved)`);
  const portfolioStrategy = buildPortfolioStrategy({
    primary: PRIMARY,
    baskets: validBaskets,
    ladders: validLadders,
    rawStrategies: rawPortfolioStrategies,
    scenarioReview,
    invalidStacks,
  });
  const watchlistReview = buildWatchlistReview(dossier, watchlist);

  const ranked = rankByAxis(final);
  const proposalInbox = await exportOfficialProposalDrafts(final, dossier, meta, officialConfig);
  await mkdir(OUT_DIR, { recursive: true });
  const safeSuffix = OUT_SUFFIX ? `-${OUT_SUFFIX.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '')}` : '';
  const base = path.join(OUT_DIR, `portfolio-${meta.date}${safeSuffix}`);
  await writeFile(`${base}.html`, renderHTML(ranked, passed, killed, byModel, meta, validLadders, validBaskets, portfolioStrategy, watchlistReview));
  await writeFile(`${base}.md`, renderMD(ranked, passed, killed, byModel, meta, validLadders, validBaskets, portfolioStrategy, watchlistReview));
  await writeFile(`${base}.raw.json`, JSON.stringify({ meta, models: ok, raw, stage2_3: raw2, candidates, final, passed, killed,
    human_watchlist: watchlist,
    human_watchlist_review: watchlistReview,
    hedge_baskets: { raw: rawHedgeBaskets, valid: validBaskets },
    parlay_ladders: { raw: rawParlayLadders, valid: validLadders },
    portfolio_strategy: { raw: rawPortfolioStrategies, final: portfolioStrategy },
    official_proposal_inbox: proposalInbox,
    invalidated_stacks: invalidStacks }, null, 2));
  await persistRecommendations(final, meta);
  await persistRecommendationRuns(meta, { stage1: candidates, killed, passed, final });
  console.log(`\n✅ ${base}.html`);
  console.log(`✅ ${base}.md`);
  console.log(`   final book: ${final.length} · passed/killed: ${passed.length + killed.length}`);
  console.log(`   open: Start-Process "${base}.html"`);

  // Tier-3 fix: fail loud. The report is still written above — a degraded
  // run is more useful to review than none at all — but the process now
  // signals non-zero so a caller (a scheduled run, a wrapper script) can
  // detect "this needs a human look" without parsing the HTML.
  const degradedReasons = [
    meta.stage1_errors ? `${meta.stage1_errors.length} Stage-1 model error(s)` : null,
    meta.committee_ran === false ? `committee crashed (${meta.committee_error || 'no error message captured'})` : null,
    meta.final_empty ? 'final book is empty' : null,
  ].filter(Boolean);
  if (degradedReasons.length) {
    console.error(`\n⚠ DEGRADED RUN — ${degradedReasons.join('; ')}. The report above was still written; review it before trusting it.`);
    process.exitCode = 1;
  }
})().catch((e) => { console.error('✖', e.message); process.exitCode = 1; });
