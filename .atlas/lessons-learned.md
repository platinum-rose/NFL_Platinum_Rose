# NFL_Dashboard — Lessons Learned

## S236 — 2026-06-29: M6 Python / pyannote dependency hell

### pyannote-audio 4.x PLDA gate
- `pyannote/speaker-diarization-3.1` AND `speaker-diarization-3.0` both pull PLDA weights
  from `pyannote/speaker-diarization-community-1` when loaded via pyannote-audio 4.x.
- `community-1` is allowlist-restricted — cannot be accessed by regular HF accounts.
- **Fix:** patch `speaker_diarization.py` to wrap `get_plda()` in try/except.
- Must re-apply after any venv rebuild (it's an in-place patch on the installed package).

### whisperX PyPI package is unusable on Ubuntu 26.04
- `whisperX==3.8.6` requires `pyannote-audio>=4.0.0` (community-1 PLDA issue).
- `whisperX==3.1.5` is a yanked unofficial release; its `faster-whisper==1.0.1` requires
  `av==11.*` which won't compile against FFmpeg 8 (Ubuntu 26.04 ships FFmpeg 8).
- **Fix:** don't install the `whisperx` PyPI package at all. Install `faster-whisper` +
  `pyannote.audio` directly — our custom `diarize.py` calls them without the whisperX wrapper.

### torch/torchaudio version pinning
- `torch==2.8.0` + `torchaudio==2.8.0` is the working combination with `pyannote.audio 4.0.6`.
- `torch==2.12.1` + `torchaudio==2.11.0` breaks pyannote.audio 3.x (removed `AudioMetaData`
  and `list_audio_backends` from torchaudio public API).
- Do NOT upgrade torch/torchaudio in `.venv-whisperx` without testing pyannote import.

### Python 3.12 on Ubuntu 26.04 (resolute)
- Ubuntu 26.04 ships Python 3.14 only. deadsnakes PPA provides 3.12 for resolute.
- Packages needed: `python3.12 python3.12-venv python3.12-dev`.
- deadsnakes note: they do NOT provide Python 3.14 for resolute (Ubuntu already ships it).

### HuggingFace CLI deprecation
- `huggingface-cli login` is deprecated on M6. Use `hf auth login` instead.
- Token type: fine-grained, read access to public gated repos. Named `m6-whisperx`.
- `token=True` in `Pipeline.from_pretrained()` uses the cached token automatically
  (replaces deprecated `use_auth_token=True`).

### torchcodec warning is harmless
- pyannote.audio 4.x warns about torchcodec on every import (FFmpeg shared lib mismatch).
- It falls back to soundfile for audio I/O. The warning can be suppressed with
  `warnings.filterwarnings('ignore', category=UserWarning, module='pyannote')` if noisy.

## S237 — 2026-06-30: pyannote 4.x pipeline API changes

### Pipeline.__call__ is a generator; result is in StopIteration.value
- In pyannote.audio 4.x, `Pipeline.__call__` is a generator function (supports progress hooks).
- The `Annotation` is the generator's **return value**, NOT a yielded item.
- `list(pipeline(...))` returns `[]`. Must capture via:
  ```python
  gen = pipeline(file)
  try:
      while True: next(gen)
  except StopIteration as e:
      annotation = e.value
  ```
- For-loop over generator leaves `annotation = None` if nothing is yielded.

### Pipeline returns DiarizeOutput, not Annotation directly
- `SpeakerDiarization.__call__` returns a `DiarizeOutput` dataclass, not a raw `Annotation`.
- Unwrap with: `annotation = diarize_output.speaker_diarization`
- Other fields: `.exclusive_speaker_diarization`, `.speaker_embeddings`

### Audio must be pre-loaded as dict; file paths fail without torchcodec/CUDA
- `Pipeline(audio_path_string)` calls `AudioDecoder(file["audio"])` internally.
- `AudioDecoder` is from torchcodec which requires CUDA runtime (`libnvrtc.so`).
- On CPU-only boxes: pass pre-loaded audio as `{"waveform": tensor, "sample_rate": int}`.
- Use stdlib `wave` + numpy to load (torchaudio also fails without soundfile/sox backend):
  ```python
  with wave.open(path, 'rb') as wf:
      sr, n_ch, raw = wf.getframerate(), wf.getnchannels(), wf.readframes(wf.getnframes())
  audio = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
  wfm = torch.from_numpy(audio).view(n_ch, -1)
  result = pipeline({"waveform": wfm, "sample_rate": sr})
  ```

### speaker-diarization-community-1 is separately gated
- `speaker-diarization-3.0` depends on `pyannote/speaker-diarization-community-1` at inference time.
- This is a separate gate from the 3.0 model gate — must accept terms at both HF pages.
- After accepting: pre-warm with `hf_hub_download('pyannote/speaker-diarization-community-1', 'xvec_transform.npz')`.
- `hf auth login --token $HF_TOKEN` (not deprecated `huggingface-cli`) persists token for pyannote.

### HF token double-prefix pitfall
- If `.env` already had `HF_TOKEN=` (empty) and you `echo 'HF_TOKEN=hf_xxx' >> .env`, grep returns the empty line first → token resolves as empty.
- If token was pasted with prefix already present in key name, result is `hf_hf_XXX` (invalid).
- Always verify with: `grep '^HF_TOKEN=' .env | tr -d '\r' | cut -d= -f2- | head -c 15`

### .git/index.lock owned by Windows; can't rm from Linux sandbox
- `.git/index.lock` created by Windows git process cannot be deleted from Linux (`Operation not permitted`).
- **Update 2026-07-26:** this is no longer a hard blocker. `rm` fails, but `mv .git/index.lock .git/index.lock.movedN` (and the same for `.git/HEAD.lock`) succeeds — rename works where unlink doesn't on this mount. Run that immediately before every `git add`/`git commit`/`git status` call from the sandbox; it clears the stale lock for that call. `git commit` may also print harmless `unable to unlink '.git/objects/.../tmp_obj_...'` warnings during this — the commit still succeeds (verify with `git log -1`). This let an entire multi-commit session (S302-S308, 9+ commits) run cleanly from the bash sandbox without needing PowerShell for any commit — only `git push` still needs to run natively (no GitHub credentials in the sandbox).

## S302-S308 — 2026-07-26: sandbox network limits, Supabase pagination, Yahoo API gating

### Supabase/PostgREST silently caps unfiltered queries at 1000 rows
- A `select()` with no `.limit()`/`.range()` and no narrowing filter returns at most 1000 rows —
  silently, with no error and no indication of truncation. `player_season_stats` had 2019 rows for
  one season/season_type; an unfiltered query returned exactly 1000, and those 1000 happened to be
  every position alphabetically before "QB" (C, CB, DB, DE, DL, DT, FB, FS, G, ILB, K, LB) —
  meaning a report joining against ADP by name got 0/200 matches for months and nobody noticed,
  because the pipeline "succeeded" and produced normal-looking output files with every row simply
  showing "no projection."
- **Fix/pattern:** any query expected to return >1000 rows needs either `.in('column', [...])` to
  narrow it below the cap, or real pagination via `.range()`. A suspiciously round result count
  (exactly 1000) is itself a signal to check for this.
- **Diagnosis technique:** a `{ count: 'exact', head: true }` query (no row payload, just a count)
  bypasses the 1000-row payload cap and reveals the true total — compare it against what the
  normal query actually returned.

### Sandbox network access to external APIs (Supabase, Yahoo) is intermittent, not just allowlisted
- Yahoo's Fantasy Sports API domain (`fantasysports.yahooapis.com`) is blocked outright by the
  sandbox's proxy allowlist (`403 blocked-by-allowlist`) — a hard, permanent block, same as GitHub
  push credentials being absent.
- Supabase (`*.supabase.co`) is *not* blocked, but is intermittently unreachable from the sandbox
  (`getaddrinfo EAI_AGAIN`) — worked fine earlier in a session, then failed on every retry for the
  rest of it, then presumably recovered later. Don't assume one successful Supabase call means the
  rest of the session will have reliable access.
- **Pattern:** for any write (or read that must succeed) against Supabase, have the user run the
  exact `node agents/...` command natively rather than retrying indefinitely from the sandbox —
  same escalation path as `git push`. A local throwaway diagnostic script
  (`node scripts/_diag_x.mjs`, deleted/renamed `.bak` after use) the user runs and pastes output
  back from is an effective way to inspect real database state when the sandbox can't reach it
  directly.

### Yahoo Fantasy Sports API access is now a gated approval process, not a checkbox
- As of 2026, Yahoo replaced the old self-serve "check Fantasy Sports under API Permissions" flow
  on an app's developer.yahoo.com page with a separate application form at
  `sports.yahoo.com/developer/access/` (usage-volume tier, App ID from the existing app, 1-2 week
  review). An app created before this change, with valid OAuth2 credentials and a completed
  interactive token handshake, still gets `401 additional_authorization_required` on the first
  real Fantasy API call until this separate approval clears. Don't assume "OAuth succeeded" means
  "API access works" for this API specifically.

### nflverse `fantasy_points`/`fantasy_points_ppr` only cover QB/RB/WR/TE
- Every kicker and defensive-position row in nflverse's seasonal stats CSV has
  `fantasy_points = fantasy_points_ppr = 0.0` — these columns are pre-computed for standard
  offensive skill positions only. Real FG/PAT data (kickers) and real tackle/sack/INT data
  (defense) exist in the same CSV under separate columns (`fg_made`, `def_sacks`,
  `def_interceptions`, etc.) but need their own scoring formula to become fantasy points — there
  is no single "standard" for IDP/kicker scoring the way PPR is standard for offense, so this
  needs per-league configurable weights (ideally sourced from Yahoo's league-settings API once
  access is approved), not a hardcoded default.

## S314 — 2026-07-28: Podcast intel verification pass (Gemini extraction pipeline)

### Two more distinct bugs found in `scripts/gemini-podcast-shadow-harness.js`'s `normalizeSide`, on top of the S304-era bare-`'N'`-token fix
- **Full-duration coverage gap:** the model can silently stop analyzing a long episode a fraction
  of the way through and return a normal-looking, validly-parsed JSON response as if it were
  complete — nothing in the original prompt told it the video's real runtime or forbade stopping
  early, and nothing downstream checked whether the last extracted timestamp was anywhere near the
  video's actual end. Found on 3 of 13 real episodes (confirmed live by Andy on one, corroborated
  by token-usage-vs-coverage analysis on the other two). **Fix:** `scripts/run_gemini_youtube_shadow.py`'s
  prompt now accepts an optional `--duration-seconds` and, when given, hard-requires the model to
  cover the full runtime and self-report a `coverage_check` object (`last_analyzed_timestamp`,
  `reached_end_of_video`); a new `assess_coverage()` cross-checks that self-report against the
  actual last-covered timestamp rather than trusting it blindly (catches the model claiming
  `reached_end_of_video: true` when the ratio says otherwise). All 3 affected episodes reprocessed
  2026-07-28 with 100% coverage confirmed both ways.
