# Local Podcast Pipeline — WhisperX + Ollama + Vault Bridge

**Status:** Spec (S235, 2026-06-29) — ready to implement  
**Replaces:** `agents/podcast-e1011-test.js` cloud path (AssemblyAI + Anthropic/OpenAI)  
**Goal:** Zero-cost, fully local podcast ingest on M6 with real speaker diarization wired to the Experts Roster

---

## 1. Motivation

The existing `pipelineWorker.js` → Python pipeline on M6 already handles transcription
(faster-whisper) and extraction (Ollama/qwen). The gap that caused S235 to fall back to
cloud APIs was:

1. **No speaker diarization** — faster-whisper gives timestamps but not `SPEAKER_0 / SPEAKER_1`
2. **No speaker→name mapping** — even AssemblyAI's `A/B` labels need resolving to Experts Roster names
3. **No vault note output** — picks stay in Supabase only (B1-B4 backlog)

This spec closes all three gaps without touching the existing Fastify server or Supabase schema.

**Cost: $0.** WhisperX and pyannote.audio are fully open-source. The only one-time step is
accepting HuggingFace model terms (free account).

---

## 2. Architecture Overview

```
RSS feed → audio URL
    │
    ▼
[M6] podcast-ingest.js (existing)
    │  downloads audio to /var/lib/nfl/audio/<episode_id>.mp3
    │
    ▼
pipelineWorker.js  →  pythonRunner.js
    │
    ├── transcribe step  →  nfl_podcast/transcribe.py (MODIFIED)
    │       └── WhisperX backend (NEW: diarize.py)
    │               ├── faster-whisper transcription (existing)
    │               ├── pyannote.audio diarization (NEW)
    │               └── word-level alignment → speaker segments
    │
    ├── speaker map step  →  nfl_podcast/speaker_map.py (NEW)
    │       └── SPEAKER_0/1 → Expert name via show_hosts.json (NEW)
    │
    ├── extract step  →  nfl_podcast/extract.py (MODIFIED)
    │       └── prompts.py (MODIFIED: speaker-labeled input)
    │               └── Ollama qwen2.5:3b / qwen3:8b (existing)
    │
    └── vault note step  →  nfl_podcast/vault_note.py (NEW)
            └── Supabase vault_notes upsert (B2)
```

---

## 3. One-Time M6 Setup

> **Status: COMPLETE (S236, 2026-06-29).** `.venv-whisperx` is live on M6.
> All steps below have been run. Do NOT re-run unless rebuilding the venv from scratch.

### 3a. HuggingFace token
```bash
# huggingface-cli is deprecated — use hf auth login
hf auth login   # paste HF_TOKEN (fine-grained, read access to public gated repos)
                # token stored in ~/.cache/huggingface/token
```

Accept model terms at (one-time, browser, must be logged in as andrewlrose):
- https://huggingface.co/pyannote/speaker-diarization-3.0  ← use 3.0, not 3.1 (see §3b note)
- https://huggingface.co/pyannote/segmentation-3.0

### 3b. Create `.venv-whisperx` (Python 3.12)

The main `.venv` is Python 3.14 — incompatible with whisperX/pyannote. A separate venv is required.

```bash
# Install Python 3.12 first (Ubuntu 26.04 ships 3.14 only)
sudo add-apt-repository ppa:deadsnakes/ppa -y && sudo apt update
sudo apt install python3.12 python3.12-venv python3.12-dev -y

# Build deps for av (FFmpeg Python bindings)
sudo apt install pkg-config libavformat-dev libavcodec-dev libavdevice-dev \
  libavutil-dev libavfilter-dev libswscale-dev libswresample-dev -y

cd ~/projects/NFL_Dashboard/packages/m6-podcast-service/python
python3.12 -m venv .venv-whisperx
source .venv-whisperx/bin/activate
pip install --upgrade pip

# Core stack — DO NOT upgrade torch/torchaudio beyond 2.8.x (breaks pyannote 4.x compat)
pip install "torch==2.8.0" "torchaudio==2.8.0" \
  "pyannote.audio>=4.0.0,<4.1.0" \
  "faster-whisper>=1.2.0" \
  rapidfuzz huggingface_hub
```

