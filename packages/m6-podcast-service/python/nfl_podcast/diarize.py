"""Transcription + pyannote speaker diarization backend (L1).

Uses faster-whisper (NOT the whisperX PyPI package -- unusable) + pyannote.audio directly.
Returns DiarizedSegments with speaker labels assigned by temporal overlap.

Satisfies the WhisperBackend protocol so transcribe.py needs no changes for L1.
Speaker passthrough into TranscriptionResult.segments is wired in L3 (transcribe.py CLI).

Environment variables:
  HF_TOKEN              -- HuggingFace fine-grained read token (m6-whisperx)
  WHISPERX_DIARIZE      -- set to 'true' to enable diarization (default: false)

PLDA patch reminder: must re-apply after any .venv-whisperx rebuild.
  See docs/LOCAL_PIPELINE_SPEC.md §3c.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

from .transcribe import WhisperSegment, load_faster_whisper_backend


# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class DiarizedSegment(WhisperSegment):
    """WhisperSegment extended with a pyannote speaker label.

    speaker examples: 'SPEAKER_00', 'SPEAKER_01', 'UNKNOWN'
    After L2 speaker_map.py resolves names: 'Seth Woolcock', 'Guest', etc.
    """
    speaker: str = field(default='UNKNOWN')


# ---------------------------------------------------------------------------
# Speaker assignment
# ---------------------------------------------------------------------------

def _assign_speakers(
    segments: list,
    diarization,
) -> list:
    """Assign each segment to the pyannote speaker with the most temporal overlap.

    Args:
        segments: list of {start, end, text} dicts from faster-whisper.
        diarization: pyannote Annotation (result of Pipeline.__call__).

    Returns:
        Same list with 'speaker' key added to each entry ('UNKNOWN' if no overlap).
    """
    # Materialise the turn list once (itertracks is a generator)
    turns = [
        (turn.start, turn.end, speaker)
        for turn, _, speaker in diarization.itertracks(yield_label=True)
    ]

    out = []
    for seg in segments:
        s_start = seg['start']
        s_end = seg['end']
        best_speaker = 'UNKNOWN'
        best_overlap = 0.0

        for t_start, t_end, speaker in turns:
            # Fast skip: turn ends before segment starts, or starts after segment ends
            if t_end <= s_start or t_start >= s_end:
                continue
            overlap = min(s_end, t_end) - max(s_start, t_start)
            if overlap > best_overlap:
                best_overlap = overlap
                best_speaker = speaker

        out.append(dict(seg, speaker=best_speaker))

    return out


# ---------------------------------------------------------------------------
# Backend
# ---------------------------------------------------------------------------

def load_whisperx_backend(
    *,
    whisper_model='large-v3-turbo',
    model_dir='/var/lib/nfl/models',
    hf_token=None,
    device='cpu',
    compute_type='int8',
    language='en',
    beam_size=5,
    vad_filter=True,
):
    """Build a diarization-aware backend.

    Uses faster-whisper for transcription and pyannote.audio for diarization.
    Imports are deferred so callers without GPU deps can import this module freely.

    Returns an object satisfying WhisperBackend (has .transcribe(audio_path) method)
    that yields DiarizedSegment instances.

    Raises:
        RuntimeError: if HF_TOKEN is missing.
        ImportError: if faster_whisper or pyannote.audio are not installed.
    """
    from faster_whisper import WhisperModel
    from pyannote.audio import Pipeline

    token = hf_token or os.environ.get('HF_TOKEN')
    if not token:
        raise RuntimeError(
            'HF_TOKEN is required for pyannote diarization. '
            'Set it in .env or pass hf_token= explicitly.'
        )

    model_path = Path(model_dir) / whisper_model
    asr = WhisperModel(
        str(model_path) if model_path.exists() else whisper_model,
        device=device,
        compute_type=compute_type,
        download_root=str(model_dir),
    )

    # token= is the pyannote 4.x API (use_auth_token= was removed in 4.0)
    diarize_pipeline = Pipeline.from_pretrained(
        'pyannote/speaker-diarization-3.0',
        token=token,
    )

    class _WhisperXBackend:
        def transcribe(self, audio_path):
            path = str(audio_path)

            # 1. Transcribe with faster-whisper
            raw_segments, _info = asr.transcribe(
                path,
                beam_size=beam_size,
                language=language,
                vad_filter=vad_filter,
            )
            segs = [
                {'start': float(s.start), 'end': float(s.end), 'text': s.text.strip()}
                for s in raw_segments
                if s.text.strip()
            ]

            # 2. Diarize -- pre-load audio via torchaudio to bypass torchcodec
            # (torchcodec requires CUDA runtime; torchaudio works on CPU-only boxes)
            import torchaudio  # noqa: WPS433
            waveform, sample_rate = torchaudio.load(path)
            if waveform.shape[0] > 1:
                waveform = waveform.mean(dim=0, keepdim=True)
            diarization = diarize_pipeline({"waveform": waveform, "sample_rate": sample_rate})

            # 3. Assign speakers by temporal overlap
            labeled = _assign_speakers(segs, diarization)

            # 4. Yield DiarizedSegments
            for seg in labeled:
                yield DiarizedSegment(
                    start=seg['start'],
                    end=seg['end'],
                    text=seg['text'],
                    speaker=seg.get('speaker', 'UNKNOWN'),
                )

    return _WhisperXBackend()


def load_whisperx_backend_or_fallback(
    *,
    whisper_model='large-v3-turbo',
    model_dir='/var/lib/nfl/models',
    hf_token=None,
    device='cpu',
    compute_type='int8',
):
    """Return (backend, diarized) -- diarized=True only when diarization is active.

    Diarization is enabled only when BOTH:
      - HF_TOKEN is set (or hf_token= passed explicitly)
      - WHISPERX_DIARIZE=true in env

    If either is absent, or if faster_whisper / pyannote are not installed,
    falls back to the plain faster-whisper backend (diarized=False).
    """
    token = hf_token or os.environ.get('HF_TOKEN')
    diarize_enabled = os.environ.get('WHISPERX_DIARIZE', 'false').lower() == 'true'

    if token and diarize_enabled:
        try:
            backend = load_whisperx_backend(
                whisper_model=whisper_model,
                model_dir=model_dir,
                hf_token=token,
                device=device,
                compute_type=compute_type,
            )
            return backend, True
        except ImportError:
            pass  # faster_whisper or pyannote not installed -- fall through

    return (
        load_faster_whisper_backend(
            model_name=whisper_model,
            model_dir=model_dir,
            compute_type=compute_type,
        ),
        False,
    )


__all__ = [
    'DiarizedSegment',
    'load_whisperx_backend',
    'load_whisperx_backend_or_fallback',
    '_assign_speakers',
]
