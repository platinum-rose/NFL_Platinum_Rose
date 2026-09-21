# NFL_Dashboard Futures/Betting Portfolio — Intel Pipeline Map

Compiled 2026-09-08, read-only repo scan (no code changed, no writes made).
Purpose: a single reference for where every source of intel enters this repo,
how it's parsed/normalized, and exactly how `agents/portfolio-synthesize.js`
(the committee that produces Futures portfolio recommendations) actually
consumes it — so gap-testing can target real wiring instead of assumptions.

Two files do almost all of the real work and are the center of gravity for
any bug hunt:
- `agents/portfolio-dossier.js` (1,863 lines) — pulls every intel/odds/stats
  source into one `dossier-<date>.json` snapshot.
- `agents/portfolio-synthesize.js` (3,368 lines) — reads that dossier plus a
  few sources it loads independently, prompts 1-3 models (Stage 1 → Skeptic →
  Risk/Editor), validates, and renders the HTML/MD report.

A third file is the one built specifically to catch silent breakage between
them: `agents/portfolio-preflight.js` — free, read-only, no paid API calls,
run it before every paid synthesis. **I ran it live today (2026-09-08)**; its
real current output is in Section 5. Run it again any time with:
```
node agents/portfolio-preflight.js            # human-readable
node agents/portfolio-preflight.js --json     # machine-readable
```

---

## 1. Raw intel sources → where they land