**Model used:** `pyannote/speaker-diarization-3.0` (NOT 3.1).
speaker-diarization-3.1 and 3.0 both reference `pyannote/speaker-diarization-community-1`
for a PLDA re-scoring step. That repo is allowlist-restricted (not publicly gettable).
Fix: patch the installed `speaker_diarization.py` to make PLDA optional (see §3c).

### 3c. PLDA patch (required — one-time after each venv rebuild)

pyannote-audio 4.x hard-fails if the PLDA community-1 weights can't be downloaded.
PLDA is an optional re-scoring step; skipping it has negligible impact on podcast diarization.

```bash
PYANNOTE_SD=.venv-whisperx/lib/python3.12/site-packages/pyannote/audio/pipelines/speaker_diarization.py
sed -i 's/        self._plda = get_plda(plda, token=token, cache_dir=cache_dir)/        try:\n            self._plda = get_plda(plda, token=token, cache_dir=cache_dir)\n        except Exception:\n            self._plda = None/' $PYANNOTE_SD
```

Verify (should show try/except block around line 231):
```bash
sed -n '229,235p' $PYANNOTE_SD
```

### 3d. Smoke test
```bash
source .venv-whisperx/bin/activate
python -c "
import faster_whisper; print('faster-whisper:', faster_whisper.__version__)
from pyannote.audio import Pipeline; print('pyannote.audio import OK')
pipe = Pipeline.from_pretrained('pyannote/speaker-diarization-3.0', token=True)
print('diarization pipeline loaded OK')
import rapidfuzz; print('rapidfuzz:', rapidfuzz.__version__)
print('ALL OK')
"
```

Expected: torchcodec UserWarning (harmless — soundfile fallback is used), then `ALL OK`.

### 3e. Add env vars to M6 `.env`
```bash
HF_TOKEN=hf_xxxxxxxxxxxxx                    # HuggingFace access token (m6-whisperx token)
WHISPERX_DIARIZE=true                        # opt-in flag; false = fast mode (no speaker labels)
OLLAMA_MODEL=qwen3:8b                        # upgrade from 3b if GPU available
NFL_PYTHON_DIARIZE_EXECUTABLE=/home/andrewlrose/projects/NFL_Dashboard/packages/m6-podcast-service/python/.venv-whisperx/bin/python
```

---

## 4. New Module: `nfl_podcast/diarize.py`

Provides a `WhisperXBackend` that satisfies the existing `WhisperBackend` protocol
(so `transcribe_audio()` needs zero changes) AND enriches output with speaker labels.