- **Null-side hard-lock:** a second, separate defect in the same file's `normalizeSide` —
  `if (!raw) return 'UNKNOWN';` short-circuited BEFORE the yesNoMarket UNKNOWN→YES resolution logic
  ever ran, so every null/missing side on a division_winner/mvp/etc. pick was permanently stuck as
  the literal string "UNKNOWN" instead of resolving to "YES". The two sibling copies
  (`scripts/youtube-podcast-sweep.js`, `scripts/build-youtube-futures-intel-review.js`) did NOT
  have this specific defect — only this one file did, which is exactly the "3 hand-mirrored
  copies drift independently" risk this project has hit before. 6 of 9 freshly-reprocessed picks
  on one episode were affected; fixed and re-derived from the already-stored raw Gemini response,
  no new API calls needed.
- **Practical note for reprocessing a single episode manually:** `--episode <slug>` becomes the
  literal output filename (`<slug>-shadow-youtube.json`) when the episode isn't already in
  `docs/antigravity/GEMINI_SHADOW_YOUTUBE_QUEUE.md`. Using the same placeholder slug (e.g.
  `--episode manual`) across multiple runs silently overwrites the previous run's output —
  always pass the real target slug (matching the existing `youtube-<video_id>` filename) per run.

### CLI redirection gotcha
- Never paste literal placeholder tokens like `<secs>` into a command meant for the user to run —
  PowerShell (and bash) both interpret a bare `<` as redirection and error out
  (`RedirectionNotSupported` in PowerShell). Use a plain word like `PUT_SECONDS_HERE` instead, or
  fill in a real example value.

