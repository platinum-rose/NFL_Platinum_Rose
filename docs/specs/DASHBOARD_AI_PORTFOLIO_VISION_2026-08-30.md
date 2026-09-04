# Dashboard / AI Weekly Portfolio — Vision & Gap Analysis

**Status:** DRAFT — for Andy's review. No code written against this document. Per this project's existing governance (see `docs/specs/ALPHA_TESTING_SPEC.md` §2, `ALPHA_PHASE3_SUPERCONTEST_SURVIVOR_HANDOFF.md`), no implementation should begin until Andy signs off on scope and the open decisions in §5.

**Author:** Claude/Cowork, 2026-08-30, verified directly against the live repo (not assumed from memory).

## 1. Andy's Stated Goal (verbatim intent, lightly organized)

> Evaluate the current UI for the NFL Dashboard, figure out what users want to see so they can evaluate and make their bets, then track them. Build an AI-synthesized portfolio, week-by-week, using all available intelligence -- experts, podcasts, simulations, everything -- to produce the most sophisticated betting recommendations possible. Put all of that in a dashboard that lets users dig deeper, ask AI for further context, and feel they've done their due diligence before betting. The current UI doesn't fit that goal.

Three requirements fall out of this: (1) a **weekly, AI-synthesized recommendation layer** -- not just raw odds/matchup data; (2) **interactive due-diligence** -- drill-down and ask-AI per recommendation, not a static readout; (3) a **closed loop** from recommendation to bet placement to tracking, all in one dashboard experience.

## 2. What Already Exists (verified live in the repo, not assumed)

This is the important finding: **the hard part -- a real, disciplined, multi-model AI synthesis engine -- already exists and already works.** It's just scoped to the wrong market type and surfaced in the wrong place.