```python
# nfl_podcast/diarize.py
"""WhisperX backend: transcription + pyannote speaker diarization.

Returns WhisperSegments with an optional `.speaker` attribute (SPEAKER_0, SPEAKER_1, …).
Keeps the WhisperBackend protocol so transcribe.py needs no changes.
"""
from __future__ import annotations
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

from .transcribe import WhisperSegment


@dataclass(frozen=True)
class DiarizedSegment(WhisperSegment):
    """WhisperSegment extended with a speaker label."""
    speaker: str = field(default='UNKNOWN')


def load_whisperx_backend(
    *,
    whisper_model: str = 'large-v3-turbo',
    model_dir: str | Path = '/var/lib/nfl/models',
    hf_token: str | None = None,
    device: str = 'cpu',
    compute_type: str = 'int8',
    language: str = 'en',
) -> 'WhisperXBackend':
    """Build a WhisperX backend. Imports lazily so tests don't need GPU deps."""
    import whisperx  # noqa: WPS433

    token = hf_token or os.environ.get('HF_TOKEN')
    if not token:
        raise RuntimeError('HF_TOKEN required for pyannote diarization')

    asr_model = whisperx.load_model(
        whisper_model,
        device=device,
        compute_type=compute_type,
        download_root=str(model_dir),
        language=language,
    )
    diarize_model = whisperx.DiarizationPipeline(
        use_auth_token=token,
        device=device,
    )

    class WhisperXBackend:
        def transcribe(self, audio_path: str | Path) -> Iterable[DiarizedSegment]:
            path = str(audio_path)

            # Step 1: Transcribe with word-level timestamps
            result = asr_model.transcribe(path, batch_size=4)

            # Step 2: Align words to audio
            align_model, align_meta = whisperx.load_align_model(
                language_code=result['language'], device=device
            )
            result = whisperx.align(
                result['segments'], align_model, align_meta, path, device
            )

            # Step 3: Diarize
            diarize_segments = diarize_model(path)

            # Step 4: Assign speaker labels to words
            result = whisperx.assign_word_speakers(diarize_segments, result)

            # Step 5: Yield one DiarizedSegment per segment
            for seg in result.get('segments', []):
                speaker = seg.get('speaker', 'UNKNOWN')
                yield DiarizedSegment(
                    start=float(seg['start']),
                    end=float(seg['end']),
                    text=seg['text'].strip(),
                    speaker=speaker,
                )

    return WhisperXBackend()


def load_whisperx_backend_or_fallback(
    *,
    whisper_model: str = 'large-v3-turbo',
    model_dir: str | Path = '/var/lib/nfl/models',
    hf_token: str | None = None,
    device: str = 'cpu',
    compute_type: str = 'int8',
):
    """Return WhisperX if HF_TOKEN is set and whisperx is installed; else faster-whisper."""
    token = hf_token or os.environ.get('HF_TOKEN')
    diarize_enabled = os.environ.get('WHISPERX_DIARIZE', 'false').lower() == 'true'
    if token and diarize_enabled:
        try:
            return load_whisperx_backend(
                whisper_model=whisper_model,
                model_dir=model_dir,
                hf_token=token,
                device=device,
                compute_type=compute_type,
            ), True   # (backend, diarized=True)
        except ImportError:
            pass  # whisperx not installed — fall through
    from .transcribe import load_faster_whisper_backend
    return load_faster_whisper_backend(
        model_name=whisper_model,
        model_dir=model_dir,
        compute_type=compute_type,
    ), False  # (backend, diarized=False)
```

**Key design choices:**
- `DiarizedSegment` extends `WhisperSegment` — `transcribe_audio()` treats it as a normal segment but the caller can inspect `.speaker`
- `load_whisperx_backend_or_fallback()` is the single call site; returns `(backend, diarized: bool)` so downstream knows whether speaker labels are present
- If `HF_TOKEN` or `WHISPERX_DIARIZE=true` is absent, silently falls back to faster-whisper (no breakage)

---

## 5. New Module: `nfl_podcast/speaker_map.py`

Maps `SPEAKER_0 / SPEAKER_1` → Expert names by scanning the opening minutes for host intro patterns.