| Source | Ingest agent | Cadence (workflow) | Storage |
|---|---|---|---|
| 11 RSS/JSON feeds (Action Network, BettingPros, WalterFootball, ESPN NFL, VSiN, Sharp Football Analysis, ProFootballTalk, PFF, Rotowire, Football Outsiders, THE WINDOW/mrussauthentic) | `agents/research-intel-ingest.js` | `research-intel-ingest.yml` | `research_intel_notes` (articles) + `research_pick_signals` (regex-extracted structured leans) + `feed_health` (per-feed status) |
| Podcast transcripts (audio → text via AssemblyAI) | `agents/podcast-ingest.js` | `podcast-ingest.yml` (weekly, Fridays) | `podcast_transcripts`, `podcast_episodes`, `podcast_feeds` |
| Podcast transcripts, full re-extraction pass | `agents/podcast-reextract.js` | manual/ad hoc | `podcast_reextractions` |
| Podcast host summaries (structured, full-transcript fidelity) | `agents/podcast-host-summary.js` | manual/ad hoc | `podcast_host_summaries` |
| Podcast narrative deep-dives (long-form per-episode write-ups) | `scripts/build-podcast-transcript-deep-dives.js`, `scripts/build-podcast-narratives.js` | manual | `docs/podcast-narratives/*.html` + `docs/podcast-narratives/index.json` |
| Podcast picks promoted to the Picks Tracker | `agents/pick-extraction.js` | `pick-extraction.yml` (after podcast-ingest) | `user_picks` |
| Gemini-based podcast intel extraction | `agents/podcast-gemini-intel.js` | manual/ad hoc | `podcast_gemini_intel` |
| Twitter/X sharp-account tweets | `agents/x-sharp-ingest.js` | `x-sharp-ingest.yml` | `x_sharp_tweets` |
| Twitter/X bookmarked betslip screenshots (Vision-OCR) | `agents/twitter-bookmarks-agent.js` | manual/ad hoc | `research_intel_notes`, `research_pick_signals`, `vault_notes` |
| General tweet ingestion | `agents/tweet-ingest.js` | manual/ad hoc | `research_intel_notes`, `research_pick_signals` |
| BettorDay newsletter (trench/O-line/D-line composite + SOS ratings) | `agents/bettorday-newsletter-ingest.js` | `bettorday-intel-ingest.yml` | `nfl_trench_ratings` (Supabase, migration 053) + `data/intel/bettorday_trench_ratings_2026.json` (local fallback) |
| BEO (Bookmaker/BetUS-style) futures-odds screenshots | `scripts/ingest-beo-screenshots.js` (OCR) | manual, Andy's locked-in workflow — see `docs/BEO_FUTURES_INGESTION_WORKFLOW.md` | `futures_odds_snapshots` |
| Live Vegas/sharp-book futures odds (Circa, STN/Station) | `agents/vegas-web-odds-ingest.js` + `agents/lib/live-market-fallback.js` | manual/ad hoc | `futures_odds_snapshots` |
| Futures odds from Metabet | `agents/metabet-futures-ingest.js` | manual/ad hoc | `futures_odds_snapshots` |
| Game-level odds (spreads/totals/ML) | `agents/game-odds-ingest.js`, `agents/odds-ingest.js` | `game-odds-ingest.yml`, `odds-ingest.yml` | `game_odds_snapshots`, `odds_snapshots`, `line_movements` |
| Betting splits (public %/handle) | `agents/betting-splits-ingest.js` | `betting-splits-ingest.yml` | `game_splits_history` |
| Kalshi-style prediction markets (win totals, division/conf/SB) | `scripts/build-prediction-market-map.js` → `scripts/build-cross-market-coherence.js` | manual, pure local transform (no network/Supabase) | `data/prediction-markets/team-market-map-latest.json` → `data/prediction-markets/latest.json` (the file the dossier actually reads) |
| Player injuries | `agents/injury-ingest.js` | `injury-ingest.yml` | `player_injuries` |
| Player availability (depth chart / practice-report synthesis) | `scripts/build-player-availability.js` + `agents/lib/player-availability.js` | manual | `data/player-availability/latest.json` |
| Training camp intel (beat-reporter nuggets, by team) | `scripts/build-training-camp-all32.js`, `scripts/build-training-camp-coverage-fill.js`, `scripts/training-camp-intel.js` | manual | `data/training-camp/<season>/latest.json` |
| Named-player status review (McGovern/Parsons-class contested roles) | human-curated, validated by `agents/lib/named-status-review.js` | manual, human-reviewed | `data/projected-starters/<season>/named-status-review.json` |
| Team season stats / advanced analytics (EPA, CPOE, success rate, etc.) | nflverse via `agents/player-stats-ingest.js`, `scripts/build-team-analytics-snapshots.js` | `nflverse-data-refresh.yml` (**annual, March 1 only**) + manual snapshot builds | `nfl_team_season_stats`, `team_analytic_snapshots` |
| DVOA-style efficiency snapshots | `scripts/build-dvoa-snapshots.js` | manual | `team_dvoa_snapshots` |
| Coaching tendency / scheme profiles | `scripts/build-coaching-tendency-snapshots.js`, `scripts/build-coaching-scheme-classifier.js` | manual | `team_coaching_tendency_snapshots` |
| Roster churn (adds/drops week over week) | roster refresh via nflverse | `nfl-roster-refresh.yml` | `nfl_rosters` |
| Referee tendencies | historical build, not in an active workflow | manual | `referee_tendencies` |
| Schedule | `agents/schedule-ingest.js` | `weekly-update.yml` | `games` |
| Expert dossiers (per-analyst source-coverage + tendency profile) | `scripts/build-expert-dossiers.js` + `scripts/build-host-citations.js` | manual | `data/expert-dossiers/latest.json` |
| Fantasy ADP/projections/rankings (fantasy-only, not futures) | `agents/fantasypros-*-ingest.js`, `agents/yahoo-adp-ingest.js` | manual | `fantasy_adp`, `fantasy_projections` |
| Vault reference library (hand-curated static docs: CoachTendencies, DVOA glossary, KeyNumbers, ATS framework) | `agents/vault-seed.js` (manual, static) | manual | `vault_notes` at `NFL/Reference/*.md` |
| Vault per-team narrative notes (article summaries, tweets, injuries, stats) | `agents/intel-to-vault-sync.js` (from `research_intel_notes`), `agents/stats-to-vault-sync.js` (from nflverse), `agents/obsidian-vault-sync.js` | `intel-to-vault-sync.yml` (daily as of 2026-09-02), `stats-to-vault-sync.yml` (**annual, March 1 only**) | `vault_notes` at `NFL/Teams/<ABBR>.md` |

**Not automated / CLI-only, exist but no workflow wires them up**: `agents/vault-rebuilder.js`, `agents/futures-pin-vault-sync.js`. Two more vault-sync files (`agents/master-reports-to-vault-sync.js`, `agents/lib/masterReportGuard.js`) are untracked WIP as of the last check — not part of the live pipeline yet.

