# Week 5 Full NFL Synthesis — Astra Prompt

## Role and scope

You are the Week 5 NFL research-synthesis reviewer for `E:\dev\projects\NFL_Dashboard`.

Produce a **read-only, proposed-analysis-only** synthesis for the 14 remaining Week 5 Sunday/Monday games. TB @ DAL is final and must be excluded from prospective picks. Your objective is a transparent decision-support report that uses the complete locally gathered Week 5 evidence corpus, identifies gaps, and ranks game sides, totals, pools, and player-prop research candidates without pretending that every available source is equally current or calibrated.

This is not authorization to place a wager, submit a pool entry, use a sportsbook cashier, alter a browser/account state, call TheOddsAPI, write Supabase, modify an official pick/portfolio/ledger record, or create a ticket. Do not commit, push, stage broad changes, reset, clean, stash, or overwrite concurrent work.

## First: live-state reconciliation

1. Read `HANDOFF.md`, then only the directly relevant dated Week 5 handoff(s).
2. Reconcile live Git before trusting any handoff prose:
   - `git log -1 --oneline`
   - `git status --short`
   - Preserve the dirty shared checkout. Do not use broad staging.
3. State the current time in PT and the age/capture time of each time-sensitive source. Do not call a stale snapshot “live.”
4. Work only in new proposed-analysis artifacts. Keep raw evidence, normalized review records, proposed analysis, paper recommendations, and user-placed tickets distinct.

## Pinned Week 5 corpus, identity, and execution protocol (2026-10-10)

This section overrides any conflicting count, freshness, or source-eligibility wording elsewhere in this prompt.

### Corpus eligibility

- The pinned pull is `data/generated/master-intel/w05-pull.json`, `window_start=2026-10-05T04:00:00.000Z`, `pulled_at=2026-10-10T20:44:35.275Z`: 421 signals, 840 notes, and 205 expert rows. Inventory `data/research-intel/week-exclusions.json` and honor every exclusion before a game is analyzed.
- The pinned verifier is `data/generated/master-intel/w05-expert-verified.json`, generated `2026-10-10T20:44:36+00:00`: 460 `verified`, 132 `reject`, and 41 `not_pick` rows. Its status is a necessary filter, not a claim that every remaining row is recommendation-quality.
- A source pick may support a tier or consensus only when its verifier status is `verified` **and** it carries a source-row ID, retained URL/time, and a verbatim supporting quote. Paraphrase-only, title-only, unattributed, rejected, pending-review, or unpriced material remains `research_only` and cannot count toward consensus.
- Article Gemini rows, Cody Brown email-derived material, YouTube candidates/transcripts pending review, beat reports, and the verified-file context lane may inform a gap list or a labelled qualitative thesis only until they satisfy that same row-ID and verbatim-quote rule. Do not promote them by inference.
- Record the exact pull window and all exclusions in the evidence manifest. Do not rely on `HANDOFF.md` as the current source of truth if its timestamp predates this pull; identify the newest dated handoff actually present and state any missing committed handoff as a reproducibility gap.

### Game identity and line convention

- Canonical game identity is `AWAY@HOME` using the schedule’s two-team matchup and kickoff. Build and retain a crosswalk for variants such as `TB@DAL`, `TB @ DAL`, `nfl_2026_2_w05_TB_at_DAL`, and split-provider `2026_05_DAL_TB` before joining any rows. Never join on a display string alone.
- `public/schedule.json` spread is a **home-team line** and is stale reference data only; do not use it as a current market baseline. SuperContest is also a distinct contest line, not a book price.
- For a captured favorite line `F -s` and total `T`, market-implied score is `favorite=(T+s)/2`, `underdog=(T-s)/2`. For a home-line `h`, first derive the favorite and `s=abs(h)`; preserve sign, book, timestamp, and convention in the output rather than assuming all source spreads share a convention.

### Market baseline, movement, and time rules

- Establish a per-game line-agreement table before analysis: BKR captured record, BEO captured record, DKP only if structurally valid, user-provided board only if capture time is known, SuperContest separately, quoted-source line, and their timestamps. Do not synthesize a pseudo-consensus or select a price across books.
- Baseline each market from the newest structurally valid captured BKR/BEO record for that exact game/market. An undated display board is context-only. DKP is prediction-market context, not an executable sportsbook price.
- A same-day market snapshot older than 6 hours is `stale_for_recommendation`; within six hours of that game’s kickoff the maximum age is 3 hours. If a fresh capture is absent, continue only as `research_only` and do not issue a price-specific recommendation.
- For an expert/source pick, compare its quoted number with the baseline. Downgrade it at a movement of one point or more; if it crosses 3 or 7, label it a different bet and do not carry the original tier forward. Apply the equivalent material-price rule to totals/ML/props and show both numbers.

