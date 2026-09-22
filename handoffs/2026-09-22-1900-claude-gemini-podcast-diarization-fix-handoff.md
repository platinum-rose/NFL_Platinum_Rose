# Handoff — 2026-09-22 19:00 UTC — Gemini native diarization replaces AssemblyAI-only path for multi-host podcasts

Repo `E:\dev\projects\NFL_Dashboard` · branch `wip/yahoo-sync` · Supabase `aambmuzfcojxqvbzhngp`.
Commit: `7fd19fa` (pushed).

## Problem

AssemblyAI's balance went negative on 2026-09-21. `agents/podcast-ingest.js` had a
Groq → AssemblyAI → OpenAI Whisper fallback chain for **single-host** shows, but the
5 **diarized** (multi-host) shows — Sharp or Square, Even Money, BettingPros Podcast,
The Athletic Football Show, Move the Sticks — were hard-wired to AssemblyAI only
(`speaker_labels` diarization isn't available on Groq/Whisper), with **no fallback at
all**. Every Week 3 episode for those 5 shows was erroring:
`AssemblyAI submit failed: {"error": "Your current account balance is negative..."}`.

Andy asked why there was no fallback here, since one exists for single-host shows.
While investigating I also checked `agents/podcast-gemini-intel.js` (a separate,
already-built-but-dormant YouTube-based Gemini pipeline from
`docs/archive/PODCAST_HOLISTIC_INTEL_EXTRACTION_PLAN.md`) — it never went to
production (0 rows in `podcast_gemini_intel`, not wired into any workflow), targets
YouTube URLs only, and doesn't fix this. Andy chose a targeted fix over the full
`docs/antigravity/GEMINI_AUDIO_MIGRATION_SPEC.md` migration (which would also
replace Groq for single-host shows and skip the text-extraction pass) — see the
scoping discussion in this session's transcript.

## Fix

**`agents/lib/gemini-audio-transcribe.js` (new, 266 lines).** Downloads the full
episode audio (no `MAX_AUDIO_BYTES` truncation — that's a Whisper-size limit and
would cut off the back half of exactly the long shows this exists for), uploads to
Gemini's File API (resumable upload), waits for `ACTIVE` state, then requests a
diarized transcript via `generateContent` with a JSON schema:
`{"utterances": [{"speaker": "A", "text": "...", "start": 0.0, "end": 4.2}, ...]}`.
Speaker labels are anonymous (`A`, `B`, ...) in order of first appearance — same
convention AssemblyAI uses — so `agents/lib/speaker-attribution.js` (fuzzy-matches
labels to real host names) needed **zero changes**.

Return shape is drop-in compatible with `transcribeWithAssemblyAI(url, {diarize:true})`:
`{ text, utterances: [{speaker, text, start, end}] }`.

**`agents/podcast-ingest.js`.** The diarized branch (`feed.needs_diarization === true`)
now tries Gemini first; falls back to AssemblyAI only if Gemini throws or
`GEMINI_API_KEY` isn't set. `GEMINI_API_KEY` was already a repo secret (used for text
extraction) — no new secret needed for CI.

**`.github/workflows/podcast-ingest.yml`.** Comment-only update (env var now serves
two purposes).

## Verification

Could not test from either the sandboxed device shell or the cloud container — both
sit behind network allowlists that block `generativelanguage.googleapis.com` and the
podcast CDN hosts (confirmed via direct curl/proxy-status checks). Andy ran it
himself in his own terminal on the real machine:

```
PS E:\dev\projects\NFL_Dashboard> node agents/podcast-ingest.js
```

Result: picked up 1 of 11 eligible episodes (`Even Money` — "2026 NFL Week 3 Bets",
34.6 MB, ~29 min) automatically via the existing `status IN ('pending','error')`
retry logic. Gemini diarization succeeded — 71 diarized turns, 4,591 words — and the
existing extraction chain (unchanged) pulled 14 picks + 8 intel items via
`gemini-3.6-flash`. Zero errors on this run. Total wall-clock reported was 7186s but
that included Andy stepping away mid-run; the actual back-to-back generation step
finished well within the code's 600s timeout.

**Not yet verified:** the other 4 diarized shows, and true unattended processing
time for a full `MAX_PER_RUN` batch back-to-back (only 1 episode ran before the
10-min `MAX_RUNTIME_MINUTES` soft budget stopped a second one from starting — this
is expected/correct behavior, not a bug, but means the next several diarized
episodes are still queued for the next run).

## Open items / needs Andy

1. Let the next scheduled/manual `podcast-ingest` run process the remaining queued
   diarized episodes (Sharp or Square, BettingPros, The Athletic Football Show,
   Move the Sticks are all still `status='error'` and will retry automatically).
2. AssemblyAI top-up is no longer blocking — only needed to restore the fallback
   path. No urgency.
3. Watch actual GitHub Actions run time once this runs in CI (cron: Tue-Fri 08:30
   UTC) — the workflow's `timeout-minutes: 95` was sized around AssemblyAI's ~25-min
   poll ceiling per episode; if Gemini episodes are meaningfully slower than that in
   practice, `MAX_PER_RUN` or the workflow timeout may need adjusting. One data
   point (this test) isn't enough to size that yet.
4. `docs/antigravity/GEMINI_AUDIO_MIGRATION_SPEC.md` (full migration, incl.
   single-host shows) remains unbuilt and out of scope for this fix.