---

## 2. Normalization layer — turning raw intel into structured, team-canonical signals

`agents/signal-normalize.js` is the actual funnel. It reads FOUR raw lanes and
merges them into one Supabase table, `normalized_signals`, which is what
`portfolio-dossier.js` actually reads (via a JSON sidecar,
`.nfl/portfolio/normalized-signals-<model>.json`) — **not** the raw tables
directly, with one exception (see the dead-branch note below):

1. **RSS articles** — `research_intel_notes` (title + summary), an LLM judges
   "is this an actionable NFL betting lean?" and emits `{team, market,
   direction, strength}` if so.
2. **Podcast free-text intel** — `podcast_transcripts.intel[]`, same LLM
   classification step.
3. **Podcast structured picks** — `podcast_transcripts.picks[]`.
4. **Expert picks** — `user_picks` where `source = EXPERT`.
5. **Podcast host summaries** — `podcast_host_summaries.futures[]`, already
   structured (`{subject, subject_market, quote, lean, confidence}`) by
   `agents/podcast-host-summary.js` from the FULL transcript (no 12k-char
   truncation) — bypasses the LLM step entirely since it's pre-classified.
   Wired into `signal-normalize.js` as of the 2026-09-04 Tier-4 fix; **the
   live preflight run today confirms this wiring is intact** (105 rows / 527
   items were sitting unread before that fix).
6. **Research pick signals** — `research_pick_signals` (regex-extracted by
   `research-intel-ingest.js`). Also wired in as of 2026-09-04 — before that,
   `portfolio-dossier.js` only reached this table through `buildLeanView()`,
   an inline fallback that never runs once a normalized-signals sidecar
   exists (which it always does), so 650+ rows were reaching nothing. Note
   in the code: this table is "52% verbatim article-headline echoes and >60%
   CFB/other sports" — a raw regex dump, not curated — so `signal-normalize`
   has extra filtering here (drops non-resolving teams, drops non-NFL rows,
   guards against `normalizeTeam`'s bare "carolina" alias false-matching
   "North Carolina +9.5" college lines to the Panthers).

**Separately**, `agents/pick-extraction.js` promotes podcast/article picks
into `user_picks` for the app's Picks Tracker UI — a different consumer than
the futures committee, but `user_picks` also feeds back into
`normalized_signals` per (4) above, so a pick-extraction bug can reach the
committee indirectly.

---

## 3. `portfolio-dossier.js` — every `fetch*()` function and what it reads

This is the single aggregation point. Each function below is a distinct
evidence lane in the final dossier; a bug in any one is invisible unless you
know to look at that specific lane.