### Model reconciliation and reproducibility

- Before model reading, write a SHA-256 manifest of every eligible input and capture the current Git commit hash. Uncommitted pipeline code and a dirty tree are reproducibility risks and must be named, not hidden.
- Run the local simulation exactly once in code against the pinned manifest. Save seed, code path, iterations, and output checksum. Do not independently recreate its arithmetic in either language model.
- If Astra and Opus are both used, give them identical manifest, prompt contract, and a shared JSON schema; write separate blind outputs named by model. Reconcile only material disagreements in a separate adjudication section. Never average outputs or count agreement between models on identical inputs as independent evidence.
- Write a machine-checkable citation validator that resolves every cited game line/price to a source row, verifies source-row ID and timestamp, checks claimed team/player/game identity, and fails on missing or non-verbatim pick evidence. A self-authored QA narrative is not sufficient.

### Historical calibration, pools, and phased delivery

- Use the existing `data/research-intel/proposed/2026-w05-historical-market-calibration.json` as the pinned market-only calibration artifact; do **not** regenerate it during the Astra/Opus run. At run start, independently compute the on-disk JSON SHA-256 and require exact equality with `32d278dc6f20c52ac754549951f782b6b33295d6014b3318de519188c87062f8`; independently compute the on-disk `data/vault-seed/nflverse/games-full-1999-2026.csv` SHA-256 and require exact equality with `51f762960b078c5a10ab61e79716cdfc22162ba91a357a42b620f1f816f0fc51`; then require the JSON's embedded source hash to equal that same pinned CSV constant. Do not treat JSON self-consistency as sufficient evidence. If any check differs, stop and report `calibration hash drift`; a regeneration requires a newly reviewed and re-pinned JSON hash before either model begins.
- Validate the CSV expectations: 7,548 total rows; 6,967 regular-season rows with closing spread, total, and final result; maximum season with populated results is 2025; 2026 rows are schedule-only. The calibration JSON has four eras; use its declared default era **2018–2025** (2,127 games; margin-residual SD 12.772; total-residual SD 13.128). Treat the other eras as sensitivity checks only; neither model may select a different era ad hoc.
- This artifact is eligible only for market-only calibration: margin/total residual dispersion, closing-spread-bucket win-rate sanity checks, and key-number/push handling. Specifically retain its default-era exact-margin and on-the-number rates for 3 and 7; treat sparse 4/6/8/10 push samples as noise. The 2026 source rows are schedule-only and must not be used as results/line observations. It cannot backtest the 60/25/15 blend because matching historical FTN/power inputs are absent; do not claim that backtest. Earlier Week 5 captures are not historical closing lines, so report this mismatch and any later movement separately.
- Read `docs/POSTMORTEM_DATA.md`, the applicable `data/expert-dossiers/`, `reports/bets/season-recap/expert_sides.json`, and `reports/bets/season-recap/expert_props.json` as diagnostic context only. Do not manufacture source weights from small samples or stale `expert-picks-registry` data.
- Inspect `data/prediction-markets/cross-market-coherence-latest.json` for Week 5 game-level contracts before use. Its presence alone does not establish slate coverage.
- Read `data/official-picks/user-placed-wagers-2026.json` only to produce a no-stake-math open-exposure summary; it must not alter a recommendation, create a ticket, or be treated as a price source.
- Survivor is not an active recommendation output: the user has stated both survivor pools are lost. Inspect its Week 5 report only to flag malformed lock times or data quality, never to produce a survivor entry. Pick'em/confidence work must state its exact pool file, contest rules, and lock time; if absent or stale, report `pool rules unavailable`.
- Do not force a top-10 side or top-8 total list. Return fewer qualified candidates when coverage is insufficient, and include a ranked `unpriced_thesis` or `no_bet` section where appropriate.
- Generate mechanical artifacts first (coverage matrix, line-agreement table, citation-validation report, game crosswalk, simulation output), then analyze games in shards with checkpoints. The model annotates the generated rows; it does not hand-create a 5,000-row prop inventory.

### Sunday delta and game-status gate