### Human verification tracking
- Added a `human_verification` block (top-level, sibling to `run`) to shadow-harness observation
  files as the durable "Andy manually confirmed this against source audio" marker —
  `verified`/`verified_by`/`verified_date`/`method`/`result`/`known_caveat`/`do_not_reverify`.
  Applied so far (2026-07-28), 3 episodes fully verified accurate:
  - `2026-03-03-sharp-or-square-early-2026-nfl-season-win-totals-part-1` — all 22 picks confirmed;
    known ~4min timestamp-label drift from the 49ers pick onward doesn't affect pick content.
  - `2026-07-21-sharp-or-square-nfl-training-camp-questions-with-ben-solak-of-espn` — all 4 picks
    confirmed, no caveats.
  - `youtube-4OxpAX6UJlM` — all 9 picks confirmed, after the coverage/side/player-name fixes below.
  - 10 of 13 real episodes remain unverified.

### extracted_picks schema had no field for the individual player on player-specific markets
- The original schema only had `team` on a pick — fine for team-level markets (win_total,
  division_winner, etc.), but wrong for the twelve markets that are fundamentally about a person:
  `mvp`, `opoy`, `dpoy`, `oroy`, `droy`, `comeback_player_of_the_year`, and the six individual
  stat-leader/prop markets (`interceptions_leader`, `rushing_tds_leader`,
  `season_receiving_yards`, `season_passing_yards`, `season_passing_tds`, `season_rushing_tds`).
  Andy caught this twice: an MVP pick showing only "NE" instead of Drake Maye, and a
  `season_rushing_tds` pick on team "NYG" that was actually about QB Jaxson Dart specifically —
  the team code alone silently obscured which quarterback the pick was even about.
