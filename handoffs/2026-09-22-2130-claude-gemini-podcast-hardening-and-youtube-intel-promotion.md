# Handoff: Gemini podcast pipeline hardening + first YouTube-intel promotion

**Date:** 2026-09-22 21:30 UTC (Tue Week 3, afternoon PT session)
**Author:** Claude (session continuing from the earlier same-day Gemini diarization fix)
**Branch:** `wip/yahoo-sync`
**Commits this session:** `53af810` (pushed). No further commits below — the
YouTube-intel work only touched Supabase rows + the local Obsidian vault, not
git-tracked files (see "Files touched" at the bottom for the one throwaway
scratch script left behind).

## Context

This continues the same-day Gemini-diarization fix
(`handoffs/2026-09-22-1900-claude-gemini-podcast-diarization-fix-handoff.md`).
After that fix shipped, three follow-on threads came up in the same session:
queue cleanup, a real production failure on the new Gemini path, and a
detour into the long-dormant YouTube/Gemini intel pipeline. All three are
closed out below.

## 1. Podcast queue cleanup (Supabase writes, both authorized live in-session)

- Marked 25 stale diarized-show episodes (Week 1/2, pre-fix backlog)
  `status = 'skipped_stale'` (mirrors the existing `skipped_non_nfl`
  convention) instead of deleting them. Kept exactly the 2 Week 3-relevant
  episodes in the active queue (BettingPros Ep. 1070, Sharp or Square's
  Week 2 reactions).
- On a later full `podcast-ingest.js` run, found 2 more stale `pending`
  episodes stuck since 9/10-9/11 in **Sharp Football Analysis** (a
  single-host, non-diarized show — missed by the first cleanup because that
  pass was scoped to `needs_diarization = true`). Marked those
  `skipped_stale` too:
  `65478f5e-5e55-484e-bd28-bd34ae93decb`, `75baec1d-b6ca-42e4-91f5-4cb11e3ad671`.
- **Open item:** the same staleness pattern could exist in other
  non-diarized feeds nobody has audited yet. Worth a one-time sweep of all
  `podcast_episodes` in `pending`/`error` older than `MAX_EPISODE_AGE_DAYS`
  across every feed, not just the two shows found by accident this session.

## 2. Gemini `generateContent` failure -> retry + cause logging (shipped, commit `53af810`)

Real production failure on Sharp or Square's Week 3 preview episode
(`04f9e092-cf6b-46bc-beea-2e028ce82c2e`, 88.6MB — the largest file the new
Gemini diarization path has handled): download and upload both succeeded,
but the `generateContent` call itself threw a bare `TypeError: fetch failed`
with no diagnosable cause, fell back to AssemblyAI (still balance-blocked
at the time), and errored out.

Root cause: Node's native `fetch()` collapses connection-level failures
(reset socket, DNS blip, TLS hiccup) into a generic `"fetch failed"`, with
the real reason in `err.cause` — which nothing in this codebase was
logging.

Fixed in `agents/lib/gemini-audio-transcribe.js` (one retry specifically
around the `generateContent` call, since it's the longest-running, most
network-exposed leg) and `agents/podcast-ingest.js` (log `err.cause`
alongside `err.message` in the Gemini-fallback warning). Pushed as
`53af810`.

**Verified fixed:** the episode retried successfully on a later run (no
code change needed beyond the retry/logging — the second attempt just
worked) and now shows `status = 'done'` with 14 picks / 22 intel bullets
extracted via `gemini-diarized+gemini-3.6-flash`.

**Open item:** same `err.message`-only logging pattern exists elsewhere in
`podcast-ingest.js` (grep `err.message` — several other catch blocks).
Not fixed this session, scope was kept to the one path that actually
failed. Worth a pass if more silent "fetch failed"s show up.

## 3. YouTube/Gemini intel pipeline (`agents/podcast-gemini-intel.js`) — first real end-to-end run + promotion

