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
