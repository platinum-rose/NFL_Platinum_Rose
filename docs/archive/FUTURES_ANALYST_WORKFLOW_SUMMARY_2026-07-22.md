# NFL Futures/Betting Analyst — Full Workflow Summary

_Written 2026-07-22 for external review (Codex gave the original second-opinion critique that shaped stages 3-6 below; this doc summarizes the resulting architecture so that review can go further)._

## 0. What this is

Platinum Rose is a personal NFL betting-analytics dashboard (React 19 + Vite + Supabase). This document describes the **Futures/Betting Analyst workflow** — the pipeline that turns raw market data into reviewable season-long futures recommendations (division winners, conference winners, Super Bowl, win totals, playoffs, awards). Everything here is **decision support only**: the pipeline proposes, a human (Andy) decides and places every bet himself. Nothing in this system executes a trade or a wager.

There are two parallel surfaces that consume the same underlying data:
1. **The offline batch pipeline** (`agents/portfolio-dossier.js` → `agents/portfolio-synthesize.js`) — run on demand, produces a full reviewable portfolio document (`.html`/`.md`) plus a durable log.
2. **The live interactive chat agent** (`FuturesAgentChat.jsx`) — an LLM + tool-calling chat the Creator talks to in the dashboard UI, answering ad hoc questions and one-off recommendations.

Both draw on the same Supabase tables and, as of this pass, are held to the same reasoning discipline — but the offline pipeline runs that discipline as genuinely separate model calls, while the live chat agent has to approximate it within a single pass (see §7).

---

## 1. Canonical data layer

Source-stamped Supabase tables, append-only where it matters (never overwriting history):

| Table | What it holds |
|---|---|
| `games` | 2026 schedule spine — game_id, week, kickoff, home/away, plus (added this pass) rest days each side, division-game flag, venue, assigned referee, and nflverse's true consensus closing lines |
| `game_odds_snapshots` / `futures_odds_snapshots` | Time-series odds — one row per (game or team, market, book, snapshot) |
| `line_movements` / `game_splits_history` | Detected line movement and betting-splits (ticket% vs money%) time series |
| `nfl_team_season_stats` | Season-level record, ATS, O/U, offensive/defensive EPA-per-play, formation tendencies, league ranks (1=best) |
| `nfl_rosters` | Weekly nflverse roster snapshots (current personnel, position, status) |
| `referee_tendencies` | Per-referee historical scoring/penalty tendencies |
| `podcast_transcripts` / `podcast_host_summaries` | Raw and (newer, richer) per-host-structured expert intel |
| `research_intel_notes` / `research_pick_signals` | Article/RSS-sourced picks and leans |
| `normalized_signals` | An LLM pass that cleans the three intel sources above into (team, market, direction, strength) rows — the single richest cross-source signal table |
| `user_picks` | Graded game-level picks (WIN/LOSS/PUSH) — historically the only gradable table in the whole system |
| `futures_recommendations` (new, migration 042) | Durable log of every final Analyst Committee recommendation — see §6 |

A parallel, still-open data-quality issue: **three incompatible `game_id` formats** exist across `games`, `game_odds_snapshots`/`game_splits_history`, and nflverse's own files. Every join in this pipeline resolves games by `(season, week, home/away abbreviation)` instead of matching `game_id` strings, as a workaround. This hasn't caused a wrong join yet but is a standing risk any new cross-table feature needs to route around explicitly. (Filed as `GAMEID-FORMAT`, scope decision still pending.)

---

## 2. Deterministic feature layer (code, not the model)

`portfolio-dossier.js` computes every piece of market math in plain code before any LLM sees it:
- No-vig fair probability (median across books), best price at a **placeable** book (FanDuel/DraftKings excluded — the user can't bet them), cross-book divergence, per-book line movement.
- Strength of Schedule: sum of a team's 2026 opponents' consensus win-total lines (rank 1 = hardest), plus a backward-looking prior-year opponent win% cross-check.
- **Season-aggregate per-team signals** (added this pass, rolled up from per-game data since futures markets are season-long, not single-game):
  - `analytics` — current-season EPA-per-play (off/def) + league rank + formation tendencies, pulled from `nfl_team_season_stats` (previously only win-loss/ATS made it into the dossier; the EPA columns existed but were never surfaced).
  - `schedule_context` — the team's OWN rest/travel profile (short-rest game count, average rest, division-game count) — distinct from SoS, which is about opponent quality.
  - `officiating_context` — average scoring/penalty tendencies across the team's known assigned referees. Usually sparse pre-season (refs aren't assigned until close to kickoff) — always carries a sample-size confidence tag.
  - `clv_signal` — closing-line movement toward/away from the team (this app's earliest tracked snapshot vs. nflverse's true close) plus sharp-vs-public divergence from betting splits.
  - `roster_churn` — latest week-over-week roster diff (adds/drops/status changes), a personnel-instability signal.
- A `signal_coverage` count (how many of 32 teams have each signal populated) travels with every dossier run, so an LLM reading it treats a zero count as "not enough data yet," not "no edge."