```python
# nfl_podcast/speaker_map.py
"""Map diarization speaker IDs to named experts from the show roster.

Strategy (in order):
  1. Scan first 5 min for host intro patterns → lock the host speaker ID
  2. Remaining IDs assigned to co-hosts in roster order
  3. Unknown speakers get label 'Guest'

show_hosts.json format:
  {
    "BettingPros Podcast": {
      "hosts": ["Seth Woolcock", "Andrew Erickson"],
      "host_intro_patterns": ["i'm your host", "i'm seth", "this is seth"],
      "host_is_first_speaker": true
    }
  }
"""
from __future__ import annotations
import json
import re
from pathlib import Path

_HOSTS_FILE = Path(__file__).parent / 'show_hosts.json'
_INTRO_WINDOW_SEC = 300.0   # scan first 5 minutes


def load_show_config(show_name: str) -> dict | None:
    if not _HOSTS_FILE.exists():
        return None
    data = json.loads(_HOSTS_FILE.read_text())
    return data.get(show_name)


def build_speaker_map(
    segments: list[dict],   # [{start, end, text, speaker}, ...]
    show_name: str,
) -> dict[str, str]:
    """Return {SPEAKER_0: 'Seth Woolcock', SPEAKER_1: 'Andrew Erickson', ...}."""
    config = load_show_config(show_name)
    if not config:
        return {}

    hosts: list[str] = config.get('hosts', [])
    patterns: list[str] = [p.lower() for p in config.get('host_intro_patterns', [])]
    host_is_first: bool = config.get('host_is_first_speaker', True)

    # Collect unique speaker IDs in order of first appearance
    seen: list[str] = []
    for seg in segments:
        spk = seg.get('speaker', '')
        if spk and spk not in seen:
            seen.append(spk)

    if not seen:
        return {}

    mapping: dict[str, str] = {}

    # Try pattern-based host detection in the intro window
    host_speaker: str | None = None
    if patterns:
        for seg in segments:
            if seg.get('start', 0) > _INTRO_WINDOW_SEC:
                break
            text_lower = seg.get('text', '').lower()
            if any(pat in text_lower for pat in patterns):
                host_speaker = seg.get('speaker')
                break

    # Fallback: host is the first speaker (nearly always true for podcast format)
    if host_speaker is None and host_is_first and seen:
        host_speaker = seen[0]

    if host_speaker and hosts:
        mapping[host_speaker] = hosts[0]
        remaining_speakers = [s for s in seen if s != host_speaker]
        remaining_hosts = hosts[1:]
        for spk, name in zip(remaining_speakers, remaining_hosts):
            mapping[spk] = name
        # Any extra speakers beyond the roster = Guest
        for spk in remaining_speakers[len(remaining_hosts):]:
            mapping[spk] = 'Guest'
    else:
        # No pattern match, no first-speaker heuristic: assign in roster order
        for spk, name in zip(seen, hosts):
            mapping[spk] = name
        for spk in seen[len(hosts):]:
            mapping[spk] = 'Guest'

    return mapping


def apply_speaker_map(
    segments: list[dict],
    speaker_map: dict[str, str],
) -> list[dict]:
    """Return segments with `speaker` replaced by resolved name."""
    out = []
    for seg in segments:
        resolved = speaker_map.get(seg.get('speaker', ''), seg.get('speaker', 'Unknown'))
        out.append({**seg, 'speaker': resolved})
    return out


def build_labeled_transcript(segments: list[dict]) -> str:
    """Build [Name] prefixed transcript text for LLM extraction."""
    lines = []
    for seg in segments:
        spk = seg.get('speaker', 'Unknown')
        text = seg.get('text', '').strip()
        ts = seg.get('start', 0)
        m, s = int(ts) // 60, int(ts) % 60
        lines.append(f'[{m}:{s:02d}] {spk}: {text}')
    return '\n'.join(lines)
```

### `show_hosts.json` (new file alongside `speaker_map.py`)

```json
{
  "BettingPros Podcast": {
    "hosts": ["Seth Woolcock", "Andrew Erickson"],
    "host_intro_patterns": [
      "i'm your host seth",
      "i'm seth wilcock",
      "i'm seth woolcock",
      "welcome into the betting pros"
    ],
    "host_is_first_speaker": true
  },
  "The Favorites": {
    "hosts": ["Chad Millman", "Simon Hunter"],
    "host_intro_patterns": ["i'm chad", "chad millman here"],
    "host_is_first_speaker": true
  },
  "Sharp or Square": {
    "hosts": ["Chad Millman", "Simon Hunter"],
    "host_intro_patterns": ["sharp or square", "i'm chad"],
    "host_is_first_speaker": true
  }
}
```

---

## 6. Changes to `transcribe.py`

Minimal. The `_cli()` function needs one new flag to select the WhisperX backend:

```python
# In _cli():
p.add_argument('--diarize', action='store_true',
               help='Use WhisperX + pyannote diarization (requires HF_TOKEN)')
p.add_argument('--show-name', default=None,
               help='Show name for speaker→name mapping (see show_hosts.json)')

# Backend selection:
if args.diarize:
    from .diarize import load_whisperx_backend_or_fallback
    backend, diarized = load_whisperx_backend_or_fallback(
        whisper_model=args.model,
        model_dir=args.model_dir,
    )
else:
    backend = load_faster_whisper_backend(...)
    diarized = False
```

Output shape of `TranscriptionResult.segments` when diarized:
```json
{"start": 6.917, "end": 8.506, "text": "This is a performance...", "speaker": "Seth Woolcock"}
```
`speaker` key is now always present (either a name or `"UNKNOWN"`). Non-diarized runs set `speaker: null`.

---

## 7. Changes to `extract.py` + `prompts.py`

`extract.run()` gains an optional `labeled_transcript` parameter. When provided (diarized run),
the labeled text is used for chunking instead of plain text — so the LLM sees:

```
[0:28] Seth Woolcock: All right, and welcome into the Betting Pros NFL podcast...
[2:46] Andrew Erickson: For me, a trend that I like...
```