Andy asked to run the "Antigravity pipeline" against the YouTube upload of
Sharp or Square's Week 3 preview
(https://www.youtube.com/watch?v=Iv3_V5RDvEc). This is Antigravity's Phase 5
build from `docs/PODCAST_HOLISTIC_INTEL_EXTRACTION_PLAN.md` — a NEW sibling
agent to the main `podcast-ingest.js` pipeline, writing to its own
`podcast_gemini_intel` table, gated behind an explicit `--promote` step
before anything reaches the Obsidian vault. Confirmed this session that it
had **never been run in production before today** (0 rows in that table
prior to this session).

### What happened, in order

1. Set `podcast_episodes.youtube_url` on the episode above (was null — the
   script only picks up episodes with a resolved `youtube_url`; the
   separate resolver script `scripts/resolve-youtube-episode-urls.js` was
   never run against this episode, so this was a manual one-off).
2. `--dry-run --episode <id>` — clean, matched the episode, no writes.
3. Confirmed `google-genai` Python package was NOT installed on Andy's
   machine; he installed it (`pip install google-genai`).
4. Real run (no `--dry-run`): **9 picks, 5 analysis notes, $0.0438, 161s
   latency.** No download/upload round-trip needed — Gemini ingests the
   YouTube URL directly, unlike the audio path's 88.6MB download+upload.
5. `--review` — inspected the unpromoted row before touching the vault.
6. First `--promote` attempt (no `--no-vault`) failed on the Obsidian
   Local REST API write: `request to https://localhost:27124/... failed,
   reason:` — a swallowed/empty error (same silent-error pattern as #2
   above, but not fixed this session — this one's on Andy's local Obsidian
   setup, not our code). Isolated the failure by re-running with
   `--promote --episode <id> --no-vault`, which succeeded cleanly (Supabase
   write + host attribution both fine — Chad Millman / Simon Hunter
   resolved correctly against `src/lib/experts.js`), confirming the issue
   was purely Obsidian connectivity/config, not the pipeline logic.
7. To let Andy see the actual vault note content without needing Obsidian
   working yet, wrote a throwaway local-preview script (see "Files
   touched" below) that reuses the pipeline's exact
   `groupByHost`/`buildVaultNote` logic but writes to
   `scratch/vault-preview/` instead of calling Obsidian. Output reviewed —
   clean host attribution, correct market/team/side/line parsing, sensible
   injury/roster/coaching notes.
8. Reset `promoted_at` back to `null` on the `podcast_gemini_intel` row so
   the real `--promote` could pick it up again once Obsidian was fixed.
9. Andy got Obsidian's Local REST API working (root cause not diagnosed
   in this session — port/config issue, likely just needed the app open
   with the plugin enabled). Re-ran `--promote --episode <id>` for real:
   **succeeded, 2 vault notes written.** First-ever successful promotion
   from this pipeline. Verified `promoted_at` set and `vault_paths`
   populated in Supabase.

### Vault notes now live

- `NFL/Podcasts/sharp-or-square/chad-millman/2026-09-22-nfl-week-3-betting-preview-falcons-packers-chargers-bills-ra-gemini-intel.md`
- `NFL/Podcasts/sharp-or-square/simon-hunter/2026-09-22-nfl-week-3-betting-preview-falcons-packers-chargers-bills-ra-gemini-intel.md`

### Comparison vs. the existing audio-path extraction (same episode)

| | Audio path (production) | YouTube path (Antigravity) |
|---|---|---|
| Picks | 14 | 9 |
| Intel/notes | 22 bullets | 5 notes |
| Host attribution | **None** | **Yes** (Chad Millman / Simon Hunter, by name) |
| Structure | Flat `picks[]` + `intel[]` strings | Categorized (`non_futures_betting`, `market_context`, `injury_intel`, `roster_transaction_intel`) |
| Cost/latency | Not logged; involved 88.6MB download+upload, ~11 min run | $0.044, 161s, no download/upload |
| Coverage | Broad — nearly every Week 3 game mentioned | Narrow — this show's own official picks + supporting context |

**Takeaway:** the production audio pipeline has zero host attribution —
it can't say who said what. This YouTube pipeline solves exactly that,
cheaper and faster, at the cost of narrower coverage. Worth treating as a
real second leg of the pipeline, not just a shadow/experiment, **but it's
still a one-episode proof of concept** — nothing is automated, no
scheduled run touches it, and `scripts/resolve-youtube-episode-urls.js`
(which would populate `youtube_url` for other episodes automatically) has
never been run.

### Known gaps / open items

- **Pick-level confidence is empty** in the YouTube pipeline's output
  (notes get `stated`/`implied`, picks get nothing). Either the extraction
  schema doesn't request it or Gemini isn't populating it — not
  investigated further this session.
- **Obsidian Local REST API silent-error bug**: same `err.message`-only
  logging gap as the Gemini fetch issue in #2, this time in
  `agents/podcast-gemini-intel.js`'s `obsidianPut()` (via `node-fetch`'s
  `FetchError`). Not fixed — worth the same `err.cause` treatment if this
  bites again.
- **No automation**: this pipeline still requires (a) `youtube_url`
  manually resolved per episode, (b) `google-genai` installed locally
  (now done on Andy's machine), (c) manual `--promote` review per episode.
  Nothing wired into the scheduled GitHub Actions run. If this is worth
  keeping, next step would be deciding whether/how to fold
  `resolve-youtube-episode-urls.js` + this agent into the regular Tue-Fri
  cadence, or keep it manual/on-demand.
- **Not promoted-by-default**: `promoted_at` staying null until a human
  runs `--promote` is a deliberate, real review gate per the original
  design — worth preserving even if this becomes routine.

## Files touched this session (beyond commit `53af810`)

- `agents/podcast-episodes` (Supabase table, not a file): 27 rows total
  marked `skipped_stale` (25 diarized-backlog + 2 Sharp Football Analysis),
  1 row's `youtube_url` set.
- `podcast_gemini_intel` (Supabase table): 1 row written, promoted, with
  `vault_paths` populated.
- `scratch/preview-gemini-vault-note.mjs` — **throwaway, not committed,
  safe to delete.** Local-only vault-note preview script, used once to
  inspect output before Obsidian connectivity was fixed. Also produced
  `scratch/vault-preview/NFL/Podcasts/...` (also throwaway/uncommitted).
- Obsidian vault (outside this repo): 2 new notes, see paths above.

## Suggested next steps

1. Decide whether the YouTube/Gemini intel pipeline graduates from
   "manually proven once" to a real recurring step — if yes, wire
   `resolve-youtube-episode-urls.js` + `podcast-gemini-intel.js` into the
   cadence and decide on an auto-promote policy (or keep the human review
   gate).
2. Clean up `scratch/preview-gemini-vault-note.mjs` and
   `scratch/vault-preview/` once no longer needed for reference.
3. Consider a broader stale-episode sweep across all podcast feeds, not
   just the two shows found by accident this session.
4. If another Gemini/Obsidian "fetch failed"-with-no-cause error shows up,
   apply the same `err.cause` logging fix used in `53af810` to whichever
   catch block is closest to it.