- **Fix:** `scripts/run_gemini_youtube_shadow.py`'s prompt now requires a `player` field
  (nullable, only populated for these 12 markets) with an explicit example in the schema.
  `gemini-podcast-shadow-harness.js::normalizePick` updated to carry it through (its sibling
  copies in `youtube-podcast-sweep.js` / `build-youtube-futures-intel-review.js` already used
  object-spread and needed no change). Existing data backfilled where the name was already
  present in that episode's own extracted data (rationale text or a cross-referenced
  analysis_notes entry) — 28 affected picks across 13 episodes, 16 backfilled, 12 explicitly
  flagged `player: null` with a `player_source` explanation rather than left silently blank.
  One backfill (`Joe Burrow`, CIN MVP pick) was itself a correction to a first pass that missed
  a name sitting directly in the rationale text — worth a second, careful read when doing this
  kind of manual backfill, not just a skim.
  Future sessions/tooling should treat `do_not_reverify: true` episodes as trusted and skip them
  in any future spot-check pass.

### YES/NO market picks displayed ambiguously ("IND make playoffs NO")
- Terse `{team} {market} {side}` concatenation reads confusingly for YES/NO markets — "IND make
  playoffs NO" is easy to misparse, even though the underlying data was correct (side:"NO" on
  make_playoffs genuinely means "predicted to miss"). Fixed the *display* only, in the narrative
  report's `pickLabel()`: YES/NO markets now render as a plain-English prediction ("IND predicted
  NOT to make the playoffs") via a per-market phrase map (`YES_NO_MARKET_PHRASING`). Not a data
  bug, purely a readability fix — worth remembering that "the data was right, the label was
  confusing" is a distinct failure mode from an actual extraction/normalization error, and the two
  need different fixes (don't "fix" a display problem by touching the underlying data).

### First confirmed likely-fabricated pick (not just mistimed)
- Andy could not locate a `TEN win_total OVER` pick (youtube-b9NL40Zogkw, listed at 32:25) anywhere
  in the source audio. Investigation went further than the earlier timestamp-drift finding: this
  episode's full `speaker_segments` transcript is complete and continuous end-to-end (confirmed via
  the same coverage-check machinery as the full-duration-coverage fix), and no segment anywhere in
  it mentions Tennessee or the Titans — the segments around that timestamp are a QB-rankings
  discussion (Lamar Jackson, then Matthew Stafford). The episode's other two picks (both Drake
  Maye) each have an exact corroborating quote in `quote_timestamps`; this one has none anywhere.
  Working theory: the model fabricated this pick outright rather than mis-timestamping something
  real that was actually said.
- **Handling:** added a `disputed` field to the pick itself in the observation file
  (`flagged_by`/`flagged_date`/`status`/`reason`/`action`) rather than deleting the pick — not
  proven false, only unsupported, so it stays visible with a loud warning instead of silently
  vanishing. Rendered as a bold red warning line under the pick in the narrative docx and a
  bright-red highlighted row in the xlsx (new `disputed_fill`, takes priority over the
  verified/yellow/orange fills). The episode's `human_verification.verified` is `"partial"` (not
  `true`/`do_not_reverify`) until this specific pick is resolved. This is a genuinely different
  category of problem from every other bug found in this project so far (side-normalization,
  coverage gaps, missing player names) — those were all systematic code defects with a clear fix;
  this is a single unsupported data point that may just need to stay flagged indefinitely.