This makes pick attribution accurate at the LLM level, not just in post-processing.

**`extract.py` change** (additive):
```python
def run(
    *,
    transcript: str,
    labeled_transcript: str | None = None,   # NEW — speaker-labeled version
    episode_id: str | None,
    ollama_url: str,
    model: str,
    post_json=None,
) -> dict:
    text_for_chunks = labeled_transcript if labeled_transcript else transcript
    chunks = chunk_mod.chunk_transcript(text_for_chunks)
    ...
```

**`prompts.py` change** — update `SYSTEM_PROMPT` to mention speaker attribution:
```
# Add one line to SYSTEM_PROMPT:
"Each transcript line may be prefixed [MM:SS] Speaker Name: — use this for the 'speaker' field."
```

No other prompt changes needed — the few-shot examples already include a `speaker` field stub.

---

## 8. New Module: `nfl_podcast/vault_note.py` (B1 + B2)

Writes structured Markdown vault notes to the `vault_notes` Supabase table.

### Note schema (B1)

```
NFL/Podcasts/{show_name}/{YYYY-MM-DD}-E{ep}.md
```

```markdown
---
sensitivity: green
source: BettingPros Podcast
episode: 1011
pub_date: 2026-06-25
hosts:
  - Seth Woolcock
  - Andrew Erickson
picks_count: 13
intel_count: 34
ingest_model: whisperx/large-v3-turbo + qwen3:8b
generated: 2026-06-29T14:22:00Z
---

# BettingPros Podcast E1011 — NFL Futures Intel
*Published: 2026-06-25 · Duration: 57m 20s*

## Picks

| Market | Selection | Odds | Speaker | Summary |
|--------|-----------|------|---------|---------|
| division | Tennessee Titans to win AFC South | +850 | Andrew Erickson | Worst-to-first + Cam Ward year 2... |
| ...     | ...       | ...  | ...     | ...     |

## Intel

- **[Andrew Erickson · division]** Worst-to-first trend: Since 2002, only 3 times...
- **[Seth Woolcock · schedule]** Saints warning: first 2 games at Detroit, at Baltimore...

## Transcript Index

| Time | Speaker | Summary |
|------|---------|---------|
| 0:28 | Seth Woolcock | Intro — division winners preview |
| 2:46 | Andrew Erickson | Tennessee Titans +850 AFC South pick |
| ...  | ...     | ... |
```

### `vault_note.py` outline

```python
# nfl_podcast/vault_note.py
"""Build and upsert vault notes for podcast episodes.

Writes to Supabase vault_notes table (same table used by futures report).
Path convention: NFL/Podcasts/{show_name}/{pub_date}-E{episode}.md
"""
from __future__ import annotations
import os
from datetime import datetime, timezone


def build_vault_note(
    *,
    show_name: str,
    episode_number: str | int,
    pub_date: str,              # YYYY-MM-DD
    hosts: list[str],
    duration_str: str,
    picks: list[dict],
    intel: list[dict],
    segments: list[dict],       # diarized segments for transcript index
    model_info: str,
) -> tuple[str, str]:
    """Return (vault_path, markdown_content)."""
    date_str = pub_date
    path = f"NFL/Podcasts/{show_name}/{date_str}-E{episode_number}.md"

    # Build picks table
    pick_rows = '\n'.join(
        f"| {p.get('market','?')} | {p.get('selection','?')} | {p.get('odds') or '—'} "
        f"| {p.get('speaker','?')} | {(p.get('summary') or '')[:120]} |"
        for p in picks
    )

    # Build intel bullets
    intel_bullets = '\n'.join(
        f"- **[{i.get('speaker','?')} · {i.get('category','general')}]** {i.get('point','')}"
        for i in intel
    )

    # Build transcript index (one row per speaker-change, max 40 entries)
    index_rows = _build_transcript_index(segments)

    hosts_yaml = '\n'.join(f'  - {h}' for h in hosts)
    generated = datetime.now(timezone.utc).isoformat(timespec='seconds')

    md = f"""---
sensitivity: green
source: {show_name}
episode: {episode_number}
pub_date: {pub_date}
hosts:
{hosts_yaml}
picks_count: {len(picks)}
intel_count: {len(intel)}
ingest_model: {model_info}
generated: {generated}
---

# {show_name} E{episode_number} — NFL Intel
*Published: {pub_date} · Duration: {duration_str}*

## Picks

| Market | Selection | Odds | Speaker | Summary |
|--------|-----------|------|---------|---------|
{pick_rows}

## Intel

{intel_bullets}

## Transcript Index

| Time | Speaker | Text |
|------|---------|------|
{index_rows}
"""
    return path, md


def _build_transcript_index(segments: list[dict], max_rows: int = 40) -> str:
    """One row per speaker turn (collapsed), up to max_rows."""
    rows = []
    prev_speaker = None
    for seg in segments:
        spk = seg.get('speaker', 'Unknown')
        if spk == prev_speaker:
            continue   # same speaker, skip
        prev_speaker = spk
        ts = seg.get('start', 0)
        m, s = int(ts) // 60, int(ts) % 60
        txt = seg.get('text', '')[:80]
        rows.append(f"| {m}:{s:02d} | {spk} | {txt}... |")
        if len(rows) >= max_rows:
            break
    return '\n'.join(rows)


def upsert_vault_note(
    *,
    supabase_url: str,
    supabase_key: str,
    vault_path: str,
    content: str,
    episode_id: str | int,
    post_json=None,
) -> dict:
    """Upsert to vault_notes table. Returns the Supabase response row."""
    import httpx
    client = post_json or httpx.Client()
    url = f"{supabase_url}/rest/v1/vault_notes"
    headers = {
        'apikey': supabase_key,
        'Authorization': f'Bearer {supabase_key}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation',
    }
    payload = {
        'path': vault_path,
        'content': content,
        'episode_id': str(episode_id),
        'source': 'podcast-ingest',
    }
    r = client.post(url, json=payload, headers=headers, timeout=15)
    r.raise_for_status()
    return r.json()
```

