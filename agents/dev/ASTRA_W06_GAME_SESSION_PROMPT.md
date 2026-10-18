---
name: ASTRA_W06_GAME_SESSION
role: Fresh-session prompt - ONE Week 6 game per session, proposed Astra synthesis
category: dev
docsOnly: true
created: 2026-10-17
---

# Astra Week 6 - single-game session (Platinum Rose)

## Activation (paste as the first message of a fresh session; replace <GAME>)

```text
Run the Platinum Rose Week 6 Astra synthesis for ONE game: <GAME>.
Repo: E:\dev\projects\NFL_Dashboard (device_bash: $HOME/mnt/dev/projects/NFL_Dashboard).
Read agents/dev/ASTRA_W06_GAME_SESSION_PROMPT.md and follow it. Select the packet for <GAME> in scratch/w06-astra-synthesis-queue.json. Do not synthesize any other game.
NO PINS, NO STOP GATES: any HEAD/hash/roster/kickoff/condition issue is recorded under "Gate notes" in the report and never stops the run. You MUST deliver the full synthesis.
Outputs: reports/intel/games/2026-w06-astra-<AWAY>_at_<HOME>.md ; data/research-intel/proposed/games-w06/2026-w06-astra-<AWAY>_at_<HOME>.json ; append one line to reports/intel/games/2026-w06-astra-RUNLOG.md.
```

Games: HOU@JAX, NYJ@NE, PIT@TB, BAL@CLE, CHI@ATL, TEN@IND, CAR@PHI, NO@NYG, ARI@LAR, BUF@LV, LAC@KC, DAL@GB, WAS@SF. (SEA@DEN is final and out of scope.) Sessions are independent: do not read or reference another game's output.

## 1. Mission

One proposed, cited, research-grade synthesis for one game: lean, tier, price sensitivity, counter-case and what would change it. It is a proposal Andy reacts to. Nothing is placed, promoted or written to Supabase by you.

Hard prohibitions (these are the only rules that bind): no wagers or sportsbook clicks, no TheOddsAPI, no Supabase writes, no paid model/API calls (Gemini, AssemblyAI, OpenAI), no ledger/portfolio/official-pick changes, no tickets or stakes (no `ticket`, `stake`, `wager_amount`, `bet_slip`, `payout` keys), no git add -A / reset / clean / stash / commit / push. The checkout is dirty and shared; touch only the output files in section 7.

## 2. Gate notes (ADVISORY ONLY - nothing in this section may stop or shorten the run)

Andy's standing rule (2026-10-17): a failed check is only noted for reference. Every session MUST complete a full synthesis (all section 5 structure, a lean or an honest pass, counter-case, delta checklist, both output files, run log line). There is no STOPPED outcome.

Do at most one quick pass (a few commands, no re-verification loops, no repeated hashing), then write the results in a "Gate notes" section of the report and in `gate_notes[]` of the JSON:

1. Queue: read `scratch/w06-astra-synthesis-queue.json`, select the packet whose `matchup` equals the game. Use it whatever its `status`, `dispatch_allowed`, `blockers[]` or `conditions[]` say; list those as notes (and in Ambiguity). `blocked` or an open condition means: omit the affected player legs/claims, cap the affected candidate at tier 2-, and say what would resolve it. Still deliver the full synthesis.
2. Pins and drift: HEAD/branch, queue/packet/prompt hashes and `evidence_manifest[]` hashes are NOT gates. Do not hash anything unless a source looks wrong while you read it. If you happen to see a changed source, note it and use the current file.
3. Kickoff: record time-to-kickoff. If it has passed or the game is underway/final, still synthesize as a labeled retrospective/research note (no forward lean), do not stop.
4. Roster: read `data/generated/master-intel/w06-roster-vet.json` and report status, source time and age. Do NOT rerun `roster:vet` (parallel sessions race on that file). If it is BLOCK or stale, note it, treat the affected players as unverified and omit their legs. Never infer team/role/status from memory.
5. Unconfirmed QB/injury/weather/roof facts: present both scenarios when they swing the lean, and say which official news (inactives, roof, Williams decision) flips it.

The article gate is cleared (see section 3). FTN weekly cadence and approved YouTube signals are accepted under Andy's October 17 decisions; moved lines and thin coverage are notes.

## 3. Inputs (use the packet first; open only pinned files and scoped selectors)

- The packet (market baseline, opener to current, dossier, FTN/quantitative, availability, weather, expert/podcast/article agreement, splits, props, conflicts).
- Line baseline: `data/odds/BKR_current_lines_1017_1240_buildfmt` (Sat ~12:40 PM PT). The quantitative model (`data/research-intel/proposed/2026-w06-quantitative-synthesis.json`) was rebuilt on it at 21:11Z; its tables drop spread signs ("PHI 3" = PHI +3). Read direction from the BKR file.
- Splits: `data/generated/master-intel/w06-splits-all.json`. Spread/total from Sat 11:14 AM PT; moneyline splits are the stale Thursday-night pull. State the age wherever used.
- SuperContest locked lines: `data/supercontest/week-06-lines.json` (captured 10/15 2:29 PM PT). `live-market-comparison.json` drops signs.
- Weather: `data/research-intel/review/2026-w06-weather-venue.json` (Open-Meteo, Sat 1:16 PM PT, forecast not observation). CHI@ATL and TEN@IND are retractable roofs, BUF@LV a fixed dome: no outdoor weather applies without a roof confirmation.
- FTN: weekly stats, refreshed once per week by design; the 10/16 context is the current one. It is a quantitative input, never an expert tier.
- YouTube picks: `data/podcasts/youtube-extracted-picks-2026-w06.json` is APPROVED by Andy (2026-10-17) as signals. Each pick carries `line_movement` vs the 12:40 PM board. Moved lines are noted, not blocking: reprice, and say how far the price moved. Fourth-quarter, alt-line, SGP and teaser legs are not comparable to the full-game number.
- Articles: the article gate was cleared by disposition on 2026-10-17 (0 unresolved; only 8303, an X bookmark with no body, is excluded). Per-game leads from 26 read sources are in the packet at `expert_article_podcast.articles.read_in_full_leads` (source file `data/research-intel/review/w06-article-leads-read-2026-10-17.json`). They are analyst leads priced at publish time, not picks: reprice against the 12:40 PM board, check each caveat (paywalled stubs, stale Lamar premise, internal contradictions), and cite article_id/outlet/author. Straight-up score picks (ESPN, PFT) and public contest consensus (Average Joe) are context, not edge. Props need the roster gate and a current priced row.
- Player props only where a current row-verified price exists in BKR/BEO (retain each event’s actual captured timestamp; latest BEO artifact is 2:15 PM PT). DraftKings Predictions contracts are reference-only, not executable. No Bookmaker TD-scorer rows exist. Live files govern BetOnline coverage: the repinned 21:15Z capture has full player markets for HOU@JAX, BUF@LV and DAL@GB; CHI@ATL now has only four game-market rows. Thin coverage is a note, not a game blocker.