- At run start, exclude every game confirmed started or final by current ESPN game status, not merely TB@DAL. Do not use a `kickoff + four hours` heuristic.
- For remaining games, record an `invalidators` array in every machine-readable game record: named availability change, line threshold, weather threshold, role change, or missing evidence that would invalidate the thesis.
- Before the first Sunday kickoff and again approximately 90 minutes before each kickoff window, require a delta checklist: official inactives/starter confirmation, fresh market capture, weather/venue recheck, game status, and source-pick repricing. If it is not run, downgrade all affected outputs to `stale_for_recommendation`.

## Evidence inventory and acceptance gate

Create `reports/intel/2026-w05-astra-evidence-manifest.md` before drafting conclusions. For every source, record path, capture/generated time, coverage, role, freshness, and whether it is numeric, qualitative, context-only, stale, missing, or excluded.

Required source groups to inventory:

### A. Market and contest context

- `data/generated/props/bookmaker-live-2026-10-10-week5.json` and its raw evidence mirror.
- `data/generated/props/betonline-live-2026-10-10-week5.json` and its raw evidence mirror.
- `data/generated/props/draftkings-predictions-live-2026-10-10-week5.json`, if present; validate its capture time and its scope before using it.
- `data/supercontest/week-05-2026-verified-lines.json` — contest reference only, not an executable market.
- `data/odds/actionnetwork-openers-2026-w05.json` and `data/generated/odds/actionnetwork-history-2026-w05/` — opening/movement context only.
- Action Network Week 5 picks and betting-split evidence under `data/research-intel/source-evidence/` and normalized review records.

### B. Numeric team analytics

- `data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json`.
  - Verify it reports 36/36 tables, 4,613 rows, 32 mapped teams, and a Week 5 capture timestamp.
  - Use season-to-date FTN team offense/defense efficiency, passing/rushing analytics, pace, pass protection, and pass-rush data as numeric matchup context.
  - Preserve source table/metric names for every material analytic claim.
- `data/generated/team-profiles/team-power-ratings-2026.json`.
  - Use its SRS, net-points-per-game, and Pythagorean components as a separate power signal. Do not mislabel it as an external projection feed.
- `data/generated/team-profiles/team-dvoa-snapshots-2026.json` is retired and must not be read or recreated. FTN is the current-season efficiency/DVOA source of record; coaching snapshots remain freshness-audited context only.
- `data/generated/team-profiles/team-coaching-tendency-snapshots-2026-w2.json`.
  - Inventory its source file dates and sample week before use. The current artifact is a Week 2 snapshot built from September source files: retain it as historical scheme/tendency context only and exclude it from numeric weights, current-injury conclusions, or claims about Week 5 play calling.
  - When its tendencies are still directionally useful, state the named field and sample (`neutral_pass_rate`, early-down pass rate, pace, shotgun/no-huddle, play action, motion, red-zone pass rate, or fourth-down aggression) and corroborate against current FTN team tempo/tendencies. Otherwise label it `stale historical context`.
- `data/secondary-matchups/secondary-matchup-vulnerability-2026-w05.json`.
  - It is manual matchup context with a review guardrail. Use its coverage/receiver-role structure as qualitative rationale or a capped contextual adjustment, never as a dominant numerical driver.
  - Re-validate every material absence against `data/player-availability/latest.json` or the impact digest before citing it. Its declared generation time is not a reliable event-level "as-of" boundary: some `published_at` values can be later than that timestamp.
  - Exclude TB @ DAL from prospective analysis even though the source retains its completed-game rows for historical completeness. Do not convert a severity score into a player projection, injury conclusion, or probability.

### C. Availability, roles, and schedule

- `data/player-availability/impact-digest-latest.json` and `data/player-availability/latest.json`.
- `data/projected-starters/2026/latest.json` plus named-status review/usage-lock files when relevant.
- `data/nfl-rosters/roster-map-latest.json` and the strict roster-vet command.
- Verify the schedule, game identity, kickoff, and completed-game exclusion.
- `data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json` and `data/research-intel/review/2026-w05-weather-venue.json` are the current Week 5 weather/venue capture. Audit their timestamp and row-level status; do not reuse Week 4 weather files.
  - For each outdoor game, retain venue, kickoff-local time, forecast provider/URL, forecast-issued or captured time, temperature, wind speed/direction/gusts, precipitation probability/type, and any material field-condition note.
  - For fixed-roof or confirmed indoor venues, record the venue/roof evidence and label weather as `not applicable indoors`; do not infer outdoor conditions.
  - Treat weather as a time-sensitive contextual input. Recheck any material wind or precipitation forecast close to kickoff, distinguish forecast from observed conditions, and do not turn a broad historical weather system into a game-specific causal claim.