### 2a. The synthesis engine (`agents/portfolio-dossier.js` + `agents/portfolio-synthesize.js`)
- `portfolio-dossier.js` assembles one compact payload per synthesis run: vig-stripped fair probabilities, cross-book divergence, best price/book, line movement, per-market analyst leans with attribution, prior-year record grounding, an experts roster, and adjacent signals for correlation.
- `portfolio-synthesize.js` runs that dossier through a real 3-stage committee: **Stage 1** (Analyst, one call per model, default Opus 4.8 + Fable 5) produces full candidate picks with fair price/edge/confidence/thesis/disconfirming-factor; **Stage 2** (an independent Skeptic model that did not generate the picks) attacks each one; **Stage 3** (Risk/Editor) sees all survivors together for correlation/exposure judgment and finalizes stake tiers. Output: reviewable HTML/MD/raw-JSON, optionally persisted to Supabase `futures_recommendations` for backtesting.
- **This is precisely the sophistication Andy is asking for.** It is real, it has run live (S363's 22-candidate run, the 2026-07-27 watchlist re-run), and the validator layer (code-owned, not model-owned) has already caught real bad output (stale prices, non-positive EV, book mismatches) -- i.e., it has real safety rails, not just a prompt.
- **The gap: it is scoped to futures markets only** (`ODDS_SIGNAL_MARKETS = {superbowl, wins, playoffs, division, conference}` plus award/multiway markets). There is no equivalent pipeline for weekly game markets -- spreads, totals, player props for this week's slate. That's the literal thing Andy is picking against on Sundays and it has none of this machinery behind it today.
- **The gap: it's a CLI tool, not a dashboard surface.** Output is static HTML/MD files in `.nfl/portfolio/`, run manually (`node agents/portfolio-synthesize.js ...`), reviewed outside the app. No UI in `src/components` reads or renders this output at all (confirmed by search -- the only reference to `portfolio-synthesize` inside `src/` is descriptive text inside `FuturesAgentChat.jsx`, not a data consumer).

### 2b. The closest thing to "ask AI for more context" (`src/components/agent/FuturesAgentChat.jsx`)
- A live, conversational AI chat tab that exists specifically so a user can ask follow-up questions about **futures** picks. Its own system prompt explicitly tells the model to reproduce the Analyst -> Skeptic -> Risk discipline within a single live pass, since it can't literally split into three model calls in a chat turn.
- This is a real precedent for "ask AI to dig deeper" -- it just lives inside the Futures Hub (`FuturesHub.jsx`'s `futures-ai` sub-tab), gated to `profileCanUseAI`, and only knows about futures, not weekly games.
- Separately, `UnifiedIntelHub.jsx` has a generic `AgentChat` tab -- broader-purpose AI chat, not scoped to any specific pick or market, no drill-down-from-a-recommendation UX.

### 2c. The current Dashboard tab (`src/components/dashboard/Dashboard.jsx`)
- It is a **schedule/matchup browser**: search, sort (by kickoff time, spread size, total, secondary-mismatch severity), and filter chips (preseason/regular, completed, dome games, big spread, high total, has-prediction-market, has-expert-picks). Each game renders as a `MatchupCard` (56KB component -- significant per-game detail already exists there: line, injuries, secondary matchup mismatches, sim results, prediction-market contracts).
- What it does **not** have: any synthesized recommendation, confidence score, thesis, or ranking of "which of this week's games/props are the best bets." It shows you the world; it doesn't tell you what to do with it. That's the mismatch Andy is naming.

### 2d. Bet placement and tracking (already real, already wired)
- `handleBet` / `myBets` (in `App.jsx`, backed by `PR_STORAGE_KEYS.MY_BETS`) already flows from `Dashboard` and `MatchupWizardModal` into `MyCardModal` (bet slip) and can be locked/parlayed.
- `OfficialPicksTab.jsx` (596 lines) is a real approval workflow for AI-generated candidate picks (the same `candidate-inbox-*.json` files the futures committee produces) -- approve/reject against a paper ledger.
- `PicksTracker.jsx` (528 lines) tracks realized performance.
- **This half of the loop already works.** The gap is entirely upstream: there's no weekly-game recommendation feed to approve/track in the first place.

## 3. The Actual Gap (restated precisely)

Andy doesn't need a new AI engine built from scratch -- he has one, and it's good (independently verified across multiple sessions, catches its own bad outputs). He needs three specific things:

1. **Extend the dossier + committee pipeline to weekly game markets** (spreads, totals, player props for the current week's slate), not just season futures. This is the single highest-leverage piece of work here -- everything else has a precedent to copy.
2. **A new Dashboard-tab-level UI surface** that renders synthesized weekly recommendations (confidence, thesis, disconfirming factor, edge type -- the same fields the committee already produces for futures) as the *landing experience*, with the existing matchup/schedule browser available as a secondary/detail view rather than the only view.
3. **A `FuturesAgentChat`-equivalent scoped to a specific weekly pick** -- click into a recommendation, ask follow-up questions, get the same single-pass Analyst/Skeptic/Risk-discipline answer FuturesAgentChat already does for futures -- wired so "yes, I'm convinced" flows straight into the existing `handleBet`/`MyCardModal`/`OfficialPicksTab` pipeline.

## 4. Proposed Phasing

Not a commitment -- a starting point for Andy to redirect.

- **Phase A -- Weekly dossier extension.** Extend `portfolio-dossier.js` (or a new `weekly-dossier.js` sharing its lib code) to assemble the same fair-price/divergence/lean/adjacent-signal payload for this week's spreads/totals/props instead of futures markets. Reuses `win-dist.js`, `named-status-review.js`, `dossier-freshness-gate.js` as-is where market-shape allows.
- **Phase B -- Weekly committee run.** Point `portfolio-synthesize.js` (or a thin weekly variant) at the Phase A dossier. Same 3-stage discipline, same validator. Real cost implication to flag now, not discover later: the S363 futures run was ~$1.90-2 per model per run for one slate; a weekly cadence across a full season is a recurring cost Andy should size before committing to a schedule (daily? Tuesday-after-injury-reports? Thursday pre-lock?).
- **Phase C -- Dashboard surface.** New component (name TBD -- `WeeklyPortfolioView` or similar) as the Dashboard tab's primary view, rendering Phase B's output with the same rigor the futures portfolio HTML already has, backed by real data, not a mockup.
- **Phase D -- Contextual AI drill-down + bet-flow wiring.** Per-recommendation "ask AI" entry point (FuturesAgentChat pattern, scoped to that pick's dossier context) plus a direct path from "convinced" into `handleBet`/`OfficialPicksTab`.

Each phase is independently shippable and reviewable, matching how Alpha Phase 1/2/3 have been run on this project -- spec'd, approved, built, verified against the real test suite before moving on.

## 5. Open Decisions Needing Andy's Input Before Any Build Starts

1. **Cadence and cost ceiling:** how often should the weekly committee run (once per week vs. re-run as lines move), and what's an acceptable per-week AI spend?
2. **Market coverage for Phase A:** all of spreads + totals + props from week one, or spreads/totals first (closer to the existing futures shape) with props as a follow-on (props have no existing data source per `PROPS-1` in `TASK_BOARD.md` -- `src/lib/propsTools.js` is still stubbed)?
3. **Where does this live relative to the existing Dashboard?** Replace the current matchup-browser as the default Dashboard view, or add the new recommendation view as a new top-level tab/sub-tab alongside it (lower risk, keeps the existing schedule browser for anyone who prefers it)?
4. **Alpha tester exposure:** should Alpha testers (including Tyler Bradford, onboarded this session) see this at all, a sandboxed/demo version of it, or is it owner-only like today's Futures Portfolio tab (`profileCanAccessOwnerPortfolio`-gated)? This has real teeth given the master Alpha spec's hard rule against exposing the owner's real portfolio to testers.
5. **Build order:** Phase A/B (the data/AI engine) before Phase C/D (the UI), or a thin vertical slice through all four phases for one market type first to validate the full loop end-to-end before scaling market coverage?

No implementation should begin until Andy responds to these five points.