| Function | Reads | Feeds dossier field |
|---|---|---|
| `fetchSnapshots()` | `futures_odds_snapshots` (Supabase) | odds/pricing for every futures market, via `buildOddsView()` |
| `fetchPickSignals()` | `research_pick_signals` (Supabase) | fallback-only lean view (see dead-branch note above) |
| `fetchUserPicks()` | `user_picks` (Supabase) | `buildLeanView()` |
| `fetchInjuryContext()` | `player_injuries` (Supabase, paginated) | `team_profiles[team].injuries` |
| `fetchPodcastIntel()` | `podcast_transcripts` (Supabase) | `buildLeanView()` |
| `fetchTeamStats()` | `nfl_team_season_stats` (Supabase, seasons 2023–current) | `currentAnalytics()` |
| `fetchTrainingCampIntel()` | `data/training-camp/<season>/latest.json` (local file) | `team_profiles[team].training_camp_intel` — top-5 nuggets **by signal_strength desc** (fixed 2026-09-04; used to be file-order, silently dropping 44% of real high-priority items) |
| `fetchPlayerAvailabilityContext()` | `data/player-availability/latest.json` (local file) | via `clusterAvailabilitySummary()` |
| `fetchPredictionMarkets()` | `data/prediction-markets/latest.json` (local file) | `team_profiles[team].prediction_markets` — win-totals ladder (KXNFLWINS only, interpolated 50%-crossing), playoff/division/conference probabilities. **Ticker-format gotcha in the code**: `KXNFLWINS-27IND-9` packs `<season><TEAM>` with no separator (needs manual parsing), unlike `KXNFLPLAYOFF-27-WAS`'s separate segments — `predictionMarketTeamFromTicker()` alone returns null for every win-totals row. |
| `fetchNamedPlayerSizingGates()` | `data/projected-starters/<season>/named-status-review.json` (local, human-curated) | `team_profiles[team].named_player_sizing_gate` — hard-fails the whole dossier build if missing/invalid unless `--allow-missing-named-status-review` is passed |
| `fetchAdvancedAnalytics()` | `team_analytic_snapshots` (Supabase, current season) | merged into `team_profiles[team].analytics` via `mergeAnalytics()` |
| `fetchDvoaSnapshots()` | `team_dvoa_snapshots` (Supabase) | `team_profiles[team].dvoa` |
| `fetchCoachingProfiles()` | `team_coaching_tendency_snapshots` (Supabase) | `team_profiles[team].coaching_profile` |
| `fetchSchedule()` | `games` (Supabase) | opponent/SOS calculations |
| `fetchGameOddsOpen()` | `game_odds_snapshots` (Supabase, paginated) | `team_signals` |
| `fetchGameSplitsLatest()` | `game_splits_history` (Supabase) | `team_signals` (public betting splits) |
| `fetchRefereeTendencies()` | `referee_tendencies` (Supabase) | `team_profiles[team].officiating_context` |
| `fetchRosterChurn()` | `nfl_rosters` (Supabase, needs ≥2 distinct weeks or silently returns `{}`) | `roster_churn` |
| `loadNormalizedSignals()` | `.nfl/portfolio/normalized-signals-<model>.json` sidecar (the output of `signal-normalize.js`) | `experts{}`, `adjacent_signals{}` |

Everything above is assembled into `team_profiles`, `synthesis_input` (per
market), `adjacent_signals`, `roster_churn`, `experts` and written to
`.nfl/portfolio/dossier-<date>.json`. **Run order matters and is not
enforced**: the correct sequence is `signal-normalize.js` → sim-patch via
`portfolio-simulate.js` → `portfolio-dossier.js` → `portfolio-synthesize.js`.
Running dossier before the signals sidecar regenerates, or skipping the sim
patch, both degrade silently (see Section 5, stage C).

---

## 4. `portfolio-synthesize.js` — what it loads *beyond* the dossier

The dossier is the primary input, but synthesize also independently loads:

- **`loadVaultReferenceEvidence()`** — reads `vault_notes` directly
  (Supabase): (a) six hand-curated static reference docs at
  `NFL/Reference/*.md` (CoachTendencies, DVOA glossary/current-season, Key
  Numbers, ATS framework/current-season) — genuinely non-duplicate context,
  not sourced from anything else the dossier carries; (b) per-team narrative
  notes at `NFL/Teams/<ABBR>.md`, merging **both** the "Analytical
  Deep-Reads" and "Betting & News" subsections (as of 2026-09-01 — before
  that, only Deep-Reads was read, silently dropping every Twitter/X-bookmark
  note since those land in "Betting & News"). Deliberately excludes the
  vault's Injuries subsection (duplicate of `player_injuries`), the
  `-ATS`/`-PlayerStats`/etc. stat-import variant files, `WeeklySignals.md`
  (would double-count the same articles), the IDP guide, and season-archive
  dumps.
- **`loadBettorDayTrenchEvidence()`** — reads `nfl_trench_ratings` (Supabase)
  first, falls back to `data/intel/bettorday_trench_ratings_2026.json` if
  Supabase creds are absent or the table is empty. Two metric types kept
  separate per team: `team_composite` (own O/D-line quality) and
  `schedule_sos` (difficulty of fronts faced) — never averaged together.
- **`loadPodcastEvidenceIndex()` / `findLatestPodcastSummaryPaths()`** —
  looks for `docs/Futures_Picks_Summary_<date>.md` (+ matching `.html`).
  **Nothing in the repo currently produces this file** — see Section 5,
  the `podcast_host_summaries` finding.