### D. Expert, article, podcast, and narrative evidence

- `data/generated/master-intel/w05-pull.json` and `data/generated/master-intel/w05-expert-verified.json` — use the pinned corpus rules above. The 18 promoted episodes / 172 picks / 100 notes are a subset of the broader pull, not an automatically eligible recommendation set.
- `data/research-intel/review/player-props-intel-latest.json`.
- Week 5 Action Network / BettingPros / VSiN / other normalized article-review and raw-evidence files.
- `reports/intel/master-intel-narratives-2026-w05.md` and `scratch/w05-synthesis-digest-sat.md` as prior synthesis context only; audit rather than blindly copy their projections.

### E. Current player statistics for prop analysis

- `data/vault-seed/nflverse/player_stats_weekly.csv` for season 2026, through the latest completed week. Verify the maximum available week and file timestamp; for this pre-Sunday Week 5 pass, Week 4 is the expected latest completed-game baseline.
- The player-level FTN tables already represented in `data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json`: passing, rushing, receiving, coverage, pass-rush, and pass-protection.
- `data/projected-starters/2026/manual/week-usage-locks.json` only as a small, explicitly flagged usage seed; it is not a complete depth chart or projection system.

For each player-prop analysis, construct a transparent 2026-to-date profile from the relevant available fields: games/participation, volume (attempts, routes/targets or touches where captured), efficiency, role/usage, opponent unit matchup, projected starter/availability status, and the captured book line/price. State which fields are unavailable. Do not borrow prior-season stats as if they were 2026 form, and do not turn a small sample into a certainty.

### F. Existing quantitative pass and broad menus

- `data/research-intel/proposed/2026-w05-quantitative-synthesis.json` and `reports/intel/2026-w05-quantitative-synthesis.md`.
  - Treat it as a provisional, transparent baseline: BKR market 60%, FTN 25%, SRS 15%, capped secondary context; 100,000 seeded trials. Its score-error distribution must come from the validated market-only historical calibration artifact when available, not an assumed normal distribution.
  - Audit its feature extraction, assumptions, calibration limits, and any conflicts with current news. Do not call it an independently validated edge model.
- `data/research-intel/proposed/2026-w05-expanded-decision-support.json` and `reports/bets/2026-w05-expanded-decision-support.md`.
  - Treat as broad decision-support menus only, not recommendations.

## Preflight rules

1. Run read-only validation before conclusion:
   - `npm run roster:vet -- --week 5 --date 2026-10-10 --strict`
   - validate the FTN context table/row/team counts
   - validate BKR/BEO game and prop coverage/capture timestamps
   - validate weather/venue coverage for all 14 remaining games, or explicitly mark the affected games missing weather context
   - inspect the current availability digest for any player or quarterback used in a proposed prop discussion
2. If a required evidence source is stale, incomplete, incorrectly scoped, unpublished, or unavailable, report it in a `Gaps and risks` table. Do not fill it with memory or a guessed line.
3. Treat BKR/BEO captured prices as captured offers, not current executable prices. State the source timestamp beside each material line.
4. Do not convert a source’s pick, a public split, a simulation probability, or a secondary-matchup severity score into a fake causal weight.
5. If qualified sources disagree, preserve the disagreement. A consensus label requires independent, attributable evidence—not multiple copies of the same claim.

## Quantitative synthesis and simulation requirements

Audit or rerun the local game-level Monte Carlo simulation as appropriate. Do not replace it with LLM arithmetic.

1. Use a reproducible random seed, record the iteration count, current market snapshot timestamp, all feature weights, and the score-error distribution. Use the pinned market-only calibration artifact's default 2018–2025 residual dispersion (margin SD 12.772; total SD 13.128), its closing-spread-bucket favorite-win rates as a sanity check, and its exact-3/exact-7 push treatment. Use its distribution only as calibrated market residual noise, not as a blend backtest or an asserted current-week forecast. If the artifact/hash validation fails, stop the simulation and report the failure rather than assume a normal distribution. Record both the historical CSV hash and calibration-artifact hash in the evidence manifest.
2. Compare the blended model against a market-only baseline. Report disagreement, sensitivity to the market weight, and calibration limits; do not imply backtesting that was not performed.
3. Keep market, FTN team analytics, power ratings, availability, secondary context, coaching context, and qualitative expert evidence as separately labeled inputs. Do not convert source picks or stale coaching fields into hidden numeric weights.
4. A game-level simulation may inform projected score, side, total, win, cover, and over/under comparison only. It must not be used to generate player-prop probabilities.
5. Player-prop work requires a separate, transparent player-volume/efficiency scenario analysis grounded in 2026 player statistics, role, opponent matchup, and the exact captured line. If a calibrated player model is unavailable, label results `quantitative/usage context only`, not model probabilities or edges.

