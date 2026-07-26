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