- **`loadPodcastNarrativeEvidenceRows()`** — reads
  `docs/podcast-narratives/index.json` + per-episode HTML built by
  `scripts/build-podcast-narratives.js` / `build-podcast-transcript-deep-dives.js`.
- **`loadExpertDossiers()`** — reads `data/expert-dossiers/latest.json`.
- **`loadLedger()` / `loadWatchlist()` / `loadOfficialConfig()`** — local
  JSON: live bankroll exposure, watchlist, and the contract (bankroll +
  sizing map). **All three catch-and-return-null on any error, and the run
  proceeds sizing every proposal with no bankroll rules** — flagged as a
  hard-failure candidate in the preflight gate, not yet changed.
- **`loadRunInstructions()` / `loadSupplementalContext()`** — optional
  CLI-supplied extra context for a specific run.

After the three-stage model pipeline (Stage 1 candidates → Skeptic verdicts →
Risk/Editor, `applySkepticVerdicts()` / `applyRiskEditor()`), every candidate
passes `validateRecommendationStrict()`, which calls
`agents/lib/board-validate.js`'s `quotedComboFor()` (the function fixed and
confirmed-shipped in commit `b6a3bf0`, per today's earlier check) plus
`namedPlayerSizingViolations()` and an edge-recompute tolerance check.
Recommendations are then optionally persisted to `futures_recommendations`
and `futures_recommendation_runs` (Supabase writes — gated behind
`--no-persist` for dry runs, and behind the standing no-writes-without-
authorization guardrail in every real run).

---

## 5. Live preflight snapshot — run 2026-09-08 (free, read-only, no paid calls)

`node agents/portfolio-preflight.js --json`. **Result: 7 BLOCK, 7 WARN, 0
ERROR, 18 PASS — `safe_to_run_paid_synthesis: false`.**

**BLOCK (would materially corrupt a real run):**
1. `nfl_team_season_stats` — **zero 2026 rows** (73.9 days stale). The
   dossier silently serves the 2025 row instead, and the system prompt tells
   the model to trust it as "this season's actual play."
2. `team_analytic_snapshots` — **zero 2026 rows**. `success_rate`, `cpoe`,
   `explosive_*`, `pressure_*`, `sack_*` are 0/32 with no warning printed
   anywhere downstream.
3. `futures_odds_snapshots` — 22,162 rows total, but placeable-book
   freshness is uneven: BetOnline/BetMGM fresh (0.4d), Caesars 9.2d,
   **Bookmaker and BetUS stale at 29.0 days**, **Circa never captured at
   all**. Stale placeable quotes are demoted internally but still emitted as
   `best_price` — a pick can cite a price that's a month old.
4. `podcast_extraction_coverage` — only **6/167 transcripts (3.6%)** have a
   full re-extraction. The original `podcast-ingest.js` only ever sent the
   first 12,000 characters to the model, so most transcripts are extracted
   from roughly a quarter of their real content.
5. `data/player-availability/latest.json` — 25.7 days stale (limit 7d).
6. `data/expert-dossiers/latest.json` — 18.0 days stale (limit 14d).
7. `data/prediction-markets/latest.json` — 16.2 days stale (limit 7d).