---

## 3. Evidence packets

The dossier's `synthesis_input` is one compact JSON object per market (division_afc_west, wins, superbowl, ...), each containing a per-team row with all of §2's computed fields attached, plus:
- `prior` — 3 years of W-L/ATS record, for grounding bounce-back theses in fact.
- `lean` — per-market intel lean (back/fade/over/under counts + average strength) from `normalized_signals`, with each sample's source attributed.
- `adjacent_signals` — game-level and prop leans per team, for Week-1 correlation/hedge construction.
- `roster_churn` (top-level map, not per-market, since personnel movement isn't tied to one market).

This is the "case file" handed to the model — never the raw table dump.

---

## 4. The Analyst Committee (offline pipeline, 3 model calls)

Originally (S274) this was a single A/B pass: two models (Opus 4.8 + Fable 5, configurable) each independently produced a full candidate portfolio, diffed into "both agree" vs "one only." As of this pass it's a genuine 3-stage committee:

**Stage 1 — Market + Football Analyst.** Unchanged mechanically (still one call per configured model). Each recommendation must now separate two claims instead of blending them:
- `market_view` — pure price/consensus read (is this priced differently from fair value, and why).
- `football_view` — does the team's actual context (EPA, schedule, roster, rest) support or contradict that price.
A mismatch between the two is itself flagged as a disconfirming factor, not smoothed over. `mergeStage1()` flattens the A/B results into one candidate list keyed by (market, selection), preserving per-model agreement (`2/2 models` vs `1/2`) rather than collapsing straight to a binary split.

**Stage 2 — Skeptic.** A separate model call that did **not** generate the candidates. Its only job is adversarial: attack each one independently, looking for whether the "edge" is real mispricing vs. just book vig, whether the football_view thesis is actually supported by the evidence cited, and whether the given disconfirming factor is really the strongest one. Returns per-candidate: a confidence adjustment (usually negative), an optional stronger disconfirming factor, and a verdict — `hold` / `downgrade` / `kill`. Killed candidates go into a visible `killed[]` list with the reason, never silently vanish.

**Stage 3 — Risk/Portfolio + Editor.** A separate model call that sees **all** surviving candidates together (the only stage where cross-play correlation is even judgeable). Finalizes `bet_threshold` (the worst price still worth taking), `needs_human_review`, and `stake_tier`, and can `pass` on a candidate for portfolio reasons distinct from the Skeptic's (e.g. too correlated with a bigger position already in the book, or the portfolio is already overexposed to one team/division).

Flags exist to run a fast/cheap single pass (`--skip-committee`) or point stage 2/3 at a different, cheaper model than stage 1 (`--skeptic-model`, `--risk-model`).

---

## 5. Structured output contract

Every stage-1 recommendation is forced into:

```json
{
  "market": "superbowl|conference_afc|division_nfc_east|wins|playoffs|...",
  "selection": "<team or over/under X.5>",
  "type": "favorite|value|longshot|hedge",
  "edge_type": "math|thesis|stale_price|hedge|longshot",
  "book": "<placeable book only>",
  "price": -110,
  "model_fair_prob": 0.42,
  "edge_pct": 5.2,
  "confidence": 70,
  "stake_tier": "core|standard|small|speculative",
  "knowledge_based": false,
  "market_view": "1 sentence — pure price/consensus read",
  "football_view": "1 sentence — does team context agree",
  "thesis": "<=2 sentences",
  "disconfirming_factor": "the single best reason not to bet it",
  "bet_threshold": "the worst price still worth taking",
  "needs_human_review": false,
  "evidence_ids": ["analytics.off_epa_rank", "clv_signal.sharp_lean_games", "..."],
  "sources": ["named analysts/outlets"],
  "timing": { "action": "bet_now|wait|pair|pass", "trigger": "...", "expected_move": "...", "rationale": "..." },
  "correlated_week1": [ { "game": "...", "bet": "...", "relationship": "complement|hedge" } ]
}
```

`edge_type` is the model's own honest self-tag — used downstream by code (§6), not re-interpreted by another model. `evidence_ids` are lightweight pointers back to which dossier fields backed a claim (not full row IDs — a pragmatic traceability layer, not a data-lineage system).

---

## 6. Multi-axis ranking (code, not model-freeform)

Post-committee, `rankByAxis()` groups the final surviving candidates into six views instead of a single consensus/divergent split:
- **Strongest math edge** — sorted by |edge_pct|, `edge_type=math` preferred (falls back to all candidates if none tagged math).
- **Strongest thesis edge** — `edge_type=thesis`, sorted by confidence.
- **Strongest stale-price edge** — `edge_type=stale_price`.
- **Best low-correlation portfolio adds** — no `correlated_week1` entries and not speculative-tier.
- **Longshots** — speculative stake tier, longshot type, or longshot edge_type.
- **Passed/killed** — shown, not hidden, with the reason and which stage rejected it (Skeptic vs. Risk/Editor).

A candidate can land in more than one bucket (a longshot can also be a stale-price story) — this is a ranking/view, not a partition.

---

## 7. Live interactive chat agent (single pass, same discipline)

`FuturesAgentChat.jsx` is a normal LLM tool-calling chat (Claude or GPT-4o, whichever key the Creator supplies), not a 3-call pipeline — a chat turn only gets one model call. It now has all 13 futures-specific tools documented in its system prompt (previously only 3 of them were), and a **Reasoning Discipline** section that asks the single model to *internally* reproduce the committee's rigor within one pass:
- State the market view and football view as two separate sentences.
- Run a self-skeptic step before finalizing — name the strongest disconfirming factor.
- Mentally tag the edge type, state a bet_threshold, and flag needs-human-review conditions explicitly.
- Check the Creator's currently-open futures positions (loaded into context at session start) for correlation before recommending something new.
- Same small-sample caveats as the offline pipeline for referee/CLV/churn signals.

This is an explicit **known asymmetry**: the offline pipeline gets genuine adversarial separation (a model that didn't generate the pick attacking it); the live chat agent only gets a single model asked to grade its own homework. Whether that's an acceptable trade-off for a live chat UX, or whether the live agent should also make a second tool-orchestrated "self-check" call before answering, is an open question (see §9).

---

## 8. Backtesting foundation (logging built; grading is manual; calibration is not yet possible)

New migration `042_futures_recommendations.sql`: one row per final (post-committee) recommendation per run, carrying the full reasoning trail — thesis, disconfirming factor, market/football view, Skeptic note + verdict, bet_threshold, evidence_ids, sources, timing — plus a `status` column (`pending` by default). `portfolio-synthesize.js` persists here automatically after every run (skipped cleanly, non-fatal, if Supabase credentials aren't present).

**What's explicitly NOT built:** automated grading. There is no queryable "who actually won this division/conference/award/win-total" table anywhere in this codebase yet — building one is its own project. For now, `scripts/grade-futures-recommendation.js` lets Andy record results by hand (`--list` to find a row, then `--result won|lost|push|void|superseded`) as markets resolve over the season. Only once enough rows are graded does real calibration analysis become possible: hit rate by confidence bucket, which `edge_type` actually performs best, which data sources correlate with good calls. That's realistically a multi-month wait for signal, not a same-session gap.

Separately, before this pass, futures positions the Creator actually holds only ever lived in browser `localStorage` — no durable Supabase history once a position closed. That gap is unrelated to the recommendation log above (one tracks what the pipeline *proposed*, the other tracks what the Creator actually *did*) and is still open.

---

## 9. Open questions for review

Explicitly inviting critique on:
1. **Is single-pass self-skepticism (§7) a meaningful substitute for a genuinely separate Skeptic call?** Or is the live chat agent's "grade your own homework" approach materially weaker than the offline pipeline's real second model, regardless of how the prompt is worded?
2. **Cost/latency of the 3-stage committee** — a full offline run is now 3 sequential model calls (more if stage 1 runs A/B). Is there a cheaper way to get the same adversarial separation, e.g. batching stage 2 across all candidates in one call (already done) vs. per-candidate calls (more expensive, more thorough)?
3. **Is a self-reported `edge_type` reliable enough to drive ranking?** ~~Nothing currently audits whether the model's own math/thesis/stale_price/hedge/longshot tag is honest — should there be a code-side sanity check (e.g. cross-referencing `edge_type=math` claims against the dossier's own `value_gap`/`book_divergence` fields)?~~ **Addressed 2026-07-22 (Codex round 2):** `validateRecommendation()` now recomputes `edge_pct` from the model's own `model_fair_prob`+price (never trusts the self-reported figure) and downgrades `edge_type="math"` to `"thesis"` when the dossier's own edge fields don't support it — see `docs/FUTURES_AGENT_DATA_INVENTORY_2026-07-21.md`'s "Codex review round 2" section. Full evidence_ids/book/price validation also added. Portfolio-level correlation (question #4 below) is still open — that's a distinct, harder problem.
4. **Is "no `correlated_week1` entries" a sufficient proxy for "low correlation"** in the ranking layer, or does real portfolio correlation (same division, same underlying driver, e.g. one QB's health affecting three different markets) need its own explicit computation rather than relying on the model to have populated that field honestly?
5. **Manual-only grading is a real bottleneck** — is it worth building a minimal automated resolver for at least the simplest markets (e.g. win totals, once `game_results` covers a full season) before waiting for a general one?
6. **The `GAMEID-FORMAT` cross-table risk (§1)** underlies every join this whole pipeline makes. Is routing around it via `(season, week, abbreviation)` matching indefinitely a reasonable long-term posture, or does it need to be fixed before this system scales further?
7. **Model funding/routing** — Anthropic and OpenAI keys both exist; OpenAI is the currently-funded one (~$7). All defaults currently assume Anthropic (`claude-opus-4-8,claude-fable-5`) for stage 1. Worth a real cost estimate per full committee run to decide a sensible default model tier.