### Verification status as of this entry
- 8 of 13 episodes fully verified (`do_not_reverify: true`): win-totals Part 1 (22/22 picks),
  Ben Solak training camp (4/4), BettingPros futures-draft (9/9, post-fixes), Top-10-QB-Rankings
  (2/3 confirmed + 1 rejected, see below), Even Money teaser episode (2/2), 14-Longshot-Futures
  (14/14), 9 Early Week 1 Best Bets (9/9, with a caveat), and the Dr. David Chao injury episode
  (0 real NFL picks — its 4 extracted items are all non-NFL World Cup picks, rejected as out of scope).
- 1 of 13 partially reviewed: Top 10 NFL Futures Bets (`youtube-veVjJ_EUYdk`) — Andy confirmed one
  player identity (LAC mvp = Justin Herbert) but explicitly declined to verify the rest of this
  episode's picks for accuracy ("I don't care too much about these markets"). Left unverified as a
  whole; not marked `do_not_reverify`.
- 4 of 13 episodes remain fully unverified: `youtube-WbuAvbsVF_w`, `youtube-aOUy4-ZRzbE`,
  `youtube-G5tbI-M8muY` (no picks, analysis-only), `youtube-zNZzcHDqhg4` (no picks, analysis-only).
- 9 Early Week 1 Best Bets caveat: the HOU moneyline pick's rationale calls C.J. Stroud a "second
  year" player; 2026 is actually his 3rd NFL season. This is the host's/model's own claim as
  extracted (matches the analysis_notes quote verbatim), not an extraction defect — left as-is with
  the caveat attached rather than silently corrected. All 9 picks otherwise confirmed accurate.
- Dr. David Chao episode: all 4 extracted "picks" are World Cup (Spain vs Argentina) soccer bets the
  hosts made as an aside; nothing in the extraction prompt at the time told the model to ignore
  non-NFL sports. Andy confirmed 2026-07-28 these are out of scope. Each now carries a `disputed`
  block (`status: "REJECTED — NON-NFL, OUT OF SCOPE"`, `resolved: true`) — same audit-trail pattern
  as the TEN pick, kept rather than deleted. Distinguished visually from the TEN-style rejection: the
  xlsx fill logic now checks `disputed.status` for "NON-NFL" and keeps the existing orange "wrong
  sport" color instead of switching to the bright-red "fabricated/inaccurate NFL pick" color, since
  the two failure modes mean different things to a reader skimming the sheet.
- The TEN win_total pick on Top-10-QB-Rankings (`youtube-b9NL40Zogkw`), previously flagged as
  UNVERIFIED/LIKELY HALLUCINATED, was upgraded 2026-07-28 to `disputed.status: "REJECTED — CONFIRMED
  INACCURATE"` with `resolved: true` after Andy listened and confirmed the pick did not happen. It
  stays in the dataset (never deleted) but is excluded from the episode's confirmed-pick count; the
  episode as a whole is now `human_verification.verified: true` since its other 2 picks were also
  confirmed. Report-rendering code (`pickBullet()` in the docx generator, and the xlsx dispute-note
  logic) was updated to show a red "❌ REJECTED" style for `disputed.resolved: true` picks, distinct
  from the amber "⚠" styling still used for an open/unresolved dispute.
- Second player-name backfill gap found and fixed 2026-07-28: the original patch pass (see above) only
  checked `rationale` text and `analysis_notes` for a player's name, never the model's own
  `speaker_segments` transcript. Andy caught 6 missed names by ear on the 14-Longshot-Futures episode
  (`youtube-qGJ2f1fEXHc`) that turned out to already be sitting in speaker_segments almost verbatim
  (e.g. "Brock Bowers at 80:1" matching a LV opoy pick priced at exactly +8000). Prompted a full re-scan
  of every remaining "(player not captured)" pick against speaker_segments across all 13 episodes,
  which recovered 5 more names on `youtube-veVjJ_EUYdk` (Justin Herbert, Brock Bowers, Josh Hines-Allen,
  Sonny Styles, Jacob Rodriguez). Of 28 total player-level-market picks across the dataset, 27 now have
  a name; the sole remaining gap (`youtube-veVjJ_EUYdk`, CLE oroy) has genuinely no name anywhere in the
  extracted data (rationale, notes, or transcript) and needs an actual audio listen.