**WARN (degrades quality, doesn't corrupt):**
- `team_coaching_tendency_snapshots` — table empty for all seasons;
  `coaching_profile` is 0/32 in every dossier.
- `nfl_rosters` — only 1 distinct week for 2026 captured so far, so
  `fetchRosterChurn()` returns `{}` silently. **Flagged as an armed
  landmine**: once week 2 lands, the unpaginated per-week read (1,000 of
  ~3,575 rows) will diff two arbitrary ~28% slices and emit hundreds of fake
  roster adds/drops per team — needs pagination fixed at
  `portfolio-dossier.js:799` before that happens.
- Ledger and watchlist are 47-48 days stale — sizing decisions are being
  made against month-and-a-half-old exposure data.
- Current dossier (`dossier-2026-09-04.json`) is 3.2 days old.
- `signal_coverage` in that dossier reports **zero team coverage** for
  `coaching_profile`, `officiating`, and `roster_churn` (consistent with the
  blockers above).
- Full (non-slim) prompt would be ~363,604 tokens — over the 200K context of
  the configured models, so the `--shadow-slim` prompt-reduction path is not
  optional, it's mandatory, and everything that path drops (see below) is
  the actual operating reality, not a theoretical edge case.

**PASS, but worth knowing** (from the D-stage prompt-assembly simulation,
which replays exactly what `--shadow-slim` ships to the model without
spending anything): market-row retention, positive-edge-loss ranking,
team-key-split, `adjacent_signals` shape, dropped-profile-fields, and the
`experts` block all currently pass — meaning the specific historical bugs
the preflight gate was built to catch (undifferentiated per-market caps,
edge-magnitude-only ranking losing all positive-EV rows, team-name-key
splitting a book pool in two, an array/object shape mismatch nulling every
`adjacent_signals` field, `named_player_sizing_gate` getting silently
stripped, and the `experts` map never reaching the prompt at all) have each
been fixed and stayed fixed as of today. **These are exactly the class of
bug worth spot-checking again after any prompt-assembly or dossier-shape
change**, since the gate self-updates by re-scanning the real source rather
than trusting a frozen list.

---

## 6. Validation/evidence gates outside the preflight tool

`scripts/lib/futures-evidence-gates.js` defines schema-versioned validators
used by `scripts/build-intel-source-audit-report.js` and called at various
points in the pipeline (not all wired into every run — worth confirming
which ones actually gate a live `portfolio-synthesize.js` invocation vs.
which are informational-only):

- `validateArticleEvidence()` — requires a v2 schema, a complete (not
  local-only/partial) collection window, a valid body-evidence summary, and
  **zero unresolved pick-oriented records**. As of the 2026-09-03 fix (a
  stale 4,000-char truncation threshold misclassifying normal 4k–20k-char
  articles as truncated, cut from 175 to 108 false-classified-as-unresolved
  records), this gate is **still legitimately blocked** — 108 real
  unresolved records remain (64 no-selection-extracted, 44 body-evidence
  gaps, ~39 of those `metadata_only` likely from upstream fetch failures).
  Worth a live re-run of `scripts/build-article-intel-review.js` to see the
  current count, since the corpus keeps growing.
- `validateTeamIdentityArtifact()` — checks a `team_identity_validation_v1`
  block for duplicate evidence rows, primary/source-prefix mismatches, and
  rows missing a primary team.
- `explicitTeamCollision()` — a hard-coded disambiguation for NYJ/NYG and
  LAC/LAR ticker text collisions in prediction-market data.
- A `FORBIDDEN_YOUTUBE_EPISODES` list — two specific episode IDs excluded
  from the YouTube-reviewed cohort permanently (worth checking the audit doc
  for why, if you haven't already — likely a contamination/mislabeling
  incident).
- Prediction-market map/coherence gates (`predictionMap`,
  `predictionCoherence` schemas) — fixed 2026-09-03 after the artifact
  predated the `normalized_contract` field it was checking for; passes as of
  that fix.

---

## 7. Known, still-open gaps worth prioritizing (as of 2026-09-08)

In rough order of how much of the final report they can plausibly distort:

1. **2026 season stats and advanced analytics are completely empty in
   Supabase** (BLOCK #1/#2 above). This is upstream of almost every
   team-strength judgment the model makes. Highest-priority to root-cause:
   is this an nflverse-refresh scheduling gap, a season-filter bug, or does
   the ingest simply need to be run?
2. **Podcast re-extraction is 96% incomplete** (6/167). The one podcast
   intel lane without the 12k-truncation problem — `podcast_host_summaries`
   — is wired in, but it's a manually-run, separate agent
   (`podcast-host-summary.js`) from the bulk `podcast_transcripts` corpus,
   so most transcript-derived signals are still working from a quarter of
   the real content.
3. **`docs/Futures_Picks_Summary_<date>.md` — nothing in the repo produces
   this file**, but `loadPodcastEvidenceIndex()` looks for it every run. Confirm
   whether this evidence lane is dead code, a half-finished feature, or
   whether the generator script was lost/renamed.
4. **Coaching-tendency data is empty for every season** — a full evidence
   lane (`coaching_profile`) contributing nothing.
5. **Roster-churn pagination landmine** — fix `portfolio-dossier.js:799`
   before 2026 week 2 rosters land, or every team will show fabricated
   churn.
6. **Placeable-book odds staleness (Bookmaker/BetUS 29 days, Circa never
   captured)** — not fixable from code; needs Andy to actually capture
   screenshots/feeds for those books.
7. **Article-evidence gate's 108 unresolved records** — worth a fresh
   `build-article-intel-review.js` run to see if the count has moved, and
   whether the `metadata_only` fetch failures point at a specific broken
   scraper.
8. **Money/policy inputs (ledger, watchlist, official config) silently
   degrade to null on any read error** — by design right now, but flagged in
   the preflight tool itself as something that should probably be a hard
   failure instead, since it currently lets a run size positions with zero
   bankroll awareness with no visible warning in the final report.
9. **Rotowire scraper over-capture** (noted in a prior session, not yet
   investigated): ~81 articles picking up ~151,000-character bodies for what
   should be short news blurbs — looks like whole-page/sidebar content is
   being captured instead of just the article body. Separate from the
   truncation-threshold bug already fixed.
10. **Pick Extraction natural-key collision** (noted in a prior session):
    one batch (`Even Money`'s "2026 AFC Season Win Total Bets", 7 picks) hit
    a unique-constraint violation on intra-batch OVER/UNDER pairs for the
    same game — isolated to the picks-ledger table, not the dossier/vault
    path the committee reads, but still an open bug in `pick-extraction.js`
    or its upsert batching.

---

## 8. Suggested order for continued gap-testing

Given the preflight tool already re-validates itself against live source
code (not a frozen snapshot of past bugs), the highest-leverage next steps
are likely:
1. Re-run `node agents/portfolio-preflight.js` before touching anything —
   it's free and takes seconds, and its BLOCK list above is the actual
   current ground truth, not last week's.
2. Root-cause item 1 above (empty 2026 stats/analytics tables) first — it's
   both the most severe and the most likely to have a simple root cause
   (scheduling vs. code).
3. Use the preflight gate's own D-stage (prompt-assembly simulation) as a
   template for testing any *new* dossier field you add — it already proves
   the pattern (mirror the real ranking/slimming function, don't hand-write
   a parallel copy that drifts) that caught six real historical bugs.
4. For anything touching `portfolio-synthesize.js`'s independent loaders
   (Section 4), test with `--no-persist --allow-stale-dossier` and a mocked
   `global.fetch` for the model calls, the same harness pattern used
   successfully for the 2026-09-03 board-validator dry run (see
   `nfl_dashboard_project.md` in project memory for the exact command line).

---

## 9. Corrections after Andy's review (2026-09-08, same day)

Andy pushed back on three points in the sections above. All three were worth
checking against live data/code rather than taking the preflight tool (or my
own read of it) at face value. Verified results:

**a) "Only 5 lanes merged" — clarified, one real gap found.** The 5-lane
`signal-normalize.js` funnel is specifically for turning *unstructured text*
into directional team/market leans (`normalized_signals`) — it was never
meant to be the only path for all intel. Everything else in Section 1
(odds, stats, DVOA, BettorDay trench, prediction markets, training camp,
player availability, named-player review, vault reference docs) is already
structured and reaches the dossier/prompt directly through its own
`fetch*()` function or independent loader — that's by design, not a gap.
**One real gap found in the process**: `x_sharp_tweets` (Twitter/X sharp
account tweets) is never read by `signal-normalize.js` or
`portfolio-dossier.js` directly. Its only path to the committee is indirect
— `intel-to-vault-sync.js` writes tweet-derived summaries into
`vault_notes`, which `loadVaultReferenceEvidence()` then reads. Not
orphaned, but thinner and one hop removed from everything else.

**b) Source weighting — confirmed there is none, and it's backwards from
what you'd expect.** There is no numeric source-authority or ranking system
anywhere in this pipeline. The one thing that looked like it
(`sourceQuality()` in `portfolio-synthesize.js`) is a cosmetic HTML/MD badge
("Named Expert + Timestamp" / "Unattributed Speaker" / etc.) computed AFTER
the model has already made its picks — it never feeds back into the model's
reasoning or into any ranking logic. In the actual `SYSTEM_PROMPT`, only a
few lanes get explicit interpretive guidance on how much to trust them:
`prediction_markets` ("a thinner, differently-incentivized market"), `dvoa`
("an imported analytic opinion... not a locally computed metric"), `sos`/
`prior`. **`bettorday_trench`, `vault_analytical_reads` (where podcast/
article/Twitter narrative material lands), and `training_camp_intel` are
all handed to the model as raw JSON with ZERO interpretive framing in the
prompt** — no explanation of what the numbers mean, how fresh they typically
are, or how much weight to give them relative to price action. So the
BettorDay lane showing up prominently in the earlier summary reflects how
much bespoke bridge code and session-note documentation it required to wire
up — not that it's weighted more heavily by the model. If anything it (and
the vault/training-camp lanes) are the least-explained inputs the model
gets. **Recommended fix, not yet made**: add explicit interpretive text for
these three lanes to `SYSTEM_PROMPT`, and consider an explicit source-
hierarchy statement (e.g., sportsbook price action as primary evidence;
named, timestamped analyst leans as corroboration; trench/training-camp/
vault narrative context as supplementary color that should never override
price-based edge on its own).

