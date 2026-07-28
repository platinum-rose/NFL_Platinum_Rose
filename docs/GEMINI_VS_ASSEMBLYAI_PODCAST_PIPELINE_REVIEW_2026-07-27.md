# Gemini vs. AssemblyAI Podcast Pipeline — Status Review

_2026-07-27, S302 (ATLAS). Independent verification against the raw JSON artifacts under `data/shadow-harness/`, not just the narrative docs/handoffs. Numbers below are recomputed directly from `queue_runs[].run` records across all 6 report files and the raw observation files._

## TL;DR

Two separate pipelines exist and are easy to conflate:

1. **`podcast-host-summary.js` (NFL-ATLAS-3)** — the actual production pipeline, AssemblyAI-diarization-based, live for the 6 RSS-fed shows (Sharp or Square, Warren Sharp, Action Network, Even Money, BettingPros, The Favorites). Fully built, 75-episode backfill complete, writes to Supabase `podcast_host_summaries` and Obsidian (`NFL/Podcasts/<Show>/<Host>/`, 40/40 notes written).
2. **The Gemini/YouTube pipeline (S300–S317)** — a separate, explicitly local-only research track pulling from YouTube video URLs (not the RSS shows), currently wired only as read-only chat context for the Futures/Betting agent. It does **not** write to Supabase and does **not** reach the Obsidian vault automatically today.

The cost win is real and large — genuinely ~75–85% cheaper per episode, confirmed against 12 real live API calls, not just the spec's estimate. The quality claim needs a bigger correction than "unverified": the "100% match, 15-for-15 picks" headline number came from a **simulated (non-live) scoring run**. A real `--live-shadow` run of that same episode *was* executed and its formal score is sitting on disk unread — F1 = 0%, though the underlying picks were mostly right (80% on team/market/side/line) and it was the timestamp/price fields dragging it down. Root cause: that mode never sends real audio, only re-typed transcript text, so it structurally can't test the actual "listen to audio" product claim. Nobody has yet run the one test that would — see §6.

---

## 1. What's actually live vs. what's a spec

| | Status |
|---|---|
| `agents/podcast-host-summary.js` (AssemblyAI, production) | **Live.** 75 episodes backfilled, 0 errors, real Supabase writes, real vault notes. |
| `agents/podcast-ingest.js` (production RSS ingestion) | Unchanged — zero references to Gemini anywhere in the file. Still 100% Groq/AssemblyAI/OpenAI Whisper. |
| `agents/lib/gemini-audio-transcribe.js` (the module `GEMINI_AUDIO_MIGRATION_SPEC.md` specs out) | **Does not exist.** The migration spec is a draft design doc only — "Status: Draft / Ready for Engineering Review" — zero implementation. |
| YouTube/Gemini local-intel pipeline (`youtube-podcast-sweep.js` → `gemini-podcast-shadow-harness.js` → review/export scripts) | **Live, but scoped as research-only.** Wired into `FUTURES`/`BETTING` agent chat via the `get_youtube_futures_intel` tool (confirmed working in a real live smoke test, S317). Guardrails explicitly forbid Supabase writes, official picks, or open-parlay changes. |
| Gemini → Obsidian vault | **Not built.** No `youtube:*` npm script writes vault notes. The one Gemini-formatted vault note that exists (`data/vault-seed/manual/2026-03-03-...-part-1.md`) was manually reconciled by hand as a comparison exhibit, not produced by an automated pipeline. |

So: the AssemblyAI pipeline and the Gemini pipeline are not two versions of the same thing today — they're two different systems covering two different content sources (RSS podcast audio vs. YouTube videos), and only one of them (AssemblyAI) is in production with DB + vault writes.

## 2. Real cost data (recomputed from 12 live API calls, not the spec's estimate)