## 4. Known facts and cautions (verify against the roster gate and packet; do not infer)

- PHI: Hurts OUT, McKee starts. Millman's CAR +1.5 predates that; the line is now about CAR -3 (label it "pre-Hurts-OUT").
- BAL Lamar Jackson and TB Baker Mayfield out per ESPN/FantasyPros; Huntley and Daniels on operator approval. Official inactives decide. Makinen's BAL -4.5 was conditional on Lamar and is void.
- CHI: Caleb Williams "expected to play", NOT confirmed (operator note 10/17 13:13 PT); resolved Sunday morning. CHI@ATL cannot be `ready`; no CHI-dependent card.
- Barkley OUT is a reporter hedge: unconfirmed. A.J. Brown (NE) is ESPN day-to-day: status check before any Brown leg.
- Isaiah Likely is on NYG (Andy confirmed); his anytime-TD pick belongs to NO@NYG, price +225 unverified. Najee Harris is unresolved: do not use.
- Roster map uses WSH; schedule uses WAS.
- Moneyline-split age and prop-board coverage gaps must be named, not smoothed over.

## 5. Method (same rules as the W5 per-game synthesis)

- One simulator only: `scripts/intel/margin-simulator.mjs` (market-calibrated; run `--selftest` first). You supply judgment adjustments (`margin-adj`, `total-adj` in points, home-positive) with a stated reason each; never write your own distribution. Soft cap 2.0 points, hard cap 3.0. Props, team totals, SGPs and teasers have no calibrated joint model: do not present them as model probabilities.
- Every non-trivial claim carries `[Source: path, field, timestamp]`. Quotes must be verbatim from the packet's source rows. If a claim has no auditable source, it goes in Ambiguity, not in the thesis.
- Dispositions: `quantitative candidate`, `qualitative candidate`, `conflicted`, `price moved`, `unavailable`, `pass`. Tiers: `2`, `2-`, `skip`, `research_only`. Candidates map to tier 2 or 2-; conflicted/price moved to 2-/skip/research_only; unavailable/pass to research_only/skip. Honest `pass` is preferred over a thin candidate.
- Structure: header (as-of PT time, generated UTC, HEAD, kickoff, packet time); disposition paragraph; team form and schedule context; availability/QB; weather/venue; FTN and quantitative; market table (captured books, timestamps, not live offers) with opener to current movement; expert/podcast/article agreement vs disagreement with attribution; splits with ages; simulator table (baseline and hypothesis rows) with the conditional-probability caveat; props (only verified prices, else omitted); Ambiguity/missing data; Pre-kickoff delta checklist (what to recheck and which price/news crossing changes the lean).
- Counter-case is required: what makes the opposite side right.

## 6. Checkpoints

- Never stop at a gate; note it (section 2) and finish the synthesis.
- Do not start another game. Finish with a 6-line summary: disposition, tier, key number(s), top 2 risks, blockers/ambiguity, output paths.

## 7. Outputs (the Claude team reads these from the repo)

Canonical locations (create directories if needed; never overwrite another game's file):

- Report: `reports/intel/games/2026-w06-astra-<AWAY>_at_<HOME>.md`
- Structured: `data/research-intel/proposed/games-w06/2026-w06-astra-<AWAY>_at_<HOME>.json` (keys: game, generated_at, head, packet_ref, disposition, tier, adjustments{margin_adj,total_adj,reasons}, sim_runs, market_snapshot, sources[], ambiguities[], delta_checklist[]; no forbidden keys)
- Run log: append ONE line to `reports/intel/games/2026-w06-astra-RUNLOG.md`: `UTC time | GAME | HEAD | status (COMPLETE) | disposition/tier or blocker | files`.
- Always the full report. Gate notes go in their own section; never replace the synthesis with a blocker list.

Validation: `python3 scripts/intel/validate-game-output.py --game <GAME>` is pinned to Week 5 paths (`PK`/`OUT`). Run it only if it can be pointed at W06 (env `W05_OUT_DIR` for the output dir; the packet dir is hardcoded to 2026-w05 and will not match). Do not invoke this Week 5 validator against Week 6 paths. If it cannot be safely pointed at this exact packet schema, say so in the Ambiguity section and do a manual self-check for: forbidden keys, disposition/tier pairing, adjustment caps, unsourced claims.

Do not commit. Andy or the Claude team session stages these paths explicitly (named files only). After finishing, tell Andy the three paths so the Claude team can mirror the results into the Project.
