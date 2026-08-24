# Holistic Podcast Intel Extraction — Implementation Plan

_2026-07-27. Follows on from `docs/GEMINI_VS_ASSEMBLYAI_PODCAST_PIPELINE_REVIEW_2026-07-27.md`. Extends the Gemini shadow-harness pipeline (S300-S317) rather than the production AssemblyAI+GPT-4o pipeline, which stays Futures-only and untouched._

## Scope

The 12-episode Gemini `--live-youtube` bench run confirmed 3 of 12 episodes (25%) yielded zero extractable picks — expected, since some shows are pure analysis rather than numbered-pick shows (`youtube-G5tbI-M8muY`, `youtube-b9NL40Zogkw`, `youtube-WbuAvbsVF_w`). Today the extraction schema only has one shape to put things in: `extracted_picks`. A pure-analysis episode with no explicit pick produces nothing usable at all, even when the hosts spent 40 minutes on team evaluations, injury context, roster notes, or fantasy-relevant player commentary — exactly the kind of material Andy wants available to the Futures agent, the Betting/Props agents, Fantasy, and (eventually) survivor/pick'em.

Goal: extract **every bit of usable intelligence** from a podcast, not just explicit bets — tagged so any consumer (futures, weekly betting, props, fantasy, survivor/pick'em, general context) can pull the slice relevant to it, under the same human-review guardrail already governing picks.

**Scope expanded 2026-07-27 (Andy):** this now goes to production — Gemini becomes a real Supabase- and vault-writing extractor, not a local-only research pipeline. It lands as a **new sibling agent** alongside `agents/podcast-ingest.js`, not a modification of it (see Decisions 6-7). `agents/podcast-ingest.js`'s existing Groq/AssemblyAI/Whisper+GPT-4o loop is untouched and keeps running in parallel.

## Decisions (2026-07-27, Andy)

1. **Guardrail:** `analysis_notes` stays under the identical local-only, human-review-gated guardrail as `extracted_picks` — no looser treatment just because it's framed as "context." Locks in Phase 2.
2. **Survivor/pick'em: real follow-up build, not capture-only.** Andy's correction: during the season, these podcasts routinely declare explicit weekly survivor-pool and pick'em picks (a specific team, straight up, for a specific week) — this is real recurring pick-shaped data, not just qualitative commentary. That changes Phase 1: survivor/pick'em picks get their own `extracted_picks` market types (like any other pick), not just an `analysis_notes` tag (see Phase 1 step 4). The consuming feature itself (a survivor/pick'em pool tracker) is confirmed as a real, separate follow-up build — scoped as Phase 5 below, not designed in this plan.
3. **Fantasy:** read-only panel for now, confirmed — no full agent chat in this pass. Filterable by team and player name.
4. **`week` field:** applies broadly to `extracted_picks`, not just survivor/pick'em — also backfills the existing gap where `non_futures_betting` weekly picks have no week field today.
5. **Phase 4 re-validation:** re-run all 12 bench episodes (not just the 4-episode subset) for a complete before/after picture of `analysis_notes` yield.
6. **Wiring approach: new sibling agent.** A new script + new Supabase tables, keyed by `(episode_id, model)` — same non-destructive pattern as `podcast_reextractions` and `podcast_host_summaries`. `podcast-ingest.js`'s core loop is not modified. See Phase 5.
7. **Extraction engine: Gemini becomes production.** Andy accepted the accuracy caveats from the one real scored `--live-youtube` run as acceptable/improvable in place, rather than waiting for a longer validation track record. Production picks/notes now come from Gemini video extraction, not GPT-4o text extraction, for episodes with a resolvable YouTube URL.

**Cost correction (2026-07-27):** the $50-75 one-time / $15-25/month figures quoted during the wiring-approach discussion were **AssemblyAI diarization/transcription cost** (audio-to-text with speaker labels, needed for multi-host attribution in the GPT-4o pipeline) — not GPT-4o extraction itself, which is genuinely cheap (OpenAI's published GPT-4o pricing is $2.50/M input, $10/M output tokens; the base `podcast-ingest.js` extraction call is roughly $0.03/episode). Two corrections to the earlier framing: (1) GPT-4o was never free — "Groq" (the free-tier Whisper provider in `podcast-ingest.js`) is a cloud API with a free transcription quota, not a local LLM; (2) Gemini's real cost advantage isn't that GPT-4o extraction is expensive — it's that Gemini reads video directly and skips the separate paid audio-transcription step (AssemblyAI/Whisper) entirely. That's the actual saving.

## Current state (researched 2026-07-27)

- **Extraction schema** (`scripts/run_gemini_youtube_shadow.py::build_prompt`): `transcript_summary` (one 2-sentence string, discarded downstream — never read by the review script), `speaker_segments`, `extracted_picks`, `quote_timestamps`, `uncertainty_flags`. No field for analysis that isn't an explicit pick.
- **Lane classification** (`scripts/build-youtube-futures-intel-review.js::classifyPick`): every extracted pick gets exactly one lane — `futures_pick`, `non_futures_betting`, `injury_intel`, `training_camp_intel`, or `market_context` (catchall). This only runs over `extracted_picks`; there's nothing to classify on a zero-pick episode.
- **Review gate** (`data/shadow-harness/review/youtube-futures-intel-review-status.json`): human-editable, per-item status (`pending_review` → `promote_to_local_intel`/`reject`/`context_only`). Nothing auto-promotes. This is the pattern to extend, not replace.
- **Agent consumption** (`src/lib/agentTools.js`): `PODCAST_INTEL_TOOLS` (`search_podcast_picks`, `get_team_podcast_intel`, `get_weekly_consensus`, `get_futures_movement`, `get_player_prop_context`, `search_episode_vault_notes`, `get_youtube_futures_intel`) is shared by `agents/manifests/futures.manifest.json` and `agents/manifests/betting.manifest.json`. `agents/manifests/props.manifest.json` has **zero** references to any podcast/YouTube tool — a gap, even though `get_player_prop_context` already exists. `get_youtube_futures_intel` itself only reads `extracted_picks`-derived items and only filters by `lane: futures_pick | injury_intel | non_futures_betting`.
- **Fantasy**: `src/components/fantasy/FantasyValueBoard.jsx` has no agent chat and zero references to podcast intel or `agentTools.js` at all — it's a standalone data component today.
- **Survivor / pick'em**: no component, manifest, tool, or `TASK_BOARD.md` entry anywhere in the repo. Not a built feature today — the only hits for "survivor" in the whole codebase are podcast episode titles that happen to mention survivor-pool tips as a topic. Confirmed by Andy (2026-07-27) as a real gap worth closing: hosts declare explicit weekly survivor/pick'em picks in-season, so there's real recurring data to build against. Extraction starts now (Phase 1); the consuming feature is Phase 6, scoped separately once real in-season data exists.
- **Cost shape**: `--live-youtube` already sends the full video to Gemini regardless of how many picks come back (confirmed against the real run: $0.017/episode, ~151k input tokens, cost dominated by video input, not output). Adding a second output array to the same call is a marginal output-token cost increase, not a new API call.
- **YouTube URL resolution**: `findYoutubeUrl()` (`scripts/gemini-podcast-shadow-harness.js`) only matches against manually-entered `source_url` values in `data/podcasts/episode-metadata-overrides.json` — no automated per-episode resolution today. Real infra exists to build on: `scripts/youtube-account-discovery.js` + `scripts/lib/youtube-oauth.js` already do OAuth-based channel video listing via the YouTube Data API. Nothing currently connects that listing to `podcast_episodes` rows automatically — this is the real blocker to Gemini covering the full show roster, not a from-scratch build (see Phase 5 step 1).
- **Production picks/intel schema today** (`agents/podcast-ingest.js`'s `extractPicksAndIntel`): `picks` = `{selection, team1, team2, type: spread|moneyline|total, line, summary, units, confidence, game_date}`; `intel` = flat array of strings, no structure. Different field names and a narrower shape than the Gemini schema (`team/market/side/line/price/speaker/source_timestamp`) — the new production tables in Phase 5 use the Gemini shape, not this one, since Gemini becomes the extractor.
- **Vault write pattern** (`agents/podcast-host-summary.js`): `obsidianPut(notePath, markdown)` via Obsidian's Local REST API (`OBSIDIAN_API_URL`/`OBSIDIAN_API_KEY`), notes at `NFL/Podcasts/<Show>/<Host>/<pub_date>-<slug>.md`, `--no-vault`/`--vault-sync` flags for machines that can't reach Obsidian directly (e.g. M6). Phase 5 reuses this exact pattern rather than inventing a new one.
- **Promotion-gate precedent**: migration `005_pick_extraction.sql` added `podcast_transcripts.picks_promoted_at` specifically so a review/promotion step could gate what reaches `user_picks` — the exact "extract now, promote later" shape Phase 5's review gate needs, already proven elsewhere in this schema.

## Phase 1 — Expand the extraction schema

1. Add an `analysis_notes` array to the JSON contract in both `scripts/run_gemini_youtube_shadow.py::build_prompt` and `scripts/run_gemini_live_shadow.py::extract_with_gemini_text` (keep the two prompts in parity even though only the YouTube one is the live audio path — the text-mode one is still used for harness scoring dry-runs). Each note:
   ```json
   {
     "note_type": "team_evaluation | player_evaluation | injury_or_health | roster_or_depth_chart | coaching_or_scheme | matchup_analysis | schedule_context | fantasy_relevance | market_sentiment | other",
     "teams": ["KC"],
     "players": ["Patrick Mahomes"],
     "topic": "short label, e.g. 'Mahomes ramp-up concern'",
     "summary": "1-3 sentence paraphrase of what was actually said",
     "speaker": "Chad Millman",
     "source_timestamp": 570,
     "quote": "short verbatim quote supporting the note",
     "confidence": "stated | implied | speculative"
   }
   ```
2. Keep `extracted_picks` mostly as-is — additive, not a replacement. A single piece of commentary can produce both a pick (if a number was given) and a note (the reasoning behind it) — that's fine, they're not mutually exclusive.
3. Explicitly prompt the model to still populate `analysis_notes` on episodes that have zero `extracted_picks` — the current prompt has no fallback instruction for that case, which is likely part of why pure-analysis episodes come back empty-handed beyond the throwaway `transcript_summary`.
4. **Survivor/pick'em picks are picks, not notes** (per Andy's correction) — add two new `market` values to `extracted_picks`: `survivor_pick` and `pickem_pick`. `team` = the pick, `side` = null/unused (straight-up, no over/under), `price` = null (knockout-pool picks aren't priced bets).
5. Add a new optional field, `"week": 5` (nullable), to the `extracted_picks` schema **generally** — confirmed in scope for all week-scoped markets, not just survivor/pick'em. This also backfills the existing gap where `non_futures_betting` weekly spread/total picks have no week field today.

## Phase 2 — Expand lane classification and the review gate

1. Update `classifyPick` to route `market: survivor_pick | pickem_pick` to a new `survivor_pickem_pick` lane (pick-level, alongside the existing `futures_pick`/`non_futures_betting`).
2. In `scripts/build-youtube-futures-intel-review.js`, add a `classifyNote(note)` alongside the existing `classifyPick`, producing a **relevance_tags array** (not a single lane) since one note can matter to multiple consumers — e.g. "Bijan Robinson's role is expanding" is both `fantasy_intel` and `futures_context`. Proposed tag set, extending the existing lane vocabulary rather than replacing it:
   - `futures_pick`, `non_futures_betting`, `injury_intel`, `training_camp_intel`, `market_context`, `survivor_pickem_pick` (existing/pick-level, unchanged in shape)
   - `fantasy_intel` — player role/target-share/breakout/bust commentary
   - `matchup_analysis` — scheme/coaching/narrative confidence not tied to a number
   - `roster_transaction_intel` — depth chart, trades, coaching staff changes
   - `survivor_pickem_intel` — supporting commentary/reasoning around a survivor or pick'em call (the pick itself lives in `extracted_picks` as `market: survivor_pick | pickem_pick`, per the Phase 1 schema change; this tag covers the surrounding analysis, not the pick)
3. Extend `data/shadow-harness/review/youtube-futures-intel-review-status.json`'s item shape to cover notes (same `pending_review`/`promote_to_local_intel`/`reject`/`context_only` states, same guardrail language) so nothing new bypasses human review.
4. Extend the generated Markdown (`docs/antigravity/youtube-futures-intel-review-latest.md`) with a new `## Analysis & Context Notes` section, parallel to the existing `## Extracted Picks And Leans` table, so zero-pick episodes still produce a reviewable artifact instead of a blank entry.

## Phase 3 — Wire consumption into agents, Fantasy, and reports

1. **Futures/Betting** (already wired): extend `get_youtube_futures_intel`'s `lane` enum to accept the new relevance tags, update its tool description to mention notes as well as picks. Lowest-lift change — same tool, same manifest wiring, bigger filter vocabulary.
2. **Props**: add `get_youtube_futures_intel` (or a `lane`-filtered subset scoped to `fantasy_intel`/`matchup_analysis`) to `agents/manifests/props.manifest.json` — closes the existing gap where Props has no podcast intel access at all.
3. **Fantasy**: no agent chat exists today, and building one is out of scope for this plan. Minimal version: surface `fantasy_intel`-tagged notes as a read-only panel in `FantasyValueBoard.jsx`, filterable by team and by player name (confirmed), sourced from the same local JSON summary file already used by `get_youtube_futures_intel` — no new agent, no new manifest, just a new read path into an existing file.
4. **Survivor/pick'em**: capture `survivor_pick`/`pickem_pick` picks and `survivor_pickem_intel` notes now (cheap — same extraction pass), but do not build the consuming pool-tracker feature as part of this plan — that's Phase 6.
5. **Reports**: extend `scripts/build-youtube-futures-intel-review.js`'s summary counts (`item_lane_counts` → include note tags) so the weekly/automated report surfaces note volume by tag alongside pick volume, matching the existing reporting shape rather than inventing a new one.

## Phase 4 — Re-validate against real episodes

1. Re-run `--live-youtube` against all 12 bench episodes (confirmed — full before/after picture, not just the zero-pick subset) to see real `analysis_notes` yield across the whole set — no scoring harness exists for notes yet (the 7-dimension scorer is pick-shaped only), so this is a manual quality read with Andy, not an automated pass/fail.
2. Confirm cost stays in the pennies-per-episode range observed in the original bench (12 episodes × ~$0.017 ≈ $0.20 total, no reason to expect otherwise since it's the same API call with a larger response schema).

## Phase 5 — Production wiring: Supabase + vault via a new sibling agent

1. **Automate YouTube URL resolution.** Extend `scripts/youtube-account-discovery.js`'s channel-video listing (already OAuth-wired via `scripts/lib/youtube-oauth.js`) into a resolver that fuzzy-matches each `podcast_episodes` row against its show's channel video list by title/date — same matching logic `findYoutubeUrl()` already uses against manual overrides, just sourced from a real API listing instead of hand-entered JSON. Add a `podcast_episodes.youtube_url` column (nullable) to store confident matches. Episodes with no match fall back to the existing GPT-4o/AssemblyAI pipeline untouched — this is a hard dependency, not a nice-to-have, since Gemini cannot run at all without a real video URL.
2. **New agent**: `agents/podcast-gemini-intel.js` — a new sibling script (not a modification of `podcast-ingest.js`). Runs Gemini `--live-youtube` extraction (picks + `analysis_notes`, per Phase 1's expanded schema) against episodes with a resolved `youtube_url` and no existing row for `model = 'gemini-3.5-flash'` yet. Same non-destructive, `unique(episode_id, model)`-keyed pattern as `podcast_reextractions`/`podcast_host_summaries` — existing production data is untouched.
3. **New Supabase table**: `podcast_gemini_intel` — `id, episode_id (fk), model default 'gemini-3.5-flash', picks jsonb, analysis_notes jsonb, cost_usd, latency_ms, vault_path, promoted_at timestamptz default null, created_at, unique(episode_id, model)`. Same RLS shape as `podcast_reextractions`/`podcast_host_summaries` (public read, service_role write).
4. **Review gate becomes a real gate, not bookkeeping.** Today's `youtube-futures-intel-review-status.json` is local-only — nothing enforces it. In production: the new agent writes extracted data with `promoted_at = null`; a separate promotion step (Andy reviewing, or an explicit `--promote` script flipping status) sets `promoted_at`, reusing the exact `picks_promoted_at` convention from migration 005 rather than inventing a new one. Only `promoted_at IS NOT NULL` rows are vault-written or agent-tool-visible.
5. **Vault write**: reuse `obsidianPut()`/the note-builder pattern from `agents/podcast-host-summary.js`. Notes at `NFL/Podcasts/<Show>/<Host>/<pub_date>-<slug>-gemini-intel.md` — a distinct filename suffix from the existing GPT-4o note so both can coexist during the parallel-run period.
6. **Agent tool wiring**: switch `get_youtube_futures_intel` (`src/lib/agentTools.js`) from reading the local JSON snapshot to querying `podcast_gemini_intel` directly (same approach `search_podcast_picks` already uses against Supabase), filtered to `promoted_at IS NOT NULL`. Retire the tool description's "local-only, not Supabase-backed" caveat once this ships — it'll no longer be true.
7. **Guardrail language retirement**: the S300-S317 comments across `build-youtube-futures-intel-review.js`, the review status file, and `get_youtube_futures_intel`'s description explicitly say "does not promote official picks or write production recommendations." Update that language to describe the new promoted-via-review-gate flow instead of leaving stale guardrail text once it's no longer accurate — same treatment the Fable-5 stub got when it was formally retired in `PODCAST_HOST_SUMMARY_PIPELINE_PLAN.md`.
8. **Not decided here**: whether the existing GPT-4o/AssemblyAI production pipeline eventually gets retired once Gemini's production track record is proven. Deliberately deferred, same pattern as that plan's own deferred Fable-5 comparison pass — Gemini and GPT-4o run in parallel until there's real production data to compare.

## Phase 6 — Deferred: survivor/pick'em pool tracker (separate plan)

Confirmed as a real follow-up build, deferred until pre-season is over and the regular season is about to kick off (Andy, 2026-07-27). Once Phase 1-5 are live and real in-season `survivor_pick`/`pickem_pick` extraction data exists, write a dedicated plan doc (matching this convention) covering: pool data model (entries used, teams already burned in a survivor pool, weekly deadlines), a UI surface (new tab or folded into an existing one), and whether/how it becomes agent-consumable. Deliberately not designed now — better to design against real extracted data than a guess.

## Open items

None remaining — all scope decisions above confirmed by Andy 2026-07-27. Ready to start Phase 1 build work. Note the March 2026 bench episodes predate the season, so none of them will exercise the new `survivor_pick`/`pickem_pick` markets in Phase 4 — that only shows up once real in-season episodes are run, which also feeds Phase 6's design input.