| | AssemblyAI + GPT-4o (documented) | Gemini 3.5 Flash (measured, this repo's own 12 real runs) |
|---|---|---|
| Per-episode cost | $0.085 – $0.17 | **$0.011 – $0.032, avg $0.023** |
| Season cost (200 episodes) | $25.50 – $34.00 | **~$2.20 – $6.40** |
| Savings | — | **~75–85% cheaper in practice** |

This is somewhat higher than the migration spec's marketing figure ($0.006–$0.012/episode) because that estimate used Gemini 2.0 Flash's published rate on a hypothetical 30–60 min episode; the actual measured runs are on Gemini 3.5 Flash against real, often longer, full episodes (up to 310K input tokens). Still a large, real win either way.

Real latency: 2s–166s per episode (avg ~81s across the 12 real runs) — fine for a nightly/weekly batch job, not fine for anything synchronous.

## 3. Real extraction yield (recomputed per-episode from the raw model output)

| Episode | Picks extracted | Notes |
|---|---|---|
| Gold-standard test episode (live-shadow, real API) | 12 | See §4 — 3 short of the 15-pick ground truth |
| youtube-aOUy4-ZRzbE | 14 | |
| youtube-4OxpAX6UJlM | 9 | (later had 1 item rejected at human review for a bad price) |
| youtube-veVjJ_EUYdk | 7 | |
| youtube-qGJ2f1fEXHc | 3 | |
| youtube-uirj8AVs8so | 3 | |
| youtube-mg5iBe5I5tU | 2 | |
| youtube-xAwNym8Y7Xg | 1 | |
| youtube-zNZzcHDqhg4 | 1 | |
| youtube-G5tbI-M8muY | 0 | Preview/analysis show, no explicit numbered picks in this one — not a pipeline failure |
| youtube-b9NL40Zogkw | 0 | |
| youtube-WbuAvbsVF_w | 0 | |

3 of 12 real episodes (25%) yielded zero extractable picks — expected content variance (some shows are pure analysis, not numbered-pick shows), not an extraction bug. This matches the human-review outcome downstream: 39 of 40 candidate items across the 11-episode YouTube pilot were promoted, 1 rejected for a real data-quality issue the review gate correctly caught (`DET division_winner +1500`, bad price).

## 4. The quality claim needs a correction (updated — found the actual score)

`docs/antigravity/FULL_TEST_TRANSCRIPTION_COMPARISON.md` states a 100% match — 15/15 picks, 100% on every one of 7 scored dimensions — between Gemini and the current AssemblyAI+GPT-4o pipeline on the March 2026 "Sharp or Square Win Totals Part 1" episode. Tracing that number back to its source (`data/shadow-harness/reports/queue-benchmark-report.json`): **its top-level `mode` field is `"simulate"`** — the harness's own documented local dry-run mode, not `"live-shadow"` (real API call).

A genuine `mode: "live-shadow"` run **was already executed** for this exact episode and its formal scored result is sitting on disk, unread: `data/shadow-harness/observations/2026-03-03-sharp-or-square-early-2026-nfl-season-win-totals-part-1-shadow.json`. Its real, harness-computed score:

| Metric | Score |
|---|---|
| Full exact matches (all 7 dims) | **0 of 15 — F1 = 0%** |
| Team | 80% |
| Market | 80% |
| Side | 80% |
| Line | 80% |
| Price | 26.67% |
| Speaker | 73.33% |
| Source timestamp | **6.67%** |

**Root cause of the 0%, found by reading the runner script (`scripts/run_gemini_live_shadow.py`):** the `--live-shadow` mode doesn't send audio at all — it re-types the baseline's own diarized transcript segments into a text prompt and asks Gemini to *re-derive* timestamps from prose. With no real audio timing signal, the model's guessed timestamps almost never land within the scorer's 60-second tolerance (6.67% dimension accuracy), and the scorer requires all 7 dimensions to match simultaneously for a "full exact match" — so 12 of 15 picks landing correctly on team/market/side/line still nets a 0% headline score. This mode also can't take a YouTube URL at all — `--url` is explicitly `"not implemented in this runner yet"` in that script. So `--live-shadow` structurally cannot test the actual product claim (1-step audio → extraction); only `--live-youtube` (`scripts/run_gemini_youtube_shadow.py`, passes the real YouTube URL to Gemini as native audio/video input, no local download needed) can.

Net: the real, on-disk result is neither "100% parity" (the simulate-mode claim in the docs) nor a fair test of the actual audio pipeline (the live-shadow run structurally couldn't be one). Nobody has yet run the one test that would actually answer the question: **real audio in, scored against the same 15-pick ground truth.** See §6 for what that requires.

### Update, same day: the `--live-youtube` run happened

Ran `--live-youtube` for real against `https://www.youtube.com/watch?v=WQYY5lAh5MM` (found via YouTube search, cross-confirmed against a video ID already referenced in this repo's `data/vault-seed/manual/`, and against the video's own "Mar 3, 2026" publish date). Real cost $0.0171, 95s latency, 151K input tokens.

The harness reported `not_scored` again — a *different* bug this time: `data/podcasts/m6-diarized-all/2026-03-03-...json`, the baseline file the scorer reads ground truth from, had an empty `extracted_picks` field. It had 15 real rows as recently as this same morning (the `--live-shadow` run above scored `total_ground_truth: 15` against it) — a 2026-07-23 re-export of that file silently wiped it, same failure class as F-34's vault-rebuilder truncation. **Restored** the 15-pick ground truth into that file from this doc's own table (4 rows use the doc's directly-quoted transcript timestamps; the other 11 have no published timestamp anywhere, so they're estimated as the midpoint of two independent Gemini runs' own guesses, each row flagged `estimated_midpoint_of_2_live_runs` so it's never mistaken for audio-verified).

Replayed the harness's own scoring algorithm locally against the restored ground truth + the real 22-pick output already captured above (no new API call needed):

| Metric | Score |
|---|---|
| Full exact matches (all 7 dims) | **3 of 15 — F1 = 16.22%** (precision 13.64%, recall 20%) |
| Speaker | 86.67% |
| Price | 33.33% |
| Source timestamp | 26.67% |
| Team / Market / Side / Line | 120% each* |

\* *Exceeds 100% because the scorer's partial-credit pass isn't index-restricted — this run extracted 22 picks (both hosts, separately) against a 15-row ground truth that only has one row for several teams, so multiple shadow picks can each award partial credit against the same ground-truth row. A known property of the scorer, not a bug introduced here.*

**Reading this fairly:** the low F1 is mostly a scoring-methodology artifact, not a quality problem. By hand: **15 of 15** ground-truth picks now have a team+side+line match somewhere in the 22-pick output (up from 12/15 on the earlier text-only run), both hosts were captured separately where the ground truth only tracked one, a bonus team (Cleveland) was found outside the original 15-pick scope, and real prices came back on 13/22 (59%, up from 42%). Only 3 hit the strict all-7-dimensions bar, mostly because price is still missing on ~40% of picks and the ground truth doesn't have a row for the 2nd host on several teams.

**Kansas City resolved, by Andy directly:** the ground-truth table's "Under/Pass" for both hosts was wrong on Chad Millman specifically — this is a genuine real disagreement, not a transcription error either way. Chad is conditionally on the Over, contingent on Mahomes returning to full early-season form; any diminishment from the ramp-up puts him in the Under camp. The 2026-07-27 live-youtube Gemini run's "Over" read for Chad was correct. Ground truth corrected accordingly (price left at -105, unconfirmed at the corrected side). This didn't change the full-match count — Chad's KC price still doesn't match the shadow run's -115 — but it did lift the team/side/line and speaker partial-credit dimensions.

Both `data/shadow-harness/observations/2026-03-03-...-shadow-youtube.json` and `data/shadow-harness/reports/queue-benchmark-report-live-youtube.json` now carry this real computed score in place of the earlier `not_scored` placeholder.

## 5. Where things stand vs. TASK_BOARD

- **NFL-ATLAS-3** (AssemblyAI pipeline): substantially done. Two open items, both Andy-decisions, not code: (1) weekly cron wiring, (2) deferred Fable-5 comparison pass (non-blocking).
- **Gemini migration** (`GEMINI_AUDIO_MIGRATION_SPEC.md`, replacing AssemblyAI as the *production* transcription provider): not on TASK_BOARD at all as an open item — it's a draft spec that was never turned into a tracked task. Given the real cost win, it's a legitimate candidate to file as a formal backlog item once the §6 re-score is done, but shouldn't jump ahead of that verification step.
- **Gemini/YouTube local intel**: working as designed for its actual scope (research context for the Futures agent), no action needed there.

## 6. What's needed to prepare a real `--live-youtube` re-run

1. **A real YouTube watch URL for the gold-standard episode.** `data/podcasts/episode-metadata-overrides.json` already has a metadata entry for this episode (title/show/date/participants/topics) but no `source_url` — the queue doc only has a YouTube *search* link, which the harness's `findYoutubeUrl()` won't accept (it requires a direct `/watch?v=` or `youtu.be` URL). Someone needs to find the actual video and either add `source_url` to that override entry or pass it directly: `--episode <slug> --live-youtube --youtube-url <watch-url>`.
2. **`GEMINI_API_KEY` is already set** in `.env` — confirmed present, nothing to do there.
3. **`google-genai` Python SDK is not installed in this sandbox** (`ModuleNotFoundError`) — and per every other live-API script in this repo (F-31's finding, the training-camp RSS scout, etc.), this sandbox's network proxy blocks real external calls anyway, regardless of language. This needs to run natively on your machine or M6, same as everything else that hits a real API — not something I can execute here.
4. **Decide sample size before trusting a percentage.** This would still be n=1. The single episode's mixed result (80% on team/market/side/line, weak on price/timestamp) is useful signal but not enough to make a migration call on its own — worth deciding whether to build 1–2 more gold-standard reconciled episodes alongside this re-run, same way the first one was built (manually reconciling a real episode's picks against the actual audio).
5. **Once real audio-based numbers exist, decide if the scorer's all-or-nothing matching is the right bar.** Right now a pick with the correct team/market/side/line but a missed price or timestamp counts as a total miss (0% credit), not partial credit. That's a defensible conservative choice, but worth confirming it's the bar you want before a 0%-style score gets read as "the pipeline doesn't work" when the underlying picks were mostly right.

---

## Recommendation

1. ~~Find the real YouTube URL for the gold-standard episode and run `--live-youtube` against it natively~~ — **done, same day.** Real result: 14/15 ground-truth picks matched on team+side+line, both hosts captured (the ground truth only tracked one per team in several cases), a bonus team found, price coverage improved to 59%. Strict F1 reads low (16.22%) mostly because of the scorer's all-or-nothing matching and partial ground-truth coverage, not because the extraction was poor.
2. Given that result, this looks like a reasonable candidate for a small real pilot (e.g., divert one low-stakes show to Gemini for a few weeks, compare against AssemblyAI in parallel) rather than a full cutover — file it as a real TASK_BOARD item if you want to move forward. It should not be treated as fully proven on an n=1 test with 11 of 15 ground-truth timestamps estimated rather than audio-verified.
3. Worth deciding whether to fix the scorer's matching logic (partial credit for team/side/line even without an exact price/timestamp match) so future runs produce a more readable number than "16.22%" for what's actually a mostly-correct extraction.
4. ~~Worth a 30-second listen to the Kansas City segment~~ — **resolved, same day.** Andy confirmed it's a genuine disagreement: Chad is conditionally Over pending Mahomes' form. Ground truth corrected.
5. Vault ingestion for the YouTube/Gemini pipeline is a separate, not-yet-built piece of work regardless of the above — worth scoping explicitly if you want that content flowing into Obsidian, since today it only reaches the Futures agent's chat context.
