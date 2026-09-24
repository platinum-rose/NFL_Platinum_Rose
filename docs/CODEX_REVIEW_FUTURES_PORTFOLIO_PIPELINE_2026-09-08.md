# Futures Portfolio Pipeline — Full Spec for Independent Codex Review

Compiled 2026-09-08. Written to be self-contained — paste this whole document as the opening message of a new Codex session. The ask: **read this, then independently review the actual code it describes for gaps, bugs, or design problems we haven't caught.** We (Andy + a Claude session) have been auditing this pipeline hard for the last several days and have a punch list of known issues (Section 10), but the whole point of bringing in a second reviewer is to catch what we're both blind to by now.

Repo: `E:\dev\projects\NFL_Dashboard`. This is a personal project — a Vite/React dashboard app plus a large set of standalone Node scripts under `agents/` and `scripts/` that don't go through the app build at all. Everything in this document concerns the standalone-scripts side, specifically the "Futures" betting-portfolio pipeline, which is unrelated to the dashboard's fantasy-football features (see Section 11 — do not confuse the two, they share a repo but not a purpose).

---

## 0. What this pipeline actually is

Andy runs a personal NFL futures-betting research operation. He follows odds across multiple sportsbooks, reads/listens to a specific set of trusted analysts and podcasts, and wants an AI committee to mine all of that for asymmetric betting value — then present it as a **reviewable proposal**, never an executed action. Nothing in this pipeline places a bet, moves money, or is allowed to represent itself as advice a human should blindly follow. Every output is decision support for Andy, who makes every real decision himself.

The pipeline turns a large amount of heterogeneous intel (sportsbook odds, injury reports, podcast transcripts, analyst opinions, advanced stats, prediction markets, hand-curated reference notes) into one JSON "dossier" snapshot, then runs that dossier through a 3-stage LLM committee (Analyst → Skeptic → Risk/Editor) to produce a ranked, validated, human-reviewable betting portfolio (HTML + Markdown report).

## 1. Where things are — orientation

Three files do essentially all of the real work:

- **`agents/portfolio-dossier.js`** (~1,860 lines) — pulls every intel/odds/stats source into one `.nfl/portfolio/dossier-<date>.json` snapshot. Run: `node agents/portfolio-dossier.js --season 2026`.
- **`agents/portfolio-synthesize.js`** (~3,400 lines) — reads that dossier plus several sources it loads independently, prompts 1-2 models through a 3-stage committee, validates every output mechanically, and renders the HTML/MD report. Run: `node agents/portfolio-synthesize.js --dossier <path from previous command>`.
- **`agents/portfolio-preflight.js`** — free, read-only, no paid API calls. Checks every evidence lane's freshness/completeness/wiring and simulates the prompt-assembly step without spending anything. **Run this before every paid synthesis call, always.** `node agents/portfolio-preflight.js --json` for machine-readable output.

The correct run order is: `agents/signal-normalize.js` → `agents/portfolio-simulate.js` (sim-patch) → `agents/portfolio-dossier.js` → `agents/portfolio-preflight.js` (verify clean) → `agents/portfolio-synthesize.js`. **This order is not enforced by any code** — running dossier assembly before the signals sidecar regenerates, or skipping the sim patch, both degrade the result silently rather than erroring. This is one of the things worth an independent look: should there be a single orchestrator script that enforces this order, or at minimum a loud check at the start of each stage confirming the previous stage's output is current?

Companion documents already written from this same audit effort (read these too, they have detail this spec compresses):
- `docs/audits/2026-09-08-intel-pipeline-map/INTEL_PIPELINE_MAP.md` — the original full source-to-prompt trace, with corrections.
- `docs/audits/2026-09-08-intel-pipeline-map/PRE_COMMITTEE_CHECKLIST.md` — the live, currently-open punch list, staged by pipeline layer.
- `docs/archive/CODEX_HANDOFF_2026-07-22.md`, `docs/archive/FUTURES_ANALYST_WORKFLOW_SUMMARY_2026-07-22.md`, `docs/archive/FUTURES_ANALYST_CODEX_REVIEW_2026-07-22.md` — the original design session and a prior Codex review, from when the 3-stage committee and hedge/ladder features were first built.
- `docs/antigravity/CANONICAL_EXTRACTION_PIPELINE.md` — a separate, parallel extraction effort (see Section 4) that produces some of the intel this pipeline now consumes.

---

## 2. Strategic vision — what Andy is actually trying to build

This is worth stating explicitly because it's encoded in prose inside `SYSTEM_PROMPT` (in `portfolio-synthesize.js`) rather than in any design doc, and a reviewer who only reads code structure will miss the intent.