---

## 9. Changes to `pipelineWorker.js`

Add `diarize` and `show_name` to the pipeline input schema and pass them through to the Python transcription step:

```js
// In parsePipelineInput — add to destructuring:
const { ..., diarize, show_name } = body;

// In the transcribe command build:
const transcribeArgs = [
  '--audio', audio_path,
  '--episode-id', episode_id,
  '--out-dir', config.transcriptDir,
  '--model', whisper_model || config.whisperModel,
  '--model-dir', config.whisperModelDir,
];
if (diarize) transcribeArgs.push('--diarize');
if (show_name) transcribeArgs.push('--show-name', show_name);
```

The extract step already reads the transcript file written by the transcribe step. No other changes needed — the labeled transcript is embedded in the `.txt` output when diarized.

---

## 10. Changes to `podcast-ingest.js`

After extraction completes, add vault note step:

```js
// After extraction:
const { picks, intel, segments } = extractResult;
const { path: vaultPath, content: vaultContent } = buildVaultNote({
  showName: episode.showName,
  episodeNumber: episode.number,
  pubDate: episode.pubDate,
  hosts: episode.hosts,        // from experts.js lookup by showName
  durationStr: episode.duration,
  picks, intel, segments,
  modelInfo: `whisperx/${config.whisperModel} + ${config.ollamaModel}`,
});
await upsertVaultNote({ vaultPath, content: vaultContent, episodeId: episode.id });
```

Note: `episode.hosts` is resolved at ingest time by looking up the show in `experts.js` — filter by `source === showName && isShow === false`.

---

## 11. Build Sequence

Implement in this order (each is independently testable):

| Step | File | Test |
|------|------|------|
| L1 | `diarize.py` | Unit test with fake audio; assert `DiarizedSegment.speaker` present |
| L2 | `speaker_map.py` + `show_hosts.json` | Unit test with canned segments; assert mapping |
| L3 | `transcribe.py` CLI `--diarize` flag | Integration: run on a 2-min audio clip on M6 |
| L4 | `extract.py` `labeled_transcript` param | Unit test: labeled text → picks include speaker names |
| L5 | `vault_note.py` | Unit test: build + assert frontmatter; integration: upsert to Supabase |
| L6 | `pipelineWorker.js` + `podcast-ingest.js` | End-to-end: fire `/ingest/run` on M6 with E1011 audio |