**c) Podcast re-extraction — the 3.6% figure was measuring the wrong
pipeline. Andy was right.** Live Supabase check: `podcast_episodes` already
has a relevance filter and it's been applied — 256 discovered episodes:
167 `done` (transcribed), 53 `skipped_non_nfl`, 9 `error`, 27 `pending`.
Separately from the `podcast_reextractions` table the preflight gate checks
(only 6 rows, all created in a single batch on 2026-09-04 — reads like a
pilot run, not a completed pass), there is a second, much larger
re-processing effort: **`podcast_host_summaries`, covering 56 distinct
episodes (105 rows — some episodes have multiple attributed hosts)**. This
is the full-transcript-fidelity pipeline (no 12k-char truncation) that
`signal-normalize.js` actually reads (confirmed in its own code comments,
2026-09-04 Tier-4 wiring). The preflight tool's `podcast_extraction_coverage`
check only ever looks at `podcast_reextractions`, so it reported 3.6% and
called it a BLOCK when the real, wired-in coverage is 56/167 done
transcripts (33.5%) — an order of magnitude off. **The honest remaining
gap** is the 111 transcribed episodes that still lack a host summary, not
161. **Action item**: fix `agents/portfolio-preflight.js`'s
`podcast_extraction_coverage` check to count `podcast_host_summaries`
(or both tables) instead of only `podcast_reextractions`.

