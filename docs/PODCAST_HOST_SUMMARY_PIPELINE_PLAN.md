# NFL Podcast Per-Host Summary Pipeline — Implementation Plan

_2026-07-20. Filed against task `nfl-podcast-host-summary-pipeline-2026-07` in `.atlas/domain/atlas/tasks.json`. Supersedes the deferred, never-built `--model fable-5` stub in `agents/podcast-reextract.js`._

## Scope

Replace the Fable re-eval stub with a pipeline that goes through each tracked show and produces a detailed per-host summary — analysis, predictions, opinions, and any stats/historical data cited — for every Future discussed. Output as Obsidian notes at `E:\data\Obsidian\NFL\Podcasts\<Show>\<Expert>\`, one subfolder per show then per expert (Andy's structure), with consistent frontmatter (`show`, `expert`, `episode`, `pub_date`, `futures_mentioned`) so notes are queryable via Dataview regardless of folder depth. Builds on the existing `podcast-reextract.js` chunk/merge/dedupe pattern rather than starting from zero.

## Show roster & current coverage (researched 2026-07-20)

| Show | Feed configured? | Roster configured? | Notes |
|---|---|---|---|
| Sharp or Square | Yes | Yes (Chad Millman / Simon Hunter) | Multi-host — needs attribution |
| Warren Sharp (Sharp Football Analysis) | Yes | Yes | Single host — no attribution needed |
| Action Network | Yes | Yes | |
| Ross Tucker | **No dedicated feed** | Yes, under "Even Money" | **Confirmed by Andy 2026-07-20**: Even Money = Ross Tucker's show, co-hosted with Steve Fezzick — multi-host, needs attribution |
| Betting Pros | **Yes** — already seeded, migration 029 (2026-06-29) | Yes | Correction: this was already done 3 weeks before this task was filed; missed by the initial research pass, which only checked migration 003. RSS: `.../80c4e557.../76a7de50.../podcast.rss` |
| The Favorites | **Yes** — already seeded, migration 029 (2026-06-29) | Yes | Same correction. Hosts: Chad Millman, Geoff Schwartz, Paul Lo Duca (multi-host). RSS: `.../f806745c.../012b8953.../podcast.rss` |

**Correction (2026-07-20):** all 6 shows already have a configured feed — Betting Pros and The Favorites were added in migration `029_podcast_feeds_update.sql`, three weeks before this task was even filed. The initial research pass checked only migration 003 (the original 4-feed seed) and missed 029. No new migration is needed; Phase 0 now just needs to confirm 029 actually ran against the live DB (folded into the coverage script below) rather than add rows that already exist. 3 of 6 shows are multi-host (Sharp or Square, Even Money, The Favorites) and need attribution; Warren Sharp and Action Network are effectively single-voice for this purpose.

## Phase 0 — Coverage & freshness — ✅ CLOSED 2026-07-20

Ran `npm run podcast-coverage` natively on Andy's machine (blocked in the sandbox by its network proxy). All 6 shows already caught up, 0 days behind each feed's own latest RSS item — no ingest catch-up needed:

| Show | Ingested through | Episodes |
|---|---|---|
| Action Network Sports Betting | 2026-07-17 | 62 |
| BettingPros Podcast | 2026-07-16 | 8 |
| Even Money | 2026-07-14 | 21 |
| Sharp Football Analysis | 2026-07-07 (feed's own last post) | 27 |
| Sharp or Square | 2026-07-16 | 37 |
| The Favorites | 2026-07-16 | 6 |

161 episodes total already sitting in `podcast_transcripts` with full transcript text — that's the real backlog size for Phase 2/3 backfill scope.

Original Phase 0 steps (kept for record):

1. ~~Get RSS feed URLs for Betting Pros and The Favorites~~ — done, see table above. **Correction:** both were already seeded in migration 029 — no new migration needed, just confirm live via the coverage script (step 3).
2. ~~Confirm Even Money = Ross Tucker's show~~ — confirmed 2026-07-20 (co-hosted with Steve Fezzick).
3. Build `scripts/podcast-coverage.js` — reports latest ingested `pub_date` per feed vs. that feed's actual RSS latest-published item, flags anything behind. (No such script exists today — freshness checks are currently ad hoc SQL.)
4. Run/trigger `podcast-ingest.js` (its GitHub Action) to catch all 6 shows up to current.
5. Re-run the coverage script — confirm all 6 shows at 0-days-behind before building summaries on top of stale data.

## Phase 1 — Model decision: GPT-4o now, Fable-5 later

**Recommendation: build v1 on the already-wired GPT-4o extraction path, not Fable-5.**

Reasoning:
- Fable-5 routing doesn't exist yet in `podcast-reextract.js` — `--model fable-5` is a documented-but-unbuilt flag, not a flag flip. Implementing it is its own scoped integration task.
- `podcast_reextractions` is already keyed `(episode_id, model)` specifically for non-destructive A/B comparison — a Fable-5 pass can be layered on later with zero rework once the new per-host schema is proven.
- The actual unknown here is the new extraction schema and per-host attribution, not the model. Better to validate that shape once, cheaply, on a model already wired in, than debug a new model integration and a new prompt schema simultaneously.

**Plan:** ship v1 on GPT-4o. Once Andy signs off on the per-host output format, schedule a follow-up session to add the Fable-5 branch and re-run it against the same already-processed episodes for a real side-by-side quality/cost comparison — exactly what the table schema was built for.

## Phase 2 — Build the pipeline

1. New extraction schema: per Future discussed → `{host, show, episode, prediction, confidence/lean, stats_or_history_cited, quote_or_paraphrase}`. Use a **new table** (`podcast_host_summaries`) rather than overloading `podcast_reextractions.intel`, which was shaped for picks/intel, not host-level attribution.
2. Attribution — ✅ BUILT 2026-07-20, revised from the original plan:

   **Finding:** `podcast_transcripts.transcript_text` is a single flat prose string (see `003_podcast.sql`) — no turn boundaries or speaker labels at all. The `show_hosts.json`/`speaker_map.py` scaffold needs diarized `{speaker, text, start, end}` segments as input, which nothing in the live cloud pipeline produced.

   **Decision (after Andy asked for real accuracy, not a guess):** rejected LLM-inferred attribution from flat text — the model would have to guess not just *who* but *where turns even change*, unreliable on banter-heavy multi-host shows. Rejected the full M6 WhisperX/pyannote pipeline as the starting point — GPU-bound, not close to deployed. Went with: turn on **AssemblyAI's built-in `speaker_labels`** (AssemblyAI is already a wired-in transcription provider) for real audio-based diarization, no new infra.

   **Built:**
   - `supabase/migrations/036_podcast_diarization.sql` — adds `podcast_feeds.needs_diarization` (true for Sharp or Square, Even Money, The Favorites only, later corrected) and `podcast_transcripts.speaker_segments` jsonb.
   - `agents/podcast-ingest.js` — `transcribeWithAssemblyAI()` now accepts `{diarize: true}`, requests `speaker_labels`, returns `{text, utterances}`; episodes from a `needs_diarization` feed always route through diarized AssemblyAI (bypassing the free Groq default, which can't diarize) and their utterances are stored.
   - `agents/lib/speaker-attribution.js` — JS port of `speaker_map.py`'s fuzzy-alias matching (same algorithm family, `fuzzball.partial_ratio` instead of `rapidfuzz`), reading hosts/aliases from `src/lib/experts.js` (the app's single source of truth) rather than duplicating the Python roster. Maps AssemblyAI's anonymous `A`/`B` labels to real host names via intro-window fuzzy matching, same logic Python already validated.
   - Sanity-checked against realistic intro-window text: exact self-introductions score 100 ("chad millman", "simon hunter", "ross tucker", "kendra middleton", "brandon kravitz" all 100); a real ASR misspelling ("fezzick" vs actual alias "fezzik") still scores 92, comfortably above the 80/82 threshold; a genuinely wrong name scores 40, correctly falls to "Guest" rather than a false match.
   - 24 unit tests (`tests/unit/speakerAttribution.test.js`) covering exact match, near-miss ASR tolerance, no-double-assignment, cross-show roster isolation, Guest fallback, and the labeled-transcript formatter.

   Warren Sharp (the only genuinely single-host show) skips all of this — the whole transcript is that one host, no diarization needed, stays on the free Groq path.

   **Correction 2026-07-20 (`037_podcast_diarization_fix.sql`):** the first pass above only flagged 3 shows. `src/lib/experts.js` (the app's own roster, already in the repo) documents BettingPros Podcast as a rotating 8-person roster and Action Network Sports Betting as a rotating 4+ analyst roster — neither is "single-voice." The Python `show_hosts.json` scaffold actually had this right from the start (tuning config for 5 shows, not 3); this was a miss in translating it, not a disagreement with the original design. **5 of 6 shows now need diarization — only Warren Sharp (Sharp Football Analysis) is genuinely single-host.** `speaker-attribution.js`'s `SHOW_CONFIG` and its tests were updated to match (26 tests now, all passing).

   **Cost note, revised:** diarization only applies to new episodes going forward. Backfill scope is now 134 already-ingested episodes (Sharp or Square 37 + Even Money 21 + The Favorites 6 + BettingPros 8 + Action Network 62), not 64 — roughly $50-75 one-time at AssemblyAI's ~$0.37/hr rate (rough order of magnitude, not a precise quote). Only Warren Sharp's 27 episodes need no diarization. Going forward, ongoing cost is meaningfully higher than the earlier $5-7/month estimate given Action Network's release cadence (62 episodes already on file) — closer to $15-25/month in-season, less in the offseason. Not done yet — a Phase 3/backfill decision.
3. ✅ BUILT 2026-07-20 — `agents/podcast-host-summary.js`, the main extraction agent:
   - Chunking extracted into a shared `agents/lib/chunk-text.js` (same 12k/1k-overlap behavior as `podcast-reextract.js`, which was refactored to import it too rather than keep a duplicate — now independently unit-tested, 7 tests).
   - Scope is deliberately **Futures only** (division/conference/Super Bowl/MVP/win totals, etc.) — not game-level picks, which stay in `podcast_transcripts.picks`/`podcast_reextractions`.
   - Single-host episodes: whole transcript, fixed host = `feed.expert`.
   - Multi-host episodes: builds a speaker-labeled transcript via `speaker-attribution.js`, prompts GPT-4o with the constrained list of known host names, and resolves each returned `host` field against that list case-insensitively — a hallucinated/unrecognized name is bucketed as `"Unclear"` rather than silently mis-attributed or dropped (`resolveHost()`).
   - Episodes from a `needs_diarization` show with no `speaker_segments` yet are skipped with an explicit reason, never guessed at (`planEpisodeProcessing()`).
   - Per-host dedupe via `mergeFutures()` (same higher-confidence-wins pattern as `podcast-reextract.js`'s `mergePicks`), capped at 40 futures/host/episode.
   - Non-destructive upsert into `podcast_host_summaries` keyed `(episode_id, host, model)`.
   - Vault note builder (`buildHostVaultNote()`) writes one note per (episode, host) to `NFL/Podcasts/<Show>/<Host>/<pub_date>-<slug>.md` — matches Andy's approved folder structure exactly.
   - 25 unit tests (`tests/unit/podcastHostSummary.test.js`) covering the attribution planner (single-host/multi-host/skip/unknown-show), host resolution, dedupe, tolerant JSON parsing, and vault note rendering (including a pipe-escaping regression check). 72 tests passing across the whole podcast pipeline (`speakerAttribution` + `chunkText` + `podcastCoverage` + `podcastHostSummary`).
   - NOT YET RUN LIVE — same sandbox network restriction as everything else this session (Supabase/OpenAI/Obsidian all unreachable here). First live run is Phase 3's dry-run step, next.
4. Vault note builder — done, see above (folded into step 3 rather than built separately).
5. ✅ DONE 2026-07-20 — Retired the `fable-5` stub. Updated `agents/podcast-reextract.js`'s header comment and `docs/PODCAST_REEXTRACTION_RUNBOOK.md`'s "deferred Fable pass" section (retitled, explains the supersession, points to this plan doc's Phase 4). Added a scope note near the top of the runbook clarifying it handles picks/intel while Futures live here. `podcast-reextract.js` itself is unchanged functionally — only docs/comments, since the fable-5 flag there was never wired to anything real.

## Phase 3 — Verify & wire in

1. Dry run against 1–2 recent episodes per show; review actual output with Andy before trusting it at scale.

   **2026-07-20 finding, changes this step:** none of the 161 already-ingested episodes have `speaker_segments` yet for the 5 multi-host shows — diarization only applies going forward (see Phase 2 step 2's cost note). A literal dry run today would report "skipped — needs diarization" for almost everything except Warren Sharp's single-host show, which has no attribution to test. Waiting for organic new episodes isn't reliable either — all 6 shows were freshly caught up as of this date, so there's no guarantee of fresh multi-host episodes by the next session.

   **Andy's decisions (2026-07-20):** (a) approved a small diarization pilot — 1-2 episodes per multi-host show (~5-10 episodes total, a few dollars via AssemblyAI, a small slice of the full $50-75 backfill estimate) — to get real attributed data to test against, rather than waiting; (b) review via real writes (`--no-vault`, skips Obsidian) rather than literal `--dry-run`, since dry-run only prints counts, not the actual extracted content — not enough to judge attribution/extraction quality.

   **Built:** `scripts/podcast-diarize-backfill.js` — re-transcribes already-ingested episodes via diarized AssemblyAI for the 5 multi-host shows, `--limit-per-show N` capped (default 2). Deliberately parameterized to double as Phase 3 step 3's full backfill script later (task 9) — same script, higher/no limit, once Andy approves that cost. Pure selection logic (`selectBackfillTargets`) extracted and unit-tested (13 tests) — respects the cap per show, skips episodes that already have `speaker_segments`, sorts newest-first, supports a `--show`/`--episode` override. Reused `agents/podcast-ingest.js`'s AssemblyAI submit/poll logic by extracting it into `agents/lib/assemblyai-transcribe.js` (byte-identical behavior, now imported by both scripts) rather than duplicating it.

   **M6 execution:** run overnight on M6 (Andy's call — likely to take a while: AssemblyAI transcription of several full episodes, then GPT-4o chunk extraction on top). This sandbox has no network route to M6, so commands are relayed for Andy to paste into an M6 SSH session, run detached (`nohup`), reviewed next session. Two-step run: (1) `podcast-diarize-backfill.js --limit-per-show 2` to backfill the pilot batch, (2) `podcast-host-summary.js --no-vault` (real DB writes to `podcast_host_summaries`, no Obsidian touch) against the newly-diarized episodes + Warren Sharp's already-usable single-host backlog.
2. Confirm Obsidian notes render and frontmatter validates. **Deferred until after the pilot review** — step 1's run intentionally skips vault writes (`--no-vault`) so Obsidian's Local REST API reachability (bound to Andy's Windows machine, not reachable from M6 by default) isn't a blocker for the pilot itself.
3. Backfill against the existing episode backlog once the format is approved — reuses `podcast-diarize-backfill.js` from step 1 with a higher `--limit-per-show` (or 0 for no cap) once Andy approves the full ~$50-75 cost.
4. Wire into the weekly ingest cron so new episodes get host-summaries automatically.
5. Feeds `nfl-futures-watchlist-2026-07` as originally scoped.

## Phase 4 — Deferred: Fable-5 comparison pass

Implement the `--model fable-5` branch, re-run it against the episode set GPT-4o already processed, compare quality/cost side by side, Andy decides whether Fable-5 becomes primary. Explicitly not a blocker for Phases 0–3.

## Open items needing Andy before Phase 0 can close

None remaining — both open items resolved 2026-07-20. Ready to start Phase 0 build work.