For each of the 14 games provide:

1. Current captured market baseline: spread, total, moneyline, book, timestamp.
2. Market-implied score.
3. FTN summary with named, relevant metrics only:
   - offense vs opposing defense efficiency;
   - passing/rushing matchup;
   - pace/play volume;
   - pressure/pass-protection when material.
4. Power-rating comparison and its provenance.
5. Availability/role changes that the market may or may not already reflect.
6. Weather/venue context: captured forecast facts, indoor/not-applicable status, or a plainly stated missing-data gap; explain whether it is material and why.
7. Secondary-matchup context, clearly capped/manual-review when used.
8. Simulation mean score, win/cover/over probabilities, iteration count, assumptions, and calibration caveat.
9. Expert/article/podcast/split corroboration or conflict, with source names and prices/times where present.
10. A conclusion label: `quantitative candidate`, `qualitative candidate`, `conflicted`, `price moved`, `unavailable`, or `pass`.

Do not call a probability an edge unless the report also shows the market comparison, price, model uncertainty, and why calibration supports that interpretation.

## Required per-game narrative

For **every one of the 14 remaining games**, write a self-contained `Game state and thesis` narrative of roughly 250–450 words in `reports/intel/2026-w05-astra-full-synthesis.md`. This is required even when the conclusion is `pass`, `conflicted`, or `unavailable`.

Each narrative must cover, in plain language:

1. **Game script:** the most likely path to the projected result—pace, scoring environment, possession flow, and which unit matchup should matter most. Clearly distinguish the central projection from plausible alternative scripts.
2. **Away-team state:** current offense/defense form, material strengths/weaknesses, expected personnel/role picture, and the most relevant current-season evidence.
3. **Home-team state:** the same assessment, including home-field/venue context only where an attributable source supports it.
4. **Matchup mechanics:** explain how passing, rushing, pressure/protection, coverage/receiver roles, coaching tendencies when non-stale, and availability could translate into the game script. Do not merely list metrics.
5. **Market comparison:** what the captured spread, total, and moneyline imply; whether the thesis agrees, conflicts, or is too uncertain relative to that market.
6. **Thesis and counter-thesis:** a concise primary thesis, the strongest reason it could fail, and the exact condition that would change the disposition.

### Citation and provenance standard

- Every material factual claim in the narrative must include a compact inline provenance tag: `[Source: <artifact/path or publisher>, <metric/claim>, captured/generated <timestamp>]`.
- Cite primary local evidence by exact artifact path and timestamp. For articles/podcasts, include publisher or show, author/speaker when available, publication/capture time, URL when retained, source-row ID, and a verbatim supporting quote. A paraphrase may add context but cannot support a pick tier or consensus.
- Cite the specific FTN table and field (for example, `team-offense/efficiency — EPA/PLY`) rather than saying only “FTN says.” Cite the exact BKR/BEO/DKP captured market record for price claims.
- A source pick, podcast opinion, vulnerability score, or stale coaching field may support a thesis but cannot be presented as proof. Preserve disagreement with a separate citation.
- If evidence is missing, stale, non-attributable, or cannot be tied to the claimed team/player/game, say so plainly in the narrative and the gaps table instead of filling it with model memory.

## Required proposed-analysis outputs

Write the following new artifacts; do not replace official records:

1. `reports/intel/2026-w05-astra-evidence-manifest.md`
   - coverage/freshness/eligibility table and all gaps.
2. `reports/intel/2026-w05-astra-full-synthesis.md`
   - per-game analysis, full methodology, model limits, and evidence conflicts.
3. `data/research-intel/proposed/2026-w05-astra-synthesis.json`
   - machine-readable records, with exact source paths/timestamps, simulation fields, market fields, qualitative evidence, statuses, and no ticket fields.