**d) 2026 season stats being empty — not a bug, season hasn't started.**
Andy was right and I should have checked this before repeating the
preflight tool's alarm. Live check: `games` for season 2026 week 1 shows
`kickoff_utc: 2026-09-11T00:35:00Z`, `status: "pre"` — three days from
today (2026-09-08). `game_results` has **zero rows** for any season/week.
There is no game data yet to compute `nfl_team_season_stats` or
`team_analytic_snapshots` from — an empty 2026 row count is the CORRECT
state right now, not a data-pipeline failure. **Action item**: the
preflight gate should check whether the season has actually started
(e.g., any `game_results` rows for the current season) before flagging
season-stats emptiness as a BLOCK — right now it can't distinguish "nobody
ran the ingest" from "there's nothing to ingest yet," which is exactly the
kind of false alarm that erodes trust in the tool and wastes debugging time
chasing a non-bug.

**Net effect on Section 5's "7 BLOCK" count**: two of the seven (the two
season-stats blocks) are false alarms tied to the preflight tool's own
missing season-phase check, and the podcast-extraction block was measuring
an abandoned pilot table instead of the real pipeline. The genuinely live
blockers are: `futures_odds_snapshots` staleness (Bookmaker/BetUS 29d,
Circa never captured — real, needs new screenshots/feeds) and the three
local-file freshness blocks (player-availability, expert-dossiers,
prediction-markets — not yet re-checked for whether their cadence is also
naturally seasonal; worth doing before treating them as neglect).