**The core instruction to the model**, verbatim from the prompt: *"You are a sharp NFL futures + betting-market analyst producing a REVIEWABLE portfolio for a human bettor who makes all final decisions. You are decision support, not an instruction to bet. Be calibrated and skeptical, never promotional — but your job is to MINE the entire market for edge, not rubber-stamp favorites."*

Concretely, Andy wants the committee to:

1. **Hunt asymmetric value, not chalk.** Explicitly look for teams the market is underpricing because the price is anchored to a misleading prior-year record — injury-driven bad seasons, teams with a soft schedule or a coaching/QB upgrade nobody's re-priced yet. The prompt requires the model to *name why the market is anchored wrong*, not just cite a positive number.
2. **Run a bounce-back/regression scan both directions** — weigh last-place teams for regression up and inflated favorites for regression down.
3. **Diversify by type** (`favorite | value | longshot | hedge`) — a portfolio of only favorites is explicitly called a failed assignment in the prompt.
4. **Build real portfolio structures, not just a pick list**: hedge baskets (small stakes spread across several other teams' deep-run odds as variance insurance against Andy's primary conviction positions), parlay ladders (a single team's correlated markets — win total → playoffs → conference → Super Bowl — sequenced so an early leg's win can fund a later leg's stake), and playoff hedge plans (trigger-based future decisions once real playoff matchups are known — "if Bills reach the AFC title game against Ravens, price a Ravens hedge"). There's a full role taxonomy for this: `anchor_bet`, `ladder_bet`, `coverage_bet`, `option_bet`, `pocket_hedge`, `dead_cost`, `funded_liability`.
5. **Respect a Week-1 timing layer** — for every futures view, decide whether an imminent early-season result is a price catalyst worth waiting for (`timing.action = "wait"`) versus value that will vanish if you don't act now (`"bet_now"`), and identify correlated Week-1 game bets that either complement or hedge a futures position.
6. **Never skip the disconfirming case.** Every recommendation must include its single strongest reason NOT to take it. A play with no honest counter-case is explicitly treated as not ready.
7. **Size to conviction and variance, in relative units only, never dollars** — favorites/value can be `core`/`standard` stake tier, longshots must be `small`/`speculative`. There's also a scale-in pattern (`entry_plan`) for a candidate whose thesis is intact but whose current price is marginal — a smaller stake now, with an explicit trigger price for adding later, rather than an outright pass.
8. **Trust code-computed numbers over the model's own math, always.** Every price/edge the model reports is recomputed server-side from the dossier's real data before being trusted (see Section 8) — code owns the math, the model owns the thesis.

**Source-of-truth hierarchy Andy has stated but which is only partially encoded in the prompt today** (see Section 10, item 2 — this is one of the biggest open gaps): sportsbook price action should be primary evidence; named, timestamped analyst leans are corroboration; narrative/trench/training-camp context should be supplementary color that never overrides price-based edge on its own. Right now only `prediction_markets`, `dvoa`, `sos`, and `prior` get explicit interpretive framing in the prompt — `vault_analytical_reads`, `training_camp_intel`, and the newly-added `master_reports` (Section 4) currently reach the model as raw JSON with zero guidance on how much to trust them. **This is a real, open gap, not yet fixed** — flagging it here specifically because it's exactly the kind of "looks wired up but isn't actually calibrated" issue an independent reviewer is well-placed to catch by reading the prompt text itself.

Andy has also told us directly (this is not encoded in the prompt at all, worth deciding whether it should be) that he specifically trusts five shows he's followed for years above any other podcast/article source: **Sharp or Square, Even Money, BettingPros, Action Network, and The Favorites.** He deprioritized (later: fully removed) a sixth source, BettorDay's proprietary trench/O-line/D-line ratings, because he isn't currently paying for that subscription and suspects the free tier is thin. That removal is done (Section 9), but the positive half of that decision — explicitly telling the model to weight the five trusted shows more heavily — has not been written into the prompt yet.

---

## 3. High-level pipeline

```
Raw intel sources (Section 4)
        │
        ▼
agents/signal-normalize.js  ──►  normalized_signals (Supabase)
        │                         + .nfl/portfolio/normalized-signals-<model>.json sidecar
        ▼
agents/portfolio-simulate.js (sim-patch — adds simulated win totals/probabilities)
        │
        ▼
agents/portfolio-dossier.js  ──►  .nfl/portfolio/dossier-<date>.json
        │        (pulls ~20 independent fetch*() lanes, Section 5)
        ▼
agents/portfolio-preflight.js  (free, read-only gate — run before spending money)
        │
        ▼
agents/portfolio-synthesize.js
        ├─ loads dossier + several MORE independent sources (Section 6)
        ├─ builds SYSTEM_PROMPT + user prompt (--shadow-slim caps volume, Section 7)
        ├─ Stage 1: Market+Football Analyst — 1-2 models in parallel (MODELS)
        ├─ Stage 2: Skeptic — independent model, can kill Stage-1 candidates
        ├─ Stage 3: Risk/Portfolio Editor — sizing, hedge/ladder math, final cut
        ├─ code-owned validation (Section 8) — every price/edge recomputed, never trusted from the model
        └─ render HTML/MD report; optionally persist to Supabase (--no-persist to skip)
```

---

## 4. Raw intel sources — full inventory

| Source | Ingest agent | Cadence | Storage |
|---|---|---|---|
| 11 RSS/JSON feeds (Action Network, BettingPros, WalterFootball, ESPN NFL, VSiN, Sharp Football Analysis, ProFootballTalk, PFF, Rotowire, Football Outsiders, THE WINDOW) | `agents/research-intel-ingest.js` | `research-intel-ingest.yml` | `research_intel_notes`, `research_pick_signals`, `feed_health` |
| Podcast transcripts (audio → text) | `agents/podcast-ingest.js` | `podcast-ingest.yml`, weekly | `podcast_transcripts`, `podcast_episodes`, `podcast_feeds` |
| Podcast full re-extraction pass | `agents/podcast-reextract.js` | manual, ad hoc — an early/abandoned pilot, only 6 rows exist | `podcast_reextractions` |
| Podcast host summaries (full-transcript fidelity, no truncation) | `agents/podcast-host-summary.js` | manual — this is the real, wired-in structured-extraction pipeline | `podcast_host_summaries` |
| Podcast picks → Picks Tracker | `agents/pick-extraction.js` | `pick-extraction.yml`, after podcast-ingest | `user_picks` |
| Twitter/X sharp-account tweets (dormant, superseded, safe to ignore) | `agents/x-sharp-ingest.js` | `x-sharp-ingest.yml` | `x_sharp_tweets` |
| Twitter/X bookmarked betslip screenshots (Vision-OCR, Andy's own personal account) | `agents/twitter-bookmarks-agent.js`, run by a local Windows background daemon | continuous while the daemon runs | `research_intel_notes`, `research_pick_signals`, `vault_notes` |
| BettorDay newsletter (trench/O-line/D-line ratings) | `agents/bettorday-newsletter-ingest.js` | `bettorday-intel-ingest.yml` | `nfl_trench_ratings` + local fallback file — **still ingested, but as of 2026-09-08 fully removed from the prompt** (Section 9) |
| BEO (Bookmaker/BetUS-style) futures-odds screenshots | `scripts/ingest-beo-screenshots.js` (OCR) | manual, Andy's own workflow | `futures_odds_snapshots` |
| Live sharp-book futures odds (Circa, Station) | `agents/vegas-web-odds-ingest.js` | manual/ad hoc | `futures_odds_snapshots` |
| Game-level odds / splits | `agents/game-odds-ingest.js`, `agents/odds-ingest.js`, `agents/betting-splits-ingest.js` | scheduled workflows | `game_odds_snapshots`, `odds_snapshots`, `line_movements`, `game_splits_history` |
| Kalshi-style prediction markets (win totals, division/conf/SB) | `scripts/build-prediction-market-map.js` → `scripts/build-cross-market-coherence.js` | manual, local transform | `data/prediction-markets/latest.json` |
| Player injuries | `agents/injury-ingest.js` | `injury-ingest.yml` | `player_injuries` |
| Player availability (ESPN + FantasyPros injury-report APIs, NOT fantasy scoring/projections) | `scripts/build-player-availability.js` | manual | `data/player-availability/latest.json` |
| Training camp intel (beat-reporter practice-report nuggets) | `scripts/build-training-camp-all32.js` + related | manual | `data/training-camp/<season>/latest.json` |
| Named-player status review (contested roles — human-curated) | human-curated | manual | `data/projected-starters/<season>/named-status-review.json` |
| Season stats / advanced analytics (EPA, CPOE, success rate) | nflverse ingest | `nflverse-data-refresh.yml`, **annual, March 1 only** | `nfl_team_season_stats`, `team_analytic_snapshots` |
| DVOA-style efficiency snapshots | `scripts/build-dvoa-snapshots.js` | manual | `team_dvoa_snapshots` |
| Coaching tendency profiles | `scripts/build-coaching-tendency-snapshots.js` | manual — **table is currently empty for every season, real open gap** | `team_coaching_tendency_snapshots` |
| Roster churn (week-over-week adds/drops) | nflverse roster refresh | `nfl-roster-refresh.yml` | `nfl_rosters` |
| Referee tendencies | historical build | manual, not in an active workflow | `referee_tendencies` |
| Schedule | `agents/schedule-ingest.js` | `weekly-update.yml` | `games` |
| Expert dossiers (per-analyst tendency/bias profiles) | `scripts/build-expert-dossiers.js` | manual | `data/expert-dossiers/latest.json` |
| Vault reference library (hand-curated static reference docs) | `agents/vault-seed.js`, manual/static | manual | `vault_notes` at `NFL/Reference/*.md` |
| Vault per-team narrative notes (article/tweet summaries) | `agents/intel-to-vault-sync.js` | daily | `vault_notes` at `NFL/Teams/<ABBR>.md` |
| **Antigravity master intelligence reports** (new — see below) | `agents/master-reports-to-vault-sync.js` | manual, ad hoc | `vault_notes` at `NFL/Reference/Reports/<filename>` |

**Fantasy-football ingest (`agents/fantasypros-*-ingest.js`, `agents/yahoo-adp-ingest.js`) writes to `fantasy_adp`/`fantasy_projections` and is completely separate from this pipeline** — nothing in the futures committee reads fantasy rankings, projections, or ADP data. The only overlap is that `player_availability` (above) happens to use FantasyPros' *injury-report* API as one of two feeds (alongside ESPN's official injuries API) — that's real-status injury data (IR/Questionable/Out), not fantasy scoring, and it's the only FantasyPros touchpoint anywhere in this pipeline.

**The Antigravity corpus** deserves its own explanation since it's the newest addition (this week) and is a separate, parallel extraction effort from a different team/workflow (documented in `docs/antigravity/`): 79 "exhaustive master reports" (division/conference previews, national podcast/expert-forum breakdowns, article recaps) sitting at `scratch/*_master_100percent_exhaustive.md`, synced into Supabase by `agents/master-reports-to-vault-sync.js`. Until 2026-09-08 this corpus was fully synced but **completely invisible to the synthesis prompt** — a path-prefix mismatch (the sync writer used `NFL/Reference/Reports/%`, but the only reader in `portfolio-synthesize.js`, `loadVaultReferenceEvidence()`, only ever queried a fixed 6-file allowlist plus `NFL/Teams/%`). Fixed this week via a new `loadMasterReportEvidence()` function that parses each report's `## 🏆 <Team>` sections (for the 8 division-preview reports) or single-team-name matching (for other report types), attaching team-scoped extractions to `team_profiles[nick].master_reports` and surfacing anything that doesn't map to one team as a league-wide context block. Verified end-to-end via a mocked (`--prompt-only`) dry-run: all 32 teams now get report coverage. **Not yet given SYSTEM_PROMPT interpretive framing** (Section 2) and **not yet exercised through an actual or mocked model call** — only through prompt assembly. This is a good candidate for independent review: does the team-section parsing correctly handle every one of the 79 report formats, or only the 8 division previews it was built and tested against?

---

## 5. Normalization layer

`agents/signal-normalize.js` turns unstructured text into directional, team-canonical leans. It reads five lanes — RSS articles (`research_intel_notes`), podcast free-text intel, podcast structured picks, expert picks (`user_picks`), and podcast host summaries (`podcast_host_summaries`, pre-classified, bypasses the LLM step) — and merges them into `normalized_signals` (Supabase), which `portfolio-dossier.js` reads via a JSON sidecar rather than the raw tables directly.

This is NOT meant to be the only path for intel into the dossier — everything else (odds, stats, DVOA, prediction markets, training camp, player availability, vault reference docs) is already structured and reaches the dossier through its own dedicated `fetch*()` function (Section 6), by design. The one lane that's arguably under-served: `x_sharp_tweets` has no direct read anywhere — its only path to the committee is indirect, through `intel-to-vault-sync.js` writing tweet-derived summaries into `vault_notes`. Worth an independent opinion on whether that's sufficient or whether it deserves a direct read like `research_pick_signals` got.

`research_pick_signals` specifically needs its extra filtering (drops non-NFL rows, guards against a bare "carolina" alias false-matching college lines to the Panthers) — the code's own comment describes this table as "52% verbatim article-headline echoes and >60% CFB/other sports," so it's a raw regex dump that needs the filter to be load-bearing, not decorative.

---

## 6. Dossier assembly — `agents/portfolio-dossier.js`

Each of the following is an independent evidence lane assembled into one dossier; a bug in any one lane is invisible unless you specifically know to check it.

| Function | Reads | Feeds |
|---|---|---|
| `fetchSnapshots()` | `futures_odds_snapshots` | odds/pricing, via `buildOddsView()` |
| `fetchPickSignals()` / `fetchUserPicks()` / `fetchPodcastIntel()` | `research_pick_signals` / `user_picks` / `podcast_transcripts` | `buildLeanView()` (fallback-only for pick signals — normalized_signals is primary) |
| `fetchInjuryContext()` | `player_injuries` | `team_profiles[team].injuries` |
| `fetchTeamStats()` | `nfl_team_season_stats` | `currentAnalytics()` |
| `fetchTrainingCampIntel()` | `data/training-camp/<season>/latest.json` | `team_profiles[team].training_camp_intel` — top 5 by signal_strength |
| `fetchPlayerAvailabilityContext()` | `data/player-availability/latest.json` | `team_profiles[team].player_availability` — see fix note below |
| `fetchPredictionMarkets()` | `data/prediction-markets/latest.json` | `team_profiles[team].prediction_markets` |
| `fetchNamedPlayerSizingGates()` | `data/projected-starters/<season>/named-status-review.json` | `team_profiles[team].named_player_sizing_gate` — **hard-fails the whole dossier build if missing/invalid**, the one lane deliberately designed to block rather than degrade |
| `fetchAdvancedAnalytics()` / `fetchDvoaSnapshots()` / `fetchCoachingProfiles()` | `team_analytic_snapshots` / `team_dvoa_snapshots` / `team_coaching_tendency_snapshots` | `team_profiles[team].analytics` / `.dvoa` / `.coaching_profile` |
| `fetchSchedule()` / `fetchGameOddsOpen()` / `fetchGameSplitsLatest()` | `games` / `game_odds_snapshots` / `game_splits_history` | `team_signals`, SOS calculations |
| `fetchRefereeTendencies()` | `referee_tendencies` | `team_profiles[team].officiating_context` |
| `fetchRosterChurn()` | `nfl_rosters` | `roster_churn` — needs ≥2 distinct weeks or returns `{}` |
| `loadNormalizedSignals()` | `.nfl/portfolio/normalized-signals-<model>.json` sidecar | `experts{}`, `adjacent_signals{}` |

Two fixes worth knowing about since they shape what a reviewer should expect to see in the current code (both landed 2026-09-08, this week):

1. **`fetchPlayerAvailabilityContext()` used to duplicate injury events across its output sublists** — an event tagged both "worsening" and, say, `defensive_front_group` would appear verbatim in both `key_absences` and `defensive_front_risks`, wasting prompt space with no new information. Fixed by computing the most-specific buckets first and excluding already-shown events from the more generic ones.
2. **`fetchRosterChurn()`'s pagination — already fixed as of commit `65d47e3` (2026-09-04), NOT still open.** Both the week-discovery read and the per-week row read are properly paginated now. Two of our own audit docs this week incorrectly carried forward an older "still needs pagination fixed" note without re-checking current code — corrected in `PRE_COMMITTEE_CHECKLIST.md`. Live data currently shows only 1 distinct week of 2026 roster data (expected — week 1 kickoff is 2026-09-11, no roster churn yet), so `roster_churn` is empty right now for a legitimate reason, not a bug.

`fetchAllPaged()` is the shared pagination helper — worth an independent check of every OTHER `fetch*()` call site to confirm none of them has the same class of bug (an unpaginated `.select()` silently truncated to Supabase's 1,000-row default) that the roster function had until 2026-09-04.

---

## 7. `portfolio-synthesize.js` — what it loads beyond the dossier

- **`loadVaultReferenceEvidence()`** — six hand-curated static reference docs (`NFL/Reference/*.md`: coaching tendencies, DVOA glossary, key numbers, ATS framework) plus per-team narrative notes (`NFL/Teams/<ABBR>.md`, both "Analytical Deep-Reads" and "Betting & News" subsections, capped at 8 most-recent items/team).
- **`loadMasterReportEvidence()`** (Section 4) — the Antigravity corpus bridge. As of 2026-09-08 (second pass), reads `vault_notes` via a paginated, ordered loop (500-row pages, `.order('path')`) rather than a single unranged `.select()` — the earlier version could silently truncate or reshuffle report evidence once the corpus grew past Postgres's default row cap, or row order changed between runs.
- **`loadBettorDayTrenchEvidence()`** — still defined, still called, but its result is no longer attached to any team profile field the prompt reads (BettorDay removed from `slimTeamProfile`'s `keepKeys`, Section 9). Left in place in case Andy resumes the subscription.
- **`loadPodcastEvidenceIndex()`** — looks for `docs/Futures_Picks_Summary_<date>.md`. **Nothing in the repo currently produces this file** — open question for Codex: dead code, half-finished feature, or a lost/renamed generator script?
- **`loadExpertDossiers()`**, **`loadLedger()`/`loadWatchlist()`/`loadOfficialConfig()`** — local JSON: analyst tendency profiles, live bankroll exposure, watchlist, and the sizing contract. All three loaders still individually return null on a read error with no change to that specific behavior, but as of 2026-09-08 (second pass) `portfolio-synthesize.js` now enforces the full `agents/portfolio-preflight.js` gate before any real run (see Section 8a, new) — and preflight's own Stage B:money checks already BLOCK on a missing/malformed ledger, watchlist, or official-config file. So the previously-open risk (a run silently proceeding with zero bankroll awareness) is substantively closed as a side effect of that enforcement, not by changing these three loaders directly. Still worth an independent look at whether the loaders themselves should fail loud too, for defense in depth.

---

## 8. The model committee

**Stage 1 — Market+Football Analyst.** One call per model in `--models` (default as of 2026-09-08: `claude-opus-5,claude-fable-5-1`, moved off the prior-generation `claude-opus-4-8,claude-fable-5` — current-gen models carry a standard-priced 1M-token context window, removing what used to be a hard prompt-size ceiling). Each model gets the full `SYSTEM_PROMPT` (Section 2) + user prompt (Section 7's loaders + the dossier, shadow-slimmed, Section 9) and returns a JSON portfolio. `mergeStage1()` flattens multiple models' candidate lists into one, keeping per-model agreement visible.

**Stage 2 — Skeptic.** An independent model call (`SKEPTIC_MODEL`, defaults to `MODELS[0]`) reviews Stage 1's candidates and can kill any of them (`applySkepticVerdicts()`). This model did not generate the candidates, so its skepticism isn't anchored to the same reasoning chain that produced them.

**Stage 3 — Risk/Portfolio Editor.** Another independent call (`RISK_MODEL`, also defaults to `MODELS[0]`) takes the Skeptic's survivors plus the primary-position list, ledger, and any proposed hedge baskets/parlay ladders/portfolio strategy, and does final sizing (`applyRiskEditor()`) — stake tiers, the optional `entry_plan` scale-in pattern, and a portfolio-level `scenario_review` (max exposure, funded liability, coverage, concentration, hedge optionality).

**Output schema** (Stage 3's return contract, abbreviated): `{ finalized: [{ key, bet_threshold, needs_human_review, stake_tier, risk_note, entry_plan? }], passes: [{ key, reason }], scenario_review: {...}, portfolio_notes }`. The full recommendation object (assembled earlier in Stage 1, then filtered/annotated through Stages 2-3) carries `selection`, `market`, `type` (favorite/value/longshot/hedge), `price`, `book`, `model_fair_prob`, `edge_pct`, `thesis`, `disconfirming_factor`, `sources`, `evidence_ids`, `timing`, `correlated_week1`, and optionally `hedge_baskets`/`parlay_ladders`/`portfolio_strategy` structures using the role taxonomy from Section 2.

**Code-owned validation, never trusted from the model**: `validateRecommendationStrict()` calls `agents/lib/board-validate.js`'s `quotedComboFor()` (resolves the real placeable price for whatever the model claims to be citing) and `namedPlayerSizingViolations()` (mechanically enforces the small/speculative stake cap on any team with an open named-player sizing gate, Section 6) plus an edge-recompute tolerance check. **This is the single most important design principle in the whole pipeline and worth verifying is airtight**: the model's self-reported `edge_pct`, `model_fair_prob`, and any dollar/payout math for hedge baskets and parlay ladders are ALL recomputed server-side from the dossier's real prices before anything is trusted or rendered. A model that hallucinates or miscalculates should never be able to get a fabricated number into the final report undetected.

### 8a. Full preflight gate now enforced before a real run (new, 2026-09-08 second pass)

Until this week, `portfolio-synthesize.js` only ran its own narrower intel-source-audit and dossier-freshness checks — it never consulted `agents/portfolio-preflight.js`'s full verdict or its `safe_to_run_paid_synthesis` flag, so a real run could technically proceed even while live preflight reported `safe_to_run_paid_synthesis: false`. Fixed (Codex review P2, this week): before any non-`--prompt-only` run, `portfolio-synthesize.js` now spawns `node agents/portfolio-preflight.js --json --warn-only`, parses the result, and hard-blocks (`process.exit(1)`) on any BLOCK-status lane. A new `--allow-unsafe-preflight` flag exists as a documented, deliberately-visible last-resort override — using it should not be routine, and its presence in a run's logs is itself a flag worth noticing.

---

## 9. What changed this week (2026-09-08), for context on why some things look freshly-touched

- Two `agents/portfolio-preflight.js` bugs fixed (wrong podcast-coverage table checked; no season-phase awareness, so an empty preseason stats table was wrongly flagged BLOCK).
- BettorDay fully removed from `slimTeamProfile`'s `keepKeys` — it can no longer reach the prompt at all (Andy's call: unpaid subscription, likely-thin free data).
- Antigravity master-report bridge built and verified (Section 4).
- Two real prompt-size bugs fixed: the player-availability duplication (Section 6) and unbounded per-sportsbook price maps on every `SYNTHESIS INPUT` market row (now capped to the top 6 books by edge magnitude, always keeping whichever book each row's own `best_over`/`best_under`/`best_price` fields reference). Combined saved ~32K tokens on the shadow-slimmed prompt (257,813 → 225,788).
- `MODELS` default moved to current-generation Anthropic models (Section 8) — 1M-token context at standard pricing removes what used to be a hard 200K-token ceiling driving the prompt-slimming urgency. The two size fixes above are still worth keeping (lower cost, less irrelevant volume for the model to weigh), just no longer a truncation-risk emergency.

**Second pass, same day (2026-09-08), after this spec was reviewed by Codex:** Codex independently reviewed this document plus the live code and returned 6 findings. Claude triaged and fixed 5, and corrected (rather than simply flipping) the 6th:

- `loadMasterReportEvidence()`'s unpaginated/nondeterministic Supabase read — fixed, now paginated and ordered (Section 7).
- Team-scoped master-report matching could attach a report to the wrong team via brittle substring alias matching — fixed with word-boundary regex.
- The full `agents/portfolio-preflight.js` gate was never enforced by `portfolio-synthesize.js` before a real run — fixed (Section 8a, new), which also substantively closes the ledger/watchlist/official-config silent-degradation risk (Section 7) as a side effect.
- `dossier-freshness-gate.js` still tracked the fully-removed `bettorday_trench` lane, meaning a dead lane could still BLOCK/WARN a real run — lane removed entirely.
- `agents/portfolio-preflight.js`'s roster-churn warning still called the (already-fixed, 2026-09-04) pagination bug an open "ARMED LANDMINE" — text corrected to describe the current state accurately.
- `podcast_extraction_coverage`'s denominator counted ALL `podcast_transcripts` rows, including non-NFL episodes from multi-sport feeds — corrected to filter through the existing `isNflRelevantEpisode()` filter. Live number is **55/128 NFL-relevant transcripts (43.0%)**, not 56/167 (33.5%) — still below the 90% PASS threshold, left as WARN by design (see Section 10, item 5).

Both Antigravity and Codex independently reconciled and live-verified these fixes against the running code — see `handoffs/2026-09-08-1322-claude-codex-review-triage-handoff.md`, `handoffs/2026-09-08-1335-antigravity-reconciliation-handoff.md`, and `handoffs/2026-09-08-1336-codex-claude-triage-reconciliation-handoff.md`. Also same day: Andy staged and ingested fresh BKR (Bookmaker) and BetUS futures odds (Section 10, item 4) via the existing `scripts/parse-futures-text.js` → `scripts/ingest_futures_json.py` path.

**Team structure going forward**: Antigravity has moved to owning the podcast+article ingestion pipeline. Claude and Codex now work this portfolio-synthesis pipeline in parallel — Claude on implementation, Codex on independent review/approval before anything ships.

---

## 10. Known open gaps — current punch list (see `PRE_COMMITTEE_CHECKLIST.md` for the full staged version)

Roughly in order of how much they could distort a real run:

1. **No SYSTEM_PROMPT interpretive/trust framing for `vault_analytical_reads`, `training_camp_intel`, or `master_reports`** (Section 2) — the single highest-value fix left, and the kind of thing worth an independent second opinion on wording.
2. **`nfl_team_season_stats`/`team_analytic_snapshots` are empty for 2026** — confirmed NOT a bug, season hasn't started yet (kickoff 2026-09-11) — but the preflight tool's season-phase check should be double-checked against edge cases (bye weeks, a slow-to-update box score, etc.).
3. **`team_coaching_tendency_snapshots` has never been populated for any season** — either the build script has never been run against real data, or there's a wiring problem. Worth root-causing.
4. **Bookmaker/BetUS odds refreshed 2026-09-08** (fresh as of today, 0.9 days old) — **Caesars still 10 days stale, Circa never captured**, still not a code problem, still needs Andy to capture fresh data for those two specifically.
5. **Only 55/128 NFL-relevant transcribed podcast episodes have a full host summary (43.0%)** — corrected from the earlier 56/167 (33.5%) figure, which incorrectly counted 39 non-NFL episodes in its denominator. Real backlog remains (the rest still rely on a 12k-character-truncated extraction) — an ongoing manual batch job, currently paused on API credits.
6. **`docs/Futures_Picks_Summary_<date>.md` is read for but never produced** (Section 7) — dead code or lost feature, undetermined.
7. **Ledger/watchlist/official-config silently degrade to null on any read error** (Section 7) — the individual loaders are unchanged, but this is now substantively mitigated: `portfolio-synthesize.js` enforces the full preflight gate (Section 8a) before any real run, and preflight's own Stage B:money checks already BLOCK on a missing/malformed file in any of these three. Still worth an independent opinion on whether the loaders should also fail loud directly, for defense in depth rather than relying solely on the gate.
8. **108 unresolved article-evidence records** as of the last count (`scripts/build-article-intel-review.js`) — worth a fresh run to see if the corpus's growth has moved this number.
9. **No orchestrator enforces pipeline run order** (Section 3) — a stale signals sidecar or a skipped sim-patch degrades results silently rather than failing loud.
10. **Stage 6 (mocked committee dry-run with fake model responses) and Stage 9 (full mocked rehearsal, human sign-off) from the checklist have not been run yet** — everything verified so far has been prompt-assembly-only (`--prompt-only`), never through the actual Stage 1→2→3 merge/validation logic, even with mocked responses.

**Specific things we'd like Codex to look at that we haven't had an independent set of eyes on:**
- Is `loadMasterReportEvidence()`'s team-section parsing actually robust across all 79 report formats, not just the 8 it was built and tested against?
- Are there other `fetch*()` call sites in `portfolio-dossier.js` with the same unpaginated-Supabase-read class of bug the roster function had until this week?
- Is the code-owned validation in Section 8 actually airtight, or are there recommendation fields (hedge basket payouts, parlay ladder liability, entry_plan triggers) that still pass through without a server-side recompute?
- Does the `--shadow-slim` prompt-reduction path have any remaining silent-degradation edge cases now that real data volume is growing in previously-empty lanes (coaching tendencies, full roster churn, more host summaries)?
- Any other "looks wired up but isn't actually reaching the model / isn't actually gating a real run" pattern, matching the two we already found for the Antigravity corpus (path-mismatch, fully synced but invisible) and BettorDay (defined and called, but its output attached nowhere the prompt reads).

---

## 11. Not this pipeline (do not confuse the two)

This repo also has a full fantasy-football dashboard (roster tools, ADP, Yahoo league sync, projections). None of it is used by or related to the futures-betting committee described above — `fantasy_adp`/`fantasy_projections` tables, `agents/fantasypros-*-ingest.js`, `agents/yahoo-adp-ingest.js` are a completely separate feature area of the same app. If a search of the codebase turns up FantasyPros or Yahoo references, check which pipeline they're actually feeding before assuming overlap — the one confirmed real touchpoint is `player_availability`'s use of FantasyPros' injury-report API (Section 4), which is structurally unrelated to fantasy scoring.

## 12. Standing operating rules (for whoever — human or AI — works on this pipeline)

- Code owns math, never the model — see Section 8, this is the load-bearing design principle of the whole system.
- No Supabase writes without explicit per-write authorization from Andy.
- No paid committee synthesis run without explicit authorization — `agents/portfolio-preflight.js` should report clean (or its remaining flags explicitly accepted) first.
- No betting picks are ever auto-placed, no recommendation is ever auto-promoted to "official," and no portfolio/bankroll state is ever mutated without Andy's explicit review — every output is a proposal, per Section 0.
- Every dry run/test invocation should use `--no-persist` and ideally `--prompt-only` or a mocked-fetch harness (Section 8's own dry-run pattern from the 2026-07-22 board-validator work) rather than spending real API credits, until the specific thing being tested actually requires a real or mocked model call.
- **As of 2026-09-08: implementation and review are split.** Claude does code changes on this pipeline; Codex independently reviews and approves before anything ships to Andy as ready. Antigravity owns the separate podcast+article ingestion pipeline. Any of the three finding something that conflicts with another's in-flight work should be reconciled via a dated handoff in `handoffs/`, not silently overwritten — see the three-way reconciliation pattern from this same day for the template.