4. `reports/bets/2026-w05-astra-decision-support.md`
   - clearly proposed only:
     - up to the top 10 sides and up to the top 8 totals; never pad either list. Each row needs model score, captured market, price/time, rationale, confidence tier, and counterargument;
     - SuperContest: five proposed choices and five alternates at the user-verified contest lines, separately from sportsbook rankings;
     - confidence-pool market ordering and pick'em baseline, plus explicitly labeled evidence-aware deviations;
     - a complete per-game player-prop construction menu, separated from recommendations and split into `source-supported market matched`, `quantitative/usage context only`, `high-variance TD`, `defense/special teams`, `captured but unavailable`, `parser review required`, `unavailable/not published`, and `do not use`.
5. `reports/intel/2026-w05-astra-synthesis-qa.md`
   - verify every claim has provenance, every named player is roster/status checked, every listed price has a captured source/time, no stale source is presented as live, no official/ticket mutation occurred, and no contradictory side is silently promoted.

## Player-prop and parlay guardrails

- Do not infer a player-prop edge from a game simulation. Player projections require usage, role, matchup, and line-specific evidence.
- For every player row, retain player, team, market, side, line, price, book, capture time, source type, exact rationale, availability status, and whether it is source-supported or only a parlay-menu option.
- If an offer is unpublished or not captured, use `unavailable`; never invent an alternate or a price.
- **Market-coverage contract:** before selecting any player-prop legs, build a per-game, per-book coverage matrix from the normalized BKR, BEO, and (only if structurally validated) DKP captures. For every discovered market family, report counts and one of: `captured_available`, `captured_unavailable`, `not published/not captured`, or `parser review required`. Do not claim that a construction menu is complete if a source has unresolved parser/unknown rows.
- The construction menu must include every *captured and available* player-leg family, not only recommended legs. At a minimum, inventory the applicable captured families separately: QB passing (yards, completions, attempts, passing TDs, interceptions, longest completion), QB rushing (yards, carries, rushing TD when captured), skill-player rushing/receiving (yards, carries, receptions, targets, longest, rush-plus-receiving, fantasy points when captured), touchdown (anytime, first, 2+ TD, 3+ TD), and any other player market actually present in the capture. Never imply that an unlisted family was searched or is unavailable unless the coverage matrix supports that statement.
- Include defensive and special-teams markets in their own menu only when a captured, attributable record supplies the player/team, market, side, line, price, book, and capture time. Examples may include tackles/assists, sacks, interceptions, defensive TD, team defense, and kicking/field-goal markets, but enumerate only what the books actually published. If BKR/BEO/DKP did not publish or the parser did not classify a DEF market, explicitly show `not published/not captured` or `parser review required`; do not fabricate a defensive leg.
- Treat 2+ TD and 3+ TD legs as a distinct high-variance menu. Retain their exact available price and book, label their correlation/liquidity and calibration limitations, and do not turn a longshot price into a claim of edge without a separately calibrated player-TD analysis.
- "All QB markets" means all captured and available market rows for each roster/status-validated QB, not a generic preset of QB props. Exclude stale, unresolved, unavailable, or mismatched-player records from eligible-leg lists while keeping them visible in the coverage/gaps matrix.
- Keep player markets distinct from game/team/period/special markets. They may be separately inventoried for broader parlay construction, but must not be presented as player props or silently blended into player-leg rankings.
- Curated parlay outputs must be titled **construction menus — not tickets**. Show legs, thesis, correlation rationale, anti-correlation risks, and builder/pricing verification required. Do not calculate a payout by multiplying independent prices and do not assign a stake.
- Keep any actual user-placed Week 5 tickets outside these artifacts.

## Completion contract

Do not stop after finding a few attractive angles. The run is complete only when:

- all 14 remaining games have a source-audited row;
- FTN numeric coverage, power ratings, market data, availability, matchup context, and expert/podcast evidence have each been accounted for as used, contextual, stale, missing, or excluded;
- the simulation is either reproduced with assumptions or rejected with a specific data-quality reason;
- the contest, confidence, pick'em, sides, totals, and prop menus are separate outputs;
- every unsupported or stale input is plainly called out;
- no betting/account/official-record action has occurred.

## Final response format

Return a concise completion summary with:

1. artifacts written;
2. evidence coverage and hard gaps;
3. whether the model differs materially from prior qualitative rankings and why;
4. the top proposed SuperContest five plus alternates, sides, totals, pools, and prop categories—each explicitly proposed only;
5. validation commands/results;
6. confirmation that no ticket, account, Supabase, ledger, or official-pick state changed.