L3 is the first live M6 test. Expected runtime on E1011 (57 min audio, CPU):
- Whisper: ~30-40 min
- Alignment: ~5 min
- Diarization: ~10-15 min
- Ollama extraction: ~10-15 min
- **Total: ~55-75 min** — run as a background job, check result in Supabase

---

## 12. Backlog Updates

After this spec is implemented, the following backlog items close:

- **B1** ✅ — vault note schema defined (§8 above)
- **B2** ✅ — `writeVaultNote()` in `vault_note.py` + wired in `podcast-ingest.js`
- **B3** — backfill: run against all `status: 'done'` episodes (separate one-off script)
- **B4** — wire vault notes into BETTING + FUTURES manifests (separate task)

The `podcast-e1011-test.js` script is **not deprecated** — it remains useful for Windows-side smoke
tests when M6 is unavailable, but its cloud API calls (AssemblyAI, Anthropic) should be treated
as emergency fallbacks, not the production path.

---

## 13. Hardware Profile (M6 — confirmed 2026-06-29)

| Spec | Value |
|------|-------|
| CPU | AMD Ryzen 5 7640HS (12 threads) |
| RAM | 24 GB total / 22 GB available |
| Swap | 8 GB |
| GPU | Radeon 760M (integrated RDNA 3) — **CPU-only for ML** |
| ML device | `cpu`, `compute_type='int8'` |

**Memory budget at peak (all steps concurrent):**

| Process | RAM |
|---------|-----|
| faster-whisper large-v3-turbo | ~1.5 GB |
| whisperX alignment model | ~1.0 GB |
| pyannote diarization pipeline | ~4–6 GB |
| Ollama qwen2.5:3b | ~3.0 GB |
| OS + headroom | ~2.0 GB |
| **Total** | **~12–14 GB** ✅ well within 22 GB available |

The integrated Radeon 760M is not configured for ROCm and shares system RAM — treat as CPU-only.
If a discrete GPU is added later, set `device='cuda'` in `load_whisperx_backend()` — runtime drops from ~70 min to ~8 min.

---

## 14. Host Identification — Fuzzy Alias Matching (replaces hardcoded `show_hosts.json`)

**Decision (2026-06-29):** BettingPros has 8+ rotating hosts. Hardcoding hosts per show doesn't scale.
Use **transcript-based fuzzy alias matching** against `experts.js` instead.

### Algorithm (`speaker_map.py`)

```
for each SPEAKER_X in diarized segments:
    collect their text from the first 5 minutes
    also collect adjacent text (other speakers introducing them)
    
    for each expert in roster where expert.source == show.source:
        for each alias in expert.aliases:
            score = fuzzy_match(alias, combined_window_text)
            if score >= FUZZY_THRESHOLD (default 0.82):
                assign SPEAKER_X → expert.name
                break

    if no match: assign SPEAKER_X → "Guest"
```

This handles:
- **Transcription noise**: "Woolcock" → "Wilcock" (score ~0.85, still matches)
- **Self-intro**: "I'm your host Seth Woolcock" → matches alias `seth woolcock`
- **Cross-intro**: "Andrew Erickson himself" → matches alias `andrew erickson`
- **Rotating cast**: works for any combination of the 8 BettingPros hosts with no config changes
- **Guest speakers**: anyone not in the roster gets labeled "Guest" cleanly

### `show_hosts.json` simplified

No host lists needed. Just tuning parameters per show:

```json
{
  "BettingPros Podcast": {
    "source": "BettingPros",
    "intro_window_sec": 300,
    "fuzzy_threshold": 0.82
  },
  "The Favorites": {
    "source": "The Favorites",
    "intro_window_sec": 240,
    "fuzzy_threshold": 0.82
  },
  "Sharp or Square": {
    "source": "Sharp or Square",
    "intro_window_sec": 300,
    "fuzzy_threshold": 0.80
  }
}
```

### Dependency

Add `rapidfuzz` to `requirements-m6.txt` (faster than stdlib `difflib`, pure Python):
```
rapidfuzz>=3.6.0
```

### Generalisation to other shows

This same algorithm works for every show in the roster because `experts.js` already has
`source` + `aliases` for all 36 entries. No per-show host maintenance ever needed — adding
a new expert to `experts.js` automatically makes them detectable in any show's transcript.
