# Canonical Data Layer — Audit & Merge/Lock-Down Plan

**Status:** APPROVED 2026-08-30 (Andy, via Claude/Cowork). Decisions resolved -- see new Section 6. This BLOCKS all other NFL_Dashboard work (including the already-approved Alpha Phase 3 build) until the data layer is merged and freshness-verified. See TASK_BOARD.md's DATA-LAYER-LOCKDOWN row.

**Author:** Claude/Cowork, 2026-08-30, verified directly against the live repo.

**Why this exists:** Andy's stated suspicion was "all the data is there, my Claude team just isn't aware of it for their task." This document confirms that suspicion is correct, names the specific mechanism, and proposes merging + locking down one canonical layer before any further work on betting-recommendation synthesis, per Andy's explicit sequencing request.

## 1. The Core Finding

There are **two large, independently-built intelligence corpora in this repo that do not talk to each other.**

**Corpus A — the Supabase-native pipeline.** Articles/newsletters (`research_pick_signals`, fed by `research-intel-ingest.js`'s RSS feeds), podcast picks in their older shape (`podcast_transcripts`), and the richer per-host podcast summaries (`podcast_host_summaries`, bridged into a local file via `build-podcast-narratives.js`). This is the corpus `agents/portfolio-dossier.js` actually reads today.

**Corpus B — the Antigravity canonical extraction pipeline.** Documented in `docs/antigravity/CANONICAL_EXTRACTION_PIPELINE.md` (created 2026-08-28, i.e. two days ago), this declares itself the "canonical source contract for Codex, Claude, Antigravity, and Copilot" and states outright: *"Any team synthesizing betting recommendations must check these outputs before concluding that expert intel is missing, stale, or unsupported."* Its baseline (as of the 2026-08-28 refresh): **63 exhaustive master reports, 57 diarized podcast episodes, 209 structured recommendations** in `data/podcasts/actionable_betting_recommendations_2026.json`, plus a master betting packet and a freshness report (`docs/antigravity/source-inventory-and-freshness-latest.md`, refreshed as recently as 2026-08-29 — yesterday).

**The problem, confirmed by direct search:** `agents/portfolio-dossier.js` and `agents/portfolio-synthesize.js` — the actual engine that produces the recommendations Andy sees and acts on — contain **zero references** to any Corpus B artifact. The only consumer of `actionable_betting_recommendations_2026.json` anywhere in the codebase is `scripts/build-alpha-data-packet.js`, which feeds the **Alpha tester demo packet** (a sandboxed, non-production surface), not Andy's real futures/betting synthesis. Corpus B's own freshness doc never mentions the dossier or the committee at all — it audits itself in isolation, with no awareness that a separate, real synthesis engine exists that should be consuming it.

So: this session nearly repeated the mistake. My first-pass answer to "is the AI getting all the data" was built entirely from Corpus A and the July 21-22 build history, and it would have been wrong by omission — Corpus B's own contract document says explicitly that checking it first is required, and I hadn't. That's the sharpest evidence for Andy's suspicion: even a careful audit missed a whole corpus on the first pass, because there's no single place that says "here is everything, and here is what's actually wired in."

## 2. Full Source Inventory (cross-referencing the 2026-07-21 audit against today)

| Source | Where it lives | Reaches the committee dossier today? | Freshness-gated? |
|---|---|---|---|
| Articles/newsletters (Action Network, PFF, Sharp Football, Substack, etc.) | `research_pick_signals` | **Yes** | Yes (`articles` lane) |
| Podcast picks (older shape) | `podcast_transcripts.picks/intel` | **Yes**, queried live | No (always-current by construction) |
| Podcast host-summary narratives (confidence/quote/stats-cited) | `podcast_host_summaries` -> Obsidian vault -> `docs/podcast-narratives/index.json` | **Yes, but stale** — index last built 2026-07-23, five-plus weeks behind | **No** — not in `EVIDENCE_LANE_FILES` |
| Antigravity master reports + structured recommendations | `scratch/*_master_100percent_exhaustive.md`, `data/podcasts/actionable_betting_recommendations_2026.json` | **No** — only reaches the Alpha demo packet | No |
| Twitter/X curated sharp accounts | `x_sharp_tweets` via `twitter-bookmarks-agent.js`, written to `vault_notes` | **No** — no bridge exists at all | No |
| Hand-authored deep reference libraries (team identity, ATS trends, key numbers, coach tendencies) | `skills/nfl-team-notes/references/`, `data/vault-seed/manual/*` | **No** — only reachable as prose by the live chat agent, not the dossier | No |
| Training camp intel | `data/training-camp/2026/latest.json` | Yes | Yes |
| Player availability/injuries | `data/player-availability/latest.json`, `player_injuries` | Yes | Yes |
| Team stats/EPA/formation, DVOA, coaching profiles | `nfl_team_season_stats` and related | Yes | Not in the 9-lane list, but Supabase-live so lower staleness risk |
| Referee tendencies, roster churn, CLV, rest/travel/schedule context | Migrations 039/040 + derived | Yes | Not in the 9-lane list |
| Betting splits / line movement / futures odds (incl. new 46-market Metabet feed) | `game_odds_snapshots`, `game_splits_history`, `futures_odds_snapshots` | Yes | Not in the 9-lane list, but live-queried each run |
| Prediction markets (Kalshi/Polymarket) | `data/prediction-markets/*` | Yes | Yes (2 lanes) |
| Fantasy data (ADP, weekly rankings, projections, injuries) | `fantasy_adp`, `fantasy_rankings`, `fantasy_projections` | Correctly **not** in scope — separate agent domain (Fantasy, not Futures/Betting) | N/A |

Two other latent risks from the July audit, re-confirmed still present today and directly relevant to "locking down a source of truth":

- **Three incompatible `game_id` formats** across `games`, `game_odds_snapshots`/`game_splits_history`, and nflverse's own CSVs — every join has to resolve by `(season, week, home/away abbreviation)` instead of matching ID strings, which is fragile and easy to get subtly wrong in a new join.
- **Two player-season-stats tables** (`nfl_player_season_stats`, `player_season_stats`) with unconfirmed relationship — flagged in July as "worth confirming they're not diverging sources of truth," never actually resolved.

And a structural observation worth naming directly: **60 separate files** in `agents/`/`scripts/` independently open a Supabase client and write their own queries. There is no shared data-access layer — every pipeline (dossier, alpha packet builder, agent tools, futures intel report, fantasy value report, etc.) hand-rolls its own fetchers against the same underlying tables. This is exactly the kind of fragmentation that lets a Corpus-B-sized gap hide for weeks without anyone noticing, because no single file's author has to look at the whole picture.

## 3. What "Merge, Then Lock Down" Should Mean

Taking Andy's request literally and in order — merge everything first, lock it down as the source of truth, *then* resume synthesis work:

**3a. One canonical evidence-lane registry, not nine.** Extend `scripts/lib/dossier-freshness-gate.js`'s `EVIDENCE_LANE_FILES` to cover every source in the table above that doesn't already have a lane: podcast narratives (immediately — it's demonstrably stale right now), the Antigravity structured-recommendations corpus, twitter/X bookmarks (once bridged, see 3c), and the vault-seed reference library (once bridged). A dossier build should refuse to proceed, or at minimum loudly flag, if any lane is stale or missing — the mechanism already exists, it's just incomplete.

**3b. Not a reconciliation problem -- a re-pointing problem. (Revised 2026-08-30, per Andy's direction not to accept two competing lanes.)**

Andy's question -- "why do we even have Corpus A and B?" -- has a concrete, verifiable answer, and it changes the fix. Checked directly: `data/podcasts/m6-diarized/` (109 files, the source `build-podcast-narratives.js` reads) and `data/podcasts/m6-diarized-all/` (115 files, Antigravity's canonical manifest) contain **the same diarized transcript filenames** -- e.g. both have `2026-02-24-even-money-ross-and-steve-s-2025-nfl-betting-recap.{json,md}`, `2026-03-03-even-money-first-look-at-2026-afc-season-win-totals.{json,md}`, identically. This is not two independent transcription efforts wastefully duplicating the same podcast audio -- it's **one shared raw-transcript corpus, copied into two directories, that then feeds two independent downstream processing pipelines that never reconverge.**

Pipeline A takes that shared transcript and extracts a lightweight per-host lean/confidence structure into `podcast_host_summaries`, which reaches the dossier via the (currently stale) narrative bridge. Pipeline B takes the *same* transcript and does a full, deliberately exhaustive, complete-content extraction into `scratch/*_master_100percent_exhaustive.md`, which is real, deeper, richer work -- and then writes it to a standalone JSON that only the Alpha demo packet reads. Confirmed separately that the article side has the same shape: articles are properly single-pipelined already (`article-intel-review-latest.json` is generated directly from `research_intel_notes` by `scripts/build-article-intel-review.js` -- it's a review of Corpus A, not a second corpus), but `research-intel-ingest.js` only extracts from RSS **teaser** text by default (`INTEL_FETCH_BODY` is off by default per its own code comment) -- so the same shallow-vs-exhaustive split likely exists there too: teaser-level automated extraction vs. whatever full-article-body depth the Antigravity master reports achieve for the articles they've covered (`action_network_*_master_100percent_exhaustive.md` files exist for the same source as the RSS feed).

**So the actual fix is not a conflict-resolution policy between two independent opinions -- it's retargeting Pipeline B's output to land in the exact same tables Pipeline A already writes to and the dossier already reads, matched by the shared filename/episode identity (trivial exact-match, not fuzzy dedup) for podcasts, and by URL/title for articles.** When a master report exists for an episode or article already in `podcast_host_summaries`/`research_intel_notes`, its exhaustive extraction should **upgrade/replace** that row's content in place, not exist as a parallel structured-recommendations file. Once that's true, there is exactly one lane per source, at its best available depth, and the "which one wins" question in the original draft of this section disappears -- there's only ever one row for a given episode or article, and it's always the richest version processed so far. This needs to be verified (not assumed) for the article side specifically -- confirm the exhaustive article master reports actually correspond to specific `research_intel_notes` rows by URL/title before building the upgrade-in-place path -- but the podcast side is confirmed by direct file comparison above.

**3c. Close the two remaining silos.** Twitter/X bookmarks and the deep reference library both need an actual bridge into the dossier (not just into `vault_notes`, which nothing structured reads). This is new, real work — not a re-wire of something already built, unlike the podcast-narrative fix.

**3d. Fix the two latent-risk items** (game_id fragmentation, dual player-stats tables) as part of locking down the layer, since "source of truth" and "three incompatible identifiers for the same game" are in direct tension.

**3e. Snapshot and version the merged layer per run.** Once merged, the dossier's own output (already a single JSON file per run) becomes the actual "locked" source of truth for that run — every agent (Futures, Betting, Fantasy, SuperContest) should read from that snapshot rather than each independently querying overlapping raw tables. This is the point where the "different types of Agents" Andy described stop needing to know where 60 different files keep their data.

**3f. Only then resume synthesis work.** Everything in the previous conversation about weekly-game markets, the Dashboard UI, and the calibration/learning loop should wait until the layer underneath it is actually complete and verified — otherwise a weekly-markets committee gets built on top of the same fragmented, partially-stale foundation this audit just found.

## 4. Proposed Sequencing

1. **Audit close-out** (this document) — done, pending Andy's review.
2. **Freshness-gate expansion** — add the missing lanes (podcast narratives immediately fixable; Antigravity corpus, twitter, vault-seed once bridged). Mechanical, low-risk, matches existing patterns exactly.
3. **Bridge + reconcile Corpus B into the dossier** — the single highest-leverage piece; 209 structured recommendations and 63 master reports are sitting unused by production synthesis.
4. **Bridge twitter/X and the reference library** — net-new plumbing, smaller in volume than step 3 but currently zero connection.
5. **Resolve the two latent-risk items** (game_id, dual stats tables) — foundational cleanup, not urgent-feeling but exactly the kind of thing that corrupts a "source of truth" claim if left alone.
6. **Re-verify the whole merged layer against a real dossier build** before touching weekly-market synthesis or the Dashboard UI work discussed earlier in this session.

## 5. Open Decisions Needing Andy's Input

1. **Reconciliation authority:** when Corpus A and Corpus B both have a lean on the same team/market from what looks like the same underlying source, which one wins, or do they need a human-reviewable merge step rather than an automatic one?
2. **Freshness enforcement:** should a stale lane (like podcast narratives right now) *block* a dossier build outright, or just annotate the output with a loud warning Andy has to consciously override? The gate mechanism already supports both modes (`allowStale`/`allowMissing` flags exist).
3. **Ownership going forward:** Antigravity built Corpus B without apparent awareness of the dossier; the podcast-narrative bridge went stale without anyone re-running it. Should there be a single person/process (a scheduled job, or a specific session's checklist) responsible for re-running the merge and checking every lane before each synthesis cycle?
4. **Scope of "lock down":** does "source of truth" mean read-only after each merge (Andy or an agent explicitly re-runs the merge on a cadence), or should it auto-refresh continuously? This has real cost/complexity implications given the AI committee's own per-run cost.
5. **Sequencing confirmation:** does Andy want the full 6-step sequence in Section 4 completed before any weekly-market or Dashboard-UI work resumes, or is there a piece of that work that can safely proceed in parallel (e.g., the Alpha Phase 3 work already approved and unrelated to futures/betting data)?

No implementation should begin on Sections 3-4 until Andy responds to these five points.

## 6. Sign-Off — Decisions Resolved (2026-08-30)

1. **Reconciliation (revised per Andy's direction):** not a conflict-resolution policy between two competing corpora -- confirmed by direct file comparison that Pipeline A and Pipeline B share the same raw podcast transcripts (identical filenames in `data/podcasts/m6-diarized/` and `m6-diarized-all/`). The fix is retargeting Pipeline B's exhaustive extraction output to upgrade-in-place the same rows Pipeline A already writes (`podcast_host_summaries` for podcasts; `research_intel_notes` for articles, pending confirmation of URL/title correspondence), matched by shared identity -- not a dedup heuristic between two independent opinions. See revised Section 3b.
2. **Freshness gate:** warn loudly, don't block. A stale/missing evidence lane stamps the dossier output with a visible warning rather than refusing to build. Andy (or whoever runs a synthesis cycle) is trusted to read and act on the warning rather than have builds hard-fail.
3. **Ownership:** a scheduled task re-runs the freshness check (and refreshes what's automatable) on a cadence, so a bridge like the podcast-narrative one can't silently go stale for five-plus weeks again without anyone finding out until an unrelated audit stumbles on it.
4. **Lock-down mode:** manually-triggered snapshot. The merged layer is stable and reproducible between runs; a person or session explicitly triggers a re-merge when a fresh source-of-truth snapshot is wanted, rather than continuous auto-refresh. Predictable cost, no surprise AI/compute spend.
5. **Sequencing:** full data-layer lock-down first, no exceptions. This explicitly reverses the earlier read on Alpha Phase 3 (approved as its own workstream two questions ago in this session) -- Codex/Antigravity should **not** start Phase 3 implementation yet. Nothing proceeds on weekly-market synthesis, the Dashboard AI-portfolio UI, or Alpha Phase 3 until this document's Section 4 sequence (freshness-gate expansion -> Corpus B re-pointing -> twitter/reference-library bridges -> game_id/player-stats cleanup -> full re-verification) is complete.

Per decision 5, `docs/specs/ALPHA_PHASE3_SUPERCONTEST_SURVIVOR_HANDOFF.md` and `TASK_BOARD.md`'s `ALPHA-P3` row have been updated to reflect the hold.

## 7. The Four-Layer Intelligence Architecture (formalized 2026-08-30)

Andy's direction, stated plainly: stop optimizing the Dashboard's presentation and build the thing underneath it -- "a continuously-curated brain, several honest specialists, and a memory that actually learns." Everything downstream of that (Alpha Phase 3, weekly-market synthesis, the Dashboard UI) is "just marketing" until the brain itself is trustworthy. This section formalizes the architecture that follows from that, and from the specific gap this audit found: the codebase validates LLM *output* (`portfolio-synthesize.js`'s validator, built 2026-07-22) but never validates LLM *input* -- raw intel flows straight from ingestion into synthesis with no integrity check in between.

### Layer 1 — Raw Ingestion (messy on purpose)

Every source this audit inventoried: RSS/newsletter feeds (`research-intel-ingest.js`), podcast transcripts (`data/podcasts/m6-diarized/` and `m6-diarized-all/`), Antigravity's exhaustive master-report extraction (`scratch/*_master_100percent_exhaustive.md`), Twitter/X curated-account bookmarks (`twitter-bookmarks-agent.js`), the hand-authored team reference library (`skills/nfl-team-notes/`, `data/vault-seed/manual/`), and every structured feed (odds, injuries, EPA/DVOA, referee tendencies, roster churn). Nothing here is trusted by construction. Duplication, staleness, and extraction errors are expected and acceptable at this layer -- that's what Layer 2 exists to catch.

### Layer 2 — Verification & Reconciliation (the brain's immune system)

The layer that doesn't exist yet and is the actual point of this whole audit. Four checks, all code-owned (not model-owned), run over every Layer 1 fact before it's allowed into the canonical store:

1. **Extraction fidelity** -- does the extracted claim trace back to an actual quote/value in the real source (transcript, article, odds feed)? The metabet decimal-odds bug (84% of a live feed silently corrupted for weeks) is the standing example of what happens when this check doesn't exist.
2. **Freshness** -- the existing 9-lane gate (`dossier-freshness-gate.js`), expanded to cover every source in this audit's Section 2 table, including the podcast-narrative bridge that's currently 5+ weeks stale with zero coverage.
3. **De-duplication / re-pointing** -- the Corpus A/B finding, generalized: when two pipelines process the same underlying source (confirmed for podcasts via identical transcript filenames), the richer extraction upgrades the same canonical row rather than existing as a second, competing one.
4. **Corroboration / conflict detection** -- when independent, genuinely distinct sources agree, that's a real corroboration signal worth surfacing. When they disagree, that disagreement is itself a signal and must be flagged, never silently averaged away.

**Operating mode, decided 2026-08-30 (Andy): flow-through, not a hard gate.** Given time pressure and the value of seeing full pipeline throughput before tightening anything, Layer 2 does not block a fact from reaching synthesis just because it fails a check. Instead, every fact gets a `verification_status` stamp (`verified` / `stale` / `unverified` / `conflicting`) as it's written to the canonical store. This is an explicit, temporary operating mode -- not a permanent decision to skip verification -- and should be revisited once a real end-to-end run shows what the actual throughput and failure-rate look like. Nothing in this mode removes the freshness-gate warning behavior already decided (Section 6.2): warnings still fire, they just don't block.

### Layer 3 — Synthesis (the committee, reading only the canonical store)

`portfolio-dossier.js` + `portfolio-synthesize.js`'s existing 3-stage committee (Analyst -> Skeptic -> Risk/Editor), unchanged in mechanism, but re-pointed to read exclusively from Layer 2's canonical output -- never raw Layer 1 sources directly. Because flow-through mode means unverified/conflicting facts still reach this layer, the system prompt needs one new explicit rule, mirroring the existing small-sample-signal discipline (`officiating_context`/`clv_signal` "must corroborate, never originate, a thesis"): **a signal tagged `unverified` or `conflicting` may support or corroborate a thesis, but may never be the sole basis for one, and must be named as such in the candidate's disconfirming-factor field.** This keeps flow-through mode honest -- the model can use unverified intel, but has to say so.

### Layer 4 — Output Validation (already substantially built)

`validateRecommendation()`/`validateRecommendationStrict()` in `portfolio-synthesize.js` -- confirms every final candidate's market/selection/book/price actually exists in the dossier, recomputes edge from first principles rather than trusting the model's self-report, and forces `needs_human_review` when evidence doesn't resolve. Extend this layer to also surface each candidate's underlying `verification_status` mix (e.g. "this pick rests on 2 verified sources and 1 unverified one") so the transparency Andy wants for the Dashboard -- and for explaining a pick to his betting partner -- is a direct, honest readout of Layer 2's work, not a separate presentation-layer invention.

### Why this ordering, restated plainly

A dashboard showing a confident, well-formatted recommendation built on unverified or duplicated intel is worse than a rough one that admits what it doesn't know -- it fails silently instead of visibly. Layers 1-2 are the actual "brain" Andy described; Layer 3 is the specialist reasoning over it; Layer 4 is the last honesty check before anything reaches a human. The Dashboard, Alpha Phase 3, and weekly-market synthesis all sit downstream of this and stay on hold (Section 6.5) until Layer 2 exists in real, running form -- even in flow-through mode, since flow-through still requires the verification_status tagging machinery to exist before anything can be usefully observed.

